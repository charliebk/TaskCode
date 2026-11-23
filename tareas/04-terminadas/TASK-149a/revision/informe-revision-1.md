# Informe de revision — TASK-149a (ronda 1)

- Commit revisado: 89caf6373f9bb5b5b5953bf997e2a5e51b990d2e
- Revisor: code-quality-reviewer (sonnet, independiente)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/fs/git-crudo.ts (ramaActual, rebase-apply), test/fs/git-crudo-comun.test.ts | implementacion |
| IMP-2 | IMPORTANTE | corregido | src/hooks/freno-stop.ts, src/hooks/guardia-merge.ts, test/hooks | implementacion |
| MEN-1 | MENOR | corregido | src/fs/git.ts:137 (operacionEnCurso), src/commands/cadena.ts:52 | implementacion |
| MEN-2 | MENOR | corregido | src/fs/config-de-ref.ts:14, src/fs/ejecucion-acotada.ts:208 | implementacion |
| MEN-3 | MENOR | corregido | src/fs/verificacion.ts, src/hooks/guardia-merge.ts, src/fs/sincronizacion.ts | implementacion |
| MEN-4 | MENOR | corregido | src/fs/git-crudo.ts, src/hooks/freno-stop.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon con tsc limpio; git-crudo-comun, hooks y task-store 84/84; git, sincronizacion, pendientes-fase, finish-verificacion, estado, cadena, coste-automatico y finish-parcial 97/97.
- IMP-1: quitar 'rebase-apply/head-name' de ramaActual sobrevive (el test solo fabrica rebase-merge). Contra Git real con `git rebase --apply` en conflicto si funciona.
- IMP-2: el cambio de comportamiento no tiene test: `rama = ''` en decidirCierreDeMerge sobrevive y ningun test de freno-stop ejercita un rebase. Juicio del revisor: el cambio es correcto (coherente con guardia-heldout; stop_hook_active deja parar la segunda vez; ramaActual va dentro de try).
- MEN-1: operacionEnCurso (fs/git.ts) y cadena.ts siguen resolviendo --git-path a mano. MEN-2: config-de-ref.ts (git show, maxBuffer de 1 MB) y ejecucion-acotada.ts (git status -z) siguen con spawnSync propio. MEN-3: alias `git`/`runGitOk` con contratos distintos al de su nombre. MEN-4: la cabecera de git-crudo.ts dice que es solo de doctor-deploy y el paso 6 de freno-stop dice «el unico git».
- Entorno: maxBuffer 64 MB, timeout 60 s, GIT_OPTIONAL_LOCKS=0, windowsHide; inocuo para los git sustituidos. rutaGit comprobado con subdirectorio y worktree.

## Regla 4D

- Duplicacion: MEN-1, MEN-2
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: IMP-1, IMP-2

## Lecturas fuera del contexto permitido

- src/fs/git.ts, src/commands/cadena.ts, src/fs/config-de-ref.ts, src/fs/ejecucion-acotada.ts (Regla 4D); la peticion y docs/auditoria-4d-completa.md.
