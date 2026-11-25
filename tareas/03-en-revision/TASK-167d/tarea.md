---
id: TASK-167d
titulo: "tendencia de hallazgos 4D en las metricas (parte d de TASK-167)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 7468361
tokens_revision: 4495764
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-167c]
---
## Objetivo

Parte d del troceo de TASK-167 (Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)), partes TASK-167a, TASK-167b, TASK-167c, TASK-167d en la rama feature/task-167-regla-4d-preventiva-en-los-proyectos-que.

`taskctl metricas` lee los informes de auditoria (`docs/auditoria-4d-*.md`)
y muestra la serie por D entre auditorias, ademas de lo que ya da por tarea.

Troceo sin preguntar: autorizado por Carlos (2026-11-22 y 2026-11-25).

## Criterios de aceptacion
- [ ] taskctl metricas muestra la tendencia de hallazgos 4D por proyecto entre auditorias y por tarea
- [ ] Un test por pieza falla si deja de instalarse o de comprobar lo suyo

## Autorrevision

- code-quality-reviewer — b2e1490
- 4D — b2e1490: helper buscado (DES_4D y SEVERIDADES_4D de TASK-167c eran copia de DIMENSIONES_4D y SEVERIDADES_HALLAZGO de informe-revision.ts: borradas y reutilizadas; celdasDe de transiciones.ts exportada en vez de otro troceo de celdas; listarSiExiste de task-store.ts para la carpeta; helpers metricas-repos.ts para los repos), usos buscados (no habia lectura de docs/auditoria-4d-*.md en src/; la columna 4D por tarea de TASK-153c se mantiene), criterios citados, 3 tests nuevos (core, comando, frase de cifras contadas en la skill) con 5 mutaciones en rojo (Total sin comprobar, patron con -0/02, cambio, seccion, avisos)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T19:55:47Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T19:56:08Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T19:56:09Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T20:04:09Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T20:04:09Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 46 | 36254 | 7411094 | 20967 | 10 | 7468361 | - | - |
| 2026-11-25T20:54:14Z | revision | agente:ac3909edebc0d5e41 | 76 | 139150 | 4338848 | 17690 | 7 | 4495764 | 1 | - |

## Verificacion ligera

- 2026-11-25T20:54:28Z: ronda 1; commit revisado d2f38080af6cb842097e947926626e75222a2a40; commit verificado 9fb1ff1d64f44eafceacb01d4b5a405638610817; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts, taskcode-marketplace/plugins/taskcode-plugin/src/fs/auditorias-4d.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-auditorias.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/auditoria-4d.test.ts; corregidos: H1, H2, H3, H4, H5; pendientes: ninguno
