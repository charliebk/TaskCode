# Peticion de revision — TASK-092 (ronda 1)

- Tarea: TASK-092 — Sincronización de ficheros sueltos de la raíz de tareas/
- Rama revisada: feature/task-092-sincronizacion-de-ficheros-sueltos-de-la
- Rama base: develop
- Commit revisado (HEAD): 97a0d2cc99f682342ae76fd66a72f267af4cfb6a
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-092 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-092/tarea.md
- tareas/03-en-revision/TASK-092/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-raiz-tareas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts

## Commits a revisar (git log develop..HEAD)

````
97a0d2c docs(TASK-092): autorrevision
4b8aec1 fix(TASK-092): las carpetas prohibidas se comparan sin puntos ni espacios finales
93921c9 feat(TASK-092): rutas_sincronizacion admite un fichero suelto en la raiz de tareas/
ba6bac0 chore(TASK-092): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 304942e..fb7f3d5 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,5 +1,25 @@
 # Changelog
 
+## 0.14.0 — sin publicar
+
+Sincronizacion de un fichero suelto en la raiz de `tareas/` (TASK-092).
+`rutas_sincronizacion` admite ahora un fichero directamente en `tareas/` (p. ej.
+`tareas/ROADMAP.md`), que se regenera en cada transicion dentro del mismo commit
+como cualquier otra ruta sincronizada. Antes se rechazaba todo lo que colgaba de
+`tareas/`, y un roadmap que vivia ahi se quedaba atrasado tras `plan`, `start`,
+`review` o `finish`. `taskctl` solo escribe dentro de las carpetas de estado
+(`tareas/0N-*/`), asi que un fichero suelto no choca con lo que escribe el CLI.
+Se siguen rechazando las rutas dentro de una carpeta de estado o de cualquier
+otra subcarpeta de `tareas/`, la propia carpeta `tareas`, `.taskcode/` y `.git/`.
+Las tres salvaguardas (ruta con cambios previos, comando que falla, fichero no
+declarado) funcionan igual con estas rutas. `informe_cobertura` no cambia.
+
+Cambio de comportamiento: la comparacion de las carpetas prohibidas ya no
+distingue mayusculas. `Tareas/01-en-diseno/x.md`, `.GIT/HEAD` o
+`.TaskCode/config.yml` pasaban antes la validacion (en Windows y macOS son las
+mismas carpetas) y ahora abortan al leer la config, en `rutas_sincronizacion` y
+en `informe_cobertura`.
+
 ## 0.13.0 — 2026-11-09
 
 Verificacion selectiva por impacto (TASK-091). Clave nueva opcional
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 1349a8c..e5b34cf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -559,6 +559,31 @@ no porque no fuera técnicamente posible — se deja anotado como opción más
 barata que esperar a una sesión nativa, por si alguien quiere intentarlo
 antes.
 
+## Sincronización de ficheros derivados
+
+Un proyecto puede regenerar en cada transición los ficheros que derivan del
+estado de las tareas (un plan, un tablero, un roadmap) con
+`comando_sincronizacion` y `rutas_sincronizacion` en `.taskcode/config.yml`;
+lo que el comando reescribe entra en el mismo commit de la transición. La guía
+completa (claves, salvaguardas, conflictos de merge) está en la skill
+`task-workflow`, en `sincronizacion.md`.
+
+Las rutas son ficheros relativos a la raíz del repo, fuera de `.taskcode/` y
+`.git/`. De `tareas/` solo se admite un fichero suelto en su raíz:
+
+```yaml
+comando_sincronizacion: "node scripts/roadmap.mjs"
+rutas_sincronizacion: [tareas/ROADMAP.md, docs/PLAN.md]
+```
+
+El motivo: `taskctl` solo escribe dentro de las carpetas de estado
+(`tareas/00-planificadas/` … `tareas/04-terminadas/`), así que un fichero suelto
+en la raíz de `tareas/` no choca con lo que escribe la herramienta, y sin esa
+excepción un roadmap que vive ahí se quedaba atrasado tras cada transición.
+`tareas/01-en-diseno/x.md`, `tareas/otra/x.md` y `tareas` (la carpeta) se
+siguen rechazando, sin distinguir mayúsculas. `informe_cobertura` no tiene esta
+excepción.
+
 ## Problemas conocidos
 
 ### Un subagente se deniega con «Auto-Mode Bypass»
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
index 5023e1f..219b1ad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
@@ -13,7 +13,14 @@ un comando que reescribe esos ficheros y la lista de rutas que modifica.
 - **`rutas_sincronizacion`**: lista de ficheros que ese comando reescribe,
   en sintaxis flow (entre corchetes): `[docs/PLAN.md, docs/BOARD.md]`. Rutas
   relativas a la raiz del repo, siempre ficheros, nunca carpetas ni la raiz
-  del repo. No pueden estar bajo `tareas/` ni bajo `.taskcode/`.
+  del repo. No pueden estar bajo `.taskcode/` ni bajo `.git/`. De `tareas/`
+  solo se admite un fichero suelto en su raiz (p. ej. `tareas/ROADMAP.md`):
+  `taskctl` solo escribe dentro de las carpetas de estado (`tareas/00-planificadas/`
+  a `tareas/04-terminadas/`), asi que un fichero suelto no choca con lo que
+  escribe la herramienta. Lo que cuelga de una carpeta de estado o de
+  cualquier otra subcarpeta de `tareas/` se rechaza. La comparacion no
+  distingue mayusculas (`Tareas/01-en-diseno/x.md` o `.GIT/HEAD` tambien se
+  rechazan).
 - **`timeout_sincronizacion`**: numero de segundos (entero ≥ 1) para esperar
   al comando. Opcional; por defecto, 60 segundos. Solo es valida si estan las
   otras dos claves.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 9ae26d1..4c4ee82 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -100,6 +100,7 @@ import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
 import { distanciaEdicion, masParecida } from './sugerencia.js';
 import { normalizarBase, type Plataforma } from './plataforma-remota.js';
+import { STATE_FOLDER } from './task.js';
 
 export class ConfigError extends Error {
   constructor(message: string) {
@@ -276,9 +277,18 @@ export const CLAVES_CONFIG = [
  * Carpetas raiz donde una ruta de sincronizacion no puede vivir: las
  * gestiona taskctl (tareas/, .taskcode/) o Git (.git/). Declarar algo
  * ahi haria que el comando del proyecto y el CLI escribieran lo mismo.
+ *
+ * Excepcion (TASK-092): un fichero suelto directamente en la raiz de
+ * tareas/ (p. ej. tareas/ROADMAP.md). taskctl solo escribe dentro de las
+ * carpetas de estado (tareas/0N-*), asi que ahi no hay choque posible.
+ * La comparacion no distingue mayusculas: en Windows y macOS `Tareas/` y
+ * `.GIT/` son las mismas carpetas.
  */
 const RAICES_PROHIBIDAS_SINCRONIZACION = ['tareas', '.taskcode', '.git'] as const;
 
+/** Nombres de las carpetas de estado, en minusculas, para compararlos sin distinguir mayusculas. */
+const CARPETAS_DE_ESTADO = Object.values(STATE_FOLDER).map((c) => c.toLowerCase());
+
 export const CONFIG_DIR = '.taskcode';
 export const CONFIG_FILE = 'config.yml';
 
@@ -820,12 +830,13 @@ function validarRutasSincronizacion(donde: string, valor: unknown): readonly str
       );
     }
     const original = elemento.trim();
-    const motivo = motivoRutaInvalida(original);
+    const motivo = motivoRutaInvalida(original, { ficheroEnRaizDeTareas: true });
     if (motivo !== null) {
       throw new ConfigError(
         `[ERROR] ${donde}: la ruta de sincronizacion "${original}" no vale: ${motivo}.\n` +
-          '        Solo ficheros, relativos a la raiz del repo, fuera de tareas/, .taskcode/ ' +
-          'y .git/.'
+          '        Solo ficheros, relativos a la raiz del repo, fuera de .taskcode/ y .git/; ' +
+          'de tareas/ solo un fichero suelto en su raiz (p. ej. tareas/ROADMAP.md), ' +
+          'nunca dentro de una carpeta de estado.'
       );
     }
     const normalizada = path.posix.normalize(original.replace(/\\/g, '/'));
@@ -834,19 +845,52 @@ function validarRutasSincronizacion(donde: string, valor: unknown): readonly str
   return rutas;
 }
 
-/** null si la ruta es aceptable; si no, el motivo en palabras de persona. */
-function motivoRutaInvalida(original: string): string | null {
+/**
+ * Un segmento de ruta tal como lo resuelve el sistema de ficheros mas
+ * permisivo: sin distinguir mayusculas y sin los puntos y espacios finales,
+ * que Windows ignora (`tareas/01-en-diseno./x.md` es `tareas/01-en-diseno/x.md`).
+ */
+function nombreComparable(segmento: string): string {
+  return segmento.toLowerCase().replace(/[. ]+$/, '');
+}
+
+/**
+ * null si la ruta es aceptable; si no, el motivo en palabras de persona.
+ *
+ * `ficheroEnRaizDeTareas` abre la excepcion de TASK-092 (un fichero suelto
+ * en tareas/). Solo la pide rutas_sincronizacion: informe_cobertura sigue
+ * rechazando todo lo que cuelga de tareas/.
+ */
+function motivoRutaInvalida(
+  original: string,
+  opciones: { ficheroEnRaizDeTareas?: boolean } = {}
+): string | null {
   const conBarras = original.replace(/\\/g, '/');
   if (conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras)) return 'es absoluta';
   if (conBarras.endsWith('/')) return 'es una carpeta';
   const normalizada = path.posix.normalize(conBarras);
   if (normalizada === '.' || normalizada === '') return 'es la raiz del repo';
   if (normalizada === '..' || normalizada.startsWith('../')) return 'se sale del repo';
-  const primera = normalizada.split('/')[0] as string;
-  if ((RAICES_PROHIBIDAS_SINCRONIZACION as readonly string[]).includes(primera)) {
-    return `esta bajo ${primera}/, que no es del proyecto sino de la herramienta`;
+  const segmentos = normalizada.split('/');
+  const primera = segmentos[0] as string;
+  const primeraMin = nombreComparable(primera);
+  if (!(RAICES_PROHIBIDAS_SINCRONIZACION as readonly string[]).includes(primeraMin)) return null;
+  if (primeraMin === 'tareas' && opciones.ficheroEnRaizDeTareas === true) {
+    if (segmentos.length === 1) return `es la carpeta ${primera}/, no un fichero`;
+    const segunda = segmentos[1] as string;
+    if (CARPETAS_DE_ESTADO.includes(nombreComparable(segunda))) {
+      return (
+        `${primera}/${segunda} es una carpeta de estado, y lo que hay en ella ` +
+        'lo escribe taskctl'
+      );
+    }
+    if (segmentos.length === 2) return null;
+    return (
+      `esta en una subcarpeta de ${primera}/; de ${primera}/ solo se admite un fichero ` +
+      'suelto en su raiz'
+    );
   }
-  return null;
+  return `esta bajo ${primera}/, que no es del proyecto sino de la herramienta`;
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-raiz-tareas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-raiz-tareas.test.ts
new file mode 100644
index 0000000..ca92dd6
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-raiz-tareas.test.ts
@@ -0,0 +1,182 @@
+/**
+ * TASK-092: un fichero derivado suelto en la raiz de tareas/
+ * (tareas/ROADMAP.md) se regenera en cada transicion, dentro del mismo
+ * commit, igual que uno de docs/. Repos Git temporales reales, los
+ * scripts de Git-Flow del repo y un script de sincronizacion de verdad.
+ */
+// Parte de los tests de sincronizacion (ver test/helpers/sincronizacion-fixtures.ts).
+
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { writeFile, readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { runNewCommand } from '../../src/commands/new.js';
+import { runPlanCommand } from '../../src/commands/plan.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
+import {
+  SCRIPTS_DIR,
+  git,
+  commitAll,
+  porcelain,
+  ficherosDeHead,
+  scriptSync,
+  configSync,
+  withRepoSincronizado,
+  tocarTarea,
+  reescribirScript,
+} from '../helpers/sincronizacion-fixtures.js';
+
+const ROADMAP = 'tareas/ROADMAP.md';
+const SCRIPT_ROADMAP = scriptSync(ROADMAP);
+const CONFIG_ROADMAP = configSync(ROADMAP);
+
+async function roadmapEnDisco(repoRoot: string): Promise<string> {
+  return (await readFile(path.join(repoRoot, 'tareas', 'ROADMAP.md'), 'utf8')).trim();
+}
+
+/** Tras cada transicion: aplicada, el ROADMAP en el commit, arbol limpio y la fila esperada. */
+async function comprobarTransicion(
+  repoRoot: string,
+  paso: string,
+  estado: string,
+  filaEsperada: string
+): Promise<void> {
+  assert.equal(estado, 'aplicada', `${paso}: la sincronizacion no se aplico`);
+  assert.ok(ficherosDeHead(repoRoot).includes(ROADMAP), `${paso}: el ROADMAP no va en el commit`);
+  assert.equal(porcelain(repoRoot), '', `${paso}: el arbol quedo sucio`);
+  const lineas = (await roadmapEnDisco(repoRoot)).split('\n');
+  assert.ok(lineas.includes(filaEsperada), `${paso}: falta "${filaEsperada}" en:\n${lineas.join('\n')}`);
+}
+
+test('sincronizacion raiz de tareas/: new -> plan -> approve -> start -> review -> finish regeneran tareas/ROADMAP.md en el commit de cada transicion', async () => {
+  await withRepoSincronizado(
+    CONFIG_ROADMAP,
+    async (repoRoot, tareasRoot) => {
+      const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
+
+      const n = await runNewCommand(
+        tareasRoot,
+        [
+          '--titulo', 'Tarea del roadmap',
+          '--tipo', 'feature',
+          '--objetivo', 'Que el comando de prueba devuelva 0 con la entrada de ejemplo.',
+          '--criterio', 'El comando de prueba devuelve 0 con la entrada de ejemplo',
+        ],
+        '2026-11-10',
+        { repoCwd: repoRoot }
+      );
+      const id = n.id;
+      await comprobarTransicion(repoRoot, 'new', n.autoCommit.sincronizacion.estado, `${id} 00-planificadas`);
+
+      const p = await runPlanCommand(tareasRoot, [id], '2026-11-10', { repoCwd: repoRoot });
+      await comprobarTransicion(repoRoot, 'plan', p.autoCommit.sincronizacion.estado, `${id} 01-en-diseno`);
+
+      // El plan lo redacta una persona: commit acotado al plan, el ROADMAP no se toca.
+      await writeFile(p.planPath, '# Plan\n\nEnfoque: regenerar el roadmap.\n', 'utf8');
+      git(['add', '--', p.planPath], repoRoot);
+      git(['commit', '-q', '-m', `docs(${id}): plan final`, '--', p.planPath], repoRoot);
+
+      const a = await runApproveCommand(tareasRoot, [id], '2026-11-10', deps);
+      await comprobarTransicion(repoRoot, 'approve', a.autoCommit.sincronizacion.estado, `${id} 01-en-diseno aprobado`);
+
+      const s = await runStartCommand(tareasRoot, [id], '2026-11-10', deps);
+      await comprobarTransicion(repoRoot, 'start', s.autoCommit.sincronizacion.estado, `${id} 02-en-curso aprobado`);
+
+      await writeFile(path.join(repoRoot, 'README.md'), 'repo con trabajo\n', 'utf8');
+      git(['add', '--', 'README.md'], repoRoot);
+      git(['commit', '-q', '-m', `feat(${id}): trabajo`, '--', 'README.md'], repoRoot);
+
+      const v = await runReviewCommand(tareasRoot, [id], '2026-11-10', deps);
+      await comprobarTransicion(repoRoot, 'review', v.autoCommit.sincronizacion.estado, `${id} 03-en-revision aprobado`);
+
+      const informe = path.join(tareasRoot, '03-en-revision', id, 'revision', 'informe-revision-1.md');
+      await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n', 'utf8');
+      commitAll(repoRoot, `docs(${id}): informe de revision`);
+
+      const f = await runFinishCommand(tareasRoot, [id], '2026-11-10', deps);
+      assert.equal(f.autoCommit.rama, 'develop');
+      await comprobarTransicion(repoRoot, 'finish', f.autoCommit.sincronizacion.estado, `${id} 04-terminadas aprobado`);
+      // Lo commiteado en develop es lo que hay en disco.
+      assert.equal(git(['show', `HEAD:${ROADMAP}`], repoRoot).trim(), await roadmapEnDisco(repoRoot));
+    },
+    SCRIPT_ROADMAP
+  );
+});
+
+test('sincronizacion raiz de tareas/ (a): si tareas/ROADMAP.md ya tenia cambios, no se ejecuta y el cambio de la persona sigue intacto', async () => {
+  await withRepoSincronizado(
+    CONFIG_ROADMAP,
+    async (repoRoot, tareasRoot) => {
+      await writeFile(path.join(repoRoot, 'tareas', 'ROADMAP.md'), 'edicion a mano\n', 'utf8');
+      const dir = await tocarTarea(tareasRoot);
+
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+      assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
+      assert.equal(r.commiteado, true, 'la tarea se commitea igual');
+      assert.ok(!ficherosDeHead(repoRoot).includes(ROADMAP));
+      assert.equal(await roadmapEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
+      assert.match(r.avisos.join('\n'), /No se ha ejecutado la sincronizacion: tareas\/ROADMAP\.md/);
+    },
+    SCRIPT_ROADMAP
+  );
+});
+
+test('sincronizacion raiz de tareas/ (b): si el script falla tras escribir, tareas/ROADMAP.md vuelve a HEAD y la tarea se commitea', async () => {
+  await withRepoSincronizado(
+    CONFIG_ROADMAP,
+    async (repoRoot, tareasRoot) => {
+      const enHead = await roadmapEnDisco(repoRoot);
+      await reescribirScript(
+        repoRoot,
+        "import { writeFileSync } from 'node:fs';\nwriteFileSync('tareas/ROADMAP.md', 'a medias\\n');\n" +
+          "console.error('se rompio a mitad');\nprocess.exit(4);\n"
+      );
+      const dir = await tocarTarea(tareasRoot);
+
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      assert.equal(r.commiteado, true);
+      assert.ok(ficherosDeHead(repoRoot).includes('tareas/01-en-diseno/TASK-920/nota.md'));
+      assert.ok(!ficherosDeHead(repoRoot).includes(ROADMAP));
+      assert.equal(await roadmapEnDisco(repoRoot), enHead, 'el ROADMAP a medias no se restauro');
+      assert.equal(porcelain(repoRoot), '');
+      assert.match(r.avisos.join('\n'), /salio con codigo 4: se rompio a mitad/);
+    },
+    SCRIPT_ROADMAP
+  );
+});
+
+test('sincronizacion raiz de tareas/ (c): un fichero no declarado en tareas/ no entra en el commit y se nombra en el aviso', async () => {
+  await withRepoSincronizado(
+    CONFIG_ROADMAP,
+    async (repoRoot, tareasRoot) => {
+      await reescribirScript(
+        repoRoot,
+        SCRIPT_ROADMAP + "writeFileSync('tareas/OTRO.md', 'no declarado\\n');\n"
+      );
+      const dir = await tocarTarea(tareasRoot);
+      // Un cambio de estado de verdad, para que el ROADMAP cambie.
+      const tareaMd = path.join(dir, 'tarea.md');
+      await writeFile(
+        tareaMd,
+        (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
+      );
+
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+      assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
+      const enCommit = ficherosDeHead(repoRoot);
+      assert.ok(enCommit.includes(ROADMAP), 'el ROADMAP declarado deberia entrar');
+      assert.ok(!enCommit.includes('tareas/OTRO.md'), 'se commiteo un fichero no declarado');
+      assert.match(porcelain(repoRoot), /^\?\? tareas\/OTRO\.md$/m, 'el fichero ajeno no se debe tocar');
+      assert.match(r.avisos.join('\n'), /no estan en rutas_sincronizacion: tareas\/OTRO\.md/);
+    },
+    SCRIPT_ROADMAP
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
index 2ea4cad..93c368d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
@@ -59,9 +59,27 @@ test('config sincronizacion: rutas invalidas abortan al cargar', () => {
     ['[docs/../../x.md]', /se sale del repo/],
     ['[/etc/passwd]', /es absoluta/],
     ['[C:/x.md]', /es absoluta/],
-    ['[tareas/x.md]', /esta bajo tareas\//],
+    // TASK-092: '[tareas/x.md]' salio de esta lista (ahora se acepta, ver el
+    // test de la raiz de tareas/); en su lugar, los rechazos de dentro de tareas/.
+    ['[tareas]', /es la carpeta tareas\/, no un fichero/],
+    ['[tareas/]', /es una carpeta/],
+    ['[tareas/01-en-diseno]', /tareas\/01-en-diseno es una carpeta de estado/],
+    ['[tareas/01-en-diseno/x.md]', /es una carpeta de estado/],
+    ['[tareas/04-terminadas/TASK-1/tarea.md]', /es una carpeta de estado/],
+    ['[tareas/otra/x.md]', /esta en una subcarpeta de tareas\//],
+    ['[docs/../tareas/02-en-curso/x.md]', /es una carpeta de estado/],
     ['[.taskcode/config.yml]', /esta bajo \.taskcode\//],
     ['[.git/HEAD]', /esta bajo \.git\//],
+    // Sin distinguir mayusculas: en Windows y macOS son las mismas carpetas.
+    ['[Tareas/01-en-diseno/x.md]', /Tareas\/01-en-diseno es una carpeta de estado/],
+    ['[TAREAS/02-En-Curso/x.md]', /es una carpeta de estado/],
+    ['[.GIT/HEAD]', /esta bajo \.GIT\//],
+    ['[.TaskCode/config.yml]', /esta bajo \.TaskCode\//],
+    // Windows ignora los puntos y espacios finales de cada segmento.
+    ['[tareas/01-en-diseno./x.md]', /es una carpeta de estado/],
+    ['["tareas/02-en-curso /x.md"]', /es una carpeta de estado/],
+    ['[tareas./01-en-diseno/x.md]', /es una carpeta de estado/],
+    ['[.git./HEAD]', /esta bajo \.git\.\//],
     ['[]', /lista no vacia/],
     ['docs/PLAN.md', /lista no vacia entre corchetes/],
   ];
@@ -70,6 +88,45 @@ test('config sincronizacion: rutas invalidas abortan al cargar', () => {
   }
 });
 
+test('config sincronizacion: un fichero suelto en la raiz de tareas/ se acepta y se normaliza (TASK-092)', () => {
+  const c = parsearConfig(
+    BASE +
+      'rutas_sincronizacion: [tareas/ROADMAP.md, "./tareas/ROADMAP.md", tareas\\ROADMAP.md, ' +
+      'tareas/01-en-diseno/../ROADMAP.md, tareas/.oculto, docs/PLAN.md]\n',
+    RUTA
+  );
+  assert.deepEqual(c.rutas_sincronizacion, ['tareas/ROADMAP.md', 'tareas/.oculto', 'docs/PLAN.md']);
+  // Cada carpeta de estado sigue cerrada, tambien con un solo fichero debajo.
+  for (const carpeta of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
+    rechaza(BASE + `rutas_sincronizacion: [tareas/${carpeta}/x.md]\n`, /es una carpeta de estado/);
+  }
+});
+
+test('config sincronizacion: informe_cobertura sigue sin admitir nada bajo tareas/ (TASK-092)', () => {
+  rechaza('informe_cobertura: tareas/x.lcov\n', /esta bajo tareas\//);
+  rechaza('informe_cobertura: Tareas/x.lcov\n', /esta bajo Tareas\//);
+});
+
+test('resolverConfig: tareas/ROADMAP.md se acepta; si en disco es una carpeta, aborta (TASK-092)', async () => {
+  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-cfgsync-'));
+  try {
+    await mkdir(path.join(repo, '.git'));
+    await mkdir(path.join(repo, 'tareas', 'ROADMAP.md'), { recursive: true });
+    await mkdir(path.join(repo, '.taskcode'));
+    await writeFile(
+      path.join(repo, '.taskcode', 'config.yml'),
+      BASE + 'rutas_sincronizacion: [tareas/ROADMAP.md]\n',
+      'utf8'
+    );
+    assert.throws(() => resolverConfig(repo), /"tareas\/ROADMAP\.md" es una carpeta/);
+    await rm(path.join(repo, 'tareas', 'ROADMAP.md'), { recursive: true });
+    await writeFile(path.join(repo, 'tareas', 'ROADMAP.md'), '# roadmap\n', 'utf8');
+    assert.deepEqual(resolverConfig(repo).rutas_sincronizacion, ['tareas/ROADMAP.md']);
+  } finally {
+    await rm(repo, { recursive: true, force: true });
+  }
+});
+
 test('config sincronizacion: comando vacio y timeout no positivo abortan', () => {
   rechaza('comando_sincronizacion: ""\nrutas_sincronizacion: [a.md]\n', /debe ser un comando/);
   rechaza(BASE + 'rutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n', /Son segundos/);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts
index bd0fafe..4348b2b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts
@@ -76,10 +76,13 @@ export function sampleTask(overrides: Partial<Task> = {}): Task {
 }
 
 /**
- * Regenera docs/PLAN.md: una linea por tarea con su carpeta y si el
- * plan esta aprobado. Lee el estado de disco, como el script real.
+ * Regenera `ruta` (por defecto docs/PLAN.md): una linea por tarea con su
+ * carpeta y si el plan esta aprobado. Lee el estado de disco, como el
+ * script real. TASK-092 la parametriza para probar tareas/ROADMAP.md.
  */
-export const SCRIPT_SYNC = `import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
+export function scriptSync(ruta: string): string {
+  const carpeta = ruta.includes('/') ? ruta.slice(0, ruta.lastIndexOf('/')) : '.';
+  return `import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
 const filas = [];
 for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
   const d = 'tareas/' + c;
@@ -89,12 +92,18 @@ for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revisi
     filas.push(id + ' ' + c + (/plan_aprobado: true/.test(md) ? ' aprobado' : ''));
   }
 }
-mkdirSync('docs', { recursive: true });
-writeFileSync('docs/PLAN.md', filas.sort().join('\\n') + '\\n');
+mkdirSync('${carpeta}', { recursive: true });
+writeFileSync('${ruta}', filas.sort().join('\\n') + '\\n');
 `;
+}
+
+export const SCRIPT_SYNC = scriptSync('docs/PLAN.md');
+
+export function configSync(ruta: string): string {
+  return `comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [${ruta}]\n`;
+}
 
-export const CONFIG_SYNC =
-  'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/PLAN.md]\n';
+export const CONFIG_SYNC = configSync('docs/PLAN.md');
 
 /**
  * Repo con develop, el script de sincronizacion, la config que lo
@@ -103,7 +112,8 @@ export const CONFIG_SYNC =
  */
 export async function withRepoSincronizado(
   config: string | null,
-  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>,
+  script: string = SCRIPT_SYNC
 ): Promise<void> {
   const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sync-'));
   try {
@@ -122,7 +132,7 @@ export async function withRepoSincronizado(
     // TASK-043: approve rechaza un plan que es solo una cabecera.
     await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n\nEnfoque: sincronizar.\n', 'utf8');
     await mkdir(path.join(repoRoot, 'scripts'), { recursive: true });
-    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), SCRIPT_SYNC, 'utf8');
+    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), script, 'utf8');
     if (config !== null) {
       await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
       await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-092/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-092/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-092/tarea.md                                    |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                      | 56 +++++++++++++++++++++++++++++++++++++++++++++++---------
 4 files changed, 53 insertions(+), 10 deletions(-)
````
