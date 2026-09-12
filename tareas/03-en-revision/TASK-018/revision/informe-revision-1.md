# Informe de revision — TASK-018 (ronda 1)

- Commit revisado: b992da83d4fa6d4186e113e28fe84d72cd28d408
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Metodologia seguida

Clon nuevo del repo (no el working tree del implementador) en `C:\t018review`,
checkout a `b992da8`, `npm install` + `npm run build` + `npm test` desde cero.
Build limpio (`tsc` sin errores). Suite: **853 tests, 850 pass, 3 fail** —
exactamente los tres conocidos de Windows documentados en `CLAUDE.md` del
repo (confirmado leyendo el detalle de cada uno, no solo el recuento):

- `not ok 118` — `EPERM: operation not permitted, symlink` (approve.test.js) — el symlink de Windows.
- `not ok 269` — `Missing expected rejection` sobre un `chmod` que en NTFS no restringe nada (plan.test.js).
- `not ok 275` — diferencia `\r\n` vs `\n` (CRLF) en plan.test.js.

Ningun otro rojo. La puerta determinista (build, sin linter configurado en
este proyecto — no hay script `lint` en `package.json` —, tests) pasa.

Ademas del clon, monte un repo Git sintetico propio (`C:\t018_cli_test`) y
ejecute el **CLI real** (`node bin/taskctl review|finish TASK-NNN`, con
`CLAUDE_PLUGIN_ROOT` apuntando al plugin) contra el catalogo de skills
**real** del repo, no contra fixtures — ver reproducciones abajo.

## Que confirme que funciona (para no reportar solo lo que falta)

- `taskctl review` real fragmenta un diff de 2 dominios (Java + Angular) en
  2 peticiones con nombre `peticion-revision-1-<dominio>.md`, cada una con
  solo el diff de sus ficheros (verificado leyendo el contenido de la
  peticion de `java-spring-reviewer`: solo trae `UserService.java`, no el
  componente Angular).
- `taskctl finish` real, sobre esa misma tarea fragmentada: rechaza con
  "revision primaria no aprobada" (a) sin ningun veredicto relleno, (b) con
  solo uno de los dos informes en "aprobada" (el otro con el placeholder
  `PENDIENTE` intacto), y (c) con un informe en blanco + el otro aprobado;
  y cierra correctamente en cuanto AMBOS informes tienen `- Veredicto:
  aprobada` como unica linea de veredicto. Ciclo completo con exit code 0.
- Mutacion 1 — cambie `informes.every(...)` por `informes.some(...)` en
  `buildTransitionContext` (finish.ts): el test
  `taskctl finish: una ronda fragmentada por dominio (N informes) exige que
  TODOS aprueben antes de cerrar (TASK-018)` se pone rojo. Correcto.
- Mutacion 2 — cambie `numDominios > umbralDominios` por `>=` en
  `clasificarPorDominio` (revisores.ts): se ponen rojos 3 tests a la vez
  (`clasificarPorDominio: EXACTAMENTE en el umbral...`, su propia
  contraprueba de mutacion, y el end-to-end
  `taskctl review: ... EXACTAMENTE 3 dominios ...` de review.test.ts).
  Correcto, y con margen (varias capas lo detectan).
- Round-tripe real de una tarea con revision fragmentada de verdad
  (TASK-910, mas abajo): `siguienteRonda` SI numera bien la ronda 2 tras
  una ronda 1 fragmentada, con el codigo real sin mutar.
- Repase `ReviewCommandResult`/consumidores: `grep` de `peticionPath` y
  `informePath` en `src/`, `test/` y `dist/` — todos los usos son
  `result.informes[i].peticionPath`/`.informePath` o el campo de la propia
  interfaz `RevisionGrupo`. Ningun consumidor quedo referenciando el
  contrato singular viejo (y `tsc` no se queja, lo que ademas lo confirma a
  nivel de tipos).

## Hallazgos

### IMPORTANTE-1 — La numeracion de ronda tras una ronda fragmentada no la protege ningun test

- Donde: `src/commands/review.ts:69` (`RONDA_FILE_RE`), consumido por
  `src/fs/rondas.ts` (`siguienteRonda`/`ultimaRonda`).
- Que pasa: el propio criterio de aceptacion pide extender
  `RONDA_FILE_RE`/`siguienteRonda` para que una ronda fragmentada (ficheros
  con sufijo de dominio) no rompa la numeracion de la ronda siguiente. La
  extension esta hecha (`(?:-[a-z0-9-]+)?` opcional en el regex) y funciona
  — lo comprobé end-to-end (ver abajo) —, pero **ningun test de la suite
  se pone rojo si esa extension se revierte**.
- Reproduccion:
  1. En el clon, sustitui la linea 69 de `src/commands/review.ts` por el
     regex anterior a esta tarea (sin el grupo opcional de sufijo):
     `const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)\.md$/;`
     (y, para aislar el efecto, tambien reverti
     `INFORME_REVISION_RE` en `finish.ts` a su forma sin sufijo).
  2. `npx tsc -p tsconfig.json` — compila limpio (ningun tipo lo detecta).
  3. `node --test dist/test/commands/review.test.js` — **16 de 16 tests
     pasan**. Ni un solo test rojo con el regex de numeracion de ronda
     revertido al esquema anterior a TASK-018.
  4. Confirme ademas, con el codigo real (sin mutar), que el comportamiento
     de hoy SI es correcto: cree TASK-910 con un fichero Java, corri
     `taskctl review` real (fragmenta en 2: `java-spring-reviewer` +
     `code-quality-reviewer` para `tarea.md`), simule a mano el ciclo
     "cambios-solicitados -> vuelta a en-curso" (`git mv` de
     `03-en-revision` a `02-en-curso`, frontmatter a `en-curso`), anadi un
     commit de correccion, y volvi a correr `taskctl review`. Resultado
     real: `ronda 2`, con
     `peticion-revision-2-java-spring-reviewer.md` y
     `peticion-revision-2-code-quality-reviewer.md` — la numeracion SI
     funciona hoy. Pero como el paso 3 demuestra, si alguien la rompe en un
     refactor futuro, la suite no lo va a avisar: ese escenario exacto
     (segunda ronda con la primera fragmentada por dominio) no existe como
     test. El unico test de "segunda ronda" que hay
     (`review.test.ts:363`, "una segunda ronda numera peticion e informe
     como -2...") usa una tarea SIN ningun fichero de dominio, asi que su
     ronda 1 nunca lleva sufijo y nunca ejercita `RONDA_FILE_RE` contra un
     nombre con sufijo.
- Impacto: un futuro cambio que rompa el reconocimiento del sufijo de
  dominio en la numeracion de rondas pasaria la suite entera en verde. La
  consecuencia en produccion seria numeros de ronda repetidos/incorrectos
  tras una ronda fragmentada (con el riesgo de colision `EEXIST` al
  reintentar, o de que `finish` lea informes de la ronda equivocada), que
  es exactamente el riesgo que el propio brainstorm de la tarea señalo y
  que el plan dice contener — pero el contenimiento no quedo con una red
  de regresion propia.
- Sugerencia: un test en `review.test.ts` (o en `rondas.ts` directamente,
  con fixtures de fichero) que deje una ronda 1 fragmentada de verdad
  (ficheros con sufijo de dominio) y verifique que una segunda llamada a
  `runReviewCommand`/`siguienteRonda` calcula `ronda === 2`, no `1`.

### IMPORTANTE-2 — El mensaje de `taskctl review` con N peticiones (cli.ts) no lo ejercita ningun test

- Donde: `src/cli.ts`, rama `if (cmd === 'review')` (construccion de
  `lineasInformes` a partir de `result.informes`).
- Que pasa: el informe de cobertura de la corrida completa de tests marca
  las lineas 424-463 de `dist/src/cli.js` (el cuerpo entero de la rama
  `review` del CLI, incluida la nueva logica de `lineasInformes`) como NO
  cubiertas. Confirme que no es ruido: `grep` de `informes`/`Peticion de
  revision` en `test/cli/main.test.ts` no da ningun resultado, y no existe
  ningun otro fichero de test bajo `test/cli/` que invoque el subcomando
  `review`. Es decir, el texto que ve la persona (o el agente orquestador)
  que tiene que lanzar los N revisores — cuantos son, con que peticion cada
  uno — no lo verifica ningun test, ni antes ni despues de esta tarea (la
  cobertura de `review.js`, el comando en si, si es alta: 96%; lo que
  falta es la capa fina de `cli.ts` que imprime el resultado).
- Reproduccion: en el clon, `npm test` con cobertura muestra
  `cli.js | 72.13 | ... | 91-92 112-113 139-140 145-146 148-149 180-183
  185-187 222-224 291-319 411-421 424-463 465-502 528-531 537-545 547-548`.
  Las lineas 424-463 son exactamente el cuerpo del `if (cmd === 'review')`
  (confirmado con `grep -n "cmd === 'review'" dist/src/cli.js`, que da la
  linea 423). Verifique tambien manualmente, con el CLI real, que el texto
  SI sale bien hoy para 1 y para 2 dominios (ver "Que confirme que
  funciona" arriba) — no es un bug en produccion, es una rama sin ninguna
  prueba automatica.
- Impacto: un cambio futuro en `cli.ts` que rompa el formato del mensaje
  (por ejemplo, que deje de listar alguna peticion, o que confunda
  `informePath` con `peticionPath` en la plantilla del mensaje) pasaria
  desapercibido: ni la suite lo detecta, ni hay tipo que lo impida (son
  todo template strings).
- Sugerencia: un test en `test/cli/main.test.ts` (o un fichero nuevo
  `test/cli/review.test.ts`) que invoque `main(['review', 'TASK-NNN'])`
  contra un repo temporal con un diff multi-dominio y verifique que el
  stdout lista una linea de peticion por grupo.

### MENOR-1 — Mitigacion de renombrado entre ecosistemas, descrita en el plan, no implementada (sin consecuencia demostrable)

- Donde: `src/fs/git.ts` (`diffNameOnly`), `src/core/revisores.ts`
  (`clasificarPorDominio`).
- Que pasa: `planificacion/plan-final.md` señala como riesgo aceptado:
  "Renombrar/mover un fichero entre ecosistemas (`git mv Foo.java Foo.cs`)
  rompe la clasificacion por ruta ... se contiene clasificando por ambas
  rutas del `--name-status` y mandando al generico si discrepan." El
  codigo entregado no hace eso: `diffNameOnly` usa `git diff --name-only`
  (una sola ruta por fichero, la final) y `clasificarPorDominio` nunca ve
  la ruta antigua.
- Reproduccion: en un repo Git de prueba, cree `Bar.java` en `develop`,
  rama nueva, `git mv Bar.java Bar.cs`, commit. `git diff --name-only
  develop..HEAD` devuelve solo `src/Exporter/Bar.cs` (el rename se colapsa
  por defecto); `git diff --no-renames --name-only` confirma que sin ese
  colapso saldrian las DOS rutas. El resultado practico: el fichero se
  clasifica por su ruta FINAL (dominio C#), con el contenido completo
  visible para ese revisor (`git diff develop..HEAD -- src/Exporter/Bar.cs`
  lo muestra como fichero nuevo con el contenido integro) — no se pierde
  informacion ni se cuela sin revisar.
- Impacto: ninguno demostrado — el comportamiento resultante (revisar el
  fichero por su dominio final) es razonable y no herido; es la mitigacion
  descrita en el plan la que quedo sin implementar, sin que quede anotado
  en ningun sitio que se descarto y por que.
- Sugerencia: si se decide que el comportamiento actual es aceptable (lo
  parece), anadir una nota en `revisores.ts` o en el plan dejando constancia
  de que la mitigacion de "clasificar por ambas rutas" se evaluo y se
  descarto por innecesaria, para que el proximo lector no asuma que sigue
  pendiente.

### MENOR-2 — `peticionTemplate` crecio a 10 parametros posicionales, varios del mismo tipo

- Donde: `src/commands/review.ts`, funcion `peticionTemplate`.
- Que pasa: los tres parametros nuevos (`agenteRevisor`, `nombreInforme`,
  `alcanceDiff`) son todos `string`, igual que `baseBranch`, `commitRevisado`,
  `commits` y `diff` que ya existian: son 7 parametros `string` seguidos.
  El compilador no puede avisar de un intercambio accidental de orden en
  la unica llamada que hay (`runReviewCommand`), y los tests, aunque
  cubren el contenido resultante, no dejan tan legible como una llamada
  con objeto con propiedades nombradas lo dejaria.
- Reproduccion: lectura de codigo, no ejecutable (no encontre un caso en
  que el orden actual este mal — la unica llamada existente pasa los
  argumentos en el orden correcto y los tests lo confirman).
- Impacto: ninguno hoy; es mantenibilidad a futuro, no un fallo.
- Sugerencia: agrupar los parametros nuevos (o todos) en un objeto de
  opciones nombradas. No bloqueante — se documenta y se decide no corregir
  en esta ronda si no se considera prioritario.

## Resumen

Correccion funcional: bien. Verifique con mutaciones dirigidas (romper el
`.every()` de `finish.ts`, romper el corte inclusive/exclusivo del umbral en
`revisores.ts`) que la red de tests SI detecta esas dos roturas, y con el
CLI real (no solo funciones internas) que el ciclo completo
review-fragmentado -> informes rellenados -> finish cierra correctamente,
incluyendo los casos borde pedidos explicitamente en la peticion de
revision (informe en blanco, un informe pendiente y otro aprobado, esquema
sin fragmentar intacto). No encontre ninguna perdida de datos ni
corrupcion de estado.

Lo que si encontre, y por lo que pido cambios, es que dos piezas que la
propia tarea dice proteger — la numeracion de ronda tras fragmentar, y el
mensaje del CLI que lista los N agentes a lanzar — funcionan hoy (lo
comprobé a mano) pero no tienen ningun test que se ponga rojo si se rompen
en un refactor futuro. Dado que el criterio de aceptacion 4 pide
explicitamente extender `rondas.ts`, y que sin la numeracion correcta
"una tarea con revision fragmentada queda atascada en 03-en-revision para
siempre" (cita literal del propio criterio 4), dejar ese extremo sin una
prueba propia es el tipo de hallazgo que la skill de este dominio marca
como IMPORTANTE por definicion ("una proteccion nueva sin ningun test que
se ponga rojo al quitarla"), no un matiz de estilo.
