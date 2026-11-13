---
id: TASK-129
titulo: "Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, tests, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-129-freno-al-crecimiento-de-la-suite-presupu
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
dependencias: [TASK-126, TASK-128]
---
## Objetivo

Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y la revision ha pasado del 51 % al 59-65 % del tiempo de cada tarea; cada ronda anade tests (unos 1130 MENORES y 350 IMPORTANTES en 153 tareas) y la suite solo crece. Nada en el plan ni en las skills limita cuantos tests se escriben por criterio, los de rendimiento y escala corren con los demas y nadie avisa de que la suite crece o tarda mas. Se busca un presupuesto de tests por criterio en el plan y en la skill, que los tests de rendimiento y escala se marquen como pesados (los que TASK-126 solo corre en release/*) y que doctor y metricas avisen del crecimiento de la suite y de su duracion. Va despues de TASK-126 y de TASK-128, de cuyo registro sale la duracion de la completa. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] La plantilla de plan-final.md y la skill plan piden por cada criterio cuantos tests nuevos preve, con un presupuesto por defecto (por ejemplo 1 a 3) y el motivo si lo supera; la skill review trata como MENOR un test que duplica a otro ya existente (test sobre la plantilla y las skills)
- [ ] Las skills plan y task-workflow explican como marcar un test de rendimiento o escala como pesado en Node, Rust, Java y .NET, y que corre solo con comando_verificacion_pesada (test que comprueba el texto)
- [ ] taskctl metricas muestra, por version, el numero de tests y la duracion de la completa a partir del registro de verificaciones de TASK-128, y doctor avisa si cualquiera crecio mas de un umbral configurable (20 % por defecto) desde la version anterior (test con repo temporal)
- [ ] Sin datos de duracion o de numero de tests, doctor y metricas no avisan ni fallan (test)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T16:11:15Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T16:11:41Z | approve | automatico | persona | 0.14.0 |
