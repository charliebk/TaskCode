# Peticion de revision — TASK-104 (ronda 2)

- Tarea: TASK-104 — Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion
- Rama revisada: feature/task-104-verificacion-proporcional-a3b-las-rondas
- Rama base: develop
- Commit revisado (HEAD): 2b75ff1691d2e0dea599491c73e3ad09bc93473d
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-104 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde e6be4de6a86a0dc92912662e3f79fe4538705dbc (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (2 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera. Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-104/tarea.md
- tareas/03-en-revision/TASK-104/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts (falta el test); src/commands/review.ts:~1060 (`baseFiable: baseDeTipoSinRed(tipoTarea)`) | informe-revision-1.md |

## Commits a revisar (git log e6be4de6a86a0dc92912662e3f79fe4538705dbc..HEAD)

````
2b75ff1 docs(TASK-104): autorrevision ronda 2
ee7b803 docs(TASK-104): estado de los hallazgos de la ronda 1
2eb20ca test(TASK-104): Stop y review en un hotfix de solo documentacion (MEN-1)
6a251a3 chore(TASK-104): veredicto ronda 1 (cambios-solicitados)
36ce3e1 chore(TASK-104): coste revision +1876292 tokens (1 agente)
51668c5 docs(TASK-104): informe de revision ronda 1
5d518ef chore(TASK-104): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff e6be4de6a86a0dc92912662e3f79fe4538705dbc..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts
index 6d2052d..29c29d6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts
@@ -18,6 +18,7 @@ import path from 'node:path';
 import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
 import { runVeredictoCommand } from '../../src/commands/veredicto.js';
 import { decidirStop } from '../../src/hooks/freno-stop.js';
+import { writeTareaFile } from '../../src/fs/task-store.js';
 import {
   SCRIPTS_DIR,
   sampleTask,
@@ -49,7 +50,11 @@ interface Entorno {
  * Repo con la config commiteada en develop y una tarea en curso en su rama, sin
  * ningun cambio aun (solo su tarea.md, que siempre cuenta como documentacion).
  */
-async function conTarea(config: (e: Omit<Entorno, 'repoRoot' | 'tareasRoot'>) => string, fn: (e: Entorno) => Promise<void>): Promise<void> {
+async function conTarea(
+  config: (e: Omit<Entorno, 'repoRoot' | 'tareasRoot'>) => string,
+  fn: (e: Entorno) => Promise<void>,
+  tipo: 'feature' | 'hotfix' = 'feature'
+): Promise<void> {
   const fuera = await mkdtemp(path.join(tmpdir(), 'review-docs-fuera-'));
   await writeFile(path.join(fuera, 'verif.cjs'), SCRIPT, 'utf8');
   const base = {
@@ -62,12 +67,21 @@ async function conTarea(config: (e: Omit<Entorno, 'repoRoot' | 'tareasRoot'>) =>
   };
   try {
     await withTempRepo(async (repoRoot, tareasRoot) => {
+      // Un hotfix nace de la principal: la config tiene que estar alli.
+      if (tipo === 'hotfix') git(['checkout', '-q', 'main'], repoRoot);
       await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
       await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config(base), 'utf8');
       await mkdir(path.join(repoRoot, 'docs'), { recursive: true });
       await writeFile(path.join(repoRoot, 'docs', 'guia.md'), 'guia\n', 'utf8');
       commitAll(repoRoot, 'config y docs');
-      await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, sampleTask());
+      if (tipo === 'hotfix') {
+        const t = sampleTask({ tipo: 'hotfix', rama: 'hotfix/task-600-docs' });
+        git(['checkout', '-q', '-b', t.rama, 'main'], repoRoot);
+        await writeTareaFile(tareasRoot, t, '## Objetivo\nProbar review.\n');
+        commitAll(repoRoot, 'tarea en curso');
+      } else {
+        await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, sampleTask());
+      }
       await fn({ ...base, repoRoot, tareasRoot });
     });
   } finally {
@@ -285,3 +299,20 @@ test('review (TASK-104): la comprobacion de documentacion en rojo aborta sin ron
     assert.equal(git(['status', '--porcelain'], e.repoRoot), '');
   });
 });
+
+test('Stop y review (TASK-104): en un hotfix de solo documentacion los dos corren la selectiva (la base no se exime)', async () => {
+  await conTarea(
+    tresClaves,
+    async (e) => {
+      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+      const d = await stop(e);
+      assert.equal(d.codigo, 0, d.stderr);
+      assert.equal(e.ejecuciones('selectiva'), 1, 'Stop: la selectiva');
+      assert.equal(e.ejecuciones('docs'), 0);
+      const r = await review(e);
+      assert.match(peticionDe(r), /- Tipo: selectiva \(por impacto respecto a `main`/);
+      assert.equal(e.ejecuciones('docs'), 0, 'review tampoco exime al hotfix');
+    },
+    'hotfix'
+  );
+});
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff e6be4de6a86a0dc92912662e3f79fe4538705dbc..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-104/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-104/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-104/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-104/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-104/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-104/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-104/revision/informe-revision-1.md                                                  |  57 ++++++
 tareas/03-en-revision/TASK-104/revision/peticion-revision-1.md                                                 | 773 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-104/tarea.md                                                       |  10 +-
 9 files changed, 837 insertions(+), 3 deletions(-)
````
