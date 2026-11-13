# Peticion de revision — TASK-134 (ronda 1)

- Tarea: TASK-134 — En Windows taskctl lanza el bash de Git, no el primero del PATH
- Rama revisada: fix/task-134-en-windows-taskctl-lanza-el-bash-de-git
- Rama base: develop
- Commit revisado (HEAD): 01fe307a11bab6dce91df782585b0d71464b9c35
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-134 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-134/tarea.md
- tareas/03-en-revision/TASK-134/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/resolver-bash.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-bash.test.ts

## Commits a revisar (git log develop..HEAD)

````
01fe307 test(TASK-134): el test de integracion reproduce el PATH de PowerShell (System32 y Git/cmd, sin usr/bin)
820338d fix(TASK-134): con el bash de Git, su usr/bin va delante en el PATH del script (desde PowerShell faltaban mktemp y dirname)
6b334e9 fix(TASK-134): en Windows taskctl lanza el bash de la instalacion de Git, no el primero del PATH
0df14b6 chore(TASK-134): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 627d6c5..bdc2e55 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -204,7 +204,8 @@ function comprobarGit(cwd: string): Comprobacion {
 
 function arregloBash(): string {
   return process.platform === 'win32'
-    ? 'Instala Git for Windows (https://git-scm.com/download/win) y pon su carpeta usr\\bin al PRINCIPIO del PATH, ' +
+    ? 'Instala Git for Windows (https://git-scm.com/download/win) con git.exe en el PATH: taskctl usa el bash de esa ' +
+        'instalacion (usr\\bin\\bash.exe). Si aun asi falla, pon su carpeta usr\\bin al PRINCIPIO del PATH, ' +
         'antes de C:\\Windows\\System32 (ahi vive el bash de WSL, que no vale). En PowerShell, para esta terminal: ' +
         '$env:Path = "C:\\Program Files\\Git\\usr\\bin;" + $env:Path ; para siempre, editalo en las variables de ' +
         'entorno del sistema y abre una terminal nueva. Despues repite taskctl doctor.'
@@ -214,14 +215,21 @@ function arregloBash(): string {
 
 function comprobarBash(deps: DoctorCommandDeps): Comprobacion {
   const r = sondearBash({ scriptsDir: deps.scriptsDir ?? resolveGitflowScriptsDir(), cwd: deps.repoCwd });
-  if (r.ok) return ok('bash', `bash ejecuta los scripts de Git-Flow${r.version === '' ? '' : ` (bash ${r.version})`}`);
+  // TASK-134: en Windows se dice que bash se usa, y si no aparecio el de Git junto a git.exe.
+  const cual =
+    r.bash.origen === 'git'
+      ? `; bash de Git: ${r.bash.comando}`
+      : process.platform === 'win32'
+        ? '; no se encontro el bash de Git junto a git.exe: se usa el "bash" del PATH'
+        : '';
+  if (r.ok) return ok('bash', `bash ejecuta los scripts de Git-Flow${r.version === '' ? '' : ` (bash ${r.version})`}${cual}`);
   const que =
     r.causa === 'no-lanzable'
-      ? `no se pudo lanzar "bash" (${una(r.detalle)})`
+      ? `no se pudo lanzar "${r.bash.comando}" (${una(r.detalle)})`
       : r.causa === 'timeout'
         ? 'bash no termino el script de prueba a tiempo'
         : `bash no pudo ejecutar el script de prueba de Git-Flow (${una(r.detalle)})`;
-  return fallo('bash', que, arregloBash());
+  return fallo('bash', `${que}${cual}`, arregloBash());
 }
 
 // ---------------------------------------------------------------------
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
new file mode 100644
index 0000000..c8938c0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
@@ -0,0 +1,72 @@
+/**
+ * Que bash lanza taskctl (TASK-134). Logica pura: el sistema de ficheros y el
+ * entorno entran como datos, para probarla sin procesos.
+ *
+ * En Windows, "bash" a secas es el primero del PATH, y desde PowerShell suele
+ * ser C:\Windows\System32\bash.exe (WSL), que no abre el script: finish
+ * fallaba o no segun la terminal. Por eso en Windows se busca el bash de Git a
+ * partir de git.exe (la instalacion de Git lo trae en usr\bin o en bin) y el
+ * bash del PATH queda solo como respaldo. En Linux y macOS, "bash" como
+ * siempre.
+ */
+import path from 'node:path';
+
+export interface EntornoBash {
+  plataforma: NodeJS.Platform;
+  /** Valor de la variable PATH. */
+  path: string;
+  existe(fichero: string): boolean;
+}
+
+export type BashResuelto =
+  /** herramientas: el usr\bin de esa instalacion (mktemp, dirname, grep...), que va delante en el PATH del script. */
+  | { comando: string; origen: 'git'; herramientas: string }
+  | { comando: 'bash'; origen: 'path' };
+
+/**
+ * Niveles que se sube desde la carpeta de git.exe buscando la raiz de la
+ * instalacion: cmd\ y bin\ estan a uno; mingw64\bin, ucrt64\bin o
+ * clangarm64\bin, a dos.
+ */
+const NIVELES_HASTA_LA_RAIZ = 2;
+
+/** usr\bin\bash.exe primero: es el bash de verdad; bin\bash.exe es un lanzador. */
+const BASH_EN_LA_RAIZ: readonly string[] = [path.win32.join('usr', 'bin', 'bash.exe'), path.win32.join('bin', 'bash.exe')];
+
+export function resolverBash(entorno: EntornoBash): BashResuelto {
+  if (entorno.plataforma !== 'win32') return { comando: 'bash', origen: 'path' };
+  const p = path.win32;
+  for (const dir of entorno.path.split(';')) {
+    const limpio = dir.trim().replace(/^"(.*)"$/, '$1');
+    if (limpio === '' || !entorno.existe(p.join(limpio, 'git.exe'))) continue;
+    let raiz = p.resolve(limpio);
+    for (let nivel = 1; nivel <= NIVELES_HASTA_LA_RAIZ; nivel++) {
+      const arriba = p.dirname(raiz);
+      if (arriba === raiz) break;
+      raiz = arriba;
+      for (const rel of BASH_EN_LA_RAIZ) {
+        const candidato = p.join(raiz, rel);
+        if (entorno.existe(candidato)) return { comando: candidato, origen: 'git', herramientas: p.join(raiz, 'usr', 'bin') };
+      }
+    }
+  }
+  return { comando: 'bash', origen: 'path' };
+}
+
+/**
+ * El entorno con el que se lanza el script. Con el bash de Git, su usr\bin va
+ * delante en el PATH: lanzado desde PowerShell, el PATH suele tener solo
+ * Git\cmd y el script no encontraria mktemp ni dirname (comprobado a mano en
+ * TASK-134). La clave del PATH se conserva tal cual viene (en Windows suele
+ * ser "Path"), para no dejar dos claves que solo difieren en mayusculas. Con
+ * el bash del PATH, el entorno no se toca (null).
+ */
+export function entornoParaBash(
+  bash: BashResuelto,
+  entorno: Readonly<Record<string, string | undefined>>
+): Record<string, string | undefined> | null {
+  if (bash.origen !== 'git') return null;
+  const clave = Object.keys(entorno).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
+  const actual = entorno[clave] ?? '';
+  return { ...entorno, [clave]: actual === '' ? bash.herramientas : `${bash.herramientas};${actual}` };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
index e6104a0..08177dd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
@@ -25,8 +25,10 @@
  * `start`, `review` y `finish` no la pasan y se quedan con 'ignore'.
  */
 import { spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from 'node:child_process';
+import { existsSync } from 'node:fs';
 import { fileURLToPath } from 'node:url';
 import path from 'node:path';
+import { entornoParaBash, resolverBash, type BashResuelto } from '../core/resolver-bash.js';
 
 function packageRoot(): string {
   // dist/src/fs/gitflow-runner.js -> dist/src/fs -> dist/src -> dist -> raiz del paquete
@@ -79,25 +81,38 @@ export interface GitflowScriptResult {
 export class GitflowScriptLaunchError extends Error {
   constructor(
     public readonly scriptName: string,
-    public readonly originalError: Error
+    public readonly originalError: Error,
+    bash = 'bash'
   ) {
-    super(`No se pudo ejecutar "bash" para lanzar ${scriptName}: ${originalError.message}`);
+    super(`No se pudo ejecutar "${bash}" para lanzar ${scriptName}: ${originalError.message}`);
     this.name = 'GitflowScriptLaunchError';
   }
 }
 
 /**
- * EL unico sitio que lanza bash: `bash "<ruta>" args`, sin shell y con el
- * PATH heredado. `runGitflowScript` y la sonda de `taskctl doctor` pasan por
- * aqui: si la sonda lanzara de otra forma, podria dar OK y que los scripts
- * fallaran (o al reves).
+ * El bash que lanza taskctl (TASK-134): en Windows, el de la instalacion de
+ * Git que contiene el primer git.exe del PATH; si no lo hay, y fuera de
+ * Windows, "bash" del PATH. Ver core/resolver-bash.ts.
+ */
+export function bashDeTaskctl(): BashResuelto {
+  return resolverBash({ plataforma: process.platform, path: process.env['PATH'] ?? '', existe: existsSync });
+}
+
+/**
+ * EL unico sitio que lanza bash: `<bash> "<ruta>" args`, sin shell, con el
+ * bash de `bashDeTaskctl()` y el PATH heredado (con el usr\bin de Git delante
+ * si el bash es el de Git: ver `entornoParaBash`). `runGitflowScript` y la
+ * sonda de `taskctl doctor` pasan por aqui: si la sonda lanzara de otra
+ * forma, podria dar OK y que los scripts fallaran (o al reves).
  */
 function lanzarBash(
+  bash: BashResuelto,
   scriptPath: string,
   args: readonly string[],
   extra: SpawnSyncOptions
 ): SpawnSyncReturns<string | Buffer> {
-  return spawnSync('bash', [scriptPath, ...args], extra);
+  const env = entornoParaBash(bash, extra.env ?? process.env);
+  return spawnSync(bash.comando, [scriptPath, ...args], env === null ? extra : { ...extra, env });
 }
 
 export function runGitflowScript(
@@ -106,12 +121,13 @@ export function runGitflowScript(
   opts: RunGitflowScriptOptions
 ): GitflowScriptResult {
   const scriptPath = path.join(opts.scriptsDir, scriptName);
-  const result = lanzarBash(scriptPath, args, {
+  const bash = bashDeTaskctl();
+  const result = lanzarBash(bash, scriptPath, args, {
     cwd: opts.cwd,
     stdio: [opts.stdin ?? 'ignore', 'inherit', 'inherit'],
   });
   if (result.error) {
-    throw new GitflowScriptLaunchError(scriptName, result.error);
+    throw new GitflowScriptLaunchError(scriptName, result.error, bash.comando);
   }
   return { code: result.status ?? 1, signal: result.signal ?? null };
 }
@@ -120,9 +136,10 @@ export function runGitflowScript(
 export const SONDA_BASH = '_sonda-bash.sh';
 const MARCA_SONDA = 'taskctl-sonda-ok';
 
-export type ResultadoSondaBash =
+export type ResultadoSondaBash = { bash: BashResuelto } & (
   | { ok: true; version: string }
-  | { ok: false; causa: 'no-lanzable' | 'timeout' | 'fallo'; detalle: string };
+  | { ok: false; causa: 'no-lanzable' | 'timeout' | 'fallo'; detalle: string }
+);
 
 /**
  * TASK-062 (`taskctl doctor`): ejecuta de verdad el script minimo de la
@@ -134,7 +151,8 @@ export type ResultadoSondaBash =
  * para que `doctor --json` siga limpio).
  */
 export function sondearBash(opts: { scriptsDir: string; cwd: string; timeoutMs?: number }): ResultadoSondaBash {
-  const r = lanzarBash(path.join(opts.scriptsDir, SONDA_BASH), [], {
+  const bash = bashDeTaskctl();
+  const r = lanzarBash(bash, path.join(opts.scriptsDir, SONDA_BASH), [], {
     cwd: opts.cwd,
     encoding: 'utf8',
     stdio: ['ignore', 'pipe', 'pipe'],
@@ -144,14 +162,14 @@ export function sondearBash(opts: { scriptsDir: string; cwd: string; timeoutMs?:
   const limpio = (t: unknown): string => String(t ?? '').replace(/\u0000/g, '').trim();
   if (r.error) {
     const agotado = (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT';
-    return { ok: false, causa: agotado ? 'timeout' : 'no-lanzable', detalle: limpio(r.error.message) };
+    return { bash, ok: false, causa: agotado ? 'timeout' : 'no-lanzable', detalle: limpio(r.error.message) };
   }
   const lineas = limpio(r.stdout).split(/\r?\n/);
   const marca = lineas.find((l) => l.startsWith(MARCA_SONDA));
   if (r.status === 0 && marca !== undefined) {
-    return { ok: true, version: marca.slice(MARCA_SONDA.length).trim() };
+    return { bash, ok: true, version: marca.slice(MARCA_SONDA.length).trim() };
   }
   const err = limpio(r.stderr).split(/\r?\n/).filter((x) => x !== '').slice(0, 3).join(' | ');
   const codigo = r.status === null ? `senal ${r.signal ?? 'desconocida'}` : `codigo ${r.status}`;
-  return { ok: false, causa: 'fallo', detalle: `el script de prueba termino con ${codigo}${err === '' ? '' : `: ${err}`}` };
+  return { bash, ok: false, causa: 'fallo', detalle: `el script de prueba termino con ${codigo}${err === '' ? '' : `: ${err}`}` };
 }
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-134/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-134/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-134/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                  | 15 +++++++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/resolver-bash.js               | 58 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/gitflow-runner.js                | 42 ++++++++++++++++++++++++++++--------------
 6 files changed, 99 insertions(+), 19 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/resolver-bash.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-bash.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/resolver-bash.test.ts | 72 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts  | 40 ++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-bash.test.ts      | 11 +++++++++--
 3 files changed, 121 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 140.9 s
- Commit verificado: 01fe307a11bab6dce91df782585b0d71464b9c35
- Huella: d28886484c3524b437653ad3da11767d6d5785cb
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 95699 bytes en total):

````
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (2264.813ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (2117.9876ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9651ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.204ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8859ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (1.1318ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6629ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9763ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (7.8494ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (12.9425ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (20.5257ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (13.2668ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.9237ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (5.4572ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (42.2185ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.1581ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (2.4359ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.6204ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4833ms)
C:\Users\nullcad2025\Documents\sources\Personal\TaskCode\taskcode-marketplace\plugins\taskcode-plugin\scripts\gitflow\README.md: line 3: syntax error near unexpected token `('
C:\Users\nullcad2025\Documents\sources\Personal\TaskCode\taskcode-marketplace\plugins\taskcode-plugin\scripts\gitflow\README.md: line 3: `Automatización de Git-Flow migrada desde `runConfigurations.zip` (Run'
✔ resolveGitflowScriptsDir: respeta CLAUDE_PLUGIN_ROOT cuando esta definida (2.7182ms)
✔ resolveGitflowScriptsDir: cae a la ruta relativa al paquete si CLAUDE_PLUGIN_ROOT no esta (o esta vacia) (2.074ms)
✔ runGitflowScript: devuelve code y signal para un script real (128.799ms)
✔ runGitflowScript: "inherit" deja llegar la respuesta al script y el default "ignore" no (923.6424ms)
✔ GitflowScriptLaunchError: mensaje incluye el nombre del script y el error original (0.6339ms)
✔ sondearBash: el script de la sonda corre de verdad con este bash (TASK-062) (1208.2993ms)
✔ sondearBash: un script que no existe no lanza y no es OK (98.4209ms)
✔ TASK-134: con un bash falso el primero del PATH, Windows usa el bash de Git y POSIX el del PATH como siempre (1166.8049ms)
✔ sonda: con todo lo necesario, OK (control positivo del PATH montado) (3343.7433ms)
✔ sonda: a un entorno sin mktemp lo da por no valido (la sonda prueba mktemp de verdad) (2129.2889ms)
ℹ tests 749
ℹ suites 0
ℹ pass 749
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 119063.8601
[verificar-impacto] node --test termino con 0 en 119.2 s.
````
