# Peticion de revision — TASK-059 (ronda 1)

- Tarea: TASK-059 — Flujo E: modo automatico
- Rama revisada: feature/task-059-flujo-e-modo-automatico
- Rama base: develop
- Commit revisado (HEAD): 79a21b581a7161670a310ff896b5e8676dddf74e
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-059 (criterios de aceptacion y plan)

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
79a21b5 feat(TASK-059): modo automatico con sus guardas
fe52179 chore(TASK-059): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
index 28ef024..7ea1c7c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
@@ -17,7 +17,13 @@ Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
 2. Lee `planificacion/plan-final.md` de la tarea (el ID viene en
    `$ARGUMENTS`) y presentalo resumido: enfoque, riesgos, plan de pruebas y
    lo que pida decision de una persona.
-3. Pregunta a la persona si lo aprueba.
+3. **Modo automatico**: si `taskctl siguiente TASK-NNN --json` dice
+   `"modo":"automatico"` y `accion` `continuar` (las preguntas ya se hicieron
+   en plan), aprueba sin preguntar con
+   `taskctl approve TASK-NNN --decidido-por automatico`: queda registrado como
+   aprobacion automatica. El CLI lo rechaza si la tarea no se planifico en
+   automatico; entonces, y en cualquier otro modo, sigue con la pregunta.
+   Pregunta a la persona si lo aprueba.
    - **Si**: ejecuta `taskctl approve TASK-NNN`.
    - **No**: pregunta que habria que cambiar y escribelo, con sus palabras, al
      final de `plan-final.md` en una seccion con este encabezado exacto (asi
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index a6e85fe..a3ec972 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -30,13 +30,18 @@ punto, no un formalismo.
    temporal, suite una vez, mutantes) y devuelva su informe con la tabla de
    hallazgos. Vuelca cada respuesta en su `informe-revision-N*.md`
    **conservando la cabecera de la plantilla**, con su linea `- Veredicto:`,
-   y commitealo.
+   y commitealo **solo, en un commit que no toque nada mas**: en modo
+   automatico, `finish` no sigue solo si un informe va mezclado con codigo.
 4. Escribe cada veredicto con el comando, no a mano:
    `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`.
    Si la ronda esta fragmentada, uno por informe, con el nombre de fichero
    completo: `--informe informe-revision-N-<revisor>.md`. Con CRITICO o
    IMPORTANTE abiertos, `cambios-solicitados`: se corrigen, se commitea, y se
-   vuelve a esta skill (abre la ronda siguiente).
+   vuelve a esta skill (abre la ronda siguiente). En modo automatico, si
+   `siguiente` da `fase: review` con `accion: continuar` tras los cambios,
+   corrige tu los CRITICO e IMPORTANTE del informe (y los MENOR baratos),
+   commitea, deja la suite en verde y vuelve al paso 2. Desde la ronda 3,
+   `siguiente` pregunta: otra ronda la decide una persona.
 5. **Segunda opinion** (`revision_codex: true` y primaria aprobada):
    ejecuta `taskctl codex-review TASK-NNN` una vez.
    - Si avisa de que Codex no respondio y no escribio informe, muestra el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index 5c2749e..ec4a0ee 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -19,7 +19,13 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
    tarea hay que cerrar primero. No lo rodees.
 3. Lee `planificacion/plan-final.md` y, si lo hay, `skills_recomendados` del
    `tarea.md`: es lo que guia la implementacion.
-4. Sigue la seccion de avance (`task-workflow/avance.md`):
+4. **Modo automatico** (`siguiente` da `fase: review` con `accion: continuar`):
+   implementa el plan en esta rama, con sus tests y con los skills
+   recomendados; commitea; ejecuta la suite del proyecto y no sigas hasta que
+   este en verde. Despues encadena `/taskcode-plugin:review` (seccion de
+   avance). Si no consigues dejar la suite en verde, para y dilo: no se revisa
+   codigo roto.
+5. Sigue la seccion de avance (`task-workflow/avance.md`):
    `taskctl siguiente TASK-NNN --json`. Tras `start` la fase es `review`,
    que significa: primero implementar el plan en esta rama, con tests,
    commitearlo y dejar la suite en verde; despues,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index ee261a4..e5a068b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -20,7 +20,7 @@ cambia el modo de esa tarea.
 |---|---|
 | `manual` (por defecto) | Nada se encadena: la skill termina nombrando la siguiente |
 | `semiautomatico` | Se pregunta si seguir; un no queda registrado con `taskctl pausa` |
-| `automatico` | Las preguntas se hacen en `plan`; el resto se encadena hasta `finish` (mientras sus guardas propias no esten disponibles, pregunta como el semiautomatico) |
+| `automatico` | Las preguntas se hacen en `plan`; el resto se encadena hasta `finish`, implementacion y correcciones incluidas |
 
 En cualquier modo, hotfix y release preguntan antes de `finish`, nunca se
 sube nada con `--push` sin que la persona lo pida, y cada transicion deja
@@ -58,13 +58,17 @@ commitearlo y dejar la suite en verde; despues, la revision.
     skill que la reanuda.
 - **`continuar`**: encadenar la skill siguiente sin preguntar.
 
-`siguiente` devuelve `detener` en cualquier modo cuando lo que falta es
-trabajo y no una fase: `review` con la tarea `en-curso` (implementar el plan)
-o tras un `cambios-solicitados` (corregir). La skill termina diciendo que toca
-hacer ese trabajo, commitearlo y despues `/taskcode-plugin:review TASK-NNN`.
-
-En modo `automatico`, mientras sus guardas propias no esten disponibles,
-`siguiente` pregunta antes de cada fase nueva, igual que en `semiautomatico`.
+Cuando lo que falta es trabajo y no una fase (`review` con la tarea
+`en-curso`: implementar; o tras un `cambios-solicitados`: corregir),
+`siguiente` devuelve `detener` en manual y semiautomatico: la skill termina
+diciendo que toca hacer ese trabajo, commitearlo y despues
+`/taskcode-plugin:review TASK-NNN`. En `automatico` devuelve `continuar`: el
+trabajo lo hace la skill (`start` implementa, `review` corrige) y sigue.
+
+En `automatico`, `siguiente` solo pregunta en sus guardas: aprobar una tarea
+sin modo congelado, cerrar hotfix o release, cerrar con algun informe que no
+este en un commit propio posterior al codigo, otra ronda desde la ronda 3, y
+el veredicto de la segunda opinion.
 
 ## Encadenar la skill siguiente (la cadena)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index 098aa76..fa6860c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -30,6 +30,7 @@ import {
   isAncestor,
   localBranchExists,
   lsTreeNames,
+  runGit,
   showFileAtRef,
 } from '../fs/git.js';
 import type { Task } from '../core/task.js';
@@ -53,6 +54,38 @@ export interface SiguienteCommandResult extends SiguientePaso {
   json: boolean;
 }
 
+/**
+ * ¿Cada informe esta en un commit propio, posterior al codigo? (TASK-059)
+ * - el ultimo commit que toco cada informe en `ref` solo toca la carpeta
+ *   `revision/` de la tarea (no se mezclo con codigo);
+ * - es posterior (descendiente) al ultimo commit que toca algo fuera de
+ *   `tareas/`, es decir, a la implementacion;
+ * - y no hay cambios sin commitear en esa carpeta (si los hay, lo que se lee
+ *   del disco no es lo que esta en ningun commit).
+ * `dirRevision` es la ruta POSIX relativa a la raiz del repo, acabada en /.
+ */
+function informeEnCommitPropio(
+  ref: string,
+  dirRevision: string,
+  nombres: readonly string[],
+  cwd: string
+): boolean {
+  if (nombres.length === 0) return false;
+  if (ref === 'HEAD' && runGit(['status', '--porcelain', '--', dirRevision], cwd) !== '') return false;
+  const codigo = runGit(['log', '-1', '--format=%H', ref, '--', '.', ':(exclude)tareas/'], cwd);
+  for (const nombre of nombres) {
+    const commit = runGit(['log', '-1', '--format=%H', ref, '--', dirRevision + nombre], cwd);
+    if (commit === '') return false;
+    const tocados = runGit(['show', '--name-only', '--format=', commit], cwd)
+      .split('\n')
+      .map((l) => l.trim())
+      .filter((l) => l !== '');
+    if (tocados.some((f) => !f.startsWith(dirRevision))) return false;
+    if (codigo !== '' && !isAncestor(codigo, commit, cwd)) return false;
+  }
+  return true;
+}
+
 /** Veredicto de una ronda a partir de sus informes; null si no hay ninguno. */
 function veredictoDe(informes: readonly string[]): VeredictoInforme | null {
   return informes.length === 0 ? null : veredictoDeRonda(informes);
@@ -93,6 +126,11 @@ export async function runSiguienteCommand(
   // del disco.
   let primarios: string[];
   let codex: string[];
+  // Para la guarda del commit propio y el tope de rondas (TASK-059).
+  let rondaRevision: number;
+  let nombresPrimarios: string[];
+  let dirRevisionRepo: string;
+  let refInformes: string;
   if (enOtraRama) {
     const enRama = lsTreeNames(rama, 'tareas', deps.repoCwd);
     const rutaTarea = enRama.find((n) => n.endsWith(`/${id}/tarea.md`));
@@ -108,16 +146,24 @@ export async function runSiguienteCommand(
       .map((n) => n.slice(dirRevision.length));
     const leer = (n: string) => showFileAtRef(rama, dirRevision + n, deps.repoCwd);
     // En la rama la tarea ya paso por start: el plan dejo de importar.
-    primarios = nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).nombres.map(leer);
+    const ultima = nombresDeUltimaRonda(nombres, INFORME_REVISION_RE);
+    rondaRevision = ultima.ronda;
+    nombresPrimarios = ultima.nombres;
+    dirRevisionRepo = dirRevision;
+    refInformes = rama;
+    primarios = ultima.nombres.map(leer);
     codex = nombresDeUltimaRonda(nombres, INFORME_CODEX_RE).nombres.map(leer);
   } else {
     ({ task, body } = local);
     const taskDir = path.dirname(local.filePath);
     const revisionDir = path.join(taskDir, REVISION_DIRNAME);
     const leer = (n: string) => readFile(path.join(revisionDir, n), 'utf8');
-    primarios = await Promise.all(
-      (await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE)).nombres.map(leer)
-    );
+    const ultima = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
+    rondaRevision = ultima.ronda;
+    nombresPrimarios = ultima.nombres;
+    dirRevisionRepo = `${path.relative(deps.repoCwd, revisionDir).split(path.sep).join('/')}/`;
+    refInformes = 'HEAD';
+    primarios = await Promise.all(ultima.nombres.map(leer));
     codex = await Promise.all(
       (await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE)).nombres.map(leer)
     );
@@ -129,6 +175,10 @@ export async function runSiguienteCommand(
     veredicto: veredictoDe(primarios),
     veredictoCodex: veredictoDe(codex),
     modoCongelado: modoCongelado(body) !== null,
+    rondaRevision,
+    informeEnCommitPropio:
+      task.estado === 'en-revision' &&
+      informeEnCommitPropio(refInformes, dirRevisionRepo, nombresPrimarios, deps.repoCwd),
   };
 
   const modo = modoDeTarea(body, modoConfig);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 74a78bd..2b62507 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -55,8 +55,20 @@ export interface ContextoFlujo {
    * proponer seguir solo hacia un approve que el CLI rechazara.
    */
   modoCongelado: boolean;
+  /** en-revision: numero de la ultima ronda de revision (0 si no hay). */
+  rondaRevision: number;
+  /**
+   * en-revision aprobada: ¿cada informe de la ultima ronda esta en un commit
+   * propio (solo toca revision/) posterior al ultimo commit de codigo? Sin
+   * eso, en automatico finish no sigue solo: contiene el veredicto escrito por
+   * el mismo agente que implemento (riesgo del plan de TASK-055).
+   */
+  informeEnCommitPropio: boolean;
 }
 
+/** Tope de rondas de revision: desde esta, otra ronda la decide una persona. */
+export const TOPE_RONDAS = 3;
+
 export interface SiguientePaso {
   fase: FaseSiguiente;
   /**
@@ -86,19 +98,21 @@ function accionPara(
   faltaTrabajo: boolean
 ): AccionFlujo {
   if (fase === 'terminada' || modo === 'manual') return 'detener';
-  // TASK-058 (IMP-3 de su revision): lo que falta no es una fase sino trabajo
-  // (implementar, o corregir tras cambios-solicitados). Encadenar la revision
-  // ahi la relanzaria sobre el mismo codigo. Se detiene en todos los modos.
-  if (faltaTrabajo) return 'detener';
-  // Pasos que solo puede decidir una persona aunque el modo encadene.
+  // Pasos que solo puede decidir una persona aunque el modo encadene (tambien
+  // los topes: ronda de mas, finish sin informe en commit propio).
   if (exigePersona) return 'preguntar';
+  // Lo que falta no es una fase sino trabajo (implementar, o corregir tras
+  // cambios-solicitados). En automatico lo hace la skill y sigue (TASK-059);
+  // en semiautomatico se detiene: encadenar la revision ahi la relanzaria
+  // sobre el mismo codigo (IMP-3 de la revision de TASK-058).
+  if (faltaTrabajo) return modo === 'automatico' ? 'continuar' : 'detener';
   // Decision de Carlos (2026-10-04): hotfix y release mergean a main con
   // tag; en ningun modo se cierran sin preguntar.
   if (fase === 'finish' && (task.tipo === 'hotfix' || task.tipo === 'release')) return 'preguntar';
-  // TASK-058 (IMP-2 de su revision): hasta que el modo automatico tenga sus
-  // guardas (aprobacion automatica registrada, informe en commit propio, tope
-  // de rondas: TASK-059), se comporta como el semiautomatico. Encadenar sin
-  // ellas mergearia sin persona.
+  // Automatico (TASK-059): todas las preguntas se hicieron en plan; sus guardas
+  // (modo congelado, informe en commit propio, tope de rondas, hotfix/release)
+  // llegan aqui como exigePersona.
+  if (modo === 'automatico') return 'continuar';
   return abreFase ? 'preguntar' : 'continuar';
 }
 
@@ -151,6 +165,15 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
     case 'en-revision':
       switch (ctx.veredicto) {
         case 'cambios-solicitados':
+          if (ctx.rondaRevision >= TOPE_RONDAS) {
+            return paso(
+              'review',
+              false,
+              `la ronda ${String(ctx.rondaRevision)} tambien pidio cambios: tope de rondas alcanzado, otra ronda la decide una persona`,
+              `taskctl review ${task.id}`,
+              true
+            );
+          }
           return paso(
             'review',
             false,
@@ -191,6 +214,15 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
                 );
             }
           }
+          if (!ctx.informeEnCommitPropio) {
+            return paso(
+              'finish',
+              true,
+              'la revision esta aprobada, pero algun informe no esta en un commit propio posterior al codigo: el cierre lo decide una persona',
+              `taskctl finish ${task.id}`,
+              true
+            );
+          }
           return paso('finish', true, 'la revision esta aprobada');
         default:
           return paso(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
new file mode 100644
index 0000000..af4f656
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
@@ -0,0 +1,361 @@
+/**
+ * Flujo E, modo automatico (TASK-059): ciclo completo sin preguntas, guardas
+ * que siguen preguntando (informe fuera de commit propio, tope de rondas,
+ * hotfix) y guardas del CLI que abortan tambien en automatico. Repos Git
+ * temporales reales y el CLI real por spawn; los fixtures hacen de agentes.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
+const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
+const ID = 'TASK-001';
+const CONFIG_AUTO = 'modo_flujo: automatico\n';
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
+function siguiente(cwd: string, id = ID): Record<string, unknown> {
+  return JSON.parse(cliOk(cwd, ['siguiente', id, '--json']).stdout) as Record<string, unknown>;
+}
+
+function resumen(s: Record<string, unknown>): [unknown, unknown] {
+  return [s.fase, s.accion];
+}
+
+async function withRepo(
+  config: string,
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-auto-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+/** `taskctl new` por CLI; devuelve el ID creado (TASK-001 en un repo vacio). */
+function nueva(repoRoot: string, tipo: string, titulo: string): void {
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
+async function planificar(repoRoot: string, tareasRoot: string, id = ID): Promise<void> {
+  cliOk(repoRoot, ['plan', id]);
+  await writeFile(
+    path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
+    '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
+    'utf8'
+  );
+  commitAll(repoRoot, `docs(${id}): plan final`);
+}
+
+async function codigo(repoRoot: string, contenido: string, mensaje: string): Promise<void> {
+  await writeFile(path.join(repoRoot, 'app.txt'), contenido, 'utf8');
+  commitAll(repoRoot, mensaje);
+}
+
+function dirRevision(tareasRoot: string, id = ID): string {
+  return path.join(tareasRoot, '03-en-revision', id, 'revision');
+}
+
+/** Tarea feature de TASK-001 planificada, aprobada, empezada y con un commit de codigo. */
+async function hastaCodigo(repoRoot: string, tareasRoot: string, tipo = 'feature'): Promise<void> {
+  nueva(repoRoot, tipo, 'Flujo automatico');
+  await planificar(repoRoot, tareasRoot);
+  cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+  cliOk(repoRoot, ['start', ID]);
+  await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
+}
+
+/** Sustituye la linea de veredicto del informe 1 sin commitear (a mano, como un agente). */
+async function escribirVeredicto(informe: string, valor: string): Promise<void> {
+  const texto = await readFile(informe, 'utf8');
+  const nuevo = texto.replace(/^- Veredicto:.*$/m, `- Veredicto: ${valor}`);
+  assert.notEqual(nuevo, texto, 'el informe debe tener la linea de veredicto');
+  await writeFile(informe, nuevo, 'utf8');
+}
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
+test('informe aprobado fuera de commit propio: finish pregunta (mezclado, con codigo posterior y sin commitear)', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar']);
+
+    // (c) aprobado en disco, sin commitear.
+    await escribirVeredicto(informe, 'aprobada');
+    let s = siguiente(repoRoot);
+    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
+    assert.equal(s.comando, `taskctl finish ${ID}`);
+
+    // (a) informe aprobado en el MISMO commit que un cambio de codigo.
+    await writeFile(path.join(repoRoot, 'app.txt'), 'mezclado\n', 'utf8');
+    commitAll(repoRoot, `feat(${ID}): codigo con veredicto dentro`);
+    s = siguiente(repoRoot);
+    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
+
+    // Contraprueba: el informe re-commiteado SOLO (con un cambio inocuo en el
+    // informe) y posterior al codigo vuelve a ser seguro.
+    await writeFile(informe, (await readFile(informe, 'utf8')) + '\nsin hallazgos\n', 'utf8');
+    commitAll(repoRoot, `chore(${ID}): informe solo`);
+    s = siguiente(repoRoot);
+    assert.deepEqual(resumen(s), ['finish', 'continuar']);
+
+    // Con el informe ya bien commiteado, una edicion sin commitear vuelve a
+    // preguntar: lo que se lee del disco no esta en ningun commit. Aqui la unica
+    // que lo detecta es la comprobacion del workspace (el ultimo commit del
+    // informe es correcto).
+    const commiteado = await readFile(informe, 'utf8');
+    await writeFile(informe, commiteado + '\nnota sin commitear\n', 'utf8');
+    s = siguiente(repoRoot);
+    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
+    await writeFile(informe, commiteado, 'utf8');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+
+    // (b) informe en commit propio pero con un commit de codigo POSTERIOR.
+    await codigo(repoRoot, 'despues del informe\n', `feat(${ID}): codigo tras el informe`);
+    s = siguiente(repoRoot);
+    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
+  });
+});
+
+test('informe aprobado con taskctl veredicto y codigo posterior: finish pregunta', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'continuar']);
+    await codigo(repoRoot, 'colado despues\n', `feat(${ID}): codigo tras el veredicto`);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
+  });
+});
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
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index d10c959..615f15d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -44,6 +44,8 @@ const CTX: ContextoFlujo = {
   veredicto: null,
   veredictoCodex: null,
   modoCongelado: true,
+  rondaRevision: 1,
+  informeEnCommitPropio: true,
 };
 
 interface Caso {
@@ -59,19 +61,19 @@ interface Caso {
 const VEREDICTO_PENDIENTE = 'taskctl veredicto TASK-100 <aprobada|aprobada-con-correcciones|cambios-solicitados>';
 
 const TABLA: Caso[] = [
-  { nombre: 'planificada', task: { estado: 'planificada' }, fase: 'plan', comando: 'taskctl plan TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'planificada', task: { estado: 'planificada' }, fase: 'plan', comando: 'taskctl plan TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
   { nombre: 'en diseno sin plan redactado', task: { estado: 'en-diseno' }, fase: 'plan', comando: null, acciones: ['detener', 'continuar', 'continuar'] },
-  { nombre: 'en diseno con plan redactado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'en diseno con plan redactado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
   // MEN-4: sin modo congelado (tarea anterior al registro) la aprobacion automatica esta vetada.
   { nombre: 'en diseno con plan, sin modo congelado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true, modoCongelado: false }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
-  { nombre: 'en diseno aprobada', task: { estado: 'en-diseno', plan_aprobado: true }, ctx: { planRedactado: true }, fase: 'start', comando: 'taskctl start TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
-  { nombre: 'en curso', task: { estado: 'en-curso', plan_aprobado: true }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'detener'] },
+  { nombre: 'en diseno aprobada', task: { estado: 'en-diseno', plan_aprobado: true }, ctx: { planRedactado: true }, fase: 'start', comando: 'taskctl start TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en curso', task: { estado: 'en-curso', plan_aprobado: true }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
   { nombre: 'en revision sin informe', task: { estado: 'en-revision', plan_aprobado: true }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
   { nombre: 'en revision pendiente', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'pendiente' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
   { nombre: 'en revision veredicto desconocido', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'desconocido' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
-  { nombre: 'en revision cambios solicitados', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados' }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'detener'] },
-  { nombre: 'en revision aprobada (feature)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
-  { nombre: 'en revision aprobada (fix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'fix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'en revision cambios solicitados', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados' }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
+  { nombre: 'en revision aprobada (feature)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en revision aprobada (fix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'fix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
   // Decision de Carlos: hotfix y release preguntan antes de finish en cualquier modo que encadene.
   { nombre: 'en revision aprobada (hotfix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'hotfix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'en revision aprobada (release)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'release' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
@@ -80,8 +82,12 @@ const TABLA: Caso[] = [
   { nombre: 'aprobada con codex pendiente', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'veredicto-codex', comando: null, acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'aprobada con codex sin linea', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'sin-linea' }, fase: 'veredicto-codex', comando: null, acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'aprobada con codex cambios', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'cambios-solicitados' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
-  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
-  { nombre: 'codex aprobada sin revision_codex no cuenta', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'codex aprobada sin revision_codex no cuenta', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  // TASK-059: guardas del automatico.
+  { nombre: 'aprobada sin informe en commit propio', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'cambios en la ronda 2 (bajo el tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 2 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
+  { nombre: 'cambios en la ronda 3 (tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
 ];
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
index a242023..a853b8d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -244,7 +244,20 @@ test('semiautomatico (TASK-058): preguntar y continuar encadenan con la herramie
   assert.match(avance, /TASK-NNN --cadena <testigo>/);
   assert.match(avance, /taskctl cadena cerrar <testigo>/);
   // En curso no se encadena: falta implementar.
-  assert.match(avance, /`review` con la\s+tarea `en-curso`/);
+  assert.match(avance, /`review` con la\s+tarea\s+`en-curso`/);
+  // TASK-059: en automatico el trabajo pendiente lo hace la skill; en los otros modos se detiene.
+  assert.match(avance, /devuelve `detener` en manual y semiautomatico/);
+  assert.match(avance, /En `automatico` devuelve `continuar`: el\s+trabajo lo hace la skill/);
+});
+
+test('automatico (TASK-059): approve sin preguntar, start implementa, review corrige y commitea el informe solo', async () => {
+  const approve = lf(await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8'));
+  assert.match(approve, /taskctl approve TASK-NNN --decidido-por automatico/);
+  const start = lf(await readFile(path.join(SKILLS_DIR, 'start', 'SKILL.md'), 'utf8'));
+  assert.match(start, /\*\*Modo automatico\*\*[\s\S]*implementa el plan[\s\S]*suite[\s\S]*en verde/);
+  const review = lf(await readFile(path.join(SKILLS_DIR, 'review', 'SKILL.md'), 'utf8'));
+  assert.match(review, /commitealo \*\*solo, en un commit que no toque nada mas\*\*/);
+  assert.match(review, /corrige tu los CRITICO e IMPORTANTE/);
   for (const fase of Object.keys(FASES)) {
     const texto = await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8');
     assert.ok(texto.includes('taskctl cadena comprobar <testigo>'), `${fase}: no comprueba la cadena recibida`);
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-059/tarea.md                                                           | 33 ---------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-059/planificacion/brainstorm/peticion-unificador-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-059/planificacion/plan-final.md                       |  0
 tareas/02-en-curso/TASK-059/tarea.md                                                            | 75 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                     | 55 ++++++++++++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                             | 31 +++++++++++++++++++++----------
 6 files changed, 148 insertions(+), 46 deletions(-)
````
