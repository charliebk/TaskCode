# Informe de revision — TASK-114 (ronda 1)

- Commit revisado: 97e6e77579454c2352597d8a12327c4c669e8382
- Revisor: code-quality-reviewer
- Veredicto: aprobada-con-correcciones

(Modo rapido: sin suite completa ni verificar-impacto. Pase generico, profundidad: a fondo en guardia-heldout.ts, guardia-merge.ts y pre-tool-merge.ts.)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts (prefiltro en src/hooks/pre-tool-merge.ts:22) | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:73 | implementacion |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts:74-89 y skills/task-workflow/heldout.md:45-47 | plan |

## Reproduccion

Tests ejecutados (Git Bash, desde taskcode-plugin): `npm run build` limpio y
`node --test dist/test/hooks/salida-temprana.test.js dist/test/hooks/guardia-heldout.test.js dist/test/hooks/guardia-merge.test.js dist/test/hooks/guardia-documentacion.test.js`: 56 tests, 56 pasan, 0 fallan.

### Casos borde de INVOCA_GIT_O_CIERRE y del prefiltro (sin hallazgo de peso)

Comparado `analizarComando`/`cierresDeMerge` (lo que el guardian reconoce como integracion) contra `comandoCandidato`. Siguen llegando al guardian: `& git merge x`, `git.exe merge x`, `"C:\Program Files\Git\cmd\git.exe" merge x`, `sh -c "git merge x"`, `pwsh -Command "& git merge x"`, `cmd /c git merge x`, `git -C . merge x`, `git commit -m x`, `GIT MERGE x`, `bash scripts/merge-feature-to-develop.sh f`, `bash merge-hotfix-to-main.sh h`, `sh "merge-feature-to-develop.sh" f`, script entre comillas simples. El reconocimiento de nombre de programa del analizador es por basename `git`/`git.exe`, que la regex `\bgit\b` siempre ve en el texto crudo; no hay camino de merge reconocible que se pierda salvo los de MEN-2.

### MEN-1 — el prefiltro de pre-tool-merge.ts no tiene test que lo discrimine

Reproducido por mutacion: copia de `dist/src` en carpeta temporal con la linea `puedeIntegrar` sustituida por `/merge|commit/i.test(texto)` (sin `git|\.sh`). Con `grep -rn merge src` y PATH vacio el hook sigue saliendo 0 y con stderr vacio, igual que el original, porque el guardian carga y `comandoCandidato` devuelve null. El test de `salida-temprana.test.ts` (tercer test, lanzamiento real) pasaria igual: la unica diferencia es el coste de carga, que no se asevera. La parte de `comandoCandidato` si esta protegida; la del punto de entrada, no. Opcional: aseverar que con el prefiltro el modulo no se carga (p. ej. `NODE_OPTIONS` con un hook de `--import` que registre cargas) o aceptar el hueco documentandolo.

### MEN-2 — escrituras con comillas partidas esquivan la regla (el guardian antes las veia)

Tokenizador del guardian quita comillas, la regex mira el texto crudo. Reproducido: `g''it merge x` y `"g"it merge x` dan `analizarComando` = 1 operacion de merge y `comandoCandidato` = null (antes de la tarea, contenian `merge` y llegaban al guardian). Tambien `bash merge-feature-to-d""evelop.sh f` (el prefiltro lo deja pasar, la regex del guardian no). Es ofuscacion deliberada, no un despiste; el guardian se declara freno contra despistes y la puerta de `finish` sigue. Se acepta o se documenta en el comentario de `INVOCA_GIT_O_CIERRE` (el plan solo menciona alias).

### MEN-3 — la premisa «sin comando_heldout no hay held-out» no es del todo cierta

`finish-heldout.ts:19` aborta cuando hay held-out y falta `comando_heldout` (no los ignora), y lee la clave de la config de la BASE, mientras `declaraHeldout` lee la del arbol de trabajo de la rama de la tarea. Si la rama se abrio antes de que la base declarase la clave (o la clave solo esta en la base), el guardian queda apagado en esa rama aunque `finish` vaya a exigir y ejecutar los held-out. Estrecho y consecuencia acotada (freno contra despistes), pero la frase de `heldout.md` («sin la clave no hay held-out que proteger») debe matizarse, o el riesgo aceptado del plan debe recoger este caso.

### Comprobado sin hallazgo

- `declaraHeldout` desde subdirectorio (cwd `sub/deep`): sube hasta `.git`, devuelve true con clave y el hook bloquea (2).
- Worktree (`.git` fichero): `existsSync` lo acepta; lee la config del worktree.
- Config ilegible (YAML roto, `config.yml` que es directorio), `comando_heldout:` vacio, `""`, `''`, solo comentario: devuelven true (siguen protegiendo, coherente con el plan). Sin la clave o sin config: false.
- stderr: `parsearConfig` no emite avisos; con una clave desconocida en la config el hook sale 2 con stderr solo del bloqueo, sin avisos extra. Ausencia de ruido confirmada.
- Mutacion de la salida de `decidirHeldout` (quitar el `declaraHeldout`): el primer test la cubre (en la rama TASK-901 con git disponible bloquearia).
- Los cambios de `guardia-heldout.test.ts` solo anaden la config con `comando_heldout` al repo de fixtures; no debilitan ninguna asercion.

## Lecturas fuera del contexto permitido

- src/core/comando-merge.ts, src/core/config.ts (raizDelRepo, parsearConfig), src/commands/finish-heldout.ts, src/hooks/pre-tool-lectura.ts: para contrastar con lo que el guardian reconoce, como se resuelve la config y como `finish` usa `comando_heldout` (casos borde pedidos en el encargo).
