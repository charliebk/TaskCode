# Peticion de revision — TASK-084 (ronda 1)

- Tarea: TASK-084 — Version del plugin en cada tarea y metricas por version
- Rama revisada: feature/task-084-version-del-plugin-en-cada-tarea-y-metri
- Rama base: develop
- Commit revisado (HEAD): 37185ea499e4b841a74fc497ef22c1288148bd2c
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-084 (criterios de aceptacion y plan)

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
37185ea feat(TASK-084): version del plugin en cada transicion y metricas --por-version
f2c146b chore(TASK-084): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.claude-plugin/marketplace.json b/.claude-plugin/marketplace.json
index 1b90d7d..5544382 100644
--- a/.claude-plugin/marketplace.json
+++ b/.claude-plugin/marketplace.json
@@ -5,14 +5,14 @@
     "url": "https://github.com/charliebk"
   },
   "description": "Marketplace de TaskCode: metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
-  "version": "0.11.0",
+  "version": "0.12.0",
   "plugins": [
     {
       "name": "taskcode-plugin",
       "displayName": "TaskCode",
       "source": "./taskcode-marketplace/plugins/taskcode-plugin",
       "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista. Expone el CLI taskctl.",
-      "version": "0.11.0",
+      "version": "0.12.0",
       "author": {
         "name": "charlie.bk"
       },
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 57ccf40..9c3b8f6 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,5 +1,20 @@
 # Changelog
 
+## 0.12.0 — sin publicar
+
+Version del plugin en cada tarea (TASK-084). Cada fila de `## Transiciones`
+lleva como quinta columna la version de `taskctl` que la escribio; las filas
+anteriores, de 4 columnas, se siguen leyendo igual y siguen congelando el modo.
+La primera fila con version bajo una cabecera de 4 columnas amplia solo la
+cabecera y su separador, para que se vea en GitHub y GitLab. `taskctl metricas
+--por-version [--json]` agrupa las terminadas por la version de su ultimo
+`finish`, en orden semver: rondas, aprobadas a la primera, hallazgos por
+severidad y origen y tokens por fase; las que no la llevan anotada van aparte,
+nunca deducidas por fecha. La version vive en `src/core/version.ts` y un test
+exige que coincida con `package.json` y `plugin.json`. Regla nueva: la version
+se sube al abrir el ciclo, no al publicar. Un taskctl anterior no lee las filas
+nuevas: una version del plugin por repo.
+
 ## 0.11.0 — 2026-11-06
 
 Accesibilidad y roles del brainstorm (TASK-080). `angular-vue-reviewer` revisa la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
index 2b222a2..65ee0b5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
@@ -1,7 +1,7 @@
 {
   "name": "taskcode-plugin",
   "displayName": "TaskCode",
-  "version": "0.11.0",
+  "version": "0.12.0",
   "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
   "author": {
     "name": "charlie.bk"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index e0e766f..d37ef3e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -282,11 +282,11 @@ ejecución aplicado:
 
 ```
 $ node bin/taskctl --help
-taskctl 0.11.0 — TaskCode
+taskctl 0.12.0 — TaskCode
 [...]
 
 $ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
-taskctl 0.11.0 — TaskCode
+taskctl 0.12.0 — TaskCode
 [...]                            # salida idéntica
 
 $ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
@@ -1157,11 +1157,39 @@ de hallazgos. Los grupos son fijos: uno sin tareas sale con 0 y «—».
 `--evolucion` y `--grupos` se combinan entre sí y con `--repo`, no con
 `--heuristica`, `--tokens` ni `--escribir`.
 
+**`--por-version`** (desde la 0.12.0) agrupa las tareas terminadas por la
+versión de `taskctl` con la que se cerraron: la de la columna `version` de la
+última fila `finish` de `## Transiciones` (un `finish` abortado y reintentado
+con otro plugin deja dos; cuenta el último). Por versión, en orden semver
+(0.9 antes que 0.10; una pre-release como `0.12.0-dev` antes de su release):
+tareas, con revisión, % aprobado a la primera, rondas medias, tokens medios por
+fase (con su `n`) y una segunda tabla con los hallazgos por severidad y por
+origen (de las tareas con tabla de hallazgos). Las tareas sin versión anotada
+(cerradas antes de la 0.12.0, medidas con los commits o con la celda editada a
+mano) van a un grupo «sin version» aparte: la versión **nunca se deduce por la
+fecha de cierre**. Se combina como `--evolucion` y `--grupos`.
+
+**La columna `version` de `## Transiciones`.** Desde la 0.12.0 cada transición
+anota la versión de `taskctl` que la escribió, como quinta columna. Las filas
+anteriores, de cuatro columnas, se siguen leyendo igual (y siguen congelando el
+modo). La primera fila con versión que se añade bajo una cabecera de cuatro
+columnas cambia **solo la cabecera y su separador** a cinco, para que la
+versión se vea en GitHub y GitLab; las filas viejas no se tocan. Un `taskctl`
+anterior a la 0.12.0 no reconoce las filas de cinco columnas y deja de ver el
+modo congelado de esa tarea: **usa la misma versión del plugin en todo el
+repo**. Para que la versión anotada sea útil, se sube al **abrir** el ciclo de
+una versión nueva (la primera tarea que la construye), no al publicarla.
+
 **`--json`** escribe en stdout un único objeto JSON
 (`{proyectos: [{proyecto, ruta, tareas}], sinCoste: {terminadas, total, porFase,
-tareas}, evolucion?, grupos?}`), también sin tareas; los avisos y la lista de
+tareas}, evolucion?, grupos?, porVersion?}`), también sin tareas; los avisos y la lista de
 repos van por stderr. Cada `null` va junto a un `n: 0` en el mismo objeto; nunca
-`NaN`. Solo se combina con `--repo`, `--evolucion`, `--tramo` y `--grupos`: con
+`NaN`. `porVersion` es `{terminadas, versiones: [...], sinVersion}`, con cada grupo
+en la forma `{version, n, conRevision, aprobadasPrimera, pctAprobadaPrimera,
+rondasMedia, sinRevision, conHallazgos, sinTablaHallazgos, hallazgosPorSeveridad,
+hallazgosPorOrigen, tokens: {diseno, implementacion, revision}}` (cada fase
+`{suma, conDato, media}`). Solo se combina con `--repo`, `--evolucion`, `--tramo`,
+`--grupos` y `--por-version`: con
 cualquier otro flag aborta sin leer ni escribir nada.
 
 En cualquier comando de `taskctl`, un flag repetido que no admite repetición
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package.json b/taskcode-marketplace/plugins/taskcode-plugin/package.json
index 14bf75a..ad79e4c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package.json
@@ -1,6 +1,6 @@
 {
   "name": "taskcode-plugin",
-  "version": "0.11.0",
+  "version": "0.12.0",
   "description": "TaskCode: metodologia de tareas/sprints + Git-Flow + revision por pares de agentes, como plugin de Claude Code.",
   "private": true,
   "engines": {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 5273c58..26850c9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -28,8 +28,10 @@ rama de un merge request: `finish --merge-request` la sube siempre, porque sin
 ella no hay merge request; en `automatico` con `cierre_por_defecto:
 merge-request` eso ocurre sin preguntar, y el tag nunca se sube sin `--push`),
 y cada transicion deja
-una fila en la seccion `## Transiciones` de `tarea.md` (fecha, fase, modo y
-quien decidio) en el mismo commit que la transicion.
+una fila en la seccion `## Transiciones` de `tarea.md` (fecha, fase, modo,
+quien decidio y la version de taskctl que la escribio) en el mismo commit que
+la transicion. Un taskctl anterior no lee las filas con version: usa la misma
+version del plugin en todo el repo.
 
 Al cerrar, la skill `finish` pregunta en `manual` y `semiautomatico` (merge
 normal, merge request, tag opcional); en `automatico` no pregunta y usa el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 4167f72..2eb6b3c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -58,8 +58,9 @@ import {
 // del repo.
 import { ConfigError } from './core/config.js';
 import { formatearInstante } from './core/transiciones.js';
+import { VERSION_TASKCTL } from './core/version.js';
 
-const VERSION = '0.11.0';
+const VERSION = VERSION_TASKCTL;
 
 const HELP = `taskctl ${VERSION} — TaskCode
 
@@ -75,7 +76,7 @@ Uso:
                  [--agente-revisor ...]
   taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
   taskctl metricas [--heuristica] [--tokens [--escribir]] [--repo <ruta>]...
-  taskctl metricas [--evolucion [--tramo N]] [--grupos] [--json] [--repo <ruta>]...
+  taskctl metricas [--evolucion [--tramo N]] [--grupos] [--por-version] [--json] [--repo <ruta>]...
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--decidido-por persona|automatico] [--push]
@@ -110,8 +111,10 @@ resumen por sprint y por complejidad; con --escribir lo
 regenera en el bloque delimitado de docs/METRICAS.md (sin commitear). Sin
 --escribir solo lee. --repo <ruta> (repetible) junta varios proyectos; --evolucion
 [--tramo N] da las terminadas por tramos de cierre y --grupos las agrupa por tipo,
-complejidad, criterios, KB de peticion de revision y proyecto; --json da un unico
-objeto JSON (solo con --repo, --evolucion, --tramo y --grupos).
+complejidad, criterios, KB de peticion de revision y proyecto; --por-version agrupa
+las terminadas por la version de taskctl de su ultimo finish (las que no la llevan
+anotada, aparte); --json da un unico objeto JSON (solo con --repo, --evolucion,
+--tramo, --grupos y --por-version).
 Un flag repetido que no admite repeticion aborta en cualquier comando.
 registrar-coste SUMA al coste de una fase de la tarea (en cualquier estado) y lo commitea:
 --agente <id> lee lo gastado de la transcripcion de cada subagente (el id lo devuelve la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index 5697168..9794a73 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -31,6 +31,10 @@
  * lleva su proyecto y toda la lectura va con la clave (proyecto, id), asi que
  * un mismo TASK-NNN en dos repos no mezcla datos. Sin `--repo` se lee el repo
  * actual y la salida es la de siempre.
+ *
+ * TASK-084: `--por-version` agrupa las terminadas por la version de taskctl
+ * de su ultimo `finish` (`core/versiones-metricas.ts`). Es otro agregado,
+ * como `--evolucion` y `--grupos`: se combina con ellos y con `--json`.
  */
 import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
@@ -78,6 +82,7 @@ import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/t
 import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
 import { TRAMO_POR_DEFECTO, calcularEvolucion, formatearEvolucion, type Evolucion } from '../core/evolucion.js';
 import { calcularGrupos, formatearGrupos, type Grupos } from '../core/grupos-metricas.js';
+import { calcularPorVersion, formatearPorVersion, type PorVersion } from '../core/versiones-metricas.js';
 
 export class MetricasCommandError extends Error {}
 
@@ -89,6 +94,7 @@ export const FLAGS_METRICAS: readonly string[] = [
   '--evolucion',
   '--tramo',
   '--grupos',
+  '--por-version',
   '--json',
 ];
 
@@ -98,7 +104,7 @@ export const FLAGS_METRICAS: readonly string[] = [
  * nada: su salida es texto o un fichero, y mezclarla con el JSON romperia a
  * quien lo lea.
  */
-export const FLAGS_CON_JSON: readonly string[] = ['--repo', '--evolucion', '--tramo', '--grupos'];
+export const FLAGS_CON_JSON: readonly string[] = ['--repo', '--evolucion', '--tramo', '--grupos', '--por-version'];
 
 /** Ruta de docs/METRICAS.md dentro del repo del usuario. */
 export function metricasFilePath(repoCwd: string): string {
@@ -134,6 +140,8 @@ export interface SalidaJsonMetricas {
   sinCoste: ResumenSinCoste;
   evolucion?: Evolucion;
   grupos?: Grupos;
+  /** TASK-084: con `--por-version`. */
+  porVersion?: PorVersion;
 }
 
 /** Un repo que se mide: su nombre de proyecto, su raiz y su carpeta de tareas. */
@@ -170,6 +178,8 @@ interface FlagsMetricas {
   evolucion: number | null;
   /** TASK-065: `--grupos`. */
   grupos: boolean;
+  /** TASK-084: `--por-version`. */
+  porVersion: boolean;
   /** TASK-065: `--json`. */
   json: boolean;
 }
@@ -239,17 +249,18 @@ function parseFlagsMetricas(argv: readonly string[]): FlagsMetricas {
     repos,
     evolucion: null as number | null,
     grupos: flagSuelto(flags, 'grupos'),
+    porVersion: flagSuelto(flags, 'por-version'),
     json,
   };
   const conEvolucion = flagSuelto(flags, 'evolucion');
   const tramo = leerTramo(flags['tramo'], conEvolucion);
   if (conEvolucion) f.evolucion = tramo;
-  if (conEvolucion || f.grupos) {
+  if (conEvolucion || f.grupos || f.porVersion) {
     // Los agregados sustituyen a la tabla por tarea: lo que anaden --heuristica
     // y --tokens (columnas y resumenes de esa tabla) no saldria en ningun sitio.
     const choca = (['heuristica', 'tokens', 'escribir'] as const).filter((k) => f[k]);
     if (choca.length > 0) {
-      const agregado = conEvolucion ? '--evolucion' : '--grupos';
+      const agregado = conEvolucion ? '--evolucion' : f.grupos ? '--grupos' : '--por-version';
       throw new MetricasCommandError(
         `[ERROR] ${agregado} no se combina con ${choca.map((k) => `--${k}`).join(' ni ')}: saca agregados ` +
           'en lugar de la tabla por tarea. Lanzalos por separado.'
@@ -497,6 +508,7 @@ export async function runMetricasCommand(
     repos: valoresRepo,
     evolucion: tramoEvolucion,
     grupos: conGrupos,
+    porVersion: conPorVersion,
     json,
   } = parseFlagsMetricas(argv);
   // Como board --escribir: sin tareas/ en este directorio no se crea un
@@ -561,6 +573,7 @@ export async function runMetricasCommand(
       sinCoste: resumenSinCoste(filas),
       ...(tramoEvolucion === null ? {} : { evolucion: calcularEvolucion(filas, tramoEvolucion) }),
       ...(conGrupos ? { grupos: calcularGrupos(filas, proyectos) } : {}),
+      ...(conPorVersion ? { porVersion: calcularPorVersion(filas) } : {}),
     };
     return {
       output: JSON.stringify(objeto),
@@ -575,10 +588,11 @@ export async function runMetricasCommand(
 
   // TASK-065: los agregados sustituyen a la tabla por tarea, y salen tambien
   // sin tareas (con sus ceros y sus n 0 a la vista).
-  if (tramoEvolucion !== null || conGrupos) {
+  if (tramoEvolucion !== null || conGrupos || conPorVersion) {
     const secciones: string[] = [];
     if (tramoEvolucion !== null) secciones.push(formatearEvolucion(calcularEvolucion(filas, tramoEvolucion), varios));
     if (conGrupos) secciones.push(formatearGrupos(calcularGrupos(filas, proyectos)));
+    if (conPorVersion) secciones.push(formatearPorVersion(calcularPorVersion(filas)));
     return {
       output: secciones.join('\n\n'),
       totalTareas: filas.length,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 4b57b4e..7360b80 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -46,7 +46,7 @@
  * (`ResumenCostes`, `ResumenHallazgos`), para que quien agregue no tenga que
  * adivinar si un 0 es un cero o una ausencia.
  */
-import { leerTransiciones, instanteDe, precisionDeFecha, type PrecisionFecha } from './transiciones.js';
+import { leerTransiciones, instanteDe, precisionDeFecha, versionDeCierre, type PrecisionFecha } from './transiciones.js';
 import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState, type TaskType } from './task.js';
 import { FASES_COSTE, leerCostes, resumirCostes, type FaseCoste, type ResumenCostes } from './coste-registro.js';
 import {
@@ -155,6 +155,12 @@ export interface FilaMetricas {
    * de la ronda 1. «Aprobada a la primera» = `rondas === 1` y esto `aprobada`.
    */
   veredictoRonda1: VeredictoInforme | null;
+  /**
+   * TASK-084: version de taskctl del ultimo `finish` del registro; null sin
+   * `finish`, sin version anotada o con origen `git` (que no la lleva). Nunca
+   * se deduce por la fecha.
+   */
+  versionCierre: string | null;
   /** Solo con `--heuristica`. */
   heuristica?: HeuristicaFila;
 }
@@ -301,6 +307,7 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
     total: duracionEntre(marcas.plan, marcas.finish),
     veredictoRonda1: veredictoRonda1(e.informes ?? []),
+    versionCierre: versionDeCierre(e.body),
   };
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index addc917..50a5566 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -27,10 +27,25 @@
  * esa tarea, que es lo que impide aprobar en automatico un plan que se
  * cerro en manual (riesgo del plan de TASK-055).
  *
- * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas ni
- * toca nada fuera de su seccion.
+ * TASK-084: quinta columna `version`, la de taskctl que escribio la fila
+ * (`VERSION_TASKCTL`). Es lo que agrupa `taskctl metricas --por-version`
+ * (la version del ultimo `finish`), y sustituye a deducirla por la fecha de
+ * cierre, que casi lleva a error. La lectura acepta filas de 4 celdas (las
+ * anteriores, sin version) y de 5. A diferencia de la columna `hora` que
+ * descarto TASK-052, aqui el lector nuevo no pierde las filas viejas. Lo que
+ * se pierde es lo mismo que entonces: un plugin ANTERIOR descarta las filas
+ * de 5 celdas y deja de ver el modo congelado; se acepta con una version del
+ * plugin por repo.
+ *
+ * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas de
+ * datos ni toca nada fuera de su seccion. UNICA excepcion (TASK-084,
+ * decidida por Carlos): la primera fila con version que se anade bajo una
+ * cabecera de 4 columnas cambia la cabecera y su separador a 5, porque en
+ * GFM la celda que sobra respecto a la cabecera no se muestra. Las filas
+ * viejas no se tocan: GFM les pone la quinta celda vacia.
  */
 import { MODOS_FLUJO, type ModoFlujo } from './config.js';
+import { VERSION_TASKCTL } from './version.js';
 
 export const SECCION_TRANSICIONES = '## Transiciones';
 
@@ -46,8 +61,17 @@ export interface FilaTransicion {
   fase: FaseRegistrada;
   modo: ModoFlujo;
   decidido_por: DecididoPor;
+  /**
+   * TASK-084: version de taskctl que escribio la fila; null en las filas
+   * anteriores (4 celdas) o con una celda que no es una version. Al
+   * escribir, omitirla deja la celda vacia.
+   */
+  version?: string | null;
 }
 
+/** `MAYOR.MENOR.PARCHE` con pre-release opcional (`0.12.0-dev`). */
+export const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
+
 /** Precision de la celda `fecha`: solo el dia, o el instante al segundo. */
 export type PrecisionFecha = 'dia' | 'segundo';
 
@@ -80,11 +104,43 @@ export function formatearInstante(d: Date): string {
 }
 
 const FASES: readonly FaseRegistrada[] = ['plan', 'approve', 'start', 'review', 'finish', 'pausa'];
-const CABECERA = '| fecha | fase | modo | decidido_por |';
-const SEPARADOR = '|---|---|---|---|';
+const CABECERA = '| fecha | fase | modo | decidido_por | version |';
+const SEPARADOR = '|---|---|---|---|---|';
+/** Las celdas de la cabecera anterior a TASK-084, la unica que se reescribe. */
+const CABECERA_4 = ['fecha', 'fase', 'modo', 'decidido_por'];
+const SEPARADOR_4_RE = /^\|(\s*:?-+:?\s*\|){4}$/;
 
 function filaATexto(f: FilaTransicion): string {
-  return `| ${f.fecha} | ${f.fase} | ${f.modo} | ${f.decidido_por} |`;
+  return `| ${f.fecha} | ${f.fase} | ${f.modo} | ${f.decidido_por} | ${f.version ?? ''} |`;
+}
+
+/** Las celdas de una linea de tabla, sin las barras de los extremos. */
+function celdasDe(linea: string): string[] {
+  return linea
+    .trim()
+    .replace(/^\|/, '')
+    .replace(/\|$/, '')
+    .split('|')
+    .map((c) => c.trim());
+}
+
+/**
+ * TASK-084: si la seccion tiene la cabecera de 4 columnas seguida de su
+ * separador, los cambia a los de 5 (ver la excepcion en la cabecera del
+ * modulo). Cualquier otra forma (ya de 5, editada a mano) se deja tal cual.
+ */
+function ampliarCabecera(lineas: string[], inicio: number, fin: number, enBloque: readonly boolean[]): void {
+  for (let i = inicio + 1; i + 1 < fin; i++) {
+    if (enBloque[i] || !(lineas[i] as string).trimStart().startsWith('|')) continue;
+    const celdas = celdasDe(lineas[i] as string);
+    if (celdas.length === CABECERA_4.length && celdas.every((c, k) => c === CABECERA_4[k])) {
+      if (!enBloque[i + 1] && SEPARADOR_4_RE.test((lineas[i + 1] as string).trim())) {
+        lineas[i] = CABECERA;
+        lineas[i + 1] = SEPARADOR;
+      }
+    }
+    return; // solo la primera linea de tabla puede ser la cabecera
+  }
 }
 
 /** Valla de apertura de CommonMark: 0-3 espacios, 3+ ` o ~ (con ` el texto de info no lleva `). */
@@ -178,6 +234,7 @@ export function anadirTransicion(body: string, fila: FilaTransicion): string {
 
   const [inicio, fin] = rango;
   const enBloque = dentroDeBloque(lineas);
+  ampliarCabecera(lineas, inicio, fin, enBloque);
   let ultimaTabla = -1;
   for (let i = inicio + 1; i < fin; i++) {
     if (!enBloque[i] && (lineas[i] as string).trimStart().startsWith('|')) ultimaTabla = i;
@@ -205,14 +262,10 @@ export function leerTransiciones(body: string): FilaTransicion[] {
   const filas: FilaTransicion[] = [];
   for (let i = rango[0] + 1; i < rango[1]; i++) {
     if (enBloque[i]) continue;
-    const celdas = (lineas[i] as string)
-      .trim()
-      .replace(/^\|/, '')
-      .replace(/\|$/, '')
-      .split('|')
-      .map((c) => c.trim());
-    if (celdas.length !== 4) continue;
-    const [fecha, fase, modo, decidido] = celdas as [string, string, string, string];
+    const celdas = celdasDe(lineas[i] as string);
+    // TASK-084: 4 celdas (filas anteriores, sin version) o 5.
+    if (celdas.length !== 4 && celdas.length !== 5) continue;
+    const [fecha, fase, modo, decidido, celdaVersion] = celdas as [string, string, string, string, string?];
     // TASK-052: dia (filas viejas) o instante (nuevas). El regex del dia a
     // secas haria invisibles las filas nuevas y apagaria en silencio el
     // modo congelado (riesgo del plan): hay un test que lo fija.
@@ -225,6 +278,9 @@ export function leerTransiciones(body: string): FilaTransicion[] {
       fase: fase as FaseRegistrada,
       modo: modo as ModoFlujo,
       decidido_por: decidido as DecididoPor,
+      // Una celda que no es version (vacia, editada a mano) no invalida la
+      // fila: perderla apagaria el modo congelado. Solo queda sin version.
+      version: celdaVersion !== undefined && VERSION_RE.test(celdaVersion) ? celdaVersion : null,
     });
   }
   return filas;
@@ -250,16 +306,30 @@ export function modoDeTarea(body: string, modoConfig: ModoFlujo): ModoFlujo {
  * del config, y con eso queda congelado; en el resto, el congelado.
  * `fecha` es el instante (`formatearInstante`) desde TASK-052; un dia a
  * secas se sigue aceptando para quien no tenga reloj que pasar.
+ * `version` es la de este taskctl (TASK-084); el parametro existe para los
+ * tests, ningun comando lo pasa.
  */
 export function registrarTransicion(
   body: string,
   fase: FaseRegistrada,
   fecha: string,
   modoConfig: ModoFlujo,
-  decididoPor: DecididoPor = 'persona'
+  decididoPor: DecididoPor = 'persona',
+  version: string = VERSION_TASKCTL
 ): string {
   const modo = fase === 'plan' ? modoConfig : modoDeTarea(body, modoConfig);
-  return anadirTransicion(body, { fecha, fase, modo, decidido_por: decididoPor });
+  return anadirTransicion(body, { fecha, fase, modo, decidido_por: decididoPor, version });
+}
+
+/**
+ * TASK-084: version con la que se cerro la tarea, la del ULTIMO `finish` del
+ * registro (un `finish` abortado y reintentado con otro plugin deja dos), o
+ * null si no hay `finish` o no lleva version. Nunca se deduce por la fecha.
+ */
+export function versionDeCierre(body: string): string | null {
+  const finishes = leerTransiciones(body).filter((f) => f.fase === 'finish');
+  const ultimo = finishes[finishes.length - 1];
+  return ultimo?.version ?? null;
 }
 
 // ---------------------------------------------------------------------
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
new file mode 100644
index 0000000..93d54a2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
@@ -0,0 +1,15 @@
+/**
+ * Version de taskctl (TASK-084). Vive en el nucleo, y no en `cli.ts`, porque
+ * cada fila de `## Transiciones` la anota (`core/transiciones.ts`) y el
+ * nucleo no debe depender del punto de entrada.
+ *
+ * Esta repetida en `package.json` y `.claude-plugin/plugin.json`: un test de
+ * empaquetado exige que las tres coincidan, porque una fila escrita con una
+ * version desfasada no se puede corregir sin reescribir historia.
+ *
+ * Regla de publicacion: la version se sube al ABRIR el ciclo (la primera
+ * tarea de la version nueva), no al publicar. Asi las tareas que construyen
+ * una version se cierran con su numero y `taskctl metricas --por-version`
+ * no las mezcla con la anterior.
+ */
+export const VERSION_TASKCTL = '0.12.0';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
new file mode 100644
index 0000000..5592d3b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
@@ -0,0 +1,214 @@
+/**
+ * Metricas por version del plugin (TASK-084, `taskctl metricas --por-version`).
+ * Puro: recibe las filas de metricas y devuelve los grupos y su texto. La E/S
+ * vive en `commands/metricas.ts`.
+ *
+ * Se agrupan las tareas TERMINADAS por `versionCierre`: la version de taskctl
+ * del ultimo `finish` de su registro de Transiciones. No va en `calcularGrupos`
+ * porque alli los grupos son fijos y estos son las versiones que aparezcan, y
+ * porque piden mas cifras (hallazgos por severidad y origen, tokens por fase):
+ * ampliar `GrupoMetricas` cambiaria el `--json` de `--grupos`.
+ *
+ * REGLAS (decididas por Carlos, 2026-11-06):
+ *  - Las tareas sin version anotada (cerradas antes de TASK-084, con origen
+ *    `git`, o con la celda editada a mano) van a `sinVersion`, aparte. Nunca
+ *    se reparten por fecha ni por tag: deducirlo es el error que motiva esto.
+ *  - Orden semver por componentes numericos (0.9.0 < 0.10.0); una
+ *    pre-release (`0.12.0-dev`) va antes de su release.
+ *  - Rondas y «aprobada a la primera», con las reglas de `--grupos`
+ *    (`resumirGrupo`): sobre las tareas con revision.
+ *  - Hallazgos: suma de las tareas con tabla de hallazgos en todos sus
+ *    informes (`conHallazgos`); las revisadas sin tabla se cuentan aparte.
+ *  - Tokens por fase: suma y media de las tareas con dato en esa fase
+ *    (`conDato`); null = sin registrar, no cero.
+ */
+import { media, tablaDeTexto, type FilaMetricas } from './metricas.js';
+import { resumirGrupo } from './grupos-metricas.js';
+import type { ConteoOrigen, ConteoSeveridad } from './informe-revision.js';
+
+/** Tokens de una fase en un grupo; `media` null si ninguna tarea tiene dato. */
+export interface CifraTokens {
+  suma: number;
+  conDato: number;
+  media: number | null;
+}
+
+export interface GrupoVersion {
+  /** La version; null en el grupo de las tareas sin version anotada. */
+  version: string | null;
+  /** Tareas terminadas del grupo. */
+  n: number;
+  conRevision: number;
+  aprobadasPrimera: number;
+  /** Porcentaje (un decimal) sobre `conRevision`; null si es 0. */
+  pctAprobadaPrimera: number | null;
+  rondasMedia: number | null;
+  /** Terminadas sin ningun informe de revision. */
+  sinRevision: number;
+  /** Con tabla de hallazgos en todos sus informes: las unicas que suman hallazgos. */
+  conHallazgos: number;
+  /** Revisadas con algun informe sin tabla de hallazgos (sin dato, no cero). */
+  sinTablaHallazgos: number;
+  hallazgosPorSeveridad: ConteoSeveridad;
+  hallazgosPorOrigen: ConteoOrigen;
+  tokens: { diseno: CifraTokens; implementacion: CifraTokens; revision: CifraTokens };
+}
+
+export interface PorVersion {
+  terminadas: number;
+  /** Una por version encontrada, en orden semver ascendente. */
+  versiones: GrupoVersion[];
+  /** Las terminadas sin version anotada; con n 0 si no hay ninguna. */
+  sinVersion: GrupoVersion;
+}
+
+const VERSION_PARTES_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
+
+function compararIdentificador(a: string, b: string): number {
+  const na = /^\d+$/.test(a);
+  const nb = /^\d+$/.test(b);
+  if (na && nb) return Number(a) - Number(b);
+  if (na !== nb) return na ? -1 : 1; // numerico antes que alfanumerico (semver)
+  return a < b ? -1 : a > b ? 1 : 0;
+}
+
+/**
+ * Orden semver: mayor, menor y parche como numeros; sin pre-release va
+ * despues de con ella; dos pre-releases por identificadores. Lo que no es
+ * una version (no deberia llegar: el registro ya la valida) va al final.
+ */
+export function compararVersiones(a: string, b: string): number {
+  const ma = VERSION_PARTES_RE.exec(a);
+  const mb = VERSION_PARTES_RE.exec(b);
+  if (ma === null || mb === null) return ma === null ? (mb === null ? (a < b ? -1 : a > b ? 1 : 0) : 1) : -1;
+  for (let i = 1; i <= 3; i++) {
+    const d = Number(ma[i]) - Number(mb[i]);
+    if (d !== 0) return d;
+  }
+  const pa = ma[4];
+  const pb = mb[4];
+  if (pa === undefined || pb === undefined) return pa === pb ? 0 : pa === undefined ? 1 : -1;
+  const ia = pa.split('.');
+  const ib = pb.split('.');
+  for (let i = 0; i < Math.min(ia.length, ib.length); i++) {
+    const d = compararIdentificador(ia[i] as string, ib[i] as string);
+    if (d !== 0) return d;
+  }
+  return ia.length - ib.length;
+}
+
+function cifraTokens(valores: readonly (number | null)[]): CifraTokens {
+  const con = valores.filter((v): v is number => v !== null);
+  return { suma: con.reduce((a, b) => a + b, 0), conDato: con.length, media: media(con, 0) };
+}
+
+/** Resumen de un grupo de tareas terminadas; con `filas` vacio, n 0 y cifras null o 0. */
+export function resumirVersion(version: string | null, filas: readonly FilaMetricas[]): GrupoVersion {
+  const g = resumirGrupo(version ?? '', filas);
+  const porSeveridad: ConteoSeveridad = { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 0 };
+  const porOrigen: ConteoOrigen = { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 0 };
+  // Las mismas tareas que cuenta `conHallazgos`: revisadas y con tabla.
+  for (const f of filas) {
+    if (f.rondas === null || f.hallazgos.porSeveridad === null) continue;
+    for (const k of Object.keys(porSeveridad) as (keyof ConteoSeveridad)[]) porSeveridad[k] += f.hallazgos.porSeveridad[k];
+    if (f.hallazgos.porOrigen !== null) {
+      for (const k of Object.keys(porOrigen) as (keyof ConteoOrigen)[]) porOrigen[k] += f.hallazgos.porOrigen[k];
+    }
+  }
+  return {
+    version,
+    n: g.n,
+    conRevision: g.conRevision,
+    aprobadasPrimera: g.aprobadasPrimera,
+    pctAprobadaPrimera: g.pctAprobadaPrimera,
+    rondasMedia: g.rondasMedia,
+    sinRevision: g.sinRevision,
+    conHallazgos: g.conHallazgos,
+    sinTablaHallazgos: g.sinTablaHallazgos,
+    hallazgosPorSeveridad: porSeveridad,
+    hallazgosPorOrigen: porOrigen,
+    tokens: {
+      diseno: cifraTokens(filas.map((f) => f.tokens.diseno)),
+      implementacion: cifraTokens(filas.map((f) => f.tokens.implementacion)),
+      revision: cifraTokens(filas.map((f) => f.tokens.revision)),
+    },
+  };
+}
+
+/** Las tareas TERMINADAS de `filas`, agrupadas por la version de su cierre. */
+export function calcularPorVersion(filas: readonly FilaMetricas[]): PorVersion {
+  const t = filas.filter((f) => f.estado === 'terminada');
+  const versiones = [...new Set(t.map((f) => f.versionCierre).filter((v): v is string => v !== null))].sort(
+    compararVersiones
+  );
+  return {
+    terminadas: t.length,
+    versiones: versiones.map((v) => resumirVersion(v, t.filter((f) => f.versionCierre === v))),
+    sinVersion: resumirVersion(null, t.filter((f) => f.versionCierre === null)),
+  };
+}
+
+function celda(v: number | null): string {
+  return v === null ? '—' : String(v);
+}
+
+function celdaTokens(c: CifraTokens): string {
+  return c.media === null ? '—' : `${String(c.media)} (n=${String(c.conDato)})`;
+}
+
+export const NOTA_POR_VERSION =
+  'Solo tareas terminadas, agrupadas por la version de taskctl de su ultimo finish (columna version ' +
+  'de ## Transiciones). «sin version» = cerradas sin version anotada (antes de anotarla, con origen git ' +
+  'o editadas a mano): nunca se deducen por fecha. «a la primera» y «rondas medias», de las tareas con ' +
+  'revision. Hallazgos: suma de las tareas con tabla de hallazgos (n), una vez por revisor + ID; ' +
+  '«sin tabla» se cuenta aparte, no como cero. Tokens: media por tarea de las que tienen dato en esa ' +
+  'fase (n). «—» = ninguna tarea del grupo tiene ese dato.';
+
+/** Texto de `--por-version`: una tabla de rondas y tokens y otra de hallazgos. */
+export function formatearPorVersion(p: PorVersion): string {
+  const grupos = [...p.versiones, ...(p.sinVersion.n > 0 ? [p.sinVersion] : [])];
+  const nombre = (g: GrupoVersion): string => g.version ?? 'sin version';
+  const general = tablaDeTexto(
+    ['version', 'tareas', 'con revision', 'a la primera', 'rondas medias', 'tokens diseno', 'tokens impl.', 'tokens revision'],
+    grupos.map((g) => [
+      nombre(g),
+      String(g.n),
+      String(g.conRevision),
+      g.pctAprobadaPrimera === null ? '—' : `${String(g.pctAprobadaPrimera)}% (${String(g.aprobadasPrimera)})`,
+      celda(g.rondasMedia),
+      celdaTokens(g.tokens.diseno),
+      celdaTokens(g.tokens.implementacion),
+      celdaTokens(g.tokens.revision),
+    ])
+  );
+  const hallazgos = tablaDeTexto(
+    ['version', 'con tabla', 'sin tabla', 'CRITICO', 'IMPORTANTE', 'MENOR', 'desconocida', 'impl.', 'plan', 'especif.', 'sin clasificar'],
+    grupos.map((g) => {
+      const s = g.hallazgosPorSeveridad;
+      const o = g.hallazgosPorOrigen;
+      return [
+        nombre(g),
+        String(g.conHallazgos),
+        String(g.sinTablaHallazgos),
+        String(s.CRITICO),
+        String(s.IMPORTANTE),
+        String(s.MENOR),
+        String(s.desconocida),
+        String(o.implementacion),
+        String(o.plan),
+        String(o.especificacion),
+        String(o['sin clasificar']),
+      ];
+    })
+  );
+  return [
+    `Por version de ${String(p.terminadas)} tareas terminadas (sin version anotada: ${String(p.sinVersion.n)}).`,
+    '',
+    general,
+    '',
+    'Hallazgos por severidad y origen:',
+    hallazgos,
+    '',
+    NOTA_POR_VERSION,
+  ].join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts
new file mode 100644
index 0000000..112c8b2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts
@@ -0,0 +1,119 @@
+/**
+ * TASK-084: `taskctl metricas --por-version [--json]` por CLI, contra repos
+ * Git temporales reales con tareas cuya tabla `## Transiciones` lleva version
+ * (5 columnas) y tareas anteriores sin ella (4 columnas). Solo lectura.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { conRepos, escribirTareas, metricas, estado, type TareaFixture } from '../helpers/metricas-repos.js';
+import type { SalidaJsonMetricas } from '../../src/commands/metricas.js';
+
+const TAREAS: TareaFixture[] = [
+  // Anterior a la version: tabla de 4 columnas.
+  { id: 'TASK-001', finish: '2026-09-01T10:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'MEN-1', sev: 'MENOR' }] }] },
+  // 0.10.0 (orden semver: va antes que 0.9 si se ordenase como texto, y no debe).
+  { id: 'TASK-002', version: '0.10.0', finish: '2026-10-02T10:00:00Z', tokensRevision: 3000, rondas: [{ veredicto: 'cambios-solicitados', hallazgos: [{ id: 'IMP-1', sev: 'IMPORTANTE' }] }, { veredicto: 'aprobada', hallazgos: [] }] },
+  { id: 'TASK-003', version: '0.9.0', finish: '2026-10-01T10:00:00Z', tokensRevision: 1000, rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'CRI-1', sev: 'CRITICO' }] }] },
+  // finish abortado con 0.9.0 y reintentado con 0.10.0: cuenta el ultimo.
+  {
+    id: 'TASK-004',
+    version: '0.9.0',
+    finish: '2026-10-03T10:00:00Z',
+    filasExtra: ['| 2026-10-04T10:00:00Z | finish | manual | persona | 0.10.0 |'],
+    tokensDiseno: 500,
+  },
+  // Con version pero sin terminar: fuera.
+  { id: 'TASK-005', version: '0.10.0', estado: 'en-curso' },
+];
+
+test('--por-version: agrupa por la version del ultimo finish, en orden semver, y las de 4 columnas aparte', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, TAREAS);
+    const antes = estado(alfa);
+    const r = metricas(alfa, ['--por-version']);
+    assert.equal(r.status, 0, r.stderr);
+    assert.match(r.stdout, /^Por version de 4 tareas terminadas \(sin version anotada: 1\)\./);
+    const filas = r.stdout
+      .split('\n')
+      .filter((l) => /^\| (\d|sin version)/.test(l))
+      .map((l) => l.slice(1, -1).split('|').map((c) => c.trim()));
+    // Tabla general: version, tareas, con revision, a la primera, rondas medias, tokens...
+    assert.deepEqual(filas.slice(0, 3).map((c) => c.slice(0, 5)), [
+      ['0.9.0', '1', '1', '100% (1)', '1'],
+      ['0.10.0', '2', '1', '0% (0)', '2'],
+      ['sin version', '1', '1', '100% (1)', '1'],
+    ]);
+    assert.deepEqual([filas[1]?.[5], filas[1]?.[7]], ['500 (n=1)', '3000 (n=1)']);
+    // Tabla de hallazgos: con tabla, sin tabla, CRITICO, IMPORTANTE, MENOR...
+    assert.deepEqual(filas.slice(3).map((c) => c.slice(0, 6)), [
+      ['0.9.0', '1', '0', '1', '0', '0'],
+      ['0.10.0', '1', '0', '0', '1', '0'],
+      ['sin version', '1', '0', '0', '0', '1'],
+    ]);
+    assert.doesNotMatch(r.stdout, /\| TASK-/, 'sin la tabla por tarea');
+    assert.doesNotMatch(r.stdout, /NaN|undefined|null/);
+    assert.equal(estado(alfa), antes, 'solo lectura');
+  });
+});
+
+test('--por-version --json: clave porVersion con versiones y sinVersion; sin el flag la salida --json no cambia', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, TAREAS);
+    const r = metricas(alfa, ['--por-version', '--json']);
+    assert.equal(r.status, 0, r.stderr);
+    assert.equal(r.stdout.trim().split('\n').length, 1, 'una sola linea');
+    const o = JSON.parse(r.stdout) as SalidaJsonMetricas;
+    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'porVersion']);
+    assert.ok(o.porVersion);
+    assert.equal(o.porVersion.terminadas, 4);
+    assert.deepEqual(o.porVersion.versiones.map((g) => [g.version, g.n]), [['0.9.0', 1], ['0.10.0', 2]]);
+    assert.deepEqual(o.porVersion.sinVersion.version, null);
+    assert.deepEqual(o.porVersion.sinVersion.hallazgosPorSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 1, desconocida: 0 });
+    assert.deepEqual(o.porVersion.versiones[1]?.tokens.revision, { suma: 3000, conDato: 1, media: 3000 });
+    assert.doesNotMatch(r.stdout, /NaN|Infinity/);
+    // El contrato de siempre: sin --por-version no aparece la clave nueva.
+    const sinFlag = JSON.parse(metricas(alfa, ['--json']).stdout) as Record<string, unknown>;
+    assert.deepEqual(Object.keys(sinFlag), ['proyectos', 'sinCoste']);
+  });
+});
+
+test('--por-version con --grupos sale en su seccion; sin tareas, n 0 y sin NaN', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, TAREAS);
+    const r = metricas(alfa, ['--grupos', '--por-version']);
+    assert.equal(r.status, 0, r.stderr);
+    assert.ok(r.stdout.indexOf('Grupos de 4') < r.stdout.indexOf('Por version de 4'), 'grupos y despues por version');
+    const vacio = await crear('vacio');
+    const v = metricas(vacio, ['--por-version']);
+    assert.equal(v.status, 0, v.stderr);
+    assert.match(v.stdout, /Por version de 0 tareas terminadas \(sin version anotada: 0\)\./);
+    const j = JSON.parse(metricas(vacio, ['--por-version', '--json']).stdout) as SalidaJsonMetricas;
+    assert.deepEqual(j.porVersion?.versiones, []);
+    assert.equal(j.porVersion?.sinVersion.n, 0);
+    assert.doesNotMatch(v.stdout + JSON.stringify(j), /NaN/);
+  });
+});
+
+test('--por-version con --tokens, --heuristica o --escribir, o con valor, aborta sin leer ni escribir', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, TAREAS);
+    const antes = estado(alfa);
+    const casos: [string[], RegExp][] = [
+      [['--por-version', '--tokens'], /--por-version no se combina con --tokens/],
+      [['--por-version', '--heuristica'], /--por-version no se combina con --heuristica/],
+      [['--por-version', '--tokens', '--escribir'], /--por-version no se combina con --tokens ni --escribir/],
+      [['--por-version=0.9.0'], /"--por-version" no lleva valor|--por-version no lleva valor/],
+    ];
+    for (const [args, error] of casos) {
+      const r = metricas(alfa, args);
+      assert.equal(r.status, 1, args.join(' '));
+      assert.match(r.stderr, error, args.join(' '));
+      assert.equal(r.stdout, '');
+    }
+    assert.equal(estado(alfa), antes);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
index fc77474..51b6e1e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
@@ -12,6 +12,8 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { readTareaFile } from '../../src/fs/task-store.js';
 import { leerTransiciones, precisionDeFecha } from '../../src/core/transiciones.js';
+import { VERSION_TASKCTL } from '../../src/core/version.js';
+import type { SalidaJsonMetricas } from '../../src/commands/metricas.js';
 import {
   ID,
   CONFIG_AUTO,
@@ -63,7 +65,10 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     assert.deepEqual(filas.map((f) => f.fase), ['plan', 'approve', 'start', 'review', 'finish']);
     for (const f of filas) {
       assert.equal(precisionDeFecha(f.fecha), 'segundo', `la fila ${f.fase} no lleva instante: ${f.fecha}`);
+      // TASK-084: cada fila lleva la version del taskctl que la escribio.
+      assert.equal(f.version, VERSION_TASKCTL, `la fila ${f.fase} no lleva version`);
     }
+    assert.ok(t.body.includes('| fecha | fase | modo | decidido_por | version |\n|---|---|---|---|---|\n'), t.body);
     // `actualizado` sigue siendo un dia, y es el de la ultima fila.
     assert.equal(t.task.actualizado, (filas[4] as { fecha: string }).fecha.slice(0, 10));
 
@@ -86,6 +91,12 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     assert.doesNotMatch(r.stdout, /NaN|undefined/);
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'metricas no escribe nada');
 
+    // TASK-084: --por-version la agrupa bajo la version de su finish.
+    const pv = JSON.parse(cliOk(repoRoot, ['metricas', '--por-version', '--json']).stdout) as SalidaJsonMetricas;
+    assert.ok(pv.porVersion);
+    assert.deepEqual(pv.porVersion.versiones.map((g) => [g.version, g.n, g.conRevision]), [[VERSION_TASKCTL, 1, 1]]);
+    assert.equal(pv.porVersion.sinVersion.n, 0);
+
     // --heuristica: la tarea terminada con informe entra en la muestra.
     const h = cliOk(repoRoot, ['metricas', '--heuristica']);
     assert.deepEqual(cabecera(h.stdout).slice(-2), ['puntos', 'nivel_heuristico']);
@@ -105,6 +116,10 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     assert.equal(filaGit[11], 'git');
     for (const d of filaGit.slice(2, 5)) assert.match(d, DURACION_SEGUNDOS);
     assert.equal(filaGit[10], cierre);
+    // TASK-084: con origen git no hay version: va a «sin version», no se deduce por la fecha.
+    const pvGit = JSON.parse(cliOk(repoRoot, ['metricas', '--por-version', '--json']).stdout) as SalidaJsonMetricas;
+    assert.deepEqual(pvGit.porVersion?.versiones, []);
+    assert.equal(pvGit.porVersion?.sinVersion.n, 1);
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
index 7c51462..78081af 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
@@ -13,8 +13,10 @@ import {
   precisionDeFecha,
   instanteDe,
   formatearInstante,
+  versionDeCierre,
   type FilaTransicion,
 } from '../../src/core/transiciones.js';
+import { VERSION_TASKCTL } from '../../src/core/version.js';
 
 const CUERPO = '## Objetivo\n\nHacer algo.\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
 
@@ -23,6 +25,7 @@ const fila = (o: Partial<FilaTransicion> = {}): FilaTransicion => ({
   fase: 'plan',
   modo: 'manual',
   decidido_por: 'persona',
+  version: null,
   ...o,
 });
 
@@ -31,8 +34,8 @@ test('anadirTransicion: sin seccion, la crea al final y deja el cuerpo intacto p
   assert.ok(r.startsWith(CUERPO.trimEnd() + '\n\n## Transiciones\n'), r);
   assert.ok(
     r.endsWith(
-      '## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
-        '| 2026-10-04 | plan | manual | persona |\n'
+      '## Transiciones\n\n| fecha | fase | modo | decidido_por | version |\n|---|---|---|---|---|\n' +
+        '| 2026-10-04 | plan | manual | persona |  |\n'
     ),
     r
   );
@@ -51,7 +54,7 @@ test('anadirTransicion: con seccion, la fila va detras de la ultima de la tabla,
   // El Resultado sigue intacto y detras.
   assert.ok(r.endsWith('## Resultado\n\nTexto del resultado.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n'), r);
   const antesDeResultado = r.slice(0, r.indexOf('## Resultado'));
-  assert.match(antesDeResultado, /\| 2026-10-04 \| approve \| manual \| automatico \|\n/);
+  assert.match(antesDeResultado, /\| 2026-10-04 \| approve \| manual \| automatico \|  \|\n/);
 });
 
 test('anadirTransicion: respeta CRLF si el cuerpo lo usa', () => {
@@ -207,8 +210,8 @@ test('registrarTransicion: plan toma el modo del config; el resto, el congelado
   const tras = registrarTransicion(CUERPO, 'plan', '2026-10-04', 'automatico');
   const aprobada = registrarTransicion(tras, 'approve', '2026-10-05', 'manual', 'automatico');
   assert.deepEqual(leerTransiciones(aprobada), [
-    fila({ modo: 'automatico' }),
-    fila({ fecha: '2026-10-05', fase: 'approve', modo: 'automatico', decidido_por: 'automatico' }),
+    fila({ modo: 'automatico', version: VERSION_TASKCTL }),
+    fila({ fecha: '2026-10-05', fase: 'approve', modo: 'automatico', decidido_por: 'automatico', version: VERSION_TASKCTL }),
   ]);
   // Tarea anterior al registro (sin fila plan): el modo es el del config.
   assert.equal(modoDeTarea(CUERPO, 'semiautomatico'), 'semiautomatico');
@@ -227,8 +230,8 @@ const PLAN_AUTO_CON_HORA = fila({ fecha: '2026-10-05T14:03:22Z', modo: 'automati
 
 test('TASK-052: registrarTransicion con instante lo escribe tal cual y leerTransiciones lo devuelve', () => {
   const r = registrarTransicion(CUERPO, 'plan', '2026-10-05T14:03:22Z', 'automatico');
-  assert.ok(r.includes('| 2026-10-05T14:03:22Z | plan | automatico | persona |'), r);
-  assert.deepEqual(leerTransiciones(r), [PLAN_AUTO_CON_HORA]);
+  assert.ok(r.includes(`| 2026-10-05T14:03:22Z | plan | automatico | persona | ${VERSION_TASKCTL} |`), r);
+  assert.deepEqual(leerTransiciones(r), [{ ...PLAN_AUTO_CON_HORA, version: VERSION_TASKCTL }]);
 });
 
 test('TASK-052: modoCongelado sigue funcionando con filas con hora', () => {
@@ -287,3 +290,103 @@ test('TASK-052: formatearInstante es UTC al segundo e instanteDe lo invierte', (
   assert.equal(instanteDe('2026-10-05T23:59:59Z'), Date.UTC(2026, 9, 5, 23, 59, 59));
   assert.equal(instanteDe('2026-10-05'), Date.UTC(2026, 9, 5));
 });
+
+// --------------------------------------------------------------------
+// TASK-084: quinta columna `version`. Las filas viejas de 4 celdas se siguen
+// leyendo (con version null) y siguen congelando el modo; la primera fila con
+// version bajo una cabecera de 4 columnas amplia SOLO cabecera y separador.
+// --------------------------------------------------------------------
+
+const TABLA_VIEJA =
+  CUERPO +
+  '\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
+  '| 2026-10-04 | plan | manual | persona |\n' +
+  '| 2026-10-05T10:00:00Z | approve | manual | persona |\n';
+
+test('TASK-084: una tabla de 4 columnas se lee entera, sin version, y congela el modo', () => {
+  assert.deepEqual(leerTransiciones(TABLA_VIEJA), [
+    fila(),
+    fila({ fecha: '2026-10-05T10:00:00Z', fase: 'approve' }),
+  ]);
+  assert.equal(modoCongelado(TABLA_VIEJA), 'manual');
+  assert.equal(versionDeCierre(TABLA_VIEJA), null);
+});
+
+test('TASK-084: la primera fila con version amplia cabecera y separador y no toca las filas viejas', () => {
+  const r = registrarTransicion(TABLA_VIEJA, 'start', '2026-10-06T09:00:00Z', 'automatico', 'persona', '0.12.0');
+  const esperado =
+    TABLA_VIEJA.replace(
+      '| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n',
+      '| fecha | fase | modo | decidido_por | version |\n|---|---|---|---|---|\n'
+    ) + '| 2026-10-06T09:00:00Z | start | manual | persona | 0.12.0 |\n';
+  assert.equal(r, esperado);
+  assert.deepEqual(
+    leerTransiciones(r).map((f) => [f.fase, f.modo, f.version]),
+    [
+      ['plan', 'manual', null],
+      ['approve', 'manual', null],
+      ['start', 'manual', '0.12.0'],
+    ]
+  );
+  // La segunda fila ya encuentra la cabecera de 5: no se vuelve a tocar.
+  const r2 = registrarTransicion(r, 'review', '2026-10-06T10:00:00Z', 'manual', 'persona', '0.12.0');
+  assert.equal(r2, r + '| 2026-10-06T10:00:00Z | review | manual | persona | 0.12.0 |\n');
+});
+
+test('TASK-084: la ampliacion de la cabecera respeta CRLF', () => {
+  const crlf = TABLA_VIEJA.replace(/\n/g, '\r\n');
+  const r = registrarTransicion(crlf, 'start', '2026-10-06T09:00:00Z', 'manual', 'persona', '0.12.0');
+  assert.equal(r.replace(/\r\n/g, '').includes('\n'), false, 'no mezcla LF suelto');
+  assert.ok(r.includes('| fecha | fase | modo | decidido_por | version |\r\n|---|---|---|---|---|\r\n'), r);
+});
+
+test('TASK-084: una cabecera editada a mano (no la de 4 columnas exacta) no se reescribe', () => {
+  const editada = TABLA_VIEJA.replace('| fecha | fase | modo | decidido_por |', '| Fecha | fase | modo | decidido_por |');
+  const r = registrarTransicion(editada, 'start', '2026-10-06T09:00:00Z', 'manual', 'persona', '0.12.0');
+  assert.ok(r.includes('| Fecha | fase | modo | decidido_por |\n|---|---|---|---|\n'), r);
+  assert.equal(leerTransiciones(r)[2]?.version, '0.12.0');
+  // Una cabecera de 4 dentro de un bloque de codigo de la seccion tampoco.
+  const conBloque =
+    anadirTransicion(CUERPO, fila({ version: '0.12.0' })) +
+    '\n```md\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n```\n';
+  const r3 = anadirTransicion(conBloque, fila({ fase: 'approve', version: '0.12.0' }));
+  assert.ok(r3.includes('```md\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n```'), r3);
+});
+
+test('TASK-084: una celda de version que no es version deja la fila (y su modo) sin version', () => {
+  const cuerpo =
+    CUERPO +
+    '\n## Transiciones\n\n| fecha | fase | modo | decidido_por | version |\n|---|---|---|---|---|\n' +
+    '| 2026-10-04 | plan | automatico | persona | ayer |\n' +
+    '| 2026-10-05 | approve | automatico | persona |  |\n' +
+    '| 2026-10-06 | start | automatico | persona | 0.12.0-dev.1 |\n' +
+    '| 2026-10-07 | review | automatico | persona | 0.12.0 | extra |\n';
+  assert.deepEqual(
+    leerTransiciones(cuerpo).map((f) => [f.fase, f.version]),
+    [
+      ['plan', null],
+      ['approve', null],
+      ['start', '0.12.0-dev.1'],
+    ]
+  );
+  assert.equal(modoCongelado(cuerpo), 'automatico');
+});
+
+test('TASK-084: versionDeCierre es la del ULTIMO finish; null sin finish o si no la lleva', () => {
+  let r = registrarTransicion(CUERPO, 'plan', '2026-10-04T10:00:00Z', 'manual', 'persona', '0.11.0');
+  assert.equal(versionDeCierre(r), null, 'sin finish no hay version de cierre');
+  r = registrarTransicion(r, 'finish', '2026-10-05T10:00:00Z', 'manual', 'persona', '0.11.0');
+  assert.equal(versionDeCierre(r), '0.11.0');
+  // finish abortado y reintentado con el plugin actualizado: cuenta el ultimo.
+  r = registrarTransicion(r, 'finish', '2026-10-06T10:00:00Z', 'manual', 'persona', '0.12.0');
+  assert.equal(versionDeCierre(r), '0.12.0');
+  // Un ultimo finish sin version no hereda la del anterior.
+  r = anadirTransicion(r, fila({ fecha: '2026-10-07', fase: 'finish' }));
+  assert.equal(versionDeCierre(r), null);
+});
+
+test('TASK-084: registrarTransicion anota por defecto la version de este taskctl', () => {
+  const r = registrarTransicion(CUERPO, 'plan', '2026-10-04T10:00:00Z', 'manual');
+  assert.equal(leerTransiciones(r)[0]?.version, VERSION_TASKCTL);
+  assert.ok(r.includes(`| persona | ${VERSION_TASKCTL} |`), r);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/versiones-metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/versiones-metricas.test.ts
new file mode 100644
index 0000000..e2c7aef
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/versiones-metricas.test.ts
@@ -0,0 +1,128 @@
+/**
+ * TASK-084: metricas por version del plugin, en puro. Orden semver (no
+ * lexicografico), grupo «sin version» aparte, solo terminadas, hallazgos
+ * sumados solo de las tareas con tabla y tokens con su n.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { calcularFila, type FilaMetricas } from '../../src/core/metricas.js';
+import {
+  calcularPorVersion,
+  compararVersiones,
+  formatearPorVersion,
+  resumirVersion,
+} from '../../src/core/versiones-metricas.js';
+import { tarea } from '../helpers/tarea-ejemplo.js';
+
+function fila(o: Partial<FilaMetricas> & { id: string }): FilaMetricas {
+  const base = calcularFila({ task: tarea({ id: o.id }), body: '', ronda: 0, eventosGit: [] });
+  return { ...base, proyecto: 'a', estado: 'terminada', ...o };
+}
+
+const hall = (crit: number, imp: number, men: number, origen: { impl: number; plan: number }) => ({
+  informes: 1,
+  informesSinTabla: [],
+  porSeveridad: { CRITICO: crit, IMPORTANTE: imp, MENOR: men, desconocida: 0 },
+  porOrigen: {
+    implementacion: origen.impl,
+    plan: origen.plan,
+    especificacion: 0,
+    'sin clasificar': crit + imp + men - origen.impl - origen.plan,
+  },
+  severidadesDesconocidas: [],
+});
+const sinTabla = {
+  informes: 1,
+  informesSinTabla: ['informe-revision-1.md'],
+  porSeveridad: null,
+  porOrigen: null,
+  severidadesDesconocidas: [],
+};
+const tokens = (diseno: number | null, implementacion: number | null, revision: number | null) => ({
+  diseno,
+  implementacion,
+  revision,
+});
+
+test('compararVersiones: por componentes numericos, y la pre-release antes de su release', () => {
+  const desordenadas = ['0.10.0', '0.9.1', '1.0.0', '0.12.0', '0.12.0-dev', '0.9.0', '0.12.0-dev.2', '0.12.0-dev.10', '0.12.0-rc.1'];
+  assert.deepEqual([...desordenadas].sort(compararVersiones), [
+    '0.9.0',
+    '0.9.1',
+    '0.10.0',
+    '0.12.0-dev',
+    '0.12.0-dev.2',
+    '0.12.0-dev.10',
+    '0.12.0-rc.1',
+    '0.12.0',
+    '1.0.0',
+  ]);
+  assert.equal(compararVersiones('0.11.0', '0.11.0'), 0);
+});
+
+test('calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera', () => {
+  const filas = [
+    fila({ id: 'TASK-001', versionCierre: '0.10.0', rondas: 1, veredictoRonda1: 'aprobada', hallazgos: hall(0, 1, 2, { impl: 2, plan: 1 }), tokens: tokens(100, 1000, 500) }),
+    fila({ id: 'TASK-002', versionCierre: '0.9.0', rondas: 2, veredictoRonda1: 'cambios-solicitados', hallazgos: hall(1, 2, 0, { impl: 3, plan: 0 }), tokens: tokens(null, 2000, null) }),
+    fila({ id: 'TASK-003', versionCierre: '0.10.0', rondas: 3, veredictoRonda1: 'cambios-solicitados', hallazgos: hall(0, 3, 1, { impl: 4, plan: 0 }), tokens: tokens(300, null, 1500) }),
+    // Revisada sin tabla: cuenta en rondas, no en hallazgos.
+    fila({ id: 'TASK-004', versionCierre: '0.10.0', rondas: 1, veredictoRonda1: 'aprobada', hallazgos: sinTabla }),
+    // Sin revision.
+    fila({ id: 'TASK-005', versionCierre: '0.10.0' }),
+    // Sin version anotada (cerrada antes de anotarla): nunca se reparte.
+    fila({ id: 'TASK-006', versionCierre: null, rondas: 1, veredictoRonda1: 'aprobada', hallazgos: hall(0, 0, 1, { impl: 1, plan: 0 }) }),
+    // No terminada: fuera aunque lleve version.
+    fila({ id: 'TASK-007', versionCierre: '0.10.0', estado: 'en-revision', rondas: 1, veredictoRonda1: 'aprobada' }),
+  ];
+  const p = calcularPorVersion(filas);
+  assert.equal(p.terminadas, 6);
+  assert.deepEqual(p.versiones.map((g) => [g.version, g.n]), [
+    ['0.9.0', 1],
+    ['0.10.0', 4],
+  ]);
+  const v10 = p.versiones[1];
+  assert.ok(v10 !== undefined);
+  assert.equal(v10.conRevision, 3);
+  assert.equal(v10.aprobadasPrimera, 2);
+  assert.equal(v10.pctAprobadaPrimera, 66.7);
+  assert.equal(v10.rondasMedia, 1.67);
+  assert.equal(v10.sinRevision, 1);
+  assert.equal(v10.conHallazgos, 2);
+  assert.equal(v10.sinTablaHallazgos, 1);
+  assert.deepEqual(v10.hallazgosPorSeveridad, { CRITICO: 0, IMPORTANTE: 4, MENOR: 3, desconocida: 0 });
+  assert.deepEqual(v10.hallazgosPorOrigen, { implementacion: 6, plan: 1, especificacion: 0, 'sin clasificar': 0 });
+  assert.deepEqual(v10.tokens, {
+    diseno: { suma: 400, conDato: 2, media: 200 },
+    implementacion: { suma: 1000, conDato: 1, media: 1000 },
+    revision: { suma: 2000, conDato: 2, media: 1000 },
+  });
+  assert.equal(p.sinVersion.version, null);
+  assert.equal(p.sinVersion.n, 1);
+  assert.equal(p.sinVersion.hallazgosPorSeveridad.MENOR, 1);
+});
+
+test('resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN)', () => {
+  const g = resumirVersion(null, []);
+  assert.equal(g.n, 0);
+  assert.equal(g.pctAprobadaPrimera, null);
+  assert.equal(g.rondasMedia, null);
+  assert.deepEqual(g.tokens.diseno, { suma: 0, conDato: 0, media: null });
+  assert.doesNotMatch(JSON.stringify(g), /NaN/);
+});
+
+test('formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota', () => {
+  const filas = [
+    fila({ id: 'TASK-001', versionCierre: '0.10.0', rondas: 1, veredictoRonda1: 'aprobada', hallazgos: hall(1, 0, 0, { impl: 1, plan: 0 }) }),
+    fila({ id: 'TASK-002', versionCierre: '0.9.0' }),
+    fila({ id: 'TASK-003', versionCierre: null }),
+  ];
+  const texto = formatearPorVersion(calcularPorVersion(filas));
+  assert.match(texto, /^Por version de 3 tareas terminadas \(sin version anotada: 1\)\./);
+  const orden = texto.split('\n').filter((l) => /^\| (0\.|sin version)/.test(l)).map((l) => l.split('|')[1]?.trim());
+  // Dos tablas (general y hallazgos), cada una en orden semver y con «sin version» al final.
+  assert.deepEqual(orden, ['0.9.0', '0.10.0', 'sin version', '0.9.0', '0.10.0', 'sin version']);
+  assert.match(texto, /Hallazgos por severidad y origen:/);
+  assert.doesNotMatch(texto, /NaN|undefined|null/);
+  const sinNinguna = formatearPorVersion(calcularPorVersion(filas.slice(0, 2)));
+  assert.doesNotMatch(sinNinguna, /^\| sin version/m, 'sin tareas sin version, no sale su fila');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/metadatos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/metadatos.test.ts
index 0b34514..e017a93 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/metadatos.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/metadatos.test.ts
@@ -15,6 +15,7 @@ import { existsSync } from 'node:fs';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { parseFrontmatter } from '../../src/core/frontmatter.js';
+import { VERSION_TASKCTL } from '../../src/core/version.js';
 
 // dist/test/empaquetado -> tres niveles arriba esta la raiz del plugin, y
 // tres mas la del repo (mismo truco que distribucion.test.ts).
@@ -64,6 +65,17 @@ test('plugin.json y la entrada del marketplace no se desalinean', async (t) => {
   }
 });
 
+// TASK-084: cada fila de ## Transiciones graba VERSION_TASKCTL. Si se sube
+// una de las tres y se olvida otra, las filas quedan con una version falsa
+// que no se puede corregir sin reescribir historia.
+test('la version de taskctl coincide con la de package.json y plugin.json', async () => {
+  const paquete = await leerJson(path.join(PLUGIN_ROOT, 'package.json'));
+  const manifiesto = await leerJson(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'));
+  assert.equal(paquete.name, 'taskcode-plugin', 'el test no esta leyendo el package.json del plugin');
+  assert.equal(paquete.version, VERSION_TASKCTL, 'package.json y src/core/version.ts no coinciden');
+  assert.equal(manifiesto.version, VERSION_TASKCTL, 'plugin.json y src/core/version.ts no coinciden');
+});
+
 test('los agentes no declaran model: (manda el parametro de cada invocacion)', async () => {
   const dir = path.join(PLUGIN_ROOT, 'agents');
   const agentes = (await readdir(dir)).filter((f) => f.endsWith('.md'));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
index 048008f..0c61a3b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
@@ -36,6 +36,14 @@ export interface TareaFixture {
   finish?: string | null;
   rondas?: RondaFixture[];
   tokensRevision?: number | null;
+  tokensDiseno?: number | null;
+  /**
+   * TASK-084: version de las filas de `plan` y `finish` (tabla de 5 columnas).
+   * Sin el campo, la tabla es la de 4 columnas, anterior a la version.
+   */
+  version?: string;
+  /** TASK-084: filas de 5 celdas que se anaden tal cual tras las demas. */
+  filasExtra?: string[];
 }
 
 function git(args: string[], cwd: string): string {
@@ -62,7 +70,7 @@ function tarea(t: TareaFixture): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
-    tokens_diseno: null,
+    tokens_diseno: t.tokensDiseno ?? null,
     tokens_implementacion: null,
     tokens_revision: t.tokensRevision ?? null,
     creado: '2026-10-01',
@@ -74,10 +82,13 @@ function tarea(t: TareaFixture): Task {
 function cuerpo(t: TareaFixture): string {
   const criterios = Array.from({ length: t.criterios ?? 2 }, (_, i) => `- [ ] Criterio ${String(i + 1)}`);
   const filas: string[] = [];
+  const cinco = t.version !== undefined || t.filasExtra !== undefined;
+  const v = cinco ? ` ${t.version ?? ''} |` : '';
   const plan = t.plan === undefined ? '2026-10-01T10:00:00Z' : t.plan;
-  if (plan !== null) filas.push(`| ${plan} | plan | manual | persona |`);
+  if (plan !== null) filas.push(`| ${plan} | plan | manual | persona |${v}`);
   const fin = t.finish === undefined ? null : t.finish;
-  if (fin !== null) filas.push(`| ${fin} | finish | manual | persona |`);
+  if (fin !== null) filas.push(`| ${fin} | finish | manual | persona |${v}`);
+  filas.push(...(t.filasExtra ?? []));
   return [
     '## Objetivo',
     '',
@@ -88,8 +99,8 @@ function cuerpo(t: TareaFixture): string {
     '',
     '## Transiciones',
     '',
-    '| fecha | fase | modo | decidido_por |',
-    '|---|---|---|---|',
+    cinco ? '| fecha | fase | modo | decidido_por | version |' : '| fecha | fase | modo | decidido_por |',
+    cinco ? '|---|---|---|---|---|' : '|---|---|---|---|',
     ...filas,
     '',
   ].join('\n');
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-084/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-084/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-084/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-084/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-084/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-084/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-084/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  11 ++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   |  20 +++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                   |  90 +++++++++++++++++++++++++++++++++++++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/version.js                                        |  15 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/versiones-metricas.js                             | 167 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/package-lock.json                                               |   4 +-
 14 files changed, 285 insertions(+), 28 deletions(-)
````
