# Peticion de revision — TASK-088 (ronda 1)

- Tarea: TASK-088 — taskctl doctor avisa si falta comando_verificacion con tests detectables
- Rama revisada: feature/task-088-taskctl-doctor-avisa-si-falta-comando-ve
- Rama base: develop
- Commit revisado (HEAD): 62c408b9b346514cb074c6a521f2eea25ee50d5e
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-088 (criterios de aceptacion y plan)

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
62c408b build(TASK-088): dist compilado
17b923f feat(TASK-088): doctor propone comando_verificacion si detecta tests
a8e7495 chore(TASK-088): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index d878e01..5219e0d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -650,9 +650,20 @@ algún error (los avisos no cuentan). Comprueba:
 - **Config**: `.taskcode/config.yml` con el mismo validador que el resto de comandos
   (un valor inválido es error con su mensaje; una clave desconocida, aviso).
 - **Verificación**: si la config declara `comando_verificacion` (ver abajo), `ok`
-  con el comando y su timeout; sin él, `omitida` con el arreglo en la misma línea.
-  No es un aviso: un proyecto sin frenos de verificación no está mal configurado.
-  `doctor` no ejecuta el comando.
+  con el comando y su timeout. Sin él, depende de si el proyecto tiene tests en
+  su raíz:
+  - **Con tests detectables**: `aviso`, con el comando propuesto listo para pegar
+    en la config. Los frenos no actúan aunque haya con qué verificar. Detecta
+    `package.json` con script `test` propio (`pnpm`, `yarn` o `npm` según el
+    fichero de bloqueo; el `test` que deja `npm init` no cuenta), `Cargo.toml`,
+    `pom.xml` y `build.gradle(.kts)` (con `mvnw`/`gradlew` si existen),
+    `*.csproj`/`*.sln`, `go.mod` y `pyproject.toml` que mencione pytest. Si hay
+    varios, propone sus comandos encadenados con `&&`.
+  - **Sin tests detectables**: `omitida`, con el arreglo en la misma línea. Un
+    proyecto sin tests no está mal configurado.
+
+  Solo mira la raíz (desde ahí se ejecuta el comando): un manifiesto en una
+  subcarpeta no cuenta. `doctor` no ejecuta el comando ni escribe la config.
 - **Tareas**: cada `tarea.md` se lee y valida, y su `estado` tiene que ser el de
   su carpeta. Son errores, con el ID: un ID en dos carpetas, un `tarea.md` ilegible
   (con la ruta y la causa), una carpeta de tarea sin `tarea.md`, un estado distinto
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index aa9e808..1b5d3e5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -44,6 +44,8 @@ import {
   type Comprobacion,
 } from '../core/doctor.js';
 import { resolverConfigConAvisos, CONFIG_DEFAULTS, type TaskcodeConfig } from '../core/config.js';
+import { comandoPropuesto, type ComandoTests } from '../core/comando-tests.js';
+import { detectarComandosTests } from '../fs/deteccion-tests.js';
 import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
 import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
 import { parseTareaFile } from '../core/tarea-file.js';
@@ -395,13 +397,36 @@ function comprobarConfig(cwd: string): { cs: Comprobacion[]; cfg: TaskcodeConfig
 
 /**
  * TASK-070: si el proyecto declara como se verifica. Solo informa: no ejecuta
- * el comando (eso es de los frenos). Sin la clave es `omitida` y no `aviso`:
- * un proyecto sin frenos no esta mal configurado, y un aviso permanente en
- * cada repo que no los use dejaria de leerse. El arreglo va en el mensaje.
+ * el comando (eso es de los frenos).
+ *
+ * Sin la clave, depende de si el proyecto tiene tests (TASK-088, que matiza a
+ * proposito la decision de TASK-070):
+ * - Sin tests detectables en la raiz: `omitida`, como en TASK-070. Un proyecto
+ *   sin tests no esta mal configurado, y un aviso permanente en cada repo que
+ *   no los use dejaria de leerse. El arreglo va en el mensaje.
+ * - Con tests detectables: `aviso` con el comando propuesto. Ahi si esta mal
+ *   configurado: los frenos (hook Stop, puerta de finish, guardian de merges)
+ *   no actuan aunque haya con que verificar.
+ *
+ * `detectar` solo se llama cuando falta la clave: la lectura de disco no se
+ * paga en los proyectos ya configurados.
  */
-export function comprobarVerificacion(cfg: TaskcodeConfig | null): Comprobacion {
+export function comprobarVerificacion(
+  cfg: TaskcodeConfig | null,
+  detectar: () => readonly ComandoTests[] = () => []
+): Comprobacion {
   if (cfg === null) return omitida('verificacion', 'config invalida: no se sabe como se verifica el proyecto (ver config)');
   if (cfg.comando_verificacion === null) {
+    const detectados = detectar();
+    const propuesto = comandoPropuesto(detectados);
+    if (propuesto !== null) {
+      return aviso(
+        'verificacion',
+        `sin comando_verificacion y el proyecto tiene tests (${detectados.map((d) => d.motivo).join(', ')}): ` +
+          'los frenos de verificacion no actuan',
+        `Declara en .taskcode/config.yml: comando_verificacion: "${propuesto}"`
+      );
+    }
     return omitida(
       'verificacion',
       'sin comando_verificacion: los frenos de verificacion no actuan. Para activarlos, declara en ' +
@@ -671,7 +696,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   cs.push(...envolver('workspace', () => comprobarWorkspace(cwd, repo, deps.timeoutGitMs ?? TIMEOUT_GIT_MS)));
 
   cs.push(...csConfig);
-  cs.push(...envolver('verificacion', () => comprobarVerificacion(cfg)));
+  cs.push(...envolver('verificacion', () => comprobarVerificacion(cfg, () => detectarComandosTests(cwd))));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
   cs.push(
     ...envolver('plataforma', () =>
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-tests.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-tests.ts
new file mode 100644
index 0000000..1628025
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-tests.ts
@@ -0,0 +1,108 @@
+/**
+ * Propuesta de `comando_verificacion` a partir de los manifiestos de la raiz
+ * del proyecto (TASK-088). Nucleo puro: no toca disco; la lectura esta en
+ * fs/deteccion-tests.ts y quien decide el nivel del aviso es `taskctl doctor`.
+ *
+ * Decisiones (plan de TASK-088, Carlos 2026-11-07):
+ *
+ * - Solo la raiz: `comando_verificacion` se ejecuta desde ahi, asi que un
+ *   manifiesto en una subcarpeta propondria un comando que no funciona.
+ * - Node: `pnpm` / `yarn` / `npm` segun el fichero de bloqueo. Solo cuenta un
+ *   `scripts.test` propio: el que deja `npm init` (falla siempre) no es un test.
+ * - Maven y Gradle: el wrapper si existe, con la forma de la plataforma (el
+ *   comando lo lanza cmd.exe en Windows y sh en el resto).
+ * - Python: `pyproject.toml` solo cuenta si menciona pytest.
+ * - Varios manifiestos: se encadenan con `&&` en el orden de REGLAS (vale en
+ *   cmd.exe y en sh).
+ */
+
+export interface EntradaDeteccionTests {
+  /** Nombres de los ficheros de la raiz (sin rutas). */
+  ficherosRaiz: readonly string[];
+  /** Contenido de `package.json`, o null si no hay o no se pudo leer. */
+  packageJson: string | null;
+  /** Contenido de `pyproject.toml`, o null si no hay o no se pudo leer. */
+  pyproject: string | null;
+  plataforma: NodeJS.Platform;
+}
+
+export interface ComandoTests {
+  comando: string;
+  /** Por que se propone, para el mensaje (`Cargo.toml`, `package.json con script "test"`...). */
+  motivo: string;
+}
+
+/** Lo que escribe `npm init` en `scripts.test`: no es un test del proyecto. */
+const TEST_POR_DEFECTO_NPM = /no test specified/i;
+
+/** true si el `package.json` declara un script `test` propio. */
+export function tieneScriptTest(packageJson: string | null): boolean {
+  if (packageJson === null) return false;
+  let datos: unknown;
+  try {
+    datos = JSON.parse(packageJson);
+  } catch {
+    return false;
+  }
+  if (typeof datos !== 'object' || datos === null) return false;
+  const scripts = (datos as { scripts?: unknown }).scripts;
+  if (typeof scripts !== 'object' || scripts === null) return false;
+  const test = (scripts as { test?: unknown }).test;
+  return typeof test === 'string' && test.trim() !== '' && !TEST_POR_DEFECTO_NPM.test(test);
+}
+
+function wrapper(nombre: string, hay: (f: string) => boolean, plataforma: NodeJS.Platform): string | null {
+  if (plataforma === 'win32') return hay(`${nombre}.cmd`) || hay(`${nombre}.bat`) ? nombre : null;
+  return hay(nombre) ? `./${nombre}` : null;
+}
+
+type Regla = (e: EntradaDeteccionTests, hay: (f: string) => boolean, conExt: (ext: string) => boolean) => ComandoTests | null;
+
+const REGLAS: readonly Regla[] = [
+  (e, hay) => {
+    if (!hay('package.json') || !tieneScriptTest(e.packageJson)) return null;
+    const gestor = hay('pnpm-lock.yaml') ? 'pnpm' : hay('yarn.lock') ? 'yarn' : 'npm';
+    return { comando: `${gestor} test`, motivo: 'package.json con script "test"' };
+  },
+  (_e, hay) => (hay('cargo.toml') ? { comando: 'cargo test', motivo: 'Cargo.toml' } : null),
+  (e, hay) => {
+    if (!hay('pom.xml')) return null;
+    return { comando: `${wrapper('mvnw', hay, e.plataforma) ?? 'mvn'} test`, motivo: 'pom.xml' };
+  },
+  (e, hay) => {
+    const fichero = hay('build.gradle.kts') ? 'build.gradle.kts' : hay('build.gradle') ? 'build.gradle' : null;
+    if (fichero === null) return null;
+    return { comando: `${wrapper('gradlew', hay, e.plataforma) ?? 'gradle'} test`, motivo: fichero };
+  },
+  (_e, _hay, conExt) => {
+    const sln = conExt('.sln');
+    if (!sln && !conExt('.csproj')) return null;
+    return { comando: 'dotnet test', motivo: sln ? 'solucion .sln' : 'proyecto .csproj' };
+  },
+  (_e, hay) => (hay('go.mod') ? { comando: 'go test ./...', motivo: 'go.mod' } : null),
+  (e, hay) =>
+    hay('pyproject.toml') && e.pyproject !== null && /pytest/i.test(e.pyproject)
+      ? { comando: 'python -m pytest', motivo: 'pyproject.toml con pytest' }
+      : null,
+];
+
+/**
+ * Los comandos de tests que se deducen de la raiz, en el orden de REGLAS.
+ * Sin distinguir mayusculas en los nombres (NTFS no las distingue).
+ */
+export function proponerComandosTests(e: EntradaDeteccionTests): ComandoTests[] {
+  const nombres = new Set(e.ficherosRaiz.map((f) => f.toLowerCase()));
+  const hay = (f: string): boolean => nombres.has(f.toLowerCase());
+  const conExt = (ext: string): boolean => [...nombres].some((n) => n.endsWith(ext) && n.length > ext.length);
+  const r: ComandoTests[] = [];
+  for (const regla of REGLAS) {
+    const c = regla(e, hay, conExt);
+    if (c !== null) r.push(c);
+  }
+  return r;
+}
+
+/** El comando a proponer: todos encadenados con `&&`; null si no hay ninguno. */
+export function comandoPropuesto(cs: readonly ComandoTests[]): string | null {
+  return cs.length === 0 ? null : cs.map((c) => c.comando).join(' && ');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
new file mode 100644
index 0000000..508f208
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
@@ -0,0 +1,56 @@
+/**
+ * Lectura de la raiz del proyecto para proponer `comando_verificacion`
+ * (TASK-088). Fina a proposito: lista la raiz (sin recursion) y lee, como
+ * mucho, `package.json` y `pyproject.toml`. Las reglas estan en
+ * core/comando-tests.ts.
+ *
+ * Falla en cerrado hacia `omitida`: si algo no se puede leer, no se detecta
+ * nada y doctor dice lo mismo que sin tests.
+ */
+import { readdirSync, readFileSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { proponerComandosTests, type ComandoTests } from '../core/comando-tests.js';
+import { MAX_BYTES_MARCADOR_APLICACION } from './deteccion-app.js';
+
+function ficherosDeRaiz(cwd: string): string[] {
+  const r: string[] = [];
+  for (const d of readdirSync(cwd, { withFileTypes: true })) {
+    if (d.isFile()) r.push(d.name);
+    else if (d.isSymbolicLink()) {
+      try {
+        if (statSync(path.join(cwd, d.name)).isFile()) r.push(d.name);
+      } catch {
+        // enlace roto: no cuenta
+      }
+    }
+  }
+  return r;
+}
+
+function leerAcotado(cwd: string, ficheros: readonly string[], nombre: string): string | null {
+  const real = ficheros.find((f) => f.toLowerCase() === nombre);
+  if (real === undefined) return null;
+  try {
+    const ruta = path.join(cwd, real);
+    if (statSync(ruta).size > MAX_BYTES_MARCADOR_APLICACION) return null;
+    return readFileSync(ruta, 'utf8');
+  } catch {
+    return null;
+  }
+}
+
+/** Los comandos de tests que se deducen de la raiz de `cwd`; vacio si no se puede leer. */
+export function detectarComandosTests(cwd: string, plataforma: NodeJS.Platform = process.platform): ComandoTests[] {
+  let ficheros: string[];
+  try {
+    ficheros = ficherosDeRaiz(cwd);
+  } catch {
+    return [];
+  }
+  return proponerComandosTests({
+    ficherosRaiz: ficheros,
+    packageJson: leerAcotado(cwd, ficheros, 'package.json'),
+    pyproject: leerAcotado(cwd, ficheros, 'pyproject.toml'),
+    plataforma,
+  });
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
index 1e281c0..485ebb1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
@@ -327,6 +327,100 @@ test('verificacion (TASK-070): con comando_verificacion, ok con el comando y el
   });
 });
 
+/** Escribe ficheros en el repo y los commitea (el workspace queda limpio). */
+async function ficheros(repoRoot: string, fs: Record<string, string>): Promise<void> {
+  for (const [rel, contenido] of Object.entries(fs)) {
+    await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
+    await writeFile(path.join(repoRoot, rel), contenido, 'utf8');
+  }
+  commitAll(repoRoot, 'manifiestos');
+}
+
+const PKG_CON_TEST = JSON.stringify({ name: 'x', scripts: { test: 'node --test' } });
+const WIN = process.platform === 'win32';
+
+const CASOS_TASK_088: { tipo: string; fs: Record<string, string>; comando: string }[] = [
+  { tipo: 'Node con npm', fs: { 'package.json': PKG_CON_TEST }, comando: 'npm test' },
+  { tipo: 'Node con pnpm', fs: { 'package.json': PKG_CON_TEST, 'pnpm-lock.yaml': '' }, comando: 'pnpm test' },
+  { tipo: 'Node con yarn', fs: { 'package.json': PKG_CON_TEST, 'yarn.lock': '' }, comando: 'yarn test' },
+  { tipo: 'Rust', fs: { 'Cargo.toml': '[package]\nname = "x"\n' }, comando: 'cargo test' },
+  { tipo: 'Maven', fs: { 'pom.xml': '<project/>\n' }, comando: 'mvn test' },
+  {
+    tipo: 'Maven con wrapper',
+    fs: { 'pom.xml': '<project/>\n', mvnw: '#!/bin/sh\n', 'mvnw.cmd': '@echo off\n' },
+    comando: WIN ? 'mvnw test' : './mvnw test',
+  },
+  { tipo: 'Gradle', fs: { 'build.gradle.kts': '\n' }, comando: 'gradle test' },
+  { tipo: '.NET con .csproj', fs: { 'App.csproj': '<Project/>\n' }, comando: 'dotnet test' },
+  { tipo: '.NET con .sln', fs: { 'App.sln': '\n' }, comando: 'dotnet test' },
+  { tipo: 'Go', fs: { 'go.mod': 'module x\n' }, comando: 'go test ./...' },
+  { tipo: 'Python con pytest', fs: { 'pyproject.toml': '[tool.pytest.ini_options]\n' }, comando: 'python -m pytest' },
+  {
+    tipo: 'Tauri (Node + Rust)',
+    fs: { 'package.json': PKG_CON_TEST, 'Cargo.toml': '[package]\n' },
+    comando: 'npm test && cargo test',
+  },
+];
+
+for (const caso of CASOS_TASK_088) {
+  test(`verificacion (TASK-088): sin comando_verificacion y con tests (${caso.tipo}), aviso con el comando propuesto`, async () => {
+    await conRepo(async (repoRoot) => {
+      await ficheros(repoRoot, caso.fs);
+      const r = doctor(repoRoot);
+      const c = por(r.comprobaciones, 'verificacion');
+      assert.equal(c.nivel, 'aviso', niveles(r.comprobaciones));
+      assert.match(c.mensaje, /sin comando_verificacion y el proyecto tiene tests/);
+      assert.equal(c.arreglo, `Declara en .taskcode/config.yml: comando_verificacion: "${caso.comando}"`);
+      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+    });
+  });
+}
+
+test('verificacion (TASK-088): manifiestos que no son tests, o en una subcarpeta, siguen en omitida', async () => {
+  await conRepo(async (repoRoot) => {
+    await ficheros(repoRoot, {
+      'package.json': JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } }),
+      'pyproject.toml': '[project]\nname = "x"\n',
+      'sub/Cargo.toml': '[package]\n',
+      'otro/pom.xml': '<project/>\n',
+    });
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'verificacion');
+    assert.equal(c.nivel, 'omitida', c.mensaje);
+    assert.match(c.mensaje, /declara en \.taskcode\/config\.yml: comando_verificacion: "<tu comando de tests>"/);
+  });
+});
+
+test('verificacion (TASK-088): con la clave declarada, ok aunque haya manifiestos', async () => {
+  await conRepo(async (repoRoot) => {
+    await ficheros(repoRoot, { 'Cargo.toml': '[package]\n' });
+    await config(repoRoot, 'comando_verificacion: "cargo test --all"\n');
+    const c = por(doctor(repoRoot).comprobaciones, 'verificacion');
+    assert.equal(c.nivel, 'ok');
+    assert.match(c.mensaje, /cargo test --all/);
+  });
+});
+
+test('verificacion (TASK-088): con la config rota, omitida aunque haya manifiestos', async () => {
+  await conRepo(async (repoRoot) => {
+    await ficheros(repoRoot, { 'Cargo.toml': '[package]\n' });
+    await config(repoRoot, 'timeout_verificacion: 0\n');
+    assert.equal(por(doctor(repoRoot).comprobaciones, 'verificacion').nivel, 'omitida');
+  });
+});
+
+test('verificacion (TASK-088): por el CLI con --json, el aviso sale con su arreglo y codigo 0', async () => {
+  await conRepo(async (repoRoot) => {
+    await ficheros(repoRoot, { 'go.mod': 'module x\n' });
+    const r = cli(repoRoot, ['doctor', '--json']);
+    const json = JSON.parse(r.stdout) as { comprobaciones: Comprobacion[] };
+    const c = por(json.comprobaciones, 'verificacion');
+    assert.equal(c.nivel, 'aviso');
+    assert.equal(c.arreglo, 'Declara en .taskcode/config.yml: comando_verificacion: "go test ./..."');
+    assert.equal(r.status, 0, r.stdout);
+  });
+});
+
 test('verificacion (TASK-070): con la config rota, omitida; un timeout invalido es error de config', async () => {
   await conRepo(async (repoRoot) => {
     await config(repoRoot, 'comando_verificacion: npm test\ntimeout_verificacion: 0\n');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/comando-tests.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/comando-tests.test.ts
new file mode 100644
index 0000000..3cef373
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/comando-tests.test.ts
@@ -0,0 +1,74 @@
+/**
+ * Reglas de la propuesta de comando_verificacion (TASK-088). Sin disco.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { comandoPropuesto, proponerComandosTests, tieneScriptTest, type EntradaDeteccionTests } from '../../src/core/comando-tests.js';
+
+function entrada(ficheros: string[], extra: Partial<EntradaDeteccionTests> = {}): EntradaDeteccionTests {
+  return { ficherosRaiz: ficheros, packageJson: null, pyproject: null, plataforma: 'linux', ...extra };
+}
+
+const PKG_CON_TEST = JSON.stringify({ scripts: { test: 'node --test' } });
+
+function comandos(e: EntradaDeteccionTests): string[] {
+  return proponerComandosTests(e).map((c) => c.comando);
+}
+
+test('package.json: solo cuenta un scripts.test propio', () => {
+  assert.equal(tieneScriptTest(PKG_CON_TEST), true);
+  assert.equal(tieneScriptTest(JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } })), false);
+  assert.equal(tieneScriptTest(JSON.stringify({ scripts: { build: 'tsc' } })), false);
+  assert.equal(tieneScriptTest(JSON.stringify({ scripts: { test: '  ' } })), false);
+  assert.equal(tieneScriptTest(JSON.stringify({ name: 'x' })), false);
+  assert.equal(tieneScriptTest('{ roto'), false);
+  assert.equal(tieneScriptTest('null'), false);
+  assert.equal(tieneScriptTest(null), false);
+});
+
+test('Node: el gestor sale del fichero de bloqueo', () => {
+  assert.deepEqual(comandos(entrada(['package.json'], { packageJson: PKG_CON_TEST })), ['npm test']);
+  assert.deepEqual(comandos(entrada(['package.json', 'package-lock.json'], { packageJson: PKG_CON_TEST })), ['npm test']);
+  assert.deepEqual(comandos(entrada(['package.json', 'pnpm-lock.yaml'], { packageJson: PKG_CON_TEST })), ['pnpm test']);
+  assert.deepEqual(comandos(entrada(['package.json', 'yarn.lock'], { packageJson: PKG_CON_TEST })), ['yarn test']);
+  assert.deepEqual(comandos(entrada(['package.json'], { packageJson: '{"scripts":{}}' })), []);
+});
+
+test('Rust, Go y .NET', () => {
+  assert.deepEqual(comandos(entrada(['Cargo.toml'])), ['cargo test']);
+  assert.deepEqual(comandos(entrada(['go.mod'])), ['go test ./...']);
+  assert.deepEqual(comandos(entrada(['App.csproj'])), ['dotnet test']);
+  assert.deepEqual(comandos(entrada(['X.sln', 'App.csproj'])), ['dotnet test']);
+  assert.equal(proponerComandosTests(entrada(['X.sln']))[0]?.motivo, 'solucion .sln');
+  // Un fichero que se llama literalmente ".csproj" no es un proyecto.
+  assert.deepEqual(comandos(entrada(['.csproj'])), []);
+});
+
+test('Maven y Gradle: el wrapper si existe, con la forma de la plataforma', () => {
+  assert.deepEqual(comandos(entrada(['pom.xml'])), ['mvn test']);
+  assert.deepEqual(comandos(entrada(['pom.xml', 'mvnw', 'mvnw.cmd'])), ['./mvnw test']);
+  assert.deepEqual(comandos(entrada(['pom.xml', 'mvnw', 'mvnw.cmd'], { plataforma: 'win32' })), ['mvnw test']);
+  // En Windows, sin mvnw.cmd el wrapper de sh no sirve.
+  assert.deepEqual(comandos(entrada(['pom.xml', 'mvnw'], { plataforma: 'win32' })), ['mvn test']);
+  assert.deepEqual(comandos(entrada(['build.gradle'])), ['gradle test']);
+  assert.deepEqual(comandos(entrada(['build.gradle.kts', 'gradlew', 'gradlew.bat'])), ['./gradlew test']);
+  assert.deepEqual(comandos(entrada(['build.gradle.kts', 'gradlew', 'gradlew.bat'], { plataforma: 'win32' })), ['gradlew test']);
+});
+
+test('Python: pyproject.toml solo cuenta si menciona pytest', () => {
+  assert.deepEqual(comandos(entrada(['pyproject.toml'], { pyproject: '[tool.pytest.ini_options]\n' })), ['python -m pytest']);
+  assert.deepEqual(comandos(entrada(['pyproject.toml'], { pyproject: '[project]\nname = "x"\n' })), []);
+  assert.deepEqual(comandos(entrada(['pyproject.toml'])), []);
+});
+
+test('sin distinguir mayusculas en los nombres', () => {
+  assert.deepEqual(comandos(entrada(['CARGO.TOML'])), ['cargo test']);
+  assert.deepEqual(comandos(entrada(['App.CSPROJ'])), ['dotnet test']);
+});
+
+test('sin manifiestos, nada; con varios, se encadenan con && en orden fijo', () => {
+  assert.deepEqual(comandos(entrada(['README.md'])), []);
+  assert.equal(comandoPropuesto([]), null);
+  const cs = proponerComandosTests(entrada(['Cargo.toml', 'package.json', 'pnpm-lock.yaml'], { packageJson: PKG_CON_TEST }));
+  assert.equal(comandoPropuesto(cs), 'pnpm test && cargo test');
+});
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-088/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-088/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-088/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                  | 28 +++++++++++++++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-tests.js               | 93 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/deteccion-tests.js               | 60 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 6 files changed, 178 insertions(+), 6 deletions(-)
````
