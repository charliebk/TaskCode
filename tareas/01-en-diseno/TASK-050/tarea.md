---
id: TASK-050
titulo: "F6-T1 Suite rapida y repo plantilla en los tests"
tipo: feature
sprint: 7
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-050-f6-t1-suite-rapida-y-repo-plantilla-en-l
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

La suite completa tarda unos 11 minutos y no hay forma de iterar mas rapido
(auditoria B3, B4, B7). Se anade `npm run test:rapido` con los tests de core
y cli que no lanzan procesos, se crea un helper que monta el repo Git base
una vez por fichero y lo copia con `fs.cp` en vez de repetir los `git init`
y commits de cada test, y se mide cuanto cuesta la cobertura para decidir si
va en un `test:cov` aparte.

## Criterios de aceptacion
- [ ] `npm run test:rapido` (core y cli, sin procesos) en menos de 1 min; `npm test` sigue siendo la suite completa
- [ ] Helper que crea el repo base una vez por fichero y lo copia con `fs.cp`, adoptado en los 5 ficheros mas lentos
- [ ] Medicion con y sin `--experimental-test-coverage` anotada; si compensa, `test:cov` aparte

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
