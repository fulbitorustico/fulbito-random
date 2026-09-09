# FULBITO RANDOM (FR) · Handoff completo para Claude Code
**Fecha: 7 de septiembre de 2026 · Estado: migración de Glide a PWA propia, recién iniciada**

---

## 1. Qué es el proyecto

Fulbito Random es una **PWA social para organizar partidos de fútbol amateur en Argentina**, donde los jugadores se valoran entre sí después de cada partido (estrellas 1-5 + comentario).

**Visión de producto:** marketplace de dos lados.
- **Lado jugador** (motor de uso): organización de partidos + reputación portable del jugador.
- **Lado dueños de cancha / proveedores** (motor de ingresos, futuro): llenar horas muertas, reservas con seña (Mercado Pago), comisión por reserva.

**Diferencial clave e innegociable:** el sistema de reputación portable del jugador, con mecánicas anti-sesgo (ver sección 6).

## 2. Quién es el usuario (dueño del proyecto)

- No sabe programar. Cero. Tratarlo como principiante total.
- **Método de trabajo estricto: UNA instrucción por vez. No avanzar al siguiente paso hasta que confirme que terminó el anterior.**
- Claude actúa como el programador: genera todo el código; el usuario copia, pega y confirma.
- Priorizar SIEMPRE lo gratuito y lo más simple.
- Presupuesto: $0. El stack completo debe ser free tier sin vencimiento.
- Trabaja mayormente desde el celular (iPhone, navegador Brave).

## 3. Decisión estratégica ya tomada (no reabrir)

- **Glide fue abandonado definitivamente.** Motivo: el plan gratuito de Glide ya no permite publicar apps (solo probar en el editor) y no existe exportación de código — riesgo de lock-in total.
- **Stack definitivo elegido (todo $0):**
  - **Supabase** → base de datos Postgres + login por email con magic link (sin contraseña)
  - **GitHub** → repositorio del código
  - **Vercel** → hosting y deploy automático desde GitHub
  - **PWA** → instalable en pantalla de inicio, preparada para push notifications a futuro

## 4. Estado actual EXACTO (qué está hecho y qué no)

**Hecho:**
- Cuenta de Supabase creada con el email **infofulbitorustico@gmail.com** (organización visible: "FRustico").
- El usuario llegó hasta la pantalla de "Create new project" en Supabase, con nombre tentativo "FR PWA".

**NO hecho todavía (primer pendiente inmediato):**
- El proyecto de Supabase **NO fue creado**. Quedaron pendientes estos 6 pasos:
  1. Ignorar "Connect GitHub" por ahora
  2. Project name: "FR PWA" (o "fulbito-random")
  3. Database password: usar "Generate a password" y guardarla en Notas del celular
  4. Region: **South America (São Paulo)** — la más cercana a Argentina
  5. Security: dejar los 3 checkboxes tildados como vienen
  6. Postgres Type: dejar "Postgres" default (no OrioleDB) → luego "Create new project"
- No hay cuenta de GitHub confirmada aún (verificar antes de asumir).
- No hay cuenta de Vercel.
- No hay repositorio ni una sola línea de código escrita.
- No hay tablas creadas en Supabase.

**➡️ El primer paso con Claude Code es retomar exactamente acá: completar la creación del proyecto en Supabase.**

## 5. Modelo de datos (heredado del MVP de Glide, a recrear en Supabase)

4 tablas:
1. **Jugadores** — perfil: nombre, apodo, posición, foto. (En Glide había 10 jugadores de ejemplo cargados.)
2. **Partidos** — fecha, hora, lugar, cupo, admin del partido.
3. **Participantes** — quiénes jugaron cada partido (relación partido ↔ jugador).
4. **Valoraciones** — estrellas (1-5) + comentario, vinculada a partido, evaluador y evaluado.

Notas técnicas heredadas del handoff anterior:
- Usar IDs generados por la base (UUID/Row ID), nunca IDs manuales.
- El login por email debe vincularse con el registro del jugador vía email.
- Decisión de diseño tomada: las valoraciones son **anónimas a nivel individual; solo se muestra el promedio** (para evitar conflictos sociales en el grupo).

## 6. Alcance del MVP v1 (lo que hay que construir primero)

Un usuario debe poder:
1. Entrar a la app con su email (magic link, sin contraseña)
2. Crear y editar su perfil de jugador (nombre, apodo, posición, foto)
3. Ver la lista de jugadores (con buscador)
4. [Admin] Crear un partido y cargar los participantes
5. Valorar a sus compañeros de ese partido con estrellas 1-5 + comentario
6. Ver el detalle de cada jugador con sus valoraciones recibidas (promedio)

**Objetivo de negocio del MVP:** validar con un grupo real de fulbito que valorar a los compañeros resulta útil y entretenido, y empezar a acumular datos reales.

## 7. Versión 2 — ideas que NO se pierden (post-validación)

**Sistema de valoración anti-sesgo:**
- Presupuesto de estrellas proporcional a la cantidad de jugadores (distribución forzada: no todos pueden recibir 5; debe alcanzar para que al menos 3 reciban valoración alta)
- Puntaje de confiabilidad del evaluador (quien valora honesto gana peso; quien pone 5 a todos, lo pierde)
- Badges para valoradores honestos y detallistas
- Tutorial/video antes de valorar
- Opción de saltar la valoración solo como último recurso

**Organización de partidos:**
- Penalización por bajarse dentro de las 2 horas previas (baja de promedio o badge negativo)
- Modelo 1: convocatoria abierta con filtro por rango de estrellas
- Modelo 2: invitación manual del admin según reputación
- Partidos recurrentes ("todos los jueves 21hs") con autoconvocatoria
- Equipos balanceados automáticos según ratings

**Plataforma:**
- Mapa de canchas: buscar partidos cercanos y unirse
- Notificaciones push (nuevos partidos, alguien se une/baja, partido cercano)
- Mensajería interna / chat por partido
- Calendario de partidos
- Promedios visibles y estadísticas históricas
- Gamificación por temporadas: rankings por barrio/grupo, rachas, MVP del mes
- Bases y condiciones

**Lado proveedor (dueños de canchas — monetización futura):**
- Panel gratuito de cancha: horarios y ocupación
- "Última hora con descuento" para llenar horas muertas
- Demanda visible por zona/horario
- Reserva y seña vía Mercado Pago (reduce no-shows)
- Reputación de canchas (césped, vestuarios, iluminación)
- Ingresos: comisión por reserva, destacados en el mapa, suscripción "Club" para grupos. Nunca cobrar al jugador por lo básico.

**Secuencia estratégica:** MVP jugadores → validar loop de valoración con un grupo → expandir a 5-10 grupos → sumar canchas de UNA zona piloto (densidad antes que cobertura) → monetizar.

## 8. Roadmap por etapas (plan vigente)

| Etapa | Foco | Estado |
| --- | --- | --- |
| 0 | Cuentas (GitHub, Supabase, Vercel) | En curso — Supabase a medio crear |
| 1 | Base de datos en Supabase (4 tablas + magic link) | Pendiente |
| 2 | App online (login + inicio, deploy en Vercel) | Pendiente |
| 3 | MVP completo pantalla por pantalla | Pendiente |
| 4 | Modo PWA (instalable) | Pendiente |
| 5 | Prueba con fulbito real + feedback | Pendiente |

## 9. Archivos y recursos del proyecto

- **Fulbito_Random_Handoff.docx** — handoff original de la era Glide (auditoría, features, roadmap). Valor histórico: el modelo de datos y las ideas V2 ya están volcados en este documento.
- **Este archivo (FR_Handoff_para_Claude_Code.md)** — la fuente de verdad actual.
- **MindMeister** — mapa mental original del roadmap: mm.tt/map/3435546293
- **Email del proyecto:** infofulbitorustico@gmail.com (Supabase; usar también para GitHub y Vercel para mantener todo unificado).

## 10. Instrucción de arranque para Claude Code

> Retomamos Fulbito Random. Leé este handoff completo. El primer paso es terminar de crear el proyecto en Supabase (sección 4, los 6 pasos pendientes). Recordá el método: una instrucción por vez, esperar mi confirmación, tratarme como principiante total, todo gratis. Después seguimos con las tablas (sección 5) y el MVP (sección 6).
