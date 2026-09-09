-- ============================================================
-- CONFIRMAR ASISTENCIA — el lugar se libera solo
--
-- Cómo funciona:
--   · Desde 24hs antes, al anotado se le pide "¿venís?".
--   · A las 12hs antes, el que no confirmó pierde el lugar y entra otro.
--   · El capitán y el subcapitán nunca se liberan: son los que organizan.
--   · Anotarse dentro de las 24hs ya cuenta como confirmación: acabás de
--     decir que venís, no tiene sentido volver a preguntártelo.
--
-- No hay tarea programada corriendo de fondo. La liberación la dispara
-- la propia app cada vez que alguien abre el partido, que en la práctica
-- es todo el tiempo. Cuando exista el aviso push habrá que revisarlo.
-- ============================================================

alter table participantes add column if not exists confirmado_at timestamptz;

-- A los que ya están anotados se les da por confirmada la asistencia.
-- Si no, el primer partido que se abra después de correr esto echaría a
-- gente que nunca tuvo la chance de confirmar.
update participantes set confirmado_at = created_at where confirmado_at is null;


-- Anotarse sobre la hora ya es confirmar.
create or replace function participantes_confirmar_sobre_la_hora()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.confirmado_at is null
     and (select fecha_hora from partidos where id = new.partido_id) < now() + interval '24 hours' then
    new.confirmado_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists participantes_confirmar_al_anotarse on participantes;
create trigger participantes_confirmar_al_anotarse
before insert on participantes
for each row execute function participantes_confirmar_sobre_la_hora();


-- Poder decir "voy". La política de asignar equipo ya existe y es del
-- capitán; las dos conviven, cada una habilita lo suyo.
drop policy if exists "confirmar que voy" on participantes;

create policy "confirmar que voy" on participantes
for update
using (jugador_id in (select id from jugadores where user_id = auth.uid()));


-- La liberación. Devuelve cuántos lugares soltó, por si algún día se quiere
-- avisar "se liberaron 2 lugares".
create or replace function liberar_lugares_sin_confirmar(p_partido_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  p partidos%rowtype;
  liberados integer := 0;
begin
  select * into p from partidos where id = p_partido_id;
  if not found then return 0; end if;

  -- Solo dentro de la franja: desde 12hs antes hasta que arranca.
  -- Fuera de ahí no se toca a nadie.
  if p.estado <> 'abierto'
     or p.fecha_hora > now() + interval '12 hours'
     or p.fecha_hora <= now() then
    return 0;
  end if;

  with sacados as (
    delete from participantes pa
    where pa.partido_id = p.id
      and pa.confirmado_at is null
      and pa.jugador_id <> p.admin_id
      and (p.subcapitan_id is null or pa.jugador_id <> p.subcapitan_id)
    returning pa.jugador_id
  )
  insert into bajas (partido_id, jugador_id, horas_antes)
  select p.id, s.jugador_id, extract(epoch from (p.fecha_hora - now())) / 3600
  from sacados s
  on conflict do nothing;

  get diagnostics liberados = row_count;
  return liberados;
end;
$$;


-- Confirmación.
select
  (select count(*) from information_schema.columns
    where table_name = 'participantes' and column_name = 'confirmado_at') as columna,
  (select count(*) from pg_policies
    where tablename = 'participantes' and policyname = 'confirmar que voy') as politica,
  (select count(*) from pg_trigger where tgname = 'participantes_confirmar_al_anotarse') as disparador,
  (select count(*) from participantes where confirmado_at is null) as sin_confirmar;
