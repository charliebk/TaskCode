---
id: TASK-130
titulo: "Poda periodica de tests redundantes: fusionar o borrar sin perder cobertura"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, tests, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-130-poda-periodica-de-tests-redundantes-fusi
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
dependencias: [TASK-129]
---
## Objetivo

Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y el cierre de TASK-306, con un solo test cambiado, espero 44 min 52 s. Cada tarea y cada ronda suman tests, y ninguno se retira aunque otro posterior ya cubra lo mismo. Se busca una tarea de mantenimiento periodica, propuesta por el plugin cuando la suite crece, que fusione o borre los tests redundantes sin bajar la cobertura de las lineas que ya cubrian, y una primera pasada sobre la suite de TaskCode (docs/auditoria/PERFIL-TESTS-2026-11-12.md tiene su perfil por fichero). Usa el aviso de crecimiento de TASK-129: va despues de ella. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] taskctl doctor propone abrir una tarea de poda (con el comando taskctl new ya escrito) cuando salta el aviso de crecimiento de la suite o han pasado mas de N tareas cerradas desde la ultima poda, con N configurable y 30 por defecto (test con repo temporal)
- [ ] La skill task-workflow describe el procedimiento de poda: como localizar duplicados, que se fusiona y que se borra, y que la cobertura de las lineas que cubrian no baja (comprobado con la cobertura sobre lineas de TASK-074)
- [ ] Primera pasada en TaskCode: la suite rapida y la completa pierden al menos un 10 % de duracion o de numero de tests sin bajar la cobertura total, con el antes y el despues anotados en el plan (comprobado con scripts/perfil-tests.mjs)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
