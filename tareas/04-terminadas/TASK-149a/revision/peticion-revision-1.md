# Peticion de revision — TASK-149a (ronda 1)

- Tarea: TASK-149a — git y hooks (parte a de TASK-149)
- Rama revisada: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
- Rama base: develop
- Commit revisado (HEAD): 89caf6373f9bb5b5b5953bf997e2a5e51b990d2e
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-149a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-149a/tarea.md
- tareas/03-en-revision/TASK-149a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts

## Commits a revisar (git log develop..HEAD)

````
89caf63 chore(TASK-149a): autorrevision
1140c91 fix(TASK-149a): un envoltorio de git, una rama actual, un --git-path y un parser de hooks
775fad1 chore(TASK-149a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 7a16485..2f9cd2c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -314,6 +314,21 @@ export type TipoRamaPesada = (typeof TIPOS_RAMA_PESADA)[number];
  * presupuesto del freno no puede pasarlo (el hook se cancelaria antes).
  */
 export const TECHO_HOOK_STOP_S = 3600;
+/** Margen, en segundos, que se deja al hook Stop para escribir su informe tras cortar la verificacion. */
+export const MARGEN_HOOK_S = 60;
+
+/**
+ * Segundos que se le dan a la verificacion: `timeout_verificacion`, pero nunca
+ * mas que el `timeout` del hook menos el margen. Si el hook agotara el suyo,
+ * Claude Code descartaria el informe y el freno fallaria abierto. TASK-149a
+ * (FS-17): vive aqui para que guardia-merge no cargue el grafo del freno.
+ */
+export function timeoutEfectivoS(timeoutVerificacion: number): { timeoutS: number; recortado: boolean } {
+  const techo = TECHO_HOOK_STOP_S - MARGEN_HOOK_S;
+  return timeoutVerificacion > techo
+    ? { timeoutS: techo, recortado: true }
+    : { timeoutS: timeoutVerificacion, recortado: false };
+}
 /** TASK-125: presupuesto del freno cuando se declara su comando sin presupuesto. */
 export const PRESUPUESTO_FRENO_POR_DEFECTO_S = 180;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts
index db344a6..e2c0b9f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts
@@ -21,7 +21,7 @@
  */
 import { appendFileSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
+import { rutaGit } from './git-crudo.js';
 import type { TipoFuente } from '../core/coste-automatico.js';
 
 export const FICHERO_LIBRO = 'coste-pendiente.jsonl';
@@ -38,10 +38,7 @@ export interface EntradaPendiente {
 
 /** Ruta absoluta del libro, o null fuera de un repo Git. */
 export function rutaLibro(raiz: string): string | null {
-  const r = spawnSync('git', ['rev-parse', '--git-path', FICHERO_LIBRO], { cwd: raiz, encoding: 'utf8', windowsHide: true });
-  if (r.error !== undefined || r.status !== 0) return null;
-  const p = (r.stdout ?? '').trim();
-  return p === '' ? null : path.resolve(raiz, p);
+  return rutaGit(raiz, FICHERO_LIBRO);
 }
 
 /** Añade las entradas al libro. Lanza si no puede escribir: quien llama decide si eso importa. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts
index c5d0d4b..d76f772 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts
@@ -11,19 +11,12 @@
  */
 import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
+import { rutaGit } from './git-crudo.js';
 
 const VERSION = 1;
 
 function rutaUltimoVerde(raiz: string): string | null {
-  const r = spawnSync('git', ['rev-parse', '--git-path', 'taskcode/freno-ultimo-verde.json'], {
-    cwd: raiz,
-    encoding: 'utf8',
-    windowsHide: true,
-  });
-  const salida = (r.stdout ?? '').trim();
-  if (r.error !== undefined || r.status !== 0 || salida === '') return null;
-  return path.resolve(raiz, salida);
+  return rutaGit(raiz, 'taskcode/freno-ultimo-verde.json');
 }
 
 /** true si `huella` es la del ultimo verde del freno para ese tipo de verificacion. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
index 8d68ce7..0f57c67 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
@@ -4,6 +4,8 @@
  * pueden no ser UTF-8, y un fallo de Git tiene que poder convertirse en
  * «NO VERIFICADO» en vez de en una excepcion.
  */
+import { existsSync, readFileSync } from 'node:fs';
+import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 
 export interface SalidaGitCruda {
@@ -30,6 +32,7 @@ export function gitCrudo(args: readonly string[], cwd: string, opciones: Opcione
     maxBuffer: opciones.maxBuffer ?? MAX_BUFFER_POR_DEFECTO,
     timeout: opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS,
     stdio: ['pipe', 'pipe', 'pipe'],
+    windowsHide: true,
     env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
   });
   return {
@@ -46,3 +49,52 @@ export function gitTexto(args: readonly string[], cwd: string, opciones: Opcione
   if (r.error !== undefined || r.status !== 0) return null;
   return r.stdout.toString('utf8');
 }
+
+// TASK-149a (FS-07): los envoltorios de git sin lanzar de fs y hooks son estos,
+// todos sobre gitCrudo (un maxBuffer, un timeout y un entorno).
+
+/** La salida recortada de un `git` que acabo bien, o null si fallo. */
+export function gitLinea(args: readonly string[], cwd: string): string | null {
+  const t = gitTexto(args, cwd);
+  return t === null ? null : t.trim();
+}
+
+/** Si el `git` acabo bien y su salida recortada ('' si fallo): la forma de los guardianes. */
+export function gitResultado(args: readonly string[], cwd: string): { ok: boolean; out: string } {
+  const t = gitLinea(args, cwd);
+  return { ok: t !== null, out: t ?? '' };
+}
+
+/** true si el `git` acabo bien. */
+export function gitOk(args: readonly string[], cwd: string): boolean {
+  return gitLinea(args, cwd) !== null;
+}
+
+/**
+ * TASK-149a (FS-08): ruta absoluta de `ruta` dentro del directorio de Git
+ * (`git rev-parse --git-path`, por worktree), o null fuera de un repo.
+ * `--git-path` responde relativa al cwd de Git, por eso se resuelve contra `cwd`.
+ */
+export function rutaGit(cwd: string, ruta: string): string | null {
+  const p = gitLinea(['rev-parse', '--git-path', ruta], cwd);
+  return p === null || p === '' ? null : path.resolve(cwd, p);
+}
+
+/**
+ * TASK-149a (FS-06): la rama actual. Con HEAD desacoplado durante un rebase,
+ * la que se esta rebasando (la tarea sigue protegida). null fuera de un repo
+ * o con HEAD desacoplado sin rebase.
+ */
+export function ramaActual(cwd: string): string | null {
+  const actual = gitLinea(['branch', '--show-current'], cwd);
+  if (actual === null) return null;
+  if (actual !== '') return actual;
+  for (const f of ['rebase-merge/head-name', 'rebase-apply/head-name']) {
+    const fichero = rutaGit(cwd, f);
+    if (fichero !== null && existsSync(fichero)) {
+      const rama = readFileSync(fichero, 'utf8').trim().replace(/^refs\/heads\//, '');
+      return rama === '' ? null : rama;
+    }
+  }
+  return null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
index 232dfaf..fbd2542 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
@@ -15,9 +15,8 @@
  * (`recuperarApartado`), antes de leer la tarea: el veredicto vive en lo
  * apartado.
  */
-import { existsSync } from 'node:fs';
 import path from 'node:path';
-import { GitCommandError, currentBranch, runGit } from './git.js';
+import { GitCommandError, currentBranch, operacionEnCurso, runGit } from './git.js';
 
 export class PendientesError extends Error {}
 
@@ -184,7 +183,7 @@ export function apartarPendientes(cwd: string, tareasRoot: string, id: string):
       if (!activo) return null;
       // Ni con un merge a medias ni en otra rama (MEN-2 de la revision): ahi
       // lo pendiente quedaria sucio donde no toca y un commit a mano lo barreria.
-      if (existsSync(path.resolve(cwd, runGit(['rev-parse', '--git-path', 'MERGE_HEAD'], cwd)))) {
+      if (operacionEnCurso(cwd) === 'merge') {
         return comoRecuperar(id, rama);
       }
       if (currentBranch(cwd) !== rama) return comoRecuperar(id, rama);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
index e458080..61bdef3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
@@ -6,19 +6,12 @@
  */
 import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
+import { rutaGit } from './git-crudo.js';
 import { formatearLineaPuerta, parsearRegistroPuertas, type LineaPuerta } from '../core/registro-puertas.js';
 
 /** Ruta absoluta del registro, o null si `cwd` no esta en un repo. */
 export function rutaRegistroPuertas(cwd: string): string | null {
-  const r = spawnSync('git', ['rev-parse', '--git-path', 'taskcode/puertas.log'], {
-    cwd,
-    encoding: 'utf8',
-    windowsHide: true,
-  });
-  const salida = (r.stdout ?? '').trim();
-  if (r.error !== undefined || r.status !== 0 || salida === '') return null;
-  return path.resolve(cwd, salida);
+  return rutaGit(cwd, 'taskcode/puertas.log');
 }
 
 /** Anade una linea. Nunca lanza: un registro que no se puede escribir no tumba una transicion. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
index bf9f8d4..b65360b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
@@ -35,7 +35,7 @@
  */
 import { existsSync, readdirSync, rmSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
+import { gitOk as runGitOk } from './git-crudo.js';
 import { raizDelRepo, type TaskcodeConfig } from '../core/config.js';
 import { runGit } from './git.js';
 import { ejecutarAcotado, fotoDelArbol, fueCortado, type SalidaEjecucion } from './ejecucion-acotada.js';
@@ -326,6 +326,4 @@ function restaurarAHead(
   }
 }
 
-function runGitOk(args: readonly string[], cwd: string): boolean {
-  return spawnSync('git', args, { cwd, encoding: 'utf8' }).status === 0;
-}
+
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
index a7e25a8..57f3b85 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
@@ -11,7 +11,7 @@
  * como argumento de CLI (plan, approve, start...) un id sin sanear
  * como "../../etc" podria escapar de tareasRoot.
  */
-import { existsSync } from 'node:fs';
+import { existsSync, statSync } from 'node:fs';
 import { readdir, readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
 import path from 'node:path';
 import {
@@ -26,6 +26,16 @@ import { parseTareaFile, serializeTareaFile } from '../core/tarea-file.js';
 
 const ALL_STATE_FOLDERS: readonly string[] = Object.values(STATE_FOLDER);
 
+/** El directorio de tareas en curso, si existe. Sin procesos (lo usan los hooks). */
+export function carpetaEnCurso(raiz: string): string | null {
+  const dir = path.join(raiz, 'tareas', STATE_FOLDER['en-curso']);
+  try {
+    return statSync(dir).isDirectory() ? dir : null;
+  } catch {
+    return null;
+  }
+}
+
 export async function listExistingTaskIds(tareasRoot: string): Promise<string[]> {
   const ids: string[] = [];
   for (const folder of ALL_STATE_FOLDERS) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index eb3ac77..f705be7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -28,7 +28,7 @@
 import { createHash, type Hash } from 'node:crypto';
 import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
+import { gitLinea as git, rutaGit } from './git-crudo.js';
 import { ejecutarAcotado, fotoDelArbol, fueCortado, MARCA_TIMEOUT } from './ejecucion-acotada.js';
 import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 
@@ -104,12 +104,6 @@ export function ejecutarVerificacion(
 // Huella y memo
 // ---------------------------------------------------------------------
 
-function git(args: readonly string[], cwd: string): string | null {
-  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
-  if (r.error !== undefined || r.status !== 0) return null;
-  return (r.stdout ?? '').trim();
-}
-
 /**
  * Huella del estado que la verificacion ve: HEAD, el comando, su timeout y
  * el contenido de cada fichero que no esta limpio (incluidos los no
@@ -179,9 +173,7 @@ export interface MemoVerificacion {
 }
 
 function rutaMemo(raiz: string, tipo: TipoVerificacion): string | null {
-  const p = git(['rev-parse', '--git-path', FICHEROS_MEMO[tipo]], raiz);
-  if (p === null || p === '') return null;
-  return path.resolve(raiz, p);
+  return rutaGit(raiz, FICHEROS_MEMO[tipo]);
 }
 
 /** El resultado guardado para esa huella, o null. Un memo ilegible es como no tenerlo. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
index 4e79ea5..2c41ad6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
@@ -1,7 +1,9 @@
 /**
- * La entrada y la decision de un hook `PreToolUse`, compartidas por los
- * guardianes (merges, held-out). Sin dependencias: el guardian de held-out
- * corre antes de herramientas de fichero y no debe cargar el de merges.
+ * Lo comun de los hooks: la entrada y la decision de un `PreToolUse`
+ * (guardianes de merges y held-out), el parser del JSON de cualquier hook
+ * (tambien Stop y el registro de coste, TASK-149a FS-05) y el techo de tiempo
+ * de un hook. Sin dependencias: los hooks corren en cada herramienta y no deben
+ * cargar el grafo del freno (FS-17).
  */
 
 export interface EntradaPreToolUse {
@@ -17,12 +19,17 @@ export interface DecisionPreToolUse {
 
 export const PASAR: DecisionPreToolUse = Object.freeze({ codigo: 0, stderr: '' });
 
-/** El JSON del hook. Un JSON roto o vacio es una entrada sin campos. */
-export function parsearEntradaPreToolUse(texto: string): EntradaPreToolUse {
+/** El JSON de un hook (stdin entero). Un JSON roto, vacio o que no es un objeto es una entrada sin campos. */
+export function parsearEntradaHook<T extends object>(texto: string): T {
   try {
     const v: unknown = JSON.parse(texto);
-    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaPreToolUse) : {};
+    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as T) : ({} as T);
   } catch {
-    return {};
+    return {} as T;
   }
 }
+
+/** El JSON del hook `PreToolUse`. */
+export function parsearEntradaPreToolUse(texto: string): EntradaPreToolUse {
+  return parsearEntradaHook<EntradaPreToolUse>(texto);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index bbc65a8..d7c4e1e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -45,22 +45,24 @@
  * bloquea, asi que nunca se sale con 1 por accidente: decidirStop no lanza.
  * Nada de lo que escribe nombra el producto: lo leen proyectos ajenos.
  */
-import { existsSync, statSync } from 'node:fs';
+import { existsSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
 import {
   ConfigError,
   presupuestoFreno,
   raizDelRepo,
   resolverConfigConAvisos,
   TECHO_HOOK_STOP_S,
+  timeoutEfectivoS,
   type TaskcodeConfig,
 } from '../core/config.js';
 import { formatearVerificacionRoja, type ResultadoVerificacion } from '../core/informe-verificacion.js';
 import type { Task } from '../core/task.js';
 import { peticionDeTrabajo } from '../fs/decision-documentacion.js';
 import { baseDeTipoSinRed, resolveBaseBranchForTipo } from '../fs/git.js';
-import { listTareasEnEstados } from '../fs/task-store.js';
+import { carpetaEnCurso, listTareasEnEstados } from '../fs/task-store.js';
+import { ramaActual } from '../fs/git-crudo.js';
+import { parsearEntradaHook } from './entrada-pretooluse.js';
 import { contextoDePeticion, huellaDelArbol, verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
 import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { PUERTA_FRENO, type LineaPuerta, type ResultadoFreno } from '../core/registro-puertas.js';
@@ -74,7 +76,8 @@ import { esUltimoVerde, guardarUltimoVerde } from '../fs/freno-ultimo-verde.js';
  * comprueba que coincide con hooks.json.
  */
 export const TECHO_HOOK_S = TECHO_HOOK_STOP_S;
-export const MARGEN_HOOK_S = 60;
+// TASK-149a (FS-17): el margen y timeoutEfectivoS viven en core/config.ts.
+export { MARGEN_HOOK_S, timeoutEfectivoS } from '../core/config.js';
 /** Variable de entorno que apaga el freno: `FRENO_VERIFICACION=0`. */
 export const INTERRUPTOR = 'FRENO_VERIFICACION';
 
@@ -106,34 +109,7 @@ export interface DepsFreno {
 
 const DEJAR_PARAR: DecisionStop = Object.freeze({ codigo: 0, stderr: '' });
 
-/**
- * Segundos que se le dan a la verificacion: `timeout_verificacion`, pero nunca
- * mas que el `timeout` del hook menos el margen. Si el hook agotara el suyo,
- * Claude Code descartaria el informe y el freno fallaria abierto.
- */
-export function timeoutEfectivoS(timeoutVerificacion: number): { timeoutS: number; recortado: boolean } {
-  const techo = TECHO_HOOK_S - MARGEN_HOOK_S;
-  return timeoutVerificacion > techo
-    ? { timeoutS: techo, recortado: true }
-    : { timeoutS: timeoutVerificacion, recortado: false };
-}
-
-/** El directorio de tareas en curso, si existe. Sin procesos. */
-export function carpetaEnCurso(raiz: string): string | null {
-  const dir = path.join(raiz, 'tareas', '02-en-curso');
-  try {
-    return statSync(dir).isDirectory() ? dir : null;
-  } catch {
-    return null;
-  }
-}
-
-export function ramaActual(raiz: string): string | null {
-  const r = spawnSync('git', ['branch', '--show-current'], { cwd: raiz, encoding: 'utf8', windowsHide: true });
-  if (r.error !== undefined || r.status !== 0) return null;
-  const rama = (r.stdout ?? '').trim();
-  return rama === '' ? null : rama;
-}
+// TASK-149a (FS-06): la rama actual es la de fs/git-crudo.ts (durante un rebase, la que se rebasa).
 
 export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): Promise<DecisionStop> {
   const env = deps.env ?? process.env;
@@ -369,10 +345,5 @@ function bloquear(tarea: string, r: ResultadoVerificacion, avisos: readonly stri
 
 /** Lee stdin entero (el JSON del hook). Un JSON roto o vacio es una entrada sin campos. */
 export function parsearEntrada(texto: string): EntradaStop {
-  try {
-    const v: unknown = JSON.parse(texto);
-    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaStop) : {};
-  } catch {
-    return {};
-  }
+  return parsearEntradaHook<EntradaStop>(texto);
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
index bb2e247..b16faaa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
@@ -23,7 +23,7 @@
  */
 import { existsSync, readFileSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
+import { ramaActual } from '../fs/git-crudo.js';
 import { numerosHeldoutEnRuta, numerosHeldoutEnTexto, CARPETA_HELDOUT } from '../core/heldout.js';
 import { numeroDeRama } from '../core/task-id.js';
 import { CONFIG_DIR, CONFIG_FILE, parsearConfig, raizDelRepo } from '../core/config.js';
@@ -52,25 +52,6 @@ export function numerosEnEntrada(entrada: EntradaPreToolUse): number[] {
   return [...nums];
 }
 
-function git(args: readonly string[], cwd: string): { ok: boolean; out: string } {
-  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
-  return { ok: r.error === undefined && r.status === 0, out: (r.stdout ?? '').trim() };
-}
-
-/** La rama actual; con HEAD desacoplado en un rebase, la que se esta rebasando. null si no hay repo. */
-export function ramaActual(cwd: string): string | null {
-  const actual = git(['branch', '--show-current'], cwd);
-  if (!actual.ok) return null;
-  if (actual.out !== '') return actual.out;
-  for (const f of ['rebase-merge/head-name', 'rebase-apply/head-name']) {
-    const r = git(['rev-parse', '--git-path', f], cwd);
-    if (!r.ok || r.out === '') continue;
-    const fichero = path.resolve(cwd, r.out);
-    if (existsSync(fichero)) return readFileSync(fichero, 'utf8').trim().replace(/^refs\/heads\//, '');
-  }
-  return '';
-}
-
 /**
  * TASK-114: false solo si la config del arbol de trabajo se lee y no declara
  * `comando_heldout`. Sin procesos: la raiz sale de buscar `.git` hacia
@@ -98,7 +79,7 @@ export function decidirHeldout(entrada: EntradaPreToolUse): DecisionPreToolUse {
     // TASK-114: sin held-out declarado no hay nada que proteger; sale sin lanzar git.
     if (!declaraHeldout(entrada.cwd)) return PASAR;
     const rama = ramaActual(entrada.cwd);
-    if (rama === null || rama === '') return PASAR;
+    if (rama === null) return PASAR;
     const n = numeroDeRama(rama);
     if (n === null || !nums.includes(n)) return PASAR;
     return { codigo: 2, stderr: mensaje(`TASK-${String(n).padStart(3, '0')}`, rama) };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index afe6208..0bdc770 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -39,13 +39,12 @@
  */
 import { existsSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
 import { analizarComando, cierresDeMerge, type OperacionMerge } from '../core/comando-merge.js';
-import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
+import { ConfigError, raizDelRepo, resolverConfigConAvisos, timeoutEfectivoS, type TaskcodeConfig } from '../core/config.js';
 import { huellaDeCommit, huellaDelArbol, leerMemo } from '../fs/verificacion.js';
 import { comandoSoloIntegra } from '../core/comando-merge.js';
 import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
-import { timeoutEfectivoS } from './freno-stop.js';
+import { gitResultado as git, ramaActual } from '../fs/git-crudo.js';
 
 import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
 
@@ -74,11 +73,6 @@ export function comandoCandidato(entrada: EntradaPreToolUse): string | null {
  */
 export const INVOCA_GIT_O_CIERRE = /\bgit\b|merge-[a-z]+-to-[a-z]+\.sh/i;
 
-function git(args: readonly string[], cwd: string): { ok: boolean; out: string } {
-  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
-  return { ok: r.error === undefined && r.status === 0, out: (r.stdout ?? '').trim() };
-}
-
 function existeRef(ref: string, cwd: string): boolean {
   return git(['rev-parse', '--verify', '--quiet', ref], cwd).ok;
 }
@@ -222,7 +216,7 @@ function integraciones(op: OperacionMerge, raiz: string, integracion: string, pr
     const release = op.script.includes('release') || /^release\//.test(op.fuente);
     return destinos.map((destino) => ({ fuente: op.fuente as string, destino, raiz, release }));
   }
-  const destino = op.destino ?? git(['branch', '--show-current'], raiz).out;
+  const destino = op.destino ?? ramaActual(raiz) ?? '';
   if (destino === '') return [];
   const fuentes = op.fuentes.length > 0 ? op.fuentes : [`${destino}@{upstream}`];
   return fuentes.map((fuente) => ({ fuente, destino, raiz, release: /^(?:refs\/heads\/)?release\//.test(fuente) }));
@@ -412,7 +406,7 @@ function decidirCierreDeMerge(comando: string, cwd: string): DecisionPreToolUse
       const mh = git(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD'], raiz);
       if (!mh.ok || mh.out === '') continue;
       sha = mh.out;
-      rama = git(['branch', '--show-current'], raiz).out;
+      rama = ramaActual(raiz) ?? '';
       if (rama === '') continue;
       try {
         config = resolverConfigConAvisos(raiz).config;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts
index b6ea916..a9745eb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts
@@ -24,10 +24,11 @@ import { existsSync } from 'node:fs';
 import path from 'node:path';
 import { raizDelRepo } from '../core/config.js';
 import { esAgentIdValido } from '../core/coste-transcripcion.js';
-import { listTareasEnEstados } from '../fs/task-store.js';
+import { carpetaEnCurso, listTareasEnEstados } from '../fs/task-store.js';
 import { anotarPendientes, rutaLibro, type EntradaPendiente } from '../fs/coste-pendiente.js';
 import { esSesionIdValido, INTERRUPTOR_COSTE } from '../fs/coste-automatico.js';
-import { carpetaEnCurso, ramaActual } from './freno-stop.js';
+import { ramaActual } from '../fs/git-crudo.js';
+import { parsearEntradaHook } from './entrada-pretooluse.js';
 
 export interface EntradaCoste {
   cwd?: unknown;
@@ -101,10 +102,5 @@ export async function registrarTurno(entrada: EntradaCoste, deps: DepsRegistroCo
 
 /** El JSON del hook. Uno roto o vacio es una entrada sin campos. */
 export function parsearEntradaCoste(textoEntrada: string): EntradaCoste {
-  try {
-    const v: unknown = JSON.parse(textoEntrada);
-    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaCoste) : {};
-  } catch {
-    return {};
-  }
+  return parsearEntradaHook<EntradaCoste>(textoEntrada);
 }
````

## Excluido del diff (23 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-149a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149a/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149a/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149a/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                          | 14 ++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/coste-pendiente.js                                   |  8 ++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/freno-ultimo-verde.js                                | 12 ++----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-crudo.js                                         | 48 ++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/pendientes.js                                        |  5 ++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/registro-puertas.js                                  | 12 ++----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sincronizacion.js                                    |  5 +----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/task-store.js                                        | 12 +++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                      | 13 ++-----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/entrada-pretooluse.js                             | 16 +++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                     | 49 +++++++++----------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-heldout.js                                | 25 ++-----------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                  | 13 ++++---------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/registro-coste.js                                 | 13 ++++---------
 23 files changed, 122 insertions(+), 133 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts    | 85 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts |  3 ++-
 2 files changed, 87 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 144.4 s
- Commit verificado: 89caf6373f9bb5b5b5953bf997e2a5e51b990d2e
- Huella: 308a735ac424f9a690a6e5539ca592754a17b943
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 104537 bytes en total):

````
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8475ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3554ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5584ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3725ms)
✔ ramaActual: la rama; con HEAD desacoplado, null; durante un rebase, la que se rebasa; fuera de un repo, null (1537.2888ms)
✔ rutaGit: absoluta bajo el directorio de Git (aunque cwd sea un subdirectorio); fuera de un repo, null; gitOk (871.9112ms)
✔ parsearEntradaHook: objeto tal cual; JSON roto, vacio, array o escalar, sin campos (2.0594ms)
✔ los hooks de coste y de merges no cargan el modulo del freno (ni directa ni indirectamente) (83.7965ms)
✔ moveTareaFile (TASK-053): un EPERM que dura dos intentos no impide mover la tarea (62.3745ms)
✔ moveTareaFile (TASK-053): un EBUSY que no cede se propaga tras los reintentos y la tarea sigue en su sitio (117.0144ms)
✔ moveTareaFile (TASK-053, MEN-1 de su revision): un rename que movio la carpeta pero devolvio EPERM se da por bueno (70.6586ms)
✔ moveTareaFile (TASK-053): un error que no es transitorio no se reintenta (22.3866ms)
✔ listTareasEnEstados: tareasRoot inexistente devuelve vacio, no lanza (28.8748ms)
✔ listTareasEnEstados: lee solo las carpetas pedidas, ignorando el resto (98.5211ms)
✔ listTareasEnEstados: un tarea.md ilegible va a "ilegibles", no rompe la lectura (80.7651ms)
✔ listTareasEnEstados: una carpeta de tarea SIN tarea.md dentro se ignora (106.3302ms)
✔ listTareasEnEstados: ignora entradas que no son un ID de tarea (104.9328ms)
✔ listTareasEnEstados: el mismo ID en dos carpetas ocupa un hueco, no dos (82.4699ms)
✔ listTareasEnEstados: las rutas ilegibles vienen ordenadas (mensaje reproducible) (47.5872ms)
✔ listTareasEnEstados: acepta cualquier subconjunto de estados, no solo el del WIP (39.1483ms)
✔ heldout-ruta: normaliza mayusculas, barras invertidas, .., relativas y absolutas de Windows y git-bash (5.0095ms)
✔ heldout-ruta: el texto de un comando de shell, palabra a palabra (1.195ms)
✔ heldout-rama: el numero de tarea sale del nombre de la rama (0.5975ms)
✔ guardia-heldout (criterio 1): cada herramienta de fichero sale 2 ante la carpeta de la tarea de la rama actual y 0 ante sus hermanas (8751.9963ms)
✔ guardia-heldout (criterio 4): rutas relativas, con .., mayusculas y barras invertidas, resueltas contra el cwd (2830.2971ms)
✔ guardia-heldout (criterio 2): el guardian de Bash/PowerShell bloquea los comandos que nombran la carpeta (3028.1757ms)
✔ guardia-heldout (criterio 3): en la rama base (diseño) no bloquea; al cambiar a la rama de la tarea, si (3408.857ms)
✔ guardia-heldout (MEN-4 de la revision): el mensaje nombra el ID con su relleno, TASK-042 y no TASK-42 (1211.746ms)
✔ guardia-heldout: con HEAD desacoplado en un rebase, la rama es la que se esta rebasando (2026.4806ms)
✔ guardia-heldout: un fallo propio deja pasar (sin repo, cwd inexistente, JSON roto) (586.785ms)
✔ guardia-heldout: hooks.json declara el matcher de fichero exacto y ningun matcher incluye Agent ni Task (1.4928ms)
ℹ tests 762
ℹ suites 0
ℹ pass 762
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 133382.5141
[verificar-impacto] node --test termino con 0 en 133.5 s.
````
