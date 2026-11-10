---
id: TASK-092
titulo: "Sincronización de ficheros sueltos de la raíz de tareas/"
tipo: feature
sprint: 0
etiquetas: [config, sincronizacion]
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-092-sincronizacion-de-ficheros-sueltos-de-la
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2076577
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Que un proyecto pueda regenerar en cada transición un fichero derivado que vive en la raíz de tareas/ (p. ej. tareas/ROADMAP.md de ToolsaWeb). Hoy rutas_sincronizacion rechaza todo lo que cuelga de tareas/, así que el ROADMAP se queda atrasado tras plan/start/review/finish y la verificación del proyecto sale en rojo (medido en ToolsaWeb TASK-295 el 2026-11-10: una completa de 20 min repetida por dos líneas). taskctl solo escribe dentro de las carpetas de estado (tareas/0N-*/), así que un fichero suelto en la raíz de tareas/ no choca con lo que escribe el CLI.

## Criterios de aceptacion
- [ ] rutas_sincronizacion admite un fichero directamente en la raíz de tareas/ (tareas/ROADMAP.md) y sigue rechazando tareas/<carpeta de estado>/..., tareas/ como carpeta, .taskcode/ y .git/, con tests de config para cada caso
- [ ] En un repo temporal con comando_sincronizacion que reescribe tareas/ROADMAP.md, cada uno de new, plan, approve, start, review y finish deja ROADMAP.md regenerado dentro del mismo commit de la transición (test de integración)
- [ ] Las tres salvaguardas de sincronizacion.md (ruta con cambios previos, comando que falla, fichero no declarado) funcionan igual con una ruta de la raíz de tareas/, con un test por caso
- [ ] skills/task-workflow/sincronizacion.md y el README describen la nueva regla y su motivo, y CHANGELOG.md la anota en la versión siguiente
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ni borrar ningún test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T12:44:55Z | plan | automatico | persona | 0.13.0 |
| 2026-11-10T12:53:31Z | approve | automatico | persona | 0.13.0 |
| 2026-11-10T12:53:38Z | start | automatico | persona | 0.13.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T12:51:59Z | diseno | agente:a28a3c67e7f8c02fa | 68 | 90497 | 1968455 | 17557 | 42 | 2076577 | - | - |
