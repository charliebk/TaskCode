# Peticion de revision — TASK-077 (ronda 2)

- Tarea: TASK-077 — Guardian de merges: opciones con valor antes de -c y doc de bash -c
- Rama revisada: fix/task-077-guardian-de-merges-opciones-con-valor-an
- Rama base: develop
- Commit revisado (HEAD): 1a43f80e64b22e5e14c92a8c924fb5702646c917
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-077 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 2c61fa6a53cf3429fb25721b4a17fbbdf5850960 (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | src/core/comando-merge.ts (opcionesDeShell) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | test/hooks/guardia-merge.test.ts (test MEN-4) | informe-revision-1.md |

## Commits a revisar (git log 2c61fa6a53cf3429fb25721b4a17fbbdf5850960..HEAD)

````
1a43f80 fix(TASK-077): correcciones de la revision ronda 1 (MEN-1, MEN-2)
11b920f chore(TASK-077): veredicto ronda 1 (cambios-solicitados)
eca6d11 chore(TASK-077): coste revision +632960 tokens (1 agente)
b6fbd18 docs(TASK-077): informe de revision ronda 1
3361540 chore(TASK-077): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 2c61fa6a53cf3429fb25721b4a17fbbdf5850960..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index e2533b5..02cb21c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -205,8 +205,8 @@ function textoDeShell(prog: string, seg: readonly string[]): string | null {
  * Donde acaban las opciones de un `bash|sh|zsh|dash` (TASK-077, MEN-4 de
  * TASK-072): una sola regla para `-c` y para el script de cierre.
  * - Es opcion todo token que empiece por `-` o `+`; `--` las termina.
- * - Llevan valor en el token siguiente `--rcfile`, `--init-file` y los grupos
- *   cortos que acaban en `o`/`O` (`-o pipefail`, `+o x`, `-O extglob`, `-eo x`).
+ * - Llevan valor en el token siguiente `--rcfile`, `--init-file`, y cada `o`/`O`
+ *   de un grupo corto consume uno (`-o pipefail`, `+o x`, `-O extglob`, `-oc x`).
  * - `conC`: hubo `-c` (solo o en un grupo corto: `-lc`, `-ec`).
  * `fin` es el indice del primer argumento que no es opcion.
  */
@@ -224,8 +224,11 @@ function opcionesDeShell(seg: readonly string[]): { fin: number; conC: boolean }
     if (!a.startsWith('--')) {
       const grupo = a.slice(1);
       if (a.startsWith('-') && grupo.includes('c')) conC = true;
-      if (/[oO]$/.test(grupo)) {
-        i += 2;
+      // Como bash: cada o/O del grupo consume un valor, este donde este
+      // (`-oc pipefail "..."`: MEN-1 de la revision de TASK-077).
+      const valores = (grupo.match(/[oO]/g) ?? []).length;
+      if (valores > 0) {
+        i += 1 + valores;
         continue;
       }
     }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
index 578c460..99b890a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
@@ -92,6 +92,8 @@ test('comando-merge (MEN-4, TASK-077): las opciones de bash con valor antes de -
     'bash -O extglob -c "git merge x"',
     'bash +O extglob -c "git merge x"',
     'bash -eo pipefail -c "git merge x"',
+    'bash -oc pipefail "git merge x"',
+    'bash -oO pipefail extglob -c "git merge x"',
     'bash --rcfile f -c "git merge x"',
     'bash --init-file f -c "git merge x"',
     'bash --norc -c "git merge x"',
@@ -111,6 +113,9 @@ test('comando-merge (MEN-4, TASK-077): las opciones de bash con valor antes de -
   );
   assert.deepEqual(analizarComando('bash -- scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
   // Sin -c ni script de cierre: nada.
+  // +c desactiva la opcion: no es la forma -c, el argumento es un script (MEN-2).
+  assert.deepEqual(analizarComando('bash +c "git merge x"'), []);
+  assert.deepEqual(analizarComando('bash +c scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
   assert.deepEqual(analizarComando('bash -o pipefail otro.sh'), []);
   assert.deepEqual(analizarComando('bash -c'), []);
 });
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 2c61fa6a53cf3429fb25721b4a17fbbdf5850960..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-077/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-077/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-077/revision/informe-revision-1.md                               |  47 ++++++++++++++++++++++++
 tareas/03-en-revision/TASK-077/revision/peticion-revision-1.md                              | 197 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-077/tarea.md                                    |   6 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js                 |  11 +++---
 6 files changed, 255 insertions(+), 6 deletions(-)
````
