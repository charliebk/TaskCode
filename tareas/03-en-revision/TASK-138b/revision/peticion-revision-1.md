# Peticion de revision — TASK-138b (ronda 1)

- Tarea: TASK-138b — decision de la puerta, constante muerta, textos del tope y doctor (parte b de TASK-138)
- Rama revisada: fix/task-138-regla-4d-duplicacion-en-metricas-suite-y
- Rama base: develop
- Commit revisado (HEAD): 91b1c964891a28c4c6dff9759cb09c952e64ea55
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-138b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-138b/tarea.md
- tareas/03-en-revision/TASK-138b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-puertas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/registro-puertas-verificacion.test.ts

## Commits a revisar (git log develop..HEAD)

````
91b1c96 chore(TASK-138b): autorrevision
ef06122 fix(TASK-138b): decision de la puerta comun, sin constante muerta, textos del tope de una fuente y doctor con una lectura
1bb78c5 chore(TASK-138b): tarea en curso
4773cb2 merge(TASK-138b): develop en fix/task-138-regla-4d-duplicacion-en-metricas-suite-y para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index c19523b..d05975c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -486,12 +486,37 @@ export function comprobarVerificacion(
  * ID de `comprobarTareas`). Una carpeta que falta o no se lee cuenta 0: de eso
  * ya informan `tareas-carpetas` y `tareas`.
  */
-export function contarTerminadas(tareasRoot: string): number {
+export function contarTerminadas(tareasRoot: string, terminadas: readonly TerminadaLeida[] = leerTextosTerminadas(tareasRoot)): number {
+  return terminadas.length;
+}
+
+/** Una tarea de 04-terminadas: su ID y el texto de su tarea.md (null si no se puede leer). */
+export interface TerminadaLeida {
+  id: string;
+  texto: string | null;
+}
+
+/**
+ * TASK-138b (A6): las tareas terminadas, leidas una vez para todas las
+ * comprobaciones de doctor (cuenta, crecimiento de la suite, poda y documento
+ * de estado); antes cada una recorria la carpeta y abria los tarea.md. Sin la
+ * carpeta, []; una tarea ilegible va con `texto: null` (de eso avisa `tareas`).
+ */
+export function leerTextosTerminadas(tareasRoot: string): TerminadaLeida[] {
+  const dir = path.join(tareasRoot, STATE_FOLDER.terminada);
+  let ids: string[];
   try {
-    return readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId).length;
+    ids = readdirSync(dir).filter(isValidTaskId);
   } catch {
-    return 0;
+    return [];
   }
+  return ids.map((id) => {
+    try {
+      return { id, texto: readFileSync(path.join(dir, id, 'tarea.md'), 'utf8') };
+    } catch {
+      return { id, texto: null };
+    }
+  });
 }
 
 /**
@@ -583,21 +608,14 @@ export function comprobarPuertasVerificacion(cfg: TaskcodeConfig | null): Compro
  * con dato, crecieron mas de `umbral_crecimiento_suite`. Sin datos, nada: ni
  * avisa ni falla.
  */
-export function comprobarCrecimientoSuite(cwd: string, tareasRoot: string, cfg: TaskcodeConfig | null): Comprobacion[] {
+export function comprobarCrecimientoSuite(
+  cwd: string,
+  tareasRoot: string,
+  cfg: TaskcodeConfig | null,
+  terminadas: readonly TerminadaLeida[] = leerTextosTerminadas(tareasRoot)
+): Comprobacion[] {
   if (cfg === null || cfg.comando_verificacion === null) return [];
-  let ids: string[];
-  try {
-    ids = readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId);
-  } catch {
-    return [];
-  }
-  const tareas = ids.map((id) => {
-    try {
-      return { id, version: versionDeCierre(readFileSync(path.join(tareasRoot, STATE_FOLDER.terminada, id, 'tarea.md'), 'utf8')) };
-    } catch {
-      return { id, version: null };
-    }
-  });
+  const tareas = terminadas.map((t) => ({ id: t.id, version: t.texto === null ? null : versionDeCierre(t.texto) }));
   const versiones = suitePorVersion(tareas, leerRegistroPuertas(cwd));
   if (versiones.length === 0) return [];
   const umbral = cfg.umbral_crecimiento_suite;
@@ -629,21 +647,18 @@ export function comprobarPodaTests(
   cwd: string,
   tareasRoot: string,
   cfg: TaskcodeConfig | null,
-  crecimiento: readonly Comprobacion[] = comprobarCrecimientoSuite(cwd, tareasRoot, cfg)
+  crecimiento: readonly Comprobacion[] = comprobarCrecimientoSuite(cwd, tareasRoot, cfg),
+  terminadas: readonly TerminadaLeida[] = leerTextosTerminadas(tareasRoot)
 ): Comprobacion[] {
   if (cfg === null) return [];
-  let ids: string[];
-  try {
-    ids = readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId);
-  } catch {
-    return [];
-  }
+  const ids = terminadas.map((t) => t.id);
   if (ids.length === 0) return [];
   const numero = (id: string): number => Number(TASK_ID_RE.exec(id)?.[1] ?? 0);
   let ultimaPoda = -1;
-  for (const id of ids) {
+  for (const { id, texto } of terminadas) {
+    if (texto === null) continue;
     try {
-      const t = parseTareaFile(readFileSync(path.join(tareasRoot, STATE_FOLDER.terminada, id, 'tarea.md'), 'utf8')).task;
+      const t = parseTareaFile(texto).task;
       if (t.etiquetas.includes(ETIQUETA_PODA)) ultimaPoda = Math.max(ultimaPoda, numero(id));
     } catch {
       // ilegible: de eso avisa `tareas`
@@ -770,26 +785,18 @@ function comprobarTareas(tareasRoot: string): Comprobacion[] {
 // Documento de estado (TASK-124)
 // ---------------------------------------------------------------------
 
-/** `id` y `actualizado` de las tareas de 04-terminadas; las que no se pueden leer se saltan (las cuenta `tareas`). */
-function leerTerminadas(tareasRoot: string): TareaTerminadaFecha[] {
-  const dir = path.join(tareasRoot, STATE_FOLDER.terminada);
-  let entradas: string[];
-  try {
-    entradas = readdirSync(dir);
-  } catch {
-    return [];
-  }
-  const terminadas: TareaTerminadaFecha[] = [];
-  for (const id of entradas) {
-    if (!isValidTaskId(id)) continue;
+/** `id` y `actualizado` de las tareas terminadas legibles (las ilegibles las cuenta `tareas`). */
+function fechasDeTerminadas(terminadas: readonly TerminadaLeida[]): TareaTerminadaFecha[] {
+  const fechas: TareaTerminadaFecha[] = [];
+  for (const { id, texto } of terminadas) {
+    if (texto === null) continue;
     try {
-      const task = parseTareaFile(readFileSync(path.join(dir, id, 'tarea.md'), 'utf8')).task;
-      terminadas.push({ id, actualizado: task.actualizado });
+      fechas.push({ id, actualizado: parseTareaFile(texto).task.actualizado });
     } catch {
-      // Rota o ilegible: ya la senala la comprobacion `tareas`.
+      // Rota: ya la senala la comprobacion `tareas`.
     }
   }
-  return terminadas;
+  return fechas;
 }
 
 /**
@@ -800,7 +807,8 @@ export function comprobarDocumentoEstado(
   cwd: string,
   cfg: TaskcodeConfig | null,
   repo: EstadoRepo,
-  ahora: Date
+  ahora: Date,
+  terminadas?: readonly TerminadaLeida[]
 ): Comprobacion {
   if (cfg === null) return omitida('documento-estado', 'la config no se pudo leer (ver config)');
   const ruta = cfg.documento_estado;
@@ -827,7 +835,10 @@ export function comprobarDocumentoEstado(
     existe,
     fechaUltimoCommit: fecha,
     hoy: diaLocal(ahora),
-    terminadas: ruta !== null && existe && fecha !== null ? leerTerminadas(path.join(cwd, 'tareas')) : [],
+    terminadas:
+      ruta !== null && existe && fecha !== null
+        ? fechasDeTerminadas(terminadas ?? leerTextosTerminadas(path.join(cwd, 'tareas')))
+        : [],
   });
 }
 
@@ -1052,20 +1063,23 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   cs.push(...envolver('workspace', () => comprobarWorkspace(cwd, repo, deps.timeoutGitMs ?? TIMEOUT_GIT_MS)));
 
   cs.push(...csConfig);
+  // TASK-138b (A6): las terminadas, una sola lectura para cuatro comprobaciones.
+  let leidas: TerminadaLeida[] | null = null;
+  const terminadas = (): TerminadaLeida[] => (leidas ??= leerTextosTerminadas(tareasRoot));
   cs.push(...envolver('verificacion', () => comprobarVerificacion(
         cfg,
         () => detectarComandosTests(cwd),
-        () => contarTerminadas(tareasRoot)
+        () => contarTerminadas(tareasRoot, terminadas())
       )
     )
   );
   cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
   cs.push(...envolver('puertas-verificacion', () => comprobarPuertasVerificacion(cfg)));
-  const crecimientoSuite = envolver('crecimiento-suite', () => comprobarCrecimientoSuite(cwd, tareasRoot, cfg));
+  const crecimientoSuite = envolver('crecimiento-suite', () => comprobarCrecimientoSuite(cwd, tareasRoot, cfg, terminadas()));
   cs.push(...crecimientoSuite);
-  cs.push(...envolver('poda-tests', () => comprobarPodaTests(cwd, tareasRoot, cfg, crecimientoSuite)));
+  cs.push(...envolver('poda-tests', () => comprobarPodaTests(cwd, tareasRoot, cfg, crecimientoSuite, terminadas())));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
-  cs.push(...envolver('documento-estado', () => comprobarDocumentoEstado(cwd, cfg, repo, deps.ahora ?? new Date())));
+  cs.push(...envolver('documento-estado', () => comprobarDocumentoEstado(cwd, cfg, repo, deps.ahora ?? new Date(), terminadas())));
   cs.push(
     ...envolver('plataforma', () =>
       comprobarPlataforma(cwd, cfg, hayOrigin, deps.timeoutPlataformaMs ?? TIMEOUT_PLATAFORMA_MS)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 027a16b..e14f7a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -64,7 +64,7 @@ import { PUERTA_FINISH } from '../core/registro-puertas.js';
 import { contarTests, PUERTA_SUITE } from '../core/crecimiento-suite.js';
 import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 import { configDeRef } from '../fs/config-de-ref.js';
-import { anotarPuerta } from '../fs/registro-puertas.js';
+import { anotarVerificacion } from '../fs/registro-puertas.js';
 import { CIERRE_SIN_MERGE, FinishCommandError } from './finish-opciones.js';
 import { sinPrefijoError } from '../core/utilidades-texto.js';
 
@@ -124,14 +124,7 @@ function anotarFinish(
   estado: string,
   deMemo = false
 ): void {
-  anotarPuerta(cwd, {
-    puerta: PUERTA_FINISH,
-    tarea: id,
-    instante: new Date().toISOString(),
-    modo,
-    duracionS: (Date.now() - inicioMs) / 1000,
-    resultado: deMemo ? 'omitido' : estado === 'verde' ? 'verde' : 'rojo',
-  });
+  anotarVerificacion(cwd, { puerta: PUERTA_FINISH, tarea: id, modo, inicioMs, estado, deMemo });
 }
 
 export interface PuertaPesadaOpts {
@@ -206,14 +199,7 @@ function porLoteEnBase(o: PuertaVerificacionOpts, ramaBase: string): boolean {
 export function anotarSuite(cwd: string, id: string, inicioMs: number, r: ResultadoVerificacion): void {
   // IMP-2: la cola son los ultimos bytes; si la salida era mayor, se dice.
   const n = contarTests(r.cola, { recortada: r.bytesTotales > Buffer.byteLength(r.cola, 'utf8') });
-  anotarPuerta(cwd, {
-    puerta: PUERTA_SUITE,
-    tarea: id,
-    instante: new Date().toISOString(),
-    modo: n === null ? '-' : String(n),
-    duracionS: (Date.now() - inicioMs) / 1000,
-    resultado: r.estado === 'verde' ? 'verde' : 'rojo',
-  });
+  anotarVerificacion(cwd, { puerta: PUERTA_SUITE, tarea: id, modo: n === null ? '-' : String(n), inicioMs, estado: r.estado });
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index ce8eee1..29e16c4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -34,7 +34,7 @@ import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertur
 import { formatearVerificacionRoja, seccionVerificacionRevision } from '../core/informe-verificacion.js';
 import { verificarConMemo, type VerificacionConMemo } from '../fs/verificacion.js';
 import { PUERTA_REVIEW } from '../core/registro-puertas.js';
-import { anotarPuerta } from '../fs/registro-puertas.js';
+import { anotarVerificacion } from '../fs/registro-puertas.js';
 import { peticionDeTrabajo, type PlanVerificacion } from '../fs/decision-documentacion.js';
 import { anotarLineaEnSeccion, registrarTransicion } from '../core/transiciones.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
@@ -48,7 +48,7 @@ import {
   rondaYRevisorDeInforme,
   siguienteRonda,
 } from '../fs/rondas.js';
-import { SECCION_RONDAS_EXTRA, lineaRondaExtra } from '../core/flujo.js';
+import { SECCION_RONDAS_EXTRA, lineaRondaExtra, textoSalidasTope } from '../core/flujo.js';
 import { configDeRef } from '../fs/config-de-ref.js';
 import { rondaExtraDecidida } from '../core/rondas-extra.js';
 import {
@@ -746,10 +746,7 @@ async function runReview(
       if (!rondaExtra) {
         throw new ReviewCommandError(
           `[ERROR] ${id}: la ronda ${String(previa.ronda)} ya llego al tope de rondas (${String(tope)}). ` +
-            'Lo decide una persona: cerrar con lo que hay (lo abierto, aceptado con sus IDs y el motivo en el ' +
-            'Resultado), volver a diseno (lo abierto, en una tarea nueva) o una ronda mas: anotar en tarea.md, ' +
-            `seccion "${SECCION_RONDAS_EXTRA}", la linea "${lineaRondaExtra(nueva)}" y ejecutar ` +
-            `"taskctl review ${id} --ronda-extra".`
+            textoSalidasTope(id, previa.ronda)
         );
       }
       if (!rondaExtraDecidida(initial!.body, nueva)) {
@@ -1315,13 +1312,13 @@ function verificacionDeRonda(
     { env: entornoVerificacion() }
   );
   // TASK-128: la verificacion de la ronda queda en el registro de puertas, tambien en rojo.
-  anotarPuerta(raiz, {
+  anotarVerificacion(raiz, {
     puerta: PUERTA_REVIEW,
     tarea: id,
-    instante: new Date().toISOString(),
     modo: motivo !== null ? 'documentacion' : 'selectiva',
-    duracionS: (Date.now() - inicioVerificacion) / 1000,
-    resultado: v.deMemo ? 'omitido' : v.resultado.estado === 'verde' ? 'verde' : 'rojo',
+    inicioMs: inicioVerificacion,
+    estado: v.resultado.estado,
+    deMemo: v.deMemo,
   });
   const nombre =
     motivo !== null
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
index a918a3c..a8814af 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
@@ -26,7 +26,7 @@ import { anotarLineaEnSeccion, MARCA_LOTE_VERDE, pendienteDeLote, SECCION_VERIFI
 import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { currentBranch, headCommit, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
 import { autoCommit, type AutoCommitResult } from '../fs/git-commit.js';
-import { anotarPuerta } from '../fs/registro-puertas.js';
+import { anotarVerificacion } from '../fs/registro-puertas.js';
 import { anotarSuite } from './finish-verificacion.js';
 import { listTareasEnEstados, readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
 import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
@@ -139,14 +139,7 @@ export async function runVerificarLoteCommand(
     throw e;
   }
   progreso.terminar(r.estado === 'verde' ? 'ok' : 'en-rojo');
-  anotarPuerta(cwd, {
-    puerta: PUERTA_FINISH,
-    tarea: '-',
-    instante: new Date().toISOString(),
-    modo: 'lote',
-    duracionS: (Date.now() - inicio) / 1000,
-    resultado: r.estado === 'verde' ? 'verde' : 'rojo',
-  });
+  anotarVerificacion(cwd, { puerta: PUERTA_FINISH, tarea: '-', modo: 'lote', inicioMs: inicio, estado: r.estado });
   // TASK-129: el tamano de la completa, anotado a la ultima tarea del lote.
   anotarSuite(cwd, ids[ids.length - 1] as string, inicio, r);
   // Como finish: el memo de la completa solo con el arbol limpio (la huella del commit).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 0214a0b..4e33254 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -184,6 +184,16 @@ export function salidasTopeRondas(id: string, rondaActual: number): SalidaPregun
   ];
 }
 
+/**
+ * TASK-138b (A6): el texto de las tres salidas del tope de rondas, compuesto
+ * de `salidasTopeRondas`. Lo usan `siguiente` (motivo) y el error de review;
+ * antes cada uno tenia su redaccion.
+ */
+export function textoSalidasTope(id: string, rondaActual: number): string {
+  const salidas = salidasTopeRondas(id, rondaActual).map((s) => `${s.descripcion} ("${s.comando}")`);
+  return `Lo decide una persona: ${salidas.join('; ')}.`;
+}
+
 /**
  * Fases que abren una fase NUEVA del ciclo: en semiautomatico se pregunta
  * antes de entrar. Las demas (veredicto, la primera codex-review, otra ronda
@@ -298,9 +308,7 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
               accion: 'preguntar',
               motivo:
                 `la ronda ${String(ctx.rondaRevision)} pidio cambios y es el tope de rondas (${String(tope)}). ` +
-                'Lo decide una persona: cerrar con lo que hay (lo abierto, aceptado con sus IDs y el motivo ' +
-                'en el Resultado), una ronda mas (anotada en tarea.md y con ' +
-                `"taskctl review ${task.id} --ronda-extra") o volver a diseno (lo abierto, en una tarea nueva)`,
+                textoSalidasTope(task.id, ctx.rondaRevision),
               salidas: salidasTopeRondas(task.id, ctx.rondaRevision),
             };
           }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
index 7b98b76..fc70206 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
@@ -102,8 +102,6 @@ export interface ResumenFreno {
  */
 export const PUERTA_REVIEW = 'review';
 export const PUERTA_FINISH = 'finish';
-/** Las puertas de verificacion que resume `metricas`, en su orden. */
-export const PUERTAS_VERIFICACION = Object.freeze([PUERTA_FRENO, PUERTA_REVIEW, PUERTA_FINISH] as const);
 
 /** Por tarea: cuantas veces corrio el freno y cuanto sumo. Ignora las demas puertas. */
 export function resumirFreno(lineas: readonly LineaPuerta[]): Map<string, ResumenFreno> {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
index 61bdef3..76bb0cc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
@@ -26,6 +26,26 @@ export function anotarPuerta(cwd: string, linea: LineaPuerta): void {
   }
 }
 
+/**
+ * TASK-138b (A4): la linea de una verificacion: instante, duracion desde
+ * `inicioMs` y resultado (`omitido` si salio del memo sin ejecutar; si no,
+ * verde o rojo). Antes, la misma decision escrita en finish, review,
+ * anotarSuite y verificar-lote.
+ */
+export function anotarVerificacion(
+  cwd: string,
+  o: { puerta: string; tarea: string; modo: string; inicioMs: number; estado: string; deMemo?: boolean }
+): void {
+  anotarPuerta(cwd, {
+    puerta: o.puerta,
+    tarea: o.tarea,
+    instante: new Date().toISOString(),
+    modo: o.modo,
+    duracionS: (Date.now() - o.inicioMs) / 1000,
+    resultado: o.deMemo === true ? 'omitido' : o.estado === 'verde' ? 'verde' : 'rojo',
+  });
+}
+
 /** Las lineas del registro del repo de `cwd`; vacio si no hay registro o no se puede leer. */
 export function leerRegistroPuertas(cwd: string): LineaPuerta[] {
   try {
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-138b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138b/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138b/tarea.md                                                       |  10 +++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                      | 101 ++++++++++++++++++++++++++++++++++++++++------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                         |  20 +++--------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      |  17 ++++++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-lote.js                              |  11 ++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                           |  13 ++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/registro-puertas.js                                |   2 --
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/registro-puertas.js                                  |  16 +++++++++++++
 14 files changed, 95 insertions(+), 95 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-puertas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/registro-puertas-verificacion.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-puertas.test.ts            |  2 --
 taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts                   | 15 ++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/registro-puertas-verificacion.test.ts | 32 ++++++++++++++++++++++++++++++++
 3 files changed, 46 insertions(+), 3 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 130.4 s
- Commit verificado: 91b1c964891a28c4c6dff9759cb09c952e64ea55
- Huella: 96ea9d188d3f06e049ec71673674d75fde3ab51c
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 97560 bytes en total):

````
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.8088ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (3.2767ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.1459ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.5844ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (1.7415ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (7.1315ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (13.7588ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (6.9042ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.5874ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.8279ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7575ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1612.6221ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1691.8756ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.2164ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2493ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8825ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (2.0848ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7278ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0932ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.7777ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (8.8192ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.58ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.0504ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.4275ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.1369ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.3089ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.7663ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3555ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4108ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3335ms)
✔ anotarVerificacion: omitido con memo, verde y rojo, con la duracion desde el inicio (662.4544ms)
ℹ tests 795
ℹ suites 0
ℹ pass 795
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 118373.7898
[verificar-impacto] node --test termino con 0 en 118.5 s.
````
