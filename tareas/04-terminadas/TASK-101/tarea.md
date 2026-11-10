---
id: TASK-101
titulo: "Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-101-verificacion-proporcional-a2-el-guardian
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 837575
tokens_implementacion: 10619320
tokens_revision: 7416729
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: [TASK-100]
---
## Objetivo

Troceada en el plan por la regla de una hora (120 min estimados; decision de Carlos, 2026-11-10): el tratamiento de una config invalida en el arbol (MEN-5, bloquear siempre hacia develop, main o master) pasa a TASK-103. Decisiones de Carlos que aplica esta tarea: los held-out de tareas/**/aceptacion/ cuentan como codigo en el guardian (mas estricto que finish, solo en el merge a mano). El enunciado original sigue debajo.

Segunda parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). Con la decision unica de TASK-100 (decidirVerificacion, rutas_documentacion leidas de la base, memo 'documentacion'), el guardian de merges recalcula el diff con merge-base(destino, fuente), sin depender de la tarea ni del memo de finish: deja pasar un merge de solo documentacion con el verde del memo de documentacion (o sin el si no hay comando de documentacion) y sigue bloqueando uno con codigo sin verde de la completa. Si no puede calcular el diff con el destino ya protegido, bloquea. Un valor invalido de la clave nueva no desactiva el guardian. Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A2).

## Criterios de aceptacion
- [x] Con rutas_documentacion declaradas, el guardian deja pasar el merge de una tarea de solo documentacion sin verde de la completa y bloquea el de una con codigo (un test por caso, repo temporal)
- [x] Lanzado el merge a mano sin pasar por finish, el guardian llega a la misma decision que finish para el mismo par fuente-destino (test)
- [x] Si no puede calcular el diff con el destino protegido, el guardian bloquea igual que hoy; una config del destino invalida lleva a la decision completa (un test por caso). La config invalida del arbol (MEN-5) es TASK-103
- [x] Sin la configuracion nueva el guardian se comporta exactamente como en la 0.14.0 (test de regresion)
- [x] De la revision de TASK-100 (ronda 2): el mensaje de error de rutas_documentacion deja de decir «casa con cualquier fichero» para `*` y `*/**` (MEN-6), y verificacion-selectiva.md corrige la frase sobre core.ignorecase: el pathspec distingue mayusculas siempre salvo con :(icase) (MEN-7)
- [x] verificacion-selectiva.md, README y CHANGELOG explican el comportamiento del guardian
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Resultado

**Implementado (A2 de TASK-096; troceada en el plan: la config invalida del arbol es TASK-103).** La decision de verificacion proporcional pasa a `fs/decision-documentacion.ts` (`decidirVerificacionEntre`), compartida por `finish` (refactor sin cambio de comportamiento) y el guardian de merges: deciden lo mismo por construccion. El guardian gana el paso 6b, que solo se calcula cuando ya iba a bloquear: con la config de la rama DESTINO, un merge a mano de solo documentacion pasa sin el verde de la completa (o con el verde del memo de documentacion si hay comprobacion declarada). No se aplica en un release, si cambian los held-out (`tareas/**/aceptacion/`, que en el guardian cuentan como codigo, decision de Carlos), con la config del destino invalida, pasado un presupuesto de 20 s, ni si el comando hace algo mas que un unico merge (`comandoSoloIntegra`, en `core/comando-merge.ts`). El mensaje de bloqueo dice por que; sin `rutas_documentacion` es identico al de la 0.14.0. Incluye MEN-6 y MEN-7 de TASK-100 (mensaje de patrones demasiado amplios y frase de mayusculas).

**`comandoSoloIntegra`, lista blanca estricta:** sin `<`, `>`, backtick ni `$` en el texto; exactamente un `git merge` o script de cierre contado en todo el texto (tambien dentro de `bash -c`), sin `--abort/--quit/--continue/--skip`; aparte, solo `cd`/`pushd`/`popd`/`pwd`/`set-location`, `git status|log|diff|show|rev-parse` (sin `--output`, `-o` ni `--exec`), `git checkout|switch` con solo `-q`, `--quiet` o `--detach`, `git branch` listando; solo `-C` como opcion global de git; sin asignaciones de entorno ni barras invertidas.

**Revision por pares (3 rondas; la 0.14.0 mantuvo el modelo completo en las acotadas por haber CRITICOS).** Ronda 1: CRI-1 (otro `git merge` antes en el mismo comando metia codigo en la rama evaluada) y CRI-2 (`>`, `tee`, `$(...)` o backticks en comandos «de lectura» movian la rama), ambos reproducidos de punta a punta; MEN-1 aceptado (linea extra en el mensaje con la config del destino invalida; sigue bloqueando) y MEN-2 a TASK-103 (anterior a la tarea). Ronda 2: CRI-1 y CRI-2 corregidos; NUE-1 (opciones de crear o forzar rama agrupadas, adjuntas o escapadas: `-fB`, `-Bdocs`, `-\B`, `--force-c`) y NUE-2 (un merge con `-m --abort` no contaba como merge), corregidos con lista cerrada de opciones y conteo de merges. Ronda 3: aprobada con correcciones; queda NUE-3 (los tests de barra invertida no llevan barra real en el `.ts`; el rechazo si funciona, probado a mano), que pasa a TASK-103 junto a tres huecos que el guardian ya tenia desde TASK-072 y que esta tarea no causa: `{ git merge ...; }`, `time`/`eval` delante del merge, y `git checkout <fichero> && git merge` (el fichero se toma como rama destino).

**Tests:** 13 nuevos en `test/hooks/guardia-documentacion.test.ts` (paso 6b de punta a punta, memo de documentacion frente al de la completa, held-out, release, config del destino, mensaje de la 0.14.0, `comandoSoloIntegra` con las entradas de las tres rondas). Ningun test existente cambia de expectativa.

**Suite completa:** 2147 tests, 2143 en verde antes de la revision (los 3 rojos conocidos de Windows). Tras las correcciones, suite rapida 707/707 y los 71 tests de hooks en verde.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T21:54:14Z | plan | automatico | persona | 0.14.0 |
| 2026-11-10T22:17:55Z | approve | automatico | persona | 0.14.0 |
| 2026-11-10T22:17:58Z | start | automatico | persona | 0.14.0 |
| 2026-11-10T22:50:05Z | review | automatico | persona | 0.14.0 |
| 2026-11-10T23:05:37Z | review | automatico | persona | 0.14.0 |
| 2026-11-10T23:18:58Z | review | automatico | persona | 0.14.0 |
| 2026-11-10T23:36:58Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T22:02:02Z | diseno | agente:a0b810a87912b0a9b,a1a7fbbc155e22f2a,ac832177fd6d296a1 | 50 | 125707 | 677240 | 34578 | 34 | 837575 | - | - |
| 2026-11-10T22:50:05Z | implementacion | sesion:f5a75e93-b137-4945-9f2a-de03fa092974 | 46 | 36414 | 10557409 | 25451 | 7 | 10619320 | - | - |
| 2026-11-10T23:00:54Z | revision | agente:adcbcf91a2cbd0279 | 72 | 153463 | 4310891 | 37385 | 5 | 4501811 | 1 | - |
| 2026-11-10T23:14:34Z | revision | agente:a41620e1685fa4e65 | 18 | 115439 | 793257 | 16109 | 0 | 924823 | 2 | - |
| 2026-11-10T23:36:26Z | revision | agente:adb53d0e28b1bea3f | 34 | 134415 | 1824725 | 30921 | 1 | 1990095 | 3 | - |

## Autorrevision

- code-quality-reviewer — 8277541
- code-quality-reviewer — 56c79a7
- code-quality-reviewer — 729658b

## Duracion

- Estimada: 95 min
- Real (de la rama abierta al cierre con merge, sin pausas): 79 min
- Paso de la hora: 79 min reales frente a 95 estimados
