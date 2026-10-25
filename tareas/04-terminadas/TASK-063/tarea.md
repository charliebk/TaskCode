---
id: TASK-063
titulo: "Metricas v2 (A): capturar desglose de coste, lecturas y origen de hallazgos"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-063-metricas-v2-medir-el-comportamiento-del
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 608039
tokens_implementacion: 12285172
tokens_revision: 2607823
creado: 2026-10-25
actualizado: 2026-10-25
dependencias: []
---
## Objetivo

Antes de mejorar el plugin en tiempo, tokens, verificacion o memoria de contexto hay que saber donde se va el esfuerzo (Carlos, 2026-10-25). Una medicion a mano sobre ToolsaWeb (65 tareas terminadas) mostro que el flujo funciona y mejora con el tiempo, pero con huecos que impiden decidir: solo 16 de 65 tareas tienen tokens de implementacion registrados (4 de 48 en TaskCode), el total mezcla lectura de cache con tokens nuevos y exagera el coste, no se sabe si un hallazgo de revision viene de la implementacion o de un plan ambiguo, y no se mide cuanto lee cada agente para orientarse en el proyecto (lo que justificaria o no una memoria o grafo de conceptos). Esta tarea tapa esos huecos y da una vista de evolucion para que las siguientes mejoras se elijan por cifras.

En el diseno se partio en dos (Carlos, 2026-10-25): esta tarea es la parte A, que **captura** los datos nuevos y cambia formatos; TASK-064 (parte B) los **lee** y los muestra en `taskctl metricas`, con la vista de evolucion y la linea base de ToolsaWeb.

## Criterios de aceptacion
- [x] `taskctl registrar-coste TASK-NNN --fase <f> --agente <id>` anade una fila a la tabla `## Coste` de `tarea.md` (fecha, fase, fuente, entrada, cache_escritura, cache_lectura, salida, lecturas) con el desglose sumado de los agentes, y sigue sumando el total a `tokens_<fase>` en el mismo commit; `--tokens N` deja una fila con solo el total.
- [x] Una tarea sin tabla `## Coste` sigue siendo valida: `taskctl doctor` no da error y los tests de tareas en formato antiguo pasan sin cambios.
- [x] `lecturas` cuenta los `tool_use` de la transcripcion, sin repetir el mismo id, cuyo nombre esta en la lista de herramientas de lectura (Read, Grep, Glob y los MCP de lectura o busqueda) o que son Bash con un comando que empieza por cat, head, tail, grep, rg, find, ls o sed -n; un test con un `.jsonl` de ejemplo fija el numero esperado.
- [x] La plantilla del informe que escribe `taskctl review` y las skills de revision llevan una columna `Origen` por hallazgo (implementacion, plan o especificacion) con la instruccion de rellenarla, y `leerHallazgos(informe)` en `core/informe-revision.ts` devuelve severidad y origen de cada fila, con `sin clasificar` si falta la columna.
- [x] `taskctl finish` avisa, sin bloquear, si la tarea se cierra con `tokens_implementacion` vacio o a 0.
- [x] Tests contra repos Git temporales reales y transcripciones `.jsonl` de ejemplo en un `CLAUDE_CONFIG_DIR` temporal; el test de que los instalables no mencionan el proyecto sigue en verde; el CHANGELOG lo documenta.

## Resultado

Cerrada el 2026-10-25 en 1 ronda de revision por pares (aprobada, sin
CRITICO ni IMPORTANTE; 3 MENOR aceptados). Es la parte A de la particion
decidida en el diseno; la parte B (lectura en `metricas`, `--evolucion`,
linea base) es TASK-064.

**Lo entregado.**

- **Desglose de coste.** `registrar-coste --agente` escribe una fila en la
  tabla `## Coste` del cuerpo de `tarea.md` con `entrada`, `cache_escritura`,
  `cache_lectura`, `salida`, `lecturas` y `total`, y sigue sumando el total a
  `tokens_<fase>` en el mismo commit. `--tokens N` deja una fila `manual` con
  `-` en el desglose. `fuente` es `agente:<id>[,<id>...]` o `manual`.
- **Lecturas.** Se cuentan los `tool_use` deduplicados por id cuyo nombre esta
  en `HERRAMIENTAS_LECTURA` (Read, Grep, Glob, LS, NotebookRead y MCP de
  lectura conocidos) o Bash cuyo comando empieza por una palabra de
  `COMANDOS_BASH_LECTURA` (`sed` solo con `-n`). Un MCP con otro prefijo hay
  que anadirlo por nombre.
- **Origen de los hallazgos.** La plantilla de `taskctl review` y las skills de
  revision llevan la columna `Origen` (implementacion / plan / especificacion);
  `leerHallazgos` la normaliza y da `sin clasificar` si falta o no casa.
  `hallazgosNoCerrados` filtra sobre ella con su salida de siempre.
- **Aviso de `finish`** si `tokens_implementacion` esta vacio o a 0.
- Una tarea sin `## Coste` sigue valida (`doctor --json` da `tareas=ok`).

**Desviacion del plan.** La tabla tiene una columna `total` (9 en vez de 8):
sin ella la fila de `--tokens N` no tenia donde poner la cifra.

**Suite.** 1370 tests; fallan los 3 conocidos de Windows y 2 de
"contraprueba de descubrimiento" que fallan igual en develop (`claude plugin
validate` exige README en la copia temporal; propuesto como tarea aparte).
El revisor vio ademas un rojo intermitente en `doctor.test` que pasa al
repetirlo, en la rama y en develop.

**Revision (ronda 1).** Reproduccion en clon temporal, prueba manual del CLI
y 16 mutantes detectados de 17. Hallazgos aceptados sin corregir:

- MEN-1 (implementacion): falta un test de una fila dentro de un bloque de
  codigo en una seccion `## Coste` real (mutante superviviente; el codigo es
  correcto). Se cubre en TASK-064, que es quien lee esa tabla.
- MEN-2 (especificacion): registrar dos veces el mismo `--agente` suma dos
  veces y deja dos filas, como antes de la tarea. Se decide en TASK-064 si
  `metricas` deduplica por fuente.
- MEN-3 (implementacion): con una tabla ajena editada a mano en `## Coste`,
  la fila queda bajo una cabecera incorrecta. La seccion ya dice que no se
  edite a mano.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-25T13:30:44Z | plan | automatico | persona |
| 2026-10-25T13:43:05Z | approve | automatico | automatico |
| 2026-10-25T13:43:19Z | start | automatico | persona |
| 2026-10-25T14:15:02Z | review | automatico | persona |
| 2026-10-25T14:43:50Z | finish | automatico | persona |
