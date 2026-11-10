# Peticion de revision — TASK-097 (ronda 1)

- Tarea: TASK-097 — Regla de una hora: plan estima la duracion de punta a punta y propone trocear
- Rama revisada: feature/task-097-regla-de-una-hora-plan-estima-la-duracio
- Rama base: develop
- Commit revisado (HEAD): 3493c3101e5949883305a16f7f2c6589b0dd2320
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-097 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-097/tarea.md
- tareas/03-en-revision/TASK-097/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts

## Commits a revisar (git log develop..HEAD)

````
3493c31 docs(TASK-097): autorrevision
48fba41 docs(TASK-097): task-workflow remite a duracion.md sin pasar de 15 KB
482c2dc feat(TASK-097): regla de una hora, plan estima la duracion de punta a punta y propone trocear
00640da chore(TASK-097): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 15df121..d59c045 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -7,6 +7,24 @@
 
 ## 0.14.0 — sin publicar
 
+Regla de una hora (TASK-097). Una tarea prevista de mas de una hora de punta a
+punta (de la rama abierta al cierre con merge) se trocea. La plantilla de
+`plan-final.md` gana la linea `Duracion estimada: N min` con sus senales
+(ficheros de codigo previstos, capas, criterios; los ficheros de codigo son la
+mejor senal medida en 147 tareas de dos proyectos). Con mas de 60 min, o con una
+cifra que no se entiende, `taskctl siguiente` devuelve `preguntar` en cualquier
+modo y `taskctl approve --decidido-por automatico` se rechaza: decide una
+persona. Sin la linea, `approve` solo avisa (los planes anteriores no se
+atascan). `taskctl finish` anota en `tarea.md` la seccion `## Duracion` con la
+estimada y la real de punta a punta (sin pausas), sin lanzar nunca tras el
+merge, y `taskctl metricas` gana las columnas `estimada` y `punta_a_punta`.
+Guia en la skill `task-workflow` (`duracion.md`): senales y como trocear
+(porcion vertical frente a capas).
+
+Cambios de comportamiento: dos columnas nuevas al final de la tabla de
+`taskctl metricas` (antes de las de `--tokens` y `--heuristica`); el resultado
+de `approve` gana `avisos`.
+
 Revision que converge (TASK-095). Corrige la regla de alcance de la 0.12
 (TASK-083), que exigia que la ronda anterior dejara solo MENORES: un CRITICO o
 IMPORTANTE en cualquier estado, tambien `corregido`, obligaba a una ronda
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 285aa7a..4039085 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -100,6 +100,25 @@ estado, también corregido, obligaba a una ronda completa; los revisores
 vuelven a listar los corregidos, así que cada ronda relanzaba una revisión
 entera que encontraba otra tanda (hasta 14 rondas en una tarea).
 
+## Regla de una hora
+
+Una tarea prevista de más de **una hora de punta a punta** (de la rama abierta
+al cierre con merge) se parte en varias.
+
+- **Plan:** `plan-final.md` lleva `Duracion estimada: N min` bajo «Enfoque
+  propuesto», con sus señales: ficheros de código previstos (la mejor señal
+  medida), capas y criterios.
+- **Approve:** con más de 60 min, o con una cifra que no se entiende,
+  `taskctl siguiente` pregunta en cualquier modo y `taskctl approve
+  --decidido-por automatico` se rechaza: decide una persona (trocear o aprobar
+  entera con el motivo). Sin la línea, `approve` solo avisa.
+- **Finish:** `tarea.md` gana `## Duracion` con la estimada y la real de punta
+  a punta (sin pausas), y `taskctl metricas` las muestra en las columnas
+  `estimada` y `punta_a_punta`, para calibrar.
+
+Cómo trocear (porción vertical pequeña frente a capas) y las señales, en la
+skill `task-workflow`, `duracion.md`.
+
 ## Roles del brainstorm de diseño
 
 `taskctl plan` lanza roles de `agents/` según la complejidad, por este orden de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index b5353fe..c0ee58c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -64,7 +64,12 @@ no deberian necesitar volver a preguntar.
      reescribe tu el plan incorporando los cambios pedidos.
    El plan nuevo conserva los cambios pedidos con el encabezado
    `## Cambios pedidos por la persona (incorporados en la ronda K)`.
-5. Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
+5. **Regla de una hora** (`task-workflow/duracion.md`): el plan tiene que
+   llevar la linea `Duracion estimada: N min`, de punta a punta (de la rama
+   abierta al cierre con merge), con sus senales (ficheros de codigo
+   previstos, capas, criterios). Si pasa de 60, propon en el plan como
+   trocear la tarea y preguntaselo a la persona: decide ella, en approve.
+   Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
    anota las respuestas en el propio plan. Si la salida de `taskctl plan`
    nombro `skills_recomendados`, dejalos anotados para la implementacion.
 6. Registra el coste del diseno (`task-workflow/coste.md`): con el id que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 6c8effe..2682e68 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -219,6 +219,9 @@ lo que tiene que estar hecho al cerrar (suite, smoke test, criterios marcados,
 `## Resultado`, registro de progreso) y como declarar y verificar los criterios
 que solo se comprueban despues del merge (`### Tras el cierre`).
 
+**Regla de una hora**: mas de una hora de punta a punta se trocea; lo decide
+una persona en approve. Ver [duracion.md](duracion.md).
+
 ## El brainstorm de la fase de diseno
 
 `plan` no redacta el plan: deja preparado el material para que lo redacten
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
new file mode 100644
index 0000000..fac22de
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
@@ -0,0 +1,41 @@
+# Regla de una hora: estimar y trocear
+
+Una tarea prevista de **mas de una hora de punta a punta** (de la rama abierta
+al cierre con merge, revision y verificacion incluidas) se parte en varias.
+Las tareas grandes alargan las rondas de revision y la verificacion; las
+pequenas cierran antes y se revisan mejor.
+
+## Cuando y quien
+
+- **Al planificar** se estima. `plan-final.md` lleva la linea
+  `Duracion estimada: N min` bajo «Enfoque propuesto», con sus senales.
+- **En approve** decide una persona. Con mas de 60 min, o con una cifra que
+  no se entiende (`1h30`, `~90`, `90-120`), `taskctl siguiente` devuelve
+  `preguntar` en cualquier modo y `taskctl approve --decidido-por automatico`
+  se rechaza. La persona elige: trocear, o aprobar entera con el motivo
+  escrito en el plan. Sin la linea, `approve` solo avisa.
+- **En finish** se mide. `tarea.md` gana `## Duracion` con la estimada y la
+  real de punta a punta (de `start` a `finish`, sin pausas). `taskctl
+  metricas` las muestra (`estimada`, `punta_a_punta`), para calibrar la
+  estimacion con datos y no a ojo.
+
+## Como estimar: las senales
+
+La mejor senal medida es el **numero de ficheros de codigo** que la tarea va
+a tocar (en dos proyectos reales: con 1 a 10 ficheros de codigo, la mitad de
+las tareas cerro en una hora; con 11 o mas, solo una de cada seis). Despues,
+el numero de capas que toca (datos, backend, frontend, herramientas) y, con
+menos peso, el de criterios de aceptacion. Si hay que investigar algo antes
+de saber como hacerlo, eso va primero en su propia tarea corta.
+
+## Como trocear
+
+- **Una porcion vertical pequena**, mejor que dos mitades que no se prueban
+  solas: un comportamiento completo pero minimo, que cruza las capas que
+  necesite.
+- **Por capas solo si cada parte se verifica sola**: la migracion con su
+  test, y despues el backend que la usa. Anadir un campo y mapearlo (dos o
+  tres ficheros) no se parte.
+- Cada tarea nueva lleva sus propios criterios comprobables y sus
+  dependencias (`dependencias` en el frontmatter), para que el orden quede
+  claro.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 2f0c695..4a49fb5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -661,6 +661,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         `Tarea ${result.id} aprobada (plan_aprobado: true): ${result.filePath}.\n`
       );
       printAutoCommit(result.autoCommit);
+      for (const aviso of result.avisos) process.stderr.write(`[AVISO] ${aviso}\n`);
       return 0;
     } catch (e) {
       if (
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 785d1d5..e6e0fff 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -37,6 +37,7 @@ import {
   type PlanFinalUbicacion,
 } from './plan.js';
 import { readFile, readdir } from 'node:fs/promises';
+import { describirExceso, leerDuracionEstimada, superaUmbral, UMBRAL_MINUTOS } from '../core/duracion-estimada.js';
 import {
   ROLES_BRAINSTORM,
   TODOS_LOS_ROLES,
@@ -103,6 +104,8 @@ export interface ApproveCommandResult {
   baseBranchGuard: BaseBranchGuardResult;
   /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
   autoCommit: AutoCommitResult;
+  /** TASK-097: avisos no fatales (el plan no dice su duracion estimada). */
+  avisos: string[];
 }
 
 export interface ApproveCommandDeps {
@@ -189,6 +192,25 @@ export async function runApproveCommand(
     }
   }
 
+  // TASK-097: regla de una hora. Sin la linea, solo aviso (los planes
+  // anteriores a la regla no se atascan). Con mas de una hora, o con una
+  // cifra que no se entiende, la aprobacion automatica se rechaza: lo
+  // decide una persona (trocear o aprobar entera con el motivo).
+  const avisos: string[] = [];
+  const duracion = leerDuracionEstimada(await readFile(rutaPlan, 'utf8'));
+  if (duracion.tipo === 'ausente') {
+    avisos.push(
+      `${task.id}: el plan no dice su duracion estimada (linea "Duracion estimada: N min"). ` +
+        `La regla de una hora pide trocear las tareas de mas de ${String(UMBRAL_MINUTOS)} min de punta a punta.`
+    );
+  }
+  if (decididoPor === 'automatico' && superaUmbral(duracion)) {
+    throw new ApproveCommandError(
+      `[ERROR] ${task.id}: no se aprueba como automatico: ${describirExceso(duracion)}: ` +
+        `taskctl approve ${task.id} (sin --decidido-por automatico).`
+    );
+  }
+
   const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
   // Reaprobar un plan ya aprobado no es una transicion: sin fila nueva, y
   // asi la segunda vez sigue sin crear commit (es idempotente).
@@ -208,7 +230,7 @@ export async function runApproveCommand(
     push,
   });
 
-  return { id: task.id, filePath: newFilePath, baseBranchGuard, autoCommit: commitResult };
+  return { id: task.id, filePath: newFilePath, baseBranchGuard, autoCommit: commitResult, avisos };
 }
 
 /**
@@ -293,6 +315,13 @@ export async function planEsPlantilla(task: Task, rutaPlan: string): Promise<boo
 }
 
 /** ¿La tarea tiene un plan-final.md redactado (existe y no es la plantilla)? */
+/** TASK-097: la duracion estimada del plan-final.md de la tarea (ausente si no hay plan). */
+export async function duracionDelPlan(taskDir: string): Promise<ReturnType<typeof leerDuracionEstimada>> {
+  const u = await resolverPlanFinal(taskDir);
+  if (!planFinalExisteEn(u)) return { tipo: 'ausente' };
+  return leerDuracionEstimada(await readFile(u.canonicaExiste ? u.canonica : u.legada, 'utf8'));
+}
+
 export async function planRedactado(task: Task, taskDir: string): Promise<boolean> {
   const u = await resolverPlanFinal(taskDir);
   if (!planFinalExisteEn(u)) return false;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 4e74b76..a59f7f4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -89,6 +89,9 @@ import { extraerSinVerificacion, puertaVerificacion } from './finish-verificacio
 import { puertaHeldout } from './finish-heldout.js';
 import { puertaCobertura } from './finish-cobertura.js';
 import { runBoardCommand, boardFilePath } from './board.js';
+import { duracionDelPlan } from './approve.js';
+import { anotarDuracion } from '../core/duracion-estimada.js';
+import { minutosPuntaAPunta } from '../core/metricas.js';
 import { renderBoardMarkdown } from '../core/board-format.js';
 import { REVISION_DIRNAME } from './review.js';
 
@@ -652,7 +655,16 @@ export async function runFinishCommand(
   );
   for (const aviso of volcado.avisos) deps.onAviso?.(`${id}: ${aviso}`);
   const updated: Task = volcado.task;
-  const conRegistro = registrarTransicion(volcado.body, 'finish', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
+  const conFila = registrarTransicion(volcado.body, 'finish', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
+  // TASK-097: regla de una hora. Estimada (del plan) y real de punta a punta,
+  // para calibrar. Nunca lanza: estamos despues del merge y un fallo aqui
+  // dejaria la tarea mergeada sin cerrar. Un dato que falta va como «—».
+  let conRegistro = conFila;
+  try {
+    conRegistro = anotarDuracion(conFila, await duracionDelPlan(path.dirname(filePath)), minutosPuntaAPunta(conFila));
+  } catch (e: unknown) {
+    deps.onAviso?.(`${id}: no se pudo anotar la duracion (${e instanceof Error ? e.message : String(e)}); el cierre sigue.`);
+  }
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
   // Renderizado de cierre (criterio 3): plantillas desde el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 138b006..25f1cd3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -82,6 +82,7 @@ import {
   leerGanadorDesempate,
 } from '../core/plan-desempate-skill.js';
 import { comprobarSkillInstalado } from '../core/plugin-instalado.js';
+import { LINEA_PLANTILLA_DURACION } from '../core/duracion-estimada.js';
 
 export class PlanCommandError extends Error {}
 
@@ -254,7 +255,11 @@ export function planTemplate(task: Task, roles: readonly RolBrainstorm[]): strin
   return (
     `# Plan — ${task.id}: ${task.titulo}\n\n` +
     origen +
-    '\n## Enfoque propuesto\n\n\n' +
+    // TASK-097: la estimacion de punta a punta (regla de una hora). Solo se
+    // ANADE una linea: el detector de plantilla compara por lineas y un
+    // esqueleto viejo sigue contando como esqueleto.
+    '\n## Enfoque propuesto\n\n' +
+    `${LINEA_PLANTILLA_DURACION}\n\n\n` +
     seccionRoles +
     '## Riesgos aceptados y que los contiene\n\n\n' +
     '## Plan de pruebas\n\n\n' +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index c153449..05649be 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -41,7 +41,8 @@ import {
 import { excluirDeRevision, revisoresDelRango } from '../fs/revisores-rango.js';
 import type { Task } from '../core/task.js';
 import { REVISION_DIRNAME } from './review.js';
-import { planRedactado } from './approve.js';
+import { duracionDelPlan, planRedactado } from './approve.js';
+import type { LecturaDuracion } from '../core/duracion-estimada.js';
 
 export class SiguienteCommandError extends Error {}
 
@@ -157,6 +158,8 @@ export async function runSiguienteCommand(
   let task: Task;
   let body: string;
   let planEstaRedactado = true;
+  // TASK-097: la duracion estimada del plan (solo en-diseno con plan redactado).
+  let duracionEstimada: LecturaDuracion | undefined;
   // Informes de la ultima ronda (primaria y de Codex), con el MISMO criterio
   // de ronda en los dos caminos (nombresDeUltimaRonda), leidos de la rama o
   // del disco.
@@ -208,11 +211,15 @@ export async function runSiguienteCommand(
     codex = await Promise.all(
       (await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE)).nombres.map(leer)
     );
-    if (task.estado === 'en-diseno') planEstaRedactado = await planRedactado(task, taskDir);
+    if (task.estado === 'en-diseno') {
+      planEstaRedactado = await planRedactado(task, taskDir);
+      if (planEstaRedactado) duracionEstimada = await duracionDelPlan(taskDir);
+    }
   }
 
   const ctx: ContextoFlujo = {
     planRedactado: planEstaRedactado,
+    ...(duracionEstimada === undefined ? {} : { duracionEstimada }),
     veredicto: veredictoDe(primarios),
     veredictoCodex: veredictoDe(codex),
     modoCongelado: modoCongelado(body) !== null,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
new file mode 100644
index 0000000..74c4d16
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
@@ -0,0 +1,104 @@
+/**
+ * TASK-097: regla de una hora. Una tarea prevista de mas de una hora de punta
+ * a punta (de la rama abierta al cierre con merge) se trocea. Se estima al
+ * planificar: el plan lleva la linea `Duracion estimada: N min`, la persona
+ * decide en approve y finish anota la duracion real para calibrar.
+ *
+ * Puro: lee texto, no toca disco.
+ */
+
+/** Por encima de esto, la tarea deberia partirse (decision de la persona). */
+export const UMBRAL_MINUTOS = 60;
+
+/** Linea que lleva la plantilla del plan; sin cifra cuenta como ausente. */
+export const LINEA_PLANTILLA_DURACION =
+  'Duracion estimada:  min (de la rama abierta al cierre con merge; senales: ficheros de codigo previstos, capas, criterios)';
+
+export type LecturaDuracion =
+  | { tipo: 'ausente' }
+  | { tipo: 'ilegible'; valor: string }
+  | { tipo: 'ok'; minutos: number };
+
+const LINEA_RE = /^\s*[*_]*\s*duraci[oó]n estimada\s*[*_]*\s*:\s*[*_]*\s*(.*)$/i;
+const CIFRA_RE = /^(\d+)\s*(?:min|minutos?)?(?![\d.,:h-])/i;
+
+/**
+ * La duracion estimada del plan. Se ignoran los bloques de codigo (un ejemplo
+ * dentro de ``` no es la estimacion). Sin la linea, o con la linea sin cifra
+ * (la plantilla), `ausente`; con una cifra entera de minutos, `ok`; cualquier
+ * otra forma (`1h30`, `~90`, `90-120`, `1,5 h`), `ilegible`: no se adivina.
+ */
+export function leerDuracionEstimada(texto: string): LecturaDuracion {
+  let enBloque = false;
+  for (const cruda of texto.replace(/\r/g, '').split('\n')) {
+    if (/^\s*(```|~~~)/.test(cruda)) {
+      enBloque = !enBloque;
+      continue;
+    }
+    if (enBloque) continue;
+    const m = LINEA_RE.exec(cruda);
+    if (m === null) continue;
+    const valor = (m[1] as string).trim();
+    if (!/\d/.test(valor)) return { tipo: 'ausente' };
+    const c = CIFRA_RE.exec(valor);
+    if (c === null) return { tipo: 'ilegible', valor };
+    return { tipo: 'ok', minutos: Number(c[1]) };
+  }
+  return { tipo: 'ausente' };
+}
+
+/** true si la estimacion obliga a decidir trocear: pasa del umbral o no se entiende. */
+export function superaUmbral(l: LecturaDuracion): boolean {
+  return l.tipo === 'ilegible' || (l.tipo === 'ok' && l.minutos > UMBRAL_MINUTOS);
+}
+
+/** Frase para motivos y errores: que dice el plan y que hacer. */
+export function describirExceso(l: LecturaDuracion): string {
+  const dice = l.tipo === 'ok' ? `estima ${String(l.minutos)} min` : `trae una duracion que no se entiende ("${l.tipo === 'ilegible' ? l.valor : ''}")`;
+  return (
+    `el plan ${dice}, y la regla de una hora pide trocear toda tarea de mas de ` +
+    `${String(UMBRAL_MINUTOS)} min de punta a punta (de la rama abierta al cierre con merge). ` +
+    'Lo decide una persona: partirla en tareas de una hora o menos, o aprobarla entera con el motivo escrito en el plan'
+  );
+}
+
+// --- Seccion ## Duracion de tarea.md (la escribe finish) ----------------------
+
+export const SECCION_DURACION = '## Duracion';
+
+/** Minutos estimados que finish dejo anotados en `## Duracion`, o null. */
+export function estimadaAnotada(body: string): number | null {
+  const m = /^- Estimada: (\d+) min$/m.exec(body.replace(/\r/g, ''));
+  return m === null ? null : Number(m[1]);
+}
+
+/**
+ * Escribe (o reemplaza) la seccion `## Duracion` con la estimacion del plan y
+ * la duracion real de punta a punta. Un dato que falta va como `—`, nunca 0.
+ * Reemplaza, no anade: un finish reintentado no duplica la seccion.
+ */
+export function anotarDuracion(body: string, estimada: LecturaDuracion, realMin: number | null): string {
+  const eol = body.includes('\r\n') ? '\r\n' : '\n';
+  const est =
+    estimada.tipo === 'ok' ? `${String(estimada.minutos)} min` : estimada.tipo === 'ilegible' ? `— (no se entiende: ${estimada.valor})` : '— (el plan no la dice)';
+  const real = realMin === null ? '— (sin hora en start o finish)' : `${String(realMin)} min`;
+  const lineasSeccion = [
+    SECCION_DURACION,
+    '',
+    `- Estimada: ${est}`,
+    `- Real (de la rama abierta al cierre con merge, sin pausas): ${real}`,
+    ...(estimada.tipo === 'ok' && realMin !== null && realMin > UMBRAL_MINUTOS
+      ? [`- Paso de la hora: ${String(realMin)} min reales frente a ${String(estimada.minutos)} estimados`]
+      : []),
+  ];
+  const lineas = body.split(/\r?\n/);
+  const ini = lineas.findIndex((l) => l.trim() === SECCION_DURACION);
+  if (ini === -1) {
+    const base = body.replace(/(\r?\n)*$/, '');
+    return `${base}${base === '' ? '' : eol + eol}${lineasSeccion.join(eol)}${eol}`;
+  }
+  let fin = ini + 1;
+  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
+  const despues = lineas.slice(fin);
+  return [...lineas.slice(0, ini), ...lineasSeccion, ...(despues.length > 0 ? ['', ...despues] : [''])].join(eol);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 1951853..d33dec0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -15,6 +15,7 @@
 import type { Task } from './task.js';
 import type { ModoFlujo } from './config.js';
 import type { VeredictoInforme } from './informe-revision.js';
+import { describirExceso, superaUmbral, type LecturaDuracion } from './duracion-estimada.js';
 
 /**
  * Todas las fases que puede devolver siguienteFase. Lista en tiempo de
@@ -40,6 +41,8 @@ export type AccionFlujo = 'detener' | 'preguntar' | 'continuar';
 export interface ContextoFlujo {
   /** en-diseno: ¿hay un plan-final.md redactado (no la plantilla)? */
   planRedactado: boolean;
+  /** TASK-097: en-diseno, la duracion estimada que dice el plan (ausente si no la dice). */
+  duracionEstimada?: LecturaDuracion;
   /** en-revision: veredicto de la ultima ronda. */
   veredicto: VeredictoInforme | null;
   /**
@@ -143,6 +146,17 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
         // trabajo de agente (roles, unificador) sobre la ronda ya abierta.
         return paso('plan', false, 'falta redactar planificacion/plan-final.md', null);
       }
+      // TASK-097: regla de una hora. Mas de una hora (o una cifra que no se
+      // entiende) se pregunta en CUALQUIER modo, tambien en manual: trocear o
+      // aprobar entera es decision de una persona. Sin la linea, como hoy.
+      if (ctx.duracionEstimada !== undefined && superaUmbral(ctx.duracionEstimada)) {
+        return {
+          fase: 'approve',
+          comando: `taskctl approve ${task.id}`,
+          accion: 'preguntar',
+          motivo: describirExceso(ctx.duracionEstimada),
+        };
+      }
       if (!ctx.modoCongelado) {
         // Tarea sin fila plan (anterior al registro): approve
         // --decidido-por automatico se rechaza, asi que la aprueba una persona.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 930460e..4bc6d47 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -53,6 +53,7 @@
  * (`ResumenCostes`, `ResumenHallazgos`), para que quien agregue no tenga que
  * adivinar si un 0 es un cero o una ausencia.
  */
+import { estimadaAnotada } from './duracion-estimada.js';
 import { leerTransiciones, instanteDe, precisionDeFecha, versionDeCierre, type PrecisionFecha } from './transiciones.js';
 import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState, type TaskType } from './task.js';
 import {
@@ -210,6 +211,10 @@ export interface FilaMetricas {
   versionCierre: string | null;
   /** Solo con `--heuristica`. */
   heuristica?: HeuristicaFila;
+  /** TASK-097: de start a finish sin pausas (punta a punta). */
+  puntaAPunta: Duracion | null;
+  /** TASK-097: minutos estimados que finish anoto en `## Duracion`, o null. */
+  estimadaMin: number | null;
 }
 
 export interface EntradaMetricas {
@@ -361,6 +366,22 @@ function ultimaMarca(m: Marcas): Marca | null {
   return m.finish ?? m.review ?? m.start ?? m.plan;
 }
 
+/**
+ * TASK-097: minutos de punta a punta (de la fila start a la ultima finish, sin
+ * pausas) del registro de una tarea; null si falta una marca o alguna es de
+ * dia (nunca se inventa una cifra).
+ */
+export function minutosPuntaAPunta(body: string): number | null {
+  const registro = leerTransiciones(body).map((f) => ({
+    fase: f.fase as FaseMedida,
+    marca: { ms: instanteDe(f.fecha), precision: precisionDeFecha(f.fecha) as PrecisionFecha },
+  }));
+  if (registro.length === 0) return null;
+  const m = marcasDe(registro);
+  const d = duracionSinPausas(m.start, m.finish, m.intervalosPausa);
+  return d === null || d.precision === 'dia' ? null : Math.round(d.valor / 60_000);
+}
+
 /** Una fila por tarea, sin la parte de heuristica. */
 export function calcularFila(e: EntradaMetricas): FilaMetricas {
   const registro = leerTransiciones(e.body).map((f) => ({
@@ -415,6 +436,8 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     lecturasRevision: lecturasRevisionDe(e.body, e.informes ?? []),
     kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
     total: duracionSinPausas(marcas.plan, marcas.finish, marcas.intervalosPausa),
+    puntaAPunta: duracionSinPausas(marcas.start, marcas.finish, marcas.intervalosPausa),
+    estimadaMin: estimadaAnotada(e.body),
     enPausa: enPausaDe(marcas),
     veredictoRonda1: veredictoRonda1(e.informes ?? []),
     versionCierre: versionDeCierre(e.body),
@@ -490,6 +513,10 @@ export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
   },
   { cabecera: 'cierre', valor: (f) => f.cierre ?? '—' },
   { cabecera: 'origen', valor: (f) => f.origen },
+  // TASK-097: regla de una hora. Estimada (la que finish anoto del plan) y
+  // real de punta a punta (de start a finish, sin pausas).
+  { cabecera: 'estimada', valor: (f) => (f.estimadaMin === null ? '—' : `${String(f.estimadaMin)}m`) },
+  { cabecera: 'punta_a_punta', valor: (f) => formatearDuracion(f.puntaAPunta) },
 ];
 
 /** Primera columna con varios proyectos (`--repo` repetido): el ID solo no identifica la tarea. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts
new file mode 100644
index 0000000..e96b5e5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts
@@ -0,0 +1,110 @@
+/**
+ * TASK-097: regla de una hora. El plan dice su duracion estimada de punta a
+ * punta; con mas de una hora (o una cifra que no se entiende) decide una
+ * persona en approve, y finish anota la duracion real para calibrar. Repos
+ * Git temporales reales y el CLI real por spawn, como el resto de automatico.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import {
+  ID,
+  CONFIG_AUTO,
+  commitAll,
+  cli,
+  cliOk,
+  siguiente,
+  resumen,
+  withRepo,
+  nueva,
+  codigo,
+  dirRevision,
+  rellenarInforme,
+} from '../helpers/automatico-fixtures.js';
+
+/** Planifica TASK-001 con un plan que dice (o no) su duracion estimada. */
+async function planificarCon(repoRoot: string, tareasRoot: string, lineaDuracion: string | null): Promise<void> {
+  nueva(repoRoot, 'feature', 'Regla de una hora');
+  cliOk(repoRoot, ['plan', ID]);
+  await writeFile(
+    path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
+    `# Plan\n\n## Enfoque propuesto\n\n${lineaDuracion === null ? '' : lineaDuracion + '\n\n'}Cambiar app.txt.\n`,
+    'utf8'
+  );
+  commitAll(repoRoot, `docs(${ID}): plan final`);
+}
+
+test('regla de una hora: con mas de 60 min, siguiente pregunta y approve automatico se rechaza; una persona puede aprobar', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planificarCon(repoRoot, tareasRoot, 'Duracion estimada: 90 min (senales: 14 ficheros de codigo, 3 capas)');
+    const s = siguiente(repoRoot);
+    assert.deepEqual(resumen(s), ['approve', 'preguntar']);
+    assert.match(String(s.motivo), /estima 90 min.*regla de una hora.*trocear/s);
+
+    const r = cli(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+    assert.notEqual(r.status, 0, 'la aprobacion automatica no puede saltarse la regla');
+    assert.match(r.stderr, /no se aprueba como automatico: el plan estima 90 min/);
+    assert.equal((await readTareaFile(tareasRoot, ID))?.task.plan_aprobado, false);
+
+    // Decide una persona: aprobar entera (el motivo va en el plan).
+    cliOk(repoRoot, ['approve', ID]);
+    assert.equal((await readTareaFile(tareasRoot, ID))?.task.plan_aprobado, true);
+  });
+});
+
+test('regla de una hora: con 60 min o menos no cambia nada (siguiente continua y approve automatico pasa sin aviso)', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planificarCon(repoRoot, tareasRoot, 'Duracion estimada: 60 min');
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['approve', 'continuar']);
+    const r = cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+    assert.doesNotMatch(r.stderr, /duracion estimada/);
+  });
+});
+
+test('regla de una hora: sin la linea, approve avisa sin bloquear (los planes anteriores no se atascan)', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planificarCon(repoRoot, tareasRoot, null);
+    assert.deepEqual(resumen(siguiente(repoRoot)), ['approve', 'continuar']);
+    const r = cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+    assert.match(r.stderr, /\[AVISO\] TASK-001: el plan no dice su duracion estimada/);
+  });
+});
+
+test('regla de una hora: una cifra que no se entiende se pregunta, no se da por buena', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planificarCon(repoRoot, tareasRoot, 'Duracion estimada: 1h30');
+    const s = siguiente(repoRoot);
+    assert.deepEqual(resumen(s), ['approve', 'preguntar']);
+    assert.match(String(s.motivo), /no se entiende \("1h30"\)/);
+    assert.notEqual(cli(repoRoot, ['approve', ID, '--decidido-por', 'automatico']).status, 0);
+  });
+});
+
+test('regla de una hora: finish anota la estimada y la real de punta a punta, y metricas las muestra', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planificarCon(repoRoot, tareasRoot, 'Duracion estimada: 30 min');
+    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
+    cliOk(repoRoot, ['start', ID]);
+    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
+    cliOk(repoRoot, ['review', ID]);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    cliOk(repoRoot, ['finish', ID]);
+
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.equal(t?.task.estado, 'terminada');
+    const body = await readFile(t!.filePath, 'utf8');
+    assert.match(body, /^## Duracion$/m);
+    assert.match(body, /^- Estimada: 30 min$/m);
+    assert.match(body, /^- Real \(de la rama abierta al cierre con merge, sin pausas\): \d+ min$/m);
+    assert.equal((body.match(/^## Duracion$/gm) ?? []).length, 1, 'una sola seccion');
+
+    const m = cliOk(repoRoot, ['metricas']);
+    const cab = m.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
+    assert.match(cab, /\| estimada \| punta_a_punta \|$/);
+    const fila = m.stdout.split('\n').find((l) => l.startsWith(`| ${ID} `)) as string;
+    assert.match(fila, /\| 30m +\| (\d+s|\d+m) +\|$/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
index 98f3d1d..d237d8b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
@@ -95,7 +95,8 @@ test('metricas --tokens --heuristica: ambas familias de columnas, y el resumen d
     const r = cliOk(repoRoot, ['metricas', '--tokens', '--heuristica']);
     const cab = r.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
     assert.match(cab, /\| tok_sin_desglose +\| puntos +\| nivel_heuristico +\|$/);
-    assert.deepEqual(celdas(r.stdout, ID).slice(12, 12 + 4), ['1000', '3000', '1000', '5000']);
+    // TASK-097: dos columnas mas (estimada, punta_a_punta) antes de las de tokens.
+    assert.deepEqual(celdas(r.stdout, ID).slice(14, 14 + 4), ['1000', '3000', '1000', '5000']);
     assert.ok(!r.stdout.includes(`| ${ID2} `), 'la muestra heuristica solo trae terminadas con informes');
     assert.match(r.stdout, /Muestra: 1 tareas terminadas/);
     assert.match(r.stdout, /\| 0 +\| 1\/1 /);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
index 5ebd56b..344ad83 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
@@ -74,9 +74,14 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
 
     const r = cliOk(repoRoot, ['metricas']);
     assert.deepEqual(cabecera(r.stdout), [
+      // TASK-097: estimada y punta_a_punta (regla de una hora) al final.
       'id', 'complejidad', 'diseno', 'curso', 'revision', 'rondas', 'crit', 'imp', 'men', 'hall_origen', 'cierre', 'origen',
+      'estimada', 'punta_a_punta',
     ]);
-    const [id, complejidad, diseno, curso, revision, rondas, crit, imp, men, hallOrigen, cierre, origen] = filaDe(r.stdout);
+    const [id, complejidad, diseno, curso, revision, rondas, crit, imp, men, hallOrigen, cierre, origen, estimada, puntaAPunta] = filaDe(r.stdout);
+    // TASK-097: finish anoto la duracion; el plan del escenario no la dice, asi que «—».
+    assert.equal(estimada, '—');
+    assert.match(puntaAPunta as string, DURACION_SEGUNDOS);
     assert.equal(id, ID);
     assert.equal(complejidad, 'simple');
     for (const d of [diseno, curso, revision]) assert.match(d as string, DURACION_SEGUNDOS);
@@ -101,8 +106,8 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     const h = cliOk(repoRoot, ['metricas', '--heuristica']);
     assert.deepEqual(cabecera(h.stdout).slice(-2), ['puntos', 'nivel_heuristico']);
     const fila = filaDe(h.stdout);
-    assert.match(fila[12] as string, /^\d+$/);
-    assert.match(fila[13] as string, /^(trivial|simple|media|alta|critica)$/);
+    assert.match(fila[14] as string, /^\d+$/);
+    assert.match(fila[15] as string, /^(trivial|simple|media|alta|critica)$/);
     assert.match(h.stdout, /Muestra: 1 tareas terminadas/);
     assert.match(h.stdout, /Por complejidad declarada:\n {2}simple +n= {2}1 +rondas medias=1\.00/);
 
@@ -198,7 +203,7 @@ test('metricas fuera de un repo Git: las tareas sin registro salen con "—" y u
       await writeFile(copia, sinRegistro, 'utf8');
       const r = cliOk(fuera, ['metricas']);
       assert.match(r.stderr, /\[AVISO\] No se pudo consultar git log/);
-      assert.deepEqual(filaDe(r.stdout).slice(2), ['—', '—', '—', '1', '0', '0', '1', '0/0/0/1', '—', '—']);
+      assert.deepEqual(filaDe(r.stdout).slice(2), ['—', '—', '—', '1', '0', '0', '1', '0/0/0/1', '—', '—', '—', '—']);
     } finally {
       await rm(fuera, { recursive: true, force: true });
     }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts
new file mode 100644
index 0000000..6682d04
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts
@@ -0,0 +1,55 @@
+/** TASK-097: lectura de la duracion estimada del plan y anotacion de finish (puro). */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  LINEA_PLANTILLA_DURACION,
+  UMBRAL_MINUTOS,
+  anotarDuracion,
+  estimadaAnotada,
+  leerDuracionEstimada,
+  superaUmbral,
+} from '../../src/core/duracion-estimada.js';
+
+test('leerDuracionEstimada: cifras validas, ausencia, plantilla y formatos que no se adivinan', () => {
+  assert.deepEqual(leerDuracionEstimada('# Plan\n\nDuracion estimada: 45 min (senales)\n'), { tipo: 'ok', minutos: 45 });
+  assert.deepEqual(leerDuracionEstimada('**Duración estimada:** 90 minutos\n'), { tipo: 'ok', minutos: 90 });
+  assert.deepEqual(leerDuracionEstimada('duracion estimada: 30\r\n'), { tipo: 'ok', minutos: 30 });
+  assert.deepEqual(leerDuracionEstimada('# Plan\n\nSin estimacion.\n'), { tipo: 'ausente' });
+  assert.deepEqual(leerDuracionEstimada(LINEA_PLANTILLA_DURACION), { tipo: 'ausente' }, 'la plantilla sin cifra');
+  for (const raro of ['1h30', '~90 min', '90-120 min', '1,5 h', '1.5 h']) {
+    assert.equal(leerDuracionEstimada(`Duracion estimada: ${raro}\n`).tipo, 'ilegible', raro);
+  }
+  // Un ejemplo dentro de un bloque de codigo no es la estimacion.
+  assert.deepEqual(
+    leerDuracionEstimada('```\nDuracion estimada: 500 min\n```\n\nDuracion estimada: 20 min\n'),
+    { tipo: 'ok', minutos: 20 }
+  );
+});
+
+test('superaUmbral: mas de una hora o ilegible; la ausencia no', () => {
+  assert.equal(UMBRAL_MINUTOS, 60);
+  assert.equal(superaUmbral({ tipo: 'ok', minutos: 60 }), false);
+  assert.equal(superaUmbral({ tipo: 'ok', minutos: 61 }), true);
+  assert.equal(superaUmbral({ tipo: 'ilegible', valor: '1h' }), true);
+  assert.equal(superaUmbral({ tipo: 'ausente' }), false);
+});
+
+test('anotarDuracion: escribe la seccion, la reemplaza en un reintento y nunca pone 0 por un dato que falta', () => {
+  const body = '## Objetivo\n\nX.\n\n## Transiciones\n\n| a |\n';
+  const una = anotarDuracion(body, { tipo: 'ok', minutos: 30 }, 42);
+  assert.match(una, /## Duracion\n\n- Estimada: 30 min\n- Real \(de la rama abierta al cierre con merge, sin pausas\): 42 min\n/);
+  assert.equal(estimadaAnotada(una), 30);
+  const dos = anotarDuracion(una, { tipo: 'ok', minutos: 30 }, 75);
+  assert.equal((dos.match(/^## Duracion$/gm) ?? []).length, 1, 'reemplaza, no duplica');
+  assert.match(dos, /Real .*: 75 min/);
+  assert.match(dos, /- Paso de la hora: 75 min reales frente a 30 estimados/);
+  const sinDatos = anotarDuracion(body, { tipo: 'ausente' }, null);
+  assert.match(sinDatos, /- Estimada: — \(el plan no la dice\)/);
+  assert.match(sinDatos, /- Real .*: — \(sin hora en start o finish\)/);
+  assert.equal(estimadaAnotada(sinDatos), null);
+  // Con la seccion en medio, lo que va detras se conserva.
+  const enMedio = anotarDuracion('## Duracion\n\n- Estimada: 1 min\n\n## Otra\n\nZ\n', { tipo: 'ok', minutos: 5 }, 6);
+  assert.match(enMedio, /- Estimada: 5 min[\s\S]*\n## Otra\n\nZ\n$/);
+  // CRLF se respeta.
+  assert.match(anotarDuracion('## Objetivo\r\n\r\nX.\r\n', { tipo: 'ok', minutos: 5 }, 6), /\r\n- Estimada: 5 min\r\n/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
index d858952..e13ddde 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
@@ -91,7 +91,8 @@ test('registro con hora: diseno plan->start, curso start->review, revision revie
   assert.equal(f.rondas, 2);
   assert.equal(f.cierre, '2026-10-06');
   const fila = COLUMNAS_METRICAS.map((c) => c.valor(f));
-  assert.deepEqual(fila, ['TASK-007', 'simple', '45m', '2h 05m', '1d 00h', '2', '—', '—', '—', '—', '2026-10-06', 'registro']);
+  // TASK-097: estimada (sin seccion ## Duracion, «—») y punta a punta (start -> finish).
+  assert.deepEqual(fila, ['TASK-007', 'simple', '45m', '2h 05m', '1d 00h', '2', '—', '—', '—', '—', '2026-10-06', 'registro', '—', '1d 02h']);
 });
 
 test('precision de dia: filas viejas dan dias enteros, y una sola marca de dia basta para pasar a dias', () => {
@@ -371,7 +372,7 @@ test('sin registro ni git: origen "—" y todo "—"', () => {
   assert.equal(f.origen, '—');
   assert.deepEqual(
     COLUMNAS_METRICAS.map((c) => c.valor(f)),
-    ['TASK-007', 'simple', '—', '—', '—', '3', '—', '—', '—', '—', '—', '—']
+    ['TASK-007', 'simple', '—', '—', '—', '3', '—', '—', '—', '—', '—', '—', '—', '—']
   );
   assert.equal(COLUMNAS_METRICAS.find((c) => c.cabecera === 'complejidad')?.valor(calcularFila(entrada({ task: tarea({ complejidad: null }) }))), '—');
 });
@@ -411,7 +412,7 @@ test('formatearTabla: cabecera, separador y columnas alineadas', () => {
   const f = calcularFila(entrada({ body: cuerpoCon(CICLO_CON_HORA), ronda: 1 }));
   const lineas = formatearTabla([f], COLUMNAS_METRICAS).split('\n');
   assert.equal(lineas.length, 3);
-  assert.match(lineas[0] as string, /^\| id +\| complejidad \| diseno \| curso +\| revision \| rondas \| crit \| imp \| men \| hall_origen \| cierre +\| origen +\|$/);
+  assert.match(lineas[0] as string, /^\| id +\| complejidad \| diseno \| curso +\| revision \| rondas \| crit \| imp \| men \| hall_origen \| cierre +\| origen +\| estimada \| punta_a_punta \|$/);
   assert.match(lineas[1] as string, /^\|-+\|-+\|/);
   assert.equal(new Set(lineas.map((l) => l.length)).size, 1, 'todas las lineas miden lo mismo');
 });
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-097/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-097/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-097/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-097/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-097/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-097/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-097/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  2 ++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                    | 24 ++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     | 15 +++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                                  | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/duracion-estimada.js                              | 90 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                          | 12 ++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       | 23 ++++++++++++++++++++++
 15 files changed, 184 insertions(+), 6 deletions(-)
````
