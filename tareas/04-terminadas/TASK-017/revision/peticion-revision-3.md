# Peticion de revision — TASK-017 (ronda 3)

- Tarea: TASK-017 — Catalogo de skills determinista con seleccion en dos pasos
- Rama revisada: feature/task-017-catalogo-de-skills-determinista-con-sele
- Rama base: develop
- Commit revisado (HEAD): 2b4319742ac72484ad9bcc981ab16febbfe5c05e
- Fecha: 2026-09-09
- Agente revisor sugerido: code-reviewer

## Nota sobre este fichero

Este fichero se genera a mano, igual que `peticion-revision-2.md`, en vez
de con `taskctl review TASK-017`. Motivo distinto al de la ronda 2: aqui
`taskctl review` es tecnicamente invocable pero fallaria en esta maquina.
El comando ejecuta un script real de Git-Flow (`update-feature.sh`) via
`runGitflowScript()`, que hace `spawnSync('bash', [scriptPath, ...])` — y
el binario `bash` de este entorno esta roto (confirmado repetidas veces
en esta sesion con errores de parseo en comandos triviales). Se comprobo
antes de descartar el comando que `develop` ya es antepasado de `HEAD`
(`git merge-base --is-ancestor develop HEAD` devuelve 0), asi que el
"update" no habria traido cambios de todos modos; el bloqueo es solo la
dependencia de Bash, no un conflicto real con develop.

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento los cambios de
esta ronda. Reproduce EMPIRICAMENTE — ejecuta los tests, lee el codigo
real, no te limites a leer el diff y opinar. Clasifica cada hallazgo como
CRITICO, IMPORTANTE o MENOR. Si no encuentras hallazgos nuevos, dilo
explicitamente: la ronda 3 tambien es valida si confirma que ronda 2
quedo bien cerrada.

Este commit corrige dos hallazgos de una segunda pasada informal sobre el
cierre de ronda 2 (ronda 2 formal, `informe-revision-2.md`, encontro
IMP-6 e IMP-7; ambos se corrigen aqui):

- IMP-6: el comentario de `catalogo-skills.yml` describia `skill_N_id` de
  una entrada externa como `marketplace:skill`, al reves de la
  convencion real (`plugin:skill`) que ya usan `plan.ts` y el propio
  ejemplo de la seccion 6.6. Corregido el comentario y anadido un test
  end-to-end en `plan.test.ts` que fija el comando de instalacion
  esperado (`/plugin install figma@<marketplace>`, nunca al reves).
- IMP-7: `leerGanadorDesempate` no saltaba el marcador de relleno del
  scaffold (`(pendiente de completar)`) que el propio scaffold escribe,
  asi que responder debajo sin borrarlo se descartaba en silencio.
  Corregido con la constante compartida `PLACEHOLDER_SALIDA_DESEMPATE`,
  usada tanto al escribir el scaffold como al leerlo. El test que
  ejercitaba este escenario borraba el marcador con `.replace()` antes
  de leer — no probaba lo que su nombre prometia — y queda corregido
  para dejarlo intacto de verdad, con un test complementario que aisla
  el salto del marcador en solitario.

Ademas, documentadas dos decisiones que la ronda 2 dejo como MENOR sin
tocar codigo: `plugin-instalado.ts` ahora explica por que un plugin con
`enabled: false` cuenta igual como `'instalado'` (MEN-14), y `tarea.md`
corrige una cita de codigo desactualizada (MEN-12).

No des estos cambios por buenos solo porque esta peticion lo diga:
confirma tu mismo que el codigo actual hace lo que aqui se afirma, y si
algo no cuadra — incluida la propia clasificacion de estos dos hallazgos
como ya resueltos — dilo como hallazgo nuevo.

## Commits a revisar (git log c284203..HEAD)

```
2b43197 fix(TASK-017): corrige hallazgos IMP-6 e IMP-7 de la 2a pasada de ronda 2
```

El commit anterior (`c284203`) es el que revisó `informe-revision-2.md`.

## Diff completo (git diff c284203..HEAD -- src test scripts/catalogo-skills.yml)

```diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
index 22cfa99..7fc3d76 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
@@ -27,10 +27,13 @@
 #   skill_N_id                 identificador del skill. Para uno empaquetado
 #                               en este plugin, su nombre de skill tal cual
 #                               (el de su carpeta y su frontmatter `name`).
-#                               Para uno externo, "marketplace:skill" (ver
-#                               el ejemplo "figma:figma-generate-design" de
-#                               la seccion 6.6). Debe ser unico en todo el
-#                               fichero.
+#                               Para uno externo, "plugin:skill" (ver el
+#                               ejemplo "figma:figma-generate-design" de la
+#                               seccion 6.6, donde "figma" es el PLUGIN que
+#                               hay que instalar, no el marketplace que lo
+#                               aloja -- ese va aparte, en
+#                               skill_N_marketplace). Debe ser unico en todo
+#                               el fichero.
 #   skill_N_origen              "taskcode-plugin" (empaquetado, siempre
 #                               instalado con este plugin) o "externo"
 #                               (puede no estar instalado en la maquina).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts
index 8af478e..a0cf2ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts
@@ -22,6 +22,16 @@ import type { EntradaCatalogoSkill } from './catalogo-skills.js';
 export const PETICION_DESEMPATE_SKILL_FILENAME = 'peticion-desempate-skill-1.md';
 export const SALIDA_DESEMPATE_SKILL_FILENAME = 'salida-desempate-skill-1.md';
 
+/**
+ * Marcador de relleno que deja salidaDesempateSkillTemplate() en el
+ * scaffold. leerGanadorDesempate() lo salta ademas del encabezado
+ * Markdown y de las lineas en blanco: "dejarlo intacto y responder
+ * debajo" (lo que promete el docblock de leerGanadorDesempate) solo
+ * funciona si el lector conoce este literal exacto (hallazgo IMPORTANTE
+ * de revision por pares, TASK-017, ronda 2).
+ */
+const PLACEHOLDER_SALIDA_DESEMPATE = '(pendiente de completar)';
+
 export function peticionDesempateSkillTemplate(
   task: Task,
   candidatos: readonly EntradaCatalogoSkill[],
@@ -50,8 +60,10 @@ export function peticionDesempateSkillTemplate(
     `${etiquetasTarea}\n\n` +
     '## Como entregas\n\n' +
     `Escribe en \`${SALIDA_DESEMPATE_SKILL_FILENAME}\` una unica linea con el \`id\` EXACTO (tal ` +
-    'cual aparece arriba) del candidato que mejor encaje con esta tarea concreta — taskctl solo ' +
-    'lee la primera linea no vacia. Puedes anadir tu razonamiento en lineas siguientes.\n\n' +
+    'cual aparece arriba) del candidato que mejor encaje con esta tarea concreta — taskctl lee ' +
+    'la primera linea que no este vacia, no sea un encabezado Markdown ni el marcador ' +
+    `"${PLACEHOLDER_SALIDA_DESEMPATE}" del scaffold. Puedes anadir tu razonamiento en lineas ` +
+    'siguientes.\n\n' +
     '## Reglas\n\n' +
     '- Eliges uno de los candidatos de arriba, tal cual. Cualquier otro texto en esa primera ' +
     'linea se trata como respuesta invalida y taskctl la ignora.\n' +
@@ -65,7 +77,7 @@ export function peticionDesempateSkillTemplate(
  * brainstorm: solo el sitio donde escribir, sin invencion de contenido.
  */
 export function salidaDesempateSkillTemplate(task: Task): string {
-  return `# Salida del desempate de skill — ${task.id}\n\n(pendiente de completar)\n`;
+  return `# Salida del desempate de skill — ${task.id}\n\n${PLACEHOLDER_SALIDA_DESEMPATE}\n`;
 }
 
 /**
@@ -76,13 +88,15 @@ export function salidaDesempateSkillTemplate(task: Task): string {
  * salida que no se puede interpretar sin ambiguedad no elige un
  * candidato al azar.
  *
- * Se saltan tanto las lineas en blanco como las que empiezan por "#":
- * salidaDesempateSkillTemplate() genera un encabezado Markdown como
- * primera linea, y responder debajo de el (dejandolo intacto, igual
- * que se hace con los `salida-brainstorm-*.md`) es la forma obvia de
- * completar el scaffold. Sin este salto, esa respuesta se descartaba
- * en silencio porque la "primera linea no vacia" seguia siendo el
- * encabezado (hallazgo IMPORTANTE de revision por pares, TASK-017).
+ * Se saltan las lineas en blanco, las que empiezan por "#" y el
+ * marcador de relleno del propio scaffold (PLACEHOLDER_SALIDA_DESEMPATE):
+ * salidaDesempateSkillTemplate() genera un encabezado Markdown y ese
+ * marcador como primeras lineas, y responder debajo de ellas
+ * (dejandolas intactas, igual que se hace con los
+ * `salida-brainstorm-*.md`) es la forma obvia de completar el scaffold.
+ * Sin este triple salto, esa respuesta se descartaba en silencio porque
+ * la "primera linea no vacia" seguia siendo el encabezado o el marcador
+ * (hallazgo IMPORTANTE de revision por pares, TASK-017, rondas 1 y 2).
  */
 export function leerGanadorDesempate(
   contenido: string,
@@ -91,7 +105,7 @@ export function leerGanadorDesempate(
   const primeraLinea = contenido
     .split(/\r?\n/)
     .map((l) => l.trim())
-    .find((l) => l !== '' && !l.startsWith('#'));
+    .find((l) => l !== '' && l !== PLACEHOLDER_SALIDA_DESEMPATE && !l.startsWith('#'));
   if (primeraLinea === undefined) return null;
   return candidatos.find((c) => c.id === primeraLinea) ?? null;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
index 37b4f88..30fc873 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
@@ -37,6 +37,17 @@
  * cualquier otro del mismo marketplace si esta instalado -- justo el
  * "candidato real que falta" escondido que este modulo existe para
  * evitar.
+ *
+ * Decision aceptada (hallazgo MENOR, revision por pares ronda 2): un
+ * elemento con `id` coincidente pero `enabled: false` en el JSON real
+ * cuenta como 'instalado', igual que uno habilitado -- el campo
+ * `enabled` no se mira. `EstadoInstalacionSkill` solo distingue si el
+ * plugin YA esta descargado y registrado en la maquina (que es lo que
+ * hace innecesario el "/plugin install" que sugiere plan.ts), no si
+ * esta activo ahora mismo; habilitarlo no requiere reinstalar. Anadir
+ * un cuarto estado para "instalado pero deshabilitado" exigiria ademas
+ * un aviso distinto en plan.ts ("/plugin enable" en vez de
+ * "/plugin install") que nadie ha pedido todavia.
  */
 import { spawnSync } from 'node:child_process';
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 64ff625..d3775ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -809,6 +809,63 @@ test('taskctl plan: un skill externo ganador que no esta instalado deja el aviso
   }
 });
 
+test('taskctl plan: IMP-6 (revision por pares ronda 2) -- un skill_N_id CON ":" usa el tramo antes de ":" como PLUGIN en el "/plugin install", no como marketplace', async () => {
+  const pluginRootTmp = await mkdtemp(path.join(tmpdir(), 'taskctl-plan-plugin-root-'));
+  const previoPluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+  const marketplaceInventado = 'marketplace-inventado-para-el-test-de-plan';
+  try {
+    const scriptsDir = path.join(pluginRootTmp, 'scripts');
+    await mkdir(scriptsDir, { recursive: true });
+    const heuristicaReal = await readFile(RUTA_HEURISTICA_REAL, 'utf8');
+    await writeFile(path.join(scriptsDir, 'heuristica-complejidad.yml'), heuristicaReal, 'utf8');
+    await writeFile(
+      path.join(scriptsDir, 'catalogo-skills.yml'),
+      [
+        'total_skills: 1',
+        'skill_1_id: figma:figma-generate-design',
+        'skill_1_origen: externo',
+        `skill_1_marketplace: ${marketplaceInventado}`,
+        'skill_1_rol: ejecucion',
+        'skill_1_prioridad: 5',
+        'skill_1_etiquetas: [etiqueta-unica-para-el-test-externo-con-dos-puntos]',
+        'skill_1_patrones_archivo: []',
+        'skill_1_descripcion: "skill externo de prueba con id compuesto"',
+        '',
+      ].join('\n'),
+      'utf8'
+    );
+    process.env['CLAUDE_PLUGIN_ROOT'] = pluginRootTmp;
+
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(
+        tareasRoot,
+        sampleTask({ etiquetas: ['etiqueta-unica-para-el-test-externo-con-dos-puntos'] }),
+        BODY_CON_OBJETIVO
+      );
+      commitAll(repoRoot, 'tarea TASK-700 con etiqueta de skill externo con id compuesto');
+
+      const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot });
+
+      assert.deepEqual(result.skillsRecomendados, ['figma:figma-generate-design']);
+      assert.ok(result.avisoSkillNoInstalada !== null);
+      // "figma" (tramo ANTES de ":") es el PLUGIN a instalar; el
+      // marketplace es el campo skill_N_marketplace, que va DESPUES de
+      // "@". Si el split usara el tramo equivocado, o si el catalogo y
+      // el codigo interpretaran el prefijo de forma distinta, este
+      // "/plugin install" no seria el comando real que hay que ejecutar
+      // (hallazgo IMP-6).
+      assert.match(
+        result.avisoSkillNoInstalada!,
+        new RegExp(`/plugin install figma@${marketplaceInventado}`)
+      );
+    });
+  } finally {
+    if (previoPluginRoot === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
+    else process.env['CLAUDE_PLUGIN_ROOT'] = previoPluginRoot;
+    await rm(pluginRootTmp, { recursive: true, force: true });
+  }
+});
+
 test('taskctl plan: MEN-8 (revision por pares ronda 2) -- un catalogo de skills mal formado aborta ANTES de crear planificacion/, deja el workspace limpio', async () => {
   // cargarCatalogoSkills() se llama antes del mkdir/writeFile del
   // scaffold a proposito (ver el comentario en plan.ts junto a la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
index c9af049..f87fecf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
@@ -162,10 +162,9 @@ test('leerGanadorDesempate salta el encabezado Markdown del scaffold y lee el id
 });
 
 test('leerGanadorDesempate deja el scaffold intacto pero responde debajo, con texto adicional despues del id', () => {
-  const salida = salidaDesempateSkillTemplate(tarea({ id: 'TASK-042' })).replace(
-    '(pendiente de completar)',
-    'java-spring-reviewer\n\nPorque el nucleo es backend.'
-  );
+  const scaffold = salidaDesempateSkillTemplate(tarea({ id: 'TASK-042' }));
+  assert.ok(scaffold.includes('(pendiente de completar)'));
+  const salida = `${scaffold}\njava-spring-reviewer\n\nPorque el nucleo es backend.\n`;
   const candidatos = [
     ...CANDIDATOS,
     entradaSkill({ id: 'java-spring-reviewer', prioridad: 10, rol: 'revisor', etiquetas: ['java'] }),
@@ -174,6 +173,11 @@ test('leerGanadorDesempate deja el scaffold intacto pero responde debajo, con te
   assert.equal(ganador?.id, 'java-spring-reviewer');
 });
 
+test('leerGanadorDesempate salta el marcador de relleno del scaffold y lee el id de la linea siguiente con contenido', () => {
+  const ganador = leerGanadorDesempate('# Salida del desempate de skill — TASK-042\n\n(pendiente de completar)\n\nb\n', CANDIDATOS);
+  assert.equal(ganador?.id, 'b');
+});
+
 test('leerGanadorDesempate sigue devolviendo null si tras el encabezado solo hay mas encabezados', () => {
   assert.equal(leerGanadorDesempate('# titulo\n## subtitulo\n', CANDIDATOS), null);
 });
```
