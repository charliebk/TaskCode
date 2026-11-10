# Peticion de revision — TASK-095 (ronda 2)

- Tarea: TASK-095 — Revision que converge: desde la ronda 2 solo se verifican las correcciones
- Rama revisada: feature/task-095-revision-que-converge-desde-la-ronda-2-s
- Rama base: develop
- Commit revisado (HEAD): 30aba939661197a3298aca54800053896c21057d
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-095 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 296cff1cea3e39ae73515bb891cf4a8ebd8278a1 (el commit revisado en la ronda anterior)
- Alcance: completa (motivo: el diff toca ficheros que ningun hallazgo nombraba: taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts)

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

- tareas/03-en-revision/TASK-095/tarea.md
- tareas/03-en-revision/TASK-095/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

0 hallazgos abiertos en la tabla de la ronda anterior.

## Commits a revisar (git log 296cff1cea3e39ae73515bb891cf4a8ebd8278a1..HEAD)

````
30aba93 docs(TASK-095): estado de los hallazgos de la ronda 1
6a8e160 fix(TASK-095): MEN-1, MEN-2, MEN-3, MEN-5 y MEN-6 de la ronda 1 (tests que faltaban, Rust, comando del tope sin el flag)
6a4407b chore(TASK-095): veredicto ronda 1 (cambios-solicitados)
2033763 chore(TASK-095): coste revision +9375561 tokens (1 agente)
cd3660e docs(TASK-095): informe de revision ronda 1
0cce373 chore(TASK-095): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 296cff1cea3e39ae73515bb891cf4a8ebd8278a1..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index ce69332..619686c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -57,7 +57,11 @@ export interface VeredictoCommandResult {
   ronda: number;
   informePath: string;
   linea: string;
-  /** TASK-083: avisos no fatales (p. ej. `cambios-solicitados` con solo MENORES). */
+  /**
+   * Avisos no fatales. Hoy siempre vacio: el unico que habia (TASK-083,
+   * `cambios-solicitados` con solo MENORES) se quito en TASK-095. Se conserva
+   * el campo por contrato con quien lo lee.
+   */
   avisos: string[];
   autoCommit: AutoCommitResult;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 97447db..1951853 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -173,9 +173,12 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
             // TASK-058, IMP-2 de TASK-059). Detenerse sin decir que decidir
             // dejaba la salida en manos de quien relanzaba review, y asi una
             // tarea llego a 14 rondas. La pregunta nombra las salidas.
+            // El comando NO lleva --ronda-extra (MEN-6 de la revision): quien lo
+            // ejecute sin leer la accion se encuentra con review rechazando la
+            // ronda, no con el control humano saltado. El flag va en el motivo.
             return {
               fase: 'review',
-              comando: `taskctl review ${task.id} --ronda-extra`,
+              comando: `taskctl review ${task.id}`,
               accion: 'preguntar',
               motivo:
                 `la ronda ${String(ctx.rondaRevision)} tambien pidio cambios: tope de rondas alcanzado. ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
index 40579b0..3465da0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
@@ -153,23 +153,47 @@ test('alcance (TASK-095): con un IMPORTANTE abierto, uno corregido, un CRITICO a
   }
 });
 
-test('alcance (TASK-095): cada revisor de dominio verifica SUS pendientes, no el generico en su lugar', async () => {
-  await conRonda1([JAVA, SCRIPT], async (ctx, r1) => {
-    const nombres1 = r1.r.informes.map((g) => g.revisor);
-    assert.deepEqual([...nombres1].sort(), ['code-quality-reviewer', 'java-spring-reviewer'].sort());
-    const porRevisor = r1.r.informes.map((g) => (g.revisor === 'java-spring-reviewer' ? informe([IMP_ABIERTO]) : informe([MEN_SCRIPT])));
-    await ctx.pedirCambios(r1.r, porRevisor);
-    await ctx.corregir([JAVA, SCRIPT]);
+// Parametrizado por dominio (MEN-5 de la revision: el criterio pide Rust con
+// rust-wasm-reviewer; Java cubre el mismo mecanismo con otro patron del catalogo).
+for (const [fichero, dominio] of [
+  [JAVA, 'java-spring-reviewer'],
+  ['core/motor/src/lib.rs', 'rust-wasm-reviewer'],
+] as const) {
+  test(`alcance (TASK-095): cada revisor de dominio verifica SUS pendientes, no el generico en su lugar (${dominio})`, async () => {
+    await conRonda1([fichero, SCRIPT], async (ctx, r1) => {
+      const nombres1 = r1.r.informes.map((g) => g.revisor);
+      assert.deepEqual([...nombres1].sort(), ['code-quality-reviewer', dominio].sort());
+      const impDominio = `| IMP-1 | IMPORTANTE | abierto | ${fichero}:9 | implementacion |`;
+      const porRevisor = r1.r.informes.map((g) => (g.revisor === dominio ? informe([impDominio]) : informe([MEN_SCRIPT])));
+      await ctx.pedirCambios(r1.r, porRevisor);
+      await ctx.corregir([fichero, SCRIPT]);
+      const r2 = await ctx.review();
+      esAcotada(r2, r1.r.commitRevisado);
+      const deDominio = r2.peticiones.get(`peticion-revision-2-${dominio}.md`);
+      const generico = r2.peticiones.get('peticion-revision-2-code-quality-reviewer.md');
+      assert.ok(deDominio !== undefined, 'el revisor de dominio recibe su propia peticion');
+      assert.ok(generico !== undefined);
+      assert.ok(deDominio.includes('| IMP-1 | IMPORTANTE |') && !deDominio.includes('| MEN-3 |'), 'el dominio ve solo lo suyo');
+      assert.ok(generico.includes('| MEN-3 | MENOR |') && !generico.includes('| IMP-1 |'), 'el generico no verifica lo del dominio');
+      // Cada uno recibe el delta entero de la correccion, no filtrado.
+      for (const p of [deDominio, generico]) assert.ok(p.includes(fichero) && p.includes(SCRIPT));
+    });
+  });
+}
+
+test('alcance (TASK-095, MEN-2): una completa tras una acotada revisa desde la base', async () => {
+  await conRonda1([JAVA], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.corregir([JAVA]);
     const r2 = await ctx.review();
     esAcotada(r2, r1.r.commitRevisado);
-    const java = r2.peticiones.get('peticion-revision-2-java-spring-reviewer.md');
-    const generico = r2.peticiones.get('peticion-revision-2-code-quality-reviewer.md');
-    assert.ok(java !== undefined, 'el revisor de dominio recibe su propia peticion');
-    assert.ok(generico !== undefined);
-    assert.ok(java.includes('| IMP-1 | IMPORTANTE |') && !java.includes('| MEN-3 |'), 'java ve solo lo suyo');
-    assert.ok(generico.includes('| MEN-3 | MENOR |') && !generico.includes('| IMP-1 |'), 'el generico no verifica lo de java');
-    // Cada uno recibe el delta entero de la correccion, no filtrado.
-    for (const p of [java, generico]) assert.ok(p.includes(JAVA) && p.includes(SCRIPT));
+    // El informe de la ronda 2 no tiene tabla: la 3 es completa (fail-closed)
+    // y, como la 2 fue acotada, revisa desde la base.
+    await ctx.pedirCambios(r2.r, ['# Informe\n\n- Veredicto: PENDIENTE\n\n## Hallazgos\n\nUn fallo descrito en prosa.\n']);
+    await ctx.corregir([JAVA]);
+    const r3 = await ctx.review();
+    esCompleta(r3, /la ronda 2 fue acotada, asi que el diff va desde "develop"/);
+    assert.equal(r3.r.desde, 'develop');
   });
 });
 
@@ -255,12 +279,21 @@ test('alcance (TASK-095): el caso real que no convergia (IMPORTANTE relistado co
 
 test('alcance (TASK-095): abrir una ronda con hallazgos de la anterior sin marcar corregido ni aceptado avisa', async () => {
   await conRonda1([JAVA], async (ctx, r1) => {
-    await ctx.pedirCambios(r1.r, [informe([IMP_ABIERTO, `| MEN-1 | MENOR | aceptado | ${JAVA}:3 | plan |`])]);
+    await ctx.pedirCambios(r1.r, [
+      informe([
+        IMP_ABIERTO,
+        `| MEN-1 | MENOR | aceptado | ${JAVA}:3 | plan |`,
+        `| MEN-7 | MENOR | corregido | ${JAVA}:5 | plan |`,
+      ]),
+    ]);
     await ctx.corregir([JAVA]);
     const r2 = await ctx.review();
     const aviso = r2.r.avisos.join('\n');
     assert.match(aviso, /sin marcar como corregido ni aceptado: IMP-1 \(informe-revision-1[^)]*\.md\)/);
     assert.ok(!/MEN-1 \(/.test(aviso), 'lo aceptado no se avisa');
+    // MEN-3 de la revision: lo corregido tampoco (aunque si se verifica).
+    assert.doesNotMatch(aviso, /MEN-7 \(/, 'lo corregido no se avisa');
+    assert.ok([...r2.peticiones.values()].join('\n').includes('| MEN-7 | MENOR | corregido |'), 'lo corregido se verifica');
   });
 });
 
@@ -272,6 +305,16 @@ test('alcanceRondaSiguiente (TASK-095): la severidad ya no decide; las guardas f
     assert.equal(alcanceRondaSiguiente([pedida(filas)]).acotada, true, filas.join(' '));
   }
   assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA]), pedida([CRIT_ACEPTADO])]).acotada, true);
+  // MEN-1 de la revision: un fragmento que sigue siendo la plantilla obliga a
+  // la completa aunque otro fragmento tenga hallazgos (si no, un dominio sin
+  // revisar pasaria como verificado).
+  const plantilla =
+    '# Informe\n\n- Veredicto: cambios-solicitados\n\n## Hallazgos\n\n' +
+    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
+    '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) | (implementacion) |\n';
+  const conPlantilla = alcanceRondaSiguiente([pedida([IMP_ABIERTO]), plantilla]);
+  assert.equal(conPlantilla.acotada, false);
+  assert.match(conPlantilla.motivo, /sigue siendo la plantilla/);
   const casos: Array<[string, string[], RegExp]> = [
     ['sin informes', [], /no tiene informes/],
     ['veredicto aprobada', [informe([MEN_JAVA], 'aprobada')], /veredicto .* "aprobada"/],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index 86f0c94..5bdc231 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -92,8 +92,9 @@ const TABLA: Caso[] = [
   { nombre: 'cambios en la ronda 2 (bajo el tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 2 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
   // TASK-095: en el tope se pregunta en TODOS los modos (antes manual y semi
   // se detenian sin decir que decidir: IMP-3 de TASK-058, IMP-2 de TASK-059),
-  // y el comando lleva --ronda-extra, que review exige pasado el tope.
-  { nombre: 'cambios en la ronda 3 (tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3 }, fase: 'review', comando: 'taskctl review TASK-100 --ronda-extra', acciones: ['preguntar', 'preguntar', 'preguntar'] },
+  // y el comando NO lleva --ronda-extra (va en el motivo): ejecutarlo sin
+  // preguntar choca con review, que exige el flag pasado el tope (MEN-6).
+  { nombre: 'cambios en la ronda 3 (tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['preguntar', 'preguntar', 'preguntar'] },
   { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
 ];
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 296cff1cea3e39ae73515bb891cf4a8ebd8278a1..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-095/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-095/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-095/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-095/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-095/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-095/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-095/planificacion/brainstorm/salida-brainstorm-testing-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-095/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-095/revision/informe-revision-1.md                                                  |   58 ++++
 tareas/03-en-revision/TASK-095/revision/peticion-revision-1.md                                                 | 1413 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-095/tarea.md                                                       |    9 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                            |    5 +-
 12 files changed, 1481 insertions(+), 4 deletions(-)
````
