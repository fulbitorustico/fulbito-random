# Fulbito Random

App para organizar partidos de fútbol amateur en Argentina. Armás el partido, pasás el link por WhatsApp, cada uno se anota solo, y después del partido cada jugador valora a sus compañeros de forma anónima.

**En producción:** https://fulbito-random.vercel.app

---

## Qué es esto, en una frase

De la investigación competitiva que está en `docs/`:

> El sistema que aprende quién juega con quién y usa ese conocimiento para hacer partidos cada vez más parejos.

El circuito es: **partido → cada uno valora a sus compañeros → se construye un promedio → los equipos salen más parejos → se juega otro partido.** Todo lo demás está al servicio de eso.

---

## Cómo correrlo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # compila de verdad (tsc -b + vite build)
npm test         # 39 pruebas sobre las reglas del negocio
npm run lint
```

**Ojo con una trampa:** `npx tsc --noEmit` **no chequea nada** en este proyecto, porque el `tsconfig.json` usa referencias. El chequeo real de tipos es `npm run build`, que corre `tsc -b`. Si un cambio "compila" con `--noEmit`, no significa nada.

Hace falta un `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

---

## El stack

- **React 19 + Vite + Tailwind 4 + React Router**, sin backend propio.
- **Supabase** (Postgres + Auth + Storage + Edge Functions) es la base y la lógica.
- **Vercel** para el hosting. `vercel.json` tiene el rewrite catch-all: sin eso, los links profundos dan 404 al entrar directo.
- **PWA** con vite-plugin-pwa. Se instala en el celular, no hay que bajar nada de ninguna tienda.

Cuatro dependencias en total. La imagen para las historias se dibuja a mano en canvas, el archivo de calendario se arma concatenando texto y los gráficos del panel son divs. Cada librería que no está es una que no se rompe.

---

## Dónde está cada cosa

| Ruta | Qué hay |
|---|---|
| `src/pages/` | Una pantalla por archivo |
| `src/components/` | Piezas reutilizables |
| `src/lib/` | Reglas del negocio, sin React |
| `src/lib/permisos.ts` | **Quién puede hacer qué.** Única fuente de verdad de la pantalla |
| `src/lib/reglas.test.ts` | Las pruebas |
| `supabase/migrations/` | **Todo lo que toca la base.** Tiene su propio README |
| `docs/` | El plan vivo, las decisiones y la investigación competitiva |

---

## Las dos reglas que no hay que romper

**1. La base autoriza, la pantalla decide qué mostrar.** Cada función de `src/lib/permisos.ts` nombra al lado la política de Postgres que le corresponde. Si cambia una, se revisa la otra. Esto no es teoría: el botón "Generar equipos" se le mostraba al subcapitán y la base lo rechazaba en silencio, sin error y sin explicación.

**2. Ningún cambio en la base existe hasta que está en `supabase/migrations/`.** Ni una política, ni una columna, ni una función. Lo que se corrió en el editor de Supabase y no quedó en un archivo, se pierde.

---

## Qué se guarda y qué se calcula

**Casi nada se guarda; casi todo se calcula.** Los objetivos, los niveles, el estado del partido, las rachas: ninguno tiene columna propia, salen de los datos de origen cada vez. No hay nada que sincronizar ni que se desfase.

El criterio para cuando aparezca la duda: **se guarda lo que es una decisión o un hecho; se calcula lo que es una consecuencia.** El orden de una lista de espera es un hecho —esa persona entró en ese momento, y no se recalcula—; tu nivel es una consecuencia de tus partidos.

La única excepción prevista es por costo, no por diseño: cruzar la afinidad entre jugadores es una cuenta entre pares —190 combinaciones con 20 jugadores, 20.000 con 200— y eso va a necesitar tabla propia.

---

## Documentación

- **`docs/plan.md`** — el plan vivo. Qué se hizo, qué falta, y **por qué** cada decisión. Empezar por acá.
- **`docs/decisiones.md`** — las decisiones de diseño que no se deducen del código, y las trampas que ya nos mordieron.
- **`docs/investigacion-competitiva.pdf`** — el análisis de Fubles, FairSides, JO+GO, Chega+ y Plei, y dónde está el diferencial.
- **`docs/handoff-original.md`** — el documento con el que arrancó el proyecto.
- **`supabase/migrations/README.md`** — cómo se agrega un cambio a la base, y las tres trampas del editor de Supabase.
