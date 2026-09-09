# Cambios en la base de datos

Todo lo que toca la base vive acá, numerado y dentro del repositorio. Antes vivía en archivos sueltos fuera del proyecto, y eso significaba que si se perdía Supabase no había forma de reconstruir nada.

## La regla, en una línea

**Ningún cambio en la base existe hasta que está en un archivo de esta carpeta.** Ni una política, ni una columna, ni una función. Si se corrió en el editor de Supabase y no quedó acá, se va a perder.

## Cómo agregar un cambio

1. Creá un archivo con el número que sigue y un nombre que diga qué hace:
   `0010_lista_de_espera.sql`
2. Escribilo para que se pueda correr **dos veces sin romperse**. En la práctica:
   - `create table if not exists`
   - `alter table ... add column if not exists`
   - `drop policy if exists` antes de cada `create policy`
   - `create or replace function`
   - Para restricciones: `drop constraint if exists` y después `add constraint`
3. Arriba de todo, un comentario que explique **qué estaba mal antes** y **qué queda después**. El código dice qué hace; el comentario tiene que decir por qué.
4. Terminalo con un `select` de confirmación que devuelva números fáciles de leer. Es lo que se pega de vuelta para verificar que entró.
5. Corrélo en Supabase → SQL Editor → Run.
6. Commiteá el archivo **en el mismo commit** que el código de la app que lo necesita.

### Las columnas primero, siempre

Dentro de un mismo archivo, **todos los `alter table ... add column` van arriba de todo**, antes de cualquier función.

Postgres valida el cuerpo de una función cuando la crea. Si una función lee una columna que el mismo script agrega más abajo, falla al crearla — y como el editor corre todo en una transacción, se cae el script entero y no queda nada aplicado. Nos pasó con la `0011`: `partido_por_token` leía `nota` y la columna se creaba cincuenta líneas después.

## Tres trampas que ya nos mordieron

**Correlas en orden y no te saltees ninguna.** La `0012` falló porque la `0008` nunca se había corrido, y la columna que la `0012` necesitaba no existía. El error que devuelve la base en ese caso —"column X does not exist"— no dice cuál fue la migración que faltó: hay que ir a buscarla.

**El editor de Supabase corre todo en una transacción.** Si falla el último bloque, se deshacen también los anteriores. Es a favor: o entra todo o no entra nada. Pero cuando algo falla, no asumas que la mitad quedó aplicada — verificá.

**El editor solo muestra el resultado del último bloque.** Por eso los scripts terminan en un solo `select` de confirmación, y por eso los de diagnóstico se escriben como **una sola consulta** con `union all` y una columna de sección.

## Qué hay acá y qué falta

Los archivos `0001` a `0009` son todo lo que se hizo desde el 9 de septiembre de 2026, en orden. Están corridos en producción salvo donde se diga lo contrario.

`pendientes_capa3_reputacion.sql.txt` está escrito pero **no corrido a propósito**: va después del link del partido. Cuando se corra, se renombra a `0010_capa3_reputacion.sql`.

**Falta el punto de partida.** El esquema original —las 16 tablas, sus claves y las políticas anteriores al 9 de septiembre— se creó antes de que existiera esta carpeta, así que no está versionado. Mientras eso siga así, esta carpeta sirve para repetir los cambios, no para reconstruir la base desde cero.

## Cómo cerrar ese hueco (una sola vez)

Con la herramienta oficial de Supabase, sin instalar nada permanente:

```bash
npx supabase login
npx supabase link --project-ref TU_REF_DE_PROYECTO
npx supabase db pull
```

`db pull` se conecta a la base real y escribe un archivo con **todo** el esquema actual. Ese archivo pasa a ser el `0000_esquema_base.sql` y a partir de ahí la carpeta reconstruye la base completa desde cero.

La referencia del proyecto está en Supabase → Project Settings → General, y es la parte del medio de la URL de la base.
