-- ============================================================
-- Tres cosas:
--   1. Buzón de sugerencias (lo lee solo el creador)
--   2. Reacciones con emoji en el partido
--   3. La mancha del capitán que abandona
-- ============================================================


-- ============================================================
-- 1. SUGERENCIAS
-- Cualquiera manda; las lee solo quien tenga es_admin. Nadie ve las de
-- los demás, ni siquiera las propias: es un buzón, no un foro.
-- ============================================================

create table if not exists sugerencias (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid references jugadores(id) on delete set null,
  texto text not null,
  pantalla text,
  estado text not null default 'nueva',
  created_at timestamptz not null default now(),
  constraint sugerencias_texto_razonable check (char_length(texto) between 3 and 1000),
  constraint sugerencias_estado_valido check (estado in ('nueva', 'vista', 'hecha', 'descartada'))
);

alter table sugerencias enable row level security;

drop policy if exists "mandar sugerencia" on sugerencias;
create policy "mandar sugerencia" on sugerencias
for insert
with check (jugador_id in (select id from jugadores where user_id = auth.uid()));

drop policy if exists "leer sugerencias" on sugerencias;
create policy "leer sugerencias" on sugerencias
for select
using (exists (select 1 from jugadores where user_id = auth.uid() and es_admin));

drop policy if exists "marcar sugerencia" on sugerencias;
create policy "marcar sugerencia" on sugerencias
for update
using (exists (select 1 from jugadores where user_id = auth.uid() and es_admin));

-- Cinco por día alcanzan de sobra y evitan que el buzón se llene de basura.
create or replace function limitar_sugerencias_por_dia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from sugerencias
    where jugador_id = new.jugador_id and created_at > now() - interval '1 day'
  ) >= 5 then
    raise exception 'Ya mandaste 5 sugerencias hoy. Seguimos mañana.';
  end if;
  return new;
end;
$$;

drop trigger if exists sugerencias_tope_diario on sugerencias;
create trigger sugerencias_tope_diario
before insert on sugerencias
for each row execute function limitar_sugerencias_por_dia();


-- ============================================================
-- 2. REACCIONES
-- Una reacción por emoji y por persona en cada partido: se prende y
-- se apaga. Reaccionan solo los que estuvieron anotados.
-- ============================================================

create table if not exists reacciones_partido (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (partido_id, jugador_id, emoji),
  constraint reacciones_emoji_corto check (char_length(emoji) between 1 and 8)
);

alter table reacciones_partido enable row level security;

drop policy if exists "ver reacciones" on reacciones_partido;
create policy "ver reacciones" on reacciones_partido for select using (true);

drop policy if exists "reaccionar" on reacciones_partido;
create policy "reaccionar" on reacciones_partido
for insert
with check (
  jugador_id in (select id from jugadores where user_id = auth.uid())
  and exists (
    select 1 from participantes pa
    where pa.partido_id = reacciones_partido.partido_id
      and pa.jugador_id = reacciones_partido.jugador_id
  )
);

drop policy if exists "sacar mi reaccion" on reacciones_partido;
create policy "sacar mi reaccion" on reacciones_partido
for delete
using (jugador_id in (select id from jugadores where user_id = auth.uid()));


-- ============================================================
-- 3. LA MANCHA DEL CAPITÁN
--
-- Bajarse de un partido que vos armaste no es lo mismo que bajarte de
-- uno ajeno: dejás a diez personas colgadas. Se anota aparte y se
-- muestra a partir de la tercera vez en dos meses.
-- ============================================================

alter table bajas add column if not exists era_capitan boolean not null default false;

create or replace function abandonos_de_capitan()
returns table (jugador_id uuid, cantidad bigint)
language sql
stable
security definer
set search_path = public
as $$
  -- Se filtra por la fecha del partido y no por la de la baja, para no
  -- depender de que `bajas` tenga columna de fecha propia.
  select b.jugador_id, count(*) as cantidad
  from bajas b
  join partidos p on p.id = b.partido_id
  where b.era_capitan and p.fecha_hora > now() - interval '60 days'
  group by b.jugador_id;
$$;


-- Confirmación.
select
  (select count(*) from information_schema.tables where table_name = 'sugerencias') as tabla_sugerencias,
  (select count(*) from information_schema.tables where table_name = 'reacciones_partido') as tabla_reacciones,
  (select count(*) from information_schema.columns
     where table_name = 'bajas' and column_name = 'era_capitan') as columna_capitan,
  (select count(*) from pg_policies where tablename in ('sugerencias', 'reacciones_partido')) as politicas;
