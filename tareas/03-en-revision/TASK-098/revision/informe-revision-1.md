# Informe de revision — TASK-098 (ronda 1)

- Commit revisado: eb332ddb581190e3e4b8f0810c56a14de5d7c9a7
- Revisor: revisor independiente (agente general-purpose, skill code-quality-reviewer)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts (`extraerEstructura`), con efecto en src/fs/roadmap.ts y src/commands/roadmap.ts | implementacion |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts (titulo y complejidad sin comparar; `tareas.set` pisa duplicados) | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — `--comparar` sale limpio aunque el ROADMAP ajeno tenga contenido propio fuera de la zona manual, y `--escribir` lo borra

Es justo lo que la persona pidio evitar: `roadmap --escribir` solo debe sustituir un ROADMAP ajeno
si `--comparar` sale limpio (sin perder datos). `extraerEstructura` solo lee las filas
`| Paso | TASK-NNN | ... |` bajo un `## Hn`, los titulos de `## Hn — ...` y la zona manual; todo lo
demas fuera de la zona manual (parrafos propios, secciones `## Notas...`, tablas que no son de
tareas, texto introductorio) se ignora sin avisar.

Reproduccion (repo git temporal, `rama_base` develop):

1. `taskctl new --titulo Uno --tipo feature --objetivo o --criterio c --sprint 1` (crea `tareas/ROADMAP.md` con marca).
2. Sustituir la marca de la linea 3 por `<!-- generado por mi script -->`.
3. Anadir fuera de la zona manual un parrafo (`TEXTO PROPIO FUERA DE ZONA: contexto del negocio.`) y una seccion `## Notas de riesgos` con `NO BORRAR: el cliente exige entregar H1 antes del 15 de diciembre.` y una tabla `| Riesgo | Mitigacion |`.
4. Commitear.
5. `taskctl roadmap --comparar` → «Sin diferencias en tareas, hitos, dependencias, estado ni zona manual.», exit 0.
6. `taskctl roadmap --escribir` → «Regenerado...», exit 0.
7. `git diff` → 11 lineas borradas: el parrafo, la seccion `## Notas de riesgos` y la tabla.

IMPORTANTE y no CRITICO: solo con `--escribir` explicito, el fichero ajeno tiene que estar
commiteado y el texto sigue en git. Pero rompe el contrato «sin perder datos» y `--comparar`
afirma lo contrario. En los fixtures de OpenDockTrading y ToolsaWeb no se dispara (`--comparar` ya
marca diferencias por zona manual o titulos de hito).

Correccion sugerida: que `compararRoadmaps` informe de toda linea no vacia del actual, fuera de la
zona manual, que no sea parte de la estructura reconocida ni la cabecera del generador.

### MEN-1 — la comparacion ignora titulo y complejidad de cada tarea y no detecta filas duplicadas

Un ROADMAP ajeno con el titulo de una tarea retocado a mano, o con otra complejidad, sale limpio; si
una `TASK-NNN` aparece en dos hitos, el `Map` se queda con la ultima sin avisar. Menor porque titulo
y complejidad se regeneran desde `tarea.md`, que es la fuente. Documentarlo o compararlo.

## Reproduccion y verificacion empirica

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-098-r1`, `npm install` y `npm run build` correctos.
- `node --test dist/test/core/roadmap.test.js dist/test/commands/roadmap-ajenos.test.js dist/test/commands/roadmap-transiciones.test.js`: 21/21 en verde. No se corrio la suite completa (ya corrida: 2113/2117 con los 3 rojos conocidos).
- CLI a mano: `new` en repo vacio crea `tareas/ROADMAP.md` con marca, resumen y tabla correctos; un titulo con `|` sale escapado.
- Fixtures reales: `extraerEstructura` lee OpenDockTrading (24 tareas, 2 hitos, zona manual) y ToolsaWeb (17 tareas, 3 hitos) con 0 filas no comparables; ninguna lleva la marca en la linea 3.
- `rutas_sincronizacion` con variantes (`tareas/./ROADMAP.md`, `tareas//ROADMAP.md`, `tareas/x/../ROADMAP.md`, `./tareas/ROADMAP.md`, `tareas\\ROADMAP.md`): `new` no escribe el ROADMAP. Globs (`tareas/ROADMAP*`) no se reconocen, pero la config trata rutas literales: no es hallazgo.
- Mutantes: marca por subcadena (muerto, test 18), sin chequeo de cambios sin commitear (muerto, test 6), sin chequeo de historia (muerto, test 7), sin chequeo de `rutas_sincronizacion` (muerto, test 3); anular `if (diferencias.length > 0)` no concluyente (colgo el runner). IMP-1 muestra ese hueco de cobertura.
- Sin hallazgos en las transiciones: ninguna entrada hace a `new`, `plan`, `approve` o `finish` sobrescribir un ROADMAP sin marca, en `rutas_sincronizacion`, con cambios sin commitear, con otras mayusculas o borrado con historia.

## Lecturas fuera del contexto permitido

- `src/fs/git-commit.ts` (autoCommit y `regenerarRoadmap`) y `src/core/config.ts` (validacion de `rutas_sincronizacion`): comprobar el punto de integracion y la normalizacion de rutas.
- `bin/taskctl`: ejecutar el CLI a mano.
