# Informe de revision — TASK-091 (ronda 2)

- Commit revisado: d221a9d11e52fc4008fffad80bcbb1883cdd8331
- Revisor: code-quality-reviewer (revisor independiente, pase generico; el diff cae en TypeScript/Markdown/config sin revisor de dominio)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-091 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido (solo para la ronda 1; ver IMP-1) | src/commands/review.ts:909-911 y 922-923; CHANGELOG.md; README.md | implementacion |
| MEN-2 | MENOR | corregido | test/commands/verificacion-selectiva.test.ts:235-237 | implementacion |
| IMP-1 | IMPORTANTE | abierto | src/commands/review.ts:909-911 (mensaje), 643-647 (comentario); verificacion-selectiva.md, CHANGELOG.md y README.md («sobre la rama ya actualizada con la base») | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Veredicto propuesto por el revisor: cambios-solicitados.

### Verificacion de MEN-1 y MEN-2

- **MEN-2, resuelto.** Con un mutante (`FICHEROS_MEMO.selectiva` = `'freno-verificacion.json'`), el test del guardian cae por si solo (`la selectiva no toca el memo de la completa`, linea 236). Revertido en el clon.
- **MEN-1, resuelto para la ronda 1, pero la correccion abre IMP-1.** En la ronda 1 «la base ya se ha integrado en la rama» es cierto (el update corre antes). En la ronda incremental el update no se ejecuta (`review.ts:535-537`, TASK-040) y la frase es falsa.

### Entorno y puerta determinista

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-091-r2`, `npm install` y `npm run build` sin errores. Con `bash` resolviendo a WSL fallan 8 tests de review por el entorno (no regresion); con Git Bash delante en el PATH: `verificacion-selectiva`, `guardia-merge` y `review-camino`, 37 de 37 pasan. No se corrio la suite entera.

### IMP-1 — la ronda incremental con selectiva en rojo dice que la base ya esta integrada, y no lo esta

Reproduccion (test temporal, borrado): tarea con ronda 1 `cambios-solicitados`, `develop` avanza con `otra.txt`, correccion en `src/b.ts`, selectiva `node -e "process.exit(1)"`, `runReviewCommand` para la ronda 2. Rechaza con «...(la base ya se ha integrado en la rama, como en cualquier review; reintentar no la repite)», pero `HEAD` no cambia, no hay `update(feature)` y `otra.txt` no esta en la rama. Un usuario puede dar por integrado lo que no lo esta: mensaje que ha dejado de ser cierto (IMPORTANTE). Los documentos dicen lo mismo («sobre la rama ya actualizada con la base») y el test solo cubre la ronda 1.

Correccion sugerida: mensaje y documentos que digan lo que pasa en cada caso, y un test de la ronda incremental.

## Lecturas fuera del contexto permitido

- `src/fs/verificacion.ts` (lineas 40-42 y 158): para el mutante de MEN-2.
- `test/commands/review-incremental.test.ts` (lineas 1-135): para montar la ronda incremental de IMP-1.
- `src/commands/review.ts` fuera del tramo del diff (520-560, 600-665, 893-927): para ver que el update se salta en la ronda incremental.
- Carpeta de pruebas borrada al terminar; no se modifico el repo original.
