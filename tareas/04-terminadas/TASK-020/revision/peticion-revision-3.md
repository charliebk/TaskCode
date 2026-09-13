# Peticion de revision — TASK-020 (ronda 3)

- Tarea: TASK-020 — Comando taskctl codex-review (segunda opinión independiente)
- Rama revisada: feature/task-020-comando-taskctl-codex-review-segunda-opi
- Rama base: develop
- Commit revisado (HEAD): 546e1d491c4dbf7c433093ca1d4fb5d495328535
- Fecha: 2026-09-13
- Agente revisor sugerido: code-quality-reviewer

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE de todo lo anterior (implementador, ronda 1,
ronda 2). Tu trabajo es reproducir empiricamente, no leer el diff y opinar:
clona el repo (o usa un worktree) a un directorio temporal, corre la suite
tu mismo y construye el caso que rompe el codigo antes de reportarlo.
Clasifica cada hallazgo como CRITICO (perdida de datos, corrupcion de
estado, el comando hace lo contrario de lo que dice), IMPORTANTE
(comportamiento incorrecto en un caso real, no de borde) o MENOR (todo lo
demas). Un "sin hallazgos" explicito tambien vale; inventar hallazgos, no.
Vuelca tu salida en el informe de esta ronda (informe-revision-3.md), sin
borrar la peticion.

## Que paso en las rondas 1 y 2

- **Ronda 1**: cambios-solicitados (1 IMPORTANTE: `runCodexReview` nunca
  invocaba `codex` de verdad en Windows — `spawnSync` sin `shell: true` no
  resuelve el `codex.cmd` que instala npm, ENOENT siempre; 2 MENOR
  documentados sin corregir). Corregido con `shell: true` solo en `win32` +
  escapado manual de argumentos para `cmd.exe`. Al verificar esa correccion
  aparecio ademas un hallazgo nuevo (no en el informe de la ronda 1):
  `codex review --base <rama>` no admite combinarse con un PROMPT propio
  (conflicto real del CLI de Codex, confirmado empiricamente) — se quito el
  prompt personalizado de `codex-review.ts`.
- **Ronda 2**: cambios-solicitados (1 IMPORTANTE NUEVO: el escapado para
  `cmd.exe` envolvia en comillas pero eso NO evita que `cmd.exe` expanda
  `%NOMBRE_DE_VARIABLE%` — un titulo de tarea con la forma
  `... %USERNAME% ...` llegaba a Codex con el valor REAL de esa variable de
  entorno de esta maquina sustituido en su lugar; verificado con un
  `codex.cmd` de mentira que revelaba `process.argv` real. Confirmo ademas,
  con reproduccion propia contra el binario real, que el IMPORTANTE-1 de la
  ronda 1 SI queda corregido: `lanzado: true` (no `ENOENT`), y la
  contraprueba de revertir `shell: useShell` pone rojo el test nuevo. 2
  MENOR heredados de la ronda 1, sin cambios, documentados sin corregir).
  **Corregido**: `cmdQuoteWindows` ahora ELIMINA el caracter `%` del
  argumento antes de citarlo (en vez de intentar escaparlo — verificado que
  doblar `%%`, el truco de los ficheros `.bat`, no se comporta igual para
  una invocacion externa de `cmd.exe /c`; no hay forma fiable de escapar
  `%` en ese contexto). Nuevo test (solo Windows, con `{ skip:
  process.platform !== 'win32' }`) que confirma que un titulo con
  `%USERNAME%` no filtra el valor real de esa variable en la salida del
  proceso hijo.

No des estos hallazgos por buenos solo porque esta peticion lo diga:
confirma tu mismo que ambas correcciones funcionan, y si algo no cuadra,
dilo como hallazgo nuevo. En particular:

- Verifica contra el binario real de `codex` de esta maquina que
  `runCodexReview` sigue dando `lanzado: true` (no `ENOENT`).
- Prueba tu mismo, con un `codex.cmd` de mentira, que un titulo con
  `%CUALQUIER_COSA%` YA NO revela el valor de esa variable de entorno (la
  eliminacion del `%`, no solo el escapado).
- Piensa si eliminar el `%` en vez de escaparlo introduce algun problema
  nuevo: ¿un titulo de tarea legitimo con un `%` (p. ej. "mejora el
  rendimiento un 30%") pierde ese caracter en el informe/resumen que ve
  Codex? ¿Es un efecto secundario aceptable, dado que la alternativa era
  una fuga de datos?
- Revisa con ojos frescos el resto de la tarea si quieres verificarla de
  cero — no es obligatorio repetir todas las mutaciones y pruebas de CLI
  real que ya certificaron las rondas 1 y 2 (los mismos ficheros que no
  cambiaron en este diff).

## Commits a revisar desde la ronda 2 (git log c478507..HEAD)

```
546e1d4 docs+fix(TASK-020): informe de revision ronda 2 y correccion de la fuga de % en cmd.exe
1bf6952 chore(TASK-020): peticion de revision ronda 2
```

## Diff de codigo fuente y tests (git diff c478507..HEAD -- src test)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 0de3961..892ca2a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -328,15 +328,32 @@ export interface CodexReviewOutcome {
  * Sin este escapado, un argumento con espacios (p. ej. el titulo de la
  * tarea) llega a `codex` partido en varias palabras. Envuelve en
  * comillas dobles si el argumento tiene espacio o algun caracter que
- * `cmd.exe` interpreta (comilla, `&`, `|`, `<`, `>`, `^`, `%`), doblando
- * las comillas internas — mismo criterio que usa Node internamente para
+ * `cmd.exe` interpreta (comilla, `&`, `|`, `<`, `>`, `^`), doblando las
+ * comillas internas — mismo criterio que usa Node internamente para
  * `.bat`/`.cmd` en versiones que sí lo resuelven solas.
+ *
+ * El `%` NO se soluciona envolviendo en comillas (hallazgo IMPORTANTE de
+ * revision por pares, ronda 2, verificado empiricamente): `cmd.exe`
+ * expande `%NOMBRE_DE_VARIABLE%` como parte del parseo de la linea de
+ * comandos, con independencia de si el texto esta entre comillas. Con
+ * `--title` alimentado por `task.titulo` (texto libre de una persona),
+ * un titulo con la forma "... %USERNAME% ..." llegaria a Codex con el
+ * valor real de esa variable de entorno de esta maquina sustituido en
+ * su lugar — filtracion silenciosa de datos locales hacia una llamada
+ * de red externa, sin que haga falta intencion adversaria. No hay forma
+ * fiable de escapar `%` para una unica invocacion de `cmd.exe /c` desde
+ * fuera de un script `.bat` (el truco de doblar `%%` es especifico del
+ * cuerpo de un `.bat`, y no se comporta igual aqui — verificado). Se
+ * elimina el caracter en vez de intentar escaparlo: mas seguro que
+ * intentar una regla de escape fragil para el caracter mas dificil de
+ * `cmd.exe`.
  */
 function cmdQuoteWindows(arg: string): string {
-  if (arg === '' || /["\s&|<>^%]/.test(arg)) {
-    return `"${arg.replace(/"/g, '""')}"`;
+  const sinPorcentaje = arg.replace(/%/g, '');
+  if (sinPorcentaje === '' || /["\s&|<>^]/.test(sinPorcentaje)) {
+    return `"${sinPorcentaje.replace(/"/g, '""')}"`;
   }
-  return arg;
+  return sinPorcentaje;
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
index bde5be8..16b3be5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
@@ -669,3 +669,47 @@ test('runCodexReview: encuentra y lanza un "codex" real del PATH (no inyectado),
     await rm(dir, { recursive: true, force: true });
   }
 });
+
+/**
+ * Hallazgo IMPORTANTE de revision por pares, ronda 2: envolver en
+ * comillas NO evita que `cmd.exe` expanda `%NOMBRE_DE_VARIABLE%` en
+ * Windows — ocurre al parsear la linea de comandos completa, con
+ * independencia de las comillas. Con `--title` alimentado por texto
+ * libre de una persona (`task.titulo`), un titulo con la forma
+ * "... %USERNAME% ..." llegaria a Codex con el valor real de esa
+ * variable de esta maquina sustituido en su lugar. Solo se puede
+ * reproducir el escenario real en Windows (en POSIX no hay `cmd.exe` de
+ * por medio, `runCodexReview` ni siquiera usa `shell: true` ahi), asi
+ * que este test se salta fuera de esa plataforma en vez de fingir que
+ * prueba algo que esa rama de codigo no ejecuta.
+ */
+test('runCodexReview: un argumento con forma "%VARIABLE%" no se expande con el valor real de esa variable de entorno (hallazgo IMPORTANTE de revision, ronda 2)', { skip: process.platform !== 'win32' }, async () => {
+  const { writeFile, mkdtemp, rm } = await import('node:fs/promises');
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-codex-fake-'));
+  const pathAnterior = process.env['PATH'];
+  try {
+    await writeFile(path.join(dir, 'codex.cmd'), '@echo off\r\necho ARGS:%*\r\nexit /b 0\r\n', 'utf8');
+    process.env['PATH'] = `${dir}${path.delimiter}${pathAnterior ?? ''}`;
+
+    const outcome = runCodexReview({
+      args: ['review', '--title', 'hola %USERNAME% adios'],
+      cwd: dir,
+    });
+
+    assert.equal(outcome.lanzado, true, JSON.stringify(outcome));
+    assert.equal(outcome.code, 0, outcome.stdout);
+    // No debe aparecer el valor REAL de la variable de entorno (fuga de
+    // datos locales hacia lo que se le envia a Codex).
+    const usuarioReal = process.env['USERNAME'];
+    if (usuarioReal !== undefined && usuarioReal !== '') {
+      assert.doesNotMatch(
+        outcome.stdout,
+        new RegExp(usuarioReal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
+        `no deberia filtrarse el valor real de %USERNAME% ("${usuarioReal}") en: ${outcome.stdout}`
+      );
+    }
+  } finally {
+    process.env['PATH'] = pathAnterior;
+    await rm(dir, { recursive: true, force: true });
+  }
+});
````
