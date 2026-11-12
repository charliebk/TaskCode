# Peticion de revision — TASK-123 (ronda 1)

- Tarea: TASK-123 — F-16: finish no cierra sin verificar tras un merge a mano o un conflicto
- Rama revisada: fix/task-123-f-16-finish-no-cierra-sin-verificar-tras
- Rama base: develop
- Commit revisado (HEAD): a0068d0bb68998b83f145ec900f544b8286f7b65
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-123 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-123/tarea.md
- tareas/03-en-revision/TASK-123/planificacion/
- CHANGELOG.md
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-reintento.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Commits a revisar (git log develop..HEAD)

````
a0068d0 update(fix): develop -> fix/task-123-f-16-finish-no-cierra-sin-verificar-tras
d24c553 docs(TASK-123): autorrevision
5534695 fix(TASK-123): verificar-impacto no pasa RAMA_BASE a los tests que lanza
86666d0 test(TASK-123): el texto del guardian con el remedio completo
4b3265b build(TASK-123): dist regenerado
6b878a8 docs(TASK-123): remedio de conflicto en finish, guia, README y CHANGELOG
9ac4cab fix(TASK-123): el guardian bloquea el commit que cierra un merge en una rama protegida
20fc949 fix(TASK-123): el reintento de finish verifica la rama de integracion antes de cerrar
d27c9da chore(TASK-123): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 137ad45..7ab82c3 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -18,6 +18,20 @@
 
 ## Siguiente version — sin publicar
 
+Fix F-16 (TASK-123, critico): `finish` ya no cierra sin verificar cuando la rama
+de la tarea ya esta integrada (un merge a mano en la rama de integracion, o el
+commit que cerro alli un conflicto de `finish`). Con `comando_verificacion`, ese
+reintento verifica el arbol de la rama de integracion antes de cerrar, con la
+misma decision proporcional y reutilizando un verde del mismo arbol; en rojo
+aborta sin mover la tarea, vuelve a la rama de partida y dice que hacer.
+`--sin-verificacion` lo salta y lo anota en `## Verificacion omitida`. El
+guardian de merges trata un `git commit` (o `git merge --continue`) con
+`MERGE_HEAD` en la rama de integracion o la principal como el merge que cierra y
+lo bloquea sin un verde del arbol que se commitea; en una rama de tarea o sin
+merge en curso no se toca. El mensaje de conflicto de `finish`, el guardian y la
+guia proponen el remedio: `taskctl abort-merge`, integrar la base en la rama de
+la tarea, resolver alli y relanzar `finish` desde ella.
+
 Verificacion proporcional, parte A1 (TASK-100, primera de las tres en que se
 trocea TASK-096). Claves nuevas opcionales `rutas_documentacion` (patrones
 `git :(glob)`, sin anclar) y `comando_verificacion_documentacion`: si todo lo
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index c5b30a1..aba7f13 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -413,6 +413,9 @@ function main(argv) {
     // se tomaria por un subtest y no imprimiria su informe.
     const env = { ...process.env };
     delete env.NODE_TEST_CONTEXT;
+    // RAMA_BASE es para elegir la seleccion, no para los tests: un test que la herede
+    // cambia de comportamiento (el freno Stop siempre la pasa a la selectiva).
+    delete env.RAMA_BASE;
     const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...objetivos], {
       cwd: dirPlugin,
       env,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index c7d77ce..78fefc3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -1032,8 +1032,9 @@ rutas_verificacion_parcial: [src/web/**]          # lista de rutas permitidas
 - El **guardián de merges sigue exigiendo la completa para el código**: un merge
   a mano de una tarea con código queda bloqueado sin su verde, aunque a `finish`
   le bastara la selectiva. Si `finish` choca en un conflicto, no repitas el
-  merge a mano ni lo cierres en la rama de integración (un `finish` relanzado
-  sobre un merge ya cerrado no vuelve a verificar): abórtalo con
+  merge a mano ni lo cierres en la rama de integración (el guardián bloquea el
+  commit que lo cerraría, y un `finish` relanzado sobre ese merge verifica la
+  rama de integración y en rojo no cierra): abórtalo con
   `taskctl abort-merge`, integra la base en la rama de la tarea, resuelve allí y
   vuelve a lanzar `taskctl finish` desde ella.
 - Sin la clave, todo funciona como antes.
@@ -1121,9 +1122,14 @@ reutiliza un verde guardado, porque la huella no ve los ficheros ignorados.
 - **Verde que ensucia el árbol** (compilados, cobertura no ignorados): aborta con
   un mensaje propio antes de que el script de Git-Flow lo haga por workspace sucio.
 - Hay que lanzarlo **desde la rama de la tarea**: es el árbol que se verifica.
-- **No corre** en el segundo `finish --merge-request` (la plataforma ya mergeó)
-  ni en el camino idempotente (los merges ya están hechos): ahí solo bloquearía
-  lo hecho.
+- **No corre** en el segundo `finish --merge-request` (la plataforma ya mergeó).
+- **En el camino idempotente** (la rama ya integrada: un merge a mano, o el
+  commit que cerró un conflicto en la rama de integración) verifica el árbol de
+  la rama de integración antes de cerrar (TASK-123), con la misma decisión
+  proporcional (documentación, selectiva o completa, sobre lo que entró con la
+  tarea) y reutilizando un verde del mismo árbol. En rojo aborta sin mover la
+  tarea, vuelve a la rama de partida y dice cómo arreglarlo; `--sin-verificacion`
+  la salta y lo anota en `## Verificacion omitida`.
 - `--sin-verificacion` la salta y lo deja escrito en `tarea.md`, sección
   `## Verificacion omitida`, con un commit en la rama de la tarea **antes** del
   merge: el rastro sobrevive aunque el proceso muera después.
@@ -1243,6 +1249,15 @@ rama de integración (`rama_base`) o en la principal:
 - **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
   guardado para el commit que entra** —sin verde cuenta como no verde— y remite
   a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
+- **Bloquea el commit que cierra un merge en curso** (TASK-123): un `git commit`
+  (también `git commit -am`, `git add … && git commit`) o `git merge --continue`
+  con `MERGE_HEAD` presente en la rama de integración o la principal es el merge
+  hacia ella, y lo que se commitea es la resolución, no lo verificado en la rama
+  de la tarea. Pasa solo con un verde guardado de ese mismo árbol (el del freno
+  `Stop`) o si lo que entra ya está integrado. Propone `taskctl abort-merge`,
+  integrar la base en la rama de la tarea, resolver allí y relanzar `finish`
+  desde ella. Sin `MERGE_HEAD`, o en una rama de tarea (que es justo el
+  remedio), no se toca.
 - **Bloquea siempre si `.taskcode/config.yml` existe pero no se puede leer**
   (un valor inválido de cualquier clave) y el destino es `develop`, `main` o
   `master` —lista fija, porque sin config no se sabe `rama_base`—, aunque lo
@@ -1250,7 +1265,7 @@ rama de integración (`rama_base`) o en la principal:
   (`taskctl doctor` lo valida) y se repite el merge. Una config mal escrita no
   desactiva el guardián. *Cambia el comportamiento de la 0.14.0*, que dejaba
   pasar.
-- **Deja pasar** si el texto no contiene `merge` (sale sin cargar nada),
+- **Deja pasar** si el texto no contiene `merge` ni `commit` (sale sin cargar nada),
   `merge --abort|--continue|--quit|--skip` como opción (no como el valor de
   otra: `git merge -m --abort x` o `--message --abort x` sí mergean `x` y se
   evalúan), `merge-base`,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 111dde6..6a446fc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -201,10 +201,10 @@ al terminar: el freno solo bloquea una vez por turno. Con
 `comando_verificacion_selectiva`, el `Stop` y `review` corren esa: [verificacion-selectiva.md](verificacion-selectiva.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
-`taskctl finish` verifica antes de mergear y aborta en rojo. Un `git merge` o
-script de cierre hacia la rama de integracion o la principal sin verde del
-commit que entra queda bloqueado: cierra con `taskctl finish` desde la rama de
-la tarea; si choca, abortalo y resuelve en ella. Con
+`taskctl finish` verifica antes de mergear y aborta en rojo. Un merge (o el
+commit que lo cierra) hacia la de integracion o la principal sin verde se
+bloquea: cierra con `taskctl finish` desde la rama de la tarea; si choca,
+`taskctl abort-merge`, integra la base en ella y relanza `finish`. Con
 `rutas_verificacion_parcial`, `finish` puede integrar con la selectiva; un
 merge a mano no. `--sin-verificacion` lo decide la persona, no tu.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 2e655f6..2835180 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -216,8 +216,9 @@ rutas_verificacion_parcial: [src/web/**]     # lista de rutas permitidas
   `git merge` a mano de una tarea con codigo queda bloqueado sin un verde de
   la completa de ese commit, aunque a `finish` le bastara la selectiva. Por
   eso, si `finish` choca en un conflicto, no repitas el merge a mano ni lo
-  cierres en la rama de integracion: un `finish` relanzado sobre un merge ya
-  cerrado no vuelve a verificar. Abortalo (`taskctl abort-merge`), integra la
+  cierres en la rama de integracion: el guardian bloquea el commit que lo
+  cerraria, y un `finish` relanzado sobre ese merge verifica la rama de
+  integracion y en rojo no cierra. Abortalo (`taskctl abort-merge`), integra la
   base en la rama de la tarea, resuelve alli el conflicto y vuelve a lanzar
   `taskctl finish` desde la rama de la tarea, que verifica y mergea por su
   cuenta. Un merge a mano de solo documentacion se rige por la seccion
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index fbabe9b..b9cfb2e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -4,9 +4,10 @@
  * Con `comando_verificacion` declarado, `finish` lo ejecuta SIEMPRE antes de
  * mergear o de abrir el merge request (decision de Carlos: no reutiliza el
  * memo, que no ve los ficheros ignorados) y aborta con el informe si no sale
- * en verde. Solo corre en los caminos que van a integrar algo: ni en el
- * segundo `finish --merge-request` (la plataforma ya mergeo) ni en el camino
- * idempotente (los merges ya estan hechos), donde solo bloquearia lo hecho.
+ * en verde. Solo corre en los caminos que van a integrar algo: no en el
+ * segundo `finish --merge-request` (la plataforma ya mergeo). En el camino
+ * idempotente (la rama ya integrada a mano, o tras cerrar un conflicto) corre
+ * `puertaReintento` sobre el arbol de la rama de integracion (TASK-123).
  *
  * `--sin-verificacion` la salta y lo deja escrito en la tarea. La anotacion
  * se COMMITEA en la rama de la tarea ANTES del merge: asi viaja con el merge
@@ -41,6 +42,7 @@
  * la base invalida), la completa de siempre.
  */
 import path from 'node:path';
+import { spawnSync } from 'node:child_process';
 import { writeFile } from 'node:fs/promises';
 import { resolverConfig } from '../core/config.js';
 import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
@@ -389,3 +391,120 @@ async function puertaSelectiva(
   );
   return { resultado: { tipo: 'selectiva', comando: decision.comando, motivo: decision.motivo, deMemo: v.deMemo }, tarea };
 }
+
+// ---------------------------------------------------------------------
+// TASK-123 (F-16): la via de reintento, con la rama ya integrada.
+// ---------------------------------------------------------------------
+
+export interface PuertaReintentoOpts {
+  id: string;
+  /** La rama de la tarea, ya integrada en la de integracion. */
+  rama: string;
+  /** La rama de integracion: tiene que ser la activa (se verifica su arbol). */
+  ramaIntegracion: string;
+  sinVerificacion: boolean;
+  cwd: string;
+  /** Falso en un hotfix (integra en la principal) y en un release (siempre la completa). */
+  permitirSelectiva: boolean;
+  /** Un release lleva a la principal todo lo acumulado: siempre la completa. */
+  siempreCompleta: boolean;
+  onAviso?: (aviso: string) => void;
+  timeoutMs?: number;
+  entornoVerificacion?: () => NodeJS.ProcessEnv;
+}
+
+export type ResultadoReintento =
+  | { tipo: 'sin-comando' }
+  | { tipo: 'omitida'; comando: string }
+  | { tipo: 'verde'; que: 'completa' | 'selectiva' | 'documentacion'; deMemo: boolean };
+
+function gitOut(args: readonly string[], cwd: string): string | null {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
+  if (r.error !== undefined || r.status !== 0) return null;
+  return (r.stdout ?? '').trim();
+}
+
+/**
+ * El commit de la rama de integracion justo antes de que entrara la tarea: el
+ * primero de su historia de primeros padres que no desciende de la rama. Es la
+ * base de la decision proporcional (lo que entro con la tarea, su resolucion y
+ * lo que vino despues). null si no se puede saber (p. ej. un fast-forward, en el
+ * que los commits de la tarea son la propia historia): entonces la completa.
+ */
+function baseAntesDeIntegrar(rama: string, cwd: string): string | null {
+  const punta = gitOut(['rev-parse', '--verify', '--quiet', '--end-of-options', `${rama}^{commit}`], cwd);
+  const primeros = gitOut(['rev-list', '--first-parent', 'HEAD'], cwd);
+  const descendientes = gitOut(['rev-list', '--ancestry-path', `${rama}..HEAD`], cwd);
+  if (punta === null || primeros === null || descendientes === null) return null;
+  const nuevos = new Set(descendientes.split('\n').filter((l) => l !== ''));
+  const base = primeros.split('\n').find((c) => c !== '' && !nuevos.has(c));
+  return base === undefined || base === punta ? null : base;
+}
+
+/**
+ * TASK-123: la rama de la tarea ya esta integrada (un merge a mano, o el que
+ * cerro un conflicto de `finish`), asi que lo que se integro no paso por la
+ * puerta. Con `comando_verificacion`, antes de cerrar se verifica el arbol de la
+ * rama de integracion (donde ya esta el merge y su resolucion), con la misma
+ * decision proporcional que la puerta normal y reutilizando un verde del mismo
+ * arbol si consta en el memo. Lanza FinishCommandError en rojo, sin haber tocado
+ * la tarea. Con `--sin-verificacion` no corre nada: quien llama lo anota en el
+ * commit de cierre.
+ */
+export function puertaReintento(o: PuertaReintentoOpts): ResultadoReintento {
+  const config = resolverConfig(o.cwd);
+  const comando = config.comando_verificacion;
+  if (comando === null) return { tipo: 'sin-comando' };
+  if (o.sinVerificacion) {
+    o.onAviso?.(
+      `${o.id}: cierre con ${FLAG_SIN_VERIFICACION}: la rama ya estaba integrada en "${o.ramaIntegracion}" y no se ` +
+        `ha ejecutado "${comando}" sobre ella. Queda anotado en tarea.md (seccion "Verificacion omitida").`
+    );
+    return { tipo: 'omitida', comando };
+  }
+
+  const opciones = {
+    ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
+    ...(o.entornoVerificacion === undefined ? {} : { env: o.entornoVerificacion() }),
+  };
+  const base = o.siempreCompleta ? null : baseAntesDeIntegrar(o.rama, o.cwd);
+  const r = base === null ? null : decidirVerificacionEntre(base, 'HEAD', o.cwd);
+  const d = r !== null && r.tipo === 'decision' ? r : null;
+  let peticion: { tipo: 'completa' | 'selectiva' | 'documentacion'; comando: string; timeoutS: number; base?: string } | null = {
+    tipo: 'completa',
+    comando,
+    timeoutS: config.timeout_verificacion,
+  };
+  if (d !== null && d.decision.tipo === 'documentacion') {
+    peticion = d.decision.comando === null ? null : { tipo: 'documentacion', comando: d.decision.comando, timeoutS: d.timeoutS };
+  } else if (d !== null && d.decision.tipo === 'selectiva' && o.permitirSelectiva) {
+    peticion = { tipo: 'selectiva', comando: d.decision.comando, timeoutS: d.timeoutSelectivaS, base: base as string };
+  }
+
+  o.onAviso?.(
+    `${o.id}: la rama ya esta integrada en "${o.ramaIntegracion}" (merge hecho fuera de finish o conflicto resuelto ` +
+      'alli): se verifica el arbol de la rama de integracion antes de cerrar.'
+  );
+  if (peticion === null) return { tipo: 'verde', que: 'documentacion', deMemo: false };
+  const v = verificarConMemo(o.cwd, { ...peticion, memoSoloVerde: true }, opciones);
+  if (v.resultado.estado !== 'verde') {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la rama ya esta integrada en "${o.ramaIntegracion}", pero la verificacion de su arbol no sale ` +
+        `en verde (${peticion.tipo === 'completa' ? 'comando_verificacion' : `la ${peticion.tipo}`}): no se cierra la ` +
+        'tarea, que no se ha movido de carpeta.\n' +
+        `${formatearVerificacionRoja(v.resultado)}\n` +
+        `Arregla "${o.ramaIntegracion}": en la rama de la tarea, integra la base (git merge ${o.ramaIntegracion}), ` +
+        `corrige alli hasta que la verificacion salga en verde, commitea y relanza taskctl finish ${o.id} desde ` +
+        `ella. Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
+        'lo deja anotado en la tarea.'
+    );
+  }
+  if (!isWorkspaceClean(o.cwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la verificacion salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
+        `("${peticion.comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en ` +
+        '.gitignore, o descartalos, y reintenta. La tarea no se ha movido de carpeta.'
+    );
+  }
+  return { tipo: 'verde', que: peticion.tipo, deMemo: v.deMemo };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 7bf2f52..59d12ae 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -51,7 +51,7 @@ import { parseTareaFile } from '../core/tarea-file.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
-import { registrarTransicion } from '../core/transiciones.js';
+import { anotarVerificacionOmitida, registrarTransicion } from '../core/transiciones.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { resolverConfig } from '../core/config.js';
 import { INFORME_CODEX_RE, INFORME_REVISION_RE, ultimaRondaAprobada } from '../fs/rondas.js';
@@ -86,7 +86,7 @@ import {
 } from '../fs/git-commit.js';
 import { conProgreso, crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
-import { extraerSinVerificacion, puertaVerificacion } from './finish-verificacion.js';
+import { extraerSinVerificacion, puertaReintento, puertaVerificacion, type ResultadoReintento } from './finish-verificacion.js';
 import { puertaHeldout } from './finish-heldout.js';
 import { puertaCobertura } from './finish-cobertura.js';
 import { runBoardCommand, boardFilePath } from './board.js';
@@ -558,8 +558,10 @@ async function runFinish(
   // fue el script de hotfix/release quien creo el tag.
   let commitParaTag: string | null = null;
   let tagLoPusoElScript = false;
+  // TASK-123: lo que decidio la verificacion de la via de reintento, si se paso por ella.
+  let reintento: ResultadoReintento | null = null;
 
-  if (integradaPorMergeRequest || (integradaEnDevelop && integradaEnMain)) progreso.paso('merge');
+  if (integradaPorMergeRequest) progreso.paso('merge');
   if (integradaPorMergeRequest) {
     const integrado = (mrCtx as ContextoMergeRequest).estado as Extract<EstadoMergeRequest, { tipo: 'integrado' }>;
     commitParaTag = traerIntegracionDeLaPlataforma({
@@ -580,9 +582,34 @@ async function runFinish(
     if (nombreTag !== null) {
       commitParaTag = comprobarTagDeReintento(id, tipo, rama, mainBranch ?? ramaIntegracion, mainBranch !== null, nombreTag, deps.repoCwd);
     }
-    if (currentBranch(deps.repoCwd) !== ramaIntegracion) {
+    const origen = currentBranch(deps.repoCwd);
+    if (origen !== ramaIntegracion) {
       checkoutBranch(ramaIntegracion, deps.repoCwd);
     }
+    // TASK-123 (F-16): lo integrado no paso por la puerta (merge a mano, o el
+    // commit que cerro un conflicto de finish): se verifica el arbol de la rama
+    // de integracion antes de cerrar. En rojo, de vuelta a la rama de partida.
+    progreso.paso('verificacion');
+    try {
+      reintento = puertaReintento({
+        id,
+        rama,
+        ramaIntegracion,
+        sinVerificacion,
+        cwd: deps.repoCwd,
+        permitirSelectiva: tipo !== 'hotfix' && tipo !== 'release',
+        siempreCompleta: tipo === 'release',
+        ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
+        ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+        entornoVerificacion: () => entornoConContador(process.env, progreso.contador()),
+      });
+    } catch (e: unknown) {
+      if (origen !== '' && origen !== ramaIntegracion && isWorkspaceClean(deps.repoCwd)) {
+        checkoutBranch(origen, deps.repoCwd);
+      }
+      throw e;
+    }
+    progreso.paso('merge');
   } else if (mainBranch !== null && integradaEnMain && !integradaEnDevelop) {
     // Estado a medias: merge a main (y su tag) consumados, backmerge
     // pendiente. Reejecutar el script chocaria con el tag duplicado.
@@ -606,10 +633,14 @@ async function runFinish(
     });
     if (code !== 0) {
       const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
+      // TASK-123: un hotfix nace de la principal: esa es su base.
+      const base = tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion;
       throw new FinishCommandError(
         `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
-          'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo antes de ' +
-          'reintentar); la tarea no se ha movido de carpeta.'
+          'Revisa la salida de arriba; la tarea no se ha movido de carpeta. Si es un conflicto de merge, no ' +
+          `lo cierres en la rama destino: abortalo con taskctl abort-merge, integra la base en la rama de ` +
+          `la tarea (git checkout ${rama} && git merge ${base}), resuelvelo y commitea alli, y ` +
+          `relanza taskctl finish ${id} desde la rama de la tarea, que verifica antes de mergear.`
       );
     }
 
@@ -718,6 +749,9 @@ async function runFinish(
   // la linea de un intento anterior). Pura y sin lanzar: va fuera del try para
   // que un fallo leyendo el plan no se lleve tambien la duracion del cierre.
   conRegistro = anotarCierre(conRegistro, inicioFinish, finFinish);
+  if (reintento !== null && reintento.tipo === 'omitida') {
+    conRegistro = anotarVerificacionOmitida(conRegistro, inicioFinish, reintento.comando);
+  }
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
   // Renderizado de cierre (criterio 3): plantillas desde el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index f5d08c9..33cb0cf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -409,3 +409,35 @@ function segmentosSoloIntegran(texto: string, cuenta: { integraciones: number })
   }
   return true;
 }
+
+/**
+ * TASK-123 (F-16): los `git commit` y `git merge --continue` del texto, que con
+ * un merge en curso lo cierran. Devuelve el `-C <dir>` de cada uno (null: el
+ * directorio actual). Puro: si el merge esta en curso lo mira quien llama.
+ */
+export function cierresDeMerge(texto: string): (string | null)[] {
+  const dirs: (string | null)[] = [];
+  for (const bruto of segmentar(texto)) {
+    const seg = sinPrefijos(bruto);
+    if (seg.length === 0) continue;
+    const prog = programa(seg[0] as string);
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
+      if (sub === 'commit' || (sub === 'merge' && args.includes('--continue'))) dirs.push(dir);
+      continue;
+    }
+    const interior = textoDeShell(prog, seg);
+    if (interior !== null) dirs.push(...cierresDeMerge(interior));
+  }
+  return dirs;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 588380a..c58a911 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -40,9 +40,9 @@
 import { existsSync } from 'node:fs';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
-import { analizarComando, type OperacionMerge } from '../core/comando-merge.js';
+import { analizarComando, cierresDeMerge, type OperacionMerge } from '../core/comando-merge.js';
 import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
-import { huellaDeCommit, leerMemo } from '../fs/verificacion.js';
+import { huellaDeCommit, huellaDelArbol, leerMemo } from '../fs/verificacion.js';
 import { comandoSoloIntegra } from '../core/comando-merge.js';
 import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
 import { timeoutEfectivoS } from './freno-stop.js';
@@ -56,7 +56,8 @@ export function comandoCandidato(entrada: EntradaPreToolUse): string | null {
   const ti = entrada.tool_input;
   if (typeof ti !== 'object' || ti === null) return null;
   const cmd = (ti as { command?: unknown }).command;
-  if (typeof cmd !== 'string' || !/merge/i.test(cmd)) return null;
+  // TASK-123: tambien `commit`, que con un merge en curso lo cierra.
+  if (typeof cmd !== 'string' || !/merge|commit/i.test(cmd)) return null;
   return cmd;
 }
 
@@ -114,6 +115,10 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
   if (comando === null) return PASAR;
   if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return PASAR;
   const cwd = entrada.cwd;
+  // TASK-123 (F-16): el commit que cierra un merge en curso en una rama protegida.
+  const cierre = decidirCierreDeMerge(comando, cwd);
+  if (cierre.codigo === 2) return cierre;
+  if (!/merge/i.test(comando)) return PASAR;
   // TASK-103: `git checkout README.md` no cambia HEAD; una rama (tambien la que
   // solo esta en origin: el DWIM de checkout), un tag o un commit, si.
   const esRevision = (n: string): boolean => {
@@ -259,8 +264,8 @@ const LINEA_SELECTIVA =
   'Con codigo, un merge a mano exige la verificacion completa en verde de ese commit aunque taskctl finish ' +
   'acepte la de lo afectado (rutas_verificacion_parcial), y un merge a mano no la obtiene. Integra con taskctl ' +
   'finish TASK-NNN desde la rama de la tarea, que verifica y mergea por su cuenta. Si finish choco en un conflicto, ' +
-  'no lo cierres en el destino (el reintento ya no verificaria): abortalo con taskctl abort-merge, integra la base ' +
-  'en la rama de la tarea, resuelvelo alli y vuelve a lanzar finish.';
+  'no lo cierres en el destino: abortalo con taskctl abort-merge, integra la base en la rama de la tarea, ' +
+  'resuelvelo alli y vuelve a lanzar taskctl finish TASK-NNN desde ella.';
 
 /**
  * TASK-101: si lo que entra es solo documentacion segun la config del destino.
@@ -347,3 +352,75 @@ function mensaje(
     'anotado en la tarea. No integres por otra via para saltarte esta comprobacion.',
   ].join('\n');
 }
+
+/**
+ * TASK-123 (F-16): `git commit` (o `git merge --continue`) con `MERGE_HEAD`
+ * presente en la rama de integracion o la principal cierra un merge hacia ella:
+ * lo que se commitea es la resolucion, no el commit que se verifico. Se exige un
+ * verde del arbol que se va a commitear (huella del arbol de trabajo, la que
+ * guarda el freno Stop), salvo que lo que entra ya este integrado. Sin
+ * `MERGE_HEAD`, o en otra rama, no se toca. Sin `git commit` ni `merge
+ * --continue` en el texto no lanza ningun proceso. Hasta saber que cierra un
+ * merge en una rama protegida, cualquier fallo deja pasar; despues, bloquea.
+ */
+function decidirCierreDeMerge(comando: string, cwd: string): DecisionPreToolUse {
+  const dirs = cierresDeMerge(comando);
+  for (const dir of dirs) {
+    let raiz: string;
+    let rama: string;
+    let sha: string;
+    let config: TaskcodeConfig;
+    try {
+      raiz = raizDelRepo(dir === null ? cwd : path.resolve(cwd, dir));
+      const mh = git(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD'], raiz);
+      if (!mh.ok || mh.out === '') continue;
+      sha = mh.out;
+      rama = git(['branch', '--show-current'], raiz).out;
+      if (rama === '') continue;
+      try {
+        config = resolverConfigConAvisos(raiz).config;
+      } catch (e: unknown) {
+        if (e instanceof ConfigError && PROTEGIDAS_SIN_CONFIG.has(rama)) {
+          return { codigo: 2, stderr: mensajeConfigInvalida(rama, e) };
+        }
+        continue;
+      }
+      if (config.comando_verificacion === null) continue;
+      const principal = ramaPrincipal(raiz);
+      if (rama !== config.rama_base && rama !== principal) continue;
+    } catch {
+      continue;
+    }
+    try {
+      const motivo = motivoDeCierre(sha, rama, raiz, config);
+      if (motivo !== null) return { codigo: 2, stderr: motivo };
+    } catch (e: unknown) {
+      const msg = e instanceof Error ? e.message : String(e);
+      return { codigo: 2, stderr: `No se pudo comprobar la verificacion antes de cerrar un merge en "${rama}": ${msg}\n${REMEDIO_CIERRE}` };
+    }
+  }
+  return PASAR;
+}
+
+const REMEDIO_CIERRE =
+  'No lo cierres aqui: abortalo con taskctl abort-merge, integra la base en la rama de la tarea ' +
+  '(git checkout <rama-de-la-tarea> && git merge <esta-rama>), resuelvelo y commitea alli, y vuelve a lanzar ' +
+  'taskctl finish TASK-NNN desde ella, que verifica antes de mergear. Si la persona decide integrar sin ' +
+  'verificar, es taskctl finish TASK-NNN --sin-verificacion, que lo deja anotado en la tarea. No integres por ' +
+  'otra via para saltarte esta comprobacion.';
+
+function motivoDeCierre(sha: string, rama: string, raiz: string, config: TaskcodeConfig): string | null {
+  if (esAncestro(sha, 'HEAD', raiz)) return null;
+  const comando = config.comando_verificacion as string;
+  const timeouts = new Set([config.timeout_verificacion, timeoutEfectivoS(config.timeout_verificacion).timeoutS]);
+  for (const t of timeouts) {
+    const huella = huellaDelArbol(raiz, comando, t);
+    if (huella !== null && leerMemo(raiz, huella)?.estado === 'verde') return null;
+  }
+  return [
+    `Commit bloqueado: cerraria en "${rama}" el merge en curso de ${sha.slice(0, 10)} y no consta una verificacion ` +
+      `en verde de ese resultado (comando de verificacion: ${comando}). Lo que se commitea es la resolucion, no ` +
+      'lo que se verifico en la rama de la tarea.',
+    REMEDIO_CIERRE,
+  ].join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
index 1ac211a..98da5ae 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
@@ -1,7 +1,7 @@
 /**
  * Punto de entrada del hook `PreToolUse` de Bash/PowerShell (hooks/hooks.json).
  * Corre antes de CADA comando, asi que lo primero es barato: si el texto no
- * contiene `merge` ni `aceptacion`, sale 0 sin cargar nada mas. Si no, decide
+ * contiene `merge`, `commit` (TASK-123) ni `aceptacion`, sale 0 sin cargar nada mas. Si no, decide
  * cada guardian que aplique: el de merges (guardia-merge.ts) y el de held-out
  * (guardia-heldout.ts, TASK-078). El primero que bloquea gana: sale 2 con su
  * motivo en stderr. Nunca sale con 1, que Claude Code trata como error NO
@@ -31,7 +31,7 @@ async function decidir(): Promise<Decision> {
       // deja pasar: decide el otro guardian
     }
   }
-  if (/merge/i.test(texto)) {
+  if (/merge|commit/i.test(texto)) {
     try {
       const g = await import('./guardia-merge.js');
       return g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
@@ -42,7 +42,7 @@ async function decidir(): Promise<Decision> {
   return { codigo: 0, stderr: '' };
 }
 
-if (/merge|aceptacion/i.test(texto)) {
+if (/merge|commit|aceptacion/i.test(texto)) {
   decidir().then(
     (d) => {
       if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-reintento.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-reintento.test.ts
new file mode 100644
index 0000000..0c14db2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-reintento.test.ts
@@ -0,0 +1,188 @@
+/**
+ * TASK-123 (F-16): la via de reintento de `finish` (la rama ya integrada en la
+ * de integracion) verifica el arbol de esa rama antes de cerrar, y el guardian
+ * de merges ve el `git commit` que cierra un merge en curso. Repos Git
+ * temporales de verdad y los scripts de Git-Flow tal cual; el comando de
+ * verificacion vive fuera del repo y lee su desenlace de un fichero junto a el.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { existsSync, readFileSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+
+const SCRIPT = `
+const fs = require('node:fs');
+const dir = __dirname;
+fs.appendFileSync(dir + '/cuenta', 'x');
+const d = fs.readFileSync(dir + '/desenlace', 'utf8').trim();
+if (d === 'ok') { process.exit(0); }
+console.error('ERROR: 2 tests fallan'); process.exit(3);
+`;
+
+interface Verif {
+  desenlace(d: 'ok' | 'ko'): Promise<void>;
+  n(): number;
+}
+
+async function conVerif(fn: (v: Verif, repo: string, tareas: string) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'finish-reintento-'));
+  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
+  await writeFile(path.join(dir, 'desenlace'), 'ok', 'utf8');
+  const v: Verif = {
+    desenlace: (d) => writeFile(path.join(dir, 'desenlace'), d, 'utf8'),
+    n: () => (existsSync(path.join(dir, 'cuenta')) ? readFileSync(path.join(dir, 'cuenta'), 'utf8').length : 0),
+  };
+  try {
+    await withTempRepo(async (repo, tareas) => {
+      await mkdir(path.join(repo, '.taskcode'), { recursive: true });
+      const comando = `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')}`;
+      await writeFile(path.join(repo, '.taskcode', 'config.yml'), `comando_verificacion: "${comando}"\n`, 'utf8');
+      commitAll(repo, 'config');
+      await fn(v, repo, tareas);
+    });
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+async function finishFalla(tareas: string, repo: string, argv: string[]): Promise<string> {
+  try {
+    await runFinishCommand(tareas, argv, '2026-11-12', { repoCwd: repo, scriptsDir: SCRIPTS_DIR });
+  } catch (e) {
+    return (e as Error).message;
+  }
+  return assert.fail('finish deberia haber abortado');
+}
+
+/** Rama y develop cambian el mismo fichero: el merge de finish choca. */
+async function prepararConflicto(repo: string, tareas: string, id: string): Promise<ReturnType<typeof sampleTask>> {
+  git(['checkout', '-q', 'develop'], repo);
+  await writeFile(path.join(repo, 'comun.txt'), 'base\n', 'utf8');
+  commitAll(repo, 'comun base');
+  const task = sampleTask({ id });
+  await setupTaskEnRevision(repo, tareas, task);
+  await writeFile(path.join(repo, 'comun.txt'), 'version de la tarea\n', 'utf8');
+  commitAll(repo, `feat(${id}): cambia comun`);
+  git(['checkout', '-q', 'develop'], repo);
+  await writeFile(path.join(repo, 'comun.txt'), 'version de develop\n', 'utf8');
+  commitAll(repo, 'otra tarea cambia comun');
+  git(['checkout', '-q', task.rama], repo);
+  return task;
+}
+
+function mergeHead(repo: string): boolean {
+  return spawnSync('git', ['rev-parse', '-q', '--verify', 'MERGE_HEAD'], { cwd: repo }).status === 0;
+}
+
+test('F-16 caso A: merge a mano en develop con la verificacion en rojo -> finish no cierra, lo dice y vuelve a la rama', async () => {
+  await conVerif(async (v, repo, tareas) => {
+    const task = sampleTask({ id: 'TASK-901' });
+    await setupTaskEnRevision(repo, tareas, task);
+    await v.desenlace('ko');
+    git(['checkout', '-q', 'develop'], repo);
+    git(['merge', '--no-ff', '-q', '-m', 'merge a mano', task.rama], repo);
+    git(['checkout', '-q', task.rama], repo);
+    const error = await finishFalla(tareas, repo, ['TASK-901']);
+    assert.match(error, /ya esta integrada en "develop", pero la verificacion de su arbol no sale en verde/);
+    assert.match(error, /no se ha movido de carpeta/);
+    assert.match(error, /2 tests fallan/);
+    assert.match(error, /relanza taskctl finish TASK-901 desde ella/);
+    assert.equal(v.n(), 1, 'la verificacion corre una vez, sobre develop');
+    assert.equal(git(['branch', '--show-current'], repo).trim(), task.rama);
+    assert.equal((await readTareaFile(tareas, 'TASK-901'))?.task.estado, 'en-revision');
+  });
+});
+
+test('F-16 caso A con --sin-verificacion: cierra sin ejecutar nada y lo anota en la tarea', async () => {
+  await conVerif(async (v, repo, tareas) => {
+    const task = sampleTask({ id: 'TASK-903' });
+    await setupTaskEnRevision(repo, tareas, task);
+    await v.desenlace('ko');
+    git(['checkout', '-q', 'develop'], repo);
+    git(['merge', '--no-ff', '-q', '-m', 'merge a mano', task.rama], repo);
+    const avisos: string[] = [];
+    const r = await runFinishCommand(tareas, ['TASK-903', '--sin-verificacion'], '2026-11-12', {
+      repoCwd: repo,
+      scriptsDir: SCRIPTS_DIR,
+      onAviso: (a) => avisos.push(a),
+    });
+    assert.equal(r.cierre, 'terminada');
+    assert.equal(v.n(), 0);
+    assert.ok(avisos.some((a) => /--sin-verificacion: la rama ya estaba integrada/.test(a)));
+    assert.match((await readTareaFile(tareas, 'TASK-903'))?.body ?? '', /## Verificacion omitida/);
+  });
+});
+
+test('F-16 caso verde: el reintento con la verificacion en verde cierra como siempre', async () => {
+  await conVerif(async (v, repo, tareas) => {
+    const task = sampleTask({ id: 'TASK-904' });
+    await setupTaskEnRevision(repo, tareas, task);
+    git(['checkout', '-q', 'develop'], repo);
+    git(['merge', '--no-ff', '-q', '-m', 'merge a mano', task.rama], repo);
+    git(['checkout', '-q', task.rama], repo);
+    const r = await runFinishCommand(tareas, ['TASK-904'], '2026-11-12', { repoCwd: repo, scriptsDir: SCRIPTS_DIR });
+    assert.equal(r.cierre, 'terminada');
+    assert.equal(v.n(), 1);
+    assert.equal((await readTareaFile(tareas, 'TASK-904'))?.task.estado, 'terminada');
+  });
+});
+
+test('F-16 caso B: conflicto en finish; el guardian bloquea los commits que lo cerrarian en develop, y si se cierra igual el reintento verifica y aborta en rojo', async () => {
+  await conVerif(async (v, repo, tareas) => {
+    const task = await prepararConflicto(repo, tareas, 'TASK-902');
+    const error = await finishFalla(tareas, repo, ['TASK-902']);
+    assert.match(error, /codigo/);
+    // El remedio en el mensaje de finish (criterio 4).
+    assert.match(error, /taskctl abort-merge/);
+    assert.match(error, /integra la base en la rama de la tarea/);
+    assert.match(error, /relanza taskctl finish TASK-902 desde la rama de la tarea/);
+    assert.equal(v.n(), 1, 'la verificacion corrio una vez, sobre la rama');
+    assert.equal(git(['branch', '--show-current'], repo).trim(), 'develop');
+    assert.ok(mergeHead(repo), 'merge en curso en develop');
+
+    for (const command of ['git commit --no-edit', 'git add -A && git commit -m "resuelvo"', 'git commit -am "resuelvo"', 'git merge --continue']) {
+      const d = decidirPreToolUse({ cwd: repo, tool_input: { command } });
+      assert.equal(d.codigo, 2, `el guardian deberia bloquear «${command}»`);
+      assert.match(d.stderr, /cerraria en "develop" el merge en curso/);
+      assert.match(d.stderr, /taskctl abort-merge/);
+      assert.match(d.stderr, /vuelve a lanzar taskctl finish TASK-NNN desde ella/);
+    }
+
+    // La resolucion rompe algo, y se commitea igualmente (fuera del guardian).
+    await writeFile(path.join(repo, 'comun.txt'), 'resolucion ROTA\n', 'utf8');
+    git(['add', '-A'], repo);
+    git(['commit', '-q', '--no-edit'], repo);
+    await v.desenlace('ko');
+    git(['checkout', '-q', task.rama], repo);
+
+    const error2 = await finishFalla(tareas, repo, ['TASK-902']);
+    assert.match(error2, /la verificacion de su arbol no sale en verde/);
+    assert.equal(v.n(), 2, 'el reintento verifica la resolucion');
+    assert.equal((await readTareaFile(tareas, 'TASK-902'))?.task.estado, 'en-revision');
+  });
+});
+
+test('F-16 guardian: un git commit sin MERGE_HEAD en develop, o con MERGE_HEAD en la rama de la tarea, no se toca', async () => {
+  await conVerif(async (_v, repo, tareas) => {
+    git(['checkout', '-q', 'develop'], repo);
+    for (const command of ['git commit -m "x"', 'git add -A && git commit -am "x"']) {
+      assert.equal(decidirPreToolUse({ cwd: repo, tool_input: { command } }).codigo, 0, command);
+    }
+    // Integrar la base en la rama de la tarea es el remedio: su commit no se bloquea.
+    const task = await prepararConflicto(repo, tareas, 'TASK-905');
+    assert.equal(git(['branch', '--show-current'], repo).trim(), task.rama);
+    const r = spawnSync('git', ['merge', '-q', 'develop'], { cwd: repo });
+    assert.notEqual(r.status, 0, 'el merge de develop en la rama debe chocar');
+    assert.ok(mergeHead(repo));
+    for (const command of ['git commit --no-edit', 'git merge --continue']) {
+      assert.equal(decidirPreToolUse({ cwd: repo, tool_input: { command } }).codigo, 0, command);
+    }
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
index 8d4c440..48a7032 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
@@ -184,16 +184,15 @@ test('finish (puerta): fuera de la rama de la tarea no verifica otro arbol: abor
   });
 });
 
-test('finish (puerta): no corre en el camino idempotente (los merges ya estan hechos)', async () => {
+test('finish (puerta, TASK-123): en el camino idempotente verifica el arbol de la rama de integracion y, en verde, cierra', async () => {
   await conVerificacion(async (v, repoRoot, tareasRoot) => {
     const task = sampleTask({ id: 'TASK-726' });
     await setupTaskEnRevision(repoRoot, tareasRoot, task);
     git(['checkout', '-q', 'develop'], repoRoot);
     git(['merge', '-q', '--no-ff', '-m', 'merge a mano', task.rama], repoRoot);
-    await v.desenlace('ko');
     const r = await runFinishCommand(tareasRoot, ['TASK-726'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
     assert.equal(r.cierre, 'terminada');
-    assert.equal(v.ejecuciones(), 0);
+    assert.equal(v.ejecuciones(), 1);
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
index 57d6e16..efb9365 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
@@ -598,11 +598,17 @@ test('guia (TASK-109): la seccion «Codigo parcial» explica el principio y el c
     // IMP-2: abortar e integrar la base en la rama de la tarea, no cerrar el merge en la de integracion.
     /no repitas el merge a mano ni lo\s+cierres en la rama de integracion/,
     /Abortalo \(`taskctl abort-merge`\), integra la\s+base en la rama de la tarea/,
+    // TASK-123: el reintento ya verifica, y el guardian bloquea el commit que cerraria el merge.
+    /el guardian bloquea el commit que lo\s+cerraria/,
+    /relanzado sobre ese merge verifica la\s+rama de\s+integracion y en rojo no cierra/,
+    /vuelve a lanzar\s+`taskctl finish` desde la rama de la tarea/,
   ]) {
     assert.match(seccion, marca);
   }
   assert.doesNotMatch(seccion, /TaskCode|TASK-\d/);
+  assert.doesNotMatch(seccion, /no vuelve a verificar/);
   const skill = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
   assert.match(skill, /`rutas_verificacion_parcial`, `finish` puede integrar con la selectiva;\s+un\s+merge\s+a\s+mano\s+no/);
-  assert.match(skill, /desde la rama de\s+la tarea; si choca, abortalo y resuelve en ella/);
+  // TASK-123: el remedio entero (abortar, integrar la base en la rama y relanzar finish desde ella).
+  assert.match(skill, /desde la rama de\s+la tarea; si choca,\s+`taskctl abort-merge`, integra la base en ella y relanza `finish`/);
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
index 2c0a70e..2836fc8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -365,8 +365,8 @@ test('guardian (TASK-108): el bloqueo con codigo dice que hace falta la completa
     assert.match(texto, LINEA_COMPLETA);
     assert.match(texto, /aunque taskctl finish acepte la de lo afectado \(rutas_verificacion_parcial\)/);
     assert.match(texto, /Integra con taskctl finish TASK-NNN desde la rama de la tarea, que verifica y mergea por su cuenta/);
-    // IMP-2 de la revision de TASK-109: cerrar el conflicto en el destino deja un reintento sin verificacion.
-    assert.match(texto, /no lo cierres en el destino .* abortalo con taskctl abort-merge, integra la base en la rama de la tarea, resuelvelo alli/);
+    // IMP-2 de la revision de TASK-109, y TASK-123: el remedio entero, relanzando finish desde la rama de la tarea.
+    assert.match(texto, /no lo cierres en el destino: abortalo con taskctl abort-merge, integra la base en la rama de la tarea, resuelvelo alli y vuelve a lanzar taskctl finish TASK-NNN desde ella/);
     assert.match(texto, /taskctl finish TASK-NNN --sin-verificacion/);
     // Ni «corre la completa y repite» (bucle: nada la guarda) ni una causa que no se comprueba.
     assert.doesNotMatch(texto, /repite el merge|corre la (verificacion )?completa|develop avanzo|huella/i);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts
index c8691b5..edcb4cb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts
@@ -220,6 +220,22 @@ test('ejecuta lo elegido mas los rapidos y sale con el codigo de node --test', a
   });
 });
 
+test('los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa)', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/test/c.test.ts`, "import { c } from '../src/c.js';\nvoid c; // cambio\n");
+    // Lo "compilado" de ese test (el build del repo miniatura no hace nada): pasa solo sin RAMA_BASE.
+    await escribir(
+      raiz,
+      `${PLUGIN}/dist/test/c.test.js`,
+      "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\n" +
+        "test('sin RAMA_BASE', () => { assert.equal(process.env.RAMA_BASE, undefined); });\n"
+    );
+    const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
+    assert.equal(r.status, 0, r.stdout + r.stderr);
+    assert.match(r.stdout, /test\/c\.test\.ts \(test cambiado\)/);
+  });
+});
+
 test('tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice)', async () => {
   await conRepo(async (raiz) => {
     // a.ts lo importa b.ts, y b.test.ts a b.ts: por impacto entra b.test, pero no es directo.
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-123/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-123/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-123/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-123/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-123/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-123/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-123/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        | 91 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     | 47 ++++++++++++++++++++++++++++++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js                                  | 37 +++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                 | 95 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/pre-tool-merge.js                                |  6 +++---
 12 files changed, 265 insertions(+), 18 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 134.5 s

Final de la salida (truncada: 152570 bytes en total):

````
✔ guardian (TASK-101): con comprobacion de documentacion exige su verde guardado para ese commit (10017.9533ms)
✔ guardian (TASK-101): sin exencion si el comando crea o mueve commits antes del merge (9509.1917ms)
✔ guardian (TASK-101): los held-out de tareas/.../aceptacion/ cuentan como codigo (3256.245ms)
✔ guardian (TASK-101): un release siempre exige la completa (2845.5206ms)
✔ guardian (TASK-101): las rutas salen de la config del destino, no de la rama ni del arbol (3568.6995ms)
✔ guardian (TASK-101): una config del destino invalida no exime (completa) (3429.4074ms)
✔ guardian (TASK-101): sin rutas_documentacion el mensaje es exactamente el de la 0.14.0 (2596.3152ms)
✔ comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consultar (3.6853ms)
✔ guardian (TASK-101): CRI-1 y CRI-2 de la revision bloquean de punta a punta (9367.772ms)
✔ guardian (TASK-105): una decision selectiva bloquea a proposito, aunque su comando coincida con el de documentacion y conste en verde (3428.3498ms)
✔ guardian (TASK-108): con nivel 2, una tarea sin codigo pasa con el verde de su verificacion de documentacion (4539.5623ms)
✔ guardian (TASK-108): con nivel 2, una tarea con codigo se bloquea aunque conste en verde el memo de la selectiva (4441.4797ms)
✔ guardian (TASK-108): el bloqueo con codigo dice que hace falta la completa y como integrar, sin mandar a repetir el merge (4045.1085ms)
✔ guardian (TASK-108): decide con la config del destino; la del arbol no cambia el mensaje (7422.2086ms)
✔ guardian (TASK-108): sin rutas_verificacion_parcial, con codigo, se comporta como en la 0.14.0 (5252.4838ms)
✔ guardian (TASK-108, MEN-1/MEN-2): con nivel 2, un release con codigo conserva su detalle y un hotfix no promete la selectiva (4508.1441ms)
✔ un test cambiado se corre solo el (10679.8771ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (7744.6216ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (19041.6669ms)
✔ un cambio sin commitear tambien cuenta (2157.216ms)
✔ un helper de test elige los tests que lo importan (3750.8261ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (8082.4382ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (4022.4067ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (1892.2302ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (3720.2461ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (10419.6772ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) (5257.5744ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (4092.6993ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (12502.3686ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (7009.5556ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (4075.5648ms)
ℹ tests 853
ℹ suites 0
ℹ pass 853
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 121462.4005
[verificar-impacto] node --test termino con 0 en 121.6 s.
````
