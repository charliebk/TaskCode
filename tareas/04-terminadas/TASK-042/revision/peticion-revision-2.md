# Peticion de revision — TASK-042 (ronda 2)

- Tarea: TASK-042 — F4-T4 Complejidad por defecto por heuristica y un rol sin unificador
- Rama revisada: feature/task-042-f4-t4-complejidad-por-defecto-por-heuris
- Rama base: develop
- Commit revisado (HEAD): 4511b8d65fd3377e26697aa31a45f58796eb0ad5
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-042 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 65c088b96046f16dcd7a85d6d425bf0e6d590dbc (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:220 (y src/core/plan-brainstorm.ts:203, skills/task-workflow/SKILL.md:360-362, src/commands/plan.ts:233) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts, test/cli/main.test.ts (textos de src/core/plan-brainstorm.ts:66,110 y src/cli.ts:218,230 sin cubrir) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts:780-785 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:230 | informe-revision-1.md |

## Commits a revisar (git log 65c088b96046f16dcd7a85d6d425bf0e6d590dbc..HEAD)

````
4511b8d fix(TASK-042): correcciones de la ronda 1 de revision (IMP-1, MEN-1, MEN-3)
beb56f8 chore(TASK-042): veredicto ronda 1 (cambios-solicitados)
dc71339 chore(TASK-042): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 65c088b96046f16dcd7a85d6d425bf0e6d590dbc..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index ee8663a..11250c4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -358,8 +358,8 @@ paralelo; volcar cada respuesta en su `salida-...`; y solo entonces lanzar al
 unificador, que es quien escribe `plan-final.md`. Los desacuerdos entre roles
 se senalan en el plan, no se promedian: dos roles que dicen lo contrario son
 informacion, y la media la tira. **Con 1 solo rol no hay unificador ni
-`salida-...`**: se lanza ese agente con `peticion-plan-<ronda>.md` y escribe el
-`plan-final.md`.
+`salida-...`**: se lanza ese agente con `peticion-plan-<ronda>.md` y su
+respuesta, que es el plan, se vuelca en `plan-final.md`.
 
 **`plan` valida el enunciado antes de mover nada** (con o sin roles). Bloquea:
 `## Objetivo` vacio, ningun criterio, un criterio vacio, **mas de 12
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 7456f2c..3cea741 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -211,13 +211,15 @@ function brainstormNotice(result: PlanCommandResult): string {
   // nombraba las salidas reales. El artefacto bueno quedaba invisible.
   if (result.modo === 'redaccion') {
     // TASK-042 (decision C4): con 1 rol no hay unificador ni salida de
-    // rol. Una sola peticion, al propio rol, que escribe plan-final.md.
+    // rol. Una sola peticion, al propio rol; su respuesta es el plan y la
+    // vuelca quien orquesta (los agentes de rol no tienen Write; IMP-1 de
+    // la revision de TASK-042).
     // Va antes que las demas ramas: con 1 rol ninguna otra aplica.
     const rol = result.roles[0];
     lineas.push(
       `${result.ronda > 1 ? `Re-planificacion (ronda ${result.ronda}): ` : ''}1 rol, sin unificador. ` +
         `Lanza el agente ${rol === undefined ? 'del rol' : `"${rol.id}"`} con ` +
-        `${result.peticionRedaccion}: el rol escribe plan-final.md directamente.`
+        `${result.peticionRedaccion} y vuelca su respuesta en plan-final.md (el agente no escribe ficheros).`
     );
   } else if (result.brainstormReutilizado) {
     lineas.push(
@@ -227,7 +229,11 @@ function brainstormNotice(result: PlanCommandResult): string {
     );
   } else if (result.roles.length === 0) {
     lineas.push(
-      `Sin brainstorm (complejidad "${result.resolucion.nivelDeclarado ?? result.resolucion.nivelHeuristico}" resuelve 0 roles). ` +
+      `Sin brainstorm (${
+        result.resolucion.nivelDeclarado === null
+          ? `complejidad no declarada; la heuristica da "${result.resolucion.nivelHeuristico}"`
+          : `complejidad "${result.resolucion.nivelDeclarado}"`
+      }: 0 roles). ` +
         `Redacta el plan y aprueba con "taskctl approve ${result.id}".`
     );
   } else {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 0fb8d42..a321872 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -230,7 +230,8 @@ export function planTemplate(task: Task, roles: readonly RolBrainstorm[]): strin
     seccionRoles = '';
   } else if (roles.length === 1) {
     origen =
-      `(Lo redacta directamente el agente del unico rol de brainstorm: ${roles[0]!.titulo}.\n` +
+      `(Es la respuesta del unico rol de brainstorm, ${roles[0]!.titulo}, volcada aqui por\n` +
+      'quien orquesta.\n' +
       'Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,\n' +
       'el plan senala lo que ese rol no cubrio.)\n';
     seccionRoles = '## Lo que el rol no cubrio\n\n\n';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
index 91dd712..16fc180 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
@@ -200,8 +200,9 @@ export function peticionRedaccionTemplate(
     cabecera(task, ronda, fecha) +
     `- Rol: \`${rol.id}\` — lanzalo con el agente de ese mismo nombre\n` +
     `- Vuelca el plan en: \`${planFinalRelativo}\`\n\n` +
-    '**Esta tarea se planifica con un solo rol y no hay unificador**: tu escribes ' +
-    '`plan-final.md` directamente, sin salida intermedia que nadie vaya a consolidar.\n\n' +
+    '**Esta tarea se planifica con un solo rol y no hay unificador**: tu respuesta ES ' +
+    'el plan final. Redactala con las secciones de abajo; quien orquesta la vuelca tal cual ' +
+    'en `plan-final.md` (tu no escribes ficheros), sin salida intermedia que consolidar.\n\n' +
     bloqueReplanificacion +
     '## Tu pregunta\n\n' +
     `> ${rol.pregunta}\n\n` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index 920159f..3459388 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -377,8 +377,41 @@ test('main: taskctl plan con 1 rol anuncia la peticion de redaccion y que no hay
     assert.equal(code, 0);
     assert.ok(stdout.includes('1 rol, sin unificador'), stdout);
     assert.ok(stdout.includes('peticion-plan-1.md'), stdout);
-    assert.ok(stdout.includes('escribe plan-final.md'), stdout);
+    // IMP-1 de su revision: el agente de rol no tiene Write; la respuesta
+    // la vuelca quien orquesta.
+    assert.ok(stdout.includes('vuelca su respuesta en plan-final.md'), stdout);
     assert.ok(!stdout.includes('luego el unificador'), stdout);
     assert.ok(!stdout.includes('peticion-unificador'), stdout);
+
+    // MEN-1 de su revision: la segunda vuelta se anuncia como re-planificacion.
+    commitAll(repoRoot, 'en diseno');
+    const segunda = await captureOutput(() => main(['plan', 'TASK-001']));
+    assert.equal(segunda.code, 0, segunda.stderr);
+    assert.ok(segunda.stdout.includes('Re-planificacion (ronda 2): 1 rol, sin unificador'), segunda.stdout);
+    assert.ok(segunda.stdout.includes('peticion-plan-2.md'), segunda.stdout);
+  });
+});
+
+// TASK-042, MEN-1 y MEN-3 de su revision: sin --complejidad nadie ve "null"
+// impreso, ni en stdout ni en las peticiones, y el mensaje de 0 roles no le
+// atribuye a la tarea el nivel que calculo la heuristica.
+// Mutaciones que lo ponen rojo: quitar cualquiera de los `?? 'no declarada...'`.
+test('main: taskctl plan sin complejidad declarada no imprime "null" en ningun sitio', async () => {
+  await withTempRepoCwd(async (repoRoot) => {
+    const creada = await captureOutput(() => main(['new', '--titulo', 'Sin complejidad', '--tipo', 'feature']));
+    assert.equal(creada.code, 0, creada.stderr);
+    await rellenarObjetivo(repoRoot, 'TASK-001');
+    commitAll(repoRoot, 'tarea nueva');
+
+    const { code, stdout, stderr } = await captureOutput(() => main(['plan', 'TASK-001']));
+    assert.equal(code, 0, stderr);
+    assert.doesNotMatch(stdout, /\bnull\b/);
+    assert.match(stdout, /complejidad no declarada; la heuristica da "trivial"/);
+
+    const carpeta = path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-001', 'planificacion');
+    const peticion = await readFile(path.join(carpeta, 'brainstorm', 'peticion-unificador-1.md'), 'utf8');
+    assert.doesNotMatch(peticion, /\bnull\b/);
+    assert.match(peticion, /Complejidad declarada: no declarada \(decide la heuristica\)/);
+    assert.match(peticion, /Declarada en la tarea: \*\*no declarada \(decide la heuristica\)\*\*/);
   });
 });
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 65c088b96046f16dcd7a85d6d425bf0e6d590dbc..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-042/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-042/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-042/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-042/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-042/revision/informe-revision-1.md                                                  |  129 ++++++++++
 tareas/03-en-revision/TASK-042/revision/peticion-revision-1.md                                                 | 1072 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-042/tarea.md                                                       |   26 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                   |   10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                         |    3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-brainstorm.js                                  |    5 +-
 10 files changed, 1238 insertions(+), 7 deletions(-)
````
