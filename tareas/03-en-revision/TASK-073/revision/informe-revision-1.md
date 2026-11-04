# Informe de revision — TASK-073 (ronda 1)

- Commit revisado: d6a0239b16ad16636c9ee70c99051f97af620da8
- Revisor: general-purpose (opus) con la skill code-quality-reviewer, independiente de la implementacion
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/commands/finish-heldout.ts (huella y su remedio) | implementacion |
| IMP-2 | IMPORTANTE | abierto | src/commands/finish-heldout.ts (guardas de arbol sucio y rama activa sin test) | implementacion |
| MEN-1 | MENOR | abierto | src/commands/finish-heldout.ts (hotfix compara con develop) | plan |
| MEN-2 | MENOR | abierto | src/commands/finish-heldout.ts (`comando_heldout` leido de la rama) | plan |
| MEN-3 | MENOR | abierto | src/core/heldout.ts (`Aceptacion/` con mayuscula queda fuera) | implementacion |
| MEN-4 | MENOR | abierto | src/core/config.ts (`timeout_verificacion` sin `comando_verificacion` aborta) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

Clon en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-073-r1` (borrado), HEAD 34d6d7f, build sin
errores. `finish-*.test.js` (10 ficheros), `review-exclusion.test.js` y `skills/task-workflow.test.js`:
162 tests, 161 en verde; el rojo es la contraprueba de descubrimiento 14 (`README_MISSING` del
validador de esta maquina), ajena al diff. 10 escenarios propios con fixtures reales (borrados).

Mutantes: quitar `|| distintas.length > 0` (rojo), quitar `EXCLUIR_HELDOUT` de review.ts (rojo), no
pasar `HELDOUT_DIR` (rojo), añadir `r.cola` al mensaje rojo (rojo por el canario); **sobreviven**
`if (!isWorkspaceClean)` -> `if (false)` y `if (actual !== o.rama)` -> `if (false)` (IMP-2).

### IMP-1 — el remedio de la huella no funciona en el flujo real y acusa a la rama cuando cambio la base

En el flujo real `start` y `review` mueven la carpeta de la tarea (en la rama los held-out estan en
`03-en-revision/TASK-N/aceptacion`, en develop siguen en `01-en-diseno/...`); el fixture no la mueve,
asi que el remedio nunca se probo. Escenario B: la rama nace con los held-out y los mueve; la persona
corrige el held-out en develop (lo que manda `heldout.md`); `finish` aborta diciendo que la rama los
edito (falso) y propone `git checkout develop -- tareas/01-en-diseno/TASK-802/aceptacion`, que deja
DOS carpetas en la rama; el siguiente `finish` vuelve a abortar igual: bucle. Lo mismo si el
implementador edita de verdad en 03. Funciona: mergear develop en la rama (C), o restaurar sobre la
ruta de la rama (`git rm -r -q <rutaRama> && git read-tree --prefix=<rutaRama>/ <base>:<rutaBase> &&
git checkout -- <rutaRama>`). Arreglo: distinguir con el merge-base (si la rama no los toco y la base
si: «integra la base»); remedio sobre la ruta de la rama; test con la carpeta movida.

### IMP-2 — dos guardas sin test

Sin la guarda de arbol sucio, un held-out verde que escribe fuera de `logs/` hace que el script salga
0 sin mergear y `finish` diga «revisa el repo a mano». Sin la de rama activa, los held-out se
ejecutarian sobre otra rama. Un test por guarda.

### MEN-1 — hotfix con held-out aborta siempre con un mensaje falso

La rama de un hotfix nace de main y la puerta compara con develop. Decidir (comparar con main en
hotfix, o documentarlo) y probarlo.

### MEN-2 — la rama puede neutralizar la puerta cambiando `comando_heldout`

Se lee de la config de la rama: con `"node -e 0"` y el held-out en rojo, `finish` cierra. Visible en
el diff y contra despistes; arreglo barato: leerlo de la config de la rama base.

### MEN-3 — `Aceptacion/` con mayuscula queda fuera sin aviso

El regex y el glob distinguen mayusculas; en NTFS/macOS es facil equivocarse. Avisar o abortar.

### MEN-4 — `timeout_verificacion` sin `comando_verificacion` aborta aunque haya `comando_heldout`

La regla de validacion deja de ser cierta con esta tarea.

### Comprobado y correcto

Flujo con la carpeta movida (verde, `HELDOUT_DIR` en 03); `rama_base: integracion` (rojo y verde);
held-out commiteados en develop tras `start` y traidos con merge (pasa; sin merge, IMP-1); la salida
roja no filtra nada ni por codigo ni por timeout; `--sin-verificacion` no la salta; la exclusion del
diff funciona con `excluir_de_revision: []`.
