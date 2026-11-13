---
id: TASK-134
titulo: "En Windows taskctl lanza el bash de Git, no el primero del PATH"
tipo: fix
sprint: 0
etiquetas: [windows, gitflow]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
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
tokens_revision: 174013
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
| 2026-11-13T22:22:57Z | finish | automatico | persona | 0.16.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T22:00:45Z | implementacion | sesion:e9a360a9-58ca-45f8-961e-b01de725654a | 108 | 64758 | 11454067 | 36813 | 8 | 11555746 | - | - |
| 2026-11-13T22:22:11Z | revision | manual | - | - | - | - | - | 174013 | - | - |

## Verificacion ligera

- 2026-11-13T22:22:23Z: ronda 1; commit revisado 01fe307a11bab6dce91df782585b0d71464b9c35; commit verificado 157a299a7ba8ac54f5d600d7312b7cf5bf45412a; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-bash.test.ts; corregidos: ninguno; pendientes: ninguno

## Resultado

- `src/core/resolver-bash.ts` (logica pura): en Windows, el bash de la instalacion de Git que contiene el primer `git.exe` del PATH (sube 1 o 2 niveles: `cmd\`, `bin\`, `mingw64\bin`, `ucrt64\bin`; `usr\bin\bash.exe` y luego `bin\bash.exe`); si no hay, `bash` del PATH. Fuera de Windows, sin cambios.
- `lanzarBash` sigue siendo el unico que lanza bash; usa ese ejecutable y, con el bash de Git, antepone su `usr\bin` al PATH del hijo.
- Divergencia con el plan: el plan solo cambiaba el ejecutable. La prueba a mano desde PowerShell mostro que el bash de Git lanzado directamente no encuentra `mktemp` ni `dirname` (PowerShell solo tiene `Git\cmd`), asi que se anadio `entornoParaBash` (conserva la clave `Path` tal cual) y el test de integracion reproduce ese PATH (rojo sin el prepend).
- `doctor` dice que bash usa, o que no encontro el de Git y usa el del PATH; el arreglo propuesto menciona primero tener git.exe en el PATH.
- Comprobado desde PowerShell con `System32;Git\cmd;nodejs`: `doctor` ok con el bash de Git, `diagnose` exit 0, y este mismo `finish` lanzado asi.
- Revision ronda 1: aprobada con correcciones. MENOR-1 (error con la ruta del bash), MENOR-2 (mensaje de doctor) y MENOR-3 (sonda sin saltarse desde PowerShell) corregidos en tests sin ronda 2 (modo rapido; `verificar-menores`); MENOR-4 (shims de scoop/chocolatey y `env` del llamante) aceptado al backlog. M8 (lanzar `bash` literal) no es distinguible mientras se anteponga `usr\bin`.
- Incidente durante la tarea: dos `verificar-impacto` simultaneos (un `review` en segundo plano y el freno Stop) dejaron `dist/src` borrado y un rojo espurio memorizado; se restauro y se propone una tarea aparte (cerrojo en `verificar-impacto`).

## Verificacion omitida

- 2026-11-13T22:22:45Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 45 min
- Real (de la rama abierta al cierre con merge, sin pausas): 54 min
- Cierre (finish): 12 s, de 2026-11-13T22:22:45Z a 2026-11-13T22:22:57Z
