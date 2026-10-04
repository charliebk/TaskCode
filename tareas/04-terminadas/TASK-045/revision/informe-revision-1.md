# Informe de revision — TASK-045 (ronda 1)

- Commit revisado: e48ed50f5f6ddab23d9c9233db873618933e38ba
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | corregido | src/commands/finish.ts:323 |
| MEN-2 | MENOR | aceptado | test/commands/rama-base.test.ts (camino idempotente, finish.ts:351-370) |
| MEN-3 | MENOR | corregido | src/commands/finish.ts:448, src/cli.ts:663, src/core/config.ts:8 |

Ningun CRITICO ni IMPORTANTE.

### Puerta determinista

- `npm run build` sin errores. Suite en clon temporal: 979 tests, 974 verdes.
  Rojos: los 3 conocidos de Windows (approve #121 symlink EPERM, plan #301
  chmod NTFS, plan #307 CRLF) y 2 de tiempo en `origin-deteccion.test.js`
  (#921, #924) por carga de la maquina; ese fichero solo da 5/5.
- `rama-base.test.js`: 4/4.

### Reproduccion empirica

Mutantes (build + `rama-base.test.js`, y `finish.test.js` en los de finish):
M1 finish sin `--develop` MUERTO; M2 start sin `gitflowBaseArgs` MUERTO; M3
review sin `gitflowBaseArgs` MUERTO; M4a `integradaEnDevelop` contra
"develop" MUERTO; M4b checkout del camino idempotente a "develop" SOBREVIVE
(MEN-2); M5 destinos de colision con "develop" MUERTO; M6 `baseBranch:
"develop"` MUERTO; M7 hotfix tambien con `--develop`: solo lo mata el test de
`gitflowBaseArgs` (inofensivo: el script toma el primer no-flag).

CLI real (`node bin/taskctl`) en repos con `rama_base: dev` y sin `develop`:
fix completo `new -> ... -> finish` cierra sobre `dev`; hotfix con conflicto
en el backmerge: el error del estado a medias nombra `dev` y el reintento
entra por el camino idempotente y cierra en `dev`.

Sin `develop` fijo que afecte al ciclo en `src/`: `codex-review.ts` pasa por
`resolveBaseBranchForTipo`; `wip-scan.ts` lo mantiene solo como candidato
extra; `diagnose-repo.sh` y `wrappers.ts` estan fuera de alcance y
documentados.

### MEN-1 — Hotfix con `rama_base` aun no llegado a main: error criptico

Con el config solo en `dev`, la rama del hotfix (nacida de main) resuelve
"develop" y finish aborta antes de mergear con `fatal: Not a valid object
name develop` de git en crudo. Fail-closed, no deja nada a medias, y no es
regresion; el mensaje no dice que hacer.

### MEN-2 — El camino idempotente con `rama_base` no tiene red

Sustituir `ramaIntegracion` por "develop" en el checkout del camino
idempotente (finish.ts:360-361) deja `rama-base` y `finish` en verde (24/24).
El codigo es correcto (lo ejercita el CLI real), pero una regresion ahi no la
veria ningun test con rama distinta de `develop`.

### MEN-3 — Comentarios que siguen hablando de `develop`

finish.ts:448-449, cli.ts:663 y la tabla de config.ts:8. Solo legibilidad.

## Correcciones (orquestador)

- MEN-1: finish comprueba antes de nada que la rama de integracion existe en
  local y, si no, aborta diciendo que el config con `rama_base` tiene que
  estar commiteado tambien en la rama de la tarea (en un hotfix, en la
  principal). Test nuevo en `rama-base.test.ts`, que muere si se quita la
  comprobacion; asevera que no se toca ninguna rama.
- MEN-3: los tres comentarios hablan de la rama de integracion.
- MEN-2: aceptado sin corregir. El caso exige montar un conflicto de
  backmerge con resolucion manual; el codigo esta verificado con el CLI real
  y la entrega A del flujo guiado es urgente. Queda como deuda de cobertura.
