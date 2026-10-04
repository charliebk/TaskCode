# Peticion de revision — TASK-043 (ronda 1)

- Tarea: TASK-043 — F4-T2 Validacion antes de plan y puertas de cierre
- Rama revisada: feature/task-043-f4-t2-validacion-antes-de-plan-y-puertas
- Rama base: develop
- Commit revisado (HEAD): 6d27bc41238fd11a1db4cca42c46f69dd8290819
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-043 (criterios de aceptacion y plan)

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
6d27bc4 docs(TASK-043): resultado y calibracion
adf7145 feat(TASK-043): validacion del enunciado antes de plan y puertas en approve y finish
ed2981c chore(TASK-043): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 0ecb15a..5907e78 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -70,9 +70,9 @@ Precondiciones de cada transicion:
   brainstorm que resuelva la complejidad de la tarea, mas la del agente
   unificador (ver "El brainstorm de la fase de diseno"). **No invoca a ningun
   modelo**: lanzar a esos agentes es trabajo de quien orquesta. Aborta sin
-  mover la tarea si el `## Objetivo` de `tarea.md` esta vacio y la tarea lanza
-  algun rol.
-- **`approve`** — desde `en-diseno`, y tiene que existir el `plan-final.md`.
+  mover la tarea si el enunciado no esta listo (ver mas abajo).
+- **`approve`** — desde `en-diseno`, y tiene que existir un `plan-final.md`
+  redactado: la plantilla sin rellenar se rechaza.
   Es el **checkpoint humano**: lo ejecuta la persona, no el agente.
 - **`start`** — desde `en-diseno` con `plan_aprobado: true`. No hay atajo por
   complejidad: **el checkpoint humano es obligatorio para todas las
@@ -120,9 +120,8 @@ Detalles que muerden:
 - **En `approve`, `review` y `finish` el ID tiene que ser el primer
   argumento.** Esos comandos leen el primer argumento tal cual, asi que
   `taskctl approve --loquesea TASK-001` intentaria usar `--loquesea` como ID.
-- **Los flags desconocidos se ignoran en silencio** en el resto de comandos.
-  Un flag mal escrito no da error: simplemente no hace nada. Comprobar la
-  salida, no suponer.
+- **Los flags desconocidos se ignoran en silencio** en el resto de comandos:
+  comprobar la salida, no suponer.
 - `board` solo escribe `docs/BOARD.md` si se le pasa `--escribir`, y ese
   flag **no se combina** con `--sprint` ni `--asignado-a`: el fichero es la
   foto completa, no una vista filtrada.
@@ -361,11 +360,13 @@ unificador, que es quien escribe `plan-final.md`. Los desacuerdos entre roles
 se senalan en el plan, no se promedian: dos roles que dicen lo contrario son
 informacion, y la media la tira.
 
-**El `## Objetivo` de `tarea.md` no puede estar vacio.** Si lo esta y la tarea
-lanza al menos un rol, `plan` aborta y la tarea no se mueve. `new` deja esa
-seccion en blanco a proposito, asi que hay que redactarla **antes** del primer
-`plan`. Sin objetivo cada rol se inventa el suyo, y el unificador consolida
-esas invenciones en un plan que parece fundado sin serlo.
+**`plan` valida el enunciado antes de mover nada** (con o sin roles). Bloquea:
+`## Objetivo` vacio, ningun criterio, un criterio vacio, **mas de 12
+criterios** (partela) o un criterio hecho solo de palabras vagas («que sea
+robusto»). Avisa con 9 a 12 criterios y con criterios sin nada comprobable
+(comando, ruta, numero, codigo o test). Al abortar estas en la rama base:
+edita `tarea.md`, commitea y reintenta. `finish` avisa antes del merge de
+los criterios sin marcar.
 
 **Una re-planificacion no relanza el brainstorm.** La segunda vuelta
 (`en-diseno` con `plan_aprobado: false`) escribe solo otra
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 4110e54..1a11185 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -433,7 +433,7 @@ async function mainComando(argv: readonly string[]): Promise<number> {
     try {
       const result = await runPlanCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
       printBaseBranchSwitchNotice(result.baseBranchGuard);
-      printAvisos(result.avisoIdentidad);
+      printAvisos(result.avisoIdentidad, ...result.avisosEnunciado);
       // Tres desenlaces posibles desde TASK-027 (item C3): scaffold
       // nuevo, plan que ya estaba en planificacion/, o plan legado
       // suelto en la raiz que esta invocacion acaba de mover ahi.
@@ -635,6 +635,7 @@ async function mainComando(argv: readonly string[]): Promise<number> {
       const result = await runFinishCommand(tareasRoot, argv.slice(1), today(), {
         repoCwd,
         scriptsDir: resolveGitflowScriptsDir(),
+        onAviso: (aviso) => printAvisos(aviso),
       });
       const mainInfo = result.mainBranch === null ? '' : ` y en "${result.mainBranch}" (con tag)`;
       process.stdout.write(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 636dbae..1c412d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -21,7 +21,10 @@ import path from 'node:path';
 import type { Task } from '../core/task.js';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
-import { resolverPlanFinal, type PlanFinalUbicacion } from './plan.js';
+import { planTemplate, resolverPlanFinal, type PlanFinalUbicacion } from './plan.js';
+import { readFile } from 'node:fs/promises';
+import { ROLES_BRAINSTORM, seleccionarRoles } from '../core/roles-brainstorm.js';
+import { planEsEsqueleto } from '../core/validacion-tarea.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
 import {
   autoCommit,
@@ -130,6 +133,21 @@ export async function runApproveCommand(
   assertPlanNoAmbiguo(id, ubicacion!);
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
 
+  // TASK-043 (C6 de la auditoria): no se aprueba un plan-final.md que es
+  // la plantilla sin rellenar. Se compara con las plantillas posibles (los
+  // roles se eligen en un orden fijo, asi que solo hay 0..N prefijos), no
+  // con textos copiados, para que siga valiendo si la plantilla cambia.
+  const rutaPlan = ubicacion!.canonicaExiste ? ubicacion!.canonica : ubicacion!.legada;
+  const plantillas = Array.from({ length: ROLES_BRAINSTORM.length + 1 }, (_, k) =>
+    planTemplate(task, seleccionarRoles(k))
+  );
+  if (planEsEsqueleto(await readFile(rutaPlan, 'utf8'), plantillas)) {
+    throw new ApproveCommandError(
+      `[ERROR] ${task.id}: "${rutaPlan}" es la plantilla sin rellenar: no hay plan que aprobar. ` +
+        'Redactalo (enfoque, riesgos, pruebas) y reintenta "taskctl approve".'
+    );
+  }
+
   const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 3597654..a3c87cb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -25,6 +25,7 @@ import { TaskValidationError } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
 import { veredictoAprobado } from '../core/informe-revision.js';
+import { casillasSinMarcar } from '../core/validacion-tarea.js';
 import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
   isWorkspaceClean,
@@ -240,6 +241,12 @@ export interface FinishCommandDeps {
   repoCwd: string;
   /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
   scriptsDir: string;
+  /**
+   * TASK-043: recibe los avisos que deben verse ANTES del merge (criterios
+   * sin marcar). Es un callback y no un campo del resultado porque el
+   * resultado llega despues del merge, cuando ya no hay vuelta atras.
+   */
+  onAviso?: (aviso: string) => void;
 }
 
 export interface FinishCommandResult {
@@ -286,6 +293,17 @@ export async function runFinishCommand(
   }
   const ctxInicial = await buildTransitionContext(path.dirname(initial.filePath));
   assertTransitionAllowed('finish', initial.task, ctxInicial);
+  // TASK-043 (D5 de la auditoria): avisar, sin bloquear, de criterios sin
+  // marcar antes de mergear. No bloquea: hay criterios que se cumplen y no
+  // se marcan, y el veredicto del revisor ya es la puerta dura.
+  const sinMarcar = casillasSinMarcar(initial.body);
+  if (sinMarcar.length > 0) {
+    deps.onAviso?.(
+      `${id}: ${String(sinMarcar.length)} criterio(s) de aceptacion sin marcar en tarea.md: ` +
+        `${sinMarcar.map((c) => `«${c}»`).join('; ')}. Si estan cumplidos, marcalos; si no, ` +
+        'la tarea se cierra igualmente (el veredicto del revisor es la puerta).'
+    );
+  }
   const tipo = initial.task.tipo;
   const rama = initial.task.rama;
   const titulo = initial.task.titulo;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 1c0845e..fe57584 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -42,6 +42,7 @@ import {
 } from '../fs/git-commit.js';
 import { resolverAsignado } from '../core/wip.js';
 import { extraerSecciones } from '../core/tarea-body.js';
+import { validarEnunciado } from '../core/validacion-tarea.js';
 import {
   cargarHeuristica,
   resolverNumeroAgentes,
@@ -247,6 +248,8 @@ export function planTemplate(task: Task, roles: readonly RolBrainstorm[]): strin
 }
 
 export interface PlanCommandResult {
+  /** TASK-043: avisos de la validacion del enunciado (no bloquean). */
+  avisosEnunciado: string[];
   id: string;
   filePath: string;
   planPath: string;
@@ -426,6 +429,7 @@ export async function runPlanCommand(
   const seleccionSkill = seleccionarSkill(task, catalogoSkills);
 
   const secciones = extraerSecciones(body);
+  const avisosEnunciado: string[] = [];
 
   // Puerta del objetivo vacio. "taskctl new" deja el Objetivo en blanco
   // a proposito, y mientras "plan" solo escribia un scaffold eso era
@@ -442,14 +446,22 @@ export async function runPlanCommand(
   // la propia TASK-016, cuyo Objetivo estaba vacio — y de paso hundio
   // su puntuacion heuristica, porque las palabras de riesgo son la
   // unica senal del YML que mira el contenido del trabajo.
-  if (roles.length > 0 && secciones.objetivo === '') {
+  //
+  // TASK-043: la puerta pasa a ser la validacion entera del enunciado
+  // (objetivo, numero de criterios, criterios vacios o solo vagos), y se
+  // aplica TAMBIEN con 0 roles: una tarea mal definida es igual de cara
+  // de revisar aunque no lance brainstorm. Se valida la lectura FRESCA
+  // (la de la rama base, donde la persona ya esta y donde hay que editar).
+  const validacion = validarEnunciado(secciones);
+  if (validacion.bloqueos.length > 0) {
     throw new PlanCommandError(
-      `[ERROR] ${task.id}: el "## Objetivo" de tarea.md esta vacio, y esta tarea lanza ` +
-        `${roles.length} agente(s) de brainstorm. Sin objetivo cada rol se inventaria el suyo y ` +
-        'el plan resultante pareceria fundado sin serlo. Escribe el objetivo en ' +
-        `"${filePath}" y reintenta. La tarea no se ha movido.`
+      `[ERROR] ${task.id}: la tarea no esta lista para planificar:\n` +
+        validacion.bloqueos.map((b) => `        - ${b}\n`).join('') +
+        `        Estas en la rama base: edita "${filePath}", commitea el cambio y reintenta ` +
+        '"taskctl plan". La tarea no se ha movido.'
     );
   }
+  avisosEnunciado.push(...validacion.avisos);
 
   // El plan se escribe/migra en la carpeta ACTUAL, ANTES de mover la
   // tarea de estado — mismo orden y mismo motivo que "review" con
@@ -942,6 +954,7 @@ export async function runPlanCommand(
   }
 
   return {
+    avisosEnunciado,
     autoCommit: commitResult,
     id: task.id,
     filePath: newFilePath,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
new file mode 100644
index 0000000..f9d701b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
@@ -0,0 +1,168 @@
+/**
+ * Validacion determinista del enunciado de una tarea — TASK-043
+ * (auditoria del 2026-10-03, C2, C6 y D5). Modulo puro: recibe texto o
+ * secciones ya extraidas y devuelve motivos; nunca lanza.
+ *
+ * Lo que bloquea y lo que solo avisa salio de calibrar contra las tareas
+ * cerradas del propio repo (rol de riesgos del brainstorm): la regla
+ * estricta «cada criterio cita algo comprobable» habria rechazado criterios
+ * de 13 de 27 tareas que no eran vagos sino de comportamiento («sin nada
+ * que commitear no se crea commit vacio»). Por eso:
+ * - BLOQUEA lo que de verdad deja la tarea sin definir: objetivo vacio, sin
+ *   criterios, un criterio vacio, mas de 12 criterios (las tres tareas con
+ *   13 o mas fueron las de peticiones de revision de 110-160 KB), o un
+ *   criterio hecho solo de palabras vagas sin nada comprobable.
+ * - AVISA de lo que conviene mirar: 9 a 12 criterios y criterios sin ancla.
+ */
+import type { SeccionesTarea } from './tarea-body.js';
+
+export const MAX_CRITERIOS = 12;
+export const AVISO_CRITERIOS = 8;
+
+export interface ResultadoValidacion {
+  bloqueos: string[];
+  avisos: string[];
+}
+
+/**
+ * Palabras que, solas, no dicen como comprobar nada. Lista construida a
+ * mano: en los criterios reales del repo no aparece ninguna (la
+ * calibracion no tiene casos con los que validarla).
+ */
+const PALABRAS_VAGAS = [
+  'mejorar', 'mejora', 'robusto', 'robusta', 'correctamente', 'adecuado', 'adecuadamente',
+  'bien', 'optimizar', 'optimizado', 'limpio', 'limpiar', 'eficiente', 'rapido', 'facil',
+  'mantenible', 'escalable', 'calidad', 'correcto', 'funciona',
+];
+
+/** Palabras vacias que no cuentan al decidir si un criterio es «solo vago». */
+const PALABRAS_VACIAS = new Set([
+  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'que', 'y', 'o', 'en', 'se', 'es', 'mas',
+  'muy', 'con', 'para', 'por', 'su', 'sus', 'lo', 'al', 'debe', 'deberia', 'ser', 'esta', 'este',
+  'sea', 'sean', 'quede', 'queden', 'resulte',
+  'codigo', 'sistema', 'todo', 'toda',
+]);
+
+/** Comandos que cuentan como ancla aunque vayan sin comillas invertidas. */
+const COMANDOS = ['taskctl', 'git', 'npm', 'pnpm', 'node', 'bash', 'npx'];
+
+function normalizar(s: string): string {
+  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
+}
+
+/**
+ * true si el criterio cita algo comprobable: codigo entre comillas
+ * invertidas, una ruta (`/` o una extension), un flag `--x`, un comando,
+ * un numero que no sea parte de un ID o seccion, o una mencion a tests.
+ */
+export function tieneAncla(criterio: string): boolean {
+  if (/`[^`]+`/.test(criterio)) return true;
+  if (/(^|\s)--[a-z]/i.test(criterio)) return true;
+  if (/[\w.-]+\/[\w./-]+/.test(criterio) || /\b[\w-]+\.(ts|js|mjs|md|sh|json|yml|yaml|java|cs|vue|py)\b/i.test(criterio)) {
+    return true;
+  }
+  const n = normalizar(criterio);
+  if (/\b(test|tests|prueba|pruebas|suite|mutante|mutantes)\b/.test(n)) return true;
+  if (COMANDOS.some((c) => new RegExp(`\\b${c}\\b`).test(n))) return true;
+  // Numeros, pero no los de un ID, una seccion o una sigla con digito
+  // (TASK-018, §8.3, AC1, C6, «seccion 14»), que pasan el lint sin
+  // decir nada medible.
+  const sinIds = n
+    .replace(/\btask-\d+\b/g, ' ')
+    .replace(/§\s*[\d.]+/g, ' ')
+    .replace(/\bseccion\s+[\d.]+/g, ' ')
+    .replace(/\b[a-z]{1,3}\d+\b/g, ' ');
+  return /\d/.test(sinIds);
+}
+
+/** true si, quitando palabras vacias, todo lo que queda son palabras vagas. */
+export function esSoloVago(criterio: string): boolean {
+  const palabras = normalizar(criterio)
+    .split(/[^a-z0-9]+/)
+    .filter((p) => p !== '' && !PALABRAS_VACIAS.has(p));
+  if (palabras.length === 0) return false;
+  return palabras.every((p) => PALABRAS_VAGAS.includes(p));
+}
+
+/** Bloqueos y avisos del enunciado (Objetivo y criterios de aceptacion). */
+export function validarEnunciado(s: SeccionesTarea): ResultadoValidacion {
+  const bloqueos: string[] = [];
+  const avisos: string[] = [];
+  if (s.objetivo.trim() === '') {
+    bloqueos.push('el "## Objetivo" esta vacio');
+  }
+  const criterios = s.criterios;
+  if (criterios.length === 0) {
+    bloqueos.push('no hay ningun criterio de aceptacion');
+  }
+  criterios.forEach((c, i) => {
+    if (c.trim() === '') bloqueos.push(`el criterio ${String(i + 1)} esta vacio`);
+  });
+  if (criterios.length > MAX_CRITERIOS) {
+    bloqueos.push(
+      `tiene ${String(criterios.length)} criterios (mas de ${String(MAX_CRITERIOS)}): es demasiado ` +
+        'grande para una tarea; partela en varias'
+    );
+  } else if (criterios.length > AVISO_CRITERIOS) {
+    avisos.push(
+      `tiene ${String(criterios.length)} criterios: por encima de ${String(AVISO_CRITERIOS)}, ` +
+        'las revisiones se alargan; valora partirla'
+    );
+  }
+  const vagos = criterios.filter((c) => c.trim() !== '' && esSoloVago(c) && !tieneAncla(c));
+  for (const c of vagos) {
+    bloqueos.push(`el criterio «${c}» solo dice palabras vagas: di como se comprueba`);
+  }
+  const sinAncla = criterios.filter((c) => c.trim() !== '' && !tieneAncla(c) && !vagos.includes(c));
+  if (sinAncla.length > 0) {
+    avisos.push(
+      `${String(sinAncla.length)} criterio(s) no citan nada comprobable (un comando, una ruta, ` +
+        `un numero, codigo o un test): ${sinAncla.map((c) => `«${c}»`).join('; ')}`
+    );
+  }
+  return { bloqueos, avisos };
+}
+
+/**
+ * true si un plan-final.md no tiene contenido propio: quitando las
+ * cabeceras y las lineas que ya trae la plantilla, no queda nada. Se
+ * compara contra las plantillas dadas (las de 0, 1 y N roles), no contra
+ * textos copiados aqui, para que siga valiendo si la plantilla cambia.
+ */
+export function planEsEsqueleto(contenido: string, plantillas: readonly string[]): boolean {
+  const lineasDe = (t: string): string[] =>
+    t
+      .replace(/\r/g, '')
+      .split('\n')
+      .map((l) => l.trim())
+      .filter((l) => l !== '');
+  const dePlantilla = new Set(plantillas.flatMap(lineasDe));
+  const propias = lineasDe(contenido).filter((l) => !/^#{1,6}\s/.test(l) && !dePlantilla.has(l));
+  return propias.length === 0;
+}
+
+/** Criterios normales sin marcar (las casillas de `### Tras el cierre` no cuentan). */
+export function casillasSinMarcar(body: string): string[] {
+  const lineas = body.replace(/\r/g, '').split('\n');
+  const pendientes: string[] = [];
+  let enCriterios = false;
+  let enTrasCierre = false;
+  for (const l of lineas) {
+    const cab = /^ {0,3}(#{2,6})\s+(.*?)\s*#*\s*$/.exec(l);
+    if (cab !== null) {
+      const nivel = (cab[1] as string).length;
+      const titulo = normalizar(cab[2] as string);
+      if (nivel === 2) {
+        enCriterios = titulo === 'criterios de aceptacion';
+        enTrasCierre = false;
+      } else if (enCriterios) {
+        enTrasCierre = titulo === 'tras el cierre';
+      }
+      continue;
+    }
+    if (!enCriterios || enTrasCierre) continue;
+    const m = /^\s*[-*]\s+\[ \]\s*(.*)$/.exec(l);
+    if (m !== null) pendientes.push((m[1] ?? '').trim());
+  }
+  return pendientes;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index c608f38..1ac74b7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -130,15 +130,24 @@ test('main: la ayuda documenta --asignado-a en plan y en start', async () => {
  * que esto es exactamente lo que hace una persona entre "new" y
  * "plan": es parte del flujo real, no un apano del test.
  */
+/**
+ * Escribe un plan-final.md con contenido propio: desde TASK-043 approve
+ * rechaza la plantilla que deja plan, igual que la rechazaria en uso real.
+ */
+async function redactarPlan(repoRoot: string, id: string): Promise<void> {
+  const md = path.join(repoRoot, 'tareas', '01-en-diseno', id, 'planificacion', 'plan-final.md');
+  await writeFile(md, '# Plan\n\nEnfoque: el minimo para probar el CLI.\n', 'utf8');
+}
+
 async function rellenarObjetivo(repoRoot: string, id: string): Promise<void> {
   const md = path.join(repoRoot, 'tareas', '00-planificadas', id, 'tarea.md');
   const contenido = await readFile(md, 'utf8');
   await writeFile(
     md,
-    contenido.replace(
-      '## Objetivo\n\n\n',
-      '## Objetivo\n\nProbar el ciclo con una tarea que dice a que viene.\n\n'
-    ),
+    // TASK-043: plan exige ademas criterios no vacios.
+    contenido
+      .replace('## Objetivo\n\n\n', '## Objetivo\n\nProbar el ciclo con una tarea que dice a que viene.\n\n')
+      .replace('- [ ] \n', '- [ ] `taskctl plan` mueve la tarea.\n'),
     'utf8'
   );
 }
@@ -252,6 +261,9 @@ test('main: taskctl start sale con codigo 1 y mensaje util cuando el limite esta
     // obligatorio tambien para `simple`, y sin el las dos fallarian
     // aqui — con lo que el test verde no probaria el limite de WIP,
     // que es lo unico que viene a medir.
+    await redactarPlan(repoRoot, 'TASK-001');
+    await redactarPlan(repoRoot, 'TASK-002');
+    commitAll(repoRoot, 'planes redactados');
     const a1 = await captureOutput(() => main(['approve', 'TASK-001']));
     assert.equal(a1.code, 0, a1.stderr);
     commitAll(repoRoot, 'primera aprobada');
@@ -288,6 +300,8 @@ test('main: "taskctl review" con un diff de 2 dominios imprime una linea de peti
     const plan = await captureOutput(() => main(['plan', 'TASK-001']));
     assert.equal(plan.code, 0, plan.stderr);
     commitAll(repoRoot, 'en diseno');
+    await redactarPlan(repoRoot, 'TASK-001');
+    commitAll(repoRoot, 'plan redactado');
 
     const approve = await captureOutput(() => main(['approve', 'TASK-001']));
     assert.equal(approve.code, 0, approve.stderr);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
index 6225cb5..e34f5e2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
@@ -87,7 +87,7 @@ async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promis
 }
 
 /** Plan en la ubicacion canonica desde TASK-027: planificacion/plan-final.md. */
-async function writePlanFinal(tareasRoot: string, id: string, content = '# Plan real\n'): Promise<void> {
+async function writePlanFinal(tareasRoot: string, id: string, content = '# Plan real\n\nEnfoque: probar approve.\n'): Promise<void> {
   const dir = path.join(tareasRoot, '01-en-diseno', id, PLANIFICACION_DIRNAME);
   await mkdir(dir, { recursive: true });
   await writeFile(path.join(dir, PLAN_FINAL_FILENAME), content, 'utf8');
@@ -101,7 +101,7 @@ async function writePlanFinal(tareasRoot: string, id: string, content = '# Plan
 async function writePlanFinalLegado(
   tareasRoot: string,
   id: string,
-  content = '# Plan real legado\n'
+  content = '# Plan real legado\n\nEnfoque legado.\n'
 ): Promise<void> {
   await writeFile(path.join(tareasRoot, '01-en-diseno', id, PLAN_FINAL_FILENAME), content, 'utf8');
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
index c9a9008..38bf96d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
@@ -130,9 +130,13 @@ function assertNoSeLlevaTrabajoAjeno(repoRoot: string): void {
 
 // ─── plan / approve ────────────────────────────────────────────────────────
 
+/** TASK-043: plan exige objetivo y al menos un criterio. */
+const CUERPO_PLANIFICABLE =
+  '## Objetivo\nProbar.\n\n## Criterios de aceptacion\n- [ ] `taskctl plan` commitea el movimiento.\n';
+
 test('taskctl plan: commitea el movimiento a 01-en-diseno y el scaffold del plan, y deja tareas/ limpio', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar.\n');
+    await writeTareaFile(tareasRoot, sampleTask(), CUERPO_PLANIFICABLE);
     commitAll(repoRoot, 'chore(TASK-910): tarea creada');
 
     const r = await runPlanCommand(tareasRoot, ['TASK-910'], '2026-09-07', { repoCwd: repoRoot });
@@ -166,7 +170,7 @@ test('taskctl approve: commitea el tarea.md aprobado con el mensaje del repo', a
     });
     await writeFile(
       path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion', 'plan-final.md'),
-      '# Plan redactado\n',
+      '# Plan redactado\n\nEnfoque: probar el commit de approve.\n',
       'utf8'
     );
     commitAll(repoRoot, 'docs(TASK-910): plan final');
@@ -190,7 +194,7 @@ test('taskctl approve dos veces seguidas: la segunda no crea un commit vacio', a
     });
     await writeFile(
       path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion', 'plan-final.md'),
-      '# Plan\n',
+      '# Plan\n\nEnfoque: aprobar dos veces.\n',
       'utf8'
     );
     commitAll(repoRoot, 'docs(TASK-910): plan final');
@@ -357,7 +361,7 @@ test('taskctl plan --push: con un origin bare real la rama llega; el flag va del
       git(['remote', 'add', 'origin', bare], repoRoot);
       git(['push', '-q', 'origin', 'develop'], repoRoot);
 
-      await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nX.\n');
+      await writeTareaFile(tareasRoot, sampleTask(), CUERPO_PLANIFICABLE);
       commitAll(repoRoot, 'chore(TASK-910): tarea creada');
 
       // --push DELANTE del ID: parseArgs se lo habria comido como valor
@@ -382,7 +386,7 @@ test('taskctl plan --push sin remoto: avisa, no lanza y sale con la tarea commit
   await withTempRepo(async (repoRoot, tareasRoot) => {
     // Con el cuerpo vacio "plan" aborta desde TASK-016 (puerta del
     // objetivo), y este test mide el --push, no esa puerta.
-    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar el push.\n');
+    await writeTareaFile(tareasRoot, sampleTask(), CUERPO_PLANIFICABLE);
     commitAll(repoRoot, 'chore(TASK-910): tarea creada');
 
     const r = await runPlanCommand(tareasRoot, ['TASK-910', '--push'], '2026-09-07', {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index a5af91a..32fabd3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -72,7 +72,10 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
  * objetivo con "migracion" dentro haria que estos tests midieran otra
  * cosa sin avisar.
  */
-const BODY = '## Objetivo\n\nProbar que el brainstorm se escribe entero.\n';
+const BODY =
+  '## Objetivo\n\nProbar que el brainstorm se escribe entero.\n\n' +
+  // TASK-043: plan exige al menos un criterio.
+  '## Criterios de aceptacion\n- [ ] `taskctl plan` escribe las peticiones de rol.\n';
 
 function git(args: string[], cwd: string): void {
   const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
@@ -470,8 +473,9 @@ test('plan: objetivo vacio con roles que lanzar aborta y NO mueve la tarea', asy
       (e: unknown) => {
         assert.ok(e instanceof PlanCommandError);
         assert.match(e.message, /Objetivo/);
-        // Convencion del proyecto: el error dice QUE HACER.
-        assert.match(e.message, /Escribe el objetivo en/);
+        // Convencion del proyecto: el error dice QUE HACER (TASK-043: y
+        // donde: en la rama base, editando y commiteando).
+        assert.match(e.message, /Estas en la rama base: edita .*commitea el cambio y reintenta/s);
         return true;
       }
     );
@@ -487,19 +491,27 @@ test('plan: objetivo vacio con roles que lanzar aborta y NO mueve la tarea', asy
 });
 
 /**
- * El simetrico, y no sobra: sin el, una puerta que abortara SIEMPRE
- * dejaria el test de arriba en verde. Ademas fija que el
- * comportamiento con 0 roles es identico al de antes de TASK-016, que
- * es lo que hace el cambio no-breaking.
+ * TASK-043 cambia el contrato de TASK-016: la puerta se aplica TAMBIEN
+ * con 0 roles (una tarea sin objetivo es igual de cara de revisar aunque
+ * no lance brainstorm). El simetrico sigue haciendo falta para que una
+ * puerta que abortara SIEMPRE no deje en verde el test de arriba: una
+ * tarea bien definida con 0 roles planifica.
  *
- * Mutacion que lo pone rojo: aplicar la puerta tambien cuando no hay
- * roles.
+ * Mutacion que lo pone rojo: volver a condicionar la puerta a roles > 0.
  */
-test('plan: objetivo vacio SIN roles que lanzar no aborta (comportamiento de antes de TASK-016)', async () => {
+test('plan (TASK-043): objetivo vacio SIN roles TAMBIEN aborta; bien definida, planifica', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'trivial' }), '## Objetivo\n\n');
     commitAll(repoRoot, 'tarea TASK-800');
 
+    await assert.rejects(
+      () => runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot }),
+      (e: unknown) => e instanceof PlanCommandError && /Objetivo/.test(e.message)
+    );
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-800'))?.task.estado, 'planificada');
+
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'trivial' }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800 con objetivo');
     const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
       repoCwd: repoRoot,
     });
@@ -1302,7 +1314,7 @@ test('las plantillas generadas no filtran nada del repo que las escribe', async
       // Titulo y objetivo neutros: si la tarea del usuario menciona algo,
       // eso viene de ella, no de la plantilla, y contaminaria la medida.
       sampleTask({ complejidad: 'critica', titulo: 'Una tarea cualquiera' }),
-      '## Objetivo\n\nUn objetivo cualquiera.\n'
+      '## Objetivo\n\nUn objetivo cualquiera.\n\n## Criterios de aceptacion\n- [ ] Un criterio cualquiera.\n'
     );
     commitAll(repoRoot, 'tarea TASK-800');
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 884f7f8..3f4a157 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -64,7 +64,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
  * mide, y no la precondicion.
  */
 const BODY_CON_OBJETIVO =
-  '## Objetivo\n\nProbar el comando con una tarea que si dice a que viene.\n';
+  '## Objetivo\n\nProbar el comando con una tarea que si dice a que viene.\n\n' +
+  // TASK-043: plan exige al menos un criterio.
+  '## Criterios de aceptacion\n- [ ] `taskctl plan` mueve la tarea a 01-en-diseno.\n';
 
 function git(args: string[], cwd: string): void {
   const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
index 45e8825..183a0f5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
@@ -125,7 +125,8 @@ async function withRepoSincronizado(
     await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar la sincronizacion.\n');
     const planDir = path.join(tareasRoot, '01-en-diseno', 'TASK-920', 'planificacion');
     await mkdir(planDir, { recursive: true });
-    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n', 'utf8');
+    // TASK-043: approve rechaza un plan que es solo una cabecera.
+    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n\nEnfoque: sincronizar.\n', 'utf8');
     await mkdir(path.join(repoRoot, 'scripts'), { recursive: true });
     await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), SCRIPT_SYNC, 'utf8');
     if (config !== null) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
new file mode 100644
index 0000000..21e8527
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
@@ -0,0 +1,231 @@
+/**
+ * TASK-043: las tres puertas de la validacion del enunciado, contra repos
+ * Git temporales reales y los scripts de Git-Flow tal cual:
+ * - plan rechaza una tarea mal definida SIN moverla, y devuelve los avisos;
+ * - approve rechaza el plan-final.md que es la plantilla sin rellenar;
+ * - finish avisa de criterios sin marcar ANTES de mergear, sin bloquear.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import {
+  runPlanCommand,
+  PlanCommandError,
+  PLAN_FINAL_FILENAME,
+  PLANIFICACION_DIRNAME,
+} from '../../src/commands/plan.js';
+import { runApproveCommand, ApproveCommandError } from '../../src/commands/approve.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-430',
+    titulo: 'Tarea de prueba de las puertas',
+    tipo: 'feature',
+    sprint: 4,
+    etiquetas: ['cli'],
+    complejidad: 'media',
+    modelo_sugerido: 'sonnet',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-430-prueba-puertas',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-10-04',
+    actualizado: '2026-10-04',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-puertas-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+const criterios = (k: number): string =>
+  Array.from({ length: k }, (_, i) => `- [ ] \`taskctl\` caso ${String(i + 1)}\n`).join('');
+
+// ─── plan ──────────────────────────────────────────────────────────────
+
+/** Mutacion que lo pone rojo: subir MAX_CRITERIOS o quitar la puerta de plan. */
+test('plan (TASK-043): 13 criterios bloquea, lista el motivo y la tarea NO se mueve ni se ensucia nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask(),
+      `## Objetivo\n\nAlgo concreto.\n\n## Criterios de aceptacion\n${criterios(13)}`
+    );
+    commitAll(repoRoot, 'tarea TASK-430');
+    const head = git(['rev-parse', 'HEAD'], repoRoot);
+
+    await assert.rejects(
+      () => runPlanCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot }),
+      (e: unknown) => {
+        assert.ok(e instanceof PlanCommandError);
+        assert.match(e.message, /no esta lista para planificar/);
+        assert.match(e.message, /- tiene 13 criterios/);
+        assert.match(e.message, /La tarea no se ha movido/);
+        return true;
+      }
+    );
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-430'))?.task.estado, 'planificada');
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head, 'sin commits nuevos');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+/** Mutacion que lo pone rojo: no devolver avisosEnunciado (o convertirlos en bloqueo). */
+test('plan (TASK-043): 9 criterios planifica y devuelve el aviso, sin bloquear', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask(),
+      `## Objetivo\n\nAlgo concreto.\n\n## Criterios de aceptacion\n${criterios(9)}`
+    );
+    commitAll(repoRoot, 'tarea TASK-430');
+
+    const r = await runPlanCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot });
+
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-430'))?.task.estado, 'en-diseno');
+    assert.equal(r.avisosEnunciado.length, 1);
+    assert.match(r.avisosEnunciado[0] as string, /tiene 9 criterios/);
+  });
+});
+
+// ─── approve ───────────────────────────────────────────────────────────
+
+/**
+ * Se usa el plan-final.md que escribe el PROPIO plan, no una copia: si la
+ * plantilla cambia, el test sigue midiendo lo que la persona veria.
+ * Mutacion que lo pone rojo: quitar la puerta de approve, o comparar con
+ * plantillas de un numero de roles distinto del real.
+ */
+test('approve (TASK-043): rechaza el esqueleto que deja plan; con contenido propio aprueba', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask(),
+      `## Objetivo\n\nAlgo concreto.\n\n## Criterios de aceptacion\n${criterios(2)}`
+    );
+    commitAll(repoRoot, 'tarea TASK-430');
+    const plan = await runPlanCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot });
+    assert.ok(plan.roles.length > 0, 'la prueba necesita una plantilla con roles');
+
+    await assert.rejects(
+      () => runApproveCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot }),
+      (e: unknown) => e instanceof ApproveCommandError && /plantilla sin rellenar/.test(e.message)
+    );
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-430'))?.task.plan_aprobado, false);
+
+    const rutaPlan = path.join(tareasRoot, '01-en-diseno', 'TASK-430', PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
+    await mkdir(path.dirname(rutaPlan), { recursive: true });
+    await writeFile(rutaPlan, '# Plan\n\n## Enfoque\n\nUn modulo puro y dos puertas.\n', 'utf8');
+    commitAll(repoRoot, 'docs(TASK-430): plan final');
+
+    await runApproveCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot });
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-430'))?.task.plan_aprobado, true);
+  });
+});
+
+// ─── finish ────────────────────────────────────────────────────────────
+
+async function setupEnRevision(repoRoot: string, tareasRoot: string, body: string): Promise<Task> {
+  const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
+  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+  await writeTareaFile(tareasRoot, task, body);
+  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo\n', 'utf8');
+  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+  await mkdir(revisionDir, { recursive: true });
+  await writeFile(
+    path.join(revisionDir, 'informe-revision-1.md'),
+    `# Informe de revision — ${task.id} (ronda 1)\n\n- Veredicto: aprobada\n`,
+    'utf8'
+  );
+  commitAll(repoRoot, 'feat(TASK-430): trabajo revisado');
+  return task;
+}
+
+/**
+ * Mutacion que lo pone rojo: mover el aviso despues de runGitflowScript
+ * (el callback veria la rama ya integrada), contar las casillas de
+ * "### Tras el cierre", o convertir el aviso en bloqueo.
+ */
+test('finish (TASK-043): avisa de los criterios sin marcar ANTES del merge, y cierra igualmente', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = await setupEnRevision(
+      repoRoot,
+      tareasRoot,
+      '## Objetivo\nX.\n\n## Criterios de aceptacion\n- [x] hecho\n- [ ] olvidado\n\n' +
+        '### Tras el cierre\n- [ ] CI en verde\n'
+    );
+    const avisos: { texto: string; integrada: boolean }[] = [];
+
+    const r = await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+      onAviso: (texto) => {
+        const integrada =
+          spawnSync('git', ['merge-base', '--is-ancestor', task.rama, 'develop'], { cwd: repoRoot }).status === 0;
+        avisos.push({ texto, integrada });
+      },
+    });
+
+    assert.equal(avisos.length, 1);
+    assert.equal(avisos[0]?.integrada, false, 'el aviso llega antes de mergear');
+    assert.match(avisos[0]?.texto ?? '', /1 criterio\(s\) de aceptacion sin marcar/);
+    assert.match(avisos[0]?.texto ?? '', /«olvidado»/);
+    assert.doesNotMatch(avisos[0]?.texto ?? '', /CI en verde/);
+    assert.match(r.filePath, /04-terminadas/);
+  });
+});
+
+test('finish (TASK-043): con todos los criterios marcados no hay aviso', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n\n## Criterios de aceptacion\n- [x] hecho\n');
+    const avisos: string[] = [];
+    await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+      onAviso: (a) => avisos.push(a),
+    });
+    assert.deepEqual(avisos, []);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts
new file mode 100644
index 0000000..076ad20
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts
@@ -0,0 +1,102 @@
+/**
+ * TASK-043: validacion determinista del enunciado (modulo puro).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  validarEnunciado,
+  tieneAncla,
+  esSoloVago,
+  planEsEsqueleto,
+  casillasSinMarcar,
+  MAX_CRITERIOS,
+  AVISO_CRITERIOS,
+} from '../../src/core/validacion-tarea.js';
+import type { SeccionesTarea } from '../../src/core/tarea-body.js';
+
+function secciones(objetivo: string, criterios: string[]): SeccionesTarea {
+  return { objetivo, criterios, criteriosTrasCierre: [] };
+}
+
+const n = (k: number): string[] => Array.from({ length: k }, (_, i) => `\`taskctl\` caso ${String(i + 1)}`);
+
+test('validarEnunciado: objetivo vacio y cero criterios bloquean, con un motivo cada uno', () => {
+  const r = validarEnunciado(secciones('  ', []));
+  assert.equal(r.bloqueos.length, 2);
+  assert.match(r.bloqueos[0] as string, /Objetivo/);
+  assert.match(r.bloqueos[1] as string, /ningun criterio/);
+});
+
+test('validarEnunciado: el limite es exactamente 12 (bloquea 13) y el aviso empieza en 9', () => {
+  assert.equal(MAX_CRITERIOS, 12);
+  assert.equal(AVISO_CRITERIOS, 8);
+  assert.deepEqual(validarEnunciado(secciones('X', n(8))), { bloqueos: [], avisos: [] });
+  const nueve = validarEnunciado(secciones('X', n(9)));
+  assert.equal(nueve.bloqueos.length, 0);
+  assert.match(nueve.avisos[0] as string, /tiene 9 criterios/);
+  const doce = validarEnunciado(secciones('X', n(12)));
+  assert.equal(doce.bloqueos.length, 0);
+  assert.equal(doce.avisos.length, 1);
+  const trece = validarEnunciado(secciones('X', n(13)));
+  assert.equal(trece.bloqueos.length, 1);
+  assert.match(trece.bloqueos[0] as string, /13 criterios .*partela/);
+});
+
+test('validarEnunciado: un criterio vacio bloquea indicando su posicion', () => {
+  const r = validarEnunciado(secciones('X', ['`a` hace 1 cosa', '']));
+  assert.deepEqual(r.bloqueos, ['el criterio 2 esta vacio']);
+});
+
+test('validarEnunciado: un criterio solo vago bloquea; uno de comportamiento sin ancla solo avisa', () => {
+  const vago = validarEnunciado(secciones('X', ['El codigo debe ser robusto y mantenible']));
+  assert.equal(vago.bloqueos.length, 1);
+  assert.match(vago.bloqueos[0] as string, /palabras vagas/);
+  assert.equal(vago.avisos.length, 0, 'el vago no se cuenta ademas como sin ancla');
+
+  const comportamiento = validarEnunciado(secciones('X', ['Sin nada que commitear no se crea commit vacio']));
+  assert.equal(comportamiento.bloqueos.length, 0);
+  assert.match(comportamiento.avisos[0] as string, /1 criterio\(s\) no citan nada comprobable/);
+});
+
+test('tieneAncla: codigo, rutas, flags, comandos, tests y numeros cuentan; IDs y secciones no', () => {
+  for (const si of [
+    'usa `foo()`',
+    'toca src/core/x',
+    'edita README.md',
+    'acepta --push',
+    'taskctl plan lo rechaza',
+    'git log lo muestra',
+    'hay un test que lo cubre',
+    'tarda menos de 5 segundos',
+  ]) {
+    assert.equal(tieneAncla(si), true, si);
+  }
+  for (const no of ['como en TASK-018', 'segun la §8.3', 'ver la seccion 14', 'cumple AC1 y C6', 'queda claro']) {
+    assert.equal(tieneAncla(no), false, no);
+  }
+});
+
+test('esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva', () => {
+  assert.equal(esSoloVago('Mejorar el rendimiento'), false, '"rendimiento" no es vaga');
+  assert.equal(esSoloVago('Que sea rapido y eficiente'), true);
+  assert.equal(esSoloVago('Rápido'), true, 'las tildes se normalizan');
+  assert.equal(esSoloVago(''), false);
+});
+
+test('planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva', () => {
+  const plantilla = '# Plan — TASK-1\n\n## Enfoque\n\n(Rellena aqui)\n';
+  assert.equal(planEsEsqueleto(plantilla, [plantilla]), true);
+  assert.equal(planEsEsqueleto(plantilla.replace(/\n/g, '\r\n'), [plantilla]), true, 'CRLF no cambia nada');
+  assert.equal(planEsEsqueleto('# Solo un titulo\n', []), true);
+  assert.equal(planEsEsqueleto(`${plantilla}\nUsar un modulo puro.\n`, [plantilla]), false);
+});
+
+test('casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones', () => {
+  const body =
+    '## Objetivo\n- [ ] no es criterio\n\n' +
+    '## Criterios de aceptacion\n- [x] hecho\n- [ ] pendiente uno\n### Parser\n* [ ] pendiente dos\n' +
+    '### Tras el cierre\n- [ ] CI en verde\n\n## Resultado\n- [ ] tampoco\n';
+  assert.deepEqual(casillasSinMarcar(body), ['pendiente uno', 'pendiente dos']);
+  assert.deepEqual(casillasSinMarcar(body.replace(/\n/g, '\r\n')), ['pendiente uno', 'pendiente dos']);
+  assert.deepEqual(casillasSinMarcar('## Criterios de aceptacion\n- [x] a\n'), []);
+});
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-043/tarea.md                                                                        |  44 --------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-043/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-043/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-043/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-043/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-043/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-043/planificacion/plan-final.md                                    |   0
 tareas/02-en-curso/TASK-043/tarea.md                                                                         |  83 +++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                    |  15 ++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  10 ++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       |  21 ++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/validacion-tarea.js                               | 139 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 13 files changed, 264 insertions(+), 51 deletions(-)
````
