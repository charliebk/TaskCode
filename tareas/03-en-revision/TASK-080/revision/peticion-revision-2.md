# Peticion de revision — TASK-080 (ronda 2)

- Tarea: TASK-080 — Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan
- Rama revisada: feature/task-080-accesibilidad-en-angular-vue-reviewer-y
- Rama base: develop
- Commit revisado (HEAD): 0fe08a05623d385d0c496cff663ab7c398e7719b
- Fecha: 2026-11-06
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-080 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde d49d92500e05ab07b896ac4b6e398cd7efb12839 (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | src/cli.ts:591 (`printAvisos(..., ...result.avisosRoles)`) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/cli.ts:283-290 (`brainstormNotice`, aviso de discrepancia) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/commands/plan.ts:487-492 (texto del aviso `avisosRoles`) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | skills/angular-vue-reviewer/SKILL.md (Accesibilidad y Clasificacion) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/commands/approve.ts:287-289 (`planEsPlantilla`) | informe-revision-1.md |
| MEN-5 | MENOR | abierto | agents/brainstorm-{arquitectura,riesgos,testing,dominio}.md | informe-revision-1.md |

## Commits a revisar (git log d49d92500e05ab07b896ac4b6e398cd7efb12839..HEAD)

````
0fe08a0 fix(TASK-080): hallazgos de la ronda 1 de revision
be2360f chore(TASK-080): coste revision +7845662 tokens (1 agente)
69d37fd chore(TASK-080): veredicto ronda 1 (cambios-solicitados)
b58c2db docs(TASK-080): informe de revision ronda 1
80da4e4 chore(TASK-080): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff d49d92500e05ab07b896ac4b6e398cd7efb12839..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
index db41f6e..719610a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
@@ -6,7 +6,8 @@ tools: Read, Grep, Glob
 
 # Rol de arquitectura (brainstorm de diseño)
 
-Eres uno de los cuatro puntos de vista que se lanzan **en paralelo** antes de
+Eres uno de los puntos de vista (cuatro de base, más uno de rendimiento en
+algunas tareas) que se lanzan **en paralelo** antes de
 escribir una sola línea de código de la tarea. Los otros tres miran riesgos,
 comprobabilidad y dominio. Tú no. Tu única pregunta es:
 
@@ -57,7 +58,7 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
 
 ## Qué NO miras
 
-Esto pesa tanto como lo anterior: si los cuatro roles dicen lo mismo, el
+Esto pesa tanto como lo anterior: si todos los roles dicen lo mismo, el
 brainstorm no ha aportado nada.
 
 - **No enumeras casos límite ni modos de fallo.** Es del rol de riesgos.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
index 24e6b65..5d324de 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
@@ -6,7 +6,8 @@ tools: Read, Grep, Glob
 
 # Rol de especialista de dominio (brainstorm de diseño)
 
-Eres uno de los cuatro puntos de vista que se lanzan **en paralelo** antes de
+Eres uno de los puntos de vista (cuatro de base, más uno de rendimiento en
+algunas tareas) que se lanzan **en paralelo** antes de
 escribir una sola línea de código de la tarea. Los otros tres razonan desde el
 código: estructura, riesgos y comprobabilidad. Tú razonas desde el problema
 que la tarea intenta resolver. Tu única pregunta es:
@@ -42,7 +43,7 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
 
 ## Qué NO miras
 
-Esto pesa tanto como lo anterior: si los cuatro roles dicen lo mismo, el
+Esto pesa tanto como lo anterior: si todos los roles dicen lo mismo, el
 brainstorm no ha aportado nada.
 
 - **No propones estructura de módulos ni interfaces.** Es del rol de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
index c9bbdfb..a145bfc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
@@ -6,7 +6,8 @@ tools: Read, Grep, Glob
 
 # Rol de riesgos y casos límite (brainstorm de diseño)
 
-Eres uno de los cuatro puntos de vista que se lanzan **en paralelo** antes de
+Eres uno de los puntos de vista (cuatro de base, más uno de rendimiento en
+algunas tareas) que se lanzan **en paralelo** antes de
 escribir una sola línea de código de la tarea. Los otros tres miran estructura,
 comprobabilidad y dominio. Tú eres el único al que se le paga por ser
 pesimista. Tu única pregunta es:
@@ -42,7 +43,7 @@ arriba; lo frecuente y molesto, después.
 
 ## Qué NO miras
 
-Esto pesa tanto como lo anterior: si los cuatro roles dicen lo mismo, el
+Esto pesa tanto como lo anterior: si todos los roles dicen lo mismo, el
 brainstorm no ha aportado nada.
 
 - **No rediseñas la arquitectura.** Si tu riesgo solo desaparece cambiando el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
index d014b25..14dcc67 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
@@ -6,7 +6,8 @@ tools: Read, Grep, Glob
 
 # Rol de testing y mantenibilidad (brainstorm de diseño)
 
-Eres uno de los cuatro puntos de vista que se lanzan **en paralelo** antes de
+Eres uno de los puntos de vista (cuatro de base, más uno de rendimiento en
+algunas tareas) que se lanzan **en paralelo** antes de
 escribir una sola línea de código de la tarea. Los otros tres miran estructura,
 riesgos y dominio. Tú respondes a dos preguntas, en este orden:
 
@@ -42,7 +43,7 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
 
 ## Qué NO miras
 
-Esto pesa tanto como lo anterior: si los cuatro roles dicen lo mismo, el
+Esto pesa tanto como lo anterior: si todos los roles dicen lo mismo, el
 brainstorm no ha aportado nada.
 
 - **No propones la arquitectura.** Puedes decir que el enfoque propuesto no es
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index 33dbe80..5669305 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -293,6 +293,10 @@ contrario de lo que dice:
   resuelve por defecto a "aceptar".
 - Un valor de configuracion sensible incrustado en el codigo del cliente,
   que viaja en el paquete servido al navegador.
+- Una trampa de teclado verificable (WCAG 2.1.2) en un flujo principal: con
+  teclado no se puede salir del componente y la vista queda inoperable.
+- Un dialogo modal sin nombre accesible y sin foco gestionado que bloquea
+  la accion principal de la vista para quien usa teclado o lector.
 
 **IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:
 
@@ -314,6 +318,8 @@ contrario de lo que dice:
 - Componente barato sin la estrategia de deteccion acotada.
 - Estilo global anadido donde bastaba uno con alcance al componente.
 - Texto alternativo redundante que el lector de pantalla repite.
+- Contraste que el diff no deja verificar (colores por variable CSS o por
+  tema): se anota como comprobacion pendiente, nunca como CRITICO.
 - Import o dependencia que el diff deja sin usar.
 
 ## Estructura del informe
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 05a28e3..28a4db7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -285,7 +285,15 @@ function brainstormNotice(result: PlanCommandResult): string {
       `Complejidad declarada "${result.resolucion.nivelDeclarado}", heuristica ` +
         `"${result.resolucion.nivelHeuristico}" (${result.resolucion.puntos} puntos): se lanzan ` +
         `${result.resolucion.agentes === 1 ? '1 rol' : `${result.resolucion.agentes} roles`}, ` +
-        'el mayor de los dos.'
+        'el mayor de los dos' +
+        // TASK-080 (MEN-1 de la revision): los condicionales se suman aparte;
+        // sin decirlo, esta linea contradecia a la de "N roles en paralelo".
+        (result.roles.length > result.resolucion.agentes
+          ? `, mas ${result.roles
+              .slice(result.resolucion.agentes)
+              .map((r) => r.titulo)
+              .join(', ')} por las etiquetas de la tarea.`
+          : '.')
     );
   }
   // El orden de estas ramas importa, y costo un IMPORTANTE en la cuarta
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index f328a1b..138b006 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -488,7 +488,10 @@ export async function runPlanCommand(
     ({ rol, etiqueta }) =>
       `La etiqueta "${etiqueta}" pediria el rol ${rol.titulo} (${rol.id}), pero no se lanza: ` +
       `esta tarea resuelve menos de ${MIN_ROLES_PARA_CONDICIONALES} roles de brainstorm y sin ` +
-      'unificador ese rol quedaria como autor unico del plan. Si hace falta, sube la complejidad.'
+      'unificador ese rol quedaria como autor unico del plan.' +
+      // MEN-2 de la revision: en un hotfix el tope es 1 agente, subir la
+      // complejidad no cambia nada y el consejo mandaria en mala direccion.
+      (task.tipo === 'hotfix' ? '' : ' Si hace falta, sube la complejidad.')
   );
 
   // --- Seleccion determinista de skill (seccion 6.6/16.4.1, TASK-017) -
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index 469a437..70d7263 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -1699,3 +1699,80 @@ test('approve (TASK-080): rechaza la plantilla sin rellenar de un plan con rendi
     assert.equal(tras?.task.plan_aprobado, false);
   });
 });
+
+/**
+ * IMP-1 de la revision de TASK-080: el aviso tiene que llegar a la salida
+ * del binario real, no solo al resultado de runPlanCommand.
+ * Mutacion: quitar `...result.avisosRoles` del printAvisos de cli.ts -> rojo.
+ * MEN-1: la linea de discrepancia dice los roles de la escalera mas los
+ * condicionales. Mutacion: volver a terminar en "el mayor de los dos." -> rojo.
+ */
+test('plan (TASK-080): el binario avisa por stderr de que rendimiento no entra, y la discrepancia nombra el condicional', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const taskctl = path.join(PACKAGE_ROOT, 'bin', 'taskctl');
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple', etiquetas: ['wasm'] }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+    const simple = spawnSync(process.execPath, [taskctl, 'plan', 'TASK-800'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(simple.status, 0, simple.stderr);
+    assert.match(simple.stderr, /\[AVISO\] La etiqueta "wasm" pediria el rol rendimiento/);
+    assert.match(simple.stderr, /Si hace falta, sube la complejidad/);
+
+    // Declarada simple con 6 criterios y 5 etiquetas: la heuristica sube y
+    // hay discrepancia; con 2+ roles entra rendimiento.
+    const criterios = Array.from({ length: 6 }, (_, i) => `- [ ] \`taskctl plan\` caso ${i + 1}.`).join('\n');
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({
+        id: 'TASK-801',
+        rama: 'feature/task-801-p',
+        complejidad: 'simple',
+        etiquetas: ['wasm', 'a', 'b', 'c', 'd'],
+      }),
+      `## Objetivo\n\nProbar la discrepancia.\n\n## Criterios de aceptacion\n${criterios}\n`
+    );
+    commitAll(repoRoot, 'tarea TASK-801');
+    const discrepa = spawnSync(process.execPath, [taskctl, 'plan', 'TASK-801'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(discrepa.status, 0, discrepa.stderr);
+    assert.match(discrepa.stdout, /el mayor de los dos, mas rendimiento por las etiquetas de la tarea\./);
+  });
+});
+
+/**
+ * MEN-2: en un hotfix el tope es 1 agente; el aviso no aconseja subir la
+ * complejidad. Mutacion: quitar la condicion de tipo -> rojo.
+ */
+test('plan (TASK-080): en un hotfix el aviso no aconseja subir la complejidad', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ tipo: 'hotfix', rama: 'hotfix/task-800-p', complejidad: 'critica', etiquetas: ['wasm'] }),
+      BODY
+    );
+    commitAll(repoRoot, 'tarea TASK-800');
+    propagarAMain(repoRoot);
+    const r = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
+    assert.equal(r.avisosRoles.length, 1);
+    assert.doesNotMatch(r.avisosRoles[0]!, /sube la complejidad/);
+  });
+});
+
+/**
+ * MEN-4: si falta la carpeta del brainstorm, las candidatas por etiquetas
+ * siguen reconociendo la plantilla vacia con rendimiento.
+ * Mutacion: quitar `seleccionarRolesDeTarea(k, task.etiquetas)` de
+ * planEsPlantilla -> approve aprueba (rojo).
+ */
+test('approve (TASK-080): sin la carpeta del brainstorm, la plantilla con rendimiento se reconoce por las etiquetas', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media', etiquetas: ['wasm'] }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
+    await rm(brainstormDir(result.filePath), { recursive: true, force: true });
+    commitAll(repoRoot, 'plan TASK-800 sin brainstorm');
+
+    await assert.rejects(
+      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot }),
+      (e: unknown) => e instanceof ApproveCommandError && /plantilla sin rellenar/.test(e.message)
+    );
+  });
+});
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff d49d92500e05ab07b896ac4b6e398cd7efb12839..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-080/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-080/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-080/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-080/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-080/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-080/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-080/planificacion/brainstorm/salida-brainstorm-testing-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-080/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-080/revision/informe-revision-1.md                                                  |   84 ++++++
 tareas/03-en-revision/TASK-080/revision/peticion-revision-1.md                                                 | 1166 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-080/tarea.md                                                       |    6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                   |   10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                         |    5 +-
 13 files changed, 1267 insertions(+), 4 deletions(-)
````
