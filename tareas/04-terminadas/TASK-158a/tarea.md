---
id: TASK-158a
titulo: "los textos de cada camino exigen 4D y buscar todos los usos (parte a de TASK-158)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
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
tokens_revision: 3883827
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

- [x] Hay un inventario en la tarea de cada camino que crea o actualiza codigo, con que exige hoy de 4D y que le falta
- [x] La skill o el agente de cada camino del inventario exige 4D al escribir, incluido buscar todos los usos antes de dar una duplicacion por resuelta
- [x] Un test por camino (skills y agentes) falla si ese camino deja de exigir 4D

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
- 4D menores — 5e1a96d: usos buscados (unica mencion de la linea de menores en review; revision.md define el formato), 0 tests nuevos (el de review sigue cubriendo el orden: mutado en la ronda 2)

## Resultado

- Inventario 4D de cada camino que crea o actualiza codigo en la propia tarea (seccion de arriba): roles del brainstorm, unificador, plan/approve, implementacion tras start (feature, fix, hotfix), correcciones de ronda, MENORES tras aprobar, hotfix y release, doctor-deploy y revisoras; lo de taskctl queda para 158b y la carrera de verificar-impacto para 158c.
- Cada camino exige 4D al escribir: apartado `Regla 4D desde tu rol` en los cinco roles (y `Regla 4D` en el unificador); revision.md define «Todos los usos, no solo los citados» y el formato de `- 4D ronda K — ` y `- 4D menores — `; start pide buscar todos los usos y anotar «usos buscados»; review nombra la linea de las correcciones en la autorrevision de cada ronda y la de los MENORES antes de verificar-menores; finish (hotfix por start) y doctor-deploy (arreglo por plan y start) remiten al ciclo.
- Un test por camino en test/skills/regla-4d.test.ts (5 tests), todos mutados en rojo (ronda 1: 7 mutaciones; ronda 2: el revisor muto cada uno). Topes de tamano sin subir: el margen sale de quitar duplicaciones (verificar-menores descrito en revision.md y en review; una frase repetida en review).
- test:rapido 701/701; verificacion por impacto de review: 2063 pasan, 0 fallan.
- Revision ronda 1 (sonnet): cambios-solicitados. IMP-1 (frase sin verbo por el recorte) e IMP-2 (review no nombraba las lineas) corregidos; MEN-1 y MEN-2 (tests que prometian mas de lo que comprobaban) corregidos; MEN-3 (margen de 1 B) corregido liberando espacio en vez de subir el tope; MEN-4 (cuenta de tests) corregido.
- Revision ronda 2 (haiku, acotada): aprobada con correcciones. MEN-NUEVO-1 (anotar el commit antes de hacerlo) corregido y cerrado con verificar-menores.
- Incidencias: el revisor de la ronda 1 clono dentro del repo (TaskCode/TaskCode, en el commit revisado, limpio y sin commits propios); se borro. El de la ronda 2 escribio la cabecera `Fichero:linea` y verificar-menores no leia el fichero del MENOR: se corrigio la cabecera del informe a la de la plantilla (`Fichero`). Propuesta: que el parser acepte `Fichero:linea` (tarea aparte).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T02:09:52Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T02:11:48Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T02:11:53Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T02:26:14Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T03:14:55Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T04:20:37Z | finish | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T02:26:14Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 72 | 46002 | 6400358 | 24388 | 6 | 6470820 | - | - |
| 2026-11-25T03:14:10Z | revision | agente:a388c6e006d480bc2 | 28 | 132070 | 1458948 | 14810 | 4 | 1605856 | 1 | - |
| 2026-11-25T03:50:06Z | revision | agente:a8adc7fc4355d7189 | 38 | 139333 | 2117702 | 20898 | 2 | 2277971 | 2 | - |

## Verificacion ligera

- 2026-11-25T03:50:48Z: ronda 2; commit revisado 00aef24b25b81d40623b3fbab134026a538e7c79; commit verificado 5e1a96dd8c0760c7e2827c30d16a312ed7b8a8de; ficheros: taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md; corregidos: MEN-NUEVO-1; pendientes: ninguno

## Duracion

- Estimada: 55 min
- Real (de la rama abierta al cierre con merge, sin pausas): 129 min
- Paso de la hora: 129 min reales frente a 55 estimados
- Cierre (finish): 1742 s, de 2026-11-25T03:51:35Z a 2026-11-25T04:20:37Z
