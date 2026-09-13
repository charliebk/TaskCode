# Informe de revision — TASK-020 (ronda 2)

- Commit revisado: 1bf6952a61ee89f3f0f5374a1a0629bb91cbe188
- Revisor: code-quality-reviewer (independiente: no implemente esta tarea, no hice la ronda 1 ni la correccion)
- Veredicto: cambios-solicitados

## Que se ejecuto para llegar a este veredicto

1. **Clon limpio + build + suite completa.** Clonado con `git -c core.longpaths=true
   clone` a un directorio temporal fuera de cualquier working tree
   (`...\Temp\claude\...\scratchpad\task020-r2\repo`, necesario porque el
   arbol tiene rutas de `brainstorm/` que superan el limite de Windows sin
   `core.longpaths`), checkout a `1bf6952` (HEAD de la rama; el ultimo
   commit que toca codigo sigue siendo `c478507`, el mismo que cita la
   peticion — `1bf6952` solo anade la propia peticion de ronda 2). `npm
   install` limpio, `npm run build` (`tsc -p tsconfig.json`) sin errores,
   y `npx tsc -p tsconfig.json --noEmit` (el script `lint` del proyecto)
   tambien sin errores.
   `npm test`: **867 tests, 864 pass, 3 fail**. Los 3 rojos son
   exactamente los tres conocidos de Windows (confirmado repitiendo `node
   --test` y filtrando `not ok`): `approve.test.js` ("propaga cualquier
   error de stat que NO sea ENOENT"), `plan.test.js` ("propaga cualquier
   error de escritura que NO sea EEXIST") y `plan.test.js` ("la rama base
   real tiene la tarea en un estado distinto..."). Ninguno toca
   `codex-review.ts` ni `git.ts`. Cuenta identica a la que anticipaba la
   peticion. Puerta determinista superada.
2. **Verificacion directa del IMPORTANTE-1 de la ronda 1 (spawnSync
   ENOENT), contra el binario real de esta maquina** (`codex --version` →
   `codex-cli 0.144.1`, resuelto en
   `C:\Users\nullcad2025\AppData\Roaming\npm\codex.cmd`): llame yo mismo a
   la funcion real exportada, sin ningun mock, con los args exactos que
   pide la peticion:
   ```js
   const { runCodexReview } = require('./dist/src/fs/git.js');
   runCodexReview({ args: ['review', '--base', 'develop', '--title', 'prueba'], cwd: process.cwd() });
   // => { lanzado: true, code: 1, stdout: '', errorLanzamiento: null }
   ```
   `lanzado: true`, **no ENOENT**. Repeti la llamada capturando tambien
   `stderr` (el wrapper no lo guarda, pero para diagnostico si) y confirme
   que el `code: 1` es exactamente el fallo de cuenta/modelo que el plan
   documenta como real en esta maquina:
   `ERROR: {"type":"error","status":400,...,"message":"The 'gpt-5.6-sol'
   model is not supported when using Codex with a ChatGPT account."}` — no
   un fallo de lanzamiento. **Confirmado: la correccion del IMPORTANTE-1
   funciona**, con el binario real, no solo "parece correcta" leyendo el
   diff.
3. **Contraprueba exacta que pedia la ronda 1**: revert manual, en mi
   clon, de `shell: useShell` en `runCodexReview` (vuelta a
   `spawnSync('codex', invocation.args, { cwd, encoding, maxBuffer })` sin
   `shell`), rebuild limpio (`tsc` sin errores de tipos), y
   `node --test dist/test/fs/git.test.js`: el test nuevo **"runCodexReview:
   encuentra y lanza un \"codex\" real del PATH (no inyectado)..." se pone
   rojo** (`not ok 36`), exactamente como predice la peticion. Reverti la
   mutacion (`git checkout -- src/fs/git.ts`) y confirme rebuild limpio y
   los 36 tests de `git.test.js` en verde otra vez antes de seguir.
4. **Hallazgo nuevo de la peticion (`--base` + PROMPT), verificado contra
   el CLI real**:
   - `codex review --base develop --title prueba` (sin PROMPT, la
     invocacion que deja el diff): **exit 1**, con el mismo error de
     cuenta/modelo de arriba en `stderr` — es decir, la invocacion es
     **valida** para el parser de argumentos de `codex` (`clap`); llega
     hasta el fallo de red/modelo, no a un error de uso.
   - La misma llamada con un PROMPT posicional anadido
     (`['review', '--base', 'develop', '--title', 'prueba', 'un prompt de
     mentira']`): **exit 2**, `stderr`:
     `error: the argument '--base <BRANCH>' cannot be used with
     '[PROMPT]'` — el conflicto real de `clap` que describe la peticion,
     reproducido letra por letra.
   - `codex review --help` confirma que `[PROMPT]` y `--base`/`--commit`/
     `--uncommitted` son mutuamente excluyentes por diseno del propio CLI
     (no hay ninguna combinacion de flags que permita un PROMPT propio
     junto a `--base`): no encontre ninguna alternativa mejor que la que
     tomo el diff (quitar el prompt personalizado). Es una decision de
     arquitectura razonable dado el contrato real de `codex-cli`
     0.144.1, y el analisis por defecto de `codex review` sigue
     corriendo — solo se pierde la instruccion de clasificacion
     CRITICO/IMPORTANTE/MENOR que el prompt le daba a Codex, y el propio
     informe generado (`codexInformeTemplate`) sigue exigiendo que un
     humano/agente certifique el veredicto, asi que el contrato de
     aprobacion no cambia.
5. **Ejercicio de la entrada real, de punta a punta**: monte un repo Git
   temporal nuevo (`...\scratchpad\task020-r2\cli-exercise`) con TASK-901
   en `03-en-revision`, `revision_codex: true`, plan aprobado, e
   `informe-revision-1.md` con `- Veredicto: aprobada` ya commiteado.
   Corri `node bin/taskctl codex-review TASK-901` de verdad (binario real,
   sin inyectar `deps.runCodex`):
   ```
   [AVISO] Codex "codex review" termino con codigo 1. Puede deberse a
   auth/modelo/red/cuota... Tarea TASK-901: codex-review degradado, sin
   informe escrito. Sin cambios que commitear (nada nuevo en disco).
   ```
   `exit 0`, sin `informe-codex-1.md`, tarea sin moverse de
   `03-en-revision/`. Coherente con el criterio de aceptacion 3 y con lo
   que ya certifico la ronda 1 sobre este mismo comportamiento (no repito
   las mutaciones 1/2 ni la concurrencia de la ronda 1: no tocan ningun
   fichero de este diff).
6. **Fuzzing dirigido de `cmdQuoteWindows` (el escapado nuevo de esta
   ronda)**, con un `codex.cmd` de mentira que delega en un script Node
   que imprime `process.argv` real (mas fiel que un `echo %*` de batch,
   que no revela como quedaria el argv de un proceso real): comillas
   dobles internas, espacios, `&`, `|`, `<`, `>`, `^` llegan **intactos**
   al hijo, incluidos intentos de ruptura de la comilla exterior
   combinados con `&` (`x" & echo INJECTED & "y`, `x"&calc.exe&"y`): el
   doblado de comillas internas los neutraliza correctamente, sin
   inyeccion de comandos. Ver IMPORTANTE-1 de esta ronda para el caso que
   **no** llega intacto.

## Hallazgos

### IMPORTANTE-1 — `cmdQuoteWindows` no protege los argumentos que contienen `%VARIABLE%`: `cmd.exe` los expande antes de que la comilla surta efecto

- Donde: `taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:333-340`
  (`function cmdQuoteWindows`), usada por `runCodexReview` (linea 360) con
  `invocation.args.map(cmdQuoteWindows)`, y alimentada por
  `src/commands/codex-review.ts:213` con `--title \`${task.id}:
  ${task.titulo}\`` — `task.titulo` es texto libre que escribe una
  persona en `tarea.md` (entrada externa, seccion 7 del estandar de
  revision).
- Que pasa: la propia funcion, en su comentario, dice que envuelve en
  comillas "si el argumento tiene espacio o algun caracter que `cmd.exe`
  interpreta (comilla, `&`, `|`, `<`, `>`, `^`, `%`)" — y el regex
  (`/["\s&|<>^%]/`) en efecto detecta el `%` como caracter peligroso. Pero
  envolver en comillas dobles **no** evita que `cmd.exe` expanda
  `%NOMBRE_DE_VARIABLE%` dentro de la cadena: esa expansion ocurre como
  parte del parseo de la linea de comandos completa que hace `cmd.exe`
  cuando Node lo invoca con `shell: true`, **independientemente de si el
  texto esta entre comillas**. Solo protege del resto de caracteres del
  set (comprobado: `&`, `|`, `<`, `>`, `^`, y comillas internas — incluso
  combinadas para intentar romper la comilla exterior — llegan intactos,
  sin inyeccion de comandos posible). El `%` es la unica excepcion, y es
  precisamente uno de los seis caracteres que la funcion afirma cubrir.
- Reproduccion (sin mocks, contra un `codex.cmd` de mentira que delega en
  un script Node que imprime `process.argv` real — mas fiel que `echo
  %*`, que no revela el argv que veria un proceso real):
  ```js
  // codex.cmd de mentira: @echo off\r\nnode ".../printargv.js" %*
  // printargv.js: console.log(JSON.stringify(process.argv.slice(2)))
  const { runCodexReview } = require('./dist/src/fs/git.js');
  runCodexReview({ args: ['review', '--title', 'hola %USERNAME% adios'], cwd: process.cwd() });
  // stdout real del hijo: ["review","--title","hola nullcad2025 adios"]

  runCodexReview({ args: ['review', '--title', 'ruta %APPDATA% aqui'], cwd: process.cwd() });
  // stdout real del hijo: ["review","--title","ruta C:\\Users\\nullcad2025\\AppData\\Roaming aqui"]
  ```
  Un `%` suelto o dos `%` que no delimitan una variable definida (`"20%
  de mejora"`, `"50%foo%bar dentro"`) **si** llegan intactos — el
  problema es especificamente `%NOMBRE_DEFINIDO%`, y en esta maquina
  `%USERNAME%`, `%APPDATA%`, `%PATH%`, `%TEMP%`, `%COMPUTERNAME%` (todas
  variables de entorno estandar de Windows, no exoticas) se expanden a su
  valor real.
- Impacto: `task.titulo` es texto libre — no hace falta un intento
  adversario, basta con un titulo de tarea que mencione la sintaxis de
  variable de Windows (documentando un procedimiento, por ejemplo:
  "Migrar script que usa %APPDATA% a XDG") para que el `--title` que
  recibe `codex review` llegue silenciosamente corrompido, sustituyendo
  ese fragmento por el valor real de la variable de entorno del usuario
  que ejecuta `taskctl` — nombre de usuario, rutas locales, o cualquier
  otra variable definida en su sesion. Y ese `--title` no se queda local:
  viaja como argumento al CLI de Codex, que lo envia a un servicio externo
  (la llamada real de este informe mostro el trafico saliente hacia la
  API de OpenAI). Es una fuga de datos del entorno local hacia un tercero,
  disparada por texto que no tiene nada de malicioso — no una
  vulnerabilidad de inyeccion de comandos (esa via especifica esta bien
  cerrada, ver punto 6 de arriba), pero si un caso real de "la proteccion
  documentada no protege lo que dice proteger". No hay ningun test, ni en
  el diff de esta ronda ni antes, que ejercite `%` en un argumento real
  (el test nuevo de `git.test.ts` solo cubre un argumento con espacios).
- Sugerencia: en `cmdQuoteWindows`, doblar tambien los `%` literales
  (`%` → `%%`) ademas de envolver en comillas — es el mismo criterio que
  usa Node internamente para escapar argumentos hacia `.bat`/`.cmd` desde
  la version que corrigio el CVE-2024-27980 (el propio comentario de la
  funcion ya se compara con ese criterio para las comillas; falta
  extenderlo al `%`). Anadir un caso al test existente (o uno nuevo) que
  fije un argumento con un `%VAR%` que exista de verdad en el entorno del
  proceso de test y compruebe que llega literal, no expandido.

### MENOR-1 — `revisionPrimariaAprobadaDe` reimplementa a mano la logica de `finish.ts` (heredado de la ronda 1, sin cambios)

- Donde: `src/commands/codex-review.ts:110-136` frente a
  `src/commands/finish.ts:113-161`.
- Que pasa: sigue igual que en la ronda 1 — documentado como decision de
  arquitectura consciente en `plan-final.md` (seccion de enfoque), no
  corregido, tal como recomendaba el propio informe de la ronda 1
  (no bloqueante). No he vuelto a mutar esta proteccion: la ronda 1 ya la
  cubrio con mutacion 2 y el diff de esta ronda no la toca.

### MENOR-2 — sin test contra el camino feliz del binario real de Codex (heredado de la ronda 1, sin cambios)

- Donde: `test/commands/codex-review.test.ts` (todo el fichero).
- Que pasa: sigue sin cubrirse — no hay cuenta/modelo compatible en esta
  maquina para probarlo; riesgo aceptado en el plan. El nuevo test de
  `runCodexReview` de esta ronda cubre que el binario se invoca
  correctamente (con un `codex` de mentira), pero no sustituye a un
  camino feliz con la API real. Sin cambios respecto a la ronda 1.

## Otras comprobaciones de esta ronda

- **`npm run lint`** (`tsc -p tsconfig.json --noEmit`) pasa limpio,
  ejecutado directamente con `npx tsc` para evitar ruido de wrappers de
  terminal ajenos al proyecto.
- No hay ESLint ni otro linter de estilo configurado en este plugin —
  informacion, no un fallo de la puerta: el `package.json` solo declara
  `build`, `lint` (alias de `tsc --noEmit`) y `test`.
- El resto de la tarea (las tres decisiones de Carlos, la concurrencia,
  el auto-commit en el caso degradado, `--help`, que no cambia de carpeta
  ni de estado) no lo he vuelto a levantar por mutacion: la peticion no
  lo pedia como obligatorio y el diff de esta ronda no toca esas rutas;
  la ronda 1 ya las certifico con reproduccion real y las cito arriba
  solo donde las volvi a ejercitar de punta a punta (paso 5).

## Resumen del veredicto

El IMPORTANTE-1 de la ronda 1 (ENOENT de `spawnSync` en Windows) esta
**corregido y verificado de verdad**, con el binario real y con la
contraprueba de mutacion que pedia la ronda 1. El hallazgo nuevo que trajo
la peticion (`--base` + PROMPT) es **real y esta bien resuelto**: no hay
ninguna combinacion de flags de `codex review` que permita mantener el
prompt personalizado junto a `--base`.

Pero el propio mecanismo que introduce esta ronda para arreglar el
IMPORTANTE-1 (`cmdQuoteWindows`, necesario para que `shell: true` no
destroce un titulo con espacios) trae su propio hallazgo IMPORTANTE sin
corregir: no neutraliza `%VARIABLE%`, a pesar de que el propio codigo dice
que si. Por el criterio del estandar de revision (IMPORTANTE sin corregir
implica `cambios-solicitados`), el veredicto es **cambios-solicitados**.
