---
id: TASK-165
titulo: "Regla 4D (2a auditoria): disfraz en tests"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-165-regla-4d-2a-auditoria-disfraz-en-tests
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
dependencias: []
---
## Objetivo

Que cada test cace el mutante de lo que dice probar en los casos de disfraz de la segunda auditoria 4D (docs/auditoria-4d-segunda.md).

## Criterios de aceptacion
- [ ] Los seis disfraz confirmados por mutacion tienen un test que caza su mutante (TC-3, TC-4, TR-4, SC-08, C2-28, HK-2a)
- [ ] Los tests cuyo titulo promete un estado o un motivo lo asiertan (TC-1, TC-2, TC-7, K2-03)
- [ ] La prioridad de abort-merge con dos operaciones a la vez tiene test (SC-07)
- [ ] Los tests que dependen de la maquina o solo miran imports estaticos son robustos o lo anotan (TR-5, TR-6, TR-7, TC-5, FS-17, HK-5, HK-2b)
