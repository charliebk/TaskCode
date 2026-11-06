# Peticion de revision — TASK-076 (ronda 2)

- Tarea: TASK-076 — Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico
- Rama revisada: fix/task-076-doctor-avisa-de-hooks-pretooluse-sobre-a
- Rama base: develop
- Commit revisado (HEAD): a35717aed117def8f12035bf6da7841af17d87de
- Fecha: 2026-11-06
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-076 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde c85d64106bf9e8619a3af3b7e44e6721f5913120 (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | src/core/hooks-subagente.ts (regex anclada; matcher con espacios alrededor de `\ | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/core/hooks-subagente.ts (`.trim()` interno de `porNombres` inalcanzable) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/fs/sondas-hooks-claude.ts (sin `disableAllHooks`, sin managed settings) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/commands/doctor.ts (`sin leer` solo en el `ok`) | informe-revision-1.md |
| MEN-5 | MENOR | abierto | test/commands/doctor-correcciones.test.ts (lee el `~/.claude` real) | informe-revision-1.md |

## Commits a revisar (git log c85d64106bf9e8619a3af3b7e44e6721f5913120..HEAD)

````
a35717a fix(TASK-076): correcciones de la ronda 1 (MEN-1 a MEN-5)
e561b08 chore(TASK-076): veredicto ronda 1 (cambios-solicitados)
506f6b1 chore(TASK-076): coste revision +2239009 tokens (1 agente)
6e71fb1 chore(TASK-076): informe de revision ronda 1
888589c chore(TASK-076): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff c85d64106bf9e8619a3af3b7e44e6721f5913120..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 025a424..0cf87d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -566,9 +566,15 @@ export function comprobarHooksSubagente(deps: DoctorCommandDeps): Comprobacion[]
       ARREGLO_HOOKS_SUBAGENTE
     )
   );
+  if (s.hooksDesactivadosEn !== null) {
+    return [ok('hooks-subagente', una(`los hooks estan desactivados (disableAllHooks en ${s.hooksDesactivadosEn})`))];
+  }
+  const nota = s.ilegibles.length === 0 ? '' : `; sin leer: ${s.ilegibles.join('; ')}`;
   if (cs.length === 0) {
-    const nota = s.ilegibles.length === 0 ? '' : `; sin leer: ${s.ilegibles.join('; ')}`;
     cs.push(ok('hooks-subagente', una(`ningun hook PreToolUse alcanza a Agent/Task (${s.leidos} ficheros leidos${nota})`)));
+  } else if (nota !== '') {
+    // Con avisos, los ilegibles se siguen nombrando (revision ronda 1, MEN-4); no son un aviso mas.
+    cs.push(omitida('hooks-subagente', una(`ficheros sin leer al buscar hooks${nota.replace(/^;/, ':')}`)));
   }
   return cs;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
index 55d65e0..5addf24 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
@@ -7,7 +7,8 @@
  *
  * Semantica del matcher (plan de TASK-076, Carlos 2026-11-06):
  * - `""`, `"*"` o sin matcher: alcanza a todas las herramientas, cuenta.
- * - Solo letras, digitos, `_` y `|`: lista de nombres exactos separada por `|`.
+ * - Solo letras, digitos, `_` y `|` (tras quitar los espacios alrededor de
+ *   cada `|`): lista de nombres exactos separada por `|`.
  * - Cualquier otra cosa: regex anclada (`^(?:...)$`); si no compila, se parte
  *   por `|` y se compara literal.
  */
@@ -25,7 +26,7 @@ export interface HallazgoHook {
 }
 
 function porNombres(matcher: string): boolean {
-  const nombres = matcher.split('|').map((n) => n.trim());
+  const nombres = matcher.split('|');
   return HERRAMIENTAS_SUBAGENTE.some((h) => nombres.includes(h));
 }
 
@@ -33,7 +34,11 @@ function porNombres(matcher: string): boolean {
 export function matcherAlcanzaSubagente(matcher: unknown): boolean {
   if (matcher === undefined || matcher === null) return true;
   if (typeof matcher !== 'string') return false;
-  const m = matcher.trim();
+  // Sin espacios alrededor de cada `|`: "Bash | Agent" es la lista Bash, Agent (revision ronda 1, MEN-1).
+  const m = matcher
+    .split('|')
+    .map((n) => n.trim())
+    .join('|');
   if (m === '' || m === '*') return true;
   if (/^[A-Za-z0-9_|]+$/.test(m)) return porNombres(m);
   let re: RegExp;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts
index d3f3c12..3552894 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts
@@ -23,6 +23,8 @@ export interface SondeoHooks {
   leidos: number;
   /** `ruta: motivo` de los que existen pero no se pudieron leer o parsear. */
   ilegibles: string[];
+  /** Settings con `"disableAllHooks": true`: ningun hook corre, no hay hallazgos. */
+  hooksDesactivadosEn: string | null;
 }
 
 type Lectura = { estado: 'ausente' } | { estado: 'ok'; json: unknown } | { estado: 'ilegible'; motivo: string };
@@ -47,7 +49,7 @@ function mismaRuta(a: string, b: string): boolean {
 }
 
 export function sondearHooksClaude(configDir: string, repoCwd: string): SondeoHooks {
-  const r: SondeoHooks = { hallazgos: [], leidos: 0, ilegibles: [] };
+  const r: SondeoHooks = { hallazgos: [], leidos: 0, ilegibles: [], hooksDesactivadosEn: null };
 
   const leer = (ruta: string): unknown => {
     const l = leerJson(ruta);
@@ -70,6 +72,13 @@ export function sondearHooksClaude(configDir: string, repoCwd: string): SondeoHo
   const usuario = leer(rutaUsuario);
   const proyecto = leer(rutaProyecto);
   const local = leer(rutaLocal);
+  // `disableAllHooks` en cualquiera de los settings apaga todos los hooks (revision ronda 1, MEN-3).
+  for (const [s, ruta] of [[local, rutaLocal], [proyecto, rutaProyecto], [usuario, rutaUsuario]] as const) {
+    if (esObjeto(s) && s['disableAllHooks'] === true) {
+      r.hooksDesactivadosEn = ruta;
+      return r;
+    }
+  }
   examinar(usuario, 'settings de usuario', rutaUsuario);
   examinar(proyecto, 'settings del proyecto', rutaProyecto);
   examinar(local, 'settings locales del proyecto', rutaLocal);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-correcciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-correcciones.test.ts
index 2eef9a0..7d70fff 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-correcciones.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-correcciones.test.ts
@@ -6,6 +6,7 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { mkdir, readFile, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { runDoctorCommand } from '../../src/commands/doctor.js';
 import { NODE_MINIMO, nodeSoportado, type Comprobacion } from '../../src/core/doctor.js';
@@ -14,6 +15,8 @@ import { git } from '../helpers/finish-fixtures.js';
 import { plantillaRepo } from '../helpers/repo-plantilla.js';
 
 const PLUGIN_ROOT = path.join(import.meta.dirname, '..', '..', '..');
+/** Config de Claude Code que no existe: los hooks de la maquina no entran en estos tests (TASK-076, MEN-5). */
+const SIN_CONFIG_CLAUDE = path.join(tmpdir(), 'taskctl-doctor-sin-config-claude-no-existe');
 
 const conRepo = plantillaRepo('taskctl-doctor-corr-', async (repoRoot) => {
   git(['init', '-q', '-b', 'main'], repoRoot);
@@ -44,7 +47,7 @@ test('config invalida: lo que depende de la config sale omitido, no ok con los v
   await conRepo(async (repoRoot) => {
     // rama_base valida pero distinta de develop, y un valor invalido en otra clave.
     await config(repoRoot, 'rama_base: dev\nmodo_flujo: xx\n');
-    const r = runDoctorCommand([], { repoCwd: repoRoot });
+    const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE });
     assert.equal(por(r.comprobaciones, 'config').nivel, 'error');
     const base = por(r.comprobaciones, 'rama-base');
     assert.equal(base.nivel, 'omitida');
@@ -60,7 +63,7 @@ test('config invalida: lo que depende de la config sale omitido, no ok con los v
 test('config invalida y sin origin: origin se omite (no se sabe si hace falta), no es aviso ni error por defecto', async () => {
   await conRepo(async (repoRoot) => {
     await config(repoRoot, 'cierre_por_defecto: merge-request\nlimite_wip: abc\n');
-    const o = por(runDoctorCommand([], { repoCwd: repoRoot }).comprobaciones, 'origin');
+    const o = por(runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE }).comprobaciones, 'origin');
     assert.equal(o.nivel, 'omitida');
     assert.match(o.mensaje, /config invalida/);
   });
@@ -70,13 +73,13 @@ test('config invalida y sin origin: origin se omite (no se sabe si hace falta),
 test('el mensaje de la config no repite el prefijo [ERROR] / [AVISO], ni en texto ni en JSON', async () => {
   await conRepo(async (repoRoot) => {
     await config(repoRoot, 'limite_wip: abc\n');
-    const r = runDoctorCommand([], { repoCwd: repoRoot });
+    const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE });
     assert.doesNotMatch(r.salida, /\[ERROR\][^\n]*\[ERROR\]/);
     assert.match(por(r.comprobaciones, 'config').mensaje, /^[^[]/);
-    const j = JSON.parse(runDoctorCommand(['--json'], { repoCwd: repoRoot }).salida) as { comprobaciones: Comprobacion[] };
+    const j = JSON.parse(runDoctorCommand(['--json'], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE }).salida) as { comprobaciones: Comprobacion[] };
     assert.doesNotMatch(por(j.comprobaciones, 'config').mensaje, /^\[(ERROR|AVISO)\]/);
     await config(repoRoot, 'clave_rara: 1\n');
-    const a = runDoctorCommand([], { repoCwd: repoRoot });
+    const a = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE });
     assert.doesNotMatch(a.salida, /\[AVISO\][^\n]*\[AVISO\]/);
     assert.doesNotMatch(por(a.comprobaciones, 'config-claves').mensaje, /^\[AVISO\]/);
     assert.match(por(a.comprobaciones, 'config-claves').mensaje, /clave_rara/);
@@ -103,7 +106,7 @@ test('git status que no responde a tiempo es aviso, no error (timeout propio)',
     // Un fsmonitor que tarda 30 s: git status se queda esperando al hook.
     git(['config', 'core.fsmonitor', 'sleep 30 #'], repoRoot);
     const t0 = Date.now();
-    const r = runDoctorCommand([], { repoCwd: repoRoot, timeoutGitMs: 1500 });
+    const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE, timeoutGitMs: 1500 });
     const w = por(r.comprobaciones, 'workspace');
     if (Date.now() - t0 > 25_000) return t.skip('esta version de Git no espera al hook de fsmonitor');
     assert.equal(w.nivel, 'aviso', `${w.nivel}: ${w.mensaje}`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
index c7a840c..2732c67 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
@@ -194,6 +194,39 @@ test('JSON roto o installed_plugins.json con formato desconocido: no es error, s
   });
 });
 
+test('disableAllHooks en cualquiera de los settings: ok que lo dice, sin avisos (revision ronda 1, MEN-3)', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT);
+      await escribirJson(path.join(config, 'settings.json'), { hooks: { PreToolUse: [{ matcher: 'Agent' }] } });
+      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['aviso', 'aviso']);
+      const local = path.join(repoRoot, '.claude', 'settings.local.json');
+      await escribirJson(local, { disableAllHooks: true });
+      const cs = hooks(repoRoot, config);
+      assert.deepEqual(cs.map((c) => c.nivel), ['ok']);
+      assert.ok(cs[0]?.mensaje.includes('disableAllHooks') && cs[0].mensaje.includes(local), cs[0]?.mensaje);
+      await escribirJson(local, { disableAllHooks: false });
+      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['aviso', 'aviso']);
+    });
+  });
+});
+
+test('con avisos, los ficheros ilegibles se siguen nombrando en una omitida (revision ronda 1, MEN-4)', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT);
+      const roto = path.join(repoRoot, '.claude', 'settings.json');
+      await mkdir(path.dirname(roto), { recursive: true });
+      await writeFile(roto, '{ roto', 'utf8');
+      const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config });
+      const cs = r.comprobaciones.filter((c) => c.id === 'hooks-subagente');
+      assert.deepEqual(cs.map((c) => c.nivel), ['aviso', 'omitida']);
+      assert.ok(cs[1]?.mensaje.startsWith('ficheros sin leer al buscar hooks: ') && cs[1].mensaje.includes(roto), cs[1]?.mensaje);
+      assert.equal(r.codigo, 0);
+    });
+  });
+});
+
 test('CLI --json: el aviso lleva el id estable hooks-subagente, nivel aviso y arreglo; codigo 0', async () => {
   await conRepo(async (repoRoot) => {
     await conConfig(async (config) => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/hooks-subagente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/hooks-subagente.test.ts
index c1446e8..07b4d73 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/hooks-subagente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/hooks-subagente.test.ts
@@ -15,6 +15,15 @@ test('matcher: nombres exactos y listas con |', () => {
   }
 });
 
+test('matcher: espacios alrededor de | no esconden el nombre (revision ronda 1, MEN-1)', () => {
+  assert.equal(matcherAlcanzaSubagente('Bash | Agent'), true);
+  assert.equal(matcherAlcanzaSubagente(' Read |Task '), true);
+  assert.equal(matcherAlcanzaSubagente('Bash | Read'), false);
+  assert.equal(matcherAlcanzaSubagente('   '), true); // equivale a vacio
+  assert.equal(matcherAlcanzaSubagente('(Agent | Task)'), true);
+  assert.equal(matcherAlcanzaSubagente('Ag'), false); // regex anclada, decision del plan (aceptado en ronda 1)
+});
+
 test('matcher: vacio, * o ausente alcanzan a todo; un no-string no', () => {
   assert.equal(matcherAlcanzaSubagente(''), true);
   assert.equal(matcherAlcanzaSubagente('*'), true);
````

## Excluido del diff (8 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff c85d64106bf9e8619a3af3b7e44e6721f5913120..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-076/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-076/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-076/revision/informe-revision-1.md                               |  68 ++++++++
 tareas/03-en-revision/TASK-076/revision/peticion-revision-1.md                              | 887 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-076/tarea.md                                    |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                    |   9 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/hooks-subagente.js               |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-hooks-claude.js             |   9 +-
 8 files changed, 983 insertions(+), 7 deletions(-)
````
