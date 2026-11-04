# Brainstorm — TASK-071, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: brainstorm-riesgos (subagente de Claude Code)

Marcas: [V] verificado leyendo el repo; [S] suposicion.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **El hook muere por su timeout antes que la verificacion y el freno no frena.**
  `hooks.json` lleva un `timeout` fijo (la sonda usa 30 [V]); `timeout_verificacion`
  vale 600 por defecto y es por proyecto [V, config.ts:197], asi que puede ser mayor
  que el del hook. Si Claude Code mata el hook, en Stop es un error no bloqueante
  (`onFailure` no tiene efecto en Stop [V, TASK-069-resultado.md:29]): el agente para
  con la verificacion en rojo y nadie se entera. Mitigacion: el hook acota su propio
  corte a lo que le deja el `timeout` de `hooks.json` menos un margen, y avisa cuando
  la config pide mas.
- **Procesos huerfanos tras un corte en Windows.** Claude Code mata `node` (el hook),
  no el arbol que cuelga de el [S]: `npm test` sigue vivo escribiendo `dist/` y repos
  temporales mientras el agente edita (EBUSY, arbol sucio). Mitigacion: lanzar con el
  ENVOLTORIO de `src/fs/sincronizacion.ts:310-329` (`taskkill /T /F`, grupo POSIX
  `detached`) y salida a ficheros, no a tuberias: ahi ya se midio un cuelgue de 30 min
  [V, :340-346].
- **Un rojo conocido bloquea siempre.** En este repo `npm test` sale distinto de 0
  siempre en Windows (3 rojos conocidos, EBUSY de teardown, los 6 rojos del cierre de
  TASK-069 [V, tarea.md:49-52]). Cada fin de turno cuesta ~10 min de suite, y el agente
  persigue fantasmas o, peor, «arregla» el rojo borrando o saltandose tests.
  Mitigacion: el stderr dice explicitamente que no se toquen tests para pasar el freno.
  Excluir rojos conocidos es del dominio.
- **`stop_hook_active` convierte el freno en un aviso de un solo disparo.** Tras el
  primer exit 2 el siguiente Stop llega con `true` [V, H5] y el hook tiene que salir 0:
  el agente puede parar con el rojo intacto tras un solo reintento; «no puede terminar
  mientras falle» no se cumple tal como esta escrito. Mitigacion: aceptarlo por escrito
  en el Resultado. Ignorar el flag lleva a un bucle infinito con un test flaky.
- **La propia verificacion ensucia el workspace.** `npm test` compila y `dist/**` esta
  versionado [V]; otros proyectos generan cobertura o snapshots. El arbol queda sucio y
  el siguiente `taskctl review`/`finish` aborta por el guard de §8.3. Mitigacion: foto de
  `git status --porcelain` antes y despues, y aviso por stderr de lo cambiado. No
  restaurar nada: no es nuestro.
- **Fallo abierto silencioso por excepcion.** Config con valor invalido (fallo cerrado en
  valores [V, config.ts:58]), bug del hook o falta `dist/`: exit 1, no bloqueante
  [V, spike:28], y el agente para sin freno. Mitigacion: try/catch de nivel superior con
  politica explicita (abierto o cerrado, la decide el dominio) y siempre un mensaje en
  stderr. Nunca un exit 1 por accidente.
- **Coste en sesiones ajenas.** El hook corre en todo Stop de todo proyecto con el plugin.
  Si lanza `git` antes de saber si hace falta, alarga cada fin de turno y mete ruido
  (ENOENT, no es repo, subdirectorio). Mitigacion: subir directorios desde `cwd` con
  `stat` buscando `tareas/02-en-curso/` o `.taskcode/`, sin lanzar procesos hasta
  encontrarlos. Cualquier ENOENT: salir 0 sin escribir nada.

## Estados intermedios y fallos parciales

- **Esc o cierre durante una verificacion de 10 min:** la suite queda viva sin dueno [S]
  y deja repos temporales en `%TEMP%` y `dist/` a medio compilar.
- **Dos sesiones o agentes en la misma rama** (la practica de la memoria): dos `npm test`
  compilan sobre el mismo `dist/`: rojos cruzados y EBUSY. Repetir no es seguro.
- **Rama sin resolver:** HEAD desacoplado (rebase, bisect), worktree (`.git` es fichero)
  o varias tareas en `02-en-curso` con `limite_wip > 1`: la rama no casa con ninguna
  tarea y hoy eso da salida 0 (fallo abierto). Una tarea antigua sin `rama:`, igual.
- **Salida:** cmd.exe con programas en pagina OEM (CP850/CP1252) da mojibake al decodificar
  como UTF-8; cortar la cola por bytes parte multibyte y secuencias ANSI; una salida
  binaria o de cientos de MB revienta la memoria si no se acota en origen; la cola puede
  llevar tokens o URLs con credenciales, y acaba en el transcript.

## Compatibilidad hacia atras

- Los proyectos que ya declararon `comando_verificacion` tras TASK-070 (hoy solo lo lee
  `doctor` [V, doctor.ts:397-405]) pasan sin aviso a ejecutarlo en cada Stop al
  actualizar: el opt-in se vuelve efecto activo. Avisarlo en el CHANGELOG.
- Sustituir la sonda rompe `hooks/test/sonda-hooks.test.sh` y los steps H1/H2/H2b del CI
  [V, tarea.md:40-41], y deja colgados MEN-5 y MEN-6, que hay que cerrar o reaceptar.
- Se sale de un `hooks.json` con un unico `timeout`, sin rastro de la config del proyecto.

## Vuelta atras

- Codigo reversible: version sin el Stop. Mientras, la persona lo desactiva quitando
  `comando_verificacion` o desde `/hooks` (o `disableAllHooks`) [S]. Propone ademas un
  interruptor por variable de entorno, como `TASKCODE_SONDA_MODO`.
- Punto sin retorno: el comando del usuario se ejecuta sin que nadie lo pida en cada Stop;
  si sus tests tienen efectos fuera del repo (BD, red, ficheros), no se deshacen.

## El riesgo que mas te preocupa (UNO solo)

El desajuste entre el `timeout` estatico de `hooks.json` y `timeout_verificacion`: el freno
falla abierto justo en los proyectos de suite larga, como este (~10 min frente a 600 s), y
deja el arbol de `npm test` huerfano. Es silencioso y es el escenario por defecto, no un borde.

### Suposiciones no verificadas

- Timeout por defecto de un hook command (cree que 600 s) y si al vencer mata el arbol o
  solo `node`: comprobar en code.claude.com/docs/en/hooks y medirlo con la sonda.
- Si Stop se dispara al pulsar Esc, y si los subagentes disparan Stop o solo SubagentStop.
- Si el hook puede importar `dist/core/config.js` del plugin instalado sin romper la regla
  «sin dependencias».
- Que el hook lee `rama:` del frontmatter y la compara con la rama de `git` (no vio el
  enfoque de arquitectura).
