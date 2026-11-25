# Informe de revision — TASK-167d (ronda 1)

- Commit revisado: 42105e8 (contenido de codigo igual al de d2f3808, el de la verificacion)
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Resumen

Sin CRITICOS ni IMPORTANTES. Cinco MENORES, todos reproducidos. La verificacion de la ronda (verde, 2014 tests) no se repitio; solo corrí los cuatro ficheros pedidos sobre un clon limpio (`tsc` sin errores; 10 tests, 10 verdes).

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|----|-----------|--------|---------|--------|
| H1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts:733 | implementacion |
| H2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/auditorias-4d.ts:324 | implementacion |
| H3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts:214 | implementacion |
| H4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts:207 | implementacion |
| H5 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts:207 | implementacion |

### H1 — Sin tareas pero con informes: el texto no muestra la serie y el JSON si
- Reproduccion: repo Git con `tareas/` vacia y dos `docs/auditoria-4d-*.md` validos. `taskctl metricas` imprime solo "No hay tareas que medir..." (la salida de `filas.length === 0` sale antes de `seccionAuditorias`); `taskctl metricas --json` si trae `auditorias4D` con las dos filas. `--heuristica` tambien dice "No hay tareas".
- Es incoherente entre modos; un proyecto que solo audita ve un mensaje que da a entender que no hay nada que medir. Razonable que `--evolucion`, `--grupos` y `--heuristica` no muestren la serie (sustituyen la tabla por tarea y miden tareas), pero el caso sin tareas del modo texto deberia mostrarla o el JSON no deberia incluirla.
- Sugerencia: imprimir la serie tambien en la rama `filas.length === 0` del texto.

### H2 — Un "informe" que no se puede leer aborta metricas entera, contra lo que declara el modulo
- Reproduccion: `mkdir docs/auditoria-4d-2026-11-03.md` (un directorio con nombre de informe) y `taskctl metricas` sale con codigo 1: `[ERROR] taskctl no pudo arrancar: EISDIR: illegal operation on a directory, read`. Igual pasaria con un fichero sin permiso de lectura.
- La cabecera de `fs/auditorias-4d.ts` promete "un informe que no se puede leer es un aviso con su motivo, no un error". Solo se cumple para el formato, no para fallos de E/S. Caso raro.
- Sugerencia: `try/catch` del `readFile` que convierta el error en aviso.

### H3 — Mensajes enganosos en tablas mal formadas
- Reproduccion (`leerResumenAuditoria4D`): la tabla sin la fila separador `|---|` se salta la primera fila de datos (`i += 2` no valida el separador) y dice `le falta la fila "Duplicacion"`; una linea en blanco dentro de la tabla dice `le falta la fila "Diluvio"` (la lectura se corta en la linea vacia). El motivo manda a buscar una fila que si esta.
- Sugerencia: comprobar que la linea tras la cabecera es un separador y, si no, decirlo; o avisar de que la tabla acaba antes de tiempo.

### H4 — Un bloque de codigo con un `## Resumen` de ejemplo antes del real rechaza el informe
- Reproduccion: texto con "```\n## Resumen\n| ejemplo |\n```" y despues el `## Resumen` real con la tabla valida: `leerResumenAuditoria4D` devuelve `no tiene la cabecera`, porque `indexOf` toma la primera aparicion, tambien dentro de un bloque cercado. Al reves, una tabla cercada bajo el `## Resumen` real se acepta. Los informes de la skill no llevan bloques antes del resumen, por eso es de borde.
- Contexto: `transiciones.ts` ya tiene el concepto `enBloque` para esto.

### H5 — El `replace(/\r/g, '')` de la linea 207 es redundante y sin red
- Mutacion: reemplazar `replace(/\r/g, '')` por una expresion que no quita nada deja los 3 tests verdes, porque el `.trim()` posterior ya elimina el `\r` final. El CRLF queda cubierto por el `\r\n` del helper, pero el replace es codigo muerto. Quitarlo (o conservarlo a sabiendas).

## Casos del parser comprobados (sin hallazgo)

CRLF (acepta), `## Resumen` indentado (acepta), `### Resumen` (rechaza, correcto), seccion Resumen sin tabla seguida de `## Hallazgos` (rechaza con la cabecera, correcto, no salta a la tabla de otra seccion), fila de D desconocida con ceros (se ignora; con cifras distintas de cero el Total no cuadra y se rechaza), nombre de D en minuscula o con tilde (rechaza), cifra enorme (rechaza por Total), cabecera con espacios de mas o sin barra final (rechaza: estricto, coherente con la skill que escribe el formato exacto).

## Salida de metricas sin informes

Sin informes no cambia: ni seccion, ni aviso, ni clave `auditorias4D` (el test lo comprueba y el sondeo con repo sin `docs/` coincide). Con `--json` la clave solo aparece si algun repo tiene informes legibles.

## Mutacion (los tests fallan de verdad)

Cada mutante, sobre los dos ficheros de tests nuevos:

- Patron del nombre otra vez `-(\d+)`: rojo.
- Serie sin ordenar: rojo.
- Sin la comprobacion del Total: rojo (2 fallos).
- Sin quitar `\r`: verde (H5, codigo muerto, no falta de test).
- No ejecutados por tiempo (cada ciclo tardaba ~8 min con la maquina cargada): Total/fila repetida, signo del cambio, prefijo `proyecto:` en el aviso, guard `length > 0`, `...seccionAuditorias`, filtro por nombre. Por lectura estan cubiertos por aserciones concretas (cambio `-6`, `-3`, prefijo `alfa:`, ausencia de `auditoria-4d-notas`, serie de texto); el unico que sobreviviria es el guard `length > 0`, que solo evita lineas en blanco y no tiene efecto observable en `beta`. No es un hallazgo.

## Lecturas fuera del contexto permitido

- `src/fs/task-store.ts` (`listarSiExiste`), para ver que errores traga el listado (solo ENOENT y ENOTDIR).
- `src/core/informe-revision.ts` (lineas 158 y 513), para confirmar `SEVERIDADES_HALLAZGO` y `DIMENSIONES_4D` reutilizadas.
- `test/helpers/metricas-repos.ts` y `test/helpers/automatico-fixtures.ts`, para saber como invoca el test el CLI.
