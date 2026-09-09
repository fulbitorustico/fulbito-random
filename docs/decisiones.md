# Decisiones y trampas

Lo que no se deduce leyendo el código. Cada decisión con el motivo, porque el motivo es lo que permite cambiarla bien más adelante.

Última actualización: 9 de septiembre de 2026.

---

## Decisiones de producto

### Todos arrancan en 3,0 estrellas

Si cada uno arrancara en 5, la única dirección posible sería para abajo y en tres meses todos estarían iguales. Arrancando en el medio, subir y bajar cuestan lo mismo, y el número dice algo.

Implementado dentro de `valoraciones_promedio()`: hasta las 3 valoraciones recibidas, el promedio se calcula mezclando lo real con un piso de 3,0. Es lo primero que hay que entender antes de tocar esa función.

### La nota individual no se muestra nunca

Solo el promedio y la distribución. **Y no es solo una decisión de pantalla:** `valoraciones` e `insignias_otorgadas` **no tienen política de lectura en la base**. Nadie puede consultarlas directo, ni el dueño de la app. Se llega solo por funciones que devuelven agregados.

Eso es lo que hace que el anonimato sea real y no decorativo: aunque alguien abra las herramientas del navegador y le hable a la base, no puede ver quién le puso qué a quién. **No agregar una política de lectura a esas dos tablas.**

### La valoración es a ciegas

Una nota queda guardada al instante pero no entra a ningún promedio hasta 24 horas después del partido. El motivo: con anonimato pero sin simultaneidad, en un partido de diez y con dos o tres notas puestas, el que baja es identificable y te devuelve el golpe.

Tiene un costo asumido: la app se siente más muda al valorar. Se compensa con las reacciones de emoji, que existen justo para que el partido recién jugado no quede en silencio durante la veda.

### La reputación se mide en dos ejes, no en uno

**Qué tan bien jugás** (estrellas) y **si aparecés** (confiabilidad por bajas tardías, con umbral de 45 minutos). El segundo es el que le importa al que organiza, y es el que casi ninguna app de la competencia mide.

### Solo se sanciona abandonar un partido propio

Bajarse de un partido ajeno tiene su medida —la confiabilidad— y nada más. Pero armar un partido y dejarlo tirado es un compromiso con nueve personas: cada abandono propio es **amarilla**, dos en dos meses son **roja**, y la roja son dos fechas sin poder armar partidos.

**La suspensión se cumple jugando, no esperando.** Si fuera por tiempo, el que se borra de la app dos meses vuelve con la ficha limpia sin haber reparado nada.

Y la sanción **se ve en el perfil** en vez de ser un puntaje escondido: en el fulbito, la sanción que funciona es que se sepa.

### El link da el partido, nunca el grupo

El que recibe un link ve cancha, día, hora, cuántos faltan y quién invita. **No ve la lista de jugadores ni sus valoraciones.** Entrar al partido lo decide el capitán, que para eso mandó el link. Entrar al **grupo** sigue pasando por la regla del grupo.

De ahí sale la secuencia: **el partido es la prueba, el grupo es la pertenencia.**

El link es una llave: cualquiera que lo tenga puede entrar a ese partido. Es deliberado —si pidiera algo más, deja de servir para lo que sirve— y es el mismo trato que un link de grupo de WhatsApp. Vence solo: `partido_por_token` deja de devolver el partido una hora después de que empieza.

### La lista de espera es una fila, y se respeta el orden

Si el cupo es 10 y ya están, te anotás como 11. Si alguien se baja, entra el 11. **La asiduidad no ordena la lista**: se usa en un solo caso, cuando dos se anotan en el mismo instante por el último lugar del cupo y hay que definir quién entra y quién va a la fila.

Y la lista **no es un banco de suplentes**: es tener el lugar guardado, con la misma responsabilidad que los diez.

*(Diseñada, todavía no construida.)*

### El armado de equipos queda simple a propósito

Reparto en zigzag por promedio general, y el capitán decide. Se evaluó usar las siete insignias como señales y **el saldo da negativo**: las insignias son votos por lo memorable, no mediciones; hay que decidir cuánto vale cada una, que es una opinión futbolística discutible; y con pocos partidos, siete señales son siete formas de amplificar ruido.

La mejora acordada para más adelante no es un algoritmo más exacto sino **un generador que muestre sus razones**: *"repartí a los dos Paredones y separé a los dos Motores"*. Al capitán le sirve más entender el criterio que recibir un reparto mejor.

### El resultado trae la competencia

Cargar el resultado y los goles fue pedido y está hecho, con una advertencia que sigue en pie: **hasta ahora nadie competía en la app, se valoraban entre compañeros.** Con récords aparecen las discusiones. Si el clima de un grupo se enrarece, esto es lo primero para mirar.

Los goles **no tocan el armado de equipos**. Están para que el que hizo tres lo vea en su perfil, no para hacer una tabla de goleadores. La investigación competitiva desaconseja explícitamente los rankings públicos: convierten una herramienta de aprendizaje colectivo en una competencia de reputación.

### La racha se mide en semanas, no en partidos

"Partidos seguidos" no se puede calcular mientras los partidos que se repiten no estén enlazados entre sí: no hay forma de saber que el jueves de esta semana es el mismo partido que el de la anterior. La semana sí se puede contar hoy, y además es como la gente lo cuenta igual.

### El pedido de plata va en el pie, nunca en "¿cuánto sale?"

Pedir una colaboración en la misma frase en la que decís que la app es gratis le mete una duda al que recién llega. En el pie de la landing y abajo del perfil lo lee el que ya la está usando y ya sabe si le sirve.

### Se descartó, con motivo

- **Dividir gastos tipo Splitwise.** La plata del fulbito se arregla en persona, en efectivo o por transferencia en el momento. No pasa por la app.
- **Chat.** Lo hace WhatsApp. En su lugar hay **una nota del capitán**: un solo aviso que se edita, que cubre el 80% de la coordinación con el 5% del trabajo.
- **Rankings públicos.** Ver arriba.
- **Notificaciones push.** No por difíciles de programar, sino por lo que viven afuera: claves VAPID, una Edge Function que firme y mande, una tarea diaria, y en iPhone solo funciona con la app instalada. Merece una ronda entera, no un rato.
- **La API de Google Maps.** Tiene los datos que faltan, pero pide cuenta de Google Cloud con tarjeta y deja la clave a la vista en una app que corre en el navegador. La salida fue pedirle el link al usuario, que es gratis y sin límite.
- **Pádel como app aparte.** Copiar el proyecto significa mantener dos para siempre y hacer cada arreglo de permisos dos veces. El deporte tiene que ser un dato del partido.

---

## Decisiones técnicas

### La base autoriza, la pantalla decide qué mostrar

`src/lib/permisos.ts` es la única fuente de verdad de la pantalla, y cada función nombra al lado su política de Postgres. Estaba escrito dos veces a mano y se desincronizó: el botón "Generar equipos" se le mostraba al subcapitán y la base lo rechazaba en silencio.

### Los chequeos complejos viven en funciones `security definer`

`puede_sumarse_al_partido`, `tengo_acceso_al_partido`, `capitan_suspendido`. **No es por comodidad**: si la condición va suelta en la política, la propia regla de visibilidad de `partidos` esconde el partido privado y el invitado no puede entrar nunca. La función ve la tabla entera y decide con reglas explícitas. También evita que las políticas se miren entre sí y Postgres las rechace por recursión.

### La liberación de lugares no tiene tarea de fondo

`liberar_lugares_sin_confirmar()` se dispara cuando alguien abre el partido, no desde un servidor. En la práctica alguien lo abre todo el tiempo, pero **si nadie lo abre, el lugar no se libera**. Cuando exista el push va a haber una tarea diaria y conviene revisarlo.

Efecto lateral a recordar: **abrir un partido escribe en la base.** Dejó de ser una lectura pura.

### El aviso de 24hs va en un archivo de calendario, no por mail

Google Calendar no deja fijar el recordatorio desde el link, usa el que cada uno tenga. El `.ics` lo lleva adentro. Además el mail cuesta: Resend son 100 por día y **cada ingreso por link al mail consume uno**.

### La búsqueda de canchas tiene tres puertas

1. **El catálogo propio primero.** Se arma solo con cada partido creado y tiene justo las canchas donde esta gente juega. A los diez partidos es mejor que Google para ese barrio.
2. **La dirección a mano.** OpenStreetMap es malo con "la cancha de Pepe" y bueno con "Rivadavia 5400, Caballito".
3. **El link de Google Maps pegado.** Si es de los largos, la app le saca las coordenadas del texto de la URL sin llamar a nadie. Los cortos (`maps.app.goo.gl`, los del botón Compartir del celular) no traen coordenadas: se guarda el link igual para "Cómo llegar".

**El dato que explica todo esto:** en 4 km alrededor del Obelisco, OpenStreetMap tiene 40 canchas mapeadas y **5 con nombre**. No es un bug del buscador, es la cobertura de los datos.

### Las respuestas de las preguntas frecuentes se ocultan con CSS, no se desmontan

Son el mejor contenido de la landing para las búsquedas —son justo lo que la gente escribe en Google— y si se desmontan, Google ve una de catorce. **No cambiar `hidden` por un renderizado condicional.**

### La capa 3 de reputación está escrita y NO hay que correrla al lanzar

Esconde los partidos públicos de quien nunca jugó. Pide haber jugado un partido con 4 o más personas, y **el día que se comparte la app eso no lo cumple nadie**: la lista de partidos quedaría vacía para todo el mundo y la defensa se convertiría en el bug. Es para cuando haya desconocidos creando partidos.

---

## Trampas que ya nos mordieron

**`npx tsc --noEmit` no chequea nada en este proyecto.** El `tsconfig.json` usa referencias. El chequeo real es `npm run build`, que corre `tsc -b`.

**Dentro de una migración, todos los `add column` van arriba de todo.** Postgres valida el cuerpo de una función al crearla: si lee una columna que el mismo script agrega más abajo, se cae el script entero. Pasó con la `0011`.

**No saltearse ninguna migración.** La `0012` falló porque la `0008` había quedado sin correr, y el error de la base —"column X does not exist"— no dice cuál faltó.

**El editor de Supabase corre todo en una transacción.** Si falla el último bloque, se deshacen los anteriores. Es a favor, pero cuando algo falla no hay que asumir que la mitad quedó aplicada.

**El editor de Supabase solo muestra el resultado del último bloque.** Los scripts de diagnóstico tienen que ser **una sola consulta** con `union all` y una columna de sección. Y deja el último error en pantalla aunque cambies el contenido: si el error habla de líneas que tu script no tiene, es viejo.

**`create or replace function` falla si cambian las columnas que devuelve.** Hay que hacer `drop function` antes.

**Los rechazos de la base son silenciosos.** Una política que dice que no devuelve un error que no le dice nada a nadie, y si el código no lo mira, el botón simplemente no hace nada. `src/lib/errores.ts` los traduce. **Al agregar una escritura nueva, mirar el error.**

**Cuidado con las horas negativas.** `registrarBaja` calcula las horas que faltaban para el partido; en uno pasado da negativo, y todo lo negativo cae por debajo del umbral de los 45 minutos. Un botón de "Bajarme" en un partido terminado le arruinaba la confiabilidad a quien lo tocara.

**Nada de `confirm()` ni `alert()` del navegador.** Safari en iPhone le ofrece al usuario "no mostrar más avisos de esta página" cuando una página muestra varios seguidos. Una vez que lo bloquea, **`confirm()` devuelve `false` al instante y sin mostrar nada**: el botón queda muerto para siempre, en ese teléfono, sin ningún error. Le pasó al botón de cancelar un partido.

Toda confirmación va **dentro de la pantalla**, en dos toques, como "pasar la capitanía" o "darme de baja". Todo aviso va como cartel en la página. En `src/` no debe quedar ningún `confirm(` ni `alert(`.

**Toda escritura que puede ser rechazada por permisos necesita `.select()`.** Un `update` o `delete` bloqueado por RLS **no devuelve error**: devuelve cero filas. Sin `.select()` para contarlas, un rechazo se ve exactamente igual que un éxito.

**El service worker de la PWA sirve la versión vieja** después de cada deploy. Para verificar hay que desregistrarlo y limpiar caches, o usar pestaña nueva.

**Los degradados SVG con id fijo se pisan entre instancias:** usar `useId()`.

**`useParams()` no funciona** si el componente se renderiza fuera de un `<Route path>`.

**Vercel necesita `vercel.json`** con el rewrite catch-all, o los links profundos dan 404 al entrar directo.

**La Edge Function** quedó con nombre visible "notificar" pero **slug real `rapid-action`**: el frontend invoca `rapid-action`.

---

## Lo que no ve quien programa

Claude Code **no puede iniciar sesión**, así que las pantallas internas nunca las usó nadie más que el dueño del producto. Las dos veces que reportó algo que parecía cosmético, abajo había un problema serio: el botón de "Bajarme" en partidos viejos registraba bajas tardías, y el acordeón de preguntas frecuentes escondía trece respuestas de Google.

**Cuando aparezca un reporte de una pantalla interna, buscar la causa de fondo.** El buzón de sugerencias (`/panel`) existe para que ese canal no dependa de una sola persona.
