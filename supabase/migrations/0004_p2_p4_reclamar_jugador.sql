-- ============================================================
-- PUNTO 2 · P4 — Los jugadores de demostración no se reclaman
--
-- Antes: "reclamar jugador" dejaba tomar cualquier jugador sin cuenta.
--        Está bien para el flujo real ("reclamá tu perfil"), pero los 12
--        jugadores de demo también entraban — y vienen con valoraciones e
--        insignias puestas. Alguien podía quedarse con "Camilo Ninja".
-- Ahora: se excluyen los que tienen es_demo = true.
--
-- El coalesce es por si la columna admite vacíos: vacío cuenta como "no es demo".
-- ============================================================

drop policy if exists "reclamar jugador" on jugadores;

create policy "reclamar jugador" on jugadores
for update
using (user_id is null and coalesce(es_demo, false) = false)
with check (user_id = auth.uid() and coalesce(es_demo, false) = false);

-- Confirmación.
select
  cmd || ' · ' || policyname as politica,
  coalesce(qual, '—') as ver,
  coalesce(with_check, '—') as escribir
from pg_policies
where schemaname = 'public' and tablename = 'jugadores'
order by cmd, policyname;
