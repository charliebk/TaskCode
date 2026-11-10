# Peticion de revision — TASK-100 (ronda 1)

- Tarea: TASK-100 — Verificacion proporcional A1: finish no corre la suite si la tarea solo cambia documentacion
- Rama revisada: feature/task-100-verificacion-proporcional-a-una-tarea-qu
- Rama base: develop
- Commit revisado (HEAD): a6cf647fe4f1f5514904cf502d978285c34759c1
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-100 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-100/tarea.md
- tareas/03-en-revision/TASK-100/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts

## Commits a revisar (git log develop..HEAD)

````
a6cf647 docs(TASK-100): autorrevision
1996a91 feat(TASK-100): finish no corre la suite si la tarea solo cambia documentacion
e582e1d chore(TASK-100): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index f5933dd..6c4520c 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,5 +1,21 @@
 # Changelog
 
+## Siguiente version — sin publicar
+
+Verificacion proporcional, parte A1 (TASK-100, primera de las tres en que se
+trocea TASK-096). Claves nuevas opcionales `rutas_documentacion` (patrones
+`git :(glob)`, sin anclar) y `comando_verificacion_documentacion`: si todo lo
+que cambia la tarea frente a la base cae en esas rutas, `finish` no corre
+`comando_verificacion`; solo la comprobacion de documentacion si se declara,
+con su propio memo. Las rutas se leen de la config de la rama base, `tareas/`
+cuenta siempre como documentacion, y ante la duda se corre la completa (diff
+no calculable o vacio, mixto, renombre de codigo a documentacion con
+`--no-renames`, cambio en `.taskcode/config.yml`, release). `finish` dice que
+corrio y por que y lo anota en la seccion `## Verificacion de documentacion`
+de la tarea; la puerta de cobertura no mide una tarea de solo documentacion.
+Sin las claves, todo como en la 0.14.0. El guardian de merges (TASK-101) y el
+freno Stop y `review` (TASK-102) siguen exigiendo o corriendo la completa.
+
 ## 0.14.0 — 2026-11-10
 
 ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index a529216..f5fff12 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -860,6 +860,39 @@ timeout_verificacion_selectiva: 600                                 # opcional (
 - Cómo escribir el clasificador y qué cambios obligan a correr todo: guía
   instalada con el plugin, `skills/task-workflow/verificacion-selectiva.md`.
 
+#### Tareas de solo documentación: `rutas_documentacion`
+
+El coste de verificar debe crecer con lo que cambia la tarea, no con el tamaño
+del proyecto. Si todo lo que cambia la tarea frente a la base cae en rutas de
+documentación declaradas, `finish` no corre `comando_verificacion`:
+
+```yaml
+comando_verificacion: "npm test"
+rutas_documentacion: [docs/**, README.md, CHANGELOG.md]          # patrones git :(glob), sin anclar
+comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opcional
+```
+
+- Las rutas se leen de la config de la **rama base**: la tarea no puede
+  ampliarlas para eximirse, y si cambia `.taskcode/config.yml` corre la
+  completa. `tareas/` cuenta siempre como documentación (la cambia toda tarea;
+  sus held-out los sigue corriendo su puerta).
+- **Ante la duda, la completa**: diff que no se puede calcular o vacío, mezcla
+  de documentación y código, o un renombre de código a una ruta de
+  documentación (cuentan las dos rutas). Las mayúsculas cuentan. Un `release`
+  corre siempre la completa.
+- Con `comando_verificacion_documentacion` se ejecuta ese (con
+  `timeout_verificacion`); su rojo bloquea y su verde va a su propio memo
+  (`.git/freno-verificacion-documentacion.json`), nunca al de la completa. La
+  puerta de cobertura no mide nada en una tarea de solo documentación.
+- `finish` dice qué corrió y por qué, y lo anota en `tarea.md` (sección
+  «Verificacion de documentacion»), commiteado antes del merge.
+- No declares `**/*.md`: skills, agentes, `CLAUDE.md` o comandos son Markdown
+  que se ejecuta. La guía `verificacion-selectiva.md` trae la lista.
+- Exige `comando_verificacion`; el comando de documentación exige las rutas.
+  Sin `rutas_documentacion`, todo funciona como antes.
+- De momento solo lo aplica `finish`; el freno de fin de turno, `review` y el
+  guardián de merges siguen corriendo o exigiendo la completa.
+
 #### Freno de fin de turno (hook `Stop`)
 
 El plugin declara en `hooks/hooks.json` un hook `Stop` que Claude Code ejecuta
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 8fa8fae..58d2919 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -86,3 +86,49 @@ El clasificador falla cerrado: ante la duda, corre todo. Como minimo:
 - **`taskctl finish`**: corre la completa; en rojo no integra y dice como
   correrla.
 - **`taskctl doctor`**: avisa si hay completa y falta la selectiva.
+
+## Tareas de solo documentacion: `rutas_documentacion`
+
+Una tarea que solo cambia documentacion no necesita la suite de tests. El
+proyecto declara que rutas son documentacion y, si todo lo que cambia la
+tarea frente a la base cae en ellas, `finish` no corre `comando_verificacion`:
+
+```yaml
+# .taskcode/config.yml
+comando_verificacion: "npm test"
+rutas_documentacion: [docs/**, README.md, "*.md"]        # patrones git :(glob)
+comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opcional
+```
+
+- **Las rutas se leen de la rama base**, no de la rama de la tarea: una tarea
+  no puede ampliarlas para eximirse. Si la tarea cambia `.taskcode/config.yml`,
+  corre la completa.
+- **Sin anclar**: `*.md` es solo la raiz del repo; `docs/**` es esa carpeta.
+  Las mayusculas cuentan (`Docs/` no es `docs/`).
+- **La carpeta `tareas/` cuenta siempre** como documentacion: la cambia toda
+  tarea. Sus tests held-out los sigue corriendo su propia puerta.
+- **Ante la duda, la completa**: si no se puede calcular el diff, si sale
+  vacio, si mezcla documentacion y codigo, o si mueve un fichero de codigo a
+  una ruta de documentacion (cuentan las dos rutas del renombre).
+- Con `comando_verificacion_documentacion`, se ejecuta ese (con
+  `timeout_verificacion`) y su rojo bloquea igual que el de la completa. Su
+  verde se guarda aparte: nunca abre la puerta de la completa.
+- `finish` dice en su salida que corrio y por que, y lo anota en `tarea.md`
+  (seccion `## Verificacion de documentacion`).
+- Un `release` corre siempre la completa: lleva a la principal todo lo
+  acumulado, aunque su diff propio sea solo el CHANGELOG.
+- De momento solo lo aplica `finish`. El fin de turno, `review` y el guardian
+  de merges siguen como antes (mas estrictos, nunca mas laxos).
+
+### Que `.md` NO son documentacion
+
+No declares `**/*.md`. Hay ficheros Markdown que son instrucciones que se
+ejecutan, y romperlos rompe el comportamiento del agente:
+
+- skills (`skills/**/SKILL.md` y sus guias) y agentes (`agents/*.md`);
+- `CLAUDE.md`, `AGENTS.md` y similares;
+- comandos (`.claude/commands/*.md`) y plantillas que lee el codigo;
+- cualquier `.md` que un test lea o valide.
+
+Declara carpetas concretas de documentacion para personas (`docs/**`,
+`README.md`, `CHANGELOG.md`).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
index 89ef697..083a927 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
@@ -79,6 +79,15 @@ export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
     );
     return { tipo: 'omitida' };
   }
+  // TASK-100: solo documentacion: no corrio la verificacion que regenera el
+  // informe, y tampoco hay lineas de codigo cambiadas que medir.
+  if (o.verificacion.tipo === 'documentacion') {
+    o.onAviso?.(
+      `${o.id}: la tarea solo cambia documentacion: no hay lineas de codigo que medir contra el umbral de ` +
+        `cobertura (${umbral} %).`
+    );
+    return { tipo: 'omitida' };
+  }
   if (o.verificacion.tipo === 'sin-comando') {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: "${o.ramaBase}" declara umbral_cobertura (${umbral} %), pero la rama no declara ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index cc9e7f9..1f0b750 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -20,14 +20,29 @@
  * Tras un verde se guarda el memo con la huella del arbol (limpio, igual que
  * `huellaDeCommit` del commit de la rama): es lo que consulta el guardian de
  * merges (hooks/guardia-merge) para no bloquear un merge ya verificado.
+ *
+ * TASK-100: si la config de la rama base declara `rutas_documentacion` y todo
+ * lo que cambia la tarea cae en ellas (core/verificacion-proporcional), no se
+ * ejecuta `comando_verificacion`: solo `comando_verificacion_documentacion` si
+ * existe, con su propio memo (nunca el de la completa). Queda anotado en la
+ * tarea y commiteado antes del merge, como el salto con --sin-verificacion.
+ * Ante cualquier duda (diff no calculable, vacio, mixto, config cambiada o de
+ * la base invalida), la completa de siempre.
  */
 import path from 'node:path';
 import { writeFile } from 'node:fs/promises';
-import { resolverConfig } from '../core/config.js';
+import { ConfigError, resolverConfig } from '../core/config.js';
 import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
-import { anotarVerificacionOmitida } from '../core/transiciones.js';
-import { currentBranch, isWorkspaceClean } from '../fs/git.js';
+import { anotarVerificacionDocumentacion, anotarVerificacionOmitida } from '../core/transiciones.js';
+import {
+  decidirVerificacion,
+  documentacionDeclarada,
+  patronesDocumentacion,
+  type DecisionVerificacion,
+} from '../core/verificacion-proporcional.js';
+import { configDeRef } from '../fs/config-de-ref.js';
+import { currentBranch, isWorkspaceClean, rutasDeTarea } from '../fs/git.js';
 import { autoCommit, mensajeChore } from '../fs/git-commit.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
 import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
@@ -53,13 +68,45 @@ export interface PuertaVerificacionOpts {
   onAviso?: (aviso: string) => void;
   /** Solo para tests: sustituye al timeout de la verificacion (en ms). */
   timeoutMs?: number;
+  /**
+   * TASK-100: rama contra la que se integra (la de la cobertura y los held-out).
+   * Sin ella no se mira si la tarea es solo documentacion: la completa de siempre.
+   */
+  ramaBase?: string;
 }
 
 export type ResultadoPuerta =
   | { tipo: 'sin-comando' }
   /** `inicioMs`: instante en que arranco la verificacion (TASK-074: un informe de cobertura anterior es viejo). */
   | { tipo: 'verde'; duracionMs: number; inicioMs: number }
-  | { tipo: 'omitida'; commit: string | null };
+  | { tipo: 'omitida'; commit: string | null }
+  /** TASK-100: solo documentacion; `comando` es la comprobacion de documentacion que corrio, si la hay. */
+  | { tipo: 'documentacion'; comando: string | null; motivo: string };
+
+/**
+ * TASK-100: la decision para esta tarea, con la config de la base, o null si
+ * la base no declara rutas de documentacion (entonces ni se calcula el diff).
+ * Una config de la base invalida no exime de nada: la completa.
+ */
+function decisionDocumentacion(
+  o: PuertaVerificacionOpts,
+  ramaBase: string
+): { decision: DecisionVerificacion; timeoutS: number } | null {
+  let base;
+  try {
+    base = configDeRef(ramaBase, o.cwd);
+  } catch (e: unknown) {
+    if (!(e instanceof ConfigError)) throw e;
+    o.onAviso?.(
+      `${o.id}: la configuracion de "${ramaBase}" no es valida, asi que no se puede saber si la tarea es solo ` +
+        `documentacion: se ejecuta la verificacion completa. Detalle: ${e.message.replace(/^\[ERROR\]\s*/, '')}`
+    );
+    return null;
+  }
+  if (!documentacionDeclarada(base)) return null;
+  const diff = rutasDeTarea(ramaBase, 'HEAD', patronesDocumentacion(base), o.cwd);
+  return { decision: decidirVerificacion(base, diff, ramaBase), timeoutS: base.timeout_verificacion };
+}
 
 /**
  * Ejecuta la puerta. Devuelve la tarea releida (la anotacion del salto cambia
@@ -113,6 +160,14 @@ export async function puertaVerificacion(
     return { resultado: { tipo: 'omitida', commit: c.commit }, tarea: releida };
   }
 
+  const docs = o.ramaBase === undefined ? null : decisionDocumentacion(o, o.ramaBase);
+  if (docs !== null && docs.decision.tipo === 'documentacion') {
+    return puertaSoloDocumentacion(o, comando, docs.decision, docs.timeoutS);
+  }
+  if (docs !== null) {
+    o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${docs.decision.motivo}.`);
+  }
+
   const timeoutS = config.timeout_verificacion;
   const inicioMs = Date.now();
   const r = ejecutarVerificacion(o.cwd, comando, timeoutS, o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs });
@@ -144,3 +199,67 @@ export async function puertaVerificacion(
   }
   return { resultado: { tipo: 'verde', duracionMs: r.duracionMs, inicioMs }, tarea: o.initial };
 }
+
+/**
+ * TASK-100: la tarea solo cambia documentacion. Primero se anota y commitea
+ * en la rama (asi el merge lleva el rastro y el memo casa con el commit que
+ * se integra); despues corre la comprobacion de documentacion, si existe, y
+ * su rojo bloquea igual que el de la completa.
+ */
+async function puertaSoloDocumentacion(
+  o: PuertaVerificacionOpts,
+  comando: string,
+  decision: Extract<DecisionVerificacion, { tipo: 'documentacion' }>,
+  timeoutS: number
+): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
+  const body = anotarVerificacionDocumentacion(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
+  await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
+  const c = autoCommit({
+    cwd: o.cwd,
+    rutas: [path.dirname(o.initial.filePath)],
+    mensaje: mensajeChore(o.id, 'cierre solo documentacion'),
+    push: false,
+  });
+  for (const a of c.avisos) o.onAviso?.(a);
+  const releida = await readTareaFile(o.tareasRoot, o.id);
+  if (releida === null) {
+    throw new FinishCommandError(`[ERROR] ${o.id}: tarea.md desaparecio tras anotar la verificacion; revisa el repo a mano.`);
+  }
+
+  if (decision.comando !== null) {
+    const r = ejecutarVerificacion(
+      o.cwd,
+      decision.comando,
+      timeoutS,
+      o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }
+    );
+    const limpio = isWorkspaceClean(o.cwd);
+    const huella = limpio ? huellaDelArbol(o.cwd, decision.comando, timeoutS) : null;
+    if (huella !== null) guardarMemo(o.cwd, huella, r, 'documentacion');
+    if (r.estado !== 'verde') {
+      throw new FinishCommandError(
+        `[ERROR] ${o.id}: la tarea solo cambia documentacion, pero su comprobacion ` +
+          `(comando_verificacion_documentacion) no sale en verde. No se ha mergeado nada.\n` +
+          `${formatearVerificacionRoja(r)}\n` +
+          `Arregla la documentacion, commitea y reintenta. Si la persona decide cerrar igualmente, ` +
+          `taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`
+      );
+    }
+    if (!limpio) {
+      throw new FinishCommandError(
+        `[ERROR] ${o.id}: la comprobacion de documentacion salio en verde, pero ha dejado cambios en el arbol ` +
+          `de trabajo ("${decision.comando}" escribe ficheros versionados o no ignorados: mira git status). ` +
+          'Ignoralos en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
+      );
+    }
+  }
+  o.onAviso?.(
+    `${o.id}: ${decision.motivo}: no se ejecuta la verificacion completa ("${comando}"); ` +
+      (decision.comando === null
+        ? 'no hay comprobacion de documentacion declarada.'
+        : `la comprobacion de documentacion ("${decision.comando}") sale en verde.`) +
+      ` Queda anotado en tarea.md (seccion "Verificacion de documentacion")` +
+      `${c.commit === null ? '' : `, commit ${c.commit}`}.`
+  );
+  return { resultado: { tipo: 'documentacion', comando: decision.comando, motivo: decision.motivo }, tarea: releida };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 7baad7c..e213e5a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -462,6 +462,10 @@ export async function runFinishCommand(
       instante: deps.ahora ?? today,
       ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
       ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+      // TASK-100: la misma base que la cobertura y los held-out. Un release no:
+      // su diff propio puede ser solo el CHANGELOG, pero lleva a la principal
+      // todo lo acumulado en la rama de integracion. Siempre la completa.
+      ...(tipo === 'release' ? {} : { ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion }),
     });
     // TASK-074: con el informe que la verificacion acaba de regenerar, y antes
     // de que el comando de held-out pueda reescribirlo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 5ee5e3b..d89e256 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -24,6 +24,16 @@
  * | comando_heldout              | null (sin held-out) | commands/finish-heldout.ts (TASK-073) |
  * | informe_cobertura            | null (sin freno)  | commands/review.ts, finish-cobertura.ts (TASK-074) |
  * | umbral_cobertura             | null (solo informa) | commands/finish-cobertura.ts (TASK-074) |
+ * | rutas_documentacion          | [] (sin efecto)   | commands/finish-verificacion.ts (TASK-100) |
+ * | comando_verificacion_documentacion | null        | commands/finish-verificacion.ts (TASK-100) |
+ *
+ * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
+ * TASK-100: si todo lo que cambia la tarea frente a la base cae en esas rutas
+ * (patrones `git :(glob)`, sin anclar: `*.md` es solo la raiz), `finish` no
+ * corre `comando_verificacion`, solo la comprobacion de documentacion si se
+ * declara. Las rutas se leen de la config de la RAMA BASE (la rama no puede
+ * ampliarlas para eximirse). Exigen `comando_verificacion`: sin el no hay nada
+ * que ahorrar.
  *
  * `comando_verificacion` y `timeout_verificacion` las anadio TASK-070: declaran
  * como se verifica el proyecto (el comando de tests del repo) para que los
@@ -207,6 +217,16 @@ export interface TaskcodeConfig {
    * `informe_cobertura` y `comando_verificacion` (que regenera el informe).
    */
   umbral_cobertura: number | null;
+  /**
+   * TASK-100: patrones (`git :(glob)`, sin anclar) de las rutas que son solo
+   * documentacion. `[]` = sin efecto (lo de siempre). Exige comando_verificacion.
+   */
+  rutas_documentacion: readonly string[];
+  /**
+   * TASK-100: comando que comprueba la documentacion (enlaces, formato) cuando la
+   * tarea solo la cambia. null = no se ejecuta nada. Usa timeout_verificacion.
+   */
+  comando_verificacion_documentacion: string | null;
 }
 
 export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
@@ -248,6 +268,8 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   comando_heldout: null,
   informe_cobertura: null,
   umbral_cobertura: null,
+  rutas_documentacion: Object.freeze([]) as readonly string[],
+  comando_verificacion_documentacion: null,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -271,6 +293,8 @@ export const CLAVES_CONFIG = [
   'comando_heldout',
   'informe_cobertura',
   'umbral_cobertura',
+  'rutas_documentacion',
+  'comando_verificacion_documentacion',
 ] as const;
 
 /**
@@ -566,12 +590,24 @@ export function parsearConfigConAvisos(
       case 'umbral_cobertura':
         config.umbral_cobertura = validarUmbralCobertura(donde, par.valor);
         break;
+      case 'rutas_documentacion':
+        config.rutas_documentacion = validarPatronesExclusion(donde, par.valor, 'rutas_documentacion', false);
+        break;
+      case 'comando_verificacion_documentacion':
+        config.comando_verificacion_documentacion = validarComando(
+          donde,
+          par.clave,
+          par.valor,
+          'comando_verificacion_documentacion: "node scripts/comprobar-docs.js"'
+        );
+        break;
     }
   }
 
   validarSincronizacionCompleta(ruta, vistas);
   validarVerificacionCompleta(ruta, vistas);
   validarCoberturaCompleta(ruta, vistas);
+  validarDocumentacionCompleta(ruta, vistas);
   validarRemotoCompleto(dondeUrlBase, config);
   return { config, avisos };
 }
@@ -715,6 +751,27 @@ function validarCoberturaCompleta(ruta: string, vistas: ReadonlySet<string>): vo
   }
 }
 
+/**
+ * TASK-100: las rutas de documentacion ahorran `comando_verificacion`; sin el
+ * no ahorran nada. El comando de documentacion sin rutas no lo lanzaria nadie.
+ */
+function validarDocumentacionCompleta(ruta: string, vistas: ReadonlySet<string>): void {
+  if (vistas.has('rutas_documentacion') && !vistas.has('comando_verificacion')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "rutas_documentacion" necesita tambien "comando_verificacion".\n` +
+        '        Las rutas de documentacion sirven para no correr la verificacion completa cuando la tarea ' +
+        'solo cambia documentacion; sin ella no hay nada que ahorrar. Declara la completa o borra las rutas.'
+    );
+  }
+  if (vistas.has('comando_verificacion_documentacion') && !vistas.has('rutas_documentacion')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "comando_verificacion_documentacion" necesita tambien "rutas_documentacion".\n` +
+        '        Solo se ejecuta cuando la tarea cambia unicamente esas rutas. Declaralas (p. ej. ' +
+        'rutas_documentacion: [docs/**, README.md]) o borra el comando.'
+    );
+  }
+}
+
 /** Ruta relativa a la raiz del repo, como las de sincronizacion (no absoluta, no carpeta, no fuera del repo). */
 function validarInformeCobertura(donde: string, valor: unknown): string {
   const texto = validarTextoNoVacio(donde, 'informe_cobertura', valor);
@@ -754,15 +811,16 @@ function validarUmbralCobertura(donde: string, valor: unknown): number {
 function validarPatronesExclusion(
   donde: string,
   valor: unknown,
-  clave: 'excluir_de_revision' | 'contexto_revision' = 'excluir_de_revision',
+  clave: 'excluir_de_revision' | 'contexto_revision' | 'rutas_documentacion' = 'excluir_de_revision',
   anclar = true
 ): readonly string[] {
   if (!Array.isArray(valor)) {
     throw new ConfigError(
       `[ERROR] ${donde}: "${clave}" debe ser una lista entre corchetes, ` +
         `y es ${describirValor(valor)}.\n` +
-        `        Ejemplo: ${clave}: [**/dist/**, **/*.lock]. Para no excluir ` +
-        `nada: ${clave}: [].`
+        (clave === 'rutas_documentacion'
+          ? `        Ejemplo: ${clave}: [docs/**, README.md].`
+          : `        Ejemplo: ${clave}: [**/dist/**, **/*.lock]. Para no excluir nada: ${clave}: [].`)
     );
   }
   const patrones: string[] = [];
@@ -791,7 +849,12 @@ function validarPatronesExclusion(
 /** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
 function validarComando(
   donde: string,
-  clave: 'comando_sincronizacion' | 'comando_verificacion' | 'comando_verificacion_selectiva' | 'comando_heldout',
+  clave:
+    | 'comando_sincronizacion'
+    | 'comando_verificacion'
+    | 'comando_verificacion_selectiva'
+    | 'comando_heldout'
+    | 'comando_verificacion_documentacion',
   valor: unknown,
   ejemplo: string
 ): string {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 50a5566..7d730b9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -346,13 +346,41 @@ export const SECCION_VERIFICACION_OMITIDA = '## Verificacion omitida';
  * Si la seccion ya existe (un reintento) la linea va al final de ella.
  */
 export function anotarVerificacionOmitida(body: string, instante: string, comando: string): string {
-  const eol = body.includes('\r\n') ? '\r\n' : '\n';
   const linea = `- ${instante}: taskctl finish --sin-verificacion; no se ejecuto \`${comando.replace(/`/g, "'")}\``;
+  return anotarLineaEnSeccion(body, SECCION_VERIFICACION_OMITIDA, linea);
+}
+
+/** TASK-100: seccion que deja `finish` cuando la tarea es solo documentacion y no corre la completa. */
+export const SECCION_VERIFICACION_DOCUMENTACION = '## Verificacion de documentacion';
+
+/**
+ * Anota que `finish` no ejecuto `comando_verificacion` porque la tarea solo
+ * cambia documentacion, con el motivo y lo que si corrio. Auditable igual que
+ * el salto con --sin-verificacion; un reintento anade otra linea.
+ */
+export function anotarVerificacionDocumentacion(
+  body: string,
+  instante: string,
+  comando: string,
+  motivo: string,
+  comandoDocumentacion: string | null
+): string {
+  const sinComillas = (t: string): string => t.replace(/`/g, "'");
+  const corrio =
+    comandoDocumentacion === null
+      ? 'sin comprobacion de documentacion declarada'
+      : `se ejecuta \`${sinComillas(comandoDocumentacion)}\``;
+  const linea = `- ${instante}: ${motivo}; no se ejecuta \`${sinComillas(comando)}\`, ${corrio}`;
+  return anotarLineaEnSeccion(body, SECCION_VERIFICACION_DOCUMENTACION, linea);
+}
+
+function anotarLineaEnSeccion(body: string, titulo: string, linea: string): string {
+  const eol = body.includes('\r\n') ? '\r\n' : '\n';
   const lineas = body.split(/\r?\n/);
-  const rango = rangoDeSeccion(lineas, SECCION_VERIFICACION_OMITIDA);
+  const rango = rangoDeSeccion(lineas, titulo);
   if (rango === null) {
     const base = body.replace(/(\r?\n)*$/, '');
-    return `${base}${base === '' ? '' : eol + eol}${SECCION_VERIFICACION_OMITIDA}${eol}${eol}${linea}${eol}`;
+    return `${base}${base === '' ? '' : eol + eol}${titulo}${eol}${eol}${linea}${eol}`;
   }
   const [inicio, fin] = rango;
   let ultima = inicio;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
new file mode 100644
index 0000000..7491349
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
@@ -0,0 +1,99 @@
+/**
+ * Verificacion proporcional al cambio — TASK-100 (parte A1 de TASK-096).
+ *
+ * Un unico punto que decide si una tarea es «solo documentacion» y, por tanto,
+ * si la puerta de verificacion puede ahorrarse `comando_verificacion`. Puro:
+ * recibe las rutas ya calculadas por Git (fs/git.ts, `rutasDeTarea`) y la
+ * configuracion de la rama base. Hoy lo usa `finish`; el guardian de merges
+ * (TASK-101) y el freno Stop y `review` (TASK-102) lo usaran igual.
+ *
+ * Regla de oro: ante la duda, la verificacion de siempre. Solo es
+ * documentacion si se puede afirmar con seguridad:
+ * - sin `rutas_documentacion` declaradas, nunca;
+ * - si el diff no se pudo calcular, o sale vacio (reintento tras un merge a
+ *   medias, rama ya integrada: «nada cambia» no es «solo documentacion»);
+ * - si cambia la propia configuracion (`.taskcode/config.yml`): una rama que
+ *   amplia sus rutas de documentacion no puede eximirse en el mismo diff;
+ * - si alguna ruta cae fuera de las de documentacion.
+ *
+ * La carpeta `tareas/` cuenta siempre como documentacion: es el estado de las
+ * tareas que escribe taskctl y la cambia toda tarea. Sus tests held-out
+ * (`aceptacion/`) los sigue ejecutando su propia puerta.
+ */
+
+/** Patron (`git :(glob)`) que cuenta siempre como documentacion: el estado de las tareas. */
+export const RUTA_TAREAS_SIEMPRE_DOCUMENTACION = 'tareas/**';
+
+/** Fichero que, si cambia, obliga siempre a la verificacion de siempre. */
+export const RUTA_CONFIG = '.taskcode/config.yml';
+
+/** Rutas cambiadas por la tarea frente a la base (merge-base), segun Git. */
+export interface DiffTarea {
+  /** Todas las rutas cambiadas (borrados y los dos lados de un renombre incluidos). */
+  todas: readonly string[];
+  /** Las que no casan con ninguna ruta de documentacion. */
+  fueraDeDocs: readonly string[];
+}
+
+export interface ConfigDocumentacion {
+  rutas_documentacion: readonly string[];
+  comando_verificacion_documentacion: string | null;
+}
+
+export type DecisionVerificacion =
+  | { tipo: 'completa'; motivo: string }
+  | { tipo: 'documentacion'; comando: string | null; motivo: string };
+
+const MAX_RUTAS_EN_MOTIVO = 3;
+
+function listar(rutas: readonly string[]): string {
+  const vistas = rutas.slice(0, MAX_RUTAS_EN_MOTIVO).join(', ');
+  const resto = rutas.length - MAX_RUTAS_EN_MOTIVO;
+  return resto > 0 ? `${vistas} y ${String(resto)} mas` : vistas;
+}
+
+/** true si el proyecto activo la verificacion proporcional (hay rutas de documentacion). */
+export function documentacionDeclarada(config: ConfigDocumentacion): boolean {
+  return config.rutas_documentacion.length > 0;
+}
+
+/** Patrones con los que Git separa lo que no es documentacion (incluye siempre `tareas/**`). */
+export function patronesDocumentacion(config: ConfigDocumentacion): string[] {
+  return [...new Set([...config.rutas_documentacion, RUTA_TAREAS_SIEMPRE_DOCUMENTACION])];
+}
+
+/**
+ * Decide la verificacion para el diff de la tarea. `diff === null` = no se pudo
+ * calcular. `base` solo aparece en el motivo.
+ */
+export function decidirVerificacion(
+  config: ConfigDocumentacion,
+  diff: DiffTarea | null,
+  base: string
+): DecisionVerificacion {
+  if (!documentacionDeclarada(config)) {
+    return { tipo: 'completa', motivo: `"${base}" no declara rutas_documentacion` };
+  }
+  if (diff === null) {
+    return { tipo: 'completa', motivo: `no se pudo calcular que cambia la tarea frente a "${base}"` };
+  }
+  if (diff.todas.length === 0) {
+    return { tipo: 'completa', motivo: `la tarea no cambia nada frente a "${base}" (no se puede afirmar que sea solo documentacion)` };
+  }
+  if (diff.todas.includes(RUTA_CONFIG)) {
+    return { tipo: 'completa', motivo: `la tarea cambia ${RUTA_CONFIG}` };
+  }
+  if (diff.fueraDeDocs.length > 0) {
+    return {
+      tipo: 'completa',
+      motivo: `la tarea cambia rutas que no son documentacion: ${listar(diff.fueraDeDocs)}`,
+    };
+  }
+  return {
+    tipo: 'documentacion',
+    comando: config.comando_verificacion_documentacion,
+    motivo:
+      `la tarea solo cambia documentacion (${String(diff.todas.length)} fichero(s) dentro de ` +
+      `rutas_documentacion de "${base}")`,
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 46c16a8..7999b17 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -1040,3 +1040,31 @@ export function numeroDePadres(commit: string, cwd: string): number {
   const linea = runGit(['rev-list', '--parents', '-n', '1', '--end-of-options', commit], cwd);
   return linea.split(/\s+/).filter((t) => t !== '').length - 1;
 }
+
+/**
+ * TASK-100: rutas que cambia la rama `hasta` frente a `base`, desde su merge
+ * base (`base...hasta`), y cuales de ellas no casan con `patronesDocs`
+ * (`git :(glob)`, sin anclar). Las clasifica Git, el mismo motor que
+ * `excluir_de_revision`. `--no-renames`: mover `src/x.ts` a `docs/x.md` cuenta
+ * con sus dos rutas, no solo con la de destino. `-z` y `core.quotePath=false`:
+ * una ruta con tildes o espacios sale tal cual. null si Git falla (base que no
+ * existe, clon superficial...): quien decide lo trata como «no se sabe».
+ */
+export function rutasDeTarea(
+  base: string,
+  hasta: string,
+  patronesDocs: readonly string[],
+  cwd: string
+): { todas: string[]; fueraDeDocs: string[] } | null {
+  const rango = `${base}...${hasta}`;
+  const diff = [...SIN_COMILLAS, 'diff', '--name-only', '-z', '--no-renames', '--no-ext-diff', rango];
+  try {
+    const todas = partirNul(runGit([...diff, '--'], cwd));
+    const fueraDeDocs = partirNul(
+      runGit([...diff, '--', '.', ...patronesDocs.map((p) => `:(exclude,glob)${p}`)], cwd)
+    );
+    return { todas, fueraDeDocs };
+  } catch {
+    return null;
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index 7fe0a1b..b5cf26d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -35,11 +35,13 @@ import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 /** Bytes del final de la salida que se leen (el informe muestra menos: ver informe-verificacion). */
 const BYTES_COLA_LEIDOS = 16 * 1024;
 /** TASK-091: la completa es la puerta de integracion; la selectiva, la de las rondas. */
-export type TipoVerificacion = 'completa' | 'selectiva';
+// TASK-100: la de documentacion, con su propio memo: su verde nunca abre la puerta de la completa.
+export type TipoVerificacion = 'completa' | 'selectiva' | 'documentacion';
 
 const FICHEROS_MEMO: Readonly<Record<TipoVerificacion, string>> = Object.freeze({
   completa: 'freno-verificacion.json',
   selectiva: 'freno-verificacion-selectiva.json',
+  documentacion: 'freno-verificacion-documentacion.json',
 });
 const VERSION_MEMO = 1;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
new file mode 100644
index 0000000..62d3ccc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
@@ -0,0 +1,248 @@
+/**
+ * TASK-100: verificacion proporcional en `taskctl finish` (parte A1 de
+ * TASK-096). Repos Git temporales de verdad y los scripts de Git-Flow tal
+ * cual. Dos comandos de verificacion (la completa y la de documentacion) que
+ * viven FUERA del repo, cuentan sus ejecuciones y leen su desenlace de un
+ * fichero junto a ellos.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { existsSync, readFileSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import { leerMemo, huellaDeCommit } from '../../src/fs/verificacion.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+
+// argv[2] = 'completa' | 'docs': cada uno con su contador y su desenlace.
+const SCRIPT = `
+const fs = require('node:fs');
+const tipo = process.argv[2];
+const dir = __dirname;
+fs.appendFileSync(dir + '/cuenta-' + tipo, 'x');
+const d = fs.readFileSync(dir + '/desenlace-' + tipo, 'utf8').trim();
+if (d === 'ok') { console.log(tipo + ' en verde'); process.exit(0); }
+console.error('ERROR: ' + tipo + ' en rojo'); process.exit(3);
+`;
+
+interface Entorno {
+  repoRoot: string;
+  tareasRoot: string;
+  comandoCompleta: string;
+  comandoDocs: string;
+  desenlace(tipo: 'completa' | 'docs', d: 'ok' | 'ko'): Promise<void>;
+  ejecuciones(tipo: 'completa' | 'docs'): number;
+}
+
+/**
+ * Repo con `.taskcode/config.yml` en develop: la completa siempre y, segun
+ * `extra`, rutas de documentacion y comando de documentacion. `extra` recibe
+ * los dos comandos ya resueltos.
+ */
+async function conEntorno(
+  extra: (comandos: { completa: string; docs: string }) => string,
+  fn: (e: Entorno) => Promise<void>
+): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'finish-docs-'));
+  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
+  await writeFile(path.join(dir, 'desenlace-completa'), 'ok', 'utf8');
+  await writeFile(path.join(dir, 'desenlace-docs'), 'ok', 'utf8');
+  const script = path.join(dir, 'verif.cjs').replace(/\\/g, '/');
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
+        desenlace: (tipo, d) => writeFile(path.join(dir, `desenlace-${tipo}`), d, 'utf8'),
+        ejecuciones: (tipo) => {
+          const f = path.join(dir, `cuenta-${tipo}`);
+          return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
+        },
+      });
+    });
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+/** `trabajo-*.txt` es lo que deja `setupTaskEnRevision` en la raiz: aqui cuenta como documentacion. */
+const RUTAS_DOCS = 'rutas_documentacion: [docs/**, trabajo-*.txt]\n';
+
+const integradaEnDevelop = (rama: string, cwd: string) =>
+  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;
+
+async function finish(e: Entorno, id: string): Promise<{ avisos: string[] }> {
+  const avisos: string[] = [];
+  await runFinishCommand(e.tareasRoot, [id], '2026-11-10', {
+    repoCwd: e.repoRoot,
+    scriptsDir: SCRIPTS_DIR,
+    onAviso: (a) => avisos.push(a),
+  });
+  return { avisos };
+}
+
+/** Anade un fichero en la rama de la tarea (que esta activa) y lo commitea. */
+async function enLaRama(e: Entorno, ruta: string, contenido = 'x\n'): Promise<void> {
+  await mkdir(path.dirname(path.join(e.repoRoot, ruta)), { recursive: true });
+  await writeFile(path.join(e.repoRoot, ruta), contenido, 'utf8');
+  commitAll(e.repoRoot, `cambio en ${ruta}`);
+}
+
+test('finish (TASK-100): solo documentacion y sin comando de documentacion: integra sin la completa, lo dice y lo anota', async () => {
+  await conEntorno(() => RUTAS_DOCS, async (e) => {
+    const task = sampleTask({ id: 'TASK-901' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    const { avisos } = await finish(e, 'TASK-901');
+    assert.equal(e.ejecuciones('completa'), 0, 'no corre la completa');
+    assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
+    const t = await readTareaFile(e.tareasRoot, 'TASK-901');
+    assert.equal(t?.task.estado, 'terminada');
+    assert.match(t?.body ?? '', /## Verificacion de documentacion\n\n- 2026-11-10: la tarea solo cambia documentacion \(\d+ fichero\(s\) dentro de rutas_documentacion de "develop"\); no se ejecuta `node .*completa`, sin comprobacion de documentacion declarada/);
+    assert.ok(avisos.some((a) => /solo cambia documentacion.*no se ejecuta la verificacion completa/.test(a)), avisos.join('\n'));
+    // La anotacion se commiteo en la rama antes del merge.
+    assert.match(git(['log', '--format=%s', 'develop'], e.repoRoot), /cierre solo documentacion/);
+  });
+});
+
+test('finish (TASK-100): solo documentacion con comando de documentacion: corre ese, no la completa, y guarda su propio memo', async () => {
+  await conEntorno(({ docs }) => `${RUTAS_DOCS}comando_verificacion_documentacion: "${docs}"\n`, async (e) => {
+    const task = sampleTask({ id: 'TASK-902' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    const { avisos } = await finish(e, 'TASK-902');
+    assert.equal(e.ejecuciones('completa'), 0);
+    assert.equal(e.ejecuciones('docs'), 1);
+    assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
+    assert.ok(avisos.some((a) => /comprobacion de documentacion \(".*docs"\) sale en verde/.test(a)), avisos.join('\n'));
+    // Memo de documentacion para el commit integrado; ninguno de la completa.
+    const huellaDocs = huellaDeCommit(e.repoRoot, task.rama, e.comandoDocs, 600) as string;
+    assert.equal(leerMemo(e.repoRoot, huellaDocs, 'documentacion')?.estado, 'verde');
+    const huellaCompleta = huellaDeCommit(e.repoRoot, task.rama, e.comandoCompleta, 600) as string;
+    assert.equal(leerMemo(e.repoRoot, huellaCompleta, 'completa'), null, 'nunca un verde de la completa que no corrio');
+  });
+});
+
+test('finish (TASK-100): solo documentacion con la comprobacion de documentacion en rojo: aborta sin mergear', async () => {
+  await conEntorno(({ docs }) => `${RUTAS_DOCS}comando_verificacion_documentacion: "${docs}"\n`, async (e) => {
+    const task = sampleTask({ id: 'TASK-903' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    await e.desenlace('docs', 'ko');
+    const developAntes = git(['rev-parse', 'develop'], e.repoRoot).trim();
+    await assert.rejects(
+      () => finish(e, 'TASK-903'),
+      (err: unknown) => {
+        assert.ok(err instanceof FinishCommandError);
+        assert.match(err.message, /solo cambia documentacion, pero su comprobacion/);
+        assert.match(err.message, /ERROR: docs en rojo/);
+        assert.match(err.message, /No se ha mergeado nada/);
+        return true;
+      }
+    );
+    assert.equal(e.ejecuciones('completa'), 0);
+    assert.equal(git(['rev-parse', 'develop'], e.repoRoot).trim(), developAntes);
+    assert.equal((await readTareaFile(e.tareasRoot, 'TASK-903'))?.task.estado, 'en-revision');
+    assert.equal(git(['status', '--porcelain'], e.repoRoot), '');
+  });
+});
+
+test('finish (TASK-100): un diff mixto (documentacion y codigo) corre la completa y dice por que', async () => {
+  await conEntorno(() => RUTAS_DOCS, async (e) => {
+    const task = sampleTask({ id: 'TASK-904' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
+    const { avisos } = await finish(e, 'TASK-904');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.ok(avisos.some((a) => /verificacion completa: la tarea cambia rutas que no son documentacion: src\/calculo\.ts/.test(a)), avisos.join('\n'));
+    assert.doesNotMatch((await readTareaFile(e.tareasRoot, 'TASK-904'))?.body ?? '', /Verificacion de documentacion/);
+  });
+});
+
+test('finish (TASK-100): mover codigo a una ruta de documentacion no lo exime (cuentan las dos rutas del renombre)', async () => {
+  await conEntorno(() => RUTAS_DOCS, async (e) => {
+    git(['checkout', '-q', 'develop'], e.repoRoot);
+    await mkdir(path.join(e.repoRoot, 'src'), { recursive: true });
+    await writeFile(path.join(e.repoRoot, 'src', 'calculo.ts'), 'export const x = 1;\n'.repeat(20), 'utf8');
+    commitAll(e.repoRoot, 'codigo en develop');
+    const task = sampleTask({ id: 'TASK-905' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await mkdir(path.join(e.repoRoot, 'docs'), { recursive: true });
+    git(['mv', 'src/calculo.ts', 'docs/calculo.md'], e.repoRoot);
+    commitAll(e.repoRoot, 'mover codigo a docs');
+    const { avisos } = await finish(e, 'TASK-905');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.ok(avisos.some((a) => /no son documentacion: src\/calculo\.ts/.test(a)), avisos.join('\n'));
+  });
+});
+
+test('finish (TASK-100): la rama no puede ampliar sus rutas de documentacion: las de la base mandan y cambiar la config corre la completa', async () => {
+  await conEntorno(() => 'rutas_documentacion: [docs/**]\n', async (e) => {
+    const task = sampleTask({ id: 'TASK-906' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    // La rama declara su codigo como documentacion en su propio config.
+    await enLaRama(
+      e,
+      '.taskcode/config.yml',
+      `comando_verificacion: "${e.comandoCompleta}"\nrutas_documentacion: [docs/**, src/**, trabajo-*.txt]\n`
+    );
+    await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
+    const { avisos } = await finish(e, 'TASK-906');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.ok(avisos.some((a) => /verificacion completa: la tarea cambia \.taskcode\/config\.yml/.test(a)), avisos.join('\n'));
+  });
+});
+
+// Con un fichero y no con una carpeta (Docs/ frente a docs/): en Windows y macOS
+// la carpeta Docs/ seria la misma docs/ donde finish escribe sus artefactos.
+test('finish (TASK-100): las rutas distinguen mayusculas: Trabajo-x.txt no casa con trabajo-*.txt', async () => {
+  await conEntorno(() => RUTAS_DOCS, async (e) => {
+    const task = sampleTask({ id: 'TASK-907' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'Trabajo-extra.txt');
+    const { avisos } = await finish(e, 'TASK-907');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.ok(avisos.some((a) => /no son documentacion: Trabajo-extra\.txt/.test(a)), avisos.join('\n'));
+  });
+});
+
+test('finish (TASK-100): sin rutas_documentacion todo es como en la 0.14.0 (completa, sin aviso ni anotacion nuevos)', async () => {
+  await conEntorno(() => '', async (e) => {
+    const task = sampleTask({ id: 'TASK-908' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    const { avisos } = await finish(e, 'TASK-908');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.ok(!avisos.some((a) => /documentacion/.test(a)), avisos.join('\n'));
+    assert.doesNotMatch((await readTareaFile(e.tareasRoot, 'TASK-908'))?.body ?? '', /Verificacion de documentacion/);
+  });
+});
+
+test('finish (TASK-100): con umbral de cobertura, una tarea de solo documentacion no aborta por informe ausente', async () => {
+  await conEntorno(
+    () => `${RUTAS_DOCS}informe_cobertura: coverage/lcov.info\numbral_cobertura: 80\n`,
+    async (e) => {
+      const task = sampleTask({ id: 'TASK-909' });
+      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+      await enLaRama(e, 'docs/guia.md');
+      const { avisos } = await finish(e, 'TASK-909');
+      assert.equal(e.ejecuciones('completa'), 0);
+      assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
+      assert.ok(avisos.some((a) => /no hay lineas de codigo que medir contra el umbral de cobertura \(80 %\)/.test(a)), avisos.join('\n'));
+    }
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
new file mode 100644
index 0000000..2c414e1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
@@ -0,0 +1,110 @@
+/** TASK-100: decision unica de la verificacion proporcional, config y anotacion (puros). */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import {
+  decidirVerificacion,
+  documentacionDeclarada,
+  patronesDocumentacion,
+  RUTA_TAREAS_SIEMPRE_DOCUMENTACION,
+} from '../../src/core/verificacion-proporcional.js';
+import { ConfigError, parsearConfig } from '../../src/core/config.js';
+import { anotarVerificacionDocumentacion } from '../../src/core/transiciones.js';
+import { rutasDeTarea } from '../../src/fs/git.js';
+
+const CFG = { rutas_documentacion: ['docs/**'], comando_verificacion_documentacion: null };
+
+test('decidirVerificacion: solo documentacion unicamente cuando se puede afirmar', () => {
+  const docs = decidirVerificacion(CFG, { todas: ['docs/a.md', 'tareas/x.md'], fueraDeDocs: [] }, 'develop');
+  assert.equal(docs.tipo, 'documentacion');
+  assert.match(docs.motivo, /solo cambia documentacion \(2 fichero\(s\) dentro de rutas_documentacion de "develop"\)/);
+  assert.equal(docs.tipo === 'documentacion' ? docs.comando : 'x', null);
+
+  const conComando = decidirVerificacion(
+    { ...CFG, comando_verificacion_documentacion: 'node docs.js' },
+    { todas: ['docs/a.md'], fueraDeDocs: [] },
+    'develop'
+  );
+  assert.equal(conComando.tipo === 'documentacion' ? conComando.comando : null, 'node docs.js');
+
+  const casos: Array<[string, Parameters<typeof decidirVerificacion>[1], RegExp, typeof CFG?]> = [
+    ['sin rutas', { todas: ['docs/a.md'], fueraDeDocs: [] }, /no declara rutas_documentacion/, { ...CFG, rutas_documentacion: [] }],
+    ['diff no calculable', null, /no se pudo calcular/],
+    ['diff vacio', { todas: [], fueraDeDocs: [] }, /no cambia nada/],
+    ['config cambiada', { todas: ['docs/a.md', '.taskcode/config.yml'], fueraDeDocs: [] }, /cambia \.taskcode\/config\.yml/],
+    ['mixto', { todas: ['docs/a.md', 'src/b.ts'], fueraDeDocs: ['src/b.ts'] }, /no son documentacion: src\/b\.ts/],
+  ];
+  for (const [nombre, diff, motivo, cfg] of casos) {
+    const d = decidirVerificacion(cfg ?? CFG, diff, 'develop');
+    assert.equal(d.tipo, 'completa', nombre);
+    assert.match(d.motivo, motivo, nombre);
+  }
+  const muchas = decidirVerificacion(CFG, { todas: ['a', 'b', 'c', 'd', 'e'], fueraDeDocs: ['a', 'b', 'c', 'd', 'e'] }, 'develop');
+  assert.match(muchas.motivo, /a, b, c y 2 mas$/);
+});
+
+test('patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas', () => {
+  assert.deepEqual(patronesDocumentacion(CFG), ['docs/**', RUTA_TAREAS_SIEMPRE_DOCUMENTACION]);
+  assert.equal(documentacionDeclarada(CFG), true);
+  assert.equal(documentacionDeclarada({ ...CFG, rutas_documentacion: [] }), false);
+});
+
+test('config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion', () => {
+  const ok = parsearConfig(
+    'comando_verificacion: "npm test"\nrutas_documentacion: [docs/**, "*.md"]\ncomando_verificacion_documentacion: "node d.js"\n',
+    'c.yml'
+  );
+  // Sin anclar: "*.md" es solo la raiz, no **/*.md (que alcanzaria skills y agentes).
+  assert.deepEqual(ok.rutas_documentacion, ['docs/**', '*.md']);
+  assert.equal(ok.comando_verificacion_documentacion, 'node d.js');
+  const porDefecto = parsearConfig('', 'c.yml');
+  assert.deepEqual(porDefecto.rutas_documentacion, []);
+  assert.equal(porDefecto.comando_verificacion_documentacion, null);
+
+  assert.throws(() => parsearConfig('rutas_documentacion: [docs/**]\n', 'c.yml'), (e: unknown) => {
+    assert.ok(e instanceof ConfigError);
+    assert.match(e.message, /"rutas_documentacion" necesita tambien "comando_verificacion"/);
+    return true;
+  });
+  assert.throws(
+    () => parsearConfig('comando_verificacion: "npm test"\ncomando_verificacion_documentacion: "node d.js"\n', 'c.yml'),
+    /"comando_verificacion_documentacion" necesita tambien "rutas_documentacion"/
+  );
+  assert.throws(
+    () => parsearConfig('comando_verificacion: "npm test"\nrutas_documentacion: docs\n', 'c.yml'),
+    /Ejemplo: rutas_documentacion: \[docs\/\*\*, README\.md\]/
+  );
+  assert.throws(() => parsearConfig('comando_verificacion: "npm test"\nrutas_documentacion: [../fuera/**]\n', 'c.yml'), /sale del repo/);
+});
+
+test('anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea', () => {
+  const una = anotarVerificacionDocumentacion('## Objetivo\n\nX.\n', '2026-11-10', 'npm test', 'solo docs', null);
+  assert.match(una, /## Verificacion de documentacion\n\n- 2026-11-10: solo docs; no se ejecuta `npm test`, sin comprobacion de documentacion declarada\n$/);
+  const dos = anotarVerificacionDocumentacion(una, '2026-11-11', 'npm `x`', 'solo docs', 'node d.js');
+  assert.equal((dos.match(/^## Verificacion de documentacion$/gm) ?? []).length, 1);
+  assert.match(dos, /- 2026-11-11: solo docs; no se ejecuta `npm 'x'`, se ejecuta `node d\.js`/);
+});
+
+test('rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'rutas-tarea-'));
+  const g = (...a: string[]) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
+  try {
+    g('init', '-q', '-b', 'develop');
+    g('config', 'user.email', 't@t');
+    g('config', 'user.name', 't');
+    g('commit', '-q', '--allow-empty', '-m', 'init');
+    g('checkout', '-q', '-b', 'tarea');
+    await writeFile(path.join(dir, 'guía con espacio.md'), 'x', 'utf8');
+    g('add', '-A');
+    g('commit', '-q', '-m', 'doc');
+    assert.equal(rutasDeTarea('no-existe', 'HEAD', ['*.md'], dir), null);
+    const r = rutasDeTarea('develop', 'HEAD', ['*.md'], dir);
+    assert.deepEqual(r, { todas: ['guía con espacio.md'], fueraDeDocs: [] });
+    assert.deepEqual(rutasDeTarea('develop', 'HEAD', ['docs/**'], dir)?.fueraDeDocs, ['guía con espacio.md']);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-100/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-100/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-100/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-100/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-100/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-100/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-100/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-cobertura.js                           |  7 +++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        | 93 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  4 ++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 42 ++++++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                   | 24 +++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/verificacion-proporcional.js                      | 70 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                              | 21 +++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     |  1 +
 15 files changed, 260 insertions(+), 9 deletions(-)
````
