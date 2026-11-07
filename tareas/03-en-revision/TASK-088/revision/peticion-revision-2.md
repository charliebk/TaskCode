# Peticion de revision — TASK-088 (ronda 2)

- Tarea: TASK-088 — taskctl doctor avisa si falta comando_verificacion con tests detectables
- Rama revisada: feature/task-088-taskctl-doctor-avisa-si-falta-comando-ve
- Rama base: develop
- Commit revisado (HEAD): 44144f1dad236585bb13e0a6eb01b8a1e520475d
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-088 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 62c408b9b346514cb074c6a521f2eea25ee50d5e (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | src/fs/deteccion-tests.ts:35-42 | informe-revision-1.md |
| MEN-2 | MENOR | abierto | test/commands/doctor.test.ts:347-358; src/commands/doctor.ts:~420 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/fs/deteccion-tests.ts:20-27, 42-43 | informe-revision-1.md |

## Commits a revisar (git log 62c408b9b346514cb074c6a521f2eea25ee50d5e..HEAD)

````
44144f1 build(TASK-088): dist de las correcciones
d029020 fix(TASK-088): correcciones de la ronda 1 (MEN-1, MEN-2, MEN-3)
3436d5d chore(TASK-088): veredicto ronda 1 (cambios-solicitados)
fd7ab80 chore(TASK-088): coste revision +2844003 tokens (1 agente)
dd06c9d docs(TASK-088): informe de revision ronda 1
2f55583 chore(TASK-088): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 62c408b9b346514cb074c6a521f2eea25ee50d5e..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
index 508f208..5cc3d92 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
@@ -33,7 +33,8 @@ function leerAcotado(cwd: string, ficheros: readonly string[], nombre: string):
   try {
     const ruta = path.join(cwd, real);
     if (statSync(ruta).size > MAX_BYTES_MARCADOR_APLICACION) return null;
-    return readFileSync(ruta, 'utf8');
+    // Sin el BOM: `JSON.parse` lo rechaza y en Windows es habitual (Out-File de PowerShell 5.1).
+    return readFileSync(ruta, 'utf8').replace(/^﻿/, '');
   } catch {
     return null;
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
index 485ebb1..f54d29e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
@@ -339,26 +339,37 @@ async function ficheros(repoRoot: string, fs: Record<string, string>): Promise<v
 const PKG_CON_TEST = JSON.stringify({ name: 'x', scripts: { test: 'node --test' } });
 const WIN = process.platform === 'win32';
 
-const CASOS_TASK_088: { tipo: string; fs: Record<string, string>; comando: string }[] = [
-  { tipo: 'Node con npm', fs: { 'package.json': PKG_CON_TEST }, comando: 'npm test' },
-  { tipo: 'Node con pnpm', fs: { 'package.json': PKG_CON_TEST, 'pnpm-lock.yaml': '' }, comando: 'pnpm test' },
-  { tipo: 'Node con yarn', fs: { 'package.json': PKG_CON_TEST, 'yarn.lock': '' }, comando: 'yarn test' },
-  { tipo: 'Rust', fs: { 'Cargo.toml': '[package]\nname = "x"\n' }, comando: 'cargo test' },
-  { tipo: 'Maven', fs: { 'pom.xml': '<project/>\n' }, comando: 'mvn test' },
+const PKG = 'package.json con script "test"';
+
+const CASOS_TASK_088: { tipo: string; fs: Record<string, string>; comando: string; motivo: string }[] = [
+  { tipo: 'Node con npm', fs: { 'package.json': PKG_CON_TEST }, comando: 'npm test', motivo: PKG },
+  { tipo: 'Node con pnpm', fs: { 'package.json': PKG_CON_TEST, 'pnpm-lock.yaml': '' }, comando: 'pnpm test', motivo: PKG },
+  { tipo: 'Node con yarn', fs: { 'package.json': PKG_CON_TEST, 'yarn.lock': '' }, comando: 'yarn test', motivo: PKG },
+  // MEN-1 de la ronda 1: el BOM de PowerShell 5.1 no impide detectarlo.
+  { tipo: 'Node con BOM', fs: { 'package.json': `﻿${PKG_CON_TEST}` }, comando: 'npm test', motivo: PKG },
+  { tipo: 'Rust', fs: { 'Cargo.toml': '[package]\nname = "x"\n' }, comando: 'cargo test', motivo: 'Cargo.toml' },
+  { tipo: 'Maven', fs: { 'pom.xml': '<project/>\n' }, comando: 'mvn test', motivo: 'pom.xml' },
   {
     tipo: 'Maven con wrapper',
     fs: { 'pom.xml': '<project/>\n', mvnw: '#!/bin/sh\n', 'mvnw.cmd': '@echo off\n' },
     comando: WIN ? 'mvnw test' : './mvnw test',
+    motivo: 'pom.xml',
+  },
+  { tipo: 'Gradle', fs: { 'build.gradle.kts': '\n' }, comando: 'gradle test', motivo: 'build.gradle.kts' },
+  { tipo: '.NET con .csproj', fs: { 'App.csproj': '<Project/>\n' }, comando: 'dotnet test', motivo: 'proyecto .csproj' },
+  { tipo: '.NET con .sln', fs: { 'App.sln': '\n' }, comando: 'dotnet test', motivo: 'solucion .sln' },
+  { tipo: 'Go', fs: { 'go.mod': 'module x\n' }, comando: 'go test ./...', motivo: 'go.mod' },
+  {
+    tipo: 'Python con pytest',
+    fs: { 'pyproject.toml': '﻿[tool.pytest.ini_options]\n' },
+    comando: 'python -m pytest',
+    motivo: 'pyproject.toml con pytest',
   },
-  { tipo: 'Gradle', fs: { 'build.gradle.kts': '\n' }, comando: 'gradle test' },
-  { tipo: '.NET con .csproj', fs: { 'App.csproj': '<Project/>\n' }, comando: 'dotnet test' },
-  { tipo: '.NET con .sln', fs: { 'App.sln': '\n' }, comando: 'dotnet test' },
-  { tipo: 'Go', fs: { 'go.mod': 'module x\n' }, comando: 'go test ./...' },
-  { tipo: 'Python con pytest', fs: { 'pyproject.toml': '[tool.pytest.ini_options]\n' }, comando: 'python -m pytest' },
   {
     tipo: 'Tauri (Node + Rust)',
     fs: { 'package.json': PKG_CON_TEST, 'Cargo.toml': '[package]\n' },
     comando: 'npm test && cargo test',
+    motivo: `${PKG}, Cargo.toml`,
   },
 ];
 
@@ -370,6 +381,8 @@ for (const caso of CASOS_TASK_088) {
       const c = por(r.comprobaciones, 'verificacion');
       assert.equal(c.nivel, 'aviso', niveles(r.comprobaciones));
       assert.match(c.mensaje, /sin comando_verificacion y el proyecto tiene tests/);
+      // MEN-2 de la ronda 1: el mensaje dice que se detecto.
+      assert.ok(c.mensaje.includes(`(${caso.motivo})`), c.mensaje);
       assert.equal(c.arreglo, `Declara en .taskcode/config.yml: comando_verificacion: "${caso.comando}"`);
       assert.equal(r.codigo, 0, niveles(r.comprobaciones));
     });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/deteccion-tests.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/deteccion-tests.test.ts
new file mode 100644
index 0000000..b602e2a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/deteccion-tests.test.ts
@@ -0,0 +1,74 @@
+/**
+ * Lectura de la raiz para proponer comando_verificacion (TASK-088, MEN-3 de la
+ * ronda 1): los caminos defensivos que fallan en cerrado. Directorios
+ * temporales reales.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { detectarComandosTests } from '../../src/fs/deteccion-tests.js';
+import { MAX_BYTES_MARCADOR_APLICACION } from '../../src/fs/deteccion-app.js';
+
+async function conDir(f: (dir: string) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-deteccion-tests-'));
+  try {
+    await f(dir);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+const PKG_CON_TEST = JSON.stringify({ scripts: { test: 'node --test' } });
+
+test('un directorio que no existe no detecta nada (no lanza)', () => {
+  assert.deepEqual(detectarComandosTests(path.join(tmpdir(), 'taskctl-deteccion-tests-no-existe')), []);
+});
+
+test('package.json mayor que el tope no se lee: no cuenta', async () => {
+  await conDir(async (dir) => {
+    const relleno = ' '.repeat(MAX_BYTES_MARCADOR_APLICACION);
+    await writeFile(path.join(dir, 'package.json'), `${PKG_CON_TEST}${relleno}`, 'utf8');
+    assert.deepEqual(detectarComandosTests(dir), []);
+  });
+});
+
+test('package.json justo en el tope si se lee', async () => {
+  await conDir(async (dir) => {
+    const relleno = ' '.repeat(MAX_BYTES_MARCADOR_APLICACION - PKG_CON_TEST.length);
+    await writeFile(path.join(dir, 'package.json'), `${PKG_CON_TEST}${relleno}`, 'utf8');
+    assert.deepEqual(
+      detectarComandosTests(dir).map((c) => c.comando),
+      ['npm test']
+    );
+  });
+});
+
+test('un directorio con nombre de manifiesto no cuenta', async () => {
+  await conDir(async (dir) => {
+    await mkdir(path.join(dir, 'Cargo.toml'));
+    assert.deepEqual(detectarComandosTests(dir), []);
+  });
+});
+
+test('enlace a fichero cuenta; enlace roto no (si la plataforma deja crearlos)', async (t) => {
+  await conDir(async (dir) => {
+    await writeFile(path.join(dir, 'real.toml'), '[package]\n', 'utf8');
+    try {
+      await symlink(path.join(dir, 'real.toml'), path.join(dir, 'Cargo.toml'));
+      await symlink(path.join(dir, 'no-existe'), path.join(dir, 'go.mod'));
+    } catch (e: unknown) {
+      // Windows nativo sin privilegios: EPERM. El camino se prueba en el CI de Linux.
+      if ((e as NodeJS.ErrnoException).code === 'EPERM') {
+        t.skip('sin permiso para crear enlaces simbolicos');
+        return;
+      }
+      throw e;
+    }
+    assert.deepEqual(
+      detectarComandosTests(dir, 'linux').map((c) => c.comando),
+      ['cargo test']
+    );
+  });
+});
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 62c408b9b346514cb074c6a521f2eea25ee50d5e..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-088/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-088/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-088/revision/informe-revision-1.md                               |  81 ++++++++++++++++
 tareas/03-en-revision/TASK-088/revision/peticion-revision-1.md                              | 508 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-088/tarea.md                                    |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/deteccion-tests.js                 |   3 +-
 6 files changed, 595 insertions(+), 3 deletions(-)
````
