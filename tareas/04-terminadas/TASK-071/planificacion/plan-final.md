# Plan — TASK-071: Hook Stop: una tarea no se da por hecha con la verificacion en rojo

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

- Se crea `src/hooks/stop-verificacion.ts` → `dist/src/hooks/stop-verificacion.js` (arquitectura): `decidirStop(entrada, deps)` devuelve siempre 0 o 2; `main` con try/catch de nivel superior que nunca sale con 1 por accidente (arquitectura y riesgos).
- Se extrae el ENVOLTORIO de `src/fs/sincronizacion.ts` a `src/fs/ejecucion-acotada.ts` (mata el árbol, salida unida a fichero, lee solo la cola) y encima `src/fs/verificacion.ts` y `src/core/informe-verificacion.ts` (cola 4 KiB / ~40 líneas), compartidos con TASK-072 (arquitectura; riesgos pide ese mismo envoltorio por los huérfanos).
- Orden: extracción sin cambio de comportamiento → verificación e informe → hook → `hooks.json` con techo alto y `min(timeout_verificacion, techo − margen)` avisando al recortar ((a): coinciden los dos roles; arquitectura propone 3600, a falta de la cifra oficial que anota quien orquesta) → CHANGELOG.
- (f) La sonda sale del Stop y su `.mjs` queda solo para PreToolUse hasta TASK-072 (arquitectura); se adaptan `hooks/test/sonda-hooks.test.sh` y los steps H1/H2/H2b del CI, y MEN-5/MEN-6 se cierran o se vuelven a aceptar en el Resultado (riesgos). (h) Aviso en el CHANGELOG (riesgos; arquitectura no lo trata).

## Desacuerdos entre roles, y como se resuelven

- Rama que no casa con ninguna tarea — arquitectura: el guard 4 sale 0 / riesgos: HEAD desacoplado, worktree, tarea sin `rama:` o varias en curso con `limite_wip > 1` dan 0, y eso es fallo abierto — gana arquitectura — el criterio 2 dice literalmente «en la rama actual… en cualquier otro caso sale 0»; el fallo abierto de riesgos pasa a riesgo aceptado.
- Primer proceso lanzado — arquitectura: config (`readFile`) → `readdir` → `git` solo si hay tareas en curso, partiendo de `raizDelRepo(cwd)` / riesgos: subir desde `cwd` con `stat` sin lanzar procesos hasta encontrar `tareas/02-en-curso/` o `.taskcode/`; ENOENT → 0 en silencio — gana riesgos como restricción — el criterio 2 pide «sin coste» en todo proyecto con el plugin; si `raizDelRepo` lanza git (ningún rol lo comprobó), ese paso no puede ir primero.
- Memo por huella (b) — arquitectura: memo de verdes innegociable y también de rojos, guardado en `.git/` / riesgos: no trata el memo; arquitectura le atribuye por adelantado la objeción de que memorizar rojos oculta los intermitentes — recomendación: verdes y rojos — dato de riesgos: en este repo `npm test` sale rojo siempre en Windows, así que memorizar solo verdes no ahorra aquí ninguno de los ~10 min por turno; el desacuerdo es previsto, no expresado, y lo resuelve quien orquesta.
- Interruptor por entorno (g) — riesgos: variable de entorno «como `TASKCODE_SONDA_MODO`» / arquitectura: nada de lo instalado puede nombrar el producto (`DIRS_DE_COMPONENTES` incluye `hooks`) — recomendación: añadir el interruptor con nombre neutro — riesgos trae la única vía de apagado sin tocar la config; el nombre con el producto choca con una restricción que tiene test.

## Riesgos aceptados y que los contiene

- (d) `stop_hook_active` convierte el freno en un aviso de un solo disparo: el objetivo «no puede terminar mientras falle» no se cumple tal como está escrito — riesgos — lo exige el criterio 4; se deja escrito en el Resultado; ignorar el flag da un bucle infinito con un test flaky (riesgos).
- (e) La propia verificación ensucia el workspace (`dist/**` versionado, cobertura, snapshots) y el siguiente `review`/`finish` aborta por §8.3 — riesgos — foto de `git status --porcelain` antes y después y aviso por stderr de lo cambiado, sin restaurar nada (riesgos); la misma foto sirve a la huella del memo (arquitectura).
- Un rojo conocido (3 de Windows, EBUSY) bloquea cada turno y el agente persigue fantasmas o «arregla» el rojo borrando tests — riesgos — el stderr dice explícitamente que no se toquen tests para pasar el freno; excluir rojos conocidos queda fuera (dominio no lanzado).
- Fallo abierto con rama sin resolver (desacuerdo 1) — riesgos — se cumple el criterio 2 al pie de la letra y se documenta.
- Cola con mojibake OEM, secuencias ANSI partidas o credenciales que acaban en el transcript — riesgos — cola acotada en origen y sin partir UTF-8 (arquitectura); ANSI, OEM y credenciales no los contiene nadie.
- Dos sesiones en la misma rama compilando sobre el mismo `dist/`, y suite viva sin dueño tras Esc — riesgos — envoltorio con kill del árbol; lo de Esc descansa en una suposición sin verificar.

## Plan de pruebas

- Verde deja parar, rojo bloquea con exit 2, sin tarea no hace nada, timeout — repo Git temporal real con un `comando_verificacion` de prueba — enunciado (criterio 5); no lo pidió ningún rol.
- El stderr del rojo trae comando, código, duración y cola acotada con «(truncada: N bytes en total)» — salida real grande y multibyte — criterio 3 y arquitectura.
- `stop_hook_active: true` sale 0 sin I/O; sin `comando_verificacion` sale 0 sin lanzar procesos — repo temporal real — criterios 2 y 4, arquitectura y riesgos.
- El techo recorta `timeout_verificacion` y lo avisa; el corte mata el árbol y no deja huérfanos — comando real que excede el corte — riesgos.
- La extracción del envoltorio no cambia la sincronización — `test/fs/sincronizacion*` existentes — arquitectura.
- Ni `hooks.json` ni el stderr del hook nombran el producto — test de neutralidad sobre `hooks/` — arquitectura.

## Lo que no se cubrio

- Testing: ningún rol diseñó pruebas; el criterio 5 sale del enunciado y queda sin decidir cómo se provoca el timeout y si se prueba `decidirStop` con deps inyectadas (arquitectura) o el `main` real con stdin — lo decide quien implemente, siempre contra repo real.
- Dominio: config inválida, exclusión de rojos conocidos, WIP > 1 y tareas antiguas sin `rama:` — los dos roles lo delegan al dominio; va a decisión pendiente o a riesgo aceptado.
- Complejidad: declarada media, heurística simple (3 puntos); la petición lo señala, y el alcance que proponen los roles (4 módulos nuevos más memo) no es el de una tarea simple — se deja anotado, no se recalcula aquí.

## Salidas que faltaron

- testing — no se lanzó (2 roles por el cálculo de complejidad) — diseño de pruebas, forma de provocar el timeout, casos de borde.
- dominio — no se lanzó — reglas del método: config inválida, rojos conocidos, WIP > 1.
- arquitectura y riesgos llegaron completas.

## Suposiciones no verificadas

- Timeout por defecto (riesgos cree 600 s) y máximo de un hook command, y que no haya tope por debajo de 3600 s (arquitectura) — documentación oficial; lo anota quien orquesta.
- Si al vencer el timeout Claude Code mata el árbol o solo `node` — riesgos — medirlo con la sonda.
- Si Esc dispara Stop, si los subagentes disparan Stop o solo SubagentStop, y si el `cwd` del stdin es el del repo en un subagente — riesgos y arquitectura — documentación y sonda.
- Que importar `dist/` desde el plugin instalado no rompa «sin dependencias de runtime» — riesgos (arquitectura lo da por resuelto porque `dist/src` va versionado) — un plugin instalado real.
- Que `tsconfig` emita `src/hooks/x.ts` en `dist/src/hooks/x.js` y que el test de neutralidad recorra `hooks/` y el stderr — arquitectura — `tsconfig.json` y `test/skills/task-workflow.test.ts`.

## Lo que necesita decision de una persona

- Que `comando_verificacion`, hoy solo leído por `doctor`, pase a ejecutarse en cada Stop de todo proyecto con el plugin (riesgos: el opt-in se vuelve efecto activo y es punto sin retorno si la suite toca BD, red o ficheros) — cambio visible para todos los proyectos; el CHANGELOG lo avisa pero no lo decide. NECESITA PERSONA.
- (c) Config inválida: recomendado bloquear (exit 2) con el error en stderr, coherente con el fallo cerrado en valores de `config.ts:58` (riesgos) y acotado a un disparo por `stop_hook_active`; alternativa: dejar parar con aviso — ningún rol lo decidió (ambos lo delegan al dominio, no lanzado) y cambia lo que ve cualquier proyecto. NECESITA PERSONA.
- (b) memo de rojos y (g) nombre del interruptor — los resuelve quien orquesta con las recomendaciones de arriba; no cambian una regla del método.
- Aprobación del plan entero con `taskctl approve` — este rol no aprueba nada, y nada de este plan autoriza implementar sin ese paso.

### Decisiones tomadas (2026-11-04)

Preguntadas a Carlos en la fase de plan:

- **Activacion: con la clave basta.** Declarar `comando_verificacion` activa el freno; aviso
  explicito en el CHANGELOG y un interruptor de emergencia por variable de entorno.
- **(c) Config invalida: bloquear una vez.** exit 2 con el error de config en stderr;
  `stop_hook_active` lo limita a un disparo.
- **(b) Memo: verdes y rojos**, por huella del arbol (HEAD + `git status --porcelain -z` +
  hash de los sucios), guardado bajo `.git/` (`git rev-parse --git-path`), nunca en el
  workspace. Misma huella: verde → 0 sin ejecutar; rojo → repite el informe guardado. Se
  acepta que un rojo intermitente no se reintenta hasta que cambie algo; el stderr lo dice.

Resueltas por quien orquesta (no cambian una regla del metodo):

- **(g) Interruptor**: variable de entorno de nombre neutro `FRENO_VERIFICACION=0` → el hook
  sale 0 sin hacer nada. Nada instalado nombra el producto.
- **(a) Techo**: `timeout` 3600 en `hooks.json`; el hook usa
  `min(timeout_verificacion, 3600 − 60)` y avisa en stderr si recorta.
- **Desacuerdo 2 (primer proceso)**: gana riesgos. Antes de lanzar ningun proceso, se sube
  desde `cwd` con `stat` buscando `tareas/02-en-curso/`; si no esta, 0 en silencio. Solo
  despues config, tareas y git.
- **(f) Sonda**: sale del Stop y se queda en el PreToolUse; MEN-5 y MEN-6 de TASK-069 son
  limites de la sonda y de la regex del merge guard, asi que se reaceptan por escrito para
  TASK-072, que sustituye ese PreToolUse.
- **Mensaje del rojo**: incluye «no borres ni saltes tests para pasar este freno».

### Datos de la documentacion oficial (code.claude.com/docs/en/hooks, consultada 2026-11-04)

- `timeout` va en segundos; por defecto 600 para hooks `command`. No consta un maximo: el
  techo de 3600 queda como suposicion y se comprueba empiricamente si es posible.
- Al vencer, Claude Code cancela el hook y descarta su salida (sin decision): el freno falla
  abierto, de ahi el techo propio. No consta si mata el arbol: el envoltorio lo mata el.
- Stop no se dispara si el turno lo corta la persona (Esc). Los subagentes disparan
  `SubagentStop`, no `Stop`: este hook no frena subagentes.
- stdin de Stop: campos comunes (`session_id`, `transcript_path`, `cwd`, `hook_event_name`…)
  mas `stop_hook_active`, `last_assistant_message`, `background_tasks`, `session_crons`.
- Tope de 8 continuaciones consecutivas por Stop (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`).
- Forma exec (`command` + `args`) y `${CLAUDE_PLUGIN_ROOT}` documentadas para hooks de plugin;
  no se debe guardar estado bajo `${CLAUDE_PLUGIN_ROOT}` (cambia al actualizar): otra razon
  para el memo en `.git/`.
