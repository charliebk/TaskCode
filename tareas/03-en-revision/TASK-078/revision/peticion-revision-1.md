# Peticion de revision — TASK-078 (ronda 1)

- Tarea: TASK-078 — Hook que impide leer y editar los held-out de la tarea en curso
- Rama revisada: feature/task-078-hook-que-impide-leer-y-editar-los-held-o
- Rama base: develop
- Commit revisado (HEAD): cae1fb32536e8e307d340432c41c4e666818ceff
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-078 (criterios de aceptacion y plan)

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
cae1fb3 feat(TASK-078): hook que impide leer y editar los held-out de la tarea en curso
49b9ea1 chore(TASK-078): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
index 8f9ab4b..bf14a6c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
@@ -1,5 +1,5 @@
 {
-  "description": "Frenos de verificacion. Stop: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). PreToolUse: un merge o un script de cierre hacia la rama de integracion o la principal se bloquea si no consta una verificacion en verde del commit que entra.",
+  "description": "Frenos de verificacion. Stop: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). PreToolUse: un merge o un script de cierre hacia la rama de integracion o la principal se bloquea si no consta una verificacion en verde del commit que entra; y en la rama de una tarea, leer, buscar o editar la carpeta aceptacion/ de esa tarea (sus tests held-out) se bloquea, con herramientas de fichero o con un comando que la nombre.",
   "hooks": {
     "Stop": [
       {
@@ -28,6 +28,19 @@
             "timeout": 30
           }
         ]
+      },
+      {
+        "matcher": "Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob",
+        "hooks": [
+          {
+            "type": "command",
+            "command": "node",
+            "args": [
+              "${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/pre-tool-lectura.js"
+            ],
+            "timeout": 30
+          }
+        ]
       }
     ]
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 74b87f2..9b07d88 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -208,7 +208,8 @@ verde del commit que entra: cierra siempre con `taskctl finish`. Saltarse la
 verificacion (`--sin-verificacion`) lo decide la persona, no tu.
 
 **Tests held-out (`aceptacion/`).** Son de la persona: si implementas, no los
-leas ni los edites. Detalle en [heldout.md](heldout.md).
+leas ni los edites (un hook lo frena en la rama de la tarea). Detalle en
+[heldout.md](heldout.md).
 
 ## Cerrar una tarea
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
index 771bc2e..4e23ef1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
@@ -30,6 +30,31 @@ No los leas ni los edites. `finish` aborta, sin mergear:
 Arregla el codigo, nunca los tests. Si crees que un held-out esta mal, dilo:
 cambiarlo lo hace la persona en la rama base. `--sin-verificacion` no los salta.
 
+Si `finish` aborta porque la rama los ha tocado, **para y pasale el mensaje a
+la persona**: el remedio que imprime lo ejecuta ella en su terminal (tu tienes
+bloqueadas esas ordenes; reintentarlas es un bucle).
+
+## El guardian (hook `PreToolUse`)
+
+En la rama de una tarea (`<tipo>/task-NNN-...`), el hook bloquea (exit 2)
+Read, Edit, Write, MultiEdit, NotebookEdit, Grep y Glob sobre
+`tareas/*/TASK-NNN/aceptacion/` de ESA tarea, y los comandos de Bash o
+PowerShell cuyo texto nombra esa ruta (`cat`, `Get-Content`,
+`git show rama:ruta`). Normaliza mayusculas, barras invertidas, `..` y rutas
+relativas al cwd. En cualquier otra rama (la base, durante el diseno) no
+bloquea: la persona puede escribirlos con ayuda.
+
+Es un freno contra despistes, no un cierre. **No ve**, y se acepta asi:
+
+- una busqueda que no nombra la carpeta (Grep sobre la raiz del repo entra en
+  `aceptacion/` y devuelve su contenido) ni un indice de codigo por MCP;
+- cambiar de rama para leerlos (`git switch` a la base, leer, volver);
+- un comando que llega a la ruta sin escribirla (`cd` previo y ruta relativa,
+  concatenaciones o escapes del shell, `git cat-file` por hash).
+
+Un held-out leido no se deshace: esa tarea queda gastada y solo lo arregla que
+la persona los reescriba. El cierre de la edicion es la huella de `finish`.
+
 ## Revision
 
 El revisor por pares no los lee: nunca van en el diff de la peticion de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
index 184557e..786cb07 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-heldout.ts
@@ -54,6 +54,15 @@ export type ResultadoHeldout = { tipo: 'sin-heldout' } | { tipo: 'verde'; carpet
 
 const CIERRE = 'No se ha mergeado nada.';
 
+/**
+ * Decision de Carlos en TASK-078: el remedio sobre los held-out lo ejecuta la
+ * persona. El guardian de held-out bloquea al agente las ordenes que nombran
+ * la carpeta, y en modo automatico reintentarlas seria un bucle.
+ */
+const PERSONA =
+  'Esto lo resuelve la persona en su terminal, fuera del agente: el agente tiene bloqueadas las ordenes ' +
+  'que nombran los held-out, asi que para aqui y pasale este mensaje.';
+
 function rutasDe(ref: string, cwd: string): string[] {
   const salida = runGit(['ls-tree', '-r', '--name-only', ref, '--', 'tareas'], cwd);
   return salida === '' ? [] : salida.split('\n');
@@ -170,11 +179,11 @@ export function puertaHeldout(o: PuertaHeldoutOpts): ResultadoHeldout {
       `[ERROR] ${o.id}: la rama ha editado, añadido o borrado los tests held-out: su contenido ` +
         `(${enRama.length === 0 ? 'ninguno' : enRama.join(', ')}) no coincide con el de "${o.ramaBase}" (${base}). ` +
         'El agente que implementa no puede cambiarlos; si hay que cambiarlos, lo hace la persona en ' +
-        `"${o.ramaBase}". ` +
+        `"${o.ramaBase}". ${PERSONA} ` +
         (baseCambio
-          ? `Ademas "${o.ramaBase}" los ha cambiado desde que nacio la rama: integra primero "${o.ramaBase}" ` +
-            `(git merge ${o.ramaBase}; si hay conflicto en los held-out, quedate con la version de ` +
-            `"${o.ramaBase}") y reintenta; si sigue sin coincidir, restauralos`
+          ? `Ademas "${o.ramaBase}" los ha cambiado desde que nacio la rama: que integre primero ` +
+            `"${o.ramaBase}" (git merge ${o.ramaBase}; si hay conflicto en los held-out, con la version de ` +
+            `"${o.ramaBase}") y reintente; si sigue sin coincidir, que los restaure`
           : 'Para restaurarlos') +
         `${enDestino ? '' : ` en ${destino}`}:\n  ${remedio(o.ramaBase, base, destino, otras)}\n${CIERRE}`
     );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
index 044a34e..fc29143 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
@@ -3,11 +3,13 @@
  * los criterios, en la carpeta `aceptacion/` de la tarea, y los commitea en la
  * rama base durante el diseño, antes de `start`: la rama nace con ellos y no
  * aparecen en su diff. El agente que implementa no debe leerlos ni editarlos
- * (el hook que lo impide llega con TASK-078); `finish` los ejecuta con
- * `comando_heldout` y comprueba que la rama no los ha tocado.
+ * (TASK-078: el hook PreToolUse de guardia-heldout.ts lo frena); `finish` los
+ * ejecuta con `comando_heldout` y comprueba que la rama no los ha tocado.
  *
- * Puro: nombres, patrones y la busqueda de la carpeta en una lista de rutas.
+ * Puro: nombres, patrones, la busqueda de la carpeta en una lista de rutas y
+ * que tareas nombra una ruta o el texto de un comando.
  */
+import path from 'node:path';
 
 /** Nombre de la carpeta de held-out dentro de la carpeta de una tarea. */
 export const CARPETA_HELDOUT = 'aceptacion';
@@ -56,3 +58,52 @@ export function variantesHeldout(rutas: readonly string[], id: string): string[]
   }
   return [...vistas];
 }
+
+/**
+ * Una ruta held-out, ya normalizada (`/`, minusculas, sin `.` ni `..`): la
+ * secuencia de segmentos `tareas/<estado>/task-NNN/aceptacion` en cualquier
+ * punto de la ruta, seguida de `/` o del final. `aceptacionX/` y `tarea.md`
+ * no casan.
+ */
+const RUTA_HELDOUT_RE = new RegExp(`(?:^|/)tareas/[^/]+/task-(\\d{3,})/${CARPETA_HELDOUT}(?:/|$)`);
+
+function casar(normalizada: string, nums: Set<number>): void {
+  const m = RUTA_HELDOUT_RE.exec(normalizada);
+  if (m !== null) nums.add(parseInt(m[1] as string, 10));
+}
+
+/**
+ * Numeros de las tareas cuya carpeta held-out nombra `ruta`. Se prueba la
+ * ruta tal cual y resuelta contra `base` (el cwd, o el `path` de Grep/Glob),
+ * con barras invertidas, mayusculas, `.` y `..` normalizados, para que una
+ * relativa dentro de la carpeta de la tarea (`aceptacion/x`) o una absoluta
+ * de Windows o de git-bash (`C:\...`, `/c/...`) casen igual.
+ */
+export function numerosHeldoutEnRuta(ruta: string, base: string): number[] {
+  const nums = new Set<number>();
+  const barras = ruta.replace(/\\/g, '/');
+  if (barras.trim() === '') return [];
+  casar(path.posix.normalize(barras).toLowerCase(), nums);
+  casar(path.resolve(base, barras).replace(/\\/g, '/').toLowerCase(), nums);
+  return [...nums];
+}
+
+/** Separadores de palabra en el texto de un comando: blancos, comillas, operadores y el `:` de `rama:ruta`. */
+const SEPARADORES_COMANDO = /[\s"'`;|&()<>=,:]+/;
+
+/**
+ * Numeros de las tareas cuya carpeta held-out nombra el texto de un comando
+ * de Bash o PowerShell (`cat`, `Get-Content`, `git show rama:ruta`...). Se
+ * parte por separadores y cada palabra se trata como una ruta relativa a
+ * `cwd`. NO usa el tokenizador del guardian de merges, que trata `\` como
+ * escape y romperia las rutas de PowerShell. Es un baden, no un cierre: no
+ * sigue un `cd` previo ni deshace concatenaciones o escapes del shell.
+ */
+export function numerosHeldoutEnTexto(texto: string, cwd: string): number[] {
+  const nums = new Set<number>();
+  for (const palabra of texto.split(SEPARADORES_COMANDO)) {
+    if (palabra === '') continue;
+    for (const n of numerosHeldoutEnRuta(palabra, cwd)) nums.add(n);
+  }
+  return [...nums];
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
index f6e6597..6ee8005 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
@@ -13,6 +13,12 @@ const TASK_ID_RE = /^TASK-(\d{3,})$/;
 /** `feature/task-9999-slug`, `fix/task-9998`: el numero de tarea dentro del nombre de una rama. */
 const RAMA_TASK_RE = /(?:^|\/)task-(\d{3,})(?:-|$)/i;
 
+/** Numero de la tarea en un nombre de rama (`feature/task-078-x` -> 78), o null. */
+export function numeroDeRama(rama: string): number | null {
+  const m = RAMA_TASK_RE.exec(rama);
+  return m === null ? null : parseInt(m[1] as string, 10);
+}
+
 /** Primer numero del rango reservado. */
 export const ID_RESERVADO_MIN = 9000;
 /** Primer ID que reparte el rango reservado (y el mayor posible). */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
new file mode 100644
index 0000000..4e79ea5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
@@ -0,0 +1,28 @@
+/**
+ * La entrada y la decision de un hook `PreToolUse`, compartidas por los
+ * guardianes (merges, held-out). Sin dependencias: el guardian de held-out
+ * corre antes de herramientas de fichero y no debe cargar el de merges.
+ */
+
+export interface EntradaPreToolUse {
+  cwd?: unknown;
+  tool_name?: unknown;
+  tool_input?: unknown;
+}
+
+export interface DecisionPreToolUse {
+  codigo: 0 | 2;
+  stderr: string;
+}
+
+export const PASAR: DecisionPreToolUse = Object.freeze({ codigo: 0, stderr: '' });
+
+/** El JSON del hook. Un JSON roto o vacio es una entrada sin campos. */
+export function parsearEntradaPreToolUse(texto: string): EntradaPreToolUse {
+  try {
+    const v: unknown = JSON.parse(texto);
+    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaPreToolUse) : {};
+  } catch {
+    return {};
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
new file mode 100644
index 0000000..502b351
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
@@ -0,0 +1,95 @@
+/**
+ * Guardian de held-out — TASK-078. Lo ejecutan dos hooks `PreToolUse`
+ * (hooks/hooks.json): el de herramientas de fichero (pre-tool-lectura.js) y
+ * el de Bash/PowerShell (pre-tool-merge.js). Bloquea (exit 2) que el agente
+ * lea, busque o edite la carpeta `aceptacion/` de la tarea cuya rama es la
+ * actual; en cualquier otra rama (la base, durante el diseño) deja pasar,
+ * para que la persona pueda escribirlos con ayuda.
+ *
+ * Decisiones de Carlos en el plan:
+ * - La tarea protegida se saca del NOMBRE de la rama actual
+ *   (`feature/task-078-...`), nunca de `tarea.md` en el arbol de trabajo: el
+ *   agente podria editar ese fichero, que es justo la ruta hermana permitida,
+ *   y apagar el guardian. Con HEAD desacoplado en un rebase, la rama sale de
+ *   `rebase-merge/head-name` (o `rebase-apply/`).
+ * - Cambiar de rama para leerlos (git switch a la base, leer, volver) no se
+ *   frena, igual que una busqueda que no nombra la carpeta (Grep sobre la
+ *   raiz): es un freno contra despistes, no un cierre. El cierre de la
+ *   edicion es la huella de `finish`.
+ *
+ * Nunca bloquea por un fallo propio: sin cwd, sin repo o con `git` roto, deja
+ * pasar. Solo hace I/O si la ruta ya nombra una carpeta held-out. Nada de lo
+ * que escribe nombra el producto.
+ */
+import { existsSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { numerosHeldoutEnRuta, numerosHeldoutEnTexto, CARPETA_HELDOUT } from '../core/heldout.js';
+import { numeroDeRama } from '../core/task-id.js';
+import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
+
+const SHELL = new Set(['Bash', 'PowerShell']);
+/** Campos de `tool_input` que llevan una ruta o un patron de ruta (file_path, notebook_path, path, pattern, glob). */
+const CAMPO_RUTA = /path|pattern|glob/i;
+
+/** Numeros de tarea cuya carpeta held-out nombra la entrada, sin I/O. */
+export function numerosEnEntrada(entrada: EntradaPreToolUse): number[] {
+  const ti = entrada.tool_input;
+  if (typeof ti !== 'object' || ti === null) return [];
+  const cwd = typeof entrada.cwd === 'string' && entrada.cwd !== '' ? entrada.cwd : process.cwd();
+  const campos = ti as Record<string, unknown>;
+  if (typeof entrada.tool_name === 'string' && SHELL.has(entrada.tool_name)) {
+    return typeof campos.command === 'string' ? numerosHeldoutEnTexto(campos.command, cwd) : [];
+  }
+  // El `path` de Grep/Glob es la base de su `pattern`/`glob`.
+  const base = typeof campos.path === 'string' && campos.path !== '' ? path.resolve(cwd, campos.path) : cwd;
+  const nums = new Set<number>();
+  for (const [clave, valor] of Object.entries(campos)) {
+    if (typeof valor !== 'string' || !CAMPO_RUTA.test(clave)) continue;
+    for (const n of numerosHeldoutEnRuta(valor, clave === 'path' ? cwd : base)) nums.add(n);
+  }
+  return [...nums];
+}
+
+function git(args: readonly string[], cwd: string): { ok: boolean; out: string } {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
+  return { ok: r.error === undefined && r.status === 0, out: (r.stdout ?? '').trim() };
+}
+
+/** La rama actual; con HEAD desacoplado en un rebase, la que se esta rebasando. null si no hay repo. */
+export function ramaActual(cwd: string): string | null {
+  const actual = git(['branch', '--show-current'], cwd);
+  if (!actual.ok) return null;
+  if (actual.out !== '') return actual.out;
+  for (const f of ['rebase-merge/head-name', 'rebase-apply/head-name']) {
+    const r = git(['rev-parse', '--git-path', f], cwd);
+    if (!r.ok || r.out === '') continue;
+    const fichero = path.resolve(cwd, r.out);
+    if (existsSync(fichero)) return readFileSync(fichero, 'utf8').trim().replace(/^refs\/heads\//, '');
+  }
+  return '';
+}
+
+export function decidirHeldout(entrada: EntradaPreToolUse): DecisionPreToolUse {
+  try {
+    const nums = numerosEnEntrada(entrada);
+    if (nums.length === 0) return PASAR;
+    if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return PASAR;
+    const rama = ramaActual(entrada.cwd);
+    if (rama === null || rama === '') return PASAR;
+    const n = numeroDeRama(rama);
+    if (n === null || !nums.includes(n)) return PASAR;
+    return { codigo: 2, stderr: mensaje(`TASK-${String(n).padStart(3, '0')}`, rama) };
+  } catch {
+    return PASAR;
+  }
+}
+
+function mensaje(id: string, rama: string): string {
+  return [
+    `Bloqueado: esto nombra la carpeta ${CARPETA_HELDOUT}/ de ${id}, la tarea de la rama actual ("${rama}").`,
+    'Son sus tests held-out: los escribe la persona y el agente que implementa no los lee, no los busca ni los edita.',
+    'Implementa contra los criterios de aceptacion de tarea.md. Si crees que un held-out esta mal, dilo:',
+    'cambiarlo lo hace la persona en la rama base.',
+  ].join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 2d531f7..d9fbaa5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -31,18 +31,9 @@ import { raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../co
 import { huellaDeCommit, leerMemo } from '../fs/verificacion.js';
 import { timeoutEfectivoS } from './freno-stop.js';
 
-export interface EntradaPreToolUse {
-  cwd?: unknown;
-  tool_name?: unknown;
-  tool_input?: unknown;
-}
-
-export interface DecisionPreToolUse {
-  codigo: 0 | 2;
-  stderr: string;
-}
+import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
 
-const PASAR: DecisionPreToolUse = Object.freeze({ codigo: 0, stderr: '' });
+export { parsearEntradaPreToolUse, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
 
 /** Guarda 1, sin I/O: el comando de la entrada, si puede contener un merge. */
 export function comandoCandidato(entrada: EntradaPreToolUse): string | null {
@@ -185,13 +176,3 @@ function mensaje(fuente: string, sha: string | null, destino: string, comando: s
     'anotado en la tarea. No integres por otra via para saltarte esta comprobacion.',
   ].join('\n');
 }
-
-/** El JSON del hook. Un JSON roto o vacio es una entrada sin campos. */
-export function parsearEntradaPreToolUse(texto: string): EntradaPreToolUse {
-  try {
-    const v: unknown = JSON.parse(texto);
-    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaPreToolUse) : {};
-  } catch {
-    return {};
-  }
-}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-lectura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-lectura.ts
new file mode 100644
index 0000000..ad958d1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-lectura.ts
@@ -0,0 +1,32 @@
+/**
+ * Punto de entrada del hook `PreToolUse` de herramientas de fichero
+ * (Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob, hooks/hooks.json).
+ * Corre antes de CADA una de ellas, en todos los proyectos con el plugin,
+ * asi que lo primero es barato: si la entrada no contiene `aceptacion`, sale
+ * 0 sin cargar nada mas. Si no, decide (guardia-heldout.ts): 0 deja pasar, 2
+ * bloquea con el motivo en stderr. Nunca sale con 1, que Claude Code trata
+ * como error NO bloqueante; un fallo propio deja pasar.
+ */
+import { readFileSync } from 'node:fs';
+
+let texto = '';
+try {
+  texto = readFileSync(0, 'utf8');
+} catch {
+  texto = '';
+}
+
+if (/aceptacion/i.test(texto)) {
+  Promise.all([import('./guardia-heldout.js'), import('./entrada-pretooluse.js')]).then(
+    ([g, e]) => {
+      const d = g.decidirHeldout(e.parsearEntradaPreToolUse(texto));
+      if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
+      process.exitCode = d.codigo;
+    },
+    () => {
+      process.exitCode = 0;
+    }
+  );
+} else {
+  process.exitCode = 0;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
index 1cf9b2e..1ac211a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
@@ -1,9 +1,11 @@
 /**
- * Punto de entrada del hook `PreToolUse` (hooks/hooks.json). Corre antes de
- * CADA comando Bash/PowerShell, asi que lo primero es barato: si el texto no
- * contiene `merge`, sale 0 sin cargar nada mas. Si no, decide
- * (guardia-merge.ts): 0 deja pasar, 2 bloquea con el motivo en stderr.
- * Nunca sale con 1, que Claude Code trata como error NO bloqueante.
+ * Punto de entrada del hook `PreToolUse` de Bash/PowerShell (hooks/hooks.json).
+ * Corre antes de CADA comando, asi que lo primero es barato: si el texto no
+ * contiene `merge` ni `aceptacion`, sale 0 sin cargar nada mas. Si no, decide
+ * cada guardian que aplique: el de merges (guardia-merge.ts) y el de held-out
+ * (guardia-heldout.ts, TASK-078). El primero que bloquea gana: sale 2 con su
+ * motivo en stderr. Nunca sale con 1, que Claude Code trata como error NO
+ * bloqueante; el fallo de un guardian deja pasar y no impide decidir al otro.
  */
 import { readFileSync } from 'node:fs';
 
@@ -14,10 +16,35 @@ try {
   texto = '';
 }
 
-if (/merge/i.test(texto)) {
-  import('./guardia-merge.js').then(
-    (g) => {
-      const d = g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
+interface Decision {
+  codigo: 0 | 2;
+  stderr: string;
+}
+
+async function decidir(): Promise<Decision> {
+  if (/aceptacion/i.test(texto)) {
+    try {
+      const [g, e] = await Promise.all([import('./guardia-heldout.js'), import('./entrada-pretooluse.js')]);
+      const d = g.decidirHeldout(e.parsearEntradaPreToolUse(texto));
+      if (d.codigo === 2) return d;
+    } catch {
+      // deja pasar: decide el otro guardian
+    }
+  }
+  if (/merge/i.test(texto)) {
+    try {
+      const g = await import('./guardia-merge.js');
+      return g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
+    } catch {
+      // deja pasar
+    }
+  }
+  return { codigo: 0, stderr: '' };
+}
+
+if (/merge|aceptacion/i.test(texto)) {
+  decidir().then(
+    (d) => {
       if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
       process.exitCode = d.codigo;
     },
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
index ca82557..74b63b7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-heldout.test.ts
@@ -308,6 +308,8 @@ test('heldout (IMP-1): si los edita la rama, el remedio del mensaje los restaura
         return /la rama ha editado, añadido o borrado los tests held-out/.test(mensaje);
       }
     );
+    // TASK-078: el remedio lo ejecuta la persona; el agente tiene bloqueadas esas ordenes.
+    assert.match(mensaje, /Esto lo resuelve la persona en su terminal, fuera del agente/);
     const orden = /\n {2}(git rm .*)\n/.exec(mensaje)?.[1];
     assert.ok(orden, `sin remedio en: ${mensaje}`);
     assert.match(orden, new RegExp(`git read-tree --prefix=${destino}/ develop:tareas/01-en-diseno/TASK-742/aceptacion`));
@@ -398,7 +400,7 @@ test('heldout (MEN-5): si la rama los toco y la base tambien, pide integrar prim
     git(['checkout', '-q', task.rama], c.repoRoot);
     await assert.rejects(
       () => finish(c, ['TASK-749']),
-      /la rama ha editado[\s\S]*Ademas "develop" los ha cambiado desde que nacio la rama: integra primero "develop"/
+      /la rama ha editado[\s\S]*Ademas "develop" los ha cambiado desde que nacio la rama: que integre primero "develop"/
     );
   });
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts
new file mode 100644
index 0000000..a55c30e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts
@@ -0,0 +1,271 @@
+/**
+ * Guardian de held-out (TASK-078). El casado de rutas es puro y se prueba con
+ * texto; la decision, contra repos Git temporales de verdad (rama base y rama
+ * de una tarea con su carpeta `aceptacion/`), lanzando los puntos de entrada
+ * del dist como proceso, con el JSON por stdin, igual que Claude Code.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { numerosHeldoutEnRuta, numerosHeldoutEnTexto } from '../../src/core/heldout.js';
+import { numeroDeRama } from '../../src/core/task-id.js';
+import { decidirHeldout, ramaActual } from '../../src/hooks/guardia-heldout.js';
+import { git } from '../helpers/finish-fixtures.js';
+
+const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
+const ENTRADA_LECTURA = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'pre-tool-lectura.js');
+const ENTRADA_SHELL = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'pre-tool-merge.js');
+const RAMA = 'feature/task-901-trabajo';
+const CARPETA = 'tareas/02-en-curso/TASK-901';
+const HELDOUT = `${CARPETA}/aceptacion`;
+const MATCHER_LECTURA = 'Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob';
+
+// ---------------------------------------------------------------------
+// Casado de rutas (puro)
+// ---------------------------------------------------------------------
+
+test('heldout-ruta: normaliza mayusculas, barras invertidas, .., relativas y absolutas de Windows y git-bash', () => {
+  const raiz = path.resolve('/repo');
+  const dentro = path.join(raiz, 'tareas', '02-en-curso', 'TASK-901');
+  const casos: [string, string, number[]][] = [
+    [`${HELDOUT}/prueba.cjs`, raiz, [901]],
+    [HELDOUT, raiz, [901]],
+    [`${HELDOUT}/`, raiz, [901]],
+    ['TAREAS\\02-En-Curso\\task-901\\Aceptacion\\x.ts', raiz, [901]],
+    ['./tareas/../tareas/02-en-curso/TASK-901/aceptacion/x', raiz, [901]],
+    [`${CARPETA}/otra/../aceptacion/x`, raiz, [901]],
+    ['aceptacion/x.ts', dentro, [901]],
+    ['./aceptacion', dentro, [901]],
+    ['C:\\Users\\yo\\repo\\tareas\\01-en-diseno\\TASK-901\\aceptacion\\x', raiz, [901]],
+    ['/c/Users/yo/repo/tareas/01-en-diseno/TASK-901/aceptacion/x', raiz, [901]],
+    ['tareas/*/TASK-901/aceptacion/**', raiz, [901]],
+    ['tareas/03-en-revision/TASK-0901/aceptacion/x', raiz, [901]],
+    // Hermanas: no casan.
+    [`${CARPETA}/tarea.md`, raiz, []],
+    [`${CARPETA}/aceptacionX/x`, raiz, []],
+    [`${CARPETA}/aceptacion.md`, raiz, []],
+    [`${CARPETA}/aceptacion/../tarea.md`, raiz, []],
+    ['tarea.md', dentro, []],
+    ['tareas/TASK-901/aceptacion/x', raiz, []],
+    ['src/aceptacion/x', raiz, []],
+    ['', raiz, []],
+  ];
+  for (const [ruta, base, esperado] of casos) {
+    assert.deepEqual(numerosHeldoutEnRuta(ruta, base), esperado, ruta);
+  }
+});
+
+test('heldout-ruta: el texto de un comando de shell, palabra a palabra', () => {
+  const raiz = path.resolve('/repo');
+  const casos: [string, number[]][] = [
+    [`cat ${HELDOUT}/prueba.cjs`, [901]],
+    [`Get-Content ${HELDOUT.replace(/\//g, '\\')}\\prueba.cjs`, [901]],
+    [`git show develop:tareas/01-en-diseno/TASK-901/aceptacion/prueba.cjs`, [901]],
+    [`type "${HELDOUT}\\x" | Select-String a`, [901]],
+    [`ls -la '${HELDOUT}'`, [901]],
+    [`cat ${HELDOUT}/a && cat tareas/02-en-curso/TASK-902/aceptacion/b`, [901, 902]],
+    [`cat ${CARPETA}/tarea.md`, []],
+    [`cat ${CARPETA}/aceptacionX/x`, []],
+    ['grep -r aceptacion src', []],
+    ['echo hola', []],
+  ];
+  for (const [cmd, esperado] of casos) {
+    assert.deepEqual(numerosHeldoutEnTexto(cmd, raiz), esperado, cmd);
+  }
+});
+
+test('heldout-rama: el numero de tarea sale del nombre de la rama', () => {
+  assert.equal(numeroDeRama('feature/task-078-hook'), 78);
+  assert.equal(numeroDeRama('fix/TASK-901'), 901);
+  assert.equal(numeroDeRama('develop'), null);
+  assert.equal(numeroDeRama('feature/mytask-901-x'), null);
+});
+
+// ---------------------------------------------------------------------
+// Decision y puntos de entrada, contra repos reales
+// ---------------------------------------------------------------------
+
+async function conRepo(fn: (raiz: string) => Promise<void>): Promise<void> {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'guardia-heldout-'));
+  try {
+    git(['init', '-q', '-b', 'main'], raiz);
+    git(['config', 'user.email', 'test@example.com'], raiz);
+    git(['config', 'user.name', 'Test'], raiz);
+    await mkdir(path.join(raiz, HELDOUT), { recursive: true });
+    await mkdir(path.join(raiz, CARPETA, 'aceptacionX'), { recursive: true });
+    await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-902', 'aceptacion'), { recursive: true });
+    await writeFile(path.join(raiz, CARPETA, 'tarea.md'), '---\nid: TASK-901\n---\n', 'utf8');
+    await writeFile(path.join(raiz, HELDOUT, 'prueba.cjs'), '// held-out\n', 'utf8');
+    await writeFile(path.join(raiz, CARPETA, 'aceptacionX', 'x.txt'), 'x\n', 'utf8');
+    await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-902', 'aceptacion', 'p.cjs'), '// otra\n', 'utf8');
+    git(['add', '-A'], raiz);
+    git(['commit', '-q', '-m', 'inicial'], raiz);
+    git(['branch', 'develop'], raiz);
+    git(['checkout', '-q', '-b', RAMA, 'develop'], raiz);
+    await fn(raiz);
+  } finally {
+    await rm(raiz, { recursive: true, force: true });
+  }
+}
+
+function lanzar(entrada: string, cwd: string, tool_name: string, tool_input: Record<string, unknown>) {
+  return spawnSync(process.execPath, [entrada], {
+    input: JSON.stringify({ cwd, tool_name, tool_input, hook_event_name: 'PreToolUse' }),
+    encoding: 'utf8',
+  });
+}
+
+/** Entradas de cada herramienta de fichero que nombran `ruta` (absoluta o relativa). */
+function entradasFichero(ruta: string): [string, Record<string, unknown>][] {
+  return [
+    ['Read', { file_path: ruta }],
+    ['Edit', { file_path: ruta, old_string: 'a', new_string: 'b' }],
+    ['Write', { file_path: ruta, content: 'x' }],
+    ['MultiEdit', { file_path: ruta, edits: [] }],
+    ['NotebookEdit', { notebook_path: ruta, new_source: 'x' }],
+    ['Grep', { pattern: 'held', path: ruta }],
+    ['Glob', { pattern: `${ruta}/**` }],
+  ];
+}
+
+test('guardia-heldout (criterio 1): cada herramienta de fichero sale 2 ante la carpeta de la tarea de la rama actual y 0 ante sus hermanas', async () => {
+  await conRepo(async (raiz) => {
+    for (const ruta of [path.join(raiz, HELDOUT, 'prueba.cjs'), path.join(raiz, HELDOUT)]) {
+      for (const [tool, input] of entradasFichero(ruta)) {
+        const r = lanzar(ENTRADA_LECTURA, raiz, tool, input);
+        assert.equal(r.status, 2, `${tool} ${ruta}: ${r.stderr}`);
+        assert.match(r.stderr, /Bloqueado: esto nombra la carpeta aceptacion\/ de TASK-901, la tarea de la rama actual \("feature\/task-901-trabajo"\)/);
+        assert.doesNotMatch(r.stderr, /taskcode/i);
+      }
+    }
+    // Glob con path base y patron relativo; Grep con glob.
+    assert.equal(lanzar(ENTRADA_LECTURA, raiz, 'Glob', { path: path.join(raiz, CARPETA), pattern: 'aceptacion/*' }).status, 2);
+    assert.equal(lanzar(ENTRADA_LECTURA, raiz, 'Grep', { pattern: 'x', glob: `${HELDOUT}/*.cjs` }).status, 2);
+    for (const ruta of [path.join(raiz, CARPETA, 'tarea.md'), path.join(raiz, CARPETA, 'aceptacionX', 'x.txt')]) {
+      for (const [tool, input] of entradasFichero(ruta)) {
+        const r = lanzar(ENTRADA_LECTURA, raiz, tool, input);
+        assert.equal(r.status, 0, `${tool} ${ruta}: ${r.stderr}`);
+        assert.equal(r.stderr, '');
+      }
+    }
+    // Los held-out de OTRA tarea no son de esta rama.
+    assert.equal(lanzar(ENTRADA_LECTURA, raiz, 'Read', { file_path: path.join(raiz, 'tareas/02-en-curso/TASK-902/aceptacion/p.cjs') }).status, 0);
+    // El contenido que se escribe no cuenta: solo los campos de ruta.
+    assert.equal(lanzar(ENTRADA_LECTURA, raiz, 'Write', { file_path: path.join(raiz, 'notas.md'), content: `ver ${HELDOUT}/x` }).status, 0);
+  });
+});
+
+test('guardia-heldout (criterio 4): rutas relativas, con .., mayusculas y barras invertidas, resueltas contra el cwd', async () => {
+  await conRepo(async (raiz) => {
+    const dentro = path.join(raiz, CARPETA);
+    for (const [cwd, ruta] of [
+      [raiz, `${HELDOUT}/prueba.cjs`],
+      [raiz, `./tareas/../${HELDOUT}/prueba.cjs`],
+      [raiz, 'TAREAS\\02-EN-CURSO\\TASK-901\\ACEPTACION\\prueba.cjs'],
+      [dentro, 'aceptacion/prueba.cjs'],
+      [dentro, '.\\aceptacion\\prueba.cjs'],
+      [path.join(dentro, 'aceptacionX'), '../aceptacion/prueba.cjs'],
+    ] as const) {
+      const r = lanzar(ENTRADA_LECTURA, cwd, 'Read', { file_path: ruta });
+      assert.equal(r.status, 2, `${cwd} + ${ruta}: ${r.stderr}`);
+    }
+    assert.equal(lanzar(ENTRADA_LECTURA, dentro, 'Read', { file_path: 'tarea.md' }).status, 0);
+    assert.equal(lanzar(ENTRADA_LECTURA, dentro, 'Read', { file_path: 'aceptacion/../tarea.md' }).status, 0);
+  });
+});
+
+test('guardia-heldout (criterio 2): el guardian de Bash/PowerShell bloquea los comandos que nombran la carpeta', async () => {
+  await conRepo(async (raiz) => {
+    for (const [tool, command] of [
+      ['Bash', `cat ${HELDOUT}/prueba.cjs`],
+      ['Bash', `git show develop:${HELDOUT}/prueba.cjs`],
+      ['Bash', `cd . && head -5 "${HELDOUT}/prueba.cjs"`],
+      ['PowerShell', `Get-Content ${HELDOUT.replace(/\//g, '\\')}\\prueba.cjs`],
+      ['PowerShell', `Get-Content -Path '${path.join(raiz, HELDOUT, 'prueba.cjs')}'`],
+      // Decision 2 del plan: el remedio de finish lo ejecuta la persona; al agente se le bloquea.
+      [
+        'Bash',
+        `git rm -r -q --ignore-unmatch ${HELDOUT} && git read-tree --prefix=${HELDOUT}/ develop:${HELDOUT} && git checkout -- ${HELDOUT}`,
+      ],
+    ] as const) {
+      const r = lanzar(ENTRADA_SHELL, raiz, tool, { command });
+      assert.equal(r.status, 2, `${command}: ${r.stderr}`);
+      assert.match(r.stderr, /Bloqueado: esto nombra la carpeta aceptacion\/ de TASK-901/);
+    }
+    for (const command of [`cat ${CARPETA}/tarea.md`, `cat ${CARPETA}/aceptacionX/x.txt`, 'git status', 'grep -rn aceptacion src']) {
+      const r = lanzar(ENTRADA_SHELL, raiz, 'Bash', { command });
+      assert.equal(r.status, 0, `${command}: ${r.stderr}`);
+      assert.equal(r.stderr, '');
+    }
+  });
+});
+
+test('guardia-heldout (criterio 3): en la rama base (diseño) no bloquea; al cambiar a la rama de la tarea, si', async () => {
+  await conRepo(async (raiz) => {
+    const leer = () => lanzar(ENTRADA_LECTURA, raiz, 'Read', { file_path: path.join(raiz, HELDOUT, 'prueba.cjs') }).status;
+    const escribir = () => lanzar(ENTRADA_LECTURA, raiz, 'Write', { file_path: path.join(raiz, HELDOUT, 'nuevo.cjs'), content: 'x' }).status;
+    const cat = () => lanzar(ENTRADA_SHELL, raiz, 'Bash', { command: `cat ${HELDOUT}/prueba.cjs` }).status;
+    git(['checkout', '-q', 'develop'], raiz);
+    assert.deepEqual([leer(), escribir(), cat()], [0, 0, 0], 'en develop la persona los escribe con ayuda');
+    git(['checkout', '-q', RAMA], raiz);
+    assert.deepEqual([leer(), escribir(), cat()], [2, 2, 2]);
+    // Otra rama de tarea: los de TASK-901 no son suyos.
+    git(['checkout', '-q', '-b', 'feature/task-902-otra'], raiz);
+    assert.deepEqual([leer(), cat()], [0, 0]);
+  });
+});
+
+test('guardia-heldout: con HEAD desacoplado en un rebase, la rama es la que se esta rebasando', async () => {
+  await conRepo(async (raiz) => {
+    git(['checkout', '-q', '--detach'], raiz);
+    const leer = () => lanzar(ENTRADA_LECTURA, raiz, 'Read', { file_path: path.join(raiz, HELDOUT, 'prueba.cjs') }).status;
+    assert.equal(leer(), 0, 'desacoplado sin rebase: no hay rama de tarea');
+    const dirRebase = path.join(raiz, '.git', 'rebase-merge');
+    await mkdir(dirRebase);
+    await writeFile(path.join(dirRebase, 'head-name'), `refs/heads/${RAMA}\n`, 'utf8');
+    assert.equal(ramaActual(raiz), RAMA);
+    assert.equal(leer(), 2);
+  });
+});
+
+test('guardia-heldout: un fallo propio deja pasar (sin repo, cwd inexistente, JSON roto)', async () => {
+  const fuera = await mkdtemp(path.join(tmpdir(), 'guardia-heldout-fuera-'));
+  try {
+    await mkdir(path.join(fuera, HELDOUT), { recursive: true });
+    assert.equal(lanzar(ENTRADA_LECTURA, fuera, 'Read', { file_path: path.join(fuera, HELDOUT, 'x') }).status, 0, 'sin repo');
+    assert.equal(decidirHeldout({ cwd: path.join(fuera, 'no-existe'), tool_name: 'Read', tool_input: { file_path: `${HELDOUT}/x` } }).codigo, 0);
+    assert.equal(decidirHeldout({ tool_name: 'Read', tool_input: 'basura' }).codigo, 0);
+    for (const entrada of [ENTRADA_LECTURA, ENTRADA_SHELL]) {
+      const r = spawnSync(process.execPath, [entrada], { input: 'basura aceptacion', encoding: 'utf8' });
+      assert.equal(r.status, 0);
+      assert.equal(r.stderr, '');
+    }
+  } finally {
+    await rm(fuera, { recursive: true, force: true });
+  }
+});
+
+test('guardia-heldout: hooks.json declara el matcher de fichero exacto y ningun matcher incluye Agent ni Task', () => {
+  const j = JSON.parse(readFileSync(path.join(RAIZ_PLUGIN, 'hooks', 'hooks.json'), 'utf8')) as {
+    description: string;
+    hooks: { PreToolUse: { matcher: string; hooks: { command: string; args: string[]; timeout: number; if?: string }[] }[] };
+  };
+  const lectura = j.hooks.PreToolUse.filter((p) => p.hooks.some((h) => h.args.some((a) => a.endsWith('/pre-tool-lectura.js'))));
+  assert.equal(lectura.length, 1);
+  const pre = lectura[0];
+  assert.ok(pre);
+  assert.equal(pre.matcher, MATCHER_LECTURA);
+  assert.deepEqual(pre.hooks.map((h) => [h.command, h.args, h.if]), [
+    ['node', ['${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/pre-tool-lectura.js'], undefined],
+  ]);
+  for (const p of j.hooks.PreToolUse) {
+    const herramientas = p.matcher.split('|');
+    assert.ok(!herramientas.includes('Agent') && !herramientas.includes('Task'), p.matcher);
+  }
+  assert.match(j.description, /aceptacion\//);
+  assert.doesNotMatch(j.description, /taskcode|TASK-\d/i);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
index 99b890a..15e7a23 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
@@ -349,10 +349,11 @@ test('guardia: hooks.json declara el PreToolUse sin filtro if, en forma exec, si
     description: string;
     hooks: { PreToolUse: { matcher: string; hooks: { type: string; command: string; args: string[]; timeout: number; if?: string }[] }[] };
   };
-  assert.equal(j.hooks.PreToolUse.length, 1);
-  const pre = j.hooks.PreToolUse[0];
+  // TASK-078 anade el de herramientas de fichero: el de shell se busca por su entrada.
+  const shell = j.hooks.PreToolUse.filter((p) => p.matcher === 'Bash|PowerShell');
+  assert.equal(shell.length, 1);
+  const pre = shell[0];
   assert.ok(pre);
-  assert.equal(pre.matcher, 'Bash|PowerShell');
   assert.equal(pre.hooks.length, 1);
   const h = pre.hooks[0];
   assert.ok(h);
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-078/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-078/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-078/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-078/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-078/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-078/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-078/tarea.md                                                       |   3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-heldout.js                             |  15 +++++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heldout.js                                        |  56 +++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task-id.js                                        |   5 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/entrada-pretooluse.js                            |  16 +++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-heldout.js                               | 101 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                 |  13 ++---------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/pre-tool-lectura.js                              |  30 +++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/pre-tool-merge.js                                |  40 ++++++++++++++++++++++++++-------
 15 files changed, 252 insertions(+), 27 deletions(-)
````
