## Enfoque

Comando hermano ligero de `review`/`finish`: `resultingState('codex-review', ...)`
ya deja el estado en `en-revision` (no lo cambia), así que no mueve carpeta ni
toca `tarea.md` — solo valida precondición, invoca `codex review`, escribe
`informe-codex-N.md` en `revision/` (ya creada por `review`) y hace el mismo
`autoCommit` del paso 5 que ya usan review.ts/finish.ts.

## Piezas y limites

- `src/commands/codex-review.ts` — se crea — ningún comando existente envuelve un binario externo (git/bash sí, un CLI ajeno no).
- `src/cli.ts` — se extiende — rama `if (cmd === 'codex-review')` junto a 'review'/'finish' (líneas ~440-524), mismo try/catch más un `CodexReviewCommandError` propio.
- `src/core/state-machine.ts` — no se toca — caso `'codex-review'` (línea ~211) y bloque `finish` (línea ~266) ya cierran el contrato.
- `src/commands/finish.ts` — no se toca — `INFORME_CODEX_RE`/`informesDeLaRonda` (líneas 76, 113-136) ya leen `informe-codex-<n>.md`; solo hay que escribir ese nombre.
- `src/fs/git.ts` — se extiende — reusar `headCommit`, `resolveBaseBranchForTipo` y el patrón `spawnSync` + `result.error` de `runGit` (líneas 54-63) para lanzar `codex` en vez de `git`.
- `src/fs/rondas.ts` (`siguienteRonda`) — se extiende — mismo cálculo que review.ts:283, con regex propio `informe-codex-(\d+)\.md` (Codex no se fragmenta por dominio, nota explícita en finish.ts:149).

## Orden de construccion

1. Wrapper de spawn para `codex` que detecta ausencia vía `result.error.code === 'ENOENT'` sin lanzar (mismo patrón que `runGit`, pero sin `GitLaunchError`: aquí ausencia se degrada, no se corta).
2. `runCodexReviewCommand`: lee tarea, `assertTransitionAllowed('codex-review', task, ctx)` con `revisionPrimariaAprobada` recalculado igual que `buildTransitionContext` en finish.ts:153.
3. Si `codex` ausente: aviso por stdout, sin escribir informe, código de salida 0 (criterio de aceptación 3).
4. Si presente: `codex review --base <baseBranch> --commit <headCommit>`, volcar su salida en `informe-codex-<ronda>.md` dentro de `revision/`.
5. `autoCommit` del directorio de la tarea, mismo patrón que review.ts:359-364.

## Alternativa descartada

- Rama condicional dentro de `review.ts` en vez de comando propio — descartada: la petición exige que la salida de Codex no se mezcle con la de revisión primaria y que se invoque en un momento distinto (solo tras revisión primaria aprobada), lo que ya fija `assertTransitionAllowed` como transición separada.
- Fragmentar por dominio como `review` (vía `clasificarPorDominio`) — descartada: finish.ts:149 ya documenta que Codex es "un único agente independiente, no un enrutado por dominio"; introducirlo aquí contradiría esa decisión ya tomada.

## Desacuerdos previstos

- con riesgos — código de salida cuando `codex` falta: sostengo 0 (no romper el flujo, criterio 3); el bloqueo real ya lo impone `finish` exigiendo `revisionCodexAprobada`, no hace falta que `codex-review` también falle duro.
- con testing — si el spawn de `codex` debe inyectarse como dependencia (`deps.runCodex`) para no depender de que el binario esté o no en el PATH del entorno de test — mi posición: sí, mismo patrón que `deps.scriptsDir` en review/finish.

## Suposiciones no verificadas

- Que `codex review` imprime el informe completo por stdout y no a un fichero — solo leí `codex review --help`, no ejecuté una revisión real contra un diff; falta confirmar si mezcla logs con contenido útil.
- Que la salida de Codex no trae ya una línea `- Veredicto:` en el formato que `veredictoAprobado` (finish.ts:91) exige — puede hacer falta envolverla en una plantilla propia en vez de volcarla tal cual.
- Que la numeración de ronda de Codex reutiliza el mismo contador que la revisión primaria (mismo N) — no verificado contra ninguna tarea real con `revision_codex: true` ya cerrada.
