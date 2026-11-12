---
id: TASK-116
titulo: "P-8: TaskCode declara su verificacion y doctor avisa cuando falta"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-116-p-8-taskcode-declara-su-verificacion-y-d
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

TaskCode no declara comando_verificacion, asi que los frenos que construye (Stop, puerta de finish, guardian) no actuan en su propio repo, y doctor solo lo marca omitida. Para no frenar cada tarea con la suite de 25 min, la verificacion declarada es la rapida. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-8)

## Criterios de aceptacion
- [ ] .taskcode/config.yml de TaskCode declara comando_verificacion con npm run test:rapido y taskctl doctor da ok en la comprobacion de verificacion (comprobado ejecutando doctor)
- [ ] doctor da aviso, no omitida, cuando el proyecto tiene tests detectables y no declara comando_verificacion, y dice cuantas tareas se cerraron asi (test)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
