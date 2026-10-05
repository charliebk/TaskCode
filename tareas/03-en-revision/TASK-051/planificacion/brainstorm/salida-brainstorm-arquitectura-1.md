# Brainstorm — TASK-051, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

Partir por fichero, no dar concurrencia interna: todo git y bash de `src` es
sincrono (`spawnSync` en `src/fs/git.ts:55` y `src/fs/gitflow-runner.ts:95`),
asi que `{ concurrency }` dentro de un proceso no solapa nada. Solo el reparto
entre procesos del runner baja el camino critico.

Cada fichero lento pasa a 2-4 hermanos por tema en su misma carpeta (precedente:
`review-incremental`, `review-exclusion`, `new-contenido`, `task-store-wip`):

- `start.test.ts` (40) → `start-basico` (l. 108-375), `start-asignacion`
  (376-437 y 779-938), `start-wip` (479-778), `start-wip-ramas` (939-fin, B7,
  la mas cara).
- `finish.test.ts` (20) → `finish-merge` (152-246), `finish-linaje`
  (247-402), `finish-guardas` (120-129 y 403-fin).
- `review.test.ts` (19) → `review-flujo` (145-445 y 749) y `review-dominios`
  (488-748 y 773-fin).
- `sincronizacion.test.ts` (16) → `sincronizacion-ciclo`,
  `sincronizacion-guardas`, `sincronizacion-timeout` (los de timeout los limita
  el reloj, no la CPU).
- `automatico.test.ts` (11) → `automatico-ciclo`, `automatico-guarda-finish`,
  `automatico-veredicto`. Entra porque con ~150 s a solas es la cola real: sin
  partirlo, partir los otros no cambia el total.
- `gitflow` (`test/gitflow/`) ya esta partido por script y no esta en la cola
  medida: no se toca.

## Que se extiende y que se crea

- Se crea `test/helpers/<comando>-fixtures.ts`, uno por comando partido:
  exporta `sampleTask`, `withTempRepo` (sobre `plantillaRepo` de TASK-050) y
  los `setupX` locales. No casa con el glob `*.test.js`.
- `git` y `commitAll` a `test/helpers/` si TASK-050 no lo hizo.
- Orden: mergear TASK-050; medir la base sin carga sobre `develop`; partir
  primero `automatico` y `start`, un commit por comando, comprobando en cada
  paso que el numero de tests no cambia; medir el despues.

## Limites que cruza

Solo codigo de test. Alternativas descartadas: concurrencia interna (no
paraleliza con `spawnSync`, y pasar a `spawn` asincrono cambiaria `src` para
arreglar los tests; ademas sobresuscribe la CPU con 12 ficheros ya en
paralelo); partir solo los 5 del criterio sin `automatico` (el total no baja de
~150 s mientras siga entero).

## La decision de diseño que mas te preocupa (UNA sola)

Cada fichero nuevo vuelve a montar la plantilla (una por proceso): pasar de ~68
a ~80 ficheros suma un montaje y un arranque de proceso por cada uno. Estimado
despreciable frente a 2-3 s por test, sin medir.

Sin verificar: que TASK-050 deja esos ficheros en `test/commands/`; que ningun
fixture escribe config global de git; que los `sampleTask` difieren entre
ficheros (por eso una fixture por comando); cual sera la nueva cola
(`plan-brainstorm`, `plan` o `fs/git`); y que «gitflow» sea `test/gitflow/` y no
`commands/wrappers.test.ts`.
