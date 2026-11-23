# Peticion de revision — TASK-149a (ronda 2)

- Tarea: TASK-149a — git y hooks (parte a de TASK-149)
- Rama revisada: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
- Rama base: develop
- Commit revisado (HEAD): 7e2d3ad9a07e93978e33a2f53c40368000748ec4
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-149a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 89caf6373f9bb5b5b5953bf997e2a5e51b990d2e (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (6 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu
tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion
   ya trae la verificacion de la ronda en verde para ese mismo commit, no la
   repitas: cita ese resultado y corre solo los tests de lo que verificas.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-149a/tarea.md
- tareas/03-en-revision/TASK-149a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 4 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/fs/git-crudo.ts (ramaActual, rebase-apply), test/fs/git-crudo-comun.test.ts | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | src/hooks/freno-stop.ts, src/hooks/guardia-merge.ts, test/hooks | informe-revision-1.md |

## Commits a revisar (git log 89caf6373f9bb5b5b5953bf997e2a5e51b990d2e..HEAD)

````
7e2d3ad chore(TASK-149a): autorrevision ronda 2
edeabfe fix(TASK-149a): correcciones de la ronda 1 (rebase con test, restos de git sin lanzar)
1b1de3b chore(TASK-149a): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 89caf6373f9bb5b5b5953bf997e2a5e51b990d2e..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index 482486d..38a4ac2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -21,7 +21,7 @@ import { randomBytes } from 'node:crypto';
 import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
 import path from 'node:path';
 import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
-import { runGit } from '../fs/git.js';
+import { rutaGitObligatoria } from '../fs/git.js';
 import { isEexist, isEnoent } from '../fs/task-store.js';
 import { isValidTaskId } from '../core/task.js';
 
@@ -49,7 +49,7 @@ export type CadenaCommandResult =
 
 /** Ruta absoluta del bloqueo, en el directorio de Git de este arbol. */
 export function rutaBloqueo(repoCwd: string): string {
-  return path.resolve(repoCwd, runGit(['rev-parse', '--git-path', 'taskcode/cadena.lock'], repoCwd));
+  return rutaGitObligatoria(repoCwd, 'taskcode/cadena.lock');
 }
 
 /** Forma de un testigo valido: el que genera `abrir` (MEN-2: un vacio no puede casar con nada). */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts
index 5ca54d3..e41659e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts
@@ -7,10 +7,10 @@
  * Sin fichero en esa referencia, la configuracion por defecto. Un fichero
  * invalido lanza ConfigError: quien la usa decide el mensaje.
  */
-import { spawnSync } from 'node:child_process';
+import { gitTexto } from './git-crudo.js';
 import { parsearConfig, type TaskcodeConfig } from '../core/config.js';
 
 export function configDeRef(ref: string, cwd: string): TaskcodeConfig {
-  const r = spawnSync('git', ['show', `${ref}:.taskcode/config.yml`], { cwd, encoding: 'utf8', windowsHide: true });
-  return parsearConfig(r.status === 0 ? (r.stdout ?? '') : '', `${ref}:.taskcode/config.yml`);
+  // TASK-149a (MEN-2): con gitTexto (64 MB de buffer, no 1 MB que cortaria en silencio).
+  return parsearConfig(gitTexto(['show', `${ref}:.taskcode/config.yml`], cwd) ?? '', `${ref}:.taskcode/config.yml`);
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
index 8cca1cc..fe47763 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
@@ -14,6 +14,7 @@ import { closeSync, fstatSync, mkdtempSync, openSync, readFileSync, readSync, rm
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
+import { gitCrudo } from './git-crudo.js';
 
 /** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
 export const CODIGO_TIMEOUT_ENVOLTORIO = 124;
@@ -205,15 +206,12 @@ export function fotoDelArbol(raiz: string): Map<string, string> {
   // Sin runGit a proposito: recorta la salida, y el recorte se come el
   // espacio inicial de la primera entrada (" M ruta"), desplazando la
   // ruta un caracter.
-  const r = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
-    cwd: raiz,
-    encoding: 'utf8',
-    maxBuffer: 64 * 1024 * 1024,
-  });
-  if (r.status !== 0) {
-    throw new Error(`git status fallo: ${String(r.stderr ?? '').trim()}`);
+  // TASK-149a (MEN-2): sobre gitCrudo, que no recorta la salida.
+  const r = gitCrudo(['status', '--porcelain', '-z', '--untracked-files=all'], raiz);
+  if (r.error !== undefined || r.status !== 0) {
+    throw new Error(`git status fallo: ${(r.error?.message ?? r.stderr).trim()}`);
   }
-  const salida = r.stdout ?? '';
+  const salida = r.stdout.toString('utf8');
   const foto = new Map<string, string>();
   const entradas = salida.split('\0');
   for (let i = 0; i < entradas.length; i++) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
index 0f57c67..a41b7e8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
@@ -1,8 +1,9 @@
 /**
- * `git` sin lanzar nunca y con la salida en bruto (`Buffer`), para
- * `taskctl doctor-deploy` (TASK-066): el recorrido del historial lee blobs que
- * pueden no ser UTF-8, y un fallo de Git tiene que poder convertirse en
- * «NO VERIFICADO» en vez de en una excepcion.
+ * `git` sin lanzar nunca. Nacio para `taskctl doctor-deploy` (TASK-066: salida
+ * en bruto, blobs que pueden no ser UTF-8, un fallo convertible en «NO
+ * VERIFICADO»). Desde TASK-149a es el unico envoltorio de git sin lanzar de fs
+ * y hooks: texto, linea, resultado, ok, ruta bajo el directorio de Git y rama
+ * actual. El `git` que lanza (GitCommandError) es runGit de fs/git.ts.
  */
 import { existsSync, readFileSync } from 'node:fs';
 import path from 'node:path';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 3564d17..3d3dfe2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -13,6 +13,7 @@ import type { Task } from '../core/task.js';
 import { resolverConfig } from '../core/config.js';
 import { ocultarCredenciales } from '../core/plataforma-remota.js';
 import { EXTENSIONES_CODIGO, PATRON_GREP_DEFINICION } from '../core/candidatos-4d.js';
+import { rutaGit } from './git-crudo.js';
 
 export class GitCommandError extends Error {
   constructor(
@@ -133,8 +134,7 @@ export type OperacionGitEnCurso = 'merge' | 'rebase' | 'cherry-pick' | 'revert';
  *   No hay nada que abortar y aqui se devuelve null, igual que Git.
  */
 export function operacionEnCurso(cwd: string): OperacionGitEnCurso | null {
-  const gitPath = (nombre: string): string =>
-    path.resolve(cwd, runGit(['rev-parse', '--git-path', nombre], cwd));
+  const gitPath = (nombre: string): string => rutaGitObligatoria(cwd, nombre);
   if (existsSync(gitPath('MERGE_HEAD'))) return 'merge';
   if (existsSync(gitPath('rebase-merge')) || existsSync(gitPath('rebase-apply'))) return 'rebase';
   if (existsSync(gitPath('CHERRY_PICK_HEAD'))) return 'cherry-pick';
@@ -158,6 +158,18 @@ export function operacionEnCurso(cwd: string): OperacionGitEnCurso | null {
   return null;
 }
 
+/**
+ * TASK-149a (MEN-1 de su revision): `rutaGit` para quien lanza fuera de un
+ * repo. Si no hay ruta, `rev-parse --git-dir` lanza el GitCommandError de
+ * siempre (y si no lanzara, se lanza aqui).
+ */
+export function rutaGitObligatoria(cwd: string, ruta: string): string {
+  const r = rutaGit(cwd, ruta);
+  if (r !== null) return r;
+  runGit(['rev-parse', '--git-dir'], cwd);
+  throw new GitCommandError(['rev-parse', '--git-path', ruta], 'sin ruta en el directorio de Git');
+}
+
 /** Nombre de la rama activa (equivalente a `git branch --show-current`). */
 export function currentBranch(cwd: string): string {
   return runGit(['branch', '--show-current'], cwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
index b65360b..f2d40a2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
@@ -35,7 +35,7 @@
  */
 import { existsSync, readdirSync, rmSync } from 'node:fs';
 import path from 'node:path';
-import { gitOk as runGitOk } from './git-crudo.js';
+import { gitOk } from './git-crudo.js';
 import { raizDelRepo, type TaskcodeConfig } from '../core/config.js';
 import { runGit } from './git.js';
 import { ejecutarAcotado, fotoDelArbol, fueCortado, type SalidaEjecucion } from './ejecucion-acotada.js';
@@ -209,7 +209,7 @@ export function sincronizacionFallidaAlPreparar(
     // Desprepararla primero: si el add llego a meterla en el indice,
     // restaurar solo el arbol la dejaria en "A"/"M" y el siguiente
     // comando abortaria por workspace sucio.
-    runGitOk(['reset', '-q', '--', r], raiz);
+    gitOk(['reset', '-q', '--', r], raiz);
   }
   restaurarAHead(raiz, declaradas);
   const comando = config.comando_sincronizacion ?? '';
@@ -230,7 +230,7 @@ export function sincronizacionFallidaAlPreparar(
  */
 function motivoNoCommiteable(raiz: string, rutas: readonly string[]): string | null {
   for (const r of rutas) {
-    if (runGitOk(['check-ignore', '-q', '--', r], raiz)) {
+    if (gitOk(['check-ignore', '-q', '--', r], raiz)) {
       return `escribio ${r}, pero esa ruta esta en .gitignore y Git no la commitearia`;
     }
     const real = nombreRealEnDisco(raiz, r);
@@ -317,7 +317,7 @@ function restaurarAHead(
     // antes de ejecutar, es trabajo de la persona (en un disco que si
     // distingue mayusculas es OTRO fichero): no se toca.
     if (objetivo !== r && antes.has(objetivo)) continue;
-    if (runGitOk(['cat-file', '-e', `HEAD:${objetivo}`], raiz)) {
+    if (gitOk(['cat-file', '-e', `HEAD:${objetivo}`], raiz)) {
       runGit(['checkout', 'HEAD', '--', objetivo], raiz);
     } else if (!antes.has(objetivo)) {
       const abs = path.join(raiz, objetivo);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index f705be7..1e74d62 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -28,7 +28,7 @@
 import { createHash, type Hash } from 'node:crypto';
 import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
 import path from 'node:path';
-import { gitLinea as git, rutaGit } from './git-crudo.js';
+import { gitLinea, rutaGit } from './git-crudo.js';
 import { ejecutarAcotado, fotoDelArbol, fueCortado, MARCA_TIMEOUT } from './ejecucion-acotada.js';
 import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 
@@ -116,7 +116,7 @@ export function huellaDelArbol(
   timeoutS: number,
   contexto?: string
 ): string | null {
-  const head = git(['rev-parse', 'HEAD'], raiz);
+  const head = gitLinea(['rev-parse', 'HEAD'], raiz);
   if (head === null) return null;
   let foto: Map<string, string>;
   try {
@@ -148,7 +148,7 @@ export function huellaDeCommit(
   timeoutS: number,
   contexto?: string
 ): string | null {
-  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`], raiz);
+  const sha = gitLinea(['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`], raiz);
   if (sha === null || sha === '') return null;
   return cabeceraDeHuella(sha, comando, timeoutS, contexto).digest('hex');
 }
@@ -250,7 +250,7 @@ export interface VerificacionConMemo {
  * la misma cadena que guarda `verificarConMemo`, no una copia.
  */
 export function contextoSelectiva(raiz: string, base: string): string {
-  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${base}^{commit}`], raiz) ?? '';
+  const sha = gitLinea(['rev-parse', '--verify', '--quiet', '--end-of-options', `${base}^{commit}`], raiz) ?? '';
   return `selectiva\0${base}\0${sha}`;
 }
 
@@ -303,7 +303,7 @@ export function verificarConMemo(
   const conBase = conRamaBase(p);
   const contexto = contextoDePeticion(raiz, p);
   const huella = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
-  const commit = git(['rev-parse', 'HEAD'], raiz)?.trim() || null;
+  const commit = gitLinea(['rev-parse', 'HEAD'], raiz)?.trim() || null;
   const guardado = huella === null ? null : leerMemo(raiz, huella, p.tipo);
   if (guardado !== null && (p.memoSoloVerde !== true || guardado.estado === 'verde')) {
     return { resultado: guardado, deMemo: true, cambioElArbol: false, commit, huella };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index d7c4e1e..afc8e66 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -12,8 +12,8 @@
  *   3. `tareas/02-en-curso/` no existe en la raiz del repo (solo `stat`).
  *   4. Ninguna tarea en curso (lectura de esa carpeta).
  *   5. Config: sin `comando_verificacion`, nada. Config invalida: se recuerda.
- *   6. La rama actual (el unico `git`) no es la `rama` de ninguna tarea en
- *      curso: nada. HEAD desacoplado cae aqui (aceptado en el plan).
+ *   6. La rama actual (el primer `git`; durante un rebase, la que se rebasa) no es la `rama` de ninguna tarea en
+ *      curso: nada. HEAD desacoplado sin rebase cae aqui (aceptado en el plan).
  *   7. Config invalida con tarea en curso en la rama: BLOQUEA (decision de
  *      Carlos: fallo cerrado, como el resto de la config).
  *   8. Memo: misma huella del arbol que el ultimo verde del freno (TASK-111)
@@ -154,7 +154,7 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       errorConfig = e.message.replace(/^\[ERROR\]\s*/, '');
     }
 
-    // 6: el unico git hasta aqui.
+    // 6: los primeros git (branch --show-current y, en un rebase, rev-parse --git-path).
     rama = ramaActual(raiz);
     if (rama === null || !ramas.has(rama)) return sinLeer;
     const deEstaRama = tareas.filter((t) => t.task.rama === rama);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 0bdc770..22db213 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -44,7 +44,7 @@ import { ConfigError, raizDelRepo, resolverConfigConAvisos, timeoutEfectivoS, ty
 import { huellaDeCommit, huellaDelArbol, leerMemo } from '../fs/verificacion.js';
 import { comandoSoloIntegra } from '../core/comando-merge.js';
 import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
-import { gitResultado as git, ramaActual } from '../fs/git-crudo.js';
+import { gitResultado, ramaActual } from '../fs/git-crudo.js';
 
 import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
 
@@ -74,7 +74,7 @@ export function comandoCandidato(entrada: EntradaPreToolUse): string | null {
 export const INVOCA_GIT_O_CIERRE = /\bgit\b|merge-[a-z]+-to-[a-z]+\.sh/i;
 
 function existeRef(ref: string, cwd: string): boolean {
-  return git(['rev-parse', '--verify', '--quiet', ref], cwd).ok;
+  return gitResultado(['rev-parse', '--verify', '--quiet', ref], cwd).ok;
 }
 
 /** La principal sin red: main o master en local (resolveMainBranch consulta origin). */
@@ -85,7 +85,7 @@ function ramaPrincipal(cwd: string): string | null {
 }
 
 function esAncestro(a: string, b: string, cwd: string): boolean {
-  return git(['merge-base', '--is-ancestor', '--end-of-options', a, b], cwd).ok;
+  return gitResultado(['merge-base', '--is-ancestor', '--end-of-options', a, b], cwd).ok;
 }
 
 interface Integracion {
@@ -135,7 +135,7 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
     return (
       existeRef(`refs/heads/${n}`, cwd) ||
       existeRef(`refs/remotes/origin/${n}`, cwd) ||
-      git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${n}^{commit}`], cwd).ok
+      gitResultado(['rev-parse', '--verify', '--quiet', '--end-of-options', `${n}^{commit}`], cwd).ok
     );
   };
   const ops = analizarComando(comando, esRevision);
@@ -226,7 +226,7 @@ function integraciones(op: OperacionMerge, raiz: string, integracion: string, pr
 function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig, contexto: ContextoComando): string | null {
   const { fuente, destino, raiz } = integ;
   const comando = config.comando_verificacion as string;
-  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${fuente}^{commit}`], raiz);
+  const sha = gitResultado(['rev-parse', '--verify', '--quiet', '--end-of-options', `${fuente}^{commit}`], raiz);
   if (!sha.ok || sha.out === '') {
     return mensaje(fuente, null, destino, comando, `no se puede resolver "${fuente}" a un commit`);
   }
@@ -403,7 +403,7 @@ function decidirCierreDeMerge(comando: string, cwd: string): DecisionPreToolUse
     let config: TaskcodeConfig;
     try {
       raiz = raizDelRepo(dir === null ? cwd : path.resolve(cwd, dir));
-      const mh = git(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD'], raiz);
+      const mh = gitResultado(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD'], raiz);
       if (!mh.ok || mh.out === '') continue;
       sha = mh.out;
       rama = ramaActual(raiz) ?? '';
````

## Excluido del diff (20 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 89caf6373f9bb5b5b5953bf997e2a5e51b990d2e..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-149a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149a/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-149a/revision/informe-revision-1.md                                                  |  21 +++
 tareas/03-en-revision/TASK-149a/revision/peticion-revision-1.md                                                 | 717 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-149a/tarea.md                                                       |  16 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                                        |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/config-de-ref.js                                       |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/ejecucion-acotada.js                                   |  14 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-crudo.js                                           |   9 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                                 |  15 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sincronizacion.js                                      |   8 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                        |  10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                       |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                    |  12 +-
 20 files changed, 799 insertions(+), 39 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 89caf6373f9bb5b5b5953bf997e2a5e51b990d2e..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts   | 17 +++++++++++++++++
 2 files changed, 23 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 179.0 s
- Commit verificado: 7e2d3ad9a07e93978e33a2f53c40368000748ec4
- Huella: 7fd8e68aa9fcabbe28e0bb04ebc8b6cb92d37378
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 105965 bytes en total):

````
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7201ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.3881ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.786ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.6969ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (14.1342ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.4336ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.824ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.7741ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (2.0323ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8632ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (4.3666ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (1.317ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.436ms)
✔ ramaActual: la rama; con HEAD desacoplado, null; durante un rebase, la que se rebasa; fuera de un repo, null (2722.4956ms)
✔ rutaGit: absoluta bajo el directorio de Git (aunque cwd sea un subdirectorio); fuera de un repo, null; gitOk (1431.43ms)
✔ parsearEntradaHook: objeto tal cual; JSON roto, vacio, array o escalar, sin campos (2.2293ms)
✔ los hooks de coste y de merges no cargan el modulo del freno (ni directa ni indirectamente) (535.74ms)
✔ freno: decisiones de parar, bloquear o no hacer nada segun verificacion, tarea y config (25339.6613ms)
✔ freno: timeouts, memo por huella, cola acotada y punto de entrada real (25423.2687ms)
✔ freno: unitarios del informe, del timeout efectivo y de hooks.json (2339.6392ms)
✔ heldout-ruta: normaliza mayusculas, barras invertidas, .., relativas y absolutas de Windows y git-bash (6.8481ms)
✔ heldout-ruta: el texto de un comando de shell, palabra a palabra (1.3136ms)
✔ heldout-rama: el numero de tarea sale del nombre de la rama (0.6842ms)
✔ guardia-heldout (criterio 1): cada herramienta de fichero sale 2 ante la carpeta de la tarea de la rama actual y 0 ante sus hermanas (13386.3378ms)
✔ guardia-heldout (criterio 4): rutas relativas, con .., mayusculas y barras invertidas, resueltas contra el cwd (3751.0693ms)
✔ guardia-heldout (criterio 2): el guardian de Bash/PowerShell bloquea los comandos que nombran la carpeta (4751.9596ms)
✔ guardia-heldout (criterio 3): en la rama base (diseño) no bloquea; al cambiar a la rama de la tarea, si (5528.0426ms)
✔ guardia-heldout (MEN-4 de la revision): el mensaje nombra el ID con su relleno, TASK-042 y no TASK-42 (2008.2539ms)
✔ guardia-heldout: con HEAD desacoplado en un rebase, la rama es la que se esta rebasando (3523.9297ms)
✔ guardia-heldout: un fallo propio deja pasar (sin repo, cwd inexistente, JSON roto) (797.454ms)
✔ guardia-heldout: hooks.json declara el matcher de fichero exacto y ningun matcher incluye Agent ni Task (1.665ms)
ℹ tests 766
ℹ suites 0
ℹ pass 766
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 165911.2141
[verificar-impacto] node --test termino con 0 en 166.0 s.
````
