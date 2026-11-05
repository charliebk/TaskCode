# Peticion de revision — TASK-073 (ronda 3)

- Tarea: TASK-073 — Tests held-out por tarea
- Rama revisada: feature/task-073-tests-held-out-por-tarea
- Rama base: develop
- Commit revisado (HEAD): 070d7846eb6e4457c2a4c0a9c280e77f264f4aa4
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: opus)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-073 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 477269866fc8a21d2b8574fec2c8b3fa3105ccfa (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-3.md), sin borrar la
peticion.

## Hallazgos de la ronda 2 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | test/commands/finish-heldout.test.ts (el test del hotfix no discrimina) | informe-revision-2.md |
| IMP-3 | IMPORTANTE | abierto | src/commands/finish.ts (`ramaBase` de un hotfix) + finish-heldout.ts (`sin-heldout`) | informe-revision-2.md |
| MEN-5 | MENOR | abierto | src/commands/finish-heldout.ts (remedio con base y rama cambiadas) | informe-revision-2.md |
| MEN-6 | MENOR | abierto | src/commands/finish-heldout.ts (mensaje de `Aceptacion/` en la rama) | informe-revision-2.md |

## Commits a revisar (git log 477269866fc8a21d2b8574fec2c8b3fa3105ccfa..HEAD)

````
070d784 fix(TASK-073): correcciones de la revision ronda 2 (IMP-3, MEN-1, MEN-5, MEN-6)
42b82db chore(TASK-073): veredicto ronda 2 (cambios-solicitados)
5360da3 chore(TASK-073): coste revision +5734608 tokens (1 agente)
116f133 docs(TASK-073): informe de revision ronda 2
78b73b7 chore(TASK-073): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 477269866fc8a21d2b8574fec2c8b3fa3105ccfa..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index d2c20c4..0ca7e7c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -672,7 +672,8 @@ la carpeta y `timeout_verificacion` como tope. Aborta, sin mergear:
 - si la tarea tiene `aceptacion/` y la config no declara `comando_heldout`;
 - si en verde dejan el árbol sucio.
 
-La rama base es la de integración, salvo en un hotfix, que nace de la principal.
+La rama base es la de integración, salvo en un hotfix, que nace de la principal. Si los held-out de un hotfix
+están en la rama de integración y no en la principal, aborta en vez de cerrar sin ejecutarlos.
 `comando_heldout` y su timeout se leen de la config **de la rama base**: la rama de
 la tarea no puede cambiar cómo se ejecutan. `--sin-verificacion` no los salta. Sin `aceptacion/` (ni en la rama ni en la
 base) no hay puerta. La petición de revisión excluye siempre
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
index 6abff2a..184557e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
@@ -39,6 +39,12 @@ export interface PuertaHeldoutOpts {
   ramaBase: string;
   /** Carpeta actual de la tarea, relativa a la raiz y con `/` (p. ej. `tareas/03-en-revision/TASK-1`). */
   carpetaTarea: string;
+  /**
+   * Hotfix: la rama de integracion, donde se diseño la tarea. Si los held-out
+   * estan ahi y no en la principal, la rama del hotfix no los tiene: se aborta
+   * en vez de cerrar sin ejecutarlos (IMP-3 de la revision).
+   */
+  ramaDiseno?: string;
   cwd: string;
   /** Solo para tests: sustituye al timeout (en ms). */
   timeoutMs?: number;
@@ -91,17 +97,37 @@ function remedio(base: string, origen: string, destino: string, otras: readonly
 export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
   const rutasRama = rutasDe('HEAD', o.cwd);
   const rutasBase = rutasDe(o.ramaBase, o.cwd);
-  const raras = [...new Set([...variantesHeldout(rutasRama, o.id), ...variantesHeldout(rutasBase, o.id)])];
-  if (raras.length > 0) {
+  // MEN-6 de la revision: se dice donde esta la variante (en la base, o solo en la rama).
+  const rarasBase = variantesHeldout(rutasBase, o.id);
+  const rarasRama = variantesHeldout(rutasRama, o.id).filter((c) => !rarasBase.includes(c));
+  if (rarasBase.length > 0 || rarasRama.length > 0) {
+    const donde =
+      rarasBase.length > 0
+        ? `${rarasBase.join(', ')} (en "${o.ramaBase}")`
+        : `${rarasRama.join(', ')} (en la rama de la tarea; en "${o.ramaBase}" no esta)`;
     throw new FinishCommandError(
-      `[ERROR] ${o.id}: ${raras.join(', ')} no se llama exactamente "${CARPETA_HELDOUT}" (en minusculas), ` +
-        `asi que no se tomaria por los tests held-out y no se ejecutarian. Renombrala a ${CARPETA_HELDOUT}/ ` +
-        `en "${o.ramaBase}". ${CIERRE}`
+      `[ERROR] ${o.id}: ${donde} no se llama exactamente "${CARPETA_HELDOUT}" (en minusculas), asi que no ` +
+        'se tomaria por los tests held-out y no se ejecutarian. ' +
+        (rarasBase.length > 0
+          ? `Renombrala a ${CARPETA_HELDOUT}/ en "${o.ramaBase}" e integralo en la rama. `
+          : `La rama no puede crear held-out: borrala de la rama. `) +
+        CIERRE
     );
   }
   const enRama = carpetasHeldout(rutasRama, o.id);
   const enBase = carpetasHeldout(rutasBase, o.id);
-  if (enRama.length === 0 && enBase.length === 0) return { tipo: 'sin-heldout' };
+  if (enRama.length === 0 && enBase.length === 0) {
+    const enDiseno = o.ramaDiseno === undefined ? [] : carpetasHeldout(rutasDe(o.ramaDiseno, o.cwd), o.id);
+    if (enDiseno.length > 0) {
+      throw new FinishCommandError(
+        `[ERROR] ${o.id}: los tests held-out de esta tarea estan en "${o.ramaDiseno}" (${enDiseno.join(', ')}), ` +
+          `pero un hotfix nace de "${o.ramaBase}", que no los tiene, asi que no se ejecutarian. Commitealos ` +
+          `tambien en "${o.ramaBase}" e integralo en la rama del hotfix; si no aplican al hotfix, quitalos de ` +
+          `"${o.ramaDiseno}". ${CIERRE}`
+      );
+    }
+    return { tipo: 'sin-heldout' };
+  }
 
   const destino = `${o.carpetaTarea}/${CARPETA_HELDOUT}`;
   if (enBase.length === 0) {
@@ -137,12 +163,20 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
     }
     const enDestino = enRama.includes(destino);
     const otras = enRama.filter((c) => c !== destino);
+    // MEN-5 de la revision: si ademas la base los cambio, primero se integra, para
+    // que el conflicto (si lo hay) salga en la rama y no en el merge final.
+    const baseCambio = !(arbolesMb.size === 1 && arbolesMb.has(arbolBase));
     throw new FinishCommandError(
       `[ERROR] ${o.id}: la rama ha editado, añadido o borrado los tests held-out: su contenido ` +
         `(${enRama.length === 0 ? 'ninguno' : enRama.join(', ')}) no coincide con el de "${o.ramaBase}" (${base}). ` +
         'El agente que implementa no puede cambiarlos; si hay que cambiarlos, lo hace la persona en ' +
-        `"${o.ramaBase}". Para restaurarlos${enDestino ? '' : ` en ${destino}`}:\n  ` +
-        `${remedio(o.ramaBase, base, destino, otras)}\n${CIERRE}`
+        `"${o.ramaBase}". ` +
+        (baseCambio
+          ? `Ademas "${o.ramaBase}" los ha cambiado desde que nacio la rama: integra primero "${o.ramaBase}" ` +
+            `(git merge ${o.ramaBase}; si hay conflicto en los held-out, quedate con la version de ` +
+            `"${o.ramaBase}") y reintenta; si sigue sin coincidir, restauralos`
+          : 'Para restaurarlos') +
+        `${enDestino ? '' : ` en ${destino}`}:\n  ${remedio(o.ramaBase, base, destino, otras)}\n${CIERRE}`
     );
   }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 4de1754..93ac999 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -459,6 +459,7 @@ export async function runFinishCommand(
       rama,
       // Un hotfix nace de la principal: sus held-out se commitean ahi (MEN-1).
       ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion,
+      ...(tipo === 'hotfix' && mainBranch !== null ? { ramaDiseno: ramaIntegracion } : {}),
       carpetaTarea: path
         .relative(deps.repoCwd, path.dirname((initial as NonNullable<typeof initial>).filePath))
         .split(path.sep)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
index 8ef6b3a..ca82557 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
@@ -351,8 +351,8 @@ test('heldout (MEN-1): un hotfix compara y ejecuta contra la rama principal, de
       await mkdir(dir, { recursive: true });
       await writeFile(path.join(dir, 'prueba.cjs'), "console.log('ok')\n", 'utf8');
       commitAll(c.repoRoot, 'docs: held-out del hotfix en main');
+      // develop NO los tiene: comparar con develop abortaria (el test discrimina, MEN-1 ronda 2).
       git(['checkout', '-q', 'develop'], c.repoRoot);
-      git(['merge', '-q', '--no-ff', '-m', 'main a develop', 'main'], c.repoRoot);
       const task = sampleTask({ id: 'TASK-745', tipo: 'hotfix', rama: 'hotfix/task-745-arreglo' });
       await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task, { base: 'main' });
       const r = await finish(c, ['TASK-745']);
@@ -363,6 +363,62 @@ test('heldout (MEN-1): un hotfix compara y ejecuta contra la rama principal, de
   );
 });
 
+test('heldout (IMP-3): un hotfix con los held-out solo en develop aborta en vez de cerrar sin ejecutarlos', async () => {
+  await conHeldout('TASK-748', async (c) => {
+    await c.desenlace('ko');
+    const config = readFileSync(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'utf8');
+    git(['checkout', '-q', 'main'], c.repoRoot);
+    await mkdir(path.join(c.repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+    commitAll(c.repoRoot, 'config en main');
+    git(['checkout', '-q', 'develop'], c.repoRoot);
+    const task = sampleTask({ id: 'TASK-748', tipo: 'hotfix', rama: 'hotfix/task-748-arreglo' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task, { base: 'main' });
+    const mainAntes = git(['rev-parse', 'main'], c.repoRoot).trim();
+    await assert.rejects(
+      () => finish(c, ['TASK-748']),
+      /estan en "develop" \(tareas\/01-en-diseno\/TASK-748\/aceptacion\), pero un hotfix nace de "main", que no los tiene/
+    );
+    assert.equal(c.ejecuciones().length, 0);
+    assert.equal(git(['rev-parse', 'main'], c.repoRoot).trim(), mainAntes, 'main no se ha tocado');
+  });
+});
+
+test('heldout (MEN-5): si la rama los toco y la base tambien, pide integrar primero la base', async () => {
+  await conHeldout('TASK-749', async (c) => {
+    const task = sampleTask({ id: 'TASK-749' });
+    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+    const destino = moverComoStart(c, 'TASK-749');
+    await writeFile(path.join(c.repoRoot, destino, 'prueba.cjs'), '// rebajado\n', 'utf8');
+    commitAll(c.repoRoot, 'rebajar');
+    git(['checkout', '-q', 'develop'], c.repoRoot);
+    const enDevelop = path.join(c.tareasRoot, '01-en-diseno', 'TASK-749', 'aceptacion', 'prueba.cjs');
+    await writeFile(enDevelop, `${readFileSync(enDevelop, 'utf8')}// corregido\n`, 'utf8');
+    commitAll(c.repoRoot, 'corregir en develop');
+    git(['checkout', '-q', task.rama], c.repoRoot);
+    await assert.rejects(
+      () => finish(c, ['TASK-749']),
+      /la rama ha editado[\s\S]*Ademas "develop" los ha cambiado desde que nacio la rama: integra primero "develop"/
+    );
+  });
+});
+
+test('heldout (MEN-6): una Aceptacion/ creada solo en la rama se nombra como de la rama, no de develop', async () => {
+  await conHeldout(
+    'TASK-750',
+    async (c) => {
+      const task = sampleTask({ id: 'TASK-750' });
+      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
+      const dir = path.join(c.tareasRoot, '03-en-revision', 'TASK-750', 'Aceptacion');
+      await mkdir(dir, { recursive: true });
+      await writeFile(path.join(dir, 'x.cjs'), '1\n', 'utf8');
+      commitAll(c.repoRoot, 'variante en la rama');
+      await assert.rejects(() => finish(c, ['TASK-750']), /en la rama de la tarea; en "develop" no esta[\s\S]*borrala de la rama/);
+    },
+    { conHeldout: false }
+  );
+});
+
 test('heldout (MEN-2): la rama no puede cambiar comando_heldout: se usa el de la rama base', async () => {
   await conHeldout('TASK-746', async (c) => {
     const task = sampleTask({ id: 'TASK-746' });
@@ -386,7 +442,7 @@ test('heldout (MEN-3): una carpeta Aceptacion/ con otras mayusculas aborta en ve
       commitAll(c.repoRoot, 'held-out mal nombrados');
       const task = sampleTask({ id: 'TASK-747' });
       await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
-      await assert.rejects(() => finish(c, ['TASK-747']), /Aceptacion no se llama exactamente "aceptacion"/);
+      await assert.rejects(() => finish(c, ['TASK-747']), /Aceptacion \(en "develop"\) no se llama exactamente "aceptacion"/);
       assert.equal(integrada(task.rama, c.repoRoot), false);
     },
     { conHeldout: false }
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 477269866fc8a21d2b8574fec2c8b3fa3105ccfa..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/03-en-revision/TASK-073/revision/informe-revision-2.md                    |  76 ++++++++++++++
 tareas/03-en-revision/TASK-073/revision/peticion-revision-2.md                   | 632 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-073/tarea.md                                          |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-heldout.js |  40 +++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js         |   1 +
 5 files changed, 744 insertions(+), 9 deletions(-)
````
