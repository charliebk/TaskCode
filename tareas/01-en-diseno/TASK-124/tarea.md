---
id: TASK-124
titulo: "Contexto con tamano maximo: lo que leen los agentes no crece con el proyecto"
tipo: feature
sprint: 0
etiquetas: [agilidad, escala, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-124-contexto-con-tamano-maximo-lo-que-leen-l
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
