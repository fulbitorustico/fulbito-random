-- ============================================================
-- PUNTO 2 · P1 — Crear partido solo a nombre propio
--
-- Antes: "crear partido" tenía la condición literal `true`.
--        Cualquiera podía crear partidos poniendo a otro de capitán.
-- Ahora: admin_id tiene que ser tu propio jugador, y la fecha
--        tiene que caer en una ventana razonable.
--
-- El último bloque muestra cómo quedó, para confirmar.
-- ============================================================

drop policy if exists "crear partido" on partidos;

create policy "crear partido" on partidos
for insert
with check (
  -- El capitán sos vos, no otro.
  admin_id in (select id from jugadores where user_id = auth.uid())
  -- Ni partidos viejos ni fechas inventadas a años vista.
  -- Una hora de gracia para atrás: si lo cargás justo cuando arranca, entra.
  and fecha_hora > now() - interval '1 hour'
  and fecha_hora < now() + interval '6 months'
);

-- Confirmación: debería aparecer una sola fila de INSERT sobre partidos.
select
  cmd || ' · ' || policyname as politica,
  coalesce(with_check, '—') as escribir
from pg_policies
where schemaname = 'public' and tablename = 'partidos'
order by cmd, policyname;
