# Peticion de revision — TASK-143c (ronda 1)

- Tarea: TASK-143c — paridad bash y TS, ls-remote y perfil-tests (parte c de TASK-143)
- Rama revisada: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
- Rama base: develop
- Commit revisado (HEAD): 99767cb42a96391e2064f866bc3a596eb4ef1971
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-143c (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-143c/tarea.md
- tareas/03-en-revision/TASK-143c/planificacion/
- scripts/perfil-tests.mjs
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/paridad-operacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/perfil-tests.test.ts

## Commits a revisar (git log develop..HEAD)

````
99767cb docs(TASK-143c): autorrevision
6b91fad fix(TASK-143c): tagLoPusoElScript sin leer --tag como token
3f82949 fix(TASK-143c): deteccion de operacion comun con paridad bash/TS, ls-remote con limite, finish con --main y perfil-tests protegido
88749f4 chore(TASK-143c): tarea en curso
28adbf5 merge(TASK-143c): develop en fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/scripts/perfil-tests.mjs b/scripts/perfil-tests.mjs
index b2e32b8..8665487 100644
--- a/scripts/perfil-tests.mjs
+++ b/scripts/perfil-tests.mjs
@@ -37,6 +37,7 @@ import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync,
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
+import { conDistProtegido } from './verificar-impacto.mjs';
 
 const PLUGIN = 'taskcode-marketplace/plugins/taskcode-plugin';
 const WIN = process.platform === 'win32';
@@ -202,10 +203,19 @@ async function main(argv) {
   const o = opciones(argv);
   const raiz = (spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout ?? '').trim();
   const dirPlugin = path.resolve(o.dir ?? path.join(raiz, ...PLUGIN.split('/')));
-  if (!o.sinBuild) {
+  if (o.sinBuild) return medir(dirPlugin, o);
+  // TASK-143c (SCR-13): compilar reescribe dist/src (versionado). Con la
+  // misma proteccion que verificar-impacto (copia y cerrojo de TASK-136): el
+  // arbol queda como estaba y no se pisa con una verificacion a la vez.
+  return conDistProtegido(dirPlugin, async () => {
     const b = spawnSync('npm run limpiar:test && npm run build', { cwd: dirPlugin, shell: true, stdio: 'inherit' });
     if (b.status !== 0) return 1;
-  }
+    return medir(dirPlugin, o);
+  });
+}
+
+/** Corre y mide cada fichero de test ya compilado, y escribe el informe. */
+async function medir(dirPlugin, o) {
   const ficheros = ficherosDeTest(dirPlugin, o.filtro);
   const dirTmp = mkdtempSync(path.join(tmpdir(), 'perfil-tests-'));
   try {
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index 75cadd2..54c27b0 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -474,30 +474,7 @@ function main(argv) {
     console.log('[verificar-impacto] No hay tests que correr.');
     return 0;
   }
-  // La verificacion no puede cambiar el arbol: `npm run build` reescribe
-  // dist/src (versionado). Se guarda antes y se devuelve tal cual al acabar.
-  const distSrc = path.join(dirPlugin, 'dist', 'src');
-  const copia = dirCopia(dirPlugin);
-  // TASK-136: la copia es una por plugin. Sin cerrojo, una segunda ejecucion
-  // (review en segundo plano y el freno Stop a la vez) tomaba la copia viva de
-  // la primera por huerfana, la restauraba y la borraba; la primera acababa
-  // borrando dist/src sin nada que devolver. Con el cerrojo, quien llega
-  // segundo espera; y la copia solo se toca con el cerrojo en la mano.
-  const cerrojo = `${copia}.cerrojo`;
-  if (!tomarCerrojo(cerrojo, leerEspera(process.env.VERIFICAR_IMPACTO_ESPERA_S))) return 1;
-  let habiaDist = false;
-  try {
-    restaurarHuerfana(copia, distSrc);
-    mkdirSync(copia, { recursive: true });
-    habiaDist = existsSync(distSrc);
-    if (habiaDist) cpSync(distSrc, path.join(copia, 'src'), { recursive: true });
-    // El marcador va el ultimo: sin el, la copia esta a medias y no se restaura.
-    writeFileSync(path.join(copia, MARCADOR), JSON.stringify({ dirPlugin, habiaDist, pid: process.pid }));
-  } catch (e) {
-    soltarCerrojo(cerrojo);
-    throw e;
-  }
-  try {
+  return conDistProtegido(dirPlugin, () => {
     if (existsSync(path.join(dirPlugin, 'package.json'))) {
       const scripts = JSON.parse(readFileSync(path.join(dirPlugin, 'package.json'), 'utf8')).scripts ?? {};
       if (scripts['limpiar:test'] && npm('limpiar:test', dirPlugin) !== 0) return 1;
@@ -521,13 +498,60 @@ function main(argv) {
     });
     console.log(`[verificar-impacto] node --test termino con ${String(r.status)} en ${((Date.now() - inicio) / 1000).toFixed(1)} s.`);
     return r.status ?? 1;
-  } finally {
+  });
+}
+
+/**
+ * TASK-143c (SCR-13): ejecuta `fn` con dist/src del plugin protegido. Quien
+ * compila (`npm run build` reescribe dist/src, que esta versionado) no puede
+ * cambiar el arbol: dist/src se guarda en una copia antes y se devuelve tal
+ * cual al acabar, tambien si `fn` falla. Lo usan verificar-impacto y
+ * perfil-tests; antes perfil-tests recompilaba sin copia ni cerrojo.
+ *
+ * TASK-136: la copia es una por plugin. Sin cerrojo, una segunda ejecucion
+ * (review en segundo plano y el freno Stop a la vez) tomaba la copia viva de
+ * la primera por huerfana, la restauraba y la borraba; la primera acababa
+ * borrando dist/src sin nada que devolver. Con el cerrojo, quien llega
+ * segundo espera; y la copia solo se toca con el cerrojo en la mano.
+ *
+ * `fn` puede devolver un valor o una promesa; sin cerrojo, devuelve 1.
+ */
+export function conDistProtegido(dirPlugin, fn) {
+  const distSrc = path.join(dirPlugin, 'dist', 'src');
+  const copia = dirCopia(dirPlugin);
+  const cerrojo = `${copia}.cerrojo`;
+  if (!tomarCerrojo(cerrojo, leerEspera(process.env.VERIFICAR_IMPACTO_ESPERA_S))) return 1;
+  let habiaDist = false;
+  try {
+    restaurarHuerfana(copia, distSrc);
+    mkdirSync(copia, { recursive: true });
+    habiaDist = existsSync(distSrc);
+    if (habiaDist) cpSync(distSrc, path.join(copia, 'src'), { recursive: true });
+    // El marcador va el ultimo: sin el, la copia esta a medias y no se restaura.
+    writeFileSync(path.join(copia, MARCADOR), JSON.stringify({ dirPlugin, habiaDist, pid: process.pid }));
+  } catch (e) {
+    soltarCerrojo(cerrojo);
+    throw e;
+  }
+  const cerrar = () => {
     try {
       devolver(copia, distSrc, habiaDist);
     } finally {
       soltarCerrojo(cerrojo);
     }
+  };
+  let resultado;
+  try {
+    resultado = fn();
+  } catch (e) {
+    cerrar();
+    throw e;
+  }
+  if (resultado !== null && typeof resultado === 'object' && typeof resultado.then === 'function') {
+    return resultado.finally(cerrar);
   }
+  cerrar();
+  return resultado;
 }
 
 const MARCADOR = 'marcador.json';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index 2b1c579..7f38707 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -357,6 +357,46 @@ normalize_branch_name() {
     assert_valid_branch_name "$NAME" "$type/$example"
 }
 
+# ── detect_operation_in_progress ──────────────────────────────────────────────
+# TASK-143c (SCR-07): la operacion de Git a medias, antes copiada en
+# abort-merge y diagnose-repo (y en operacionEnCurso de src/fs/git.ts, con
+# test de paridad). Deja merge_in_progress, rebase_in_progress,
+# cherry_pick_in_progress y revert_in_progress ("true"/"false") y escribe en
+# stdout la operacion por la que manda, en el orden de git.ts (merge, rebase,
+# cherry-pick, revert), o nada. Fuera de un repo, todo a false.
+#
+# Una secuencia multi-commit puede quedar a medias SIN CHERRY_PICK_HEAD ni
+# REVERT_HEAD: si se resuelve el conflicto y se hace "git commit" a mano en
+# vez de "--continue", Git borra el testigo pero deja .git/sequencer con los
+# commits que faltan, y "--abort" sigue funcionando. Ahi el testigo es el
+# directorio; si alguna entrada de su "todo" empieza por "revert " es un
+# revert, y si no, un cherry-pick (Git no mezcla los dos verbos).
+merge_in_progress=false; rebase_in_progress=false
+cherry_pick_in_progress=false; revert_in_progress=false
+detect_operation_in_progress() {
+    merge_in_progress=false; rebase_in_progress=false
+    cherry_pick_in_progress=false; revert_in_progress=false
+    local git_dir
+    git_dir=$(git rev-parse --git-dir 2>/dev/null) || return 0
+    [ -f "$git_dir/MERGE_HEAD" ]                                         && merge_in_progress=true
+    { [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; } && rebase_in_progress=true
+    [ -f "$git_dir/CHERRY_PICK_HEAD" ]                                   && cherry_pick_in_progress=true
+    [ -f "$git_dir/REVERT_HEAD" ]                                        && revert_in_progress=true
+    if ! $cherry_pick_in_progress && ! $revert_in_progress && [ -d "$git_dir/sequencer" ]; then
+        if grep -qE '^revert ' "$git_dir/sequencer/todo" 2>/dev/null; then
+            revert_in_progress=true
+        else
+            cherry_pick_in_progress=true
+        fi
+    fi
+    if $merge_in_progress; then printf 'merge'
+    elif $rebase_in_progress; then printf 'rebase'
+    elif $cherry_pick_in_progress; then printf 'cherry-pick'
+    elif $revert_in_progress; then printf 'revert'
+    fi
+    return 0
+}
+
 # ── detect_origin_available ───────────────────────────────────────────────────
 # Ajuste B2 (mismo guard que introdujo TASK-008 en
 # invoke_merge_work_branch_to_develop): la deteccion de origin estaba
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh
index d107acc..a5227f2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh
@@ -6,30 +6,9 @@ git_dir=$(git rev-parse --git-dir 2>/dev/null) || { log_error "No estás en un r
 current=$(git branch --show-current 2>/dev/null || echo "(detached HEAD)")
 
 # ── Detectar operación en curso ───────────────────────────────────────────────
-merge_in_progress=false
-rebase_in_progress=false
-cherry_pick_in_progress=false
-revert_in_progress=false
-[ -f "$git_dir/MERGE_HEAD" ]                                            && merge_in_progress=true
-{ [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; } && rebase_in_progress=true
-[ -f "$git_dir/CHERRY_PICK_HEAD" ]                                      && cherry_pick_in_progress=true
-[ -f "$git_dir/REVERT_HEAD" ]                                           && revert_in_progress=true
-
-# Una secuencia multi-commit puede quedar a medias SIN ninguno de los dos
-# testigos de arriba: si se resuelve el conflicto y se hace "git commit" a
-# mano en vez de "--continue", Git borra CHERRY_PICK_HEAD pero deja
-# .git/sequencer con los commits que faltan, y "--abort" sigue funcionando
-# (medido en git 2.55). El testigo ahí es el directorio; si alguna entrada
-# de su "todo" empieza por "revert " es un revert, y si no, un cherry-pick.
-# Se mira el fichero entero y no solo su primera línea: Git no mezcla los
-# dos verbos en una misma secuencia, así que basta con encontrar uno.
-if ! $cherry_pick_in_progress && ! $revert_in_progress && [ -d "$git_dir/sequencer" ]; then
-    if grep -qE '^revert ' "$git_dir/sequencer/todo" 2>/dev/null; then
-        revert_in_progress=true
-    else
-        cherry_pick_in_progress=true
-    fi
-fi
+# TASK-143c (SCR-07): la deteccion comun (con el caso del sequencer), sin
+# subshell para que queden puestos los cuatro *_in_progress.
+detect_operation_in_progress > /dev/null
 
 if ! $merge_in_progress && ! $rebase_in_progress \
    && ! $cherry_pick_in_progress && ! $revert_in_progress; then
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
index d23591b..35f8a4f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
@@ -57,26 +57,10 @@ fi
 
 stash_count=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
 
-git_dir=$(git rev-parse --git-dir 2>/dev/null)
-merge_in_progress=false; rebase_in_progress=false
-cherry_pick_in_progress=false; revert_in_progress=false
-[ -f "$git_dir/MERGE_HEAD" ]                                                && merge_in_progress=true
-{ [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; }      && rebase_in_progress=true
-# Los mismos cinco testigos que mira abort-merge.sh, y por el mismo motivo
-# (hallazgo IMPORTANTE de la revision por pares, TASK-029): diagnose se
-# quedo con merge y rebase, asi que decia "Sin operaciones en curso" con un
-# cherry-pick a medias — tres lineas encima de su propio "UU fichero" — y
-# contradecia a abort-merge sobre el mismo repo. Un diagnostico que no ve
-# lo que el resto de la herramienta si ve es peor que no diagnosticar.
-[ -f "$git_dir/CHERRY_PICK_HEAD" ]                                          && cherry_pick_in_progress=true
-[ -f "$git_dir/REVERT_HEAD" ]                                               && revert_in_progress=true
-if ! $cherry_pick_in_progress && ! $revert_in_progress && [ -d "$git_dir/sequencer" ]; then
-    if grep -qE '^revert ' "$git_dir/sequencer/todo" 2>/dev/null; then
-        revert_in_progress=true
-    else
-        cherry_pick_in_progress=true
-    fi
-fi
+# Los mismos testigos que abort-merge.sh (hallazgo IMPORTANTE de TASK-029:
+# diagnose miraba solo merge y rebase y contradecia a abort-merge). Desde
+# TASK-143c (SCR-07), de la misma funcion, sin subshell.
+detect_operation_in_progress > /dev/null
 
 # ── Informe ───────────────────────────────────────────────────────────────────
 bar=$(printf '━%.0s' {1..54})
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index f2edee5..531d184 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -117,6 +117,25 @@ const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
   release: 'merge-release-to-main.sh',
 };
 
+/**
+ * Argumentos del script de merge de finish. Todos llevan la rama de
+ * integracion (--develop). hotfix y release (con `mainBranch`) llevan la
+ * principal que finish ya resolvio (--main; TASK-143c, SCR-08: antes el script
+ * la resolvia otra vez, con otro ls-remote) y, si lo hay, el nombre del tag que
+ * pone el script en ella (--tag).
+ */
+export function argumentosScriptMerge(
+  rama: string,
+  ramaIntegracion: string,
+  mainBranch: string | null,
+  nombreTag: string | null
+): string[] {
+  const args = [rama, '--develop', ramaIntegracion];
+  if (mainBranch !== null) args.push('--main', mainBranch);
+  if (mainBranch !== null && nombreTag !== null) args.push('--tag', nombreTag);
+  return args;
+}
+
 /** hotfix/release mergean a main (con tag) y backmergean a la rama de integracion. */
 const MERGEA_A_MAIN: Record<Task['tipo'], boolean> = {
   feature: false,
@@ -725,12 +744,9 @@ async function runFinish(
     );
   } else {
     await puerta();
-    const argsScript = [rama, '--develop', ramaIntegracion];
-    // hotfix/release: el script pone el tag en main; --tag le da el nombre.
-    if (nombreTag !== null && mainBranch !== null) {
-      argsScript.push('--tag', nombreTag);
-      tagLoPusoElScript = true;
-    }
+    const argsScript = argumentosScriptMerge(rama, ramaIntegracion, mainBranch, nombreTag);
+    // hotfix/release con nombre: el tag lo pone el script en main (argumentosScriptMerge le pasa --tag).
+    tagLoPusoElScript = nombreTag !== null && mainBranch !== null;
     const { code, signal } = runGitflowScript(scriptName, argsScript, {
       scriptsDir: deps.scriptsDir,
       cwd: deps.repoCwd,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 74d474f..00bd1ca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -14,7 +14,7 @@ import { resolverConfig } from '../core/config.js';
 import { ocultarCredenciales } from '../core/plataforma-remota.js';
 import { EXTENSIONES_CODIGO, PATRON_GREP_DEFINICION } from '../core/candidatos-4d.js';
 import { CARPETAS_TEST, MARCAS_TEST } from '../core/menores.js';
-import { rutaGit } from './git-crudo.js';
+import { gitCrudo, rutaGit } from './git-crudo.js';
 
 export class GitCommandError extends Error {
   constructor(
@@ -203,11 +203,38 @@ export function isValidBranchName(name: string, cwd: string): boolean {
  * ya asume _gitflow-common.sh.
  */
 export function isRemoteAvailable(cwd: string): boolean {
-  const result = spawnSync('git', ['ls-remote', '--heads', 'origin'], { cwd, encoding: 'utf8' });
-  if (result.error) {
-    throw new GitLaunchError(result.error);
-  }
-  return result.status === 0;
+  return lsRemoto(['--heads', 'origin'], cwd).ok;
+}
+
+/**
+ * TASK-143c (SCR-08): limite de los `ls-remote`, en milisegundos. Lo marca
+ * GF_TIMEOUT_REMOTO (segundos enteros mayores que 0; 5 por defecto), la misma
+ * variable y el mismo valor que `_gf_ls_remote` de _gitflow-common.sh.
+ */
+export function timeoutRemotoMs(env: NodeJS.ProcessEnv = process.env): number {
+  const v = (env.GF_TIMEOUT_REMOTO ?? '').trim();
+  const n = /^\d+$/.test(v) ? Number(v) : 0;
+  return (n > 0 ? n : 5) * 1000;
+}
+
+/**
+ * TASK-143c (SCR-08): `git ls-remote` con el entorno de gitCrudo
+ * (GIT_TERMINAL_PROMPT=0: sin credenciales no se queda esperando una
+ * contrasena) y con limite de tiempo, como `_gf_ls_remote`. Antes cuatro
+ * spawnSync sin ninguna de las dos cosas: con la VPN caida, finish esperaba
+ * al timeout del sistema. Un limite agotado cuenta como remoto que no
+ * responde (ok false); no poder lanzar git sigue siendo GitLaunchError.
+ */
+function lsRemoto(args: readonly string[], cwd: string): { ok: boolean; salida: string; stderr: string } {
+  const ms = timeoutRemotoMs();
+  const r = gitCrudo(['ls-remote', ...args], cwd, { timeoutMs: ms });
+  const agotado = (r.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT';
+  if (r.error !== undefined && !agotado) throw new GitLaunchError(r.error);
+  return {
+    ok: r.error === undefined && r.status === 0,
+    salida: r.stdout.toString('utf8'),
+    stderr: agotado ? `sin respuesta de origin en ${String(ms / 1000)} s (GF_TIMEOUT_REMOTO)` : r.stderr,
+  };
 }
 
 /**
@@ -813,8 +840,9 @@ export function mensajeTareaEnOtraRama(id: string, rama: string): string {
 
 /** true si esa rama existe en "origin". Asume que ya se llamo isRemoteAvailable. */
 function remoteBranchExists(name: string, cwd: string): boolean {
-  const output = runGit(['ls-remote', '--heads', 'origin', name], cwd);
-  return output
+  const ls = lsRemoto(['--heads', 'origin', name], cwd);
+  if (!ls.ok) throw new GitCommandError(['ls-remote', '--heads', 'origin', name], ocultarCredenciales(ls.stderr));
+  return ls.salida
     .split('\n')
     .some((line) => line.trim().endsWith(`refs/heads/${name}`));
 }
@@ -1097,11 +1125,10 @@ export type TagRemoto =
 export function tagRemoto(nombre: string, cwd: string): TagRemoto {
   if (!hasOrigin(cwd)) return { estado: 'sin-origin' };
   const ref = `refs/tags/${nombre}`;
-  const result = spawnSync('git', ['ls-remote', '--tags', 'origin', ref, `${ref}^{}`], { cwd, encoding: 'utf8' });
-  if (result.error) throw new GitLaunchError(result.error);
-  if (result.status !== 0) return { estado: 'inalcanzable' };
+  const ls = lsRemoto(['--tags', 'origin', ref, `${ref}^{}`], cwd);
+  if (!ls.ok) return { estado: 'inalcanzable' };
   let sha: string | null = null;
-  for (const linea of (result.stdout ?? '').split(/\r?\n/)) {
+  for (const linea of ls.salida.split(/\r?\n/)) {
     const [oid, nombreRef] = linea.trim().split(/\s+/);
     // El anotado lista el objeto tag y, aparte, el commit con "^{}": manda el commit.
     if (oid !== undefined && nombreRef === `${ref}^{}`) return { estado: 'presente', commit: oid };
@@ -1152,10 +1179,9 @@ export function fastForwardDesde(ref: string, cwd: string): void {
  */
 export function ramaRemotaContiene(rama: string, commit: string, cwd: string): boolean {
   if (!hasOrigin(cwd)) return false;
-  const ls = spawnSync('git', ['ls-remote', '--heads', 'origin', `refs/heads/${rama}`], { cwd, encoding: 'utf8' });
-  if (ls.error) throw new GitLaunchError(ls.error);
-  if (ls.status !== 0) return false;
-  const punta = (ls.stdout ?? '').trim().split(/\s+/)[0];
+  const ls = lsRemoto(['--heads', 'origin', `refs/heads/${rama}`], cwd);
+  if (!ls.ok) return false;
+  const punta = ls.salida.trim().split(/\s+/)[0];
   if (punta === undefined || punta === '') return false;
   const anc = spawnSync('git', ['merge-base', '--is-ancestor', '--end-of-options', commit, punta], {
     cwd,
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-143c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143c/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143c/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143c/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                      | 24 ++++++++++++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                               | 60 ++++++++++++++++++++++++++++++++++++++++++------------------
 11 files changed, 68 insertions(+), 26 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/paridad-operacion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/perfil-tests.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/paridad-operacion.test.ts | 135 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/scripts/perfil-tests.test.ts      |  28 ++++++++++++++++++++++-
 2 files changed, 162 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 109.1 s
- Commit verificado: 99767cb42a96391e2064f866bc3a596eb4ef1971
- Huella: 7c878222092d9635b6e6680440d42f8fbda01a34
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 155650 bytes en total):

````
✔ config (TASK-100): un patron que casa con todo se rechaza (2.1931ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2572ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9206ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6646ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7882ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1124ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.2622ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (15.6658ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.663ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.329ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (2.9729ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (5.9212ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.7268ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.9575ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4612ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5977ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.6673ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — ninguna (2625.7377ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — merge (1764.1937ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — rebase (rebase-merge) (1993.4234ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — rebase (rebase-apply) (2275.5305ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — cherry-pick (2087.3148ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — revert (2192.7729ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — secuencia de revert sin REVERT_HEAD (2359.4117ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — secuencia de cherry-pick sin CHERRY_PICK_HEAD (2367.3651ms)
✔ operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — merge y cherry-pick a la vez (manda merge) (1414.2457ms)
✔ isRemoteAvailable (TASK-143c, SCR-08): con origin que no responde vuelve false dentro de GF_TIMEOUT_REMOTO (4389.5629ms)
✔ timeoutRemotoMs (TASK-143c, SCR-08): GF_TIMEOUT_REMOTO en segundos, 5 por defecto o si no es un entero mayor que 0 (0.7619ms)
✔ argumentosScriptMerge (TASK-143c, SCR-08): hotfix y release llevan --main con la principal ya resuelta (1.2138ms)
✔ cuenta por fichero los tests y los procesos git (desde node y desde bash), y la duracion (11328.9122ms)
✔ perfil-tests (TASK-143c, SCR-13): compila con dist/src protegido y lo devuelve tal cual (5456.9396ms)
ℹ tests 776
ℹ suites 0
ℹ pass 776
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 96587.0914
[verificar-impacto] node --test termino con 0 en 96.7 s.
````
