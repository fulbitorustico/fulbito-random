-- ============================================================
-- 1. VALORACIÓN A CIEGAS
--
-- Una valoración queda guardada al instante pero no entra al promedio
-- hasta que cierra la ventana de 24hs del partido. Así nadie puede
-- mirar qué le pusieron y devolver el golpe: cuando se entera, ya pasó
-- el momento de responder.
--
-- Se toca solo el "qué se muestra". El anti-inflación (todos arrancan
-- en 3,0 hasta tener 3 valoraciones) queda exactamente igual.
--
-- 2. EVOLUCIÓN HISTÓRICA
-- Promedio mes a mes, para ver cómo venís y no solo dónde estás.
-- ============================================================


create or replace function valoraciones_promedio()
returns table(evaluado_id uuid, promedio numeric, cantidad bigint)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
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


create or replace function distribucion_valoraciones(p_evaluado_id uuid)
returns table(estrellas integer, cantidad bigint)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
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


create or replace function comentarios_recibidos(p_evaluado_id uuid)
returns table(comentario text, created_at timestamp with time zone)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
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


-- ============================================================
-- Evolución mes a mes. Devuelve el promedio de cada mes por separado
-- (forma reciente), no el acumulado: eso es lo que se mueve y lo que
-- da motivo para volver a mirar.
--
-- `cantidad` viaja para que la pantalla pueda apagar los meses flacos:
-- un mes con una sola valoración no dice nada.
-- ============================================================

create or replace function evolucion_jugador(p_jugador_id uuid)
returns table(mes text, promedio numeric, cantidad bigint)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
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


-- Confirmación: cuántas valoraciones están todavía en veda.
select
  (select count(*) from valoraciones v join partidos p on p.id = v.partido_id
     where p.fecha_hora + interval '24 hours' >= now()) as en_veda,
  (select count(*) from valoraciones) as total,
  (select count(*) from pg_proc where proname = 'evolucion_jugador') as evolucion_creada;
