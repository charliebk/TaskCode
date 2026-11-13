---
id: TASK-113
titulo: "P-5: peticion de revision mas ligera con los tests como --stat y ruta"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-113-p-5-peticion-de-revision-mas-ligera-con
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

La peticion de la ronda 1 pesa 116 KB de mediana en ToolsaWeb (unos 30 K tokens por revisor antes de leer nada) porque embebe el diff entero de los tests. Que embeba el diff del codigo y liste los tests con --stat y su ruta. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-5)

## Criterios de aceptacion
- [ ] La peticion embebe el diff del codigo de produccion y lista los ficheros de test con su --stat y su ruta, sin su diff (test en repo temporal)
- [ ] Con un diff de tres ficheros de test grandes, la peticion pesa menos de la mitad que con la version anterior (test que compara tamanos)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T00:11:26Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T00:12:08Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T00:12:10Z | start | automatico | persona | 0.14.0 |
