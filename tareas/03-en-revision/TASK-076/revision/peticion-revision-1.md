# Peticion de revision — TASK-076 (ronda 1)

- Tarea: TASK-076 — Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico
- Rama revisada: fix/task-076-doctor-avisa-de-hooks-pretooluse-sobre-a
- Rama base: develop
- Commit revisado (HEAD): c85d64106bf9e8619a3af3b7e44e6721f5913120
- Fecha: 2026-11-06
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-076 (criterios de aceptacion y plan)

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
c85d641 fix(TASK-076): doctor avisa de hooks PreToolUse sobre Agent/Task, doc y version 0.9.0
2a96d1e chore(TASK-076): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.claude-plugin/marketplace.json b/.claude-plugin/marketplace.json
index 80b75cf..efbea89 100644
--- a/.claude-plugin/marketplace.json
+++ b/.claude-plugin/marketplace.json
@@ -5,14 +5,14 @@
     "url": "https://github.com/charliebk"
   },
   "description": "Marketplace de TaskCode: metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
-  "version": "0.8.0",
+  "version": "0.9.0",
   "plugins": [
     {
       "name": "taskcode-plugin",
       "displayName": "TaskCode",
       "source": "./taskcode-marketplace/plugins/taskcode-plugin",
       "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista. Expone el CLI taskctl.",
-      "version": "0.8.0",
+      "version": "0.9.0",
       "author": {
         "name": "charlie.bk"
       },
diff --git a/CHANGELOG.md b/CHANGELOG.md
index acb5c86..546a902 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,25 @@
 # Changelog
 
 ## Sin publicar
+
+## 0.9.0 — 2026-11-06
+
+Doctor avisa de los hooks que bloquean los subagentes (TASK-076): con el modo de
+permisos automatico, Claude Code 2.1.317+ deniega el lanzamiento de un subagente
+(Auto-Mode Bypass) si un hook PreToolUse sobre Agent/Task reescribe el encargo, y
+plan y review se paraban sin explicacion. `taskctl doctor` da ahora un AVISO
+`hooks-subagente` por cada hook PreToolUse cuyo matcher alcanza a Agent o Task
+(tambien `""`, `"*"` o sin matcher) en los plugins habilitados (version activa de
+`installed_plugins.json`: su `hooks/hooks.json` y los `hooks` de su `plugin.json`)
+y en los settings de usuario, de proyecto y locales, con origen, ruta y matcher; no
+cambia el codigo de salida. El README trae "Problemas conocidos" con las salidas, y
+la skill de flujo manda ejecutar `taskctl doctor` y parar ante una denegacion.
+Esta version incluye ademas todo lo acumulado desde 0.8.0 (TASK-066 a 078:
+held-out, puerta de verificacion, hooks Stop y de merges, doctor-deploy, cobertura).
+Actualizar con `claude plugin marketplace update taskcode-marketplace`,
+`claude plugin update taskcode-plugin@taskcode-marketplace` y reiniciar
+Claude Code (o `/reload-plugins`). Despues, `taskctl doctor` en cada proyecto.
+
 - TASK-074 (feature) — Cobertura sobre las lineas cambiadas (2026-11-05)
 - TASK-078 (feature) — Hook que impide leer y editar los held-out de la tarea en curso (2026-11-05)
 - TASK-075 (fix) — Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+ (2026-11-05)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
index 5f819ab..e60479d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
@@ -1,7 +1,7 @@
 {
   "name": "taskcode-plugin",
   "displayName": "TaskCode",
-  "version": "0.8.0",
+  "version": "0.9.0",
   "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
   "author": {
     "name": "charlie.bk"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 0006c94..7763668 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -252,11 +252,11 @@ ejecución aplicado:
 
 ```
 $ node bin/taskctl --help
-taskctl 0.8.0 — TaskCode
+taskctl 0.9.0 — TaskCode
 [...]
 
 $ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
-taskctl 0.8.0 — TaskCode
+taskctl 0.9.0 — TaskCode
 [...]                            # salida idéntica
 
 $ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
@@ -490,6 +490,45 @@ no porque no fuera técnicamente posible — se deja anotado como opción más
 barata que esperar a una sesión nativa, por si alguien quiere intentarlo
 antes.
 
+## Problemas conocidos
+
+### Un subagente se deniega con «Auto-Mode Bypass»
+
+**Síntoma.** Con Claude Code en modo de permisos automático (*auto mode*; no
+confundir con `modo_flujo: automatico` del plugin), las fases que lanzan subagentes (`plan` con
+sus roles y el unificador, `review` con los revisores) se paran porque Claude
+Code deniega el lanzamiento y cita *Auto-Mode Bypass*, sin más explicación.
+
+**Causa.** Desde Claude Code 2.1.317/2.1.318, el modo automático deniega el
+lanzamiento de un subagente cuando un hook `PreToolUse` cuyo matcher alcanza
+a `Agent` (o `Task`) reescribe el encargo. Es lo que hace, por ejemplo,
+context-mode 1.0.169, que añade un bloque al prompt de cada subagente. El
+hook puede venir de otro plugin instalado o de un `settings.json` (de
+usuario, de proyecto o `settings.local.json`).
+
+**Diagnóstico.** `taskctl doctor` (o `taskctl doctor --json`) lo detecta: da
+un AVISO con id `hooks-subagente` por cada hook `PreToolUse` cuyo matcher
+alcanza a `Agent` o `Task` (también `""`, `"*"` o sin matcher), con el origen
+(plugin o settings), la ruta del fichero y el matcher literal. Solo mira los
+plugins habilitados (`enabledPlugins`) y la versión instalada activa de cada
+uno. Es un aviso y no cambia el código de salida: el hook puede ser inocuo.
+
+**Salidas** (cualquiera de las tres):
+
+1. **Quitar `Agent` y `Task` del matcher.** Si el hook está en tus settings,
+   edítalo. Si es de un plugin, sus ficheros se sobrescriben al actualizarlo:
+   la forma estable es un hook propio de `SessionStart` en tus settings que,
+   al arrancar cada sesión, reescriba el `hooks.json` de ese plugin sin
+   `Agent` ni `Task` en el matcher.
+2. **Desactivar el plugin causante:** `"enabledPlugins": { "<plugin>@<marketplace>": false }`
+   en `settings.json`, o `/plugin` en Claude Code.
+3. **Aprobar a mano cada lanzamiento:** salir del modo de permisos
+   automático de Claude Code (por ejemplo, al modo por defecto, que pregunta)
+   mientras se lanzan los subagentes, y aprobar cada uno.
+
+Después, `taskctl doctor` debe dar `hooks-subagente` en `ok` (salvo que
+elijas la tercera salida).
+
 ## Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse
 
 TASK-006 pide explícitamente (AC3) dejar constancia de que el "mecanismo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package.json b/taskcode-marketplace/plugins/taskcode-plugin/package.json
index 8590d74..43b64dd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package.json
@@ -1,6 +1,6 @@
 {
   "name": "taskcode-plugin",
-  "version": "0.8.0",
+  "version": "0.9.0",
   "description": "TaskCode: metodologia de tareas/sprints + Git-Flow + revision por pares de agentes, como plugin de Claude Code.",
   "private": true,
   "engines": {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 93d5d54..5273c58 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -123,3 +123,10 @@ En los dos casos la skill termina ahi, sin volver a pasar por esta seccion.
   paso editando ficheros a mano.
 - Las guardas del CLI (limite de trabajo en curso, rama base limpia, revisor
   independiente, veredicto, segunda opinion) no se rodean en ningun modo.
+- Si Claude Code deniega el lanzamiento de un subagente (roles, unificador,
+  revisores; con el modo de permisos automatico de Claude Code suele decir «Auto-Mode Bypass»), ejecutar
+  `taskctl doctor`, mostrar su aviso `hooks-subagente` y parar. No rodear la
+  denegacion: ni hacer tu el trabajo del subagente ni relanzarlo con otro
+  encargo. La causa habitual es un hook PreToolUse de otro plugin o de los
+  settings que reescribe el encargo; las salidas estan en «Problemas
+  conocidos» del README del plugin.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 8bb0d1f..c2aff6b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -59,7 +59,7 @@ import {
 import { ConfigError } from './core/config.js';
 import { formatearInstante } from './core/transiciones.js';
 
-const VERSION = '0.8.0';
+const VERSION = '0.9.0';
 
 const HELP = `taskctl ${VERSION} — TaskCode
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 2216ef6..025a424 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -51,6 +51,8 @@ import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
 import { urlsDeOrigin } from '../fs/git.js';
 import { sondearCli } from '../fs/merge-request.js';
 import { resolverRemotoDeOrigin } from './finish-opciones.js';
+import { directorioConfigClaude } from '../fs/config-claude.js';
+import { sondearHooksClaude } from '../fs/sondas-hooks-claude.js';
 
 export class DoctorCommandError extends Error {}
 
@@ -70,6 +72,8 @@ export interface DoctorCommandDeps {
   timeoutPlataformaMs?: number;
   /** Timeout de `git status` (por defecto 15 s). Para los tests. */
   timeoutGitMs?: number;
+  /** Directorio de configuracion de Claude Code (por defecto CLAUDE_CONFIG_DIR o ~/.claude). Para los tests. */
+  configClaudeDir?: string;
 }
 
 export interface DoctorCommandResult {
@@ -538,6 +542,37 @@ function comprobarPlataforma(cwd: string, cfg: TaskcodeConfig | null, hayOrigin:
   return fallo('plataforma', una(s.problema), `${s.ayuda}.`);
 }
 
+// ---------------------------------------------------------------------
+// Hooks que alcanzan a los subagentes (TASK-076)
+// ---------------------------------------------------------------------
+
+const ARREGLO_HOOKS_SUBAGENTE =
+  'Con el modo de permisos automatico, Claude Code puede denegar el lanzamiento de subagentes (Auto-Mode Bypass) si un hook ' +
+  'PreToolUse reescribe el encargo. Salidas: quita Agent y Task del matcher de ese hook (si es de un plugin, con ' +
+  'un hook propio de SessionStart que lo reescriba al arrancar), desactiva el plugin causante en enabledPlugins, ' +
+  'o sal del modo de permisos automatico y aprueba a mano cada lanzamiento. Ver "Problemas conocidos" en el README del plugin.';
+
+/**
+ * Siempre aviso como maximo: los ficheros son de terceros y el hook puede ser
+ * inocuo. La sonda no lanza, asi que un fichero ajeno roto nunca acaba en el
+ * `error` de `envolver`: se nombra en el mensaje y sigue.
+ */
+export function comprobarHooksSubagente(deps: DoctorCommandDeps): Comprobacion[] {
+  const s = sondearHooksClaude(deps.configClaudeDir ?? directorioConfigClaude(), deps.repoCwd);
+  const cs: Comprobacion[] = s.hallazgos.map((h) =>
+    aviso(
+      'hooks-subagente',
+      una(`${h.origen} tiene un hook PreToolUse que alcanza a Agent/Task (matcher "${h.matcher}") en ${h.ruta}`),
+      ARREGLO_HOOKS_SUBAGENTE
+    )
+  );
+  if (cs.length === 0) {
+    const nota = s.ilegibles.length === 0 ? '' : `; sin leer: ${s.ilegibles.join('; ')}`;
+    cs.push(ok('hooks-subagente', una(`ningun hook PreToolUse alcanza a Agent/Task (${s.leidos} ficheros leidos${nota})`)));
+  }
+  return cs;
+}
+
 // ---------------------------------------------------------------------
 // Orquestacion
 // ---------------------------------------------------------------------
@@ -597,6 +632,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
       comprobarPlataforma(cwd, cfg, hayOrigin, deps.timeoutPlataformaMs ?? TIMEOUT_PLATAFORMA_MS)
     )
   );
+  cs.push(...envolver('hooks-subagente', () => comprobarHooksSubagente(deps)));
 
   return {
     comprobaciones: cs,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
new file mode 100644
index 0000000..55d65e0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
@@ -0,0 +1,81 @@
+/**
+ * Nucleo puro de la comprobacion `hooks-subagente` de `taskctl doctor`
+ * (TASK-076): decide si un hook PreToolUse alcanza al lanzamiento de
+ * subagentes (herramientas `Agent` y `Task`). Desde Claude Code 2.1.317 el
+ * modo automatico puede denegar el lanzamiento (Auto-Mode Bypass) cuando un
+ * hook de ese tipo reescribe el encargo.
+ *
+ * Semantica del matcher (plan de TASK-076, Carlos 2026-11-06):
+ * - `""`, `"*"` o sin matcher: alcanza a todas las herramientas, cuenta.
+ * - Solo letras, digitos, `_` y `|`: lista de nombres exactos separada por `|`.
+ * - Cualquier otra cosa: regex anclada (`^(?:...)$`); si no compila, se parte
+ *   por `|` y se compara literal.
+ */
+
+/** Herramientas con las que Claude Code lanza subagentes. */
+export const HERRAMIENTAS_SUBAGENTE: readonly string[] = ['Agent', 'Task'];
+
+export interface HallazgoHook {
+  /** Quien declara el hook: `plugin x@y`, `settings de usuario`... */
+  origen: string;
+  /** Fichero donde esta declarado. */
+  ruta: string;
+  /** El matcher tal cual (`(sin matcher)` si falta). */
+  matcher: string;
+}
+
+function porNombres(matcher: string): boolean {
+  const nombres = matcher.split('|').map((n) => n.trim());
+  return HERRAMIENTAS_SUBAGENTE.some((h) => nombres.includes(h));
+}
+
+/** true si un matcher de PreToolUse se aplica a `Agent` o a `Task`. */
+export function matcherAlcanzaSubagente(matcher: unknown): boolean {
+  if (matcher === undefined || matcher === null) return true;
+  if (typeof matcher !== 'string') return false;
+  const m = matcher.trim();
+  if (m === '' || m === '*') return true;
+  if (/^[A-Za-z0-9_|]+$/.test(m)) return porNombres(m);
+  let re: RegExp;
+  try {
+    re = new RegExp(`^(?:${m})$`);
+  } catch {
+    return porNombres(m);
+  }
+  return HERRAMIENTAS_SUBAGENTE.some((h) => re.test(h));
+}
+
+const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
+
+/**
+ * Hallazgos de un JSON con la forma de `hooks.json` o `settings.json`
+ * (`{hooks: {PreToolUse: [{matcher, hooks}]}}`). Una forma inesperada no es
+ * un fallo: simplemente no hay hallazgos.
+ */
+export function hooksQueAlcanzanSubagente(json: unknown, origen: string, ruta: string): HallazgoHook[] {
+  if (!esObjeto(json) || !esObjeto(json['hooks'])) return [];
+  const pre = json['hooks']['PreToolUse'];
+  if (!Array.isArray(pre)) return [];
+  const hallazgos: HallazgoHook[] = [];
+  for (const entrada of pre) {
+    if (!esObjeto(entrada)) continue;
+    const matcher = entrada['matcher'];
+    if (!matcherAlcanzaSubagente(matcher)) continue;
+    hallazgos.push({ origen, ruta, matcher: typeof matcher === 'string' ? matcher : '(sin matcher)' });
+  }
+  return hallazgos;
+}
+
+/**
+ * Si un plugin esta habilitado segun los `enabledPlugins` de los settings, del
+ * mas especifico al menos (local de proyecto, proyecto, usuario). Sin entrada
+ * en ninguno se da por habilitado: es lo prudente para un aviso.
+ */
+export function pluginHabilitado(clave: string, settings: readonly unknown[]): boolean {
+  for (const s of settings) {
+    if (!esObjeto(s) || !esObjeto(s['enabledPlugins'])) continue;
+    const v = s['enabledPlugins'][clave];
+    if (typeof v === 'boolean') return v;
+  }
+  return true;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-claude.ts
new file mode 100644
index 0000000..bdc659b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-claude.ts
@@ -0,0 +1,12 @@
+/**
+ * Directorio de configuracion de Claude Code: `CLAUDE_CONFIG_DIR` si esta
+ * definida y no vacia; si no, `~/.claude`. Lo usan las transcripciones de
+ * subagentes (TASK-023) y la sonda de hooks de doctor (TASK-076).
+ */
+import { homedir } from 'node:os';
+import path from 'node:path';
+
+export function directorioConfigClaude(env: NodeJS.ProcessEnv = process.env): string {
+  const d = env['CLAUDE_CONFIG_DIR'];
+  return d !== undefined && d.trim() !== '' ? d : path.join(homedir(), '.claude');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts
new file mode 100644
index 0000000..d3f3c12
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts
@@ -0,0 +1,112 @@
+/**
+ * Sonda de disco de la comprobacion `hooks-subagente` de doctor (TASK-076).
+ * Lee, sin escribir nada, donde Claude Code declara hooks:
+ *
+ * - settings de usuario (`<config>/settings.json`) y de proyecto
+ *   (`.claude/settings.json` y `.claude/settings.local.json`);
+ * - los plugins instalados y habilitados segun
+ *   `<config>/plugins/installed_plugins.json` (solo la version activa de
+ *   cada uno, no toda la cache): su `hooks/hooks.json` y los `hooks` de su
+ *   `.claude-plugin/plugin.json` (en linea o como ruta).
+ *
+ * Nada de aqui lanza: un fichero ausente no cuenta y uno ilegible o con JSON
+ * roto se anota en `ilegibles`. Son ficheros de terceros; doctor no los
+ * convierte en un error.
+ */
+import { existsSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+import { hooksQueAlcanzanSubagente, pluginHabilitado, type HallazgoHook } from '../core/hooks-subagente.js';
+
+export interface SondeoHooks {
+  hallazgos: HallazgoHook[];
+  /** Ficheros que existen y se han leido como JSON. */
+  leidos: number;
+  /** `ruta: motivo` de los que existen pero no se pudieron leer o parsear. */
+  ilegibles: string[];
+}
+
+type Lectura = { estado: 'ausente' } | { estado: 'ok'; json: unknown } | { estado: 'ilegible'; motivo: string };
+
+function leerJson(ruta: string): Lectura {
+  if (!existsSync(ruta)) return { estado: 'ausente' };
+  try {
+    return { estado: 'ok', json: JSON.parse(readFileSync(ruta, 'utf8').replace(/^﻿/, '')) as unknown };
+  } catch (e: unknown) {
+    return { estado: 'ilegible', motivo: (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim() };
+  }
+}
+
+const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
+
+function mismaRuta(a: string, b: string): boolean {
+  const n = (p: string): string => {
+    const r = path.resolve(p).replace(/[\\/]+$/, '');
+    return process.platform === 'win32' ? r.toLowerCase() : r;
+  };
+  return n(a) === n(b);
+}
+
+export function sondearHooksClaude(configDir: string, repoCwd: string): SondeoHooks {
+  const r: SondeoHooks = { hallazgos: [], leidos: 0, ilegibles: [] };
+
+  const leer = (ruta: string): unknown => {
+    const l = leerJson(ruta);
+    if (l.estado === 'ok') {
+      r.leidos++;
+      return l.json;
+    }
+    if (l.estado === 'ilegible') r.ilegibles.push(`${ruta}: ${l.motivo}`);
+    return undefined;
+  };
+
+  const examinar = (json: unknown, origen: string, ruta: string): void => {
+    r.hallazgos.push(...hooksQueAlcanzanSubagente(json, origen, ruta));
+  };
+
+  // Settings: de usuario y de proyecto. Se guardan para enabledPlugins.
+  const rutaUsuario = path.join(configDir, 'settings.json');
+  const rutaProyecto = path.join(repoCwd, '.claude', 'settings.json');
+  const rutaLocal = path.join(repoCwd, '.claude', 'settings.local.json');
+  const usuario = leer(rutaUsuario);
+  const proyecto = leer(rutaProyecto);
+  const local = leer(rutaLocal);
+  examinar(usuario, 'settings de usuario', rutaUsuario);
+  examinar(proyecto, 'settings del proyecto', rutaProyecto);
+  examinar(local, 'settings locales del proyecto', rutaLocal);
+
+  // Plugins instalados y habilitados.
+  const rutaInstalados = path.join(configDir, 'plugins', 'installed_plugins.json');
+  const instalados = leer(rutaInstalados);
+  if (instalados === undefined) return r;
+  if (!esObjeto(instalados) || !esObjeto(instalados['plugins'])) {
+    r.ilegibles.push(`${rutaInstalados}: formato no reconocido (sin "plugins")`);
+    return r;
+  }
+  const settings = [local, proyecto, usuario];
+  for (const [clave, entradas] of Object.entries(instalados['plugins'])) {
+    if (!Array.isArray(entradas) || !pluginHabilitado(clave, settings)) continue;
+    // La instalacion que aplica aqui: la de usuario o la de este proyecto.
+    const entrada = entradas.find(
+      (e): e is Record<string, unknown> =>
+        esObjeto(e) &&
+        typeof e['installPath'] === 'string' &&
+        (typeof e['projectPath'] !== 'string' || mismaRuta(e['projectPath'], repoCwd))
+    );
+    if (entrada === undefined) continue;
+    const dir = entrada['installPath'] as string;
+    const origen = `plugin ${clave}`;
+    const rutaHooks = path.join(dir, 'hooks', 'hooks.json');
+    examinar(leer(rutaHooks), origen, rutaHooks);
+    const rutaManifiesto = path.join(dir, '.claude-plugin', 'plugin.json');
+    const manifiesto = leer(rutaManifiesto);
+    if (!esObjeto(manifiesto)) continue;
+    const h = manifiesto['hooks'];
+    if (esObjeto(h)) {
+      examinar(manifiesto, origen, rutaManifiesto);
+    } else if (typeof h === 'string') {
+      const ruta = path.resolve(dir, h);
+      if (!mismaRuta(ruta, rutaHooks)) examinar(leer(ruta), origen, ruta);
+    }
+  }
+  return r;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/transcripciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/transcripciones.ts
index 4a68136..edb11ef 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/transcripciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/transcripciones.ts
@@ -4,15 +4,11 @@
  * `<config>` = `CLAUDE_CONFIG_DIR` si esta definida y, si no, `~/.claude`.
  */
 import { readdir, readFile } from 'node:fs/promises';
-import { homedir } from 'node:os';
 import path from 'node:path';
 import { esAgentIdValido } from '../core/coste-transcripcion.js';
 import { isEnoent, isEnotdir } from './task-store.js';
 
-export function directorioConfigClaude(env: NodeJS.ProcessEnv = process.env): string {
-  const d = env['CLAUDE_CONFIG_DIR'];
-  return d !== undefined && d.trim() !== '' ? d : path.join(homedir(), '.claude');
-}
+export { directorioConfigClaude } from './config-claude.js';
 
 async function subdirectorios(dir: string): Promise<string[]> {
   try {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
new file mode 100644
index 0000000..c7a840c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
@@ -0,0 +1,239 @@
+/**
+ * `taskctl doctor`, comprobacion `hooks-subagente` (TASK-076). Repo Git
+ * temporal de verdad y un directorio de configuracion de Claude Code temporal
+ * con installed_plugins.json, hooks.json y settings.json reales; el CLI por
+ * spawn con CLAUDE_CONFIG_DIR para el JSON y el codigo de salida.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { runDoctorCommand } from '../../src/commands/doctor.js';
+import type { Comprobacion } from '../../src/core/doctor.js';
+import { STATE_FOLDER } from '../../src/core/task.js';
+import { git } from '../helpers/finish-fixtures.js';
+import { plantillaRepo } from '../helpers/repo-plantilla.js';
+
+const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
+
+const conRepo = plantillaRepo('taskctl-doctor-hooks-', async (repoRoot) => {
+  git(['init', '-q', '-b', 'main'], repoRoot);
+  git(['config', 'user.email', 'test@example.com'], repoRoot);
+  git(['config', 'user.name', 'Test'], repoRoot);
+  for (const c of Object.values(STATE_FOLDER)) {
+    await mkdir(path.join(repoRoot, 'tareas', c), { recursive: true });
+    await writeFile(path.join(repoRoot, 'tareas', c, '.gitkeep'), '', 'utf8');
+  }
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', 'inicial'], repoRoot);
+  git(['checkout', '-q', '-b', 'develop'], repoRoot);
+});
+
+async function conConfig(fn: (config: string) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-config-claude-'));
+  try {
+    await fn(dir);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+async function escribirJson(ruta: string, json: unknown): Promise<void> {
+  await mkdir(path.dirname(ruta), { recursive: true });
+  await writeFile(ruta, JSON.stringify(json, null, 2), 'utf8');
+}
+
+const HOOK_AGENT = { hooks: { PreToolUse: [{ matcher: 'Bash' }, { matcher: 'Agent', hooks: [{ type: 'command', command: 'x' }] }] } };
+const HOOK_INOCUO = { hooks: { PreToolUse: [{ matcher: 'Bash|Read|mcp__' }] } };
+
+/** Instala un plugin en el config temporal (installed_plugins.json v2) con ese hooks.json. */
+async function instalarPlugin(config: string, clave: string, hooks: unknown, extra: Record<string, unknown> = {}): Promise<string> {
+  const installPath = path.join(config, 'plugins', 'cache', ...clave.split('@').reverse(), '1.0.0');
+  await escribirJson(path.join(installPath, 'hooks', 'hooks.json'), hooks);
+  const ruta = path.join(config, 'plugins', 'installed_plugins.json');
+  let actual: { version: number; plugins: Record<string, unknown[]> } = { version: 2, plugins: {} };
+  try {
+    actual = JSON.parse(await (await import('node:fs/promises')).readFile(ruta, 'utf8'));
+  } catch {
+    /* primero */
+  }
+  actual.plugins[clave] = [{ scope: 'user', installPath, version: '1.0.0', ...extra }];
+  await escribirJson(ruta, actual);
+  return path.join(installPath, 'hooks', 'hooks.json');
+}
+
+function hooks(repoRoot: string, config: string): Comprobacion[] {
+  return runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config }).comprobaciones.filter(
+    (c) => c.id === 'hooks-subagente'
+  );
+}
+
+test('plugin habilitado con PreToolUse sobre Agent: AVISO con origen, ruta y matcher; codigo 0', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      const ruta = await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT);
+      const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config });
+      const cs = r.comprobaciones.filter((c) => c.id === 'hooks-subagente');
+      assert.equal(cs.length, 1, JSON.stringify(cs));
+      const c = cs[0] as Comprobacion;
+      assert.equal(c.nivel, 'aviso');
+      assert.ok(c.mensaje.includes('plugin ctx@mkt'), c.mensaje);
+      assert.ok(c.mensaje.includes(ruta), c.mensaje);
+      assert.ok(c.mensaje.includes('"Agent"'), c.mensaje);
+      assert.match(c.arreglo ?? '', /Auto-Mode Bypass/);
+      assert.match(c.arreglo ?? '', /SessionStart/);
+      assert.match(c.arreglo ?? '', /enabledPlugins/);
+      assert.equal(r.codigo, 0);
+    });
+  });
+});
+
+test('sin hooks sobre Agent/Task: ok, sin avisos de hooks', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await instalarPlugin(config, 'ctx@mkt', HOOK_INOCUO);
+      await escribirJson(path.join(config, 'settings.json'), HOOK_INOCUO);
+      const cs = hooks(repoRoot, config);
+      assert.equal(cs.length, 1);
+      assert.equal(cs[0]?.nivel, 'ok');
+      assert.match(cs[0]?.mensaje ?? '', /ningun hook PreToolUse alcanza a Agent\/Task \(3 ficheros leidos\)/);
+    });
+  });
+});
+
+test('config de Claude vacia o inexistente: ok', async () => {
+  await conRepo(async (repoRoot) => {
+    const cs = hooks(repoRoot, path.join(repoRoot, 'no-existe'));
+    assert.deepEqual(cs.map((c) => c.nivel), ['ok']);
+  });
+});
+
+test('plugin desactivado en enabledPlugins: no avisa; el local del proyecto puede reactivarlo', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT);
+      await escribirJson(path.join(config, 'settings.json'), { enabledPlugins: { 'ctx@mkt': false } });
+      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['ok']);
+      await escribirJson(path.join(repoRoot, '.claude', 'settings.local.json'), { enabledPlugins: { 'ctx@mkt': true } });
+      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['aviso']);
+    });
+  });
+});
+
+test('instalacion de otro proyecto (projectPath distinto): no avisa', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT, { scope: 'project', projectPath: path.join(config, 'otro') });
+      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['ok']);
+      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT, { scope: 'project', projectPath: repoRoot });
+      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['aviso']);
+    });
+  });
+});
+
+test('versiones viejas en la cache que no estan en installed_plugins.json: no avisan', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await instalarPlugin(config, 'ctx@mkt', HOOK_INOCUO);
+      await escribirJson(path.join(config, 'plugins', 'cache', 'mkt', 'ctx', '0.9.0', 'hooks', 'hooks.json'), HOOK_AGENT);
+      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['ok']);
+    });
+  });
+});
+
+test('hooks en linea en plugin.json y como ruta: avisan', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      const enLinea = path.dirname(path.dirname(await instalarPlugin(config, 'a@mkt', {})));
+      await escribirJson(path.join(enLinea, '.claude-plugin', 'plugin.json'), { name: 'a', ...HOOK_AGENT });
+      const comoRuta = path.dirname(path.dirname(await instalarPlugin(config, 'b@mkt', {})));
+      await escribirJson(path.join(comoRuta, 'otros', 'h.json'), { hooks: { PreToolUse: [{ matcher: 'Task' }] } });
+      await escribirJson(path.join(comoRuta, '.claude-plugin', 'plugin.json'), { name: 'b', hooks: './otros/h.json' });
+      const cs = hooks(repoRoot, config);
+      assert.equal(cs.length, 2, JSON.stringify(cs));
+      assert.ok(cs.every((c) => c.nivel === 'aviso'));
+      assert.ok(cs.some((c) => c.mensaje.includes('plugin a@mkt') && c.mensaje.includes('plugin.json')));
+      assert.ok(cs.some((c) => c.mensaje.includes('plugin b@mkt') && c.mensaje.includes('h.json') && c.mensaje.includes('"Task"')));
+    });
+  });
+});
+
+test('settings de usuario, de proyecto y local: cada uno nombra su origen y su ruta', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      const usuario = path.join(config, 'settings.json');
+      const proyecto = path.join(repoRoot, '.claude', 'settings.json');
+      const local = path.join(repoRoot, '.claude', 'settings.local.json');
+      await escribirJson(usuario, { hooks: { PreToolUse: [{ matcher: '*' }] } });
+      await escribirJson(proyecto, { hooks: { PreToolUse: [{ matcher: 'Edit|Task' }] } });
+      await escribirJson(local, { hooks: { PreToolUse: [{ matcher: '' }] } });
+      const cs = hooks(repoRoot, config);
+      assert.equal(cs.length, 3, JSON.stringify(cs));
+      const m = cs.map((c) => c.mensaje);
+      assert.ok(m.some((x) => x.startsWith('settings de usuario') && x.includes(usuario) && x.includes('"*"')), m.join('\n'));
+      assert.ok(m.some((x) => x.startsWith('settings del proyecto') && x.includes(proyecto)), m.join('\n'));
+      assert.ok(m.some((x) => x.startsWith('settings locales del proyecto') && x.includes(local)), m.join('\n'));
+    });
+  });
+});
+
+test('JSON roto o installed_plugins.json con formato desconocido: no es error, se nombra en el ok', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await mkdir(config, { recursive: true });
+      await writeFile(path.join(config, 'settings.json'), '{ roto', 'utf8');
+      await escribirJson(path.join(config, 'plugins', 'installed_plugins.json'), { version: 99, cosas: [] });
+      const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config });
+      const cs = r.comprobaciones.filter((c) => c.id === 'hooks-subagente');
+      assert.deepEqual(cs.map((c) => c.nivel), ['ok']);
+      assert.match(cs[0]?.mensaje ?? '', /sin leer: .*settings\.json: .*installed_plugins\.json: formato no reconocido/);
+      assert.equal(r.codigo, 0);
+    });
+  });
+});
+
+test('CLI --json: el aviso lleva el id estable hooks-subagente, nivel aviso y arreglo; codigo 0', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT);
+      const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--json'], {
+        cwd: repoRoot,
+        encoding: 'utf8',
+        env: { ...process.env, CLAUDE_CONFIG_DIR: config },
+      });
+      assert.equal(r.status, 0, r.stdout + r.stderr);
+      const j = JSON.parse(r.stdout) as { comprobaciones: Comprobacion[] };
+      const c = j.comprobaciones.find((x) => x.id === 'hooks-subagente');
+      assert.ok(c, r.stdout);
+      assert.equal(c.nivel, 'aviso');
+      assert.match(c.mensaje, /plugin ctx@mkt/);
+      assert.match(c.arreglo ?? '', /Problemas conocidos/);
+    });
+  });
+});
+
+// ---------------------------------------------------------------------
+// Documentacion (criterios 3 y 4)
+// ---------------------------------------------------------------------
+
+const PLUGIN_ROOT = path.join(import.meta.dirname, '..', '..', '..');
+
+test('README: Problemas conocidos con sintoma, causa, diagnostico y las tres salidas', async () => {
+  const { readFile } = await import('node:fs/promises');
+  const readme = await readFile(path.join(PLUGIN_ROOT, 'README.md'), 'utf8');
+  const i = readme.indexOf('## Problemas conocidos');
+  assert.ok(i >= 0, 'falta la seccion "## Problemas conocidos"');
+  const seccion = readme.slice(i, readme.indexOf('\n## ', i + 1));
+  for (const frase of ['Auto-Mode Bypass', 'PreToolUse', 'Agent', 'taskctl doctor', 'hooks-subagente', 'SessionStart', 'enabledPlugins', 'Aprobar a mano']) {
+    assert.ok(seccion.includes(frase), `la seccion no menciona "${frase}"`);
+  }
+});
+
+test('skill task-workflow (avance): ante un subagente denegado, taskctl doctor y no rodear', async () => {
+  const { readFile } = await import('node:fs/promises');
+  const avance = await readFile(path.join(PLUGIN_ROOT, 'skills', 'task-workflow', 'avance.md'), 'utf8');
+  assert.match(avance, /deniega el lanzamiento de un subagente[\s\S]{0,200}`taskctl doctor`/);
+  assert.match(avance, /No rodear la\s+denegacion/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
index dbfd89d..1e281c0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
@@ -26,6 +26,8 @@ import { conDoblePlataforma, sinPlataformasEnElPath } from '../helpers/plataform
 
 const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
 const CARPETAS = Object.values(STATE_FOLDER);
+/** Config de Claude Code que no existe: los hooks de la maquina no cambian los avisos que cuentan estos tests (TASK-076). */
+const SIN_CONFIG_CLAUDE = path.join(tmpdir(), 'taskctl-doctor-sin-config-claude-no-existe');
 
 /** Proyecto completo: main + develop, las cinco carpetas commiteadas, sin remotos, workspace limpio. */
 const conRepo = plantillaRepo('taskctl-doctor-', async (repoRoot) => {
@@ -43,7 +45,7 @@ const conRepo = plantillaRepo('taskctl-doctor-', async (repoRoot) => {
 });
 
 function doctor(repoRoot: string, opts: { timeoutPlataformaMs?: number; scriptsDir?: string } = {}) {
-  return runDoctorCommand([], { repoCwd: repoRoot, ...opts });
+  return runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE, ...opts });
 }
 
 function por(cs: readonly Comprobacion[], id: string): Comprobacion {
@@ -75,7 +77,11 @@ async function config(repoRoot: string, texto: string): Promise<void> {
 }
 
 function cli(cwd: string, args: string[]) {
-  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
+  const r = spawnSync(process.execPath, [TASKCTL, ...args], {
+    cwd,
+    encoding: 'utf8',
+    env: { ...process.env, CLAUDE_CONFIG_DIR: SIN_CONFIG_CLAUDE },
+  });
   return { status: r.status, stdout: r.stdout, stderr: r.stderr };
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/hooks-subagente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/hooks-subagente.test.ts
new file mode 100644
index 0000000..c1446e8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/hooks-subagente.test.ts
@@ -0,0 +1,62 @@
+/**
+ * Nucleo puro de `hooks-subagente` (TASK-076): semantica del matcher, forma
+ * del JSON y enabledPlugins.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { hooksQueAlcanzanSubagente, matcherAlcanzaSubagente, pluginHabilitado } from '../../src/core/hooks-subagente.js';
+
+test('matcher: nombres exactos y listas con |', () => {
+  for (const m of ['Agent', 'Task', 'Bash|Agent', 'Read|Task|Write', ' Agent ']) {
+    assert.equal(matcherAlcanzaSubagente(m), true, m);
+  }
+  for (const m of ['Read', 'Bash', 'mcp__', 'AgentX', 'Agents', 'agent', 'Bash|WebFetch|mcp__']) {
+    assert.equal(matcherAlcanzaSubagente(m), false, m);
+  }
+});
+
+test('matcher: vacio, * o ausente alcanzan a todo; un no-string no', () => {
+  assert.equal(matcherAlcanzaSubagente(''), true);
+  assert.equal(matcherAlcanzaSubagente('*'), true);
+  assert.equal(matcherAlcanzaSubagente(undefined), true);
+  assert.equal(matcherAlcanzaSubagente(null), true);
+  assert.equal(matcherAlcanzaSubagente(42), false);
+});
+
+test('matcher: regex anclada; si no compila, lista literal', () => {
+  assert.equal(matcherAlcanzaSubagente('.*'), true);
+  assert.equal(matcherAlcanzaSubagente('A.*'), true);
+  assert.equal(matcherAlcanzaSubagente('(Agent|Task)'), true);
+  assert.equal(matcherAlcanzaSubagente('Ag.n'), false); // anclada: no casa con "Agent"
+  assert.equal(matcherAlcanzaSubagente('mcp__.*'), false);
+  assert.equal(matcherAlcanzaSubagente('Agent|(roto'), true); // regex invalida -> lista
+  assert.equal(matcherAlcanzaSubagente('Read|(roto'), false);
+});
+
+test('hooksQueAlcanzanSubagente: solo PreToolUse, con origen, ruta y matcher literal', () => {
+  const json = {
+    hooks: {
+      PreToolUse: [{ matcher: 'Bash' }, { matcher: 'Bash|Agent', hooks: [] }, { hooks: [] }],
+      PostToolUse: [{ matcher: 'Agent' }],
+    },
+  };
+  assert.deepEqual(hooksQueAlcanzanSubagente(json, 'plugin x@y', '/r/hooks.json'), [
+    { origen: 'plugin x@y', ruta: '/r/hooks.json', matcher: 'Bash|Agent' },
+    { origen: 'plugin x@y', ruta: '/r/hooks.json', matcher: '(sin matcher)' },
+  ]);
+});
+
+test('hooksQueAlcanzanSubagente: formas inesperadas no lanzan ni dan hallazgos', () => {
+  for (const j of [undefined, null, 3, 'x', [], {}, { hooks: [] }, { hooks: { PreToolUse: {} } }, { hooks: { PreToolUse: [null, 3] } }]) {
+    assert.deepEqual(hooksQueAlcanzanSubagente(j, 'o', 'r'), [], JSON.stringify(j));
+  }
+});
+
+test('pluginHabilitado: manda el settings mas especifico; sin entrada, habilitado', () => {
+  const local = { enabledPlugins: { 'a@m': true } };
+  const usuario = { enabledPlugins: { 'a@m': false, 'b@m': false } };
+  assert.equal(pluginHabilitado('a@m', [local, undefined, usuario]), true);
+  assert.equal(pluginHabilitado('b@m', [local, undefined, usuario]), false);
+  assert.equal(pluginHabilitado('c@m', [local, undefined, usuario]), true);
+  assert.equal(pluginHabilitado('c@m', []), true);
+});
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-076/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-076/planificacion/plan-final.md                 |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-076/tarea.md                                    |   3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                              |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                  |  24 ++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/hooks-subagente.js             |  77 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/config-claude.js                 |  11 +++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-hooks-claude.js           | 100 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/transcripciones.js               |   6 +-----
 taskcode-marketplace/plugins/taskcode-plugin/package-lock.json                            |   4 ++--
 10 files changed, 218 insertions(+), 9 deletions(-)
````
