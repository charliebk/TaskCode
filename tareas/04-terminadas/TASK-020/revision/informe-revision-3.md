# Informe de revision — TASK-020 (ronda 3)

- Commit revisado: f9ea523dac9338bc2033f62c4797f94917cc61e1 (HEAD de la rama;
  `git diff 546e1d4..f9ea523 -- src test` esta vacio — el unico commit
  posterior a `546e1d4` anade `peticion-revision-3.md`, sin tocar codigo ni
  tests, asi que esta revision cubre exactamente el mismo diff de codigo que
  cita la peticion, `546e1d4` frente a `c478507`)
- Revisor: code-quality-reviewer (independiente: no implemente esta tarea, no
  hice la ronda 1 ni la ronda 2)
- Veredicto: aprobada con menores documentados

## Que se ejecuto para llegar a este veredicto

1. **Clon limpio + build + lint + suite completa.** Clonado con `git -c
   core.longpaths=true clone` a un directorio temporal fuera de cualquier
   working tree (`...\Temp\claude\task020-r3\repo`), checkout a la rama
   (`f9ea523` confirmado como HEAD). `npm install` limpio, `npm run build`
   (`tsc -p tsconfig.json`) sin errores. `npm run lint` a traves del script
   de npm imprimio una linea de ruido ajena al proyecto ("ESLint output
   (JSON parse failed...)", de un wrapper de terminal, no del propio `tsc`);
   repetido con `npx tsc -p tsconfig.json --noEmit` directamente: **"TypeScript:
   No errors found"**, limpio.
   `npm test` (`node --test --experimental-test-coverage
   "dist/test/**/*.test.js"`): **868 tests, 865 pass, 3 fail**. Los tres
   rojos, verificados por nombre, son exactamente los tres conocidos de
   Windows documentados en `CLAUDE.md` y en las rondas anteriores:
   `approve.test.js` ("propaga cualquier error de stat que NO sea ENOENT"),
   `plan.test.js` ("propaga cualquier error de escritura que NO sea EEXIST")
   y `plan.test.js` ("la rama base real tiene la tarea en un estado distinto
   al de la lectura preliminar..."). Ninguno toca `codex-review.ts` ni
   `git.ts`. Ningun otro rojo. Puerta determinista superada.

2. **Verificacion directa de que el IMPORTANTE-1 de la ronda 1 sigue
   corregido**, contra el binario real de esta maquina (`codex --version` →
   `codex-cli 0.144.1`, resuelto en
   `C:\Users\nullcad2025\AppData\Roaming\npm\codex.cmd`): llame a la funcion
   real exportada, sin mocks:
   ```js
   const { runCodexReview } = require('./dist/src/fs/git.js');
   runCodexReview({ args: ['review', '--base', 'develop', '--title', 'prueba ronda 3'], cwd: process.cwd() });
   // => { lanzado: true, code: 1, errorLanzamiento: null, stdout: '' }
   ```
   `lanzado: true`, **no ENOENT** — coherente con lo que certifico la ronda 2.

3. **Verificacion del fix de la ronda 2 (`%VARIABLE%`) con un `codex.cmd` de
   mentira**, con al menos dos nombres de variable distintos como pedia la
   peticion (use tres, para no depender de una sola casualidad):
   antepuse al PATH un directorio temporal con `codex.cmd` que delega en un
   script Node que imprime `process.argv` real, y llame `runCodexReview` con
   tres titulos distintos:
   ```
   "hola %USERNAME% adios"      -> ["review","--title","hola USERNAME adios"]
   "maquina %COMPUTERNAME% ref" -> ["review","--title","maquina COMPUTERNAME ref"]
   "ruta %APPDATA% aqui"        -> ["review","--title","ruta APPDATA aqui"]
   ```
   El valor real de cada variable en esta maquina (`nullcad2025`, `NULLCAD`,
   `C:\Users\nullcad2025\AppData\Roaming`) **no aparece en ningun caso**; el
   `%` se elimina y queda el nombre de la variable como texto literal. La
   correccion de la ronda 2 se sostiene con reproduccion propia, no solo
   leyendo el diff.

4. **Contraprueba pedida por la peticion**: reverti a mano, en mi clon (no en
   el repo del usuario), el regex de `cmdQuoteWindows` a la version de la
   ronda 1 (`/["\s&|<>^%]/` deteccion sin eliminar el `%`, devolviendo `arg`
   en vez de `sinPorcentaje`), rebuild limpio (`tsc` sin errores de tipos) y
   `node --test dist/test/fs/git.test.js`: el test 37 ("un argumento con
   forma \"%VARIABLE%\" no se expande...") **se pone rojo**:
   ```
   not ok 37 - runCodexReview: un argumento con forma "%VARIABLE%" no se expande...
   error: no deberia filtrarse el valor real de %USERNAME% ("nullcad2025") en:
     ARGS:review --title "hola nullcad2025 adios"
   actual: 'ARGS:review --title "hola nullcad2025 adios"'
   # tests 37 / pass 36 / fail 1
   ```
   El valor real (`nullcad2025`) se filtra tal cual predice el hallazgo de la
   ronda 2. Reverti la mutacion, rebuild limpio y `git.test.js` de vuelta en
   37/37 verde antes de seguir.

5. **Combinacion de la eliminacion de `%` con intentos de inyeccion** (para
   comprobar que quitar el `%` no abre una via nueva al interactuar con el
   resto del escapado): con el mismo `codex.cmd` de mentira,
   ```
   "% & echo INJECTED & %"                        -> ["review","--title"," & echo INJECTED & "]
   "%USERNAME% & echo INJECTED & %COMPUTERNAME%"  -> ["review","--title","USERNAME & echo INJECTED & COMPUTERNAME"]
   "x\" & echo INJECTED2 & \"%TEMP%y"             -> ["review","--title","x\" & echo INJECTED2 & \"TEMPy"]
   ```
   En los tres casos el argumento llega como una unica palabra dentro del
   array `argv` del proceso hijo (no se parte en varias, no ejecuta nada
   fuera de si mismo): el `&` queda neutralizado por el comillado que ya
   verifico la ronda 2, y quitar el `%` primero no interfiere con esa
   proteccion.

6. **Rastreo de donde se usa `--title` / `task.titulo`** (para acotar el
   radio de impacto de la perdida de `%`): en
   `src/commands/codex-review.ts:213`, `` `${task.id}: ${task.titulo}` `` se
   construye a partir de `task.titulo` **sin modificar** y solo se pasa como
   argumento a `runCodexReview` — `cmdQuoteWindows` actua sobre una copia del
   argumento, en el momento de invocar `cmd.exe`. `task.titulo` en si (en
   `tarea.md`, en el tablero, en los informes, en `plan.ts`, `finish.ts`,
   etc.) no se toca en ningun otro sitio del codigo. La perdida del `%` es
   estrictamente local a lo que ve el proceso `codex` externo.

## Hallazgos

### MENOR-1 — un `%` literal legitimo en el titulo de una tarea desaparece silenciosamente del `--title` que ve Codex (efecto secundario de la correccion de la ronda 2, no documentado como tal)

- Donde: `taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:351-357`
  (`cmdQuoteWindows`), alimentada desde
  `src/commands/codex-review.ts:213`.
- Que pasa: comprobado con reproduccion propia — un titulo real y legitimo
  con un `%` que no forma parte de ninguna variable de entorno tambien
  pierde ese caracter, sin aviso:
  ```
  "mejora el rendimiento un 30%"        -> "mejora el rendimiento un 30"
  "TASK-020: mejora un 30% el uso de CPU" -> "TASK-020: mejora un 30 el uso de CPU"
  "100% completado"                     -> "100 completado"
  ```
  Es la contrapartida exacta que pedia verificar la peticion de esta ronda:
  la correccion (eliminar el `%` en vez de escaparlo) es deliberadamente mas
  agresiva de lo necesario — no distingue "`%` que abre una variable de
  entorno real" de "`%` suelto que es solo texto" (el propio informe de la
  ronda 2 ya documenta que un `%` suelto o dos que no delimitan una variable
  definida SI llegaban intactos con el escapado original; con la correccion
  actual, ya no).
- Impacto: acotado, por el rastreo del punto 6 de arriba — **solo** afecta a
  lo que ve el CLI de `codex` en su flag `--title` (contexto informativo para
  su analisis); `task.titulo` en `tarea.md`, el tablero, los informes de
  revision y el resto del sistema quedan intactos. No hay perdida de datos
  persistente ni corrupcion de estado; es un efecto cosmetico en un mensaje
  que ademas ya es best-effort (el propio `codex review` puede degradarse o
  fallar por completo, como confirman las rondas 1 y 2).
- Es, en mi valoracion, un trade-off razonable: la alternativa (intentar
  escapar el `%` en vez de eliminarlo) ya se investigo en la ronda 2 y se
  descarto por no existir una forma fiable de hacerlo para una invocacion
  suelta de `cmd.exe /c` (el truco de doblar `%%` es especifico del cuerpo de
  un `.bat`, verificado que no aplica aqui). Preferir "perder un caracter
  cosmetico en un mensaje informativo" a "filtrar el valor real de una
  variable de entorno del sistema del usuario hacia una llamada de red
  externa" es la eleccion correcta entre las dos opciones disponibles. No lo
  bloqueo.
- Sugerencia (no bloqueante): anadir una linea al comentario de
  `cmdQuoteWindows` (lineas 335-350) que diga explicitamente que un `%`
  literal legitimo en el argumento tambien se pierde como consecuencia
  aceptada, para que quien lea el codigo despues no lo confunda con un
  descuido. Opcionalmente, un comentario corto en
  `src/commands/codex-review.ts:213` recordando que `--title` es
  best-effort/informativo y puede diferir del `task.titulo` real por este
  motivo.

### MENOR-2 — `revisionPrimariaAprobadaDe` reimplementa a mano la logica de `finish.ts` (heredado de las rondas 1 y 2, sin cambios en este diff)

- Donde: `src/commands/codex-review.ts:110-136` frente a
  `src/commands/finish.ts:113-161`.
- Que pasa: sigue igual que en las rondas 1 y 2 — decision de arquitectura
  documentada conscientemente en `plan-final.md`, no corregida. El diff de
  esta ronda no toca esta zona; no la he vuelto a mutar porque la ronda 1 ya
  demostro que la proteccion tiene red de regresion real (mutacion 2) y
  nada en el diff de la ronda 2 o 3 la afecta.

### MENOR-3 — sin test contra el camino feliz del binario real de Codex (heredado de las rondas 1 y 2, sin cambios en este diff)

- Donde: `test/commands/codex-review.test.ts` (todo el fichero).
- Que pasa: sigue sin cubrirse, riesgo ya aceptado en el plan por falta de
  cuenta/modelo compatible en esta maquina. Sin cambios respecto a las
  rondas anteriores.

## Otras comprobaciones de esta ronda

- **Radio del diff desde la ronda 2**: confirmado con `git diff
  546e1d4..f9ea523 -- src test` (vacio) que el commit posterior a la
  correccion solo anade la peticion de esta ronda; el codigo revisado es
  identico al que cita `peticion-revision-3.md`.
- No repeti las mutaciones 1 y 2 de la ronda 1 (degradar con exit≠0, bypass
  de `revisionPrimariaAprobadaDe`) ni el ejercicio de punta a punta con
  `taskctl codex-review` sobre un repo temporal con una tarea real: el diff
  de esta ronda no toca esas rutas y ambas rondas anteriores ya las
  certificaron con reproduccion real.
- No encontre ningun otro hallazgo nuevo revisando con ojos frescos el resto
  de `cmdQuoteWindows` y su unico punto de uso: es una funcion pura, de once
  lineas, sin estado ni recursos que liberar, y el unico llamador
  (`runCodexReview`) ya estaba cubierto por las rondas anteriores.

## Resumen del veredicto

Ambas correcciones que arrastraba esta tarea desde las rondas 1 y 2 se
sostienen bajo reproduccion propia e independiente: `runCodexReview` sigue
lanzando el binario real (`lanzado: true`, sin `ENOENT`) y `cmdQuoteWindows`
ya no filtra el valor real de una variable de entorno cuando el titulo de una
tarea tiene la forma `%NOMBRE_DE_VARIABLE%` — verificado con tres nombres de
variable distintos y contraprobado revirtiendo el cambio (el test nuevo se
pone rojo tal como predice la peticion).

El unico hallazgo nuevo de esta ronda (MENOR-1, la perdida silenciosa de un
`%` literal legitimo en el titulo que ve Codex) es un efecto secundario real
del arreglo, pero acotado a un argumento informativo de una llamada externa
best-effort, sin impacto en datos persistentes ni en el estado de la tarea —
y es, a mi juicio, la eleccion correcta frente a la alternativa (una fuga de
datos). Documentado, no bloqueante. Los dos MENOR heredados de rondas
anteriores siguen sin cambios y siguen siendo decisiones conscientes, no
descuidos.

Con la puerta determinista superada (868/865/3 rojos conocidos, build y lint
limpios) y solo hallazgos MENOR documentados, el veredicto es **aprobada con
menores documentados**.
