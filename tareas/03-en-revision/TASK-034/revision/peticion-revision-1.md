# Peticion de revision — TASK-034 (ronda 1)

- Tarea: TASK-034 — F1-T1 Excluir lo generado del diff de revision
- Rama revisada: feature/task-034-f1-t1-excluir-lo-generado-del-diff-de-re
- Rama base: develop
- Commit revisado (HEAD): 9861438d2ae6546c1a816f2257eaa6fcfc3cd5b4
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-034 (criterios de aceptacion y plan)

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
9861438 test(TASK-034): expectativas de dominio sin la peticion generica de tarea.md
d689681 feat(TASK-034): la peticion de revision excluye dist, lockfiles y tareas del diff
d719762 chore(TASK-034): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index b554bab..ab7ce91 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -19,7 +19,8 @@
  */
 import path from 'node:path';
 import { mkdir, writeFile } from 'node:fs/promises';
-import type { Task } from '../core/task.js';
+import { STATE_FOLDER, type Task } from '../core/task.js';
+import { resolverConfig } from '../core/config.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import { siguienteRonda } from '../fs/rondas.js';
 import { fenceFor } from '../core/markdown.js';
@@ -31,8 +32,7 @@ import {
   isAncestor,
   headCommit,
   logOneline,
-  diffRange,
-  diffNameOnly,
+  diffParaRevision,
   diffRangeForPaths,
 } from '../fs/git.js';
 import {
@@ -134,7 +134,8 @@ export function peticionTemplate(
   diff: string,
   agenteRevisor: string,
   nombreInforme: string,
-  alcanceDiff: string
+  alcanceDiff: string,
+  extras: ExtrasPeticion = {}
 ): string {
   const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
   const diffBlock = diff === '' ? '(sin diferencias respecto a la base)' : diff;
@@ -146,7 +147,11 @@ export function peticionTemplate(
     `- Rama base: ${baseBranch}\n` +
     `- Commit revisado (HEAD): ${commitRevisado}\n` +
     `- Fecha: ${fecha}\n` +
-    `- Agente revisor sugerido: ${agenteRevisor}\n\n` +
+    `- Agente revisor sugerido: ${agenteRevisor}\n` +
+    (extras.carpetaTarea === undefined
+      ? ''
+      : `- Carpeta de la tarea: ${extras.carpetaTarea} (criterios de aceptacion y plan)\n`) +
+    '\n' +
     '## Instrucciones para el agente revisor\n\n' +
     'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
     'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
@@ -165,6 +170,43 @@ export function peticionTemplate(
     `## ${alcanceDiff}\n\n` +
     `${fence}diff\n` +
     `${diffBlock}\n` +
+    `${fence}\n` +
+    seccionExcluidos(baseBranch, extras)
+  );
+}
+
+/** Datos de la peticion que anadio TASK-034; opcionales para no romper la firma. */
+export interface ExtrasPeticion {
+  /** Carpeta de la tarea YA en su estado destino, relativa a la raiz del repo. */
+  carpetaTarea?: string;
+  /** Ficheros que cambian pero cuyo diff no se embebe. */
+  excluidos?: readonly string[];
+  /** `git diff --stat` de los excluidos. */
+  stat?: string;
+  /** Patrones de exclusion aplicados, para la orden que recupera su diff. */
+  patrones?: readonly string[];
+}
+
+/**
+ * Lo excluido del diff no desaparece: se dice que es, cuanto pesa y con
+ * que orden se pide (TASK-034). Sin excluidos, no hay seccion.
+ */
+function seccionExcluidos(baseBranch: string, extras: ExtrasPeticion): string {
+  const excluidos = extras.excluidos ?? [];
+  if (excluidos.length === 0) return '';
+  const patrones = (extras.patrones ?? []).map((p) => `':(glob)${p}'`).join(' ');
+  const stat = (extras.stat ?? '').trim();
+  const fence = fenceFor(stat);
+  return (
+    `\n## Excluido del diff (${excluidos.length} fichero(s))\n\n` +
+    'Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de\n' +
+    'tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo\n' +
+    'necesitas, pidelo con:\n\n' +
+    `${fence}\n` +
+    `git diff ${baseBranch}..HEAD -- ${patrones}\n` +
+    `${fence}\n\n` +
+    `${fence}\n` +
+    `${stat}\n` +
     `${fence}\n`
   );
 }
@@ -255,14 +297,21 @@ export async function runReviewCommand(
 
   const commitRevisado = headCommit(deps.repoCwd);
   const commits = logOneline(baseBranch, 'HEAD', deps.repoCwd);
-  const diff = diffRange(baseBranch, 'HEAD', deps.repoCwd);
+  // TASK-034: lo generado (dist/, lockfiles) y la propia carpeta de
+  // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
+  const excluir = resolverConfig(deps.repoCwd).excluir_de_revision;
+  const paraRevision = diffParaRevision(baseBranch, 'HEAD', excluir, deps.repoCwd);
+  const diff = paraRevision.diff;
 
   // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
   // el diff real de la rama, no `task.agente_revisor` del frontmatter,
   // decide quien revisa. El catalogo se relee de skills/*/SKILL.md en
   // CADA ejecucion (sin cache: HALLAZGOS.md documenta que una copia
   // congelada de patrones_archivo ya diverguio dos veces).
-  const ficherosTocados = diffNameOnly(baseBranch, 'HEAD', deps.repoCwd);
+  // Solo los INCLUIDOS se clasifican: un dist/*.js no debe activar un
+  // dominio ni fragmentar la revision por ficheros que nadie va a leer
+  // (correccion del rol de arquitectura, TASK-034).
+  const ficherosTocados = paraRevision.incluidos;
   const catalogoRevisores = cargarCatalogoRevisores();
   const plan = clasificarPorDominio(ficherosTocados, catalogoRevisores);
 
@@ -322,7 +371,15 @@ export async function runReviewCommand(
           diffDelGrupo,
           escritura.revisor,
           escritura.nombreInforme,
-          alcanceDiff
+          alcanceDiff,
+          {
+            // La peticion se escribe ANTES de mover la tarea: la carpeta
+            // sale del estado destino, no de filePath.
+            carpetaTarea: `tareas/${STATE_FOLDER[updated.estado]}/${updated.id}`,
+            excluidos: paraRevision.excluidos,
+            stat: paraRevision.stat,
+            patrones: excluir,
+          }
         ),
         { encoding: 'utf8', flag: 'wx' }
       );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 51d659a..b61891e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -11,6 +11,13 @@
  * | comando_sincronizacion       | null (desactivada)| fs/sincronizacion.ts    |
  * | rutas_sincronizacion         | []                | fs/sincronizacion.ts    |
  * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
+ * | excluir_de_revision          | dist, locks, tareas | commands/review.ts    |
+ *
+ * `excluir_de_revision` la anadio TASK-034: la peticion de revision
+ * embebia el diff entero, y el JS compilado, los lockfiles y la propia
+ * carpeta de tareas eran el 27 % de sus bytes. Sus patrones siguen la
+ * semantica de `git :(glob)` (los interpreta Git, no `path.matchesGlob`
+ * como `patrones_archivo` de los revisores).
  *
  * Las tres de sincronizacion las anadio TASK-033 (version 0.1.1): un
  * proyecto que genera ficheros a partir del estado de las tareas (un
@@ -87,6 +94,11 @@ export interface TaskcodeConfig {
   rutas_sincronizacion: readonly string[];
   /** Segundos que se le dejan al comando antes de matarlo. */
   timeout_sincronizacion: number;
+  /**
+   * Patrones (`git :(glob)`) cuyo diff no se embebe en la peticion de
+   * revision: aparecen solo en un `--stat`. `[]` = no excluir nada.
+   */
+  excluir_de_revision: readonly string[];
 }
 
 /**
@@ -102,6 +114,12 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   comando_sincronizacion: null,
   rutas_sincronizacion: Object.freeze([]) as readonly string[],
   timeout_sincronizacion: 60,
+  excluir_de_revision: Object.freeze([
+    '**/dist/**',
+    '**/*.lock',
+    '**/*-lock.*',
+    'tareas/**',
+  ]) as readonly string[],
 });
 
 /** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
@@ -112,6 +130,7 @@ export const CLAVES_CONFIG = [
   'comando_sincronizacion',
   'rutas_sincronizacion',
   'timeout_sincronizacion',
+  'excluir_de_revision',
 ] as const;
 
 /**
@@ -297,6 +316,9 @@ export function parsearConfig(contenido: string, ruta: string): TaskcodeConfig {
       case 'timeout_sincronizacion':
         config.timeout_sincronizacion = validarEnteroPositivo(donde, par.clave, par.valor);
         break;
+      case 'excluir_de_revision':
+        config.excluir_de_revision = validarPatronesExclusion(donde, par.valor);
+        break;
     }
   }
 
@@ -331,6 +353,46 @@ function validarSincronizacionCompleta(ruta: string, vistas: ReadonlySet<string>
   }
 }
 
+/**
+ * Lista flow de patrones `git :(glob)`. A diferencia de
+ * `rutas_sincronizacion`, una lista vacia es valida (no excluir nada) y
+ * `tareas/` se puede nombrar: excluirla es justo el valor por defecto.
+ * Un patron sin `/` se ancla en cualquier carpeta (`*.lock` →
+ * `** /*.lock`), que es lo que una persona espera y no lo que hace
+ * `:(glob)` a secas, donde `*` no cruza carpetas.
+ */
+function validarPatronesExclusion(donde: string, valor: unknown): readonly string[] {
+  if (!Array.isArray(valor)) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "excluir_de_revision" debe ser una lista entre corchetes, ` +
+        `y es ${describirValor(valor)}.\n` +
+        '        Ejemplo: excluir_de_revision: [**/dist/**, **/*.lock]. Para no excluir ' +
+        'nada: excluir_de_revision: [].'
+    );
+  }
+  const patrones: string[] = [];
+  for (const elemento of valor) {
+    if (typeof elemento !== 'string' || elemento.trim() === '') {
+      throw new ConfigError(
+        `[ERROR] ${donde}: "excluir_de_revision" contiene un elemento vacio o que no es texto.`
+      );
+    }
+    const conBarras = elemento.trim().replace(/\\/g, '/');
+    const absoluto = conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras);
+    if (absoluto || conBarras.split('/').includes('..')) {
+      throw new ConfigError(
+        `[ERROR] ${donde}: el patron "${elemento.trim()}" de "excluir_de_revision" no vale: ` +
+          `${absoluto ? 'es absoluto' : 'sale del repo con ".."'}.\n` +
+          '        Los patrones son relativos a la raiz del repo y siguen la semantica de ' +
+          'git :(glob) (por ejemplo **/dist/**).'
+      );
+    }
+    const anclado = conBarras.includes('/') ? conBarras : `**/${conBarras}`;
+    if (!patrones.includes(anclado)) patrones.push(anclado);
+  }
+  return patrones;
+}
+
 /** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
 function validarComando(donde: string, valor: unknown): string {
   if (typeof valor !== 'string' || valor.trim() === '') {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 79993af..b80a7c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -276,6 +276,58 @@ export function diffRange(desde: string, hasta: string, cwd: string): string {
   return runGit(['diff', `${desde}..${hasta}`], cwd);
 }
 
+export interface DiffParaRevision {
+  /** Ficheros cuyo diff se embebe en la peticion. */
+  incluidos: string[];
+  /** Ficheros que cambian pero casan con algun patron de exclusion. */
+  excluidos: string[];
+  /** `git diff desde..hasta` sin los excluidos. */
+  diff: string;
+  /** `git diff --stat` de solo los excluidos ('' si no hay ninguno). */
+  stat: string;
+}
+
+/**
+ * El diff que se embebe en una peticion de revision (TASK-034), sin los
+ * ficheros que casan con `excluir` (patrones `git :(glob)`, ya
+ * normalizados por config.ts).
+ *
+ * Git es la UNICA implementacion de los patrones: incluidos, excluidos,
+ * diff y stat salen todos de pathspecs, nunca de `path.matchesGlob`. Dos
+ * motores de glob para el mismo hecho divergen en `**`, en los
+ * separadores de Windows y en las comillas (lo vio el rol de
+ * arquitectura del brainstorm). Y como los argumentos son los patrones y
+ * no la lista de ficheros, la linea de comandos no crece con el diff.
+ */
+export function diffParaRevision(
+  desde: string,
+  hasta: string,
+  excluir: readonly string[],
+  cwd: string
+): DiffParaRevision {
+  const rango = `${desde}..${hasta}`;
+  const sinExcluidos = ['--', '.', ...excluir.map((p) => `:(exclude,glob)${p}`)];
+  const nombres = (args: readonly string[]): string[] =>
+    runGit(['diff', '--name-only', rango, ...args], cwd)
+      .split('\n')
+      .map((l) => l.trim())
+      .filter((l) => l !== '');
+
+  const todos = nombres([]);
+  const incluidos = excluir.length === 0 ? todos : nombres(sinExcluidos);
+  const enIncluidos = new Set(incluidos);
+  const excluidos = todos.filter((f) => !enIncluidos.has(f));
+  return {
+    incluidos,
+    excluidos,
+    diff: excluir.length === 0 ? runGit(['diff', rango], cwd) : runGit(['diff', rango, ...sinExcluidos], cwd),
+    stat:
+      excluidos.length === 0
+        ? ''
+        : runGit(['diff', '--stat', rango, '--', ...excluir.map((p) => `:(glob)${p}`)], cwd),
+  };
+}
+
 /**
  * Rutas (con "/" de Git) que cambian entre `desde` y `hasta`, sin el
  * contenido del diff (TASK-018: es la entrada del clasificador por
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index 0065e8f..c608f38 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -318,15 +318,16 @@ test('main: "taskctl review" con un diff de 2 dominios imprime una linea de peti
     const { code, stdout } = await captureOutput(() => main(['review', 'TASK-001']));
 
     assert.equal(code, 0, stdout);
-    // Un grupo por dominio (java, angular) mas el generico (tarea.md no
-    // casa ningun dominio): 3 lineas de peticion, cada una con su propio
+    // Un grupo por dominio (java, angular): 2 lineas de peticion. Hasta
+    // TASK-034 habia una tercera, del generico, solo para tarea.md; ahora
+    // tareas/** no se clasifica. Cada linea con su propio
     // nombre de fichero y su propio revisor — antes de esta correccion,
     // ningun test comprobaba que el CLI (no solo runReviewCommand) listara
     // TODAS las peticiones y no, por ejemplo, solo la primera.
     const lineasPeticion = stdout
       .split('\n')
       .filter((linea) => linea.startsWith('Peticion de revision'));
-    assert.equal(lineasPeticion.length, 3, stdout);
+    assert.equal(lineasPeticion.length, 2, stdout);
     assert.ok(
       lineasPeticion.some((l) => l.includes('java-spring-reviewer') && l.includes('peticion-revision-1-java-spring-reviewer.md')),
       stdout
@@ -336,11 +337,11 @@ test('main: "taskctl review" con un diff de 2 dominios imprime una linea de peti
       stdout
     );
     assert.ok(
-      lineasPeticion.some((l) => l.includes('code-quality-reviewer') && l.includes('peticion-revision-1-code-quality-reviewer.md')),
-      stdout
+      !lineasPeticion.some((l) => l.includes('code-quality-reviewer')),
+      `tarea.md sola ya no genera peticion al generico: ${stdout}`
     );
     // Una linea de "Lanza ese agente..." por cada peticion tambien.
     const lineasLanza = stdout.split('\n').filter((linea) => linea.includes('Lanza ese agente'));
-    assert.equal(lineasLanza.length, 3, stdout);
+    assert.equal(lineasLanza.length, 2, stdout);
   });
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
new file mode 100644
index 0000000..87fabbc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
@@ -0,0 +1,172 @@
+/**
+ * TASK-034: la peticion de `taskctl review` no embebe el diff de lo
+ * generado (dist/), los lockfiles ni la carpeta de tareas; lo deja en un
+ * `--stat` con la orden para pedirlo. Repos Git temporales reales y los
+ * scripts de Git-Flow del repo; la evidencia se lee del fichero de
+ * peticion que escribe el comando.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile, readdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { ConfigError, parsearConfig } from '../../src/core/config.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+function git(args: string[], cwd: string): string {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
+  return r.stdout;
+}
+
+function commitAll(repoRoot: string, msg: string): void {
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', msg], repoRoot);
+}
+
+const TASK: Task = {
+  id: 'TASK-930',
+  titulo: 'Prueba de exclusion del diff de revision',
+  tipo: 'feature',
+  sprint: 2,
+  etiquetas: ['cli'],
+  complejidad: 'simple',
+  modelo_sugerido: 'sonnet',
+  estado: 'en-curso',
+  plan_aprobado: true,
+  rama: 'feature/task-930-exclusion',
+  asignado_a: null,
+  agente_revisor: 'general-purpose',
+  skills_recomendados: [],
+  regla_seleccion_skill: null,
+  ultimo_commit_revisado: null,
+  revision_codex: false,
+  creado: '2026-10-03',
+  actualizado: '2026-10-03',
+  dependencias: [],
+};
+
+/**
+ * Repo con develop y la rama de la tarea en-curso con `ficheros`
+ * cambiados respecto a develop. Devuelve la peticion de la ronda 1 y
+ * los nombres de fichero que dejo `review` en revision/.
+ */
+async function revisar(
+  ficheros: Record<string, string>,
+  config: string | null = null
+): Promise<{ peticion: string; nombres: string[] }> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-excl-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    git(['config', 'core.autocrlf', 'false'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
+    if (config !== null) {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+    }
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    git(['checkout', '-q', '-b', TASK.rama], repoRoot);
+    const tareasRoot = path.join(repoRoot, 'tareas');
+    await writeTareaFile(tareasRoot, TASK, '## Objetivo\nProbar.\n');
+    for (const [rel, contenido] of Object.entries(ficheros)) {
+      await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
+      await writeFile(path.join(repoRoot, rel), contenido, 'utf8');
+    }
+    commitAll(repoRoot, 'feat(TASK-930): trabajo');
+
+    await runReviewCommand(tareasRoot, ['TASK-930'], '2026-10-03', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    const dir = path.join(tareasRoot, '03-en-revision', 'TASK-930', 'revision');
+    const nombres = (await readdir(dir)).sort();
+    const peticion = await readFile(path.join(dir, 'peticion-revision-1.md'), 'utf8');
+    return { peticion, nombres };
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+/** El bloque ```diff de la peticion (lo que el revisor lee entero). */
+function bloqueDiff(peticion: string): string {
+  const i = peticion.indexOf('diff\n', peticion.indexOf('## Diff'));
+  const fin = peticion.indexOf('\n## Excluido del diff');
+  return peticion.slice(i, fin === -1 ? undefined : fin);
+}
+
+test('review (TASK-034): dist/ y los lockfiles salen del diff embebido y quedan en el --stat con la orden para pedirlos', async () => {
+  const { peticion } = await revisar({
+    'src/b.ts': 'export const b = 1;\n',
+    'dist/a.js': 'var compilado = 1;\n',
+    'pkg/yarn.lock': 'lock: 1\n',
+  });
+  const diff = bloqueDiff(peticion);
+  assert.match(diff, /diff --git a\/src\/b\.ts/);
+  assert.doesNotMatch(diff, /dist\/a\.js/, 'el diff de dist/ no se tenia que embeber');
+  assert.doesNotMatch(diff, /yarn\.lock/, 'un lockfile en una subcarpeta tambien se excluye');
+  assert.doesNotMatch(diff, /diff --git a\/tareas\//, 'la carpeta de tareas no se embebe');
+  assert.match(peticion, /## Excluido del diff \(\d+ fichero\(s\)\)/);
+  assert.match(peticion, /dist\/a\.js\s+\|/, 'falta dist/a.js en el --stat');
+  assert.match(peticion, /pkg\/yarn\.lock\s+\|/, 'falta el lockfile en el --stat');
+  assert.match(peticion, /git diff develop\.\.HEAD -- ':\(glob\)\*\*\/dist\/\*\*'/);
+});
+
+test('review (TASK-034): la peticion nombra la carpeta de la tarea ya en su estado destino', async () => {
+  const { peticion } = await revisar({ 'src/b.ts': 'export const b = 1;\n' });
+  assert.match(peticion, /^- Carpeta de la tarea: tareas\/03-en-revision\/TASK-930 /m);
+});
+
+test('review (TASK-034): con excluir_de_revision: [] se embebe todo y no hay seccion de excluidos', async () => {
+  const { peticion } = await revisar(
+    { 'src/b.ts': 'export const b = 1;\n', 'dist/a.js': 'var compilado = 1;\n' },
+    'excluir_de_revision: []\n'
+  );
+  assert.match(bloqueDiff(peticion), /diff --git a\/dist\/a\.js/);
+  assert.doesNotMatch(peticion, /## Excluido del diff/);
+});
+
+test('review (TASK-034): un fichero excluido no activa un dominio ni fragmenta la revision', async () => {
+  // dist/App.vue casaria con el revisor de Vue: si se clasificara, habria
+  // una peticion aparte para ese dominio por un fichero que nadie lee.
+  const { nombres } = await revisar({
+    'src/b.ts': 'export const b = 1;\n',
+    'dist/App.vue': '<template></template>\n',
+  });
+  assert.deepEqual(
+    nombres.filter((n) => n.startsWith('peticion-')),
+    ['peticion-revision-1.md'],
+    `la revision se fragmento: ${nombres.join(', ')}`
+  );
+});
+
+test('config (TASK-034): excluir_de_revision valida, ancla los patrones sin / y rechaza los que salen del repo', () => {
+  const RUTA = '/repo/.taskcode/config.yml';
+  assert.deepEqual(parsearConfig('limite_wip: 1\n', RUTA).excluir_de_revision, [
+    '**/dist/**',
+    '**/*.lock',
+    '**/*-lock.*',
+    'tareas/**',
+  ]);
+  assert.deepEqual(parsearConfig('excluir_de_revision: []\n', RUTA).excluir_de_revision, []);
+  assert.deepEqual(
+    parsearConfig('excluir_de_revision: [*.min.js, build\\**, *.min.js]\n', RUTA).excluir_de_revision,
+    ['**/*.min.js', 'build/**']
+  );
+  for (const malo of ['[/etc/x]', '[C:/x]', '[../fuera/**]', '[""]', 'dist']) {
+    assert.throws(
+      () => parsearConfig(`excluir_de_revision: ${malo}\n`, RUTA),
+      ConfigError,
+      `deberia rechazar ${malo}`
+    );
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
index fc1f2d5..b248648 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -501,11 +501,12 @@ test('taskctl review: un diff que toca 1 dominio (java) genera 1 peticion con el
       scriptsDir: SCRIPTS_DIR,
     });
 
-    // tarea.md tambien esta en el diff (toda tarea lo commitea en su
-    // rama) y no casa ningun dominio: le toca al generico, ademas del
-    // grupo de dominio — el mismo criterio de aceptacion 4, no un caso
-    // aparte.
-    assert.equal(result.informes.length, 2);
+    // Expectativa cambiada en TASK-034: tarea.md esta en el diff (toda
+    // tarea lo commitea en su rama), pero tareas/** ya no se embebe ni se
+    // clasifica (excluir_de_revision por defecto). Antes le tocaba al
+    // generico una peticion entera solo para tarea.md; ahora no se lanza:
+    // un agente revisor menos por tarea de un solo dominio.
+    assert.equal(result.informes.length, 1);
     const grupo = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
     assert.ok(grupo !== undefined, 'deberia haber un grupo para java-spring-reviewer');
     assert.notEqual(grupo.revisor, task.agente_revisor);
@@ -516,10 +517,15 @@ test('taskctl review: un diff que toca 1 dominio (java) genera 1 peticion con el
     const peticion = await readFile(grupo.peticionPath, 'utf8');
     assert.match(peticion, /Agente revisor sugerido: java-spring-reviewer/);
     assert.match(peticion, /UserService\.java/);
-    assert.doesNotMatch(peticion, /tarea\.md/);
+    // Desde TASK-034 tarea.md aparece en el --stat de excluidos, pero su
+    // diff no se embebe.
+    assert.doesNotMatch(peticion, /diff --git a\/tareas\//);
 
-    const generico = result.informes.find((g) => g.revisor === 'code-quality-reviewer')!;
-    assert.deepEqual(generico.ficheros, [rutaTareaMd('TASK-620')]);
+    assert.equal(
+      result.informes.find((g) => g.revisor === 'code-quality-reviewer'),
+      undefined,
+      'tarea.md solo ya no genera una peticion al generico (TASK-034)'
+    );
   });
 });
 
@@ -545,23 +551,17 @@ test('taskctl review: un diff que toca 2 dominios bajo el umbral genera 2 petici
       scriptsDir: SCRIPTS_DIR,
     });
 
-    // 2 grupos de dominio + el generico para tarea.md (que no casa
-    // ningun dominio, ver el test anterior).
-    assert.equal(result.informes.length, 3);
+    // 2 grupos de dominio. Desde TASK-034 ya no hay un tercero para
+    // tarea.md: tareas/** se excluye del diff y de la clasificacion.
+    assert.equal(result.informes.length, 2);
     const revisores = result.informes.map((g) => g.revisor).sort();
-    assert.deepEqual(revisores, [
-      'angular-vue-reviewer',
-      'code-quality-reviewer',
-      'java-spring-reviewer',
-    ]);
+    assert.deepEqual(revisores, ['angular-vue-reviewer', 'java-spring-reviewer']);
 
     const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
     const grupoAngular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer')!;
-    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer')!;
 
     assert.deepEqual(grupoJava.ficheros, ['src/main/java/com/acme/UserService.java']);
     assert.deepEqual(grupoAngular.ficheros, ['src/app/user-profile/user-profile.component.ts']);
-    assert.deepEqual(grupoGenerico.ficheros, [rutaTareaMd('TASK-621')]);
 
     const peticionJava = await readFile(grupoJava.peticionPath, 'utf8');
     assert.match(peticionJava, /UserService\.java/);
@@ -598,18 +598,15 @@ test('taskctl review: un diff que toca EXACTAMENTE 3 dominios sigue fragmentando
 
     // Con el catalogo real (3 revisores de dominio, umbral_dominios: 3),
     // exactamente 3 dominios SIGUE fragmentando: no cae al generico. Los
-    // 3 dominios detectados (lo que fija el criterio del umbral) mas el
-    // generico para tarea.md, que sigue sin casar ningun dominio.
-    assert.equal(result.informes.length, 4);
+    // 3 dominios detectados (lo que fija el criterio del umbral). Desde
+    // TASK-034 sin generico para tarea.md: tareas/** ya no se clasifica.
+    assert.equal(result.informes.length, 3);
     const revisores = result.informes.map((g) => g.revisor).sort();
     assert.deepEqual(revisores, [
       'angular-vue-reviewer',
-      'code-quality-reviewer',
       'csharp-autocad-ifc-reviewer',
       'java-spring-reviewer',
     ]);
-    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer')!;
-    assert.deepEqual(grupoGenerico.ficheros, [rutaTareaMd('TASK-622')]);
   });
 });
 
@@ -623,7 +620,8 @@ test('taskctl review: ficheros que no casan ningun dominio, con 1-3 dominios ya
       'class UserService {}\n'
     );
     // Ruta ajena congelada en RUTAS_AJENAS (revisores.test.ts): no casa
-    // con ningun revisor de dominio, igual que tarea.md.
+    // con ningun revisor de dominio. Desde TASK-034 es el UNICO fichero
+    // del generico: tarea.md ya no se clasifica.
     await escribirFichero(repoRoot, 'src/index.ts', 'export const arranque = 1;\n');
     commitAll(repoRoot, 'servicio Java mas un fichero sin dominio');
     await advanceDevelop(repoRoot, task.rama);
@@ -639,13 +637,10 @@ test('taskctl review: ficheros que no casan ningun dominio, con 1-3 dominios ya
     assert.ok(grupoJava !== undefined, 'el fichero Java deberia tener su propio grupo');
     assert.ok(
       grupoGenerico !== undefined,
-      'los ficheros sin dominio (src/index.ts, tarea.md) deberian cubrirlos el generico, sin quedar sin revisor'
+      'los ficheros sin dominio (src/index.ts) deberia cubrirlos el generico, sin quedar sin revisor'
     );
     assert.deepEqual(grupoJava!.ficheros, ['src/main/java/com/acme/UserService.java']);
-    assert.deepEqual(
-      [...grupoGenerico!.ficheros].sort(),
-      [rutaTareaMd('TASK-623'), 'src/index.ts'].sort()
-    );
+    assert.deepEqual([...grupoGenerico!.ficheros], ['src/index.ts']);
 
     const peticionGenerico = await readFile(grupoGenerico!.peticionPath, 'utf8');
     assert.match(peticionGenerico, /src\/index\.ts/);
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ':(glob)**/dist/**' ':(glob)**/*.lock' ':(glob)**/*-lock.*' ':(glob)tareas/**'
````

````
tareas/01-en-diseno/TASK-034/tarea.md              | 39 -----------
 .../peticion-brainstorm-arquitectura-1.md          |  0
 .../brainstorm/peticion-unificador-1.md            |  0
 .../brainstorm/salida-brainstorm-arquitectura-1.md |  0
 .../TASK-034/planificacion/plan-final.md           |  0
 tareas/02-en-curso/TASK-034/tarea.md               | 76 ++++++++++++++++++++++
 .../taskcode-plugin/dist/src/commands/review.js    | 55 ++++++++++++++--
 .../taskcode-plugin/dist/src/core/config.js        | 51 +++++++++++++++
 .../plugins/taskcode-plugin/dist/src/fs/git.js     | 32 +++++++++
 9 files changed, 208 insertions(+), 45 deletions(-)
````
