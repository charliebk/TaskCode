# Peticion de revision — TASK-074 (ronda 4)

- Tarea: TASK-074 — Cobertura sobre las lineas cambiadas
- Rama revisada: feature/task-074-cobertura-sobre-las-lineas-cambiadas
- Rama base: develop
- Commit revisado (HEAD): 1ede0f62cf905085dc3c8076599fab692db8a398
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: opus)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-074 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 6754a735030faec9bea95940a5be316d13316381 (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-4.md), sin borrar la
peticion.

## Hallazgos de la ronda 3 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-6 | IMPORTANTE | abierto | src/core/cobertura-cambios.ts:78-96 (cruzarCobertura, `carpetasMedidas` / `esCodigoMedido`) | informe-revision-3.md |
| MEN-7 | MENOR | abierto | test/core/cobertura.test.ts (caso IMP-5: `DECLARACIONES_RE`, `clave` en `carpetasMedidas`) | informe-revision-3.md |
| MEN-8 | MENOR | abierto | test/commands/cobertura-cambios.test.ts (test MEN-5) / src/commands/review.ts:528-531 | informe-revision-3.md |

## Commits a revisar (git log 6754a735030faec9bea95940a5be316d13316381..HEAD)

````
1ede0f6 fix(TASK-074): hallazgos de la ronda 3 de revision
7b93616 chore(TASK-074): coste revision +3557621 tokens (1 agente)
058f381 docs(TASK-074): informe de revision ronda 3
c1471f1 chore(TASK-074): peticion de revision ronda 3
````

## Diff desde la ronda anterior (git diff 6754a735030faec9bea95940a5be316d13316381..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 6c64bfc..0006c94 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -711,8 +711,10 @@ umbral_cobertura: 80                       # opcional: % minimo cubierto para qu
 - Cuenta una línea cambiada (no en blanco) con `DA` en el informe (`DA:n,0` =
   sin cubrir); sin `DA` no es ejecutable. Un fichero cambiado que el informe no
   lista cuenta con todas sus líneas sin cubrir si el informe **sí** mide su
-  extensión y alguna de sus carpetas (sin contar la raíz) tiene un fichero
-  medido: un `.mjs` nuevo en `src/` que ningún test carga (`node --test` y c8
+  extensión y alguna de sus carpetas tiene un fichero medido, sin contar la
+  raíz del repo ni la del proyecto que generó el informe (la carpeta contra la
+  que se resuelven sus rutas relativas, como `pkg/`, y sus padres): un `.mjs`
+  nuevo en `src/` que ningún test carga (`node --test` y c8
   sin `--all` solo listan lo cargado). No cuentan un `.md` o un `.yml`, los
   tests si el proyecto los excluye de la cobertura (`test/` sin nada medido) ni
   los `*.d.ts`: una tarea de solo documentación, o de solo tests, no se frena.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
index b467d13..13053ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
@@ -11,10 +11,11 @@
  *   un `type`) no es ejecutable y no cuenta.
  * - Un fichero cambiado que no esta en el informe cuenta con todas sus
  *   lineas añadidas sin cubrir si el informe SI mide su extension Y alguna
- *   carpeta suya (la propia o una padre, sin contar la raiz del repo) tiene un
- *   fichero medido: un .mjs nuevo en `src/` que ningun test carga (`node
- *   --test` y c8 sin `--all` solo listan lo cargado). IMP-1 e IMP-2 de la
- *   ronda 1; acotada en la ronda 2 (IMP-5) para no frenar en falso.
+ *   carpeta suya (la propia o una padre, sin contar la raiz del repo ni la
+ *   del proyecto que genero el informe, p. ej. `pkg/`) tiene un fichero
+ *   medido: un .mjs nuevo en `src/` que ningun test carga (`node --test` y
+ *   c8 sin `--all` solo listan lo cargado). IMP-1 e IMP-2 de la ronda 1;
+ *   acotada en la ronda 2 (IMP-5) y en la 3 (IMP-6) para no frenar en falso.
  * - Si no, va aparte como «sin instrumentar» y no cuenta: un .md o un .yml
  *   (extension no medida), los tests cuando el proyecto los excluye de la
  *   cobertura (`test/` sin ningun fichero medido) y los `*.d.ts`, que no
@@ -67,32 +68,51 @@ export interface CruceCobertura {
   porcentaje: number | null;
 }
 
+/** Carpeta de una ruta del repo ('' en la raiz). */
+function padre(ruta: string): string {
+  const i = ruta.lastIndexOf('/');
+  return i < 0 ? '' : ruta.slice(0, i);
+}
+
 /**
  * Cruza las lineas añadidas (por ruta del repo) con el informe (por ruta del
  * repo). `clave` normaliza la ruta para comparar: en Windows, sin mayusculas.
+ * `raices`: carpetas del repo que son la raiz de un proyecto que genero el
+ * informe (`pkg`, `packages/a`). Ellas y sus padres se descuentan como la
+ * raiz del repo: `pkg/` siempre «tiene algo medido» y no dice nada de
+ * `pkg/test/` (IMP-6 de la ronda 3).
  */
 export function cruzarCobertura(
   anadidas: ReadonlyMap<string, readonly number[]>,
   informe: ReadonlyMap<string, LineasEjecutadas>,
-  clave: (ruta: string) => string = (r) => r
+  clave: (ruta: string) => string = (r) => r,
+  raices: readonly string[] = []
 ): CruceCobertura {
+  const descontadas = new Set<string>();
+  for (const r of raices) {
+    descontadas.add(clave(r));
+    for (const c of carpetas(r)) descontadas.add(clave(c));
+  }
+  /** Carpetas de la ruta que dicen algo: sin la raiz del repo ni las de los proyectos. */
+  const efectivas = (ruta: string): string[] => carpetas(ruta).filter((c) => !descontadas.has(clave(c)));
   const porClave = new Map<string, LineasEjecutadas>();
   const medidas = new Set<string>();
-  /** Carpetas (por clave, sin la raiz) con algun fichero medido debajo. */
+  /** Carpetas (por clave) con algun fichero medido debajo. */
   const carpetasMedidas = new Set<string>();
-  let raizMedida = false;
+  /** Raices (del repo o de un proyecto, por clave) con un fichero medido directamente. */
+  const raicesMedidas = new Set<string>();
   for (const [ruta, lineas] of informe) {
     porClave.set(clave(ruta), lineas);
     const ext = extension(ruta);
     if (ext !== '') medidas.add(ext);
-    const cs = carpetas(ruta);
-    if (cs.length === 0) raizMedida = true;
+    const cs = efectivas(ruta);
+    if (cs.length === 0) raicesMedidas.add(clave(padre(ruta)));
     for (const c of cs) carpetasMedidas.add(clave(c));
   }
   const esCodigoMedido = (ruta: string): boolean => {
     if (DECLARACIONES_RE.test(ruta) || !medidas.has(extension(ruta))) return false;
-    const cs = carpetas(ruta);
-    return cs.length === 0 ? raizMedida : cs.some((c) => carpetasMedidas.has(clave(c)));
+    const cs = efectivas(ruta);
+    return cs.length === 0 ? raicesMedidas.has(clave(padre(ruta))) : cs.some((c) => carpetasMedidas.has(clave(c)));
   };
   const ficheros: CoberturaFichero[] = [];
   const sinInstrumentar: string[] = [];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts
index 7aac639..ca1d964 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts
@@ -32,6 +32,11 @@ export type LecturaInforme =
       porRuta: Map<string, LineasEjecutadas>;
       /** Ficheros del informe que son ficheros versionados del repo fuera de lo excluido. */
       validos: number;
+      /**
+       * Carpetas del repo (sin la raiz) contra las que se resolvieron las `SF:`
+       * relativas: las raices de los proyectos que generaron el informe (`pkg`).
+       */
+      raices: string[];
     };
 
 function real(p: string): string {
@@ -61,17 +66,37 @@ function basesRelativas(raizReal: string, dirInforme: string): string[] {
   return bases;
 }
 
-/** Ruta del repo (con `/`) de una entrada `SF:`, o null si cae fuera del repo. */
-export function resolverSf(sf: string, raizReal: string, dirInforme: string): string | null {
-  const s = sf.replace(/\\/g, '/');
-  const absoluta = /^[A-Za-z]:\//.test(s) || s.startsWith('/');
-  const candidatos = absoluta ? [s] : basesRelativas(raizReal, dirInforme).map((b) => path.join(b, s));
-  const elegido = candidatos.find((c) => existsSync(c)) ?? (candidatos[0] as string);
-  const rel = path.relative(raizReal, real(elegido));
+/** Ruta del repo con `/`, o null si `abs` cae fuera de el (o es la raiz). */
+function relativaAlRepo(raizReal: string, abs: string): string | null {
+  const rel = path.relative(raizReal, real(abs));
   if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
   return rel.split(path.sep).join('/');
 }
 
+/**
+ * Ruta del repo (con `/`) de una entrada `SF:`, o null si cae fuera del repo;
+ * y, si era relativa, la carpeta del repo contra la que se resolvio (la raiz
+ * del proyecto que genero el informe; '' si es la raiz del repo).
+ */
+function resolverSfConBase(sf: string, raizReal: string, dirInforme: string): { ruta: string; base: string | null } | null {
+  const s = sf.replace(/\\/g, '/');
+  const absoluta = /^[A-Za-z]:\//.test(s) || s.startsWith('/');
+  if (absoluta) {
+    const ruta = relativaAlRepo(raizReal, s);
+    return ruta === null ? null : { ruta, base: null };
+  }
+  const bases = basesRelativas(raizReal, dirInforme);
+  const elegida = bases.find((b) => existsSync(path.join(b, s))) ?? (bases[0] as string);
+  const ruta = relativaAlRepo(raizReal, path.join(elegida, s));
+  if (ruta === null) return null;
+  return { ruta, base: relativaAlRepo(raizReal, elegida) ?? '' };
+}
+
+/** Ruta del repo (con `/`) de una entrada `SF:`, o null si cae fuera del repo. */
+export function resolverSf(sf: string, raizReal: string, dirInforme: string): string | null {
+  return resolverSfConBase(sf, raizReal, dirInforme)?.ruta ?? null;
+}
+
 /** Lee y resuelve el informe. `informe` es relativa a la raiz del repo. */
 export function leerInformeCobertura(raiz: string, informe: string, excluir: readonly string[]): LecturaInforme {
   const raizReal = real(raiz);
@@ -88,9 +113,12 @@ export function leerInformeCobertura(raiz: string, informe: string, excluir: rea
   if (lcov.truncado) return { tipo: 'truncado', ruta: informe, mtimeMs };
   const dirInforme = path.dirname(abs);
   const porRuta = new Map<string, LineasEjecutadas>();
+  const raices = new Set<string>();
   for (const [sf, lineas] of lcov.ficheros) {
-    const ruta = resolverSf(sf, raizReal, dirInforme);
-    if (ruta === null) continue;
+    const r = resolverSfConBase(sf, raizReal, dirInforme);
+    if (r === null) continue;
+    const ruta = r.ruta;
+    if (r.base !== null && r.base !== '') raices.add(r.base);
     const previa = porRuta.get(ruta);
     if (previa === undefined) {
       porRuta.set(ruta, lineas);
@@ -101,7 +129,7 @@ export function leerInformeCobertura(raiz: string, informe: string, excluir: rea
   const versionados = new Set(ficherosVersionados(excluir, raiz).map(claveRuta));
   let validos = 0;
   for (const ruta of porRuta.keys()) if (versionados.has(claveRuta(ruta))) validos++;
-  return { tipo: 'ok', ruta: informe, mtimeMs, porRuta, validos };
+  return { tipo: 'ok', ruta: informe, mtimeMs, porRuta, validos, raices: [...raices].sort() };
 }
 
 export interface CoberturaDeRama {
@@ -117,7 +145,7 @@ export function coberturaDeRama(raiz: string, base: string, informe: string, exc
   const lectura = leerInformeCobertura(raiz, informe, excluir);
   if (lectura.tipo !== 'ok') return { mergeBase: mb, lectura, cruce: null };
   const anadidas = lineasAnadidas(mb, 'HEAD', excluir, raiz);
-  return { mergeBase: mb, lectura, cruce: cruzarCobertura(anadidas, lectura.porRuta, claveRuta) };
+  return { mergeBase: mb, lectura, cruce: cruzarCobertura(anadidas, lectura.porRuta, claveRuta, lectura.raices) };
 }
 
 /** Lo que la peticion de revision necesita, calculado UNA vez por ronda. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
index e845144..3e93c75 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
@@ -406,6 +406,35 @@ test('cobertura (IMP-3): un proyecto en subcarpeta con el informe en pkg/coverag
     assert.ok(l.tipo === 'ok');
     assert.deepEqual([...l.porRuta.keys()].sort(), ['pkg/src/a.mjs', 'pkg/test/a.test.mjs']);
     assert.equal(l.validos, 2);
+    assert.deepEqual(l.raices, ['pkg'], 'la raiz del proyecto que genero el informe');
+  });
+});
+
+test('cobertura (IMP-6 de la ronda 3): en un proyecto en subcarpeta con los tests excluidos, un test nuevo no cuenta y un modulo nuevo si', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const pkg = path.join(repoRoot, 'pkg');
+    await mkdir(path.join(pkg, 'src'), { recursive: true });
+    await mkdir(path.join(pkg, 'test'), { recursive: true });
+    await writeFile(path.join(pkg, 'src', 'a.mjs'), FUENTE, 'utf8');
+    await writeFile(path.join(pkg, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
+    commitAll(repoRoot, 'pkg');
+    git(['checkout', '-q', '-b', 'feature/task-967-x', 'develop'], repoRoot);
+    await writeFile(path.join(pkg, 'test', 'b.test.mjs'), "import { test } from 'node:test';\nimport { f } from '../src/a.mjs';\ntest('neg', () => { f(-1); });\n", 'utf8');
+    await writeFile(path.join(pkg, 'src', 'nuevo.mjs'), 'export const n = 1;\n', 'utf8');
+    commitAll(repoRoot, 'test y modulo nuevos');
+    await mkdir(path.join(pkg, 'coverage'), { recursive: true });
+    const env = { ...process.env };
+    delete env.NODE_TEST_CONTEXT;
+    const r = spawnSync(
+      process.execPath,
+      ['--test', '--experimental-test-coverage', '--test-coverage-exclude=test/**', '--test-reporter=lcov', '--test-reporter-destination=coverage/lcov.info', 'test/*.test.mjs'],
+      { cwd: pkg, env, encoding: 'utf8' }
+    );
+    assert.equal(r.status, 0, r.stderr);
+    const c = coberturaDeRama(repoRoot, 'develop', 'pkg/coverage/lcov.info', []);
+    assert.ok(c.cruce);
+    assert.deepEqual(c.cruce.ficheros.map((f) => f.ruta), ['pkg/src/nuevo.mjs']);
+    assert.ok(c.cruce.sinInstrumentar.includes('pkg/test/b.test.mjs'));
   });
 });
 
@@ -558,5 +587,8 @@ test('review (MEN-5): en la ronda 2 fragmentada, una linea sin cubrir de un domi
     const conA = [java, vue].filter((p) => /- `src\/a\.mjs`: 6\n/.test(p));
     assert.equal(conA.length, 1, 'la linea sin cubrir de la ronda 1 sale una vez, aunque su dominio no tenga peticion');
     assert.doesNotMatch(vue, /X\.java/);
+    // MEN-8 de la ronda 3: la peticion que recibe src/a.mjs conserva tambien sus propios ficheros.
+    if (conA[0] === java) assert.match(java, /`java\/X\.java`/);
+    else assert.match(vue, /`web\/C\.vue`/);
   });
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
index 3fe0b97..540283e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
@@ -150,6 +150,44 @@ test('cruce (IMP-5 de la ronda 2): fuera del informe solo cuenta el codigo de un
   assert.equal(cumpleUmbral(cruzarCobertura(new Map([['test/b.test.mjs', [1]]]), informe), 100), true);
 });
 
+test('cruce (IMP-6 de la ronda 3): la raiz de un proyecto en subcarpeta se descuenta como la del repo', () => {
+  const mono = new Map([
+    ['packages/a/src/a.mjs', new Map([[1, 1]])],
+    ['packages/a/test/a.test.mjs', new Map([[1, 1]])],
+  ]);
+  const anadidas = new Map([
+    ['packages/a/test2/b.test.mjs', [1]],
+    ['packages/a/src/sub/n.mjs', [1]],
+    ['packages/a/x.mjs', [1]],
+    ['packages/b/src/x.mjs', [1]],
+  ]);
+  const sinRaices = cruzarCobertura(anadidas, mono);
+  assert.deepEqual(sinRaices.sinInstrumentar, [], 'sin raices, packages/ y packages/a/ «tienen algo medido»');
+  const c = cruzarCobertura(anadidas, mono, (r) => r, ['packages/a']);
+  assert.deepEqual(c.ficheros.map((f) => f.ruta), ['packages/a/src/sub/n.mjs']);
+  assert.deepEqual(c.sinInstrumentar, ['packages/a/test2/b.test.mjs', 'packages/a/x.mjs', 'packages/b/src/x.mjs']);
+  // Un fichero medido directamente en la raiz del proyecto hace contar a sus vecinos de raiz.
+  const conDirecto = new Map([...mono, ['packages/a/index.mjs', new Map([[1, 1]])]]);
+  assert.deepEqual(
+    cruzarCobertura(new Map([['packages/a/x.mjs', [1]]]), conDirecto, (r) => r, ['packages/a']).ficheros.map((f) => f.ruta),
+    ['packages/a/x.mjs']
+  );
+});
+
+test('cruce (MEN-7 de la ronda 3): declaraciones .d.mts/.D.CTS con un informe que mide .mts/.cts, y carpetas con otras mayusculas', () => {
+  const mts = new Map([
+    ['src/a.mts', new Map([[1, 1]])],
+    ['src/b.cts', new Map([[1, 1]])],
+  ]);
+  const c = cruzarCobertura(new Map([['src/t.d.mts', [1]], ['src/T.D.CTS', [1]], ['src/n.mts', [1]]]), mts);
+  assert.deepEqual(c.sinInstrumentar, ['src/T.D.CTS', 'src/t.d.mts']);
+  assert.deepEqual(c.ficheros.map((f) => f.ruta), ['src/n.mts']);
+  // Con la clave sin mayusculas (Windows), la carpeta medida se compara por clave.
+  const app = new Map([['App/a.mjs', new Map([[1, 1]])]]);
+  const sinMayus = cruzarCobertura(new Map([['App/n.mjs', [1]]]), app, (r) => r.toLowerCase());
+  assert.deepEqual(sinMayus.ficheros.map((f) => f.ruta), ['App/n.mjs']);
+});
+
 test('porcentaje (MEN-2 de la revision): redondea hacia abajo, para no decir «91 % no llega a 91 %»', () => {
   assert.equal(formatearPorcentaje((100 * 1820) / 2001), '90.9');
   assert.equal(formatearPorcentaje(90), '90');
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 6754a735030faec9bea95940a5be316d13316381..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/03-en-revision/TASK-074/planificacion/plan-final.md                      |   5 ++
 tareas/03-en-revision/TASK-074/revision/informe-revision-3.md                   |  69 +++++++++++++++++++++
 tareas/03-en-revision/TASK-074/revision/peticion-revision-3.md                  | 375 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-074/tarea.md                                         |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/cobertura-cambios.js |  32 +++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/cobertura.js           |  45 ++++++++++----
 6 files changed, 511 insertions(+), 19 deletions(-)
````
