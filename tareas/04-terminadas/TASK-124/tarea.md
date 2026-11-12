---
id: TASK-124
titulo: "Contexto con tamano maximo: lo que leen los agentes no crece con el proyecto"
tipo: feature
sprint: 0
etiquetas: [agilidad, escala, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-124-contexto-con-tamano-maximo-lo-que-leen-l
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 19032337
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Sale de TASK-122 (docs/auditoria/ESCALA-2026-11-12.md): lo que leen los agentes en cada tarea crece con el proyecto. Desde la v0.1.1 el README del plugin paso de 22 a 102 KB, las skills de 92 a 189 KB y docs/contexto de 154 a 195 KB; CHECKLIST_TERMINACION.md pesa 83 KB y ESTADO.md llevaba 38 dias sin actualizarse cuando CLAUDE.md manda leerlo primero. Cada documento que se carga en cada tarea tiene que tener un tamano maximo, y lo cerrado se archiva fuera de lo que se lee. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12), en modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [x] CLAUDE.md, las skills de flujo y las revisoras tienen un tamano maximo en bytes con un test que falla si se supera
- [x] CHECKLIST_TERMINACION.md y ESTADO.md archivan lo cerrado en docs/contexto/archivo/ y lo vivo queda por debajo de 20 KB y 10 KB (comprobado con wc -c)
- [x] taskctl doctor avisa si ESTADO.md lleva mas de 14 dias sin actualizarse o va por detras de las tareas cerradas (test)
- [x] El README del plugin pasa la referencia detallada a ficheros aparte y queda por debajo de 40 KB, sin perder contenido (test que comprueba el tamano y los enlaces)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

Hecha entera (Carlos decidio no trocear; plan de 150 min), con tres agentes en paralelo en la misma rama.

- Topes: `test/skills/tamanos.test.ts` fija un tope en bytes (actual + ~15 %) para CLAUDE.md, cada .md de skills/ y agents/, el total (280 KB), CHECKLIST (20 KB) y ESTADO (10 KB); un .md sin tope o una entrada sin fichero tambien falla.
- README del plugin: 108 778 -> 17 006 B. Lo detallado, movido tal cual a `docs/` del plugin (configuracion, cierre-y-release, comandos, instalacion-y-distribucion, problemas-conocidos). `test/empaquetado/readme.test.ts`: tamano, enlaces y anclas, y los 38 encabezados del README original exactamente una vez.
- docs/contexto: CHECKLIST 86 476 -> 12 745 B y ESTADO 32 783 -> 6 528 B (wc -c); lo cerrado en `docs/contexto/archivo/`, ESTADO reescrito al dia. El progreso global estaba mal (116/117; real 120/121) y se corrigio.
- doctor: clave opcional `documento_estado` y comprobacion `documento-estado` (fecha del ultimo commit, 15 dias o mas o tareas terminadas despues -> aviso; carpeta -> aviso). En este repo: ok.

Revision ronda 1 (code-quality-reviewer, independiente): aprobada-con-correcciones, 0 CRITICOS, 0 IMPORTANTES, 4 MENORES, todos corregidos:
- MEN-1: una carpeta en documento_estado daba un aviso confuso -> aviso «no es un fichero» + test.
- MEN-2: ningun test distinguia fecha de committer y de autor -> test con fechas distintas.
- MEN-3: mensajes que remitian al README -> citan el fichero de docs/ del plugin.
- MEN-4: TASK-124 sin casilla en el checklist -> anadida al cerrar.
Modo rapido: Carlos acepto cerrar sin ronda 2 tras corregir los MENORES; el coordinador verifico tests (139/139 afectados) y mutantes (`%cI`->`%aI` y quitar la comprobacion de carpeta: cada uno hace caer su test nuevo).

Evidencia: `RAMA_BASE=develop node scripts/verificar-impacto.mjs` 939 pass, 0 fail (antes de las correcciones); tras ellas, tests afectados 139/139. Suite completa no ejecutada (modo rapido; una vez antes de publicar la 0.16.0).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T19:11:36Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T19:22:04Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T19:22:05Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T19:45:52Z | review | automatico | persona | 0.14.0 |
| 2026-11-12T20:07:55Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T19:45:52Z | implementacion | sesion:0ba098a5-8f54-4573-8cde-7b3c9a838b85 | 36 | 33224 | 2304653 | 11036 | 0 | 2348949 | - | - |
| 2026-11-12T19:45:52Z | implementacion | agente:a5c8d7729428a0908 | 116 | 193734 | 8545581 | 43321 | 7 | 8782752 | - | - |
| 2026-11-12T19:45:52Z | implementacion | agente:a8cace2c802ca727c | 54 | 129728 | 2846603 | 14944 | 9 | 2991329 | - | - |
| 2026-11-12T19:45:52Z | implementacion | agente:a8e1d3a271f088ca1 | 80 | 148553 | 4729700 | 30974 | 3 | 4909307 | - | - |

## Verificacion omitida

- 2026-11-12T20:07:47Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 150 min
- Real (de la rama abierta al cierre con merge, sin pausas): 46 min
- Cierre (finish): 8 s, de 2026-11-12T20:07:47Z a 2026-11-12T20:07:55Z
