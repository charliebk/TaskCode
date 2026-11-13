---
id: TASK-132
titulo: "Ayudante caso() de los tests fusionados en un unico helper compartido"
tipo: fix
sprint: 0
etiquetas: [tests, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-132-ayudante-caso-de-los-tests-fusionados-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-13
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

La poda de TASK-130 dejo la misma funcion caso() copiada en diez ficheros de test (MEN-2 de su revision). Moverla a test/helpers/caso.ts y usarla desde los diez, sin cambiar ninguna asercion. Modo rapido.

## Criterios de aceptacion
- [ ] Una sola definicion de caso() en test/helpers/caso.ts; ningun fichero de test define la suya (comprobado con grep)
- [ ] Los diez ficheros que la usaban pasan en verde sin cambiar ninguna asercion

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T19:27:38Z | plan | automatico | persona | 0.14.0 |
