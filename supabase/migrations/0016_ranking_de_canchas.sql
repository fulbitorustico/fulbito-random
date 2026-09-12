-- ============================================================
-- 0016 — El ranking de canchas contaba mal
--
-- `canchas_top` agrupaba por `partidos.cancha`, que es texto tipeado a mano,
-- mientras el resto del sistema agrupa por `cancha_id`. Con eso, "El Potrero",
-- "el potrero" y "El Potrero " eran tres canchas distintas en el panel.
--
-- Con diez partidos no se nota. Con cien, el ranking que se le muestra a un
-- dueño de complejo está mal — y ese ranking es justamente lo único que la
-- app tiene para ofrecerle.
--
-- De paso se va una subconsulta que recorría todos los partidos por cada
-- fila del agrupamiento.
--
-- Solo cambia ese bloque: el resto de panel_metricas queda igual.
-- ============================================================

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
    -- Agrupa por el perfil de cancha cuando existe, y si no por el nombre
    -- escrito a mano pero normalizado. Antes agrupaba por el texto crudo:
    -- "El Potrero" y "el potrero " eran dos canchas distintas, y el ranking
    -- que se le muestra a un dueño de complejo salía mal.
    'canchas_top', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.partidos desc), '[]'::jsonb) from (
        select t.nombre, count(*) as partidos, sum(t.anotados) as jugadores
        from (
          select
            coalesce(c.nombre, initcap(lower(trim(p.cancha)))) as nombre,
            (select count(*) from participantes pa where pa.partido_id = p.id) as anotados
          from partidos p
          left join canchas c on c.id = p.cancha_id
          where p.estado <> 'cancelado'
        ) t
        group by t.nombre
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


-- Confirmación.
--
-- OJO: acá NO se puede llamar a panel_metricas(), porque la función corta
-- si quien pregunta no es el creador — y en el editor de Supabase quien
-- ejecuta es la base, no una persona con sesión. Llamarla hacía fallar el
-- script entero y, como el editor corre todo en una transacción, deshacía
-- también el arreglo. Se verifica leyendo el código de la función.
select
  case
    when pg_get_functiondef(p.oid) like '%coalesce(c.nombre, initcap(lower(trim(p.cancha))))%'
    then 'listo: el ranking ya agrupa por cancha y no por texto suelto'
    else '*** NO se aplicó ***'
  end as estado
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'panel_metricas';
