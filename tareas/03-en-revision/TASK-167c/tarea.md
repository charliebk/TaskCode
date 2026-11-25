---
id: TASK-167c
titulo: "auditoria 4D invocable (parte c de TASK-167)"
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
tokens_implementacion: 7286799
tokens_revision: 3095993
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-167b]
---
## Objetivo

Parte c del troceo de TASK-167 (Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)), partes TASK-167a, TASK-167b, TASK-167c, TASK-167d en la rama feature/task-167-regla-4d-preventiva-en-los-proyectos-que.

Skill `auditoria-4d` (y su paso en task-workflow) que lanza agentes de
solo lectura por zona del proyecto, consolida los hallazgos por D y
severidad en `docs/auditoria-4d-<fecha>.md` con plan por olas, y, si la
persona lo pide, crea una tarea por ola con `taskctl new`.

## Criterios de aceptacion
- [x] Hay una auditoria 4D invocable para el proyecto que produce hallazgos clasificados por D y un plan de correccion por olas
- [x] Un test falla si la skill pierde el formato del informe o la creacion de tareas por ola

## Autorrevision

- code-quality-reviewer — d1adc94
- 4D — d1adc94: helper buscado (la Regla 4D, los patrones y la duracion se remiten a revision.md, duplicacion.md y duracion.md sin copiarlos; FLAGS_NEW de new.ts y assertSinMarcas de doctor-deploy.test.ts reutilizados en vez de otra lista de marcas), usos buscados (no habia formato de auditoria en src/ ni skills/; el formato vive solo en core/auditoria-4d.ts), criterios citados, 2 tests nuevos con 4 mutaciones en rojo (fila del resumen, flag inventado, commit antes de new, encabezado de ola)
- 4D ronda 1 — b5b8b88: usos buscados (PATRON_INFORME_AUDITORIA_4D solo lo usan la skill y su test; la parte d lo reutilizara), 5 tests mutados en rojo (sin --criterio, sin «Solo si dice que si», sin ceros, sin fila de ejemplo, patron sin -N)

## Resultado

- Skill instalable `skills/auditoria-4d/SKILL.md` (`/taskcode-plugin:auditoria-4d`): zonas por carpeta, un agente de solo lectura por zona con la Regla 4D y los patrones de duplicacion (remitidos, no copiados), consolidacion sin repetidos y con fichero:linea, informe `docs/auditoria-4d-<fecha>.md` (resumen por D y severidad, hallazgos, plan por olas de menos de una hora) y, solo si la persona dice que si y desde la rama base, el informe commiteado y una tarea por ola con `taskctl new` (flags reales, criterios por hallazgo, etiqueta `regla-4d`).
- `src/core/auditoria-4d.ts`: el formato como fuente unica (ruta y patron del nombre, secciones, cabeceras, D y severidades); lo leera `taskctl metricas` en TASK-167d.
- `task-workflow/SKILL.md` la nombra (dos frases recortadas para caber en el tope de 15 KB).
- Tests: `test/skills/auditoria-4d.test.ts` (formato y creacion de tareas, atados a las constantes y a `FLAGS_NEW`), enumeracion de skills y marcas del repo en `doctor-deploy.test.ts`, tope en `tamanos.test.ts`.
- Revision ronda 1 (sonnet): aprobada-con-correcciones, pasada a cambios-solicitados por el coordinador porque los arreglos de IMP-1 (segunda auditoria del dia sin reconocer) e IMP-2 (cuatro mutaciones vivas en la skill) tocaban codigo; MEN-1..3 tambien corregidos. Ronda 2 (haiku): aprobada. Sus notas pasan a TASK-167d, que es quien lee los informes: el patron acepta sufijos `-0` y `02`, y «las cifras del resumen son numeros contados» no tiene test.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T19:18:43Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T19:19:35Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T19:19:40Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T19:27:39Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T19:43:01Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T19:27:39Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 60 | 32481 | 7234910 | 19348 | 9 | 7286799 | - | - |
| 2026-11-25T19:42:15Z | revision | agente:af7e039176889ca5d | 22 | 118219 | 1054539 | 9843 | 3 | 1182623 | 1 | - |
| 2026-11-25T19:52:05Z | revision | agente:a5af07ab7d84e672e | 32 | 142791 | 1745828 | 24719 | 5 | 1913370 | 2 | - |

## Verificacion parcial

- 2026-11-25T19:52:23Z: todo el codigo que cambia la tarea (7 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
