---
id: TASK-063
titulo: "Metricas v2 (A): capturar desglose de coste, lecturas y origen de hallazgos"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-063-metricas-v2-medir-el-comportamiento-del
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 608039
tokens_implementacion: null
tokens_revision: null
creado: 2026-10-25
actualizado: 2026-10-25
dependencias: []
---
## Objetivo

Antes de mejorar el plugin en tiempo, tokens, verificacion o memoria de contexto hay que saber donde se va el esfuerzo (Carlos, 2026-10-25). Una medicion a mano sobre ToolsaWeb (65 tareas terminadas) mostro que el flujo funciona y mejora con el tiempo, pero con huecos que impiden decidir: solo 16 de 65 tareas tienen tokens de implementacion registrados (4 de 48 en TaskCode), el total mezcla lectura de cache con tokens nuevos y exagera el coste, no se sabe si un hallazgo de revision viene de la implementacion o de un plan ambiguo, y no se mide cuanto lee cada agente para orientarse en el proyecto (lo que justificaria o no una memoria o grafo de conceptos). Esta tarea tapa esos huecos y da una vista de evolucion para que las siguientes mejoras se elijan por cifras.

En el diseno se partio en dos (Carlos, 2026-10-25): esta tarea es la parte A, que **captura** los datos nuevos y cambia formatos; TASK-064 (parte B) los **lee** y los muestra en `taskctl metricas`, con la vista de evolucion y la linea base de ToolsaWeb.

## Criterios de aceptacion
- [ ] `taskctl registrar-coste TASK-NNN --fase <f> --agente <id>` anade una fila a la tabla `## Coste` de `tarea.md` (fecha, fase, fuente, entrada, cache_escritura, cache_lectura, salida, lecturas) con el desglose sumado de los agentes, y sigue sumando el total a `tokens_<fase>` en el mismo commit; `--tokens N` deja una fila con solo el total.
- [ ] Una tarea sin tabla `## Coste` sigue siendo valida: `taskctl doctor` no da error y los tests de tareas en formato antiguo pasan sin cambios.
- [ ] `lecturas` cuenta los `tool_use` de la transcripcion, sin repetir el mismo id, cuyo nombre esta en la lista de herramientas de lectura (Read, Grep, Glob y los MCP de lectura o busqueda) o que son Bash con un comando que empieza por cat, head, tail, grep, rg, find, ls o sed -n; un test con un `.jsonl` de ejemplo fija el numero esperado.
- [ ] La plantilla del informe que escribe `taskctl review` y las skills de revision llevan una columna `Origen` por hallazgo (implementacion, plan o especificacion) con la instruccion de rellenarla, y `leerHallazgos(informe)` en `core/informe-revision.ts` devuelve severidad y origen de cada fila, con `sin clasificar` si falta la columna.
- [ ] `taskctl finish` avisa, sin bloquear, si la tarea se cierra con `tokens_implementacion` vacio o a 0.
- [ ] Tests contra repos Git temporales reales y transcripciones `.jsonl` de ejemplo en un `CLAUDE_CONFIG_DIR` temporal; el test de que los instalables no mencionan el proyecto sigue en verde; el CHANGELOG lo documenta.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-25T13:30:44Z | plan | automatico | persona |
| 2026-10-25T13:43:05Z | approve | automatico | automatico |
