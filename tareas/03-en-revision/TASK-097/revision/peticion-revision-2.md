# Peticion de revision — TASK-097 (ronda 2)

- Tarea: TASK-097 — Regla de una hora: plan estima la duracion de punta a punta y propone trocear
- Rama revisada: feature/task-097-regla-de-una-hora-plan-estima-la-duracio
- Rama base: develop
- Commit revisado (HEAD): 4167474940a1ff3af1fcfd001d26da71bf6aafaf
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-097 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 3493c3101e5949883305a16f7f2c6589b0dd2320 (el commit revisado en la ronda anterior)
- Alcance: completa (motivo: la ronda anterior tiene un IMPORTANTE (H1, corregido))

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-097/tarea.md
- tareas/03-en-revision/TASK-097/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

0 hallazgos abiertos en la tabla de la ronda anterior.

## Commits a revisar (git log 3493c3101e5949883305a16f7f2c6589b0dd2320..HEAD)

````
4167474 docs(TASK-097): estado de los hallazgos de la ronda 1
20aaa29 fix(TASK-097): H1-H5 de la ronda 1 (cifra estricta, formatos de linea, test en los tres modos, skill bajo 15 KB con CRLF, limites documentados)
3198ee1 chore(TASK-097): veredicto ronda 1 (cambios-solicitados)
431a9b6 chore(TASK-097): coste revision +6657179 tokens (1 agente)
aee56a9 docs(TASK-097): informe de revision ronda 1
297f67c chore(TASK-097): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 3493c3101e5949883305a16f7f2c6589b0dd2320..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 2682e68..b2e70e6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -209,8 +209,8 @@ verde del commit que entra: cierra siempre con `taskctl finish`. Saltarse la
 verificacion (`--sin-verificacion`) lo decide la persona, no tu.
 
 **Tests held-out (`aceptacion/`).** Son de la persona: si implementas, no los
-leas ni los edites (un hook lo frena en la rama de la tarea). Detalle en
-[heldout.md](heldout.md).
+leas ni los edites. Detalle en [heldout.md](heldout.md).
+Regla de 1 h: [duracion.md](duracion.md).
 
 ## Cerrar una tarea
 
@@ -219,9 +219,6 @@ lo que tiene que estar hecho al cerrar (suite, smoke test, criterios marcados,
 `## Resultado`, registro de progreso) y como declarar y verificar los criterios
 que solo se comprueban despues del merge (`### Tras el cierre`).
 
-**Regla de una hora**: mas de una hora de punta a punta se trocea; lo decide
-una persona en approve. Ver [duracion.md](duracion.md).
-
 ## El brainstorm de la fase de diseno
 
 `plan` no redacta el plan: deja preparado el material para que lo redacten
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
index fac22de..9466c0f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
@@ -39,3 +39,12 @@ de saber como hacerlo, eso va primero en su propia tarea corta.
 - Cada tarea nueva lleva sus propios criterios comprobables y sus
   dependencias (`dependencias` en el frontmatter), para que el orden quede
   claro.
+
+## Limites de la medida
+
+- La cifra es un **entero de minutos** (`Duracion estimada: 90 min`). «2 horas»,
+  «1 h 30» o «90-120» no se adivinan: cuentan como no entendidas y se pregunta.
+- La duracion real descuenta solo las pausas registradas con `taskctl pausa`.
+  Los wrappers `pause` y `resume` de Git-Flow no escriben fila: una noche de
+  pausa hecha con ellos cuenta como trabajo y sesga la calibracion. Para parar
+  una tarea, usa `taskctl pausa`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
index 74c4d16..8c7659c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
@@ -19,8 +19,14 @@ export type LecturaDuracion =
   | { tipo: 'ilegible'; valor: string }
   | { tipo: 'ok'; minutos: number };
 
-const LINEA_RE = /^\s*[*_]*\s*duraci[oó]n estimada\s*[*_]*\s*:\s*[*_]*\s*(.*)$/i;
-const CIFRA_RE = /^(\d+)\s*(?:min|minutos?)?(?![\d.,:h-])/i;
+// Admite delante viñeta, cita, encabezado, enfasis y acentos graves (H4 de la
+// revision): `- Duracion estimada:`, `> ...`, `## ...`, `**...**`, `` `...` ``.
+const LINEA_RE = /^\s*(?:[-*+>#]\s*)*[*_`]*\s*duraci[oó]n estimada\s*[*_`]*\s*:\s*[*_`]*\s*(.*?)[`]*\s*$/i;
+// Una cifra entera de minutos y NADA mas que pueda cambiar su sentido: tras la
+// cifra y la unidad opcional solo cabe el fin, un parentesis con las senales o
+// un punto final (H1 de la revision: con `\s*` y un lookahead, «2 horas»,
+// «1 h 30» o «90 - 120» se leian como 2, 1 y 90 minutos).
+const CIFRA_RE = /^(\d+)\s*(?:min(?:utos?)?\.?)?\s*(?:\(.*\))?\s*\.?$/i;
 
 /**
  * La duracion estimada del plan. Se ignoran los bloques de codigo (un ejemplo
@@ -39,7 +45,9 @@ export function leerDuracionEstimada(texto: string): LecturaDuracion {
     const m = LINEA_RE.exec(cruda);
     if (m === null) continue;
     const valor = (m[1] as string).trim();
-    if (!/\d/.test(valor)) return { tipo: 'ausente' };
+    // Sin digitos (la linea de la plantilla sin rellenar): se sigue buscando,
+    // por si la estimacion real va mas abajo (H4 de la revision).
+    if (!/\d/.test(valor)) continue;
     const c = CIFRA_RE.exec(valor);
     if (c === null) return { tipo: 'ilegible', valor };
     return { tipo: 'ok', minutos: Number(c[1]) };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts
index 6682d04..f38a740 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/duracion-estimada.test.ts
@@ -1,6 +1,9 @@
 /** TASK-097: lectura de la duracion estimada del plan y anotacion de finish (puro). */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
+import { siguienteFase, type ContextoFlujo } from '../../src/core/flujo.js';
+import type { ModoFlujo } from '../../src/core/config.js';
+import type { Task } from '../../src/core/task.js';
 import {
   LINEA_PLANTILLA_DURACION,
   UMBRAL_MINUTOS,
@@ -19,6 +22,21 @@ test('leerDuracionEstimada: cifras validas, ausencia, plantilla y formatos que n
   for (const raro of ['1h30', '~90 min', '90-120 min', '1,5 h', '1.5 h']) {
     assert.equal(leerDuracionEstimada(`Duracion estimada: ${raro}\n`).tipo, 'ilegible', raro);
   }
+  // H1 de la revision: con espacio entre la cifra y lo que sigue tampoco se
+  // adivina (antes «2 horas» se leia como 2 minutos y saltaba la regla).
+  for (const raro of ['2 horas', '2 h', '1 h 30', '3 horas (14 ficheros)', '1 hora', '90 - 120', '45 - 90', '45 + 30 min']) {
+    assert.equal(leerDuracionEstimada(`Duracion estimada: ${raro}\n`).tipo, 'ilegible', raro);
+  }
+  assert.deepEqual(leerDuracionEstimada('Duracion estimada: 60 min.\n'), { tipo: 'ok', minutos: 60 });
+  // H4: viñeta, cita, encabezado y acentos graves tambien son la linea.
+  for (const forma of ['- Duracion estimada: 120 min', '> Duracion estimada: 120 min', '## Duracion estimada: 120 min', '`Duracion estimada: 120 min`']) {
+    assert.deepEqual(leerDuracionEstimada(`# Plan\n\n${forma}\n`), { tipo: 'ok', minutos: 120 }, forma);
+  }
+  // H4: la linea de plantilla sin rellenar no tapa una estimacion real mas abajo.
+  assert.deepEqual(
+    leerDuracionEstimada(`${LINEA_PLANTILLA_DURACION}\n\nDuracion estimada: 120 min\n`),
+    { tipo: 'ok', minutos: 120 }
+  );
   // Un ejemplo dentro de un bloque de codigo no es la estimacion.
   assert.deepEqual(
     leerDuracionEstimada('```\nDuracion estimada: 500 min\n```\n\nDuracion estimada: 20 min\n'),
@@ -53,3 +71,41 @@ test('anotarDuracion: escribe la seccion, la reemplaza en un reintento y nunca p
   // CRLF se respeta.
   assert.match(anotarDuracion('## Objetivo\r\n\r\nX.\r\n', { tipo: 'ok', minutos: 5 }, 6), /\r\n- Estimada: 5 min\r\n/);
 });
+
+// H3 de la revision: la decision 1 de la persona (preguntar en TODOS los
+// modos, manual incluido) necesita su red de regresion.
+function enDiseno(): Task {
+  return {
+    id: 'TASK-100', titulo: 'Prueba', tipo: 'feature', sprint: 0, etiquetas: [], complejidad: 'simple',
+    modelo_sugerido: 'sonnet', estado: 'en-diseno', plan_aprobado: false, rama: 'feature/task-100-prueba',
+    asignado_a: null, agente_revisor: 'general-purpose', skills_recomendados: [], regla_seleccion_skill: null,
+    ultimo_commit_revisado: null, revision_codex: false, tokens_diseno: null, tokens_implementacion: null,
+    tokens_revision: null, creado: '2026-11-10', actualizado: '2026-11-10', dependencias: [],
+  };
+}
+const CTX_DISENO: ContextoFlujo = {
+  planRedactado: true, veredicto: null, veredictoCodex: null, modoCongelado: true, rondaRevision: 0, informeEnCommitPropio: true,
+};
+const MODOS: ModoFlujo[] = ['manual', 'semiautomatico', 'automatico'];
+
+test('siguienteFase (TASK-097): con mas de una hora pregunta en los TRES modos, manual incluido', () => {
+  for (const modo of MODOS) {
+    for (const duracionEstimada of [{ tipo: 'ok', minutos: 90 }, { tipo: 'ilegible', valor: '2 horas' }] as const) {
+      const r = siguienteFase(enDiseno(), { ...CTX_DISENO, duracionEstimada }, modo);
+      assert.equal(r.fase, 'approve', modo);
+      assert.equal(r.accion, 'preguntar', `${modo}, ${duracionEstimada.tipo}`);
+      assert.match(r.motivo, /regla de una hora/);
+    }
+  }
+});
+
+test('siguienteFase (TASK-097): con 60 min o sin la linea, cada modo hace lo de siempre', () => {
+  const esperado: Record<ModoFlujo, string> = { manual: 'detener', semiautomatico: 'preguntar', automatico: 'continuar' };
+  for (const modo of MODOS) {
+    for (const duracionEstimada of [{ tipo: 'ok', minutos: 60 }, { tipo: 'ausente' }] as const) {
+      const r = siguienteFase(enDiseno(), { ...CTX_DISENO, duracionEstimada }, modo);
+      assert.equal(r.accion, esperado[modo], `${modo}, ${duracionEstimada.tipo}`);
+      assert.doesNotMatch(r.motivo, /regla de una hora/);
+    }
+  }
+});
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 3493c3101e5949883305a16f7f2c6589b0dd2320..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-097/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-097/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-097/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-097/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-097/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-097/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-097/revision/informe-revision-1.md                                                  |  59 ++++++
 tareas/03-en-revision/TASK-097/revision/peticion-revision-1.md                                                 | 889 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-097/tarea.md                                                       |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/duracion-estimada.js                                |  14 +-
 10 files changed, 967 insertions(+), 6 deletions(-)
````
