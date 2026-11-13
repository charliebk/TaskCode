---
id: TASK-134
titulo: "En Windows taskctl lanza el bash de Git, no el primero del PATH"
tipo: fix
sprint: 0
etiquetas: [windows, gitflow]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-134-en-windows-taskctl-lanza-el-bash-de-git
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: [task-workflow]
regla_seleccion_skill: solape
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 11555746
tokens_revision: null
creado: 2026-11-13
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

taskctl lanza los scripts de Git-Flow con spawnSync('bash') (lanzarBash en src/fs/gitflow-runner.ts), el primero del PATH. Desde PowerShell suele ser C:\Windows\System32\bash.exe (WSL), que no abre el script, y finish falla; desde Git Bash funciona. Por eso en el mismo PC unas sesiones fallan y otras no, segun la terminal que use Claude. En Windows hay que localizar el bash de Git a partir de git.exe (usr/bin/bash.exe o bin/bash.exe de la instalacion) y usarlo siempre, con el bash del PATH solo como respaldo si no se encuentra; la sonda de doctor usa el mismo lanzamiento.

## Criterios de aceptacion
- [ ] En Windows, con System32 antes que Git en el PATH (bash de WSL primero), taskctl finish y los demas wrappers de Git-Flow funcionan lanzados desde PowerShell
- [ ] lanzarBash sigue siendo el unico sitio que lanza bash y la sonda de taskctl doctor usa la misma resolucion
- [ ] Si no se encuentra el bash de Git se usa bash del PATH como hasta ahora y doctor lo dice; en Linux y macOS no cambia nada
- [ ] Tests de la resolucion como logica pura (sin procesos) y uno de integracion con un PATH que pone primero un bash falso

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T21:27:57Z | plan | automatico | persona | 0.16.0 |
| 2026-11-13T21:28:27Z | approve | automatico | persona | 0.16.0 |
| 2026-11-13T21:28:29Z | start | automatico | persona | 0.16.0 |
| 2026-11-13T22:00:45Z | review | automatico | persona | 0.16.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T22:00:45Z | implementacion | sesion:e9a360a9-58ca-45f8-961e-b01de725654a | 108 | 64758 | 11454067 | 36813 | 8 | 11555746 | - | - |
