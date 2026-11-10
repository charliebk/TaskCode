# Informe de revision — TASK-095 (ronda 2)

- Commit revisado: 30aba939661197a3298aca54800053896c21057d
- Revisor: general-purpose (haiku) con code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-095 aprobada | aprobada-con-correcciones | cambios-solicitados)

Ronda de verificacion de las correcciones (protocolo de arranque del proyecto): la peticion la genero como completa el taskctl 0.13 instalado, con la regla que esta tarea corrige.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | src/core/informe-revision.ts (`esPlantilla` en `alcanceRondaSiguiente`) y test/commands/review-alcance.test.ts | implementacion |
| MEN-2 | MENOR | corregido | src/commands/review.ts (rama `fueAcotada`) y test/commands/review-alcance.test.ts | implementacion |
| MEN-3 | MENOR | corregido | src/commands/review.ts (`sinMarcar`) y test/commands/review-alcance.test.ts | implementacion |
| MEN-4 | MENOR | aceptado | src/core/informe-revision.ts (`resumirHallazgos`) y src/commands/review.ts (`conSufijo`) | implementacion |
| MEN-5 | MENOR | corregido | test/commands/review-alcance.test.ts (Rust corregido; la parte por spawn en manual y semiautomatico, aceptada) | implementacion |
| MEN-6 | MENOR | corregido | src/core/flujo.ts (comando del tope sin `--ronda-extra`) y src/commands/veredicto.ts | implementacion |

Sin hallazgos nuevos: ni CRITICO ni IMPORTANTE, y la correccion no introduce ningun fallo reproducible.

## Verificacion

- Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-095-r2`, fijado en 30aba93; `npm install` y `npm run build` sin errores. En esa sesion el `bash` del PATH era el de WSL (19 de 34 tests fallan con `execvpe(/bin/bash)`): problema del entorno, se puso Git Bash delante del PATH.
- `review-alcance`, `core/siguiente`, `review-incremental`, `automatico-rondas`, `veredicto`: 34/34 (12, 4, 9, 2, 7).
- Mutantes que sobrevivian en la ronda 1, ahora muertos: M1 (`esPlantilla` → false) lo mata el test de la regla pura; M2 (rama `fueAcotada` → false) lo mata «una completa tras una acotada revisa desde la base»; M3 (`sinMarcar` con `hallazgosPendientes`) lo mata el test del aviso.
- MEN-6: el `comando` del tope va sin el flag y el `motivo` lo nombra; `review` sigue exigiendo el flag pasado el tope. Las demas referencias a `--ronda-extra` (skill review, revision.md, README, cli.ts, avance.md) son coherentes.
- Aceptaciones: MEN-4 de acuerdo (consecuencia documentada de las metricas con sufijos, MEN-3 de TASK-064; volver a medir al revisar metricas). MEN-5 por spawn de acuerdo (unitario en los tres modos y spawn existente en automatico).
- Clon borrado sin commits pendientes; repo original sin tocar.

## Lecturas fuera del contexto permitido

- `src/core/informe-revision.ts` (280-370) y `src/commands/review.ts` (420-470, 735-765): ubicar los mutantes.
- Grep de `ronda-extra` en el clon (skills, README, cli.ts): coherencia de MEN-6.
