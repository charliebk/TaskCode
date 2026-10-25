# Peticion de revision — TASK-063 (ronda 1)

- Tarea: TASK-063 — Metricas v2 (A): capturar desglose de coste, lecturas y origen de hallazgos
- Rama revisada: feature/task-063-metricas-v2-medir-el-comportamiento-del
- Rama base: develop
- Commit revisado (HEAD): 3148321440c45cb6ce494100d3307e11b2e19292
- Fecha: 2026-10-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-063 (criterios de aceptacion y plan)

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
3148321 chore(TASK-063): coste implementacion +12285172 tokens (1 agente)
e7b51f8 docs(TASK-063): CHANGELOG de metricas v2 parte A
201c4fa feat(TASK-063): finish avisa sin coste de implementacion
5113bf6 test(TASK-063): origen de los hallazgos en informe y skills
fb82624 feat(TASK-063): columna Origen por hallazgo y leerHallazgos
4a7135b test(TASK-063): desglose, lecturas y tabla ## Coste
66c16ae feat(TASK-063): desglose de coste y lecturas en la tabla ## Coste
8b01afd chore(TASK-063): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 7f0d7bc..94a88d2 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -2,6 +2,31 @@
 
 ## Sin publicar
 
+Metricas v2, parte A (TASK-063): se capturan los datos que faltaban para
+decidir mejoras con cifras. Solo captura y cambia formatos; `taskctl metricas`
+los leera en TASK-064.
+
+- `taskctl registrar-coste` deja ademas una fila en una tabla nueva `## Coste`
+  del cuerpo de `tarea.md` (`fecha | fase | fuente | entrada | cache_escritura |
+  cache_lectura | salida | lecturas | total`), en el mismo commit que suma el
+  total a `tokens_<fase>`. Con `--agente`, el desglose sumado de sus
+  transcripciones (`fuente` = `agente:<id>[,<id>...]`); con `--tokens N`, una
+  fila `manual` con solo el total y `-` en el resto. Las tareas sin tabla
+  siguen siendo validas.
+- `lecturas`: cuantos `tool_use` de lectura hizo el agente, sin repetir id. Son
+  lectura Read, Grep, Glob y una lista cerrada de herramientas MCP de lectura o
+  busqueda (`HERRAMIENTAS_LECTURA` en `src/core/coste-transcripcion.ts`), y Bash
+  con un comando que empieza por `cat`, `head`, `tail`, `grep`, `rg`, `find`,
+  `ls` o `sed -n`. Es heuristico a sabiendas.
+- La plantilla del informe de `taskctl review` y las skills de revision llevan
+  una columna `Origen` por hallazgo (`implementacion`, `plan` o
+  `especificacion`) con la instruccion de rellenarla. `leerHallazgos` la lee,
+  normalizada (minusculas, sin tildes); un valor fuera del vocabulario, la
+  celda vacia o un informe antiguo sin la columna cuentan como `sin
+  clasificar`.
+- `taskctl finish` avisa tambien, sin bloquear, si la tarea se cierra con
+  `tokens_implementacion` vacio o a 0.
+
 ## 0.7.0 — 2026-10-08
 
 Merge request en cualquier GitLab y `taskctl doctor`. Requiere Node 22 o
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index e6888d2..afe45e4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -28,7 +28,10 @@ punto, no un formalismo.
    agente revisor independiente, en paralelo y en un solo mensaje, con la
    skill revisora que nombra la peticion. Que reproduzca empiricamente (clon
    temporal, suite una vez, mutantes) y devuelva su informe con la tabla de
-   hallazgos. Vuelca cada respuesta en su `informe-revision-N*.md`
+   hallazgos, con la columna `Origen` rellena en cada fila
+   (`implementacion`, `plan` o `especificacion`: si el fallo es del codigo,
+   de un plan ambiguo que el codigo siguio, o del enunciado de la tarea).
+   Vuelca cada respuesta en su `informe-revision-N*.md`
    **conservando la cabecera de la plantilla** con la linea `- Revisor:`
    rellenada, su linea `- Veredicto:`, y la fila de ejemplo de la tabla
    borrada (tambien sin hallazgos); un informe que conserve la plantilla sin
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
index 729b40a..7c7fc2d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
@@ -56,7 +56,14 @@ Escribe y commitea solo el `tarea.md` de la tarea: con ese fichero a medias
 en el arbol aborta, y desde la rama base aborta si la tarea vive en su rama
 (dice a cual cambiar). Con una cadena abierta exige `--cadena <testigo>`.
 
-`taskctl finish` avisa, sin bloquear, si falta el coste de diseno o de
-revision. `taskctl metricas --tokens` lo tabula por tarea, por sprint y por
+Cada llamada deja ademas una fila en la tabla `## Coste` del cuerpo de
+`tarea.md` (en el mismo commit que el total): con `--agente`, el desglose
+sumado de sus agentes (entrada, escritura y lectura de cache, salida, y
+cuantas lecturas de ficheros hicieron); con `--tokens N`, una fila `manual`
+con solo el total. No la edites a mano: el total de la fase sigue siendo el
+campo `tokens_<fase>`, y la tabla es su desglose.
+
+`taskctl finish` avisa, sin bloquear, si falta el coste de diseno, de
+implementacion (vacio o a 0) o de revision. `taskctl metricas --tokens` lo tabula por tarea, por sprint y por
 complejidad; con `--escribir` regenera un bloque delimitado del fichero de
 metricas del proyecto, sin tocar el resto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index 23263ab..2feb9dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -105,9 +105,20 @@ que comandos, que suite, que mutaciones. Un "sin hallazgos" sin esa lista no
 se distingue de no haber mirado.
 
 El matiz va en el **cuerpo** del informe, con la tabla de hallazgos de la
-plantilla (`ID | Severidad | Estado | Fichero`), no en la linea del
+plantilla (`ID | Severidad | Estado | Fichero | Origen`), no en la linea del
 veredicto.
 
+La columna `Origen` se rellena **en cada hallazgo**, con una de tres
+palabras, para poder medir de donde vienen los fallos:
+
+- `implementacion`: el codigo no hace lo que el plan pedia.
+- `plan`: el plan era ambiguo o equivocado, y el codigo lo siguio.
+- `especificacion`: el fallo esta en el enunciado de la tarea o en sus
+  criterios de aceptacion.
+
+Si dudas entre dos, la que habria evitado el fallo antes. Una celda vacia o
+con otra palabra cuenta como sin clasificar.
+
 ## La linea del veredicto
 
 `finish` decide si la tarea puede cerrarse leyendo el informe de mayor N, y lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 806f297..d34daca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -101,7 +101,9 @@ regenera en el bloque delimitado de docs/METRICAS.md (sin commitear). Sin
 --escribir solo lee.
 registrar-coste SUMA al coste de una fase de la tarea (en cualquier estado) y lo commitea:
 --agente <id> lee lo gastado de la transcripcion de cada subagente (el id lo devuelve la
-herramienta Agent); --tokens N da una cifra a mano. Se excluyen, y 0 se rechaza.
+herramienta Agent); --tokens N da una cifra a mano. Se excluyen, y 0 se rechaza. Cada
+llamada deja ademas una fila en la tabla "## Coste" de tarea.md: con --agente, el desglose
+(entrada, cache_escritura, cache_lectura, salida, lecturas); con --tokens, solo el total.
 finish cierra con merge normal (lo de siempre). --tag <nombre> pone un tag anotado (titulo de
 la tarea) sobre el commit de merge; solo se sube con --push. --merge-request sube la rama
 y abre un PR (github.com, gh) o un MR (host con "gitlab", glab) contra la rama base en lugar
@@ -770,7 +772,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
     try {
-      const r = await runRegistrarCosteCommand(tareasRoot, argv.slice(1), { repoCwd });
+      const r = await runRegistrarCosteCommand(tareasRoot, argv.slice(1), { repoCwd, ahora: ahora() });
       process.stdout.write(
         `Tarea ${r.id}: +${String(r.sumado)} tokens de ${r.fase}${r.agentes > 0 ? ` (${String(r.agentes)} subagente(s))` : ''}; total de la fase: ${String(r.total)} ` +
           `(${r.filePath}).\n`
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index a45f313..a9816cf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -334,14 +334,17 @@ export async function runFinishCommand(
     );
   }
   // TASK-023: avisar, sin bloquear (misma doctrina que el aviso de arriba),
-  // de las fases con LLM sin coste registrado. tokens_implementacion no avisa:
-  // puede no haber habido subagentes en el curso.
+  // de las fases con LLM sin coste registrado. TASK-063: tambien
+  // implementacion, vacia o a 0 (sin ella no se puede comparar el coste
+  // entre tareas); si de verdad no hubo subagentes, la parte del
+  // orquestador se registra con --tokens N.
   const sinCoste = (
     [
       ['diseno', initial.task.tokens_diseno],
+      ['implementacion', initial.task.tokens_implementacion],
       ['revision', initial.task.tokens_revision],
     ] as const
-  ).filter(([, v]) => v === null);
+  ).filter(([fase, v]) => v === null || (fase === 'implementacion' && v === 0));
   for (const [fase] of sinCoste) {
     deps.onAviso?.(
       `${id}: sin coste de ${fase} registrado (tokens_${fase}). Registralo con ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index dabcbfb..1d0dc41 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -29,6 +29,11 @@
  *    el commit es pathspec-limitado.
  * 4. Una cifra de 0 se rechaza: registrar nada no tiene sentido y dejaria un
  *    commit que parece un registro.
+ * 5. TASK-063: cada llamada deja ademas una fila en la tabla `## Coste` del
+ *    cuerpo (`core/coste-registro.ts`), en el mismo fichero y el mismo
+ *    commit que el total. Con `--agente`, el desglose sumado de sus agentes
+ *    (entrada, escritura y lectura de cache, salida, lecturas); con
+ *    `--tokens N`, una fila `manual` con solo el total.
  */
 import { writeFile } from 'node:fs/promises';
 import { rechazarFlagsDesconocidos, parseArgs } from '../cli/args.js';
@@ -36,6 +41,8 @@ import { readTareaFile } from '../fs/task-store.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
 import type { Task } from '../core/task.js';
 import { esAgentIdValido, sumarUsoTranscripcion } from '../core/coste-transcripcion.js';
+import { anadirCoste, FASES_COSTE, type FaseCoste, type FilaCoste } from '../core/coste-registro.js';
+import { formatearInstante } from '../core/transiciones.js';
 import { buscarTranscripciones, directorioConfigClaude, leerTranscripcion } from '../fs/transcripciones.js';
 import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
 import {
@@ -55,15 +62,16 @@ export const CAMPO_COSTE_POR_FASE = {
   diseno: 'tokens_diseno',
   implementacion: 'tokens_implementacion',
   revision: 'tokens_revision',
-} as const;
+} as const satisfies Record<FaseCoste, string>;
 
-export type FaseCoste = keyof typeof CAMPO_COSTE_POR_FASE;
-export const FASES_COSTE = Object.keys(CAMPO_COSTE_POR_FASE) as FaseCoste[];
+export { FASES_COSTE, type FaseCoste };
 
 export interface RegistrarCosteCommandDeps {
   repoCwd: string;
   /** Directorio de configuracion de Claude Code (tests); por defecto CLAUDE_CONFIG_DIR o ~/.claude. */
   configDir?: string;
+  /** TASK-063: instante UTC de la fila de `## Coste` (`formatearInstante`); por defecto, ahora. */
+  ahora?: string;
 }
 
 export interface RegistrarCosteCommandResult {
@@ -75,6 +83,8 @@ export interface RegistrarCosteCommandResult {
   total: number;
   /** Cuantos subagentes se han leido de su transcripcion (0 con --tokens). */
   agentes: number;
+  /** TASK-063: la fila anadida a la tabla `## Coste`. */
+  fila: FilaCoste;
   filePath: string;
   autoCommit: AutoCommitResult;
 }
@@ -153,8 +163,18 @@ function leerFaseYTokens(
   return { fase: fase as FaseCoste, tokens };
 }
 
+/** Lo sumado de las transcripciones: el total y su desglose (TASK-063). */
+interface CosteDeAgentes {
+  tokens: number;
+  entrada: number;
+  cacheEscritura: number;
+  cacheLectura: number;
+  salida: number;
+  lecturas: number;
+}
+
 /** Suma lo que gasto cada subagente segun su transcripcion; falla diciendo que hacer. */
-async function tokensDeAgentes(agentes: readonly string[], configDir: string): Promise<number> {
+async function costeDeAgentes(agentes: readonly string[], configDir: string): Promise<CosteDeAgentes> {
   const unicos = [...new Set(agentes)];
   for (const id of unicos) {
     if (!esAgentIdValido(id)) {
@@ -164,7 +184,7 @@ async function tokensDeAgentes(agentes: readonly string[], configDir: string): P
       );
     }
   }
-  let total = 0;
+  const suma: CosteDeAgentes = { tokens: 0, entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0, lecturas: 0 };
   for (const id of unicos) {
     const rutas = await buscarTranscripciones(configDir, id);
     const donde = `${configDir}/projects/*/*/subagents/agent-${id}.jsonl`;
@@ -190,14 +210,19 @@ async function tokensDeAgentes(agentes: readonly string[], configDir: string): P
           'No se ha tocado nada.'
       );
     }
-    total += uso.tokens;
+    suma.tokens += uso.tokens;
+    suma.entrada += uso.entrada;
+    suma.cacheEscritura += uso.cacheEscritura;
+    suma.cacheLectura += uso.cacheLectura;
+    suma.salida += uso.salida;
+    suma.lecturas += uso.lecturas;
   }
-  if (total === 0) {
+  if (suma.tokens === 0) {
     throw new RegistrarCosteCommandError(
       '[ERROR] Las transcripciones suman 0 tokens: registrar nada no tiene sentido. No se ha tocado nada.'
     );
   }
-  return total;
+  return suma;
 }
 
 export async function runRegistrarCosteCommand(
@@ -247,9 +272,11 @@ export async function runRegistrarCosteCommand(
     );
   }
 
-  const nAgentes = new Set(agentes).size;
-  const tokens =
-    tokensManuales ?? (await tokensDeAgentes(agentes, deps.configDir ?? directorioConfigClaude()));
+  const unicos = [...new Set(agentes)];
+  const nAgentes = unicos.length;
+  const desglose =
+    tokensManuales === null ? await costeDeAgentes(unicos, deps.configDir ?? directorioConfigClaude()) : null;
+  const tokens = desglose?.tokens ?? (tokensManuales as number);
   const campo = CAMPO_COSTE_POR_FASE[fase];
   const total = (task[campo] ?? 0) + tokens;
   if (!Number.isSafeInteger(total)) {
@@ -259,7 +286,19 @@ export async function runRegistrarCosteCommand(
     );
   }
   const nueva: Task = { ...task, [campo]: total };
-  await writeFile(filePath, serializeTareaFile(nueva, body), 'utf8');
+  // TASK-063: la fila del desglose viaja en el mismo fichero y commit que el total.
+  const fila: FilaCoste = {
+    fecha: deps.ahora ?? formatearInstante(new Date()),
+    fase,
+    fuente: desglose === null ? 'manual' : `agente:${unicos.join(',')}`,
+    entrada: desglose?.entrada ?? null,
+    cacheEscritura: desglose?.cacheEscritura ?? null,
+    cacheLectura: desglose?.cacheLectura ?? null,
+    salida: desglose?.salida ?? null,
+    lecturas: desglose?.lecturas ?? null,
+    total: tokens,
+  };
+  await writeFile(filePath, serializeTareaFile(nueva, anadirCoste(body, fila)), 'utf8');
 
   const detalle = nAgentes > 0 ? ` (${String(nAgentes)} agente${nAgentes === 1 ? '' : 's'})` : '';
   const commit = autoCommit({
@@ -268,5 +307,5 @@ export async function runRegistrarCosteCommand(
     mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens${detalle}`),
     push,
   });
-  return { id, fase, sumado: tokens, total, agentes: nAgentes, filePath, autoCommit: commit };
+  return { id, fase, sumado: tokens, total, agentes: nAgentes, fila, filePath, autoCommit: commit };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 0c150d7..1940eab 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -343,9 +343,15 @@ export function informeTemplate(task: Task, commitRevisado: string, ronda: numbe
     '## Hallazgos\n\n' +
     // La tabla es para que una maquina la lea (la ronda incremental,
     // TASK-040); la reproduccion de cada hallazgo va debajo, en prosa.
-    '| ID | Severidad | Estado | Fichero |\n' +
-    '|---|---|---|---|\n' +
-    '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) |\n\n' +
+    // TASK-063: `Origen` por hallazgo, para medir cuantos fallos vienen del
+    // plan o del enunciado y no del codigo (lo lee `leerHallazgos`).
+    '| ID | Severidad | Estado | Fichero | Origen |\n' +
+    '|---|---|---|---|---|\n' +
+    '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) | ' +
+    '(implementacion / plan / especificacion) |\n\n' +
+    'Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el\n' +
+    'plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el\n' +
+    'enunciado o en los criterios de aceptacion de la tarea.\n\n' +
     'Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.\n'
   );
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
new file mode 100644
index 0000000..c1a3390
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
@@ -0,0 +1,151 @@
+/**
+ * Desglose del coste de una tarea (TASK-063): la seccion `## Coste` de
+ * `tarea.md`, una fila por cada `taskctl registrar-coste`.
+ *
+ * | fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
+ * |---|---|---|---|---|---|---|---|---|
+ * | 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 |
+ * | 2026-10-25T15:10:00Z | diseno | manual | - | - | - | - | - | 5000 |
+ *
+ * Calcado de `core/transiciones.ts` (misma busqueda de seccion, fuera de
+ * bloques de codigo, la ultima gana), y por la misma razon que TASK-056: una
+ * tabla en el cuerpo y no claves de frontmatter, que no anida y obligaria a
+ * tocar el parser y `TASK_FIELD_ORDER` con quince claves planas nuevas.
+ *
+ * El TOTAL de cada fase sigue en `tokens_<fase>` del frontmatter: la tabla es
+ * el desglose de ese total y la escribe el mismo comando en el mismo commit.
+ * Una tarea anterior no tiene tabla y sigue siendo valida; lo que el
+ * desglose no cubra lo calcula quien lo lea (`tokens_<fase>` menos la suma de
+ * sus filas).
+ *
+ * Columnas:
+ *  - `fuente`: `agente:<id>[,<id>...]` (lo leido de las transcripciones) o
+ *    `manual` (`--tokens N`, una cifra sin desglose).
+ *  - `entrada` .. `salida`: los cuatro campos del `usage`; `lecturas`, los
+ *    `tool_use` de lectura (`core/coste-transcripcion.ts`). `-` = sin dato,
+ *    que no es 0: una fila `manual` solo tiene `total`.
+ *  - `total`: lo que la fila sumo a `tokens_<fase>`. Sin ella, una fila
+ *    manual no tendria donde poner su cifra.
+ *
+ * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas ni
+ * toca nada fuera de su seccion; leer nunca falla.
+ */
+import { dentroDeBloque, precisionDeFecha, rangoDeSeccion } from './transiciones.js';
+
+export const SECCION_COSTE = '## Coste';
+
+/** Fases con coste propio, cada una con su `tokens_<fase>` en el frontmatter. */
+export const FASES_COSTE = ['diseno', 'implementacion', 'revision'] as const;
+export type FaseCoste = (typeof FASES_COSTE)[number];
+
+export interface FilaCoste {
+  /** `YYYY-MM-DDTHH:MM:SSZ` (o `YYYY-MM-DD`, que tambien se lee). */
+  fecha: string;
+  fase: FaseCoste;
+  /** `agente:<id>[,<id>...]` o `manual`. */
+  fuente: string;
+  entrada: number | null;
+  cacheEscritura: number | null;
+  cacheLectura: number | null;
+  salida: number | null;
+  lecturas: number | null;
+  total: number;
+}
+
+export const CABECERA_COSTE =
+  '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |';
+const SEPARADOR = '|---|---|---|---|---|---|---|---|---|';
+const COLUMNAS = 9;
+const SIN_DATO = '-';
+
+function celda(n: number | null): string {
+  return n === null ? SIN_DATO : String(n);
+}
+
+function filaATexto(f: FilaCoste): string {
+  return (
+    `| ${f.fecha} | ${f.fase} | ${f.fuente} | ${celda(f.entrada)} | ${celda(f.cacheEscritura)} | ` +
+    `${celda(f.cacheLectura)} | ${celda(f.salida)} | ${celda(f.lecturas)} | ${String(f.total)} |`
+  );
+}
+
+/**
+ * Anade una fila al desglose. Si la seccion no existe la crea al final del
+ * cuerpo; si existe, la fila va detras de su ultima fila de tabla.
+ */
+export function anadirCoste(body: string, fila: FilaCoste): string {
+  const eol = body.includes('\r\n') ? '\r\n' : '\n';
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_COSTE);
+
+  if (rango === null) {
+    const base = body.replace(/(\r?\n)*$/, '');
+    const separacion = base === '' ? '' : eol + eol;
+    return base + separacion + [SECCION_COSTE, '', CABECERA_COSTE, SEPARADOR, filaATexto(fila)].join(eol) + eol;
+  }
+
+  const [inicio, fin] = rango;
+  const enBloque = dentroDeBloque(lineas);
+  let ultimaTabla = -1;
+  for (let i = inicio + 1; i < fin; i++) {
+    if (!enBloque[i] && (lineas[i] as string).trimStart().startsWith('|')) ultimaTabla = i;
+  }
+  const nuevas =
+    ultimaTabla === -1
+      ? // Seccion sin tabla (editada a mano): la tabla va justo bajo el titulo.
+        [...lineas.slice(0, inicio + 1), '', CABECERA_COSTE, SEPARADOR, filaATexto(fila), ...lineas.slice(inicio + 1)]
+      : [...lineas.slice(0, ultimaTabla + 1), filaATexto(fila), ...lineas.slice(ultimaTabla + 1)];
+  return nuevas.join(eol);
+}
+
+const ENTERO_RE = /^\d+$/;
+
+/** Celda numerica: entero >= 0, `-` (sin dato) o undefined si no es valida. */
+function leerNumero(c: string): number | null | undefined {
+  if (c === SIN_DATO) return null;
+  if (!ENTERO_RE.test(c)) return undefined;
+  const n = Number(c);
+  return Number.isSafeInteger(n) ? n : undefined;
+}
+
+/**
+ * Filas validas del desglose, en orden. Las que no casan (cabecera,
+ * separador, filas editadas a mano con valores raros) se ignoran.
+ */
+export function leerCostes(body: string): FilaCoste[] {
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_COSTE);
+  if (rango === null) return [];
+  const enBloque = dentroDeBloque(lineas);
+  const filas: FilaCoste[] = [];
+  for (let i = rango[0] + 1; i < rango[1]; i++) {
+    if (enBloque[i]) continue;
+    const celdas = (lineas[i] as string)
+      .trim()
+      .replace(/^\|/, '')
+      .replace(/\|$/, '')
+      .split('|')
+      .map((c) => c.trim());
+    if (celdas.length !== COLUMNAS) continue;
+    const [fecha, fase, fuente, ...numeros] = celdas as [string, string, string, ...string[]];
+    if (precisionDeFecha(fecha) === null) continue;
+    if (!(FASES_COSTE as readonly string[]).includes(fase)) continue;
+    if (fuente === '') continue;
+    const valores = numeros.map(leerNumero);
+    if (valores.some((v) => v === undefined)) continue;
+    const [entrada, cacheEscritura, cacheLectura, salida, lecturas, total] = valores as (number | null)[];
+    if (total === null || total === undefined) continue;
+    filas.push({
+      fecha,
+      fase: fase as FaseCoste,
+      fuente,
+      entrada: entrada ?? null,
+      cacheEscritura: cacheEscritura ?? null,
+      cacheLectura: cacheLectura ?? null,
+      salida: salida ?? null,
+      lecturas: lecturas ?? null,
+      total,
+    });
+  }
+  return filas;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
index 0bc31f7..161dc6a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
@@ -17,6 +17,18 @@
  *  - Las lineas que no son JSON, o no son de asistente con usage, se ignoran.
  *    Una linea con usage pero sin id se cuenta tal cual (no se puede
  *    deduplicar).
+ *
+ * TASK-063: ademas del total, el desglose (entrada, escritura y lectura de
+ * cache, salida) con la misma deduplicacion, y `lecturas`: cuantas veces
+ * leyo el agente para orientarse. Una lectura es un bloque `tool_use` del
+ * `message.content` de una linea de asistente, contado UNA vez por su `id`
+ * (el streaming tambien lo repite; uno sin id se cuenta tal cual), que:
+ *  - tiene un `name` de `HERRAMIENTAS_LECTURA`, o
+ *  - es `Bash` y su `input.command`, sin espacios iniciales, empieza por un
+ *    comando de `COMANDOS_BASH_LECTURA` o por `sed -n`.
+ * Es heuristico a sabiendas: `cd x && cat y` no cuenta y `cat > f` si. Lo
+ * que importa es la tendencia entre tareas, no la cifra exacta. Sin ningun
+ * `tool_use`, `lecturas` es 0.
  */
 
 /** agentId que devuelve la herramienta Agent: hexadecimal. Se valida antes de componer rutas. */
@@ -26,35 +38,102 @@ export function esAgentIdValido(id: string): boolean {
   return AGENT_ID_RE.test(id);
 }
 
+/**
+ * Herramientas que cuentan como lectura del proyecto (TASK-063). Lista
+ * CERRADA a proposito: una herramienta nueva se anade aqui, no se adivina
+ * por su nombre. Son las de Claude Code (Read, Grep, Glob; LS y
+ * NotebookRead de versiones anteriores) y las de lectura o busqueda de dos
+ * servidores MCP comunes: el `filesystem` de referencia y el grafo de codigo
+ * `tokensave`. Un MCP instalado como plugin lleva otro prefijo en el nombre
+ * y no casa: se anade con su nombre completo.
+ */
+export const HERRAMIENTAS_LECTURA: readonly string[] = [
+  'Read',
+  'Grep',
+  'Glob',
+  'LS',
+  'NotebookRead',
+  'mcp__filesystem__read_file',
+  'mcp__filesystem__read_text_file',
+  'mcp__filesystem__read_media_file',
+  'mcp__filesystem__read_multiple_files',
+  'mcp__filesystem__list_directory',
+  'mcp__filesystem__list_directory_with_sizes',
+  'mcp__filesystem__directory_tree',
+  'mcp__filesystem__search_files',
+  'mcp__filesystem__get_file_info',
+  'mcp__tokensave__tokensave_context',
+  'mcp__tokensave__tokensave_search',
+  'mcp__tokensave__tokensave_read',
+];
+
+/** Comandos de Bash que cuentan como lectura si el comando EMPIEZA por ellos. `sed` cuenta solo con `-n`. */
+export const COMANDOS_BASH_LECTURA: readonly string[] = ['cat', 'head', 'tail', 'grep', 'rg', 'find', 'ls'];
+
+const BASH_LECTURA_RE = new RegExp(`^(?:${COMANDOS_BASH_LECTURA.join('|')}|sed\\s+-n)(?:\\s|$)`);
+
+/** true si un comando de Bash es de lectura segun la regla de la cabecera. */
+export function esComandoBashDeLectura(comando: string): boolean {
+  return BASH_LECTURA_RE.test(comando.trimStart());
+}
+
 export interface UsoTranscripcion {
   /** Tokens procesados: entrada + escritura y lectura de cache + salida. */
   tokens: number;
   /** Llamadas distintas (message.id unicos) que se han sumado. */
   llamadas: number;
+  /** `input_tokens` sumados (TASK-063). */
+  entrada: number;
+  /** `cache_creation_input_tokens` sumados. */
+  cacheEscritura: number;
+  /** `cache_read_input_tokens` sumados. */
+  cacheLectura: number;
+  /** `output_tokens` sumados. */
+  salida: number;
+  /** `tool_use` de lectura distintos (ver la cabecera). */
+  lecturas: number;
+}
+
+interface Desglose {
+  entrada: number;
+  cacheEscritura: number;
+  cacheLectura: number;
+  salida: number;
 }
 
 function numero(v: unknown): number {
   return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
 }
 
-function tokensDeUsage(u: Record<string, unknown>): number {
-  return (
-    numero(u['input_tokens']) +
-    numero(u['cache_creation_input_tokens']) +
-    numero(u['cache_read_input_tokens']) +
-    numero(u['output_tokens'])
-  );
+function desgloseDeUsage(u: Record<string, unknown>): Desglose {
+  return {
+    entrada: numero(u['input_tokens']),
+    cacheEscritura: numero(u['cache_creation_input_tokens']),
+    cacheLectura: numero(u['cache_read_input_tokens']),
+    salida: numero(u['output_tokens']),
+  };
 }
 
 function esObjeto(v: unknown): v is Record<string, unknown> {
   return typeof v === 'object' && v !== null && !Array.isArray(v);
 }
 
+/** true si un bloque `tool_use` es una lectura (ver la cabecera). */
+function esLectura(bloque: Record<string, unknown>): boolean {
+  const nombre = bloque['name'];
+  if (typeof nombre !== 'string') return false;
+  if (HERRAMIENTAS_LECTURA.includes(nombre)) return true;
+  if (nombre !== 'Bash') return false;
+  const input = bloque['input'];
+  return esObjeto(input) && typeof input['command'] === 'string' && esComandoBashDeLectura(input['command']);
+}
+
 /** null si la transcripcion no tiene ninguna linea de asistente con usage (formato desconocido). */
 export function sumarUsoTranscripcion(texto: string): UsoTranscripcion | null {
-  const porId = new Map<string, number>();
-  let sinId = 0;
-  let sumaSinId = 0;
+  const porId = new Map<string, Desglose>();
+  const sinId: Desglose[] = [];
+  const lecturasPorId = new Set<string>();
+  let lecturasSinId = 0;
   for (const linea of texto.split(/\r?\n/)) {
     if (linea.trim() === '') continue;
     let obj: unknown;
@@ -65,19 +144,34 @@ export function sumarUsoTranscripcion(texto: string): UsoTranscripcion | null {
     }
     if (!esObjeto(obj) || obj['type'] !== 'assistant') continue;
     const mensaje = obj['message'];
-    if (!esObjeto(mensaje) || !esObjeto(mensaje['usage'])) continue;
-    const tokens = tokensDeUsage(mensaje['usage']);
+    if (!esObjeto(mensaje)) continue;
+    const contenido = mensaje['content'];
+    if (Array.isArray(contenido)) {
+      for (const bloque of contenido) {
+        if (!esObjeto(bloque) || bloque['type'] !== 'tool_use' || !esLectura(bloque)) continue;
+        const idBloque = bloque['id'];
+        if (typeof idBloque === 'string' && idBloque !== '') lecturasPorId.add(idBloque);
+        else lecturasSinId++;
+      }
+    }
+    if (!esObjeto(mensaje['usage'])) continue;
+    const desglose = desgloseDeUsage(mensaje['usage']);
     const id = mensaje['id'];
     if (typeof id === 'string' && id !== '') {
-      porId.set(id, tokens); // la ultima aparicion gana
+      porId.set(id, desglose); // la ultima aparicion gana
     } else {
-      sinId++;
-      sumaSinId += tokens;
+      sinId.push(desglose);
     }
   }
-  const llamadas = porId.size + sinId;
+  const llamadas = porId.size + sinId.length;
   if (llamadas === 0) return null;
-  let tokens = sumaSinId;
-  for (const t of porId.values()) tokens += t;
-  return { tokens, llamadas };
+  const suma: Desglose = { entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0 };
+  for (const d of [...porId.values(), ...sinId]) {
+    suma.entrada += d.entrada;
+    suma.cacheEscritura += d.cacheEscritura;
+    suma.cacheLectura += d.cacheLectura;
+    suma.salida += d.salida;
+  }
+  const tokens = suma.entrada + suma.cacheEscritura + suma.cacheLectura + suma.salida;
+  return { tokens, llamadas, ...suma, lecturas: lecturasPorId.size + lecturasSinId };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index d256e93..1afa1f1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -111,6 +111,28 @@ export interface LecturaHallazgos {
   abiertos: Hallazgo[];
 }
 
+/**
+ * De donde viene un hallazgo (TASK-063), segun la columna `Origen` que
+ * rellena el revisor: el codigo no hace lo que se pedia (`implementacion`),
+ * el plan era ambiguo o equivocado y el codigo lo siguio (`plan`), o el
+ * enunciado o sus criterios fallaban (`especificacion`). Vocabulario
+ * cerrado; cualquier otro valor, la celda vacia o la columna ausente
+ * (informes anteriores) es `sin clasificar`.
+ */
+export const ORIGENES_HALLAZGO = ['implementacion', 'plan', 'especificacion'] as const;
+export type OrigenHallazgo = (typeof ORIGENES_HALLAZGO)[number] | 'sin clasificar';
+
+export interface HallazgoLeido extends Hallazgo {
+  origen: OrigenHallazgo;
+}
+
+export interface LecturaTodosHallazgos {
+  /** false si no hay tabla de hallazgos reconocible (informes anteriores a TASK-036). */
+  tabla: boolean;
+  /** Todas las filas de la tabla, abiertas o cerradas, en orden. */
+  hallazgos: HallazgoLeido[];
+}
+
 function normalizarCelda(c: string): string {
   return c
     .trim()
@@ -121,17 +143,23 @@ function normalizarCelda(c: string): string {
     .replace(/[̀-ͯ]/g, '');
 }
 
+/** Origen normalizado: minusculas, sin tildes ni enfasis; fuera del vocabulario, `sin clasificar`. */
+function origenDe(celda: string): OrigenHallazgo {
+  const valor = celda.toLowerCase();
+  return (ORIGENES_HALLAZGO as readonly string[]).includes(valor) ? (valor as OrigenHallazgo) : 'sin clasificar';
+}
+
 /**
- * Hallazgos no cerrados de la primera tabla bajo `## Hallazgos` cuya
- * cabecera tenga las columnas ID y Estado (por nombre, no por
- * posicion). Cerrado = Estado `corregido` o `aceptado`; cualquier otro
- * valor, tambien el vacio, cuenta como abierto: listar de mas es barato
- * y omitir es caro. Se ignora la fila de ejemplo de la plantilla.
+ * Todas las filas de la primera tabla bajo `## Hallazgos` cuya cabecera
+ * tenga las columnas ID y Estado (por nombre, no por posicion), con su
+ * severidad y su origen (TASK-063). Es el unico parser de la tabla:
+ * `hallazgosNoCerrados` filtra sobre el. Se ignora la fila de ejemplo de la
+ * plantilla y las tablas citadas dentro de bloques de codigo.
  */
-export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
+export function leerHallazgos(informe: string): LecturaTodosHallazgos {
   const lineas = informe.replace(/\r/g, '').split('\n');
   const inicio = lineas.findIndex((l) => /^##\s+hallazgos\b/i.test(l.trim()));
-  if (inicio === -1) return { tabla: false, abiertos: [] };
+  if (inicio === -1) return { tabla: false, hallazgos: [] };
   // Se buscan tablas FUERA de los bloques de codigo: una tabla citada en
   // una reproduccion no es la de hallazgos (MEN-1 de la revision de
   // TASK-040: con una asi delante, se perdian las filas reales).
@@ -144,10 +172,10 @@ export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
       continue;
     }
     if (enBloque) continue;
-    if (/^##\s/.test(l)) return { tabla: false, abiertos: [] };
+    if (/^##\s/.test(l)) return { tabla: false, hallazgos: [] };
     if (l.startsWith('|')) break;
   }
-  if (i >= lineas.length) return { tabla: false, abiertos: [] };
+  if (i >= lineas.length) return { tabla: false, hallazgos: [] };
 
   const celdas = (l: string): string[] =>
     l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(normalizarCelda);
@@ -155,11 +183,14 @@ export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
   const col = (nombre: string): number => cabecera.findIndex((c) => c === nombre);
   const iId = col('id');
   const iEstado = col('estado');
-  if (iId === -1 || iEstado === -1) return { tabla: false, abiertos: [] };
+  if (iId === -1 || iEstado === -1) return { tabla: false, hallazgos: [] };
   const iSev = col('severidad');
   const iFich = col('fichero');
+  // `Origen`, o `Origen (implementacion / plan / especificacion)` si el
+  // revisor copia la aclaracion a la cabecera.
+  const iOrigen = cabecera.findIndex((c) => c === 'origen' || c.startsWith('origen '));
 
-  const abiertos: Hallazgo[] = [];
+  const hallazgos: HallazgoLeido[] = [];
   for (i++; i < lineas.length; i++) {
     const l = (lineas[i] as string).trim();
     if (!l.startsWith('|')) break;
@@ -167,14 +198,29 @@ export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
     const c = celdas(l);
     const id = c[iId] ?? '';
     if (id === '' || id.toLowerCase().startsWith('(ej.')) continue;
-    const estado = (c[iEstado] ?? '').toLowerCase();
-    if (estado === 'corregido' || estado === 'aceptado') continue;
-    abiertos.push({
+    hallazgos.push({
       id,
       severidad: iSev === -1 ? '' : (c[iSev] ?? ''),
       estado: c[iEstado] ?? '',
       fichero: iFich === -1 ? '' : (c[iFich] ?? ''),
+      origen: iOrigen === -1 ? 'sin clasificar' : origenDe(c[iOrigen] ?? ''),
     });
   }
-  return { tabla: true, abiertos };
+  return { tabla: true, hallazgos };
+}
+
+/**
+ * Hallazgos no cerrados de la tabla de `leerHallazgos`. Cerrado = Estado
+ * `corregido` o `aceptado`; cualquier otro valor, tambien el vacio, cuenta
+ * como abierto: listar de mas es barato y omitir es caro.
+ */
+export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
+  const { tabla, hallazgos } = leerHallazgos(informe);
+  const abiertos = hallazgos
+    .filter((h) => {
+      const estado = h.estado.toLowerCase();
+      return estado !== 'corregido' && estado !== 'aceptado';
+    })
+    .map(({ id, severidad, estado, fichero }) => ({ id, severidad, estado, fichero }));
+  return { tabla, abiertos };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 063dff2..663e938 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -109,7 +109,7 @@ const VALLA_APERTURA = /^ {0,3}(`{3,}(?=[^`]*$)|~{3,})/;
  * proteger el registro real. Hace falta un documento roto, ademas de un
  * ejemplo del registro, para llegar ahi.
  */
-function dentroDeBloque(lineas: readonly string[]): boolean[] {
+export function dentroDeBloque(lineas: readonly string[]): boolean[] {
   const enBloque = lineas.map(() => false);
   let i = 0;
   while (i < lineas.length) {
@@ -141,10 +141,19 @@ function dentroDeBloque(lineas: readonly string[]): boolean[] {
  * bloque no es el registro, y la seccion real siempre se crea al final.
  */
 function rangoSeccion(lineas: readonly string[]): [number, number] | null {
+  return rangoDeSeccion(lineas, SECCION_TRANSICIONES);
+}
+
+/**
+ * La regla de `rangoSeccion` para cualquier seccion del cuerpo (TASK-063:
+ * la reutiliza `## Coste` de `core/coste-registro.ts`, que es una tabla
+ * hermana de esta).
+ */
+export function rangoDeSeccion(lineas: readonly string[], titulo: string): [number, number] | null {
   const enBloque = dentroDeBloque(lineas);
   let inicio = -1;
   lineas.forEach((l, i) => {
-    if (!enBloque[i] && l.trimEnd() === SECCION_TRANSICIONES) inicio = i;
+    if (!enBloque[i] && l.trimEnd() === titulo) inicio = i;
   });
   if (inicio === -1) return null;
   let fin = inicio + 1;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
index 94558af..9a9b044 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
@@ -10,6 +10,8 @@ import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { readTareaFile } from '../../src/fs/task-store.js';
 import { ID, CONFIG_AUTO, TASKCTL, git, withRepo, hastaCodigo } from '../helpers/automatico-fixtures.js';
+import { leerCostes } from '../../src/core/coste-registro.js';
+import { TRANSCRIPCION_EJEMPLO, USO_EJEMPLO } from '../helpers/transcripcion-ejemplo.js';
 
 const A = 'a1b2c3d4e5f60718';
 const B = 'b1b2c3d4e5f60718';
@@ -138,3 +140,124 @@ test('--agente: un fallo con varios agentes no registra ni la parte buena', asyn
     });
   });
 });
+
+// ---------------------------------------------------------------------
+// TASK-063: fila de desglose en la tabla ## Coste
+// ---------------------------------------------------------------------
+
+async function cuerpo(tareasRoot: string): Promise<{ body: string; ruta: string }> {
+  const t = await readTareaFile(tareasRoot, ID);
+  assert.ok(t);
+  return { body: t.body, ruta: t.filePath };
+}
+
+test('TASK-063 --agente: deja la fila con el desglose y las lecturas del .jsonl, junto al total y en el mismo commit', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      const antes = await cuerpo(tareasRoot);
+      assert.deepEqual(leerCostes(antes.body), [], 'la tarea nace sin tabla');
+      await transcripcion(config, 'proy-1', 'sesion-1', A, TRANSCRIPCION_EJEMPLO.split('\n'));
+      const commits = Number(git(['rev-list', '--count', 'HEAD'], repo).trim());
+
+      const r = coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]);
+      assert.equal(r.status, 0, r.stderr);
+
+      assert.deepEqual(await valor(tareasRoot), [null, USO_EJEMPLO.tokens, null], 'el total sigue en el frontmatter');
+      const despues = await cuerpo(tareasRoot);
+      assert.ok(despues.body.startsWith(antes.body.replace(/\n+$/, '')), 'el cuerpo anterior queda intacto');
+      const filas = leerCostes(despues.body);
+      assert.equal(filas.length, 1);
+      const fila = filas[0];
+      assert.ok(fila);
+      assert.match(fila.fecha, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
+      assert.deepEqual(
+        { ...fila, fecha: '' },
+        {
+          fecha: '',
+          fase: 'implementacion',
+          fuente: `agente:${A}`,
+          entrada: USO_EJEMPLO.entrada,
+          cacheEscritura: USO_EJEMPLO.cacheEscritura,
+          cacheLectura: USO_EJEMPLO.cacheLectura,
+          salida: USO_EJEMPLO.salida,
+          lecturas: 9,
+          total: USO_EJEMPLO.tokens,
+        }
+      );
+      // Un solo commit, con solo tarea.md, que lleva a la vez la fila y el total.
+      assert.equal(Number(git(['rev-list', '--count', 'HEAD'], repo).trim()), commits + 1);
+      const rel = path.relative(repo, despues.ruta).split(path.sep).join('/');
+      assert.deepEqual(git(['show', '--name-only', '--format=', 'HEAD'], repo).trim().split('\n'), [rel]);
+      const diff = git(['show', '--format=', 'HEAD'], repo);
+      assert.match(diff, /^\+tokens_implementacion: 602$/m);
+      assert.match(diff, /^\+\| \S+ \| implementacion \| agente:a1b2c3d4e5f60718 \| 33 \| 50 \| 500 \| 19 \| 9 \| 602 \|$/m);
+      assert.equal(git(['status', '--porcelain'], repo).trim(), '');
+    });
+  });
+});
+
+test('TASK-063: varios --agente suman el desglose en UNA fila; --tokens deja otra fila manual con solo el total', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      await transcripcion(config, 'proy-1', 'sesion-1', A, TRANSCRIPCION_EJEMPLO.split('\n'));
+      await transcripcion(config, 'proy-2', 'sesion-2', B, [linea('m1', 40, 10)]);
+      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--agente', A, '--agente', B]).status, 0);
+      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--tokens', '1000']).status, 0);
+
+      assert.deepEqual(await valor(tareasRoot), [null, null, USO_EJEMPLO.tokens + 50 + 1000]);
+      const filas = leerCostes((await cuerpo(tareasRoot)).body).map((f) => ({ ...f, fecha: '' }));
+      assert.deepEqual(filas, [
+        {
+          fecha: '',
+          fase: 'revision',
+          fuente: `agente:${A},${B}`,
+          entrada: USO_EJEMPLO.entrada + 40,
+          cacheEscritura: USO_EJEMPLO.cacheEscritura,
+          cacheLectura: USO_EJEMPLO.cacheLectura,
+          salida: USO_EJEMPLO.salida + 10,
+          lecturas: USO_EJEMPLO.lecturas,
+          total: USO_EJEMPLO.tokens + 50,
+        },
+        {
+          fecha: '',
+          fase: 'revision',
+          fuente: 'manual',
+          entrada: null,
+          cacheEscritura: null,
+          cacheLectura: null,
+          salida: null,
+          lecturas: null,
+          total: 1000,
+        },
+      ]);
+      // La suma de las filas cuadra con el total del frontmatter.
+      assert.equal(
+        filas.reduce((s, f) => s + f.total, 0),
+        (await valor(tareasRoot))[2]
+      );
+    });
+  });
+});
+
+test('TASK-063: una tarea con tabla ## Coste sigue siendo valida para doctor, igual que una sin ella', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      const tareasDe = (): { nivel: string; mensaje: string } => {
+        const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--json'], { cwd: repo, encoding: 'utf8' });
+        const json = JSON.parse(r.stdout) as { comprobaciones: { id: string; nivel: string; mensaje: string }[] };
+        const c = json.comprobaciones.find((x) => x.id === 'tareas');
+        assert.ok(c, r.stdout);
+        return c;
+      };
+      assert.equal(tareasDe().nivel, 'ok', 'sin tabla');
+      await transcripcion(config, 'p', 's', A, [linea('m1', 5, 5)]);
+      assert.equal(coste(repo, config, [ID, '--fase', 'diseno', '--agente', A]).status, 0);
+      assert.equal(leerCostes((await cuerpo(tareasRoot)).body).length, 1);
+      const c = tareasDe();
+      assert.equal(c.nivel, 'ok', c.mensaje);
+    });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts
index 684a0b3..ad0b44a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts
@@ -106,10 +106,10 @@ test('registrar-coste: funciona con la tarea terminada, que vive en develop tras
     await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
     cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
     const cierre = cliOk(repoRoot, ['finish', ID]);
-    // Sin coste registrado, finish avisa de diseno y revision (no de implementacion) y cierra.
+    // Sin coste registrado, finish avisa de las tres fases (TASK-063: tambien implementacion) y cierra.
     assert.match(cierre.stderr, /sin coste de diseno registrado/);
+    assert.match(cierre.stderr, /sin coste de implementacion registrado/);
     assert.match(cierre.stderr, /sin coste de revision registrado/);
-    assert.doesNotMatch(cierre.stderr, /sin coste de implementacion/);
     assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
     const t = await readTareaFile(tareasRoot, ID);
     assert.equal(t?.task.estado, 'terminada');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
index 2626366..582e58b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
@@ -174,7 +174,7 @@ async function setupEnRevision(
   repoRoot: string,
   tareasRoot: string,
   body: string,
-  costes: Partial<Task> = { tokens_diseno: 1, tokens_revision: 1 }
+  costes: Partial<Task> = { tokens_diseno: 1, tokens_implementacion: 1, tokens_revision: 1 }
 ): Promise<Task> {
   const task = sampleTask({ estado: 'en-revision', plan_aprobado: true, ...costes });
   git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
@@ -239,10 +239,10 @@ test('finish (TASK-043): con todos los criterios marcados no hay aviso', async (
 });
 
 /**
- * TASK-023. Mutaciones que lo ponen rojo: bloquear en vez de avisar, avisar
- * tambien de tokens_implementacion, o no mirar tokens_revision.
+ * TASK-023. Mutaciones que lo ponen rojo: bloquear en vez de avisar, o no
+ * mirar alguna de las tres fases. TASK-063: implementacion tambien avisa.
  */
-test('finish (TASK-023): avisa del coste de diseno y revision sin registrar, ANTES del merge, y cierra igualmente', async () => {
+test('finish (TASK-023, TASK-063): avisa del coste de diseno, implementacion y revision sin registrar, ANTES del merge, y cierra igualmente', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     const task = await setupEnRevision(
       repoRoot,
@@ -260,22 +260,22 @@ test('finish (TASK-023): avisa del coste de diseno y revision sin registrar, ANT
         avisos.push({ texto, integrada });
       },
     });
-    assert.equal(avisos.length, 2, 'uno por diseno y otro por revision; implementacion no avisa');
+    assert.equal(avisos.length, 3, 'uno por fase');
     assert.ok(avisos.every((a) => !a.integrada), 'los avisos llegan antes de mergear');
     assert.match(avisos[0]?.texto ?? '', /sin coste de diseno registrado.*taskctl registrar-coste TASK-430 --fase diseno --agente <id>/);
     // IMP-1 de la revision: el aviso no puede proponer la cifra de la notificacion.
     assert.doesNotMatch(avisos[0]?.texto ?? '', /--tokens N/);
-    assert.match(avisos[1]?.texto ?? '', /sin coste de revision registrado.*--fase revision/);
-    assert.ok(avisos.every((a) => !/implementacion/.test(a.texto)));
+    assert.match(avisos[1]?.texto ?? '', /sin coste de implementacion registrado \(tokens_implementacion\).*--fase implementacion/);
+    assert.match(avisos[2]?.texto ?? '', /sin coste de revision registrado.*--fase revision/);
     assert.match(r.filePath, /04-terminadas/, 'no bloquea');
   });
 });
 
-test('finish (TASK-023): solo avisa de la fase que falta, y con diseno y revision registrados no avisa', async () => {
+test('finish (TASK-023): solo avisa de la fase que falta', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n', {
       tokens_diseno: 5000,
-      tokens_implementacion: null,
+      tokens_implementacion: 3000,
       tokens_revision: null,
     });
     const avisos: string[] = [];
@@ -289,11 +289,11 @@ test('finish (TASK-023): solo avisa de la fase que falta, y con diseno y revisio
   });
 });
 
-test('finish (TASK-023): con diseno y revision registrados (implementacion sin registrar) no hay aviso de coste', async () => {
+test('finish (TASK-023): con las tres fases registradas no hay aviso de coste', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n', {
       tokens_diseno: 5000,
-      tokens_implementacion: null,
+      tokens_implementacion: 3000,
       tokens_revision: 7000,
     });
     const avisos: string[] = [];
@@ -305,3 +305,27 @@ test('finish (TASK-023): con diseno y revision registrados (implementacion sin r
     assert.deepEqual(avisos, []);
   });
 });
+
+/**
+ * TASK-063. Mutaciones que lo ponen rojo: no avisar con tokens_implementacion
+ * a 0 (solo con null), avisar tambien con diseno o revision a 0 (alli 0 no
+ * es «sin registrar»), o bloquear.
+ */
+test('finish (TASK-063): tokens_implementacion a 0 avisa como vacio, y cierra igualmente', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n', {
+      tokens_diseno: 0,
+      tokens_implementacion: 0,
+      tokens_revision: 0,
+    });
+    const avisos: string[] = [];
+    const r = await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+      onAviso: (a) => avisos.push(a),
+    });
+    assert.equal(avisos.length, 1, avisos.join('\n'));
+    assert.match(avisos[0] ?? '', /sin coste de implementacion registrado.*La tarea se cierra igualmente/);
+    assert.match(r.filePath, /04-terminadas/, 'no bloquea');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts
new file mode 100644
index 0000000..a33f8bc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts
@@ -0,0 +1,112 @@
+/**
+ * TASK-063: la tabla `## Coste` del cuerpo de tarea.md. Puro: anade sin
+ * reescribir, deja intacto el cuerpo antiguo y lee solo filas validas.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { anadirCoste, CABECERA_COSTE, leerCostes, SECCION_COSTE, type FilaCoste } from '../../src/core/coste-registro.js';
+import { anadirTransicion, leerTransiciones } from '../../src/core/transiciones.js';
+
+const AGENTE: FilaCoste = {
+  fecha: '2026-10-25T14:03:22Z',
+  fase: 'diseno',
+  fuente: 'agente:a1b2c3d4e5f60718',
+  entrada: 120,
+  cacheEscritura: 3000,
+  cacheLectura: 90000,
+  salida: 800,
+  lecturas: 14,
+  total: 93920,
+};
+
+const MANUAL: FilaCoste = {
+  fecha: '2026-10-25T15:10:00Z',
+  fase: 'implementacion',
+  fuente: 'manual',
+  entrada: null,
+  cacheEscritura: null,
+  cacheLectura: null,
+  salida: null,
+  lecturas: null,
+  total: 5000,
+};
+
+const ANTIGUO = '## Objetivo\nAlgo.\n\n## Criterios de aceptacion\n- [ ] uno\n';
+
+test('cuerpo sin seccion: la crea al final, deja el resto byte a byte y la fila se lee igual', () => {
+  const body = anadirCoste(ANTIGUO, AGENTE);
+  assert.ok(body.startsWith(ANTIGUO), 'el cuerpo antiguo queda intacto delante');
+  assert.equal(
+    body.slice(ANTIGUO.length),
+    '\n## Coste\n\n' +
+      `${CABECERA_COSTE}\n` +
+      '|---|---|---|---|---|---|---|---|---|\n' +
+      '| 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 |\n'
+  );
+  assert.deepEqual(leerCostes(body), [AGENTE]);
+});
+
+test('una tarea antigua sin tabla no tiene filas, y leer no falla con basura', () => {
+  assert.deepEqual(leerCostes(ANTIGUO), []);
+  assert.deepEqual(leerCostes(''), []);
+  assert.deepEqual(leerCostes(`${SECCION_COSTE}\n\nsolo prosa\n`), []);
+});
+
+test('la segunda fila va detras de la ultima de la tabla, sin reescribir la primera; la manual lleva "-"', () => {
+  const una = anadirCoste(ANTIGUO, AGENTE);
+  const dos = anadirCoste(una + '\nTexto despues de la tabla.\n', MANUAL);
+  assert.match(dos, /\| 93920 \|\n\| 2026-10-25T15:10:00Z \| implementacion \| manual \| - \| - \| - \| - \| - \| 5000 \|\n\nTexto despues/);
+  assert.deepEqual(leerCostes(dos), [AGENTE, MANUAL]);
+});
+
+test('convive con ## Transiciones en cualquier orden: cada una escribe y lee solo la suya', () => {
+  const t = { fecha: '2026-10-25T13:30:44Z', fase: 'plan', modo: 'automatico', decidido_por: 'persona' } as const;
+  // Transiciones antes que Coste (lo normal: plan antes del primer coste).
+  let body = anadirTransicion(ANTIGUO, t);
+  body = anadirCoste(body, AGENTE);
+  body = anadirTransicion(body, { ...t, fase: 'approve' });
+  body = anadirCoste(body, MANUAL);
+  assert.deepEqual(leerCostes(body), [AGENTE, MANUAL]);
+  assert.deepEqual(
+    leerTransiciones(body).map((f) => f.fase),
+    ['plan', 'approve']
+  );
+  // La fila de approve quedo en su seccion, no debajo de la de coste.
+  const iTrans = body.indexOf('## Transiciones');
+  const iCoste = body.indexOf('## Coste');
+  const iApprove = body.indexOf('| approve |');
+  assert.ok(iTrans < iApprove && iApprove < iCoste, body);
+});
+
+test('una tabla de ejemplo dentro de un bloque de codigo no es el registro', () => {
+  const conEjemplo =
+    ANTIGUO +
+    '\n```markdown\n## Coste\n\n' +
+    `${CABECERA_COSTE}\n|---|---|---|---|---|---|---|---|---|\n` +
+    '| 2026-01-01T00:00:00Z | diseno | manual | - | - | - | - | - | 1 |\n```\n';
+  assert.deepEqual(leerCostes(conEjemplo), []);
+  const body = anadirCoste(conEjemplo, MANUAL);
+  assert.ok(body.startsWith(conEjemplo), 'el ejemplo no se toca');
+  assert.deepEqual(leerCostes(body), [MANUAL]);
+});
+
+test('CRLF se respeta al anadir', () => {
+  const crlf = ANTIGUO.replace(/\n/g, '\r\n');
+  const una = anadirCoste(crlf, AGENTE);
+  const dos = anadirCoste(una, MANUAL);
+  assert.ok(!/[^\r]\n/.test(dos), 'ningun salto sin \\r');
+  assert.deepEqual(leerCostes(dos), [AGENTE, MANUAL]);
+});
+
+test('filas editadas a mano con valores raros se ignoran; fecha de dia vale', () => {
+  const body =
+    `${SECCION_COSTE}\n\n${CABECERA_COSTE}\n|---|---|---|---|---|---|---|---|---|\n` +
+    '| 2026-10-25 | revision | manual | - | - | - | - | - | 7 |\n' + // valida (dia)
+    '| 2026-02-30 | revision | manual | - | - | - | - | - | 7 |\n' + // dia inexistente
+    '| 2026-10-25 | curso | manual | - | - | - | - | - | 7 |\n' + // fase desconocida
+    '| 2026-10-25 | revision |  | - | - | - | - | - | 7 |\n' + // sin fuente
+    '| 2026-10-25 | revision | manual | 1,5 | - | - | - | - | 7 |\n' + // no entero
+    '| 2026-10-25 | revision | manual | - | - | - | - | - | - |\n' + // sin total
+    '| 2026-10-25 | revision | manual | - | - | - | - | 7 |\n'; // columnas de menos
+  assert.deepEqual(leerCostes(body), [{ ...MANUAL, fecha: '2026-10-25', fase: 'revision', total: 7 }]);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-transcripcion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-transcripcion.test.ts
index 3b35f92..2a8707c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-transcripcion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-transcripcion.test.ts
@@ -5,7 +5,14 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { esAgentIdValido, sumarUsoTranscripcion } from '../../src/core/coste-transcripcion.js';
+import {
+  COMANDOS_BASH_LECTURA,
+  HERRAMIENTAS_LECTURA,
+  esAgentIdValido,
+  esComandoBashDeLectura,
+  sumarUsoTranscripcion,
+} from '../../src/core/coste-transcripcion.js';
+import { TRANSCRIPCION_EJEMPLO, herramienta, mensaje, uso } from '../helpers/transcripcion-ejemplo.js';
 
 function asistente(id: string | null, usage: Record<string, unknown>): string {
   return JSON.stringify({ type: 'assistant', message: { ...(id === null ? {} : { id }), usage } });
@@ -18,7 +25,15 @@ test('suma input + cache_creation + cache_read + output por llamada', () => {
     cache_read_input_tokens: 1000,
     output_tokens: 5,
   });
-  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 1115, llamadas: 1 });
+  assert.deepEqual(sumarUsoTranscripcion(t), {
+    tokens: 1115,
+    llamadas: 1,
+    entrada: 10,
+    cacheEscritura: 100,
+    cacheLectura: 1000,
+    salida: 5,
+    lecturas: 0,
+  });
 });
 
 test('un message.id repetido (streaming) cuenta UNA vez, con su ultima aparicion', () => {
@@ -28,7 +43,15 @@ test('un message.id repetido (streaming) cuenta UNA vez, con su ultima aparicion
     asistente('m2', { input_tokens: 7, output_tokens: 3 }),
     asistente('m1', { input_tokens: 1, output_tokens: 99 }),
   ].join('\n');
-  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 100 + 10, llamadas: 2 });
+  assert.deepEqual(sumarUsoTranscripcion(t), {
+    tokens: 100 + 10,
+    llamadas: 2,
+    entrada: 1 + 7,
+    cacheEscritura: 0,
+    cacheLectura: 0,
+    salida: 99 + 3,
+    lecturas: 0,
+  });
 });
 
 test('ignora lineas no JSON, de otros tipos o sin usage; campos ausentes o raros cuentan 0', () => {
@@ -40,12 +63,28 @@ test('ignora lineas no JSON, de otros tipos o sin usage; campos ausentes o raros
     '[1,2,3]',
     asistente('m1', { output_tokens: 4, input_tokens: 'mucho', cache_read_input_tokens: -5 }),
   ].join('\r\n');
-  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 4, llamadas: 1 });
+  assert.deepEqual(sumarUsoTranscripcion(t), {
+    tokens: 4,
+    llamadas: 1,
+    entrada: 0,
+    cacheEscritura: 0,
+    cacheLectura: 0,
+    salida: 4,
+    lecturas: 0,
+  });
 });
 
 test('una llamada con usage pero sin message.id se cuenta tal cual', () => {
   const t = [asistente(null, { output_tokens: 2 }), asistente(null, { output_tokens: 3 })].join('\n');
-  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 5, llamadas: 2 });
+  assert.deepEqual(sumarUsoTranscripcion(t), {
+    tokens: 5,
+    llamadas: 2,
+    entrada: 0,
+    cacheEscritura: 0,
+    cacheLectura: 0,
+    salida: 5,
+    lecturas: 0,
+  });
 });
 
 test('sin ninguna llamada con usage es null (formato desconocido), no 0', () => {
@@ -59,3 +98,48 @@ test('esAgentIdValido: hexadecimal, sin separadores ni ..', () => {
     assert.ok(!esAgentIdValido(malo), malo);
   }
 });
+
+// ---------------------------------------------------------------------
+// TASK-063: desglose y lecturas
+// ---------------------------------------------------------------------
+
+test('TASK-063: el .jsonl de ejemplo da el desglose y EXACTAMENTE 9 lecturas', () => {
+  const r = sumarUsoTranscripcion(TRANSCRIPCION_EJEMPLO);
+  // Lecturas: t1 (una vez), t2, t3, t4, t5, t9, t11, t13 y la sin id.
+  // Llamadas: m1 (ultima: 5/3), m2 (7/4), m3 (9/5), m4 (11/6) y la sin id (1/1).
+  assert.deepEqual(r, {
+    tokens: 33 + 50 + 500 + 19,
+    llamadas: 5,
+    entrada: 5 + 7 + 9 + 11 + 1,
+    cacheEscritura: 50,
+    cacheLectura: 500,
+    salida: 3 + 4 + 5 + 6 + 1,
+    lecturas: 9,
+  });
+  assert.ok(r);
+  assert.equal(r.tokens, r.entrada + r.cacheEscritura + r.cacheLectura + r.salida, 'tokens se conserva como suma');
+});
+
+test('TASK-063: tool_use fuera de mensajes de asistente, o sin usage en toda la transcripcion', () => {
+  // Un tool_use en una linea de usuario no es del agente.
+  const deUsuario = JSON.stringify({ type: 'user', message: { content: [herramienta('u1', 'Read')] } });
+  const r = sumarUsoTranscripcion([deUsuario, mensaje('m1', [], uso(1, 1))].join('\n'));
+  assert.equal(r?.lecturas, 0);
+  // Lecturas sin ninguna llamada con usage: sigue siendo formato desconocido.
+  assert.equal(sumarUsoTranscripcion(mensaje('m1', [herramienta('t1', 'Read')], null)), null);
+  // Una linea sin usage aporta su tool_use si otra si lo tiene.
+  const mixto = [mensaje('m1', [herramienta('t1', 'Read')], null), mensaje('m1', [], uso(1, 1))].join('\n');
+  assert.equal(sumarUsoTranscripcion(mixto)?.lecturas, 1);
+});
+
+test('TASK-063: esComandoBashDeLectura y la lista cerrada de herramientas', () => {
+  for (const si of ['cat x', ' head -5 x', '\ttail -f log', 'grep -rn a .', 'rg a', 'find . -name x', 'ls -la', 'ls', 'sed -n 1p x', 'sed  -n 1p x']) {
+    assert.ok(esComandoBashDeLectura(si), si);
+  }
+  for (const no of ['', 'catx', 'category', 'echo cat', 'sed -i 1d x', 'sed', 'lsof', 'finder', 'git ls-files', 'npm run lint']) {
+    assert.ok(!esComandoBashDeLectura(no), no);
+  }
+  for (const h of ['Read', 'Grep', 'Glob']) assert.ok(HERRAMIENTAS_LECTURA.includes(h), h);
+  for (const h of ['Bash', 'Edit', 'Write', 'Agent', 'WebFetch']) assert.ok(!HERRAMIENTAS_LECTURA.includes(h), h);
+  assert.deepEqual([...COMANDOS_BASH_LECTURA], ['cat', 'head', 'tail', 'grep', 'rg', 'find', 'ls']);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/informe-revision-origen.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/informe-revision-origen.test.ts
new file mode 100644
index 0000000..72a8882
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/informe-revision-origen.test.ts
@@ -0,0 +1,89 @@
+/**
+ * TASK-063: `leerHallazgos` devuelve todas las filas de la tabla de
+ * hallazgos con severidad y origen; `hallazgosNoCerrados` filtra sobre ella.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { hallazgosNoCerrados, leerHallazgos } from '../../src/core/informe-revision.js';
+import { informeTemplate } from '../../src/commands/review.js';
+import { sampleTask } from '../helpers/finish-fixtures.js';
+
+const CON_ORIGEN =
+  '# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n' +
+  '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
+  '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) | (implementacion / plan / especificacion) |\n' +
+  '| CRIT-1 | CRITICO | corregido | a.ts:3 | implementacion |\n' +
+  '| IMP-1 | IMPORTANTE | abierto | b.ts | **Plan** |\n' +
+  '| IMP-2 | IMPORTANTE | aceptado | c.ts | Especificación |\n' +
+  '| MEN-1 | MENOR | abierto | d.ts | el plan, creo |\n' +
+  '| MEN-2 | MENOR | abierto | e.ts |  |\n';
+
+test('leerHallazgos: todas las filas (abiertas y cerradas) con severidad y origen normalizado', () => {
+  const r = leerHallazgos(CON_ORIGEN);
+  assert.equal(r.tabla, true);
+  assert.deepEqual(
+    r.hallazgos.map((h) => [h.id, h.severidad, h.estado, h.origen]),
+    [
+      ['CRIT-1', 'CRITICO', 'corregido', 'implementacion'],
+      ['IMP-1', 'IMPORTANTE', 'abierto', 'plan'],
+      ['IMP-2', 'IMPORTANTE', 'aceptado', 'especificacion'],
+      ['MEN-1', 'MENOR', 'abierto', 'sin clasificar'],
+      ['MEN-2', 'MENOR', 'abierto', 'sin clasificar'],
+    ]
+  );
+  // El filtro de abiertos sale de la misma lectura, con la forma de siempre.
+  assert.deepEqual(hallazgosNoCerrados(CON_ORIGEN), {
+    tabla: true,
+    abiertos: [
+      { id: 'IMP-1', severidad: 'IMPORTANTE', estado: 'abierto', fichero: 'b.ts' },
+      { id: 'MEN-1', severidad: 'MENOR', estado: 'abierto', fichero: 'd.ts' },
+      { id: 'MEN-2', severidad: 'MENOR', estado: 'abierto', fichero: 'e.ts' },
+    ],
+  });
+});
+
+test('leerHallazgos: informe antiguo sin columna Origen, todo "sin clasificar"; sin tabla, tabla=false', () => {
+  const antiguo =
+    '## Hallazgos\n\n| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n' +
+    '| IMP-1 | IMPORTANTE | corregido | a.ts |\n| MEN-1 | MENOR | aceptado | b.ts |\n';
+  const r = leerHallazgos(antiguo);
+  assert.equal(r.tabla, true);
+  assert.deepEqual(
+    r.hallazgos.map((h) => [h.id, h.severidad, h.origen]),
+    [
+      ['IMP-1', 'IMPORTANTE', 'sin clasificar'],
+      ['MEN-1', 'MENOR', 'sin clasificar'],
+    ]
+  );
+  assert.deepEqual(leerHallazgos('## Hallazgos\n\nsin hallazgos\n'), { tabla: false, hallazgos: [] });
+  assert.deepEqual(leerHallazgos('# Informe sin seccion\n'), { tabla: false, hallazgos: [] });
+});
+
+test('leerHallazgos: la columna se busca por nombre (en cualquier posicion, con aclaracion) y no dentro de codigo', () => {
+  const movida =
+    '## Hallazgos\n\n```\n| ID | Estado | Origen |\n| X-1 | abierto | plan |\n```\n\n' +
+    '| Origen (implementacion / plan / especificacion) | ID | Estado | Severidad |\n|---|---|---|---|\n' +
+    '| especificacion | IMP-9 | abierto | IMPORTANTE |\n';
+  assert.deepEqual(
+    leerHallazgos(movida).hallazgos.map((h) => [h.id, h.severidad, h.origen]),
+    [['IMP-9', 'IMPORTANTE', 'especificacion']]
+  );
+});
+
+test('la plantilla de informe de taskctl review lleva la columna Origen y la instruccion; su fila de ejemplo no cuenta', () => {
+  const plantilla = informeTemplate(sampleTask({ id: 'TASK-777' }), 'abc1234', 1);
+  assert.match(plantilla, /^\| ID \| Severidad \| Estado \| Fichero \| Origen \|$/m);
+  assert.match(plantilla, /\(implementacion \/ plan \/ especificacion\)/);
+  assert.match(plantilla, /`implementacion` si el codigo no hace lo que el plan pedia; `plan` si/);
+  assert.match(plantilla, /`especificacion` si el fallo esta en el\nenunciado/);
+  assert.deepEqual(leerHallazgos(plantilla), { tabla: true, hallazgos: [] });
+  // Rellenada por un revisor, la lectura da el origen.
+  const rellena = plantilla.replace(
+    /^\| \(ej\. IMP-1\).*$/m,
+    '| IMP-1 | IMPORTANTE | abierto | src/x.ts:4 | plan |'
+  );
+  assert.deepEqual(
+    leerHallazgos(rellena).hallazgos.map((h) => [h.id, h.origen]),
+    [['IMP-1', 'plan']]
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/transcripcion-ejemplo.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/transcripcion-ejemplo.ts
new file mode 100644
index 0000000..c12a91a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/transcripcion-ejemplo.ts
@@ -0,0 +1,79 @@
+/**
+ * TASK-063: transcripcion de subagente de ejemplo (formato `agent-<id>.jsonl`
+ * de Claude Code) con un numero de lecturas conocido. La usan el test puro
+ * de `sumarUsoTranscripcion` y el de `registrar-coste --agente` contra un
+ * repo Git real.
+ */
+
+type Bloque = Record<string, unknown>;
+
+export function mensaje(id: string | null, contenido: Bloque[], usage: Record<string, unknown> | null): string {
+  return JSON.stringify({
+    type: 'assistant',
+    message: { ...(id === null ? {} : { id }), content: contenido, ...(usage === null ? {} : { usage }) },
+  });
+}
+
+export function herramienta(id: string | null, name: string, input: Record<string, unknown> = {}): Bloque {
+  return { type: 'tool_use', ...(id === null ? {} : { id }), name, input };
+}
+
+const bash = (id: string, command: string): Bloque => herramienta(id, 'Bash', { command });
+export const uso = (entrada: number, salida: number): Record<string, unknown> => ({
+  input_tokens: entrada,
+  cache_creation_input_tokens: 10,
+  cache_read_input_tokens: 100,
+  output_tokens: salida,
+});
+
+/**
+ * Transcripcion de ejemplo con la forma de Claude Code: el streaming parte un
+ * mensaje en varias lineas con el mismo message.id, una por bloque, y repite
+ * el tool_use. Lleva lecturas, no lecturas y casi-lecturas.
+ */
+export const TRANSCRIPCION_EJEMPLO = [
+  JSON.stringify({ type: 'user', message: { role: 'user', content: 'arranca' } }),
+  mensaje('m1', [{ type: 'text', text: 'Miro el proyecto.' }], uso(5, 1)),
+  mensaje('m1', [herramienta('t1', 'Read', { file_path: 'a.ts' })], uso(5, 2)),
+  mensaje('m1', [herramienta('t1', 'Read', { file_path: 'a.ts' })], uso(5, 3)), // mismo tool_use: 1 lectura
+  JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'x' }] } }),
+  mensaje('m2', [herramienta('t2', 'Grep', { pattern: 'x' }), herramienta('t3', 'Glob', { pattern: '*.ts' })], uso(7, 4)),
+  mensaje(
+    'm3',
+    [
+      bash('t4', '   cat a.txt'), // si: espacios iniciales fuera
+      bash('t5', 'sed -n 1,5p x.ts'), // si
+      bash('t6', 'sed -i s/a/b/ x.ts'), // no: sed sin -n
+      bash('t7', 'npm test'), // no
+      bash('t8', 'category x'), // no: empieza por "cat" pero no es cat
+      bash('t9', 'ls'), // si: el comando solo
+      bash('t10', 'git grep x'), // no: no EMPIEZA por grep
+      bash('t11', 'rg -n foo src'), // si
+    ],
+    uso(9, 5)
+  ),
+  mensaje(
+    'm4',
+    [
+      herramienta('t12', 'Edit', { file_path: 'a.ts' }), // no
+      herramienta('t13', 'mcp__filesystem__read_file', { path: 'a.ts' }), // si
+      herramienta('t14', 'mcp__otro__read_file', { path: 'a.ts' }), // no: fuera de la lista cerrada
+      herramienta('t15', 'Write', { file_path: 'b.ts' }), // no
+      herramienta('t16', 'Bash', {}), // no: sin comando
+    ],
+    uso(11, 6)
+  ),
+  mensaje(null, [herramienta(null, 'Read', { file_path: 'c.ts' })], uso(1, 1)), // sin ids: cuenta tal cual
+  'linea rota {',
+].join('\n');
+
+/** Lo que da `sumarUsoTranscripcion(TRANSCRIPCION_EJEMPLO)`; ver el test puro. */
+export const USO_EJEMPLO = {
+  tokens: 602,
+  llamadas: 5,
+  entrada: 33,
+  cacheEscritura: 50,
+  cacheLectura: 500,
+  salida: 19,
+  lecturas: 9,
+} as const;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
index 3a97fe8..5a885dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
@@ -787,3 +787,16 @@ test(
     );
   }
 );
+
+// --- TASK-063: columna Origen en las skills de revision --------------
+
+test('TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado', async () => {
+  const revision = await readFile(path.join(SKILL_DIR, 'revision.md'), 'utf8');
+  assert.match(revision, /`ID \| Severidad \| Estado \| Fichero \| Origen`/);
+  assert.match(revision, /La columna `Origen` se rellena \*\*en cada hallazgo\*\*/);
+  for (const valor of ['implementacion', 'plan', 'especificacion']) {
+    assert.match(revision, new RegExp(`^- \`${valor}\`: `, 'm'), valor);
+  }
+  const review = await readFile(path.join(SKILLS_DIR, 'review', SKILL_FILE_NAME), 'utf8');
+  assert.match(review, /columna `Origen` rellena en cada fila\s+\(`implementacion`, `plan` o `especificacion`/);
+});
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-063/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-063/planificacion/plan-final.md                 |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-063/tarea.md                                    |   5 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                              |   6 +++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                  |   9 ++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js         |  48 ++++++++++++++++++++++++++++---------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                  |  12 +++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-registro.js              | 132 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-transcripcion.js         | 114 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++--------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js            |  62 +++++++++++++++++++++++++++++++++++-------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                |  12 ++++++++--
 11 files changed, 344 insertions(+), 56 deletions(-)
````
