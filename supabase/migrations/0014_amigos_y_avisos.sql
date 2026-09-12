-- ============================================================
-- 0014 — Amigos, y avisar cuando algo se arregla
--
--   1. Amistades: pedir, aceptar, deshacer.
--   2. `sugerencias.hecha_at`: cuándo se marcó como hecha, para poder
--      avisarle a quien la escribió.
--   3. `novedades_app`: los avisos de "esta semana cambiamos esto", para
--      cuando se hacen cinco cosas juntas y no da mandar cinco carteles.
--   4. `novedades()` suma las dos nuevas.
--
-- Las columnas van arriba de todo: Postgres valida el cuerpo de las
-- funciones al crearlas y se cae el script entero si leen algo que se
-- agrega más abajo.
-- ============================================================

alter table sugerencias add column if not exists hecha_at timestamptz;


-- ============================================================
-- 1. AMISTADES
--
-- Para qué: reconocer al que jugó con vos o al que conociste en la cancha,
-- y encontrarlo rápido la próxima vez que te falte uno.
--
-- No se puede agregar a cualquiera: o jugaron juntos alguna vez, o la otra
-- persona está publicada como disponible. Es la misma regla que ya rige
-- para invitar, y evita que agregar desconocidos en masa sea gratis.
-- ============================================================

create table if not exists amistades (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references jugadores(id) on delete cascade,
  destinatario_id uuid not null references jugadores(id) on delete cascade,
  estado text not null default 'pendiente',
  created_at timestamptz not null default now(),
  respondida_at timestamptz,
  unique (solicitante_id, destinatario_id),
  constraint amistades_estado_valido check (estado in ('pendiente', 'aceptada', 'rechazada')),
  constraint amistades_no_a_uno_mismo check (solicitante_id <> destinatario_id)
);

alter table amistades enable row level security;

drop policy if exists "ver mis amistades" on amistades;
create policy "ver mis amistades" on amistades
for select
using (
  solicitante_id in (select id from jugadores where user_id = auth.uid())
  or destinatario_id in (select id from jugadores where user_id = auth.uid())
);

drop policy if exists "pedir amistad" on amistades;
create policy "pedir amistad" on amistades
for insert
with check (
  solicitante_id in (select id from jugadores where user_id = auth.uid())
  -- Jugaron juntos, o el otro está publicado como disponible.
  and (
    exists (
      select 1
      from participantes mios
      join participantes suyos on suyos.partido_id = mios.partido_id
      where mios.jugador_id = amistades.solicitante_id
        and suyos.jugador_id = amistades.destinatario_id
    )
    or exists (
      select 1 from jugadores j
      where j.id = amistades.destinatario_id and j.buscando = true
    )
  )
  -- El bloqueo manda sobre todo lo demás, en las dos direcciones.
  and not exists (
    select 1 from bloqueos b
    where (b.bloqueador_id = amistades.solicitante_id and b.bloqueado_id = amistades.destinatario_id)
       or (b.bloqueador_id = amistades.destinatario_id and b.bloqueado_id = amistades.solicitante_id)
  )
);

-- Responder es solo del que recibió el pedido.
drop policy if exists "responder amistad" on amistades;
create policy "responder amistad" on amistades
for update
using (destinatario_id in (select id from jugadores where user_id = auth.uid()));

-- Deshacer puede cualquiera de los dos: el que se arrepintió de pedirla y
-- el que ya no quiere estar.
drop policy if exists "deshacer amistad" on amistades;
create policy "deshacer amistad" on amistades
for delete
using (
  solicitante_id in (select id from jugadores where user_id = auth.uid())
  or destinatario_id in (select id from jugadores where user_id = auth.uid())
);

create or replace function limitar_amistades_por_dia()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if (
    select count(*) from amistades
    where solicitante_id = new.solicitante_id and created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'Mandaste muchas solicitudes hoy. Seguimos mañana.';
  end if;
  return new;
end;
$function$;

drop trigger if exists amistades_tope_diario on amistades;
create trigger amistades_tope_diario
before insert on amistades
for each row execute function limitar_amistades_por_dia();


-- En qué anda tu relación con otro jugador, para saber qué botón mostrar.
create or replace function estado_amistad(p_otro uuid)
returns text
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  with yo as (select id from jugadores where user_id = auth.uid() limit 1)
  select coalesce((
    select case
      when a.estado = 'aceptada' then 'amigos'
      when a.estado = 'rechazada' then 'ninguna'
      when a.solicitante_id = (select id from yo) then 'esperando'
      else 'te_pidieron'
    end
    from amistades a
    where (a.solicitante_id = (select id from yo) and a.destinatario_id = p_otro)
       or (a.solicitante_id = p_otro and a.destinatario_id = (select id from yo))
    limit 1
  ), 'ninguna');
$function$;


create or replace function cuantos_amigos(p_jugador_id uuid)
returns bigint
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select count(*)
  from amistades a
  where a.estado = 'aceptada'
    and (a.solicitante_id = p_jugador_id or a.destinatario_id = p_jugador_id);
$function$;


-- ============================================================
-- 2. NOVEDADES DE LA APP
--
-- Cuando se hacen cinco cosas juntas no da mandar cinco carteles: se
-- publica una sola novedad y la ve todo el mundo durante 48 horas.
-- Las escribe únicamente quien tiene es_admin.
-- ============================================================

create table if not exists novedades_app (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  texto text not null,
  publicada_at timestamptz not null default now(),
  constraint novedades_app_titulo_razonable check (char_length(titulo) between 3 and 80),
  constraint novedades_app_texto_razonable check (char_length(texto) between 3 and 800)
);

alter table novedades_app enable row level security;

drop policy if exists "ver novedades de la app" on novedades_app;
create policy "ver novedades de la app" on novedades_app for select using (true);

drop policy if exists "publicar novedad" on novedades_app;
create policy "publicar novedad" on novedades_app
for insert
with check (exists (select 1 from jugadores where user_id = auth.uid() and es_admin));

drop policy if exists "borrar novedad" on novedades_app;
create policy "borrar novedad" on novedades_app
for delete
using (exists (select 1 from jugadores where user_id = auth.uid() and es_admin));


-- ============================================================
-- 3. QUÉ CARTEL MOSTRAR AL ENTRAR
--
-- Devuelve lo que hay que avisarle a esta persona ahora mismo: las
-- sugerencias suyas que se resolvieron en las últimas 48 horas, y la
-- última novedad de la app si es reciente.
--
-- Hace falta una función porque `sugerencias` solo la puede leer el
-- creador de la app: nadie ve las de los demás, ni siquiera las propias.
-- ============================================================

create or replace function avisos_pendientes()
returns jsonb
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  with yo as (select id from jugadores where user_id = auth.uid() limit 1)
  select jsonb_build_object(
    'sugerencias', (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'texto', s.texto) order by s.hecha_at desc), '[]'::jsonb)
      from sugerencias s
      where s.jugador_id = (select id from yo)
        and s.estado = 'hecha'
        and s.hecha_at is not null
        and s.hecha_at > now() - interval '48 hours'
    ),
    'novedad', (
      select jsonb_build_object('id', n.id, 'titulo', n.titulo, 'texto', n.texto)
      from novedades_app n
      where n.publicada_at > now() - interval '48 hours'
      order by n.publicada_at desc
      limit 1
    )
  );
$function$;


-- ============================================================
-- 4. NOVEDADES, CON LAS DOS NUEVAS
-- ============================================================

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
    union all

    -- Te mandaron una solicitud de amistad. Va en el mismo escalón que una
    -- invitación a jugar: es alguien esperando una respuesta tuya.
    select
      2, a.created_at, 'amistad',
      'Te quieren agregar',
      coalesce(j.apodo, j.nombre) || ' te mandó una solicitud',
      '/jugadores/' || a.solicitante_id
    from amistades a
    join jugadores j on j.id = a.solicitante_id
    where a.destinatario_id = (select id from yo)
      and a.estado = 'pendiente'

    union all

    -- Arreglamos algo que esta persona pidió. Es la única novedad que
    -- devuelve algo a quien se tomó el trabajo de escribir.
    select
      4, s.hecha_at, 'sugerencia_hecha',
      'Arreglamos lo que pediste',
      'Tu sugerencia del ' || to_char(s.created_at at time zone (select z from tz), 'DD/MM') || ' ya está hecha',
      '/partidos'
    from sugerencias s
    where s.jugador_id = (select id from yo)
      and s.estado = 'hecha'
      and s.hecha_at is not null
      and s.hecha_at > now() - interval '7 days'

  )
  select coalesce(
    jsonb_agg(to_jsonb(e) order by e.prioridad, e.cuando),
    '[]'::jsonb
  )
  -- El corte va DESPUÉS de ordenar: si no, podía descartar justo lo urgente.
  from (select * from eventos order by prioridad, cuando limit 12) e;
$function$;


-- Confirmación.
select
  (select count(*) from information_schema.tables where table_name in ('amistades', 'novedades_app')) as tablas,
  (select count(*) from information_schema.columns
     where table_name = 'sugerencias' and column_name = 'hecha_at') as columna_hecha,
  (select count(*) from pg_proc where proname in
     ('estado_amistad', 'cuantos_amigos', 'avisos_pendientes', 'limitar_amistades_por_dia')) as funciones,
  (select jsonb_array_length(novedades())) as mis_novedades;
