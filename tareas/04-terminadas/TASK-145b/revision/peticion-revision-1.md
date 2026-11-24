# Peticion de revision — TASK-145b (ronda 1)

- Tarea: TASK-145b — finish.ts y comentarios (parte b de TASK-145)
- Rama revisada: fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
- Rama base: develop
- Commit revisado (HEAD): 260cda7a2c942cf6b18382e52469871740926e27
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-145b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-145b/tarea.md
- tareas/03-en-revision/TASK-145b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts

## Commits a revisar (git log develop..HEAD)

````
260cda7 update(fix): develop -> fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
886ec17 update(fix): develop -> fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
0becfd8 update(fix): develop -> fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
84ef886 chore(TASK-145b): autorrevision
694b041 fix(TASK-145b): finish.ts sin duplicacion (base, tag de reintento, spreads) y comentarios en su sitio
f97ea99 chore(TASK-145b): tarea en curso
b0f5061 merge(TASK-145b): develop en fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 501f85a..9a5a450 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -1034,7 +1034,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
     try {
-      const result = await runCodexReviewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+      const result = await runCodexReviewCommand(tareasRoot, argv.slice(1), { repoCwd });
       if (result.degradado) {
         // Codigo 0 a proposito (criterio de aceptacion 3): un Codex
         // ausente o fallando no rompe el flujo. El aviso deja claro por
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index dc89a03..1b9968d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -61,6 +61,11 @@ export class ApproveCommandError extends Error {}
 /** Flags de `taskctl approve`: extraerDecididoPor y extraerPushFlag. */
 export const FLAGS_APPROVE: readonly string[] = ['--decidido-por', '--push', '-p'];
 
+/** true si hay un plan que aprobar en cualquiera de las dos ubicaciones. */
+function planFinalExisteEn(u: PlanFinalUbicacion | null): boolean {
+  return u !== null && (u.canonicaExiste || u.legadaExiste);
+}
+
 /**
  * Acepta el plan en CUALQUIERA de sus dos ubicaciones (TASK-027, item
  * C3): `planificacion/plan-final.md` (canonica) o suelto en la raiz de
@@ -74,13 +79,7 @@ export const FLAGS_APPROVE: readonly string[] = ['--decidido-por', '--push', '-p
  * conflicto bastan para producirlo. Aprobar a ciegas un estado con dos
  * planes divergentes es marcar como revisado un plan que quiza nadie
  * ha leido.
- */
-/** true si hay un plan que aprobar en cualquiera de las dos ubicaciones. */
-function planFinalExisteEn(u: PlanFinalUbicacion | null): boolean {
-  return u !== null && (u.canonicaExiste || u.legadaExiste);
-}
-
-/**
+ *
  * TASK-144c (CMD1-10 de la auditoria 4D): «que plan cuenta», una sola regla
  * para approve, siguiente (planRedactado, duracionDelPlan) y trocear. La ruta
  * del plan, null si no hay ninguno, o 'ambiguo' si hay uno en la raiz y otro
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
index 1fdc06d..48a7043 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
@@ -124,17 +124,9 @@ export function codexInformeTemplate(
   );
 }
 
-/**
- * `today` se recibe por simetria con el resto de comandos del ciclo de
- * vida (mismo cableado desde cli.ts), pero NO se usa: a diferencia de
- * review/finish, "codex-review" no reescribe tarea.md ni le cambia el
- * estado (sigue en-revision) — solo anade un informe dentro de
- * revision/, asi que no hay ningun campo "actualizado" que tocar.
- */
 export async function runCodexReviewCommand(
   tareasRoot: string,
   argv: readonly string[],
-  _today: string,
   deps: CodexReviewCommandDeps
 ): Promise<CodexReviewCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 7476689..027a16b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -111,7 +111,6 @@ export interface PuertaVerificacionOpts {
   entornoVerificacion?: () => NodeJS.ProcessEnv;
 }
 
-/** Las opciones de ejecucion del comando: el timeout de los tests y el entorno con el contador. */
 /**
  * TASK-128: cada verificacion de `finish` anota una linea de la puerta `finish`
  * en el registro de puertas (docs/registro-puertas.md), tambien en rojo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 54035bb..a3bff96 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -521,6 +521,9 @@ async function runFinish(
   // hotfix/release tambien la principal. Un MR ya mergeado en la plataforma
   // no mergea nada aqui: la carpeta de la tarea ya llego con su historia.
   const mainBranch = MERGEA_A_MAIN[tipo] ? resolveMainBranch(deps.repoCwd) : null;
+  // TASK-145a/b (CMD1-06): la base de la rama de la tarea, decidida una vez. Un
+  // hotfix nace de la principal; el resto, de la rama de integracion.
+  const ramaBaseTarea = tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion;
   const destinos = mainBranch === null ? [ramaIntegracion] : [mainBranch, ramaIntegracion];
   for (const destino of integradaPorMergeRequest ? [] : destinos) {
     const colision = detectarColisionId(id, titulo, rama, destino, deps.repoCwd);
@@ -550,6 +553,9 @@ async function runFinish(
   // scripts lo exigen) y se devuelve antes de la escritura de cierre.
   const apartado = apartarPendientes(deps.repoCwd, tareasRoot, initial.task.id);
   pendientes.apartado = apartado;
+  // TASK-145b (CMD1-14): lo que todas las puertas reciben igual.
+  const conAviso = deps.onAviso === undefined ? {} : { onAviso: deps.onAviso };
+  const conTimeout = deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs };
   const puerta = async () => {
     progreso.paso('verificacion');
     const r = await puertaVerificacion({
@@ -563,12 +569,12 @@ async function runFinish(
       sinVerificacion,
       cwd: deps.repoCwd,
       instante: deps.ahora ?? today,
-      ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
-      ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+      ...conAviso,
+      ...conTimeout,
       // TASK-100: la misma base que la cobertura y los held-out. Un release no:
       // su diff propio puede ser solo el CHANGELOG, pero lleva a la principal
       // todo lo acumulado en la rama de integracion. Siempre la completa.
-      ...(tipo === 'release' ? {} : { ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion }),
+      ...(tipo === 'release' ? {} : { ramaBase: ramaBaseTarea }),
       // TASK-106: un hotfix integra en la principal: nunca la selectiva (si su camino de solo documentacion).
       permitirSelectiva: tipo !== 'hotfix',
       // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
@@ -582,8 +588,8 @@ async function runFinish(
         tipo,
         cwd: deps.repoCwd,
         env: entornoConContador(process.env, progreso.contador()),
-        ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
-        ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
+        ...conTimeout,
+        ...conAviso,
       });
     }
     // TASK-074: con el informe que la verificacion acaba de regenerar, y antes
@@ -591,24 +597,24 @@ async function runFinish(
     progreso.paso('cobertura');
     puertaCobertura({
       id,
-      ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion,
+      ramaBase: ramaBaseTarea,
       verificacion: r.resultado,
       cwd: deps.repoCwd,
-      ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
+      ...conAviso,
     });
     progreso.paso('held-out');
     puertaHeldout({
       id,
       rama,
       // Un hotfix nace de la principal: sus held-out se commitean ahi (MEN-1).
-      ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion,
+      ramaBase: ramaBaseTarea,
       ...(tipo === 'hotfix' && mainBranch !== null ? { ramaDiseno: ramaIntegracion } : {}),
       carpetaTarea: path
         .relative(deps.repoCwd, path.dirname((initial as NonNullable<typeof initial>).filePath))
         .split(path.sep)
         .join('/'),
       cwd: deps.repoCwd,
-      ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+      ...conTimeout,
     });
     progreso.paso('merge');
     return r;
@@ -683,8 +689,8 @@ async function runFinish(
         cwd: deps.repoCwd,
         permitirSelectiva: tipo !== 'hotfix' && tipo !== 'release',
         siempreCompleta: tipo === 'release',
-        ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
-        ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+        ...conAviso,
+        ...conTimeout,
         entornoVerificacion: () => entornoConContador(process.env, progreso.contador()),
       });
       // TASK-126 (IMP-1 de la revision): tambien en el camino idempotente, tras la
@@ -693,11 +699,11 @@ async function runFinish(
         puertaPesada({
           id,
           tipo,
-          yaIntegradaEn: mainBranch !== null && tipo !== 'feature' && tipo !== 'fix' ? [mainBranch, ramaIntegracion] : [ramaIntegracion],
+          yaIntegradaEn: mainBranch !== null ? [mainBranch, ramaIntegracion] : [ramaIntegracion],
           cwd: deps.repoCwd,
           env: entornoConContador(process.env, progreso.contador()),
-          ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
-          ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
+          ...conTimeout,
+          ...conAviso,
         });
       }
     } catch (e: unknown) {
@@ -730,13 +736,11 @@ async function runFinish(
     });
     if (code !== 0) {
       const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
-      // TASK-123: un hotfix nace de la principal: esa es su base.
-      const base = tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion;
       throw new FinishCommandError(
         `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
           'Revisa la salida de arriba; la tarea no se ha movido de carpeta. Si es un conflicto de merge, no ' +
           `lo cierres en la rama destino: abortalo con taskctl abort-merge, integra la base en la rama de ` +
-          `la tarea (git checkout ${rama} && git merge ${base}), resuelvelo y commitea alli, y ` +
+          `la tarea (git checkout ${rama} && git merge ${ramaBaseTarea}), resuelvelo y commitea alli, y ` +
           `relanza taskctl finish ${id} desde la rama de la tarea, que verifica antes de mergear.`
       );
     }
@@ -778,17 +782,14 @@ async function runFinish(
       commitParaTag = commitDeMergeParaTag(id, rama, ramaDelTag, nombreTag, deps.repoCwd);
     }
     if (mainBranch !== null) {
-      // hotfix/release: UN solo tag por tarea, el del script. Se comprueba que
-      // existe con el nombre pedido y sobre el merge a main; crear otro con
-      // otro nombre en un reintento seria el segundo tag que se quiere evitar.
-      if (planificarTag(nombreTag, commitParaTag, id, deps.repoCwd) !== 'existe-local') {
+      // hotfix/release: UN solo tag por tarea, el del script. En un reintento
+      // (merge ya hecho) lo comprobo comprobarTagDeReintento antes de cambiar de
+      // rama; aqui queda el caso del script: que el tag este sobre el merge a main.
+      // TASK-145b (CMD1-07): la rama del reintento era inalcanzable aqui.
+      if (tagLoPusoElScript && planificarTag(nombreTag, commitParaTag, id, deps.repoCwd) !== 'existe-local') {
         throw new FinishCommandError(
-          tagLoPusoElScript
-            ? `[ERROR] ${id}: ${scriptName} termino bien pero el tag "${nombreTag}" no esta sobre el merge a ` +
-                `"${ramaDelTag}". Revisa el repo a mano.`
-            : `[ERROR] ${id}: el merge a "${mainBranch}" ya esta hecho (con el tag que puso el script) y ` +
-                `"${nombreTag}" no es ese tag. Un ${tipo} lleva un solo tag: no se crea un segundo. ` +
-                'Reintenta sin --tag, o con --tag igual al que ya existe.'
+          `[ERROR] ${id}: ${scriptName} termino bien pero el tag "${nombreTag}" no esta sobre el merge a ` +
+            `"${ramaDelTag}". Revisa el repo a mano.`
         );
       }
       tag = {
@@ -857,16 +858,12 @@ async function runFinish(
   }
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
-  // Renderizado de cierre (criterio 3): plantillas desde el
-  // frontmatter. BOARD.md se regenera entero reutilizando el mismo
-  // render de "taskctl board" — la direccion que la tabla de la
-  // seccion 8 da por hecha; B5 decidira si el comando board tambien
-  // lo escribe.
+  // Renderizado de cierre: plantillas desde el frontmatter. BOARD.md se
+  // regenera entero con el mismo render que "taskctl board --escribir".
   const changelogPath = path.join(deps.repoCwd, 'CHANGELOG.md');
   const docsDir = path.join(deps.repoCwd, 'docs');
   await mkdir(docsDir, { recursive: true });
   const indexPath = path.join(docsDir, 'INDEX.md');
-  // Misma ruta que usa "taskctl board --escribir" (item B5).
   const boardPath = boardFilePath(deps.repoCwd);
 
   await appendEntry(changelogPath, CHANGELOG_INICIAL, CHANGELOG_HEADER, changelogEntry(updated, today));
@@ -1147,14 +1144,6 @@ interface TraerIntegracionOpts {
   cwd: string;
 }
 
-/**
- * Segundo `finish`, con el MR mergeado en la plataforma (merge, squash o
- * rebase: el criterio es el estado `merged`, no la ancestria): trae origin,
- * comprueba que el resultado del merge esta en la rama de integracion del
- * remoto y deja la local al dia con un fast-forward. Todas las comprobaciones
- * van ANTES de cambiar de rama. Devuelve el commit que la plataforma da como
- * resultado del merge (el del tag), o null si no lo informa.
- */
 /**
  * IMP-1 de la revision: con squash o rebase la ancestria no dice si la rama
  * esta integrada (decision de Carlos), pero SI se sabe que punta integro la
@@ -1196,6 +1185,14 @@ function comprobarRamaIntegrada(o: TraerIntegracionOpts): void {
   }
 }
 
+/**
+ * Segundo `finish`, con el MR mergeado en la plataforma (merge, squash o
+ * rebase: el criterio es el estado `merged`, no la ancestria): trae origin,
+ * comprueba que el resultado del merge esta en la rama de integracion del
+ * remoto y deja la local al dia con un fast-forward. Todas las comprobaciones
+ * van ANTES de cambiar de rama. Devuelve el commit que la plataforma da como
+ * resultado del merge (el del tag), o null si no lo informa.
+ */
 function traerIntegracionDeLaPlataforma(o: TraerIntegracionOpts): string | null {
   const { id, integrado, ramaIntegracion, cwd } = o;
   if (integrado.base !== ramaIntegracion) {
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-145b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145b/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145b/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-145b/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                  |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                     | 11 +++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js                                |  9 +--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                         |  1 -
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                      | 79 ++++++++++++++++++++++++++++++++++++++-----------------------------------------
 12 files changed, 53 insertions(+), 59 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts | 26 +++++++++++++-------------
 1 file changed, 13 insertions(+), 13 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 293.1 s
- Commit verificado: 260cda7a2c942cf6b18382e52469871740926e27
- Huella: 68ad5e675a38a000b6f4f90575af6df82ff276b6
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 151381 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.4788ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.8989ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (2.869ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.3834ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.0589ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.4116ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (5.3538ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (2.0367ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.789ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.8771ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.1126ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7622ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (2823.1546ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (2731.1545ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.0675ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.193ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9154ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6292ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.9251ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0913ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.5872ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.1237ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6201ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.4084ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.5217ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.5363ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (2.4261ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.9244ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4215ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4881ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3766ms)
ℹ tests 787
ℹ suites 0
ℹ pass 786
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 260744.8685
[verificar-impacto] node --test termino con 0 en 260.9 s.
````
