---
id: TASK-102
titulo: "Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-102-verificacion-proporcional-a3-el-freno-st
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 973799
tokens_implementacion: 10714434
tokens_revision: 19836784
creado: 2026-11-10
actualizado: 2026-11-11
dependencias: [TASK-100]
---
## Objetivo

Troceada en el plan por la regla de una hora (85 min estimados; decision de Carlos, 2026-11-11): esta tarea hace A3a (clasificacion del arbol de trabajo, la decision comun peticionDeTrabajo y el freno Stop); review, el test de que Stop y review deciden igual y la documentacion son TASK-104. Sin A3b, review sigue como en la 0.14.0. El enunciado original sigue debajo.

Tercera parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). El freno Stop (cada fin de turno) y taskctl review usan la decision unica de TASK-100 sobre el mismo diff: si solo cambia documentacion no corren la suite de tests, solo la comprobacion de documentacion si se declara. Clasifican tambien el arbol de trabajo (lo no commiteado y lo no trackeado): un .ts sin commitear hace que el turno no sea de solo documentacion. Solo documentacion se decide antes que la verificacion selectiva de TASK-091 y de forma identica en Stop y review. Sin la clave, ni se calcula el diff (cero coste en cada turno). Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A3).

## Criterios de aceptacion
- [x] Un turno de solo documentacion no corre la suite de tests; con comando de documentacion declarado, el freno Stop corre ese (test por cada uno, repo temporal)
- [x] Un fichero de codigo sin commitear o sin seguimiento hace que el freno Stop aplique la verificacion de siempre (test por cada uno)
- [x] Con comando_verificacion_selectiva tambien declarado, el freno Stop decide solo documentacion antes que la selectiva (test)
- [x] Sin la configuracion nueva el freno Stop se comporta exactamente como en la 0.14.0 y no lanza ningun proceso git nuevo (test de regresion)
- [x] Con el arbol de trabajo sucio, el freno Stop corre la comprobacion de documentacion pero no escribe su memo (test)
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test (e5fa8cc: 2160 tests, 2156 pasan, solo los 3 conocidos de Windows)

## Resultado

**Implementado (A3a de TASK-102, troceada en el plan por la regla de una hora: 85 min estimados, decision de Carlos; A3b es TASK-104).** `fs/git.ts` gana `rutasDelArbol`: lo preparado y lo no preparado (`git diff HEAD`) y lo no trackeado (`ls-files --others --exclude-standard --full-name`), con los mismos pathspecs `:(top)` y `:(top,exclude,glob)` y `-z` que `rutasDeTarea` (un solo motor de glob, Git). `decidirVerificacionEntre` gana la opcion `conArbol`, que une commits y arbol ANTES de decidir (una tarea de docs sin commits no sale «vacia»; si un lado falla, diff null = la de siempre). `peticionDeTrabajo` (en `fs/decision-documentacion.ts`) es la eleccion unica «documentacion -> selectiva -> la de siempre» que review reutilizara en TASK-104 (`sinSelectiva: 'nada'`, decision de Carlos). La puerta mira la config del ARBOL: sin `rutas_documentacion` no se lee la de la base ni se calcula diff (medido con GIT_TRACE2: mismos subcomandos que la 0.14.0, `branch`, `rev-parse`, `status`). Las rutas, el comando y el timeout de la de documentacion salen de la base, como en finish y el guardian. Una config de la base invalida no bloquea: la de siempre con aviso. `verificarConMemo` no guarda el memo de documentacion con el arbol sucio (decision de Carlos: no pisa el verde que finish deja para el commit). El freno Stop usa `peticionDeTrabajo`; tarea sin tipo o hotfix no se eximen. 12 tests nuevos en `test/hooks/freno-stop-documentacion.test.ts` contra repos reales; comprobado por mutacion que discriminan (quitar lo no trackeado, `baseFiable`). CHANGELOG anotado como cambio de comportamiento para quien ya declaro `rutas_documentacion`; la documentacion completa (verificacion-selectiva.md, README) va con TASK-104.

**Revision por pares.** Ronda 1 (completa, sonnet): aprobada con correcciones, sin CRITICO ni IMPORTANTE; 12 escenarios reales (renombres, subcarpetas, tildes, repo anidado, ignorados) sin ningun caso de codigo colado como documentacion. MEN-1 (un hotfix resolvia su base con `ls-remote` en cada turno: 11 s con origin inalcanzable) corregido con `baseDeTipoSinRed`; MEN-2 (sin test de la base no fiable) corregido con el test del hotfix; MEN-3 (held-out de `aceptacion/` como documentacion en Stop) aceptado: es la misma clasificacion que finish, y quien corre los held-out es la puerta de finish. En automatico se pidieron como cambios-solicitados para mergear lo revisado. Ronda 2 (verificacion acotada, haiku): aprobada con correcciones; MEN-1 verificado, queda el resto de MEN-2 (tarea sin tipo), aceptado: el camino no es alcanzable desde `decidirStop` (la tarea de la rama es legible y `tipo` es obligatorio; una ilegible no llega a la decision). La suite del revisor de la ronda 2 dio 327 rojos de su entorno (sin bash, EBUSY en limpieza); la de quien implemento, la de siempre.

**Suposiciones del plan, cerradas.** `git diff HEAD` con pathspecs de exclusion cubre preparado y no preparado, y `ls-files` necesita `--full-name` (comprobado en repo temporal). La suite del Stop de este repo (`dist/test/**`) no ejecuta los held-out.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T00:08:16Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T00:21:25Z | approve | automatico | persona | 0.14.0 |
| 2026-11-11T00:21:37Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T01:00:51Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T01:36:22Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T02:22:11Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T00:17:19Z | diseno | agente:a6510894427772cf0,ae4845017e3f37876,ad5af49c426af7f1e | 56 | 137410 | 808016 | 28317 | 44 | 973799 | - | - |
| 2026-11-11T01:00:51Z | implementacion | sesion:54b72414-a421-4c5c-a0d6-578a9eae7f01 | 102 | 87211 | 10592902 | 34219 | 14 | 10714434 | - | - |
| 2026-11-11T01:32:28Z | revision | agente:add4088b73aba27b5 | 224 | 196592 | 16717485 | 40783 | 33 | 16955084 | 1 | - |
| 2026-11-11T02:01:23Z | revision | agente:a708ba72890b0c7a2 | 54 | 264150 | 2597983 | 19513 | 4 | 2881700 | 2 | - |

## Autorrevision

- code-quality-reviewer — abee9b6
- code-quality-reviewer — 1c52181

## Duracion

- Estimada: 55 min
- Real (de la rama abierta al cierre con merge, sin pausas): 121 min
- Paso de la hora: 121 min reales frente a 55 estimados
