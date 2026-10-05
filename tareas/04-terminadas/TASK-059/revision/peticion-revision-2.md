# Peticion de revision — TASK-059 (ronda 2)

- Tarea: TASK-059 — Flujo E: modo automatico
- Rama revisada: feature/task-059-flujo-e-modo-automatico
- Rama base: develop
- Commit revisado (HEAD): 08977c80ffc447842eb363168c0d7317a8a2aec7
- Fecha: 2026-10-05
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-059 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 79a21b581a7161670a310ff896b5e8676dddf74e (el commit revisado en la ronda anterior)

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
| CRIT-1 | CRITICO | abierto | src/commands/siguiente.ts:69-87 (`informeEnCommitPropio`) | informe-revision-1.md |
| IMP-1 | IMPORTANTE | abierto | src/commands/siguiente.ts:69-87, src/core/flujo.ts:59-64, plan-final | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | src/core/flujo.ts:101-108 y 168-176; test/core/siguiente.test.ts | informe-revision-1.md |
| IMP-3 | IMPORTANTE | abierto | src/commands/siguiente.ts:150-155 y 176-179 (camino `enOtraRama`) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/commands/siguiente.ts:73 (`:(exclude)tareas/`) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | skills/review/SKILL.md paso 4 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | skills/start/SKILL.md pasos 4-5 | informe-revision-1.md |

## Commits a revisar (git log 79a21b581a7161670a310ff896b5e8676dddf74e..HEAD)

````
08977c8 fix(TASK-059): correcciones de la ronda 1 (CRIT-1, IMP-1..3, MEN-2, MEN-3)
1a9e9d6 chore(TASK-059): veredicto ronda 1 (cambios-solicitados)
3474a07 docs(TASK-059): informe de revision ronda 1
bf3363c chore(TASK-059): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 79a21b581a7161670a310ff896b5e8676dddf74e..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index a3ec972..d33cb9a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -29,7 +29,9 @@ punto, no un formalismo.
    skill revisora que nombra la peticion. Que reproduzca empiricamente (clon
    temporal, suite una vez, mutantes) y devuelva su informe con la tabla de
    hallazgos. Vuelca cada respuesta en su `informe-revision-N*.md`
-   **conservando la cabecera de la plantilla**, con su linea `- Veredicto:`,
+   **conservando la cabecera de la plantilla** con la linea `- Revisor:`
+   rellenada y su linea `- Veredicto:`; un informe que conserve la plantilla
+   sin rellenar no cuenta como revisado,
    y commitealo **solo, en un commit que no toque nada mas**: en modo
    automatico, `finish` no sigue solo si un informe va mezclado con codigo.
 4. Escribe cada veredicto con el comando, no a mano:
@@ -41,7 +43,13 @@ punto, no un formalismo.
    `siguiente` da `fase: review` con `accion: continuar` tras los cambios,
    corrige tu los CRITICO e IMPORTANTE del informe (y los MENOR baratos),
    commitea, deja la suite en verde y vuelve al paso 2. Desde la ronda 3,
-   `siguiente` pregunta: otra ronda la decide una persona.
+   `siguiente` pregunta: otra ronda la decide una persona, y un «si» quiere
+   decir corregir primero y despues abrir la ronda, nunca relanzarla sobre el
+   mismo codigo.
+   En automatico, `aprobada-con-correcciones` no se corrige despues: el codigo
+   que se mergea tiene que ser el revisado (`finish` pregunta si cambia). Los
+   MENOR que merezca la pena corregir se piden como `cambios-solicitados`; el
+   resto se documentan como aceptados en el `## Resultado`.
 5. **Segunda opinion** (`revision_codex: true` y primaria aprobada):
    ejecuta `taskctl codex-review TASK-NNN` una vez.
    - Si avisa de que Codex no respondio y no escribio informe, muestra el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index ec4a0ee..fd0dca7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -19,13 +19,14 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
    tarea hay que cerrar primero. No lo rodees.
 3. Lee `planificacion/plan-final.md` y, si lo hay, `skills_recomendados` del
    `tarea.md`: es lo que guia la implementacion.
-4. **Modo automatico** (`siguiente` da `fase: review` con `accion: continuar`):
+4. Ejecuta `taskctl siguiente TASK-NNN --json`. **Modo automatico** (da
+   `fase: review` con `accion: continuar`):
    implementa el plan en esta rama, con sus tests y con los skills
    recomendados; commitea; ejecuta la suite del proyecto y no sigas hasta que
    este en verde. Despues encadena `/taskcode-plugin:review` (seccion de
    avance). Si no consigues dejar la suite en verde, para y dilo: no se revisa
    codigo roto.
-5. Sigue la seccion de avance (`task-workflow/avance.md`):
+5. En el resto de casos, sigue la seccion de avance (`task-workflow/avance.md`):
    `taskctl siguiente TASK-NNN --json`. Tras `start` la fase es `review`,
    que significa: primero implementar el plan en esta rama, con tests,
    commitearlo y dejar la suite en verde; despues,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 5a67219..a408c9d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -229,7 +229,7 @@ export interface ExtrasPeticion {
 }
 
 /** Peticiones de revision, con o sin sufijo de dominio (TASK-018). */
-const PETICION_REVISION_RE = /^peticion-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
+export const PETICION_REVISION_RE = /^peticion-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 
 /** Lo que hace falta saber de la ronda N para generar la N+1 (TASK-040). */
 interface RondaPrevia {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index fa6860c..9be2fc1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -19,7 +19,7 @@ import { parseTareaFile } from '../core/tarea-file.js';
 import { resolverConfig, type ModoFlujo } from '../core/config.js';
 import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
 import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
-import { veredictoDeRonda, type VeredictoInforme } from '../core/informe-revision.js';
+import { commitRevisadoDe, veredictoDeRonda, type VeredictoInforme } from '../core/informe-revision.js';
 import {
   INFORME_REVISION_RE,
   informesDeUltimaRonda,
@@ -34,7 +34,7 @@ import {
   showFileAtRef,
 } from '../fs/git.js';
 import type { Task } from '../core/task.js';
-import { REVISION_DIRNAME } from './review.js';
+import { REVISION_DIRNAME, PETICION_REVISION_RE } from './review.js';
 import { INFORME_CODEX_RE } from './codex-review.js';
 import { planRedactado } from './approve.js';
 
@@ -54,34 +54,40 @@ export interface SiguienteCommandResult extends SiguientePaso {
   json: boolean;
 }
 
+/** Marcas de la plantilla del informe sin rellenar (IMP-1 de la revision de TASK-059). */
+const MARCAS_PLANTILLA = ['Revisor: (rellenar', '(ej. IMP-1)'];
+
 /**
- * ¿Cada informe esta en un commit propio, posterior al codigo? (TASK-059)
- * - el ultimo commit que toco cada informe en `ref` solo toca la carpeta
- *   `revision/` de la tarea (no se mezclo con codigo);
- * - es posterior (descendiente) al ultimo commit que toca algo fuera de
- *   `tareas/`, es decir, a la implementacion;
- * - y no hay cambios sin commitear en esa carpeta (si los hay, lo que se lee
- *   del disco no es lo que esta en ningun commit).
+ * ¿Lo aprobado es exactamente lo que se reviso? (TASK-059; CRIT-1 de su
+ * revision). La referencia es el `Commit revisado` que el CLI escribe en la
+ * peticion de la ronda, no el «ultimo commit de codigo»:
+ * - no hay cambios fuera de `tareas/` entre ese commit y `ref`: el codigo que
+ *   se va a mergear es el que vio el revisor. Esto cubre tambien el informe
+ *   commiteado junto a codigo (ese codigo aparece en el diff), que antes se
+ *   tapaba con el commit limpio de `taskctl veredicto`;
+ * - cada informe se escribio despues de pedir la revision (algun commit lo
+ *   toca desde el commit revisado);
+ * - y no hay cambios sin commitear en esa carpeta.
  * `dirRevision` es la ruta POSIX relativa a la raiz del repo, acabada en /.
  */
 function informeEnCommitPropio(
   ref: string,
   dirRevision: string,
   nombres: readonly string[],
+  revisados: readonly (string | null)[],
   cwd: string
 ): boolean {
-  if (nombres.length === 0) return false;
+  if (nombres.length === 0 || revisados.length === 0) return false;
   if (ref === 'HEAD' && runGit(['status', '--porcelain', '--', dirRevision], cwd) !== '') return false;
-  const codigo = runGit(['log', '-1', '--format=%H', ref, '--', '.', ':(exclude)tareas/'], cwd);
-  for (const nombre of nombres) {
-    const commit = runGit(['log', '-1', '--format=%H', ref, '--', dirRevision + nombre], cwd);
-    if (commit === '') return false;
-    const tocados = runGit(['show', '--name-only', '--format=', commit], cwd)
-      .split('\n')
-      .map((l) => l.trim())
-      .filter((l) => l !== '');
-    if (tocados.some((f) => !f.startsWith(dirRevision))) return false;
-    if (codigo !== '' && !isAncestor(codigo, commit, cwd)) return false;
+  for (const revisado of revisados) {
+    if (revisado === null || !isAncestor(revisado, ref, cwd)) return false;
+    if (runGit(['diff', '--name-only', revisado, ref, '--', '.', ':(exclude)tareas/'], cwd) !== '') return false;
+    for (const nombre of nombres) {
+      const commits = runGit(['log', '--format=%H', `${revisado}..${ref}`, '--', dirRevision + nombre], cwd)
+        .split('\n')
+        .filter((c) => c !== '');
+      if (commits.length === 0) return false;
+    }
   }
   return true;
 }
@@ -131,6 +137,7 @@ export async function runSiguienteCommand(
   let nombresPrimarios: string[];
   let dirRevisionRepo: string;
   let refInformes: string;
+  let revisados: (string | null)[];
   if (enOtraRama) {
     const enRama = lsTreeNames(rama, 'tareas', deps.repoCwd);
     const rutaTarea = enRama.find((n) => n.endsWith(`/${id}/tarea.md`));
@@ -152,6 +159,7 @@ export async function runSiguienteCommand(
     dirRevisionRepo = dirRevision;
     refInformes = rama;
     primarios = ultima.nombres.map(leer);
+    revisados = nombresDeUltimaRonda(nombres, PETICION_REVISION_RE).nombres.map((n) => commitRevisadoDe(leer(n)));
     codex = nombresDeUltimaRonda(nombres, INFORME_CODEX_RE).nombres.map(leer);
   } else {
     ({ task, body } = local);
@@ -164,6 +172,9 @@ export async function runSiguienteCommand(
     dirRevisionRepo = `${path.relative(deps.repoCwd, revisionDir).split(path.sep).join('/')}/`;
     refInformes = 'HEAD';
     primarios = await Promise.all(ultima.nombres.map(leer));
+    revisados = (
+      await Promise.all((await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE)).nombres.map(leer))
+    ).map((t) => commitRevisadoDe(t));
     codex = await Promise.all(
       (await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE)).nombres.map(leer)
     );
@@ -178,7 +189,9 @@ export async function runSiguienteCommand(
     rondaRevision,
     informeEnCommitPropio:
       task.estado === 'en-revision' &&
-      informeEnCommitPropio(refInformes, dirRevisionRepo, nombresPrimarios, deps.repoCwd),
+      // IMP-1: un informe que conserva la plantilla no lo escribio ningun revisor.
+      !primarios.some((t) => MARCAS_PLANTILLA.some((m) => t.includes(m))) &&
+      informeEnCommitPropio(refInformes, dirRevisionRepo, nombresPrimarios, revisados, deps.repoCwd),
   };
 
   const modo = modoDeTarea(body, modoConfig);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 2b62507..1742d06 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -98,14 +98,16 @@ function accionPara(
   faltaTrabajo: boolean
 ): AccionFlujo {
   if (fase === 'terminada' || modo === 'manual') return 'detener';
+  // Lo que falta no es una fase sino trabajo (implementar, o corregir tras
+  // cambios-solicitados). Fuera del automatico se detiene SIEMPRE, tambien en
+  // el tope de rondas: encadenar la revision ahi la relanzaria sobre el mismo
+  // codigo (IMP-3 de la revision de TASK-058; IMP-2 de la de TASK-059).
+  if (faltaTrabajo && modo !== 'automatico') return 'detener';
   // Pasos que solo puede decidir una persona aunque el modo encadene (tambien
   // los topes: ronda de mas, finish sin informe en commit propio).
   if (exigePersona) return 'preguntar';
-  // Lo que falta no es una fase sino trabajo (implementar, o corregir tras
-  // cambios-solicitados). En automatico lo hace la skill y sigue (TASK-059);
-  // en semiautomatico se detiene: encadenar la revision ahi la relanzaria
-  // sobre el mismo codigo (IMP-3 de la revision de TASK-058).
-  if (faltaTrabajo) return modo === 'automatico' ? 'continuar' : 'detener';
+  // En automatico el trabajo pendiente lo hace la skill y sigue (TASK-059).
+  if (faltaTrabajo) return 'continuar';
   // Decision de Carlos (2026-10-04): hotfix y release mergean a main con
   // tag; en ningun modo se cierran sin preguntar.
   if (fase === 'finish' && (task.tipo === 'hotfix' || task.tipo === 'release')) return 'preguntar';
@@ -169,8 +171,9 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
             return paso(
               'review',
               false,
-              `la ronda ${String(ctx.rondaRevision)} tambien pidio cambios: tope de rondas alcanzado, otra ronda la decide una persona`,
+              `la ronda ${String(ctx.rondaRevision)} tambien pidio cambios: tope de rondas alcanzado; corregir y abrir otra ronda lo decide una persona`,
               `taskctl review ${task.id}`,
+              true,
               true
             );
           }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
index af4f656..badc308 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico.test.ts
@@ -113,6 +113,20 @@ async function hastaCodigo(repoRoot: string, tareasRoot: string, tipo = 'feature
   await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
 }
 
+/**
+ * Lo que hace el revisor: rellena la cabecera y la tabla de hallazgos del
+ * informe (sin tocar la linea de veredicto) y lo commitea SOLO.
+ */
+async function rellenarInforme(repoRoot: string, informe: string): Promise<void> {
+  const texto = await readFile(informe, 'utf8');
+  const relleno = texto
+    .replace(/^- Revisor: \(rellenar.*$/m, '- Revisor: revisor independiente de prueba')
+    .replace(/^\| \(ej\. IMP-1\).*$/m, '| MEN-1 | MENOR | aceptado | app.txt |');
+  assert.notEqual(relleno, texto, 'el informe tenia la plantilla');
+  await writeFile(informe, relleno, 'utf8');
+  commitAll(repoRoot, `docs(${ID}): informe de revision`);
+}
+
 /** Sustituye la linea de veredicto del informe 1 sin commitear (a mano, como un agente). */
 async function escribirVeredicto(informe: string, valor: string): Promise<void> {
   const texto = await readFile(informe, 'utf8');
@@ -150,6 +164,7 @@ test('ciclo feature completo en automatico: tras plan nunca se pregunta y cada t
 
     s = ver();
     assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'veredicto', 'continuar']);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
     cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
 
     s = ver();
@@ -196,61 +211,80 @@ test('ciclo feature completo en automatico: tras plan nunca se pregunta y cada t
   });
 });
 
-test('informe aprobado fuera de commit propio: finish pregunta (mezclado, con codigo posterior y sin commitear)', async () => {
+test('finish solo sigue solo si lo aprobado es exactamente lo revisado (CRIT-1 e IMP-1 de la revision)', async () => {
   await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
     await hastaCodigo(repoRoot, tareasRoot);
     cliOk(repoRoot, ['review', ID]);
     const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar']);
 
-    // (c) aprobado en disco, sin commitear.
-    await escribirVeredicto(informe, 'aprobada');
-    let s = siguiente(repoRoot);
-    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
-    assert.equal(s.comando, `taskctl finish ${ID}`);
-
-    // (a) informe aprobado en el MISMO commit que un cambio de codigo.
-    await writeFile(path.join(repoRoot, 'app.txt'), 'mezclado\n', 'utf8');
-    commitAll(repoRoot, `feat(${ID}): codigo con veredicto dentro`);
-    s = siguiente(repoRoot);
-    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
+    // IMP-1: sin revisor (plantilla sin rellenar) + taskctl veredicto aprobada → pregunta.
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
 
-    // Contraprueba: el informe re-commiteado SOLO (con un cambio inocuo en el
-    // informe) y posterior al codigo vuelve a ser seguro.
-    await writeFile(informe, (await readFile(informe, 'utf8')) + '\nsin hallazgos\n', 'utf8');
-    commitAll(repoRoot, `chore(${ID}): informe solo`);
-    s = siguiente(repoRoot);
-    assert.deepEqual(resumen(s), ['finish', 'continuar']);
+    // Con el informe rellenado por el revisor y commiteado solo: sigue solo.
+    await rellenarInforme(repoRoot, informe);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'continuar']);
 
-    // Con el informe ya bien commiteado, una edicion sin commitear vuelve a
-    // preguntar: lo que se lee del disco no esta en ningun commit. Aqui la unica
-    // que lo detecta es la comprobacion del workspace (el ultimo commit del
-    // informe es correcto).
+    // Edicion del informe sin commitear: lo leido no esta en ningun commit → pregunta.
     const commiteado = await readFile(informe, 'utf8');
     await writeFile(informe, commiteado + '\nnota sin commitear\n', 'utf8');
-    s = siguiente(repoRoot);
-    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
     await writeFile(informe, commiteado, 'utf8');
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
 
-    // (b) informe en commit propio pero con un commit de codigo POSTERIOR.
-    await codigo(repoRoot, 'despues del informe\n', `feat(${ID}): codigo tras el informe`);
-    s = siguiente(repoRoot);
-    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
+test('CRIT-1 (a): codigo commiteado tras pedir la revision y antes del veredicto → finish pregunta', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    await codigo(repoRoot, 'codigo posterior a la peticion\n', `feat(${ID}): colado`);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    // El informe esta en commits propios y posteriores, pero el codigo no es el revisado.
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
   });
 });
 
-test('informe aprobado con taskctl veredicto y codigo posterior: finish pregunta', async () => {
+test('CRIT-1 (b): informe commiteado junto a codigo y despues taskctl veredicto → finish pregunta', async () => {
   await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
     await hastaCodigo(repoRoot, tareasRoot);
     cliOk(repoRoot, ['review', ID]);
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
     cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
-    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'continuar']);
-    await codigo(repoRoot, 'colado despues\n', `feat(${ID}): codigo tras el veredicto`);
     assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
   });
 });
 
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
+
 test('tope de rondas: las rondas 1 y 2 con cambios siguen solas, la 3 pregunta', async () => {
   await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
     await hastaCodigo(repoRoot, tareasRoot);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index 615f15d..db2db27 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -87,7 +87,7 @@ const TABLA: Caso[] = [
   // TASK-059: guardas del automatico.
   { nombre: 'aprobada sin informe en commit propio', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'cambios en la ronda 2 (bajo el tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 2 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
-  { nombre: 'cambios en la ronda 3 (tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'cambios en la ronda 3 (tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'preguntar'] },
   { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
 ];
````

## Excluido del diff (8 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 79a21b581a7161670a310ff896b5e8676dddf74e..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-059/planificacion/brainstorm/peticion-unificador-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-059/planificacion/plan-final.md                       |   0
 tareas/03-en-revision/TASK-059/revision/informe-revision-1.md                                     |  62 ++++++++
 tareas/03-en-revision/TASK-059/revision/peticion-revision-1.md                                    | 794 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-059/tarea.md                                          |  44 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                          |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                       |  55 ++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                               |  15 +-
 8 files changed, 941 insertions(+), 31 deletions(-)
````
