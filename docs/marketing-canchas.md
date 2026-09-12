# Canchas y difusión

Cómo se monetiza Fulbito Random con los complejos, y cómo se consiguen jugadores sin plata y con una sola persona trabajando.

Escrito el 12 de septiembre de 2026, con la app recién abierta a un puñado de conocidos. Todo lo que sigue está calibrado para eso: cero usuarios masivos, cero presupuesto, subdominio de Vercel, una persona.

**Advertencia de método:** este documento distingue entre lo que sé y lo que apuesto. Donde dice *apuesta*, es una hipótesis que todavía no se probó y que puede salir mal. Donde hay un número en pesos, es una estimación discutible y está dicho de dónde sale.

---

## 0. Lo primero: la investigación competitiva dice que no hagas esto

Antes de escribir una línea sobre canchas hay que decir en voz alta lo que está en `docs/investigacion-competitiva.pdf`, sección 6, columna "Fuera del MVP":

> Pagos; reservas de cancha; torneos; árbitros; chat; wearables; mapas; sponsors; rankings públicos; marketplace. *Agregan complejidad sin validar el núcleo de la propuesta.*

O sea: el propio documento fundacional del producto puso "reservas de cancha" y "sponsors" del lado de afuera. Este plan no lo contradice, lo ordena en el tiempo. La conclusión operativa es que **la parte de canchas no se construye hasta que el círculo virtuoso funcione solo** (partido → valoración → nivel → equipos parejos → otro partido), y hoy no funciona solo: se abrió hace días.

Lo que sí se puede hacer hoy es lo barato y lo reversible: hablar con tres dueños, conseguir que presten una hora muerta, y usar eso para traer jugadores. Eso no es "construir el lado proveedor". Es conseguir usuarios usando canchas como canal. Es distinto y cuesta cero.

---

## 1. Qué gana una cancha, en concreto

### Cómo trabaja hoy un complejo de fútbol 5 en Argentina

Hay que sacarse de la cabeza la imagen del negocio digitalizado. El complejo típico del conurbano o de CABA funciona así:

- **La reserva entra por WhatsApp.** Un teléfono, una persona atendiendo, y una planilla —de papel, de Excel o de un software de turnos— donde se anota "jueves 21, Los Pibes". Los que ya tienen software usan Turnito, AlquiláTuCancha, Dónde Juego, CanchaFija o alguno parecido. Ese mercado está resuelto y tiene cinco competidores peleándose: **Fulbito Random no tiene absolutamente nada que hacer ahí.**
- **El negocio vive de los turnos fijos.** El mismo grupo, el mismo día, la misma hora, todas las semanas. Eso es la base de facturación, y es lo que un dueño cuida más que a nada.
- **La franja que vale es angosta:** de 19 a 22, de lunes a viernes. Según el relevamiento de precios 2026 de TuCancha, la hora nocturna en CABA arranca en unos $55.000 y llega a $80.000 en zona centro; jugar de día sale entre 20% y 40% menos, justamente porque no lo quiere nadie.
- **El resto del día es descarte.** Mañanas, siesta, lunes y martes. El dueño ya lo asume: vende esas horas con promoción cuando se acuerda, o no las vende.

### El dolor real, y no es "visibilidad"

Son tres, en orden de cuánto duelen:

**1. El turno que se cae el mismo día.** El grupo avisa a las siete de la tarde que son ocho y no juegan. Esa hora ya no se vende: no hay tiempo de conseguir otro grupo. Es pérdida total, y es la más bronca porque la cancha estaba lista.

**2. El turno fijo que se desarma.** Un grupo de diez que juega hace tres años se queda sin dos jugadores —uno se mudó, otro se lesionó— y en un mes deja de venir. El dueño no pierde una hora: pierde cincuenta y dos.

**3. Las horas que nunca se llenaron.** Los martes a las 20, los sábados a las 10 de la mañana. Duele menos porque ya está descontado del presupuesto mental, pero es donde hay más metros cuadrados vacíos.

Y el contexto de 2026 los agrava a los tres: la Cámara de Fútbol 5 habla de unos 4.000 establecimientos en el país, y la prensa del sector viene reportando caídas de alquiler de turnos del 25% por la situación económica, que se profundizaron hasta el 35% con el Mundial en pantalla. Con la agenda llena nadie te atiende. Con la agenda a medio llenar, sí.

### Qué de lo que ya tiene la app se convierte en beneficio

Esta es la parte importante, y hay que ser quirúrgico: **lo único que se le puede vender a alguien es lo que la app efectivamente mide.** Fui a `panel_metricas` (`supabase/migrations/0006_tanda_grande.sql`) y a `cancha_resumen` (`0000_esquema_base.sql`) a ver qué hay de verdad.

Hay cuatro cosas, y solo cuatro:

| Lo que la app sabe hoy | De dónde sale | En qué se convierte para el dueño |
|---|---|---|
| Qué canchas se usan más y cuántos jugadores pasaron por cada una | `canchas_top` en `panel_metricas`; `canchas_con_uso()` | Un ranking de zona. Sirve poco hoy y mucho con volumen. |
| Qué días y a qué horas juega la gente | `dias` y `horas` en `panel_metricas` | **Demanda por franja horaria.** Esto es lo que un dueño no tiene. |
| Qué opinan de la cancha, desglosado | `cancha_resumen`: césped, iluminación, vestuarios, estacionamiento, atención | Auditoría gratis y anónima de su propio negocio. |
| Cuánto se está cobrando la hora en la zona | `valor_promedio` en `panel_metricas`, de `partidos.valor_cancha` | Referencia de precio del barrio. |

Y hay una quinta cosa que no es un dato sino una **capacidad**, y es la que más vale: **la app junta al jugador que falta con el partido al que le falta uno.** El link de partido (`/p/:token`), el buscador de jugadores por cercanía, y la disponibilidad declarada por jugador (`src/lib/disponibilidad.ts`: lunes a miércoles / jueves y viernes / sábados / domingos, mañana / tarde / noche). Nadie paga por ver una estadística. Un dueño sí paga por que no se le caiga el turno de las nueve.

### La frase que le sirve a un dueño

No es "te damos visibilidad". Es esta:

> **"Cuando a un grupo tuyo le faltan dos para jugar el jueves, en vez de cancelarte el turno pasan un link y los consiguen. Vos no perdés la hora."**

Eso es defendible, es concreto, y se apoya en lo que la app ya hace hoy. Todo lo demás —el panel de ocupación, el ranking, las reservas— es promesa.

### Lo que hay que decirle que NO hace

Por honestidad y porque miente mal: la app **no toma reservas, no cobra señas y no mueve plata**. Esa última parte es decisión de producto tomada y escrita (`docs/decisiones.md`: "La plata del fulbito se arregla en persona"). Si un dueño te pide integración con Mercado Pago, la respuesta correcta es "no lo hacemos, usá Turnito para eso, nosotros te traemos la gente". Ir a competir con cinco sistemas de reserva con cero presupuesto es la forma más rápida de no hacer nada bien.

### Lo que falta construir del lado de la cancha (y es menos de lo que parece)

En la base ya existe `canchas.dueno_id`, con su política `"el dueno edita su cancha"`. O sea: **la mitad del trabajo ya está hecha y nadie lo sabe**, porque no hay pantalla. Hoy el perfil de cancha solo se llega desde un partido (`/canchas/:id`, ruta en `App.tsx`), no hay listado de canchas, no hay forma de que un dueño reclame la suya, y no hay forma de que publique nada.

Lo mínimo indispensable, el día que haga falta (y **no antes**):

1. Que un dueño pueda reclamar su cancha y editarla (la política ya existe; falta pantalla).
2. Que pueda crear un partido abierto en su propia cancha. La app ya sabe crear partidos abiertos: lo que falta es el permiso y el botón.
3. Un listado de canchas por cercanía. `canchas_con_uso()` ya devuelve exactamente eso, ordenado por uso.

Son tres pantallas, no un producto nuevo. Pero repito: **no se construyen hasta que haya un dueño que las pidió dos veces.**

**Un bug a arreglar antes de mostrarle el panel a nadie:** `canchas_top` agrupa por `p.cancha`, que es el texto que cada capitán escribió a mano, mientras que `cancha_resumen` y `canchas_con_uso()` agrupan por `cancha_id`. "El Potrero", "el potrero" y "Complejo El Potrero" son tres filas distintas en el ranking del panel. Con diez partidos no se nota; con cien, el ranking que le mostrás a un dueño está mal y él lo va a notar antes que vos.

---

## 2. Qué se le cobra y cómo

### La respuesta honesta primero: hoy no se le cobra a nadie

Con un puñado de usuarios conocidos entre sí, cobrarle a un complejo es venderle humo. Y es peor que no cobrar, porque quema al único activo que tenés: son tres o cuatro dueños en tu zona y si les vendés algo que no funciona, no te atienden más. La reputación del que vende en un barrio se arruina una sola vez.

**El hito para empezar a cobrar.** No "cuando tengamos X usuarios", que es un número que se puede inflar. Es esto, medible en el panel que ya existe:

> **Cuatro semanas seguidas con al menos tres partidos por semana en la misma zona, y al menos un partido por semana que se completó con alguien que no era del grupo original.**

El primer número sale de `partidos_semanales` cruzado con `zonas`. El segundo es el que importa de verdad, porque es la prueba de que la app hace algo que WhatsApp no hace: llenar un lugar con un desconocido. Hoy se puede aproximar mirando `invitaciones` y `invitaciones_aceptadas` en el bloque de compromiso, aunque para medirlo bien habría que contar participantes que entraron por token de partido sin pertenecer al grupo — dato que hoy no está separado y que conviene empezar a contar cuando importe.

Mientras ese hito no se cumpla, la relación con las canchas es **de canje, no de plata**. Lo cual no es poco: es la forma más barata de conseguir jugadores.

### Modelo A — Canje por horas (el que arrancaría hoy, a $0)

El complejo no paga un peso. Presta una hora muerta —martes 20, sábado 10 de la mañana— y a cambio Fulbito Random le lleva diez jugadores que no tenía, y publica el partido con el nombre del complejo.

- **Lo que gana el dueño:** una hora que valía cero pasa a valer el consumo de la cantina y diez tipos que conocen su cancha. Si le cae bien el grupo, pueden volverse un turno fijo.
- **Lo que gana Fulbito Random:** diez jugadores nuevos en una sola zona, que es exactamente la forma en que este producto crece (ver sección 4). Y la cancha entra al catálogo propio con perfil y valoraciones.
- **Cuánto cuesta:** cero pesos y unas dos horas de trabajo por partido, entre conseguirlo y llenarlo.
- **Por qué funciona ahora:** porque lo que pedís tiene costo marginal casi nulo para él. Una hora vacía no le cuesta plata; solo le cuesta si te la regala en horario bueno, y por eso no se la pedís.

**Es el que hay que arrancar esta semana.** No es un modelo de ingresos, es un modelo de adquisición disfrazado de acuerdo comercial, y está bien que lo sea.

### Modelo B — Abono mensual por complejo (el que sigue, cuando se cumpla el hito)

Un abono chico y fijo, por complejo, por mes. Le da: perfil de cancha con sus valoraciones, la posibilidad de publicar sus propios partidos abiertos, y el dato de demanda de su zona (qué días y a qué horas quiere jugar la gente que está a menos de 3 km).

**El número.** Dos anclas reales para pensarlo:

- AlquiláTuCancha cobra desde unos **$48.500 por mes** el plan base (1 a 3 canchas), y eso incluye el sistema de reservas completo.
- Turnito tiene plan gratis de por vida y sus planes pagos van por 5% de comisión o suscripción.

Fulbito Random ofrece **mucho menos** que eso: no toma reservas. Entonces el precio tiene que ser claramente menor, y la regla que propongo es: **debe costar menos que una hora de cancha nocturna.** A precios de 2026, eso es un techo de $55.000 y un número cómodo de **$25.000 a $35.000 por mes** por complejo.

El razonamiento: si le llenás **un** turno muerto por mes, ya se pagó solo con el margen de esa hora más el consumo. Eso es fácil de decir en una mesa y fácil de verificar para él, que es lo que hace que un precio se pueda defender. Pedir más obliga a demostrar dos o tres turnos por mes, y ahí ya no controlás el resultado.

Con diez complejos son $250.000 a $350.000 por mes. No cambia la vida de nadie, pero **paga el dominio, el Supabase pago cuando el free tier no alcance, y demuestra que alguien paga**, que es la única validación que importa.

### Modelo C — Comisión por partido completado (el correcto a largo plazo, imposible hoy)

Cobrar por resultado: $2.500 a $4.000 por cada jugador que llegó a esa cancha por Fulbito Random y no la conocía. Es el modelo más justo —el dueño paga solo si funcionó— y el que usan los que viven de esto: Fubles llega a quedarse con hasta el 20% del costo del partido.

**Por qué no se puede hoy, y no es por falta de usuarios:** la app no mueve plata, por decisión de producto. Sin pago dentro de la app no hay forma de verificar quién llegó por dónde ni de cobrar automáticamente; queda todo en la palabra del dueño y en una planilla. Con tres complejos amigos eso se banca; con veinte es un trabajo de cobranza para una persona que ya está programando sola.

Meter pagos cambia el producto de raíz y contradice una decisión escrita. **Es un modelo para dentro de un año o para nunca, y está bien que sea el último de la lista.**

### Con cuál arrancar

**A hoy, B cuando se cumpla el hito, C probablemente nunca.**

Y una cuarta opción que conviene tener en la cabeza: que el negocio no esté en las canchas sino en **los organizadores de torneos**, que es lo que ya está anotado en `docs/plan.md` sección 9 ("Equipo contra equipo — a futuro, con negocio detrás"). Un tipo que organiza una liga de veinte equipos tiene un problema más caro que el de una cancha —fixture, resultados, tabla, fechas— y ya paga por resolverlo mal, con Excel y WhatsApp. La app tiene la mitad de eso construida. *Apuesta:* ese cliente paga más y regatea menos que un dueño de cancha. No hay evidencia todavía, pero es la línea que yo miraría antes de escalar el modelo B.

---

## 3. Cómo se le vende

### Con qué tres canchas arrancar

No con las mejores. Con **las que ya te conocen**:

1. **La cancha donde juega Fulbito Rústico.** Sos cliente hace años. Ese dueño ya te atiende y ya sabe que no le vas a hacer perder el tiempo. Es la primera conversación y es casi gratis.
2. **La segunda cancha del mismo barrio.** Una vez que la primera dijo que sí, la segunda conversación empieza con "esto lo estamos haciendo con los de la otra cuadra", que es el argumento más fuerte que vas a tener en mucho tiempo.
3. **La que tenga peor lunes.** Un complejo con la agenda floja te va a escuchar; uno con la agenda llena te va a despachar en dos minutos y va a tener razón.

Todo en la misma zona. Tres canchas desparramadas en tres barrios no sirven para nada: ver sección 4.

### El guion de la primera conversación

Presencial, en la cancha, en un horario muerto —martes a las cinco de la tarde— que es cuando el dueño tiene tiempo y cuando el problema del que vas a hablar está a la vista. Nunca un viernes a las nueve.

**Cómo abrir (sin decir la palabra "app"):**

> "Che, juego acá hace años con el grupo. Armé una cosa para organizar los partidos, y tengo una idea para tus horas flojas. ¿Tenés cinco minutos o vengo otro día?"

Preguntar si tiene tiempo es importante: te separa de todos los que le vinieron a vender un sistema de reservas este año.

**Las tres preguntas, antes de mostrar nada:**

1. *"¿Cuántos turnos por semana se te caen el mismo día porque no juntan gente?"*
2. *"¿Cuál es la hora que más te cuesta vender?"*
3. *"¿Qué hacés hoy cuando te queda una hora libre a última hora?"*

Estas tres preguntas hacen dos cosas. Te dan la información que necesitás para el precio, y lo hacen a él decir en voz alta que tiene un problema. Si contesta que no se le cae ningún turno y que vende todo, agradecé y andate: no es cliente, y tenés una tarde para usar en otro lado.

**Qué mostrarle, del celular, en este orden:**

1. **El perfil de su propia cancha**, si ya se jugó algún partido ahí. Las estrellas por césped, iluminación, vestuarios, estacionamiento y atención, y los comentarios anónimos. Esto es lo que más pega, porque **es información sobre él que no tiene** y nadie le da: sus clientes no le dicen en la cara que los vestuarios están mal.
2. **Un partido real con el link.** Que vea la lista en vivo, los 8/10, el botón de sumarse. Diez segundos.
3. **Nada más.** No le muestres el panel de métricas: con estos números, un panel casi vacío te desarma la conversación entera. Cuando haya volumen, será lo primero.

**Qué pedirle (una sola cosa, y chica):**

> "Prestame una hora muerta, la que a vos no te sirve. Yo te la lleno con diez tipos. Si te sirve, lo repetimos; si no, no me viste más."

No le pidas que firme nada, que se registre, que cargue su cancha ni que baje una app. **Le pedís una hora.** Es la venta más chica posible y por eso es la que entra.

**Qué NO prometer, nunca:**

- Que le vas a llevar clientes todas las semanas.
- Que la app tiene usuarios. Tiene un puñado, y si lo exagerás se va a notar a la tercera semana.
- Reservas, cobros, señas o integración con nada.

Si pregunta cuánta gente usa la app, la respuesta correcta es la verdad: *"Arrancamos hace días, somos pocos y todos de la zona. Por eso te pido una hora y no te cobro nada."* La honestidad acá es estrategia, no moral: es lo que te deja volver en tres meses.

**Cómo cerrar:** salís de ahí con **una fecha concreta** —"martes 23 a las 20"— y su número de WhatsApp. Sin fecha, no hubo reunión.

**Y después de ese partido, la única pregunta que importa:** *"¿Alguno de los diez volvió a reservarte por su cuenta?"* Si a los dos meses la respuesta es sí, el modelo B es vendible. Si es no, el producto no genera valor para una cancha y hay que dejar de insistir por acá.

### La sección "¿Tenés una cancha?" de la landing

**Lo que hay hoy** (`src/pages/Landing.tsx`, alrededor de la línea 760) dice, en resumen: *"Estamos armando la parte para complejos: cargar tu establecimiento, publicar partidos, que la gente se anote sola. Si querés estar entre los primeros, escribime."*

**Qué está mal:**

1. **Vende una promesa, no un beneficio.** "Estamos armando" es pedirle a un tipo que labura que espere a que vos termines. No hay nada ahí que le resuelva un problema esta semana.
2. **"Cargar tu establecimiento" es trabajo para él, no valor.** El beneficio está escrito desde lo que hace la app, no desde lo que él gana.
3. **"Estar entre los primeros" no significa nada para un dueño de cancha.** Ese argumento le funciona a un early adopter de software, no a alguien que gestiona diez turnos por noche.
4. **El botón dice "Escribime por mi cancha".** Mail, en 2026, a un negocio que vive de WhatsApp. Es la fricción más cara de toda la página.
5. Y hay una incoherencia de tono: toda la landing habla derecho y concreto —"Armá el fulbito sin contar mensajes", "Las reglas están a la vista: si no se entienden, parecen acomodo"— y esta sección de golpe habla como un formulario.

**Propuesta de reemplazo** (para cuando el dueño del producto decida tocar el archivo; acá no se toca nada):

> **PARA DUEÑOS DE CANCHAS**
>
> # Te llenamos una hora muerta
>
> Elegís la hora que no te sirve —un martes a las 20, un sábado temprano— y nosotros la publicamos como partido abierto para los jugadores de tu zona. Cada uno se anota solo con un link. Vos no cargás nada ni instalás nada.
>
> Somos nuevos y somos pocos, así que no te vendemos una agenda llena: te proponemos probar una hora. Si funciona, seguimos. Si no, no perdiste nada.
>
> [ **Escribime por WhatsApp** ]
>
> *También podés ver qué dicen los jugadores de tu cancha: césped, iluminación, vestuarios, estacionamiento y atención, puntuado por los que jugaron ahí.*

**Cambios concretos respecto de lo que hay:** el título pasa a ser el beneficio; se admite en la página que sos chico, lo que sube la credibilidad en vez de bajarla; el pedido es una hora y no un registro; el botón va a WhatsApp (`https://wa.me/...`) en lugar del `mailto:`; y la valoración de cancha, que hoy no se menciona, pasa a estar — es lo único que ya funciona y que nadie más le ofrece.

*Apuesta:* el cambio de mail a WhatsApp es el que más va a mover la aguja de los cinco. No tengo cómo probarlo hasta que haya tráfico.

---

## 4. El plan de difusión para conseguir jugadores

### La regla que ordena todo: densidad geográfica

Este producto no sirve con usuarios; sirve con **vecinos**. Doscientos jugadores repartidos por todo el AMBA no completan un solo partido. Treinta en Caballito que juegan los jueves a la noche, sí.

El motivo está en el código, no en la teoría: los partidos se ordenan por distancia real (`Partidos.tsx`), el buscador de jugadores filtra por kilómetros (`jugadores_disponibles(p_lat, p_lng, p_km)`), y la disponibilidad se declara por franja (`jueves y viernes`, `a la noche`). Un usuario a 20 km es, funcionalmente, un usuario que no existe.

**Consecuencia incómoda:** un posteo que hace mil visualizaciones desparramadas vale menos que uno que hace ochenta en un barrio. Cualquier métrica de alcance que no esté cortada por zona miente.

**Decisión:** una sola zona a la vez. La del Fulbito Rústico. No se abre la segunda hasta que la primera tenga tres partidos por semana andando solos.

### Qué hacer con @fulbitorustico

La cuenta tiene algo que no se compra: **once años de historia real.** Torneos, puntuación fecha a fecha, fiesta de cierre, gente que se la bancó todo el campeonato. Eso es contenido y es prueba social al mismo tiempo. La landing ya lo usa bien ("Venimos de Fulbito Rústico · Since 2015").

El error a evitar: convertir la cuenta en un folleto de la app. Si los quince que la siguen la dejan de mirar, perdiste lo único que tenías. La regla es **cuatro de cinco posteos son fulbito, uno es la app**, y la app aparece adentro del fulbito, no al lado.

### Contenido concreto, no categorías

**Semanal, todas las semanas (el pilar):**

**"La fecha"** — el día después del partido. El resultado, quién hizo los goles, el MVP votado. La app ya genera la imagen 1080×1920 para historias (`src/lib/historia.ts`), dibujada en el celular, con la marca y los cinco pentágonos. No hay que diseñar nada: sale de la app, se comparte, listo. Es el posteo que sostiene la cuenta y cuesta dos minutos.

**Cada dos semanas:**

**"La tabla"** — la puntuación acumulada del torneo, que es lo que la gente de Fulbito Rústico ya venía mirando desde 2015. Ojo con esto: `docs/decisiones.md` prohíbe los rankings públicos *dentro de la app*, y con razón. Afuera, en el Instagram del grupo, entre gente que se conoce y que ya lo hacía antes, es otra cosa. Que no se filtre de un lado al otro.

**"El archivo"** — una foto de 2016, 2018, 2021. "Esta fecha se jugó con dos de arquero porque no llegaba nadie." Es el contenido más barato que tenés y el que mejor funciona: nostalgia de grupo chico. No vende nada y por eso construye la cuenta.

**Una vez por mes:**

**"La cancha del mes"** — el perfil de una cancha de la zona con sus puntajes reales por aspecto: césped 4,2 · iluminación 3,8 · vestuarios 2,9. **Esto tiene doble uso: es contenido para jugadores y es la carta de presentación para el dueño de esa cancha.** Cuando vayas a hablar con él, ya publicaste algo sobre su negocio. Si el puntaje es malo, se publica igual o no se publica nunca más: una reseña que solo sale cuando es buena no la cree nadie. *Advertencia:* el mínimo para mostrar una chapa son 3 valoraciones (`MINIMO_PARA_CHAPA` en `src/lib/cancha.ts`). Publicar un promedio hecho con una sola nota es inventar un dato, y con un dueño enojado enfrente no se discute.

**"Falta uno"** — una historia con un partido real al que le falta gente, con el link. Es el único posteo que pide algo. Funciona solo si es verdad y si es esta semana.

**Frecuencia total:** tres posteos o historias por semana. No más. Una persona sola sostiene tres por semana durante un año; siete por semana las sostiene tres semanas y abandona, y una cuenta abandonada es peor que una cuenta chica.

### Los tres canales que no son Instagram (y que probablemente rindan más)

**1. Los grupos de WhatsApp de fulbito de la zona.** Acá está el usuario, literalmente: existe Fulbitos5, una red de más de 50 grupos de WhatsApp con más de 1.600 jugadores en CABA y GBA, donde la gente publica "me faltan dos para el jueves en Villa Crespo" y se completan solos. Eso es exactamente el problema que resuelve la app, ya con gente adentro y ya con el hábito formado.

La forma de entrar **no es** publicar "bajate esta app". Es entrar como jugador, usar la app para un partido propio, y cuando alguien pregunte cómo hiciste la lista, pasar el link. El link de partido no pide instalar nada ni registrarse para mirar (`/p/:token`), que es justo lo que hace que se pueda pasar en un grupo ajeno sin que te echen.

*Apuesta, y la más fuerte del documento:* **un solo grupo de WhatsApp de la zona bien trabajado va a traer más jugadores útiles que seis meses de Instagram.** Porque ya están agrupados por barrio, que es la única variable que importa.

**2. El cartel en la cancha.** Un QR impreso en una hoja A4 pegado en el vestuario del complejo que te prestó la hora, que lleve a un partido abierto de esa cancha. Cuesta la impresión. La gente que lo ve está, por definición, a cero kilómetros y con los botines puestos. Es el canal con mejor densidad geográfica que existe y no lo tiene ninguna app grande.

**3. Las catorce preguntas frecuentes de la landing.** Ya están escritas y ya están en el HTML aunque el acordeón esté cerrado —eso fue deliberado y está explicado en el código—. Son exactamente lo que alguien escribe en Google: *"cómo armar equipos parejos fútbol 5"*, *"app para anotarse a un partido"*. Es tráfico gratis que llega solo, y llega desparramado por todo el país, que es su límite: sirve para que alguien de Rosario arme su propio grupo, no para densificar tu barrio. **Esto se rompe el día que se cambie de dominio**, así que cuando haya dominio propio hay que redirigir con 301 y no perder lo que se juntó.

### Cómo medir si sirve

Con lo que ya está en `/panel`, sin construir nada nuevo. Una vez por semana, cuatro números:

1. **`zonas`** — la única métrica que importa de verdad. ¿La zona de arriba está creciendo, o estás juntando gente suelta en diez barrios? Si el primer lugar no despega, el plan no está funcionando aunque suban los usuarios totales.
2. **`embudo`: jugaron 1 → jugaron 3.** El paso de 1 a 3 es el que dice si la app sirve o si fue una curiosidad. Un embudo donde entran veinte y llegan a tres partidos dos, es un producto que no retiene, y ningún plan de difusión arregla eso.
3. **`invitaciones_aceptadas` sobre `invitaciones`.** Mide si el link funciona como mecanismo de crecimiento, que es la apuesta central de todo el producto.
4. **`partidos_semanales`.** Si sube la gente y no suben los partidos, estás juntando espectadores.

**La única métrica de Instagram que vale la pena mirar:** cuántos mensajes privados llegaron preguntando por un partido. Los seguidores, el alcance y los likes no se cuentan — no porque estén mal, sino porque con esta escala son ruido y te van a hacer tomar decisiones equivocadas.

**Cuándo dar por fracasado el plan:** si a las ocho semanas de trabajo sostenido la zona número uno del panel no tiene al menos quince jugadores y dos partidos por semana, el canal está mal elegido y hay que cambiarlo, no insistir más fuerte.

---

## 5. Los riesgos

**1. Que el dueño de cancha te vea como competencia.** Él ya tiene sus clientes y su grupo de WhatsApp; que vos le armes partidos en su cancha con gente que no conoce puede sonarle a que le estás metiendo la mano en la relación con su cliente. *Señal temprana:* la primera conversación termina en "dejame tu número y te llamo". Nunca llama. *Cómo se evita:* pedir la hora muerta y nunca la buena. En la hora muerta no le sacás nada a nadie.

**2. Que el partido que le armaste salga mal.** Vas con diez, aparecen seis, se juega mal, alguien rompe algo. Perdiste al dueño y a los seis jugadores de una. *Señal temprana:* la ocupación (`partidos.ocupacion`) por debajo del 80% y las bajas tardías arriba del 20% de las bajas. *Cómo se evita:* no publicar el partido hasta tener ocho comprometidos de tu grupo conocido, y usar los desconocidos para los últimos dos lugares, no para los primeros ocho.

**3. Que la app no retenga y todo el esfuerzo comercial se evapore.** Es el riesgo más grande y es de producto, no de marketing. Si la gente juega una vez y no vuelve, no hay guion de ventas que sirva. *Señal temprana:* el salto de `jugaron_1` a `jugaron_3` en el embudo. Si es menos de un tercio a las seis semanas, hay que parar de vender y volver a programar.

**4. Que el crecimiento sea ancho y flaco.** Cien usuarios en veinte barrios y ningún partido que se complete. Es el fracaso más traicionero porque los números totales suben y parece que va bien. *Señal temprana:* `zonas` con la primera zona en menos del 30% del total.

**5. Que el resultado y los goles envenenen el clima del grupo.** Ya está escrito como advertencia en `docs/decisiones.md` y vale doble para el marketing: si el contenido de Instagram empieza a ser tablas y goleadores, estás empujando justo lo que la investigación competitiva desaconseja. *Señal temprana:* alguien discute una nota o un gol en el grupo de WhatsApp. La primera vez que pasa hay que tomarlo en serio, no como una broma.

**6. Que el dueño del producto se queme.** Una persona que programa, atiende soporte, va a las canchas y postea en Instagram. Es el riesgo más probable de todos y el que menos se mide. *Señal temprana:* dos semanas sin postear, o el panel sin mirar por quince días. *Cómo se mitiga:* tres posteos por semana y no más, y una sola conversación con canchas por semana. Un plan que solo funciona si trabajás todos los días no es un plan.

**7. Que aparezca un competidor con plata haciendo lo mismo.** Plei, CeleBreak y compañía ya levantaron inversión y ya operan. *Por qué no me preocupa todavía:* ninguno hace reputación portátil del jugador ni confiabilidad por bajas tardías, que es el diferencial que marca la investigación competitiva y lo que casi nadie mide. *Cuándo preocuparse:* el día que alguno saque valoración anónima entre compañeros. Ahí el diferencial se evaporó y hay que correr hacia la afinidad entre jugadores, que es la barrera que nadie construyó.

**8. Que cobrar rompa la confianza.** La app dice en la cara, en las preguntas frecuentes, "¿Cuánto sale? Nada. La app es gratis". El día que un complejo pague, hay que cuidar que eso no se traduzca en canchas destacadas por plata mezcladas con las ordenadas por cercanía. *Señal temprana:* la primera vez que dudes si un partido aparece arriba porque está cerca o porque el dueño pagó. Si un jugador puede hacerse esa pregunta, el orden ya está roto, y el orden por distancia real es media propuesta de valor.

---

## Lo que hay que hacer esta semana

Una sola cosa, para que se haga:

> **Ir a la cancha donde juega Fulbito Rústico, un martes a la tarde, y salir con una fecha para un partido abierto en una hora muerta.**

Todo lo demás de este documento depende de eso y no al revés.

---

*Fuentes de los datos de mercado citados: [TuCancha — precios 2026](https://tucancha.com.ar/blog/cuanto-cuesta-alquilar-una-cancha-de-futbol-5-en-argentina-en-2026), [Perfil — Cámara de Fútbol 5](https://www.perfil.com/noticias/reperfilar/la-crisis-del-futbol-5-el-10-de-los-complejos-cerraron.phtml), [Crónica — caída del alquiler de canchas](https://www.cronica.com.ar/sociedad/la-crisis-tambien-golpea-al-futbol-5-cae-el-alquiler-de-canchas-y-el-mundial-agrava-la-tendencia/), [Turnito — comparativa de apps de reserva 2026](https://turnito.app/blog/las-mejores-apps-de-reservas-para-clubes-en-argentina-2026/), [Dónde Juego](https://www.dondejuegoapp.com/), [Fulbitos5](https://fulbitos5.com/), [Forbes Argentina — AlquiláTuCancha](https://www.forbesargentina.com/negocios/crearon-una-app-alquilar-canchas-tienen-mas-350-clubes-200-mil-usuarios-pico-monaco-como-inversor-n36054). Los precios son de septiembre de 2026 y envejecen rápido: verificar antes de usarlos en una conversación.*
