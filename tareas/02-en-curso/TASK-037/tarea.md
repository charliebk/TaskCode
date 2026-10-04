---
id: TASK-037
titulo: "F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-037-f2-t1-logging-de-los-scripts-de-git-flow
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Que el logging de los scripts de Git-Flow deje de lanzar procesos: hoy cada
linea abre un subshell `$(_do_log ...)` y un `date` (~0,15 s por linea medido
en Windows; `initialize_gitflow_log` y `log_summary` lanzan mas `date`). Es la
mayor parte de los 11 s que `update-feature.sh` se lleva dentro de `taskctl
review` (auditoria del 2026-10-03, B1), y lo paga cada `start`, `review`,
`finish`, `diagnose` y un tercio de la suite.

Con bash >= 4.2 la hora sale de `printf -v ... '%(...)T'`; con bash mas
antiguo (el `/bin/bash` 3.2 de macOS) se conserva `date` como caida. Fuera de
alcance: la deteccion de origin (TASK-038).

## Criterios de aceptacion
- [x] `_gitflow-common.sh` usa `printf -v` en lugar de `$(date)` y `$(_do_log)`
- [x] Tiempo de `update-feature.sh` en un repo temporal medido antes y despues y anotado en el Resultado
- [x] Salida y fichero de log identicos (salvo la hora) en un caso de prueba
- [x] Tests de `test/gitflow/` en verde

## Resultado

**Implementado.** `_gitflow-common.sh`: helpers `_gf_hora VAR FORMATO` y
`_gf_epoch VAR`. Con bash >= 4.2 usan `printf -v ... '%(...)T'` (y
`EPOCHSECONDS` si existe); con bash anterior caen a `date` (forzable con
`GF_FORZAR_DATE=1`). `_do_log` deja la linea en `GF_LINE` en vez de
devolverla por stdout, asi que `log_info/ok/warn/error` ya no abren un
subshell por linea. La interfaz publica (`log_*`) no cambia; ningun otro
script llamaba a `_do_log`.

**Medicion (Windows, Git Bash/Cygwin bash 5.3).**
- `initialize_gitflow_log` + 20 `log_info`: 3,65 s → **1,05 s** (con `date`
  forzado, el camino de bash 3.2: 3,15 s, lo de antes).
- `update-feature.sh` completo en un repo temporal, 3 ejecuciones cada uno:
  4,74 / 5,51 / 4,69 s → **3,52 / 4,11 / 3,42 s** (~26 % menos). Salida
  identica salvo la linea de duracion.

**Pruebas.** `test/gitflow/logging.test.ts` (3 tests) redefine `date` como
funcion de bash que cuenta sus llamadas: el camino rapido no la llama ni una
vez, la caida si, y las dos dan la linea `[AAAA-MM-DD HH:MM:SS] [INFO ] ...` en
pantalla y en el fichero. Mutante (volver a `$(date)` en `_do_log`): rojo.
`test/gitflow/`: 40/40.
