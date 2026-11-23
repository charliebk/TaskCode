# Peticion de revision — TASK-148c (ronda 1)

- Tarea: TASK-148c — utilidades de core (parte c de TASK-148)
- Rama revisada: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
- Rama base: develop
- Commit revisado (HEAD): 58964aa182a2cadbef3b5da5ccbf01d11a2e06a7
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-148c (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
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

- tareas/03-en-revision/TASK-148c/tarea.md
- tareas/03-en-revision/TASK-148c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-auditoria.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/utilidades-core.test.ts

## Commits a revisar (git log develop..HEAD)

````
58964aa chore(TASK-148c): autorrevision
d9fa174 fix(TASK-148c): utilidades de core con una implementacion
876be65 chore(TASK-148c): tarea en curso
b013574 merge(TASK-148c): develop en fix/task-148-regla-4d-catalogos-config-y-utilidades-e para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
index 58efa92..e0afe2d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
@@ -41,6 +41,7 @@ import {
   type ClaveDeBloque,
   type CrearError,
 } from './campos-catalogo.js';
+import { solapeDeEtiquetas } from './complejidad-similar.js';
 
 const MAX_TOTAL_SKILLS = 1000;
 
@@ -410,12 +411,11 @@ export interface SeleccionSkill {
  * candidatosEmpatados: []`, y quien llame decide como avisarlo.
  */
 export function seleccionarSkill(task: Task, catalogo: CatalogoSkills): SeleccionSkill {
-  const etiquetasTarea = new Set(task.etiquetas);
 
   const conSolape = catalogo
     .map((entrada) => ({
       entrada,
-      solape: entrada.etiquetas.filter((e) => etiquetasTarea.has(e)).length,
+      solape: solapeDeEtiquetas(entrada.etiquetas, task.etiquetas),
     }))
     .filter((x) => x.solape > 0);
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index 33cb0cf..86d4f6c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -104,6 +104,25 @@ function programa(token: string): string {
 
 /** Opciones globales de git que llevan su valor en el token siguiente. */
 const GLOBALES_CON_VALOR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix']);
+
+/**
+ * TASK-148c (CORE1-09): `git [opciones globales] <subcomando> <args>` partido.
+ * Salta las opciones globales (las de GLOBALES_CON_VALOR con su valor) y
+ * devuelve el `-C` si lo hay. Antes este bucle estaba copiado en los dos
+ * recorridos (cambio de rama y cierre de merge).
+ */
+function subcomandoGit(seg: readonly string[]): { dir: string | null; sub: string; args: string[] } {
+  let i = 1;
+  let dir: string | null = null;
+  while (i < seg.length && (seg[i] as string).startsWith('-')) {
+    const op = seg[i] as string;
+    if (GLOBALES_CON_VALOR.has(op)) {
+      if (op === '-C') dir = seg[i + 1] ?? null;
+      i += 2;
+    } else i++;
+  }
+  return { dir, sub: (seg[i] ?? '').toLowerCase(), args: seg.slice(i + 1) };
+}
 /** Opciones de `git merge` que llevan su valor en el token siguiente. */
 const MERGE_CON_VALOR = new Set(['-m', '--message', '-F', '-s', '-X', '--file', '--strategy', '--strategy-option', '--into-name']);
 const MERGE_SIN_MERGE = new Set(['--abort', '--continue', '--quit', '--skip']);
@@ -169,17 +188,7 @@ export function analizarComando(texto: string, esRevision: (nombre: string) => b
     const prog = programa(seg[0] as string);
 
     if (prog === 'git') {
-      let i = 1;
-      let dir: string | null = null;
-      while (i < seg.length && (seg[i] as string).startsWith('-')) {
-        const op = seg[i] as string;
-        if (GLOBALES_CON_VALOR.has(op)) {
-          if (op === '-C') dir = seg[i + 1] ?? null;
-          i += 2;
-        } else i++;
-      }
-      const sub = (seg[i] ?? '').toLowerCase();
-      const args = seg.slice(i + 1);
+      const { dir, sub, args } = subcomandoGit(seg);
       if (sub === 'checkout' || sub === 'switch') {
         const nuevo = ramaDeCambio(args, esRevision);
         if (nuevo !== null) destino = nuevo;
@@ -422,17 +431,7 @@ export function cierresDeMerge(texto: string): (string | null)[] {
     if (seg.length === 0) continue;
     const prog = programa(seg[0] as string);
     if (prog === 'git') {
-      let i = 1;
-      let dir: string | null = null;
-      while (i < seg.length && (seg[i] as string).startsWith('-')) {
-        const op = seg[i] as string;
-        if (GLOBALES_CON_VALOR.has(op)) {
-          if (op === '-C') dir = seg[i + 1] ?? null;
-          i += 2;
-        } else i++;
-      }
-      const sub = (seg[i] ?? '').toLowerCase();
-      const args = seg.slice(i + 1);
+      const { dir, sub, args } = subcomandoGit(seg);
       if (sub === 'commit' || (sub === 'merge' && args.includes('--continue'))) dirs.push(dir);
       continue;
     }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts
index d36b843..9e4699a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts
@@ -32,6 +32,16 @@ export interface ComplejidadPropuesta {
  * centrales: la mas barata (la heuristica del plan puede subirla). null sin
  * etiquetas, sin terminadas con complejidad declarada o sin ninguna en comun.
  */
+/**
+ * TASK-148c (CORE1-12): cuantas etiquetas de `a` estan en `b`, sin distinguir
+ * mayusculas (`Rust` y `rust` son la misma). La usan esta propuesta y la
+ * seleccion de skill del catalogo.
+ */
+export function solapeDeEtiquetas(a: readonly string[], b: readonly string[]): number {
+  const enB = new Set(b.map((e) => e.toLowerCase()));
+  return new Set(a.map((e) => e.toLowerCase()).filter((e) => enB.has(e))).size;
+}
+
 export function proponerComplejidad(
   etiquetas: readonly string[],
   terminadas: readonly TareaComparable[]
@@ -42,7 +52,7 @@ export function proponerComplejidad(
   let parecidas: TareaComparable[] = [];
   for (const t of terminadas) {
     if (t.complejidad === null) continue;
-    const comunes = new Set(t.etiquetas.map((e) => e.toLowerCase()).filter((e) => propias.has(e))).size;
+    const comunes = solapeDeEtiquetas(t.etiquetas, [...propias]);
     if (comunes === 0 || comunes < max) continue;
     if (comunes > max) {
       max = comunes;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
index 09a523c..b0821ce 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
@@ -32,6 +32,7 @@
  */
 
 import { PETICION_REVISION_EN_TEXTO_RE } from '../fs/rondas.js';
+import { esObjeto } from './utilidades-texto.js';
 
 /** agentId que devuelve la herramienta Agent: hexadecimal. Se valida antes de componer rutas. */
 const AGENT_ID_RE = /^[0-9a-f]{6,64}$/i;
@@ -116,10 +117,6 @@ function desgloseDeUsage(u: Record<string, unknown>): Desglose {
   };
 }
 
-function esObjeto(v: unknown): v is Record<string, unknown> {
-  return typeof v === 'object' && v !== null && !Array.isArray(v);
-}
-
 /** true si un bloque `tool_use` es una lectura (ver la cabecera). */
 function esLectura(bloque: Record<string, unknown>): boolean {
   const nombre = bloque['name'];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
index d03a155..007216e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
@@ -12,6 +12,7 @@
  */
 import type { LineaPuerta } from './registro-puertas.js';
 import { compararVersiones } from './version.js';
+import { quitarAnsi } from './utilidades-texto.js';
 
 /** TASK-129: la puerta con el tamano de la completa: modo = numero de tests (o `-`). */
 export const PUERTA_SUITE = 'suite';
@@ -42,7 +43,7 @@ function ultimo(texto: string, re: RegExp): number | null {
  * multimodulo se reconoce por su `Reactor Summary`, que va al final.
  */
 export function contarTests(salida: string, opciones: { recortada?: boolean } = {}): number | null {
-  const t = salida.replace(/\x1b\[[0-9;]*m/g, '');
+  const t = quitarAnsi(salida);
   const node = ultimo(t, /^\s*(?:ℹ|#)\s+tests\s+(\d+)\s*$/gm);
   if (node !== null) return node;
   const jest = ultimo(t, /^\s*Tests:\s+.*?(\d+)\s+total\s*$/gm);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-auditoria.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-auditoria.ts
index b5101f6..283ea1d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-auditoria.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-auditoria.ts
@@ -16,6 +16,7 @@
  * herramienta real (que necesita red). Si una version nueva cambia el formato,
  * el resultado es `no-verificado`, no un OK falso.
  */
+import { esObjeto, recortar } from './utilidades-texto.js';
 
 export interface VeredictoAuditoria {
   estado: 'ok' | 'falla' | 'no-verificado';
@@ -29,9 +30,9 @@ export interface VeredictoAuditoria {
 
 const MAX_NOMBRES = 15;
 
-function recortar(t: string, max = 160): string {
-  const u = t.replace(/\s+/g, ' ').trim();
-  return u.length > max ? `${u.slice(0, max)}...` : u;
+/** El resumen de una linea: espacios colapsados y recortado con la utilidad comun. */
+function enUnaLinea(t: string, max = 160): string {
+  return recortar(t.replace(/\s+/g, ' ').trim(), max);
 }
 
 function ilegible(herramienta: string, detalle: string): VeredictoAuditoria {
@@ -52,10 +53,6 @@ function conVulnerabilidades(resumen: string, graves: string[], otras: string[])
   return { estado: graves.length > 0 ? 'falla' : 'ok', resumen, graves: unicos(graves), otras: unicos(otras) };
 }
 
-function esObjeto(x: unknown): x is Record<string, unknown> {
-  return typeof x === 'object' && x !== null && !Array.isArray(x);
-}
-
 function num(x: unknown): number | null {
   return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;
 }
@@ -74,7 +71,7 @@ export function interpretarNpmAudit(herramienta: 'npm' | 'pnpm', stdout: string,
     const detalle = esObjeto(e) ? `${String(e['code'] ?? '')} ${String(e['summary'] ?? e['message'] ?? '')}` : String(e);
     return {
       estado: 'no-verificado',
-      resumen: `${herramienta} audit devolvio un error: ${recortar(detalle)}`,
+      resumen: `${herramienta} audit devolvio un error: ${enUnaLinea(detalle)}`,
       graves: [],
       otras: [],
     };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
index 3973b02..61a6a3b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
@@ -38,6 +38,7 @@ import {
   validarTextoNoVacio,
   type CrearError,
 } from './campos-catalogo.js';
+import { diaDe } from './documento-estado.js';
 
 export class DoctorDeployCatalogoError extends Error {
   constructor(message: string) {
@@ -512,7 +513,6 @@ function parsearAplicaciones(
 // Capa del proyecto
 // ---------------------------------------------------------------------
 
-const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
 
 export function cargarCapaProyecto(repoRoot: string, base: CatalogoBase): CapaProyecto {
   const ruta = path.join(repoRoot, RUTA_CAPA_PROYECTO);
@@ -604,7 +604,8 @@ export function parsearCapaProyecto(contenido: string, ruta: string, base: Catal
     const quien = t('quien');
     const cFecha = exigir(b, 'silenciar', n, 'fecha', ruta, fallar);
     const fecha = texto(cFecha, `silenciar_${n}_fecha`, ruta, fallar);
-    if (!FECHA_RE.test(fecha)) {
+    // TASK-148c (CORE1-11): diaDe, la validacion de fecha comun (rechaza 2026-02-30).
+    if (diaDe(fecha) !== fecha) {
       throw fallar(`[ERROR] ${ruta}:${cFecha.numeroLinea}: "silenciar_${n}_fecha" vale "${fecha}"; usa AAAA-MM-DD.`);
     }
     const cCommit = b.get('commit');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
index 5addf24..9d85606 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/hooks-subagente.ts
@@ -12,6 +12,7 @@
  * - Cualquier otra cosa: regex anclada (`^(?:...)$`); si no compila, se parte
  *   por `|` y se compara literal.
  */
+import { esObjeto } from './utilidades-texto.js';
 
 /** Herramientas con las que Claude Code lanza subagentes. */
 export const HERRAMIENTAS_SUBAGENTE: readonly string[] = ['Agent', 'Task'];
@@ -50,7 +51,6 @@ export function matcherAlcanzaSubagente(matcher: unknown): boolean {
   return HERRAMIENTAS_SUBAGENTE.some((h) => re.test(h));
 }
 
-const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
 
 /**
  * Hallazgos de un JSON con la forma de `hooks.json` o `settings.json`
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
index 28f8589..e25c240 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
@@ -11,6 +11,7 @@
  */
 import { fenceFor } from './markdown.js';
 import { ocultarCredenciales } from './plataforma-remota.js';
+import { quitarAnsi } from './utilidades-texto.js';
 
 export type EstadoVerificacion = 'verde' | 'roja' | 'cortada' | 'no-lanzable';
 
@@ -34,8 +35,6 @@ export interface ResultadoVerificacion {
 export const MAX_BYTES_COLA = 4096;
 export const MAX_LINEAS_COLA = 40;
 
-// Secuencias CSI (colores, cursor) y OSC (titulos, hipervinculos) de terminal.
-const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g;
 
 /**
  * La cola limpia y acotada a `maxLineas` lineas y `maxBytes` bytes (lo que
@@ -47,7 +46,7 @@ export function recortarCola(
   maxBytes: number = MAX_BYTES_COLA,
   maxLineas: number = MAX_LINEAS_COLA
 ): { texto: string; recortada: boolean } {
-  const limpio = ocultarCredenciales(texto.replace(ANSI, '').replace(/\r\n?/g, '\n')).replace(/\s+$/, '');
+  const limpio = ocultarCredenciales(quitarAnsi(texto).replace(/\r\n?/g, '\n')).replace(/\s+$/, '');
   let lineas = limpio.split('\n');
   let recortada = false;
   if (lineas.length > maxLineas) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
index b50fde4..15fed09 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
@@ -73,9 +73,20 @@ export function mismaRuta(rutaDiff: string, citada: string): boolean {
   return rutaDiff === citada || (citada.includes('/') && rutaDiff.endsWith(`/${citada}`));
 }
 
+/**
+ * TASK-148c (CORE2-15): la unica definicion de «fichero de test»: una carpeta de
+ * CARPETAS_TEST a cualquier profundidad o un nombre `*.<marca>.*` de MARCAS_TEST.
+ * De aqui salen esRutaDeTest y los globs de Git de fs/git.ts (PATRONES_TEST).
+ */
+export const CARPETAS_TEST: readonly string[] = ['test', 'tests', '__tests__'];
+export const MARCAS_TEST: readonly string[] = ['test', 'spec'];
+
+const CARPETA_TEST_RE = new RegExp(`(^|/)(${CARPETAS_TEST.join('|')})/`);
+const MARCA_TEST_RE = new RegExp(`\\.(${MARCAS_TEST.join('|')})\\.`);
+
 /** Heuristica de fichero de test por ruta: `test/`, `tests/`, `__tests__/`, `.test.`, `.spec.`. */
 export function esRutaDeTest(ruta: string): boolean {
-  return /(^|\/)(test|tests|__tests__)\//.test(ruta) || /\.(test|spec)\./.test(ruta);
+  return CARPETA_TEST_RE.test(ruta) || MARCA_TEST_RE.test(ruta);
 }
 
 /** Ficheros cambiados que no son de ningun MENOR abierto ni tests: lo que nadie reviso. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
index 346c55e..e489466 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
@@ -51,14 +51,18 @@ export function hostDeRemoto(url: string): string | null {
   if (conEsquema !== null) {
     // Autoridad = usuario[:contrasena]@host[:puerto]. El usuario puede
     // llevar un "@" sin codificar: manda el ULTIMO.
-    const autoridad = conEsquema[1] as string;
-    host = autoridad.slice(autoridad.lastIndexOf('@') + 1).replace(/:\d*$/, '');
+    // TASK-148c (CORE2-09): la misma lectura de la autoridad que partesDeOrigin (puerto 1-65535).
+    const aut = partirAutoridad(conEsquema[1] as string);
+    if (aut === null) return null;
+    host = aut.host;
   } else {
     // scp: [usuario@]host:ruta. Una letra de unidad (`C:\x`) o una ruta
     // local no son hosts.
     const scp = /^(?:[^@/\\:\s]+@)?([^@/\\:\s]+):(?!\/\/)/.exec(texto);
     if (scp === null || (scp[1] as string).length === 1) return null;
-    host = scp[1] as string;
+    const aut = partirAutoridad(scp[1] as string);
+    if (aut === null) return null;
+    host = aut.host;
   }
   host = host.toLowerCase();
   return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(host) ? host : null;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
index 91cfab5..e61bb5b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
@@ -20,6 +20,7 @@
  */
 
 import type { FaseRegistrada } from './transiciones.js';
+import { quitarAnsi, recortar } from './utilidades-texto.js';
 
 export const VERSION_PROGRESO = 1;
 
@@ -68,21 +69,16 @@ const MAX_CAMPO = 40;
 const MAX_PASOS = 20;
 export const MAX_LINEA = 160;
 
-const ANSI_CSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;
-const ANSI_OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/g;
 // Control C0 y C1, separadores de linea y marcas de direccion (podrian reordenar la barra).
 const CONTROL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g;
 
-/** Recorta a `max` caracteres (por puntos de codigo), con `…` si sobra. */
-export function recortar(texto: string, max: number): string {
-  const cps = Array.from(texto);
-  return cps.length <= max ? texto : `${cps.slice(0, Math.max(0, max - 1)).join('')}…`;
-}
+// TASK-148c (CORE1-13): recortar vive en core/utilidades-texto.ts; se reexporta para quien la importa de aqui.
+export { recortar } from './utilidades-texto.js';
 
 /** Texto apto para la barra: sin ANSI ni control, espacios colapsados, recortado. null si no es texto o queda vacio. */
 export function limpiarTexto(valor: unknown, max: number = MAX_CAMPO): string | null {
   if (typeof valor !== 'string') return null;
-  const limpio = valor.replace(ANSI_CSI, '').replace(ANSI_OSC, '').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
+  const limpio = quitarAnsi(valor).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
   return limpio === '' ? null : recortar(limpio, max);
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
index f1bab2b..f3e6bb5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
@@ -16,6 +16,7 @@
  * salir (stdout, JSON, informe en disco, stderr) por si algo se coló.
  */
 import { createHash } from 'node:crypto';
+import { ocultarCredenciales } from './plataforma-remota.js';
 
 export type ClaseSecreto = 'secreto' | 'publica' | 'ejemplo';
 
@@ -182,8 +183,9 @@ export function ocultarSecretos(texto: string): string {
     const re = new RegExp(p.re.source, p.re.flags);
     t = t.replace(re, (m: string) => {
       if (p.id === 'url-con-credenciales') {
-        // Solo la contrasena: `esquema://usuario:****@host`.
-        return m.replace(/:\/\/([^\s:/@'"`]+):[^\s@/'"`]+@/, '://$1:****@');
+        // TASK-148c (CORE2-16): el redactor comun de URLs, que oculta todo el
+        // usuario:contrasena (un token usado como usuario quedaba a la vista).
+        return ocultarCredenciales(m);
       }
       return enmascarar(m);
     });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts
new file mode 100644
index 0000000..dead53b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/utilidades-texto.ts
@@ -0,0 +1,26 @@
+/**
+ * TASK-148c (CORE1-13, CORE2-10, CORE2-17 de la auditoria 4D): utilidades de
+ * texto y valores que estaban copiadas en core, fs y hooks. Sin dependencias a
+ * proposito: core/progreso.ts las usa y lo carga la via rapida de `taskctl
+ * estado` (la status line).
+ */
+
+/** true si `x` es un objeto plano (no null, no array): lo que da un JSON `{...}`. */
+export const esObjeto = (x: unknown): x is Record<string, unknown> =>
+  typeof x === 'object' && x !== null && !Array.isArray(x);
+
+/** Recorta a `max` caracteres (por puntos de codigo), con `…` si sobra. */
+export function recortar(texto: string, max: number): string {
+  const cps = Array.from(texto);
+  return cps.length <= max ? texto : `${cps.slice(0, Math.max(0, max - 1)).join('')}…`;
+}
+
+// Secuencias de terminal: CSI (colores, cursor), OSC (titulos, hipervinculos;
+// con o sin terminador) y escapes de dos caracteres. La de mayor cobertura de
+// las tres copias que habia (una solo quitaba los colores `ESC[...m`).
+const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?|\u001b[@-Z\\-_]/g;
+
+/** El texto sin secuencias ANSI de terminal. */
+export function quitarAnsi(texto: string): string {
+  return texto.replace(ANSI, '');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 3d3dfe2..74d474f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -13,6 +13,7 @@ import type { Task } from '../core/task.js';
 import { resolverConfig } from '../core/config.js';
 import { ocultarCredenciales } from '../core/plataforma-remota.js';
 import { EXTENSIONES_CODIGO, PATRON_GREP_DEFINICION } from '../core/candidatos-4d.js';
+import { CARPETAS_TEST, MARCAS_TEST } from '../core/menores.js';
 import { rutaGit } from './git-crudo.js';
 
 export class GitCommandError extends Error {
@@ -324,11 +325,8 @@ export interface DiffParaRevision {
  * `Test/`. Lo peor es embeber de mas o listar de menos: nada se pierde.
  */
 export const PATRONES_TEST: readonly string[] = [
-  '**/test/**',
-  '**/tests/**',
-  '**/__tests__/**',
-  '**/*.test.*',
-  '**/*.spec.*',
+  ...CARPETAS_TEST.map((c) => `**/${c}/**`),
+  ...MARCAS_TEST.map((m) => `**/*.${m}.*`),
 ];
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
index 1638243..e2fc1f7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
@@ -20,8 +20,9 @@ export function leerJson(ruta: string): Lectura {
   }
 }
 
-export const esObjeto = (x: unknown): x is Record<string, unknown> =>
-  typeof x === 'object' && x !== null && !Array.isArray(x);
+// TASK-148c (CORE2-17): esObjeto vive en core/utilidades-texto.ts; se reexporta para quien la importa de aqui.
+import { esObjeto } from '../core/utilidades-texto.js';
+export { esObjeto };
 
 /** Misma ruta tras resolverla, sin barra final; en Windows sin distinguir mayusculas. */
 export function mismaRuta(a: string, b: string): boolean {
````

## Excluido del diff (25 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-148c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148c/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148c/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148c/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/catalogo-skills.js                                 |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js                                   | 51 +++++++++++++++++++++++----------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/complejidad-similar.js                             | 11 ++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-transcripcion.js                             |  4 +---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/crecimiento-suite.js                               |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-auditoria.js                         | 12 +++++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-catalogo.js                          |  5 +++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/hooks-subagente.js                                 |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-verificacion.js                            |  5 ++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/menores.js                                         | 11 ++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plataforma-remota.js                               | 12 +++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/progreso.js                                        | 12 ++++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/secretos.js                                        |  6 ++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/utilidades-texto.js                                | 21 +++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                               |  8 +++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/json-claude.js                                       |  4 +++-
 25 files changed, 111 insertions(+), 70 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/utilidades-core.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts      |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts        |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/test/core/utilidades-core.test.ts | 61 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 3 files changed, 64 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 274.4 s
- Commit verificado: 58964aa182a2cadbef3b5da5ccbf01d11a2e06a7
- Huella: 5b702a5c744c83bbb72a6c96ac14f238fbfaf1d4
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 97197 bytes en total):

````
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (4384.8181ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (3.3884ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.5776ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9623ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.9195ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7261ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.3665ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.2323ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (41.5952ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7038ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.7993ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.5755ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.626ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.5554ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8612ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4164ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5393ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3971ms)
✔ gitUserEmail: devuelve el user.email configurado en el repo (917.2995ms)
✔ gitUserEmail: un user.email vacio cuenta como sin identidad (607.5434ms)
✔ gitUserEmail: recorta el valor (835.2218ms)
✔ git basico: workspace limpio, rama actual, nombre de rama valido y errores de Git con su mensaje (3776.0015ms)
✔ git remoto y ramas: isRemoteAvailable, localBranchExists, resolveMainBranch y resolveBaseBranchForTipo (37258.9644ms)
✔ ensureBaseBranchReady: caminos felices, rechazos y pull --ff-only fallido (47164.8557ms)
✔ isInsideWorkTree y operacionEnCurso contra repos reales (merge, cherry-pick, revert y sequencer) (31789.1485ms)
✔ runCodexReview: encuentra y lanza un "codex" real del PATH (no inyectado), y un argumento con espacios llega intacto (567.3702ms)
✔ runCodexReview: un argumento con forma "%VARIABLE%" no se expande con el valor real de esa variable de entorno (hallazgo IMPORTANTE de revision, ronda 2) (208.6042ms)
✔ lockfiles: una lista; los que faltaban en la copia de secretos cuentan, requirements.txt no (1.4621ms)
✔ binarios: un UTF-16 con BOM (lleva NUL) es texto y se cuentan sus lineas; un binario de verdad no (4569.1543ms)
✔ PATH: en Windows, PATHEXT antes que el nombre pelado (npm.cmd, no el script sh); sin extension solo si se pide (337.8831ms)
✔ JSON con BOM, nombreBase y el texto de las carpetas excluidas (253.0781ms)
ℹ tests 783
ℹ suites 0
ℹ pass 782
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 257910.3464
[verificar-impacto] node --test termino con 0 en 258.1 s.
````
