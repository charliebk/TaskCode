# Informe de revision — TASK-067 (ronda 2)

- Commit revisado: 2993eded3aca00fa549f079f733ca6d80ba4fec3
- Revisor: code-quality-reviewer (agente revisor independiente a3dd1dff8f867ff6a, general-purpose sonnet; clon propio en %LOCALAPPDATA%\pruebas-claude\taskcode\task-067-r2, ya borrado)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-067 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | src/core/aviso-release.ts | especificacion |
| MEN-2 | MENOR | corregido | src/fs/evidencia-veredicto.ts | implementacion |
| MEN-3 | MENOR | corregido | src/fs/informes-deploy.ts, src/commands/doctor-deploy.ts | implementacion |
| MEN-4 | MENOR | corregido | src/fs/sondas-deploy.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos nuevos. Los cuatro MENOR de la ronda 1 quedan resueltos y la correccion no abre
ningun fallo reproducible.

Observacion (no es hallazgo): una ruta de evidencia con `//` interno (`dir//n.js`) se rechaza como
«no es un fichero versionado»; ya pasaba antes de esta ronda en `cat-file` y es conservador
(rechaza, no acepta de mas).

## Evidencia ejecutada

- **Suite** (`npm install && npm test` en el clon, una vez): 1613 tests, 1608 pasan; fallan solo
  los 5 conocidos de Windows (2 contraprueba de descubrimiento, approve EPERM, plan chmod NTFS,
  plan CRLF). El test intermitente de mirror no fallo.
- **Mutantes** en `dist/` del clon, contra los 4 ficheros de test afectados (49/49 sin mutar):
  - MEN-1 sin `'tareas'` en `CARPETAS_SIN_CODIGO`: mueren 3; `startsWith(c)` sin `/`: muere 1.
  - MEN-2 sin rechazo de 120000, sin rechazo de 160000, o sin `ls-tree`: muere el test de enlace y submodulo.
  - MEN-4 sin el sufijo «ademas N carpeta(s)»: muere el test de la ronda 2.
  - MEN-3 cambiando el literal de la constante: mueren 8.
- **Reproducciones**: MEN-1 por los tests nuevos sobre repos reales con `runFinishCommand`
  (solo `tareas/` no avisa; `tareas/` + codigo avisa contando solo el codigo; `tareas-viejas/`
  avisa). MEN-2 con script propio contra el `dist` del clon: enlace (tambien con `./` y en
  carpeta con ñ y espacios) y submodulo rechazados; ficheros normales aceptados, incluidos
  espacios, `ñandú/acción ü.js`, `a[1].js`, `-guion.js`, `./`, `.\` y `\`; carpetas, rutas
  inexistentes y `a?.js` rechazados.
- **Regresiones**: el unico hueco teorico de excluir `tareas/` es una release cuyo codigo viva en
  una carpeta raiz `tareas/`; es la carpeta fija del registro de tareas y el aviso es informativo:
  irreal, sin accion. La coincidencia es por prefijo con `/`.

## Reglas de seguridad

Todo en `%LOCALAPPDATA%/pruebas-claude/taskcode/task-067-r2/` (borrado), sin heredocs; repo
original con `git status --short` vacio y punta 96d6df5.
