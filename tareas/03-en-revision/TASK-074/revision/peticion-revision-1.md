# Peticion de revision — TASK-074 (ronda 1)

- Tarea: TASK-074 — Cobertura sobre las lineas cambiadas
- Rama revisada: feature/task-074-cobertura-sobre-las-lineas-cambiadas
- Rama base: develop
- Commit revisado (HEAD): e4a171d0fb4d6059d2b365cf0e7947a37fcd7f07
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: opus)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-074 (criterios de aceptacion y plan)

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

## Commits a revisar (git log develop..HEAD)

````
e4a171d feat(TASK-074): cobertura sobre las lineas cambiadas
b16a617 chore(TASK-074): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 0ca7e7c..499b546 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -679,8 +679,45 @@ la tarea no puede cambiar cómo se ejecutan. `--sin-verificacion` no los salta.
 base) no hay puerta. La petición de revisión excluye siempre
 `tareas/*/TASK-*/aceptacion/**`, aunque se cambie `excluir_de_revision`: el
 revisor no los lee. Que queden fuera de `comando_verificacion`, o el freno de
-fin de turno mostraría su salida. El hook que impide leerlos o editarlos
-mientras se implementa llega en una versión siguiente.
+fin de turno mostraría su salida. En la rama de la tarea, un hook `PreToolUse`
+impide al agente leerlos, buscarlos o editarlos (ver `skills/task-workflow/heldout.md`).
+
+#### Cobertura de las líneas cambiadas
+
+Una línea cambiada que ningún test ejecuta es un hallazgo. Se mide sobre las
+líneas añadidas o cambiadas desde la **merge base** de la rama con su base (no
+sobre todo el repo), sin lo que excluye `excluir_de_revision` ni los held-out, y
+con el informe **lcov** que genera el propio `comando_verificacion`: taskctl
+nunca ejecuta tests para obtenerlo.
+
+```yaml
+comando_verificacion: "npm test"           # tiene que escribir el lcov
+informe_cobertura: coverage/lcov.info      # relativa a la raiz del repo; ignorala en .gitignore
+umbral_cobertura: 80                       # opcional: % minimo cubierto para que finish cierre
+```
+
+- **`taskctl review`** añade a la petición la sección «Cobertura de las líneas
+  cambiadas»: las líneas sin cubrir por fichero (`src/a.ts: 4-6, 9`), el
+  porcentaje y los ficheros que cambian pero el informe no lista. Solo informa:
+  si el informe no existe, está cortado, es anterior al último commit de la
+  rama o ninguna de sus rutas es un fichero del repo fuera de lo excluido, lo
+  dice como aviso y no lista líneas. Sin `informe_cobertura` no hay sección.
+- **`taskctl finish`**, solo con `umbral_cobertura`: justo después de la
+  verificación (que acaba de regenerar el informe) y antes de los held-out,
+  aborta sin mergear si el porcentaje cubierto no llega al umbral (el valor
+  exacto pasa), y también si no hay datos fiables: el informe no existe, está
+  cortado, es anterior a la verificación de ese mismo `finish`, o ninguna ruta
+  del informe es del fuente del repo. Sin datos nunca cuenta como aprobado.
+- Cuenta una línea cambiada con `DA` en el informe (`DA:n,0` = sin cubrir); sin
+  `DA` no es ejecutable. Las rutas `SF:` pueden ser absolutas o relativas (a la
+  raíz del repo o a la carpeta del informe), con `\` o `/`.
+- `umbral_cobertura` e `informe_cobertura` se leen, en `finish`, de la config
+  **de la rama base**: la rama no puede rebajar su propio freno. El umbral exige
+  `informe_cobertura` y `comando_verificacion`.
+- `--sin-verificacion` no regenera el informe, así que tampoco mide el umbral:
+  lo avisa, y el salto queda anotado en la tarea.
+- Si la cobertura mide el código compilado (por ejemplo `dist/`, excluido) y no
+  el fuente, el informe no sirve: con umbral, `finish` no cierra.
 
 #### Guardián de merges (hook `PreToolUse`)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
index cb6e706..c0f2233 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
@@ -18,6 +18,13 @@ tiene criterios que solo se verifican tras el merge.
 4. Actualizar el registro de progreso que use el proyecto.
 5. `taskctl finish`.
 
+**Cobertura de las lineas cambiadas.** Con `informe_cobertura` (el lcov que
+escribe `comando_verificacion`), la peticion de revision lista las lineas
+cambiadas desde la merge base que ningun test ejecuta: cada una es un hallazgo
+(se añade el test o se justifica por que no). Con `umbral_cobertura` en la
+config de la rama base, `finish` no cierra por debajo del porcentaje, ni sin un
+informe fresco que medir. No toques el umbral para pasar: es de la persona.
+
 Commits: mensajes en el idioma del proyecto, una rama por tarea, merge sin
 fast-forward. Si el repo tiene activada la politica de conservar ramas, no se
 borran tras el merge.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
new file mode 100644
index 0000000..29f6f2c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
@@ -0,0 +1,124 @@
+/**
+ * Puerta de cobertura en `taskctl finish` — TASK-074 (freno 8). Corre justo
+ * despues de la puerta de verificacion, que acaba de regenerar el informe, y
+ * antes de la de held-out (cuyo comando podria reescribir el mismo informe
+ * con otra suite). Mismos caminos que ellas: abrir el MR o ejecutar el script.
+ *
+ * Decisiones de Carlos en el plan:
+ * - `umbral_cobertura` e `informe_cobertura` se leen de la config de la RAMA
+ *   BASE, como los held-out: la rama no puede rebajar su propio freno.
+ * - Sin umbral, no hace nada (la cobertura solo se informa en la peticion de
+ *   revision).
+ * - Sin datos fiables, NO cierra: el informe no existe, esta cortado, es
+ *   anterior al arranque de la verificacion de este mismo finish, o ninguna
+ *   de sus rutas es un fichero del repo fuera de lo excluido. «No encuentro
+ *   datos» nunca se lee como «nada sin cubrir».
+ * - Con `--sin-verificacion` no hay informe fresco: se salta, y el salto ya
+ *   queda anotado en la tarea (seccion "Verificacion omitida").
+ * - El umbral es el porcentaje minimo cubierto; el valor exacto pasa.
+ *
+ * Lanza FinishCommandError si no se puede mergear; no escribe nada.
+ */
+import { ConfigError, type TaskcodeConfig } from '../core/config.js';
+import { EXCLUIR_HELDOUT } from '../core/heldout.js';
+import { cumpleUmbral, describirCruce, formatearPorcentaje } from '../core/cobertura-cambios.js';
+import { coberturaDeRama } from '../fs/cobertura.js';
+import { configDeRef } from '../fs/config-de-ref.js';
+import { FinishCommandError } from './finish-opciones.js';
+import type { ResultadoPuerta } from './finish-verificacion.js';
+
+export interface PuertaCoberturaOpts {
+  id: string;
+  /** Rama de la que nace la de la tarea: su config manda, y contra ella se mide. */
+  ramaBase: string;
+  /** Lo que dejo la puerta de verificacion en este mismo finish. */
+  verificacion: ResultadoPuerta;
+  /** Raiz del repo, en la rama de la tarea. */
+  cwd: string;
+  onAviso?: (aviso: string) => void;
+}
+
+export type ResultadoCobertura =
+  | { tipo: 'sin-umbral' }
+  | { tipo: 'omitida' }
+  | { tipo: 'cumple'; porcentaje: number | null };
+
+const CIERRE = 'No se ha mergeado nada.';
+
+/**
+ * Margen para comparar el mtime del informe con el arranque de la verificacion:
+ * hay sistemas de ficheros con mtime de resolucion gruesa.
+ */
+const MARGEN_MTIME_MS = 1000;
+
+function configBase(o: PuertaCoberturaOpts): TaskcodeConfig {
+  try {
+    return configDeRef(o.ramaBase, o.cwd);
+  } catch (e: unknown) {
+    if (!(e instanceof ConfigError)) throw e;
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la configuracion de "${o.ramaBase}", que es la que manda en el umbral de cobertura, ` +
+        `no es valida:\n  ${e.message.replace(/^\[ERROR\]\s*/, '')}\n${CIERRE}`
+    );
+  }
+}
+
+export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
+  const config = configBase(o);
+  const umbral = config.umbral_cobertura;
+  const informe = config.informe_cobertura;
+  if (umbral === null || informe === null) return { tipo: 'sin-umbral' };
+  const quitar =
+    `Cambiar o quitar el umbral lo decide la persona: es un commit en .taskcode/config.yml de ` +
+    `"${o.ramaBase}", integrado despues en la rama.`;
+
+  if (o.verificacion.tipo === 'omitida') {
+    o.onAviso?.(
+      `${o.id}: sin verificacion no hay informe de cobertura fresco: tampoco se mide el umbral de ` +
+        `cobertura (${umbral} %). El salto ya queda anotado en la tarea.`
+    );
+    return { tipo: 'omitida' };
+  }
+  if (o.verificacion.tipo === 'sin-comando') {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: "${o.ramaBase}" declara umbral_cobertura (${umbral} %), pero la rama no declara ` +
+        `comando_verificacion, asi que nadie regenera el informe ${informe} antes de medirlo. Restaura ` +
+        `comando_verificacion en la rama y reintenta. ${quitar} ${CIERRE}`
+    );
+  }
+
+  const excluir = [...new Set([...config.excluir_de_revision, EXCLUIR_HELDOUT])];
+  const c = coberturaDeRama(o.cwd, o.ramaBase, informe, excluir);
+  const lectura = c.lectura;
+  const sinDatos = (motivo: string): FinishCommandError =>
+    new FinishCommandError(
+      `[ERROR] ${o.id}: no se puede medir la cobertura de las lineas cambiadas (umbral ${umbral} %): ${motivo}. ` +
+        `Sin datos fiables no se cierra: comprueba que comando_verificacion escribe el informe lcov en ` +
+        `${informe} con rutas del fuente del repo. ${quitar} ${CIERRE}`
+    );
+  if (lectura.tipo === 'ausente') throw sinDatos(`la verificacion salio en verde pero no existe ${informe}`);
+  if (lectura.tipo === 'truncado') throw sinDatos(`el informe ${informe} esta cortado (sin end_of_record)`);
+  if (lectura.mtimeMs + MARGEN_MTIME_MS < o.verificacion.inicioMs) {
+    throw sinDatos(
+      `el informe ${informe} es de ${new Date(lectura.mtimeMs).toISOString()}, anterior a la verificacion de ` +
+        'este finish: no la ha regenerado'
+    );
+  }
+  if (lectura.validos === 0) {
+    throw sinDatos(
+      `ninguna ruta del informe ${informe} es un fichero del repo fuera de lo excluido de la revision ` +
+        '(¿mide el codigo compilado, o rutas de otra maquina?)'
+    );
+  }
+  const cruce = c.cruce;
+  if (cruce === null) throw sinDatos('no se pudo cruzar el informe con la rama');
+  if (!cumpleUmbral(cruce, umbral)) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la cobertura de las lineas cambiadas (${formatearPorcentaje(cruce.porcentaje as number)} %) ` +
+        `no llega al umbral de "${o.ramaBase}" (${umbral} %), medida desde la merge base ` +
+        `(${c.mergeBase.slice(0, 10)}).\n${describirCruce(cruce)}\n` +
+        `Anade los tests que ejecutan esas lineas y reintenta. ${quitar} ${CIERRE}`
+    );
+  }
+  return { tipo: 'cumple', porcentaje: cruce.porcentaje };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
index 786cb07..cfddb40 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
@@ -25,7 +25,8 @@
  */
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
-import { ConfigError, parsearConfig, type TaskcodeConfig } from '../core/config.js';
+import { ConfigError, type TaskcodeConfig } from '../core/config.js';
+import { configDeRef } from '../fs/config-de-ref.js';
 import { carpetasHeldout, variantesHeldout, CARPETA_HELDOUT, VARIABLE_HELDOUT } from '../core/heldout.js';
 import { describirResultado } from '../core/informe-verificacion.js';
 import { currentBranch, isWorkspaceClean, runGit } from '../fs/git.js';
@@ -79,9 +80,8 @@ function mergeBase(a: string, b: string, cwd: string): string | null {
 
 /** La config de `.taskcode/config.yml` en `ref`; sin fichero, la de por defecto. */
 function configDe(ref: string, cwd: string, id: string): TaskcodeConfig {
-  const r = spawnSync('git', ['show', `${ref}:.taskcode/config.yml`], { cwd, encoding: 'utf8', windowsHide: true });
   try {
-    return parsearConfig(r.status === 0 ? (r.stdout ?? '') : '', `${ref}:.taskcode/config.yml`);
+    return configDeRef(ref, cwd);
   } catch (e: unknown) {
     if (!(e instanceof ConfigError)) throw e;
     throw new FinishCommandError(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 30c0c8d..d80f747 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -53,7 +53,8 @@ export interface PuertaVerificacionOpts {
 
 export type ResultadoPuerta =
   | { tipo: 'sin-comando' }
-  | { tipo: 'verde'; duracionMs: number }
+  /** `inicioMs`: instante en que arranco la verificacion (TASK-074: un informe de cobertura anterior es viejo). */
+  | { tipo: 'verde'; duracionMs: number; inicioMs: number }
   | { tipo: 'omitida'; commit: string | null };
 
 /**
@@ -109,6 +110,7 @@ export async function puertaVerificacion(
   }
 
   const timeoutS = config.timeout_verificacion;
+  const inicioMs = Date.now();
   const r = ejecutarVerificacion(o.cwd, comando, timeoutS, o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs });
   // El memo solo con el arbol limpio: es la huella del commit que consulta el
   // guardian de merges; con el arbol sucio no la casaria nunca (MEN-3).
@@ -130,5 +132,5 @@ export async function puertaVerificacion(
         'workspace limpio: ignora esos ficheros en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
     );
   }
-  return { resultado: { tipo: 'verde', duracionMs: r.duracionMs }, tarea: o.initial };
+  return { resultado: { tipo: 'verde', duracionMs: r.duracionMs, inicioMs }, tarea: o.initial };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 93ac999..fb4ea37 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -86,6 +86,7 @@ import {
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { extraerSinVerificacion, puertaVerificacion } from './finish-verificacion.js';
 import { puertaHeldout } from './finish-heldout.js';
+import { puertaCobertura } from './finish-cobertura.js';
 import { runBoardCommand, boardFilePath } from './board.js';
 import { renderBoardMarkdown } from '../core/board-format.js';
 import { REVISION_DIRNAME } from './review.js';
@@ -454,6 +455,15 @@ export async function runFinishCommand(
       ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
       ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
     });
+    // TASK-074: con el informe que la verificacion acaba de regenerar, y antes
+    // de que el comando de held-out pueda reescribirlo.
+    puertaCobertura({
+      id,
+      ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion,
+      verificacion: r.resultado,
+      cwd: deps.repoCwd,
+      ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
+    });
     puertaHeldout({
       id,
       rama,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 86f9665..5d1bc0a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -30,7 +30,8 @@ import path from 'node:path';
 import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
 import { STATE_FOLDER, type Task } from '../core/task.js';
-import { resolverConfig } from '../core/config.js';
+import { raizDelRepo, resolverConfig } from '../core/config.js';
+import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertura.js';
 import { registrarTransicion } from '../core/transiciones.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
@@ -225,7 +226,8 @@ export function peticionTemplate(
     `${fence}diff\n` +
     `${diffBlock}\n` +
     `${fence}\n` +
-    seccionExcluidos(desde, extras)
+    seccionExcluidos(desde, extras) +
+    (extras.seccionCobertura ?? '')
   );
 }
 
@@ -243,6 +245,8 @@ export interface ExtrasPeticion {
   desde?: string;
   /** TASK-040: seccion con los hallazgos abiertos de la ronda anterior. */
   seccionPrevia?: string;
+  /** TASK-074: lineas cambiadas sin cubrir (solo si el proyecto declara `informe_cobertura`). */
+  seccionCobertura?: string;
 }
 
 /** Lo que hace falta saber de la ronda N para generar la N+1 (TASK-040). */
@@ -476,9 +480,25 @@ export async function runReviewCommand(
   // TASK-034: lo generado (dist/, lockfiles) y la propia carpeta de
   // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
   // TASK-073: los tests held-out nunca se embeben, se configure lo que se configure.
-  const excluir = [...new Set([...resolverConfig(deps.repoCwd).excluir_de_revision, EXCLUIR_HELDOUT])];
+  const configRama = resolverConfig(deps.repoCwd);
+  const excluir = [...new Set([...configRama.excluir_de_revision, EXCLUIR_HELDOUT])];
   const paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
   const diff = paraRevision.diff;
+  // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
+  // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
+  // nadie arreglo sigue ahi). Una vez por ronda y antes de escribir nada;
+  // nunca lanza: un informe roto es un aviso en la peticion.
+  const datosCobertura =
+    configRama.informe_cobertura === null
+      ? null
+      : datosCoberturaRevision(
+          raizDelRepo(deps.repoCwd),
+          baseBranch,
+          configRama.informe_cobertura,
+          excluir,
+          configRama.umbral_cobertura,
+          configRama.comando_verificacion
+        );
 
   // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
   // el diff real de la rama, no `task.agente_revisor` del frontmatter,
@@ -570,6 +590,14 @@ export async function runReviewCommand(
             patrones: excluir,
             ...(incremental && desde !== baseBranch ? { desde } : {}),
             ...(previa !== null ? { seccionPrevia: previa.seccion } : {}),
+            ...(datosCobertura === null
+              ? {}
+              : {
+                  seccionCobertura: seccionCoberturaRevision(
+                    datosCobertura,
+                    plan.fragmentado ? new Set(escritura.ficheros) : undefined
+                  ),
+                }),
           }
         )
       );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
new file mode 100644
index 0000000..db4c830
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts
@@ -0,0 +1,144 @@
+/**
+ * Cobertura de las lineas cambiadas — TASK-074 (freno 8). Una linea cambiada
+ * que ningun test ejecuta es un hallazgo, medido contra la merge base de la
+ * rama y no sobre todo el repo. Este modulo es el UNICO que decide que linea
+ * esta «sin cubrir»; review (que informa) y finish (que frena con el umbral)
+ * no lo reimplementan.
+ *
+ * Reglas (decisiones de Carlos en el plan):
+ * - Cuenta una linea añadida o cambiada con `DA` en el informe: `DA:n,0` es
+ *   sin cubrir, `DA:n,k>0` cubierta. Sin `DA` (comentario, linea en blanco,
+ *   un `type`) no es ejecutable y no cuenta.
+ * - Un fichero cambiado que no esta en el informe va aparte, «sin
+ *   instrumentar» (un .md, un .yml...): no cuenta como cubierto ni como no.
+ * - El umbral es el porcentaje minimo cubierto; el valor exacto pasa.
+ *
+ * Puro: recibe las lineas cambiadas y el informe ya resuelto a rutas del repo.
+ */
+import type { LineasEjecutadas } from './lcov.js';
+
+export interface CoberturaFichero {
+  ruta: string;
+  /** Lineas cambiadas ejecutables. */
+  ejecutables: number;
+  cubiertas: number;
+  /** Lineas cambiadas con `DA:n,0`, en orden. */
+  sinCubrir: number[];
+}
+
+export interface CruceCobertura {
+  ficheros: CoberturaFichero[];
+  /** Ficheros cambiados (con lineas añadidas) que el informe no lista. */
+  sinInstrumentar: string[];
+  ejecutables: number;
+  cubiertas: number;
+  /** Porcentaje cubierto, o null si no hay ninguna linea ejecutable cambiada. */
+  porcentaje: number | null;
+}
+
+/**
+ * Cruza las lineas añadidas (por ruta del repo) con el informe (por ruta del
+ * repo). `clave` normaliza la ruta para comparar: en Windows, sin mayusculas.
+ */
+export function cruzarCobertura(
+  anadidas: ReadonlyMap<string, readonly number[]>,
+  informe: ReadonlyMap<string, LineasEjecutadas>,
+  clave: (ruta: string) => string = (r) => r
+): CruceCobertura {
+  const porClave = new Map<string, LineasEjecutadas>();
+  for (const [ruta, lineas] of informe) porClave.set(clave(ruta), lineas);
+  const ficheros: CoberturaFichero[] = [];
+  const sinInstrumentar: string[] = [];
+  let ejecutables = 0;
+  let cubiertas = 0;
+  for (const [ruta, lineas] of [...anadidas].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
+    if (lineas.length === 0) continue;
+    const registro = porClave.get(clave(ruta));
+    if (registro === undefined) {
+      sinInstrumentar.push(ruta);
+      continue;
+    }
+    const f: CoberturaFichero = { ruta, ejecutables: 0, cubiertas: 0, sinCubrir: [] };
+    for (const n of [...lineas].sort((a, b) => a - b)) {
+      const veces = registro.get(n);
+      if (veces === undefined) continue;
+      f.ejecutables++;
+      if (veces > 0) f.cubiertas++;
+      else f.sinCubrir.push(n);
+    }
+    if (f.ejecutables === 0) continue;
+    ficheros.push(f);
+    ejecutables += f.ejecutables;
+    cubiertas += f.cubiertas;
+  }
+  return {
+    ficheros,
+    sinInstrumentar,
+    ejecutables,
+    cubiertas,
+    porcentaje: ejecutables === 0 ? null : (100 * cubiertas) / ejecutables,
+  };
+}
+
+/** Solo los ficheros de `rutas` (una peticion fragmentada por dominio), con los totales recalculados. */
+export function filtrarCruce(c: CruceCobertura, rutas: ReadonlySet<string>): CruceCobertura {
+  const ficheros = c.ficheros.filter((f) => rutas.has(f.ruta));
+  const ejecutables = ficheros.reduce((s, f) => s + f.ejecutables, 0);
+  const cubiertas = ficheros.reduce((s, f) => s + f.cubiertas, 0);
+  return {
+    ficheros,
+    sinInstrumentar: c.sinInstrumentar.filter((r) => rutas.has(r)),
+    ejecutables,
+    cubiertas,
+    porcentaje: ejecutables === 0 ? null : (100 * cubiertas) / ejecutables,
+  };
+}
+
+/** `[4,5,6,9]` -> `4-6, 9`. */
+export function rangos(lineas: readonly number[]): string {
+  const partes: string[] = [];
+  let i = 0;
+  while (i < lineas.length) {
+    const ini = lineas[i] as number;
+    let fin = ini;
+    while (i + 1 < lineas.length && lineas[i + 1] === fin + 1) {
+      fin++;
+      i++;
+    }
+    partes.push(ini === fin ? String(ini) : `${ini}-${fin}`);
+    i++;
+  }
+  return partes.join(', ');
+}
+
+/** `87.5`, `100`, `33.3`: un decimal como mucho. */
+export function formatearPorcentaje(p: number): string {
+  return String(Math.round(p * 10) / 10);
+}
+
+/** true si cumple el umbral (porcentaje minimo; el valor exacto pasa). Sin lineas ejecutables, pasa. */
+export function cumpleUmbral(c: CruceCobertura, umbral: number): boolean {
+  if (c.ejecutables === 0) return true;
+  // Sin dividir: 2 de 3 contra 66.67 no depende del redondeo de coma flotante.
+  return c.cubiertas * 100 >= umbral * c.ejecutables;
+}
+
+/** El resumen y las lineas sin cubrir, en Markdown, para la peticion y para el mensaje de finish. */
+export function describirCruce(c: CruceCobertura): string {
+  const lineas: string[] = [];
+  lineas.push(
+    c.porcentaje === null
+      ? 'Ninguna linea cambiada es ejecutable segun el informe: no hay nada que medir.'
+      : `Cubiertas ${c.cubiertas} de ${c.ejecutables} lineas cambiadas ejecutables (${formatearPorcentaje(c.porcentaje)} %).`
+  );
+  const conHuecos = c.ficheros.filter((f) => f.sinCubrir.length > 0);
+  if (conHuecos.length > 0) {
+    lineas.push('', 'Sin cubrir (ningun test las ejecuta):', '');
+    for (const f of conHuecos) lineas.push(`- \`${f.ruta}\`: ${rangos(f.sinCubrir)}`);
+  }
+  if (c.sinInstrumentar.length > 0) {
+    lineas.push('', 'Cambian pero el informe no los lista (sin instrumentar; no cuentan):', '');
+    for (const r of c.sinInstrumentar) lineas.push(`- \`${r}\``);
+  }
+  return lineas.join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 211971c..e0026e4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -19,6 +19,8 @@
  * | comando_verificacion         | null (sin freno)  | commands/doctor.ts (y los frenos, TASK-071/072) |
  * | timeout_verificacion         | 600 (segundos)    | los frenos (TASK-071/072)  |
  * | comando_heldout              | null (sin held-out) | commands/finish-heldout.ts (TASK-073) |
+ * | informe_cobertura            | null (sin freno)  | commands/review.ts, finish-cobertura.ts (TASK-074) |
+ * | umbral_cobertura             | null (solo informa) | commands/finish-cobertura.ts (TASK-074) |
  *
  * `comando_verificacion` y `timeout_verificacion` las anadio TASK-070: declaran
  * como se verifica el proyecto (el comando de tests del repo) para que los
@@ -167,6 +169,19 @@ export interface TaskcodeConfig {
    * sin held-out. Usa `timeout_verificacion`.
    */
   comando_heldout: string | null;
+  /**
+   * TASK-074: ruta, relativa a la raiz del repo, del informe lcov que genera
+   * `comando_verificacion`. null = sin freno de cobertura. Nunca se ejecutan
+   * tests para generarlo: se lee lo que haya.
+   */
+  informe_cobertura: string | null;
+  /**
+   * TASK-074: porcentaje minimo (0-100) de lineas cambiadas ejecutables que
+   * tienen que estar cubiertas para que `finish` cierre; el valor exacto pasa.
+   * null = la cobertura solo se informa en la peticion de revision. Exige
+   * `informe_cobertura` y `comando_verificacion` (que regenera el informe).
+   */
+  umbral_cobertura: number | null;
 }
 
 export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
@@ -203,6 +218,8 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   comando_verificacion: null,
   timeout_verificacion: 600,
   comando_heldout: null,
+  informe_cobertura: null,
+  umbral_cobertura: null,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -221,6 +238,8 @@ export const CLAVES_CONFIG = [
   'comando_verificacion',
   'timeout_verificacion',
   'comando_heldout',
+  'informe_cobertura',
+  'umbral_cobertura',
 ] as const;
 
 /**
@@ -484,11 +503,18 @@ export function parsearConfigConAvisos(
       case 'comando_heldout':
         config.comando_heldout = validarComando(donde, par.clave, par.valor, 'comando_heldout: "node --test $HELDOUT_DIR"');
         break;
+      case 'informe_cobertura':
+        config.informe_cobertura = validarInformeCobertura(donde, par.valor);
+        break;
+      case 'umbral_cobertura':
+        config.umbral_cobertura = validarUmbralCobertura(donde, par.valor);
+        break;
     }
   }
 
   validarSincronizacionCompleta(ruta, vistas);
   validarVerificacionCompleta(ruta, vistas);
+  validarCoberturaCompleta(ruta, vistas);
   validarRemotoCompleto(dondeUrlBase, config);
   return { config, avisos };
 }
@@ -598,6 +624,51 @@ function validarVerificacionCompleta(ruta: string, vistas: ReadonlySet<string>):
   }
 }
 
+/**
+ * TASK-074: el umbral solo tiene sentido con el informe que mide y con el
+ * comando que lo regenera en `finish`: sin comando, la puerta leeria un
+ * informe viejo (o ninguno) y bloquearia siempre.
+ */
+function validarCoberturaCompleta(ruta: string, vistas: ReadonlySet<string>): void {
+  if (!vistas.has('umbral_cobertura')) return;
+  if (!vistas.has('informe_cobertura') || !vistas.has('comando_verificacion')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "umbral_cobertura" necesita tambien "informe_cobertura" y "comando_verificacion".
+` +
+        '        El umbral se mide sobre el informe lcov que regenera la verificacion antes de cerrar. ' +
+        'Declara las dos (p. ej. informe_cobertura: coverage/lcov.info), o borra el umbral.'
+    );
+  }
+}
+
+/** Ruta relativa a la raiz del repo, como las de sincronizacion (no absoluta, no carpeta, no fuera del repo). */
+function validarInformeCobertura(donde: string, valor: unknown): string {
+  const texto = validarTextoNoVacio(donde, 'informe_cobertura', valor);
+  const motivo = motivoRutaInvalida(texto);
+  if (motivo !== null) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "informe_cobertura" "${texto}" no vale: ${motivo}.
+` +
+        '        Es la ruta del fichero lcov relativa a la raiz del repo, p. ej. informe_cobertura: coverage/lcov.info.'
+    );
+  }
+  return path.posix.normalize(texto.replace(/\\/g, '/'));
+}
+
+/** Numero de 0 a 100 (admite decimales). */
+function validarUmbralCobertura(donde: string, valor: unknown): number {
+  // El parser de bloques solo convierte enteros: `87.5` llega como texto.
+  const numero = typeof valor === 'string' && /^\d+(\.\d+)?$/.test(valor.trim()) ? parseFloat(valor) : valor;
+  if (typeof numero !== 'number' || !Number.isFinite(numero) || numero < 0 || numero > 100) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "umbral_cobertura" debe ser un numero de 0 a 100, y es ${describirValor(valor)}.
+` +
+        '        Es el porcentaje minimo de lineas cambiadas cubiertas para que finish cierre (p. ej. umbral_cobertura: 80).'
+    );
+  }
+  return numero;
+}
+
 /**
  * Lista flow de patrones `git :(glob)`. A diferencia de
  * `rutas_sincronizacion`, una lista vacia es valida (no excluir nada) y
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/lcov.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/lcov.ts
new file mode 100644
index 0000000..44f8b83
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/lcov.ts
@@ -0,0 +1,51 @@
+/**
+ * Parser de informes lcov — TASK-074. Hecho a mano (cero dependencias): solo
+ * lee `SF:` (fichero), `DA:<linea>,<veces>` (linea ejecutable y cuantas veces
+ * se ejecuto) y `end_of_record`; el resto (TN, FN, BRDA, LH...) se ignora.
+ *
+ * Puro: recibe el texto y devuelve las rutas TAL CUAL las escribio el
+ * generador (`node --test` las escribe relativas al cwd y con `\` en Windows;
+ * c8 o istanbul, absolutas). Resolverlas contra el repo es de fs/cobertura.ts.
+ */
+
+/** Veces que se ejecuto cada linea ejecutable de un fichero. */
+export type LineasEjecutadas = Map<number, number>;
+
+export interface InformeLcov {
+  /** Por ruta `SF:` cruda. Un `SF` repetido (informes fusionados) suma sus `DA`. */
+  ficheros: Map<string, LineasEjecutadas>;
+  /**
+   * El ultimo registro no tiene `end_of_record`: el informe se leyo mientras
+   * alguien lo escribia, o esta cortado. Quien lo use no debe fiarse de el.
+   */
+  truncado: boolean;
+}
+
+const DA_RE = /^DA:(\d+),(-?\d+)/;
+
+export function parsearLcov(texto: string): InformeLcov {
+  const ficheros = new Map<string, LineasEjecutadas>();
+  let actual: LineasEjecutadas | null = null;
+  for (const bruta of texto.split(/\r?\n/)) {
+    const linea = bruta.trim();
+    if (linea.startsWith('SF:')) {
+      const ruta = linea.slice(3).trim();
+      actual = ficheros.get(ruta) ?? new Map<number, number>();
+      ficheros.set(ruta, actual);
+      continue;
+    }
+    if (linea === 'end_of_record') {
+      actual = null;
+      continue;
+    }
+    if (actual === null) continue;
+    const m = DA_RE.exec(linea);
+    if (m === null) continue;
+    const n = parseInt(m[1] as string, 10);
+    const veces = Math.max(0, parseInt(m[2] as string, 10));
+    // Informes fusionados (monorepo, nyc merge): la linea se ejecuto si se
+    // ejecuto en cualquiera de ellos.
+    actual.set(n, (actual.get(n) ?? 0) + veces);
+  }
+  return { ficheros, truncado: actual !== null };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts
new file mode 100644
index 0000000..4551391
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/cobertura.ts
@@ -0,0 +1,177 @@
+/**
+ * Lectura del informe de cobertura y cruce con la rama — TASK-074. Nunca
+ * ejecuta tests: lee el lcov que haya en `informe_cobertura` (lo genera
+ * `comando_verificacion`).
+ *
+ * Las rutas `SF:` se resuelven contra el repo: absolutas (c8, istanbul) o
+ * relativas al cwd en que corrieron los tests (`node --test`, con `\` en
+ * Windows). Una relativa se prueba contra la raiz del repo y, si alli no
+ * existe, contra la carpeta del propio informe (un proyecto cuyos tests
+ * corren en un subdirectorio y escriben el lcov ahi). Las rutas cortas 8.3 de
+ * Windows se expanden con realpath, y en Windows se comparan sin mayusculas.
+ */
+import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { parsearLcov, type LineasEjecutadas } from '../core/lcov.js';
+import { cruzarCobertura, describirCruce, filtrarCruce, type CruceCobertura } from '../core/cobertura-cambios.js';
+import { ficherosVersionados, instanteUltimoCommitPropio, lineasAnadidas, mergeBase } from './git.js';
+
+/** Clave de comparacion de rutas del repo: en Windows, sin mayusculas. */
+export function claveRuta(ruta: string): string {
+  return process.platform === 'win32' ? ruta.toLowerCase() : ruta;
+}
+
+export type LecturaInforme =
+  | { tipo: 'ausente'; ruta: string }
+  | { tipo: 'truncado'; ruta: string; mtimeMs: number }
+  | {
+      tipo: 'ok';
+      ruta: string;
+      mtimeMs: number;
+      /** Por ruta del repo (con `/`). */
+      porRuta: Map<string, LineasEjecutadas>;
+      /** Ficheros del informe que son ficheros versionados del repo fuera de lo excluido. */
+      validos: number;
+    };
+
+function real(p: string): string {
+  try {
+    return realpathSync.native(p);
+  } catch {
+    return p;
+  }
+}
+
+/** Ruta del repo (con `/`) de una entrada `SF:`, o null si cae fuera del repo. */
+export function resolverSf(sf: string, raizReal: string, dirInforme: string): string | null {
+  const s = sf.replace(/\\/g, '/');
+  const absoluta = /^[A-Za-z]:\//.test(s) || s.startsWith('/');
+  const candidatos = absoluta ? [s] : [path.join(raizReal, s), path.join(dirInforme, s)];
+  const elegido = candidatos.find((c) => existsSync(c)) ?? (candidatos[0] as string);
+  const rel = path.relative(raizReal, real(elegido));
+  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
+  return rel.split(path.sep).join('/');
+}
+
+/** Lee y resuelve el informe. `informe` es relativa a la raiz del repo. */
+export function leerInformeCobertura(raiz: string, informe: string, excluir: readonly string[]): LecturaInforme {
+  const raizReal = real(raiz);
+  const abs = path.join(raizReal, informe);
+  let texto: string;
+  let mtimeMs: number;
+  try {
+    mtimeMs = statSync(abs).mtimeMs;
+    texto = readFileSync(abs, 'utf8');
+  } catch {
+    return { tipo: 'ausente', ruta: informe };
+  }
+  const lcov = parsearLcov(texto);
+  if (lcov.truncado) return { tipo: 'truncado', ruta: informe, mtimeMs };
+  const dirInforme = path.dirname(abs);
+  const porRuta = new Map<string, LineasEjecutadas>();
+  for (const [sf, lineas] of lcov.ficheros) {
+    const ruta = resolverSf(sf, raizReal, dirInforme);
+    if (ruta === null) continue;
+    const previa = porRuta.get(ruta);
+    if (previa === undefined) {
+      porRuta.set(ruta, lineas);
+    } else {
+      for (const [n, v] of lineas) previa.set(n, (previa.get(n) ?? 0) + v);
+    }
+  }
+  const versionados = new Set(ficherosVersionados(excluir, raiz).map(claveRuta));
+  let validos = 0;
+  for (const ruta of porRuta.keys()) if (versionados.has(claveRuta(ruta))) validos++;
+  return { tipo: 'ok', ruta: informe, mtimeMs, porRuta, validos };
+}
+
+export interface CoberturaDeRama {
+  mergeBase: string;
+  lectura: LecturaInforme;
+  /** null si el informe no se pudo usar (ausente o truncado). */
+  cruce: CruceCobertura | null;
+}
+
+/** Lineas añadidas desde la merge base de HEAD con `base`, cruzadas con el informe. */
+export function coberturaDeRama(raiz: string, base: string, informe: string, excluir: readonly string[]): CoberturaDeRama {
+  const mb = mergeBase('HEAD', base, raiz);
+  const lectura = leerInformeCobertura(raiz, informe, excluir);
+  if (lectura.tipo !== 'ok') return { mergeBase: mb, lectura, cruce: null };
+  const anadidas = lineasAnadidas(mb, 'HEAD', excluir, raiz);
+  return { mergeBase: mb, lectura, cruce: cruzarCobertura(anadidas, lectura.porRuta, claveRuta) };
+}
+
+/** Lo que la peticion de revision necesita, calculado UNA vez por ronda. */
+export type DatosCoberturaRevision =
+  | { tipo: 'error'; motivo: string }
+  | {
+      tipo: 'ok';
+      cobertura: CoberturaDeRama;
+      base: string;
+      /** El informe es anterior al ultimo commit propio de la rama: no corresponde a este codigo. */
+      viejo: boolean;
+      umbral: number | null;
+      comando: string | null;
+    };
+
+/** Nunca lanza: un fallo es un aviso en la peticion, no una ronda sin escribir. */
+export function datosCoberturaRevision(
+  raiz: string,
+  base: string,
+  informe: string,
+  excluir: readonly string[],
+  umbral: number | null,
+  comando: string | null
+): DatosCoberturaRevision {
+  try {
+    const cobertura = coberturaDeRama(raiz, base, informe, excluir);
+    const ultimo = instanteUltimoCommitPropio('HEAD', raiz);
+    const lectura = cobertura.lectura;
+    // %ct tiene resolucion de segundos: el informe cuenta como nuevo si es del mismo segundo o posterior.
+    const viejo = lectura.tipo !== 'ausente' && ultimo !== null && Math.floor(lectura.mtimeMs / 1000) * 1000 < ultimo;
+    return { tipo: 'ok', cobertura, base, viejo, umbral, comando };
+  } catch (e: unknown) {
+    return { tipo: 'error', motivo: e instanceof Error ? e.message : String(e) };
+  }
+}
+
+/** La seccion de la peticion; con `rutas`, solo esos ficheros (peticion fragmentada por dominio). */
+export function seccionCoberturaRevision(d: DatosCoberturaRevision, rutas?: ReadonlySet<string>): string {
+  const titulo = '\n## Cobertura de las lineas cambiadas\n\n';
+  if (d.tipo === 'error') return `${titulo}[AVISO] No se pudo calcular: ${d.motivo}\n`;
+  const { cobertura, base, viejo, umbral, comando } = d;
+  const lectura = cobertura.lectura;
+  const regenerar = comando === null ? 'regeneralo' : `regeneralo con \`${comando}\``;
+  const cabecera =
+    `Informe \`${lectura.ruta}\`; lineas añadidas desde la merge base con \`${base}\` ` +
+    `(${cobertura.mergeBase.slice(0, 10)}), sin lo excluido del diff. No se ha ejecutado ningun test ` +
+    'para esta peticion.' +
+    (umbral === null ? '' : ` Umbral de finish: ${umbral} % cubierto (se mide con el informe que regenera finish).`) +
+    '\n\n';
+  if (lectura.tipo === 'ausente') {
+    return `${titulo}${cabecera}[AVISO] No existe el informe: ${regenerar} y repite la peticion si quieres el dato.\n`;
+  }
+  const fecha = new Date(lectura.mtimeMs).toISOString();
+  if (lectura.tipo === 'truncado') {
+    return `${titulo}${cabecera}[AVISO] El informe (de ${fecha}) esta cortado (sin end_of_record): no se usa. ${regenerar}.\n`;
+  }
+  if (viejo) {
+    return (
+      `${titulo}${cabecera}[AVISO] El informe es de ${fecha}, anterior al ultimo commit de la rama: no ` +
+      `corresponde a este codigo y no se listan lineas. ${regenerar} despues de commitear.\n`
+    );
+  }
+  if (lectura.validos === 0) {
+    return (
+      `${titulo}${cabecera}[AVISO] Ninguna ruta del informe es un fichero del repo fuera de lo excluido ` +
+      '(¿mide el codigo compilado, o rutas de otra maquina?): el informe esta mal configurado y no se usa.\n'
+    );
+  }
+  const cruce = rutas === undefined ? cobertura.cruce : cobertura.cruce === null ? null : filtrarCruce(cobertura.cruce, rutas);
+  if (cruce === null) return `${titulo}${cabecera}[AVISO] Sin datos.\n`;
+  return (
+    `${titulo}${cabecera}Informe de ${fecha}. Cada linea sin cubrir es un hallazgo para el informe de ` +
+    'revision: o se anade el test que la ejecuta, o se justifica por que no.\n\n' +
+    `${describirCruce(cruce)}\n`
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts
new file mode 100644
index 0000000..5ca54d3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts
@@ -0,0 +1,16 @@
+/**
+ * La configuracion de `.taskcode/config.yml` tal como esta en una referencia
+ * de Git (p. ej. la rama base), no en el arbol de trabajo. La usan las
+ * puertas de `finish` que la rama de la tarea no puede relajar editando su
+ * propio config: los held-out (TASK-073) y la cobertura (TASK-074).
+ *
+ * Sin fichero en esa referencia, la configuracion por defecto. Un fichero
+ * invalido lanza ConfigError: quien la usa decide el mensaje.
+ */
+import { spawnSync } from 'node:child_process';
+import { parsearConfig, type TaskcodeConfig } from '../core/config.js';
+
+export function configDeRef(ref: string, cwd: string): TaskcodeConfig {
+  const r = spawnSync('git', ['show', `${ref}:.taskcode/config.yml`], { cwd, encoding: 'utf8', windowsHide: true });
+  return parsearConfig(r.status === 0 ? (r.stdout ?? '') : '', `${ref}:.taskcode/config.yml`);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index b7ceba3..8912d13 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -307,7 +307,7 @@ export function diffParaRevision(
   cwd: string
 ): DiffParaRevision {
   const rango = `${desde}..${hasta}`;
-  const sinExcluidos = ['--', '.', ...excluir.map((p) => `:(exclude,glob)${p}`)];
+  const sinExcluidos = pathspecSinExcluidos(excluir);
   const nombres = (args: readonly string[]): string[] =>
     partirNul(runGit([...SIN_COMILLAS, 'diff', '--name-only', '-z', rango, ...args], cwd));
 
@@ -334,6 +334,89 @@ export function diffParaRevision(
   };
 }
 
+/**
+ * Pathspec «todo el repo menos los excluidos». Lo comparten el diff de la
+ * peticion de revision y las lineas cambiadas de la cobertura (TASK-074):
+ * un solo motor de patrones, el de Git.
+ */
+export function pathspecSinExcluidos(excluir: readonly string[]): string[] {
+  return ['--', '.', ...excluir.map((p) => `:(exclude,glob)${p}`)];
+}
+
+/**
+ * TASK-074: lineas añadidas o cambiadas entre `desde` y `hasta`, por ruta del
+ * repo (con `/`), sin los ficheros que casan con `excluir`. Solo cabeceras
+ * `@@ -a,b +c,d @@` de un diff sin contexto. Las opciones que cambian la
+ * salida del diff segun la configuracion de la maquina se fijan aqui
+ * (renombres, prefijos, colores, diff externo): un rename no puede convertir
+ * el fichero entero en «cambiado». Borrados y binarios no aportan lineas.
+ */
+export function lineasAnadidas(
+  desde: string,
+  hasta: string,
+  excluir: readonly string[],
+  cwd: string
+): Map<string, number[]> {
+  const salida = runGit(
+    [
+      ...SIN_COMILLAS,
+      '-c',
+      'diff.noprefix=false',
+      '-c',
+      'diff.mnemonicPrefix=false',
+      'diff',
+      '-U0',
+      '--no-color',
+      '--no-ext-diff',
+      '--no-textconv',
+      '-M',
+      '--src-prefix=a/',
+      '--dst-prefix=b/',
+      `${desde}..${hasta}`,
+      ...pathspecSinExcluidos(excluir),
+    ],
+    cwd
+  );
+  const lineas = new Map<string, number[]>();
+  let actual: number[] | null = null;
+  for (const l of salida.split('\n')) {
+    if (l.startsWith('+++ ')) {
+      // Git añade un tabulador tras la ruta si esta lleva espacios.
+      const destino = l.slice(4).replace(/\t$/, '');
+      if (destino === '/dev/null' || !destino.startsWith('b/')) {
+        actual = null;
+        continue;
+      }
+      const ruta = destino.slice(2);
+      actual = lineas.get(ruta) ?? [];
+      lineas.set(ruta, actual);
+      continue;
+    }
+    if (actual === null || !l.startsWith('@@ ')) continue;
+    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
+    if (m === null) continue;
+    const inicio = parseInt(m[1] as string, 10);
+    const cuantas = m[2] === undefined ? 1 : parseInt(m[2], 10);
+    for (let i = 0; i < cuantas; i++) actual.push(inicio + i);
+  }
+  return lineas;
+}
+
+/** TASK-074: ficheros versionados en HEAD fuera de `excluir`, con `/`. */
+export function ficherosVersionados(excluir: readonly string[], cwd: string): string[] {
+  return partirNul(runGit([...SIN_COMILLAS, 'ls-files', '-z', ...pathspecSinExcluidos(excluir)], cwd));
+}
+
+/**
+ * TASK-074: instante (ms) del ultimo commit de `ref` que no es un merge. El
+ * update de review mergea la base en la rama justo antes de la peticion: ese
+ * merge es siempre mas nuevo que cualquier informe de cobertura.
+ */
+export function instanteUltimoCommitPropio(ref: string, cwd: string): number | null {
+  const s = runGit(['log', '-1', '--no-merges', '--format=%ct', ref], cwd);
+  return s === '' ? null : parseInt(s, 10) * 1000;
+}
+
 /**
  * TASK-054: sin esto Git entrecomilla las rutas no ASCII y las escapa en
  * octal; la clasificacion por dominio trabajaba con esa ruta escapada y el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
new file mode 100644
index 0000000..c58ab5d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
@@ -0,0 +1,352 @@
+/**
+ * Cobertura de las lineas cambiadas (TASK-074), contra repos Git temporales
+ * de verdad y con un lcov REAL: el de `node --test --experimental-test-coverage
+ * --test-reporter=lcov`, que en Windows escribe `SF:` relativo y con `\`. Un
+ * lcov escrito a mano con `/` no detectaria eso. El lcov lo genera el script
+ * de verificacion del fixture (fuera del repo), nunca el codigo de produccion.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
+import { existsSync, readFileSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { lineasAnadidas, mergeBase } from '../../src/fs/git.js';
+import { coberturaDeRama, leerInformeCobertura } from '../../src/fs/cobertura.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+
+/**
+ * Verificacion del fixture. Lee su modo de un fichero junto a el:
+ * `cov` genera el lcov real; `nada` no escribe nada; `dist` escribe un lcov que
+ * solo nombra codigo compilado. Deja un testigo en cada ejecucion.
+ * NODE_TEST_CONTEXT se quita: si no, el `node --test` hijo se reportaria al
+ * runner de esta suite en vez de ejecutarse solo.
+ */
+const SCRIPT = `
+const fs = require('node:fs');
+const path = require('node:path');
+const { spawnSync } = require('node:child_process');
+fs.appendFileSync(path.join(__dirname, 'testigo'), 'x');
+const modo = fs.readFileSync(path.join(__dirname, 'modo'), 'utf8').trim();
+if (modo === 'nada') process.exit(0);
+fs.mkdirSync('coverage', { recursive: true });
+if (modo === 'dist') { fs.writeFileSync('coverage/lcov.info', 'SF:dist/x.js\\nDA:1,1\\nend_of_record\\n'); process.exit(0); }
+const env = { ...process.env };
+delete env.NODE_TEST_CONTEXT;
+const r = spawnSync(process.execPath, ['--test', '--experimental-test-coverage', '--test-reporter=lcov',
+  '--test-reporter-destination=coverage/lcov.info', 'test/*.test.mjs'], { env, encoding: 'utf8' });
+process.exit(r.status === null ? 1 : r.status);
+`;
+
+/** Lineas 1-7; la 6 (return 'neg') no la ejecuta ningun test. */
+const FUENTE = "// comentario\nexport function f(x) {\n  if (x > 0) {\n    return 'pos';\n  }\n  return 'neg';\n}\n";
+const TEST_FUENTE = "import { test } from 'node:test';\nimport { f } from '../src/a.mjs';\ntest('pos', () => { f(1); });\n";
+
+interface Ctx {
+  repoRoot: string;
+  tareasRoot: string;
+  dir: string;
+  modo(m: 'cov' | 'nada' | 'dist'): Promise<void>;
+  ejecuciones(): number;
+  generar(): void;
+}
+
+function config(comando: string, extra: string): string {
+  return `comando_verificacion: "${comando}"\ninforme_cobertura: coverage/lcov.info\n${extra}`;
+}
+
+async function conCobertura(extraBase: string, fn: (c: Ctx) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'cobertura-verif-'));
+  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
+  await writeFile(path.join(dir, 'modo'), 'cov', 'utf8');
+  const comando = `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')}`;
+  try {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config(comando, extraBase), 'utf8');
+      await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\ncoverage/\n', 'utf8');
+      commitAll(repoRoot, 'config');
+      await fn({
+        repoRoot,
+        tareasRoot,
+        dir,
+        modo: (m) => writeFile(path.join(dir, 'modo'), m, 'utf8'),
+        ejecuciones: () => (existsSync(path.join(dir, 'testigo')) ? readFileSync(path.join(dir, 'testigo'), 'utf8').length : 0),
+        generar: () => {
+          const r = spawnSync('node', [path.join(dir, 'verif.cjs')], { cwd: repoRoot, encoding: 'utf8' });
+          assert.equal(r.status, 0, r.stderr);
+        },
+      });
+    });
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+/** En la rama de la tarea: el codigo con una linea sin cubrir y su test. */
+async function codigoDeLaTarea(repoRoot: string): Promise<void> {
+  await mkdir(path.join(repoRoot, 'src'), { recursive: true });
+  await mkdir(path.join(repoRoot, 'test'), { recursive: true });
+  await writeFile(path.join(repoRoot, 'src', 'a.mjs'), FUENTE, 'utf8');
+  await writeFile(path.join(repoRoot, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
+  commitAll(repoRoot, 'feat: codigo con una rama sin test');
+}
+
+const integrada = (rama: string, cwd: string) =>
+  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;
+
+async function finish(c: Ctx, args: string[], avisos: string[] = []) {
+  return runFinishCommand(c.tareasRoot, args, '2026-11-05', {
+    repoCwd: c.repoRoot,
+    scriptsDir: SCRIPTS_DIR,
+    onAviso: (a) => avisos.push(a),
+  });
+}
+
+// ---------------------------------------------------------------------
+// Lineas cambiadas y lectura del informe
+// ---------------------------------------------------------------------
+
+test('cobertura: las lineas cambiadas se miden desde la merge base, no desde la punta de la base', async () => {
+  await withTempRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/task-990-x', 'develop'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\ndos\n', 'utf8');
+    commitAll(repoRoot, 'a');
+    git(['checkout', '-q', 'develop'], repoRoot);
+    // develop cambia un fichero que la rama tambien tiene: contra la PUNTA de
+    // develop, el diff lo daria por «cambiado» en la rama (su version vieja).
+    await writeFile(path.join(repoRoot, 'README.md'), '# cambiado en develop\n', 'utf8');
+    commitAll(repoRoot, 'readme en develop');
+    git(['checkout', '-q', 'feature/task-990-x'], repoRoot);
+    const mb = mergeBase('HEAD', 'develop', repoRoot);
+    assert.deepEqual([...lineasAnadidas(mb, 'HEAD', [], repoRoot)], [['a.mjs', [1, 2]]]);
+    assert.deepEqual(lineasAnadidas('develop', 'HEAD', [], repoRoot).get('README.md'), [1], 'contra la punta si saldria');
+    // Tras integrar la base (lo que hace el update de review), b.mjs sigue fuera.
+    git(['merge', '-q', '--no-edit', 'develop'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\nDOS\ntres\n', 'utf8');
+    commitAll(repoRoot, 'a de nuevo');
+    const mb2 = mergeBase('HEAD', 'develop', repoRoot);
+    assert.deepEqual([...lineasAnadidas(mb2, 'HEAD', [], repoRoot)], [['a.mjs', [1, 2, 3]]]);
+  });
+});
+
+test('cobertura: el cruce de la rama usa la merge base: un cambio posterior de la base no cuenta', async () => {
+  await withTempRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/task-989-x', 'develop'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\n', 'utf8');
+    commitAll(repoRoot, 'a');
+    git(['checkout', '-q', 'develop'], repoRoot);
+    // Cambia una linea que la rama tiene: contra la punta, saldria como «añadida» en la rama.
+    await writeFile(path.join(repoRoot, 'README.md'), '# cambiado en develop\n', 'utf8');
+    commitAll(repoRoot, 'readme en develop');
+    git(['checkout', '-q', 'feature/task-989-x'], repoRoot);
+    await mkdir(path.join(repoRoot, 'coverage'), { recursive: true });
+    await writeFile(
+      path.join(repoRoot, 'coverage', 'lcov.info'),
+      'SF:a.mjs\nDA:1,1\nend_of_record\nSF:README.md\nDA:1,0\nDA:2,0\nend_of_record\n',
+      'utf8'
+    );
+    const c = coberturaDeRama(repoRoot, 'develop', 'coverage/lcov.info', []);
+    assert.ok(c.cruce);
+    assert.deepEqual([c.cruce.cubiertas, c.cruce.ejecutables], [1, 1], 'README.md es de develop, no de la rama');
+  });
+});
+
+test('cobertura: respeta excluir_de_revision, no depende de la config de diff de la maquina y sigue renombres', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await writeFile(path.join(repoRoot, 'viejo.mjs'), Array.from({ length: 20 }, (_, i) => `l${i}`).join('\n') + '\n', 'utf8');
+    commitAll(repoRoot, 'viejo');
+    git(['checkout', '-q', '-b', 'feature/task-991-x', 'develop'], repoRoot);
+    git(['config', 'diff.noprefix', 'true'], repoRoot);
+    git(['config', 'diff.renames', 'false'], repoRoot);
+    git(['config', 'color.diff', 'always'], repoRoot);
+    git(['mv', 'viejo.mjs', 'nuevo.mjs'], repoRoot);
+    await mkdir(path.join(repoRoot, 'dist'), { recursive: true });
+    await writeFile(path.join(repoRoot, 'dist', 'x.js'), 'compilado\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'con espacio.mjs'), 'a\n', 'utf8');
+    commitAll(repoRoot, 'rename y dist');
+    const mb = mergeBase('HEAD', 'develop', repoRoot);
+    const conExclusion = lineasAnadidas(mb, 'HEAD', ['**/dist/**'], repoRoot);
+    assert.deepEqual([...conExclusion], [['con espacio.mjs', [1]]], 'el rename puro no aporta lineas; dist excluido');
+    const sin = lineasAnadidas(mb, 'HEAD', [], repoRoot);
+    assert.deepEqual(sin.get('dist/x.js'), [1]);
+  });
+});
+
+test('cobertura: el lcov real de node --test (SF relativo, con \\ en Windows) se resuelve a rutas del repo', async () => {
+  await conCobertura('', async (c) => {
+    await codigoDeLaTarea(c.repoRoot);
+    c.generar();
+    const texto = await readFile(path.join(c.repoRoot, 'coverage', 'lcov.info'), 'utf8');
+    assert.match(texto, /^SF:src[\\/]a\.mjs$/m, 'formato real del reporter');
+    assert.match(texto, /^DA:6,0$/m);
+    const l = leerInformeCobertura(c.repoRoot, 'coverage/lcov.info', ['**/dist/**']);
+    assert.equal(l.tipo, 'ok');
+    if (l.tipo !== 'ok') return;
+    assert.deepEqual([...l.porRuta.keys()].sort(), ['src/a.mjs', 'test/a.test.mjs']);
+    assert.equal(l.validos, 2);
+    // Absoluta (c8, istanbul) y relativa a la carpeta del propio informe.
+    await writeFile(
+      path.join(c.repoRoot, 'coverage', 'lcov.info'),
+      `SF:${path.join(c.repoRoot, 'src', 'a.mjs')}\nDA:1,1\nend_of_record\nSF:../test/a.test.mjs\nDA:1,1\nend_of_record\nSF:${path.join(tmpdir(), 'fuera.js')}\nDA:1,0\nend_of_record\n`,
+      'utf8'
+    );
+    const l2 = leerInformeCobertura(c.repoRoot, 'coverage/lcov.info', []);
+    assert.ok(l2.tipo === 'ok');
+    assert.deepEqual([...l2.porRuta.keys()].sort(), ['src/a.mjs', 'test/a.test.mjs'], 'lo de fuera del repo se ignora');
+    await writeFile(path.join(c.repoRoot, 'coverage', 'lcov.info'), 'SF:src/a.mjs\nDA:1,1\n', 'utf8');
+    assert.equal(leerInformeCobertura(c.repoRoot, 'coverage/lcov.info', []).tipo, 'truncado');
+    assert.equal(leerInformeCobertura(c.repoRoot, 'coverage/no-existe.info', []).tipo, 'ausente');
+  });
+});
+
+// ---------------------------------------------------------------------
+// review: informa, no ejecuta nada
+// ---------------------------------------------------------------------
+
+async function peticion(c: Ctx, id: string): Promise<string> {
+  await runFinishlessReview(c, id);
+  return readFile(path.join(c.tareasRoot, '03-en-revision', id, 'revision', 'peticion-revision-1.md'), 'utf8');
+}
+
+async function runFinishlessReview(c: Ctx, id: string): Promise<void> {
+  await runReviewCommand(c.tareasRoot, [id], '2026-11-05', { repoCwd: c.repoRoot, scriptsDir: SCRIPTS_DIR });
+}
+
+async function tareaEnCurso(c: Ctx, id: string, rama: string): Promise<void> {
+  const { writeTareaFile } = await import('../../src/fs/task-store.js');
+  git(['checkout', '-q', '-b', rama, 'develop'], c.repoRoot);
+  await writeTareaFile(c.tareasRoot, sampleTask({ id, rama, estado: 'en-curso' }), '## Objetivo\nProbar.\n');
+  commitAll(c.repoRoot, `chore(${id}): tarea`);
+  await codigoDeLaTarea(c.repoRoot);
+}
+
+test('review: la peticion nombra la linea exacta sin cubrir (y no su vecina cubierta) sin ejecutar ningun test', async () => {
+  await conCobertura('', async (c) => {
+    await tareaEnCurso(c, 'TASK-995', 'feature/task-995-cob');
+    c.generar();
+    const antes = c.ejecuciones();
+    const p = await peticion(c, 'TASK-995');
+    assert.equal(c.ejecuciones(), antes, 'review no ejecuta comando_verificacion');
+    assert.match(p, /## Cobertura de las lineas cambiadas/);
+    assert.match(p, /- `src\/a\.mjs`: 6\n/);
+    assert.doesNotMatch(p, /`src\/a\.mjs`: [^\n]*\b5\b/);
+    assert.match(p, /Cubiertas 9 de 10 lineas cambiadas ejecutables \(90 %\)/);
+    assert.match(p, /Cada linea sin cubrir es un hallazgo/);
+  });
+});
+
+test('review: un informe anterior al ultimo commit de la rama, o ausente, es un aviso y no lista lineas', async () => {
+  await conCobertura('', async (c) => {
+    await tareaEnCurso(c, 'TASK-996', 'feature/task-996-cob');
+    c.generar();
+    const viejo = new Date('2020-01-01T00:00:00Z');
+    await utimes(path.join(c.repoRoot, 'coverage', 'lcov.info'), viejo, viejo);
+    const p = await peticion(c, 'TASK-996');
+    assert.match(p, /\[AVISO\] El informe es de 2020-01-01T00:00:00\.000Z, anterior al ultimo commit de la rama/);
+    assert.doesNotMatch(p, /`src\/a\.mjs`: 6/);
+  });
+  await conCobertura('', async (c) => {
+    await tareaEnCurso(c, 'TASK-997', 'feature/task-997-cob');
+    const p = await peticion(c, 'TASK-997');
+    assert.match(p, /\[AVISO\] No existe el informe/);
+  });
+});
+
+test('review: sin informe_cobertura no hay seccion (como hasta ahora)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const c = { repoRoot, tareasRoot } as Ctx;
+    await tareaEnCurso(c, 'TASK-998', 'feature/task-998-cob');
+    const p = await peticion(c, 'TASK-998');
+    assert.doesNotMatch(p, /Cobertura de las lineas cambiadas/);
+  });
+});
+
+// ---------------------------------------------------------------------
+// finish: frena con el umbral de la base
+// ---------------------------------------------------------------------
+
+async function tareaEnRevision(c: Ctx, id: string): Promise<string> {
+  const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-cob` });
+  await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+  await codigoDeLaTarea(c.repoRoot);
+  return task.rama;
+}
+
+test('finish: por debajo del umbral no cierra, nombra la linea y develop no avanza', async () => {
+  await conCobertura('umbral_cobertura: 91\n', async (c) => {
+    const rama = await tareaEnRevision(c, 'TASK-981');
+    const develop = git(['rev-parse', 'develop'], c.repoRoot).trim();
+    await assert.rejects(
+      () => finish(c, ['TASK-981']),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match(e.message, /la cobertura de las lineas cambiadas \(90 %\) no llega al umbral de "develop" \(91 %\)/);
+        assert.match(e.message, /- `src\/a\.mjs`: 6/);
+        assert.match(e.message, /No se ha mergeado nada/);
+        return true;
+      }
+    );
+    assert.equal(git(['rev-parse', 'develop'], c.repoRoot).trim(), develop);
+    assert.equal(integrada(rama, c.repoRoot), false);
+    assert.ok(existsSync(path.join(c.tareasRoot, '03-en-revision', 'TASK-981')));
+  });
+});
+
+test('finish: en el valor exacto del umbral cierra, con el informe que regenera su propia verificacion', async () => {
+  await conCobertura('umbral_cobertura: 90\n', async (c) => {
+    const rama = await tareaEnRevision(c, 'TASK-982');
+    // Un informe viejo y engañoso en disco: la verificacion lo reescribe y se mide el nuevo.
+    await mkdir(path.join(c.repoRoot, 'coverage'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, 'coverage', 'lcov.info'), 'SF:src/a.mjs\nDA:1,0\nDA:2,0\nend_of_record\n', 'utf8');
+    const r = await finish(c, ['TASK-982']);
+    assert.equal(r.cierre, 'terminada');
+    assert.equal(integrada(rama, c.repoRoot), true);
+  });
+});
+
+test('finish: el umbral se lee de la base; la rama no puede rebajarlo', async () => {
+  await conCobertura('umbral_cobertura: 100\n', async (c) => {
+    await tareaEnRevision(c, 'TASK-983');
+    const cfg = path.join(c.repoRoot, '.taskcode', 'config.yml');
+    const texto = (await readFile(cfg, 'utf8')).replace('umbral_cobertura: 100', 'umbral_cobertura: 0');
+    await writeFile(cfg, texto, 'utf8');
+    commitAll(c.repoRoot, 'rebajar el umbral en la rama');
+    await assert.rejects(() => finish(c, ['TASK-983']), /no llega al umbral de "develop" \(100 %\)[\s\S]*commit en \.taskcode\/config\.yml de "develop"/);
+  });
+});
+
+test('finish: sin datos fiables no cierra (informe ausente, viejo o que solo mide lo excluido)', async () => {
+  await conCobertura('umbral_cobertura: 50\n', async (c) => {
+    await tareaEnRevision(c, 'TASK-984');
+    await c.modo('nada');
+    await assert.rejects(() => finish(c, ['TASK-984']), /no se puede medir[\s\S]*no existe coverage\/lcov\.info/);
+    await mkdir(path.join(c.repoRoot, 'coverage'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, 'coverage', 'lcov.info'), 'SF:src/a.mjs\nDA:1,1\nend_of_record\n', 'utf8');
+    const viejo = new Date(Date.now() - 3600_000);
+    await utimes(path.join(c.repoRoot, 'coverage', 'lcov.info'), viejo, viejo);
+    await assert.rejects(() => finish(c, ['TASK-984']), /anterior a la verificacion de este finish: no la ha regenerado/);
+    await c.modo('dist');
+    await assert.rejects(() => finish(c, ['TASK-984']), /ninguna ruta del informe coverage\/lcov\.info es un fichero del repo fuera de lo excluido/);
+    assert.equal(integrada('feature/task-984-cob', c.repoRoot), false);
+  });
+});
+
+test('finish: --sin-verificacion salta tambien la cobertura y lo avisa; sin umbral cierra como siempre', async () => {
+  await conCobertura('umbral_cobertura: 100\n', async (c) => {
+    await tareaEnRevision(c, 'TASK-985');
+    const avisos: string[] = [];
+    const r = await finish(c, ['TASK-985', '--sin-verificacion'], avisos);
+    assert.equal(r.cierre, 'terminada');
+    assert.ok(avisos.some((a) => /tampoco se mide el umbral de cobertura \(100 %\)/.test(a)), avisos.join('\n'));
+  });
+  await conCobertura('', async (c) => {
+    await tareaEnRevision(c, 'TASK-986');
+    await c.modo('nada');
+    const r = await finish(c, ['TASK-986']);
+    assert.equal(r.cierre, 'terminada', 'sin umbral, sin informe: no frena');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
new file mode 100644
index 0000000..4e4399c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/cobertura.test.ts
@@ -0,0 +1,154 @@
+/**
+ * Cobertura de las lineas cambiadas (TASK-074): el parser de lcov, el cruce
+ * con las lineas añadidas, el umbral y las claves de config. Puro, sin repo;
+ * el lcov real de `node --test` y los repos van en
+ * test/commands/cobertura-cambios.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { parsearLcov } from '../../src/core/lcov.js';
+import {
+  cruzarCobertura,
+  cumpleUmbral,
+  describirCruce,
+  filtrarCruce,
+  formatearPorcentaje,
+  rangos,
+} from '../../src/core/cobertura-cambios.js';
+import { ConfigError, parsearConfig } from '../../src/core/config.js';
+
+const LCOV = [
+  'TN:',
+  'SF:src\\a.mjs',
+  'FN:2,f',
+  'BRDA:5,2,0,0',
+  'DA:1,1',
+  'DA:2,1',
+  'DA:3,1',
+  'DA:6,0',
+  'DA:7,1',
+  'LH:4',
+  'LF:5',
+  'end_of_record',
+  'SF:/abs/b.ts',
+  'DA:10,0',
+  'end_of_record',
+  '',
+].join('\r\n');
+
+test('lcov: lee SF, DA y end_of_record tal cual (CRLF), e ignora FN/BRDA/LH', () => {
+  const l = parsearLcov(LCOV);
+  assert.equal(l.truncado, false);
+  assert.deepEqual([...l.ficheros.keys()], ['src\\a.mjs', '/abs/b.ts']);
+  assert.deepEqual([...(l.ficheros.get('src\\a.mjs') as Map<number, number>)], [
+    [1, 1],
+    [2, 1],
+    [3, 1],
+    [6, 0],
+    [7, 1],
+  ]);
+});
+
+test('lcov: un registro sin end_of_record marca el informe como truncado', () => {
+  assert.equal(parsearLcov('SF:a.js\nDA:1,1\n').truncado, true);
+  assert.equal(parsearLcov('SF:a.js\nDA:1,1\nend_of_record\nSF:b.js\nDA:1').truncado, true);
+  assert.equal(parsearLcov('').truncado, false);
+});
+
+test('lcov: un SF repetido (informes fusionados) suma: la linea se ejecuto si se ejecuto en alguno', () => {
+  const l = parsearLcov('SF:a.js\nDA:10,0\nDA:11,0\nend_of_record\nSF:a.js\nDA:10,5\nend_of_record\n');
+  assert.deepEqual([...(l.ficheros.get('a.js') as Map<number, number>)], [
+    [10, 5],
+    [11, 0],
+  ]);
+});
+
+const informe = new Map([
+  ['src/a.mjs', new Map([[1, 1], [2, 1], [3, 1], [4, 0], [5, 0], [6, 0], [9, 0], [10, 2]])],
+  ['src/B.ts', new Map([[1, 0]])],
+]);
+
+test('cruce: solo cuentan las lineas cambiadas con DA; DA:n,0 es sin cubrir; sin SF va aparte', () => {
+  const anadidas = new Map([
+    ['src/a.mjs', [3, 4, 5, 6, 7, 8, 9, 10]],
+    ['docs/x.md', [1, 2]],
+    ['src/vacio.ts', []],
+  ]);
+  const c = cruzarCobertura(anadidas, informe);
+  assert.deepEqual(c.ficheros, [{ ruta: 'src/a.mjs', ejecutables: 6, cubiertas: 2, sinCubrir: [4, 5, 6, 9] }]);
+  assert.deepEqual(c.sinInstrumentar, ['docs/x.md']);
+  assert.equal(c.ejecutables, 6);
+  assert.equal(c.cubiertas, 2);
+  assert.equal(formatearPorcentaje(c.porcentaje as number), '33.3');
+  // Las lineas 1 y 2 tienen DA pero no han cambiado: no cuentan.
+  assert.equal(describirCruce(c).includes('`src/a.mjs`: 4-6, 9'), true);
+  assert.equal(describirCruce(c).includes('`docs/x.md`'), true);
+});
+
+test('cruce: la clave de ruta decide mayusculas (Windows) y un fichero sin lineas ejecutables cambiadas no cuenta', () => {
+  const anadidas = new Map([['src/b.ts', [1]]]);
+  assert.deepEqual(cruzarCobertura(anadidas, informe).sinInstrumentar, ['src/b.ts']);
+  const c = cruzarCobertura(anadidas, informe, (r) => r.toLowerCase());
+  assert.deepEqual(c.ficheros, [{ ruta: 'src/b.ts', ejecutables: 1, cubiertas: 0, sinCubrir: [1] }]);
+  const soloComentarios = cruzarCobertura(new Map([['src/a.mjs', [7, 8]]]), informe);
+  assert.deepEqual(soloComentarios.ficheros, []);
+  assert.equal(soloComentarios.porcentaje, null);
+  assert.match(describirCruce(soloComentarios), /Ninguna linea cambiada es ejecutable/);
+});
+
+test('cruce: filtrar por los ficheros de un dominio recalcula los totales', () => {
+  const c = cruzarCobertura(new Map([['src/a.mjs', [3, 4]], ['src/B.ts', [1]]]), informe);
+  const f = filtrarCruce(c, new Set(['src/B.ts']));
+  assert.deepEqual([f.ejecutables, f.cubiertas, f.porcentaje], [1, 0, 0]);
+});
+
+test('umbral: porcentaje minimo, el valor exacto pasa; sin lineas ejecutables pasa', () => {
+  const de = (cubiertas: number, ejecutables: number) => ({
+    ficheros: [],
+    sinInstrumentar: [],
+    cubiertas,
+    ejecutables,
+    porcentaje: ejecutables === 0 ? null : (100 * cubiertas) / ejecutables,
+  });
+  assert.equal(cumpleUmbral(de(9, 10), 90), true, 'el valor exacto pasa');
+  assert.equal(cumpleUmbral(de(9, 10), 90.01), false);
+  assert.equal(cumpleUmbral(de(2, 3), 66.67), false);
+  assert.equal(cumpleUmbral(de(2, 3), 66.66), true);
+  assert.equal(cumpleUmbral(de(0, 0), 100), true);
+  assert.equal(cumpleUmbral(de(0, 1), 0), true);
+});
+
+test('rangos: agrupa consecutivas', () => {
+  assert.equal(rangos([4, 5, 6, 9]), '4-6, 9');
+  assert.equal(rangos([1]), '1');
+  assert.equal(rangos([]), '');
+  assert.equal(rangos([1, 3, 4, 10, 11, 12]), '1, 3-4, 10-12');
+});
+
+test('config: informe_cobertura y umbral_cobertura son claves conocidas, null por defecto, y validadas', () => {
+  const vacia = parsearConfig('', 'c.yml');
+  assert.equal(vacia.informe_cobertura, null);
+  assert.equal(vacia.umbral_cobertura, null);
+  const c = parsearConfig(
+    'comando_verificacion: "npm test"\ninforme_cobertura: coverage\\lcov.info\numbral_cobertura: 80\n',
+    'c.yml'
+  );
+  assert.equal(c.informe_cobertura, 'coverage/lcov.info');
+  assert.equal(c.umbral_cobertura, 80);
+  assert.equal(parsearConfig('informe_cobertura: ./cov/../coverage/lcov.info\n', 'c.yml').informe_cobertura, 'coverage/lcov.info');
+  // Solo el informe, sin umbral ni comando: vale (review informa).
+  assert.equal(parsearConfig('informe_cobertura: coverage/lcov.info\n', 'c.yml').umbral_cobertura, null);
+  const aborta = (texto: string, re: RegExp) =>
+    assert.throws(() => parsearConfig(texto, 'c.yml'), (e: unknown) => e instanceof ConfigError && re.test(e.message), texto);
+  const conTodo = 'comando_verificacion: "npm test"\ninforme_cobertura: coverage/lcov.info\n';
+  aborta(`${conTodo}umbral_cobertura: 101\n`, /"umbral_cobertura" debe ser un numero de 0 a 100/);
+  aborta(`${conTodo}umbral_cobertura: -1\n`, /de 0 a 100/);
+  aborta(`${conTodo}umbral_cobertura: mucho\n`, /de 0 a 100/);
+  aborta('comando_verificacion: "npm test"\numbral_cobertura: 80\n', /necesita tambien "informe_cobertura" y "comando_verificacion"/);
+  aborta('informe_cobertura: coverage/lcov.info\numbral_cobertura: 80\n', /necesita tambien/);
+  aborta('informe_cobertura: /tmp/lcov.info\n', /"informe_cobertura" "\/tmp\/lcov.info" no vale: es absoluta/);
+  aborta('informe_cobertura: ../lcov.info\n', /se sale del repo/);
+  aborta('informe_cobertura: coverage/\n', /es una carpeta/);
+  assert.equal(parsearConfig(`${conTodo}umbral_cobertura: 0\n`, 'c.yml').umbral_cobertura, 0);
+  assert.equal(parsearConfig(`${conTodo}umbral_cobertura: 87.5\n`, 'c.yml').umbral_cobertura, 87.5);
+});
````

## Excluido del diff (20 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-074/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-074/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-074/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-074/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-074/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-074/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-074/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-074/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-074/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-cobertura.js                           |  91 +++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-heldout.js                             |   6 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  10 +++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |  21 +++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/cobertura-cambios.js                              | 104 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         |  50 +++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/lcov.js                                           |  38 +++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/cobertura.js                                        | 136 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/config-de-ref.js                                    |  15 ++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                              |  76 +++++++++++++++++++++++++++++++++++++++++++++-
 20 files changed, 544 insertions(+), 9 deletions(-)
````
