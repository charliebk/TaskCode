---
id: TASK-158a
titulo: "los textos de cada camino exigen 4D y buscar todos los usos (parte a de TASK-158)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 6470820
tokens_revision: 1605856
creado: 2026-11-24
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-158 (Regla 4D preventiva en todos los procesos que crean o actualizan codigo), partes TASK-158a, TASK-158b, TASK-158c en la rama feature/task-158-regla-4d-preventiva-en-todos-los-proceso.

revision.md (Regla 4D: todos los usos antes de dar una duplicacion por
resuelta; correcciones y MENORES pasan la misma autorrevision), start,
review (paso 4: autorrevision por ronda y antes de verificar-menores), los
cinco roles del brainstorm y el unificador, y el inventario en la tarea.

Objetivo de la tarea entera:

> Que la Regla 4D (sin duplicacion, desviacion, diluvio ni disfraz) se aplique al escribir codigo y no solo al auditarlo: cada camino del plugin que crea o modifica codigo (plan, implementacion tras start, correcciones de cada ronda, verificar-menores, hotfix y release, agentes del brainstorm, doctor-deploy y skills revisoras) la exige y la comprueba. Decision de Carlos: requisito para publicar la 0.19.0.

## Criterios de aceptacion

- [ ] Hay un inventario en la tarea de cada camino que crea o actualiza codigo, con que exige hoy de 4D y que le falta
- [ ] La skill o el agente de cada camino del inventario exige 4D al escribir, incluido buscar todos los usos antes de dar una duplicacion por resuelta
- [ ] Un test por camino (skills y agentes) falla si ese camino deja de exigir 4D

## Inventario 4D de los caminos que crean o actualizan codigo

| Camino | Que exigia de 4D (antes de TASK-158) | Que le faltaba | Donde se cierra |
|---|---|---|---|
| Roles del brainstorm: arquitectura, dominio, rendimiento, riesgos, testing | Solo arquitectura: reutilizar el punto de extension | Apartado 4D de cada rol y buscar todos los usos | 158a: `- **Regla 4D desde tu rol**` en `## Qué miras` de cada uno |
| Unificador | `## Reutilizacion (Regla 4D)` en la salida | Que lo reutilizado salga de buscar todos los usos | 158a: `- **Regla 4D**` en `## Qué miras` |
| `taskctl plan` / `approve` | Plantilla con la reutilizacion; `approve` avisa si va vacia (TASK-153) | Nada | — |
| Implementacion tras `start` (feature, fix y hotfix) | Autorrevision 4D: helper, criterio, mutacion; `review` avisa sin la linea | Buscar todos los usos al unificar | 158a: start/SKILL.md y la linea `usos buscados` |
| Correcciones de cada ronda (review, paso 4) | Nada: autorrevision una vez por tarea | Autorrevision por ronda (`- 4D ronda K — `) y su aviso | 158a: texto de review y revision.md; 158b: aviso de `review` |
| MENORES tras aprobar (`verificar-menores`) | Nada | Autorrevision (`- 4D menores — `) y su aviso | 158a: texto; 158b: aviso de `verificar-menores` |
| Hotfix y release (`finish`) | Hotfix hereda de start; release no escribe codigo | Dejarlo escrito | 158a: finish/SKILL.md |
| `doctor-deploy` y `revisor-seguridad-deploy` | No escriben codigo: crean tareas | Que el arreglo no se haga por fuera del ciclo | 158a: doctor-deploy/SKILL.md (plan y start, todos los usos del patron) |
| Skills revisoras (4 de dominio + generica) | Ejemplo por D y remision a revision.md | Todos los usos antes de dar una duplicacion por resuelta | 158a: revision.md, que todas citan |
| `scripts/verificar-impacto.mjs` | — | Carrera: devuelve dist/src aunque HEAD cambie | 158c |

## Autorrevision

- code-quality-reviewer — b3b9b4d
- 4D — b3b9b4d: helper buscado (seccion/faltanD de regla-4d.test.ts reutilizados), usos buscados (grep de Regla 4D y duplicacion en skills/ y agents/), criterios citados, 5 tests nuevos con 7 mutaciones (todas en rojo)
- code-quality-reviewer — cb84d8b
- 4D ronda 1 — cb84d8b: usos buscados (las lineas 4D se definen solo en revision.md; review remite), 3 tests reescritos con 5 mutaciones en rojo

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T02:09:52Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T02:11:48Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T02:11:53Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T02:26:14Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T03:14:55Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T02:26:14Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 72 | 46002 | 6400358 | 24388 | 6 | 6470820 | - | - |
| 2026-11-25T03:14:10Z | revision | agente:a388c6e006d480bc2 | 28 | 132070 | 1458948 | 14810 | 4 | 1605856 | 1 | - |
