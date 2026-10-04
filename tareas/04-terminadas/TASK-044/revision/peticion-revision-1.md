# Peticion de revision — TASK-044 (ronda 1)

- Tarea: TASK-044 — F4-T3 Particion propuesta de las tareas grandes
- Rama revisada: feature/task-044-f4-t3-particion-propuesta-de-las-tareas
- Rama base: develop
- Commit revisado (HEAD): 6f27987cf523a0bbc347a4baa969a0a9e06cf98d
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-044 (criterios de aceptacion y plan)

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
6f27987 docs(TASK-044): resultado
b272c92 feat(TASK-044): particion propuesta de las tareas demasiado grandes
f298f1b chore(TASK-044): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
index 19caa07..9dd012f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
@@ -272,7 +272,7 @@ export async function runImportCommand(
     }
 
     const id = nextTaskId(existingIds);
-    const body = `## Objetivo\n\n\n## Criterios de aceptacion\n${entry.criterios
+    const body = `## Objetivo\n${entry.objetivo === '' ? '\n' : `\n${entry.objetivo}\n`}\n## Criterios de aceptacion\n${entry.criterios
       .map((c) => `- [ ] ${c}`)
       .join('\n')}\n`;
     const task = buildNewTask(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index ef11fee..20f5b29 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -43,6 +43,8 @@ import {
 import { resolverAsignado } from '../core/wip.js';
 import { extraerSecciones } from '../core/tarea-body.js';
 import { validarEnunciado } from '../core/validacion-tarea.js';
+import { proponerParticion } from '../core/particion-tarea.js';
+import { escribirPropuestaParticion } from '../fs/particion.js';
 import {
   cargarHeuristica,
   resolverNumeroAgentes,
@@ -331,6 +333,44 @@ export interface PlanCommandResult {
 export interface PlanCommandDeps {
   /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
   repoCwd: string;
+  /** TASK-044: donde escribir la particion propuesta (por defecto os.tmpdir()). Para tests. */
+  dirParticion?: string;
+}
+
+/**
+ * TASK-044 (C3 de la auditoria): cuando la tarea es demasiado grande, la
+ * particion propuesta (una tarea por frente, lista para `import`) o, si no
+ * hay frentes, como conseguirlos. Se escribe FUERA del repo y antes de
+ * abortar, asi la tarea y el workspace siguen intactos.
+ */
+async function textoParticion(
+  task: Task,
+  secciones: ReturnType<typeof extraerSecciones>,
+  deps: PlanCommandDeps
+): Promise<string> {
+  const propuesta = proponerParticion(task, secciones);
+  if (propuesta === null) {
+    return (
+      '        Para que "taskctl plan" proponga la particion, agrupa los criterios por frente bajo\n' +
+      '        un subtitulo "###" o una linea solo en negrita ("**Frente**"); los grupos\n' +
+      '        "Transversal", "Comunes" o "General" se copian en cada tarea.\n'
+    );
+  }
+  const r = await escribirPropuestaParticion(task.id, propuesta.markdown, deps.repoCwd, deps.dirParticion);
+  if (!r.escrito) {
+    return `        (No se pudo escribir la particion propuesta: ${r.motivo}.)\n`;
+  }
+  return (
+    `        Particion propuesta en ${String(propuesta.titulos.length)} tareas, una por frente:\n` +
+    propuesta.titulos.map((t) => `          · ${t}\n`).join('') +
+    `        Revisala e importala con: taskctl import "${r.ruta}" --tipo ${task.tipo} --sprint ${String(task.sprint)}\n` +
+    (propuesta.hijasGrandes.length === 0
+      ? ''
+      : `        Ojo: ${propuesta.hijasGrandes.map((t) => `«${t}»`).join(', ')} sigue(n) con mas de 12 ` +
+        'criterios al copiar los comunes; recortalos en el fichero.\n') +
+    `        Tras importarla, ${task.id} sigue en 00-planificadas: retirala a mano (no hay comando ` +
+    'para cancelar una tarea).\n'
+  );
 }
 
 export async function runPlanCommand(
@@ -470,6 +510,7 @@ export async function runPlanCommand(
     throw new PlanCommandError(
       `[ERROR] ${task.id}: la tarea no esta lista para planificar:\n` +
         validacion.bloqueos.map((b) => `        - ${b}\n`).join('') +
+        (validacion.demasiadoGrande ? await textoParticion(task, secciones, deps) : '') +
         `        Estas en la rama base: edita "${filePath}", commitea el cambio y reintenta ` +
         '"taskctl plan". La tarea no se ha movido.'
     );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts
index 5da5e01..5e48937 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts
@@ -7,6 +7,9 @@
  *   - <criterio de aceptacion 1>
  *   - <criterio de aceptacion 2>
  *
+ * Opcional: lineas "> texto" justo bajo el "###" y antes del primer
+ * criterio forman el Objetivo de la entrada.
+ *
  * Solo los encabezados de nivel 3 ("###") delimitan una tarea; un
  * encabezado de cualquier otro nivel (#, ##, ####...) cierra la
  * entrada en curso (si la hay) sin consumirse como criterio, y
@@ -34,6 +37,8 @@ const ANY_HEADING_RE = /^#{1,6}\s/;
 // valido y visualmente identica a una sin indentar en cualquier
 // renderizador — anclarla a la columna 0 rechazaba la tarea ENTERA
 // con un mensaje que no explicaba la causa real.
+// Linea de cita (Objetivo): ">" en la columna 0, con un espacio opcional.
+const QUOTE_RE = /^>\s?(.*)$/;
 const LIST_ITEM_RE = /^\s*[-*]\s+(.+)$/;
 
 export interface ParsedImportEntryOk {
@@ -42,6 +47,12 @@ export interface ParsedImportEntryOk {
   lineNumber: number;
   titulo: string;
   criterios: string[];
+  /**
+   * Objetivo de la entrada: las lineas "> texto" entre el "###" y el primer
+   * criterio, sin el "> " inicial; una linea ">" sola es un salto de
+   * parrafo. Cadena vacia si la entrada no lleva Objetivo.
+   */
+  objetivo: string;
 }
 
 export interface ParsedImportEntryError {
@@ -60,6 +71,8 @@ interface InProgressEntry {
   tituloRaw: string;
   lineNumber: number;
   criterios: string[];
+  /** Lineas del Objetivo (ya sin el "> "), en orden. */
+  objetivoLineas: string[];
   /** Primera linea que no es ni criterio ni linea en blanco, si aparece alguna. */
   strayLine: { text: string; lineNumber: number } | null;
 }
@@ -98,7 +111,13 @@ export function parseImportMarkdown(content: string): ParsedImportEntry[] {
           'siguiente encabezado.',
       });
     } else {
-      entries.push({ ok: true, titulo, lineNumber: current.lineNumber, criterios: current.criterios });
+      entries.push({
+        ok: true,
+        titulo,
+        lineNumber: current.lineNumber,
+        criterios: current.criterios,
+        objetivo: current.objetivoLineas.join('\n').trim(),
+      });
     }
     current = null;
   };
@@ -109,7 +128,7 @@ export function parseImportMarkdown(content: string): ParsedImportEntry[] {
     const h3 = HEADING_LEVEL_3_RE.exec(line);
     if (h3) {
       flush();
-      current = { tituloRaw: h3[1] ?? '', lineNumber: i + 1, criterios: [], strayLine: null };
+      current = { tituloRaw: h3[1] ?? '', lineNumber: i + 1, criterios: [], objetivoLineas: [], strayLine: null };
       continue;
     }
 
@@ -130,6 +149,14 @@ export function parseImportMarkdown(content: string): ParsedImportEntry[] {
       continue;
     }
 
+    // Objetivo: "> texto" antes del primer criterio. Tras un criterio (o con
+    // prosa suelta ya detectada) un ">" sigue siendo prosa suelta.
+    const quote = QUOTE_RE.exec(line);
+    if (quote && current.criterios.length === 0 && current.strayLine === null) {
+      current.objetivoLineas.push(quote[1] ?? '');
+      continue;
+    }
+
     const li = LIST_ITEM_RE.exec(line);
     if (li) {
       current.criterios.push((li[1] ?? '').trim());
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts
new file mode 100644
index 0000000..9f19e46
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts
@@ -0,0 +1,73 @@
+/**
+ * Particion propuesta de una tarea demasiado grande — TASK-044 (auditoria
+ * del 2026-10-03, C3). Modulo puro: recibe la tarea y sus secciones y
+ * devuelve el texto de un fichero que `taskctl import` acepta, o null si
+ * la tarea no trae frentes con los que partirla. Quien llama decide donde
+ * escribirlo.
+ *
+ * Decisiones del plan (ver su plan-final.md):
+ * - Un frente es un grupo de criterios con titulo (`###` o linea en
+ *   negrita) que no sea transversal. El Objetivo no se mira: da falsos
+ *   positivos (subtitulos de contexto).
+ * - Los grupos transversales («Transversal», «Comunes», «General») y los
+ *   criterios sueltos se copian en cada hija: «suite en verde» o
+ *   «revision por pares» valen para cada una y no entregan nada solos.
+ * - `### Tras el cierre` no entra como criterio (finish lo exigiria
+ *   marcado); se lista en el preambulo para reponerlo a mano.
+ * - Cada hija lleva Objetivo (lineas `> ` que import entiende desde
+ *   TASK-044): sin el, nacerian bloqueadas por la puerta de plan.
+ */
+import type { Task } from './task.js';
+import type { SeccionesTarea } from './tarea-body.js';
+import { frentesDe, gruposComunes, MAX_CRITERIOS } from './validacion-tarea.js';
+
+export interface PropuestaParticion {
+  /** Titulos de las tareas hijas, en orden. */
+  titulos: string[];
+  /** Hijas que, con los criterios comunes copiados, pasan de MAX_CRITERIOS. */
+  hijasGrandes: string[];
+  /** Contenido del fichero para `taskctl import`. */
+  markdown: string;
+}
+
+function citar(texto: string): string {
+  return texto
+    .split(/\r?\n/)
+    .map((l) => (l.trim() === '' ? '>' : `> ${l.trimEnd()}`))
+    .join('\n');
+}
+
+export function proponerParticion(task: Task, s: SeccionesTarea): PropuestaParticion | null {
+  const frentes = frentesDe(s.grupos);
+  if (frentes.length < 2) return null;
+  const comunes = gruposComunes(s.grupos).flatMap((g) => g.criterios);
+
+  const titulos: string[] = [];
+  const hijasGrandes: string[] = [];
+  const bloques: string[] = [];
+  const vistos = new Set<string>();
+  for (const frente of frentes) {
+    let titulo = `${task.id} ${frente.titulo ?? ''}`.trim();
+    // Dos grupos con el mismo titulo darian dos hijas que import rechaza
+    // por duplicadas: la segunda se numera.
+    for (let n = 2; vistos.has(titulo.toLowerCase()); n++) titulo = `${task.id} ${frente.titulo ?? ''} (${String(n)})`;
+    vistos.add(titulo.toLowerCase());
+    titulos.push(titulo);
+
+    const criterios = [...frente.criterios, ...comunes];
+    if (criterios.length > MAX_CRITERIOS) hijasGrandes.push(titulo);
+    const objetivo =
+      `Parte de ${task.id} (${task.titulo}): el frente «${frente.titulo ?? ''}».` +
+      (s.objetivo.trim() === '' ? '' : `\n\nObjetivo de la tarea original:\n\n${s.objetivo.trim()}`);
+    bloques.push(`### ${titulo}\n${citar(objetivo)}\n${criterios.map((c) => `- ${c}`).join('\n')}\n`);
+  }
+
+  const preambulo =
+    `Particion propuesta de ${task.id} (${task.titulo}) por "taskctl plan": una tarea por frente.\n` +
+    'Revisala antes de importarla. Los criterios comunes se han copiado en cada tarea.\n' +
+    (s.criteriosTrasCierre.length === 0
+      ? ''
+      : 'Criterios de "Tras el cierre" que hay que reponer a mano en la tarea que corresponda: ' +
+        `${s.criteriosTrasCierre.map((c) => `«${c}»`).join('; ')}.\n`);
+  return { titulos, hijasGrandes, markdown: `${preambulo}\n${bloques.join('\n')}` };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
index a162706..bd9b697 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
@@ -50,8 +50,24 @@ export interface SeccionesTarea {
    * verifican despues de `finish`). No cuentan para cerrar la tarea.
    */
   criteriosTrasCierre: string[];
+  /**
+   * TASK-044: los mismos `criterios`, agrupados como los escribio la
+   * persona. Abre grupo un subtitulo `###` (salvo `Tras el cierre`) o una
+   * linea sin sangrar que sea solo negrita (`**C4 — config**`, el caso de
+   * TASK-030). Los criterios anteriores al primer grupo van en uno con
+   * `titulo: null`. Los grupos sin criterios no aparecen.
+   */
+  grupos: GrupoCriterios[];
+}
+
+export interface GrupoCriterios {
+  titulo: string | null;
+  criterios: string[];
 }
 
+/** Linea sin sangrar hecha solo de negrita: cabecera de grupo (TASK-044). */
+const RE_GRUPO_NEGRITA = /^\*\*(.+?)\*\*:?\s*$/;
+
 /** Cabecera ATX de nivel 2 a 6 (ver decision 2 de la cabecera). */
 const RE_CABECERA = /^ {0,3}#{2,6}(?:\s|$)/;
 
@@ -87,6 +103,11 @@ export function normalizarTexto(texto: string): string {
 }
 
 /** El titulo de una cabecera ATX, sin almohadillas ni diacriticos. */
+/** El titulo de una cabecera tal como se escribio (para mostrarlo). */
+function textoDeCabecera(linea: string): string {
+  return linea.trim().replace(/^#+\s*/, '').replace(/\s*#+$/, '').trim();
+}
+
 function tituloDeCabecera(linea: string): string {
   return normalizarTexto(
     linea
@@ -122,6 +143,10 @@ export function extraerSecciones(body: string): SeccionesTarea {
   let criteriosVisto = false;
   // Una linea sangrada solo continua un criterio si va pegada a el.
   let continuable = false;
+  // TASK-044: a que grupo pertenece cada criterio normal (indice paralelo
+  // a `normales`), y el titulo de cada grupo. El 0 es el de los sueltos.
+  const titulosGrupo: (string | null)[] = [null];
+  const grupoDe: number[] = [];
 
   for (const linea of lineas) {
     // TASK-046 (D2 de la auditoria): un subtitulo de nivel 3 o mas dentro
@@ -140,6 +165,7 @@ export function extraerSecciones(body: string): SeccionesTarea {
         objetivo.push(linea);
       } else {
         destino = tituloSub === TITULO_TRAS_CIERRE ? trasCierre : normales;
+        if (destino === normales) titulosGrupo.push(textoDeCabecera(linea));
         // MEN-3: una linea sangrada justo debajo de un subtitulo no es la
         // continuacion del ultimo criterio de la subseccion anterior.
         continuable = false;
@@ -171,9 +197,16 @@ export function extraerSecciones(body: string): SeccionesTarea {
       const criterio = RE_CRITERIO.exec(linea);
       if (criterio !== null) {
         destino.push((criterio[1] ?? '').trim());
+        if (destino === normales) grupoDe.push(titulosGrupo.length - 1);
         continuable = true;
         continue;
       }
+      const negrita = destino === normales ? RE_GRUPO_NEGRITA.exec(linea) : null;
+      if (negrita !== null) {
+        titulosGrupo.push((negrita[1] ?? '').trim());
+        continuable = false;
+        continue;
+      }
       if (continuable && destino.length > 0 && RE_CONTINUACION.test(linea)) {
         const ultimo = destino[destino.length - 1] ?? '';
         destino[destino.length - 1] = `${ultimo} ${linea.trim()}`.trim();
@@ -183,5 +216,13 @@ export function extraerSecciones(body: string): SeccionesTarea {
     }
   }
 
-  return { objetivo: objetivo.join('\n').trim(), criterios: normales, criteriosTrasCierre: trasCierre };
+  const grupos: GrupoCriterios[] = titulosGrupo
+    .map((titulo, i) => ({ titulo, criterios: normales.filter((_, k) => grupoDe[k] === i) }))
+    .filter((g) => g.criterios.length > 0);
+  return {
+    objetivo: objetivo.join('\n').trim(),
+    criterios: normales,
+    criteriosTrasCierre: trasCierre,
+    grupos,
+  };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
index 8b6fc0e..c24812c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
@@ -14,7 +14,7 @@
  *   criterio hecho solo de palabras vagas sin nada comprobable.
  * - AVISA de lo que conviene mirar: 9 a 12 criterios y criterios sin ancla.
  */
-import type { SeccionesTarea } from './tarea-body.js';
+import type { GrupoCriterios, SeccionesTarea } from './tarea-body.js';
 
 export const MAX_CRITERIOS = 12;
 export const AVISO_CRITERIOS = 8;
@@ -22,6 +22,26 @@ export const AVISO_CRITERIOS = 8;
 export interface ResultadoValidacion {
   bloqueos: string[];
   avisos: string[];
+  /** TASK-044: bloquea por numero de criterios (plan propone particion). */
+  demasiadoGrande: boolean;
+}
+
+/** Titulos de grupo que no son un frente sino criterios de todos (TASK-044). */
+const GRUPOS_TRANSVERSALES = ['transversal', 'transversales', 'comun', 'comunes', 'general', 'generales'];
+
+function esTransversal(g: GrupoCriterios): boolean {
+  if (g.titulo === null) return true;
+  return GRUPOS_TRANSVERSALES.includes(normalizar(g.titulo).replace(/[^a-z]/g, ''));
+}
+
+/** Grupos que son un frente propio: con titulo y no transversales. */
+export function frentesDe(grupos: readonly GrupoCriterios[]): GrupoCriterios[] {
+  return grupos.filter((g) => !esTransversal(g));
+}
+
+/** Grupos cuyos criterios valen para todos los frentes (y los sueltos). */
+export function gruposComunes(grupos: readonly GrupoCriterios[]): GrupoCriterios[] {
+  return grupos.filter(esTransversal);
 }
 
 /**
@@ -113,6 +133,16 @@ export function validarEnunciado(s: SeccionesTarea): ResultadoValidacion {
         'las revisiones se alargan; valora partirla'
     );
   }
+  // TASK-044: varios frentes con 12 criterios o menos AVISAN, no bloquean
+  // (decision 1 del plan: el bloqueo no tendria salida, y agrupar por capas
+  // una sola tarea es legitimo).
+  const frentes = frentesDe(s.grupos ?? []);
+  if (criterios.length <= MAX_CRITERIOS && frentes.length >= 2) {
+    avisos.push(
+      `tiene ${String(frentes.length)} frentes (${frentes.map((g) => `«${g.titulo ?? ''}»`).join(', ')}): ` +
+        'si son independientes, valora partirla en una tarea por frente'
+    );
+  }
   const vagos = criterios.filter((c) => c.trim() !== '' && esSoloVago(c) && !tieneAncla(c));
   for (const c of vagos) {
     bloqueos.push(`el criterio «${c}» solo dice palabras vagas: di como se comprueba`);
@@ -124,7 +154,7 @@ export function validarEnunciado(s: SeccionesTarea): ResultadoValidacion {
         `un numero, codigo o un test): ${sinAncla.map((c) => `«${c}»`).join('; ')}`
     );
   }
-  return { bloqueos, avisos };
+  return { bloqueos, avisos, demasiadoGrande: criterios.length > MAX_CRITERIOS };
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/particion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/particion.ts
new file mode 100644
index 0000000..d926083
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/particion.ts
@@ -0,0 +1,50 @@
+/**
+ * Escritura de la particion propuesta — TASK-044. Va FUERA del repo: dentro
+ * ensuciaria el workspace y el guard de `taskctl import` abortaria el
+ * propio import. Una carpeta nueva por intento (`mkdtemp`, el precedente de
+ * sincronizacion.ts): dos proyectos con el mismo ID o dos `plan` a la vez no
+ * se pisan, y una propuesta ya editada por la persona no se sobrescribe.
+ */
+import { mkdtemp, realpath, rename, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+
+export type ResultadoEscrituraParticion =
+  | { escrito: true; ruta: string }
+  | { escrito: false; motivo: string };
+
+/** true si `ruta` esta dentro de `raiz` (las dos ya resueltas con realpath). */
+function estaDentro(ruta: string, raiz: string): boolean {
+  const rel = path.relative(raiz, ruta);
+  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
+}
+
+/**
+ * Nunca lanza: si no se puede escribir, quien llama sigue con su error de
+ * bloqueo y solo menciona el motivo (no nombra un fichero que no existe).
+ */
+export async function escribirPropuestaParticion(
+  id: string,
+  markdown: string,
+  repoCwd: string,
+  base: string = tmpdir()
+): Promise<ResultadoEscrituraParticion> {
+  try {
+    // realpath en los dos lados: en Windows tmpdir() puede venir en
+    // nombre corto 8.3 (C:\Users\NOMBRE~1) y path.relative se equivocaria.
+    const raiz = await realpath(repoCwd);
+    const baseReal = await realpath(base);
+    if (estaDentro(baseReal, raiz)) {
+      return { escrito: false, motivo: `el directorio temporal "${baseReal}" cae dentro del repo` };
+    }
+    const dir = await mkdtemp(path.join(baseReal, `taskctl-particion-${id}-`));
+    const ruta = path.join(dir, `particion-${id}.md`);
+    // Temporal + rename: un fichero a medias lo aceptaria import en parte.
+    const temporal = `${ruta}.tmp`;
+    await writeFile(temporal, markdown, 'utf8');
+    await rename(temporal, ruta);
+    return { escrito: true, ruta };
+  } catch (e) {
+    return { escrito: false, motivo: e instanceof Error ? e.message : String(e) };
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
index be34371..891c294 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
@@ -343,3 +343,33 @@ test('runImportCommand: dos imports concurrentes sobre el mismo repo no pierden
     if (rb.errores.length > 0) assert.match(rb.errores[0]!.motivo, /concurrente/);
   });
 });
+
+test('runImportCommand: el Objetivo de la entrada se escribe en el tarea.md; sin Objetivo queda vacio como siempre', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const md = await writeFixture(
+      '### Con objetivo\n> Linea uno\n> linea dos\n>\n> Otro parrafo\n- criterio a\n\n### Sin objetivo\n- criterio b\n'
+    );
+
+    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
+
+    assert.equal(result.creadas.length, 2);
+    const con = await readFile(result.creadas[0]!.filePath, 'utf8');
+    assert.match(
+      con.replace(/\r\n/g, '\n'),
+      /## Objetivo\n\nLinea uno\nlinea dos\n\nOtro parrafo\n\n## Criterios de aceptacion\n- \[ \] criterio a\n/
+    );
+    const sin = await readFile(result.creadas[1]!.filePath, 'utf8');
+    assert.match(sin.replace(/\r\n/g, '\n'), /## Objetivo\n\n\n## Criterios de aceptacion\n- \[ \] criterio b\n/);
+  });
+});
+
+test('runImportCommand: un ">" tras un criterio invalida la entrada y no crea nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const md = await writeFixture('### Mala\n> objetivo\n- criterio a\n> suelta\n');
+
+    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
+
+    assert.equal(result.creadas.length, 0);
+    assert.equal(result.errores.length, 1);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/particion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/particion.test.ts
new file mode 100644
index 0000000..67d131f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/particion.test.ts
@@ -0,0 +1,208 @@
+/**
+ * TASK-044: particion propuesta de una tarea demasiado grande. El test que
+ * manda es la cadena entera contra un repo Git real (el riesgo que el rol
+ * de riesgos senalo como el peor: una particion que import acepta pero que
+ * no sirve porque sus hijas nacen bloqueadas): plan del padre bloquea y
+ * escribe la propuesta FUERA del repo -> import del fichero -> plan de una
+ * hija pasa.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runPlanCommand, PlanCommandError } from '../../src/commands/plan.js';
+import { runImportCommand } from '../../src/commands/import.js';
+import { extraerSecciones } from '../../src/core/tarea-body.js';
+import { proponerParticion } from '../../src/core/particion-tarea.js';
+import { parseImportMarkdown } from '../../src/core/import-parser.js';
+import { validarEnunciado } from '../../src/core/validacion-tarea.js';
+import type { Task } from '../../src/core/task.js';
+
+function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-440',
+    titulo: 'Config y auto-commit',
+    tipo: 'feature',
+    sprint: 4,
+    etiquetas: [],
+    complejidad: null,
+    modelo_sugerido: 'sonnet',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-440-config-y-auto-commit',
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
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-particion-test-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+const lista = (prefijo: string, k: number): string =>
+  Array.from({ length: k }, (_, i) => `- [ ] \`taskctl\` ${prefijo} ${String(i + 1)}\n`).join('');
+
+/** El caso de TASK-030: dos frentes en negrita, un Transversal y Tras el cierre (18 criterios). */
+const CUERPO_DOS_FRENTES =
+  '## Objetivo\n\nCerrar config y auto-commit.\n\n## Criterios de aceptacion\n\n' +
+  '**C4 — config**\n' + lista('config', 7) + '\n' +
+  '**C2 — auto-commit**\n' + lista('commit', 7) + '\n' +
+  '**Transversal**\n' + lista('comun', 4) + '\n' +
+  '### Tras el cierre\n- [ ] CI en verde\n';
+
+test('extraerSecciones (TASK-044): agrupa por negrita y ###; los sueltos van al grupo sin titulo', () => {
+  const s = extraerSecciones(
+    '## Criterios de aceptacion\n- [ ] suelto\n**Uno**\n- [ ] a\n  sigue\n### Dos\n- [x] b\n### Tras el cierre\n- [ ] c\n'
+  );
+  assert.deepEqual(s.grupos, [
+    { titulo: null, criterios: ['suelto'] },
+    { titulo: 'Uno', criterios: ['a sigue'] },
+    { titulo: 'Dos', criterios: ['b'] },
+  ]);
+  assert.deepEqual(s.criterios, ['suelto', 'a sigue', 'b'], 'los criterios planos no cambian');
+  assert.deepEqual(s.criteriosTrasCierre, ['c']);
+});
+
+test('proponerParticion (TASK-044): una hija por frente, comunes copiados, Tras el cierre en el preambulo, y import la acepta entera', () => {
+  const task = sampleTask();
+  const p = proponerParticion(task, extraerSecciones(CUERPO_DOS_FRENTES));
+  assert.ok(p !== null);
+  assert.deepEqual(p.titulos, ['TASK-440 C4 — config', 'TASK-440 C2 — auto-commit']);
+  assert.deepEqual(p.hijasGrandes, [], '7 + 4 = 11 criterios por hija');
+  const entradas = parseImportMarkdown(p.markdown);
+  assert.equal(entradas.length, 2);
+  for (const e of entradas) {
+    assert.ok(e.ok, JSON.stringify(e));
+    assert.equal(e.criterios.length, 11);
+    assert.ok(e.criterios.some((c) => c.includes('comun 1')), 'el transversal se copia');
+    assert.ok(!e.criterios.some((c) => c.includes('CI en verde')), 'Tras el cierre no es criterio');
+    assert.match(e.objetivo, /Parte de TASK-440/);
+    assert.match(e.objetivo, /Cerrar config y auto-commit/);
+  }
+  assert.match(p.markdown.split('###')[0] ?? '', /«CI en verde»/);
+});
+
+test('proponerParticion (TASK-044): con un solo frente (o solo transversales) no hay particion', () => {
+  assert.equal(proponerParticion(sampleTask(), extraerSecciones(`## Criterios de aceptacion\n**Uno**\n${lista('a', 13)}`)), null);
+  assert.equal(proponerParticion(sampleTask(), extraerSecciones(`## Criterios de aceptacion\n${lista('a', 13)}`)), null);
+});
+
+test('validarEnunciado (TASK-044): 2 frentes con 12 criterios o menos avisan, no bloquean', () => {
+  const r = validarEnunciado(
+    extraerSecciones(`## Objetivo\n\nX.\n\n## Criterios de aceptacion\n### Parser\n${lista('p', 3)}### CLI\n${lista('c', 3)}`)
+  );
+  assert.deepEqual(r.bloqueos, []);
+  assert.equal(r.demasiadoGrande, false);
+  assert.ok(r.avisos.some((a) => /tiene 2 frentes \(«Parser», «CLI»\)/.test(a)), r.avisos.join('\n'));
+});
+
+/**
+ * Mutaciones que lo ponen rojo: no escribir la particion en plan; escribir
+ * las hijas sin Objetivo (el plan de la hija bloquearia); convertir el
+ * Transversal en una hija propia.
+ */
+test('plan -> import -> plan (TASK-044): la particion propuesta sirve de verdad', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), CUERPO_DOS_FRENTES);
+    commitAll(repoRoot, 'tarea TASK-440');
+    const head = git(['rev-parse', 'HEAD'], repoRoot);
+
+    let ruta = '';
+    await assert.rejects(
+      () => runPlanCommand(tareasRoot, ['TASK-440'], '2026-10-04', { repoCwd: repoRoot }),
+      (e: unknown) => {
+        assert.ok(e instanceof PlanCommandError);
+        assert.match(e.message, /tiene 18 criterios/);
+        assert.match(e.message, /Particion propuesta en 2 tareas/);
+        assert.match(e.message, /retirala a mano/);
+        const m = /taskctl import "([^"]+)" --tipo feature --sprint 4/.exec(e.message);
+        assert.ok(m !== null, e.message);
+        ruta = m[1] as string;
+        return true;
+      }
+    );
+    assert.ok(existsSync(ruta));
+    assert.ok(path.relative(repoRoot, ruta).startsWith('..'), 'la propuesta vive fuera del repo');
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head, 'plan no commitea nada');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'ni ensucia el workspace');
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-440'))?.task.estado, 'planificada');
+
+    try {
+      const imp = await runImportCommand(tareasRoot, [ruta], '2026-10-04', { repoCwd: repoRoot });
+      assert.equal(imp.creadas.length, 2, JSON.stringify(imp.errores));
+      const hija = imp.creadas[0]!;
+      const leida = await readTareaFile(tareasRoot, hija.id);
+      assert.match(leida?.body ?? '', /## Objetivo\n\nParte de TASK-440/);
+
+      const p = await runPlanCommand(tareasRoot, [hija.id], '2026-10-04', { repoCwd: repoRoot });
+      assert.equal((await readTareaFile(tareasRoot, p.id))?.task.estado, 'en-diseno');
+    } finally {
+      await rm(path.dirname(ruta), { recursive: true, force: true });
+    }
+  });
+});
+
+test('plan (TASK-044): si el directorio temporal cae dentro del repo no escribe y lo dice', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), CUERPO_DOS_FRENTES);
+    commitAll(repoRoot, 'tarea TASK-440');
+    await assert.rejects(
+      () => runPlanCommand(tareasRoot, ['TASK-440'], '2026-10-04', { repoCwd: repoRoot, dirParticion: repoRoot }),
+      (e: unknown) => {
+        assert.ok(e instanceof PlanCommandError);
+        assert.match(e.message, /No se pudo escribir la particion propuesta: .*cae dentro del repo/);
+        assert.doesNotMatch(e.message, /taskctl import "/);
+        return true;
+      }
+    );
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('plan (TASK-044): demasiado grande y sin grupos, explica como agrupar', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), `## Objetivo\n\nX.\n\n## Criterios de aceptacion\n${lista('a', 13)}`);
+    commitAll(repoRoot, 'tarea TASK-440');
+    await assert.rejects(
+      () => runPlanCommand(tareasRoot, ['TASK-440'], '2026-10-04', { repoCwd: repoRoot }),
+      (e: unknown) => e instanceof PlanCommandError && /agrupa los criterios por frente/.test(e.message)
+    );
+  });
+});
+
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/import-parser.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/import-parser.test.ts
index dec4081..149a1c1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/import-parser.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/import-parser.test.ts
@@ -118,3 +118,41 @@ test('parseImportMarkdown: tolera mezclar criterios indentados y sin indentar en
     assert.deepEqual(e.criterios, ['sin indentar', 'indentado', 'mas indentado, con asterisco']);
   }
 });
+
+test('parseImportMarkdown: Objetivo de varias lineas y un salto de parrafo', () => {
+  const entries = parseImportMarkdown(
+    '### Con objetivo\n' +
+      '> Primera linea del objetivo\n' +
+      '> segunda linea\n' +
+      '>\n' +
+      '> Otro parrafo\n' +
+      '\n' +
+      '- criterio a\n' +
+      '- criterio b\n'
+  );
+  assert.equal(entries.length, 1);
+  const e = entries[0]!;
+  assert.equal(e.ok, true);
+  if (e.ok) {
+    assert.equal(e.objetivo, 'Primera linea del objetivo\nsegunda linea\n\nOtro parrafo');
+    assert.deepEqual(e.criterios, ['criterio a', 'criterio b']);
+  }
+});
+
+test('parseImportMarkdown: sin Objetivo el campo es cadena vacia y lo demas no cambia', () => {
+  const entries = parseImportMarkdown('### Sin objetivo\n- criterio a\n');
+  assert.deepEqual(entries, [{ ok: true, titulo: 'Sin objetivo', lineNumber: 1, criterios: ['criterio a'], objetivo: '' }]);
+});
+
+test('parseImportMarkdown: un ">" DESPUES de un criterio sigue siendo prosa suelta invalida', () => {
+  const entries = parseImportMarkdown('### Mala\n> objetivo valido\n- criterio a\n> esto ya no\n');
+  assert.equal(entries.length, 1);
+  const e = entries[0]!;
+  assert.equal(e.ok, false);
+  if (!e.ok) assert.match(e.motivo, /La linea 4 no es un criterio/);
+});
+
+test('parseImportMarkdown: solo Objetivo y ningun criterio sigue siendo invalido', () => {
+  const entries = parseImportMarkdown('### Sin criterios\n> objetivo\n');
+  assert.equal(entries[0]!.ok, false);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts
index 29dfb98..7e2b110 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts
@@ -15,7 +15,7 @@ import {
 import type { SeccionesTarea } from '../../src/core/tarea-body.js';
 
 function secciones(objetivo: string, criterios: string[]): SeccionesTarea {
-  return { objetivo, criterios, criteriosTrasCierre: [] };
+  return { objetivo, criterios, criteriosTrasCierre: [], grupos: [] };
 }
 
 const n = (k: number): string[] => Array.from({ length: k }, (_, i) => `\`taskctl\` caso ${String(i + 1)}`);
@@ -30,7 +30,7 @@ test('validarEnunciado: objetivo vacio y cero criterios bloquean, con un motivo
 test('validarEnunciado: el limite es exactamente 12 (bloquea 13) y el aviso empieza en 9', () => {
   assert.equal(MAX_CRITERIOS, 12);
   assert.equal(AVISO_CRITERIOS, 8);
-  assert.deepEqual(validarEnunciado(secciones('X', n(8))), { bloqueos: [], avisos: [] });
+  assert.deepEqual(validarEnunciado(secciones('X', n(8))), { bloqueos: [], avisos: [], demasiadoGrande: false });
   const nueve = validarEnunciado(secciones('X', n(9)));
   assert.equal(nueve.bloqueos.length, 0);
   assert.match(nueve.avisos[0] as string, /tiene 9 criterios/);
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-044/tarea.md                                                                        | 43 -------------------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-044/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-044/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-044/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-044/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-044/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-044/planificacion/plan-final.md                                    |  0
 tareas/02-en-curso/TASK-044/tarea.md                                                                         | 76 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js                                     |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       | 30 ++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/import-parser.js                                  | 22 ++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/particion-tarea.js                                | 39 +++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-body.js                                     | 30 +++++++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/validacion-tarea.js                               | 25 ++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/particion.js                                        | 40 ++++++++++++++++++++++++++++++++++++++++
 15 files changed, 259 insertions(+), 48 deletions(-)
````
