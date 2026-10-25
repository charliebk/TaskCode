---
id: TASK-063
titulo: "Metricas v2: medir el comportamiento del plugin para decidir mejoras con datos"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: null
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-063-metricas-v2-medir-el-comportamiento-del
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

Antes de mejorar el plugin en tiempo, tokens, verificacion o memoria de contexto hay que saber donde se va el esfuerzo (Carlos, 2026-10-25). Una medicion a mano sobre ToolsaWeb (65 tareas terminadas) mostro que el flujo funciona y mejora con el tiempo, pero con huecos que impiden decidir: solo 16 de 65 tareas tienen tokens de implementacion registrados (4 de 48 en TaskCode), el total mezcla lectura de cache con tokens nuevos y exagera el coste, no se sabe si un hallazgo de revision viene de la implementacion o de un plan ambiguo, y no se mide cuanto lee cada agente para orientarse en el proyecto (lo que justificaria o no una memoria o grafo de conceptos). Esta tarea tapa esos huecos y da una vista de evolucion para que las siguientes mejoras se elijan por cifras.

## Criterios de aceptacion
- [ ] registrar-coste guarda los tokens de cada fase desglosados en entrada, escritura de cache, lectura de cache y salida; las tareas antiguas con solo el total siguen siendo validas y metricas muestra por separado los tokens nuevos y la lectura de cache.
- [ ] taskctl metricas lista las tareas terminadas a las que les falta coste en alguna fase (diseno, implementacion, revision), y finish avisa sin bloquear si la tarea se cierra sin coste de implementacion.
- [ ] metricas cuenta por tarea las rondas de revision y los hallazgos CRITICO, IMPORTANTE y MENOR leyendo los informes, incluidos los nombrados por revisor (informe-revision-N-<revisor>.md).
- [ ] El formato de hallazgo del informe de revision admite un campo origen (implementacion, plan o especificacion) que la skill de revision pide rellenar; metricas da el reparto y los informes sin ese campo cuentan como sin clasificar.
- [ ] Desde las transcripciones de los subagentes, registrar-coste guarda cuantas llamadas de lectura y busqueda (Read, Grep, Glob y equivalentes) hizo cada fase, y metricas da su mediana por fase.
- [ ] taskctl metricas --evolucion [--tramo N] agrupa las tareas terminadas en tramos de N (20 por defecto) con mediana de minutos plan a finish, rondas medias, hallazgos IMPORTANTE por tarea, tokens de revision y KB de peticiones de revision; con --json da lo mismo en JSON.
- [ ] Tests contra repos Git temporales reales con tareas en formato antiguo y nuevo y transcripciones jsonl de ejemplo; README y CHANGELOG documentan las metricas nuevas.
- [ ] Linea base: la salida de taskctl metricas --evolucion sobre ToolsaWeb (solo lectura, sin escribir en ese repo) queda copiada en el Resultado de la tarea.
