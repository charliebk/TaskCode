# Peticion de revision — TASK-127 (ronda 1)

- Tarea: TASK-127 — Tope de rondas de revision configurable, 2 por defecto, y decision de una persona al llegar
- Rama revisada: feature/task-127-tope-de-rondas-de-revision-configurable
- Rama base: develop
- Commit revisado (HEAD): d99b84f0efa1ee186da680590acdda0dfb162f99
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-127 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-127/tarea.md
- tareas/03-en-revision/TASK-127/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-rondas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/config-tope-rondas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/rondas-extra.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts

## Commits a revisar (git log develop..HEAD)

````
d99b84f fix(TASK-127): la skill de revision no nombra la ruta de config del plugin
4a7c5b6 feat(TASK-127): tope de rondas configurable, 2 por defecto, con decision de persona al llegar
68ed058 chore(TASK-127): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 6ebb9da..8a277ba 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -91,9 +91,15 @@ revisa desde la rama base.
 Entre una ronda y otra se corrige **todo** lo de la ronda: los CRÍTICO e
 IMPORTANTE siempre; el MENOR que no compense se marca `aceptado` con su
 motivo o pasa a una tarea nueva. `taskctl review` avisa si se abre una ronda
-con hallazgos de la anterior sin marcar. Tras la ronda 3 con cambios,
-`taskctl siguiente` pregunta en cualquier modo y `taskctl review` no abre la
-ronda 4 sin `--ronda-extra`, que se pasa solo cuando lo decide una persona.
+con hallazgos de la anterior sin marcar. El tope de rondas es
+`tope_rondas` (de 1 a 10, **2 por defecto**, leído de la config de la rama
+base). Si la última ronda permitida pide cambios, `taskctl siguiente`
+pregunta en cualquier modo, también en automático, con tres salidas: cerrar
+con lo que hay, una ronda más o volver a diseño (lo abierto, en una tarea
+nueva). `taskctl review` no abre otra ronda sin `--ronda-extra` y sin la
+decisión de la persona en `tarea.md` (`## Rondas extra`, línea
+`- Ronda N: <quién y por qué>`); cada ronda extra vuelve a preguntar. Con
+`tope_rondas: 3` se comporta como hasta la 0.15.
 
 El motivo, medido: con la regla anterior (0.12), un IMPORTANTE en cualquier
 estado, también corregido, obligaba a una ronda completa; los revisores
@@ -235,6 +241,7 @@ La referencia detallada vive en `docs/`, un fichero por tema:
     - [Cobertura de las líneas cambiadas](docs/configuracion.md#cobertura-de-las-líneas-cambiadas)
     - [Guardián de merges (hook `PreToolUse`)](docs/configuracion.md#guardián-de-merges-hook-pretooluse)
     - [Documento de estado vigilado por `doctor`: `documento_estado`](docs/configuracion.md#documento-de-estado-vigilado-por-doctor-documento_estado)
+    - [Tope de rondas de revisión: `tope_rondas`](docs/configuracion.md#tope-de-rondas-de-revisión-tope_rondas)
   - [Sincronización de ficheros derivados](docs/configuracion.md#sincronización-de-ficheros-derivados)
   - [ROADMAP de tareas (`tareas/ROADMAP.md`)](docs/configuracion.md#roadmap-de-tareas-tareasroadmapmd)
 - [Cierre y release](docs/cierre-y-release.md)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index c205923..a9fc5b7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -416,6 +416,14 @@ documento_estado: docs/ESTADO.md   # opcional: sin ella no se vigila ningun docu
 
 - **`documento_estado`** (opcional; sin ella no se vigila ningún documento): ruta, relativa a la raíz del repo, del documento que resume el estado del proyecto. Solo la lee `taskctl doctor`, en la comprobación `documento-estado`. La fecha del documento es la de su último commit (`git log -1 -- <ruta>`), no la de modificación del fichero. Da aviso, con el arreglo, si el fichero no existe o no tiene commits; si ese commit tiene 15 días o más (14 aún es `ok`), y si alguna tarea de `04-terminadas` tiene `actualizado` posterior al día de ese commit, diciendo cuántas y cuál es la más reciente. Nunca es error, así que no cambia el código de salida. Un valor inválido aborta: vacío, ruta absoluta, que salga del repo, una carpeta, o bajo `.git/`, `.taskcode/` o una carpeta de estado de `tareas/`.
 
+#### Tope de rondas de revisión: `tope_rondas`
+
+```yaml
+tope_rondas: 2   # opcional: de 1 a 10; 2 por defecto
+```
+
+- **`tope_rondas`** (opcional; 2 por defecto): rondas de revisión que se abren sin preguntar. Lo leen `taskctl siguiente` y `taskctl review` de la config de la **rama base**, así que la rama de una tarea no puede subirse su propio tope. Si la última ronda permitida pide cambios, `siguiente` pregunta en cualquier modo con tres salidas (cerrar, una ronda más, volver a diseño) y `review` exige `--ronda-extra` más la línea `- Ronda N: <quién y por qué>` bajo `## Rondas extra` en `tarea.md`. Un valor fuera de 1..10 o no entero aborta. `tope_rondas: 3` es el comportamiento anterior a TASK-127.
+
 ## Sincronización de ficheros derivados
 
 Un proyecto puede regenerar en cada transición los ficheros que derivan del
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 4a47c23..e287b9f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -94,13 +94,16 @@ punto, no un formalismo.
    reverifican (los compruebas tu), y un revisor que solo tenia MENORES y cuyos
    ficheros no toca la correccion no recibe peticion: `taskctl review` lo anota
    en `## Revisores no relanzados` de `tarea.md`.
-   **Tope**: tras la ronda 3 con cambios, `siguiente` pregunta en cualquier
-   modo. Lo decide una persona: aceptar lo abierto (sus IDs y el motivo en el
-   `## Resultado`) y cerrar, pasarlo a una tarea nueva, o corregir y abrir
-   otra ronda con `taskctl review TASK-NNN --ronda-extra`. Pasa ese flag solo
-   cuando la persona lo diga: sin el, `review` no abre la ronda 4. Un «si»
-   quiere decir corregir primero y despues abrir la ronda, nunca relanzarla
-   sobre el mismo codigo.
+   **Tope** (`tope_rondas` de la config de la rama base, 2 por defecto): si
+   la ultima ronda permitida pide cambios, `siguiente` pregunta en cualquier
+   modo, tambien en automatico, y trae tres `salidas`. Pregunta a la persona
+   y no elijas tu: **cerrar** con lo que hay (lo abierto, `aceptado` con sus
+   IDs y el motivo en el `## Resultado`); **una ronda mas** (corregir,
+   commitear, anotar en `tarea.md` bajo `## Rondas extra` la linea
+   `- Ronda N: <quien lo decide y por que>` y
+   `taskctl review TASK-NNN --ronda-extra`); o **volver a diseno** (lo abierto, en una tarea nueva con
+   `taskctl new`, enlazada desde el Resultado). Sin esa linea `review` no abre
+   la ronda, y cada ronda extra vuelve a preguntar y pide la suya.
    **MENORES tras aprobar** (`aprobada-con-correcciones` sin CRITICO ni
    IMPORTANTE abiertos): **nunca** se piden como `cambios-solicitados` ni
    abren otra ronda, en ningun modo. Corrige los baratos tocando solo los
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index dcacfd2..08ad323 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -79,18 +79,20 @@ diciendo que toca hacer ese trabajo, commitearlo y despues
 `/taskcode-plugin:review TASK-NNN`. En `automatico` devuelve `continuar`: el
 trabajo lo hace la skill (`start` implementa, `review` corrige) y sigue.
 
-Excepcion: tras la ronda 3 con cambios (el tope de rondas), `siguiente`
-devuelve `preguntar` en **cualquier** modo, y su `motivo` nombra las salidas:
-aceptar lo abierto (IDs y motivo en el `## Resultado`) y cerrar, pasarlo a una
-tarea nueva, o corregir y abrir otra ronda con `taskctl review TASK-NNN
---ronda-extra`. Ese flag solo se pasa si la persona dice que si; sin el,
-`review` no abre la ronda 4.
+Excepcion: si la ultima ronda permitida pide cambios (el tope de rondas,
+`tope_rondas` de la config de la rama base, 2 por defecto), `siguiente`
+devuelve `preguntar` en **cualquier** modo, con tres `salidas`: `cerrar`
+(lo abierto, `aceptado` con IDs y motivo en el `## Resultado`),
+`ronda-extra` (anotar `- Ronda N: <quien y por que>` bajo `## Rondas extra`
+en `tarea.md` y `taskctl review TASK-NNN --ronda-extra`) y
+`volver-a-diseno` (lo abierto, en una tarea nueva). Elige la persona; sin la
+linea, `review` no abre la ronda.
 
 En `automatico`, `siguiente` solo pregunta en sus guardas: aprobar una tarea
 sin modo congelado, cerrar hotfix o release, cerrar cuando lo que se
 mergearia no coincide con lo revisado (codigo posterior al `Commit revisado`
-de la peticion, informe sin rellenar), otra ronda desde la
-ronda 3, y el veredicto de la segunda opinion.
+de la peticion, informe sin rellenar), otra ronda pasado el tope
+de rondas, y el veredicto de la segunda opinion.
 
 ## Encadenar la skill siguiente (la cadena)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index 10175b5..dcd3162 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -121,11 +121,14 @@ siempre; el MENOR que no compense se marca `aceptado` con su motivo o pasa a
 una tarea nueva. `taskctl review` avisa si se abre una ronda con hallazgos
 de la anterior sin marcar `corregido` ni `aceptado`.
 
-**Tope de rondas.** Tras la ronda 3 con cambios, `siguiente` pregunta en
-cualquier modo, y `taskctl review` no abre la ronda 4 sin `--ronda-extra`,
-que solo se pasa cuando lo decide una persona. Las salidas: aceptar lo
-abierto (IDs y motivo en el `## Resultado`) y cerrar, pasarlo a una tarea
-nueva, o corregir y abrir otra ronda.
+**Tope de rondas.** La clave `tope_rondas` de la config (de 1 a 10, 2 por
+defecto; se lee de la rama base). Si la ultima ronda permitida pide
+cambios, `siguiente` pregunta en cualquier modo, tambien en automatico, con
+tres salidas: cerrar con lo que hay (lo abierto, aceptado con IDs y motivo en
+el `## Resultado`), una ronda mas o volver a diseno (lo abierto, en una tarea
+nueva). `taskctl review` no abre la ronda siguiente sin `--ronda-extra` y sin
+la decision anotada en `tarea.md` (`## Rondas extra`, linea `- Ronda N:
+<quien y por que>`); cada ronda extra vuelve a preguntar y pide su linea.
 
 ## El informe
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 4f976f3..97b8dd7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -45,7 +45,9 @@ import {
   rondaYRevisorDeInforme,
   siguienteRonda,
 } from '../fs/rondas.js';
-import { TOPE_RONDAS } from '../core/flujo.js';
+import { SECCION_RONDAS_EXTRA, lineaRondaExtra } from '../core/flujo.js';
+import { configDeRef } from '../fs/config-de-ref.js';
+import { rondaExtraDecidida } from '../core/rondas-extra.js';
 import {
   alcanceRondaSiguiente,
   commitRevisadoDe,
@@ -725,13 +727,30 @@ async function runReview(
   // llamar a review sin pasar por siguiente abria rondas sin limite (una tarea
   // llego a 14). Pasado el tope, otra ronda solo con --ronda-extra, que la
   // skill pasa unicamente cuando una persona lo decide. Antes de tocar nada.
-  if (previa !== null && previa.ronda >= TOPE_RONDAS && !rondaExtra) {
-    throw new ReviewCommandError(
-      `[ERROR] ${id}: la ronda ${String(previa.ronda)} ya es el tope de rondas (${String(TOPE_RONDAS)}). ` +
-        'Lo decide una persona: aceptar lo que queda abierto (sus IDs y el motivo en el Resultado) y ' +
-        'cerrar, pasarlo a una tarea nueva, o corregir y abrir otra ronda con ' +
-        `"taskctl review ${id} --ronda-extra".`
-    );
+  // TASK-127: el tope sale de `tope_rondas` en la config de la rama base (la
+  // rama de la tarea no puede subirselo), y cada ronda extra exige que conste
+  // en tarea.md la decision de una persona: el flag solo ya no basta.
+  if (previa !== null) {
+    const tope = configDeRef(resolverConfig(deps.repoCwd).rama_base, deps.repoCwd).tope_rondas;
+    if (previa.ronda >= tope) {
+      const nueva = previa.ronda + 1;
+      if (!rondaExtra) {
+        throw new ReviewCommandError(
+          `[ERROR] ${id}: la ronda ${String(previa.ronda)} ya llego al tope de rondas (${String(tope)}). ` +
+            'Lo decide una persona: cerrar con lo que hay (lo abierto, aceptado con sus IDs y el motivo en el ' +
+            'Resultado), volver a diseno (lo abierto, en una tarea nueva) o una ronda mas: anotar en tarea.md, ' +
+            `seccion "${SECCION_RONDAS_EXTRA}", la linea "${lineaRondaExtra(nueva)}" y ejecutar ` +
+            `"taskctl review ${id} --ronda-extra".`
+        );
+      }
+      if (!rondaExtraDecidida(initial!.body, nueva)) {
+        throw new ReviewCommandError(
+          `[ERROR] ${id}: --ronda-extra pasado el tope de rondas (${String(tope)}) exige que conste la decision ` +
+            `de una persona en tarea.md: seccion "${SECCION_RONDAS_EXTRA}" con la linea ` +
+            `"${lineaRondaExtra(nueva)}". No se ha tocado nada.`
+        );
+      }
+    }
   }
   const tipo = initial!.task.tipo;
   const rama = initial!.task.rama;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index b586502..4c76a8d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -17,6 +17,7 @@ import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { readFile } from 'node:fs/promises';
 import { readTareaFile } from '../fs/task-store.js';
 import { parseTareaFile } from '../core/tarea-file.js';
+import { configDeRef } from '../fs/config-de-ref.js';
 import { resolverConfig, type CierrePorDefecto, type ModoFlujo } from '../core/config.js';
 import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
 import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
@@ -241,6 +242,8 @@ export async function runSiguienteCommand(
     veredictoCodex: veredictoDe(codex),
     modoCongelado: modoCongelado(body) !== null,
     rondaRevision,
+    // TASK-127: de la rama base; la rama de la tarea no puede subirse el tope.
+    ...(task.estado === 'en-revision' ? { topeRondas: configDeRef(config.rama_base, deps.repoCwd).tope_rondas } : {}),
     informeEnCommitPropio: enCommitPropio,
     ...(task.estado === 'en-revision' && veredicto === 'aprobada'
       ? {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index a31e695..159af70 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -28,6 +28,7 @@
  * | rutas_documentacion          | [] (sin efecto)   | finish-verificacion.ts (TASK-100), hooks/guardia-merge.ts (TASK-101) |
  * | comando_verificacion_documentacion | null        | finish-verificacion.ts (TASK-100), guardia-merge.ts (TASK-101) |
  * | documento_estado             | null (no se vigila) | commands/doctor.ts (TASK-124) |
+ * | tope_rondas                  | 2                 | core/flujo.ts (siguiente), commands/review.ts (TASK-127) |
  * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096); la decision la aplican fs/decision-documentacion.ts, finish-verificacion.ts, freno-stop.ts, review.ts y guardia-merge.ts (TASK-105..108); doctor.ts avisa (TASK-109) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
@@ -256,6 +257,12 @@ export interface TaskcodeConfig {
    * tareas terminadas.
    */
   documento_estado: string | null;
+  /**
+   * TASK-127: rondas de revision que se abren sin preguntar (1 a 10). En la
+   * ultima, si pide cambios, decide una persona: cerrar con lo que hay, una
+   * ronda mas (anotada en `tarea.md`) o redisenar lo abierto en otra tarea.
+   */
+  tope_rondas: number;
 }
 
 export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
@@ -307,6 +314,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   comando_verificacion_documentacion: null,
   rutas_verificacion_parcial: Object.freeze([]) as readonly string[],
   documento_estado: null,
+  tope_rondas: 2,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -335,6 +343,7 @@ export const CLAVES_CONFIG = [
   'comando_verificacion_documentacion',
   'rutas_verificacion_parcial',
   'documento_estado',
+  'tope_rondas',
 ] as const;
 
 /**
@@ -633,6 +642,9 @@ export function parsearConfigConAvisos(
       case 'documento_estado':
         config.documento_estado = validarDocumentoEstado(donde, par.valor);
         break;
+      case 'tope_rondas':
+        config.tope_rondas = validarTopeRondas(donde, par.valor);
+        break;
       case 'umbral_cobertura':
         config.umbral_cobertura = validarUmbralCobertura(donde, par.valor);
         break;
@@ -1205,6 +1217,22 @@ function validarEnteroPositivo(
   return valor;
 }
 
+/** TASK-127: entero de 1 a 10. Mas de 10 rondas es no tener tope. */
+export const TOPE_RONDAS_MAXIMO = 10;
+
+function validarTopeRondas(donde: string, valor: unknown): number {
+  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1 || valor > TOPE_RONDAS_MAXIMO) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "tope_rondas" debe ser un numero entero de 1 a ${String(TOPE_RONDAS_MAXIMO)}, ` +
+        `y es ${describirValor(valor)}.
+` +
+        `        Por defecto es ${String(CONFIG_DEFAULTS.tope_rondas)}: las rondas de revision que se abren sin ` +
+        'preguntar; en la ultima, si pide cambios, decide una persona.'
+    );
+  }
+  return valor;
+}
+
 /** Como se nombra un valor rechazado en un mensaje de error. */
 function describirValor(valor: unknown): string {
   if (valor === null) return 'un valor vacio';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index b067982..c9b7337 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -89,10 +89,18 @@ export interface ContextoFlujo {
    * tests): lo que `verificar-menores` aceptara.
    */
   correccionSinVerificar?: boolean;
+  /**
+   * TASK-127: tope de rondas (`tope_rondas` de la config de la rama base).
+   * Ausente = TOPE_RONDAS_POR_DEFECTO.
+   */
+  topeRondas?: number;
 }
 
-/** Tope de rondas de revision: desde esta, otra ronda la decide una persona. */
-export const TOPE_RONDAS = 3;
+/**
+ * Tope de rondas de revision por defecto (TASK-127; antes 3 fijo): en la
+ * ultima, si pide cambios, otra ronda la decide una persona.
+ */
+export const TOPE_RONDAS_POR_DEFECTO = 2;
 
 export interface SiguientePaso {
   fase: FaseSiguiente;
@@ -113,7 +121,7 @@ export interface SiguientePaso {
 }
 
 export interface SalidaPregunta {
-  opcion: 'trocear' | 'aprobar-entera';
+  opcion: 'trocear' | 'aprobar-entera' | 'cerrar' | 'ronda-extra' | 'volver-a-diseno';
   comando: string;
   descripcion: string;
 }
@@ -137,6 +145,45 @@ export function salidasReglaUnaHora(id: string): SalidaPregunta[] {
   ];
 }
 
+/** Seccion de `tarea.md` donde consta cada ronda extra que decide una persona (TASK-127). */
+export const SECCION_RONDAS_EXTRA = '## Rondas extra';
+
+/** La linea que pide `review --ronda-extra` para abrir la ronda `ronda`. */
+export function lineaRondaExtra(ronda: number): string {
+  return `- Ronda ${String(ronda)}: <quien lo decide y por que>`;
+}
+
+/**
+ * TASK-127: las tres salidas del tope de rondas. Ninguna la elige el agente:
+ * se pregunta en todos los modos, tambien en automatico.
+ */
+export function salidasTopeRondas(id: string, rondaActual: number): SalidaPregunta[] {
+  const siguiente = rondaActual + 1;
+  return [
+    {
+      opcion: 'cerrar',
+      comando: `taskctl veredicto ${id} aprobada-con-correcciones`,
+      descripcion:
+        'cerrar con lo que hay: marcar como aceptado lo que queda abierto, con sus IDs y el motivo en el ' +
+        'Resultado, y despues el veredicto',
+    },
+    {
+      opcion: 'ronda-extra',
+      comando: `taskctl review ${id} --ronda-extra`,
+      descripcion:
+        `una ronda mas: corregir, commitear y anotar en tarea.md, en la seccion "${SECCION_RONDAS_EXTRA}", ` +
+        `la linea "${lineaRondaExtra(siguiente)}"; cada ronda extra vuelve a preguntar`,
+    },
+    {
+      opcion: 'volver-a-diseno',
+      comando: 'taskctl new',
+      descripcion:
+        'redisenar lo que queda abierto en una tarea nueva, enlazada desde el Resultado de esta, y cerrar ' +
+        'esta con lo que hay',
+    },
+  ];
+}
+
 /**
  * Fases que abren una fase NUEVA del ciclo: en semiautomatico se pregunta
  * antes de entrar. Las demas (veredicto, la primera codex-review, otra ronda
@@ -234,7 +281,8 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
     case 'en-revision':
       switch (ctx.veredicto) {
         case 'cambios-solicitados':
-          if (ctx.rondaRevision >= TOPE_RONDAS) {
+          const tope = ctx.topeRondas ?? TOPE_RONDAS_POR_DEFECTO;
+          if (ctx.rondaRevision >= tope) {
             // TASK-095: en el tope se pregunta en CUALQUIER modo, tambien en
             // manual y semiautomatico (antes se detenia sin preguntar: IMP-3 de
             // TASK-058, IMP-2 de TASK-059). Detenerse sin decir que decidir
@@ -242,16 +290,18 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
             // tarea llego a 14 rondas. La pregunta nombra las salidas.
             // El comando NO lleva --ronda-extra (MEN-6 de la revision): quien lo
             // ejecute sin leer la accion se encuentra con review rechazando la
-            // ronda, no con el control humano saltado. El flag va en el motivo.
+            // ronda, no con el control humano saltado. El flag va en las salidas.
+            // TASK-127: tope configurable y tres salidas explicitas.
             return {
               fase: 'review',
               comando: `taskctl review ${task.id}`,
               accion: 'preguntar',
               motivo:
-                `la ronda ${String(ctx.rondaRevision)} tambien pidio cambios: tope de rondas alcanzado. ` +
-                'Lo decide una persona: aceptar lo que queda abierto (con sus IDs y el motivo en el ' +
-                'Resultado) y cerrar, pasarlo a una tarea nueva, o corregir y abrir otra ronda con ' +
-                `"taskctl review ${task.id} --ronda-extra"`,
+                `la ronda ${String(ctx.rondaRevision)} pidio cambios y es el tope de rondas (${String(tope)}). ` +
+                'Lo decide una persona: cerrar con lo que hay (lo abierto, aceptado con sus IDs y el motivo ' +
+                'en el Resultado), una ronda mas (anotada en tarea.md y con ' +
+                `"taskctl review ${task.id} --ronda-extra") o volver a diseno (lo abierto, en una tarea nueva)`,
+              salidas: salidasTopeRondas(task.id, ctx.rondaRevision),
             };
           }
           return paso(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts
new file mode 100644
index 0000000..19bf9a1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts
@@ -0,0 +1,36 @@
+/**
+ * TASK-127: la decision de una persona de abrir una ronda de revision pasado
+ * el tope. Modulo puro: recibe el cuerpo de `tarea.md`, no toca disco ni Git.
+ *
+ * Cada ronda extra necesita su propia linea en la seccion `## Rondas extra`:
+ *
+ *     ## Rondas extra
+ *     - Ronda 3: Carlos, el IMP-2 necesita otra mirada tras el cambio de API
+ *
+ * Asi `--ronda-extra` no se reutiliza: la ronda 4 vuelve a exigir su linea, y
+ * la pregunta del tope se repite en cada ronda extra.
+ */
+import { SECCION_RONDAS_EXTRA } from './flujo.js';
+
+/** Lo que `lineaRondaExtra` deja de ejemplo: copiado tal cual no es una decision. */
+const MARCADOR = /^<[^>]*>$/;
+
+/** ¿Consta en `body` la decision de abrir la ronda `ronda` (linea con texto)? */
+export function rondaExtraDecidida(body: string, ronda: number): boolean {
+  return seccionRondasExtra(body).some((linea) => {
+    const m = /^-\s*Ronda\s+(\d+)\s*:\s*(.*)$/i.exec(linea.trim());
+    if (m === null || Number(m[1]) !== ronda) return false;
+    const texto = (m[2] ?? '').trim();
+    return texto !== '' && !MARCADOR.test(texto);
+  });
+}
+
+/** Lineas de la seccion `## Rondas extra` (hasta el siguiente encabezado de nivel 2 o menor). */
+function seccionRondasExtra(body: string): string[] {
+  const lineas = body.split(/\r?\n/);
+  const inicio = lineas.findIndex((l) => l.trim() === SECCION_RONDAS_EXTRA);
+  if (inicio === -1) return [];
+  const resto = lineas.slice(inicio + 1);
+  const fin = resto.findIndex((l) => /^#{1,2}\s/.test(l));
+  return fin === -1 ? resto : resto.slice(0, fin);
+}
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-127/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-127/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-127/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-127/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-127/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-127/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-127/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 29 +++++++++++++++++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                                  |  3 +++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 18 ++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                          | 55 +++++++++++++++++++++++++++++++++++++++++++++++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/rondas-extra.js                                   | 35 +++++++++++++++++++++++++++++++++++
 12 files changed, 128 insertions(+), 15 deletions(-)
````

## Tests del diff (5 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-rondas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/config-tope-rondas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/rondas-extra.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-rondas.test.ts | 42 ++++++++++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts    |  8 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/config-tope-rondas.test.ts    | 36 ++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/rondas-extra.test.ts          | 39 +++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts             | 46 +++++++++++++++++++++++++++++++++++++++++++---
 5 files changed, 166 insertions(+), 5 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 204.8 s
- Commit verificado: d99b84f0efa1ee186da680590acdda0dfb162f99
- Huella: 54183963311a4da9a9797f40878452aa80b3e82b
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 131973 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (1.2397ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.9221ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.9599ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.5604ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.1509ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.5988ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.2687ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.5348ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.8407ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3597ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.2691ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.5503ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.307ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.6173ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (43.2161ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.2221ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (1.0517ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (4.2201ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.799ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.275ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.2644ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2788ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2591ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2254ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2228ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2552ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.2158ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1921ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.2068ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1831ms)
✔ resolverAsignado: recorta los tres escalones (0.1929ms)
ℹ tests 867
ℹ suites 0
ℹ pass 867
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 190954.29
[verificar-impacto] node --test termino con 0 en 191.1 s.
````
