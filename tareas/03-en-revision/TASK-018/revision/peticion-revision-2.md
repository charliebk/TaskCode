# Peticion de revision — TASK-018 (ronda 2)

- Tarea: TASK-018 — Enrutado de revisor por diff real, fragmentado por dominio
- Rama revisada: feature/task-018-enrutado-de-revisor-por-diff-real-fragme
- Rama base: develop
- Commit revisado (HEAD): 375a9297d6a9fb7092e6414eaf252fdd09643c1e
- Fecha: 2026-09-12
- Agente revisor sugerido: code-quality-reviewer

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento y del agente que
hizo la ronda 1. Tu trabajo es reproducir empiricamente, no leer el diff
y opinar: clona el repo (o usa un worktree) a un directorio temporal,
corre la suite tu mismo y construye el caso que rompe el codigo antes de
reportarlo. Clasifica cada hallazgo como CRITICO (perdida de datos,
corrupcion de estado, el comando hace lo contrario de lo que dice),
IMPORTANTE (comportamiento incorrecto en un caso real, no de borde) o
MENOR (todo lo demas). Un "sin hallazgos" explicito tambien vale;
inventar hallazgos, no. Vuelca tu salida en el informe de esta ronda
(informe-revision-2.md), sin borrar la peticion.

## Que paso en la ronda 1

`informe-revision-1.md` (ya en este directorio) dio **cambios-solicitados**
con 2 IMPORTANTE y 2 MENOR. Resumen de los cuatro, y que se hizo con cada
uno — no des nada por bueno solo porque esta peticion lo diga, confirmalo
tu mismo:

- **IMPORTANTE-1**: la numeracion de ronda tras una ronda fragmentada por
  dominio (`RONDA_FILE_RE` en `review.ts`, consumido por `rondas.ts`)
  funcionaba, pero ningun test se ponia rojo si se revertia el
  reconocimiento del sufijo de dominio. Corregido con un test nuevo en
  `test/commands/review.test.ts` ("una segunda ronda numera -2 CON sufijo
  de dominio tras una ronda 1 fragmentada") que deja una ronda 1 YA
  fragmentada (dos informes con sufijo de dominio) y confirma que la
  siguiente llamada a `runReviewCommand` calcula ronda 2, no 1.
- **IMPORTANTE-2**: el mensaje de `taskctl review` con N peticiones
  (`cli.ts`, rama `cmd === 'review'`) no lo ejercitaba ningun test.
  Corregido con un test nuevo en `test/cli/main.test.ts` que corre el
  ciclo real `new -> plan -> approve -> start -> review` con un diff de 2
  dominios y confirma que el stdout lista las 3 lineas de peticion (java,
  angular, generico) y las 3 de "Lanza ese agente...".
- **MENOR-1**: la mitigacion de renombrado entre ecosistemas descrita en
  el plan (`git mv Foo.java Foo.cs`) no estaba implementada. Se evaluo y
  se documento como descartada (no como pendiente) en un comentario de
  `src/core/revisores.ts`, junto a `clasificarPorDominio`: clasificar por
  la ruta final del rename es correcto (no se pierde informacion, el
  fichero se revisa completo) y mas simple que la propuesta original.
- **MENOR-2**: `peticionTemplate` con 10 parametros posicionales. Se deja
  sin corregir en esta ronda (mantenibilidad, no comportamiento) — sigue
  documentado en `informe-revision-1.md`, no se repite aqui.

No des estos cuatro por buenos solo porque esta peticion lo diga:
confirma tu mismo que el codigo actual hace lo que aqui se afirma
(en particular, intenta reproducir tu propia mutacion sobre
`RONDA_FILE_RE`/`INFORME_REVISION_RE` y sobre el mensaje de `cli.ts`, y
confirma que AHORA si se ponen rojos los tests nuevos), y si algo no
cuadra, dilo como hallazgo nuevo. Revisa tambien con ojos frescos el
resto de la tarea, no solo estos cuatro puntos — la ronda 1 ya hizo su
propio barrido completo (mutaciones sobre `finish.ts` y el umbral,
CLI real de punta a punta con informes en blanco/pendientes/aprobados),
asi que no hace falta repetir eso desde cero salvo que quieras
verificarlo tu mismo.

## Commits a revisar desde la ronda 1 (git log b992da8..HEAD)

```
375a929 docs+test(TASK-018): informe de revision ronda 1 y correccion de los 2 IMPORTANTE
```

## Diff de codigo fuente y tests (git diff b992da8..HEAD -- src test)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
index 7e70912..df97079 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
@@ -252,6 +252,16 @@ export interface PlanDeRevision {
  * COMO UN GRUPO MAS — nunca se queda sin revisor (criterio de aceptacion
  * 4). Si la ronda no se fragmenta, esa distincion no importa: el
  * generico ya se lleva el diff completo.
+ *
+ * Renombrar entre ecosistemas (`git mv Foo.java Foo.cs`): el brainstorm
+ * de riesgos propuso clasificar por AMBAS rutas del `--name-status` y
+ * mandar al generico si discrepan; se evalua y se descarta (hallazgo
+ * MENOR de revision por pares, ronda 1). `diffNameOnly` (fs/git.ts) usa
+ * `--name-only`, que colapsa el rename a la ruta FINAL; esta funcion
+ * clasifica por esa unica ruta. Verificado que no se pierde informacion:
+ * el fichero se revisa completo (como alta) bajo el dominio de su ruta
+ * final, que es una lectura razonable y mas simple que la propuesta
+ * original.
  */
 export function clasificarPorDominio(
   ficheros: readonly string[],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index 36cc5c0..0065e8f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -8,7 +8,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
+import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
@@ -273,3 +273,74 @@ test('main: taskctl start sale con codigo 1 y mensaje util cuando el limite esta
     assert.equal(segunda.stderr.indexOf('[ERROR]'), segunda.stderr.lastIndexOf('[ERROR]'));
   });
 });
+
+// --- TASK-018: mensaje de "taskctl review" con N peticiones ---
+
+test('main: "taskctl review" con un diff de 2 dominios imprime una linea de peticion por revisor (hallazgo IMPORTANTE-2 de revision, TASK-018)', async () => {
+  await withTempRepoCwd(async (repoRoot) => {
+    const creada = await captureOutput(() =>
+      main(['new', '--titulo', 'Enrutado multi dominio', '--tipo', 'feature', '--complejidad', 'simple'])
+    );
+    assert.equal(creada.code, 0, creada.stderr);
+    await rellenarObjetivo(repoRoot, 'TASK-001');
+    commitAll(repoRoot, 'tarea nueva');
+
+    const plan = await captureOutput(() => main(['plan', 'TASK-001']));
+    assert.equal(plan.code, 0, plan.stderr);
+    commitAll(repoRoot, 'en diseno');
+
+    const approve = await captureOutput(() => main(['approve', 'TASK-001']));
+    assert.equal(approve.code, 0, approve.stderr);
+    commitAll(repoRoot, 'aprobada');
+
+    const start = await captureOutput(() => main(['start', 'TASK-001']));
+    assert.equal(start.code, 0, start.stderr);
+    commitAll(repoRoot, 'en curso');
+
+    // Dos ficheros de dominios distintos (mismas rutas que
+    // test/skills/revisores.test.ts, para no inventar una segunda tabla
+    // ruta -> dominio que pueda divergir de la que ya prueba eso contra
+    // las skills reales).
+    await mkdir(path.join(repoRoot, 'src', 'main', 'java', 'com', 'acme'), { recursive: true });
+    await writeFile(
+      path.join(repoRoot, 'src', 'main', 'java', 'com', 'acme', 'UserService.java'),
+      'class UserService {}\n',
+      'utf8'
+    );
+    await mkdir(path.join(repoRoot, 'src', 'app', 'user-profile'), { recursive: true });
+    await writeFile(
+      path.join(repoRoot, 'src', 'app', 'user-profile', 'user-profile.component.ts'),
+      'export class UserProfileComponent {}\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'servicio Java y componente Angular');
+
+    const { code, stdout } = await captureOutput(() => main(['review', 'TASK-001']));
+
+    assert.equal(code, 0, stdout);
+    // Un grupo por dominio (java, angular) mas el generico (tarea.md no
+    // casa ningun dominio): 3 lineas de peticion, cada una con su propio
+    // nombre de fichero y su propio revisor — antes de esta correccion,
+    // ningun test comprobaba que el CLI (no solo runReviewCommand) listara
+    // TODAS las peticiones y no, por ejemplo, solo la primera.
+    const lineasPeticion = stdout
+      .split('\n')
+      .filter((linea) => linea.startsWith('Peticion de revision'));
+    assert.equal(lineasPeticion.length, 3, stdout);
+    assert.ok(
+      lineasPeticion.some((l) => l.includes('java-spring-reviewer') && l.includes('peticion-revision-1-java-spring-reviewer.md')),
+      stdout
+    );
+    assert.ok(
+      lineasPeticion.some((l) => l.includes('angular-vue-reviewer') && l.includes('peticion-revision-1-angular-vue-reviewer.md')),
+      stdout
+    );
+    assert.ok(
+      lineasPeticion.some((l) => l.includes('code-quality-reviewer') && l.includes('peticion-revision-1-code-quality-reviewer.md')),
+      stdout
+    );
+    // Una linea de "Lanza ese agente..." por cada peticion tambien.
+    const lineasLanza = stdout.split('\n').filter((linea) => linea.includes('Lanza ese agente'));
+    assert.equal(lineasLanza.length, 3, stdout);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
index f3d7ba0..fc1f2d5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -676,6 +676,73 @@ test('taskctl review: un diff sin match de dominio (rutas ajenas y .md) sigue ca
   });
 });
 
+test('taskctl review: una segunda ronda numera -2 CON sufijo de dominio tras una ronda 1 fragmentada (hallazgo IMPORTANTE-1 de revision, TASK-018)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-625', rama: 'feature/task-625-segunda-ronda-fragmentada' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    // Restos commiteados de una ronda 1 YA fragmentada por dominio (dos
+    // revisores, cada uno con su sufijo) — el mismo escenario que dejaria
+    // un ciclo review -> cambios-solicitados -> correccion -> review otra
+    // vez. Antes de esta tarea, RONDA_FILE_RE no reconocia estos nombres
+    // con sufijo y una regresion aqui no la detecta ningun otro test de
+    // la suite (informe de revision, IMPORTANTE-1).
+    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-625', 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(
+      path.join(revisionDir, 'peticion-revision-1-java-spring-reviewer.md'),
+      'ronda 1, java\n',
+      'utf8'
+    );
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
+      '- Veredicto: cambios-solicitados\n',
+      'utf8'
+    );
+    await writeFile(
+      path.join(revisionDir, 'peticion-revision-1-code-quality-reviewer.md'),
+      'ronda 1, generico\n',
+      'utf8'
+    );
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-code-quality-reviewer.md'),
+      '- Veredicto: aprobada\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'restos de la ronda 1 fragmentada');
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {} // correccion de la ronda 1\n'
+    );
+    commitAll(repoRoot, 'correccion pedida en la ronda 1');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-625'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // La ronda siguiente es la 2, no la 1: siguienteRonda tuvo que
+    // reconocer los nombres CON sufijo de la ronda 1 para no pisarlos.
+    assert.equal(result.ronda, 2);
+    assert.ok(result.informes.length >= 1);
+    for (const grupo of result.informes) {
+      assert.match(grupo.peticionPath, /-revision-2(-[a-z0-9-]+)?\.md$/);
+      assert.match(grupo.informePath, /-revision-2(-[a-z0-9-]+)?\.md$/);
+    }
+    // La ronda 1 fragmentada sigue intacta, sin que la ronda 2 la pise.
+    await stat(
+      path.join(
+        tareasRoot,
+        '03-en-revision',
+        'TASK-625',
+        'revision',
+        'informe-revision-1-java-spring-reviewer.md'
+      )
+    );
+  });
+});
+
 test('taskctl review: error claro si falta el ID o la tarea no existe', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await assert.rejects(
````
