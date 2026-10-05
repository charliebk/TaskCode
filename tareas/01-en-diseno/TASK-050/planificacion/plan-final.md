# Plan — TASK-050: F6-T1 Suite rapida y repo plantilla en los tests

(Consolidado por quien orquesta a partir de 2 roles de brainstorm lanzados
en paralelo: arquitectura y riesgos. **Desviacion documentada:** sin agente
unificador, como en TASK-059 (backlog en continuo); los desacuerdos se
senalan igual. Se anade una medicion real por fichero que ningun rol tenia.)

## Medicion de partida (2026-10-05, Windows nativo, 12 nucleos)

- `npm test` completo (con cobertura): **513 s**, 1083 tests, 3 rojos (los 3
  conocidos de Windows).
- Tiempo por fichero (los 68 lanzados a la vez, 12 en paralelo; cifras
  infladas por la carga, sirven para ordenar): `automatico` 423 s, `start`
  322, `review` 282, `plan-brainstorm` 275, `finish` 245, `siguiente` 238,
  `sincronizacion` 221, `distribucion` 209. En `core/`+`cli/`: `cli/main`
  122 s y `core/config` 60 s; el resto, 1-10 s cada uno.

## Enfoque propuesto

1. **Helper `test/helpers/repo-plantilla.ts`** (arquitectura). Exporta
   `plantillaRepo(prefijo, preparar)`, que devuelve un `withRepo(fn)`:
   - `preparar(dir)` es la receta de cada fichero (no se impone un repo
     comun). Se ejecuta una vez por proceso, en un `mkdtemp` propio, y se
     guarda como promesa.
   - Cada llamada copia la plantilla con `fs.cp(..., { recursive: true })` a
     un `mkdtemp` nuevo, ejecuta `fn` y borra la copia en `finally`.
   - La plantilla se borra en un `after()` registrado por el helper.
   - Si `preparar` o la copia fallan, el error se propaga tal cual (riesgos:
     nada de seguir con una plantilla vacia).
   - Sin remotos, worktrees ni hooks en la plantilla: lo que un test necesite
     de eso lo anade sobre su copia (riesgos).
2. **Adopcion en los 5 ficheros mas lentos medidos**: `automatico`, `start`,
   `review`, `plan-brainstorm` y `finish`. El cuerpo de su `withTempRepo`
   pasa a ser la receta, identica a la actual; la firma no cambia, asi que los
   tests no se tocan.
3. **`test:rapido`**: `npm run build && node --test "dist/test/core/**/*.test.js" "dist/test/cli/**/*.test.js"`.
   Los tres ficheros de esas carpetas que lanzan `git` (`core/config.test.ts`,
   `cli/main.test.ts`, `cli/flags-desconocidos.test.ts`) se mueven con
   `git mv` a `test/integracion/`, a la misma profundidad, para que sus
   imports relativos no cambien y `npm test` los siga recogiendo.
4. **Cobertura**: se mide la suite completa con y sin
   `--experimental-test-coverage` en la misma maquina y sin carga. Si la
   diferencia supera el 10 %, `test` pierde el flag y nace `test:cov` con la
   linea actual; si no, se deja como esta y se anota la cifra.
5. **Documentacion**: README del plugin (seccion de tests), `CLAUDE.md` y
   `docs/contexto/` dicen que `test:rapido` es para iterar y **no vale para
   cerrar una tarea** (deja fuera `agents/`, `skills/`, `empaquetado/`).

## Desacuerdos entre roles, y como se resuelven

- **Cuales son los 5 ficheros.** Arquitectura propuso `start`, `finish`,
  `review`, `sincronizacion` y `wrappers` por numero de tests; riesgos pidio
  medir. La medicion manda: `wrappers` (101 s) y `sincronizacion` (221 s)
  quedan fuera; entran `automatico` y `plan-brainstorm`. `sincronizacion` se
  trata en TASK-051 (partir ficheros).
- **Plantilla comun o receta por fichero.** No hay desacuerdo: los dos roles
  piden receta por fichero.

## Riesgos aceptados y que los contiene

- **Tests migrados que siguen verdes sin probar lo mismo** (el riesgo mayor
  segun riesgos). Lo contiene: receta copiada literalmente del setup actual,
  y una mutacion por fichero migrado (romper el codigo que un test cubre y
  ver que se pone rojo).
- **`fs.cp` de `.git` en Windows** (objetos de solo lectura): lo contiene que
  la tarea se valida en Windows nativo, que es justo donde el CI no mira
  (`continue-on-error`). Los rojos antes y despues se anotan.
- **`dist/test` viejo**: `test:rapido` compila antes, como `test`.
- **Medicion ruidosa de la cobertura**: se mide sin carga; si la diferencia
  queda en el ruido, no se separa.

## Plan de pruebas

- `npm test` completo antes y despues: mismos tests y los mismos 3 rojos
  conocidos.
- `npm run test:rapido` cronometrado: menos de 60 s, y sin ningun test que
  lance `git` (grep de `child_process` en `test/core` y `test/cli` vacio).
- Tiempo de los 5 ficheros migrados antes y despues, ejecutados solos.
- Una mutacion por fichero migrado que el fichero detecte.
- El helper tiene su propio test: dos llamadas reciben directorios distintos
  y una copia mutada no contamina la siguiente.

## Lo que necesita decision de una persona

Nada: pasar la cobertura a `test:cov` es reversible y se decide con la
medicion, con el umbral escrito arriba.
