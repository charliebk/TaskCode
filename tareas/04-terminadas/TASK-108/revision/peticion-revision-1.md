# Peticion de revision — TASK-108 (ronda 1)

- Tarea: TASK-108 — Verificacion proporcional B5: el guardian de merges ante el nivel 2
- Rama revisada: feature/task-108-verificacion-proporcional-b5-el-guardian
- Rama base: develop
- Commit revisado (HEAD): aeb40d9b77fd3075072e0ee7dabc83bd78eca304
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-108 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-108/tarea.md
- tareas/03-en-revision/TASK-108/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts

## Commits a revisar (git log develop..HEAD)

````
aeb40d9 docs(TASK-108): autorrevision
4824f81 feat(TASK-108): el guardian exige la completa con nivel 2 y lo dice en el bloqueo
008a4c8 chore(TASK-108): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index ccf47d7..7f7c80e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -277,8 +277,8 @@ async function puertaSoloDocumentacion(
 /**
  * TASK-106: por que se ejecuta la completa en un proyecto que la decide (la
  * base declara `rutas_documentacion`). Una decision `selectiva` solo llega aqui
- * si la puerta no la permite: un hotfix. No es la `motivoDeLaCompleta` del
- * guardian (fs/decision-documentacion), que aun no acepta la selectiva (B5).
+ * si la puerta no la permite: un hotfix. No es el texto del guardian de merges
+ * (hooks/guardia-merge), que con codigo exige siempre la completa (TASK-108, D1).
  */
 function motivoCompletaEnFinish(d: DecisionVerificacion): string {
   return d.tipo === 'selectiva' ? 'un hotfix integra en la principal y siempre se verifica con la completa' : d.motivo;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
index aa07602..0102313 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
@@ -144,16 +144,6 @@ function necesitaNivel2(diff: Rutas): boolean {
   return diff.todas.length > 0 && !diff.todas.includes(RUTA_CONFIG) && diff.fueraDeDocs.length > 0;
 }
 
-/**
- * TASK-105: el motivo que el guardian muestra al exigir la completa (finish
- * acepta la selectiva desde TASK-106 y tiene el suyo). Hasta que el guardian la
- * acepte (B5), una decision `selectiva` se ensena como en la 0.14.0: su motivo
- * («basta la verificacion de lo afectado») contradiria que se exige la completa.
- */
-export function motivoDeLaCompleta(d: DecisionVerificacion): string {
-  return d.tipo === 'selectiva' ? 'la tarea cambia rutas que no son documentacion' : d.motivo;
-}
-
 /** Que verificacion toca en un turno (Stop) o en una ronda (review). */
 export type PlanVerificacion =
   /** Solo documentacion. `comando` null: no se declaro comprobacion, no se corre nada. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 2993f3b..0a261d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -25,6 +25,11 @@
  *      su verde guardado. Nunca si el comando puede crear o mover commits antes
  *      del merge, en un release, con un held-out cambiado, o pasado el
  *      presupuesto de tiempo. Solo se calcula si el paso 6 no dejo pasar.
+ *      TASK-108 (D1, 2026-11-11): con `rutas_verificacion_parcial`, si entra
+ *      codigo se exige SIEMPRE la completa del paso 6, aunque `finish` integre
+ *      con la selectiva; el memo `selectiva` no se lee nunca. Solo la DECISION
+ *      sale de la config del destino: los pasos 3 y 6 usan la del arbol, igual
+ *      que `finish` al guardar la huella (si no, dejarian de casar).
  *   7. Cualquier otra cosa BLOQUEA (exit 2): «sin verde» cuenta como no verde
  *      (decision de Carlos) y remite a `taskctl finish`, que si verifica.
  *
@@ -39,7 +44,7 @@ import { analizarComando, type OperacionMerge } from '../core/comando-merge.js';
 import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
 import { huellaDeCommit, leerMemo } from '../fs/verificacion.js';
 import { comandoSoloIntegra } from '../core/comando-merge.js';
-import { decidirVerificacionEntre, motivoDeLaCompleta } from '../fs/decision-documentacion.js';
+import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
 import { timeoutEfectivoS } from './freno-stop.js';
 
 import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
@@ -243,6 +248,18 @@ function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig, contexto: C
   );
 }
 
+/**
+ * TASK-108: lo que se anade al bloqueo cuando el destino declara
+ * `rutas_verificacion_parcial` y entra codigo. No manda a «correr la completa y
+ * repetir»: con el nivel 2 ningun camino guarda la completa de ese commit donde
+ * el guardian la busca, y eso solo acabaria en un bucle. Tampoco nombra la causa
+ * (develop avanzo, la huella no casa): el guardian no la comprueba.
+ */
+const LINEA_SELECTIVA =
+  'Con codigo, un merge a mano exige la verificacion completa en verde de ese commit aunque taskctl finish ' +
+  'acepte la de lo afectado (rutas_verificacion_parcial), y un merge a mano no la obtiene. Integra con taskctl ' +
+  'finish TASK-NNN, que verifica y mergea por su cuenta; tras un conflicto, resuelvelo y vuelve a lanzar finish.';
+
 /**
  * TASK-101: si lo que entra es solo documentacion segun la config del destino.
  * `detalle` explica por que no se aplica cuando el destino si la declara; null
@@ -264,10 +281,15 @@ function exencionDocumentacion(
     };
   }
   const d = r.decision;
-  // TASK-105: la selectiva cuenta como la completa, a proposito y no porque su
-  // comando no case con el memo de documentacion (D1: con codigo, el guardian
-  // exige la completa).
-  if (d.tipo !== 'documentacion') return { pasa: false, detalle: `No es solo documentacion: ${motivoDeLaCompleta(d)}.` };
+  // TASK-105/108 (D1, decision de Carlos del 2026-11-11): con codigo el guardian
+  // exige SIEMPRE la completa, aunque finish integre con la selectiva. Nunca se
+  // lee el memo `selectiva`. Su motivo propio («basta la verificacion de lo
+  // afectado») contradiria el bloqueo, asi que se ensena uno neutro y una linea
+  // que dice que hace falta y como integrar.
+  if (d.tipo === 'selectiva') {
+    return { pasa: false, detalle: `No es solo documentacion: la tarea cambia rutas que no son documentacion.\n${LINEA_SELECTIVA}` };
+  }
+  if (d.tipo !== 'documentacion') return { pasa: false, detalle: `No es solo documentacion: ${d.motivo}.` };
   if (integ.release) {
     return { pasa: false, detalle: 'Un release lleva a la principal todo lo acumulado: siempre exige la verificacion completa.' };
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
index 1e59ca9..29f8ba4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -12,7 +12,7 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
 import { comandoSoloIntegra } from '../../src/core/comando-merge.js';
-import { guardarMemo, huellaDeCommit } from '../../src/fs/verificacion.js';
+import { contextoSelectiva, guardarMemo, huellaDeCommit } from '../../src/fs/verificacion.js';
 import { runFinishCommand } from '../../src/commands/finish.js';
 import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
 
@@ -305,3 +305,117 @@ test('guardian (TASK-105): una decision selectiva bloquea a proposito, aunque su
     }
   );
 });
+
+// TASK-108 (B5, D1 de Carlos del 2026-11-11): con rutas_verificacion_parcial el
+// guardian nunca acepta el verde de la selectiva para codigo.
+
+const verdeDe = (comando: string) =>
+  ({ comando, estado: 'verde' as const, codigo: 0, duracionMs: 1, timeoutS: 600, bytesTotales: 0, cola: '' });
+
+/** La selectiva es otro script (cuenta en `cuenta-sel`), para que su memo no se confunda con el de documentacion. */
+const comandoSel = (docs: string) => docs.replace(/ docs$/, ' sel');
+
+const PARCIAL = (docs: string) =>
+  `${RUTAS}comando_verificacion_documentacion: "${docs}"\n` +
+  `comando_verificacion_selectiva: "${comandoSel(docs)}"\n` +
+  'rutas_verificacion_parcial: [src/**]\n';
+
+const LINEA_COMPLETA = /un merge a mano exige la verificacion completa en verde de ese commit/;
+
+test('guardian (TASK-108): con nivel 2, una tarea sin codigo pasa con el verde de su verificacion de documentacion', async () => {
+  await conEntorno(({ docs }) => PARCIAL(docs), async (e) => {
+    const task = sampleTask({ id: 'TASK-971' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    assert.equal(guardian(e, mergeA(task.rama)).codigo, 2, 'sin el verde de documentacion, bloquea');
+    const huella = huellaDeCommit(e.repoRoot, task.rama, e.comandoDocs, 600) as string;
+    guardarMemo(e.repoRoot, huella, verdeDe(e.comandoDocs), 'documentacion');
+    assert.equal(guardian(e, mergeA(task.rama)).codigo, 0);
+    assert.equal(e.ejecutadoAlguno(), false);
+  });
+});
+
+test('guardian (TASK-108): con nivel 2, una tarea con codigo se bloquea aunque conste en verde el memo de la selectiva', async () => {
+  await conEntorno(({ docs }) => PARCIAL(docs), async (e) => {
+    const task = sampleTask({ id: 'TASK-972' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/ui/boton.ts', 'export const b = 1;\n');
+    const sel = comandoSel(e.comandoDocs);
+    // El memo exactamente como lo guarda la selectiva (huella con la base y su commit).
+    const huellaSel = huellaDeCommit(e.repoRoot, task.rama, sel, 600, contextoSelectiva(e.repoRoot, 'develop')) as string;
+    guardarMemo(e.repoRoot, huellaSel, verdeDe(sel), 'selectiva');
+    const d = guardian(e, mergeA(task.rama));
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr ?? '', LINEA_COMPLETA);
+    // Control: lo que faltaba era la completa; con su verde, pasa.
+    const huella = huellaDeCommit(e.repoRoot, task.rama, e.comandoCompleta, 600) as string;
+    guardarMemo(e.repoRoot, huella, verdeDe(e.comandoCompleta), 'completa');
+    assert.equal(guardian(e, mergeA(task.rama)).codigo, 0);
+    assert.equal(e.ejecutadoAlguno(), false);
+  });
+});
+
+test('guardian (TASK-108): el bloqueo con codigo dice que hace falta la completa y como integrar, sin mandar a repetir el merge', async () => {
+  await conEntorno(({ docs }) => PARCIAL(docs), async (e) => {
+    const task = sampleTask({ id: 'TASK-973' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/ui/boton.ts', 'export const b = 1;\n');
+    const texto = guardian(e, mergeA(task.rama)).stderr ?? '';
+    assert.match(texto, /No es solo documentacion: la tarea cambia rutas que no son documentacion\.\n/);
+    assert.match(texto, LINEA_COMPLETA);
+    assert.match(texto, /aunque taskctl finish acepte la de lo afectado \(rutas_verificacion_parcial\)/);
+    assert.match(texto, /Integra con taskctl finish TASK-NNN, que verifica y mergea por su cuenta/);
+    assert.match(texto, /taskctl finish TASK-NNN --sin-verificacion/);
+    // Ni «corre la completa y repite» (bucle: nada la guarda) ni una causa que no se comprueba.
+    assert.doesNotMatch(texto, /repite el merge|corre la (verificacion )?completa|develop avanzo|huella/i);
+  });
+});
+
+test('guardian (TASK-108): decide con la config del destino; la del arbol no cambia el mensaje', async () => {
+  // La config del arbol se toca sin commitear: commitearla haria que la tarea
+  // cambiara .taskcode/config.yml, que por si solo exige la completa.
+  // El arbol declara la clave; el destino (develop) no la tiene: mensaje de antes.
+  await conEntorno(({ docs }) => `${RUTAS}comando_verificacion_documentacion: "${docs}"\n`, async (e) => {
+    const task = sampleTask({ id: 'TASK-974' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/ui/boton.ts', 'export const b = 1;\n');
+    await writeFile(
+      path.join(e.repoRoot, '.taskcode', 'config.yml'),
+      `comando_verificacion: "${e.comandoCompleta}"\n${PARCIAL(e.comandoDocs)}`,
+      'utf8'
+    );
+    const d = guardian(e, mergeA(task.rama));
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr ?? '', /No es solo documentacion: la tarea cambia rutas que no son documentacion: src\/ui\/boton\.ts/);
+    assert.doesNotMatch(d.stderr ?? '', LINEA_COMPLETA);
+  });
+  // Al reves: el destino la declara y el arbol la quita de su config: manda el destino.
+  await conEntorno(({ docs }) => PARCIAL(docs), async (e) => {
+    const task = sampleTask({ id: 'TASK-975' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/ui/boton.ts', 'export const b = 1;\n');
+    await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), `comando_verificacion: "${e.comandoCompleta}"\n${RUTAS}`, 'utf8');
+    const d = guardian(e, mergeA(task.rama));
+    assert.equal(d.codigo, 2);
+    assert.match(d.stderr ?? '', LINEA_COMPLETA);
+  });
+});
+
+test('guardian (TASK-108): sin rutas_verificacion_parcial, con codigo, se comporta como en la 0.14.0', async () => {
+  await conEntorno(() => RUTAS, async (e) => {
+    const task = sampleTask({ id: 'TASK-976' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
+    const d = guardian(e, mergeA(task.rama));
+    assert.equal(d.codigo, 2);
+    const lineas = (d.stderr ?? '').split('\n');
+    assert.equal(lineas.length, 5, d.stderr);
+    assert.match(lineas[0] as string, /^Merge bloqueado: .* no consta una verificacion en verde de ese commit \(comando de verificacion: /);
+    assert.equal(lineas[1], 'No es solo documentacion: la tarea cambia rutas que no son documentacion: src/calculo.ts.');
+    assert.match(lineas[2] as string, /^Cierra la tarea con taskctl finish TASK-NNN/);
+    assert.doesNotMatch(d.stderr ?? '', LINEA_COMPLETA);
+    const huella = huellaDeCommit(e.repoRoot, task.rama, e.comandoCompleta, 600) as string;
+    guardarMemo(e.repoRoot, huella, verdeDe(e.comandoCompleta), 'completa');
+    assert.equal(guardian(e, mergeA(task.rama)).codigo, 0);
+  });
+});
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-108/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-108/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-108/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-108/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-108/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-108/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-108/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/decision-documentacion.js                           |  9 ---------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                 | 30 +++++++++++++++++++++++++-----
 10 files changed, 33 insertions(+), 17 deletions(-)
````
