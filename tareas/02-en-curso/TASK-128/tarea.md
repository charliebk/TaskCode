---
id: TASK-128
titulo: "Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, metricas, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-128-metricas-de-verificacion-por-puerta-tiem
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
dependencias: [TASK-111, TASK-125]
---
## Objetivo

Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min, el freno Stop hasta 26 min por turno en tareas del nucleo y la revision ya es el 59-65 % del tiempo de cada tarea, pero metricas no ve cuanto se va en cada puerta: solo hay memos de la ultima ejecucion. TASK-111 registra el freno y TASK-120 la sincronizacion; falta registrar las verificaciones de review y de finish con el mismo formato, sumarlas por tarea y contar las rondas abiertas solo por MENORES (en los tres proyectos, 71 rondas asi con 2 CRITICO/IMPORTANTE nuevos y 70,2 M tokens, docs/auditoria/PASOS-PLUGIN-2026-11-12.md). Usa el registro de TASK-111: va despues de ella y de TASK-125 (presupuesto del freno). Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] Cada verificacion de ronda de review y cada verificacion de finish (completa, selectiva, documentacion, pesada) anade una linea con puerta, tarea, instante, modo, duracion y resultado al mismo registro bajo .git/taskcode/ que el freno de TASK-111 (test con repo temporal)
- [ ] taskctl metricas muestra por tarea, para cada puerta (freno, review, finish), el numero de ejecuciones y el tiempo total, y una fila de totales; sin registro muestra — (test)
- [ ] taskctl metricas cuenta por tarea las rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE, leyendo los informes de revision que ya existen (test con informes de ejemplo)
- [ ] Con tareas cerradas antes de este cambio, sin registro, metricas y metricas --por-version siguen dando la misma salida en las columnas que ya existian (test de regresion sobre un repo con datos de la 0.14)
- [ ] README y CHANGELOG describen las columnas nuevas
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T13:08:28Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T13:09:13Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T13:09:15Z | start | automatico | persona | 0.14.0 |
