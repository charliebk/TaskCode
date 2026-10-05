# Informe de revision — TASK-054 (ronda 1)

- Commit revisado: 7629ba0ba09a5d5dfb2d840ed04e233ab01943ec
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MENOR-1 | MENOR | aceptado (documentado) | src/fs/git.ts:235,507 ; src/fs/git-commit.ts:258,291 ; src/fs/sincronizacion.ts:422 |
| MENOR-2 | MENOR | aceptado (documentado) | src/fs/git.ts (diffRangeForPaths) |

Sin hallazgos CRITICO ni IMPORTANTE.

### MENOR-1 — Otros consumidores de salida de Git siguen partiendo por '
' sin -z
- Donde: `lsTreeNames` (git.ts:507), `git diff --cached --name-only` y `show --name-only` en git-commit.ts:258/291, `porcelain` en sincronizacion.ts:422.
- Que pasa: misma clase de fallo (rutas no ASCII entrecomilladas/escapadas en octal). Fuera del alcance declarado de la tarea (diff de revision); solo afectan a rutas bajo `tareas/`, que son ASCII por convencion (slug), y `localBranches` lista refs, no rutas. Los trims de `diffParaRevision` ya no existen en el camino de revision: `grep split(` confirma que nada del flujo review parte name-only por '
'.
- Reproduccion: `grep -n "split(" -r src` en el clon; no ejecutado un caso roto porque requeriria una tarea con ruta no ASCII bajo tareas/.
- Impacto: ninguno hoy; latente si alguien commitea ficheros de tarea con tildes.
- Sugerencia: aceptado, no corregir en esta tarea; anotar como deuda si se quiere.

### MENOR-2 — Renombrado: diffRangeForPaths con solo la ruta nueva muestra un alta, no un renombrado
- Donde: diffRangeForPaths / diffNameOnly.
- Que pasa: `git mv "ren/viejo ñ.ts" "ren/nuevo ó.ts"` aparece en `--name-only` solo como la ruta nueva (deteccion de renombrado) y el diff por pathspec de esa ruta sale como fichero nuevo completo. Es el comportamiento previo a TASK-054 (no regresion); con `diff.renames=false` global salen las dos rutas y todo cuadra.
- Impacto: el revisor ve el contenido completo, no un renombrado; sin perdida de informacion relevante.
- Sugerencia: aceptado.

## Que se ejecuto (reproduccion)

- Clon en directorio temporal, `npm install`, `npm test`: 1083 tests, 1080 pass, 3 fail (exactamente los 3 conocidos de Windows: approve "propaga cualquier error de stat", plan "propaga cualquier error de escritura", plan "rama base real ... estado distinto"). Sin EBUSY. Ningun cuarto rojo.
- Repo Git temporal con: tildes/ene, espacios, comilla simple, CJK, `[id].vue` junto a `i.vue`, renombrado con tildes (`git mv`), fichero borrado con tilde, fichero modificado. (`"`, `*`, `?` y barra invertida/espacio final no son creables en NTFS: no verificados; no verificado tambien el salto de linea en el nombre.) Resultado con `diffNameOnly`, `diffParaRevision` y `diffRangeForPaths` sobre el dist compilado:
  - nombres exactos sin comillas ni octal; el diff y el --stat tampoco llevan escapes octales;
  - exclusiones `docs/**`, `docs/guía/**`, `**/*.md` + `g/[[]id].vue`, `ren/**` (con renombrado), `st*r.ts`: `excluidos` correcto y `--stat` de excluidos con rutas legibles (incluye `ren/{viejo ñ.ts => nuevo ó.ts}`);
  - `diffRangeForPaths` ruta a ruta (11 rutas): cada una devuelve solo su propio fichero; `g/[id].vue` no arrastra `g/i.vue`.
- Config global hostil (`GIT_CONFIG_GLOBAL` con `core.quotepath=true` y `diff.renames=false`): `-c core.quotePath=false` lo sobreescribe; mismos resultados correctos.
- Mutaciones (con `review.test.js`, restauradas despues): (1) SIN_COMILLAS vacia: caen los 2 tests nuevos; (2) quitar `:(literal)`: cae el test de glob; (3) quitar `-z`: caen 5 tests (incluidos los 2 nuevos y 3 preexistentes). La red de regresion discrimina.
- `dist/` versionado: tras rebuild en el clon no hay diferencias con lo commiteado (en sincronia con src).
- No se ejercito el CLI `taskctl review` de extremo a extremo por separado ni una ronda 2 incremental con ficheros no ASCII: el test nuevo de review.test.ts (con tilde) cubre la ruta `runReviewCommand` real contra repo temporal y pasa; la ronda incremental usa las mismas funciones con otro `desde`. Declarado como no verificado aparte.
