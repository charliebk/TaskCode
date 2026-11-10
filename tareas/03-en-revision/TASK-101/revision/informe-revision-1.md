# Informe de revision — TASK-101 (ronda 1)

- Commit revisado: 0cfd4c0ca59fb7ba3a33cd50c6935ae4cf1e41b5 (la rama avanzo a a127b55, que solo anade la peticion)
- Revisor: revisor por pares independiente (agente general-purpose, skill code-quality-reviewer)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| CRI-1 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`GIT_SIN_EFECTO` incluye `merge`; lo consume `comandoSoloIntegra`) | implementacion |
| CRI-2 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`SIN_EFECTO_EN_RAMAS` con echo/tee/cat/git log/rev-parse; redirecciones y sustitucion de comandos no vistas por `segmentar`) | implementacion |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts (detalle con config del destino invalida) | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`MERGE_SIN_MERGE`; anterior a la tarea) | especificacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

El plan exige «sin exencion si el comando compuesto puede mover la fuente antes del merge»; la lista
blanca de `comandoSoloIntegra` no lo cumple (CRI-1 y CRI-2).

Preparacion comun: repos temporales con `rama_base: develop`, `comando_verificacion: "node -e 0"`,
`rutas_documentacion: [docs/**, "*.md"]`; ramas `docs` (solo `docs/b.md`) y `code` (`src/y.ts`) sin
verde guardado. Primero el hook real (`node dist/src/hooks/pre-tool-merge.js` con JSON por stdin,
desde `develop`) y despues el comando en `bash -c`.

### CRI-1 — Un `git merge` anterior en el mismo comando cuenta como «sin efecto»

`git checkout docs && git merge --no-edit code && git checkout develop && git merge --no-ff -m m docs`:
el hook sale con 0 y, al ejecutarlo, `develop` queda con `src/y.ts` (tambien con `;`). El primer
merge va a `docs` (no protegida); `merge` esta en `GIT_SIN_EFECTO`, asi que `comandoSoloIntegra`
devuelve true; el guardian evalua `docs` antes de ejecutar nada (solo documentacion) y deja pasar el
segundo. En la 0.14.0 se bloqueaba: regresion de esta tarea. Correccion: el paso 6b solo con
exactamente un merge o script de cierre en el comando.

### CRI-2 — Los comandos «de lectura» de la lista blanca pueden mover la rama fuente

`segmentar` no ve redirecciones ni sustituciones; todos estos devolvieron 0:
1. `git rev-parse code > .git/refs/heads/docs && git merge docs`
2. `echo <sha de code> > .git/refs/heads/docs && git merge docs`
3. `echo <sha de code> | tee .git/refs/heads/docs && git merge docs`
4. `cat .git/refs/heads/code > .git/refs/heads/docs && git merge docs`
5. `echo "$(git branch -f docs code)" && git merge docs`
6. `git log "$(git branch -f docs code)" && git merge docs`
7. ``git log `git branch -f docs code` && git merge docs``
8. PowerShell: `git rev-parse code > .git/refs/heads/docs; git merge docs`

De extremo a extremo con la 5 y la 1: hook con 0 y `src/y.ts` en `develop`. Si bloquean
`echo $(...)` sin comillas, `git update-ref`, `git fetch . code:docs`, `git push . code:docs`,
`git reset`, `git branch -f`, `Out-File`/`Set-Content`: el fallo es de la lista blanca. Correccion:
sin exencion con `>`, backtick, `$(`, `${`, `<(`; quitar echo, tee y cat; o gramatica estricta y
false ante cualquier caracter no esperado.

### MEN-1 — Texto del bloqueo distinto de la 0.14.0 con la config del destino invalida

Sin `rutas_documentacion` en ninguna config pero con la del destino invalida, el mensaje anade «La
configuracion de "develop" no es valida...». Sigue bloqueando; con config valida sin rutas, o sin
config, el mensaje es identico al de la 0.14.0. Aceptar y documentar, o ajustar el texto.

### MEN-2 — `git merge -m --abort code` no se detecta como merge (anterior a la tarea)

`analizarComando` descarta un merge con `--abort|--continue|--quit|--skip` en los argumentos aunque
sean el valor de `-m`; el hook sale con 0 sin verde, igual que en la 0.14.0. Tarea aparte.

## Reproduccion y verificacion empirica

Sin hallazgo, con el guardian real: sin rutas (mensaje y decision identicos a la 0.14.0), octopus
(bloquea; cada par por separado), `git -C .`, `FOO=1 git merge`, `bash -c`, `;`, `||`, saltos de
linea, `--allow-unrelated-histories` (completa), mayusculas con `core.ignorecase=true` (`DOCS/evil.ts`
cuenta como codigo), held-out (codigo), `.taskcode/config.yml` (completa), config del destino frente a
otra rama (manda el destino). Tests de guardia-documentacion, guardia-merge, guardia-heldout y
finish-documentacion: 46/46; ninguno cubre CRI-1 ni CRI-2.

## Lecturas fuera del contexto permitido

- `src/hooks/pre-tool-merge.ts`, `src/core/heldout.ts`, `src/fs/config-de-ref.ts`, `src/fs/git.ts`,
  `src/core/verificacion-proporcional.ts`: trazar el flujo del hook y la regla de held-out.
- `planificacion/brainstorm/salida-brainstorm-riesgos-1.md`: confirmar que el riesgo estaba en el plan.
