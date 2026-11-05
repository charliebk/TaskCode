# Peticion de revision — TASK-073 (ronda 2)

- Tarea: TASK-073 — Tests held-out por tarea
- Rama revisada: feature/task-073-tests-held-out-por-tarea
- Rama base: develop
- Commit revisado (HEAD): 477269866fc8a21d2b8574fec2c8b3fa3105ccfa
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: opus)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-073 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde d6a0239b16ad16636c9ee70c99051f97af620da8 (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | src/commands/finish-heldout.ts (huella y su remedio) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | src/commands/finish-heldout.ts (guardas de arbol sucio y rama activa sin test) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/commands/finish-heldout.ts (hotfix compara con develop) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/commands/finish-heldout.ts (`comando_heldout` leido de la rama) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/core/heldout.ts (`Aceptacion/` con mayuscula queda fuera) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/core/config.ts (`timeout_verificacion` sin `comando_verificacion` aborta) | informe-revision-1.md |

## Commits a revisar (git log d6a0239b16ad16636c9ee70c99051f97af620da8..HEAD)

````
4772698 fix(TASK-073): correcciones de la revision ronda 1 (IMP-1, IMP-2, MEN-1..4)
10d0612 chore(TASK-073): veredicto ronda 1 (cambios-solicitados)
0dde496 chore(TASK-073): coste revision +5355474 tokens (1 agente)
7951cfc docs(TASK-073): informe de revision ronda 1
34d6d7f chore(TASK-073): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff d6a0239b16ad16636c9ee70c99051f97af620da8..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 414806f..d2c20c4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -664,11 +664,17 @@ la carpeta y `timeout_verificacion` como tope. Aborta, sin mergear:
 - si no salen en verde, mostrando **solo** comando, código y duración: la salida
   de un test suele llevar sus aserciones, y la lee el agente;
 - si la rama los ha **editado, añadido o borrado** respecto a la rama base (se
-  compara el árbol de Git de `aceptacion/`), o los trae sin estar en la base;
+  compara el árbol de Git de `aceptacion/`, esté en el estado que esté), o los
+  trae sin estar en la base; el mensaje da las órdenes para restaurarlos en su
+  ruta. Si quien los cambió fue la base (la persona los corrigió después de
+  `start`), pide integrarla en la rama (`git merge <base>`);
+- si hay una carpeta `Aceptacion/` con otras mayúsculas;
 - si la tarea tiene `aceptacion/` y la config no declara `comando_heldout`;
 - si en verde dejan el árbol sucio.
 
-`--sin-verificacion` no los salta. Sin `aceptacion/` (ni en la rama ni en la
+La rama base es la de integración, salvo en un hotfix, que nace de la principal.
+`comando_heldout` y su timeout se leen de la config **de la rama base**: la rama de
+la tarea no puede cambiar cómo se ejecutan. `--sin-verificacion` no los salta. Sin `aceptacion/` (ni en la rama ni en la
 base) no hay puerta. La petición de revisión excluye siempre
 `tareas/*/TASK-*/aceptacion/**`, aunque se cambie `excluir_de_revision`: el
 revisor no los lee. Que queden fuera de `comando_verificacion`, o el freno de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
index 71e3e5a..771bc2e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
@@ -5,10 +5,14 @@ tarea y que el agente que la implementa no debe ver.
 
 ## Cuando y donde se escriben
 
-- En la carpeta `aceptacion/` de la tarea.
+- En la carpeta `aceptacion/` de la tarea (en minusculas: `Aceptacion/` aborta).
 - **En la rama base y durante el diseno, antes de `start`**: la rama de la
-  tarea nace con ellos y no aparecen en su diff. Commitealos en la rama base.
-- Se ejecutan con `comando_heldout` de `.taskcode/config.yml`, que recibe la
+  tarea nace con ellos y no aparecen en su diff. Commitealos en la rama base
+  (la principal en un hotfix, que nace de ella).
+- Si la persona los corrige despues de `start`, `finish` pide integrar la rama
+  base en la de la tarea (`git merge <base>`).
+- Se ejecutan con `comando_heldout` de `.taskcode/config.yml` de la rama base
+  (la rama de la tarea no puede cambiarlo), que recibe la
   ruta absoluta de la carpeta en `HELDOUT_DIR` (cwd en la raiz del repo, tope
   `timeout_verificacion`).
 - Deben quedar fuera de `comando_verificacion` (que el glob de tests del
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
index 225d0ae..6abff2a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
@@ -6,10 +6,16 @@
  *
  * Decisiones de Carlos en el plan:
  * - Los held-out se commitean en la rama base durante el diseño, antes de
- *   `start`: la rama nace con ellos.
+ *   `start`: la rama nace con ellos. La base es aquella de la que nace la rama:
+ *   la de integracion, salvo en un hotfix, que nace de la principal (MEN-1 de
+ *   la revision).
  * - Huella: el contenido de `aceptacion/` en la rama tiene que ser identico al
- *   de la rama base (mismo arbol de Git). Si la rama los añade, edita o borra,
- *   `finish` aborta: el agente que implementa no puede ajustarlos a su codigo.
+ *   de la base (mismo arbol de Git), este donde este la carpeta: `start` y
+ *   `review` la mueven de estado. Si no coincide, el merge-base dice quien los
+ *   cambio (IMP-1 de la revision): si la rama no los toco, fue la base, y basta
+ *   con integrarla; si los toco la rama, se restauran sobre su ruta.
+ * - `comando_heldout` y su timeout se leen de la config de la BASE, no de la
+ *   rama: la rama no puede cambiar como se ejecutan (MEN-2 de la revision).
  * - Con held-out y sin `comando_heldout`, aborta: no se mergea creyendo que
  *   hubo freno.
  * - En rojo solo se muestran comando, codigo y duracion, nunca la salida: la
@@ -18,8 +24,9 @@
  * `--sin-verificacion` no la salta: los held-out son de la persona.
  */
 import path from 'node:path';
-import { resolverConfig } from '../core/config.js';
-import { carpetasHeldout, CARPETA_HELDOUT, VARIABLE_HELDOUT } from '../core/heldout.js';
+import { spawnSync } from 'node:child_process';
+import { ConfigError, parsearConfig, type TaskcodeConfig } from '../core/config.js';
+import { carpetasHeldout, variantesHeldout, CARPETA_HELDOUT, VARIABLE_HELDOUT } from '../core/heldout.js';
 import { describirResultado } from '../core/informe-verificacion.js';
 import { currentBranch, isWorkspaceClean, runGit } from '../fs/git.js';
 import { ejecutarVerificacion } from '../fs/verificacion.js';
@@ -28,8 +35,10 @@ import { FinishCommandError } from './finish-opciones.js';
 export interface PuertaHeldoutOpts {
   id: string;
   rama: string;
-  /** Rama base donde la persona commiteo los held-out (`rama_base`). */
+  /** Rama de la que nace la de la tarea, donde la persona commiteo los held-out. */
   ramaBase: string;
+  /** Carpeta actual de la tarea, relativa a la raiz y con `/` (p. ej. `tareas/03-en-revision/TASK-1`). */
+  carpetaTarea: string;
   cwd: string;
   /** Solo para tests: sustituye al timeout (en ms). */
   timeoutMs?: number;
@@ -37,6 +46,8 @@ export interface PuertaHeldoutOpts {
 
 export type ResultadoHeldout = { tipo: 'sin-heldout' } | { tipo: 'verde'; carpeta: string; duracionMs: number };
 
+const CIERRE = 'No se ha mergeado nada.';
+
 function rutasDe(ref: string, cwd: string): string[] {
   const salida = runGit(['ls-tree', '-r', '--name-only', ref, '--', 'tareas'], cwd);
   return salida === '' ? [] : salida.split('\n');
@@ -46,52 +57,110 @@ function arbol(ref: string, carpeta: string, cwd: string): string {
   return runGit(['rev-parse', `${ref}:${carpeta}`], cwd);
 }
 
+function mergeBase(a: string, b: string, cwd: string): string | null {
+  const r = spawnSync('git', ['merge-base', a, b], { cwd, encoding: 'utf8', windowsHide: true });
+  return r.status === 0 ? (r.stdout ?? '').trim() : null;
+}
+
+/** La config de `.taskcode/config.yml` en `ref`; sin fichero, la de por defecto. */
+function configDe(ref: string, cwd: string, id: string): TaskcodeConfig {
+  const r = spawnSync('git', ['show', `${ref}:.taskcode/config.yml`], { cwd, encoding: 'utf8', windowsHide: true });
+  try {
+    return parsearConfig(r.status === 0 ? (r.stdout ?? '') : '', `${ref}:.taskcode/config.yml`);
+  } catch (e: unknown) {
+    if (!(e instanceof ConfigError)) throw e;
+    throw new FinishCommandError(
+      `[ERROR] ${id}: la configuracion de "${ref}", que es la que manda en los held-out, no es valida:\n  ` +
+        `${e.message.replace(/^\[ERROR\]\s*/, '')}\n${CIERRE}`
+    );
+  }
+}
+
+/** Ordenes para dejar `destino` (en la rama) igual que `origen` en la base, y borrar el resto. */
+function remedio(base: string, origen: string, destino: string, otras: readonly string[]): string {
+  const pasos = [
+    ...otras.map((c) => `git rm -r -q ${c}`),
+    `git rm -r -q --ignore-unmatch ${destino}`,
+    `git read-tree --prefix=${destino}/ ${base}:${origen}`,
+    `git checkout -- ${destino}`,
+  ];
+  return `${pasos.join(' && ')} && git commit -m "restaurar los held-out desde ${base}"`;
+}
+
 /** Ejecuta la puerta. Lanza FinishCommandError si no se puede mergear; no escribe nada. */
 export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
-  const enRama = carpetasHeldout(rutasDe('HEAD', o.cwd), o.id);
-  const enBase = carpetasHeldout(rutasDe(o.ramaBase, o.cwd), o.id);
+  const rutasRama = rutasDe('HEAD', o.cwd);
+  const rutasBase = rutasDe(o.ramaBase, o.cwd);
+  const raras = [...new Set([...variantesHeldout(rutasRama, o.id), ...variantesHeldout(rutasBase, o.id)])];
+  if (raras.length > 0) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: ${raras.join(', ')} no se llama exactamente "${CARPETA_HELDOUT}" (en minusculas), ` +
+        `asi que no se tomaria por los tests held-out y no se ejecutarian. Renombrala a ${CARPETA_HELDOUT}/ ` +
+        `en "${o.ramaBase}". ${CIERRE}`
+    );
+  }
+  const enRama = carpetasHeldout(rutasRama, o.id);
+  const enBase = carpetasHeldout(rutasBase, o.id);
   if (enRama.length === 0 && enBase.length === 0) return { tipo: 'sin-heldout' };
 
-  const cierre = 'No se ha mergeado nada.';
+  const destino = `${o.carpetaTarea}/${CARPETA_HELDOUT}`;
   if (enBase.length === 0) {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: la rama trae tests held-out (${enRama.join(', ')}) que no estan en "${o.ramaBase}". ` +
         `Los held-out los escribe la persona y los commitea en "${o.ramaBase}" durante el diseño, antes de ` +
-        `start; la rama de la tarea no puede añadirlos. ${cierre}`
+        `start; la rama de la tarea no puede añadirlos. Si son de la persona, que los commitee en ` +
+        `"${o.ramaBase}" y despues integra "${o.ramaBase}" en la rama. ${CIERRE}`
     );
   }
   if (enBase.length > 1) {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: "${o.ramaBase}" tiene mas de una carpeta ${CARPETA_HELDOUT}/ para esta tarea ` +
-        `(${enBase.join(', ')}): deja una sola y reintenta. ${cierre}`
+        `(${enBase.join(', ')}): deja una sola y reintenta. ${CIERRE}`
     );
   }
   const base = enBase[0] as string;
   const arbolBase = arbol(o.ramaBase, base, o.cwd);
-  const distintas = enRama.filter((c) => arbol('HEAD', c, o.cwd) !== arbolBase);
-  if (enRama.length === 0 || distintas.length > 0) {
+  const arbolesRama = enRama.map((c) => arbol('HEAD', c, o.cwd));
+  if (enRama.length !== 1 || arbolesRama[0] !== arbolBase) {
+    // ¿Quien los cambio? En el merge-base estaban como los dejo la base al nacer la rama.
+    const mb = mergeBase('HEAD', o.ramaBase, o.cwd);
+    const enMb = mb === null ? [] : carpetasHeldout(rutasDe(mb, o.cwd), o.id);
+    const arbolesMb = new Set(enMb.map((c) => arbol(mb as string, c, o.cwd)));
+    const ramaSinTocar =
+      enRama.length === enMb.length && arbolesMb.size <= 1 && arbolesRama.every((a) => arbolesMb.has(a));
+    if (ramaSinTocar) {
+      throw new FinishCommandError(
+        `[ERROR] ${o.id}: los tests held-out de "${o.ramaBase}" han cambiado desde que nacio la rama, y la ` +
+          `rama no los ha tocado: integra "${o.ramaBase}" en la rama (git merge ${o.ramaBase}) y reintenta, ` +
+          `para que finish ejecute los de ahora. ${CIERRE}`
+      );
+    }
+    const enDestino = enRama.includes(destino);
+    const otras = enRama.filter((c) => c !== destino);
     throw new FinishCommandError(
-      `[ERROR] ${o.id}: los tests held-out de la rama no coinciden con los de "${o.ramaBase}" ` +
-        `(${base}): la rama los ha editado, añadido o borrado. Restauralos desde "${o.ramaBase}" ` +
-        `(git checkout ${o.ramaBase} -- ${base}) y commitea; si hay que cambiarlos, lo hace la persona en ` +
-        `"${o.ramaBase}". ${cierre}`
+      `[ERROR] ${o.id}: la rama ha editado, añadido o borrado los tests held-out: su contenido ` +
+        `(${enRama.length === 0 ? 'ninguno' : enRama.join(', ')}) no coincide con el de "${o.ramaBase}" (${base}). ` +
+        'El agente que implementa no puede cambiarlos; si hay que cambiarlos, lo hace la persona en ' +
+        `"${o.ramaBase}". Para restaurarlos${enDestino ? '' : ` en ${destino}`}:\n  ` +
+        `${remedio(o.ramaBase, base, destino, otras)}\n${CIERRE}`
     );
   }
 
-  const config = resolverConfig(o.cwd);
+  const config = configDe(o.ramaBase, o.cwd, o.id);
   const comando = config.comando_heldout;
   if (comando === null) {
     throw new FinishCommandError(
-      `[ERROR] ${o.id}: la tarea tiene tests held-out (${base}) y .taskcode/config.yml no declara ` +
-        `comando_heldout, asi que no se pueden ejecutar. Declaralo (p. ej. comando_heldout: "node --test ` +
-        `$${VARIABLE_HELDOUT}") y reintenta. ${cierre}`
+      `[ERROR] ${o.id}: la tarea tiene tests held-out (${base}) y la configuracion de "${o.ramaBase}" no ` +
+        `declara comando_heldout, asi que no se pueden ejecutar. Declaralo en .taskcode/config.yml de ` +
+        `"${o.ramaBase}" (p. ej. comando_heldout: "node --test $${VARIABLE_HELDOUT}"), integralo en la rama ` +
+        `y reintenta. ${CIERRE}`
     );
   }
   const actual = currentBranch(o.cwd);
   if (actual !== o.rama) {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: los tests held-out se ejecutan sobre el arbol de la rama de la tarea, y la rama ` +
-        `activa es "${actual === '' ? 'HEAD desacoplado' : actual}". Cambiate a "${o.rama}" y reintenta. ${cierre}`
+        `activa es "${actual === '' ? 'HEAD desacoplado' : actual}". Cambiate a "${o.rama}" y reintenta. ${CIERRE}`
     );
   }
 
@@ -103,7 +172,7 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
   if (r.estado !== 'verde') {
     // Sin la salida, a proposito (decision D4 del plan).
     throw new FinishCommandError(
-      `[ERROR] ${o.id}: los tests held-out no estan en verde; no se mergea. ${cierre}\n` +
+      `[ERROR] ${o.id}: los tests held-out no estan en verde; no se mergea. ${CIERRE}\n` +
         `  Comando:   ${comando}\n` +
         `  Resultado: ${describirResultado(r)}\n` +
         `  Duracion:  ${(r.duracionMs / 1000).toFixed(1)} s\n` +
@@ -115,7 +184,7 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: los tests held-out salieron en verde pero han dejado cambios en el arbol de trabajo ` +
         `(mira git status). El merge necesita el workspace limpio: que escriban en rutas ignoradas, y reintenta. ` +
-        cierre
+        CIERRE
     );
   }
   return { tipo: 'verde', carpeta, duracionMs: r.duracionMs };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 62651b6..4de1754 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -457,7 +457,12 @@ export async function runFinishCommand(
     puertaHeldout({
       id,
       rama,
-      ramaBase: ramaIntegracion,
+      // Un hotfix nace de la principal: sus held-out se commitean ahi (MEN-1).
+      ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion,
+      carpetaTarea: path
+        .relative(deps.repoCwd, path.dirname((initial as NonNullable<typeof initial>).filePath))
+        .split(path.sep)
+        .join('/'),
       cwd: deps.repoCwd,
       ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
     });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 3618c4a..211971c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -588,9 +588,10 @@ function validarSincronizacionCompleta(ruta: string, vistas: ReadonlySet<string>
 
 /** TASK-070: el timeout de verificacion sin su comando no hace nada, como el de sincronizacion. */
 function validarVerificacionCompleta(ruta: string, vistas: ReadonlySet<string>): void {
-  if (vistas.has('timeout_verificacion') && !vistas.has('comando_verificacion')) {
+  // TASK-073: el timeout tambien es el de comando_heldout.
+  if (vistas.has('timeout_verificacion') && !vistas.has('comando_verificacion') && !vistas.has('comando_heldout')) {
     throw new ConfigError(
-      `[ERROR] ${ruta}: "timeout_verificacion" sin "comando_verificacion" no hace nada.
+      `[ERROR] ${ruta}: "timeout_verificacion" sin "comando_verificacion" ni "comando_heldout" no hace nada.
 ` +
         '        Borrala, o declara tambien el comando (por ejemplo comando_verificacion: "npm test").'
     );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
index eb1909e..044a34e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
@@ -21,6 +21,11 @@ export const VARIABLE_HELDOUT = 'HELDOUT_DIR';
  */
 export const EXCLUIR_HELDOUT = `tareas/*/TASK-*/${CARPETA_HELDOUT}/**`;
 
+/** El ID escapado para meterlo en una expresion regular. */
+function escaparId(id: string): string {
+  return id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
+}
+
 /**
  * Carpetas `tareas/<estado>/<id>/aceptacion` que aparecen en una lista de
  * rutas de fichero relativas a la raiz (las de `git ls-tree -r --name-only`),
@@ -28,7 +33,7 @@ export const EXCLUIR_HELDOUT = `tareas/*/TASK-*/${CARPETA_HELDOUT}/**`;
  * si la rama base la recibio despues de que la rama moviera la tarea.
  */
 export function carpetasHeldout(rutas: readonly string[], id: string): string[] {
-  const prefijo = new RegExp(`^(tareas/[^/]+/${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${CARPETA_HELDOUT})/`);
+  const prefijo = new RegExp(`^(tareas/[^/]+/${escaparId(id)}/${CARPETA_HELDOUT})/`);
   const vistas = new Set<string>();
   for (const r of rutas) {
     const m = prefijo.exec(r);
@@ -36,3 +41,18 @@ export function carpetasHeldout(rutas: readonly string[], id: string): string[]
   }
   return [...vistas];
 }
+
+/**
+ * Carpetas de la tarea cuyo nombre es `aceptacion` con OTRAS mayusculas
+ * (`Aceptacion/`): no se tomarian por held-out, y en NTFS o macOS es un error
+ * facil (MEN-3 de la revision). `finish` aborta si aparece alguna.
+ */
+export function variantesHeldout(rutas: readonly string[], id: string): string[] {
+  const re = new RegExp(`^(tareas/[^/]+/${escaparId(id)}/([^/]+))/`);
+  const vistas = new Set<string>();
+  for (const r of rutas) {
+    const m = re.exec(r);
+    if (m !== null && m[2] !== CARPETA_HELDOUT && (m[2] as string).toLowerCase() === CARPETA_HELDOUT) vistas.add(m[1] as string);
+  }
+  return [...vistas];
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
index b2da716..8ef6b3a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
@@ -34,6 +34,7 @@ function prueba(desenlace: string): string {
   return `
 const d = require('node:fs').readFileSync(${JSON.stringify(desenlace)}, 'utf8').trim();
 console.log('CANARIO-ASERCION: esperaba 42');
+if (d === 'ensucia') { require('node:fs').writeFileSync('basura.txt', 'x'); process.exit(0); }
 if (d !== 'ok') { console.error('assert.equal(resultado, 42) fallo'); process.exit(1); }
 `;
 }
@@ -41,7 +42,7 @@ if (d !== 'ok') { console.error('assert.equal(resultado, 42) fallo'); process.ex
 interface Ctx {
   repoRoot: string;
   tareasRoot: string;
-  desenlace(d: 'ok' | 'ko'): Promise<void>;
+  desenlace(d: 'ok' | 'ko' | 'ensucia'): Promise<void>;
   /** Carpetas HELDOUT_DIR con las que se ejecuto el lanzador. */
   ejecuciones(): string[];
 }
@@ -93,6 +94,14 @@ const finish = (c: Ctx, argv: string[]) =>
 const integrada = (rama: string, cwd: string) =>
   spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;
 
+/** Lo que hacen `start` y `review` en el flujo real: la carpeta de la tarea cambia de estado en la rama. */
+function moverComoStart(c: Ctx, id: string): string {
+  const destino = `tareas/03-en-revision/${id}/aceptacion`;
+  git(['mv', `tareas/01-en-diseno/${id}/aceptacion`, destino], c.repoRoot);
+  git(['commit', '-q', '-m', `chore(${id}): mover la tarea`], c.repoRoot);
+  return destino;
+}
+
 test('heldout: carpetasHeldout encuentra la carpeta de la tarea en cualquier estado y nada mas', () => {
   const rutas = [
     'tareas/01-en-diseno/TASK-730/aceptacion/a.cjs',
@@ -171,7 +180,7 @@ test('heldout (huella): si la rama edita, borra o añade held-out, aborta sin ej
     await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
     await writeFile(path.join(c.tareasRoot, '01-en-diseno', 'TASK-733', 'aceptacion', 'prueba.cjs'), '// vacio\n', 'utf8');
     commitAll(c.repoRoot, 'rebajar el test');
-    await assert.rejects(() => finish(c, ['TASK-733']), /no coinciden con los de "develop".*editado, añadido o borrado/s);
+    await assert.rejects(() => finish(c, ['TASK-733']), /la rama ha editado, añadido o borrado los tests held-out/);
     assert.equal(c.ejecuciones().length, 0);
     assert.equal(integrada(task.rama, c.repoRoot), false);
   });
@@ -181,7 +190,7 @@ test('heldout (huella): si la rama edita, borra o añade held-out, aborta sin ej
     await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
     git(['rm', '-q', '-r', 'tareas/01-en-diseno/TASK-734/aceptacion'], c.repoRoot);
     git(['commit', '-q', '-m', 'borrar'], c.repoRoot);
-    await assert.rejects(() => finish(c, ['TASK-734']), /no coinciden con los de "develop"/);
+    await assert.rejects(() => finish(c, ['TASK-734']), /la rama ha editado, añadido o borrado/);
   });
   // Añade un fichero mas.
   await conHeldout('TASK-735', async (c) => {
@@ -189,7 +198,7 @@ test('heldout (huella): si la rama edita, borra o añade held-out, aborta sin ej
     await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
     await writeFile(path.join(c.tareasRoot, '01-en-diseno', 'TASK-735', 'aceptacion', 'otro.cjs'), '1\n', 'utf8');
     commitAll(c.repoRoot, 'anadir');
-    await assert.rejects(() => finish(c, ['TASK-735']), /no coinciden/);
+    await assert.rejects(() => finish(c, ['TASK-735']), /la rama ha editado, añadido o borrado/);
   });
   // La rama los crea y develop no los tiene.
   await conHeldout(
@@ -245,3 +254,147 @@ test('heldout: la skill de flujo enlaza heldout.md, que explica cuando escribirl
   }
   assert.doesNotMatch(ref, /TaskCode/);
 });
+
+// ---------------------------------------------------------------------
+// Flujo real: la carpeta de la tarea se mueve de estado (IMP-1 y siguientes)
+// ---------------------------------------------------------------------
+
+test('heldout (IMP-1): con la carpeta movida como hace start, verde con HELDOUT_DIR en su estado actual', async () => {
+  await conHeldout('TASK-740', async (c) => {
+    const task = sampleTask({ id: 'TASK-740' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    moverComoStart(c, 'TASK-740');
+    const r = await finish(c, ['TASK-740']);
+    assert.equal(r.cierre, 'terminada');
+    assert.match(c.ejecuciones()[0] ?? '', /[/\\]tareas[/\\]03-en-revision[/\\]TASK-740[/\\]aceptacion$/);
+  });
+});
+
+test('heldout (IMP-1): si los cambio la base y no la rama, pide integrar la base; tras el merge, verde', async () => {
+  await conHeldout('TASK-741', async (c) => {
+    const task = sampleTask({ id: 'TASK-741' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    moverComoStart(c, 'TASK-741');
+    // La persona corrige el held-out en develop, como manda heldout.md.
+    git(['checkout', '-q', 'develop'], c.repoRoot);
+    const prueba741 = path.join(c.tareasRoot, '01-en-diseno', 'TASK-741', 'aceptacion', 'prueba.cjs');
+    await writeFile(prueba741, `${readFileSync(prueba741, 'utf8')}// corregido por la persona\n`, 'utf8');
+    commitAll(c.repoRoot, 'docs: corregir held-out');
+    git(['checkout', '-q', task.rama], c.repoRoot);
+    await assert.rejects(
+      () => finish(c, ['TASK-741']),
+      /los tests held-out de "develop" han cambiado desde que nacio la rama, y la rama no los ha tocado: integra "develop" en la rama \(git merge develop\)/
+    );
+    assert.equal(c.ejecuciones().length, 0);
+    git(['merge', '-q', '--no-ff', '-m', 'integrar develop', 'develop'], c.repoRoot);
+    const r = await finish(c, ['TASK-741']);
+    assert.equal(r.cierre, 'terminada');
+    assert.equal(c.ejecuciones().length, 1);
+  });
+});
+
+test('heldout (IMP-1): si los edita la rama, el remedio del mensaje los restaura en su ruta y deja cerrar', async () => {
+  await conHeldout('TASK-742', async (c) => {
+    const task = sampleTask({ id: 'TASK-742' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    const destino = moverComoStart(c, 'TASK-742');
+    await writeFile(path.join(c.repoRoot, destino, 'prueba.cjs'), '// rebajado\n', 'utf8');
+    commitAll(c.repoRoot, 'rebajar el held-out');
+    let mensaje = '';
+    await assert.rejects(
+      () => finish(c, ['TASK-742']),
+      (e: unknown) => {
+        mensaje = (e as Error).message;
+        return /la rama ha editado, añadido o borrado los tests held-out/.test(mensaje);
+      }
+    );
+    const orden = /\n {2}(git rm .*)\n/.exec(mensaje)?.[1];
+    assert.ok(orden, `sin remedio en: ${mensaje}`);
+    assert.match(orden, new RegExp(`git read-tree --prefix=${destino}/ develop:tareas/01-en-diseno/TASK-742/aceptacion`));
+    const r = spawnSync(orden, { cwd: c.repoRoot, shell: true, encoding: 'utf8' });
+    assert.equal(r.status, 0, r.stderr);
+    const fin = await finish(c, ['TASK-742']);
+    assert.equal(fin.cierre, 'terminada');
+    assert.equal(c.ejecuciones().length, 1);
+  });
+});
+
+test('heldout (IMP-2): un verde que ensucia el arbol aborta con mensaje propio', async () => {
+  await conHeldout('TASK-743', async (c) => {
+    const task = sampleTask({ id: 'TASK-743' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await c.desenlace('ensucia');
+    await assert.rejects(() => finish(c, ['TASK-743']), /salieron en verde pero han dejado cambios en el arbol de trabajo/);
+    assert.equal(integrada(task.rama, c.repoRoot), false);
+  });
+});
+
+test('heldout (IMP-2): fuera de la rama de la tarea no los ejecuta y dice a que rama cambiarse', async () => {
+  await conHeldout('TASK-744', async (c) => {
+    const task = sampleTask({ id: 'TASK-744' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    git(['checkout', '-q', '-b', 'otra'], c.repoRoot);
+    await assert.rejects(() => finish(c, ['TASK-744']), /la rama\s+activa es "otra". Cambiate a "feature\//);
+    assert.equal(c.ejecuciones().length, 0);
+  });
+});
+
+test('heldout (MEN-1): un hotfix compara y ejecuta contra la rama principal, de la que nace', async () => {
+  await conHeldout(
+    'TASK-745',
+    async (c) => {
+      const config = readFileSync(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'utf8');
+      git(['checkout', '-q', 'main'], c.repoRoot);
+      await mkdir(path.join(c.repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+      const dir = path.join(c.tareasRoot, '01-en-diseno', 'TASK-745', 'aceptacion');
+      await mkdir(dir, { recursive: true });
+      await writeFile(path.join(dir, 'prueba.cjs'), "console.log('ok')\n", 'utf8');
+      commitAll(c.repoRoot, 'docs: held-out del hotfix en main');
+      git(['checkout', '-q', 'develop'], c.repoRoot);
+      git(['merge', '-q', '--no-ff', '-m', 'main a develop', 'main'], c.repoRoot);
+      const task = sampleTask({ id: 'TASK-745', tipo: 'hotfix', rama: 'hotfix/task-745-arreglo' });
+      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task, { base: 'main' });
+      const r = await finish(c, ['TASK-745']);
+      assert.equal(r.cierre, 'terminada');
+      assert.equal(c.ejecuciones().length, 1);
+    },
+    { conHeldout: false }
+  );
+});
+
+test('heldout (MEN-2): la rama no puede cambiar comando_heldout: se usa el de la rama base', async () => {
+  await conHeldout('TASK-746', async (c) => {
+    const task = sampleTask({ id: 'TASK-746' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'comando_heldout: "node -e 0"\n', 'utf8');
+    commitAll(c.repoRoot, 'neutralizar');
+    await c.desenlace('ko');
+    await assert.rejects(() => finish(c, ['TASK-746']), /los tests held-out no estan en verde/);
+    assert.equal(c.ejecuciones().length, 1, 'se ejecuto el comando de develop, no el de la rama');
+  });
+});
+
+test('heldout (MEN-3): una carpeta Aceptacion/ con otras mayusculas aborta en vez de ignorarse', async () => {
+  await conHeldout(
+    'TASK-747',
+    async (c) => {
+      git(['checkout', '-q', 'develop'], c.repoRoot);
+      const dir = path.join(c.tareasRoot, '01-en-diseno', 'TASK-747', 'Aceptacion');
+      await mkdir(dir, { recursive: true });
+      await writeFile(path.join(dir, 'prueba.cjs'), 'process.exit(1)\n', 'utf8');
+      commitAll(c.repoRoot, 'held-out mal nombrados');
+      const task = sampleTask({ id: 'TASK-747' });
+      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+      await assert.rejects(() => finish(c, ['TASK-747']), /Aceptacion no se llama exactamente "aceptacion"/);
+      assert.equal(integrada(task.rama, c.repoRoot), false);
+    },
+    { conHeldout: false }
+  );
+});
+
+test('heldout (MEN-4): timeout_verificacion vale con comando_heldout aunque no haya comando_verificacion', () => {
+  const c = parsearConfig('comando_heldout: "npm run aceptacion"\ntimeout_verificacion: 120\n', 'c.yml');
+  assert.equal(c.timeout_verificacion, 120);
+  assert.throws(() => parsearConfig('timeout_verificacion: 120\n', 'c.yml'), /ni "comando_heldout"/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-verificacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-verificacion.test.ts
index 088542d..1731a9d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-verificacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-verificacion.test.ts
@@ -72,7 +72,7 @@ test('verificacion: un timeout que no es entero >= 1 aborta (fallo cerrado, nunc
 });
 
 test('verificacion: el timeout sin comando no hace nada y aborta; la clave repetida tambien', () => {
-  rechaza('timeout_verificacion: 300\n', /"timeout_verificacion" sin "comando_verificacion" no hace nada/);
+  rechaza('timeout_verificacion: 300\n', /"timeout_verificacion" sin "comando_verificacion" ni "comando_heldout" no hace nada/);
   rechaza('comando_verificacion: npm test\ncomando_verificacion: cargo test\n', /"comando_verificacion" esta repetida/);
 });
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff d6a0239b16ad16636c9ee70c99051f97af620da8..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-073/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-073/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-073/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-073/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-073/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-073/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-073/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-073/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-073/revision/informe-revision-1.md                                                  |  75 ++++++++
 tareas/03-en-revision/TASK-073/revision/peticion-revision-1.md                                                 | 805 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-073/tarea.md                                                       |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-heldout.js                               | 104 ++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                       |   7 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                           |   5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heldout.js                                          |  21 ++-
 15 files changed, 994 insertions(+), 29 deletions(-)
````
