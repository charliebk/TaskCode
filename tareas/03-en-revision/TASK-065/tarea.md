---
id: TASK-065
titulo: "Metricas v2 (C): evolucion, grupos y varios proyectos"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-065-metricas-v2-c-evolucion-grupos-y-varios
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 683666
tokens_implementacion: 34183483
tokens_revision: 7908320
creado: 2026-10-25
actualizado: 2026-10-25
dependencias: [TASK-064]
---
## Objetivo

Parte de agregados de la particion de TASK-064 (decidida en su diseno, Carlos 2026-10-25). TASK-064 enriquece la fila de metricas de cada tarea (coste desglosado, hallazgos por severidad y origen, lecturas); esta tarea agrega esas filas para elegir mejoras por cifras: evolucion por tramos, grupos por tipo, complejidad, criterios y tamano, y varios proyectos a la vez, con una linea base sobre ToolsaWeb, OpenGisViewer y TaskCode. Una medicion a mano sobre 189 tareas mostro que el tamano de la tarea es lo que mas pesa en el resultado de la revision (0-4 criterios: 52 % aprobadas a la primera; 7 o mas: 12 %) y que ToolsaWeb es la excepcion. Decisiones ya tomadas (Carlos, 2026-10-25): hallazgos contados una vez por tarea (revisor + ID); aprobada a la primera = una sola ronda con veredicto aprobada o aprobada-con-correcciones, y las tareas sin revision se cuentan aparte; terciles de KB calculados con todos los proyectos juntos; tramos ordenados por fecha de cierre con desempate estable por proyecto e ID. Plan de partida: tareas/.../TASK-064/planificacion/plan-final.md (pasos 3 a 5).

## Criterios de aceptacion
- [x] taskctl metricas --evolucion [--tramo N] agrupa las tareas terminadas por fecha de cierre (desempate por proyecto e ID) en tramos de N (20 por defecto) con mediana de minutos plan a finish, rondas medias, hallazgos IMPORTANTE por tarea, tokens de revision y KB de peticiones de revision, y dice cuantas tareas quedaron fuera por no tener fecha de cierre.
- [x] taskctl metricas --grupos agrupa las tareas terminadas por tipo, por complejidad, por numero de criterios (0-4, 5-6, 7 o mas) y por KB de peticion de revision por ronda (terciles con todos los proyectos juntos), con porcentaje aprobado a la primera, rondas medias y hallazgos CRITICO+IMPORTANTE por tarea, y cuenta aparte las tareas sin revision o sin tabla de hallazgos.
- [x] taskctl metricas --repo <ruta> (repetible; por defecto el repo actual) junta varios proyectos con la clave (proyecto, id) en toda la lectura, de modo que un mismo TASK-NNN en dos repos no mezcla datos; con un solo repo la salida es la de hoy, y --repo junto a --escribir aborta sin tocar nada.
- [x] Con --json y --evolucion o --grupos, la salida es un unico objeto que pasa JSON.parse tambien sin tareas y con grupos vacios (sin NaN ni null silenciosos); el texto humano y los avisos van por stderr.
- [x] Tests contra repos Git temporales reales (dos repos con el mismo TASK-NNN, grupo vacio, sin tareas, --repo con --escribir); README y CHANGELOG documentan las metricas nuevas.
- [x] Linea base: la salida de taskctl metricas --evolucion --grupos con --repo sobre ToolsaWeb, OpenGisViewer y TaskCode queda copiada en el Resultado, y git status en cada uno de los tres sigue igual que antes de ejecutarlo.
- [x] Un flag repetido que no admite repeticion aborta con error en cualquier comando de taskctl en vez de pisar el valor anterior; --repo y --agente usan el mismo lector de flags repetibles; --json solo se combina con una lista cerrada de flags y con cualquier otro (p. ej. --escribir) aborta sin escribir nada.
- [x] La lista de tareas terminadas sin coste muestra el recuento por fase, las 10 primeras y «y N mas» (completa solo en --json), y el README del plugin documenta las columnas, avisos y flags de metricas.
- [x] taskctl registrar-coste --agente <id> con un id ya anotado en la tabla ## Coste de esa fase registra solo la diferencia entre la transcripcion acumulada y lo ya anotado para ese id, la fila lo indica en su fuente, y metricas no la avisa como repetida; un test con una transcripcion que crece entre dos registros fija la cifra.

## Resultado

Cerrada el 2026-10-25 en 1 ronda de revision por pares (aprobada-con-correcciones, sin CRITICO ni IMPORTANTE; 3 MENOR aceptados). Cierra Metricas v2 (TASK-063, 064 y 065).

**Lo entregado.**

- `taskctl metricas --evolucion [--tramo N]`: tramos por fecha de cierre (solo el dia; desempate por proyecto y numero de ID) con mediana de minutos plan a finish, rondas, IMPORTANTE por tarea, tokens de revision y KB por ronda; cada cifra con su `n` y recuento de tareas sin cierre.
- `taskctl metricas --grupos`: por tipo, complejidad, numero de criterios (0-4, 5-6, 7+), terciles de KB por ronda (con todos los proyectos juntos, cortados por valor) y por proyecto (dimension anadida por quien implemento, aceptada en revision), con % aprobada a la primera, rondas medias y CRIT+IMP por tarea; sin revision y sin tabla contadas aparte.
- `--repo <ruta>` repetible: clave `(proyecto, id)`, `realpath` sin duplicados, aborto si la ruta no existe, no tiene `tareas/`, falta el valor o dos rutas comparten basename; `--repo` con `--escribir` aborta. Con un solo repo la salida es byte a byte la de antes.
- `--json`: un objeto `{proyectos, sinCoste, evolucion?, grupos?}` que pasa `JSON.parse` tambien sin tareas; solo combinable con una lista cerrada de flags.
- Flags repetidos: `--repo`, `--agente` y `--criterio` comparten lector; en cualquier otro comando un flag repetido aborta en vez de pisarse.
- Lista de terminadas sin coste acotada (recuento por fase, 10 primeras y «y N mas»; completa en `--json`) y README al dia (MEN-4 de TASK-064).
- Coste de agentes reanudados: `registrar-coste --agente <id>` con un id ya anotado en esa fase registra solo la diferencia (`agente:dif:<id>`) y `metricas` no la avisa como repetida.

**Suite.** 1428 tests; fallan los 5 conocidos (3 de Windows y 2 de «contraprueba de descubrimiento»).

**Revision.** Reproducida en clon temporal, CLI real con todos los casos de `--repo`, `--json`, `--tramo`, flags repetidos y agente reanudado, y 16 de 18 mutantes detectados. MENOR aceptados sin corregir (el codigo mergeado es el revisado):

- MEN-1: el test de orden por numero de ID usa `TASK-099`/`TASK-100`, que ya ordenan bien como cadena; no protege `TASK-999` frente a `TASK-1000`. Sin fallo hoy.
- MEN-2: el aborto cuando un campo de la transcripcion encoge no tiene test (el guard existe y funciona).
- MEN-3: una fila mixta `agente:nuevo,dif:reanudado` impide reanudar despues cualquiera de los dos; el mensaje pide `--tokens N`. Limite de la decision: conviene registrar un agente por llamada.

### Linea base (2026-10-25)

`taskctl metricas --evolucion --grupos --repo ToolsaWeb --repo OpenGisViewer --repo TaskCode`, en solo lectura: `git status` de `tareas/`, `docs/` y `.taskcode/` igual antes y despues en los tres (verificado por quien implemento y por el revisor). Repos leidos: ToolsaWeb 135 tareas, OpenGisViewer 140, TaskCode 65. 194 terminadas; 36 con algun informe sin tabla de hallazgos (sus hallazgos cuentan como sin dato).

| grupo | tareas | a la primera | rondas medias | CRIT+IMP/tarea |
|---|---|---|---|---|
| fix | 53 | 71.7% | 1.34 | 0.19 |
| feature | 141 | 22.7% | 2.06 | 1.67 |
| simple | 65 | 72.3% | 1.31 | 0.11 |
| media | 98 | 18.4% | 2.05 | 1.6 |
| alta | 21 | 4.8% | 2.71 | 2.75 |
| criterios 0-4 | 91 | 51.6% | 1.63 | 0.62 |
| criterios 5-6 | 53 | 32.1% | 1.91 | 1.43 |
| criterios 7+ | 50 | 12% | 2.26 | 2.69 |
| KB/ronda <= 31.9 | 65 | 67.7% | 1.43 | 0.37 |
| KB/ronda 31.9-73.3 | 65 | 21.5% | 2.11 | 1.43 |
| KB/ronda > 73.3 | 64 | 18.8% | 2.06 | 1.98 |
| ToolsaWeb | 68 | 14.7% | 2.12 | 1.66 |
| OpenGisViewer | 76 | 44.7% | 1.72 | 1.03 |
| TaskCode | 50 | 52% | 1.74 | 0.84 |

Evolucion (tramos de 20 por fecha de cierre; 9 tareas de TaskCode sin fecha de cierre, fuera):

| tramo | cierres | min plan->finish | rondas | IMP/tarea | KB/ronda |
|---|---|---|---|---|---|
| 1 | 09-07 a 10-04 | 208.7 | 2.55 | 0.8 (n=5) | 72.6 |
| 2 | 10-04 a 10-05 | 72.5 | 1.55 | 0.88 | 29.7 |
| 3 | 10-05 a 10-06 | 87.3 | 1.45 | 0.58 | 51.9 |
| 4 | 10-07 a 10-08 | 96.5 | 1.75 | 0.84 | 60 |
| 5 | 10-08 a 10-12 | 153.2 | 1.65 | 1.87 | 64.1 |
| 6 | 10-12 a 10-17 | 126.5 | 1.7 | 1.26 | 59.7 |
| 7 | 10-17 a 10-19 | 89.2 | 2.05 | 1.55 | 101.6 |
| 8 | 10-19 a 10-22 | 90.9 | 2.25 | 1.4 | 127.7 |
| 9 | 10-22 a 10-25 | 113.2 | 1.95 | 1.55 | 100.7 |
| 10 | 10-25 (5 tareas) | 168 | 2.4 | 2.2 | 77.9 |

Lectura: el tamano de la tarea (criterios, complejidad, KB de la peticion de revision) es lo que mas pesa en el resultado de la revision; ToolsaWeb es la excepcion (14.7 % a la primera con todas sus tareas con tabla de hallazgos). En los ultimos tramos crecen los KB por ronda y los IMPORTANTE por tarea. Cifras coherentes con la medicion a mano del Objetivo. Los datos nuevos (desglose de coste, origen de hallazgos, lecturas) empiezan a acumularse cuando los proyectos actualicen el plugin.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-25T19:05:21Z | plan | automatico | persona |
| 2026-10-25T19:15:04Z | approve | automatico | automatico |
| 2026-10-25T19:15:05Z | start | automatico | persona |
| 2026-10-25T22:16:24Z | review | automatico | persona |
