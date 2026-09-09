-- ============================================================
-- GENERAR EL ESQUEMA BASE — solo lectura, no modifica nada
--
-- Devuelve el esquema completo de la base como texto, línea por línea:
-- tablas, restricciones, índices, seguridad, políticas, funciones y
-- disparadores. Es lo que falta para que la carpeta de migraciones pueda
-- reconstruir la base desde cero.
--
-- CÓMO USARLO
--   1. Correlo en Supabase → SQL Editor → Run.
--   2. Tocá "Export" arriba a la derecha del resultado y bajá el archivo.
--   3. Pasámelo y yo armo el `0000_esquema_base.sql`.
--
-- Es el reemplazo de `npx supabase db pull` para cuando no se puede abrir
-- una terminal ni iniciar sesión.
--
-- LO QUE NO CAPTURA: tipos propios (enums), secuencias sueltas, permisos por
-- rol, disparadores de eventos, los buckets de Storage y la configuración de
-- Auth. Si la base usara alguno, hay que agregarlo a mano.
--
-- LO QUE HAY QUE ORDENAR AL ARMAR EL ARCHIVO (el volcado sale alfabético):
--   1. `set check_function_bodies = off;` arriba de todo. Sin eso hay que
--      ordenar las funciones entre sí, porque varias se llaman entre ellas.
--   2. Las funciones que usan los valores por defecto de una tabla van
--      ANTES que esa tabla (acá: `generar_token_partido`, que usa
--      `partidos.token`).
--   3. Las políticas van DESPUÉS de las funciones: varias las llaman.
-- ============================================================

with tablas as (
  select
    1 as orden,
    c.relname as nombre,
    'create table if not exists public.' || quote_ident(c.relname) || ' (' || chr(10) ||
    string_agg(
      '  ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
        || case when a.attnotnull then ' not null' else '' end
        || case
             when ad.adbin is not null then ' default ' || pg_get_expr(ad.adbin, ad.adrelid)
             else ''
           end,
      ',' || chr(10) order by a.attnum
    ) || chr(10) || ');' as ddl
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef ad on ad.adrelid = c.oid and ad.adnum = a.attnum
  where n.nspname = 'public' and c.relkind = 'r'
  group by c.relname
),
restricciones as (
  select
    2 as orden,
    conrelid::regclass::text as nombre,
    'alter table public.' || quote_ident(conrelid::regclass::text)
      || ' drop constraint if exists ' || quote_ident(conname) || ';' || chr(10)
      || 'alter table public.' || quote_ident(conrelid::regclass::text)
      || ' add constraint ' || quote_ident(conname) || ' ' || pg_get_constraintdef(oid) || ';' as ddl
  from pg_constraint
  where connamespace = 'public'::regnamespace and contype in ('p', 'u', 'f', 'c')
),
indices as (
  select 3 as orden, tablename as nombre, indexdef || ';' as ddl
  from pg_indexes
  where schemaname = 'public'
    and indexname not in (select conname from pg_constraint where connamespace = 'public'::regnamespace)
),
seguridad as (
  select
    4 as orden,
    c.relname as nombre,
    'alter table public.' || quote_ident(c.relname) || ' enable row level security;' as ddl
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
),
politicas as (
  select
    5 as orden,
    tablename as nombre,
    'drop policy if exists ' || quote_ident(policyname) || ' on public.' || quote_ident(tablename) || ';' || chr(10)
      || 'create policy ' || quote_ident(policyname) || ' on public.' || quote_ident(tablename)
      || ' for ' || lower(cmd)
      || ' to ' || array_to_string(roles, ', ')
      || coalesce(' using (' || qual || ')', '')
      || coalesce(' with check (' || with_check || ')', '')
      || ';' as ddl
  from pg_policies
  where schemaname = 'public'
),
funciones as (
  select 6 as orden, p.proname as nombre, pg_get_functiondef(p.oid) || ';' as ddl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f'
),
disparadores as (
  select 7 as orden, c.relname as nombre, pg_get_triggerdef(t.oid) || ';' as ddl
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and not t.tgisinternal
),
todo as (
  select * from tablas
  union all select * from restricciones
  union all select * from indices
  union all select * from seguridad
  union all select * from politicas
  union all select * from funciones
  union all select * from disparadores
)
select ddl
from todo
order by orden, nombre;
