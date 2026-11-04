# Informe de revision — TASK-072 (ronda 2)

- Commit revisado: 08cc6e32d82c57e55af26a5f91c46012bacbf646
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer, independiente de la implementacion
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | src/core/comando-merge.ts (analizarComando, textoDeShell) | implementacion |
| MEN-2 | MENOR | corregido | src/core/comando-merge.ts (ramaDeCambio) | implementacion |
| MEN-3 | MENOR | corregido | src/commands/finish-verificacion.ts (puertaVerificacion) | implementacion |
| MEN-4 | MENOR | aceptado | src/core/comando-merge.ts (textoDeShell) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos CRITICO ni IMPORTANTE. MEN-4 es nuevo; el revisor propone no bloquear el cierre y
dejarlo anotado en el `Resultado`.

## Reproduccion

Clon en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-072-r2` (borrado al terminar),
`npm install && npm run build` sin errores. `guardia-merge.test.js`, `finish-verificacion.test.js`
y todos los `finish-*.test.js`: 137/137 en verde. Suite completa no ejecutada por el revisor (la
corrio el implementador: 1758/1763, los 5 rojos conocidos de Windows).

Mutantes sobre `dist`, los tres detectados y restaurados:
- MEN-1: desactivar el reanalisis de `textoDeShell` -> 2 rojos en `guardia-merge`.
- MEN-2: volver a `pos[0] ?? null` -> 1 rojo en `guardia-merge`.
- MEN-3: calcular la huella con el arbol sucio -> 1 rojo en `finish-verificacion`.

Casos adversarios correctos: `bash --norc -c "git checkout develop && git merge x"` (destino
develop); `sh -ec`, `zsh -c`, `powershell -Command git merge x`, `cmd /c git merge x`;
`pwsh -NoProfile -Command "git switch develop; git merge x"`; recursion `bash -c "bash -c '...'"`;
`git checkout -b x develop` y `-B` dan destino `x`; `git switch develop`; `git checkout develop -f`;
`git checkout develop src/a.ts` y `git checkout -- src/a.ts` dan destino null; `bash -c` sin texto
devuelve `[]` sin lanzar.

### MEN-4 — opciones de bash con valor antes de `-c` esquivan el guardian

`analizarComando('bash -o pipefail -c "git merge x"')` y `analizarComando('bash --rcfile f -c "git merge x"')`
devuelven `[]`: `textoDeShell` corta en el primer argumento que no empieza por `-` (`pipefail`, `f`)
y no llega al `-c`. Misma clase que MEN-1 con opciones de valor (`-o`, `+o`, `--rcfile`,
`--init-file`); poco comun, y ademas haria falta un merge a una rama protegida. Arreglo: saltar el
valor de esas opciones o seguir buscando `-c`.

## Limites de la revision

No probo el hook en Claude Code real (smoke del implementador con 2.1.318). MEN-4 se reproduce en
`analizarComando`, no de punta a punta por el hook.
