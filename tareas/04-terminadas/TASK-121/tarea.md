---
id: TASK-121
titulo: "Troceo de tareas de mas de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama"
tipo: feature
sprint: 0
etiquetas: [flujo, agilidad, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-121-troceo-de-tareas-de-mas-de-60-min-como-p
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 10159644
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Por que importa (Carlos, 2026-11-12): trocear ha dado problemas en otros proyectos y ha complicado el repo. Evidencia en los repos: en TaskCode, TASK-096 se partio en 10 tareas con rama, diseno, revision y cierre propios (TASK-100 a TASK-109; unas 25 h y unos 230 M tokens); en ToolsaWeb hay 83 tareas que citan una particion, con tandas de numeros dispersos como TASK-307 a TASK-320 aun planificadas; en OpenDockTrading, 16. El plan debe partir de esos casos reales (ramas, carpetas, ROADMAP e IDs que quedaron) y no solo del enunciado.

Hoy la regla de una hora para el flujo cuando el plan estima mas de 60 min, y trocear crea tareas nuevas con su propia rama, diseno y cierre. Decision de Carlos (2026-11-12): trocear es condicional y solo una persona puede aceptarlo; si lo acepta, las partes se numeran con el mismo numero seguido de letras (TASK-NNNa, TASK-NNNb...), se trabajan sin salir de la rama de la tarea, se crean primero en 00-planificadas y se actualiza el ROADMAP antes de empezar TASK-NNNa, que es la tarea iniciada como principal. Como y cuando se integra en develop (al cerrar cada parte o al cerrar la ultima) lo decide el plan con la persona. Urgente para la version 0.16.0: lo mas rapido posible; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [x] Con un plan de mas de 60 min, taskctl siguiente devuelve accion preguntar con dos salidas, trocear o aprobar entera, y en ningun modo (tampoco automatico) se trocea sin la respuesta de una persona (test con repo temporal)
- [x] Si la persona acepta, la tarea pasa a TASK-NNNa y se crean TASK-NNNb, TASK-NNNc... en 00-planificadas con el objetivo y los criterios de cada parte del plan, y tareas/ROADMAP.md se regenera antes de empezar TASK-NNNa (test)
- [x] Las partes comparten la rama de la tarea: start de TASK-NNNa la abre y las partes siguientes trabajan en ella sin crear otra (test)
- [x] Los IDs con letra funcionan en todo el CLI (new, plan, approve, start, review, finish, siguiente, board, metricas, roadmap) y no chocan con la numeracion siguiente (test)
- [x] Si la persona rechaza el troceo, la tarea sigue entera con el motivo escrito en el plan, como hoy (test de regresion)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

Hecho en modo rapido (decision de Carlos, 2026-11-12): plan del coordinador, una
ronda de revision independiente con los tests afectados.

- `taskctl trocear TASK-NNN` (nuevo): lee la seccion `## Troceo` del plan, pasa la
  tarea a TASK-NNNa (sigue en diseno con su plan y su registro) y crea TASK-NNNb,
  c... en 00-planificadas con la misma rama y la parte anterior en `dependencias`;
  regenera el ROADMAP en el mismo commit. Si falla a medias, lo deshace.
- `taskctl siguiente`: con mas de 60 min devuelve `preguntar` en cualquier modo y
  `salidas` (trocear / aprobar-entera); una parte solo ofrece aprobar entera.
- IDs con letra (`TASK-\d{3,}[a-z]?`) en task, task-store, wip-scan, roadmap,
  roadmap-comparar, board (orden 121a < 121b < 122), metricas, heldout y
  task-id (`TASK-121a` cuenta 121 para la numeracion).
- `start` de una parte en una rama existente le trae antes la base (merge
  `--no-ff`); con conflicto lo deshace y no mueve la tarea.
- Integracion: cada parte se cierra con su `finish`; la siguiente sigue en la rama.
- Skills plan, approve y task-workflow/duracion.md, ayuda del CLI y README.

Decision de la persona: Carlos aprobo la tarea entera (150 min estimados) sin
trocearla: la herramienta de troceo es lo que construye y por partes no se podia
probar de punta a punta.

Revision ronda 1 (revisor independiente, sonnet + code-quality-reviewer):
aprobada, 0 CRITICO, 0 IMPORTANTE, 6 MENOR. Todos corregidos sin ronda 2 (modo
rapido: el coordinador verifico tests y mutantes):

- MEN-1 corregido: roadmap-comparar acepta y ordena IDs con letra (test de CLI
  `roadmap --comparar` con partes).
- MEN-2 corregido: cada parte debe traer su `Duracion estimada` legible; la de la
  parte a pasa al plan (documentado en duracion.md).
- MEN-3 corregido: el error de conflicto cita la linea CONFLICT; el mensaje de
  start dice "abierta" en vez de "creada".
- MEN-4 corregido: test del conflicto al traer la base a la rama compartida.
- MEN-5 corregido en parte: trocear deshace lo escrito si falla a medias (test con
  fallo inyectado). No corregido, aceptado: trocear no escribe fila en
  `## Transiciones`; "solo una persona" queda como garantia de proceso (siguiente
  nunca lo encadena, las skills lo prohiben y el plan anota "Troceo aceptado por
  una persona").
- MEN-6 corregido: se quita `idRaiz`, sin uso.

Mutantes (sobre dist, cada uno con su test): regex de roadmap-comparar, duracion
obligatoria, linea CONFLICT y deshacer del troceo: los 4 mueren.

Evidencia: `RAMA_BASE=develop node scripts/verificar-impacto.mjs` 838 pass, 0
fail; tests de troceo 14/14; start, siguiente, approve, board, roadmap, skills y
fs a mano: 380/382 (falla solo el symlink EPERM conocido de Windows, 1 skipped).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T17:48:41Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T17:49:55Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T17:49:57Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T18:10:56Z | review | automatico | persona | 0.14.0 |
| 2026-11-12T19:07:09Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T18:10:56Z | implementacion | sesion:6e909599-d65b-41cb-8fcb-9656c5dde2af | 102 | 84573 | 10033511 | 41458 | 4 | 10159644 | - | - |

## Verificacion omitida

- 2026-11-12T19:07:02Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 150 min
- Real (de la rama abierta al cierre con merge, sin pausas): 77 min
- Paso de la hora: 77 min reales frente a 150 estimados
- Cierre (finish): 7 s, de 2026-11-12T19:07:02Z a 2026-11-12T19:07:09Z
