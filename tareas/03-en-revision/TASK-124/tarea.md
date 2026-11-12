---
id: TASK-124
titulo: "Contexto con tamano maximo: lo que leen los agentes no crece con el proyecto"
tipo: feature
sprint: 0
etiquetas: [agilidad, escala, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-124-contexto-con-tamano-maximo-lo-que-leen-l
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 19032337
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Sale de TASK-122 (docs/auditoria/ESCALA-2026-11-12.md): lo que leen los agentes en cada tarea crece con el proyecto. Desde la v0.1.1 el README del plugin paso de 22 a 102 KB, las skills de 92 a 189 KB y docs/contexto de 154 a 195 KB; CHECKLIST_TERMINACION.md pesa 83 KB y ESTADO.md llevaba 38 dias sin actualizarse cuando CLAUDE.md manda leerlo primero. Cada documento que se carga en cada tarea tiene que tener un tamano maximo, y lo cerrado se archiva fuera de lo que se lee. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12), en modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] CLAUDE.md, las skills de flujo y las revisoras tienen un tamano maximo en bytes con un test que falla si se supera
- [ ] CHECKLIST_TERMINACION.md y ESTADO.md archivan lo cerrado en docs/contexto/archivo/ y lo vivo queda por debajo de 20 KB y 10 KB (comprobado con wc -c)
- [ ] taskctl doctor avisa si ESTADO.md lleva mas de 14 dias sin actualizarse o va por detras de las tareas cerradas (test)
- [ ] El README del plugin pasa la referencia detallada a ficheros aparte y queda por debajo de 40 KB, sin perder contenido (test que comprueba el tamano y los enlaces)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T19:11:36Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T19:22:04Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T19:22:05Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T19:45:52Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T19:45:52Z | implementacion | sesion:0ba098a5-8f54-4573-8cde-7b3c9a838b85 | 36 | 33224 | 2304653 | 11036 | 0 | 2348949 | - | - |
| 2026-11-12T19:45:52Z | implementacion | agente:a5c8d7729428a0908 | 116 | 193734 | 8545581 | 43321 | 7 | 8782752 | - | - |
| 2026-11-12T19:45:52Z | implementacion | agente:a8cace2c802ca727c | 54 | 129728 | 2846603 | 14944 | 9 | 2991329 | - | - |
| 2026-11-12T19:45:52Z | implementacion | agente:a8e1d3a271f088ca1 | 80 | 148553 | 4729700 | 30974 | 3 | 4909307 | - | - |
