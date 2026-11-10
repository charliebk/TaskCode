# Informe de revision — TASK-098 (ronda 2)

- Commit revisado: 8ea9b9707226be642cce5c147fe7aa4f8ce48f7e
- Revisor: revisor independiente de la ronda 2 (agente general-purpose, skill code-quality-reviewer); alcance: solo verificar las correcciones de la ronda 1 (protocolo de arranque, CLAUDE.md punto 5)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts (`extraerEstructura`) | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts (titulo y complejidad, filas duplicadas) | plan |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts (`extraerEstructura`, rama `cabeceraDeTabla`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — corregido

Reproducido a mano con `node bin/taskctl` en un repo git temporal (rama `develop`): `new` crea
`tareas/ROADMAP.md`; se sustituye la marca por `<!-- generado por mi script -->`, se anaden un
parrafo propio, `## Notas de riesgos`, un texto `NO BORRAR` y una tabla `| Riesgo | Mitigacion |`, y
se commitea. `taskctl roadmap --comparar` sale con 1 y lista 6 lineas «texto fuera de la zona manual
que se perderia:»; `taskctl roadmap --escribir` no escribe nada («no se sustituye»), exit 1, arbol
limpio. Control: un ROADMAP que solo cambia la marca sale limpio, exit 0 (sin falso positivo).
Fixtures de OpenDockTrading y ToolsaWeb: 23/23 en `roadmap.test.js`, `roadmap-ajenos.test.js` y
`roadmap-transiciones.test.js`.

### MEN-1 — corregido

Titulo y complejidad se comparan y las duplicadas se avisan. Mutantes sobre `dist`, todos muertos:
ignorar duplicadas (1 test), no comparar complejidad (1 test), no listar el texto propio (2 tests).

### MEN-2 — la exencion de la correccion deja un hueco (MENOR, lo causa la correccion)

`cabeceraDeTabla = hito !== null && recortada.startsWith('|')` exime cualquier linea que empiece
por `|` dentro de un `## Hn` y no tenga `TASK-NNN`, no solo la cabecera y el separador del
generador. Una fila propia dentro de un hito (`| Riesgo propio | dato perdido |` tras la fila de
TASK-001) no se lista: con la marca cambiada y esa fila commiteada, `--comparar` dice «Sin
diferencias», exit 0, y `--escribir` la regeneraria sin ella. Menor: necesita una tabla propia
dentro de un `## Hn` del ROADMAP ajeno. Correccion sugerida: eximir solo la cabecera
`| Paso | Tarea | Titulo | Complejidad | Depende de | Estado |` y el separador `|---|...`.

## Reproduccion y verificacion empirica

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-098-r2`, `npm install` y `npm run build`
correctos; `node --test` sobre los tres ficheros: 23 pass, 0 fail. Casos a mano con el CLI: IMP-1 y
MEN-2. Mutantes aplicados sobre `dist` y restaurados. Carpeta temporal borrada, sin commits.

## Lecturas fuera del contexto permitido

- `bin/taskctl`, `dist/test/**` y `dist/src/core/roadmap-comparar.js`: ejecutar el CLI y los tests compilados y aplicar mutantes.
- `revision/informe-revision-1.md` y la plantilla `informe-revision-2.md`: indicados en el encargo.
