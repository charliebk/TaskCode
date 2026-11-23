# Peticion de revision — TASK-153b (ronda 1)

- Tarea: TASK-153b — candidatos 4D en la peticion de revision (parte b de TASK-153)
- Rama revisada: feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
- Rama base: develop
- Commit revisado (HEAD): 42562c3fb668a8251a18fa580caced8053574736
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-153b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-153b/tarea.md
- tareas/03-en-revision/TASK-153b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/candidatos-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts

## Commits a revisar (git log develop..HEAD)

````
42562c3 docs(TASK-153b): autorrevision
ddcdf62 feat(TASK-153b): candidatos 4D en la peticion de revision
ec09f14 chore(TASK-153b): tarea en curso
c5f101d merge(TASK-153b): develop en feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index cc8bb90..ec9d020 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -91,6 +91,9 @@ cada uno en su dominio):
   mutacion), un stub que devuelve exito, un criterio marcado sin evidencia.
   Los patrones tipicos en tests: [disfraz-tests.md](disfraz-tests.md).
 
+La peticion trae `## Candidatos 4D` (pistas desde el diff): comprueba cada
+posible duplicado y muta cada test que liste.
+
 Duplicacion y disfraz reales son **IMPORTANTE** como minimo; desviacion y
 diluvio, MENOR salvo que cambien comportamiento o escondan un fallo.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index d07dac5..4700c4b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -62,6 +62,7 @@ import {
   type VeredictoInforme,
 } from '../core/informe-revision.js';
 import { fenceFor } from '../core/markdown.js';
+import { candidatos4D, definicionesDeGrep, SECCION_CANDIDATOS_4D, seccionCandidatos4D } from '../core/candidatos-4d.js';
 import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
   currentBranch,
@@ -72,6 +73,7 @@ import {
   logOneline,
   diffParaRevision,
   diffRangeForPaths,
+  definicionesEnRef,
   statDeFicheros,
   PATRONES_TEST,
   hayMergesEntre,
@@ -289,6 +291,7 @@ export function peticionTemplate(
     `${fence}\n` +
     seccionExcluidos(desde, extras) +
     seccionTests(desde, extras) +
+    (extras.seccionCandidatos4D ?? '') +
     (extras.seccionCobertura ?? '') +
     (extras.seccionVerificacion ?? '')
   );
@@ -376,6 +379,8 @@ export interface ExtrasPeticion {
   seccionPrevia?: string;
   /** TASK-074: lineas cambiadas sin cubrir (solo si el proyecto declara `informe_cobertura`). */
   seccionCobertura?: string;
+  /** TASK-153b: posibles duplicados y tests a mutar, desde el diff (Regla 4D). */
+  seccionCandidatos4D?: string;
   /** TASK-091: la verificacion selectiva de la ronda (solo si el proyecto declara `comando_verificacion_selectiva`). */
   seccionVerificacion?: string;
   /** TASK-081: lo que el revisor puede leer sin justificarlo (ver core/contexto-revision.ts). */
@@ -941,6 +946,10 @@ async function runReview(
           configRama.comando_verificacion
         );
 
+  // TASK-153b: candidatos 4D (pistas de duplicacion y tests a mutar), una vez
+  // por ronda y antes de escribir nada. Nunca lanza.
+  const candidatos = seccionCandidatosDeRonda(baseBranch, desde, paraRevision.diff, paraRevision.tests, deps.repoCwd);
+
   // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
   // el diff real de la rama, no `task.agente_revisor` del frontmatter,
   // decide quien revisa. El catalogo se relee de skills/*/SKILL.md en
@@ -1111,6 +1120,7 @@ async function runReview(
                     : previa.seccion,
                 }
               : {}),
+            seccionCandidatos4D: candidatos,
             ...(datosCobertura === null
               ? {}
               : {
@@ -1347,3 +1357,29 @@ function verificacionDeRonda(
   }
   return motivo !== null ? { tipo: 'documentacion', v, motivo } : { tipo: 'selectiva', v };
 }
+
+/**
+ * TASK-153b: la seccion de candidatos 4D de la ronda. Las definiciones nuevas
+ * salen del diff de codigo de la ronda; las existentes, de la rama base (lo
+ * que habia antes de la tarea); los tests, del diff de los ficheros de test.
+ * Nunca lanza: si Git falla, la seccion lo dice y la ronda sigue.
+ */
+function seccionCandidatosDeRonda(
+  baseBranch: string,
+  desde: string,
+  diffCodigo: string,
+  tests: readonly string[],
+  cwd: string
+): string {
+  try {
+    const existentes = definicionesDeGrep(definicionesEnRef(baseBranch, cwd), baseBranch);
+    const diffTests = diffRangeForPaths(desde, 'HEAD', tests, cwd);
+    return seccionCandidatos4D(candidatos4D(diffCodigo, diffTests, existentes));
+  } catch (e) {
+    const motivo = e instanceof Error ? (e.message.split('\n')[0] ?? '') : String(e);
+    return (
+      `${SECCION_CANDIDATOS_4D}\n\nNo se pudieron calcular (${motivo}): ` +
+      'busca a mano duplicados de las definiciones nuevas y muta los tests que prometen algo.\n\n'
+    );
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
new file mode 100644
index 0000000..811692d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
@@ -0,0 +1,217 @@
+/**
+ * TASK-153b (Regla 4D al crear): candidatos 4D de una ronda de revision.
+ *
+ * Pistas para el revisor, no hallazgos: las definiciones que la tarea anade y
+ * las que ya existian en la rama base con nombre igual o parecido (posible
+ * duplicacion), y los tests nuevos cuyo nombre promete algo comprobable (a
+ * mutar: posible disfraz). La auditoria de TASK-141 encontro 102
+ * duplicaciones y 21 disfraces; casi todos se habrian visto con estas pistas.
+ *
+ * Puro: recibe texto de diffs y de `git grep` y devuelve datos y markdown.
+ */
+import { distanciaEdicion } from './sugerencia.js';
+
+export const SECCION_CANDIDATOS_4D = '## Candidatos 4D';
+
+/** Una definicion (funcion, clase, constante) en un fichero. */
+export interface Definicion {
+  nombre: string;
+  fichero: string;
+  /** Linea en el fichero (la del lado nuevo del diff, o la de `git grep`). */
+  linea: number;
+}
+
+export interface CandidatoDuplicado {
+  nueva: Definicion;
+  existentes: Definicion[];
+}
+
+export interface Candidatos4D {
+  duplicados: CandidatoDuplicado[];
+  /** Tests nuevos cuyo nombre promete algo comprobable. */
+  testsAMutar: Definicion[];
+}
+
+/**
+ * Patrones de definicion por familia de lenguaje. El grupo 1 es el nombre.
+ * Se cubren TS/JS, Rust, Python, Java/C#/Kotlin (clases) y bash; lo demas
+ * no da candidatos (nunca falla).
+ */
+const PATRONES_DEFINICION: readonly RegExp[] = [
+  /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/,
+  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>/,
+  /^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
+  /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_][\w]*)/,
+  /^\s*(?:async\s+)?def\s+([A-Za-z_][\w]*)/,
+  /^\s*(?:public|private|protected|internal)?\s*(?:static\s+)?(?:final\s+|sealed\s+|abstract\s+)?(?:class|interface|record|struct|enum)\s+([A-Za-z_][\w]*)/,
+  /^\s*(?:function\s+)?([A-Za-z_][\w-]*)\s*\(\)\s*\{/,
+];
+
+/** Extensiones de codigo donde se buscan definiciones. */
+const EXT_CODIGO = /\.(?:[cm]?[jt]sx?|rs|py|java|kt|cs|sh|bash)$/i;
+
+function nombreDeDefinicion(linea: string): string | null {
+  for (const re of PATRONES_DEFINICION) {
+    const m = re.exec(linea);
+    if (m?.[1] !== undefined) return m[1];
+  }
+  return null;
+}
+
+/** Recorre un diff unificado y devuelve las lineas anadidas con su fichero y numero de linea nuevo. */
+function lineasAnadidas(diff: string): { fichero: string; linea: number; texto: string }[] {
+  const salida: { fichero: string; linea: number; texto: string }[] = [];
+  let fichero = '';
+  let nueva = 0;
+  for (const l of diff.split(/\r?\n/)) {
+    if (l.startsWith('+++ ')) {
+      const ruta = l.slice(4).trim();
+      fichero = ruta === '/dev/null' ? '' : ruta.replace(/^b\//, '');
+      continue;
+    }
+    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
+    if (hunk !== null) {
+      nueva = Number(hunk[1]);
+      continue;
+    }
+    if (fichero === '' || l.startsWith('--- ')) continue;
+    if (l.startsWith('+')) {
+      salida.push({ fichero, linea: nueva, texto: l.slice(1) });
+      nueva++;
+    } else if (l.startsWith(' ')) {
+      nueva++;
+    }
+  }
+  return salida;
+}
+
+/** Definiciones que el diff anade (solo ficheros de codigo). */
+export function definicionesNuevas(diff: string): Definicion[] {
+  const vistas = new Set<string>();
+  const salida: Definicion[] = [];
+  for (const { fichero, linea, texto } of lineasAnadidas(diff)) {
+    if (!EXT_CODIGO.test(fichero)) continue;
+    const nombre = nombreDeDefinicion(texto);
+    if (nombre === null || nombre.length < 3) continue;
+    const clave = `${fichero}\0${nombre}`;
+    if (vistas.has(clave)) continue;
+    vistas.add(clave);
+    salida.push({ nombre, fichero, linea });
+  }
+  return salida;
+}
+
+/**
+ * Definiciones existentes a partir de la salida de
+ * `git grep -n -I -E <patron> <ref> -- ...` (lineas `ref:fichero:linea:texto`
+ * o `fichero:linea:texto`).
+ */
+export function definicionesDeGrep(salida: string, ref?: string): Definicion[] {
+  const defs: Definicion[] = [];
+  const prefijo = ref === undefined ? '' : `${ref}:`;
+  for (const raw of salida.split(/\r?\n/)) {
+    if (raw === '') continue;
+    const l = prefijo !== '' && raw.startsWith(prefijo) ? raw.slice(prefijo.length) : raw;
+    const m = /^(.+?):(\d+):(.*)$/.exec(l);
+    if (m === null) continue;
+    const [, fichero, num, texto] = m as unknown as [string, string, string, string];
+    if (!EXT_CODIGO.test(fichero)) continue;
+    const nombre = nombreDeDefinicion(texto);
+    if (nombre !== null && nombre.length >= 3) defs.push({ nombre, fichero, linea: Number(num) });
+  }
+  return defs;
+}
+
+/** Forma comparable de un nombre: sin mayusculas ni separadores. */
+function normal(nombre: string): string {
+  return nombre.toLowerCase().replace(/[_$-]/g, '');
+}
+
+/** ¿Se parecen lo bastante dos nombres como para sospechar duplicacion? */
+export function nombresParecidos(a: string, b: string): boolean {
+  const na = normal(a);
+  const nb = normal(b);
+  if (na === nb) return true;
+  const corto = Math.min(na.length, nb.length);
+  if (corto < 5) return false;
+  return distanciaEdicion(na, nb) <= Math.max(1, Math.floor(corto / 5));
+}
+
+/** Palabras que hacen de un nombre de test una promesa comprobable (ver disfraz-tests.md). */
+const PROMESAS = [
+  'sin efectos', 'no toca', 'intacto', 'limpio', 'antes de', 'nunca', 'siempre', 'solo ', 'ordena',
+  'no cambia', 'no deja', 'no pisa', 'no borra', 'error claro', 'exacto', 'exactamente', 'ninguno',
+  'without', 'never', 'always', 'only ', 'unchanged', 'untouched', 'sorted', 'before',
+];
+
+const PATRONES_TEST: readonly RegExp[] = [
+  /^\s*(?:test|it|describe)(?:\.\w+)?\(\s*(['"`])(.+?)\1/,
+  /^\s*(?:async\s+)?(?:fn|def)\s+(test_[\w]+)/,
+];
+
+/** Tests que el diff anade con un nombre que promete algo comprobable. */
+export function testsQuePrometen(diffTests: string): Definicion[] {
+  const salida: Definicion[] = [];
+  for (const { fichero, linea, texto } of lineasAnadidas(diffTests)) {
+    let nombre: string | null = null;
+    for (const re of PATRONES_TEST) {
+      const m = re.exec(texto);
+      if (m !== null) {
+        nombre = (m[2] ?? m[1] ?? '').replace(/_/g, ' ');
+        break;
+      }
+    }
+    if (nombre === null) continue;
+    const bajo = ` ${nombre.toLowerCase()} `;
+    if (PROMESAS.some((p) => bajo.includes(p))) salida.push({ nombre, fichero, linea });
+  }
+  return salida;
+}
+
+/** Topes para no inflar la peticion. */
+export const MAX_DEFINICIONES = 15;
+export const MAX_PARECIDOS = 3;
+export const MAX_TESTS = 15;
+
+export function candidatos4D(diffCodigo: string, diffTests: string, existentes: readonly Definicion[]): Candidatos4D {
+  const duplicados: CandidatoDuplicado[] = [];
+  for (const nueva of definicionesNuevas(diffCodigo)) {
+    const parecidas = existentes
+      .filter((e) => !(e.fichero === nueva.fichero && e.nombre === nueva.nombre))
+      .filter((e) => nombresParecidos(nueva.nombre, e.nombre))
+      .slice(0, MAX_PARECIDOS);
+    if (parecidas.length > 0) duplicados.push({ nueva, existentes: parecidas });
+    if (duplicados.length >= MAX_DEFINICIONES) break;
+  }
+  return { duplicados, testsAMutar: testsQuePrometen(diffTests).slice(0, MAX_TESTS) };
+}
+
+const loc = (d: Definicion): string => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;
+
+/** La seccion `## Candidatos 4D` de la peticion. */
+export function seccionCandidatos4D(c: Candidatos4D): string {
+  const cabecera =
+    `${SECCION_CANDIDATOS_4D}\n\n` +
+    'Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).\n\n';
+  if (c.duplicados.length === 0 && c.testsAMutar.length === 0) {
+    return `${cabecera}Sin candidatos: ninguna definicion nueva se parece a una existente y ningun test nuevo promete algo que haya que mutar.\n\n`;
+  }
+  let texto = cabecera;
+  if (c.duplicados.length > 0) {
+    texto +=
+      '### Posible duplicacion\n\n' +
+      'Definiciones nuevas con nombre igual o parecido a otra que ya existia en la rama base. ' +
+      'Mira si hacen lo mismo con pequenas diferencias (duplicacion real = IMPORTANTE).\n\n' +
+      c.duplicados.map((d) => `- ${loc(d.nueva)} ~ ${d.existentes.map(loc).join(', ')}\n`).join('') +
+      '\n';
+  }
+  if (c.testsAMutar.length > 0) {
+    texto +=
+      '### Tests a mutar\n\n' +
+      'Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ' +
+      'ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).\n\n' +
+      c.testsAMutar.map((t) => `- «${t.nombre}» (${t.fichero}:${String(t.linea)})\n`).join('') +
+      '\n';
+  }
+  return texto;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index c37936a..50cc7a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -633,6 +633,26 @@ export function runCodexReview(invocation: CodexReviewInvocation): CodexReviewOu
  * si `paths` esta vacio, sin llamar a Git (una peticion sin ficheros no
  * tiene nada que pedirle).
  */
+/**
+ * TASK-153b: lineas con pinta de definicion (funcion, clase, constante,
+ * `nombre() {` de bash) en `ref`, como `ref:fichero:linea:texto`. Es la
+ * materia prima de los candidatos 4D: lo que YA existia antes de la tarea.
+ * El filtro fino (que linea es de verdad una definicion y de que lenguaje)
+ * lo hace `definicionesDeGrep`, en core. Sin coincidencias, git grep sale con
+ * 1 y sin stderr: eso es '' (no hay definiciones), no un error.
+ */
+export function definicionesEnRef(ref: string, cwd: string): string {
+  const patron =
+    '(function|class|fn|def|const|let|var|struct|interface|record|enum)[[:space:]]+[A-Za-z_$]' +
+    '|^[[:space:]]*[A-Za-z_][A-Za-z0-9_-]*[[:space:]]*\\(\\)[[:space:]]*\\{';
+  try {
+    return runGit([...SIN_COMILLAS, 'grep', '-n', '-I', '-E', patron, ref, '--'], cwd);
+  } catch (e) {
+    if (e instanceof GitCommandError && e.stderr.trim() === '') return '';
+    throw e;
+  }
+}
+
 export function diffRangeForPaths(
   desde: string,
   hasta: string,
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-153b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153b/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153b/tarea.md                                                       |   8 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      |  26 ++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/candidatos-4d.js                                   | 197 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                               |  20 +++++++++
 12 files changed, 249 insertions(+), 2 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/candidatos-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts | 54 ++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/candidatos-4d.test.ts            | 87 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts               |  6 ++++++
 3 files changed, 147 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 189.3 s
- Commit verificado: 42562c3fb668a8251a18fa580caced8053574736
- Huella: 044abcae7fdbb1e8907601f363f6aa86e592a35c
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 114999 bytes en total):

````
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.1956ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (3.262ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.7292ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (4.9999ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.6775ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.1021ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7364ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1978.0387ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1916.6733ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9985ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2558ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8868ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6609ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.9149ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.4674ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (5.0083ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.0545ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6896ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.6351ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6687ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.3209ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (33.5572ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.9039ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (1.9667ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4982ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3753ms)
✔ revision.md define las 4D con ejemplo y hace IMPORTANTE la duplicacion y el disfraz reales (29.9007ms)
✔ cada revisora da un ejemplo por D en su seccion "## Que se revisa" y remite a revision.md (69.1583ms)
✔ start exige helper buscado, criterio citado y mutacion, anotados en la autorrevision (9.445ms)
✔ TASK-153a: start y revision.md remiten a la guia de patrones de disfraz, que los define (22.9131ms)
✔ TASK-153b: revision.md pide comprobar los candidatos 4D de la peticion y mutar sus tests (3.9697ms)
ℹ tests 711
ℹ suites 0
ℹ pass 711
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 170759.635
[verificar-impacto] node --test termino con 0 en 170.9 s.
````
