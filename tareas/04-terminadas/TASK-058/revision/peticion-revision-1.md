# Peticion de revision — TASK-058 (ronda 1)

- Tarea: TASK-058 — Flujo D: modo semiautomatico
- Rama revisada: feature/task-058-flujo-d-modo-semiautomatico
- Rama base: develop
- Commit revisado (HEAD): e2f340f26b327f7f3c8abe92d996e5ad86ae042f
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-058 (criterios de aceptacion y plan)

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
e2f340f feat(TASK-058): modo semiautomatico y cadena de fases con bloqueo por arbol
61ff6a9 chore(TASK-058): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
index 55adba4..94d4bcf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
@@ -10,7 +10,9 @@ Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
 
 ## Pasos
 
-1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
+   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
+   y para si falla (ver la cadena en `task-workflow/avance.md`).
 2. Lee `planificacion/plan-final.md` de la tarea (el ID viene en
    `$ARGUMENTS`) y presentalo resumido: enfoque, riesgos, plan de pruebas y
    lo que pida decision de una persona.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md
index 7bc4571..3e894d5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md
@@ -10,7 +10,9 @@ Solo lee: no mueve ninguna tarea ni commitea nada.
 
 ## Pasos
 
-1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
+   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
+   y para si falla (ver la cadena en `task-workflow/avance.md`).
 2. Ejecuta `taskctl board` (acepta `--sprint N` y `--asignado-a <persona>`
    si vienen en `$ARGUMENTS`) y muestra su salida tal cual.
 3. Si `$ARGUMENTS` trae un ID `TASK-NNN`, ejecuta tambien
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index 57b13ad..561ad18 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -10,7 +10,9 @@ Mergea la rama de la tarea (sin borrarla) y la deja en `terminada`.
 
 ## Pasos
 
-1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
+   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
+   y para si falla (ver la cadena en `task-workflow/avance.md`).
 2. Comprueba que el `tarea.md` tiene los criterios de aceptacion marcados y
    una seccion `## Resultado` con lo implementado, lo que encontro la
    revision y lo que se decidio no corregir. Si falta, completalo y
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
index 6f3fd19..c24498d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
@@ -11,7 +11,9 @@ arrancar sin volver a preguntar.
 
 ## Pasos
 
-1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
+   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
+   y para si falla (ver la cadena en `task-workflow/avance.md`).
 2. Reune lo que falte de `$ARGUMENTS` preguntando a la persona (una sola
    pregunta con varias partes, mejor que cuatro seguidas):
    - **titulo** corto;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index 647ab06..c9eaff2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -12,7 +12,9 @@ no deberian necesitar volver a preguntar.
 
 ## Pasos
 
-1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
+   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
+   y para si falla (ver la cadena en `task-workflow/avance.md`).
 2. Mira donde esta la tarea (el ID viene en `$ARGUMENTS`):
    `taskctl siguiente TASK-NNN --json`.
    - **`estado: planificada`**: ejecuta `taskctl plan TASK-NNN` y sigue en el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index cfd7657..ce4b2a3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -11,7 +11,9 @@ punto, no un formalismo.
 
 ## Pasos
 
-1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
+   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
+   y para si falla (ver la cadena en `task-workflow/avance.md`).
 2. Con el ID de `$ARGUMENTS`, mira donde esta: `taskctl siguiente TASK-NNN --json`,
    y haz SOLO lo que corresponde a su `fase`:
    - `review`: la implementacion (o las correcciones de la ronda anterior)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index 8dca609..ab854cf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -10,7 +10,9 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
 
 ## Pasos
 
-1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
+   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
+   y para si falla (ver la cadena en `task-workflow/avance.md`).
 2. Ejecuta `taskctl start TASK-NNN` (el ID viene en `$ARGUMENTS`). Si aborta
    por el limite de trabajo en curso, muestra el error tal cual: dice que
    tarea hay que cerrar primero. No lo rodees.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index c874c11..4451a20 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -49,11 +49,38 @@ commitearlo y dejar la suite en verde; despues, la revision.
 - **`detener`** (modo `manual`): no encadenar nada. Terminar diciendo a la
   persona, en una linea, el `motivo` y la skill de la siguiente fase con su
   ID, por ejemplo `/taskcode-plugin:approve TASK-NNN`. Si la tarea esta
-  terminada, decirlo y nada mas.
-- **`preguntar`** y **`continuar`**: los modos `semiautomatico` y
-  `automatico` todavia no encadenan fases desde las skills. Hasta entonces se
-  tratan exactamente igual que `detener`: es el fallo seguro, nunca se avanza
-  de mas.
+  terminada, decirlo y nada mas. Si habia una cadena abierta, cerrarla.
+- **`preguntar`**: preguntar a la persona con AskUserQuestion si pasar a la
+  siguiente fase, con el `motivo` y dos opciones.
+  - **Si**: encadenar la skill siguiente (abajo).
+  - **No**: ejecutar `taskctl pausa TASK-NNN` (deja el «no» en el registro de
+    la tarea, sin cambiar su estado), cerrar la cadena y terminar nombrando la
+    skill que la reanuda.
+- **`continuar`**: encadenar la skill siguiente sin preguntar.
+
+No se encadena, aunque la accion lo diga, cuando la `fase` es `review` con la
+tarea `en-curso`: primero hay que implementar el plan. La skill termina como
+en `detener`, diciendo que toca implementar y despues revisar.
+
+## Encadenar la skill siguiente (la cadena)
+
+Mientras una cadena de fases esta en marcha, el arbol de trabajo queda
+bloqueado para otras sesiones (dos sesiones encadenando sobre el mismo arbol
+se pisan las ramas). La cadena se identifica con un testigo:
+
+1. Si esta skill recibio `--cadena <testigo>` en `$ARGUMENTS`, la cadena ya
+   esta abierta: usa ese testigo. Si no, abrela ahora:
+   `taskctl cadena abrir TASK-NNN` imprime el testigo. Si aborta porque hay
+   otra cadena en marcha, muestra el error tal cual y para.
+2. Invoca la skill de la siguiente fase con la herramienta Skill:
+   `taskcode-plugin:<skill>` con argumentos `TASK-NNN --cadena <testigo>`.
+3. Cerrar la cadena: `taskctl cadena cerrar <testigo>`, cuando la cadena se
+   detiene (un `detener`, un «no», un error o la tarea terminada). Solo la
+   cierra quien tiene el testigo.
+
+Una skill que recibe `--cadena <testigo>` empieza, despues de situarse en la
+raiz, con `taskctl cadena comprobar <testigo>`; si falla, para y muestra el
+error. En modo `manual` no hay cadena ni bloqueo.
 
 ## Reglas que no cambian con el modo
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 86c73c3..e36df30 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -18,6 +18,7 @@ import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
 import { runPausaCommand, PausaCommandError } from './commands/pausa.js';
+import { runCadenaCommand, CadenaCommandError } from './commands/cadena.js';
 import {
   isWrapperCommand,
   runWrapperCommand,
@@ -69,6 +70,7 @@ Uso:
   taskctl finish TASK-NNN [--push]
   taskctl siguiente TASK-NNN [--json]
   taskctl pausa TASK-NNN [--push]
+  taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar
   taskctl diagnose
   taskctl pause [--push]
   taskctl resume [<rama>]
@@ -76,7 +78,7 @@ Uso:
   taskctl abort-merge
 
 Comandos: new, import, board, start, plan, approve, review, codex-review, veredicto, finish,
-siguiente, pausa.
+siguiente, pausa, cadena.
 siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
 manual, semiautomatico o automatico); solo lee. pausa registra que la persona
 no quiere pasar todavia a la siguiente fase.
@@ -612,6 +614,24 @@ async function mainComando(argv: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'cadena') {
+    const repoCwd = process.cwd();
+    try {
+      const r = await runCadenaCommand(argv.slice(1), { repoCwd });
+      // abrir imprime SOLO el testigo en stdout, para que una skill lo capture.
+      if (r.accion === 'abrir') process.stdout.write(`${r.bloqueo.testigo}\n`);
+      else if (r.accion === 'comprobar') process.stdout.write(`Cadena de ${r.bloqueo.tarea}: abierta.\n`);
+      else process.stdout.write(r.existia ? 'Cadena cerrada.\n' : 'No habia ninguna cadena abierta.\n');
+      return 0;
+    } catch (e) {
+      if (e instanceof CadenaCommandError || e instanceof GitLaunchError || e instanceof GitCommandError) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'pausa') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
new file mode 100644
index 0000000..cf7911d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -0,0 +1,153 @@
+/**
+ * `taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar`
+ * — TASK-058.
+ *
+ * Bloqueo por arbol de trabajo mientras dura una cadena de fases
+ * (semiautomatico y automatico). Dos sesiones sobre el mismo arbol harian
+ * checkout y commits a la vez y el trabajo acabaria en la rama equivocada
+ * (riesgo del plan de TASK-055). El bloqueo vive en el directorio de Git
+ * (`git rev-parse --git-path`), fuera del arbol: no ensucia el workspace y
+ * en un worktree enlazado es propio de ese worktree.
+ *
+ * Una sesion de Claude Code no tiene identidad que el CLI pueda ver, asi que
+ * la identidad es un TESTIGO: `abrir` lo genera y lo imprime, las skills lo
+ * pasan de una a la siguiente con `--cadena`, y solo quien lo tiene puede
+ * comprobar o cerrar el bloqueo.
+ *
+ * El fichero se crea con la bandera `wx` (falla si existe): dos `abrir` a la
+ * vez no pueden ganar los dos.
+ */
+import { randomBytes } from 'node:crypto';
+import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { runGit } from '../fs/git.js';
+import { isEexist, isEnoent } from '../fs/task-store.js';
+import { isValidTaskId } from '../core/task.js';
+
+export class CadenaCommandError extends Error {}
+
+export interface CadenaCommandDeps {
+  repoCwd: string;
+  /** Solo para tests: el instante actual. */
+  ahora?: () => Date;
+}
+
+export interface Bloqueo {
+  tarea: string;
+  testigo: string;
+  abierto: string;
+}
+
+export type CadenaCommandResult =
+  | { accion: 'abrir'; bloqueo: Bloqueo; ruta: string }
+  | { accion: 'comprobar'; bloqueo: Bloqueo }
+  | { accion: 'cerrar'; ruta: string; existia: boolean };
+
+/** Ruta absoluta del bloqueo, en el directorio de Git de este arbol. */
+export function rutaBloqueo(repoCwd: string): string {
+  return path.resolve(repoCwd, runGit(['rev-parse', '--git-path', 'taskcode/cadena.lock'], repoCwd));
+}
+
+async function leerBloqueo(ruta: string): Promise<Bloqueo | null> {
+  let texto: string;
+  try {
+    texto = await readFile(ruta, 'utf8');
+  } catch (e: unknown) {
+    if (isEnoent(e)) return null;
+    throw e;
+  }
+  try {
+    const b = JSON.parse(texto) as Partial<Bloqueo>;
+    if (typeof b.tarea === 'string' && typeof b.testigo === 'string' && typeof b.abierto === 'string') {
+      return { tarea: b.tarea, testigo: b.testigo, abierto: b.abierto };
+    }
+  } catch {
+    // Fichero roto: se trata como un bloqueo de origen desconocido.
+  }
+  return { tarea: '(desconocida)', testigo: '', abierto: '(desconocido)' };
+}
+
+function antiguedad(abierto: string, ahora: Date): string {
+  const t = Date.parse(abierto);
+  if (Number.isNaN(t)) return 'desde un momento desconocido';
+  const min = Math.max(0, Math.round((ahora.getTime() - t) / 60000));
+  return min < 60 ? `hace ${String(min)} min` : `hace ${String(Math.round(min / 60))} h`;
+}
+
+function mensajeOcupado(b: Bloqueo, ruta: string, ahora: Date): string {
+  return (
+    `[ERROR] Hay otra cadena de fases en marcha en este arbol de trabajo: ${b.tarea}, ` +
+    `abierta ${antiguedad(b.abierto, ahora)} (${ruta}).\n` +
+    '        Dos sesiones encadenando fases sobre el mismo arbol se pisan las ramas. Espera a ' +
+    'que termine, o trabaja desde otro worktree.\n' +
+    '        Si esa sesion ya no existe (se corto a medias): taskctl cadena cerrar --forzar'
+  );
+}
+
+export async function runCadenaCommand(
+  argv: readonly string[],
+  deps: CadenaCommandDeps
+): Promise<CadenaCommandResult> {
+  const ahora = (deps.ahora ?? (() => new Date()))();
+  const [accion, arg] = argv;
+  const ruta = rutaBloqueo(deps.repoCwd);
+
+  switch (accion) {
+    case 'abrir': {
+      if (arg === undefined || !isValidTaskId(arg)) {
+        throw new CadenaCommandError('[ERROR] Uso: taskctl cadena abrir TASK-NNN.');
+      }
+      const bloqueo: Bloqueo = {
+        tarea: arg,
+        testigo: randomBytes(8).toString('hex'),
+        abierto: ahora.toISOString(),
+      };
+      await mkdir(path.dirname(ruta), { recursive: true });
+      try {
+        await writeFile(ruta, `${JSON.stringify(bloqueo)}\n`, { encoding: 'utf8', flag: 'wx' });
+      } catch (e: unknown) {
+        if (!isEexist(e)) throw e;
+        const otro = await leerBloqueo(ruta);
+        throw new CadenaCommandError(mensajeOcupado(otro as Bloqueo, ruta, ahora));
+      }
+      return { accion: 'abrir', bloqueo, ruta };
+    }
+    case 'comprobar': {
+      if (arg === undefined || arg.startsWith('--')) {
+        throw new CadenaCommandError('[ERROR] Uso: taskctl cadena comprobar <testigo>.');
+      }
+      const b = await leerBloqueo(ruta);
+      if (b === null) {
+        throw new CadenaCommandError(
+          '[ERROR] La cadena ya no esta abierta en este arbol (se cerro o se forzo su cierre). ' +
+            'Para seguir, lanza la skill de la fase sin --cadena: abrira una nueva si hace falta.'
+        );
+      }
+      if (b.testigo !== arg) throw new CadenaCommandError(mensajeOcupado(b, ruta, ahora));
+      return { accion: 'comprobar', bloqueo: b };
+    }
+    case 'cerrar': {
+      const b = await leerBloqueo(ruta);
+      if (arg === '--forzar') {
+        await rm(ruta, { force: true });
+        return { accion: 'cerrar', ruta, existia: b !== null };
+      }
+      if (arg === undefined) {
+        throw new CadenaCommandError('[ERROR] Uso: taskctl cadena cerrar <testigo> | cerrar --forzar.');
+      }
+      if (b === null) return { accion: 'cerrar', ruta, existia: false };
+      if (b.testigo !== arg) {
+        throw new CadenaCommandError(
+          `[ERROR] El testigo no es el de la cadena abierta (${b.tarea}): no se cierra la cadena ` +
+            'de otra sesion. Si esa sesion ya no existe: taskctl cadena cerrar --forzar'
+        );
+      }
+      await rm(ruta, { force: true });
+      return { accion: 'cerrar', ruta, existia: true };
+    }
+    default:
+      throw new CadenaCommandError(
+        '[ERROR] Uso: taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar.'
+      );
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
new file mode 100644
index 0000000..78bdacd
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
@@ -0,0 +1,196 @@
+/**
+ * `taskctl cadena` (TASK-058). Repos Git temporales reales y el CLI real por spawn.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile, access } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { runCadenaCommand, CadenaCommandError } from '../../src/commands/cadena.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
+const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
+  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+function cliOk(cwd: string, args: string[]) {
+  const r = cli(cwd, args);
+  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
+  return r;
+}
+
+async function existe(p: string): Promise<boolean> {
+  try {
+    await access(p);
+    return true;
+  } catch {
+    return false;
+  }
+}
+
+function rutaLock(cwd: string): string {
+  return path.resolve(cwd, git(['rev-parse', '--git-path', 'taskcode/cadena.lock'], cwd).trim());
+}
+
+async function withRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-cadena-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+test('abrir imprime solo un testigo hex de 16 caracteres y crea el bloqueo fuera del arbol', async () => {
+  await withRepo(async (repoRoot) => {
+    const r = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']);
+    assert.match(r.stdout.trim(), /^[0-9a-f]{16}$/);
+    assert.equal(r.stdout.trim().split(/\s+/).length, 1, 'solo el testigo');
+    const lock = rutaLock(repoRoot);
+    assert.ok(await existe(lock), `falta el bloqueo en ${lock}`);
+    assert.ok(path.relative(repoRoot, lock).startsWith('.git'), 'vive en el directorio de Git');
+    const json = JSON.parse(await readFile(lock, 'utf8')) as Record<string, string>;
+    assert.equal(json.tarea, 'TASK-001');
+    assert.equal(json.testigo, r.stdout.trim());
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('segundo abrir falla y nombra la tarea, la antiguedad y --forzar', async () => {
+  await withRepo(async (repoRoot) => {
+    const t = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
+    const r = cli(repoRoot, ['cadena', 'abrir', 'TASK-002']);
+    assert.notEqual(r.status, 0);
+    assert.ok(r.stderr.includes('TASK-001'), r.stderr);
+    assert.match(r.stderr, /hace \d+ min/);
+    assert.ok(r.stderr.includes('taskctl cadena cerrar --forzar'), r.stderr);
+    // El bloqueo original sigue intacto.
+    cliOk(repoRoot, ['cadena', 'comprobar', t]);
+  });
+});
+
+test('runCadenaCommand con ahora inyectado: la antiguedad sale en minutos y en horas', async () => {
+  await withRepo(async (repoRoot) => {
+    const t0 = new Date('2026-10-04T10:00:00.000Z');
+    await runCadenaCommand(['abrir', 'TASK-007'], { repoCwd: repoRoot, ahora: () => t0 });
+    await assert.rejects(
+      runCadenaCommand(['abrir', 'TASK-008'], { repoCwd: repoRoot, ahora: () => new Date(t0.getTime() + 12 * 60000) }),
+      (e: unknown) => e instanceof CadenaCommandError && e.message.includes('TASK-007') && e.message.includes('hace 12 min')
+    );
+    await assert.rejects(
+      runCadenaCommand(['abrir', 'TASK-008'], { repoCwd: repoRoot, ahora: () => new Date(t0.getTime() + 3 * 3600000) }),
+      (e: unknown) => e instanceof CadenaCommandError && e.message.includes('hace 3 h')
+    );
+  });
+});
+
+test('comprobar: testigo bueno 0, malo != 0, sin bloqueo != 0 con mensaje', async () => {
+  await withRepo(async (repoRoot) => {
+    const sin = cli(repoRoot, ['cadena', 'comprobar', 'abcdef0123456789']);
+    assert.notEqual(sin.status, 0);
+    assert.match(sin.stderr, /ya no esta abierta/);
+
+    const t = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
+    assert.equal(cli(repoRoot, ['cadena', 'comprobar', t]).status, 0);
+    const malo = cli(repoRoot, ['cadena', 'comprobar', '0000000000000000']);
+    assert.notEqual(malo.status, 0);
+    assert.ok(malo.stderr.includes('TASK-001'));
+  });
+});
+
+test('cerrar con testigo ajeno falla y no borra; con el bueno borra', async () => {
+  await withRepo(async (repoRoot) => {
+    const t = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
+    const lock = rutaLock(repoRoot);
+    const ajeno = cli(repoRoot, ['cadena', 'cerrar', '0000000000000000']);
+    assert.notEqual(ajeno.status, 0);
+    assert.ok(await existe(lock), 'el bloqueo debe seguir');
+    cliOk(repoRoot, ['cadena', 'cerrar', t]);
+    assert.equal(await existe(lock), false);
+    // Tras cerrar se puede abrir otra.
+    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-002']);
+  });
+});
+
+test('cerrar --forzar borra el bloqueo sin testigo, y sin bloqueo no falla', async () => {
+  await withRepo(async (repoRoot) => {
+    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']);
+    const lock = rutaLock(repoRoot);
+    cliOk(repoRoot, ['cadena', 'cerrar', '--forzar']);
+    assert.equal(await existe(lock), false);
+    cliOk(repoRoot, ['cadena', 'cerrar', '--forzar']);
+  });
+});
+
+test('un bloqueo con JSON roto se trata como ocupado y --forzar lo limpia', async () => {
+  await withRepo(async (repoRoot) => {
+    const lock = rutaLock(repoRoot);
+    await mkdir(path.dirname(lock), { recursive: true });
+    await writeFile(lock, '{esto no es json', 'utf8');
+    const r = cli(repoRoot, ['cadena', 'abrir', 'TASK-001']);
+    assert.notEqual(r.status, 0);
+    assert.ok(await existe(lock), 'no se pisa el bloqueo roto');
+    assert.ok(r.stderr.includes('taskctl cadena cerrar --forzar'));
+    cliOk(repoRoot, ['cadena', 'cerrar', '--forzar']);
+    assert.equal(await existe(lock), false);
+    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']);
+  });
+});
+
+test('en un worktree enlazado el bloqueo es independiente del arbol principal', async () => {
+  await withRepo(async (repoRoot) => {
+    const wt = path.join(await mkdtemp(path.join(tmpdir(), 'taskctl-cadena-wt-')), 'wt');
+    try {
+      git(['worktree', 'add', '-q', '-b', 'otra', wt], repoRoot);
+      const t1 = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
+      const t2 = cliOk(wt, ['cadena', 'abrir', 'TASK-002']).stdout.trim();
+      assert.notEqual(rutaLock(repoRoot), rutaLock(wt));
+      assert.notEqual(t1, t2);
+      // Cada testigo vale solo en su arbol.
+      assert.equal(cli(repoRoot, ['cadena', 'comprobar', t1]).status, 0);
+      assert.equal(cli(wt, ['cadena', 'comprobar', t2]).status, 0);
+      assert.notEqual(cli(wt, ['cadena', 'comprobar', t1]).status, 0);
+      cliOk(wt, ['cadena', 'cerrar', t2]);
+      assert.equal(cli(repoRoot, ['cadena', 'comprobar', t1]).status, 0, 'cerrar en el worktree no toca el principal');
+    } finally {
+      git(['worktree', 'remove', '--force', wt], repoRoot);
+      await rm(path.dirname(wt), { recursive: true, force: true });
+    }
+  });
+});
+
+test('abrir sin ID valido, y subcomando desconocido, salen != 0 sin crear bloqueo', async () => {
+  await withRepo(async (repoRoot) => {
+    const lock = rutaLock(repoRoot);
+    assert.notEqual(cli(repoRoot, ['cadena', 'abrir']).status, 0);
+    assert.notEqual(cli(repoRoot, ['cadena', 'abrir', 'foo']).status, 0);
+    assert.notEqual(cli(repoRoot, ['cadena', 'abrir', 'TASK-1']).status, 0);
+    assert.notEqual(cli(repoRoot, ['cadena', 'inventado']).status, 0);
+    assert.notEqual(cli(repoRoot, ['cadena', 'comprobar']).status, 0);
+    assert.notEqual(cli(repoRoot, ['cadena', 'cerrar']).status, 0);
+    assert.equal(await existe(lock), false);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/semiautomatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/semiautomatico.test.ts
new file mode 100644
index 0000000..efe6d26
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/semiautomatico.test.ts
@@ -0,0 +1,179 @@
+/**
+ * Flujo D, modo semiautomatico (TASK-058): rechazo en la pregunta de approve,
+ * contraprueba de aceptacion y cadena de fases con bloqueo. Repos Git
+ * temporales reales y el CLI real por spawn.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { runNewCommand } from '../../src/commands/new.js';
+import { runPlanCommand } from '../../src/commands/plan.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
+const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'gitflow');
+const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
+const HOY = '2026-10-04';
+const ID = 'TASK-001';
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
+  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+function cliOk(cwd: string, args: string[]) {
+  const r = cli(cwd, args);
+  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
+  return r;
+}
+
+function siguiente(cwd: string): Record<string, unknown> {
+  return JSON.parse(cliOk(cwd, ['siguiente', ID, '--json']).stdout) as Record<string, unknown>;
+}
+
+async function withRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-semiauto-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'modo_flujo: semiautomatico\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+/** Tarea creada, planificada con plan-final.md redactado y todo commiteado. */
+async function tareaPlanificada(repoRoot: string, tareasRoot: string): Promise<void> {
+  const creada = await runNewCommand(
+    tareasRoot,
+    [
+      '--titulo', 'Flujo semiautomatico',
+      '--tipo', 'feature',
+      '--complejidad', 'simple',
+      '--objetivo', 'Probar el modo semiautomatico.',
+      '--criterio', 'La tarea queda en 02-en-curso',
+    ],
+    HOY,
+    { repoCwd: repoRoot }
+  );
+  assert.equal(creada.id, ID);
+  await runPlanCommand(tareasRoot, [ID], HOY, { repoCwd: repoRoot });
+  await writeFile(
+    path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
+    '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
+    'utf8'
+  );
+  commitAll(repoRoot, `docs(${ID}): plan final`);
+}
+
+function assertApprovePreguntar(s: Record<string, unknown>): void {
+  assert.deepEqual(
+    [s.estado, s.modo, s.fase, s.comando, s.accion],
+    ['en-diseno', 'semiautomatico', 'approve', `taskctl approve ${ID}`, 'preguntar']
+  );
+}
+
+test('respuesta «no» en approve: pausa deja la tarea en diseno, con fila pausa de persona y siguiente igual', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await tareaPlanificada(repoRoot, tareasRoot);
+    assertApprovePreguntar(siguiente(repoRoot));
+
+    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    cliOk(repoRoot, ['pausa', ID]);
+
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.ok(t);
+    assert.equal(t.task.estado, 'en-diseno');
+    assert.equal(t.task.plan_aprobado, false);
+    const carpeta = path.join(tareasRoot, '01-en-diseno', ID, 'tarea.md');
+    assert.ok(git(['ls-files', carpeta], repoRoot).trim().length > 0, 'sigue en 01-en-diseno');
+    const rows = leerTransiciones(t.body);
+    const ultima = rows[rows.length - 1];
+    assert.equal(ultima?.fase, 'pausa');
+    assert.equal(ultima?.decidido_por, 'persona');
+    assert.equal(git(['rev-list', '--count', `${antes}..HEAD`], repoRoot).trim(), '1', 'commit propio');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+    assertApprovePreguntar(siguiente(repoRoot));
+  });
+});
+
+test('respuesta «si»: approve, start y review, cada paso guiado por siguiente', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await tareaPlanificada(repoRoot, tareasRoot);
+    assertApprovePreguntar(siguiente(repoRoot));
+
+    cliOk(repoRoot, ['approve', ID]);
+    let s = siguiente(repoRoot);
+    assert.deepEqual([s.fase, s.accion, s.comando], ['start', 'preguntar', `taskctl start ${ID}`]);
+
+    await runStartCommand(tareasRoot, [ID], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.equal(t?.task.estado, 'en-curso');
+    assert.ok(git(['ls-files', path.join(tareasRoot, '02-en-curso', ID, 'tarea.md')], repoRoot).trim().length > 0);
+
+    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
+    commitAll(repoRoot, `feat(${ID}): trabajo`);
+    s = siguiente(repoRoot);
+    assert.deepEqual([s.estado, s.fase, s.accion], ['en-curso', 'review', 'preguntar']);
+  });
+});
+
+test('cadena en el flujo: abrir antes de approve, comprobar antes de cada comando, cerrar al final', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await tareaPlanificada(repoRoot, tareasRoot);
+    const testigo = cliOk(repoRoot, ['cadena', 'abrir', ID]).stdout.trim();
+    assert.match(testigo, /^[0-9a-f]{16}$/);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'el bloqueo no ensucia el arbol');
+
+    // Un segundo abrir durante la cadena aborta, y el flujo sigue intacto.
+    const segundo = cli(repoRoot, ['cadena', 'abrir', 'TASK-002']);
+    assert.notEqual(segundo.status, 0);
+    assert.ok(segundo.stderr.includes(ID));
+
+    cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
+    cliOk(repoRoot, ['approve', ID]);
+
+    cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
+    const s = siguiente(repoRoot);
+    assert.equal(s.fase, 'start');
+    await runStartCommand(tareasRoot, [ID], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+
+    cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
+    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-curso');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+
+    // Un testigo ajeno no cierra la cadena; el bueno si.
+    assert.notEqual(cli(repoRoot, ['cadena', 'cerrar', '0000000000000000']).status, 0);
+    cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
+    cliOk(repoRoot, ['cadena', 'cerrar', testigo]);
+
+    const tras = cli(repoRoot, ['cadena', 'comprobar', testigo]);
+    assert.notEqual(tras.status, 0);
+    assert.match(tras.stderr, /ya no esta abierta/);
+    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-002']);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
index 0afabe3..007c4a7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -231,6 +231,26 @@ test('plan no reabre una ronda al reanudar (IMP-1) y review no relanza Codex en
   assert.doesNotMatch(paso6[0], /taskctl codex-review/, 'el paso 6 no puede lanzar codex-review');
 });
 
+test('semiautomatico (TASK-058): preguntar y continuar encadenan con la herramienta Skill y la cadena bloquea el arbol', async () => {
+  const avance = lf(await readFile(AVANCE, 'utf8'));
+  const preguntar = /\*\*`preguntar`\*\*[\s\S]*?(?=\n- \*\*`continuar`)/.exec(avance);
+  assert.ok(preguntar, 'avance.md describe preguntar');
+  assert.match(preguntar[0], /AskUserQuestion/);
+  assert.match(preguntar[0], /taskctl pausa/, 'el no queda registrado con pausa');
+  assert.match(avance, /\*\*`continuar`\*\*: encadenar la skill siguiente sin preguntar/);
+  // La cadena: se abre, viaja con --cadena a la skill siguiente via Skill, y se cierra.
+  assert.match(avance, /taskctl cadena abrir TASK-NNN/);
+  assert.match(avance, /herramienta Skill/);
+  assert.match(avance, /TASK-NNN --cadena <testigo>/);
+  assert.match(avance, /taskctl cadena cerrar <testigo>/);
+  // En curso no se encadena: falta implementar.
+  assert.match(avance, /`review` con la\s+tarea `en-curso`/);
+  for (const fase of Object.keys(FASES)) {
+    const texto = await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8');
+    assert.ok(texto.includes('taskctl cadena comprobar <testigo>'), `${fase}: no comprueba la cadena recibida`);
+  }
+});
+
 test('approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa', async () => {
   const texto = await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8');
   assert.match(texto, /Pregunta a la persona/);
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-058/tarea.md                                                           |  32 ------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-058/planificacion/brainstorm/peticion-unificador-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-058/planificacion/plan-final.md                       |   0
 tareas/02-en-curso/TASK-058/tarea.md                                                            |  67 +++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                    |  25 ++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                        | 127 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 6 files changed, 218 insertions(+), 33 deletions(-)
````
