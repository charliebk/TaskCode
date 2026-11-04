# Peticion de revision — TASK-071 (ronda 2)

- Tarea: TASK-071 — Hook Stop: una tarea no se da por hecha con la verificacion en rojo
- Rama revisada: feature/task-071-hook-stop-una-tarea-no-se-da-por-hecha-c
- Rama base: develop
- Commit revisado (HEAD): ec2295ffcdcf53be7eb58e166e753f4592c447aa
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-071 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 0d3db851465d9dc230ba15139e7ce1667ddc4f57 (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | test/hooks/freno-stop.test.ts (test de memo) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | src/hooks/freno-stop.ts (cota del timeout) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/fs/verificacion.ts (bytesTotales en `cortada`) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/hooks/freno-stop.ts (tareas ilegibles) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | CHANGELOG.md («sin credenciales») | informe-revision-1.md |
| MEN-4 | MENOR | abierto | README.md (ignorados no invalidan el memo) | informe-revision-1.md |
| MEN-5 | MENOR | abierto | src/core/informe-verificacion.ts (`codigo null` en `roja`) | informe-revision-1.md |
| MEN-6 | MENOR | abierto | CHANGELOG.md («sin cambio de comportamiento») | informe-revision-1.md |
| MEN-7 | MENOR | abierto | test/hooks/freno-stop.test.ts (UTF-8, version del memo, aviso de arbol) | informe-revision-1.md |

## Commits a revisar (git log 0d3db851465d9dc230ba15139e7ce1667ddc4f57..HEAD)

````
ec2295f fix(TASK-071): correcciones de la revision ronda 1 (IMP-1, IMP-2, MEN-1..7)
cc8e8df chore(TASK-071): veredicto ronda 1 (cambios-solicitados)
c4079d9 chore(TASK-071): coste revision +3100392 tokens (1 agente)
0dc2e8a chore(TASK-071): informe de revision ronda 1
2b2c634 chore(TASK-071): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 0d3db851465d9dc230ba15139e7ce1667ddc4f57..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index f8ed9b1..28b75e2 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -18,11 +18,13 @@ verificacion en rojo.
   hook sale 0 sin lanzar ningun proceso. Se apaga con `FRENO_VERIFICACION=0`.
 - En rojo (o cortada, o config invalida) sale con 2 y le devuelve el turno al agente con el
   comando, el codigo, la duracion y el final de la salida (40 lineas / 4 KiB, sin ANSI ni
-  credenciales). Un solo disparo por turno (`stop_hook_active`).
+  credenciales en URLs; otros secretos que imprima el comando no se filtran). Un solo disparo
+  por turno (`stop_hook_active`).
 - Memo por huella del arbol en `.git/freno-verificacion.json`: sin cambios, no se vuelve a
   ejecutar la suite. Tope de 3540 s por debajo del `timeout` de 3600 s del hook.
 - El envoltorio que ejecuta comandos con tope y mata el arbol pasa a
-  `fs/ejecucion-acotada.ts`, compartido con la sincronizacion (sin cambio de comportamiento).
+  `fs/ejecucion-acotada.ts`, compartido con la sincronizacion. Unico cambio: al cortar por
+  timeout deja de reenviar la salida del comando, para que la marca del corte sea lo ultimo.
 - El `PreToolUse` sigue siendo la sonda inerte de TASK-069 hasta TASK-072.
 
 Comando de verificacion declarado (TASK-070), primer paso de los frenos de verificacion.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 02af52b..a649a12 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -607,7 +607,12 @@ caso sale 0 sin lanzar ningún proceso (ni `git`). Cuando actúa:
   (HEAD, comando, timeout y contenido de lo que no está limpio) en
   `.git/freno-verificacion.json`. Con la misma huella no se vuelve a ejecutar:
   un verde deja terminar y un rojo repite el informe, diciendo que es el
-  guardado. Cualquier cambio en el árbol lo invalida.
+  guardado. Cualquier cambio en el árbol lo invalida, salvo en ficheros
+  ignorados por `.gitignore` (la huella sale de `git status`): si lo único que
+  cambia es un ignorado (`.env.local`), cambia algo versionado o ejecuta el
+  comando a mano.
+- Una tarea de `02-en-curso` con el `tarea.md` ilegible no frena (no se sabe si
+  es la de esta rama), pero el hook la nombra en un aviso.
 - **Tope**: el `timeout` del hook es 3600 s, y Claude Code descarta la salida
   de un hook que lo agota (el freno no frenaría). Por eso la verificación se
   corta a `min(timeout_verificacion, 3540)` s, avisando si se recorta.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
index 42f7f39..1226980 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
@@ -70,7 +70,9 @@ export function describirResultado(r: ResultadoVerificacion): string {
     case 'verde':
       return 'salio con codigo 0';
     case 'roja':
-      return `salio con codigo ${String(r.codigo)}`;
+      return r.codigo === null
+        ? `termino de forma anormal${r.error === undefined ? '' : ` (${r.error})`}`
+        : `salio con codigo ${String(r.codigo)}`;
     case 'cortada':
       return `no termino en ${String(r.timeoutS)} s y se ha cortado (con todos sus procesos)`;
     case 'no-lanzable':
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index 711f20b..9810933 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -49,8 +49,11 @@ export function ejecutarVerificacion(
     bytesTotales: r.bytesTotales,
   };
   if (fueCortado(r)) {
-    const cola = r.salida.endsWith(MARCA_TIMEOUT) ? r.salida.slice(0, -MARCA_TIMEOUT.length) : r.salida;
-    return { ...base, estado: 'cortada', codigo: null, cola };
+    // La marca es del envoltorio, no del comando: fuera de la cola y de la cuenta de bytes.
+    const conMarca = r.salida.endsWith(MARCA_TIMEOUT);
+    const cola = conMarca ? r.salida.slice(0, -MARCA_TIMEOUT.length) : r.salida;
+    const bytesTotales = conMarca ? Math.max(0, r.bytesTotales - Buffer.byteLength(MARCA_TIMEOUT)) : r.bytesTotales;
+    return { ...base, bytesTotales, estado: 'cortada', codigo: null, cola };
   }
   if (r.error !== undefined) {
     return { ...base, estado: 'no-lanzable', codigo: null, cola: r.salida, error: r.error.message };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index 96bb811..751e016 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -63,6 +63,18 @@ export interface DepsFreno {
 
 const DEJAR_PARAR: DecisionStop = Object.freeze({ codigo: 0, stderr: '' });
 
+/**
+ * Segundos que se le dan a la verificacion: `timeout_verificacion`, pero nunca
+ * mas que el `timeout` del hook menos el margen. Si el hook agotara el suyo,
+ * Claude Code descartaria el informe y el freno fallaria abierto.
+ */
+export function timeoutEfectivoS(timeoutVerificacion: number): { timeoutS: number; recortado: boolean } {
+  const techo = TECHO_HOOK_S - MARGEN_HOOK_S;
+  return timeoutVerificacion > techo
+    ? { timeoutS: techo, recortado: true }
+    : { timeoutS: timeoutVerificacion, recortado: false };
+}
+
 /** El directorio de tareas en curso, si existe. Sin procesos. */
 function carpetaEnCurso(raiz: string): string | null {
   const dir = path.join(raiz, 'tareas', '02-en-curso');
@@ -97,10 +109,21 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
     raiz = raizDelRepo(entrada.cwd);
     const dir = carpetaEnCurso(raiz);
     if (dir === null) return DEJAR_PARAR;
-    const { tareas } = await listTareasEnEstados(path.join(raiz, 'tareas'), ['en-curso']);
+    const { tareas, ilegibles } = await listTareasEnEstados(path.join(raiz, 'tareas'), ['en-curso']);
     const ramas = new Set(tareas.map((t) => t.task.rama).filter((r): r is string => typeof r === 'string' && r !== ''));
     ids = tareas.map((t) => t.task.id);
-    if (ramas.size === 0) return DEJAR_PARAR;
+    if (ramas.size === 0 && ilegibles.length === 0) return DEJAR_PARAR;
+    // Una tarea en curso ilegible podria ser la de esta rama: el freno no la
+    // ve. No se bloquea (no se sabe si aplica), pero tampoco se calla.
+    const sinLeer: DecisionStop =
+      ilegibles.length === 0
+        ? DEJAR_PARAR
+        : {
+            codigo: 0,
+            stderr:
+              `Aviso: no se pudo leer ${ilegibles.map((f) => path.relative(raiz, f)).join(', ')}. Si es la tarea ` +
+              'en curso de esta rama, el freno de verificacion no la ve: corrige su frontmatter.',
+          };
 
     // 5: un readFile.
     try {
@@ -113,7 +136,7 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
 
     // 6: el unico git hasta aqui.
     rama = ramaActual(raiz);
-    if (rama === null || !ramas.has(rama)) return DEJAR_PARAR;
+    if (rama === null || !ramas.has(rama)) return sinLeer;
     ids = tareas.filter((t) => t.task.rama === rama).map((t) => t.task.id);
   } catch {
     // Algo inesperado ANTES de saber si el freno aplica (tareas ilegibles,
@@ -134,13 +157,12 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       };
     }
     const comando = config.comando_verificacion as string;
-    const techo = TECHO_HOOK_S - MARGEN_HOOK_S;
-    const timeoutS = Math.min(config.timeout_verificacion, techo);
+    const { timeoutS, recortado } = timeoutEfectivoS(config.timeout_verificacion);
     const avisos: string[] = [];
-    if (config.timeout_verificacion > techo) {
+    if (recortado) {
       avisos.push(
         `timeout_verificacion pide ${String(config.timeout_verificacion)} s, pero este freno tiene un tope de ` +
-          `${String(techo)} s: se ha usado el tope.`
+          `${String(timeoutS)} s: se ha usado el tope.`
       );
     }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
index 2fd1290..a549cf6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
@@ -16,7 +16,8 @@ import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
-import { decidirStop, MARGEN_HOOK_S, TECHO_HOOK_S, parsearEntrada } from '../../src/hooks/freno-stop.js';
+import { decidirStop, MARGEN_HOOK_S, TECHO_HOOK_S, parsearEntrada, timeoutEfectivoS } from '../../src/hooks/freno-stop.js';
+import { describirResultado, recortarCola, type ResultadoVerificacion } from '../../src/core/informe-verificacion.js';
 import { serializeTareaFile } from '../../src/core/tarea-file.js';
 import { git, sampleTask } from '../helpers/finish-fixtures.js';
 
@@ -24,13 +25,15 @@ const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
 const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'stop-verificacion.js');
 const RAMA = 'feature/task-071-freno';
 
-/** Lo que hace el script segun el fichero de desenlace: ok, ko, lento, ruido. */
+/** Lo que hace el script segun el fichero de desenlace: ok, ko, lento, lento-hablando, ensucia, ruido. */
 const SCRIPT = `
 const fs = require('node:fs');
 const d = fs.readFileSync(process.env.VERIF_DESENLACE, 'utf8').trim();
 fs.appendFileSync(process.env.VERIF_DESENLACE + '.cuenta', 'x');
 if (d === 'ok') { console.log('todo en verde'); process.exit(0); }
 if (d === 'lento') { setTimeout(() => {}, 60000); }
+else if (d === 'lento-hablando') { console.log('hola'); setTimeout(() => {}, 60000); }
+else if (d === 'ensucia') { fs.writeFileSync('cobertura.txt', String(Date.now())); process.exit(1); }
 else if (d === 'ruido') {
   for (let i = 0; i < 5000; i++) console.log('\\u001b[31mlinea ' + i + ' con ñ y € y emoji 🚀\\u001b[0m');
   console.error('fallo final: https://usuario:secreto@git.example.com/repo.git');
@@ -253,6 +256,17 @@ test('freno: memo por huella — mismo arbol no vuelve a ejecutar, un cambio si'
       assert.equal(r.ejecuciones(), 2, 'rojo memorizado');
       assert.match(otra.stderr, /resultado guardado de la ultima verificacion/);
       assert.match(otra.stderr, /salio con codigo 3/);
+      // IMP-1: misma ruta sucia con OTRO contenido tambien invalida el memo
+      // (la huella mira el contenido, no solo la lista de rutas).
+      await writeFile(path.join(r.raiz, 'nuevo.txt'), 'contenido distinto', 'utf8');
+      assert.equal((await decidir(r)).codigo, 0);
+      assert.equal(r.ejecuciones(), 3, 'el cambio de contenido reejecuta');
+      // MEN-7: un memo de otra version no se reutiliza.
+      const rutaMemo = path.join(r.raiz, '.git', 'freno-verificacion.json');
+      const memo = JSON.parse(readFileSync(rutaMemo, 'utf8')) as { version: number };
+      await writeFile(rutaMemo, JSON.stringify({ ...memo, version: 0 }), 'utf8');
+      assert.equal((await decidir(r)).codigo, 0);
+      assert.equal(r.ejecuciones(), 4, 'memo de otra version ignorado');
       // El memo no ensucia el arbol: vive bajo .git/.
       assert.equal(git(['status', '--porcelain', '--', '.taskcode', 'tareas', 'scripts'], r.raiz), '');
       assert.ok(existsSync(path.join(r.raiz, '.git', 'freno-verificacion.json')));
@@ -311,3 +325,72 @@ test('freno: hooks.json declara el Stop en forma exec, con el tope que usa el co
   assert.ok(existsSync(ENTRADA_HOOK), 'el punto de entrada existe compilado en dist/src');
   assert.doesNotMatch(j.description, /taskcode|TASK-\d/i);
 });
+
+test('freno (IMP-2): el timeout efectivo nunca supera el tope del hook menos el margen', () => {
+  assert.equal(TECHO_HOOK_S - MARGEN_HOOK_S, 3540, 'con 3600 s de hook quedan 60 s para escribir el informe');
+  assert.deepEqual(timeoutEfectivoS(99999), { timeoutS: 3540, recortado: true });
+  assert.deepEqual(timeoutEfectivoS(3541), { timeoutS: 3540, recortado: true });
+  assert.deepEqual(timeoutEfectivoS(3540), { timeoutS: 3540, recortado: false });
+  assert.deepEqual(timeoutEfectivoS(600), { timeoutS: 600, recortado: false });
+  assert.deepEqual(timeoutEfectivoS(1), { timeoutS: 1, recortado: false });
+});
+
+test('freno (MEN-1): un corte con salida corta no se rotula como truncado', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      await writeFile(r.desenlace, 'lento-hablando', 'utf8');
+      const d = await decidir(r, {}, { timeoutMs: 1500 });
+      assert.equal(d.codigo, 2);
+      assert.match(d.stderr, /se ha cortado/);
+      assert.match(d.stderr, /Salida:\n {4}hola/);
+      assert.doesNotMatch(d.stderr, /truncada/);
+    })
+  );
+});
+
+test('freno (MEN-2): una tarea en curso ilegible no frena, pero se avisa', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      await writeFile(r.desenlace, 'ko', 'utf8');
+      await writeFile(path.join(r.raiz, 'tareas', '02-en-curso', 'TASK-071', 'tarea.md'), '---\nid: [\n---\n', 'utf8');
+      const d = await decidir(r);
+      assert.equal(d.codigo, 0);
+      assert.match(d.stderr, /no se pudo leer tareas[\\/]02-en-curso[\\/]TASK-071[\\/]tarea\.md/);
+      assert.equal(r.ejecuciones(), 0);
+    })
+  );
+});
+
+test('freno (MEN-7): si la propia verificacion ensucia el arbol, el informe lo avisa', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      await writeFile(r.desenlace, 'ensucia', 'utf8');
+      const d = await decidir(r);
+      assert.equal(d.codigo, 2);
+      assert.match(d.stderr, /La propia verificacion ha cambiado ficheros del arbol de trabajo/);
+    })
+  );
+});
+
+test('informe (MEN-7): recortarCola no parte caracteres multibyte en una linea larga', () => {
+  const { texto, recortada } = recortarCola('€'.repeat(3000), 4096, 40);
+  assert.equal(recortada, true);
+  assert.ok(!texto.includes('�'), 'sin caracteres partidos');
+  assert.ok(Buffer.byteLength(texto, 'utf8') <= 4096);
+  assert.equal(Buffer.byteLength(texto, 'utf8') % 3, 0, 'solo euros enteros');
+});
+
+test('informe (MEN-5): una muerte sin codigo no se describe como «codigo null»', () => {
+  const base: ResultadoVerificacion = {
+    estado: 'roja',
+    comando: 'x',
+    codigo: null,
+    duracionMs: 1,
+    timeoutS: 1,
+    cola: '',
+    bytesTotales: 0,
+    error: 'senal SIGKILL',
+  };
+  assert.equal(describirResultado(base), 'termino de forma anormal (senal SIGKILL)');
+  assert.equal(describirResultado({ ...base, codigo: 1 }), 'salio con codigo 1');
+});
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 0d3db851465d9dc230ba15139e7ce1667ddc4f57..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-071/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-071/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-071/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-071/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-071/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-071/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-071/revision/informe-revision-1.md                                                  |  103 ++++++
 tareas/03-en-revision/TASK-071/revision/peticion-revision-1.md                                                 | 1490 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-071/tarea.md                                                       |    6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-verificacion.js                             |    4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                       |    7 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                      |   33 +-
 12 files changed, 1631 insertions(+), 12 deletions(-)
````
