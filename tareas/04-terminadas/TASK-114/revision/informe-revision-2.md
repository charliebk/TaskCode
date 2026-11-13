# Informe de revision — TASK-114 (ronda 2)

- Commit revisado: ab982f33c45691cd8e1f283cdbc449006b235630 (HEAD f1724ca solo anade la peticion de revision: `git diff --stat ab982f3 HEAD` toca unicamente ficheros de tareas/, sin cambios de codigo)
- Revisor: code-quality-reviewer (verificacion acotada, ronda 2)
- Veredicto: aprobada

(Verificacion acotada: se comprueban MEN-1, MEN-2 y MEN-3 y que la correccion no abre fallos. La suite completa y `verificar-impacto` no se han ejecutado en esta ronda, por encargo.)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/prefiltro.ts:9 (test en test/hooks/salida-temprana.test.ts:112-121) | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:71-73 (comentario sobre INVOCA_GIT_O_CIERRE, linea 75) | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts (comentario de declaraHeldout, ~linea 74-82) y skills/task-workflow/heldout.md:45-49 | plan |

Sin hallazgos nuevos: ni CRITICO, ni IMPORTANTE, ni MENOR introducido por la correccion.

## Reproduccion

Entorno: clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-114-r2` (ya borrado), rama `feature/task-114-p-6-hooks-pretooluse-que-salen-pronto-cu`, `npm ci` y `npm run build` limpios (exit 0). El `dist` compilado coincide con el `dist` commiteado (sin diferencias en `git status`).

### Tests ejecutados

`node --test dist/test/hooks/salida-temprana.test.js dist/test/hooks/guardia-heldout.test.js dist/test/hooks/guardia-merge.test.js` desde `taskcode-marketplace/plugins/taskcode-plugin`: **39 tests, 39 pasan, 0 fallan** (exit 0).

### MEN-1 — prefiltro sin test que lo discrimine: corregido

El prefiltro se extrae a `src/hooks/prefiltro.ts` (funcion pura `puedeIntegrar`, `nombraHeldout`) y el test `salida temprana (TASK-114, MEN-1)` aserta sus casos positivos y negativos. Mutacion comprobada en el `dist` del clon: se quita `&& /git|\.sh/i` de `puedeIntegrar`, y el test pasa de verde a rojo (`not ok 4`, 3 pass / 1 fail); restaurado, vuelve a 4/4 verde.

Hueco residual, no bloqueante: el cableado del punto de entrada (`if (integra || heldout)` en `pre-tool-merge.ts`) sigue sin asercion sobre "no carga el guardian"; los lanzamientos reales sin git salen 0 con o sin el cableado. Se acepta como MENOR cerrado.

### MEN-2 — comillas partidas: aceptado

Comentario en `guardia-merge.ts` (lineas 71-73) que documenta que `g''it merge x` esquiva la regla y que la puerta de `finish` sigue verificando. Decision de la persona/plan; no hay codigo que cambiar. Reproduccion de la ofuscacion, ya hecha en la ronda 1: `g''it merge x` da `comandoCandidato` = null.

### MEN-3 — premisa de held-out: corregido

Verificado en el texto: `heldout.md:45-49` ya no afirma que sin `comando_heldout` no hay nada que proteger; dice que el guardian mira la config de la rama actual y que `finish` lee la clave de la rama base, con el caso de la rama abierta antes de declararla. `guardia-heldout.ts` (comentario de `declaraHeldout`) recoge el mismo riesgo como riesgo aceptado. Coherente con `finish-heldout.ts`, que lee `comando_heldout` de `ramaBase` (lineas 17 y 192-193 de `src/commands/finish-heldout.ts`).

### Verificacion de que la correccion no abre fallos

Equivalencia del punto de entrada `pre-tool-merge.ts` frente al anterior (`dist/src/hooks/pre-tool-merge.js` de `97e6e77`, copiado al clon como `pre-tool-merge-old.js`). Se lanzan ambos con el mismo JSON por stdin, cwd del repo, y se comparan exit code y stderr:

- 20 comandos de muestra: **0 diferencias**. Cubre: `git merge`, `git commit`, `git.exe merge`, `& git.exe merge`, `git -C . merge`, `pwsh -Command "& git merge x"`, `bash scripts/merge-feature-to-develop.sh f` (bloquea 2 en ambos), `sh "merge-feature-to-develop.sh" f` (2 en ambos), `grep -rn merge src`, `npm run commit-lint`, `echo commit`, `ls`, `gitlab-merge x`, `git status`, `g''it merge x`, `git checkout rama -- f`.
- Scripts de held-out: con la rama de una tarea temporal (`feature/task-901-revisor-temporal`, en el clon) y `comando_heldout` declarado, `cat .../aceptacion/x.cjs` (y la variante en mayusculas) bloquea con 2 en ambos; `echo aceptacion` y `git commit -m aceptacion` salen 0 en ambos. 0 diferencias.

Razonamiento: `integra` y `heldout` son exactamente las expresiones que antes estaban en linea (`/merge|commit/i && /git|\.sh/i` y `/aceptacion/i`), y el orden de decision (held-out primero, luego merge; el primero que bloquea gana) no cambia.

## Lecturas fuera del contexto permitido

- `src/commands/finish-heldout.ts`: solo con grep y lectura de unas lineas (17, 28-29, 81-88, 192-197), para contrastar que `finish` lee `comando_heldout` de la rama base (MEN-3).
- Una lectura de la carpeta `aceptacion/` de TASK-114 no se llego a hacer: el hook de held-out de la sesion la bloqueo al nombrarla en un comando, como es debido para un revisor. No se ha leido ningun held-out.
