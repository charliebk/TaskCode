# Plan — TASK-013: Comando taskctl review (revisión por pares de un solo agente)

## Enfoque propuesto

`taskctl review TASK-NNN` cierra la fase de ejecución y abre la de revisión,
haciendo todo lo determinista en el CLI y dejando el disparo real del agente
al orquestador (Claude Code / futura skill C5), igual que el `plan` mínimo de
TASK-010 dejó la redacción del plan al agente:

1. **Validación sin efectos** (criterio 1): lectura preliminar de la tarea y
   `assertTransitionAllowed('review')` — ya implementado en la máquina de
   estados. Si no está `en-curso`, error accionable sin tocar Git ni carpetas.
   Workspace limpio obligatorio antes de invocar el script (mismo motivo que
   `start`: el prompt interactivo de Git-Flow cancela en silencio con stdin
   no interactivo).
2. **Update desde la base** (criterio 2): invoca `scripts/gitflow/
   update-<tipo>.sh` vía `bash` con `task.rama` (mapa tipo→script análogo a
   SCRIPT_BY_TYPE de start.ts). La base es `develop` para feature/fix/release
   y la principal para hotfix — exactamente `resolveBaseBranchForTipo` que ya
   existe en `src/fs/git.ts`.
3. **Evidencia, no suposición** (criterio 2, principio de TASK-007): tras el
   script se comprueba (a) `currentBranch === task.rama` y (b) un helper
   nuevo `isAncestor(base, HEAD)` con `git merge-base --is-ancestor` — el
   merge ocurrió de verdad, no se supone por el exit 0.
4. **Lectura fresca post-cambio de rama** (regla de la doble lectura,
   TASK-012): la lectura que decide la escritura se hace DESPUÉS del script
   (que cambia de rama), y se revalida la transición. La preliminar solo
   sirve para rechazo rápido y para extraer `tipo`/`rama` (metadata estable).
5. **Mover a 03-en-revision/** (criterio 3): `moveTareaFile` sin
   modificarla, `estado: en-revision`, fail-closed por defecto (sin
   `tolerateMissingSource`: en review no hay checkout que pierda la carpeta).
6. **Petición de revisión** (criterio 4): crea `revision/` dentro de la
   carpeta de la tarea con dos ficheros numerados por ronda (n = primera
   ronda libre):
   - `peticion-revision-<n>.md`: metadata verificable (rama, base, SHA de
     HEAD revisado, fecha), instrucciones del revisor genérico con la
     clasificación CRÍTICO/IMPORTANTE/MENOR de CONVENCIONES.md, y el diff
     real embebido (`git log base..HEAD --oneline` + `git diff base..HEAD`)
     — la corrección 5 de §16: el agente recibe el diff, no el repo.
   - `informe-revision-<n>.md`: scaffold para la salida del agente (flag
     `wx`, nunca pisa un informe existente).
   El CLI no invoca ningún LLM (decisión con Carlos, 2026-09-05): el
   orquestador lee la petición y lanza el agente revisor. `ultimo_commit_
   revisado` NO se actualiza aquí — según §16.3 se actualiza "cada vez que
   TERMINA una revisión", y eso ocurre cuando el informe se aprueba (B3/
   TASK-014 o el humano), no al generarse la petición.

## Alternativas consideradas

- **Invocar `claude -p` headless desde el CLI**: lectura literal de
  "dispara", descartada con Carlos — acopla el CLI al binario de claude,
  gasta tokens por review y complica los tests. La petición + scaffold deja
  el mismo resultado disponible para uso interactivo y automatizado.
- **Puerta determinista build/lint/tests antes del agente (§16, corrección
  5)**: fuera del alcance de TASK-013 (no está en sus criterios); encaja en
  TASK-018/019 cuando el enrutado y la revisión ligera existan.

## Riesgos o preguntas abiertas

- Un conflicto de merge en `update-<tipo>.sh` aborta con `exit 1` dejando el
  conflicto en el workspace para resolver a mano — el comando no mueve la
  tarea (fail-closed) y lo dice. Se cubre con test de conflicto real.
- Si la tarea se invoca desde una rama que no es la de la tarea, la lectura
  preliminar puede ver un estado viejo (colisión documentada en HALLAZGOS).
  Mitigación: la lectura fresca post-script revalida; el caso extremo queda
  para TASK-014, que es quien destapa el backmerge.
