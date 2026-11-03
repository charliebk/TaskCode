---
id: TASK-074
titulo: "Cobertura sobre las lineas cambiadas"
tipo: feature
sprint: 0
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-074-cobertura-sobre-las-lineas-cambiadas
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
dependencias: []
---
## Objetivo

Freno 8 de brakes: una linea cambiada que ningun test ejecuta es un hallazgo, medido contra la merge base y no sobre todo el repo.

## Criterios de aceptacion
- [ ] Calculo de lineas cambiadas con git diff contra la merge base de la rama de la tarea, respetando excluir_de_revision
- [ ] Lectura de un informe lcov generado por el comando del proyecto, sin ejecutar tests por su cuenta
- [ ] taskctl review incluye en la peticion las lineas no cubiertas; umbral opcional en config.yml que convierte el hallazgo en puerta de finish
- [ ] Tests con un lcov y un diff de ejemplo
