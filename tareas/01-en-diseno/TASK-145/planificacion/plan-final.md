# Plan — TASK-145: Regla 4D: duplicacion en las puertas de finish

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 100 min (pasa de 60: se trocea en dos partes; troceo autorizado de antemano por Carlos para el plan de correcciones 4D)

Refactor sin cambio de comportamiento, salvo CMD1-02 (los git de finish ganan el timeout y el entorno de `gitTexto`). La suite de finish es la red: antes de tocar cada bloque se comprueba que tiene tests, y si un camino no los tiene se anade uno antes de unificar.

1. CMD1-02: `finish-verificacion.ts:574`, `finish-heldout.ts:76`, `fs/verificacion.ts:108` y `doctor.ts:154` dejan su «git sin excepcion» y usan `gitTexto` o `gitLinea` de `fs/git-crudo.ts` (TASK-149a), con timeout y entorno.
2. CMD1-03: `configBase` (finish-cobertura) y `configDe` (finish-heldout) quedan en una funcion; `CIERRE`, en una constante.
3. CMD1-04 y CMD1-05: las puertas pesada, completa y de documentacion comparten el bloque ejecutar, anotar, arbol limpio, memo y error, en una funcion de finish-verificacion; `puertaReintento` usa `opcionesEjecucion`.
4. CMD1-12 y FS-09: los textos de error repetidos salen de funciones con nombre en finish-verificacion, y la regex que quita `[ERROR]` sale de una sola funcion exportada (`sinPrefijoError`), usada por freno-stop, guardia-merge, decision-documentacion, finish-cobertura, finish-heldout y finish-verificacion.
5. CMD1-06, CMD1-07 y CMD1-14: en finish.ts, la base de la rama de la tarea (hotfix sale de main) se decide una vez y se pasa; `comprobarTagDeReintento`, una sola copia y sin la rama `else` inalcanzable; los spreads repetidos y la condicion redundante, simplificados.
6. CMD1-13 y CMD1-15: comentarios huerfanos u obsoletos en approve, finish, finish-verificacion y codex-review; el parametro `_today` sin uso de codex-review se quita.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `gitTexto`, `gitLinea` y `gitResultado` de src/fs/git-crudo.ts (TASK-149a); `opcionesEjecucion` de finish-verificacion; `resolveBaseBranchForTipo`.
- Los tests de finish (finish-*.test.ts, verificacion-*.test.ts, guardia-*.test.ts) como red, con los fixtures de test/helpers/finish-fixtures.ts.
- Nuevo: `sinPrefijoError` (una regex hoy copiada seis veces) y la funcion de la puerta comun en finish-verificacion.

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Un refactor de finish puede cambiar un mensaje o un orden de pasos: los tests de finish comparan mensajes, y se corren todos los de finish y verificacion en cada parte, no solo la selectiva.
- El timeout nuevo de CMD1-02 podria cortar un git legitimo lento: se usa el de `gitTexto`, el mismo que el resto del plugin.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- CMD1-02: 1 test que muestra que el git de una puerta usa el timeout (o un test de que no hay copias: grep de `spawnSync('git'` en esos ficheros).
- CMD1-05 y FS-09: 1 test de paridad (los seis llamadores usan `sinPrefijoError`; sin copias de la regex).
- El resto es refactor cubierto por los tests existentes de finish; si un camino unificado no tiene test, 1 test antes de tocarlo.

## Lo que necesita decision de una persona

Nada abierto.

## Troceo

### Parte a: puertas, git y textos de error
gitTexto en finish-verificacion, finish-heldout, verificacion y doctor; configBase y configDe unidas; puerta comun; textos y regex de [ERROR] de una sola fuente.
Duracion estimada: 55 min
- [ ] finish-verificacion, finish-heldout, fs/verificacion y doctor usan gitTexto (con timeout y entorno) en vez de sus copias, y configBase y configDe son una sola funcion
- [ ] Las puertas pesada, completa y de documentacion comparten el bloque ejecutar-anotar-arbol limpio-memo, puertaReintento usa opcionesEjecucion, y los textos repetidos y la regex que quita [ERROR] salen de una sola fuente

### Parte b: finish.ts y comentarios
La base de la rama decidida una vez, comprobarTagDeReintento sin copia, spreads simplificados y comentarios huerfanos u obsoletos fuera.
Duracion estimada: 45 min
- [ ] La base de la rama de la tarea se decide una vez en finish, comprobarTagDeReintento esta una sola vez y sin rama inalcanzable, y los spreads repetidos se simplifican
- [ ] Sin comentarios huerfanos ni obsoletos en approve, finish, finish-verificacion y codex-review, y sin el parametro _today sin uso
