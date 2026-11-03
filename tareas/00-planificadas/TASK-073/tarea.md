---
id: TASK-073
titulo: "Tests held-out por tarea"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: planificada
plan_aprobado: false
rama: feature/task-073-tests-held-out-por-tarea
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-03
actualizado: 2026-11-03
dependencias: [TASK-070, TASK-072]
---
## Objetivo

Freno 7 de brakes: tests de aceptacion que la persona escribe a partir de los criterios y que el agente implementador no puede leer ni editar.

## Criterios de aceptacion
- [ ] Carpeta aceptacion/ dentro de la carpeta de la tarea, y clave comando_heldout opcional en config.yml
- [ ] El plugin declara reglas deny de Read y Edit sobre las carpetas aceptacion/ para el agente implementador
- [ ] taskctl finish ejecuta los held-out de la tarea y aborta si fallan
- [ ] La skill de flujo explica cuando escribirlos y el agente revisor si puede leerlos
- [ ] Tests: deny efectivo, finish rojo y verde
