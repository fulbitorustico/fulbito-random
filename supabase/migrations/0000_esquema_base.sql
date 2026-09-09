-- ============================================================
-- 0000 — ESQUEMA BASE
--
-- El punto de partida de la base, tal como estaba el 9 de septiembre de 2026
-- con las migraciones 0001 a 0013 ya aplicadas. Correr este archivo sobre una
-- base vacía deja el esquema completo; después van las migraciones nuevas,
-- de la 0014 en adelante.
--
-- Generado desde el catálogo de Postgres con la herramienta que está en esta
-- misma carpeta, y ordenado a mano para que se pueda correr de una:
--   · `generar_token_partido` va primero porque `partidos.token` la usa
--     como valor por defecto.
--   · Las funciones van antes que las políticas, porque varias políticas
--     las llaman.
--   · `check_function_bodies = off` evita tener que ordenar las funciones
--     entre sí. Es lo mismo que hace pg_dump.
--
-- LO QUE NO ESTÁ ACÁ Y HAY QUE RECORDAR:
--   · El bucket de Storage `avatares` (las fotos de perfil).
--   · El disparador de eventos que engancha `rls_auto_enable`.
--   · La configuración de Auth: proveedores, plantillas de mail, SMTP.
--   · Los datos. Esto es la forma de la base, no su contenido.
-- ============================================================

set check_function_bodies = off;


-- ============================================================
-- 1. La función que usan los valores por defecto
-- ============================================================

create or replace function public.generar_token_partido()
 returns text
 language sql
as $function$
  select replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-');
$function$;


-- ============================================================
-- 2. Tablas
-- ============================================================

create table if not exists public.jugadores (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  nombre text not null,
  apodo text,
  posicion text,
  foto_url text,
  created_at timestamp with time zone default now(),
  avatar text,
  posiciones text[],
  cambios_posiciones integer not null default 0,
  buscando boolean not null default false,
  zona text,
  bio text,
  disponibilidad text[],
  invitado_por_id uuid,
  es_demo boolean not null default false,
  avisos_mail jsonb not null default '{"completo": true, "se_suman": false, "invitacion": true, "aprobado_grupo": true}'::jsonb,
  cambios_nombre integer not null default 0,
  es_admin boolean not null default false
);

create table if not exists public.grupos (
  id uuid not null default gen_random_uuid(),
  nombre text not null,
  creador_id uuid,
  created_at timestamp with time zone default now(),
  requiere_aprobacion boolean not null default false
);

create table if not exists public.canchas (
  id uuid not null default gen_random_uuid(),
  nombre text not null,
  direccion text,
  zona text,
  lat numeric,
  lng numeric,
  tipo text,
  techada boolean,
  dueno_id uuid,
  creada_por_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.partidos (
  id uuid not null default gen_random_uuid(),
  cancha text not null,
  fecha_hora timestamp with time zone not null,
  cupo_total integer not null,
  admin_id uuid,
  estado text not null default 'abierto'::text,
  created_at timestamp with time zone default now(),
  lat double precision,
  lng double precision,
  valor_cancha numeric,
  apertura text not null default 'abierto'::text,
  grupo_id uuid,
  usa_equipos boolean not null default false,
  subcapitan_id uuid,
  cancha_id uuid,
  mapa_url text,
  token text default generar_token_partido(),
  nota text,
  goles_a integer,
  goles_b integer
);

create table if not exists public.participantes (
  id uuid not null default gen_random_uuid(),
  partido_id uuid,
  jugador_id uuid,
  created_at timestamp with time zone default now(),
  equipo text,
  confirmado_at timestamp with time zone
);

create table if not exists public.bajas (
  id uuid not null default gen_random_uuid(),
  partido_id uuid,
  jugador_id uuid,
  horas_antes numeric,
  created_at timestamp with time zone default now(),
  era_capitan boolean not null default false
);

create table if not exists public.bloqueos (
  bloqueador_id uuid not null,
  bloqueado_id uuid not null,
  motivo text,
  created_at timestamp with time zone default now()
);

create table if not exists public.goles (
  id uuid not null default gen_random_uuid(),
  partido_id uuid not null,
  jugador_id uuid not null,
  cantidad integer not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.grupo_miembros (
  id uuid not null default gen_random_uuid(),
  grupo_id uuid,
  jugador_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.solicitudes_grupo (
  id uuid not null default gen_random_uuid(),
  grupo_id uuid,
  jugador_id uuid,
  estado text not null default 'pendiente'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.insignias_otorgadas (
  id uuid not null default gen_random_uuid(),
  partido_id uuid,
  otorgado_por_id uuid,
  jugador_id uuid,
  insignia text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.invitaciones (
  id uuid not null default gen_random_uuid(),
  partido_id uuid,
  invitado_id uuid,
  invitado_por_id uuid,
  estado text not null default 'pendiente'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.jugadores_ubicacion (
  jugador_id uuid not null,
  lat_aprox numeric,
  lng_aprox numeric,
  actualizado_at timestamp with time zone default now()
);

create table if not exists public.logros_vistos (
  jugador_id uuid not null,
  objetivo text not null,
  visto_at timestamp with time zone default now()
);

create table if not exists public.mvp_votos (
  id uuid not null default gen_random_uuid(),
  partido_id uuid,
  votante_id uuid,
  votado_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.reacciones_partido (
  id uuid not null default gen_random_uuid(),
  partido_id uuid not null,
  jugador_id uuid not null,
  emoji text not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.sugerencias (
  id uuid not null default gen_random_uuid(),
  jugador_id uuid,
  texto text not null,
  pantalla text,
  estado text not null default 'nueva'::text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.valoraciones (
  id uuid not null default gen_random_uuid(),
  partido_id uuid,
  evaluador_id uuid,
  evaluado_id uuid,
  estrellas integer not null,
  comentario text,
  created_at timestamp with time zone default now()
);

create table if not exists public.valoraciones_cancha (
  id uuid not null default gen_random_uuid(),
  cancha_id uuid,
  partido_id uuid,
  jugador_id uuid,
  cesped integer,
  iluminacion integer,
  vestuarios integer,
  estacionamiento integer,
  personal integer,
  comentario text,
  created_at timestamp with time zone default now()
);


-- ============================================================
-- 3. Claves, unicidad y chequeos
-- ============================================================

alter table public.jugadores add constraint jugadores_pkey primary key (id);
alter table public.jugadores add constraint jugadores_user_id_key unique (user_id);
alter table public.jugadores add constraint jugadores_user_id_fkey foreign key (user_id) references auth.users(id);
alter table public.jugadores add constraint jugadores_invitado_por_id_fkey foreign key (invitado_por_id) references jugadores(id) on delete set null;
alter table public.jugadores add constraint jugadores_textos_razonables check ((((char_length(nombre) >= 1) AND (char_length(nombre) <= 40)) AND ((apodo IS NULL) OR (char_length(apodo) <= 24)) AND ((bio IS NULL) OR ((char_length(bio) <= 300) AND (bio !~* '(https?://|www\.)'::text)))));

alter table public.grupos add constraint grupos_pkey primary key (id);
alter table public.grupos add constraint grupos_creador_id_fkey foreign key (creador_id) references jugadores(id);

alter table public.canchas add constraint canchas_pkey primary key (id);
alter table public.canchas add constraint canchas_creada_por_id_fkey foreign key (creada_por_id) references jugadores(id) on delete set null;
alter table public.canchas add constraint canchas_dueno_id_fkey foreign key (dueno_id) references jugadores(id) on delete set null;

alter table public.partidos add constraint partidos_pkey primary key (id);
alter table public.partidos add constraint partidos_admin_id_fkey foreign key (admin_id) references jugadores(id);
alter table public.partidos add constraint partidos_subcapitan_id_fkey foreign key (subcapitan_id) references jugadores(id) on delete set null;
alter table public.partidos add constraint partidos_grupo_id_fkey foreign key (grupo_id) references grupos(id);
alter table public.partidos add constraint partidos_cancha_id_fkey foreign key (cancha_id) references canchas(id) on delete set null;
alter table public.partidos add constraint partidos_estado_check check ((estado = ANY (ARRAY['abierto'::text, 'cerrado'::text, 'cancelado'::text])));
alter table public.partidos add constraint partidos_cupo_razonable check (((cupo_total >= 2) AND (cupo_total <= 30)));
alter table public.partidos add constraint partidos_valor_razonable check (((valor_cancha IS NULL) OR ((valor_cancha >= (0)::numeric) AND (valor_cancha <= (2000000)::numeric))));
alter table public.partidos add constraint partidos_cancha_largo check (((char_length(cancha) >= 1) AND (char_length(cancha) <= 120)));
alter table public.partidos add constraint partidos_goles_razonables check ((((goles_a IS NULL) OR ((goles_a >= 0) AND (goles_a <= 99))) AND ((goles_b IS NULL) OR ((goles_b >= 0) AND (goles_b <= 99)))));
alter table public.partidos add constraint partidos_nota_razonable check (((nota IS NULL) OR ((char_length(nota) <= 400) AND (nota !~* '(https?://|www\.)'::text))));
alter table public.partidos add constraint partidos_mapa_url_sano check (((mapa_url IS NULL) OR ((char_length(mapa_url) <= 500) AND (mapa_url ~* '^https://[a-z0-9.-]*(google\.[a-z.]+|goo\.gl)/'::text))));

alter table public.participantes add constraint participantes_pkey primary key (id);
alter table public.participantes add constraint participantes_partido_id_jugador_id_key unique (partido_id, jugador_id);
alter table public.participantes add constraint participantes_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.participantes add constraint participantes_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;

alter table public.bajas add constraint bajas_pkey primary key (id);
alter table public.bajas add constraint bajas_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.bajas add constraint bajas_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;

alter table public.bloqueos add constraint bloqueos_pkey primary key (bloqueador_id, bloqueado_id);
alter table public.bloqueos add constraint bloqueos_bloqueador_id_fkey foreign key (bloqueador_id) references jugadores(id) on delete cascade;
alter table public.bloqueos add constraint bloqueos_bloqueado_id_fkey foreign key (bloqueado_id) references jugadores(id) on delete cascade;

alter table public.goles add constraint goles_pkey primary key (id);
alter table public.goles add constraint goles_partido_id_jugador_id_key unique (partido_id, jugador_id);
alter table public.goles add constraint goles_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.goles add constraint goles_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;
alter table public.goles add constraint goles_cantidad_razonable check (((cantidad > 0) AND (cantidad <= 99)));

alter table public.grupo_miembros add constraint grupo_miembros_pkey primary key (id);
alter table public.grupo_miembros add constraint grupo_miembros_grupo_id_jugador_id_key unique (grupo_id, jugador_id);
alter table public.grupo_miembros add constraint grupo_miembros_grupo_id_fkey foreign key (grupo_id) references grupos(id) on delete cascade;
alter table public.grupo_miembros add constraint grupo_miembros_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;

alter table public.solicitudes_grupo add constraint solicitudes_grupo_pkey primary key (id);
alter table public.solicitudes_grupo add constraint solicitudes_grupo_grupo_id_jugador_id_key unique (grupo_id, jugador_id);
alter table public.solicitudes_grupo add constraint solicitudes_grupo_grupo_id_fkey foreign key (grupo_id) references grupos(id) on delete cascade;
alter table public.solicitudes_grupo add constraint solicitudes_grupo_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;

alter table public.insignias_otorgadas add constraint insignias_otorgadas_pkey primary key (id);
alter table public.insignias_otorgadas add constraint insignias_otorgadas_partido_id_otorgado_por_id_jugador_id_key unique (partido_id, otorgado_por_id, jugador_id);
alter table public.insignias_otorgadas add constraint insignias_otorgadas_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.insignias_otorgadas add constraint insignias_otorgadas_otorgado_por_id_fkey foreign key (otorgado_por_id) references jugadores(id) on delete cascade;
alter table public.insignias_otorgadas add constraint insignias_otorgadas_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;

alter table public.invitaciones add constraint invitaciones_pkey primary key (id);
alter table public.invitaciones add constraint invitaciones_partido_id_invitado_id_key unique (partido_id, invitado_id);
alter table public.invitaciones add constraint invitaciones_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.invitaciones add constraint invitaciones_invitado_id_fkey foreign key (invitado_id) references jugadores(id) on delete cascade;
alter table public.invitaciones add constraint invitaciones_invitado_por_id_fkey foreign key (invitado_por_id) references jugadores(id) on delete cascade;

alter table public.jugadores_ubicacion add constraint jugadores_ubicacion_pkey primary key (jugador_id);
alter table public.jugadores_ubicacion add constraint jugadores_ubicacion_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;

alter table public.logros_vistos add constraint logros_vistos_pkey primary key (jugador_id, objetivo);
alter table public.logros_vistos add constraint logros_vistos_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;

alter table public.mvp_votos add constraint mvp_votos_pkey primary key (id);
alter table public.mvp_votos add constraint mvp_votos_partido_id_votante_id_key unique (partido_id, votante_id);
alter table public.mvp_votos add constraint mvp_votos_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.mvp_votos add constraint mvp_votos_votante_id_fkey foreign key (votante_id) references jugadores(id) on delete cascade;
alter table public.mvp_votos add constraint mvp_votos_votado_id_fkey foreign key (votado_id) references jugadores(id) on delete cascade;

alter table public.reacciones_partido add constraint reacciones_partido_pkey primary key (id);
alter table public.reacciones_partido add constraint reacciones_partido_partido_id_jugador_id_emoji_key unique (partido_id, jugador_id, emoji);
alter table public.reacciones_partido add constraint reacciones_partido_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.reacciones_partido add constraint reacciones_partido_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;
alter table public.reacciones_partido add constraint reacciones_emoji_corto check (((char_length(emoji) >= 1) AND (char_length(emoji) <= 8)));

alter table public.sugerencias add constraint sugerencias_pkey primary key (id);
alter table public.sugerencias add constraint sugerencias_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete set null;
alter table public.sugerencias add constraint sugerencias_texto_razonable check (((char_length(texto) >= 3) AND (char_length(texto) <= 1000)));
alter table public.sugerencias add constraint sugerencias_estado_valido check ((estado = ANY (ARRAY['nueva'::text, 'vista'::text, 'hecha'::text, 'descartada'::text])));

alter table public.valoraciones add constraint valoraciones_pkey primary key (id);
alter table public.valoraciones add constraint valoraciones_partido_id_evaluador_id_evaluado_id_key unique (partido_id, evaluador_id, evaluado_id);
alter table public.valoraciones add constraint valoraciones_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.valoraciones add constraint valoraciones_evaluador_id_fkey foreign key (evaluador_id) references jugadores(id);
alter table public.valoraciones add constraint valoraciones_evaluado_id_fkey foreign key (evaluado_id) references jugadores(id);
alter table public.valoraciones add constraint valoraciones_estrellas_check check (((estrellas >= 1) AND (estrellas <= 5)));
alter table public.valoraciones add constraint valoraciones_comentario_sano check (((comentario IS NULL) OR ((char_length(comentario) <= 500) AND (comentario !~* '(https?://|www\.)'::text))));

alter table public.valoraciones_cancha add constraint valoraciones_cancha_pkey primary key (id);
alter table public.valoraciones_cancha add constraint valoraciones_cancha_partido_id_jugador_id_key unique (partido_id, jugador_id);
alter table public.valoraciones_cancha add constraint valoraciones_cancha_cancha_id_fkey foreign key (cancha_id) references canchas(id) on delete cascade;
alter table public.valoraciones_cancha add constraint valoraciones_cancha_partido_id_fkey foreign key (partido_id) references partidos(id) on delete cascade;
alter table public.valoraciones_cancha add constraint valoraciones_cancha_jugador_id_fkey foreign key (jugador_id) references jugadores(id) on delete cascade;
alter table public.valoraciones_cancha add constraint valoraciones_cancha_cesped_check check (((cesped >= 1) AND (cesped <= 5)));
alter table public.valoraciones_cancha add constraint valoraciones_cancha_iluminacion_check check (((iluminacion >= 1) AND (iluminacion <= 5)));
alter table public.valoraciones_cancha add constraint valoraciones_cancha_vestuarios_check check (((vestuarios >= 1) AND (vestuarios <= 5)));
alter table public.valoraciones_cancha add constraint valoraciones_cancha_estacionamiento_check check (((estacionamiento >= 1) AND (estacionamiento <= 5)));
alter table public.valoraciones_cancha add constraint valoraciones_cancha_personal_check check (((personal >= 1) AND (personal <= 5)));


-- ============================================================
-- 4. Índices propios
-- ============================================================

create unique index if not exists canchas_sin_duplicados on public.canchas using btree (lower(nombre), round(lat, 3), round(lng, 3));
create unique index if not exists partidos_token_unico on public.partidos using btree (token);


-- ============================================================
-- 5. Seguridad por fila, en las 19 tablas
-- ============================================================

alter table public.bajas enable row level security;
alter table public.bloqueos enable row level security;
alter table public.canchas enable row level security;
alter table public.goles enable row level security;
alter table public.grupo_miembros enable row level security;
alter table public.grupos enable row level security;
alter table public.insignias_otorgadas enable row level security;
alter table public.invitaciones enable row level security;
alter table public.jugadores enable row level security;
alter table public.jugadores_ubicacion enable row level security;
alter table public.logros_vistos enable row level security;
alter table public.mvp_votos enable row level security;
alter table public.participantes enable row level security;
alter table public.partidos enable row level security;
alter table public.reacciones_partido enable row level security;
alter table public.solicitudes_grupo enable row level security;
alter table public.sugerencias enable row level security;
alter table public.valoraciones enable row level security;
alter table public.valoraciones_cancha enable row level security;


-- ============================================================
-- 6. Funciones
--
-- Van antes que las políticas porque varias políticas las llaman:
-- `puede_sumarse_al_partido`, `capitan_suspendido` y `tengo_acceso_al_partido`.
-- ============================================================

create or replace function public.bajas_tardias_por_jugador()
 returns table(jugador_id uuid, cantidad bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select jugador_id, count(*) as cantidad
  from bajas
  where horas_antes < 0.75
  group by jugador_id;
$function$;

create or replace function public.valoraciones_promedio()
 returns table(evaluado_id uuid, promedio numeric, cantidad bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  with visibles as (
    -- La ventana para valorar dura 24hs desde que arranca el partido.
    -- Hasta que no cierra, ninguna valoración de ese partido se cuenta.
    select v.*
    from valoraciones v
    join partidos p on p.id = v.partido_id
    where p.fecha_hora + interval '24 hours' < now()
  ),
  por_jugador as (
    -- todos los jugadores, incluso los que todavía no recibieron ninguna
    select
      j.id as evaluado_id,
      coalesce(avg(v.estrellas)::numeric, 0) as promedio_real,
      count(v.id) as cantidad
    from jugadores j
    left join visibles v on v.evaluado_id = j.id
    group by j.id
  )
  select
    p.evaluado_id,
    round(
      case
        when p.cantidad >= 3 then p.promedio_real
        else (p.promedio_real * p.cantidad + 3.0 * (3 - p.cantidad)) / 3
      end,
      2
    ) as promedio,
    p.cantidad
  from por_jugador p;
$function$;

create or replace function public.distribucion_valoraciones(p_evaluado_id uuid)
 returns table(estrellas integer, cantidad bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select gs.estrellas, count(v.id) as cantidad
  from generate_series(1, 5) as gs(estrellas)
  left join valoraciones v
    on v.evaluado_id = p_evaluado_id
   and v.estrellas = gs.estrellas
   and exists (
     select 1 from partidos p
     where p.id = v.partido_id and p.fecha_hora + interval '24 hours' < now()
   )
  group by gs.estrellas
  order by gs.estrellas desc;
$function$;

create or replace function public.comentarios_recibidos(p_evaluado_id uuid)
 returns table(comentario text, created_at timestamp with time zone)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select v.comentario, v.created_at
  from valoraciones v
  join partidos p on p.id = v.partido_id
  where v.evaluado_id = p_evaluado_id
    and v.comentario is not null
    and v.comentario <> ''
    and p.fecha_hora + interval '24 hours' < now()
  order by v.created_at desc
  limit 5;
$function$;

create or replace function public.evolucion_jugador(p_jugador_id uuid)
 returns table(mes text, promedio numeric, cantidad bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select
    to_char(date_trunc('month', p.fecha_hora), 'YYYY-MM') as mes,
    round(avg(v.estrellas)::numeric, 2) as promedio,
    count(*) as cantidad
  from valoraciones v
  join partidos p on p.id = v.partido_id
  where v.evaluado_id = p_jugador_id
    and p.fecha_hora + interval '24 hours' < now()
    and p.fecha_hora > now() - interval '12 months'
  group by 1
  order by 1;
$function$;

create or replace function public.insignias_por_jugador(p_jugador_id uuid)
 returns table(insignia text, cantidad bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select insignia, count(*) as cantidad
  from insignias_otorgadas
  where jugador_id = p_jugador_id
  group by insignia
  order by cantidad desc;
$function$;

create or replace function public.reclutas_por_jugador(p_jugador_id uuid)
 returns bigint
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select count(*) from jugadores where invitado_por_id = p_jugador_id;
$function$;

create or replace function public.goles_por_jugador(p_jugador_id uuid)
 returns bigint
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select coalesce(sum(g.cantidad), 0)::bigint
  from goles g
  join partidos p on p.id = g.partido_id
  where g.jugador_id = p_jugador_id and p.estado <> 'cancelado';
$function$;

create or replace function public.mvp_del_partido(p_partido_id uuid)
 returns table(jugador_id uuid, nombre text, apodo text, avatar text, foto_url text, votos bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select j.id, j.nombre, j.apodo, j.avatar, j.foto_url, count(v.id) as votos
  from mvp_votos v
  join jugadores j on j.id = v.votado_id
  where v.partido_id = p_partido_id
  group by j.id, j.nombre, j.apodo, j.avatar, j.foto_url
  order by votos desc, j.nombre
  limit 3;
$function$;

create or replace function public.grupo_publico_info(p_grupo_id uuid)
 returns table(nombre text)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select nombre from grupos where id = p_grupo_id;
$function$;

create or replace function public.grupo_publico_miembros(p_grupo_id uuid)
 returns table(jugador_id uuid, nombre text, apodo text, avatar text, foto_url text, promedio numeric, cantidad bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select
    j.id as jugador_id,
    j.nombre,
    j.apodo,
    j.avatar,
    j.foto_url,
    vp.promedio,
    coalesce(vp.cantidad, 0) as cantidad
  from grupo_miembros gm
  join jugadores j on j.id = gm.jugador_id
  left join valoraciones_promedio() vp on vp.evaluado_id = j.id
  where gm.grupo_id = p_grupo_id
  order by j.nombre;
$function$;

create or replace function public.cancha_resumen(p_cancha_id uuid)
 returns table(cesped numeric, iluminacion numeric, vestuarios numeric, estacionamiento numeric, personal numeric, general numeric, valoraciones bigint, partidos_jugados bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select
    round(avg(v.cesped)::numeric, 1),
    round(avg(v.iluminacion)::numeric, 1),
    round(avg(v.vestuarios)::numeric, 1),
    round(avg(v.estacionamiento)::numeric, 1),
    round(avg(v.personal)::numeric, 1),
    round(avg((
      coalesce(v.cesped, 0) + coalesce(v.iluminacion, 0) + coalesce(v.vestuarios, 0)
      + coalesce(v.estacionamiento, 0) + coalesce(v.personal, 0)
    )::numeric / nullif(
      (case when v.cesped is null then 0 else 1 end)
      + (case when v.iluminacion is null then 0 else 1 end)
      + (case when v.vestuarios is null then 0 else 1 end)
      + (case when v.estacionamiento is null then 0 else 1 end)
      + (case when v.personal is null then 0 else 1 end), 0)), 1),
    count(v.id),
    (select count(*) from partidos p where p.cancha_id = p_cancha_id and p.fecha_hora < now())
  from valoraciones_cancha v
  where v.cancha_id = p_cancha_id;
$function$;

create or replace function public.canchas_con_uso()
 returns table(id uuid, nombre text, zona text, tipo text, lat numeric, lng numeric, partidos bigint, general numeric, valoraciones bigint)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select
    c.id,
    c.nombre,
    c.zona,
    c.tipo,
    c.lat,
    c.lng,
    (select count(*) from partidos p where p.cancha_id = c.id),
    (select general from cancha_resumen(c.id)),
    (select valoraciones from cancha_resumen(c.id))
  from canchas c
  order by (select count(*) from partidos p where p.cancha_id = c.id) desc, c.nombre;
$function$;

create or replace function public.comentarios_cancha(p_cancha_id uuid)
 returns table(comentario text, created_at timestamp with time zone)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select comentario, created_at
  from valoraciones_cancha
  where cancha_id = p_cancha_id and comentario is not null and length(trim(comentario)) > 0
  order by created_at desc
  limit 20;
$function$;

create or replace function public.buscar_o_crear_cancha(p_nombre text, p_lat numeric, p_lng numeric, p_zona text default null::text)
 returns uuid
 language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
declare
  v_id uuid;
  v_yo uuid;
begin
  select id into v_yo from jugadores where user_id = auth.uid();

  select id into v_id
  from canchas
  where lower(nombre) = lower(trim(p_nombre))
    and round(lat::numeric, 3) = round(p_lat::numeric, 3)
    and round(lng::numeric, 3) = round(p_lng::numeric, 3)
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  insert into canchas (nombre, lat, lng, zona, creada_por_id)
  values (trim(p_nombre), p_lat, p_lng, p_zona, v_yo)
  returning id into v_id;

  return v_id;
end;
$function$;

create or replace function public.jugadores_disponibles(p_lat numeric, p_lng numeric, p_km integer default 10, p_posicion text default null::text)
 returns table(jugador_id uuid, nombre text, apodo text, avatar text, foto_url text, posiciones text[], zona text, bio text, disponibilidad text[], promedio numeric, cantidad bigint, distancia_km numeric)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  with yo as (
    select id from jugadores where user_id = auth.uid()
  ),
  candidatos as (
    select
      j.*,
      case
        when p_lat is null or u.lat_aprox is null then null
        else 6371 * 2 * asin(sqrt(
          power(sin(radians(u.lat_aprox - p_lat) / 2), 2)
          + cos(radians(p_lat)) * cos(radians(u.lat_aprox))
            * power(sin(radians(u.lng_aprox - p_lng) / 2), 2)
        ))
      end as dist
    from jugadores j
    left join jugadores_ubicacion u on u.jugador_id = j.id
    where j.buscando = true
      and j.id <> (select id from yo)
      and not exists (
        select 1 from bloqueos b
        where (b.bloqueador_id = (select id from yo) and b.bloqueado_id = j.id)
           or (b.bloqueado_id = (select id from yo) and b.bloqueador_id = j.id)
      )
  )
  select
    c.id as jugador_id,
    c.nombre,
    c.apodo,
    c.avatar,
    c.foto_url,
    c.posiciones,
    c.zona,
    c.bio,
    c.disponibilidad,
    vp.promedio,
    coalesce(vp.cantidad, 0) as cantidad,
    round(c.dist::numeric, 1) as distancia_km
  from candidatos c
  left join valoraciones_promedio() vp on vp.evaluado_id = c.id
  where (p_posicion is null or p_posicion = any(c.posiciones))
    and (c.dist is null or c.dist <= p_km)
  order by c.dist nulls last, c.nombre;
$function$;

create or replace function public.partidos_con_cupo()
 returns table(partido jsonb, anotados bigint, yo_anotado boolean)
 language sql stable
as $function$
  with yo as (
    select id from jugadores where user_id = auth.uid()
  )
  select
    to_jsonb(p) || jsonb_build_object('grupo_nombre', g.nombre),
    (select count(*) from participantes pa where pa.partido_id = p.id),
    exists (
      select 1 from participantes pa
      where pa.partido_id = p.id and pa.jugador_id = (select id from yo)
    )
  from partidos p
  left join grupos g on g.id = p.grupo_id
  where p.estado <> 'cancelado'
  order by p.fecha_hora;
$function$;

create or replace function public.puede_sumarse_al_partido(p_partido_id uuid, p_jugador_id uuid)
 returns boolean
 language sql stable security definer set search_path to 'public'
as $function$
  select exists (
    select 1
    from partidos p
    where p.id = p_partido_id
      and coalesce(p.estado, 'abierto') = 'abierto'
      and p.fecha_hora > now() - interval '1 hour'
      and (select count(*) from participantes pa where pa.partido_id = p.id) < p.cupo_total
      and (
        p.grupo_id is null
        or exists (
          select 1 from grupo_miembros gm
          where gm.grupo_id = p.grupo_id and gm.jugador_id = p_jugador_id
        )
        or exists (
          select 1 from invitaciones i
          where i.partido_id = p.id and i.invitado_id = p_jugador_id and i.estado = 'pendiente'
        )
      )
      and (
        coalesce(p.apertura, 'abierto') <> 'solo_confiables'
        or p.admin_id = p_jugador_id
        or p.subcapitan_id = p_jugador_id
        or exists (
          select 1 from invitaciones i
          where i.partido_id = p.id and i.invitado_id = p_jugador_id and i.estado = 'pendiente'
        )
        or coalesce(
             (select cantidad from bajas_tardias_por_jugador() where jugador_id = p_jugador_id),
             0
           ) <= 1
      )
  );
$function$;

create or replace function public.tengo_acceso_al_partido(p_partido_id uuid)
 returns boolean
 language sql stable security definer set search_path to 'public'
as $function$
  select
    exists (
      select 1
      from invitaciones i
      join jugadores j on j.id = i.invitado_id
      where i.partido_id = p_partido_id and j.user_id = auth.uid()
    )
    or exists (
      select 1
      from participantes pa
      join jugadores j on j.id = pa.jugador_id
      where pa.partido_id = p_partido_id and j.user_id = auth.uid()
    );
$function$;

create or replace function public.abandonos_de_capitan()
 returns table(jugador_id uuid, cantidad bigint)
 language sql stable security definer set search_path to 'public'
as $function$
  select b.jugador_id, count(*) as cantidad
  from bajas b
  join partidos p on p.id = b.partido_id
  where b.era_capitan and p.fecha_hora > now() - interval '60 days'
  group by b.jugador_id;
$function$;

create or replace function public.sanciones_de_capitan(p_jugador_id uuid)
 returns table(amarillas bigint, roja boolean, partidos_para_volver integer)
 language plpgsql stable security definer set search_path to 'public', 'pg_temp'
as $function$
declare
  v_amarillas bigint;
  v_segunda timestamptz;
  v_jugados integer;
begin
  select count(*) into v_amarillas
  from bajas b
  join partidos p on p.id = b.partido_id
  where b.jugador_id = p_jugador_id
    and b.era_capitan
    and p.fecha_hora > now() - interval '60 days';

  if v_amarillas < 2 then
    return query select v_amarillas, false, 0;
    return;
  end if;

  select p.fecha_hora into v_segunda
  from bajas b
  join partidos p on p.id = b.partido_id
  where b.jugador_id = p_jugador_id
    and b.era_capitan
    and p.fecha_hora > now() - interval '60 days'
  order by p.fecha_hora
  offset 1 limit 1;

  select count(*) into v_jugados
  from participantes pa
  join partidos p on p.id = pa.partido_id
  where pa.jugador_id = p_jugador_id
    and p.fecha_hora > v_segunda
    and p.fecha_hora < now()
    and p.estado <> 'cancelado';

  return query select
    v_amarillas,
    v_jugados < 2,
    greatest(0, 2 - v_jugados)::integer;
end;
$function$;

create or replace function public.capitan_suspendido(p_jugador_id uuid)
 returns boolean
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select coalesce((select roja from sanciones_de_capitan(p_jugador_id)), false);
$function$;

create or replace function public.liberar_lugares_sin_confirmar(p_partido_id uuid)
 returns integer
 language plpgsql security definer set search_path to 'public'
as $function$
declare
  p partidos%rowtype;
  liberados integer := 0;
begin
  select * into p from partidos where id = p_partido_id;
  if not found then return 0; end if;

  if p.estado <> 'abierto'
     or p.fecha_hora > now() + interval '12 hours'
     or p.fecha_hora <= now() then
    return 0;
  end if;

  with sacados as (
    delete from participantes pa
    where pa.partido_id = p.id
      and pa.confirmado_at is null
      and pa.jugador_id <> p.admin_id
      and (p.subcapitan_id is null or pa.jugador_id <> p.subcapitan_id)
    returning pa.jugador_id
  )
  insert into bajas (partido_id, jugador_id, horas_antes)
  select p.id, s.jugador_id, extract(epoch from (p.fecha_hora - now())) / 3600
  from sacados s
  on conflict do nothing;

  get diagnostics liberados = row_count;
  return liberados;
end;
$function$;

create or replace function public.partido_por_token(p_token text)
 returns table(id uuid, cancha text, fecha_hora timestamp with time zone, cupo_total integer, anotados bigint, lugares integer, invita text, es_de_grupo boolean, nota text, mapa_url text, estado text)
 language sql stable security definer set search_path to 'public', 'pg_temp'
as $function$
  select
    p.id,
    p.cancha,
    p.fecha_hora,
    p.cupo_total,
    (select count(*) from participantes pa where pa.partido_id = p.id) as anotados,
    greatest(0, p.cupo_total - (select count(*) from participantes pa where pa.partido_id = p.id))::integer as lugares,
    coalesce(j.apodo, j.nombre) as invita,
    p.grupo_id is not null as es_de_grupo,
    p.nota,
    p.mapa_url,
    p.estado
  from partidos p
  left join jugadores j on j.id = p.admin_id
  where p.token = p_token
    and p.fecha_hora > now() - interval '1 hour';
$function$;

create or replace function public.sumarme_con_token(p_token text)
 returns text
 language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
declare
  p partidos%rowtype;
  mi_jugador uuid;
begin
  select id into mi_jugador from jugadores where user_id = auth.uid();
  if mi_jugador is null then
    return 'sin_perfil';
  end if;

  select * into p from partidos where token = p_token;
  if not found then
    return 'no_existe';
  end if;

  if p.estado <> 'abierto' then return 'cerrado'; end if;
  if p.fecha_hora <= now() then return 'ya_paso'; end if;
  if (select count(*) from participantes pa where pa.partido_id = p.id) >= p.cupo_total then
    return 'lleno';
  end if;

  if exists (select 1 from participantes pa where pa.partido_id = p.id and pa.jugador_id = mi_jugador) then
    return 'ya_estabas';
  end if;

  insert into participantes (partido_id, jugador_id, confirmado_at)
  values (p.id, mi_jugador, now());

  return 'listo';
end;
$function$;

create or replace function public.borrar_mi_cuenta()
 returns text
 language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
declare
  mi_jugador uuid;
  pendientes integer;
begin
  select id into mi_jugador from jugadores where user_id = auth.uid();
  if mi_jugador is null then return 'sin_perfil'; end if;

  select count(*) into pendientes
  from partidos
  where admin_id = mi_jugador and estado <> 'cancelado' and fecha_hora > now();

  if pendientes > 0 then
    return 'tenes_partidos:' || pendientes;
  end if;

  -- Se va la persona, queda el paso por la cancha.
  update jugadores set
    user_id = null,
    nombre = 'Jugador dado de baja',
    apodo = null,
    foto_url = null,
    avatar = null,
    bio = null,
    zona = null,
    buscando = false,
    disponibilidad = null,
    posiciones = null,
    posicion = null,
    avisos_mail = null
  where id = mi_jugador;

  delete from jugadores_ubicacion where jugador_id = mi_jugador;
  delete from auth.users where id = auth.uid();

  return 'listo';
end;
$function$;


-- Funciones de disparador y de panel.

create or replace function limitar_partidos_por_dia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from partidos
    where admin_id = new.admin_id and created_at > now() - interval '1 day'
  ) >= 5 then
    raise exception 'Ya creaste 5 partidos hoy. Probá de nuevo mañana.';
  end if;
  return new;
end;
$$;

create or replace function limitar_grupos_por_dia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from grupos
    where creador_id = new.creador_id and created_at > now() - interval '1 day'
  ) >= 3 then
    raise exception 'Ya creaste 3 grupos hoy. Probá de nuevo mañana.';
  end if;
  return new;
end;
$$;

create or replace function limitar_sugerencias_por_dia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from sugerencias
    where jugador_id = new.jugador_id and created_at > now() - interval '1 day'
  ) >= 5 then
    raise exception 'Ya mandaste 5 sugerencias hoy. Seguimos mañana.';
  end if;
  return new;
end;
$$;

create or replace function participantes_confirmar_sobre_la_hora()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.confirmado_at is null
     and (select fecha_hora from partidos where id = new.partido_id) < now() + interval '24 hours' then
    new.confirmado_at := now();
  end if;
  return new;
end;
$$;

create or replace function panel_metricas()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resultado jsonb;
  tz constant text := 'America/Argentina/Buenos_Aires';
begin
  if not exists (select 1 from jugadores where user_id = auth.uid() and es_admin) then
    raise exception 'Este panel es solo para el creador.';
  end if;

  select jsonb_build_object(

    'gente', jsonb_build_object(
      'jugadores',        (select count(*) from jugadores where not coalesce(es_demo, false)),
      'con_cuenta',       (select count(*) from jugadores where not coalesce(es_demo, false) and user_id is not null),
      'sin_reclamar',     (select count(*) from jugadores where not coalesce(es_demo, false) and user_id is null),
      'nuevos_7d',        (select count(*) from jugadores where not coalesce(es_demo, false) and created_at > now() - interval '7 days'),
      'nuevos_30d',       (select count(*) from jugadores where not coalesce(es_demo, false) and created_at > now() - interval '30 days'),
      'entraron_7d',      (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
      'entraron_30d',     (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
      'nunca_entraron',   (select count(*) from auth.users where last_sign_in_at is null),
      'activos_7d',       (
        select count(distinct j) from (
          select jugador_id as j from participantes where created_at > now() - interval '7 days'
          union select evaluador_id from valoraciones where created_at > now() - interval '7 days'
          union select admin_id from partidos where created_at > now() - interval '7 days'
        ) t
      )
    ),

    'partidos', jsonb_build_object(
      'total',        (select count(*) from partidos),
      'jugados',      (select count(*) from partidos where fecha_hora < now() and estado <> 'cancelado'),
      'proximos',     (select count(*) from partidos where fecha_hora >= now() and estado <> 'cancelado'),
      'cancelados',   (select count(*) from partidos where estado = 'cancelado'),
      'nuevos_7d',    (select count(*) from partidos where created_at > now() - interval '7 days'),
      'de_grupo',     (select count(*) from partidos where grupo_id is not null),
      'ocupacion',    (
        select round(avg(least(anotados::numeric / nullif(cupo_total, 0), 1)) * 100)
        from (
          select p.cupo_total, (select count(*) from participantes pa where pa.partido_id = p.id) as anotados
          from partidos p
          where p.fecha_hora < now() and p.estado <> 'cancelado'
        ) o
      ),
      'valor_promedio', (select round(avg(valor_cancha)) from partidos where valor_cancha > 0)
    ),

    'compromiso', jsonb_build_object(
      'bajas',         (select count(*) from bajas),
      'bajas_tardias', (select count(*) from bajas where horas_antes < 0.75),
      'valoraciones',  (select count(*) from valoraciones),
      'estrella_promedio', (select round(avg(estrellas), 2) from valoraciones),
      'insignias',     (select count(*) from insignias_otorgadas),
      'votos_mvp',     (select count(*) from mvp_votos),
      'invitaciones',  (select count(*) from invitaciones),
      'invitaciones_aceptadas', (select count(*) from invitaciones where estado = 'aceptada'),
      'grupos',        (select count(*) from grupos),
      'canchas',       (select count(*) from canchas)
    ),

    -- El embudo: de los que se registran, cuántos llegan a jugar de verdad.
    'embudo', jsonb_build_object(
      'se_registraron', (select count(*) from auth.users),
      'hicieron_perfil', (select count(*) from jugadores where user_id is not null and not coalesce(es_demo, false)),
      'jugaron_1', (
        select count(*) from (
          select pa.jugador_id from participantes pa
          join partidos p on p.id = pa.partido_id
          join jugadores j on j.id = pa.jugador_id
          where p.fecha_hora < now() and p.estado <> 'cancelado' and not coalesce(j.es_demo, false)
          group by pa.jugador_id
        ) t
      ),
      'jugaron_3', (
        select count(*) from (
          select pa.jugador_id from participantes pa
          join partidos p on p.id = pa.partido_id
          join jugadores j on j.id = pa.jugador_id
          where p.fecha_hora < now() and p.estado <> 'cancelado' and not coalesce(j.es_demo, false)
          group by pa.jugador_id having count(*) >= 3
        ) t
      )
    ),

    -- Series semanales, últimas 12 semanas.
    'altas_semanales', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.semana), '[]'::jsonb) from (
        select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as semana, count(*) as cantidad
        from jugadores
        where not coalesce(es_demo, false) and created_at > now() - interval '12 weeks'
        group by 1
      ) x
    ),

    'partidos_semanales', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.semana), '[]'::jsonb) from (
        select to_char(date_trunc('week', fecha_hora), 'YYYY-MM-DD') as semana, count(*) as cantidad
        from partidos
        where fecha_hora > now() - interval '12 weeks' and fecha_hora < now() and estado <> 'cancelado'
        group by 1
      ) x
    ),

    -- Cuándo se juega: día de la semana y hora, en hora argentina.
    'dias', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.dia), '[]'::jsonb) from (
        select extract(isodow from fecha_hora at time zone tz)::int as dia, count(*) as cantidad
        from partidos where estado <> 'cancelado'
        group by 1
      ) x
    ),

    'horas', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.hora), '[]'::jsonb) from (
        select extract(hour from fecha_hora at time zone tz)::int as hora, count(*) as cantidad
        from partidos where estado <> 'cancelado'
        group by 1
      ) x
    ),

    -- Dónde se juega. Se agrupa por el nombre escrito, que es lo que hay
    -- en todos los partidos (el perfil de cancha es más nuevo).
    'canchas_top', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.partidos desc), '[]'::jsonb) from (
        select p.cancha as nombre, count(*) as partidos,
               (select count(*) from participantes pa where pa.partido_id in (
                  select p2.id from partidos p2 where p2.cancha = p.cancha)) as jugadores
        from partidos p
        where p.estado <> 'cancelado'
        group by p.cancha
        order by count(*) desc
        limit 10
      ) x
    ),

    'zonas', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.cantidad desc), '[]'::jsonb) from (
        select zona, count(*) as cantidad
        from jugadores
        where zona is not null and zona <> '' and not coalesce(es_demo, false)
        group by zona
        order by count(*) desc
        limit 10
      ) x
    ),

    'generado', to_char(now() at time zone tz, 'YYYY-MM-DD HH24:MI')
  )
  into resultado;

  return resultado;
end;
$$;

create or replace function novedades()
returns jsonb
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  with yo as (
    select id from jugadores where user_id = auth.uid() limit 1
  ),
  tz as (select 'America/Argentina/Buenos_Aires'::text as z),
  eventos as (

    -- 1. Confirmá que venís, o perdés el lugar. Lo más urgente que hay.
    select
      1 as prioridad,
      p.fecha_hora as cuando,
      'confirmar' as tipo,
      '¿Vas a ir?' as titulo,
      p.cancha || ' · ' ||
        to_char(p.fecha_hora at time zone (select z from tz), 'DD/MM HH24:MI') ||
        ' · si no confirmás, tu lugar queda libre' as detalle,
      '/partidos/' || p.id as destino
    from participantes pa
    join partidos p on p.id = pa.partido_id
    where pa.jugador_id = (select id from yo)
      and pa.confirmado_at is null
      and p.estado = 'abierto'
      and p.fecha_hora > now()
      and p.fecha_hora < now() + interval '24 hours'

    union all

    -- 2. Te invitaron.
    select
      2, p.fecha_hora, 'invitacion',
      'Te invitaron a jugar',
      p.cancha || ' · ' || to_char(p.fecha_hora at time zone (select z from tz), 'DD/MM HH24:MI'),
      '/partidos/' || p.id
    from invitaciones i
    join partidos p on p.id = i.partido_id
    where i.invitado_id = (select id from yo)
      and i.estado = 'pendiente'
      and p.fecha_hora > now()

    union all

    -- 3. Te falta valorar, y la ventana se cierra a las 24hs.
    select
      3, p.fecha_hora, 'valorar',
      'Valorá a tus compañeros',
      p.cancha || ' · la ventana se cierra ' ||
        to_char((p.fecha_hora + interval '24 hours') at time zone (select z from tz), 'DD/MM HH24:MI'),
      '/partidos/' || p.id || '/valorar'
    from participantes pa
    join partidos p on p.id = pa.partido_id
    where pa.jugador_id = (select id from yo)
      and p.estado <> 'cancelado'
      and p.fecha_hora < now() - interval '2 hours'
      and p.fecha_hora > now() - interval '24 hours'
      and exists (
        select 1 from participantes otros
        where otros.partido_id = p.id
          and otros.jugador_id <> (select id from yo)
          and not exists (
            select 1 from valoraciones v
            where v.partido_id = p.id
              and v.evaluador_id = (select id from yo)
              and v.evaluado_id = otros.jugador_id
          )
      )

    union all

    -- 4. Se levantó la veda: ya podés ver qué te pusieron.
    select
      4, p.fecha_hora, 'notas',
      'Ya se pueden ver las notas',
      p.cancha || ' · ' || (
        select count(*) from valoraciones v
        where v.partido_id = p.id and v.evaluado_id = (select id from yo)
      ) || ' valoraciones tuyas entraron al promedio',
      '/perfil'
    from participantes pa
    join partidos p on p.id = pa.partido_id
    where pa.jugador_id = (select id from yo)
      and p.estado <> 'cancelado'
      and p.fecha_hora + interval '24 hours' < now()
      and p.fecha_hora + interval '24 hours' > now() - interval '72 hours'
      and exists (
        select 1 from valoraciones v
        where v.partido_id = p.id and v.evaluado_id = (select id from yo)
      )

    union all

    -- 5. Cargaron el resultado de un partido que jugaste.
    select
      5, p.fecha_hora, 'resultado',
      'Quedó el resultado',
      p.cancha || ' · ' || p.goles_a || ' a ' || p.goles_b,
      '/partidos/' || p.id
    from participantes pa
    join partidos p on p.id = pa.partido_id
    where pa.jugador_id = (select id from yo)
      and p.goles_a is not null
      and p.fecha_hora > now() - interval '72 hours'
      and p.fecha_hora < now()

    union all

    -- 6. Alguien se sumó a un partido tuyo.
    select
      6, max(pa.created_at), 'se_sumo',
      case when count(*) = 1 then 'Se sumó uno a tu partido'
           else 'Se sumaron ' || count(*) || ' a tu partido' end,
      p.cancha || ' · ' ||
        (select count(*) from participantes t where t.partido_id = p.id) || ' de ' || p.cupo_total,
      '/partidos/' || p.id
    from participantes pa
    join partidos p on p.id = pa.partido_id
    where (
        p.admin_id = (select id from yo)
        or p.subcapitan_id = (select id from yo)
      )
      and pa.jugador_id <> (select id from yo)
      and pa.created_at > now() - interval '72 hours'
      and p.fecha_hora > now()
    group by p.id, p.cancha, p.cupo_total
  )
  select coalesce(
    jsonb_agg(to_jsonb(e) order by e.prioridad, e.cuando),
    '[]'::jsonb
  )
  -- El corte va DESPUÉS de ordenar: si no, podía descartar justo lo urgente.
  from (select * from eventos order by prioridad, cuando limit 12) e;
$function$;


-- Los dos disparadores que limitan los cambios de nombre y de posiciones.
-- `jugadores_limitar_cambios_posiciones` quedó de una versión anterior y hoy
-- no la usa ningún disparador; se conserva para no perderla.

create or replace function public.jugadores_limitar_cambios()
 returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
begin
  -- Posiciones: hasta 2 cambios
  if old.posiciones is distinct from new.posiciones
     and coalesce(array_length(old.posiciones, 1), 0) > 0 then
    if old.cambios_posiciones >= 2 then
      raise exception 'Ya usaste los 2 cambios de posición disponibles';
    end if;
    new.cambios_posiciones := old.cambios_posiciones + 1;
  else
    new.cambios_posiciones := old.cambios_posiciones;
  end if;

  -- Nombre o apodo: un solo cambio
  if (old.nombre is distinct from new.nombre or old.apodo is distinct from new.apodo)
     and old.nombre is not null then
    if old.cambios_nombre >= 1 then
      raise exception 'El nombre y el apodo se pueden cambiar una sola vez';
    end if;
    new.cambios_nombre := old.cambios_nombre + 1;
  else
    new.cambios_nombre := old.cambios_nombre;
  end if;

  return new;
end;
$function$;

create or replace function public.jugadores_limitar_cambios_posiciones()
 returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
begin
  if old.posiciones is distinct from new.posiciones
     and coalesce(array_length(old.posiciones, 1), 0) > 0 then

    if old.cambios_posiciones >= 2 then
      raise exception 'Ya usaste los 2 cambios de posición disponibles';
    end if;

    new.cambios_posiciones := old.cambios_posiciones + 1;
  else
    -- nadie puede resetear el contador a mano
    new.cambios_posiciones := old.cambios_posiciones;
  end if;

  return new;
end;
$function$;

-- Prende la seguridad por fila sola en cada tabla nueva. Es de Supabase.
-- OJO: el disparador de eventos que la engancha NO está en este archivo,
-- porque los disparadores de eventos no viven en el esquema public.
create or replace function public.rls_auto_enable()
 returns event_trigger
 language plpgsql security definer set search_path to 'pg_catalog'
as $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;


-- ============================================================
-- 7. Disparadores
-- ============================================================

drop trigger if exists trg_limitar_cambios on public.jugadores;
create trigger trg_limitar_cambios before update on public.jugadores
  for each row execute function jugadores_limitar_cambios();

drop trigger if exists partidos_tope_diario on public.partidos;
create trigger partidos_tope_diario before insert on public.partidos
  for each row execute function limitar_partidos_por_dia();

drop trigger if exists grupos_tope_diario on public.grupos;
create trigger grupos_tope_diario before insert on public.grupos
  for each row execute function limitar_grupos_por_dia();

drop trigger if exists sugerencias_tope_diario on public.sugerencias;
create trigger sugerencias_tope_diario before insert on public.sugerencias
  for each row execute function limitar_sugerencias_por_dia();

drop trigger if exists participantes_confirmar_al_anotarse on public.participantes;
create trigger participantes_confirmar_al_anotarse before insert on public.participantes
  for each row execute function participantes_confirmar_sobre_la_hora();


-- ============================================================
-- 8. Políticas de seguridad
--
-- Van al final porque varias llaman a las funciones de arriba.
--
-- Dos tablas NO tienen política de lectura a propósito: `valoraciones` e
-- `insignias_otorgadas`. Nadie puede leerlas directo — solo se llega a
-- ellas por las funciones, que devuelven promedios y conteos. Es lo que
-- hace que la valoración sea de verdad anónima.
-- ============================================================

-- jugadores
create policy "ver jugadores" on public.jugadores for select to public using (true);
create policy "editar propio jugador" on public.jugadores for insert to public with check ((auth.uid() = user_id));
create policy "actualizar propio jugador" on public.jugadores for update to public using ((auth.uid() = user_id));
create policy "crear jugador sin registrar" on public.jugadores for insert to public
  with check (((user_id is null) and (exists (select 1 from jugadores j where (j.user_id = auth.uid())))));
create policy "reclamar jugador" on public.jugadores for update to public
  using (((user_id is null) and (coalesce(es_demo, false) = false)))
  with check (((user_id = auth.uid()) and (coalesce(es_demo, false) = false)));

-- jugadores_ubicacion
create policy "ver mi ubicacion" on public.jugadores_ubicacion for select to public
  using ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "guardar mi ubicacion" on public.jugadores_ubicacion for insert to public
  with check ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "actualizar mi ubicacion" on public.jugadores_ubicacion for update to public
  using ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "borrar mi ubicacion" on public.jugadores_ubicacion for delete to public
  using ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- bloqueos
create policy "ver mis bloqueos" on public.bloqueos for select to public
  using ((bloqueador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "bloquear" on public.bloqueos for insert to public
  with check ((bloqueador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "desbloquear" on public.bloqueos for delete to public
  using ((bloqueador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- grupos
create policy "ver grupos" on public.grupos for select to public using (true);
create policy "crear grupo" on public.grupos for insert to public
  with check ((creador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- grupo_miembros
create policy "ver miembros" on public.grupo_miembros for select to public using (true);
create policy "sumarse o sumar a grupo" on public.grupo_miembros for insert to public
  with check ((((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
      and (exists (select 1 from grupos g where ((g.id = grupo_miembros.grupo_id) and (g.requiere_aprobacion = false)))))
    or (exists (select 1 from grupos g where ((g.id = grupo_miembros.grupo_id)
      and (g.creador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))))))));

-- solicitudes_grupo
create policy "ver mis solicitudes o las de mi grupo" on public.solicitudes_grupo for select to public
  using (((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    or (grupo_id in (select grupos.id from grupos where (grupos.creador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))))));
create policy "crear solicitud" on public.solicitudes_grupo for insert to public
  with check ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "admin resuelve solicitud" on public.solicitudes_grupo for update to public
  using ((grupo_id in (select grupos.id from grupos where (grupos.creador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))))));
create policy "borrar solicitud propia o de mi grupo" on public.solicitudes_grupo for delete to public
  using (((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    or (grupo_id in (select grupos.id from grupos where (grupos.creador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))))));

-- canchas
create policy "ver canchas" on public.canchas for select to public using (true);
create policy "crear cancha" on public.canchas for insert to authenticated
  with check ((creada_por_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "el dueno edita su cancha" on public.canchas for update to public
  using ((dueno_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- partidos
create policy "ver partidos" on public.partidos for select to public
  using (((grupo_id is null)
    or (grupo_id in (select gm.grupo_id from (grupo_miembros gm join jugadores j on ((j.id = gm.jugador_id))) where (j.user_id = auth.uid())))
    or tengo_acceso_al_partido(id)));
create policy "crear partido" on public.partidos for insert to public
  with check (((admin_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    and (fecha_hora > (now() - '01:00:00'::interval))
    and (fecha_hora < (now() + '6 mons'::interval))
    and (not capitan_suspendido(admin_id))));
create policy "editar partido propio" on public.partidos for update to public
  using ((admin_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "subcapitan edita el partido" on public.partidos for update to public
  using ((subcapitan_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- participantes
create policy "ver participantes" on public.participantes for select to public using (true);
create policy "sumarse a partido" on public.participantes for insert to public
  with check (((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    and puede_sumarse_al_partido(partido_id, jugador_id)));
create policy "bajarse de partido" on public.participantes for delete to public
  using ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "confirmar que voy" on public.participantes for update to public
  using ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "asignar equipo" on public.participantes for update to public
  using ((partido_id in (select p.id from partidos p
    where ((p.admin_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
      or (p.subcapitan_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))))));

-- bajas
create policy "ver bajas" on public.bajas for select to public using (true);
create policy "registrar baja" on public.bajas for insert to public
  with check ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- invitaciones
create policy "ver invitaciones propias" on public.invitaciones for select to public
  using (((invitado_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    or (invitado_por_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))));
create policy "invitar a mi partido" on public.invitaciones for insert to public
  with check (((invitado_por_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    and (exists (select 1 from partidos p where ((p.id = invitaciones.partido_id)
      and ((p.admin_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
        or (p.subcapitan_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))))))
    and (exists (select 1 from jugadores where ((jugadores.id = invitaciones.invitado_id) and (jugadores.buscando = true))))));
create policy "responder invitacion" on public.invitaciones for update to public
  using ((invitado_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- valoraciones (sin lectura directa a propósito)
create policy "cargar valoracion" on public.valoraciones for insert to public
  with check (((evaluador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    and (exists (select 1 from participantes where ((participantes.partido_id = valoraciones.partido_id) and (participantes.jugador_id = valoraciones.evaluador_id))))
    and (exists (select 1 from participantes where ((participantes.partido_id = valoraciones.partido_id) and (participantes.jugador_id = valoraciones.evaluado_id))))
    and (exists (select 1 from partidos where ((partidos.id = valoraciones.partido_id) and (partidos.fecha_hora < now()) and (partidos.fecha_hora > (now() - '24:00:00'::interval)))))));

-- insignias_otorgadas (sin lectura directa a propósito)
create policy "otorgar insignia" on public.insignias_otorgadas for insert to public
  with check (((otorgado_por_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    and (exists (select 1 from participantes where ((participantes.partido_id = insignias_otorgadas.partido_id) and (participantes.jugador_id = insignias_otorgadas.otorgado_por_id))))
    and (exists (select 1 from participantes where ((participantes.partido_id = insignias_otorgadas.partido_id) and (participantes.jugador_id = insignias_otorgadas.jugador_id))))
    and (exists (select 1 from partidos where ((partidos.id = insignias_otorgadas.partido_id) and (partidos.fecha_hora < now()) and (partidos.fecha_hora > (now() - '24:00:00'::interval)))))));

-- mvp_votos
create policy "ver mi voto mvp" on public.mvp_votos for select to public
  using ((votante_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "votar mvp" on public.mvp_votos for insert to public
  with check (((votante_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    and (votante_id <> votado_id)
    and (exists (select 1 from participantes where ((participantes.partido_id = mvp_votos.partido_id) and (participantes.jugador_id = mvp_votos.votante_id))))
    and (exists (select 1 from participantes where ((participantes.partido_id = mvp_votos.partido_id) and (participantes.jugador_id = mvp_votos.votado_id))))
    and (exists (select 1 from partidos where ((partidos.id = mvp_votos.partido_id) and (partidos.fecha_hora < now()) and (partidos.fecha_hora > (now() - '24:00:00'::interval)))))));

-- valoraciones_cancha
create policy "ver mi valoracion de cancha" on public.valoraciones_cancha for select to public
  using ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "valorar la cancha" on public.valoraciones_cancha for insert to public
  with check (((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    and (exists (select 1 from participantes where ((participantes.partido_id = valoraciones_cancha.partido_id) and (participantes.jugador_id = valoraciones_cancha.jugador_id))))
    and (exists (select 1 from partidos where ((partidos.id = valoraciones_cancha.partido_id) and (partidos.fecha_hora < now()) and (partidos.fecha_hora > (now() - '24:00:00'::interval)))))));

-- goles
create policy "ver goles" on public.goles for select to public using (true);
create policy "cargar goles" on public.goles for insert to public
  with check (((exists (select 1 from partidos p where ((p.id = goles.partido_id)
      and ((p.admin_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
        or (p.subcapitan_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))))))
    and (exists (select 1 from participantes pa where ((pa.partido_id = goles.partido_id) and (pa.jugador_id = goles.jugador_id))))));
create policy "corregir goles" on public.goles for update to public
  using ((exists (select 1 from partidos p where ((p.id = goles.partido_id)
    and ((p.admin_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
      or (p.subcapitan_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))))))));
create policy "borrar goles" on public.goles for delete to public
  using ((exists (select 1 from partidos p where ((p.id = goles.partido_id)
    and ((p.admin_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
      or (p.subcapitan_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))))))));

-- reacciones_partido
create policy "ver reacciones" on public.reacciones_partido for select to public using (true);
create policy "reaccionar" on public.reacciones_partido for insert to public
  with check (((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid())))
    and (exists (select 1 from participantes pa where ((pa.partido_id = reacciones_partido.partido_id) and (pa.jugador_id = reacciones_partido.jugador_id))))));
create policy "sacar mi reaccion" on public.reacciones_partido for delete to public
  using ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- logros_vistos
create policy "ver mis logros vistos" on public.logros_vistos for select to public
  using ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "marcar logro visto" on public.logros_vistos for insert to public
  with check ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));

-- sugerencias
create policy "mandar sugerencia" on public.sugerencias for insert to public
  with check ((jugador_id in (select jugadores.id from jugadores where (jugadores.user_id = auth.uid()))));
create policy "leer sugerencias" on public.sugerencias for select to public
  using ((exists (select 1 from jugadores where ((jugadores.user_id = auth.uid()) and jugadores.es_admin))));
create policy "marcar sugerencia" on public.sugerencias for update to public
  using ((exists (select 1 from jugadores where ((jugadores.user_id = auth.uid()) and jugadores.es_admin))));


-- Fin del esquema base.
