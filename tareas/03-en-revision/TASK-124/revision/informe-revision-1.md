# Informe de revision — TASK-124 (ronda 1)

- Commit revisado: edf10933a5b50366574199266eabc7a594f20e45
- Revisor: code-quality-reviewer
- Veredicto: aprobada-con-correcciones (solo MENORES; ninguno bloquea el cierre. Para `taskctl veredicto`: aprobada-con-correcciones)

Pase generico (el diff cae en docs, tests y CLI sin revisor de dominio). Modo rapido:
una sola ronda y solo los tests afectados, no la suite completa.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/config.ts (`validarDocumentoEstado`, ~l. 865-881) | implementacion |
| MEN-2 | MENOR | abierto | test/commands/doctor-documento-estado.test.ts:47 | implementacion |
| MEN-3 | MENOR | abierto | src/commands/doctor.ts:717, src/fs/status-line.ts:187, skills/task-workflow/avance.md:141 | plan |
| MEN-4 | MENOR | abierto | docs/contexto/CHECKLIST_TERMINACION.md (fase P) | implementacion |

Sin hallazgos CRITICOS ni IMPORTANTES.

## Reproduccion

Entorno: clon de la rama en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-124-r1` (commit
edf1093), `npm install` + `npm run build`. Windows nativo, Git Bash.

### Puerta (tests afectados)

`node --test dist/test/skills/tamanos.test.js dist/test/empaquetado/readme.test.js
dist/test/empaquetado/distribucion.test.js dist/test/commands/doctor-hooks-subagente.test.js
dist/test/commands/doctor-documento-estado.test.js dist/test/core/documento-estado.test.js
dist/test/core/config-documento-estado.test.js dist/test/commands/doctor.test.js`
-> tests 122, pass 122, fail 0.

### Tamanos (`wc -c`, con CRLF de Windows)

- CHECKLIST_TERMINACION.md 12 745 B (< 20 480). ESTADO.md 6 528 B (< 10 240).
- README del plugin 17 006 B (< 40 960); antes 106 KB. CLAUDE.md 5 852 B.
- docs/ del plugin: 22 101 + 21 618 + 31 336 + 21 568 + 3 759 B.

### Sin perdida de contenido

Lineas no vacias unicas de la version de la base comun (32157681) frente a la union de lo nuevo:

- README: 1 linea sin equivalente exacto, `  siguiente sección).`, un reajuste de salto de linea en un enlace.
- CHECKLIST (vivo + `archivo/CHECKLIST-fases-cerradas.md`): 2 lineas, la cabecera `Progreso global` y el titulo de la fase P. Son los contadores actualizados a proposito.
- ESTADO (vivo + `archivo/ESTADO-hasta-2026-11-12.md`): 0 lineas.

Contadores del checklist: la suma de la tabla da 121 items y 120 hechos, igual que la cabecera. En la fase P hay 19 `[x]` y 1 `[ ]`, igual que su `(19/20)`. En develop esa cabecera decia `14/19` con 19 casillas marcadas, es decir, estaba desfasada. La correccion es acertada.

### Contrapruebas del README (sobre el clon)

- Enlace a fichero roto en el README (`docs/configuracionX.md`): fallan el test de enlaces y el de «Problemas conocidos». Bien.
- Ancla inexistente (`...md#anclainexistente`): falla el test de enlaces. Bien.
- Enlace roto dentro de `docs/comandos.md`: falla. Bien.
- Encabezado `## Problemas conocidos` borrado de `docs/problemas-conocidos.md`: fallan el test de enlaces y el de encabezados. Bien.
- README de +30 KB: falla el test de tamano. Bien.

### Contrapruebas de topes (`tamanos.test`)

- `skills/board/SKILL.md` +4 000 B: falla con fichero, bytes, tope y consejo.
- `agents/nuevo.md` y `skills/new/extra.md` sin entrada: fallan con «sin tope en la tabla».
- `ESTADO.md` +12 000 B: falla (18 528 B > 10 240).

### `taskctl doctor` con `documento_estado` raros (repo temporal, `bin/taskctl doctor`)

- `docs/ESTADO.md` con commit de 2026-10-01: aviso «42 dias... se toleran 14». Con tareas terminadas posteriores añade «va por detras de N tareas...; la mas reciente, X». Ordena bien con 3 y 4 tareas, con id con letra (`TASK-121a`), con `actualizado` con hora y con fecha futura.
- Ruta inexistente: aviso con arreglo. Fichero sin commits: aviso. Repo sin commits: aviso.
- `../fuera.md`, `/abs/x.md`, `""`, vacia, `.git/config`, `tareas/x/y.md`, lista `[a, b]`: la config aborta con mensaje claro y la comprobacion sale `omitida (ver config)`.
- `docs\ESTADO.md` y `docs/../docs/ESTADO.md`: se normalizan bien.
- Sin la clave: `omitida`. Con commit de hoy: `ok`. En este repo, `doctor` da `[ok] documento-estado ... al dia`.

### Mutaciones sobre `dist/` (descartadas al terminar)

- `dias >` a `>=`: caen 2 tests. `d > dia` a `>=`: caen 2. Tope 14 a 30: caen 3. La red cubre los bordes.
- `%cI` a `%aI` en el `git log` de doctor.js:487: **siguen 7/7 en verde** (MEN-2).

### MEN-1 — `documento_estado` acepta una carpeta
`documento_estado: docs` pasa la validacion y `doctor` dice «docs lleva 42 dias sin actualizarse», porque `git log -1 -- docs` funciona sobre una carpeta. El comentario de `validarDocumentoEstado` dice «no carpeta», pero `motivoRutaInvalida` solo valida sintaxis y la carpeta no se rechaza ni en config ni en doctor. Efecto: una config equivocada da un aviso confuso en vez de un error o un aviso de «no es un fichero». Correccion propuesta: en `comprobarDocumentoEstado`, si la ruta existe y es un directorio, devolver `aviso` «es una carpeta, no un fichero». Si no, corregir el comentario.

### MEN-2 — Ningun test discrimina fecha de committer (`%cI`) y de autor
La decision del plan es la fecha del commit (committer), y el comentario de doctor.ts:477 la justifica. Pero los tests fijan `GIT_COMMITTER_DATE` y `GIT_AUTHOR_DATE` al mismo valor (test l. 47), asi que cambiar a `%aI` no rompe nada (reproducido). Un `rebase` o `cherry-pick` conserva la fecha de autor y renueva la de committer. Correccion propuesta: un caso con fechas distintas (autor 20 dias atras, committer hoy) que fije cual manda.

### MEN-3 — Mensajes y skills que dicen «README del plugin» ahora apuntan a un indice
`doctor.ts:717` («Ver "Problemas conocidos" en el README del plugin»), `status-line.ts:187` («Usar taskctl fuera de Claude Code ... en el README del plugin») y `avance.md:141` («Problemas conocidos del README del plugin») se escribieron cuando esas secciones estaban en el README. Ahora el README solo enlaza (l. 215 y 251-252) y el contenido esta en `docs/problemas-conocidos.md` e `instalacion-y-distribucion.md`. No es un enlace roto, porque el indice los lleva, pero hay un salto mas. El plan lo acepto («siguen valiendo»), asi que el origen es `plan`. Correccion propuesta, opcional: citar el fichero de `docs/`. Ojo con `avance.md`, que se distribuye: no puede nombrar rutas internas de TaskCode (hay tests de eso), pero `docs/problemas-conocidos.md` es del plugin, no del repo.

### MEN-4 — TASK-124 no tiene casilla en el checklist
CLAUDE.md manda, al cerrar un item, marcar su casilla y actualizar los contadores. TASK-121, 122 y 123 tienen su linea en la fase P. TASK-124 no la tiene (`grep TASK-124 CHECKLIST_TERMINACION.md` da vacio), asi que el cierre no tiene casilla que marcar. Correccion propuesta: añadirla como `[x]` y pasar los contadores a 121/122 y P 20/21 en el cierre, o decidir que no es item.

## Observaciones sin hallazgo

- La suite completa no se ha corrido (modo rapido, decision de Carlos).
- `HALLAZGOS.md` (53 KB), `INVENTARIO_PENDIENTE.md` (15 KB) y `CONVENCIONES.md` no tienen tope en `tamanos.test`. Es coherente con los criterios de aceptacion (solo CLAUDE.md, skills, revisoras, CHECKLIST y ESTADO), pero CLAUDE.md manda leer HALLAZGOS antes de empezar, asi que es el siguiente documento que crecera. Candidato a tarea futura.
- No probado: `doctor` en un checkout superficial (`--depth 1`). `git log -1 -- ruta` daria la fecha del unico commit visible y nunca avisaria. Para verificarlo habria que clonar con `--depth 1` y correr `taskctl doctor`.
- Los topes de las skills son holgados (hasta +70 % en las pequeñas, por redondear al KB). No es defecto, pero los topes de 2-4 KB dejan margen para crecer.

## Lecturas fuera del contexto permitido

- `src/fs/status-line.ts`, `skills/task-workflow/avance.md` y `package.json`, solo con grep, para MEN-3 (buscar quien dice «README del plugin»).
- `tareas/04-terminadas/` y `tareas/00-planificadas/` (nombres de directorio), para comprobar lo que dice ESTADO.md sobre TASK-121 a 130.
- `docs/contexto/HALLAZGOS.md` e `INVENTARIO_PENDIENTE.md`, solo con `wc -c`.
- `test/core/documento-estado.test.ts` y `dist/` del clon, para las mutaciones.
