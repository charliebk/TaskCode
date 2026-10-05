# Peticion de revision — TASK-049 (ronda 1)

- Tarea: TASK-049 — F6-T4 Metadatos del plugin y modelo de los agentes
- Rama revisada: feature/task-049-f6-t4-metadatos-del-plugin-y-modelo-de-l
- Rama base: develop
- Commit revisado (HEAD): be3d7d24739986eb99427e2fc2efe86618abc430
- Fecha: 2026-10-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-049 (criterios de aceptacion y plan)

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
be3d7d2 feat(TASK-049): metadatos del plugin, licencia MIT y modelo de los agentes
c928803 chore(TASK-049): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/LICENSE b/LICENSE
new file mode 100644
index 0000000..e927ef8
--- /dev/null
+++ b/LICENSE
@@ -0,0 +1,21 @@
+MIT License
+
+Copyright (c) 2026 Carlos Gallardo Rodriguez
+
+Permission is hereby granted, free of charge, to any person obtaining a copy
+of this software and associated documentation files (the "Software"), to deal
+in the Software without restriction, including without limitation the rights
+to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
+copies of the Software, and to permit persons to whom the Software is
+furnished to do so, subject to the following conditions:
+
+The above copyright notice and this permission notice shall be included in all
+copies or substantial portions of the Software.
+
+THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
+IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
+FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
+AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
+LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
+OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
+SOFTWARE.
diff --git a/README.md b/README.md
index 85efe9c..0a5f2f4 100644
--- a/README.md
+++ b/README.md
@@ -12,9 +12,29 @@ construye usándose a sí mismo** (dogfooding desde el Sprint 0).
 /plugin install taskcode-plugin@taskcode-marketplace
 ```
 
+O, desde la terminal:
+
+```bash
+claude plugin marketplace add charliebk/TaskCode
+claude plugin install taskcode-plugin@taskcode-marketplace
+```
+
 El repo es privado: hace falta acceso de lectura como colaborador, y las
 credenciales Git/GitHub que ya tengas configuradas (SSH o `gh`).
 
+### Actualizar
+
+```bash
+claude plugin marketplace update taskcode-marketplace
+claude plugin update taskcode-plugin@taskcode-marketplace
+```
+
+Y después **reinicia Claude Code** (o ejecuta `/reload-plugins` en la sesión
+abierta): una sesión en marcha conserva la versión que ya cargó. El plugin
+fija su `version`, así que solo llega una versión nueva cuando se publica.
+
+Licencia: [MIT](LICENSE).
+
 Para desarrollo sobre el propio plugin, sin instalarlo:
 
 ```bash
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
index 2339430..1d5ca43 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
@@ -1,8 +1,12 @@
 {
   "name": "taskcode-plugin",
+  "displayName": "TaskCode",
   "version": "0.4.0",
   "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
   "author": {
     "name": "charlie.bk"
-  }
+  },
+  "repository": "https://github.com/charliebk/TaskCode",
+  "license": "MIT",
+  "keywords": ["git-flow", "tareas", "sprints", "revision-por-pares", "scrum"]
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/LICENSE b/taskcode-marketplace/plugins/taskcode-plugin/LICENSE
new file mode 100644
index 0000000..e927ef8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/LICENSE
@@ -0,0 +1,21 @@
+MIT License
+
+Copyright (c) 2026 Carlos Gallardo Rodriguez
+
+Permission is hereby granted, free of charge, to any person obtaining a copy
+of this software and associated documentation files (the "Software"), to deal
+in the Software without restriction, including without limitation the rights
+to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
+copies of the Software, and to permit persons to whom the Software is
+furnished to do so, subject to the following conditions:
+
+The above copyright notice and this permission notice shall be included in all
+copies or substantial portions of the Software.
+
+THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
+IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
+FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
+AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
+LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
+OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
+SOFTWARE.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 6873dd9..bf0518e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -5,6 +5,29 @@ revisión por pares de agentes y Git-Flow determinista descrita en
 `docs/PROPUESTA_METODOLOGIA.md` (raíz del repo `TaskCode`). Expone el CLI
 `taskctl`.
 
+Para instalarlo y actualizarlo desde el marketplace, ver el README de la raíz
+del repo («Instalar el plugin» y «Actualizar»). Licencia: MIT.
+
+## Modelo de los agentes
+
+Los agentes de brainstorm (`agents/brainstorm-*.md`) **no declaran `model:`**
+en su frontmatter. Es una decisión, no un olvido (TASK-049, comprobado el
+2026-10-05 con Claude Code 2.1.288 en
+<https://code.claude.com/docs/en/sub-agents>):
+
+- El campo admite `sonnet`, `opus`, `haiku`, `fable`, un ID completo (por
+  ejemplo `claude-opus-5-5`) o `inherit`. Sin él, Claude Code resuelve el
+  modelo así: el parámetro `model` de cada invocación, después
+  `CLAUDE_CODE_SUBAGENT_MODEL` y por último el de la conversación.
+- Un alias fijo y barato iría contra la metodología: el modelo depende de la
+  complejidad de cada tarea (`modelo_sugerido` en `tarea.md`), y cambiarlo
+  obligaría a publicar una versión del plugin.
+- `inherit` explícito anularía `CLAUDE_CODE_SUBAGENT_MODEL`, que es la palanca
+  de coste de quien instala el plugin.
+
+Quien orquesta pasa `modelo_sugerido` como `model` al lanzar cada agente (la
+salida de `taskctl review` ya lo nombra).
+
 ## Instalación local (para desarrollo y pruebas)
 
 **Corrección respecto al texto original de TASK-006:** la tarea describía
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package.json b/taskcode-marketplace/plugins/taskcode-plugin/package.json
index 6749bd2..6b5f7df 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package.json
@@ -3,6 +3,7 @@
   "version": "0.4.0",
   "description": "TaskCode: metodologia de tareas/sprints + Git-Flow + revision por pares de agentes, como plugin de Claude Code.",
   "private": true,
+  "license": "MIT",
   "type": "module",
   "bin": {
     "taskctl": "bin/taskctl"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/metadatos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/metadatos.test.ts
new file mode 100644
index 0000000..81bdc06
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/metadatos.test.ts
@@ -0,0 +1,75 @@
+/**
+ * Metadatos del plugin (TASK-049): `plugin.json` lleva `displayName`,
+ * `repository`, `license` y `keywords`, la licencia existe como fichero
+ * dentro del plugin (que es lo que se instala), y los campos que tambien
+ * declara la entrada del marketplace no se desalinean entre los dos sitios.
+ *
+ * Y la decision sobre `model:` en los agentes: no lo declaran, para que
+ * mande el parametro `model` de cada invocacion y despues
+ * `CLAUDE_CODE_SUBAGENT_MODEL` (ver el README del plugin).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, readdir } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseFrontmatter } from '../../src/core/frontmatter.js';
+
+// dist/test/empaquetado -> tres niveles arriba esta la raiz del plugin, y
+// tres mas la del repo (mismo truco que distribucion.test.ts).
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
+const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..', '..');
+
+async function leerJson(ruta: string): Promise<Record<string, unknown>> {
+  return JSON.parse(await readFile(ruta, 'utf8')) as Record<string, unknown>;
+}
+
+test('plugin.json declara displayName, repository, license (SPDX MIT) y keywords', async () => {
+  const manifiesto = await leerJson(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'));
+  assert.equal(manifiesto.name, 'taskcode-plugin', 'el test no esta leyendo el manifiesto del plugin');
+  assert.equal(typeof manifiesto.displayName, 'string');
+  assert.match(String(manifiesto.repository), /^https:\/\/github\.com\//);
+  assert.equal(manifiesto.license, 'MIT');
+  assert.ok(Array.isArray(manifiesto.keywords) && manifiesto.keywords.length > 0, 'keywords vacio');
+  assert.ok((manifiesto.keywords as unknown[]).every((k) => typeof k === 'string'));
+});
+
+test('la licencia viaja dentro del plugin y coincide con la del repo', async () => {
+  const delPlugin = path.join(PLUGIN_ROOT, 'LICENSE');
+  assert.ok(existsSync(delPlugin), 'falta LICENSE en la carpeta del plugin');
+  const texto = await readFile(delPlugin, 'utf8');
+  assert.match(texto, /^MIT License/);
+  const delRepo = path.join(REPO_ROOT, 'LICENSE');
+  if (existsSync(delRepo)) {
+    assert.equal(texto.replace(/\r\n/g, '\n'), (await readFile(delRepo, 'utf8')).replace(/\r\n/g, '\n'));
+  }
+});
+
+test('plugin.json y la entrada del marketplace no se desalinean', async (t) => {
+  const marketplace = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
+  if (!existsSync(marketplace)) {
+    t.skip('sin marketplace.json: el plugin se esta probando fuera de su repo');
+    return;
+  }
+  const manifiesto = await leerJson(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'));
+  const plugins = (await leerJson(marketplace)).plugins as Array<Record<string, unknown>>;
+  const entrada = plugins.find((p) => p.name === manifiesto.name);
+  assert.ok(entrada, 'el marketplace no tiene entrada para el plugin');
+  for (const campo of ['displayName', 'repository', 'keywords', 'version']) {
+    assert.deepEqual(entrada[campo], manifiesto[campo], `"${campo}" distinto en plugin.json y marketplace.json`);
+  }
+});
+
+test('los agentes no declaran model: (manda el parametro de cada invocacion)', async () => {
+  const dir = path.join(PLUGIN_ROOT, 'agents');
+  const agentes = (await readdir(dir)).filter((f) => f.endsWith('.md'));
+  assert.ok(agentes.length >= 5, `solo ${agentes.length} agentes: el test no mide nada`);
+  const conModelo: string[] = [];
+  for (const f of agentes) {
+    const { data } = parseFrontmatter(await readFile(path.join(dir, f), 'utf8'));
+    if ('model' in data) conModelo.push(f);
+  }
+  assert.deepEqual(conModelo, [], `agentes con model: ${conModelo.join(', ')}`);
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
tareas/{01-en-diseno => 02-en-curso}/TASK-049/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-049/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-049/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````
