# Peticion de revision — TASK-167d (ronda 1)

- Tarea: TASK-167d — tendencia de hallazgos 4D en las metricas (parte d de TASK-167)
- Rama revisada: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
- Rama base: develop
- Commit revisado (HEAD): d2f38080af6cb842097e947926626e75222a2a40
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-167d (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-167d/tarea.md
- tareas/03-en-revision/TASK-167d/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/auditorias-4d.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-auditorias.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/auditoria-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/helpers/auditoria-4d.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts

## Commits a revisar (git log develop..HEAD)

````
d2f3808 docs(TASK-167d): autorrevision
b2e1490 feat(TASK-167d): metricas muestra la tendencia entre auditorias 4D (texto y json), con el resumen leido y validado
e00c635 chore(TASK-167d): tarea en curso
8e1acf4 merge(TASK-167d): develop en feature/task-167-regla-4d-preventiva-en-los-proyectos-que para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index 798c066..481766a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -98,6 +98,8 @@ import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
 import { TRAMO_POR_DEFECTO, calcularEvolucion, formatearEvolucion, type Evolucion } from '../core/evolucion.js';
 import { calcularGrupos, formatearGrupos, type Grupos } from '../core/grupos-metricas.js';
 import { calcularPorVersion, formatearPorVersion, type PorVersion } from '../core/versiones-metricas.js';
+import { formatearSerieAuditorias4D, serieAuditorias4D, type Auditoria4D, type Cifras4D } from '../core/auditoria-4d.js';
+import { leerAuditorias4D } from '../fs/auditorias-4d.js';
 
 export class MetricasCommandError extends Error {}
 
@@ -161,6 +163,8 @@ export interface SalidaJsonMetricas {
   grupos?: Grupos;
   /** TASK-084: con `--por-version`. */
   porVersion?: PorVersion;
+  /** TASK-167d: la serie de auditorias 4D de cada proyecto; solo si algun repo tiene informes. */
+  auditorias4D?: Array<{ proyecto: string; fichero: string; fecha: string; numero: number; cifras: Cifras4D; total: number; cambio: number | null }>;
 }
 
 /** Un repo que se mide: su nombre de proyecto, su raiz y su carpeta de tareas. */
@@ -423,6 +427,8 @@ export interface LecturaRepo {
   advertencias: string[];
   /** Solo los tarea.md invalidos: son lo unico que impide --escribir. */
   invalidas: string[];
+  /** TASK-167d: sus informes de auditoria 4D legibles. */
+  auditorias4D: Auditoria4D[];
 }
 
 /**
@@ -521,7 +527,10 @@ export async function leerRepoMetricas(repo: RepoMetricas, varios: boolean): Pro
   );
   // Los avisos de las filas, sobre TODAS las tareas (tambien con --heuristica).
   for (const f of filas) advertencias.push(...avisosDeFila(f, varios));
-  return { leidas: leidas.map((l) => l.task), filas, advertencias, invalidas };
+  // TASK-167d: la tendencia entre auditorias 4D (la de cada tarea es la columna 4D).
+  const auditorias = await leerAuditorias4D(repo.ruta);
+  advertencias.push(...auditorias.avisos.map((a) => (varios ? `${proyecto}: ${a}` : a)));
+  return { leidas: leidas.map((l) => l.task), filas, advertencias, invalidas, auditorias4D: auditorias.auditorias };
 }
 
 export async function runMetricasCommand(
@@ -576,8 +585,11 @@ export async function runMetricasCommand(
   /** Tarea leida de cada fila, por clave (proyecto, id). */
   const leidaPorClave = new Map<string, TareaLeida>();
   const porRepo: string[] = [];
+  /** TASK-167d: las auditorias 4D de cada proyecto, en el orden de los repos. */
+  const auditoriasPorProyecto: Array<{ proyecto: string; auditorias: Auditoria4D[] }> = [];
   for (const repo of repos) {
     const r = await leerRepoMetricas(repo, varios);
+    if (r.auditorias4D.length > 0) auditoriasPorProyecto.push({ proyecto: repo.proyecto, auditorias: r.auditorias4D });
     advertencias.push(...r.advertencias);
     invalidas.push(...r.invalidas);
     r.filas.forEach((f, i) => leidaPorClave.set(claveTarea(f.proyecto, f.id), r.leidas[i] as TareaLeida));
@@ -605,6 +617,13 @@ export async function runMetricasCommand(
       ...(tramoEvolucion === null ? {} : { evolucion: calcularEvolucion(filas, tramoEvolucion) }),
       ...(conGrupos ? { grupos: calcularGrupos(filas, proyectos) } : {}),
       ...(conPorVersion ? { porVersion: calcularPorVersion(filas) } : {}),
+      ...(auditoriasPorProyecto.length === 0
+        ? {}
+        : {
+            auditorias4D: auditoriasPorProyecto.flatMap(({ proyecto, auditorias }) =>
+              serieAuditorias4D(auditorias).map((a) => ({ proyecto, ...a }))
+            ),
+          }),
     };
     return {
       output: JSON.stringify(objeto),
@@ -662,6 +681,12 @@ export async function runMetricasCommand(
     ];
   };
 
+  /** TASK-167d: la tendencia entre auditorias 4D, por proyecto; nada sin informes. */
+  const seccionAuditorias = auditoriasPorProyecto.flatMap(({ proyecto, auditorias }) => [
+    formatearSerieAuditorias4D(auditorias, varios ? proyecto : null),
+    '',
+  ]);
+
   let metricasPath: string | null = null;
   let escritura: MetricasCommandResult['escritura'] = null;
   if (escribir) {
@@ -706,6 +731,7 @@ export async function runMetricasCommand(
         '',
         ...notasFilaEnriquecida(filas, varios),
         '',
+        ...seccionAuditorias,
         ...seccionTokens(filas),
         NOTA_CALENDARIO,
       ].join('\n'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
index 8312d3c..d545391 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
@@ -2,8 +2,13 @@
  * TASK-167c: el formato del informe de la auditoria 4D invocable
  * (`skills/auditoria-4d`). Es la fuente unica: la skill lo escribe con estas
  * secciones y cabeceras, su test lo exige, y `taskctl metricas` (TASK-167d)
- * lo lee para la tendencia entre auditorias.
+ * lo lee aqui para la tendencia entre auditorias.
+ *
+ * Las D y las severidades son las de los informes de revision
+ * (`informe-revision.ts`): el mismo hecho, una sola lista.
  */
+import { DIMENSIONES_4D, SEVERIDADES_HALLAZGO, type Dimension4D, type SeveridadHallazgo } from './informe-revision.js';
+import { celdasDe } from './transiciones.js';
 
 /** Carpeta del proyecto donde se dejan los informes. */
 export const CARPETA_AUDITORIA_4D = 'docs';
@@ -11,13 +16,10 @@ export const CARPETA_AUDITORIA_4D = 'docs';
 export const nombreInformeAuditoria4D = (fecha: string): string => `auditoria-4d-${fecha}.md`;
 /**
  * Reconoce un informe por su nombre; el grupo 1 es la fecha y el 2, si lo
- * hay, el numero de la auditoria de ese dia (`-2`, `-3`... la primera no lleva).
+ * hay, el numero de la auditoria de ese dia (`-2`, `-3`...; la primera no
+ * lleva, y `-0`, `-1` o `-02` no son informes).
  */
-export const PATRON_INFORME_AUDITORIA_4D = /^auditoria-4d-(\d{4}-\d{2}-\d{2})(?:-(\d+))?\.md$/;
-
-/** Las cuatro D, en el orden en que salen en el resumen. */
-export const DES_4D = ['Duplicacion', 'Desviacion', 'Diluvio', 'Disfraz'] as const;
-export const SEVERIDADES_4D = ['CRITICO', 'IMPORTANTE', 'MENOR'] as const;
+export const PATRON_INFORME_AUDITORIA_4D = /^auditoria-4d-(\d{4}-\d{2}-\d{2})(?:-([2-9]|[1-9]\d+))?\.md$/;
 
 export const SECCION_RESUMEN_4D = '## Resumen';
 export const SECCION_HALLAZGOS_4D = '## Hallazgos';
@@ -28,8 +30,96 @@ export const SECCION_OLAS_4D = '## Plan por olas';
  * numeros. La tendencia entre auditorias se lee de aqui; la tabla de
  * hallazgos es el detalle (la skill cuenta el resumen a partir de ella).
  */
-export const CABECERA_RESUMEN_4D = `| D | ${SEVERIDADES_4D.join(' | ')} |`;
+export const CABECERA_RESUMEN_4D = `| D | ${SEVERIDADES_HALLAZGO.join(' | ')} |`;
 /** Cabecera de la tabla de `## Hallazgos`. */
 export const CABECERA_HALLAZGOS_4D = '| ID | D | Severidad | Fichero | Hallazgo | Ola |';
 /** Encabezado de cada ola en `## Plan por olas`: `### Ola N: <titulo>`. */
 export const PATRON_OLA_4D = /^### Ola (\d+): (.+)$/;
+
+// --- TASK-167d: lectura del resumen y serie entre auditorias -------------
+
+/** Hallazgos de una auditoria por D y severidad. */
+export type Cifras4D = Record<Dimension4D, Record<SeveridadHallazgo, number>>;
+
+export type LecturaResumen4D = { ok: true; cifras: Cifras4D } | { ok: false; motivo: string };
+
+/**
+ * Las cifras de la tabla de `## Resumen` de un informe. Si no se puede leer
+ * sin adivinar (sin la seccion o su cabecera, una D que falta o repetida, una
+ * cifra que no es un entero, un Total que no es la suma), dice por que.
+ */
+export function leerResumenAuditoria4D(texto: string): LecturaResumen4D {
+  const lineas = texto.replace(/\r/g, '').split('\n').map((l) => l.trim());
+  const inicio = lineas.indexOf(SECCION_RESUMEN_4D);
+  if (inicio === -1) return { ok: false, motivo: `no tiene la seccion "${SECCION_RESUMEN_4D}"` };
+  let i = inicio + 1;
+  while (i < lineas.length && lineas[i] !== CABECERA_RESUMEN_4D && !(lineas[i] as string).startsWith('## ')) i++;
+  if (lineas[i] !== CABECERA_RESUMEN_4D) return { ok: false, motivo: `su resumen no tiene la cabecera "${CABECERA_RESUMEN_4D}"` };
+  const filas = new Map<string, number[]>();
+  for (i += 2; i < lineas.length && (lineas[i] as string).startsWith('|'); i++) {
+    const [nombre = '', ...valores] = celdasDe(lineas[i] as string);
+    if (valores.length !== SEVERIDADES_HALLAZGO.length || valores.some((v) => !/^\d+$/.test(v))) {
+      return { ok: false, motivo: `la fila "${nombre}" del resumen no tiene ${String(SEVERIDADES_HALLAZGO.length)} cifras enteras` };
+    }
+    if (filas.has(nombre)) return { ok: false, motivo: `la fila "${nombre}" esta repetida en el resumen` };
+    filas.set(nombre, valores.map(Number));
+  }
+  const cifras = {} as Cifras4D;
+  for (const d of DIMENSIONES_4D) {
+    const fila = filas.get(d);
+    if (fila === undefined) return { ok: false, motivo: `al resumen le falta la fila "${d}"` };
+    cifras[d] = Object.fromEntries(SEVERIDADES_HALLAZGO.map((s, k) => [s, fila[k] as number])) as Record<SeveridadHallazgo, number>;
+  }
+  const total = filas.get('Total');
+  if (total === undefined) return { ok: false, motivo: 'al resumen le falta la fila "Total"' };
+  const suma = SEVERIDADES_HALLAZGO.map((s) => DIMENSIONES_4D.reduce((acc, d) => acc + cifras[d][s], 0));
+  if (suma.some((v, k) => v !== total[k])) {
+    return { ok: false, motivo: `el Total del resumen (${total.join('/')}) no es la suma de las filas (${suma.join('/')})` };
+  }
+  return { ok: true, cifras };
+}
+
+/** Un informe leido, con su fecha y su numero dentro del dia (1 para el primero). */
+export interface Auditoria4D {
+  fichero: string;
+  fecha: string;
+  numero: number;
+  cifras: Cifras4D;
+}
+
+/** Fecha y numero de un nombre de informe, o null si no es un informe. */
+export function fechaDeInforme4D(fichero: string): { fecha: string; numero: number } | null {
+  const m = PATRON_INFORME_AUDITORIA_4D.exec(fichero);
+  return m === null ? null : { fecha: m[1] as string, numero: m[2] === undefined ? 1 : Number(m[2]) };
+}
+
+/** Total de hallazgos de una auditoria. */
+export const totalAuditoria4D = (c: Cifras4D): number =>
+  DIMENSIONES_4D.reduce((acc, d) => acc + SEVERIDADES_HALLAZGO.reduce((a, s) => a + c[d][s], 0), 0);
+
+/** Las auditorias en orden (fecha y numero del dia), cada una con su cambio respecto a la anterior. */
+export function serieAuditorias4D(auditorias: readonly Auditoria4D[]): Array<Auditoria4D & { total: number; cambio: number | null }> {
+  const orden = [...auditorias].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.numero - b.numero);
+  return orden.map((a, k) => {
+    const total = totalAuditoria4D(a.cifras);
+    const previa = orden[k - 1];
+    return { ...a, total, cambio: previa === undefined ? null : total - totalAuditoria4D(previa.cifras) };
+  });
+}
+
+/** La seccion de texto de `taskctl metricas`; '' sin auditorias. `proyecto` solo con varios repos. */
+export function formatearSerieAuditorias4D(auditorias: readonly Auditoria4D[], proyecto: string | null = null): string {
+  if (auditorias.length === 0) return '';
+  const cabecera = ['auditoria', ...DIMENSIONES_4D, 'total', 'cambio'];
+  const filas = serieAuditorias4D(auditorias).map((a) => [
+    a.numero === 1 ? a.fecha : `${a.fecha}-${String(a.numero)}`,
+    ...DIMENSIONES_4D.map((d) => SEVERIDADES_HALLAZGO.map((s) => String(a.cifras[d][s])).join('/')),
+    String(a.total),
+    a.cambio === null ? '—' : a.cambio > 0 ? `+${String(a.cambio)}` : String(a.cambio),
+  ]);
+  const titulo =
+    `Auditorias 4D${proyecto === null ? '' : ` de ${proyecto}`} (${CARPETA_AUDITORIA_4D}/auditoria-4d-*.md), ` +
+    `hallazgos por D (${SEVERIDADES_HALLAZGO.join('/')}):`;
+  const fila = (c: readonly string[]): string => `| ${c.join(' | ')} |`;
+  return [titulo, fila(cabecera), fila(cabecera.map(() => '---')), ...filas.map(fila)].join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index d5877da..2905122 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -119,7 +119,7 @@ function filaATexto(f: FilaTransicion): string {
 }
 
 /** Las celdas de una linea de tabla, sin las barras de los extremos. */
-function celdasDe(linea: string): string[] {
+export function celdasDe(linea: string): string[] {
   return linea
     .trim()
     .replace(/^\|/, '')
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/auditorias-4d.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/auditorias-4d.ts
new file mode 100644
index 0000000..b1a405a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/auditorias-4d.ts
@@ -0,0 +1,36 @@
+/**
+ * TASK-167d: los informes de auditoria 4D de un repo
+ * (`docs/auditoria-4d-<fecha>.md`, de la skill `auditoria-4d`). Un informe
+ * que no se puede leer es un aviso con su motivo, no un error: las metricas
+ * siguen saliendo.
+ */
+import { readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { CARPETA_AUDITORIA_4D, fechaDeInforme4D, leerResumenAuditoria4D, type Auditoria4D } from '../core/auditoria-4d.js';
+import { listarSiExiste } from './task-store.js';
+
+export interface LecturaAuditorias4D {
+  auditorias: Auditoria4D[];
+  avisos: string[];
+}
+
+export async function leerAuditorias4D(repoRuta: string): Promise<LecturaAuditorias4D> {
+  const carpeta = path.join(repoRuta, CARPETA_AUDITORIA_4D);
+  const nombres = await listarSiExiste(carpeta);
+  const auditorias: Auditoria4D[] = [];
+  const avisos: string[] = [];
+  for (const fichero of nombres.sort()) {
+    const fecha = fechaDeInforme4D(fichero);
+    if (fecha === null) continue;
+    const lectura = leerResumenAuditoria4D(await readFile(path.join(carpeta, fichero), 'utf8'));
+    if (lectura.ok) {
+      auditorias.push({ fichero, ...fecha, cifras: lectura.cifras });
+    } else {
+      avisos.push(
+        `${CARPETA_AUDITORIA_4D}/${fichero} no entra en la tendencia de auditorias 4D: ${lectura.motivo}. ` +
+          'Corrige su tabla de "## Resumen" con el formato de la skill auditoria-4d.'
+      );
+    }
+  }
+  return { auditorias, avisos };
+}
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-167d/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167d/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167d/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167d/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167d/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167d/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167d/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167d/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167d/tarea.md                                                       |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                    | 22 ++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/auditoria-4d.js                                    | 90 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                    |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/auditorias-4d.js                                     | 30 ++++++++++++++++++++++++++++
 13 files changed, 142 insertions(+), 10 deletions(-)
````

## Tests del diff (4 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-auditorias.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/auditoria-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/helpers/auditoria-4d.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-auditorias.test.ts | 59 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/auditoria-4d.test.ts            | 63 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/helpers/auditoria-4d.ts              | 23 +++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts          |  8 ++++----
 4 files changed, 149 insertions(+), 4 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Posible duplicacion con lo que ya existia

Definiciones nuevas con nombre igual o parecido a otra de la rama base. Mira si hacen lo mismo con pequenas diferencias (duplicacion real = IMPORTANTE).

- `fila` (taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts:123) ~ `fila` (taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-transiciones.test.ts:40), `fila` (taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts:86), `fila` (taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts:79) y 5 mas

### Tests a mutar

Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).

- «TASK-167d: el nombre da fecha y numero del dia; la serie ordena y resta; la seccion las muestra» (taskcode-marketplace/plugins/taskcode-plugin/test/core/auditoria-4d.test.ts:44)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 1881.8 s
- Commit verificado: d2f38080af6cb842097e947926626e75222a2a40
- Huella: 2758a99393deeda75036cdd6629795883b16b4c2
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 605619 bytes en total):

````
✔ 10g. la lectura de la tabla discrimina (contraprueba del 10f) (4.008ms)
✔ 11. ninguna skill arrastra marcas de este repo ni rutas de maquina (51.3302ms)
✔ 11b. la marca generica de documento interno discrimina (contraprueba del menor 4) (0.4839ms)
✔ 12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro (29503.253ms)
✔ 13. el plugin entero, con las cuatro skills dentro, sigue validando (14203.4712ms)
✔ 14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2 (7.027ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (20.4461ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.0619ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (5.5551ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (5.2591ms)
✔ 4. name presente, string y en kebab-case valido (2.8872ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (10.1263ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (3.613ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (3.5647ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (4.2792ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (3.3026ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (9.8251ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (2.631ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (1.5885ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (4.9653ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (4.342ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (1.9642ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (2.4998ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (148.9997ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (127.4039ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (307.8272ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (10.9867ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (137.7526ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (15065.2978ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (28449.6347ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (4.868ms)
ℹ tests 2014
ℹ suites 0
ℹ pass 2011
ℹ fail 0
ℹ cancelled 0
ℹ skipped 3
ℹ todo 0
ℹ duration_ms 1866095.3428
[verificar-impacto] node --test termino con 0 en 1866.2 s.
````
