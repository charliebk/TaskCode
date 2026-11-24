# Informe de revision — TASK-146b (ronda 1)

- Commit revisado: 42882e9cf3512cb5ab82cb32e1d616472609a02d
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts:16 | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts:143 | implementacion |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts:330 | implementacion |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-tareas.test.ts:283 | implementacion |

No hay CRITICOS ni IMPORTANTES.

### Reproduccion

La peticion trae la selectiva en verde (871 en verde, 1 omitido). En el clon pasan 43/43 los tests de registrar-coste, doctor-deploy-tareas y documento-estado.

**Mutantes:**
- `costeDeFila` con un campo cambiado: cae en rojo.
- `diaLocal` en lugar de `diaUtc` en `--crear-tareas`: cae en rojo en UTC-3 y en Los Angeles, pero sobrevive con `TZ=UTC` (MEN-4).

**Comprobaciones:**
- registrar-coste solo commitea con la tarea terminada, y veredicto nunca: las cabeceras lo describen, salvo una frase vieja (MEN-1).
- `costeDeFila` no cambia ninguna suma: la guarda previa exige que las columnas no sean null.
- `creado` y `actualizado` salen siempre del dia UTC, y `diaLocal` queda solo en el nombre del informe.
- `claveRuta` y `listarSiExiste` mantienen la semantica.

**MEN-1.** La cabecera dice aun «un solo commit», y la regla 4 da por hecho que siempre hay commit.

**MEN-2.** Queda un comentario huerfano sobre `listarDir`, y `readdir` sigue importado sin uso en plan.ts.

**MEN-3.** `listarSiExiste` se inserto entre el JSDoc de `isEnoent` y la funcion. Ademas, registrar-coste importa de task-store en dos lineas, y doctor-deploy pone un import de core entre dos de `node:`.

**MEN-4.** El test del `creado` en UTC solo discrimina al oeste de UTC.

### Correcciones (coordinador)

- **MEN-1:** «un solo registro» y «dejaria una fila».
- **MEN-2:** comentario e import fuera.
- **MEN-3:** `listarSiExiste` debajo de `isEnotdir`, un solo import de task-store y el import de doctor-deploy tras los de `node:`.
- **MEN-4:** dos instantes, a las 00:30Z y a las 23:30Z. En cualquier zona salvo UTC, uno de los dos cae en otro dia local; en UTC el dia local y el UTC coinciden y no hay nada que distinguir. El mutante cae en rojo en esta maquina.

## Regla 4D

- Duplicacion: cumple. El cambio la elimina.
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: cumple. MEN-4 queda corregido.

## Lecturas fuera del contexto permitido

- coste-registro.ts, y doctor.ts y doctor-deploy.ts (grep).
