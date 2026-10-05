# Peticion de revision — TASK-051 (ronda 1)

- Tarea: TASK-051 — F6-T2 Partir los ficheros de test mas largos
- Rama revisada: feature/task-051-f6-t2-partir-los-ficheros-de-test-mas-la
- Rama base: develop
- Commit revisado (HEAD): 1e882ec8131e969493e12d7ff09184d8f3fc12c3
- Fecha: 2026-10-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-051 (criterios de aceptacion y plan)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
1e882ec feat(TASK-051): partir los ficheros de test mas largos
a5d00e8 chore(TASK-051): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-ciclo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-ciclo.test.ts
new file mode 100644
index 0000000..7b5bfd0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-ciclo.test.ts
@@ -0,0 +1,144 @@
+/**
+ * Flujo E, modo automatico (TASK-059): ciclo completo sin preguntas, guardas
+ * que siguen preguntando (informe fuera de commit propio, tope de rondas,
+ * hotfix) y guardas del CLI que abortan tambien en automatico. Repos Git
+ * temporales reales y el CLI real por spawn; los fixtures hacen de agentes.
+ */
+// Parte de los tests de automatico (ver test/helpers/automatico-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { writeFile, mkdir, readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+
+import {
+  HERE,
+  PLUGIN_ROOT,
+  TASKCTL,
+  ID,
+  CONFIG_AUTO,
+  git,
+  commitAll,
+  cli,
+  cliOk,
+  siguiente,
+  resumen,
+  plantillasPorConfig,
+  withRepo,
+  nueva,
+  planificar,
+  codigo,
+  dirRevision,
+  hastaCodigo,
+  rellenarInforme,
+  escribirVeredicto,
+} from '../helpers/automatico-fixtures.js';
+
+test('ciclo feature completo en automatico: tras plan nunca se pregunta y cada transicion va en su commit', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    nueva(repoRoot, 'feature', 'Ciclo completo');
+    const vistos: Array<Record<string, unknown>> = [];
+    const ver = (): Record<string, unknown> => {
+      const s = siguiente(repoRoot);
+      vistos.push(s);
+      return s;
+    };
+
+    let s = ver();
+    assert.deepEqual([s.fase, s.modo, s.accion], ['plan', 'automatico', 'continuar']);
+    await planificar(repoRoot, tareasRoot);
+
+    s = ver();
+    assert.deepEqual([s.estado, s.fase, s.accion], ['en-diseno', 'approve', 'continuar']);
+    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+
+    s = ver();
+    assert.deepEqual(resumen(s), ['start', 'continuar']);
+    cliOk(repoRoot, ['start', ID]);
+    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
+
+    s = ver();
+    assert.deepEqual([s.estado, ...resumen(s)], ['en-curso', 'review', 'continuar']);
+    cliOk(repoRoot, ['review', ID]);
+
+    s = ver();
+    assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'veredicto', 'continuar']);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+
+    s = ver();
+    assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'finish', 'continuar']);
+    cliOk(repoRoot, ['finish', ID]);
+
+    s = ver();
+    assert.deepEqual([s.estado, ...resumen(s)], ['terminada', 'terminada', 'detener']);
+    assert.ok(
+      vistos.every((v) => v.accion !== 'preguntar'),
+      `ningun siguiente debia preguntar: ${JSON.stringify(vistos.map(resumen))}`
+    );
+
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.ok(t);
+    assert.equal(t.task.estado, 'terminada');
+    assert.ok(
+      git(['ls-files', path.join(tareasRoot, '04-terminadas', ID, 'tarea.md')], repoRoot).trim().length > 0,
+      'la tarea esta en 04-terminadas'
+    );
+    const rows = leerTransiciones(t.body);
+    assert.deepEqual(
+      rows.map((r) => r.fase),
+      ['plan', 'approve', 'start', 'review', 'finish']
+    );
+    assert.ok(rows.every((r) => r.modo === 'automatico'));
+    const approve = rows.find((r) => r.fase === 'approve');
+    assert.equal(approve?.decidido_por, 'automatico');
+
+    // Un commit distinto por transicion: ninguna fila entra en el mismo commit que otra.
+    const shas = new Set<string>();
+    for (const r of rows) {
+      const encontrados = git(
+        ['log', '--all', '--format=%H', '-S', `| ${r.fase} | automatico | ${r.decidido_por} |`],
+        repoRoot
+      )
+        .split('\n')
+        .filter(Boolean);
+      assert.ok(encontrados.length >= 1, `ningun commit anade la fila ${r.fase}`);
+      shas.add(encontrados[encontrados.length - 1] as string);
+    }
+    assert.equal(shas.size, rows.length, 'cada transicion en un commit distinto');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('finish solo sigue solo si lo aprobado es exactamente lo revisado (CRIT-1 e IMP-1 de la revision)', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
+
+    // IMP-1: sin revisor (plantilla sin rellenar) + taskctl veredicto aprobada → pregunta.
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
+
+    // Con el informe rellenado por el revisor y commiteado solo: sigue solo.
+    await rellenarInforme(repoRoot, informe);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'continuar']);
+
+    // Edicion del informe sin commitear: lo leido no esta en ningun commit → pregunta.
+    const commiteado = await readFile(informe, 'utf8');
+    await writeFile(informe, commiteado + '\nnota sin commitear\n', 'utf8');
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
+    await writeFile(informe, commiteado, 'utf8');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+
+    // MEN-6: un informe reescrito sin linea de revisor tampoco cuenta como revisado.
+    await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n\nsin hallazgos\n', 'utf8');
+    commitAll(repoRoot, `docs(${ID}): informe sin revisor`);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guarda-finish.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guarda-finish.test.ts
new file mode 100644
index 0000000..fc3de8e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guarda-finish.test.ts
@@ -0,0 +1,91 @@
+/**
+ * Flujo E, modo automatico (TASK-059): ciclo completo sin preguntas, guardas
+ * que siguen preguntando (informe fuera de commit propio, tope de rondas,
+ * hotfix) y guardas del CLI que abortan tambien en automatico. Repos Git
+ * temporales reales y el CLI real por spawn; los fixtures hacen de agentes.
+ */
+// Parte de los tests de automatico (ver test/helpers/automatico-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { writeFile, mkdir, readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+
+import {
+  HERE,
+  PLUGIN_ROOT,
+  TASKCTL,
+  ID,
+  CONFIG_AUTO,
+  git,
+  commitAll,
+  cli,
+  cliOk,
+  siguiente,
+  resumen,
+  plantillasPorConfig,
+  withRepo,
+  nueva,
+  planificar,
+  codigo,
+  dirRevision,
+  hastaCodigo,
+  rellenarInforme,
+  escribirVeredicto,
+} from '../helpers/automatico-fixtures.js';
+
+test('CRIT-1 (a): codigo commiteado tras pedir la revision y antes del veredicto → finish pregunta', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    await codigo(repoRoot, 'codigo posterior a la peticion\n', `feat(${ID}): colado`);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    // El informe esta en commits propios y posteriores, pero el codigo no es el revisado.
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
+  });
+});
+
+test('CRIT-1 (b): informe commiteado junto a codigo y despues taskctl veredicto → finish pregunta', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
+    const texto = await readFile(informe, 'utf8');
+    await writeFile(
+      informe,
+      texto
+        .replace(/^- Revisor: \(rellenar.*$/m, '- Revisor: revisor de prueba')
+        .replace(/^\| \(ej\. IMP-1\).*$/m, '| MEN-1 | MENOR | aceptado | app.txt |'),
+      'utf8'
+    );
+    await writeFile(path.join(repoRoot, 'app.txt'), 'codigo nuevo no revisado\n', 'utf8');
+    commitAll(repoRoot, `feat(${ID}): informe y codigo juntos`);
+    // taskctl veredicto deja un commit que solo toca el informe, encima del mezclado.
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
+  });
+});
+
+test('IMP-3: la guarda leida desde develop (tarea en su rama) tambien pregunta con codigo no revisado', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    const rama = git(['branch', '--show-current'], repoRoot).trim();
+    git(['checkout', '-q', 'develop'], repoRoot);
+    let s = siguiente(repoRoot);
+    assert.deepEqual([s.leidaDe, ...resumen(s)], ['rama', 'finish', 'continuar']);
+    git(['checkout', '-q', rama], repoRoot);
+    await codigo(repoRoot, 'colado tras el veredicto\n', `feat(${ID}): colado`);
+    git(['checkout', '-q', 'develop'], repoRoot);
+    s = siguiente(repoRoot);
+    assert.deepEqual([s.leidaDe, ...resumen(s)], ['rama', 'finish', 'preguntar']);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guardas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guardas.test.ts
new file mode 100644
index 0000000..0026e74
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guardas.test.ts
@@ -0,0 +1,120 @@
+/**
+ * Flujo E, modo automatico (TASK-059): ciclo completo sin preguntas, guardas
+ * que siguen preguntando (informe fuera de commit propio, tope de rondas,
+ * hotfix) y guardas del CLI que abortan tambien en automatico. Repos Git
+ * temporales reales y el CLI real por spawn; los fixtures hacen de agentes.
+ */
+// Parte de los tests de automatico (ver test/helpers/automatico-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { writeFile, mkdir, readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+
+import {
+  HERE,
+  PLUGIN_ROOT,
+  TASKCTL,
+  ID,
+  CONFIG_AUTO,
+  git,
+  commitAll,
+  cli,
+  cliOk,
+  siguiente,
+  resumen,
+  plantillasPorConfig,
+  withRepo,
+  nueva,
+  planificar,
+  codigo,
+  dirRevision,
+  hastaCodigo,
+  rellenarInforme,
+  escribirVeredicto,
+} from '../helpers/automatico-fixtures.js';
+
+test('guarda WIP: con otra tarea en curso, start aborta tambien en automatico', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    nueva(repoRoot, 'feature', 'Primera');
+    nueva(repoRoot, 'feature', 'Segunda');
+    await planificar(repoRoot, tareasRoot, 'TASK-001');
+    await planificar(repoRoot, tareasRoot, 'TASK-002');
+    cliOk(repoRoot, ['approve', 'TASK-001', '--decidido-por', 'automatico']);
+    cliOk(repoRoot, ['approve', 'TASK-002', '--decidido-por', 'automatico']);
+    assert.deepEqual(resumen(siguiente(repoRoot, 'TASK-002')), ['start', 'continuar']);
+    cliOk(repoRoot, ['start', 'TASK-001']);
+    await codigo(repoRoot, 'trabajo 1\n', 'feat(TASK-001): trabajo');
+
+    git(['checkout', '-q', 'develop'], repoRoot);
+    const r = cli(repoRoot, ['start', 'TASK-002']);
+    assert.notEqual(r.status, 0, `start debia abortar: ${r.stdout}`);
+    assert.match(r.stderr, /TASK-001|WIP|limite/i);
+    const t = await readTareaFile(tareasRoot, 'TASK-002');
+    assert.equal(t?.task.estado, 'en-diseno', 'TASK-002 no se movio');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('finish con el informe sin veredicto (PENDIENTE) aborta aunque siguiente diga veredicto/continuar', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar']);
+    const r = cli(repoRoot, ['finish', ID]);
+    assert.notEqual(r.status, 0);
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.equal(t?.task.estado, 'en-revision');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('revision_codex: true sin segunda opinion: siguiente da codex-review y finish aborta', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    nueva(repoRoot, 'feature', 'Con codex');
+    // revision_codex se declara en el frontmatter de la tarea antes de planificar.
+    const tareaMd = path.join(tareasRoot, '00-planificadas', ID, 'tarea.md');
+    const texto = await readFile(tareaMd, 'utf8');
+    assert.match(texto, /^revision_codex:\s*false/m);
+    await writeFile(tareaMd, texto.replace(/^revision_codex:\s*false/m, 'revision_codex: true'), 'utf8');
+    commitAll(repoRoot, `docs(${ID}): revision_codex`);
+    await planificar(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+    cliOk(repoRoot, ['start', ID]);
+    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
+    cliOk(repoRoot, ['review', ID]);
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+
+    const s = siguiente(repoRoot);
+    assert.equal(s.fase, 'codex-review');
+    assert.equal(s.comando, `taskctl codex-review ${ID}`);
+    const r = cli(repoRoot, ['finish', ID]);
+    assert.notEqual(r.status, 0, `finish debia abortar: ${r.stdout}`);
+    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-revision');
+  });
+});
+
+test('approve --decidido-por automatico en una tarea planificada en manual aborta', async () => {
+  await withRepo('modo_flujo: manual\n', async (repoRoot, tareasRoot) => {
+    nueva(repoRoot, 'feature', 'Planificada en manual');
+    await planificar(repoRoot, tareasRoot);
+    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), CONFIG_AUTO, 'utf8');
+    commitAll(repoRoot, 'chore: config pasa a automatico');
+
+    // La tarea congelo manual en plan: manda su modo, no el config.
+    const s = siguiente(repoRoot);
+    assert.equal(s.modo, 'manual');
+    assert.equal(s.accion, 'detener');
+
+    const r = cli(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+    assert.notEqual(r.status, 0, `approve debia abortar: ${r.stdout}`);
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.equal(t?.task.plan_aprobado, false);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-rondas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-rondas.test.ts
new file mode 100644
index 0000000..857abeb
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-rondas.test.ts
@@ -0,0 +1,69 @@
+/**
+ * Flujo E, modo automatico (TASK-059): ciclo completo sin preguntas, guardas
+ * que siguen preguntando (informe fuera de commit propio, tope de rondas,
+ * hotfix) y guardas del CLI que abortan tambien en automatico. Repos Git
+ * temporales reales y el CLI real por spawn; los fixtures hacen de agentes.
+ */
+// Parte de los tests de automatico (ver test/helpers/automatico-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { writeFile, mkdir, readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+
+import {
+  HERE,
+  PLUGIN_ROOT,
+  TASKCTL,
+  ID,
+  CONFIG_AUTO,
+  git,
+  commitAll,
+  cli,
+  cliOk,
+  siguiente,
+  resumen,
+  plantillasPorConfig,
+  withRepo,
+  nueva,
+  planificar,
+  codigo,
+  dirRevision,
+  hastaCodigo,
+  rellenarInforme,
+  escribirVeredicto,
+} from '../helpers/automatico-fixtures.js';
+
+test('tope de rondas: las rondas 1 y 2 con cambios siguen solas, la 3 pregunta', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    for (const ronda of [1, 2, 3]) {
+      cliOk(repoRoot, ['review', ID]);
+      assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar'], `ronda ${String(ronda)} sin veredicto`);
+      cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
+      const s = siguiente(repoRoot);
+      assert.equal(s.estado, 'en-revision');
+      assert.equal(s.fase, 'review');
+      assert.equal(s.accion, ronda < 3 ? 'continuar' : 'preguntar', `ronda ${String(ronda)}`);
+      if (ronda < 3) await codigo(repoRoot, `correccion ${String(ronda)}\n`, `fix(${ID}): correccion ${String(ronda)}`);
+    }
+  });
+});
+
+test('hotfix en automatico con revision aprobada en commit propio: finish pregunta', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot, 'hotfix');
+    assert.match(git(['branch', '--show-current'], repoRoot).trim(), /^hotfix\//);
+    cliOk(repoRoot, ['review', ID]);
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    const s = siguiente(repoRoot);
+    assert.equal(s.modo, 'automatico');
+    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
+    assert.equal(s.comando, `taskctl finish ${ID}`);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
deleted file mode 100644
index e016742..0000000
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
+++ /dev/null
@@ -1,405 +0,0 @@
-/**
- * Flujo E, modo automatico (TASK-059): ciclo completo sin preguntas, guardas
- * que siguen preguntando (informe fuera de commit propio, tope de rondas,
- * hotfix) y guardas del CLI que abortan tambien en automatico. Repos Git
- * temporales reales y el CLI real por spawn; los fixtures hacen de agentes.
- */
-import { test } from 'node:test';
-import assert from 'node:assert/strict';
-import { writeFile, mkdir, readFile } from 'node:fs/promises';
-import path from 'node:path';
-import { fileURLToPath } from 'node:url';
-import { spawnSync } from 'node:child_process';
-import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
-import { readTareaFile } from '../../src/fs/task-store.js';
-import { leerTransiciones } from '../../src/core/transiciones.js';
-
-const HERE = path.dirname(fileURLToPath(import.meta.url));
-const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
-const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
-const ID = 'TASK-001';
-const CONFIG_AUTO = 'modo_flujo: automatico\n';
-
-function git(args: string[], cwd: string): string {
-  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
-  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
-  return result.stdout;
-}
-
-function commitAll(repoRoot: string, message: string): void {
-  git(['add', '-A'], repoRoot);
-  git(['commit', '-q', '-m', message], repoRoot);
-}
-
-function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
-  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
-  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
-}
-
-function cliOk(cwd: string, args: string[]) {
-  const r = cli(cwd, args);
-  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
-  return r;
-}
-
-function siguiente(cwd: string, id = ID): Record<string, unknown> {
-  return JSON.parse(cliOk(cwd, ['siguiente', id, '--json']).stdout) as Record<string, unknown>;
-}
-
-function resumen(s: Record<string, unknown>): [unknown, unknown] {
-  return [s.fase, s.accion];
-}
-
-// Repo base montado una vez por fichero (y por config) y copiado en cada
-// test (test/helpers/repo-plantilla.ts). La receta es la de siempre.
-const plantillasPorConfig = new Map<string, ConRepo>();
-
-function withRepo(
-  config: string,
-  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
-): Promise<void> {
-  let conRepo = plantillasPorConfig.get(config);
-  if (conRepo === undefined) {
-    conRepo = plantillaRepo('taskctl-auto-', async (repoRoot) => {
-      git(['init', '-q', '-b', 'main'], repoRoot);
-      git(['config', 'user.email', 'test@example.com'], repoRoot);
-      git(['config', 'user.name', 'Test'], repoRoot);
-      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
-      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
-      await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
-      commitAll(repoRoot, 'inicial');
-      git(['checkout', '-q', '-b', 'develop'], repoRoot);
-    });
-    plantillasPorConfig.set(config, conRepo);
-  }
-  return conRepo(fn);
-}
-
-/** `taskctl new` por CLI; devuelve el ID creado (TASK-001 en un repo vacio). */
-function nueva(repoRoot: string, tipo: string, titulo: string): void {
-  cliOk(repoRoot, [
-    'new',
-    '--titulo', titulo,
-    '--tipo', tipo,
-    '--complejidad', 'simple',
-    '--objetivo', 'Probar el modo automatico.',
-    '--criterio', 'La tarea queda en 04-terminadas',
-  ]);
-  // `new` deja la tarea en el working tree; el flujo la commitea antes de seguir.
-  if (git(['status', '--porcelain'], repoRoot).trim() !== '') commitAll(repoRoot, `docs: ${titulo}`);
-}
-
-/** plan por CLI y plan-final.md redactado y commiteado. */
-async function planificar(repoRoot: string, tareasRoot: string, id = ID): Promise<void> {
-  cliOk(repoRoot, ['plan', id]);
-  await writeFile(
-    path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
-    '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
-    'utf8'
-  );
-  commitAll(repoRoot, `docs(${id}): plan final`);
-}
-
-async function codigo(repoRoot: string, contenido: string, mensaje: string): Promise<void> {
-  await writeFile(path.join(repoRoot, 'app.txt'), contenido, 'utf8');
-  commitAll(repoRoot, mensaje);
-}
-
-function dirRevision(tareasRoot: string, id = ID): string {
-  return path.join(tareasRoot, '03-en-revision', id, 'revision');
-}
-
-/** Tarea feature de TASK-001 planificada, aprobada, empezada y con un commit de codigo. */
-async function hastaCodigo(repoRoot: string, tareasRoot: string, tipo = 'feature'): Promise<void> {
-  nueva(repoRoot, tipo, 'Flujo automatico');
-  await planificar(repoRoot, tareasRoot);
-  cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
-  cliOk(repoRoot, ['start', ID]);
-  await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
-}
-
-/**
- * Lo que hace el revisor: rellena la cabecera y la tabla de hallazgos del
- * informe (sin tocar la linea de veredicto) y lo commitea SOLO.
- */
-async function rellenarInforme(repoRoot: string, informe: string): Promise<void> {
-  const texto = await readFile(informe, 'utf8');
-  const relleno = texto
-    .replace(/^- Revisor: \(rellenar.*$/m, '- Revisor: revisor independiente de prueba')
-    .replace(/^\| \(ej\. IMP-1\).*$/m, '| MEN-1 | MENOR | aceptado | app.txt |');
-  assert.notEqual(relleno, texto, 'el informe tenia la plantilla');
-  await writeFile(informe, relleno, 'utf8');
-  commitAll(repoRoot, `docs(${ID}): informe de revision`);
-}
-
-/** Sustituye la linea de veredicto del informe 1 sin commitear (a mano, como un agente). */
-async function escribirVeredicto(informe: string, valor: string): Promise<void> {
-  const texto = await readFile(informe, 'utf8');
-  const nuevo = texto.replace(/^- Veredicto:.*$/m, `- Veredicto: ${valor}`);
-  assert.notEqual(nuevo, texto, 'el informe debe tener la linea de veredicto');
-  await writeFile(informe, nuevo, 'utf8');
-}
-
-test('ciclo feature completo en automatico: tras plan nunca se pregunta y cada transicion va en su commit', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    nueva(repoRoot, 'feature', 'Ciclo completo');
-    const vistos: Array<Record<string, unknown>> = [];
-    const ver = (): Record<string, unknown> => {
-      const s = siguiente(repoRoot);
-      vistos.push(s);
-      return s;
-    };
-
-    let s = ver();
-    assert.deepEqual([s.fase, s.modo, s.accion], ['plan', 'automatico', 'continuar']);
-    await planificar(repoRoot, tareasRoot);
-
-    s = ver();
-    assert.deepEqual([s.estado, s.fase, s.accion], ['en-diseno', 'approve', 'continuar']);
-    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
-
-    s = ver();
-    assert.deepEqual(resumen(s), ['start', 'continuar']);
-    cliOk(repoRoot, ['start', ID]);
-    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
-
-    s = ver();
-    assert.deepEqual([s.estado, ...resumen(s)], ['en-curso', 'review', 'continuar']);
-    cliOk(repoRoot, ['review', ID]);
-
-    s = ver();
-    assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'veredicto', 'continuar']);
-    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
-    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
-
-    s = ver();
-    assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'finish', 'continuar']);
-    cliOk(repoRoot, ['finish', ID]);
-
-    s = ver();
-    assert.deepEqual([s.estado, ...resumen(s)], ['terminada', 'terminada', 'detener']);
-    assert.ok(
-      vistos.every((v) => v.accion !== 'preguntar'),
-      `ningun siguiente debia preguntar: ${JSON.stringify(vistos.map(resumen))}`
-    );
-
-    const t = await readTareaFile(tareasRoot, ID);
-    assert.ok(t);
-    assert.equal(t.task.estado, 'terminada');
-    assert.ok(
-      git(['ls-files', path.join(tareasRoot, '04-terminadas', ID, 'tarea.md')], repoRoot).trim().length > 0,
-      'la tarea esta en 04-terminadas'
-    );
-    const rows = leerTransiciones(t.body);
-    assert.deepEqual(
-      rows.map((r) => r.fase),
-      ['plan', 'approve', 'start', 'review', 'finish']
-    );
-    assert.ok(rows.every((r) => r.modo === 'automatico'));
-    const approve = rows.find((r) => r.fase === 'approve');
-    assert.equal(approve?.decidido_por, 'automatico');
-
-    // Un commit distinto por transicion: ninguna fila entra en el mismo commit que otra.
-    const shas = new Set<string>();
-    for (const r of rows) {
-      const encontrados = git(
-        ['log', '--all', '--format=%H', '-S', `| ${r.fase} | automatico | ${r.decidido_por} |`],
-        repoRoot
-      )
-        .split('\n')
-        .filter(Boolean);
-      assert.ok(encontrados.length >= 1, `ningun commit anade la fila ${r.fase}`);
-      shas.add(encontrados[encontrados.length - 1] as string);
-    }
-    assert.equal(shas.size, rows.length, 'cada transicion en un commit distinto');
-    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
-  });
-});
-
-test('finish solo sigue solo si lo aprobado es exactamente lo revisado (CRIT-1 e IMP-1 de la revision)', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await hastaCodigo(repoRoot, tareasRoot);
-    cliOk(repoRoot, ['review', ID]);
-    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
-
-    // IMP-1: sin revisor (plantilla sin rellenar) + taskctl veredicto aprobada → pregunta.
-    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
-
-    // Con el informe rellenado por el revisor y commiteado solo: sigue solo.
-    await rellenarInforme(repoRoot, informe);
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'continuar']);
-
-    // Edicion del informe sin commitear: lo leido no esta en ningun commit → pregunta.
-    const commiteado = await readFile(informe, 'utf8');
-    await writeFile(informe, commiteado + '\nnota sin commitear\n', 'utf8');
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
-    await writeFile(informe, commiteado, 'utf8');
-    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
-
-    // MEN-6: un informe reescrito sin linea de revisor tampoco cuenta como revisado.
-    await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n\nsin hallazgos\n', 'utf8');
-    commitAll(repoRoot, `docs(${ID}): informe sin revisor`);
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
-  });
-});
-
-test('CRIT-1 (a): codigo commiteado tras pedir la revision y antes del veredicto → finish pregunta', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await hastaCodigo(repoRoot, tareasRoot);
-    cliOk(repoRoot, ['review', ID]);
-    await codigo(repoRoot, 'codigo posterior a la peticion\n', `feat(${ID}): colado`);
-    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
-    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
-    // El informe esta en commits propios y posteriores, pero el codigo no es el revisado.
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
-  });
-});
-
-test('CRIT-1 (b): informe commiteado junto a codigo y despues taskctl veredicto → finish pregunta', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await hastaCodigo(repoRoot, tareasRoot);
-    cliOk(repoRoot, ['review', ID]);
-    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
-    const texto = await readFile(informe, 'utf8');
-    await writeFile(
-      informe,
-      texto
-        .replace(/^- Revisor: \(rellenar.*$/m, '- Revisor: revisor de prueba')
-        .replace(/^\| \(ej\. IMP-1\).*$/m, '| MEN-1 | MENOR | aceptado | app.txt |'),
-      'utf8'
-    );
-    await writeFile(path.join(repoRoot, 'app.txt'), 'codigo nuevo no revisado\n', 'utf8');
-    commitAll(repoRoot, `feat(${ID}): informe y codigo juntos`);
-    // taskctl veredicto deja un commit que solo toca el informe, encima del mezclado.
-    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
-  });
-});
-
-test('IMP-3: la guarda leida desde develop (tarea en su rama) tambien pregunta con codigo no revisado', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await hastaCodigo(repoRoot, tareasRoot);
-    cliOk(repoRoot, ['review', ID]);
-    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
-    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
-    const rama = git(['branch', '--show-current'], repoRoot).trim();
-    git(['checkout', '-q', 'develop'], repoRoot);
-    let s = siguiente(repoRoot);
-    assert.deepEqual([s.leidaDe, ...resumen(s)], ['rama', 'finish', 'continuar']);
-    git(['checkout', '-q', rama], repoRoot);
-    await codigo(repoRoot, 'colado tras el veredicto\n', `feat(${ID}): colado`);
-    git(['checkout', '-q', 'develop'], repoRoot);
-    s = siguiente(repoRoot);
-    assert.deepEqual([s.leidaDe, ...resumen(s)], ['rama', 'finish', 'preguntar']);
-  });
-});
-
-test('tope de rondas: las rondas 1 y 2 con cambios siguen solas, la 3 pregunta', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await hastaCodigo(repoRoot, tareasRoot);
-    for (const ronda of [1, 2, 3]) {
-      cliOk(repoRoot, ['review', ID]);
-      assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar'], `ronda ${String(ronda)} sin veredicto`);
-      cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
-      const s = siguiente(repoRoot);
-      assert.equal(s.estado, 'en-revision');
-      assert.equal(s.fase, 'review');
-      assert.equal(s.accion, ronda < 3 ? 'continuar' : 'preguntar', `ronda ${String(ronda)}`);
-      if (ronda < 3) await codigo(repoRoot, `correccion ${String(ronda)}\n`, `fix(${ID}): correccion ${String(ronda)}`);
-    }
-  });
-});
-
-test('hotfix en automatico con revision aprobada en commit propio: finish pregunta', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await hastaCodigo(repoRoot, tareasRoot, 'hotfix');
-    assert.match(git(['branch', '--show-current'], repoRoot).trim(), /^hotfix\//);
-    cliOk(repoRoot, ['review', ID]);
-    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
-    const s = siguiente(repoRoot);
-    assert.equal(s.modo, 'automatico');
-    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
-    assert.equal(s.comando, `taskctl finish ${ID}`);
-  });
-});
-
-test('guarda WIP: con otra tarea en curso, start aborta tambien en automatico', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    nueva(repoRoot, 'feature', 'Primera');
-    nueva(repoRoot, 'feature', 'Segunda');
-    await planificar(repoRoot, tareasRoot, 'TASK-001');
-    await planificar(repoRoot, tareasRoot, 'TASK-002');
-    cliOk(repoRoot, ['approve', 'TASK-001', '--decidido-por', 'automatico']);
-    cliOk(repoRoot, ['approve', 'TASK-002', '--decidido-por', 'automatico']);
-    assert.deepEqual(resumen(siguiente(repoRoot, 'TASK-002')), ['start', 'continuar']);
-    cliOk(repoRoot, ['start', 'TASK-001']);
-    await codigo(repoRoot, 'trabajo 1\n', 'feat(TASK-001): trabajo');
-
-    git(['checkout', '-q', 'develop'], repoRoot);
-    const r = cli(repoRoot, ['start', 'TASK-002']);
-    assert.notEqual(r.status, 0, `start debia abortar: ${r.stdout}`);
-    assert.match(r.stderr, /TASK-001|WIP|limite/i);
-    const t = await readTareaFile(tareasRoot, 'TASK-002');
-    assert.equal(t?.task.estado, 'en-diseno', 'TASK-002 no se movio');
-    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
-  });
-});
-
-test('finish con el informe sin veredicto (PENDIENTE) aborta aunque siguiente diga veredicto/continuar', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await hastaCodigo(repoRoot, tareasRoot);
-    cliOk(repoRoot, ['review', ID]);
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar']);
-    const r = cli(repoRoot, ['finish', ID]);
-    assert.notEqual(r.status, 0);
-    const t = await readTareaFile(tareasRoot, ID);
-    assert.equal(t?.task.estado, 'en-revision');
-    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
-  });
-});
-
-test('revision_codex: true sin segunda opinion: siguiente da codex-review y finish aborta', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    nueva(repoRoot, 'feature', 'Con codex');
-    // revision_codex se declara en el frontmatter de la tarea antes de planificar.
-    const tareaMd = path.join(tareasRoot, '00-planificadas', ID, 'tarea.md');
-    const texto = await readFile(tareaMd, 'utf8');
-    assert.match(texto, /^revision_codex:\s*false/m);
-    await writeFile(tareaMd, texto.replace(/^revision_codex:\s*false/m, 'revision_codex: true'), 'utf8');
-    commitAll(repoRoot, `docs(${ID}): revision_codex`);
-    await planificar(repoRoot, tareasRoot);
-    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
-    cliOk(repoRoot, ['start', ID]);
-    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
-    cliOk(repoRoot, ['review', ID]);
-    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
-
-    const s = siguiente(repoRoot);
-    assert.equal(s.fase, 'codex-review');
-    assert.equal(s.comando, `taskctl codex-review ${ID}`);
-    const r = cli(repoRoot, ['finish', ID]);
-    assert.notEqual(r.status, 0, `finish debia abortar: ${r.stdout}`);
-    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-revision');
-  });
-});
-
-test('approve --decidido-por automatico en una tarea planificada en manual aborta', async () => {
-  await withRepo('modo_flujo: manual\n', async (repoRoot, tareasRoot) => {
-    nueva(repoRoot, 'feature', 'Planificada en manual');
-    await planificar(repoRoot, tareasRoot);
-    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), CONFIG_AUTO, 'utf8');
-    commitAll(repoRoot, 'chore: config pasa a automatico');
-
-    // La tarea congelo manual en plan: manda su modo, no el config.
-    const s = siguiente(repoRoot);
-    assert.equal(s.modo, 'manual');
-    assert.equal(s.accion, 'detener');
-
-    const r = cli(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
-    assert.notEqual(r.status, 0, `approve debia abortar: ${r.stdout}`);
-    const t = await readTareaFile(tareasRoot, ID);
-    assert.equal(t?.task.plan_aprobado, false);
-    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
-  });
-});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-cierre.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-cierre.test.ts
new file mode 100644
index 0000000..706403f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-cierre.test.ts
@@ -0,0 +1,163 @@
+/**
+ * Test de integracion real (no mocks) para taskctl finish (TASK-014):
+ * repos Git temporales de verdad, los scripts merge-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (merges, tags, ancestria)
+ * en vez de fiarse de lo que devuelve el comando. Mismo espiritu que
+ * review.test.ts (TASK-013).
+ */
+// Parte de los tests de finish (ver test/helpers/finish-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  VEREDICTO_APROBADO,
+  setupTaskEnRevision,
+} from '../helpers/finish-fixtures.js';
+
+test('taskctl finish (feature): el caso normal — la tarea vive en develop en una carpeta anterior del ciclo — NO dispara la colision de linaje', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Flujo real del metodo: la tarea nace en develop (01-en-diseno)...
+    const enDiseno = sampleTask({
+      id: 'TASK-714',
+      estado: 'en-diseno',
+      rama: 'feature/task-714-normal',
+    });
+    await writeTareaFile(tareasRoot, enDiseno, '');
+    commitAll(repoRoot, 'TASK-714 en diseno en develop');
+
+    // ...y su rama (que SI comparte ese commit como ancestro) la mueve
+    // por el ciclo hasta en-revision.
+    const task = sampleTask({ id: 'TASK-714', estado: 'en-revision', rama: 'feature/task-714-normal' });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    git(['rm', '-r', '-q', 'tareas/01-en-diseno/TASK-714'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '');
+    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-714', 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), VEREDICTO_APROBADO, 'utf8');
+    commitAll(repoRoot, 'TASK-714 revisada en su rama');
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-714'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.match(result.filePath, /04-terminadas[/\\]TASK-714/);
+    // Y sin duplicados en develop: solo la copia terminada.
+    const read = await readTareaFile(tareasRoot, 'TASK-714');
+    assert.equal(read?.task.estado, 'terminada');
+    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-714')));
+    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-714')));
+  });
+});
+
+test('taskctl finish: desde una rama que no ve la tarea, el mensaje dice cambiarse a la rama (no usar import) — hallazgo MENOR de revision', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // La tarea existe solo en su rama; nosotros estamos en develop.
+    const task = sampleTask({ id: 'TASK-715', rama: 'feature/task-715-otra' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-715'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match((e as Error).message, /cambiate a esa rama/);
+        assert.doesNotMatch((e as Error).message, /import/);
+        return true;
+      }
+    );
+  });
+});
+
+test('taskctl finish: un CHANGELOG artesanal sin "Sin publicar" recibe la seccion ARRIBA, no al final (hallazgo MENOR de revision)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeFile(
+      path.join(repoRoot, 'CHANGELOG.md'),
+      '# Historial\n\n## v1.2.0\n\n- cosa nueva\n\n## v1.1.0\n\n- cosa vieja\n',
+      'utf8'
+    );
+    const task = sampleTask({ id: 'TASK-716', rama: 'feature/task-716-changelog' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    await runFinishCommand(tareasRoot, ['TASK-716'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
+    assert.match(changelog, /TASK-716/);
+    assert.ok(
+      changelog.indexOf('## Sin publicar') < changelog.indexOf('## v1.2.0'),
+      'la seccion nueva debe quedar por encima de las versiones viejas'
+    );
+    assert.match(changelog, /- cosa vieja/);
+  });
+});
+
+test('taskctl finish: repetirlo sobre una tarea terminada dice que ya esta terminada, sin aconsejar taskctl review', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-717', rama: 'feature/task-717-doble' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    await runFinishCommand(tareasRoot, ['TASK-717'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'cierre de TASK-717');
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-717'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof StateMachineError);
+        assert.match((e as Error).message, /ya esta terminada/);
+        assert.doesNotMatch((e as Error).message, /taskctl review/);
+        return true;
+      }
+    );
+  });
+});
+
+test('taskctl finish: rechaza sin revision aprobada (veredicto PENDIENTE), sin tocar Git', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-705', rama: 'feature/task-705-pendiente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, {
+      veredicto: '- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n',
+    });
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-705'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      StateMachineError
+    );
+
+    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
+    const read = await readTareaFile(tareasRoot, 'TASK-705');
+    assert.equal(read?.task.estado, 'en-revision');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-guardas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-guardas.test.ts
new file mode 100644
index 0000000..955c476
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-guardas.test.ts
@@ -0,0 +1,230 @@
+/**
+ * Test de integracion real (no mocks) para taskctl finish (TASK-014):
+ * repos Git temporales de verdad, los scripts merge-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (merges, tags, ancestria)
+ * en vez de fiarse de lo que devuelve el comando. Mismo espiritu que
+ * review.test.ts (TASK-013).
+ */
+// Parte de los tests de finish (ver test/helpers/finish-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  VEREDICTO_APROBADO,
+  setupTaskEnRevision,
+} from '../helpers/finish-fixtures.js';
+
+test('taskctl finish: con revision_codex exige informe de Codex aprobado (rechaza sin el, pasa con el)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({
+      id: 'TASK-706',
+      rama: 'feature/task-706-codex',
+      revision_codex: true,
+    });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof StateMachineError);
+        assert.match((e as Error).message, /revision_codex/);
+        return true;
+      }
+    );
+
+    // Con el informe de Codex aprobado (convencion de TASK-020), pasa.
+    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-706', 'revision');
+    await writeFile(
+      path.join(revisionDir, 'informe-codex-1.md'),
+      `# Informe Codex\n\n${VEREDICTO_APROBADO}`,
+      'utf8'
+    );
+    commitAll(repoRoot, 'informe codex aprobado');
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.match(result.filePath, /04-terminadas/);
+  });
+});
+
+test('taskctl finish: rechaza una tarea que no esta en-revision, con el comando requerido en el mensaje', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-707', estado: 'en-curso', rama: 'feature/task-707-curso' });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '');
+    commitAll(repoRoot, 'tarea en curso');
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-707'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof StateMachineError);
+        assert.match((e as Error).message, /taskctl review/);
+        return true;
+      }
+    );
+  });
+});
+
+test('taskctl finish: rechaza con el workspace sucio, sin invocar el script', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-708', rama: 'feature/task-708-sucio' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-708'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      FinishCommandError
+    );
+
+    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
+  });
+});
+
+test('taskctl finish: si el script falla, la tarea no se mueve ni se renderiza nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-709', rama: 'feature/task-709-roto' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-finish-'));
+    await writeFile(
+      path.join(brokenScriptsDir, 'merge-feature-to-develop.sh'),
+      '#!/usr/bin/env bash\nexit 7\n',
+      'utf8'
+    );
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-709'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: brokenScriptsDir,
+        }),
+      FinishCommandError
+    );
+
+    const read = await readTareaFile(tareasRoot, 'TASK-709');
+    assert.equal(read?.task.estado, 'en-revision');
+    await assert.rejects(() => stat(path.join(repoRoot, 'CHANGELOG.md')));
+    await assert.rejects(() => stat(path.join(repoRoot, 'docs', 'BOARD.md')));
+    await rm(brokenScriptsDir, { recursive: true, force: true });
+  });
+});
+
+test('taskctl finish: una ronda fragmentada por dominio (N informes) exige que TODOS aprueben antes de cerrar (TASK-018)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-720', rama: 'feature/task-720-fragmentada' });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish con revision fragmentada.\n');
+    await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
+    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    // Misma ronda (1), dos revisores de dominio: uno aprueba, el otro
+    // sigue con el veredicto de la plantilla sin sustituir.
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
+      `# Informe de revision — ${task.id} (ronda 1)\n\n${VEREDICTO_APROBADO}`,
+      'utf8'
+    );
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'),
+      `# Informe de revision — ${task.id} (ronda 1)\n\n` +
+        '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados")\n',
+      'utf8'
+    );
+    commitAll(repoRoot, `feat(${task.id}): revision fragmentada, un dominio pendiente`);
+
+    // Con un informe de dominio todavia PENDIENTE, "finish" rechaza —
+    // aunque el otro informe de la MISMA ronda ya apruebe.
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, [task.id], '2026-09-12', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      StateMachineError
+    );
+    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
+    const tras1 = await readTareaFile(tareasRoot, task.id);
+    assert.equal(tras1?.task.estado, 'en-revision');
+
+    // Se aprueba el que faltaba (misma ronda, mismo N): ahora SI cierra.
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'),
+      `# Informe de revision — ${task.id} (ronda 1)\n\n${VEREDICTO_APROBADO}`,
+      'utf8'
+    );
+    commitAll(repoRoot, 'segundo informe de dominio tambien aprobado');
+
+    const result = await runFinishCommand(tareasRoot, [task.id], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.match(result.filePath, /04-terminadas[/\\]TASK-720/);
+    const tras2 = await readTareaFile(tareasRoot, task.id);
+    assert.equal(tras2?.task.estado, 'terminada');
+  });
+});
+
+test('taskctl finish: dos tareas terminadas acumulan entradas en CHANGELOG e INDEX sin pisarse', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const t1 = sampleTask({ id: 'TASK-710', rama: 'feature/task-710-una' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, t1);
+    await runFinishCommand(tareasRoot, ['TASK-710'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'cierre de TASK-710');
+
+    const t2 = sampleTask({ id: 'TASK-711', titulo: 'Segunda tarea', rama: 'feature/task-711-dos' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, t2);
+    await runFinishCommand(tareasRoot, ['TASK-711'], '2026-09-08', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
+    assert.match(changelog, /TASK-710/);
+    assert.match(changelog, /TASK-711/);
+    // La mas reciente queda arriba (insercion bajo la cabecera).
+    assert.ok(changelog.indexOf('TASK-711') < changelog.indexOf('TASK-710'));
+
+    const index = await readFile(path.join(repoRoot, 'docs', 'INDEX.md'), 'utf8');
+    assert.match(index, /TASK-710/);
+    assert.match(index, /Segunda tarea/);
+
+    // El board refleja el estado final: ambas terminadas.
+    const board = await readFile(path.join(repoRoot, 'docs', 'BOARD.md'), 'utf8');
+    assert.match(board, /TASK-710/);
+    assert.match(board, /TASK-711/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-linaje.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-linaje.test.ts
new file mode 100644
index 0000000..f4886c0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-linaje.test.ts
@@ -0,0 +1,153 @@
+/**
+ * Test de integracion real (no mocks) para taskctl finish (TASK-014):
+ * repos Git temporales de verdad, los scripts merge-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (merges, tags, ancestria)
+ * en vez de fiarse de lo que devuelve el comando. Mismo espiritu que
+ * review.test.ts (TASK-013).
+ */
+// Parte de los tests de finish (ver test/helpers/finish-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  VEREDICTO_APROBADO,
+  setupTaskEnRevision,
+} from '../helpers/finish-fixtures.js';
+
+test('taskctl finish: colision de IDs entre main y develop se detecta ANTES de mergear', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // develop ya tiene OTRO TASK-704 (titulo distinto), nacido de su
+    // propio linaje.
+    const otraTarea = sampleTask({
+      id: 'TASK-704',
+      titulo: 'Otra tarea distinta con el mismo numero',
+      estado: 'planificada',
+      rama: 'feature/task-704-otra',
+    });
+    await writeTareaFile(tareasRoot, otraTarea, '');
+    commitAll(repoRoot, 'otra TASK-704 en develop');
+
+    // El hotfix, nacido de main (que no ve tareas/ de develop),
+    // recalculo el mismo ID para una tarea diferente.
+    const task = sampleTask({ id: 'TASK-704', tipo: 'hotfix', rama: 'hotfix/task-704-urgente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-704'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match((e as Error).message, /colision de IDs/);
+        assert.match((e as Error).message, /Renumera/);
+        return true;
+      }
+    );
+
+    // Nada se mergeo: main sigue sin el merge y no hay tag.
+    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
+    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), task.rama);
+    const read = await readTareaFile(tareasRoot, 'TASK-704');
+    assert.equal(read?.task.estado, 'en-revision');
+  });
+});
+
+test('taskctl finish (hotfix): tras un conflicto de backmerge resuelto a mano, el reintento cierra por el camino idempotente sin chocar con el tag (hallazgo IMPORTANTE de revision)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Conflicto real: el hotfix y develop tocan la misma linea.
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(path.join(repoRoot, 'app.txt'), 'linea original\n', 'utf8');
+    commitAll(repoRoot, 'app en main');
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '-q', '--ff-only', 'main'], repoRoot);
+    await writeFile(path.join(repoRoot, 'app.txt'), 'version de develop\n', 'utf8');
+    commitAll(repoRoot, 'app cambiada en develop');
+
+    const task = sampleTask({ id: 'TASK-712', tipo: 'hotfix', rama: 'hotfix/task-712-conflicto' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+    await writeFile(path.join(repoRoot, 'app.txt'), 'version del hotfix\n', 'utf8');
+    commitAll(repoRoot, 'app cambiada en el hotfix');
+
+    // Primer intento: merge a main + tag OK, backmerge en conflicto.
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-712'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      FinishCommandError
+    );
+    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
+    assert.equal(git(['tag', '--list', 'task-712-conflicto'], repoRoot).trim(), 'task-712-conflicto');
+
+    // La persona resuelve el conflicto del backmerge a mano y comitea.
+    await writeFile(path.join(repoRoot, 'app.txt'), 'version reconciliada\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '--no-edit'], repoRoot);
+
+    // Reintento: NO se reejecuta el script (moriria en el tag
+    // duplicado) — el camino idempotente cierra la tarea.
+    const result = await runFinishCommand(tareasRoot, ['TASK-712'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.match(result.filePath, /04-terminadas[/\\]TASK-712/);
+    const read = await readTareaFile(tareasRoot, 'TASK-712');
+    assert.equal(read?.task.estado, 'terminada');
+    // El tag sigue siendo uno (no hubo segundo intento de crearlo).
+    assert.equal(git(['tag', '--list'], repoRoot).trim(), 'task-712-conflicto');
+  });
+});
+
+test('taskctl finish (hotfix): mismo ID y MISMO titulo en linaje divergente tambien aborta antes de mergear (hallazgo IMPORTANTE de revision: add+add duplicaria la carpeta)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // develop tiene la "misma" tarea (mismo id y titulo) pero anadida
+    // por su propio linaje, sin ancestro comun con la rama del hotfix.
+    const copiaDevelop = sampleTask({
+      id: 'TASK-713',
+      estado: 'planificada',
+      rama: 'hotfix/task-713-urgente',
+    });
+    await writeTareaFile(tareasRoot, copiaDevelop, '');
+    commitAll(repoRoot, 'TASK-713 en develop');
+
+    const task = sampleTask({ id: 'TASK-713', tipo: 'hotfix', rama: 'hotfix/task-713-urgente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-713'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match((e as Error).message, /linaje|ancestro comun|add\+add/);
+        return true;
+      }
+    );
+    // Nada mergeado: sin tag y main sin merge.
+    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
+    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge.test.ts
new file mode 100644
index 0000000..0c5b066
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge.test.ts
@@ -0,0 +1,159 @@
+/**
+ * Test de integracion real (no mocks) para taskctl finish (TASK-014):
+ * repos Git temporales de verdad, los scripts merge-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (merges, tags, ancestria)
+ * en vez de fiarse de lo que devuelve el comando. Mismo espiritu que
+ * review.test.ts (TASK-013).
+ */
+// Parte de los tests de finish (ver test/helpers/finish-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  VEREDICTO_APROBADO,
+  setupTaskEnRevision,
+} from '../helpers/finish-fixtures.js';
+
+test('veredictoAprobado: fail-closed con PENDIENTE, cambios-solicitados o sin linea de veredicto', () => {
+  assert.equal(veredictoAprobado('- Veredicto: aprobada\n'), true);
+  assert.equal(veredictoAprobado('- Veredicto: APROBADA (sin hallazgos)\n'), true);
+  assert.equal(veredictoAprobado('- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n'), false);
+  assert.equal(veredictoAprobado('- Veredicto: cambios-solicitados\n'), false);
+  assert.equal(veredictoAprobado('informe sin veredicto\n'), false);
+  assert.equal(veredictoAprobado(''), false);
+});
+
+test('veredictoAprobado: NO es fail-open ante negaciones ni lineas multiples (hallazgo CRITICO de revision)', () => {
+  // La negacion mas natural en espanol debe rechazar, no aprobar.
+  assert.equal(veredictoAprobado('- Veredicto: no aprobada (faltan tests)\n'), false);
+  assert.equal(veredictoAprobado('- Veredicto: NO aprobada\n'), false);
+  assert.equal(veredictoAprobado('- Veredicto: rechazada (aprobada seria prematuro)\n'), false);
+  // El veredicto del informe de TASK-013 (referencia real): la palabra
+  // "independiente" no debe confundirse con "pendiente".
+  assert.equal(
+    veredictoAprobado('- Veredicto: aprobada (revisada por el agente independiente)\n'),
+    true
+  );
+  // Varias lineas Veredicto: TODAS deben aprobar (placeholder de la
+  // plantilla sin borrar => rechazo; aprobada + cambios => rechazo).
+  assert.equal(
+    veredictoAprobado('- Veredicto: PENDIENTE (...)\n\ntexto\n\n- Veredicto: aprobada\n'),
+    false
+  );
+  assert.equal(
+    veredictoAprobado('- Veredicto: aprobada\n\n- Veredicto: cambios-solicitados\n'),
+    false
+  );
+});
+
+test('taskctl finish (feature): merge a develop, tarea a 04-terminadas y CHANGELOG/INDEX/BOARD renderizados', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-700'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.baseBranch, 'develop');
+    assert.equal(result.mainBranch, null);
+    assert.match(result.filePath, /04-terminadas[/\\]TASK-700[/\\]tarea\.md$/);
+
+    // Evidencia real de Git.
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    assert.match(git(['log', '--oneline'], repoRoot), /merge\(feature\): feature\/task-700-prueba-finish -> develop/);
+
+    const read = await readTareaFile(tareasRoot, 'TASK-700');
+    assert.equal(read?.task.estado, 'terminada');
+    assert.equal(read?.task.actualizado, '2026-09-07');
+    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-700')));
+
+    const changelog = await readFile(result.changelogPath, 'utf8');
+    assert.match(changelog, /## Sin publicar/);
+    assert.match(changelog, /- TASK-700 \(feature\) — Tarea de prueba de finish \(2026-09-07\)/);
+
+    const index = await readFile(result.indexPath, 'utf8');
+    assert.match(index, /- TASK-700 — Tarea de prueba de finish · etiquetas: cli, gitflow/);
+    assert.match(index, /tareas\/04-terminadas\/TASK-700\//);
+
+    const board = await readFile(result.boardPath, 'utf8');
+    assert.match(board, /Generado automaticamente por taskctl finish el 2026-09-07/);
+    assert.match(board, /TASK-700/);
+  });
+});
+
+test('taskctl finish (fix): usa merge-fix-to-develop.sh', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-701', tipo: 'fix', rama: 'fix/task-701-prueba-fix' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    await runFinishCommand(tareasRoot, ['TASK-701'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.match(git(['log', '--oneline'], repoRoot), /merge\(fix\): fix\/task-701-prueba-fix -> develop/);
+    const read = await readTareaFile(tareasRoot, 'TASK-701');
+    assert.equal(read?.task.estado, 'terminada');
+  });
+});
+
+test('taskctl finish (hotfix): merge a main con tag y backmerge real a develop', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-702', tipo: 'hotfix', rama: 'hotfix/task-702-urgente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-702'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.mainBranch, 'main');
+    // Merge a main + tag + backmerge, todo leido de Git.
+    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\): hotfix\/task-702-urgente -> main/);
+    assert.equal(git(['tag', '--list', 'task-702-urgente'], repoRoot).trim(), 'task-702-urgente');
+    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+
+    // La tarea quedo terminada en el working tree de develop.
+    const read = await readTareaFile(tareasRoot, 'TASK-702');
+    assert.equal(read?.task.estado, 'terminada');
+  });
+});
+
+test('taskctl finish (release): merge a main con tag y backmerge real a develop', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-703', tipo: 'release', rama: 'release/task-703-cierre' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-703'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.mainBranch, 'main');
+    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(release\): release\/task-703-cierre -> main/);
+    assert.equal(git(['tag', '--list', 'task-703-cierre'], repoRoot).trim(), 'task-703-cierre');
+    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
+    const read = await readTareaFile(tareasRoot, 'TASK-703');
+    assert.equal(read?.task.estado, 'terminada');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
deleted file mode 100644
index 1ccc80c..0000000
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
+++ /dev/null
@@ -1,692 +0,0 @@
-/**
- * Test de integracion real (no mocks) para taskctl finish (TASK-014):
- * repos Git temporales de verdad, los scripts merge-*.sh tal cual
- * estan en el repo, y evidencia leida de Git (merges, tags, ancestria)
- * en vez de fiarse de lo que devuelve el comando. Mismo espiritu que
- * review.test.ts (TASK-013).
- */
-import { test } from 'node:test';
-import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
-import { tmpdir } from 'node:os';
-import path from 'node:path';
-import { fileURLToPath } from 'node:url';
-import { spawnSync } from 'node:child_process';
-import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
-import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
-import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
-import { StateMachineError } from '../../src/core/state-machine.js';
-import type { Task } from '../../src/core/task.js';
-
-const HERE = path.dirname(fileURLToPath(import.meta.url));
-const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
-
-function sampleTask(overrides: Partial<Task> = {}): Task {
-  return {
-    id: 'TASK-700',
-    titulo: 'Tarea de prueba de finish',
-    tipo: 'feature',
-    sprint: 2,
-    etiquetas: ['cli', 'gitflow'],
-    complejidad: 'simple',
-    modelo_sugerido: 'sonnet',
-    estado: 'en-revision',
-    plan_aprobado: true,
-    rama: 'feature/task-700-prueba-finish',
-    asignado_a: null,
-    agente_revisor: 'general-purpose',
-    skills_recomendados: [],
-    regla_seleccion_skill: null,
-    ultimo_commit_revisado: null,
-    revision_codex: false,
-    creado: '2026-09-05',
-    actualizado: '2026-09-05',
-    dependencias: [],
-    ...overrides,
-  };
-}
-
-function git(args: string[], cwd: string): string {
-  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
-  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
-  return result.stdout;
-}
-
-/**
- * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
- * lo que el mismo escribe, asi que llamar a esto justo despues de un
- * comando puede no tener ya nada que registrar: `git commit` sale 1
- * con "nothing to commit" y el assert de `git()` lo daria por fallo
- * del test. Se commitea solo si queda algo — y que no quede es
- * exactamente la senal de que el auto-commit hizo su trabajo.
- */
-function commitAll(repoRoot: string, message: string): void {
-  git(['add', '-A'], repoRoot);
-  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
-  git(['commit', '-q', '-m', message], repoRoot);
-}
-
-// Repo base montado una vez por fichero y copiado en cada test
-// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
-const withTempRepo: ConRepo = plantillaRepo('taskctl-finish-', async (repoRoot) => {
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
-    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'inicial'], repoRoot);
-    git(['checkout', '-q', '-b', 'develop'], repoRoot);
-});
-
-const VEREDICTO_APROBADO = '- Veredicto: aprobada (revisada por el agente independiente)\n';
-
-/**
- * Deja la tarea en-revision en su rama con el informe de la ronda 1
- * commiteado, como la habria dejado el ciclo start -> review + el
- * revisor volcando su veredicto. `base` es la rama de la que nace la
- * rama de trabajo (develop para feature/fix/release, main para hotfix).
- */
-async function setupTaskEnRevision(
-  repoRoot: string,
-  tareasRoot: string,
-  task: Task,
-  opts: { base?: string; veredicto?: string; conCodex?: string } = {}
-): Promise<void> {
-  const base = opts.base ?? 'develop';
-  git(['checkout', '-q', '-b', task.rama, base], repoRoot);
-  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
-  await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
-  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
-  await mkdir(revisionDir, { recursive: true });
-  await writeFile(
-    path.join(revisionDir, 'informe-revision-1.md'),
-    `# Informe de revision — ${task.id} (ronda 1)\n\n${opts.veredicto ?? VEREDICTO_APROBADO}`,
-    'utf8'
-  );
-  if (opts.conCodex !== undefined) {
-    await writeFile(
-      path.join(revisionDir, 'informe-codex-1.md'),
-      `# Informe Codex — ${task.id}\n\n${opts.conCodex}`,
-      'utf8'
-    );
-  }
-  commitAll(repoRoot, `feat(${task.id}): trabajo revisado`);
-}
-
-test('veredictoAprobado: fail-closed con PENDIENTE, cambios-solicitados o sin linea de veredicto', () => {
-  assert.equal(veredictoAprobado('- Veredicto: aprobada\n'), true);
-  assert.equal(veredictoAprobado('- Veredicto: APROBADA (sin hallazgos)\n'), true);
-  assert.equal(veredictoAprobado('- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n'), false);
-  assert.equal(veredictoAprobado('- Veredicto: cambios-solicitados\n'), false);
-  assert.equal(veredictoAprobado('informe sin veredicto\n'), false);
-  assert.equal(veredictoAprobado(''), false);
-});
-
-test('veredictoAprobado: NO es fail-open ante negaciones ni lineas multiples (hallazgo CRITICO de revision)', () => {
-  // La negacion mas natural en espanol debe rechazar, no aprobar.
-  assert.equal(veredictoAprobado('- Veredicto: no aprobada (faltan tests)\n'), false);
-  assert.equal(veredictoAprobado('- Veredicto: NO aprobada\n'), false);
-  assert.equal(veredictoAprobado('- Veredicto: rechazada (aprobada seria prematuro)\n'), false);
-  // El veredicto del informe de TASK-013 (referencia real): la palabra
-  // "independiente" no debe confundirse con "pendiente".
-  assert.equal(
-    veredictoAprobado('- Veredicto: aprobada (revisada por el agente independiente)\n'),
-    true
-  );
-  // Varias lineas Veredicto: TODAS deben aprobar (placeholder de la
-  // plantilla sin borrar => rechazo; aprobada + cambios => rechazo).
-  assert.equal(
-    veredictoAprobado('- Veredicto: PENDIENTE (...)\n\ntexto\n\n- Veredicto: aprobada\n'),
-    false
-  );
-  assert.equal(
-    veredictoAprobado('- Veredicto: aprobada\n\n- Veredicto: cambios-solicitados\n'),
-    false
-  );
-});
-
-test('taskctl finish (feature): merge a develop, tarea a 04-terminadas y CHANGELOG/INDEX/BOARD renderizados', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-
-    const result = await runFinishCommand(tareasRoot, ['TASK-700'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.baseBranch, 'develop');
-    assert.equal(result.mainBranch, null);
-    assert.match(result.filePath, /04-terminadas[/\\]TASK-700[/\\]tarea\.md$/);
-
-    // Evidencia real de Git.
-    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
-    assert.match(git(['log', '--oneline'], repoRoot), /merge\(feature\): feature\/task-700-prueba-finish -> develop/);
-
-    const read = await readTareaFile(tareasRoot, 'TASK-700');
-    assert.equal(read?.task.estado, 'terminada');
-    assert.equal(read?.task.actualizado, '2026-09-07');
-    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-700')));
-
-    const changelog = await readFile(result.changelogPath, 'utf8');
-    assert.match(changelog, /## Sin publicar/);
-    assert.match(changelog, /- TASK-700 \(feature\) — Tarea de prueba de finish \(2026-09-07\)/);
-
-    const index = await readFile(result.indexPath, 'utf8');
-    assert.match(index, /- TASK-700 — Tarea de prueba de finish · etiquetas: cli, gitflow/);
-    assert.match(index, /tareas\/04-terminadas\/TASK-700\//);
-
-    const board = await readFile(result.boardPath, 'utf8');
-    assert.match(board, /Generado automaticamente por taskctl finish el 2026-09-07/);
-    assert.match(board, /TASK-700/);
-  });
-});
-
-test('taskctl finish (fix): usa merge-fix-to-develop.sh', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-701', tipo: 'fix', rama: 'fix/task-701-prueba-fix' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-
-    await runFinishCommand(tareasRoot, ['TASK-701'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.match(git(['log', '--oneline'], repoRoot), /merge\(fix\): fix\/task-701-prueba-fix -> develop/);
-    const read = await readTareaFile(tareasRoot, 'TASK-701');
-    assert.equal(read?.task.estado, 'terminada');
-  });
-});
-
-test('taskctl finish (hotfix): merge a main con tag y backmerge real a develop', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-702', tipo: 'hotfix', rama: 'hotfix/task-702-urgente' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
-
-    const result = await runFinishCommand(tareasRoot, ['TASK-702'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.mainBranch, 'main');
-    // Merge a main + tag + backmerge, todo leido de Git.
-    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\): hotfix\/task-702-urgente -> main/);
-    assert.equal(git(['tag', '--list', 'task-702-urgente'], repoRoot).trim(), 'task-702-urgente');
-    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
-    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
-
-    // La tarea quedo terminada en el working tree de develop.
-    const read = await readTareaFile(tareasRoot, 'TASK-702');
-    assert.equal(read?.task.estado, 'terminada');
-  });
-});
-
-test('taskctl finish (release): merge a main con tag y backmerge real a develop', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-703', tipo: 'release', rama: 'release/task-703-cierre' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-
-    const result = await runFinishCommand(tareasRoot, ['TASK-703'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.mainBranch, 'main');
-    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(release\): release\/task-703-cierre -> main/);
-    assert.equal(git(['tag', '--list', 'task-703-cierre'], repoRoot).trim(), 'task-703-cierre');
-    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
-    const read = await readTareaFile(tareasRoot, 'TASK-703');
-    assert.equal(read?.task.estado, 'terminada');
-  });
-});
-
-test('taskctl finish: colision de IDs entre main y develop se detecta ANTES de mergear', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // develop ya tiene OTRO TASK-704 (titulo distinto), nacido de su
-    // propio linaje.
-    const otraTarea = sampleTask({
-      id: 'TASK-704',
-      titulo: 'Otra tarea distinta con el mismo numero',
-      estado: 'planificada',
-      rama: 'feature/task-704-otra',
-    });
-    await writeTareaFile(tareasRoot, otraTarea, '');
-    commitAll(repoRoot, 'otra TASK-704 en develop');
-
-    // El hotfix, nacido de main (que no ve tareas/ de develop),
-    // recalculo el mismo ID para una tarea diferente.
-    const task = sampleTask({ id: 'TASK-704', tipo: 'hotfix', rama: 'hotfix/task-704-urgente' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-704'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof FinishCommandError);
-        assert.match((e as Error).message, /colision de IDs/);
-        assert.match((e as Error).message, /Renumera/);
-        return true;
-      }
-    );
-
-    // Nada se mergeo: main sigue sin el merge y no hay tag.
-    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
-    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
-    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), task.rama);
-    const read = await readTareaFile(tareasRoot, 'TASK-704');
-    assert.equal(read?.task.estado, 'en-revision');
-  });
-});
-
-test('taskctl finish (hotfix): tras un conflicto de backmerge resuelto a mano, el reintento cierra por el camino idempotente sin chocar con el tag (hallazgo IMPORTANTE de revision)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Conflicto real: el hotfix y develop tocan la misma linea.
-    git(['checkout', '-q', 'main'], repoRoot);
-    await writeFile(path.join(repoRoot, 'app.txt'), 'linea original\n', 'utf8');
-    commitAll(repoRoot, 'app en main');
-    git(['checkout', '-q', 'develop'], repoRoot);
-    git(['merge', '-q', '--ff-only', 'main'], repoRoot);
-    await writeFile(path.join(repoRoot, 'app.txt'), 'version de develop\n', 'utf8');
-    commitAll(repoRoot, 'app cambiada en develop');
-
-    const task = sampleTask({ id: 'TASK-712', tipo: 'hotfix', rama: 'hotfix/task-712-conflicto' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
-    await writeFile(path.join(repoRoot, 'app.txt'), 'version del hotfix\n', 'utf8');
-    commitAll(repoRoot, 'app cambiada en el hotfix');
-
-    // Primer intento: merge a main + tag OK, backmerge en conflicto.
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-712'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      FinishCommandError
-    );
-    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
-    assert.equal(git(['tag', '--list', 'task-712-conflicto'], repoRoot).trim(), 'task-712-conflicto');
-
-    // La persona resuelve el conflicto del backmerge a mano y comitea.
-    await writeFile(path.join(repoRoot, 'app.txt'), 'version reconciliada\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '--no-edit'], repoRoot);
-
-    // Reintento: NO se reejecuta el script (moriria en el tag
-    // duplicado) — el camino idempotente cierra la tarea.
-    const result = await runFinishCommand(tareasRoot, ['TASK-712'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    assert.match(result.filePath, /04-terminadas[/\\]TASK-712/);
-    const read = await readTareaFile(tareasRoot, 'TASK-712');
-    assert.equal(read?.task.estado, 'terminada');
-    // El tag sigue siendo uno (no hubo segundo intento de crearlo).
-    assert.equal(git(['tag', '--list'], repoRoot).trim(), 'task-712-conflicto');
-  });
-});
-
-test('taskctl finish (hotfix): mismo ID y MISMO titulo en linaje divergente tambien aborta antes de mergear (hallazgo IMPORTANTE de revision: add+add duplicaria la carpeta)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // develop tiene la "misma" tarea (mismo id y titulo) pero anadida
-    // por su propio linaje, sin ancestro comun con la rama del hotfix.
-    const copiaDevelop = sampleTask({
-      id: 'TASK-713',
-      estado: 'planificada',
-      rama: 'hotfix/task-713-urgente',
-    });
-    await writeTareaFile(tareasRoot, copiaDevelop, '');
-    commitAll(repoRoot, 'TASK-713 en develop');
-
-    const task = sampleTask({ id: 'TASK-713', tipo: 'hotfix', rama: 'hotfix/task-713-urgente' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-713'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof FinishCommandError);
-        assert.match((e as Error).message, /linaje|ancestro comun|add\+add/);
-        return true;
-      }
-    );
-    // Nada mergeado: sin tag y main sin merge.
-    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
-    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
-  });
-});
-
-test('taskctl finish (feature): el caso normal — la tarea vive en develop en una carpeta anterior del ciclo — NO dispara la colision de linaje', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Flujo real del metodo: la tarea nace en develop (01-en-diseno)...
-    const enDiseno = sampleTask({
-      id: 'TASK-714',
-      estado: 'en-diseno',
-      rama: 'feature/task-714-normal',
-    });
-    await writeTareaFile(tareasRoot, enDiseno, '');
-    commitAll(repoRoot, 'TASK-714 en diseno en develop');
-
-    // ...y su rama (que SI comparte ese commit como ancestro) la mueve
-    // por el ciclo hasta en-revision.
-    const task = sampleTask({ id: 'TASK-714', estado: 'en-revision', rama: 'feature/task-714-normal' });
-    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-    git(['rm', '-r', '-q', 'tareas/01-en-diseno/TASK-714'], repoRoot);
-    await writeTareaFile(tareasRoot, task, '');
-    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-714', 'revision');
-    await mkdir(revisionDir, { recursive: true });
-    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), VEREDICTO_APROBADO, 'utf8');
-    commitAll(repoRoot, 'TASK-714 revisada en su rama');
-
-    const result = await runFinishCommand(tareasRoot, ['TASK-714'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    assert.match(result.filePath, /04-terminadas[/\\]TASK-714/);
-    // Y sin duplicados en develop: solo la copia terminada.
-    const read = await readTareaFile(tareasRoot, 'TASK-714');
-    assert.equal(read?.task.estado, 'terminada');
-    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-714')));
-    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-714')));
-  });
-});
-
-test('taskctl finish: desde una rama que no ve la tarea, el mensaje dice cambiarse a la rama (no usar import) — hallazgo MENOR de revision', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // La tarea existe solo en su rama; nosotros estamos en develop.
-    const task = sampleTask({ id: 'TASK-715', rama: 'feature/task-715-otra' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-    git(['checkout', '-q', 'develop'], repoRoot);
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-715'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof FinishCommandError);
-        assert.match((e as Error).message, /cambiate a esa rama/);
-        assert.doesNotMatch((e as Error).message, /import/);
-        return true;
-      }
-    );
-  });
-});
-
-test('taskctl finish: un CHANGELOG artesanal sin "Sin publicar" recibe la seccion ARRIBA, no al final (hallazgo MENOR de revision)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeFile(
-      path.join(repoRoot, 'CHANGELOG.md'),
-      '# Historial\n\n## v1.2.0\n\n- cosa nueva\n\n## v1.1.0\n\n- cosa vieja\n',
-      'utf8'
-    );
-    const task = sampleTask({ id: 'TASK-716', rama: 'feature/task-716-changelog' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-
-    await runFinishCommand(tareasRoot, ['TASK-716'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
-    assert.match(changelog, /TASK-716/);
-    assert.ok(
-      changelog.indexOf('## Sin publicar') < changelog.indexOf('## v1.2.0'),
-      'la seccion nueva debe quedar por encima de las versiones viejas'
-    );
-    assert.match(changelog, /- cosa vieja/);
-  });
-});
-
-test('taskctl finish: repetirlo sobre una tarea terminada dice que ya esta terminada, sin aconsejar taskctl review', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-717', rama: 'feature/task-717-doble' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-    await runFinishCommand(tareasRoot, ['TASK-717'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    commitAll(repoRoot, 'cierre de TASK-717');
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-717'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof StateMachineError);
-        assert.match((e as Error).message, /ya esta terminada/);
-        assert.doesNotMatch((e as Error).message, /taskctl review/);
-        return true;
-      }
-    );
-  });
-});
-
-test('taskctl finish: rechaza sin revision aprobada (veredicto PENDIENTE), sin tocar Git', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-705', rama: 'feature/task-705-pendiente' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task, {
-      veredicto: '- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n',
-    });
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-705'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      StateMachineError
-    );
-
-    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
-    const read = await readTareaFile(tareasRoot, 'TASK-705');
-    assert.equal(read?.task.estado, 'en-revision');
-  });
-});
-
-test('taskctl finish: con revision_codex exige informe de Codex aprobado (rechaza sin el, pasa con el)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({
-      id: 'TASK-706',
-      rama: 'feature/task-706-codex',
-      revision_codex: true,
-    });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof StateMachineError);
-        assert.match((e as Error).message, /revision_codex/);
-        return true;
-      }
-    );
-
-    // Con el informe de Codex aprobado (convencion de TASK-020), pasa.
-    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-706', 'revision');
-    await writeFile(
-      path.join(revisionDir, 'informe-codex-1.md'),
-      `# Informe Codex\n\n${VEREDICTO_APROBADO}`,
-      'utf8'
-    );
-    commitAll(repoRoot, 'informe codex aprobado');
-
-    const result = await runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    assert.match(result.filePath, /04-terminadas/);
-  });
-});
-
-test('taskctl finish: rechaza una tarea que no esta en-revision, con el comando requerido en el mensaje', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-707', estado: 'en-curso', rama: 'feature/task-707-curso' });
-    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-    await writeTareaFile(tareasRoot, task, '');
-    commitAll(repoRoot, 'tarea en curso');
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-707'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof StateMachineError);
-        assert.match((e as Error).message, /taskctl review/);
-        return true;
-      }
-    );
-  });
-});
-
-test('taskctl finish: rechaza con el workspace sucio, sin invocar el script', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-708', rama: 'feature/task-708-sucio' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-708'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      FinishCommandError
-    );
-
-    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
-  });
-});
-
-test('taskctl finish: si el script falla, la tarea no se mueve ni se renderiza nada', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-709', rama: 'feature/task-709-roto' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, task);
-
-    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-finish-'));
-    await writeFile(
-      path.join(brokenScriptsDir, 'merge-feature-to-develop.sh'),
-      '#!/usr/bin/env bash\nexit 7\n',
-      'utf8'
-    );
-
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, ['TASK-709'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: brokenScriptsDir,
-        }),
-      FinishCommandError
-    );
-
-    const read = await readTareaFile(tareasRoot, 'TASK-709');
-    assert.equal(read?.task.estado, 'en-revision');
-    await assert.rejects(() => stat(path.join(repoRoot, 'CHANGELOG.md')));
-    await assert.rejects(() => stat(path.join(repoRoot, 'docs', 'BOARD.md')));
-    await rm(brokenScriptsDir, { recursive: true, force: true });
-  });
-});
-
-test('taskctl finish: una ronda fragmentada por dominio (N informes) exige que TODOS aprueben antes de cerrar (TASK-018)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-720', rama: 'feature/task-720-fragmentada' });
-    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish con revision fragmentada.\n');
-    await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
-    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
-    await mkdir(revisionDir, { recursive: true });
-    // Misma ronda (1), dos revisores de dominio: uno aprueba, el otro
-    // sigue con el veredicto de la plantilla sin sustituir.
-    await writeFile(
-      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
-      `# Informe de revision — ${task.id} (ronda 1)\n\n${VEREDICTO_APROBADO}`,
-      'utf8'
-    );
-    await writeFile(
-      path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'),
-      `# Informe de revision — ${task.id} (ronda 1)\n\n` +
-        '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados")\n',
-      'utf8'
-    );
-    commitAll(repoRoot, `feat(${task.id}): revision fragmentada, un dominio pendiente`);
-
-    // Con un informe de dominio todavia PENDIENTE, "finish" rechaza —
-    // aunque el otro informe de la MISMA ronda ya apruebe.
-    await assert.rejects(
-      () =>
-        runFinishCommand(tareasRoot, [task.id], '2026-09-12', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      StateMachineError
-    );
-    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
-    const tras1 = await readTareaFile(tareasRoot, task.id);
-    assert.equal(tras1?.task.estado, 'en-revision');
-
-    // Se aprueba el que faltaba (misma ronda, mismo N): ahora SI cierra.
-    await writeFile(
-      path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'),
-      `# Informe de revision — ${task.id} (ronda 1)\n\n${VEREDICTO_APROBADO}`,
-      'utf8'
-    );
-    commitAll(repoRoot, 'segundo informe de dominio tambien aprobado');
-
-    const result = await runFinishCommand(tareasRoot, [task.id], '2026-09-12', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    assert.match(result.filePath, /04-terminadas[/\\]TASK-720/);
-    const tras2 = await readTareaFile(tareasRoot, task.id);
-    assert.equal(tras2?.task.estado, 'terminada');
-  });
-});
-
-test('taskctl finish: dos tareas terminadas acumulan entradas en CHANGELOG e INDEX sin pisarse', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const t1 = sampleTask({ id: 'TASK-710', rama: 'feature/task-710-una' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, t1);
-    await runFinishCommand(tareasRoot, ['TASK-710'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    commitAll(repoRoot, 'cierre de TASK-710');
-
-    const t2 = sampleTask({ id: 'TASK-711', titulo: 'Segunda tarea', rama: 'feature/task-711-dos' });
-    await setupTaskEnRevision(repoRoot, tareasRoot, t2);
-    await runFinishCommand(tareasRoot, ['TASK-711'], '2026-09-08', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
-    assert.match(changelog, /TASK-710/);
-    assert.match(changelog, /TASK-711/);
-    // La mas reciente queda arriba (insercion bajo la cabecera).
-    assert.ok(changelog.indexOf('TASK-711') < changelog.indexOf('TASK-710'));
-
-    const index = await readFile(path.join(repoRoot, 'docs', 'INDEX.md'), 'utf8');
-    assert.match(index, /TASK-710/);
-    assert.match(index, /Segunda tarea/);
-
-    // El board refleja el estado final: ambas terminadas.
-    const board = await readFile(path.join(repoRoot, 'docs', 'BOARD.md'), 'utf8');
-    assert.match(board, /TASK-710/);
-    assert.match(board, /TASK-711/);
-  });
-});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-camino.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-camino.test.ts
new file mode 100644
index 0000000..51a273b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-camino.test.ts
@@ -0,0 +1,137 @@
+/**
+ * Test de integracion real (no mocks) para taskctl review (TASK-013):
+ * repos Git temporales de verdad, los scripts update-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (rama activa, merge
+ * commits, ancestria) en vez de fiarse de lo que devuelve el comando.
+ * Mismo espiritu que start.test.ts (TASK-009).
+ */
+// Parte de los tests de review (ver test/helpers/review-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  setupTaskEnCurso,
+  advanceDevelop,
+  escribirFichero,
+  rutaTareaMd,
+  setupTaskEnCursoSoloTarea,
+} from '../helpers/review-fixtures.js';
+
+test('taskctl review: camino feliz sin origin — update real, evidencia de merge, mueve a 03-en-revision y genera peticion + informe', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-600');
+    assert.equal(result.baseBranch, 'develop');
+    assert.equal(result.ronda, 1);
+    assert.match(result.filePath, /03-en-revision[/\\]TASK-600[/\\]tarea\.md$/);
+
+    // Evidencia real de Git, no solo el valor devuelto.
+    const branch = git(['branch', '--show-current'], repoRoot).trim();
+    assert.equal(branch, task.rama);
+    const log = git(['log', '--oneline'], repoRoot);
+    assert.match(log, /update\(feature\): develop -> feature\/task-600-prueba-review/);
+    const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', 'develop', 'HEAD'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.equal(ancestor.status, 0, 'develop deberia ser antepasado de HEAD tras el update');
+
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-revision');
+    assert.equal(read?.task.actualizado, '2026-09-06');
+    // ultimo_commit_revisado NO se toca al generar la peticion (16.3:
+    // se actualiza cuando la revision TERMINA, no cuando empieza).
+    assert.equal(read?.task.ultimo_commit_revisado, null);
+    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600')));
+
+    // La peticion contiene el diff real (el cambio que vino de develop
+    // y el trabajo de la rama) y el SHA revisado.
+    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
+    assert.doesNotMatch(peticion, /cambio-develop\.txt/);
+    assert.match(peticion, /trabajo\.txt/);
+    assert.ok(peticion.includes(result.commitRevisado));
+    // Desde TASK-030 (item C2), "review" commitea la peticion y el
+    // scaffold del informe, asi que HEAD avanza DESPUES de calcular
+    // commitRevisado: el commit revisado es el padre de HEAD, no HEAD.
+    // Y es lo correcto, no un efecto colateral: lo que el revisor tiene
+    // que revisar es el codigo de la tarea, no el commit que contiene
+    // la peticion de revision de si mismo.
+    assert.equal(result.commitRevisado, git(['rev-parse', 'HEAD~1'], repoRoot).trim());
+    assert.equal(
+      git(['log', '--format=%s', '-1'], repoRoot).trim(),
+      'chore(TASK-600): peticion de revision ronda 1'
+    );
+
+    const informe = await readFile(result.informes[0]!.informePath, 'utf8');
+    assert.match(informe, /Informe de revision — TASK-600 \(ronda 1\)/);
+    assert.match(informe, /PENDIENTE/);
+  });
+});
+
+test('taskctl review: con origin (bare real) integra un cambio que solo existia en el remoto', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await mkdtemp(path.join(tmpdir(), 'taskctl-review-origin-'));
+    const otherClone = await mkdtemp(path.join(tmpdir(), 'taskctl-review-clone-'));
+    try {
+      git(['init', '-q', '--bare', origin], origin);
+      git(['remote', 'add', 'origin', origin], repoRoot);
+      git(['push', '-q', 'origin', 'main', 'develop'], repoRoot);
+
+      const task = sampleTask({ id: 'TASK-601', rama: 'feature/task-601-con-origin' });
+      await setupTaskEnCurso(repoRoot, tareasRoot, task);
+
+      // Otro colaborador avanza develop directamente en el remoto.
+      git(['clone', '-q', '--branch', 'develop', origin, 'clon'], otherClone);
+      const clonDir = path.join(otherClone, 'clon');
+      git(['config', 'user.email', 'otro@example.com'], clonDir);
+      git(['config', 'user.name', 'Otro'], clonDir);
+      await writeFile(path.join(clonDir, 'remoto.txt'), 'cambio remoto\n', 'utf8');
+      git(['add', '-A'], clonDir);
+      git(['commit', '-q', '-m', 'cambio remoto en develop'], clonDir);
+      git(['push', '-q', 'origin', 'develop'], clonDir);
+
+      const result = await runReviewCommand(tareasRoot, ['TASK-601'], '2026-09-06', {
+        repoCwd: repoRoot,
+        scriptsDir: SCRIPTS_DIR,
+      });
+
+      // El cambio que SOLO existia en origin/develop llego a la rama.
+      await stat(path.join(repoRoot, 'remoto.txt'));
+      const log = git(['log', '--oneline'], repoRoot);
+      assert.match(log, /update\(feature\): develop -> feature\/task-601-con-origin/);
+      const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
+      assert.doesNotMatch(peticion, /remoto\.txt/);
+      const read = await readTareaFile(tareasRoot, 'TASK-601');
+      assert.equal(read?.task.estado, 'en-revision');
+    } finally {
+      await rm(origin, { recursive: true, force: true });
+      await rm(otherClone, { recursive: true, force: true });
+    }
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-dominios.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-dominios.test.ts
new file mode 100644
index 0000000..c065358
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-dominios.test.ts
@@ -0,0 +1,239 @@
+/**
+ * Test de integracion real (no mocks) para taskctl review (TASK-013):
+ * repos Git temporales de verdad, los scripts update-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (rama activa, merge
+ * commits, ancestria) en vez de fiarse de lo que devuelve el comando.
+ * Mismo espiritu que start.test.ts (TASK-009).
+ */
+// Parte de los tests de review (ver test/helpers/review-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  setupTaskEnCurso,
+  advanceDevelop,
+  escribirFichero,
+  rutaTareaMd,
+  setupTaskEnCursoSoloTarea,
+} from '../helpers/review-fixtures.js';
+
+// --- TASK-018: enrutado de revisor por diff real, fragmentado por dominio ---
+//
+// Las rutas de fichero de estos tests se copian EXACTAMENTE de las tablas
+// RUTAS_LEGITIMAS/RUTAS_AJENAS de test/skills/revisores.test.ts: esas ya
+// prueban a que revisor (o a ninguno) llega cada ruta contra las skills
+// reales instaladas con el plugin. Repetir aqui esa clasificacion con
+// rutas propias abriria una segunda fuente de verdad que podria divergir
+// de la primera; reusar las mismas rutas cierra esa grieta.
+
+test('taskctl review: un diff que toca 1 dominio (java) genera 1 peticion con el agente de ese dominio, no task.agente_revisor', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-620', rama: 'feature/task-620-un-dominio' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {}\n'
+    );
+    commitAll(repoRoot, 'anade servicio Java');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-620'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // Expectativa cambiada en TASK-034: tarea.md esta en el diff (toda
+    // tarea lo commitea en su rama), pero tareas/** ya no se embebe ni se
+    // clasifica (excluir_de_revision por defecto). Antes le tocaba al
+    // generico una peticion entera solo para tarea.md; ahora no se lanza:
+    // un agente revisor menos por tarea de un solo dominio.
+    assert.equal(result.informes.length, 1);
+    const grupo = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
+    assert.ok(grupo !== undefined, 'deberia haber un grupo para java-spring-reviewer');
+    assert.notEqual(grupo.revisor, task.agente_revisor);
+    assert.match(grupo.peticionPath, /peticion-revision-1-java-spring-reviewer\.md$/);
+    assert.match(grupo.informePath, /informe-revision-1-java-spring-reviewer\.md$/);
+    assert.deepEqual(grupo.ficheros, ['src/main/java/com/acme/UserService.java']);
+
+    const peticion = await readFile(grupo.peticionPath, 'utf8');
+    // TASK-047: agente y skill por separado, y el modelo de la tarea.
+    assert.match(peticion, /Skill revisora a cargar: java-spring-reviewer/);
+    assert.ok(
+      peticion.includes(`Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})`),
+      peticion
+    );
+    assert.equal(result.agente, task.agente_revisor);
+    assert.equal(result.modelo, task.modelo_sugerido);
+    assert.match(peticion, /UserService\.java/);
+    // Desde TASK-034 tarea.md aparece en el --stat de excluidos, pero su
+    // diff no se embebe.
+    assert.doesNotMatch(peticion, /diff --git a\/tareas\//);
+
+    assert.equal(
+      result.informes.find((g) => g.revisor === 'code-quality-reviewer'),
+      undefined,
+      'tarea.md solo ya no genera una peticion al generico (TASK-034)'
+    );
+  });
+});
+
+test('taskctl review: un diff que toca 2 dominios bajo el umbral genera 2 peticiones, cada una solo con los ficheros de su dominio', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-621', rama: 'feature/task-621-dos-dominios' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {}\n'
+    );
+    await escribirFichero(
+      repoRoot,
+      'src/app/user-profile/user-profile.component.ts',
+      'export class UserProfileComponent {}\n'
+    );
+    commitAll(repoRoot, 'anade servicio Java y componente Angular');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-621'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // 2 grupos de dominio. Desde TASK-034 ya no hay un tercero para
+    // tarea.md: tareas/** se excluye del diff y de la clasificacion.
+    assert.equal(result.informes.length, 2);
+    const revisores = result.informes.map((g) => g.revisor).sort();
+    assert.deepEqual(revisores, ['angular-vue-reviewer', 'java-spring-reviewer']);
+
+    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
+    const grupoAngular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer')!;
+
+    assert.deepEqual(grupoJava.ficheros, ['src/main/java/com/acme/UserService.java']);
+    assert.deepEqual(grupoAngular.ficheros, ['src/app/user-profile/user-profile.component.ts']);
+
+    const peticionJava = await readFile(grupoJava.peticionPath, 'utf8');
+    assert.match(peticionJava, /UserService\.java/);
+    assert.doesNotMatch(peticionJava, /user-profile\.component\.ts/);
+
+    const peticionAngular = await readFile(grupoAngular.peticionPath, 'utf8');
+    assert.match(peticionAngular, /user-profile\.component\.ts/);
+    assert.doesNotMatch(peticionAngular, /UserService\.java/);
+  });
+});
+
+test('taskctl review: un diff que toca EXACTAMENTE 3 dominios sigue fragmentando en 3 (umbral inclusive)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-622', rama: 'feature/task-622-tres-dominios' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {}\n'
+    );
+    await escribirFichero(
+      repoRoot,
+      'src/app/user-profile/user-profile.component.ts',
+      'export class UserProfileComponent {}\n'
+    );
+    await escribirFichero(repoRoot, 'src/Exporter/IfcExporter.cs', 'class IfcExporter {}\n');
+    commitAll(repoRoot, 'toca los tres dominios de una vez');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-622'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // Con el catalogo real (3 revisores de dominio, umbral_dominios: 3),
+    // exactamente 3 dominios SIGUE fragmentando: no cae al generico. Los
+    // 3 dominios detectados (lo que fija el criterio del umbral). Desde
+    // TASK-034 sin generico para tarea.md: tareas/** ya no se clasifica.
+    assert.equal(result.informes.length, 3);
+    const revisores = result.informes.map((g) => g.revisor).sort();
+    assert.deepEqual(revisores, [
+      'angular-vue-reviewer',
+      'csharp-autocad-ifc-reviewer',
+      'java-spring-reviewer',
+    ]);
+  });
+});
+
+test('taskctl review: ficheros que no casan ningun dominio, con 1-3 dominios ya detectados, los cubre TAMBIEN el generico', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-623', rama: 'feature/task-623-mas-generico' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {}\n'
+    );
+    // Ruta ajena congelada en RUTAS_AJENAS (revisores.test.ts): no casa
+    // con ningun revisor de dominio. Desde TASK-034 es el UNICO fichero
+    // del generico: tarea.md ya no se clasifica.
+    await escribirFichero(repoRoot, 'src/index.ts', 'export const arranque = 1;\n');
+    commitAll(repoRoot, 'servicio Java mas un fichero sin dominio');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-623'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.informes.length, 2);
+    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
+    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer');
+    assert.ok(grupoJava !== undefined, 'el fichero Java deberia tener su propio grupo');
+    assert.ok(
+      grupoGenerico !== undefined,
+      'los ficheros sin dominio (src/index.ts) deberia cubrirlos el generico, sin quedar sin revisor'
+    );
+    assert.deepEqual(grupoJava!.ficheros, ['src/main/java/com/acme/UserService.java']);
+    assert.deepEqual([...grupoGenerico!.ficheros], ['src/index.ts']);
+
+    const peticionGenerico = await readFile(grupoGenerico!.peticionPath, 'utf8');
+    assert.match(peticionGenerico, /src\/index\.ts/);
+    assert.doesNotMatch(peticionGenerico, /UserService\.java/);
+  });
+});
+
+test('taskctl review: un diff sin match de dominio (rutas ajenas y .md) sigue cayendo a un unico generico, igual que antes de TASK-018', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-624', rama: 'feature/task-624-sin-dominio' });
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    // NestJS: ruta congelada como ajena en RUTAS_AJENAS.
+    await escribirFichero(repoRoot, 'src/users/users.module.ts', 'export class UsersModule {}\n');
+    await escribirFichero(repoRoot, 'docs/nota.md', '# nota\n');
+    commitAll(repoRoot, 'ficheros sin ningun dominio');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-624'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.informes.length, 1);
+    assert.equal(result.informes[0]!.revisor, 'code-quality-reviewer');
+    // Sin sufijo de dominio: la convencion de siempre, sin fragmentar.
+    assert.match(result.informes[0]!.peticionPath, /peticion-revision-1\.md$/);
+    assert.match(result.informes[0]!.informePath, /informe-revision-1\.md$/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-guardas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-guardas.test.ts
new file mode 100644
index 0000000..5225e33
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-guardas.test.ts
@@ -0,0 +1,269 @@
+/**
+ * Test de integracion real (no mocks) para taskctl review (TASK-013):
+ * repos Git temporales de verdad, los scripts update-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (rama activa, merge
+ * commits, ancestria) en vez de fiarse de lo que devuelve el comando.
+ * Mismo espiritu que start.test.ts (TASK-009).
+ */
+// Parte de los tests de review (ver test/helpers/review-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  setupTaskEnCurso,
+  advanceDevelop,
+  escribirFichero,
+  rutaTareaMd,
+  setupTaskEnCursoSoloTarea,
+} from '../helpers/review-fixtures.js';
+
+test('taskctl review: rechaza una tarea que no esta en-curso, sin tocar Git ni carpetas', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ estado: 'en-diseno', plan_aprobado: true });
+    await writeTareaFile(tareasRoot, task, '');
+    commitAll(repoRoot, 'tarea en diseno');
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof StateMachineError);
+        assert.match((e as Error).message, /taskctl start/);
+        return true;
+      }
+    );
+
+    // Nada se movio ni se creo: sin 03-en-revision, sin revision/.
+    const branch = git(['branch', '--show-current'], repoRoot).trim();
+    assert.equal(branch, 'develop');
+    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision')));
+    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-600', 'revision')));
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-diseno');
+  });
+});
+
+test('taskctl review: rechaza con el workspace sucio, sin invocar el script', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      ReviewCommandError
+    );
+
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-curso');
+    // El update no llego a ejecutarse: develop no esta mergeada.
+    const log = git(['log', '--oneline'], repoRoot);
+    assert.doesNotMatch(log, /update\(feature\)/);
+  });
+});
+
+test('taskctl review: si el script falla (conflicto de merge real), no mueve la tarea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    // Conflicto real: la rama y develop cambian la MISMA linea del README.
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '');
+    await writeFile(path.join(repoRoot, 'README.md'), '# version de la rama\n', 'utf8');
+    commitAll(repoRoot, 'cambio en la rama');
+    git(['checkout', '-q', 'develop'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), '# version de develop\n', 'utf8');
+    commitAll(repoRoot, 'cambio en develop');
+    git(['checkout', '-q', task.rama], repoRoot);
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof ReviewCommandError);
+        assert.match((e as Error).message, /conflicto/);
+        return true;
+      }
+    );
+
+    // La tarea sigue en-curso y sin revision/ — el conflicto queda en
+    // el workspace para resolver a mano (comportamiento del script).
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-curso');
+    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision')));
+  });
+});
+
+test('taskctl review: script con exit 0 que NO mergea la base -> evidencia lo detecta y no mueve nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    await advanceDevelop(repoRoot, task.rama);
+
+    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-update-'));
+    await writeFile(
+      path.join(fakeScriptsDir, 'update-feature.sh'),
+      '#!/usr/bin/env bash\nexit 0\n',
+      'utf8'
+    );
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: fakeScriptsDir,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof ReviewCommandError);
+        assert.match((e as Error).message, /is-ancestor/);
+        return true;
+      }
+    );
+
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-curso');
+    await rm(fakeScriptsDir, { recursive: true, force: true });
+  });
+});
+
+test('taskctl review: una segunda ronda numera peticion e informe como -2 sin pisar la ronda anterior', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    // Restos commiteados de una ronda anterior (como los dejaria un
+    // ciclo review -> cambios-solicitados -> vuelta a en-curso).
+    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(path.join(revisionDir, 'peticion-revision-1.md'), 'ronda anterior\n', 'utf8');
+    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), 'informe anterior\n', 'utf8');
+    commitAll(repoRoot, 'restos de la ronda 1');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.ronda, 2);
+    assert.match(result.informes[0]!.peticionPath, /peticion-revision-2\.md$/);
+    // La ronda anterior sigue intacta (se movio con la carpeta).
+    const anterior = await readFile(
+      path.join(tareasRoot, '03-en-revision', 'TASK-600', 'revision', 'peticion-revision-1.md'),
+      'utf8'
+    );
+    // Normalizado: el fichero pasa por un checkout de Git durante el
+    // update y con core.autocrlf=true puede volver con CRLF.
+    assert.equal(anterior.split('\r\n').join('\n'), 'ronda anterior\n');
+  });
+});
+
+test('taskctl review: un diff mayor que 1 MB no revienta el comando (hallazgo IMPORTANTE de revision: ENOBUFS)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '');
+    // ~1.8 MB de contenido nuevo: por encima del maxBuffer default de
+    // spawnSync (1 MB), que era lo que mataba a git con ENOBUFS.
+    const lineas = Array.from({ length: 60_000 }, (_, i) => `linea generada numero ${i}`);
+    await writeFile(path.join(repoRoot, 'generado-grande.txt'), lineas.join('\n') + '\n', 'utf8');
+    commitAll(repoRoot, 'fichero grande en la rama');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
+    assert.match(peticion, /generado-grande\.txt/);
+    assert.ok(peticion.length > 1024 * 1024, 'la peticion deberia contener el diff completo');
+  });
+});
+
+test('taskctl review: si el movimiento de carpeta falla, la tarea sigue en-curso y la peticion ya escrita permite reintentar (hallazgo IMPORTANTE de revision: orden escritura-antes-de-mover)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    await advanceDevelop(repoRoot, task.rama);
+    // Fuerza el fallo del rename: la carpeta de destino ya existe
+    // (TaskFolderConflictError, fail-closed de moveTareaFile).
+    await mkdir(path.join(tareasRoot, '03-en-revision', 'TASK-600'), { recursive: true });
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => (e as Error).name === 'TaskFolderConflictError'
+    );
+
+    // La tarea NO cambio de estado (sin callejon sin salida), y la
+    // peticion quedo escrita en la carpeta actual: un reintento tras
+    // limpiar el conflicto usa la ronda siguiente sin pisar nada.
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-curso');
+    await stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision', 'peticion-revision-1.md'));
+  });
+});
+
+test('taskctl review: un diff cuyo contexto contiene vallas de backticks no rompe la peticion (hallazgo MENOR de revision)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    // El caso peligroso son las lineas de CONTEXTO del diff (prefijo
+    // espacio, tolerado por CommonMark como sangria de cierre): el doc
+    // con vallas de 4 backticks vive en develop y la rama modifica una
+    // linea adyacente para que las vallas salgan como contexto del hunk.
+    // Las lineas anadidas (+) no pueden cerrar una valla: un fichero
+    // nuevo no reproduce el bug.
+    const conVallas = 'texto\n' + '````\n' + 'bloque con valla de cuatro\n' + '````\n';
+    await writeFile(path.join(repoRoot, 'doc-con-vallas.md'), conVallas, 'utf8');
+    commitAll(repoRoot, 'doc con vallas en develop');
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '');
+    await writeFile(
+      path.join(repoRoot, 'doc-con-vallas.md'),
+      'texto modificado\n' + conVallas.slice('texto\n'.length),
+      'utf8'
+    );
+    commitAll(repoRoot, 'la rama modifica la linea adyacente a las vallas');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // La valla elegida supera a la mas larga del contenido embebido:
+    // el bloque del diff no puede cerrarse antes de tiempo.
+    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
+    assert.match(peticion, /`````diff/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-rutas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-rutas.test.ts
new file mode 100644
index 0000000..064fbbb
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-rutas.test.ts
@@ -0,0 +1,183 @@
+/**
+ * Test de integracion real (no mocks) para taskctl review (TASK-013):
+ * repos Git temporales de verdad, los scripts update-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (rama activa, merge
+ * commits, ancestria) en vez de fiarse de lo que devuelve el comando.
+ * Mismo espiritu que start.test.ts (TASK-009).
+ */
+// Parte de los tests de review (ver test/helpers/review-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  setupTaskEnCurso,
+  advanceDevelop,
+  escribirFichero,
+  rutaTareaMd,
+  setupTaskEnCursoSoloTarea,
+} from '../helpers/review-fixtures.js';
+
+test('taskctl review: una segunda ronda numera -2 CON sufijo de dominio tras una ronda 1 fragmentada (hallazgo IMPORTANTE-1 de revision, TASK-018)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-625', rama: 'feature/task-625-segunda-ronda-fragmentada' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    // Restos commiteados de una ronda 1 YA fragmentada por dominio (dos
+    // revisores, cada uno con su sufijo) — el mismo escenario que dejaria
+    // un ciclo review -> cambios-solicitados -> correccion -> review otra
+    // vez. Antes de esta tarea, RONDA_FILE_RE no reconocia estos nombres
+    // con sufijo y una regresion aqui no la detecta ningun otro test de
+    // la suite (informe de revision, IMPORTANTE-1).
+    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-625', 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(
+      path.join(revisionDir, 'peticion-revision-1-java-spring-reviewer.md'),
+      'ronda 1, java\n',
+      'utf8'
+    );
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
+      '- Veredicto: cambios-solicitados\n',
+      'utf8'
+    );
+    await writeFile(
+      path.join(revisionDir, 'peticion-revision-1-code-quality-reviewer.md'),
+      'ronda 1, generico\n',
+      'utf8'
+    );
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-code-quality-reviewer.md'),
+      '- Veredicto: aprobada\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'restos de la ronda 1 fragmentada');
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {} // correccion de la ronda 1\n'
+    );
+    commitAll(repoRoot, 'correccion pedida en la ronda 1');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-625'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // La ronda siguiente es la 2, no la 1: siguienteRonda tuvo que
+    // reconocer los nombres CON sufijo de la ronda 1 para no pisarlos.
+    assert.equal(result.ronda, 2);
+    assert.ok(result.informes.length >= 1);
+    for (const grupo of result.informes) {
+      assert.match(grupo.peticionPath, /-revision-2(-[a-z0-9-]+)?\.md$/);
+      assert.match(grupo.informePath, /-revision-2(-[a-z0-9-]+)?\.md$/);
+    }
+    // La ronda 1 fragmentada sigue intacta, sin que la ronda 2 la pise.
+    await stat(
+      path.join(
+        tareasRoot,
+        '03-en-revision',
+        'TASK-625',
+        'revision',
+        'informe-revision-1-java-spring-reviewer.md'
+      )
+    );
+  });
+});
+
+test('taskctl review: error claro si falta el ID o la tarea no existe', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await assert.rejects(
+      () => runReviewCommand(tareasRoot, [], '2026-09-06', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      ReviewCommandError
+    );
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-999'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      StateMachineError
+    );
+  });
+});
+
+// --- TASK-054: rutas no ASCII y con caracteres de glob ----------------------
+//
+// Sin core.quotePath=false y -z, Git entrecomillaba y escapaba en octal la
+// ruta con tilde: la clasificacion la veia escapada, el pathspec no casaba y
+// el diff del fichero no llegaba a la peticion de su dominio. Mutacion que
+// lo pone rojo: quitar SIN_COMILLAS o el -z de diffParaRevision.
+
+test('taskctl review: un fichero con tilde llega con su diff a la peticion de su dominio (TASK-054)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-654', rama: 'feature/task-654-no-ascii' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(repoRoot, 'src/main/java/com/acme/Acción.java', 'class Accion { int ñandú; }\n');
+    await escribirFichero(
+      repoRoot,
+      'src/app/user-profile/user-profile.component.ts',
+      'export class UserProfileComponent {}\n'
+    );
+    commitAll(repoRoot, 'java con tilde y angular');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-654'], '2026-10-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    const java = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
+    assert.ok(java !== undefined, JSON.stringify(result.informes));
+    assert.deepEqual(java.ficheros, ['src/main/java/com/acme/Acción.java']);
+    const peticion = await readFile(java.peticionPath, 'utf8');
+    assert.ok(peticion.includes('diff --git a/src/main/java/com/acme/Acción.java'), peticion);
+    assert.ok(peticion.includes('int ñandú;'), peticion);
+    // Ni comillas ni escape octal (`"src/.../Acci\303\263n.java"`).
+    assert.ok(!peticion.includes('Acci\\303'), peticion);
+    // El otro dominio no se lleva el fichero con tilde.
+    const angular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer');
+    assert.ok(angular !== undefined);
+    assert.doesNotMatch(await readFile(angular.peticionPath, 'utf8'), /Acción\.java/);
+  });
+});
+
+test('diffParaRevision y diffRangeForPaths: rutas no ASCII sin comillas y rutas de glob como literales (TASK-054)', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const base = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    await escribirFichero(repoRoot, 'src/acción.ts', 'export const a = 1;\n');
+    await escribirFichero(repoRoot, 'pages/[id].vue', '<template>id</template>\n');
+    await escribirFichero(repoRoot, 'pages/i.vue', '<template>i</template>\n');
+    await escribirFichero(repoRoot, 'docs/guía.md', 'texto\n');
+    commitAll(repoRoot, 'rutas raras');
+
+    const r = diffParaRevision(base, 'HEAD', ['docs/**'], repoRoot);
+    assert.ok(r.incluidos.includes('src/acción.ts'), JSON.stringify(r.incluidos));
+    assert.ok(r.incluidos.includes('pages/[id].vue'));
+    assert.deepEqual(r.excluidos, ['docs/guía.md']);
+    assert.ok(r.diff.includes('diff --git a/src/acción.ts b/src/acción.ts'), r.diff);
+    assert.ok(r.stat.includes('docs/guía.md'), r.stat);
+
+    const soloId = diffRangeForPaths(base, 'HEAD', ['pages/[id].vue'], repoRoot);
+    assert.ok(soloId.includes('pages/[id].vue'), soloId);
+    assert.ok(!soloId.includes('pages/i.vue'), soloId);
+    assert.ok(diffRangeForPaths(base, 'HEAD', ['src/acción.ts'], repoRoot).includes('export const a = 1;'));
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
deleted file mode 100644
index 1d0f666..0000000
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ /dev/null
@@ -1,824 +0,0 @@
-/**
- * Test de integracion real (no mocks) para taskctl review (TASK-013):
- * repos Git temporales de verdad, los scripts update-*.sh tal cual
- * estan en el repo, y evidencia leida de Git (rama activa, merge
- * commits, ancestria) en vez de fiarse de lo que devuelve el comando.
- * Mismo espiritu que start.test.ts (TASK-009).
- */
-import { test } from 'node:test';
-import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
-import { tmpdir } from 'node:os';
-import path from 'node:path';
-import { fileURLToPath } from 'node:url';
-import { spawnSync } from 'node:child_process';
-import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
-import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
-import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
-import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
-import { StateMachineError } from '../../src/core/state-machine.js';
-import type { Task } from '../../src/core/task.js';
-
-const HERE = path.dirname(fileURLToPath(import.meta.url));
-const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
-
-function sampleTask(overrides: Partial<Task> = {}): Task {
-  return {
-    id: 'TASK-600',
-    titulo: 'Tarea de prueba de review',
-    tipo: 'feature',
-    sprint: 2,
-    etiquetas: [],
-    complejidad: 'simple',
-    modelo_sugerido: 'sonnet',
-    estado: 'en-curso',
-    plan_aprobado: true,
-    rama: 'feature/task-600-prueba-review',
-    asignado_a: null,
-    agente_revisor: 'general-purpose',
-    skills_recomendados: [],
-    regla_seleccion_skill: null,
-    ultimo_commit_revisado: null,
-    revision_codex: false,
-    creado: '2026-09-05',
-    actualizado: '2026-09-05',
-    dependencias: [],
-    ...overrides,
-  };
-}
-
-function git(args: string[], cwd: string): string {
-  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
-  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
-  return result.stdout;
-}
-
-/**
- * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
- * lo que el mismo escribe, asi que llamar a esto justo despues de un
- * comando puede no tener ya nada que registrar: `git commit` sale 1
- * con "nothing to commit" y el assert de `git()` lo daria por fallo
- * del test. Se commitea solo si queda algo — y que no quede es
- * exactamente la senal de que el auto-commit hizo su trabajo.
- */
-function commitAll(repoRoot: string, message: string): void {
-  git(['add', '-A'], repoRoot);
-  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
-  git(['commit', '-q', '-m', message], repoRoot);
-}
-
-// Repo base montado una vez por fichero y copiado en cada test
-// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
-const withTempRepo: ConRepo = plantillaRepo('taskctl-review-', async (repoRoot) => {
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
-    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'inicial'], repoRoot);
-    git(['checkout', '-q', '-b', 'develop'], repoRoot);
-});
-
-/**
- * Deja la tarea en-curso en su rama, como la habria dejado "taskctl
- * start": rama creada desde develop, tarea.md commiteado en
- * 02-en-curso/, y un commit de trabajo propio de la rama.
- */
-async function setupTaskEnCurso(repoRoot: string, tareasRoot: string, task: Task): Promise<void> {
-  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar review.\n');
-  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo de la tarea\n', 'utf8');
-  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
-}
-
-/** Avanza develop con un cambio y vuelve a la rama indicada. */
-async function advanceDevelop(repoRoot: string, volverA: string): Promise<void> {
-  git(['checkout', '-q', 'develop'], repoRoot);
-  await writeFile(path.join(repoRoot, 'cambio-develop.txt'), 'cambio en develop\n', 'utf8');
-  commitAll(repoRoot, 'cambio en develop');
-  git(['checkout', '-q', volverA], repoRoot);
-}
-
-/**
- * Escribe un fichero bajo `repoRoot/ruta` (con "/" de Git), creando los
- * directorios que hagan falta. Para las pruebas de clasificacion por
- * dominio (TASK-018): las rutas se eligen IGUAL que las de
- * test/skills/revisores.test.ts (RUTAS_LEGITIMAS/RUTAS_AJENAS), para no
- * inventar una segunda tabla de "que ruta cae en que dominio" que pueda
- * divergir de la que ese fichero ya prueba contra las skills reales.
- */
-async function escribirFichero(repoRoot: string, ruta: string, contenido: string): Promise<void> {
-  const destino = path.join(repoRoot, ...ruta.split('/'));
-  await mkdir(path.dirname(destino), { recursive: true });
-  await writeFile(destino, contenido, 'utf8');
-}
-
-/**
- * Ruta (con "/" de Git) de tarea.md tal como queda en la rama de una
- * tarea en-curso. A diferencia de setupTaskEnCurso, esta variante NO
- * anade "trabajo.txt": las pruebas de clasificacion por dominio
- * (TASK-018) necesitan controlar EXACTAMENTE que ficheros trae el diff,
- * y tarea.md es el UNICO que no se puede evitar (toda tarea necesita su
- * frontmatter commiteado en la rama para que el resto del ciclo
- * funcione) — se deja como el unico "ruido" de fondo, documentado en
- * cada test que lo necesita.
- */
-function rutaTareaMd(id: string): string {
-  return `tareas/02-en-curso/${id}/tarea.md`;
-}
-
-/** Como setupTaskEnCurso, pero sin escribir "trabajo.txt". */
-async function setupTaskEnCursoSoloTarea(
-  repoRoot: string,
-  tareasRoot: string,
-  task: Task
-): Promise<void> {
-  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el enrutado por dominio.\n');
-  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
-}
-
-test('taskctl review: camino feliz sin origin — update real, evidencia de merge, mueve a 03-en-revision y genera peticion + informe', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    await setupTaskEnCurso(repoRoot, tareasRoot, task);
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.id, 'TASK-600');
-    assert.equal(result.baseBranch, 'develop');
-    assert.equal(result.ronda, 1);
-    assert.match(result.filePath, /03-en-revision[/\\]TASK-600[/\\]tarea\.md$/);
-
-    // Evidencia real de Git, no solo el valor devuelto.
-    const branch = git(['branch', '--show-current'], repoRoot).trim();
-    assert.equal(branch, task.rama);
-    const log = git(['log', '--oneline'], repoRoot);
-    assert.match(log, /update\(feature\): develop -> feature\/task-600-prueba-review/);
-    const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', 'develop', 'HEAD'], {
-      cwd: repoRoot,
-      encoding: 'utf8',
-    });
-    assert.equal(ancestor.status, 0, 'develop deberia ser antepasado de HEAD tras el update');
-
-    const read = await readTareaFile(tareasRoot, 'TASK-600');
-    assert.equal(read?.task.estado, 'en-revision');
-    assert.equal(read?.task.actualizado, '2026-09-06');
-    // ultimo_commit_revisado NO se toca al generar la peticion (16.3:
-    // se actualiza cuando la revision TERMINA, no cuando empieza).
-    assert.equal(read?.task.ultimo_commit_revisado, null);
-    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600')));
-
-    // La peticion contiene el diff real (el cambio que vino de develop
-    // y el trabajo de la rama) y el SHA revisado.
-    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
-    assert.doesNotMatch(peticion, /cambio-develop\.txt/);
-    assert.match(peticion, /trabajo\.txt/);
-    assert.ok(peticion.includes(result.commitRevisado));
-    // Desde TASK-030 (item C2), "review" commitea la peticion y el
-    // scaffold del informe, asi que HEAD avanza DESPUES de calcular
-    // commitRevisado: el commit revisado es el padre de HEAD, no HEAD.
-    // Y es lo correcto, no un efecto colateral: lo que el revisor tiene
-    // que revisar es el codigo de la tarea, no el commit que contiene
-    // la peticion de revision de si mismo.
-    assert.equal(result.commitRevisado, git(['rev-parse', 'HEAD~1'], repoRoot).trim());
-    assert.equal(
-      git(['log', '--format=%s', '-1'], repoRoot).trim(),
-      'chore(TASK-600): peticion de revision ronda 1'
-    );
-
-    const informe = await readFile(result.informes[0]!.informePath, 'utf8');
-    assert.match(informe, /Informe de revision — TASK-600 \(ronda 1\)/);
-    assert.match(informe, /PENDIENTE/);
-  });
-});
-
-test('taskctl review: con origin (bare real) integra un cambio que solo existia en el remoto', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const origin = await mkdtemp(path.join(tmpdir(), 'taskctl-review-origin-'));
-    const otherClone = await mkdtemp(path.join(tmpdir(), 'taskctl-review-clone-'));
-    try {
-      git(['init', '-q', '--bare', origin], origin);
-      git(['remote', 'add', 'origin', origin], repoRoot);
-      git(['push', '-q', 'origin', 'main', 'develop'], repoRoot);
-
-      const task = sampleTask({ id: 'TASK-601', rama: 'feature/task-601-con-origin' });
-      await setupTaskEnCurso(repoRoot, tareasRoot, task);
-
-      // Otro colaborador avanza develop directamente en el remoto.
-      git(['clone', '-q', '--branch', 'develop', origin, 'clon'], otherClone);
-      const clonDir = path.join(otherClone, 'clon');
-      git(['config', 'user.email', 'otro@example.com'], clonDir);
-      git(['config', 'user.name', 'Otro'], clonDir);
-      await writeFile(path.join(clonDir, 'remoto.txt'), 'cambio remoto\n', 'utf8');
-      git(['add', '-A'], clonDir);
-      git(['commit', '-q', '-m', 'cambio remoto en develop'], clonDir);
-      git(['push', '-q', 'origin', 'develop'], clonDir);
-
-      const result = await runReviewCommand(tareasRoot, ['TASK-601'], '2026-09-06', {
-        repoCwd: repoRoot,
-        scriptsDir: SCRIPTS_DIR,
-      });
-
-      // El cambio que SOLO existia en origin/develop llego a la rama.
-      await stat(path.join(repoRoot, 'remoto.txt'));
-      const log = git(['log', '--oneline'], repoRoot);
-      assert.match(log, /update\(feature\): develop -> feature\/task-601-con-origin/);
-      const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
-      assert.doesNotMatch(peticion, /remoto\.txt/);
-      const read = await readTareaFile(tareasRoot, 'TASK-601');
-      assert.equal(read?.task.estado, 'en-revision');
-    } finally {
-      await rm(origin, { recursive: true, force: true });
-      await rm(otherClone, { recursive: true, force: true });
-    }
-  });
-});
-
-test('taskctl review: rechaza una tarea que no esta en-curso, sin tocar Git ni carpetas', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ estado: 'en-diseno', plan_aprobado: true });
-    await writeTareaFile(tareasRoot, task, '');
-    commitAll(repoRoot, 'tarea en diseno');
-
-    await assert.rejects(
-      () =>
-        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof StateMachineError);
-        assert.match((e as Error).message, /taskctl start/);
-        return true;
-      }
-    );
-
-    // Nada se movio ni se creo: sin 03-en-revision, sin revision/.
-    const branch = git(['branch', '--show-current'], repoRoot).trim();
-    assert.equal(branch, 'develop');
-    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision')));
-    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-600', 'revision')));
-    const read = await readTareaFile(tareasRoot, 'TASK-600');
-    assert.equal(read?.task.estado, 'en-diseno');
-  });
-});
-
-test('taskctl review: rechaza con el workspace sucio, sin invocar el script', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    await setupTaskEnCurso(repoRoot, tareasRoot, task);
-    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');
-
-    await assert.rejects(
-      () =>
-        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      ReviewCommandError
-    );
-
-    const read = await readTareaFile(tareasRoot, 'TASK-600');
-    assert.equal(read?.task.estado, 'en-curso');
-    // El update no llego a ejecutarse: develop no esta mergeada.
-    const log = git(['log', '--oneline'], repoRoot);
-    assert.doesNotMatch(log, /update\(feature\)/);
-  });
-});
-
-test('taskctl review: si el script falla (conflicto de merge real), no mueve la tarea', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    // Conflicto real: la rama y develop cambian la MISMA linea del README.
-    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-    await writeTareaFile(tareasRoot, task, '');
-    await writeFile(path.join(repoRoot, 'README.md'), '# version de la rama\n', 'utf8');
-    commitAll(repoRoot, 'cambio en la rama');
-    git(['checkout', '-q', 'develop'], repoRoot);
-    await writeFile(path.join(repoRoot, 'README.md'), '# version de develop\n', 'utf8');
-    commitAll(repoRoot, 'cambio en develop');
-    git(['checkout', '-q', task.rama], repoRoot);
-
-    await assert.rejects(
-      () =>
-        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof ReviewCommandError);
-        assert.match((e as Error).message, /conflicto/);
-        return true;
-      }
-    );
-
-    // La tarea sigue en-curso y sin revision/ — el conflicto queda en
-    // el workspace para resolver a mano (comportamiento del script).
-    const read = await readTareaFile(tareasRoot, 'TASK-600');
-    assert.equal(read?.task.estado, 'en-curso');
-    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision')));
-  });
-});
-
-test('taskctl review: script con exit 0 que NO mergea la base -> evidencia lo detecta y no mueve nada', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    await setupTaskEnCurso(repoRoot, tareasRoot, task);
-    await advanceDevelop(repoRoot, task.rama);
-
-    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-update-'));
-    await writeFile(
-      path.join(fakeScriptsDir, 'update-feature.sh'),
-      '#!/usr/bin/env bash\nexit 0\n',
-      'utf8'
-    );
-
-    await assert.rejects(
-      () =>
-        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-          repoCwd: repoRoot,
-          scriptsDir: fakeScriptsDir,
-        }),
-      (e: unknown) => {
-        assert.ok(e instanceof ReviewCommandError);
-        assert.match((e as Error).message, /is-ancestor/);
-        return true;
-      }
-    );
-
-    const read = await readTareaFile(tareasRoot, 'TASK-600');
-    assert.equal(read?.task.estado, 'en-curso');
-    await rm(fakeScriptsDir, { recursive: true, force: true });
-  });
-});
-
-test('taskctl review: una segunda ronda numera peticion e informe como -2 sin pisar la ronda anterior', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    await setupTaskEnCurso(repoRoot, tareasRoot, task);
-    // Restos commiteados de una ronda anterior (como los dejaria un
-    // ciclo review -> cambios-solicitados -> vuelta a en-curso).
-    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision');
-    await mkdir(revisionDir, { recursive: true });
-    await writeFile(path.join(revisionDir, 'peticion-revision-1.md'), 'ronda anterior\n', 'utf8');
-    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), 'informe anterior\n', 'utf8');
-    commitAll(repoRoot, 'restos de la ronda 1');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.ronda, 2);
-    assert.match(result.informes[0]!.peticionPath, /peticion-revision-2\.md$/);
-    // La ronda anterior sigue intacta (se movio con la carpeta).
-    const anterior = await readFile(
-      path.join(tareasRoot, '03-en-revision', 'TASK-600', 'revision', 'peticion-revision-1.md'),
-      'utf8'
-    );
-    // Normalizado: el fichero pasa por un checkout de Git durante el
-    // update y con core.autocrlf=true puede volver con CRLF.
-    assert.equal(anterior.split('\r\n').join('\n'), 'ronda anterior\n');
-  });
-});
-
-test('taskctl review: un diff mayor que 1 MB no revienta el comando (hallazgo IMPORTANTE de revision: ENOBUFS)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-    await writeTareaFile(tareasRoot, task, '');
-    // ~1.8 MB de contenido nuevo: por encima del maxBuffer default de
-    // spawnSync (1 MB), que era lo que mataba a git con ENOBUFS.
-    const lineas = Array.from({ length: 60_000 }, (_, i) => `linea generada numero ${i}`);
-    await writeFile(path.join(repoRoot, 'generado-grande.txt'), lineas.join('\n') + '\n', 'utf8');
-    commitAll(repoRoot, 'fichero grande en la rama');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
-    assert.match(peticion, /generado-grande\.txt/);
-    assert.ok(peticion.length > 1024 * 1024, 'la peticion deberia contener el diff completo');
-  });
-});
-
-test('taskctl review: si el movimiento de carpeta falla, la tarea sigue en-curso y la peticion ya escrita permite reintentar (hallazgo IMPORTANTE de revision: orden escritura-antes-de-mover)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    await setupTaskEnCurso(repoRoot, tareasRoot, task);
-    await advanceDevelop(repoRoot, task.rama);
-    // Fuerza el fallo del rename: la carpeta de destino ya existe
-    // (TaskFolderConflictError, fail-closed de moveTareaFile).
-    await mkdir(path.join(tareasRoot, '03-en-revision', 'TASK-600'), { recursive: true });
-
-    await assert.rejects(
-      () =>
-        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => (e as Error).name === 'TaskFolderConflictError'
-    );
-
-    // La tarea NO cambio de estado (sin callejon sin salida), y la
-    // peticion quedo escrita en la carpeta actual: un reintento tras
-    // limpiar el conflicto usa la ronda siguiente sin pisar nada.
-    const read = await readTareaFile(tareasRoot, 'TASK-600');
-    assert.equal(read?.task.estado, 'en-curso');
-    await stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision', 'peticion-revision-1.md'));
-  });
-});
-
-test('taskctl review: un diff cuyo contexto contiene vallas de backticks no rompe la peticion (hallazgo MENOR de revision)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask();
-    // El caso peligroso son las lineas de CONTEXTO del diff (prefijo
-    // espacio, tolerado por CommonMark como sangria de cierre): el doc
-    // con vallas de 4 backticks vive en develop y la rama modifica una
-    // linea adyacente para que las vallas salgan como contexto del hunk.
-    // Las lineas anadidas (+) no pueden cerrar una valla: un fichero
-    // nuevo no reproduce el bug.
-    const conVallas = 'texto\n' + '````\n' + 'bloque con valla de cuatro\n' + '````\n';
-    await writeFile(path.join(repoRoot, 'doc-con-vallas.md'), conVallas, 'utf8');
-    commitAll(repoRoot, 'doc con vallas en develop');
-    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-    await writeTareaFile(tareasRoot, task, '');
-    await writeFile(
-      path.join(repoRoot, 'doc-con-vallas.md'),
-      'texto modificado\n' + conVallas.slice('texto\n'.length),
-      'utf8'
-    );
-    commitAll(repoRoot, 'la rama modifica la linea adyacente a las vallas');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    // La valla elegida supera a la mas larga del contenido embebido:
-    // el bloque del diff no puede cerrarse antes de tiempo.
-    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
-    assert.match(peticion, /`````diff/);
-  });
-});
-
-// --- TASK-018: enrutado de revisor por diff real, fragmentado por dominio ---
-//
-// Las rutas de fichero de estos tests se copian EXACTAMENTE de las tablas
-// RUTAS_LEGITIMAS/RUTAS_AJENAS de test/skills/revisores.test.ts: esas ya
-// prueban a que revisor (o a ninguno) llega cada ruta contra las skills
-// reales instaladas con el plugin. Repetir aqui esa clasificacion con
-// rutas propias abriria una segunda fuente de verdad que podria divergir
-// de la primera; reusar las mismas rutas cierra esa grieta.
-
-test('taskctl review: un diff que toca 1 dominio (java) genera 1 peticion con el agente de ese dominio, no task.agente_revisor', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-620', rama: 'feature/task-620-un-dominio' });
-    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
-    await escribirFichero(
-      repoRoot,
-      'src/main/java/com/acme/UserService.java',
-      'class UserService {}\n'
-    );
-    commitAll(repoRoot, 'anade servicio Java');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-620'], '2026-09-12', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    // Expectativa cambiada en TASK-034: tarea.md esta en el diff (toda
-    // tarea lo commitea en su rama), pero tareas/** ya no se embebe ni se
-    // clasifica (excluir_de_revision por defecto). Antes le tocaba al
-    // generico una peticion entera solo para tarea.md; ahora no se lanza:
-    // un agente revisor menos por tarea de un solo dominio.
-    assert.equal(result.informes.length, 1);
-    const grupo = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
-    assert.ok(grupo !== undefined, 'deberia haber un grupo para java-spring-reviewer');
-    assert.notEqual(grupo.revisor, task.agente_revisor);
-    assert.match(grupo.peticionPath, /peticion-revision-1-java-spring-reviewer\.md$/);
-    assert.match(grupo.informePath, /informe-revision-1-java-spring-reviewer\.md$/);
-    assert.deepEqual(grupo.ficheros, ['src/main/java/com/acme/UserService.java']);
-
-    const peticion = await readFile(grupo.peticionPath, 'utf8');
-    // TASK-047: agente y skill por separado, y el modelo de la tarea.
-    assert.match(peticion, /Skill revisora a cargar: java-spring-reviewer/);
-    assert.ok(
-      peticion.includes(`Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})`),
-      peticion
-    );
-    assert.equal(result.agente, task.agente_revisor);
-    assert.equal(result.modelo, task.modelo_sugerido);
-    assert.match(peticion, /UserService\.java/);
-    // Desde TASK-034 tarea.md aparece en el --stat de excluidos, pero su
-    // diff no se embebe.
-    assert.doesNotMatch(peticion, /diff --git a\/tareas\//);
-
-    assert.equal(
-      result.informes.find((g) => g.revisor === 'code-quality-reviewer'),
-      undefined,
-      'tarea.md solo ya no genera una peticion al generico (TASK-034)'
-    );
-  });
-});
-
-test('taskctl review: un diff que toca 2 dominios bajo el umbral genera 2 peticiones, cada una solo con los ficheros de su dominio', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-621', rama: 'feature/task-621-dos-dominios' });
-    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
-    await escribirFichero(
-      repoRoot,
-      'src/main/java/com/acme/UserService.java',
-      'class UserService {}\n'
-    );
-    await escribirFichero(
-      repoRoot,
-      'src/app/user-profile/user-profile.component.ts',
-      'export class UserProfileComponent {}\n'
-    );
-    commitAll(repoRoot, 'anade servicio Java y componente Angular');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-621'], '2026-09-12', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    // 2 grupos de dominio. Desde TASK-034 ya no hay un tercero para
-    // tarea.md: tareas/** se excluye del diff y de la clasificacion.
-    assert.equal(result.informes.length, 2);
-    const revisores = result.informes.map((g) => g.revisor).sort();
-    assert.deepEqual(revisores, ['angular-vue-reviewer', 'java-spring-reviewer']);
-
-    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
-    const grupoAngular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer')!;
-
-    assert.deepEqual(grupoJava.ficheros, ['src/main/java/com/acme/UserService.java']);
-    assert.deepEqual(grupoAngular.ficheros, ['src/app/user-profile/user-profile.component.ts']);
-
-    const peticionJava = await readFile(grupoJava.peticionPath, 'utf8');
-    assert.match(peticionJava, /UserService\.java/);
-    assert.doesNotMatch(peticionJava, /user-profile\.component\.ts/);
-
-    const peticionAngular = await readFile(grupoAngular.peticionPath, 'utf8');
-    assert.match(peticionAngular, /user-profile\.component\.ts/);
-    assert.doesNotMatch(peticionAngular, /UserService\.java/);
-  });
-});
-
-test('taskctl review: un diff que toca EXACTAMENTE 3 dominios sigue fragmentando en 3 (umbral inclusive)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-622', rama: 'feature/task-622-tres-dominios' });
-    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
-    await escribirFichero(
-      repoRoot,
-      'src/main/java/com/acme/UserService.java',
-      'class UserService {}\n'
-    );
-    await escribirFichero(
-      repoRoot,
-      'src/app/user-profile/user-profile.component.ts',
-      'export class UserProfileComponent {}\n'
-    );
-    await escribirFichero(repoRoot, 'src/Exporter/IfcExporter.cs', 'class IfcExporter {}\n');
-    commitAll(repoRoot, 'toca los tres dominios de una vez');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-622'], '2026-09-12', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    // Con el catalogo real (3 revisores de dominio, umbral_dominios: 3),
-    // exactamente 3 dominios SIGUE fragmentando: no cae al generico. Los
-    // 3 dominios detectados (lo que fija el criterio del umbral). Desde
-    // TASK-034 sin generico para tarea.md: tareas/** ya no se clasifica.
-    assert.equal(result.informes.length, 3);
-    const revisores = result.informes.map((g) => g.revisor).sort();
-    assert.deepEqual(revisores, [
-      'angular-vue-reviewer',
-      'csharp-autocad-ifc-reviewer',
-      'java-spring-reviewer',
-    ]);
-  });
-});
-
-test('taskctl review: ficheros que no casan ningun dominio, con 1-3 dominios ya detectados, los cubre TAMBIEN el generico', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-623', rama: 'feature/task-623-mas-generico' });
-    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
-    await escribirFichero(
-      repoRoot,
-      'src/main/java/com/acme/UserService.java',
-      'class UserService {}\n'
-    );
-    // Ruta ajena congelada en RUTAS_AJENAS (revisores.test.ts): no casa
-    // con ningun revisor de dominio. Desde TASK-034 es el UNICO fichero
-    // del generico: tarea.md ya no se clasifica.
-    await escribirFichero(repoRoot, 'src/index.ts', 'export const arranque = 1;\n');
-    commitAll(repoRoot, 'servicio Java mas un fichero sin dominio');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-623'], '2026-09-12', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.informes.length, 2);
-    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
-    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer');
-    assert.ok(grupoJava !== undefined, 'el fichero Java deberia tener su propio grupo');
-    assert.ok(
-      grupoGenerico !== undefined,
-      'los ficheros sin dominio (src/index.ts) deberia cubrirlos el generico, sin quedar sin revisor'
-    );
-    assert.deepEqual(grupoJava!.ficheros, ['src/main/java/com/acme/UserService.java']);
-    assert.deepEqual([...grupoGenerico!.ficheros], ['src/index.ts']);
-
-    const peticionGenerico = await readFile(grupoGenerico!.peticionPath, 'utf8');
-    assert.match(peticionGenerico, /src\/index\.ts/);
-    assert.doesNotMatch(peticionGenerico, /UserService\.java/);
-  });
-});
-
-test('taskctl review: un diff sin match de dominio (rutas ajenas y .md) sigue cayendo a un unico generico, igual que antes de TASK-018', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-624', rama: 'feature/task-624-sin-dominio' });
-    await setupTaskEnCurso(repoRoot, tareasRoot, task);
-    // NestJS: ruta congelada como ajena en RUTAS_AJENAS.
-    await escribirFichero(repoRoot, 'src/users/users.module.ts', 'export class UsersModule {}\n');
-    await escribirFichero(repoRoot, 'docs/nota.md', '# nota\n');
-    commitAll(repoRoot, 'ficheros sin ningun dominio');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-624'], '2026-09-12', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.informes.length, 1);
-    assert.equal(result.informes[0]!.revisor, 'code-quality-reviewer');
-    // Sin sufijo de dominio: la convencion de siempre, sin fragmentar.
-    assert.match(result.informes[0]!.peticionPath, /peticion-revision-1\.md$/);
-    assert.match(result.informes[0]!.informePath, /informe-revision-1\.md$/);
-  });
-});
-
-test('taskctl review: una segunda ronda numera -2 CON sufijo de dominio tras una ronda 1 fragmentada (hallazgo IMPORTANTE-1 de revision, TASK-018)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-625', rama: 'feature/task-625-segunda-ronda-fragmentada' });
-    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
-    // Restos commiteados de una ronda 1 YA fragmentada por dominio (dos
-    // revisores, cada uno con su sufijo) — el mismo escenario que dejaria
-    // un ciclo review -> cambios-solicitados -> correccion -> review otra
-    // vez. Antes de esta tarea, RONDA_FILE_RE no reconocia estos nombres
-    // con sufijo y una regresion aqui no la detecta ningun otro test de
-    // la suite (informe de revision, IMPORTANTE-1).
-    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-625', 'revision');
-    await mkdir(revisionDir, { recursive: true });
-    await writeFile(
-      path.join(revisionDir, 'peticion-revision-1-java-spring-reviewer.md'),
-      'ronda 1, java\n',
-      'utf8'
-    );
-    await writeFile(
-      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
-      '- Veredicto: cambios-solicitados\n',
-      'utf8'
-    );
-    await writeFile(
-      path.join(revisionDir, 'peticion-revision-1-code-quality-reviewer.md'),
-      'ronda 1, generico\n',
-      'utf8'
-    );
-    await writeFile(
-      path.join(revisionDir, 'informe-revision-1-code-quality-reviewer.md'),
-      '- Veredicto: aprobada\n',
-      'utf8'
-    );
-    commitAll(repoRoot, 'restos de la ronda 1 fragmentada');
-    await escribirFichero(
-      repoRoot,
-      'src/main/java/com/acme/UserService.java',
-      'class UserService {} // correccion de la ronda 1\n'
-    );
-    commitAll(repoRoot, 'correccion pedida en la ronda 1');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-625'], '2026-09-12', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    // La ronda siguiente es la 2, no la 1: siguienteRonda tuvo que
-    // reconocer los nombres CON sufijo de la ronda 1 para no pisarlos.
-    assert.equal(result.ronda, 2);
-    assert.ok(result.informes.length >= 1);
-    for (const grupo of result.informes) {
-      assert.match(grupo.peticionPath, /-revision-2(-[a-z0-9-]+)?\.md$/);
-      assert.match(grupo.informePath, /-revision-2(-[a-z0-9-]+)?\.md$/);
-    }
-    // La ronda 1 fragmentada sigue intacta, sin que la ronda 2 la pise.
-    await stat(
-      path.join(
-        tareasRoot,
-        '03-en-revision',
-        'TASK-625',
-        'revision',
-        'informe-revision-1-java-spring-reviewer.md'
-      )
-    );
-  });
-});
-
-test('taskctl review: error claro si falta el ID o la tarea no existe', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await assert.rejects(
-      () => runReviewCommand(tareasRoot, [], '2026-09-06', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
-      ReviewCommandError
-    );
-    await assert.rejects(
-      () =>
-        runReviewCommand(tareasRoot, ['TASK-999'], '2026-09-06', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      StateMachineError
-    );
-  });
-});
-
-// --- TASK-054: rutas no ASCII y con caracteres de glob ----------------------
-//
-// Sin core.quotePath=false y -z, Git entrecomillaba y escapaba en octal la
-// ruta con tilde: la clasificacion la veia escapada, el pathspec no casaba y
-// el diff del fichero no llegaba a la peticion de su dominio. Mutacion que
-// lo pone rojo: quitar SIN_COMILLAS o el -z de diffParaRevision.
-
-test('taskctl review: un fichero con tilde llega con su diff a la peticion de su dominio (TASK-054)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ id: 'TASK-654', rama: 'feature/task-654-no-ascii' });
-    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
-    await escribirFichero(repoRoot, 'src/main/java/com/acme/Acción.java', 'class Accion { int ñandú; }\n');
-    await escribirFichero(
-      repoRoot,
-      'src/app/user-profile/user-profile.component.ts',
-      'export class UserProfileComponent {}\n'
-    );
-    commitAll(repoRoot, 'java con tilde y angular');
-    await advanceDevelop(repoRoot, task.rama);
-
-    const result = await runReviewCommand(tareasRoot, ['TASK-654'], '2026-10-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    const java = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
-    assert.ok(java !== undefined, JSON.stringify(result.informes));
-    assert.deepEqual(java.ficheros, ['src/main/java/com/acme/Acción.java']);
-    const peticion = await readFile(java.peticionPath, 'utf8');
-    assert.ok(peticion.includes('diff --git a/src/main/java/com/acme/Acción.java'), peticion);
-    assert.ok(peticion.includes('int ñandú;'), peticion);
-    // Ni comillas ni escape octal (`"src/.../Acci\303\263n.java"`).
-    assert.ok(!peticion.includes('Acci\\303'), peticion);
-    // El otro dominio no se lleva el fichero con tilde.
-    const angular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer');
-    assert.ok(angular !== undefined);
-    assert.doesNotMatch(await readFile(angular.peticionPath, 'utf8'), /Acción\.java/);
-  });
-});
-
-test('diffParaRevision y diffRangeForPaths: rutas no ASCII sin comillas y rutas de glob como literales (TASK-054)', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const base = git(['rev-parse', 'HEAD'], repoRoot).trim();
-    await escribirFichero(repoRoot, 'src/acción.ts', 'export const a = 1;\n');
-    await escribirFichero(repoRoot, 'pages/[id].vue', '<template>id</template>\n');
-    await escribirFichero(repoRoot, 'pages/i.vue', '<template>i</template>\n');
-    await escribirFichero(repoRoot, 'docs/guía.md', 'texto\n');
-    commitAll(repoRoot, 'rutas raras');
-
-    const r = diffParaRevision(base, 'HEAD', ['docs/**'], repoRoot);
-    assert.ok(r.incluidos.includes('src/acción.ts'), JSON.stringify(r.incluidos));
-    assert.ok(r.incluidos.includes('pages/[id].vue'));
-    assert.deepEqual(r.excluidos, ['docs/guía.md']);
-    assert.ok(r.diff.includes('diff --git a/src/acción.ts b/src/acción.ts'), r.diff);
-    assert.ok(r.stat.includes('docs/guía.md'), r.stat);
-
-    const soloId = diffRangeForPaths(base, 'HEAD', ['pages/[id].vue'], repoRoot);
-    assert.ok(soloId.includes('pages/[id].vue'), soloId);
-    assert.ok(!soloId.includes('pages/i.vue'), soloId);
-    assert.ok(diffRangeForPaths(base, 'HEAD', ['src/acción.ts'], repoRoot).includes('export const a = 1;'));
-  });
-});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-ciclo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-ciclo.test.ts
new file mode 100644
index 0000000..1bbc923
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-ciclo.test.ts
@@ -0,0 +1,166 @@
+/**
+ * Sincronizacion de ficheros derivados (TASK-033, version 0.1.1).
+ * Repos Git temporales reales, los scripts de Git-Flow del repo tal
+ * cual, y un script de sincronizacion de verdad (`node`) que regenera
+ * `docs/PLAN.md` leyendo `tareas/` — la misma forma que el script del
+ * proyecto que destapo el problema.
+ *
+ * El test que manda es el primero: encadenar approve -> start -> review
+ * -> finish SIN un solo commit manual en medio, con el derivado dentro
+ * del commit de cada transicion y `git status` vacio despues de cada
+ * una. Antes de 0.1.1 hacia falta un commit a mano tras cada paso, y el
+ * arreglo con un hook de pre-commit dejaba el indice en `MM`.
+ */
+// Parte de los tests de sincronizacion (ver test/helpers/sincronizacion-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
+import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  PAQUETE,
+  SCRIPTS_DIR,
+  BIN,
+  git,
+  commitAll,
+  porcelain,
+  ficherosDeHead,
+  sampleTask,
+  SCRIPT_SYNC,
+  CONFIG_SYNC,
+  withRepoSincronizado,
+  planEnDisco,
+  tocarTarea,
+  reescribirScript,
+  reescribirScriptSinCommitear,
+} from '../helpers/sincronizacion-fixtures.js';
+
+// ─── El test del item: el ciclo entero sin un commit manual ────────────────
+
+test('sincronizacion: approve -> start -> review -> finish sin commits manuales; el derivado va en cada commit y el arbol queda limpio', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
+
+    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
+    assert.equal(a.autoCommit.sincronizacion.estado, 'aplicada');
+    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'approve: falta el derivado');
+    assert.equal(await planEnDisco(repoRoot), 'TASK-920 01-en-diseno aprobado');
+    assert.equal(porcelain(repoRoot), '', 'approve dejo el arbol sucio');
+
+    const s = await runStartCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
+    assert.equal(s.autoCommit.sincronizacion.estado, 'aplicada');
+    assert.equal(s.autoCommit.rama, 'feature/task-920-sincronizacion');
+    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'start: falta el derivado');
+    assert.equal(await planEnDisco(repoRoot), 'TASK-920 02-en-curso aprobado');
+    assert.equal(porcelain(repoRoot), '', 'start dejo el arbol sucio');
+
+    await writeFile(path.join(repoRoot, 'README.md'), 'repo con trabajo\n', 'utf8');
+    commitAll(repoRoot, 'feat(TASK-920): trabajo');
+
+    const v = await runReviewCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
+    assert.equal(v.autoCommit.sincronizacion.estado, 'aplicada');
+    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'review: falta el derivado');
+    assert.equal(await planEnDisco(repoRoot), 'TASK-920 03-en-revision aprobado');
+    assert.equal(porcelain(repoRoot), '', 'review dejo el arbol sucio');
+
+    const informe = path.join(
+      tareasRoot,
+      '03-en-revision',
+      'TASK-920',
+      'revision',
+      'informe-revision-1.md'
+    );
+    await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n', 'utf8');
+    commitAll(repoRoot, 'docs(TASK-920): informe de revision');
+
+    const f = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
+    assert.equal(f.autoCommit.sincronizacion.estado, 'aplicada');
+    assert.equal(f.autoCommit.rama, 'develop');
+    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'finish: falta el derivado');
+    assert.equal(await planEnDisco(repoRoot), 'TASK-920 04-terminadas aprobado');
+    assert.equal(porcelain(repoRoot), '', 'finish dejo el arbol sucio');
+    // Y lo que se commiteo en develop es lo que hay en disco.
+    assert.equal(git(['show', 'HEAD:docs/PLAN.md'], repoRoot).trim(), await planEnDisco(repoRoot));
+  });
+});
+
+test('sincronizacion: sin las claves, ni se ejecuta el script ni cambia el commit (comportamiento 0.1.0)', async () => {
+  await withRepoSincronizado(null, async (repoRoot, tareasRoot) => {
+    const antes = await planEnDisco(repoRoot);
+    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
+      repoCwd: repoRoot,
+    });
+    assert.equal(a.autoCommit.sincronizacion.estado, 'no-configurada');
+    assert.deepEqual(a.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-920/tarea.md']);
+    assert.equal(await planEnDisco(repoRoot), antes, 'el script no deberia haberse ejecutado');
+  });
+});
+
+test('sincronizacion (a): si la ruta declarada ya tenia cambios, no se ejecuta, no entra en el commit y el cambio de la persona sigue en el arbol', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await writeFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'edicion a mano\n', 'utf8');
+    const dir = await tocarTarea(tareasRoot);
+
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+    assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
+    assert.equal(r.commiteado, true, 'la tarea se commitea igual');
+    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
+    assert.equal(await planEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
+    assert.match(r.avisos.join('\n'), /No se ha ejecutado la sincronizacion: docs\/PLAN\.md/);
+  });
+});
+
+test('sincronizacion (b): si el script falla tras escribir, el derivado vuelve a HEAD, la tarea se commitea y el arbol queda limpio', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    const enHead = await planEnDisco(repoRoot);
+    await reescribirScript(
+      repoRoot,
+      "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/PLAN.md', 'a medias\\n');\n" +
+        "console.error('se rompio a mitad');\nprocess.exit(4);\n"
+    );
+    const dir = await tocarTarea(tareasRoot);
+
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+    assert.equal(r.sincronizacion.estado, 'fallida');
+    assert.equal(r.commiteado, true);
+    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
+    assert.equal(await planEnDisco(repoRoot), enHead, 'el derivado a medias no se restauro');
+    assert.equal(porcelain(repoRoot), '');
+    const aviso = r.avisos.join('\n');
+    assert.match(aviso, /salio con codigo 4: se rompio a mitad/);
+    assert.match(aviso, /no repitas el comando de taskctl/);
+  });
+});
+
+test('sincronizacion (b): un derivado que no existia en HEAD y el script deja a medias se borra', async () => {
+  await withRepoSincronizado(
+    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/NUEVO.md]\n',
+    async (repoRoot, tareasRoot) => {
+      await reescribirScript(
+        repoRoot,
+        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/NUEVO.md', 'x\\n');\nprocess.exit(1);\n"
+      );
+      const dir = await tocarTarea(tareasRoot);
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      assert.equal(existsSync(path.join(repoRoot, 'docs', 'NUEVO.md')), false);
+      assert.equal(porcelain(repoRoot), '');
+    }
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-revision.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-revision.test.ts
new file mode 100644
index 0000000..fe1c9ba
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-revision.test.ts
@@ -0,0 +1,209 @@
+/**
+ * Sincronizacion de ficheros derivados (TASK-033, version 0.1.1).
+ * Repos Git temporales reales, los scripts de Git-Flow del repo tal
+ * cual, y un script de sincronizacion de verdad (`node`) que regenera
+ * `docs/PLAN.md` leyendo `tareas/` — la misma forma que el script del
+ * proyecto que destapo el problema.
+ *
+ * El test que manda es el primero: encadenar approve -> start -> review
+ * -> finish SIN un solo commit manual en medio, con el derivado dentro
+ * del commit de cada transicion y `git status` vacio despues de cada
+ * una. Antes de 0.1.1 hacia falta un commit a mano tras cada paso, y el
+ * arreglo con un hook de pre-commit dejaba el indice en `MM`.
+ */
+// Parte de los tests de sincronizacion (ver test/helpers/sincronizacion-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
+import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  PAQUETE,
+  SCRIPTS_DIR,
+  BIN,
+  git,
+  commitAll,
+  porcelain,
+  ficherosDeHead,
+  sampleTask,
+  SCRIPT_SYNC,
+  CONFIG_SYNC,
+  withRepoSincronizado,
+  planEnDisco,
+  tocarTarea,
+  reescribirScript,
+  reescribirScriptSinCommitear,
+} from '../helpers/sincronizacion-fixtures.js';
+
+// ─── Revision ronda 1: rutas que Git no puede commitear ────────────────────
+
+test('sincronizacion (revision IMP-1): una ruta declarada en .gitignore no aborta la transicion; queda fallida y el arbol limpio', async () => {
+  await withRepoSincronizado(
+    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/GEN.md]\n',
+    async (repoRoot, tareasRoot) => {
+      await writeFile(path.join(repoRoot, '.gitignore'), 'docs/GEN.md\n', 'utf8');
+      await reescribirScript(
+        repoRoot,
+        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/GEN.md', 'x\\n');\n"
+      );
+      const dir = await tocarTarea(tareasRoot);
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      assert.equal(r.commiteado, true, 'la tarea tiene que commitearse igual');
+      assert.match(r.avisos.join('\n'), /esta en \.gitignore/);
+      assert.equal(porcelain(repoRoot), '');
+    }
+  );
+});
+
+test('sincronizacion (revision IMP-1): una ruta declarada con otras mayusculas que el fichero real queda fallida y nombra el nombre real', async () => {
+  await withRepoSincronizado(
+    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/plan.md]\n',
+    async (repoRoot, tareasRoot) => {
+      const dir = await tocarTarea(tareasRoot);
+      const tareaMd = path.join(dir, 'tarea.md');
+      await writeFile(
+        tareaMd,
+        (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
+      );
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      assert.equal(r.commiteado, true);
+      assert.match(r.avisos.join('\n'), /se llama docs\/PLAN\.md/);
+      assert.equal(porcelain(repoRoot), '', 'el derivado se tenia que restaurar');
+    }
+  );
+});
+
+test('sincronizacion (revision MEN-2): un script que sale con 124 por su cuenta no se describe como timeout', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await reescribirScript(repoRoot, 'process.exit(124);\n');
+    const dir = await tocarTarea(tareasRoot);
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+    assert.equal(r.sincronizacion.estado, 'fallida');
+    const aviso = r.avisos.join('\n');
+    assert.match(aviso, /salio con codigo 124/);
+    assert.doesNotMatch(aviso, /no termino en/);
+  });
+});
+
+test('sincronizacion (revision MEN-3): el timeout mata tambien al nieto; deja de escribir despues del corte', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    // El nieto escribe fuera del repo: asi no cuenta como ruta ajena y
+    // lo unico que mide el test es si sigue vivo.
+    const testigo = path.join(path.dirname(repoRoot), `${path.basename(repoRoot)}-nieto.txt`);
+    await reescribirScript(
+      repoRoot,
+      "import { spawn } from 'node:child_process';\n" +
+        `const testigo = ${JSON.stringify(testigo)};\n` +
+        "spawn(process.execPath, ['-e', \"const fs = require('fs'); fs.appendFileSync(process.argv[1], 'x'); setInterval(() => fs.appendFileSync(process.argv[1], 'x'), 50)\", testigo], { stdio: 'ignore' });\n" +
+        'setTimeout(() => {}, 60000);\n'
+    );
+    const dir = await tocarTarea(tareasRoot);
+    try {
+      const r = autoCommit({
+        cwd: repoRoot,
+        rutas: [dir],
+        mensaje: mensajeChore('TASK-920', 'x'),
+        sincronizacion: { timeoutMs: 8000 },
+      });
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      await new Promise((ok) => setTimeout(ok, 500));
+      const tras = (await readFile(testigo, 'utf8')).length;
+      await new Promise((ok) => setTimeout(ok, 1000));
+      assert.equal((await readFile(testigo, 'utf8')).length, tras, 'el nieto sigue vivo');
+    } finally {
+      await rm(testigo, { force: true });
+    }
+  });
+});
+
+test('sincronizacion (revision 2, MENOR): el chequeo (a) ve trabajo sin commitear aunque la ruta declarada tenga otras mayusculas', async () => {
+  await withRepoSincronizado(
+    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/plan.md]\n',
+    async (repoRoot, tareasRoot) => {
+      await writeFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'edicion a mano\n', 'utf8');
+      const dir = await tocarTarea(tareasRoot);
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+      assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
+      assert.equal(await planEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
+    }
+  );
+});
+
+// ─── finish: el caso sin retorno ───────────────────────────────────────────
+
+test('sincronizacion en finish: si el script falla tras el merge, la tarea queda cerrada y commiteada en develop y el arbol limpio', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await mkdir(path.join(tareasRoot, '03-en-revision'), { recursive: true });
+    git(['mv', 'tareas/01-en-diseno/TASK-920', 'tareas/03-en-revision/TASK-920'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
+    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1.md'),
+      '# Informe\n\n- Veredicto: aprobada\n',
+      'utf8'
+    );
+    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), 'process.exit(1);\n', 'utf8');
+    commitAll(repoRoot, 'feat(TASK-920): trabajo revisado');
+    const planAntes = await planEnDisco(repoRoot);
+
+    const r = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(r.autoCommit.sincronizacion.estado, 'fallida');
+    assert.equal(r.autoCommit.commiteado, true);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    assert.ok(existsSync(path.join(tareasRoot, '04-terminadas', 'TASK-920', 'tarea.md')));
+    assert.equal(await planEnDisco(repoRoot), planAntes);
+    assert.equal(porcelain(repoRoot), '');
+  });
+});
+
+// ─── El codigo de salida del CLI real ──────────────────────────────────────
+
+test('taskctl (binario real): sale con 3 cuando la transicion se hizo pero la sincronizacion no, y con 0 cuando se aplico', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot) => {
+    const ok = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+      stdio: ['ignore', 'pipe', 'pipe'],
+    });
+    assert.equal(ok.status, 0, ok.stderr);
+
+    await reescribirScript(repoRoot, 'process.exit(1);\n');
+    const tareaMd = path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-920', 'tarea.md');
+    const contenido = await readFile(tareaMd, 'utf8');
+    await writeFile(tareaMd, contenido.replace('plan_aprobado: true', 'plan_aprobado: false'));
+    commitAll(repoRoot, 'chore: desaprobar para reintentar');
+
+    const mal = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+      stdio: ['ignore', 'pipe', 'pipe'],
+    });
+    assert.equal(mal.status, CODIGO_SINCRONIZACION_NO_APLICADA, mal.stderr);
+    assert.match(mal.stderr, /\[AVISO\] La sincronizacion "node scripts\/sync\.mjs" salio con codigo 1/);
+    assert.match(mal.stdout, /aprobada/);
+    assert.equal(porcelain(repoRoot), '');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-scripts.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-scripts.test.ts
new file mode 100644
index 0000000..289fc1d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-scripts.test.ts
@@ -0,0 +1,131 @@
+/**
+ * Sincronizacion de ficheros derivados (TASK-033, version 0.1.1).
+ * Repos Git temporales reales, los scripts de Git-Flow del repo tal
+ * cual, y un script de sincronizacion de verdad (`node`) que regenera
+ * `docs/PLAN.md` leyendo `tareas/` — la misma forma que el script del
+ * proyecto que destapo el problema.
+ *
+ * El test que manda es el primero: encadenar approve -> start -> review
+ * -> finish SIN un solo commit manual en medio, con el derivado dentro
+ * del commit de cada transicion y `git status` vacio despues de cada
+ * una. Antes de 0.1.1 hacia falta un commit a mano tras cada paso, y el
+ * arreglo con un hook de pre-commit dejaba el indice en `MM`.
+ */
+// Parte de los tests de sincronizacion (ver test/helpers/sincronizacion-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
+import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  PAQUETE,
+  SCRIPTS_DIR,
+  BIN,
+  git,
+  commitAll,
+  porcelain,
+  ficherosDeHead,
+  sampleTask,
+  SCRIPT_SYNC,
+  CONFIG_SYNC,
+  withRepoSincronizado,
+  planEnDisco,
+  tocarTarea,
+  reescribirScript,
+  reescribirScriptSinCommitear,
+} from '../helpers/sincronizacion-fixtures.js';
+
+test('sincronizacion (b): un script que no termina se corta por timeout y no cuelga el comando', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await reescribirScript(repoRoot, 'setTimeout(() => {}, 60000);\n');
+    const dir = await tocarTarea(tareasRoot);
+    const t0 = Date.now();
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [dir],
+      mensaje: mensajeChore('TASK-920', 'x'),
+      sincronizacion: { timeoutMs: 1500 },
+    });
+    assert.ok(Date.now() - t0 < 30000, 'el timeout no corto el script');
+    assert.equal(r.sincronizacion.estado, 'fallida');
+    assert.equal(r.commiteado, true);
+    assert.match(r.avisos.join('\n'), /no termino en 2 s/);
+  });
+});
+
+test('sincronizacion (b): un script que lee stdin recibe EOF, no se queda esperando', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await reescribirScript(
+      repoRoot,
+      "process.stdin.on('data', () => {});\nprocess.stdin.on('end', () => process.exit(7));\n"
+    );
+    const dir = await tocarTarea(tareasRoot);
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [dir],
+      mensaje: mensajeChore('TASK-920', 'x'),
+      sincronizacion: { timeoutMs: 20000 },
+    });
+    assert.equal(r.sincronizacion.estado, 'fallida');
+    assert.match(r.avisos.join('\n'), /salio con codigo 7/);
+  });
+});
+
+test('sincronizacion (c): un script que toca ficheros no declarados los nombra y no los commitea; el derivado si entra', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await reescribirScript(
+      repoRoot,
+      SCRIPT_SYNC + "writeFileSync('README.md', 'tocado por el script\\n');\n"
+    );
+    const dir = await tocarTarea(tareasRoot);
+    // Un cambio de estado de verdad, para que el derivado cambie.
+    const tareaMd = path.join(dir, 'tarea.md');
+    await writeFile(
+      tareaMd,
+      (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
+    );
+
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
+    const enCommit = ficherosDeHead(repoRoot);
+    assert.ok(enCommit.includes('docs/PLAN.md'), 'el derivado declarado deberia entrar');
+    assert.ok(!enCommit.includes('README.md'), 'se commiteo un fichero no declarado');
+    // porcelain() recorta, asi que la primera linea pierde su espacio inicial.
+    assert.match(porcelain(repoRoot), /^ ?M README\.md$/m, 'el fichero ajeno no se debe tocar');
+    assert.equal(
+      await readFile(path.join(repoRoot, 'README.md'), 'utf8'),
+      'tocado por el script\n',
+      'el fichero ajeno no se debe restaurar ni borrar'
+    );
+    assert.match(r.avisos.join('\n'), /no estan en rutas_sincronizacion: README\.md/);
+  });
+});
+
+test('sincronizacion (c): detecta la reescritura de un fichero que YA estaba sucio (el porcelain no cambia, el contenido si)', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await writeFile(path.join(repoRoot, 'README.md'), 'trabajo de la persona\n', 'utf8');
+    await reescribirScriptSinCommitear(
+      repoRoot,
+      SCRIPT_SYNC + "writeFileSync('README.md', 'pisado por el script\\n');\n"
+    );
+    const dir = await tocarTarea(tareasRoot);
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
+    assert.match(r.avisos.join('\n'), /README\.md/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
deleted file mode 100644
index 183a0f5..0000000
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
+++ /dev/null
@@ -1,526 +0,0 @@
-/**
- * Sincronizacion de ficheros derivados (TASK-033, version 0.1.1).
- * Repos Git temporales reales, los scripts de Git-Flow del repo tal
- * cual, y un script de sincronizacion de verdad (`node`) que regenera
- * `docs/PLAN.md` leyendo `tareas/` — la misma forma que el script del
- * proyecto que destapo el problema.
- *
- * El test que manda es el primero: encadenar approve -> start -> review
- * -> finish SIN un solo commit manual en medio, con el derivado dentro
- * del commit de cada transicion y `git status` vacio despues de cada
- * una. Antes de 0.1.1 hacia falta un commit a mano tras cada paso, y el
- * arreglo con un hook de pre-commit dejaba el indice en `MM`.
- */
-import { test } from 'node:test';
-import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
-import { existsSync } from 'node:fs';
-import { tmpdir } from 'node:os';
-import path from 'node:path';
-import { fileURLToPath } from 'node:url';
-import { spawnSync } from 'node:child_process';
-import { writeTareaFile } from '../../src/fs/task-store.js';
-import { runApproveCommand } from '../../src/commands/approve.js';
-import { runStartCommand } from '../../src/commands/start.js';
-import { runReviewCommand } from '../../src/commands/review.js';
-import { runFinishCommand } from '../../src/commands/finish.js';
-import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
-import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
-import type { Task } from '../../src/core/task.js';
-
-const HERE = path.dirname(fileURLToPath(import.meta.url));
-// dist/test/commands -> raiz del paquete
-const PAQUETE = path.join(HERE, '..', '..', '..');
-const SCRIPTS_DIR = path.join(PAQUETE, 'scripts', 'gitflow');
-const BIN = path.join(PAQUETE, 'bin', 'taskctl');
-
-function git(args: string[], cwd: string): string {
-  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
-  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
-  return result.stdout;
-}
-
-function commitAll(repoRoot: string, message: string): void {
-  git(['add', '-A'], repoRoot);
-  git(['commit', '-q', '-m', message], repoRoot);
-}
-
-function porcelain(repoRoot: string): string {
-  return git(['status', '--porcelain', '--untracked-files=all'], repoRoot).trim();
-}
-
-function ficherosDeHead(repoRoot: string): string[] {
-  return git(['show', '--name-only', '--format=', 'HEAD'], repoRoot)
-    .split('\n')
-    .map((l) => l.trim())
-    .filter((l) => l !== '');
-}
-
-function sampleTask(overrides: Partial<Task> = {}): Task {
-  return {
-    id: 'TASK-920',
-    titulo: 'Tarea de prueba de la sincronizacion',
-    tipo: 'feature',
-    sprint: 1,
-    etiquetas: ['cli'],
-    complejidad: 'simple',
-    modelo_sugerido: 'sonnet',
-    estado: 'en-diseno',
-    plan_aprobado: false,
-    rama: 'feature/task-920-sincronizacion',
-    asignado_a: null,
-    agente_revisor: 'general-purpose',
-    skills_recomendados: [],
-    regla_seleccion_skill: null,
-    ultimo_commit_revisado: null,
-    revision_codex: false,
-    creado: '2026-10-03',
-    actualizado: '2026-10-03',
-    dependencias: [],
-    ...overrides,
-  };
-}
-
-/**
- * Regenera docs/PLAN.md: una linea por tarea con su carpeta y si el
- * plan esta aprobado. Lee el estado de disco, como el script real.
- */
-const SCRIPT_SYNC = `import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
-const filas = [];
-for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
-  const d = 'tareas/' + c;
-  if (!existsSync(d)) continue;
-  for (const id of readdirSync(d).filter((x) => x.startsWith('TASK-'))) {
-    const md = readFileSync(d + '/' + id + '/tarea.md', 'utf8');
-    filas.push(id + ' ' + c + (/plan_aprobado: true/.test(md) ? ' aprobado' : ''));
-  }
-}
-mkdirSync('docs', { recursive: true });
-writeFileSync('docs/PLAN.md', filas.sort().join('\\n') + '\\n');
-`;
-
-const CONFIG_SYNC =
-  'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/PLAN.md]\n';
-
-/**
- * Repo con develop, el script de sincronizacion, la config que lo
- * activa (si `config` no es null) y una tarea en 01-en-diseno con su
- * plan. Todo commiteado, docs/PLAN.md incluido: arbol limpio al entrar.
- */
-async function withRepoSincronizado(
-  config: string | null,
-  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
-): Promise<void> {
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sync-'));
-  try {
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    git(['config', 'core.autocrlf', 'false'], repoRoot);
-    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
-    commitAll(repoRoot, 'inicial');
-    git(['checkout', '-q', '-b', 'develop'], repoRoot);
-
-    const tareasRoot = path.join(repoRoot, 'tareas');
-    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar la sincronizacion.\n');
-    const planDir = path.join(tareasRoot, '01-en-diseno', 'TASK-920', 'planificacion');
-    await mkdir(planDir, { recursive: true });
-    // TASK-043: approve rechaza un plan que es solo una cabecera.
-    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n\nEnfoque: sincronizar.\n', 'utf8');
-    await mkdir(path.join(repoRoot, 'scripts'), { recursive: true });
-    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), SCRIPT_SYNC, 'utf8');
-    if (config !== null) {
-      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
-      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
-    }
-    const r = spawnSync('node', ['scripts/sync.mjs'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(r.status, 0, r.stderr);
-    commitAll(repoRoot, 'docs: plan y sincronizacion');
-    await fn(repoRoot, tareasRoot);
-  } finally {
-    // Un EBUSY aqui (un proceso huerfano con el cwd dentro) no puede
-    // tapar la asercion que de verdad fallo: se reintenta y se traga.
-    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
-  }
-}
-
-async function planEnDisco(repoRoot: string): Promise<string> {
-  return (await readFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'utf8')).trim();
-}
-
-// ─── El test del item: el ciclo entero sin un commit manual ────────────────
-
-test('sincronizacion: approve -> start -> review -> finish sin commits manuales; el derivado va en cada commit y el arbol queda limpio', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
-
-    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
-    assert.equal(a.autoCommit.sincronizacion.estado, 'aplicada');
-    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'approve: falta el derivado');
-    assert.equal(await planEnDisco(repoRoot), 'TASK-920 01-en-diseno aprobado');
-    assert.equal(porcelain(repoRoot), '', 'approve dejo el arbol sucio');
-
-    const s = await runStartCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
-    assert.equal(s.autoCommit.sincronizacion.estado, 'aplicada');
-    assert.equal(s.autoCommit.rama, 'feature/task-920-sincronizacion');
-    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'start: falta el derivado');
-    assert.equal(await planEnDisco(repoRoot), 'TASK-920 02-en-curso aprobado');
-    assert.equal(porcelain(repoRoot), '', 'start dejo el arbol sucio');
-
-    await writeFile(path.join(repoRoot, 'README.md'), 'repo con trabajo\n', 'utf8');
-    commitAll(repoRoot, 'feat(TASK-920): trabajo');
-
-    const v = await runReviewCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
-    assert.equal(v.autoCommit.sincronizacion.estado, 'aplicada');
-    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'review: falta el derivado');
-    assert.equal(await planEnDisco(repoRoot), 'TASK-920 03-en-revision aprobado');
-    assert.equal(porcelain(repoRoot), '', 'review dejo el arbol sucio');
-
-    const informe = path.join(
-      tareasRoot,
-      '03-en-revision',
-      'TASK-920',
-      'revision',
-      'informe-revision-1.md'
-    );
-    await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n', 'utf8');
-    commitAll(repoRoot, 'docs(TASK-920): informe de revision');
-
-    const f = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
-    assert.equal(f.autoCommit.sincronizacion.estado, 'aplicada');
-    assert.equal(f.autoCommit.rama, 'develop');
-    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'finish: falta el derivado');
-    assert.equal(await planEnDisco(repoRoot), 'TASK-920 04-terminadas aprobado');
-    assert.equal(porcelain(repoRoot), '', 'finish dejo el arbol sucio');
-    // Y lo que se commiteo en develop es lo que hay en disco.
-    assert.equal(git(['show', 'HEAD:docs/PLAN.md'], repoRoot).trim(), await planEnDisco(repoRoot));
-  });
-});
-
-test('sincronizacion: sin las claves, ni se ejecuta el script ni cambia el commit (comportamiento 0.1.0)', async () => {
-  await withRepoSincronizado(null, async (repoRoot, tareasRoot) => {
-    const antes = await planEnDisco(repoRoot);
-    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
-      repoCwd: repoRoot,
-    });
-    assert.equal(a.autoCommit.sincronizacion.estado, 'no-configurada');
-    assert.deepEqual(a.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-920/tarea.md']);
-    assert.equal(await planEnDisco(repoRoot), antes, 'el script no deberia haberse ejecutado');
-  });
-});
-
-// ─── Los tres desenlaces en que no se aplica ───────────────────────────────
-
-/** Escribe un cambio en la tarea (lo que haria un comando) para que autoCommit tenga algo. */
-async function tocarTarea(tareasRoot: string): Promise<string> {
-  const dir = path.join(tareasRoot, '01-en-diseno', 'TASK-920');
-  await writeFile(path.join(dir, 'nota.md'), 'cambio de la transicion\n', 'utf8');
-  return dir;
-}
-
-async function reescribirScript(repoRoot: string, contenido: string): Promise<void> {
-  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
-  commitAll(repoRoot, 'chore: script nuevo');
-}
-
-test('sincronizacion (a): si la ruta declarada ya tenia cambios, no se ejecuta, no entra en el commit y el cambio de la persona sigue en el arbol', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    await writeFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'edicion a mano\n', 'utf8');
-    const dir = await tocarTarea(tareasRoot);
-
-    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-
-    assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
-    assert.equal(r.commiteado, true, 'la tarea se commitea igual');
-    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
-    assert.equal(await planEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
-    assert.match(r.avisos.join('\n'), /No se ha ejecutado la sincronizacion: docs\/PLAN\.md/);
-  });
-});
-
-test('sincronizacion (b): si el script falla tras escribir, el derivado vuelve a HEAD, la tarea se commitea y el arbol queda limpio', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    const enHead = await planEnDisco(repoRoot);
-    await reescribirScript(
-      repoRoot,
-      "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/PLAN.md', 'a medias\\n');\n" +
-        "console.error('se rompio a mitad');\nprocess.exit(4);\n"
-    );
-    const dir = await tocarTarea(tareasRoot);
-
-    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-
-    assert.equal(r.sincronizacion.estado, 'fallida');
-    assert.equal(r.commiteado, true);
-    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
-    assert.equal(await planEnDisco(repoRoot), enHead, 'el derivado a medias no se restauro');
-    assert.equal(porcelain(repoRoot), '');
-    const aviso = r.avisos.join('\n');
-    assert.match(aviso, /salio con codigo 4: se rompio a mitad/);
-    assert.match(aviso, /no repitas el comando de taskctl/);
-  });
-});
-
-test('sincronizacion (b): un derivado que no existia en HEAD y el script deja a medias se borra', async () => {
-  await withRepoSincronizado(
-    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/NUEVO.md]\n',
-    async (repoRoot, tareasRoot) => {
-      await reescribirScript(
-        repoRoot,
-        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/NUEVO.md', 'x\\n');\nprocess.exit(1);\n"
-      );
-      const dir = await tocarTarea(tareasRoot);
-      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-      assert.equal(r.sincronizacion.estado, 'fallida');
-      assert.equal(existsSync(path.join(repoRoot, 'docs', 'NUEVO.md')), false);
-      assert.equal(porcelain(repoRoot), '');
-    }
-  );
-});
-
-test('sincronizacion (b): un script que no termina se corta por timeout y no cuelga el comando', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    await reescribirScript(repoRoot, 'setTimeout(() => {}, 60000);\n');
-    const dir = await tocarTarea(tareasRoot);
-    const t0 = Date.now();
-    const r = autoCommit({
-      cwd: repoRoot,
-      rutas: [dir],
-      mensaje: mensajeChore('TASK-920', 'x'),
-      sincronizacion: { timeoutMs: 1500 },
-    });
-    assert.ok(Date.now() - t0 < 30000, 'el timeout no corto el script');
-    assert.equal(r.sincronizacion.estado, 'fallida');
-    assert.equal(r.commiteado, true);
-    assert.match(r.avisos.join('\n'), /no termino en 2 s/);
-  });
-});
-
-test('sincronizacion (b): un script que lee stdin recibe EOF, no se queda esperando', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    await reescribirScript(
-      repoRoot,
-      "process.stdin.on('data', () => {});\nprocess.stdin.on('end', () => process.exit(7));\n"
-    );
-    const dir = await tocarTarea(tareasRoot);
-    const r = autoCommit({
-      cwd: repoRoot,
-      rutas: [dir],
-      mensaje: mensajeChore('TASK-920', 'x'),
-      sincronizacion: { timeoutMs: 20000 },
-    });
-    assert.equal(r.sincronizacion.estado, 'fallida');
-    assert.match(r.avisos.join('\n'), /salio con codigo 7/);
-  });
-});
-
-test('sincronizacion (c): un script que toca ficheros no declarados los nombra y no los commitea; el derivado si entra', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    await reescribirScript(
-      repoRoot,
-      SCRIPT_SYNC + "writeFileSync('README.md', 'tocado por el script\\n');\n"
-    );
-    const dir = await tocarTarea(tareasRoot);
-    // Un cambio de estado de verdad, para que el derivado cambie.
-    const tareaMd = path.join(dir, 'tarea.md');
-    await writeFile(
-      tareaMd,
-      (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
-    );
-
-    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-
-    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
-    const enCommit = ficherosDeHead(repoRoot);
-    assert.ok(enCommit.includes('docs/PLAN.md'), 'el derivado declarado deberia entrar');
-    assert.ok(!enCommit.includes('README.md'), 'se commiteo un fichero no declarado');
-    // porcelain() recorta, asi que la primera linea pierde su espacio inicial.
-    assert.match(porcelain(repoRoot), /^ ?M README\.md$/m, 'el fichero ajeno no se debe tocar');
-    assert.equal(
-      await readFile(path.join(repoRoot, 'README.md'), 'utf8'),
-      'tocado por el script\n',
-      'el fichero ajeno no se debe restaurar ni borrar'
-    );
-    assert.match(r.avisos.join('\n'), /no estan en rutas_sincronizacion: README\.md/);
-  });
-});
-
-test('sincronizacion (c): detecta la reescritura de un fichero que YA estaba sucio (el porcelain no cambia, el contenido si)', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    await writeFile(path.join(repoRoot, 'README.md'), 'trabajo de la persona\n', 'utf8');
-    await reescribirScriptSinCommitear(
-      repoRoot,
-      SCRIPT_SYNC + "writeFileSync('README.md', 'pisado por el script\\n');\n"
-    );
-    const dir = await tocarTarea(tareasRoot);
-    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
-    assert.match(r.avisos.join('\n'), /README\.md/);
-  });
-});
-
-/** Como reescribirScript pero sin commit, para no barrer el README sucio del test. */
-async function reescribirScriptSinCommitear(repoRoot: string, contenido: string): Promise<void> {
-  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
-  git(['add', '--', 'scripts/sync.mjs'], repoRoot);
-  git(['commit', '-q', '-m', 'chore: script nuevo', '--', 'scripts/sync.mjs'], repoRoot);
-}
-
-// ─── Revision ronda 1: rutas que Git no puede commitear ────────────────────
-
-test('sincronizacion (revision IMP-1): una ruta declarada en .gitignore no aborta la transicion; queda fallida y el arbol limpio', async () => {
-  await withRepoSincronizado(
-    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/GEN.md]\n',
-    async (repoRoot, tareasRoot) => {
-      await writeFile(path.join(repoRoot, '.gitignore'), 'docs/GEN.md\n', 'utf8');
-      await reescribirScript(
-        repoRoot,
-        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/GEN.md', 'x\\n');\n"
-      );
-      const dir = await tocarTarea(tareasRoot);
-      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-      assert.equal(r.sincronizacion.estado, 'fallida');
-      assert.equal(r.commiteado, true, 'la tarea tiene que commitearse igual');
-      assert.match(r.avisos.join('\n'), /esta en \.gitignore/);
-      assert.equal(porcelain(repoRoot), '');
-    }
-  );
-});
-
-test('sincronizacion (revision IMP-1): una ruta declarada con otras mayusculas que el fichero real queda fallida y nombra el nombre real', async () => {
-  await withRepoSincronizado(
-    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/plan.md]\n',
-    async (repoRoot, tareasRoot) => {
-      const dir = await tocarTarea(tareasRoot);
-      const tareaMd = path.join(dir, 'tarea.md');
-      await writeFile(
-        tareaMd,
-        (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
-      );
-      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-      assert.equal(r.sincronizacion.estado, 'fallida');
-      assert.equal(r.commiteado, true);
-      assert.match(r.avisos.join('\n'), /se llama docs\/PLAN\.md/);
-      assert.equal(porcelain(repoRoot), '', 'el derivado se tenia que restaurar');
-    }
-  );
-});
-
-test('sincronizacion (revision MEN-2): un script que sale con 124 por su cuenta no se describe como timeout', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    await reescribirScript(repoRoot, 'process.exit(124);\n');
-    const dir = await tocarTarea(tareasRoot);
-    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-    assert.equal(r.sincronizacion.estado, 'fallida');
-    const aviso = r.avisos.join('\n');
-    assert.match(aviso, /salio con codigo 124/);
-    assert.doesNotMatch(aviso, /no termino en/);
-  });
-});
-
-test('sincronizacion (revision MEN-3): el timeout mata tambien al nieto; deja de escribir despues del corte', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    // El nieto escribe fuera del repo: asi no cuenta como ruta ajena y
-    // lo unico que mide el test es si sigue vivo.
-    const testigo = path.join(path.dirname(repoRoot), `${path.basename(repoRoot)}-nieto.txt`);
-    await reescribirScript(
-      repoRoot,
-      "import { spawn } from 'node:child_process';\n" +
-        `const testigo = ${JSON.stringify(testigo)};\n` +
-        "spawn(process.execPath, ['-e', \"const fs = require('fs'); fs.appendFileSync(process.argv[1], 'x'); setInterval(() => fs.appendFileSync(process.argv[1], 'x'), 50)\", testigo], { stdio: 'ignore' });\n" +
-        'setTimeout(() => {}, 60000);\n'
-    );
-    const dir = await tocarTarea(tareasRoot);
-    try {
-      const r = autoCommit({
-        cwd: repoRoot,
-        rutas: [dir],
-        mensaje: mensajeChore('TASK-920', 'x'),
-        sincronizacion: { timeoutMs: 8000 },
-      });
-      assert.equal(r.sincronizacion.estado, 'fallida');
-      await new Promise((ok) => setTimeout(ok, 500));
-      const tras = (await readFile(testigo, 'utf8')).length;
-      await new Promise((ok) => setTimeout(ok, 1000));
-      assert.equal((await readFile(testigo, 'utf8')).length, tras, 'el nieto sigue vivo');
-    } finally {
-      await rm(testigo, { force: true });
-    }
-  });
-});
-
-test('sincronizacion (revision 2, MENOR): el chequeo (a) ve trabajo sin commitear aunque la ruta declarada tenga otras mayusculas', async () => {
-  await withRepoSincronizado(
-    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/plan.md]\n',
-    async (repoRoot, tareasRoot) => {
-      await writeFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'edicion a mano\n', 'utf8');
-      const dir = await tocarTarea(tareasRoot);
-      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
-      assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
-      assert.equal(await planEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
-    }
-  );
-});
-
-// ─── finish: el caso sin retorno ───────────────────────────────────────────
-
-test('sincronizacion en finish: si el script falla tras el merge, la tarea queda cerrada y commiteada en develop y el arbol limpio', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
-    const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
-    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
-    await mkdir(path.join(tareasRoot, '03-en-revision'), { recursive: true });
-    git(['mv', 'tareas/01-en-diseno/TASK-920', 'tareas/03-en-revision/TASK-920'], repoRoot);
-    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
-    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
-    await mkdir(revisionDir, { recursive: true });
-    await writeFile(
-      path.join(revisionDir, 'informe-revision-1.md'),
-      '# Informe\n\n- Veredicto: aprobada\n',
-      'utf8'
-    );
-    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), 'process.exit(1);\n', 'utf8');
-    commitAll(repoRoot, 'feat(TASK-920): trabajo revisado');
-    const planAntes = await planEnDisco(repoRoot);
-
-    const r = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(r.autoCommit.sincronizacion.estado, 'fallida');
-    assert.equal(r.autoCommit.commiteado, true);
-    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
-    assert.ok(existsSync(path.join(tareasRoot, '04-terminadas', 'TASK-920', 'tarea.md')));
-    assert.equal(await planEnDisco(repoRoot), planAntes);
-    assert.equal(porcelain(repoRoot), '');
-  });
-});
-
-// ─── El codigo de salida del CLI real ──────────────────────────────────────
-
-test('taskctl (binario real): sale con 3 cuando la transicion se hizo pero la sincronizacion no, y con 0 cuando se aplico', async () => {
-  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot) => {
-    const ok = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
-      cwd: repoRoot,
-      encoding: 'utf8',
-      stdio: ['ignore', 'pipe', 'pipe'],
-    });
-    assert.equal(ok.status, 0, ok.stderr);
-
-    await reescribirScript(repoRoot, 'process.exit(1);\n');
-    const tareaMd = path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-920', 'tarea.md');
-    const contenido = await readFile(tareaMd, 'utf8');
-    await writeFile(tareaMd, contenido.replace('plan_aprobado: true', 'plan_aprobado: false'));
-    commitAll(repoRoot, 'chore: desaprobar para reintentar');
-
-    const mal = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
-      cwd: repoRoot,
-      encoding: 'utf8',
-      stdio: ['ignore', 'pipe', 'pipe'],
-    });
-    assert.equal(mal.status, CODIGO_SINCRONIZACION_NO_APLICADA, mal.stderr);
-    assert.match(mal.stderr, /\[AVISO\] La sincronizacion "node scripts\/sync\.mjs" salio con codigo 1/);
-    assert.match(mal.stdout, /aprobada/);
-    assert.equal(porcelain(repoRoot), '');
-  });
-});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-asignacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-asignacion.test.ts
new file mode 100644
index 0000000..904a9dd
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-asignacion.test.ts
@@ -0,0 +1,130 @@
+/**
+ * Test de integracion real (no mocks) para taskctl start (TASK-009):
+ * monta un repo Git temporal de verdad (main/develop), invoca los
+ * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
+ * con evidencia (git branch --show-current, ubicacion real del
+ * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
+ * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
+ * relleno" (principio de PLAN_SPRINTS.md).
+ */
+// Parte de los tests de start (ver test/helpers/start-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
+import { TaskFolderConflictError } from '../../src/fs/task-store.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+} from '../helpers/start-fixtures.js';
+
+// --- item B6: --asignado-a ---
+
+test('taskctl start --asignado-a: crea la rama Y deja asignado_a escrito en el frontmatter', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\
+Probar start.\
+');
+    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'carlos'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'carlos');
+    assert.equal(result.asignadoCambiado, true);
+    // Evidencia real de Git: la rama existe de verdad, no solo el
+    // campo escrito.
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
+
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.asignado_a, 'carlos');
+    assert.equal(read?.task.estado, 'en-curso');
+  });
+});
+
+test('taskctl start: sin --asignado-a hereda el asignado_a que dejo plan', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Es el caso que describe la seccion 8.2: plan asigna, y start
+    // comprueba 'la persona asignada' sin volver a pedirla.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
+    commitAll(repoRoot, 'tarea(TASK-500): asignada en plan');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'ana');
+    assert.equal(result.asignadoCambiado, false);
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.asignado_a, 'ana');
+  });
+});
+
+test('taskctl start --asignado-a: reasigna sobre lo que dejo plan', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
+    commitAll(repoRoot, 'tarea(TASK-500): asignada a ana');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a=carlos'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'carlos');
+    assert.equal(result.asignadoCambiado, true);
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.asignado_a, 'carlos');
+  });
+});
+
+test('taskctl start --asignado-a invalido: falla ANTES de crear la rama', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), '');
+    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500', '--asignado-a'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      StartCommandError
+    );
+
+    // Lo que de verdad importa del orden: la rama NO llego a
+    // crearse. Si el flag se validara despues del script de
+    // Git-Flow, quedaria una rama huerfana por cada intento fallido.
+    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-500-prueba-de-integracion'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.equal(ramas.stdout.trim(), '');
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'develop');
+
+    // Y la tarea sigue en 01-en-diseno, sin tocar.
+    await stat(path.join(tareasRoot, '01-en-diseno', 'TASK-500', 'tarea.md'));
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.estado, 'en-diseno');
+    assert.equal(read?.task.asignado_a, null);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-basico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-basico.test.ts
new file mode 100644
index 0000000..a261217
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-basico.test.ts
@@ -0,0 +1,300 @@
+/**
+ * Test de integracion real (no mocks) para taskctl start (TASK-009):
+ * monta un repo Git temporal de verdad (main/develop), invoca los
+ * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
+ * con evidencia (git branch --show-current, ubicacion real del
+ * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
+ * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
+ * relleno" (principio de PLAN_SPRINTS.md).
+ */
+// Parte de los tests de start (ver test/helpers/start-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
+import { TaskFolderConflictError } from '../../src/fs/task-store.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+} from '../helpers/start-fixtures.js';
+
+test('taskctl start: crea la rama de verdad y mueve la tarea a 02-en-curso (tipo feature)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar start.\n');
+    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-500');
+    assert.equal(result.rama, 'feature/task-500-prueba-de-integracion');
+    assert.match(result.filePath, /02-en-curso[/\\]TASK-500[/\\]tarea\.md$/);
+
+    // Evidencia real de Git, no solo el valor devuelto por el comando.
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
+
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.estado, 'en-curso');
+    assert.equal(read?.task.actualizado, '2026-09-04');
+
+    // La carpeta vieja (01-en-diseno) no debe seguir existiendo.
+    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-500')));
+  });
+});
+
+for (const tipo of ['fix', 'hotfix', 'release'] as const) {
+  test(`taskctl start: tambien funciona para tipo "${tipo}" (repo sin origin)`, async () => {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      const task = sampleTask({
+        id: 'TASK-501',
+        tipo,
+        rama: `${tipo}/task-501-prueba-${tipo}`,
+      });
+      await writeTareaFile(tareasRoot, task, '');
+      commitAll(repoRoot, 'tarea(TASK-501): plan aprobado');
+
+      const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-04', {
+        repoCwd: repoRoot,
+        scriptsDir: SCRIPTS_DIR,
+      });
+
+      assert.equal(result.rama, `${tipo}/task-501-prueba-${tipo}`);
+      const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+      assert.equal(branch.stdout.trim(), `${tipo}/task-501-prueba-${tipo}`);
+
+      // No basta con que el comando no lance: hay que confirmar que la
+      // tarea de verdad quedo movida y con el contenido correcto (hallazgo
+      // de revision por pares, TASK-009 — este es justo el caso, hotfix,
+      // donde moveTareaFile necesito el fallback ENOENT porque Git ya
+      // habia borrado la carpeta vieja del working tree al cambiar de
+      // rama).
+      const read = await readTareaFile(tareasRoot, 'TASK-501');
+      assert.ok(read !== null, 'la tarea deberia poder releerse tras start');
+      assert.equal(read?.task.estado, 'en-curso');
+      assert.equal(read?.task.actualizado, '2026-09-04');
+      assert.match(read?.filePath ?? '', /02-en-curso[/\\]TASK-501[/\\]tarea\.md$/);
+    });
+  });
+}
+
+test('taskctl start: rechaza un task.rama invalido para Git antes de invocar el script', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ rama: 'rama con espacios' }), '');
+    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      StartCommandError
+    );
+
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'develop');
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.estado, 'en-diseno');
+  });
+});
+
+test('taskctl start: si el script de Git-Flow falla (codigo != 0), no mueve la tarea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), '');
+    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+
+    // Para forzar un fallo genuino del script (no simulado con mocks),
+    // apuntamos runStartCommand a un scriptsDir con un create-feature.sh
+    // que siempre termina en un codigo de error real.
+    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-scripts-'));
+    await writeFile(
+      path.join(brokenScriptsDir, 'create-feature.sh'),
+      '#!/usr/bin/env bash\nexit 7\n',
+      'utf8'
+    );
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
+          repoCwd: repoRoot,
+          scriptsDir: brokenScriptsDir,
+        }),
+      StartCommandError
+    );
+
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.estado, 'en-diseno');
+    await rm(brokenScriptsDir, { recursive: true, force: true });
+  });
+});
+
+test('taskctl start: si el script termina con codigo 0 pero la rama activa no coincide, no mueve la tarea (evidencia, no suposicion)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), '');
+    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+
+    // Script "malicioso/con bug": termina en codigo 0 sin haber creado
+    // ni cambiado a la rama pedida. runStartCommand debe detectarlo con
+    // git branch --show-current en vez de fiarse solo del exit code.
+    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-scripts-'));
+    await writeFile(
+      path.join(fakeScriptsDir, 'create-feature.sh'),
+      '#!/usr/bin/env bash\nexit 0\n',
+      'utf8'
+    );
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
+          repoCwd: repoRoot,
+          scriptsDir: fakeScriptsDir,
+        }),
+      StartCommandError
+    );
+
+    // La rama activa sigue siendo develop (el script fake no la cambio).
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'develop');
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.estado, 'en-diseno');
+    await rm(fakeScriptsDir, { recursive: true, force: true });
+  });
+});
+
+test('taskctl start: rechaza una tarea en "planificada" (no ha pasado por plan) sin tocar Git ni mover nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'planificada' }), '');
+
+    await assert.rejects(
+      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      StateMachineError
+    );
+
+    // No debe haberse creado ninguna rama nueva.
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'develop');
+    // La tarea sigue en 00-planificadas, no se movio.
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.estado, 'planificada');
+  });
+});
+
+test('taskctl start: rechaza una tarea de complejidad media sin plan_aprobado', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ complejidad: 'media', plan_aprobado: false }),
+      ''
+    );
+
+    await assert.rejects(
+      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      StateMachineError
+    );
+  });
+});
+
+// --- checkpoint humano obligatorio para TODAS las complejidades ------
+// Decision #1 de la seccion 14, implementada en TASK-016. Antes
+// `trivial` y `simple` estaban eximidas y arrancaban sin pasar por
+// "approve"; estos dos tests fijan la inversion de esa expectativa. El
+// par importa: sin el segundo, romper "start" entero (que rechazara
+// SIEMPRE) daria el mismo verde que implementar la regla bien.
+
+for (const complejidad of ['trivial', 'simple'] as const) {
+  test(`taskctl start: ${complejidad} SIN plan_aprobado se rechaza (el checkpoint ya no exime a nadie)`, async () => {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(tareasRoot, sampleTask({ complejidad, plan_aprobado: false }), '');
+      commitAll(repoRoot, 'tarea(TASK-500): sin aprobar');
+
+      await assert.rejects(
+        () =>
+          runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
+            repoCwd: repoRoot,
+            scriptsDir: SCRIPTS_DIR,
+          }),
+        (e: unknown) => {
+          assert.ok(e instanceof StateMachineError);
+          assert.match(e.message, /taskctl approve/);
+          return true;
+        }
+      );
+
+      // No se movio ni se creo la rama: el rechazo es antes de tocar Git.
+      const read = await readTareaFile(tareasRoot, 'TASK-500');
+      assert.equal(read?.task.estado, 'en-diseno');
+      assert.equal(
+        spawnSync('git', ['branch', '--show-current'], {
+          cwd: repoRoot,
+          encoding: 'utf8',
+        }).stdout.trim(),
+        'develop'
+      );
+    });
+  });
+
+  test(`taskctl start: ${complejidad} CON plan_aprobado arranca con normalidad`, async () => {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(tareasRoot, sampleTask({ complejidad, plan_aprobado: true }), '');
+      commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+
+      const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
+        repoCwd: repoRoot,
+        scriptsDir: SCRIPTS_DIR,
+      });
+
+      assert.equal(result.rama, 'feature/task-500-prueba-de-integracion');
+      const read = await readTareaFile(tareasRoot, 'TASK-500');
+      assert.equal(read?.task.estado, 'en-curso');
+    });
+  });
+}
+
+test('taskctl start: rechaza si el workspace tiene cambios sin commitear, sin invocar el script', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), '');
+    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+    // Ensucia el workspace DESPUES de dejar la tarea commiteada, para
+    // aislar especificamente el caso "hay cambios sin commitear" del
+    // caso (ya cubierto arriba) de que la propia tarea.md este sin
+    // commitear.
+    await writeFile(path.join(repoRoot, 'sucio.txt'), 'cambios sin commitear\n', 'utf8');
+
+    await assert.rejects(
+      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      StartCommandError
+    );
+
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'develop');
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.estado, 'en-diseno');
+  });
+});
+
+test('taskctl start: error claro si el ID no existe, sin efectos secundarios', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await assert.rejects(
+      () => runStartCommand(tareasRoot, ['TASK-999'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      StateMachineError
+    );
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-identidad.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-identidad.test.ts
new file mode 100644
index 0000000..e6e97a9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-identidad.test.ts
@@ -0,0 +1,194 @@
+/**
+ * Test de integracion real (no mocks) para taskctl start (TASK-009):
+ * monta un repo Git temporal de verdad (main/develop), invoca los
+ * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
+ * con evidencia (git branch --show-current, ubicacion real del
+ * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
+ * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
+ * relleno" (principio de PLAN_SPRINTS.md).
+ */
+// Parte de los tests de start (ver test/helpers/start-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
+import { TaskFolderConflictError } from '../../src/fs/task-store.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+} from '../helpers/start-fixtures.js';
+
+// --- TASK-024 (item C7): identidad Git como asignado_a por defecto ---
+
+test('taskctl start: una tarea sin asignar se autoasigna a la identidad Git', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    commitAll(repoRoot, 'tarea sin asignar');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // withTempRepo configura user.email como test@example.com.
+    assert.equal(result.asignadoA, 'test@example.com');
+    assert.equal(result.asignadoCambiado, true);
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.asignado_a, 'test@example.com');
+  });
+});
+
+test('taskctl start: la identidad Git NO roba la tarea de otra persona', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // El asignado previo gana a la identidad de quien ejecuta. Sin
+    // esto, arrancar la tarea de otra persona se la quedaria en
+    // silencio y el limite de WIP se comprobaria contra la persona
+    // equivocada.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
+    commitAll(repoRoot, 'tarea de ana');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'ana@example.com');
+    assert.equal(result.asignadoCambiado, false);
+  });
+});
+
+test('taskctl start --asignado-a: el flag gana a la identidad Git', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    commitAll(repoRoot, 'tarea sin asignar');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'otra@example.com'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'otra@example.com');
+  });
+});
+
+test('taskctl start: dos tareas sin asignar de la misma identidad chocan DENTRO de la misma rama', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Antes de TASK-024 ninguna de las dos tenia asignado_a, asi que
+    // el limite no miraba nada. Ahora la primera se queda con la
+    // identidad Git y la segunda choca contra ella.
+    //
+    // OJO con lo que este test NO demuestra (hallazgo de revision por
+    // pares, TASK-024): aqui las dos invocaciones ocurren sin volver a
+    // la rama base, y por eso la segunda ve a la primera en
+    // 02-en-curso. En el flujo real, plan/new devuelven el repo a
+    // develop — donde ese movimiento no esta commiteado — y el limite
+    // NO se dispara. TASK-024 rellena asignado_a, que es condicion
+    // necesaria pero no suficiente; lo otro se arregla aparte.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-501', asignado_a: null, rama: 'feature/task-501-segunda' }), '');
+    commitAll(repoRoot, 'dos tareas sin asignar');
+
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'la primera en curso');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof StartCommandError &&
+        (err as Error).message.includes('TASK-500') &&
+        (err as Error).message.includes('test@example.com')
+    );
+  });
+});
+
+// --- correcciones de la revision por pares de TASK-024 ---
+
+test('taskctl start: una identidad Git invalida no corrompe el frontmatter (CRITICO)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    commitAll(repoRoot, 'tarea sin asignar');
+    // El salto de linea inyectaba una clave que pisaba 'estado'.
+    git(['config', 'user.email', 'ana@x.com\nestado: terminada # '], repoRoot);
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, null);
+    assert.ok(result.avisoIdentidad?.includes('saltos de linea'), String(result.avisoIdentidad));
+    // Evidencia real: la tarea se relee y su estado es el correcto.
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.estado, 'en-curso');
+    assert.equal(read?.task.asignado_a, null);
+  });
+});
+
+test('taskctl start: avisa cuando arranca una tarea asignada a otra persona', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Quien abre la rama puede no ser quien planifico. No se cambia la
+    // semantica (la tarea sigue siendo de ana), pero se dice en voz alta.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
+    commitAll(repoRoot, 'tarea de ana');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'ana@example.com');
+    assert.ok(result.avisoAtribucion?.includes('ana@example.com'), String(result.avisoAtribucion));
+    assert.ok(result.avisoAtribucion?.includes('test@example.com'), String(result.avisoAtribucion));
+  });
+});
+
+test('taskctl start: no avisa de atribucion cuando la tarea ya es tuya', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'test@example.com' }), '');
+    commitAll(repoRoot, 'tarea propia');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.avisoAtribucion, null);
+  });
+});
+
+test('taskctl start --asignado-a: pasar el flag silencia el aviso de atribucion', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
+    commitAll(repoRoot, 'tarea de ana');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana@example.com'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // Ha sido una decision explicita, no un descuido: no hay nada que avisar.
+    assert.equal(result.avisoAtribucion, null);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-wip-ramas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-wip-ramas.test.ts
new file mode 100644
index 0000000..629fcbc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-wip-ramas.test.ts
@@ -0,0 +1,214 @@
+/**
+ * Test de integracion real (no mocks) para taskctl start (TASK-009):
+ * monta un repo Git temporal de verdad (main/develop), invoca los
+ * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
+ * con evidencia (git branch --show-current, ubicacion real del
+ * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
+ * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
+ * relleno" (principio de PLAN_SPRINTS.md).
+ */
+// Parte de los tests de start (ver test/helpers/start-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
+import { TaskFolderConflictError } from '../../src/fs/task-store.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+} from '../helpers/start-fixtures.js';
+
+// --- TASK-025 (item C8): el limite ve las ramas de trabajo ---
+
+test('taskctl start: bloquea aunque la tarea en curso solo exista en SU rama (el fallo de B7)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Este es el caso que B7 no cubria y que su smoke test no vio.
+    // Se reproduce el flujo REAL: se arranca la primera tarea, se
+    // commitea su movimiento EN SU RAMA, y se vuelve a develop — que
+    // es lo que hacen plan/new/import — antes de arrancar la segunda.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
+      ''
+    );
+    commitAll(repoRoot, 'dos tareas de carlos en diseno');
+
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'TASK-500 en curso, EN SU RAMA');
+    // De vuelta a la rama base: aqui TASK-500 sigue en 01-en-diseno.
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof StartCommandError &&
+        (err as Error).message.includes('TASK-500') &&
+        (err as Error).message.includes('feature/task-500-prueba-de-integracion')
+    );
+
+    // Y no se ha creado la rama de la segunda.
+    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-501-segunda'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.equal(ramas.stdout.trim(), '');
+  });
+});
+
+test('taskctl start: una rama YA MERGEADA no bloquea, aunque siga viva', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Politica IECA: las ramas no se borran tras el merge. Sin el
+    // filtro de mergeadas, cada tarea cerrada bloquearia para siempre.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
+      ''
+    );
+    commitAll(repoRoot, 'dos tareas de carlos');
+
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'TASK-500 en curso');
+    // Se mergea la rama a develop, pero NO se borra.
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '--no-ff', '-q', '-m', 'merge de TASK-500', 'feature/task-500-prueba-de-integracion'], repoRoot);
+
+    // Ahora TASK-500 SI esta en 02-en-curso en develop, asi que se
+    // mueve a terminadas para aislar lo que este test comprueba: que
+    // la RAMA mergeada no cuenta.
+    const enCurso = (await readTareaFile(tareasRoot, 'TASK-500'))!;
+    await moveTareaFile(tareasRoot, enCurso.filePath, { ...enCurso.task, estado: 'terminada' }, enCurso.body);
+    commitAll(repoRoot, 'TASK-500 terminada');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-501');
+  });
+});
+
+test('taskctl start: la rama de OTRA persona no bloquea, aunque este abierta', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-de-carlos' }),
+      ''
+    );
+    commitAll(repoRoot, 'una de ana y una de carlos');
+
+    // Ana abre su rama y la deja abierta.
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'la de ana en curso');
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    // Carlos arranca la suya: la rama abierta de Ana no le afecta.
+    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-501');
+    assert.equal(result.asignadoA, 'carlos@example.com');
+  });
+});
+
+test('taskctl start: reintentar una tarea cuya rama ya existe no la bloquea contra si misma', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // La rama existe y no esta mergeada, y su arbol tiene la tarea en
+    // 02-en-curso: sin excluirla por ID, el reintento se bloquearia a
+    // si mismo y no habria forma de salir.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
+    commitAll(repoRoot, 'tarea de carlos');
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'en curso en su rama');
+
+    // Se simula el reintento: se vuelve a develop y se deja la tarea
+    // otra vez en 01-en-diseno, con la rama ya creada.
+    git(['checkout', '-q', 'develop'], repoRoot);
+    const enDiseno = (await readTareaFile(tareasRoot, 'TASK-500'))!;
+    assert.equal(enDiseno.task.estado, 'en-diseno');
+
+    // El limite NO se dispara: la tarea no se bloquea a si misma
+    // aunque su propia rama este abierta y tenga la tarea en curso.
+    // El reintento si muere, pero por otra cosa y preexistente: el
+    // checkout a la rama ya creada trae consigo la carpeta
+    // 02-en-curso/TASK-500, y moveTareaFile se niega a pisarla. Lo
+    // que este test fija es que el error NO es del limite de WIP.
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof TaskFolderConflictError &&
+        !(err as Error).message.includes('sin cerrar')
+    );
+  });
+});
+
+test('taskctl start: un tarea.md roto en OTRA rama avisa, pero no bloquea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Hallazgo IMPORTANTE de revision por pares: al pasar a escanear
+    // ramas, un fichero corrupto en cualquier rama ajena o abandonada
+    // dejaba a TODO el mundo sin poder arrancar nada, y el remedio
+    // ('arregla su frontmatter') era inaplicable sin hacer checkout de
+    // esa rama. El coste de la duda lo pagaba quien no la creo.
+    git(['checkout', '-q', '-b', 'feature/experimento-de-otro'], repoRoot);
+    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-777');
+    await mkdir(rota, { recursive: true });
+    await writeFile(path.join(rota, 'tarea.md'), 'basura', 'utf8');
+    commitAll(repoRoot, 'una tarea rota en una rama ajena');
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
+    commitAll(repoRoot, 'tarea de carlos');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // Arranca...
+    assert.equal(result.id, 'TASK-500');
+    // ...pero lo dice, con la rama delante para poder llegar al fichero.
+    assert.equal(result.avisosWip.length, 1);
+    assert.ok(result.avisosWip[0]?.includes('TASK-777'), result.avisosWip[0]);
+    assert.ok(result.avisosWip[0]?.includes('experimento-de-otro'), result.avisosWip[0]);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-wip.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-wip.test.ts
new file mode 100644
index 0000000..918d67a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-wip.test.ts
@@ -0,0 +1,341 @@
+/**
+ * Test de integracion real (no mocks) para taskctl start (TASK-009):
+ * monta un repo Git temporal de verdad (main/develop), invoca los
+ * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
+ * con evidencia (git branch --show-current, ubicacion real del
+ * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
+ * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
+ * relleno" (principio de PLAN_SPRINTS.md).
+ */
+// Parte de los tests de start (ver test/helpers/start-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
+import { TaskFolderConflictError } from '../../src/fs/task-store.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+} from '../helpers/start-fixtures.js';
+
+// --- TASK-015 (item B7): limite de trabajo en curso ---
+
+// El cableado del limite configurable (TASK-030, item C4) vive aqui y
+// no en config.test.ts a proposito: los tests de alli son puros sobre
+// tareasQueBloquean y pasaban igual con start.ts sin cablear — el
+// hallazgo IMPORTANTE de la revision por pares fue justo ese, que
+// deshacer la linea de start.ts no rompia ni un test. Esto pasa por
+// runStartCommand de verdad.
+
+test('taskctl start: limite_wip de .taskcode/config.yml manda de verdad (no solo en wip.ts)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-511', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-511-ya-abierta', titulo: 'La que ocupa hueco' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-512', asignado_a: 'carlos' }), '');
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'limite_wip: 2\n', 'utf8');
+    commitAll(repoRoot, 'tareas y config con limite 2');
+
+    // Con limite 2 cabe una segunda tarea: arranca y crea su rama.
+    const r = await runStartCommand(tareasRoot, ['TASK-512'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.equal(r.id, 'TASK-512');
+    assert.equal(
+      spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim(),
+      r.rama
+    );
+  });
+});
+
+test('taskctl start: con limite_wip 1 explicito en la config bloquea igual que sin fichero', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-521', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-521-ya-abierta', titulo: 'La que bloquea' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-522', asignado_a: 'carlos' }), '');
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'limite_wip: 1\n', 'utf8');
+    commitAll(repoRoot, 'tareas y config con limite 1');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-522'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => e instanceof StartCommandError && (e as Error).message.includes('TASK-521')
+    );
+  });
+});
+
+test('taskctl start: bloquea si la persona ya tiene otra tarea en curso, y NO crea la rama', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Una tarea de carlos ya en curso, con su rama abierta.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-501-ya-abierta', titulo: 'La que bloquea' }),
+      ''
+    );
+    // Y la que carlos intenta arrancar ahora.
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-502', asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'tareas de carlos');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-502'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) =>
+        e instanceof StartCommandError &&
+        (e as Error).message.includes('TASK-501') &&
+        (e as Error).message.includes('carlos')
+    );
+
+    // Lo que de verdad importa: no queda una rama huerfana ni la
+    // tarea movida a medias.
+    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-500-prueba-de-integracion'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.equal(ramas.stdout.trim(), '');
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'develop');
+    const read = await readTareaFile(tareasRoot, 'TASK-502');
+    assert.equal(read?.task.estado, 'en-diseno');
+  });
+});
+
+test('taskctl start: una tarea en revision tambien bloquea (la rama sigue abierta)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-revision', asignado_a: 'carlos', rama: 'feature/task-501-en-revision' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-502', asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'carlos con una en revision');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-502'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) =>
+        e instanceof StartCommandError && (e as Error).message.includes('03-en-revision')
+    );
+  });
+});
+
+test('taskctl start: la tarea en curso de OTRA persona no bloquea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'ana', rama: 'feature/task-501-de-ana' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'tareas de dos personas');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'carlos');
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
+  });
+});
+
+test('taskctl start: sin identidad Git configurada, la tarea sigue sin asignar y no comprueba limite', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Comportamiento anterior a TASK-024, que se conserva cuando no
+    // hay identidad. Se vacia user.email DESPUES de los commits (que
+    // la necesitan): asi el repo no hereda tampoco la identidad
+    // global de la maquina, que haria el test no determinista.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: null, rama: 'feature/task-501-sin-duenno' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    commitAll(repoRoot, 'tareas sin asignar');
+    git(['config', 'user.email', ''], repoRoot);
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, null);
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
+  });
+});
+
+test('taskctl start --asignado-a: el limite se comprueba a la persona NUEVA, no a la anterior', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // ana tiene una en curso; la tarea que arranca esta asignada a
+    // carlos, pero se reasigna a ana en el propio start. Si el
+    // limite se comprobara con el asignado ANTERIOR (carlos), esto
+    // pasaria y dejaria a ana con dos ramas abiertas.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'ana', rama: 'feature/task-501-de-ana' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'ana ocupada, tarea de carlos');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) =>
+        e instanceof StartCommandError &&
+        (e as Error).message.includes('ana') &&
+        (e as Error).message.includes('TASK-501')
+    );
+  });
+});
+
+test('taskctl start --asignado-a: reasignar a alguien libre desbloquea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // La salida que ofrece el mensaje de error: reasignar. Si no
+    // funcionara, el consejo del mensaje seria mentira.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-501-de-carlos' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'carlos ocupado');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'ana');
+    assert.equal(result.asignadoCambiado, true);
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.asignado_a, 'ana');
+  });
+});
+
+test('taskctl start: un tarea.md ilegible en las carpetas de ejecucion aborta (fail-closed)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // No se sabe de quien es esa tarea: podria ser justo la que
+    // bloquea. Dejar pasar aqui abriria una segunda rama.
+    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-599');
+    await mkdir(rota, { recursive: true });
+    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'una tarea rota en curso');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof StartCommandError && (err as Error).message.includes('TASK-599')
+    );
+  });
+});
+
+test('taskctl start: una tarea rota en 00-planificadas NO bloquea a nadie', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // El fail-closed se acota a las carpetas que ocupan hueco: una
+    // tarea rota en planificadas no puede tener una rama abierta.
+    const rota = path.join(tareasRoot, '00-planificadas', 'TASK-599');
+    await mkdir(rota, { recursive: true });
+    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'una tarea rota en planificadas');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-500');
+  });
+});
+
+// --- correcciones de la revision por pares de TASK-015 ---
+
+test('taskctl start: un error de disco al comprobar el limite sale como StartCommandError', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // 02-en-curso como FICHERO en vez de carpeta: readdir da
+    // ENOTDIR. Sin envolverlo, escapaba como Error crudo y el usuario
+    // lo veia como 'taskctl no pudo arrancar', que es falso.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    await writeFile(path.join(tareasRoot, '02-en-curso'), 'no soy una carpeta', 'utf8');
+    commitAll(repoRoot, 'un fichero donde deberia haber una carpeta');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof StartCommandError &&
+        (err as Error).message.includes('limite de trabajo en curso')
+    );
+  });
+});
+
+test('taskctl start: el mensaje nombra la carpeta donde ESTA la bloqueante', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Tarea fisicamente en 02-en-curso pero con estado terminada en
+    // su frontmatter: bloquea (bien), y el mensaje debe mandar a
+    // 02-en-curso, no a 04-terminadas, donde no hay nada.
+    const dir = path.join(tareasRoot, '02-en-curso', 'TASK-501');
+    await mkdir(dir, { recursive: true });
+    const incoherente = sampleTask({ id: 'TASK-501', estado: 'terminada', asignado_a: 'carlos', rama: 'feature/task-501-incoherente' });
+    await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(incoherente, ''), 'utf8');
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'una tarea con carpeta y estado incoherentes');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof StartCommandError &&
+        (err as Error).message.includes('02-en-curso') &&
+        !(err as Error).message.includes('04-terminadas')
+    );
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
deleted file mode 100644
index 9fd4e3a..0000000
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
+++ /dev/null
@@ -1,1110 +0,0 @@
-/**
- * Test de integracion real (no mocks) para taskctl start (TASK-009):
- * monta un repo Git temporal de verdad (main/develop), invoca los
- * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
- * con evidencia (git branch --show-current, ubicacion real del
- * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
- * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
- * relleno" (principio de PLAN_SPRINTS.md).
- */
-import { test } from 'node:test';
-import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
-import { tmpdir } from 'node:os';
-import path from 'node:path';
-import { fileURLToPath } from 'node:url';
-import { spawnSync } from 'node:child_process';
-import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
-import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
-import { serializeTareaFile } from '../../src/core/tarea-file.js';
-import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
-import { TaskFolderConflictError } from '../../src/fs/task-store.js';
-import { StateMachineError } from '../../src/core/state-machine.js';
-import type { Task } from '../../src/core/task.js';
-
-const HERE = path.dirname(fileURLToPath(import.meta.url));
-// dist/test/commands -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
-const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
-
-function sampleTask(overrides: Partial<Task> = {}): Task {
-  return {
-    id: 'TASK-500',
-    titulo: 'Tarea de prueba de integracion',
-    tipo: 'feature',
-    sprint: 1,
-    etiquetas: [],
-    complejidad: 'simple',
-    modelo_sugerido: 'sonnet',
-    estado: 'en-diseno',
-    // true desde TASK-016. Hasta entonces era false y la tarea
-    // arrancaba igual, porque `simple` estaba eximida del checkpoint
-    // humano; ahora el checkpoint es obligatorio para las cinco
-    // complejidades (seccion 14, punto 1) y una tarea sin aprobar ya no
-    // representa el caso normal de "start", sino el que se rechaza.
-    // Ese rechazo lo cubren dos tests propios mas abajo.
-    plan_aprobado: true,
-    rama: 'feature/task-500-prueba-de-integracion',
-    asignado_a: null,
-    agente_revisor: 'general-purpose',
-    skills_recomendados: [],
-    regla_seleccion_skill: null,
-    ultimo_commit_revisado: null,
-    revision_codex: false,
-    creado: '2026-09-03',
-    actualizado: '2026-09-03',
-    dependencias: [],
-    ...overrides,
-  };
-}
-
-function git(args: string[], cwd: string): void {
-  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
-  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
-}
-
-/**
- * writeTareaFile deja tareas/.../tarea.md sin commitear (es solo I/O de
- * disco, no toca Git). En uso real esa tarea.md ya estaria commiteada
- * (viene de un "taskctl plan"/"approve" previo) antes de que alguien
- * ejecute start, asi que los tests que prueban el camino feliz la
- * commitean aqui para dejar el workspace limpio antes de invocar
- * runStartCommand, igual que estaria en un uso real.
- */
-/**
- * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
- * lo que el mismo escribe, asi que llamar a esto justo despues de un
- * comando puede no tener ya nada que registrar: `git commit` sale 1
- * con "nothing to commit" y el assert de `git()` lo daria por fallo
- * del test. Se commitea solo si queda algo — y que no quede es
- * exactamente la senal de que el auto-commit hizo su trabajo.
- */
-function commitAll(repoRoot: string, message: string): void {
-  git(['add', '-A'], repoRoot);
-  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
-  git(['commit', '-q', '-m', message], repoRoot);
-}
-
-// Repo base montado una vez por fichero y copiado en cada test
-// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
-const withTempRepo: ConRepo = plantillaRepo('taskctl-start-', async (repoRoot) => {
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    // Igual que en scripts/gitflow/test/smoke-test.sh: logs/ tiene que
-    // estar en .gitignore ANTES del primer commit, o el propio uso de
-    // Git-Flow se autobloquea (hallazgo 2 de TASK-007).
-    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
-    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'inicial'], repoRoot);
-    git(['checkout', '-q', '-b', 'develop'], repoRoot);
-});
-
-test('taskctl start: crea la rama de verdad y mueve la tarea a 02-en-curso (tipo feature)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar start.\n');
-    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.id, 'TASK-500');
-    assert.equal(result.rama, 'feature/task-500-prueba-de-integracion');
-    assert.match(result.filePath, /02-en-curso[/\\]TASK-500[/\\]tarea\.md$/);
-
-    // Evidencia real de Git, no solo el valor devuelto por el comando.
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
-
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.estado, 'en-curso');
-    assert.equal(read?.task.actualizado, '2026-09-04');
-
-    // La carpeta vieja (01-en-diseno) no debe seguir existiendo.
-    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-500')));
-  });
-});
-
-for (const tipo of ['fix', 'hotfix', 'release'] as const) {
-  test(`taskctl start: tambien funciona para tipo "${tipo}" (repo sin origin)`, async () => {
-    await withTempRepo(async (repoRoot, tareasRoot) => {
-      const task = sampleTask({
-        id: 'TASK-501',
-        tipo,
-        rama: `${tipo}/task-501-prueba-${tipo}`,
-      });
-      await writeTareaFile(tareasRoot, task, '');
-      commitAll(repoRoot, 'tarea(TASK-501): plan aprobado');
-
-      const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-04', {
-        repoCwd: repoRoot,
-        scriptsDir: SCRIPTS_DIR,
-      });
-
-      assert.equal(result.rama, `${tipo}/task-501-prueba-${tipo}`);
-      const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-      assert.equal(branch.stdout.trim(), `${tipo}/task-501-prueba-${tipo}`);
-
-      // No basta con que el comando no lance: hay que confirmar que la
-      // tarea de verdad quedo movida y con el contenido correcto (hallazgo
-      // de revision por pares, TASK-009 — este es justo el caso, hotfix,
-      // donde moveTareaFile necesito el fallback ENOENT porque Git ya
-      // habia borrado la carpeta vieja del working tree al cambiar de
-      // rama).
-      const read = await readTareaFile(tareasRoot, 'TASK-501');
-      assert.ok(read !== null, 'la tarea deberia poder releerse tras start');
-      assert.equal(read?.task.estado, 'en-curso');
-      assert.equal(read?.task.actualizado, '2026-09-04');
-      assert.match(read?.filePath ?? '', /02-en-curso[/\\]TASK-501[/\\]tarea\.md$/);
-    });
-  });
-}
-
-test('taskctl start: rechaza un task.rama invalido para Git antes de invocar el script', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ rama: 'rama con espacios' }), '');
-    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      StartCommandError
-    );
-
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'develop');
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.estado, 'en-diseno');
-  });
-});
-
-test('taskctl start: si el script de Git-Flow falla (codigo != 0), no mueve la tarea', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
-    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
-
-    // Para forzar un fallo genuino del script (no simulado con mocks),
-    // apuntamos runStartCommand a un scriptsDir con un create-feature.sh
-    // que siempre termina en un codigo de error real.
-    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-scripts-'));
-    await writeFile(
-      path.join(brokenScriptsDir, 'create-feature.sh'),
-      '#!/usr/bin/env bash\nexit 7\n',
-      'utf8'
-    );
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
-          repoCwd: repoRoot,
-          scriptsDir: brokenScriptsDir,
-        }),
-      StartCommandError
-    );
-
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.estado, 'en-diseno');
-    await rm(brokenScriptsDir, { recursive: true, force: true });
-  });
-});
-
-test('taskctl start: si el script termina con codigo 0 pero la rama activa no coincide, no mueve la tarea (evidencia, no suposicion)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
-    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
-
-    // Script "malicioso/con bug": termina en codigo 0 sin haber creado
-    // ni cambiado a la rama pedida. runStartCommand debe detectarlo con
-    // git branch --show-current en vez de fiarse solo del exit code.
-    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-scripts-'));
-    await writeFile(
-      path.join(fakeScriptsDir, 'create-feature.sh'),
-      '#!/usr/bin/env bash\nexit 0\n',
-      'utf8'
-    );
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
-          repoCwd: repoRoot,
-          scriptsDir: fakeScriptsDir,
-        }),
-      StartCommandError
-    );
-
-    // La rama activa sigue siendo develop (el script fake no la cambio).
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'develop');
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.estado, 'en-diseno');
-    await rm(fakeScriptsDir, { recursive: true, force: true });
-  });
-});
-
-test('taskctl start: rechaza una tarea en "planificada" (no ha pasado por plan) sin tocar Git ni mover nada', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'planificada' }), '');
-
-    await assert.rejects(
-      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
-      StateMachineError
-    );
-
-    // No debe haberse creado ninguna rama nueva.
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'develop');
-    // La tarea sigue en 00-planificadas, no se movio.
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.estado, 'planificada');
-  });
-});
-
-test('taskctl start: rechaza una tarea de complejidad media sin plan_aprobado', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ complejidad: 'media', plan_aprobado: false }),
-      ''
-    );
-
-    await assert.rejects(
-      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
-      StateMachineError
-    );
-  });
-});
-
-// --- checkpoint humano obligatorio para TODAS las complejidades ------
-// Decision #1 de la seccion 14, implementada en TASK-016. Antes
-// `trivial` y `simple` estaban eximidas y arrancaban sin pasar por
-// "approve"; estos dos tests fijan la inversion de esa expectativa. El
-// par importa: sin el segundo, romper "start" entero (que rechazara
-// SIEMPRE) daria el mismo verde que implementar la regla bien.
-
-for (const complejidad of ['trivial', 'simple'] as const) {
-  test(`taskctl start: ${complejidad} SIN plan_aprobado se rechaza (el checkpoint ya no exime a nadie)`, async () => {
-    await withTempRepo(async (repoRoot, tareasRoot) => {
-      await writeTareaFile(tareasRoot, sampleTask({ complejidad, plan_aprobado: false }), '');
-      commitAll(repoRoot, 'tarea(TASK-500): sin aprobar');
-
-      await assert.rejects(
-        () =>
-          runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
-            repoCwd: repoRoot,
-            scriptsDir: SCRIPTS_DIR,
-          }),
-        (e: unknown) => {
-          assert.ok(e instanceof StateMachineError);
-          assert.match(e.message, /taskctl approve/);
-          return true;
-        }
-      );
-
-      // No se movio ni se creo la rama: el rechazo es antes de tocar Git.
-      const read = await readTareaFile(tareasRoot, 'TASK-500');
-      assert.equal(read?.task.estado, 'en-diseno');
-      assert.equal(
-        spawnSync('git', ['branch', '--show-current'], {
-          cwd: repoRoot,
-          encoding: 'utf8',
-        }).stdout.trim(),
-        'develop'
-      );
-    });
-  });
-
-  test(`taskctl start: ${complejidad} CON plan_aprobado arranca con normalidad`, async () => {
-    await withTempRepo(async (repoRoot, tareasRoot) => {
-      await writeTareaFile(tareasRoot, sampleTask({ complejidad, plan_aprobado: true }), '');
-      commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
-
-      const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
-        repoCwd: repoRoot,
-        scriptsDir: SCRIPTS_DIR,
-      });
-
-      assert.equal(result.rama, 'feature/task-500-prueba-de-integracion');
-      const read = await readTareaFile(tareasRoot, 'TASK-500');
-      assert.equal(read?.task.estado, 'en-curso');
-    });
-  });
-}
-
-test('taskctl start: rechaza si el workspace tiene cambios sin commitear, sin invocar el script', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
-    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
-    // Ensucia el workspace DESPUES de dejar la tarea commiteada, para
-    // aislar especificamente el caso "hay cambios sin commitear" del
-    // caso (ya cubierto arriba) de que la propia tarea.md este sin
-    // commitear.
-    await writeFile(path.join(repoRoot, 'sucio.txt'), 'cambios sin commitear\n', 'utf8');
-
-    await assert.rejects(
-      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
-      StartCommandError
-    );
-
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'develop');
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.estado, 'en-diseno');
-  });
-});
-
-test('taskctl start: error claro si el ID no existe, sin efectos secundarios', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await assert.rejects(
-      () => runStartCommand(tareasRoot, ['TASK-999'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
-      StateMachineError
-    );
-  });
-});
-
-// --- item B6: --asignado-a ---
-
-test('taskctl start --asignado-a: crea la rama Y deja asignado_a escrito en el frontmatter', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\
-Probar start.\
-');
-    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'carlos'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, 'carlos');
-    assert.equal(result.asignadoCambiado, true);
-    // Evidencia real de Git: la rama existe de verdad, no solo el
-    // campo escrito.
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
-
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.asignado_a, 'carlos');
-    assert.equal(read?.task.estado, 'en-curso');
-  });
-});
-
-test('taskctl start: sin --asignado-a hereda el asignado_a que dejo plan', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Es el caso que describe la seccion 8.2: plan asigna, y start
-    // comprueba 'la persona asignada' sin volver a pedirla.
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
-    commitAll(repoRoot, 'tarea(TASK-500): asignada en plan');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, 'ana');
-    assert.equal(result.asignadoCambiado, false);
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.asignado_a, 'ana');
-  });
-});
-
-test('taskctl start --asignado-a: reasigna sobre lo que dejo plan', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
-    commitAll(repoRoot, 'tarea(TASK-500): asignada a ana');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a=carlos'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, 'carlos');
-    assert.equal(result.asignadoCambiado, true);
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.asignado_a, 'carlos');
-  });
-});
-
-test('taskctl start --asignado-a invalido: falla ANTES de crear la rama', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
-    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500', '--asignado-a'], '2026-09-05', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      StartCommandError
-    );
-
-    // Lo que de verdad importa del orden: la rama NO llego a
-    // crearse. Si el flag se validara despues del script de
-    // Git-Flow, quedaria una rama huerfana por cada intento fallido.
-    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-500-prueba-de-integracion'], {
-      cwd: repoRoot,
-      encoding: 'utf8',
-    });
-    assert.equal(ramas.stdout.trim(), '');
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'develop');
-
-    // Y la tarea sigue en 01-en-diseno, sin tocar.
-    await stat(path.join(tareasRoot, '01-en-diseno', 'TASK-500', 'tarea.md'));
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.estado, 'en-diseno');
-    assert.equal(read?.task.asignado_a, null);
-  });
-});
-
-// --- TASK-015 (item B7): limite de trabajo en curso ---
-
-// El cableado del limite configurable (TASK-030, item C4) vive aqui y
-// no en config.test.ts a proposito: los tests de alli son puros sobre
-// tareasQueBloquean y pasaban igual con start.ts sin cablear — el
-// hallazgo IMPORTANTE de la revision por pares fue justo ese, que
-// deshacer la linea de start.ts no rompia ni un test. Esto pasa por
-// runStartCommand de verdad.
-
-test('taskctl start: limite_wip de .taskcode/config.yml manda de verdad (no solo en wip.ts)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-511', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-511-ya-abierta', titulo: 'La que ocupa hueco' }),
-      ''
-    );
-    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-512', asignado_a: 'carlos' }), '');
-    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
-    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'limite_wip: 2\n', 'utf8');
-    commitAll(repoRoot, 'tareas y config con limite 2');
-
-    // Con limite 2 cabe una segunda tarea: arranca y crea su rama.
-    const r = await runStartCommand(tareasRoot, ['TASK-512'], '2026-09-07', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    assert.equal(r.id, 'TASK-512');
-    assert.equal(
-      spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim(),
-      r.rama
-    );
-  });
-});
-
-test('taskctl start: con limite_wip 1 explicito en la config bloquea igual que sin fichero', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-521', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-521-ya-abierta', titulo: 'La que bloquea' }),
-      ''
-    );
-    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-522', asignado_a: 'carlos' }), '');
-    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
-    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'limite_wip: 1\n', 'utf8');
-    commitAll(repoRoot, 'tareas y config con limite 1');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-522'], '2026-09-07', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) => e instanceof StartCommandError && (e as Error).message.includes('TASK-521')
-    );
-  });
-});
-
-test('taskctl start: bloquea si la persona ya tiene otra tarea en curso, y NO crea la rama', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Una tarea de carlos ya en curso, con su rama abierta.
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-501-ya-abierta', titulo: 'La que bloquea' }),
-      ''
-    );
-    // Y la que carlos intenta arrancar ahora.
-    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-502', asignado_a: 'carlos' }), '');
-    commitAll(repoRoot, 'tareas de carlos');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-502'], '2026-09-05', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) =>
-        e instanceof StartCommandError &&
-        (e as Error).message.includes('TASK-501') &&
-        (e as Error).message.includes('carlos')
-    );
-
-    // Lo que de verdad importa: no queda una rama huerfana ni la
-    // tarea movida a medias.
-    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-500-prueba-de-integracion'], {
-      cwd: repoRoot,
-      encoding: 'utf8',
-    });
-    assert.equal(ramas.stdout.trim(), '');
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'develop');
-    const read = await readTareaFile(tareasRoot, 'TASK-502');
-    assert.equal(read?.task.estado, 'en-diseno');
-  });
-});
-
-test('taskctl start: una tarea en revision tambien bloquea (la rama sigue abierta)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', estado: 'en-revision', asignado_a: 'carlos', rama: 'feature/task-501-en-revision' }),
-      ''
-    );
-    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-502', asignado_a: 'carlos' }), '');
-    commitAll(repoRoot, 'carlos con una en revision');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-502'], '2026-09-05', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) =>
-        e instanceof StartCommandError && (e as Error).message.includes('03-en-revision')
-    );
-  });
-});
-
-test('taskctl start: la tarea en curso de OTRA persona no bloquea', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'ana', rama: 'feature/task-501-de-ana' }),
-      ''
-    );
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
-    commitAll(repoRoot, 'tareas de dos personas');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, 'carlos');
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
-  });
-});
-
-test('taskctl start: sin identidad Git configurada, la tarea sigue sin asignar y no comprueba limite', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Comportamiento anterior a TASK-024, que se conserva cuando no
-    // hay identidad. Se vacia user.email DESPUES de los commits (que
-    // la necesitan): asi el repo no hereda tampoco la identidad
-    // global de la maquina, que haria el test no determinista.
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: null, rama: 'feature/task-501-sin-duenno' }),
-      ''
-    );
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
-    commitAll(repoRoot, 'tareas sin asignar');
-    git(['config', 'user.email', ''], repoRoot);
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, null);
-    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
-  });
-});
-
-test('taskctl start --asignado-a: el limite se comprueba a la persona NUEVA, no a la anterior', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // ana tiene una en curso; la tarea que arranca esta asignada a
-    // carlos, pero se reasigna a ana en el propio start. Si el
-    // limite se comprobara con el asignado ANTERIOR (carlos), esto
-    // pasaria y dejaria a ana con dos ramas abiertas.
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'ana', rama: 'feature/task-501-de-ana' }),
-      ''
-    );
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
-    commitAll(repoRoot, 'ana ocupada, tarea de carlos');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana'], '2026-09-05', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (e: unknown) =>
-        e instanceof StartCommandError &&
-        (e as Error).message.includes('ana') &&
-        (e as Error).message.includes('TASK-501')
-    );
-  });
-});
-
-test('taskctl start --asignado-a: reasignar a alguien libre desbloquea', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // La salida que ofrece el mensaje de error: reasignar. Si no
-    // funcionara, el consejo del mensaje seria mentira.
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-501-de-carlos' }),
-      ''
-    );
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
-    commitAll(repoRoot, 'carlos ocupado');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, 'ana');
-    assert.equal(result.asignadoCambiado, true);
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.asignado_a, 'ana');
-  });
-});
-
-test('taskctl start: un tarea.md ilegible en las carpetas de ejecucion aborta (fail-closed)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // No se sabe de quien es esa tarea: podria ser justo la que
-    // bloquea. Dejar pasar aqui abriria una segunda rama.
-    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-599');
-    await mkdir(rota, { recursive: true });
-    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
-    commitAll(repoRoot, 'una tarea rota en curso');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (err: unknown) =>
-        err instanceof StartCommandError && (err as Error).message.includes('TASK-599')
-    );
-  });
-});
-
-test('taskctl start: una tarea rota en 00-planificadas NO bloquea a nadie', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // El fail-closed se acota a las carpetas que ocupan hueco: una
-    // tarea rota en planificadas no puede tener una rama abierta.
-    const rota = path.join(tareasRoot, '00-planificadas', 'TASK-599');
-    await mkdir(rota, { recursive: true });
-    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
-    commitAll(repoRoot, 'una tarea rota en planificadas');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.id, 'TASK-500');
-  });
-});
-
-// --- correcciones de la revision por pares de TASK-015 ---
-
-test('taskctl start: un error de disco al comprobar el limite sale como StartCommandError', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // 02-en-curso como FICHERO en vez de carpeta: readdir da
-    // ENOTDIR. Sin envolverlo, escapaba como Error crudo y el usuario
-    // lo veia como 'taskctl no pudo arrancar', que es falso.
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
-    await writeFile(path.join(tareasRoot, '02-en-curso'), 'no soy una carpeta', 'utf8');
-    commitAll(repoRoot, 'un fichero donde deberia haber una carpeta');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (err: unknown) =>
-        err instanceof StartCommandError &&
-        (err as Error).message.includes('limite de trabajo en curso')
-    );
-  });
-});
-
-test('taskctl start: el mensaje nombra la carpeta donde ESTA la bloqueante', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Tarea fisicamente en 02-en-curso pero con estado terminada en
-    // su frontmatter: bloquea (bien), y el mensaje debe mandar a
-    // 02-en-curso, no a 04-terminadas, donde no hay nada.
-    const dir = path.join(tareasRoot, '02-en-curso', 'TASK-501');
-    await mkdir(dir, { recursive: true });
-    const incoherente = sampleTask({ id: 'TASK-501', estado: 'terminada', asignado_a: 'carlos', rama: 'feature/task-501-incoherente' });
-    await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(incoherente, ''), 'utf8');
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
-    commitAll(repoRoot, 'una tarea con carpeta y estado incoherentes');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (err: unknown) =>
-        err instanceof StartCommandError &&
-        (err as Error).message.includes('02-en-curso') &&
-        !(err as Error).message.includes('04-terminadas')
-    );
-  });
-});
-
-// --- TASK-024 (item C7): identidad Git como asignado_a por defecto ---
-
-test('taskctl start: una tarea sin asignar se autoasigna a la identidad Git', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
-    commitAll(repoRoot, 'tarea sin asignar');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    // withTempRepo configura user.email como test@example.com.
-    assert.equal(result.asignadoA, 'test@example.com');
-    assert.equal(result.asignadoCambiado, true);
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.asignado_a, 'test@example.com');
-  });
-});
-
-test('taskctl start: la identidad Git NO roba la tarea de otra persona', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // El asignado previo gana a la identidad de quien ejecuta. Sin
-    // esto, arrancar la tarea de otra persona se la quedaria en
-    // silencio y el limite de WIP se comprobaria contra la persona
-    // equivocada.
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
-    commitAll(repoRoot, 'tarea de ana');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, 'ana@example.com');
-    assert.equal(result.asignadoCambiado, false);
-  });
-});
-
-test('taskctl start --asignado-a: el flag gana a la identidad Git', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
-    commitAll(repoRoot, 'tarea sin asignar');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'otra@example.com'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, 'otra@example.com');
-  });
-});
-
-test('taskctl start: dos tareas sin asignar de la misma identidad chocan DENTRO de la misma rama', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Antes de TASK-024 ninguna de las dos tenia asignado_a, asi que
-    // el limite no miraba nada. Ahora la primera se queda con la
-    // identidad Git y la segunda choca contra ella.
-    //
-    // OJO con lo que este test NO demuestra (hallazgo de revision por
-    // pares, TASK-024): aqui las dos invocaciones ocurren sin volver a
-    // la rama base, y por eso la segunda ve a la primera en
-    // 02-en-curso. En el flujo real, plan/new devuelven el repo a
-    // develop — donde ese movimiento no esta commiteado — y el limite
-    // NO se dispara. TASK-024 rellena asignado_a, que es condicion
-    // necesaria pero no suficiente; lo otro se arregla aparte.
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
-    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-501', asignado_a: null, rama: 'feature/task-501-segunda' }), '');
-    commitAll(repoRoot, 'dos tareas sin asignar');
-
-    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    commitAll(repoRoot, 'la primera en curso');
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-05', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (err: unknown) =>
-        err instanceof StartCommandError &&
-        (err as Error).message.includes('TASK-500') &&
-        (err as Error).message.includes('test@example.com')
-    );
-  });
-});
-
-// --- correcciones de la revision por pares de TASK-024 ---
-
-test('taskctl start: una identidad Git invalida no corrompe el frontmatter (CRITICO)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
-    commitAll(repoRoot, 'tarea sin asignar');
-    // El salto de linea inyectaba una clave que pisaba 'estado'.
-    git(['config', 'user.email', 'ana@x.com\nestado: terminada # '], repoRoot);
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, null);
-    assert.ok(result.avisoIdentidad?.includes('saltos de linea'), String(result.avisoIdentidad));
-    // Evidencia real: la tarea se relee y su estado es el correcto.
-    const read = await readTareaFile(tareasRoot, 'TASK-500');
-    assert.equal(read?.task.estado, 'en-curso');
-    assert.equal(read?.task.asignado_a, null);
-  });
-});
-
-test('taskctl start: avisa cuando arranca una tarea asignada a otra persona', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Quien abre la rama puede no ser quien planifico. No se cambia la
-    // semantica (la tarea sigue siendo de ana), pero se dice en voz alta.
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
-    commitAll(repoRoot, 'tarea de ana');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.asignadoA, 'ana@example.com');
-    assert.ok(result.avisoAtribucion?.includes('ana@example.com'), String(result.avisoAtribucion));
-    assert.ok(result.avisoAtribucion?.includes('test@example.com'), String(result.avisoAtribucion));
-  });
-});
-
-test('taskctl start: no avisa de atribucion cuando la tarea ya es tuya', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'test@example.com' }), '');
-    commitAll(repoRoot, 'tarea propia');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.avisoAtribucion, null);
-  });
-});
-
-test('taskctl start --asignado-a: pasar el flag silencia el aviso de atribucion', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
-    commitAll(repoRoot, 'tarea de ana');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana@example.com'], '2026-09-05', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    // Ha sido una decision explicita, no un descuido: no hay nada que avisar.
-    assert.equal(result.avisoAtribucion, null);
-  });
-});
-
-// --- TASK-025 (item C8): el limite ve las ramas de trabajo ---
-
-test('taskctl start: bloquea aunque la tarea en curso solo exista en SU rama (el fallo de B7)', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Este es el caso que B7 no cubria y que su smoke test no vio.
-    // Se reproduce el flujo REAL: se arranca la primera tarea, se
-    // commitea su movimiento EN SU RAMA, y se vuelve a develop — que
-    // es lo que hacen plan/new/import — antes de arrancar la segunda.
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
-      ''
-    );
-    commitAll(repoRoot, 'dos tareas de carlos en diseno');
-
-    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    commitAll(repoRoot, 'TASK-500 en curso, EN SU RAMA');
-    // De vuelta a la rama base: aqui TASK-500 sigue en 01-en-diseno.
-    git(['checkout', '-q', 'develop'], repoRoot);
-
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (err: unknown) =>
-        err instanceof StartCommandError &&
-        (err as Error).message.includes('TASK-500') &&
-        (err as Error).message.includes('feature/task-500-prueba-de-integracion')
-    );
-
-    // Y no se ha creado la rama de la segunda.
-    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-501-segunda'], {
-      cwd: repoRoot,
-      encoding: 'utf8',
-    });
-    assert.equal(ramas.stdout.trim(), '');
-  });
-});
-
-test('taskctl start: una rama YA MERGEADA no bloquea, aunque siga viva', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Politica IECA: las ramas no se borran tras el merge. Sin el
-    // filtro de mergeadas, cada tarea cerrada bloquearia para siempre.
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
-      ''
-    );
-    commitAll(repoRoot, 'dos tareas de carlos');
-
-    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    commitAll(repoRoot, 'TASK-500 en curso');
-    // Se mergea la rama a develop, pero NO se borra.
-    git(['checkout', '-q', 'develop'], repoRoot);
-    git(['merge', '--no-ff', '-q', '-m', 'merge de TASK-500', 'feature/task-500-prueba-de-integracion'], repoRoot);
-
-    // Ahora TASK-500 SI esta en 02-en-curso en develop, asi que se
-    // mueve a terminadas para aislar lo que este test comprueba: que
-    // la RAMA mergeada no cuenta.
-    const enCurso = (await readTareaFile(tareasRoot, 'TASK-500'))!;
-    await moveTareaFile(tareasRoot, enCurso.filePath, { ...enCurso.task, estado: 'terminada' }, enCurso.body);
-    commitAll(repoRoot, 'TASK-500 terminada');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.id, 'TASK-501');
-  });
-});
-
-test('taskctl start: la rama de OTRA persona no bloquea, aunque este abierta', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
-    await writeTareaFile(
-      tareasRoot,
-      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-de-carlos' }),
-      ''
-    );
-    commitAll(repoRoot, 'una de ana y una de carlos');
-
-    // Ana abre su rama y la deja abierta.
-    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    commitAll(repoRoot, 'la de ana en curso');
-    git(['checkout', '-q', 'develop'], repoRoot);
-
-    // Carlos arranca la suya: la rama abierta de Ana no le afecta.
-    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    assert.equal(result.id, 'TASK-501');
-    assert.equal(result.asignadoA, 'carlos@example.com');
-  });
-});
-
-test('taskctl start: reintentar una tarea cuya rama ya existe no la bloquea contra si misma', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // La rama existe y no esta mergeada, y su arbol tiene la tarea en
-    // 02-en-curso: sin excluirla por ID, el reintento se bloquearia a
-    // si mismo y no habria forma de salir.
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
-    commitAll(repoRoot, 'tarea de carlos');
-    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-    commitAll(repoRoot, 'en curso en su rama');
-
-    // Se simula el reintento: se vuelve a develop y se deja la tarea
-    // otra vez en 01-en-diseno, con la rama ya creada.
-    git(['checkout', '-q', 'develop'], repoRoot);
-    const enDiseno = (await readTareaFile(tareasRoot, 'TASK-500'))!;
-    assert.equal(enDiseno.task.estado, 'en-diseno');
-
-    // El limite NO se dispara: la tarea no se bloquea a si misma
-    // aunque su propia rama este abierta y tenga la tarea en curso.
-    // El reintento si muere, pero por otra cosa y preexistente: el
-    // checkout a la rama ya creada trae consigo la carpeta
-    // 02-en-curso/TASK-500, y moveTareaFile se niega a pisarla. Lo
-    // que este test fija es que el error NO es del limite de WIP.
-    await assert.rejects(
-      () =>
-        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
-          repoCwd: repoRoot,
-          scriptsDir: SCRIPTS_DIR,
-        }),
-      (err: unknown) =>
-        err instanceof TaskFolderConflictError &&
-        !(err as Error).message.includes('sin cerrar')
-    );
-  });
-});
-
-test('taskctl start: un tarea.md roto en OTRA rama avisa, pero no bloquea', async () => {
-  await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Hallazgo IMPORTANTE de revision por pares: al pasar a escanear
-    // ramas, un fichero corrupto en cualquier rama ajena o abandonada
-    // dejaba a TODO el mundo sin poder arrancar nada, y el remedio
-    // ('arregla su frontmatter') era inaplicable sin hacer checkout de
-    // esa rama. El coste de la duda lo pagaba quien no la creo.
-    git(['checkout', '-q', '-b', 'feature/experimento-de-otro'], repoRoot);
-    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-777');
-    await mkdir(rota, { recursive: true });
-    await writeFile(path.join(rota, 'tarea.md'), 'basura', 'utf8');
-    commitAll(repoRoot, 'una tarea rota en una rama ajena');
-    git(['checkout', '-q', 'develop'], repoRoot);
-
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
-    commitAll(repoRoot, 'tarea de carlos');
-
-    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
-      repoCwd: repoRoot,
-      scriptsDir: SCRIPTS_DIR,
-    });
-
-    // Arranca...
-    assert.equal(result.id, 'TASK-500');
-    // ...pero lo dice, con la rama delante para poder llegar al fichero.
-    assert.equal(result.avisosWip.length, 1);
-    assert.ok(result.avisosWip[0]?.includes('TASK-777'), result.avisosWip[0]);
-    assert.ok(result.avisosWip[0]?.includes('experimento-de-otro'), result.avisosWip[0]);
-  });
-});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/automatico-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/automatico-fixtures.ts
new file mode 100644
index 0000000..083c85e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/automatico-fixtures.ts
@@ -0,0 +1,139 @@
+// Fixtures compartidas de los tests de automatico (antes en test/commands/automatico.test.ts,
+// partido en varios ficheros para que el runner los reparta entre procesos).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { writeFile, mkdir, readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+
+
+export const HERE = path.dirname(fileURLToPath(import.meta.url));
+export const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
+export const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
+export const ID = 'TASK-001';
+export const CONFIG_AUTO = 'modo_flujo: automatico\n';
+
+export function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+export function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+export function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
+  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+export function cliOk(cwd: string, args: string[]) {
+  const r = cli(cwd, args);
+  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
+  return r;
+}
+
+export function siguiente(cwd: string, id = ID): Record<string, unknown> {
+  return JSON.parse(cliOk(cwd, ['siguiente', id, '--json']).stdout) as Record<string, unknown>;
+}
+
+export function resumen(s: Record<string, unknown>): [unknown, unknown] {
+  return [s.fase, s.accion];
+}
+
+// Repo base montado una vez por fichero (y por config) y copiado en cada
+// test (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+export const plantillasPorConfig = new Map<string, ConRepo>();
+
+export function withRepo(
+  config: string,
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  let conRepo = plantillasPorConfig.get(config);
+  if (conRepo === undefined) {
+    conRepo = plantillaRepo('taskctl-auto-', async (repoRoot) => {
+      git(['init', '-q', '-b', 'main'], repoRoot);
+      git(['config', 'user.email', 'test@example.com'], repoRoot);
+      git(['config', 'user.name', 'Test'], repoRoot);
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+      await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
+      commitAll(repoRoot, 'inicial');
+      git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    });
+    plantillasPorConfig.set(config, conRepo);
+  }
+  return conRepo(fn);
+}
+
+/** `taskctl new` por CLI; devuelve el ID creado (TASK-001 en un repo vacio). */
+export function nueva(repoRoot: string, tipo: string, titulo: string): void {
+  cliOk(repoRoot, [
+    'new',
+    '--titulo', titulo,
+    '--tipo', tipo,
+    '--complejidad', 'simple',
+    '--objetivo', 'Probar el modo automatico.',
+    '--criterio', 'La tarea queda en 04-terminadas',
+  ]);
+  // `new` deja la tarea en el working tree; el flujo la commitea antes de seguir.
+  if (git(['status', '--porcelain'], repoRoot).trim() !== '') commitAll(repoRoot, `docs: ${titulo}`);
+}
+
+/** plan por CLI y plan-final.md redactado y commiteado. */
+export async function planificar(repoRoot: string, tareasRoot: string, id = ID): Promise<void> {
+  cliOk(repoRoot, ['plan', id]);
+  await writeFile(
+    path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
+    '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
+    'utf8'
+  );
+  commitAll(repoRoot, `docs(${id}): plan final`);
+}
+
+export async function codigo(repoRoot: string, contenido: string, mensaje: string): Promise<void> {
+  await writeFile(path.join(repoRoot, 'app.txt'), contenido, 'utf8');
+  commitAll(repoRoot, mensaje);
+}
+
+export function dirRevision(tareasRoot: string, id = ID): string {
+  return path.join(tareasRoot, '03-en-revision', id, 'revision');
+}
+
+/** Tarea feature de TASK-001 planificada, aprobada, empezada y con un commit de codigo. */
+export async function hastaCodigo(repoRoot: string, tareasRoot: string, tipo = 'feature'): Promise<void> {
+  nueva(repoRoot, tipo, 'Flujo automatico');
+  await planificar(repoRoot, tareasRoot);
+  cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+  cliOk(repoRoot, ['start', ID]);
+  await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
+}
+
+/**
+ * Lo que hace el revisor: rellena la cabecera y la tabla de hallazgos del
+ * informe (sin tocar la linea de veredicto) y lo commitea SOLO.
+ */
+export async function rellenarInforme(repoRoot: string, informe: string): Promise<void> {
+  const texto = await readFile(informe, 'utf8');
+  const relleno = texto
+    .replace(/^- Revisor: \(rellenar.*$/m, '- Revisor: revisor independiente de prueba')
+    .replace(/^\| \(ej\. IMP-1\).*$/m, '| MEN-1 | MENOR | aceptado | app.txt |');
+  assert.notEqual(relleno, texto, 'el informe tenia la plantilla');
+  await writeFile(informe, relleno, 'utf8');
+  commitAll(repoRoot, `docs(${ID}): informe de revision`);
+}
+
+/** Sustituye la linea de veredicto del informe 1 sin commitear (a mano, como un agente). */
+export async function escribirVeredicto(informe: string, valor: string): Promise<void> {
+  const texto = await readFile(informe, 'utf8');
+  const nuevo = texto.replace(/^- Veredicto:.*$/m, `- Veredicto: ${valor}`);
+  assert.notEqual(nuevo, texto, 'el informe debe tener la linea de veredicto');
+  await writeFile(informe, nuevo, 'utf8');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts
new file mode 100644
index 0000000..0866e18
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts
@@ -0,0 +1,112 @@
+// Fixtures compartidas de los tests de finish (antes en test/commands/finish.test.ts,
+// partido en varios ficheros para que el runner los reparta entre procesos).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+
+export const HERE = path.dirname(fileURLToPath(import.meta.url));
+export const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+export function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-700',
+    titulo: 'Tarea de prueba de finish',
+    tipo: 'feature',
+    sprint: 2,
+    etiquetas: ['cli', 'gitflow'],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-revision',
+    plan_aprobado: true,
+    rama: 'feature/task-700-prueba-finish',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-05',
+    actualizado: '2026-09-05',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+export function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que llamar a esto justo despues de un
+ * comando puede no tener ya nada que registrar: `git commit` sale 1
+ * con "nothing to commit" y el assert de `git()` lo daria por fallo
+ * del test. Se commitea solo si queda algo — y que no quede es
+ * exactamente la senal de que el auto-commit hizo su trabajo.
+ */
+export function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+// Repo base montado una vez por fichero y copiado en cada test
+// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+export const withTempRepo: ConRepo = plantillaRepo('taskctl-finish-', async (repoRoot) => {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+});
+
+export const VEREDICTO_APROBADO = '- Veredicto: aprobada (revisada por el agente independiente)\n';
+
+/**
+ * Deja la tarea en-revision en su rama con el informe de la ronda 1
+ * commiteado, como la habria dejado el ciclo start -> review + el
+ * revisor volcando su veredicto. `base` es la rama de la que nace la
+ * rama de trabajo (develop para feature/fix/release, main para hotfix).
+ */
+export async function setupTaskEnRevision(
+  repoRoot: string,
+  tareasRoot: string,
+  task: Task,
+  opts: { base?: string; veredicto?: string; conCodex?: string } = {}
+): Promise<void> {
+  const base = opts.base ?? 'develop';
+  git(['checkout', '-q', '-b', task.rama, base], repoRoot);
+  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
+  await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
+  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+  await mkdir(revisionDir, { recursive: true });
+  await writeFile(
+    path.join(revisionDir, 'informe-revision-1.md'),
+    `# Informe de revision — ${task.id} (ronda 1)\n\n${opts.veredicto ?? VEREDICTO_APROBADO}`,
+    'utf8'
+  );
+  if (opts.conCodex !== undefined) {
+    await writeFile(
+      path.join(revisionDir, 'informe-codex-1.md'),
+      `# Informe Codex — ${task.id}\n\n${opts.conCodex}`,
+      'utf8'
+    );
+  }
+  commitAll(repoRoot, `feat(${task.id}): trabajo revisado`);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/review-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/review-fixtures.ts
new file mode 100644
index 0000000..8c44844
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/review-fixtures.ts
@@ -0,0 +1,137 @@
+// Fixtures compartidas de los tests de review (antes en test/commands/review.test.ts,
+// partido en varios ficheros para que el runner los reparta entre procesos).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+
+export const HERE = path.dirname(fileURLToPath(import.meta.url));
+export const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+export function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-600',
+    titulo: 'Tarea de prueba de review',
+    tipo: 'feature',
+    sprint: 2,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-curso',
+    plan_aprobado: true,
+    rama: 'feature/task-600-prueba-review',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-05',
+    actualizado: '2026-09-05',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+export function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que llamar a esto justo despues de un
+ * comando puede no tener ya nada que registrar: `git commit` sale 1
+ * con "nothing to commit" y el assert de `git()` lo daria por fallo
+ * del test. Se commitea solo si queda algo — y que no quede es
+ * exactamente la senal de que el auto-commit hizo su trabajo.
+ */
+export function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+// Repo base montado una vez por fichero y copiado en cada test
+// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+export const withTempRepo: ConRepo = plantillaRepo('taskctl-review-', async (repoRoot) => {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+});
+
+/**
+ * Deja la tarea en-curso en su rama, como la habria dejado "taskctl
+ * start": rama creada desde develop, tarea.md commiteado en
+ * 02-en-curso/, y un commit de trabajo propio de la rama.
+ */
+export async function setupTaskEnCurso(repoRoot: string, tareasRoot: string, task: Task): Promise<void> {
+  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar review.\n');
+  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo de la tarea\n', 'utf8');
+  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
+}
+
+/** Avanza develop con un cambio y vuelve a la rama indicada. */
+export async function advanceDevelop(repoRoot: string, volverA: string): Promise<void> {
+  git(['checkout', '-q', 'develop'], repoRoot);
+  await writeFile(path.join(repoRoot, 'cambio-develop.txt'), 'cambio en develop\n', 'utf8');
+  commitAll(repoRoot, 'cambio en develop');
+  git(['checkout', '-q', volverA], repoRoot);
+}
+
+/**
+ * Escribe un fichero bajo `repoRoot/ruta` (con "/" de Git), creando los
+ * directorios que hagan falta. Para las pruebas de clasificacion por
+ * dominio (TASK-018): las rutas se eligen IGUAL que las de
+ * test/skills/revisores.test.ts (RUTAS_LEGITIMAS/RUTAS_AJENAS), para no
+ * inventar una segunda tabla de "que ruta cae en que dominio" que pueda
+ * divergir de la que ese fichero ya prueba contra las skills reales.
+ */
+export async function escribirFichero(repoRoot: string, ruta: string, contenido: string): Promise<void> {
+  const destino = path.join(repoRoot, ...ruta.split('/'));
+  await mkdir(path.dirname(destino), { recursive: true });
+  await writeFile(destino, contenido, 'utf8');
+}
+
+/**
+ * Ruta (con "/" de Git) de tarea.md tal como queda en la rama de una
+ * tarea en-curso. A diferencia de setupTaskEnCurso, esta variante NO
+ * anade "trabajo.txt": las pruebas de clasificacion por dominio
+ * (TASK-018) necesitan controlar EXACTAMENTE que ficheros trae el diff,
+ * y tarea.md es el UNICO que no se puede evitar (toda tarea necesita su
+ * frontmatter commiteado en la rama para que el resto del ciclo
+ * funcione) — se deja como el unico "ruido" de fondo, documentado en
+ * cada test que lo necesita.
+ */
+export function rutaTareaMd(id: string): string {
+  return `tareas/02-en-curso/${id}/tarea.md`;
+}
+
+/** Como setupTaskEnCurso, pero sin escribir "trabajo.txt". */
+export async function setupTaskEnCursoSoloTarea(
+  repoRoot: string,
+  tareasRoot: string,
+  task: Task
+): Promise<void> {
+  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el enrutado por dominio.\n');
+  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts
new file mode 100644
index 0000000..f6f632a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts
@@ -0,0 +1,161 @@
+// Fixtures compartidas de los tests de sincronizacion (antes en test/commands/sincronizacion.test.ts,
+// partido en varios ficheros para que el runner los reparta entre procesos).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
+import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
+import type { Task } from '../../src/core/task.js';
+
+
+export const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/commands -> raiz del paquete
+export const PAQUETE = path.join(HERE, '..', '..', '..');
+export const SCRIPTS_DIR = path.join(PAQUETE, 'scripts', 'gitflow');
+export const BIN = path.join(PAQUETE, 'bin', 'taskctl');
+
+export function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+export function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+export function porcelain(repoRoot: string): string {
+  return git(['status', '--porcelain', '--untracked-files=all'], repoRoot).trim();
+}
+
+export function ficherosDeHead(repoRoot: string): string[] {
+  return git(['show', '--name-only', '--format=', 'HEAD'], repoRoot)
+    .split('\n')
+    .map((l) => l.trim())
+    .filter((l) => l !== '');
+}
+
+export function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-920',
+    titulo: 'Tarea de prueba de la sincronizacion',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: ['cli'],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-diseno',
+    plan_aprobado: false,
+    rama: 'feature/task-920-sincronizacion',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-10-03',
+    actualizado: '2026-10-03',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+/**
+ * Regenera docs/PLAN.md: una linea por tarea con su carpeta y si el
+ * plan esta aprobado. Lee el estado de disco, como el script real.
+ */
+export const SCRIPT_SYNC = `import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
+const filas = [];
+for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
+  const d = 'tareas/' + c;
+  if (!existsSync(d)) continue;
+  for (const id of readdirSync(d).filter((x) => x.startsWith('TASK-'))) {
+    const md = readFileSync(d + '/' + id + '/tarea.md', 'utf8');
+    filas.push(id + ' ' + c + (/plan_aprobado: true/.test(md) ? ' aprobado' : ''));
+  }
+}
+mkdirSync('docs', { recursive: true });
+writeFileSync('docs/PLAN.md', filas.sort().join('\\n') + '\\n');
+`;
+
+export const CONFIG_SYNC =
+  'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/PLAN.md]\n';
+
+/**
+ * Repo con develop, el script de sincronizacion, la config que lo
+ * activa (si `config` no es null) y una tarea en 01-en-diseno con su
+ * plan. Todo commiteado, docs/PLAN.md incluido: arbol limpio al entrar.
+ */
+export async function withRepoSincronizado(
+  config: string | null,
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sync-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    git(['config', 'core.autocrlf', 'false'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+
+    const tareasRoot = path.join(repoRoot, 'tareas');
+    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar la sincronizacion.\n');
+    const planDir = path.join(tareasRoot, '01-en-diseno', 'TASK-920', 'planificacion');
+    await mkdir(planDir, { recursive: true });
+    // TASK-043: approve rechaza un plan que es solo una cabecera.
+    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n\nEnfoque: sincronizar.\n', 'utf8');
+    await mkdir(path.join(repoRoot, 'scripts'), { recursive: true });
+    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), SCRIPT_SYNC, 'utf8');
+    if (config !== null) {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+    }
+    const r = spawnSync('node', ['scripts/sync.mjs'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(r.status, 0, r.stderr);
+    commitAll(repoRoot, 'docs: plan y sincronizacion');
+    await fn(repoRoot, tareasRoot);
+  } finally {
+    // Un EBUSY aqui (un proceso huerfano con el cwd dentro) no puede
+    // tapar la asercion que de verdad fallo: se reintenta y se traga.
+    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+export async function planEnDisco(repoRoot: string): Promise<string> {
+  return (await readFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'utf8')).trim();
+}
+
+// ─── Los tres desenlaces en que no se aplica ───────────────────────────────
+
+/** Escribe un cambio en la tarea (lo que haria un comando) para que autoCommit tenga algo. */
+export async function tocarTarea(tareasRoot: string): Promise<string> {
+  const dir = path.join(tareasRoot, '01-en-diseno', 'TASK-920');
+  await writeFile(path.join(dir, 'nota.md'), 'cambio de la transicion\n', 'utf8');
+  return dir;
+}
+
+export async function reescribirScript(repoRoot: string, contenido: string): Promise<void> {
+  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
+  commitAll(repoRoot, 'chore: script nuevo');
+}
+
+/** Como reescribirScript pero sin commit, para no barrer el README sucio del test. */
+export async function reescribirScriptSinCommitear(repoRoot: string, contenido: string): Promise<void> {
+  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
+  git(['add', '--', 'scripts/sync.mjs'], repoRoot);
+  git(['commit', '-q', '-m', 'chore: script nuevo', '--', 'scripts/sync.mjs'], repoRoot);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/start-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/start-fixtures.ts
new file mode 100644
index 0000000..7b72a57
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/start-fixtures.ts
@@ -0,0 +1,96 @@
+// Fixtures compartidas de los tests de start (antes en test/commands/start.test.ts,
+// partido en varios ficheros para que el runner los reparta entre procesos).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
+import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
+import { TaskFolderConflictError } from '../../src/fs/task-store.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+
+export const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/commands -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
+export const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+export function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-500',
+    titulo: 'Tarea de prueba de integracion',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-diseno',
+    // true desde TASK-016. Hasta entonces era false y la tarea
+    // arrancaba igual, porque `simple` estaba eximida del checkpoint
+    // humano; ahora el checkpoint es obligatorio para las cinco
+    // complejidades (seccion 14, punto 1) y una tarea sin aprobar ya no
+    // representa el caso normal de "start", sino el que se rechaza.
+    // Ese rechazo lo cubren dos tests propios mas abajo.
+    plan_aprobado: true,
+    rama: 'feature/task-500-prueba-de-integracion',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-03',
+    actualizado: '2026-09-03',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+export function git(args: string[], cwd: string): void {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+}
+
+/**
+ * writeTareaFile deja tareas/.../tarea.md sin commitear (es solo I/O de
+ * disco, no toca Git). En uso real esa tarea.md ya estaria commiteada
+ * (viene de un "taskctl plan"/"approve" previo) antes de que alguien
+ * ejecute start, asi que los tests que prueban el camino feliz la
+ * commitean aqui para dejar el workspace limpio antes de invocar
+ * runStartCommand, igual que estaria en un uso real.
+ */
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que llamar a esto justo despues de un
+ * comando puede no tener ya nada que registrar: `git commit` sale 1
+ * con "nothing to commit" y el assert de `git()` lo daria por fallo
+ * del test. Se commitea solo si queda algo — y que no quede es
+ * exactamente la senal de que el auto-commit hizo su trabajo.
+ */
+export function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+// Repo base montado una vez por fichero y copiado en cada test
+// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+export const withTempRepo: ConRepo = plantillaRepo('taskctl-start-', async (repoRoot) => {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    // Igual que en scripts/gitflow/test/smoke-test.sh: logs/ tiene que
+    // estar en .gitignore ANTES del primer commit, o el propio uso de
+    // Git-Flow se autobloquea (hallazgo 2 de TASK-007).
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+});
````

## Excluido del diff (7 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-051/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-051/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-051/planificacion/brainstorm/peticion-unificador-1.md              | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-051/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-051/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-051/planificacion/plan-final.md                                    | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-051/tarea.md                                                       | 3 ++-
 7 files changed, 2 insertions(+), 1 deletion(-)
````
