# Peticion de revision — TASK-146b (ronda 1)

- Tarea: TASK-146b — registrar-coste, readdir, fecha y cabeceras (parte b de TASK-146)
- Rama revisada: fix/task-146-regla-4d-duplicacion-en-new-import-roadm
- Rama base: develop
- Commit revisado (HEAD): 42882e9cf3512cb5ab82cb32e1d616472609a02d
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-146b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-146b/tarea.md
- tareas/03-en-revision/TASK-146b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-tareas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/documento-estado.test.ts

## Commits a revisar (git log develop..HEAD)

````
42882e9 chore(TASK-146b): autorrevision
679ff9f fix(TASK-146b): registrar-coste con CAMPOS_COSTE, un readdir tolerante, diaUtc y cabeceras fieles
351ad1e chore(TASK-146b): tarea en curso
49d0178 merge(TASK-146b): develop en fix/task-146-regla-4d-duplicacion-en-new-import-roadm para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 9a5a450..bcc6382 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -3,6 +3,7 @@
  * "import" (TASK-004) y "board" (TASK-005).
  */
 import path from 'node:path';
+import { diaUtc } from './core/documento-estado.js';
 import { runNewCommand, NewTaskArgError } from './commands/new.js';
 import { TaskIdError } from './core/task-id.js';
 import { runImportCommand, ImportCommandError } from './commands/import.js';
@@ -203,7 +204,7 @@ Ver docs/PLAN_SPRINTS.md en el repo del proyecto.
 `;
 
 function today(): string {
-  return new Date().toISOString().slice(0, 10);
+  return diaUtc(new Date());
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
index af54e0e..fb4f73c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
@@ -23,6 +23,7 @@
  *   `ocultarSecretos`: es la segunda red tras el enmascarado en origen.
  */
 import { existsSync, linkSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
+import { diaLocal, diaUtc } from '../core/documento-estado.js';
 import path from 'node:path';
 import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
 import {
@@ -208,11 +209,6 @@ function evaluarPunto(
   }
 }
 
-function fechaLocal(d: Date): string {
-  const dos = (n: number): string => String(n).padStart(2, '0');
-  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
-}
-
 /** Pone `tmp` en `destino` sin pisar nada: `link` (falla si existe) o, sin enlaces duros, `rename` tras comprobar. */
 function colocar(tmp: string, destino: string): boolean {
   try {
@@ -473,7 +469,7 @@ function emitir(a: Analisis): DoctorDeployResult {
   let mensajeEscritura = '';
   if (escribir) {
     try {
-      const destino = escribirInforme(raiz, fechaLocal(ahora), salidaSegura(formatearInforme(informe)), salidaSegura(formatearJson(informe)));
+      const destino = escribirInforme(raiz, diaLocal(ahora), salidaSegura(formatearInforme(informe)), salidaSegura(formatearJson(informe)));
       rutaInforme = destino.md;
       rutaJson = destino.json;
       const rel = path.relative(raiz, destino.md).replace(/\\/g, '/');
@@ -514,7 +510,7 @@ export async function runDoctorDeployCompleto(argv: readonly string[], deps: Doc
   if (!a.opciones.crearTareas) return emitir(a);
   let tareas: ResultadoCrearTareas;
   try {
-    tareas = await crearTareasDeFallas(a.informe, a.raiz, fechaLocal(a.ahora));
+    tareas = await crearTareasDeFallas(a.informe, a.raiz, diaUtc(a.ahora));
   } catch (e: unknown) {
     const resultado = a.opciones.resultado;
     if (
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index ce81428..cdba08e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -42,10 +42,11 @@
  * No entra en `--escribir`, y todo sale del repo: nunca se lee `~/.claude`.
  */
 import { PUERTA_FINISH, PUERTA_REVIEW, resumirFreno, resumirPuerta, sumarPorTarea } from '../core/registro-puertas.js';
+import { claveRuta } from '../fs/cobertura.js';
 import { PUERTA_SUITE } from '../core/crecimiento-suite.js';
 import { leerRegistroPuertas } from '../fs/registro-puertas.js';
 import path from 'node:path';
-import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
+import { readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
 import type { InformeLeido } from '../core/informe-revision.js';
 import { parseArgs, rechazarFlagsDesconocidos, extraerRepetible } from '../cli/args.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
@@ -92,7 +93,7 @@ import {
   nombresDeUltimaRonda,
   rondaYRevisorDeInforme,
 } from '../fs/rondas.js';
-import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
+import { listExistingTaskIds, listarSiExiste, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
 import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
 import { TRAMO_POR_DEFECTO, calcularEvolucion, formatearEvolucion, type Evolucion } from '../core/evolucion.js';
 import { calcularGrupos, formatearGrupos, type Grupos } from '../core/grupos-metricas.js';
@@ -319,12 +320,7 @@ function parseFlagsMetricas(argv: readonly string[]): FlagsMetricas {
 }
 
 async function nombresDeRevision(dirTarea: string): Promise<string[]> {
-  try {
-    return await readdir(path.join(dirTarea, 'revision'));
-  } catch (e: unknown) {
-    if (isEnoent(e) || isEnotdir(e)) return [];
-    throw e;
-  }
+  return listarSiExiste(path.join(dirTarea, 'revision'));
 }
 
 /** Informes de revision (todas las rondas) y bytes de cada peticion, de una pasada. */
@@ -357,11 +353,6 @@ function eventosGit(repoCwd: string): EventoGit[] | null {
   }
 }
 
-/** Clave con la que se comparan dos rutas reales: en Windows, sin distinguir mayusculas. */
-function claveRuta(ruta: string): string {
-  return process.platform === 'win32' ? ruta.toLowerCase() : ruta;
-}
-
 /**
  * Los repos de `--repo` (TASK-065), validados ANTES de leer nada: cada ruta
  * (relativa a `base`) debe existir y tener carpeta `tareas`. Se normalizan con
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index b6d45ec..52b5ae1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -31,7 +31,7 @@ import {
   PISTA_VACIO_ESCRITURA,
 } from '../cli/asignado.js';
 import type { Task, ReglaSeleccionSkill } from '../core/task.js';
-import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
+import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir, listarSiExiste } from '../fs/task-store.js';
 import { registrarTransicion } from '../core/transiciones.js';
 import { resolverConfig } from '../core/config.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
@@ -141,14 +141,6 @@ const RONDA_UNIFICADOR_RE = /^peticion-(unificador|plan)-(\d+)\.md$/;
 export const PLANIFICACION_DIRNAME = 'planificacion';
 
 /** readdir tolerante: un directorio que no existe es "no hay nada". */
-async function listarDir(dir: string): Promise<string[]> {
-  try {
-    return await readdir(dir);
-  } catch (e: unknown) {
-    if (isEnoent(e) || isEnotdir(e)) return [];
-    throw e;
-  }
-}
 
 /**
  * Fichero regular Y con algo dentro. Un fichero de cero bytes es lo
@@ -786,31 +778,11 @@ async function runPlan(
   //
   // ── COMO SE MODELA EL ESTADO DE ESTA CARPETA, y por que asi ────────
   //
-  // Este bloque se reescribio entero tras CUATRO rondas de revision por
-  // pares, en las que el MISMO CRITICO se arreglo tres veces y volvio a
-  // aparecer por una puerta distinta cada vez. Los tres arreglos eran
-  // correctos para el caso que tenian delante; lo que fallaba era el
-  // modelo. Merece la pena que quede escrito, porque es la parte
-  // reutilizable:
-  //
-  //   1º intento — la ronda se deducia de los TRES tipos de fichero, y
-  //      un resto de una ronda interrumpida la subia: la primera
-  //      planificacion acababa sin peticiones de rol, con exit 0.
-  //   2º intento — se eligio "el testigo" (la peticion del unificador,
-  //      que se escribe la ultima), pero validado POR SU NOMBRE: un
-  //      testigo huerfano o de cero bytes contaba como ronda completa.
-  //   3º intento — se exigio a TODA ronda lo que solo la ronda 1
-  //      produce, con lo que ninguna ronda >=2 podia estar completa y
-  //      el contador se quedaba clavado en 2 para siempre.
-  //   4ª ronda — un testigo con numero >=2 volvia a dejar la tarea sin
-  //      brainstorm; subir el numero de roles dejaba la peticion del
-  //      unificador rancia y contradiciendo a las peticiones de rol; y
-  //      bajarlo sin llegar a cero seguia tirando salidas reales.
-  //
-  // La grieta comun: se estaba modelando la carpeta con DOS escalares
-  // ("en que ronda voy" y "reutilizo el brainstorm") derivados de UN
-  // solo fichero. Lo que la logica necesita saber son TRES cosas
-  // independientes, y aqui se preguntan por separado y contra el disco:
+  // TASK-146b (CMD2-16): la historia de las rondas que llevaron a este modelo
+  // esta en git (TASK-012/017/027). Lo que importa: modelar la carpeta con dos
+  // escalares derivados de UN fichero fallo una y otra vez. Lo que la logica
+  // necesita saber son TRES cosas independientes, y aqui se preguntan por
+  // separado y contra el disco:
   //
   //   (a) ¿En que ronda escribo?  -> avanza con cada vuelta cerrada.
   //   (b) ¿Hay un brainstorm reutilizable PARA LOS ROLES DE HOY?
@@ -835,7 +807,7 @@ async function runPlan(
     );
   }
 
-  const enBrainstorm = await listarDir(brainstormDir);
+  const enBrainstorm = await listarSiExiste(brainstormDir);
 
   const rondasConAlgo = (re: RegExp): number[] =>
     [...new Set(enBrainstorm.map((f) => re.exec(f)).filter((m) => m !== null).map((m) => Number(m![m!.length - 1])))]
@@ -1000,7 +972,7 @@ async function runPlan(
   // cuantas sean.
   const salidasAConsolidar: { nombre: string; titulo: string }[] = [];
   if (rondaRoles !== null) {
-    for (const nombre of await listarDir(brainstormDir)) {
+    for (const nombre of await listarSiExiste(brainstormDir)) {
       if (SALIDA_ROL_RE.exec(nombre)?.[1] !== String(rondaRoles)) continue;
       const rol = TODOS_LOS_ROLES.find((r) => nombre === nombreSalidaRol(r, rondaRoles as number));
       salidasAConsolidar.push({
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index 18868ba..15b13e0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -3,7 +3,9 @@
  *  (--agente <id>... | --tokens N) [--push]` — TASK-023.
  *
  * Suma al coste en tokens de una fase de la tarea (`tokens_diseno`,
- * `tokens_implementacion` o `tokens_revision` de su tarea.md) y lo commitea.
+ * `tokens_implementacion` o `tokens_revision` de su tarea.md). TASK-119: no
+ * lo commitea (queda pendiente y lo incluye el commit del siguiente comando de
+ * fase), salvo con la tarea ya terminada, que no tiene fase siguiente.
  * `taskctl` no ve el consumo del agente: lo registra quien lo ve.
  *
  * Dos formas de dar la cifra, excluyentes y una obligatoria:
@@ -22,27 +24,26 @@
  *    revision se conoce cuando la tarea ya esta casi o del todo cerrada.
  *    Por eso no pasa por la maquina de estados, y no cambia el estado ni
  *    `actualizado`.
- * 3. Escribe y commitea SOLO ese tarea.md. Mismas precondiciones que
- *    `pausa`: la rama de la tarea es donde esta al dia (si no, aborta y dice
- *    a cual cambiar), y el propio tarea.md no puede tener cambios sin
- *    commitear (el commit se los llevaria). Lo demas del arbol no importa:
- *    el commit es pathspec-limitado.
+ * 3. Escribe SOLO ese tarea.md (y lo commitea solo si la tarea esta
+ *    terminada, con un commit limitado a ese fichero). La rama de la tarea es
+ *    donde esta al dia: si no, aborta y dice a cual cambiar.
  * 4. Una cifra de 0 se rechaza: registrar nada no tiene sentido y dejaria un
  *    commit que parece un registro.
  * 5. TASK-063: cada llamada deja ademas una fila en la tabla `## Coste` del
  *    cuerpo (`core/coste-registro.ts`), en el mismo fichero y el mismo
- *    commit que el total. Con `--agente`, el desglose sumado de sus agentes
+ *    fichero que el total. Con `--agente`, el desglose sumado de sus agentes
  *    (entrada, escritura y lectura de cache, salida, lecturas); con
  *    `--tokens N`, una fila `manual` con solo el total.
  * 6. TASK-081: con `--fase revision` y `--agente`, UNA FILA POR AGENTE (en el
- *    mismo fichero y commit), cada una con la ronda y el revisor que deduce
+ *    mismo fichero), cada una con la ronda y el revisor que deduce
  *    de su transcripcion (el nombre `peticion-revision-N[-skill].md` del
  *    primer mensaje de usuario). Lo que no se deduce queda `-`: sin atribuir.
  *    `--ronda N [--revisor <skill>]` lo declaran a mano, solo con un unico
  *    `--agente`, y se validan contra las peticiones que hay en `revision/`.
  *    Las otras fases siguen con una sola fila por llamada.
  */
-import { readdir, writeFile } from 'node:fs/promises';
+import { writeFile } from 'node:fs/promises';
+import { listarSiExiste } from '../fs/task-store.js';
 import path from 'node:path';
 import { rechazarFlagsDesconocidos, parseArgs, extraerRepetible, extraerPushFlag } from '../cli/args.js';
 import { readTareaFile } from '../fs/task-store.js';
@@ -54,7 +55,6 @@ import {
   sumarUsoTranscripcion,
 } from '../core/coste-transcripcion.js';
 import { rondaYRevisorDePeticion } from '../fs/rondas.js';
-import { isEnoent, isEnotdir } from '../fs/task-store.js';
 import {
   anadirCoste,
   FASES_COSTE,
@@ -210,6 +210,23 @@ interface CosteDeAgente extends CosteDeAgentes {
 
 const CAMPOS_COSTE = ['tokens', 'entrada', 'cacheEscritura', 'cacheLectura', 'salida', 'lecturas'] as const;
 
+/** TASK-146b (CMD2-12): un coste a cero, campo a campo desde CAMPOS_COSTE (un campo nuevo no queda sin poner). */
+function costeCero(): CosteDeAgentes {
+  return Object.fromEntries(CAMPOS_COSTE.map((k) => [k, 0])) as unknown as CosteDeAgentes;
+}
+
+/** TASK-146b (CMD2-12): lo que suma una fila de `## Coste` (su `total` es `tokens`; sin lecturas, 0). */
+function costeDeFila(f: FilaCoste): CosteDeAgentes {
+  return {
+    tokens: f.total,
+    entrada: f.entrada ?? 0,
+    cacheEscritura: f.cacheEscritura ?? 0,
+    cacheLectura: f.cacheLectura ?? 0,
+    salida: f.salida ?? 0,
+    lecturas: f.lecturas ?? 0,
+  };
+}
+
 /**
  * Lo ya anotado en `## Coste` de la fase para cada id de `agentes` que
  * aparezca alli (TASK-065): la suma de sus filas, la original y las de
@@ -236,14 +253,7 @@ function yaAnotado(
             'Registra la diferencia a mano con --tokens N. No se ha tocado nada.'
         );
       }
-      const previo = anotado.get(agente) ?? { tokens: 0, entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0, lecturas: 0 };
-      previo.tokens += f.total;
-      previo.entrada += f.entrada;
-      previo.cacheEscritura += f.cacheEscritura;
-      previo.cacheLectura += f.cacheLectura;
-      previo.salida += f.salida;
-      previo.lecturas += f.lecturas ?? 0;
-      anotado.set(agente, previo);
+      anotado.set(agente, sumarAgentes([anotado.get(agente) ?? costeCero(), costeDeFila(f)]));
     }
   }
   return anotado;
@@ -313,12 +323,7 @@ async function costeDeAgentes(
     }
     const delAgente: CosteDeAgente = {
       id,
-      tokens: 0,
-      entrada: 0,
-      cacheEscritura: 0,
-      cacheLectura: 0,
-      salida: 0,
-      lecturas: 0,
+      ...costeCero(),
       atribucion: rondaYRevisorDeTranscripcion(texto),
     };
     for (const k of CAMPOS_COSTE) delAgente[k] = uso[k] - (previo?.[k] ?? 0);
@@ -333,7 +338,7 @@ async function costeDeAgentes(
 }
 
 function sumarAgentes(lista: readonly CosteDeAgentes[]): CosteDeAgentes {
-  const suma: CosteDeAgentes = { tokens: 0, entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0, lecturas: 0 };
+  const suma = costeCero();
   for (const a of lista) for (const k of CAMPOS_COSTE) suma[k] += a[k];
   return suma;
 }
@@ -377,13 +382,7 @@ function leerAtribucionManual(
 
 /** Peticiones de revision de la carpeta de la tarea, con su ronda y su revisor; vacio sin `revision/`. */
 async function peticionesDeRevision(dirTarea: string): Promise<{ ronda: number; revisor: string }[]> {
-  let nombres: string[];
-  try {
-    nombres = await readdir(path.join(dirTarea, 'revision'));
-  } catch (e: unknown) {
-    if (isEnoent(e) || isEnotdir(e)) return [];
-    throw e;
-  }
+  const nombres = await listarSiExiste(path.join(dirTarea, 'revision'));
   return nombres.flatMap((n) => {
     const p = rondaYRevisorDePeticion(n);
     return p === null ? [] : [p];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 509c872..ce8eee1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -9,9 +9,8 @@
  * El CLI hace SOLO lo determinista: no invoca ningun LLM (decision
  * con Carlos, 2026-09-05 — mismo patron que el plan minimo de
  * TASK-010, donde el contenido lo redacta el agente que orquesta
- * Claude Code). La fragmentacion de revisores por dominio es TASK-018
- * y la puerta determinista build/lint/tests de la seccion 16
- * (correccion 5) queda para TASK-018/019.
+ * Claude Code). La ronda se fragmenta por dominio (TASK-018) y corre la
+ * verificacion selectiva antes de escribirse (TASK-091).
  *
  * `ultimo_commit_revisado` NO se actualiza aqui a proposito: segun la
  * seccion 16.3 se actualiza cuando una revision TERMINA (informe
@@ -601,7 +600,7 @@ export function informeTemplate(task: Task, commitRevisado: string, ronda: numbe
     // taskctl finish exige que TODAS las lineas "- Veredicto:" del
     // informe aprueben: hay que SUSTITUIR esta linea, no anadir otra.
     // TASK-036: el veredicto lo escribe `taskctl veredicto`, que deja la
-    // linea canonica y la commitea; escribirla a mano en otro vocabulario
+    // linea canonica (sin commitear: TASK-119); escribirla a mano en otro vocabulario
     // obligaba a commits de normalizacion.
     '- Veredicto: PENDIENTE (escribelo con: taskctl veredicto ' +
     `${task.id} aprobada | aprobada-con-correcciones | cambios-solicitados)\n\n` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index f6264ec..cc09f7f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -3,7 +3,8 @@
  * 2026-10-03, A5).
  *
  * Escribe la linea `- Veredicto:` del informe de revision de la ultima
- * ronda en su forma canonica y la commitea. Existe porque los revisores
+ * ronda en su forma canonica. TASK-119: no la commitea; queda pendiente y la
+ * incluye el commit del siguiente comando de fase (review o finish). Existe porque los revisores
  * la escribian a mano en su propio vocabulario (`**APROBADO CON
  * CAMBIOS**`, `**cambios-solicitados**`), el gate fail-closed de
  * `finish` las rechazaba con razon, y cada vez hacia falta un commit de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts
index cf5b259..a5bd89b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts
@@ -62,6 +62,15 @@ export function diaLocal(fecha: Date): string {
   return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
 }
 
+/**
+ * TASK-146b (CMD1-08): el dia AAAA-MM-DD en UTC. Es la fecha de `creado` y
+ * `actualizado` de las tareas (la de `taskctl new`); doctor-deploy la usaba en
+ * hora local y una tarea creada a las 23:30 de Madrid salia con otro dia.
+ */
+export function diaUtc(fecha: Date): string {
+  return fecha.toISOString().slice(0, 10);
+}
+
 /** Dias de calendario de `desde` a `hasta` (ambos AAAA-MM-DD); negativo si `hasta` es anterior. */
 export function diasEntre(desde: string, hasta: string): number {
   const ms = (dia: string): number => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
index 57f3b85..6c562dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
@@ -334,6 +334,20 @@ export async function readTareaFile(
  * plan-final.md) necesitan la misma comprobacion de codigo de error
  * que esta capa ya resolvia solo para uso interno.
  */
+/**
+ * TASK-146b (CMD2-13): las entradas de `dir`, o [] si no existe o no es una
+ * carpeta; cualquier otro error (EACCES...) se propaga. Antes, copiada en
+ * metricas, plan y registrar-coste.
+ */
+export async function listarSiExiste(dir: string): Promise<string[]> {
+  try {
+    return await readdir(dir);
+  } catch (e: unknown) {
+    if (isEnoent(e) || isEnotdir(e)) return [];
+    throw e;
+  }
+}
+
 export function isEnoent(e: unknown): boolean {
   return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'ENOENT';
 }
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-146b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146b/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146b/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146b/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                  |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy.js                               |  9 +++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                    | 18 ++++--------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                        | 48 +++++++++---------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js                             | 63 +++++++++++++++++++++++++++++----------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      |  7 +++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js                                   |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/documento-estado.js                                |  8 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/task-store.js                                        | 15 +++++++++++++++
 16 files changed, 83 insertions(+), 101 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-tareas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/documento-estado.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-tareas.test.ts | 14 ++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/documento-estado.test.ts         |  7 +++++++
 2 files changed, 21 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 271.0 s
- Commit verificado: 42882e9cf3512cb5ab82cb32e1d616472609a02d
- Huella: e9f0a9aaabc5fa943e1ed2828f371b40eee50664
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 104103 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3527ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.7379ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (2.223ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.0047ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.1846ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (1.966ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (33.8284ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (2.4611ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (6.2321ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.5428ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (0.9836ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7386ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (2527.9211ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (2216.247ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.2938ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2543ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8939ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6699ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7708ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0392ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.9801ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (12.6168ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7098ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.9011ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6583ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.7139ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.5434ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8477ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4029ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.7412ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3936ms)
ℹ tests 872
ℹ suites 0
ℹ pass 871
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 250875.4958
[verificar-impacto] node --test termino con 0 en 251.1 s.
````
