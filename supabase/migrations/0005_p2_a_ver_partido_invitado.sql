-- ============================================================
-- OPCIÓN A — El invitado puede ver el partido al que lo invitaron
--
-- Antes: solo veías los partidos sin grupo y los de tus grupos.
--        Con lo cual el invitado de afuera podía anotarse (P2) a un partido
--        que después no podía abrir: le decía "este partido no existe".
-- Ahora: además ves el partido al que te invitaron, y el partido en el que
--        ya estás anotado. Se abre esa fila puntual, no el grupo.
--
-- Igual que en P2, el chequeo va en una función security definer: si lo
-- pusiera suelto en la política, la regla de ver partidos terminaría
-- mirándose a sí misma a través de invitaciones y la base lo rechaza.
-- ============================================================

create or replace function tengo_acceso_al_partido(p_partido_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Te invitaron a este partido: el capitán quiso que lo vieras.
    exists (
      select 1
      from invitaciones i
      join jugadores j on j.id = i.invitado_id
      where i.partido_id = p_partido_id and j.user_id = auth.uid()
    )
    -- Ya estás anotado: el partido es tuyo aunque no seas del grupo.
    or exists (
      select 1
      from participantes pa
      join jugadores j on j.id = pa.jugador_id
      where pa.partido_id = p_partido_id and j.user_id = auth.uid()
    );
$$;

drop policy if exists "ver partidos" on partidos;

create policy "ver partidos" on partidos
for select
using (
  grupo_id is null
  or grupo_id in (
    select gm.grupo_id
    from grupo_miembros gm
    join jugadores j on j.id = gm.jugador_id
    where j.user_id = auth.uid()
  )
  or tengo_acceso_al_partido(id)
);

-- Confirmación.
select
  cmd || ' · ' || policyname as politica,
  coalesce(qual, with_check, '—') as condicion
from pg_policies
where schemaname = 'public' and tablename = 'partidos'
order by cmd, policyname;
