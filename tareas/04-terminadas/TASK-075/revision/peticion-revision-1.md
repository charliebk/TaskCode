# Peticion de revision — TASK-075 (ronda 1)

- Tarea: TASK-075 — Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+
- Rama revisada: fix/task-075-contrapruebas-de-descubrimiento-rotas-po
- Rama base: develop
- Commit revisado (HEAD): b2f8dca9671670b3112e669cb053595e431b43fd
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-075 (criterios de aceptacion y plan)

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
b2f8dca fix(TASK-075): el validador de plugins ya no se juzga buscando la cruz en toda la salida
5ee377e chore(TASK-075): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/contexto/HALLAZGOS.md b/docs/contexto/HALLAZGOS.md
index 68e5c06..0cf1829 100644
--- a/docs/contexto/HALLAZGOS.md
+++ b/docs/contexto/HALLAZGOS.md
@@ -706,6 +706,19 @@ y las aserciones estructurales propias son la única red real. La contraprueba
 (romper una copia y ver que la nombra) sigue siendo la forma de saber si el
 validador mira siquiera esa ruta.
 
+**Desde Claude Code 2.1.316 la cruz ya no significa error** (TASK-075). El
+validador añade al final un bloque «Plugin directory checks» con lo que el
+directorio de plugins rechazaría (README, icono...), y sus problemas salen con
+`✘` **aunque no cambien el resultado**: la copia de un plugin sin README sale
+con exit 0, una `✘ ... README_MISSING` y termina en `✔ Validation passed`. Las
+contrapruebas 14 y 17 buscaban la cruz en toda la salida y fallaban con la copia
+intacta (eran 2 de los 5 rojos «fijos» de Windows). La regla, en
+`test/helpers/validador-claude.ts`: exit 0, la última línea dice `Validation
+passed` y ninguna `✘` **antes** del bloque del directorio; nunca buscar la cruz
+en toda la salida. Alternativas medidas: `--json` (mismos códigos de salida)
+separa `directory.findings` de `manifest.errors` / `contents[].errors`, y
+`--profile directory` hace que lo del directorio sí falle.
+
 ### El dato se acomoda al lector, no al revés
 
 El único parser del repo lee pares `clave: valor` y listas **en línea**, y
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts
index a31cf60..f1817c9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts
@@ -30,7 +30,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { spawnSync } from 'node:child_process';
+import { claudeDisponible, validarPlugin as validar, validacionLimpia } from '../helpers/validador-claude.js';
 import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
@@ -1085,27 +1085,6 @@ test('15e. el unificador deja el checkpoint humano como obligatorio y no aprueba
 
 // --- 2. De integracion: el validador oficial ----------------------------
 
-interface ResultadoValidate {
-  status: number | null;
-  salida: string;
-}
-
-function claudeDisponible(): boolean {
-  try {
-    const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
-    return r.status === 0;
-  } catch {
-    return false;
-  }
-}
-
-function validar(ruta: string): ResultadoValidate {
-  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
-    encoding: 'utf8',
-    stdio: ['ignore', 'pipe', 'pipe'],
-  });
-  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
-}
 
 // Skip explicito y visible: en el CI de Linux `claude` no esta
 // instalado, y un test que pasa en falso es peor que uno que no corre.
@@ -1113,15 +1092,14 @@ const SKIP_INTEGRACION: false | string = claudeDisponible()
   ? false
   : 'el binario "claude" no esta en el PATH: la comprobacion empirica no se puede hacer aqui';
 
-const CRUZ = '\u2718';
-
 test(
   '16. `claude plugin validate` sobre el plugin real sale 0',
   { skip: SKIP_INTEGRACION },
   () => {
     const { status, salida } = validar(PLUGIN_ROOT);
     assert.equal(status, 0, `exit ${String(status)}. Salida:\n${salida}`);
-    assert.ok(!salida.includes(CRUZ), `la salida reporta errores:\n${salida}`);
+    const limpia = validacionLimpia({ status, salida });
+    assert.ok(limpia.ok, `la salida reporta errores (${limpia.motivo}):\n${salida}`);
   }
 );
 
@@ -1154,7 +1132,7 @@ test(
       `la copia intacta no valida (exit ${String(intacta.status)}):\n${intacta.salida}`
     );
     assert.ok(
-      !intacta.salida.includes(CRUZ),
+      validacionLimpia(intacta).ok,
       `la copia intacta reporta errores:\n${intacta.salida}`
     );
     // El validador solo nombra lo que falla: con todo bien no menciona
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/validador-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/validador-claude.ts
new file mode 100644
index 0000000..bc0db9a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/validador-claude.ts
@@ -0,0 +1,58 @@
+// El validador oficial de plugins (`claude plugin validate`) para los tests
+// de integracion — TASK-075. Antes cada fichero de test tenia su copia de
+// `validar()` y decidia «valida limpio» buscando la cruz en TODA la salida.
+//
+// Desde Claude Code 2.1.316 el validador añade al final un bloque «Plugin
+// directory checks» con las comprobaciones del directorio de plugins (README,
+// icono...). Sus problemas salen marcados con una cruz aunque no cambien el
+// resultado: con la copia de un plugin sin README la salida tiene una cruz y
+// termina en «Validation passed» con exit 0. La condicion mira por eso solo el
+// resultado de la validacion, nunca ese bloque (ver HALLAZGOS.md).
+
+import { spawnSync } from 'node:child_process';
+
+export interface ResultadoValidate {
+  status: number | null;
+  salida: string;
+}
+
+const CRUZ = '✘';
+/** Primera linea del bloque del directorio de plugins (Claude Code 2.1.316+). */
+const MARCA_DIRECTORIO = 'Plugin directory checks';
+const RESULTADO_OK = 'Validation passed';
+
+export function claudeDisponible(): boolean {
+  try {
+    const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
+    return r.status === 0;
+  } catch {
+    return false;
+  }
+}
+
+export function validarPlugin(ruta: string): ResultadoValidate {
+  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
+    encoding: 'utf8',
+    stdio: ['ignore', 'pipe', 'pipe'],
+  });
+  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
+}
+
+/**
+ * true si la validacion paso sin errores, ignorando el bloque del directorio:
+ * exit 0, la ultima linea no vacia dice «Validation passed» y no hay ninguna
+ * cruz ANTES de ese bloque (sin bloque, en toda la salida). Ante un texto que
+ * no reconoce devuelve false: un cambio de formato da rojo, nunca falso verde.
+ */
+export function validacionLimpia(r: ResultadoValidate): { ok: boolean; motivo: string } {
+  if (r.status !== 0) return { ok: false, motivo: `exit ${String(r.status)}` };
+  const lineas = r.salida.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
+  const ultima = lineas[lineas.length - 1] ?? '';
+  if (!ultima.includes(RESULTADO_OK)) {
+    return { ok: false, motivo: `la ultima linea no dice "${RESULTADO_OK}": "${ultima}"` };
+  }
+  const i = r.salida.indexOf(MARCA_DIRECTORIO);
+  const resultado = i === -1 ? r.salida : r.salida.slice(0, i);
+  if (resultado.includes(CRUZ)) return { ok: false, motivo: 'hay errores antes de las comprobaciones del directorio' };
+  return { ok: true, motivo: '' };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
index 5a885dc..de3947b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
@@ -20,7 +20,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { spawnSync } from 'node:child_process';
+import { claudeDisponible, validarPlugin as validar, validacionLimpia } from '../helpers/validador-claude.js';
 import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
@@ -675,27 +675,6 @@ test('21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de m
 
 // --- 2. De integracion: el validador oficial ----------------------------
 
-interface ResultadoValidate {
-  status: number | null;
-  salida: string;
-}
-
-function claudeDisponible(): boolean {
-  try {
-    const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
-    return r.status === 0;
-  } catch {
-    return false;
-  }
-}
-
-function validar(ruta: string): ResultadoValidate {
-  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
-    encoding: 'utf8',
-    stdio: ['ignore', 'pipe', 'pipe'],
-  });
-  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
-}
 
 // Skip explicito y visible: en el CI de Linux `claude` no esta
 // instalado, y un test que pasa en falso es peor que uno que no corre.
@@ -703,15 +682,14 @@ const SKIP_INTEGRACION: false | string = claudeDisponible()
   ? false
   : 'el binario "claude" no esta en el PATH: la comprobacion empirica no se puede hacer aqui';
 
-const CRUZ = '\u2718';
-
 test(
   '13. `claude plugin validate` sobre el plugin real sale 0',
   { skip: SKIP_INTEGRACION },
   () => {
     const { status, salida } = validar(PLUGIN_ROOT);
     assert.equal(status, 0, `exit ${String(status)}. Salida:\n${salida}`);
-    assert.ok(!salida.includes(CRUZ), `la salida reporta errores:\n${salida}`);
+    const limpia = validacionLimpia({ status, salida });
+    assert.ok(limpia.ok, `la salida reporta errores (${limpia.motivo}):\n${salida}`);
   }
 );
 
@@ -747,7 +725,7 @@ test(
       `la copia intacta no valida (exit ${String(intacta.status)}):\n${intacta.salida}`
     );
     assert.ok(
-      !intacta.salida.includes(CRUZ),
+      validacionLimpia(intacta).ok,
       `la copia intacta reporta errores:\n${intacta.salida}`
     );
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/validador-claude.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/validador-claude.test.ts
new file mode 100644
index 0000000..228f315
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/validador-claude.test.ts
@@ -0,0 +1,76 @@
+/**
+ * TASK-075: la condicion «valida limpio» del validador de plugins. Funcion pura
+ * sobre la salida de texto, asi que corre tambien en el CI de Linux (donde no
+ * hay `claude`). Los textos son fragmentos de salidas reales de Claude Code
+ * 2.1.318, sin las rutas de la maquina.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { validacionLimpia } from '../helpers/validador-claude.js';
+
+const DIRECTORIO = `Plugin directory checks for /tmp/copia. The plugin directory is the catalog that plugins are submitted to; this is a subset of what it runs.
+
+✘ Found 1 problem the plugin directory refuses a submission for:
+
+  ❯ README.md: README missing (README_MISSING). This plugin has no README.md.
+
+⚠ Found 1 plugin directory warning:
+
+  ❯ .claude-plugin/plugin.json icon: No icon (ICON_MISSING).
+
+These plugin directory checks do not change the result below. To fail on problems the directory refuses a submission for, run this command with --profile directory.
+
+The directory also runs a safety scan and a policy review that this command does not.
+`;
+
+const COPIA_INTACTA = `Validating plugin manifest: /tmp/copia/.claude-plugin/plugin.json
+
+${DIRECTORIO}
+✔ Validation passed
+`;
+
+const YAML_ROTO = `Validating plugin manifest: /tmp/copia/.claude-plugin/plugin.json
+
+Validating agent: /tmp/copia/agents/brainstorm-arquitectura.md
+
+✘ Found 1 error:
+
+  ❯ frontmatter: YAML frontmatter failed to parse: YAML Parse error: Unexpected character.
+
+${DIRECTORIO}
+✘ Validation failed
+`;
+
+test('validador (TASK-075): la cruz del bloque del directorio no cuenta como error', () => {
+  assert.deepEqual(validacionLimpia({ status: 0, salida: COPIA_INTACTA }), { ok: true, motivo: '' });
+});
+
+test('validador (TASK-075): la mutacion de los tests (YAML roto) no valida limpio', () => {
+  const r = validacionLimpia({ status: 1, salida: YAML_ROTO });
+  assert.equal(r.ok, false);
+  assert.match(r.motivo, /exit 1/);
+});
+
+test('validador (TASK-075): sin bloque del directorio (antes de 2.1.316) y sin cruz, valida limpio', () => {
+  const salida = 'Validating plugin manifest: /tmp/x/.claude-plugin/plugin.json\n\n✔ Validation passed\n';
+  assert.equal(validacionLimpia({ status: 0, salida }).ok, true);
+});
+
+test('validador (TASK-075): un texto sin linea de resultado da rojo, no falso verde', () => {
+  const r = validacionLimpia({ status: 0, salida: 'algo inesperado\n' });
+  assert.equal(r.ok, false);
+  assert.match(r.motivo, /Validation passed/);
+  assert.equal(validacionLimpia({ status: 0, salida: '' }).ok, false);
+});
+
+test('validador (TASK-075): exit 0 con una cruz ANTES del bloque del directorio no valida limpio', () => {
+  const salida = YAML_ROTO.replace('✘ Validation failed', '✔ Validation passed');
+  const r = validacionLimpia({ status: 0, salida });
+  assert.equal(r.ok, false);
+  assert.match(r.motivo, /antes de las comprobaciones del directorio/);
+});
+
+test('validador (TASK-075): «Validation passed with warnings» tambien cuenta como paso', () => {
+  const salida = COPIA_INTACTA.replace('Validation passed', 'Validation passed with warnings');
+  assert.equal(validacionLimpia({ status: 0, salida }).ok, true);
+});
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-075/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-075/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-075/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````
