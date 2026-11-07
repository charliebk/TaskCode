---
id: TASK-090
titulo: "El guardian de secretos tolera excepciones solo en su fichero historico"
tipo: fix
sprint: 0
etiquetas: [seguridad, tests]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-090-el-guardian-de-secretos-tolera-excepcion
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

El test sin-literales-secretos de TASK-089 tolera por valor la clave de ejemplo de Stripe en cualquier fichero, y GitHub la bloquea en commits nuevos: el plan de TASK-089 la cito entera y el push de develop fallo sin que la suite avisara. Las excepciones tienen que valer solo para los ficheros historicos ya publicados.

## Criterios de aceptacion
- [ ] La lista de excepciones son parejas exactas fichero+valor; la clave de ejemplo de Stripe copiada en cualquier otro fichero versionado pone el test en rojo con ruta y linea
- [ ] Una contraprueba del test demuestra que un valor permitido en un fichero historico sigue en rojo en otro fichero
- [ ] El test pasa sobre el arbol actual, incluidos los ficheros de TASK-066 y TASK-089 ya publicados en origin
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T21:10:36Z | plan | automatico | persona |
