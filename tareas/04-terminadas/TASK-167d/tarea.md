---
id: TASK-167d
titulo: "tendencia de hallazgos 4D en las metricas (parte d de TASK-167)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
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
- [x] taskctl metricas muestra la tendencia de hallazgos 4D por proyecto entre auditorias y por tarea
- [x] Un test por pieza falla si deja de instalarse o de comprobar lo suyo

## Autorrevision

- code-quality-reviewer — b2e1490
- 4D — b2e1490: helper buscado (DES_4D y SEVERIDADES_4D de TASK-167c eran copia de DIMENSIONES_4D y SEVERIDADES_HALLAZGO de informe-revision.ts: borradas y reutilizadas; celdasDe de transiciones.ts exportada en vez de otro troceo de celdas; listarSiExiste de task-store.ts para la carpeta; helpers metricas-repos.ts para los repos), usos buscados (no habia lectura de docs/auditoria-4d-*.md en src/; la columna 4D por tarea de TASK-153c se mantiene), criterios citados, 3 tests nuevos (core, comando, frase de cifras contadas en la skill) con 5 mutaciones en rojo (Total sin comprobar, patron con -0/02, cambio, seccion, avisos)
- 4D menores — 9fb1ff1: usos buscados (la lectura del resumen solo la llama fs/auditorias-4d.ts; el salto de bloques de codigo es el mismo criterio que leerHallazgos de informe-revision.ts, inline por ser una linea; la salida sin tareas reutiliza seccionAuditorias), 4 tests mutados en rojo (serie sin tareas, carpeta con nombre de informe, separador, ejemplo en bloque); H5 quita codigo muerto, sin test que mutar

## Resultado

- `taskctl metricas` muestra, debajo de la tabla por tarea (con su columna 4d de TASK-153c), la seccion «Auditorias 4D»: una fila por informe `docs/auditoria-4d-<fecha>[-N].md` con sus cifras por D (CRITICO/IMPORTANTE/MENOR), el total y el cambio con el anterior; por proyecto con varios `--repo`, tambien sin tareas, y en `--json` como `auditorias4D`. Sin informes, la salida no cambia.
- `src/core/auditoria-4d.ts` lee y valida la tabla de `## Resumen` (cabecera, separador, las cuatro D, cifras enteras, Total = suma; un ejemplo en un bloque de codigo no cuenta); un informe que no se puede leer es un aviso con su motivo (`src/fs/auditorias-4d.ts`). El patron del nombre ya solo acepta `-2`, `-3`...
- Duplicacion de TASK-167c corregida: las D y las severidades son las de `informe-revision.ts`; `celdasDe` (transiciones.ts) y `listarSiExiste` reutilizados.
- Tests: `test/core/auditoria-4d.test.ts`, `test/commands/metricas-auditorias.test.ts` (repos reales) y la frase de cifras contadas en `test/skills/auditoria-4d.test.ts`.
- Revision ronda 1 (sonnet): aprobada con 5 MENORES (serie sin tareas solo en JSON, una carpeta con nombre de informe tumbaba metricas, separador sin validar, ejemplo en bloque de codigo, `replace` redundante): todos corregidos en 9fb1ff1 y verificados con verificar-menores. --evolucion, --grupos y --heuristica no muestran la serie a proposito: miden tareas.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T19:55:47Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T19:56:08Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T19:56:09Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T20:04:09Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T21:27:53Z | finish | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T20:04:09Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 46 | 36254 | 7411094 | 20967 | 10 | 7468361 | - | - |
| 2026-11-25T20:54:14Z | revision | agente:ac3909edebc0d5e41 | 76 | 139150 | 4338848 | 17690 | 7 | 4495764 | 1 | - |

## Verificacion ligera

- 2026-11-25T20:54:28Z: ronda 1; commit revisado d2f38080af6cb842097e947926626e75222a2a40; commit verificado 9fb1ff1d64f44eafceacb01d4b5a405638610817; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts, taskcode-marketplace/plugins/taskcode-plugin/src/fs/auditorias-4d.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-auditorias.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/auditoria-4d.test.ts; corregidos: H1, H2, H3, H4, H5; pendientes: ninguno

## Verificacion parcial

- 2026-11-25T20:54:57Z: todo el codigo que cambia la tarea (12 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 50 min
- Real (de la rama abierta al cierre con merge, sin pausas): 92 min
- Paso de la hora: 92 min reales frente a 50 estimados
- Cierre (finish): 1976 s, de 2026-11-25T20:54:57Z a 2026-11-25T21:27:53Z
