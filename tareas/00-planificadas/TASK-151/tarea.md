---
id: TASK-151
titulo: "Regla 4D: disfraz en tests"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-151-regla-4d-disfraz-en-tests
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

Que los tests sospechosos de disfraz de la auditoria 4D completa (docs/auditoria-4d-completa.md, casos TCMD-01 a TCMD-05, TCORE-01 a TCORE-03, TCORE-08, TCORE-09, TRES-06 a TRES-09 y TRES-12) fallen cuando se rompe lo que dicen probar. Ocho se confirmaron por mutacion.

## Criterios de aceptacion
- [ ] Cada mutacion de la seccion Mutacion de docs/auditoria-4d-completa.md que quedo en verde pone ahora su test en rojo (board-format, state-machine, task-store-wip, git cmdQuoteWindows, doctor-deploy DIRS_EXCLUIDOS, review-incremental, salida-temprana, cli/estado)
- [ ] Los tests que prometen sin efectos secundarios o workspace limpio lo comprueban con git status; los que prometen error claro miran el mensaje
- [ ] doctor-correcciones no convierte un timeout ausente en skip; review-incremental corre en Linux; ultimaRonda se prueba con 10 rondas o mas
- [ ] plugin-instalado, guardia-documentacion y fases comprueban un resultado esperado (cuenta-sel, indexOf distinto de -1)
