# Peticion de revision — TASK-058 (ronda 3)

- Tarea: TASK-058 — Flujo D: modo semiautomatico
- Rama revisada: feature/task-058-flujo-d-modo-semiautomatico
- Rama base: develop
- Commit revisado (HEAD): 40dd84b258af6fc17e808e969b571df2a10dadf5
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-058 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde ea31c4705a96fec9361cf734b710903663aa6662 (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-3.md), sin borrar la
peticion.

## Hallazgos de la ronda 2 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-5 | IMPORTANTE | corregido (ver MEN-2 r2) | skills/task-workflow/avance.md | informe-revision-2.md |
| MEN-3 | MENOR | corregido (por lectura) | src/commands/cadena.ts:abrir | informe-revision-2.md |
| IMP-1 (r2) | IMPORTANTE | abierto | test/commands/cadena.test.ts, semiautomatico.test.ts, src/cli.ts:GUARDADOS_POR_CADENA | informe-revision-2.md |
| MEN-1 (r2) | MENOR | abierto | src/cli.ts:mainComando | informe-revision-2.md |
| MEN-2 (r2) | MENOR | abierto | skills/task-workflow/avance.md | informe-revision-2.md |
| MEN-3 (r2) | MENOR | abierto | skills/task-workflow/avance.md (tabla de modos), HELP de src/cli.ts | informe-revision-2.md |

## Commits a revisar (git log ea31c4705a96fec9361cf734b710903663aa6662..HEAD)

````
40dd84b fix(TASK-058): correcciones de la ronda 2 (IMP-1 r2, MEN-1..3 r2)
85b3e7f chore(TASK-058): veredicto ronda 2 (cambios-solicitados)
d1a74b6 docs(TASK-058): informe de revision ronda 2
604f2d1 chore(TASK-058): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff ea31c4705a96fec9361cf734b710903663aa6662..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index a3b45d7..5d77944 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -111,6 +111,8 @@ taskctl finish  TASK-NNN
 
 taskctl siguiente TASK-NNN [--json]   # que fase toca y si preguntar; solo lee
 taskctl pausa     TASK-NNN            # registra un «no seguir todavia», sin cambiar el estado
+taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar
+                  # con una cadena abierta, los comandos que escriben exigen --cadena <testigo>
 
 taskctl diagnose | pause [--push] | resume [<rama>] | recover [<rama>] | abort-merge
 ```
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 19f62a0..ee261a4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -20,7 +20,7 @@ cambia el modo de esa tarea.
 |---|---|
 | `manual` (por defecto) | Nada se encadena: la skill termina nombrando la siguiente |
 | `semiautomatico` | Se pregunta si seguir; un no queda registrado con `taskctl pausa` |
-| `automatico` | Las preguntas se hacen en `plan`; el resto se encadena hasta `finish` |
+| `automatico` | Las preguntas se hacen en `plan`; el resto se encadena hasta `finish` (mientras sus guardas propias no esten disponibles, pregunta como el semiautomatico) |
 
 En cualquier modo, hotfix y release preguntan antes de `finish`, nunca se
 sube nada con `--push` sin que la persona lo pida, y cada transicion deja
@@ -90,10 +90,13 @@ rama (`plan`, `approve`, `start`, `review`, `veredicto`, `codex-review`,
 abierta sin su testigo**, asi que una segunda sesion no puede tocar el arbol
 aunque no pase por `cadena abrir`. En modo `manual` no hay cadena.
 
-**Un «no» o un error cierran la cadena.** Si una skill registra un «no»
-(`taskctl pausa`), o un `taskctl` falla con una cadena abierta, primero
-`taskctl cadena cerrar <testigo>`, despues muestra el «no» o el error, y
-termina sin volver a pasar por esta seccion.
+**Un «no» o un error cierran la cadena**, en este orden:
+- un «no»: primero `taskctl pausa TASK-NNN --cadena <testigo>` (con la cadena
+  aun abierta, o el CLI lo rechaza y el «no» no queda registrado), despues
+  `taskctl cadena cerrar <testigo>`;
+- un error de un `taskctl`: `taskctl cadena cerrar <testigo>` y despues
+  muestra el error.
+En los dos casos la skill termina ahi, sin volver a pasar por esta seccion.
 
 ## Reglas que no cambian con el modo
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 9d3d90e..70bd0fe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -23,6 +23,7 @@ import {
   CadenaCommandError,
   verificarCadena,
   extraerCadena,
+  GUARDADOS_POR_CADENA,
 } from './commands/cadena.js';
 import {
   isWrapperCommand,
@@ -86,7 +87,9 @@ Comandos: new, import, board, start, plan, approve, review, codex-review, veredi
 siguiente, pausa, cadena.
 siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
 manual, semiautomatico o automatico); solo lee. pausa registra que la persona
-no quiere pasar todavia a la siguiente fase.
+no quiere pasar todavia a la siguiente fase. cadena bloquea el arbol mientras
+las fases se encadenan: con una cadena abierta, los comandos que escriben o
+cambian de rama exigen --cadena <testigo>.
 Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
 --asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
 taskctl commitea SOLO los ficheros que el mismo escribe (nunca "git add -A"):
@@ -304,28 +307,6 @@ export async function main(argv: readonly string[]): Promise<number> {
   return codigo === 0 && sincronizacionPendiente ? CODIGO_SINCRONIZACION_NO_APLICADA : codigo;
 }
 
-/**
- * Comandos que escriben en el repo o cambian de rama: con una cadena de fases
- * abierta en el arbol (TASK-058) solo se ejecutan con su testigo. Los de solo
- * lectura (board, siguiente) y `cadena` quedan fuera.
- */
-const GUARDADOS_POR_CADENA = new Set([
-  'new',
-  'import',
-  'plan',
-  'approve',
-  'start',
-  'review',
-  'codex-review',
-  'veredicto',
-  'finish',
-  'pausa',
-  'pause',
-  'resume',
-  'recover',
-  'abort-merge',
-]);
-
 async function mainComando(argvEntrada: readonly string[]): Promise<number> {
   let argv = argvEntrada;
   const cmd = argv[0];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index 292b305..d6d3c14 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -166,6 +166,29 @@ export async function runCadenaCommand(
   }
 }
 
+/**
+ * Comandos que escriben en el repo o cambian de rama: con una cadena abierta
+ * en el arbol solo se ejecutan con su testigo. Los de solo lectura (board,
+ * siguiente, diagnose) y `cadena` quedan fuera. Exportada para que el test
+ * recorra la lista entera (IMP-1 de la ronda 2 de la revision).
+ */
+export const GUARDADOS_POR_CADENA: ReadonlySet<string> = new Set([
+  'new',
+  'import',
+  'plan',
+  'approve',
+  'start',
+  'review',
+  'codex-review',
+  'veredicto',
+  'finish',
+  'pausa',
+  'pause',
+  'resume',
+  'recover',
+  'abort-merge',
+]);
+
 /**
  * IMP-1 de la revision: el bloqueo lo hace cumplir el CLI, no la buena
  * voluntad de las skills. Todo comando que escribe en el repo o cambia de
@@ -178,7 +201,14 @@ export async function runCadenaCommand(
  */
 export async function verificarCadena(repoCwd: string, testigo: string | undefined, ahora = new Date()): Promise<void> {
   if (testigo !== undefined) exigirTestigo(testigo, 'taskctl <comando> ... --cadena <testigo>');
-  const ruta = rutaBloqueo(repoCwd);
+  let ruta: string;
+  try {
+    ruta = rutaBloqueo(repoCwd);
+  } catch {
+    // MEN-1 (r2): fuera de un repo no hay bloqueo que hacer cumplir; el
+    // comando dara su propio error, que dice que hacer.
+    return;
+  }
   const b = await leerBloqueo(ruta);
   if (b === null) {
     if (testigo === undefined) return;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
index 3c9fcc1..97f1374 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
@@ -8,7 +8,7 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
-import { runCadenaCommand, CadenaCommandError } from '../../src/commands/cadena.js';
+import { runCadenaCommand, CadenaCommandError, GUARDADOS_POR_CADENA } from '../../src/commands/cadena.js';
 
 const HERE = path.dirname(fileURLToPath(import.meta.url));
 const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
@@ -200,3 +200,111 @@ test('abrir sin ID valido, y subcomando desconocido, salen != 0 sin crear bloque
     assert.equal(await existe(lock), false);
   });
 });
+
+// --- La guarda del CLI (IMP-1 de las rondas 1 y 2 de la revision) --------------
+
+/** Lo que tiene que estar guardado: todo comando que escribe o cambia de rama. */
+const ESPERADOS = [
+  'new',
+  'import',
+  'plan',
+  'approve',
+  'start',
+  'review',
+  'codex-review',
+  'veredicto',
+  'finish',
+  'pausa',
+  'pause',
+  'resume',
+  'recover',
+  'abort-merge',
+];
+
+/** Argumentos minimos de cada comando (la guarda actua antes de mirarlos). */
+function argsDe(cmd: string): string[] {
+  switch (cmd) {
+    case 'new':
+      return ['--titulo', 'Otra', '--tipo', 'feature'];
+    case 'import':
+      return [path.join(tmpdir(), 'no-importa.md')];
+    case 'veredicto':
+      return ['TASK-001', 'aprobada'];
+    case 'resume':
+    case 'recover':
+      return ['develop'];
+    case 'pause':
+    case 'abort-merge':
+      return [];
+    default:
+      return ['TASK-001'];
+  }
+}
+
+test('la lista de comandos guardados es exactamente la esperada', () => {
+  assert.deepEqual([...GUARDADOS_POR_CADENA].sort(), [...ESPERADOS].sort());
+});
+
+test('con una cadena abierta, CADA comando guardado sin testigo, con uno ajeno o con uno cerrado aborta sin tocar nada', async () => {
+  await withRepo(async (repoRoot) => {
+    const viejo = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-009']).stdout.trim();
+    cliOk(repoRoot, ['cadena', 'cerrar', viejo]);
+    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']);
+    const head = git(['rev-parse', 'HEAD'], repoRoot);
+    const rama = git(['branch', '--show-current'], repoRoot);
+    for (const cmd of ESPERADOS) {
+      for (const [caso, extra] of [
+        ['sin testigo', []],
+        ['testigo ajeno', ['--cadena', '0123456789abcdef']],
+        ['testigo de una cadena cerrada', ['--cadena', viejo]],
+      ] as const) {
+        const r = cli(repoRoot, [cmd, ...argsDe(cmd), ...extra]);
+        assert.notEqual(r.status, 0, `${cmd} (${caso}) no deberia ejecutarse`);
+        assert.match(r.stderr, /otra cadena de fases en marcha/, `${cmd} (${caso}): ${r.stderr}`);
+      }
+    }
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head);
+    assert.equal(git(['branch', '--show-current'], repoRoot), rama);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('con su testigo, en cualquier posicion y con --cadena=, los comandos funcionan y no ven el flag', async () => {
+  await withRepo(async (repoRoot) => {
+    const t = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
+    cliOk(repoRoot, ['new', `--cadena=${t}`, '--titulo', 'Con testigo', '--tipo', 'feature',
+      '--objetivo', 'Probar la guarda', '--criterio', 'El comando approve acepta el testigo']);
+    cliOk(repoRoot, ['plan', 'TASK-001', '--cadena', t]);
+    await writeFile(
+      path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-001', 'planificacion', 'plan-final.md'),
+      '# Plan\n\n## Enfoque propuesto\n\nAlgo concreto.\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'plan');
+    // approve y pausa leen el ID como primer argumento: si --cadena no se sacara del
+    // argv, lo tomarian como ID y fallarian.
+    cliOk(repoRoot, ['pausa', `--cadena=${t}`, 'TASK-001']);
+    cliOk(repoRoot, ['approve', '--cadena', t, 'TASK-001']);
+    const tarea = await readFile(path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-001', 'tarea.md'), 'utf8');
+    assert.match(tarea, /plan_aprobado: true/);
+    cliOk(repoRoot, ['cadena', 'cerrar', t]);
+    // Sin ninguna cadena abierta, un testigo ya cerrado tampoco vale: seguiria
+    // encadenando sin bloqueo.
+    const head = git(['rev-parse', 'HEAD'], repoRoot);
+    const cerrado = cli(repoRoot, ['pausa', 'TASK-001', '--cadena', t]);
+    assert.notEqual(cerrado.status, 0);
+    assert.match(cerrado.stderr, /ya no esta abierta/);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head);
+  });
+});
+
+test('fuera de un repo, la guarda no interviene: el comando da su propio error (MEN-1 r2)', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-sin-repo-'));
+  try {
+    const r = cli(dir, ['pause']);
+    assert.notEqual(r.status, 0);
+    assert.doesNotMatch(r.stderr, /cadena\.lock/);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
index 8d4a895..a242023 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -258,8 +258,15 @@ test('la cadena se cierra en cada camino de salida: detener, no, error (MEN-1 de
   assert.ok(detener && /cadena abierta, cerrarla/.test(detener[0]), 'detener cierra la cadena');
   const no = /\*\*No\*\*: ejecutar `taskctl pausa[\s\S]*?(?=\n- \*\*`continuar`)/.exec(avance);
   assert.ok(no && /cerrar la cadena/.test(no[0]), 'el no de preguntar cierra la cadena');
-  assert.match(avance, /\*\*Un «no» o un error cierran la cadena\.\*\*/);
-  assert.match(avance, /primero\s+`taskctl cadena cerrar <testigo>`, despues muestra el «no» o el error/);
+  assert.match(avance, /\*\*Un «no» o un error cierran la cadena\*\*, en este orden/);
+  // MEN-2 (r2): el no se registra con la cadena aun abierta; cerrar antes lo haria fallar.
+  const ordenNo = /- un «no»:[\s\S]*?(?=\n- un error)/.exec(avance);
+  assert.ok(ordenNo, 'avance.md da el orden del no');
+  assert.ok(
+    ordenNo[0].indexOf('taskctl pausa') < ordenNo[0].indexOf('taskctl cadena cerrar'),
+    'primero pausa, despues cerrar'
+  );
+  assert.match(avance, /- un error de un `taskctl`: `taskctl cadena cerrar <testigo>` y despues\s+muestra el error/);
   assert.match(avance, /el CLI rechaza esos comandos mientras haya una cadena\s+abierta sin su testigo/);
   // El no de approve detiene la cadena sin volver a avance (IMP-4).
   const approve = lf(await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8'));
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff ea31c4705a96fec9361cf734b710903663aa6662..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/03-en-revision/TASK-058/revision/informe-revision-2.md            |  59 ++++++++++++
 tareas/03-en-revision/TASK-058/revision/peticion-revision-2.md           | 626 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-058/tarea.md                                  |  27 ++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js             |  27 +-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js |  32 ++++++-
 5 files changed, 747 insertions(+), 24 deletions(-)
````
