---
id: TASK-013
titulo: "Comando taskctl review (revisión por pares de un solo agente)"
tipo: feature
sprint: 2
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-013-comando-taskctl-review-revision-por-pare
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-012]
---
## Objetivo

Cerrar la fase de ejecución de una tarea y abrir la de revisión: `taskctl
review TASK-NNN` trae los cambios de la rama base con el script Git-Flow del
tipo, verifica con evidencia Git que el merge ocurrió, mueve la tarea a
`03-en-revision/` y deja en `revision/` la petición para el agente revisor
genérico (con el diff real) más el scaffold de su informe. El CLI hace lo
determinista; el disparo del agente lo hace el orquestador (patrón del plan
mínimo de TASK-010, decisión con Carlos 2026-09-05).

## Criterios de aceptacion
- [x] Valida la transición `en-curso` → `en-revision` y aborta con mensaje accionable si la tarea no está en `02-en-curso/`, sin tocar Git ni carpetas.
- [x] Invoca `scripts/gitflow/update-<tipo>.sh` vía `bash` para traer los cambios de la rama base, y verifica con Git que el merge ocurrió de verdad en vez de suponerlo.
- [x] Mueve la carpeta de la tarea a `03-en-revision/` reutilizando `moveTareaFile` sin modificarla.
- [x] Dispara un único agente revisor genérico (la fragmentación por dominio es TASK-018) y deja su salida dentro de la carpeta de la tarea.
- [x] Tests contra un repo Git temporal real que cubren el camino feliz, el rechazo por estado incorrecto y el caso sin `origin`.

## Resultado

Implementado y revisado el 2026-09-05, con dogfooding completo: TASK-013 es
la primera tarea del proyecto gestionada de punta a punta por su propia
herramienta (taskctl plan → approve → start → review; el paso por review lo
ejecuto el comando recien implementado sobre si mismo, generando la peticion
que uso el revisor por pares).

- Comando review en src, registrado en el CLI, con helpers Git nuevos
  (isAncestor, headCommit, logOneline, diffRange). 11 tests reales nuevos
  (247 en total, 95.99 por ciento de lineas, 93.45 por ciento de ramas).
- Revision por pares (informe-revision-1.md): 0 criticos, 2 importantes
  (ENOBUFS con diffs grandes; orden mover-antes-de-escribir que podia dejar
  en-revision sin artefactos), 3 menores. Los 2 importantes y 2 de los
  menores corregidos en 484a946; el tercero (el script update deja al
  usuario en develop si la rama no existe) documentado sin corregir por ser
  deuda preexistente de los scripts de Git-Flow (familia C6).
- Decision de diseño registrada en plan-final.md: el CLI no invoca ningun
  LLM; deja peticion con el diff real mas scaffold del informe, y el
  disparo del agente lo hace el orquestador (patron del plan minimo de
  TASK-010). ultimo_commit_revisado se actualizara cuando una revision
  TERMINE (seccion 16.3), cosa que hoy no hace ningun comando — le toca a
  TASK-014.
- La tarea queda en 03-en-revision a proposito: taskctl finish (TASK-014,
  item B3) aun no existe, y cerrarla del todo sera su primer dogfooding.