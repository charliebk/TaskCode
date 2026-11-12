# Peticion de revision — TASK-099 (ronda 1)

- Tarea: TASK-099 — Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa
- Rama revisada: feature/task-099-correccion-de-menores-tras-aprobar-con-c
- Rama base: develop
- Commit revisado (HEAD): 14556f7445f301c956587c825dac55c4fca61e3b
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-099 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-099/tarea.md
- tareas/03-en-revision/TASK-099/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/menores.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts

## Commits a revisar (git log develop..HEAD)

````
14556f7 chore(TASK-099): coste implementacion +300000 tokens
e2388f7 chore(TASK-099): autorrevision
a8ba7cc fix(TASK-099): la puerta de finish no deja pasar un commit revisado que no se puede comparar
779db21 feat(TASK-099): verificacion ligera de MENORES sin otra ronda
ed00207 chore(TASK-099): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index d1e8724..126f4c6 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -21,6 +21,21 @@
 
 ## Siguiente version — sin publicar
 
+Correccion de MENORES sin otra ronda (TASK-099, P-2 de la auditoria: 71 rondas
+abiertas solo por MENORES encontraron 2 CRITICO/IMPORTANTE en 70,2 M tokens).
+Comando nuevo `taskctl verificar-menores TASK-NNN [--motivo "<texto>"]`: tras
+una ronda aprobada sin CRITICO ni IMPORTANTE abiertos, comprueba que lo cambiado
+desde el `Commit revisado` son solo los ficheros que cita cada MENOR (o tests),
+lo anota en `## Verificacion ligera` de `tarea.md` y deja los MENORES no
+corregidos en `revision/menores-pendientes.md`, que no abre ronda ni bloquea el
+cierre. `siguiente` ya no propone otra ronda por MENORES en ningun modo: propone
+`verificar-menores` o `finish`; con un CRITICO o IMPORTANTE abierto en una ronda
+aprobada, cambiar el veredicto a `cambios-solicitados` (decision de una
+persona). **Cambio de conducta de `finish`**: ya no integra codigo commiteado
+despues del `Commit revisado` sin una verificacion ligera al dia; una persona
+puede forzarlo con `--aceptar-sin-revisar`, que queda en `## Codigo integrado
+sin revisar`. Las tareas sin `Commit revisado` en su peticion no cambian.
+
 Fix F-16 (TASK-123, critico): `finish` ya no cierra sin verificar cuando la rama
 de la tarea ya esta integrada (un merge a mano en la rama de integracion, o el
 commit que cerro alli un conflicto de `finish`). Con `comando_verificacion`, ese
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 9ef3c98..6ebb9da 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -196,7 +196,8 @@ tiempo que no, y era falso.
 | `plan`, `approve`, `trocear` | Diseño (brainstorm de roles y plan), aprobación del plan y troceo de una tarea de más de una hora. |
 | `start` | Abrir la rama de la tarea con el plan aprobado. |
 | `review`, `codex-review`, `veredicto` | Revisión por pares por rondas y su veredicto. |
-| `finish` | Cierre: verificación, merge `--no-ff` o merge request, tag opcional. |
+| `verificar-menores` | Tras aprobar con correcciones: registra la corrección de los MENORES sin abrir otra ronda (solo los ficheros que cita cada MENOR, o tests) y deja los no corregidos en `revision/menores-pendientes.md`. |
+| `finish` | Cierre: verificación, merge `--no-ff` o merge request, tag opcional. No integra código posterior al commit revisado sin `verificar-menores` o `--aceptar-sin-revisar` (decisión de una persona). |
 | `siguiente`, `pausa`, `cadena` | Qué fase toca y si preguntar (según `modo_flujo`); pausar el paso a la siguiente fase; bloquear el árbol mientras las fases se encadenan. |
 | `estado`, `board`, `roadmap` | En qué va la fase en curso (también en la status line), tablero y `tareas/ROADMAP.md`. |
 | `doctor`, `doctor-deploy` | Que el proyecto está listo para el flujo; que la aplicación está lista para publicarse. |
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index a7a620d..9038fd2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -24,6 +24,7 @@ punto, no un formalismo.
    - `veredicto`: ya hay peticion de revision; sigue en el paso 3.
    - `codex-review`: paso 5.
    - `veredicto-codex`: paso 6. **No ejecutes `codex-review`**.
+   - `verificar-menores`: ultimo bloque del paso 4 (MENORES tras aprobar).
 
    **Autorrevision**, antes de cada `taskctl review` y sin lanzar ningun
    agente: la haces tu, en tu contexto. El campo `revisores` del JSON de
@@ -96,10 +97,19 @@ punto, no un formalismo.
    cuando la persona lo diga: sin el, `review` no abre la ronda 4. Un «si»
    quiere decir corregir primero y despues abrir la ronda, nunca relanzarla
    sobre el mismo codigo.
-   En automatico, `aprobada-con-correcciones` no se corrige despues: el codigo
-   que se mergea tiene que ser el revisado (`finish` pregunta si cambia). Los
-   MENOR que merezca la pena corregir se piden como `cambios-solicitados`; el
-   resto se documentan como aceptados en el `## Resultado`.
+   **MENORES tras aprobar** (`aprobada-con-correcciones` sin CRITICO ni
+   IMPORTANTE abiertos): **nunca** se piden como `cambios-solicitados` ni
+   abren otra ronda, en ningun modo. Corrige los baratos tocando solo los
+   ficheros que cita cada MENOR (y sus tests), commitea y ejecuta
+   `taskctl verificar-menores TASK-NNN [--motivo "<por que no se corrigen
+   los demas>"]`: comprueba que lo cambiado desde el `Commit revisado` se
+   limita a eso, lo registra en `tarea.md` y deja los MENORES no corregidos
+   en `revision/menores-pendientes.md` (backlog: no bloquean `finish`).
+   Si aborta porque hay un fichero ajeno, no lo fuerces: o se deshace ese
+   cambio, o hace falta otra ronda, o una persona decide
+   `taskctl finish TASK-NNN --aceptar-sin-revisar`. `finish` no integra
+   codigo posterior al revisado sin una de las dos cosas. Un CRITICO o
+   IMPORTANTE abierto sigue siendo `cambios-solicitados` y otra ronda.
 5. **Segunda opinion** (`revision_codex: true` y primaria aprobada):
    ejecuta `taskctl codex-review TASK-NNN` una vez.
    - Si avisa de que Codex no respondio y no escribio informe, muestra el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 6a446fc..10d1fbc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -157,7 +157,8 @@ corta, falta algo de verdad.
 
 **4. Todos los hallazgos se documentan, tambien los que se decide no
 corregir.** CRITICO e IMPORTANTE se corrigen siempre. MENOR se corrige si sale
-barato; si no, se documenta con el motivo. Sin esa nota, el siguiente lector
+barato, sin abrir otra ronda (`taskctl verificar-menores`, ver `revision.md`);
+si no, queda en el backlog de la tarea con el motivo. Sin esa nota, el siguiente lector
 concluye que hay un bug donde hay una decision.
 
 **5. Un test que no falla si el comportamiento cambia no es un test.**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 2a7b628..7e88ebe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -51,6 +51,7 @@ segundo `finish` la cierra.
 | `veredicto` | `/taskcode-plugin:review` |
 | `codex-review` | `/taskcode-plugin:review` |
 | `veredicto-codex` | `/taskcode-plugin:review` (no lanza nada: el veredicto de la segunda opinion lo decide una persona) |
+| `verificar-menores` | `/taskcode-plugin:review` (corregir los MENORES baratos, commitear y `taskctl verificar-menores`; nunca otra ronda por MENORES) |
 | `finish` | `/taskcode-plugin:finish` |
 | `terminada` | ninguna: la tarea esta cerrada |
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index d9888f5..80f607d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -75,8 +75,13 @@ inventar hallazgos para tener algo que reportar, no.
 
 Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
 `revision/`. **Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la
-tarea.** Los MENOR que se corrijan no abren ronda 2: basta la suite en verde,
-el commit de correccion y su nota en el `## Resultado`. La ronda 2 solo se
+tarea.** Los MENOR que se corrijan no abren ronda 2: se corrigen los
+baratos, se commitea y `taskctl verificar-menores TASK-NNN` comprueba que lo
+cambiado desde el `Commit revisado` son solo los ficheros de esos MENORES (o
+tests), lo registra en `tarea.md` y deja los no corregidos en
+`revision/menores-pendientes.md` (backlog que no bloquea `finish`). Sin esa
+verificacion, `finish` no integra codigo posterior al revisado salvo que una
+persona pase `--aceptar-sin-revisar`. La ronda 2 solo se
 pide si se corrigio algun CRITICO o IMPORTANTE (veredicto `cambios-solicitados`):
 `taskctl review` sobre la tarea en revision la genera con solo el diff desde
 la ronda anterior y los hallazgos aun abiertos de su tabla, sin integrar la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index a514ea4..2e149dd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -18,6 +18,7 @@ import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex-review.js';
 import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto.js';
+import { runVerificarMenoresCommand, VerificarMenoresCommandError } from './commands/verificar-menores.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
 import { runTrocearCommand, TrocearCommandError } from './commands/trocear.js';
@@ -90,7 +91,8 @@ Uso:
   taskctl codex-review TASK-NNN [--push]
   taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
                     [--informe <nombre>] [--push]
-  taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]
+  taskctl verificar-menores TASK-NNN [--motivo "<texto>"] [--push]
+  taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--aceptar-sin-revisar] [--push]
   taskctl siguiente TASK-NNN [--json]
   taskctl estado [--seguir] [--stdin]
   taskctl doctor [--json] [--instalar-status-line [--reemplazar-status-line] | --desinstalar-status-line]
@@ -106,7 +108,7 @@ Uso:
   taskctl abort-merge
 
 Comandos: new, import, board, roadmap, metricas, start, plan, approve, trocear, review, codex-review, veredicto,
-finish, siguiente, estado, doctor, doctor-deploy, pausa, registrar-coste, cadena.
+verificar-menores, finish, siguiente, estado, doctor, doctor-deploy, pausa, registrar-coste, cadena.
 estado dice en que va la tarea en curso (fase dentro del ciclo, paso dentro de la fase, x/N si el
 comando de verificacion lo escribe, minutos), leyendo solo el progreso que dejan plan, approve, start,
 review, finish y el freno de fin de turno bajo .git/: sin lanzar git. Sin nada en marcha lo dice; fuera
@@ -983,6 +985,42 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'verificar-menores') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const r = await runVerificarMenoresCommand(tareasRoot, argv.slice(1), { repoCwd });
+      const lista = (xs: string[]): string => (xs.length === 0 ? 'ninguno' : xs.join(', '));
+      process.stdout.write(
+        `Tarea ${r.id}: verificacion ligera de la ronda ${r.ronda} registrada (commit revisado ${r.commitRevisado.slice(0, 7)}, ` +
+          `verificado ${r.commitVerificado.slice(0, 7)}).
+` +
+          `  Ficheros cambiados: ${lista(r.ficheros)}
+  MENORES corregidos: ${lista(r.corregidos)}
+` +
+          `  MENORES pendientes: ${lista(r.pendientes)}${r.backlogPath === null ? '' : ` (backlog en ${r.backlogPath})`}
+` +
+          `Siguiente: taskctl finish ${r.id}
+`
+      );
+      printAutoCommit(r.autoCommit);
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof VerificarMenoresCommandError ||
+        e instanceof StateMachineError ||
+        e instanceof GitLaunchError ||
+        e instanceof GitCommandError
+      ) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'veredicto') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
index d17ac97..0b7a7e5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
@@ -38,7 +38,7 @@ import { resolverConfig, type TaskcodeConfig } from '../core/config.js';
 export class FinishCommandError extends Error {}
 
 /** Flags de `taskctl finish`: --push, las dos opciones de cierre de TASK-060 y el salto de la verificacion (TASK-072). */
-export const FLAGS_FINISH: readonly string[] = ['--push', '-p', '--tag', '--merge-request', '--sin-verificacion'];
+export const FLAGS_FINISH: readonly string[] = ['--push', '-p', '--tag', '--merge-request', '--sin-verificacion', '--aceptar-sin-revisar'];
 
 export interface FlagsCierre {
   tag: string | null;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 59d12ae..6d82465 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -51,7 +51,9 @@ import { parseTareaFile } from '../core/tarea-file.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
-import { anotarVerificacionOmitida, registrarTransicion } from '../core/transiciones.js';
+import { anotarLineaEnSeccion, anotarVerificacionOmitida, registrarTransicion } from '../core/transiciones.js';
+import { codigoSinVerificar } from './verificar-menores.js';
+import { SECCION_CODIGO_SIN_REVISAR } from '../core/menores.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { resolverConfig } from '../core/config.js';
 import { INFORME_CODEX_RE, INFORME_REVISION_RE, ultimaRondaAprobada } from '../fs/rondas.js';
@@ -341,7 +343,10 @@ async function runFinish(
 ): Promise<FinishCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_FINISH, 'finish', (m) => new FinishCommandError(m));
-  const { push, resto: sinPush } = extraerPushFlag(argv);
+  const { push, resto: conAceptar } = extraerPushFlag(argv);
+  // TASK-099: la persona decide integrar codigo posterior al revisado sin verificacion ligera.
+  const aceptarSinRevisar = conAceptar.includes('--aceptar-sin-revisar');
+  const sinPush = conAceptar.filter((a) => a !== '--aceptar-sin-revisar');
   const { sinVerificacion, resto: sinFlagVerificacion } = extraerSinVerificacion(sinPush);
   const { tag: nombreTag, mergeRequest: pideMergeRequest, resto } = extraerFlagsCierre(sinFlagVerificacion);
   const id = resto[0];
@@ -453,6 +458,30 @@ async function runFinish(
   const mrCtx = modoMergeRequest ? resolverMergeRequest(id, rama, urlMrAnotada, deps.repoCwd) : null;
   const integradaPorMergeRequest = mrCtx !== null && mrCtx.estado.tipo === 'integrado';
 
+  // TASK-099 (criterio 3): no se integra codigo commiteado despues del Commit
+  // revisado sin una verificacion ligera al dia (taskctl verificar-menores) o la
+  // decision de una persona (--aceptar-sin-revisar, que queda anotada). Un MR ya
+  // integrado en la plataforma no integra nada aqui.
+  let codigoAceptado: string | null = null;
+  if (!integradaPorMergeRequest) {
+    const ref = localBranchExists(rama, deps.repoCwd) ? rama : 'HEAD';
+    const sinVerificar = await codigoSinVerificar(path.dirname(initial.filePath), initial.body, ref, deps.repoCwd);
+    if (sinVerificar !== null && !aceptarSinRevisar) {
+      throw new FinishCommandError(
+        `[ERROR] ${id}: "${rama}" tiene codigo posterior al commit revisado en la ronda ${String(sinVerificar.ronda)} ` +
+          `(${sinVerificar.revisado.slice(0, 7)}) que ninguna verificacion ligera cubre: ${sinVerificar.cambiados.join(', ')}. ` +
+          `Si son las correcciones de los MENORES: taskctl verificar-menores ${id}. Si no, otra ronda ` +
+          `(taskctl veredicto ${id} cambios-solicitados y taskctl review ${id}), o que una persona decida ` +
+          `integrarlo sin revisar con taskctl finish ${id} --aceptar-sin-revisar. No se ha tocado nada.`
+      );
+    }
+    if (sinVerificar !== null) {
+      codigoAceptado =
+        `taskctl finish --aceptar-sin-revisar; integrado sin revisar ni verificacion ligera el codigo de ` +
+        `${sinVerificar.revisado.slice(0, 7)}..${rama} (ronda ${String(sinVerificar.ronda)}): ${sinVerificar.cambiados.join(', ')}`;
+    }
+  }
+
   // Colision de IDs ANTES de mergear (criterio 4): se comprueba contra
   // cada rama destino del merge. Para feature/fix solo la de integracion; para
   // hotfix/release tambien la principal. Un MR ya mergeado en la plataforma
@@ -752,6 +781,9 @@ async function runFinish(
   if (reintento !== null && reintento.tipo === 'omitida') {
     conRegistro = anotarVerificacionOmitida(conRegistro, inicioFinish, reintento.comando);
   }
+  if (codigoAceptado !== null) {
+    conRegistro = anotarLineaEnSeccion(conRegistro, SECCION_CODIGO_SIN_REVISAR, `- ${inicioFinish}: ${codigoAceptado}`);
+  }
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
   // Renderizado de cierre (criterio 3): plantillas desde el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index 05649be..e85faba 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -20,7 +20,12 @@ import { parseTareaFile } from '../core/tarea-file.js';
 import { resolverConfig, type CierrePorDefecto, type ModoFlujo } from '../core/config.js';
 import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
 import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
-import { commitRevisadoDe, veredictoDeRonda, type VeredictoInforme } from '../core/informe-revision.js';
+import {
+  commitRevisadoDe,
+  informeRellenado,
+  veredictoDeRonda,
+  type VeredictoInforme,
+} from '../core/informe-revision.js';
 import {
   INFORME_CODEX_RE,
   INFORME_REVISION_RE,
@@ -41,6 +46,8 @@ import {
 import { excluirDeRevision, revisoresDelRango } from '../fs/revisores-rango.js';
 import type { Task } from '../core/task.js';
 import { REVISION_DIRNAME } from './review.js';
+import { estadoCorreccionPosterior, type EstadoCorreccion } from './verificar-menores.js';
+import { bloqueantesAbiertos, menoresAbiertos } from '../core/menores.js';
 import { duracionDelPlan, planRedactado } from './approve.js';
 import type { LecturaDuracion } from '../core/duracion-estimada.js';
 
@@ -76,16 +83,6 @@ export interface SiguienteCommandResult extends SiguientePaso {
   revisores?: string[];
 }
 
-/**
- * ¿Lo escribio un revisor? (IMP-1 y MEN-6 de la revision de TASK-059): una
- * linea `- Revisor:` rellenada (no la de la plantilla) y sin la fila de
- * ejemplo de la tabla. No prueba quien lo escribio: ese riesgo residual esta
- * documentado y aceptado; esto descarta el informe que nadie relleno.
- */
-function informeRellenado(texto: string): boolean {
-  return /^- Revisor:[ \t]*(?!\(rellenar)\S/m.test(texto) && !texto.includes('(ej. IMP-1)');
-}
-
 /**
  * ¿Lo aprobado es exactamente lo que se reviso? (TASK-059; CRIT-1 de su
  * revision). La referencia es el `Commit revisado` que el CLI escribe en la
@@ -217,18 +214,53 @@ export async function runSiguienteCommand(
     }
   }
 
+  const veredicto = veredictoDe(primarios);
+  // IMP-1: un informe que conserva la plantilla no lo escribio ningun revisor.
+  const rellenados = primarios.every(informeRellenado);
+  // TASK-099: con la ronda aprobada, que paso despues del Commit revisado.
+  let correccion: EstadoCorreccion | null = null;
+  if (task.estado === 'en-revision' && veredicto === 'aprobada') {
+    const revisado = revisados.find((c) => c !== null) ?? null;
+    try {
+      correccion = estadoCorreccionPosterior(body, rondaRevision, revisado, refInformes, deps.repoCwd);
+    } catch {
+      correccion = null; // un SHA que Git no conoce: sin referencia, como antes
+    }
+  }
+  const alDia = correccion?.alDia === true;
+  // Con una verificacion ligera al dia, lo que se cierra se compara con lo
+  // verificado (que ya cubre lo revisado), no con el Commit revisado.
+  const referencias =
+    alDia && correccion?.verificacion != null ? [correccion.verificacion.commitVerificado] : revisados;
+  const enCommitPropio =
+    task.estado === 'en-revision' &&
+    rellenados &&
+    informeEnCommitPropio(refInformes, dirRevisionRepo, nombresPrimarios, referencias, deps.repoCwd);
+  const revisionLimpia =
+    refInformes !== 'HEAD' || runGit(['status', '--porcelain', '--', dirRevisionRepo], deps.repoCwd) === '';
+
   const ctx: ContextoFlujo = {
     planRedactado: planEstaRedactado,
     ...(duracionEstimada === undefined ? {} : { duracionEstimada }),
-    veredicto: veredictoDe(primarios),
+    veredicto,
     veredictoCodex: veredictoDe(codex),
     modoCongelado: modoCongelado(body) !== null,
     rondaRevision,
-    informeEnCommitPropio:
-      task.estado === 'en-revision' &&
-      // IMP-1: un informe que conserva la plantilla no lo escribio ningun revisor.
-      primarios.every(informeRellenado) &&
-      informeEnCommitPropio(refInformes, dirRevisionRepo, nombresPrimarios, revisados, deps.repoCwd),
+    informeEnCommitPropio: enCommitPropio,
+    ...(task.estado === 'en-revision' && veredicto === 'aprobada'
+      ? {
+          bloqueantesAbiertos: bloqueantesAbiertos(primarios).length,
+          menoresAbiertos: menoresAbiertos(primarios).length,
+          verificacionLigeraAlDia: alDia,
+          correccionSinVerificar:
+            !enCommitPropio &&
+            !alDia &&
+            rellenados &&
+            revisionLimpia &&
+            correccion !== null &&
+            correccion.cambiados.length > 0,
+        }
+      : {}),
   };
 
   const modo = modoDeTarea(body, modoConfig);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
new file mode 100644
index 0000000..807100b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
@@ -0,0 +1,321 @@
+/**
+ * `taskctl verificar-menores TASK-NNN [--motivo "<texto>"] [--push]` —
+ * TASK-099 (P-2 de la auditoria del 2026-11-12): la verificacion ligera.
+ *
+ * Tras una ronda aprobada (`aprobada` o `aprobada con correcciones`) los
+ * MENORES baratos se corrigen sin abrir otra ronda. Este comando comprueba,
+ * fail-closed, que eso es lo unico que paso despues del `Commit revisado`:
+ * - la ultima ronda primaria esta aprobada, con informes rellenados y una
+ *   peticion con `Commit revisado` antepasado de HEAD;
+ * - no queda ningun CRITICO ni IMPORTANTE abierto (ni una severidad que no
+ *   se reconoce): esos siguen exigiendo cambios-solicitados y otra ronda;
+ * - cada fichero cambiado fuera de `tareas/` desde el commit revisado es el
+ *   de algun MENOR abierto o un test: lo demas es codigo que nadie reviso;
+ * - no hay cambios sin commitear fuera de `tareas/`.
+ * Si pasa, deja una linea en `## Verificacion ligera` de `tarea.md` y los
+ * MENORES que no se corrigieron en `revision/menores-pendientes.md`
+ * (backlog: no abre ronda ni impide finish), y lo commitea. No corre tests:
+ * `finish` corre `comando_verificacion` antes del merge.
+ *
+ * `finish` y `siguiente` leen la linea con `estadoCorreccionPosterior`.
+ */
+import { existsSync } from 'node:fs';
+import { readFile, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import { commitRevisadoDe, informeRellenado, veredictoDeRonda } from '../core/informe-revision.js';
+import {
+  MENORES_PENDIENTES,
+  SECCION_VERIFICACION_LIGERA,
+  backlogMenores,
+  bloqueantesAbiertos,
+  fueraDeAlcance,
+  lineaVerificacionLigera,
+  menoresAbiertos,
+  repartirMenores,
+  verificacionDeRonda,
+  type VerificacionLigeraLeida,
+} from '../core/menores.js';
+import { anotarLineaEnSeccion } from '../core/transiciones.js';
+import { readTareaFile, writeTareaFile } from '../fs/task-store.js';
+import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
+import { isAncestor, runGit } from '../fs/git.js';
+import { autoCommit, extraerPushFlag, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
+import { REVISION_DIRNAME } from './review.js';
+
+export class VerificarMenoresCommandError extends Error {}
+
+export const FLAGS_VERIFICAR_MENORES: readonly string[] = ['--motivo', '--push', '-p'];
+
+const MOTIVO_POR_DEFECTO = 'no se corrigio en la verificacion ligera';
+
+export interface VerificarMenoresCommandDeps {
+  repoCwd: string;
+  /** Solo para tests: instante de la linea. */
+  ahora?: string;
+}
+
+export interface VerificarMenoresCommandResult {
+  id: string;
+  ronda: number;
+  commitRevisado: string;
+  commitVerificado: string;
+  ficheros: string[];
+  corregidos: string[];
+  pendientes: string[];
+  /** Ruta del backlog si se escribio; null si no hizo falta. */
+  backlogPath: string | null;
+  autoCommit: AutoCommitResult;
+}
+
+/** Pathspec de Git para «todo el repo menos `tareas/`», desde cualquier subdirectorio. */
+function fueraDeTareas(cwd: string): string[] {
+  return ['--', ':(top)', `:(top,exclude)${runGit(['rev-parse', '--show-prefix'], cwd)}tareas/`];
+}
+
+/** Ficheros (rutas desde la raiz del repo) que cambian fuera de `tareas/` entre dos commits. */
+export function codigoCambiado(desde: string, hasta: string, cwd: string): string[] {
+  const salida = runGit(['diff', '--name-only', desde, hasta, ...fueraDeTareas(cwd)], cwd);
+  return salida === '' ? [] : salida.split('\n').map((l) => l.trim()).filter((l) => l !== '');
+}
+
+export interface EstadoCorreccion {
+  /** Codigo cambiado fuera de `tareas/` desde el commit revisado. */
+  cambiados: string[];
+  /** La verificacion ligera de esa ronda y ese commit revisado, si la hay. */
+  verificacion: VerificacionLigeraLeida | null;
+  /** Hay verificacion y el codigo de `ref` es el que se verifico. */
+  alDia: boolean;
+}
+
+/**
+ * Que paso despues del commit revisado, para `finish` y `siguiente`. null si
+ * no hay referencia fiable (sin `Commit revisado`, o no es antepasado de
+ * `ref`): quien llama decide que hacer sin ella, como antes de TASK-099.
+ */
+export function estadoCorreccionPosterior(
+  body: string,
+  ronda: number,
+  revisado: string | null,
+  ref: string,
+  cwd: string
+): EstadoCorreccion | null {
+  if (revisado === null || !isAncestor(revisado, ref, cwd)) return null;
+  const cambiados = codigoCambiado(revisado, ref, cwd);
+  const verificacion = verificacionDeRonda(body, ronda, revisado);
+  let alDia = false;
+  if (verificacion !== null) {
+    try {
+      alDia =
+        isAncestor(verificacion.commitVerificado, ref, cwd) &&
+        codigoCambiado(verificacion.commitVerificado, ref, cwd).length === 0;
+    } catch {
+      alDia = false; // un SHA que ya no existe no verifica nada
+    }
+  }
+  return { cambiados, verificacion, alDia };
+}
+
+/** Saca `--motivo <texto>` de argv. */
+function extraerMotivo(argv: readonly string[]): { motivo: string | null; resto: string[] } {
+  const resto: string[] = [];
+  let motivo: string | null = null;
+  for (let i = 0; i < argv.length; i++) {
+    const arg = argv[i] as string;
+    if (arg === '--motivo') {
+      const valor = argv[i + 1];
+      if (valor === undefined || valor.startsWith('--') || valor.trim() === '') {
+        throw new VerificarMenoresCommandError('[ERROR] --motivo necesita un texto: --motivo "<por que no se corrigen>"');
+      }
+      motivo = valor.trim();
+      i++;
+      continue;
+    }
+    resto.push(arg);
+  }
+  return { motivo, resto };
+}
+
+export async function runVerificarMenoresCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  deps: VerificarMenoresCommandDeps
+): Promise<VerificarMenoresCommandResult> {
+  rechazarFlagsDesconocidos(
+    argv,
+    FLAGS_VERIFICAR_MENORES,
+    'verificar-menores',
+    (m) => new VerificarMenoresCommandError(m)
+  );
+  const { push, resto: sinPush } = extraerPushFlag(argv);
+  const { motivo, resto } = extraerMotivo(sinPush);
+  const [id, ...sobra] = resto;
+  const uso = 'Uso: taskctl verificar-menores TASK-NNN [--motivo "<texto>"] [--push]';
+  if (id === undefined || id.trim() === '') {
+    throw new VerificarMenoresCommandError(`[ERROR] Falta el ID de la tarea. ${uso}`);
+  }
+  if (sobra.length > 0) {
+    throw new VerificarMenoresCommandError(`[ERROR] Argumentos de mas: ${sobra.join(' ')}. ${uso}`);
+  }
+
+  const existing = await readTareaFile(tareasRoot, id);
+  assertTransitionAllowed('verificar-menores', existing === null ? null : existing.task);
+  const { task, body, filePath } = existing as NonNullable<typeof existing>;
+  const cwd = deps.repoCwd;
+  const error = (texto: string): VerificarMenoresCommandError =>
+    new VerificarMenoresCommandError(`[ERROR] ${task.id}: ${texto}`);
+
+  const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
+  const { ronda, nombres } = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
+  if (nombres.length === 0) throw error('no tiene ningun informe de revision. Lo crea "taskctl review".');
+  const informes = await Promise.all(nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8')));
+
+  const veredicto = veredictoDeRonda(informes);
+  if (veredicto === 'cambios-solicitados') {
+    throw error(
+      `la ronda ${String(ronda)} pidio cambios: corregir y pedir otra ronda con taskctl review ${task.id}. ` +
+        'La verificacion ligera es solo para MENORES tras una ronda aprobada.'
+    );
+  }
+  if (veredicto !== 'aprobada') {
+    throw error(
+      `la ronda ${String(ronda)} no tiene un veredicto aprobado ("${veredicto}"). ` +
+        `Escribelo con taskctl veredicto ${task.id} <aprobada|aprobada-con-correcciones|cambios-solicitados>.`
+    );
+  }
+  if (!informes.every(informeRellenado)) {
+    throw error(`algun informe de la ronda ${String(ronda)} sigue siendo la plantilla: lo rellena el revisor.`);
+  }
+
+  const bloqueantes = bloqueantesAbiertos(informes);
+  if (bloqueantes.length > 0) {
+    const ids = bloqueantes.map((h) => `${h.id} (${h.severidad || 'sin severidad'})`).join(', ');
+    throw error(
+      `tiene abierto ${ids}. Un CRITICO o IMPORTANTE abierto exige ` +
+        `taskctl veredicto ${task.id} cambios-solicitados y otra ronda (taskctl review ${task.id}); ` +
+        'la verificacion ligera no lo cubre.'
+    );
+  }
+
+  const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
+  const revisado =
+    peticiones.ronda !== ronda
+      ? null
+      : (
+          await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8')))
+        )
+          .map(commitRevisadoDe)
+          .find((c) => c !== null) ?? null;
+  if (revisado === null) {
+    throw error(
+      `la peticion de la ronda ${String(ronda)} no dice que commit se reviso ("- Commit revisado"): ` +
+        'sin esa referencia no se puede saber que cambio despues. Lo decide una persona.'
+    );
+  }
+  if (!isAncestor(revisado, 'HEAD', cwd)) {
+    throw error(`el commit revisado ${revisado} no es antepasado de HEAD: la rama se reescribio despues de revisar.`);
+  }
+  if (runGit(['status', '--porcelain', ...fueraDeTareas(cwd)], cwd) !== '') {
+    throw error('hay cambios sin commitear fuera de tareas/: commitea las correcciones antes de verificarlas.');
+  }
+
+  const cambiados = codigoCambiado(revisado, 'HEAD', cwd);
+  const menores = menoresAbiertos(informes);
+  const fuera = fueraDeAlcance(cambiados, menores);
+  if (fuera.length > 0) {
+    throw error(
+      `desde el commit revisado ${revisado} cambian ficheros que no son de ningun MENOR abierto ni tests: ` +
+        `${fuera.join(', ')}. Eso no es corregir MENORES, es codigo sin revisar. Dos salidas: ` +
+        `otra ronda (taskctl veredicto ${task.id} cambios-solicitados y taskctl review ${task.id}), ` +
+        `o que una persona decida integrarlo con taskctl finish ${task.id} --aceptar-sin-revisar.`
+    );
+  }
+
+  const { corregidos, pendientes } = repartirMenores(menores, cambiados);
+  const commitVerificado = runGit(['rev-parse', 'HEAD'], cwd);
+  const linea = lineaVerificacionLigera({
+    instante: deps.ahora ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
+    ronda,
+    commitRevisado: revisado,
+    commitVerificado,
+    ficheros: cambiados,
+    corregidos: corregidos.map((h) => h.id),
+    pendientes: pendientes.map((h) => h.id),
+  });
+  const tareaPath = await writeTareaFile(tareasRoot, task, anotarLineaEnSeccion(body, SECCION_VERIFICACION_LIGERA, linea));
+
+  // El backlog refleja la ultima verificacion: se reescribe si hay pendientes
+  // o si ya existia (para no dejar uno viejo con MENORES ya corregidos).
+  const backlog = path.join(revisionDir, MENORES_PENDIENTES);
+  let backlogPath: string | null = null;
+  if (pendientes.length > 0 || existsSync(backlog)) {
+    await writeFile(backlog, backlogMenores(task.id, ronda, pendientes, motivo ?? MOTIVO_POR_DEFECTO), 'utf8');
+    backlogPath = backlog;
+  }
+
+  const commitResult = autoCommit({
+    cwd,
+    rutas: backlogPath === null ? [tareaPath] : [tareaPath, backlogPath],
+    mensaje: mensajeChore(task.id, `verificacion ligera ronda ${String(ronda)}`),
+    push,
+  });
+  return {
+    id: task.id,
+    ronda,
+    commitRevisado: revisado,
+    commitVerificado,
+    ficheros: cambiados,
+    corregidos: corregidos.map((h) => h.id),
+    pendientes: pendientes.map((h) => h.id),
+    backlogPath,
+    autoCommit: commitResult,
+  };
+}
+
+export interface CodigoSinVerificar {
+  ronda: number;
+  revisado: string;
+  cambiados: string[];
+}
+
+/**
+ * Para la puerta de `finish` (criterio 3 de TASK-099): codigo commiteado en
+ * `ref` despues del `Commit revisado` de la ultima ronda primaria que no
+ * cubre ninguna verificacion ligera al dia; null si no lo hay. Sin `Commit
+ * revisado` en la peticion (tareas anteriores a TASK-059) no hay referencia y
+ * la puerta no aplica, como antes; con uno que no se puede comparar (SHA que
+ * Git no conoce, rama reescrita tras revisar) bloquea.
+ */
+export async function codigoSinVerificar(
+  taskDir: string,
+  body: string,
+  ref: string,
+  cwd: string
+): Promise<CodigoSinVerificar | null> {
+  const revisionDir = path.join(taskDir, REVISION_DIRNAME);
+  const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
+  const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
+  if (informes.nombres.length === 0 || peticiones.ronda !== informes.ronda) return null;
+  const revisado =
+    (await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8'))))
+      .map(commitRevisadoDe)
+      .find((c) => c !== null) ?? null;
+  if (revisado === null) return null;
+  // Con referencia pero sin poder comparar (SHA que Git no conoce, o rama
+  // reescrita despues de revisar) no se deja pasar: fail-closed.
+  const sinComparar: CodigoSinVerificar = {
+    ronda: informes.ronda,
+    revisado,
+    cambiados: [`(no se puede comparar: ${revisado.slice(0, 7)} no es un antepasado de "${ref}")`],
+  };
+  let estado: EstadoCorreccion | null;
+  try {
+    estado = estadoCorreccionPosterior(body, informes.ronda, revisado, ref, cwd);
+  } catch {
+    return sinComparar;
+  }
+  if (estado === null) return sinComparar;
+  if (estado.cambiados.length === 0 || estado.alDia) return null;
+  return { ronda: informes.ronda, revisado, cambiados: estado.cambiados };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 6de5a78..317a2a7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -30,6 +30,7 @@ export const FASES_SIGUIENTE = [
   'veredicto',
   'codex-review',
   'veredicto-codex',
+  'verificar-menores',
   'finish',
   'terminada',
 ] as const;
@@ -67,6 +68,25 @@ export interface ContextoFlujo {
    * el mismo agente que implemento (riesgo del plan de TASK-055).
    */
   informeEnCommitPropio: boolean;
+  /**
+   * TASK-099, en-revision aprobada: CRITICO/IMPORTANTE (o severidad que no se
+   * reconoce) abiertos en la ultima ronda. Ausente = 0 (como antes).
+   */
+  bloqueantesAbiertos?: number;
+  /** TASK-099: MENORES abiertos en la ultima ronda. Ausente = 0 (como antes). */
+  menoresAbiertos?: number;
+  /**
+   * TASK-099: hay una verificacion ligera de la ultima ronda (`taskctl
+   * verificar-menores`) y el codigo de ahora es el que verifico. Con ella,
+   * `informeEnCommitPropio` se calcula contra el commit verificado.
+   */
+  verificacionLigeraAlDia?: boolean;
+  /**
+   * TASK-099: lo unico que separa lo revisado de lo que se cerraria es codigo
+   * commiteado despues del Commit revisado (informes rellenados y
+   * commiteados, referencia fiable) y no hay verificacion ligera al dia.
+   */
+  correccionSinVerificar?: boolean;
 }
 
 /** Tope de rondas de revision: desde esta, otra ronda la decide una persona. */
@@ -272,6 +292,33 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
                 );
             }
           }
+          // TASK-099: aprobar con un bloqueante abierto es contradictorio. Un
+          // CRITICO o IMPORTANTE sigue exigiendo cambios-solicitados y otra
+          // ronda; lo deshace una persona (no hay verificacion ligera para eso).
+          if ((ctx.bloqueantesAbiertos ?? 0) > 0) {
+            return paso(
+              'veredicto',
+              false,
+              `la ronda esta aprobada pero tiene ${String(ctx.bloqueantesAbiertos)} CRITICO/IMPORTANTE abierto(s): ` +
+                'un bloqueante exige cambios-solicitados y otra ronda; lo decide una persona',
+              `taskctl veredicto ${task.id} cambios-solicitados`,
+              true
+            );
+          }
+          // TASK-099: correcciones de MENORES commiteadas tras la ronda aprobada.
+          // Nunca otra ronda: la verificacion ligera (es trabajo, como corregir
+          // tras cambios-solicitados: sigue sola solo en automatico).
+          if (ctx.correccionSinVerificar === true) {
+            return paso(
+              'verificar-menores',
+              false,
+              'hay codigo posterior al Commit revisado sin verificacion ligera: si son las correcciones de los ' +
+                'MENORES, registrarlas con verificar-menores (no se abre otra ronda)',
+              `taskctl verificar-menores ${task.id}`,
+              false,
+              true
+            );
+          }
           if (!ctx.informeEnCommitPropio) {
             return paso(
               'finish',
@@ -281,6 +328,18 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
               true
             );
           }
+          if ((ctx.menoresAbiertos ?? 0) > 0 && ctx.verificacionLigeraAlDia !== true) {
+            return paso(
+              'verificar-menores',
+              false,
+              `la ronda esta aprobada con ${String(ctx.menoresAbiertos)} MENOR(es) abierto(s): corregir los baratos, ` +
+                'commitear y registrarlo con verificar-menores; los que no se corrijan pasan al backlog de la tarea ' +
+                '(no se abre otra ronda)',
+              `taskctl verificar-menores ${task.id}`,
+              false,
+              true
+            );
+          }
           return paso('finish', true, 'la revision esta aprobada');
         default:
           return paso(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 0222e18..e65c551 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -97,6 +97,16 @@ export function commitRevisadoDe(peticion: string): string | null {
   return m === null ? null : (m[1] as string);
 }
 
+/**
+ * ¿Lo escribio un revisor? (IMP-1 y MEN-6 de la revision de TASK-059): una
+ * linea `- Revisor:` rellenada (no la de la plantilla) y sin la fila de
+ * ejemplo de la tabla. No prueba quien lo escribio: ese riesgo residual esta
+ * documentado y aceptado; esto descarta el informe que nadie relleno.
+ */
+export function informeRellenado(texto: string): boolean {
+  return /^- Revisor:[ \t]*(?!\(rellenar)\S/m.test(texto) && !texto.includes('(ej. IMP-1)');
+}
+
 export interface Hallazgo {
   id: string;
   severidad: string;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
new file mode 100644
index 0000000..76b57d2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
@@ -0,0 +1,167 @@
+/**
+ * La verificacion ligera de MENORES (TASK-099, P-2 de la auditoria del
+ * 2026-11-12). Modulo puro: recibe texto y listas, no toca disco ni Git.
+ *
+ * Tras una ronda aprobada (`aprobada` o `aprobada con correcciones`) solo
+ * pueden quedar MENORES. Corregirlos no abre otra ronda: `taskctl
+ * verificar-menores` comprueba que lo cambiado despues del `Commit revisado`
+ * se limita a los ficheros de esos MENORES (o a tests), lo deja registrado en
+ * `tarea.md` y pasa los que no se corrigieron a un backlog de la tarea. Un
+ * CRITICO o IMPORTANTE abierto sigue exigiendo cambios-solicitados y otra
+ * ronda: aqui no se rebaja nada.
+ *
+ * Medido antes de hacerlo (docs de la auditoria, paso 7): 71 rondas abiertas
+ * solo por MENORES encontraron 2 CRITICO/IMPORTANTE nuevos en 70,2 M tokens.
+ */
+import { hallazgosNoCerrados, severidadDe, type Hallazgo } from './informe-revision.js';
+
+/** Seccion de `tarea.md` donde `verificar-menores` deja cada verificacion. */
+export const SECCION_VERIFICACION_LIGERA = '## Verificacion ligera';
+
+/** Seccion de `tarea.md` que deja `finish --aceptar-sin-revisar`. */
+export const SECCION_CODIGO_SIN_REVISAR = '## Codigo integrado sin revisar';
+
+/** Nombre del backlog de MENORES dentro de `revision/`. */
+export const MENORES_PENDIENTES = 'menores-pendientes.md';
+
+/** Lo que bloquea: CRITICO, IMPORTANTE o una severidad que no se reconoce (fail-closed). */
+export function bloqueantesAbiertos(informes: readonly string[]): Hallazgo[] {
+  return abiertos(informes).filter((h) => severidadDe(h.severidad) !== 'MENOR');
+}
+
+/** MENORES no cerrados (Estado distinto de `corregido` y `aceptado`). */
+export function menoresAbiertos(informes: readonly string[]): Hallazgo[] {
+  return abiertos(informes).filter((h) => severidadDe(h.severidad) === 'MENOR');
+}
+
+function abiertos(informes: readonly string[]): Hallazgo[] {
+  return informes.flatMap((t) => hallazgosNoCerrados(t).abiertos);
+}
+
+/**
+ * Rutas que cita una celda `Fichero`: `src/a.ts:42`, `` `src/a.ts` L10-20 ``,
+ * `src/a.ts, test/a.test.ts`, `./src/a.ts#L3`. Se queda con los trozos que
+ * parecen una ruta (tienen `/` o `.`), sin numero de linea ni ancla.
+ */
+export function rutasDeCelda(celda: string): string[] {
+  return celda
+    .replace(/[`*]/g, '')
+    .split(/[\s,;]+/)
+    .map((t) => t.replace(/#L?\d.*$/i, '').replace(/:\d+(?:[-:]\d+)*$/, '').replace(/^\.\//, '').replace(/\\/g, '/'))
+    .map((t) => t.replace(/[().]+$/, '').replace(/^\(+/, ''))
+    .filter((t) => t !== '' && /[/.]/.test(t) && !/^L?\d/.test(t));
+}
+
+/**
+ * ¿La ruta del diff (relativa a la raiz del repo) es la que cita el hallazgo?
+ * El revisor suele escribirla relativa al paquete (`src/a.ts`) y Git la da
+ * desde la raiz (`plugins/x/src/a.ts`): vale la igualdad o el sufijo tras `/`.
+ */
+export function mismaRuta(rutaDiff: string, citada: string): boolean {
+  return rutaDiff === citada || rutaDiff.endsWith(`/${citada}`);
+}
+
+/** Heuristica de fichero de test por ruta: `test/`, `tests/`, `__tests__/`, `.test.`, `.spec.`. */
+export function esRutaDeTest(ruta: string): boolean {
+  return /(^|\/)(test|tests|__tests__)\//.test(ruta) || /\.(test|spec)\./.test(ruta);
+}
+
+/** Ficheros cambiados que no son de ningun MENOR abierto ni tests: lo que nadie reviso. */
+export function fueraDeAlcance(cambiados: readonly string[], menores: readonly Hallazgo[]): string[] {
+  const citadas = menores.flatMap((h) => rutasDeCelda(h.fichero));
+  return cambiados.filter((f) => !esRutaDeTest(f) && !citadas.some((c) => mismaRuta(f, c)));
+}
+
+/** Reparto: corregido = algun fichero que cita cambio; pendiente = ninguno cambio (o no cita ninguno). */
+export function repartirMenores(
+  menores: readonly Hallazgo[],
+  cambiados: readonly string[]
+): { corregidos: Hallazgo[]; pendientes: Hallazgo[] } {
+  const corregidos: Hallazgo[] = [];
+  const pendientes: Hallazgo[] = [];
+  for (const h of menores) {
+    const tocado = rutasDeCelda(h.fichero).some((c) => cambiados.some((f) => mismaRuta(f, c)));
+    (tocado ? corregidos : pendientes).push(h);
+  }
+  return { corregidos, pendientes };
+}
+
+export interface EntradaVerificacionLigera {
+  instante: string;
+  ronda: number;
+  commitRevisado: string;
+  commitVerificado: string;
+  ficheros: readonly string[];
+  corregidos: readonly string[];
+  pendientes: readonly string[];
+}
+
+const lista = (xs: readonly string[]): string => (xs.length === 0 ? 'ninguno' : xs.join(', '));
+
+/** Linea de la seccion `## Verificacion ligera`. `leerVerificacionesLigeras` la vuelve a leer. */
+export function lineaVerificacionLigera(e: EntradaVerificacionLigera): string {
+  return (
+    `- ${e.instante}: ronda ${String(e.ronda)}; commit revisado ${e.commitRevisado}; ` +
+    `commit verificado ${e.commitVerificado}; ficheros: ${lista(e.ficheros)}; ` +
+    `corregidos: ${lista(e.corregidos)}; pendientes: ${lista(e.pendientes)}`
+  );
+}
+
+export interface VerificacionLigeraLeida {
+  ronda: number;
+  commitRevisado: string;
+  commitVerificado: string;
+}
+
+/** Las entradas de la seccion `## Verificacion ligera` de un `tarea.md`, en orden. */
+export function leerVerificacionesLigeras(body: string): VerificacionLigeraLeida[] {
+  const lineas = body.replace(/\r/g, '').split('\n');
+  const inicio = lineas.findIndex((l) => l.trim() === SECCION_VERIFICACION_LIGERA);
+  if (inicio === -1) return [];
+  const leidas: VerificacionLigeraLeida[] = [];
+  for (let i = inicio + 1; i < lineas.length; i++) {
+    const l = lineas[i] as string;
+    if (/^##\s/.test(l)) break;
+    const m = /ronda (\d+); commit revisado ([0-9a-f]{7,40}); commit verificado ([0-9a-f]{7,40})\b/.exec(l);
+    if (m !== null) {
+      leidas.push({ ronda: Number(m[1]), commitRevisado: m[2] as string, commitVerificado: m[3] as string });
+    }
+  }
+  return leidas;
+}
+
+/**
+ * La ultima verificacion ligera de esa ronda y ese commit revisado, o null.
+ * Los SHA se comparan por prefijo: la peticion puede llevar el corto.
+ */
+export function verificacionDeRonda(
+  body: string,
+  ronda: number,
+  commitRevisado: string
+): VerificacionLigeraLeida | null {
+  const mismoSha = (a: string, b: string): boolean => a.startsWith(b) || b.startsWith(a);
+  const deRonda = leerVerificacionesLigeras(body).filter(
+    (v) => v.ronda === ronda && mismoSha(v.commitRevisado, commitRevisado)
+  );
+  return deRonda.at(-1) ?? null;
+}
+
+const celda = (s: string): string => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
+
+/** Contenido de `revision/menores-pendientes.md`: backlog que ni abre ronda ni bloquea finish. */
+export function backlogMenores(
+  id: string,
+  ronda: number,
+  pendientes: readonly Hallazgo[],
+  motivo: string
+): string {
+  const filas = pendientes.map((h) => `| ${celda(h.id)} | ${celda(h.fichero) || '—'} | ${celda(motivo)} |`);
+  return (
+    `# MENORES pendientes — ${id}\n\n` +
+    `MENORES abiertos de la ronda ${String(ronda)} que no se corrigieron en la verificacion ligera ` +
+    '(`taskctl verificar-menores`). Son backlog de la tarea: no abren otra ronda ni impiden `finish`.\n\n' +
+    '| ID | Fichero | Motivo |\n|---|---|---|\n' +
+    filas.join('\n') +
+    '\n'
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
index b3cba44..106d1b3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
@@ -18,6 +18,7 @@ export type TaskCommand =
   | 'review'
   | 'codex-review'
   | 'veredicto'
+  | 'verificar-menores'
   | 'finish';
 
 export interface TransitionContext {
@@ -262,6 +263,22 @@ export function assertTransitionAllowed(
       return;
     }
 
+    case 'verificar-menores': {
+      // TASK-099: la verificacion ligera de MENORES tras una ronda aprobada.
+      // Las demas guardas (veredicto, bloqueantes, alcance) las comprueba el
+      // comando leyendo revision/ y Git; aqui solo el estado.
+      if (task.estado !== 'en-revision') {
+        throw err(
+          task.id,
+          command,
+          task.estado,
+          'taskctl review',
+          `esta en estado "${task.estado}", no en "en-revision". taskctl verificar-menores solo se usa tras una ronda de revision aprobada.`
+        );
+      }
+      return;
+    }
+
     case 'codex-review': {
       if (task.estado !== 'en-revision') {
         throw err(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 589983b..bdb387a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -431,7 +431,7 @@ function anotarLineaUnica(body: string, titulo: string, instante: string, texto:
   return anotarLineaEnSeccion(body, titulo, `- ${instante}: ${texto}`);
 }
 
-function anotarLineaEnSeccion(body: string, titulo: string, linea: string): string {
+export function anotarLineaEnSeccion(body: string, titulo: string, linea: string): string {
   const eol = body.includes('\r\n') ? '\r\n' : '\n';
   const lineas = body.split(/\r?\n/);
   const rango = rangoDeSeccion(lineas, titulo);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts
new file mode 100644
index 0000000..a2ad304
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts
@@ -0,0 +1,260 @@
+/**
+ * TASK-099: la verificacion ligera de MENORES (`taskctl verificar-menores`),
+ * la puerta de `finish` sobre el codigo posterior al revisado y lo que
+ * propone `siguiente`. Repos Git temporales de verdad, sin mocks.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, readFile, writeFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { runVerificarMenoresCommand, VerificarMenoresCommandError } from '../../src/commands/verificar-menores.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import { runSiguienteCommand } from '../../src/commands/siguiente.js';
+import { SECCION_CODIGO_SIN_REVISAR, SECCION_VERIFICACION_LIGERA } from '../../src/core/menores.js';
+import {
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  setupTaskEnRevision,
+} from '../helpers/finish-fixtures.js';
+
+const FILA_MEN1 = '| MEN-1 | MENOR | abierto | src/a.ts:3 | implementacion |';
+const FILA_MEN2 = '| MEN-2 | MENOR | abierto | src/b.ts | implementacion |';
+
+function informe(veredicto: string, filas: string[]): string {
+  return (
+    '# Informe de revision (ronda 1)\n\n- Revisor: code-quality-reviewer\n' +
+    `- Veredicto: ${veredicto}\n\n## Hallazgos\n\n` +
+    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
+    filas.join('\n') +
+    '\n'
+  );
+}
+
+async function escribir(repoRoot: string, rel: string, texto: string): Promise<void> {
+  await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
+  await writeFile(path.join(repoRoot, rel), texto, 'utf8');
+}
+
+/**
+ * Tarea en revision con codigo revisado (src/a.ts, src/b.ts, src/otro.ts),
+ * peticion de la ronda 1 con su `Commit revisado` y el informe dado.
+ * Devuelve el SHA revisado.
+ */
+async function montar(
+  repoRoot: string,
+  tareasRoot: string,
+  id: string,
+  veredicto: string,
+  filas: string[]
+): Promise<{ revisado: string; revisionDir: string }> {
+  const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-menores` });
+  await setupTaskEnRevision(repoRoot, tareasRoot, task);
+  for (const f of ['src/a.ts', 'src/b.ts', 'src/otro.ts']) await escribir(repoRoot, f, `// ${f}\nexport const x = 1;\n`);
+  commitAll(repoRoot, `feat(${id}): codigo revisado`);
+  const revisado = git(['rev-parse', 'HEAD'], repoRoot).trim();
+  const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
+  await writeFile(
+    path.join(revisionDir, 'peticion-revision-1.md'),
+    `# Peticion de revision — ${id} (ronda 1)\n\n- Commit revisado (HEAD): ${revisado}\n`,
+    'utf8'
+  );
+  await writeFile(path.join(revisionDir, 'informe-revision-1.md'), informe(veredicto, filas), 'utf8');
+  commitAll(repoRoot, `chore(${id}): informe de la ronda 1`);
+  return { revisado, revisionDir };
+}
+
+const tareaEnRevision = (tareasRoot: string, id: string) => path.join(tareasRoot, '03-en-revision', id, 'tarea.md');
+const finish = (tareasRoot: string, repoRoot: string, args: string[]) =>
+  runFinishCommand(tareasRoot, args, '2026-11-12', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+const fase = async (tareasRoot: string, repoRoot: string, id: string) =>
+  (await runSiguienteCommand(tareasRoot, [id, '--json'], { repoCwd: repoRoot })).fase;
+
+test('verificar-menores: corrige un MENOR, el otro va al backlog, commit solo en tareas/, y finish cierra', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-901';
+    const { revisado, revisionDir } = await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [
+      FILA_MEN1,
+      FILA_MEN2,
+    ]);
+    // Antes de corregir: siguiente pide la verificacion ligera, no otra ronda.
+    assert.equal(await fase(tareasRoot, repoRoot, id), 'verificar-menores');
+
+    await escribir(repoRoot, 'src/a.ts', '// src/a.ts\nexport const x = 2;\n');
+    await escribir(repoRoot, 'test/a.test.ts', '// test nuevo del MENOR\n');
+    commitAll(repoRoot, `fix(${id}): MEN-1`);
+    // Con la correccion commiteada y sin verificar, tampoco otra ronda.
+    assert.equal(await fase(tareasRoot, repoRoot, id), 'verificar-menores');
+    const corregido = git(['rev-parse', 'HEAD'], repoRoot).trim();
+
+    const r = await runVerificarMenoresCommand(tareasRoot, [id, '--motivo', 'lo hara TASK-950'], {
+      repoCwd: repoRoot,
+      ahora: '2026-11-12T10:00:00Z',
+    });
+    assert.deepEqual(r.corregidos, ['MEN-1']);
+    assert.deepEqual(r.pendientes, ['MEN-2']);
+    assert.deepEqual(r.ficheros.sort(), ['src/a.ts', 'test/a.test.ts']);
+    assert.equal(r.commitRevisado, revisado);
+    assert.equal(r.commitVerificado, corregido);
+
+    const tarea = await readFile(tareaEnRevision(tareasRoot, id), 'utf8');
+    assert.ok(tarea.includes(SECCION_VERIFICACION_LIGERA));
+    assert.ok(tarea.includes(`- 2026-11-12T10:00:00Z: ronda 1; commit revisado ${revisado}; commit verificado ${corregido}`));
+    const backlog = await readFile(path.join(revisionDir, 'menores-pendientes.md'), 'utf8');
+    assert.ok(backlog.includes('| MEN-2 | src/b.ts | lo hara TASK-950 |'));
+    assert.ok(!backlog.includes('MEN-1'));
+    // El commit de la verificacion solo toca tareas/.
+    const tocados = git(['show', '--name-only', '--format=', 'HEAD'], repoRoot).trim().split('\n');
+    assert.ok(tocados.length > 0 && tocados.every((f) => f.startsWith('tareas/')), tocados.join(', '));
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+
+    // Con la verificacion al dia: finish (el MENOR del backlog no bloquea).
+    assert.equal(await fase(tareasRoot, repoRoot, id), 'finish');
+    const cerrada = await finish(tareasRoot, repoRoot, [id]);
+    assert.match(cerrada.filePath, /04-terminadas/);
+    assert.ok(!(await readFile(cerrada.filePath, 'utf8')).includes(SECCION_CODIGO_SIN_REVISAR));
+  });
+});
+
+test('verificar-menores: un IMPORTANTE abierto exige cambios-solicitados y otra ronda; no escribe nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-902';
+    await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [
+      FILA_MEN1,
+      '| IMP-1 | IMPORTANTE | abierto | src/b.ts | implementacion |',
+    ]);
+    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    await assert.rejects(
+      () => runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot }),
+      (e: unknown) => {
+        assert.ok(e instanceof VerificarMenoresCommandError);
+        assert.match((e as Error).message, /IMP-1/);
+        assert.match((e as Error).message, /taskctl veredicto TASK-902 cambios-solicitados/);
+        return true;
+      }
+    );
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), antes);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+    // siguiente no propone verificar ni cerrar: el veredicto, decidido por una persona.
+    const paso = await runSiguienteCommand(tareasRoot, [id, '--json'], { repoCwd: repoRoot });
+    assert.equal(paso.fase, 'veredicto');
+    assert.equal(paso.comando, `taskctl veredicto ${id} cambios-solicitados`);
+  });
+});
+
+test('verificar-menores: rechaza tras cambios-solicitados (eso es otra ronda, no una verificacion ligera)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-903';
+    await montar(repoRoot, tareasRoot, id, 'cambios-solicitados', [FILA_MEN1]);
+    await assert.rejects(
+      () => runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot }),
+      /pidio cambios: corregir y pedir otra ronda con taskctl review/
+    );
+  });
+});
+
+test('codigo fuera de los MENORES: verificar-menores aborta, finish tambien, y --aceptar-sin-revisar lo integra anotado', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-904';
+    const { revisado } = await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [FILA_MEN1]);
+    await escribir(repoRoot, 'src/a.ts', '// arreglo del MENOR\n');
+    await escribir(repoRoot, 'src/otro.ts', '// cambio que nadie reviso\n');
+    commitAll(repoRoot, `fix(${id}): MEN-1 y algo mas`);
+
+    await assert.rejects(
+      () => runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot }),
+      (e: unknown) => {
+        assert.match((e as Error).message, /src\/otro\.ts/);
+        assert.doesNotMatch((e as Error).message, /src\/a\.ts,/);
+        assert.match((e as Error).message, /--aceptar-sin-revisar/);
+        return true;
+      }
+    );
+    const antes = git(['rev-parse', 'develop'], repoRoot).trim();
+    await assert.rejects(
+      () => finish(tareasRoot, repoRoot, [id]),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match((e as Error).message, /taskctl verificar-menores TASK-904/);
+        assert.match((e as Error).message, /No se ha tocado nada/);
+        return true;
+      }
+    );
+    assert.equal(git(['rev-parse', 'develop'], repoRoot).trim(), antes, 'finish no integro nada');
+
+    const cerrada = await finish(tareasRoot, repoRoot, [id, '--aceptar-sin-revisar']);
+    const tarea = await readFile(cerrada.filePath, 'utf8');
+    assert.ok(tarea.includes(SECCION_CODIGO_SIN_REVISAR));
+    assert.ok(tarea.includes(`${revisado.slice(0, 7)}..feature/task-904-menores`));
+    assert.match(tarea, /src\/otro\.ts/);
+  });
+});
+
+test('una verificacion vieja no vale: codigo nuevo despues de verificar vuelve a bloquear finish', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-905';
+    await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [FILA_MEN1]);
+    await escribir(repoRoot, 'src/a.ts', '// arreglo\n');
+    commitAll(repoRoot, `fix(${id}): MEN-1`);
+    await runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot });
+    await escribir(repoRoot, 'src/a.ts', '// otro cambio tras verificar\n');
+    commitAll(repoRoot, `fix(${id}): mas cambios`);
+
+    assert.equal(await fase(tareasRoot, repoRoot, id), 'verificar-menores');
+    await assert.rejects(() => finish(tareasRoot, repoRoot, [id]), /ninguna verificacion ligera cubre: src\/a\.ts/);
+    // Verificar otra vez lo desbloquea.
+    await runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot });
+    assert.equal(await fase(tareasRoot, repoRoot, id), 'finish');
+  });
+});
+
+test('verificar-menores sin codigo posterior: solo pasa los MENORES al backlog, y finish no lo exige', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-906';
+    const { revisionDir } = await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [FILA_MEN1, FILA_MEN2]);
+    const r = await runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot });
+    assert.deepEqual(r.corregidos, []);
+    assert.deepEqual(r.pendientes, ['MEN-1', 'MEN-2']);
+    assert.ok(existsSync(path.join(revisionDir, 'menores-pendientes.md')));
+    assert.equal(await fase(tareasRoot, repoRoot, id), 'finish');
+  });
+});
+
+test('finish sin verificacion ligera y sin codigo posterior cierra como antes', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-907';
+    await montar(repoRoot, tareasRoot, id, 'aprobada', []);
+    assert.equal(await fase(tareasRoot, repoRoot, id), 'finish');
+    const cerrada = await finish(tareasRoot, repoRoot, [id]);
+    assert.match(cerrada.filePath, /04-terminadas/);
+  });
+});
+
+test('finish con un Commit revisado que ya no es antepasado de la rama no cierra sin una persona', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-908';
+    const { revisionDir } = await montar(repoRoot, tareasRoot, id, 'aprobada', []);
+    const rama = git(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot).trim();
+    // Un commit que no esta en la rama de la tarea (como tras reescribirla).
+    git(['checkout', '-q', '-b', 'lado', 'develop'], repoRoot);
+    await escribir(repoRoot, 'lado.txt', 'x\n');
+    commitAll(repoRoot, 'commit de otra rama');
+    const ajeno = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    git(['checkout', '-q', rama], repoRoot);
+    await writeFile(
+      path.join(revisionDir, 'peticion-revision-1.md'),
+      `# Peticion de revision — ${id} (ronda 1)
+
+- Commit revisado (HEAD): ${ajeno}
+`,
+      'utf8'
+    );
+    commitAll(repoRoot, `chore(${id}): peticion con un commit ajeno`);
+    await assert.rejects(() => finish(tareasRoot, repoRoot, [id]), /no se puede comparar/);
+    const cerrada = await finish(tareasRoot, repoRoot, [id, '--aceptar-sin-revisar']);
+    assert.ok((await readFile(cerrada.filePath, 'utf8')).includes(SECCION_CODIGO_SIN_REVISAR));
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/menores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/menores.test.ts
new file mode 100644
index 0000000..145fc0e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/menores.test.ts
@@ -0,0 +1,133 @@
+/**
+ * TASK-099: logica pura de la verificacion ligera de MENORES.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  backlogMenores,
+  bloqueantesAbiertos,
+  esRutaDeTest,
+  fueraDeAlcance,
+  leerVerificacionesLigeras,
+  lineaVerificacionLigera,
+  menoresAbiertos,
+  repartirMenores,
+  rutasDeCelda,
+  SECCION_VERIFICACION_LIGERA,
+  verificacionDeRonda,
+} from '../../src/core/menores.js';
+
+function informe(filas: string[]): string {
+  return (
+    '# Informe\n\n- Revisor: code-quality-reviewer\n- Veredicto: aprobada con correcciones\n\n## Hallazgos\n\n' +
+    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
+    filas.join('\n') +
+    '\n'
+  );
+}
+
+test('bloqueantes: CRITICO, IMPORTANTE y severidad desconocida abiertos bloquean; cerrados y MENORES no', () => {
+  const texto = informe([
+    '| CRIT-1 | CRITICO | abierto | src/a.ts | implementacion |',
+    '| IMP-1 | IMPORTANTE | corregido | src/b.ts | implementacion |',
+    '| IMP-2 | **Importante** | aceptado | src/b.ts | plan |',
+    '| X-1 | Alta | abierto | src/c.ts | implementacion |',
+    '| MEN-1 | MENOR | abierto | src/d.ts | implementacion |',
+  ]);
+  assert.deepEqual(
+    bloqueantesAbiertos([texto]).map((h) => h.id),
+    ['CRIT-1', 'X-1']
+  );
+  assert.deepEqual(
+    menoresAbiertos([texto]).map((h) => h.id),
+    ['MEN-1']
+  );
+  // Contraprueba: solo MENORES (abiertos o no) no bloquea nada.
+  const soloMenores = informe(['| MEN-1 | MENOR | abierto | src/d.ts | x |', '| MEN-2 | menor | corregido | src/e.ts | x |']);
+  assert.deepEqual(bloqueantesAbiertos([soloMenores]), []);
+  assert.deepEqual(
+    menoresAbiertos([soloMenores]).map((h) => h.id),
+    ['MEN-1']
+  );
+});
+
+test('rutasDeCelda quita linea, ancla, comillas invertidas y ./; separa varias', () => {
+  assert.deepEqual(rutasDeCelda('src/a.ts:42'), ['src/a.ts']);
+  assert.deepEqual(rutasDeCelda('`src/a.ts` L10-20'), ['src/a.ts']);
+  assert.deepEqual(rutasDeCelda('./src/a.ts#L3, test/a.test.ts:1-4'), ['src/a.ts', 'test/a.test.ts']);
+  assert.deepEqual(rutasDeCelda('src\\win\\b.ts'), ['src/win/b.ts']);
+  assert.deepEqual(rutasDeCelda('—'), []);
+  assert.deepEqual(rutasDeCelda(''), []);
+});
+
+test('esRutaDeTest reconoce carpetas y sufijos de test, y nada mas', () => {
+  for (const r of ['test/a.ts', 'pkg/tests/b.py', 'src/__tests__/c.tsx', 'src/d.test.ts', 'src/e.spec.js']) {
+    assert.equal(esRutaDeTest(r), true, r);
+  }
+  for (const r of ['src/testing.ts', 'src/contest/a.ts', 'src/test-utils.ts', 'README.md']) {
+    assert.equal(esRutaDeTest(r), false, r);
+  }
+});
+
+test('alcance: fichero de un MENOR (tambien por sufijo desde la raiz) y tests valen; un fichero ajeno no', () => {
+  const menores = menoresAbiertos([
+    informe(['| MEN-1 | MENOR | abierto | src/a.ts:42 | x |', '| MEN-2 | MENOR | abierto | `docs/b.md` | x |']),
+  ]);
+  assert.deepEqual(fueraDeAlcance(['plugins/p/src/a.ts', 'docs/b.md', 'plugins/p/test/a.test.ts'], menores), []);
+  assert.deepEqual(fueraDeAlcance(['src/a.ts', 'src/otro.ts'], menores), ['src/otro.ts']);
+  // Sufijo solo tras '/': "xsrc/a.ts" no es "src/a.ts".
+  assert.deepEqual(fueraDeAlcance(['xsrc/a.ts'], menores), ['xsrc/a.ts']);
+  // Sin MENORES, cualquier cambio que no sea test esta fuera.
+  assert.deepEqual(fueraDeAlcance(['src/a.ts', 'test/x.ts'], []), ['src/a.ts']);
+});
+
+test('reparto: corregido si cambio algun fichero que cita; pendiente si no o si no cita ninguno', () => {
+  const menores = menoresAbiertos([
+    informe([
+      '| MEN-1 | MENOR | abierto | src/a.ts | x |',
+      '| MEN-2 | MENOR | abierto | src/b.ts | x |',
+      '| MEN-3 | MENOR | abierto | — | x |',
+    ]),
+  ]);
+  const { corregidos, pendientes } = repartirMenores(menores, ['root/src/a.ts']);
+  assert.deepEqual(
+    corregidos.map((h) => h.id),
+    ['MEN-1']
+  );
+  assert.deepEqual(
+    pendientes.map((h) => h.id),
+    ['MEN-2', 'MEN-3']
+  );
+});
+
+test('la linea de verificacion se vuelve a leer, y se elige la ultima de esa ronda y ese commit', () => {
+  const linea = (ronda: number, rev: string, ver: string) =>
+    lineaVerificacionLigera({
+      instante: '2026-11-12T10:00:00Z',
+      ronda,
+      commitRevisado: rev,
+      commitVerificado: ver,
+      ficheros: ['src/a.ts'],
+      corregidos: ['MEN-1'],
+      pendientes: [],
+    });
+  const l1 = linea(1, 'aaaaaaa1111', 'bbbbbbb2222');
+  assert.match(l1, /ficheros: src\/a\.ts; corregidos: MEN-1; pendientes: ninguno$/);
+  const body =
+    `## Objetivo\n\nx\n\n${SECCION_VERIFICACION_LIGERA}\n\n${l1}\n${linea(1, 'aaaaaaa1111', 'ccccccc3333')}\n` +
+    `${linea(2, 'ddddddd4444', 'eeeeeee5555')}\n\n## Resultado\n\n- ronda 9; commit revisado 1234567; commit verificado 7654321\n`;
+  assert.equal(leerVerificacionesLigeras(body).length, 3, 'lo de otra seccion no cuenta');
+  assert.equal(verificacionDeRonda(body, 1, 'aaaaaaa')?.commitVerificado, 'ccccccc3333', 'prefijo del SHA y la ultima');
+  assert.equal(verificacionDeRonda(body, 2, 'aaaaaaa'), null, 'otra ronda no vale');
+  assert.equal(verificacionDeRonda(body, 1, 'fffffff'), null, 'otro commit revisado no vale');
+  assert.deepEqual(leerVerificacionesLigeras('## Objetivo\n\nnada\n'), []);
+});
+
+test('backlog: tabla con id, fichero y motivo; escapa barras verticales', () => {
+  const pendientes = menoresAbiertos([informe(['| MEN-2 | MENOR | abierto | src/b.ts:3 | x |'])]);
+  const texto = backlogMenores('TASK-001', 1, pendientes, 'lo hace TASK-002 | despues');
+  assert.match(texto, /^# MENORES pendientes — TASK-001/);
+  assert.match(texto, /no abren otra ronda ni impiden `finish`/);
+  assert.match(texto, /\| ID \| Fichero \| Motivo \|/);
+  assert.ok(texto.includes('| MEN-2 | src/b.ts:3 | lo hace TASK-002 \\| despues |'));
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index 5bdc231..91e7b43 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -89,6 +89,15 @@ const TABLA: Caso[] = [
   { nombre: 'codex aprobada sin revision_codex no cuenta', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
   // TASK-059: guardas del automatico.
   { nombre: 'aprobada sin informe en commit propio', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  // TASK-099: tras una ronda aprobada los MENORES nunca abren otra ronda, en ningun modo.
+  { nombre: 'aprobada con MENORES abiertos sin verificacion', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', menoresAbiertos: 2, bloqueantesAbiertos: 0, verificacionLigeraAlDia: false, correccionSinVerificar: false }, fase: 'verificar-menores', comando: 'taskctl verificar-menores TASK-100', acciones: ['detener', 'detener', 'continuar'] },
+  { nombre: 'aprobada con MENORES y verificacion al dia', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', menoresAbiertos: 2, bloqueantesAbiertos: 0, verificacionLigeraAlDia: true, correccionSinVerificar: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'aprobada con correcciones commiteadas sin verificar', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false, menoresAbiertos: 1, bloqueantesAbiertos: 0, verificacionLigeraAlDia: false, correccionSinVerificar: true }, fase: 'verificar-menores', comando: 'taskctl verificar-menores TASK-100', acciones: ['detener', 'detener', 'continuar'] },
+  { nombre: 'aprobada sin MENORES ni correcciones', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', menoresAbiertos: 0, bloqueantesAbiertos: 0, verificacionLigeraAlDia: false, correccionSinVerificar: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  // Un bloqueante abierto con la ronda aprobada: cambios-solicitados, decidido por una persona.
+  { nombre: 'aprobada con un IMPORTANTE abierto', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', menoresAbiertos: 3, bloqueantesAbiertos: 1, correccionSinVerificar: true }, fase: 'veredicto', comando: 'taskctl veredicto TASK-100 cambios-solicitados', acciones: ['detener', 'preguntar', 'preguntar'] },
+  // Codigo posterior que no se puede atribuir a correcciones (informe sin commitear, sin referencia): como antes.
+  { nombre: 'aprobada, no coincide y no es correccion', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false, menoresAbiertos: 1, bloqueantesAbiertos: 0, verificacionLigeraAlDia: false, correccionSinVerificar: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'cambios en la ronda 2 (bajo el tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 2 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
   // TASK-095: en el tope se pregunta en TODOS los modos (antes manual y semi
   // se detenian sin decir que decidir: IMP-3 de TASK-058, IMP-2 de TASK-059),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
index 5be2ebe..62ecd14 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -143,6 +143,7 @@ const SKILL_DE_FASE: Record<string, string | null> = {
   veredicto: 'review',
   'codex-review': 'review',
   'veredicto-codex': 'review',
+  'verificar-menores': 'review',
   finish: 'finish',
   terminada: null,
 };
````

## Excluido del diff (17 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-099/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-099/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-099/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-099/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-099/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-099/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-099/tarea.md                                                       |  31 +++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  38 +++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-opciones.js                            |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  33 +++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                                  |  55 ++++++++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-menores.js                          | 232 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                          |  20 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                               |   9 ++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/menores.js                                        | 118 ++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js                                  |   9 ++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                   |   2 +-
 17 files changed, 518 insertions(+), 31 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 168.6 s

Final de la salida (truncada: 160495 bytes en total):

````
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.2903ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.3884ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.2508ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.3476ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (39.9771ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.1393ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.8733ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.5021ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3183ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.1728ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1894ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2161ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2287ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.23ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2323ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2246ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1587ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2361ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.2171ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1813ms)
✔ resolverAsignado: recorta los tres escalones (0.1599ms)
✔ las siete skills de fase existen, con frontmatter portable y name igual al directorio (33.2517ms)
✔ la descripcion de cada fase es corta, sin < ni >, y especifica del flujo (no se dispara con un «plan» suelto) (10.6582ms)
✔ cada skill de fase nombra su subcomando de taskctl, taskctl siguiente y la seccion de avance (9.5299ms)
✔ la seccion de avance asigna a CADA fase que puede devolver siguiente la skill que le toca (3.0126ms)
✔ las skills de fase y la seccion de avance no mencionan rutas ni documentos internos de este repo (30.4687ms)
✔ plan no reabre una ronda al reanudar (IMP-1) y review no relanza Codex en veredicto-codex (IMP-2) (17.2093ms)
✔ semiautomatico (TASK-058): preguntar y continuar encadenan con la herramienta Skill y la cadena bloquea el arbol (7.0357ms)
✔ automatico (TASK-059): approve sin preguntar, start implementa, review corrige y commitea el informe solo (32.7496ms)
✔ la cadena se cierra en cada camino de salida: detener, no, error (MEN-1 de la revision de TASK-058) (14.328ms)
✔ approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa (4.4216ms)
ℹ tests 855
ℹ suites 0
ℹ pass 855
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 158241.9829
[verificar-impacto] node --test termino con 0 en 158.4 s.
````
