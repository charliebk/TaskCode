---
id: TASK-107
titulo: "Verificacion proporcional B4: Stop, review y finish deciden igual el mismo diff"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-107-verificacion-proporcional-b4-stop-review
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 418851
tokens_implementacion: 4412635
tokens_revision: 1892590
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-106]
---
## Objetivo

Cuarta parte de TASK-096. Solo tests, sin codigo de produccion salvo que destapen una divergencia (TASK-102 y TASK-104 ya aplican documentacion -> selectiva en Stop y review). Una prueba tabular sobre documentacion, codigo parcial y codigo transversal fija que el freno Stop y taskctl review aplican la misma decision al mismo diff, y que finish coincide con ellos en documentacion y en parcial. Desacuerdo resuelto en el plan: Stop y review son puertas de iteracion y no corren la completa ante lo transversal. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [x] Una prueba tabular (documentacion, parcial, transversal) comprueba que decidirStop y runReviewCommand corren el mismo comando para el mismo diff, y que finish coincide en documentacion y parcial; un turno o una ronda que solo tocan documentacion no corren la suite de tests
- [x] La prueba se pone roja si se desvia la decision de uno de los tres en un caso (mutacion documentada en Resultado)
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T21:31:01Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T21:34:38Z | approve | automatico | automatico | 0.14.0 |
| 2026-11-11T21:34:51Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T22:23:14Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T21:34:27Z | diseno | agente:a63dec4bad1925d79 | 24 | 53030 | 355800 | 9997 | 19 | 418851 | - | - |
| 2026-11-11T22:23:14Z | implementacion | sesion:dc97ac1a-e124-4796-9bc7-dd4a6cde4571 | 62 | 55454 | 4342622 | 14497 | 10 | 4412635 | - | - |
| 2026-11-11T22:32:49Z | revision | agente:a7949e266cf8c2f38 | 36 | 113717 | 1770971 | 7866 | 5 | 1892590 | 1 | - |

## Resultado

**Implementado** (solo tests; produccion sin tocar, la tabla no destapo ninguna divergencia): `test/commands/verificacion-tres-puertas.test.ts`. Una tabla de 3 filas (diff de documentacion `docs/x.md`, codigo parcial `src/a.ts`, codigo transversal `lib/b.ts`) x 3 actores (`decidirStop`, `runReviewCommand`, `runFinishCommand`), con el nivel 2 completo en la config (`rutas_documentacion: [docs/**, trabajo-*.txt]`, `rutas_verificacion_parcial: [src/**]`, selectiva y comando de documentacion). Cada celda afirma el vector absoluto de ejecuciones `{completa, sel, docs}`, no solo la igualdad entre actores (Stop y review comparten `peticionDeTrabajo`). Ademas: Stop == review en las tres filas, finish == review en documentacion y parcial, finish != review en transversal (la divergencia acordada en TASK-096: Stop y review iteran con la selectiva, finish corre la completa), y quien corre la selectiva recibe `RAMA_BASE=develop`. Un repo nuevo por cada par (fila, actor), 9 en total, para que el memo compartido no confunda los contadores (decision de Carlos).

**Mutaciones** (a mano, revertidas; cada una pone en rojo la celda que le toca y deja las demas en verde):
- M1 `review.ts:1075` `baseFiable` falso -> rojo `documentacion/review` (review corre la selectiva); Stop sigue en verde: la tabla distingue a review del Stop.
- M2 `finish.ts:470` `permitirSelectiva` falso -> rojo `parcial/finish` (corre la completa).
- M3 `freno-stop.ts:189` `baseFiable` falso -> rojo `documentacion/stop`.
- M4 `decision-documentacion.ts:196` sin la rama de documentacion dentro de `peticionDeTrabajo` (mueve a Stop y review a la vez) -> rojo `documentacion/stop`: una prueba de solo «Stop == review» habria seguido en verde.
(Las mutaciones usan `process.env.MUTANTE === "x" && ...`: con un literal `false &&` TypeScript da por inalcanzable el codigo que sigue y no compila.)

**Suite**: `npm test` 2213 tests, 2206 pasan, 6 fallan. Los 3 conocidos de Windows (symlink EPERM en `approve.test`, chmod NTFS y CRLF en `plan.test`); los otros 3 (`doctor-deploy-tareas`, `doctor-hooks-subagente`, `origin-deteccion` expira) pasan al reejecutar sus ficheros aislados: carga (la pasada duro 28 min). La tabla sola tarda ~38 s en caliente; no entra en `test:rapido` porque lanza procesos.

**Revision por pares**: ronda 1 (general-purpose sonnet, code-quality-reviewer): aprobada. Reprodujo la tabla en un clon y mato 4 mutantes propios (finish con la selectiva ante lo transversal, Stop con la completa, RAMA_BASE equivocada, finish sin la via de documentacion), cada uno en su celda.

**Decidido no corregir**: MEN-1 (para Stop y review las filas parcial y transversal coinciden) — es justo la fila que fija que Stop y review no corren la completa ante lo transversal; MEN-2 (un test por fila con los tres actores en serie) — cada fallo ya nombra `fila/actor`. Aceptados en el informe; en automatico se integra lo revisado.

## Autorrevision

- code-quality-reviewer — b110aab
