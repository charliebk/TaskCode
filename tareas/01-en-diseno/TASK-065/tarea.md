---
id: TASK-065
titulo: "Metricas v2 (C): evolucion, grupos y varios proyectos"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-065-metricas-v2-c-evolucion-grupos-y-varios
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 683666
tokens_implementacion: null
tokens_revision: null
creado: 2026-10-25
actualizado: 2026-10-25
dependencias: [TASK-064]
---
## Objetivo

Parte de agregados de la particion de TASK-064 (decidida en su diseno, Carlos 2026-10-25). TASK-064 enriquece la fila de metricas de cada tarea (coste desglosado, hallazgos por severidad y origen, lecturas); esta tarea agrega esas filas para elegir mejoras por cifras: evolucion por tramos, grupos por tipo, complejidad, criterios y tamano, y varios proyectos a la vez, con una linea base sobre ToolsaWeb, OpenGisViewer y TaskCode. Una medicion a mano sobre 189 tareas mostro que el tamano de la tarea es lo que mas pesa en el resultado de la revision (0-4 criterios: 52 % aprobadas a la primera; 7 o mas: 12 %) y que ToolsaWeb es la excepcion. Decisiones ya tomadas (Carlos, 2026-10-25): hallazgos contados una vez por tarea (revisor + ID); aprobada a la primera = una sola ronda con veredicto aprobada o aprobada-con-correcciones, y las tareas sin revision se cuentan aparte; terciles de KB calculados con todos los proyectos juntos; tramos ordenados por fecha de cierre con desempate estable por proyecto e ID. Plan de partida: tareas/.../TASK-064/planificacion/plan-final.md (pasos 3 a 5).

## Criterios de aceptacion
- [ ] taskctl metricas --evolucion [--tramo N] agrupa las tareas terminadas por fecha de cierre (desempate por proyecto e ID) en tramos de N (20 por defecto) con mediana de minutos plan a finish, rondas medias, hallazgos IMPORTANTE por tarea, tokens de revision y KB de peticiones de revision, y dice cuantas tareas quedaron fuera por no tener fecha de cierre.
- [ ] taskctl metricas --grupos agrupa las tareas terminadas por tipo, por complejidad, por numero de criterios (0-4, 5-6, 7 o mas) y por KB de peticion de revision por ronda (terciles con todos los proyectos juntos), con porcentaje aprobado a la primera, rondas medias y hallazgos CRITICO+IMPORTANTE por tarea, y cuenta aparte las tareas sin revision o sin tabla de hallazgos.
- [ ] taskctl metricas --repo <ruta> (repetible; por defecto el repo actual) junta varios proyectos con la clave (proyecto, id) en toda la lectura, de modo que un mismo TASK-NNN en dos repos no mezcla datos; con un solo repo la salida es la de hoy, y --repo junto a --escribir aborta sin tocar nada.
- [ ] Con --json y --evolucion o --grupos, la salida es un unico objeto que pasa JSON.parse tambien sin tareas y con grupos vacios (sin NaN ni null silenciosos); el texto humano y los avisos van por stderr.
- [ ] Tests contra repos Git temporales reales (dos repos con el mismo TASK-NNN, grupo vacio, sin tareas, --repo con --escribir); README y CHANGELOG documentan las metricas nuevas.
- [ ] Linea base: la salida de taskctl metricas --evolucion --grupos con --repo sobre ToolsaWeb, OpenGisViewer y TaskCode queda copiada en el Resultado, y git status en cada uno de los tres sigue igual que antes de ejecutarlo.
- [ ] Un flag repetido que no admite repeticion aborta con error en cualquier comando de taskctl en vez de pisar el valor anterior; --repo y --agente usan el mismo lector de flags repetibles; --json solo se combina con una lista cerrada de flags y con cualquier otro (p. ej. --escribir) aborta sin escribir nada.
- [ ] La lista de tareas terminadas sin coste muestra el recuento por fase, las 10 primeras y «y N mas» (completa solo en --json), y el README del plugin documenta las columnas, avisos y flags de metricas.
- [ ] taskctl registrar-coste --agente <id> con un id ya anotado en la tabla ## Coste de esa fase registra solo la diferencia entre la transcripcion acumulada y lo ya anotado para ese id, la fila lo indica en su fuente, y metricas no la avisa como repetida; un test con una transcripcion que crece entre dos registros fija la cifra.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-25T19:05:21Z | plan | automatico | persona |
| 2026-10-25T19:15:04Z | approve | automatico | automatico |
