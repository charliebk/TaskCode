---
id: TASK-067
titulo: "Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release"
tipo: feature
sprint: 0
etiquetas: [doctor-deploy, seguridad]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-067-doctor-deploy-b-puntos-de-juicio-tareas
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 903323
tokens_implementacion: null
tokens_revision: null
creado: 2026-10-27
actualizado: 2026-10-27
dependencias: []
---
## Objetivo

Completa doctor-deploy (TASK-066). Los puntos que no se pueden medir con certeza (RLS, auth en servidor, restringir accesos, mass assignment, queries parametrizadas, validacion de inputs, uploads, cookies...) los revisa un agente de seguridad que tiene que citar evidencia; y cada punto que falla se convierte en una tarea para arreglarlo, numerada en un rango reservado descendente desde TASK-9999 para no chocar con las tareas normales. Ademas, cerrar una release avisa si no hay certificado reciente.

## Criterios de aceptacion
- [ ] La skill /taskcode-plugin:doctor-deploy ejecuta el CLI y lanza un agente revisor de seguridad para los puntos de juicio que aplican; cada veredicto del agente cita fichero y linea, o el punto queda NO VERIFICADO
- [ ] taskctl doctor-deploy --resultado <fichero json> incorpora los veredictos del agente al informe y al certificado; un veredicto sin evidencia o de un punto desconocido se rechaza con su motivo
- [ ] Con --crear-tareas se crea una tarea por cada FALLA, numeradas hacia abajo desde TASK-9999 (9999, 9998...), con el arreglo como objetivo y como criterio que doctor-deploy de OK en ese punto
- [ ] La numeracion normal ignora el rango reservado: con TASK-065 y TASK-9999 existentes, taskctl new crea TASK-066; con test
- [ ] Repetir --crear-tareas no duplica: un punto con tarea ya abierta reutiliza la existente y lo dice
- [ ] finish de una tarea release avisa sin bloquear si no hay certificado de doctor-deploy del commit que se cierra o si tiene alguna FALLA critica
- [ ] Ni la skill, ni el agente, ni el catalogo mencionan TaskCode ni sus rutas internas (lo comprueba el test de contenido expuesto); README y CHANGELOG al dia
- [ ] Pendientes de TASK-066 (MEN-12 y MEN-13): gitignore-cubre-env revisa todas las carpetas de proyecto (o sale NO VERIFICADO diciendo cuantas faltan) con test de mas de 10 carpetas; y tests que maten los mutantes N8, N9, N12, N14 y N17 de informe-revision-3.md de TASK-066

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-27T19:36:38Z | plan | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-10-27T20:20:25Z | diseno | agente:ab8d43123e2b6f315,a0773b84d455dbe77,ac926974f24df1bdf | 54 | 130326 | 745298 | 27645 | 43 | 903323 |
