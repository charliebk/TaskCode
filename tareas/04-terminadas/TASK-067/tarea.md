---
id: TASK-067
titulo: "Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release"
tipo: feature
sprint: 0
etiquetas: [doctor-deploy, seguridad]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-067-doctor-deploy-b-puntos-de-juicio-tareas
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 903323
tokens_implementacion: 34644951
tokens_revision: 15221115
creado: 2026-10-27
actualizado: 2026-10-28
dependencias: []
---
## Objetivo

Completa doctor-deploy (TASK-066). Los puntos que no se pueden medir con certeza (RLS, auth en servidor, restringir accesos, mass assignment, queries parametrizadas, validacion de inputs, uploads, cookies...) los revisa un agente de seguridad que tiene que citar evidencia; y cada punto que falla se convierte en una tarea para arreglarlo, numerada en un rango reservado descendente desde TASK-9999 para no chocar con las tareas normales. Ademas, cerrar una release avisa si no hay certificado reciente.

## Criterios de aceptacion
- [x] La skill /taskcode-plugin:doctor-deploy ejecuta el CLI y lanza un agente revisor de seguridad para los puntos de juicio que aplican; cada veredicto del agente cita fichero y linea, o el punto queda NO VERIFICADO
- [x] taskctl doctor-deploy --resultado <fichero json> incorpora los veredictos del agente al informe y al certificado; un veredicto sin evidencia o de un punto desconocido se rechaza con su motivo
- [x] Con --crear-tareas se crea una tarea por cada FALLA, numeradas hacia abajo desde TASK-9999 (9999, 9998...), con el arreglo como objetivo y como criterio que doctor-deploy de OK en ese punto
- [x] La numeracion normal ignora el rango reservado: con TASK-065 y TASK-9999 existentes, taskctl new crea TASK-066; con test
- [x] Repetir --crear-tareas no duplica: un punto con tarea ya abierta reutiliza la existente y lo dice
- [x] finish de una tarea release avisa sin bloquear si no hay certificado de doctor-deploy del commit que se cierra o si tiene alguna FALLA critica
- [x] Ni la skill, ni el agente, ni el catalogo mencionan TaskCode ni sus rutas internas (lo comprueba el test de contenido expuesto); README y CHANGELOG al dia
- [x] Pendientes de TASK-066 (MEN-12 y MEN-13): gitignore-cubre-env revisa todas las carpetas de proyecto (o sale NO VERIFICADO diciendo cuantas faltan) con test de mas de 10 carpetas; y tests que maten los mutantes N8, N9, N12, N14 y N17 de informe-revision-3.md de TASK-066

## Resultado

Cerrada el 2026-10-27 en 2 rondas de revision por pares (ronda 1 aprobada-con-correcciones, convertida en cambios-solicitados por decision de la persona para corregir los MENOR; ronda 2 aprobada sin hallazgos). Segunda mitad de doctor-deploy; la primera es TASK-066 y la siguiente, TASK-068.

**Lo entregado.**

- Skill `doctor-deploy` y agente `revisor-seguridad-deploy` (solo lectura: Read, Grep, Glob): el CLI hace las sondas, el agente juzga los puntos de juicio que aplican y devuelve un JSON de veredictos con fichero:linea o NO VERIFICADO. Ninguno menciona TaskCode (test de contenido expuesto).
- `--resultado <json>`: repite el analisis sobre HEAD y mezcla los veredictos. Se rechazan, con su motivo en avisos, en `veredictos.rechazados` y en el resumen: commit distinto de HEAD, puntos de sonda, NO APLICA o desconocidos, OK/FALLA sin evidencia, rutas con `..`, absolutas o UNC, ficheros no versionados en el commit, enlaces simbolicos y submodulos, binarios, lineas inexistentes, campos fuera del formato y veredictos duplicados. El motivo se acota a 300 caracteres y pasa por `ocultarSecretos`.
- Informe JSON v2 (`version: 2`, `origen: sonda|agente`, `veredictos`, `tareas`); `--escribir` deja `<fecha>.md` y `<fecha>.json`.
- `--crear-tareas`: una tarea `fix` por FALLA, numeradas hacia abajo desde TASK-9999, con etiqueta `doctor-deploy:<punto>`, el arreglo como objetivo y como criterio que el punto de OK; un solo guard de rama y un solo commit; repetir reutiliza la abierta y lo dice. El texto libre del agente no se copia a las tareas.
- Rango reservado TASK-9000..9999: `nextTaskId` lo ignora (y aborta si la numeracion normal llegara a 8999); `nextReservedTaskId` mira tareas y ramas y aborta si se agota.
- Aviso en `finish` de una release, sin bloquear y sin ejecutar sondas: vale el informe JSON cuyo commit es la punta, o un ancestro con solo `docs/doctor-deploy/` o `tareas/` cambiados (`tareas/` por decision de la persona tras la ronda 1); avisa si no hay informe valido o si tiene una FALLA de severidad critica.
- MEN-12 de TASK-066: `gitignore-cubre-env` revisa hasta 200 carpetas de proyecto; con mas sale NO VERIFICADO (o FALLA si ya habia una) diciendo cuantas faltan. MEN-13: tests que matan N8, N9, N12, N14 y N17.

**Suite.** 1613 tests; fallan solo los 5 conocidos de Windows. En una ejecucion bajo carga fallo ademas el test de mirror «si la lista de ramas del destino expira» (timeout de la comprobacion de conexion, codigo que esta tarea no toca); aislado pasa 5/5 y en la suite del revisor de la ronda 2 no fallo.

**Revision.** Dos revisores independientes con clon propio, CLI real sobre repos temporales y mutantes; ninguna fuga de secretos falsos (AKIA..., ghp_...) por ningun canal.

- Ronda 1: sin CRITICO ni IMPORTANTE. MEN-1 (el aviso saltaba en falso por los commits de `tareas/` posteriores al informe), MEN-2 (enlace simbolico aceptado como evidencia), MEN-3 (carpeta de informes copiada en tres sitios) y MEN-4 (NO VERIFICADO sin el recuento de carpetas sin mirar). La persona decidio ampliar la regla del aviso a `tareas/` y corregir los cuatro.
- Ronda 2: aprobada, sin hallazgos; cada correccion la mata al menos un mutante.

**Aceptado sin corregir:** una ruta de evidencia con `//` interno se rechaza (observacion de la ronda 2; conservador, ya pasaba antes). Mutantes equivalentes que sobreviven: leer `HEAD:` en vez de `<commit>:` (siempre coinciden) y la longitud minima del commit (la cubre el regex).

**No verificado:** que la herramienta Agent resuelva `taskcode-plugin:revisor-seguridad-deploy` en una instalacion real; `claude plugin validate` sobre la skill y el agente nuevos (sus tests de integracion son los 2 rojos conocidos de Windows); herramientas de auditoria externas reales.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-27T19:36:38Z | plan | automatico | persona |
| 2026-10-27T20:20:26Z | approve | automatico | persona |
| 2026-10-27T20:20:46Z | start | automatico | persona |
| 2026-10-27T21:35:18Z | review | automatico | persona |
| 2026-10-28T00:19:17Z | review | automatico | persona |
| 2026-10-28T00:43:45Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-10-27T20:20:25Z | diseno | agente:ab8d43123e2b6f315,a0773b84d455dbe77,ac926974f24df1bdf | 54 | 130326 | 745298 | 27645 | 43 | 903323 |
| 2026-10-27T21:35:17Z | implementacion | agente:a86227d7a20abab61 | 322 | 362240 | 34107600 | 174789 | 6 | 34644951 |
| 2026-10-27T23:59:48Z | revision | agente:a60963f95cb118fbe | 144 | 422875 | 11497960 | 44330 | 1 | 11965309 |
| 2026-10-28T00:43:02Z | revision | agente:a3dd1dff8f867ff6a | 62 | 335151 | 2909610 | 10983 | 6 | 3255806 |
