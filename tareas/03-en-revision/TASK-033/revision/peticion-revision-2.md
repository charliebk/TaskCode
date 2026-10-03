# Peticion de revision — TASK-033, ronda 2

- Agente revisor sugerido: general-purpose
- Alcance: SOLO el delta desde la ronda 1 (707990a..HEAD de la rama). La ronda 1 ya verifico el resto: no repetirlo.

## Instrucciones

Revisor INDEPENDIENTE. Comprueba que las correcciones de los hallazgos de informe-revision-1.md (IMP-1, MEN-2, MEN-3) son correctas y que no introducen fallos nuevos (las correcciones son donde se cuelan). Reproduce empiricamente en un clon temporal; mutacion sobre las protecciones nuevas. Veredicto en UNA linea: `- Veredicto: aprobada` / `- Veredicto: aprobada con correcciones` / `- Veredicto: cambios-solicitados`.

## Commits del delta

```
274529c test(TASK-033): el test del nieto no depende de que node arranque en 1,5 s
c8ba509 fix(TASK-033): correcciones de la revision ronda 1
5d423e1 docs(TASK-033): informe de revision ronda 1 (aprobada con correcciones)
```

## Diff del delta (sin dist/)

```diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
index cde4eea..bde61b0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
@@ -50,6 +50,7 @@ import { resolverConfig } from '../core/config.js';
 import { GitCommandError, currentBranch, isRemoteAvailable, runGit } from './git.js';
 import {
   ejecutarSincronizacion,
+  sincronizacionFallidaAlPreparar,
   SIN_SINCRONIZACION,
   type OpcionesSincronizacion,
   type ResultadoSincronizacion,
@@ -204,14 +205,31 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
   // limpio. Nunca aborta la transicion (ver sincronizacion.ts). Si el
   // comando no escribio nada de la tarea, no hay estado nuevo que
   // sincronizar y no se lanza.
-  const sincronizacion = rutasComando.length === 0 ? SIN_SINCRONIZACION : sincronizar(opts);
+  let sincronizacion = rutasComando.length === 0 ? SIN_SINCRONIZACION : sincronizar(opts);
+
+  // Las rutas de sincronizacion se preparan ANTES y por separado: si
+  // Git no puede con una (algo que motivoNoCommiteable no previo), el
+  // fallo no puede tumbar el commit de la tarea — en `finish` el merge
+  // ya esta hecho (hallazgo IMPORTANTE de la revision de TASK-033). Se
+  // despreparan, se restauran y la sincronizacion queda 'fallida'.
+  let rutasSync = sincronizacion.rutas.map((r) => normalizarRuta(cwd, r));
+  try {
+    for (const r of rutasSync) {
+      if (tieneAlgoQuePreparar(cwd, r)) runGit(['add', '-A', '--', r], cwd);
+    }
+  } catch (e: unknown) {
+    sincronizacion = sincronizacionFallidaAlPreparar(
+      cwd,
+      resolverConfig(cwd),
+      detalleDeError(e)
+    );
+    rutasSync = [];
+  }
   avisos.push(...sincronizacion.avisos);
 
   // Deduplicadas y ordenadas para que el commando de Git sea
   // determinista (y los tests puedan aseverar sobre el).
-  const rutasRel = [
-    ...new Set([...rutasComando, ...sincronizacion.rutas.map((r) => normalizarRuta(cwd, r))]),
-  ].sort();
+  const rutasRel = [...new Set([...rutasComando, ...rutasSync])].sort();
   const presentes = rutasRel.filter((r) => tieneAlgoQuePreparar(cwd, r));
 
   let commiteado = false;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
index a2216cc..0af8fa3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
@@ -34,7 +34,17 @@
  *       nombran; las rutas declaradas si se commitean.
  */
 import { createHash } from 'node:crypto';
-import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
+import {
+  closeSync,
+  existsSync,
+  mkdtempSync,
+  openSync,
+  readdirSync,
+  readFileSync,
+  rmSync,
+  statSync,
+} from 'node:fs';
+import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { raizDelRepo, type TaskcodeConfig } from '../core/config.js';
@@ -129,27 +139,24 @@ export function ejecutarSincronizacion(
   // stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra
   // (un arnes de agente, `node --test`) un script que pregunte algo
   // esperaria para siempre. Con EOF, falla y se va por (b).
-  const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
-    cwd: raiz,
-    stdio: ['ignore', 'pipe', 'pipe'],
-    encoding: 'utf8',
-    // Red de seguridad por si el propio envoltorio se colgara.
-    timeout: timeoutMs + 15000,
-    windowsHide: true,
-    maxBuffer: 16 * 1024 * 1024,
-  });
+  const r = lanzarEnvoltorio(raiz, comando, timeoutMs);
 
   const fallo = describirFallo(r, timeoutMs);
   if (fallo !== null) {
-    restaurarAHead(raiz, declaradas);
-    return {
-      estado: 'fallida',
-      rutas: [],
-      avisos: [
-        `La sincronizacion "${comando}" ${fallo}. ${declaradas.join(', ')} se ha(n) dejado ` +
-          `como en HEAD y la tarea se ha commiteado sin ella(s). ${aMano}`,
-      ],
-    };
+    restaurarAHead(raiz, declaradas, antes);
+    return fallida(comando, declaradas, fallo, aMano);
+  }
+
+  // Una ruta que Git no va a poder commitear (ignorada, o con otras
+  // mayusculas que el fichero real en un disco que no las distingue)
+  // tumbaria el `git add` / `git commit` de autoCommit y, con el, la
+  // transicion entera — en `finish`, con el merge ya hecho (hallazgo
+  // IMPORTANTE de la revision por pares de TASK-033). Se detecta aqui y
+  // se va por (b).
+  const noCommiteable = motivoNoCommiteable(raiz, declaradas);
+  if (noCommiteable !== null) {
+    restaurarAHead(raiz, declaradas, antes);
+    return fallida(comando, declaradas, noCommiteable, aMano);
   }
 
   const despues = fotoDelArbol(raiz);
@@ -174,8 +181,105 @@ export function ejecutarSincronizacion(
   return { estado: 'aplicada', rutas: absolutas, avisos: [] };
 }
 
+function fallida(
+  comando: string,
+  declaradas: readonly string[],
+  motivo: string,
+  aMano: string
+): ResultadoSincronizacion {
+  return {
+    estado: 'fallida',
+    rutas: [],
+    avisos: [
+      `La sincronizacion "${comando}" ${motivo}. ${declaradas.join(', ')} se ha(n) dejado ` +
+        `como en HEAD y la tarea se ha commiteado sin ella(s). ${aMano}`,
+    ],
+  };
+}
+
+/**
+ * Resultado 'fallida' para cuando el `git add` de una ruta de
+ * sincronizacion falla ya dentro de autoCommit: segunda barrera de
+ * motivoNoCommiteable, para lo que no se haya podido prever.
+ */
+export function sincronizacionFallidaAlPreparar(
+  cwd: string,
+  config: Pick<TaskcodeConfig, 'comando_sincronizacion' | 'rutas_sincronizacion'>,
+  detalle: string
+): ResultadoSincronizacion {
+  const raiz = raizDelRepo(cwd);
+  const declaradas = config.rutas_sincronizacion;
+  for (const r of declaradas) {
+    // Desprepararla primero: si el add llego a meterla en el indice,
+    // restaurar solo el arbol la dejaria en "A"/"M" y el siguiente
+    // comando abortaria por workspace sucio.
+    runGitOk(['reset', '-q', '--', r], raiz);
+  }
+  restaurarAHead(raiz, declaradas);
+  const comando = config.comando_sincronizacion ?? '';
+  return fallida(
+    comando,
+    declaradas,
+    `escribio sus ficheros, pero Git no pudo prepararlos (${detalle})`,
+    `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
+      'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.'
+  );
+}
+
+/**
+ * null si Git puede commitear todas las rutas; si no, el motivo. Dos
+ * casos reproducidos en la revision: una ruta en `.gitignore` (el
+ * `git add` falla) y, en Windows o macOS, una ruta con otras mayusculas
+ * que el fichero que existe en disco (el pathspec no casa).
+ */
+function motivoNoCommiteable(raiz: string, rutas: readonly string[]): string | null {
+  for (const r of rutas) {
+    if (runGitOk(['check-ignore', '-q', '--', r], raiz)) {
+      return `escribio ${r}, pero esa ruta esta en .gitignore y Git no la commitearia`;
+    }
+    const real = nombreRealEnDisco(raiz, r);
+    if (real !== null && real !== r) {
+      return (
+        `escribio ${r}, pero en disco el fichero se llama ${real}: corrige las mayusculas ` +
+        'en rutas_sincronizacion'
+      );
+    }
+  }
+  return null;
+}
+
+/**
+ * La ruta tal y como se llama en disco, segmento a segmento, o null si
+ * no existe. En un disco que no distingue mayusculas, `existsSync`
+ * diria que si a cualquier variante; leer el directorio no miente.
+ */
+function nombreRealEnDisco(raiz: string, rel: string): string | null {
+  let dir = raiz;
+  const partes: string[] = [];
+  for (const seg of rel.split('/')) {
+    let entradas: string[];
+    try {
+      entradas = readdirSync(dir);
+    } catch {
+      return null;
+    }
+    const exacto = entradas.find((e) => e === seg);
+    const real = exacto ?? entradas.find((e) => e.toLowerCase() === seg.toLowerCase());
+    if (real === undefined) return null;
+    partes.push(real);
+    dir = path.join(dir, real);
+  }
+  return partes.join('/');
+}
+
 /** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
 const CODIGO_TIMEOUT_ENVOLTORIO = 124;
+/**
+ * Marca que ENVOLTORIO escribe en stderr al cortar. Sin ella, un script
+ * que saliera con 124 por su cuenta se describiria como un timeout
+ * (hallazgo MENOR de la revision).
+ */
+const MARCA_TIMEOUT = '[taskctl:timeout]';
 
 /**
  * Ejecuta argv[1] con el shell del sistema y lo corta a los argv[2] ms.
@@ -188,6 +292,12 @@ const CODIGO_TIMEOUT_ENVOLTORIO = 124;
  * - Al vencer el timeout mata el ARBOL: `taskkill /T /F` en Windows
  *   (con el hijo aun vivo, que es cuando /T puede recorrerlo) y el
  *   grupo de procesos en POSIX (por eso `detached`).
+ * - Al cortar sale EN EL ACTO, sin esperar al `close` del hijo. El hijo
+ *   tiene tuberias propias (la salida se reenvia), asi que un nieto que
+ *   sobreviviera al kill retendria las del envoltorio, no las de
+ *   taskctl: `spawnSync` vuelve igual. Con `stdio: 'inherit'` y un kill
+ *   que fallara, taskctl se quedaba colgado para siempre (medido con un
+ *   mutante en la revision).
  * - Sale con el codigo del comando, o con 124 (como `timeout(1)`) si lo
  *   corto.
  */
@@ -195,30 +305,94 @@ const ENVOLTORIO = `
 const { spawn, spawnSync } = require('node:child_process');
 const [comando, ms] = process.argv.slice(1);
 const win = process.platform === 'win32';
-const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'inherit', 'inherit'],
+const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'pipe', 'pipe'],
   windowsHide: true, detached: !win });
-let cortado = false;
+hijo.stdout.on('data', (d) => process.stdout.write(d));
+hijo.stderr.on('data', (d) => process.stderr.write(d));
 const t = setTimeout(() => {
-  cortado = true;
   if (win) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
   else { try { process.kill(-hijo.pid, 'SIGKILL'); } catch {} }
+  process.stderr.write('${MARCA_TIMEOUT}', () => process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)}));
 }, Number(ms));
 hijo.on('error', (e) => { clearTimeout(t); process.stderr.write(String(e.message)); process.exit(127); });
 hijo.on('close', (code, signal) => {
   clearTimeout(t);
-  if (cortado) process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)});
-  process.exit(code === null ? 128 : code);
+  if (code === null) { process.stderr.write('termino por la senal ' + signal); process.exit(1); }
+  process.exit(code);
 });
 `;
 
+interface SalidaEnvoltorio {
+  error?: Error;
+  status: number | null;
+  signal: NodeJS.Signals | null;
+  stderr: string;
+}
+
+/**
+ * Lanza ENVOLTORIO con la salida a FICHEROS temporales, no a tuberias.
+ * Con tuberias, en Windows cmd.exe hereda tambien las del propio
+ * envoltorio, asi que un nieto que sobreviva al kill retiene la de
+ * taskctl y `spawnSync` espera su EOF para siempre — medido con un
+ * mutante del `taskkill` en la revision: el test se colgo 30 min y el
+ * timeout por test no lo corta porque `spawnSync` bloquea el event
+ * loop. Con ficheros, `spawnSync` vuelve en cuanto el envoltorio sale,
+ * quede vivo lo que quede.
+ */
+function lanzarEnvoltorio(raiz: string, comando: string, timeoutMs: number): SalidaEnvoltorio {
+  const dir = mkdtempSync(path.join(tmpdir(), 'taskctl-sync-salida-'));
+  const rutaOut = path.join(dir, 'stdout');
+  const rutaErr = path.join(dir, 'stderr');
+  const fdOut = openSync(rutaOut, 'w');
+  const fdErr = openSync(rutaErr, 'w');
+  try {
+    const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
+      cwd: raiz,
+      stdio: ['ignore', fdOut, fdErr],
+      // Red de seguridad por si el propio envoltorio se colgara.
+      timeout: timeoutMs + 15000,
+      windowsHide: true,
+    });
+    closeSync(fdOut);
+    closeSync(fdErr);
+    const salida: SalidaEnvoltorio = {
+      status: r.status,
+      signal: r.signal,
+      stderr: readFileSync(rutaErr, 'utf8'),
+    };
+    if (r.error !== undefined) salida.error = r.error;
+    return salida;
+  } finally {
+    // Un huerfano puede tener aun el fichero abierto (EBUSY en
+    // Windows): se deja para el limpiador del sistema, no es un fallo.
+    try {
+      closeSync(fdOut);
+    } catch {
+      /* ya cerrado */
+    }
+    try {
+      closeSync(fdErr);
+    } catch {
+      /* ya cerrado */
+    }
+    try {
+      rmSync(dir, { recursive: true, force: true });
+    } catch {
+      /* ver arriba */
+    }
+  }
+}
+
 /** null si el comando termino bien; si no, que le paso, en palabras de persona. */
-function describirFallo(r: ReturnType<typeof spawnSync>, timeoutMs: number): string | null {
+function describirFallo(r: SalidaEnvoltorio, timeoutMs: number): string | null {
   const corte = `no termino en ${String(Math.round(timeoutMs / 1000))} s y se ha cortado`;
   if (r.error !== undefined) {
     if ((r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') return corte;
     return `no se pudo ejecutar (${r.error.message})`;
   }
-  if (r.status === CODIGO_TIMEOUT_ENVOLTORIO) return corte;
+  if (r.status === CODIGO_TIMEOUT_ENVOLTORIO && String(r.stderr ?? '').endsWith(MARCA_TIMEOUT)) {
+    return corte;
+  }
   if (r.signal !== null) return `termino por la senal ${r.signal}`;
   if (r.status !== 0) {
     const stderr = String(r.stderr ?? '').trim();
@@ -293,13 +467,25 @@ function huella(fichero: string): string {
  * que escribio el comando: si existia en HEAD se restaura, y si no
  * existia el fichero lo creo el comando y se borra.
  */
-function restaurarAHead(raiz: string, rutas: readonly string[]): void {
+function restaurarAHead(
+  raiz: string,
+  rutas: readonly string[],
+  antes: ReadonlyMap<string, string> = new Map()
+): void {
   for (const r of rutas) {
-    const enHead = runGitOk(['cat-file', '-e', `HEAD:${r}`], raiz);
-    if (enHead) {
-      runGit(['checkout', 'HEAD', '--', r], raiz);
-    } else {
-      const abs = path.join(raiz, r);
+    // Se trabaja con el nombre REAL del fichero. Con la ruta declarada
+    // tal cual, una errata de mayusculas en un disco que no las
+    // distingue no se encontraria en HEAD y caeria en el rmSync de
+    // abajo: borraria el fichero versionado de verdad.
+    const objetivo = nombreRealEnDisco(raiz, r) ?? r;
+    // Si con otro nombre resulta ser un fichero que ya estaba sucio
+    // antes de ejecutar, es trabajo de la persona (en un disco que si
+    // distingue mayusculas es OTRO fichero): no se toca.
+    if (objetivo !== r && antes.has(objetivo)) continue;
+    if (runGitOk(['cat-file', '-e', `HEAD:${objetivo}`], raiz)) {
+      runGit(['checkout', 'HEAD', '--', objetivo], raiz);
+    } else if (!antes.has(objetivo)) {
+      const abs = path.join(raiz, objetivo);
       if (existsSync(abs)) rmSync(abs, { force: true });
     }
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
index 37f20b6..80c03f4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
@@ -137,7 +137,9 @@ async function withRepoSincronizado(
     commitAll(repoRoot, 'docs: plan y sincronizacion');
     await fn(repoRoot, tareasRoot);
   } finally {
-    await rm(repoRoot, { recursive: true, force: true });
+    // Un EBUSY aqui (un proceso huerfano con el cwd dentro) no puede
+    // tapar la asercion que de verdad fallo: se reintenta y se traga.
+    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
   }
 }
 
@@ -363,6 +365,89 @@ async function reescribirScriptSinCommitear(repoRoot: string, contenido: string)
   git(['commit', '-q', '-m', 'chore: script nuevo', '--', 'scripts/sync.mjs'], repoRoot);
 }
 
+// ─── Revision ronda 1: rutas que Git no puede commitear ────────────────────
+
+test('sincronizacion (revision IMP-1): una ruta declarada en .gitignore no aborta la transicion; queda fallida y el arbol limpio', async () => {
+  await withRepoSincronizado(
+    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/GEN.md]\n',
+    async (repoRoot, tareasRoot) => {
+      await writeFile(path.join(repoRoot, '.gitignore'), 'docs/GEN.md\n', 'utf8');
+      await reescribirScript(
+        repoRoot,
+        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/GEN.md', 'x\\n');\n"
+      );
+      const dir = await tocarTarea(tareasRoot);
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      assert.equal(r.commiteado, true, 'la tarea tiene que commitearse igual');
+      assert.match(r.avisos.join('\n'), /esta en \.gitignore/);
+      assert.equal(porcelain(repoRoot), '');
+    }
+  );
+});
+
+test('sincronizacion (revision IMP-1): una ruta declarada con otras mayusculas que el fichero real queda fallida y nombra el nombre real', async () => {
+  await withRepoSincronizado(
+    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/plan.md]\n',
+    async (repoRoot, tareasRoot) => {
+      const dir = await tocarTarea(tareasRoot);
+      const tareaMd = path.join(dir, 'tarea.md');
+      await writeFile(
+        tareaMd,
+        (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
+      );
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      assert.equal(r.commiteado, true);
+      assert.match(r.avisos.join('\n'), /se llama docs\/PLAN\.md/);
+      assert.equal(porcelain(repoRoot), '', 'el derivado se tenia que restaurar');
+    }
+  );
+});
+
+test('sincronizacion (revision MEN-2): un script que sale con 124 por su cuenta no se describe como timeout', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await reescribirScript(repoRoot, 'process.exit(124);\n');
+    const dir = await tocarTarea(tareasRoot);
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+    assert.equal(r.sincronizacion.estado, 'fallida');
+    const aviso = r.avisos.join('\n');
+    assert.match(aviso, /salio con codigo 124/);
+    assert.doesNotMatch(aviso, /no termino en/);
+  });
+});
+
+test('sincronizacion (revision MEN-3): el timeout mata tambien al nieto; deja de escribir despues del corte', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    // El nieto escribe fuera del repo: asi no cuenta como ruta ajena y
+    // lo unico que mide el test es si sigue vivo.
+    const testigo = path.join(path.dirname(repoRoot), `${path.basename(repoRoot)}-nieto.txt`);
+    await reescribirScript(
+      repoRoot,
+      "import { spawn } from 'node:child_process';\n" +
+        `const testigo = ${JSON.stringify(testigo)};\n` +
+        "spawn(process.execPath, ['-e', \"const fs = require('fs'); fs.appendFileSync(process.argv[1], 'x'); setInterval(() => fs.appendFileSync(process.argv[1], 'x'), 50)\", testigo], { stdio: 'ignore' });\n" +
+        'setTimeout(() => {}, 60000);\n'
+    );
+    const dir = await tocarTarea(tareasRoot);
+    try {
+      const r = autoCommit({
+        cwd: repoRoot,
+        rutas: [dir],
+        mensaje: mensajeChore('TASK-920', 'x'),
+        sincronizacion: { timeoutMs: 8000 },
+      });
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      await new Promise((ok) => setTimeout(ok, 500));
+      const tras = (await readFile(testigo, 'utf8')).length;
+      await new Promise((ok) => setTimeout(ok, 1000));
+      assert.equal((await readFile(testigo, 'utf8')).length, tras, 'el nieto sigue vivo');
+    } finally {
+      await rm(testigo, { force: true });
+    }
+  });
+});
+
 // ─── finish: el caso sin retorno ───────────────────────────────────────────
 
 test('sincronizacion en finish: si el script falla tras el merge, la tarea queda cerrada y commiteada en develop y el arbol limpio', async () => {
```
