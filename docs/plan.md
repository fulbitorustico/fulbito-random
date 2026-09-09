# FULBITO RANDOM · Plan de integridad
**Fecha: 9 de septiembre de 2026 · Para arrancar en una conversación nueva de Claude Code**

---

## 0. Instrucción de arranque

> Retomamos Fulbito Random. Leé este documento completo. **El punto 1 ya está hecho: arrancá directo por el punto 2.** Cuando un punto necesite SQL, dámelo al final de ese punto para correrlo antes de seguir. Cuando termines cada punto, compilá (`tsc --noEmit` + `npm run build`), subí a git y avisame qué quedó.

⚠️ **Importante para la próxima sesión:** el punto 2 son cuatro arreglos de permisos en la base de datos. Hacelos **de a uno**, y después de cada uno decime qué SQL correr antes de seguir con el siguiente. No los agrupes todos: si algo sale mal, quiero saber cuál fue.

**El diagnóstico ya se corrió (9 de septiembre).** Los hallazgos están abajo, en el punto 2. No hace falta volver a correrlo salvo que se quiera confirmar un arreglo.

Resumen de lo que está bien y no hay que tocar: la seguridad está activada en las 16 tablas; las valoraciones, insignias, votos al MVP y valoraciones de cancha **ya exigen** haber jugado el partido y estar dentro de la ventana de 24 horas; existen las restricciones de unicidad que impiden votar dos veces lo mismo. Y el control de integridad dio **0 valoraciones hechas por gente que no jugó**, así que ningún agujero se usó todavía.

---

## 1. Los partidos no saben en qué estado están — ✅ HECHO (9 de septiembre, commit `9c8b8eb`)

Ya está resuelto y en producción. Se agregó `calcularEstadoPartido` en `lib/geo.ts` (programado / en juego / terminado / cancelado, con 2 horas de duración), la lista de partidos se separa en **En juego**, **Próximos** y **Jugados**, y en el detalle el botón de valorar, el MVP y la placa aparecen recién cuando el partido terminó de verdad. La cuenta regresiva ya no dice "ya empezó" para siempre: ahora dice "en juego" o "terminó hace 3 días".

<details>
<summary>Lo que decía originalmente este punto</summary>

## (Original) Los partidos no saben en qué estado están

Hoy la app solo distingue dos cosas: la fecha ya pasó o todavía no. Por eso los partidos viejos del grupo "Los jueves de Pedro" muestran **"ya empezó"** cuando en realidad terminaron hace días.

**Qué hacer:**

- Definir cuatro estados calculados a partir de la fecha, sin agregar columnas:
  - **Programado**: falta para que empiece.
  - **En juego**: arrancó hace menos de 2 horas (un fútbol 5 no dura más).
  - **Terminado**: pasaron más de 2 horas.
  - **Cancelado**: ya existe como estado real en la base.
- `formatCuentaRegresiva` en `lib/geo.ts` devuelve `"ya empezó"` para todo lo que sea pasado. Tiene que devolver "en juego" o "terminó hace 3 días" según corresponda.
- En la lista de partidos, separar en secciones: **Próximos** arriba, **En juego** destacado, y **Jugados** colapsado o al final. Hoy están todos mezclados ordenados por fecha.
- En `DetallePartido`, la variable `yaSeJugo` (línea ~121) hace de todo: habilita valorar, mostrar el MVP y la placa. Reemplazarla por el estado calculado.
- La ventana para valorar sigue siendo de 24hs desde el inicio del partido; eso ya funciona y no se toca.

No requiere SQL. Es lógica de presentación.

</details>

---

## 2. Los cuatro agujeros que encontró el diagnóstico — ✅ HECHO (9 de septiembre)

Los cuatro arreglos de permisos están corridos en la base, y la pantalla acompaña. Quedó así:

- **P1** — `crear partido` exigía `true`. Ahora exige que `admin_id` sea tu propio jugador y que la fecha caiga entre una hora atrás y seis meses adelante. SQL en `FR_P2_P1_crear_partido.sql`.
- **P2** — `sumarse a partido` ahora pasa por `puede_sumarse_al_partido()`, una función `security definer` que controla estado abierto, fecha no pasada, cupo disponible, visibilidad del partido (o invitación pendiente) y la apertura "solo confiables". Va adentro de una función a propósito: suelta en la política, la regla de visibilidad de `partidos` escondería el partido privado y el invitado no podría entrar nunca. SQL en `FR_P2_P2_sumarse_partido.sql`.
- **P3** — `asignar equipo` ahora contempla al subcapitán además del capitán. SQL en `FR_P2_P3_asignar_equipo.sql`.
- **P4** — `reclamar jugador` excluye `es_demo = true`. SQL en `FR_P2_P4_reclamar_jugador.sql`.
- **Pantalla** — "Valorar compañeros" aparece solo si jugaste y la ventana de 24hs sigue abierta; `ValorarPartido` avisa con texto claro si entrás por URL sin haber estado anotado; la página de reclamo esconde los jugadores de demo y verifica que el reclamo haya funcionado de verdad (la base rechaza sin devolver error, devolviendo cero filas); "Repetir partido" salta de a semanas hasta caer en el futuro, porque si no la fecha pasada lo hacía rebotar contra P1.

**Pendiente que salió de acá:** si te invitan a un partido de un grupo del que no sos miembro, la base ya te deja entrar pero **el aviso "Te invitaron a jugar" no te aparece**, porque la app carga el partido con las reglas normales y ese partido está escondido para vos. Falta abrir la visibilidad de `partidos` a los invitados.

<details>
<summary>Lo que decía originalmente este punto</summary>

## (Original) Los cuatro agujeros que encontró el diagnóstico

**Este es el punto más importante del documento.** Van ordenados por gravedad. Los tres primeros son de base de datos: **arreglar ahí primero**, porque esconder botones en la pantalla no sirve de nada — cualquiera puede hablarle a la base directamente desde el navegador.

### P1 — Cualquiera puede crear un partido a nombre de otro

La política dice literalmente `crear partido → ESCRIBIR: true`. **No verifica nada**: ni que el `admin_id` sea tu propio jugador. Alguien puede crear partidos poniendo a otra persona como capitán, o crear cientos de partidos basura. Es el agujero que habilita el escenario de los dos vivos del punto 3.

Arreglo: exigir que `admin_id` sea el jugador de quien está creando, y de paso que la fecha sea futura.

### P2 — Se puede entrar a partidos de grupos privados

`sumarse a partido` solo verifica que el `jugador_id` sea el tuyo. **No verifica que el partido sea visible para vos.** O sea: alguien que no es miembro de "Los jueves de Pedro" puede anotarse igual a sus partidos privados. Y una vez anotado, la puerta de las valoraciones se le abre sola, porque esa política sí exige ser participante — y ya lo sería.

Tampoco valida el cupo (se puede entrar a un partido lleno), ni la apertura "solo confiables", ni que el partido no haya pasado ya.

**Ojo con una interacción al escribir esto:** las invitaciones del buscador tienen que seguir funcionando. Si a alguien lo invitan a un partido de un grupo del que no es miembro, tiene que poder aceptar. La política nueva debe permitir entrar si el partido es visible **o** si existe una invitación pendiente para esa persona.

### P3 — El subcapitán no puede armar los equipos

`asignar equipo` solo contempla a `partidos.admin_id`. El subcapitán ve el botón "Generar equipos" pero la base lo rechaza en silencio. Es el mismo error que ya arreglamos para las invitaciones; quedó pendiente este.

### P4 — Los jugadores de demostración son reclamables

La política `reclamar jugador` permite que cualquiera reclame un jugador sin cuenta. Está bien para el flujo real —así funciona el link de "reclamá tu perfil"—, pero hoy los 12 jugadores de demostración también son reclamables, y traen valoraciones e insignias puestas. Alguien podría quedarse con "Camilo Ninja" y su reputación armada. Excluir los que tienen `es_demo = true`.

### Y después, la pantalla

Recién con la base cerrada, arreglar lo visible: en `DetallePartido` (línea ~317) el botón "Valorar compañeros" aparece con solo mirar que la fecha haya pasado, sin fijarse si estás anotado. Y en `ValorarPartido`, si alguien entra por la URL sin haber jugado, mostrar un mensaje claro en vez de la lista de compañeros.

</details>

---

## 3. Que dos vivos no llenen la app de basura

El escenario a evitar: dos personas se sientan una tarde, crean diez partidos inventados, se valoran entre ellos y ensucian toda la base.

Conviene pensarlo en capas, de la más barata a la más cara. **Las tres primeras alcanzan para el 90% del problema** y son rápidas.

**Capa 1 — Que los datos sean posibles** (validaciones en la base, baratas). El diagnóstico confirmó que **hoy `partidos` no tiene ninguna validación de rango**: lo único que valida es que el estado sea uno de los tres permitidos. Falta:
- No se pueden crear partidos con fecha pasada ni a más de seis meses.
- Cupo entre 2 y 30 (está en la pantalla, no en la base).
- Valor de cancha entre 0 y un techo razonable (hoy admite negativos).
- Largo máximo en los textos: nombre de cancha, comentarios, bio.
- Comentarios sin links: es la forma más común de spam.

También conviene un tope de creación de **jugadores sin registrar**: la política deja crear todos los que quieras, y es una vía fácil para inflar la base con nombres inventados.

**Capa 2 — Límite de creación** (un disparador en la base):
- Máximo 5 partidos creados por jugador por día. Nadie organiza más que eso.
- Máximo 3 grupos creados por jugador por día.

**Capa 3 — Que la reputación se gane, no se declare** (la más importante):
- **Un partido creado por alguien que nunca jugó no aparece en el listado público.** Se ve solo para él y para quienes invite por link. Recién cuando juega su primer partido con gente real, sus partidos empiezan a mostrarse a desconocidos.
- Esto corta el ataque de raíz: dos cuentas nuevas pueden inventar lo que quieran entre ellas, pero nadie más lo ve, así que no ensucia la app de nadie.

**Capa 4 — Reportes** (cuando ya haya gente):
- Botón para reportar un partido o un jugador.
- Con tres reportes distintos, se oculta automáticamente hasta revisarlo.

**Capa 5 — Peso de la valoración** (más adelante, cuando haya escala):
- Que una valoración pese según el historial de quien la emite: la de alguien con 30 partidos vale más que la de una cuenta creada ayer. Es lo más robusto y lo más complejo; no lo haría todavía.

**Sobre las cuentas múltiples:** el ingreso por link al mail ya obliga a tener un mail válido, pero crear mails es gratis. No hay forma barata de impedirlo del todo; la Capa 3 es la defensa realista, porque hace que una cuenta nueva no le sirva a nadie hasta que juegue de verdad.

---

## 4. Partidos que se repiten, calendario y lista de espera

Tres ideas que surgieron el 9 de septiembre mientras se cerraban los agujeros del punto 2. Van juntas porque dependen una de otra: sin partidos enlazados no hay "asiduidad", y sin asiduidad la lista de espera no sabe a quién darle prioridad.

**4.1 — Repetir con frecuencia.** Hoy "Repetir partido" suma 7 días fijos. Tiene que preguntar: semanal, quincenal o mensual, y acomodar la fecha a eso. Es solo pantalla, no toca la base. (Ya se parcheó lo mínimo: si el partido que repetís es viejo, salta de a semanas hasta caer en el futuro, porque si no la base lo rechaza por la fecha pasada.)

**4.2 — Enlazar los partidos repetidos.** Hoy el partido duplicado nace suelto: nada dice que "el jueves 21hs" es el mismo partido de todas las semanas. Hace falta una columna que apunte al partido original (o a una serie). Es lo que habilita 4.3, y de paso el historial del grupo.

**4.3 — Lista de espera con prioridad por asiduidad.** Cuando el partido está lleno, en vez de rechazarte te anota en espera. Si alguien se baja, entra el primero de la lista — y el orden no es por quién llegó antes, sino por quién viene jugando ese partido. Si Juan juega todos los jueves y Pedro una vez por mes, Juan tiene prioridad. Esto además resuelve bien el empate por el último lugar: en vez de que gane el que tocó el botón un milisegundo antes, la base los ordena por historial.

**CORREGIDO el 9 de septiembre — el diseño anterior estaba mal.** La lista de espera **es una fila, y se respeta el orden**. Si el cupo es 10 y ya están, te anotás igual como 11, 12 y así (cinco casilleros más). Si alguien se baja entra el 11; si se baja otro, el 12. Punto.

**La asiduidad NO ordena la lista.** Se usa en un solo caso: cuando dos personas se anotan en el mismo instante para el último lugar del cupo y hay que definir quién entra al partido y quién va a la lista. Ahí, y solo ahí, entra el que más viene jugando ese partido, contando los últimos 4 encuentros — para no decidir por milésimas de segundo.

**Y la lista de espera no es un castigo ni un banco de suplentes: es tener el lugar guardado.** En el fulbito siempre se cae alguien, así que la fila se mueve. El que está en la lista tiene **la misma responsabilidad** que los diez anotados: si le toca entrar, va. Avisar que no podés estando 11 vale lo mismo que avisarlo estando entre los que juegan. El texto de las preguntas frecuentes tiene que decir esto, no lo contrario.

**4.3.b — Hay que explicarlo.** La regla no sirve si nadie la entiende: si a alguien lo pasan en la lista de espera sin saber por qué, lo lee como acomodo. Va una sección de **preguntas frecuentes** con dos entradas escritas en criollo: cómo se define el orden de la lista de espera, y qué pasa cuando dos personas quieren el mismo último lugar. La landing hoy no tiene sección de preguntas frecuentes: hay que crearla.

**4.4 — Agendar en el calendario, con aviso 24hs antes.** Botón "Agendar" que abre Google Calendar con el partido ya cargado y un recordatorio 24 horas antes; en iPhone, el mismo botón baja un archivo `.ics`. **Es un link armado: no necesita conectar la cuenta de Google de nadie, no necesita backend y no consume nada.** Descartada la integración real con permisos de Google (OAuth): mucho trabajo, revisión de Google, y no aporta más que esto.

El recordatorio importa por una razón concreta: la app hoy penaliza la baja tardía (menos de 45 minutos antes) pero no avisa antes. El aviso a las 24hs cae justo cuando todavía se puede conseguir reemplazo, y el texto tiene que empujar a la acción: *"Mañana jugás en {cancha} a las {hora}. Si no vas a poder, bajate ahora así entra otro."* Como el recordatorio queda en el calendario del jugador y no sale por Resend, no toca el techo de 100 mails por día.

---

## 5. Traer gente de afuera: un solo camino

Decidido el 9 de septiembre. Hoy hay **dos caminos separados** para sumar a alguien y no se tocan entre sí:

- **Al que ya usa la app**: lo invitás desde el buscador por cercanía. Crea una fila en `invitaciones`, le aparece "Te invitaron a jugar" y acepta. (Funciona de punta a punta desde la opción A: antes el invitado de afuera del grupo podía anotarse pero no podía abrir el partido.)
- **Al que no usa la app**: se crea un jugador sin cuenta y se le pasa el link de "reclamá tu perfil". Queda con el historial, pero **no queda en ningún grupo**.

**Dos huecos confirmados en el código:** hoy **no se puede anotar en un partido a alguien que no está en la app** (la regla de `participantes` exige que el jugador seas vos; al grupo sí se lo puede meter, `GrupoDetalle` lo hace). Y el **link de reclamo no lo mete en nada**: reclamás el perfil y caés en la app sin partido y sin grupo.

### La situación que decide el diseño

De las cinco situaciones posibles, cuatro ya están cubiertas o son otro problema. La que manda es: **falta uno para mañana, no tiene la app, pero lo conocés y tenés su WhatsApp.** Es el caso dominante del fulbito argentino y hoy no funciona.

### Decidido: el camino es el link del partido

El capitán comparte un link del partido. El que lo abre ve cancha, día, hora, cuántos faltan y quién lo invita, con un botón "Sumarme": toca, se registra y queda anotado en el mismo movimiento.

**Por qué este y no el perfil fantasma** (que el capitán escriba el nombre del que falta, lo anote y le mande el link de reclamo): el criterio del dueño del producto es "que usen la app, no importa cómo", y el link gana ahí — no hay nada que hacer antes de que la persona esté adentro, nadie tipea el nombre de nadie, nadie espera aprobación para poder jugar, y el registro cae en el momento de máximas ganas ("me guardan el lugar para mañana"). El fantasma pone al capitán de intermediario y depende de que el otro reclame; si no reclama, queda un nombre inventado en la base — justo lo que el punto 3 quiere evitar.

**El fantasma queda como agregado opcional, no como camino principal.** Tiene un valor que el link no da: el lugar se ve ocupado enseguida, el grupo abre la app y ve "somos 10" aunque el décimo no se haya instalado todavía. Para eso hace falta permitir que el capitán anote a un jugador sin cuenta en *su* partido.

### La regla de privacidad, en una línea

**El link te da el partido. Nunca el grupo.**

Entrar al partido lo decide el capitán, que para eso mandó el link: mismo trato que un link de grupo de WhatsApp, y mismo límite que fijó la opción A (se abre esa fila, no la categoría). Entrar al **grupo** sigue pasando por la regla del grupo: te suma el creador, o pedís y te aprueban. Como el link es por partido, no queda una puerta permanente abierta: se vence con el partido.

Eso arma la secuencia: **el partido es la prueba, el grupo es la pertenencia.** Jugás una vez de invitado y recién después el grupo decide. Encaja solo con la capa 3 del punto 3 (la reputación se gana jugando).

### Cómo se implementa, barato

Cuando el invitado toca "Sumarme", el link **crea la fila de `invitaciones`** para él, y de ahí en adelante lo atienden las políticas que ya se escribieron el 9 de septiembre: `puede_sumarse_al_partido()` lo deja entrar por la rama de invitación pendiente, y `tengo_acceso_al_partido()` lo deja ver el partido. No hay permisos nuevos que inventar.

Piezas que faltan, en orden:
1. Un token de invitación por partido, y una función `security definer` que muestre el partido a alguien sin sesión — solo lo básico: cancha, día, hora, lugares libres y quién invita. **Sin la lista de jugadores ni sus valoraciones si el grupo es privado.**
2. Que al registrarse con ese token, la función le cree la invitación y lo anote.
3. Después del partido, ofrecerle sumarse al grupo — por la puerta del grupo, con aprobación si corresponde.
4. Opcional, para el capitán: poder anotar a un jugador sin cuenta en su propio partido, para que el lugar se vea ocupado.

Un jugador **ya puede pertenecer a varios grupos**: `grupo_miembros` es una tabla de relación y la pantalla de Grupos lista todos. Eso no hay que construirlo.

---

## 6. El agujero número cinco: la aprobación de grupo no existe en la base

Encontrado el 9 de septiembre, **sin arreglar todavía**. No estaba entre los cuatro del diagnóstico.

La política `sumarse o sumar a grupo` sobre `grupo_miembros` dice: *`jugador_id` es el tuyo **o** el grupo es uno de los tuyos*. La primera mitad deja que **cualquiera se agregue a cualquier grupo**, sin invitación y sin aprobación. `UnirseGrupo.tsx` mira `requiere_aprobacion` y crea una solicitud cuando corresponde, pero eso es la pantalla: la base no lo exige.

O sea que hoy "grupo privado" no significa nada para quien le hable directo a la base: se agrega al grupo y ve todos sus partidos. Es el hermano gemelo de los cuatro que se cerraron en el punto 2, y **le saca sentido al cuidado que se puso en la opción A**: no tiene mucho valor abrir una sola fila con permiso del capitán si al lado la puerta del grupo está sin llave.

El arreglo es una política: se entra al grupo si sos el creador, si te aprobaron una solicitud, o si te sumó alguien que ya es miembro. Y la segunda mitad de la política actual también hay que mirarla: hoy cualquier miembro puede meter a cualquiera.

---

## 7. Lo que se hizo en la tanda grande del 9 de septiembre

**Corrido en la base — `FR_Tanda_Grande.sql`:**
- **Punto 6 cerrado.** La aprobación de grupo ahora existe en la base: te sumás solo si el grupo no pide permiso, o te suma el creador. Antes cualquiera se agregaba a cualquier grupo.
- **Capa 1.** Cupo entre 2 y 30, valor de cancha entre 0 y dos millones, nombre de cancha hasta 120, comentarios hasta 500 y sin links, nombre/apodo/bio con techo y sin links.
- **Capa 2.** Tope de 5 partidos y 3 grupos por día y por persona, con mensajes escritos para una persona, no para un programador.
- **Panel del creador.** Columna `es_admin` en `jugadores` y función `panel_metricas()`.

**En la app — commit del 9 de septiembre:**
- **`/panel`**, visible solo para quien tenga `es_admin`. Gente, altas por semana, partidos, partidos por semana, qué día y a qué hora se juega, canchas más usadas, zonas, embudo de registrarse a jugar, y compromiso.
- **Repetir con frecuencia**: semanal, quincenal o mensual (4.1 hecho).
- **Botón "Agendar con aviso"** para el que está anotado: baja un `.ics` con el recordatorio de 24hs adentro, más un link a Google Calendar (4.4 hecho). El `.ics` es el camino principal porque Google no deja fijar el recordatorio desde el link.
- **Preguntas frecuentes en la landing**, ocho, incluida la de la lista de espera y el desempate (4.3.b hecho, con la salvedad de que la lista de espera todavía no existe y el texto lo dice).

**Escrito y esperando — `FR_Capa3_reputacion.sql`:** la capa 3 (un partido de alguien que nunca jugó no se le muestra a desconocidos). **No correr todavía**: va después del punto 5. Hoy la única forma de ver un partido que no te aparece en la lista es que te inviten, y para eso ya tenés que estar en la app; sin el link del partido, el que se registra y crea su primer partido público queda encerrado — nadie lo ve, nadie se anota, nunca se establece.

**Sigue pendiente de la capa 1:** el tope de creación de jugadores sin registrar. `jugadores` no guarda quién creó cada uno, así que hace falta una columna antes de poder limitarlo.

---

## 8. Rachas, recap y confirmación (9 de septiembre)

**Hecho, commit `c75eaec`. SQL: `FR_Confirmar_Asistencia.sql`.**

- **Rachas en semanas seguidas jugando**, no en partidos seguidos. La decisión importa: "partidos seguidos" no se puede calcular mientras los partidos que se repiten no estén enlazados entre sí (punto 4.2), y la semana además es como la gente lo cuenta igual. Se ve en el perfil propio y en el de los demás, y suma dos objetivos: *En llamas* (4 semanas) e *Inoxidable* (10). El sistema de insignias ya existía —7 insignias que vota el grupo y 8 objetivos que se calculan solos—, así que la racha se enchufó ahí en vez de inventar algo nuevo.
- **"Tu temporada"**: mismo motor de imagen 1080×1920 que la card, otro contenido. Partidos, promedio, mejor racha, insignias, objetivos cumplidos y reclutas.
- **Confirmar asistencia con liberación del lugar.** Desde 24hs antes se pide "¿venís?"; a las 12hs el lugar del que no confirmó se libera y entra otro. Capitán y subcapitán nunca se liberan. Anotarse dentro de las 24hs ya cuenta como confirmación. **La liberación la dispara la app al abrir el partido, no una tarea de fondo** — no hay nada corriendo en un servidor. Cuando exista el push habrá que revisarlo.

**Descartado por ahora, guardado:** dividir los gastos tipo Splitwise. La plata del fulbito se arregla en persona, en efectivo o por transferencia en el momento, y no pasa por la app.

**Pendiente de explicar y decidir:** la valoración a ciegas de las dos partes.

**Push: es su propia ronda.** Necesita tres piezas que viven fuera de la app —un par de claves VAPID, una Edge Function que firme y mande, y una tarea diaria que decida a quién avisarle— y en iPhone solo funciona con la app instalada. No entra en una tanda junto con otras cosas.

---

## 9. Equipo contra equipo — **a futuro, con negocio detrás**

Pedido del 9 de septiembre, **sin empezar**. El dueño del producto lo quiere y señala el motivo comercial: **le sirve a los organizadores de torneos**, y ahí hay un negocio a desarrollar. Eso cambia la prioridad: no es una función más para jugadores, es la puerta a un cliente que paga. La idea: armar tu equipo fijo, buscar rival, y recién después ponerse de acuerdo en día y cancha.

Es el cambio conceptual más grande que se le puede pedir a la app, porque hoy **el partido es la unidad y el equipo no existe**: los equipos A y B se arman adentro de un partido y se borran cuando termina. Esto pide un equipo que viva por su cuenta, con nombre, plantel, historial y promedio propio.

Piezas, en orden:
1. Un equipo persistente (tabla propia, miembros, capitán). Se parece a `grupos`, pero un grupo es gente que juega junta y un equipo es gente que juega **contra** alguien: necesita identidad y récord.
2. Un desafío: equipo A propone, equipo B acepta. Es una negociación, no una anotación — hay ida y vuelta.
3. Recién ahí, acordar día y cancha. Y ahí sí sirve la disponibilidad que ya se guarda por jugador.
4. El resultado, que hoy no existe: sin marcador no hay récord, y sin récord no hay contra quién querer jugar.

**Ojo con esto último**: meter resultados cambia el producto. Hoy nadie compite, se valoran entre compañeros. Con récords de equipo aparece la competencia, y con ella las discusiones. No es malo, pero es otra app.

---

## 10. Anexo de pádel — **a desarrollar pronto**

Decidido el 9 de septiembre: se hace, y va temprano en la fila.

**Sirve tal cual, sin tocar nada:** cuentas, grupos, valoraciones entre compañeros, anti-inflación, insignias, objetivos, confiabilidad por bajas tardías, confirmación de asistencia con liberación del lugar, canchas con perfil, imágenes para historias, panel, permisos, migraciones. Es el grueso del trabajo y no distingue de qué deporte se trata.

**Cambia poco y localizado:** las posiciones (arquero/defensor/medio/delantero → drive y revés), el cupo (fijo en 4), la duración del partido (90 minutos en vez de 2 horas, que afecta al estado "en juego" y al `.ics`), las insignias (Paredón y El 10 no significan nada; van Smash, Bandeja, Muro) y el vocabulario.

**El único problema conceptual, pero pesa:** en pádel se juega **en parejas** y la pareja es la unidad. El armado deja de ser "repartir diez individuos en dos grupos" y pasa a ser "emparejar cuatro personas en dos duplas", que es otro problema. Y valorar a tu compañero de pareja no es lo mismo que valorar a nueve tipos que corrieron con vos. Empuja hacia la afinidad — justo la barrera que la investigación competitiva señala y que nadie construyó.

**Cómo hacerlo (decidido):** NO como app aparte. Copiar el proyecto significa mantener dos para siempre y hacer cada arreglo de permisos dos veces. El deporte tiene que ser un dato del grupo o del partido, y las cuatro o cinco cosas que cambian se leen de una configuración. Más trabajo la primera vez, la mitad de trabajo para siempre.

---

## 11. Ubicar la cancha sin pagarle a Google — HECHO

El buscador por nombre falla seguido y no es un bug: OpenStreetMap tiene la geometría de las canchas pero casi ninguna con nombre (en 4 km del Obelisco hay 40 mapeadas y 5 con nombre). Google sí tiene los datos, pero su API pide cuenta con tarjeta y deja la clave a la vista en una app que corre en el navegador.

**La salida, idea del dueño del producto: no le pedimos la API a Google, le pedimos el link al usuario.** Tres puertas, todas gratis:

1. **El catálogo propio primero.** Se arma solo con cada partido creado y tiene justo las canchas donde esta gente juega. A los diez partidos es mejor que Google para ese barrio.
2. **La dirección a mano** (calle, altura, localidad). OpenStreetMap es malo con "la cancha de Pepe" pero bueno con "Rivadavia 5400, Caballito": las direcciones sí están cargadas.
3. **El link de Google Maps pegado.** Si es de los largos, la app le saca las coordenadas sola. Si es de los cortos (`maps.app.goo.gl`, los que da "Compartir" en el celular) no se puede sin seguir el redireccionamiento desde un servidor, así que se guarda el link igual y queda el botón **Cómo llegar** para todos los anotados.

Migración `0010_link_de_mapa.sql`.

**Sobre el armado de equipos:** queda como está (reparto por promedio, capitán decide). La mejora acordada para más adelante no es un algoritmo con las siete señales —con pocos datos daría un resultado peor y más complicado— sino un **generador que muestre sus razones**: "repartí a los dos Paredones y separé a los dos Motores". Al capitán le sirve más entender el criterio que recibir un reparto más exacto.

---

## 12. Las tarjetas del capitán — HECHO

Migración `0012`. Reemplaza al aviso anterior, que no hacía nada.

- **Cada abandono de un partido propio es una amarilla**, visible en el perfil.
- **Dos amarillas en dos meses son roja**: dos fechas sin poder armar partidos, y la base lo hace valer en la política de crear partido. Sin eso sería un cartel de colores.
- **La suspensión se cumple jugando, no esperando.** Jugás dos partidos y volvés. Es a propósito: esperar sentado no repara nada, y el que se borra de la app dos meses no debería volver con la ficha limpia.
- Se puede seguir jugando partidos de otros con total normalidad. Lo único que se suspende es armar.
- `NuevoPartido` avisa **al entrar**, no al guardar: que la base te rechace después de llenar el formulario entero es la peor forma de enterarse.

Solo se sanciona esto. Bajarse de un partido ajeno ya tiene su medida aparte (la confiabilidad por bajas tardías); armar un partido y dejarlo tirado es un compromiso con nueve personas más.

---

## 13. La pantalla de inicio — HECHO

Migración `0013`. Las tres cosas van juntas a propósito: el resultado es lo que le da de comer al feed. Sin él, las novedades se agotan en "fulanito se anotó".

**Novedades.** Tarjetas que se pasan de costado arriba de la lista de partidos, ordenadas **por urgencia y no por fecha**: primero lo que se te vence (confirmá que venís), después lo que te espera (te invitaron, te falta valorar), y al final lo que solo da gusto mirar (se levantó la veda de las notas, quedó el resultado, se sumó alguien a tu partido). Lo urgente no se puede tapar; el resto sí, y la tapada dura 48 horas.

Es lo que reemplaza al aviso por mail que no podemos mandar por el techo de Resend. Sin esto, la app se abre solo cuando te acordás.

**Tus partidos primero.** La lista se separa en **Jugás vos** arriba, después *Cerca tuyo*, y al final *Jugados* colapsado. Antes los propios estaban mezclados con los de desconocidos, ordenados por cercanía.

**El resultado.** Lo carga el capitán o el subcapitán cuando el partido terminó: el marcador arriba y, opcional, quién hizo los goles. El orden de importancia está puesto a propósito — **primero el resultado, después los goles** — y los goles **no tocan nada del armado de equipos**: lo que ordena sigue siendo la valoración de los compañeros. Los goles suman al perfil, al recap de la temporada y a un objetivo nuevo (*Con el arco de frente*, 10 goles).

**Advertencia que sigue en pie:** con el resultado entra la competencia, y con ella las discusiones. Hasta ahora nadie competía en la app. Si el clima del grupo se enrarece, esto es lo primero que hay que mirar.

---

## 14. Colaborar

Link de Mercado Pago en el **pie de la landing** y **abajo del perfil**, con la frase *"La app es gratis y va a seguir siéndolo. Si te sirve y querés bancarla, acá va"*.

**Nunca en la respuesta de "¿cuánto sale?"** ni en el medio de un flujo: pedir plata en la misma frase en la que decís que es gratis le mete una duda al que recién llega, justo en el momento en que menos conviene. En el pie y en el perfil lo lee el que ya la usa y ya sabe si le sirve.

El link vive en `lib/apoyo.ts`, en un solo lugar, porque el dueño del producto va a cambiarlo.

---

## Estado del proyecto al cerrar esta sesión

**Todo lo que sigue está funcionando en producción y con su SQL corrido:**

- Legales reales, insignias votadas, estrellas formato Google, anti-inflación (todos arrancan en 3), aprobación de admin en grupos, vista pública de grupo, mails por Resend, login con Google.
- Perfil como card con niveles (Debutante → Leyenda), objetivos con cartel de logro, medallero, foto de perfil.
- Buscador de jugadores por cercanía con invitación directa, bloqueo bidireccional.
- Compartir en historias (imagen 1080×1920 generada en el celular), MVP de la fecha.
- Capitán y subcapitán por partido.
- Canchas con perfil propio, valoración por aspectos y chapas.
- Avisos por mail elegibles (el de "alguien se sumó" viene apagado).
- Landing con demo interactiva, guía de instalación, recompensas por invitar, card para dueños de canchas.
- Ícono propio con los 5 pentágonos, marca en toda la app.
- GitHub Action que mantiene Supabase despierto cada 3 días.

**Deudas conocidas, además de los tres puntos de arriba:**

- **Testimonios**: la sección existe pero está vacía a propósito. Faltan tres frases reales del grupo de Fulbito Rústico. Se cargan en `TESTIMONIOS` en `Landing.tsx`.
- **Drive**: el conector apunta a `guillenofx@gmail.com`. Hay que conectar `info.fulbitorustico@gmail.com` para dejar ahí el plan de contenido.
- **Tareas programadas de contenido**: decididas pero no creadas, porque consumen créditos cada vez que corren. Falta el visto bueno.
- **Dominio propio**: sin comprar. La recomendación era `fulbitorandom.com.ar` por nic.ar.
- **Resend**: 100 mails por día es el primer techo real si la app crece.
- **Sin pruebas automáticas** y **las pantallas internas nunca las vio Claude Code**, porque no puede iniciar sesión.
