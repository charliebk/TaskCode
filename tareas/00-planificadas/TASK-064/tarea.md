---
id: TASK-064
titulo: "Metricas v2 (B): leer y mostrar la evolucion del flujo"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-064-metricas-v2-b-leer-y-mostrar-la-evolucio
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-10-25
actualizado: 2026-10-25
dependencias: []
---
## Objetivo

Segunda mitad de la particion de TASK-063 (decidida en su diseno, Carlos 2026-10-25). TASK-063 captura los datos nuevos (tabla ## Coste con desglose y lecturas, columna Origen en los hallazgos); esta tarea los lee junto con lo que ya existe (frontmatter, informes de revision, ## Transiciones) y los muestra en taskctl metricas, incluida una vista de evolucion por tramos, y deja una linea base medida sobre ToolsaWeb para elegir las siguientes mejoras (tokens, tiempo, verificacion, memoria de contexto) por cifras. Decisiones ya tomadas: tramos ordenados por fecha de cierre; tokens nuevos = entrada + escritura de cache + salida, con la lectura de cache aparte.

## Criterios de aceptacion
- [ ] taskctl metricas muestra por tarea los tokens nuevos (entrada + escritura de cache + salida) y la lectura de cache por separado cuando hay tabla ## Coste, y como sin desglose la diferencia entre tokens_<fase> y lo desglosado.
- [ ] taskctl metricas lista las tareas terminadas a las que les falta coste en alguna fase (diseno, implementacion, revision).
- [ ] taskctl metricas cuenta por tarea las rondas y los hallazgos CRITICO, IMPORTANTE y MENOR de informe-revision-N.md e informe-revision-N-<revisor>.md, y su reparto por origen, con sin clasificar para los informes sin columna Origen.
- [ ] taskctl metricas da la mediana de lecturas por fase de las tareas que tienen tabla ## Coste.
- [ ] taskctl metricas --evolucion [--tramo N] agrupa las tareas terminadas por fecha de cierre en tramos de N (20 por defecto) con mediana de minutos plan a finish, rondas medias, hallazgos IMPORTANTE por tarea, tokens de revision y KB de peticiones de revision; con --json la salida pasa JSON.parse.
- [ ] Tests contra repos Git temporales reales con tareas en formato antiguo y nuevo; README y CHANGELOG documentan las metricas nuevas.
- [ ] Linea base: la salida de taskctl metricas --evolucion ejecutado sobre ToolsaWeb queda copiada en el Resultado, y git status en ToolsaWeb sigue igual que antes de ejecutarlo.
