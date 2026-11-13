# Informe de revision — TASK-113 (ronda 3)

- Commit revisado: 442a553c10ff04531c25867b06416e381a2084e7 (el HEAD posterior e2a916c solo toca `tareas/`, verificado con `git show --stat`)
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| NUEVO-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts:279-284 (default de `excluir_de_revision`); skills/task-workflow/sincronizacion.md:98 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:659-675; src/commands/review.ts:494-508 (sin cambios en esta ronda; tests en verde) | plan |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:305-313 (sin cambios en esta ronda) | plan |

No hay CRITICO ni IMPORTANTE abiertos. Ningun hallazgo nuevo de esta ronda entra en la tabla: las notas de abajo son MENOR o decisiones de la persona y no abren ronda.

### NUEVO-1 — corregido

- Donde: src/core/config.ts:279-284 (`CONFIG_DEFAULTS.excluir_de_revision`).
- Que pasaba: el patron `**/*-lock.*` casaba con codigo real (`src/services/redis-lock.ts`) y lo sacaba de la revision y de la puerta de `finish`.
- Estado tras la correccion: el default es `**/dist/**`, `**/*.lock`, `**/*-lock.json`, `**/*-lock.yaml`, `**/*-lock.yml`, `**/*-lock.toml`, `tareas/**`. El fallo original ya no ocurre.
- Reproduccion: script `repro.mjs` (en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-113-r3`, borrado al final) que llama a `codigoCambiado` de `dist/src/commands/verificar-menores.js` sobre un repo Git temporal con base `src/a.ts` y un commit posterior que cambia `src/a.ts` y anade `src/services/redis-lock.ts` y `src/x/file-lock.service.ts`.
  - Con la configuracion por defecto: los dos ficheros de codigo SI aparecen como codigo sin revisar.
  - Con el patron antiguo (`.taskcode/config.yml` con `[**/dist/**, **/*.lock, **/*-lock.*, tareas/**]`): los dos quedan excluidos, es decir, se reproduce el fallo original.
- Tests: `verificar-menores.test.ts:219` ("un fichero de codigo con -lock en el nombre si es codigo sin revisar") en verde.
- Impacto: resuelto.

### Cobertura de lockfiles con el default actual

Cubiertos (excluidos del diff y de la puerta): `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `Cargo.lock`, `poetry.lock`, `Pipfile.lock`, `uv.lock`, `pdm.lock`, `composer.lock`, `Gemfile.lock`, `pubspec.lock`, `deno.lock`.

No cubiertos: `npm-shrinkwrap.json`, `bun.lockb`, `packages.lock.json` (NuGet), `pylock.toml`, `Package.resolved` (SwiftPM), `gradle.lockfile`, `.terraform.lock.hcl`.

Ninguno de los no cubiertos lo estaba con el patron antiguo `**/*-lock.*`. La correccion no pierde ningun lockfile frente a la version anterior. Lo unico que deja de excluirse respecto al antiguo son ficheros `*-lock.<otra extension>`, y ninguno es un lockfile habitual.

### Copias del valor por defecto

- `skills/task-workflow/sincronizacion.md:98`, `src/core/config.ts:276-286` y `dist/src/core/config.js`: coinciden en contenido y orden.
- `src/core/config.ts:918` (`EJEMPLO_PATRONES.excluir_de_revision`, y su copia compilada en `dist/src/core/config.js:688`): el ejemplo del error de forma es `[**/dist/**, **/*.lock]`. Diverge del default (omite `**/*-lock.*` o sus sucesores y `tareas/**`). Es preexistente y no lo introduce esta correccion; se documenta como MENOR en las notas.
- Sin mas copias divergentes en `README.md`, `docs/` (`configuracion.md` solo cita la clave), `skills/` (`rust-wasm-reviewer/SKILL.md:81-84` cita `**/*.lock`, que sigue siendo correcto) ni `src/` (`config.ts:14` dice "dist, locks, tareas", que es generico).
- Los registros historicos (`tareas/04-terminadas/*`, `docs/auditoria/*`) citan el valor antiguo. Son historia y no se tocan.

## Verificacion ejecutada

- `npm run build` (tsc) en `taskcode-marketplace/plugins/taskcode-plugin`: sin errores. Despues, `git status` limpio: `dist/` coincide con `src/` en 442a553.
- `node --test dist/test/commands/review-exclusion.test.js dist/test/commands/verificar-menores.test.js dist/test/commands/review-tests-stat.test.js`: tests 23, pass 23, fail 0, cancelled 0, skipped 0.
- Reproduccion de NUEVO-1 y de la cobertura de lockfiles: `repro.mjs` en dos modos (default y patron antiguo), salida descrita arriba.
- Mutacion, por lectura y no ejecutada en disco (no toco el repo): si se vuelve a `**/*-lock.*`, `review-exclusion.test.ts:163-170` falla al comparar el default exacto, y `verificar-menores.test.ts:219-231` falla porque `redis-lock.ts` deja de bloquear.
- No ejecutados, por encargo: la suite completa, `npm test` y `scripts/verificar-impacto.mjs`.

## Notas fuera de la tabla (no abren ronda)

1. MENOR, decision de la persona: los lockfiles de la lista de no cubiertos siguen siendo codigo sin revisar. Si cambian, `review` los embebe y `verificar-menores`/`finish` los bloquea. No es regresion de esta correccion, ya pasaba. Si se quieren excluir, hay que anadirlos al default (`**/npm-shrinkwrap.json`, `**/bun.lockb`, `**/packages.lock.json`, `**/pylock.toml`, `**/Package.resolved`, `**/gradle.lockfile`, `**/.terraform.lock.hcl`), con cambios en config.ts, sincronizacion.md y los tests de default.
2. MENOR, decision de la persona: el patron `*-lock.{json,yaml,yml,toml}` tambien casa con ficheros que no son lockfiles. Reproducido: `src/x-lock.toml`, `src/data/feed-lock.json` y `config/app-lock.yaml` quedan fuera de la revision y de la puerta de `finish`. Son datos o configuracion, no codigo habitual. Es aceptable si la persona lo acepta; si no, se puede acotar a nombres exactos.
3. MENOR, preexistente: `src/core/config.ts:918` (ejemplo del error de forma) diverge del default, como se dice arriba. Basta con alinear el ejemplo, o generarlo desde `CONFIG_DEFAULTS`.
4. MENOR: el comentario de `src/core/config.ts:279` cita "TASK-113 (IMPORTANTE de la ronda 2)". Referencia a una ronda de revision que caduca; conviene dejar solo el motivo (`redis-lock.ts`).
5. Fuera del delta, sin cambios ni verificacion en esta ronda: las tres notas de la ronda 2 (`statDeFicheros` trocea por numero de rutas y no por bytes; `diffRangeForPaths` con el mismo riesgo de ENAMETOOLONG; `review` aplica la exclusion relativa al cwd y `verificar-menores` con `:(top)`).

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md`: lo exige la skill revisora antes de empezar, para el veredicto y la plantilla.
- `tareas/03-en-revision/TASK-113/revision/informe-revision-2.md`: lo pidio la peticion de la ronda 3.
- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts:70-100` (`fueraDeTareas` y `codigoCambiado`): es el consumidor del patron por defecto, necesario para evaluar NUEVO-1.
- `taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts:906-922` (`EJEMPLO_PATRONES`): para localizar la copia divergente del ejemplo.
- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/revisores-rango.ts` y `src/core/heldout.ts`: solo con grep, para confirmar que `excluirDeRevision` y `EXCLUIR_HELDOUT` no tienen copia del default.
- `taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md`, `docs/configuracion.md` y `dist/src/core/config.js`: solo con grep, para buscar copias del valor por defecto.
