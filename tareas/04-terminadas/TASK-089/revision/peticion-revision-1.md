# Peticion de revision — TASK-089 (ronda 1)

- Tarea: TASK-089 — Evitar literales con forma de secreto en el repo y tags de version que faltan
- Rama revisada: feature/task-089-evitar-literales-con-forma-de-secreto-en
- Rama base: develop
- Commit revisado (HEAD): 66a5624532ed868bfeda6670fc8c1b089058eada
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-089 (criterios de aceptacion y plan)

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
66a5624 test(TASK-089): claves falsas troceadas en un solo helper y guardian de literales con forma de secreto
5390040 chore(TASK-089): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
index c10f4fa..2c720f9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
@@ -25,11 +25,9 @@ import {
 import { DoctorDeployCatalogoError, cargarCatalogoDeploy } from '../../src/core/doctor-deploy-catalogo.js';
 import type { InformeDeploy, ResultadoPunto } from '../../src/core/doctor-deploy.js';
 import { motivoFicheroSecreto, requirementsFijado } from '../../src/fs/sondas-deploy.js';
+import { AWS, AWS_EJEMPLO, STRIPE_LIVE as STRIPE, STRIPE_LIVE_OTRA, STRIPE_TEST_EJEMPLO } from '../helpers/claves-falsas.js';
 
 const TOTAL_PUNTOS = cargarCatalogoDeploy().puntos.length;
-
-const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
-const STRIPE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
 const b64url = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
 const jwt = (payload: unknown): string => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.firmaFirmaFirmaFirma`;
 
@@ -364,7 +362,7 @@ test('claves de ejemplo, de prueba y publicas a proposito no fallan; service_rol
   await conRepo(
     {
       ...NODE,
-      'docs/ejemplo.md': 'AKIAIOSFODNN7EXAMPLE\nsk_test_4eC39HqLyjWDarjtT1zdp7dc\n',
+      'docs/ejemplo.md': `${AWS_EJEMPLO}\n${STRIPE_TEST_EJEMPLO}\n`,
       'src/cliente.js': `const anon = "${jwt({ role: 'anon' })}";\nconst fb = "AIza${'SyA-1234567890abcdefghijklmnopqrstu'}";\n`,
     },
     async (raiz, opciones) => {
@@ -887,7 +885,7 @@ test('IMP-4: un silencio de arbol va atado a la huella del valor: otra clave nue
     assert.ok(silenciado.evidencias.some((e) => e.descripcion.startsWith('SILENCIADO')));
 
     // Una clave NUEVA del mismo patron en el MISMO fichero no queda tapada.
-    await escribir(raiz, { 'config/prod.env.js': `module.exports = { k: "${STRIPE}", otra: "sk_live_Nueva0Clave1Dist" };\n` });
+    await escribir(raiz, { 'config/prod.env.js': `module.exports = { k: "${STRIPE}", otra: "${STRIPE_LIVE_OTRA}" };\n` });
     const nueva = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol');
     assert.equal(nueva.estado, 'falla');
     assert.equal(nueva.evidencias.filter((e) => e.muestra !== undefined).length, 1);
@@ -1073,7 +1071,7 @@ test('IMP-7: un silencio con commit (sin huella) no tapa una clave NUEVA del mis
     git(['rm', '-q', 'config/prod.env.js'], raiz);
     await commit(raiz, 'quita k1');
     await escribir(raiz, {
-      'config/prod.env.js': 'k="sk_live_Nueva0Clave1Dist"\n',
+      'config/prod.env.js': `k="${STRIPE_LIVE_OTRA}"\n`,
       '.taskcode/doctor-deploy.yml': `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: config/prod.env.js\nsilenciar_1_commit: "${hash}"\nsilenciar_1_motivo: K1 rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
     });
     const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts
index acff0e7..70090d0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts
@@ -5,13 +5,20 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { buscarSecretos, enmascarar, ocultarSecretos } from '../../src/core/secretos.js';
+import {
+  AWS,
+  AWS_EJEMPLO,
+  GITHUB_TOKEN,
+  PEM_CABECERA,
+  PEM_PIE,
+  SLACK,
+  STRIPE_LIVE as STRIPE,
+  STRIPE_TEST_EJEMPLO,
+} from '../helpers/claves-falsas.js';
 
 const b64url = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
 const jwt = (payload: unknown): string => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.firmaFirmaFirmaFirma`;
 
-const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
-const STRIPE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
-
 test('detecta una clave de AWS y una sk_live_, con linea, y sin devolver el valor', () => {
   const h = buscarSecretos(`# config\nAWS=${AWS}\n\nSTRIPE="${STRIPE}"\n`);
   assert.deepEqual(h.map((x) => [x.patron, x.clase, x.linea]), [
@@ -25,7 +32,7 @@ test('detecta una clave de AWS y una sk_live_, con linea, y sin devolver el valo
 });
 
 test('las claves de ejemplo y de prueba no son secretos', () => {
-  const h = buscarSecretos('AKIAIOSFODNN7EXAMPLE\nsk_test_4eC39HqLyjWDarjtT1zdp7dc\n');
+  const h = buscarSecretos(`${AWS_EJEMPLO}\n${STRIPE_TEST_EJEMPLO}\n`);
   assert.deepEqual(h.map((x) => [x.patron, x.clase]), [['aws-access-key', 'ejemplo'], ['stripe-test', 'ejemplo']]);
 });
 
@@ -45,7 +52,7 @@ test('Firebase: la apiKey web AIza es publica', () => {
 });
 
 test('clave privada PEM, token de GitHub y de Slack', () => {
-  const t = `-----BEGIN RSA PRIVATE KEY-----\nxx\n-----END RSA PRIVATE KEY-----\nghp_${'a1B2c3D4e5'.repeat(4)}\nxoxb-1234567890-abcdefghij\n`;
+  const t = `${PEM_CABECERA}\nxx\n${PEM_PIE}\n${GITHUB_TOKEN}\n${SLACK}\n`;
   assert.deepEqual(buscarSecretos(t).map((x) => x.patron), ['clave-privada', 'github-token', 'slack-token']);
   assert.deepEqual(buscarSecretos('-----BEGIN PUBLIC KEY-----\n'), []);
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts
new file mode 100644
index 0000000..df8e30f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts
@@ -0,0 +1,192 @@
+/**
+ * TASK-089: ningun fichero versionado lleva un literal con forma de clave.
+ *
+ * El defecto que motiva este test: la proteccion de push de GitHub (secret
+ * scanning) bloqueo el push de la 0.11.0 por una clave de Stripe FALSA de un
+ * test, y hubo que reescribir el historial local. GitHub no distingue una
+ * clave falsa de una real: mira la forma. Asi que el remedio es que ninguna
+ * aparezca entera en el codigo; las de los tests se arman troceadas en
+ * test/helpers/claves-falsas.ts.
+ *
+ * Como lo comprueba: un solo `git ls-files -z` desde la raiz del repo y la
+ * lectura de cada fichero (los binarios y los que ya no estan en disco se
+ * saltan). Los patrones son propios de este test y tienen la forma de los de
+ * push protection; NO se reutiliza buscarSecretos de src/core/secretos.ts,
+ * que sirve para otra cosa (auditar repos de usuario, con clases como
+ * «ejemplo») y haria que el guardian dependiera del codigo que vigila.
+ *
+ * El mensaje de fallo da fichero, linea y patron, nunca el valor.
+ *
+ * Con su CONTRAPRUEBA: la misma funcion de escaneo sobre textos armados con
+ * las claves troceadas tiene que detectar cada patron. Sin ella, un verde no
+ * distingue «no hay literales» de «el test no mira nada».
+ *
+ * Cero dependencias: node:test, node:assert y git.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { spawnSync } from 'node:child_process';
+import { readFileSync } from 'node:fs';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { enmascarar } from '../../src/core/secretos.js';
+import {
+  AWS,
+  AWS_EJEMPLO,
+  GITHUB_TOKEN,
+  PEM_CABECERA,
+  PEM_PIE,
+  SLACK,
+  STRIPE_LIVE,
+  STRIPE_TEST_EJEMPLO,
+} from '../helpers/claves-falsas.js';
+
+// Compilado, este fichero vive en dist/test/empaquetado/: tres niveles arriba
+// esta la raiz del plugin y tres mas la del repo (igual que distribucion.test.ts).
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
+const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..', '..');
+
+/**
+ * Forma de las claves que bloquea la proteccion de push. Se erra por exceso.
+ * Sin `\b` delante a proposito: en el codigo fuente una clave suele ir justo
+ * despues de un `\n` escrito como texto, y entre esa `n` y la clave no hay
+ * limite de palabra.
+ */
+const PATRONES: ReadonlyArray<{ id: string; re: RegExp }> = [
+  { id: 'stripe-live', re: /[sr]k_live_[0-9A-Za-z]{24,}/g },
+  { id: 'stripe-test', re: /[sr]k_test_[0-9A-Za-z]{24,}/g },
+  { id: 'aws-access-key', re: /(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
+  { id: 'github-token', re: /gh[pousr]_[A-Za-z0-9]{36,}/g },
+  { id: 'github-pat', re: /github_pat_[A-Za-z0-9_]{40,}/g },
+  { id: 'slack-token', re: /xox[abprs]-[0-9A-Za-z-]{10,}/g },
+  { id: 'gitlab-token', re: /glpat-[0-9A-Za-z_-]{20,}/g },
+  { id: 'npm-token', re: /npm_[0-9A-Za-z]{36}\b/g },
+  { id: 'sendgrid', re: /SG\.[\w-]{22}\.[\w-]{43}\b/g },
+  // Solo con cuerpo: una cabecera sola (o con «xx» dentro) no es una clave.
+  { id: 'clave-privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----\s*[A-Za-z0-9+/=\r\n]{64,}/g },
+];
+
+/**
+ * Valores exactos que se toleran, cada uno con su motivo. Nunca rutas ni
+ * prefijos: una entrada asi podria tapar una clave de verdad.
+ */
+const PERMITIDOS: ReadonlyMap<string, string> = new Map([
+  [AWS_EJEMPLO, 'ejemplo de la documentacion de AWS; GitHub no lo bloquea'],
+  [STRIPE_TEST_EJEMPLO, 'ejemplo publico de Stripe; esta en origin desde TASK-066 sin bloqueo (informes de revision historicos)'],
+  [SLACK, 'token corto inventado; esta en origin desde TASK-066 sin bloqueo (informe de revision historico)'],
+]);
+
+interface Hallazgo {
+  fichero: string;
+  linea: number;
+  patron: string;
+  muestra: string;
+}
+
+function escanear(fichero: string, texto: string): Hallazgo[] {
+  const hallazgos: Hallazgo[] = [];
+  for (const { id, re } of PATRONES) {
+    re.lastIndex = 0;
+    for (const m of texto.matchAll(re)) {
+      if (PERMITIDOS.has(m[0])) continue;
+      const linea = texto.slice(0, m.index).split('\n').length;
+      hallazgos.push({ fichero, linea, patron: id, muestra: enmascarar(m[0]) });
+    }
+  }
+  return hallazgos;
+}
+
+function esBinario(buf: Buffer): boolean {
+  return buf.subarray(0, 8000).includes(0);
+}
+
+function ficherosVersionados(): string[] | null {
+  const r = spawnSync('git', ['ls-files', '-z'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
+  if (r.status !== 0) return null;
+  return r.stdout.split('\0').filter((f) => f !== '');
+}
+
+test('ningun fichero versionado lleva un literal con forma de clave', (t) => {
+  const ficheros = ficherosVersionados();
+  if (ficheros === null) return t.skip('REPO_ROOT no es un repo git');
+  assert.ok(ficheros.length > 100, `git ls-files devolvio solo ${ficheros.length} ficheros: el test no esta mirando el repo`);
+
+  const hallazgos: Hallazgo[] = [];
+  let leidos = 0;
+  for (const rel of ficheros) {
+    let buf: Buffer;
+    try {
+      buf = readFileSync(path.join(REPO_ROOT, rel));
+    } catch {
+      continue; // borrado en el working tree, submodulo o directorio
+    }
+    if (esBinario(buf)) continue;
+    leidos++;
+    hallazgos.push(...escanear(rel, buf.toString('utf8')));
+  }
+  assert.ok(leidos > 100, `solo se leyeron ${leidos} ficheros de texto`);
+  assert.deepEqual(
+    hallazgos.map((h) => `${h.fichero}:${h.linea} ${h.patron} ${h.muestra}`),
+    [],
+    'hay literales con forma de clave: trocealos (ver test/helpers/claves-falsas.ts)'
+  );
+});
+
+test('contraprueba: el escaneo detecta cada patron con fichero y linea, sin mostrar el valor', () => {
+  const npm = 'npm_' + 'A1b2C3d4E5'.repeat(3) + 'f6G7h8';
+  const gitlab = 'glpat-' + 'Ab12Cd34Ef56Gh78Ij90';
+  const pat = 'github_pat_' + '11ABCDEFG0'.repeat(5);
+  const sendgrid = 'SG.' + 'a'.repeat(22) + '.' + 'b'.repeat(43);
+  const stripeTest = 'sk_test_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
+  const slack = 'xoxp' + '-9876543210-zyxwvutsrq';
+  const cuerpo = 'MIIEowIBAAKCAQEA'.repeat(5);
+  const texto = [
+    `STRIPE=${STRIPE_LIVE}`,
+    `AWS=${AWS}`,
+    GITHUB_TOKEN,
+    // Pegada a un «\n» escrito como texto, como en un literal de codigo.
+    `'a\\n${slack}'`,
+    npm,
+    gitlab,
+    pat,
+    sendgrid,
+    stripeTest,
+    `${PEM_CABECERA}\n${cuerpo}\n${PEM_PIE}`,
+  ].join('\n');
+
+  const h = escanear('x/y.txt', texto);
+  assert.deepEqual(
+    h.map((x) => [x.patron, x.linea]).sort(),
+    [
+      ['aws-access-key', 2],
+      ['clave-privada', 10],
+      ['github-pat', 7],
+      ['github-token', 3],
+      ['gitlab-token', 6],
+      ['npm-token', 5],
+      ['sendgrid', 8],
+      ['slack-token', 4],
+      ['stripe-live', 1],
+      ['stripe-test', 9],
+    ].sort()
+  );
+  for (const x of h) assert.equal(x.fichero, 'x/y.txt');
+  const informe = JSON.stringify(h);
+  for (const valor of [STRIPE_LIVE, AWS, GITHUB_TOKEN, slack, npm, gitlab, pat, sendgrid, stripeTest, cuerpo]) {
+    assert.ok(!informe.includes(valor.slice(6)), 'el valor crudo no puede salir en el informe');
+  }
+});
+
+test('contraprueba: lo permitido y lo que no es clave no se marca', () => {
+  const texto = [
+    AWS_EJEMPLO,
+    STRIPE_TEST_EJEMPLO,
+    SLACK,
+    `${PEM_CABECERA}\nxx\n${PEM_PIE}`,
+    '-----BEGIN PUBLIC KEY-----',
+    'sk_live_corta',
+    "re: /sk_live_[0-9A-Za-z]{24,}/",
+  ].join('\n');
+  assert.deepEqual(escanear('z.txt', texto), []);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/claves-falsas.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/claves-falsas.ts
new file mode 100644
index 0000000..29dd06e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/claves-falsas.ts
@@ -0,0 +1,32 @@
+/**
+ * TASK-089: claves falsas de los tests, en un solo sitio y siempre troceadas.
+ *
+ * La proteccion de push de GitHub (secret scanning) bloquea un push si el
+ * texto de un fichero casa con la forma de una clave real, aunque sea falsa.
+ * Por eso ninguna de estas constantes aparece entera en el codigo fuente: se
+ * arman por concatenacion y solo existen enteras en tiempo de ejecucion.
+ * El test test/empaquetado/sin-literales-secretos.test.ts vigila que nadie
+ * vuelva a escribir una entera en un fichero versionado.
+ *
+ * Sin imports a proposito: lo importan los tests de core (test:rapido) sin
+ * arrastrar los comandos.
+ */
+
+/** Clave secreta de Stripe en produccion. */
+export const STRIPE_LIVE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
+/** Otra distinta, para los casos que necesitan dos claves. */
+export const STRIPE_LIVE_OTRA = 'sk_live_' + 'Nueva0Clave1Dist';
+/** Clave de prueba de ejemplo de la documentacion publica de Stripe. */
+export const STRIPE_TEST_EJEMPLO = 'sk_test_' + '4eC39HqLyjWDarjtT1zdp7dc';
+/** Access key id de AWS. */
+export const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
+/** Access key id de ejemplo de la documentacion de AWS. */
+export const AWS_EJEMPLO = 'AKIA' + 'IOSFODNN7EXAMPLE';
+/** Cabecera de una clave privada RSA en PEM. */
+export const PEM_CABECERA = '-----BEGIN RSA ' + 'PRIVATE KEY-----';
+/** Pie de la misma. */
+export const PEM_PIE = '-----END RSA ' + 'PRIVATE KEY-----';
+/** Token de bot de Slack. */
+export const SLACK = 'xoxb' + '-1234567890-abcdefghij';
+/** Token personal clasico de GitHub. */
+export const GITHUB_TOKEN = 'ghp_' + 'a1B2c3D4e5'.repeat(4);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/deploy-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/deploy-fixtures.ts
index d464099..dd3e8dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/deploy-fixtures.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/deploy-fixtures.ts
@@ -11,8 +11,7 @@ import { spawnSync } from 'node:child_process';
 import { runDoctorDeployCommand, runDoctorDeployCompleto, type DoctorDeployResult } from '../../src/commands/doctor-deploy.js';
 import type { InformeDeploy, ResultadoPunto } from '../../src/core/doctor-deploy.js';
 
-export const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
-export const STRIPE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
+export { AWS, STRIPE_LIVE as STRIPE } from './claves-falsas.js';
 
 export function git(args: string[], cwd: string): string {
   const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-089/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-089/planificacion/plan-final.md                 | 2 +-
 tareas/{01-en-diseno => 02-en-curso}/TASK-089/tarea.md                                    | 3 ++-
 3 files changed, 3 insertions(+), 2 deletions(-)
````
