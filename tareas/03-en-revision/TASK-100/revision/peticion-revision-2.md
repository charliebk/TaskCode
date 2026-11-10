# Peticion de revision — TASK-100 (ronda 2)

- Tarea: TASK-100 — Verificacion proporcional A1: finish no corre la suite si la tarea solo cambia documentacion
- Rama revisada: feature/task-100-verificacion-proporcional-a-una-tarea-qu
- Rama base: develop
- Commit revisado (HEAD): ca2198de494244e805acdd3b067e88f5debffa0f
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-100 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde a6cf647fe4f1f5514904cf502d978285c34759c1 (el commit revisado en la ronda anterior)
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
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-100/tarea.md
- tareas/03-en-revision/TASK-100/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts (`rutasDeTarea`, el `'.'` del pathspec de `fueraDeDocs`) y src/core/verificacion-proporcional.ts | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/commands/finish-verificacion.ts (`puertaSoloDocumentacion`, anotar y commitear antes de la comprobacion) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | README.md («Tareas de solo documentacion»), skills/task-workflow/verificacion-selectiva.md, test finish-documentacion.test.ts | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/core/verificacion-proporcional.ts (`tareas/**` siempre es documentacion) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/core/config.ts (`validarPatronesExclusion` acepta `*` y `**`) | informe-revision-1.md |
| MEN-5 | MENOR | abierto | src/core/config.ts (`validarDocumentacionCompleta`) con src/hooks/guardia-merge.ts:88-92 | informe-revision-1.md |

## Commits a revisar (git log a6cf647fe4f1f5514904cf502d978285c34759c1..HEAD)

````
ca2198d docs(TASK-100): autorrevision ronda 2
4140aef fix(TASK-100): rutas desde la raiz del repo, reintento sin duplicar y patrones totales rechazados
b427851 chore(TASK-100): coste revision +4710347 tokens (1 agente)
b61551d docs(TASK-100): informe de revision ronda 1
868f7cb chore(TASK-100): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff a6cf647fe4f1f5514904cf502d978285c34759c1..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index f5fff12..8396822 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -878,7 +878,7 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   sus held-out los sigue corriendo su puerta).
 - **Ante la duda, la completa**: diff que no se puede calcular o vacío, mezcla
   de documentación y código, o un renombre de código a una ruta de
-  documentación (cuentan las dos rutas). Las mayúsculas cuentan. Un `release`
+  documentación (cuentan las dos rutas). Un `release`
   corre siempre la completa.
 - Con `comando_verificacion_documentacion` se ejecuta ese (con
   `timeout_verificacion`); su rojo bloquea y su verde va a su propio memo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 58d2919..96ea0e4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -104,7 +104,8 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   no puede ampliarlas para eximirse. Si la tarea cambia `.taskcode/config.yml`,
   corre la completa.
 - **Sin anclar**: `*.md` es solo la raiz del repo; `docs/**` es esa carpeta.
-  Las mayusculas cuentan (`Docs/` no es `docs/`).
+  Los comodines distinguen mayusculas; el nombre literal de una carpeta, segun
+  `core.ignorecase` (en Windows y macOS `Docs/` y `docs/` son la misma).
 - **La carpeta `tareas/` cuenta siempre** como documentacion: la cambia toda
   tarea. Sus tests held-out los sigue corriendo su propia puerta.
 - **Ante la duda, la completa**: si no se puede calcular el diff, si sale
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 1f0b750..57a01ca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -213,13 +213,17 @@ async function puertaSoloDocumentacion(
   timeoutS: number
 ): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
   const body = anotarVerificacionDocumentacion(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
-  await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
-  const c = autoCommit({
-    cwd: o.cwd,
-    rutas: [path.dirname(o.initial.filePath)],
-    mensaje: mensajeChore(o.id, 'cierre solo documentacion'),
-    push: false,
-  });
+  // Un reintento tras un rojo de la comprobacion ya la tiene anotada: ni se reescribe ni se commitea otra vez.
+  let c: { commit: string | null; avisos: readonly string[] } = { commit: null, avisos: [] };
+  if (body !== o.initial.body) {
+    await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
+    c = autoCommit({
+      cwd: o.cwd,
+      rutas: [path.dirname(o.initial.filePath)],
+      mensaje: mensajeChore(o.id, 'cierre solo documentacion'),
+      push: false,
+    });
+  }
   for (const a of c.avisos) o.onAviso?.(a);
   const releida = await readTareaFile(o.tareasRoot, o.id);
   if (releida === null) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index d89e256..d782af7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -591,7 +591,7 @@ export function parsearConfigConAvisos(
         config.umbral_cobertura = validarUmbralCobertura(donde, par.valor);
         break;
       case 'rutas_documentacion':
-        config.rutas_documentacion = validarPatronesExclusion(donde, par.valor, 'rutas_documentacion', false);
+        config.rutas_documentacion = validarRutasDocumentacion(donde, par.valor);
         break;
       case 'comando_verificacion_documentacion':
         config.comando_verificacion_documentacion = validarComando(
@@ -751,6 +751,24 @@ function validarCoberturaCompleta(ruta: string, vistas: ReadonlySet<string>): vo
   }
 }
 
+/**
+ * TASK-100: patrones de documentacion, sin anclar. Un patron que casa con todo
+ * (`*`, `**`, `**\/*`) convertiria cualquier cambio en «solo documentacion»:
+ * se rechaza (MEN-4 de la revision).
+ */
+function validarRutasDocumentacion(donde: string, valor: unknown): readonly string[] {
+  const patrones = validarPatronesExclusion(donde, valor, 'rutas_documentacion', false);
+  const total = patrones.find((p) => /^(\*\*?\/)*\*\*?$/.test(p.replace(/\/+$/, '')));
+  if (total !== undefined) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: el patron "${total}" de "rutas_documentacion" casa con cualquier fichero y haria ` +
+        'que toda tarea se cerrara sin la verificacion completa.\n' +
+        '        Declara carpetas o ficheros concretos de documentacion (p. ej. [docs/**, README.md]).'
+    );
+  }
+  return patrones;
+}
+
 /**
  * TASK-100: las rutas de documentacion ahorran `comando_verificacion`; sin el
  * no ahorran nada. El comando de documentacion sin rutas no lo lanzaria nadie.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 7d730b9..765a6c3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -355,8 +355,10 @@ export const SECCION_VERIFICACION_DOCUMENTACION = '## Verificacion de documentac
 
 /**
  * Anota que `finish` no ejecuto `comando_verificacion` porque la tarea solo
- * cambia documentacion, con el motivo y lo que si corrio. Auditable igual que
- * el salto con --sin-verificacion; un reintento anade otra linea.
+ * cambia documentacion, con el motivo y la comprobacion que corresponde.
+ * Auditable igual que el salto con --sin-verificacion. Un reintento con lo
+ * mismo (tras un rojo de la comprobacion) no duplica la linea (MEN-1 de la
+ * revision): devuelve el cuerpo tal cual.
  */
 export function anotarVerificacionDocumentacion(
   body: string,
@@ -369,9 +371,14 @@ export function anotarVerificacionDocumentacion(
   const corrio =
     comandoDocumentacion === null
       ? 'sin comprobacion de documentacion declarada'
-      : `se ejecuta \`${sinComillas(comandoDocumentacion)}\``;
-  const linea = `- ${instante}: ${motivo}; no se ejecuta \`${sinComillas(comando)}\`, ${corrio}`;
-  return anotarLineaEnSeccion(body, SECCION_VERIFICACION_DOCUMENTACION, linea);
+      : `comprobacion de documentacion \`${sinComillas(comandoDocumentacion)}\``;
+  const texto = `${motivo}; no se ejecuta \`${sinComillas(comando)}\`, ${corrio}`;
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_VERIFICACION_DOCUMENTACION);
+  if (rango !== null && lineas.slice(rango[0], rango[1]).some((l) => l.startsWith('- ') && l.endsWith(`: ${texto}`))) {
+    return body;
+  }
+  return anotarLineaEnSeccion(body, SECCION_VERIFICACION_DOCUMENTACION, `- ${instante}: ${texto}`);
 }
 
 function anotarLineaEnSeccion(body: string, titulo: string, linea: string): string {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 7999b17..a989bbe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -1049,6 +1049,9 @@ export function numeroDePadres(commit: string, cwd: string): number {
  * con sus dos rutas, no solo con la de destino. `-z` y `core.quotePath=false`:
  * una ruta con tildes o espacios sale tal cual. null si Git falla (base que no
  * existe, clon superficial...): quien decide lo trata como «no se sabe».
+ * Pathspecs con `:(top)`: las dos listas son de TODO el repo y los patrones,
+ * relativos a su raiz, aunque taskctl se ejecute desde una subcarpeta (IMP-1
+ * de la revision: con `.`, el codigo fuera de la subcarpeta no salia).
  */
 export function rutasDeTarea(
   base: string,
@@ -1059,9 +1062,9 @@ export function rutasDeTarea(
   const rango = `${base}...${hasta}`;
   const diff = [...SIN_COMILLAS, 'diff', '--name-only', '-z', '--no-renames', '--no-ext-diff', rango];
   try {
-    const todas = partirNul(runGit([...diff, '--'], cwd));
+    const todas = partirNul(runGit([...diff, '--', ':(top)'], cwd));
     const fueraDeDocs = partirNul(
-      runGit([...diff, '--', '.', ...patronesDocs.map((p) => `:(exclude,glob)${p}`)], cwd)
+      runGit([...diff, '--', ':(top)', ...patronesDocs.map((p) => `:(top,exclude,glob)${p}`)], cwd)
     );
     return { todas, fueraDeDocs };
   } catch {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
index 62d3ccc..750d5a6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
@@ -157,6 +157,14 @@ test('finish (TASK-100): solo documentacion con la comprobacion de documentacion
     assert.equal(git(['rev-parse', 'develop'], e.repoRoot).trim(), developAntes);
     assert.equal((await readTareaFile(e.tareasRoot, 'TASK-903'))?.task.estado, 'en-revision');
     assert.equal(git(['status', '--porcelain'], e.repoRoot), '');
+    // MEN-1: el reintento tras arreglar la documentacion no duplica ni la linea ni el commit.
+    await e.desenlace('docs', 'ok');
+    await finish(e, 'TASK-903');
+    assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
+    const commits = git(['log', '--format=%s', 'develop'], e.repoRoot).split('\n').filter((l) => /cierre solo documentacion/.test(l));
+    assert.equal(commits.length, 1, commits.join('\n'));
+    const body = (await readTareaFile(e.tareasRoot, 'TASK-903'))?.body ?? '';
+    assert.equal((body.match(/no se ejecuta `/g) ?? []).length, 1);
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
index 2c414e1..0ebb4e2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
@@ -1,7 +1,7 @@
 /** TASK-100: decision unica de la verificacion proporcional, config y anotacion (puros). */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
@@ -85,7 +85,7 @@ test('anotarVerificacionDocumentacion: crea la seccion y en un reintento anade l
   assert.match(una, /## Verificacion de documentacion\n\n- 2026-11-10: solo docs; no se ejecuta `npm test`, sin comprobacion de documentacion declarada\n$/);
   const dos = anotarVerificacionDocumentacion(una, '2026-11-11', 'npm `x`', 'solo docs', 'node d.js');
   assert.equal((dos.match(/^## Verificacion de documentacion$/gm) ?? []).length, 1);
-  assert.match(dos, /- 2026-11-11: solo docs; no se ejecuta `npm 'x'`, se ejecuta `node d\.js`/);
+  assert.match(dos, /- 2026-11-11: solo docs; no se ejecuta `npm 'x'`, comprobacion de documentacion `node d\.js`/);
 });
 
 test('rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual', async () => {
@@ -108,3 +108,50 @@ test('rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual'
     await rm(dir, { recursive: true, force: true });
   }
 });
+
+// IMP-1 de la revision: desde una subcarpeta, las rutas y los patrones son de todo el repo.
+test('rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'rutas-subdir-'));
+  const g = (...a: string[]) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
+  try {
+    g('init', '-q', '-b', 'develop');
+    g('config', 'user.email', 't@t');
+    g('config', 'user.name', 't');
+    g('commit', '-q', '--allow-empty', '-m', 'init');
+    g('checkout', '-q', '-b', 'tarea');
+    for (const f of ['proj/docs/a.md', 'other/code.ts']) {
+      await mkdir(path.dirname(path.join(dir, f)), { recursive: true });
+      await writeFile(path.join(dir, f), 'x', 'utf8');
+    }
+    g('add', '-A');
+    g('commit', '-q', '-m', 'cambios');
+    const desdeSubcarpeta = rutasDeTarea('develop', 'HEAD', ['proj/docs/**'], path.join(dir, 'proj'));
+    assert.deepEqual(desdeSubcarpeta, { todas: ['other/code.ts', 'proj/docs/a.md'], fueraDeDocs: ['other/code.ts'] });
+    // Un patron relativo a la subcarpeta no casa: ante la duda, fuera de documentacion.
+    assert.deepEqual(rutasDeTarea('develop', 'HEAD', ['docs/**'], path.join(dir, 'proj'))?.fueraDeDocs, ['other/code.ts', 'proj/docs/a.md']);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
+
+// MEN-4 de la revision.
+test('config (TASK-100): un patron que casa con todo se rechaza', () => {
+  for (const p of ['"*"', '"**"', '"**/*"', '"**/**"', '"**/"']) {
+    assert.throws(
+      () => parsearConfig(`comando_verificacion: "npm test"\nrutas_documentacion: [docs/**, ${p}]\n`, 'c.yml'),
+      /casa con cualquier fichero/,
+      p
+    );
+  }
+  assert.deepEqual(
+    parsearConfig('comando_verificacion: "npm test"\nrutas_documentacion: ["*.md", "docs/*"]\n', 'c.yml').rutas_documentacion,
+    ['*.md', 'docs/*']
+  );
+});
+
+// MEN-1 de la revision.
+test('anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea', () => {
+  const una = anotarVerificacionDocumentacion('## Objetivo\n', '2026-11-10T10:00:00Z', 'npm test', 'solo docs', 'node d.js');
+  assert.equal(anotarVerificacionDocumentacion(una, '2026-11-10T10:05:00Z', 'npm test', 'solo docs', 'node d.js'), una);
+  assert.notEqual(anotarVerificacionDocumentacion(una, '2026-11-11', 'npm test', 'otro motivo', 'node d.js'), una);
+});
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff a6cf647fe4f1f5514904cf502d978285c34759c1..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-100/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-100/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-100/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-100/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-100/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-100/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-100/revision/informe-revision-1.md                                                  |   91 +++++++
 tareas/03-en-revision/TASK-100/revision/peticion-revision-1.md                                                 | 1136 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-100/tarea.md                                                       |   10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                          |   18 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                           |   17 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                     |   17 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                                |    7 +-
 13 files changed, 1278 insertions(+), 18 deletions(-)
````
