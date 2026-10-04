# Peticion de revision — TASK-041 (ronda 1)

- Tarea: TASK-041 — F4-T1 taskctl new con objetivo y criterios
- Rama revisada: feature/task-041-f4-t1-taskctl-new-con-objetivo-y-criteri
- Rama base: develop
- Commit revisado (HEAD): 6c7e0b623f534436c76ea50b7033501573cc8c90
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-041 (criterios de aceptacion y plan)

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
6c7e0b6 feat(TASK-041): taskctl new con --objetivo, --criterio y --desde
296b521 chore(TASK-041): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 49b43d6..258dabf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -96,6 +96,7 @@ taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release>
             [--sprint N] [--etiquetas a,b,c]
             [--complejidad trivial|simple|media|alta|critica]
             [--modelo-sugerido X] [--agente-revisor Y]
+            [--objetivo "<texto>"] [--criterio "<texto>"]... | [--desde <fichero>]
 
 taskctl import <fichero.md> [--tipo ...] [--sprint N] [--complejidad ...]
 taskctl board [--sprint N] [--asignado-a <persona>]
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index ae84e28..bf2ae87 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -51,7 +51,8 @@ Uso:
   taskctl --version
   taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release> \\
               [--sprint N] [--etiquetas a,b,c] [--complejidad ...] \\
-              [--modelo-sugerido ...] [--agente-revisor ...]
+              [--modelo-sugerido ...] [--agente-revisor ...] \\
+              [--objetivo "<texto>"] [--criterio "<texto>"]... | [--desde <fichero.md>]
   taskctl import <fichero.md> [--tipo <feature|fix|hotfix|release>] \\
                  [--sprint N] [--complejidad ...] [--modelo-sugerido ...] \\
                  [--agente-revisor ...]
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index 0bca65e..5158c9b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -10,6 +10,7 @@
  * commitear, o cambia automaticamente a la rama base esperada segun
  * --tipo si el workspace esta limpio pero no esta ya ahi.
  */
+import { readFile } from 'node:fs/promises';
 import path from 'node:path';
 import { parseArgs } from '../cli/args.js';
 import {
@@ -29,6 +30,7 @@ import {
 import { nextTaskId } from '../core/task-id.js';
 import { listExistingTaskIds, writeTareaFile } from '../fs/task-store.js';
 import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
+import { extraerSecciones } from '../core/tarea-body.js';
 
 export class NewTaskArgError extends Error {}
 
@@ -47,6 +49,87 @@ const DEFAULT_COMPLEJIDAD: TaskComplexity = 'media';
 const DEFAULT_MODELO = 'sonnet';
 export const DEFAULT_BODY = '## Objetivo\n\n\n## Criterios de aceptacion\n- [ ] \n';
 
+/**
+ * Objetivo y criterios con los que nace la tarea (TASK-041). Sin ellos,
+ * `DEFAULT_BODY` de siempre: la seccion vacia que `plan` exige rellenar.
+ */
+export interface ContenidoInicial {
+  objetivo: string | null;
+  criterios: string[];
+  /** Fichero de `--desde`, si se paso. */
+  desde: string | null;
+}
+
+/**
+ * Saca de argv `--objetivo`, `--criterio` (repetible) y `--desde`, en sus
+ * dos formas (`--flag valor` y `--flag=valor`). Se hace ANTES de
+ * `parseArgs` porque ese parser se queda solo con el ultimo valor de un
+ * flag repetido: con el, tres `--criterio` darian uno.
+ */
+export function extraerContenidoInicial(argv: readonly string[]): {
+  contenido: ContenidoInicial;
+  resto: string[];
+} {
+  const resto: string[] = [];
+  const contenido: ContenidoInicial = { objetivo: null, criterios: [], desde: null };
+  for (let i = 0; i < argv.length; i++) {
+    const arg = argv[i] as string;
+    const m = /^--(objetivo|criterio|desde)(?:=(.*))?$/s.exec(arg);
+    if (m === null) {
+      resto.push(arg);
+      continue;
+    }
+    const nombre = m[1] as 'objetivo' | 'criterio' | 'desde';
+    let valor = m[2];
+    if (valor === undefined) {
+      valor = argv[i + 1];
+      if (valor === undefined || valor.startsWith('--')) {
+        throw new NewTaskArgError(`--${nombre} necesita un valor: --${nombre} "<texto>".`);
+      }
+      i++;
+    }
+    if (valor.trim() === '') {
+      throw new NewTaskArgError(`--${nombre} no puede estar vacio.`);
+    }
+    if (nombre === 'criterio') contenido.criterios.push(valor.trim());
+    else if (nombre === 'objetivo') contenido.objetivo = valor.trim();
+    else contenido.desde = valor;
+  }
+  if (contenido.desde !== null && (contenido.objetivo !== null || contenido.criterios.length > 0)) {
+    throw new NewTaskArgError(
+      '--desde no se combina con --objetivo ni --criterio: o el fichero trae las dos ' +
+        'secciones, o se pasan por flags.'
+    );
+  }
+  return { contenido, resto };
+}
+
+/**
+ * En la seccion de criterios de un fichero de `--desde`, una viñeta simple
+ * (`- texto`, el formato de `import`) cuenta como criterio igual que una
+ * con casilla (`- [ ] texto`). Fuera de esa seccion no se toca nada.
+ */
+function vinetasComoCasillas(texto: string): string {
+  let enCriterios = false;
+  return texto
+    .split(/\r?\n/)
+    .map((l) => {
+      if (/^#{1,6}\s/.test(l)) {
+        enCriterios = /^#{1,6}\s+criterios de aceptaci[oó]n\b/i.test(l);
+        return l;
+      }
+      return enCriterios ? l.replace(/^(\s*)[-*]\s+(?!\[[ xX]\])/, '$1- [ ] ') : l;
+    })
+    .join('\n');
+}
+
+/** Cuerpo de tarea.md con el objetivo y los criterios dados (TASK-041). */
+export function componerCuerpo(objetivo: string | null, criterios: readonly string[]): string {
+  if (objetivo === null && criterios.length === 0) return DEFAULT_BODY;
+  const lista = criterios.length === 0 ? ['- [ ] '] : criterios.map((c) => `- [ ] ${c}`);
+  return `## Objetivo\n\n${objetivo ?? ''}\n\n## Criterios de aceptacion\n${lista.join('\n')}\n`;
+}
+
 /**
  * `agenteRevisorPorDefecto` (TASK-030, item C4) es lo que se usa
  * cuando no se pasa --agente-revisor. Antes de C4 era una constante
@@ -202,8 +285,32 @@ export async function runNewCommand(
   // C2): ese parser trata "--flag valor" como par, asi que
   // "taskctl new --push \"Titulo\"" habria leido push="Titulo" y el
   // titulo habria desaparecido.
-  const { push, resto } = extraerPushFlag(argv);
+  const { push, resto: sinPush } = extraerPushFlag(argv);
+  // TASK-041: objetivo y criterios iniciales, antes de parseArgs.
+  const { contenido, resto } = extraerContenidoInicial(sinPush);
   const opts = parseNewTaskArgs(resto, config.agente_revisor_por_defecto);
+  // `--desde` se lee ANTES del guard de rama: un fichero que no existe
+  // aborta sin haber tocado nada. Si vive dentro del repo sin commitear,
+  // el guard de workspace sucio aborta como siempre.
+  let cuerpo = componerCuerpo(contenido.objetivo, contenido.criterios);
+  if (contenido.desde !== null) {
+    let texto: string;
+    try {
+      texto = await readFile(path.resolve(deps.repoCwd, contenido.desde), 'utf8');
+    } catch (e: unknown) {
+      throw new NewTaskArgError(
+        `No se pudo leer --desde "${contenido.desde}": ${e instanceof Error ? e.message : String(e)}`
+      );
+    }
+    const secciones = extraerSecciones(vinetasComoCasillas(texto));
+    const objetivo = secciones.objetivo.trim();
+    const criterios = secciones.criterios.filter((c) => c.trim() !== '');
+    // Sin las secciones de una tarea, el fichero entero es el objetivo.
+    cuerpo =
+      objetivo === '' && criterios.length === 0
+        ? componerCuerpo(texto.trim(), [])
+        : componerCuerpo(objetivo === '' ? null : objetivo, criterios);
+  }
   // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
   // tiene cambios sin commitear, o si no puede cambiar de forma
   // automatica a la rama base esperada segun opts.tipo — en ambos
@@ -212,7 +319,7 @@ export async function runNewCommand(
   const existingIds = await listExistingTaskIds(tareasRoot);
   const id = nextTaskId(existingIds);
   const task = buildNewTask(id, opts, today);
-  const filePath = await writeTareaFile(tareasRoot, task, DEFAULT_BODY, { failIfExists: true });
+  const filePath = await writeTareaFile(tareasRoot, task, cuerpo, { failIfExists: true });
   // Auto-commit (TASK-030, item C2): se commitea la CARPETA de la tarea
   // recien creada, no el arbol. La decision #14 fijo commitear si y
   // subir solo con --push.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-contenido.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-contenido.test.ts
new file mode 100644
index 0000000..7284a7e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-contenido.test.ts
@@ -0,0 +1,113 @@
+/**
+ * TASK-041: `taskctl new` con objetivo y criterios. Repos Git temporales
+ * reales; la evidencia se lee del tarea.md escrito y del commit.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { runNewCommand, NewTaskArgError, DEFAULT_BODY } from '../../src/commands/new.js';
+import { parseTareaFile } from '../../src/core/tarea-file.js';
+import { extraerSecciones } from '../../src/core/tarea-body.js';
+
+function git(args: string[], cwd: string): string {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
+  return r.stdout;
+}
+
+async function withRepo(fn: (repo: string, tareas: string) => Promise<void>): Promise<void> {
+  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-new-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repo);
+    git(['config', 'user.email', 't@t'], repo);
+    git(['config', 'user.name', 't'], repo);
+    await writeFile(path.join(repo, 'README.md'), 'r\n', 'utf8');
+    git(['add', '.'], repo);
+    git(['commit', '-q', '-m', 'i'], repo);
+    git(['checkout', '-q', '-b', 'develop'], repo);
+    await fn(repo, path.join(repo, 'tareas'));
+  } finally {
+    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+async function cuerpoDe(filePath: string): Promise<string> {
+  return parseTareaFile(await readFile(filePath, 'utf8')).body;
+}
+
+test('new (TASK-041): --objetivo y --criterio repetido dejan la tarea definida en el mismo commit', async () => {
+  await withRepo(async (repo, tareas) => {
+    const r = await runNewCommand(
+      tareas,
+      ['--titulo', 'Prueba', '--tipo', 'feature', '--objetivo', 'Que X haga Y.', '--criterio', 'A pasa', '--criterio=B pasa'],
+      '2026-10-04',
+      { repoCwd: repo }
+    );
+    const secciones = extraerSecciones(await cuerpoDe(r.filePath));
+    assert.equal(secciones.objetivo, 'Que X haga Y.');
+    assert.deepEqual(secciones.criterios, ['A pasa', 'B pasa']);
+    assert.match(git(['log', '-1', '--format=%s'], repo), /tarea creada/);
+    assert.equal(git(['status', '--porcelain'], repo).trim(), '');
+  });
+});
+
+test('new (TASK-041): sin flags, el cuerpo es el de siempre', async () => {
+  await withRepo(async (repo, tareas) => {
+    const r = await runNewCommand(tareas, ['--titulo', 'Prueba', '--tipo', 'feature'], '2026-10-04', {
+      repoCwd: repo,
+    });
+    assert.equal(await cuerpoDe(r.filePath), DEFAULT_BODY);
+  });
+});
+
+test('new (TASK-041): --desde toma las secciones del fichero, o el fichero entero como objetivo', async () => {
+  await withRepo(async (repo, tareas) => {
+    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-new-desde-'));
+    try {
+      const conSecciones = path.join(fuera, 'con.md');
+      await writeFile(
+        conSecciones,
+        '# Borrador\n\n## Objetivo\n\nQue Z.\n\n## Criterios de aceptacion\n- [ ] Uno\n- Dos\n',
+        'utf8'
+      );
+      const r1 = await runNewCommand(tareas, ['--titulo', 'Uno', '--tipo', 'feature', '--desde', conSecciones], '2026-10-04', {
+        repoCwd: repo,
+      });
+      const s1 = extraerSecciones(await cuerpoDe(r1.filePath));
+      assert.equal(s1.objetivo, 'Que Z.');
+      assert.deepEqual(s1.criterios, ['Uno', 'Dos']);
+
+      const sinSecciones = path.join(fuera, 'sin.md');
+      await writeFile(sinSecciones, 'Solo prosa del objetivo.\n', 'utf8');
+      const r2 = await runNewCommand(tareas, ['--titulo', 'Dos', '--tipo', 'feature', '--desde', sinSecciones], '2026-10-04', {
+        repoCwd: repo,
+      });
+      assert.equal(extraerSecciones(await cuerpoDe(r2.filePath)).objetivo, 'Solo prosa del objetivo.');
+    } finally {
+      await rm(fuera, { recursive: true, force: true });
+    }
+  });
+});
+
+test('new (TASK-041): --desde con --criterio, un --criterio vacio o un fichero que no existe abortan sin escribir nada', async () => {
+  await withRepo(async (repo, tareas) => {
+    const casos: string[][] = [
+      ['--desde', 'x.md', '--criterio', 'A'],
+      ['--criterio', ''],
+      ['--objetivo'],
+      ['--desde', path.join(tmpdir(), 'no-existe-taskctl.md')],
+    ];
+    for (const extra of casos) {
+      await assert.rejects(
+        runNewCommand(tareas, ['--titulo', 'X', '--tipo', 'feature', ...extra], '2026-10-04', { repoCwd: repo }),
+        NewTaskArgError,
+        extra.join(' ')
+      );
+    }
+    assert.equal(git(['status', '--porcelain'], repo).trim(), '');
+    assert.equal(git(['log', '--oneline'], repo).trim().split('\n').length, 1, 'no se tenia que commitear nada');
+  });
+});
````

## Excluido del diff (8 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-041/tarea.md                                                                        | 36 --------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-041/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-041/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-041/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-041/planificacion/plan-final.md                                    |  0
 tareas/02-en-curso/TASK-041/tarea.md                                                                         | 53 +++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                                        | 95 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++--
 8 files changed, 148 insertions(+), 39 deletions(-)
````
