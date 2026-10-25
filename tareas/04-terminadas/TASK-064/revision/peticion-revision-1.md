# Peticion de revision — TASK-064 (ronda 1)

- Tarea: TASK-064 — Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas
- Rama revisada: feature/task-064-metricas-v2-b-leer-y-mostrar-la-evolucio
- Rama base: develop
- Commit revisado (HEAD): 4e6baf67120ec9df036510e707d2df5f05b9da84
- Fecha: 2026-10-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-064 (criterios de aceptacion y plan)

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
4e6baf6 chore(TASK-064): coste implementacion +12316934 tokens (1 agente)
6b3852f test(TASK-064): fila enriquecida de metricas contra repos reales
f88948d feat(TASK-064): fila de metricas con coste desglosado, hallazgos y lecturas
82c69e4 chore(TASK-064): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index c2e9026..5e4e18d 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,34 @@
 # Changelog
 
 ## Sin publicar
+
+Metricas v2, parte B (TASK-064): `taskctl metricas` lee lo que capturo
+TASK-063 y enriquece la fila de cada tarea. La evolucion por tramos, los
+grupos, `--repo`, `--json` y la linea base quedan para TASK-065.
+
+- Columnas nuevas `crit`, `imp`, `men` y `hall_origen`
+  (implementacion/plan/especificacion/sin clasificar): los hallazgos de todos
+  los informes de revision, `informe-revision-N.md` e
+  `informe-revision-N-<revisor>.md`, contados una vez por tarea con clave
+  revisor + ID (la severidad y el origen son los de la ultima ronda en que
+  aparece). Un informe sin tabla de hallazgos deja la tarea en «—» (sin dato,
+  no cero); la salida dice cuantos hay y lo avisa.
+- La severidad se reconoce sin distinguir mayusculas, tildes ni enfasis
+  (`Importante`, `Crítico`, `menor`); una fuera de vocabulario (`Alta`,
+  `Major`, vacia) sale como aviso con la tarea y el fichero y no cuenta en
+  `crit/imp/men`. `leerHallazgos` expone `severidadReconocida`.
+- Bajo la tabla: la mediana de lecturas por fase de las tareas cuya tabla
+  `## Coste` las mide, y la lista de tareas terminadas sin coste (vacio o 0)
+  en alguna fase.
+- `--tokens` anade `tok_nuevos` (entrada + escritura de cache + salida),
+  `tok_cache_lect` y `tok_sin_desglose` (`tokens_<fase>` menos lo desglosado).
+  Un negativo no se recorta a 0: sale con aviso. Un agente repetido en la
+  misma fase (MEN-2 de TASK-063) se avisa y no se deduplica; las filas
+  `manual` no cuentan como repetidas. El bloque de `docs/METRICAS.md` no
+  cambia de forma, y los avisos no impiden `--escribir`.
+- Test de una fila valida dentro de un bloque de codigo en una seccion
+  `## Coste` real, que `leerCostes` no cuenta (MEN-1 de TASK-063).
+
 - TASK-063 (feature) — Metricas v2 (A): capturar desglose de coste, lecturas y origen de hallazgos (2026-10-25)
 
 Metricas v2, parte A (TASK-063): se capturan los datos que faltaban para
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
index 7c7fc2d..aa1842f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
@@ -63,6 +63,11 @@ cuantas lecturas de ficheros hicieron); con `--tokens N`, una fila `manual`
 con solo el total. No la edites a mano: el total de la fase sigue siendo el
 campo `tokens_<fase>`, y la tabla es su desglose.
 
+El mismo `--agente` registrado dos veces en la misma fase suma dos veces y
+deja dos filas: no se deduplica. `taskctl metricas` lo avisa (y avisa tambien
+si lo desglosado supera a `tokens_<fase>`); si fue un error, corrige el total y
+quita la fila sobrante.
+
 `taskctl finish` avisa, sin bloquear, si falta el coste de diseno, de
 implementacion (vacio o a 0) o de revision. `taskctl metricas --tokens` lo tabula por tarea, por sprint y por
 complejidad; con `--escribir` regenera un bloque delimitado del fichero de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index d34daca..5842a9c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -94,9 +94,13 @@ Uso:
 Comandos: new, import, board, metricas, start, plan, approve, review, codex-review, veredicto,
 finish, siguiente, doctor, pausa, registrar-coste, cadena.
 metricas saca, por tarea, cuanto duro cada fase (diseno, curso, revision) y
-cuantas rondas de revision hubo; --heuristica compara la complejidad declarada
-con la que da la heuristica en las tareas terminadas. --tokens anade el coste en
-tokens por fase y un resumen por sprint y por complejidad; con --escribir lo
+cuantas rondas de revision hubo, con sus hallazgos CRITICO/IMPORTANTE/MENOR y su
+origen (cada uno una vez por tarea: revisor + ID; un informe sin tabla es sin dato,
+no cero), la mediana de lecturas por fase y las terminadas sin coste en alguna
+fase; --heuristica compara la complejidad declarada con la que da la heuristica
+en las tareas terminadas. --tokens anade el coste en tokens por fase, el desglose
+de "## Coste" (tokens nuevos, lectura de cache y lo que queda sin desglose) y un
+resumen por sprint y por complejidad; con --escribir lo
 regenera en el bloque delimitado de docs/METRICAS.md (sin commitear). Sin
 --escribir solo lee.
 registrar-coste SUMA al coste de una fase de la tarea (en cualquier estado) y lo commitea:
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index d58e0bd..641e8a9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -19,9 +19,17 @@
  * sus dos marcadores HTML (sin commitear, como `board --escribir`: lo
  * commitea quien lo pide, o el siguiente comando que commitee ese fichero).
  * Es lo unico que este comando escribe, y solo con `--escribir`.
+ *
+ * TASK-064: lee SIEMPRE los informes de revision de cada tarea (una pasada,
+ * sin git) para contar sus hallazgos, y el tamano de sus peticiones de
+ * revision. Las incoherencias del desglose de coste, las severidades fuera
+ * de vocabulario y los informes sin tabla salen como avisos; ninguno impide
+ * `--escribir` (solo lo impide un tarea.md invalido, que dejaria el bloque
+ * incompleto).
  */
 import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
+import type { InformeLeido } from '../core/informe-revision.js';
 import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError, TASK_COMPLEXITIES } from '../core/task.js';
@@ -31,6 +39,12 @@ import {
   COLUMNAS_HEURISTICA,
   COLUMNAS_METRICAS,
   COLUMNAS_TOKENS,
+  COLUMNAS_DESGLOSE_TOKENS,
+  NOTA_DESGLOSE_TOKENS,
+  avisosDeFila,
+  avisoInformesSinTabla,
+  claveTarea,
+  notasFilaEnriquecida,
   BloqueTokensError,
   NOTA_TOKENS,
   renderBloqueTokens,
@@ -45,7 +59,8 @@ import {
   type EventoGit,
   type FilaMetricas,
 } from '../core/metricas.js';
-import { INFORME_REVISION_RE, nombresDeUltimaRonda } from '../fs/rondas.js';
+import { INFORME_REVISION_RE, nombresDeUltimaRonda, rondaYRevisorDeInforme } from '../fs/rondas.js';
+import { PETICION_REVISION_RE } from './review.js';
 import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
 import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
 
@@ -144,6 +159,26 @@ async function nombresDeRevision(dirTarea: string): Promise<string[]> {
   }
 }
 
+/** Informes de revision (todas las rondas) y bytes de cada peticion, de una pasada. */
+async function leerRevision(
+  dirTarea: string,
+  nombres: readonly string[]
+): Promise<{ informes: InformeLeido[]; peticiones: { ronda: number; bytes: number }[] }> {
+  const dir = path.join(dirTarea, 'revision');
+  const informes: InformeLeido[] = [];
+  const peticiones: { ronda: number; bytes: number }[] = [];
+  for (const nombre of nombres) {
+    const inf = rondaYRevisorDeInforme(nombre);
+    if (inf !== null) {
+      informes.push({ fichero: nombre, ...inf, texto: await readFile(path.join(dir, nombre), 'utf8') });
+      continue;
+    }
+    const m = PETICION_REVISION_RE.exec(nombre);
+    if (m !== null) peticiones.push({ ronda: Number(m[1]), bytes: (await stat(path.join(dir, nombre))).size });
+  }
+  return { informes, peticiones };
+}
+
 /** Un solo git log para todo el repo; null si git no se pudo consultar. */
 function eventosGit(repoCwd: string): EventoGit[] | null {
   try {
@@ -180,20 +215,35 @@ export async function runMetricasCommand(
   const h = conHeuristica ? cargarHeuristica(deps.rutaHeuristica) : null;
 
   const advertencias: string[] = [];
+  /** Solo los tarea.md invalidos: son lo unico que impide --escribir. */
+  const invalidas: string[] = [];
+  const proyecto = path.basename(path.resolve(deps.repoCwd));
   const ids = [...new Set(await listExistingTaskIds(tareasRoot))].sort(
     (a, b) => Number(a.slice(5)) - Number(b.slice(5))
   );
 
-  const leidas: { task: NonNullable<Awaited<ReturnType<typeof readTareaFile>>>; ronda: number }[] = [];
+  const leidas: {
+    task: NonNullable<Awaited<ReturnType<typeof readTareaFile>>>;
+    ronda: number;
+    informes: InformeLeido[];
+    peticiones: { ronda: number; bytes: number }[];
+  }[] = [];
   for (const id of ids) {
     try {
       const read = await readTareaFile(tareasRoot, id);
       if (read === null) continue;
-      const nombres = await nombresDeRevision(path.dirname(read.filePath));
-      leidas.push({ task: read, ronda: nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).ronda });
+      const dirTarea = path.dirname(read.filePath);
+      const nombres = await nombresDeRevision(dirTarea);
+      leidas.push({
+        task: read,
+        ronda: nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).ronda,
+        ...(await leerRevision(dirTarea, nombres)),
+      });
     } catch (e: unknown) {
       if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
-        advertencias.push(`${id} tiene un tarea.md invalido y no aparece en las metricas: ${e.message}`);
+        const aviso = `${id} tiene un tarea.md invalido y no aparece en las metricas: ${e.message}`;
+        advertencias.push(aviso);
+        invalidas.push(aviso);
         continue;
       }
       throw e;
@@ -226,26 +276,45 @@ export async function runMetricasCommand(
       body: l.task.body,
       ronda: l.ronda,
       eventosGit: porId.get(l.task.task.id) ?? [],
+      proyecto,
+      informes: l.informes,
+      peticiones: l.peticiones,
     })
   );
+  // Los avisos de las filas, sobre TODAS las tareas (tambien con --heuristica).
+  for (const f of filas) advertencias.push(...avisosDeFila(f));
+  const sinTabla = avisoInformesSinTabla(filas);
+  if (sinTabla !== null) advertencias.push(sinTabla);
 
   if (filas.length === 0) return { output: '', totalTareas: 0, advertencias, metricasPath: null, escritura: null };
 
-  const columnas = conTokens ? [...COLUMNAS_METRICAS, ...COLUMNAS_TOKENS] : COLUMNAS_METRICAS;
+  const columnas = conTokens
+    ? [...COLUMNAS_METRICAS, ...COLUMNAS_TOKENS, ...COLUMNAS_DESGLOSE_TOKENS]
+    : COLUMNAS_METRICAS;
   /** Los resumenes de tokens sobre las filas que salgan (con --heuristica, la muestra). */
   const seccionTokens = (f: readonly FilaMetricas[]): string[] => {
     if (!conTokens) return [];
     const r = resumenesTokens(f);
-    return ['Coste en tokens por sprint:', r.porSprint, '', 'Coste en tokens por complejidad declarada:', r.porComplejidad, '', NOTA_TOKENS, ''];
+    return [
+      'Coste en tokens por sprint:',
+      r.porSprint,
+      '',
+      'Coste en tokens por complejidad declarada:',
+      r.porComplejidad,
+      '',
+      NOTA_TOKENS,
+      NOTA_DESGLOSE_TOKENS,
+      '',
+    ];
   };
 
   let metricasPath: string | null = null;
   let escritura: MetricasCommandResult['escritura'] = null;
   if (escribir) {
-    if (advertencias.length > 0) {
+    if (invalidas.length > 0) {
       throw new MetricasCommandError(
         '[ERROR] No se regenera docs/METRICAS.md con tarea.md invalidos: saldrian del bloque ' +
-          `sin que nadie lo vea. Arregla esto y reintenta:\n  ${advertencias.join('\n  ')}`
+          `sin que nadie lo vea. Arregla esto y reintenta:\n  ${invalidas.join('\n  ')}`
       );
     }
     metricasPath = metricasFilePath(deps.repoCwd);
@@ -275,7 +344,14 @@ export async function runMetricasCommand(
 
   if (h === null) {
     return {
-      output: [formatearTabla(filas, columnas), '', ...seccionTokens(filas), NOTA_CALENDARIO].join('\n'),
+      output: [
+        formatearTabla(filas, columnas),
+        '',
+        ...notasFilaEnriquecida(filas),
+        '',
+        ...seccionTokens(filas),
+        NOTA_CALENDARIO,
+      ].join('\n'),
       totalTareas: filas.length,
       advertencias,
       metricasPath,
@@ -283,9 +359,9 @@ export async function runMetricasCommand(
     };
   }
 
-  const cuerpoPorId = new Map(leidas.map((l) => [l.task.task.id, l.task]));
+  const cuerpoPorId = new Map(leidas.map((l) => [claveTarea(proyecto, l.task.task.id), l.task]));
   filas = filas.filter(enMuestraHeuristica).map((f) => {
-    const leida = cuerpoPorId.get(f.id) as NonNullable<Awaited<ReturnType<typeof readTareaFile>>>;
+    const leida = cuerpoPorId.get(claveTarea(f.proyecto, f.id)) as NonNullable<Awaited<ReturnType<typeof readTareaFile>>>;
     const { puntos } = puntuarTarea(leida.task, leida.body, h);
     return { ...f, heuristica: { puntos, nivel: nivelHeuristico(puntos, h) } };
   });
@@ -307,6 +383,8 @@ export async function runMetricasCommand(
       resumirPorNivel(filas, (f) => f.heuristica?.nivel ?? null, TASK_COMPLEXITIES)
     ),
     '',
+    ...notasFilaEnriquecida(filas),
+    '',
     ...seccionTokens(filas),
     NOTA_CALENDARIO,
   ].join('\n');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
index c1a3390..549f1d2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
@@ -149,3 +149,97 @@ export function leerCostes(body: string): FilaCoste[] {
   }
   return filas;
 }
+
+// --- Lectura para las metricas (TASK-064) ------------------------------------
+
+/** Lo que dice el desglose de UNA fase, frente a su `tokens_<fase>`. */
+export interface ResumenFaseCoste {
+  /** `tokens_<fase>` del frontmatter; null = nadie lo registro. */
+  registrado: number | null;
+  /** Filas de esta fase en `## Coste`. */
+  filas: number;
+  /** Suma de `total` de las filas con desglose (entrada, cache y salida con dato). */
+  desglosado: number;
+  /** Tokens nuevos de esas filas: entrada + escritura de cache + salida. */
+  nuevos: number;
+  /** Lectura de cache de esas filas, aparte: es lo barato y lo que mas abulta. */
+  cacheLectura: number;
+  /**
+   * `registrado` - `desglosado`: lo que la tabla no explica (filas `manual`,
+   * coste registrado antes de TASK-063). NEGATIVO si el desglose supera al
+   * total: nunca se recorta a 0, es una incoherencia que se avisa. null solo
+   * si no hay ni total ni filas (fase sin medir).
+   */
+  sinDesglose: number | null;
+  /** Suma de `lecturas`; null si ninguna fila de la fase la trae (no medido, no 0). */
+  lecturas: number | null;
+}
+
+/** Un agente que aparece en mas de una fila de la misma fase: su coste se suma varias veces. */
+export interface CosteRepetido {
+  fase: FaseCoste;
+  /** Id del agente (o la fuente entera si no es `agente:`). */
+  fuente: string;
+  filas: number;
+}
+
+export interface ResumenCostes {
+  /** false = la tarea no tiene filas en `## Coste` (anterior a TASK-063 o sin registrar). */
+  conTabla: boolean;
+  fases: Record<FaseCoste, ResumenFaseCoste>;
+  repetidas: CosteRepetido[];
+}
+
+function conDesglose(f: FilaCoste): boolean {
+  return f.entrada !== null && f.cacheEscritura !== null && f.cacheLectura !== null && f.salida !== null;
+}
+
+/** Ids de una fuente `agente:a,b`; cualquier otra fuente cuenta entera. */
+function idsDeFuente(fuente: string): string[] {
+  if (!fuente.startsWith('agente:')) return [fuente];
+  return fuente
+    .slice('agente:'.length)
+    .split(',')
+    .map((s) => s.trim())
+    .filter((s) => s !== '');
+}
+
+/**
+ * Cruza las filas de `## Coste` con los `tokens_<fase>` de la tarea. No
+ * deduplica nada (MEN-2 de TASK-063): un agente registrado dos veces en la
+ * misma fase ya sumo dos veces a `tokens_<fase>`, asi que quitar una fila
+ * aqui descuadraria el total; se devuelve en `repetidas` para avisar. Las
+ * filas `manual` no cuentan como repetidas: dos cifras a mano son dos
+ * aportaciones legitimas y no hay id con el que compararlas.
+ */
+export function resumirCostes(
+  filas: readonly FilaCoste[],
+  registrado: Readonly<Record<FaseCoste, number | null>>
+): ResumenCostes {
+  const fases = {} as Record<FaseCoste, ResumenFaseCoste>;
+  const repetidas: CosteRepetido[] = [];
+  for (const fase of FASES_COSTE) {
+    const deFase = filas.filter((f) => f.fase === fase);
+    const desglose = deFase.filter(conDesglose);
+    const suma = (v: (f: FilaCoste) => number): number => desglose.reduce((a, f) => a + v(f), 0);
+    const desglosado = suma((f) => f.total);
+    const conLecturas = deFase.filter((f) => f.lecturas !== null);
+    const reg = registrado[fase];
+    fases[fase] = {
+      registrado: reg,
+      filas: deFase.length,
+      desglosado,
+      nuevos: suma((f) => (f.entrada as number) + (f.cacheEscritura as number) + (f.salida as number)),
+      cacheLectura: suma((f) => f.cacheLectura as number),
+      sinDesglose: reg === null && deFase.length === 0 ? null : (reg ?? 0) - desglosado,
+      lecturas: conLecturas.length === 0 ? null : conLecturas.reduce((a, f) => a + (f.lecturas as number), 0),
+    };
+    const vistas = new Map<string, number>();
+    for (const f of deFase) {
+      if (f.fuente === 'manual') continue;
+      for (const id of new Set(idsDeFuente(f.fuente))) vistas.set(id, (vistas.get(id) ?? 0) + 1);
+    }
+    for (const [fuente, n] of vistas) if (n > 1) repetidas.push({ fase, fuente, filas: n });
+  }
+  return { conTabla: filas.length > 0, fases, repetidas };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 1afa1f1..2a33af5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -122,8 +122,19 @@ export interface LecturaHallazgos {
 export const ORIGENES_HALLAZGO = ['implementacion', 'plan', 'especificacion'] as const;
 export type OrigenHallazgo = (typeof ORIGENES_HALLAZGO)[number] | 'sin clasificar';
 
+/**
+ * Vocabulario cerrado de severidades (TASK-064). La celda se reconoce sin
+ * distinguir mayusculas, tildes ni enfasis (`Importante`, `**CRÍTICO**`,
+ * `menor`); cualquier otro valor (`Alta`, `Major`, vacio) no es una
+ * severidad reconocida y quien cuenta debe decirlo, no descartarlo.
+ */
+export const SEVERIDADES_HALLAZGO = ['CRITICO', 'IMPORTANTE', 'MENOR'] as const;
+export type SeveridadHallazgo = (typeof SEVERIDADES_HALLAZGO)[number];
+
 export interface HallazgoLeido extends Hallazgo {
   origen: OrigenHallazgo;
+  /** La severidad dentro del vocabulario; null si la celda no es ninguna de las tres. */
+  severidadReconocida: SeveridadHallazgo | null;
 }
 
 export interface LecturaTodosHallazgos {
@@ -149,6 +160,12 @@ function origenDe(celda: string): OrigenHallazgo {
   return (ORIGENES_HALLAZGO as readonly string[]).includes(valor) ? (valor as OrigenHallazgo) : 'sin clasificar';
 }
 
+/** Severidad sin distinguir mayusculas, tildes ni enfasis; null fuera del vocabulario. */
+export function severidadDe(celda: string): SeveridadHallazgo | null {
+  const valor = normalizarCelda(celda).toUpperCase();
+  return (SEVERIDADES_HALLAZGO as readonly string[]).includes(valor) ? (valor as SeveridadHallazgo) : null;
+}
+
 /**
  * Todas las filas de la primera tabla bajo `## Hallazgos` cuya cabecera
  * tenga las columnas ID y Estado (por nombre, no por posicion), con su
@@ -198,9 +215,11 @@ export function leerHallazgos(informe: string): LecturaTodosHallazgos {
     const c = celdas(l);
     const id = c[iId] ?? '';
     if (id === '' || id.toLowerCase().startsWith('(ej.')) continue;
+    const severidad = iSev === -1 ? '' : (c[iSev] ?? '');
     hallazgos.push({
       id,
-      severidad: iSev === -1 ? '' : (c[iSev] ?? ''),
+      severidad,
+      severidadReconocida: severidadDe(severidad),
       estado: c[iEstado] ?? '',
       fichero: iFich === -1 ? '' : (c[iFich] ?? ''),
       origen: iOrigen === -1 ? 'sin clasificar' : origenDe(c[iOrigen] ?? ''),
@@ -224,3 +243,81 @@ export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
     .map(({ id, severidad, estado, fichero }) => ({ id, severidad, estado, fichero }));
   return { tabla, abiertos };
 }
+
+// --- Hallazgos de una tarea, para las metricas (TASK-064) --------------------
+
+/** Un informe de revision ya leido, con la ronda y el revisor que da su nombre. */
+export interface InformeLeido {
+  /** Nombre del fichero dentro de `revision/` (para los avisos). */
+  fichero: string;
+  ronda: number;
+  /** Sufijo de `informe-revision-N-<revisor>.md`; '' en un informe sin fragmentar. */
+  revisor: string;
+  texto: string;
+}
+
+export type ConteoSeveridad = Record<SeveridadHallazgo, number> & { desconocida: number };
+export type ConteoOrigen = Record<OrigenHallazgo, number>;
+
+export interface SeveridadDesconocida {
+  fichero: string;
+  id: string;
+  /** La celda tal cual se leyo (sin enfasis ni tildes); '' si estaba vacia o no hay columna. */
+  valor: string;
+}
+
+/**
+ * Hallazgos de una tarea sumando todas sus rondas.
+ *
+ * REGLA (decision de Carlos, 2026-10-25): cada hallazgo cuenta UNA vez por
+ * tarea, con clave revisor + ID (el ID sin distinguir mayusculas). Un
+ * hallazgo que reaparece en la ronda 2 con estado `corregido` no suma otra
+ * vez; su severidad y su origen son los de la ultima ronda en que aparece.
+ *
+ * QUE SIGNIFICA CADA null (para quien agregue despues):
+ *  - `porSeveridad`/`porOrigen` null con `informes === 0`: la tarea no tiene
+ *    informes de revision (no se reviso, o es anterior a `review`): NO MEDIDO.
+ *  - null con `informesSinTabla.length > 0`: algun informe no tiene tabla de
+ *    hallazgos reconocible (anteriores a TASK-036, o escrita en prosa). Es
+ *    SIN DATO, no cero: contar solo los otros informes daria una cifra
+ *    menor que la real con aspecto de buena.
+ */
+export interface ResumenHallazgos {
+  informes: number;
+  /** Ficheros sin tabla de hallazgos. */
+  informesSinTabla: string[];
+  porSeveridad: ConteoSeveridad | null;
+  porOrigen: ConteoOrigen | null;
+  /** Hallazgos con severidad fuera del vocabulario (se listan aunque el total sea sin dato). */
+  severidadesDesconocidas: SeveridadDesconocida[];
+}
+
+export function resumirHallazgos(informes: readonly InformeLeido[]): ResumenHallazgos {
+  const informesSinTabla: string[] = [];
+  const severidadesDesconocidas: SeveridadDesconocida[] = [];
+  const porClave = new Map<string, HallazgoLeido>();
+  const ordenados = [...informes].sort((a, b) => a.ronda - b.ronda || a.fichero.localeCompare(b.fichero));
+  for (const inf of ordenados) {
+    const { tabla, hallazgos } = leerHallazgos(inf.texto);
+    if (!tabla) {
+      informesSinTabla.push(inf.fichero);
+      continue;
+    }
+    for (const h of hallazgos) {
+      if (h.severidadReconocida === null) {
+        severidadesDesconocidas.push({ fichero: inf.fichero, id: h.id, valor: h.severidad });
+      }
+      porClave.set(`${inf.revisor}\u0000${h.id.toUpperCase()}`, h);
+    }
+  }
+  if (informes.length === 0 || informesSinTabla.length > 0) {
+    return { informes: informes.length, informesSinTabla, porSeveridad: null, porOrigen: null, severidadesDesconocidas };
+  }
+  const porSeveridad: ConteoSeveridad = { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 0 };
+  const porOrigen: ConteoOrigen = { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 0 };
+  for (const h of porClave.values()) {
+    porSeveridad[h.severidadReconocida ?? 'desconocida']++;
+    porOrigen[h.origen]++;
+  }
+  return { informes: informes.length, informesSinTabla, porSeveridad, porOrigen, severidadesDesconocidas };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 6c5b75a..80c1469 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -36,9 +36,21 @@
  * tarea sin ningun dato no entra en el resumen (que dice cuantas quedaron
  * fuera). Una tarea con dato solo en alguna fase si entra, y cada fase se
  * promedia sobre las tareas que la tienen.
+ *
+ * FILA ENRIQUECIDA (TASK-064): cada fila lleva ademas el desglose de
+ * `## Coste` frente a `tokens_<fase>` (`coste`), los hallazgos de todos sus
+ * informes de revision contados una vez por tarea (`hallazgos`), el tamano
+ * de cada peticion de revision (`kbPeticionPorRonda`), el tipo y el numero
+ * de criterios. Todos esos campos estan SIEMPRE presentes; lo que no se pudo
+ * medir va como null o vacio con el significado documentado en cada tipo
+ * (`ResumenCostes`, `ResumenHallazgos`), para que quien agregue no tenga que
+ * adivinar si un 0 es un cero o una ausencia.
  */
 import { leerTransiciones, instanteDe, precisionDeFecha, type PrecisionFecha } from './transiciones.js';
-import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState } from './task.js';
+import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState, type TaskType } from './task.js';
+import { FASES_COSTE, leerCostes, resumirCostes, type FaseCoste, type ResumenCostes } from './coste-registro.js';
+import { resumirHallazgos, type InformeLeido, type ResumenHallazgos } from './informe-revision.js';
+import { extraerSecciones } from './tarea-body.js';
 
 export type OrigenMetricas = 'registro' | 'git' | '—';
 
@@ -75,8 +87,29 @@ export interface TokensFila {
   revision: number | null;
 }
 
+/** Tamano de la peticion de revision de una ronda (todas sus partes si se fragmento). */
+export interface PeticionRonda {
+  ronda: number;
+  /** KiB con un decimal. */
+  kb: number;
+}
+
+/**
+ * Clave de una tarea en cualquier Map de metricas: (proyecto, id). Hoy hay
+ * un solo proyecto por ejecucion, pero TASK-NNN se repite entre proyectos y
+ * la fila ya lleva el suyo, para que juntar varios no cruce tareas.
+ */
+export function claveTarea(proyecto: string, id: string): string {
+  return `${proyecto}\u0000${id}`;
+}
+
 export interface FilaMetricas {
+  /** Nombre del proyecto (la carpeta del repo); '' si quien llama no lo da. */
+  proyecto: string;
   id: string;
+  tipo: TaskType;
+  /** Criterios de aceptacion de la tarea (lineas de la seccion). */
+  criterios: number;
   sprint: number;
   tokens: TokensFila;
   estado: TaskState;
@@ -90,6 +123,12 @@ export interface FilaMetricas {
   cierre: string | null;
   pausas: number;
   origen: OrigenMetricas;
+  /** Desglose de `## Coste` frente a `tokens_<fase>`; `conTabla: false` = sin desglose. */
+  coste: ResumenCostes;
+  /** Hallazgos de todas las rondas, una vez por revisor + ID; ver los null en `ResumenHallazgos`. */
+  hallazgos: ResumenHallazgos;
+  /** Una entrada por ronda con peticion; vacio = sin peticiones de revision (no medido). */
+  kbPeticionPorRonda: PeticionRonda[];
   /** Solo con `--heuristica`. */
   heuristica?: HeuristicaFila;
 }
@@ -101,6 +140,20 @@ export interface EntradaMetricas {
   ronda: number;
   /** Eventos de git de ESTA tarea (vacio si no se consulto o no hay). */
   eventosGit: readonly EventoGit[];
+  /** Proyecto de la tarea; '' por defecto. */
+  proyecto?: string;
+  /** Informes de revision leidos de `revision/`; sin ellos, hallazgos no medidos. */
+  informes?: readonly InformeLeido[];
+  /** Bytes de cada `peticion-revision-N[-revisor].md`. */
+  peticiones?: readonly { ronda: number; bytes: number }[];
+}
+
+function kbPorRonda(peticiones: readonly { ronda: number; bytes: number }[]): PeticionRonda[] {
+  const bytes = new Map<number, number>();
+  for (const p of peticiones) bytes.set(p.ronda, (bytes.get(p.ronda) ?? 0) + p.bytes);
+  return [...bytes.entries()]
+    .sort((a, b) => a[0] - b[0])
+    .map(([ronda, b]) => ({ ronda, kb: Math.round(b / 102.4) / 10 }));
 }
 
 /**
@@ -194,7 +247,10 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     marcas = { plan: null, start: null, review: null, finish: null, pausas: 0 };
   }
   return {
+    proyecto: e.proyecto ?? '',
     id: e.task.id,
+    tipo: e.task.tipo,
+    criterios: extraerSecciones(e.body).criterios.length,
     sprint: e.task.sprint,
     tokens: {
       diseno: e.task.tokens_diseno,
@@ -210,6 +266,13 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     cierre: marcas.finish === null ? null : new Date(marcas.finish.ms).toISOString().slice(0, 10),
     pausas: marcas.pausas,
     origen,
+    coste: resumirCostes(leerCostes(e.body), {
+      diseno: e.task.tokens_diseno,
+      implementacion: e.task.tokens_implementacion,
+      revision: e.task.tokens_revision,
+    }),
+    hallazgos: resumirHallazgos(e.informes ?? []),
+    kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
   };
 }
 
@@ -237,6 +300,10 @@ export interface ColumnaMetricas {
   valor: (f: FilaMetricas) => string;
 }
 
+function celdaConteo(n: number | undefined): string {
+  return n === undefined ? '—' : String(n);
+}
+
 export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
   { cabecera: 'id', valor: (f) => f.id },
   { cabecera: 'complejidad', valor: (f) => f.complejidad ?? '—' },
@@ -244,6 +311,17 @@ export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
   { cabecera: 'curso', valor: (f) => formatearDuracion(f.curso) },
   { cabecera: 'revision', valor: (f) => formatearDuracion(f.revision) },
   { cabecera: 'rondas', valor: (f) => (f.rondas === null ? '—' : String(f.rondas)) },
+  { cabecera: 'crit', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.CRITICO) },
+  { cabecera: 'imp', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.IMPORTANTE) },
+  { cabecera: 'men', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.MENOR) },
+  {
+    cabecera: 'hall_origen',
+    valor: (f) => {
+      const o = f.hallazgos.porOrigen;
+      if (o === null) return '—';
+      return [o.implementacion, o.plan, o.especificacion, o['sin clasificar']].map(String).join('/');
+    },
+  },
   { cabecera: 'cierre', valor: (f) => f.cierre ?? '—' },
   { cabecera: 'origen', valor: (f) => f.origen },
 ];
@@ -535,3 +613,132 @@ export function sustituirBloqueTokens(contenido: string, bloque: string): string
   }
   return contenido.slice(0, i) + nuevo + contenido.slice(f + MARCADOR_FIN_TOKENS.length);
 }
+
+// --- Fila enriquecida: desglose, hallazgos, lecturas (TASK-064) --------------
+
+/** Suma de un campo de las tres fases del desglose; null si la tarea no tiene tabla `## Coste`. */
+function sumaDesglose(f: FilaMetricas, campo: 'nuevos' | 'cacheLectura' | 'sinDesglose'): number | null {
+  if (!f.coste.conTabla) return null;
+  return FASES_COSTE.reduce((a, fase) => a + (f.coste.fases[fase][campo] ?? 0), 0);
+}
+
+/** Las que anade `--tokens` a la tabla por pantalla (no al bloque de docs/METRICAS.md). */
+export const COLUMNAS_DESGLOSE_TOKENS: readonly ColumnaMetricas[] = [
+  { cabecera: 'tok_nuevos', valor: (f) => celdaTokens(sumaDesglose(f, 'nuevos')) },
+  { cabecera: 'tok_cache_lect', valor: (f) => celdaTokens(sumaDesglose(f, 'cacheLectura')) },
+  { cabecera: 'tok_sin_desglose', valor: (f) => celdaTokens(sumaDesglose(f, 'sinDesglose')) },
+];
+
+export const NOTA_DESGLOSE_TOKENS =
+  'Desglose de "## Coste" (solo tareas con esa tabla; «—» = sin tabla): tok_nuevos = entrada + ' +
+  'escritura de cache + salida; tok_cache_lect = lectura de cache, aparte; tok_sin_desglose = ' +
+  'tokens_<fase> menos lo desglosado (filas "manual" o coste anterior a la tabla). Un negativo es ' +
+  'una incoherencia (el desglose supera al total): sale con aviso y no se recorta a 0. Un agente ' +
+  'repetido en una fase suma tantas veces como filas tenga: se avisa, no se deduplica.';
+
+export const NOTA_HALLAZGOS =
+  'Hallazgos: cada uno cuenta una vez por tarea (revisor + ID) sumando todas las rondas, con la ' +
+  'severidad y el origen de la ultima ronda en que aparece. hall_origen = implementacion/plan/' +
+  'especificacion/sin clasificar. «—» = sin dato: sin informes de revision, o algun informe sin ' +
+  'tabla de hallazgos (no cuenta como cero).';
+
+/** Avisos de una fila: incoherencias del desglose y severidades fuera de vocabulario. */
+export function avisosDeFila(f: FilaMetricas): string[] {
+  const avisos: string[] = [];
+  for (const fase of FASES_COSTE) {
+    const r = f.coste.fases[fase];
+    if (r.registrado === null && r.filas > 0) {
+      avisos.push(
+        `${f.id}: tokens_${fase} esta vacio pero "## Coste" tiene ${String(r.filas)} fila(s) de ${fase}; ` +
+          'el total de la fase deberia ser la suma de su desglose. Revisa el frontmatter.'
+      );
+    } else if (r.sinDesglose !== null && r.sinDesglose < 0) {
+      avisos.push(
+        `${f.id}: lo desglosado en "## Coste" para ${fase} (${String(r.desglosado)}) supera tokens_${fase} ` +
+          `(${String(r.registrado)}): diferencia ${String(r.sinDesglose)}. Revisa el frontmatter o las filas.`
+      );
+    }
+  }
+  for (const rep of f.coste.repetidas) {
+    avisos.push(
+      `${f.id}: en "## Coste", ${rep.fuente} aparece en ${String(rep.filas)} filas de ${rep.fase}: ` +
+        'su coste se suma otras tantas veces (no se deduplica). Si se registro dos veces por error, ' +
+        `corrige tokens_${rep.fase} y quita la fila sobrante.`
+    );
+  }
+  const porFichero = new Map<string, string[]>();
+  for (const d of f.hallazgos.severidadesDesconocidas) {
+    const lista = porFichero.get(d.fichero) ?? [];
+    lista.push(d.valor === '' ? `${d.id} (vacia)` : `${d.id} ("${d.valor}")`);
+    porFichero.set(d.fichero, lista);
+  }
+  for (const [fichero, lista] of porFichero) {
+    avisos.push(
+      `${f.id} revision/${fichero}: severidad fuera de vocabulario (CRITICO, IMPORTANTE o MENOR) en ` +
+        `${lista.join(', ')}; no cuenta en crit/imp/men.`
+    );
+  }
+  return avisos;
+}
+
+/** Un solo aviso con las tareas que tienen informes sin tabla de hallazgos; null si no hay. */
+export function avisoInformesSinTabla(filas: readonly FilaMetricas[]): string | null {
+  const con = filas.filter((f) => f.hallazgos.informesSinTabla.length > 0);
+  if (con.length === 0) return null;
+  const n = con.reduce((a, f) => a + f.hallazgos.informesSinTabla.length, 0);
+  return (
+    `${String(n)} informe(s) de revision sin tabla de hallazgos en ${String(con.length)} tarea(s); sus ` +
+    `hallazgos salen como sin dato («—»), no como cero: ${con.map((f) => f.id).join(', ')}.`
+  );
+}
+
+/** Tareas terminadas sin coste (null o 0) en alguna fase, con esas fases. */
+export function tareasSinCoste(filas: readonly FilaMetricas[]): { id: string; fases: FaseCoste[] }[] {
+  return filas
+    .filter((f) => f.estado === 'terminada')
+    .map((f) => ({ id: f.id, fases: FASES_COSTE.filter((k) => !f.coste.fases[k].registrado) }))
+    .filter((t) => t.fases.length > 0);
+}
+
+/** Mediana de una lista (media de los dos centrales si es par); null si esta vacia. */
+export function mediana(valores: readonly number[]): number | null {
+  if (valores.length === 0) return null;
+  const v = [...valores].sort((a, b) => a - b);
+  const m = Math.floor(v.length / 2);
+  return v.length % 2 === 1 ? (v[m] as number) : ((v[m - 1] as number) + (v[m] as number)) / 2;
+}
+
+/** Por fase, la mediana de lecturas de las tareas cuya tabla `## Coste` las mide, y cuantas son. */
+export function medianaLecturas(
+  filas: readonly FilaMetricas[]
+): Record<FaseCoste, { mediana: number | null; n: number }> {
+  const r = {} as Record<FaseCoste, { mediana: number | null; n: number }>;
+  for (const fase of FASES_COSTE) {
+    const valores = filas.map((f) => f.coste.fases[fase].lecturas).filter((v): v is number => v !== null);
+    r[fase] = { mediana: mediana(valores), n: valores.length };
+  }
+  return r;
+}
+
+/** Lineas de texto bajo la tabla: hallazgos sin dato, lecturas y terminadas sin coste. */
+export function notasFilaEnriquecida(filas: readonly FilaMetricas[]): string[] {
+  const sinTabla = filas.filter((f) => f.hallazgos.informesSinTabla.length > 0);
+  const nInformes = sinTabla.reduce((a, f) => a + f.hallazgos.informesSinTabla.length, 0);
+  const lect = medianaLecturas(filas);
+  const sinCoste = tareasSinCoste(filas);
+  const terminadas = filas.filter((f) => f.estado === 'terminada').length;
+  return [
+    NOTA_HALLAZGOS +
+      ` Informes sin tabla de hallazgos: ${String(nInformes)} (en ${String(sinTabla.length)} tareas).`,
+    'Lecturas por fase (mediana de las tareas cuya tabla "## Coste" las mide): ' +
+      FASES_COSTE.map((k) => `${k} ${lect[k].mediana === null ? '—' : String(lect[k].mediana)} (n=${String(lect[k].n)})`).join(
+        ', '
+      ) +
+      '.',
+    sinCoste.length === 0
+      ? `Terminadas sin coste en alguna fase: 0 de ${String(terminadas)}.`
+      : `Terminadas sin coste en alguna fase: ${String(sinCoste.length)} de ${String(terminadas)}: ` +
+        sinCoste.map((t) => `${t.id} (${t.fases.join(', ')})`).join(', ') +
+        '.',
+  ];
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
index cb9c852..9ca0e5e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -80,6 +80,17 @@ export async function ultimaRonda(dir: string, patron: RegExp): Promise<number>
  */
 export const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 
+/**
+ * Ronda y revisor de un nombre de informe de revision (TASK-064): el
+ * revisor es el sufijo de una ronda fragmentada, '' sin sufijo. null si el
+ * nombre no es un informe de revision.
+ */
+export function rondaYRevisorDeInforme(nombre: string): { ronda: number; revisor: string } | null {
+  const m = /^informe-revision-(\d+)(?:-([a-z0-9-]+))?\.md$/.exec(nombre);
+  if (m === null) return null;
+  return { ronda: Number(m[1]), revisor: m[2] ?? '' };
+}
+
 /**
  * Nombres de TODOS los ficheros de la ronda de mayor N segun `patron`
  * (una ronda fragmentada deja varios con el mismo N), y ese N. Sin
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts
new file mode 100644
index 0000000..2229717
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts
@@ -0,0 +1,174 @@
+/**
+ * TASK-064: la fila enriquecida de `taskctl metricas` por CLI, contra repos
+ * Git temporales reales. Una tarea en formato nuevo (ciclo real, tabla
+ * `## Coste` con filas de agente repetidas, una fila citada en un bloque de
+ * codigo y un total menor que su desglose; hallazgos repetidos entre rondas,
+ * en minusculas, de dos revisores y uno fuera de vocabulario) y otra en
+ * formato antiguo (informe en prosa, sin tabla). Solo lectura salvo
+ * `--escribir`, que los avisos no bloquean.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, writeFile, mkdir } from 'node:fs/promises';
+import path from 'node:path';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { anadirCoste, type FilaCoste } from '../../src/core/coste-registro.js';
+import {
+  ID,
+  CONFIG_AUTO,
+  git,
+  commitAll,
+  cliOk,
+  withRepo,
+  dirRevision,
+  hastaCodigo,
+  nueva,
+  rellenarInforme,
+} from '../helpers/automatico-fixtures.js';
+
+const ID2 = 'TASK-002';
+
+function celdas(salida: string, id: string): string[] {
+  const linea = salida.split('\n').find((l) => l.startsWith(`| ${id} `));
+  assert.ok(linea, `no hay fila de ${id} en:\n${salida}`);
+  return linea
+    .slice(1, -1)
+    .split('|')
+    .map((c) => c.trim());
+}
+
+/** Celdas por nombre de columna. */
+function porColumna(salida: string, id: string): Record<string, string> {
+  const cab = celdas(salida, 'id');
+  const fila = celdas(salida, id);
+  return Object.fromEntries(cab.map((c, i) => [c, fila[i] as string]));
+}
+
+function agente(fase: FilaCoste['fase'], id: string, lecturas: number): FilaCoste {
+  return {
+    fecha: '2026-10-25T10:00:00Z',
+    fase,
+    fuente: `agente:${id}`,
+    entrada: 10,
+    cacheEscritura: 20,
+    cacheLectura: 300,
+    salida: 40,
+    lecturas,
+    total: 370,
+  };
+}
+
+const CABECERA_HALLAZGOS = '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n';
+
+async function escenario(repoRoot: string, tareasRoot: string): Promise<void> {
+  // TASK-001: ciclo real con una fila manual de diseno y el informe 1 del
+  // flujo (MEN-1 MENOR aceptado, sin celda de Origen).
+  await hastaCodigo(repoRoot, tareasRoot);
+  cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '1000']);
+  cliOk(repoRoot, ['review', ID]);
+  await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+  cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+  cliOk(repoRoot, ['finish', ID]);
+
+  const t = await readTareaFile(tareasRoot, ID);
+  assert.ok(t);
+  const revision = path.join(path.dirname(t.filePath), 'revision');
+  // Ronda 2: MEN-1 reaparece (cuenta una vez) e IMP-1 en minusculas; el
+  // revisor java-spring trae su propio MEN-1 con una severidad desconocida.
+  await writeFile(
+    path.join(revision, 'informe-revision-2.md'),
+    `# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n${CABECERA_HALLAZGOS}` +
+      '| MEN-1 | Menor | corregido | app.txt | implementacion |\n| IMP-1 | importante | corregido | app.txt | Plan |\n',
+    'utf8'
+  );
+  await writeFile(
+    path.join(revision, 'informe-revision-2-java-spring-reviewer.md'),
+    `# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n${CABECERA_HALLAZGOS}| MEN-1 | Alta | abierto | app.txt | |\n`,
+    'utf8'
+  );
+
+  // ## Coste: el agente a1 dos veces en implementacion (repetida), r1 en
+  // revision con un total del frontmatter menor que su desglose, y una fila
+  // valida citada en un bloque de codigo DENTRO de la seccion real.
+  let texto = await readFile(t.filePath, 'utf8');
+  for (const f of [agente('implementacion', 'a1', 5), agente('implementacion', 'a1', 5), agente('revision', 'r1', 3)]) {
+    texto = anadirCoste(texto, f);
+  }
+  const ultima = '| 2026-10-25T10:00:00Z | revision | agente:r1 | 10 | 20 | 300 | 40 | 3 | 370 |';
+  assert.ok(texto.includes(ultima));
+  texto = texto.replace(
+    ultima,
+    `${ultima}\n\nFila citada:\n\n\`\`\`\n| 2026-10-25T10:00:00Z | implementacion | agente:zz | 9999 | 9999 | 9999 | 9999 | 99 | 39996 |\n\`\`\`\n`
+  );
+  texto = texto
+    .replace(/^tokens_implementacion: .*$/m, 'tokens_implementacion: 740')
+    .replace(/^tokens_revision: .*$/m, 'tokens_revision: 100');
+  await writeFile(t.filePath, texto, 'utf8');
+  commitAll(repoRoot, 'test: datos de metricas de TASK-001');
+
+  // TASK-002: formato antiguo, con un informe en prosa sin tabla de hallazgos.
+  nueva(repoRoot, 'fix', 'Antigua');
+  const t2 = await readTareaFile(tareasRoot, ID2);
+  assert.ok(t2);
+  const rev2 = path.join(path.dirname(t2.filePath), 'revision');
+  await mkdir(rev2, { recursive: true });
+  await writeFile(path.join(rev2, 'informe-revision-1.md'), '# Informe\n\n- Veredicto: aprobada\n\nSin hallazgos que destacar.\n', 'utf8');
+  await writeFile(path.join(rev2, 'peticion-revision-1.md'), 'x'.repeat(2048), 'utf8');
+  commitAll(repoRoot, 'test: datos de metricas');
+}
+
+test('metricas: hallazgos una vez por revisor + ID, severidad en minusculas, informe sin tabla = sin dato, y avisos', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+    const r = cliOk(repoRoot, ['metricas']);
+
+    const t1 = porColumna(r.stdout, ID);
+    // ''+MEN-1 (rondas 1 y 2, una vez), ''+IMP-1 (importante), java+MEN-1 (Alta: desconocida).
+    assert.deepEqual([t1.crit, t1.imp, t1.men], ['0', '1', '1']);
+    // MEN-1 implementacion (ronda 2 manda), IMP-1 plan, java MEN-1 sin clasificar.
+    assert.equal(t1.hall_origen, '1/1/0/1');
+    assert.equal(t1.rondas, '2');
+
+    const t2 = porColumna(r.stdout, ID2);
+    assert.deepEqual([t2.crit, t2.imp, t2.men, t2.hall_origen], ['—', '—', '—', '—'], 'sin tabla no es cero');
+    assert.match(r.stdout, /Informes sin tabla de hallazgos: 1 \(en 1 tareas\)/);
+    assert.match(r.stdout, /cada uno cuenta una vez por tarea \(revisor \+ ID\)/);
+    assert.match(r.stdout, /Lecturas por fase .*: diseno — \(n=0\), implementacion 10 \(n=1\), revision 3 \(n=1\)\./);
+    assert.match(r.stdout, /Terminadas sin coste en alguna fase: 0 de 1\./);
+
+    assert.match(
+      r.stderr,
+      /\[AVISO\] TASK-001 revision\/informe-revision-2-java-spring-reviewer\.md: severidad fuera de vocabulario .* MEN-1 \("Alta"\)/
+    );
+    assert.match(r.stderr, /\[AVISO\] 1 informe\(s\) de revision sin tabla de hallazgos en 1 tarea\(s\).*TASK-002/);
+    assert.match(r.stderr, /\[AVISO\] TASK-001: en "## Coste", a1 aparece en 2 filas de implementacion/);
+    assert.match(r.stderr, /\[AVISO\] TASK-001: lo desglosado .* revision \(370\) supera tokens_revision \(100\): diferencia -270/);
+    assert.doesNotMatch(r.stderr, /zz/, 'la fila del bloque de codigo no se lee');
+    assert.doesNotMatch(r.stdout, /NaN|undefined/);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'solo lectura');
+  });
+});
+
+test('metricas --tokens: nuevos, lectura de cache y sin desglose (negativo sin recortar); los avisos no bloquean --escribir', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+    const r = cliOk(repoRoot, ['metricas', '--tokens']);
+    const t1 = porColumna(r.stdout, ID);
+    // Tres filas de agente leidas (no la del bloque de codigo): 3 x (10+20+40) y 3 x 300.
+    assert.equal(t1.tok_total, '1840');
+    assert.equal(t1.tok_nuevos, '210');
+    assert.equal(t1.tok_cache_lect, '900');
+    // diseno 1000 - 0 + implementacion 740 - 740 + revision 100 - 370.
+    assert.equal(t1.tok_sin_desglose, '730');
+    const t2 = porColumna(r.stdout, ID2);
+    assert.deepEqual([t2.tok_nuevos, t2.tok_cache_lect, t2.tok_sin_desglose], ['—', '—', '—']);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+
+    const e = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
+    assert.match(e.stderr, /\[AVISO\] TASK-001: lo desglosado/);
+    assert.match(e.stdout, /Regenerado el bloque de tokens/);
+    assert.match(git(['status', '--porcelain'], repoRoot).trim(), /^\?\? docs\/(METRICAS\.md)?$/);
+    // El bloque de docs/METRICAS.md no cambia de forma: sin columnas de desglose.
+    assert.doesNotMatch(await readFile(path.join(repoRoot, 'docs', 'METRICAS.md'), 'utf8'), /tok_nuevos/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
index ca52ccd..21d17a8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
@@ -66,9 +66,15 @@ test('metricas --tokens: columnas por fase y total, la tarea sin datos en la tab
 
     const r = cliOk(repoRoot, ['metricas', '--tokens']);
     const cab = r.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
-    assert.match(cab, /\| tok_diseno +\| tok_curso +\| tok_revision +\| tok_total +\|$/);
-    assert.deepEqual(celdas(r.stdout, ID).slice(-4), ['1000', '3000', '1000', '5000']);
-    assert.deepEqual(celdas(r.stdout, ID2).slice(-4), ['—', '—', '—', '—']);
+    assert.match(
+      cab,
+      /\| tok_diseno +\| tok_curso +\| tok_revision +\| tok_total +\| tok_nuevos +\| tok_cache_lect +\| tok_sin_desglose +\|$/
+    );
+    // TASK-064: las tres filas son "manual" (--tokens N): nada desglosado, todo sin desglose.
+    assert.deepEqual(celdas(r.stdout, ID).slice(-7), ['1000', '3000', '1000', '5000', '0', '0', '5000']);
+    // Sin tabla "## Coste": sin dato, no 0.
+    assert.deepEqual(celdas(r.stdout, ID2).slice(-7), ['—', '—', '—', '—', '—', '—', '—']);
+    assert.match(r.stdout, /tok_sin_desglose = tokens_<fase> menos lo desglosado/);
 
     // El resumen cuenta 1 tarea con dato de 2 y reparte el % sobre el total.
     assert.match(r.stdout, /Coste en tokens por sprint:\n\| sprint +\| con dato\/total/);
@@ -87,8 +93,8 @@ test('metricas --tokens --heuristica: ambas familias de columnas, y el resumen d
     await escenario(repoRoot, tareasRoot);
     const r = cliOk(repoRoot, ['metricas', '--tokens', '--heuristica']);
     const cab = r.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
-    assert.match(cab, /\| tok_total +\| puntos +\| nivel_heuristico +\|$/);
-    assert.deepEqual(celdas(r.stdout, ID).slice(7 + 1, 7 + 5), ['1000', '3000', '1000', '5000']);
+    assert.match(cab, /\| tok_sin_desglose +\| puntos +\| nivel_heuristico +\|$/);
+    assert.deepEqual(celdas(r.stdout, ID).slice(12, 12 + 4), ['1000', '3000', '1000', '5000']);
     assert.ok(!r.stdout.includes(`| ${ID2} `), 'la muestra heuristica solo trae terminadas con informes');
     assert.match(r.stdout, /Muestra: 1 tareas terminadas/);
     assert.match(r.stdout, /\| 0 +\| 1\/1 /);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
index ec9e1ce..c95612d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
@@ -68,12 +68,18 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     assert.equal(t.task.actualizado, (filas[4] as { fecha: string }).fecha.slice(0, 10));
 
     const r = cliOk(repoRoot, ['metricas']);
-    assert.deepEqual(cabecera(r.stdout), ['id', 'complejidad', 'diseno', 'curso', 'revision', 'rondas', 'cierre', 'origen']);
-    const [id, complejidad, diseno, curso, revision, rondas, cierre, origen] = filaDe(r.stdout);
+    assert.deepEqual(cabecera(r.stdout), [
+      'id', 'complejidad', 'diseno', 'curso', 'revision', 'rondas', 'crit', 'imp', 'men', 'hall_origen', 'cierre', 'origen',
+    ]);
+    const [id, complejidad, diseno, curso, revision, rondas, crit, imp, men, hallOrigen, cierre, origen] = filaDe(r.stdout);
     assert.equal(id, ID);
     assert.equal(complejidad, 'simple');
     for (const d of [diseno, curso, revision]) assert.match(d as string, DURACION_SEGUNDOS);
     assert.equal(rondas, '1');
+    // El informe de prueba trae un MEN-1 sin celda de Origen.
+    assert.deepEqual([crit, imp, men, hallOrigen], ['0', '0', '1', '0/0/0/1']);
+    assert.match(r.stdout, /Informes sin tabla de hallazgos: 0 \(en 0 tareas\)/);
+    assert.match(r.stdout, /Terminadas sin coste en alguna fase: 1 de 1: TASK-001 \(diseno, implementacion, revision\)/);
     assert.equal(cierre, (filas[4] as { fecha: string }).fecha.slice(0, 10));
     assert.equal(origen, 'registro');
     assert.match(r.stdout, /Las pausas no se descuentan/);
@@ -84,8 +90,8 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     const h = cliOk(repoRoot, ['metricas', '--heuristica']);
     assert.deepEqual(cabecera(h.stdout).slice(-2), ['puntos', 'nivel_heuristico']);
     const fila = filaDe(h.stdout);
-    assert.match(fila[8] as string, /^\d+$/);
-    assert.match(fila[9] as string, /^(trivial|simple|media|alta|critica)$/);
+    assert.match(fila[12] as string, /^\d+$/);
+    assert.match(fila[13] as string, /^(trivial|simple|media|alta|critica)$/);
     assert.match(h.stdout, /Muestra: 1 tareas terminadas/);
     assert.match(h.stdout, /Por complejidad declarada:\n {2}simple +n= {2}1 +rondas medias=1\.00/);
 
@@ -96,9 +102,9 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     await writeFile(t.filePath, sinRegistro, 'utf8');
     const g = cliOk(repoRoot, ['metricas']);
     const filaGit = filaDe(g.stdout);
-    assert.equal(filaGit[7], 'git');
+    assert.equal(filaGit[11], 'git');
     for (const d of filaGit.slice(2, 5)) assert.match(d, DURACION_SEGUNDOS);
-    assert.equal(filaGit[6], cierre);
+    assert.equal(filaGit[10], cierre);
   });
 });
 
@@ -152,7 +158,7 @@ test('metricas fuera de un repo Git: las tareas sin registro salen con "—" y u
       await writeFile(copia, sinRegistro, 'utf8');
       const r = cliOk(fuera, ['metricas']);
       assert.match(r.stderr, /\[AVISO\] No se pudo consultar git log/);
-      assert.deepEqual(filaDe(r.stdout).slice(2), ['—', '—', '—', '1', '—', '—']);
+      assert.deepEqual(filaDe(r.stdout).slice(2), ['—', '—', '—', '1', '0', '0', '1', '0/0/0/1', '—', '—']);
     } finally {
       await rm(fuera, { recursive: true, force: true });
     }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
new file mode 100644
index 0000000..0b87ef4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
@@ -0,0 +1,347 @@
+/**
+ * TASK-064: la fila enriquecida de `taskctl metricas`, en puro. Desglose de
+ * `## Coste` frente a `tokens_<fase>` (nunca recortado a 0, repetidas
+ * avisadas), hallazgos una vez por tarea (revisor + ID) con severidad sin
+ * distinguir mayusculas ni tildes, «sin tabla = sin dato», lecturas y
+ * terminadas sin coste.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { leerCostes, resumirCostes, type FilaCoste } from '../../src/core/coste-registro.js';
+import { leerHallazgos, resumirHallazgos, severidadDe, type InformeLeido } from '../../src/core/informe-revision.js';
+import {
+  COLUMNAS_DESGLOSE_TOKENS,
+  COLUMNAS_METRICAS,
+  avisoInformesSinTabla,
+  avisosDeFila,
+  calcularFila,
+  claveTarea,
+  mediana,
+  medianaLecturas,
+  notasFilaEnriquecida,
+  tareasSinCoste,
+  type EntradaMetricas,
+} from '../../src/core/metricas.js';
+import { rondaYRevisorDeInforme } from '../../src/fs/rondas.js';
+import type { Task } from '../../src/core/task.js';
+
+function tarea(o: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-007',
+    titulo: 'Medir',
+    tipo: 'fix',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'terminada',
+    plan_aprobado: true,
+    rama: null,
+    asignado_a: null,
+    agente_revisor: null,
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
+    creado: '2026-10-01',
+    actualizado: '2026-10-05',
+    dependencias: [],
+    ...o,
+  } as Task;
+}
+
+function entrada(o: Partial<EntradaMetricas> = {}): EntradaMetricas {
+  return { task: tarea(), body: '## Objetivo\n\nAlgo.\n', ronda: 0, eventosGit: [], ...o };
+}
+
+function agente(fase: FilaCoste['fase'], fuente: string, e: number, w: number, r: number, s: number, l: number | null): FilaCoste {
+  return {
+    fecha: '2026-10-25T10:00:00Z',
+    fase,
+    fuente,
+    entrada: e,
+    cacheEscritura: w,
+    cacheLectura: r,
+    salida: s,
+    lecturas: l,
+    total: e + w + r + s,
+  };
+}
+
+function manual(fase: FilaCoste['fase'], total: number): FilaCoste {
+  return {
+    fecha: '2026-10-25T11:00:00Z',
+    fase,
+    fuente: 'manual',
+    entrada: null,
+    cacheEscritura: null,
+    cacheLectura: null,
+    salida: null,
+    lecturas: null,
+    total,
+  };
+}
+
+function filaTexto(f: FilaCoste): string {
+  const c = (n: number | null): string => (n === null ? '-' : String(n));
+  return `| ${f.fecha} | ${f.fase} | ${f.fuente} | ${c(f.entrada)} | ${c(f.cacheEscritura)} | ${c(f.cacheLectura)} | ${c(f.salida)} | ${c(f.lecturas)} | ${String(f.total)} |`;
+}
+
+function cuerpoConCoste(filas: readonly FilaCoste[], extra = ''): string {
+  return (
+    '## Objetivo\n\nAlgo.\n\n## Criterios de aceptacion\n- [ ] uno\n- [ ] dos\n- [ ] tres\n\n## Coste\n\n' +
+    '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |\n' +
+    '|---|---|---|---|---|---|---|---|---|\n' +
+    filas.map(filaTexto).join('\n') +
+    '\n' +
+    extra
+  );
+}
+
+// --- Coste -------------------------------------------------------------------
+
+test('resumirCostes: nuevos = entrada + escritura + salida, lectura de cache aparte, y lo manual queda sin desglose', () => {
+  const filas = [agente('diseno', 'agente:a1', 10, 200, 3000, 40, 7), manual('diseno', 500), agente('revision', 'agente:b2', 1, 2, 3, 4, null)];
+  const r = resumirCostes(filas, { diseno: 3750, implementacion: 900, revision: 10 });
+  assert.equal(r.conTabla, true);
+  // 10+200+3000+40 = 3250 desglosado; 3750 - 3250 = 500 (la fila manual).
+  assert.deepEqual(r.fases.diseno, {
+    registrado: 3750,
+    filas: 2,
+    desglosado: 3250,
+    nuevos: 250,
+    cacheLectura: 3000,
+    sinDesglose: 500,
+    lecturas: 7,
+  });
+  // Fase sin filas pero con total: todo sin desglose (coste anterior a la tabla).
+  assert.equal(r.fases.implementacion.sinDesglose, 900);
+  assert.equal(r.fases.implementacion.lecturas, null, 'sin filas no hay lecturas: no medido, no 0');
+  // lecturas null en la unica fila de revision: no medido.
+  assert.equal(r.fases.revision.lecturas, null);
+  assert.equal(r.fases.revision.sinDesglose, 0);
+  assert.deepEqual(r.repetidas, []);
+});
+
+test('resumirCostes: diferencia negativa sin recortar a 0; fase sin total ni filas es null', () => {
+  const r = resumirCostes([agente('implementacion', 'agente:x', 100, 100, 100, 100, 3)], {
+    diseno: null,
+    implementacion: 250,
+    revision: null,
+  });
+  assert.equal(r.fases.implementacion.sinDesglose, -150);
+  assert.equal(r.fases.diseno.sinDesglose, null);
+  // Sin tabla: conTabla false aunque haya totales.
+  assert.equal(resumirCostes([], { diseno: 5, implementacion: null, revision: null }).conTabla, false);
+});
+
+test('resumirCostes: un agente en dos filas de la misma fase es repetida (tambien dentro de una lista); manual no', () => {
+  const filas = [
+    agente('diseno', 'agente:a1', 1, 1, 1, 1, 1),
+    agente('diseno', 'agente:a1', 1, 1, 1, 1, 1),
+    agente('implementacion', 'agente:b2,c3', 1, 1, 1, 1, 1),
+    agente('implementacion', 'agente:c3', 1, 1, 1, 1, 1),
+    agente('revision', 'agente:a1', 1, 1, 1, 1, 1),
+    manual('revision', 10),
+    manual('revision', 10),
+  ];
+  const r = resumirCostes(filas, { diseno: 8, implementacion: 8, revision: 24 });
+  assert.deepEqual(r.repetidas, [
+    { fase: 'diseno', fuente: 'a1', filas: 2 },
+    { fase: 'implementacion', fuente: 'c3', filas: 2 },
+  ]);
+  // No se deduplica: las dos filas de a1 suman.
+  assert.equal(r.fases.diseno.desglosado, 8);
+  assert.equal(r.fases.diseno.sinDesglose, 0);
+});
+
+// MEN-1 de TASK-063: una seccion `## Coste` REAL con un bloque de codigo que
+// contiene una fila valida. Sin la guarda de bloques, leerCostes la contaria.
+test('leerCostes: una fila valida dentro de un bloque de codigo en una seccion ## Coste real no cuenta', () => {
+  const buena = agente('diseno', 'agente:a1', 1, 2, 3, 4, 5);
+  const citada = agente('revision', 'agente:zz', 100, 100, 100, 100, 100);
+  const body = cuerpoConCoste([buena], `\nEjemplo citado:\n\n\`\`\`\n${filaTexto(citada)}\n\`\`\`\n`);
+  assert.deepEqual(leerCostes(body), [buena]);
+});
+
+// --- Hallazgos ---------------------------------------------------------------
+
+test('severidadDe: sin distinguir mayusculas, tildes ni enfasis; fuera del vocabulario, null', () => {
+  for (const [celda, esperado] of [
+    ['IMPORTANTE', 'IMPORTANTE'],
+    ['Importante', 'IMPORTANTE'],
+    ['importante', 'IMPORTANTE'],
+    ['Crítico', 'CRITICO'],
+    ['**CRÍTICO**', 'CRITICO'],
+    ['menor', 'MENOR'],
+    ['Alta', null],
+    ['Major', null],
+    ['', null],
+  ] as const) {
+    assert.equal(severidadDe(celda), esperado, celda);
+  }
+  const lectura = leerHallazgos('## Hallazgos\n\n| ID | Severidad | Estado |\n|---|---|---|\n| IMP-1 | Importante | abierto |\n');
+  assert.equal(lectura.hallazgos[0]?.severidadReconocida, 'IMPORTANTE');
+  assert.equal(lectura.hallazgos[0]?.severidad, 'Importante', 'la celda original no se toca (review la imprime)');
+});
+
+const tabla = (filas: string): string =>
+  `- Veredicto: aprobada\n\n## Hallazgos\n\n| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n${filas}`;
+
+function informe(fichero: string, texto: string): InformeLeido {
+  const r = rondaYRevisorDeInforme(fichero);
+  assert.ok(r, fichero);
+  return { fichero, ...r, texto };
+}
+
+test('resumirHallazgos: un hallazgo repetido entre rondas cuenta una vez, con la severidad y el origen de la ultima', () => {
+  const r = resumirHallazgos([
+    informe('informe-revision-2.md', tabla('| IMP-1 | Menor | corregido | a.ts | plan |\n| MEN-2 | menor | abierto | b.ts | |\n')),
+    informe('informe-revision-1.md', tabla('| IMP-1 | IMPORTANTE | abierto | a.ts | implementacion |\n| CRIT-1 | Crítico | abierto | c.ts | especificacion |\n')),
+  ]);
+  assert.equal(r.informes, 2);
+  // IMP-1 (ronda 2 manda: MENOR, plan), CRIT-1, MEN-2.
+  assert.deepEqual(r.porSeveridad, { CRITICO: 1, IMPORTANTE: 0, MENOR: 2, desconocida: 0 });
+  assert.deepEqual(r.porOrigen, { implementacion: 0, plan: 1, especificacion: 1, 'sin clasificar': 1 });
+});
+
+test('resumirHallazgos: la clave es revisor + ID: el mismo ID de dos revisores son dos hallazgos', () => {
+  const r = resumirHallazgos([
+    informe('informe-revision-1-java-spring-reviewer.md', tabla('| MEN-1 | MENOR | abierto | a | |\n')),
+    informe('informe-revision-1-code-quality-reviewer.md', tabla('| MEN-1 | MENOR | abierto | b | |\n')),
+    informe('informe-revision-2-code-quality-reviewer.md', tabla('| men-1 | MENOR | corregido | b | |\n')),
+  ]);
+  assert.deepEqual(r.porSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 2, desconocida: 0 });
+});
+
+test('resumirHallazgos: sin informes = no medido; un informe sin tabla = sin dato (null), no cero', () => {
+  const vacio = resumirHallazgos([]);
+  assert.equal(vacio.informes, 0);
+  assert.equal(vacio.porSeveridad, null);
+  assert.equal(vacio.porOrigen, null);
+
+  const r = resumirHallazgos([
+    informe('informe-revision-1.md', '- Veredicto: cambios-solicitados\n\nTodo en prosa: falta un test.\n'),
+    informe('informe-revision-2.md', tabla('| IMP-1 | IMPORTANTE | corregido | a | |\n')),
+  ]);
+  assert.equal(r.porSeveridad, null, 'contar solo la ronda 2 daria una cifra menor que la real');
+  assert.deepEqual(r.informesSinTabla, ['informe-revision-1.md']);
+});
+
+test('resumirHallazgos: severidad fuera de vocabulario cuenta como desconocida y se lista con su fichero', () => {
+  const r = resumirHallazgos([
+    informe('informe-revision-1.md', tabla('| A-1 | Alta | abierto | a | |\n| B-1 |  | abierto | b | |\n| C-1 | menor | abierto | c | |\n')),
+  ]);
+  assert.deepEqual(r.porSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 1, desconocida: 2 });
+  assert.deepEqual(r.severidadesDesconocidas, [
+    { fichero: 'informe-revision-1.md', id: 'A-1', valor: 'Alta' },
+    { fichero: 'informe-revision-1.md', id: 'B-1', valor: '' },
+  ]);
+});
+
+test('rondaYRevisorDeInforme: ronda y sufijo; lo que no es informe, null', () => {
+  assert.deepEqual(rondaYRevisorDeInforme('informe-revision-3.md'), { ronda: 3, revisor: '' });
+  assert.deepEqual(rondaYRevisorDeInforme('informe-revision-2-java-spring-reviewer.md'), { ronda: 2, revisor: 'java-spring-reviewer' });
+  assert.equal(rondaYRevisorDeInforme('peticion-revision-1.md'), null);
+  assert.equal(rondaYRevisorDeInforme('informe-codex-1.md'), null);
+});
+
+// --- La fila y su salida -----------------------------------------------------
+
+test('calcularFila: campos siempre presentes, con «—» donde no hay dato', () => {
+  const f = calcularFila(entrada({ proyecto: 'demo' }));
+  assert.equal(f.proyecto, 'demo');
+  assert.equal(f.tipo, 'fix');
+  assert.equal(f.coste.conTabla, false);
+  assert.equal(f.hallazgos.informes, 0);
+  assert.deepEqual(f.kbPeticionPorRonda, []);
+  assert.equal(claveTarea('a', 'TASK-001') === claveTarea('b', 'TASK-001'), false, 'mismo id en dos proyectos no choca');
+  const celdas = Object.fromEntries(COLUMNAS_METRICAS.map((c) => [c.cabecera, c.valor(f)]));
+  assert.deepEqual([celdas.crit, celdas.imp, celdas.men, celdas.hall_origen], ['—', '—', '—', '—']);
+  assert.deepEqual(COLUMNAS_DESGLOSE_TOKENS.map((c) => c.valor(f)), ['—', '—', '—']);
+});
+
+test('calcularFila: desglose, hallazgos, criterios y KB de peticion por ronda (sumando las partes de una ronda)', () => {
+  const body = cuerpoConCoste([agente('diseno', 'agente:a1', 10, 20, 300, 40, 9), manual('implementacion', 1000)]);
+  const f = calcularFila(
+    entrada({
+      task: tarea({ tokens_diseno: 370, tokens_implementacion: 1000, tokens_revision: null }),
+      body,
+      ronda: 2,
+      informes: [informe('informe-revision-1.md', tabla('| IMP-1 | Importante | abierto | a | implementacion |\n'))],
+      peticiones: [
+        { ronda: 2, bytes: 2048 },
+        { ronda: 1, bytes: 1024 },
+        { ronda: 2, bytes: 1024 },
+      ],
+    })
+  );
+  assert.equal(f.criterios, 3);
+  assert.deepEqual(f.kbPeticionPorRonda, [
+    { ronda: 1, kb: 1 },
+    { ronda: 2, kb: 3 },
+  ]);
+  assert.deepEqual(COLUMNAS_DESGLOSE_TOKENS.map((c) => c.valor(f)), ['70', '300', '1000']);
+  const celdas = Object.fromEntries(COLUMNAS_METRICAS.map((c) => [c.cabecera, c.valor(f)]));
+  assert.deepEqual([celdas.crit, celdas.imp, celdas.men, celdas.hall_origen], ['0', '1', '0', '1/0/0/0']);
+});
+
+test('avisosDeFila: negativa, total vacio con filas, repetidas y severidades desconocidas, con la tarea y el fichero', () => {
+  const body = cuerpoConCoste([
+    agente('diseno', 'agente:a1', 100, 0, 0, 0, null),
+    agente('diseno', 'agente:a1', 100, 0, 0, 0, null),
+    agente('revision', 'agente:r1', 5, 0, 0, 0, null),
+  ]);
+  const f = calcularFila(
+    entrada({
+      task: tarea({ tokens_diseno: 150 }),
+      body,
+      informes: [informe('informe-revision-1.md', tabla('| X-1 | Major | abierto | a | |\n'))],
+    })
+  );
+  const avisos = avisosDeFila(f);
+  assert.equal(avisos.length, 4, avisos.join('\n'));
+  assert.match(avisos[0] as string, /^TASK-007: lo desglosado .* diseno \(200\) supera tokens_diseno \(150\): diferencia -50/);
+  assert.match(avisos[1] as string, /^TASK-007: tokens_revision esta vacio pero "## Coste" tiene 1 fila/);
+  assert.match(avisos[2] as string, /^TASK-007: en "## Coste", a1 aparece en 2 filas de diseno/);
+  assert.match(avisos[3] as string, /^TASK-007 revision\/informe-revision-1\.md: severidad fuera de vocabulario .* X-1 \("Major"\)/);
+  // La columna muestra el negativo sumado, sin recortar.
+  assert.equal(COLUMNAS_DESGLOSE_TOKENS[2]?.valor(f), '-55');
+});
+
+test('notas: informes sin tabla, mediana de lecturas por fase y terminadas sin coste', () => {
+  const conLecturas = (id: string, l: number, estado: Task['estado'] = 'terminada') =>
+    calcularFila(
+      entrada({
+        task: tarea({ id, estado, tokens_diseno: 4, tokens_implementacion: 4, tokens_revision: 4 }),
+        body: cuerpoConCoste([agente('diseno', 'agente:a', 1, 1, 1, 1, l)]),
+      })
+    );
+  const sinTabla = calcularFila(
+    entrada({
+      task: tarea({ id: 'TASK-009', tokens_diseno: 5, tokens_implementacion: 0 }),
+      informes: [informe('informe-revision-1.md', 'Sin tabla.\n')],
+    })
+  );
+  const enCurso = calcularFila(entrada({ task: tarea({ id: 'TASK-010', estado: 'en-curso' }) }));
+  const filas = [conLecturas('TASK-001', 4), conLecturas('TASK-002', 10), conLecturas('TASK-003', 7), conLecturas('TASK-004', 1), sinTabla, enCurso];
+
+  assert.equal(mediana([]), null);
+  assert.equal(mediana([3, 1, 2]), 2);
+  assert.equal(mediana([4, 10, 7, 1]), 5.5);
+  assert.deepEqual(medianaLecturas(filas).diseno, { mediana: 5.5, n: 4 });
+  assert.deepEqual(medianaLecturas(filas).revision, { mediana: null, n: 0 });
+
+  // tokens_implementacion a 0 cuenta como falta (registrar-coste no deja registrar 0).
+  assert.deepEqual(tareasSinCoste(filas), [{ id: 'TASK-009', fases: ['implementacion', 'revision'] }]);
+
+  const notas = notasFilaEnriquecida(filas).join('\n');
+  assert.match(notas, /Informes sin tabla de hallazgos: 1 \(en 1 tareas\)/);
+  assert.match(notas, /diseno 5\.5 \(n=4\), implementacion — \(n=0\), revision — \(n=0\)/);
+  assert.match(notas, /Terminadas sin coste en alguna fase: 1 de 5: TASK-009 \(implementacion, revision\)\./);
+  assert.match(avisoInformesSinTabla(filas) ?? '', /^1 informe\(s\) de revision sin tabla .* TASK-009\.$/);
+  assert.equal(avisoInformesSinTabla([enCurso]), null);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
index 3fcfdbe..29afed4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
@@ -89,7 +89,7 @@ test('registro con hora: diseno plan->start, curso start->review, revision revie
   assert.equal(f.rondas, 2);
   assert.equal(f.cierre, '2026-10-06');
   const fila = COLUMNAS_METRICAS.map((c) => c.valor(f));
-  assert.deepEqual(fila, ['TASK-007', 'simple', '45m', '2h 05m', '1d 00h', '2', '2026-10-06', 'registro']);
+  assert.deepEqual(fila, ['TASK-007', 'simple', '45m', '2h 05m', '1d 00h', '2', '—', '—', '—', '—', '2026-10-06', 'registro']);
 });
 
 test('precision de dia: filas viejas dan dias enteros, y una sola marca de dia basta para pasar a dias', () => {
@@ -239,7 +239,7 @@ test('sin registro ni git: origen "—" y todo "—"', () => {
   assert.equal(f.origen, '—');
   assert.deepEqual(
     COLUMNAS_METRICAS.map((c) => c.valor(f)),
-    ['TASK-007', 'simple', '—', '—', '—', '3', '—', '—']
+    ['TASK-007', 'simple', '—', '—', '—', '3', '—', '—', '—', '—', '—', '—']
   );
   assert.equal(COLUMNAS_METRICAS.find((c) => c.cabecera === 'complejidad')?.valor(calcularFila(entrada({ task: tarea({ complejidad: null }) }))), '—');
 });
@@ -279,7 +279,7 @@ test('formatearTabla: cabecera, separador y columnas alineadas', () => {
   const f = calcularFila(entrada({ body: cuerpoCon(CICLO_CON_HORA), ronda: 1 }));
   const lineas = formatearTabla([f], COLUMNAS_METRICAS).split('\n');
   assert.equal(lineas.length, 3);
-  assert.match(lineas[0] as string, /^\| id +\| complejidad \| diseno \| curso +\| revision \| rondas \| cierre +\| origen +\|$/);
+  assert.match(lineas[0] as string, /^\| id +\| complejidad \| diseno \| curso +\| revision \| rondas \| crit \| imp \| men \| hall_origen \| cierre +\| origen +\|$/);
   assert.match(lineas[1] as string, /^\|-+\|-+\|/);
   assert.equal(new Set(lineas.map((l) => l.length)).size, 1, 'todas las lineas miden lo mismo');
 });
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-064/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-064/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-064/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-064/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-064/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-064/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-064/tarea.md                                                       |   5 +--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  10 ++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   |  89 +++++++++++++++++++++++++++++++++++++++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-registro.js                                 |  53 ++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                               |  45 +++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       | 159 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js                                           |  11 ++++++
 13 files changed, 354 insertions(+), 18 deletions(-)
````
