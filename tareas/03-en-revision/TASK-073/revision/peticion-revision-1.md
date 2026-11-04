# Peticion de revision — TASK-073 (ronda 1)

- Tarea: TASK-073 — Tests held-out por tarea
- Rama revisada: feature/task-073-tests-held-out-por-tarea
- Rama base: develop
- Commit revisado (HEAD): d6a0239b16ad16636c9ee70c99051f97af620da8
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: opus)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-073 (criterios de aceptacion y plan)

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
d6a0239 feat(TASK-073): tests held-out por tarea en finish (comando_heldout)
68ece8c chore(TASK-073): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index fe2e5fc..ee886a6 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -12,6 +12,16 @@
 - TASK-066 (feature) — Doctor-deploy A: catalogo generico y comprobaciones deterministas (2026-10-27)
 - TASK-067 (feature) — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release (2026-10-27)
 
+Tests held-out por tarea (TASK-073, primera parte).
+
+- Clave nueva `comando_heldout` en `.taskcode/config.yml`. Los held-out los escribe la persona
+  en `aceptacion/` de la tarea y los commitea en la rama base durante el diseno.
+- **`taskctl finish`** los ejecuta tras la verificacion (`HELDOUT_DIR` = la carpeta) y aborta
+  si fallan, mostrando solo comando, codigo y duracion; si la rama los cambio respecto a la base;
+  o si hay held-out y no `comando_heldout`. `--sin-verificacion` no los salta.
+- La peticion de revision excluye siempre `aceptacion/`. El hook que impide leerlos llega con
+  TASK-078.
+
 Puerta de verificacion en finish y guardian de merges (TASK-072).
 
 - **Cambio de comportamiento**: con `comando_verificacion` declarado, `taskctl finish` lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 7239108..414806f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -645,6 +645,36 @@ reutiliza un verde guardado, porque la huella no ve los ficheros ignorados.
 - `finish` tarda lo que tarde la suite: si lo lanza un agente, que su
   herramienta de shell no lo corte antes.
 
+#### Tests held-out (`aceptacion/`)
+
+Tests de aceptación que escribe la **persona** a partir de los criterios y que
+el agente que implementa no debe ver. Van en la carpeta `aceptacion/` de la
+tarea, se commitean **en la rama base durante el diseño, antes de `start`** (la
+rama nace con ellos y no aparecen en su diff), y se ejecutan con:
+
+```yaml
+comando_heldout: "npm run aceptacion"   # recibe la carpeta en HELDOUT_DIR
+```
+
+`taskctl finish` los ejecuta justo después de la puerta de verificación, en
+los mismos caminos (no en el segundo `finish --merge-request` ni en el camino
+idempotente), con el cwd en la raíz del repo, `HELDOUT_DIR` = ruta absoluta de
+la carpeta y `timeout_verificacion` como tope. Aborta, sin mergear:
+
+- si no salen en verde, mostrando **solo** comando, código y duración: la salida
+  de un test suele llevar sus aserciones, y la lee el agente;
+- si la rama los ha **editado, añadido o borrado** respecto a la rama base (se
+  compara el árbol de Git de `aceptacion/`), o los trae sin estar en la base;
+- si la tarea tiene `aceptacion/` y la config no declara `comando_heldout`;
+- si en verde dejan el árbol sucio.
+
+`--sin-verificacion` no los salta. Sin `aceptacion/` (ni en la rama ni en la
+base) no hay puerta. La petición de revisión excluye siempre
+`tareas/*/TASK-*/aceptacion/**`, aunque se cambie `excluir_de_revision`: el
+revisor no los lee. Que queden fuera de `comando_verificacion`, o el freno de
+fin de turno mostraría su salida. El hook que impide leerlos o editarlos
+mientras se implementa llega en una versión siguiente.
+
 #### Guardián de merges (hook `PreToolUse`)
 
 Antes de cada comando Bash o PowerShell del agente (sin filtro `if`: el de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 0457deb..74b87f2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -202,12 +202,13 @@ explicitamente al terminar: el freno solo bloquea una vez por turno.
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
 `taskctl finish` (lanzado desde la rama de la tarea) ejecuta la verificacion
-antes de mergear y aborta si no sale en verde; tarda lo que tarde la suite.
-Un `git merge` o un script de cierre hacia la rama de integracion o la
-principal queda bloqueado si no consta un verde del commit que entra: cierra
-siempre con `taskctl finish`, nunca mergeando a mano. Saltarse la
-verificacion (`--sin-verificacion`) lo decide la persona, no tu, y queda
-anotado en la tarea.
+antes de mergear y aborta si no sale en verde. Un `git merge` o un script de
+cierre hacia la rama de integracion o la principal queda bloqueado sin un
+verde del commit que entra: cierra siempre con `taskctl finish`. Saltarse la
+verificacion (`--sin-verificacion`) lo decide la persona, no tu.
+
+**Tests held-out (`aceptacion/`).** Son de la persona: si implementas, no los
+leas ni los edites. Detalle en [heldout.md](heldout.md).
 
 ## Cerrar una tarea
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
new file mode 100644
index 0000000..71e3e5a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
@@ -0,0 +1,33 @@
+# Tests held-out (`aceptacion/`)
+
+Son tests de aceptacion que escribe la persona a partir de los criterios de la
+tarea y que el agente que la implementa no debe ver.
+
+## Cuando y donde se escriben
+
+- En la carpeta `aceptacion/` de la tarea.
+- **En la rama base y durante el diseno, antes de `start`**: la rama de la
+  tarea nace con ellos y no aparecen en su diff. Commitealos en la rama base.
+- Se ejecutan con `comando_heldout` de `.taskcode/config.yml`, que recibe la
+  ruta absoluta de la carpeta en `HELDOUT_DIR` (cwd en la raiz del repo, tope
+  `timeout_verificacion`).
+- Deben quedar fuera de `comando_verificacion` (que el glob de tests del
+  proyecto no alcance `tareas/`): si no, el freno de fin de turno los
+  ejecutaria y mostraria su salida.
+
+## Si implementas la tarea
+
+No los leas ni los edites. `finish` aborta, sin mergear:
+
+- si no salen en verde (solo muestra comando, codigo y duracion);
+- si la rama los ha editado, anadido o borrado respecto a la rama base;
+- si la tarea los tiene y falta `comando_heldout`.
+
+Arregla el codigo, nunca los tests. Si crees que un held-out esta mal, dilo:
+cambiarlo lo hace la persona en la rama base. `--sin-verificacion` no los salta.
+
+## Revision
+
+El revisor por pares no los lee: nunca van en el diff de la peticion de
+revision, aunque se cambie `excluir_de_revision`, y solo cuenta su resultado
+en `finish`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
new file mode 100644
index 0000000..225d0ae
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
@@ -0,0 +1,122 @@
+/**
+ * Puerta de los tests held-out en `taskctl finish` — TASK-073. Corre justo
+ * despues de la puerta de verificacion y en los mismos caminos (abrir el MR o
+ * ejecutar el script de Git-Flow), nunca en el segundo `finish` del MR ni en
+ * el camino idempotente.
+ *
+ * Decisiones de Carlos en el plan:
+ * - Los held-out se commitean en la rama base durante el diseño, antes de
+ *   `start`: la rama nace con ellos.
+ * - Huella: el contenido de `aceptacion/` en la rama tiene que ser identico al
+ *   de la rama base (mismo arbol de Git). Si la rama los añade, edita o borra,
+ *   `finish` aborta: el agente que implementa no puede ajustarlos a su codigo.
+ * - Con held-out y sin `comando_heldout`, aborta: no se mergea creyendo que
+ *   hubo freno.
+ * - En rojo solo se muestran comando, codigo y duracion, nunca la salida: la
+ *   lee el agente, y la salida de un test suele llevar sus aserciones.
+ *
+ * `--sin-verificacion` no la salta: los held-out son de la persona.
+ */
+import path from 'node:path';
+import { resolverConfig } from '../core/config.js';
+import { carpetasHeldout, CARPETA_HELDOUT, VARIABLE_HELDOUT } from '../core/heldout.js';
+import { describirResultado } from '../core/informe-verificacion.js';
+import { currentBranch, isWorkspaceClean, runGit } from '../fs/git.js';
+import { ejecutarVerificacion } from '../fs/verificacion.js';
+import { FinishCommandError } from './finish-opciones.js';
+
+export interface PuertaHeldoutOpts {
+  id: string;
+  rama: string;
+  /** Rama base donde la persona commiteo los held-out (`rama_base`). */
+  ramaBase: string;
+  cwd: string;
+  /** Solo para tests: sustituye al timeout (en ms). */
+  timeoutMs?: number;
+}
+
+export type ResultadoHeldout = { tipo: 'sin-heldout' } | { tipo: 'verde'; carpeta: string; duracionMs: number };
+
+function rutasDe(ref: string, cwd: string): string[] {
+  const salida = runGit(['ls-tree', '-r', '--name-only', ref, '--', 'tareas'], cwd);
+  return salida === '' ? [] : salida.split('\n');
+}
+
+function arbol(ref: string, carpeta: string, cwd: string): string {
+  return runGit(['rev-parse', `${ref}:${carpeta}`], cwd);
+}
+
+/** Ejecuta la puerta. Lanza FinishCommandError si no se puede mergear; no escribe nada. */
+export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
+  const enRama = carpetasHeldout(rutasDe('HEAD', o.cwd), o.id);
+  const enBase = carpetasHeldout(rutasDe(o.ramaBase, o.cwd), o.id);
+  if (enRama.length === 0 && enBase.length === 0) return { tipo: 'sin-heldout' };
+
+  const cierre = 'No se ha mergeado nada.';
+  if (enBase.length === 0) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la rama trae tests held-out (${enRama.join(', ')}) que no estan en "${o.ramaBase}". ` +
+        `Los held-out los escribe la persona y los commitea en "${o.ramaBase}" durante el diseño, antes de ` +
+        `start; la rama de la tarea no puede añadirlos. ${cierre}`
+    );
+  }
+  if (enBase.length > 1) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: "${o.ramaBase}" tiene mas de una carpeta ${CARPETA_HELDOUT}/ para esta tarea ` +
+        `(${enBase.join(', ')}): deja una sola y reintenta. ${cierre}`
+    );
+  }
+  const base = enBase[0] as string;
+  const arbolBase = arbol(o.ramaBase, base, o.cwd);
+  const distintas = enRama.filter((c) => arbol('HEAD', c, o.cwd) !== arbolBase);
+  if (enRama.length === 0 || distintas.length > 0) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: los tests held-out de la rama no coinciden con los de "${o.ramaBase}" ` +
+        `(${base}): la rama los ha editado, añadido o borrado. Restauralos desde "${o.ramaBase}" ` +
+        `(git checkout ${o.ramaBase} -- ${base}) y commitea; si hay que cambiarlos, lo hace la persona en ` +
+        `"${o.ramaBase}". ${cierre}`
+    );
+  }
+
+  const config = resolverConfig(o.cwd);
+  const comando = config.comando_heldout;
+  if (comando === null) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la tarea tiene tests held-out (${base}) y .taskcode/config.yml no declara ` +
+        `comando_heldout, asi que no se pueden ejecutar. Declaralo (p. ej. comando_heldout: "node --test ` +
+        `$${VARIABLE_HELDOUT}") y reintenta. ${cierre}`
+    );
+  }
+  const actual = currentBranch(o.cwd);
+  if (actual !== o.rama) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: los tests held-out se ejecutan sobre el arbol de la rama de la tarea, y la rama ` +
+        `activa es "${actual === '' ? 'HEAD desacoplado' : actual}". Cambiate a "${o.rama}" y reintenta. ${cierre}`
+    );
+  }
+
+  const carpeta = path.resolve(o.cwd, enRama[0] as string);
+  const r = ejecutarVerificacion(o.cwd, comando, config.timeout_verificacion, {
+    env: { ...process.env, [VARIABLE_HELDOUT]: carpeta },
+    ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
+  });
+  if (r.estado !== 'verde') {
+    // Sin la salida, a proposito (decision D4 del plan).
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: los tests held-out no estan en verde; no se mergea. ${cierre}\n` +
+        `  Comando:   ${comando}\n` +
+        `  Resultado: ${describirResultado(r)}\n` +
+        `  Duracion:  ${(r.duracionMs / 1000).toFixed(1)} s\n` +
+        'La salida no se muestra para no revelar los tests: la persona puede ejecutar el comando a mano ' +
+        `(con ${VARIABLE_HELDOUT}=${carpeta}). Arregla el codigo, no los tests.`
+    );
+  }
+  if (!isWorkspaceClean(o.cwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: los tests held-out salieron en verde pero han dejado cambios en el arbol de trabajo ` +
+        `(mira git status). El merge necesita el workspace limpio: que escriban en rutas ignoradas, y reintenta. ` +
+        cierre
+    );
+  }
+  return { tipo: 'verde', carpeta, duracionMs: r.duracionMs };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 664f62b..62651b6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -85,6 +85,7 @@ import {
 } from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { extraerSinVerificacion, puertaVerificacion } from './finish-verificacion.js';
+import { puertaHeldout } from './finish-heldout.js';
 import { runBoardCommand, boardFilePath } from './board.js';
 import { renderBoardMarkdown } from '../core/board-format.js';
 import { REVISION_DIRNAME } from './review.js';
@@ -440,8 +441,9 @@ export async function runFinishCommand(
 
   // TASK-072: la puerta de verificacion, justo antes del primer efecto y solo
   // en los caminos que van a integrar algo (abrir el MR o ejecutar el script).
-  const puerta = () =>
-    puertaVerificacion({
+  // TASK-073: y detras, la de los tests held-out (que --sin-verificacion no salta).
+  const puerta = async () => {
+    const r = await puertaVerificacion({
       id,
       rama,
       tareasRoot,
@@ -452,6 +454,15 @@ export async function runFinishCommand(
       ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
       ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
     });
+    puertaHeldout({
+      id,
+      rama,
+      ramaBase: ramaIntegracion,
+      cwd: deps.repoCwd,
+      ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+    });
+    return r;
+  };
 
   if (mrCtx !== null && mrCtx.estado.tipo === 'ninguno') {
     initial = (await puerta()).tarea;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 7b08c22..86f9665 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -61,6 +61,7 @@ import {
 } from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
+import { EXCLUIR_HELDOUT } from '../core/heldout.js';
 
 export class ReviewCommandError extends Error {}
 
@@ -474,7 +475,8 @@ export async function runReviewCommand(
   const commits = logOneline(desde, 'HEAD', deps.repoCwd);
   // TASK-034: lo generado (dist/, lockfiles) y la propia carpeta de
   // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
-  const excluir = resolverConfig(deps.repoCwd).excluir_de_revision;
+  // TASK-073: los tests held-out nunca se embeben, se configure lo que se configure.
+  const excluir = [...new Set([...resolverConfig(deps.repoCwd).excluir_de_revision, EXCLUIR_HELDOUT])];
   const paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
   const diff = paraRevision.diff;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index e01aec7..3618c4a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -18,6 +18,7 @@
  * | url_base_remoto              | null              | commands/finish-opciones.ts (--merge-request) |
  * | comando_verificacion         | null (sin freno)  | commands/doctor.ts (y los frenos, TASK-071/072) |
  * | timeout_verificacion         | 600 (segundos)    | los frenos (TASK-071/072)  |
+ * | comando_heldout              | null (sin held-out) | commands/finish-heldout.ts (TASK-073) |
  *
  * `comando_verificacion` y `timeout_verificacion` las anadio TASK-070: declaran
  * como se verifica el proyecto (el comando de tests del repo) para que los
@@ -160,6 +161,12 @@ export interface TaskcodeConfig {
   comando_verificacion: string | null;
   /** TASK-070: segundos que se le dejan a la verificacion antes de cortarla. */
   timeout_verificacion: number;
+  /**
+   * TASK-073: comando que ejecuta los tests held-out de la tarea (carpeta
+   * `aceptacion/`), con su ruta absoluta en la variable HELDOUT_DIR. null =
+   * sin held-out. Usa `timeout_verificacion`.
+   */
+  comando_heldout: string | null;
 }
 
 export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
@@ -195,6 +202,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   url_base_remoto: null,
   comando_verificacion: null,
   timeout_verificacion: 600,
+  comando_heldout: null,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -212,6 +220,7 @@ export const CLAVES_CONFIG = [
   'url_base_remoto',
   'comando_verificacion',
   'timeout_verificacion',
+  'comando_heldout',
 ] as const;
 
 /**
@@ -472,6 +481,9 @@ export function parsearConfigConAvisos(
       case 'timeout_verificacion':
         config.timeout_verificacion = validarEnteroPositivo(donde, par.clave, par.valor);
         break;
+      case 'comando_heldout':
+        config.comando_heldout = validarComando(donde, par.clave, par.valor, 'comando_heldout: "node --test $HELDOUT_DIR"');
+        break;
     }
   }
 
@@ -628,7 +640,7 @@ function validarPatronesExclusion(donde: string, valor: unknown): readonly strin
 /** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
 function validarComando(
   donde: string,
-  clave: 'comando_sincronizacion' | 'comando_verificacion',
+  clave: 'comando_sincronizacion' | 'comando_verificacion' | 'comando_heldout',
   valor: unknown,
   ejemplo: string
 ): string {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
new file mode 100644
index 0000000..eb1909e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
@@ -0,0 +1,38 @@
+/**
+ * Tests held-out de una tarea — TASK-073. Los escribe la persona a partir de
+ * los criterios, en la carpeta `aceptacion/` de la tarea, y los commitea en la
+ * rama base durante el diseño, antes de `start`: la rama nace con ellos y no
+ * aparecen en su diff. El agente que implementa no debe leerlos ni editarlos
+ * (el hook que lo impide llega con TASK-078); `finish` los ejecuta con
+ * `comando_heldout` y comprueba que la rama no los ha tocado.
+ *
+ * Puro: nombres, patrones y la busqueda de la carpeta en una lista de rutas.
+ */
+
+/** Nombre de la carpeta de held-out dentro de la carpeta de una tarea. */
+export const CARPETA_HELDOUT = 'aceptacion';
+
+/** Variable de entorno con la ruta absoluta de la carpeta, para `comando_heldout`. */
+export const VARIABLE_HELDOUT = 'HELDOUT_DIR';
+
+/**
+ * Patron `git :(glob)` que la peticion de revision excluye SIEMPRE, aunque el
+ * proyecto cambie `excluir_de_revision`: el diff no puede llevar los held-out.
+ */
+export const EXCLUIR_HELDOUT = `tareas/*/TASK-*/${CARPETA_HELDOUT}/**`;
+
+/**
+ * Carpetas `tareas/<estado>/<id>/aceptacion` que aparecen en una lista de
+ * rutas de fichero relativas a la raiz (las de `git ls-tree -r --name-only`),
+ * sin repetir y en orden. Una tarea puede tener la suya en mas de un estado
+ * si la rama base la recibio despues de que la rama moviera la tarea.
+ */
+export function carpetasHeldout(rutas: readonly string[], id: string): string[] {
+  const prefijo = new RegExp(`^(tareas/[^/]+/${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${CARPETA_HELDOUT})/`);
+  const vistas = new Set<string>();
+  for (const r of rutas) {
+    const m = prefijo.exec(r);
+    if (m !== null) vistas.add(m[1] as string);
+  }
+  return [...vistas];
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
index c0993bf..8cca1cc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
@@ -76,6 +76,8 @@ export interface OpcionesEjecucion {
   unirSalida?: boolean;
   /** Bytes que se leen del final de la salida (por defecto 64 KiB). Nunca se lee entera. */
   bytesCola?: number;
+  /** Entorno del comando (por defecto el del proceso). TASK-073: HELDOUT_DIR. */
+  env?: NodeJS.ProcessEnv;
 }
 
 export interface SalidaEjecucion {
@@ -133,6 +135,7 @@ export function ejecutarAcotado(
       // Red de seguridad por si el propio envoltorio se colgara.
       timeout: timeoutMs + 15000,
       windowsHide: true,
+      ...(opciones.env === undefined ? {} : { env: opciones.env }),
     });
     const duracionMs = Date.now() - inicio;
     cerrar();
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index 46fd910..2e5a560 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -31,6 +31,8 @@ const VERSION_MEMO = 1;
 export interface OpcionesVerificacion {
   /** Solo para tests: sustituye al timeout en segundos (en ms). */
   timeoutMs?: number;
+  /** Entorno del comando (por defecto el del proceso). */
+  env?: NodeJS.ProcessEnv;
 }
 
 /** Ejecuta `comando` en `raiz` con un tope de `timeoutS` segundos. Nunca lanza. */
@@ -41,7 +43,11 @@ export function ejecutarVerificacion(
   opciones: OpcionesVerificacion = {}
 ): ResultadoVerificacion {
   const timeoutMs = opciones.timeoutMs ?? timeoutS * 1000;
-  const r = ejecutarAcotado(raiz, comando, timeoutMs, { unirSalida: true, bytesCola: BYTES_COLA_LEIDOS });
+  const r = ejecutarAcotado(raiz, comando, timeoutMs, {
+    unirSalida: true,
+    bytesCola: BYTES_COLA_LEIDOS,
+    ...(opciones.env === undefined ? {} : { env: opciones.env }),
+  });
   const base = {
     comando,
     duracionMs: r.duracionMs,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
new file mode 100644
index 0000000..b2da716
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
@@ -0,0 +1,247 @@
+/**
+ * Puerta de los tests held-out en `taskctl finish` (TASK-073). Repos Git
+ * temporales de verdad y los scripts de Git-Flow tal cual. Los held-out se
+ * commitean en develop ANTES de crear la rama de la tarea, como manda el
+ * flujo. `comando_heldout` es un lanzador de node que vive FUERA del repo: lee
+ * HELDOUT_DIR, ejecuta `prueba.cjs` de esa carpeta y deja un testigo en logs/
+ * (ignorado por .gitignore en la plantilla de finish), asi que se sabe que se
+ * ejecuto y con que carpeta.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import { carpetasHeldout, EXCLUIR_HELDOUT } from '../../src/core/heldout.js';
+import { parsearConfig } from '../../src/core/config.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+
+const LANZADOR = `
+const fs = require('node:fs');
+const path = require('node:path');
+const dir = process.env.HELDOUT_DIR;
+fs.mkdirSync('logs', { recursive: true });
+fs.appendFileSync(path.join('logs', 'heldout.txt'), String(dir) + '\\n');
+require(path.join(dir, 'prueba.cjs'));
+`;
+
+/** El held-out: pasa o falla segun un fichero de desenlace fuera del repo, e imprime una asercion canario. */
+function prueba(desenlace: string): string {
+  return `
+const d = require('node:fs').readFileSync(${JSON.stringify(desenlace)}, 'utf8').trim();
+console.log('CANARIO-ASERCION: esperaba 42');
+if (d !== 'ok') { console.error('assert.equal(resultado, 42) fallo'); process.exit(1); }
+`;
+}
+
+interface Ctx {
+  repoRoot: string;
+  tareasRoot: string;
+  desenlace(d: 'ok' | 'ko'): Promise<void>;
+  /** Carpetas HELDOUT_DIR con las que se ejecuto el lanzador. */
+  ejecuciones(): string[];
+}
+
+/**
+ * Repo con config, held-out de `id` commiteados en develop (si `conHeldout`) y
+ * la tarea en revision en su rama. `config` sustituye a la config por defecto.
+ */
+async function conHeldout(
+  id: string,
+  fn: (c: Ctx) => Promise<void>,
+  opts: { conHeldout?: boolean; config?: (lanzador: string) => string } = {}
+): Promise<void> {
+  const fuera = await mkdtemp(path.join(tmpdir(), 'finish-heldout-'));
+  const lanzador = path.join(fuera, 'lanzador.cjs').replace(/\\/g, '/');
+  const desenlace = path.join(fuera, 'desenlace').replace(/\\/g, '/');
+  await writeFile(lanzador, LANZADOR, 'utf8');
+  await writeFile(desenlace, 'ok', 'utf8');
+  try {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      const config = opts.config ? opts.config(lanzador) : `comando_heldout: "node ${lanzador}"\n`;
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+      if (opts.conHeldout !== false) {
+        const dir = path.join(tareasRoot, '01-en-diseno', id, 'aceptacion');
+        await mkdir(dir, { recursive: true });
+        await writeFile(path.join(dir, 'prueba.cjs'), prueba(desenlace), 'utf8');
+      }
+      commitAll(repoRoot, 'docs: held-out escritos por la persona en el diseno');
+      const ctx: Ctx = {
+        repoRoot,
+        tareasRoot,
+        desenlace: (d) => writeFile(desenlace, d, 'utf8'),
+        ejecuciones: () => {
+          const f = path.join(repoRoot, 'logs', 'heldout.txt');
+          return existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter((l) => l !== '') : [];
+        },
+      };
+      await fn(ctx);
+    });
+  } finally {
+    await rm(fuera, { recursive: true, force: true });
+  }
+}
+
+const finish = (c: Ctx, argv: string[]) =>
+  runFinishCommand(c.tareasRoot, argv, '2026-11-04', { repoCwd: c.repoRoot, scriptsDir: SCRIPTS_DIR });
+
+const integrada = (rama: string, cwd: string) =>
+  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;
+
+test('heldout: carpetasHeldout encuentra la carpeta de la tarea en cualquier estado y nada mas', () => {
+  const rutas = [
+    'tareas/01-en-diseno/TASK-730/aceptacion/a.cjs',
+    'tareas/01-en-diseno/TASK-730/aceptacion/sub/b.cjs',
+    'tareas/03-en-revision/TASK-730/aceptacion/a.cjs',
+    'tareas/01-en-diseno/TASK-730/tarea.md',
+    'tareas/01-en-diseno/TASK-7300/aceptacion/x.cjs',
+    'tareas/01-en-diseno/TASK-731/aceptacion/x.cjs',
+    'tareas/01-en-diseno/TASK-730/aceptacionX/x.cjs',
+  ];
+  assert.deepEqual(carpetasHeldout(rutas, 'TASK-730'), [
+    'tareas/01-en-diseno/TASK-730/aceptacion',
+    'tareas/03-en-revision/TASK-730/aceptacion',
+  ]);
+  assert.deepEqual(carpetasHeldout(rutas, 'TASK-999'), []);
+  assert.equal(EXCLUIR_HELDOUT, 'tareas/*/TASK-*/aceptacion/**');
+});
+
+test('heldout: comando_heldout es una clave conocida, null por defecto y no admite vacio', () => {
+  assert.equal(parsearConfig('limite_wip: 1\n', 'c.yml').comando_heldout, null);
+  assert.equal(parsearConfig('comando_heldout: "npm run aceptacion"\n', 'c.yml').comando_heldout, 'npm run aceptacion');
+  assert.throws(() => parsearConfig('comando_heldout: ""\n', 'c.yml'), /comando_heldout/);
+});
+
+test('heldout: en verde se ejecutan con HELDOUT_DIR de la tarea y se mergea', async () => {
+  await conHeldout('TASK-730', async (c) => {
+    const task = sampleTask({ id: 'TASK-730' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    const r = await finish(c, ['TASK-730']);
+    assert.equal(r.cierre, 'terminada');
+    const ej = c.ejecuciones();
+    assert.equal(ej.length, 1);
+    assert.match(ej[0] ?? '', /[/\\]tareas[/\\]01-en-diseno[/\\]TASK-730[/\\]aceptacion$/);
+    assert.ok(integrada(task.rama, c.repoRoot));
+  });
+});
+
+test('heldout: en rojo aborta sin merge y SIN mostrar la salida de los tests', async () => {
+  await conHeldout('TASK-731', async (c) => {
+    const task = sampleTask({ id: 'TASK-731' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await c.desenlace('ko');
+    const developAntes = git(['rev-parse', 'develop'], c.repoRoot).trim();
+    await assert.rejects(
+      () => finish(c, ['TASK-731']),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match(e.message, /los tests held-out no estan en verde; no se mergea/);
+        assert.match(e.message, /Comando: {3}node /);
+        assert.match(e.message, /codigo 1|1/);
+        assert.doesNotMatch(e.message, /CANARIO-ASERCION/, 'la salida revelaria el test');
+        assert.doesNotMatch(e.message, /assert\.equal/);
+        return true;
+      }
+    );
+    assert.equal(c.ejecuciones().length, 1);
+    assert.equal(git(['rev-parse', 'develop'], c.repoRoot).trim(), developAntes);
+    assert.equal((await readTareaFile(c.tareasRoot, 'TASK-731'))?.task.estado, 'en-revision');
+  });
+});
+
+test('heldout: --sin-verificacion no salta los held-out', async () => {
+  await conHeldout('TASK-732', async (c) => {
+    const task = sampleTask({ id: 'TASK-732' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await c.desenlace('ko');
+    await assert.rejects(() => finish(c, ['TASK-732', '--sin-verificacion']), /held-out no estan en verde/);
+    assert.equal(integrada(task.rama, c.repoRoot), false);
+  });
+});
+
+test('heldout (huella): si la rama edita, borra o añade held-out, aborta sin ejecutarlos', async () => {
+  // Edita.
+  await conHeldout('TASK-733', async (c) => {
+    const task = sampleTask({ id: 'TASK-733' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await writeFile(path.join(c.tareasRoot, '01-en-diseno', 'TASK-733', 'aceptacion', 'prueba.cjs'), '// vacio\n', 'utf8');
+    commitAll(c.repoRoot, 'rebajar el test');
+    await assert.rejects(() => finish(c, ['TASK-733']), /no coinciden con los de "develop".*editado, añadido o borrado/s);
+    assert.equal(c.ejecuciones().length, 0);
+    assert.equal(integrada(task.rama, c.repoRoot), false);
+  });
+  // Borra.
+  await conHeldout('TASK-734', async (c) => {
+    const task = sampleTask({ id: 'TASK-734' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    git(['rm', '-q', '-r', 'tareas/01-en-diseno/TASK-734/aceptacion'], c.repoRoot);
+    git(['commit', '-q', '-m', 'borrar'], c.repoRoot);
+    await assert.rejects(() => finish(c, ['TASK-734']), /no coinciden con los de "develop"/);
+  });
+  // Añade un fichero mas.
+  await conHeldout('TASK-735', async (c) => {
+    const task = sampleTask({ id: 'TASK-735' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await writeFile(path.join(c.tareasRoot, '01-en-diseno', 'TASK-735', 'aceptacion', 'otro.cjs'), '1\n', 'utf8');
+    commitAll(c.repoRoot, 'anadir');
+    await assert.rejects(() => finish(c, ['TASK-735']), /no coinciden/);
+  });
+  // La rama los crea y develop no los tiene.
+  await conHeldout(
+    'TASK-736',
+    async (c) => {
+      const task = sampleTask({ id: 'TASK-736' });
+      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+      const dir = path.join(c.tareasRoot, '03-en-revision', 'TASK-736', 'aceptacion');
+      await mkdir(dir, { recursive: true });
+      await writeFile(path.join(dir, 'prueba.cjs'), '1\n', 'utf8');
+      commitAll(c.repoRoot, 'held-out propios');
+      await assert.rejects(() => finish(c, ['TASK-736']), /no estan en "develop".*no puede añadirlos/s);
+    },
+    { conHeldout: false }
+  );
+});
+
+test('heldout: con held-out y sin comando_heldout aborta (no se mergea creyendo que hubo freno)', async () => {
+  await conHeldout(
+    'TASK-737',
+    async (c) => {
+      const task = sampleTask({ id: 'TASK-737' });
+      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+      await assert.rejects(() => finish(c, ['TASK-737']), /no declara\s+comando_heldout/);
+      assert.equal(integrada(task.rama, c.repoRoot), false);
+    },
+    { config: () => 'rama_base: develop\n' }
+  );
+});
+
+test('heldout: sin carpeta aceptacion/ no hay puerta, aunque haya comando; la de otra tarea no cuenta', async () => {
+  await conHeldout(
+    'TASK-799',
+    async (c) => {
+      // develop tiene held-out de OTRA tarea, y fallarian.
+      await c.desenlace('ko');
+      const task = sampleTask({ id: 'TASK-738' });
+      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+      const r = await finish(c, ['TASK-738']);
+      assert.equal(r.cierre, 'terminada');
+      assert.equal(c.ejecuciones().length, 0);
+    }
+  );
+});
+
+test('heldout: la skill de flujo enlaza heldout.md, que explica cuando escribirlos, que el revisor no los lee y que van fuera de la verificacion', () => {
+  const dir = path.join(import.meta.dirname, '..', '..', '..', 'skills', 'task-workflow');
+  const skill = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
+  assert.match(skill, /\*\*Tests held-out \(`aceptacion\/`\)\.\*\*[\s\S]*\[heldout\.md\]\(heldout\.md\)/);
+  const ref = readFileSync(path.join(dir, 'heldout.md'), 'utf8');
+  for (const marca of [/aceptacion\//, /comando_heldout/, /HELDOUT_DIR/, /durante el\s+diseno/, /antes de `start`/, /revisor por pares no los lee/, /fuera de\s+`comando_verificacion`/, /no los leas ni los edites/i]) {
+    assert.match(ref, marca);
+  }
+  assert.doesNotMatch(ref, /TaskCode/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
index 023cdd3..e7f3f46 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
@@ -173,3 +173,16 @@ test('config (TASK-034): excluir_de_revision valida, ancla los patrones sin / y
     );
   }
 });
+
+test('review (TASK-073): los tests held-out (aceptacion/) nunca se embeben, aunque excluir_de_revision este vacio', async () => {
+  const { peticion } = await revisar(
+    {
+      'src/b.ts': 'export const b = 1;\n',
+      'tareas/02-en-curso/TASK-930/aceptacion/secreto.test.cjs': "assert('SECRETO-HELDOUT')\n",
+    },
+    'excluir_de_revision: []\n'
+  );
+  assert.match(bloqueDiff(peticion), /diff --git a\/src\/b\.ts/);
+  assert.doesNotMatch(peticion, /SECRETO-HELDOUT/, 'el contenido de un held-out no puede llegar a la peticion');
+  assert.match(peticion, /## Excluido del diff \(1 fichero\(s\)\)/);
+});
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-073/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-073/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-073/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-073/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-073/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-073/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-073/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-073/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-073/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-heldout.js                             | 91 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     | 34 +++++++++++++++++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |  4 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         |  6 ++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heldout.js                                        | 35 ++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/ejecucion-acotada.js                                |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     |  6 +++++-
 16 files changed, 166 insertions(+), 14 deletions(-)
````
