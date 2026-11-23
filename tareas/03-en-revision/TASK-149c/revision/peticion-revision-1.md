# Peticion de revision — TASK-149c (ronda 1)

- Tarea: TASK-149c — utilidades de fs (parte c de TASK-149)
- Rama revisada: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
- Rama base: develop
- Commit revisado (HEAD): 2b6f4ad98a6df0c24132a74ecd1ccee51dfc5cef
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-149c (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-149c/tarea.md
- tareas/03-en-revision/TASK-149c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/leer-cola.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy-config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/utilidades-comunes.test.ts

## Commits a revisar (git log develop..HEAD)

````
2b6f4ad chore(TASK-149c): autorrevision
30bfd1d fix(TASK-149c): lockfiles, binarios, cola, PATH, JSON con BOM y nombreBase con una implementacion
e5a89e4 chore(TASK-149c): tarea en curso
2b2e323 merge(TASK-149c): develop en fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
index 9ac00ee..1c40bb1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
@@ -16,6 +16,18 @@ import { gitTexto } from './git-crudo.js';
 /** Carpetas que ni se detectan ni se escanean: dependencias y build. */
 export const DIRS_EXCLUIDOS: readonly string[] = ['node_modules', 'vendor', 'target', 'dist', 'build', '.git'];
 
+/**
+ * TASK-149c (FS-16): las carpetas excluidas para un mensaje, sin `.git` (no
+ * hay versionados dentro): «node_modules, vendor, target, dist o build».
+ */
+export function textoDirsExcluidos(conjuncion: 'o' | 'ni' | 'y'): string {
+  const dirs = DIRS_EXCLUIDOS.filter((d) => d !== '.git');
+  return `${dirs.slice(0, -1).join(', ')} ${conjuncion} ${dirs.at(-1) as string}`;
+}
+
+/** TASK-149c (FS-16): el ultimo segmento de una ruta con `/` (las de git ls-files). */
+export const nombreBase = (ruta: string): string => ruta.slice(ruta.lastIndexOf('/') + 1);
+
 /** Profundidad maxima (carpetas) a la que se buscan marcadores: `a/b/c/package.json` si; un nivel mas, no. */
 export const PROFUNDIDAD_MARCADORES = 3;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
index 5cc3d92..6108482 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-tests.ts
@@ -11,6 +11,7 @@ import { readdirSync, readFileSync, statSync } from 'node:fs';
 import path from 'node:path';
 import { proponerComandosTests, type ComandoTests } from '../core/comando-tests.js';
 import { MAX_BYTES_MARCADOR_APLICACION } from './deteccion-app.js';
+import { quitarBom } from './json-claude.js';
 
 function ficherosDeRaiz(cwd: string): string[] {
   const r: string[] = [];
@@ -33,8 +34,7 @@ function leerAcotado(cwd: string, ficheros: readonly string[], nombre: string):
   try {
     const ruta = path.join(cwd, real);
     if (statSync(ruta).size > MAX_BYTES_MARCADOR_APLICACION) return null;
-    // Sin el BOM: `JSON.parse` lo rechaza y en Windows es habitual (Out-File de PowerShell 5.1).
-    return readFileSync(ruta, 'utf8').replace(/^﻿/, '');
+    return quitarBom(readFileSync(ruta, 'utf8'));
   } catch {
     return null;
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
index d092406..434932f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
@@ -10,11 +10,12 @@
  * comentarios de abajo y la historia de TASK-033.
  */
 import { createHash } from 'node:crypto';
-import { closeSync, fstatSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, statSync } from 'node:fs';
+import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, statSync } from 'node:fs';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { gitCrudo } from './git-crudo.js';
+import { leerCola } from './leer-cola.js';
 
 /** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
 export const CODIGO_TIMEOUT_ENVOLTORIO = 124;
@@ -160,34 +161,6 @@ export function ejecutarAcotado(
   }
 }
 
-/**
- * Los ultimos `bytes` bytes de un fichero, sin leerlo entero: un `npm test`
- * puede soltar megas y el coste no debe depender de eso. Si el corte cae en
- * medio de un caracter UTF-8, se descartan los bytes de continuacion sueltos
- * del principio.
- */
-export function leerCola(ruta: string, bytes: number): { texto: string; total: number } {
-  const fd = openSync(ruta, 'r');
-  try {
-    const total = fstatSync(fd).size;
-    const n = Math.min(total, bytes);
-    const buf = Buffer.alloc(n);
-    let leidos = 0;
-    while (leidos < n) {
-      const k = readSync(fd, buf, leidos, n - leidos, total - n + leidos);
-      if (k === 0) break;
-      leidos += k;
-    }
-    let desde = 0;
-    if (total > n) {
-      while (desde < leidos && desde < 4 && ((buf[desde] as number) & 0xc0) === 0x80) desde++;
-    }
-    return { texto: buf.subarray(desde, leidos).toString('utf8'), total };
-  } finally {
-    closeSync(fd);
-  }
-}
-
 /** true si la salida dice que ENVOLTORIO corto el comando por timeout. */
 export function fueCortado(r: SalidaEjecucion): boolean {
   if (r.error !== undefined && (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') return true;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
index 838cd9f..770222e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
@@ -6,6 +6,7 @@
  */
 import type { ComprobadorEvidencia } from '../core/doctor-deploy-veredictos.js';
 import { gitCrudo } from './git-crudo.js';
+import { decodificar } from './sondas-deploy.js';
 
 const MAX_BYTES_FICHERO = 8 * 1024 * 1024;
 
@@ -38,8 +39,10 @@ export function comprobadorEnCommit(raiz: string, commit: string): ComprobadorEv
       return `no se pudo leer ${ruta} en el commit analizado (${r.error.message.split('\n')[0] ?? 'error'}): puede ser demasiado grande`;
     }
     if (r.status !== 0) return `${ruta} no es un fichero versionado en el commit analizado`;
-    if (r.stdout.subarray(0, 8000).includes(0)) return `${ruta} es un fichero binario: no se puede citar una linea`;
-    const total = contarLineas(r.stdout.toString('utf8'));
+    // TASK-149c (FS-11): la misma deteccion que las sondas (un UTF-16 con BOM lleva NUL y es texto).
+    const texto = decodificar(r.stdout);
+    if (texto === null) return `${ruta} es un fichero binario: no se puede citar una linea`;
+    const total = contarLineas(texto);
     if (linea > total) return `${ruta} tiene ${total} linea(s) y el veredicto cita la ${linea}`;
     return null;
   };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts
index 15f7017..785428b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts
@@ -32,24 +32,49 @@ function esEjecutable(ruta: string, plataforma: NodeJS.Platform): boolean {
   }
 }
 
-/** Ruta absoluta del ejecutable `nombre` en `pathEnv`, o null si no esta. */
-export function localizarHerramienta(
-  nombre: string,
-  pathEnv: string,
-  plataforma: NodeJS.Platform = process.platform
-): string | null {
-  const dirs = pathEnv.split(path.delimiter).filter((d) => d !== '');
+export interface OpcionesPath {
+  plataforma?: NodeJS.Platform;
+  /** PATHEXT de Windows; por defecto, el del proceso. */
+  pathext?: string | undefined;
+  /** En Windows, probar tambien el nombre sin extension (un script de node como `taskctl`). */
+  sinExtensionEnWindows?: boolean;
+}
+
+/**
+ * TASK-149c (FS-13): todos los ejecutables `nombre` del PATH, en orden. En
+ * Windows prueba las extensiones de PATHEXT (en minusculas) y, si se pide,
+ * el nombre sin extension; fuera de Windows exige el bit de ejecucion.
+ */
+export function candidatosEnPath(nombre: string, pathEnv: string, o: OpcionesPath = {}): string[] {
+  const plataforma = o.plataforma ?? process.platform;
+  const dirs = pathEnv.split(path.delimiter).filter((d) => d.trim() !== '');
   const exts =
     plataforma === 'win32'
-      ? (process.env['PATHEXT'] ?? '.COM;.EXE;.BAT;.CMD').split(';').filter((e) => e !== '')
+      ? [
+          ...(o.sinExtensionEnWindows === true ? [''] : []),
+          ...(o.pathext ?? process.env['PATHEXT'] ?? '.COM;.EXE;.BAT;.CMD')
+            .split(';')
+            .filter((e) => e !== '')
+            .map((e) => e.toLowerCase()),
+        ]
       : [''];
+  const r: string[] = [];
   for (const dir of dirs) {
     for (const ext of exts) {
       const candidata = path.join(dir, nombre + ext);
-      if (esEjecutable(candidata, plataforma)) return candidata;
+      if (esEjecutable(candidata, plataforma)) r.push(candidata);
     }
   }
-  return null;
+  return r;
+}
+
+/** Ruta absoluta del ejecutable `nombre` en `pathEnv`, o null si no esta. */
+export function localizarHerramienta(
+  nombre: string,
+  pathEnv: string,
+  plataforma: NodeJS.Platform = process.platform
+): string | null {
+  return candidatosEnPath(nombre, pathEnv, { plataforma })[0] ?? null;
 }
 
 export interface EjecucionHerramienta {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
index 102db72..1638243 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/json-claude.ts
@@ -8,10 +8,13 @@ import path from 'node:path';
 
 export type Lectura = { estado: 'ausente' } | { estado: 'ok'; json: unknown } | { estado: 'ilegible'; motivo: string };
 
+/** TASK-149c (FS-14): el texto sin el BOM de UTF-8 (`JSON.parse` lo rechaza; Out-File de PowerShell 5.1 lo pone). */
+export const quitarBom = (texto: string): string => texto.replace(/^\uFEFF/, '');
+
 export function leerJson(ruta: string): Lectura {
   if (!existsSync(ruta)) return { estado: 'ausente' };
   try {
-    return { estado: 'ok', json: JSON.parse(readFileSync(ruta, 'utf8').replace(/^﻿/, '')) as unknown };
+    return { estado: 'ok', json: JSON.parse(quitarBom(readFileSync(ruta, 'utf8'))) as unknown };
   } catch (e: unknown) {
     return { estado: 'ilegible', motivo: (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim() };
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/leer-cola.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/leer-cola.ts
new file mode 100644
index 0000000..211a792
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/leer-cola.ts
@@ -0,0 +1,34 @@
+/**
+ * TASK-149c (FS-12): la unica lectura de la cola de un fichero. Modulo sin
+ * dependencias a proposito: lo usa fs/progreso.ts, que carga la via rapida de
+ * `taskctl estado` (la status line), y esa via no puede cargar nada que lance git.
+ */
+import { closeSync, fstatSync, openSync, readSync } from 'node:fs';
+
+/**
+ * Los ultimos `bytes` bytes de un fichero, sin leerlo entero: un `npm test`
+ * puede soltar megas y el coste no debe depender de eso. Si el corte cae en
+ * medio de un caracter UTF-8, se descartan los bytes de continuacion sueltos
+ * del principio.
+ */
+export function leerCola(ruta: string, bytes: number): { texto: string; total: number } {
+  const fd = openSync(ruta, 'r');
+  try {
+    const total = fstatSync(fd).size;
+    const n = Math.min(total, bytes);
+    const buf = Buffer.alloc(n);
+    let leidos = 0;
+    while (leidos < n) {
+      const k = readSync(fd, buf, leidos, n - leidos, total - n + leidos);
+      if (k === 0) break;
+      leidos += k;
+    }
+    let desde = 0;
+    if (total > n) {
+      while (desde < leidos && desde < 4 && ((buf[desde] as number) & 0xc0) === 0x80) desde++;
+    }
+    return { texto: buf.subarray(desde, leidos).toString('utf8'), total };
+  } finally {
+    closeSync(fd);
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts
index f82d226..4e0ef84 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts
@@ -17,8 +17,9 @@
  * mas: sin reintentos, sin excepcion, sin salida (lo que se imprime lo lee el
  * agente y cuesta tokens).
  */
-import { closeSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
+import { mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
 import path from 'node:path';
+import { leerCola } from './leer-cola.js';
 import {
   VERSION_PROGRESO,
   parsearContador,
@@ -104,24 +105,11 @@ export function leerProgreso(desde: string): EstadoProgreso | null {
 export function leerContador(desde: string): Contador | null {
   const ruta = rutaContador(desde);
   if (ruta === null) return null;
-  let fd: number | null = null;
   try {
-    fd = openSync(ruta, 'r');
-    const tam = fstatSync(fd).size;
-    const n = Math.min(tam, BYTES_CONTADOR);
-    const buf = Buffer.alloc(n);
-    readSync(fd, buf, 0, n, tam - n);
-    return parsearContador(buf.toString('utf8'));
+    // TASK-149c (FS-12): la lectura de cola comun (repite las lecturas cortas y no parte un caracter).
+    return parsearContador(leerCola(ruta, BYTES_CONTADOR).texto);
   } catch {
     return null;
-  } finally {
-    if (fd !== null) {
-      try {
-        closeSync(fd);
-      } catch {
-        /* nada */
-      }
-    }
   }
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy-config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy-config.ts
index 11b9cb6..a218210 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy-config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy-config.ts
@@ -34,6 +34,7 @@ import {
   type FicheroLeido,
 } from '../core/doctor-deploy-reglas.js';
 import { buscarSilencio, decodificar, evidenciaSilenciada, type ContextoDeploy, type Sonda } from './sondas-deploy.js';
+import { nombreBase, textoDirsExcluidos } from './deteccion-app.js';
 
 const MAX_HALLAZGOS = 200;
 const MAX_RUTAS_ALCANCE = 10;
@@ -49,7 +50,6 @@ export interface TextosSonda {
   motivoOk: string;
 }
 
-const nombreBase = (ruta: string): string => ruta.slice(ruta.lastIndexOf('/') + 1);
 
 /**
  * Construye una sonda: `filtro` elige los ficheros versionados que se miran, `detector`
@@ -62,7 +62,7 @@ export function sondaPorFicheros(filtro: (ruta: string) => boolean, detector: De
       return {
         estado: 'no-aplica',
         motivo: `${textos.ninguno}: no hay nada que revisar`,
-        evidencias: [{ descripcion: `git ls-files: ninguno de ${textos.queBusca} (sin contar node_modules, vendor, target, dist ni build)` }],
+        evidencias: [{ descripcion: `git ls-files: ninguno de ${textos.queBusca} (sin contar ${textoDirsExcluidos('ni')})` }],
       };
     }
     const max = ctx.opciones.maxBytesFichero;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
index 7833b96..d9de590 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
@@ -29,7 +29,7 @@ import {
   interpretarYarnAudit,
   type VeredictoAuditoria,
 } from '../core/doctor-deploy-auditoria.js';
-import { estaExcluido } from './deteccion-app.js';
+import { estaExcluido, nombreBase, textoDirsExcluidos } from './deteccion-app.js';
 // Ciclo de modulos a proposito: sondas-deploy-config usa las utilidades de aqui y este
 // fichero registra sus sondas. Funciona en cualquier orden de carga porque esas sondas
 // son declaraciones de funcion (estan inicializadas antes de evaluar ningun modulo).
@@ -171,21 +171,23 @@ export function evidenciaSilenciada(s: Silencio, patron: string, fichero: string
   return e;
 }
 
-const nombreBase = (ruta: string): string => ruta.slice(ruta.lastIndexOf('/') + 1);
-
-const ARCHIVOS_DE_BLOQUEO = new Set([
-  'package-lock.json',
-  'npm-shrinkwrap.json',
-  'pnpm-lock.yaml',
-  'yarn.lock',
-  'Cargo.lock',
-  'poetry.lock',
-  'Pipfile.lock',
-  'composer.lock',
-  'Gemfile.lock',
-  'go.sum',
-  'uv.lock',
-]);
+const LOCKFILES: Readonly<Record<string, readonly string[]>> = {
+  node: ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'],
+  rust: ['Cargo.lock'],
+  python: ['poetry.lock', 'Pipfile.lock', 'uv.lock', 'pdm.lock', 'pylock.toml', 'requirements.txt'],
+  php: ['composer.lock'],
+  ruby: ['Gemfile.lock'],
+  go: ['go.sum'],
+};
+
+// TASK-149c (FS-10): los ficheros de bloqueo que no se escanean en busca de
+// secretos salen de la misma lista que la sonda de lockfile (antes eran dos
+// listas y esta no tenia bun.lock, pdm.lock ni pylock.toml). requirements.txt
+// no es un fichero de bloqueo generado: puede llevar una URL con token y se escanea.
+const ARCHIVOS_DE_BLOQUEO = new Set(Object.values(LOCKFILES).flat().filter((f) => f !== 'requirements.txt'));
+
+/** true si `ruta` (con `/`) es un fichero de bloqueo, que no se escanea en busca de secretos. */
+export const esArchivoDeBloqueo = (ruta: string): boolean => ARCHIVOS_DE_BLOQUEO.has(nombreBase(ruta));
 
 // ---------------------------------------------------------------------
 // secretos-arbol
@@ -202,7 +204,7 @@ export const sondaSecretosArbol: Sonda = (ctx) => {
   let cortado = false;
 
   for (const rel of ctx.paraEscanear) {
-    if (ARCHIVOS_DE_BLOQUEO.has(nombreBase(rel))) continue;
+    if (esArchivoDeBloqueo(rel)) continue;
     const abs = path.join(ctx.cwd, rel);
     let datos: Buffer;
     try {
@@ -249,7 +251,7 @@ export const sondaSecretosArbol: Sonda = (ctx) => {
   const alcance =
     `${revisados} ficheros de texto revisados con ${IDS_PATRON.length} patrones de claves; ` +
     `${binarios} binarios saltados; ${omitidosGrandes} de texto mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB sin leer; ` +
-    `${versionadosEnCarpetasExcluidas} versionados dentro de node_modules, vendor, target, dist o build incluidos ` +
+    `${versionadosEnCarpetasExcluidas} versionados dentro de ${textoDirsExcluidos('o')} incluidos ` +
     '(los que no estan versionados se excluyen); ' +
     `${silenciadas.length} hallazgos silenciados`;
   const notas: Evidencia[] = [];
@@ -454,14 +456,6 @@ export const sondaGitignoreEnv: Sonda = (ctx) => {
 // lockfile
 // ---------------------------------------------------------------------
 
-const LOCKFILES: Readonly<Record<string, readonly string[]>> = {
-  node: ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'],
-  rust: ['Cargo.lock'],
-  python: ['poetry.lock', 'Pipfile.lock', 'uv.lock', 'pdm.lock', 'pylock.toml', 'requirements.txt'],
-  php: ['composer.lock'],
-  ruby: ['Gemfile.lock'],
-  go: ['go.sum'],
-};
 
 /** `.`, y cada carpeta padre hasta la raiz, de la mas cercana a la mas lejana. */
 function carpetaYAncestros(dir: string): string[] {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts
index 77cf1e4..f202b64 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts
@@ -22,10 +22,11 @@
  *   pedir la instalacion tras actualizar la reescribe con la ruta nueva.
  */
 import { spawnSync } from 'node:child_process';
-import { accessSync, constants, copyFileSync, existsSync, readFileSync, statSync, unlinkSync } from 'node:fs';
+import { copyFileSync, existsSync, statSync, unlinkSync } from 'node:fs';
 import path from 'node:path';
 import { esObjeto, leerJson } from './json-claude.js';
 import { escribirAtomico } from './progreso.js';
+import { candidatosEnPath } from './herramientas-deploy.js';
 
 /** Lo que ejecuta la status line. `--stdin`: toma el directorio del JSON que le pasa Claude Code. */
 export const COMANDO_STATUS_LINE = 'taskctl estado --stdin';
@@ -112,37 +113,29 @@ export interface BusquedaTaskctl {
   scriptPlugin: string | null;
 }
 
-/** Busca `taskctl` en el PATH de `env`, sin lanzar nada. */
+/** Busca `taskctl` en el PATH de `env`, sin lanzar nada. TASK-149c (FS-13): con candidatosEnPath. */
 export function buscarTaskctl(env: NodeJS.ProcessEnv, configDir: string): BusquedaTaskctl {
-  const win = process.platform === 'win32';
-  const exts = win ? ['', ...(variable(env, 'PATHEXT') ?? '.COM;.EXE;.BAT;.CMD').split(';').filter((e) => e !== '')] : [''];
   const plugins = path.join(configDir, 'plugins');
   let soloEnPlugin = false;
   let scriptPlugin: string | null = null;
-  for (const dir of (variable(env, 'PATH') ?? '').split(path.delimiter)) {
-    if (dir.trim() === '') continue;
-    for (const ext of exts) {
-      const candidato = path.join(dir, `taskctl${ext.toLowerCase()}`);
-      try {
-        if (!statSync(candidato).isFile()) continue;
-        if (!win) accessSync(candidato, constants.X_OK);
-      } catch {
-        continue;
-      }
-      if (dentroDe(candidato, plugins)) {
-        soloEnPlugin = true;
-        if (scriptPlugin === null) {
-          const script = path.join(dir, 'taskctl');
-          try {
-            if (statSync(script).isFile()) scriptPlugin = script;
-          } catch {
-            /* esa carpeta no trae el script de node: se sigue buscando */
-          }
+  const candidatos = candidatosEnPath('taskctl', variable(env, 'PATH') ?? '', {
+    pathext: variable(env, 'PATHEXT'),
+    sinExtensionEnWindows: true,
+  });
+  for (const candidato of candidatos) {
+    if (dentroDe(candidato, plugins)) {
+      soloEnPlugin = true;
+      if (scriptPlugin === null) {
+        const script = path.join(path.dirname(candidato), 'taskctl');
+        try {
+          if (statSync(script).isFile()) scriptPlugin = script;
+        } catch {
+          /* esa carpeta no trae el script de node: se sigue buscando */
         }
-        continue;
       }
-      return { ruta: candidato, soloEnPlugin: false, scriptPlugin: null };
+      continue;
     }
+    return { ruta: candidato, soloEnPlugin: false, scriptPlugin: null };
   }
   return { ruta: null, soloEnPlugin, scriptPlugin };
 }
@@ -165,10 +158,12 @@ function copiaDeSeguridad(ruta: string, ahora: Date): string | null {
 }
 
 function leerObjeto(ruta: string): Record<string, unknown> {
-  if (!existsSync(ruta)) return {};
-  const json = JSON.parse(readFileSync(ruta, 'utf8').replace(/^\uFEFF/, '')) as unknown;
-  if (!esObjeto(json)) throw new Error('no es un objeto JSON');
-  return json;
+  // TASK-149c (FS-14): con leerJson (sin BOM); aqui un fichero roto aborta, no se sobrescribe.
+  const l = leerJson(ruta);
+  if (l.estado === 'ausente') return {};
+  if (l.estado === 'ilegible') throw new Error(l.motivo);
+  if (!esObjeto(l.json)) throw new Error('no es un objeto JSON');
+  return l.json;
 }
 
 function escribir(ruta: string, obj: Record<string, unknown>): boolean {
````

## Excluido del diff (20 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-149c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149c/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149c/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149c/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/deteccion-app.js                                     | 10 ++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/deteccion-tests.js                                   |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/ejecucion-acotada.js                                 | 33 ++-------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/evidencia-veredicto.js                               |  7 +++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/herramientas-deploy.js                               | 28 ++++++++++++++++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/json-claude.js                                       |  4 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/leer-cola.js                                         | 36 ++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/progreso.js                                          | 22 ++++------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-deploy-config.js                              |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-deploy.js                                     | 43 ++++++++++++++++++-------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/status-line.js                                       | 62 +++++++++++++++++++++++++++-----------------------------------
 20 files changed, 139 insertions(+), 124 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/utilidades-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/utilidades-comunes.test.ts | 75 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 77 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 142.0 s
- Commit verificado: 2b6f4ad98a6df0c24132a74ecd1ccee51dfc5cef
- Huella: 775794818c801cd699f04cd94ea4b789a208e6cd
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 97796 bytes en total):

````
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.0238ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.9184ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.8362ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1801.6122ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1373.1315ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.886ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.146ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8425ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6353ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6936ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.078ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.67ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.7356ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6244ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.2651ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.5889ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.3165ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.5324ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.3493ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3779ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5321ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3391ms)
✔ un directorio que no existe no detecta nada (no lanza) (3.7613ms)
✔ package.json mayor que el tope no se lee: no cuenta (39.6362ms)
✔ package.json justo en el tope si se lee (37.7029ms)
✔ un directorio con nombre de manifiesto no cuenta (18.7211ms)
﹣ enlace a fichero cuenta; enlace roto no (si la plataforma deja crearlos) (14.0937ms) # sin permiso para crear enlaces simbolicos
✔ lockfiles: una lista; los que faltaban en la copia de secretos cuentan, requirements.txt no (2.1084ms)
✔ binarios: un UTF-16 con BOM (lleva NUL) es texto y se cuentan sus lineas; un binario de verdad no (1529.8759ms)
✔ PATH: en Windows, PATHEXT antes que el nombre pelado (npm.cmd, no el script sh); sin extension solo si se pide (19.5403ms)
✔ JSON con BOM, nombreBase y el texto de las carpetas excluidas (9.8979ms)
ℹ tests 770
ℹ suites 0
ℹ pass 769
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 131758.9707
[verificar-impacto] node --test termino con 0 en 131.9 s.
````
