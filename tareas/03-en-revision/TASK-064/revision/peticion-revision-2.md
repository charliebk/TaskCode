# Peticion de revision — TASK-064 (ronda 2)

- Tarea: TASK-064 — Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas
- Rama revisada: feature/task-064-metricas-v2-b-leer-y-mostrar-la-evolucio
- Rama base: develop
- Commit revisado (HEAD): 6a9d9d3fbb4f10802492902af7cc90be6f6dc819
- Fecha: 2026-10-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-064 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 4e6baf67120ec9df036510e707d2df5f05b9da84 (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la
peticion.

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/core/informe-revision.ts:215-216 (`leerHallazgos`, solo salta `(ej.`) y :528-534 (`resumirHallazgos`) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | src/core/informe-revision.ts:528-534 (`porClave.set` sustituye siempre por la ultima ronda) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/core/metricas.ts:699-702 (`sumaDesglose`) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/core/metricas.ts:699-709 y test/commands/metricas-tokens.test.ts | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/core/informe-revision.ts:532 (clave `revisor + ID`) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/core/metricas.ts:774-780 y 802-823 (salida sin acotar), README.md:559-570 | informe-revision-1.md |
| MEN-5 | MENOR | abierto | src/fs/rondas.ts:837, src/commands/metricas.ts:54 | informe-revision-1.md |
| MEN-6 | MENOR | abierto | src/core/coste-registro.ts:361-363 y :408, tests | informe-revision-1.md |
| MEN-7 | MENOR | abierto | src/core/informe-revision.ts:176-230 (tabla de informes antiguos) | informe-revision-1.md |

## Commits a revisar (git log 4e6baf67120ec9df036510e707d2df5f05b9da84..HEAD)

````
6a9d9d3 test(TASK-064): casos de la ronda 1 de revision de metricas
e458a05 fix(TASK-064): hallazgos y desglose tras la ronda 1 de revision
008cd81 chore(TASK-064): veredicto ronda 1 (cambios-solicitados)
16ce1a4 chore(TASK-064): coste revision +6870335 tokens (1 agente)
f564e00 docs(TASK-064): informe de revision ronda 1
7b4c76c chore(TASK-064): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 4e6baf67120ec9df036510e707d2df5f05b9da84..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 5e4e18d..c1d51f1 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -10,11 +10,17 @@ grupos, `--repo`, `--json` y la linea base quedan para TASK-065.
   (implementacion/plan/especificacion/sin clasificar): los hallazgos de todos
   los informes de revision, `informe-revision-N.md` e
   `informe-revision-N-<revisor>.md`, contados una vez por tarea con clave
-  revisor + ID (la severidad y el origen son los de la ultima ronda en que
-  aparece). Un informe sin tabla de hallazgos deja la tarea en «—» (sin dato,
-  no cero); la salida dice cuantos hay y lo avisa.
-- La severidad se reconoce sin distinguir mayusculas, tildes ni enfasis
-  (`Importante`, `Crítico`, `menor`); una fuera de vocabulario (`Alta`,
+  revisor + ID. La severidad y el origen se fusionan campo a campo: cada uno
+  es el de la ultima ronda en que esta reconocido, asi que una ronda que
+  relista un hallazgo sin Origen no borra el de la anterior. El mismo ID en un
+  informe sin sufijo y en otro con sufijo de revisor cuenta como dos (no se
+  sabe que sea el mismo revisor). La fila-marcador «sin hallazgos» (ID
+  `(ninguno)`, Estado `sin hallazgos`, o ID y severidad en blanco o «—») no
+  es un hallazgo. Un informe sin tabla de hallazgos deja la tarea en «—» (sin
+  dato, no cero); la salida dice cuantos hay y lo avisa.
+- La severidad se reconoce por su primera palabra, sin distinguir
+  mayusculas, tildes ni enfasis (`Importante`, `Crítico`, `menor`,
+  `IMPORTANTE (no verificado)`); una fuera de vocabulario (`Alta`,
   `Major`, vacia) sale como aviso con la tarea y el fichero y no cuenta en
   `crit/imp/men`. `leerHallazgos` expone `severidadReconocida`.
 - Bajo la tabla: la mediana de lecturas por fase de las tareas cuya tabla
@@ -22,7 +28,9 @@ grupos, `--repo`, `--json` y la linea base quedan para TASK-065.
   en alguna fase.
 - `--tokens` anade `tok_nuevos` (entrada + escritura de cache + salida),
   `tok_cache_lect` y `tok_sin_desglose` (`tokens_<fase>` menos lo desglosado).
-  Un negativo no se recorta a 0: sale con aviso. Un agente repetido en la
+  Un negativo en una fase no se recorta a 0: sale con aviso y la celda lleva
+  `*` aunque la suma sea positiva. Con solo filas `manual`, `tok_nuevos` y
+  `tok_cache_lect` salen «—» (no medido), no 0. Un agente repetido en la
   misma fase (MEN-2 de TASK-063) se avisa y no se deduplica; las filas
   `manual` no cuentan como repetidas. El bloque de `docs/METRICAS.md` no
   cambia de forma, y los avisos no impiden `--escribir`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index 641e8a9..7ff635e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -59,8 +59,12 @@ import {
   type EventoGit,
   type FilaMetricas,
 } from '../core/metricas.js';
-import { INFORME_REVISION_RE, nombresDeUltimaRonda, rondaYRevisorDeInforme } from '../fs/rondas.js';
-import { PETICION_REVISION_RE } from './review.js';
+import {
+  INFORME_REVISION_RE,
+  PETICION_REVISION_RE,
+  nombresDeUltimaRonda,
+  rondaYRevisorDeInforme,
+} from '../fs/rondas.js';
 import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
 import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 1940eab..7b08c22 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -33,7 +33,7 @@ import { STATE_FOLDER, type Task } from '../core/task.js';
 import { resolverConfig } from '../core/config.js';
 import { registrarTransicion } from '../core/transiciones.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
-import { INFORME_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
+import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
 import {
   commitRevisadoDe,
   hallazgosNoCerrados,
@@ -244,9 +244,6 @@ export interface ExtrasPeticion {
   seccionPrevia?: string;
 }
 
-/** Peticiones de revision, con o sin sufijo de dominio (TASK-018). */
-export const PETICION_REVISION_RE = /^peticion-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
-
 /** Lo que hace falta saber de la ronda N para generar la N+1 (TASK-040). */
 interface RondaPrevia {
   ronda: number;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index 00c0248..104fe7d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -24,6 +24,7 @@ import { commitRevisadoDe, veredictoDeRonda, type VeredictoInforme } from '../co
 import {
   INFORME_CODEX_RE,
   INFORME_REVISION_RE,
+  PETICION_REVISION_RE,
   informesDeUltimaRonda,
   nombresDeUltimaRonda,
 } from '../fs/rondas.js';
@@ -36,7 +37,7 @@ import {
   showFileAtRef,
 } from '../fs/git.js';
 import type { Task } from '../core/task.js';
-import { REVISION_DIRNAME, PETICION_REVISION_RE } from './review.js';
+import { REVISION_DIRNAME } from './review.js';
 import { planRedactado } from './approve.js';
 
 export class SiguienteCommandError extends Error {}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 2a33af5..9feafd5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -160,12 +160,32 @@ function origenDe(celda: string): OrigenHallazgo {
   return (ORIGENES_HALLAZGO as readonly string[]).includes(valor) ? (valor as OrigenHallazgo) : 'sin clasificar';
 }
 
-/** Severidad sin distinguir mayusculas, tildes ni enfasis; null fuera del vocabulario. */
+/**
+ * Severidad por la PRIMERA PALABRA de la celda, sin distinguir mayusculas,
+ * tildes ni enfasis: `IMPORTANTE (no verificado por ejecucion)` o
+ * `**Menor** (ronda 1)` se reconocen (los revisores anotan detras). null si
+ * esa primera palabra no es del vocabulario (`Alta`, `Major`, `—`, vacia).
+ */
 export function severidadDe(celda: string): SeveridadHallazgo | null {
-  const valor = normalizarCelda(celda).toUpperCase();
+  const primera = (normalizarCelda(celda).split(/[\s(),;:]+/)[0] ?? '').replace(/^[*_`]+|[*_`]+$/g, '');
+  const valor = primera.toUpperCase();
   return (SEVERIDADES_HALLAZGO as readonly string[]).includes(valor) ? (valor as SeveridadHallazgo) : null;
 }
 
+const SOLO_GUION_RE = /^[-—–]*$/;
+
+/**
+ * La fila-marcador «sin hallazgos» que la plantilla admite
+ * (`| (ninguno) | — | sin hallazgos | — |` y variantes): ID `(ninguno)`,
+ * Estado `sin hallazgos`, o ID y severidad en blanco o con un guion. No es
+ * un hallazgo (IMP-1 de la revision de TASK-064).
+ */
+function esMarcadorSinHallazgos(id: string, severidad: string, estado: string): boolean {
+  if (/^\(?ninguno\)?$/i.test(id)) return true;
+  if (estado.toLowerCase() === 'sin hallazgos') return true;
+  return SOLO_GUION_RE.test(id) && SOLO_GUION_RE.test(severidad);
+}
+
 /**
  * Todas las filas de la primera tabla bajo `## Hallazgos` cuya cabecera
  * tenga las columnas ID y Estado (por nombre, no por posicion), con su
@@ -216,6 +236,7 @@ export function leerHallazgos(informe: string): LecturaTodosHallazgos {
     const id = c[iId] ?? '';
     if (id === '' || id.toLowerCase().startsWith('(ej.')) continue;
     const severidad = iSev === -1 ? '' : (c[iSev] ?? '');
+    if (esMarcadorSinHallazgos(id, severidad, c[iEstado] ?? '')) continue;
     hallazgos.push({
       id,
       severidad,
@@ -272,7 +293,16 @@ export interface SeveridadDesconocida {
  * REGLA (decision de Carlos, 2026-10-25): cada hallazgo cuenta UNA vez por
  * tarea, con clave revisor + ID (el ID sin distinguir mayusculas). Un
  * hallazgo que reaparece en la ronda 2 con estado `corregido` no suma otra
- * vez; su severidad y su origen son los de la ultima ronda en que aparece.
+ * vez. Su severidad y su origen se fusionan CAMPO A CAMPO: cada uno es el de
+ * la ultima ronda en que ese campo esta reconocido (una ronda 2 con
+ * `IMPORTANTE (ronda 1)` sin Origen no borra el `plan` de la ronda 1); solo
+ * si ninguna ronda lo reconoce queda `desconocida` / `sin clasificar`.
+ *
+ * El revisor sale del sufijo del fichero ('' sin sufijo), asi que el mismo ID
+ * en `informe-revision-1.md` y en `informe-revision-2-<revisor>.md` (una
+ * ronda sin fragmentar y otra fragmentada) cuenta como DOS hallazgos: no hay
+ * forma de saber que el revisor sin sufijo era el mismo (MEN-3 de la
+ * revision de TASK-064, consecuencia aceptada de la regla).
  *
  * QUE SIGNIFICA CADA null (para quien agregue despues):
  *  - `porSeveridad`/`porOrigen` null con `informes === 0`: la tarea no tiene
@@ -295,7 +325,7 @@ export interface ResumenHallazgos {
 export function resumirHallazgos(informes: readonly InformeLeido[]): ResumenHallazgos {
   const informesSinTabla: string[] = [];
   const severidadesDesconocidas: SeveridadDesconocida[] = [];
-  const porClave = new Map<string, HallazgoLeido>();
+  const porClave = new Map<string, { severidad: SeveridadHallazgo | null; origen: OrigenHallazgo }>();
   const ordenados = [...informes].sort((a, b) => a.ronda - b.ronda || a.fichero.localeCompare(b.fichero));
   for (const inf of ordenados) {
     const { tabla, hallazgos } = leerHallazgos(inf.texto);
@@ -307,7 +337,12 @@ export function resumirHallazgos(informes: readonly InformeLeido[]): ResumenHall
       if (h.severidadReconocida === null) {
         severidadesDesconocidas.push({ fichero: inf.fichero, id: h.id, valor: h.severidad });
       }
-      porClave.set(`${inf.revisor}\u0000${h.id.toUpperCase()}`, h);
+      const clave = `${inf.revisor}\u0000${h.id.toUpperCase()}`;
+      const previo = porClave.get(clave) ?? { severidad: null, origen: 'sin clasificar' as OrigenHallazgo };
+      porClave.set(clave, {
+        severidad: h.severidadReconocida ?? previo.severidad,
+        origen: h.origen === 'sin clasificar' ? previo.origen : h.origen,
+      });
     }
   }
   if (informes.length === 0 || informesSinTabla.length > 0) {
@@ -316,7 +351,7 @@ export function resumirHallazgos(informes: readonly InformeLeido[]): ResumenHall
   const porSeveridad: ConteoSeveridad = { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 0 };
   const porOrigen: ConteoOrigen = { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 0 };
   for (const h of porClave.values()) {
-    porSeveridad[h.severidadReconocida ?? 'desconocida']++;
+    porSeveridad[h.severidad ?? 'desconocida']++;
     porOrigen[h.origen]++;
   }
   return { informes: informes.length, informesSinTabla, porSeveridad, porOrigen, severidadesDesconocidas };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 80c1469..a82b45b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -616,29 +616,44 @@ export function sustituirBloqueTokens(contenido: string, bloque: string): string
 
 // --- Fila enriquecida: desglose, hallazgos, lecturas (TASK-064) --------------
 
-/** Suma de un campo de las tres fases del desglose; null si la tarea no tiene tabla `## Coste`. */
+/**
+ * Suma de un campo de las tres fases del desglose; null si la tarea no tiene
+ * tabla `## Coste`. `nuevos` y `cacheLectura` tambien son null si ninguna
+ * fila tiene desglose (solo filas `manual`): no se midio nada, no es 0.
+ */
 function sumaDesglose(f: FilaMetricas, campo: 'nuevos' | 'cacheLectura' | 'sinDesglose'): number | null {
   if (!f.coste.conTabla) return null;
+  if (campo !== 'sinDesglose' && FASES_COSTE.every((fase) => f.coste.fases[fase].desglosado === 0)) return null;
   return FASES_COSTE.reduce((a, fase) => a + (f.coste.fases[fase][campo] ?? 0), 0);
 }
 
+/** `tok_sin_desglose`: la suma, con `*` si alguna fase es negativa (la suma podria esconderlo). */
+function celdaSinDesglose(f: FilaMetricas): string {
+  const suma = sumaDesglose(f, 'sinDesglose');
+  if (suma === null) return '—';
+  const negativa = FASES_COSTE.some((fase) => (f.coste.fases[fase].sinDesglose ?? 0) < 0);
+  return negativa ? `${String(suma)}*` : String(suma);
+}
+
 /** Las que anade `--tokens` a la tabla por pantalla (no al bloque de docs/METRICAS.md). */
 export const COLUMNAS_DESGLOSE_TOKENS: readonly ColumnaMetricas[] = [
   { cabecera: 'tok_nuevos', valor: (f) => celdaTokens(sumaDesglose(f, 'nuevos')) },
   { cabecera: 'tok_cache_lect', valor: (f) => celdaTokens(sumaDesglose(f, 'cacheLectura')) },
-  { cabecera: 'tok_sin_desglose', valor: (f) => celdaTokens(sumaDesglose(f, 'sinDesglose')) },
+  { cabecera: 'tok_sin_desglose', valor: celdaSinDesglose },
 ];
 
 export const NOTA_DESGLOSE_TOKENS =
-  'Desglose de "## Coste" (solo tareas con esa tabla; «—» = sin tabla): tok_nuevos = entrada + ' +
+  'Desglose de "## Coste" (solo tareas con esa tabla; «—» = sin tabla, y en tok_nuevos y ' +
+  'tok_cache_lect tambien si ninguna fila tiene desglose): tok_nuevos = entrada + ' +
   'escritura de cache + salida; tok_cache_lect = lectura de cache, aparte; tok_sin_desglose = ' +
-  'tokens_<fase> menos lo desglosado (filas "manual" o coste anterior a la tabla). Un negativo es ' +
-  'una incoherencia (el desglose supera al total): sale con aviso y no se recorta a 0. Un agente ' +
+  'tokens_<fase> menos lo desglosado (filas "manual" o coste anterior a la tabla), sumado por ' +
+  'fases. Un negativo en una fase es una incoherencia (el desglose supera al total): no se ' +
+  'recorta a 0, sale con aviso y la celda lleva "*" aunque la suma sea positiva. Un agente ' +
   'repetido en una fase suma tantas veces como filas tenga: se avisa, no se deduplica.';
 
 export const NOTA_HALLAZGOS =
   'Hallazgos: cada uno cuenta una vez por tarea (revisor + ID) sumando todas las rondas, con la ' +
-  'severidad y el origen de la ultima ronda en que aparece. hall_origen = implementacion/plan/' +
+  'severidad y el origen de la ultima ronda que los reconoce. hall_origen = implementacion/plan/' +
   'especificacion/sin clasificar. «—» = sin dato: sin informes de revision, o algun informe sin ' +
   'tabla de hallazgos (no cuenta como cero).';
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
index 9ca0e5e..0da4afb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -78,15 +78,22 @@ export async function ultimaRonda(dir: string, patron: RegExp): Promise<number>
  * Vive aqui desde TASK-036: antes estaba copiada en finish.ts y en
  * codex-review.ts.
  */
-export const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
+export const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-([a-z0-9-]+))?\.md$/;
+
+/**
+ * Peticiones de revision, con el mismo sufijo opcional por revisor. Vive
+ * aqui desde TASK-064 (antes en commands/review.ts, que la reexporta).
+ */
+export const PETICION_REVISION_RE = /^peticion-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 
 /**
  * Ronda y revisor de un nombre de informe de revision (TASK-064): el
  * revisor es el sufijo de una ronda fragmentada, '' sin sufijo. null si el
- * nombre no es un informe de revision.
+ * nombre no es un informe de revision. Usa `INFORME_REVISION_RE` (su segundo
+ * grupo es el revisor): una sola regex, para que no diverjan.
  */
 export function rondaYRevisorDeInforme(nombre: string): { ronda: number; revisor: string } | null {
-  const m = /^informe-revision-(\d+)(?:-([a-z0-9-]+))?\.md$/.exec(nombre);
+  const m = INFORME_REVISION_RE.exec(nombre);
   if (m === null) return null;
   return { ronda: Number(m[1]), revisor: m[2] ?? '' };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts
index 2229717..116a625 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts
@@ -86,6 +86,19 @@ async function escenario(repoRoot: string, tareasRoot: string): Promise<void> {
     `# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n${CABECERA_HALLAZGOS}| MEN-1 | Alta | abierto | app.txt | |\n`,
     'utf8'
   );
+  // Ronda 3 (revision de TASK-064): IMP-1 relistado con la severidad anotada y
+  // sin Origen (no borra el "Plan" de la ronda 2), y el revisor java-spring
+  // sin hallazgos (la fila-marcador no es un hallazgo).
+  await writeFile(
+    path.join(revision, 'informe-revision-3.md'),
+    `# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n${CABECERA_HALLAZGOS}| IMP-1 | IMPORTANTE (ronda 1) | corregido | app.txt | |\n`,
+    'utf8'
+  );
+  await writeFile(
+    path.join(revision, 'informe-revision-3-java-spring-reviewer.md'),
+    `# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n${CABECERA_HALLAZGOS}| (ninguno) | — | sin hallazgos | — | — |\n`,
+    'utf8'
+  );
 
   // ## Coste: el agente a1 dos veces en implementacion (repetida), r1 en
   // revision con un total del frontmatter menor que su desglose, y una fila
@@ -127,7 +140,8 @@ test('metricas: hallazgos una vez por revisor + ID, severidad en minusculas, inf
     assert.deepEqual([t1.crit, t1.imp, t1.men], ['0', '1', '1']);
     // MEN-1 implementacion (ronda 2 manda), IMP-1 plan, java MEN-1 sin clasificar.
     assert.equal(t1.hall_origen, '1/1/0/1');
-    assert.equal(t1.rondas, '2');
+    assert.equal(t1.rondas, '3');
+    assert.doesNotMatch(r.stderr, /ninguno|ronda 1\)/, 'ni la fila-marcador ni la severidad anotada avisan');
 
     const t2 = porColumna(r.stdout, ID2);
     assert.deepEqual([t2.crit, t2.imp, t2.men, t2.hall_origen], ['—', '—', '—', '—'], 'sin tabla no es cero');
@@ -159,7 +173,9 @@ test('metricas --tokens: nuevos, lectura de cache y sin desglose (negativo sin r
     assert.equal(t1.tok_nuevos, '210');
     assert.equal(t1.tok_cache_lect, '900');
     // diseno 1000 - 0 + implementacion 740 - 740 + revision 100 - 370.
-    assert.equal(t1.tok_sin_desglose, '730');
+    // El "*" marca que la fase de revision es negativa aunque la suma no lo sea.
+    assert.equal(t1.tok_sin_desglose, '730*');
+    assert.match(r.stdout, /la celda lleva "\*" aunque la suma sea positiva/);
     const t2 = porColumna(r.stdout, ID2);
     assert.deepEqual([t2.tok_nuevos, t2.tok_cache_lect, t2.tok_sin_desglose], ['—', '—', '—']);
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
index 21d17a8..91fb4d4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
@@ -70,8 +70,9 @@ test('metricas --tokens: columnas por fase y total, la tarea sin datos en la tab
       cab,
       /\| tok_diseno +\| tok_curso +\| tok_revision +\| tok_total +\| tok_nuevos +\| tok_cache_lect +\| tok_sin_desglose +\|$/
     );
-    // TASK-064: las tres filas son "manual" (--tokens N): nada desglosado, todo sin desglose.
-    assert.deepEqual(celdas(r.stdout, ID).slice(-7), ['1000', '3000', '1000', '5000', '0', '0', '5000']);
+    // TASK-064: las tres filas son "manual" (--tokens N): nuevos y cache sin medir («—», no 0)
+    // y todo sin desglose.
+    assert.deepEqual(celdas(r.stdout, ID).slice(-7), ['1000', '3000', '1000', '5000', '—', '—', '5000']);
     // Sin tabla "## Coste": sin dato, no 0.
     assert.deepEqual(celdas(r.stdout, ID2).slice(-7), ['—', '—', '—', '—', '—', '—', '—']);
     assert.match(r.stdout, /tok_sin_desglose = tokens_<fase> menos lo desglosado/);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
index 0b87ef4..0d6ab99 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
@@ -308,8 +308,8 @@ test('avisosDeFila: negativa, total vacio con filas, repetidas y severidades des
   assert.match(avisos[1] as string, /^TASK-007: tokens_revision esta vacio pero "## Coste" tiene 1 fila/);
   assert.match(avisos[2] as string, /^TASK-007: en "## Coste", a1 aparece en 2 filas de diseno/);
   assert.match(avisos[3] as string, /^TASK-007 revision\/informe-revision-1\.md: severidad fuera de vocabulario .* X-1 \("Major"\)/);
-  // La columna muestra el negativo sumado, sin recortar.
-  assert.equal(COLUMNAS_DESGLOSE_TOKENS[2]?.valor(f), '-55');
+  // La columna muestra el negativo sumado, sin recortar, y marcado (MEN-1 de la ronda 1).
+  assert.equal(COLUMNAS_DESGLOSE_TOKENS[2]?.valor(f), '-55*');
 });
 
 test('notas: informes sin tabla, mediana de lecturas por fase y terminadas sin coste', () => {
@@ -345,3 +345,94 @@ test('notas: informes sin tabla, mediana de lecturas por fase y terminadas sin c
   assert.match(avisoInformesSinTabla(filas) ?? '', /^1 informe\(s\) de revision sin tabla .* TASK-009\.$/);
   assert.equal(avisoInformesSinTabla([enCurso]), null);
 });
+
+// --- Ronda 1 de revision de TASK-064 ------------------------------------------
+
+// IMP-1: la fila-marcador «sin hallazgos» no es un hallazgo.
+test('resumirHallazgos: la fila «sin hallazgos» y sus variantes se descartan sin aviso', () => {
+  for (const marcador of [
+    '| (ninguno) | — | sin hallazgos | — | |\n',
+    '| (Ninguno) | - | - | - | |\n',
+    '| — | — | — | — | |\n',
+    '| X | | Sin hallazgos | | |\n',
+    '|  |  | abierto |  | |\n',
+  ]) {
+    const r = resumirHallazgos([informe('informe-revision-1.md', tabla(marcador))]);
+    assert.deepEqual(r.porSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 0 }, marcador);
+    assert.deepEqual(r.porOrigen, { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 0 }, marcador);
+    assert.deepEqual(r.severidadesDesconocidas, [], marcador);
+  }
+});
+
+// IMP-2 (a): la severidad se reconoce por su primera palabra.
+test('severidadDe: por la primera palabra, con anotaciones detras', () => {
+  for (const [celda, esperado] of [
+    ['IMPORTANTE (no verificado por ejecucion)', 'IMPORTANTE'],
+    ['MENOR (no verificado)', 'MENOR'],
+    ['IMPORTANTE (ronda 1)', 'IMPORTANTE'],
+    ['**Crítico** (ronda 2)', 'CRITICO'],
+    ['menor, cosmetico', 'MENOR'],
+    ['Alta (ronda 1)', null],
+    ['IMPORTANTES', null],
+    ['—', null],
+  ] as const) {
+    assert.equal(severidadDe(celda), esperado, celda);
+  }
+});
+
+// IMP-2 (b): cada campo toma la ultima ronda en la que esta reconocido.
+test('resumirHallazgos: severidad y origen de la ultima ronda que los reconoce, campo a campo', () => {
+  const r = resumirHallazgos([
+    informe('informe-revision-1.md', tabla('| IMP-1 | IMPORTANTE | abierto | a | plan |\n| MEN-1 | Alta | abierto | b | implementacion |\n')),
+    informe('informe-revision-2.md', tabla('| IMP-1 | IMPORTANTE (ronda 1) | corregido | a | |\n| MEN-1 | menor | corregido | b | quien sabe |\n')),
+    informe('informe-revision-3.md', tabla('| IMP-1 | ¿? | corregido | a | |\n')),
+  ]);
+  assert.deepEqual(r.porSeveridad, { CRITICO: 0, IMPORTANTE: 1, MENOR: 1, desconocida: 0 });
+  assert.deepEqual(r.porOrigen, { implementacion: 1, plan: 1, especificacion: 0, 'sin clasificar': 0 });
+  // Los avisos siguen saliendo por cada celda no reconocida, aunque otra ronda la reconozca.
+  assert.deepEqual(
+    r.severidadesDesconocidas.map((d) => [d.fichero, d.id]),
+    [
+      ['informe-revision-1.md', 'MEN-1'],
+      ['informe-revision-3.md', 'IMP-1'],
+    ]
+  );
+  // Si ninguna ronda la reconoce, queda desconocida / sin clasificar.
+  const nunca = resumirHallazgos([
+    informe('informe-revision-1.md', tabla('| X-1 | Alta | abierto | a | |\n')),
+    informe('informe-revision-2.md', tabla('| X-1 | Major | abierto | a | ninguno |\n')),
+  ]);
+  assert.deepEqual(nunca.porSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 1 });
+  assert.deepEqual(nunca.porOrigen, { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 1 });
+});
+
+// MEN-1: un negativo en alguna fase marca la celda aunque la suma sea positiva.
+test('tok_sin_desglose: con alguna fase negativa la celda lleva "*" aunque la suma sea positiva', () => {
+  const body = cuerpoConCoste([manual('diseno', 1000), agente('revision', 'agente:r1', 10, 20, 300, 40, 3)]);
+  const f = calcularFila(entrada({ task: tarea({ tokens_diseno: 1000, tokens_revision: 100 }), body }));
+  assert.equal(COLUMNAS_DESGLOSE_TOKENS[2]?.valor(f), '730*');
+  const sano = calcularFila(entrada({ task: tarea({ tokens_diseno: 1000 }), body: cuerpoConCoste([manual('diseno', 1000)]) }));
+  assert.equal(COLUMNAS_DESGLOSE_TOKENS[2]?.valor(sano), '1000');
+});
+
+// MEN-2: solo filas manual = nada medido de nuevos ni de cache.
+test('tok_nuevos y tok_cache_lect: «—» si ninguna fila de "## Coste" tiene desglose', () => {
+  const f = calcularFila(
+    entrada({ task: tarea({ tokens_diseno: 800 }), body: cuerpoConCoste([manual('diseno', 500), manual('diseno', 300)]) })
+  );
+  assert.deepEqual(COLUMNAS_DESGLOSE_TOKENS.map((c) => c.valor(f)), ['—', '—', '800']);
+});
+
+// MEN-6: los dos mutantes que sobrevivieron.
+test('resumirCostes: un id repetido dentro de la misma fuente no es una fila repetida', () => {
+  const r = resumirCostes([agente('diseno', 'agente:a1,a1', 1, 1, 1, 1, 1)], { diseno: 4, implementacion: null, revision: null });
+  assert.deepEqual(r.repetidas, []);
+});
+
+test('resumirCostes: una fila a medias (salida «—») no cuenta como desglose', () => {
+  const media: FilaCoste = { ...agente('diseno', 'agente:a1', 10, 20, 300, 40, 2), salida: null, total: 330 };
+  const r = resumirCostes([media], { diseno: 330, implementacion: null, revision: null });
+  assert.equal(r.fases.diseno.desglosado, 0);
+  assert.equal(r.fases.diseno.nuevos, 0);
+  assert.equal(r.fases.diseno.sinDesglose, 330);
+});
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 4e6baf67120ec9df036510e707d2df5f05b9da84..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-064/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-064/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-064/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-064/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-064/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-064/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-064/revision/informe-revision-1.md                                                  |   86 +++++
 tareas/03-en-revision/TASK-064/revision/peticion-revision-1.md                                                 | 1528 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-064/tarea.md                                                       |    5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                     |    3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                       |    4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                                    |    4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                                 |   35 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                         |   28 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js                                             |   12 +-
 15 files changed, 1683 insertions(+), 22 deletions(-)
````
