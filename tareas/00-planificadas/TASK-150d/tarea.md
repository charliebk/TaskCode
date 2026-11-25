---
id: TASK-150d
titulo: "pasos copiados, diluvio e historial, y la sonda (parte d de TASK-150)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-150c]
---
## Objetivo

Parte d del troceo de TASK-150 (Regla 4D: skills y agentes con una sola fuente por regla), partes TASK-150a, TASK-150b, TASK-150c, TASK-150d en la rama fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f.

CONT-10 a CONT-15 y CONT-17.

Troceo sin preguntar: autorizado por Carlos (2026-11-22, y 2026-11-24 al
pedir seguir hasta la 0.19.0).

## Criterios de aceptacion
- [ ] Los pasos copiados (cadena, coste, tope de rondas, MENORES, una suite por ronda) remiten a una sola guia; sin diluvio ni historial de versiones en las skills; la sonda de hooks inerte sale del plugin
- [ ] Un test por paso falla si vuelve a copiarse
