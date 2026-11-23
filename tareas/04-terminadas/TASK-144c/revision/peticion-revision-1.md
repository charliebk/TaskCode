# Peticion de revision — TASK-144c (ronda 1)

- Tarea: TASK-144c — patrones de ronda, plan que cuenta y doctor-deploy (parte c de TASK-144)
- Rama revisada: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
- Rama base: develop
- Commit revisado (HEAD): d86aba2de84cf8b2fe12701e91e52f3d68e437d0
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-144c (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-144c/tarea.md
- tareas/03-en-revision/TASK-144c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/patrones-ronda-plan.test.ts

## Commits a revisar (git log develop..HEAD)

````
d86aba2 docs(TASK-144c): autorrevision
ffbd38a fix(TASK-144c): patrones de ronda y de rol, plan que cuenta y doctor-deploy en un solo sitio
b3a5bc3 chore(TASK-144c): tarea en curso
4e5bfff merge(TASK-144c): develop en fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index ddd8db3..cb3aa05 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -45,7 +45,7 @@ import {
   seleccionarRolesDeTarea,
   type RolBrainstorm,
 } from '../core/roles-brainstorm.js';
-import { nombrePeticionRol } from '../core/plan-brainstorm.js';
+import { nombrePeticionRol, PETICION_ROL_RE } from '../core/plan-brainstorm.js';
 import { faltaReutilizacion, planEsEsqueleto, SECCION_REUTILIZACION } from '../core/validacion-tarea.js';
 import { conProgreso, crearProgreso, type Progreso } from '../fs/progreso.js';
 import { hayCambiosFueraDeTarea } from '../fs/pendientes.js';
@@ -81,6 +81,19 @@ function planFinalExisteEn(u: PlanFinalUbicacion | null): boolean {
   return u !== null && (u.canonicaExiste || u.legadaExiste);
 }
 
+/**
+ * TASK-144c (CMD1-10 de la auditoria 4D): «que plan cuenta», una sola regla
+ * para approve, siguiente (planRedactado, duracionDelPlan) y trocear. La ruta
+ * del plan, null si no hay ninguno, o 'ambiguo' si hay uno en la raiz y otro
+ * en planificacion/ (approve aborta con eso; antes planRedactado elegia el
+ * canonico en silencio y siguiente mandaba a un approve que abortaba).
+ */
+export function planQueCuenta(u: PlanFinalUbicacion | null): string | null | 'ambiguo' {
+  if (!planFinalExisteEn(u) || u === null) return null;
+  if (u.canonicaExiste && u.legadaExiste) return 'ambiguo';
+  return u.canonicaExiste ? u.canonica : u.legada;
+}
+
 /**
  * Se llama DESPUES de assertTransitionAllowed, no antes (hallazgo MENOR
  * de revision por pares ronda 2, TASK-027): con la tarea en un estado
@@ -194,7 +207,8 @@ async function runApprove(
   // roles se eligen en un orden fijo, asi que solo hay 0..N prefijos), no
   // con textos copiados, para que siga valiendo si la plantilla cambia.
   progreso.paso('plan');
-  const rutaPlan = ubicacion!.canonicaExiste ? ubicacion!.canonica : ubicacion!.legada;
+  // assertPlanNoAmbiguo y la guarda de estado ya descartaron 'ambiguo' y null.
+  const rutaPlan = planQueCuenta(ubicacion) as string;
   if (await planEsPlantilla(task, rutaPlan)) {
     throw new ApproveCommandError(
       `[ERROR] ${task.id}: "${rutaPlan}" es la plantilla sin rellenar: no hay plan que aprobar. ` +
@@ -315,7 +329,7 @@ async function juegosDeRolesEnDisco(rutaPlan: string): Promise<RolBrainstorm[][]
     }
     const rondas = new Set<number>();
     for (const f of ficheros) {
-      const m = /^peticion-brainstorm-[a-z0-9-]+-(\d+)\.md$/.exec(f);
+      const m = PETICION_ROL_RE.exec(f);
       if (m !== null) rondas.add(Number(m[1]));
     }
     for (const n of rondas) {
@@ -344,16 +358,23 @@ export async function planEsPlantilla(task: Task, rutaPlan: string): Promise<boo
   return planEsEsqueleto(await readFile(rutaPlan, 'utf8'), plantillas);
 }
 
-/** ¿La tarea tiene un plan-final.md redactado (existe y no es la plantilla)? */
-/** TASK-097: la duracion estimada del plan-final.md de la tarea (ausente si no hay plan). */
+/**
+ * TASK-097: la duracion estimada del plan-final.md de la tarea (ausente si no
+ * hay plan, o si hay dos y no se sabe cual cuenta).
+ */
 export async function duracionDelPlan(taskDir: string): Promise<ReturnType<typeof leerDuracionEstimada>> {
-  const u = await resolverPlanFinal(taskDir);
-  if (!planFinalExisteEn(u)) return { tipo: 'ausente' };
-  return leerDuracionEstimada(await readFile(u.canonicaExiste ? u.canonica : u.legada, 'utf8'));
+  const ruta = planQueCuenta(await resolverPlanFinal(taskDir));
+  if (ruta === null || ruta === 'ambiguo') return { tipo: 'ausente' };
+  return leerDuracionEstimada(await readFile(ruta, 'utf8'));
 }
 
+/**
+ * ¿La tarea tiene un plan-final.md redactado (existe, no es la plantilla y no
+ * hay dos)? Con dos planes, false: approve abortaria, asi que siguiente no
+ * puede mandar a aprobar (CMD1-10).
+ */
 export async function planRedactado(task: Task, taskDir: string): Promise<boolean> {
-  const u = await resolverPlanFinal(taskDir);
-  if (!planFinalExisteEn(u)) return false;
-  return !(await planEsPlantilla(task, u.canonicaExiste ? u.canonica : u.legada));
+  const ruta = planQueCuenta(await resolverPlanFinal(taskDir));
+  if (ruta === null || ruta === 'ambiguo') return false;
+  return !(await planEsPlantilla(task, ruta));
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
index d87e30b..af54e0e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
@@ -293,6 +293,18 @@ function leerOpciones(argv: readonly string[]): OpcionesComando {
   return { json: argv.includes('--json'), escribir: argv.includes('--escribir'), resultado, crearTareas: argv.includes('--crear-tareas') };
 }
 
+/**
+ * TASK-144c (CMD1-11 de la auditoria 4D): ruta del fichero de --resultado
+ * relativa al repo si esta DENTRO de el, o null. La usan el aviso y la pista
+ * del guard de rama; antes la pista se decidia buscando el texto del aviso.
+ * Con las rutas reales: en Windows la carpeta temporal puede venir en formato
+ * corto (8.3).
+ */
+function resultadoDentroDelRepo(raiz: string, ruta: string): string | null {
+  const rel = path.relative(realpathSync.native(raiz), realpathSync.native(ruta));
+  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.replace(/\\/g, '/') : null;
+}
+
 /** Lee el JSON del agente y lo mezcla con los puntos (ver core/doctor-deploy-veredictos.ts). */
 function incorporarVeredictos(
   fichero: string,
@@ -327,11 +339,10 @@ function incorporarVeredictos(
     throw e;
   }
   // Dentro del repo ensucia el arbol (y con --crear-tareas aborta el guard de rama): se avisa.
-  // Con las rutas reales: en Windows la carpeta temporal puede venir en formato corto (8.3).
-  const rel = path.relative(realpathSync.native(raiz), realpathSync.native(ruta));
-  if (rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)) {
+  const rel = resultadoDentroDelRepo(raiz, ruta);
+  if (rel !== null) {
     avisos.push(
-      `el fichero de --resultado esta dentro del repositorio (${rel.replace(/\\/g, '/')}): ensucia el arbol de trabajo. ` +
+      `el fichero de --resultado esta dentro del repositorio (${rel}): ensucia el arbol de trabajo. ` +
         'Guardalo fuera (la carpeta temporal del sistema).'
     );
   }
@@ -505,7 +516,12 @@ export async function runDoctorDeployCompleto(argv: readonly string[], deps: Doc
   try {
     tareas = await crearTareasDeFallas(a.informe, a.raiz, fechaLocal(a.ahora));
   } catch (e: unknown) {
-    if (e instanceof BaseBranchGuardError && a.informe.avisos.some((x) => x.includes('--resultado esta dentro del repositorio'))) {
+    const resultado = a.opciones.resultado;
+    if (
+      e instanceof BaseBranchGuardError &&
+      resultado !== null &&
+      resultadoDentroDelRepo(a.raiz, path.resolve(deps.repoCwd, resultado)) !== null
+    ) {
       throw new BaseBranchGuardError(
         `${e.message}\n        Si el cambio es el fichero de --resultado, guardalo fuera del repositorio (la carpeta temporal del sistema).`
       );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index fc586ed..c9a87f7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -64,6 +64,8 @@ import {
 import {
   nombrePeticionRol,
   nombreSalidaRol,
+  PETICION_ROL_RE,
+  SALIDA_ROL_RE,
   nombrePeticionUnificador,
   nombrePeticionRedaccion,
   peticionRedaccionTemplate,
@@ -121,7 +123,7 @@ export const BRAINSTORM_DIRNAME = 'brainstorm';
 // (2 o mas roles, o carpetas antiguas) o la de redaccion (1 rol, sin
 // unificador). Las dos se escriben las ultimas y cierran la ronda.
 const RONDA_UNIFICADOR_RE = /^peticion-(unificador|plan)-(\d+)\.md$/;
-const PETICION_ROL_RE = /^peticion-brainstorm-[a-z0-9-]+-(\d+)\.md$/;
+// TASK-144c: PETICION_ROL_RE y SALIDA_ROL_RE salen de core/plan-brainstorm.ts.
 
 /**
  * Subcarpeta de artefactos de diseno dentro de la carpeta de la tarea
@@ -887,7 +889,7 @@ async function runPlan(
   // ronda reutilizable ya tenga 2 o mas salidas en disco (se bajo de 2
   // roles a 1): esas salidas son trabajo real y alguien las consolida.
   const contarSalidasDe = (n: number): number =>
-    enBrainstorm.filter((f) => f.startsWith('salida-brainstorm-') && f.endsWith(`-${n}.md`)).length;
+    enBrainstorm.filter((f) => SALIDA_ROL_RE.exec(f)?.[1] === String(n)).length;
   const modo: 'unificador' | 'redaccion' =
     roles.length === 1 && (rondaRoles === null || contarSalidasDe(rondaRoles) < 2)
       ? 'redaccion'
@@ -999,9 +1001,8 @@ async function runPlan(
   // cuantas sean.
   const salidasAConsolidar: { nombre: string; titulo: string }[] = [];
   if (rondaRoles !== null) {
-    const sufijo = `-${rondaRoles}.md`;
     for (const nombre of await listarDir(brainstormDir)) {
-      if (!nombre.startsWith('salida-brainstorm-') || !nombre.endsWith(sufijo)) continue;
+      if (SALIDA_ROL_RE.exec(nombre)?.[1] !== String(rondaRoles)) continue;
       const rol = TODOS_LOS_ROLES.find((r) => nombre === nombreSalidaRol(r, rondaRoles as number));
       salidasAConsolidar.push({
         nombre,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 011c59a..2a53fdb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -43,7 +43,9 @@ import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import {
   INFORME_REVISION_RE,
   PETICION_REVISION_RE,
+  RONDA_REVISION_RE,
   informesDeUltimaRonda,
+  nombresDeRonda,
   rondaYRevisorDeInforme,
   siguienteRonda,
 } from '../fs/rondas.js';
@@ -129,7 +131,7 @@ export const REVISION_DIRNAME = 'revision';
  * de review.test.ts y lo que finish.ts ya sabia leer antes de esta
  * tarea.
  */
-const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
+// TASK-144c: el patron vive en fs/rondas.ts (RONDA_REVISION_RE).
 
 export interface ReviewCommandDeps {
   /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
@@ -1012,7 +1014,7 @@ async function runReview(
   // pisar una revision anterior — mismo principio que plan-final.md.
   const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
   await mkdir(revisionDir, { recursive: true });
-  const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);
+  const ronda = await siguienteRonda(revisionDir, RONDA_REVISION_RE);
   progreso.paso('peticiones', { ronda });
 
   // Un par de nombres (con o sin sufijo de dominio) por grupo del plan.
@@ -1026,12 +1028,12 @@ async function runReview(
       ? modeloDeVerificacion(updated.modelo_sugerido)
       : null;
   const escrituras = plan.grupos.map((grupo) => {
-    const sufijo = conSufijo ? `-${grupo.revisor}` : '';
+    const nombres = nombresDeRonda(ronda, conSufijo ? `-${grupo.revisor}` : '');
     return {
       revisor: grupo.revisor,
       ficheros: grupo.ficheros,
-      nombrePeticion: `peticion-revision-${ronda}${sufijo}.md`,
-      nombreInforme: `informe-revision-${ronda}${sufijo}.md`,
+      nombrePeticion: nombres.peticion,
+      nombreInforme: nombres.informe,
       contexto: contextoPermitido({
         carpetaTarea,
         ficherosDelGrupo: grupo.ficheros,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
index 3333cdc..1ece84c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
@@ -16,7 +16,7 @@ import { readFile, rm, writeFile } from 'node:fs/promises';
 import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { readTareaFile, moveTareaFile, writeTareaFile, listExistingTaskIds } from '../fs/task-store.js';
 import { resolverPlanFinal } from './plan.js';
-import { planRedactado } from './approve.js';
+import { planQueCuenta, planRedactado } from './approve.js';
 import { ensureBaseBranchReady, runGit, type BaseBranchGuardResult } from '../fs/git.js';
 import { autoCommit, extraerPushFlag, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
 import { esIdTroceable, leerPartes, planificarTroceo, planTrasTroceo, TroceoError } from '../core/troceo.js';
@@ -82,8 +82,8 @@ export async function runTrocearCommand(
       `[ERROR] ${id}: no hay plan redactado. Las partes se declaran en su seccion "## Troceo".`
     );
   }
-  const u = await resolverPlanFinal(taskDir);
-  const rutaPlan = u.canonicaExiste ? u.canonica : u.legada;
+  // TASK-144c (CMD1-10): planRedactado ya descarto null y 'ambiguo'.
+  const rutaPlan = planQueCuenta(await resolverPlanFinal(taskDir)) as string;
   const plan = await readFile(rutaPlan, 'utf8');
 
   let troceo: ReturnType<typeof planificarTroceo>;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
index 19766b5..44367c8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
@@ -22,7 +22,7 @@
  */
 import type { Task } from './task.js';
 import type { ResolucionAgentes } from './heuristica.js';
-import { UNIFICADOR_ID, type RolBrainstorm } from './roles-brainstorm.js';
+import { TODOS_LOS_ROLES, UNIFICADOR_ID, type RolBrainstorm } from './roles-brainstorm.js';
 import { fenceFor } from './markdown.js';
 import { VINETA_PETICION_REUTILIZACION } from './validacion-tarea.js';
 
@@ -47,6 +47,17 @@ export function nombreSalidaRol(rol: RolBrainstorm, ronda: number): string {
   return `salida-${rol.id}-${ronda}.md`;
 }
 
+/**
+ * TASK-144c (CMD2-09 de la auditoria 4D): los patrones de los ficheros de rol
+ * salen de los ids de los roles, el mismo dato con el que `nombrePeticionRol`
+ * y `nombreSalidaRol` los generan. Antes plan y approve fijaban a mano el
+ * prefijo `brainstorm-`: un rol con otro id dejaba de casar en silencio y se
+ * rompia la numeracion de rondas.
+ */
+const IDS_ROLES = TODOS_LOS_ROLES.map((r) => r.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
+export const PETICION_ROL_RE = new RegExp(`^peticion-(?:${IDS_ROLES})-(\\d+)\\.md$`);
+export const SALIDA_ROL_RE = new RegExp(`^salida-(?:${IDS_ROLES})-(\\d+)\\.md$`);
+
 export function nombrePeticionUnificador(ronda: number): string {
   return `peticion-unificador-${ronda}.md`;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
index 0cd4b60..01356cd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -78,13 +78,28 @@ export async function ultimaRonda(dir: string, patron: RegExp): Promise<number>
  * Vive aqui desde TASK-036: antes estaba copiada en finish.ts y en
  * codex-review.ts.
  */
-export const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-([a-z0-9-]+))?\.md$/;
+/** Sufijo comun de los ficheros de ronda: numero (grupo 1) y revisor opcional (grupo 2). */
+const SUFIJO_RONDA = String.raw`(\d+)(?:-([a-z0-9-]+))?\.md`;
+
+export const INFORME_REVISION_RE = new RegExp(`^informe-revision-${SUFIJO_RONDA}$`);
 
 /**
  * Peticiones de revision, con el mismo sufijo opcional por revisor. Vive
  * aqui desde TASK-064 (antes en commands/review.ts, que la reexporta).
  */
-const PETICION_REVISION_PATRON = String.raw`peticion-revision-(\d+)(?:-([a-z0-9-]+))?\.md`;
+const PETICION_REVISION_PATRON = `peticion-revision-${SUFIJO_RONDA}`;
+
+/**
+ * TASK-144c (CMD2-02 de la auditoria 4D): peticiones e informes de revision a
+ * la vez, para numerar la ronda siguiente. Sale del MISMO sufijo que
+ * INFORME_REVISION_RE y PETICION_REVISION_RE: antes review tenia su copia.
+ */
+export const RONDA_REVISION_RE = new RegExp(`^(?:peticion|informe)-revision-${SUFIJO_RONDA}$`);
+
+/** Nombres de la peticion y el informe de una ronda (`sufijo` es `-<revisor>` o ''). */
+export function nombresDeRonda(ronda: number, sufijo: string): { peticion: string; informe: string } {
+  return { peticion: `peticion-revision-${String(ronda)}${sufijo}.md`, informe: `informe-revision-${String(ronda)}${sufijo}.md` };
+}
 export const PETICION_REVISION_RE = new RegExp(`^${PETICION_REVISION_PATRON}$`);
 
 /**
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-144c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144c/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144c/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144c/tarea.md                                                       |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                     | 44 +++++++++++++++++++++++++++++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy.js                               | 23 ++++++++++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                        |  9 ++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      | 22 +++++-----------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/trocear.js                                     |  6 +++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-brainstorm.js                                 | 12 +++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js                                            | 16 ++++++++++++++--
 16 files changed, 95 insertions(+), 45 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/patrones-ronda-plan.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/patrones-ronda-plan.test.ts | 62 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 62 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 149.6 s
- Commit verificado: d86aba2de84cf8b2fe12701e91e52f3d68e437d0
- Huella: 3d3c9fb61742f8dddec3f46da4bd055e2f66df68
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 101090 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3635ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (1.5145ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.2854ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (0.954ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.2243ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (1.8995ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (3.942ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.7503ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (7.0561ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.9845ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.696ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.777ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1893.5876ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1933.4473ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.0077ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.1622ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (1.0007ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6939ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.9077ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1606ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.9228ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.3406ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6323ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.9214ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6781ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.626ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (38.1126ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (2.6835ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4957ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5711ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4133ms)
ℹ tests 843
ℹ suites 0
ℹ pass 841
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 138129.4373
[verificar-impacto] node --test termino con 0 en 138.2 s.
````
