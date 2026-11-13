---
id: TASK-116
titulo: "P-8: TaskCode declara su verificacion y doctor avisa cuando falta"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-116-p-8-taskcode-declara-su-verificacion-y-d
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 4798452
tokens_revision: 1103525
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

TaskCode no declara comando_verificacion, asi que los frenos que construye (Stop, puerta de finish, guardian) no actuan en su propio repo, y doctor solo lo marca omitida. Para no frenar cada tarea con la suite de 25 min, la verificacion declarada es la rapida. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-8)

## Criterios de aceptacion
- [ ] taskctl doctor da ok en la comprobacion de verificacion de TaskCode (comprobado ejecutando doctor). Desde TASK-122, .taskcode/config.yml ya declara comando_verificacion (la suite completa, para finish) y comando_verificacion_selectiva (scripts/verificar-impacto.mjs); no hace falta declarar test:rapido
- [ ] doctor da aviso, no omitida, cuando el proyecto tiene tests detectables y no declara comando_verificacion, y dice cuantas tareas se cerraron asi (test)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T23:20:11Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T23:20:46Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T23:20:48Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T23:51:32Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T00:06:08Z | finish | automatico | persona | 0.14.0 |

## Autorrevision

- code-quality-reviewer — 3f93372

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T23:51:32Z | implementacion | sesion:4684d134-7fd6-4fe8-be8f-9513ee90ff16 | 64 | 35204 | 4750212 | 12972 | 4 | 4798452 | - | - |
| 2026-11-13T00:02:15Z | revision | agente:a7c06d0cd4c76de18 | 22 | 106288 | 991513 | 5702 | 6 | 1103525 | 1 | - |

## Verificacion parcial

- 2026-11-13T00:02:32Z: todo el codigo que cambia la tarea (3 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 30 min
- Real (de la rama abierta al cierre con merge, sin pausas): 45 min
- Cierre (finish): 216 s, de 2026-11-13T00:02:32Z a 2026-11-13T00:06:08Z
