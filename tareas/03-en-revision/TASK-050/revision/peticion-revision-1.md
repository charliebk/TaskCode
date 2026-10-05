# Peticion de revision — TASK-050 (ronda 1)

- Tarea: TASK-050 — F6-T1 Suite rapida y repo plantilla en los tests
- Rama revisada: feature/task-050-f6-t1-suite-rapida-y-repo-plantilla-en-l
- Rama base: develop
- Commit revisado (HEAD): 87f27c6e1cd03ea0baa001e237558432a6f84bf5
- Fecha: 2026-10-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-050 (criterios de aceptacion y plan)

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
87f27c6 feat(TASK-050): suite rapida y repo plantilla en los tests
f3ebec4 chore(TASK-050): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 9dffcd2..25bdebe 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -39,7 +39,8 @@ procesan).
 ```bash
 cd taskcode-marketplace/plugins/taskcode-plugin
 npm install
-npm test     # compila y corre 630 tests con cobertura
+npm test             # compila y corre la suite completa (~1090 tests, ~8 min) con cobertura
+npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar, no para cerrar
 ```
 
 El CLI: `taskctl new | import | board | plan | approve | start | review |
diff --git a/README.md b/README.md
index 99e069a..85efe9c 100644
--- a/README.md
+++ b/README.md
@@ -86,7 +86,8 @@ El hito de usabilidad diaria es el final de la **Fase B** (`review` + `finish`
 ```bash
 cd taskcode-marketplace/plugins/taskcode-plugin
 npm install
-npm test        # compila y corre la suite con cobertura
+npm test             # compila y corre la suite completa con cobertura
+npm run test:rapido  # solo core y cli, sin procesos (segundos): para iterar
 ```
 
 Cero dependencias de runtime a propósito: el parser de YAML-frontmatter y el
diff --git a/docs/contexto/CONVENCIONES.md b/docs/contexto/CONVENCIONES.md
index 87d4b92..4559d30 100644
--- a/docs/contexto/CONVENCIONES.md
+++ b/docs/contexto/CONVENCIONES.md
@@ -33,7 +33,9 @@ casi todas salieron de algo que salió mal una vez.
 1. La tarea existe como carpeta en `tareas/00-planificadas/TASK-NNN/`.
 2. Rama de trabajo creada con Git-Flow.
 3. Implementación + tests reales.
-4. `npm test` en verde **antes** de commitear.
+4. `npm test` en verde **antes** de commitear. `npm run test:rapido` sirve
+   para iterar, pero no vale para cerrar: deja fuera `agents/`, `skills/`,
+   `empaquetado/` y todo lo que lanza Git.
 5. Smoke test manual de punta a punta cuando la tarea toca el CLI o Git.
 6. Commit de implementación.
 7. **Revisión por pares con un agente independiente** (ver abajo).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package.json b/taskcode-marketplace/plugins/taskcode-plugin/package.json
index 9b8462d..6749bd2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package.json
@@ -10,7 +10,9 @@
   "scripts": {
     "build": "tsc -p tsconfig.json",
     "lint": "tsc -p tsconfig.json --noEmit",
-    "test": "npm run build && node --test --experimental-test-coverage \"dist/test/**/*.test.js\""
+    "limpiar:test": "node -e \"require('node:fs').rmSync('dist/test',{recursive:true,force:true})\"",
+    "test": "npm run limpiar:test && npm run build && node --test --experimental-test-coverage \"dist/test/**/*.test.js\"",
+    "test:rapido": "npm run limpiar:test && npm run build && node --test \"dist/test/core/**/*.test.js\" \"dist/test/cli/**/*.test.js\""
   },
   "devDependencies": {
     "typescript": "^5.6.0",
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
index eccf251..eee5b0b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
@@ -11,6 +11,7 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
 import { readTareaFile } from '../../src/fs/task-store.js';
 import { leerTransiciones } from '../../src/core/transiciones.js';
 
@@ -50,24 +51,29 @@ function resumen(s: Record<string, unknown>): [unknown, unknown] {
   return [s.fase, s.accion];
 }
 
-async function withRepo(
+// Repo base montado una vez por fichero (y por config) y copiado en cada
+// test (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+const plantillasPorConfig = new Map<string, ConRepo>();
+
+function withRepo(
   config: string,
   fn: (repoRoot: string, tareasRoot: string) => Promise<void>
 ): Promise<void> {
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-auto-'));
-  try {
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
-    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
-    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
-    commitAll(repoRoot, 'inicial');
-    git(['checkout', '-q', '-b', 'develop'], repoRoot);
-    await fn(repoRoot, path.join(repoRoot, 'tareas'));
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
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
   }
+  return conRepo(fn);
 }
 
 /** `taskctl new` por CLI; devuelve el ID creado (TASK-001 en un repo vacio). */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
index 3bc270c..1ccc80c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
@@ -12,6 +12,7 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
 import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
 import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
 import { StateMachineError } from '../../src/core/state-machine.js';
@@ -65,9 +66,9 @@ function commitAll(repoRoot: string, message: string): void {
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
-async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-finish-'));
-  try {
+// Repo base montado una vez por fichero y copiado en cada test
+// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+const withTempRepo: ConRepo = plantillaRepo('taskctl-finish-', async (repoRoot) => {
     git(['init', '-q', '-b', 'main'], repoRoot);
     git(['config', 'user.email', 'test@example.com'], repoRoot);
     git(['config', 'user.name', 'Test'], repoRoot);
@@ -76,11 +77,7 @@ async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promis
     git(['add', '-A'], repoRoot);
     git(['commit', '-q', '-m', 'inicial'], repoRoot);
     git(['checkout', '-q', '-b', 'develop'], repoRoot);
-    await fn(repoRoot, path.join(repoRoot, 'tareas'));
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
-  }
-}
+});
 
 const VEREDICTO_APROBADO = '- Veredicto: aprobada (revisada por el agente independiente)\n';
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index 3dd2dd9..0fed6be 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -20,6 +20,7 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
 import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
 import {
   runPlanCommand,
@@ -88,22 +89,16 @@ function commitAll(repoRoot: string, message: string): void {
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
-async function withTempRepo(
-  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
-): Promise<void> {
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-brainstorm-'));
-  try {
+// Repo base montado una vez por fichero y copiado en cada test
+// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+const withTempRepo: ConRepo = plantillaRepo('taskctl-brainstorm-', async (repoRoot) => {
     git(['init', '-q', '-b', 'main'], repoRoot);
     git(['config', 'user.email', 'test@example.com'], repoRoot);
     git(['config', 'user.name', 'Test'], repoRoot);
     await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
     commitAll(repoRoot, 'inicial');
     git(['checkout', '-q', '-b', 'develop'], repoRoot);
-    await fn(repoRoot, path.join(repoRoot, 'tareas'));
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
-  }
-}
+});
 
 /**
  * Lleva a `main` lo que hay en `develop`. Hace falta solo para las
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
index 416bf24..1d0f666 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -12,6 +12,7 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
 import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
 import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
 import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
@@ -66,9 +67,9 @@ function commitAll(repoRoot: string, message: string): void {
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
-async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-review-'));
-  try {
+// Repo base montado una vez por fichero y copiado en cada test
+// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+const withTempRepo: ConRepo = plantillaRepo('taskctl-review-', async (repoRoot) => {
     git(['init', '-q', '-b', 'main'], repoRoot);
     git(['config', 'user.email', 'test@example.com'], repoRoot);
     git(['config', 'user.name', 'Test'], repoRoot);
@@ -77,11 +78,7 @@ async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promis
     git(['add', '-A'], repoRoot);
     git(['commit', '-q', '-m', 'inicial'], repoRoot);
     git(['checkout', '-q', '-b', 'develop'], repoRoot);
-    await fn(repoRoot, path.join(repoRoot, 'tareas'));
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
-  }
-}
+});
 
 /**
  * Deja la tarea en-curso en su rama, como la habria dejado "taskctl
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
index bbfddca..9fd4e3a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
@@ -14,6 +14,7 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
 import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
 import { serializeTareaFile } from '../../src/core/tarea-file.js';
 import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
@@ -83,9 +84,9 @@ function commitAll(repoRoot: string, message: string): void {
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
-async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-start-'));
-  try {
+// Repo base montado una vez por fichero y copiado en cada test
+// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
+const withTempRepo: ConRepo = plantillaRepo('taskctl-start-', async (repoRoot) => {
     git(['init', '-q', '-b', 'main'], repoRoot);
     git(['config', 'user.email', 'test@example.com'], repoRoot);
     git(['config', 'user.name', 'Test'], repoRoot);
@@ -97,13 +98,7 @@ async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promis
     git(['add', '-A'], repoRoot);
     git(['commit', '-q', '-m', 'inicial'], repoRoot);
     git(['checkout', '-q', '-b', 'develop'], repoRoot);
-
-    const tareasRoot = path.join(repoRoot, 'tareas');
-    await fn(repoRoot, tareasRoot);
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
-  }
-}
+});
 
 test('taskctl start: crea la rama de verdad y mueve la tarea a 02-en-curso (tipo feature)', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts
index 04d666a..472d10e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts
@@ -29,7 +29,6 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import {
-  comprobarSkillInstalado,
   interpretarResultadoPluginList,
   type EstadoInstalacionSkill,
 } from '../../src/core/plugin-instalado.js';
@@ -172,8 +171,5 @@ test('entradas sin "id" (o con "id" no string) se ignoran sin lanzar cuando OTRA
   assert.equal(estado, 'instalado');
 });
 
-test('comprobarSkillInstalado nunca lanza y siempre devuelve un estado valido', () => {
-  const ESTADOS_VALIDOS: readonly EstadoInstalacionSkill[] = ['instalado', 'no-instalado', 'no-verificable'];
-  const estado = comprobarSkillInstalado('plugin-inventado@marketplace-inventado-para-el-test');
-  assert.ok(ESTADOS_VALIDOS.includes(estado), `estado inesperado: ${String(estado)}`);
-});
+// `comprobarSkillInstalado`, que lanza el binario real, se prueba en
+// test/integracion/plugin-instalado.test.ts.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/repo-plantilla.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/repo-plantilla.test.ts
new file mode 100644
index 0000000..9cac742
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/repo-plantilla.test.ts
@@ -0,0 +1,76 @@
+// Tests de test/helpers/repo-plantilla.ts: que cada test reciba una copia
+// propia y que lo que un test cambia no llegue al siguiente.
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, writeFile, stat } from 'node:fs/promises';
+import path from 'node:path';
+import { plantillaRepo } from './repo-plantilla.js';
+
+let montajes = 0;
+const conRepo = plantillaRepo('taskctl-plantilla-test-', async (dir) => {
+  montajes++;
+  await writeFile(path.join(dir, 'base.txt'), 'original\n', 'utf8');
+});
+
+test('repo-plantilla: la receta se ejecuta una sola vez y cada llamada recibe un directorio distinto', async () => {
+  const vistos: string[] = [];
+  await conRepo(async (repoRoot, tareasRoot) => {
+    vistos.push(repoRoot);
+    assert.equal(tareasRoot, path.join(repoRoot, 'tareas'));
+    assert.equal(await readFile(path.join(repoRoot, 'base.txt'), 'utf8'), 'original\n');
+  });
+  await conRepo(async (repoRoot) => {
+    vistos.push(repoRoot);
+  });
+  assert.equal(montajes, 1);
+  assert.notEqual(vistos[0], vistos[1]);
+});
+
+test('repo-plantilla: lo que cambia un test no contamina la copia del siguiente', async () => {
+  let anterior = '';
+  await conRepo(async (repoRoot) => {
+    anterior = repoRoot;
+    await writeFile(path.join(repoRoot, 'base.txt'), 'mutado\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'nuevo.txt'), 'x\n', 'utf8');
+  });
+  await conRepo(async (repoRoot) => {
+    assert.equal(await readFile(path.join(repoRoot, 'base.txt'), 'utf8'), 'original\n');
+    await assert.rejects(stat(path.join(repoRoot, 'nuevo.txt')), { code: 'ENOENT' });
+  });
+  // La copia se borra al terminar, tambien si el test no falla.
+  await assert.rejects(stat(anterior), { code: 'ENOENT' });
+});
+
+test('repo-plantilla: si la receta falla, el error llega al test y la siguiente llamada lo reintenta', async () => {
+  let intentos = 0;
+  const fallaUnaVez = plantillaRepo('taskctl-plantilla-falla-', async (dir) => {
+    intentos++;
+    if (intentos === 1) throw new Error('receta rota');
+    await writeFile(path.join(dir, 'ok.txt'), 'ok\n', 'utf8');
+  });
+  await assert.rejects(fallaUnaVez(async () => {}), /receta rota/);
+  await fallaUnaVez(async (repoRoot) => {
+    assert.equal(await readFile(path.join(repoRoot, 'ok.txt'), 'utf8'), 'ok\n');
+  });
+  assert.equal(intentos, 2);
+});
+
+// Una plantilla creada dentro de un test (como hace automatico.test.ts, una
+// por config) tiene que seguir viva en los tests siguientes: con un
+// `after()` atado al primer test, el segundo fallaba con ENOENT.
+let creadaDentro: ReturnType<typeof plantillaRepo> | null = null;
+
+test('repo-plantilla: una plantilla creada dentro de un test se crea y se usa ahi', async () => {
+  creadaDentro = plantillaRepo('taskctl-plantilla-dentro-', async (dir) => {
+    await writeFile(path.join(dir, 'dentro.txt'), 'si\n', 'utf8');
+  });
+  await creadaDentro(async () => {});
+});
+
+test('repo-plantilla: ... y sigue disponible en el test siguiente', async () => {
+  assert.ok(creadaDentro !== null);
+  await creadaDentro(async (repoRoot) => {
+    assert.equal(await readFile(path.join(repoRoot, 'dentro.txt'), 'utf8'), 'si\n');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/repo-plantilla.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/repo-plantilla.ts
new file mode 100644
index 0000000..24cd0b2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/repo-plantilla.ts
@@ -0,0 +1,72 @@
+// Repo plantilla para los tests que montan un repo Git temporal.
+//
+// Montar el repo base cuesta unos 6 procesos `git` (init, config, add,
+// commit, checkout) y los ficheros de test lentos lo repetian en cada
+// test. Aqui se monta una sola vez por fichero -- `node --test` corre
+// cada fichero en su propio proceso, asi que basta el estado de este
+// modulo -- y cada test recibe una copia nueva hecha con `fs.cp`.
+//
+// La receta la pone cada fichero: los repos base no son iguales entre
+// ficheros (`.gitignore` con `logs/` o sin el, con o sin `develop`), y
+// forzar uno comun cambiaria en silencio lo que prueban.
+//
+// La plantilla no debe llevar remotos, worktrees ni hooks: un worktree
+// guarda rutas absolutas en `.git/worktrees/*/gitdir`, y un remoto
+// haria que todas las copias empujaran al mismo sitio. Lo que un test
+// necesite de eso lo monta sobre su copia.
+
+import { rmSync } from 'node:fs';
+import { cp, mkdtemp, rm } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+
+export type ConRepo = (fn: (repoRoot: string, tareasRoot: string) => Promise<void>) => Promise<void>;
+
+/**
+ * Devuelve un `withTempRepo` que copia una plantilla montada una sola
+ * vez con `preparar`. Cada llamada trabaja en un directorio propio que
+ * se borra al terminar; la plantilla se borra al acabar el fichero.
+ *
+ * Si `preparar` o la copia fallan, el error llega tal cual al test: una
+ * plantilla a medias no se reutiliza.
+ */
+export function plantillaRepo(prefijo: string, preparar: (dir: string) => Promise<void>): ConRepo {
+  let plantilla: Promise<string> | null = null;
+
+  const montar = async (): Promise<string> => {
+    const dir = await mkdtemp(path.join(tmpdir(), `${prefijo}plantilla-`));
+    try {
+      await preparar(dir);
+    } catch (err) {
+      await rm(dir, { recursive: true, force: true });
+      throw err;
+    }
+    return dir;
+  };
+
+  return async (fn) => {
+    if (plantilla === null) {
+      plantilla = montar();
+      // La plantilla se borra al salir del proceso, no en un `after()`:
+      // `after()` llamado dentro de un test se ata a ese test, y una
+      // plantilla creada bajo demanda (una por config, por ejemplo) se
+      // borraria al acabar el primero que la usa.
+      plantilla.then((dir) => {
+        process.once('exit', () => rmSync(dir, { recursive: true, force: true }));
+      }, () => {});
+      // Si el montaje falla, el siguiente test lo reintenta en vez de
+      // heredar la promesa rechazada.
+      plantilla.catch(() => {
+        plantilla = null;
+      });
+    }
+    const origen = await plantilla;
+    const repoRoot = await mkdtemp(path.join(tmpdir(), prefijo));
+    try {
+      await cp(origen, repoRoot, { recursive: true });
+      await fn(repoRoot, path.join(repoRoot, 'tareas'));
+    } finally {
+      await rm(repoRoot, { recursive: true, force: true });
+    }
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-desconocidos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/cli-flags-desconocidos.test.ts
similarity index 100%
rename from taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-desconocidos.test.ts
rename to taskcode-marketplace/plugins/taskcode-plugin/test/integracion/cli-flags-desconocidos.test.ts
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/cli-main.test.ts
similarity index 100%
rename from taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
rename to taskcode-marketplace/plugins/taskcode-plugin/test/integracion/cli-main.test.ts
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
similarity index 100%
rename from taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
rename to taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts
new file mode 100644
index 0000000..00dfdd0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts
@@ -0,0 +1,19 @@
+/**
+ * Test de `comprobarSkillInstalado` (TASK-017) contra el binario real.
+ *
+ * Vive aqui y no en `test/core/plugin-instalado.test.ts` porque lanza
+ * `claude plugin list --json` de verdad: `npm run test:rapido` solo
+ * recoge `core/` y `cli/`, y en esas carpetas no hay subprocesos.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  comprobarSkillInstalado,
+  type EstadoInstalacionSkill,
+} from '../../src/core/plugin-instalado.js';
+
+test('comprobarSkillInstalado nunca lanza y siempre devuelve un estado valido', () => {
+  const ESTADOS_VALIDOS: readonly EstadoInstalacionSkill[] = ['instalado', 'no-instalado', 'no-verificable'];
+  const estado = comprobarSkillInstalado('plugin-inventado@marketplace-inventado-para-el-test');
+  assert.ok(ESTADOS_VALIDOS.includes(estado), `estado inesperado: ${String(estado)}`);
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
tareas/{01-en-diseno => 02-en-curso}/TASK-050/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-050/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-050/planificacion/brainstorm/peticion-unificador-1.md              | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-050/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-050/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-050/planificacion/plan-final.md                                    | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-050/tarea.md                                                       | 3 ++-
 7 files changed, 2 insertions(+), 1 deletion(-)
````
