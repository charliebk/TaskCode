# Informe de revision — TASK-101 (ronda 2)

- Commit revisado: 519c21c (contiene 56c79a7, la correccion)
- Revisor: revisor por pares independiente (agente general-purpose, skill code-quality-reviewer); verificacion acotada
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| CRI-1 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`comandoSoloIntegra`: exactamente una operacion) | implementacion |
| CRI-2 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`CARACTERES_PELIGROSOS` y lista blanca minima) | implementacion |
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts (detalle con config del destino invalida; sigue bloqueando) | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`MERGE_SIN_MERGE`; pasa a TASK-103; ver NUE-2) | especificacion |
| NUE-1 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`segmentosSoloIntegran`, checkout/switch: `CREAN_RAMA` comparado con el token exacto) | implementacion |
| NUE-2 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`analizarComando` descarta un `git merge` con `--abort/--quit/--continue/--skip` en cualquier posicion y `comandoSoloIntegra` lo acepta como `merge`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Los dos nuevos los provoca la correccion: sin `rutas_documentacion` (0.14.0) se bloquean.

Preparacion: repo temporal con `rutas_documentacion: [docs/**, "*.md"]`, ramas `docs` (solo
`docs/b.md`) y `code` (`src/y.ts`) sin verde; hook real por stdin desde `develop`; si sale 0 se
ejecuta el comando y se comprueba si `develop` contiene `src/y.ts`.

### CRI-1 y CRI-2 — corregidos

Bloquean con el hook real la entrada de CRI-1 (con `&&` y con `;`) y las de CRI-2, ademas de
`git merge {docs,code}`, continuacion de linea, dos fuentes, `&` y `git checkout -b x docs`. El merge
limpio sigue pasando. `git checkout code -- src/y.ts` antes del merge pasa pero el merge no arrastra
el fichero preparado.

### NUE-1 — Opciones de creacion de rama agrupadas, adjuntas o escapadas

`CREAN_RAMA` y `-f/--force` se comparan con el token exacto; git acepta `-fB`, `-qB`, `-Bdocs`, `-fC`,
`-Cdocs`, `--force-c`, `--force-cr`, y bash convierte `-\B` en `-B`. Devuelven 0 y dejan `src/y.ts` en
`develop`: `git checkout -fB docs code && git checkout develop && git merge docs`; `-qB`; `-Bdocs`;
`-\B`; `git switch -fC docs code && ...`; `-Cdocs`; `--force-c` (y `--force-cr`); `-\C`; y dentro de
`bash -lc "..."` o `sh -c '...'`. Control: `-B` a secas bloquea; sin rutas, todas bloquean.
Correccion: en checkout/switch, solo una lista cerrada de opciones (`--detach`, `-q`, `--quiet`,
`--`) y rechazar tokens con `\`.

### NUE-2 — Un merge oculto como `--abort/--quit/--skip/--continue` no cuenta como merge

`git checkout docs && git merge -m --abort code && git checkout develop && git merge --no-ff docs` y
`git merge -m --quit code; git merge docs` devuelven 0 y meten `src/y.ts` en `develop` (sin rutas, el
primero bloquea). Reabre CRI-1. Correccion: rechazar cualquier `git merge` que `analizarComando` no
cuente, o contar los merges en `segmentosSoloIntegran` y exigir uno.

## Reproduccion y verificacion empirica

Tests de guardia-documentacion, guardia-merge y guardia-heldout: 38/38. Ningun test cubre NUE-1 ni
NUE-2. Nota: `cd otro-repo && git merge docs` evalua `docs` del repo del cwd (limite ya aceptado en
el plan).

## Lecturas fuera del contexto permitido

- `src/hooks/pre-tool-merge.ts` y `dist/src/hooks/pre-tool-merge.js`: ejecutar el hook real.
- Tests y helpers del guardian: solo ejecutados.
- `revision/informe-revision-1.md`: contexto de la ronda 1.
