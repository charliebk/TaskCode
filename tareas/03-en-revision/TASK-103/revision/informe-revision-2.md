# Informe de revision — TASK-103 (ronda 2)

- Commit revisado: 96debe0ee8da5fbc5ddf4bd137d3832b980c7e73
- Revisor: general-purpose, haiku, skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-103 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`MERGE_CON_VALOR` | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts y src/hooks/guardia-merge.ts:`esRevision` | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:`esRevision` | plan |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`sinPrefijos` | plan |
| NUE-1 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:`esRevision` | implementacion |
| NUE-2 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`sinPrefijos` | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Puerta determinista

- Clon limpio en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-103-r2`, `npm install` y `npm test` una vez: 2178 tests, 2174 pasan, 3 fallan (128 symlink `EPERM`, 787 CRLF, 781 «Missing expected rejection»).
- Nota de quien orquesta: el 781 (`taskctl plan: propaga cualquier error de escritura que NO sea EEXIST`) es el conocido de `chmod` sobre directorios en NTFS: el `chmod` no hace nada, la escritura no falla y por eso falta el rechazo esperado. Los tres son los rojos conocidos de Windows nativo.

## Verificacion de los hallazgos de la ronda 1

- **IMP-1 corregido.** `git merge --message --abort feature/task-900` con el hook real pasa de exit 0 a exit 2. Quitar `--message` de `MERGE_CON_VALOR` deja tests en rojo.
- **IMP-2 corregido.** El test usa `git checkout remota && git merge RAMA`; quitar la clausula `refs/remotes/origin/` lo pone en rojo (en la ronda 1 pasaba en verde).
- **MEN-1 corregido en lo que decia.** Tag y sha ya no bloquean; quitar `rev-parse ^{commit}` pone el test en rojo. Abre NUE-1.
- **MEN-2 corregido.** `time -p -- git merge`, `nohup git merge` e `if true; then git merge x; fi` pasan de 0 a 2. Las mutaciones de `then/do/else` y del `--` tras `time` dan rojo.

## NUE-1 — `git checkout HEAD` y `git checkout @` saltan la guardia (CRITICO, introducido por la correccion)

`esRevision` acepta cualquier nombre que resuelva a commit. `HEAD` y `@` resuelven, pero `git checkout HEAD` deja HEAD en la misma rama: el destino pasa a `HEAD`, que no esta protegido, y el merge pasa.

Con el hook real, en develop, sin verde:

| Comando | Ronda 1 | Ronda 2 |
|---|---|---|
| `git checkout HEAD && git merge feature/task-900` | 2 | **0** |
| `git checkout @ && git merge feature/task-900` | 2 | **0** |
| `git checkout main && git checkout HEAD && git merge feature/task-900` | 2 | **0** |

Con git real, el merge aterriza en develop. El README y el CHANGELOG afirman que un commit desacopla HEAD, y no es cierto para `HEAD` y `@`. Correccion propuesta: excluir `HEAD` y `@` del predicado, con un test en el hook real.

## NUE-2 — la condicion de `if`/`while` no se analiza (CRITICO, preexistente)

`if git merge feature/task-900; then :; fi` en develop sale con exit 0, en las dos rondas. `PREFIJOS` quita `then`, `do` y `else`, pero no `if`, `elif`, `while` ni `until`. No lo introduce la correccion; es el mismo tipo de hueco que MEN-2. Corregir en esta ronda o documentarlo como limite.

## Mutacion

Discriminan las mutaciones de IMP-1, IMP-2, MEN-1 y MEN-2. La correccion propuesta de NUE-1 no la cubre ningun test (24/0 con y sin ella).

## Lecturas fuera del contexto permitido

- `revision/informe-revision-1.md` (lo pide la peticion), la plantilla de este informe y `package.json` (scripts de npm).

Carpetas temporales borradas; el repo original no se modifico.
