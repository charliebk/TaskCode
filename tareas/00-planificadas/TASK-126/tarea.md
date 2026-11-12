---
id: TASK-126
titulo: "Verificacion por tipo de rama: los tests pesados solo en la puerta de release"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-126-verificacion-por-tipo-de-rama-los-tests
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
dependencias: [TASK-115]
---
## Objetivo

Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y 29 de ellos son el paso de cargo test con los pesados --ignored; el cierre de TASK-306, con un solo test cambiado, espero 44 min 52 s. Hoy comando_verificacion es uno solo para cualquier finish y para el guardian de merges, sea feature, fix o release. Se busca una verificacion por tipo de rama de Git-Flow: los tests pesados (rendimiento, escala, --ignored) solo se exigen en la puerta de las ramas release/* (y hotfix/* si el proyecto lo declara), y las feature/* y fix/* se cierran con la completa sin pesados. Relacion con TASK-115 (completa por lote): ambas tocan finish-verificacion.ts y el guardian de merges, asi que va despues de ella. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] Una clave nueva comando_verificacion_pesada se ejecuta, ademas de comando_verificacion, solo en el finish y el guardian de merges de ramas release/*; finish de feature/* y fix/* no la ejecuta (test con repo temporal y una rama de cada tipo)
- [ ] Una clave verificacion_pesada_en lista los tipos de rama que la exigen (release por defecto; hotfix opcional) y un tipo desconocido es error de config (test)
- [ ] El guardian de merges no deja integrar una release sin una verificacion pesada en verde del commit que entra, y no la pide para feature ni fix (test)
- [ ] Sin la clave, finish y el guardian se comportan como hoy (test de regresion) y taskctl doctor dice que puerta corre los pesados (test)
- [ ] README, CHANGELOG y la skill finish explican como separar los pesados del comando de verificacion, con el ejemplo de cargo test --ignored
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
