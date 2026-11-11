# Peticion de revision — TASK-103 (ronda 3)

- Tarea: TASK-103 — Guardian de merges: config invalida bloquea y merges que hoy no detecta
- Rama revisada: fix/task-103-guardian-de-merges-con-config-invalida-b
- Rama base: develop
- Commit revisado (HEAD): 146548b8305aa751bf4657d7edd9bd830a29a091
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-103 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 96debe0ee8da5fbc5ddf4bd137d3832b980c7e73 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (6 hallazgo(s)))

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
informe de esta ronda (informe-revision-3.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-103/tarea.md
- tareas/03-en-revision/TASK-103/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`MERGE_CON_VALOR | informe-revision-2.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts y src/hooks/guardia-merge.ts:`esRevision | informe-revision-2.md |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:`esRevision | informe-revision-2.md |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`sinPrefijos | informe-revision-2.md |
| NUE-1 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:`esRevision | informe-revision-2.md |
| NUE-2 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`sinPrefijos | informe-revision-2.md |

## Commits a revisar (git log 96debe0ee8da5fbc5ddf4bd137d3832b980c7e73..HEAD)

````
146548b docs(TASK-103): autorrevision ronda 3
cf8ac3d docs(TASK-103): hallazgos de la revision 2 corregidos
476e538 fix(TASK-103): correcciones de la revision 2
32bd4c2 chore(TASK-103): coste revision +4912105 tokens (1 agente)
d668fc6 chore(TASK-103): veredicto ronda 2 (cambios-solicitados)
04a3f25 docs(TASK-103): informe de revision 2
3e9e6b4 chore(TASK-103): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 96debe0ee8da5fbc5ddf4bd137d3832b980c7e73..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 5c6b65d..cb3cba9 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -77,11 +77,12 @@ rama deja pasar, y sin fichero de config todo sigue como antes. Ademas detecta
 merges que antes se le escapaban: `git merge -m --abort x` y
 `--message --abort x` (y `--quit`, `--continue`, `--skip` como valor de una
 opcion), `{ git merge x; }`, `time [-p] [--] git merge x`, `eval git merge x`,
-`nohup git merge x`, `! git merge x` y el merge tras `then`, `do` o `else`,
-que nunca reciben la exencion de solo documentacion; y
-`git checkout <fichero> && git merge x` ya no toma el fichero como destino
-(solo cambia el destino una rama de `refs/heads/` o `refs/remotes/origin/`,
-un tag o un commit; estos dos desacoplan HEAD).
+`nohup git merge x`, `! git merge x` y el merge en la condicion o el cuerpo
+de `if`, `elif`, `else`, `while` y `until`, que nunca reciben la exencion de
+solo documentacion; y `git checkout <fichero> && git merge x` ya no toma el
+fichero como destino (solo cambia el destino una rama de `refs/heads/` o
+`refs/remotes/origin/`, un tag o un commit, que desacoplan HEAD; `HEAD` y `@`
+no lo cambian).
 
 ## 0.14.0 — 2026-11-10
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 42edfc4..f67b439 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -1104,14 +1104,15 @@ rama de integración (`rama_base`) o en la principal:
   `merge-<tipo>-to-<destino>.sh <rama>`. Un `git checkout <x>` con un único
   argumento solo cambia el destino si `x` es una revisión: una rama (en
   `refs/heads/` o en `refs/remotes/origin/`), un tag o un commit (estos dos
-  desacoplan HEAD, así que el merge no entra en ninguna rama). `git checkout
-  README.md && git merge x` restaura un fichero y el destino sigue siendo la
-  rama actual.
+  desacoplan HEAD, así que el merge no entra en ninguna rama). `HEAD` y `@` no
+  cambian el destino: te dejan en la misma rama. `git checkout README.md && git
+  merge x` restaura un fichero y el destino sigue siendo la rama actual.
 - El texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …`,
   `cmd /c|/k …` y `eval …` se analiza igual que si se hubiera escrito
   directamente (también con opciones con valor delante, como `bash -o pipefail
   -c`), y también tras `time [-p] [--]`, `nohup`, `!`, dentro de un grupo
-  `{ …; }` o tras `then`, `do` y `else`.
+  `{ …; }` y en la condición o el cuerpo de `if`, `elif`, `else`, `while` y
+  `until`.
 - **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
   guardado para el commit que entra** —sin verde cuenta como no verde— y remite
   a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index 8c8e7cb..f5d08c9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -119,9 +119,10 @@ const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
  * Palabras que pueden ir delante de un comando sin cambiar cual es (TASK-103):
  * `command`, `exec`, `env`, `nohup`, `!`, la llave de un grupo
  * (`{ git merge x; }`) y las palabras de control de bash tras las que empieza
- * un comando (`if c; then git merge x; fi`).
+ * un comando: el cuerpo (`if c; then git merge x; fi`) y la condicion
+ * (`if git merge x; then ...`, NUE-2 de la ronda 2).
  */
-const PREFIJOS = new Set(['command', 'exec', 'env', 'nohup', '!', '{', 'then', 'do', 'else']);
+const PREFIJOS = new Set(['command', 'exec', 'env', 'nohup', '!', '{', 'then', 'do', 'else', 'if', 'elif', 'while', 'until']);
 
 /** Quita asignaciones de entorno iniciales (`FOO=1 git merge x`), los PREFIJOS y `time [-p] [--]`. */
 function sinPrefijos(seg: readonly string[]): string[] {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 3311f21..d3612df 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -111,10 +111,16 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
   const cwd = entrada.cwd;
   // TASK-103: `git checkout README.md` no cambia HEAD; una rama (tambien la que
   // solo esta en origin: el DWIM de checkout), un tag o un commit, si.
-  const esRevision = (n: string) =>
-    existeRef(`refs/heads/${n}`, cwd) ||
-    existeRef(`refs/remotes/origin/${n}`, cwd) ||
-    git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${n}^{commit}`], cwd).ok;
+  const esRevision = (n: string): boolean => {
+    // `HEAD` y `@` resuelven a un commit pero te dejan en la misma rama (NUE-1 de
+    // la ronda 2): no cambian el destino. Sin distinguir mayusculas, por Windows.
+    if (/^(?:head|@)$/i.test(n)) return false;
+    return (
+      existeRef(`refs/heads/${n}`, cwd) ||
+      existeRef(`refs/remotes/origin/${n}`, cwd) ||
+      git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${n}^{commit}`], cwd).ok
+    );
+  };
   const ops = analizarComando(comando, esRevision);
   if (ops.length === 0) return PASAR;
   const contexto: ContextoComando = { soloIntegra: comandoSoloIntegra(comando), inicioMs: Date.now() };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
index ba391d5..73ed7f7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
@@ -400,6 +400,11 @@ test('comando-merge (TASK-103): { ...; }, time y eval no esconden el merge', ()
     'if true; then git merge x; fi',
     'while false; do git merge x; done',
     'if false; then :; else git merge x; fi',
+    // NUE-2 de la ronda 2.
+    'if git merge x; then :; fi',
+    'while git merge x; do :; done',
+    'until git merge x; do :; done',
+    'if false; then :; elif git merge x; then :; fi',
   ]) {
     assert.deepEqual(analizarComando(c), merge, c);
   }
@@ -505,6 +510,15 @@ test('guardia (TASK-103): el hook real evalua los merges que antes no detectaba'
       `eval git merge ${RAMA}`,
       `nohup git merge ${RAMA}`,
       `if true; then git merge ${RAMA}; fi`,
+      // NUE-2 de la ronda 2: la condicion tambien.
+      `if git merge ${RAMA}; then :; fi`,
+      `if ! git merge ${RAMA}; then :; fi`,
+      `while git merge ${RAMA}; do :; done`,
+      `until git merge ${RAMA}; do :; done`,
+      `if false; then :; elif git merge ${RAMA}; then :; fi`,
+      // NUE-1 de la ronda 2: HEAD y @ no desacoplan; el destino sigue siendo develop.
+      `git checkout HEAD && git merge ${RAMA}`,
+      `git checkout @ && git merge ${RAMA}`,
       // README.md es un fichero versionado, no una rama: el destino sigue siendo develop.
       `git checkout README.md && git merge ${RAMA}`,
     ]) {
@@ -524,6 +538,10 @@ test('guardia (TASK-103): el hook real evalua los merges que antes no detectaba'
     const sha = git(['rev-parse', 'main'], raiz).trim();
     assert.equal(lanzar(`git checkout ${sha} && git merge ${RAMA}`).status, 0, 'commit');
     assert.equal(lanzar(`git checkout origin/remota && git merge ${RAMA}`).status, 0, 'rama remota desacoplada');
+    // NUE-1: tras cambiar a main, `git checkout HEAD` sigue en main.
+    const r = lanzar(`git checkout main && git checkout HEAD && git merge ${RAMA}`);
+    assert.equal(r.status, 2, 'HEAD tras main');
+    assert.match(r.stderr, /entraria en "main"/);
   });
 });
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 96debe0ee8da5fbc5ddf4bd137d3832b980c7e73..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-103/revision/informe-revision-2.md                |  60 +++++++++++++++++++
 tareas/03-en-revision/TASK-103/revision/peticion-revision-2.md               | 370 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-103/tarea.md                                      |   5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js  |   5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js |  12 +++-
 5 files changed, 446 insertions(+), 6 deletions(-)
````
