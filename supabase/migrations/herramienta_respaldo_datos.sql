-- ============================================================
-- RESPALDO DE LOS DATOS — solo lectura, no modifica nada
--
-- El repositorio guarda el código y la FORMA de la base (0000_esquema_base).
-- Lo que no guarda es el CONTENIDO: los jugadores, los partidos, las
-- valoraciones. Esto lo saca en JSON, listo para bajar.
--
-- CÓMO USARLO
--   1. Correlo en Supabase → SQL Editor → Run.
--   2. Tocá "Export" arriba del resultado y guardá el archivo con la fecha.
--   3. Guardalo fuera del disco de trabajo (Drive, mail, donde sea).
--
-- CADA CUÁNTO: una vez por semana mientras haya poca gente, y antes de
-- correr cualquier migración que borre o transforme datos.
--
-- LO QUE NO SALE ACÁ:
--   · Las cuentas de acceso (`auth.users`). Son de Supabase y no se tocan
--     desde el editor. Si se pierden, la gente vuelve a entrar con su mail
--     y reclama su jugador — por eso importa no perder `jugadores.user_id`.
--   · Las fotos de perfil (bucket `avatares` de Storage).
--
-- CÓMO SE RESTAURA: se crea una base nueva, se corre `0000_esquema_base.sql`
-- y después se insertan los datos desde este JSON. No es automático, pero
-- con este archivo la información existe; sin él, no.
-- ============================================================

select jsonb_pretty(jsonb_build_object(
  'generado',            to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD HH24:MI'),
  'jugadores',           (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from jugadores t),
  'grupos',              (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from grupos t),
  'grupo_miembros',      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from grupo_miembros t),
  'solicitudes_grupo',   (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from solicitudes_grupo t),
  'canchas',             (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from canchas t),
  'partidos',            (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from partidos t),
  'participantes',       (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from participantes t),
  'bajas',               (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from bajas t),
  'goles',               (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from goles t),
  'valoraciones',        (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from valoraciones t),
  'valoraciones_cancha', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from valoraciones_cancha t),
  'insignias_otorgadas', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from insignias_otorgadas t),
  'mvp_votos',           (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from mvp_votos t),
  'invitaciones',        (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from invitaciones t),
  'reacciones_partido',  (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from reacciones_partido t),
  'sugerencias',         (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from sugerencias t),
  'bloqueos',            (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from bloqueos t),
  'jugadores_ubicacion', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from jugadores_ubicacion t),
  'logros_vistos',       (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from logros_vistos t)
)) as respaldo;
