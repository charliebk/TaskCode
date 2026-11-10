# Peticion de revision — TASK-101 (ronda 2)

- Tarea: TASK-101 — Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion
- Rama revisada: feature/task-101-verificacion-proporcional-a2-el-guardian
- Rama base: develop
- Commit revisado (HEAD): 68d0b61a19a4bc6a3633ddf41a8b32efc0ac1184
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-101 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 0cfd4c0ca59fb7ba3a33cd50c6935ae4cf1e41b5 (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-101/tarea.md
- tareas/03-en-revision/TASK-101/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| CRI-1 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`GIT_SIN_EFECTO` incluye `merge`; lo consume `comandoSoloIntegra`) | informe-revision-1.md |
| CRI-2 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`SIN_EFECTO_EN_RAMAS` con echo/tee/cat/git log/rev-parse; redirecciones y sustitucion de comandos no vistas por `segmentar`) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts (detalle con config del destino invalida) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`MERGE_SIN_MERGE`; anterior a la tarea) | informe-revision-1.md |

## Commits a revisar (git log 0cfd4c0ca59fb7ba3a33cd50c6935ae4cf1e41b5..HEAD)

````
68d0b61 docs(TASK-101): autorrevision ronda 2
b461c7e docs(TASK-103): MEN-2 de la revision de TASK-101
56c79a7 fix(TASK-101): la exencion exige un unico merge y una lista blanca estricta sin redirecciones ni sustituciones
966934b chore(TASK-101): coste revision +4501811 tokens (1 agente)
9431c2d docs(TASK-101): informe de revision ronda 1
a127b55 chore(TASK-101): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 0cfd4c0ca59fb7ba3a33cd50c6935ae4cf1e41b5..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 12c3464..4e3b6e7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -894,7 +894,9 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   config de la rama destino): un merge a mano de una tarea de solo
   documentación pasa sin el verde de la completa, o con el verde de su
   comprobación de documentación si la hay. El guardián no aplica la exención si
-  el comando crea o mueve commits antes del merge (`git commit && git merge`),
+  el comando hace algo más que un merge, cambiar de carpeta o de rama y
+  consultar (un `git commit`, otro merge, `>`, `$(...)` o un script podrían
+  cambiar lo que entra),
   en un release, ni si cambian los held-out (`tareas/.../aceptacion/`), y la
   calcula solo cuando ya iba a bloquear, con un presupuesto de 20 s.
 - El freno de fin de turno y `review` siguen corriendo la completa o la selectiva.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index e285b5e..25e3155 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -122,9 +122,12 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   merge a mano de una tarea de solo documentacion pasa sin el verde de la
   completa (con comprobacion de documentacion, con su verde guardado). El
   guardian lee las rutas de la config de la rama destino y no aplica la
-  exencion si el comando crea o mueve commits antes del merge (`git commit &&
-  git merge ...`: haz el commit en otro comando), en un release, ni si cambian
-  los tests held-out (`tareas/.../aceptacion/`), que alli cuentan como codigo.
+  exencion si el comando hace algo mas que UN merge (o script de cierre),
+  cambiar de carpeta o de rama y consultar (`git status|log|diff|show`): un
+  `git commit`, otro merge, una redireccion (`>`), `$(...)` o un script antes
+  del merge podrian cambiar lo que entra. Haz el commit en otro comando. Tampoco
+  en un release, ni si cambian los tests held-out (`tareas/.../aceptacion/`),
+  que alli cuentan como codigo.
 - El fin de turno y `review` siguen como antes (mas estrictos, nunca mas laxos).
 
 ### Que `.md` NO son documentacion
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index 97148ae..08bc6fd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -276,42 +276,62 @@ function ramaDeCambio(args: readonly string[]): string | null {
 }
 
 /**
- * TASK-101: programas que no pueden cambiar ningun commit de ninguna rama.
- * Lectura, cambio de carpeta y salida por pantalla.
+ * TASK-101: lo unico que puede acompanar al merge para que el guardian aplique
+ * la exencion de solo documentacion. Lista blanca minima (CRI-2 de la revision:
+ * `echo`, `cat`, `tee` o `git log` con una redireccion o una sustitucion
+ * escribian una ref y movian la rama que se evalua).
  */
-const SIN_EFECTO_EN_RAMAS = new Set(['cd', 'pushd', 'popd', 'echo', 'pwd', 'true', 'set-location', 'sl', 'tee', 'cat', 'head', 'tail', 'grep']);
-/** Subcomandos de git que no mueven ninguna rama (checkout/switch y branch, aparte). */
-const GIT_SIN_EFECTO = new Set(['merge', 'status', 'log', 'diff', 'show', 'rev-parse']);
+const SOLO_CARPETA = new Set(['cd', 'pushd', 'popd', 'pwd', 'set-location', 'sl']);
+/** Subcomandos de git que solo consultan (checkout/switch y branch, aparte; merge se cuenta fuera). */
+const GIT_SOLO_CONSULTA = new Set(['status', 'log', 'diff', 'show', 'rev-parse']);
 /** `git branch` sin mas, o solo con estas opciones, solo lista. */
 const BRANCH_SOLO_LISTA = new Set(['--show-current', '-a', '-r', '--list', '-v', '-vv', '--all', '--remotes']);
+/**
+ * Caracteres que el troceado no interpreta y que pueden escribir ficheros o
+ * ejecutar otra orden: redirecciones, sustitucion de comandos y de variables.
+ */
+const CARACTERES_PELIGROSOS = /[<>`$]/;
 
 /**
- * TASK-101: true si, aparte de los merges y scripts de cierre, el comando solo
- * cambia de carpeta o de rama, consulta o escribe por pantalla. El guardian de
- * merges evalua la rama que entra ANTES de ejecutar el comando: si el comando
- * puede crear o mover commits antes del merge (`git commit`, `reset`, `rebase`,
- * `pull`, `cherry-pick`, un script, `taskctl`...), lo evaluado no es lo que
- * entra, y no se aplica la exencion de solo documentacion. Ante la duda, false.
+ * TASK-101: true si el comando, aparte de UN merge o script de cierre, solo
+ * cambia de carpeta o de rama o consulta. El guardian evalua la rama que entra
+ * ANTES de ejecutar el comando: si algo puede crear o mover commits antes del
+ * merge (`git commit`, otro `git merge` (CRI-1), `reset`, `pull`, un script,
+ * una redireccion a una ref...), lo evaluado no es lo que entra y no se aplica
+ * la exencion. Ante cualquier duda, false.
  */
 export function comandoSoloIntegra(texto: string): boolean {
+  if (CARACTERES_PELIGROSOS.test(texto)) return false;
+  if (analizarComando(texto).length !== 1) return false;
+  return segmentosSoloIntegran(texto);
+}
+
+function segmentosSoloIntegran(texto: string): boolean {
   for (const bruto of segmentar(texto)) {
     const seg = sinPrefijos(bruto);
     if (seg.length === 0) continue;
+    // Asignaciones de entorno delante (`GIT_DIR=x git merge`): fuera.
+    if (seg.length !== bruto.length) return false;
     const prog = programa(seg[0] as string);
-    if (SIN_EFECTO_EN_RAMAS.has(prog)) continue;
+    if (SOLO_CARPETA.has(prog)) continue;
     if (prog === 'git') {
       let i = 1;
-      while (i < seg.length && (seg[i] as string).startsWith('-')) i += GLOBALES_CON_VALOR.has(seg[i] as string) ? 2 : 1;
+      while (i < seg.length && (seg[i] as string).startsWith('-')) {
+        // Solo `-C <dir>`: `-c alias.x=!...` o `--exec-path` ejecutarian otra cosa.
+        if (seg[i] !== '-C') return false;
+        i += 2;
+      }
       const sub = (seg[i] ?? '').toLowerCase();
       const args = seg.slice(i + 1);
-      if (GIT_SIN_EFECTO.has(sub)) continue;
+      if (args.some((a) => a.startsWith('--output') || a === '-o' || a.startsWith('--exec'))) return false;
+      if (sub === 'merge' || GIT_SOLO_CONSULTA.has(sub)) continue;
       if ((sub === 'checkout' || sub === 'switch') && !args.some((a) => CREAN_RAMA.has(a) || a === '-f' || a === '--force')) continue;
       if (sub === 'branch' && args.every((a) => BRANCH_SOLO_LISTA.has(a))) continue;
       return false;
     }
     const interior = textoDeShell(prog, seg);
     if (interior !== null) {
-      if (!comandoSoloIntegra(interior)) return false;
+      if (!segmentosSoloIntegran(interior)) return false;
       continue;
     }
     const iScript = SHELLS.has(prog) ? opcionesDeShell(seg).fin : 0;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
index 2ae1646..4b3d08c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -199,11 +199,11 @@ test('guardian (TASK-101): sin rutas_documentacion el mensaje es exactamente el
   });
 });
 
-test('comandoSoloIntegra: solo cambiar de carpeta o de rama, consultar y mergear', () => {
+test('comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consultar', () => {
   for (const ok of [
     'git merge --no-ff feature/x',
     'cd repo && git checkout develop && git merge --no-ff feature/x',
-    'git -C repo switch develop; git merge feature/x | tee log.txt',
+    'git -C repo switch develop; git merge feature/x',
     'git status && git log -1 && git branch --show-current && git merge x',
     'bash scripts/merge-feature-to-develop.sh feature/x',
     'bash -c "git checkout develop && git merge x"',
@@ -219,7 +219,42 @@ test('comandoSoloIntegra: solo cambiar de carpeta o de rama, consultar y mergear
     'bash -c "git commit -m y && git merge x"',
     'git rebase develop && git merge x',
     'git fetch origin x:x && git merge x',
+    // CRI-1 de la revision: otro merge antes, hacia una rama no protegida.
+    'git checkout docs && git merge --no-edit code && git checkout develop && git merge --no-ff -m m docs',
+    'git checkout docs; git merge code; git checkout develop; git merge docs',
+    // CRI-2: redirecciones, tee, sustituciones.
+    'git rev-parse code > .git/refs/heads/docs && git merge docs',
+    'echo abc > .git/refs/heads/docs && git merge docs',
+    'echo abc | tee .git/refs/heads/docs && git merge docs',
+    'cat .git/refs/heads/code > .git/refs/heads/docs && git merge docs',
+    'echo "$(git branch -f docs code)" && git merge docs',
+    'git log "$(git branch -f docs code)" && git merge docs',
+    'git log `git branch -f docs code` && git merge docs',
+    'git log --output=.git/refs/heads/docs && git merge docs',
+    'git -c alias.st=!sh status && git merge docs',
+    'GIT_DIR=otro git merge docs',
   ]) {
     assert.equal(comandoSoloIntegra(no), false, no);
   }
 });
+
+test('guardian (TASK-101): CRI-1 y CRI-2 de la revision bloquean de punta a punta', async () => {
+  await conEntorno(() => RUTAS, async (e) => {
+    const task = sampleTask({ id: 'TASK-959' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'docs/guia.md');
+    git(['checkout', '-q', '-b', 'codigo', 'develop'], e.repoRoot);
+    await enLaRama(e, 'src/y.ts', 'export const y = 1;\n');
+    git(['checkout', '-q', 'develop'], e.repoRoot);
+    for (const cmd of [
+      `git checkout ${task.rama} && git merge --no-edit codigo && git checkout develop && git merge --no-ff -m m ${task.rama}`,
+      `git rev-parse codigo > .git/refs/heads/${task.rama} && git merge --no-ff ${task.rama}`,
+      `echo "$(git branch -f ${task.rama} codigo)" && git merge --no-ff ${task.rama}`,
+    ]) {
+      const d = guardian(e, cmd);
+      assert.equal(d.codigo, 2, cmd);
+    }
+    // Y el merge limpio de esa misma rama si pasa.
+    assert.equal(guardian(e, `git merge --no-ff ${task.rama}`).codigo, 0);
+  });
+});
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 0cfd4c0ca59fb7ba3a33cd50c6935ae4cf1e41b5..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/00-planificadas/TASK-103/tarea.md                                                                       |   1 +
 tareas/{02-en-curso => 03-en-revision}/TASK-101/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-101/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-101/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-101/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-101/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-101/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-101/revision/informe-revision-1.md                                                  |  79 ++++++++
 tareas/03-en-revision/TASK-101/revision/peticion-revision-1.md                                                 | 791 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-101/tarea.md                                                       |  10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js                                    |  55 ++++--
 11 files changed, 917 insertions(+), 19 deletions(-)
````
