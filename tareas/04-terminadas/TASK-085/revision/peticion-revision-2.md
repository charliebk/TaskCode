# Peticion de revision — TASK-085 (ronda 2)

- Tarea: TASK-085 — Coste de implementacion registrado automaticamente
- Rama revisada: feature/task-085-coste-de-implementacion-registrado-autom
- Rama base: develop
- Commit revisado (HEAD): 891ab503d2347ff0e9d14afd1e7740965b050141
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-085 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 126d18d096a7479082c1db060b4df6d66c7922a5 (el commit revisado en la ronda anterior)
- Alcance: completa (motivo: el diff toca ficheros que ningun hallazgo nombraba: taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-085/tarea.md
- tareas/03-en-revision/TASK-085/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/commands/finish.ts (bloque `volcarCosteAutomatico` y `volcado.olvidar()`) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/core/coste-automatico.ts:~116 (`CAMPOS.some((k) => delta[k] < 0)`) | informe-revision-1.md |

## Commits a revisar (git log 126d18d096a7479082c1db060b4df6d66c7922a5..HEAD)

````
891ab50 test(TASK-085): red de finish y campos negativos del volcado (MEN-1, MEN-2)
a4921a5 chore(TASK-085): veredicto ronda 1 (cambios-solicitados)
b268cc2 chore(TASK-085): coste revision +1838682 tokens (1 agente)
0459dd1 docs(TASK-085): informe de revision ronda 1
6a68e6a chore(TASK-085): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 126d18d096a7479082c1db060b4df6d66c7922a5..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts
index 0c8177f..5f9aed3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts
@@ -224,7 +224,11 @@ function taskctl(cwd: string, args: string[], env: NodeJS.ProcessEnv): { status:
   return { status: r.status, stdout: r.stdout, stderr: r.stderr };
 }
 
-test('ciclo por CLI: hook como proceso, review lo suma y metricas deja de listar la tarea sin coste de implementacion', async () => {
+/**
+ * Ciclo completo por CLI. `redEnFinish`: la review corre con COSTE_AUTOMATICO=0
+ * (como si su volcado no hubiera podido) y lo suma la red de finish.
+ */
+async function cicloPorCli(redEnFinish: boolean): Promise<void> {
   await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
     const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
     try {
@@ -260,7 +264,18 @@ test('ciclo por CLI: hook como proceso, review lo suma y metricas deja de listar
       // La review tiene que caer al menos un segundo despues del start (filas al segundo).
       const espera = Date.parse(start.fecha) + 1100 - Date.now();
       if (espera > 0) await new Promise((res) => setTimeout(res, espera));
-      assert.match(ok(['review', ID]), /Coste de implementacion registrado automaticamente: \+500 tokens/);
+      const libro = rutaLibro(repoRoot) as string;
+      if (redEnFinish) {
+        const r = taskctl(repoRoot, ['review', ID], { ...env, COSTE_AUTOMATICO: '0' });
+        assert.equal(r.status, 0, r.stderr);
+        assert.doesNotMatch(r.stdout, /Coste de implementacion registrado/);
+        const enRevision = await readTareaFile(tareasRoot, ID);
+        assert.equal(enRevision?.task.tokens_implementacion, null, 'apagado, review no suma');
+        assert.equal(existsSync(libro), true, 'y el libro sigue ahi para finish');
+      } else {
+        assert.match(ok(['review', ID]), /Coste de implementacion registrado automaticamente: \+500 tokens/);
+        assert.equal(existsSync(libro), false);
+      }
 
       await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
       ok(['veredicto', ID, 'aprobada']);
@@ -268,7 +283,13 @@ test('ciclo por CLI: hook como proceso, review lo suma y metricas deja de listar
 
       const terminada = await readTareaFile(tareasRoot, ID);
       assert.equal(terminada?.task.estado, 'terminada');
-      assert.equal(terminada?.task.tokens_implementacion, 500, 'finish no lo vuelve a sumar');
+      assert.equal(terminada?.task.tokens_implementacion, 500, redEnFinish ? 'lo suma finish' : 'finish no lo vuelve a sumar');
+      assert.equal(leerCostes(terminada?.body ?? '').filter((f) => f.fase === 'implementacion').length, 1);
+      assert.equal(existsSync(libro), false, 'tras el commit de cierre, el libro se vacia');
+      assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+      if (redEnFinish) {
+        assert.match(git(['show', '--format=%s', 'HEAD', '--', terminada?.filePath ?? ''], repoRoot), /\| implementacion \| sesion:/);
+      }
 
       const json = JSON.parse(ok(['metricas', '--json'])) as {
         sinCoste: { tareas: { id: string; fases: string[] }[] };
@@ -280,6 +301,14 @@ test('ciclo por CLI: hook como proceso, review lo suma y metricas deja de listar
       await rm(config, { recursive: true, force: true });
     }
   });
+}
+
+test('ciclo por CLI: hook como proceso, review lo suma y metricas deja de listar la tarea sin coste de implementacion', async () => {
+  await cicloPorCli(false);
+});
+
+test('ciclo por CLI: si review no lo vuelca, la red de finish lo suma una vez y vacia el libro', async () => {
+  await cicloPorCli(true);
 });
 
 test('review: un libro corrupto no rompe la transicion', async () => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts
index 40eeb16..2aeeaa0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts
@@ -161,3 +161,11 @@ test('volcado: una transcripcion que encoge (otra o recortada) no resta ni suma'
   const v = filasDeVolcado(body, [{ tipo: 'sesion', id: 's-1', uso: uso(400) }], '2026-11-01T12:00:00Z');
   assert.deepEqual(v.filas, []);
 });
+
+test('volcado: crece el total pero algun campo baja (otra transcripcion con el mismo id): no se toca', () => {
+  const anotado: UsoTranscripcion = { tokens: 1000, llamadas: 1, entrada: 100, cacheEscritura: 0, cacheLectura: 800, salida: 100, lecturas: 1 };
+  const body = anadirCoste('## Objetivo\nx\n', fila('implementacion', 'sesion:s-1', anotado, 1000));
+  const medida: UsoTranscripcion = { tokens: 1500, llamadas: 2, entrada: 100, cacheEscritura: 0, cacheLectura: 1390, salida: 10, lecturas: 1 };
+  const v = filasDeVolcado(body, [{ tipo: 'sesion', id: 's-1', uso: medida }], '2026-11-01T12:00:00Z');
+  assert.deepEqual(v.filas, [], 'una fila dif: con salida negativa falsearia el desglose');
+});
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 126d18d096a7479082c1db060b4df6d66c7922a5..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-085/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-085/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-085/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-085/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-085/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-085/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-085/revision/informe-revision-1.md                                                  |   66 +++
 tareas/03-en-revision/TASK-085/revision/peticion-revision-1.md                                                 | 1799 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-085/tarea.md                                                       |   13 +-
 9 files changed, 1873 insertions(+), 5 deletions(-)
````
