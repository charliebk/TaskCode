# Informe de revision — TASK-034 (ronda 1)

- Commit revisado: 9861438d2ae6546c1a816f2257eaa6fcfc3cd5b4
- Revisor: code-quality-reviewer
- Veredicto: aprobada

Sin CRITICO ni IMPORTANTE. Seis hallazgos MENOR, documentados abajo. Por la
politica de rondas A3, esta ronda cierra la tarea; los MENOR quedan para
decidir si se corrigen en una tarea aparte.

## Lo que se ejecuto

- **Clon limpio** de `feature/task-034-f1-t1-excluir-lo-generado-del-diff-de-re`
  (HEAD 19ca0a5, que solo anade la peticion sobre 9861438) en un temporal;
  `npm install && npm run build` y `npm run lint` (`tsc --noEmit`) sin errores.
- **Suite completa, una vez** (`npm test`): **898 tests, 895 pass, 3 fail**,
  0 cancelados, 543 s. Los 3 rojos son exactamente los conocidos de Windows:
  approve (#119, symlink EPERM), plan (#281, chmod de directorio) y plan
  (#287, estado distinto). Sin EBUSY. Ningun cuarto rojo.
- **Mutantes** (segundo clon, solo `dist/test/commands/review-exclusion.test.js`):
  los 6 dan rojo.

  | Mutante | Resultado |
  |---|---|
  | M1 clasificar incluidos + excluidos | 1 fail |
  | M2 quitar el anclaje `**/` de los patrones sin `/` | 1 fail |
  | M3 quitar `:(exclude,glob)` de los pathspecs | 2 fail |
  | M4 `seccionExcluidos` siempre devuelve `''` | 1 fail |
  | M5 carpeta de la tarea desde `task.estado` (origen) en vez de `updated.estado` | 1 fail |
  | M6 `stat` siempre vacio | 1 fail |

- **CLI real** (`node bin/taskctl review`), tres repos temporales, y lectura
  de las peticiones generadas:
  - `cli1`: renombres `src/x.js -> dist/x.js` y `dist/y.js -> src/y.js`,
    `src/cafe con espacio.ts` (con tilde), `pkg/sub dir/package-lock.json`,
    `` dist/raro`tick.js `` y `src/Main.java` → 2 peticiones (java + generico),
    linea `- Carpeta de la tarea: tareas/03-en-revision/TASK-930`, lockfile en
    carpeta con espacio excluido, el backtick no rompe el fence de `fenceFor`.
  - `cli2`: `excluir_de_revision: [**/dist/**, pkg/sub dir/**]` → el patron
    con espacio funciona (va por `spawnSync` con array, sin shell).
  - `cli3`: rama que solo toca `dist/a.js` (y `tarea.md`) → ver MENOR-1.
- **Compatibilidad**: `parsearConfig` del plugin instalado 0.1.1 (cache)
  con `excluir_de_revision: []` → ver MENOR-5.

Revisado a fondo: `diffParaRevision`, `validarPatronesExclusion`,
`seccionExcluidos` y el cableado en `runReviewCommand`. Los cambios de
expectativa de `review.test.ts` y `cli/main.test.ts` se comprobaron: siguen
aseverando lo mismo (dominios y umbral) y solo retiran el grupo generico de
`tarea.md`, que es el efecto buscado y esta explicado en cada test.

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MENOR-1 | MENOR | abierto (no bloquea) | src/commands/review.ts (`peticionTemplate`) |
| MENOR-2 | MENOR | abierto (no bloquea) | src/fs/git.ts (`diffParaRevision`) |
| MENOR-3 | MENOR | abierto (no bloquea) | src/fs/git.ts / src/commands/review.ts (`--stat`) |
| MENOR-4 | MENOR | abierto, no verificado en cmd.exe | src/commands/review.ts (`seccionExcluidos`) |
| MENOR-5 | MENOR | abierto, a documentar | src/core/config.ts, skills/task-workflow/SKILL.md, plugin.json |
| MENOR-6 | MENOR | preexistente, fuera de alcance | src/fs/git.ts (`--name-only` sin `-z`) |

### MENOR-1 — Si todo se excluye, el diff dice "(sin diferencias respecto a la base)"
- Donde: `src/commands/review.ts`, `peticionTemplate` (`diff === ''`).
- Que pasa: con `incluidos` vacio el bloque diff muestra el texto de "no hay
  cambios", que ya no es cierto: los hay, todos excluidos. La seccion
  `## Excluido del diff` justo debajo lo desmiente, asi que el revisor no se
  pierde, pero el mensaje miente.
- Reproduccion: repo temporal `cli3`, rama con solo `dist/a.js` y `tarea.md`,
  `node bin/taskctl review TASK-932` → peticion con
  `(sin diferencias respecto a la base)` y `## Excluido del diff (2 fichero(s))`.
  Ademas se lanza el generico con `ficheros: []` (numDominios 0).
- Impacto: caso real pero raro (una tarea de solo recompilar o regenerar
  lockfiles). Confusion, no perdida de informacion.
- Sugerencia: distinguir "sin diferencias" de "todo lo que cambia esta
  excluido".

### MENOR-2 — Renombres entre incluido y excluido: el recuento no cuadra con el `--stat`
- Donde: `src/fs/git.ts`, `diffParaRevision` (`excluidos = todos - incluidos`).
- Que pasa: `--name-only` sin pathspec detecta el renombre y solo da el
  nombre nuevo; con el pathspec de exclusion el renombre se parte en
  borrado + alta. En `cli1` (dos renombres cruzados `src <-> dist`) la
  cabecera dice `Excluido del diff (4 fichero(s))` y el `--stat` lista
  `5 files changed` (incluye `dist/mover-a-src.js | 1 -`, que no esta en
  `excluidos`). Nada se pierde: el borrado de `src/` sale en el diff y el
  alta en `dist/` en el stat.
- Impacto: cosmetico.
- Sugerencia: `--no-renames` en las tres llamadas, o tomar el recuento del stat.

### MENOR-3 — El `--stat` se trunca a 80 columnas y pierde la sangria de la primera linea
- Donde: llamada `git diff --stat` (sin ancho) y el `.trim()` de `seccionExcluidos`.
- Que pasa: sin TTY, Git abrevia rutas largas con `.../`; en la propia
  peticion de esta tarea salen `.../peticion-brainstorm-arquitectura-1.md` y
  `.../TASK-034/planificacion/plan-final.md` sin carpeta. Y el `trim()` quita
  el espacio inicial de la primera linea, que queda desalineada con el resto
  (visible en todas las peticiones generadas).
- Impacto: el revisor no sabe que fichero es sin pedir el diff.
- Sugerencia: `--stat=200` (o `--stat-width`) y recortar solo saltos de linea.

### MENOR-4 — La orden para pedir lo excluido usa comillas simples
- Donde: `seccionExcluidos` (`':(glob)${p}'`).
- Que pasa: en Git Bash y PowerShell funciona; en `cmd.exe` las comillas
  simples no agrupan y llegarian literales a Git (pathspec que no casa, salida
  vacia sin error). Un patron con `'` romperia la orden en cualquier shell.
- Reproduccion: **no verificado en cmd.exe**. Caso a ejecutar: en cmd,
  `git diff develop..HEAD -- ':(glob)**/dist/**'` sobre `cli1`; esperado:
  salida vacia. Los revisores suelen correr en Bash, por eso MENOR.
- Sugerencia: comillas dobles (validas en los tres shells para estos patrones)
  o documentarlo.

### MENOR-5 — Compatibilidad de la clave nueva y documentacion de usuario
- Donde: `src/core/config.ts` (`CLAVES_CONFIG`), `plugin.json`, `skills/task-workflow/SKILL.md`.
- Que pasa:
  1. El plugin instalado 0.1.1 aborta con
     `clave desconocida "excluir_de_revision"` (reproducido llamando a su
     `parsearConfig`). Es la regla 2 funcionando, pero `plugin.json` sigue en
     `0.1.1`: dos esquemas de config con el mismo numero de version, asi que
     el mensaje no permite saber que hay que actualizar.
  2. La skill `task-workflow`, que es lo que lee quien usa el plugin, no
     menciona la clave; solo el comentario de `config.ts`.
  3. Definir la clave **sustituye** los valores por defecto: en `cli2`, con
     `[**/dist/**, pkg/sub dir/**]`, `tarea.md` vuelve al diff embebido.
     Correcto, pero no esta dicho en ningun sitio que lea el usuario.
- Sugerencia: subir la version al publicar y documentar la clave (y que
  reemplaza los defaults) en la skill. Puede ir con el empaquetado del sprint.

### MENOR-6 — (preexistente) Rutas no ASCII en revision fragmentada
- Donde: `diffParaRevision.nombres` y antes `diffNameOnly`: `--name-only` sin
  `-z` ni `core.quotePath=false`.
- Que pasa: Git devuelve `"src/caf\303\251 con espacio.ts"` entre comillas;
  ese nombre va al clasificador y a `diffRangeForPaths` como pathspec
  literal y no casa. En `cli1` la peticion del generico dice
  `3 fichero(s) de 4` y solo embebe 2 diffs: el fichero con tilde falta, sin
  aviso. La resta incluidos/excluidos de esta tarea no se ve afectada (los
  dos lados vienen igual de entrecomillados), y sin fragmentar el diff
  completo si lo incluye (`--` `.`).
- Impacto: un fichero se queda sin revisar sin que nadie lo vea. No es
  regresion de TASK-034: `diffNameOnly` ya hacia lo mismo; se anota aqui
  porque la peticion lo pedia mirar.
- Sugerencia: tarea aparte: `-z` (o `-c core.quotePath=false`) en todas las
  llamadas `--name-only`.
