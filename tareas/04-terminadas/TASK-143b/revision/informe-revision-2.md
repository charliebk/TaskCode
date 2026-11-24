# Informe de revision — TASK-143b (ronda 2)

- Commit revisado: afecb22277f0052330f37cd564781ff3084edf5e
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

Sin hallazgos nuevos. El IMP-1 de la ronda 1 queda corregido y verificado.

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/argumentos-comunes.test.ts:113 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — verificado como corregido

El test `push-back-to-remote.sh --mirror (TASK-143b, SCR-15)` ahora prepara en el destino una rama
exclusiva (`solo-destino`) y una rama divergente (`diverge`) con un commit que no tiene local, y
comprueba despues que la exclusiva desaparece y que `diverge` acaba con el SHA local. Mutantes
ejecutados sobre `scripts/gitflow/push-back-to-remote.sh` (linea 249) en el clon temporal:

- Sin `--prune` (`git push --force "$TARGET_REMOTE" ...`): `argumentos-comunes` pasa a rojo
  (`not ok 5`, 4 pass / 1 fail). Antes de la correccion este mutante no tenia test que lo
  detectara (ronda 1: 15 pass).
- Sin `--force` (`git push --prune "$TARGET_REMOTE" ...`): rojo (`not ok 5`), con el error real del
  servidor `! [rejected] diverge -> diverge (non-fast-forward)`, es decir, por la causa esperada.

Tras cada mutante se restauro el fichero con `git checkout` y el test volvio a verde con el original.

### Lo que abre la correccion

Se reviso el diff de la correccion desde f06802c (solo `argumentos-comunes.test.ts`, mas los
cambios de textos y `diagnose-repo.sh` de la ronda 1, ya contrastados en la ronda 1). No aparece
ningun fallo CRITICO nuevo:

- El test nuevo asevera valores concretos (SHA del commit local, ausencia de la referencia
  exclusiva, lista exacta de refs no-rama/no-tag vacia), no `ok` ni `!= null`.
- El caso de `--main` al final sin valor y el recorte de espacios siguen verdes (ver evidencia).

## Regla 4D

- Duplicacion: cumple. La preparacion del repo de prueba es propia del test; no hay una decision
  de negocio escrita dos veces.
- Desviacion: cumple. El diff de la correccion toca solo el test de IMP-1 y los textos de la ronda 1.
- Diluvio: cumple.
- Disfraz: cumple. Los tests nuevos fallan con los mutantes de `--prune` y `--force` (ver arriba).

## Nota (no es hallazgo)

- Los MENOR de la ronda 1 (MEN-1, MEN-2, MEN-3) no se han vuelto a revisar, segun la peticion. Como
  nota: el mutante "sin recorte en normalize_branch_name" de la ronda 1 no se ha repetido aqui.

## Evidencia

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-143b-r2`, creado con
`git clone -c core.autocrlf=false`, rama `fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y`.
HEAD del clon: `b98f838`. El diff entre `afecb22` y `b98f838` solo toca `tareas/` (la peticion y el
informe de la ronda 1), asi que el codigo verificado es el del commit revisado `afecb22`.

- `npm install`: OK. `npx tsc`: "No errors found", exit 0.
- `node --test dist/test/gitflow/argumentos-comunes.test.js`: 5 tests, 5 pass, 0 fail.
- `node --test "dist/test/gitflow/*.test.js"`: 97 tests, 97 pass, 0 fail, 0 skipped. No hizo falta
  repetir ningun test de `origin-deteccion` aislado.
- Mutante A (sin `--prune`): `not ok 5`, 4 pass / 1 fail. Restaurado.
- Mutante B (sin `--force`): `not ok 5`, con `[rejected] diverge -> diverge (non-fast-forward)`.
  Restaurado.
- La verificacion `node scripts/verificar-impacto.mjs` de la peticion (798 tests, 0 fallos, sobre
  `afecb22`) no se ha repetido: vale para esta revision, segun la peticion.
- Clon temporal borrado al terminar.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh` lineas 378-390
  (`detect_origin_available`), con `grep`: para confirmar que la llamada con `> /dev/null` no rompe
  la fijacion de `REMOTE_AVAILABLE` en el shell actual (no es subshell).
- `skills/code-quality-reviewer/SKILL.md`: la pide la propia peticion como skill revisora.
