# Peticion de revision — TASK-103 (ronda 1)

- Tarea: TASK-103 — Guardian de merges: config invalida bloquea y merges que hoy no detecta
- Rama revisada: fix/task-103-guardian-de-merges-con-config-invalida-b
- Rama base: develop
- Commit revisado (HEAD): c0fb85be8c337d7e66250a610ca4cd3bb2bdbd1c
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-103 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-103/tarea.md
- tareas/03-en-revision/TASK-103/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts

## Commits a revisar (git log develop..HEAD)

````
c0fb85b docs(TASK-103): autorrevision
784fd97 fix(TASK-103): guardian bloquea con config invalida y detecta mas merges
bbc04eb chore(TASK-103): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index dbcbb9c..ae34cbd 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -66,6 +66,21 @@ freno. Una config de la base invalida o un fallo al decidir no abortan: la
 selectiva con un aviso. Sin `rutas_documentacion`, `review` no lee la config
 de la base ni mira el arbol, como en la 0.14.0.
 
+Guardian de merges (TASK-103). **Cambio de comportamiento respecto a la
+0.14.0**: si `.taskcode/config.yml` existe pero no se puede leer (un valor
+invalido de cualquier clave, antigua o nueva), un merge o un script de cierre
+hacia `develop`, `main` o `master` queda BLOQUEADO, siempre, aunque lo que
+entra ya este integrado; el mensaje cita el error y remite a `taskctl doctor`
+y a `taskctl finish`. Antes una config mal escrita desactivaba el guardian. La
+lista es fija porque sin config no se sabe `rama_base`: hacia cualquier otra
+rama deja pasar, y sin fichero de config todo sigue como antes. Ademas detecta
+merges que antes se le escapaban: `git merge -m --abort x` (y `--quit`,
+`--continue`, `--skip` como valor de una opcion), `{ git merge x; }`,
+`time git merge x` y `eval git merge x`, que nunca reciben la exencion de
+solo documentacion; y `git checkout <fichero> && git merge x` ya no toma el
+fichero como rama destino (solo cuenta como rama un nombre que existe en
+`refs/heads/` o `refs/remotes/origin/`).
+
 ## 0.14.0 — 2026-11-10
 
 ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 57339e0..3db70e8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -1101,19 +1101,34 @@ rama de integración (`rama_base`) o en la principal:
 
 - `git [-C dir] merge … <ref>`, con destino la última rama de un `git
   checkout|switch` del mismo texto o, si no hay, la rama actual; y los scripts
-  `merge-<tipo>-to-<destino>.sh <rama>`.
-- El texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …`
-  y `cmd /c|/k …` se analiza igual que si se hubiera escrito directamente
-  (también con opciones con valor delante, como `bash -o pipefail -c`).
+  `merge-<tipo>-to-<destino>.sh <rama>`. Un `git checkout <x>` con un único
+  argumento solo cambia el destino si `x` es una rama (existe en `refs/heads/`
+  o en `refs/remotes/origin/`): `git checkout README.md && git merge x`
+  restaura un fichero y el destino sigue siendo la rama actual.
+- El texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …`,
+  `cmd /c|/k …` y `eval …` se analiza igual que si se hubiera escrito
+  directamente (también con opciones con valor delante, como `bash -o pipefail
+  -c`), y también tras `time [-p]` o dentro de un grupo `{ …; }`.
 - **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
   guardado para el commit que entra** —sin verde cuenta como no verde— y remite
   a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
+- **Bloquea siempre si `.taskcode/config.yml` existe pero no se puede leer**
+  (un valor inválido de cualquier clave) y el destino es `develop`, `main` o
+  `master` —lista fija, porque sin config no se sabe `rama_base`—, aunque lo
+  que entra ya esté integrado. El mensaje cita el error; se arregla el fichero
+  (`taskctl doctor` lo valida) y se repite el merge. Una config mal escrita no
+  desactiva el guardián. *Cambia el comportamiento de la 0.14.0*, que dejaba
+  pasar.
 - **Deja pasar** si el texto no contiene `merge` (sale sin cargar nada),
-  `merge --abort|--continue|--quit|--skip`, `merge-base`, `git config merge.*`,
-  `echo "git merge …"`, merges hacia ramas de trabajo, lo que ya está integrado
-  (ancestro del destino, de la principal —el backmerge de recuperación de un
-  hotfix— o de `origin/<destino>`), proyectos sin `comando_verificacion` y
-  cualquier fallo antes de saber que el destino es protegido.
+  `merge --abort|--continue|--quit|--skip` como opción (no como el valor de
+  otra: `git merge -m --abort x` sí mergea `x` y se evalúa), `merge-base`,
+  `git config merge.*`, `echo "git merge …"`, merges hacia ramas de trabajo, lo
+  que ya está integrado (ancestro del destino, de la principal —el backmerge de
+  recuperación de un hotfix— o de `origin/<destino>`), proyectos sin fichero de
+  config o sin `comando_verificacion` y cualquier otro fallo antes de saber que
+  el destino es protegido.
+- `eval`, `time` y `{ …; }` nunca reciben la exención de solo documentación:
+  el merge se evalúa completo.
 - Nunca ejecuta la suite (su `timeout` es de 30 s): solo lee el memo.
 - Es una defensa contra despistes, no contra un agente hostil: no ve alias de
   git, `git pull`, `git push . x:develop` ni lo que se calcula en una subshell.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index d06aabc..5072809 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -115,15 +115,44 @@ const CAMBIO_CON_VALOR = new Set(['--conflict', '--pathspec-from-file']);
 const SCRIPT_CIERRE = /^merge-(feature|fix|hotfix|release)-to-(develop|main)\.sh$/;
 const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
 
-/** Quita asignaciones de entorno iniciales (`FOO=1 git merge x`) y `command`/`exec`. */
+/**
+ * Quita asignaciones de entorno iniciales (`FOO=1 git merge x`), `command`,
+ * `exec`, `env` y (TASK-103) la llave de un grupo (`{ git merge x; }`) y
+ * `time [-p]`.
+ */
 function sinPrefijos(seg: readonly string[]): string[] {
   let i = 0;
-  while (i < seg.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(seg[i] as string) || ['command', 'exec', 'env'].includes(seg[i] as string))) i++;
+  while (i < seg.length) {
+    const t = seg[i] as string;
+    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) || ['command', 'exec', 'env', '{'].includes(t)) i++;
+    else if (t === 'time') i += seg[i + 1] === '-p' ? 2 : 1;
+    else break;
+  }
   return seg.slice(i);
 }
 
-/** Merges y scripts de cierre que aparecen en el comando, en orden. */
-export function analizarComando(texto: string): OperacionMerge[] {
+/**
+ * TASK-103 (MEN-2 de TASK-101): true si los argumentos de `git merge` llevan
+ * `--abort`, `--continue`, `--quit` o `--skip` como opcion, no como el valor de
+ * otra (`git merge -m --abort x` SI mergea x).
+ */
+function esControlDeMerge(args: readonly string[]): boolean {
+  for (let i = 0; i < args.length; i++) {
+    const a = args[i] as string;
+    if (a === '--') return false;
+    if (MERGE_SIN_MERGE.has(a)) return true;
+    if (MERGE_CON_VALOR.has(a)) i++;
+  }
+  return false;
+}
+
+/**
+ * Merges y scripts de cierre que aparecen en el comando, en orden.
+ * `esRama` (TASK-103) dice si un nombre es una rama: `git checkout <x>` con un
+ * unico argumento puede restaurar un fichero, y saberlo exige I/O que este
+ * modulo no hace. Por defecto todo cuenta como rama (el comportamiento previo).
+ */
+export function analizarComando(texto: string, esRama: (nombre: string) => boolean = () => true): OperacionMerge[] {
   const ops: OperacionMerge[] = [];
   let destino: string | null = null;
   for (const bruto of segmentar(texto)) {
@@ -144,10 +173,10 @@ export function analizarComando(texto: string): OperacionMerge[] {
       const sub = (seg[i] ?? '').toLowerCase();
       const args = seg.slice(i + 1);
       if (sub === 'checkout' || sub === 'switch') {
-        const nuevo = ramaDeCambio(args);
+        const nuevo = ramaDeCambio(args, esRama);
         if (nuevo !== null) destino = nuevo;
       } else if (sub === 'merge') {
-        if (args.some((a) => MERGE_SIN_MERGE.has(a))) continue;
+        if (esControlDeMerge(args)) continue;
         ops.push({ tipo: 'merge', fuentes: posicionales(args, MERGE_CON_VALOR), destino, dir });
       }
       continue;
@@ -157,7 +186,7 @@ export function analizarComando(texto: string): OperacionMerge[] {
     // analiza igual (MEN-1 de la revision: es una forma frecuente en agentes).
     const interior = textoDeShell(prog, seg);
     if (interior !== null) {
-      ops.push(...analizarComando(interior));
+      ops.push(...analizarComando(interior, esRama));
       continue;
     }
 
@@ -182,9 +211,11 @@ export function analizarComando(texto: string): OperacionMerge[] {
 /**
  * El comando que un shell recibe como texto, o null si no es esa forma:
  * `bash|sh|zsh|dash [opts] -c <texto>` (tambien `-lc`, `-ec`...),
- * `powershell|pwsh [opts] -Command|-c <texto...>` y `cmd /c|/k <texto...>`.
+ * `powershell|pwsh [opts] -Command|-c <texto...>`, `cmd /c|/k <texto...>` y
+ * (TASK-103) `eval <texto...>`.
  */
 function textoDeShell(prog: string, seg: readonly string[]): string | null {
+  if (prog === 'eval') return seg.length > 1 ? seg.slice(1).join(' ') : null;
   if (SHELLS.has(prog)) {
     // Como bash: con -c, el texto es el primer argumento que no es opcion.
     const { fin, conC } = opcionesDeShell(seg);
@@ -259,7 +290,7 @@ function posicionales(args: readonly string[], conValor: ReadonlySet<string>): s
  * La rama a la que deja un `git checkout|switch`, o null si no cambia de rama
  * (restaurar ficheros: `git checkout -- f`, `git checkout develop -- f`).
  */
-function ramaDeCambio(args: readonly string[]): string | null {
+function ramaDeCambio(args: readonly string[], esRama: (nombre: string) => boolean): string | null {
   for (let i = 0; i < args.length; i++) {
     const a = args[i] as string;
     if (CREAN_RAMA.has(a)) return args[i + 1] ?? null;
@@ -271,8 +302,10 @@ function ramaDeCambio(args: readonly string[]): string | null {
     return posicionales(antes, CAMBIO_CON_VALOR)[0] ?? null;
   }
   // `git checkout develop src/a.ts` (sin `--`) tambien restaura ficheros (MEN-2).
+  // `git checkout README.md` tambien (TASK-103): con un unico argumento que no
+  // es rama, no cambia de rama y el destino sigue siendo el anterior.
   const pos = posicionales(args, CAMBIO_CON_VALOR);
-  return pos.length === 1 ? (pos[0] as string) : null;
+  return pos.length === 1 && esRama(pos[0] as string) ? (pos[0] as string) : null;
 }
 
 /**
@@ -304,8 +337,8 @@ export function comandoSoloIntegra(texto: string): boolean {
   if (CARACTERES_PELIGROSOS.test(texto)) return false;
   if (analizarComando(texto).length !== 1) return false;
   const cuenta = { integraciones: 0 };
-  // NUE-2 de la revision: un `git merge -m --abort x` no cuenta en analizarComando
-  // pero si mergea; aqui se cuenta todo `git merge` y todo script de cierre.
+  // NUE-2 de la revision: se cuentan aparte todos los merges y scripts de cierre,
+  // con la misma regla que analizarComando (desde TASK-103, `-m --abort x` cuenta).
   return segmentosSoloIntegran(texto, cuenta) && cuenta.integraciones === 1;
 }
 
@@ -337,7 +370,7 @@ function segmentosSoloIntegran(texto: string, cuenta: { integraciones: number })
       const args = seg.slice(i + 1);
       if (args.some((a) => a.startsWith('--output') || a === '-o' || a.startsWith('--exec'))) return false;
       if (sub === 'merge') {
-        if (args.some((a) => MERGE_SIN_MERGE.has(a))) return false;
+        if (esControlDeMerge(args)) return false;
         cuenta.integraciones++;
         continue;
       }
@@ -350,6 +383,8 @@ function segmentosSoloIntegran(texto: string, cuenta: { integraciones: number })
       if (sub === 'branch' && args.every((a) => BRANCH_SOLO_LISTA.has(a))) continue;
       return false;
     }
+    // `eval` vuelve a expandir su texto: lo evaluado no seria lo que se ejecuta (TASK-103).
+    if (prog === 'eval') return false;
     const interior = textoDeShell(prog, seg);
     if (interior !== null) {
       if (!segmentosSoloIntegran(interior, cuenta)) return false;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 9faa1b7..9c98f52 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -9,8 +9,11 @@
  *   1. El texto no contiene `merge`: deja pasar (lo decide el punto de
  *      entrada, antes incluso de cargar este modulo).
  *   2. `analizarComando` no encuentra un merge ni un script de cierre.
- *   3. No es un repo, o la config no declara `comando_verificacion`, o no se
- *      puede leer: deja pasar (la puerta de `finish` sigue ahi).
+ *   3. No es un repo, no hay config o no declara `comando_verificacion`: deja
+ *      pasar (la puerta de `finish` sigue ahi). TASK-103: si la config existe
+ *      pero no se puede leer, un merge hacia develop, main o master (lista
+ *      fija: sin config no se sabe `rama_base`) BLOQUEA siempre, con el error
+ *      y como arreglarlo: una config mal escrita no desactiva el guardian.
  *   4. El destino no es la rama de integracion (`rama_base`) ni la principal.
  *   5. La fuente ya esta integrada: es ancestro del destino, de la principal
  *      (el backmerge de recuperacion que pide `finish`) o de origin/<destino>.
@@ -33,7 +36,7 @@ import { existsSync } from 'node:fs';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { analizarComando, type OperacionMerge } from '../core/comando-merge.js';
-import { raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
+import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
 import { huellaDeCommit, leerMemo } from '../fs/verificacion.js';
 import { comandoSoloIntegra } from '../core/comando-merge.js';
 import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
@@ -93,17 +96,27 @@ interface ContextoComando {
  */
 export const PRESUPUESTO_EXENCION_MS = 20_000;
 
+/** TASK-103: lo que se protege cuando la config no se puede leer (sin ella no se sabe `rama_base`). */
+const PROTEGIDAS_SIN_CONFIG: ReadonlySet<string> = new Set(['develop', 'main', 'master']);
+
+/** Lo que queda por decidir en los pasos 5 a 7. */
+type Pendiente =
+  | { tipo: 'verificar'; integ: Integracion; config: TaskcodeConfig }
+  | { tipo: 'config-invalida'; destino: string; error: ConfigError };
+
 export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUse {
   const comando = comandoCandidato(entrada);
   if (comando === null) return PASAR;
-  const ops = analizarComando(comando);
-  if (ops.length === 0) return PASAR;
   if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return PASAR;
   const cwd = entrada.cwd;
+  // TASK-103: `git checkout README.md` no cambia de rama; solo un nombre que es rama lo hace.
+  const esRama = (n: string) => existeRef(`refs/heads/${n}`, cwd) || existeRef(`refs/remotes/origin/${n}`, cwd);
+  const ops = analizarComando(comando, esRama);
+  if (ops.length === 0) return PASAR;
   const contexto: ContextoComando = { soloIntegra: comandoSoloIntegra(comando), inicioMs: Date.now() };
 
   // 3 y 4: hasta saber que algo entra en develop/main, cualquier fallo deja pasar.
-  const pendientes: { op: OperacionMerge; integ: Integracion; config: TaskcodeConfig }[] = [];
+  const pendientes: Pendiente[] = [];
   try {
     for (const op of ops) {
       const dirOp = op.tipo === 'merge' && op.dir !== null ? path.resolve(cwd, op.dir) : cwd;
@@ -111,15 +124,20 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
       let config: TaskcodeConfig;
       try {
         raiz = raizDelRepo(dirOp);
-        config = resolverConfigConAvisos(raiz).config;
       } catch {
         continue;
       }
+      try {
+        config = resolverConfigConAvisos(raiz).config;
+      } catch (e: unknown) {
+        if (e instanceof ConfigError) pendientes.push(...configInvalida(op, raiz, e));
+        continue;
+      }
       if (config.comando_verificacion === null) continue;
       const principal = ramaPrincipal(raiz);
       const protegidas = new Set([config.rama_base, ...(principal === null ? [] : [principal])]);
       for (const integ of integraciones(op, raiz, config.rama_base, principal)) {
-        if (protegidas.has(integ.destino)) pendientes.push({ op, integ, config });
+        if (protegidas.has(integ.destino)) pendientes.push({ tipo: 'verificar', integ, config });
       }
     }
   } catch {
@@ -129,8 +147,9 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
 
   // 5 a 7: ya se sabe que el comando integra en una rama protegida.
   try {
-    for (const { integ, config } of pendientes) {
-      const motivo = motivoDeBloqueo(integ, config, contexto);
+    for (const p of pendientes) {
+      if (p.tipo === 'config-invalida') return { codigo: 2, stderr: mensajeConfigInvalida(p.destino, p.error) };
+      const motivo = motivoDeBloqueo(p.integ, p.config, contexto);
       if (motivo !== null) return { codigo: 2, stderr: motivo };
     }
     return PASAR;
@@ -145,6 +164,23 @@ export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUs
   }
 }
 
+/**
+ * TASK-103: con la config ilegible, los destinos de la operacion que estan en
+ * la lista fija. Se calculan con los valores por defecto (`develop`, y la
+ * principal local o `main`). Se bloquea siempre, sin mirar ancestros ni verdes.
+ */
+function configInvalida(op: OperacionMerge, raiz: string, error: ConfigError): Pendiente[] {
+  const principal = ramaPrincipal(raiz) ?? 'main';
+  return integraciones(op, raiz, 'develop', principal)
+    .filter((integ) => PROTEGIDAS_SIN_CONFIG.has(integ.destino))
+    .map((integ) => ({ tipo: 'config-invalida', destino: integ.destino, error }));
+}
+
+/** El texto de un ConfigError sin su prefijo `[ERROR]`. */
+function textoDeConfigError(e: Error): string {
+  return e.message.replace(/^\[ERROR\]\s*/, '');
+}
+
 /** Pares fuente -> destino de una operacion. Para un merge sin destino explicito, la rama actual. */
 function integraciones(op: OperacionMerge, raiz: string, integracion: string, principal: string | null): Integracion[] {
   if (op.tipo === 'script') {
@@ -214,7 +250,7 @@ function exencionDocumentacion(
   if (r.tipo === 'config-invalida') {
     return {
       pasa: false,
-      detalle: `La configuracion de "${destino}" no es valida, asi que no se aplica la exencion de solo documentacion: ${r.error.message.replace(/^\[ERROR\]\s*/, '')}`,
+      detalle: `La configuracion de "${destino}" no es valida, asi que no se aplica la exencion de solo documentacion: ${textoDeConfigError(r.error)}`,
     };
   }
   const d = r.decision;
@@ -242,6 +278,16 @@ function exencionDocumentacion(
   };
 }
 
+/** TASK-103: el texto para el agente cuando la config no se puede leer. */
+function mensajeConfigInvalida(destino: string, error: ConfigError): string {
+  return [
+    `Merge bloqueado: entraria en "${destino}" y la configuracion del repositorio no se puede leer: ${textoDeConfigError(error)}`,
+    'Sin una configuracion valida no se sabe que verificacion exigir, asi que no se integra en develop, main ni master.',
+    'Corrige el fichero que nombra el error (taskctl doctor lo valida y dice como arreglarlo) y repite el merge,',
+    'o cierra la tarea con taskctl finish TASK-NNN. No integres por otra via para saltarte esta comprobacion.',
+  ].join('\n');
+}
+
 function mensaje(
   fuente: string,
   sha: string | null,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
index e59b212..7c3e46e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -208,7 +208,8 @@ test('comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consulta
     'bash scripts/merge-feature-to-develop.sh feature/x',
     'bash -c "git checkout develop && git merge x"',
     'git checkout -q develop && git switch --detach develop && git merge x',
-    'cd C:\repo && git merge x',
+    // NUE-3 de la revision de TASK-101: barra real (antes '\r' era un retorno de carro).
+    'cd C:\\repo && git merge x',
   ]) {
     assert.equal(comandoSoloIntegra(ok), true, ok);
   }
@@ -239,13 +240,16 @@ test('comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consulta
     'git checkout -fB docs code && git checkout develop && git merge docs',
     'git checkout -qB docs code && git checkout develop && git merge docs',
     'git checkout -Bdocs code && git checkout develop && git merge docs',
-    'git checkout -\B docs code && git checkout develop && git merge docs',
+    // NUE-3: barra real; '-\B' en TS es solo '-B'.
+    'git checkout -\\B docs code && git checkout develop && git merge docs',
     'git switch -fC docs code && git switch develop && git merge docs',
     'git switch -Cdocs code && git switch develop && git merge docs',
     'git switch --force-c docs code && git switch develop && git merge docs',
-    'git switch -\C docs code && git switch develop && git merge docs',
-    'bash -lc "git checkout -\B docs code && git checkout develop && git merge docs"',
+    'git switch -\\C docs code && git switch develop && git merge docs',
+    'bash -lc "git checkout -\\B docs code && git checkout develop && git merge docs"',
     "sh -c 'git checkout -fB docs code && git checkout develop && git merge docs'",
+    // NUE-3 (TASK-103): bash quita la barra y queda --output=...; solo lo para la comprobacion de barra.
+    'git log --outpu\\t=.git/refs/heads/docs && git merge docs',
     // NUE-2: un merge disfrazado con una opcion de --abort/--quit no cuenta en analizarComando.
     'git checkout docs && git merge -m --abort code && git checkout develop && git merge --no-ff docs',
     'git merge -m --quit code; git merge docs',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
index 15e7a23..0ab9aad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
@@ -12,7 +12,7 @@ import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
-import { analizarComando, segmentar } from '../../src/core/comando-merge.js';
+import { analizarComando, comandoSoloIntegra, segmentar } from '../../src/core/comando-merge.js';
 import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
 import { guardarMemo, huellaDeCommit, huellaDelArbol } from '../../src/fs/verificacion.js';
 import type { ResultadoVerificacion } from '../../src/core/informe-verificacion.js';
@@ -364,3 +364,145 @@ test('guardia: hooks.json declara el PreToolUse sin filtro if, en forma exec, si
   assert.doesNotMatch(JSON.stringify(j), /sonda/);
   assert.doesNotMatch(j.description, /taskcode|TASK-\d/i);
 });
+
+// ---------------------------------------------------------------------
+// TASK-103: config ilegible y merges que antes no se detectaban
+// ---------------------------------------------------------------------
+
+test('comando-merge (TASK-103, MEN-2): --abort/--quit/--continue/--skip como valor de -m no esconden el merge', () => {
+  for (const control of ['--abort', '--quit', '--continue', '--skip']) {
+    assert.deepEqual(analizarComando(`git merge -m ${control} x`), [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: null }], control);
+    assert.deepEqual(analizarComando(`git merge -F ${control} x`)[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null }, control);
+    // Como opcion, sigue sin ser un merge nuevo (tambien tras otra opcion con valor).
+    assert.deepEqual(analizarComando(`git merge ${control}`), [], control);
+    assert.deepEqual(analizarComando(`git merge -m msg ${control}`), [], control);
+  }
+  // Tras `--`, es una ref.
+  assert.deepEqual(analizarComando('git merge -- --abort'), [{ tipo: 'merge', fuentes: ['--abort'], destino: null, dir: null }]);
+});
+
+test('comando-merge (TASK-103): { ...; }, time y eval no esconden el merge', () => {
+  const merge = [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: null }];
+  for (const c of ['{ git merge x; }', 'time git merge x', 'time -p git merge x', 'eval git merge x', 'eval "git merge x"', '{ time git merge x; }']) {
+    assert.deepEqual(analizarComando(c), merge, c);
+  }
+  assert.deepEqual(analizarComando('eval "git checkout develop && git merge x"'), [
+    { tipo: 'merge', fuentes: ['x'], destino: 'develop', dir: null },
+  ]);
+  assert.deepEqual(analizarComando('eval'), []);
+  // Nunca reciben la exencion de solo documentacion (decision de Carlos en TASK-103).
+  for (const c of ['{ git merge x; }', 'time git merge x', 'eval git merge x', 'eval "git merge x"']) {
+    assert.equal(comandoSoloIntegra(c), false, c);
+  }
+  assert.equal(comandoSoloIntegra('git merge -m --abort x'), true, 'un solo merge con mensaje raro');
+});
+
+test('comando-merge (TASK-103): git checkout <x> solo cambia el destino si x es rama', () => {
+  const noEsFichero = (n: string) => n !== 'README.md';
+  assert.equal((analizarComando('git checkout README.md && git merge x', noEsFichero)[0] as { destino: null }).destino, null);
+  // El destino anterior se conserva.
+  assert.equal(
+    (analizarComando('git checkout develop && git checkout README.md && git merge x', noEsFichero)[0] as { destino: string }).destino,
+    'develop'
+  );
+  // Se propaga a bash -c y a eval.
+  assert.equal((analizarComando('bash -c "git checkout README.md && git merge x"', noEsFichero)[0] as { destino: null }).destino, null);
+  assert.equal((analizarComando('eval git checkout README.md && git merge x', noEsFichero)[0] as { destino: null }).destino, null);
+  // -b no consulta el predicado.
+  assert.equal((analizarComando('git checkout -b README.md && git merge x', () => false)[0] as { destino: string }).destino, 'README.md');
+  // Sin predicado, como antes.
+  assert.equal((analizarComando('git checkout README.md && git merge x')[0] as { destino: string }).destino, 'README.md');
+});
+
+const CONFIG_CLAVE_ANTIGUA = `comando_verificacion: "${COMANDO}"\nlimite_wip: cero\n`;
+const CONFIG_CLAVE_NUEVA = 'rutas_documentacion: ["**"]\n';
+
+test('guardia (TASK-103): con la config ilegible, un merge hacia develop, main o master bloquea y dice que arreglar', async () => {
+  for (const [config, clave] of [
+    [CONFIG_CLAVE_ANTIGUA, /limite_wip/],
+    [CONFIG_CLAVE_NUEVA, /rutas_documentacion/],
+  ] as const) {
+    await conRepo(async ({ raiz }) => {
+      git(['branch', 'master', 'main'], raiz);
+      for (const destino of ['develop', 'main', 'master']) {
+        const d = decide(raiz, `git checkout ${destino} && git merge --no-ff ${RAMA}`);
+        assert.equal(d.codigo, 2, `${destino} ${String(clave)}`);
+        assert.match(d.stderr, new RegExp(`Merge bloqueado: entraria en "${destino}" y la configuracion del repositorio no se puede leer`));
+        assert.match(d.stderr, clave, 'nombra el error');
+        assert.match(d.stderr, /config\.yml/, 'nombra el fichero');
+        assert.match(d.stderr, /taskctl doctor/);
+        assert.match(d.stderr, /taskctl finish TASK-NNN/);
+        assert.doesNotMatch(d.stderr, /\[ERROR\]/);
+      }
+      // Estando ya en develop, los scripts de cierre y un merge que no aporta nada: siempre bloquea.
+      git(['checkout', '-q', 'develop'], raiz);
+      assert.equal(decide(raiz, `git merge ${RAMA}`).codigo, 2);
+      assert.equal(decide(raiz, 'git merge main').codigo, 2, 'main ya es ancestro de develop: bloquea igual');
+      assert.equal(decide(raiz, `bash scripts/gitflow/merge-feature-to-develop.sh ${RAMA}`).codigo, 2);
+      assert.equal(decide(raiz, `bash scripts/gitflow/merge-hotfix-to-main.sh ${RAMA}`).codigo, 2);
+    }, config);
+  }
+});
+
+test('guardia (TASK-103): con la config ilegible, hacia otra rama deja pasar, como antes', async () => {
+  for (const config of [CONFIG_CLAVE_ANTIGUA, CONFIG_CLAVE_NUEVA]) {
+    await conRepo(async ({ raiz }) => {
+      assert.deepEqual(decide(raiz, 'git merge develop'), { codigo: 0, stderr: '' }, 'en la rama de trabajo');
+      assert.deepEqual(decide(raiz, `git checkout -b otra develop && git merge ${RAMA}`), { codigo: 0, stderr: '' });
+      git(['branch', 'integ', 'develop'], raiz);
+      assert.deepEqual(decide(raiz, `git checkout integ && git merge ${RAMA}`), { codigo: 0, stderr: '' }, 'lista fija: integ no esta');
+      assert.deepEqual(decide(raiz, 'git status'), { codigo: 0, stderr: '' });
+    }, config);
+  }
+});
+
+test('guardia (TASK-103): sin fichero de config deja pasar, como antes', async () => {
+  await conRepo(async ({ raiz }) => {
+    await rm(path.join(raiz, '.taskcode', 'config.yml'));
+    assert.deepEqual(decide(raiz, `git checkout develop && git merge ${RAMA}`), { codigo: 0, stderr: '' });
+    await rm(path.join(raiz, '.taskcode'), { recursive: true });
+    assert.deepEqual(decide(raiz, `git checkout develop && git merge ${RAMA}`), { codigo: 0, stderr: '' });
+  });
+});
+
+test('guardia (TASK-103): el hook real evalua los merges que antes no detectaba', async () => {
+  await conRepo(async ({ raiz }) => {
+    git(['checkout', '-q', 'develop'], raiz);
+    const lanzar = (command: string) =>
+      spawnSync(process.execPath, [ENTRADA_HOOK], {
+        input: JSON.stringify({ cwd: raiz, tool_name: 'Bash', tool_input: { command }, hook_event_name: 'PreToolUse' }),
+        encoding: 'utf8',
+      });
+    for (const c of [
+      `git merge -m --abort ${RAMA}`,
+      `git merge -m --quit ${RAMA}`,
+      `git merge -m --continue ${RAMA}`,
+      `git merge -m --skip ${RAMA}`,
+      `{ git merge ${RAMA}; }`,
+      `time git merge ${RAMA}`,
+      `eval git merge ${RAMA}`,
+      // README.md es un fichero versionado, no una rama: el destino sigue siendo develop.
+      `git checkout README.md && git merge ${RAMA}`,
+    ]) {
+      const r = lanzar(c);
+      assert.equal(r.status, 2, c);
+      assert.match(r.stderr, /Merge bloqueado: "feature\/task-900-trabajo" \([0-9a-f]{10}\) entraria en "develop"/, c);
+    }
+    // Una rama de verdad si cambia el destino.
+    assert.equal(lanzar(`git checkout ${RAMA} && git merge develop`).status, 0);
+    // Y la que solo existe en origin (DWIM de git checkout).
+    git(['update-ref', 'refs/remotes/origin/remota', RAMA], raiz);
+    assert.equal(lanzar('git checkout remota && git merge develop').status, 0);
+  });
+});
+
+test('guardia (TASK-103): el hook real con la config ilegible bloquea con su mensaje', async () => {
+  await conRepo(async ({ raiz }) => {
+    const r = spawnSync(process.execPath, [ENTRADA_HOOK], {
+      input: JSON.stringify({ cwd: raiz, tool_name: 'Bash', tool_input: { command: `git checkout develop && git merge ${RAMA}` } }),
+      encoding: 'utf8',
+    });
+    assert.equal(r.status, 2);
+    assert.match(r.stderr, /la configuracion del repositorio no se puede leer/);
+  }, CONFIG_CLAVE_ANTIGUA);
+});
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-103/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-103/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-103/tarea.md                                    |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js               | 69 +++++++++++++++++++++++++++++++++++++++++++++++++++++++--------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js              | 62 +++++++++++++++++++++++++++++++++++++++++++++++++++-----------
 5 files changed, 112 insertions(+), 26 deletions(-)
````
