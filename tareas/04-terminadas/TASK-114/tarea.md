---
id: TASK-114
titulo: "P-6: hooks PreToolUse que salen pronto cuando no tienen nada que hacer"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-114-p-6-hooks-pretooluse-que-salen-pronto-cu
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 4260864
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

Los hooks PreToolUse del plugin arrancan node y su logica en cada llamada a una herramienta: el de lectura en cada Read/Edit/Grep/Glob aunque ningun proyecto declare held-out, y el de merges en cada comando de shell. Que salgan sin trabajo cuando no aplica. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-6)

## Criterios de aceptacion
- [x] El hook de lectura sale con 0 sin leer tareas/ ni la config de held-out cuando el proyecto no declara comando_heldout (test)
- [x] El hook de merges sale con 0 sin lanzar git cuando el comando no contiene git ni un script de cierre (test con PATH sin git)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

El guardian de held-out (hooks de lectura y de shell) deja pasar sin lanzar git si
la config del arbol de trabajo no declara `comando_heldout` (`declaraHeldout`, sin
procesos; una config ilegible sigue protegiendo). El de merges solo considera
candidato un comando con la palabra `git` o un script de cierre
(`INVOCA_GIT_O_CIERRE`), y el punto de entrada aplica antes un prefiltro sin
dependencias (`src/hooks/prefiltro.ts`) que evita cargar el guardian.

Revision por pares, ronda 1 (general-purpose + code-quality-reviewer, sonnet):
aprobada-con-correcciones, sin CRITICOS ni IMPORTANTES.

- MEN-1 (MENOR, corregido): ningun test discriminaba el prefiltro del punto de
  entrada. Se extrae a `prefiltro.ts` (funcion pura) con su test; mutante cazado.
- MEN-2 (MENOR, aceptado y documentado): la ofuscacion con comillas partidas
  (`g''it merge x`) esquiva la regla; el guardian es un freno contra despistes y la
  puerta de finish sigue.
- MEN-3 (MENOR, corregido en el texto): `finish` lee `comando_heldout` de la base y
  el guardian del arbol de trabajo; documentado como riesgo aceptado en el codigo y
  en skills/task-workflow/heldout.md.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T01:44:38Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T01:44:58Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T01:45:00Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T02:00:34Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T02:14:52Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T02:49:18Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T02:00:34Z | implementacion | sesion:1fb23e40-df0f-4598-9be1-751ce6506e3c | 30 | 20785 | 4227552 | 12497 | 0 | 4260864 | - | - |

## Verificacion omitida

- 2026-11-13T02:49:10Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 45 min
- Real (de la rama abierta al cierre con merge, sin pausas): 64 min
- Paso de la hora: 64 min reales frente a 45 estimados
- Cierre (finish): 8 s, de 2026-11-13T02:49:10Z a 2026-11-13T02:49:18Z
