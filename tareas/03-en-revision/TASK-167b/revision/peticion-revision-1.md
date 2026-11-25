# Peticion de revision — TASK-167b (ronda 1)

- Tarea: TASK-167b — detector de duplicados por cuerpo en el diff (parte b de TASK-167)
- Rama revisada: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
- Rama base: develop
- Commit revisado (HEAD): e3f53d539da82c9cb5217bc7878aee9b609fca8e
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-167b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-167b/tarea.md
- tareas/03-en-revision/TASK-167b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts

## Commits a revisar (git log develop..HEAD)

````
e3f53d5 docs(TASK-167b): autorrevision
c96edb5 feat(TASK-167b): review avisa de definiciones nuevas casi identicas por su cuerpo
7fe6cb8 chore(TASK-167b): tarea en curso
5315cce merge(TASK-167b): develop en feature/task-167-regla-4d-preventiva-en-los-proyectos-que para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index df2b01b..661ecf3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -63,7 +63,15 @@ import {
   type VeredictoInforme,
 } from '../core/informe-revision.js';
 import { fenceFor } from '../core/markdown.js';
-import { candidatos4D, definicionesDeGrep, SECCION_CANDIDATOS_4D, seccionCandidatos4D } from '../core/candidatos-4d.js';
+import { candidatos4D, definicionesDeGrep, definicionesNuevas, SECCION_CANDIDATOS_4D, seccionCandidatos4D } from '../core/candidatos-4d.js';
+import type { Definicion } from '../core/candidatos-4d.js';
+import {
+  cuerpoDesde,
+  duplicadosPorCuerpo,
+  seccionDuplicadosPorCuerpo,
+  type DefinicionConCuerpo,
+  type DuplicadoPorCuerpo,
+} from '../core/duplicados-cuerpo.js';
 import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
   currentBranch,
@@ -75,6 +83,7 @@ import {
   diffParaRevision,
   diffRangeForPaths,
   definicionesEnRef,
+  showFileAtRef,
   GitLaunchError,
   GitCommandError,
   statDeFicheros,
@@ -950,7 +959,20 @@ async function runReview(
 
   // TASK-153b: candidatos 4D (pistas de duplicacion y tests a mutar), una vez
   // por ronda y antes de escribir nada. Nunca lanza.
-  const candidatos = seccionCandidatosDeRonda(baseBranch, desde, paraRevision.diff, paraRevision.tests, deps.repoCwd, excluir);
+  let candidatos = seccionCandidatosDeRonda(baseBranch, desde, paraRevision.diff, paraRevision.tests, deps.repoCwd, excluir);
+  // TASK-167b: duplicados por cuerpo (la misma logica con otro nombre). Avisa
+  // antes de abrir la ronda y va a la peticion; no bloquea. Nunca lanza.
+  const porCuerpo = duplicadosDeRonda(baseBranch, paraRevision.diff, deps.repoCwd, excluir);
+  if (porCuerpo.length > 0) {
+    const [p] = porCuerpo as [DuplicadoPorCuerpo];
+    avisos.push(
+      `${id}: ${String(porCuerpo.length)} definicion(es) nueva(s) casi identica(s) a otra por su cuerpo (la primera: ` +
+        `${p.nueva.nombre} en ${p.nueva.fichero}:${String(p.nueva.linea)} ~ ${p.otra.nombre} en ${p.otra.fichero}:` +
+        `${String(p.otra.linea)}, ${String(Math.round(p.parecido * 100))} %). La revision sigue, pero antes conviene ` +
+        `reutilizar lo que ya existe en vez de duplicarlo (busca todos los usos); la lista va en "${SECCION_CANDIDATOS_4D}" de la peticion.`
+    );
+    candidatos += seccionDuplicadosPorCuerpo(porCuerpo);
+  }
 
   // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
   // el diff real de la rama, no `task.agente_revisor` del frontmatter,
@@ -1360,6 +1382,59 @@ function verificacionDeRonda(
   return motivo !== null ? { tipo: 'documentacion', v, motivo } : { tipo: 'selectiva', v };
 }
 
+/** TASK-167b: ficheros de la rama base que se leen como mucho para comparar cuerpos. */
+const MAX_FICHEROS_CUERPO = 400;
+
+/**
+ * TASK-167b: pares de definiciones nuevas del diff casi identicas por su
+ * cuerpo a otra (de la rama base o nueva). Solo se leen ficheros de las
+ * extensiones que trae el diff, una vez cada uno. Nunca lanza: si Git falla,
+ * no hay pares (los candidatos por nombre siguen saliendo).
+ */
+export function duplicadosDeRonda(
+  baseBranch: string,
+  diffCodigo: string,
+  cwd: string,
+  excluir: readonly string[] = []
+): DuplicadoPorCuerpo[] {
+  try {
+    const nuevas = definicionesNuevas(diffCodigo);
+    if (nuevas.length === 0) return [];
+    const extension = (f: string): string => path.posix.extname(f).toLowerCase();
+    const extensiones = new Set(nuevas.map((d) => extension(d.fichero)));
+    const enBase = definicionesDeGrep(definicionesEnRef(baseBranch, cwd, excluir), baseBranch).filter((d) =>
+      extensiones.has(extension(d.fichero))
+    );
+    const permitidos = new Set([...new Set(enBase.map((d) => d.fichero))].slice(0, MAX_FICHEROS_CUERPO));
+    const lector = (ref: string): ((f: string) => string[] | null) => {
+      const cache = new Map<string, string[] | null>();
+      return (f) => {
+        if (!cache.has(f)) {
+          let lineas: string[] | null = null;
+          try {
+            lineas = showFileAtRef(ref, f, cwd).split(/\r?\n/);
+          } catch {
+            lineas = null;
+          }
+          cache.set(f, lineas);
+        }
+        return cache.get(f) ?? null;
+      };
+    };
+    const conCuerpo = (defs: readonly Definicion[], leer: (f: string) => string[] | null): DefinicionConCuerpo[] =>
+      defs.flatMap((def) => {
+        const lineas = leer(def.fichero);
+        return lineas === null ? [] : [{ def, cuerpo: cuerpoDesde(lineas, def.linea) }];
+      });
+    return duplicadosPorCuerpo(
+      conCuerpo(nuevas, lector('HEAD')),
+      conCuerpo(enBase.filter((d) => permitidos.has(d.fichero)), lector(baseBranch))
+    );
+  } catch {
+    return [];
+  }
+}
+
 /**
  * TASK-153b: la seccion de candidatos 4D de la ronda. Las definiciones nuevas
  * salen del diff de codigo de la ronda; las existentes, de la rama base (lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts
new file mode 100644
index 0000000..e203b8c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts
@@ -0,0 +1,165 @@
+/**
+ * TASK-167b (Regla 4D preventiva): duplicados por CUERPO.
+ *
+ * Los candidatos de `candidatos-4d.ts` comparan nombres; la duplicacion que
+ * mas repitieron las auditorias 4D es la misma logica con otro nombre. Aqui
+ * se compara lo que hace cada definicion: su cuerpo normalizado (sin
+ * comentarios, con cadenas, numeros e identificadores genericos) en tejas de
+ * tokens, por Jaccard. Sin parser por lenguaje: sirve para los que extrae
+ * candidatos-4d (llaves; Python por sangria).
+ *
+ * Puro: recibe lineas y definiciones y devuelve pares. Quien lee ficheros y
+ * Git es `commands/review.ts`.
+ */
+import type { Definicion } from './candidatos-4d.js';
+import { sinComentariosC } from './doctor-deploy-reglas.js';
+
+/** Parecido minimo (Jaccard de tejas) para contar como duplicado. */
+export const UMBRAL_PARECIDO = 0.85;
+/** Tokens minimos del cuerpo: por debajo, un envoltorio de una linea, no una duplicacion que importe. */
+export const MIN_TOKENS = 30;
+/** Lineas maximas que se leen de un cuerpo. */
+const MAX_LINEAS_CUERPO = 200;
+/** Tokens por teja. */
+const TEJA = 4;
+
+/** Una definicion con su cuerpo ya leido. */
+export interface DefinicionConCuerpo {
+  def: Definicion;
+  cuerpo: string;
+}
+
+export interface DuplicadoPorCuerpo {
+  nueva: Definicion;
+  otra: Definicion;
+  /** Parecido de 0 a 1. */
+  parecido: number;
+}
+
+/**
+ * El cuerpo de la definicion que empieza en la linea `desde` (1-based): hasta
+ * equilibrar las llaves si las hay; si la linea termina en `:` (Python), las
+ * lineas siguientes con mas sangria. Como mucho MAX_LINEAS_CUERPO.
+ */
+export function cuerpoDesde(lineas: readonly string[], desde: number): string {
+  const i0 = desde - 1;
+  const primera = lineas[i0];
+  if (primera === undefined) return '';
+  if (/:\s*(#.*)?$/.test(primera) && !primera.includes('{')) {
+    const sangria = /^\s*/.exec(primera)?.[0].length ?? 0;
+    const salida = [primera];
+    for (let i = i0 + 1; i < lineas.length && salida.length < MAX_LINEAS_CUERPO; i++) {
+      const l = lineas[i] as string;
+      if (l.trim() !== '' && (/^\s*/.exec(l)?.[0].length ?? 0) <= sangria) break;
+      salida.push(l);
+    }
+    return salida.join('\n');
+  }
+  let nivel = 0;
+  let abierto = false;
+  const salida: string[] = [];
+  for (let i = i0; i < lineas.length && salida.length < MAX_LINEAS_CUERPO; i++) {
+    const l = lineas[i] as string;
+    salida.push(l);
+    for (const c of sinCadenas(sinComentariosC(l))) {
+      if (c === '{') {
+        nivel++;
+        abierto = true;
+      } else if (c === '}') {
+        nivel--;
+      }
+    }
+    if (abierto && nivel <= 0) break;
+  }
+  return salida.join('\n');
+}
+
+/** Cadenas ('...', "...", `...`) sustituidas por una marca: sus llaves y su texto no cuentan. */
+function sinCadenas(t: string): string {
+  return t.replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, ' s ');
+}
+
+const PALABRAS_CLAVE = new Set(
+  (
+    'if else for while do return function const let var class new try catch finally throw switch case break ' +
+    'continue await async yield import export from of in typeof instanceof null undefined true false this super ' +
+    'def elif lambda pass raise with as not and or is None True False self fn pub mut impl match struct enum ' +
+    'public private protected static void int string bool boolean final override interface extends implements'
+  ).split(' ')
+);
+
+/** Tokens normalizados del cuerpo: identificadores a `id`, numeros a `n`, cadenas a `s`. */
+export function tokensNormalizados(cuerpo: string): string[] {
+  const limpio = sinCadenas(sinComentariosC(cuerpo));
+  const tokens = limpio.match(/[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|[^\s\w]/g) ?? [];
+  return tokens.map((t) => (/^\d/.test(t) ? 'n' : /^[A-Za-z_$]/.test(t) ? (PALABRAS_CLAVE.has(t) || t === 's' ? t : 'id') : t));
+}
+
+function tejas(tokens: readonly string[]): Set<string> {
+  const salida = new Set<string>();
+  for (let i = 0; i + TEJA <= tokens.length; i++) salida.add(tokens.slice(i, i + TEJA).join(' '));
+  return salida;
+}
+
+/** Jaccard de dos conjuntos de tejas. */
+function jaccard(a: Set<string>, b: Set<string>): number {
+  if (a.size === 0 || b.size === 0) return 0;
+  let comunes = 0;
+  for (const x of a) if (b.has(x)) comunes++;
+  return comunes / (a.size + b.size - comunes);
+}
+
+interface Huella {
+  d: DefinicionConCuerpo;
+  n: number;
+  tejas: Set<string>;
+}
+
+function huella(d: DefinicionConCuerpo): Huella | null {
+  const tokens = tokensNormalizados(d.cuerpo);
+  return tokens.length < MIN_TOKENS ? null : { d, n: tokens.length, tejas: tejas(tokens) };
+}
+
+const misma = (a: Definicion, b: Definicion): boolean => a.fichero === b.fichero && a.nombre === b.nombre;
+/** Tamanos comparables: si uno dobla al otro no pueden pasar el umbral, y se ahorra la comparacion. */
+const comparables = (a: number, b: number): boolean => Math.min(a, b) / Math.max(a, b) >= UMBRAL_PARECIDO;
+
+/**
+ * Pares de definiciones nuevas con otra (existente o nueva) de cuerpo casi
+ * identico, del mas parecido al menos. Una definicion no se compara consigo
+ * misma (mismo fichero y nombre: es la misma funcion, cambiada).
+ */
+export function duplicadosPorCuerpo(
+  nuevas: readonly DefinicionConCuerpo[],
+  existentes: readonly DefinicionConCuerpo[]
+): DuplicadoPorCuerpo[] {
+  const hn = nuevas.map(huella).filter((h): h is Huella => h !== null);
+  const he = existentes.map(huella).filter((h): h is Huella => h !== null);
+  const pares: DuplicadoPorCuerpo[] = [];
+  hn.forEach((a, i) => {
+    for (const b of [...he, ...hn.slice(i + 1)]) {
+      if (misma(a.d.def, b.d.def) || !comparables(a.n, b.n)) continue;
+      const parecido = jaccard(a.tejas, b.tejas);
+      if (parecido >= UMBRAL_PARECIDO) pares.push({ nueva: a.d.def, otra: b.d.def, parecido });
+    }
+  });
+  return pares.sort((x, y) => y.parecido - x.parecido);
+}
+
+/** La lista para `## Candidatos 4D` y el aviso de `review`; '' sin pares. */
+export function seccionDuplicadosPorCuerpo(pares: readonly DuplicadoPorCuerpo[], max = 10): string {
+  if (pares.length === 0) return '';
+  const loc = (d: Definicion): string => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;
+  const resto = pares.length > max ? `- ... y ${String(pares.length - max)} mas\n` : '';
+  return (
+    '### Posible duplicacion por cuerpo\n\n' +
+    'Definiciones nuevas casi identicas a otra, aunque se llamen distinto (Regla 4D: busca todos los usos y ' +
+    'unifica; duplicacion real = IMPORTANTE).\n\n' +
+    pares
+      .slice(0, max)
+      .map((p) => `- ${loc(p.nueva)} ~ ${loc(p.otra)}: ${String(Math.round(p.parecido * 100))} %\n`)
+      .join('') +
+    resto +
+    '\n'
+  );
+}
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-167b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167b/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167b/tarea.md                                                       |   8 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      |  61 +++++++++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/duplicados-cuerpo.js                               | 123 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 11 files changed, 188 insertions(+), 4 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts | 34 ++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts        | 70 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 104 insertions(+)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Posible duplicacion con lo que ya existia

Definiciones nuevas con nombre igual o parecido a otra de la rama base. Mira si hacen lo mismo con pequenas diferencias (duplicacion real = IMPORTANTE).

- `extension` (taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:1403) ~ `extension` (taskcode-marketplace/plugins/taskcode-plugin/src/core/cobertura-cambios.ts:44)
- `Huella` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:112) ~ `huella` (taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts:68), `huella` (taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-tag.test.ts:40)
- `huella` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:118) ~ `huella` (taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts:68), `huella` (taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-tag.test.ts:40)
- `loc` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:152) ~ `loc` (taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts:276)

### Posible duplicacion dentro de la tarea

Definiciones nuevas parecidas entre si: la misma tarea puede estar escribiendo dos veces lo mismo.

- `Huella` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:112) ~ `huella` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:118)

### Posible duplicacion por cuerpo

Definiciones nuevas casi identicas a otra, aunque se llamen distinto (Regla 4D: busca todos los usos y unifica; duplicacion real = IMPORTANTE).

- `misma` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:123) ~ `comparables` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:125): 93 %
- `comparables` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:125) ~ `duplicadosPorCuerpo` (taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:132): 87 %


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 1421.9 s
- Commit verificado: e3f53d539da82c9cb5217bc7878aee9b609fca8e
- Huella: 718c333f0ceef07925af1f52f5bbe39568689311
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 534969 bytes en total):

````
✔ 10g. la lectura de la tabla discrimina (contraprueba del 10f) (3.5331ms)
✔ 11. ninguna skill arrastra marcas de este repo ni rutas de maquina (345.5205ms)
✔ 11b. la marca generica de documento interno discrimina (contraprueba del menor 4) (0.5167ms)
✔ 12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro (33356.0617ms)
✔ 13. el plugin entero, con las cuatro skills dentro, sigue validando (17966.9247ms)
✔ 14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2 (4.0838ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (20.6971ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.5282ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (2.9261ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (33.1643ms)
✔ 4. name presente, string y en kebab-case valido (22.2822ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (411.3728ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (86.2493ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (28.8434ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (4.652ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (15.8814ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (295.0602ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (46.0932ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (5.9744ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (18.0232ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (23.7955ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (27.3259ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (3.3224ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (975.2277ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (360.9773ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (901.3701ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (41.8574ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (210.6445ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (18092.6646ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (31999.2772ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (3.4618ms)
ℹ tests 1604
ℹ suites 0
ℹ pass 1602
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 1409703.2334
[verificar-impacto] node --test termino con 0 en 1409.8 s.
````
