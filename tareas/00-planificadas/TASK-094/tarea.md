---
id: TASK-094
titulo: "Cerrojo: una sola verificación de taskctl a la vez por repo"
tipo: feature
sprint: 0
etiquetas: [verificacion, concurrencia]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-094-cerrojo-una-sola-verificacion-de-taskctl
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Que el freno de fin de turno, taskctl review y taskctl finish no lancen dos verificaciones a la vez en la misma carpeta. En ToolsaWeb (2026-11-10) dos verificaciones simultáneas vaciaron el registro de evidencias de la otra y bloquearon su base SQLite de Liquibase («database is locked»). ToolsaWeb lo resolvió en su verificar.bat (TASK-298); esto lo hace genérico para todos los proyectos: un cerrojo por carpeta de trabajo que el sistema suelte al morir el proceso (sin cerrojos huérfanos), y si ya hay una en curso, salir con un mensaje claro que nombre la que corre (sin esperar: el freno tiene un tope de 3540 s).

## Criterios de aceptacion
- [ ] Con una verificación de taskctl en curso, una segunda (freno, review o finish) sale sin ejecutar el comando y con un mensaje que nombra la que corre; test con dos procesos reales
- [ ] Si el proceso titular muere (también con sus hijos huérfanos ya muertos), el cerrojo queda libre sin limpieza manual; test en Windows y en POSIX
- [ ] El freno de fin de turno trata «otra verificación en curso» como aviso, no como rojo, y no lo guarda en su memo (test)
- [ ] Compatible con un proyecto que ya tiene su propio cerrojo dentro del comando (ToolsaWeb: verificar.bat sale con 3): documentado y con un test de que no se bloquean entre sí
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningún test
