# Informe de revision — TASK-146a (ronda 1)

- Commit revisado: 4c04dffb5346185a07a4aea031b358227dbe2246
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts:120 | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts:68 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts:102 | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts:77 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts:67 | plan |

### Reproduccion

En el clon pasan import, new, roadmap y verificar-lote: 60/60. La peticion trae la selectiva en verde (786/786).

Sobreviven cuatro mutantes:

| Mutante | Hallazgo |
|---|---|
| M1: el commit de HEAD con try/catch que lo deja en `""` | IMP-1 |
| M2: la tarea ilegible ya no aborta | IMP-2 |
| M3: `--comparar` sin la rama `fallido` | MEN-1 |
| M4: `.sort()` de cadena en vez del orden numerico | MEN-3 |

**IMP-1.** La proteccion de CMD2-10 (que un fallo de git no de un lote verde) no tiene test.

**IMP-2.** La rama nueva que aborta con tareas terminadas ilegibles no tiene test.

**MEN-1.** La rama `fallido` de `--comparar` no tiene test. Ademas, su mensaje es enganoso: dice «no lo tocan» cuando la transicion lo intentaria y fallaria.

**MEN-2.** Cada tarea se lee dos veces.

**MEN-3.** El orden numerico es un cambio de comportamiento sin test.

**Valoraciones sin hallazgo:**
- La propuesta de complejidad en import no es un hueco: sin etiquetas, `proponerComplejidad` siempre da null y llevarla seria codigo muerto. El criterio de la tarea deberia aclararlo.
- `prepararRoadmap` solo tiene dos consumidores, y `se-escribiria` solo aparece con `escribir: false`.
- Los mensajes de import no cambian.
- El tipo de `flags` es correcto.
- El cuerpo de import coincide con el de new.

### Correcciones (coordinador)

- **IMP-1:** verificar-lote acepta en `deps` un `commitDeHead`, solo para tests, como su `timeoutMs`. Un test con un git que falla espera el error, 0 ejecuciones y la tarea aun pendiente. M1 cae en rojo.
- **IMP-2:** test con una terminada de frontmatter roto, que espera el `[ERROR]` con su ID y 0 ejecuciones. M2 cae en rojo.
- **MEN-1:** mensaje propio («Una transicion intentaria regenerarlo y fallaria: ...») y test con la config invalida. M3 cae en rojo.
- **MEN-2, aceptado.** Evitar la doble lectura obligaria a que `listTareasEnEstados`, que comparten WIP, board y otros, devolviera tambien el cuerpo. El coste es menor y solo corre en verificar-lote.
- **MEN-3:** test con TASK-999 y TASK-1000 pendientes, en orden numerico. M4 cae en rojo.

## Regla 4D

- Duplicacion: cumple.
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: IMP-1 e IMP-2, corregidos con test.

## Lecturas fuera del contexto permitido

- docs/auditoria-4d-completa.md, complejidad-similar.ts, task.ts, task-store.ts, git.ts e import-parser.ts.
