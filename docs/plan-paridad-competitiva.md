# FULBITO RANDOM · Plan de paridad competitiva (post-auditoría FulbitoApp)
**Fecha: 8 de septiembre de 2026 · Para arrancar en una conversación nueva de Claude Code**

---

## 0. Instrucción de arranque

> Retomamos Fulbito Random. Leé este documento completo — es el plan de todo lo que hay que construir después de auditar a un competidor directo (fulbitoapp.site). Andá punto por punto, en el orden en que están, sin saltar. Cuando un punto necesite una migración de SQL en Supabase, dámela al final de ese punto para que la corra antes de seguir al siguiente. Cuando termines cada punto, compilá (`tsc --noEmit` + `npm run build`), subí a git y avisame qué quedó.

Contexto del proyecto (por si hace falta releer más): `FR_Handoff_para_Claude_Code.md` en esta misma carpeta (visión y modelo de datos original), y dos documentos ya publicados como Artifact de Claude — pedile a Claude Code que los lea con `action: "read"` si necesita más detalle de cualquier punto de acá:
- **Hoja de Ruta FR** (roadmap general, fases 00-08): `https://claude.ai/code/artifact/42c7f6c9-ec5d-4bcd-b069-a0848f7186ea`
- **Auditoría FulbitoApp** (el análisis completo que generó este plan): `https://claude.ai/code/artifact/899a250d-da14-4a0b-ae20-5b880d60fe4f`

Reglas que no cambian: dueño del proyecto es principiante total, presupuesto $0 estricto (todo debe tener plan gratis suficiente para esta escala), probar cada feature de UI en el navegador antes de dar por terminada, nunca asumir que una migración SQL ya se corrió sin que el usuario lo confirme explícitamente.

---

## 1. Legal real: Términos y Privacidad (prioridad más alta)

FulbitoApp tiene términos y privacidad reales citando la Ley 24.240 (Defensa del Consumidor) y la Ley 25.326 (Protección de Datos Personales) de Argentina. Nosotros solo tenemos un texto genérico en `BasesYCondiciones.tsx`. Es la brecha más seria detectada — no es visual, es exposición legal real para el dueño del proyecto.

**Qué hacer:**
- Escribir una página de **Términos y condiciones** real: qué es y qué no es la app (el software no organiza partidos ni es responsable de lo que pase en la cancha), edad mínima, normas de conducta (no usar el voto como represalia, no inventar jugadores/partidos, no acosar), qué pasa con el contenido que cargan (fotos, nombres), suspensión de cuentas, que hoy es gratis y qué pasaría si algún día se cobra, ley aplicable (Argentina, Ley 24.240).
- Escribir una página de **Política de privacidad** real: qué datos se guardan (cuenta, perfil, valoraciones — aclarar que el voto se asocia a la cuenta solo para evitar votos duplicados y nunca se muestra a nadie), para qué se usan, quién los ve (Supabase, Vercel — nombrarlos como corresponde), transferencia internacional de datos (Supabase/Vercel operan desde EE.UU., hay que decirlo), qué es obligatorio vs. opcional, derechos de acceso/rectificación/supresión (Ley 25.326) y cómo ejercerlos (mail de contacto real — **pedirle al usuario el mail de contacto antes de escribir esto**, no dejar un placeholder sin completar como le pasó a FulbitoApp).
- Nuevas rutas `/terminos` y `/privacidad`, reemplazando o complementando `/bases-y-condiciones`.
- Enlazar desde el flujo de login/registro ("al entrar aceptás los términos y la política de privacidad").

No requiere SQL. Es contenido + 2 páginas nuevas.

---

## 2. Anti-inflación: diluir los primeros partidos de cada jugador

Mecánica de FulbitoApp: los primeros 3 partidos de un jugador nuevo se mezclan con el promedio general del grupo (o de la plataforma, en nuestro caso) y se van "desdiluyendo" con las fechas. Así una noche inspirada no infla el promedio de alguien nuevo, ni una mala lo hunde.

**Qué hacer:**
- Ajustar la función `valoraciones_promedio()` (Supabase) para que, cuando un jugador tiene menos de 3 valoraciones recibidas, el promedio mostrado sea un blend entre sus valoraciones reales y el promedio general de la plataforma (peso creciente hacia el propio promedio a medida que suma valoraciones — por ejemplo, promedio ponderado tipo `(promedio_jugador * n + promedio_general * (3 - n)) / 3` para n < 3 valoraciones).
- Mantener el número real de valoraciones (`cantidad`) sin alterar — el blend es solo para el número que se muestra como promedio, no para el conteo.
- SQL: reemplazar la función existente (`create or replace function valoraciones_promedio()...`) con la lógica nueva. Mantener `security definer` y `search_path` fijo como está ahora.

---

## 3. Estrellas: nos quedamos con 1-5, pero con formato Google

**Decisión ya tomada — no volver a discutirla:** seguimos con estrellas 1-5 (no la escala 6-10 de FulbitoApp). Lo que se copia es el **formato de presentación de Google Reviews**, no la escala.

**Qué hacer:**
- Rediseñar el componente `Estrellas.tsx` para un modo "completo" (usar en `Perfil.tsx` y `JugadorDetalle.tsx`, no en las filas compactas de listas) que muestre, estilo Google:
  - Número de promedio grande (ej. "4.3")
  - Fila de estrellas debajo
  - Cantidad total de valoraciones al lado ("128 valoraciones")
  - **Barra de distribución por puntaje**: 5 filas (una por cada valor 1 a 5), cada una con el número, una barra horizontal rellena proporcional a cuántas valoraciones tuvo ese puntaje, y el conteo al final — igual que Google muestra "5 ★ ████████░░ 80".
- Para la barra de distribución hace falta el conteo por valor de estrellas, no solo el promedio. Nueva función RPC `distribucion_valoraciones(p_evaluado_id uuid)` que devuelva `estrellas, cantidad` agrupado — mismo patrón `security definer` que las otras funciones de agregados (nunca exponer quién votó qué, solo conteos).
- Mantener el modo compacto actual (solo número + ícono de estrella) para las filas de lista donde ya se usa.

---

## 4. Insignias votadas por el grupo (reemplaza el selector de avatar)

FulbitoApp tiene insignias que el grupo vota cada semana (El Goleador, El Asistidor, La Muralla, El Uno, El Motorcito, El Mágico, El Capitán, El Alma del Grupo) y se acumulan en un ranking histórico. Es la evolución real de la idea de "estilos de jugador" que se había hablado antes en el proyecto — mejor que un avatar fijo elegido una sola vez, porque lo vota el grupo cada partido.

**Qué hacer:**
- Definir la lista de insignias adaptada a la jerga del Río de la Plata (ya se habían propuesto candidatas en una sesión anterior: Rayo/velocista, Killer/definidor, el 10/armador, Paredón/defensor-arquero seguro, Gambeta/encarador, Cumplidor, Motor. Ajustar cantidad y nombres finales con el usuario si hace falta, pero no bloquear la implementación por esto — hay base suficiente para arrancar).
- Nueva tabla `insignias_otorgadas` (id, partido_id, otorgado_por_id [evaluador], jugador_id [receptor], insignia text, created_at) — mismo patrón de anonimato que valoraciones: nunca se expone quién otorgó cada insignia, solo el conteo agregado.
- Ampliar la pantalla `ValorarPartido.tsx`: además de estrellas + comentario por compañero, agregar selector opcional de una insignia por compañero (máximo una insignia otorgada por jugador por partido, como en FulbitoApp).
- Nueva función RPC `insignias_por_jugador(p_jugador_id uuid)` devolviendo insignia + conteo total histórico, agregada y anónima.
- Reemplazar (o complementar) el picker de emoji fijo en `Perfil.tsx`/`Avatar.tsx`: mostrar en el perfil de cada jugador sus insignias más votadas con el conteo, tipo medallero — no como algo que el jugador elige, sino como algo que el grupo le otorgó.
- El avatar de iniciales/emoji que ya existe puede quedarse como identidad visual de base; las insignias son un layer aparte (logro/reputación), no lo reemplazan 1 a 1.

Requiere SQL (tabla + RLS + función) y tocar `ValorarPartido.tsx`, `Perfil.tsx`, `JugadorDetalle.tsx`.

---

## 5. Notificaciones por mail (antes que push)

FulbitoApp no tiene push — usa mail transaccional (Resend) para avisar novedades del grupo. Es infraestructura mucho más chica que web push (que sigue pospuesto) y puede cubrir gran parte del mismo valor: "avisame qué pasó en mi grupo".

**Qué hacer:**
- Crear cuenta gratis en **Resend** (resend.com) — tiene plan free (3.000 mails/mes, 100/día), suficiente para esta escala. Verificar un dominio o usar el de pruebas de Resend según lo que permita el free tier para envío real.
- Evaluar reemplazar el SMTP default de Supabase Auth (que tiene rate limit muy bajo sin SMTP custom — un problema real si el proyecto crece) por Resend como SMTP custom de Supabase Auth. Esto resuelve dos cosas a la vez: notificaciones Y el límite de envío de magic links.
- Casos a notificar por mail (elegir el mínimo viable primero, no todos de una): alguien se suma a un partido tuyo, un partido tuyo queda completo, te sumaron a un grupo, te reclamaron/sumaron sin registro (ya existe el flujo, falta el mail), recordatorio para valorar un partido que jugaste (pasadas unas horas).
- Necesita una función server-side para disparar el envío (Supabase Edge Function, o el propio SDK de Resend llamado desde donde corresponda) — evaluar la forma más simple dado que no hay backend propio más allá de Supabase.

Este punto es más grande que los anteriores — al llegar acá, si se ve que consume mucho tiempo, es razonable cortar la sesión ahí y seguir en la siguiente en vez de forzarlo junto con lo que sigue.

---

## 6. Login con Google (además del magic link)

FulbitoApp ofrece Google OAuth como alternativa al mail. Baja fricción para gente que no quiere esperar un mail.

**Qué hacer:**
- Supabase Auth soporta Google OAuth de forma nativa (gratis). Requiere crear credenciales OAuth en Google Cloud Console (gratis, solo hay que crear el proyecto) y cargarlas en Supabase → Authentication → Providers → Google.
- Agregar botón "Entrar con Google" en `Login.tsx`, arriba o al lado del formulario de mail actual (magic link se mantiene, no se reemplaza).
- Verificar que el flujo de `CompletarPerfil` siga funcionando igual para alguien que entra por primera vez vía Google (mismo flujo que hoy, la única diferencia es cómo se autentica).

Requiere configuración manual del usuario en Google Cloud Console + Supabase (guiarlo paso a paso cuando se llegue a este punto, es la clase de cosa que solo puede hacer él).

---

## 7. Aprobación del admin para sumarse a un grupo

Hoy cualquiera con el link de invitación entra directo a un grupo (`grupo_miembros` insert libre). FulbitoApp pide aprobación del admin antes de dejar entrar a alguien. Es una decisión de producto legítima — más curado, más fricción — que vale la pena ofrecer.

**Qué hacer (decisión a confirmar con el usuario antes de programar, no asumir):** ¿reemplaza el alta libre actual, o es una opción que el creador del grupo elige al crearlo (como hicimos con "apertura" en los partidos: abierto vs. solo confiables)? Recomendado: opción configurable por grupo, no un cambio global — mismo patrón que ya usamos en partidos.
- Si se confirma opción configurable: columna `grupos.requiere_aprobacion boolean default false`.
- Nueva tabla o estado: `grupo_miembros` necesita un campo `estado` ('pendiente' | 'aprobado'), o una tabla separada `solicitudes_grupo` (partido_id... perdón, grupo_id, jugador_id, estado, created_at) — más limpio como tabla separada para no mezclar miembros reales con solicitudes pendientes.
- Pantalla para el admin: ver solicitudes pendientes en `GrupoDetalle.tsx`, aprobar o rechazar.
- El flujo de `UnirseGrupo.tsx` cambia: si el grupo requiere aprobación, en vez de unirse directo, queda "pendiente" y se le avisa que espere.

---

## 8. Link de vista pública por grupo

FulbitoApp permite generar un link de solo lectura con las estadísticas del grupo, para mostrar afuera (canal de crecimiento orgánico).

**Qué hacer:**
- Nueva ruta pública `/grupos/:id/publico` que NO requiere sesión — muestra nombre del grupo, tabla de jugadores con promedio (sin mail ni datos sensibles), y opcionalmente historial de partidos jugados. Requiere una policy de Supabase distinta (lectura pública controlada) o traer los datos vía una función RPC `security definer` que exponga solo lo necesario sin requerir auth.
- Botón "Compartir vista pública" en `GrupoDetalle.tsx` (solo visible al admin), que genera/copia el link.
- Cuidado de privacidad: nunca exponer mail, ni quién valoró qué — mismos límites que ya se respetan en todo el resto de la app.

---

## 9. Landing page con demo interactiva (si no está ya resuelto)

**Nota: en la última sesión apareció un archivo `App.tsx` con una página `Landing.tsx` ya agregada (para usuarios sin sesión, separada de `/login`) — revisar primero qué tan avanzada está esa pantalla antes de asumir que hay que construirla de cero.** Si ya existe una landing razonable, este punto es solo "sumarle una demo interactiva", no construir la landing entera.

FulbitoApp deja probar el producto (deslizar el puntaje, tocar una insignia) sin crear cuenta, con datos de ejemplo, directo en la landing — genera confianza antes de pedir el mail.

**Qué hacer:**
- Si `Landing.tsx` ya tiene contenido: agregar una sección con un mini-demo no funcional-de-verdad (datos de ejemplo fijos, tipo "Cami — 8.2 ⭐" con estrellas tocables que no se guardan en ningún lado) que muestre cómo se ve valorar a un compañero.
- Si no existe o está vacía: construirla desde cero con esa demo como pieza central, más el resto de contenido de venta (qué es la app, por qué sirve, cómo funciona en pasos), en el mismo lenguaje visual ya establecido (vidrio esmerilado, verde-cancha/dorado, Bebas Neue + Manrope).

---

## Lo que NO se toca (recordatorio, no tarea)

Geolocalización, sistema de confiabilidad por bajas tardías, partidos abiertos a desconocidos, valor de cancha dividido automático, equipos automáticos conviviendo con valoraciones en el mismo partido — ninguna app analizada (ni esta ni las 5 de la ronda anterior) tiene estas cinco cosas. Es terreno propio. No hay que tocarlas en este plan; si en algún momento parece que hay que "simplificarlas para parecerse más a la competencia", es una señal de alarma, no una mejora.

---

## Orden sugerido si hay que priorizar

Si no da el tiempo para los 9 puntos en una sola sesión larga: **1 → 3 → 2 → 4 → 6 → 7 → 8 → 5 → 9**, en ese orden. El legal (1) y el formato de estrellas (3) son los más baratos y de mayor impacto inmediato; push/mail (5) y la landing con demo (9) son los más caros en tiempo, quedan para el final o para una sesión aparte.
