# Plan — TASK-145b: finish.ts y comentarios (parte b de TASK-145)

Redactado por el coordinador (modo rapido; el diseno esta en el plan de TASK-145, ver tareas/04-terminadas/TASK-145a/planificacion/plan-final.md).

## Enfoque propuesto

Duracion estimada: 45 min (parte b del troceo de TASK-145; senales: 3 ficheros de produccion, finish.ts, approve.ts y codex-review.ts; 2 criterios)

Refactor sin cambio de comportamiento; la red son los tests de finish (finish-*.test.ts).

1. CMD1-06: en finish.ts la base de la rama de la tarea (hotfix sale de main) se decide cinco veces (lineas 572, 595, 605, 606 y 735 de la auditoria): se calcula una vez y se pasa a quien la necesita.
2. CMD1-07: la comprobacion del tag de reintento esta dos veces (785-794 y 1016-1023) con una rama `else` inalcanzable: una funcion, sin la rama muerta.
3. CMD1-14: spreads repetidos cinco veces y una condicion redundante (567-612, 649-650, 687-701): se simplifican.
4. CMD1-13 y CMD1-15: comentarios huerfanos encima de la funcion equivocada (approve.ts:346, finish-verificacion.ts:113, finish.ts:1151-1158), el obsoleto de finish.ts:864-865 y el parametro `_today` sin uso de codex-review.ts:138.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `resolveBaseBranchForTipo` y las funciones de tag de finish-opciones; los tests de finish (finish-tag, finish-reintento, finish-merge) y sus fixtures.
- Nuevo: nada, salvo una variable o funcion local en finish.ts si hace falta para decidir la base una vez.

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Quitar la rama `else` del tag de reintento solo es seguro si de verdad es inalcanzable: se comprueba leyendo las condiciones y con los tests de finish-tag.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 0 a 1 (refactor cubierto por finish-tag, finish-reintento y finish-merge; si la base de hotfix no tiene test que la fije, 1).
- Criterio 2: 0 (comentarios y un parametro sin uso).

## Lo que necesita decision de una persona

Nada abierto.
