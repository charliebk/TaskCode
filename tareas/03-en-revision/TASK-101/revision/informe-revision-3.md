# Informe de revision — TASK-101 (ronda 3)

- Commit revisado: 8768397 (contiene 729658b, la correccion)
- Revisor: revisor por pares independiente (agente general-purpose, skill code-quality-reviewer); verificacion acotada
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| CRI-1 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`comandoSoloIntegra`: exactamente una operacion) | implementacion |
| CRI-2 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`CARACTERES_PELIGROSOS` y lista blanca minima) | implementacion |
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts (detalle con config del destino invalida; sigue bloqueando) | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`MERGE_SIN_MERGE`; pasa a TASK-103) | especificacion |
| NUE-1 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (checkout/switch: lista cerrada de opciones y rechazo de `\`) | implementacion |
| NUE-2 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (cuenta cada `git merge` y script de cierre; rechaza `--abort/--quit/--continue/--skip`) | implementacion |
| NUE-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts (casos con `\B`, `\C` y `C:\repo` en cadenas de TS) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRITICOS abiertos y la correccion no abre ninguno.

## Reproduccion y verificacion empirica

Repo temporal con `rutas_documentacion: [docs/**, "*.md"]`, `comando_verificacion` que falla, ramas
`docs` (solo `docs/b.md`) y `code` (`src/y.ts`) sin verde; hook real por stdin desde `develop`; si
sale 0 se ejecuta y se mira si `src/y.ts` entra en `develop`. Control: el merge limpio de `docs` pasa
y no entra codigo; el de `code` bloquea.

### NUE-1 — corregido

Bloquean las 9 variantes (`-fB`, `-qB`, `-Bdocs`, `-\B` con barra real, `switch -fC`, `-Cdocs`,
`--force-c`, `--force-cr`, `-\C`, dentro de `bash -lc` y `sh -c '...'`), ademas de `checkout -f`,
`checkout -B develop code`, `git -C . checkout -B`, `git branch -f` y variantes de `branch` con `-f`/`-D`.
`--out`/`--outp` no existen en git 2.56. `git checkout code -- src/y.ts` antes del merge pasa el hook
pero no mete codigo (el merge falla con el indice sucio o el fichero queda sin commitear).

### NUE-2 — corregido

Bloquean `-m --abort/--quit/--skip/--continue` con segundo merge, dos fuentes, octopus, dos merges,
dos scripts, script + merge, `bash -c` anidados, `pwsh -Command`, `powershell -Command`, `cmd /c`, `&`,
`|`, `( ) && ( )` y `;`. Siguen pasando sin codigo: `git merge --no-ff -m x docs`, `-X theirs`,
`git -C . merge`, `cd . && git merge`, consultas seguidas de merge.

### CRI-1 y CRI-2 — corregidos

Siguen bloqueando el merge previo, `git branch -f`, `git checkout -b` y echo/cat/tee con `>`, `<`, `$`
o backtick.

### NUE-3 — los tests no cubren la barra invertida

En el `.ts`, `'git checkout -\B ...'` y `'git switch -\C ...'` valen `-B` y `-C` (`\B`, `\C` no son
escapes en JS): prueban la lista cerrada, no el rechazo de `\`; `'cd C:\repo'` lleva un `\r`. La barra
real si bloquea (probado a mano). Correccion: duplicar la barra en los tests.

### Notas (huecos que ya tenia el guardian, de TASK-072; no los causa esta tarea)

Con el hook real, `develop` recibe `src/y.ts` sin bloqueo en: (1) `git merge -m --abort code` (es
MEN-2); (2) `{ git merge --no-ff code; }`, `time git merge --no-ff code`, `eval git merge --no-ff code`
(el primer token no es `git` y `analizarComando` no ve el merge); (3) `git checkout README.md && git
merge --no-ff code` (`ramaDeCambio` toma el fichero como rama destino). La persona decide si van a
TASK-103. Observaciones: `git merge ... 2>&1` y `git -C "C:\ruta" merge` ya no reciben la exencion
(seguro, resta uso en Windows); un `\"` dentro de comillas dobles podria desincronizar `segmentar`
respecto de PowerShell (razonado, no reproducido).

Tests de guardia-documentacion, guardia-merge y guardia-heldout: 38/38.

## Lecturas fuera del contexto permitido

- `src/hooks/pre-tool-merge.ts`, cabecera de `src/hooks/guardia-merge.ts`, `dist/src/hooks/pre-tool-merge.js`: ejecutar el hook real.
- `revision/informe-revision-2.md`, la plantilla y `revision/peticion-revision-3.md`: contexto.
- El resto de `src/core/comando-merge.ts` (`segmentar`, `analizarComando`, `ramaDeCambio`): las notas dependen de ellos.
