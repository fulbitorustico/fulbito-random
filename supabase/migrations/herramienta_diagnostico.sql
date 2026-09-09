-- ============================================================
-- DIAGNÓSTICO — Correr en Supabase → SQL Editor → Run
--
-- No modifica NADA: solo lee y muestra cómo está configurada la base.
-- Es UNA sola consulta a propósito: el editor de Supabase muestra
-- únicamente el resultado del último bloque, así que si son varios
-- se ven solo los del final.
--
-- Copiá toda la tabla de resultados y pasásela a Claude Code.
-- ============================================================

with politicas as (
  select
    '1. PERMISOS' as seccion,
    tablename || ' → ' || cmd as item,
    policyname as detalle,
    'VER: ' || coalesce(qual, '—') || '   /   ESCRIBIR: ' || coalesce(with_check, '—') as valor
  from pg_policies
  where schemaname = 'public'
),
seguridad as (
  select
    '2. SEGURIDAD POR TABLA' as seccion,
    c.relname as item,
    case when c.relrowsecurity then 'activada' else '*** DESACTIVADA ***' end as detalle,
    '' as valor
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
restricciones as (
  select
    '3. RESTRICCIONES' as seccion,
    conrelid::regclass::text as item,
    case contype when 'u' then 'única' when 'c' then 'chequeo' when 'p' then 'clave' else contype::text end as detalle,
    pg_get_constraintdef(oid) as valor
  from pg_constraint
  where connamespace = 'public'::regnamespace
    and contype in ('u', 'c', 'p')
),
disparadores as (
  select
    '4. DISPARADORES' as seccion,
    c.relname as item,
    t.tgname as detalle,
    p.proname as valor
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_proc p on p.oid = t.tgfoid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and not t.tgisinternal
),
conteos as (
  select '5. CUÁNTA DATA HAY' as seccion, t.tabla as item, t.filas::text as detalle, '' as valor
  from (
    select 'jugadores' as tabla, count(*) as filas from jugadores
    union all select 'jugadores (demo)', count(*) from jugadores where es_demo
    union all select 'partidos', count(*) from partidos
    union all select 'participantes', count(*) from participantes
    union all select 'valoraciones', count(*) from valoraciones
    union all select 'insignias_otorgadas', count(*) from insignias_otorgadas
    union all select 'mvp_votos', count(*) from mvp_votos
    union all select 'grupos', count(*) from grupos
    union all select 'canchas', count(*) from canchas
    union all select 'valoraciones_cancha', count(*) from valoraciones_cancha
    union all select 'invitaciones', count(*) from invitaciones
  ) t
),
estados as (
  select
    '6. PARTIDOS POR ESTADO' as seccion,
    e.estado_real as item,
    e.cantidad::text as detalle,
    '' as valor
  from (
    select
      case
        when estado = 'cancelado' then 'cancelado'
        when fecha_hora > now() then 'programado'
        when fecha_hora > now() - interval '2 hours' then 'en juego'
        else 'terminado'
      end as estado_real,
      count(*) as cantidad
    from partidos
    group by 1
  ) e
),
huerfanos as (
  -- Valoraciones hechas por alguien que NO jugó ese partido.
  -- Si esto devuelve algo distinto de 0, el agujero ya se usó.
  select
    '7. CONTROL DE INTEGRIDAD' as seccion,
    'valoraciones de gente que no jugó' as item,
    count(*)::text as detalle,
    'debería ser 0' as valor
  from valoraciones v
  where not exists (
    select 1 from participantes p
    where p.partido_id = v.partido_id and p.jugador_id = v.evaluador_id
  )
)
select * from politicas
union all select * from seguridad
union all select * from restricciones
union all select * from disparadores
union all select * from conteos
union all select * from estados
union all select * from huerfanos
order by seccion, item, detalle;
