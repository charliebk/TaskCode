# Peticion de revision — TASK-102 (ronda 1)

- Tarea: TASK-102 — Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion
- Rama revisada: feature/task-102-verificacion-proporcional-a3-el-freno-st
- Rama base: develop
- Commit revisado (HEAD): a0b251cc241a20ca32bd46fb87336e21f2e834e5
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-102 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-102/tarea.md
- tareas/03-en-revision/TASK-102/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts

## Commits a revisar (git log develop..HEAD)

````
a0b251c chore(TASK-102): autorrevision
abee9b6 build(TASK-102): dist compilado
99adf39 feat(TASK-102): el freno Stop no corre la suite si solo cambia documentacion
e9f59db chore(TASK-102): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 8c3199c..282ed58 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -32,6 +32,20 @@ con la config del destino invalida o pasado un presupuesto de 20 s. El
 mensaje de bloqueo dice por que no se aplico. Sin `rutas_documentacion`, el
 guardian se comporta y escribe igual que en la 0.14.0.
 
+Verificacion proporcional, parte A3a (TASK-102): el freno Stop tampoco corre
+la suite en un turno de solo documentacion; corre `comando_verificacion_documentacion`
+si se declara, y si no, nada. **Cambio de comportamiento para quien ya
+declaro `rutas_documentacion`** con TASK-100: sus turnos de solo documentacion
+dejan de correr la suite. Cuenta tambien el arbol de trabajo: un fichero de
+codigo modificado, preparado o sin seguimiento hace que el turno no sea de
+solo documentacion (lo clasifica Git, con los mismos patrones que `finish`).
+Se decide antes que la selectiva y con una sola funcion (`peticionDeTrabajo`)
+que review usara en TASK-104. Con el arbol sucio la comprobacion de
+documentacion no guarda su memo, para no pisar el verde que `finish` deja
+para el commit. Una config de la base invalida no bloquea: la verificacion de
+siempre con un aviso. Sin `rutas_documentacion` en la config, el freno no
+lanza ni un proceso git mas que en la 0.14.0.
+
 ## 0.14.0 — 2026-11-10
 
 ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
index 3bd8398..45e4206 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
@@ -10,8 +10,13 @@
  *
  * Devuelve tambien el `timeout_verificacion` de la base: la huella del memo de
  * documentacion se calcula con el (lo guarda `finish`, lo busca el guardian).
+ *
+ * TASK-102: el freno Stop la usa ademas con el arbol de trabajo (`conArbol`) y
+ * elige que verificacion toca con `peticionDeTrabajo`, la misma para Stop y
+ * para review: primero solo documentacion, despues la selectiva, y si no, la
+ * de siempre.
  */
-import { ConfigError } from '../core/config.js';
+import { ConfigError, type TaskcodeConfig } from '../core/config.js';
 import {
   decidirVerificacion,
   documentacionDeclarada,
@@ -19,7 +24,7 @@ import {
   type DecisionVerificacion,
 } from '../core/verificacion-proporcional.js';
 import { configDeRef } from './config-de-ref.js';
-import { rutasDeTarea } from './git.js';
+import { rutasDelArbol, rutasDeTarea } from './git.js';
 
 /**
  * Tests held-out de las tareas (`tareas/<estado>/TASK-NNN/aceptacion/`). `finish`
@@ -36,6 +41,24 @@ export type ResultadoDecision =
 export interface OpcionesDecision {
   /** El guardian: los held-out cuentan como codigo. */
   heldoutComoCodigo?: boolean;
+  /**
+   * TASK-102 (freno Stop): suma lo que el arbol de trabajo cambia frente a
+   * HEAD (preparado, sin preparar y no trackeado). Se une ANTES de decidir:
+   * una tarea de docs sin commits no sale «vacia», y un .ts sin commitear la
+   * saca de «solo documentacion». Si cualquiera de los dos lados falla, el
+   * diff es null (la de siempre).
+   */
+  conArbol?: boolean;
+}
+
+type Rutas = { todas: string[]; fueraDeDocs: string[] };
+
+function unir(a: Rutas | null, b: Rutas | null): Rutas | null {
+  if (a === null || b === null) return null;
+  return {
+    todas: [...new Set([...a.todas, ...b.todas])],
+    fueraDeDocs: [...new Set([...a.fueraDeDocs, ...b.fueraDeDocs])],
+  };
 }
 
 /**
@@ -57,7 +80,9 @@ export function decidirVerificacionEntre(
     throw e;
   }
   if (!documentacionDeclarada(config)) return null;
-  let diff = rutasDeTarea(base, hasta, patronesDocumentacion(config), cwd);
+  const patrones = patronesDocumentacion(config);
+  let diff = rutasDeTarea(base, hasta, patrones, cwd);
+  if (opciones.conArbol === true) diff = unir(diff, rutasDelArbol(patrones, cwd));
   if (diff !== null && opciones.heldoutComoCodigo === true) {
     const heldout = diff.todas.filter((r) => RUTA_HELDOUT.test(r) && !diff?.fueraDeDocs.includes(r));
     if (heldout.length > 0) diff = { todas: diff.todas, fueraDeDocs: [...diff.fueraDeDocs, ...heldout] };
@@ -69,3 +94,71 @@ export function decidirVerificacionEntre(
     comandoDocumentacion: config.comando_verificacion_documentacion,
   };
 }
+
+/** Que verificacion toca en un turno (Stop) o en una ronda (review). */
+export type PlanVerificacion =
+  /** Solo documentacion. `comando` null: no se declaro comprobacion, no se corre nada. */
+  | { tipo: 'documentacion'; comando: string | null; timeoutS: number; motivo: string }
+  | { tipo: 'selectiva'; comando: string; timeoutS: number; base: string }
+  | { tipo: 'completa'; comando: string; timeoutS: number }
+  | { tipo: 'nada' };
+
+export interface EntradaTrabajo {
+  /** Config del ARBOL de trabajo: la puerta barata (sin `rutas_documentacion` no se lanza ni un git). */
+  config: TaskcodeConfig;
+  raiz: string;
+  /** Rama base de la tarea; perezosa para no resolverla (ni lanzar git) si no hace falta. */
+  base: () => string;
+  /**
+   * false si la base es solo un respaldo (tarea sin tipo): la selectiva la usa
+   * como en la 0.14.0, pero no se exime nada por documentacion con ella.
+   */
+  baseFiable: boolean;
+  /** Que se corre si no hay selectiva: el Stop, la completa; review, nada. */
+  sinSelectiva: 'completa' | 'nada';
+}
+
+/**
+ * TASK-102: la eleccion «documentacion -> selectiva -> la de siempre», en un
+ * solo sitio para que Stop y review decidan igual para el mismo diff.
+ *
+ * La puerta mira la config del arbol: sin `rutas_documentacion` no se lee la de
+ * la base ni se calcula ningun diff (cero procesos git nuevos por turno). Si la
+ * declara, decide la de la base (`decidirVerificacionEntre`, la de finish y el
+ * guardian), con el arbol de trabajo incluido. Una config de la base invalida
+ * no bloquea: la de siempre con un aviso, como en finish.
+ */
+export function peticionDeTrabajo(e: EntradaTrabajo): { plan: PlanVerificacion; avisos: string[] } {
+  const avisos: string[] = [];
+  const { config } = e;
+  let resuelta: string | undefined;
+  const base = (): string => (resuelta ??= e.base());
+  if (documentacionDeclarada(config)) {
+    if (e.baseFiable) {
+      const r = decidirVerificacionEntre(base(), 'HEAD', e.raiz, { conArbol: true });
+      if (r !== null && r.tipo === 'config-invalida') {
+        avisos.push(
+          `La configuracion de "${base()}" no es valida, asi que no se puede saber si solo cambia ` +
+            `documentacion: se aplica la verificacion de siempre. Detalle: ` +
+            r.error.message.replace(/^\[ERROR\]\s*/, '')
+        );
+      } else if (r !== null && r.decision.tipo === 'documentacion') {
+        return {
+          plan: { tipo: 'documentacion', comando: r.comandoDocumentacion, timeoutS: r.timeoutS, motivo: r.decision.motivo },
+          avisos,
+        };
+      }
+    }
+  }
+  const selectiva = config.comando_verificacion_selectiva;
+  if (selectiva !== null) {
+    return {
+      plan: { tipo: 'selectiva', comando: selectiva, timeoutS: config.timeout_verificacion_selectiva, base: base() },
+      avisos,
+    };
+  }
+  if (e.sinSelectiva === 'completa' && config.comando_verificacion !== null) {
+    return { plan: { tipo: 'completa', comando: config.comando_verificacion, timeoutS: config.timeout_verificacion }, avisos };
+  }
+  return { plan: { tipo: 'nada' }, avisos };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index a989bbe..7bede45 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -1071,3 +1071,33 @@ export function rutasDeTarea(
     return null;
   }
 }
+
+/**
+ * TASK-102: lo que el arbol de trabajo cambia frente a HEAD, con la misma forma
+ * y los mismos pathspecs que `rutasDeTarea`: lo preparado y lo no preparado
+ * (`git diff HEAD`) y lo no trackeado (`ls-files --others --exclude-standard`;
+ * `--full-name` para que salga desde la raiz, como el diff). Clasifica Git, no
+ * un glob en JS: un solo motor para `rutas_documentacion`. null si Git falla
+ * (sin commits, git roto): «no se sabe», nunca «solo lo no trackeado».
+ */
+export function rutasDelArbol(
+  patronesDocs: readonly string[],
+  cwd: string
+): { todas: string[]; fueraDeDocs: string[] } | null {
+  const diff = [...SIN_COMILLAS, 'diff', '--name-only', '-z', '--no-renames', '--no-ext-diff', 'HEAD'];
+  const otros = [...SIN_COMILLAS, 'ls-files', '--others', '--exclude-standard', '--full-name', '-z'];
+  const excluir = patronesDocs.map((p) => `:(top,exclude,glob)${p}`);
+  try {
+    const todas = [
+      ...partirNul(runGit([...diff, '--', ':(top)'], cwd)),
+      ...partirNul(runGit([...otros, '--', ':(top)'], cwd)),
+    ];
+    const fueraDeDocs = [
+      ...partirNul(runGit([...diff, '--', ':(top)', ...excluir], cwd)),
+      ...partirNul(runGit([...otros, '--', ':(top)', ...excluir], cwd)),
+    ];
+    return { todas, fueraDeDocs };
+  } catch {
+    return null;
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index b5cf26d..a3159d6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -229,6 +229,20 @@ function contextoSelectiva(raiz: string, base: string): string {
   return `selectiva\0${base}\0${sha}`;
 }
 
+/**
+ * TASK-102: el memo de documentacion es uno solo y lo comparten el freno Stop,
+ * `finish` y el guardian (que lo busca por la huella del commit limpio). Con el
+ * arbol sucio no se guarda: machacaria el verde que `finish` dejo para el
+ * commit (gana el ultimo en escribir). Igual que hace `finish`.
+ */
+function arbolLimpio(raiz: string): boolean {
+  try {
+    return fotoDelArbol(raiz).size === 0;
+  } catch {
+    return false;
+  }
+}
+
 /**
  * Ejecuta la verificacion pedida, salvo que la ultima con la misma huella
  * este guardada: entonces devuelve esa. Guarda el resultado en el memo de su
@@ -256,6 +270,6 @@ export function verificarConMemo(
     ...(env === undefined ? {} : { env }),
   });
   const despues = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
-  if (despues !== null) guardarMemo(raiz, despues, resultado, p.tipo);
+  if (despues !== null && (p.tipo !== 'documentacion' || arbolLimpio(raiz))) guardarMemo(raiz, despues, resultado, p.tipo);
   return { resultado, deMemo: false, cambioElArbol: huella !== null && despues !== null && huella !== despues };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index e80df4d..6e5e6f2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -24,6 +24,16 @@
  * principal) en RAMA_BASE y su propio memo; sin ella, la completa, como
  * siempre. La puerta de integracion sigue siendo la completa de `finish`.
  *
+ * Solo documentacion (TASK-102): si la config del arbol declara
+ * `rutas_documentacion` y todo lo que cambia la tarea (sus commits frente a la
+ * base y lo que hay sin commitear o sin trackear) es documentacion, no se corre
+ * la suite: solo `comando_verificacion_documentacion` si se declara, y si no,
+ * nada. Se decide antes que la selectiva y con `peticionDeTrabajo`, la misma
+ * eleccion que usa review. Las rutas y el comando salen de la config de la
+ * BASE (como en finish y en el guardian); la del arbol solo abre la puerta, asi
+ * que sin la clave no hay ni un git mas que en la 0.14.0. Tarea sin tipo: no se
+ * exime nada.
+ *
  * Contrato con Claude Code (spike TASK-069 y documentacion oficial): exit 0
  * deja parar; exit 2 bloquea y el stderr le llega al agente; exit 1 NO
  * bloquea, asi que nunca se sale con 1 por accidente: decidirStop no lanza.
@@ -35,6 +45,7 @@ import { spawnSync } from 'node:child_process';
 import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
 import { formatearVerificacionRoja, type ResultadoVerificacion } from '../core/informe-verificacion.js';
 import type { Task } from '../core/task.js';
+import { peticionDeTrabajo } from '../fs/decision-documentacion.js';
 import { resolveBaseBranchForTipo } from '../fs/git.js';
 import { listTareasEnEstados } from '../fs/task-store.js';
 import { verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
@@ -166,31 +177,43 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
           'Corrige .taskcode/config.yml y vuelve a verificar antes de dar la tarea por terminada.',
       };
     }
-    const selectiva = config.comando_verificacion_selectiva;
-    const clave = selectiva === null ? 'timeout_verificacion' : 'timeout_verificacion_selectiva';
-    const pedido = selectiva === null ? config.timeout_verificacion : config.timeout_verificacion_selectiva;
-    const { timeoutS, recortado } = timeoutEfectivoS(pedido);
-    const avisos: string[] = [];
+    const cfg = config;
+    const tipoTarea = tipo;
+    const { plan, avisos: avisosDecision } = peticionDeTrabajo({
+      config: cfg,
+      raiz,
+      base: () => (tipoTarea === null ? cfg.rama_base : resolveBaseBranchForTipo(tipoTarea, raiz)),
+      baseFiable: tipoTarea !== null,
+      sinSelectiva: 'completa',
+    });
+    const dejarParar: DecisionStop =
+      avisosDecision.length === 0 ? DEJAR_PARAR : { codigo: 0, stderr: avisosDecision.join('\n') };
+    // Solo documentacion sin comprobacion declarada: no hay nada que correr.
+    if (plan.tipo === 'nada' || (plan.tipo === 'documentacion' && plan.comando === null)) return dejarParar;
+    const clave = plan.tipo === 'selectiva' ? 'timeout_verificacion_selectiva' : 'timeout_verificacion';
+    const { timeoutS, recortado } = timeoutEfectivoS(plan.timeoutS);
+    const avisos: string[] = [...avisosDecision];
     if (recortado) {
       avisos.push(
-        `${clave} pide ${String(pedido)} s, pero este freno tiene un tope de ` +
+        `${clave} pide ${String(plan.timeoutS)} s, pero este freno tiene un tope de ` +
           `${String(timeoutS)} s: se ha usado el tope.`
       );
     }
     const peticion: PeticionVerificacion =
-      selectiva === null
-        ? { tipo: 'completa', comando: config.comando_verificacion as string, timeoutS }
-        : {
-            tipo: 'selectiva',
-            comando: selectiva,
-            timeoutS,
-            base: tipo === null ? config.rama_base : resolveBaseBranchForTipo(tipo, raiz),
-          };
+      plan.tipo === 'selectiva'
+        ? { tipo: 'selectiva', comando: plan.comando, timeoutS, base: plan.base }
+        : { tipo: plan.tipo, comando: plan.comando as string, timeoutS };
 
     // 8 y 9
     const deOpciones = deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs };
     const { resultado: r, deMemo, cambioElArbol } = verificarConMemo(raiz, peticion, deOpciones);
-    if (r.estado === 'verde') return DEJAR_PARAR;
+    if (r.estado === 'verde') return dejarParar;
+    if (plan.tipo === 'documentacion') {
+      avisos.push(
+        `Es la comprobacion de documentacion (comando_verificacion_documentacion): ${plan.motivo}. ` +
+          'Antes de integrar se vuelve a exigir.'
+      );
+    }
     if (peticion.tipo === 'selectiva') {
       avisos.push(
         `Es la verificacion selectiva (por impacto respecto a ${peticion.base as string}); antes de integrar ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts
new file mode 100644
index 0000000..bfafef9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts
@@ -0,0 +1,286 @@
+/**
+ * Freno de fin de turno con verificacion proporcional (TASK-102). Repos Git
+ * temporales de verdad: una rama base `develop` con `rutas_documentacion` y la
+ * rama de una tarea en curso. Los comandos (completa, selectiva y
+ * documentacion) son un script de node que vive FUERA del repo, sale en verde
+ * y apunta cuantas veces se ejecuto cada uno: asi no ensucia el arbol que el
+ * freno clasifica.
+ *
+ * El numero de procesos git se mide con GIT_TRACE2_EVENT (cada proceso git deja
+ * su evento `start`), igual que en test/gitflow/origin-deteccion.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { decidirStop } from '../../src/hooks/freno-stop.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { git, sampleTask } from '../helpers/finish-fixtures.js';
+
+const RAMA = 'feature/task-102-docs';
+type Comando = 'completa' | 'selectiva' | 'docs';
+
+const SCRIPT = `
+const fs = require('node:fs');
+const path = require('node:path');
+fs.appendFileSync(path.join(__dirname, 'cuenta-' + process.argv[2]), 'x');
+console.log('verde');
+`;
+
+interface Repo {
+  raiz: string;
+  fuera: string;
+  ejecuciones(c: Comando): number;
+  limpiar(): Promise<void>;
+}
+
+interface OpcionesRepo {
+  /** Lineas extra de la config (base y rama, salvo que la rama la cambie). */
+  config?: (fuera: string) => string;
+}
+
+function cmd(fuera: string, c: Comando): string {
+  // Sin comillas: la ruta temporal no lleva espacios, y en YAML va entre comillas dobles.
+  return `node ${path.join(fuera, 'verif.cjs').split(path.sep).join('/')} ${c}`;
+}
+
+function configCompleta(fuera: string, extra = ''): string {
+  return (
+    `comando_verificacion: "${cmd(fuera, 'completa')}"\n` +
+    `comando_verificacion_documentacion: "${cmd(fuera, 'docs')}"\n` +
+    'rutas_documentacion: [docs/**]\n' +
+    extra
+  );
+}
+
+async function montar(o: OpcionesRepo = {}): Promise<Repo> {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'freno-docs-'));
+  const fuera = await mkdtemp(path.join(tmpdir(), 'freno-docs-fuera-'));
+  await writeFile(path.join(fuera, 'verif.cjs'), SCRIPT, 'utf8');
+  git(['init', '-q', '-b', 'develop'], raiz);
+  git(['config', 'user.email', 'test@example.com'], raiz);
+  git(['config', 'user.name', 'Test'], raiz);
+  git(['config', 'core.autocrlf', 'false'], raiz);
+  for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
+    await mkdir(path.join(raiz, 'tareas', c), { recursive: true });
+    await writeFile(path.join(raiz, 'tareas', c, '.gitkeep'), '', 'utf8');
+  }
+  const t = sampleTask({ id: 'TASK-102', estado: 'en-curso', rama: RAMA });
+  await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-102'), { recursive: true });
+  await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-102', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
+  await mkdir(path.join(raiz, '.taskcode'));
+  await writeFile(path.join(raiz, '.taskcode', 'config.yml'), (o.config ?? configCompleta)(fuera), 'utf8');
+  await mkdir(path.join(raiz, 'docs'));
+  await mkdir(path.join(raiz, 'src'));
+  await writeFile(path.join(raiz, 'docs', 'guia.md'), 'guia\n', 'utf8');
+  await writeFile(path.join(raiz, 'src', 'app.ts'), 'export const a = 1;\n', 'utf8');
+  git(['add', '-A'], raiz);
+  git(['commit', '-q', '-m', 'inicial'], raiz);
+  git(['checkout', '-q', '-b', RAMA], raiz);
+  return {
+    raiz,
+    fuera,
+    ejecuciones: (c) => {
+      const f = path.join(fuera, `cuenta-${c}`);
+      return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
+    },
+    limpiar: async () => {
+      await rm(raiz, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+      await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+    },
+  };
+}
+
+async function conRepo(fn: (r: Repo) => Promise<void>, o?: OpcionesRepo): Promise<void> {
+  const r = await montar(o);
+  try {
+    await fn(r);
+  } finally {
+    await r.limpiar();
+  }
+}
+
+function decidir(r: Repo) {
+  return decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: r.raiz }, { env: process.env });
+}
+
+async function escribirYCommitear(r: Repo, rel: string, texto: string): Promise<void> {
+  await writeFile(path.join(r.raiz, rel), texto, 'utf8');
+  git(['add', '-A'], r.raiz);
+  git(['commit', '-q', '-m', `cambia ${rel}`], r.raiz);
+}
+
+function memoDocumentacion(r: Repo): string {
+  return path.join(r.raiz, '.git', 'freno-verificacion-documentacion.json');
+}
+
+/** Argumentos de cada proceso git que lanzo `fn`, segun GIT_TRACE2_EVENT. */
+async function procesosGit(r: Repo, fn: () => Promise<unknown>): Promise<string[][]> {
+  const traza = path.join(r.fuera, `traza-${String(Date.now())}.json`);
+  const antes = process.env['GIT_TRACE2_EVENT'];
+  process.env['GIT_TRACE2_EVENT'] = traza;
+  try {
+    await fn();
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
+test('freno (TASK-102): un turno de solo documentacion corre la comprobacion de documentacion y no la suite', async () => {
+  await conRepo(async (r) => {
+    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+    const d = await decidir(r);
+    assert.equal(d.codigo, 0, d.stderr);
+    assert.equal(r.ejecuciones('docs'), 1);
+    assert.equal(r.ejecuciones('completa'), 0);
+  });
+});
+
+test('freno (TASK-102): solo documentacion sin comando de documentacion no corre nada', async () => {
+  await conRepo(
+    async (r) => {
+      await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+      const d = await decidir(r);
+      assert.equal(d.codigo, 0, d.stderr);
+      assert.equal(r.ejecuciones('completa'), 0);
+      assert.equal(r.ejecuciones('docs'), 0);
+    },
+    { config: (f) => `comando_verificacion: "${cmd(f, 'completa')}"\nrutas_documentacion: [docs/**]\n` }
+  );
+});
+
+test('freno (TASK-102): documentacion sin commitear todavia, sin commits en la rama, cuenta como solo documentacion', async () => {
+  await conRepo(async (r) => {
+    await writeFile(path.join(r.raiz, 'docs', 'nueva.md'), 'nueva\n', 'utf8');
+    const d = await decidir(r);
+    assert.equal(d.codigo, 0, d.stderr);
+    assert.equal(r.ejecuciones('docs'), 1);
+    assert.equal(r.ejecuciones('completa'), 0);
+  });
+});
+
+test('freno (TASK-102): un fichero de codigo modificado sin commitear aplica la verificacion de siempre', async () => {
+  await conRepo(async (r) => {
+    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+    await writeFile(path.join(r.raiz, 'src', 'app.ts'), 'export const a = 2;\n', 'utf8');
+    const d = await decidir(r);
+    assert.equal(d.codigo, 0, d.stderr);
+    assert.equal(r.ejecuciones('completa'), 1);
+    assert.equal(r.ejecuciones('docs'), 0);
+  });
+});
+
+test('freno (TASK-102): un fichero de codigo preparado (git add) sin commitear aplica la verificacion de siempre', async () => {
+  await conRepo(async (r) => {
+    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+    await writeFile(path.join(r.raiz, 'src', 'app.ts'), 'export const a = 3;\n', 'utf8');
+    git(['add', 'src/app.ts'], r.raiz);
+    await decidir(r);
+    assert.equal(r.ejecuciones('completa'), 1);
+    assert.equal(r.ejecuciones('docs'), 0);
+  });
+});
+
+test('freno (TASK-102): un fichero de codigo sin seguimiento aplica la verificacion de siempre', async () => {
+  await conRepo(async (r) => {
+    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+    await writeFile(path.join(r.raiz, 'src', 'nuevo.ts'), 'export const n = 1;\n', 'utf8');
+    const d = await decidir(r);
+    assert.equal(d.codigo, 0, d.stderr);
+    assert.equal(r.ejecuciones('completa'), 1);
+    assert.equal(r.ejecuciones('docs'), 0);
+  });
+});
+
+test('freno (TASK-102): un commit de codigo en la rama aplica la verificacion de siempre', async () => {
+  await conRepo(async (r) => {
+    await escribirYCommitear(r, 'src/app.ts', 'export const a = 4;\n');
+    await decidir(r);
+    assert.equal(r.ejecuciones('completa'), 1);
+    assert.equal(r.ejecuciones('docs'), 0);
+  });
+});
+
+test('freno (TASK-102): con la selectiva declarada, solo documentacion se decide antes; con codigo, la selectiva', async () => {
+  await conRepo(
+    async (r) => {
+      await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+      await decidir(r);
+      assert.equal(r.ejecuciones('docs'), 1);
+      assert.equal(r.ejecuciones('selectiva'), 0);
+      assert.equal(r.ejecuciones('completa'), 0);
+
+      await escribirYCommitear(r, 'src/app.ts', 'export const a = 5;\n');
+      await decidir(r);
+      assert.equal(r.ejecuciones('selectiva'), 1);
+      assert.equal(r.ejecuciones('docs'), 1);
+      assert.equal(r.ejecuciones('completa'), 0);
+    },
+    { config: (f) => configCompleta(f, `comando_verificacion_selectiva: "${cmd(f, 'selectiva')}"\n`) }
+  );
+});
+
+test('freno (TASK-102): sin rutas_documentacion se comporta como en la 0.14.0 y no lanza ningun git nuevo', async () => {
+  await conRepo(
+    async (r) => {
+      await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+      const argvs = await procesosGit(r, async () => {
+        const d = await decidir(r);
+        assert.equal(d.codigo, 0, d.stderr);
+      });
+      // La completa, aunque solo cambie documentacion: lo de la 0.14.0.
+      assert.equal(r.ejecuciones('completa'), 1);
+      assert.equal(r.ejecuciones('docs'), 0);
+      assert.ok(argvs.length > 0, 'la traza de git no registro nada: el test no mediria');
+      const nuevos = argvs.filter(
+        (a) => a.includes('show') || a.includes('ls-files') || a.includes('merge-base') || a.some((x) => x.includes('...'))
+      );
+      assert.deepEqual(nuevos, [], `procesos git que la 0.14.0 no lanzaba: ${JSON.stringify(nuevos)}`);
+      // Los mismos que la 0.14.0: la rama actual y los del memo (rev-parse y status).
+      const subcomandos = new Set(argvs.map((a) => a.find((x) => !x.startsWith('-') && !x.includes('=')) ?? ''));
+      assert.deepEqual([...subcomandos].sort(), ['branch', 'rev-parse', 'status']);
+    },
+    { config: (f) => `comando_verificacion: "${cmd(f, 'completa')}"\n` }
+  );
+});
+
+test('freno (TASK-102): con el arbol sucio corre la comprobacion de documentacion pero no guarda su memo; limpio, si', async () => {
+  await conRepo(async (r) => {
+    await writeFile(path.join(r.raiz, 'docs', 'guia.md'), 'sin commitear\n', 'utf8');
+    await decidir(r);
+    assert.equal(r.ejecuciones('docs'), 1);
+    assert.equal(existsSync(memoDocumentacion(r)), false, 'con el arbol sucio no se escribe el memo compartido');
+
+    git(['add', '-A'], r.raiz);
+    git(['commit', '-q', '-m', 'docs'], r.raiz);
+    await decidir(r);
+    assert.equal(r.ejecuciones('docs'), 2);
+    assert.equal(existsSync(memoDocumentacion(r)), true, 'con el arbol limpio el memo se guarda, como en finish');
+    // Mismo commit, arbol limpio: el memo sirve y no se vuelve a ejecutar.
+    await decidir(r);
+    assert.equal(r.ejecuciones('docs'), 2);
+  });
+});
+
+test('freno (TASK-102): una config de la base invalida no bloquea: la verificacion de siempre con un aviso', async () => {
+  await conRepo(async (r) => {
+    // La base queda con una config invalida; la rama la arregla (y por eso cambia la config).
+    git(['checkout', '-q', 'develop'], r.raiz);
+    await escribirYCommitear(r, '.taskcode/config.yml', 'timeout_verificacion: "mucho"\n');
+    git(['checkout', '-q', RAMA], r.raiz);
+    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+    const d = await decidir(r);
+    assert.equal(d.codigo, 0, d.stderr);
+    assert.match(d.stderr, /no es valida/);
+    assert.equal(r.ejecuciones('completa'), 1);
+    assert.equal(r.ejecuciones('docs'), 0);
+  });
+});
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-102/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-102/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-102/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-102/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-102/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-102/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-102/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/decision-documentacion.js                           | 63 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                              | 27 +++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     | 16 +++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                    | 51 ++++++++++++++++++++++++++++++++++++---------------
 11 files changed, 145 insertions(+), 19 deletions(-)
````
