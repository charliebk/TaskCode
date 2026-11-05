# Peticion de revision — TASK-074 (ronda 2)

- Tarea: TASK-074 — Cobertura sobre las lineas cambiadas
- Rama revisada: feature/task-074-cobertura-sobre-las-lineas-cambiadas
- Rama base: develop
- Commit revisado (HEAD): 58334406a41a2ddae4fdec6dd8bb8fd781ad52de
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: opus)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-074 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde e4a171d0fb4d6059d2b365cf0e7947a37fcd7f07 (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | src/commands/finish-cobertura.ts:104 | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | src/core/cobertura-cambios.ts:63 | informe-revision-1.md |
| IMP-3 | IMPORTANTE | abierto | src/fs/cobertura.ts:48 (resolverSf) | informe-revision-1.md |
| IMP-4 | IMPORTANTE | abierto | finish.ts:462, finish-cobertura.ts:82, git.ts:416, review.ts:598, git.ts (lineasAnadidas) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/fs/git.ts (lineasAnadidas, `+++ `) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/core/cobertura-cambios.ts (formatearPorcentaje / mensaje de finish) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | test/core/cobertura.test.ts:58 | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/commands/review.ts:598 | informe-revision-1.md |

## Commits a revisar (git log e4a171d0fb4d6059d2b365cf0e7947a37fcd7f07..HEAD)

````
5833440 fix(TASK-074): hallazgos de la ronda 1 de revision
ec32434 chore(TASK-074): coste revision +8287714 tokens (1 agente)
cbc3aae docs(TASK-074): informe de revision ronda 1
89d7ec4 chore(TASK-074): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff e4a171d0fb4d6059d2b365cf0e7947a37fcd7f07..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 499b546..072f8a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -708,9 +708,16 @@ umbral_cobertura: 80                       # opcional: % minimo cubierto para qu
   exacto pasa), y también si no hay datos fiables: el informe no existe, está
   cortado, es anterior a la verificación de ese mismo `finish`, o ninguna ruta
   del informe es del fuente del repo. Sin datos nunca cuenta como aprobado.
-- Cuenta una línea cambiada con `DA` en el informe (`DA:n,0` = sin cubrir); sin
-  `DA` no es ejecutable. Las rutas `SF:` pueden ser absolutas o relativas (a la
-  raíz del repo o a la carpeta del informe), con `\` o `/`.
+- Cuenta una línea cambiada (no en blanco) con `DA` en el informe (`DA:n,0` =
+  sin cubrir); sin `DA` no es ejecutable. Un fichero cambiado que el informe no
+  lista y cuya extensión **sí** mide en otros ficheros (un `.mjs` nuevo que
+  ningún test carga: `node --test` y c8 sin `--all` solo listan lo cargado)
+  cuenta con todas sus líneas sin cubrir. Uno cuya extensión el informe no mide
+  (`.md`, `.yml`…) no cuenta: una tarea de solo documentación no se frena.
+- Las rutas `SF:` pueden ser absolutas o relativas, con `\` o `/`. Una relativa
+  se resuelve contra la carpeta del informe y cada una de sus padres hasta la
+  raíz, la más cercana primero: un proyecto en `pkg/` con el informe en
+  `pkg/coverage/lcov.info` funciona.
 - `umbral_cobertura` e `informe_cobertura` se leen, en `finish`, de la config
   **de la rama base**: la rama no puede rebajar su propio freno. El umbral exige
   `informe_cobertura` y `comando_verificacion`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
index 29f6f2c..89ef697 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
@@ -107,7 +107,7 @@ export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
   if (lectura.validos === 0) {
     throw sinDatos(
       `ninguna ruta del informe ${informe} es un fichero del repo fuera de lo excluido de la revision ` +
-        '(¿mide el codigo compilado, o rutas de otra maquina?)'
+        '(¿mide el codigo compilado, esta vacio, o sus rutas son de otra maquina o relativas a una carpeta que no es la del informe ni una de sus padres?)'
     );
   }
   const cruce = c.cruce;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 5d1bc0a..c3ca088 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -511,6 +511,18 @@ export async function runReviewCommand(
   const ficherosTocados = paraRevision.incluidos;
   const catalogoRevisores = cargarCatalogoRevisores();
   const plan = clasificarPorDominio(ficherosTocados, catalogoRevisores);
+  // TASK-074 (MEN-4 de la revision): en una peticion fragmentada, la seccion
+  // de cobertura de cada dominio lleva SUS ficheros cambiados desde la merge
+  // base, no solo los del delta de la ronda: una linea sin cubrir de la ronda
+  // 1 sigue en la 2 aunque su fichero no haya vuelto a cambiar.
+  const coberturaPorRevisor = new Map<string, Set<string>>();
+  if (plan.fragmentado && datosCobertura?.tipo === 'ok' && datosCobertura.cobertura.cruce !== null) {
+    const cruce = datosCobertura.cobertura.cruce;
+    const cambiados = [...cruce.ficheros.map((f) => f.ruta), ...cruce.sinInstrumentar];
+    for (const g of clasificarPorDominio(cambiados, catalogoRevisores).grupos) {
+      coberturaPorRevisor.set(g.revisor, new Set(g.ficheros));
+    }
+  }
 
   const updated: Task = { ...task, estado: 'en-revision', actualizado: today };
 
@@ -595,7 +607,7 @@ export async function runReviewCommand(
               : {
                   seccionCobertura: seccionCoberturaRevision(
                     datosCobertura,
-                    plan.fragmentado ? new Set(escritura.ficheros) : undefined
+                    plan.fragmentado ? (coberturaPorRevisor.get(escritura.revisor) ?? new Set<string>()) : undefined
                   ),
                 }),
           }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
index db4c830..028bd5a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
@@ -9,8 +9,12 @@
  * - Cuenta una linea añadida o cambiada con `DA` en el informe: `DA:n,0` es
  *   sin cubrir, `DA:n,k>0` cubierta. Sin `DA` (comentario, linea en blanco,
  *   un `type`) no es ejecutable y no cuenta.
- * - Un fichero cambiado que no esta en el informe va aparte, «sin
- *   instrumentar» (un .md, un .yml...): no cuenta como cubierto ni como no.
+ * - Un fichero cambiado que no esta en el informe y cuya extension el
+ *   informe SI instrumenta en otros ficheros (un .mjs nuevo que ningun test
+ *   carga: `node --test` y c8 sin `--all` solo listan lo cargado) cuenta con
+ *   todas sus lineas añadidas sin cubrir (IMP-1 e IMP-2 de la revision).
+ * - Uno cuya extension el informe no mide (un .md, un .yml...) va aparte,
+ *   «sin instrumentar»: no cuenta. Una tarea de solo docs no se frena.
  * - El umbral es el porcentaje minimo cubierto; el valor exacto pasa.
  *
  * Puro: recibe las lineas cambiadas y el informe ya resuelto a rutas del repo.
@@ -24,6 +28,15 @@ export interface CoberturaFichero {
   cubiertas: number;
   /** Lineas cambiadas con `DA:n,0`, en orden. */
   sinCubrir: number[];
+  /** El informe no lista el fichero (ningun test lo carga): todas sus lineas cuentan sin cubrir. */
+  fueraDelInforme?: true;
+}
+
+/** Extension en minusculas (`.mjs`), o '' si no tiene. */
+function extension(ruta: string): string {
+  const base = ruta.slice(ruta.lastIndexOf('/') + 1);
+  const punto = base.lastIndexOf('.');
+  return punto <= 0 ? '' : base.slice(punto).toLowerCase();
 }
 
 export interface CruceCobertura {
@@ -46,7 +59,12 @@ export function cruzarCobertura(
   clave: (ruta: string) => string = (r) => r
 ): CruceCobertura {
   const porClave = new Map<string, LineasEjecutadas>();
-  for (const [ruta, lineas] of informe) porClave.set(clave(ruta), lineas);
+  const medidas = new Set<string>();
+  for (const [ruta, lineas] of informe) {
+    porClave.set(clave(ruta), lineas);
+    const ext = extension(ruta);
+    if (ext !== '') medidas.add(ext);
+  }
   const ficheros: CoberturaFichero[] = [];
   const sinInstrumentar: string[] = [];
   let ejecutables = 0;
@@ -55,7 +73,13 @@ export function cruzarCobertura(
     if (lineas.length === 0) continue;
     const registro = porClave.get(clave(ruta));
     if (registro === undefined) {
-      sinInstrumentar.push(ruta);
+      if (!medidas.has(extension(ruta))) {
+        sinInstrumentar.push(ruta);
+        continue;
+      }
+      const sinCubrir = [...lineas].sort((a, b) => a - b);
+      ficheros.push({ ruta, ejecutables: sinCubrir.length, cubiertas: 0, sinCubrir, fueraDelInforme: true });
+      ejecutables += sinCubrir.length;
       continue;
     }
     const f: CoberturaFichero = { ruta, ejecutables: 0, cubiertas: 0, sinCubrir: [] };
@@ -111,9 +135,12 @@ export function rangos(lineas: readonly number[]): string {
   return partes.join(', ');
 }
 
-/** `87.5`, `100`, `33.3`: un decimal como mucho. */
+/**
+ * `87.5`, `100`, `33.3`: un decimal como mucho, redondeado HACIA ABAJO, para
+ * que un 90.96 que no llega a 91 no se lea «91 % no llega a 91 %» (MEN-2).
+ */
 export function formatearPorcentaje(p: number): string {
-  return String(Math.round(p * 10) / 10);
+  return String(Math.floor(p * 10 + 1e-9) / 10);
 }
 
 /** true si cumple el umbral (porcentaje minimo; el valor exacto pasa). Sin lineas ejecutables, pasa. */
@@ -134,7 +161,12 @@ export function describirCruce(c: CruceCobertura): string {
   const conHuecos = c.ficheros.filter((f) => f.sinCubrir.length > 0);
   if (conHuecos.length > 0) {
     lineas.push('', 'Sin cubrir (ningun test las ejecuta):', '');
-    for (const f of conHuecos) lineas.push(`- \`${f.ruta}\`: ${rangos(f.sinCubrir)}`);
+    for (const f of conHuecos) {
+      lineas.push(
+        `- \`${f.ruta}\`: ${rangos(f.sinCubrir)}` +
+          (f.fueraDelInforme ? ' (el informe no lo lista: ningun test lo carga)' : '')
+      );
+    }
   }
   if (c.sinInstrumentar.length > 0) {
     lineas.push('', 'Cambian pero el informe no los lista (sin instrumentar; no cuentan):', '');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts
index 4551391..7aac639 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts
@@ -5,9 +5,9 @@
  *
  * Las rutas `SF:` se resuelven contra el repo: absolutas (c8, istanbul) o
  * relativas al cwd en que corrieron los tests (`node --test`, con `\` en
- * Windows). Una relativa se prueba contra la raiz del repo y, si alli no
- * existe, contra la carpeta del propio informe (un proyecto cuyos tests
- * corren en un subdirectorio y escriben el lcov ahi). Las rutas cortas 8.3 de
+ * Windows). Una relativa se prueba contra la carpeta del informe y cada una
+ * de sus padres hasta la raiz del repo, la mas cercana primero (un proyecto
+ * cuyos tests corren en un subdirectorio y escriben el lcov ahi). Las rutas cortas 8.3 de
  * Windows se expanden con realpath, y en Windows se comparan sin mayusculas.
  */
 import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
@@ -42,11 +42,30 @@ function real(p: string): string {
   }
 }
 
+/**
+ * Donde puede haber corrido el generador: la carpeta del informe y cada una de
+ * sus padres hasta la raiz del repo, la mas cercana primero. Un proyecto en
+ * `pkg/` que escribe `pkg/coverage/lcov.info` con `SF:src\a.mjs` es `pkg/`
+ * (IMP-3 de la revision); un informe en `coverage/` de la raiz, la raiz.
+ */
+function basesRelativas(raizReal: string, dirInforme: string): string[] {
+  const bases: string[] = [];
+  let dir = dirInforme;
+  for (;;) {
+    bases.push(dir);
+    const rel = path.relative(raizReal, dir);
+    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) break;
+    dir = path.dirname(dir);
+  }
+  if (!bases.includes(raizReal)) bases.push(raizReal);
+  return bases;
+}
+
 /** Ruta del repo (con `/`) de una entrada `SF:`, o null si cae fuera del repo. */
 export function resolverSf(sf: string, raizReal: string, dirInforme: string): string | null {
   const s = sf.replace(/\\/g, '/');
   const absoluta = /^[A-Za-z]:\//.test(s) || s.startsWith('/');
-  const candidatos = absoluta ? [s] : [path.join(raizReal, s), path.join(dirInforme, s)];
+  const candidatos = absoluta ? [s] : basesRelativas(raizReal, dirInforme).map((b) => path.join(b, s));
   const elegido = candidatos.find((c) => existsSync(c)) ?? (candidatos[0] as string);
   const rel = path.relative(raizReal, real(elegido));
   if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
@@ -164,7 +183,7 @@ export function seccionCoberturaRevision(d: DatosCoberturaRevision, rutas?: Read
   if (lectura.validos === 0) {
     return (
       `${titulo}${cabecera}[AVISO] Ninguna ruta del informe es un fichero del repo fuera de lo excluido ` +
-      '(¿mide el codigo compilado, o rutas de otra maquina?): el informe esta mal configurado y no se usa.\n'
+      '(¿mide el codigo compilado, esta vacio, o sus rutas son de otra maquina o relativas a una carpeta que no es la del informe ni una de sus padres?): el informe esta mal configurado y no se usa.\n'
     );
   }
   const cruce = rutas === undefined ? cobertura.cruce : cobertura.cruce === null ? null : filtrarCruce(cobertura.cruce, rutas);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 8912d13..7b94e1d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -345,8 +345,8 @@ export function pathspecSinExcluidos(excluir: readonly string[]): string[] {
 
 /**
  * TASK-074: lineas añadidas o cambiadas entre `desde` y `hasta`, por ruta del
- * repo (con `/`), sin los ficheros que casan con `excluir`. Solo cabeceras
- * `@@ -a,b +c,d @@` de un diff sin contexto. Las opciones que cambian la
+ * repo (con `/`), sin los ficheros que casan con `excluir` y sin las lineas
+ * en blanco. Sale de un diff sin contexto (`-U0`). Las opciones que cambian la
  * salida del diff segun la configuracion de la maquina se fijan aqui
  * (renombres, prefijos, colores, diff externo): un rename no puede convertir
  * el fichero entero en «cambiado». Borrados y binarios no aportan lineas.
@@ -378,26 +378,49 @@ export function lineasAnadidas(
     cwd
   );
   const lineas = new Map<string, number[]>();
+  // Cabecera (desde `diff --git` hasta el primer `@@`) o hunk: dentro de un
+  // hunk, una linea añadida que empieza por `++ ` es contenido, no la
+  // cabecera `+++` de otro fichero (MEN-1 de la revision).
   let actual: number[] | null = null;
+  let enHunk = false;
+  let siguiente = 0;
   for (const l of salida.split('\n')) {
-    if (l.startsWith('+++ ')) {
-      // Git añade un tabulador tras la ruta si esta lleva espacios.
-      const destino = l.slice(4).replace(/\t$/, '');
-      if (destino === '/dev/null' || !destino.startsWith('b/')) {
-        actual = null;
+    if (l.startsWith('diff --git ')) {
+      actual = null;
+      enHunk = false;
+      continue;
+    }
+    if (!enHunk) {
+      if (l.startsWith('+++ ')) {
+        // Git añade un tabulador tras la ruta si esta lleva espacios.
+        const destino = l.slice(4).replace(/\t$/, '');
+        if (destino === '/dev/null' || !destino.startsWith('b/')) {
+          actual = null;
+          continue;
+        }
+        const ruta = destino.slice(2);
+        actual = lineas.get(ruta) ?? [];
+        lineas.set(ruta, actual);
+        continue;
+      }
+      if (!l.startsWith('@@ ')) continue;
+    }
+    if (l.startsWith('@@ ')) {
+      const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
+      if (m === null || actual === null) {
+        enHunk = false;
         continue;
       }
-      const ruta = destino.slice(2);
-      actual = lineas.get(ruta) ?? [];
-      lineas.set(ruta, actual);
+      enHunk = true;
+      siguiente = parseInt(m[1] as string, 10);
       continue;
     }
-    if (actual === null || !l.startsWith('@@ ')) continue;
-    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
-    if (m === null) continue;
-    const inicio = parseInt(m[1] as string, 10);
-    const cuantas = m[2] === undefined ? 1 : parseInt(m[2], 10);
-    for (let i = 0; i < cuantas; i++) actual.push(inicio + i);
+    if (actual === null) continue;
+    if (l.startsWith('+')) {
+      // Una linea en blanco no es codigo: ni cuenta ni puede estar sin cubrir.
+      if (l.slice(1).trim() !== '') actual.push(siguiente);
+      siguiente++;
+    }
   }
   return lineas;
 }
@@ -413,7 +436,8 @@ export function ficherosVersionados(excluir: readonly string[], cwd: string): st
  * merge es siempre mas nuevo que cualquier informe de cobertura.
  */
 export function instanteUltimoCommitPropio(ref: string, cwd: string): number | null {
-  const s = runGit(['log', '-1', '--no-merges', '--format=%ct', ref], cwd);
+  // --first-parent: los commits de la base que entran con ese merge tampoco son de la rama.
+  const s = runGit(['log', '-1', '--first-parent', '--no-merges', '--format=%ct', ref], cwd);
   return s === '' ? null : parseInt(s, 10) * 1000;
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
index c58ab5d..4b361de 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
@@ -350,3 +350,165 @@ test('finish: --sin-verificacion salta tambien la cobertura y lo avisa; sin umbr
     assert.equal(r.cierre, 'terminada', 'sin umbral, sin informe: no frena');
   });
 });
+
+// ---------------------------------------------------------------------
+// Ronda 1 de revision
+// ---------------------------------------------------------------------
+
+test('lineasAnadidas (MEN-1): una linea añadida que empieza por "++ " es contenido, no una cabecera; las vacias no cuentan', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const base = Array.from({ length: 20 }, (_, i) => `l${i + 1}`);
+    await writeFile(path.join(repoRoot, 'x.txt'), base.join('\n') + '\n', 'utf8');
+    commitAll(repoRoot, 'x');
+    git(['checkout', '-q', '-b', 'feature/task-979-x', 'develop'], repoRoot);
+    const l = [...base];
+    l.splice(2, 0, '++ b/otro');
+    l.splice(10, 0, '   ');
+    l.splice(16, 0, 'nueva');
+    await writeFile(path.join(repoRoot, 'x.txt'), l.join('\n') + '\n', 'utf8');
+    commitAll(repoRoot, 'x cambiado');
+    const mb = mergeBase('HEAD', 'develop', repoRoot);
+    assert.deepEqual([...lineasAnadidas(mb, 'HEAD', [], repoRoot)], [['x.txt', [3, 17]]]);
+  });
+});
+
+test('cobertura (IMP-4): un diff externo configurado en el repo no cambia las lineas', async () => {
+  await withTempRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/task-978-x', 'develop'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\n', 'utf8');
+    commitAll(repoRoot, 'a');
+    git(['config', 'diff.external', 'false'], repoRoot);
+    const mb = mergeBase('HEAD', 'develop', repoRoot);
+    assert.deepEqual([...lineasAnadidas(mb, 'HEAD', [], repoRoot)], [['a.mjs', [1]]]);
+  });
+});
+
+test('cobertura (IMP-3): un proyecto en subcarpeta con el informe en pkg/coverage/ resuelve sus rutas a pkg/', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const pkg = path.join(repoRoot, 'pkg');
+    await mkdir(path.join(pkg, 'src'), { recursive: true });
+    await mkdir(path.join(pkg, 'test'), { recursive: true });
+    await mkdir(path.join(pkg, 'coverage'), { recursive: true });
+    await writeFile(path.join(pkg, 'src', 'a.mjs'), FUENTE, 'utf8');
+    await writeFile(path.join(pkg, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
+    commitAll(repoRoot, 'pkg');
+    const env = { ...process.env };
+    delete env.NODE_TEST_CONTEXT;
+    const r = spawnSync(
+      process.execPath,
+      ['--test', '--experimental-test-coverage', '--test-reporter=lcov', '--test-reporter-destination=coverage/lcov.info', 'test/*.test.mjs'],
+      { cwd: pkg, env, encoding: 'utf8' }
+    );
+    assert.equal(r.status, 0, r.stderr);
+    const l = leerInformeCobertura(repoRoot, 'pkg/coverage/lcov.info', []);
+    assert.ok(l.tipo === 'ok');
+    assert.deepEqual([...l.porRuta.keys()].sort(), ['pkg/src/a.mjs', 'pkg/test/a.test.mjs']);
+    assert.equal(l.validos, 2);
+  });
+});
+
+test('finish (IMP-1): un modulo nuevo que ningun test carga no pasa el umbral; una tarea de solo docs, si', async () => {
+  await conCobertura('umbral_cobertura: 50\n', async (c) => {
+    // El codigo medido ya esta en la base; la rama solo añade un modulo sin test.
+    await codigoDeLaTarea(c.repoRoot);
+    const task = sampleTask({ id: 'TASK-975', rama: 'feature/task-975-cob' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await writeFile(path.join(c.repoRoot, 'src', 'nuevo.mjs'), 'export function g(x) {\n  if (x) return 1;\n  return 2;\n}\n', 'utf8');
+    commitAll(c.repoRoot, 'feat: modulo sin test');
+    await assert.rejects(
+      () => finish(c, ['TASK-975']),
+      /no llega al umbral[\s\S]*- `src\/nuevo\.mjs`: 1-4 \(el informe no lo lista: ningun test lo carga\)/
+    );
+    assert.equal(integrada(task.rama, c.repoRoot), false);
+  });
+  await conCobertura('umbral_cobertura: 100\n', async (c) => {
+    await codigoDeLaTarea(c.repoRoot);
+    const task = sampleTask({ id: 'TASK-976', rama: 'feature/task-976-cob' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await mkdir(path.join(c.repoRoot, 'docs'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, 'docs', 'guia.md'), '# guia\n', 'utf8');
+    commitAll(c.repoRoot, 'docs');
+    const r = await finish(c, ['TASK-976']);
+    assert.equal(r.cierre, 'terminada', 'solo docs y .txt: nada que medir');
+  });
+});
+
+test('finish (IMP-4): una rama que quita comando_verificacion no sortea el umbral de la base', async () => {
+  await conCobertura('umbral_cobertura: 10\n', async (c) => {
+    await tareaEnRevision(c, 'TASK-974');
+    await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'informe_cobertura: coverage/lcov.info\n', 'utf8');
+    commitAll(c.repoRoot, 'quitar la verificacion en la rama');
+    await assert.rejects(() => finish(c, ['TASK-974']), /la rama no declara comando_verificacion, asi que nadie regenera el informe/);
+    assert.equal(integrada('feature/task-974-cob', c.repoRoot), false);
+  });
+});
+
+test('finish (IMP-4): un hotfix mide contra la principal y con la config de la principal', async () => {
+  await conCobertura('umbral_cobertura: 0\n', async (c) => {
+    const config = await readFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'utf8');
+    git(['checkout', '-q', 'main'], c.repoRoot);
+    await mkdir(path.join(c.repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), config.replace('umbral_cobertura: 0', 'umbral_cobertura: 100'), 'utf8');
+    await writeFile(path.join(c.repoRoot, '.gitignore'), 'logs/\ncoverage/\n', 'utf8');
+    commitAll(c.repoRoot, 'config en main');
+    git(['checkout', '-q', 'develop'], c.repoRoot);
+    const task = sampleTask({ id: 'TASK-973', tipo: 'hotfix', rama: 'hotfix/task-973-arreglo' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task, { base: 'main' });
+    await codigoDeLaTarea(c.repoRoot);
+    await assert.rejects(() => finish(c, ['TASK-973']), /no llega al umbral de "main" \(100 %\)/);
+  });
+});
+
+/** Commit con fecha de autor y de commit fijas: el merge que haga review sera posterior. */
+function commitConFecha(repoRoot: string, mensaje: string, fecha: string): void {
+  git(['add', '-A'], repoRoot);
+  const r = spawnSync('git', ['commit', '-q', '-m', mensaje], {
+    cwd: repoRoot,
+    env: { ...process.env, GIT_AUTHOR_DATE: fecha, GIT_COMMITTER_DATE: fecha },
+    encoding: 'utf8',
+  });
+  assert.equal(r.status, 0, r.stderr);
+}
+
+test('review (IMP-4): el merge de la base que hace el update no deja el informe por viejo', async () => {
+  await conCobertura('', async (c) => {
+    const { writeTareaFile } = await import('../../src/fs/task-store.js');
+    git(['checkout', '-q', '-b', 'feature/task-972-cob', 'develop'], c.repoRoot);
+    await writeTareaFile(c.tareasRoot, sampleTask({ id: 'TASK-972', rama: 'feature/task-972-cob', estado: 'en-curso' }), '## Objetivo\nProbar.\n');
+    await mkdir(path.join(c.repoRoot, 'src'), { recursive: true });
+    await mkdir(path.join(c.repoRoot, 'test'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, 'src', 'a.mjs'), FUENTE, 'utf8');
+    await writeFile(path.join(c.repoRoot, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
+    commitConFecha(c.repoRoot, 'feat: codigo', '2020-01-01T00:00:00Z');
+    c.generar();
+    const informe = new Date('2021-01-01T00:00:00Z');
+    await utimes(path.join(c.repoRoot, 'coverage', 'lcov.info'), informe, informe);
+    // La base avanza: el update de review la mergea en la rama con la fecha de hoy.
+    git(['checkout', '-q', 'develop'], c.repoRoot);
+    await writeFile(path.join(c.repoRoot, 'otro.txt'), 'de develop\n', 'utf8');
+    commitAll(c.repoRoot, 'develop avanza');
+    git(['checkout', '-q', 'feature/task-972-cob'], c.repoRoot);
+    const p = await peticion(c, 'TASK-972');
+    assert.doesNotMatch(p, /anterior al ultimo commit de la rama/);
+    assert.match(p, /- `src\/a\.mjs`: 6\n/);
+  });
+});
+
+test('review (IMP-4, MEN-4): en una peticion fragmentada cada dominio ve solo la cobertura de sus ficheros', async () => {
+  await conCobertura('', async (c) => {
+    await tareaEnCurso(c, 'TASK-971', 'feature/task-971-cob');
+    await mkdir(path.join(c.repoRoot, 'java'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, 'java', 'X.java'), 'class X {}\n', 'utf8');
+    commitAll(c.repoRoot, 'feat: java');
+    c.generar();
+    await runFinishlessReview(c, 'TASK-971');
+    const dir = path.join(c.tareasRoot, '03-en-revision', 'TASK-971', 'revision');
+    const java = await readFile(path.join(dir, 'peticion-revision-1-java-spring-reviewer.md'), 'utf8');
+    const generico = await readFile(path.join(dir, 'peticion-revision-1-code-quality-reviewer.md'), 'utf8');
+    assert.match(java, /## Cobertura de las lineas cambiadas/);
+    assert.doesNotMatch(java, /src\/a\.mjs/);
+    assert.match(java, /`java\/X\.java`/, 'el .java no esta instrumentado: va aparte');
+    assert.match(generico, /- `src\/a\.mjs`: 6\n/);
+    assert.doesNotMatch(generico, /X\.java/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
index 4e4399c..2c1cb03 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
@@ -61,6 +61,9 @@ test('lcov: un SF repetido (informes fusionados) suma: la linea se ejecuto si se
     [10, 5],
     [11, 0],
   ]);
+  // MEN-3 de la revision: en el otro orden, sobrescribir daria 0.
+  const inverso = parsearLcov('SF:a.js\nDA:10,5\nend_of_record\nSF:a.js\nDA:10,0\nend_of_record\n');
+  assert.deepEqual([...(inverso.ficheros.get('a.js') as Map<number, number>)], [[10, 5]]);
 });
 
 const informe = new Map([
@@ -87,7 +90,10 @@ test('cruce: solo cuentan las lineas cambiadas con DA; DA:n,0 es sin cubrir; sin
 
 test('cruce: la clave de ruta decide mayusculas (Windows) y un fichero sin lineas ejecutables cambiadas no cuenta', () => {
   const anadidas = new Map([['src/b.ts', [1]]]);
-  assert.deepEqual(cruzarCobertura(anadidas, informe).sinInstrumentar, ['src/b.ts']);
+  // Sin la clave sin mayusculas, src/b.ts no casa con src/B.ts: es un .ts que el informe no lista.
+  assert.deepEqual(cruzarCobertura(anadidas, informe).ficheros, [
+    { ruta: 'src/b.ts', ejecutables: 1, cubiertas: 0, sinCubrir: [1], fueraDelInforme: true },
+  ]);
   const c = cruzarCobertura(anadidas, informe, (r) => r.toLowerCase());
   assert.deepEqual(c.ficheros, [{ ruta: 'src/b.ts', ejecutables: 1, cubiertas: 0, sinCubrir: [1] }]);
   const soloComentarios = cruzarCobertura(new Map([['src/a.mjs', [7, 8]]]), informe);
@@ -96,6 +102,35 @@ test('cruce: la clave de ruta decide mayusculas (Windows) y un fichero sin linea
   assert.match(describirCruce(soloComentarios), /Ninguna linea cambiada es ejecutable/);
 });
 
+test('cruce (IMP-1/IMP-2 de la revision): un fichero de codigo que el informe no lista cuenta entero sin cubrir; uno de docs, no', () => {
+  const anadidas = new Map([
+    ['src/a.mjs', [3]],
+    ['src/nuevo.mjs', [1, 2, 4]],
+    ['docs/guia.md', [1, 2]],
+    ['Makefile', [1]],
+  ]);
+  const c = cruzarCobertura(anadidas, informe);
+  assert.deepEqual(c.ficheros, [
+    { ruta: 'src/a.mjs', ejecutables: 1, cubiertas: 1, sinCubrir: [] },
+    { ruta: 'src/nuevo.mjs', ejecutables: 3, cubiertas: 0, sinCubrir: [1, 2, 4], fueraDelInforme: true },
+  ]);
+  assert.deepEqual(c.sinInstrumentar, ['Makefile', 'docs/guia.md']);
+  assert.deepEqual([c.cubiertas, c.ejecutables], [1, 4]);
+  assert.match(describirCruce(c), /- `src\/nuevo\.mjs`: 1-2, 4 \(el informe no lo lista: ningun test lo carga\)/);
+  // Una tarea de solo docs no tiene nada que medir.
+  const docs = cruzarCobertura(new Map([['docs/guia.md', [1]]]), informe);
+  assert.equal(docs.ejecutables, 0);
+  assert.equal(cumpleUmbral(docs, 100), true);
+});
+
+test('porcentaje (MEN-2 de la revision): redondea hacia abajo, para no decir «91 % no llega a 91 %»', () => {
+  assert.equal(formatearPorcentaje((100 * 1820) / 2001), '90.9');
+  assert.equal(formatearPorcentaje(90), '90');
+  assert.equal(formatearPorcentaje((100 * 2) / 3), '66.6');
+  assert.equal(formatearPorcentaje(100), '100');
+  assert.equal(formatearPorcentaje((100 * 29) / 100), '29', 'sin el error de coma flotante');
+});
+
 test('cruce: filtrar por los ficheros de un dominio recalcula los totales', () => {
   const c = cruzarCobertura(new Map([['src/a.mjs', [3, 4]], ['src/B.ts', [1]]]), informe);
   const f = filtrarCruce(c, new Set(['src/B.ts']));
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff e4a171d0fb4d6059d2b365cf0e7947a37fcd7f07..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-074/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-074/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-074/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-074/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-074/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-074/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-074/planificacion/brainstorm/salida-brainstorm-testing-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-074/planificacion/plan-final.md                                    |    5 +
 tareas/03-en-revision/TASK-074/revision/informe-revision-1.md                                                  |   90 +++++
 tareas/03-en-revision/TASK-074/revision/peticion-revision-1.md                                                 | 1581 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-074/tarea.md                                                       |    6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-cobertura.js                             |    2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                       |   14 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/cobertura-cambios.js                                |   34 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/cobertura.js                                          |   30 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                                |   62 +++-
 16 files changed, 1790 insertions(+), 34 deletions(-)
````
