# Peticion de revision — TASK-074 (ronda 3)

- Tarea: TASK-074 — Cobertura sobre las lineas cambiadas
- Rama revisada: feature/task-074-cobertura-sobre-las-lineas-cambiadas
- Rama base: develop
- Commit revisado (HEAD): 6754a735030faec9bea95940a5be316d13316381
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: opus)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-074 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 58334406a41a2ddae4fdec6dd8bb8fd781ad52de (el commit revisado en la ronda anterior)

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
| IMP-5 | IMPORTANTE | abierto | src/core/cobertura-cambios.ts:73-83 (cruzarCobertura, rama `fueraDelInforme`) | informe-revision-2.md |
| MEN-5 | MENOR | abierto | src/commands/review.ts:519-524 (coberturaPorRevisor) | informe-revision-2.md |
| MEN-6 | MENOR | abierto | test/core/cobertura.test.ts (extension, formatearPorcentaje) | informe-revision-2.md |

## Commits a revisar (git log 58334406a41a2ddae4fdec6dd8bb8fd781ad52de..HEAD)

````
6754a73 fix(TASK-074): hallazgos de la ronda 2 de revision
738136d chore(TASK-074): coste revision +6467708 tokens (1 agente)
05c8ab1 docs(TASK-074): informe de revision ronda 2
ccfb306 chore(TASK-074): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 58334406a41a2ddae4fdec6dd8bb8fd781ad52de..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 072f8a0..6c64bfc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -710,10 +710,15 @@ umbral_cobertura: 80                       # opcional: % minimo cubierto para qu
   del informe es del fuente del repo. Sin datos nunca cuenta como aprobado.
 - Cuenta una línea cambiada (no en blanco) con `DA` en el informe (`DA:n,0` =
   sin cubrir); sin `DA` no es ejecutable. Un fichero cambiado que el informe no
-  lista y cuya extensión **sí** mide en otros ficheros (un `.mjs` nuevo que
-  ningún test carga: `node --test` y c8 sin `--all` solo listan lo cargado)
-  cuenta con todas sus líneas sin cubrir. Uno cuya extensión el informe no mide
-  (`.md`, `.yml`…) no cuenta: una tarea de solo documentación no se frena.
+  lista cuenta con todas sus líneas sin cubrir si el informe **sí** mide su
+  extensión y alguna de sus carpetas (sin contar la raíz) tiene un fichero
+  medido: un `.mjs` nuevo en `src/` que ningún test carga (`node --test` y c8
+  sin `--all` solo listan lo cargado). No cuentan un `.md` o un `.yml`, los
+  tests si el proyecto los excluye de la cobertura (`test/` sin nada medido) ni
+  los `*.d.ts`: una tarea de solo documentación, o de solo tests, no se frena.
+  Un `.ts` solo de tipos en una carpeta medida sí cuenta; para evitarlo, genera
+  la cobertura con `--all`/`include`, y saldrá en el informe sin líneas
+  ejecutables.
 - Las rutas `SF:` pueden ser absolutas o relativas, con `\` o `/`. Una relativa
   se resuelve contra la carpeta del informe y cada una de sus padres hasta la
   raíz, la más cercana primero: un proyecto en `pkg/` con el informe en
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index c3ca088..97f82c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -514,13 +514,21 @@ export async function runReviewCommand(
   // TASK-074 (MEN-4 de la revision): en una peticion fragmentada, la seccion
   // de cobertura de cada dominio lleva SUS ficheros cambiados desde la merge
   // base, no solo los del delta de la ronda: una linea sin cubrir de la ronda
-  // 1 sigue en la 2 aunque su fichero no haya vuelto a cambiar.
+  // 1 sigue en la 2 aunque su fichero no haya vuelto a cambiar. Y si el
+  // dominio de un fichero no tiene peticion en esta ronda (el delta solo toca
+  // otros dominios), sus lineas van a la primera peticion: no se pierden
+  // (MEN-5 de la ronda 2).
   const coberturaPorRevisor = new Map<string, Set<string>>();
   if (plan.fragmentado && datosCobertura?.tipo === 'ok' && datosCobertura.cobertura.cruce !== null) {
     const cruce = datosCobertura.cobertura.cruce;
     const cambiados = [...cruce.ficheros.map((f) => f.ruta), ...cruce.sinInstrumentar];
+    const conPeticion = new Set(plan.grupos.map((g) => g.revisor));
+    const primera = (plan.grupos[0] as { revisor: string }).revisor;
     for (const g of clasificarPorDominio(cambiados, catalogoRevisores).grupos) {
-      coberturaPorRevisor.set(g.revisor, new Set(g.ficheros));
+      const destino = conPeticion.has(g.revisor) ? g.revisor : primera;
+      const set = coberturaPorRevisor.get(destino) ?? new Set<string>();
+      for (const f of g.ficheros) set.add(f);
+      coberturaPorRevisor.set(destino, set);
     }
   }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
index 028bd5a..b467d13 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
@@ -9,12 +9,19 @@
  * - Cuenta una linea añadida o cambiada con `DA` en el informe: `DA:n,0` es
  *   sin cubrir, `DA:n,k>0` cubierta. Sin `DA` (comentario, linea en blanco,
  *   un `type`) no es ejecutable y no cuenta.
- * - Un fichero cambiado que no esta en el informe y cuya extension el
- *   informe SI instrumenta en otros ficheros (un .mjs nuevo que ningun test
- *   carga: `node --test` y c8 sin `--all` solo listan lo cargado) cuenta con
- *   todas sus lineas añadidas sin cubrir (IMP-1 e IMP-2 de la revision).
- * - Uno cuya extension el informe no mide (un .md, un .yml...) va aparte,
- *   «sin instrumentar»: no cuenta. Una tarea de solo docs no se frena.
+ * - Un fichero cambiado que no esta en el informe cuenta con todas sus
+ *   lineas añadidas sin cubrir si el informe SI mide su extension Y alguna
+ *   carpeta suya (la propia o una padre, sin contar la raiz del repo) tiene un
+ *   fichero medido: un .mjs nuevo en `src/` que ningun test carga (`node
+ *   --test` y c8 sin `--all` solo listan lo cargado). IMP-1 e IMP-2 de la
+ *   ronda 1; acotada en la ronda 2 (IMP-5) para no frenar en falso.
+ * - Si no, va aparte como «sin instrumentar» y no cuenta: un .md o un .yml
+ *   (extension no medida), los tests cuando el proyecto los excluye de la
+ *   cobertura (`test/` sin ningun fichero medido) y los `*.d.ts`, que no
+ *   tienen codigo. Una tarea de solo docs, o de solo tests, no se frena.
+ *   Riesgo aceptado: un .ts solo de tipos en una carpeta medida cuenta sin
+ *   cubrir; el remedio es generar la cobertura con `--all`/`include`, y
+ *   entonces sale en el informe sin lineas ejecutables.
  * - El umbral es el porcentaje minimo cubierto; el valor exacto pasa.
  *
  * Puro: recibe las lineas cambiadas y el informe ya resuelto a rutas del repo.
@@ -28,17 +35,28 @@ export interface CoberturaFichero {
   cubiertas: number;
   /** Lineas cambiadas con `DA:n,0`, en orden. */
   sinCubrir: number[];
-  /** El informe no lista el fichero (ningun test lo carga): todas sus lineas cuentan sin cubrir. */
+  /** El informe no lista el fichero, y es codigo de una carpeta medida: todas sus lineas cuentan sin cubrir. */
   fueraDelInforme?: true;
 }
 
 /** Extension en minusculas (`.mjs`), o '' si no tiene. */
-function extension(ruta: string): string {
+export function extension(ruta: string): string {
   const base = ruta.slice(ruta.lastIndexOf('/') + 1);
   const punto = base.lastIndexOf('.');
   return punto <= 0 ? '' : base.slice(punto).toLowerCase();
 }
 
+/** Declaraciones de TypeScript: no tienen codigo ejecutable. */
+const DECLARACIONES_RE = /\.d\.[cm]?ts$/i;
+
+/** Carpetas (sin la raiz) de una ruta del repo, de la mas cercana a la mas lejana: `a/b/c.js` -> `a/b`, `a`. */
+function carpetas(ruta: string): string[] {
+  const partes = ruta.split('/').slice(0, -1);
+  const r: string[] = [];
+  for (let i = partes.length; i > 0; i--) r.push(partes.slice(0, i).join('/'));
+  return r;
+}
+
 export interface CruceCobertura {
   ficheros: CoberturaFichero[];
   /** Ficheros cambiados (con lineas añadidas) que el informe no lista. */
@@ -60,11 +78,22 @@ export function cruzarCobertura(
 ): CruceCobertura {
   const porClave = new Map<string, LineasEjecutadas>();
   const medidas = new Set<string>();
+  /** Carpetas (por clave, sin la raiz) con algun fichero medido debajo. */
+  const carpetasMedidas = new Set<string>();
+  let raizMedida = false;
   for (const [ruta, lineas] of informe) {
     porClave.set(clave(ruta), lineas);
     const ext = extension(ruta);
     if (ext !== '') medidas.add(ext);
+    const cs = carpetas(ruta);
+    if (cs.length === 0) raizMedida = true;
+    for (const c of cs) carpetasMedidas.add(clave(c));
   }
+  const esCodigoMedido = (ruta: string): boolean => {
+    if (DECLARACIONES_RE.test(ruta) || !medidas.has(extension(ruta))) return false;
+    const cs = carpetas(ruta);
+    return cs.length === 0 ? raizMedida : cs.some((c) => carpetasMedidas.has(clave(c)));
+  };
   const ficheros: CoberturaFichero[] = [];
   const sinInstrumentar: string[] = [];
   let ejecutables = 0;
@@ -73,7 +102,7 @@ export function cruzarCobertura(
     if (lineas.length === 0) continue;
     const registro = porClave.get(clave(ruta));
     if (registro === undefined) {
-      if (!medidas.has(extension(ruta))) {
+      if (!esCodigoMedido(ruta)) {
         sinInstrumentar.push(ruta);
         continue;
       }
@@ -140,7 +169,7 @@ export function rangos(lineas: readonly number[]): string {
  * que un 90.96 que no llega a 91 no se lea «91 % no llega a 91 %» (MEN-2).
  */
 export function formatearPorcentaje(p: number): string {
-  return String(Math.floor(p * 10 + 1e-9) / 10);
+  return String(Math.floor(p * 10) / 10);
 }
 
 /** true si cumple el umbral (porcentaje minimo; el valor exacto pasa). Sin lineas ejecutables, pasa. */
@@ -164,7 +193,7 @@ export function describirCruce(c: CruceCobertura): string {
     for (const f of conHuecos) {
       lineas.push(
         `- \`${f.ruta}\`: ${rangos(f.sinCubrir)}` +
-          (f.fueraDelInforme ? ' (el informe no lo lista: ningun test lo carga)' : '')
+          (f.fueraDelInforme ? ' (el informe no lo lista, y es codigo de una carpeta que si mide: cuenta entero)' : '')
       );
     }
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
index 4b361de..e845144 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
@@ -16,6 +16,7 @@ import { lineasAnadidas, mergeBase } from '../../src/fs/git.js';
 import { coberturaDeRama, leerInformeCobertura } from '../../src/fs/cobertura.js';
 import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
 import { runReviewCommand } from '../../src/commands/review.js';
+import { runVeredictoCommand } from '../../src/commands/veredicto.js';
 import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
 
 /**
@@ -36,7 +37,8 @@ fs.mkdirSync('coverage', { recursive: true });
 if (modo === 'dist') { fs.writeFileSync('coverage/lcov.info', 'SF:dist/x.js\\nDA:1,1\\nend_of_record\\n'); process.exit(0); }
 const env = { ...process.env };
 delete env.NODE_TEST_CONTEXT;
-const r = spawnSync(process.execPath, ['--test', '--experimental-test-coverage', '--test-reporter=lcov',
+const excluir = modo === 'cov-sin-tests' ? ['--test-coverage-exclude=test/**'] : [];
+const r = spawnSync(process.execPath, ['--test', '--experimental-test-coverage', ...excluir, '--test-reporter=lcov',
   '--test-reporter-destination=coverage/lcov.info', 'test/*.test.mjs'], { env, encoding: 'utf8' });
 process.exit(r.status === null ? 1 : r.status);
 `;
@@ -49,7 +51,7 @@ interface Ctx {
   repoRoot: string;
   tareasRoot: string;
   dir: string;
-  modo(m: 'cov' | 'nada' | 'dist'): Promise<void>;
+  modo(m: 'cov' | 'cov-sin-tests' | 'nada' | 'dist'): Promise<void>;
   ejecuciones(): number;
   generar(): void;
 }
@@ -417,7 +419,7 @@ test('finish (IMP-1): un modulo nuevo que ningun test carga no pasa el umbral; u
     commitAll(c.repoRoot, 'feat: modulo sin test');
     await assert.rejects(
       () => finish(c, ['TASK-975']),
-      /no llega al umbral[\s\S]*- `src\/nuevo\.mjs`: 1-4 \(el informe no lo lista: ningun test lo carga\)/
+      /no llega al umbral[\s\S]*- `src\/nuevo\.mjs`: 1-4 \(el informe no lo lista, y es codigo de una carpeta que si mide: cuenta entero\)/
     );
     assert.equal(integrada(task.rama, c.repoRoot), false);
   });
@@ -512,3 +514,49 @@ test('review (IMP-4, MEN-4): en una peticion fragmentada cada dominio ve solo la
     assert.doesNotMatch(generico, /X\.java/);
   });
 });
+
+// ---------------------------------------------------------------------
+// Ronda 2 de revision
+// ---------------------------------------------------------------------
+
+test('finish (IMP-5): con los tests excluidos de la cobertura, una tarea que solo añade tests cierra', async () => {
+  await conCobertura('umbral_cobertura: 100\n', async (c) => {
+    // Base con el codigo cubierto por completo.
+    await mkdir(path.join(c.repoRoot, 'src'), { recursive: true });
+    await mkdir(path.join(c.repoRoot, 'test'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, 'src', 'a.mjs'), FUENTE, 'utf8');
+    await writeFile(path.join(c.repoRoot, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
+    commitAll(c.repoRoot, 'codigo en la base');
+    await c.modo('cov-sin-tests');
+    const task = sampleTask({ id: 'TASK-969', rama: 'feature/task-969-cob' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await writeFile(path.join(c.repoRoot, 'test', 'b.test.mjs'), "import { test } from 'node:test';\nimport { f } from '../src/a.mjs';\ntest('neg', () => { f(-1); });\n", 'utf8');
+    commitAll(c.repoRoot, 'test: rama neg');
+    const r = await finish(c, ['TASK-969']);
+    assert.equal(r.cierre, 'terminada', 'test/b.test.mjs no esta en el informe ni en una carpeta medida: no cuenta');
+  });
+});
+
+test('review (MEN-5): en la ronda 2 fragmentada, una linea sin cubrir de un dominio sin peticion va a la primera', async () => {
+  await conCobertura('', async (c) => {
+    await tareaEnCurso(c, 'TASK-968', 'feature/task-968-cob');
+    c.generar();
+    await runFinishlessReview(c, 'TASK-968');
+    await runVeredictoCommand(c.tareasRoot, ['TASK-968', 'cambios-solicitados'], { repoCwd: c.repoRoot });
+    // La ronda 2 solo toca otros dominios: java y vue, sin grupo generico.
+    await mkdir(path.join(c.repoRoot, 'java'), { recursive: true });
+    await mkdir(path.join(c.repoRoot, 'web'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, 'java', 'X.java'), 'class X {}\n', 'utf8');
+    await writeFile(path.join(c.repoRoot, 'web', 'C.vue'), '<template><p/></template>\n', 'utf8');
+    commitAll(c.repoRoot, 'feat: java y vue');
+    c.generar();
+    const r2 = await runReviewCommand(c.tareasRoot, ['TASK-968'], '2026-11-05', { repoCwd: c.repoRoot, scriptsDir: SCRIPTS_DIR });
+    assert.equal(r2.incremental, true);
+    const dir = path.join(c.tareasRoot, '03-en-revision', 'TASK-968', 'revision');
+    const java = await readFile(path.join(dir, 'peticion-revision-2-java-spring-reviewer.md'), 'utf8');
+    const vue = await readFile(path.join(dir, 'peticion-revision-2-angular-vue-reviewer.md'), 'utf8');
+    const conA = [java, vue].filter((p) => /- `src\/a\.mjs`: 6\n/.test(p));
+    assert.equal(conA.length, 1, 'la linea sin cubrir de la ronda 1 sale una vez, aunque su dominio no tenga peticion');
+    assert.doesNotMatch(vue, /X\.java/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
index 2c1cb03..3fe0b97 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
@@ -116,19 +116,46 @@ test('cruce (IMP-1/IMP-2 de la revision): un fichero de codigo que el informe no
   ]);
   assert.deepEqual(c.sinInstrumentar, ['Makefile', 'docs/guia.md']);
   assert.deepEqual([c.cubiertas, c.ejecutables], [1, 4]);
-  assert.match(describirCruce(c), /- `src\/nuevo\.mjs`: 1-2, 4 \(el informe no lo lista: ningun test lo carga\)/);
+  assert.match(
+    describirCruce(c),
+    /- `src\/nuevo\.mjs`: 1-2, 4 \(el informe no lo lista, y es codigo de una carpeta que si mide: cuenta entero\)/
+  );
   // Una tarea de solo docs no tiene nada que medir.
   const docs = cruzarCobertura(new Map([['docs/guia.md', [1]]]), informe);
   assert.equal(docs.ejecutables, 0);
   assert.equal(cumpleUmbral(docs, 100), true);
 });
 
+test('cruce (IMP-5 de la ronda 2): fuera del informe solo cuenta el codigo de una carpeta medida; tests excluidos y .d.ts, no', () => {
+  const anadidas = new Map([
+    ['test/b.test.mjs', [1, 2]],
+    ['src/tipos.d.ts', [1]],
+    ['src/Tipos.D.MTS', [1]],
+    ['src/sub/n.mjs', [1, 2]],
+    ['otra/x.mjs', [1]],
+    ['raiz.mjs', [1]],
+    ['src/Mayus.MJS', [1]],
+  ]);
+  const c = cruzarCobertura(anadidas, informe);
+  assert.deepEqual(
+    c.ficheros.map((f) => f.ruta),
+    ['src/Mayus.MJS', 'src/sub/n.mjs'],
+    'src/ tiene ficheros medidos (tambien una subcarpeta suya); la extension no distingue mayusculas'
+  );
+  assert.deepEqual(c.sinInstrumentar, ['otra/x.mjs', 'raiz.mjs', 'src/Tipos.D.MTS', 'src/tipos.d.ts', 'test/b.test.mjs']);
+  // Con un fichero medido en la raiz, un .mjs nuevo de la raiz si cuenta.
+  const conRaiz = new Map([...informe, ['main.mjs', new Map([[1, 1]])]]);
+  assert.deepEqual(cruzarCobertura(new Map([['raiz.mjs', [1]]]), conRaiz).ficheros.map((f) => f.ruta), ['raiz.mjs']);
+  // Una tarea que solo añade tests (excluidos del informe) no se frena.
+  assert.equal(cumpleUmbral(cruzarCobertura(new Map([['test/b.test.mjs', [1]]]), informe), 100), true);
+});
+
 test('porcentaje (MEN-2 de la revision): redondea hacia abajo, para no decir «91 % no llega a 91 %»', () => {
   assert.equal(formatearPorcentaje((100 * 1820) / 2001), '90.9');
   assert.equal(formatearPorcentaje(90), '90');
   assert.equal(formatearPorcentaje((100 * 2) / 3), '66.6');
   assert.equal(formatearPorcentaje(100), '100');
-  assert.equal(formatearPorcentaje((100 * 29) / 100), '29', 'sin el error de coma flotante');
+  assert.equal(formatearPorcentaje((100 * 999) / 1000), '99.9');
 });
 
 test('cruce: filtrar por los ficheros de un dominio recalcula los totales', () => {
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 58334406a41a2ddae4fdec6dd8bb8fd781ad52de..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/03-en-revision/TASK-074/planificacion/plan-final.md                      |   4 +
 tareas/03-en-revision/TASK-074/revision/informe-revision-2.md                   |  75 ++++++++++++++
 tareas/03-en-revision/TASK-074/revision/peticion-revision-2.md                  | 625 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-074/tarea.md                                         |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js        |  13 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/cobertura-cambios.js |  32 +++++-
 6 files changed, 746 insertions(+), 7 deletions(-)
````
