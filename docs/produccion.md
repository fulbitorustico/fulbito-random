# Puesta en producción

Qué hay que arreglar, en qué orden, cuánto sale y cuánto lleva.

Escrito el 12 de septiembre de 2026, con la app ya abierta a los primeros usuarios reales. Está ordenado por urgencia: lo de arriba es lo que más duele hoy.

**Las tres decisiones que tenés que tomar**, y el resto es ejecución:

1. ¿Comprás el dominio propio (`fulbitorandom.com.ar`) o seguís con `fulbito-random.vercel.app`? Es barato y destraba la pantalla de Google.
2. ¿Pagás US$35 por mes para que no aparezca nunca más `supabase.co`, o te alcanza con la opción gratis que muestra "Fulbito Random"? **La respuesta casi seguro es la gratis.**
3. ¿Está configurado el SMTP propio en Supabase? Si no lo está, la app hoy deja entrar a **dos personas por hora** y no te enteraste. Es un chequeo de cinco minutos y está en el punto 4.

---

## 1. La pantalla de Google dice "frygdjugegnjqhrdimgp.supabase.co"

### Qué pasa

Cuando alguien toca "Entrar con Google", Google le muestra una pantalla que dice *"Accede a frygdjugegnjqhrdimgp.supabase.co"*. El usuario que lo reportó dijo que "puede ser considerado sospechoso", y **tiene toda la razón**: una cadena de letras al azar es exactamente lo que se ve en un intento de phishing. Es el momento más frágil de la app, porque es justo cuando la persona decide si te confía su cuenta de Google.

No es un error tuyo. La documentación de Supabase lo dice con todas las letras: si no configurás nada, los usuarios ven `<project-id>.supabase.co`, algo que "no inspira confianza y puede hacer que tu aplicación sea más susceptible a intentos de phishing exitosos".

### Por qué pasa

Cuando la persona entra con Google, Google no la manda de vuelta a tu app: la manda primero a Supabase, a una dirección que termina en `frygdjugegnjqhrdimgp.supabase.co/auth/v1/callback`. Supabase recibe el dato, arma la sesión y recién ahí la devuelve a Fulbito Random.

Google, en esa pantalla, muestra **el dominio al que va a mandar a la persona**. Y ese dominio es de Supabase, no tuyo.

Ahora, la parte importante: Google muestra ese dominio pelado **sólo mientras tu "marca" no esté verificada**. La documentación de Google es explícita: *"Tu marca debe estar verificada si querés que el logo y el nombre de tu aplicación sean visibles para los usuarios en la pantalla de consentimiento"*, y si no lo está, *"sólo el dominio de tu aplicación será visible para los usuarios"*.

Traducido: **hoy se ve el dominio porque no verificaste la marca. Verificándola se ve "Fulbito Random" con tu logo.** Y eso es gratis.

### Las tres opciones, de mejor a peor

#### Opción A — Verificar la marca en Google. GRATIS. Es la que te conviene.

Hace que la pantalla muestre **"Fulbito Random"** y tu logo de los cinco pentágonos en lugar del dominio raro.

Los pasos, para alguien que nunca lo hizo:

1. Entrá a `console.cloud.google.com` con la cuenta de Google con la que creaste las credenciales de la app.
2. Arriba a la izquierda, elegí el proyecto de Fulbito Random (es el que ya tiene el "ID de cliente" que está cargado en Supabase).
3. En el buscador de arriba escribí **"Google Auth Platform"** y entrá. Ahí adentro buscá la sección **"Branding"** (Marca).
4. Completá:
   - **Nombre de la aplicación**: `Fulbito Random`. Tal cual, sin agregados.
   - **Logo**: una imagen cuadrada de 120×120 píxeles, en PNG o JPG, de menos de 1 MB. Ya tenés el ícono en `public/icon-192.png`; hay que achicarlo a 120×120.
   - **Correo de asistencia al usuario**: un mail que mires de verdad. Lo ideal es `info.fulbitorustico@gmail.com`.
   - **Página principal**, **Política de privacidad** y **Términos del servicio**: las páginas ya existen (`/`, `/privacidad`, `/terminos`).
   - **Dominios autorizados**: el dominio donde viven esas páginas.
5. Guardá y tocá **"Publish branding"** (Publicar marca). Ojo con esto: si después cambiás el nombre, el logo o los links, los cambios quedan como borrador y **no se ven hasta que volvés a publicar**.

**El detalle que puede trabarte, y por eso te lo digo ahora:** Google te va a pedir que demuestres que sos dueño de los dominios que pusiste, a través de Google Search Console. Y acá aparece el problema de usar `fulbito-random.vercel.app`: es un dominio prestado de Vercel, y Google es bastante quisquilloso con las direcciones de hosting gratuito a la hora de verificar una marca.

Por eso la recomendación real es hacer esto **junto con** comprar el dominio propio:

- Comprá `fulbitorandom.com.ar` en **nic.ar** (el precio exacto está en su sitio; un `.com.ar` es de lo más barato que hay y se paga una vez por año). Ya estaba anotado como deuda pendiente en `docs/plan.md`.
- Conectalo a Vercel. **Esto no cuesta nada**: en el plan gratuito de Vercel los dominios propios son gratis y se pueden poner hasta 50 por proyecto. Es entrar al proyecto en Vercel → Settings → Domains → agregar el dominio, y copiar los dos datos que te da hacia el panel de nic.ar.
- Usá ese dominio para la página principal, privacidad y términos, y verificá **ese** en Search Console.

Con eso, la marca se verifica sin pelear y de paso la app deja de llamarse "algo punto vercel punto app", que también suma confianza.

**Cuánto sale:** la verificación de Google, $0. El dominio, lo que salga en nic.ar (poco, y una vez al año). Conectarlo a Vercel, $0.

**Cuánto lleva:** una o dos horas de trabajo tuyo. Después Google se toma unos días hábiles en aprobar la marca — no es instantáneo, así que cuanto antes lo mandes, mejor.

**Qué NO arregla:** el dominio `supabase.co` sigue siendo, por atrás, la dirección a la que Google manda a la persona. Con la marca verificada la pantalla muestra "Fulbito Random" y el logo, que es lo que la gente lee y lo que resuelve el problema de confianza. Pero si alguien va a mirar los detalles finos, el `supabase.co` sigue estando. Para que desaparezca del todo hace falta la opción B.

#### Opción B — Dominio propio en Supabase. US$35 por mes. No vale la pena hoy.

Supabase te deja poner tu propio dominio (por ejemplo `auth.fulbitorandom.com.ar`) en lugar de `frygdjugegnjqhrdimgp.supabase.co`. Con eso, la pantalla de Google muestra tu dominio y de `supabase.co` no queda rastro.

El problema es el precio, y acá va sin vueltas:

- **El plan gratuito de Supabase no lo permite.** No es cuestión de buscarle la vuelta: no está disponible, punto.
- Hay que pasar al plan **Pro: US$25 por mes**.
- Y arriba de eso, el dominio propio es un **adicional de US$10 por mes, por dominio, por proyecto**.

**Total: US$35 por mes, todos los meses.** Para una app gratis, sin ingresos, con un puñado de usuarios, es plata tirada. La opción A resuelve el 95% del problema (que es lo que el usuario ve y lee) por cero pesos.

Esto se vuelve razonable el día que la app tenga ingresos o mucha gente. Hoy no.

Hay una variante más barata en apariencia, el "vanity subdomain" (un subdominio lindo dentro de `supabase.co`), pero **también es un adicional pago sobre un plan pago**, así que no te salva de nada.

#### Opción C — Comprar un dominio y creer que eso solo arregla la pantalla. No funciona.

Lo aclaro porque es el error natural: comprar `fulbitorandom.com.ar` y ponerlo en Vercel **no cambia nada** en la pantalla de Google por sí solo. Esa pantalla mira el dominio de Supabase, no el de tu página. El dominio propio sirve —y mucho— para que te aprueben la marca y para que la app se vea seria, pero no es por sí mismo la solución.

### Qué hacer, resumido

Comprá el dominio, conectalo a Vercel (gratis) y verificá la marca en Google (gratis). Olvidate del plan Pro de Supabase hasta que la app tenga con qué pagarlo.

---

## 2. Un deploy puede dejar la app rota a quien la tenga abierta

Este es el problema más serio que encontré, y no estaba reportado. Lo verifiqué contra la app en producción mientras escribía esto.

### Qué pasa

Cada vez que publicás una versión nueva, los archivos de código cambian de nombre: pasan de `index-BKGZumv6.js` a `index-CH7b1EQ9.js`, por ejemplo. Es a propósito y está bien. El problema es qué pasa con los archivos viejos.

Probé pedirle a la app en producción un archivo que ya no existe. **No responde "no existe": responde "acá está" y manda la página HTML de inicio.** Lo comprobé con un nombre inventado y con el nombre real de la versión anterior, y en los dos casos pasó lo mismo: código 200, tipo de contenido `text/html`, y adentro el `<!doctype html>` de la portada.

Cuando el navegador pide un archivo de código y recibe una página HTML, no puede hacer nada con eso. El error exacto que tira es:

```
TypeError: Failed to fetch dynamically imported module
```

### Por qué pasa

Por el `vercel.json`. Tiene una sola regla:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Esa regla dice "cualquier dirección que te pidan, devolvé la página de inicio". Es **necesaria** —sin ella los links profundos como `/instalar` darían error 404 al entrar directo, y eso ya está documentado en `decisiones.md`— pero está escrita demasiado amplia: también se traga los pedidos de archivos de código que no existen, y en vez de avisar que faltan, devuelve HTML con cara de éxito.

Se junta con lo otro que ya estaba anotado como trampa conocida: **el service worker de la PWA**. Como está configurado en modo `autoUpdate`, cuando llega una versión nueva el service worker toma el control enseguida y limpia los archivos viejos que tenía guardados. Entonces la persona que tenía la app abierta (o el ícono en el celular, que es peor porque queda abierto en segundo plano días enteros) se queda con el código viejo en pantalla y sin los pedazos que le faltan.

Y hay un tercer ingrediente: la app **no tiene ninguna red de contención** para cuando un pedazo no carga. En `src/App.tsx` las pantallas se cargan "cuando hacen falta" (`lazy`), envueltas en un `Suspense` que sabe mostrar "Cargando..." mientras esperan, pero **no hay nada que atrape el error si la carga falla**. Sin eso, cuando falla, se cae toda la pantalla.

### Qué hacer

Tres arreglos, de más importante a menos. **No los apliqué yo**, los tiene que aplicar quien esté tocando el código:

1. **Que los archivos que faltan digan que faltan.** En `vercel.json`, dejar la regla catch-all pero excluir la carpeta `/assets/`, para que un archivo inexistente devuelva 404 de verdad y no la portada disfrazada. Es el arreglo de fondo: sin esto, los otros dos tapan el síntoma.
2. **Poner una red de contención.** Un "error boundary" alrededor del `Suspense` en `src/App.tsx` que, cuando una pantalla no carga, en vez de romperse recargue la página sola una vez. Al recargar, el navegador se trae la versión nueva y la persona sigue como si nada.
3. **Avisar que hay versión nueva.** Hoy el `registerSW.js` sólo registra el service worker y no vuelve a chequear nunca. Conviene que revise cada tanto si hay una versión nueva y, cuando la haya, recargue en el próximo momento tranquilo.

**Cuánto sale:** $0. Es todo código.

**Cuánto lleva:** una hora, hora y media.

**Mientras tanto**, una regla práctica para vos: después de publicar una versión, si algo se ve raro, cerrá la app del todo y volvé a abrirla. Y no publiques versiones nuevas un rato antes de un partido, que es cuando todos entran al mismo tiempo.

---

## 3. El link "Ponela en tu celu" y la pantalla de partidos

### Qué encontré, y qué no

Te lo digo derecho porque acá la causa no es la obvia: **el enrutador está bien escrito**. Revisé `src/App.tsx` y además revisé el código compilado que está corriendo ahora mismo en producción, y la dirección `/instalar` figura en los tres lugares donde tiene que figurar. Abrí `https://fulbito-random.vercel.app/instalar` en un navegador y la guía de instalación aparece perfecta.

Así que la explicación fácil —"se olvidaron de agregar la ruta"— es falsa. La causa es otra, y son dos cosas distintas que terminan en la misma pantalla de partidos.

### Causa 1: no existe la ruta raíz, y todo lo desconocido cae en partidos

En `src/App.tsx`, la última línea de la lista de rutas de adentro (línea 72) dice:

```jsx
<Route path="*" element={<Navigate to="/partidos" replace />} />
```

Eso significa: *"cualquier dirección que yo no reconozca, mandala a la pantalla de partidos"*. Y en el código compilado verifiqué que **no existe ninguna ruta para `/`**, la raíz.

Esto importa por dos motivos concretos:

- La PWA instalada arranca en `/` (está en la configuración, `start_url: '/'`). O sea que **cada vez que alguien abre el ícono del celular, cae en "dirección desconocida" y lo rebotan a partidos**. Hoy funciona de casualidad, porque partidos es justo donde querés que vaya.
- El botón **"Listo, quiero entrar"** del final de la página de instalación (`src/pages/Instalar.tsx`, línea 151) lleva a `/login`. Para alguien que ya inició sesión, `/login` tampoco está en la lista de pantallas públicas, así que cae en la misma regla y **termina en partidos**. Este es un bug real y reproducible, y es muy probable que sea el que viste.

Ese `path="*"` es el que hace que todo error se vea igual: en vez de avisar que algo no anduvo, te deposita en partidos como si nada hubiera pasado.

### Causa 2: la pantalla de instalación es de las que se cargan aparte

`Instalar` es una de las pantallas que se bajan sólo cuando hacen falta. Es decir que tocar "Ponela en tu celu" **dispara un pedido de un archivo** al servidor. Si ese archivo es el de una versión vieja —exactamente el problema del punto 2— el pedido falla con el `TypeError` que mostré arriba, la pantalla no aparece, y cuando la persona vuelve a abrir la app cae en `/` y de ahí rebota a partidos.

Esto explica por qué el link *a veces* falla y por qué es difícil de reproducir: depende de si hubo un deploy desde la última vez que esa persona abrió la app.

### Dónde está y cuál es el arreglo

**No lo toqué**, como pediste. Para quien lo aplique:

- `src/App.tsx`, línea 72 — agregar una ruta explícita para `/` (que mande a `/partidos`, que es lo que ya hace, pero dicho a propósito y no por descarte), y cambiar el `path="*"` para que muestre un "esta pantalla no existe" en lugar de redirigir en silencio. Mientras redirija calladito, cualquier bug futuro va a verse como "me mandó a partidos" y se va a perder media hora buscándolo, igual que ahora.
- `src/App.tsx`, líneas 89 a 96 — agregar `/login` a la lista de pantallas públicas, o que la pantalla de instalación no mande a `/login` a alguien que ya tiene la sesión abierta.
- Lo del punto 2 (la red de contención y el `vercel.json`), que es lo que arregla la causa de fondo.

**Cuánto sale:** $0.

**Cuánto lleva:** veinte minutos, sin contar lo del punto 2.

**Una aclaración honesta:** no pude iniciar sesión para reproducirlo con mis propios ojos, así que no vi el momento exacto en que te pasó. Lo que sí hice fue descartar la causa obvia con pruebas contra producción, y dejar identificados dos defectos reales que producen exactamente ese síntoma. El de `/login` lo doy por seguro; el del archivo viejo depende de si hubo un deploy en el medio.

---

## 4. Los techos del plan gratuito

Tres techos, y están muy lejos uno del otro. El primero te puede estar pegando **hoy**.

### El techo urgente: los mails para entrar

**Esto es lo que más riesgo tiene de estar roto ahora mismo y que no te hayas enterado.**

Supabase trae un servicio de mail propio para mandar los links de ingreso, pero es una demostración, no un servicio de verdad: está limitado a **2 mails por hora** y sólo le manda a las direcciones de tu propio equipo. Es explícitamente "no apto para producción".

Para levantar ese techo hay que configurar un SMTP propio —Resend, en este caso— dentro de la configuración de Auth de Supabase. Recién ahí el límite pasa a 30 mails por hora y se puede subir.

El problema es que en la documentación del proyecto esto quedó ambiguo. En `docs/plan.md` figura "mails por Resend" como algo que ya está funcionando, pero en `docs/plan-paridad-competitiva.md` (línea 80) todavía figura como pendiente: *"Evaluar reemplazar el SMTP default de Supabase Auth… por Resend como SMTP custom"*. Y `supabase/migrations/README.md` avisa que toda la configuración de Auth —incluido el SMTP— **no está guardada en el repositorio**, así que desde el código no hay forma de saberlo.

Lo que sí pude confirmar consultando la configuración pública de tu proyecto: el ingreso por mail está activo y la confirmación por mail **no** está desactivada. O sea que **cada persona que entra con su mail dispara un envío**. Si ese envío sale por el servicio de demostración de Supabase, hoy sólo pueden entrar **dos personas por hora** y al resto no le llega nada — sin ningún error visible, simplemente el mail no aparece.

**Chequealo ya, son cinco minutos:** entrá al panel de Supabase → **Authentication** → **Emails** (o **SMTP Settings**). Si dice que estás usando el servicio integrado, activá el SMTP propio con los datos de Resend. Después entrá a **Authentication** → **Rate Limits** y fijate en cuánto quedó el límite por hora.

### El techo siguiente: 100 mails por día

El plan gratuito de Resend son **100 mails por día** y 3.000 por mes, con **un** dominio verificado. El que aprieta es el diario.

Qué consume mails hoy:

- Cada ingreso con el link al mail: **1**.
- Cada invitación a un partido: **1 por invitado**.
- El aviso de "tu partido se completó" al capitán: **1**.
- El aviso de "te aprobaron en el grupo": **1**.
- El aviso de "alguien se sumó" **no consume**, porque viene apagado de fábrica. Fue una buena decisión y conviene que siga así.

Haciendo la cuenta con partidos de 10:

- **Hasta unos 50 usuarios activos**: entre 20 y 40 mails por día. Tranquilo, ni lo vas a notar.
- **Cerca de 150 usuarios, o unos 15 partidos por día**: ahí empezás a arañar los 100.
- **Más de 200 usuarios**: lo chocás seguro, y el día que lo chocás **los envíos se cortan**. No te cobran de más ni te suben de plan solo: simplemente dejan de salir. Y lo primero que deja de funcionar es que la gente pueda entrar.

**Qué conviene hacer antes de llegar:**

1. **Empujar el ingreso con Google.** Entrar con Google **no gasta ningún mail**. Hoy el botón ya está primero en la pantalla de ingreso, que está bien. Cuantas más personas entren por ahí, más lejos queda el techo — y por eso el punto 1 de este documento (que esa pantalla inspire confianza) no es sólo estética: es lo que descomprime el techo de los mails.
2. **Verificar tu dominio en Resend** cuando compres `fulbitorandom.com.ar`. Hoy los mails salen desde `onboarding@resend.dev`, que es el dominio de pruebas: llega peor y se va a spam más fácil. Con dominio propio el remitente pasa a ser algo como `hola@fulbitorandom.com.ar`. Entra en el plan gratis (un dominio).
3. **Mirar el tablero de Resend una vez por semana**, para ver la curva antes de que sea un problema.

### El techo lejano: la base de datos

El plan gratuito de Supabase da 500 MB, hasta 50.000 usuarios activos por mes y un máximo de 2 proyectos. Para lo que guarda esta app —texto y números, sin fotos pesadas— **500 MB son muchísimos partidos**. Este techo no lo vas a tocar en años. Olvidate.

### La pausa por inactividad, y una trampa

Supabase **pausa los proyectos gratuitos después de una semana sin actividad**. Si eso pasa, la app deja de funcionar entera hasta que entrás al panel y la despertás a mano. Se puede recuperar hasta un año después.

Ya está resuelto: la GitHub Action de `.github/workflows/mantener-viva.yml` le hace una consulta cada 3 días. Está bien pensada y la clave que usa es la pública, así que no hay nada que cuidar ahí.

**Pero tiene una trampa que conviene que sepas:** GitHub **apaga solo** las tareas programadas de los repositorios que pasan unos 60 días sin movimiento. O sea que si dejás el proyecto quieto dos meses, GitHub apaga el despertador, y una semana después Supabase pausa la base. Justo cuando no estás mirando.

**Qué hacer:** si sabés que vas a estar dos meses sin tocar el proyecto, entrá una vez al mes a la pestaña **Actions** del repositorio en GitHub y tocá **"Run workflow"** a mano. Con eso el contador vuelve a cero. Es un minuto.

---

## 5. Otros hallazgos de la revisión

Cosas más chicas que encontré mirando `vercel.json`, `vite.config.ts`, `index.html` y la configuración de la PWA. Ninguna es urgente, pero la primera te está costando plata en gente que no entra.

### La vista previa de WhatsApp puede no mostrar la imagen

En `index.html`, línea 35, la imagen de la vista previa está puesta como `content="/icon-512.png"` — una dirección **relativa**. Casi todos los que arman esas vistas previas (WhatsApp incluido) necesitan la dirección **completa**, con `https://` y todo, como sí está puesta la de `og:url` dos líneas más abajo.

Esto importa más que de costumbre: según `decisiones.md`, todo el crecimiento de la app pasa por pegar el link del partido en WhatsApp. Si la vista previa sale sin imagen, el link se ve mucho más pobre y lo abre menos gente. **Arreglo: poner la dirección completa.** Dos minutos.

### No hay ninguna clave secreta expuesta. Está bien resuelto.

Lo revisé a propósito porque era una de tus preguntas, y la respuesta es tranquilizadora:

- En el código que viaja al navegador sólo está la clave **anon/pública** de Supabase, que está hecha para ser pública y no da acceso a nada que las políticas de seguridad no permitan. Que esté a la vista es normal y correcto.
- El `.env.local` está bien ignorado por git.
- La clave **service_role**, que sí es peligrosa, vive sólo dentro de la Edge Function, que corre en el servidor. Nunca llega al navegador. Correcto.
- La clave de Resend también vive sólo en el servidor. Correcto.

Lo único a tener presente: la seguridad de verdad la sostienen las políticas de la base, no el ocultamiento de esa clave. Eso ya está entendido en el proyecto y es la razón por la que las tablas de valoraciones no tienen política de lectura.

### El manifiesto de la PWA dice que la app está en inglés

El archivo que le describe la app al celular declara `"lang":"en"`. La app es en castellano rioplatense. Es un renglón, y afecta cómo la leen el sistema operativo y los buscadores. En `vite.config.ts`, dentro de `manifest`, agregar el idioma `es-AR`.

Falta también el campo `id`, que es lo que le permite al celular reconocer que una versión nueva es la misma app y no otra distinta. Conviene ponerlo antes de que la instale mucha gente.

### Los links profundos funcionan

Los probé contra producción: `/instalar` responde bien entrando directo, y el `manifest.webmanifest` también. El `vercel.json` está cumpliendo su función. El único problema es el que conté en el punto 2: que cumple **de más** y también se traga los archivos que faltan.

### La app no deja agrandar el texto con los dedos

En `index.html`, línea 10, el `maximum-scale=1` impide hacer pinza para agrandar. Para cualquiera que no vea bien de cerca —y en el fulbito amateur hay gente de todas las edades— eso es una traba real. Sacarlo no rompe nada.

---

## Resumen para arrancar mañana

En este orden:

1. **Cinco minutos:** chequear el SMTP en Supabase (punto 4). Si está en el servicio de demostración, la app hoy deja entrar a dos personas por hora.
2. **Dos minutos:** la dirección completa de la imagen de vista previa (punto 5).
3. **Una hora:** los tres arreglos del deploy y el link (puntos 2 y 3), que los aplica quien está tocando el código.
4. **Una o dos horas, más la espera de Google:** comprar el dominio, conectarlo a Vercel y mandar la marca a verificar (punto 1).
5. **No hacer:** pagar el plan Pro de Supabase. No hoy.
