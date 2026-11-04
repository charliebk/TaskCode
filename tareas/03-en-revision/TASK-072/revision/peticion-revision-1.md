# Peticion de revision — TASK-072 (ronda 1)

- Tarea: TASK-072 — Puerta de verificacion en finish y merge guard
- Rama revisada: feature/task-072-puerta-de-verificacion-en-finish-y-merge
- Rama base: develop
- Commit revisado (HEAD): 05fd80e659723445971abf78e0a1c13c19ec880d
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-072 (criterios de aceptacion y plan)

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
05fd80e feat(TASK-072): puerta de verificacion en finish y guardian de merges en PreToolUse
5d2f50b chore(TASK-072): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 0456db6..4beaa0a 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -10,6 +10,24 @@
 - TASK-066 (feature) — Doctor-deploy A: catalogo generico y comprobaciones deterministas (2026-10-27)
 - TASK-067 (feature) — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release (2026-10-27)
 
+Puerta de verificacion en finish y guardian de merges (TASK-072).
+
+- **Cambio de comportamiento**: con `comando_verificacion` declarado, `taskctl finish` lo
+  EJECUTA siempre antes de mergear o de abrir el merge request (no reutiliza el memo) y aborta
+  con el informe si no sale en verde, o si en verde deja el arbol sucio. Hay que lanzarlo desde
+  la rama de la tarea. No corre en el segundo `finish --merge-request` ni en el camino
+  idempotente (los merges ya estan hechos). Puede tardar lo que tarde la suite.
+- `--sin-verificacion` la salta y lo anota en `tarea.md` (seccion `## Verificacion omitida`)
+  con un commit en la rama de la tarea ANTES del merge. Sin `comando_verificacion` solo avisa.
+- **Hook `PreToolUse`** (sustituye a la sonda de TASK-069, ya sin filtro `if`): bloquea un
+  `git merge` o un script `merge-*-to-*.sh` hacia la rama de integracion (`rama_base`) o la
+  principal si no consta un verde guardado del commit que entra, y remite a `taskctl finish`.
+  El destino sale del texto (`git checkout develop && git merge x`) o de la rama actual. Deja
+  pasar lecturas, `merge --abort|--continue|--quit`, `merge-base`, merges hacia ramas de
+  trabajo y lo ya integrado (el backmerge de un hotfix que ya esta en main). Corre antes de cada
+  comando Bash/PowerShell, pero sin `merge` en el texto sale sin cargar nada; nunca ejecuta la
+  suite. Limites aceptados: alias de git, `git pull`, `git push . x:develop`, subshells.
+
 Freno de fin de turno (TASK-071): hook `Stop` que no deja dar el turno por terminado con la
 verificacion en rojo.
 
diff --git a/CLAUDE.md b/CLAUDE.md
index 686eb14..54002b0 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -44,7 +44,7 @@ npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar,
 ```
 
 El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | doctor [--json] | doctor-deploy [--json] [--escribir] | plan |
-approve | start | review | finish [--tag <nombre>] [--merge-request] [--push] | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
+approve | start | review | finish [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push] | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
 recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
 cerradas.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index a649a12..05e6540 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -577,8 +577,8 @@ timeout_verificacion: 900          # opcional, en segundos (por defecto 600)
 - Un valor inválido (comando vacío, timeout `0`, decimal o texto) aborta todos
   los comandos con un mensaje que nombra la clave y la línea; nunca se cae al
   valor por defecto en silencio.
-- La ejecuta el **freno de fin de turno** (hook `Stop`, abajo). La puerta de
-  `finish` llega en una versión siguiente.
+- La ejecutan el **freno de fin de turno** (hook `Stop`), la **puerta de
+  `finish`** y la consulta el **guardián de merges** (hook `PreToolUse`), abajo.
 
 #### Freno de fin de turno (hook `Stop`)
 
@@ -624,6 +624,50 @@ caso sale 0 sin lanzar ningún proceso (ni `git`). Cuando actúa:
 - Los subagentes no disparan `Stop` (disparan `SubagentStop`), así que el freno
   no los frena; y no actúa si la persona interrumpe el turno (Esc).
 
+#### Puerta de verificación en `finish`
+
+Con `comando_verificacion` declarado, `taskctl finish` lo ejecuta **siempre**
+antes del primer efecto (merge, o subir la rama y abrir el merge request): no
+reutiliza un verde guardado, porque la huella no ve los ficheros ignorados.
+
+- **No verde**: aborta con el mismo informe que el freno y sin tocar nada.
+- **Verde que ensucia el árbol** (compilados, cobertura no ignorados): aborta con
+  un mensaje propio antes de que el script de Git-Flow lo haga por workspace sucio.
+- Hay que lanzarlo **desde la rama de la tarea**: es el árbol que se verifica.
+- **No corre** en el segundo `finish --merge-request` (la plataforma ya mergeó)
+  ni en el camino idempotente (los merges ya están hechos): ahí solo bloquearía
+  lo hecho.
+- `--sin-verificacion` la salta y lo deja escrito en `tarea.md`, sección
+  `## Verificacion omitida`, con un commit en la rama de la tarea **antes** del
+  merge: el rastro sobrevive aunque el proceso muera después.
+- Tras un verde guarda el memo con la huella del commit, que es lo que consulta
+  el guardián de merges.
+- `finish` tarda lo que tarde la suite: si lo lanza un agente, que su
+  herramienta de shell no lo corte antes.
+
+#### Guardián de merges (hook `PreToolUse`)
+
+Antes de cada comando Bash o PowerShell del agente (sin filtro `if`: el de
+prefijo no ve `cd x && git merge`), el hook mira si el texto integra algo en la
+rama de integración (`rama_base`) o en la principal:
+
+- `git [-C dir] merge … <ref>`, con destino la última rama de un `git
+  checkout|switch` del mismo texto o, si no hay, la rama actual; y los scripts
+  `merge-<tipo>-to-<destino>.sh <rama>`.
+- **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
+  guardado para el commit que entra** —sin verde cuenta como no verde— y remite
+  a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
+- **Deja pasar** si el texto no contiene `merge` (sale sin cargar nada),
+  `merge --abort|--continue|--quit|--skip`, `merge-base`, `git config merge.*`,
+  `echo "git merge …"`, merges hacia ramas de trabajo, lo que ya está integrado
+  (ancestro del destino, de la principal —el backmerge de recuperación de un
+  hotfix— o de `origin/<destino>`), proyectos sin `comando_verificacion` y
+  cualquier fallo antes de saber que el destino es protegido.
+- Nunca ejecuta la suite (su `timeout` es de 30 s): solo lee el memo.
+- Es una defensa contra despistes, no contra un agente hostil: no ve alias de
+  git, `git pull`, `git push . x:develop` ni lo que se calcula en una subshell.
+  La red de verdad es la puerta de `finish`.
+
 `taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]`
 es otro comando, distinto de `doctor`: aquel comprueba que el proyecto está listo
 para trabajar con el flujo de tareas; este, que **la aplicación está lista para
@@ -988,7 +1032,7 @@ escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o
 la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
 avisa, sin bloquear, si falta el coste de diseño o de revisión.
 
-`taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--push]` cierra la
+`taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]` cierra la
 tarea. Sin los flags nuevos hace lo de siempre: merge `--no-ff` con el script de
 Git-Flow del tipo y tarea a `terminada`.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
index 1276016..8f9ab4b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
@@ -1,5 +1,5 @@
 {
-  "description": "Freno de fin de turno: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). El PreToolUse sigue siendo la sonda inerte, salvo que su variable de modo este definida.",
+  "description": "Frenos de verificacion. Stop: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). PreToolUse: un merge o un script de cierre hacia la rama de integracion o la principal se bloquea si no consta una verificacion en verde del commit que entra.",
   "hooks": {
     "Stop": [
       {
@@ -21,19 +21,9 @@
         "hooks": [
           {
             "type": "command",
-            "if": "Bash(git *)",
             "command": "node",
             "args": [
-              "${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"
-            ],
-            "timeout": 30
-          },
-          {
-            "type": "command",
-            "if": "PowerShell(git *)",
-            "command": "node",
-            "args": [
-              "${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"
+              "${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/pre-tool-merge.js"
             ],
             "timeout": 30
           }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index f45309d..0457deb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -200,6 +200,15 @@ terminar cada turno y, si no sale en verde, devuelve el turno con un informe
 saltes ni debilites tests para pasarlo. Si el rojo no es de tu cambio, dilo
 explicitamente al terminar: el freno solo bloquea una vez por turno.
 
+**Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
+`taskctl finish` (lanzado desde la rama de la tarea) ejecuta la verificacion
+antes de mergear y aborta si no sale en verde; tarda lo que tarde la suite.
+Un `git merge` o un script de cierre hacia la rama de integracion o la
+principal queda bloqueado si no consta un verde del commit que entra: cierra
+siempre con `taskctl finish`, nunca mergeando a mano. Saltarse la
+verificacion (`--sin-verificacion`) lo decide la persona, no tu, y queda
+anotado en la tarea.
+
 ## Cerrar una tarea
 
 Antes de lanzar `finish`, y otra vez justo despues, lee [cierre.md](cierre.md):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index a0ad8b3..8bb0d1f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -83,7 +83,7 @@ Uso:
   taskctl codex-review TASK-NNN [--push]
   taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
                     [--informe <nombre>] [--push]
-  taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--push]
+  taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]
   taskctl siguiente TASK-NNN [--json]
   taskctl doctor [--json]
   taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
index 8728ecd..d17ac97 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
@@ -37,8 +37,8 @@ import { resolverConfig, type TaskcodeConfig } from '../core/config.js';
 
 export class FinishCommandError extends Error {}
 
-/** Flags de `taskctl finish`: --push mas las dos opciones de cierre de TASK-060. */
-export const FLAGS_FINISH: readonly string[] = ['--push', '-p', '--tag', '--merge-request'];
+/** Flags de `taskctl finish`: --push, las dos opciones de cierre de TASK-060 y el salto de la verificacion (TASK-072). */
+export const FLAGS_FINISH: readonly string[] = ['--push', '-p', '--tag', '--merge-request', '--sin-verificacion'];
 
 export interface FlagsCierre {
   tag: string | null;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
new file mode 100644
index 0000000..03ae29c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -0,0 +1,131 @@
+/**
+ * Puerta de verificacion de `taskctl finish` — TASK-072, capa 1.
+ *
+ * Con `comando_verificacion` declarado, `finish` lo ejecuta SIEMPRE antes de
+ * mergear o de abrir el merge request (decision de Carlos: no reutiliza el
+ * memo, que no ve los ficheros ignorados) y aborta con el informe si no sale
+ * en verde. Solo corre en los caminos que van a integrar algo: ni en el
+ * segundo `finish --merge-request` (la plataforma ya mergeo) ni en el camino
+ * idempotente (los merges ya estan hechos), donde solo bloquearia lo hecho.
+ *
+ * `--sin-verificacion` la salta y lo deja escrito en la tarea. La anotacion
+ * se COMMITEA en la rama de la tarea ANTES del merge: asi viaja con el merge
+ * y el rastro sobrevive aunque el proceso muera despues del script. Escribirla
+ * sin commitear ensuciaria el workspace y el script de Git-Flow abortaria.
+ *
+ * Tras un verde se guarda el memo con la huella del arbol (limpio, igual que
+ * `huellaDeCommit` del commit de la rama): es lo que consulta el guardian de
+ * merges (hooks/guardia-merge) para no bloquear un merge ya verificado.
+ */
+import path from 'node:path';
+import { writeFile } from 'node:fs/promises';
+import { resolverConfig } from '../core/config.js';
+import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
+import { serializeTareaFile } from '../core/tarea-file.js';
+import { anotarVerificacionOmitida } from '../core/transiciones.js';
+import { currentBranch, isWorkspaceClean } from '../fs/git.js';
+import { autoCommit, mensajeChore } from '../fs/git-commit.js';
+import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
+import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
+import { FinishCommandError } from './finish-opciones.js';
+
+export const FLAG_SIN_VERIFICACION = '--sin-verificacion';
+
+/** Saca `--sin-verificacion` de argv. */
+export function extraerSinVerificacion(argv: readonly string[]): { sinVerificacion: boolean; resto: string[] } {
+  const resto = argv.filter((a) => a !== FLAG_SIN_VERIFICACION);
+  return { sinVerificacion: resto.length !== argv.length, resto };
+}
+
+export interface PuertaVerificacionOpts {
+  id: string;
+  rama: string;
+  tareasRoot: string;
+  initial: ReadTareaResult;
+  sinVerificacion: boolean;
+  cwd: string;
+  /** Instante de la anotacion (`formatearInstante`) o el dia. */
+  instante: string;
+  onAviso?: (aviso: string) => void;
+  /** Solo para tests: sustituye al timeout de la verificacion (en ms). */
+  timeoutMs?: number;
+}
+
+export type ResultadoPuerta =
+  | { tipo: 'sin-comando' }
+  | { tipo: 'verde'; duracionMs: number }
+  | { tipo: 'omitida'; commit: string | null };
+
+/**
+ * Ejecuta la puerta. Devuelve la tarea releida (la anotacion del salto cambia
+ * su cuerpo, y quien escriba despues tiene que partir de ella). Lanza
+ * FinishCommandError si no se puede mergear; antes del commit del salto no
+ * ha tocado nada.
+ */
+export async function puertaVerificacion(
+  o: PuertaVerificacionOpts
+): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
+  const config = resolverConfig(o.cwd);
+  const comando = config.comando_verificacion;
+  if (comando === null) {
+    if (o.sinVerificacion) {
+      o.onAviso?.(
+        `${o.id}: el proyecto no declara comando_verificacion, asi que no hay verificacion que saltar: ` +
+          `${FLAG_SIN_VERIFICACION} no tiene efecto y no se anota nada.`
+      );
+    }
+    return { resultado: { tipo: 'sin-comando' }, tarea: o.initial };
+  }
+
+  // La verificacion mira el arbol de trabajo: tiene que ser el de la tarea.
+  const actual = currentBranch(o.cwd);
+  if (actual !== o.rama) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la verificacion del proyecto se ejecuta sobre el arbol de la rama de la tarea, ` +
+        `y la rama activa es "${actual === '' ? 'HEAD desacoplado' : actual}", no "${o.rama}". ` +
+        `Cambiate a ella (git checkout ${o.rama}) y reintenta taskctl finish; no se ha tocado nada.`
+    );
+  }
+
+  if (o.sinVerificacion) {
+    const body = anotarVerificacionOmitida(o.initial.body, o.instante, comando);
+    await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
+    const c = autoCommit({
+      cwd: o.cwd,
+      rutas: [path.dirname(o.initial.filePath)],
+      mensaje: mensajeChore(o.id, 'cierre sin verificacion'),
+      push: false,
+    });
+    for (const a of c.avisos) o.onAviso?.(a);
+    o.onAviso?.(
+      `${o.id}: cierre con ${FLAG_SIN_VERIFICACION}: no se ha ejecutado "${comando}". Queda anotado en ` +
+        `tarea.md (seccion "Verificacion omitida")${c.commit === null ? '' : `, commit ${c.commit}`}.`
+    );
+    const releida = await readTareaFile(o.tareasRoot, o.id);
+    if (releida === null) {
+      throw new FinishCommandError(`[ERROR] ${o.id}: tarea.md desaparecio tras anotar el salto; revisa el repo a mano.`);
+    }
+    return { resultado: { tipo: 'omitida', commit: c.commit }, tarea: releida };
+  }
+
+  const timeoutS = config.timeout_verificacion;
+  const r = ejecutarVerificacion(o.cwd, comando, timeoutS, o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs });
+  const huella = huellaDelArbol(o.cwd, comando, timeoutS);
+  if (huella !== null) guardarMemo(o.cwd, huella, r);
+  if (r.estado !== 'verde') {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: no se mergea con la verificacion en rojo. No se ha tocado nada.\n` +
+        `${formatearVerificacionRoja(r)}\n` +
+        `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
+        'lo deja anotado en la tarea.'
+    );
+  }
+  if (!isWorkspaceClean(o.cwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la verificacion salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
+        `("${comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita el ` +
+        'workspace limpio: ignora esos ficheros en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
+    );
+  }
+  return { resultado: { tipo: 'verde', duracionMs: r.duracionMs }, tarea: o.initial };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index e9ff66b..664f62b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -84,6 +84,7 @@ import {
   type AutoCommitResult,
 } from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
+import { extraerSinVerificacion, puertaVerificacion } from './finish-verificacion.js';
 import { runBoardCommand, boardFilePath } from './board.js';
 import { renderBoardMarkdown } from '../core/board-format.js';
 import { REVISION_DIRNAME } from './review.js';
@@ -255,6 +256,8 @@ export interface FinishCommandDeps {
   onAviso?: (aviso: string) => void;
   /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
   ahora?: string;
+  /** Solo para tests: timeout de la puerta de verificacion (TASK-072), en ms. */
+  verificacionTimeoutMs?: number;
 }
 
 export interface FinishCommandResult {
@@ -300,7 +303,8 @@ export async function runFinishCommand(
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_FINISH, 'finish', (m) => new FinishCommandError(m));
   const { push, resto: sinPush } = extraerPushFlag(argv);
-  const { tag: nombreTag, mergeRequest: pideMergeRequest, resto } = extraerFlagsCierre(sinPush);
+  const { sinVerificacion, resto: sinFlagVerificacion } = extraerSinVerificacion(sinPush);
+  const { tag: nombreTag, mergeRequest: pideMergeRequest, resto } = extraerFlagsCierre(sinFlagVerificacion);
   const id = resto[0];
   if (id === undefined || id.trim() === '') {
     throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
@@ -309,7 +313,7 @@ export async function runFinishCommand(
   // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): rechazo
   // rapido sin tocar Git + metadata estable (tipo/rama/titulo). La
   // lectura que decide la escritura va DESPUES de los merges.
-  const initial = await readTareaFile(tareasRoot, id);
+  let initial = await readTareaFile(tareasRoot, id);
   // Mensaje propio para "no esta en este working tree" (hallazgo MENOR
   // de revision por pares, TASK-014): el generico de la maquina de
   // estados aconseja crear la tarea con import/new, que aqui es lo
@@ -434,7 +438,23 @@ export async function runFinishCommand(
     }
   }
 
+  // TASK-072: la puerta de verificacion, justo antes del primer efecto y solo
+  // en los caminos que van a integrar algo (abrir el MR o ejecutar el script).
+  const puerta = () =>
+    puertaVerificacion({
+      id,
+      rama,
+      tareasRoot,
+      initial: initial as NonNullable<typeof initial>,
+      sinVerificacion,
+      cwd: deps.repoCwd,
+      instante: deps.ahora ?? today,
+      ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
+      ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+    });
+
   if (mrCtx !== null && mrCtx.estado.tipo === 'ninguno') {
+    initial = (await puerta()).tarea;
     return abrirMergeRequestYAnotar({
       tareasRoot,
       id,
@@ -494,6 +514,7 @@ export async function runFinishCommand(
         `git merge --no-ff ${rama} — y reintenta taskctl finish.`
     );
   } else {
+    await puerta();
     const argsScript = [rama, '--develop', ramaIntegracion];
     // hotfix/release: el script pone el tag en main; --tag le da el nombre.
     if (nombreTag !== null && mainBranch !== null) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
new file mode 100644
index 0000000..93ef952
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -0,0 +1,212 @@
+/**
+ * Que merges contiene el texto de un comando de shell — TASK-072, capa 2.
+ * Puro y sin I/O: el guardian de merges (hooks/guardia-merge) lo usa para
+ * descartar casi todo sin lanzar ningun proceso.
+ *
+ * No emula el shell. Parte el texto en segmentos (`&&`, `||`, `;`, `|`, `&`,
+ * saltos de linea, parentesis), respeta comillas simples y dobles, y en cada
+ * segmento mira:
+ *
+ * - `git [opciones globales] merge [opciones] <refs...>`: un merge. Su destino
+ *   es la ultima rama a la que se cambio en el MISMO texto (`git checkout X`,
+ *   `git switch X`) o, si no hubo ninguna, la rama actual (la resuelve quien
+ *   llama). `--abort`, `--continue`, `--quit` y `--skip` no son merges nuevos.
+ * - `bash|sh <...>/merge-<tipo>-to-<destino>.sh <rama>`: el script de cierre
+ *   de Git-Flow, con la rama fuente como primer argumento.
+ *
+ * Limites aceptados en el plan (la red de verdad es la puerta de `finish`):
+ * alias de git, `git pull`, `git push . x:develop`, variables y subshells
+ * cuyo contenido no esta en el texto, `cd` a otro repo entre segmentos.
+ */
+
+export type OperacionMerge =
+  | {
+      tipo: 'merge';
+      /** Refs que entran; vacio = el upstream (`git merge` a secas). */
+      fuentes: string[];
+      /** Rama destino si el texto se cambio a ella antes; null = la actual. */
+      destino: string | null;
+      /** El `-C <dir>` del git del merge, si lo tenia. */
+      dir: string | null;
+    }
+  | {
+      tipo: 'script';
+      script: string;
+      fuente: string | null;
+      /** A donde integra: feature/fix a la de integracion; hotfix/release a main y backmerge. */
+      destinos: ('integracion' | 'main')[];
+    };
+
+const SEPARADORES = new Set(['&&', '||', ';', '|', '&', '\n', '(', ')']);
+const ESCAPABLES = new Set([' ', '\t', '"', "'", '\\', '&', ';', '|', '(', ')', '$', '`']);
+
+/** Parte el texto en segmentos de tokens. Las comillas se quitan; su contenido es un token. */
+export function segmentar(texto: string): string[][] {
+  const segmentos: string[][] = [];
+  let actual: string[] = [];
+  let token = '';
+  let hayToken = false;
+  const cerrarToken = () => {
+    if (hayToken) actual.push(token);
+    token = '';
+    hayToken = false;
+  };
+  const cerrarSegmento = () => {
+    cerrarToken();
+    if (actual.length > 0) segmentos.push(actual);
+    actual = [];
+  };
+  for (let i = 0; i < texto.length; i++) {
+    const c = texto[i] as string;
+    if (c === "'" || c === '"') {
+      const fin = texto.indexOf(c, i + 1);
+      const hasta = fin === -1 ? texto.length : fin;
+      token += texto.slice(i + 1, hasta);
+      hayToken = true;
+      i = hasta;
+      continue;
+    }
+    // Escape de bash solo ante un caracter especial: asi `C:\Git\bin\git.exe`
+    // (PowerShell, rutas de Windows) llega entero.
+    if (c === '\\' && i + 1 < texto.length && ESCAPABLES.has(texto[i + 1] as string)) {
+      token += texto[i + 1] as string;
+      hayToken = true;
+      i++;
+      continue;
+    }
+    const dos = texto.slice(i, i + 2);
+    if (dos === '&&' || dos === '||') {
+      cerrarSegmento();
+      i++;
+      continue;
+    }
+    if (c === '\r') continue;
+    if (SEPARADORES.has(c)) {
+      cerrarSegmento();
+      continue;
+    }
+    if (c === ' ' || c === '\t') {
+      cerrarToken();
+      continue;
+    }
+    token += c;
+    hayToken = true;
+  }
+  cerrarSegmento();
+  return segmentos;
+}
+
+/** Nombre de programa sin ruta, sin `.exe` y en minusculas: `C:\Git\bin\git.exe` -> `git`. */
+function programa(token: string): string {
+  const base = token.split(/[\\/]/).pop() ?? token;
+  return base.toLowerCase().replace(/\.exe$/, '');
+}
+
+/** Opciones globales de git que llevan su valor en el token siguiente. */
+const GLOBALES_CON_VALOR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix']);
+/** Opciones de `git merge` que llevan su valor en el token siguiente. */
+const MERGE_CON_VALOR = new Set(['-m', '-F', '-s', '-X', '--file', '--strategy', '--strategy-option', '--into-name']);
+const MERGE_SIN_MERGE = new Set(['--abort', '--continue', '--quit', '--skip']);
+/** Opciones de checkout/switch que crean la rama nombrada en el token siguiente. */
+const CREAN_RAMA = new Set(['-b', '-B', '-c', '-C', '--orphan', '--create', '--force-create']);
+/** Opciones de checkout/switch con valor que NO es la rama destino. */
+const CAMBIO_CON_VALOR = new Set(['--conflict', '--pathspec-from-file']);
+
+const SCRIPT_CIERRE = /^merge-(feature|fix|hotfix|release)-to-(develop|main)\.sh$/;
+const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
+
+/** Quita asignaciones de entorno iniciales (`FOO=1 git merge x`) y `command`/`exec`. */
+function sinPrefijos(seg: readonly string[]): string[] {
+  let i = 0;
+  while (i < seg.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(seg[i] as string) || ['command', 'exec', 'env'].includes(seg[i] as string))) i++;
+  return seg.slice(i);
+}
+
+/** Merges y scripts de cierre que aparecen en el comando, en orden. */
+export function analizarComando(texto: string): OperacionMerge[] {
+  const ops: OperacionMerge[] = [];
+  let destino: string | null = null;
+  for (const bruto of segmentar(texto)) {
+    const seg = sinPrefijos(bruto);
+    if (seg.length === 0) continue;
+    const prog = programa(seg[0] as string);
+
+    if (prog === 'git') {
+      let i = 1;
+      let dir: string | null = null;
+      while (i < seg.length && (seg[i] as string).startsWith('-')) {
+        const op = seg[i] as string;
+        if (GLOBALES_CON_VALOR.has(op)) {
+          if (op === '-C') dir = seg[i + 1] ?? null;
+          i += 2;
+        } else i++;
+      }
+      const sub = (seg[i] ?? '').toLowerCase();
+      const args = seg.slice(i + 1);
+      if (sub === 'checkout' || sub === 'switch') {
+        const nuevo = ramaDeCambio(args);
+        if (nuevo !== null) destino = nuevo;
+      } else if (sub === 'merge') {
+        if (args.some((a) => MERGE_SIN_MERGE.has(a))) continue;
+        ops.push({ tipo: 'merge', fuentes: posicionales(args, MERGE_CON_VALOR), destino, dir });
+      }
+      continue;
+    }
+
+    // `bash script.sh rama`, `sh ./script.sh rama` o el script a secas.
+    let iScript = 0;
+    if (SHELLS.has(prog)) {
+      iScript = 1;
+      while (iScript < seg.length && (seg[iScript] as string).startsWith('-')) iScript++;
+    }
+    const script = seg[iScript];
+    if (script === undefined) continue;
+    const nombre = script.split(/[\\/]/).pop() ?? script;
+    const m = SCRIPT_CIERRE.exec(nombre);
+    if (m === null) continue;
+    const fuente = seg.slice(iScript + 1).find((a) => !a.startsWith('-')) ?? null;
+    ops.push({
+      tipo: 'script',
+      script: nombre,
+      fuente,
+      destinos: m[2] === 'main' ? ['main', 'integracion'] : ['integracion'],
+    });
+  }
+  return ops;
+}
+
+/** Argumentos que no son opciones (ni el valor de una), hasta `--`. */
+function posicionales(args: readonly string[], conValor: ReadonlySet<string>): string[] {
+  const fuera: string[] = [];
+  for (let i = 0; i < args.length; i++) {
+    const a = args[i] as string;
+    if (a === '--') {
+      fuera.push(...args.slice(i + 1));
+      break;
+    }
+    if (a.startsWith('-')) {
+      if (conValor.has(a)) i++;
+      continue;
+    }
+    fuera.push(a);
+  }
+  return fuera;
+}
+
+/**
+ * La rama a la que deja un `git checkout|switch`, o null si no cambia de rama
+ * (restaurar ficheros: `git checkout -- f`, `git checkout develop -- f`).
+ */
+function ramaDeCambio(args: readonly string[]): string | null {
+  for (let i = 0; i < args.length; i++) {
+    const a = args[i] as string;
+    if (CREAN_RAMA.has(a)) return args[i + 1] ?? null;
+  }
+  if (args.includes('--')) {
+    const antes = args.slice(0, args.indexOf('--'));
+    // `git checkout develop -- f` restaura f desde develop: no cambia de rama.
+    if (args.indexOf('--') < args.length - 1) return null;
+    return posicionales(antes, CAMBIO_CON_VALOR)[0] ?? null;
+  }
+  return posicionales(args, CAMBIO_CON_VALOR)[0] ?? null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 663e938..addc917 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -261,3 +261,33 @@ export function registrarTransicion(
   const modo = fase === 'plan' ? modoConfig : modoDeTarea(body, modoConfig);
   return anadirTransicion(body, { fecha, fase, modo, decidido_por: decididoPor });
 }
+
+// ---------------------------------------------------------------------
+// Verificacion omitida (TASK-072)
+// ---------------------------------------------------------------------
+
+/** Seccion que deja `taskctl finish --sin-verificacion`: una linea por cierre sin verificar. */
+export const SECCION_VERIFICACION_OMITIDA = '## Verificacion omitida';
+
+/**
+ * Anota que un cierre se hizo sin ejecutar `comando_verificacion`. Va en el
+ * cuerpo y no en el frontmatter (mismo criterio que `## Merge request`): es
+ * un dato de auditoria y un campo nuevo obligaria a tocar parser y board.
+ * Si la seccion ya existe (un reintento) la linea va al final de ella.
+ */
+export function anotarVerificacionOmitida(body: string, instante: string, comando: string): string {
+  const eol = body.includes('\r\n') ? '\r\n' : '\n';
+  const linea = `- ${instante}: taskctl finish --sin-verificacion; no se ejecuto \`${comando.replace(/`/g, "'")}\``;
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_VERIFICACION_OMITIDA);
+  if (rango === null) {
+    const base = body.replace(/(\r?\n)*$/, '');
+    return `${base}${base === '' ? '' : eol + eol}${SECCION_VERIFICACION_OMITIDA}${eol}${eol}${linea}${eol}`;
+  }
+  const [inicio, fin] = rango;
+  let ultima = inicio;
+  for (let i = inicio + 1; i < fin; i++) if ((lineas[i] as string).trim() !== '') ultima = i;
+  const desde = ultima === inicio ? inicio + 1 : ultima + 1;
+  const insertar = ultima === inicio ? ['', linea] : [linea];
+  return [...lineas.slice(0, desde), ...insertar, ...lineas.slice(desde)].join(eol);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index 9810933..46fd910 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -95,6 +95,22 @@ export function huellaDelArbol(raiz: string, comando: string, timeoutS: number):
   return h.digest('hex');
 }
 
+/**
+ * Huella que tendria el arbol LIMPIO en el commit `ref` (TASK-072): la misma
+ * formula que `huellaDelArbol` sin ficheros sucios, asi que coincide con la
+ * que guardo una verificacion hecha con ese commit en HEAD y el arbol limpio
+ * (la de `finish`, o la del freno Stop si no habia nada sin commitear). La usa
+ * el guardian de merges, que pregunta por la rama que entra sin cambiarse a
+ * ella. null si `ref` no resuelve a un commit.
+ */
+export function huellaDeCommit(raiz: string, ref: string, comando: string, timeoutS: number): string | null {
+  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`], raiz);
+  if (sha === null || sha === '') return null;
+  const h = createHash('sha1');
+  h.update(`v${String(VERSION_MEMO)}\0${sha}\0${comando}\0${String(timeoutS)}\0`);
+  return h.digest('hex');
+}
+
 export interface MemoVerificacion {
   version: number;
   huella: string;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
new file mode 100644
index 0000000..2d531f7
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -0,0 +1,197 @@
+/**
+ * Guardian de merges — TASK-072, capa 2. Lo ejecuta el hook `PreToolUse` de
+ * Claude Code (hooks/hooks.json -> dist/src/hooks/pre-tool-merge.js) ANTES de
+ * cada comando Bash o PowerShell del agente, en todos los proyectos con el
+ * plugin. Sin filtro `if` (decision de Carlos: el `if` de prefijo no ve
+ * `cd x && git merge` ni `git checkout develop && git merge x`), asi que las
+ * guardas van de la mas barata a la mas cara:
+ *
+ *   1. El texto no contiene `merge`: deja pasar (lo decide el punto de
+ *      entrada, antes incluso de cargar este modulo).
+ *   2. `analizarComando` no encuentra un merge ni un script de cierre.
+ *   3. No es un repo, o la config no declara `comando_verificacion`, o no se
+ *      puede leer: deja pasar (la puerta de `finish` sigue ahi).
+ *   4. El destino no es la rama de integracion (`rama_base`) ni la principal.
+ *   5. La fuente ya esta integrada: es ancestro del destino, de la principal
+ *      (el backmerge de recuperacion que pide `finish`) o de origin/<destino>.
+ *   6. Hay un VERDE guardado para el commit fuente (huella de commit, la que
+ *      deja `finish` o el freno Stop con el arbol limpio): deja pasar.
+ *   7. Cualquier otra cosa BLOQUEA (exit 2): «sin verde» cuenta como no verde
+ *      (decision de Carlos) y remite a `taskctl finish`, que si verifica.
+ *
+ * Nunca ejecuta la verificacion (su timeout es de 30 s). Un fallo inesperado
+ * antes de saber que el comando integra en develop/main deja pasar; despues,
+ * bloquea. Nada de lo que escribe nombra el producto.
+ */
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { analizarComando, type OperacionMerge } from '../core/comando-merge.js';
+import { raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
+import { huellaDeCommit, leerMemo } from '../fs/verificacion.js';
+import { timeoutEfectivoS } from './freno-stop.js';
+
+export interface EntradaPreToolUse {
+  cwd?: unknown;
+  tool_name?: unknown;
+  tool_input?: unknown;
+}
+
+export interface DecisionPreToolUse {
+  codigo: 0 | 2;
+  stderr: string;
+}
+
+const PASAR: DecisionPreToolUse = Object.freeze({ codigo: 0, stderr: '' });
+
+/** Guarda 1, sin I/O: el comando de la entrada, si puede contener un merge. */
+export function comandoCandidato(entrada: EntradaPreToolUse): string | null {
+  const ti = entrada.tool_input;
+  if (typeof ti !== 'object' || ti === null) return null;
+  const cmd = (ti as { command?: unknown }).command;
+  if (typeof cmd !== 'string' || !/merge/i.test(cmd)) return null;
+  return cmd;
+}
+
+function git(args: readonly string[], cwd: string): { ok: boolean; out: string } {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
+  return { ok: r.error === undefined && r.status === 0, out: (r.stdout ?? '').trim() };
+}
+
+function existeRef(ref: string, cwd: string): boolean {
+  return git(['rev-parse', '--verify', '--quiet', ref], cwd).ok;
+}
+
+/** La principal sin red: main o master en local (resolveMainBranch consulta origin). */
+function ramaPrincipal(cwd: string): string | null {
+  if (existeRef('refs/heads/main', cwd)) return 'main';
+  if (existeRef('refs/heads/master', cwd)) return 'master';
+  return null;
+}
+
+function esAncestro(a: string, b: string, cwd: string): boolean {
+  return git(['merge-base', '--is-ancestor', '--end-of-options', a, b], cwd).ok;
+}
+
+interface Integracion {
+  fuente: string;
+  destino: string;
+  raiz: string;
+}
+
+export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUse {
+  const comando = comandoCandidato(entrada);
+  if (comando === null) return PASAR;
+  const ops = analizarComando(comando);
+  if (ops.length === 0) return PASAR;
+  if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return PASAR;
+  const cwd = entrada.cwd;
+
+  // 3 y 4: hasta saber que algo entra en develop/main, cualquier fallo deja pasar.
+  const pendientes: { op: OperacionMerge; integ: Integracion; config: TaskcodeConfig }[] = [];
+  try {
+    for (const op of ops) {
+      const dirOp = op.tipo === 'merge' && op.dir !== null ? path.resolve(cwd, op.dir) : cwd;
+      let raiz: string;
+      let config: TaskcodeConfig;
+      try {
+        raiz = raizDelRepo(dirOp);
+        config = resolverConfigConAvisos(raiz).config;
+      } catch {
+        continue;
+      }
+      if (config.comando_verificacion === null) continue;
+      const principal = ramaPrincipal(raiz);
+      const protegidas = new Set([config.rama_base, ...(principal === null ? [] : [principal])]);
+      for (const integ of integraciones(op, raiz, config.rama_base, principal)) {
+        if (protegidas.has(integ.destino)) pendientes.push({ op, integ, config });
+      }
+    }
+  } catch {
+    return PASAR;
+  }
+  if (pendientes.length === 0) return PASAR;
+
+  // 5 a 7: ya se sabe que el comando integra en una rama protegida.
+  try {
+    for (const { integ, config } of pendientes) {
+      const motivo = motivoDeBloqueo(integ, config);
+      if (motivo !== null) return { codigo: 2, stderr: motivo };
+    }
+    return PASAR;
+  } catch (e: unknown) {
+    const msg = e instanceof Error ? e.message : String(e);
+    return {
+      codigo: 2,
+      stderr:
+        `No se pudo comprobar la verificacion antes de este merge hacia una rama protegida: ${msg}\n` +
+        'Cierra la tarea con taskctl finish TASK-NNN, que verifica antes de mergear.',
+    };
+  }
+}
+
+/** Pares fuente -> destino de una operacion. Para un merge sin destino explicito, la rama actual. */
+function integraciones(op: OperacionMerge, raiz: string, integracion: string, principal: string | null): Integracion[] {
+  if (op.tipo === 'script') {
+    if (op.fuente === null) return [];
+    const destinos = op.destinos.map((d) => (d === 'main' ? principal : integracion)).filter((d): d is string => d !== null);
+    return destinos.map((destino) => ({ fuente: op.fuente as string, destino, raiz }));
+  }
+  const destino = op.destino ?? git(['branch', '--show-current'], raiz).out;
+  if (destino === '') return [];
+  const fuentes = op.fuentes.length > 0 ? op.fuentes : [`${destino}@{upstream}`];
+  return fuentes.map((fuente) => ({ fuente, destino, raiz }));
+}
+
+/** null si el merge puede pasar; si no, el texto para el agente. */
+function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig): string | null {
+  const { fuente, destino, raiz } = integ;
+  const comando = config.comando_verificacion as string;
+  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${fuente}^{commit}`], raiz);
+  if (!sha.ok || sha.out === '') {
+    return mensaje(fuente, null, destino, comando, `no se puede resolver "${fuente}" a un commit`);
+  }
+  // 5: nada nuevo entra en el destino.
+  const principal = ramaPrincipal(raiz);
+  if (esAncestro(sha.out, destino, raiz)) return null;
+  if (principal !== null && esAncestro(sha.out, principal, raiz)) return null;
+  const remota = `refs/remotes/origin/${destino}`;
+  if (existeRef(remota, raiz) && esAncestro(sha.out, remota, raiz)) return null;
+
+  // 6: un verde guardado para ese commit, con el timeout de finish o el del freno.
+  const timeouts = new Set([config.timeout_verificacion, timeoutEfectivoS(config.timeout_verificacion).timeoutS]);
+  let rojo = false;
+  for (const t of timeouts) {
+    const huella = huellaDeCommit(raiz, sha.out, comando, t);
+    const r = huella === null ? null : leerMemo(raiz, huella);
+    if (r?.estado === 'verde') return null;
+    if (r !== null) rojo = true;
+  }
+  return mensaje(
+    fuente,
+    sha.out,
+    destino,
+    comando,
+    rojo ? 'la ultima verificacion de ese commit NO salio en verde' : 'no consta una verificacion en verde de ese commit'
+  );
+}
+
+function mensaje(fuente: string, sha: string | null, destino: string, comando: string, motivo: string): string {
+  const quien = sha === null ? `"${fuente}"` : `"${fuente}" (${sha.slice(0, 10)})`;
+  return [
+    `Merge bloqueado: ${quien} entraria en "${destino}" y ${motivo} (comando de verificacion: ${comando}).`,
+    'Cierra la tarea con taskctl finish TASK-NNN: ejecuta la verificacion y mergea con el flujo de la tarea.',
+    'Si la persona decide integrar sin verificar, es taskctl finish TASK-NNN --sin-verificacion, que lo deja',
+    'anotado en la tarea. No integres por otra via para saltarte esta comprobacion.',
+  ].join('\n');
+}
+
+/** El JSON del hook. Un JSON roto o vacio es una entrada sin campos. */
+export function parsearEntradaPreToolUse(texto: string): EntradaPreToolUse {
+  try {
+    const v: unknown = JSON.parse(texto);
+    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaPreToolUse) : {};
+  } catch {
+    return {};
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
new file mode 100644
index 0000000..1cf9b2e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
@@ -0,0 +1,30 @@
+/**
+ * Punto de entrada del hook `PreToolUse` (hooks/hooks.json). Corre antes de
+ * CADA comando Bash/PowerShell, asi que lo primero es barato: si el texto no
+ * contiene `merge`, sale 0 sin cargar nada mas. Si no, decide
+ * (guardia-merge.ts): 0 deja pasar, 2 bloquea con el motivo en stderr.
+ * Nunca sale con 1, que Claude Code trata como error NO bloqueante.
+ */
+import { readFileSync } from 'node:fs';
+
+let texto = '';
+try {
+  texto = readFileSync(0, 'utf8');
+} catch {
+  texto = '';
+}
+
+if (/merge/i.test(texto)) {
+  import('./guardia-merge.js').then(
+    (g) => {
+      const d = g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
+      if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
+      process.exitCode = d.codigo;
+    },
+    () => {
+      process.exitCode = 0;
+    }
+  );
+} else {
+  process.exitCode = 0;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
new file mode 100644
index 0000000..78a1906
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
@@ -0,0 +1,226 @@
+/**
+ * Puerta de verificacion de `taskctl finish` (TASK-072, capa 1). Repos Git
+ * temporales de verdad y los scripts de Git-Flow tal cual; el comando de
+ * verificacion es un script de node que vive FUERA del repo (no ensucia el
+ * workspace) y lee su desenlace de un fichero junto a el, asi que se puede
+ * cambiar lo que hace sin tocar el arbol. Cuenta sus ejecuciones.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { existsSync, readFileSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import { anotarVerificacionOmitida } from '../../src/core/transiciones.js';
+import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
+import { guardarMemo, huellaDelArbol } from '../../src/fs/verificacion.js';
+import { resolverConfig } from '../../src/core/config.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+
+const SCRIPT = `
+const fs = require('node:fs');
+const dir = __dirname;
+fs.appendFileSync(dir + '/cuenta', 'x');
+const d = fs.readFileSync(dir + '/desenlace', 'utf8').trim();
+if (d === 'ok') { console.log('todo en verde'); process.exit(0); }
+if (d === 'ensucia') { fs.writeFileSync('cobertura.txt', 'x'); process.exit(0); }
+console.error('ERROR: 2 tests fallan'); process.exit(3);
+`;
+
+interface Verif {
+  dir: string;
+  desenlace(d: 'ok' | 'ko' | 'ensucia'): Promise<void>;
+  ejecuciones(): number;
+}
+
+async function conVerificacion(fn: (v: Verif, repoRoot: string, tareasRoot: string) => Promise<void>, opts: { conComando?: boolean } = {}) {
+  const dir = await mkdtemp(path.join(tmpdir(), 'finish-verif-'));
+  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
+  await writeFile(path.join(dir, 'desenlace'), 'ok', 'utf8');
+  const v: Verif = {
+    dir,
+    desenlace: (d) => writeFile(path.join(dir, 'desenlace'), d, 'utf8'),
+    ejecuciones: () => (existsSync(path.join(dir, 'cuenta')) ? readFileSync(path.join(dir, 'cuenta'), 'utf8').length : 0),
+  };
+  try {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      const comando = `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')}`;
+      await writeFile(
+        path.join(repoRoot, '.taskcode', 'config.yml'),
+        opts.conComando === false ? 'rama_base: develop\n' : `comando_verificacion: "${comando}"\n`,
+        'utf8'
+      );
+      commitAll(repoRoot, 'config');
+      await fn(v, repoRoot, tareasRoot);
+    });
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+const integradaEnDevelop = (rama: string, cwd: string) =>
+  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;
+
+test('finish (puerta): con la verificacion en rojo aborta con su salida, sin merge y sin mover la tarea', async () => {
+  await conVerificacion(async (v, repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-720' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    await v.desenlace('ko');
+    const developAntes = git(['rev-parse', 'develop'], repoRoot).trim();
+    await assert.rejects(
+      () => runFinishCommand(tareasRoot, ['TASK-720'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match(e.message, /no se mergea con la verificacion en rojo/);
+        assert.match(e.message, /ERROR: 2 tests fallan/);
+        assert.match(e.message, /codigo 3|3/);
+        assert.match(e.message, /taskctl finish TASK-720 --sin-verificacion/);
+        return true;
+      }
+    );
+    assert.equal(v.ejecuciones(), 1);
+    assert.equal(git(['rev-parse', 'develop'], repoRoot).trim(), developAntes, 'develop no se ha movido');
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), task.rama);
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-720'))?.task.estado, 'en-revision');
+    assert.equal(git(['status', '--porcelain'], repoRoot), '');
+  });
+});
+
+test('finish (puerta): en verde ejecuta la verificacion SIEMPRE (aunque haya memo) y mergea; el guardian reconoce ese verde', async () => {
+  await conVerificacion(async (v, repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-721' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    // El guardian bloquea el merge directo antes de verificar...
+    const directo = `git checkout develop && git merge --no-ff ${task.rama}`;
+    assert.equal(decidirPreToolUse({ cwd: repoRoot, tool_input: { command: directo } }).codigo, 2);
+    // Un verde ya guardado para este mismo arbol no evita la ejecucion (decision D3).
+    const comando = resolverConfig(repoRoot).comando_verificacion as string;
+    const huella = huellaDelArbol(repoRoot, comando, 600);
+    assert.ok(huella);
+    guardarMemo(repoRoot, huella, { comando, estado: 'verde', codigo: 0, duracionMs: 1, timeoutS: 600, bytesTotales: 0, cola: '' });
+    const r = await runFinishCommand(tareasRoot, ['TASK-721'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    assert.equal(v.ejecuciones(), 1, 'finish ejecuta aunque haya un verde guardado');
+    assert.equal(r.cierre, 'terminada');
+    assert.ok(integradaEnDevelop(task.rama, repoRoot));
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-721'))?.task.estado, 'terminada');
+    // finish dejo el verde del commit de la rama en el memo: el merge (ya hecho) no se bloquea.
+    assert.equal(decidirPreToolUse({ cwd: repoRoot, tool_input: { command: directo } }).codigo, 0);
+  });
+});
+
+test('finish (puerta): --sin-verificacion no ejecuta, mergea y deja la anotacion commiteada en la rama ANTES del merge', async () => {
+  await conVerificacion(async (v, repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-722' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    await v.desenlace('ko');
+    const avisos: string[] = [];
+    await runFinishCommand(tareasRoot, ['TASK-722', '--sin-verificacion'], '2026-11-04', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+      ahora: '2026-11-04T10:00:00Z',
+      onAviso: (a) => avisos.push(a),
+    });
+    assert.equal(v.ejecuciones(), 0);
+    assert.ok(avisos.some((a) => /cierre con --sin-verificacion: no se ha ejecutado/.test(a)), avisos.join('\n'));
+    const fin = await readTareaFile(tareasRoot, 'TASK-722');
+    assert.equal(fin?.task.estado, 'terminada');
+    assert.match(fin?.body ?? '', /## Verificacion omitida\n\n- 2026-11-04T10:00:00Z: taskctl finish --sin-verificacion; no se ejecuto `node /);
+    // El commit de la anotacion esta en la rama de la tarea, y entro con el merge.
+    const log = git(['log', '--format=%s', task.rama], repoRoot);
+    assert.match(log.split('\n')[0] ?? '', /^chore\(TASK-722\): cierre sin verificacion$/);
+    assert.ok(integradaEnDevelop(task.rama, repoRoot));
+  });
+});
+
+test('finish (puerta): si el proceso muere tras la anotacion (script de merge roto), el rastro del salto ya esta commiteado', async () => {
+  await conVerificacion(async (_v, repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-723' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    const scriptsRotos = await mkdtemp(path.join(tmpdir(), 'finish-scripts-rotos-'));
+    try {
+      await writeFile(path.join(scriptsRotos, 'merge-feature-to-develop.sh'), 'exit 7\n', 'utf8');
+      await assert.rejects(
+        () => runFinishCommand(tareasRoot, ['TASK-723', '--sin-verificacion'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: scriptsRotos }),
+        /termino con codigo 7/
+      );
+    } finally {
+      await rm(scriptsRotos, { recursive: true, force: true });
+    }
+    assert.equal(git(['status', '--porcelain'], repoRoot), '');
+    const enRama = git(['show', `${task.rama}:tareas/03-en-revision/TASK-723/tarea.md`], repoRoot);
+    assert.match(enRama, /## Verificacion omitida/);
+  });
+});
+
+test('finish (puerta): una verificacion verde que ensucia el arbol aborta con mensaje propio, sin mergear', async () => {
+  await conVerificacion(async (v, repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-724' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    await v.desenlace('ensucia');
+    await assert.rejects(
+      () => runFinishCommand(tareasRoot, ['TASK-724'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      /salio en verde, pero ha dejado cambios en el arbol de trabajo/
+    );
+    assert.equal(integradaEnDevelop(task.rama, repoRoot), false);
+  });
+});
+
+test('finish (puerta): fuera de la rama de la tarea no verifica otro arbol: aborta y dice a que rama cambiarse', async () => {
+  await conVerificacion(async (v, repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-725' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await assert.rejects(
+      () => runFinishCommand(tareasRoot, ['TASK-725'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      new RegExp(`la rama activa es "otra", no "${task.rama.replace(/\//g, '\\/')}"`)
+    );
+    assert.equal(v.ejecuciones(), 0);
+  });
+});
+
+test('finish (puerta): no corre en el camino idempotente (los merges ya estan hechos)', async () => {
+  await conVerificacion(async (v, repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-726' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '-q', '--no-ff', '-m', 'merge a mano', task.rama], repoRoot);
+    await v.desenlace('ko');
+    const r = await runFinishCommand(tareasRoot, ['TASK-726'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    assert.equal(r.cierre, 'terminada');
+    assert.equal(v.ejecuciones(), 0);
+  });
+});
+
+test('finish (puerta): sin comando_verificacion no hay puerta, y --sin-verificacion solo avisa', async () => {
+  await conVerificacion(
+    async (v, repoRoot, tareasRoot) => {
+      const task = sampleTask({ id: 'TASK-727' });
+      await setupTaskEnRevision(repoRoot, tareasRoot, task);
+      const avisos: string[] = [];
+      await runFinishCommand(tareasRoot, ['TASK-727', '--sin-verificacion'], '2026-11-04', {
+        repoCwd: repoRoot,
+        scriptsDir: SCRIPTS_DIR,
+        onAviso: (a) => avisos.push(a),
+      });
+      assert.equal(v.ejecuciones(), 0);
+      assert.ok(avisos.some((a) => /no declara comando_verificacion/.test(a)));
+      assert.doesNotMatch((await readTareaFile(tareasRoot, 'TASK-727'))?.body ?? '', /Verificacion omitida/);
+    },
+    { conComando: false }
+  );
+});
+
+test('anotarVerificacionOmitida: crea la seccion al final y en un reintento anade la linea dentro de ella', () => {
+  const uno = anotarVerificacionOmitida('## Objetivo\nx\n', '2026-11-04T10:00:00Z', 'npm `test`');
+  assert.equal(uno, "## Objetivo\nx\n\n## Verificacion omitida\n\n- 2026-11-04T10:00:00Z: taskctl finish --sin-verificacion; no se ejecuto `npm 'test'`\n");
+  const dos = anotarVerificacionOmitida(`${uno}\n## Transiciones\n\n| a |\n`, '2026-11-05T10:00:00Z', 'npm test');
+  const lineas = dos.split('\n');
+  const i = lineas.indexOf('## Verificacion omitida');
+  assert.match(lineas[i + 3] ?? '', /^- 2026-11-05T10:00:00Z/);
+  assert.ok(dos.indexOf('2026-11-05') < dos.indexOf('## Transiciones'));
+  assert.equal(anotarVerificacionOmitida('a\r\n', 'f', 'c'), 'a\r\n\r\n## Verificacion omitida\r\n\r\n- f: taskctl finish --sin-verificacion; no se ejecuto `c`\r\n');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
new file mode 100644
index 0000000..0660295
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
@@ -0,0 +1,301 @@
+/**
+ * Guardian de merges (TASK-072, capa 2). El analizador de comandos es puro y
+ * se prueba con texto; la decision, contra repos Git temporales de verdad con
+ * develop, main y una rama de trabajo, y con el memo escrito por la misma
+ * funcion que usa produccion. El punto de entrada se prueba ademas como
+ * proceso, con el JSON por stdin, igual que lo lanza Claude Code.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { analizarComando, segmentar } from '../../src/core/comando-merge.js';
+import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
+import { guardarMemo, huellaDeCommit, huellaDelArbol } from '../../src/fs/verificacion.js';
+import type { ResultadoVerificacion } from '../../src/core/informe-verificacion.js';
+import { git } from '../helpers/finish-fixtures.js';
+
+const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
+const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'pre-tool-merge.js');
+const COMANDO = 'node --version';
+const RAMA = 'feature/task-900-trabajo';
+
+// ---------------------------------------------------------------------
+// Analizador (puro)
+// ---------------------------------------------------------------------
+
+test('comando-merge: segmenta por operadores y respeta comillas y rutas de Windows', () => {
+  assert.deepEqual(segmentar('git checkout develop && git merge "feature/x y"'), [
+    ['git', 'checkout', 'develop'],
+    ['git', 'merge', 'feature/x y'],
+  ]);
+  assert.deepEqual(segmentar("a; b | c || d & e\nf (g)"), [['a'], ['b'], ['c'], ['d'], ['e'], ['f'], ['g']]);
+  assert.deepEqual(segmentar('C:\\Git\\bin\\git.exe merge x'), [['C:\\Git\\bin\\git.exe', 'merge', 'x']]);
+});
+
+test('comando-merge: detecta merges, su destino por checkout/switch y los scripts de cierre', () => {
+  assert.deepEqual(analizarComando('git merge --no-ff -m "cierre" feature/x'), [
+    { tipo: 'merge', fuentes: ['feature/x'], destino: null, dir: null },
+  ]);
+  assert.deepEqual(analizarComando('git checkout develop && git merge feature/x'), [
+    { tipo: 'merge', fuentes: ['feature/x'], destino: 'develop', dir: null },
+  ]);
+  assert.deepEqual(analizarComando('cd repo && git -C ../otro -c core.x=1 switch main; git merge -s ort a b'), [
+    { tipo: 'merge', fuentes: ['a', 'b'], destino: 'main', dir: null },
+  ]);
+  assert.deepEqual(analizarComando('git -C ../otro merge x'), [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: '../otro' }]);
+  assert.deepEqual(analizarComando('C:\\Git\\bin\\git.exe merge x')[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null });
+  assert.deepEqual(analizarComando('FOO=1 git merge x')[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null });
+  assert.deepEqual(analizarComando('git merge'), [{ tipo: 'merge', fuentes: [], destino: null, dir: null }]);
+  assert.deepEqual(analizarComando('bash scripts/gitflow/merge-feature-to-develop.sh feature/x --develop develop'), [
+    { tipo: 'script', script: 'merge-feature-to-develop.sh', fuente: 'feature/x', destinos: ['integracion'] },
+  ]);
+  assert.deepEqual(analizarComando('& sh ./merge-hotfix-to-main.sh hotfix/y'), [
+    { tipo: 'script', script: 'merge-hotfix-to-main.sh', fuente: 'hotfix/y', destinos: ['main', 'integracion'] },
+  ]);
+  // checkout -b crea una rama de trabajo: el destino es ella.
+  assert.equal((analizarComando('git checkout -b nueva develop && git merge x')[0] as { destino: string }).destino, 'nueva');
+  // Restaurar ficheros no cambia de rama.
+  assert.equal((analizarComando('git checkout develop -- f.txt && git merge x')[0] as { destino: null }).destino, null);
+});
+
+test('comando-merge: lo que no es un merge nuevo no aparece', () => {
+  for (const c of [
+    'git status',
+    'git merge-base develop feature/x',
+    'git merge-base --is-ancestor a b',
+    'git config merge.ff false',
+    'git merge --abort',
+    'git merge --continue',
+    'git merge --quit',
+    'echo "git merge develop"',
+    'echo git merge develop',
+    'git log --grep merge',
+    'git commit -m "merge de cosas"',
+    'taskctl finish TASK-001 --merge-request',
+    'cat scripts/gitflow/merge-feature-to-develop.sh',
+    'bash abort-merge.sh',
+  ]) {
+    assert.deepEqual(analizarComando(c), [], c);
+  }
+});
+
+// ---------------------------------------------------------------------
+// Decision, contra repos reales
+// ---------------------------------------------------------------------
+
+interface Repo {
+  raiz: string;
+  limpiar(): Promise<void>;
+}
+
+const VERDE: ResultadoVerificacion = { comando: COMANDO, estado: 'verde', codigo: 0, duracionMs: 5, timeoutS: 600, bytesTotales: 0, cola: '' };
+const ROJO: ResultadoVerificacion = { ...VERDE, estado: 'roja', codigo: 1 };
+
+async function montar(config = `comando_verificacion: "${COMANDO}"\n`): Promise<Repo> {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'guardia-merge-'));
+  git(['init', '-q', '-b', 'main'], raiz);
+  git(['config', 'user.email', 'test@example.com'], raiz);
+  git(['config', 'user.name', 'Test'], raiz);
+  await mkdir(path.join(raiz, '.taskcode'));
+  await writeFile(path.join(raiz, '.taskcode', 'config.yml'), config, 'utf8');
+  await writeFile(path.join(raiz, 'README.md'), 'x\n', 'utf8');
+  git(['add', '-A'], raiz);
+  git(['commit', '-q', '-m', 'inicial'], raiz);
+  git(['branch', 'develop'], raiz);
+  git(['checkout', '-q', '-b', RAMA, 'develop'], raiz);
+  await writeFile(path.join(raiz, 'trabajo.txt'), 'trabajo\n', 'utf8');
+  git(['add', '-A'], raiz);
+  git(['commit', '-q', '-m', 'trabajo'], raiz);
+  return { raiz, limpiar: () => rm(raiz, { recursive: true, force: true }) };
+}
+
+async function conRepo(fn: (r: Repo) => Promise<void>, config?: string): Promise<void> {
+  const r = await montar(config);
+  try {
+    await fn(r);
+  } finally {
+    await r.limpiar();
+  }
+}
+
+function decide(raiz: string, command: string) {
+  return decidirPreToolUse({ cwd: raiz, tool_name: 'Bash', tool_input: { command } });
+}
+
+function memorizar(raiz: string, ref: string, r: ResultadoVerificacion, timeoutS = 600): void {
+  const h = huellaDeCommit(raiz, ref, COMANDO, timeoutS);
+  assert.ok(h);
+  guardarMemo(raiz, h, r);
+}
+
+test('guardia: bloquea un merge hacia develop o main sin verde del commit que entra', async () => {
+  await conRepo(async ({ raiz }) => {
+    // Desde la rama de trabajo, cambiando de rama en el mismo comando.
+    let d = decide(raiz, `git checkout develop && git merge --no-ff -m "x" ${RAMA}`);
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr, /Merge bloqueado: "feature\/task-900-trabajo" \([0-9a-f]{10}\) entraria en "develop"/);
+    assert.match(d.stderr, /no consta una verificacion en verde/);
+    assert.match(d.stderr, /taskctl finish TASK-NNN/);
+    assert.match(d.stderr, /--sin-verificacion/);
+    assert.equal(decide(raiz, `cd . && git switch main && git merge ${RAMA}`).codigo, 2);
+    assert.equal(decide(raiz, `bash scripts/gitflow/merge-feature-to-develop.sh ${RAMA} --develop develop`).codigo, 2);
+    // Estando ya en develop / main (la rama actual es el destino).
+    git(['checkout', '-q', 'develop'], raiz);
+    d = decide(raiz, `git merge ${RAMA}`);
+    assert.equal(d.codigo, 2);
+    git(['checkout', '-q', 'main'], raiz);
+    assert.equal(decide(raiz, `git merge ${RAMA}`).codigo, 2);
+    // PowerShell: misma decision.
+    assert.equal(
+      decidirPreToolUse({ cwd: raiz, tool_name: 'PowerShell', tool_input: { command: `git merge ${RAMA}` } }).codigo,
+      2
+    );
+    // Nada se ha mergeado: el hook solo decide.
+    assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', RAMA, 'develop'], { cwd: raiz }).status, 1);
+  });
+});
+
+test('guardia: con un verde guardado del commit fuente deja pasar; con un rojo guardado bloquea y lo dice', async () => {
+  await conRepo(async ({ raiz }) => {
+    memorizar(raiz, RAMA, ROJO);
+    const d = decide(raiz, `git checkout develop && git merge ${RAMA}`);
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr, /la ultima verificacion de ese commit NO salio en verde/);
+    memorizar(raiz, RAMA, VERDE);
+    assert.deepEqual(decide(raiz, `git checkout develop && git merge ${RAMA}`), { codigo: 0, stderr: '' });
+    // El verde es del commit: un commit nuevo en la rama vuelve a bloquear.
+    await writeFile(path.join(raiz, 'trabajo.txt'), 'mas trabajo\n', 'utf8');
+    git(['commit', '-q', '-am', 'mas'], raiz);
+    assert.equal(decide(raiz, `git checkout develop && git merge ${RAMA}`).codigo, 2);
+  });
+});
+
+test('guardia: el verde que deja una verificacion con el arbol limpio (huellaDelArbol) vale para el commit', async () => {
+  await conRepo(async ({ raiz }) => {
+    const h = huellaDelArbol(raiz, COMANDO, 600);
+    assert.equal(h, huellaDeCommit(raiz, RAMA, COMANDO, 600), 'arbol limpio: misma huella que el commit');
+    guardarMemo(raiz, h as string, VERDE);
+    assert.equal(decide(raiz, `git checkout develop && git merge ${RAMA}`).codigo, 0);
+  });
+});
+
+test('guardia (criterio 3): no bloquea lecturas, merges hacia ramas de trabajo ni lo que no es un merge nuevo', async () => {
+  await conRepo(async ({ raiz }) => {
+    git(['checkout', '-q', 'develop'], raiz);
+    for (const c of [
+      'git status',
+      'git log --oneline',
+      'git diff develop',
+      'git show HEAD',
+      'git branch -a',
+      `git merge-base develop ${RAMA}`,
+      'git config merge.ff false',
+      'git merge --abort',
+      'git merge --continue',
+      'git merge --quit',
+      'echo "git merge develop"',
+    ]) {
+      assert.deepEqual(decide(raiz, c), { codigo: 0, stderr: '' }, c);
+    }
+    // Hacia una rama de trabajo: develop entra en la feature.
+    assert.equal(decide(raiz, `git checkout ${RAMA} && git merge develop`).codigo, 0);
+    git(['checkout', '-q', RAMA], raiz);
+    assert.equal(decide(raiz, 'git merge develop').codigo, 0);
+    assert.equal(decide(raiz, 'git checkout -b otra develop && git merge main').codigo, 0);
+  });
+});
+
+test('guardia: deja pasar lo ya integrado (backmerge de recuperacion de un hotfix ya en main)', async () => {
+  await conRepo(async ({ raiz }) => {
+    git(['checkout', '-q', '-b', 'hotfix/task-901-x', 'main'], raiz);
+    await writeFile(path.join(raiz, 'arreglo.txt'), 'x\n', 'utf8');
+    git(['add', '-A'], raiz);
+    git(['commit', '-q', '-m', 'arreglo'], raiz);
+    git(['checkout', '-q', 'main'], raiz);
+    git(['merge', '-q', '--no-ff', '-m', 'merge a main', 'hotfix/task-901-x'], raiz);
+    // Lo que pide finish cuando falta el backmerge.
+    assert.equal(decide(raiz, 'git checkout develop && git merge --no-ff hotfix/task-901-x').codigo, 0);
+    // Y un merge que no trae nada nuevo (main ya en develop).
+    git(['checkout', '-q', 'develop'], raiz);
+    git(['merge', '-q', '--no-ff', '-m', 'bm', 'main'], raiz);
+    assert.equal(decide(raiz, 'git merge main').codigo, 0);
+  });
+});
+
+test('guardia: la rama de integracion sale de rama_base, no del literal develop', async () => {
+  await conRepo(
+    async ({ raiz }) => {
+      git(['branch', 'integ', 'develop'], raiz);
+      assert.equal(decide(raiz, `git checkout integ && git merge ${RAMA}`).codigo, 2);
+      assert.equal(decide(raiz, `git checkout develop && git merge ${RAMA}`).codigo, 0, 'develop es aqui una rama mas');
+    },
+    `comando_verificacion: "${COMANDO}"\nrama_base: integ\n`
+  );
+});
+
+test('guardia: sin comando_verificacion, fuera de un repo o con entrada rara, deja pasar', async () => {
+  await conRepo(async ({ raiz }) => {
+    git(['checkout', '-q', 'develop'], raiz);
+    assert.equal(decide(raiz, `git merge ${RAMA}`).codigo, 0);
+  }, 'rama_base: develop\n');
+  const fuera = await mkdtemp(path.join(tmpdir(), 'guardia-fuera-'));
+  try {
+    assert.equal(decide(fuera, 'git merge x').codigo, 0);
+  } finally {
+    await rm(fuera, { recursive: true, force: true });
+  }
+  assert.equal(decidirPreToolUse({}).codigo, 0);
+  assert.equal(decidirPreToolUse({ cwd: 'Z:/no/existe', tool_input: { command: 'git merge x' } }).codigo, 0);
+  assert.equal(decidirPreToolUse({ cwd: tmpdir(), tool_input: 'git merge x' }).codigo, 0);
+});
+
+test('guardia: una fuente que no resuelve a un commit hacia develop bloquea (no se puede comprobar)', async () => {
+  await conRepo(async ({ raiz }) => {
+    const d = decide(raiz, 'git checkout develop && git merge no-existe');
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr, /no se puede resolver "no-existe"/);
+  });
+});
+
+test('guardia: el punto de entrada real decide por stdin (0 / 2) y nunca sale con 1', async () => {
+  assert.ok(existsSync(ENTRADA_HOOK), 'compilado en dist/src');
+  await conRepo(async ({ raiz }) => {
+    const lanzar = (command: string) =>
+      spawnSync(process.execPath, [ENTRADA_HOOK], {
+        input: JSON.stringify({ cwd: raiz, tool_name: 'Bash', tool_input: { command }, hook_event_name: 'PreToolUse' }),
+        encoding: 'utf8',
+      });
+    const bloqueo = lanzar(`git checkout develop && git merge ${RAMA}`);
+    assert.equal(bloqueo.status, 2);
+    assert.match(bloqueo.stderr, /Merge bloqueado/);
+    const pasa = lanzar('git status');
+    assert.equal(pasa.status, 0);
+    assert.equal(pasa.stderr, '');
+    const basura = spawnSync(process.execPath, [ENTRADA_HOOK], { input: 'basura merge', encoding: 'utf8' });
+    assert.equal(basura.status, 0);
+  });
+});
+
+test('guardia: hooks.json declara el PreToolUse sin filtro if, en forma exec, sin la sonda y sin nombrar el producto', () => {
+  const j = JSON.parse(readFileSync(path.join(RAIZ_PLUGIN, 'hooks', 'hooks.json'), 'utf8')) as {
+    description: string;
+    hooks: { PreToolUse: { matcher: string; hooks: { type: string; command: string; args: string[]; timeout: number; if?: string }[] }[] };
+  };
+  assert.equal(j.hooks.PreToolUse.length, 1);
+  const pre = j.hooks.PreToolUse[0];
+  assert.ok(pre);
+  assert.equal(pre.matcher, 'Bash|PowerShell');
+  assert.equal(pre.hooks.length, 1);
+  const h = pre.hooks[0];
+  assert.ok(h);
+  assert.equal(h.if, undefined, 'sin if: el de prefijo no ve los comandos compuestos');
+  assert.equal(h.command, 'node');
+  assert.deepEqual(h.args, ['${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/pre-tool-merge.js']);
+  assert.equal(h.timeout, 30);
+  assert.doesNotMatch(JSON.stringify(j), /sonda/);
+  assert.doesNotMatch(j.description, /taskcode|TASK-\d/i);
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
tareas/{01-en-diseno => 02-en-curso}/TASK-072/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-072/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-072/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-072/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-072/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-072/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-072/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-opciones.js                            |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        |  96 ++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  21 ++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js                                  | 200 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                   |  29 ++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     |  16 +++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                 | 181 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/pre-tool-merge.js                                |  28 ++++++++++++
 16 files changed, 574 insertions(+), 6 deletions(-)
````
