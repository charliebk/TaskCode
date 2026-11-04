# Peticion de revision — TASK-072 (ronda 2)

- Tarea: TASK-072 — Puerta de verificacion en finish y merge guard
- Rama revisada: feature/task-072-puerta-de-verificacion-en-finish-y-merge
- Rama base: develop
- Commit revisado (HEAD): 08cc6e32d82c57e55af26a5f91c46012bacbf646
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-072 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 05fd80e659723445971abf78e0a1c13c19ec880d (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | src/core/comando-merge.ts (analizarComando, rama de shells) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/core/comando-merge.ts (ramaDeCambio) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/commands/finish-verificacion.ts (puertaVerificacion, guardarMemo) | informe-revision-1.md |

## Commits a revisar (git log 05fd80e659723445971abf78e0a1c13c19ec880d..HEAD)

````
08cc6e3 fix(TASK-072): correcciones de la revision ronda 1 (MEN-1, MEN-2, MEN-3)
544936f chore(TASK-072): veredicto ronda 1 (cambios-solicitados)
bf29960 chore(TASK-072): coste revision +3283850 tokens (1 agente)
9a96cc4 docs(TASK-072): informe de revision ronda 1
efc6726 chore(TASK-072): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 05fd80e659723445971abf78e0a1c13c19ec880d..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 03ae29c..30c0c8d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -110,7 +110,10 @@ export async function puertaVerificacion(
 
   const timeoutS = config.timeout_verificacion;
   const r = ejecutarVerificacion(o.cwd, comando, timeoutS, o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs });
-  const huella = huellaDelArbol(o.cwd, comando, timeoutS);
+  // El memo solo con el arbol limpio: es la huella del commit que consulta el
+  // guardian de merges; con el arbol sucio no la casaria nunca (MEN-3).
+  const limpio = isWorkspaceClean(o.cwd);
+  const huella = limpio ? huellaDelArbol(o.cwd, comando, timeoutS) : null;
   if (huella !== null) guardarMemo(o.cwd, huella, r);
   if (r.estado !== 'verde') {
     throw new FinishCommandError(
@@ -120,7 +123,7 @@ export async function puertaVerificacion(
         'lo deja anotado en la tarea.'
     );
   }
-  if (!isWorkspaceClean(o.cwd)) {
+  if (!limpio) {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: la verificacion salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
         `("${comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita el ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index 93ef952..e47a6c8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -153,6 +153,14 @@ export function analizarComando(texto: string): OperacionMerge[] {
       continue;
     }
 
+    // `bash -c "..."`, `pwsh -Command "..."`, `cmd /c ...`: el texto interior se
+    // analiza igual (MEN-1 de la revision: es una forma frecuente en agentes).
+    const interior = textoDeShell(prog, seg);
+    if (interior !== null) {
+      ops.push(...analizarComando(interior));
+      continue;
+    }
+
     // `bash script.sh rama`, `sh ./script.sh rama` o el script a secas.
     let iScript = 0;
     if (SHELLS.has(prog)) {
@@ -175,6 +183,31 @@ export function analizarComando(texto: string): OperacionMerge[] {
   return ops;
 }
 
+/**
+ * El comando que un shell recibe como texto, o null si no es esa forma:
+ * `bash|sh|zsh|dash [opts] -c <texto>` (tambien `-lc`, `-ec`...),
+ * `powershell|pwsh [opts] -Command|-c <texto...>` y `cmd /c|/k <texto...>`.
+ */
+function textoDeShell(prog: string, seg: readonly string[]): string | null {
+  if (SHELLS.has(prog)) {
+    for (let i = 1; i < seg.length; i++) {
+      const a = seg[i] as string;
+      if (!a.startsWith('-')) return null;
+      if (/^-[a-z]*c[a-z]*$/i.test(a) && !a.startsWith('--')) return seg[i + 1] ?? null;
+    }
+    return null;
+  }
+  if (prog === 'powershell' || prog === 'pwsh') {
+    const i = seg.findIndex((a, j) => j > 0 && /^-(c|com|comm|comma|comman|command)$/i.test(a));
+    return i === -1 ? null : seg.slice(i + 1).join(' ');
+  }
+  if (prog === 'cmd') {
+    const i = seg.findIndex((a, j) => j > 0 && /^\/[ck]$/i.test(a));
+    return i === -1 ? null : seg.slice(i + 1).join(' ');
+  }
+  return null;
+}
+
 /** Argumentos que no son opciones (ni el valor de una), hasta `--`. */
 function posicionales(args: readonly string[], conValor: ReadonlySet<string>): string[] {
   const fuera: string[] = [];
@@ -208,5 +241,7 @@ function ramaDeCambio(args: readonly string[]): string | null {
     if (args.indexOf('--') < args.length - 1) return null;
     return posicionales(antes, CAMBIO_CON_VALOR)[0] ?? null;
   }
-  return posicionales(args, CAMBIO_CON_VALOR)[0] ?? null;
+  // `git checkout develop src/a.ts` (sin `--`) tambien restaura ficheros (MEN-2).
+  const pos = posicionales(args, CAMBIO_CON_VALOR);
+  return pos.length === 1 ? (pos[0] as string) : null;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
index 78a1906..8d4c440 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
@@ -166,6 +166,8 @@ test('finish (puerta): una verificacion verde que ensucia el arbol aborta con me
       /salio en verde, pero ha dejado cambios en el arbol de trabajo/
     );
     assert.equal(integradaEnDevelop(task.rama, repoRoot), false);
+    // MEN-3: con el arbol sucio no se guarda un memo que el guardian no casaria nunca.
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'freno-verificacion.json')), false);
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
index 0660295..320dd8f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
@@ -62,6 +62,33 @@ test('comando-merge: detecta merges, su destino por checkout/switch y los script
   assert.equal((analizarComando('git checkout develop -- f.txt && git merge x')[0] as { destino: null }).destino, null);
 });
 
+test('comando-merge (MEN-1): el texto de bash -c, pwsh -Command y cmd /c se analiza igual', () => {
+  const esperado = [{ tipo: 'merge', fuentes: ['feature/x'], destino: 'develop', dir: null }];
+  assert.deepEqual(analizarComando('bash -c "git checkout develop && git merge feature/x"'), esperado);
+  assert.deepEqual(analizarComando("bash -lc 'git checkout develop && git merge feature/x'"), esperado);
+  assert.deepEqual(analizarComando('powershell -NoProfile -Command "git checkout develop; git merge feature/x"'), esperado);
+  assert.deepEqual(analizarComando('pwsh -c "git switch develop; git merge feature/x"'), esperado);
+  assert.deepEqual(analizarComando('cmd /c "git checkout develop && git merge feature/x"'), esperado);
+  assert.deepEqual(analizarComando('bash -c "bash scripts/merge-fix-to-develop.sh fix/y"')[0], {
+    tipo: 'script',
+    script: 'merge-fix-to-develop.sh',
+    fuente: 'fix/y',
+    destinos: ['integracion'],
+  });
+  assert.deepEqual(analizarComando('bash -c "git status"'), []);
+  assert.deepEqual(analizarComando('bash -x scripts/merge-feature-to-develop.sh feature/x')[0], {
+    tipo: 'script',
+    script: 'merge-feature-to-develop.sh',
+    fuente: 'feature/x',
+    destinos: ['integracion'],
+  });
+});
+
+test('comando-merge (MEN-2): git checkout <rama> <fichero> sin -- restaura ficheros, no cambia de rama', () => {
+  assert.equal((analizarComando('git checkout develop src/a.ts && git merge develop')[0] as { destino: null }).destino, null);
+  assert.equal((analizarComando('git checkout develop && git merge x')[0] as { destino: string }).destino, 'develop');
+});
+
 test('comando-merge: lo que no es un merge nuevo no aparece', () => {
   for (const c of [
     'git status',
@@ -143,6 +170,7 @@ test('guardia: bloquea un merge hacia develop o main sin verde del commit que en
     assert.match(d.stderr, /--sin-verificacion/);
     assert.equal(decide(raiz, `cd . && git switch main && git merge ${RAMA}`).codigo, 2);
     assert.equal(decide(raiz, `bash scripts/gitflow/merge-feature-to-develop.sh ${RAMA} --develop develop`).codigo, 2);
+    assert.equal(decide(raiz, `bash -c "git checkout develop && git merge ${RAMA}"`).codigo, 2, 'MEN-1');
     // Estando ya en develop / main (la rama actual es el destino).
     git(['checkout', '-q', 'develop'], raiz);
     d = decide(raiz, `git merge ${RAMA}`);
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 05fd80e659723445971abf78e0a1c13c19ec880d..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-072/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-072/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-072/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-072/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-072/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-072/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-072/revision/informe-revision-1.md                                                  |   74 ++++
 tareas/03-en-revision/TASK-072/revision/peticion-revision-1.md                                                 | 1532 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-072/tarea.md                                                       |    6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                          |    7 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js                                    |   37 +-
 11 files changed, 1651 insertions(+), 5 deletions(-)
````
