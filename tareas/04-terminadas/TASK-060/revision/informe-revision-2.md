# Informe de revision — TASK-060 (ronda 2)

- Commit revisado: c9efcb30e3506a071c88e43200e9f0f213ca4bc8
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Puerta y metodo

- Clon limpio en `C:\t\rev060r2`, rama de la tarea. `npm install` y `npm run build`: dist/src coincide con el fuente (solo `package-lock.json` lo toca `npm install`, restaurado).
- `npm test` completo, una vez: **1246 tests, 1243 pasan, 3 fallan**, exactamente los tres conocidos en Windows (approve: stat no ENOENT; plan: escritura no EEXIST; plan: rama base con estado distinto). Ningun cuarto rojo.
- Linter: el proyecto no tiene.
- Reproduccion con `runFinishCommand` real (mismo camino que el CLI), repos Git temporales con remoto bare real y el doble `plataforma-doble.ts`, en un fichero de escenarios propio (no se commitea): 44 casos, todos verdes. Matriz GitHub y GitLab x merge/squash/rebase x primer finish con y sin `--push`.

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/commands/finish.ts:comprobarRamaIntegrada |
| MEN-1 | MENOR | corregido | skills/task-workflow/avance.md:22-30 |
| MEN-2 | MENOR | corregido | scripts/gitflow/merge-hotfix-to-main.sh, merge-release-to-main.sh |
| MEN-3 | MENOR | aceptado (desvio) | src/commands/finish.ts (modoMergeRequest) |
| MEN-4 | MENOR | aceptado (desvio) | src/core/config.ts / skills/finish/SKILL.md |
| MENOR-5 | MENOR | abierto (nuevo, no bloquea) | test/commands/finish-merge-request.test.ts |
| MENOR-6 | MENOR | abierto (nuevo, no bloquea) | src/commands/finish.ts:comprobarRamaIntegrada |

### IMP-1 — corregido

- Caso exacto de la ronda 1 (primer finish sin `--push`, commit `extra` local, la plataforma mergea, segundo finish): ahora aborta con `tiene 1 commit(s) locales que no estaban en el merge request cuando se mergeo («extra»), asi que NO estan en "develop". Subelos (git push origin <rama>) y que la plataforma los integre en otro merge request (borra la seccion "## Merge request" de tarea.md para abrirlo), o descartalos. No se ha tocado nada.` La huella (HEAD, rama, develop local, tags, carpeta de la tarea, develop en el bare) queda identica. Ejecutado en las 12 combinaciones (gh/glab, merge/squash/rebase, con/sin `--push`).
- Caso inverso (commit subido a origin DESPUES de mergear): aborta con `"origin/<rama>" avanzo DESPUES de que la plataforma mergeara ... (integro X, la rama en origin esta en Y)` y la sugerencia de abrir otro MR; huella intacta. Mismas 12 combinaciones.
- Sin flags (solo la seccion `## Merge request`) y con `--tag v1`: abortan igual y no crean ningun tag (comprobado `git tag -l` vacio).
- La anotacion legitima no bloquea: cierre completo (`terminada`) en las 12 combinaciones, incluido el primer finish CON `--push` (anotacion subida y `headRefOid`/`sha` apuntando a ella).
- Sin regresiones buscadas: `headCommit` null (plataforma no lo informa) cierra si solo esta la anotacion y aborta si hay un commit extra (referencia = origin/<rama>); rama borrada en origin tras mergear (la plataforma borra la rama de origen) cierra, y con un commit extra aborta; un commit de `chore(TASK-700): coste ...` posterior al primer finish tambien se bloquea (ver MENOR-6).
- Los mensajes dicen que hacer (subir, abrir otro MR borrando la seccion, o descartar) y que no se toco nada.

### MEN-1 — corregido

`avance.md` ya matiza la regla: la rama de un merge request se sube siempre con `finish --merge-request`, en `automatico` con `cierre_por_defecto: merge-request` sin preguntar, y el tag nunca sin `--push`. Coherente con la salida y el CHANGELOG. (Dos lineas del parrafo quedaron cortas por el reflujo, cosmetico.)

### MEN-2 — corregido

`bash merge-hotfix-to-main.sh hotfix/x --develop develop --tag` y el equivalente de release: salen con 1 y `--tag necesita un nombre (--tag v1.2.0). No se ha tocado nada.` Comprobado con un repo temporal: ningun tag creado, rama y main intactas. Test nuevo en `merge-to-main-tag.test.ts`.

### MEN-3 y MEN-4 — sin cambios

Siguen aceptados como desvios declarados, segun el juicio de la ronda 1. Nada de esta ronda los afecta.

### MENOR-5 — la rama de `referencia = head` no tiene test que la proteja

- Donde: `comprobarRamaIntegrada` (`referencia = head ... : remota`) y `finish-merge-request.test.ts`.
- Reproduccion: mutante `const referencia = remota;` en `dist/src/commands/finish.js` contra `finish-merge-request.test.js`: **30 pasan, 0 fallan** (sobrevive). Solo lo mata un escenario que borra tambien `refs/remotes/origin/<rama>` y deja un commit local extra (mi caso "rama borrada + extra local aborta": 43 pasan, 1 falla). Con la ref remota rancia (fetch sin prune) la referencia coincide y el mutante es indistinguible.
- Impacto: la proteccion para "la plataforma borro la rama de origin y quedan commits locales sin subir" no esta cubierta; una refactorizacion podria perderla en silencio.
- Sugerencia: un test con `git update-ref -d refs/remotes/origin/<rama>` y la rama borrada en el bare, con y sin commit extra.

### MENOR-6 — limites conocidos del filtro de la anotacion (no corregir, documentar)

- El filtro es por asunto exacto `chore(TASK-NNN): merge request abierto`. Un commit extra con ese mismo asunto pasa (probado: cierra `terminada`); es una suplantacion deliberada, no un uso real.
- Cualquier otro commit posterior al primer finish, aunque sea de `taskctl` (p. ej. `chore(TASK-NNN): coste revision +N tokens`), bloquea el cierre con el mensaje correcto. Es honesto (no estan en el MR), pero obliga a subirlos y abrir otro MR. No se juzga fallo; conviene una linea en la skill `finish`: «no commitees nada en la rama entre el primer finish y el segundo».

## Mutacion (guardas nuevas, contra `finish-merge-request.test.js`)

| Mutante | Resultado |
|---|---|
| M1 desactivar la guarda "origin/<rama> avanzo despues del merge" | MUERTO (1 rojo: el test de commits subidos tras mergear) |
| M2 quitar el filtro de la anotacion | MUERTO (11 rojos: todos los cierres legitimos) |
| M3 quitar la guarda `sinIntegrar.length > 0` | MUERTO (2 rojos: merge y squash con commit local) |
| M4 ignorar `headCommit` (ni guarda ni referencia) | MUERTO (1 rojo) |
| M5 referencia siempre `remota` | SUPERVIVIENTE en la suite del implementador (MENOR-5); muerto con mi escenario |

Estado final del clon revisor: dist restaurado con `git checkout` tras cada mutante; solo queda sin commitear mi fichero de escenarios (el clon se descarta).

## Veredicto propuesto

`aprobada-con-correcciones`: IMP-1, MEN-1 y MEN-2 estan cerrados y verificados; no hay CRITICO ni IMPORTANTE abiertos. Quedan dos MENOR nuevos (MENOR-5 test, MENOR-6 nota de skill) que no justifican otra ronda.
