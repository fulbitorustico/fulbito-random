-- ============================================================
-- PUNTO 2 · P2 — Sumarse solo a partidos a los que podés entrar
--
-- Antes: "sumarse a partido" solo miraba que el jugador_id fuera el tuyo.
--        Se podía entrar a partidos de grupos privados ajenos, a partidos
--        llenos, a partidos viejos y a los de "solo confiables".
--
-- El chequeo va adentro de una función security definer a propósito:
-- si lo pusiera suelto en la política, la propia regla de visibilidad de
-- `partidos` escondería el partido privado y el que fue invitado no podría
-- entrar nunca. La función ve la tabla entera y decide con reglas explícitas.
-- ============================================================

create or replace function puede_sumarse_al_partido(p_partido_id uuid, p_jugador_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from partidos p
    where p.id = p_partido_id

      -- Ni cancelado ni cerrado. El coalesce es por si la columna viniera vacía.
      and coalesce(p.estado, 'abierto') = 'abierto'

      -- Nada de anotarse a partidos que ya pasaron.
      and p.fecha_hora > now() - interval '1 hour'

      -- Queda lugar.
      and (select count(*) from participantes pa where pa.partido_id = p.id) < p.cupo_total

      -- El partido es visible para vos, o te invitaron a ese partido.
      and (
        p.grupo_id is null
        or exists (
          select 1 from grupo_miembros gm
          where gm.grupo_id = p.grupo_id and gm.jugador_id = p_jugador_id
        )
        or exists (
          select 1 from invitaciones i
          where i.partido_id = p.id and i.invitado_id = p_jugador_id and i.estado = 'pendiente'
        )
      )

      -- "Solo confiables": lo mismo que muestra la pantalla (hasta 1 baja tardía).
      -- El capitán y el subcapitán entran siempre a su propio partido, y una
      -- invitación directa también abre la puerta: si el capitán te eligió a
      -- mano, no tiene sentido que la base te frene.
      and (
        coalesce(p.apertura, 'abierto') <> 'solo_confiables'
        or p.admin_id = p_jugador_id
        or p.subcapitan_id = p_jugador_id
        or exists (
          select 1 from invitaciones i
          where i.partido_id = p.id and i.invitado_id = p_jugador_id and i.estado = 'pendiente'
        )
        or coalesce(
             (select cantidad from bajas_tardias_por_jugador() where jugador_id = p_jugador_id),
             0
           ) <= 1
      )
  );
$$;

drop policy if exists "sumarse a partido" on participantes;

create policy "sumarse a partido" on participantes
for insert
with check (
  -- Te anotás vos, no a otro.
  jugador_id in (select id from jugadores where user_id = auth.uid())
  and puede_sumarse_al_partido(partido_id, jugador_id)
);

-- Confirmación.
select
  cmd || ' · ' || policyname as politica,
  coalesce(with_check, qual, '—') as condicion
from pg_policies
where schemaname = 'public' and tablename = 'participantes'
order by cmd, policyname;
