# Peticion de revision — TASK-145a (ronda 1)

- Tarea: TASK-145a — puertas, git y textos de error (parte a de TASK-145)
- Rama revisada: fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
- Rama base: develop
- Commit revisado (HEAD): 4df4a98d2c7f0aba0de97109a02141d487caf113
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-145a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-145a/tarea.md
- tareas/03-en-revision/TASK-145a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts

## Commits a revisar (git log develop..HEAD)

````
4df4a98 update(fix): develop -> fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
6aafebc chore(TASK-145a): autorrevision
3d8517d fix(TASK-145a): puertas de finish sin copias (git, config, bloque comun y textos)
d008277 chore(TASK-145a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 0a81a26..c19523b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -30,7 +30,7 @@
  */
 import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
 import path from 'node:path';
-import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
+import { gitCrudo } from '../fs/git-crudo.js';
 import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import {
   aviso,
@@ -153,14 +153,9 @@ interface GitSalida {
 
 /** `git` sin lanzar nunca: el resultado lleva el error de lanzamiento. */
 function git(args: readonly string[], cwd: string, env: NodeJS.ProcessEnv = {}, timeoutMs: number = TIMEOUT_GIT_MS): GitSalida {
-  const r: SpawnSyncReturns<string> = spawnSync('git', args, {
-    cwd,
-    encoding: 'utf8',
-    stdio: ['ignore', 'pipe', 'pipe'],
-    timeout: timeoutMs,
-    env: { ...process.env, ...env },
-  });
-  return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim(), error: r.error };
+  // TASK-145a (CMD1-02): sobre gitCrudo, el envoltorio comun (maxBuffer, GIT_OPTIONAL_LOCKS y sin prompt).
+  const r = gitCrudo(args, cwd, { env, timeoutMs });
+  return { status: r.status, stdout: r.stdout.toString('utf8').trim(), stderr: r.stderr.trim(), error: r.error };
 }
 
 const una = (t: string): string => ocultarCredenciales(t).replace(/\s+/g, ' ').trim();
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
index 5fc7764..3bf1dc1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
@@ -19,12 +19,10 @@
  *
  * Lanza FinishCommandError si no se puede mergear; no escribe nada.
  */
-import { ConfigError, type TaskcodeConfig } from '../core/config.js';
 import { EXCLUIR_HELDOUT } from '../core/heldout.js';
 import { cumpleUmbral, describirCruce, formatearPorcentaje } from '../core/cobertura-cambios.js';
 import { coberturaDeRama } from '../fs/cobertura.js';
-import { configDeRef } from '../fs/config-de-ref.js';
-import { FinishCommandError } from './finish-opciones.js';
+import { CIERRE_SIN_MERGE, FinishCommandError, configDeLaRama } from './finish-opciones.js';
 import type { ResultadoPuerta } from './finish-verificacion.js';
 
 export interface PuertaCoberturaOpts {
@@ -43,28 +41,14 @@ export type ResultadoCobertura =
   | { tipo: 'omitida' }
   | { tipo: 'cumple'; porcentaje: number | null };
 
-const CIERRE = 'No se ha mergeado nada.';
-
 /**
  * Margen para comparar el mtime del informe con el arranque de la verificacion:
  * hay sistemas de ficheros con mtime de resolucion gruesa.
  */
 const MARGEN_MTIME_MS = 1000;
 
-function configBase(o: PuertaCoberturaOpts): TaskcodeConfig {
-  try {
-    return configDeRef(o.ramaBase, o.cwd);
-  } catch (e: unknown) {
-    if (!(e instanceof ConfigError)) throw e;
-    throw new FinishCommandError(
-      `[ERROR] ${o.id}: la configuracion de "${o.ramaBase}", que es la que manda en el umbral de cobertura, ` +
-        `no es valida:\n  ${e.message.replace(/^\[ERROR\]\s*/, '')}\n${CIERRE}`
-    );
-  }
-}
-
 export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
-  const config = configBase(o);
+  const config = configDeLaRama(o.ramaBase, o.cwd, o.id, 'el umbral de cobertura');
   const umbral = config.umbral_cobertura;
   const informe = config.informe_cobertura;
   if (umbral === null || informe === null) return { tipo: 'sin-umbral' };
@@ -101,7 +85,7 @@ export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: "${o.ramaBase}" declara umbral_cobertura (${umbral} %), pero la rama no declara ` +
         `comando_verificacion, asi que nadie regenera el informe ${informe} antes de medirlo. Restaura ` +
-        `comando_verificacion en la rama y reintenta. ${quitar} ${CIERRE}`
+        `comando_verificacion en la rama y reintenta. ${quitar} ${CIERRE_SIN_MERGE}`
     );
   }
 
@@ -112,7 +96,7 @@ export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
     new FinishCommandError(
       `[ERROR] ${o.id}: no se puede medir la cobertura de las lineas cambiadas (umbral ${umbral} %): ${motivo}. ` +
         `Sin datos fiables no se cierra: comprueba que comando_verificacion escribe el informe lcov en ` +
-        `${informe} con rutas del fuente del repo. ${quitar} ${CIERRE}`
+        `${informe} con rutas del fuente del repo. ${quitar} ${CIERRE_SIN_MERGE}`
     );
   if (lectura.tipo === 'ausente') throw sinDatos(`la verificacion salio en verde pero no existe ${informe}`);
   if (lectura.tipo === 'truncado') throw sinDatos(`el informe ${informe} esta cortado (sin end_of_record)`);
@@ -135,7 +119,7 @@ export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
       `[ERROR] ${o.id}: la cobertura de las lineas cambiadas (${formatearPorcentaje(cruce.porcentaje as number)} %) ` +
         `no llega al umbral de "${o.ramaBase}" (${umbral} %), medida desde la merge base ` +
         `(${c.mergeBase.slice(0, 10)}).\n${describirCruce(cruce)}\n` +
-        `Anade los tests que ejecutan esas lineas y reintenta. ${quitar} ${CIERRE}`
+        `Anade los tests que ejecutan esas lineas y reintenta. ${quitar} ${CIERRE_SIN_MERGE}`
     );
   }
   return { tipo: 'cumple', porcentaje: cruce.porcentaje };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
index cfddb40..6517f2b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
@@ -24,14 +24,12 @@
  * `--sin-verificacion` no la salta: los held-out son de la persona.
  */
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
-import { ConfigError, type TaskcodeConfig } from '../core/config.js';
-import { configDeRef } from '../fs/config-de-ref.js';
+import { gitLinea } from '../fs/git-crudo.js';
 import { carpetasHeldout, variantesHeldout, CARPETA_HELDOUT, VARIABLE_HELDOUT } from '../core/heldout.js';
 import { describirResultado } from '../core/informe-verificacion.js';
 import { currentBranch, isWorkspaceClean, runGit } from '../fs/git.js';
 import { ejecutarVerificacion } from '../fs/verificacion.js';
-import { FinishCommandError } from './finish-opciones.js';
+import { CIERRE_SIN_MERGE, FinishCommandError, configDeLaRama } from './finish-opciones.js';
 
 export interface PuertaHeldoutOpts {
   id: string;
@@ -53,7 +51,6 @@ export interface PuertaHeldoutOpts {
 
 export type ResultadoHeldout = { tipo: 'sin-heldout' } | { tipo: 'verde'; carpeta: string; duracionMs: number };
 
-const CIERRE = 'No se ha mergeado nada.';
 
 /**
  * Decision de Carlos en TASK-078: el remedio sobre los held-out lo ejecuta la
@@ -74,21 +71,7 @@ function arbol(ref: string, carpeta: string, cwd: string): string {
 }
 
 function mergeBase(a: string, b: string, cwd: string): string | null {
-  const r = spawnSync('git', ['merge-base', a, b], { cwd, encoding: 'utf8', windowsHide: true });
-  return r.status === 0 ? (r.stdout ?? '').trim() : null;
-}
-
-/** La config de `.taskcode/config.yml` en `ref`; sin fichero, la de por defecto. */
-function configDe(ref: string, cwd: string, id: string): TaskcodeConfig {
-  try {
-    return configDeRef(ref, cwd);
-  } catch (e: unknown) {
-    if (!(e instanceof ConfigError)) throw e;
-    throw new FinishCommandError(
-      `[ERROR] ${id}: la configuracion de "${ref}", que es la que manda en los held-out, no es valida:\n  ` +
-        `${e.message.replace(/^\[ERROR\]\s*/, '')}\n${CIERRE}`
-    );
-  }
+  return gitLinea(['merge-base', a, b], cwd);
 }
 
 /** Ordenes para dejar `destino` (en la rama) igual que `origen` en la base, y borrar el resto. */
@@ -120,7 +103,7 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
         (rarasBase.length > 0
           ? `Renombrala a ${CARPETA_HELDOUT}/ en "${o.ramaBase}" e integralo en la rama. `
           : `La rama no puede crear held-out: borrala de la rama. `) +
-        CIERRE
+        CIERRE_SIN_MERGE
     );
   }
   const enRama = carpetasHeldout(rutasRama, o.id);
@@ -132,7 +115,7 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
         `[ERROR] ${o.id}: los tests held-out de esta tarea estan en "${o.ramaDiseno}" (${enDiseno.join(', ')}), ` +
           `pero un hotfix nace de "${o.ramaBase}", que no los tiene, asi que no se ejecutarian. Commitealos ` +
           `tambien en "${o.ramaBase}" e integralo en la rama del hotfix; si no aplican al hotfix, quitalos de ` +
-          `"${o.ramaDiseno}". ${CIERRE}`
+          `"${o.ramaDiseno}". ${CIERRE_SIN_MERGE}`
       );
     }
     return { tipo: 'sin-heldout' };
@@ -144,13 +127,13 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
       `[ERROR] ${o.id}: la rama trae tests held-out (${enRama.join(', ')}) que no estan en "${o.ramaBase}". ` +
         `Los held-out los escribe la persona y los commitea en "${o.ramaBase}" durante el diseño, antes de ` +
         `start; la rama de la tarea no puede añadirlos. Si son de la persona, que los commitee en ` +
-        `"${o.ramaBase}" y despues integra "${o.ramaBase}" en la rama. ${CIERRE}`
+        `"${o.ramaBase}" y despues integra "${o.ramaBase}" en la rama. ${CIERRE_SIN_MERGE}`
     );
   }
   if (enBase.length > 1) {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: "${o.ramaBase}" tiene mas de una carpeta ${CARPETA_HELDOUT}/ para esta tarea ` +
-        `(${enBase.join(', ')}): deja una sola y reintenta. ${CIERRE}`
+        `(${enBase.join(', ')}): deja una sola y reintenta. ${CIERRE_SIN_MERGE}`
     );
   }
   const base = enBase[0] as string;
@@ -167,7 +150,7 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
       throw new FinishCommandError(
         `[ERROR] ${o.id}: los tests held-out de "${o.ramaBase}" han cambiado desde que nacio la rama, y la ` +
           `rama no los ha tocado: integra "${o.ramaBase}" en la rama (git merge ${o.ramaBase}) y reintenta, ` +
-          `para que finish ejecute los de ahora. ${CIERRE}`
+          `para que finish ejecute los de ahora. ${CIERRE_SIN_MERGE}`
       );
     }
     const enDestino = enRama.includes(destino);
@@ -185,25 +168,25 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
             `"${o.ramaBase}" (git merge ${o.ramaBase}; si hay conflicto en los held-out, con la version de ` +
             `"${o.ramaBase}") y reintente; si sigue sin coincidir, que los restaure`
           : 'Para restaurarlos') +
-        `${enDestino ? '' : ` en ${destino}`}:\n  ${remedio(o.ramaBase, base, destino, otras)}\n${CIERRE}`
+        `${enDestino ? '' : ` en ${destino}`}:\n  ${remedio(o.ramaBase, base, destino, otras)}\n${CIERRE_SIN_MERGE}`
     );
   }
 
-  const config = configDe(o.ramaBase, o.cwd, o.id);
+  const config = configDeLaRama(o.ramaBase, o.cwd, o.id, 'los held-out');
   const comando = config.comando_heldout;
   if (comando === null) {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: la tarea tiene tests held-out (${base}) y la configuracion de "${o.ramaBase}" no ` +
         `declara comando_heldout, asi que no se pueden ejecutar. Declaralo en .taskcode/config.yml de ` +
         `"${o.ramaBase}" (p. ej. comando_heldout: "node --test $${VARIABLE_HELDOUT}"), integralo en la rama ` +
-        `y reintenta. ${CIERRE}`
+        `y reintenta. ${CIERRE_SIN_MERGE}`
     );
   }
   const actual = currentBranch(o.cwd);
   if (actual !== o.rama) {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: los tests held-out se ejecutan sobre el arbol de la rama de la tarea, y la rama ` +
-        `activa es "${actual === '' ? 'HEAD desacoplado' : actual}". Cambiate a "${o.rama}" y reintenta. ${CIERRE}`
+        `activa es "${actual === '' ? 'HEAD desacoplado' : actual}". Cambiate a "${o.rama}" y reintenta. ${CIERRE_SIN_MERGE}`
     );
   }
 
@@ -215,7 +198,7 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
   if (r.estado !== 'verde') {
     // Sin la salida, a proposito (decision D4 del plan).
     throw new FinishCommandError(
-      `[ERROR] ${o.id}: los tests held-out no estan en verde; no se mergea. ${CIERRE}\n` +
+      `[ERROR] ${o.id}: los tests held-out no estan en verde; no se mergea. ${CIERRE_SIN_MERGE}\n` +
         `  Comando:   ${comando}\n` +
         `  Resultado: ${describirResultado(r)}\n` +
         `  Duracion:  ${(r.duracionMs / 1000).toFixed(1)} s\n` +
@@ -227,7 +210,7 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: los tests held-out salieron en verde pero han dejado cambios en el arbol de trabajo ` +
         `(mira git status). El merge necesita el workspace limpio: que escriban en rutas ignoradas, y reintenta. ` +
-        CIERRE
+        CIERRE_SIN_MERGE
     );
   }
   return { tipo: 'verde', carpeta, duracionMs: r.duracionMs };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
index 1a8520b..67721df 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
@@ -34,10 +34,33 @@ import {
   type ResolucionDeclarada,
   type RemotoPlataforma,
 } from '../core/plataforma-remota.js';
-import { resolverConfig, type TaskcodeConfig } from '../core/config.js';
+import { ConfigError, resolverConfig, type TaskcodeConfig } from '../core/config.js';
+import { configDeRef } from '../fs/config-de-ref.js';
+import { sinPrefijoError } from '../core/utilidades-texto.js';
 
 export class FinishCommandError extends Error {}
 
+/** Coletilla de los errores de las puertas de finish: nada se ha integrado. */
+export const CIERRE_SIN_MERGE = 'No se ha mergeado nada.';
+
+/**
+ * TASK-145a (CMD1-03): la config de `.taskcode/config.yml` en `ref` (sin
+ * fichero, la de por defecto). Invalida, aborta finish diciendo para que
+ * manda (`queManda`). Antes, configBase en la cobertura y configDe en los
+ * held-out, la misma funcion.
+ */
+export function configDeLaRama(ref: string, cwd: string, id: string, queManda: string): TaskcodeConfig {
+  try {
+    return configDeRef(ref, cwd);
+  } catch (e: unknown) {
+    if (!(e instanceof ConfigError)) throw e;
+    throw new FinishCommandError(
+      `[ERROR] ${id}: la configuracion de "${ref}", que es la que manda en ${queManda}, no es valida:\n  ` +
+        `${sinPrefijoError(e.message)}\n${CIERRE_SIN_MERGE}`
+    );
+  }
+}
+
 /** Flags de `taskctl finish`: --push, las dos opciones de cierre de TASK-060 y el salto de la verificacion (TASK-072). */
 export const FLAGS_FINISH: readonly string[] = ['--push', '-p', '--tag', '--merge-request', '--sin-verificacion', '--aceptar-sin-revisar'];
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 0f90232..9e2588d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -42,7 +42,7 @@
  * la base invalida), la completa de siempre.
  */
 import path from 'node:path';
-import { spawnSync } from 'node:child_process';
+import { gitLinea } from '../fs/git-crudo.js';
 import { writeFile } from 'node:fs/promises';
 import { resolverConfig } from '../core/config.js';
 import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
@@ -66,6 +66,7 @@ import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 import { configDeRef } from '../fs/config-de-ref.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
 import { FinishCommandError } from './finish-opciones.js';
+import { sinPrefijoError } from '../core/utilidades-texto.js';
 
 export const FLAG_SIN_VERIFICACION = '--sin-verificacion';
 
@@ -161,16 +162,7 @@ export function puertaPesada(o: PuertaPesadaOpts): boolean {
   const config = resolverConfig(o.cwd);
   const comando = config.comando_verificacion_pesada;
   if (comando === null || !(config.verificacion_pesada_en as readonly string[]).includes(o.tipo)) return false;
-  const timeoutS = config.timeout_verificacion;
-  const inicio = Date.now();
-  const r = ejecutarVerificacion(o.cwd, comando, timeoutS, {
-    ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
-    ...(o.env === undefined ? {} : { env: o.env }),
-  });
-  anotarFinish(o.cwd, o.id, 'pesada', inicio, r.estado);
-  const limpio = isWorkspaceClean(o.cwd);
-  const huella = limpio ? huellaDelArbol(o.cwd, comando, timeoutS) : null;
-  if (huella !== null) guardarMemo(o.cwd, huella, r, 'pesada');
+  const { r, limpio } = ejecutarPuerta(o.cwd, o.id, 'pesada', comando, config.timeout_verificacion, opcionesEjecucion(o));
   if (r.estado !== 'verde' && o.yaIntegradaEn !== undefined && o.yaIntegradaEn.length > 0) {
     const ramas = o.yaIntegradaEn.map((x) => `"${x}"`).join(' y ');
     throw new FinishCommandError(
@@ -178,8 +170,8 @@ export function puertaPesada(o: PuertaPesadaOpts): boolean {
         '(comando_verificacion_pesada) no salen en verde sobre ese arbol: no se cierra la tarea, que no se ha movido ' +
         'de carpeta. El merge ya esta hecho y no se deshace: se arregla hacia delante, en la rama de integracion.\n' +
         `${formatearVerificacionRoja(r)}\n` +
-        `Corrige alli hasta que los pesados salgan en verde, commitea y relanza taskctl finish ${o.id}. Si la persona ` +
-        `decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`
+        `Corrige alli hasta que los pesados salgan en verde, commitea y relanza taskctl finish ${o.id}. ` +
+        cerrarIgualmente(o.id)
     );
   }
   if (r.estado !== 'verde') {
@@ -187,16 +179,10 @@ export function puertaPesada(o: PuertaPesadaOpts): boolean {
       `[ERROR] ${o.id}: no se mergea con los tests pesados en rojo (comando_verificacion_pesada, que exigen las ` +
         `ramas ${config.verificacion_pesada_en.join(' y ')}). La completa salio en verde; no se ha tocado nada.\n` +
         `${formatearVerificacionRoja(r)}\n` +
-        `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja ` +
-        'anotado en la tarea.'
-    );
-  }
-  if (!limpio) {
-    throw new FinishCommandError(
-      `[ERROR] ${o.id}: los tests pesados salieron en verde, pero han dejado cambios en el arbol de trabajo ` +
-        `("${comando}" escribe ficheros versionados o no ignorados: mira git status). No se ha mergeado nada.`
+        cerrarIgualmente(o.id)
     );
   }
+  if (!limpio) throw errorArbolSucio(o.id, 'los tests pesados', comando);
   o.onAviso?.(`${o.id}: tests pesados en verde (comando_verificacion_pesada, rama ${o.tipo}).`);
   return true;
 }
@@ -231,13 +217,61 @@ export function anotarSuite(cwd: string, id: string, inicioMs: number, r: Result
   });
 }
 
-function opcionesEjecucion(o: PuertaVerificacionOpts): { timeoutMs?: number; env?: NodeJS.ProcessEnv } {
+/**
+ * Timeout (tests) y entorno con que se ejecuta una verificacion de finish.
+ * TASK-145a (CMD1-04): la unica copia; antes puertaReintento y la pesada la
+ * repetian.
+ */
+function opcionesEjecucion(o: {
+  timeoutMs?: number;
+  entornoVerificacion?: () => NodeJS.ProcessEnv;
+  env?: NodeJS.ProcessEnv;
+}): { timeoutMs?: number; env?: NodeJS.ProcessEnv } {
+  const env = o.entornoVerificacion?.() ?? o.env;
   return {
     ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
-    ...(o.entornoVerificacion === undefined ? {} : { env: o.entornoVerificacion() }),
+    ...(env === undefined ? {} : { env }),
   };
 }
 
+/**
+ * TASK-145a (CMD1-05): el bloque comun de las puertas pesada, completa y de
+ * documentacion: ejecutar, anotar la puerta (la completa, tambien su tamano),
+ * y guardar el memo solo con el arbol limpio (es la huella del commit que
+ * consulta el guardian de merges; con el arbol sucio no casaria nunca).
+ */
+function ejecutarPuerta(
+  cwd: string,
+  id: string,
+  modo: 'pesada' | 'completa' | 'documentacion',
+  comando: string,
+  timeoutS: number,
+  opciones: { timeoutMs?: number; env?: NodeJS.ProcessEnv }
+): { r: ResultadoVerificacion; limpio: boolean; inicioMs: number } {
+  const inicioMs = Date.now();
+  const r = ejecutarVerificacion(cwd, comando, timeoutS, opciones);
+  anotarFinish(cwd, id, modo, inicioMs, r.estado);
+  if (modo === 'completa') anotarSuite(cwd, id, inicioMs, r);
+  const limpio = isWorkspaceClean(cwd);
+  const huella = limpio ? huellaDelArbol(cwd, comando, timeoutS) : null;
+  if (huella !== null) guardarMemo(cwd, huella, r, modo);
+  return { r, limpio, inicioMs };
+}
+
+/** TASK-145a (CMD1-12): la salida de cerrar igualmente, la misma en todas las puertas. */
+function cerrarIgualmente(id: string): string {
+  return `Si la persona decide cerrar igualmente, taskctl finish ${id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`;
+}
+
+/** TASK-145a (CMD1-12): una verificacion en verde que deja el arbol sucio. */
+function errorArbolSucio(id: string, que: string, comando: string, cierre = 'No se ha mergeado nada.'): FinishCommandError {
+  return new FinishCommandError(
+    `[ERROR] ${id}: ${que} salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
+      `("${comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita el ` +
+      `workspace limpio: ignoralos en .gitignore, o descartalos, y reintenta. ${cierre}`
+  );
+}
+
 export type ResultadoPuerta =
   | { tipo: 'sin-comando' }
   /** `inicioMs`: instante en que arranco la verificacion (TASK-074: un informe de cobertura anterior es viejo). */
@@ -263,7 +297,7 @@ function decisionDocumentacion(
   if (r.tipo === 'config-invalida') {
     o.onAviso?.(
       `${o.id}: la configuracion de "${ramaBase}" no es valida, asi que no se puede saber si la tarea es solo ` +
-        `documentacion: se ejecuta la verificacion completa. Detalle: ${r.error.message.replace(/^\[ERROR\]\s*/, '')}`
+        `documentacion: se ejecuta la verificacion completa. Detalle: ${sinPrefijoError(r.error.message)}`
     );
     return null;
   }
@@ -347,16 +381,7 @@ export async function puertaVerificacion(
     }
   }
 
-  const timeoutS = config.timeout_verificacion;
-  const inicioMs = Date.now();
-  const r = ejecutarVerificacion(o.cwd, comando, timeoutS, opcionesEjecucion(o));
-  anotarFinish(o.cwd, o.id, 'completa', inicioMs, r.estado);
-  anotarSuite(o.cwd, o.id, inicioMs, r);
-  // El memo solo con el arbol limpio: es la huella del commit que consulta el
-  // guardian de merges; con el arbol sucio no la casaria nunca (MEN-3).
-  const limpio = isWorkspaceClean(o.cwd);
-  const huella = limpio ? huellaDelArbol(o.cwd, comando, timeoutS) : null;
-  if (huella !== null) guardarMemo(o.cwd, huella, r);
+  const { r, limpio, inicioMs } = ejecutarPuerta(o.cwd, o.id, 'completa', comando, config.timeout_verificacion, opcionesEjecucion(o));
   if (r.estado !== 'verde') {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: no se mergea con la verificacion en rojo. ` +
@@ -366,17 +391,10 @@ export async function puertaVerificacion(
           : `No se ha mergeado nada; solo se ha commiteado en la rama la anotacion del intento (${commitAnotacion}).\n`) +
         `${formatearVerificacionRoja(r)}\n` +
         textoDeLaCompleta(config, motivoCompleta) +
-        `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
-        'lo deja anotado en la tarea.'
-    );
-  }
-  if (!limpio) {
-    throw new FinishCommandError(
-      `[ERROR] ${o.id}: la verificacion salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
-        `("${comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita el ` +
-        'workspace limpio: ignora esos ficheros en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
+        cerrarIgualmente(o.id)
     );
   }
+  if (!limpio) throw errorArbolSucio(o.id, 'la verificacion', comando);
   return { resultado: { tipo: 'verde', duracionMs: r.duracionMs, inicioMs }, tarea };
 }
 
@@ -398,28 +416,16 @@ async function puertaSoloDocumentacion(
   const c = { commit };
 
   if (decision.comando !== null) {
-    const inicioDoc = Date.now();
-    const r = ejecutarVerificacion(o.cwd, decision.comando, timeoutS, opcionesEjecucion(o));
-    anotarFinish(o.cwd, o.id, 'documentacion', inicioDoc, r.estado);
-    const limpio = isWorkspaceClean(o.cwd);
-    const huella = limpio ? huellaDelArbol(o.cwd, decision.comando, timeoutS) : null;
-    if (huella !== null) guardarMemo(o.cwd, huella, r, 'documentacion');
+    const { r, limpio } = ejecutarPuerta(o.cwd, o.id, 'documentacion', decision.comando, timeoutS, opcionesEjecucion(o));
     if (r.estado !== 'verde') {
       throw new FinishCommandError(
         `[ERROR] ${o.id}: la tarea solo cambia documentacion, pero su comprobacion ` +
           `(comando_verificacion_documentacion) no sale en verde. No se ha mergeado nada.\n` +
           `${formatearVerificacionRoja(r)}\n` +
-          `Arregla la documentacion, commitea y reintenta. Si la persona decide cerrar igualmente, ` +
-          `taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`
-      );
-    }
-    if (!limpio) {
-      throw new FinishCommandError(
-        `[ERROR] ${o.id}: la comprobacion de documentacion salio en verde, pero ha dejado cambios en el arbol ` +
-          `de trabajo ("${decision.comando}" escribe ficheros versionados o no ignorados: mira git status). ` +
-          'Ignoralos en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
+          `Arregla la documentacion, commitea y reintenta. ${cerrarIgualmente(o.id)}`
       );
     }
+    if (!limpio) throw errorArbolSucio(o.id, 'la comprobacion de documentacion', decision.comando);
   }
   o.onAviso?.(
     `${o.id}: ${decision.motivo}: no se ejecuta la verificacion completa ("${comando}"); ` +
@@ -523,17 +529,10 @@ async function puertaSelectiva(
         `${decision.motivo}). No se ha tocado nada.\n` +
         `${formatearVerificacionRoja(v.resultado)}\n` +
         `Correla a mano en la rama de la tarea (con RAMA_BASE=${ramaBase}) hasta que salga en verde, commitea ` +
-        `los arreglos y reintenta. Si la persona decide cerrar igualmente, taskctl finish ${o.id} ` +
-        `${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`
-    );
-  }
-  if (!isWorkspaceClean(o.cwd)) {
-    throw new FinishCommandError(
-      `[ERROR] ${o.id}: la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
-        `("${decision.comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita ` +
-        'el workspace limpio: ignoralos en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
+        `los arreglos y reintenta. ${cerrarIgualmente(o.id)}`
     );
   }
+  if (!isWorkspaceClean(o.cwd)) throw errorArbolSucio(o.id, 'la verificacion selectiva', decision.comando);
   const body = anotarVerificacionParcial(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
   const { commit, tarea } = await anotarYCommitear(o, body, 'cierre con verificacion parcial', 'anotar la verificacion');
   o.onAviso?.(
@@ -571,12 +570,6 @@ export type ResultadoReintento =
   | { tipo: 'omitida'; comando: string }
   | { tipo: 'verde'; que: 'completa' | 'selectiva' | 'documentacion'; deMemo: boolean };
 
-function gitOut(args: readonly string[], cwd: string): string | null {
-  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
-  if (r.error !== undefined || r.status !== 0) return null;
-  return (r.stdout ?? '').trim();
-}
-
 /**
  * El commit de la rama de integracion justo antes de que entrara la tarea: el
  * primero de su historia de primeros padres que no desciende de la rama. Es la
@@ -585,9 +578,9 @@ function gitOut(args: readonly string[], cwd: string): string | null {
  * que los commits de la tarea son la propia historia): entonces la completa.
  */
 function baseAntesDeIntegrar(rama: string, cwd: string): string | null {
-  const punta = gitOut(['rev-parse', '--verify', '--quiet', '--end-of-options', `${rama}^{commit}`], cwd);
-  const primeros = gitOut(['rev-list', '--first-parent', 'HEAD'], cwd);
-  const descendientes = gitOut(['rev-list', '--ancestry-path', `${rama}..HEAD`], cwd);
+  const punta = gitLinea(['rev-parse', '--verify', '--quiet', '--end-of-options', `${rama}^{commit}`], cwd);
+  const primeros = gitLinea(['rev-list', '--first-parent', 'HEAD'], cwd);
+  const descendientes = gitLinea(['rev-list', '--ancestry-path', `${rama}..HEAD`], cwd);
   if (punta === null || primeros === null || descendientes === null) return null;
   const nuevos = new Set(descendientes.split('\n').filter((l) => l !== ''));
   const base = primeros.split('\n').find((c) => c !== '' && !nuevos.has(c));
@@ -616,10 +609,7 @@ export function puertaReintento(o: PuertaReintentoOpts): ResultadoReintento {
     return { tipo: 'omitida', comando };
   }
 
-  const opciones = {
-    ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
-    ...(o.entornoVerificacion === undefined ? {} : { env: o.entornoVerificacion() }),
-  };
+  const opciones = opcionesEjecucion(o);
   const base = o.siempreCompleta ? null : baseAntesDeIntegrar(o.rama, o.cwd);
   const r = base === null ? null : decidirVerificacionEntre(base, 'HEAD', o.cwd);
   const d = r !== null && r.tipo === 'decision' ? r : null;
@@ -651,16 +641,11 @@ export function puertaReintento(o: PuertaReintentoOpts): ResultadoReintento {
         `${formatearVerificacionRoja(v.resultado)}\n` +
         `Arregla "${o.ramaIntegracion}": en la rama de la tarea, integra la base (git merge ${o.ramaIntegracion}), ` +
         `corrige alli hasta que la verificacion salga en verde, commitea y relanza taskctl finish ${o.id} desde ` +
-        `ella. Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
-        'lo deja anotado en la tarea.'
+        `ella. ${cerrarIgualmente(o.id)}`
     );
   }
   if (!isWorkspaceClean(o.cwd)) {
-    throw new FinishCommandError(
-      `[ERROR] ${o.id}: la verificacion salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
-        `("${peticion.comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en ` +
-        '.gitignore, o descartalos, y reintenta. La tarea no se ha movido de carpeta.'
-    );
+    throw errorArbolSucio(o.id, 'la verificacion', peticion.comando, 'La tarea no se ha movido de carpeta.');
   }
   return { tipo: 'verde', que: peticion.tipo, deMemo: v.deMemo };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts
index dead53b..d12ad33 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts
@@ -24,3 +24,12 @@ const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u00
 export function quitarAnsi(texto: string): string {
   return texto.replace(ANSI, '');
 }
+
+/**
+ * TASK-145a (FS-09): el texto de un error sin su prefijo `[ERROR]` (los de
+ * ConfigError lo traen), para incrustarlo en otro mensaje. Antes, la misma
+ * expresion copiada en seis sitios.
+ */
+export function sinPrefijoError(texto: string): string {
+  return texto.replace(/^\[ERROR\]\s*/, '');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
index 0102313..551222a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
@@ -29,6 +29,7 @@ import {
 } from '../core/verificacion-proporcional.js';
 import { configDeRef } from './config-de-ref.js';
 import { resolverCommits, rutasDelArbol, rutasDelArbolFueraDe, rutasDeTarea, rutasFueraDe } from './git.js';
+import { sinPrefijoError } from '../core/utilidades-texto.js';
 
 /**
  * Tests held-out de las tareas (`tareas/<estado>/TASK-NNN/aceptacion/`). `finish`
@@ -192,7 +193,7 @@ export function peticionDeTrabajo(e: EntradaTrabajo): { plan: PlanVerificacion;
         avisos.push(
           `La configuracion de "${base()}" no es valida, asi que no se puede saber si solo cambia ` +
             `documentacion: se aplica la verificacion de siempre. Detalle: ` +
-            r.error.message.replace(/^\[ERROR\]\s*/, '')
+            sinPrefijoError(r.error.message)
         );
       } else if (r !== null && r.decision.tipo === 'documentacion') {
         return {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
index a41b7e8..28b7b18 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
@@ -21,6 +21,8 @@ export interface OpcionesGitCrudo {
   input?: string | Buffer;
   maxBuffer?: number;
   timeoutMs?: number;
+  /** TASK-145a: variables que se anaden al entorno (el de doctor, p. ej.). */
+  env?: NodeJS.ProcessEnv;
 }
 
 const MAX_BUFFER_POR_DEFECTO = 64 * 1024 * 1024;
@@ -34,7 +36,7 @@ export function gitCrudo(args: readonly string[], cwd: string, opciones: Opcione
     timeout: opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS,
     stdio: ['pipe', 'pipe', 'pipe'],
     windowsHide: true,
-    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
+    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0', ...opciones.env },
   });
   return {
     status: r.status,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index afc8e66..a51b859 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -68,6 +68,7 @@ import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso
 import { PUERTA_FRENO, type LineaPuerta, type ResultadoFreno } from '../core/registro-puertas.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
 import { esUltimoVerde, guardarUltimoVerde } from '../fs/freno-ultimo-verde.js';
+import { sinPrefijoError } from '../core/utilidades-texto.js';
 
 /**
  * `timeout` del hook Stop en hooks/hooks.json, en segundos. Claude Code cancela
@@ -151,7 +152,7 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       if (config.comando_verificacion === null) return DEJAR_PARAR;
     } catch (e: unknown) {
       if (!(e instanceof ConfigError)) throw e;
-      errorConfig = e.message.replace(/^\[ERROR\]\s*/, '');
+      errorConfig = sinPrefijoError(e.message);
     }
 
     // 6: los primeros git (branch --show-current y, en un rebase, rev-parse --git-path).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 22db213..3aad3d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -47,6 +47,7 @@ import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
 import { gitResultado, ramaActual } from '../fs/git-crudo.js';
 
 import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
+import { sinPrefijoError } from '../core/utilidades-texto.js';
 
 export { parsearEntradaPreToolUse, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
 
@@ -203,11 +204,6 @@ function configInvalida(op: OperacionMerge, raiz: string, error: ConfigError): P
     .map((integ) => ({ tipo: 'config-invalida', destino: integ.destino, error }));
 }
 
-/** El texto de un ConfigError sin su prefijo `[ERROR]`. */
-function textoDeConfigError(e: Error): string {
-  return e.message.replace(/^\[ERROR\]\s*/, '');
-}
-
 /** Pares fuente -> destino de una operacion. Para un merge sin destino explicito, la rama actual. */
 function integraciones(op: OperacionMerge, raiz: string, integracion: string, principal: string | null): Integracion[] {
   if (op.tipo === 'script') {
@@ -315,7 +311,7 @@ function exencionDocumentacion(
   if (r.tipo === 'config-invalida') {
     return {
       pasa: false,
-      detalle: `La configuracion de "${destino}" no es valida, asi que no se aplica la exencion de solo documentacion: ${textoDeConfigError(r.error)}`,
+      detalle: `La configuracion de "${destino}" no es valida, asi que no se aplica la exencion de solo documentacion: ${sinPrefijoError(r.error.message)}`,
     };
   }
   const d = r.decision;
@@ -359,7 +355,7 @@ function exencionDocumentacion(
 /** TASK-103: el texto para el agente cuando la config no se puede leer. */
 function mensajeConfigInvalida(destino: string, error: ConfigError): string {
   return [
-    `Merge bloqueado: entraria en "${destino}" y la configuracion del repositorio no se puede leer: ${textoDeConfigError(error)}`,
+    `Merge bloqueado: entraria en "${destino}" y la configuracion del repositorio no se puede leer: ${sinPrefijoError(error.message)}`,
     'Sin una configuracion valida no se sabe que verificacion exigir, asi que no se integra en develop, main ni master.',
     'Corrige el fichero que nombra el error (taskctl doctor lo valida y dice como arreglarlo) y repite el merge,',
     'o cierra la tarea con taskctl finish TASK-NNN. No integres por otra via para saltarte esta comprobacion.',
````

## Excluido del diff (17 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-145a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145a/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145a/tarea.md                                                       |  10 ++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                      |  13 +++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-cobertura.js                            |  24 +++-----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-heldout.js                              |  44 +++++++++-----------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-opciones.js                             |  23 +++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                         | 140 ++++++++++++++++++++++++++++++++++++----------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/utilidades-texto.js                                |   8 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/decision-documentacion.js                            |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-crudo.js                                         |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                     |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                  |   9 ++----
 17 files changed, 130 insertions(+), 149 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts | 24 +++++++++++++++++++++++-
 1 file changed, 23 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 229.7 s
- Commit verificado: 4df4a98d2c7f0aba0de97109a02141d487caf113
- Huella: 3e1e536fcef306db72821d1f8cca6724c2ce9588
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 80175 bytes en total):

````
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (7.1967ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.3312ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.0338ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.49ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8327ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.9388ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4584ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.5514ms)
✔ ramaActual: la rama; con HEAD desacoplado, null; durante un rebase, la que se rebasa; fuera de un repo, null (3121.9556ms)
✔ rutaGit: absoluta bajo el directorio de Git (aunque cwd sea un subdirectorio); fuera de un repo, null; gitOk (1354.7265ms)
✔ parsearEntradaHook: objeto tal cual; JSON roto, vacio, array o escalar, sin campos (2.3933ms)
✔ los hooks de coste y de merges no cargan el modulo del freno (ni directa ni indirectamente) (260.4406ms)
✔ sin copias: git sin lanzar en las puertas de finish y doctor, y la regex del prefijo de error (89.0561ms)
✔ freno (TASK-102): un turno de solo documentacion corre la comprobacion de documentacion y no la suite (6690.6409ms)
✔ freno (TASK-102): solo documentacion sin comando de documentacion no corre nada (3393.3923ms)
✔ freno (TASK-102): documentacion sin commitear todavia, sin commits en la rama, cuenta como solo documentacion (5169.0493ms)
✔ freno (TASK-102): un fichero de codigo modificado sin commitear aplica la verificacion de siempre (6070.8419ms)
✔ freno (TASK-102): un fichero de codigo preparado (git add) sin commitear aplica la verificacion de siempre (6377.9348ms)
✔ freno (TASK-102): un fichero de codigo sin seguimiento aplica la verificacion de siempre (7255.5012ms)
✔ freno (TASK-102): un commit de codigo en la rama aplica la verificacion de siempre (4954.4076ms)
✔ freno (TASK-102): con la selectiva declarada, solo documentacion se decide antes; con codigo, la selectiva (11028.5241ms)
✔ freno (TASK-102): sin rutas_documentacion se comporta como en la 0.14.0 y no lanza ningun git nuevo (5947.8056ms)
✔ freno (TASK-102): con el arbol sucio corre la comprobacion de documentacion pero no guarda su memo; limpio, si (15253.9342ms)
✔ freno (TASK-102): una config de la base invalida no bloquea: la verificacion de siempre con un aviso (5603.511ms)
✔ freno (TASK-102, MEN-1/MEN-2): un hotfix no se exime por documentacion ni va a la red a por su base (6691.2878ms)
✔ freno: decisiones de parar, bloquear o no hacer nada segun verificacion, tarea y config (31918.145ms)
✔ freno: timeouts, memo por huella, cola acotada y punto de entrada real (40867.668ms)
✔ freno: unitarios del informe, del timeout efectivo y de hooks.json (3740.1671ms)
✔ comando-merge: segmentacion, deteccion de merges, wrappers de shell y casos de TASK-103 (16.2861ms)
✔ guardia: decision de bloquear o dejar pasar un merge segun verde guardado, ramas y config (62604.6079ms)
✔ guardia: punto de entrada real por stdin y hooks.json (42909.0882ms)
ℹ tests 789
ℹ suites 0
ℹ pass 789
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 201404.0044
[verificar-impacto] node --test termino con 0 en 201.6 s.
````
