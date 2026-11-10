---
id: TASK-098
titulo: "ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes"
tipo: feature
sprint: 0
etiquetas: [roadmap, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-098-roadmap-de-tareas-generado-por-taskctl-e
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 838143
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Que todo proyecto tenga tareas/ROADMAP.md al dia sin escribir un script: hitos (campo sprint), orden por dependencias (ninguna tarea antes que sus predecesoras; a igualdad, el hito anterior), complejidad, estado, tareas terminadas y un resumen de lo que esta en marcha y lo que esta listo para empezar, regenerado en el commit de cada transicion. Hoy solo lo tienen ToolsaWeb y OpenDockTrading, con su propio scripts/grafo-tareas.py. Regla numero uno (decision de Carlos): no puede entrar en conflicto con esos dos proyectos; taskctl solo escribe un ROADMAP que lleve su marca o que no exista. La migracion de esos proyectos se permite solo si no rompe nada ni pierde datos, va en tareas aparte en cada repo y la decide la persona.

## Criterios de aceptacion
- [ ] Sin tareas/ROADMAP.md, cada transicion cuyo commit cae en la rama de integracion (new, plan, approve, finish tras el merge) lo crea o regenera con la marca de taskctl dentro de su mismo commit, y dos ramas de tarea en paralelo no generan conflicto de merge en el: hitos, orden por dependencias, complejidad, estado y resumen (test de integracion en un repo temporal)
- [ ] Un tareas/ROADMAP.md sin la marca de taskctl, o declarado en rutas_sincronizacion, queda byte a byte igual tras cada transicion (test con copias de los ROADMAP reales de ToolsaWeb y OpenDockTrading)
- [ ] La zona manual entre marcas se conserva al regenerar, y una dependencia circular se informa en el ROADMAP sin abortar la transicion (un test por caso)
- [ ] taskctl roadmap --comparar genera en seco y lista, sin escribir nada, lo que difiere del ROADMAP actual (tareas, hitos, dependencias, estado, zona manual); es la comprobacion previa a migrar un proyecto (test)
- [ ] skills/task-workflow, README y CHANGELOG explican el ROADMAP, la marca, la zona manual y como migrar un proyecto que ya tiene el suyo
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T15:13:28Z | plan | automatico | persona | 0.13.0 |
| 2026-11-10T15:21:53Z | approve | automatico | persona | 0.13.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T15:22:05Z | diseno | agente:a542730c857c956b4,a68ce8c1c7c63bfa6,ae3b3243d20e87593 | 52 | 114893 | 699025 | 24173 | 42 | 838143 | - | - |
