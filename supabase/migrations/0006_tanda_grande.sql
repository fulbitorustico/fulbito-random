-- ============================================================
-- FULBITO RANDOM — Tanda grande (9 de septiembre)
--
-- Cuatro cosas, en este orden:
--   1. Punto 6 — la aprobación de grupo pasa a existir en la base
--   2. Punto 3 / Capa 1 — que los datos sean posibles
--   3. Punto 3 / Capa 2 — tope de creación por día
--   4. Panel del creador — métricas del sitio
--
-- El editor de Supabase corre TODO en una transacción: si algo falla,
-- no queda aplicado nada. Si da error, mandame el mensaje tal cual.
-- ============================================================


-- ============================================================
-- 1. PUNTO 6 — La aprobación de grupo, en la base
--
-- Antes: "jugador_id es el tuyo OR el grupo es uno de los tuyos".
--        La primera mitad dejaba que cualquiera se agregara a cualquier
--        grupo, sin invitación y sin aprobación: "grupo privado" no
--        significaba nada. La segunda dejaba que cualquier miembro
--        metiera a cualquiera.
-- Ahora: te sumás solo si el grupo no pide aprobación, o te suma el creador.
--        (El creador es quien aprueba las solicitudes, así que el flujo
--        de aprobación entra por esa puerta.)
-- ============================================================

drop policy if exists "sumarse o sumar a grupo" on grupo_miembros;

create policy "sumarse o sumar a grupo" on grupo_miembros
for insert
with check (
  -- Te sumás vos, y el grupo es de los que no piden permiso.
  (
    jugador_id in (select id from jugadores where user_id = auth.uid())
    and exists (
      select 1 from grupos g
      where g.id = grupo_miembros.grupo_id and g.requiere_aprobacion = false
    )
  )
  -- O te suma el creador del grupo: es el que aprueba las solicitudes y el
  -- que carga a los jugadores sin cuenta.
  or exists (
    select 1 from grupos g
    where g.id = grupo_miembros.grupo_id
      and g.creador_id in (select id from jugadores where user_id = auth.uid())
  )
);


-- ============================================================
-- 2. PUNTO 3 / CAPA 1 — Que los datos sean posibles
--
-- Hoy `partidos` no valida ningún rango: acepta cupos absurdos y valores
-- de cancha negativos. Y los textos no tienen techo, que es la puerta de
-- entrada del spam.
--
-- Se usa "drop constraint if exists" antes de cada uno para que el script
-- se pueda volver a correr sin romperse.
-- ============================================================

alter table partidos
  drop constraint if exists partidos_cupo_razonable,
  add  constraint partidos_cupo_razonable check (cupo_total between 2 and 30);

alter table partidos
  drop constraint if exists partidos_valor_razonable,
  add  constraint partidos_valor_razonable
       check (valor_cancha is null or (valor_cancha >= 0 and valor_cancha <= 2000000));

alter table partidos
  drop constraint if exists partidos_cancha_largo,
  add  constraint partidos_cancha_largo check (char_length(cancha) between 1 and 120);

-- Los comentarios son el lugar más fácil para meter spam: se les pone techo
-- de largo y se les prohíben los links.
alter table valoraciones
  drop constraint if exists valoraciones_comentario_sano,
  add  constraint valoraciones_comentario_sano
       check (
         comentario is null
         or (char_length(comentario) <= 500 and comentario !~* '(https?://|www\.)')
       );

alter table jugadores
  drop constraint if exists jugadores_textos_razonables,
  add  constraint jugadores_textos_razonables
       check (
         char_length(nombre) between 1 and 40
         and (apodo is null or char_length(apodo) <= 24)
         and (bio is null or (char_length(bio) <= 300 and bio !~* '(https?://|www\.)'))
       );


-- ============================================================
-- 3. PUNTO 3 / CAPA 2 — Tope de creación por día
--
-- Nadie organiza más de 5 partidos ni arma más de 3 grupos en un día.
-- El mensaje de error se ve tal cual en la pantalla, así que está escrito
-- para una persona, no para un programador.
-- ============================================================

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

drop trigger if exists partidos_tope_diario on partidos;
create trigger partidos_tope_diario
before insert on partidos
for each row execute function limitar_partidos_por_dia();

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

drop trigger if exists grupos_tope_diario on grupos;
create trigger grupos_tope_diario
before insert on grupos
for each row execute function limitar_grupos_por_dia();


-- ============================================================
-- 4. PANEL DEL CREADOR
--
-- Una marca de admin en jugadores, y una función que devuelve todas las
-- métricas juntas. Es security definer porque necesita leer auth.users
-- (los ingresos), pero corta de entrada si quien pregunta no es admin.
--
-- Todo lo que devuelve es agregado: cuentas, promedios y rankings.
-- No sale ni un nombre, ni un mail, ni una valoración de nadie en particular.
-- Los jugadores de demostración quedan afuera para que el crecimiento
-- que se ve sea el de verdad.
-- ============================================================

alter table jugadores add column if not exists es_admin boolean not null default false;

update jugadores
set es_admin = true
where user_id in (select id from auth.users where email = 'guillenofx@gmail.com');

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


-- ============================================================
-- Confirmación
-- ============================================================
select 'listo' as estado,
       (select count(*) from pg_policies where schemaname = 'public' and tablename = 'grupo_miembros' and cmd = 'INSERT') as politica_grupo,
       (select count(*) from pg_constraint where conname in (
          'partidos_cupo_razonable','partidos_valor_razonable','partidos_cancha_largo',
          'valoraciones_comentario_sano','jugadores_textos_razonables')) as restricciones,
       (select count(*) from pg_trigger where tgname in ('partidos_tope_diario','grupos_tope_diario')) as topes,
       (select count(*) from jugadores where es_admin) as admins;
