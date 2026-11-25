# Peticion de revision — TASK-158b (ronda 1)

- Tarea: TASK-158b — taskctl comprueba la autorrevision 4D por ronda y en los MENORES (parte b de TASK-158)
- Rama revisada: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
- Rama base: develop
- Commit revisado (HEAD): deb6eddd790c0fb3fc62918ebaac413def6e4d4c
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-158b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-158b/tarea.md
- tareas/03-en-revision/TASK-158b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts

## Commits a revisar (git log develop..HEAD)

````
deb6edd docs(TASK-158b): autorrevision
5782832 feat(TASK-158b): review y verificar-menores avisan si falta la autorrevision 4D de las correcciones
d6eb93e chore(TASK-158b): tarea en curso
7a7d2ca merge(TASK-158b): develop en feature/task-158-regla-4d-preventiva-en-todos-los-proceso para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index bcc6382..5d03719 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -976,6 +976,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
 `
       );
       printAutoCommit(r.autoCommit);
+      printAvisos(...r.avisos);
       return 0;
     } catch (e) {
       if (e instanceof VerificarMenoresCommandError) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 29e16c4..df2b01b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -92,7 +92,7 @@ import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { conPendientesApartados, hayCambiosFueraDeTarea, recuperarApartado } from '../fs/pendientes.js';
 import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
 import { excluirDeRevision } from '../fs/revisores-rango.js';
-import { avisoAutorrevision } from '../core/autorrevision.js';
+import { avisoAutorrevision, avisoAutorrevisionRonda } from '../core/autorrevision.js';
 import { contextoPermitido } from '../core/contexto-revision.js';
 import { modeloDeVerificacion } from '../core/modelo-revision.js';
 
@@ -842,6 +842,12 @@ async function runReview(
   // avisoAutorrevision es pura y nunca lanza.
   const sinAutorrevision = avisoAutorrevision(body, id);
   if (sinAutorrevision !== null) avisos.push(sinAutorrevision);
+  // TASK-158b: las correcciones de la ronda anterior pasan la misma Regla 4D
+  // que la implementacion, con su linea `- 4D ronda K — `. Aviso, sin bloquear.
+  if (previa !== null) {
+    const sinRonda4D = avisoAutorrevisionRonda(body, id, previa.ronda);
+    if (sinRonda4D !== null) avisos.push(sinRonda4D);
+  }
   // TASK-095: entre ronda y ronda se corrige TODO lo de la ronda anterior; lo
   // que no compense (un MENOR) se marca `aceptado` con su motivo o pasa a una
   // tarea nueva. Dejarlo para la ronda siguiente es lo que alargaba el ciclo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
index 8c33a37..e6182c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
@@ -39,6 +39,7 @@ import {
 } from '../core/menores.js';
 import { anotarLineaEnSeccion } from '../core/transiciones.js';
 import { readTareaFile, writeTareaFile } from '../fs/task-store.js';
+import { avisoAutorrevisionMenores } from '../core/autorrevision.js';
 import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
 import { isAncestor, runGit } from '../fs/git.js';
 import { resolverConfig } from '../core/config.js';
@@ -69,6 +70,8 @@ export interface VerificarMenoresCommandResult {
   /** Ruta del backlog si se escribio; null si no hizo falta. */
   backlogPath: string | null;
   autoCommit: AutoCommitResult;
+  /** TASK-158b: avisos que no impiden registrar la verificacion. */
+  avisos: string[];
 }
 
 /**
@@ -236,6 +239,11 @@ export async function runVerificarMenoresCommand(
   }
 
   const { corregidos, pendientes } = repartirMenores(menores, cambiados);
+  // TASK-158b: los MENORES corregidos pasan la misma Regla 4D que la
+  // implementacion. Sin codigo cambiado no se corrigio nada: no hay que avisar.
+  const avisos: string[] = [];
+  const sinMenores4D = cambiados.length === 0 ? null : avisoAutorrevisionMenores(body, task.id);
+  if (sinMenores4D !== null) avisos.push(sinMenores4D);
   const commitVerificado = runGit(['rev-parse', 'HEAD'], cwd);
   const linea = lineaVerificacionLigera({
     instante: deps.ahora ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
@@ -274,6 +282,7 @@ export async function runVerificarMenoresCommand(
     pendientes: pendientes.map((h) => h.id),
     backlogPath,
     autoCommit: commitResult,
+    avisos,
   };
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
index cd6d594..7cea2d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
@@ -29,9 +29,45 @@ export function tieneAutorrevision(body: string): boolean {
  * autorrevision. Antes cualquier linea daba la constancia por buena (CONT-08
  * de la auditoria de TASK-141), asi que la autorrevision 4D podia no hacerse
  * sin que nada avisara. Vale con guion largo, corto o dos puntos tras «4D».
+ *
+ * TASK-158b: `etiqueta` distingue las lineas de quien corrige: `''` es la de
+ * la implementacion (`- 4D — `), `ronda K` la de las correcciones de la ronda
+ * K (`- 4D ronda K — `) y `menores` la de los MENORES tras aprobar. Ninguna
+ * cuenta por otra: la de la ronda 1 no vale para la ronda 2.
+ */
+export function tieneLinea4D(body: string, etiqueta = ''): boolean {
+  const tras4D = etiqueta === '' ? '' : `\\s+${etiqueta.trim().split(/\s+/).join('\\s+')}`;
+  const linea = new RegExp(`^\\s*[-*]\\s*4D${tras4D}\\s*(?:—|–|-|:)\\s*\\S`);
+  return (contenidoDeSeccion(body, SECCION_AUTORREVISION) ?? []).some((l) => linea.test(l));
+}
+
+/** El formato de la linea de quien corrige, el mismo que da revision.md. */
+const FORMATO_CORRECCION = '<commit>: usos buscados, N tests mutados';
+
+/**
+ * TASK-158b: aviso de `review` al abrir la ronda K+1 si las correcciones de la
+ * ronda K no traen su autorrevision 4D; null si esta.
+ */
+export function avisoAutorrevisionRonda(body: string, id: string, ronda: number): string | null {
+  if (tieneLinea4D(body, `ronda ${String(ronda)}`)) return null;
+  return (
+    `${id}: las correcciones de la ronda ${String(ronda)} no traen su autorrevision 4D en "${SECCION_AUTORREVISION}". ` +
+    'La ronda se abre igual, pero quien corrige busca todos los usos de lo que corrige (no solo los que cita el ' +
+    `hallazgo), muta cada test nuevo y lo anota: "- 4D ronda ${String(ronda)} — ${FORMATO_CORRECCION}".`
+  );
+}
+
+/**
+ * TASK-158b: aviso de `verificar-menores` si los MENORES corregidos no traen
+ * su autorrevision 4D; null si esta.
  */
-export function tieneLinea4D(body: string): boolean {
-  return (contenidoDeSeccion(body, SECCION_AUTORREVISION) ?? []).some((l) => /^\s*[-*]\s*4D\s*(?:—|–|-|:)\s*\S/.test(l));
+export function avisoAutorrevisionMenores(body: string, id: string): string | null {
+  if (tieneLinea4D(body, 'menores')) return null;
+  return (
+    `${id}: los MENORES corregidos no traen su autorrevision 4D en "${SECCION_AUTORREVISION}". ` +
+    'La verificacion queda registrada igual, pero quien corrige busca todos los usos de lo que corrige, muta ' +
+    `cada test nuevo y lo anota: "- 4D menores — ${FORMATO_CORRECCION}".`
+  );
 }
 
 /** El aviso de `review` si falta la constancia o su linea 4D; null si esta todo. */
@@ -41,8 +77,8 @@ export function avisoAutorrevision(body: string, id: string): string | null {
     return (
       `${id}: la autorrevision de tarea.md no trae la linea de la Regla 4D. La revision sigue, pero antes ` +
       'de pedirla conviene hacer la autorrevision 4D (buscar el helper que ya existe antes de crear uno, ' +
-      'citar el criterio que motiva cada cambio, mutar cada test nuevo y verlo en rojo) y anotarla en ' +
-      `"${SECCION_AUTORREVISION}": "- 4D — <commit>: helper buscado, criterios citados, N tests mutados".`
+      'citar el criterio que motiva cada cambio, buscar todos los usos de lo que se unifica, mutar cada test nuevo y verlo en rojo) y anotarla en ' +
+      `"${SECCION_AUTORREVISION}": "- 4D — <commit>: helper buscado, usos buscados, criterios citados, N tests mutados".`
     );
   }
   return (
@@ -50,6 +86,6 @@ export function avisoAutorrevision(body: string, id: string): string | null {
     'La revision sigue, pero antes de pedirla conviene pasar la seccion "## Que se revisa" de cada revisora ' +
     'que da "taskctl siguiente --json" (campo "revisores"), corregir lo evidente y anotar en tarea.md ' +
     `"${SECCION_AUTORREVISION}" con una linea "- <revisora> — <commit>" por revisora, commiteada, ` +
-    'y la de la Regla 4D: "- 4D — <commit>: helper buscado, criterios citados, N tests mutados".'
+    'y la de la Regla 4D: "- 4D — <commit>: helper buscado, usos buscados, criterios citados, N tests mutados".'
   );
 }
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-158b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158b/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158b/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158b/tarea.md                                                       |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                  |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      |  9 ++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-menores.js                           |  8 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/autorrevision.js                                   | 41 ++++++++++++++++++++++++++++++++++++-----
 13 files changed, 60 insertions(+), 7 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts | 20 ++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts  | 28 ++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts          | 32 +++++++++++++++++++++++++++++++-
 3 files changed, 79 insertions(+), 1 deletion(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Tests a mutar

Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).

- «TASK-158b: cada linea 4D cuenta solo por la suya (implementacion, ronda K, menores)» (taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts:90)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 1485.0 s
- Commit verificado: deb6eddd790c0fb3fc62918ebaac413def6e4d4c
- Huella: b297d669b05f281c1a905df2382fa4667a970a0f
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 594473 bytes en total):

````
✔ 10g. la lectura de la tabla discrimina (contraprueba del 10f) (4.0304ms)
✔ 11. ninguna skill arrastra marcas de este repo ni rutas de maquina (25.0559ms)
✔ 11b. la marca generica de documento interno discrimina (contraprueba del menor 4) (0.6129ms)
✔ 12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro (27032.9419ms)
✔ 13. el plugin entero, con las cuatro skills dentro, sigue validando (13924.0422ms)
✔ 14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2 (12.7483ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (23.7142ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (4.2543ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (8.0373ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (12.7156ms)
✔ 4. name presente, string y en kebab-case valido (4.0958ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (27.0528ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (51.1809ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (5.1818ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (4.9784ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (4.8832ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (37.508ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (2.9915ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (1.9667ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (5.605ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (3.7504ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (2.801ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (3.3414ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (97.2271ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (19.2705ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (76.0526ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (19.0121ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (44.7639ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (12529.9044ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (28983.3668ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (3.9036ms)
ℹ tests 1950
ℹ suites 0
ℹ pass 1948
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 1473501.9222
[verificar-impacto] node --test termino con 0 en 1473.6 s.
````
