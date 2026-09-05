---
id: TASK-014
titulo: "Comando taskctl finish (merge, cierre y actualización del tablero)"
tipo: feature
sprint: 2
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-014-comando-taskctl-finish-merge-cierre-y-ac
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-013]
---
## Objetivo

Cerrar el ciclo de vida de una tarea: `taskctl finish TASK-NNN` exige la
revisión aprobada (leyendo el veredicto del informe de revisión, fuente
determinista), mergea la rama con el script Git-Flow del tipo (con tag y
backmerge para hotfix/release), verifica con evidencia Git que los merges
ocurrieron, detecta la colisión de IDs entre `main` y `develop` antes de
mergear, mueve la carpeta a `04-terminadas/` y renderiza `CHANGELOG.md`,
`docs/INDEX.md` y `docs/BOARD.md` desde el frontmatter (cero LLM).

## Criterios de aceptacion
- [x] Valida la transición `en-revision` → `terminada`, exigiendo revisión aprobada y, si `revision_codex` es true, también la de Codex.
- [x] Invoca el `merge-<tipo>-to-develop.sh` o `merge-<tipo>-to-main.sh` que corresponda, con el guard de `origin` ya corregido en esos scripts.
- [x] Mueve la tarea a `04-terminadas/` y actualiza `CHANGELOG.md`, `docs/INDEX.md` y `docs/BOARD.md`.
- [x] Para `hotfix` y `release` hace el backmerge a `develop` y resuelve el riesgo ya documentado de colisión de IDs de tarea entre `main` y `develop`.
- [x] Tests contra repo Git temporal real para los cuatro tipos de tarea, incluido el backmerge.

## Resultado

Implementado y revisado el 2026-09-05 con el ciclo completo del metodo
(plan → approve → start → review) y cerrado con su propio comando: el
merge final a develop de esta tarea lo hizo taskctl finish — el comando
cerrandose a si mismo, primer cierre de tarea gestionado de punta a punta.

- Comando finish en src, registrado en el CLI, con helpers Git nuevos
  (lsTreeNames, showFileAtRef, mergeBase, checkoutBranch). 19 tests reales
  nuevos (266 en total; 95.49 por ciento de lineas, 93.09 de ramas).
- Fuente determinista de aprobacion: la linea Veredicto del ultimo
  informe-revision-N.md (y de informe-codex-N.md si revision_codex), con
  parser fail-closed endurecido por la revision por pares.
- Revision por pares (informe-revision-1.md): 1 critico (parser fail-open
  con la negacion <no aprobada>), 2 importantes (reintento imposible tras
  conflicto de backmerge por el tag ya creado; duplicacion de carpeta con
  mismo titulo en linaje divergente) y 4 menores. TODOS corregidos en
  2d2a467, cada uno con su test.
- La colision de IDs entre main y develop (riesgo documentado en
  TASK-012) queda resuelta con dos discriminadores: titulo distinto y
  linaje sin ancestro comun (git merge-base), ambos ANTES de mergear.
- Divergencia conocida y acotada: para hotfix y release, main conserva la
  carpeta en 03-en-revision (el movimiento a 04-terminadas ocurre en
  develop y no puede viajar en el merge sin auto-commit — decision #14
  pendiente); el siguiente backmerge la arrastra.
- ultimo_commit_revisado sigue sin tocarse: se actualizara cuando exista
  el bucle real de re-revision (TASK-018 o TASK-019).