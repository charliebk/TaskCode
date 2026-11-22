---
id: TASK-140
titulo: "Regla 4D: diluvio del cerrojo de verificar-impacto y poda por fusion"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-140-regla-4d-diluvio-del-cerrojo-de-verifica
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-22
dependencias: []
---
## Objetivo

Revisar los dos casos de diluvio y disfraz dudoso de la auditoria 4D de TASK-137 (docs/auditoria-4d.md, casos C1-C2): el segundo cerrojo .robo de TASK-136 y la poda de TASK-130 que bajo el contador fusionando tests sin medir duracion.

## Criterios de aceptacion
- [ ] scripts/verificar-impacto.mjs recupera el cerrojo muerto sin el mecanismo .robo (borrar y reintentar wx), con los tests de solape y pid muerto en verde y el test de 9 s eliminado o acortado
- [ ] Se mide la duracion de la suite antes y despues de la poda de TASK-130 y queda anotada; si la ganancia es solo de contador, se decide con Carlos si se deshacen las fusiones que ocultan casos tras el primer fallo
