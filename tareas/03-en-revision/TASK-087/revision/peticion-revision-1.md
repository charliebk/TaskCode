# Peticion de revision — TASK-087 (ronda 1)

- Tarea: TASK-087 — taskctl doctor avisa si el plugin instalado esta desactualizado
- Rama revisada: feature/task-087-taskctl-doctor-avisa-si-el-plugin-instal
- Rama base: develop
- Commit revisado (HEAD): a68f7812ac2e3d0bfbda69eeb38dcb26c7b7f708
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-087 (criterios de aceptacion y plan)

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
a68f781 build(TASK-087): dist de la ayuda de doctor
e082a52 build(TASK-087): dist compilado
6aa5c53 feat(TASK-087): doctor avisa si el plugin instalado esta desactualizado
b8cb7e4 chore(TASK-087): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index aa4470b..d878e01 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -662,6 +662,17 @@ algún error (los avisos no cuentan). Comprueba:
   como máximo 10 s). CLI no instalado o sesión rechazada es error; no poder
   verificarlo (timeout, sin red) es aviso; si no aplica, `omitida`. Nunca imprime
   la URL de `origin` con credenciales.
+- **Hooks** (`hooks-subagente`): los hooks `PreToolUse` que alcanzan a los
+  subagentes (ver «Problemas conocidos»). Como mucho, aviso.
+- **Versión del plugin** (`version-plugin`): compara la versión del plugin que
+  tiene instalada Claude Code (`installed_plugins.json`) con la de la copia local
+  de su marketplace. Si la del marketplace es mayor, aviso con las dos versiones,
+  la fecha de esa copia y los comandos para actualizar (`claude plugin marketplace
+  update <marketplace>`, `claude plugin update taskcode-plugin@<marketplace>` y
+  reiniciar Claude Code). No sale a la red: si la copia local no se ha refrescado,
+  no ve versiones más nuevas. Si no puede comprobarlo (plugin no instalado por
+  Claude Code, sin copia del marketplace, un JSON roto), `omitida` con el motivo.
+  Nunca es error: no cambia el código de salida.
 
 `--json` escribe en stdout **solo** una línea de JSON
 (`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 6c70156..6068d7b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -135,7 +135,9 @@ taskctl finish TASK-NNN [--tag <nombre>] la cierra (el estado lo da la plataform
 tag que ya ponia el script.
 doctor comprueba que el proyecto esta listo (Node, git, bash para los scripts de Git-Flow, tareas/,
 ramas develop y main/master, origin, workspace, .taskcode/config.yml, coherencia de las tareas y, si la
-config pide merge request o declara plataforma, gh/glab y su sesion). Una linea por comprobacion
+config pide merge request o declara plataforma, gh/glab y su sesion), hooks que alcanzan a los
+subagentes y si el plugin instalado esta por detras de la copia local de su marketplace (aviso, sin
+red). Una linea por comprobacion
 (ok, aviso, error u omitida) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
 algun error. Solo lee. --json da lo mismo en una linea de JSON.
 doctor-deploy comprueba, antes de publicar, que la aplicacion no deja agujeros conocidos: detecta el tipo (Node,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 0cf87d7..aa9e808 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -53,6 +53,8 @@ import { sondearCli } from '../fs/merge-request.js';
 import { resolverRemotoDeOrigin } from './finish-opciones.js';
 import { directorioConfigClaude } from '../fs/config-claude.js';
 import { sondearHooksClaude } from '../fs/sondas-hooks-claude.js';
+import { sondearVersionPlugin } from '../fs/sonda-version-plugin.js';
+import { compararVersiones, NOMBRE_PLUGIN } from '../core/version.js';
 
 export class DoctorCommandError extends Error {}
 
@@ -579,6 +581,44 @@ export function comprobarHooksSubagente(deps: DoctorCommandDeps): Comprobacion[]
   return cs;
 }
 
+// ---------------------------------------------------------------------
+// Version del plugin instalado (TASK-087)
+// ---------------------------------------------------------------------
+
+/**
+ * Aviso como maximo, nunca error: no cambia el codigo de salida. Lo que no se
+ * puede comprobar (plugin no instalado por Claude Code, sin copia local del
+ * marketplace, JSON roto, version no semver) es `omitida`. Sin red: compara
+ * con la copia local del marketplace, y el mensaje dice de cuando es.
+ */
+export function comprobarVersionPlugin(deps: DoctorCommandDeps): Comprobacion {
+  const id = 'version-plugin';
+  try {
+    const s = sondearVersionPlugin(deps.configClaudeDir ?? directorioConfigClaude(), deps.repoCwd);
+    if (s.estado === 'no-comprobable') return omitida(id, una(`no se pudo comprobar: ${s.motivo}`));
+    const copia = `la copia local del marketplace ${s.marketplace}` +
+      (s.marketplaceActualizadoEn === null ? '' : ` (actualizada el ${s.marketplaceActualizadoEn})`);
+    const d = compararVersiones(s.disponible, s.instalada);
+    if (d > 0) {
+      const clave = `${NOMBRE_PLUGIN}@${s.marketplace}`;
+      return aviso(
+        id,
+        una(`plugin instalado ${s.instalada}, disponible ${s.disponible} en ${copia}`),
+        `claude plugin marketplace update ${s.marketplace}\n` +
+          `claude plugin update ${clave}\n` +
+          'y reinicia Claude Code (dentro de una sesion: /plugin marketplace update y /plugin update).'
+      );
+    }
+    if (d < 0) {
+      return ok(id, una(`plugin instalado ${s.instalada}, mas nuevo que ${s.disponible} de ${copia}: esa copia esta desfasada`));
+    }
+    return ok(id, una(`plugin instalado ${s.instalada}, al dia con ${copia}`));
+  } catch (e: unknown) {
+    // Una excepcion en `envolver` seria `error` y cambiaria el codigo de salida.
+    return omitida(id, una(`no se pudo comprobar: ${e instanceof Error ? e.message : String(e)}`));
+  }
+}
+
 // ---------------------------------------------------------------------
 // Orquestacion
 // ---------------------------------------------------------------------
@@ -639,6 +679,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
     )
   );
   cs.push(...envolver('hooks-subagente', () => comprobarHooksSubagente(deps)));
+  cs.push(...envolver('version-plugin', () => comprobarVersionPlugin(deps)));
 
   return {
     comprobaciones: cs,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
index 93d54a2..c28266e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
@@ -13,3 +13,47 @@
  * no las mezcla con la anterior.
  */
 export const VERSION_TASKCTL = '0.12.0';
+
+/** Nombre del plugin en los marketplaces de Claude Code (`<nombre>@<marketplace>`). */
+export const NOMBRE_PLUGIN = 'taskcode-plugin';
+
+const VERSION_PARTES_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
+
+/** true si `v` es una version semver (`0.10.0`, `0.12.0-dev`); un SHA o un texto libre no lo son. */
+export function esVersionSemver(v: string): boolean {
+  return VERSION_PARTES_RE.test(v);
+}
+
+function compararIdentificador(a: string, b: string): number {
+  const na = /^\d+$/.test(a);
+  const nb = /^\d+$/.test(b);
+  if (na && nb) return Number(a) - Number(b);
+  if (na !== nb) return na ? -1 : 1; // numerico antes que alfanumerico (semver)
+  return a < b ? -1 : a > b ? 1 : 0;
+}
+
+/**
+ * Orden semver: mayor, menor y parche como numeros; sin pre-release va
+ * despues de con ella; dos pre-releases por identificadores. Lo que no es
+ * una version va al final: quien compare versiones ajenas debe filtrar antes
+ * con `esVersionSemver` (TASK-087).
+ */
+export function compararVersiones(a: string, b: string): number {
+  const ma = VERSION_PARTES_RE.exec(a);
+  const mb = VERSION_PARTES_RE.exec(b);
+  if (ma === null || mb === null) return ma === null ? (mb === null ? (a < b ? -1 : a > b ? 1 : 0) : 1) : -1;
+  for (let i = 1; i <= 3; i++) {
+    const d = Number(ma[i]) - Number(mb[i]);
+    if (d !== 0) return d;
+  }
+  const pa = ma[4];
+  const pb = mb[4];
+  if (pa === undefined || pb === undefined) return pa === pb ? 0 : pa === undefined ? 1 : -1;
+  const ia = pa.split('.');
+  const ib = pb.split('.');
+  for (let i = 0; i < Math.min(ia.length, ib.length); i++) {
+    const d = compararIdentificador(ia[i] as string, ib[i] as string);
+    if (d !== 0) return d;
+  }
+  return ia.length - ib.length;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
index 5592d3b..b2912a3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
@@ -25,6 +25,7 @@
 import { media, tablaDeTexto, type FilaMetricas } from './metricas.js';
 import { resumirGrupo } from './grupos-metricas.js';
 import type { ConteoOrigen, ConteoSeveridad } from './informe-revision.js';
+import { compararVersiones } from './version.js';
 
 /** Tokens de una fase en un grupo; `media` null si ninguna tarea tiene dato. */
 export interface CifraTokens {
@@ -62,40 +63,9 @@ export interface PorVersion {
   sinVersion: GrupoVersion;
 }
 
-const VERSION_PARTES_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
-
-function compararIdentificador(a: string, b: string): number {
-  const na = /^\d+$/.test(a);
-  const nb = /^\d+$/.test(b);
-  if (na && nb) return Number(a) - Number(b);
-  if (na !== nb) return na ? -1 : 1; // numerico antes que alfanumerico (semver)
-  return a < b ? -1 : a > b ? 1 : 0;
-}
-
-/**
- * Orden semver: mayor, menor y parche como numeros; sin pre-release va
- * despues de con ella; dos pre-releases por identificadores. Lo que no es
- * una version (no deberia llegar: el registro ya la valida) va al final.
- */
-export function compararVersiones(a: string, b: string): number {
-  const ma = VERSION_PARTES_RE.exec(a);
-  const mb = VERSION_PARTES_RE.exec(b);
-  if (ma === null || mb === null) return ma === null ? (mb === null ? (a < b ? -1 : a > b ? 1 : 0) : 1) : -1;
-  for (let i = 1; i <= 3; i++) {
-    const d = Number(ma[i]) - Number(mb[i]);
-    if (d !== 0) return d;
-  }
-  const pa = ma[4];
-  const pb = mb[4];
-  if (pa === undefined || pb === undefined) return pa === pb ? 0 : pa === undefined ? 1 : -1;
-  const ia = pa.split('.');
-  const ib = pb.split('.');
-  for (let i = 0; i < Math.min(ia.length, ib.length); i++) {
-    const d = compararIdentificador(ia[i] as string, ib[i] as string);
-    if (d !== 0) return d;
-  }
-  return ia.length - ib.length;
-}
+// El orden semver vive en `version.ts` desde TASK-087 (doctor lo usa tambien);
+// se reexporta para no cambiar los imports existentes.
+export { compararVersiones };
 
 function cifraTokens(valores: readonly (number | null)[]): CifraTokens {
   const con = valores.filter((v): v is number => v !== null);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
new file mode 100644
index 0000000..102db72
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
@@ -0,0 +1,44 @@
+/**
+ * Lectura de los ficheros JSON de Claude Code que miran las sondas de doctor
+ * (hooks, TASK-076; version del plugin, TASK-087). Nada de aqui lanza: son
+ * ficheros de terceros y un fichero roto nunca debe volverse un `error`.
+ */
+import { existsSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+
+export type Lectura = { estado: 'ausente' } | { estado: 'ok'; json: unknown } | { estado: 'ilegible'; motivo: string };
+
+export function leerJson(ruta: string): Lectura {
+  if (!existsSync(ruta)) return { estado: 'ausente' };
+  try {
+    return { estado: 'ok', json: JSON.parse(readFileSync(ruta, 'utf8').replace(/^﻿/, '')) as unknown };
+  } catch (e: unknown) {
+    return { estado: 'ilegible', motivo: (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim() };
+  }
+}
+
+export const esObjeto = (x: unknown): x is Record<string, unknown> =>
+  typeof x === 'object' && x !== null && !Array.isArray(x);
+
+/** Misma ruta tras resolverla, sin barra final; en Windows sin distinguir mayusculas. */
+export function mismaRuta(a: string, b: string): boolean {
+  const n = (p: string): string => {
+    const r = path.resolve(p).replace(/[\\/]+$/, '');
+    return process.platform === 'win32' ? r.toLowerCase() : r;
+  };
+  return n(a) === n(b);
+}
+
+/**
+ * La instalacion de un plugin que aplica en `repoCwd`, de las entradas de
+ * `installed_plugins.json`: la de usuario o la de este proyecto.
+ */
+export function entradaQueAplica(entradas: unknown, repoCwd: string): Record<string, unknown> | undefined {
+  if (!Array.isArray(entradas)) return undefined;
+  return entradas.find(
+    (e): e is Record<string, unknown> =>
+      esObjeto(e) &&
+      typeof e['installPath'] === 'string' &&
+      (typeof e['projectPath'] !== 'string' || mismaRuta(e['projectPath'], repoCwd))
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts
new file mode 100644
index 0000000..8189a89
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts
@@ -0,0 +1,117 @@
+/**
+ * Sonda de disco de la comprobacion `version-plugin` de doctor (TASK-087).
+ * Compara la version del plugin que Claude Code tiene instalada con la que
+ * trae la copia local de su marketplace. Lee, sin escribir nada:
+ *
+ * - `<config>/plugins/installed_plugins.json`: la entrada
+ *   `<plugin>@<marketplace>` que aplica (la de usuario o la de este proyecto);
+ * - `<config>/plugins/known_marketplaces.json`: donde esta la copia local del
+ *   marketplace (`installLocation`) y cuando se actualizo (`lastUpdated`). Sin
+ *   el, `<config>/plugins/marketplaces/<marketplace>`;
+ * - el `.claude-plugin/marketplace.json` de esa copia y, si la fuente del
+ *   plugin es una ruta relativa, su `.claude-plugin/plugin.json`, que manda.
+ *
+ * Sin red, a proposito (decision de la persona): «disponible» es lo ultimo que
+ * Claude Code descargo a la copia local. Nada de aqui lanza: lo que no se
+ * puede leer o no se reconoce es `no-comprobable` con su motivo.
+ */
+import path from 'node:path';
+import { esVersionSemver, NOMBRE_PLUGIN } from '../core/version.js';
+import { entradaQueAplica, esObjeto, leerJson } from './json-claude.js';
+
+export type SondeoVersionPlugin =
+  | {
+      estado: 'comparable';
+      instalada: string;
+      disponible: string;
+      marketplace: string;
+      /** Fichero del que sale `disponible`. */
+      rutaDisponible: string;
+      /** `lastUpdated` de la copia local del marketplace; null si no consta. */
+      marketplaceActualizadoEn: string | null;
+    }
+  | { estado: 'no-comprobable'; motivo: string };
+
+const noComprobable = (motivo: string): SondeoVersionPlugin => ({ estado: 'no-comprobable', motivo });
+
+/** El JSON de `ruta`, o el motivo por el que no se puede usar. */
+function leerObjeto(ruta: string, que: string): Record<string, unknown> | string {
+  const l = leerJson(ruta);
+  if (l.estado === 'ausente') return `no existe ${que} (${ruta})`;
+  if (l.estado === 'ilegible') return `${que} ilegible (${ruta}: ${l.motivo})`;
+  return esObjeto(l.json) ? l.json : `${que} con formato no reconocido (${ruta})`;
+}
+
+export function sondearVersionPlugin(
+  configDir: string,
+  repoCwd: string,
+  nombrePlugin: string = NOMBRE_PLUGIN
+): SondeoVersionPlugin {
+  try {
+    return sondear(configDir, repoCwd, nombrePlugin);
+  } catch (e: unknown) {
+    // No deberia llegar aqui; si llega, no puede acabar en el `error` de `envolver`.
+    return noComprobable(`fallo inesperado: ${(e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim()}`);
+  }
+}
+
+function sondear(configDir: string, repoCwd: string, nombrePlugin: string): SondeoVersionPlugin {
+  const dirPlugins = path.join(configDir, 'plugins');
+
+  // 1. La version instalada.
+  const rutaInstalados = path.join(dirPlugins, 'installed_plugins.json');
+  const instalados = leerObjeto(rutaInstalados, 'la lista de plugins instalados');
+  if (typeof instalados === 'string') return noComprobable(instalados);
+  const plugins = instalados['plugins'];
+  if (!esObjeto(plugins)) return noComprobable(`la lista de plugins instalados no tiene "plugins" (${rutaInstalados})`);
+  const prefijo = `${nombrePlugin}@`;
+  let marketplace: string | null = null;
+  let instalada: unknown;
+  for (const [clave, entradas] of Object.entries(plugins)) {
+    if (!clave.startsWith(prefijo)) continue;
+    const e = entradaQueAplica(entradas, repoCwd);
+    if (e === undefined) continue;
+    marketplace = clave.slice(prefijo.length);
+    instalada = e['version'];
+    break;
+  }
+  if (marketplace === null) return noComprobable(`${nombrePlugin} no esta instalado como plugin de Claude Code para este proyecto`);
+  if (typeof instalada !== 'string' || !esVersionSemver(instalada)) {
+    return noComprobable(`la version instalada no es semver (${String(instalada)})`);
+  }
+
+  // 2. La copia local del marketplace.
+  let dirMarketplace = path.join(dirPlugins, 'marketplaces', marketplace);
+  let actualizadoEn: string | null = null;
+  const conocidos = leerJson(path.join(dirPlugins, 'known_marketplaces.json'));
+  if (conocidos.estado === 'ok' && esObjeto(conocidos.json)) {
+    const m = conocidos.json[marketplace];
+    if (esObjeto(m)) {
+      if (typeof m['installLocation'] === 'string' && m['installLocation'] !== '') dirMarketplace = m['installLocation'];
+      if (typeof m['lastUpdated'] === 'string') actualizadoEn = m['lastUpdated'];
+    }
+  }
+  const rutaMarketplace = path.join(dirMarketplace, '.claude-plugin', 'marketplace.json');
+  const catalogo = leerObjeto(rutaMarketplace, `la copia local del marketplace ${marketplace}`);
+  if (typeof catalogo === 'string') return noComprobable(catalogo);
+  const lista = catalogo['plugins'];
+  const entrada = Array.isArray(lista) ? lista.find((p) => esObjeto(p) && p['name'] === nombrePlugin) : undefined;
+  if (!esObjeto(entrada)) return noComprobable(`${nombrePlugin} no figura en ${rutaMarketplace}`);
+
+  // 3. La version disponible: la del plugin.json si la fuente es local, si no la del catalogo.
+  let disponible: unknown = entrada['version'];
+  let rutaDisponible = rutaMarketplace;
+  const fuente = entrada['source'];
+  if (typeof fuente === 'string' && fuente.startsWith('.')) {
+    const rutaManifiesto = path.join(dirMarketplace, fuente, '.claude-plugin', 'plugin.json');
+    const l = leerJson(rutaManifiesto);
+    if (l.estado === 'ok' && esObjeto(l.json) && typeof l.json['version'] === 'string') {
+      disponible = l.json['version'];
+      rutaDisponible = rutaManifiesto;
+    }
+  }
+  if (typeof disponible !== 'string') return noComprobable(`la copia local del marketplace no declara version (${rutaDisponible})`);
+  if (!esVersionSemver(disponible)) return noComprobable(`la version disponible no es semver (${disponible})`);
+
+  return { estado: 'comparable', instalada, disponible, marketplace, rutaDisponible, marketplaceActualizadoEn: actualizadoEn };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts
index 3552894..b8406ea 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-hooks-claude.ts
@@ -13,9 +13,9 @@
  * roto se anota en `ilegibles`. Son ficheros de terceros; doctor no los
  * convierte en un error.
  */
-import { existsSync, readFileSync } from 'node:fs';
 import path from 'node:path';
 import { hooksQueAlcanzanSubagente, pluginHabilitado, type HallazgoHook } from '../core/hooks-subagente.js';
+import { entradaQueAplica, esObjeto, leerJson, mismaRuta } from './json-claude.js';
 
 export interface SondeoHooks {
   hallazgos: HallazgoHook[];
@@ -27,27 +27,6 @@ export interface SondeoHooks {
   hooksDesactivadosEn: string | null;
 }
 
-type Lectura = { estado: 'ausente' } | { estado: 'ok'; json: unknown } | { estado: 'ilegible'; motivo: string };
-
-function leerJson(ruta: string): Lectura {
-  if (!existsSync(ruta)) return { estado: 'ausente' };
-  try {
-    return { estado: 'ok', json: JSON.parse(readFileSync(ruta, 'utf8').replace(/^﻿/, '')) as unknown };
-  } catch (e: unknown) {
-    return { estado: 'ilegible', motivo: (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim() };
-  }
-}
-
-const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
-
-function mismaRuta(a: string, b: string): boolean {
-  const n = (p: string): string => {
-    const r = path.resolve(p).replace(/[\\/]+$/, '');
-    return process.platform === 'win32' ? r.toLowerCase() : r;
-  };
-  return n(a) === n(b);
-}
-
 export function sondearHooksClaude(configDir: string, repoCwd: string): SondeoHooks {
   const r: SondeoHooks = { hallazgos: [], leidos: 0, ilegibles: [], hooksDesactivadosEn: null };
 
@@ -95,12 +74,7 @@ export function sondearHooksClaude(configDir: string, repoCwd: string): SondeoHo
   for (const [clave, entradas] of Object.entries(instalados['plugins'])) {
     if (!Array.isArray(entradas) || !pluginHabilitado(clave, settings)) continue;
     // La instalacion que aplica aqui: la de usuario o la de este proyecto.
-    const entrada = entradas.find(
-      (e): e is Record<string, unknown> =>
-        esObjeto(e) &&
-        typeof e['installPath'] === 'string' &&
-        (typeof e['projectPath'] !== 'string' || mismaRuta(e['projectPath'], repoCwd))
-    );
+    const entrada = entradaQueAplica(entradas, repoCwd);
     if (entrada === undefined) continue;
     const dir = entrada['installPath'] as string;
     const origen = `plugin ${clave}`;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-version-plugin.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-version-plugin.test.ts
new file mode 100644
index 0000000..5c7c59e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-version-plugin.test.ts
@@ -0,0 +1,147 @@
+/**
+ * `taskctl doctor`, comprobacion `version-plugin` (TASK-087). Repo Git
+ * temporal de verdad y un directorio de configuracion de Claude Code temporal
+ * con los ficheros de plugins reales; el CLI por spawn con CLAUDE_CONFIG_DIR
+ * para el JSON y el codigo de salida.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { comprobarVersionPlugin, runDoctorCommand } from '../../src/commands/doctor.js';
+import type { Comprobacion } from '../../src/core/doctor.js';
+import { STATE_FOLDER } from '../../src/core/task.js';
+import { git } from '../helpers/finish-fixtures.js';
+import { plantillaRepo } from '../helpers/repo-plantilla.js';
+
+const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
+const SIN_REPO = path.join(tmpdir(), 'repo-cualquiera');
+
+const conRepo = plantillaRepo('taskctl-doctor-version-', async (repoRoot) => {
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
+/** Plugin instalado en `instalada` y copia local del marketplace `mkt` en `disponible`. */
+async function montar(config: string, instalada: string, disponible: string): Promise<void> {
+  const plugins = path.join(config, 'plugins');
+  await escribirJson(path.join(plugins, 'installed_plugins.json'), {
+    version: 2,
+    plugins: { 'taskcode-plugin@mkt': [{ scope: 'user', installPath: path.join(plugins, 'cache', 'x'), version: instalada }] },
+  });
+  const copia = path.join(plugins, 'marketplaces', 'mkt');
+  await escribirJson(path.join(plugins, 'known_marketplaces.json'), {
+    mkt: { installLocation: copia, lastUpdated: '2026-11-01T10:00:00.000Z' },
+  });
+  await escribirJson(path.join(copia, '.claude-plugin', 'marketplace.json'), {
+    plugins: [{ name: 'taskcode-plugin', version: disponible, source: { source: 'github', repo: 'x/y' } }],
+  });
+}
+
+test('disponible mayor (0.8.0 -> 0.10.0): aviso con las dos versiones, la fecha de la copia y los comandos', async () => {
+  await conConfig(async (config) => {
+    await montar(config, '0.8.0', '0.10.0');
+    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
+    assert.equal(c.nivel, 'aviso');
+    assert.equal(c.id, 'version-plugin');
+    assert.match(c.mensaje, /plugin instalado 0\.8\.0, disponible 0\.10\.0 en la copia local del marketplace mkt/);
+    assert.match(c.mensaje, /2026-11-01T10:00:00\.000Z/);
+    assert.match(c.arreglo ?? '', /^claude plugin marketplace update mkt\nclaude plugin update taskcode-plugin@mkt\n.*reinicia Claude Code/);
+  });
+});
+
+test('iguales: ok; instalada mas nueva que la copia local: ok con nota de copia desfasada', async () => {
+  await conConfig(async (config) => {
+    await montar(config, '0.10.0', '0.10.0');
+    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
+    assert.equal(c.nivel, 'ok');
+    assert.match(c.mensaje, /al dia/);
+  });
+  await conConfig(async (config) => {
+    await montar(config, '0.11.0', '0.10.0');
+    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
+    assert.equal(c.nivel, 'ok');
+    assert.match(c.mensaje, /mas nuevo que 0\.10\.0.*desfasada/);
+  });
+});
+
+test('sin el plugin instalado o sin copia del marketplace: omitida, "no se pudo comprobar"', async () => {
+  await conConfig(async (config) => {
+    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
+    assert.equal(c.nivel, 'omitida');
+    assert.match(c.mensaje, /^no se pudo comprobar: no existe la lista de plugins instalados/);
+    assert.equal(c.arreglo, null);
+  });
+  await conConfig(async (config) => {
+    await montar(config, '0.8.0', '0.10.0');
+    await rm(path.join(config, 'plugins', 'marketplaces'), { recursive: true, force: true });
+    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
+    assert.equal(c.nivel, 'omitida');
+    assert.match(c.mensaje, /^no se pudo comprobar: no existe la copia local del marketplace mkt/);
+  });
+});
+
+test('el codigo de salida de doctor no cambia: 0 con el aviso, con JSON roto y sin config', async () => {
+  await conRepo(async (repoRoot) => {
+    const codigo = (config: string): { codigo: number; c: Comprobacion | undefined } => {
+      const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config });
+      return { codigo: r.codigo, c: r.comprobaciones.find((x) => x.id === 'version-plugin') };
+    };
+    await conConfig(async (config) => {
+      const sin = codigo(config);
+      assert.equal(sin.codigo, 0);
+      assert.equal(sin.c?.nivel, 'omitida');
+      await montar(config, '0.8.0', '0.10.0');
+      const conAviso = codigo(config);
+      assert.equal(conAviso.c?.nivel, 'aviso');
+      assert.equal(conAviso.codigo, 0);
+      await writeFile(path.join(config, 'plugins', 'installed_plugins.json'), '{ roto', 'utf8');
+      const roto = codigo(config);
+      assert.equal(roto.c?.nivel, 'omitida');
+      assert.equal(roto.codigo, 0);
+    });
+  });
+});
+
+test('CLI --json: version-plugin en aviso con arreglo, y el proceso sale con 0', async () => {
+  await conRepo(async (repoRoot) => {
+    await conConfig(async (config) => {
+      await montar(config, '0.8.0', '0.10.0');
+      const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--json'], {
+        cwd: repoRoot,
+        encoding: 'utf8',
+        env: { ...process.env, CLAUDE_CONFIG_DIR: config },
+      });
+      assert.equal(r.status, 0, r.stdout + r.stderr);
+      const j = JSON.parse(r.stdout) as { comprobaciones: Comprobacion[] };
+      const c = j.comprobaciones.find((x) => x.id === 'version-plugin');
+      assert.ok(c, r.stdout);
+      assert.equal(c.nivel, 'aviso');
+      assert.match(c.arreglo ?? '', /claude plugin update taskcode-plugin@mkt/);
+    });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-version-plugin.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-version-plugin.test.ts
new file mode 100644
index 0000000..e92c88f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-version-plugin.test.ts
@@ -0,0 +1,169 @@
+/**
+ * Sonda `sondearVersionPlugin` (TASK-087). Directorio de configuracion de
+ * Claude Code temporal con installed_plugins.json, known_marketplaces.json y
+ * una copia de marketplace con marketplace.json y plugin.json reales.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { sondearVersionPlugin } from '../../src/fs/sonda-version-plugin.js';
+import { compararVersiones, esVersionSemver } from '../../src/core/version.js';
+
+const REPO = path.join(tmpdir(), 'repo-cualquiera');
+
+async function conConfig(fn: (config: string) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-version-plugin-'));
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
+interface Montaje {
+  instalada?: unknown;
+  /** version en la entrada de marketplace.json */
+  catalogo?: unknown;
+  /** version del plugin.json de la fuente relativa; undefined = sin plugin.json */
+  manifiesto?: string;
+  source?: unknown;
+  /** false = sin known_marketplaces.json (se usa plugins/marketplaces/<m>) */
+  conocidos?: boolean;
+  entradas?: unknown[];
+  marketplace?: string;
+}
+
+/** Monta la instalacion; devuelve el directorio de la copia del marketplace. */
+async function montar(config: string, m: Montaje = {}): Promise<string> {
+  const mkt = m.marketplace ?? 'mkt';
+  const plugins = path.join(config, 'plugins');
+  const entradas = m.entradas ?? [
+    { scope: 'user', installPath: path.join(plugins, 'cache', mkt, 'taskcode-plugin', '0.8.0'), version: m.instalada ?? '0.8.0' },
+  ];
+  await escribirJson(path.join(plugins, 'installed_plugins.json'), { version: 2, plugins: { [`taskcode-plugin@${mkt}`]: entradas } });
+  const copia = m.conocidos === false ? path.join(plugins, 'marketplaces', mkt) : path.join(config, 'clon-en-otro-sitio');
+  if (m.conocidos !== false) {
+    await escribirJson(path.join(plugins, 'known_marketplaces.json'), {
+      [mkt]: { source: { source: 'github', repo: 'x/y' }, installLocation: copia, lastUpdated: '2026-11-01T10:00:00.000Z' },
+    });
+  }
+  const source = m.source ?? './plugins/taskcode-plugin';
+  await escribirJson(path.join(copia, '.claude-plugin', 'marketplace.json'), {
+    name: mkt,
+    plugins: [{ name: 'otro', version: '9.9.9', source: './x' }, { name: 'taskcode-plugin', version: m.catalogo ?? '0.10.0', source }],
+  });
+  if (m.manifiesto !== undefined && typeof source === 'string') {
+    await escribirJson(path.join(copia, source, '.claude-plugin', 'plugin.json'), { name: 'taskcode-plugin', version: m.manifiesto });
+  }
+  return copia;
+}
+
+test('esVersionSemver y el orden semver: 0.10.0 > 0.8.0 (no por texto); un SHA no es version', () => {
+  assert.ok(esVersionSemver('0.10.0') && esVersionSemver('0.12.0-dev'));
+  assert.ok(!esVersionSemver('0412be76f50a') && !esVersionSemver('v1.0.0') && !esVersionSemver(''));
+  assert.ok(compararVersiones('0.10.0', '0.8.0') > 0);
+});
+
+test('comparable: instalada del installed_plugins.json, disponible y fecha de la copia local', async () => {
+  await conConfig(async (config) => {
+    const copia = await montar(config);
+    const s = sondearVersionPlugin(config, REPO);
+    assert.deepEqual(s, {
+      estado: 'comparable',
+      instalada: '0.8.0',
+      disponible: '0.10.0',
+      marketplace: 'mkt',
+      rutaDisponible: path.join(copia, '.claude-plugin', 'marketplace.json'),
+      marketplaceActualizadoEn: '2026-11-01T10:00:00.000Z',
+    });
+  });
+});
+
+test('fuente relativa con plugin.json: manda su version sobre la del catalogo', async () => {
+  await conConfig(async (config) => {
+    const copia = await montar(config, { catalogo: '0.9.0', manifiesto: '0.11.0' });
+    const s = sondearVersionPlugin(config, REPO);
+    assert.equal(s.estado, 'comparable');
+    if (s.estado !== 'comparable') return;
+    assert.equal(s.disponible, '0.11.0');
+    assert.equal(s.rutaDisponible, path.join(copia, 'plugins', 'taskcode-plugin', '.claude-plugin', 'plugin.json'));
+  });
+});
+
+test('fuente remota (objeto): vale la version del catalogo', async () => {
+  await conConfig(async (config) => {
+    await montar(config, { source: { source: 'github', repo: 'x/y' }, catalogo: '1.2.3' });
+    const s = sondearVersionPlugin(config, REPO);
+    assert.equal(s.estado === 'comparable' && s.disponible, '1.2.3');
+  });
+});
+
+test('sin known_marketplaces.json: usa plugins/marketplaces/<m> y la fecha queda null', async () => {
+  await conConfig(async (config) => {
+    await montar(config, { conocidos: false });
+    const s = sondearVersionPlugin(config, REPO);
+    assert.equal(s.estado, 'comparable');
+    assert.equal(s.estado === 'comparable' && s.marketplaceActualizadoEn, null);
+  });
+});
+
+test('entrada de proyecto: solo cuenta si su projectPath es este repo', async () => {
+  await conConfig(async (config) => {
+    const entrada = (projectPath: string) => ({ scope: 'project', projectPath, installPath: path.join(config, 'x'), version: '0.8.0' });
+    await montar(config, { entradas: [entrada(path.join(tmpdir(), 'otro-repo'))] });
+    const ajena = sondearVersionPlugin(config, REPO);
+    assert.equal(ajena.estado, 'no-comprobable');
+    assert.match(ajena.estado === 'no-comprobable' ? ajena.motivo : '', /no esta instalado/);
+    await montar(config, { entradas: [entrada(REPO)] });
+    assert.equal(sondearVersionPlugin(config, REPO).estado, 'comparable');
+  });
+});
+
+test('no-comprobable con su motivo: sin config, sin el plugin, sin copia, JSON roto, version no semver', async () => {
+  const motivo = (config: string): string => {
+    const s = sondearVersionPlugin(config, REPO);
+    assert.equal(s.estado, 'no-comprobable', JSON.stringify(s));
+    return s.estado === 'no-comprobable' ? s.motivo : '';
+  };
+  await conConfig(async (config) => {
+    assert.match(motivo(config), /no existe la lista de plugins instalados/);
+  });
+  await conConfig(async (config) => {
+    await escribirJson(path.join(config, 'plugins', 'installed_plugins.json'), { version: 2, plugins: { 'otro@mkt': [] } });
+    assert.match(motivo(config), /taskcode-plugin no esta instalado/);
+  });
+  await conConfig(async (config) => {
+    const copia = await montar(config);
+    await rm(copia, { recursive: true, force: true });
+    assert.match(motivo(config), /no existe la copia local del marketplace mkt/);
+  });
+  await conConfig(async (config) => {
+    await mkdir(path.join(config, 'plugins'), { recursive: true });
+    await writeFile(path.join(config, 'plugins', 'installed_plugins.json'), '{ roto', 'utf8');
+    assert.match(motivo(config), /ilegible/);
+  });
+  await conConfig(async (config) => {
+    const copia = await montar(config);
+    await writeFile(path.join(copia, '.claude-plugin', 'marketplace.json'), '[1,2', 'utf8');
+    assert.match(motivo(config), /ilegible/);
+  });
+  await conConfig(async (config) => {
+    await montar(config, { instalada: '0412be76f50a' });
+    assert.match(motivo(config), /instalada no es semver/);
+  });
+  await conConfig(async (config) => {
+    await montar(config, { catalogo: 'latest' });
+    assert.match(motivo(config), /disponible no es semver/);
+  });
+  await conConfig(async (config) => {
+    await montar(config, { catalogo: 7 });
+    assert.match(motivo(config), /no declara version/);
+  });
+});
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-087/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-087/planificacion/plan-final.md                 |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-087/tarea.md                                    |   3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                              |   4 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                  |  37 ++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/version.js                     |  45 +++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/versiones-metricas.js          |  42 ++++-------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/json-claude.js                   |  37 ++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sonda-version-plugin.js          | 106 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-hooks-claude.js           |  24 ++---------------------
 10 files changed, 236 insertions(+), 62 deletions(-)
````
