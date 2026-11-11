# Informe de revision — TASK-103 (ronda 1)

- Commit revisado: c0fb85be8c337d7e66250a610ca4cd3bb2bdbd1c
- Revisor: general-purpose, sonnet, skill code-quality-reviewer
- Veredicto: cambios-solicitados

(El revisor propuso `aprobada-con-correcciones`; quien orquesta registra `cambios-solicitados`
porque hay dos IMPORTANTE abiertos y, en modo automatico, lo que se mergea tiene que ser lo revisado.)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:117 (`MERGE_CON_VALOR`), usado por `esControlDeMerge` | implementacion |
| IMP-2 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts (test «el hook real evalua los merges que antes no detectaba») y src/hooks/guardia-merge.ts:`esRama` | implementacion |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:`esRama` + comando-merge.ts:`ramaDeCambio` | plan |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`sinPrefijos` | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Puerta determinista

- Clon limpio en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-103-r1`, rama de la tarea, `npm install` y `npm test` una sola vez.
- 2178 tests, 2174 pasan, 3 fallan: los tres conocidos de Windows nativo (symlink `EPERM`, `chmod` de directorio en NTFS, CRLF). Ninguno es regresion.
- La compilacion no deja diferencias en `dist/` respecto a lo commiteado.

### IMP-1 — `git merge --message --abort x` sigue escondiendo el merge

Con el hook real, en un repo temporal con config valida, sin verde y en `develop`:

| Comando | Resultado | Esperado |
|---|---|---|
| `git merge feature/x` | exit 2 | bloquea |
| `git merge -m --abort feature/x` | exit 2 | bloquea |
| `git merge --message --abort feature/x` | **exit 0** | bloquea |

Con git real, `git merge --message --abort x` mergea `x` (fast-forward, «-m option ignored»). `--message` es la forma larga de `-m` y no esta en `MERGE_CON_VALOR`, asi que `esControlDeMerge` toma `--abort` como opcion. `--cleanup --abort` no es un bypass: git aborta con `Invalid cleanup mode`.

Correccion sugerida: anadir `--message` a `MERGE_CON_VALOR` y su caso en el test de MEN-2.

### IMP-2 — la rama solo en origin de `esRama` no tiene red de regresion

Quitando `|| existeRef('refs/remotes/origin/…')` de `esRama`, los 35 tests siguen en verde. El test usa `git checkout remota && git merge develop`, que sale 0 igualmente porque `develop` es ancestro de `develop` (paso 5). Correccion sugerida: fuente que no sea ancestro (`RAMA`).

### MEN-1 — `git checkout <tag|sha|origin/x>` estando en develop: falso positivo

Con `esRama`, `git checkout t1 && git merge feature/x` (tag) en `develop` sale 2, como si integrara en `develop`; es HEAD desacoplado. Antes pasaba. Mejorable tratando como cambio de HEAD lo que resuelve a un commit.

### MEN-2 — huecos preexistentes de la misma familia (informativo)

Con el hook real, exit 0 hacia `develop` sin verde: `if true; then git merge feature/x; fi`, `time -p -- git merge feature/x`, `nohup git merge feature/x`. No los introduce esta tarea; el README no los menciona entre lo que no ve.

### Criterios de aceptacion, comprobados empiricamente

- Config invalida (clave antigua y nueva): bloquea hacia `develop`, `main` y `master` con el error, el fichero, `taskctl doctor` y `taskctl finish TASK-NNN`, sin `[ERROR]`. Tambien con YAML roto, fichero binario y `config.yml` como carpeta.
- Sin config o con config valida: sin cambios. Hacia otra rama con config invalida: pasa.
- `{ git merge x; }`, `time git merge x`, `eval git merge x` y `git checkout README.md && git merge x` bloquean con el hook real; `comandoSoloIntegra` da `false` con `{`, `time` y `eval`.
- NUE-3: barras reales presentes. README y CHANGELOG coherentes con lo observado, salvo IMP-1.

### Mutacion (linea base 35 pass)

Discriminan todas las mutaciones probadas (esControlDeMerge, `{`, `time`, `eval` en los dos sitios, predicado, config invalida, lista fija sin cada rama, barra invertida, mencion a `taskctl doctor`), salvo quitar `refs/remotes/origin` de `esRama`: 0 rojos (IMP-2).

## Lecturas fuera del contexto permitido

- `src/core/config.ts` (lineas 385-460, `resolverConfigInterno`): para confirmar que todo fallo de lectura o parseo de la config es `ConfigError` y bloquea.

Carpeta temporal borrada. El repo original no se modifico.
