# Informe de revision — TASK-078 (ronda 1)

- Commit revisado: cae1fb32536e8e307d340432c41c4e666818ceff
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet, independiente; no implemento la tarea)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/heldout.ts (`numerosHeldoutEnRuta`) | plan |
| MEN-2 | MENOR | abierto | src/hooks/guardia-heldout.ts (`decidirHeldout`) / skills/task-workflow/heldout.md | plan |
| MEN-3 | MENOR | abierto | tareas/…/TASK-078/tarea.md (criterio 5) | implementacion |
| MEN-4 | MENOR | abierto | test/hooks/guardia-heldout.test.ts / src/hooks/guardia-heldout.ts | implementacion |
| MEN-5 | MENOR | abierto | src/core/heldout.ts (comentario) / skills/task-workflow/heldout.md | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRÍTICO ni IMPORTANTE; los cinco criterios de aceptación se cumplen.

## Reproducción

**Entorno.** Clon de la rama en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-078-r1`, `npm install`,
`npm test` una vez. Carpeta borrada al terminar.

**Suite completa.** 1803 tests: 1799 pasan, 4 fallan. Tres son los conocidos de Windows (symlink
EPERM en `approve`, chmod de directorio y CRLF en `plan`). El cuarto, `doctor` «plataforma:
merge-request por defecto con sesion», falló por `spawnSync gh ETIMEDOUT` al correr con los
mutantes en paralelo; repetido solo, pasa. Los 7 tests de `guardia-heldout` pasan. El `dist/`
commiteado coincide con el recompilado.

**Mutantes** (copia; `guardia-heldout.test` + `guardia-merge.test`, 26 tests en verde en la base):

| Mutante | Resultado |
|---|---|
| sin fin de segmento `(?:/\|$)` en la regex | muerto (4) |
| sin `path.resolve` contra el cwd | muerto (3) |
| `!nums.includes(n)` → `false` | muerto (2) |
| sin lectura de `rebase-merge/head-name` | muerto (1) |
| `CAMPO_RUTA` sin `pattern` | muerto (1) |
| `CAMPO_RUTA` sin `glob` | muerto (1) |
| base de Grep/Glob = cwd | muerto (1) |
| despacho de `pre-tool-merge` sin `aceptacion` | muerto (2) |
| `pre-tool-merge` no devuelve el bloqueo de held-out | muerto (2) |
| guardián de held-out apagado en `pre-tool-merge` | muerto (2) |
| filtro `/aceptacion/i` de `pre-tool-lectura` cambiado | muerto (4) |
| `PowerShell` fuera de los shells | muerto (1) |
| `:` fuera de `SEPARADORES_COMANDO` | muerto (2) |
| `.toLowerCase()` del primer brazo | sobrevive, equivalente (el brazo de `path.resolve` ya normaliza) |
| `rama === ''` quitado | sobrevive, equivalente (`numeroDeRama('')` es null) |
| `padStart(3,'0')` quitado | **sobrevive** (MEN-4) |
| sin `existsSync(cwd)` | no concluyente (error de tsc por el sed) |

Dos mutantes (barras invertidas, comillas como separador) no se aplicaron: el sed no casó.

**Puntos de entrada por stdin** (repo temporal con `comando_verificacion`):
- En `feature/task-901-x` salen 2: `cat …/aceptacion/p.cjs`, `ACEPTACION`,
  `Get-ChildItem tareas/*/TASK-901/aceptacion`, `//`, `/./`, `$(echo ruta)`, `git show HEAD:ruta`,
  `Read` con o sin barra final, `file:///`, cwd dentro de la tarea con relativa, cwd en
  `aceptacionX` con `../aceptacion/…`, Glob con `path` base y patrón relativo.
- Salen 0, como declara la skill: `cd` previo y relativa, `acep"tacion"`, `acepta*`,
  `aceptaci?n`, Glob/Grep sobre la raíz.
- Ramas: `develop` 0, `feature/task-902-y` 0, `hotfix/task-901` y `task-901` 2, `mytask-901-x` 0,
  `feature/task-0901-x` 2, HEAD desacoplado sin rebase 0.
- **Guardián de merges intacto**: en `develop`, `git merge feature/task-903-z` sale 2, también con
  `# aceptacion` o `&& cat …/aceptacion/…` en el comando.
- **Smoke real** (`claude -p --plugin-dir` del clon, rama de la tarea): `Read`, `Grep`, `Glob` y
  `Bash cat` bloqueadas con `PreToolUse:… hook error … Bloqueado: esto nombra la carpeta aceptacion/
  de TASK-901 …`.

### MEN-1 (plan) — Normalización de Windows que el casado no cubre
`aceptacion ` (espacio final), `aceptacion.` (punto final) y el 8.3 `ACEPTA~1` salen 0 en el hook de
fichero. Reproducción parcial: no se verificó que `Read` abra la carpeta con ellas. No está en la
lista de lo que el guardián no ve de `heldout.md`: añadirlo o declararlo aceptado.

### MEN-2 (plan) — La rama se mira en el cwd, no en el repo de la ruta
Con un worktree en `feature/task-901-x` y el cwd en el checkout de `develop`, `Read` de la ruta
absoluta de `aceptacion/` del worktree sale 0 (cwd en el worktree: 2). Coherente con la decisión 1,
pero es otra esquiva no declarada en `heldout.md`.

### MEN-3 (implementacion) — El smoke del criterio 5 no deja constancia
`tarea.md` no tiene `Resultado` ni evidencia del smoke. El revisor lo ejecutó con Read, Grep, Glob y
Bash; quedan sin smoke real Edit, Write, MultiEdit, NotebookEdit y PowerShell (cubiertos por stdin).

### MEN-4 (implementacion) — Sin test del relleno del ID en el mensaje
El mutante sin `padStart(3,'0')` sobrevive: todo usa TASK-901. Con TASK-078 el mensaje diría
«TASK-78». Añadir un caso con rama `task-078-…`.

### MEN-5 (implementacion) — Errata y falso positivo no declarado
`src/core/heldout.ts`: «Es un baden» (falta la tilde). Además, un comando que solo nombra la ruta
sin leerla (`git commit -m "… tareas/x/TASK-901/aceptacion …"`) sale 2: falso positivo coherente
con «texto que nombra la ruta», que conviene mencionar en la skill.
