# Peticion de revision — TASK-106 (ronda 2)

- Tarea: TASK-106 — Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial
- Rama revisada: feature/task-106-verificacion-proporcional-b3-finish-veri
- Rama base: develop
- Commit revisado (HEAD): e7515d1c6d79b7cad4d2e5a89f81f6926f1f2afa
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-106 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 3c2c50c00aeb0dfc9b48288b37045af942a70650 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera. Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-106/tarea.md
- tareas/03-en-revision/TASK-106/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts (guarda `isWorkspaceClean` de `puertaSelectiva`, ~l. 359-365) / test/commands/finish-parcial.test.ts | informe-revision-1.md |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts (`anotarLineaUnica` + `anotarCompletaTrasParcial`) | informe-revision-1.md |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts (`motivoDeLaCompleta` local) y src/fs/decision-documentacion.ts (`motivoDeLaCompleta` exportada) | informe-revision-1.md |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts (mensaje rojo de la completa, ~l. 197-203) | informe-revision-1.md |

## Commits a revisar (git log 3c2c50c00aeb0dfc9b48288b37045af942a70650..HEAD)

````
e7515d1 docs(TASK-106): constancia de autorrevision ronda 2
50855ca docs(TASK-106): hallazgos de la ronda 1 corregidos en 4baf8f5
4baf8f5 fix(TASK-106): hallazgos de la ronda 1 (IMP-1, MEN-1, MEN-2, MEN-3)
3db48e0 chore(TASK-106): veredicto ronda 1 (cambios-solicitados)
4e58288 chore(TASK-106): coste revision +6422179 tokens (1 agente)
087d231 docs(TASK-106): informe de revision ronda 1
34f2091 chore(TASK-106): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 3c2c50c00aeb0dfc9b48288b37045af942a70650..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index e72b4c6..ccf47d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -171,17 +171,20 @@ export async function puertaVerificacion(
   if (docs !== null && docs.decision.tipo === 'selectiva' && o.permitirSelectiva === true) {
     return puertaSelectiva(o, comando, docs.decision, docs.timeoutSelectivaS, o.ramaBase as string);
   }
-  const motivoCompleta = docs === null ? null : motivoDeLaCompleta(docs.decision);
+  const motivoCompleta = docs === null ? null : motivoCompletaEnFinish(docs.decision);
   if (motivoCompleta !== null) {
     o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${motivoCompleta}.`);
   }
   // TASK-106: un intento anterior anoto la selectiva; se anota (y commitea) antes de correr, como la
   // via de documentacion, para que el memo de la completa case con el commit que se integra.
   let tarea = o.initial;
+  let commitAnotacion: string | null = null;
   if (motivoCompleta !== null) {
     const body = anotarCompletaTrasParcial(o.initial.body, o.instante, comando, motivoCompleta);
     if (body !== o.initial.body) {
-      tarea = (await anotarYCommitear(o, body, 'reintento con verificacion completa', 'anotar la verificacion')).tarea;
+      const a = await anotarYCommitear(o, body, 'reintento con verificacion completa', 'anotar la verificacion');
+      tarea = a.tarea;
+      commitAnotacion = a.commit;
     }
   }
 
@@ -195,7 +198,11 @@ export async function puertaVerificacion(
   if (huella !== null) guardarMemo(o.cwd, huella, r);
   if (r.estado !== 'verde') {
     throw new FinishCommandError(
-      `[ERROR] ${o.id}: no se mergea con la verificacion en rojo. No se ha tocado nada.\n` +
+      `[ERROR] ${o.id}: no se mergea con la verificacion en rojo. ` +
+        // MEN-3 de la revision: el reintento tras una parcial ya commiteo su anotacion en la rama.
+        (commitAnotacion === null
+          ? 'No se ha tocado nada.\n'
+          : `No se ha mergeado nada; solo se ha commiteado en la rama la anotacion del intento (${commitAnotacion}).\n`) +
         `${formatearVerificacionRoja(r)}\n` +
         textoDeLaCompleta(config, motivoCompleta) +
         `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
@@ -270,9 +277,10 @@ async function puertaSoloDocumentacion(
 /**
  * TASK-106: por que se ejecuta la completa en un proyecto que la decide (la
  * base declara `rutas_documentacion`). Una decision `selectiva` solo llega aqui
- * si la puerta no la permite: un hotfix.
+ * si la puerta no la permite: un hotfix. No es la `motivoDeLaCompleta` del
+ * guardian (fs/decision-documentacion), que aun no acepta la selectiva (B5).
  */
-function motivoDeLaCompleta(d: DecisionVerificacion): string {
+function motivoCompletaEnFinish(d: DecisionVerificacion): string {
   return d.tipo === 'selectiva' ? 'un hotfix integra en la principal y siempre se verifica con la completa' : d.motivo;
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 5b154bb..589983b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -415,11 +415,17 @@ function tieneSeccion(body: string, titulo: string): boolean {
   return rangoDeSeccion(body.split(/\r?\n/), titulo) !== null;
 }
 
-/** `- <instante>: <texto>` en la seccion, salvo que ya haya una linea con ese mismo texto (MEN-1 de TASK-100). */
+/**
+ * `- <instante>: <texto>` en la seccion, salvo que su ULTIMA linea ya tenga ese
+ * mismo texto (MEN-1 de TASK-100: un reintento igual no duplica). Se compara
+ * solo con la ultima (MEN-1 de TASK-106): tras selectiva, completa y otra vez
+ * selectiva, la seccion tiene que acabar diciendo lo que corrio al final.
+ */
 function anotarLineaUnica(body: string, titulo: string, instante: string, texto: string): string {
   const lineas = body.split(/\r?\n/);
   const rango = rangoDeSeccion(lineas, titulo);
-  if (rango !== null && lineas.slice(rango[0], rango[1]).some((l) => l.startsWith('- ') && l.endsWith(`: ${texto}`))) {
+  const ultima = rango === null ? undefined : lineas.slice(rango[0], rango[1]).filter((l) => l.startsWith('- ')).pop();
+  if (ultima !== undefined && ultima.endsWith(`: ${texto}`)) {
     return body;
   }
   return anotarLineaEnSeccion(body, titulo, `- ${instante}: ${texto}`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts
index 24766cc..d76b01e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts
@@ -24,6 +24,7 @@ const fs = require('node:fs');
 const tipo = process.argv[2];
 const dir = __dirname;
 fs.appendFileSync(dir + '/cuenta-' + tipo, 'x');
+if (tipo === 'sel' && fs.existsSync(dir + '/ensucia')) fs.writeFileSync(process.cwd() + '/sucio.txt', 'x');
 if (tipo === 'sel') fs.writeFileSync(dir + '/rama-base', process.env.RAMA_BASE === undefined ? '(sin)' : process.env.RAMA_BASE);
 const d = fs.readFileSync(dir + '/desenlace-' + tipo, 'utf8').trim();
 if (d === 'ok') { console.log(tipo + ' en verde'); process.exit(0); }
@@ -40,6 +41,8 @@ interface Entorno {
   desenlace(tipo: Tipo, d: 'ok' | 'ko'): Promise<void>;
   ejecuciones(tipo: Tipo): number;
   ramaBaseRecibida(): string | null;
+  /** La selectiva deja `sucio.txt` (no ignorado) en el repo. */
+  ensuciar(): Promise<void>;
 }
 
 /** `trabajo-*.txt` (lo que deja `setupTaskEnRevision`) es documentacion; el codigo parcial vive en src/**. */
@@ -75,6 +78,7 @@ async function conEntorno(
           const f = path.join(dir, `cuenta-${tipo}`);
           return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
         },
+        ensuciar: () => writeFile(path.join(dir, 'ensucia'), 'x', 'utf8'),
         ramaBaseRecibida: () => {
           const f = path.join(dir, 'rama-base');
           return existsSync(f) ? readFileSync(f, 'utf8') : null;
@@ -369,3 +373,46 @@ test('finish (TASK-106): un reintento que acaba en la completa lo anota bajo la
     assert.equal(leerMemo(e.repoRoot, huella, 'completa')?.estado, 'verde', 'el verde de la completa es del commit integrado');
   });
 });
+
+test('finish (TASK-106, IMP-1): la selectiva en verde que deja el arbol sucio no integra ni anota', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-965' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts');
+    await e.ensuciar();
+    const develop = git(['rev-parse', 'develop'], e.repoRoot);
+    await assert.rejects(
+      () => finish(e, 'TASK-965'),
+      (err: unknown) =>
+        err instanceof FinishCommandError &&
+        /la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo/.test(err.message) &&
+        /No se ha mergeado nada/.test(err.message)
+    );
+    assert.equal(e.ejecuciones('sel'), 1);
+    assert.equal(git(['rev-parse', 'develop'], e.repoRoot), develop, 'develop no se mueve');
+    const t = await readTareaFile(e.tareasRoot, 'TASK-965');
+    assert.equal(t?.task.estado, 'en-revision');
+    assert.doesNotMatch(t?.body ?? '', /## Verificacion parcial/);
+  });
+});
+
+test('finish (TASK-106, MEN-3): el rojo de la completa en un reintento dice que solo se commiteo la anotacion', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-966' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    const t0 = await readTareaFile(e.tareasRoot, 'TASK-966');
+    await writeTareaFile(e.tareasRoot, t0!.task, `${t0!.body.replace(/\s*$/, '')}\n\n## Verificacion parcial\n\n- 2026-11-10: todo en src; se ejecuta la selectiva en verde\n`);
+    commitAll(e.repoRoot, 'intento anterior');
+    await enLaRama(e, 'lib/util.ts');
+    await e.desenlace('completa', 'ko');
+    const develop = git(['rev-parse', 'develop'], e.repoRoot);
+    await assert.rejects(
+      () => finish(e, 'TASK-966'),
+      (err: unknown) =>
+        err instanceof FinishCommandError &&
+        /No se ha mergeado nada; solo se ha commiteado en la rama la anotacion del intento \([0-9a-f]+\)/.test(err.message) &&
+        !/No se ha tocado nada/.test(err.message)
+    );
+    assert.equal(git(['rev-parse', 'develop'], e.repoRoot), develop);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
index 01674cb..73f06ea 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
@@ -14,7 +14,7 @@ import {
   RUTA_TAREAS_SIEMPRE_DOCUMENTACION,
 } from '../../src/core/verificacion-proporcional.js';
 import { ConfigError, parsearConfig } from '../../src/core/config.js';
-import { anotarVerificacionDocumentacion, anotarVerificacionParcial } from '../../src/core/transiciones.js';
+import { anotarCompletaTrasParcial, anotarVerificacionDocumentacion, anotarVerificacionParcial } from '../../src/core/transiciones.js';
 import { rutasDeTarea } from '../../src/fs/git.js';
 
 const CFG = { rutas_documentacion: ['docs/**'], comando_verificacion_documentacion: null };
@@ -101,6 +101,18 @@ test('anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reint
   assert.match(otra, /- 2026-11-12: otro motivo;/);
 });
 
+test('anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva', () => {
+  const base = '## Objetivo\n\nX.\n';
+  assert.equal(anotarCompletaTrasParcial(base, '2026-11-10', 'npm test', 'fuera'), base, 'sin seccion parcial, nada');
+  const uno = anotarVerificacionParcial(base, '2026-11-10', 'npm test', 'todo en src', 'node sel.js');
+  const dos = anotarCompletaTrasParcial(uno, '2026-11-11', 'npm test', 'fuera: lib/u.ts');
+  assert.equal(anotarCompletaTrasParcial(dos, '2026-11-11', 'npm test', 'fuera: lib/u.ts'), dos, 'reintento igual: no duplica');
+  const tres = anotarVerificacionParcial(dos, '2026-11-12', 'npm test', 'todo en src', 'node sel.js');
+  const lineas = tres.split('\n').filter((l) => l.startsWith('- '));
+  assert.equal(lineas.length, 3);
+  assert.match(lineas[2] as string, /^- 2026-11-12: todo en src; se ejecuta la selectiva `node sel\.js` en verde/);
+});
+
 test('rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual', async () => {
   const dir = await mkdtemp(path.join(tmpdir(), 'rutas-tarea-'));
   const g = (...a: string[]) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 3c2c50c00aeb0dfc9b48288b37045af942a70650..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-106/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-106/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-106/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-106/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-106/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-106/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-106/revision/informe-revision-1.md                                                  |  75 +++++++
 tareas/03-en-revision/TASK-106/revision/peticion-revision-1.md                                                 | 965 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-106/tarea.md                                                       |  10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                          |  18 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                     |  10 +-
 11 files changed, 1068 insertions(+), 10 deletions(-)
````
