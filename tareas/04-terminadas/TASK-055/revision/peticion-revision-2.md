# Peticion de revision — TASK-055 (ronda 2)

- Tarea: TASK-055 — Flujo A: taskctl desde PowerShell y cmd
- Rama revisada: feature/task-055-flujo-guiado-por-fases-con-modos-manual
- Rama base: develop
- Commit revisado (HEAD): b87c0be8bdf033901cd9e394c0201d717d17625b
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-055 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 0da1627c54d66ba2720d8ba69be1021f59754b73 (el commit revisado en la ronda anterior)

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
| CRIT-1 | CRITICO | abierto | bin/taskctl.cmd:5 y README.md («Usar `taskctl` fuera de Claude Code») | informe-revision-1.md |
| MEN-1 | MENOR | abierto | test/empaquetado/distribucion.test.ts (argumentos) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | bin/taskctl.cmd:5 | informe-revision-1.md |
| MEN-3 | MENOR | abierto (se propone aceptar) | bin/taskctl.cmd:5 | informe-revision-1.md |
| MEN-4 | MENOR | abierto (se propone aceptar) | README.md (funcion de perfil de PowerShell) | informe-revision-1.md |

## Commits a revisar (git log 0da1627c54d66ba2720d8ba69be1021f59754b73..HEAD)

````
b87c0be docs(TASK-055): correcciones de la ronda 1 en el resultado
068e38b test(TASK-055): comparar el valor del titulo, no su forma
d14470d fix(TASK-055): PowerShell por la funcion de perfil, no por el .cmd (CRIT-1, MEN-1, MEN-2, MEN-4)
52e4757 chore(TASK-055): veredicto ronda 1 (cambios-solicitados)
f11f13d docs(TASK-055): informe de revision ronda 1
cbf4369 chore(TASK-055): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 0da1627c54d66ba2720d8ba69be1021f59754b73..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 0974931..53d233c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -99,36 +99,40 @@ comando suelto o a reestructurar el plugin.
 Dentro de Claude Code no hay que hacer nada: `bin/` entra en el PATH del
 Bash tool mientras el plugin esta habilitado. **Fuera** (tu propia terminal)
 no: ni esta en el PATH ni, en Windows, PowerShell y cmd saben ejecutar
-`bin/taskctl`, que es un script de node sin extension. Para eso esta
-`bin/taskctl.cmd` (desde la version que sigue a la 0.3.0).
+`bin/taskctl`, que es un script de node sin extension.
 
 El plugin instalado vive en
 `~/.claude/plugins/cache/<marketplace>/taskcode-plugin/<version>/` (en
 Windows, `%USERPROFILE%\.claude\plugins\cache\...`). Hace falta `node` en
-el PATH. Tres formas, de la mas puntual a la mas comoda:
+el PATH. Una forma por shell:
 
-**Ruta completa, una vez** (cualquier version, cualquier shell):
-
-```powershell
-node "$env:USERPROFILE\.claude\plugins\cache\taskcode-marketplace\taskcode-plugin\0.3.0\bin\taskctl" approve TASK-005
-```
-
-**PowerShell, permanente**: anade esto a tu perfil (`notepad $PROFILE`). Elige
-la version instalada mas alta, asi que sobrevive a las actualizaciones del
-plugin, y funciona tambien con versiones sin `taskctl.cmd`:
+**PowerShell**: anade esto a tu perfil (`notepad $PROFILE`). Llama a `node`
+directamente y elige la version instalada mas alta, asi que sobrevive a las
+actualizaciones del plugin:
 
 ```powershell
 $taskcodeBase = Join-Path $env:USERPROFILE '.claude\plugins\cache\taskcode-marketplace\taskcode-plugin'
 function taskctl {
   $bin = Get-ChildItem $taskcodeBase -Directory |
-    Sort-Object { [version]$_.Name } | Select-Object -Last 1
+    Where-Object { $_.Name -as [version] } |
+    Sort-Object { $_.Name -as [version] } | Select-Object -Last 1
   node (Join-Path $bin.FullName 'bin\taskctl') @args
 }
 ```
 
-**cmd o PATH de Windows**: anade la carpeta `bin` de la version instalada al
-PATH del usuario; `taskctl` resuelve a `taskctl.cmd`. Hay que actualizar la
-ruta cuando cambie la version del plugin.
+**No pongas `bin` en el PATH para usarlo desde PowerShell.** Ahi `taskctl`
+resolveria a `bin\taskctl.cmd`, y PowerShell le pasa sin comillas los
+argumentos que no llevan espacios: un titulo como `Q&A` o `foo->notas.txt`
+lo interpreta cmd.exe, que ejecuta `A` o vacia `notas.txt`. La funcion de
+arriba no pasa por cmd y no tiene ese problema.
+
+**cmd**: `bin\taskctl.cmd` (desde la version que sigue a la 0.3.0). Anade la
+carpeta `bin` de la version instalada al PATH y escribe `taskctl`. Pon
+**siempre entre comillas dobles** los argumentos con `& | < > ^`
+(`taskctl new --titulo "Q&A"`): cmd.exe interpreta esos caracteres antes
+que nada, y el escape con `^` no sobrevive al reenvio a node. Ojo con
+`%NOMBRE%`: cmd lo sustituye por la variable de entorno aunque vaya entre
+comillas. Hay que actualizar la ruta cuando cambie la version del plugin.
 
 **Git Bash**: `alias taskctl='node "$(ls -d ~/.claude/plugins/cache/taskcode-marketplace/taskcode-plugin/*/ | sort -V | tail -1)bin/taskctl"'`
 en `~/.bashrc`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
index b12fa54..78c1c8e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
@@ -36,7 +36,7 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { spawnSync } from 'node:child_process';
-import { mkdtemp, readFile, rm } from 'node:fs/promises';
+import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
 import { existsSync } from 'node:fs';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
@@ -252,97 +252,171 @@ test('ningun fichero de dist/src commiteado lleva CR', (t) => {
   assert.deepEqual(conCR, [], 'un CR en el build delata que el eol no se fijo');
 });
 
-// --- 3. El lanzador de Windows (TASK-055, entrega A) ---------------------
+// --- 3. Fuera de Claude Code en Windows (TASK-055, entrega A) -------------
 //
 // `bin/taskctl` es un script de node sin extension: fuera del Bash tool de
-// Claude Code (PowerShell, cmd) Windows no sabe ejecutarlo aunque este en
-// el PATH. `bin/taskctl.cmd` lo envuelve. Se prueba sobre el arbol de HEAD
-// exportado, sin npm install, que es lo que recibe quien instala el plugin.
-// Solo en Windows: en Linux no hay cmd.exe que probar (skip visible).
+// Claude Code, Windows no sabe ejecutarlo. Dos vias, una por shell:
+//
+// - cmd: `bin/taskctl.cmd`, con los argumentos entre comillas dobles.
+// - PowerShell: la funcion de perfil del README, que llama a node SIN pasar
+//   por cmd. NO el .cmd: PowerShell 5.1 pasa sin comillas los argumentos
+//   sin espacios, y cmd.exe interpreta `Q&A` o `x>f` (CRIT-1 de la revision:
+//   ejecutaba comandos y vaciaba ficheros). El test de PowerShell ejecuta el
+//   fragmento del README TAL CUAL, para que la documentacion no pueda
+//   desviarse de lo probado.
+//
+// Todo sobre el arbol de HEAD exportado, sin npm install. Solo en Windows;
+// en Linux, skip visible.
 
 const ES_WINDOWS = process.platform === 'win32';
 
-function cmdLanzador(arbol: string): string {
-  return path.join(arbol, ...PLUGIN_REL.split('/'), 'bin', 'taskctl.cmd');
+/** Argumento que rompe un reenvio ingenuo: sin espacios y con metacaracteres. */
+const TITULO_PELIGROSO = 'I+D&QA|x>notas.txt';
+const CRITERIOS = ['uno', 'dos', 'Acción con espacios & más', 'cuatro al 100%'];
+
+/** `new` con titulo peligroso y 4 criterios: 13 argumentos (mas de 9, MEN-1). */
+function argsDeNew(titulo: string): string[] {
+  return [
+    'new',
+    '--tipo',
+    'feature',
+    '--titulo',
+    titulo,
+    ...CRITERIOS.flatMap((c) => ['--criterio', c]),
+  ];
+}
+
+/** Repo git temporal en develop, con un fichero versionado que una redireccion vaciaria. */
+async function repoConDevelop(): Promise<string> {
+  const repo = await mkdtemp(path.join(tmpdir(), 'e6-cmd-repo-'));
+  await writeFile(path.join(repo, 'notas.txt'), 'contenido que no debe perderse\n', 'utf8');
+  for (const args of [
+    ['init', '-q', '-b', 'main'],
+    ['config', 'user.email', 'test@example.com'],
+    ['config', 'user.name', 'Test'],
+    ['add', 'notas.txt'],
+    ['commit', '-q', '-m', 'inicial'],
+    ['checkout', '-q', '-b', 'develop'],
+  ]) {
+    assert.equal(git(args, repo).status, 0, `git ${args.join(' ')}`);
+  }
+  return repo;
+}
+
+/** Tarea con el titulo y los 4 criterios exactos, y nada mas tocado. */
+async function assertTareaIntacta(repo: string, id: string, titulo: string, via: string) {
+  const tarea = await readFile(
+    path.join(repo, 'tareas', '00-planificadas', id, 'tarea.md'),
+    'utf8',
+  );
+  // El frontmatter entrecomilla solo si hace falta: se compara el valor, no la forma.
+  const linea = tarea.split(/\r?\n/).find((l) => l.startsWith('titulo: ')) ?? '';
+  const valor = linea.slice('titulo: '.length).replace(/^"(.*)"$/, '$1');
+  assert.equal(valor, titulo, `${via}: titulo alterado:\n${tarea}`);
+  for (const c of CRITERIOS) {
+    assert.ok(tarea.includes(`- [ ] ${c}`), `${via}: falta el criterio «${c}»:\n${tarea}`);
+  }
+  assert.equal(
+    await readFile(path.join(repo, 'notas.txt'), 'utf8'),
+    'contenido que no debe perderse\n',
+    `${via}: una redireccion de cmd.exe vacio notas.txt`,
+  );
+  assert.equal(git(['status', '--porcelain'], repo).stdout.trim(), '', `${via}: workspace sucio`);
 }
 
-/** Ejecuta el .cmd desde cmd.exe y desde PowerShell, con los mismos argumentos. */
-function lanzarDesdeShells(cmdPath: string, args: string[], cwd?: string) {
-  // cmd.exe: la linea entera entre comillas externas (cmd /s /c "..."),
-  // cada argumento entre comillas dobles. spawnSync no debe re-escapar.
-  const lineaCmd = `"${[cmdPath, ...args].map((a) => `"${a}"`).join(' ')}"`;
-  const desdeCmd = spawnSync('cmd.exe', ['/d', '/s', '/c', lineaCmd], {
+/** cmd.exe con cada argumento entre comillas dobles, como dice el README. */
+function desdeCmd(cmdPath: string, args: string[], cwd?: string) {
+  const linea = `"${[cmdPath, ...args].map((a) => `"${a}"`).join(' ')}"`;
+  return spawnSync('cmd.exe', ['/d', '/s', '/c', linea], {
     encoding: 'utf8',
     cwd,
     windowsVerbatimArguments: true,
   });
-  // PowerShell: operador de llamada y argumentos entre comillas simples.
-  const comillasPs = (a: string) => `'${a.replace(/'/g, "''")}'`;
-  const script = `& ${[cmdPath, ...args].map(comillasPs).join(' ')}; exit $LASTEXITCODE`;
-  const desdePs = spawnSync(
-    'powershell.exe',
-    ['-NoProfile', '-NonInteractive', '-Command', script],
-    { encoding: 'utf8', cwd }
+}
+
+/**
+ * La funcion de perfil de PowerShell, extraida del propio README y apuntada
+ * a una cache falsa: `<cache>/9.9.9` es un junction a la raiz del plugin
+ * exportado, y `0.1.0-rc.1` un directorio que la funcion debe ignorar sin
+ * error (MEN-4).
+ */
+async function funcionPowerShellDelReadme(cache: string): Promise<string> {
+  const readme = (await readFile(path.join(PLUGIN_ROOT, 'README.md'), 'utf8')).replace(/\r\n/g, '\n');
+  const bloque = /```powershell\n(\$taskcodeBase = [\s\S]*?)```/.exec(readme);
+  assert.ok(bloque, 'el README tiene que traer la funcion de perfil de PowerShell');
+  const original = bloque[1] as string;
+  const codigo = original.replace(
+    /^\$taskcodeBase = .*$/m,
+    `$taskcodeBase = '${cache.replace(/'/g, "''")}'`,
   );
-  return { desdeCmd, desdePs };
+  assert.notEqual(codigo, original, 'la funcion empieza fijando $taskcodeBase');
+  return codigo;
 }
 
-test('bin/taskctl.cmd arranca taskctl --version desde cmd y desde PowerShell en un clon sin npm install', async (t) => {
-  if (!ES_WINDOWS) return t.skip('solo Windows: no hay cmd.exe ni powershell.exe');
+function desdePowerShell(funcion: string, args: string[], cwd: string) {
+  const comillas = (a: string) => `'${a.replace(/'/g, "''")}'`;
+  const script = `${funcion}\ntaskctl ${args.map(comillas).join(' ')}\nexit $LASTEXITCODE`;
+  return spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
+    encoding: 'utf8',
+    cwd,
+  });
+}
+
+test('cmd: bin/taskctl.cmd arranca sin npm install, pasa intactos 13 argumentos con & | > entre comillas y devuelve el codigo de salida', async (t) => {
+  if (!ES_WINDOWS) return t.skip('solo Windows: no hay cmd.exe');
   if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
 
   const arbol = await exportarHead();
+  const repo = await repoConDevelop();
   try {
-    const { desdeCmd, desdePs } = lanzarDesdeShells(cmdLanzador(arbol), ['--version']);
-    for (const [shell, r] of [['cmd', desdeCmd], ['PowerShell', desdePs]] as const) {
-      assert.equal(r.status, 0, `${shell}: taskctl.cmd no arranco.\n${r.stdout}\n${r.stderr}`);
-      assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/, `${shell}: deberia imprimir la version`);
-    }
+    const lanzador = path.join(arbol, ...PLUGIN_REL.split('/'), 'bin', 'taskctl.cmd');
+    const version = desdeCmd(lanzador, ['--version']);
+    assert.equal(version.status, 0, `--version: ${version.stdout}\n${version.stderr}`);
+    assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/);
+
+    const r = desdeCmd(lanzador, argsDeNew(TITULO_PELIGROSO), repo);
+    assert.equal(r.status, 0, `new: ${r.stdout}\n${r.stderr}`);
+    await assertTareaIntacta(repo, 'TASK-001', TITULO_PELIGROSO, 'cmd');
+
+    const fallo = desdeCmd(lanzador, ['approve', 'TASK-999'], repo);
+    assert.notEqual(fallo.status, 0, 'un error de taskctl debe salir distinto de 0');
   } finally {
     await rm(arbol, { recursive: true, force: true });
+    await rm(repo, { recursive: true, force: true });
   }
 });
 
-test('bin/taskctl.cmd pasa intactos los argumentos con espacios, tildes y & y devuelve el codigo de salida', async (t) => {
-  if (!ES_WINDOWS) return t.skip('solo Windows: no hay cmd.exe ni powershell.exe');
+test('PowerShell: la funcion de perfil del README pasa intactos argumentos sin espacios con & | > (CRIT-1) y devuelve el codigo de salida', async (t) => {
+  if (!ES_WINDOWS) return t.skip('solo Windows: no hay powershell.exe');
   if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
 
   const arbol = await exportarHead();
-  const repo = await mkdtemp(path.join(tmpdir(), 'e6-cmd-repo-'));
+  const cache = await mkdtemp(path.join(tmpdir(), 'e6-cache-'));
+  const repo = await repoConDevelop();
   try {
-    for (const args of [
-      ['init', '-q', '-b', 'main'],
-      ['config', 'user.email', 'test@example.com'],
-      ['config', 'user.name', 'Test'],
-      ['commit', '-q', '--allow-empty', '-m', 'inicial'],
-      ['checkout', '-q', '-b', 'develop'],
-    ]) {
-      assert.equal(git(args, repo).status, 0, `git ${args.join(' ')}`);
-    }
-    const titulo = 'Acción con espacios & más';
-    const { desdeCmd, desdePs } = lanzarDesdeShells(
-      cmdLanzador(arbol),
-      ['new', '--tipo', 'feature', '--titulo', titulo],
-      repo
+    await symlink(
+      path.join(arbol, ...PLUGIN_REL.split('/')),
+      path.join(cache, '9.9.9'),
+      'junction',
     );
-    // El titulo llega entero: lo que quedo escrito en tarea.md es la prueba.
-    for (const [shell, r, id] of [
-      ['cmd', desdeCmd, 'TASK-001'],
-      ['PowerShell', desdePs, 'TASK-002'],
-    ] as const) {
-      assert.equal(r.status, 0, `${shell}: new fallo.\n${r.stdout}\n${r.stderr}`);
-      const tarea = await readFile(
-        path.join(repo, 'tareas', '00-planificadas', id, 'tarea.md'),
-        'utf8'
-      );
-      assert.match(tarea, /^titulo: "Acción con espacios & más"$/m, `${shell}: titulo alterado`);
-    }
-
-    // El codigo de salida de taskctl llega a quien llama, no un 0 del .cmd.
-    const fallo = lanzarDesdeShells(cmdLanzador(arbol), ['approve', 'TASK-999'], repo);
-    assert.notEqual(fallo.desdeCmd.status, 0, 'cmd: un error de taskctl debe salir distinto de 0');
-    assert.notEqual(fallo.desdePs.status, 0, 'PowerShell: un error de taskctl debe salir distinto de 0');
+    await mkdir(path.join(cache, '0.1.0-rc.1'));
+    const funcion = await funcionPowerShellDelReadme(cache);
+
+    const version = desdePowerShell(funcion, ['--version'], repo);
+    assert.equal(version.status, 0, `--version: ${version.stdout}\n${version.stderr}`);
+    assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/);
+    assert.equal(version.stderr.trim(), '', `una version no X.Y.Z no debe dar error: ${version.stderr}`);
+
+    const r = desdePowerShell(funcion, argsDeNew(TITULO_PELIGROSO), repo);
+    assert.equal(r.status, 0, `new: ${r.stdout}\n${r.stderr}`);
+    await assertTareaIntacta(repo, 'TASK-001', TITULO_PELIGROSO, 'PowerShell');
+
+    const fallo = desdePowerShell(funcion, ['approve', 'TASK-999'], repo);
+    assert.notEqual(fallo.status, 0, 'un error de taskctl debe salir distinto de 0');
   } finally {
+    // El junction primero y sin recursion: borrarlo nunca toca el arbol al que apunta.
+    await rm(path.join(cache, '9.9.9'), { force: true }).catch(() => undefined);
+    await rm(cache, { recursive: true, force: true });
     await rm(arbol, { recursive: true, force: true });
     await rm(repo, { recursive: true, force: true });
   }
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 0da1627c54d66ba2720d8ba69be1021f59754b73..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-055/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-055/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-055/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-055/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-055/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-055/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-055/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-055/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-055/revision/informe-revision-1.md                                                  |  74 ++++++++++++++++++++++++
 tareas/03-en-revision/TASK-055/revision/peticion-revision-1.md                                                 | 254 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-055/tarea.md                                                       |  34 ++++++++++-
 11 files changed, 361 insertions(+), 1 deletion(-)
````
