---
id: TASK-146
titulo: "Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-146-regla-4d-duplicacion-en-new-import-roadm
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

Quitar las reimplementaciones de helpers existentes en comandos sueltos (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD2-06, CMD2-07, CMD2-10 a CMD2-13, CMD2-15, CMD2-16 y CMD1-08).

## Criterios de aceptacion
- [ ] import valida y compone la tarea con lo mismo que new (componerCuerpo, defaults, propuesta de complejidad); el modelo por defecto esta en un solo sitio
- [ ] roadmap --comparar decide con prepararRoadmap; verificar-lote usa headCommit y listTareasEnEstados y un fallo de git o de readdir no da un lote verde
- [ ] registrar-coste suma con CAMPOS_COSTE; los readdir tolerantes y claveRuta tienen un solo helper; doctor-deploy usa diaLocal y la fecha de creado es la misma que la de new
- [ ] Las cabeceras de registrar-coste, veredicto y review describen lo que hace el codigo y runPlan deja la historia de las rondas en el CHANGELOG
