-- ============================================================
-- PUNTO 2 · P3 — El subcapitán también puede armar los equipos
--
-- Antes: "asignar equipo" solo contemplaba a partidos.admin_id.
--        La pantalla le muestra el botón al subcapitán, pero la base
--        rechazaba el cambio en silencio.
-- Es el mismo arreglo que ya se hizo para las invitaciones.
-- ============================================================

drop policy if exists "asignar equipo" on participantes;

create policy "asignar equipo" on participantes
for update
using (
  partido_id in (
    select p.id
    from partidos p
    where p.admin_id in (select id from jugadores where user_id = auth.uid())
       or p.subcapitan_id in (select id from jugadores where user_id = auth.uid())
  )
);

-- Confirmación.
select
  cmd || ' · ' || policyname as politica,
  coalesce(qual, with_check, '—') as condicion
from pg_policies
where schemaname = 'public' and tablename = 'participantes'
order by cmd, policyname;
