-- ============================================================
-- 0011 — Tres cosas:
--   1. El link del partido, para invitar a quien no está en la app
--   2. La nota del capitán
--   3. Darse de baja de la app
-- ============================================================


-- ============================================================
-- 0. LAS COLUMNAS PRIMERO
--
-- Van todas juntas arriba a propósito: Postgres valida el cuerpo de una
-- función cuando la crea, así que si `partido_por_token` lee una columna
-- que se agrega más abajo, el script se cae entero. Nos pasó.
-- ============================================================

alter table partidos add column if not exists token text;
alter table partidos add column if not exists nota text;

-- "Cambió la cancha", "traigan cambio de $5.000", "llevo las pecheras".
-- No es un chat: es un solo mensaje que se edita, y lo escribe quien manda.
-- La escritura ya está cubierta por las políticas de editar el partido, que
-- contemplan al capitán y al subcapitán.
alter table partidos
  drop constraint if exists partidos_nota_razonable,
  add  constraint partidos_nota_razonable
       check (nota is null or (char_length(nota) <= 400 and nota !~* '(https?://|www\.)'));


-- ============================================================
-- 1. EL LINK DEL PARTIDO
--
-- El que arma el partido comparte un link. El que lo abre ve lo justo para
-- decidir si va —cancha, día, hora, cuántos faltan, quién invita— y un botón
-- para sumarse. Si no tiene cuenta, se la hace ahí mismo y queda anotado.
--
-- **El link da el partido, nunca el grupo.** Lo que se abre es esa fila y
-- nada más: no la lista de jugadores, no sus valoraciones, no los otros
-- partidos del grupo. Entrar al grupo sigue pasando por la regla del grupo.
-- ============================================================

-- Token corto y apto para una URL. 9 bytes al azar son 72 bits: no se adivina.
create or replace function generar_token_partido()
returns text
language sql
volatile
as $$
  select replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-');
$$;

update partidos set token = generar_token_partido() where token is null;

alter table partidos alter column token set default generar_token_partido();

create unique index if not exists partidos_token_unico on partidos (token);


-- Lo que ve alguien SIN cuenta. Devuelve lo mínimo para decidir si va.
-- Nunca devuelve quiénes están anotados ni sus valoraciones.
create or replace function partido_por_token(p_token text)
returns table (
  id uuid,
  cancha text,
  fecha_hora timestamptz,
  cupo_total integer,
  anotados bigint,
  lugares integer,
  invita text,
  es_de_grupo boolean,
  nota text,
  mapa_url text,
  estado text
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select
    p.id,
    p.cancha,
    p.fecha_hora,
    p.cupo_total,
    (select count(*) from participantes pa where pa.partido_id = p.id) as anotados,
    greatest(0, p.cupo_total - (select count(*) from participantes pa where pa.partido_id = p.id))::integer as lugares,
    coalesce(j.apodo, j.nombre) as invita,
    p.grupo_id is not null as es_de_grupo,
    p.nota,
    p.mapa_url,
    p.estado
  from partidos p
  left join jugadores j on j.id = p.admin_id
  where p.token = p_token
    and p.fecha_hora > now() - interval '1 hour';
$$;


-- Sumarse presentando el token. El token ES la autorización: por eso esta
-- función puede saltear la regla de visibilidad, que es justo la que
-- escondería un partido de un grupo ajeno.
create or replace function sumarme_con_token(p_token text)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  p partidos%rowtype;
  mi_jugador uuid;
begin
  select id into mi_jugador from jugadores where user_id = auth.uid();
  if mi_jugador is null then
    return 'sin_perfil';
  end if;

  select * into p from partidos where token = p_token;
  if not found then
    return 'no_existe';
  end if;

  if p.estado <> 'abierto' then return 'cerrado'; end if;
  if p.fecha_hora <= now() then return 'ya_paso'; end if;
  if (select count(*) from participantes pa where pa.partido_id = p.id) >= p.cupo_total then
    return 'lleno';
  end if;

  if exists (select 1 from participantes pa where pa.partido_id = p.id and pa.jugador_id = mi_jugador) then
    return 'ya_estabas';
  end if;

  insert into participantes (partido_id, jugador_id, confirmado_at)
  values (p.id, mi_jugador, now());

  return 'listo';
end;
$$;


-- ============================================================
-- 2. DARSE DE BAJA
--
-- Se borra la identidad —mail, nombre, apodo, foto, bio, ubicación— y la
-- cuenta de acceso. El paso por los partidos queda, sin nombre: también es
-- el historial de los demás, y borrarlo les rompería sus estadísticas y sus
-- valoraciones recibidas.
--
-- No se permite si dejás partidos futuros sin capitán: primero se pasa la
-- capitanía o se cancelan. Es la misma regla que ya rige para bajarse.
-- ============================================================

create or replace function borrar_mi_cuenta()
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  mi_jugador uuid;
  pendientes integer;
begin
  select id into mi_jugador from jugadores where user_id = auth.uid();
  if mi_jugador is null then return 'sin_perfil'; end if;

  select count(*) into pendientes
  from partidos
  where admin_id = mi_jugador and estado <> 'cancelado' and fecha_hora > now();

  if pendientes > 0 then
    return 'tenes_partidos:' || pendientes;
  end if;

  -- Se va la persona, queda el paso por la cancha.
  update jugadores set
    user_id = null,
    nombre = 'Jugador dado de baja',
    apodo = null,
    foto_url = null,
    avatar = null,
    bio = null,
    zona = null,
    buscando = false,
    disponibilidad = null,
    posiciones = null,
    posicion = null,
    avisos_mail = null
  where id = mi_jugador;

  delete from jugadores_ubicacion where jugador_id = mi_jugador;
  delete from auth.users where id = auth.uid();

  return 'listo';
end;
$$;


-- Confirmación.
select
  (select count(*) from partidos where token is null) as sin_token,
  (select count(*) from information_schema.columns
     where table_name = 'partidos' and column_name = 'nota') as columna_nota,
  (select count(*) from pg_proc where proname in
     ('partido_por_token', 'sumarme_con_token', 'borrar_mi_cuenta')) as funciones;
