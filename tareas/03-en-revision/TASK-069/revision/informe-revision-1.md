# Informe de revision — TASK-069 (ronda 1)

- Commit revisado: 89199592963425c367025184138bda648f32e9ae
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer (afd2b476e340883e0)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-069 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs (regex `\bgit\s+merge\b` de `decidir`) | implementacion |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs (`decidir` con entrada JSON `null`) | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh (mutantes que sobreviven) | implementacion |
| MEN-3 | MENOR | abierto | .github/workflows/ci.yml, step H2b | plan |
| MEN-4 | MENOR | abierto | docs/spikes/TASK-069-resultado.md (hipótesis y matcher) | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Opinión del revisor: «aprobada-con-correcciones» (sin críticos). Como IMP-1 queda abierto, quien
orquesta registra `cambios-solicitados` (regla de la fase de revisión: con IMPORTANTE abierto no se
aprueba).

## Reproduccion

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-069-r1` (borrado al terminar). HEAD del clon: 9b09304, que incluye el 8919959 revisado. Windows nativo, node v22.23.4.

### Lo que funciona (evidencia)

- `bash hooks/test/sonda-hooks.test.sh` da **12/12 «ok» y «TODO OK»**, rc=0. El fichero llega con LF (`od -c` no muestra `\r`) pese a `core.autocrlf=true`, así que la regla `*.sh text eol=lf` hace su trabajo.
- `claude plugin validate` sobre el plugin con `hooks/hooks.json` da **«Validation passed»**. Solo avisa de `ICON_MISSING`, que no es de la tarea. H1 queda confirmada en local (Windows) y no solo «PENDIENTE CI».
- La sonda con `node hooks\sonda-hooks.mjs < hooks\test\stop.json` y `TASKCODE_SONDA_MODO=stop2` sale con **rc=2** y el motivo por stderr (Git Bash con redirección).
- Casos extra correctos: entrada vacía o no JSON → rc=0; `[]` → rc=0; log no escribible (`/nonexistent/x/l`) sigue dando rc=2 en stop2 (el fallo del log no altera la decisión).
- Los seis rojos de la suite completa no tienen relación con TASK-069: el diff solo toca `hooks/`, `.gitattributes`, `ci.yml` y `docs/spikes`, y ningún test de la suite los lee. Los dos de «contraprueba de descubrimiento» son el aviso `✘ README missing` de Claude Code 2.1.316 sobre una copia sin README.

### IMP-1 — falso positivo: bloquea `git merge-base`

Con `TASKCODE_SONDA_MODO=pre2` y la entrada `{"hook_event_name":"PreToolUse","tool_input":{"command":"git merge-base --is-ancestor a b"}}` la sonda sale **rc=2** («git merge bloqueado a proposito»).

- Causa: `\b` coincide entre `e` y `-`, así que `\bgit\s+merge\b` casa con `merge-base`.
- Impacto: `taskctl start` usa `git merge-base --is-ancestor` en el límite de WIP. Un freno basado en esta regex lo bloquearía. La sonda es inerte por defecto, pero el spike la propone como patrón para TASK-071/072, así que el defecto se hereda.
- Corrección sugerida: `/\bgit\s+merge(?![\w-])/` y un caso de test con `merge-base` que devuelva 0.
- Misma raíz, falso negativo: `git -C x merge foo` sale rc=0, y el filtro `if: "Bash(git *)"` no cubre `cd x && git merge`. Registrarlo como limitación en «Implicaciones para TASK-071/072».

### MEN-1 — «cualquier fallo propio sale 0» no es cierto

La entrada `null` es JSON válido; `decidir` lanza `TypeError ... reading 'hook_event_name'` con **rc=1** y traza por stderr. Corrección: tras `JSON.parse`, comprobar `entrada && typeof entrada === 'object'`.

### MEN-2 — mutantes que sobreviven

Seis mutaciones sobre la sonda:
- Muertas: `stop_hook_active === true` → `=== 1`; `process.exit(decision.codigo)` → `process.exit(0)`.
- **Sobrevive**: quitar `&& evento === 'PreToolUse'` en pre2 (ningún test envía un Stop con `git merge`).
- **Sobrevive**: vaciar `if (!modo) process.exit(0)` (el caso inerte no comprueba stderr vacío).
- La mutación de la regex (`mergeX`) quedó sin verificar (el sed del arnés pudo no aplicarse); no se cuenta.

Corrección: caso «pre2 ignora un evento Stop» y comprobar stderr vacío en el caso inerte.

### MEN-3 — step H2b (cmd.exe) no verificado

`cmd.exe /c` desde el entorno del revisor entra en modo interactivo; queda **no verificado**, hay que mirarlo en el CI de Windows. El step tiene `continue-on-error: true`: un rojo no rompe el pipeline. Nota: PowerShell 5.1 pasa la entrada por pipe con BOM (`Get-Content stop.json | node ...` da «la entrada no es JSON»); con `<` funciona, lo que explica por qué el step usa redirección.

### MEN-4 — documentación del spike

- H2 en Linux figura CONFIRMADA citando la VM del bridge: evidencia legítima de la implementación, no reproducida por el revisor en Linux.
- H1 podría pasar a «CONFIRMADA en local (Windows), pendiente CI Linux».
- Hallazgos colaterales 2 y 3 bien separados como candidatas a tareas propias.

## Revision de alcance

- El diff se limita a la sonda, el test, la regla `.gitattributes`, el CI y el documento. La regla `*.sh text eol=lf` está justificada y documentada.
- La sonda es inerte sin variable de entorno: confirmado, sin log y rc=0.
- No menciona skills ni agentes del plugin que deban ser neutrales.

## Que no se ejecuto

- La suite completa (ya ejecutada por quien orquesta: 1607/1613, rojos ajenos).
- Los steps de CI en Linux y en Windows nativo (ver MEN-3).
- El guion manual H3–H6, que sigue «PENDIENTE manual» en el documento.
