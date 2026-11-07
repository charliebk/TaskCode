# Informe de revision — TASK-086 (ronda 1)

- Commit revisado: 8c8b58550114c85d01a7b8b01ce3af269339bb58
- Revisor: revisor independiente (general-purpose, sonnet) con la skill code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/metricas.ts (marcasDe + intervalosDePausa) | implementacion |
| MEN-2 | MENOR | abierto | docs/METRICAS.md §14 (enPausa) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.

### MEN-1 — empate de segundo con origen git

`git log` llega de lo más nuevo a lo más viejo. Si una `pausa` y la transición
siguiente comparten segundo, el `sort` estable por `ms` las deja en orden
inverso: la pausa queda detrás de la transición, abre un intervalo que cierra
la fila siguiente y se descuenta de más. Con origen `registro` no pasa, porque
las filas ya van en orden.

Reproducción: eventos git `plan 10:00, start 12:00, pausa 14:00, review 14:00,
finish 15:00` (en orden de log: finish, review, pausa, start, plan).
`calcularFila` da `enPausa` = 1h y `revision` 1h más corta. Debería ser 0.
Arreglo: invertir el log antes de ordenar, para que el desempate siga el
orden cronológico.

### MEN-2 — `enPausa` 0 con una pausa cerrada fuera de lo medido

`enPausa` se mide hasta la última marca medida. Con `plan 10:00, pausa 11:00,
plan 12:00` (tarea en diseño), la ventana es [plan, plan] y `enPausa` vale 0
aunque hubo una pausa cerrada. Es coherente con `diseno` null, pero la §14
dice «0 si no hubo pausas cerradas». Basta matizar la frase.

### Reproducción empírica

- **Clon temporal.** Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-086-r1` con `npm install` y build limpios. El clon se borró después.
- **Tests de métricas.** 68 de 68 en verde.
- **`npm test` completo.** 2011 tests y 2008 en verde. Los 3 rojos son los conocidos de Windows: #128 symlink `EPERM`, #745 `chmod` y #751 CRLF.
- **Mutantes.** Se probaron 11 sobre `src/core/metricas.ts`: racha desde la última pausa, sin recorte al inicio o al fin, descuento con precisión de día, `total`, `curso` o `revision` sin descontar, `enPausa` hasta `finish`, null en lugar de 0, y error de uno en el intervalo. Todos ponen algún test en rojo menos uno, que es equivalente: cerrar la racha abierta con la última marca, que es la propia pausa.
- **Casos límite.** Todos dan lo esperado: mismo segundo con origen registro, pausa antes del primer `plan`, pausa final abierta, mezcla de días y segundos, pausa después del `finish` y pausa que cruza dos fases.
- **Contrato `--json`.** La lista `pausas` es correcta y estable, y los `Object.keys` solo añaden la clave. Leyenda, README y §14 coinciden con el código.
