-- ============================================================
-- 0013 — El resultado, los goles y las novedades
--
--   1. Resultado del partido, cargado por el capitán
--   2. Quién hizo los goles (opcional, y menos importante que el resultado)
--   3. Novedades: qué pasó desde la última vez que entraste
--
-- Las columnas van todas arriba: Postgres valida el cuerpo de las funciones
-- al crearlas, y si leen algo que se agrega más abajo, se cae el script.
-- ============================================================

alter table partidos add column if not exists goles_a integer;
alter table partidos add column if not exists goles_b integer;

alter table partidos
  drop constraint if exists partidos_goles_razonables,
  add  constraint partidos_goles_razonables
       check (
         (goles_a is null or (goles_a >= 0 and goles_a <= 99))
         and (goles_b is null or (goles_b >= 0 and goles_b <= 99))
       );


-- ============================================================
-- 1. QUIÉN HIZO LOS GOLES
--
-- Lo carga el capitán, es opcional, y no cambia nada del armado de equipos:
-- lo que ordena sigue siendo la valoración de los compañeros. Está para que
-- el que hizo tres pueda mirarlo en su perfil, no para hacer un ranking.
-- ============================================================

create table if not exists goles (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade,
  cantidad integer not null,
  created_at timestamptz not null default now(),
  unique (partido_id, jugador_id),
  constraint goles_cantidad_razonable check (cantidad > 0 and cantidad <= 99)
);

alter table goles enable row level security;

drop policy if exists "ver goles" on goles;
create policy "ver goles" on goles for select using (true);

-- Los carga quien manda en ese partido, y solo si el jugador estuvo anotado.
drop policy if exists "cargar goles" on goles;
create policy "cargar goles" on goles
for insert
with check (
  exists (
    select 1 from partidos p
    where p.id = goles.partido_id
      and (
        p.admin_id in (select id from jugadores where user_id = auth.uid())
        or p.subcapitan_id in (select id from jugadores where user_id = auth.uid())
      )
  )
  and exists (
    select 1 from participantes pa
    where pa.partido_id = goles.partido_id and pa.jugador_id = goles.jugador_id
  )
);

drop policy if exists "corregir goles" on goles;
create policy "corregir goles" on goles
for update
using (
  exists (
    select 1 from partidos p
    where p.id = goles.partido_id
      and (
        p.admin_id in (select id from jugadores where user_id = auth.uid())
        or p.subcapitan_id in (select id from jugadores where user_id = auth.uid())
      )
  )
);

drop policy if exists "borrar goles" on goles;
create policy "borrar goles" on goles
for delete
using (
  exists (
    select 1 from partidos p
    where p.id = goles.partido_id
      and (
        p.admin_id in (select id from jugadores where user_id = auth.uid())
        or p.subcapitan_id in (select id from jugadores where user_id = auth.uid())
      )
  )
);


create or replace function goles_por_jugador(p_jugador_id uuid)
returns bigint
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select coalesce(sum(g.cantidad), 0)::bigint
  from goles g
  join partidos p on p.id = g.partido_id
  where g.jugador_id = p_jugador_id and p.estado <> 'cancelado';
$function$;


-- ============================================================
-- 2. NOVEDADES
--
-- Qué pasó desde la última vez que entraste. Va ordenado por urgencia y no
-- por fecha: primero lo que se te vence, después lo que te espera, y al
-- final lo que solo da gusto mirar.
--
-- Es lo que reemplaza al aviso por mail que no podemos mandar: si la app no
-- te cuenta qué pasó, se abre solo cuando te acordás.
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
  )
  select coalesce(
    jsonb_agg(to_jsonb(e) order by e.prioridad, e.cuando),
    '[]'::jsonb
  )
  from (select * from eventos limit 12) e;
$function$;


-- Confirmación.
select
  (select count(*) from information_schema.tables where table_name = 'goles') as tabla_goles,
  (select count(*) from information_schema.columns
     where table_name = 'partidos' and column_name in ('goles_a', 'goles_b')) as columnas,
  (select count(*) from pg_proc where proname in ('goles_por_jugador', 'novedades')) as funciones,
  (select jsonb_array_length(novedades())) as mis_novedades;
