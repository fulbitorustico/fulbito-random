-- ============================================================
-- 0015 — Filtrar por horario y por edad en el buscador
--
-- Pedido por un usuario en las primeras horas de uso: "en buscar equipo
-- agregaría la opción de agregar un rango horario y el rango etario".
--
-- La franja sale de lo que cada uno ya eligió en su disponibilidad
-- (mañana / tarde / noche): no hace falta pedir nada nuevo.
-- La edad sí necesita un dato que no teníamos, y es opcional — quien no lo
-- carga sigue apareciendo, salvo que el que busca pida un rango explícito.
--
-- De paso, los amigos aparecen primero: es lo que le da sentido a haberlos
-- agregado.
--
-- Las columnas van arriba de todo, como siempre.
-- ============================================================

alter table jugadores add column if not exists anio_nacimiento smallint;

-- El tope de arriba es fijo y no calculado: una restricción de chequeo no
-- admite funciones que cambian con el tiempo, como now().
alter table jugadores
  drop constraint if exists jugadores_anio_razonable,
  add  constraint jugadores_anio_razonable
       check (anio_nacimiento is null or (anio_nacimiento >= 1930 and anio_nacimiento <= 2015));


-- Cambian las columnas que devuelve, así que hay que tirarla antes:
-- `create or replace` no puede cambiar la forma del resultado.
drop function if exists jugadores_disponibles(numeric, numeric, integer, text);

create or replace function jugadores_disponibles(
  p_lat numeric,
  p_lng numeric,
  p_km integer default 10,
  p_posicion text default null::text,
  p_franjas text[] default null::text[],
  p_edad_min integer default null::integer,
  p_edad_max integer default null::integer
)
returns table (
  jugador_id uuid,
  nombre text,
  apodo text,
  avatar text,
  foto_url text,
  posiciones text[],
  zona text,
  bio text,
  disponibilidad text[],
  promedio numeric,
  cantidad bigint,
  distancia_km numeric,
  edad integer,
  es_amigo boolean
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  with yo as (
    select id from jugadores where user_id = auth.uid()
  ),
  candidatos as (
    select
      j.*,
      case
        when j.anio_nacimiento is null then null
        else extract(year from now())::int - j.anio_nacimiento
      end as edad_calc,
      exists (
        select 1 from amistades a
        where a.estado = 'aceptada'
          and (
            (a.solicitante_id = (select id from yo) and a.destinatario_id = j.id)
            or (a.solicitante_id = j.id and a.destinatario_id = (select id from yo))
          )
      ) as amigo,
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
    round(c.dist::numeric, 1) as distancia_km,
    c.edad_calc as edad,
    c.amigo as es_amigo
  from candidatos c
  left join valoraciones_promedio() vp on vp.evaluado_id = c.id
  where (p_posicion is null or p_posicion = any(c.posiciones))
    and (c.dist is null or c.dist <= p_km)
    -- La franja se cruza con lo que la persona ya eligió. Si no cargó
    -- disponibilidad, no se la esconde: quiere decir "cualquier día".
    and (
      p_franjas is null
      or array_length(p_franjas, 1) is null
      or c.disponibilidad is null
      or array_length(c.disponibilidad, 1) is null
      or c.disponibilidad && p_franjas
    )
    -- La edad solo filtra a quien la cargó. Al que no la puso no se lo
    -- castiga escondiéndolo, salvo que se pida un rango.
    and (p_edad_min is null or (c.edad_calc is not null and c.edad_calc >= p_edad_min))
    and (p_edad_max is null or (c.edad_calc is not null and c.edad_calc <= p_edad_max))
  order by c.amigo desc, c.dist nulls last, c.nombre;
$function$;


-- Confirmación.
select
  (select count(*) from information_schema.columns
     where table_name = 'jugadores' and column_name = 'anio_nacimiento') as columna_edad,
  (select count(*) from pg_proc where proname = 'jugadores_disponibles') as funcion,
  (select count(*) from pg_constraint where conname = 'jugadores_anio_razonable') as restriccion;
