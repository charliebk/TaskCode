# Peticion de revision — TASK-103 (ronda 2)

- Tarea: TASK-103 — Guardian de merges: config invalida bloquea y merges que hoy no detecta
- Rama revisada: fix/task-103-guardian-de-merges-con-config-invalida-b
- Rama base: develop
- Commit revisado (HEAD): 96debe0ee8da5fbc5ddf4bd137d3832b980c7e73
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-103 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde c0fb85be8c337d7e66250a610ca4cd3bb2bdbd1c (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-103/tarea.md
- tareas/03-en-revision/TASK-103/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:117 (`MERGE_CON_VALOR`), usado por `esControlDeMerge | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts (test «el hook real evalua los merges que antes no detectaba») y src/hooks/guardia-merge.ts:`esRama | informe-revision-1.md |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:`esRama` + comando-merge.ts:`ramaDeCambio | informe-revision-1.md |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`sinPrefijos | informe-revision-1.md |

## Commits a revisar (git log c0fb85be8c337d7e66250a610ca4cd3bb2bdbd1c..HEAD)

````
96debe0 docs(TASK-103): autorrevision ronda 2
e1b93c8 docs(TASK-103): hallazgos de la revision 1 corregidos
6f1662e fix(TASK-103): correcciones de la revision 1
3a6dd59 chore(TASK-103): coste revision +5485703 tokens (1 agente)
5e077a8 chore(TASK-103): veredicto ronda 1 (cambios-solicitados)
34d4eea docs(TASK-103): informe de revision 1
778fba5 chore(TASK-103): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff c0fb85be8c337d7e66250a610ca4cd3bb2bdbd1c..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index ae34cbd..5c6b65d 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -74,12 +74,14 @@ entra ya este integrado; el mensaje cita el error y remite a `taskctl doctor`
 y a `taskctl finish`. Antes una config mal escrita desactivaba el guardian. La
 lista es fija porque sin config no se sabe `rama_base`: hacia cualquier otra
 rama deja pasar, y sin fichero de config todo sigue como antes. Ademas detecta
-merges que antes se le escapaban: `git merge -m --abort x` (y `--quit`,
-`--continue`, `--skip` como valor de una opcion), `{ git merge x; }`,
-`time git merge x` y `eval git merge x`, que nunca reciben la exencion de
-solo documentacion; y `git checkout <fichero> && git merge x` ya no toma el
-fichero como rama destino (solo cuenta como rama un nombre que existe en
-`refs/heads/` o `refs/remotes/origin/`).
+merges que antes se le escapaban: `git merge -m --abort x` y
+`--message --abort x` (y `--quit`, `--continue`, `--skip` como valor de una
+opcion), `{ git merge x; }`, `time [-p] [--] git merge x`, `eval git merge x`,
+`nohup git merge x`, `! git merge x` y el merge tras `then`, `do` o `else`,
+que nunca reciben la exencion de solo documentacion; y
+`git checkout <fichero> && git merge x` ya no toma el fichero como destino
+(solo cambia el destino una rama de `refs/heads/` o `refs/remotes/origin/`,
+un tag o un commit; estos dos desacoplan HEAD).
 
 ## 0.14.0 — 2026-11-10
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 3db70e8..42edfc4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -1102,13 +1102,16 @@ rama de integración (`rama_base`) o en la principal:
 - `git [-C dir] merge … <ref>`, con destino la última rama de un `git
   checkout|switch` del mismo texto o, si no hay, la rama actual; y los scripts
   `merge-<tipo>-to-<destino>.sh <rama>`. Un `git checkout <x>` con un único
-  argumento solo cambia el destino si `x` es una rama (existe en `refs/heads/`
-  o en `refs/remotes/origin/`): `git checkout README.md && git merge x`
-  restaura un fichero y el destino sigue siendo la rama actual.
+  argumento solo cambia el destino si `x` es una revisión: una rama (en
+  `refs/heads/` o en `refs/remotes/origin/`), un tag o un commit (estos dos
+  desacoplan HEAD, así que el merge no entra en ninguna rama). `git checkout
+  README.md && git merge x` restaura un fichero y el destino sigue siendo la
+  rama actual.
 - El texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …`,
   `cmd /c|/k …` y `eval …` se analiza igual que si se hubiera escrito
   directamente (también con opciones con valor delante, como `bash -o pipefail
-  -c`), y también tras `time [-p]` o dentro de un grupo `{ …; }`.
+  -c`), y también tras `time [-p] [--]`, `nohup`, `!`, dentro de un grupo
+  `{ …; }` o tras `then`, `do` y `else`.
 - **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
   guardado para el commit que entra** —sin verde cuenta como no verde— y remite
   a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
@@ -1121,14 +1124,15 @@ rama de integración (`rama_base`) o en la principal:
   pasar.
 - **Deja pasar** si el texto no contiene `merge` (sale sin cargar nada),
   `merge --abort|--continue|--quit|--skip` como opción (no como el valor de
-  otra: `git merge -m --abort x` sí mergea `x` y se evalúa), `merge-base`,
+  otra: `git merge -m --abort x` o `--message --abort x` sí mergean `x` y se
+  evalúan), `merge-base`,
   `git config merge.*`, `echo "git merge …"`, merges hacia ramas de trabajo, lo
   que ya está integrado (ancestro del destino, de la principal —el backmerge de
   recuperación de un hotfix— o de `origin/<destino>`), proyectos sin fichero de
   config o sin `comando_verificacion` y cualquier otro fallo antes de saber que
   el destino es protegido.
-- `eval`, `time` y `{ …; }` nunca reciben la exención de solo documentación:
-  el merge se evalúa completo.
+- `eval`, `time`, `nohup`, `{ …; }` y las estructuras de control nunca reciben
+  la exención de solo documentación: el merge se evalúa completo.
 - Nunca ejecuta la suite (su `timeout` es de 30 s): solo lee el memo.
 - Es una defensa contra despistes, no contra un agente hostil: no ve alias de
   git, `git pull`, `git push . x:develop` ni lo que se calcula en una subshell.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index 5072809..8c8e7cb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -105,7 +105,7 @@ function programa(token: string): string {
 /** Opciones globales de git que llevan su valor en el token siguiente. */
 const GLOBALES_CON_VALOR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix']);
 /** Opciones de `git merge` que llevan su valor en el token siguiente. */
-const MERGE_CON_VALOR = new Set(['-m', '-F', '-s', '-X', '--file', '--strategy', '--strategy-option', '--into-name']);
+const MERGE_CON_VALOR = new Set(['-m', '--message', '-F', '-s', '-X', '--file', '--strategy', '--strategy-option', '--into-name']);
 const MERGE_SIN_MERGE = new Set(['--abort', '--continue', '--quit', '--skip']);
 /** Opciones de checkout/switch que crean la rama nombrada en el token siguiente. */
 const CREAN_RAMA = new Set(['-b', '-B', '-c', '-C', '--orphan', '--create', '--force-create']);
@@ -116,17 +116,23 @@ const SCRIPT_CIERRE = /^merge-(feature|fix|hotfix|release)-to-(develop|main)\.sh
 const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
 
 /**
- * Quita asignaciones de entorno iniciales (`FOO=1 git merge x`), `command`,
- * `exec`, `env` y (TASK-103) la llave de un grupo (`{ git merge x; }`) y
- * `time [-p]`.
+ * Palabras que pueden ir delante de un comando sin cambiar cual es (TASK-103):
+ * `command`, `exec`, `env`, `nohup`, `!`, la llave de un grupo
+ * (`{ git merge x; }`) y las palabras de control de bash tras las que empieza
+ * un comando (`if c; then git merge x; fi`).
  */
+const PREFIJOS = new Set(['command', 'exec', 'env', 'nohup', '!', '{', 'then', 'do', 'else']);
+
+/** Quita asignaciones de entorno iniciales (`FOO=1 git merge x`), los PREFIJOS y `time [-p] [--]`. */
 function sinPrefijos(seg: readonly string[]): string[] {
   let i = 0;
   while (i < seg.length) {
     const t = seg[i] as string;
-    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) || ['command', 'exec', 'env', '{'].includes(t)) i++;
-    else if (t === 'time') i += seg[i + 1] === '-p' ? 2 : 1;
-    else break;
+    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) || PREFIJOS.has(t)) i++;
+    else if (t === 'time') {
+      i++;
+      while (seg[i] === '-p' || seg[i] === '--') i++;
+    } else break;
   }
   return seg.slice(i);
 }
@@ -148,11 +154,12 @@ function esControlDeMerge(args: readonly string[]): boolean {
 
 /**
  * Merges y scripts de cierre que aparecen en el comando, en orden.
- * `esRama` (TASK-103) dice si un nombre es una rama: `git checkout <x>` con un
- * unico argumento puede restaurar un fichero, y saberlo exige I/O que este
- * modulo no hace. Por defecto todo cuenta como rama (el comportamiento previo).
+ * `esRevision` (TASK-103) dice si `git checkout <x>` cambiaria HEAD a ese nombre
+ * (una rama, un tag o un commit): con un unico argumento tambien puede
+ * restaurar un fichero, y saberlo exige I/O que este modulo no hace. Por
+ * defecto todo cuenta como revision (el comportamiento previo).
  */
-export function analizarComando(texto: string, esRama: (nombre: string) => boolean = () => true): OperacionMerge[] {
+export function analizarComando(texto: string, esRevision: (nombre: string) => boolean = () => true): OperacionMerge[] {
   const ops: OperacionMerge[] = [];
   let destino: string | null = null;
   for (const bruto of segmentar(texto)) {
@@ -173,7 +180,7 @@ export function analizarComando(texto: string, esRama: (nombre: string) => boole
       const sub = (seg[i] ?? '').toLowerCase();
       const args = seg.slice(i + 1);
       if (sub === 'checkout' || sub === 'switch') {
-        const nuevo = ramaDeCambio(args, esRama);
+        const nuevo = ramaDeCambio(args, esRevision);
         if (nuevo !== null) destino = nuevo;
       } else if (sub === 'merge') {
         if (esControlDeMerge(args)) continue;
@@ -186,7 +193,7 @@ export function analizarComando(texto: string, esRama: (nombre: string) => boole
     // analiza igual (MEN-1 de la revision: es una forma frecuente en agentes).
     const interior = textoDeShell(prog, seg);
     if (interior !== null) {
-      ops.push(...analizarComando(interior, esRama));
+      ops.push(...analizarComando(interior, esRevision));
       continue;
     }
 
@@ -290,7 +297,7 @@ function posicionales(args: readonly string[], conValor: ReadonlySet<string>): s
  * La rama a la que deja un `git checkout|switch`, o null si no cambia de rama
  * (restaurar ficheros: `git checkout -- f`, `git checkout develop -- f`).
  */
-function ramaDeCambio(args: readonly string[], esRama: (nombre: string) => boolean): string | null {
+function ramaDeCambio(args: readonly string[], esRevision: (nombre: string) => boolean): string | null {
   for (let i = 0; i < args.length; i++) {
     const a = args[i] as string;
     if (CREAN_RAMA.has(a)) return args[i + 1] ?? null;
@@ -303,9 +310,10 @@ function ramaDeCambio(args: readonly string[], esRama: (nombre: string) => boole
   }
   // `git checkout develop src/a.ts` (sin `--`) tambien restaura ficheros (MEN-2).
   // `git checkout README.md` tambien (TASK-103): con un unico argumento que no
-  // es rama, no cambia de rama y el destino sigue siendo el anterior.
+  // es una revision, no cambia HEAD y el destino sigue siendo el anterior. Un
+  // tag o un commit si: HEAD queda desacoplado y el merge no entra en ninguna rama.
   const pos = posicionales(args, CAMBIO_CON_VALOR);
-  return pos.length === 1 && esRama(pos[0] as string) ? (pos[0] as string) : null;
+  return pos.length === 1 && esRevision(pos[0] as string) ? (pos[0] as string) : null;
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 9c98f52..3311f21 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -109,9 +109,13 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
   if (comando === null) return PASAR;
   if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return PASAR;
   const cwd = entrada.cwd;
-  // TASK-103: `git checkout README.md` no cambia de rama; solo un nombre que es rama lo hace.
-  const esRama = (n: string) => existeRef(`refs/heads/${n}`, cwd) || existeRef(`refs/remotes/origin/${n}`, cwd);
-  const ops = analizarComando(comando, esRama);
+  // TASK-103: `git checkout README.md` no cambia HEAD; una rama (tambien la que
+  // solo esta en origin: el DWIM de checkout), un tag o un commit, si.
+  const esRevision = (n: string) =>
+    existeRef(`refs/heads/${n}`, cwd) ||
+    existeRef(`refs/remotes/origin/${n}`, cwd) ||
+    git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${n}^{commit}`], cwd).ok;
+  const ops = analizarComando(comando, esRevision);
   if (ops.length === 0) return PASAR;
   const contexto: ContextoComando = { soloIntegra: comandoSoloIntegra(comando), inicioMs: Date.now() };
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
index 0ab9aad..ba391d5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
@@ -372,6 +372,8 @@ test('guardia: hooks.json declara el PreToolUse sin filtro if, en forma exec, si
 test('comando-merge (TASK-103, MEN-2): --abort/--quit/--continue/--skip como valor de -m no esconden el merge', () => {
   for (const control of ['--abort', '--quit', '--continue', '--skip']) {
     assert.deepEqual(analizarComando(`git merge -m ${control} x`), [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: null }], control);
+    // IMP-1 de la revision: tambien con la forma larga de -m.
+    assert.deepEqual(analizarComando(`git merge --message ${control} x`)[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null }, control);
     assert.deepEqual(analizarComando(`git merge -F ${control} x`)[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null }, control);
     // Como opcion, sigue sin ser un merge nuevo (tambien tras otra opcion con valor).
     assert.deepEqual(analizarComando(`git merge ${control}`), [], control);
@@ -383,9 +385,27 @@ test('comando-merge (TASK-103, MEN-2): --abort/--quit/--continue/--skip como val
 
 test('comando-merge (TASK-103): { ...; }, time y eval no esconden el merge', () => {
   const merge = [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: null }];
-  for (const c of ['{ git merge x; }', 'time git merge x', 'time -p git merge x', 'eval git merge x', 'eval "git merge x"', '{ time git merge x; }']) {
+  for (const c of [
+    '{ git merge x; }',
+    'time git merge x',
+    'time -p git merge x',
+    'eval git merge x',
+    'eval "git merge x"',
+    '{ time git merge x; }',
+    // MEN-2 de la revision.
+    'time -p -- git merge x',
+    'time -- git merge x',
+    'nohup git merge x',
+    '! git merge x',
+    'if true; then git merge x; fi',
+    'while false; do git merge x; done',
+    'if false; then :; else git merge x; fi',
+  ]) {
     assert.deepEqual(analizarComando(c), merge, c);
   }
+  for (const c of ['nohup git merge x', 'if true; then git merge x; fi']) {
+    assert.equal(comandoSoloIntegra(c), false, c);
+  }
   assert.deepEqual(analizarComando('eval "git checkout develop && git merge x"'), [
     { tipo: 'merge', fuentes: ['x'], destino: 'develop', dir: null },
   ]);
@@ -478,9 +498,13 @@ test('guardia (TASK-103): el hook real evalua los merges que antes no detectaba'
       `git merge -m --quit ${RAMA}`,
       `git merge -m --continue ${RAMA}`,
       `git merge -m --skip ${RAMA}`,
+      `git merge --message --abort ${RAMA}`,
       `{ git merge ${RAMA}; }`,
       `time git merge ${RAMA}`,
+      `time -p -- git merge ${RAMA}`,
       `eval git merge ${RAMA}`,
+      `nohup git merge ${RAMA}`,
+      `if true; then git merge ${RAMA}; fi`,
       // README.md es un fichero versionado, no una rama: el destino sigue siendo develop.
       `git checkout README.md && git merge ${RAMA}`,
     ]) {
@@ -490,9 +514,16 @@ test('guardia (TASK-103): el hook real evalua los merges que antes no detectaba'
     }
     // Una rama de verdad si cambia el destino.
     assert.equal(lanzar(`git checkout ${RAMA} && git merge develop`).status, 0);
-    // Y la que solo existe en origin (DWIM de git checkout).
+    // Y la que solo existe en origin (DWIM de git checkout). IMP-2 de la revision:
+    // la fuente no es ancestro de develop, asi que solo pasa si el destino cambio.
     git(['update-ref', 'refs/remotes/origin/remota', RAMA], raiz);
-    assert.equal(lanzar('git checkout remota && git merge develop').status, 0);
+    assert.equal(lanzar(`git checkout remota && git merge ${RAMA}`).status, 0);
+    // MEN-1: un tag o un commit desacoplan HEAD; el merge no entra en develop.
+    git(['tag', 't1', 'main'], raiz);
+    assert.equal(lanzar(`git checkout t1 && git merge ${RAMA}`).status, 0, 'tag');
+    const sha = git(['rev-parse', 'main'], raiz).trim();
+    assert.equal(lanzar(`git checkout ${sha} && git merge ${RAMA}`).status, 0, 'commit');
+    assert.equal(lanzar(`git checkout origin/remota && git merge ${RAMA}`).status, 0, 'rama remota desacoplada');
   });
 });
````

## Excluido del diff (7 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff c0fb85be8c337d7e66250a610ca4cd3bb2bdbd1c..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-103/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-103/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-103/revision/informe-revision-1.md                               |  70 ++++++++++++
 tareas/03-en-revision/TASK-103/revision/peticion-revision-1.md                              | 619 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-103/tarea.md                                    |  10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js                 |  40 ++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                |   9 +-
 7 files changed, 726 insertions(+), 22 deletions(-)
````
