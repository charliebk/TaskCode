# Peticion de revision — TASK-111 (ronda 1)

- Tarea: TASK-111 — P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo
- Rama revisada: feature/task-111-p-3-registrar-cada-ejecucion-del-freno-s
- Rama base: develop
- Commit revisado (HEAD): d2615c58a89baa43223bebdb47ae6bd93b53772d
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-111 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-111/tarea.md
- tareas/03-en-revision/TASK-111/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/registro-puertas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-registro.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts

## Commits a revisar (git log develop..HEAD)

````
d2615c5 feat(TASK-111): registro del freno Stop, omitido sin cambios desde el ultimo verde y columnas en metricas
8806da5 chore(TASK-111): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 46c99fb..ce632a5 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,7 @@
 # Changelog
 
 ## Sin publicar
+- Cambio de comportamiento (TASK-111): el freno Stop anota cada ejecucion en el registro de puertas (puerta `freno`: verde, rojo, omitido o excedido) y `taskctl metricas` la resume en las columnas `freno_n` y `freno`. Si la huella del arbol es la de su ultimo verde, el freno ya no vuelve a verificar, tampoco con cambios sin commitear.
 - TASK-131 (fix) — Tres tests con expectativas anteriores a TASK-119 (2026-11-13)
 - TASK-127 (feature) — Tope de rondas de revision configurable, 2 por defecto, y decision de una persona al llegar (2026-11-13)
 - Cambio de comportamiento (TASK-127): el tope de rondas de revision pasa a ser la clave `tope_rondas` (1 a 10, leida de la rama base) y por defecto baja de 3 a 2. En el tope, `siguiente` pregunta en todos los modos (cerrar, una ronda mas o volver a diseno) y `review --ronda-extra` exige la linea `- Ronda N:` bajo `## Rondas extra` en `tarea.md`. `tope_rondas: 3` devuelve el comportamiento anterior.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
index dfac567..c66fbeb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
@@ -41,3 +41,25 @@ un campo vacío se escribe `-`.
   ejecución sigue sin línea.
 - `taskctl metricas` suma la puerta `sincronizacion` por tarea en la columna
   `sinc`; sin líneas de la tarea, `—`.
+- `taskctl metricas` resume la puerta `freno` en dos columnas: `freno_n`
+  (veces que el freno ejecutó de verdad la verificación: las `omitido` no
+  cuentan) y `freno` (el tiempo de todas sus líneas); sin líneas, `—`.
+
+## Puerta `freno`
+
+El freno de fin de turno (hook `Stop`) anota una línea cada vez que llega a
+decidir si verifica una tarea en curso. Si no hay tarea en curso en la rama, no
+hay comando de verificación o solo cambia documentación sin comprobación
+declarada, no hay puerta y no hay línea.
+
+| Campo | Valor |
+|---|---|
+| `modo` | El tipo de verificación: `completa`, `selectiva` o `documentacion` |
+| `resultado` | `verde` (ejecutó y salió bien), `rojo` (cualquier otro desenlace: bloquea el turno), `omitido` (no ejecutó: la huella del árbol es la de su último verde, o el memo de la verificación ya la tenía en verde) o `excedido` (agotó su presupuesto de tiempo) |
+| `duracion_s` | Tiempo de reloj de la verificación; `0.0` cuando se omite |
+
+El último verde del freno se guarda aparte, en
+`git rev-parse --git-path taskcode/freno-ultimo-verde.json`, con la huella del
+árbol (commit, comando, timeout, base de la selectiva y contenido de lo que no
+está limpio). Por eso un turno que no cambia nada no vuelve a verificar aunque
+haya cambios sin commitear. Solo lo lee el freno: no abre ninguna otra puerta.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index 804f5af..f665c12 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -41,7 +41,7 @@
  * y los CRITICO/IMPORTANTE de su informe; `--json` lo lleva en `lecturasRevision`.
  * No entra en `--escribir`, y todo sale del repo: nunca se lee `~/.claude`.
  */
-import { sumarPorTarea } from '../core/registro-puertas.js';
+import { resumirFreno, sumarPorTarea } from '../core/registro-puertas.js';
 import { leerRegistroPuertas } from '../fs/registro-puertas.js';
 import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
@@ -501,10 +501,14 @@ export async function leerRepoMetricas(repo: RepoMetricas, varios: boolean): Pro
   }
 
   // TASK-120: la sincronizacion de cada tarea, del registro de puertas (una lectura por repo).
-  const sincPorTarea = sumarPorTarea(leerRegistroPuertas(repo.ruta), 'sincronizacion');
+  // TASK-111: y el freno Stop, de la misma lectura.
+  const registroPuertas = leerRegistroPuertas(repo.ruta);
+  const sincPorTarea = sumarPorTarea(registroPuertas, 'sincronizacion');
+  const frenoPorTarea = resumirFreno(registroPuertas);
   const filas: FilaMetricas[] = leidas.map((l) =>
     calcularFila({
       sincronizacionS: sincPorTarea.get(l.task.task.id) ?? null,
+      freno: frenoPorTarea.get(l.task.task.id) ?? null,
       task: l.task.task,
       body: l.task.body,
       ronda: l.ronda,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 0b4a0ff..a9b63dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -223,6 +223,8 @@ export interface FilaMetricas {
   estimadaMin: number | null;
   /** TASK-120: suma de la puerta `sincronizacion` del registro de puertas; null sin lineas de la tarea. */
   sincronizacion: Duracion | null;
+  /** TASK-111: veces que corrio el freno Stop y su tiempo total; null sin lineas de la tarea. */
+  freno: { ejecuciones: number; duracion: Duracion } | null;
 }
 
 export interface EntradaMetricas {
@@ -240,6 +242,8 @@ export interface EntradaMetricas {
   peticiones?: readonly { ronda: number; bytes: number }[];
   /** TASK-120: segundos de sincronizacion de la tarea en el registro de puertas; sin dato, null. */
   sincronizacionS?: number | null;
+  /** TASK-111: el freno Stop de la tarea en el registro de puertas; sin dato, null. */
+  freno?: { ejecuciones: number; duracionS: number } | null;
 }
 
 function kbPorRonda(peticiones: readonly { ronda: number; bytes: number }[]): PeticionRonda[] {
@@ -451,6 +455,10 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
       e.sincronizacionS === undefined || e.sincronizacionS === null
         ? null
         : { valor: Math.round(e.sincronizacionS * 1000), precision: 'segundo' },
+    freno:
+      e.freno === undefined || e.freno === null
+        ? null
+        : { ejecuciones: e.freno.ejecuciones, duracion: { valor: Math.round(e.freno.duracionS * 1000), precision: 'segundo' } },
     puntaAPunta: duracionSinPausas(marcas.start, marcas.finish, marcas.intervalosPausa),
     estimadaMin: estimadaAnotada(e.body),
     enPausa: enPausaDe(marcas),
@@ -541,6 +549,9 @@ export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
   { cabecera: 'punta_a_punta', valor: (f) => formatearDuracion(f.puntaAPunta) },
   // TASK-120: lo que suma comando_sincronizacion en la tarea (registro de puertas).
   { cabecera: 'sinc', valor: (f) => formatearDuracion(f.sincronizacion) },
+  // TASK-111: el freno Stop de la tarea: cuantas veces corrio de verdad y cuanto sumo.
+  { cabecera: 'freno_n', valor: (f) => (f.freno === null ? '—' : String(f.freno.ejecuciones)) },
+  { cabecera: 'freno', valor: (f) => (f.freno === null ? '—' : formatearDuracion(f.freno.duracion)) },
 ];
 
 /** Primera columna con varios proyectos (`--repo` repetido): el ID solo no identifica la tarea. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
index 8b46605..c92c3a5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
@@ -73,3 +73,34 @@ export function tareaDeMensaje(mensaje: string): string | null {
   const m = /\bTASK-\d+[a-z]?\b/.exec(mensaje);
   return m === null ? null : m[0];
 }
+
+/**
+ * TASK-111: la puerta del freno Stop. `modo` es el tipo de verificacion
+ * (`completa`, `selectiva`, `documentacion`) y `resultado` uno de estos:
+ * `verde` (ejecuto en verde), `rojo` (cualquier otro desenlace: bloquea),
+ * `omitido` (no ejecuto: sin cambios desde el ultimo verde) y `excedido`
+ * (agoto su presupuesto de tiempo; lo escribe el presupuesto del freno).
+ */
+export const PUERTA_FRENO = 'freno';
+export const RESULTADOS_FRENO = Object.freeze(['verde', 'rojo', 'omitido', 'excedido'] as const);
+export type ResultadoFreno = (typeof RESULTADOS_FRENO)[number];
+
+export interface ResumenFreno {
+  /** Veces que el freno ejecuto de verdad la verificacion (las `omitido` no cuentan). */
+  ejecuciones: number;
+  /** Segundos de todas sus lineas. */
+  duracionS: number;
+}
+
+/** Por tarea: cuantas veces corrio el freno y cuanto sumo. Ignora las demas puertas. */
+export function resumirFreno(lineas: readonly LineaPuerta[]): Map<string, ResumenFreno> {
+  const resumen = new Map<string, ResumenFreno>();
+  for (const l of lineas) {
+    if (l.puerta !== PUERTA_FRENO) continue;
+    const r = resumen.get(l.tarea) ?? { ejecuciones: 0, duracionS: 0 };
+    if (l.resultado !== 'omitido') r.ejecuciones += 1;
+    r.duracionS += l.duracionS;
+    resumen.set(l.tarea, r);
+  }
+  return resumen;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts
new file mode 100644
index 0000000..c5d0d4b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/freno-ultimo-verde.ts
@@ -0,0 +1,50 @@
+/**
+ * TASK-111: el ultimo verde del freno Stop. Memo PROPIO del freno, aparte del
+ * memo compartido de fs/verificacion.ts: aquel no se guarda en la selectiva ni
+ * en la de documentacion con el arbol sucio (TASK-105: no pisar el verde
+ * limpio que buscan finish y el guardian), asi que con cambios sin commitear
+ * el freno repetia la verificacion en cada turno aunque el turno no tocara
+ * nada. Este solo lo lee el freno: no abre ninguna otra puerta.
+ *
+ * Vive en `git rev-parse --git-path taskcode/freno-ultimo-verde.json`. Leer y
+ * guardar nunca lanzan: sin memo, el freno verifica como siempre.
+ */
+import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+
+const VERSION = 1;
+
+function rutaUltimoVerde(raiz: string): string | null {
+  const r = spawnSync('git', ['rev-parse', '--git-path', 'taskcode/freno-ultimo-verde.json'], {
+    cwd: raiz,
+    encoding: 'utf8',
+    windowsHide: true,
+  });
+  const salida = (r.stdout ?? '').trim();
+  if (r.error !== undefined || r.status !== 0 || salida === '') return null;
+  return path.resolve(raiz, salida);
+}
+
+/** true si `huella` es la del ultimo verde del freno para ese tipo de verificacion. */
+export function esUltimoVerde(raiz: string, tipo: string, huella: string): boolean {
+  try {
+    const ruta = rutaUltimoVerde(raiz);
+    if (ruta === null) return false;
+    const m = JSON.parse(readFileSync(ruta, 'utf8')) as { version?: unknown; tipo?: unknown; huella?: unknown };
+    return m.version === VERSION && m.tipo === tipo && m.huella === huella;
+  } catch {
+    return false;
+  }
+}
+
+export function guardarUltimoVerde(raiz: string, tipo: string, huella: string): void {
+  try {
+    const ruta = rutaUltimoVerde(raiz);
+    if (ruta === null) return;
+    mkdirSync(path.dirname(ruta), { recursive: true });
+    writeFileSync(ruta, `${JSON.stringify({ version: VERSION, tipo, huella, fecha: new Date().toISOString() })}\n`, 'utf8');
+  } catch {
+    /* sin memo: el siguiente turno verifica */
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index b80a0d7..5235640 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -16,9 +16,15 @@
  *      curso: nada. HEAD desacoplado cae aqui (aceptado en el plan).
  *   7. Config invalida con tarea en curso en la rama: BLOQUEA (decision de
  *      Carlos: fallo cerrado, como el resto de la config).
- *   8. Memo: misma huella del arbol que la ultima verificacion -> su resultado.
+ *   8. Memo: misma huella del arbol que el ultimo verde del freno (TASK-111)
+ *      -> 0 sin ejecutar ni escribir; misma que la ultima verificacion del
+ *      memo compartido -> su resultado.
  *   9. Ejecutar. Verde -> 0. Cualquier otra cosa -> 2 con el informe.
  *
+ * Registro (TASK-111): cada vez que llega al paso 8 anota una linea de la
+ * puerta `freno` en el registro de puertas (docs/registro-puertas.md): modo =
+ * tipo de verificacion; resultado verde, rojo u omitido.
+ *
  * Que verificacion (TASK-091): con `comando_verificacion_selectiva`, la
  * selectiva, con la base de la tarea (la de su tipo: un hotfix va contra la
  * principal) en RAMA_BASE y su propio memo; sin ella, la completa, como
@@ -48,8 +54,11 @@ import type { Task } from '../core/task.js';
 import { peticionDeTrabajo } from '../fs/decision-documentacion.js';
 import { baseDeTipoSinRed, resolveBaseBranchForTipo } from '../fs/git.js';
 import { listTareasEnEstados } from '../fs/task-store.js';
-import { verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
+import { contextoSelectiva, huellaDelArbol, verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
 import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
+import { PUERTA_FRENO, type LineaPuerta, type ResultadoFreno } from '../core/registro-puertas.js';
+import { anotarPuerta } from '../fs/registro-puertas.js';
+import { esUltimoVerde, guardarUltimoVerde } from '../fs/freno-ultimo-verde.js';
 
 /**
  * `timeout` del hook Stop en hooks/hooks.json, en segundos. Claude Code cancela
@@ -84,6 +93,8 @@ export interface DepsFreno {
    * demas turnos, ni un fichero. Nunca imprime ni lanza.
    */
   progreso?: Progreso;
+  /** TASK-111: donde se anota cada ejecucion (por defecto, el registro de puertas del repo). */
+  anotarPuerta?: (raiz: string, linea: LineaPuerta) => void;
 }
 
 const DEJAR_PARAR: DecisionStop = Object.freeze({ codigo: 0, stderr: '' });
@@ -213,6 +224,32 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       plan.tipo === 'selectiva'
         ? { tipo: 'selectiva', comando: plan.comando, timeoutS, base: plan.base }
         : { tipo: plan.tipo, comando: plan.comando as string, timeoutS };
+    const idTarea = ids[0] ?? tarea;
+    const anotar = (resultado: ResultadoFreno, duracionS: number): void => {
+      (deps.anotarPuerta ?? anotarPuerta)(raiz, {
+        puerta: PUERTA_FRENO,
+        tarea: idTarea,
+        instante: new Date().toISOString(),
+        modo: peticion.tipo,
+        duracionS,
+        resultado,
+      });
+    };
+
+    // 8a. TASK-111: misma huella que el ultimo verde del freno -> ni se ejecuta
+    // ni se escribe nada (salvo los avisos de la decision): el turno no cambio
+    // nada que verificar. Vale tambien con el arbol sucio, donde el memo
+    // compartido de la selectiva no se guarda (TASK-105).
+    const huella = huellaDelArbol(
+      raiz,
+      peticion.comando,
+      peticion.timeoutS,
+      peticion.tipo === 'selectiva' ? contextoSelectiva(raiz, peticion.base as string) : undefined
+    );
+    if (huella !== null && esUltimoVerde(raiz, peticion.tipo, huella)) {
+      anotar('omitido', 0);
+      return dejarParar;
+    }
 
     // 8 y 9. TASK-110: el paso se ve mientras corre; acaba "terminada" si sale
     // en verde, "en rojo" si la verificacion sale en rojo y bloquea el turno, y
@@ -227,15 +264,23 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       ...(deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs }),
     };
     let verificacion: ReturnType<typeof verificarConMemo>;
+    const inicio = Date.now();
     try {
       verificacion = verificarConMemo(raiz, peticion, deOpciones);
     } catch (e: unknown) {
       progreso.terminar('abortada');
       throw e;
     }
+    const duracionS = (Date.now() - inicio) / 1000;
     progreso.terminar(verificacion.resultado.estado === 'verde' ? 'ok' : 'en-rojo');
     const { resultado: r, deMemo, cambioElArbol } = verificacion;
-    if (r.estado === 'verde') return dejarParar;
+    if (r.estado === 'verde') {
+      // TASK-111: un verde del memo compartido tampoco ha ejecutado nada.
+      anotar(deMemo ? 'omitido' : 'verde', duracionS);
+      if (verificacion.huella !== null && !cambioElArbol) guardarUltimoVerde(raiz, peticion.tipo, verificacion.huella);
+      return dejarParar;
+    }
+    anotar('rojo', duracionS);
     if (plan.tipo === 'documentacion') {
       avisos.push(
         `Es la comprobacion de documentacion (comando_verificacion_documentacion): ${plan.motivo}. ` +
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-111/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-111/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-111/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-111/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-111/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-111/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-111/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   |  8 ++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       |  6 ++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/registro-puertas.js                               | 23 +++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/freno-ultimo-verde.js                               | 51 +++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                    | 43 ++++++++++++++++++++++++++++++++++++++++---
 12 files changed, 128 insertions(+), 6 deletions(-)
````

## Tests del diff (8 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/registro-puertas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-registro.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts |   4 +--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts   |   4 +--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts          |  10 +++---
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts       |   5 +--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts              |   6 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/registro-puertas.test.ts      |  41 ++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-registro.test.ts       | 182 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts           |   3 ++
 8 files changed, 242 insertions(+), 13 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 128.6 s
- Commit verificado: d2615c58a89baa43223bebdb47ae6bd93b53772d
- Huella: ae492dc217c7a260422047410687fff06fff5d6f
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 88634 bytes en total):

````
✔ freno (TASK-111): sin tarea en curso no hay linea (1480.7491ms)
✔ freno (TASK-102): un turno de solo documentacion corre la comprobacion de documentacion y no la suite (7246.6133ms)
✔ freno (TASK-102): solo documentacion sin comando de documentacion no corre nada (4204.1267ms)
✔ freno (TASK-102): documentacion sin commitear todavia, sin commits en la rama, cuenta como solo documentacion (4519.7667ms)
✔ freno (TASK-102): un fichero de codigo modificado sin commitear aplica la verificacion de siempre (4971.4698ms)
✔ freno (TASK-102): un fichero de codigo preparado (git add) sin commitear aplica la verificacion de siempre (4919.5195ms)
✔ freno (TASK-102): un fichero de codigo sin seguimiento aplica la verificacion de siempre (5186.5207ms)
✔ freno (TASK-102): un commit de codigo en la rama aplica la verificacion de siempre (4284.3106ms)
✔ freno (TASK-102): con la selectiva declarada, solo documentacion se decide antes; con codigo, la selectiva (7780.746ms)
✔ freno (TASK-102): sin rutas_documentacion se comporta como en la 0.14.0 y no lanza ningun git nuevo (7285.9805ms)
✔ freno (TASK-102): con el arbol sucio corre la comprobacion de documentacion pero no guarda su memo; limpio, si (7882.8633ms)
✔ freno (TASK-102): una config de la base invalida no bloquea: la verificacion de siempre con un aviso (5064.8208ms)
✔ freno (TASK-102, MEN-1/MEN-2): un hotfix no se exime por documentacion ni va a la red a por su base (5538.0779ms)
✔ freno: verificacion en verde deja parar, en silencio (5896.61ms)
✔ freno: verificacion en rojo bloquea con exit 2 y el comando, el codigo, la duracion y la cola (4438.952ms)
✔ freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecuta el comando (4586.4981ms)
✔ freno: fuera de un proyecto con tareas (o sin cwd) sale 0 sin tocar nada (9.2612ms)
✔ freno: stop_hook_active e interruptor FRENO_VERIFICACION=0 dejan parar sin ejecutar (1183.1974ms)
✔ freno: respeta el timeout y corta el comando (bloquea, no deja pasar) (5504.6681ms)
✔ freno: timeout_verificacion por encima del tope del hook se recorta y se avisa (3526.0088ms)
✔ freno: config invalida con tarea en curso bloquea con el error de la config (1361.4903ms)
✔ freno: memo por huella — mismo arbol no vuelve a ejecutar, un cambio si (11761.9687ms)
✔ freno: la cola va acotada, sin ANSI, sin credenciales y sin partir UTF-8 (2810.1595ms)
✔ freno: el punto de entrada real, por stdin, sale con 2 en rojo y 0 en verde (6278.5623ms)
✔ freno: hooks.json declara el Stop en forma exec, con el tope que usa el codigo y sin nombrar el producto (1.4179ms)
✔ freno (IMP-2): el timeout efectivo nunca supera el tope del hook menos el margen (0.3441ms)
✔ freno (MEN-1): un corte con salida corta no se rotula como truncado (4958.7832ms)
✔ freno (MEN-2): una tarea en curso ilegible no frena, pero se avisa (1204.3476ms)
✔ freno (MEN-7): si la propia verificacion ensucia el arbol, el informe lo avisa (2840.2634ms)
✔ informe (MEN-7): recortarCola no parte caracteres multibyte en una linea larga (0.6467ms)
✔ informe (MEN-5): una muerte sin codigo no se describe como «codigo null» (0.1609ms)
ℹ tests 868
ℹ suites 0
ℹ pass 868
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 110725.6832
[verificar-impacto] node --test termino con 0 en 110.8 s.
````
