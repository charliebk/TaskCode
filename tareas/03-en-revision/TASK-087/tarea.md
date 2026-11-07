---
id: TASK-087
titulo: "taskctl doctor avisa si el plugin instalado esta desactualizado"
tipo: feature
sprint: 0
etiquetas: [doctor, distribucion]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-087-taskctl-doctor-avisa-si-el-plugin-instal
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 531150
tokens_implementacion: null
tokens_revision: 1690057
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Un equipo estuvo en 0.8.0 mientras el repo iba por 0.10.0 sin saberlo. doctor compara la version instalada con la del marketplace local y avisa.

## Criterios de aceptacion
- [ ] taskctl doctor da un AVISO con la version instalada, la disponible y los comandos de actualizacion cuando la del marketplace es mayor
- [ ] Sin marketplace local o sin red no falla: informa de que no pudo comprobarlo
- [ ] No cambia el codigo de salida de doctor; lo cubren tests con ficheros de plugins temporales
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T16:26:24Z | plan | automatico | persona |
| 2026-11-07T16:48:32Z | approve | automatico | persona |
| 2026-11-07T16:48:47Z | start | automatico | persona |
| 2026-11-07T17:11:35Z | review | automatico | persona |
| 2026-11-07T17:37:44Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T16:32:39Z | diseno | agente:ac40879d5137660c8 | 24 | 62094 | 457695 | 11337 | 22 | 531150 |
| 2026-11-07T17:18:07Z | revision | agente:aeaea94fe71251e2b | 12 | 111995 | 507942 | 5808 | 1 | 625757 |
| 2026-11-07T17:42:21Z | revision | agente:abaaaf40e75fe993c | 22 | 102097 | 956062 | 6119 | 2 | 1064300 |
