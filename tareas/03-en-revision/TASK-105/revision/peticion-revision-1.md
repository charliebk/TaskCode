# Peticion de revision — TASK-105 (ronda 1)

- Tarea: TASK-105 — Verificacion proporcional B2: decision entre refs y huella para el nivel 2
- Rama revisada: feature/task-105-verificacion-proporcional-b2-decision-en
- Rama base: develop
- Commit revisado (HEAD): 8800b95654d0cec83d93f2a91a14f0f942dd177d
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-105 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-105/tarea.md
- tareas/03-en-revision/TASK-105/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/decision-parcial.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts

## Commits a revisar (git log develop..HEAD)

````
8800b95 docs(TASK-105): autorrevision
959f33c refactor(TASK-105): una sola cabecera de huella para arbol y commit
758b609 build(TASK-105): dist compilado
ed9002a feat(TASK-105): nivel 2 en la decision entre refs y huella de la selectiva
bfd360e chore(TASK-105): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 0fe6f7e..1b8bf91 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -36,7 +36,7 @@ import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
 import { anotarVerificacionDocumentacion, anotarVerificacionOmitida } from '../core/transiciones.js';
 import type { DecisionVerificacion } from '../core/verificacion-proporcional.js';
-import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
+import { decidirVerificacionEntre, motivoDeLaCompleta } from '../fs/decision-documentacion.js';
 import { currentBranch, isWorkspaceClean } from '../fs/git.js';
 import { autoCommit, mensajeChore } from '../fs/git-commit.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
@@ -157,7 +157,7 @@ export async function puertaVerificacion(
     return puertaSoloDocumentacion(o, comando, docs.decision, docs.timeoutS);
   }
   if (docs !== null) {
-    o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${docs.decision.motivo}.`);
+    o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${motivoDeLaCompleta(docs.decision)}.`);
   }
 
   const timeoutS = config.timeout_verificacion;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
index dc01e87..96e584e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
@@ -20,11 +20,15 @@ import { ConfigError, type TaskcodeConfig } from '../core/config.js';
 import {
   decidirVerificacion,
   documentacionDeclarada,
+  parcialDeclarada,
   patronesDocumentacion,
+  patronesParcial,
+  RUTA_CONFIG,
   type DecisionVerificacion,
+  type DiffTarea,
 } from '../core/verificacion-proporcional.js';
 import { configDeRef } from './config-de-ref.js';
-import { rutasDelArbol, rutasDeTarea } from './git.js';
+import { resolverCommits, rutasDelArbol, rutasDelArbolFueraDe, rutasDeTarea, rutasFueraDe } from './git.js';
 
 /**
  * Tests held-out de las tareas (`tareas/<estado>/TASK-NNN/aceptacion/`). `finish`
@@ -34,7 +38,17 @@ import { rutasDelArbol, rutasDeTarea } from './git.js';
 const RUTA_HELDOUT = /^tareas\/(?:[^/]+\/)+aceptacion\//;
 
 export type ResultadoDecision =
-  | { tipo: 'decision'; decision: DecisionVerificacion; timeoutS: number; comandoDocumentacion: string | null }
+  | {
+      tipo: 'decision';
+      decision: DecisionVerificacion;
+      timeoutS: number;
+      /**
+       * TASK-105: `timeout_verificacion_selectiva` de la BASE. La huella de la
+       * selectiva se calcula con el, al guardarla y al buscarla, nunca con el del arbol.
+       */
+      timeoutSelectivaS: number;
+      comandoDocumentacion: string | null;
+    }
   /** La config de la base no se puede leer: quien llama decide (nunca vale como «sin config»). */
   | { tipo: 'config-invalida'; error: ConfigError };
 
@@ -81,20 +95,65 @@ export function decidirVerificacionEntre(
   }
   if (!documentacionDeclarada(config)) return null;
   const patrones = patronesDocumentacion(config);
-  let diff = rutasDeTarea(base, hasta, patrones, cwd);
-  if (opciones.conArbol === true) diff = unir(diff, rutasDelArbol(patrones, cwd));
+  const conArbol = opciones.conArbol === true;
+  const parcial = parcialDeclarada(config);
+  // TASK-105: con el nivel 2 se diffea dos veces el mismo rango; se fijan los
+  // SHA antes (un proceso), y sin la clave se diffea por nombre como en la 0.14.0.
+  const rango = parcial ? resolverCommits([base, hasta], cwd) : [base, hasta];
+  const desde = rango?.[0] ?? base;
+  const a = rango?.[1] ?? hasta;
+  let diff: Rutas | null = rango === null ? null : rutasDeTarea(desde, a, patrones, cwd);
+  if (conArbol) diff = unir(diff, rutasDelArbol(patrones, cwd));
+  let heldout: string[] = [];
   if (diff !== null && opciones.heldoutComoCodigo === true) {
-    const heldout = diff.todas.filter((r) => RUTA_HELDOUT.test(r) && !diff?.fueraDeDocs.includes(r));
-    if (heldout.length > 0) diff = { todas: diff.todas, fueraDeDocs: [...diff.fueraDeDocs, ...heldout] };
+    const fuera = diff.fueraDeDocs;
+    heldout = diff.todas.filter((r) => RUTA_HELDOUT.test(r) && !fuera.includes(r));
+    if (heldout.length > 0) diff = { todas: diff.todas, fueraDeDocs: [...fuera, ...heldout] };
+  }
+  let diffDecision: DiffTarea | null = diff;
+  if (diff !== null && parcial && necesitaNivel2(diff)) {
+    // Se recalcula sobre el diff ya completo (arbol y held-out sumados): los
+    // held-out caen en `tareas/**`, que los patrones parciales excluyen, asi que
+    // se anaden a mano igual que a `fueraDeDocs`. Si algun lado falla, el campo
+    // no se pone y la decision es la completa.
+    const patronesN2 = patronesParcial(config);
+    let fueraDeParcial = rutasFueraDe(desde, a, patronesN2, cwd);
+    if (fueraDeParcial !== null && conArbol) {
+      const delArbol = rutasDelArbolFueraDe(patronesN2, cwd);
+      fueraDeParcial = delArbol === null ? null : [...fueraDeParcial, ...delArbol];
+    }
+    if (fueraDeParcial !== null) {
+      diffDecision = { ...diff, fueraDeParcial: [...new Set([...fueraDeParcial, ...heldout])] };
+    }
   }
   return {
     tipo: 'decision',
-    decision: decidirVerificacion(config, diff, base),
+    decision: decidirVerificacion(config, diffDecision, base),
     timeoutS: config.timeout_verificacion,
+    timeoutSelectivaS: config.timeout_verificacion_selectiva,
     comandoDocumentacion: config.comando_verificacion_documentacion,
   };
 }
 
+/**
+ * TASK-105: el nivel 2 solo cambia la decision si hay codigo y nada que fuerce
+ * ya la completa (diff vacio o que toca la config). En los demas casos ni se
+ * lanza el segundo diff.
+ */
+function necesitaNivel2(diff: Rutas): boolean {
+  return diff.todas.length > 0 && !diff.todas.includes(RUTA_CONFIG) && diff.fueraDeDocs.length > 0;
+}
+
+/**
+ * TASK-105: el motivo que finish y el guardian muestran al exigir la completa.
+ * Hasta que acepten la selectiva (B3/B5), una decision `selectiva` se ensena
+ * como en la 0.14.0: su motivo («basta la verificacion de lo afectado»)
+ * contradiria que se ejecuta la completa.
+ */
+export function motivoDeLaCompleta(d: DecisionVerificacion): string {
+  return d.tipo === 'selectiva' ? 'la tarea cambia rutas que no son documentacion' : d.motivo;
+}
+
 /** Que verificacion toca en un turno (Stop) o en una ronda (review). */
 export type PlanVerificacion =
   /** Solo documentacion. `comando` null: no se declaro comprobacion, no se corre nada. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index b0d8b18..5b168f9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -1068,14 +1068,51 @@ export function rutasDeTarea(
   patronesDocs: readonly string[],
   cwd: string
 ): { todas: string[]; fueraDeDocs: string[] } | null {
-  const rango = `${base}...${hasta}`;
-  const diff = [...SIN_COMILLAS, 'diff', '--name-only', '-z', '--no-renames', '--no-ext-diff', rango];
+  let todas: string[];
   try {
-    const todas = partirNul(runGit([...diff, '--', ':(top)'], cwd));
-    const fueraDeDocs = partirNul(
-      runGit([...diff, '--', ':(top)', ...patronesDocs.map((p) => `:(top,exclude,glob)${p}`)], cwd)
-    );
-    return { todas, fueraDeDocs };
+    todas = partirNul(runGit([...diffDeRango(base, hasta), '--', ':(top)'], cwd));
+  } catch {
+    return null;
+  }
+  const fueraDeDocs = rutasFueraDe(base, hasta, patronesDocs, cwd);
+  return fueraDeDocs === null ? null : { todas, fueraDeDocs };
+}
+
+function diffDeRango(base: string, hasta: string): string[] {
+  return [...SIN_COMILLAS, 'diff', '--name-only', '-z', '--no-renames', '--no-ext-diff', `${base}...${hasta}`];
+}
+
+const excluirPatrones = (patrones: readonly string[]): string[] => patrones.map((p) => `:(top,exclude,glob)${p}`);
+
+/**
+ * TASK-105: solo la lista de `rutasDeTarea` que no casa con `patrones`, con el
+ * mismo diff y los mismos pathspecs (un proceso git). La usa el nivel 2, que ya
+ * tiene `todas` del primer diff y solo necesita lo que queda fuera de las rutas
+ * parciales. null si Git falla.
+ */
+export function rutasFueraDe(base: string, hasta: string, patrones: readonly string[], cwd: string): string[] | null {
+  try {
+    return partirNul(runGit([...diffDeRango(base, hasta), '--', ':(top)', ...excluirPatrones(patrones)], cwd));
+  } catch {
+    return null;
+  }
+}
+
+/**
+ * TASK-105: commits a los que apuntan `refs` ahora mismo, en un solo proceso.
+ * El nivel 2 diffea dos veces el mismo rango: con los SHA fijados, un commit
+ * que entre entre los dos diffs no hace que cada uno vea una rama distinta.
+ * null si alguno no resuelve.
+ */
+export function resolverCommits(refs: readonly string[], cwd: string): string[] | null {
+  try {
+    // Sin `--verify`, que solo admite una ref; una que no resuelve hace fallar el
+    // proceso igual. Sin el, rev-parse repite `--end-of-options` en la salida:
+    // solo cuentan las lineas que son un SHA.
+    const shas = runGit(['rev-parse', '--end-of-options', ...refs.map((r) => `${r}^{commit}`)], cwd)
+      .split(/\r?\n/)
+      .filter((l) => /^[0-9a-f]{40,64}$/.test(l));
+    return shas.length === refs.length ? shas : null;
   } catch {
     return null;
   }
@@ -1093,19 +1130,26 @@ export function rutasDelArbol(
   patronesDocs: readonly string[],
   cwd: string
 ): { todas: string[]; fueraDeDocs: string[] } | null {
+  const todas = rutasDelArbolFueraDe([], cwd);
+  if (todas === null) return null;
+  const fueraDeDocs = rutasDelArbolFueraDe(patronesDocs, cwd);
+  return fueraDeDocs === null ? null : { todas, fueraDeDocs };
+}
+
+/**
+ * TASK-105: lo que el arbol de trabajo cambia frente a HEAD (diff y no
+ * trackeado) y no casa con `patrones`, con los pathspecs de `rutasDelArbol`.
+ * Sin patrones, todo. null si Git falla.
+ */
+export function rutasDelArbolFueraDe(patrones: readonly string[], cwd: string): string[] | null {
   const diff = [...SIN_COMILLAS, 'diff', '--name-only', '-z', '--no-renames', '--no-ext-diff', 'HEAD'];
   const otros = [...SIN_COMILLAS, 'ls-files', '--others', '--exclude-standard', '--full-name', '-z'];
-  const excluir = patronesDocs.map((p) => `:(top,exclude,glob)${p}`);
+  const excluir = excluirPatrones(patrones);
   try {
-    const todas = [
-      ...partirNul(runGit([...diff, '--', ':(top)'], cwd)),
-      ...partirNul(runGit([...otros, '--', ':(top)'], cwd)),
-    ];
-    const fueraDeDocs = [
+    return [
       ...partirNul(runGit([...diff, '--', ':(top)', ...excluir], cwd)),
       ...partirNul(runGit([...otros, '--', ':(top)', ...excluir], cwd)),
     ];
-    return { todas, fueraDeDocs };
   } catch {
     return null;
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index a3159d6..d7e29f6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -25,7 +25,7 @@
  * completa que dejo `finish`. La huella de la selectiva lleva ademas la rama
  * base y su commit: su resultado depende de lo cambiado respecto a ella.
  */
-import { createHash } from 'node:crypto';
+import { createHash, type Hash } from 'node:crypto';
 import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
@@ -125,10 +125,7 @@ export function huellaDelArbol(
   } catch {
     return null;
   }
-  const h = createHash('sha1');
-  h.update(`v${String(VERSION_MEMO)}\0${head}\0${comando}\0${String(timeoutS)}\0`);
-  // TASK-091: solo la selectiva trae contexto; la formula de la completa no cambia.
-  if (contexto !== undefined) h.update(`ctx\0${contexto}\0`);
+  const h = cabeceraDeHuella(head, comando, timeoutS, contexto);
   for (const ruta of [...foto.keys()].sort()) h.update(`${ruta}\0${foto.get(ruta) as string}\0`);
   return h.digest('hex');
 }
@@ -140,13 +137,33 @@ export function huellaDelArbol(
  * (la de `finish`, o la del freno Stop si no habia nada sin commitear). La usa
  * el guardian de merges, que pregunta por la rama que entra sin cambiarse a
  * ella. null si `ref` no resuelve a un commit.
+ *
+ * TASK-105: `contexto` entra igual que en `huellaDelArbol`, asi que la huella de
+ * la selectiva (`contextoSelectiva`) casa con la que guardo `verificarConMemo`
+ * con ese commit en HEAD y el arbol limpio. Sin contexto, la formula de siempre.
  */
-export function huellaDeCommit(raiz: string, ref: string, comando: string, timeoutS: number): string | null {
+export function huellaDeCommit(
+  raiz: string,
+  ref: string,
+  comando: string,
+  timeoutS: number,
+  contexto?: string
+): string | null {
   const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`], raiz);
   if (sha === null || sha === '') return null;
+  return cabeceraDeHuella(sha, comando, timeoutS, contexto).digest('hex');
+}
+
+/**
+ * TASK-105: la parte comun de `huellaDelArbol` y `huellaDeCommit`, en un solo
+ * sitio: si las dos se separan, el guardian deja de casar los verdes guardados.
+ * TASK-091: solo la selectiva trae contexto; la formula de la completa no cambia.
+ */
+function cabeceraDeHuella(commit: string, comando: string, timeoutS: number, contexto: string | undefined): Hash {
   const h = createHash('sha1');
-  h.update(`v${String(VERSION_MEMO)}\0${sha}\0${comando}\0${String(timeoutS)}\0`);
-  return h.digest('hex');
+  h.update(`v${String(VERSION_MEMO)}\0${commit}\0${comando}\0${String(timeoutS)}\0`);
+  if (contexto !== undefined) h.update(`ctx\0${contexto}\0`);
+  return h;
 }
 
 export interface MemoVerificacion {
@@ -223,8 +240,10 @@ export interface VerificacionConMemo {
  * El contexto de la huella de la selectiva: la base por su nombre y por su
  * commit (si la base avanza, lo cambiado respecto a ella tambien). Una base
  * que no resuelve entra vacia: el script del proyecto decidira que hacer.
+ * TASK-105: exportada para que quien busque la huella con `huellaDeCommit` use
+ * la misma cadena que guarda `verificarConMemo`, no una copia.
  */
-function contextoSelectiva(raiz: string, base: string): string {
+export function contextoSelectiva(raiz: string, base: string): string {
   const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${base}^{commit}`], raiz) ?? '';
   return `selectiva\0${base}\0${sha}`;
 }
@@ -234,6 +253,9 @@ function contextoSelectiva(raiz: string, base: string): string {
  * `finish` y el guardian (que lo busca por la huella del commit limpio). Con el
  * arbol sucio no se guarda: machacaria el verde que `finish` dejo para el
  * commit (gana el ultimo en escribir). Igual que hace `finish`.
+ * TASK-105: lo mismo para la selectiva, cuyo memo buscaran finish y el guardian
+ * por la huella del commit (decision de Carlos: con el arbol sucio, el Stop
+ * vuelve a ejecutarla en vez de pisar el verde limpio).
  */
 function arbolLimpio(raiz: string): boolean {
   try {
@@ -270,6 +292,6 @@ export function verificarConMemo(
     ...(env === undefined ? {} : { env }),
   });
   const despues = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
-  if (despues !== null && (p.tipo !== 'documentacion' || arbolLimpio(raiz))) guardarMemo(raiz, despues, resultado, p.tipo);
+  if (despues !== null && (p.tipo === 'completa' || arbolLimpio(raiz))) guardarMemo(raiz, despues, resultado, p.tipo);
   return { resultado, deMemo: false, cambioElArbol: huella !== null && despues !== null && huella !== despues };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index d3612df..2993f3b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -39,7 +39,7 @@ import { analizarComando, type OperacionMerge } from '../core/comando-merge.js';
 import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
 import { huellaDeCommit, leerMemo } from '../fs/verificacion.js';
 import { comandoSoloIntegra } from '../core/comando-merge.js';
-import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
+import { decidirVerificacionEntre, motivoDeLaCompleta } from '../fs/decision-documentacion.js';
 import { timeoutEfectivoS } from './freno-stop.js';
 
 import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
@@ -264,7 +264,10 @@ function exencionDocumentacion(
     };
   }
   const d = r.decision;
-  if (d.tipo === 'completa') return { pasa: false, detalle: `No es solo documentacion: ${d.motivo}.` };
+  // TASK-105: la selectiva cuenta como la completa, a proposito y no porque su
+  // comando no case con el memo de documentacion (D1: con codigo, el guardian
+  // exige la completa).
+  if (d.tipo !== 'documentacion') return { pasa: false, detalle: `No es solo documentacion: ${motivoDeLaCompleta(d)}.` };
   if (integ.release) {
     return { pasa: false, detalle: 'Un release lleva a la principal todo lo acumulado: siempre exige la verificacion completa.' };
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
index 750d5a6..33bbbdb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
@@ -254,3 +254,23 @@ test('finish (TASK-100): con umbral de cobertura, una tarea de solo documentacio
     }
   );
 });
+
+test('finish (TASK-105): con el nivel 2 activo y todo el codigo en rutas parciales, corre la completa sin un motivo contradictorio', async () => {
+  await conEntorno(
+    ({ docs }) => `${RUTAS_DOCS}comando_verificacion_selectiva: "${docs}"\nrutas_verificacion_parcial: [src/**]\n`,
+    async (e) => {
+      const task = sampleTask({ id: 'TASK-906' });
+      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+      await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
+      const { avisos } = await finish(e, 'TASK-906');
+      assert.equal(e.ejecuciones('completa'), 1, 'finish sigue exigiendo la completa');
+      assert.equal(e.ejecuciones('docs'), 0, 'y no corre la selectiva');
+      assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
+      assert.ok(
+        avisos.some((a) => /: se ejecuta la verificacion completa: la tarea cambia rutas que no son documentacion\.$/.test(a)),
+        avisos.join('\n')
+      );
+      assert.ok(!avisos.some((a) => /basta la verificacion de lo afectado/.test(a)), avisos.join('\n'));
+    }
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/decision-parcial.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/decision-parcial.test.ts
new file mode 100644
index 0000000..4f2ce1c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/decision-parcial.test.ts
@@ -0,0 +1,228 @@
+/**
+ * TASK-105: el nivel 2 de la verificacion proporcional en la decision entre
+ * refs (`decidirVerificacionEntre`) y la huella de la selectiva. Repos Git
+ * temporales de verdad: `develop` con su `.taskcode/config.yml` y la rama de
+ * una tarea encima. El comando de la selectiva es un script de node que vive
+ * FUERA del repo, para no ensuciar el arbol que se clasifica.
+ *
+ * Los procesos git se miden con GIT_TRACE2_EVENT (cada proceso deja su evento
+ * `start`), como en test/hooks/freno-stop-documentacion.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync, rmSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { decidirVerificacionEntre, type ResultadoDecision } from '../../src/fs/decision-documentacion.js';
+import {
+  contextoSelectiva,
+  huellaDeCommit,
+  huellaDelArbol,
+  leerMemo,
+  verificarConMemo,
+} from '../../src/fs/verificacion.js';
+import { git } from '../helpers/finish-fixtures.js';
+
+const SCRIPT = `require('node:fs').appendFileSync(__dirname + '/cuenta', 'x'); console.log('verde');`;
+
+interface Repo {
+  raiz: string;
+  fuera: string;
+  selectiva: string;
+}
+
+function config(fuera: string, conClave: boolean): string {
+  const script = path.join(fuera, 'sel.cjs').split(path.sep).join('/');
+  return (
+    'comando_verificacion: "node -e 0"\n' +
+    `comando_verificacion_selectiva: "node ${script}"\n` +
+    'timeout_verificacion_selectiva: 123\n' +
+    'rutas_documentacion: [docs/**]\n' +
+    (conClave ? 'rutas_verificacion_parcial: [src/ui/**]\n' : '')
+  );
+}
+
+async function conRepo(fn: (r: Repo) => Promise<void>, conClave = true): Promise<void> {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'decision-parcial-'));
+  const fuera = await mkdtemp(path.join(tmpdir(), 'decision-parcial-fuera-'));
+  try {
+    await writeFile(path.join(fuera, 'sel.cjs'), SCRIPT, 'utf8');
+    git(['init', '-q', '-b', 'develop'], raiz);
+    git(['config', 'user.email', 'test@example.com'], raiz);
+    git(['config', 'user.name', 'Test'], raiz);
+    git(['config', 'core.autocrlf', 'false'], raiz);
+    await mkdir(path.join(raiz, '.taskcode'));
+    await writeFile(path.join(raiz, '.taskcode', 'config.yml'), config(fuera, conClave), 'utf8');
+    await escribir(raiz, 'src/ui/boton.ts', 'export const b = 1;\n');
+    await escribir(raiz, 'src/core/calculo.ts', 'export const c = 1;\n');
+    await escribir(raiz, 'docs/guia.md', 'guia\n');
+    git(['add', '-A'], raiz);
+    git(['commit', '-q', '-m', 'inicial'], raiz);
+    git(['checkout', '-q', '-b', 'feature/task-105'], raiz);
+    const script = path.join(fuera, 'sel.cjs').split(path.sep).join('/');
+    await fn({ raiz, fuera, selectiva: `node ${script}` });
+  } finally {
+    await rm(raiz, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+    await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+async function escribir(raiz: string, rel: string, texto: string): Promise<void> {
+  await mkdir(path.dirname(path.join(raiz, rel)), { recursive: true });
+  await writeFile(path.join(raiz, rel), texto, 'utf8');
+}
+
+async function commitear(r: Repo, ficheros: Record<string, string>): Promise<void> {
+  for (const [rel, texto] of Object.entries(ficheros)) await escribir(r.raiz, rel, texto);
+  git(['add', '-A'], r.raiz);
+  git(['commit', '-q', '-m', 'cambio'], r.raiz);
+}
+
+function decision(r: ResultadoDecision | null) {
+  assert.ok(r !== null && r.tipo === 'decision', `se esperaba una decision: ${JSON.stringify(r)}`);
+  return r;
+}
+
+/** Argumentos de cada proceso git que lanzo `fn`, segun GIT_TRACE2_EVENT. */
+function procesosGit(r: Repo, fn: () => unknown): string[][] {
+  const traza = path.join(r.fuera, `traza-${String(Date.now())}-${String(Math.random()).slice(2)}.json`);
+  const antes = process.env['GIT_TRACE2_EVENT'];
+  process.env['GIT_TRACE2_EVENT'] = traza;
+  try {
+    fn();
+  } finally {
+    if (antes === undefined) delete process.env['GIT_TRACE2_EVENT'];
+    else process.env['GIT_TRACE2_EVENT'] = antes;
+  }
+  if (!existsSync(traza)) return [];
+  return readFileSync(traza, 'utf8')
+    .split('\n')
+    .filter((l) => l.includes('"event":"start"'))
+    .map((l) => (JSON.parse(l) as { argv: string[] }).argv.slice(1));
+}
+
+const diffs = (procs: string[][]) => procs.filter((p) => p.includes('diff'));
+const revParses = (procs: string[][]) => procs.filter((p) => p.includes('rev-parse'));
+
+test('nivel 2 (TASK-105): todo el codigo dentro de rutas_verificacion_parcial da selectiva, con el timeout de la base', async () => {
+  await conRepo(async (r) => {
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n', 'docs/guia.md': 'otra\n' });
+    const d = decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz));
+    assert.equal(d.decision.tipo, 'selectiva', d.decision.motivo);
+    assert.equal(d.timeoutSelectivaS, 123);
+  });
+});
+
+test('nivel 2 (TASK-105): codigo fuera de rutas_verificacion_parcial da la completa y lo nombra', async () => {
+  await conRepo(async (r) => {
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n', 'src/core/calculo.ts': 'export const c = 2;\n' });
+    const d = decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz));
+    assert.equal(d.decision.tipo, 'completa');
+    assert.match(d.decision.motivo, /fuera de rutas_verificacion_parcial: src\/core\/calculo\.ts/);
+  });
+});
+
+test('nivel 2 (TASK-105): si la tarea cambia .taskcode/config.yml, la completa y sin segundo diff', async () => {
+  await conRepo(async (r) => {
+    const cfg = readFileSync(path.join(r.raiz, '.taskcode', 'config.yml'), 'utf8');
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n', '.taskcode/config.yml': `${cfg}# cambio\n` });
+    let d: ResultadoDecision | null = null;
+    const procs = procesosGit(r, () => (d = decidirVerificacionEntre('develop', 'HEAD', r.raiz)));
+    const res = decision(d);
+    assert.equal(res.decision.tipo, 'completa');
+    assert.match(res.decision.motivo, /cambia \.taskcode\/config\.yml/);
+    assert.equal(diffs(procs).length, 2, `solo el diff del nivel 1: ${JSON.stringify(procs)}`);
+  });
+});
+
+test('nivel 2 (TASK-105): si el diff no se puede calcular, la completa', async () => {
+  await conRepo(async (r) => {
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
+    const d = decision(decidirVerificacionEntre('develop', 'no-existe-esta-ref', r.raiz));
+    assert.equal(d.decision.tipo, 'completa');
+    assert.match(d.decision.motivo, /no se pudo calcular/);
+  });
+});
+
+test('nivel 2 (TASK-105): sin la clave no se lanza ningun git de mas y la decision es la de la 0.14.0', async () => {
+  await conRepo(async (r) => {
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
+    let d: ResultadoDecision | null = null;
+    const procs = procesosGit(r, () => (d = decidirVerificacionEntre('develop', 'HEAD', r.raiz)));
+    const res = decision(d);
+    assert.equal(res.decision.tipo, 'completa');
+    assert.equal(res.decision.motivo, 'la tarea cambia rutas que no son documentacion: src/ui/boton.ts');
+    assert.equal(diffs(procs).length, 2, JSON.stringify(procs));
+    assert.equal(revParses(procs).length, 0, JSON.stringify(procs));
+  }, false);
+  // Contraste: con la clave, la misma medida si ve el rev-parse y el tercer diff.
+  await conRepo(async (r) => {
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
+    const procs = procesosGit(r, () => decidirVerificacionEntre('develop', 'HEAD', r.raiz));
+    assert.equal(diffs(procs).length, 3, JSON.stringify(procs));
+    assert.equal(revParses(procs).length, 1, JSON.stringify(procs));
+  });
+});
+
+test('nivel 2 (TASK-105): los held-out cuentan fuera de las rutas parciales en el guardian', async () => {
+  await conRepo(async (r) => {
+    await commitear(r, {
+      'src/ui/boton.ts': 'export const b = 2;\n',
+      'tareas/02-en-curso/TASK-105/aceptacion/caso.test.js': 'x\n',
+    });
+    const d = decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz, { heldoutComoCodigo: true }));
+    assert.equal(d.decision.tipo, 'completa');
+    assert.match(d.decision.motivo, /fuera de rutas_verificacion_parcial: .*aceptacion\/caso\.test\.js/);
+    // Sin held-out como codigo (finish, Stop), la misma rama es selectiva.
+    assert.equal(decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz)).decision.tipo, 'selectiva');
+  });
+});
+
+test('nivel 2 (TASK-105): con el arbol de trabajo, lo sin commitear tambien cuenta', async () => {
+  await conRepo(async (r) => {
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
+    await escribir(r.raiz, 'src/ui/nuevo.ts', 'export const n = 1;\n');
+    assert.equal(decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz, { conArbol: true })).decision.tipo, 'selectiva');
+    await escribir(r.raiz, 'src/core/nuevo.ts', 'export const n = 1;\n');
+    const d = decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz, { conArbol: true }));
+    assert.equal(d.decision.tipo, 'completa');
+    assert.match(d.decision.motivo, /src\/core\/nuevo\.ts/);
+  });
+});
+
+test('huella (TASK-105): huellaDeCommit con el contexto de la selectiva casa con el memo que guarda verificarConMemo', async () => {
+  await conRepo(async (r) => {
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
+    const v = verificarConMemo(r.raiz, { tipo: 'selectiva', comando: r.selectiva, timeoutS: 123, base: 'develop' });
+    assert.equal(v.resultado.estado, 'verde');
+    assert.equal(v.deMemo, false);
+    const ctx = contextoSelectiva(r.raiz, 'develop');
+    const conCtx = huellaDeCommit(r.raiz, 'HEAD', r.selectiva, 123, ctx);
+    assert.ok(conCtx !== null);
+    assert.equal(leerMemo(r.raiz, conCtx, 'selectiva')?.estado, 'verde');
+    // Sin contexto es la formula de siempre (la de la completa), que no casa con la selectiva.
+    const sinCtx = huellaDeCommit(r.raiz, 'HEAD', r.selectiva, 123) as string;
+    assert.equal(sinCtx, huellaDelArbol(r.raiz, r.selectiva, 123));
+    assert.notEqual(sinCtx, conCtx);
+    assert.equal(leerMemo(r.raiz, sinCtx, 'selectiva'), null);
+  });
+});
+
+test('memo (TASK-105): con el arbol sucio la selectiva se ejecuta pero no se guarda; con el arbol limpio, si', async () => {
+  await conRepo(async (r) => {
+    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
+    const memo = path.join(r.raiz, '.git', 'freno-verificacion-selectiva.json');
+    await escribir(r.raiz, 'src/ui/sucio.ts', 'export const s = 1;\n');
+    const p = { tipo: 'selectiva' as const, comando: r.selectiva, timeoutS: 123, base: 'develop' };
+    assert.equal(verificarConMemo(r.raiz, p).resultado.estado, 'verde');
+    assert.equal(existsSync(memo), false, 'con el arbol sucio no se guarda');
+    // Y el turno siguiente, identico, la vuelve a ejecutar (decision de Carlos, D-A).
+    assert.equal(verificarConMemo(r.raiz, p).deMemo, false);
+    assert.equal(readFileSync(path.join(r.fuera, 'cuenta'), 'utf8').length, 2);
+    rmSync(path.join(r.raiz, 'src', 'ui', 'sucio.ts'));
+    verificarConMemo(r.raiz, p);
+    assert.equal(existsSync(memo), true, 'con el arbol limpio se guarda');
+    assert.equal(verificarConMemo(r.raiz, p).deMemo, true);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
index 7c3e46e..1e59ca9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -280,3 +280,28 @@ test('guardian (TASK-101): CRI-1 y CRI-2 de la revision bloquean de punta a punt
     assert.equal(guardian(e, `git merge --no-ff ${task.rama}`).codigo, 0);
   });
 });
+
+test('guardian (TASK-105): una decision selectiva bloquea a proposito, aunque su comando coincida con el de documentacion y conste en verde', async () => {
+  // El caso que antes pasaba por accidente: la selectiva y la comprobacion de
+  // documentacion son el mismo comando y su memo de documentacion esta en verde.
+  await conEntorno(
+    ({ docs }) =>
+      `${RUTAS}comando_verificacion_documentacion: "${docs}"\n` +
+      `comando_verificacion_selectiva: "${docs}"\n` +
+      'rutas_verificacion_parcial: [src/**]\n',
+    async (e) => {
+      const task = sampleTask({ id: 'TASK-961' });
+      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+      await enLaRama(e, 'src/ui/boton.ts');
+      const huella = huellaDeCommit(e.repoRoot, task.rama, e.comandoDocs, 600) as string;
+      const verde = { comando: e.comandoDocs, estado: 'verde' as const, codigo: 0, duracionMs: 1, timeoutS: 600, bytesTotales: 0, cola: '' };
+      guardarMemo(e.repoRoot, huella, verde, 'documentacion');
+      const d = guardian(e, mergeA(task.rama));
+      assert.equal(d.codigo, 2);
+      // Motivo neutro: nada de «basta la verificacion de lo afectado» mientras se exige la completa.
+      assert.match(d.stderr ?? '', /No es solo documentacion: la tarea cambia rutas que no son documentacion\./);
+      assert.doesNotMatch(d.stderr ?? '', /basta la verificacion de lo afectado|comprobacion de documentacion/);
+      assert.equal(e.ejecutadoAlguno(), false);
+    }
+  );
+});
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-105/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-105/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-105/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-105/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-105/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-105/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-105/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/decision-documentacion.js                           | 57 ++++++++++++++++++++++++++++++++++++++++++++++++++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                              | 68 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     | 35 +++++++++++++++++++++++++----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                 |  9 ++++++---
 12 files changed, 145 insertions(+), 35 deletions(-)
````
