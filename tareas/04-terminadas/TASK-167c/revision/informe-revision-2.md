# Informe de revision — TASK-167c (ronda 2)

- Commit revisado: b5b8b880d6bff7914bd7819f5a63813f2eefe6c0 (contenido de la parte c; ab53343 solo anade la peticion de revision)
- Revisor: code-quality-reviewer
- Veredicto: aprobada

Alcance: verificacion acotada de las correcciones de la ronda 1 (commit b5b8b88), como pide la peticion. No se reviso la rama entera ni se abrieron hallazgos fuera de lo que el diff de esta ronda rompe.

## Verificacion

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-167c-r2`, HEAD `ab533439` (comprobado). Dependencias instaladas (`npm install`, 0 vulnerabilidades) y compilacion `npx tsc -p .` con codigo 0.
- Tests pedidos, ejecutados en el clon sobre el commit revisado: `auditoria-4d.test.js` 2/2 pasan; `doctor-deploy.test.js` 12/12 pasan; `tamanos.test.js` 7/7 pasan.
- La suite completa no se repitio: la verificacion de la ronda (914 tests, codigo 0, `Commit verificado` b5b8b880, igual al revisado) vale para esta revision.
- Clon borrado al terminar. Comprobado antes: sin commits sin remoto; solo `package-lock.json` modificado por npm.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts:16 | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts:97 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md:87 | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts:74 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md:83 | plan |

Ningun hallazgo nuevo CRITICO o IMPORTANTE, ni introducido por la correccion.

### Detalle por hallazgo de la ronda 1

- **IMP-1 (corregido).** `PATRON_INFORME_AUDITORIA_4D` ahora es `/^auditoria-4d-(\d{4}-\d{2}-\d{2})(?:-(\d+))?\.md$/` (core:16). Reproducido: `auditoria-4d-2026-11-25-2.md` casa y el grupo 2 vale `2`; `auditoria-4d-2026-11-25-x.md` no casa. El test lo exige (test:51). Mutando el patron a la forma antigua, el test se pone en rojo (ver mutaciones). Nota: el patron no tiene consumidores todavia (la parte d no existe), asi que la correccion solo queda protegida por el test.
- **IMP-2 (corregido).** Quitar `--criterio` del bloque, quitar «Solo si dice que sí», quitar la nota de ceros o quitar la fila de ejemplo `4D-01` ponen el test en rojo (ver mutaciones). El test exige `--titulo`, `--objetivo` y `--criterio` en el bloque (test:97).
- **MEN-1 (corregido).** La skill dice que, si se audito otra rama que no es la base, no se crean tareas (SKILL:87). Quitar esa frase pone el test en rojo (test:100).
- **MEN-2 (corregido).** El test exige que la fila de hallazgo tenga las mismas columnas que la cabecera (test:68-69), que cada ola lleve `- Hallazgos: 4D-` y `- Duración estimada: N min` (test:74-75). Mutando la fila a 5 columnas, o renombrando las dos lineas de la ola, el test falla.
- **MEN-3 (corregido).** Las D y severidades sin tildes (SKILL:84, test:78) y la regla «ninguna celda lleva `|`» (SKILL:85, test:79) estan protegidas: quitarlas pone el test en rojo. La frase «la tendencia se lee del resumen» no aparece en la skill; la fuente de la regla es el comentario de `CABECERA_RESUMEN_4D` (core:28), que no se prueba (ver nota).

## Mutaciones ejecutadas (sobre el clon; la base del test pasa 2/2)

| Mutacion | Resultado |
|---|---|
| IMP-1: quitar `(?:-(\d+))?` del patron | ROJO (1 fallo) |
| IMP-2a: quitar `--criterio ...` del bloque de `taskctl new` | ROJO |
| IMP-2b: cambiar «Solo si dice que sí» | ROJO |
| IMP-2c: cambiar «una D sin hallazgos va con ceros» | ROJO |
| IMP-2d: quitar la fila `4D-01` | ROJO |
| MEN-1: quitar el aviso de otra rama | ROJO |
| MEN-2a: fila de hallazgo con 5 columnas | ROJO |
| MEN-2b: cambiar `- Hallazgos: 4D-` | ROJO |
| MEN-2c: renombrar `Duración estimada` | ROJO |
| MEN-3a: quitar `**sin tildes**` | ROJO |
| MEN-3b: quitar la regla de `|` | ROJO |
| MEN-3c: cambiar «las cifras del resumen son números» | VERDE (sobrevive, ver nota) |

Tras las mutaciones, el fichero se restauro y el test volvio a dar 2/2.

## Notas (fuera de la tabla, no abren ronda)

- **MEN-3c (sobrevive).** La frase «las cifras del resumen son números contados en la tabla de hallazgos» no tiene test. Es la regla que pide la parte d (leer cifras contadas, no estimadas); si alguien la edita, nada lo detecta. Sugerencia para la parte d: que su test lea la tabla y no el resumen.
- **Patron con ceros.** `PATRON_INFORME_AUDITORIA_4D` acepta `auditoria-4d-2026-11-25-02.md` y `-0`. No rompe nada hoy porque nada lo consume; decidir al implementar la parte d si se acepta o se restringe a `[2-9]\d*`.

## Regla 4D

- Duplicacion: cumple. El formato sigue en una sola fuente (`core/auditoria-4d.ts`) y la skill lo repite como texto que el test ata.
- Desviacion: cumple. Los cambios del diff de esta ronda son todos de la tarea.
- Diluvio: cumple.
- Disfraz: cumple. Las aserciones nuevas comprueban texto y formato concreto, no solo que el fichero exista.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts:38`: solo una busqueda de lineas (grep) para confirmar que `FLAGS_NEW` contiene `--criterio`, `--objetivo` y `--titulo`, que el test importa. No se leyo el fichero entero.
- Busqueda de lineas en el repo principal (solo lectura) para citar `ruta:línea` de los hallazgos: `skills/auditoria-4d/SKILL.md`, `test/skills/auditoria-4d.test.ts`, `src/core/auditoria-4d.ts` y las skills `new` y `task-workflow` para comprobar que los flags de `taskctl new` aparecen en otras skills.
