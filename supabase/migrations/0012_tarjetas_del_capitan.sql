-- ============================================================
-- 0012 — Las tarjetas del capitán
--
-- Antes: bajarse de un partido propio se contaba, y a la tercera vez en dos
--        meses aparecía un aviso en el perfil. No pasaba nada más.
-- Ahora: cada abandono es una AMARILLA. Dos amarillas en dos meses son
--        ROJA, y la roja te deja dos fechas sin poder armar partidos.
--
-- La suspensión se cumple JUGANDO, no esperando: jugás dos partidos y
-- volvés. Es a propósito — esperar sentado no repara nada, y el que se
-- borró de la app dos meses no debería volver con la ficha limpia.
--
-- Solo se sanciona esto. Bajarse de un partido ajeno tiene su medida
-- aparte (la confiabilidad); armar un partido y dejarlo tirado es un
-- compromiso con nueve personas más, y es otra cosa.
-- ============================================================

create or replace function sanciones_de_capitan(p_jugador_id uuid)
returns table (amarillas bigint, roja boolean, partidos_para_volver integer)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_amarillas bigint;
  v_segunda timestamptz;
  v_jugados integer;
begin
  -- Cada abandono de un partido propio, en los últimos dos meses.
  select count(*) into v_amarillas
  from bajas b
  join partidos p on p.id = b.partido_id
  where b.jugador_id = p_jugador_id
    and b.era_capitan
    and p.fecha_hora > now() - interval '60 days';

  if v_amarillas < 2 then
    return query select v_amarillas, false, 0;
    return;
  end if;

  -- Cuándo llegó la segunda: desde ahí corre la suspensión.
  select p.fecha_hora into v_segunda
  from bajas b
  join partidos p on p.id = b.partido_id
  where b.jugador_id = p_jugador_id
    and b.era_capitan
    and p.fecha_hora > now() - interval '60 days'
  order by p.fecha_hora
  offset 1 limit 1;

  -- Partidos jugados de verdad después de la segunda amarilla.
  select count(*) into v_jugados
  from participantes pa
  join partidos p on p.id = pa.partido_id
  where pa.jugador_id = p_jugador_id
    and p.fecha_hora > v_segunda
    and p.fecha_hora < now()
    and p.estado <> 'cancelado';

  return query select
    v_amarillas,
    v_jugados < 2,
    greatest(0, 2 - v_jugados)::integer;
end;
$$;


-- Atajo para usar dentro de las políticas, que necesitan un sí o un no.
create or replace function capitan_suspendido(p_jugador_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select coalesce((select roja from sanciones_de_capitan(p_jugador_id)), false);
$$;


-- La roja se hace valer acá: sin esto es un cartel de colores.
drop policy if exists "crear partido" on partidos;

create policy "crear partido" on partidos
for insert
with check (
  -- El capitán sos vos, no otro.
  admin_id in (select id from jugadores where user_id = auth.uid())
  -- Ni partidos viejos ni fechas inventadas a años vista.
  and fecha_hora > now() - interval '1 hour'
  and fecha_hora < now() + interval '6 months'
  -- Y no estás suspendido por dejar tirados los tuyos.
  and not capitan_suspendido(admin_id)
);


-- Confirmación.
select
  (select count(*) from pg_proc where proname in ('sanciones_de_capitan', 'capitan_suspendido')) as funciones,
  (select count(*) from pg_policies
     where tablename = 'partidos' and policyname = 'crear partido') as politica,
  (select count(*) from bajas where era_capitan) as amarillas_hoy;
