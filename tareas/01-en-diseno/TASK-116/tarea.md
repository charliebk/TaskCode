---
id: TASK-116
titulo: "P-8: TaskCode declara su verificacion y doctor avisa cuando falta"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-116-p-8-taskcode-declara-su-verificacion-y-d
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
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

TaskCode no declara comando_verificacion, asi que los frenos que construye (Stop, puerta de finish, guardian) no actuan en su propio repo, y doctor solo lo marca omitida. Para no frenar cada tarea con la suite de 25 min, la verificacion declarada es la rapida. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-8)

## Criterios de aceptacion
- [ ] taskctl doctor da ok en la comprobacion de verificacion de TaskCode (comprobado ejecutando doctor). Desde TASK-122, .taskcode/config.yml ya declara comando_verificacion (la suite completa, para finish) y comando_verificacion_selectiva (scripts/verificar-impacto.mjs); no hace falta declarar test:rapido
- [ ] doctor da aviso, no omitida, cuando el proyecto tiene tests detectables y no declara comando_verificacion, y dice cuantas tareas se cerraron asi (test)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T23:20:11Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T23:20:46Z | approve | automatico | persona | 0.14.0 |
