---
id: TASK-110
titulo: "Progreso visible sin tokens: estado de cada fase en el terminal"
tipo: feature
sprint: 0
etiquetas: [progreso, agilidad]
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-110-progreso-visible-sin-tokens-estado-de-ca
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Mientras taskctl y sus hooks trabajan (la verificacion de finish, unos 28 min en ToolsaWeb; el freno Stop; las rondas de revision; la suite de 25 min) la persona no ve en que paso van y pregunta al agente cada pocos minutos, lo que gasta tokens. taskctl escribe el estado de la tarea en curso (fase, paso, x/N, tiempo) y la persona lo ve sin pasar por el agente.

## Criterios de aceptacion
- [ ] plan, approve, start, review, finish y el freno Stop escriben en .git/taskcode/progreso.json la tarea, la fase, el paso, x/N si lo hay y el instante de inicio, y lo marcan como terminado al acabar (un test con repo temporal por comando)
- [ ] taskctl estado imprime TASK-NNN · <fase> · <paso> x/N · <mm> min leyendo solo ese fichero, sin lanzar git y en menos de 200 ms (test)
- [ ] taskctl estado --seguir refresca cada segundo hasta que la fase termina (test con un fichero que cambia)
- [ ] El comando de verificacion recibe TASKCTL_PROGRESO con la ruta de un fichero; si escribe x/N en el, taskctl estado lo muestra (test con un script que lo escribe)
- [ ] taskctl doctor ofrece instalar una status line de Claude Code que muestra taskctl estado, y solo la instala con un flag explicito (test sobre un settings.json temporal)
- [ ] npm test de TaskCode muestra [x/N] mientras corre, con un reporter sin dependencias y el total de la ejecucion anterior (test del reporter)
- [ ] Sin tarea en curso, taskctl estado dice que no hay nada en marcha y sale con 0 (test)
- [ ] La suite completa pasa (npm test) sin debilitar ningun test
