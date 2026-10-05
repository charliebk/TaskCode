# Peticion de revision — TASK-050 (ronda 2)

- Tarea: TASK-050 — F6-T1 Suite rapida y repo plantilla en los tests
- Rama revisada: feature/task-050-f6-t1-suite-rapida-y-repo-plantilla-en-l
- Rama base: develop
- Commit revisado (HEAD): 0db8dee81bdf630dafc6f4b5b5731a06c6f81742
- Fecha: 2026-10-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-050 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 87f27c6e1cd03ea0baa001e237558432a6f84bf5 (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la
peticion.

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | tareas/.../TASK-050/tarea.md (criterio 3, plan de pruebas) | informe-revision-1.md |
| MENOR-1 | MENOR | abierto (documentar) | test/commands/{start,automatico}.test.ts, plan-final.md | informe-revision-1.md |
| MENOR-2 | MENOR | abierto | test/commands/plan-brainstorm.test.ts:18-19, test/commands/automatico.test.ts:9-10 | informe-revision-1.md |
| MENOR-3 | MENOR | abierto (aceptable) | test/helpers/repo-plantilla.ts, test/helpers/repo-plantilla.test.ts | informe-revision-1.md |

## Commits a revisar (git log 87f27c6e1cd03ea0baa001e237558432a6f84bf5..HEAD)

````
0db8dee fix(TASK-050): hallazgos de la ronda 1 (mediciones anotadas, imports sin uso)
11497ca docs(TASK-050): informe de revision ronda 1
5e1f08b chore(TASK-050): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 87f27c6e1cd03ea0baa001e237558432a6f84bf5..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
index eee5b0b..e016742 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
@@ -6,8 +6,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
-import { tmpdir } from 'node:os';
+import { writeFile, mkdir, readFile } from 'node:fs/promises';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index 0fed6be..954de2f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -15,8 +15,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, mkdir, rm, readFile, readdir, writeFile } from 'node:fs/promises';
-import { tmpdir } from 'node:os';
+import { mkdir, rm, readFile, readdir, writeFile } from 'node:fs/promises';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 87f27c6e1cd03ea0baa001e237558432a6f84bf5..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/02-en-curso/TASK-050/tarea.md                                                                           |  42 -------
 tareas/{02-en-curso => 03-en-revision}/TASK-050/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-050/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-050/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-050/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-050/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-050/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-050/revision/informe-revision-1.md                                                  |  76 ++++++++++++
 tareas/03-en-revision/TASK-050/revision/peticion-revision-1.md                                                 | 545 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-050/tarea.md                                                                        |  91 ++++++++++++++
 10 files changed, 712 insertions(+), 42 deletions(-)
````
