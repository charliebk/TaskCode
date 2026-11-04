# Brainstorm — TASK-071, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura (subagente de Claude Code)

## Enfoque propuesto, con rutas y nombres concretos

- El hook es un entrypoint compilado, `src/hooks/stop-verificacion.ts` →
  `dist/src/hooks/stop-verificacion.js`, no un `.mjs` autonomo. Como `dist/src` va
  versionado (README «Como se distribuye»), sigue habiendo cero dependencias de runtime y
  se reutiliza el unico parser de config (`resolverConfig`). Un `.mjs` suelto obligaria a
  un segundo parser de YAML.
- En `hooks/hooks.json` el Stop pasa a `"command":"node","args":["${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/stop-verificacion.js"]`,
  la misma forma exec que valido TASK-069 (H2 y H3). La sonda sale del Stop; su `.mjs`
  queda solo para el PreToolUse hasta TASK-072.
- Pieza comun para TASK-071 y TASK-072:
  `src/fs/verificacion.ts#ejecutarVerificacion(cwd, config, {timeoutMs?})` →
  `ResultadoVerificacion`. El hook la usa ahora y `finish` en TASK-072.
- Guards del mas barato al mas caro en `decidirStop(entrada, deps) → {codigo:0|2, stderr?}`:
  1. `stop_hook_active===true` → 0, sin I/O.
  2. `resolverConfigConAvisos(entrada.cwd)` con `comando_verificacion===null` → 0 (un
     `readFile`, sin spawn; esta variante no mete avisos de config en el stderr).
  3. `listTareasEnEstados(raiz/tareas, ['en-curso'])` sin tareas → 0 (`readdir`).
  4. `currentBranch(raiz)` (`fs/git.ts`) que no coincide con ninguna `task.rama` → 0: el
     unico spawn de git, solo si hay tareas en curso.
  5. Ejecutar y formatear: verde → 0; roja o cortada → exit 2 con el texto por stderr.
- El repo sale del campo `cwd` del stdin (spike, linea 25), no de `process.cwd()`; la raiz
  de tareas es `raizDelRepo(cwd)/tareas`, misma convencion que `cli.ts`.
- No hace falta tocar `config.ts` (TASK-070 ya dejo las claves) ni leer ramas con
  `git show` como `siguiente.ts`: en Stop se esta en la rama de la tarea y el working tree
  es la fuente.

## Que se extiende y que se crea

- Se crea `src/fs/ejecucion-acotada.ts` sacando `lanzarEnvoltorio`, `ENVOLTORIO`,
  `MARCA_TIMEOUT` y `describirFallo` de `src/fs/sincronizacion.ts` (lineas 281-416);
  `sincronizacion.ts` los importa sin cambiar de comportamiento. Firma:
  `ejecutarAcotado(raiz, comando, timeoutMs, {unirSalida?, bytesCola?}) → {status, signal, error?, cortado, duracionMs, cola, bytesTotales}`.
  Necesita dos cosas que hoy no existen:
  - **Salida unida**: un solo fd para stdout y stderr, para que la cola salga intercalada.
  - **Leer solo la cola**: los ultimos N bytes con `fs.readSync` y posicion, no un
    `readFileSync` entero. La marca de timeout sigue siendo lo ultimo que se escribe, asi
    que la deteccion por `endsWith` se mantiene.
- Se crea `src/fs/verificacion.ts` (`resolverConfig` + `raizDelRepo` + `ejecutarAcotado`):
  `{estado:'no-configurada'|'verde'|'roja'|'cortada'|'no-lanzable', comando, codigo, duracionMs, cola, truncada}`.
- Se crea `src/core/informe-verificacion.ts`, funcion pura
  `formatearVerificacionRoja(r, limiteBytes=4096): string`, compartida por el hook y
  `finish`: comando; codigo o «cortada a los N s»; duracion en segundos; cola recortada a
  4 KiB y ~40 lineas sin partir UTF-8, con «(truncada: N bytes en total)».
- Se crea `src/hooks/stop-verificacion.ts`: `decidirStop` con dependencias inyectables y
  un `main` que lee el JSON de stdin y llama a `process.exit`.

## Limites que cruza

- **Contrato con Claude Code**: stdin JSON con `cwd`, `hook_event_name`,
  `stop_hook_active`. Exit 0 deja parar; exit 2 bloquea y el stderr llega al agente; exit 1
  no bloquea (spike, linea 28). Un timeout en Stop no bloquea y `onFailure` no tiene efecto
  en Stop (spike, linea 29).
- **Techo fijo de `hooks.json`**: el `timeout` es estatico (la sonda pone 30 s) y
  `timeout_verificacion` vale 600. Con 30 s Claude Code mataria el hook antes de terminar.
  Declarar un techo alto (recomienda 3600) y usar `min(timeout_verificacion, techo − margen)`,
  avisando en el texto cuando recorta.
- **`dist/src` y CI**: el hook depende de `dist/src`; el guard de CI que compara `dist` con
  lo commiteado lo cubre, y cada cambio en `src/hooks` obliga a recompilar en el mismo commit.
- **Texto neutro**: lo instalado en otros proyectos no puede nombrar el producto: el stderr
  del hook y el `description` de `hooks.json`, que hoy dice «TaskCode (TASK-069)…»
  (`DIRS_DE_COMPONENTES` en `test/skills/task-workflow.test.ts` incluye `hooks`).
- **Frontera con TASK-072**: `ejecutarVerificacion` y `formatearVerificacionRoja` son
  publicas; la politica de cada consumidor (bloquear el turno o abortar `finish`) queda en cada uno.

## La decision de diseño que mas te preocupa (UNA sola)

**El coste por turno.** Con una tarea en curso, cada fin de turno lanza la verificacion
entera, aunque el turno fuera responder una pregunta sin tocar nada: en este repo ~10 min de
`npm test` por turno. `stop_hook_active` solo corta el bucle dentro de una cadena de Stop,
no entre turnos.

Recomendacion: **memo por huella del arbol** (HEAD + `git status --porcelain -z` + hash de
los ficheros sucios: es `fotoDelArbol`, que se extraeria con el envoltorio). Un verde con la
misma huella sale 0 sin ejecutar; un rojo con la misma huella repite el informe guardado. El
estado se guarda en `.git/` (via `git rev-parse --git-path`), nunca en el workspace, para no
ensuciar el guard de §8.3. Queda abierto para el unificador.

### Alternativas descartadas

- `.mjs` autonomo en `hooks/`: duplicaria parser de config, busqueda de tareas y envoltorio
  con kill del arbol; deriva segura frente a `finish` en TASK-072.
- Hook que llama a `bin/taskctl verificar`: un proceso mas y el arranque del CLI en cada
  Stop, incluso en los casos «0 sin coste», y un comando publico que nadie ha pedido.

### Desacuerdos previstos

- Con riesgos, sobre la config rota: `decidirStop` siempre devuelve 0 o 2 y nunca lanza;
  que hacer con una config invalida es politica de riesgos/dominio.
- Con riesgos, sobre el memo de rojos: puede ocultar intermitentes. Memorizar solo verdes si
  lo piden; el de verdes no se negocia por coste.

### Suposiciones no verificadas

- Que el test de «no mencionar el producto» recorra `hooks/` y el stderr del hook.
- Que Claude Code no ponga un tope al `timeout` de un Stop por debajo de 3600 s.
- Que `tsconfig` deje `src/hooks/x.ts` en `dist/src/hooks/x.js` (deducido de `dist/src/cli.js`).
- Que en un fin de turno de subagente el `cwd` del stdin sea el del repo (H6 lo vio en PreToolUse).
- Que mover el envoltorio no cambie la sincronizacion (lo diria `test/fs/sincronizacion*`).
