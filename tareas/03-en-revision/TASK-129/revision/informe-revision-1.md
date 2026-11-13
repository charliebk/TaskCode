# Informe de revision — TASK-129 (ronda 1)

- Commit revisado: 4b82c76b8db6f76a0499506279d6541650117a6e
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

**IMP-1 — la anotacion de la linea `suite` por finish y por verificar-lote no tiene ningun test.**
Es la pieza que alimenta todo el freno (sin ella, ni `metricas --por-version` ni `doctor` ven datos) y
ningun test se pone rojo al quitarla. Mutantes sobre `dist/` del clon, con
`finish-verificacion.test.js`, `verificar-lote.test.js` y `crecimiento-suite.test.js`:
- quitar `anotarSuite(o.cwd, o.id, inicioMs, r)` en `puertaVerificacion`: 0 fallos;
- quitar `anotarSuite(...)` en `puertaReintento`: 0 fallos;
- quitar `anotarSuite(cwd, ids[ids.length - 1], inicio, r)` en `verificar-lote.ts`: 0 fallos.
`crecimiento-suite.test.ts` solo escribe a mano el `puertas.log`; nunca comprueba que `finish` lo haga.
Caso a cubrir: un finish con un `comando_verificacion` que imprima `# tests 7` deja una linea `suite`
con modo `7` en `.git/taskcode/puertas.log` (y lo mismo con verificar-lote y el reintento no memoizado).

**IMP-2 — `contarTests` cuenta mal (a la baja y en silencio) con cargo de varios crates u otra salida larga,
porque lee solo la cola de la salida.** `ejecutarVerificacion` devuelve `cola` acotada a los ultimos 16 KiB
(`BYTES_COLA_LEIDOS`, `src/fs/verificacion.ts`) y `anotarSuite` cuenta sobre ella. Reproducido con el
`ejecutarVerificacion` real de `dist/` y un comando que imprime 5 crates de 400 tests
(`test <crate>::tN ... ok` y su `test result: ok. 400 passed; 0 failed; ...`):
`bytesTotales 49925, cola 16384, contarTests(cola) = 800` frente a 2000 reales. El numero anotado es
falso, sin avisar, y alimenta el aviso de crecimiento (puede ocultar un crecimiento real o inventar una
caida). Aplica a cualquier suma por crates/proyectos (cargo workspace, Maven multimodulo cuyo
`Tests run:` final es solo el del ultimo modulo). Para node --test, Jest, dotnet y pytest el resumen va
al final y no afecta. Debe anotar `-` (sin dato) cuando la salida se recorto (`bytesTotales` mayor que la
cola) en los runners que se suman, o contar sobre la salida completa.

**MEN-1 — `metricas --por-version` leyendo la linea `suite` no tiene test.** Mutante en
`dist/src/commands/metricas.js` (`suite: null` en vez de `suitePorTarea.get(...)`), con
`versiones-metricas.test.js`, `crecimiento-suite.test.js` y `metricas.test.js`: 0 fallos. Mutante que
sustituye `celda(g.tests)` por `'x'` en `formatearPorVersion`, con `versiones-metricas.test.js` y
`metricas-version.test.js`: 0 fallos. Las columnas `tests` y `completa` nuevas no estan aseveradas en
ningun test; solo el aviso de doctor lo esta.

**MEN-2 — el umbral no se prueba en el limite.** Mutante `pct > umbralPct` -> `pct >= umbralPct` en
`dist/src/core/crecimiento-suite.js`, con `crecimiento-suite.test.js`: 0 fallos (el test usa +27 % y +43 %
frente a 20 y 50; nunca exactamente el umbral). Falta un caso con crecimiento exacto igual al umbral
(p. ej. 100 -> 120 con 20: no avisa).

**MEN-3 — la documentacion y el comentario prometen Gradle y no se reconoce.** `docs/configuracion.md` y
`contarTests` dicen "Maven/Gradle", pero la regex es `Tests run:` (Maven/Surefire); Gradle por defecto no
imprime ese resumen, asi que anota `-`. Inocuo (sin dato, no inventado) pero la afirmacion no esta
comprobada: quitar "Gradle" o anadir su formato con un test.

Comprobado sin hallazgo: mutante `contarTests` con el primer `Tests run:` en vez del ultimo, rojo (1 fallo);
mutante `suitePorVersion` que cuenta lineas en rojo, rojo (1 fallo); salida TAP de `node --test` (`# tests N`)
y `ℹ tests N` reconocidas; version sin linea `suite` o una sola version: no avisa ni falla (cubierto por
test); `anotarSuite` se llama tambien en el reintento solo si no viene de memo (correcto).

## Verificacion hecha

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-129-r1`, rama de la tarea, `npm install` y `npm run build` sin errores.
- Verificacion de la ronda: valia la de la peticion (selectiva, 953 tests, 0 fallos, mismo commit); no se repitio.
- Tests propios de la tarea (`crecimiento-suite.test.js`, `versiones-metricas.test.js`): en verde antes de mutar (6 y el resto de sus tests). No pude registrar el resumen numerico de la tanda completa de los siete ficheros pedidos (el filtro de salida lo descarto); cada mutante se corrio sobre los ficheros relevantes y sus resultados se citan arriba.
- Mutantes sobre `dist/`: rojo = maven primero, rojo = suitePorVersion cuenta rojos; verde (sobreviven) = `>=` (MEN-2), finish sin anotar (x2) y lote sin anotar (IMP-1), metricas sin leer suite y tabla sin columna de tests (MEN-1).

## Lecturas fuera del contexto permitido

- `src/fs/verificacion.ts` (constante `BYTES_COLA_LEIDOS`) y `src/core/informe-verificacion.ts`: para saber de cuantos bytes dispone `contarTests` (IMP-2).
- `src/core/registro-puertas.ts`: para ver las puertas existentes y el formato de `LineaPuerta`.
