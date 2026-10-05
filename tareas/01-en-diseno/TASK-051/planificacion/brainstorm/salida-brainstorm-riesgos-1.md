# Brainstorm — TASK-051, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

(Sin ejecutar nada: todo sale de leer el repo. Lo supuesto va marcado.)

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Tests duplicados o fantasma por un `dist/test` viejo.** `build` es `tsc`
   y no limpia (`package.json:11`). Al partir un fichero, su `.js` original
   sigue en `dist` y el glob lo ejecuta junto a los nuevos: recuento inflado,
   medicion «despues» falsa y un test perdido en el fuente sigue verde. El CI
   (clon limpio) no lo ve. Mitigacion: borrar `dist/test` antes de medir y
   contar.
2. **Tests perdidos o duplicados al partir.** Un `test(` en dos ficheros o en
   ninguno; si pasan las dos cosas, el total cuadra. Hoy `^test(` da
   40/22/19/16/11 en start/finish/review/sincronizacion/automatico. Mitigacion:
   comparar la lista de nombres del reporter antes y despues, con `dist`
   limpio; el total solo no basta.
3. **Choque con TASK-050 sin mergear**: reescribe el `withTempRepo` de
   automatico, start, review y finish y crea `test/helpers/repo-plantilla.ts`.
   Partir un fichero no es un renombrado para git: conflicto «borrado contra
   modificado». Mitigacion: arrancar 051 con 050 ya mergeada.
4. **Concurrencia interna que no acelera nada.** Todo git y Git-Flow va por
   `spawnSync` (`src/fs/git.ts:55`, `src/fs/gitflow-runner.ts:95`,
   `src/fs/sincronizacion.ts:364`) y los helpers de test tambien: bloquea el
   event loop, asi que `test(..., { concurrency })` en un proceso apenas
   solapa. Mitigacion: si se elige, exigir la medicion por fichero.
5. **La plantilla de TASK-050 se monta N veces** (una por proceso). Partir en N
   anade N montajes y N procesos con cobertura V8; con 12 procesos en Windows
   la CPU extra puede comerse lo ganado. Partir en pocos trozos, equilibrados
   por tiempo medido, no por numero de tests (`sincronizacion` 221 s con 16).
6. **Mas EBUSY y rojos intermitentes** (`HALLAZGOS.md:615-619`). Anotar los
   rojos por nombre antes y despues y reejecutar aislado cualquier rojo nuevo.
7. **Estado de modulo o de entorno: riesgo bajo, comprobado.** Sin `let` de
   modulo, `process.chdir` ni `process.env` en los cinco ficheros; cada test
   crea su repo con `mkdtemp`; Git-Flow escribe su log en el `.git` del repo
   temporal. Solo `fs/gitflow-runner.test.ts:12-34` muta `CLAUDE_PLUGIN_ROOT`,
   y solo rompe con concurrencia dentro del mismo proceso.

## Estados intermedios y fallos parciales

- Particion a medias (original y nuevos a la vez): duplicados que pasan; solo
  lo destapa comparar nombres.
- Medicion con carga o con bases distintas: medir antes y despues en la misma
  sesion, sobre el mismo commit base, con `dist` limpio y dos corridas.
- Un proceso que muere deja `taskctl-*` en tmpdir: ya pasa hoy.
- Helpers de `start.test.ts:28-106`: copiados en cada fichero nuevo divergen;
  extraidos a `test/helpers/` conviven con el de TASK-050.

## Compatibilidad hacia atras

- `npm test` usa un glob: recoge los nuevos solo. El CI llama a `npm test`
  (supuesto).
- Documentos que citan ficheros de test por nombre (`HALLAZGOS`, Resultados de
  tareas) apuntaran a ficheros que ya no existen.
- Si cambia la cifra de tests al partir, se ha perdido o duplicado algo.
- Los 3 rojos conocidos de Windows pueden cambiar de fichero (supuesto: no
  localizados).
- «gitflow» es ambiguo: no hay `commands/gitflow.test.ts`; puede ser
  `commands/wrappers.test.ts`, `test/gitflow/*` o `fs/gitflow-runner.test.ts`
  (supuesto: `wrappers`). Fijarlo antes de medir.

## Vuelta atras

Reversible entero (solo codigo de test). El revert deja en `dist` los `.js` de
los ficheros partidos: limpiar `dist/test` tambien al revertir. Si otra tarea
se apila encima, el revert obliga a resolver conflictos otra vez.

## El riesgo que mas te preocupa (UNO solo)

El `dist/test` viejo: los `.js` de los ficheros partidos siguen corriendo en la
maquina donde se mide, inflan el recuento, falsean la medicion y mantienen en
verde un test perdido en el fuente.
