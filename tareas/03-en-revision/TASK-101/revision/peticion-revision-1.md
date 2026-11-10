# Peticion de revision — TASK-101 (ronda 1)

- Tarea: TASK-101 — Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion
- Rama revisada: feature/task-101-verificacion-proporcional-a2-el-guardian
- Rama base: develop
- Commit revisado (HEAD): 0cfd4c0ca59fb7ba3a33cd50c6935ae4cf1e41b5
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-101 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-101/tarea.md
- tareas/03-en-revision/TASK-101/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts

## Commits a revisar (git log develop..HEAD)

````
0cfd4c0 docs(TASK-101): autorrevision
8277541 feat(TASK-101): el guardian de merges no exige la completa si lo que entra es solo documentacion
3c2d9a7 chore(TASK-101): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 7473f7b..efe63a7 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -20,6 +20,17 @@ de la tarea; la puerta de cobertura no mide una tarea de solo documentacion.
 Sin las claves, todo como en la 0.14.0. El guardian de merges (TASK-101) y el
 freno Stop y `review` (TASK-102) siguen exigiendo o corriendo la completa.
 
+Verificacion proporcional, parte A2 (TASK-101): el guardian de merges aplica
+la misma decision que `finish` (`fs/decision-documentacion.ts`, compartida),
+con la config de la rama DESTINO y solo cuando ya iba a bloquear. Un merge a
+mano de solo documentacion pasa sin el verde de la completa (o con el verde
+de su comprobacion de documentacion). No se aplica si el comando crea o mueve
+commits antes del merge (`comandoSoloIntegra`), en un release, si cambian los
+held-out (`tareas/.../aceptacion/`, que en el guardian cuentan como codigo),
+con la config del destino invalida o pasado un presupuesto de 20 s. El
+mensaje de bloqueo dice por que no se aplico. Sin `rutas_documentacion`, el
+guardian se comporta y escribe igual que en la 0.14.0.
+
 ## 0.14.0 — 2026-11-10
 
 ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 8396822..12c3464 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -890,8 +890,14 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   que se ejecuta. La guía `verificacion-selectiva.md` trae la lista.
 - Exige `comando_verificacion`; el comando de documentación exige las rutas.
   Sin `rutas_documentacion`, todo funciona como antes.
-- De momento solo lo aplica `finish`; el freno de fin de turno, `review` y el
-  guardián de merges siguen corriendo o exigiendo la completa.
+- Lo aplican `finish` y el **guardián de merges**, con la misma decisión (la
+  config de la rama destino): un merge a mano de una tarea de solo
+  documentación pasa sin el verde de la completa, o con el verde de su
+  comprobación de documentación si la hay. El guardián no aplica la exención si
+  el comando crea o mueve commits antes del merge (`git commit && git merge`),
+  en un release, ni si cambian los held-out (`tareas/.../aceptacion/`), y la
+  calcula solo cuando ya iba a bloquear, con un presupuesto de 20 s.
+- El freno de fin de turno y `review` siguen corriendo la completa o la selectiva.
 
 #### Freno de fin de turno (hook `Stop`)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 96ea0e4..e285b5e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -104,8 +104,8 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   no puede ampliarlas para eximirse. Si la tarea cambia `.taskcode/config.yml`,
   corre la completa.
 - **Sin anclar**: `*.md` es solo la raiz del repo; `docs/**` es esa carpeta.
-  Los comodines distinguen mayusculas; el nombre literal de una carpeta, segun
-  `core.ignorecase` (en Windows y macOS `Docs/` y `docs/` son la misma).
+  Las mayusculas cuentan siempre, tambien con `core.ignorecase`: un cambio en
+  `Docs/` no casa con `docs/**` y esa tarea corre la completa (el lado seguro).
 - **La carpeta `tareas/` cuenta siempre** como documentacion: la cambia toda
   tarea. Sus tests held-out los sigue corriendo su propia puerta.
 - **Ante la duda, la completa**: si no se puede calcular el diff, si sale
@@ -118,8 +118,14 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   (seccion `## Verificacion de documentacion`).
 - Un `release` corre siempre la completa: lleva a la principal todo lo
   acumulado, aunque su diff propio sea solo el CHANGELOG.
-- De momento solo lo aplica `finish`. El fin de turno, `review` y el guardian
-  de merges siguen como antes (mas estrictos, nunca mas laxos).
+- Lo aplican `finish` y el **guardian de merges**, con la misma decision: un
+  merge a mano de una tarea de solo documentacion pasa sin el verde de la
+  completa (con comprobacion de documentacion, con su verde guardado). El
+  guardian lee las rutas de la config de la rama destino y no aplica la
+  exencion si el comando crea o mueve commits antes del merge (`git commit &&
+  git merge ...`: haz el commit en otro comando), en un release, ni si cambian
+  los tests held-out (`tareas/.../aceptacion/`), que alli cuentan como codigo.
+- El fin de turno y `review` siguen como antes (mas estrictos, nunca mas laxos).
 
 ### Que `.md` NO son documentacion
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 57a01ca..0fe6f7e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -31,18 +31,13 @@
  */
 import path from 'node:path';
 import { writeFile } from 'node:fs/promises';
-import { ConfigError, resolverConfig } from '../core/config.js';
+import { resolverConfig } from '../core/config.js';
 import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
 import { anotarVerificacionDocumentacion, anotarVerificacionOmitida } from '../core/transiciones.js';
-import {
-  decidirVerificacion,
-  documentacionDeclarada,
-  patronesDocumentacion,
-  type DecisionVerificacion,
-} from '../core/verificacion-proporcional.js';
-import { configDeRef } from '../fs/config-de-ref.js';
-import { currentBranch, isWorkspaceClean, rutasDeTarea } from '../fs/git.js';
+import type { DecisionVerificacion } from '../core/verificacion-proporcional.js';
+import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
+import { currentBranch, isWorkspaceClean } from '../fs/git.js';
 import { autoCommit, mensajeChore } from '../fs/git-commit.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
 import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
@@ -86,26 +81,23 @@ export type ResultadoPuerta =
 /**
  * TASK-100: la decision para esta tarea, con la config de la base, o null si
  * la base no declara rutas de documentacion (entonces ni se calcula el diff).
- * Una config de la base invalida no exime de nada: la completa.
+ * Una config de la base invalida no exime de nada: la completa. TASK-101: la
+ * decision la toma `decidirVerificacionEntre`, la misma que usa el guardian.
  */
 function decisionDocumentacion(
   o: PuertaVerificacionOpts,
   ramaBase: string
 ): { decision: DecisionVerificacion; timeoutS: number } | null {
-  let base;
-  try {
-    base = configDeRef(ramaBase, o.cwd);
-  } catch (e: unknown) {
-    if (!(e instanceof ConfigError)) throw e;
+  const r = decidirVerificacionEntre(ramaBase, 'HEAD', o.cwd);
+  if (r === null) return null;
+  if (r.tipo === 'config-invalida') {
     o.onAviso?.(
       `${o.id}: la configuracion de "${ramaBase}" no es valida, asi que no se puede saber si la tarea es solo ` +
-        `documentacion: se ejecuta la verificacion completa. Detalle: ${e.message.replace(/^\[ERROR\]\s*/, '')}`
+        `documentacion: se ejecuta la verificacion completa. Detalle: ${r.error.message.replace(/^\[ERROR\]\s*/, '')}`
     );
     return null;
   }
-  if (!documentacionDeclarada(base)) return null;
-  const diff = rutasDeTarea(ramaBase, 'HEAD', patronesDocumentacion(base), o.cwd);
-  return { decision: decidirVerificacion(base, diff, ramaBase), timeoutS: base.timeout_verificacion };
+  return { decision: r.decision, timeoutS: r.timeoutS };
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index 02cb21c..97148ae 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -274,3 +274,50 @@ function ramaDeCambio(args: readonly string[]): string | null {
   const pos = posicionales(args, CAMBIO_CON_VALOR);
   return pos.length === 1 ? (pos[0] as string) : null;
 }
+
+/**
+ * TASK-101: programas que no pueden cambiar ningun commit de ninguna rama.
+ * Lectura, cambio de carpeta y salida por pantalla.
+ */
+const SIN_EFECTO_EN_RAMAS = new Set(['cd', 'pushd', 'popd', 'echo', 'pwd', 'true', 'set-location', 'sl', 'tee', 'cat', 'head', 'tail', 'grep']);
+/** Subcomandos de git que no mueven ninguna rama (checkout/switch y branch, aparte). */
+const GIT_SIN_EFECTO = new Set(['merge', 'status', 'log', 'diff', 'show', 'rev-parse']);
+/** `git branch` sin mas, o solo con estas opciones, solo lista. */
+const BRANCH_SOLO_LISTA = new Set(['--show-current', '-a', '-r', '--list', '-v', '-vv', '--all', '--remotes']);
+
+/**
+ * TASK-101: true si, aparte de los merges y scripts de cierre, el comando solo
+ * cambia de carpeta o de rama, consulta o escribe por pantalla. El guardian de
+ * merges evalua la rama que entra ANTES de ejecutar el comando: si el comando
+ * puede crear o mover commits antes del merge (`git commit`, `reset`, `rebase`,
+ * `pull`, `cherry-pick`, un script, `taskctl`...), lo evaluado no es lo que
+ * entra, y no se aplica la exencion de solo documentacion. Ante la duda, false.
+ */
+export function comandoSoloIntegra(texto: string): boolean {
+  for (const bruto of segmentar(texto)) {
+    const seg = sinPrefijos(bruto);
+    if (seg.length === 0) continue;
+    const prog = programa(seg[0] as string);
+    if (SIN_EFECTO_EN_RAMAS.has(prog)) continue;
+    if (prog === 'git') {
+      let i = 1;
+      while (i < seg.length && (seg[i] as string).startsWith('-')) i += GLOBALES_CON_VALOR.has(seg[i] as string) ? 2 : 1;
+      const sub = (seg[i] ?? '').toLowerCase();
+      const args = seg.slice(i + 1);
+      if (GIT_SIN_EFECTO.has(sub)) continue;
+      if ((sub === 'checkout' || sub === 'switch') && !args.some((a) => CREAN_RAMA.has(a) || a === '-f' || a === '--force')) continue;
+      if (sub === 'branch' && args.every((a) => BRANCH_SOLO_LISTA.has(a))) continue;
+      return false;
+    }
+    const interior = textoDeShell(prog, seg);
+    if (interior !== null) {
+      if (!comandoSoloIntegra(interior)) return false;
+      continue;
+    }
+    const iScript = SHELLS.has(prog) ? opcionesDeShell(seg).fin : 0;
+    const nombre = (seg[iScript] ?? '').split(/[\/]/).pop() ?? '';
+    if (SCRIPT_CIERRE.test(nombre)) continue;
+    return false;
+  }
+  return true;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index d782af7..c3cb058 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -24,8 +24,8 @@
  * | comando_heldout              | null (sin held-out) | commands/finish-heldout.ts (TASK-073) |
  * | informe_cobertura            | null (sin freno)  | commands/review.ts, finish-cobertura.ts (TASK-074) |
  * | umbral_cobertura             | null (solo informa) | commands/finish-cobertura.ts (TASK-074) |
- * | rutas_documentacion          | [] (sin efecto)   | commands/finish-verificacion.ts (TASK-100) |
- * | comando_verificacion_documentacion | null        | commands/finish-verificacion.ts (TASK-100) |
+ * | rutas_documentacion          | [] (sin efecto)   | finish-verificacion.ts (TASK-100), hooks/guardia-merge.ts (TASK-101) |
+ * | comando_verificacion_documentacion | null        | finish-verificacion.ts (TASK-100), guardia-merge.ts (TASK-101) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
  * TASK-100: si todo lo que cambia la tarea frente a la base cae en esas rutas
@@ -761,8 +761,11 @@ function validarRutasDocumentacion(donde: string, valor: unknown): readonly stri
   const total = patrones.find((p) => /^(\*\*?\/)*\*\*?$/.test(p.replace(/\/+$/, '')));
   if (total !== undefined) {
     throw new ConfigError(
-      `[ERROR] ${donde}: el patron "${total}" de "rutas_documentacion" casa con cualquier fichero y haria ` +
-        'que toda tarea se cerrara sin la verificacion completa.\n' +
+      // MEN-6 de la revision de TASK-100: `*` y `*/**` no casan con todo, pero
+      // si con todos los ficheros de la raiz o de cualquier carpeta: demasiado.
+      `[ERROR] ${donde}: el patron "${total}" de "rutas_documentacion" es demasiado amplio: casa con ` +
+        'ficheros de cualquier tipo (todos los de la raiz, de cualquier carpeta o del repo entero), y una tarea ' +
+        'con codigo podria cerrarse sin la verificacion completa.\n' +
         '        Declara carpetas o ficheros concretos de documentacion (p. ej. [docs/**, README.md]).'
     );
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
new file mode 100644
index 0000000..3bd8398
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
@@ -0,0 +1,71 @@
+/**
+ * Decision de verificacion proporcional entre dos puntos de Git — TASK-101.
+ *
+ * La comparten `finish` (TASK-100: base de la tarea contra HEAD) y el guardian
+ * de merges (destino contra el commit que entra), para que los dos decidan lo
+ * mismo por construccion y no con dos copias que se desvien. Lee SIEMPRE la
+ * configuracion de `base` (`configDeRef`), nunca la del arbol de trabajo: la
+ * rama que se integra no puede ampliar sus propias rutas de documentacion, ni
+ * con un commit ni con un cambio sin commitear.
+ *
+ * Devuelve tambien el `timeout_verificacion` de la base: la huella del memo de
+ * documentacion se calcula con el (lo guarda `finish`, lo busca el guardian).
+ */
+import { ConfigError } from '../core/config.js';
+import {
+  decidirVerificacion,
+  documentacionDeclarada,
+  patronesDocumentacion,
+  type DecisionVerificacion,
+} from '../core/verificacion-proporcional.js';
+import { configDeRef } from './config-de-ref.js';
+import { rutasDeTarea } from './git.js';
+
+/**
+ * Tests held-out de las tareas (`tareas/<estado>/TASK-NNN/aceptacion/`). `finish`
+ * los corre con su propia puerta; el guardian no, asi que alli cuentan como
+ * codigo (decision de Carlos en el plan de TASK-101).
+ */
+const RUTA_HELDOUT = /^tareas\/(?:[^/]+\/)+aceptacion\//;
+
+export type ResultadoDecision =
+  | { tipo: 'decision'; decision: DecisionVerificacion; timeoutS: number; comandoDocumentacion: string | null }
+  /** La config de la base no se puede leer: quien llama decide (nunca vale como «sin config»). */
+  | { tipo: 'config-invalida'; error: ConfigError };
+
+export interface OpcionesDecision {
+  /** El guardian: los held-out cuentan como codigo. */
+  heldoutComoCodigo?: boolean;
+}
+
+/**
+ * Decision para lo que cambia `hasta` frente a `base` (desde su merge base).
+ * null si la base no declara `rutas_documentacion`: entonces ni se calcula el
+ * diff (cero coste para quien no lo usa).
+ */
+export function decidirVerificacionEntre(
+  base: string,
+  hasta: string,
+  cwd: string,
+  opciones: OpcionesDecision = {}
+): ResultadoDecision | null {
+  let config;
+  try {
+    config = configDeRef(base, cwd);
+  } catch (e: unknown) {
+    if (e instanceof ConfigError) return { tipo: 'config-invalida', error: e };
+    throw e;
+  }
+  if (!documentacionDeclarada(config)) return null;
+  let diff = rutasDeTarea(base, hasta, patronesDocumentacion(config), cwd);
+  if (diff !== null && opciones.heldoutComoCodigo === true) {
+    const heldout = diff.todas.filter((r) => RUTA_HELDOUT.test(r) && !diff?.fueraDeDocs.includes(r));
+    if (heldout.length > 0) diff = { todas: diff.todas, fueraDeDocs: [...diff.fueraDeDocs, ...heldout] };
+  }
+  return {
+    tipo: 'decision',
+    decision: decidirVerificacion(config, diff, base),
+    timeoutS: config.timeout_verificacion,
+    comandoDocumentacion: config.comando_verificacion_documentacion,
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index d9fbaa5..9faa1b7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -16,6 +16,12 @@
  *      (el backmerge de recuperacion que pide `finish`) o de origin/<destino>.
  *   6. Hay un VERDE guardado para el commit fuente (huella de commit, la que
  *      deja `finish` o el freno Stop con el arbol limpio): deja pasar.
+ *   6b. TASK-101: el destino declara `rutas_documentacion` y lo que entra es
+ *      solo documentacion (la misma decision que `finish`, con la config del
+ *      DESTINO): deja pasar sin comprobacion de documentacion declarada, o con
+ *      su verde guardado. Nunca si el comando puede crear o mover commits antes
+ *      del merge, en un release, con un held-out cambiado, o pasado el
+ *      presupuesto de tiempo. Solo se calcula si el paso 6 no dejo pasar.
  *   7. Cualquier otra cosa BLOQUEA (exit 2): «sin verde» cuenta como no verde
  *      (decision de Carlos) y remite a `taskctl finish`, que si verifica.
  *
@@ -29,6 +35,8 @@ import { spawnSync } from 'node:child_process';
 import { analizarComando, type OperacionMerge } from '../core/comando-merge.js';
 import { raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
 import { huellaDeCommit, leerMemo } from '../fs/verificacion.js';
+import { comandoSoloIntegra } from '../core/comando-merge.js';
+import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
 import { timeoutEfectivoS } from './freno-stop.js';
 
 import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
@@ -68,8 +76,23 @@ interface Integracion {
   fuente: string;
   destino: string;
   raiz: string;
+  /** TASK-101: un release lleva a la principal todo lo acumulado: siempre la completa. */
+  release: boolean;
 }
 
+/** TASK-101: lo que el paso 6b necesita saber del comando entero. */
+interface ContextoComando {
+  soloIntegra: boolean;
+  inicioMs: number;
+}
+
+/**
+ * TASK-101: margen del paso 6b dentro de los 30 s del hook. Pasado, no se
+ * calcula la exencion: se bloquea como siempre (un hook que muere por tiempo
+ * podria dejar pasar el merge).
+ */
+export const PRESUPUESTO_EXENCION_MS = 20_000;
+
 export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUse {
   const comando = comandoCandidato(entrada);
   if (comando === null) return PASAR;
@@ -77,6 +100,7 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
   if (ops.length === 0) return PASAR;
   if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return PASAR;
   const cwd = entrada.cwd;
+  const contexto: ContextoComando = { soloIntegra: comandoSoloIntegra(comando), inicioMs: Date.now() };
 
   // 3 y 4: hasta saber que algo entra en develop/main, cualquier fallo deja pasar.
   const pendientes: { op: OperacionMerge; integ: Integracion; config: TaskcodeConfig }[] = [];
@@ -106,7 +130,7 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
   // 5 a 7: ya se sabe que el comando integra en una rama protegida.
   try {
     for (const { integ, config } of pendientes) {
-      const motivo = motivoDeBloqueo(integ, config);
+      const motivo = motivoDeBloqueo(integ, config, contexto);
       if (motivo !== null) return { codigo: 2, stderr: motivo };
     }
     return PASAR;
@@ -126,16 +150,17 @@ function integraciones(op: OperacionMerge, raiz: string, integracion: string, pr
   if (op.tipo === 'script') {
     if (op.fuente === null) return [];
     const destinos = op.destinos.map((d) => (d === 'main' ? principal : integracion)).filter((d): d is string => d !== null);
-    return destinos.map((destino) => ({ fuente: op.fuente as string, destino, raiz }));
+    const release = op.script.includes('release') || /^release\//.test(op.fuente);
+    return destinos.map((destino) => ({ fuente: op.fuente as string, destino, raiz, release }));
   }
   const destino = op.destino ?? git(['branch', '--show-current'], raiz).out;
   if (destino === '') return [];
   const fuentes = op.fuentes.length > 0 ? op.fuentes : [`${destino}@{upstream}`];
-  return fuentes.map((fuente) => ({ fuente, destino, raiz }));
+  return fuentes.map((fuente) => ({ fuente, destino, raiz, release: /^(?:refs\/heads\/)?release\//.test(fuente) }));
 }
 
 /** null si el merge puede pasar; si no, el texto para el agente. */
-function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig): string | null {
+function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig, contexto: ContextoComando): string | null {
   const { fuente, destino, raiz } = integ;
   const comando = config.comando_verificacion as string;
   const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${fuente}^{commit}`], raiz);
@@ -158,19 +183,77 @@ function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig): string | n
     if (r?.estado === 'verde') return null;
     if (r !== null) rojo = true;
   }
+
+  // 6b (TASK-101): solo documentacion, con la misma decision que finish.
+  const exencion = exencionDocumentacion(integ, sha.out, contexto);
+  if (exencion.pasa) return null;
   return mensaje(
     fuente,
     sha.out,
     destino,
     comando,
-    rojo ? 'la ultima verificacion de ese commit NO salio en verde' : 'no consta una verificacion en verde de ese commit'
+    rojo ? 'la ultima verificacion de ese commit NO salio en verde' : 'no consta una verificacion en verde de ese commit',
+    exencion.detalle
   );
 }
 
-function mensaje(fuente: string, sha: string | null, destino: string, comando: string, motivo: string): string {
+/**
+ * TASK-101: si lo que entra es solo documentacion segun la config del destino.
+ * `detalle` explica por que no se aplica cuando el destino si la declara; null
+ * cuando no la declara (el mensaje queda como en la 0.14.0).
+ */
+function exencionDocumentacion(
+  integ: Integracion,
+  sha: string,
+  contexto: ContextoComando
+): { pasa: boolean; detalle: string | null } {
+  const { destino, raiz } = integ;
+  if (Date.now() - contexto.inicioMs > PRESUPUESTO_EXENCION_MS) return { pasa: false, detalle: null };
+  const r = decidirVerificacionEntre(destino, sha, raiz, { heldoutComoCodigo: true });
+  if (r === null) return { pasa: false, detalle: null };
+  if (r.tipo === 'config-invalida') {
+    return {
+      pasa: false,
+      detalle: `La configuracion de "${destino}" no es valida, asi que no se aplica la exencion de solo documentacion: ${r.error.message.replace(/^\[ERROR\]\s*/, '')}`,
+    };
+  }
+  const d = r.decision;
+  if (d.tipo === 'completa') return { pasa: false, detalle: `No es solo documentacion: ${d.motivo}.` };
+  if (integ.release) {
+    return { pasa: false, detalle: 'Un release lleva a la principal todo lo acumulado: siempre exige la verificacion completa.' };
+  }
+  if (!contexto.soloIntegra) {
+    return {
+      pasa: false,
+      detalle:
+        `${d.motivo}, pero este comando puede crear o mover commits antes del merge (commit, reset, rebase, pull, ` +
+        'un script...): lo comprobado no seria lo que entra. Haz el commit en un comando y el merge en otro.',
+    };
+  }
+  if (d.comando === null) return { pasa: true, detalle: null };
+  const huella = huellaDeCommit(raiz, sha, d.comando, r.timeoutS);
+  const memo = huella === null ? null : leerMemo(raiz, huella, 'documentacion');
+  if (memo?.estado === 'verde') return { pasa: true, detalle: null };
+  return {
+    pasa: false,
+    detalle:
+      `${d.motivo}, pero no consta en verde su comprobacion de documentacion (${d.comando}) para ese commit: ` +
+      'taskctl finish la ejecuta.',
+  };
+}
+
+function mensaje(
+  fuente: string,
+  sha: string | null,
+  destino: string,
+  comando: string,
+  motivo: string,
+  detalle: string | null = null
+): string {
   const quien = sha === null ? `"${fuente}"` : `"${fuente}" (${sha.slice(0, 10)})`;
   return [
     `Merge bloqueado: ${quien} entraria en "${destino}" y ${motivo} (comando de verificacion: ${comando}).`,
+    ...(detalle === null ? [] : [detalle]),
     'Cierra la tarea con taskctl finish TASK-NNN: ejecuta la verificacion y mergea con el flujo de la tarea.',
     'Si la persona decide integrar sin verificar, es taskctl finish TASK-NNN --sin-verificacion, que lo deja',
     'anotado en la tarea. No integres por otra via para saltarte esta comprobacion.',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
index 0ebb4e2..c258cb2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
@@ -139,7 +139,7 @@ test('config (TASK-100): un patron que casa con todo se rechaza', () => {
   for (const p of ['"*"', '"**"', '"**/*"', '"**/**"', '"**/"']) {
     assert.throws(
       () => parsearConfig(`comando_verificacion: "npm test"\nrutas_documentacion: [docs/**, ${p}]\n`, 'c.yml'),
-      /casa con cualquier fichero/,
+      /es demasiado amplio/,
       p
     );
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
new file mode 100644
index 0000000..2ae1646
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -0,0 +1,225 @@
+/**
+ * TASK-101: el guardian de merges aplica la decision de verificacion
+ * proporcional de TASK-100 (paso 6b). Repos Git temporales de verdad; los
+ * comandos de verificacion son scripts de node fuera del repo que cuentan sus
+ * ejecuciones (el guardian nunca debe ejecutar ninguno).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
+import { comandoSoloIntegra } from '../../src/core/comando-merge.js';
+import { guardarMemo, huellaDeCommit } from '../../src/fs/verificacion.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+
+const SCRIPT = `require('node:fs').appendFileSync(__dirname + '/cuenta-' + process.argv[2], 'x');`;
+
+interface Entorno {
+  repoRoot: string;
+  tareasRoot: string;
+  comandoCompleta: string;
+  comandoDocs: string;
+  ejecutadoAlguno(): boolean;
+}
+
+/** `trabajo-*.txt` es lo que deja `setupTaskEnRevision` en la raiz: aqui cuenta como documentacion. */
+const RUTAS = 'rutas_documentacion: [docs/**, trabajo-*.txt]\n';
+
+async function conEntorno(
+  extra: (c: { docs: string }) => string,
+  fn: (e: Entorno) => Promise<void>
+): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'guardia-docs-'));
+  await writeFile(path.join(dir, 'v.cjs'), SCRIPT, 'utf8');
+  const script = path.join(dir, 'v.cjs').replace(/\\/g, '/');
+  const comandos = { completa: `node ${script} completa`, docs: `node ${script} docs` };
+  try {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(
+        path.join(repoRoot, '.taskcode', 'config.yml'),
+        `comando_verificacion: "${comandos.completa}"\n${extra(comandos)}`,
+        'utf8'
+      );
+      commitAll(repoRoot, 'config');
+      await fn({
+        repoRoot,
+        tareasRoot,
+        comandoCompleta: comandos.completa,
+        comandoDocs: comandos.docs,
+        ejecutadoAlguno: () => existsSync(path.join(dir, 'cuenta-completa')) || existsSync(path.join(dir, 'cuenta-docs')),
+      });
+    });
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+async function enLaRama(e: Entorno, ruta: string, contenido = 'x\n'): Promise<void> {
+  await mkdir(path.dirname(path.join(e.repoRoot, ruta)), { recursive: true });
+  await writeFile(path.join(e.repoRoot, ruta), contenido, 'utf8');
+  commitAll(e.repoRoot, `cambio en ${ruta}`);
+}
+
+const guardian = (e: Entorno, command: string) => decidirPreToolUse({ cwd: e.repoRoot, tool_input: { command } });
+const mergeA = (rama: string) => `git checkout develop && git merge --no-ff ${rama}`;
+
+test('guardian (TASK-101): un merge a mano de solo documentacion pasa sin verde de la completa; finish decide lo mismo', async () => {
+  await conEntorno(() => RUTAS, async (e) => {
+    const task = sampleTask({ id: 'TASK-951' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    assert.equal(guardian(e, mergeA(task.rama)).codigo, 0);
+    assert.equal(e.ejecutadoAlguno(), false, 'el guardian nunca ejecuta la verificacion');
+    // finish, sobre el mismo par, tampoco corre la completa (criterio 2).
+    await runFinishCommand(e.tareasRoot, ['TASK-951'], '2026-11-10', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });
+    assert.equal(e.ejecutadoAlguno(), false);
+  });
+});
+
+test('guardian (TASK-101): con codigo sigue bloqueando y dice por que no es solo documentacion', async () => {
+  await conEntorno(() => RUTAS, async (e) => {
+    const task = sampleTask({ id: 'TASK-952' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
+    const d = guardian(e, mergeA(task.rama));
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr ?? '', /No es solo documentacion: la tarea cambia rutas que no son documentacion: src\/calculo\.ts/);
+  });
+});
+
+test('guardian (TASK-101): con comprobacion de documentacion exige su verde guardado para ese commit', async () => {
+  await conEntorno(({ docs }) => `${RUTAS}comando_verificacion_documentacion: "${docs}"\n`, async (e) => {
+    const task = sampleTask({ id: 'TASK-953' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    const sin = guardian(e, mergeA(task.rama));
+    assert.equal(sin.codigo, 2);
+    assert.match(sin.stderr ?? '', /no consta en verde su comprobacion de documentacion .* taskctl finish la ejecuta/);
+    const huella = huellaDeCommit(e.repoRoot, task.rama, e.comandoDocs, 600) as string;
+    const verde = { comando: e.comandoDocs, estado: 'verde' as const, codigo: 0, duracionMs: 1, timeoutS: 600, bytesTotales: 0, cola: '' };
+    // Un verde en el memo de la COMPLETA con esa huella no sirve: son memos distintos.
+    guardarMemo(e.repoRoot, huella, verde, 'completa');
+    assert.equal(guardian(e, mergeA(task.rama)).codigo, 2);
+    guardarMemo(e.repoRoot, huella, verde, 'documentacion');
+    assert.equal(guardian(e, mergeA(task.rama)).codigo, 0);
+    assert.equal(e.ejecutadoAlguno(), false);
+  });
+});
+
+test('guardian (TASK-101): sin exencion si el comando crea o mueve commits antes del merge', async () => {
+  await conEntorno(() => RUTAS, async (e) => {
+    const task = sampleTask({ id: 'TASK-954' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    for (const previo of ['git add -A && git commit -m x', 'git reset --hard HEAD~1', 'git pull', 'taskctl veredicto TASK-1 aprobada', 'node script.js']) {
+      const d = guardian(e, `${previo} && ${mergeA(task.rama)}`);
+      assert.equal(d.codigo, 2, previo);
+      assert.match(d.stderr ?? '', /puede crear o mover commits antes del merge/, previo);
+    }
+  });
+});
+
+test('guardian (TASK-101): los held-out de tareas/.../aceptacion/ cuentan como codigo', async () => {
+  await conEntorno(() => RUTAS, async (e) => {
+    const task = sampleTask({ id: 'TASK-955' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'tareas/03-en-revision/TASK-955/aceptacion/caso.test.js', 'throw new Error()\n');
+    const d = guardian(e, mergeA(task.rama));
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr ?? '', /no son documentacion: tareas\/03-en-revision\/TASK-955\/aceptacion\/caso\.test\.js/);
+  });
+});
+
+test('guardian (TASK-101): un release siempre exige la completa', async () => {
+  await conEntorno(() => RUTAS, async (e) => {
+    git(['checkout', '-q', '-b', 'release/1.0', 'develop'], e.repoRoot);
+    await enLaRama(e, 'docs/CHANGELOG.md');
+    const d = guardian(e, mergeA('release/1.0'));
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr ?? '', /Un release lleva a la principal todo lo acumulado/);
+  });
+});
+
+test('guardian (TASK-101): las rutas salen de la config del destino, no de la rama ni del arbol', async () => {
+  await conEntorno(() => 'rutas_documentacion: [docs/**]\n', async (e) => {
+    const task = sampleTask({ id: 'TASK-956' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    // La rama declara src/** como documentacion en su config (sin commitear).
+    await writeFile(
+      path.join(e.repoRoot, '.taskcode', 'config.yml'),
+      `comando_verificacion: "${e.comandoCompleta}"\nrutas_documentacion: [docs/**, src/**, trabajo-*.txt, tareas/**]\n`,
+      'utf8'
+    );
+    await mkdir(path.join(e.repoRoot, 'src'), { recursive: true });
+    await writeFile(path.join(e.repoRoot, 'src', 'x.ts'), 'x\n', 'utf8');
+    git(['add', 'src/x.ts'], e.repoRoot);
+    git(['commit', '-q', '-m', 'codigo', '--', 'src/x.ts'], e.repoRoot);
+    const d = decidirPreToolUse({ cwd: e.repoRoot, tool_input: { command: `git merge --no-ff ${task.rama}` } });
+    // La rama actual es la de la tarea (destino = ella misma): no protegida. Desde develop:
+    assert.equal(d.codigo, 0);
+    git(['stash', '-q'], e.repoRoot);
+    const desdeDevelop = guardian(e, mergeA(task.rama));
+    assert.equal(desdeDevelop.codigo, 2);
+    assert.match(desdeDevelop.stderr ?? '', /no son documentacion: src\/x\.ts/);
+  });
+});
+
+test('guardian (TASK-101): una config del destino invalida no exime (completa)', async () => {
+  await conEntorno(() => RUTAS, async (e) => {
+    const task = sampleTask({ id: 'TASK-957' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    git(['checkout', '-q', 'develop'], e.repoRoot);
+    await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), `comando_verificacion: "${e.comandoCompleta}"\nrutas_documentacion: ["**"]\n`, 'utf8');
+    commitAll(e.repoRoot, 'config rota en develop');
+    git(['checkout', '-q', task.rama], e.repoRoot);
+    // El arbol (rama de la tarea) tiene la config valida; el destino, no.
+    const d = guardian(e, mergeA(task.rama));
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr ?? '', /La configuracion de "develop" no es valida/);
+  });
+});
+
+test('guardian (TASK-101): sin rutas_documentacion el mensaje es exactamente el de la 0.14.0', async () => {
+  await conEntorno(() => '', async (e) => {
+    const task = sampleTask({ id: 'TASK-958' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    const d = guardian(e, mergeA(task.rama));
+    assert.equal(d.codigo, 2);
+    const lineas = (d.stderr ?? '').split('\n');
+    assert.equal(lineas.length, 4, d.stderr);
+    assert.match(lineas[0] as string, /^Merge bloqueado: .* no consta una verificacion en verde de ese commit \(comando de verificacion: /);
+    assert.match(lineas[1] as string, /^Cierra la tarea con taskctl finish TASK-NNN/);
+  });
+});
+
+test('comandoSoloIntegra: solo cambiar de carpeta o de rama, consultar y mergear', () => {
+  for (const ok of [
+    'git merge --no-ff feature/x',
+    'cd repo && git checkout develop && git merge --no-ff feature/x',
+    'git -C repo switch develop; git merge feature/x | tee log.txt',
+    'git status && git log -1 && git branch --show-current && git merge x',
+    'bash scripts/merge-feature-to-develop.sh feature/x',
+    'bash -c "git checkout develop && git merge x"',
+  ]) {
+    assert.equal(comandoSoloIntegra(ok), true, ok);
+  }
+  for (const no of [
+    'git commit -am x && git merge x',
+    'git checkout -B feature/x HEAD~1 && git merge feature/x',
+    'git branch -f feature/x HEAD && git merge feature/x',
+    'git cherry-pick abc && git merge x',
+    'npm run build && git merge x',
+    'bash -c "git commit -m y && git merge x"',
+    'git rebase develop && git merge x',
+    'git fetch origin x:x && git merge x',
+  ]) {
+    assert.equal(comandoSoloIntegra(no), false, no);
+  }
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
tareas/{01-en-diseno => 02-en-curso}/TASK-101/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-101/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-101/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-101/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-101/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-101/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-101/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        | 28 +++++++++++-----------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js                                  | 53 +++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 12 ++++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/decision-documentacion.js                           | 53 +++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                 | 76 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++------
 12 files changed, 201 insertions(+), 28 deletions(-)
````
