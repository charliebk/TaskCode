# Peticion de revision — TASK-078 (ronda 2)

- Tarea: TASK-078 — Hook que impide leer y editar los held-out de la tarea en curso
- Rama revisada: feature/task-078-hook-que-impide-leer-y-editar-los-held-o
- Rama base: develop
- Commit revisado (HEAD): 1d5cfd86ac60f95c934028805c3a0f419018f7d7
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-078 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde cae1fb32536e8e307d340432c41c4e666818ceff (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | src/core/heldout.ts (`numerosHeldoutEnRuta`) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/hooks/guardia-heldout.ts (`decidirHeldout`) / skills/task-workflow/heldout.md | informe-revision-1.md |
| MEN-3 | MENOR | abierto | tareas/…/TASK-078/tarea.md (criterio 5) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | test/hooks/guardia-heldout.test.ts / src/hooks/guardia-heldout.ts | informe-revision-1.md |
| MEN-5 | MENOR | abierto | src/core/heldout.ts (comentario) / skills/task-workflow/heldout.md | informe-revision-1.md |

## Commits a revisar (git log cae1fb32536e8e307d340432c41c4e666818ceff..HEAD)

````
1d5cfd8 fix(TASK-078): menores de la ronda 1 de revision
84a7248 chore(TASK-078): veredicto ronda 1 (cambios-solicitados)
c7c87d3 chore(TASK-078): coste revision +4192435 tokens (1 agente)
e40fb48 docs(TASK-078): informe de revision ronda 1
644d786 chore(TASK-078): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff cae1fb32536e8e307d340432c41c4e666818ceff..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
index 4e23ef1..1278397 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
@@ -50,7 +50,15 @@ Es un freno contra despistes, no un cierre. **No ve**, y se acepta asi:
   `aceptacion/` y devuelve su contenido) ni un indice de codigo por MCP;
 - cambiar de rama para leerlos (`git switch` a la base, leer, volver);
 - un comando que llega a la ruta sin escribirla (`cd` previo y ruta relativa,
-  concatenaciones o escapes del shell, `git cat-file` por hash).
+  concatenaciones o escapes del shell, `git cat-file` por hash);
+- formas de ruta que Windows resuelve a la misma carpeta (espacio o punto
+  final, nombre corto `ACEPTA~1`);
+- la ruta absoluta de otro checkout o worktree: la rama que cuenta es la del
+  cwd, no la del repo que contiene la ruta.
+
+Al reves, bloquea cualquier comando cuyo texto nombre la ruta aunque no la
+lea (un `git commit -m` o un `echo` que la cite): no la escribas en mensajes
+ni comandos; nombra la tarea o la carpeta `aceptacion/` sin la ruta completa.
 
 Un held-out leido no se deshace: esa tarea queda gastada y solo lo arregla que
 la persona los reescriba. El cierre de la edicion es la huella de `finish`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
index fc29143..b52dca1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
@@ -96,7 +96,7 @@ const SEPARADORES_COMANDO = /[\s"'`;|&()<>=,:]+/;
  * de Bash o PowerShell (`cat`, `Get-Content`, `git show rama:ruta`...). Se
  * parte por separadores y cada palabra se trata como una ruta relativa a
  * `cwd`. NO usa el tokenizador del guardian de merges, que trata `\` como
- * escape y romperia las rutas de PowerShell. Es un baden, no un cierre: no
+ * escape y romperia las rutas de PowerShell. Es un badén, no un cierre: no
  * sigue un `cd` previo ni deshace concatenaciones o escapes del shell.
  */
 export function numerosHeldoutEnTexto(texto: string, cwd: string): number[] {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts
index a55c30e..bb25092 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts
@@ -219,6 +219,15 @@ test('guardia-heldout (criterio 3): en la rama base (diseño) no bloquea; al cam
   });
 });
 
+test('guardia-heldout (MEN-4 de la revision): el mensaje nombra el ID con su relleno, TASK-042 y no TASK-42', async () => {
+  await conRepo(async (raiz) => {
+    git(['checkout', '-q', '-b', 'feature/task-042-corta'], raiz);
+    const d = decidirHeldout({ cwd: raiz, tool_name: 'Read', tool_input: { file_path: 'tareas/02-en-curso/TASK-042/aceptacion/x.cjs' } });
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr, /la carpeta aceptacion\/ de TASK-042, la tarea de la rama actual \("feature\/task-042-corta"\)/);
+  });
+});
+
 test('guardia-heldout: con HEAD desacoplado en un rebase, la rama es la que se esta rebasando', async () => {
   await conRepo(async (raiz) => {
     git(['checkout', '-q', '--detach'], raiz);
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff cae1fb32536e8e307d340432c41c4e666818ceff..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/02-en-curso/TASK-078/tarea.md                                                                           |  48 -----
 tareas/{02-en-curso => 03-en-revision}/TASK-078/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-078/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-078/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-078/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-078/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-078/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-078/revision/informe-revision-1.md                                                  |  94 +++++++++
 tareas/03-en-revision/TASK-078/revision/peticion-revision-1.md                                                 | 863 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-078/tarea.md                                                                        |  85 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heldout.js                                          |   2 +-
 11 files changed, 1043 insertions(+), 49 deletions(-)
````
