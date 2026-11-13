---
id: TASK-119
titulo: "P-11: menos commits de proceso por tarea"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-119-p-11-menos-commits-de-proceso-por-tarea
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

Cada tarea deja 23-26 commits de los que 3-4 son de codigo: coste, veredicto, peticion e informe van en commits separados. Cada uno lanza varios procesos git en Windows y ensucia el historial. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-11)

## Criterios de aceptacion
- [ ] registrar-coste y veredicto no crean commit propio: su cambio entra en el commit del siguiente comando de fase sin que la guarda de workspace limpio lo bloquee (test con repo temporal)
- [ ] Un ciclo completo new, plan, approve, start, review con una ronda y finish deja como mucho la mitad de commits de proceso que hoy (test que los cuenta)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T08:27:07Z | plan | automatico | persona | 0.14.0 |
