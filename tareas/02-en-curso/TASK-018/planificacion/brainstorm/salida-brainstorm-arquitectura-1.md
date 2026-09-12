## Enfoque

Clasificar `git diff --name-only` por `patrones_archivo` (ya declarados y
probados en las 4 skills revisoras) con `path.matchesGlob`, e insertar esa
clasificación en `runReviewCommand` para generar una peticion+informe por
dominio detectado (hasta el umbral de `code-quality-reviewer`) o una única
genérica, igual que hoy. Hoy `patrones_archivo` solo lo lee un test
(`bloqueYaml()` en revisores.test.ts): no existe lector en producción.

## Piezas y limites

- `src/fs/git.ts` — se extiende — falta `diffNameOnly(desde,hasta,cwd)`; precedente ya existe en `lsTreeNames` (`git ls-tree --name-only`), y falta un diff acotado a pathspec para el sub-diff por dominio.
- Loader de metadatos de revisor (`patrones_archivo`/`fallback`/`umbral_dominios`) — se crea en `src/core/` — hoy solo vive como helper de test; debe promoverse a producción reusando `parseBloqueClaveValor`, mismo fail-closed que `catalogo-skills.ts`.
- `src/commands/review.ts` — se extiende — clasificación entre `diffRange`/`logOneline` y la escritura de ficheros; el resto del flujo (autoCommit, moveTareaFile, doble lectura) no cambia.
- Convención de nombre de fichero por dominio — se crea — sigue el precedente YA EXISTENTE de `informe-codex-N.md` (prefijo propio por revisor, TASK-020), no un sufijo nuevo sobre `informe-revision-N.md`.
- `src/commands/finish.ts` — se extiende — `buildTransitionContext`/`ultimoInforme` deben enumerar N informes de dominio de la ronda y exigir que TODOS aprueben (ausente = no aprobado, mismo fail-closed que ya rige con Codex).
- `src/fs/rondas.ts` (`siguienteRonda`) — se extiende — el contador debe seguir siendo uno por ronda, compartido entre los ficheros de todos los dominios de esa ronda (ver desacuerdo).

## Orden de construccion

1. `diffNameOnly` + diff acotado por pathspec en `git.ts`, con test propio.
2. Loader de metadatos de revisor en `src/core/`, migrando la lógica de `bloqueYaml()` desde el test a producción (revisores.test.ts pasa a importarlo).
3. Función pura de clasificación (ficheros → dominios, aplica umbral), testeable sin tocar Git real.
4. Integrar en `review.ts`: generar N peticiones/informes por ronda.
5. Extender `finish.ts` para exigir aprobación de todos los informes de dominio antes de `revisionPrimariaAprobada`.

## Alternativa descartada

- Mover `patrones_archivo` a un `scripts/catalogo-revisores.yml` plano, calcado de `catalogo-skills.yml` — descartada: duplicaría la fuente de verdad que ya vive y se prueba contra las 4 SKILL.md (revisores.test.ts ya asevera ahí); forzaría reescribir esas skills y su suite sin necesidad real.
- Reutilizar `seleccionarSkill()`/`catalogo-skills.ts` para este enrutado — descartada: esa función empareja `etiquetas` de la tarea, no ficheros del diff; son dos mecanismos de enrutado distintos y mezclarlos bajo la misma función confunde cuál manda.

## Desacuerdos previstos

- con riesgos — sobre si "0 dominios casan" y "más de `umbral_dominios`" pueden solaparse en runtime: mi posición es que son ramas mutuamente excluyentes de la clasificación (una cae a genérico por defecto, la otra por exceso), no un caso límite a resolver aparte.
- con testing — sobre dónde viven los tests de fragmentación: mi posición es que la función de clasificación (ficheros→dominios) necesita su propio fichero de test, aislada de I/O de Git, separada de los tests de extremo a extremo de `review.ts`.

## Suposiciones no verificadas

- No he leído `src/fs/rondas.ts` a fondo: asumo que `siguienteRonda` puede seguir devolviendo un único número compartido entre los ficheros de todos los dominios de una ronda sin romper otros consumidores — habría que confirmarlo.
- No he leído `src/core/state-machine.ts`: asumo que combina `revisionPrimariaAprobada && revisionCodexAprobada`; habría que confirmar cómo se pliega ahí una aprobación de N dominios antes de tocarlo.
- No he leído `docs/PROPUESTA_METODOLOGIA.md` (sección 14, punto 16) citado en la petición: asumo que coincide con `umbral_dominios: 3` de `code-quality-reviewer/SKILL.md`, pero no he verificado el documento fuente de la decisión #16.
