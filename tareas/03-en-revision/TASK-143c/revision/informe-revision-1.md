# Informe de revision — TASK-143c (ronda 1)

- Commit revisado: 99767cb42a96391e2064f866bc3a596eb4ef1971
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| HAL-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts:747 | implementacion |
| HAL-2 | MENOR | corregido | scripts/verificar-impacto.mjs:545 | implementacion |
| HAL-3 | MENOR | corregido | scripts/verificar-impacto.mjs:550 | implementacion |
| HAL-4 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:844 | implementacion |
| HAL-5 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh:392 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.

### HAL-1 — el cableado de --main en finish no tiene test
argumentosScriptMerge esta probada como funcion pura, pero cambiar en dist/finish.js los argumentos por los antiguos (sin --main) deja en verde finish-tag, finish-merge y paridad-operacion. Hace falta un test de finish con hotfix o release que observe los argumentos con que se lanza el script.

### HAL-2 — caminos de fallo de conDistProtegido sin test
Sobreviven «sin cerrar() cuando fn lanza» y «cerrar solo al resolver la promesa». El comportamiento es correcto (comprobado a mano: fn que lanza, promesa rechazada, fn que borra o anade ficheros: dist/src restaurado y cerrojo suelto); falta la red.

### HAL-3 — un thenable sin finally deja el cerrojo cogido
`fn = () => ({ then: (ok, ko) => ko(new Error()) })` lanza «resultado.finally is not a function», no devuelve dist/src y deja el cerrojo. No afecta a los usos actuales. Arreglo: Promise.resolve(resultado).finally(cerrar).

### HAL-4 — semantica de error de remoteBranchExists sin test, y resolveMainBranch puede lanzar por el limite
Sobrevive el mutante `if (!ls.ok) throw` -> `if (false)` de remoteBranchExists. Con el limite nuevo, resolveMainBranch puede pasar isRemoteAvailable y agotar el limite en remoteBranchExists('main'), y lanzar GitCommandError, mientras resolve_main_branch de bash cae a la rama local.

### HAL-5 — prioridad entre operaciones solo probada para merge frente a cherry-pick
Sobreviven en paridad-operacion y abort-merge los mutantes «rebase antes que merge» y «revert antes que cherry-pick» del printf de detect_operation_in_progress.

## Regla 4D

- Duplicacion: SCR-07 queda en una funcion con test de paridad; SCR-08 unifica los ls-remote en lsRemoto sobre gitCrudo.
- Desviacion: ninguna.
- Diluvio: ninguno.
- Disfraz: ningun test disfrazado, pero cobertura sin discriminacion (HAL-1, HAL-2, HAL-4, HAL-5).

## Evidencia

Clon temporal en %LOCALAPPDATA%/pruebas-claude/taskcode/task-143c-r1 (borrado). npx tsc sin errores. Tanda pedida: primera vez 22 rojos bajo carga (con pruebas y mutantes a la vez); repetida aislada, 248/248 en verde. Mutantes matados: sin timeoutMs, ETIMEDOUT como fallo de lanzamiento, tagRemoto sin guard, sin --main en la funcion pura, sin sequencer, sin .finally, perfil-tests sin proteccion. Pruebas directas de conDistProtegido y de lsRemoto (origin inexistente, origin muerto con GF_TIMEOUT_REMOTO=1, git fuera del PATH: GitLaunchError como antes).

## Correcciones (coordinador)

- HAL-1: test de finish con hotfix y una copia de los scripts donde merge-hotfix-to-main.sh anota sus argumentos y llama al real; exige --main main.
- HAL-2 y HAL-3: Promise.resolve(resultado).finally(cerrar); test de conDistProtegido con fn que lanza, promesa rechazada, thenable sin finally y valor.
- HAL-4: resolveMainBranch hace una sola consulta (main y master) y, si origin no responde o agota el limite, cae a las ramas locales sin lanzar, como resolve_main_branch; remoteBranchExists desaparece (solo la usaba ella). Test con origin muerto y GF_TIMEOUT_REMOTO=1.
- HAL-5: tres estados mas en la paridad (merge y rebase, rebase y cherry-pick, cherry-pick y revert). abort-merge y diagnose-repo no eligen una operacion: tratan cada booleano por separado, asi que no repiten la cadena de prioridad.
- Los seis mutantes que sobrevivian dan ahora rojo.

## Lecturas fuera del contexto permitido

src/fs/git-crudo.ts (entorno y errores de gitCrudo), test/fs/git.test.ts, test/commands/finish-*.test.ts, merge-hotfix-to-main.sh y merge-release-to-main.sh, y parse_gitflow_args, _gf_ls_remote y resolve_main_branch de _gitflow-common.sh, para comparar con el lado TS.
