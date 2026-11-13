# Informe de revision — TASK-120 (ronda 1)

- Commit revisado: b2d13386d88d5a5e9741b9a29b4d47d1bef8bb9c
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/fs/registro-puertas.ts:16 | plan |
| MEN-2 | MENOR | abierto | src/fs/git-commit.ts:386 (y test/commands/sincronizacion-fases.test.ts) | implementacion |

Sin hallazgos CRITICOS ni IMPORTANTES.

### MEN-1 — el registro es por worktree: `metricas` desde el repo principal no ve lo anotado en un worktree

Reproduccion (repo temporal con `git worktree add`, llamando a `anotarPuerta` / `leerRegistroPuertas` compilados, sin ejecutar taskctl):
- `rutaRegistroPuertas(worktree)` = `<repo>/.git/worktrees/wt/taskcode/puertas.log`
- `rutaRegistroPuertas(repo)` = `<repo>/.git/taskcode/puertas.log`
- tras anotar desde el worktree: `leer(worktree)` = 1 linea, `leer(repo)` = 0.

Consecuencia: la duracion anotada desde un worktree no sale en `taskctl metricas` ejecutado en el repo principal, y se pierde al borrar el worktree. Es coherente con la convencion del proyecto (`cadena.lock`, `progreso`, `coste-pendiente` usan el mismo `--git-path`) y esta documentado en docs/registro-puertas.md ("el de ese worktree"), por eso es MENOR. Sugerencia: anotarlo como limitacion en la seccion de metricas, o usar `--git-common-dir` si se quiere un registro unico.

### MEN-2 — la fase de cada llamador de `autoCommit` no tiene red de regresion, salvo `approve`

Verificado por lectura: los 16 llamadores pasan `fase` correcta (approve, codex-review, doctor-deploy, finish x3, import, new, pausa, plan, registrar-coste, review, start, trocear, veredicto, verificar-menores). Pero solo `approve` esta ejercitado por test: si alguien cambia `fase: 'plan'` por otra en plan.ts, ningun test se pone rojo, y con `fases_sincronizacion` la sincronizacion correria o no en la fase equivocada. Ademas, con la clave declarada y un llamador sin `fase`, la sincronizacion corre (decision del plan, sin test). Sugerencia opcional: un test que recorra las fases de `FASES_SINCRONIZACION` frente a los `fase:` de src/commands. No bloquea el cierre.

## Reproduccion y casos borde construidos

- Build: `npm run build` limpio; `git status` sin cambios despues (dist coincide con src).
- `node --test` de registro-puertas, sincronizacion-fases, sincronizacion-ciclo, core/metricas, commands/metricas y approve: 74 tests, 73 pasan, 0 fallan, 1 omitido (el del symlink de approve, por EPERM en este Windows, como se esperaba). No se ejecuto la suite completa (modo rapido).
- (a) Formato: campo con `\t`/`\r\n` -> se cambian por espacio, vacio -> `-`; lectura con CRLF OK (2 lineas); duracion 0.04 -> `0.0`; `1e3` y `1,5` en duracion se rechazan (linea ignorada, no hay locale que rompa: `toFixed` es independiente del locale); `TASK-123a` se extrae bien, mensaje sin tarea -> `-`.
- (b) Todos los llamadores de autoCommit pasan `fase` correcta (ver MEN-2).
- (c) Sin la clave corre en todas las fases (igual que antes; comando null devuelve SIN_SINCRONIZACION antes de cronometrar, sin linea). Con la clave, una fase excluida no ejecuta ni anota. En finish los derivados regenerados en fases excluidas simplemente se regeneran al sincronizar en una fase listada; no hay corrupcion, solo derivados desactualizados en la rama hasta entonces, que es lo que la persona pide al declarar la lista.
- (d) Fuera de un repo: `rutaRegistroPuertas` devuelve null, anotar y leer no hacen nada ni lanzan. Worktree: ver MEN-1. Carpeta temporal `%LOCALAPPDATA%\pruebas-claude\taskcode\task-120-r1` borrada.
- (e) Cambios de expectativas en tests existentes: solo anaden la celda/columna `sinc` (`—` sin registro) y desplazan un indice 15->16; no debilitan nada. El `t.skip` de approve.test.ts solo se activa con `code === 'EPERM'`; cualquier otro error se relanza.

## Lecturas fuera del contexto permitido

- src/fs/sincronizacion.ts, src/commands/finish.ts y finish-verificacion.ts, src/commands/cadena.ts, src/fs/progreso.ts, src/fs/coste-pendiente.ts: para comprobar el comportamiento de la sincronizacion en finish y la convencion de `--git-path` por worktree (MEN-1).
- Tests de metricas existentes con cambios de expectativa (pedidos por el encargo).
