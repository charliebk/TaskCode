# Brainstorm — TASK-033, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

## Riesgos, de mayor a menor dano

1. **`finish` sin reintento posible.** Si el comando de sync falla o expira DESPUES del merge y de `moveTareaFile` (finish.ts:390-441) y la semantica es "abortar antes del commit": develop queda con el merge consumado, la tarea movida a 04-terminadas sin commitear y el workspace sucio; el reintento muere en `isWorkspaceClean` (finish.ts:334) y en `assertTransitionAllowed('finish')` sobre una tarea ya `terminada`. No hay salida idempotente. **Mitigacion**: en finish (y en cualquier paso posterior a un merge) la tarea se commitea SIEMPRE; las rutas de sync solo si el comando salio bien; el fallo se avisa con exit != 0.
2. **Conflictos de merge en el fichero derivado.** sync-plan.mjs reescribe en CADA sincronizacion la linea de recuento "**N tareas** · ..." y la de "hechas/total" por fase. Con sync en commits de rama (`start`, `review`) y de develop (`approve` de otra tarea, `finish`), el merge develop→rama de `review` y rama→develop de `finish` chocan en esa linea en cuanto hay dos tareas vivas; el script de Git-Flow sale != 0 y en finish deja develop con un merge a medias. **Mitigacion**: documentar que el conflicto se resuelve regenerando, o re-sincronizar tras el merge. Es un problema nuevo que fabrica el plugin.
3. **Barrido de trabajo ajeno.** `start` no aplica guard de workspace limpio (start.ts:291); si la persona edito a mano otra seccion de `PLANIFICACION.md`, `git add -A -- PLANIFICACION.md` la mete en `chore(TASK-x): tarea en curso` (y con `--push`, publicada). Rompe la regla 1 por la puerta de atras. **Mitigacion**: abortar ANTES de lanzar la sync si alguna ruta declarada ya trae cambios respecto a HEAD.
4. **Ruta declarada como carpeta, `.`, fuera del repo o solapada con `tareas/`.** Una carpeta convierte el add acotado en barrido amplio; `.` y `../` los rechaza `normalizarRuta`, pero tarde (tarea ya movida, sync ya ejecutada). **Mitigacion**: validar en `parsearConfig` (fallo cerrado al cargar): solo ficheros, relativos, dentro del repo, nunca bajo `tareas/` ni `.taskcode/`.
5. **Comando que toca rutas no declaradas, o errata en la ruta.** `tieneAlgoQuePreparar` ignora en silencio la inexistente; el fichero real queda sucio y el SIGUIENTE comando aborta en el guard de la 8.3 — el mismo sintoma que la tarea arregla. **Mitigacion**: comparar estado antes/despues; con arbol sucio en `start`, porcelain no basta (un ` M` sigue igual): comparar contenido.
6. **Cuelgue o huerfano.** Con `stdin: 'inherit'` bajo arnes de agente o `node --test` espera para siempre (HALLAZGOS, TASK-026); con timeout, en Windows + `shell: true` matar `cmd.exe` deja vivo el `node` nieto. **Mitigacion**: `stdin: 'ignore'` siempre, timeout explicito, releer rutas tras matar.
7. **Windows y shell.** `pnpm`/`npm` son `.cmd`: sin `shell: true`, ENOENT (git.ts:370-377, TASK-020). Con `cmd.exe`, sintaxis POSIX (`FOO=1 node x`, comillas simples, `$VAR`) falla solo en Windows, y `%VAR%` se expande siempre. **Mitigacion**: documentar `node <script>` como forma portable; NO reutilizar `cmdQuoteWindows` sobre un comando escrito entero por la persona.

## Puntos sin retorno

- Merge de `finish` en develop (y el tag en hotfix/release): consumado cuando corre la sync.
- Commit automatico con `--push` que barrio trabajo ajeno: solo se corrige con un revert visible.

## Descartado a proposito

- CRLF en sync-plan.mjs: cosmetico y del proyecto.
- Dos taskctl a la vez: lo limita el WIP.
- Ruta declarada que no cambia: la regla 2 ya lo cubre.

## Desacuerdos previstos

- Arquitectura — sync tambien en `start`/`review`: fabrica conflictos en cada merge; asumir y documentar, o re-ejecutar tras el merge.
- Arquitectura/dominio — "abortar si la sync falla": inaceptable en finish (riesgo 1). Posicion: commitear siempre la tarea, no meter rutas de sync rotas, salir != 0 con aviso.
- Arquitectura — ejecutar un comando sacado del config.yml del repo: `finish` lo lee DESPUES del merge, asi que una rama que cambie `.taskcode/config.yml` ejecuta su comando en la maquina de quien cierra; viaja con el clon, a diferencia de los hooks. Decirlo en SKILL.md.

## Suposiciones no verificadas

- `parseBloqueClaveValor` corta el valor en ` #` (frontmatter.ts:183): un comando sin comillas con `#` llega truncado sin error.
- `deps.repoCwd` es la raiz del repo.
- Un plugin 0.1.0 que lea un config.yml con claves nuevas aborta TODOS sus comandos (fallo cerrado de `CLAVES_CONFIG`), `board` incluido: avisarlo en el CHANGELOG.
- La salida del script por stdout no rompe salidas parseables de taskctl.
- El hook de pre-commit de OpenGisViewer, si se deja, no reintroduce el `MM` cuando la sync ya escribio el mismo contenido (no reproducido).
