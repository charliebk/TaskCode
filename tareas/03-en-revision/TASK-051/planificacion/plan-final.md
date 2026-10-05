# Plan — TASK-051: F6-T2 Partir los ficheros de test mas largos

(Consolidado por quien orquesta a partir de 2 roles de brainstorm lanzados
en paralelo: arquitectura y riesgos. **Desviacion documentada:** sin agente
unificador, como en TASK-050 (backlog en continuo).)

## Enfoque propuesto

1. **Partir por fichero, no concurrencia interna** (los dos roles
   coinciden): todo git y Git-Flow va por `spawnSync`, que bloquea el event
   loop; `{ concurrency }` en un proceso no solaparia nada. Solo el reparto
   entre procesos del runner acorta el camino critico.
2. **Que se parte** (en `test/commands/`, hermanos del original, que
   desaparece): `automatico` (3 ficheros), `start` (4), `finish` (3),
   `review` (2) y `sincronizacion` (3), con los cortes por tema que propone
   arquitectura, reequilibrados por el tiempo medido de cada test si un
   trozo sale mucho mas largo que el resto. `automatico` entra aunque el
   criterio no lo nombra: es la cola real (~150 s a solas).
3. **«gitflow» del criterio**: `test/gitflow/` ya esta partido por script
   (un fichero por script) y ninguno esta en la cola medida;
   `commands/wrappers.test.ts` (101 s bajo carga) tampoco. Se deja
   constancia en el Resultado y no se tocan.
4. **Setup compartido sin duplicar**: `test/helpers/<comando>-fixtures.ts`
   por comando partido (`sampleTask`, `withTempRepo` sobre la `plantillaRepo`
   de TASK-050, los `setupX` locales, `git`/`commitAll`). No casa con el glob
   `*.test.js`.
5. **Orden**: se arranca con TASK-050 ya mergeada (riesgos y arquitectura
   coinciden: si no, conflicto «borrado contra modificado» sobre los mismos
   ficheros). Un commit por comando partido.

## Desacuerdos entre roles, y como se resuelven

No hay desacuerdos de fondo. Riesgos pide equilibrar por tiempo y no por
numero de tests; arquitectura corta por tema. Se corta por tema y se
reequilibra con la medicion por test (reporter `spec`) cuando un trozo
quede descompensado.

## Riesgos aceptados y que los contiene

- **`dist/test` viejo** (el mayor segun riesgos): ya contenido por TASK-050,
  que hace que `npm test` borre `dist/test` antes de compilar. Toda medicion
  y todo recuento de esta tarea se hacen con `npm run limpiar:test` antes.
- **Tests perdidos o duplicados**: se compara la **lista de nombres** de
  test (reporter TAP, ordenada) del fichero original contra la union de sus
  trozos, no solo el total.
- **N montajes de plantilla y mas procesos**: aceptado; se mide el total.
- **Rojos intermitentes bajo carga**: los rojos se anotan por nombre antes y
  despues; un rojo nuevo se reejecuta aislado.
- **Documentos que citan ficheros por nombre** (HALLAZGOS, Resultados):
  quedan como registro historico; no se reescriben.

## Plan de pruebas

- Antes y despues, en la misma sesion, sobre el mismo commit base, con
  `dist/test` limpio y sin otra carga: `node --test` completo cronometrado,
  dos corridas de cada lado.
- Lista de nombres de test identica antes y despues (diff vacio).
- Mismos 3 rojos conocidos de Windows.
- Tiempo de cada fichero nuevo, para dejar anotada la nueva cola.

## Lo que necesita decision de una persona

Nada.
