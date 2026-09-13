# Informe de revision — TASK-020 (ronda 1)

- Commit revisado: f938a8bb9890250247e239b2dfea3e23a1a53e04
- Revisor: code-quality-reviewer (independiente, no implemento esta tarea)
- Veredicto: cambios-solicitados

## Que se ejecuto para llegar a este veredicto

1. **Clon limpio + build + suite completa.** Clonado a un directorio temporal
   fuera de cualquier working tree (`.../Temp/claude/task020-review-*/repo`),
   checkout a `f938a8b` (HEAD de la rama, sin cambios de codigo tras el merge
   de `develop` en `d9c699f`). `npm install` limpio, `npm run build` (`tsc -p
   tsconfig.json`) sin errores. `npm test`: **866 tests, 863 pass, 3 fail**.
   Los 3 fallos son `approve.test.js` ("propaga cualquier error de stat que
   NO sea ENOENT") y dos de `plan.test.js` ("propaga cualquier error de
   escritura que NO sea EEXIST" y "la rama base real tiene la tarea en un
   estado distinto"): no tocan `codex-review.ts`, `git.ts` ni ningun fichero
   de este diff, y son coherentes con los tres rojos conocidos de Windows
   documentados en `CLAUDE.md` (simulan fallos de permisos/enlaces via
   `chmod`/symlink, que no se comportan igual en NTFS). Suite en verde segun
   el criterio del proyecto.
2. **Mutacion 1** — en `src/commands/codex-review.ts`, cambie `else if
   (outcome.code !== 0)` por `else if (false && outcome.code !== 0)` (un
   exit≠0 de Codex deja de degradar y se trata como exito). Recompilado y
   corrido `node --test dist/test/commands/codex-review.test.js`: **1 test
   se pone rojo** — el que cubre exactamente "codex presente pero exit
   distinto de cero degrada igual que la ausencia". Mutacion revertida
   (`git checkout -- src/commands/codex-review.ts`), rebuild limpio
   confirmado.
3. **Mutacion 2** — hice que `revisionPrimariaAprobadaDe` devolviera `true`
   siempre (bypass de la precondicion). Recompilado (con un error de tipos
   esperado por el codigo inalcanzable, que no impidio la emision) y corrido
   la suite de `codex-review.test.js`: **1 test se pone rojo** — "rechaza si
   la revision primaria no esta aprobada (PENDIENTE o cambios-solicitados)".
   Mutacion revertida, rebuild limpio confirmado.
   → Ambas protecciones clave tienen red de regresion real, no solo
   aparente.
4. **Ejercicio del CLI real, con el binario `codex` de verdad instalado en
   esta maquina** (`codex --version` → `codex-cli 0.144.1`, resuelto en
   `C:\Users\nullcad2025\AppData\Roaming\npm\codex.cmd`). Monte un repo Git
   temporal nuevo (`.../Temp/claude/task020-cli-exercise`) con TASK-900 en
   `03-en-revision`, `revision_codex: true`, plan aprobado, e
   `informe-revision-1.md` con `- Veredicto: aprobada` ya commiteado — el
   estado exacto que deja `taskctl review` mas un revisor aprobando. Corri
   `node bin/taskctl codex-review TASK-900` de verdad (sin inyectar
   `deps.runCodex`). Vease el hallazgo IMPORTANTE-1: no degrado por el
   motivo que el propio plan documenta como esperado en esta maquina
   (exit≠0 por cuenta/modelo), sino por `ENOENT` — y demuestro por que eso
   es un bug del wrapper, no del entorno. Confirme ademas que:
   - `taskctl finish TASK-900` sigue bloqueado despues (`exit 1`,
     `"revision_codex activada pero esa revision independiente no esta
     aprobada"`, sugiere `taskctl codex-review TASK-900`).
   - No se escribio `informe-codex-1.md`.
   - La tarea sigue en `03-en-revision/TASK-900/` (no cambia de carpeta ni
     de estado).
   - `taskctl --help` documenta `codex-review` tanto en el bloque de "Uso"
     como en la linea "Comandos: ... review, codex-review, finish."
   - El auto-commit del paso 5 de la 8.3, en el caso degradado, no escribe
     nada ("Sin cambios que commitear (nada nuevo en disco)"); `git status`
     quedo limpio tras la ejecucion.

## Hallazgos

### IMPORTANTE-1 — `runCodexReview` nunca invoca realmente `codex` en Windows cuando esta instalado via npm; lo diagnostica (mal) como "no instalado"

- Donde: `taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:330-341`
  (`export function runCodexReview`), llamado desde
  `src/commands/codex-review.ts:215-219`.
- Que pasa: `runCodexReview` llama a
  `spawnSync('codex', invocation.args, { cwd, encoding: 'utf8', maxBuffer
  })`, **sin `shell: true`**. En Windows, un paquete npm global instala el
  binario como `codex.cmd` (mas un shim POSIX sin extension que solo
  entiende una shell Unix). `child_process.spawnSync` sin `shell: true` NO
  resuelve `.cmd`/`.bat` por su nombre sin extension — es una restriccion
  deliberada de Node (no un accidente de esta maquina) — asi que la
  llamada devuelve `result.error.code === 'ENOENT'` **siempre**, aunque
  `codex` este perfectamente instalado y funcional. El propio comando
  entonces reporta: *"Codex no se pudo ejecutar \"codex\" (spawnSync codex
  ENOENT). Probablemente no esta instalado o no esta en el PATH."* — un
  diagnostico falso.
- Reproduccion (exacta, sin mocks):
  ```
  $ where codex
  C:\Users\nullcad2025\AppData\Roaming\npm\codex
  C:\Users\nullcad2025\AppData\Roaming\npm\codex.cmd
  $ node -e "
    const { spawnSync } = require('child_process');
    const r1 = spawnSync('codex', ['--version'], { encoding: 'utf8' });
    console.log('no shell:', JSON.stringify({error: r1.error && r1.error.message, status: r1.status}));
    const r2 = spawnSync('codex', ['--version'], { encoding: 'utf8', shell: true });
    console.log('shell:true:', JSON.stringify({error: r2.error && r2.error.message, status: r2.status, stdout: r2.stdout}));
  "
  no shell: {"error":"spawnSync codex ENOENT","status":null}
  shell:true: {"status":0,"stdout":"codex-cli 0.144.1\n"}
  ```
  Y contra el CLI real de taskctl, en un repo temporal con TASK-900 en
  `en-revision`, `revision_codex: true` y revision primaria ya aprobada:
  ```
  $ node bin/taskctl codex-review TASK-900
  [AVISO] Codex no se pudo ejecutar "codex" (spawnSync codex ENOENT).
  Probablemente no esta instalado o no esta en el PATH. No se ha escrito
  informe-codex-N.md: ...
  Tarea TASK-900: codex-review degradado, sin informe escrito.
  Sin cambios que commitear (nada nuevo en disco).
  ```
  (mismo binario que `codex --version` reporta como `codex-cli 0.144.1`
  funcionando sin problema desde una shell).
- Impacto: en esta maquina — la misma en la que el plan y la tarea afirman
  que "el CLI de Codex SI esta instalado" y que la evidencia de exit≠0 es
  "real" — `taskctl codex-review` **nunca llega a invocar el binario real**.
  Toma la rama de "no instalado" en el 100% de los casos con una
  instalacion npm global tipica en Windows, con independencia de si la
  cuenta/modelo del usuario son compatibles. El mensaje ademas manda al
  usuario en la direccion equivocada ("arregla/instala codex"): reinstalar
  no soluciona nada, porque el problema es como se lanza el proceso, no si
  el binario existe. Esto es justo el tipo de hallazgo que el disenio de
  inyeccion de `deps.runCodex` no puede atrapar: los 8 tests de
  `codex-review.test.ts` inyectan siempre `runCodex` (correctamente, para
  no depender del binario real ni de red — verificado leyendo el fichero),
  asi que ninguno ejercita la funcion real `runCodexReview` de `git.ts`
  contra un binario de verdad, y el bug queda invisible a la suite.
- Sugerencia: en `runCodexReview`, en Windows resolver explicitamente a
  `codex.cmd` (o al nombre que corresponda segun `process.platform`) antes
  de `spawnSync`, o invocar con `shell: true` construyendo los argumentos
  con el cuidado de escape que esto exige (los argumentos ya vienen en un
  array controlado por el propio codigo — `--base`, `--title` con
  `task.id`/`task.titulo`, y el prompt fijo — asi que el riesgo de
  inyeccion es acotado, pero hay que revisarlo si se cambia a `shell:
  true`). Cualquiera de las dos rutas necesita, ademas, un test que
  ejercite `runCodexReview` real (no `deps.runCodex` inyectado) contra un
  ejecutable de prueba, para que esta clase de fallo de plataforma no
  vuelva a pasar sin que la suite lo vea.

### MENOR-1 — `revisionPrimariaAprobadaDe` reimplementa a mano la logica de `buildTransitionContext`/`informesDeLaRonda` de `finish.ts`

- Donde: `src/commands/codex-review.ts:110-136` frente a
  `src/commands/finish.ts:113-161`.
- Que pasa: el mismo criterio fail-closed (leer todos los informes de la
  ronda de mayor numero de `informe-revision-*.md` y exigir que todos
  aprueben) esta escrito dos veces, con su propia copia de
  `INFORME_REVISION_RE`. El propio codigo documenta por que (no exportar
  un simbolo interno de otro comando) y el riesgo esta ya reconocido en el
  plan aprobado, asi que no lo bloqueo — pero nombro la incoherencia
  concreta: si alguien corrige manana un matiz de `informesDeLaRonda` o de
  `INFORME_REVISION_RE` en `finish.ts` (p. ej. otro sufijo de dominio, u
  otro criterio de "que cuenta como ronda maxima") y no recuerda tocar
  tambien `codex-review.ts`, la precondicion de `codex-review` y el gate
  real de `finish` divergiran silenciosamente — sin ningun test que lo
  note, porque cada suite prueba su propia copia. Se documenta y no se
  corrige: es una decision de arquitectura ya tomada conscientemente
  (plan-final.md, seccion de enfoque), no un descuido.

### MENOR-2 — sin test que ejercite el camino feliz con el binario real de Codex

- Donde: `test/commands/codex-review.test.ts` (todo el fichero).
- Que pasa: el plan mismo lo deja como "Sin cubrir" / "Suposiciones no
  verificadas" (no hay cuenta/modelo de Codex compatible en esta maquina
  para probarlo), asi que no es un descuido oculto — ya esta documentado
  como riesgo aceptado en `plan-final.md`. Lo dejo anotado porque el
  hallazgo IMPORTANTE-1 de arriba es la prueba de que ese hueco no es
  solo teorico: precisamente por no ejercitar nunca el binario real, el
  bug de `spawnSync` no se detecto antes de esta revision.

## Otras preguntas de la peticion, verificadas

- **Dos `codex-review` a la vez sobre la misma tarea**: ya cubierto por un
  test real contra un repo Git temporal (`dos invocaciones concurrentes...
  producen EEXIST en una de las dos`); no lo repito por mutacion porque no
  toca una linea de proteccion nueva distinta de las dos ya mutadas.
- **Auto-commit del paso 5 cuando el resultado es degradado**: verificado
  en vivo (arriba): no escribe nada, `git status` queda limpio.
- **`--help` documenta el comando**: si, verificado en vivo.
- **`codex-review` no cambia estado ni mueve la carpeta**: confirmado por
  test (`readTareaFile sigue viendo la tarea en 03-en-revision...`) y en
  vivo (TASK-900 sigue en `03-en-revision/TASK-900/` tras la ejecucion
  real).

## Decisiones del plan, contrastadas contra el codigo

Las tres decisiones de Carlos en `plan-final.md` estan implementadas tal
cual se describen y se sostienen bajo mutacion:

1. TODO fallo de Codex (ausente o exit≠0) degrada igual — confirmado por
   mutacion 1 y por el codigo (`!outcome.lanzado` y `outcome.code !== 0`
   llevan al mismo `degradado = true`).
2. El veredicto lo escribe un humano/agente, nunca se infiere del exit
   code — confirmado: el scaffold siempre escribe `Veredicto: PENDIENTE`
   cuando hay informe, y cuando degrada no se escribe informe en absoluto.
3. `revision_codex: true` sigue bloqueando `finish` fail-closed sin
   excepcion cuando Codex se degrada — confirmado en vivo (TASK-900,
   `taskctl finish` → exit 1).

Ninguna de las tres decisiones esta en duda: el problema no es que el
diseño incumpla el plan, es que la implementacion del wrapper de proceso
(`runCodexReview`) le impide, en la practica, llegar alguna vez al punto
en que esas decisiones importan en la plataforma de esta maquina.
