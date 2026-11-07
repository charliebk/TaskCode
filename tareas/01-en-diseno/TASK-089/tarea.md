---
id: TASK-089
titulo: "Evitar literales con forma de secreto en el repo y tags de version que faltan"
tipo: feature
sprint: 0
etiquetas: [seguridad, distribucion, tests]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-089-evitar-literales-con-forma-de-secreto-en
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

La proteccion de GitHub bloqueo el push de 0.11.0 por una clave de Stripe falsa de un test y hubo que reescribir el historial local. Evitar que vuelva a pasar y crear los tags v0.9.0 y v0.10.0 que nunca se crearon.

## Criterios de aceptacion
- [ ] Un test de la suite falla si algun fichero versionado contiene un literal que case con los patrones de clave de GitHub (Stripe, AWS, GitHub...) sin trocear
- [ ] Los fixtures de doctor-deploy construyen sus claves troceadas y siguen detectandose; sus tests en verde
- [ ] Existen los tags anotados v0.9.0 y v0.10.0 en los commits de esas versiones y estan en origin
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T19:37:59Z | plan | automatico | persona |
