---
id: TASK-147
titulo: "Regla 4D: lectores de secciones e IDs en core"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Que cada seccion de tarea.md y cada ID se lean con un solo lector (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CORE1-01, CORE1-02, CORE2-01, CORE2-02, CORE2-04 a CORE2-07, CORE2-12 a CORE2-14, FS-04 y CMD2-08).

## Criterios de aceptacion
- [ ] duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen y escriben secciones con rangoDeSeccion y un helper comun para crear la seccion al final; un test con el encabezado dentro de un bloque de codigo lo distingue
- [ ] casillasSinMarcar usa extraerSecciones (Tras el cierre en negrita y ### Criterios) y validacion-tarea usa normalizarTexto; citar() existe una vez
- [ ] El ID de tarea se valida y se ordena con una sola regex y un solo lector de numero con letra (task-store, wip-scan, roadmap, trocear, evolucion, flujo); un test con TASK-121a y TASK-1000 ordena igual en roadmap, evolucion, board y wip
- [ ] FaseMedida y FaseRegistrada son un solo tipo y fila a Marca se convierte una vez en metricas

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T06:28:28Z | plan | automatico | persona | 0.16.1 |
