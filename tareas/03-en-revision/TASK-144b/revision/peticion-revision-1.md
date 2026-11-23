# Peticion de revision — TASK-144b (ronda 1)

- Tarea: TASK-144b — flags con y sin valor (parte b de TASK-144)
- Rama revisada: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
- Rama base: develop
- Commit revisado (HEAD): 3db54b20e2a38d8a4f161feabad4642b27126980
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-144b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-144b/tarea.md
- tareas/03-en-revision/TASK-144b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-paridad.test.ts

## Commits a revisar (git log develop..HEAD)

````
3db54b2 docs(TASK-144b): autorrevision
565e603 fix(TASK-144b): un solo lector de flags con valor y todos los booleanos en FLAGS_SIN_VALOR
4fd6d50 chore(TASK-144b): tarea en curso
fb1a268 merge(TASK-144b): develop en fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index 381a01b..fb1bb91 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -83,6 +83,25 @@ export function extraerRepetible(
   return { valores, resto };
 }
 
+/**
+ * TASK-144b (CMD1-09 y CMD2-05 de la auditoria 4D): un flag con valor que no
+ * se repite (`--tag`, `--informe`, `--motivo`...). Una sola regla para todos
+ * los comandos, la de `extraerRepetible`: `--flag valor` y `--flag=valor` dan
+ * lo mismo; un valor que empieza por `--` solo con `=`; sin valor o repetido,
+ * el error que da `error` (con `repetido` a true en el segundo caso). Antes
+ * siete lectores a mano divergian: `--motivo=x` abortaba en verificar-menores
+ * aunque `rechazarFlagsDesconocidos` lo aceptaba.
+ */
+export function extraerUnico(
+  argv: readonly string[],
+  flag: string,
+  error: (repetido: boolean) => Error
+): { valor: string | null; resto: string[] } {
+  const { valores, resto } = extraerRepetible(argv, flag, () => error(false));
+  if (valores.length > 1) throw error(true);
+  return { valor: valores[0] ?? null, resto };
+}
+
 /**
  * Aborta si argv trae un flag que el comando no conoce (TASK-047, auditoria
  * D4). Antes `--complejida trivial` se ignoraba en silencio y la tarea salia
@@ -106,8 +125,13 @@ export function extraerRepetible(
  */
 export const FLAGS_REPETIBLES: readonly string[] = ['--agente', '--repo', '--criterio'];
 
-/** Flags booleanos del CLI: los comandos solo reconocen el token suelto. */
-const FLAGS_SIN_VALOR: readonly string[] = [
+/**
+ * Flags booleanos del CLI: los comandos solo reconocen el token suelto, asi
+ * que `--flag=valor` aborta. TASK-144b (FS-01): faltaban los de review,
+ * finish y estado (`--completa=1` se ignoraba en silencio); un test recorre
+ * src/commands y falla si un comando lee por token un booleano que no esta.
+ */
+export const FLAGS_SIN_VALOR: readonly string[] = [
   '--push',
   '--json',
   '--forzar',
@@ -118,6 +142,17 @@ const FLAGS_SIN_VALOR: readonly string[] = [
   '--merge-request',
   '--evolucion',
   '--grupos',
+  '--tokens',
+  '--por-version',
+  '--completa',
+  '--ronda-extra',
+  '--sin-verificacion',
+  '--aceptar-sin-revisar',
+  '--seguir',
+  '--stdin',
+  '--instalar-status-line',
+  '--reemplazar-status-line',
+  '--desinstalar-status-line',
 ];
 
 export function rechazarFlagsDesconocidos(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 115fd28..ddd8db3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -18,7 +18,7 @@
  * seccion 8.3 (ensureBaseBranchReady) antes de escribir nada.
  */
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
 import type { Task } from '../core/task.js';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import {
@@ -278,21 +278,12 @@ async function runApprove(
  * valor desconocido aborta: no se adivina quien aprobo.
  */
 function extraerDecididoPor(argv: readonly string[]): { decididoPor: DecididoPor; resto: string[] } {
-  const resto: string[] = [];
-  let valor: string | undefined;
-  for (let i = 0; i < argv.length; i++) {
-    const a = argv[i] as string;
-    if (a === '--decidido-por') {
-      // Sin valor detras no se cae a "persona" en silencio.
-      valor = argv[i + 1] ?? '';
-      i++;
-    } else if (a.startsWith('--decidido-por=')) {
-      valor = a.slice('--decidido-por='.length);
-    } else {
-      resto.push(a);
-    }
-  }
-  if (valor === undefined) return { decididoPor: 'persona', resto };
+  // TASK-144b: el lector comun de flag con valor. Sin valor detras no se cae
+  // a "persona" en silencio: aborta.
+  const { valor, resto } = extraerUnico(argv, '--decidido-por', () =>
+    new ApproveCommandError(`[ERROR] --decidido-por necesita un valor. Valores: ${DECIDIDO_POR.join(', ')}.`)
+  );
+  if (valor === null) return { decididoPor: 'persona', resto };
   if (!(DECIDIDO_POR as readonly string[]).includes(valor)) {
     throw new ApproveCommandError(
       `[ERROR] --decidido-por "${valor}" no es valido. Valores: ${DECIDIDO_POR.join(', ')}.`
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index 873c302..2dfc226 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -20,7 +20,7 @@
 import { randomBytes } from 'node:crypto';
 import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
 import { runGit } from '../fs/git.js';
 import { isEexist, isEnoent } from '../fs/task-store.js';
 import { isValidTaskId } from '../core/task.js';
@@ -241,24 +241,16 @@ export async function verificarCadena(repoCwd: string, testigo: string | undefin
 
 /** Saca `--cadena <testigo>` (o `--cadena=<testigo>`) de argv. Sin valor, testigo vacio (y falla al validar). */
 export function extraerCadena(argv: readonly string[]): { testigo: string | undefined; resto: string[] } {
-  const resto: string[] = [];
-  let testigo: string | undefined;
-  for (let i = 0; i < argv.length; i++) {
-    const a = argv[i] as string;
-    // TASK-065: un --cadena repetido no se pisa en silencio.
-    if (testigo !== undefined && (a === '--cadena' || a.startsWith('--cadena='))) {
-      throw new CadenaCommandError(
-        '[ERROR] --cadena esta repetido y no admite repeticion: pasa el testigo una sola vez.'
-      );
-    }
-    if (a === '--cadena') {
-      testigo = argv[i + 1] ?? '';
-      i++;
-    } else if (a.startsWith('--cadena=')) {
-      testigo = a.slice('--cadena='.length);
-    } else {
-      resto.push(a);
-    }
-  }
-  return { testigo, resto };
+  // TASK-144b: el lector comun de flag con valor. TASK-065: un --cadena
+  // repetido no se pisa en silencio; sin testigo aborta (MEN-2: un testigo
+  // vacio nunca casa con el de un bloqueo roto).
+  const { valor, resto } = extraerUnico(argv, '--cadena', (repetido) =>
+    new CadenaCommandError(
+      repetido
+        ? '[ERROR] --cadena esta repetido y no admite repeticion: pasa el testigo una sola vez.'
+        : '[ERROR] --cadena necesita el testigo de la cadena: --cadena <testigo>.'
+    )
+  );
+  return { testigo: valor ?? undefined, resto };
 }
+
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
index d779e47..d87e30b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
@@ -24,7 +24,7 @@
  */
 import { existsSync, linkSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
 import {
   cargarCapaProyecto,
   cargarCatalogoDeploy,
@@ -281,21 +281,11 @@ const USO = 'Uso: taskctl doctor-deploy [--json] [--escribir] [--resultado <fich
 
 function leerOpciones(argv: readonly string[]): OpcionesComando {
   rechazarFlagsDesconocidos(argv, FLAGS_DOCTOR_DEPLOY, 'doctor-deploy', (m) => new DoctorDeployCommandError(m));
-  // `--resultado` lleva valor: se saca antes de buscar argumentos sueltos.
-  const resto: string[] = [];
-  let resultado: string | null = null;
-  for (let i = 0; i < argv.length; i++) {
-    const a = argv[i] as string;
-    if (a === '--resultado' || a.startsWith('--resultado=')) {
-      const valor = a === '--resultado' ? argv[++i] : a.slice('--resultado='.length);
-      if (valor === undefined || valor.trim() === '' || valor.startsWith('--')) {
-        throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: --resultado necesita la ruta del JSON del agente. ${USO}`);
-      }
-      resultado = valor;
-    } else {
-      resto.push(a);
-    }
-  }
+  // `--resultado` lleva valor: se saca antes de buscar argumentos sueltos
+  // (TASK-144b: con el lector comun de flag con valor).
+  const { valor: resultado, resto } = extraerUnico(argv, '--resultado', () =>
+    new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: --resultado necesita la ruta del JSON del agente. ${USO}`)
+  );
   const sobra = resto.find((a) => !a.startsWith('-'));
   if (sobra !== undefined) {
     throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: no admite argumentos ("${sobra}"). ${USO}`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
index 0b7a7e5..1a8520b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
@@ -25,6 +25,7 @@ import {
   urlsDeOrigin,
 } from '../fs/git.js';
 import { GitCommandError } from '../fs/git.js';
+import { extraerUnico } from '../cli/args.js';
 import { comprobarCli } from '../fs/merge-request.js';
 import {
   detectarPlataforma,
@@ -54,37 +55,16 @@ export interface FlagsCierre {
  * nombre, o repetido, aborta: ignorarlo dejaria cerrar sin el tag pedido.
  */
 export function extraerFlagsCierre(argv: readonly string[]): FlagsCierre {
-  const resto: string[] = [];
-  let tag: string | null = null;
-  let mergeRequest = false;
-  for (let i = 0; i < argv.length; i++) {
-    const arg = argv[i] as string;
-    if (arg === '--merge-request') {
-      mergeRequest = true;
-      continue;
-    }
-    if (arg === '--tag' || arg.startsWith('--tag=')) {
-      if (tag !== null) {
-        throw new FinishCommandError('[ERROR] taskctl finish: "--tag" esta repetido; un cierre lleva un solo tag.');
-      }
-      let valor: string | undefined;
-      if (arg === '--tag') {
-        valor = argv[i + 1];
-        i++;
-      } else {
-        valor = arg.slice('--tag='.length);
-      }
-      if (valor === undefined || valor.trim() === '' || (arg === '--tag' && valor.startsWith('--'))) {
-        throw new FinishCommandError(
-          '[ERROR] taskctl finish: "--tag" necesita un nombre: taskctl finish TASK-NNN --tag v1.2.0.'
-        );
-      }
-      tag = valor;
-      continue;
-    }
-    resto.push(arg);
-  }
-  return { tag, mergeRequest, resto };
+  // TASK-144b: el mismo lector de flag con valor que el resto de comandos.
+  const { valor: tag, resto: sinTag } = extraerUnico(argv, '--tag', (repetido) =>
+    new FinishCommandError(
+      repetido
+        ? '[ERROR] taskctl finish: "--tag" esta repetido; un cierre lleva un solo tag.'
+        : '[ERROR] taskctl finish: "--tag" necesita un nombre: taskctl finish TASK-NNN --tag v1.2.0.'
+    )
+  );
+  const resto = sinTag.filter((a) => a !== '--merge-request');
+  return { tag, mergeRequest: resto.length !== sinTag.length, resto };
 }
 
 // ---------------------------------------------------------------------
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index ee5020f..1d7611e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -12,7 +12,7 @@
  */
 import { readFile } from 'node:fs/promises';
 import path from 'node:path';
-import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerRepetible, extraerUnico, parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
 import {
   autoCommit,
   extraerPushFlag,
@@ -83,42 +83,26 @@ export function extraerContenidoInicial(argv: readonly string[]): {
   contenido: ContenidoInicial;
   resto: string[];
 } {
-  const resto: string[] = [];
-  const contenido: ContenidoInicial = { objetivo: null, criterios: [], desde: null };
-  for (let i = 0; i < argv.length; i++) {
-    const arg = argv[i] as string;
-    const m = /^--(objetivo|criterio|desde)(?:=(.*))?$/s.exec(arg);
-    if (m === null) {
-      resto.push(arg);
-      continue;
-    }
-    const nombre = m[1] as 'objetivo' | 'criterio' | 'desde';
-    let valor = m[2];
-    if (valor === undefined) {
-      valor = argv[i + 1];
-      if (valor === undefined || valor.startsWith('--')) {
-        throw new NewTaskArgError(`--${nombre} necesita un valor: --${nombre} "<texto>".`);
-      }
-      i++;
-    }
-    if (valor.trim() === '') {
-      throw new NewTaskArgError(`--${nombre} no puede estar vacio.`);
-    }
-    // MEN-1 de la revision: un criterio es UNA linea de checklist (con
-    // saltos, `plan` perdia lo que venia detras), y un objetivo con una
-    // cabecera `##` partiria las secciones de tarea.md.
-    if (nombre === 'criterio') contenido.criterios.push(valor.trim().replace(/\s*\r?\n\s*/g, ' '));
-    else if (nombre === 'objetivo') {
-      if (/^#{1,6}\s/m.test(valor)) {
-        throw new NewTaskArgError(
-          '--objetivo no puede contener cabeceras markdown (lineas que empiezan por "#"): ' +
-            'partirian las secciones de tarea.md. Usa --desde <fichero> para un objetivo con estructura.'
-        );
-      }
-      contenido.objetivo = valor.trim();
-    }
-    else contenido.desde = valor;
+  // TASK-144b: los lectores comunes de flag con valor (repetible el criterio).
+  const sinValor = (nombre: string) => () =>
+    new NewTaskArgError(`--${nombre} necesita un valor no vacio: --${nombre} "<texto>".`);
+  const { valores: criterios, resto: r1 } = extraerRepetible(argv, '--criterio', sinValor('criterio'));
+  const { valor: objetivo, resto: r2 } = extraerUnico(r1, '--objetivo', sinValor('objetivo'));
+  const { valor: desde, resto } = extraerUnico(r2, '--desde', sinValor('desde'));
+  // MEN-1 de la revision: un criterio es UNA linea de checklist (con
+  // saltos, `plan` perdia lo que venia detras), y un objetivo con una
+  // cabecera `##` partiria las secciones de tarea.md.
+  if (objetivo !== null && /^#{1,6}\s/m.test(objetivo)) {
+    throw new NewTaskArgError(
+      '--objetivo no puede contener cabeceras markdown (lineas que empiezan por "#"): ' +
+        'partirian las secciones de tarea.md. Usa --desde <fichero> para un objetivo con estructura.'
+    );
   }
+  const contenido: ContenidoInicial = {
+    objetivo: objetivo === null ? null : objetivo.trim(),
+    criterios: criterios.map((c) => c.trim().replace(/\s*\r?\n\s*/g, ' ')),
+    desde,
+  };
   if (contenido.desde !== null && (contenido.objetivo !== null || contenido.criterios.length > 0)) {
     throw new NewTaskArgError(
       '--desde no se combina con --objetivo ni --criterio: o el fichero trae las dos ' +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index 483b216..a0b7c23 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -21,7 +21,7 @@
  */
 import { readFile, writeFile } from 'node:fs/promises';
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { readTareaFile } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
@@ -88,26 +88,12 @@ export function sustituirVeredicto(informe: string, linea: string): string | nul
   return resultado.join('\n');
 }
 
-/** Saca `--informe <nombre>` de argv. */
+/** Saca `--informe <nombre>` (o `--informe=<nombre>`) de argv (TASK-144b: `extraerUnico`). */
 function extraerInforme(argv: readonly string[]): { informe: string | null; resto: string[] } {
-  const resto: string[] = [];
-  let informe: string | null = null;
-  for (let i = 0; i < argv.length; i++) {
-    const arg = argv[i] as string;
-    if (arg === '--informe') {
-      const valor = argv[i + 1];
-      if (valor === undefined || valor.startsWith('--')) {
-        throw new VeredictoCommandError(
-          '[ERROR] --informe necesita el nombre del fichero: --informe informe-revision-N-<revisor>.md'
-        );
-      }
-      informe = valor;
-      i++;
-      continue;
-    }
-    resto.push(arg);
-  }
-  return { informe, resto };
+  const { valor, resto } = extraerUnico(argv, '--informe', () =>
+    new VeredictoCommandError('[ERROR] --informe necesita el nombre del fichero: --informe informe-revision-N-<revisor>.md')
+  );
+  return { informe: valor, resto };
 }
 
 export async function runVeredictoCommand(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
index 388a11f..863241d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
@@ -26,7 +26,7 @@ import { isValidTaskId, STATE_FOLDER } from '../core/task.js';
 import { anotarLineaEnSeccion, MARCA_LOTE_VERDE, pendienteDeLote, SECCION_VERIFICACION_LOTE } from '../core/transiciones.js';
 import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { currentBranch, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
-import { autoCommit, type AutoCommitResult } from '../fs/git-commit.js';
+import { autoCommit, extraerPushFlag, type AutoCommitResult } from '../fs/git-commit.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
 import { anotarSuite } from './finish-verificacion.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
@@ -85,8 +85,10 @@ export async function runVerificarLoteCommand(
   argv: readonly string[],
   deps: VerificarLoteDeps
 ): Promise<VerificarLoteResult> {
-  rechazarFlagsDesconocidos(argv, ['--push'], 'taskctl verificar-lote', (m) => new VerificarLoteCommandError(m));
-  const push = argv.includes('--push');
+  // TASK-144b (CMD2-14): el nombre del comando sin «taskctl» delante (lo pone
+  // el mensaje) y --push / -p con el mismo lector que el resto de comandos.
+  rechazarFlagsDesconocidos(argv, ['--push', '-p'], 'verificar-lote', (m) => new VerificarLoteCommandError(m));
+  const { push } = extraerPushFlag(argv);
   const cwd = deps.repoCwd;
   const config = resolverConfig(cwd);
   const comando = config.comando_verificacion;
@@ -175,6 +177,7 @@ export async function runVerificarLoteCommand(
     await writeFile(t.filePath, serializeTareaFile(t.task, body), 'utf8');
   }
   const commitResult = autoCommit({
+    fase: 'verificar-lote',
     cwd,
     rutas: pendientes.map((t) => t.filePath),
     mensaje: `chore(lote): verificacion completa en verde para ${ids.join(', ')}`,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
index 0121ad5..4ff3d6c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
@@ -22,7 +22,7 @@
 import { existsSync } from 'node:fs';
 import { readFile, writeFile } from 'node:fs/promises';
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { commitRevisadoDeRonda, informeRellenado, veredictoDeRonda } from '../core/informe-revision.js';
 import {
@@ -136,24 +136,12 @@ export function estadoCorreccionPosterior(
   return { cambiados, verificacion, alDia };
 }
 
-/** Saca `--motivo <texto>` de argv. */
+/** Saca `--motivo <texto>` (o `--motivo=<texto>`) de argv (TASK-144b: `extraerUnico`). */
 function extraerMotivo(argv: readonly string[]): { motivo: string | null; resto: string[] } {
-  const resto: string[] = [];
-  let motivo: string | null = null;
-  for (let i = 0; i < argv.length; i++) {
-    const arg = argv[i] as string;
-    if (arg === '--motivo') {
-      const valor = argv[i + 1];
-      if (valor === undefined || valor.startsWith('--') || valor.trim() === '') {
-        throw new VerificarMenoresCommandError('[ERROR] --motivo necesita un texto: --motivo "<por que no se corrigen>"');
-      }
-      motivo = valor.trim();
-      i++;
-      continue;
-    }
-    resto.push(arg);
-  }
-  return { motivo, resto };
+  const { valor, resto } = extraerUnico(argv, '--motivo', () =>
+    new VerificarMenoresCommandError('[ERROR] --motivo necesita un texto: --motivo "<por que no se corrigen>"')
+  );
+  return { motivo: valor === null ? null : valor.trim(), resto };
 }
 
 export async function runVerificarMenoresCommand(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 4081c47..7a16485 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -1189,6 +1189,9 @@ export const FASES_SINCRONIZACION = [
   'registrar-coste',
   'codex-review',
   'doctor-deploy',
+  // TASK-144b (CMD2-14): el commit del lote tambien es una fase, y con
+  // fases_sincronizacion declarado solo sincroniza si esta en la lista.
+  'verificar-lote',
 ] as const;
 export type FaseSincronizacion = (typeof FASES_SINCRONIZACION)[number];
````

## Excluido del diff (19 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-144b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144b/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144b/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144b/tarea.md                                                       |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js                                             | 35 +++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                     | 23 +++++------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                                      | 29 ++++++++---------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy.js                               | 21 ++++-----------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-opciones.js                             | 37 +++++++------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                                         | 53 +++++++++++++++++------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js                                   | 22 ++++------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-lote.js                              |  9 ++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-menores.js                           | 22 ++++------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                          |  3 +++
 19 files changed, 98 insertions(+), 164 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-paridad.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-paridad.test.ts | 61 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 61 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 107.9 s
- Commit verificado: 3db54b20e2a38d8a4f161feabad4642b27126980
- Huella: 0a97625e435ff186e3846ce77ff17132d0fbd1c6
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 78993 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3677ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.6949ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.6164ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.1428ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.8326ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.9083ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (6.2803ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.7089ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.264ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.7873ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (0.9933ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.6413ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1677.376ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1366.6609ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.7347ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.0584ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8048ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.5643ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.5005ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9252ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.8173ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.9298ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.5268ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.8167ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.3767ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.4247ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (36.0381ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.0229ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (1.6071ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.535ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3394ms)
ℹ tests 782
ℹ suites 0
ℹ pass 781
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 97434.1901
[verificar-impacto] node --test termino con 0 en 97.5 s.
````
