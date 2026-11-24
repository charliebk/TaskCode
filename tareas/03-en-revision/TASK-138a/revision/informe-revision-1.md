# Informe de revision — TASK-138a (ronda 1)

- Commit revisado: 2a0a6e53d9cb82919feff40a73f8580066810adf
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts:85 | plan |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts:176 | implementacion |

No hay CRITICOS ni IMPORTANTES.

### Hallazgos

**MEN-1.** La ultima completa en verde puede borrar la cifra de tests de una anterior: si la ultima quedo con `-` (salida recortada), la tarea pasa a `tests: null`. Antes doctor tomaba el maximo de todas las lineas. Las dos vistas coinciden, que era el objetivo, pero una version puede perder la cifra de tests, y con ella apagar o encender el aviso. Conviene dejarlo escrito en el Resultado. No se pide corregirlo.

**MEN-2.** La asercion «las dos vistas iguales» compara `suitePorVersion` con las mismas funciones que la construyen. Lo que discrimina es la comparacion con el valor esperado.

### Comprobaciones

- `tsc` compila sin errores y `dist` esta sincronizado.
- Pasan 53/53 tests.
- El cambio de cifra de doctor es correcto.
- No puede haber una version con tests y sin duracion, y el conjunto de versiones es el mismo que antes.
- No hay ciclo de imports.
- `contarTests` da lo mismo que antes en las 3072 combinaciones probadas.
- Los cinco mutantes de crecimiento-suite caen en rojo.

### Correcciones (coordinador)

- **MEN-1, aceptado y documentado en el Resultado.** Es la regla de las dos vistas: una tarea cuenta una vez, con la ultima.
- **MEN-2, corregido.** Se quita la asercion tautologica y queda la comparacion con el valor esperado (800; con la regla vieja de doctor seria 700).

## Regla 4D

- Duplicacion: cumple. La mediana queda solo en `estadistica.ts`.
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: MEN-2, corregido.

## Lecturas fuera del contexto permitido

- doctor.ts (grep), el test entero y el `dist` de la base para el diferencial de `contarTests`.
