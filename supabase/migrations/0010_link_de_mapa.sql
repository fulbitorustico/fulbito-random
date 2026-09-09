-- ============================================================
-- 0010 — El link del mapa
--
-- El buscador por nombre falla seguido: OpenStreetMap tiene la geometría de
-- las canchas pero casi ninguna con nombre. Así que el que arma el partido
-- puede pegar el link de Google Maps, que es gratis y no tiene límite,
-- en vez de que la app le pague la API a Google.
--
-- Si el link es de los largos, la app le saca las coordenadas sola. Si es
-- de los cortos (los que da "Compartir" en el celular), el link se guarda
-- igual: sirve para "Cómo llegar" aunque no sepamos dónde queda.
-- ============================================================

alter table partidos add column if not exists mapa_url text;

alter table partidos
  drop constraint if exists partidos_mapa_url_sano,
  add  constraint partidos_mapa_url_sano
       check (
         mapa_url is null
         or (char_length(mapa_url) <= 500 and mapa_url ~* '^https://[a-z0-9.-]*(google\.[a-z.]+|goo\.gl)/')
       );

-- Confirmación.
select
  (select count(*) from information_schema.columns
     where table_name = 'partidos' and column_name = 'mapa_url') as columna,
  (select count(*) from pg_constraint where conname = 'partidos_mapa_url_sano') as restriccion;
