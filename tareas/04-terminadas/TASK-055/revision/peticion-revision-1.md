# Peticion de revision — TASK-055 (ronda 1)

- Tarea: TASK-055 — Flujo A: taskctl desde PowerShell y cmd
- Rama revisada: feature/task-055-flujo-guiado-por-fases-con-modos-manual
- Rama base: develop
- Commit revisado (HEAD): 0da1627c54d66ba2720d8ba69be1021f59754b73
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-055 (criterios de aceptacion y plan)

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
0da1627 docs(TASK-055): resultado
7af49fc docs(TASK-055): usar taskctl fuera de Claude Code
63f3e53 fix(TASK-055): el .cmd no necesita exit /b (mutante superviviente)
89992e0 feat(TASK-055): lanzador bin/taskctl.cmd para cmd y PowerShell
1c905ac chore(TASK-055): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes b/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
index f3576d4..f96944a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
@@ -13,3 +13,8 @@ dist/** text eol=lf
 # Un CR delante del salto de la primera linea hace que el kernel no encuentre
 # el interprete, asi que su eol tampoco puede quedar al azar del checkout.
 bin/* text eol=lf
+
+# El lanzador de Windows (bin/taskctl.cmd) va al reves: CRLF. cmd.exe lee
+# los .cmd por bloques y con LF puede saltarse lineas o romper etiquetas;
+# esta regla va DESPUES de bin/* porque en .gitattributes gana la ultima.
+bin/*.cmd text eol=crlf
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 915a7f8..0974931 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -94,6 +94,49 @@ anotado porque condiciona **E1** (invitar colaboradores) y cualquier intento
 futuro de distribuir por esa vía, que obligaría a renunciar a `taskctl` como
 comando suelto o a reestructurar el plugin.
 
+## Usar `taskctl` fuera de Claude Code (PowerShell, cmd, Git Bash)
+
+Dentro de Claude Code no hay que hacer nada: `bin/` entra en el PATH del
+Bash tool mientras el plugin esta habilitado. **Fuera** (tu propia terminal)
+no: ni esta en el PATH ni, en Windows, PowerShell y cmd saben ejecutar
+`bin/taskctl`, que es un script de node sin extension. Para eso esta
+`bin/taskctl.cmd` (desde la version que sigue a la 0.3.0).
+
+El plugin instalado vive en
+`~/.claude/plugins/cache/<marketplace>/taskcode-plugin/<version>/` (en
+Windows, `%USERPROFILE%\.claude\plugins\cache\...`). Hace falta `node` en
+el PATH. Tres formas, de la mas puntual a la mas comoda:
+
+**Ruta completa, una vez** (cualquier version, cualquier shell):
+
+```powershell
+node "$env:USERPROFILE\.claude\plugins\cache\taskcode-marketplace\taskcode-plugin\0.3.0\bin\taskctl" approve TASK-005
+```
+
+**PowerShell, permanente**: anade esto a tu perfil (`notepad $PROFILE`). Elige
+la version instalada mas alta, asi que sobrevive a las actualizaciones del
+plugin, y funciona tambien con versiones sin `taskctl.cmd`:
+
+```powershell
+$taskcodeBase = Join-Path $env:USERPROFILE '.claude\plugins\cache\taskcode-marketplace\taskcode-plugin'
+function taskctl {
+  $bin = Get-ChildItem $taskcodeBase -Directory |
+    Sort-Object { [version]$_.Name } | Select-Object -Last 1
+  node (Join-Path $bin.FullName 'bin\taskctl') @args
+}
+```
+
+**cmd o PATH de Windows**: anade la carpeta `bin` de la version instalada al
+PATH del usuario; `taskctl` resuelve a `taskctl.cmd`. Hay que actualizar la
+ruta cuando cambie la version del plugin.
+
+**Git Bash**: `alias taskctl='node "$(ls -d ~/.claude/plugins/cache/taskcode-marketplace/taskcode-plugin/*/ | sort -V | tail -1)bin/taskctl"'`
+en `~/.bashrc`.
+
+Los comandos que invocan Git-Flow (`start`, `review`, `finish`...) ejecutan
+`bash` por debajo: necesitan Git for Windows instalado, desde cualquier
+shell.
+
 ## `taskctl` en el PATH del Bash tool
 
 Según la referencia oficial (`https://code.claude.com/docs/en/plugins`,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl.cmd b/taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl.cmd
new file mode 100644
index 0000000..39ae8c4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl.cmd
@@ -0,0 +1,5 @@
+@echo off
+rem Lanzador para cmd y PowerShell en Windows: ejecuta con node el CLI de
+rem esta misma carpeta. Es la ultima orden, asi que su codigo de salida es
+rem el del .cmd.
+node "%~dp0taskctl" %*
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
index 913c465..b12fa54 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
@@ -251,3 +251,111 @@ test('ningun fichero de dist/src commiteado lleva CR', (t) => {
 
   assert.deepEqual(conCR, [], 'un CR en el build delata que el eol no se fijo');
 });
+
+// --- 3. El lanzador de Windows (TASK-055, entrega A) ---------------------
+//
+// `bin/taskctl` es un script de node sin extension: fuera del Bash tool de
+// Claude Code (PowerShell, cmd) Windows no sabe ejecutarlo aunque este en
+// el PATH. `bin/taskctl.cmd` lo envuelve. Se prueba sobre el arbol de HEAD
+// exportado, sin npm install, que es lo que recibe quien instala el plugin.
+// Solo en Windows: en Linux no hay cmd.exe que probar (skip visible).
+
+const ES_WINDOWS = process.platform === 'win32';
+
+function cmdLanzador(arbol: string): string {
+  return path.join(arbol, ...PLUGIN_REL.split('/'), 'bin', 'taskctl.cmd');
+}
+
+/** Ejecuta el .cmd desde cmd.exe y desde PowerShell, con los mismos argumentos. */
+function lanzarDesdeShells(cmdPath: string, args: string[], cwd?: string) {
+  // cmd.exe: la linea entera entre comillas externas (cmd /s /c "..."),
+  // cada argumento entre comillas dobles. spawnSync no debe re-escapar.
+  const lineaCmd = `"${[cmdPath, ...args].map((a) => `"${a}"`).join(' ')}"`;
+  const desdeCmd = spawnSync('cmd.exe', ['/d', '/s', '/c', lineaCmd], {
+    encoding: 'utf8',
+    cwd,
+    windowsVerbatimArguments: true,
+  });
+  // PowerShell: operador de llamada y argumentos entre comillas simples.
+  const comillasPs = (a: string) => `'${a.replace(/'/g, "''")}'`;
+  const script = `& ${[cmdPath, ...args].map(comillasPs).join(' ')}; exit $LASTEXITCODE`;
+  const desdePs = spawnSync(
+    'powershell.exe',
+    ['-NoProfile', '-NonInteractive', '-Command', script],
+    { encoding: 'utf8', cwd }
+  );
+  return { desdeCmd, desdePs };
+}
+
+test('bin/taskctl.cmd arranca taskctl --version desde cmd y desde PowerShell en un clon sin npm install', async (t) => {
+  if (!ES_WINDOWS) return t.skip('solo Windows: no hay cmd.exe ni powershell.exe');
+  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
+
+  const arbol = await exportarHead();
+  try {
+    const { desdeCmd, desdePs } = lanzarDesdeShells(cmdLanzador(arbol), ['--version']);
+    for (const [shell, r] of [['cmd', desdeCmd], ['PowerShell', desdePs]] as const) {
+      assert.equal(r.status, 0, `${shell}: taskctl.cmd no arranco.\n${r.stdout}\n${r.stderr}`);
+      assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/, `${shell}: deberia imprimir la version`);
+    }
+  } finally {
+    await rm(arbol, { recursive: true, force: true });
+  }
+});
+
+test('bin/taskctl.cmd pasa intactos los argumentos con espacios, tildes y & y devuelve el codigo de salida', async (t) => {
+  if (!ES_WINDOWS) return t.skip('solo Windows: no hay cmd.exe ni powershell.exe');
+  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
+
+  const arbol = await exportarHead();
+  const repo = await mkdtemp(path.join(tmpdir(), 'e6-cmd-repo-'));
+  try {
+    for (const args of [
+      ['init', '-q', '-b', 'main'],
+      ['config', 'user.email', 'test@example.com'],
+      ['config', 'user.name', 'Test'],
+      ['commit', '-q', '--allow-empty', '-m', 'inicial'],
+      ['checkout', '-q', '-b', 'develop'],
+    ]) {
+      assert.equal(git(args, repo).status, 0, `git ${args.join(' ')}`);
+    }
+    const titulo = 'Acción con espacios & más';
+    const { desdeCmd, desdePs } = lanzarDesdeShells(
+      cmdLanzador(arbol),
+      ['new', '--tipo', 'feature', '--titulo', titulo],
+      repo
+    );
+    // El titulo llega entero: lo que quedo escrito en tarea.md es la prueba.
+    for (const [shell, r, id] of [
+      ['cmd', desdeCmd, 'TASK-001'],
+      ['PowerShell', desdePs, 'TASK-002'],
+    ] as const) {
+      assert.equal(r.status, 0, `${shell}: new fallo.\n${r.stdout}\n${r.stderr}`);
+      const tarea = await readFile(
+        path.join(repo, 'tareas', '00-planificadas', id, 'tarea.md'),
+        'utf8'
+      );
+      assert.match(tarea, /^titulo: "Acción con espacios & más"$/m, `${shell}: titulo alterado`);
+    }
+
+    // El codigo de salida de taskctl llega a quien llama, no un 0 del .cmd.
+    const fallo = lanzarDesdeShells(cmdLanzador(arbol), ['approve', 'TASK-999'], repo);
+    assert.notEqual(fallo.desdeCmd.status, 0, 'cmd: un error de taskctl debe salir distinto de 0');
+    assert.notEqual(fallo.desdePs.status, 0, 'PowerShell: un error de taskctl debe salir distinto de 0');
+  } finally {
+    await rm(arbol, { recursive: true, force: true });
+    await rm(repo, { recursive: true, force: true });
+  }
+});
+
+test('el lanzador de Windows lleva CRLF fijado en .gitattributes, y el de Unix sigue en LF', async (t) => {
+  const attrs = await readFile(path.join(PLUGIN_ROOT, '.gitattributes'), 'utf8');
+  assert.match(attrs, /^bin\/\*\.cmd\s+text\s+eol=crlf$/m, 'el .cmd, con eol=crlf');
+  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
+  const eol = (f: string) =>
+    git(['check-attr', 'eol', '--', `${PLUGIN_REL}/bin/${f}`], REPO_ROOT).stdout.trim();
+  // La regla del .cmd va despues de bin/* y la ultima gana: si se invierte
+  // el orden, el .cmd volveria a LF sin que nada mas lo note.
+  assert.match(eol('taskctl.cmd'), /eol: crlf$/);
+  assert.match(eol('taskctl'), /eol: lf$/);
+});
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-055/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-055/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-055/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-055/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-055/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-055/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-055/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-055/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-055/tarea.md                                                       | 42 ++++++++++++++++++++++++++++++++++++------
 9 files changed, 36 insertions(+), 6 deletions(-)
````
