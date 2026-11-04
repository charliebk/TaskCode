# Peticion de revision — TASK-077 (ronda 1)

- Tarea: TASK-077 — Guardian de merges: opciones con valor antes de -c y doc de bash -c
- Rama revisada: fix/task-077-guardian-de-merges-opciones-con-valor-an
- Rama base: develop
- Commit revisado (HEAD): 2c61fa6a53cf3429fb25721b4a17fbbdf5850960
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-077 (criterios de aceptacion y plan)

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

## Commits a revisar (git log develop..HEAD)

````
2c61fa6 fix(TASK-077): opciones de bash con valor antes de -c o del script no esconden el merge
9faa62b chore(TASK-077): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index b001684..059c966 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -23,7 +23,9 @@ Puerta de verificacion en finish y guardian de merges (TASK-072).
 - **Hook `PreToolUse`** (sustituye a la sonda de TASK-069, ya sin filtro `if`): bloquea un
   `git merge` o un script `merge-*-to-*.sh` hacia la rama de integracion (`rama_base`) o la
   principal si no consta un verde guardado del commit que entra, y remite a `taskctl finish`.
-  El destino sale del texto (`git checkout develop && git merge x`) o de la rama actual. Deja
+  El destino sale del texto (`git checkout develop && git merge x`) o de la rama actual. El
+  texto de `bash -c`, `pwsh -Command` y `cmd /c` se analiza igual (TASK-077: tambien con
+  opciones con valor delante, como `bash -o pipefail -c`). Deja
   pasar lecturas, `merge --abort|--continue|--quit`, `merge-base`, merges hacia ramas de
   trabajo y lo ya integrado (el backmerge de un hotfix que ya esta en main). Corre antes de cada
   comando Bash/PowerShell, pero sin `merge` en el texto sale sin cargar nada; nunca ejecuta la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 05e6540..7239108 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -654,6 +654,9 @@ rama de integración (`rama_base`) o en la principal:
 - `git [-C dir] merge … <ref>`, con destino la última rama de un `git
   checkout|switch` del mismo texto o, si no hay, la rama actual; y los scripts
   `merge-<tipo>-to-<destino>.sh <rama>`.
+- El texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …`
+  y `cmd /c|/k …` se analiza igual que si se hubiera escrito directamente
+  (también con opciones con valor delante, como `bash -o pipefail -c`).
 - **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
   guardado para el commit que entra** —sin verde cuenta como no verde— y remite
   a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index e47a6c8..e2533b5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -162,11 +162,7 @@ export function analizarComando(texto: string): OperacionMerge[] {
     }
 
     // `bash script.sh rama`, `sh ./script.sh rama` o el script a secas.
-    let iScript = 0;
-    if (SHELLS.has(prog)) {
-      iScript = 1;
-      while (iScript < seg.length && (seg[iScript] as string).startsWith('-')) iScript++;
-    }
+    const iScript = SHELLS.has(prog) ? opcionesDeShell(seg).fin : 0;
     const script = seg[iScript];
     if (script === undefined) continue;
     const nombre = script.split(/[\\/]/).pop() ?? script;
@@ -190,12 +186,9 @@ export function analizarComando(texto: string): OperacionMerge[] {
  */
 function textoDeShell(prog: string, seg: readonly string[]): string | null {
   if (SHELLS.has(prog)) {
-    for (let i = 1; i < seg.length; i++) {
-      const a = seg[i] as string;
-      if (!a.startsWith('-')) return null;
-      if (/^-[a-z]*c[a-z]*$/i.test(a) && !a.startsWith('--')) return seg[i + 1] ?? null;
-    }
-    return null;
+    // Como bash: con -c, el texto es el primer argumento que no es opcion.
+    const { fin, conC } = opcionesDeShell(seg);
+    return conC ? (seg[fin] ?? null) : null;
   }
   if (prog === 'powershell' || prog === 'pwsh') {
     const i = seg.findIndex((a, j) => j > 0 && /^-(c|com|comm|comma|comman|command)$/i.test(a));
@@ -208,6 +201,39 @@ function textoDeShell(prog: string, seg: readonly string[]): string | null {
   return null;
 }
 
+/**
+ * Donde acaban las opciones de un `bash|sh|zsh|dash` (TASK-077, MEN-4 de
+ * TASK-072): una sola regla para `-c` y para el script de cierre.
+ * - Es opcion todo token que empiece por `-` o `+`; `--` las termina.
+ * - Llevan valor en el token siguiente `--rcfile`, `--init-file` y los grupos
+ *   cortos que acaban en `o`/`O` (`-o pipefail`, `+o x`, `-O extglob`, `-eo x`).
+ * - `conC`: hubo `-c` (solo o en un grupo corto: `-lc`, `-ec`).
+ * `fin` es el indice del primer argumento que no es opcion.
+ */
+function opcionesDeShell(seg: readonly string[]): { fin: number; conC: boolean } {
+  let conC = false;
+  let i = 1;
+  while (i < seg.length) {
+    const a = seg[i] as string;
+    if (a === '--') return { fin: i + 1, conC };
+    if (!a.startsWith('-') && !a.startsWith('+')) break;
+    if (a === '--rcfile' || a === '--init-file') {
+      i += 2;
+      continue;
+    }
+    if (!a.startsWith('--')) {
+      const grupo = a.slice(1);
+      if (a.startsWith('-') && grupo.includes('c')) conC = true;
+      if (/[oO]$/.test(grupo)) {
+        i += 2;
+        continue;
+      }
+    }
+    i++;
+  }
+  return { fin: i, conC };
+}
+
 /** Argumentos que no son opciones (ni el valor de una), hasta `--`. */
 function posicionales(args: readonly string[], conValor: ReadonlySet<string>): string[] {
   const fuera: string[] = [];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
index 320dd8f..578c460 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
@@ -84,6 +84,37 @@ test('comando-merge (MEN-1): el texto de bash -c, pwsh -Command y cmd /c se anal
   });
 });
 
+test('comando-merge (MEN-4, TASK-077): las opciones de bash con valor antes de -c o del script no lo esconden', () => {
+  const merge = [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: null }];
+  for (const c of [
+    'bash -o pipefail -c "git merge x"',
+    'bash +o pipefail -c "git merge x"',
+    'bash -O extglob -c "git merge x"',
+    'bash +O extglob -c "git merge x"',
+    'bash -eo pipefail -c "git merge x"',
+    'bash --rcfile f -c "git merge x"',
+    'bash --init-file f -c "git merge x"',
+    'bash --norc -c "git merge x"',
+    'bash -c -x "git merge x"',
+    'sh -e -c "git merge x"',
+  ]) {
+    assert.deepEqual(analizarComando(c), merge, c);
+  }
+  const script = (fuente: string, nombre = 'merge-feature-to-develop.sh') => [
+    { tipo: 'script', script: nombre, fuente, destinos: ['integracion'] },
+  ];
+  assert.deepEqual(analizarComando('bash scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
+  assert.deepEqual(analizarComando('bash -x scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
+  assert.deepEqual(
+    analizarComando('bash -o pipefail scripts/merge-fix-to-develop.sh fix/y'),
+    script('fix/y', 'merge-fix-to-develop.sh')
+  );
+  assert.deepEqual(analizarComando('bash -- scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
+  // Sin -c ni script de cierre: nada.
+  assert.deepEqual(analizarComando('bash -o pipefail otro.sh'), []);
+  assert.deepEqual(analizarComando('bash -c'), []);
+});
+
 test('comando-merge (MEN-2): git checkout <rama> <fichero> sin -- restaura ficheros, no cambia de rama', () => {
   assert.equal((analizarComando('git checkout develop src/a.ts && git merge develop')[0] as { destino: null }).destino, null);
   assert.equal((analizarComando('git checkout develop && git merge x')[0] as { destino: string }).destino, 'develop');
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-077/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-077/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-077/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js               | 53 +++++++++++++++++++++++++++++++++++++++--------------
 4 files changed, 41 insertions(+), 15 deletions(-)
````
