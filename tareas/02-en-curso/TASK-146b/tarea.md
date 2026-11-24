---
id: TASK-146b
titulo: "registrar-coste, readdir, fecha y cabeceras (parte b de TASK-146)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-146-regla-4d-duplicacion-en-new-import-roadm
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: [TASK-146a]
---
## Objetivo

Parte b del troceo de TASK-146 (Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste), partes TASK-146a, TASK-146b en la rama fix/task-146-regla-4d-duplicacion-en-new-import-roadm.

registrar-coste suma con CAMPOS_COSTE, un helper de readdir tolerante y claveRuta en un sitio, diaLocal en doctor-deploy y creado con la regla de new, cabeceras fieles y la historia de runPlan fuera del codigo.

## Criterios de aceptacion
- [ ] registrar-coste suma con CAMPOS_COSTE, los readdir tolerantes y claveRuta tienen un solo helper, y doctor-deploy usa diaLocal con la fecha de creado igual que new
- [ ] Las cabeceras de registrar-coste, veredicto y review describen lo que hace el codigo, y runPlan deja la historia de las rondas en el CHANGELOG

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T15:32:33Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T15:32:59Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T15:33:01Z | start | automatico | persona | 0.16.1 |
