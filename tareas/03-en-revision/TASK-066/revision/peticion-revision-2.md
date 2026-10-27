# Peticion de revision — TASK-066 (ronda 2)

- Tarea: TASK-066 — Doctor-deploy A: catalogo generico y comprobaciones deterministas
- Rama revisada: feature/task-066-doctor-deploy-a-catalogo-generico-y-comp
- Rama base: develop
- Commit revisado (HEAD): feea4ef2ddba7e21057c94766a074b992360ac4b
- Fecha: 2026-10-27
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-066 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 92422185bf17c7de4d5985648e803f3f44e34442 (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | src/fs/deteccion-app.ts:42 + src/fs/sondas-deploy.ts:214 (ficheros-secretos) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | src/fs/sondas-deploy.ts:129 y :524 (exclusion de build/dist/vendor/target en arbol e historial) | informe-revision-1.md |
| IMP-3 | IMPORTANTE | abierto | src/fs/sondas-deploy.ts:74 y :144 (esBinario) | informe-revision-1.md |
| IMP-4 | IMPORTANTE | abierto | src/fs/sondas-deploy.ts:80 y src/core/doctor-deploy-catalogo.ts:~478 (silenciar sin commit) | informe-revision-1.md |
| IMP-5 | IMPORTANTE | abierto | src/fs/sondas-deploy.ts:249 (gitignore-env con regla negada) | informe-revision-1.md |
| IMP-6 | IMPORTANTE | abierto | test/commands/doctor-deploy.test.ts (tres mutantes sobreviven) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/fs/sondas-deploy.ts:136 (ficheros >1 MiB) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/fs/sondas-deploy.ts:441 (rutas no ASCII en el historial) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/commands/doctor-deploy.ts (--escribir y workspace limpio) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/fs/sondas-deploy.ts:249, :293 (falsos FALLA/OK de gitignore y lockfile) | informe-revision-1.md |
| MEN-5 | MENOR | abierto | src/commands/doctor-deploy.ts:224 (fallo al escribir pierde el informe) | informe-revision-1.md |
| MEN-6 | MENOR | abierto | src/core/doctor-deploy.ts:sanearPunto (sin test que lo exija) | informe-revision-1.md |
| MEN-7 | MENOR | abierto | scripts/doctor-deploy.yml (referencia OWASP 2021) | informe-revision-1.md |

## Commits a revisar (git log 92422185bf17c7de4d5985648e803f3f44e34442..HEAD)

````
feea4ef chore(TASK-066): coste implementacion +13208190 tokens (1 agente)
48d812d docs(TASK-066): doctor-deploy en la lista de comandos
1ecfbcc fix(TASK-066): cobertura de las sondas tras la revision (IMP-1,2,3,5,6 y MEN-1..6)
043864a fix(TASK-066): silencios por hallazgo con huella del valor (IMP-4)
444cc26 chore(TASK-066): veredicto ronda 1 (cambios-solicitados)
0632d23 chore(TASK-066): coste revision +10304614 tokens (1 agente)
8c05d20 docs(TASK-066): informe de revision 1
8326430 chore(TASK-066): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 92422185bf17c7de4d5985648e803f3f44e34442..HEAD)

````diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 9828128..686eb14 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -43,7 +43,7 @@ npm test             # compila y corre la suite completa (~1290 tests, ~10 min)
 npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar, no para cerrar
 ```
 
-El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | doctor [--json] | plan |
+El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | doctor [--json] | doctor-deploy [--json] [--escribir] | plan |
 approve | start | review | finish [--tag <nombre>] [--merge-request] [--push] | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
 recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
 cerradas.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 29c09d3..fb600f8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -628,10 +628,15 @@ punto_1_descripcion: Los logs no llevan datos personales de clientes
 
 # Silenciar UN hallazgo concreto (un secreto ya rotado, un falso positivo).
 # patron: el que informa el punto (stripe-live, aws-access-key, fichero-secreto...).
-# commit es opcional; si es solo dígitos, ponlo entre comillas.
+# Un silencio es POR HALLAZGO: un hallazgo del historial se silencia con su commit
+# (silenciar_N_commit); uno del árbol, con la huella de su valor (silenciar_N_huella),
+# que sale en la evidencia ("huella ab12cd34ef56") y no revela la clave. Sin commit ni
+# huella aborta (taparía también claves nuevas del mismo fichero); la huella es opcional
+# con commit. Si commit o huella son solo dígitos, ponlos entre comillas.
 silenciar_1_patron: stripe-live
 silenciar_1_fichero: config/prod.env
 silenciar_1_commit: "ab12cd34"
+silenciar_1_huella: "ab12cd34ef56"
 silenciar_1_motivo: Clave rotada el 2026-10-01
 silenciar_1_quien: carlos
 silenciar_1_fecha: 2026-10-27
@@ -640,7 +645,17 @@ silenciar_1_fecha: 2026-10-27
 Un `id` desconocido en `desactivar_N_id` avisa y se ignora; un `id` repetido (con
 el catálogo del plugin o consigo mismo) aborta, igual que desactivar sin motivo.
 Un silencio que no coincide con ningún hallazgo avisa, y el hallazgo silenciado
-sigue apareciendo en la evidencia con su motivo, quién y cuándo.
+sigue apareciendo en la evidencia con su motivo, quién y cuándo, y cada punto de
+secretos dice «N hallazgos silenciados».
+
+Cobertura de los escaneos de claves: se leen todos los ficheros versionados (también
+los que están en `build`, `dist`, `vendor`, `target` o `node_modules`) y los sin
+versionar que no están ignorados fuera de esas carpetas; en el historial, todos los
+blobs, sea cual sea su ruta. Un fichero UTF-16 con BOM se decodifica; los binarios
+saltados se cuentan siempre. Un fichero de texto mayor de 1 MiB no se lee y deja el
+punto en NO VERIFICADO (un binario grande, no). Un `requirements.txt` solo cuenta
+como lockfile si fija todo con `==`, y una regla negada (`!.env`) en el `.gitignore`
+es FALLA.
 
 `taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
 con la duración de calendario de cada fase (diseño = plan→start, curso =
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
index f9633ee..d4f5211 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
@@ -232,6 +232,8 @@ export function runDoctorDeployCommand(argv: readonly string[], deps: DoctorDepl
     cwd: raiz,
     presentes: archivos.presentes,
     versionados: archivos.versionados,
+    versionadosTodos: archivos.versionadosTodos,
+    paraEscanear: archivos.paraEscanear,
     tipos,
     silencios: catalogo.silencios,
     silenciosUsados: new Set<number>(),
@@ -260,7 +262,9 @@ export function runDoctorDeployCommand(argv: readonly string[], deps: DoctorDepl
     }
   }
 
-  const estado = gitTexto(['status', '--porcelain'], raiz, { timeoutMs: 30_000 });
+  // Los informes de --escribir no cuentan como «sucio»: dejan el arbol sin trackear a proposito
+  // y una segunda ejecucion se marcaria sucia solo por el informe anterior.
+  const estado = gitTexto(['status', '--porcelain', '--', '.', ':(exclude)docs/doctor-deploy'], raiz, { timeoutMs: 30_000 });
   const commit = gitTexto(['rev-parse', '--verify', '--quiet', 'HEAD'], raiz, { timeoutMs: 15_000 });
   const rama = gitTexto(['symbolic-ref', '--short', '-q', 'HEAD'], raiz, { timeoutMs: 15_000 });
   if (estado === null) avisos.push('no se pudo saber si el arbol esta limpio (git status fallo): se marca como sucio.');
@@ -284,12 +288,20 @@ export function runDoctorDeployCommand(argv: readonly string[], deps: DoctorDepl
   let rutaInforme: string | null = null;
   let mensajeEscritura = '';
   if (escribir) {
-    const destino = escribirInforme(raiz, fechaLocal(ahora), salidaSegura(formatearInforme(informe)));
-    rutaInforme = destino;
-    const rel = path.relative(raiz, destino).replace(/\\/g, '/');
-    mensajeEscritura =
-      `Informe escrito en ${rel}${informe.arbolSucio ? ' (el arbol estaba sucio: no describe un commit limpio)' : ''}. ` +
-      'No se ha commiteado: revisalo y commitealo tu.\n';
+    try {
+      const destino = escribirInforme(raiz, fechaLocal(ahora), salidaSegura(formatearInforme(informe)));
+      rutaInforme = destino;
+      const rel = path.relative(raiz, destino).replace(/\\/g, '/');
+      mensajeEscritura =
+        `Informe escrito en ${rel}${informe.arbolSucio ? ' (el arbol estaba sucio: no describe un commit limpio)' : ''}. ` +
+        'No se ha commiteado: revisalo y commitealo tu.\n';
+    } catch (e: unknown) {
+      // El analisis ya esta hecho: se imprime igualmente y se avisa de que el informe no se guardo.
+      const msg = e instanceof Error ? e.message : String(e);
+      mensajeEscritura =
+        salidaSegura(`[AVISO] No se pudo escribir el informe en ${CARPETA_INFORMES}: ${msg.replace(/\s+/g, ' ')}. `) +
+        'El analisis de arriba es completo; arregla la ruta y repite con --escribir.\n';
+    }
   }
 
   return { informe, codigo, salida, json, rutaInforme, mensajeEscritura };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
index fc5a5f0..b09ba4e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
@@ -82,6 +82,8 @@ export interface Silencio {
   fichero: string;
   /** Prefijo (7+ caracteres) o hash del commit; null = cualquiera. */
   commit: string | null;
+  /** Prefijo (8+ hex) de la huella del valor; null = no se exige. */
+  huella: string | null;
   motivo: string;
   quien: string;
   fecha: string;
@@ -112,7 +114,7 @@ const MAX_ENTRADAS = 500;
 const CAMPOS_TIPO = ['id', 'nombre', 'marcadores'] as const;
 const CAMPOS_PUNTO = ['id', 'severidad', 'tipos', 'metodo', 'sonda', 'arreglo', 'descripcion', 'referencia'] as const;
 const CAMPOS_DESACTIVAR = ['id', 'motivo'] as const;
-const CAMPOS_SILENCIAR = ['patron', 'fichero', 'commit', 'motivo', 'quien', 'fecha'] as const;
+const CAMPOS_SILENCIAR = ['patron', 'fichero', 'commit', 'huella', 'motivo', 'quien', 'fecha'] as const;
 
 type Valor = { valor: unknown; numeroLinea: number };
 type Bloque = Map<string, Valor>;
@@ -499,7 +501,26 @@ export function parsearCapaProyecto(contenido: string, ruta: string, base: Catal
         throw fallar(`[ERROR] ${ruta}:${cCommit.numeroLinea}: "silenciar_${n}_commit" debe ser un hash de commit de 7 a 40 caracteres hexadecimales.`);
       }
     }
-    silencios.push({ numero: n, patron, fichero, commit, motivo, quien, fecha });
+    const cHuella = b.get('huella');
+    let huella: string | null = null;
+    if (cHuella !== undefined) {
+      if (typeof cHuella.valor === 'number') {
+        throw fallar(`[ERROR] ${ruta}:${cHuella.numeroLinea}: "silenciar_${n}_huella" son solo digitos y se leeria como un numero: ponla entre comillas.`);
+      }
+      huella = texto(cHuella, `silenciar_${n}_huella`, ruta, fallar).toLowerCase();
+      if (!/^[0-9a-f]{8,64}$/.test(huella)) {
+        throw fallar(`[ERROR] ${ruta}:${cHuella.numeroLinea}: "silenciar_${n}_huella" debe tener de 8 a 64 caracteres hexadecimales (la que imprime el hallazgo).`);
+      }
+    }
+    // D3: un silencio es POR HALLAZGO. Sin commit solo vale para el arbol, y ahi se ata a la huella
+    // del valor: asi no tapa otra clave nueva del mismo patron en el mismo fichero.
+    if (commit === null && huella === null && patron !== 'fichero-secreto') {
+      throw fallar(
+        `[ERROR] ${ruta}: silenciar_${n} exige "silenciar_${n}_commit" (hallazgo del historial) o "silenciar_${n}_huella" ` +
+          '(hallazgo del arbol: la huella sale en la evidencia). Sin ninguno taparia tambien las claves nuevas del mismo fichero.'
+      );
+    }
+    silencios.push({ numero: n, patron, fichero, commit, huella, motivo, quien, fecha });
   }
 
   // id desconocido en desactivar: aviso (se comprueba contra base + anadidos)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
index b05ad36..e4dc769 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
@@ -15,6 +15,7 @@
  * `ocultarSecretos` es la segunda red: reescribe cualquier texto que vaya a
  * salir (stdout, JSON, informe en disco, stderr) por si algo se coló.
  */
+import { createHash } from 'node:crypto';
 
 export type ClaseSecreto = 'secreto' | 'publica' | 'ejemplo';
 
@@ -26,6 +27,11 @@ export interface HallazgoSecreto {
   linea: number;
   /** Valor enmascarado: nunca el crudo. */
   muestra: string;
+  /**
+   * Huella estable del valor (12 hex de su SHA-256): identifica el hallazgo para
+   * silenciarlo sin revelar el valor. No se puede invertir en una clave real.
+   */
+  huella: string;
 }
 
 interface Clasificacion {
@@ -113,6 +119,11 @@ export const IDS_PATRON: readonly string[] = [
   'supabase-anon',
 ];
 
+/** Huella del valor: 12 caracteres hex de su SHA-256. */
+export function huellaDe(valor: string): string {
+  return createHash('sha256').update(valor).digest('hex').slice(0, 12);
+}
+
 /** Valor enmascarado: 4 caracteres como mucho + la longitud. Nunca el crudo. */
 export function enmascarar(valor: string): string {
   const visibles = Math.min(4, Math.floor(valor.length / 4));
@@ -148,7 +159,7 @@ export function buscarSecretos(texto: string): HallazgoSecreto[] {
       if (c === null) continue;
       encontrados.push({
         indice: m.index,
-        h: { patron: c.patron ?? p.id, clase: c.clase, muestra: enmascarar(m[0]) },
+        h: { patron: c.patron ?? p.id, clase: c.clase, muestra: enmascarar(m[0]), huella: huellaDe(m[0]) },
       });
     }
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
index 74d6b63..84c0596 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
@@ -32,6 +32,14 @@ export interface ArchivosProyecto {
   presentes: string[];
   /** Solo los versionados; sin carpetas excluidas. */
   versionados: string[];
+  /** TODOS los versionados (git ls-files completo), tambien los de build, dist, vendor, target y node_modules. */
+  versionadosTodos: string[];
+  /**
+   * Lo que se escanea en busca de claves: todo lo versionado (aunque este en una
+   * carpeta de dependencias o build: si esta en el repo, se publica) mas lo sin
+   * versionar que no esta ignorado fuera de esas carpetas.
+   */
+  paraEscanear: string[];
 }
 
 /** null si no se pudo listar (no es un repo Git, o git no esta). */
@@ -42,7 +50,8 @@ export function listarArchivos(cwd: string): ArchivosProyecto | null {
   const sinExcluidos = (xs: string[]): string[] => xs.filter((r) => !estaExcluido(r));
   const v = sinExcluidos(versionados);
   const presentes = [...new Set([...v, ...sinExcluidos(otros)])];
-  return { presentes, versionados: v };
+  const paraEscanear = [...new Set([...versionados, ...sinExcluidos(otros)])];
+  return { presentes, versionados: v, versionadosTodos: versionados, paraEscanear };
 }
 
 function coincideMarcador(ruta: string, marcador: string): boolean {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
index b5ce059..7e5d11f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
@@ -12,7 +12,7 @@
  *   enmascarada (`buscarSecretos` ya no devuelve el valor crudo).
  * - Se excluyen node_modules, vendor, target, dist y build.
  */
-import { readFileSync, mkdtempSync, rmSync, statSync } from 'node:fs';
+import { closeSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, statSync } from 'node:fs';
 import os from 'node:os';
 import path from 'node:path';
 import { buscarSecretos, IDS_PATRON } from '../core/secretos.js';
@@ -55,6 +55,10 @@ export interface ContextoDeploy {
   /** Versionados mas sin versionar no ignorados (sin carpetas excluidas). */
   presentes: string[];
   versionados: string[];
+  /** git ls-files completo, sin excluir carpetas. */
+  versionadosTodos: string[];
+  /** Lo que se escanea en busca de claves (ver ArchivosProyecto). */
+  paraEscanear: string[];
   tipos: TipoDetectado[];
   silencios: Silencio[];
   /** `numero` de los silencios que taparon algun hallazgo. */
@@ -77,10 +81,54 @@ function esBinario(b: Buffer): boolean {
   return false;
 }
 
-function buscarSilencio(ctx: ContextoDeploy, patron: string, fichero: string, commit: string | null): Silencio | null {
+/**
+ * Texto del contenido, o null si es binario. Un UTF-16 con BOM (el `>` de
+ * PowerShell 5.1 lo escribe asi) lleva NUL pero es texto: se decodifica.
+ */
+function decodificar(b: Buffer): string | null {
+  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) return b.subarray(2).toString('utf16le');
+  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
+    const par = b.subarray(2, 2 + ((b.length - 2) & ~1));
+    return Buffer.from(par).swap16().toString('utf16le');
+  }
+  if (esBinario(b)) return null;
+  return b.toString('utf8');
+}
+
+/** Los primeros bytes de un fichero (para decidir si es texto sin leerlo entero). */
+function cabeceraDe(abs: string): Buffer {
+  const fd = openSync(abs, 'r');
+  try {
+    const buf = Buffer.alloc(MAX_BYTES_BINARIO);
+    const n = readSync(fd, buf, 0, buf.length, 0);
+    return buf.subarray(0, n);
+  } finally {
+    closeSync(fd);
+  }
+}
+
+interface ClaveHallazgo {
+  /** Hash del commit (historial). Ausente = hallazgo del arbol de trabajo. */
+  commit?: string;
+  /** Huella del valor, si se conoce. */
+  huella?: string;
+}
+
+/**
+ * Un silencio es POR HALLAZGO: un hallazgo del historial exige un silencio con
+ * `commit`; uno del arbol, un silencio sin commit y atado a la huella del valor
+ * (el parser lo obliga). Asi no se tapa una clave nueva del mismo patron en el
+ * mismo fichero.
+ */
+function buscarSilencio(ctx: ContextoDeploy, patron: string, fichero: string, clave: ClaveHallazgo): Silencio | null {
   for (const s of ctx.silencios) {
     if (s.patron !== patron || s.fichero !== fichero) continue;
-    if (s.commit !== null && (commit === null || !commit.startsWith(s.commit))) continue;
+    if (clave.commit !== undefined) {
+      if (s.commit === null || !clave.commit.startsWith(s.commit)) continue;
+    } else if (s.commit !== null) {
+      continue;
+    }
+    if (s.huella !== null && (clave.huella === undefined || !clave.huella.startsWith(s.huella))) continue;
     ctx.silenciosUsados.add(s.numero);
     return s;
   }
@@ -122,11 +170,12 @@ export const sondaSecretosArbol: Sonda = (ctx) => {
   const silenciadas: Evidencia[] = [];
   let revisados = 0;
   let omitidosGrandes = 0;
+  let binarios = 0;
   let publicas = 0;
   let ejemplos = 0;
   let cortado = false;
 
-  for (const rel of ctx.presentes) {
+  for (const rel of ctx.paraEscanear) {
     if (ARCHIVOS_DE_BLOQUEO.has(nombreBase(rel))) continue;
     const abs = path.join(ctx.cwd, rel);
     let datos: Buffer;
@@ -134,24 +183,35 @@ export const sondaSecretosArbol: Sonda = (ctx) => {
       const st = statSync(abs);
       if (!st.isFile()) continue;
       if (st.size > ctx.opciones.maxBytesFichero) {
-        omitidosGrandes++;
+        // Grande: si es binario no hay nada que leer; si es texto, queda sin mirar y se dice.
+        if (decodificar(cabeceraDe(abs)) === null) binarios++;
+        else omitidosGrandes++;
         continue;
       }
       datos = readFileSync(abs);
     } catch {
       continue; // borrado o ilegible: no hay nada que escanear
     }
-    if (esBinario(datos)) continue;
+    const contenido = decodificar(datos);
+    if (contenido === null) {
+      binarios++;
+      continue;
+    }
     revisados++;
-    for (const h of buscarSecretos(datos.toString('utf8'))) {
+    for (const h of buscarSecretos(contenido)) {
       if (h.clase === 'publica') publicas++;
       else if (h.clase === 'ejemplo') ejemplos++;
       else {
-        const s = buscarSilencio(ctx, h.patron, rel, null);
+        const s = buscarSilencio(ctx, h.patron, rel, { huella: h.huella });
         if (s !== null) {
           silenciadas.push(evidenciaSilenciada(s, h.patron, rel, h.linea, undefined));
         } else if (fallos.length < MAX_HALLAZGOS) {
-          fallos.push({ descripcion: `clave secreta (patron ${h.patron})`, fichero: rel, linea: h.linea, muestra: h.muestra });
+          fallos.push({
+            descripcion: `clave secreta (patron ${h.patron}, huella ${h.huella})`,
+            fichero: rel,
+            linea: h.linea,
+            muestra: h.muestra,
+          });
         } else {
           cortado = true;
         }
@@ -159,10 +219,13 @@ export const sondaSecretosArbol: Sonda = (ctx) => {
     }
   }
 
+  const versionadosEnCarpetasExcluidas = ctx.paraEscanear.filter((r) => estaExcluido(r)).length;
   const alcance =
-    `${revisados} ficheros de texto revisados con ${IDS_PATRON.length} patrones de claves` +
-    (omitidosGrandes > 0 ? `; ${omitidosGrandes} omitidos por tamano` : '') +
-    '; excluidos node_modules, vendor, target, dist y build';
+    `${revisados} ficheros de texto revisados con ${IDS_PATRON.length} patrones de claves; ` +
+    `${binarios} binarios saltados; ${omitidosGrandes} de texto mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB sin leer; ` +
+    `${versionadosEnCarpetasExcluidas} versionados dentro de node_modules, vendor, target, dist o build incluidos ` +
+    '(los que no estan versionados se excluyen); ' +
+    `${silenciadas.length} hallazgos silenciados`;
   const notas: Evidencia[] = [];
   if (publicas + ejemplos > 0) {
     notas.push({
@@ -184,6 +247,15 @@ export const sondaSecretosArbol: Sonda = (ctx) => {
       evidencias: [],
     };
   }
+  if (omitidosGrandes > 0) {
+    return {
+      estado: 'no-verificado',
+      motivo:
+        `${omitidosGrandes} fichero(s) de texto mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB no se leyeron: ` +
+        'no se puede afirmar que no tengan claves (un bundle puede llevarlas). Revisalos a mano o con gitleaks',
+      evidencias: [{ descripcion: alcance }, ...silenciadas, ...notas],
+    };
+  }
   return {
     estado: 'ok',
     motivo: 'ninguna clave secreta en los ficheros del proyecto',
@@ -211,10 +283,11 @@ export function motivoFicheroSecreto(ruta: string): string | null {
 export const sondaFicherosSecretos: Sonda = (ctx) => {
   const fallos: Evidencia[] = [];
   const silenciadas: Evidencia[] = [];
-  for (const rel of ctx.versionados) {
+  // git ls-files COMPLETO: comprobar un nombre no da falsos positivos, asi que no se excluye nada.
+  for (const rel of ctx.versionadosTodos) {
     const motivo = motivoFicheroSecreto(rel);
     if (motivo === null) continue;
-    const s = buscarSilencio(ctx, 'fichero-secreto', rel, null);
+    const s = buscarSilencio(ctx, 'fichero-secreto', rel, {});
     if (s !== null) silenciadas.push(evidenciaSilenciada(s, 'fichero-secreto', rel, undefined, undefined));
     else fallos.push({ descripcion: `${motivo} versionado`, fichero: rel });
   }
@@ -225,7 +298,7 @@ export const sondaFicherosSecretos: Sonda = (ctx) => {
       evidencias: [...fallos, ...silenciadas],
     };
   }
-  if (ctx.versionados.length === 0) {
+  if (ctx.versionadosTodos.length === 0) {
     return { estado: 'no-verificado', motivo: 'no hay ficheros versionados que revisar (git ls-files vacio)', evidencias: [] };
   }
   return {
@@ -234,8 +307,8 @@ export const sondaFicherosSecretos: Sonda = (ctx) => {
     evidencias: [
       {
         descripcion:
-          `${ctx.versionados.length} ficheros versionados revisados (git ls-files): ninguno es un .env, una clave privada ` +
-          'ni un fichero de credenciales (.env.example y .env.sample no cuentan)',
+          `${ctx.versionadosTodos.length} ficheros versionados revisados (git ls-files completo): ninguno es un .env, una clave privada ` +
+          `ni un fichero de credenciales (.env.example y .env.sample no cuentan); ${silenciadas.length} hallazgos silenciados`,
       },
       ...silenciadas,
     ],
@@ -264,8 +337,27 @@ export const sondaGitignoreEnv: Sonda = (ctx) => {
   }
   // Salida: `<fuente>:<linea>:<patron>\t<ruta>`. Solo vale una regla que viaja con el repo.
   const m = /^(.*?):(\d+):(.*?)\t/.exec(r.stdout.toString('utf8').trim());
-  const fuente = m?.[1] ?? '';
-  const versionada = fuente !== '' && !path.isAbsolute(fuente) && !/[\\/]\.git[\\/]/.test(fuente) && !fuente.startsWith('.git/');
+  // Git entrecomilla la ruta si lleva barras invertidas (un excludesFile global en Windows).
+  const fuente = (m?.[1] ?? '').replace(/^"(.*)"$/, '$1').replace(/\\\\/g, '\\');
+  if ((m?.[3] ?? '').startsWith('!')) {
+    return {
+      estado: 'falla',
+      motivo: 'una regla negada deja .env sin ignorar',
+      evidencias: [
+        {
+          descripcion: `la regla "${m?.[3] ?? ''}" REINCLUYE .env: git check-ignore la devuelve aunque no lo ignora. Quitala, o .env se podra versionar`,
+          fichero: fuente,
+          linea: Number(m?.[2]),
+        },
+      ],
+    };
+  }
+  const versionada =
+    fuente !== '' &&
+    !path.isAbsolute(fuente) &&
+    !/^[A-Za-z]:/.test(fuente) &&
+    !/(?:^|[\\/])\.git[\\/]/.test(fuente) &&
+    /(?:^|[\\/])\.gitignore$/.test(fuente);
   if (!versionada) {
     return {
       estado: 'falla',
@@ -311,6 +403,15 @@ function carpetaYAncestros(dir: string): string[] {
 
 const unir = (dir: string, nombre: string): string => (dir === '.' ? nombre : `${dir}/${nombre}`);
 
+/** Un requirements.txt solo hace de lockfile si fija TODAS sus dependencias con `==` (o `@` a una URL). */
+export function requirementsFijado(contenido: string): boolean {
+  const lineas = contenido
+    .split(/\r?\n/)
+    .map((l) => l.trim())
+    .filter((l) => l !== '' && !l.startsWith('#') && !l.startsWith('-'));
+  return lineas.length > 0 && lineas.every((l) => /==|\s@\s/.test(l));
+}
+
 export const sondaLockfile: Sonda = (ctx) => {
   const versionados = new Set(ctx.versionados);
   const presentes = new Set(ctx.presentes);
@@ -323,7 +424,17 @@ export const sondaLockfile: Sonda = (ctx) => {
     for (const dir of tipo.rutas) {
       revisados++;
       const donde = carpetaYAncestros(dir);
-      const hallado = donde.flatMap((d) => candidatos.map((c) => unir(d, c))).find((r) => versionados.has(r));
+      const hallado = donde
+        .flatMap((d) => candidatos.map((c) => unir(d, c)))
+        .find((r) => {
+          if (!versionados.has(r)) return false;
+          if (nombreBase(r) !== 'requirements.txt') return true;
+          try {
+            return requirementsFijado(readFileSync(path.join(ctx.cwd, r), 'utf8'));
+          } catch {
+            return false;
+          }
+        });
       if (hallado !== undefined) {
         ok.push({ descripcion: `${tipo.nombre} en ${dir}: lockfile versionado`, fichero: hallado });
         continue;
@@ -331,7 +442,7 @@ export const sondaLockfile: Sonda = (ctx) => {
       const sinVersionar = donde.flatMap((d) => candidatos.map((c) => unir(d, c))).find((r) => presentes.has(r));
       fallos.push({
         descripcion:
-          `${tipo.nombre} en ${dir}: no hay lockfile versionado (${candidatos.join(', ')})` +
+          `${tipo.nombre} en ${dir}: no hay lockfile versionado (${candidatos.join(', ')}; un requirements.txt solo cuenta con todo fijado con ==)` +
           (sinVersionar !== undefined ? `; existe ${sinVersionar} pero no esta versionado` : ''),
         fichero: unir(dir, candidatos[0] as string),
       });
@@ -356,6 +467,7 @@ interface HallazgoHistorial {
   patron: string;
   linea: number;
   muestra: string;
+  huella: string;
 }
 
 const BYTES_POR_LOTE = 32 * 1024 * 1024;
@@ -438,7 +550,7 @@ const MAX_APARICIONES_POR_BLOB = 10;
  * hallazgo. null = no se pudo preguntar.
  */
 function aparicionesDeBlob(ctx: ContextoDeploy, sha: string): Aparicion[] | null {
-  const t = gitTexto(['log', '--all', '--no-renames', '--no-abbrev', '--raw', '--format=%H', `--find-object=${sha}`], ctx.cwd, {
+  const t = gitTexto(['-c', 'core.quotepath=false', 'log', '--all', '--no-renames', '--no-abbrev', '--raw', '--format=%H', `--find-object=${sha}`], ctx.cwd, {
     timeoutMs: 60_000,
   });
   if (t === null) return null;
@@ -512,7 +624,6 @@ export const sondaSecretosHistorial: Sonda = (ctx) => {
   }
   const candidatos: Array<{ sha: string; ruta: string; tam: number }> = [];
   let grandes = 0;
-  let enExcluidas = 0;
   let totalBlobs = 0;
   for (const linea of tipos.stdout.toString('utf8').split(/\r?\n/)) {
     const m = /^([0-9a-f]{40}) blob (\d+)$/.exec(linea);
@@ -520,11 +631,9 @@ export const sondaSecretosHistorial: Sonda = (ctx) => {
     totalBlobs++;
     const sha = m[1] as string;
     const tam = Number(m[2]);
+    // `rev-list --objects` da UNA ruta por blob (la primera que vio): no sirve para descartarlo,
+    // porque el mismo contenido puede estar tambien en otra ruta. Se mira todo.
     const ruta = rutaDe.get(sha) ?? '';
-    if (ruta !== '' && estaExcluido(ruta)) {
-      enExcluidas++;
-      continue;
-    }
     if (tam === 0) continue;
     if (tam > ctx.opciones.maxBytesFichero) {
       grandes++;
@@ -579,16 +688,22 @@ export const sondaSecretosHistorial: Sonda = (ctx) => {
       const datos = buf.subarray(finLinea + 1, finLinea + 1 + tam);
       pos = finLinea + 1 + tam + 1;
       escaneados++;
-      if (esBinario(datos)) {
+      const contenido = decodificar(datos);
+      if (contenido === null) {
         binarios++;
         continue;
       }
-      for (const h of buscarSecretos(datos.toString('utf8'))) {
+      for (const h of buscarSecretos(contenido)) {
         if (h.clase !== 'secreto') continue;
-        if (hallazgos.length < MAX_HALLAZGOS) hallazgos.push({ sha: c.sha, ruta: c.ruta, patron: h.patron, linea: h.linea, muestra: h.muestra });
+        if (hallazgos.length < MAX_HALLAZGOS) {
+          hallazgos.push({ sha: c.sha, ruta: c.ruta, patron: h.patron, linea: h.linea, muestra: h.muestra, huella: h.huella });
+        }
       }
     }
   }
+  if (cortado === null && escaneados < aEscanear.length) {
+    cortado = `la salida de git cat-file --batch no se pudo leer entera: se miraron ${escaneados} de ${aEscanear.length} ficheros`;
+  }
 
   // 4. En que commits y rutas aparecio cada blob con hallazgo (solo para esos).
   const aparicionesDe = new Map<string, Aparicion[] | null>();
@@ -603,12 +718,17 @@ export const sondaSecretosHistorial: Sonda = (ctx) => {
         : todas.slice(0, MAX_APARICIONES_POR_BLOB);
     const sinCitar = todas === null ? 0 : Math.max(0, todas.length - citadas.length);
     for (const ap of citadas) {
-      const s = buscarSilencio(ctx, h.patron, ap.ruta, ap.commit ?? null);
+      const s = ap.commit === undefined ? null : buscarSilencio(ctx, h.patron, ap.ruta, { commit: ap.commit, huella: h.huella });
       if (s !== null) {
         silenciadas.push(evidenciaSilenciada(s, h.patron, ap.ruta, h.linea, ap.commit));
         continue;
       }
-      const e: Evidencia = { descripcion: `clave secreta en el historial (patron ${h.patron})`, fichero: ap.ruta, linea: h.linea, muestra: h.muestra };
+      const e: Evidencia = {
+        descripcion: `clave secreta en el historial (patron ${h.patron}, huella ${h.huella})`,
+        fichero: ap.ruta,
+        linea: h.linea,
+        muestra: h.muestra,
+      };
       if (ap.commit !== undefined) e.commit = ap.commit;
       else e.descripcion += '; no se pudo localizar el commit con git log --find-object';
       if (sinCitar > 0) e.descripcion += `; el mismo contenido aparece en ${sinCitar} commit(s) mas`;
@@ -619,7 +739,7 @@ export const sondaSecretosHistorial: Sonda = (ctx) => {
   // 5. Opcional: gitleaks.
   const gl = complementoGitleaks(ctx);
   for (const g of gl.hallazgos) {
-    const s = buscarSilencio(ctx, `gitleaks:${g.regla}`, g.ruta, g.commit === '' ? null : g.commit);
+    const s = g.commit === '' ? null : buscarSilencio(ctx, `gitleaks:${g.regla}`, g.ruta, { commit: g.commit });
     if (s !== null) silenciadas.push(evidenciaSilenciada(s, `gitleaks:${g.regla}`, g.ruta, g.linea, g.commit));
     else {
       const e: Evidencia = { descripcion: `hallazgo de gitleaks (regla ${g.regla})`, fichero: g.ruta, linea: g.linea };
@@ -632,9 +752,9 @@ export const sondaSecretosHistorial: Sonda = (ctx) => {
     { descripcion: `refs recorridos: ${refs}` },
     {
       descripcion:
-        `${escaneados} ficheros distintos de texto o binarios leidos (de ${totalBlobs} en el historial); ` +
-        `${binarios} binarios y ${grandes} mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB saltados, ` +
-        `${enExcluidas} en node_modules, vendor, target, dist o build excluidos; ${IDS_PATRON.length} patrones`,
+        `${escaneados} ficheros distintos leidos (de ${totalBlobs} en el historial, todas las rutas, sin excluir carpetas); ` +
+        `${binarios} binarios saltados y ${grandes} mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB sin leer; ` +
+        `${IDS_PATRON.length} patrones; ${silenciadas.length} hallazgos silenciados`,
     },
     gl.nota,
   ];
@@ -655,6 +775,15 @@ export const sondaSecretosHistorial: Sonda = (ctx) => {
       evidencias: [...silenciadas, ...alcance],
     };
   }
+  if (grandes > 0) {
+    return {
+      estado: 'no-verificado',
+      motivo:
+        `${grandes} fichero(s) del historial mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB no se leyeron: ` +
+        'no se puede afirmar que no tengan claves. Revisalos a mano o con gitleaks',
+      evidencias: [...silenciadas, ...alcance],
+    };
+  }
   return {
     estado: 'ok',
     motivo: 'ninguna clave secreta en el historial de git',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
index 6209d11..792a8ab 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
@@ -10,7 +10,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
+import { appendFile, chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { pathToFileURL } from 'node:url';
@@ -24,7 +24,7 @@ import {
 } from '../../src/commands/doctor-deploy.js';
 import { DoctorDeployCatalogoError, cargarCatalogoDeploy } from '../../src/core/doctor-deploy-catalogo.js';
 import type { InformeDeploy, ResultadoPunto } from '../../src/core/doctor-deploy.js';
-import { motivoFicheroSecreto } from '../../src/fs/sondas-deploy.js';
+import { motivoFicheroSecreto, requirementsFijado } from '../../src/fs/sondas-deploy.js';
 
 const TOTAL_PUNTOS = cargarCatalogoDeploy().puntos.length;
 
@@ -244,21 +244,23 @@ test('tipos: Java, .NET, Go, PHP, Ruby, Docker y frontend se detectan por sus ma
   );
 });
 
-test('node_modules, vendor, target, dist y build no se escanean ni detectan', async () => {
+test('node_modules, vendor, target, dist y build no se detectan como tipos (ni se escanean si no estan versionados)', async () => {
   await conRepo(
     {
       ...NODE,
-      'node_modules/dep/package.json': '{}\n',
-      'node_modules/dep/leak.js': `const k = "${STRIPE}";\n`,
+      '.gitignore': 'node_modules/\ndist/\ntarget/\n.env\n',
       'vendor/x/Gemfile': '\n',
-      'dist/app.js': `const k = "${AWS}";\n`,
-      'target/debug/x.env': `K=${STRIPE}\n`,
     },
     async (raiz, opciones) => {
+      await escribir(raiz, {
+        'node_modules/dep/package.json': '{}\n',
+        'node_modules/dep/leak.js': `const k = "${STRIPE}";\n`,
+        'dist/app.js': `const k = "${AWS}";\n`,
+        'target/debug/x.env': `K=${STRIPE}\n`,
+      });
       const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
       assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
       assert.ok(!informe.tipos.some((t) => t.id === 'ruby'));
-      // Tampoco en el historial.
       assert.equal(punto(informe, 'secretos-en-historial').estado, 'ok');
     }
   );
@@ -585,7 +587,7 @@ test('capa: silenciar un hallazgo concreto lo saca de la cuenta, con su motivo e
       '.taskcode/doctor-deploy.yml':
         `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_commit: "${hash.slice(0, 10)}"\n` +
         'silenciar_1_motivo: Clave rotada el 2026-10-01\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n' +
-        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: no/existe.env\nsilenciar_2_motivo: Por si acaso\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
+        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: no/existe.env\nsilenciar_2_commit: "0000000"\nsilenciar_2_motivo: Por si acaso\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
     });
     const r = ejecutar(raiz, opciones);
     const con = JSON.parse(r.salida) as InformeDeploy;
@@ -603,8 +605,8 @@ test('capa: silenciar un hallazgo concreto lo saca de la cuenta, con su motivo e
     // Silenciando tambien el segundo, el punto queda en OK y la salida es 0.
     await writeFile(
       path.join(raiz, '.taskcode/doctor-deploy.yml'),
-      'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n' +
-        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: nuevo/prod.env\nsilenciar_2_motivo: Rotada\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
+      'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_commit: "' + hash + '"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n' +
+        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: nuevo/prod.env\nsilenciar_2_commit: "' + hash + '"\nsilenciar_2_motivo: Rotada\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
       'utf8'
     );
     const todo = ejecutar(raiz, opciones);
@@ -723,13 +725,12 @@ test('--escribir: informe con commit, rama, tipos y una fila por punto; sin comm
     assert.equal(git(['rev-list', '--count', 'HEAD'], raiz), commitsAntes);
     assert.equal(git(['status', '--porcelain'], raiz), '?? docs/');
 
-    // Segunda ejecucion el mismo dia: otro fichero, el primero intacto; ahora el arbol esta sucio y lo dice.
+    // Segunda ejecucion el mismo dia: otro fichero y el primero intacto.
     const r2 = ejecutar(raiz, opciones, ['--escribir'], dia);
     assert.equal(path.basename(r2.rutaInforme as string), '2026-10-27-2.md');
     assert.equal(await readFile(r1.rutaInforme as string, 'utf8'), md);
     const md2 = await readFile(r2.rutaInforme as string, 'utf8');
-    assert.match(md2, /- Arbol de trabajo: SUCIO/);
-    assert.ok(r2.informe.arbolSucio);
+    assert.match(md2, /- Arbol de trabajo: limpio/, 'el informe anterior no ensucia el siguiente (MEN-3)');
 
     // Sin restos temporales.
     const restos = (await readdir(path.join(raiz, 'docs', 'doctor-deploy'))).filter((f) => !f.endsWith('.md'));
@@ -768,3 +769,289 @@ test('herramientas ausentes con PATH controlado: NO VERIFICADO diciendo cual fal
     }
   );
 });
+
+// ---------------------------------------------------------------------
+// Revision por pares, ronda 1 (IMP-1 a IMP-6 y MENOR)
+// ---------------------------------------------------------------------
+
+function utf16le(texto: string): Buffer {
+  return Buffer.from(`﻿${texto}`, 'utf16le');
+}
+
+function utf16be(texto: string): Buffer {
+  const sinBom = Buffer.from(texto, 'utf16le').swap16();
+  return Buffer.concat([Buffer.from([0xfe, 0xff]), sinBom]);
+}
+
+/** Escribe ficheros binarios (Buffer) y los versiona a la fuerza. */
+async function escribirBin(raiz: string, rel: string, datos: Buffer): Promise<void> {
+  const abs = path.join(raiz, rel);
+  await mkdir(path.dirname(abs), { recursive: true });
+  await writeFile(abs, datos);
+}
+
+const huellaDeEvidencia = (p: ResultadoPunto): string => {
+  const m = /huella ([0-9a-f]{12})/.exec(p.evidencias.map((e) => e.descripcion).join('\n'));
+  assert.ok(m !== null, 'la evidencia no lleva la huella');
+  return m[1] as string;
+};
+
+test('IMP-1: .env y claves versionados bajo build/, dist/, vendor/, target/ y node_modules/ son FALLA', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    for (const rel of ['build/.env', 'vendor/.env', 'dist/id_rsa', 'target/app.p12', 'node_modules/x/.env']) {
+      await escribir(raiz, { [rel]: 'x\n' });
+    }
+    git(['add', '-f', '.'], raiz);
+    await commit(raiz, 'ficheros de secretos en carpetas de build');
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'ficheros-secretos-versionados');
+    assert.equal(p.estado, 'falla');
+    assert.deepEqual(p.evidencias.map((e) => e.fichero).sort(), ['build/.env', 'dist/id_rsa', 'node_modules/x/.env', 'target/app.p12', 'vendor/.env']);
+  });
+});
+
+test('IMP-2: una clave en un fichero VERSIONADO de build/, dist/, vendor/ o target/ falla en el arbol y en el historial', async () => {
+  await conRepo({ ...NODE, 'src/c.js': `const k = "${STRIPE}";\n` }, async (raiz, opciones) => {
+    git(['mv', 'src/c.js', 'src/d.js'], raiz);
+    await commit(raiz, 'renombra');
+    await mkdir(path.join(raiz, 'build'), { recursive: true });
+    git(['mv', 'src/d.js', 'build/c.js'], raiz); // el blob ahora vive en build/ (su ruta mas reciente)
+    await commit(raiz, 'a build');
+    await escribir(raiz, { 'dist/bundle.js': `x="${AWS}";\n`, 'vendor/v.env': `K=${STRIPE}x\n`, 'target/t.txt': `K=${STRIPE}y\n` });
+    git(['add', '-f', '.'], raiz);
+    await commit(raiz, 'bundles versionados');
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    const ficheros = (id: string): string[] => punto(informe, id).evidencias.filter((e) => e.muestra !== undefined).map((e) => e.fichero as string);
+    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'falla');
+    assert.ok(ficheros('secretos-en-arbol').includes('build/c.js'));
+    assert.ok(ficheros('secretos-en-arbol').includes('dist/bundle.js'));
+    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
+    assert.ok(ficheros('secretos-en-historial').includes('src/c.js'), 'el historial cita la ruta por la que entro');
+    assert.ok(ficheros('secretos-en-historial').includes('dist/bundle.js'));
+    // Y dice cuantos versionados en carpetas excluidas se incluyeron.
+    assert.match(punto(informe, 'secretos-en-arbol').evidencias.map((e) => e.descripcion).join('\n'), /[1-9]\d* versionados dentro de node_modules, vendor, target, dist o build incluidos/);
+  });
+});
+
+test('IMP-2: lo que NO esta versionado en node_modules/dist se sigue sin escanear', async () => {
+  await conRepo({ ...NODE, '.gitignore': 'node_modules/\ndist/\n.env\n' }, async (raiz, opciones) => {
+    await escribir(raiz, { 'node_modules/dep/leak.js': `k="${STRIPE}"\n`, 'dist/app.js': `k="${AWS}"\n` });
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
+  });
+});
+
+for (const [nombre, codificar] of [['UTF-16LE con BOM', utf16le], ['UTF-16BE con BOM', utf16be]] as const) {
+  test(`IMP-3: un fichero ${nombre} se decodifica y se escanea (arbol e historial)`, async () => {
+    await conRepo(NODE, async (raiz, opciones) => {
+      await escribirBin(raiz, 'cfg.txt', codificar(`# config\nSTRIPE=${STRIPE}\n`));
+      await commit(raiz, 'config en utf-16');
+      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+      for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
+        const p = punto(informe, id);
+        assert.equal(p.estado, 'falla', `${id}: ${p.motivo}`);
+        assert.equal(p.evidencias[0]?.fichero, 'cfg.txt');
+        assert.equal(p.evidencias[0]?.linea, 2);
+      }
+    });
+  });
+}
+
+test('IMP-3: los binarios saltados se cuentan siempre, en el arbol y en el historial', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribirBin(raiz, 'logo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 1, 2, 3]));
+    await commit(raiz, 'imagen');
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
+      const p = punto(informe, id);
+      assert.equal(p.estado, 'ok', id);
+      assert.match(p.evidencias.map((e) => e.descripcion).join('\n'), /1 binarios saltados/, id);
+    }
+  });
+});
+
+test('IMP-4: un silencio de arbol va atado a la huella del valor: otra clave nueva en el mismo fichero sigue fallando', async () => {
+  await conRepo({ ...NODE, 'config/prod.env.js': `module.exports = { k: "${STRIPE}" };\n` }, async (raiz, opciones) => {
+    const huella = huellaDeEvidencia(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol'));
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: config/prod.env.js\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: Clave de prueba\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
+    });
+    const silenciado = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol');
+    assert.equal(silenciado.estado, 'ok');
+    assert.match(silenciado.evidencias.map((e) => e.descripcion).join('\n'), /1 hallazgos silenciados/);
+    assert.ok(silenciado.evidencias.some((e) => e.descripcion.startsWith('SILENCIADO')));
+
+    // Una clave NUEVA del mismo patron en el MISMO fichero no queda tapada.
+    await escribir(raiz, { 'config/prod.env.js': `module.exports = { k: "${STRIPE}", otra: "sk_live_Nueva0Clave1Dist" };\n` });
+    const nueva = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol');
+    assert.equal(nueva.estado, 'falla');
+    assert.equal(nueva.evidencias.filter((e) => e.muestra !== undefined).length, 1);
+    assert.notEqual(huellaDeEvidencia(nueva), huella);
+  });
+});
+
+test('IMP-4: sin commit, un silencio de arbol no tapa un hallazgo del historial; con commit y huella, si', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { 'viejo.env': `K=${STRIPE}\n` });
+    git(['add', '-f', '.'], raiz);
+    const hash = await commit(raiz, 'env');
+    git(['rm', '-q', 'viejo.env'], raiz);
+    await commit(raiz, 'quita');
+    const h = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
+    assert.equal(h.estado, 'falla');
+    const huella = huellaDeEvidencia(h);
+    const base = `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo.env\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`;
+    await escribir(raiz, { '.taskcode/doctor-deploy.yml': base });
+    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial').estado, 'falla');
+    await escribir(raiz, { '.taskcode/doctor-deploy.yml': `${base}silenciar_1_commit: "${hash}"\n` });
+    const ok = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
+    assert.equal(ok.estado, 'ok');
+    assert.match(ok.evidencias.map((e) => e.descripcion).join('\n'), /1 hallazgos silenciados/);
+    // Con la huella de otro valor, no tapa.
+    await escribir(raiz, { '.taskcode/doctor-deploy.yml': `${base.replace(huella, '000000000000')}silenciar_1_commit: "${hash}"\n` });
+    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial').estado, 'falla');
+  });
+});
+
+test('IMP-5: una regla negada (!.env) que gana deja .env sin ignorar: FALLA', async () => {
+  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n.env\n!.env\n' }, async (raiz, opciones) => {
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
+    assert.equal(p.estado, 'falla');
+    assert.match(p.evidencias[0]?.descripcion ?? '', /REINCLUYE/);
+    assert.equal(p.evidencias[0]?.linea, 3);
+  });
+});
+
+test('IMP-6 (M8): una regla que solo esta en .git/info/exclude no cuenta como cubierta', async () => {
+  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n' }, async (raiz, opciones) => {
+    await appendFile(path.join(raiz, '.git', 'info', 'exclude'), '.env\n');
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
+    assert.equal(p.estado, 'falla');
+    assert.match(p.motivo, /regla local que no se versiona/);
+  });
+});
+
+test('IMP-6 (M8): una regla que solo esta en el excludesFile global no cuenta como cubierta', async () => {
+  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n' }, async (raiz, opciones) => {
+    const global = path.join(path.dirname(raiz), `${path.basename(raiz)}-global-ignore`);
+    await writeFile(global, '.env\n', 'utf8');
+    try {
+      git(['config', 'core.excludesFile', global], raiz);
+      const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
+      assert.equal(p.estado, 'falla');
+      assert.match(p.motivo, /regla local que no se versiona/);
+    } finally {
+      await rm(global, { force: true });
+    }
+  });
+});
+
+test('IMP-6 (M12): si git rev-list falla, el historial es NO VERIFICADO (nunca OK ni excepcion)', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    const arbol = git(['rev-parse', 'HEAD^{tree}'], raiz);
+    const objeto = path.join(raiz, '.git', 'objects', arbol.slice(0, 2), arbol.slice(2));
+    await chmod(objeto, 0o666);
+    await rm(objeto, { force: true });
+    const r = ejecutar(raiz, opciones);
+    const p = punto(JSON.parse(r.salida) as InformeDeploy, 'secretos-en-historial');
+    assert.equal(p.estado, 'no-verificado');
+    assert.match(p.motivo, /rev-list --all --objects no termino/);
+  });
+});
+
+test('IMP-6 (M16): un secreto solo en una rama distinta de HEAD, o solo en una etiqueta, se detecta', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    git(['checkout', '-q', '-b', 'otra'], raiz);
+    await escribir(raiz, { 'rama.env': `K=${STRIPE}\n` });
+    git(['add', '-f', '.'], raiz);
+    const enRama = await commit(raiz, 'en la rama');
+    git(['checkout', '-q', 'main'], raiz);
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
+    assert.equal(p.estado, 'falla');
+    assert.equal(p.evidencias.find((e) => e.muestra !== undefined)?.commit, enRama);
+    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol').estado, 'ok');
+  });
+  await conRepo(NODE, async (raiz, opciones) => {
+    git(['checkout', '-q', '-b', 'temporal'], raiz);
+    await escribir(raiz, { 'etiqueta.env': `K=${STRIPE}\n` });
+    git(['add', '-f', '.'], raiz);
+    const enTag = await commit(raiz, 'solo en la etiqueta');
+    git(['tag', 'v1'], raiz);
+    git(['checkout', '-q', 'main'], raiz);
+    git(['branch', '-D', 'temporal'], raiz);
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
+    assert.equal(p.estado, 'falla');
+    assert.equal(p.evidencias.find((e) => e.muestra !== undefined)?.commit, enTag);
+  });
+});
+
+test('MEN-1: un fichero de texto mayor que el limite deja el punto NO VERIFICADO (arbol e historial); un binario grande no', async () => {
+  await conRepo({ ...NODE, 'bundle.js': `${'a'.repeat(400)}\n` }, async (raiz, opciones) => {
+    const informe = JSON.parse(ejecutar(raiz, { ...opciones, maxBytesFichero: 100 }).salida) as InformeDeploy;
+    for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
+      const p = punto(informe, id);
+      assert.equal(p.estado, 'no-verificado', id);
+      assert.match(p.motivo, /mayores de/, id);
+    }
+    // Con el limite por defecto, OK.
+    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol').estado, 'ok');
+  });
+  await conRepo({ ...NODE }, async (raiz, opciones) => {
+    await escribirBin(raiz, 'big.bin', Buffer.concat([Buffer.from([0, 1, 2]), Buffer.alloc(400, 7)]));
+    await commit(raiz, 'binario grande');
+    const arbol = punto(JSON.parse(ejecutar(raiz, { ...opciones, maxBytesFichero: 100 }).salida) as InformeDeploy, 'secretos-en-arbol');
+    assert.equal(arbol.estado, 'ok');
+    assert.match(arbol.evidencias.map((e) => e.descripcion).join('\n'), /1 binarios saltados/);
+  });
+});
+
+test('MEN-2: una ruta no ASCII en el historial sale tal cual y se puede silenciar por su nombre', async () => {
+  const nombre = 'contraseña.js';
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { [nombre]: `k="${STRIPE}"\n` });
+    const hash = await commit(raiz, 'con enie');
+    git(['rm', '-q', nombre], raiz);
+    await commit(raiz, 'quita');
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
+    assert.equal(p.estado, 'falla');
+    assert.equal(p.evidencias.find((e) => e.muestra !== undefined)?.fichero, nombre);
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: ${nombre}\nsilenciar_1_commit: "${hash}"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
+    });
+    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial').estado, 'ok');
+  });
+});
+
+test('MEN-3: los informes de --escribir no ensucian el arbol del siguiente informe; otro fichero sin commitear si', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    const dia = new Date(2026, 9, 27, 12, 0, 0);
+    ejecutar(raiz, opciones, ['--escribir'], dia);
+    const r2 = ejecutar(raiz, opciones, ['--escribir'], dia);
+    assert.equal(r2.informe.arbolSucio, false);
+    assert.match(await readFile(r2.rutaInforme as string, 'utf8'), /- Arbol de trabajo: limpio/);
+    await escribir(raiz, { 'otro.txt': 'x\n' });
+    assert.equal(ejecutar(raiz, opciones).informe.arbolSucio, true);
+  });
+});
+
+test('MEN-4: un requirements.txt sin versiones fijadas con == no cuenta como lockfile', async () => {
+  await conRepo({ ...PYTHON, 'requirements.txt': 'flask>=3.0\nrequests\n' }, async (raiz, opciones) => {
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
+    assert.equal(p.estado, 'falla');
+    assert.match(p.evidencias[0]?.descripcion ?? '', /todo fijado con ==/);
+  });
+  assert.equal(requirementsFijado('# deps\nflask==3.0.0\n-r otro.txt\nrequests==2.31.0 \\\n'), true);
+  assert.equal(requirementsFijado('flask==3.0.0\nrequests\n'), false);
+  assert.equal(requirementsFijado('# solo comentarios\n'), false);
+});
+
+test('MEN-5: si no se puede escribir el informe, el analisis se imprime igualmente y se avisa', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await mkdir(path.join(raiz, 'docs'), { recursive: true });
+    await writeFile(path.join(raiz, 'docs', 'doctor-deploy'), 'soy un fichero\n', 'utf8');
+    const r = ejecutar(raiz, opciones, ['--json', '--escribir']);
+    assert.equal(r.rutaInforme, null);
+    assert.match(r.mensajeEscritura, /\[AVISO\] No se pudo escribir el informe/);
+    assert.equal(JSON.parse(r.salida).puntos.length, TOTAL_PUNTOS);
+    assert.equal(r.codigo, 0);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
index f5385aa..bb7f4f9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
@@ -254,12 +254,25 @@ test('capa: un silencio lleva patron, fichero, motivo, quien y fecha; commit es
     patron: 'stripe-live',
     fichero: 'config/prod.env',
     commit: 'abcdef1',
+    huella: null,
     motivo: 'Rotada el 2026-10-01',
     quien: 'carlos',
     fecha: '2026-10-27',
   });
-  const sinCommit = parsearCapaProyecto(SILENCIO.replace(/silenciar_1_commit.*\n/, ''), 'p.yml', baseConDos);
+  // Sin commit solo vale para el arbol, y entonces exige la huella del valor.
+  const sinCommit = parsearCapaProyecto(SILENCIO.replace(/silenciar_1_commit.*\n/, 'silenciar_1_huella: AB12cd34ef56\n'), 'p.yml', baseConDos);
   assert.equal(sinCommit.silencios[0]?.commit, null);
+  assert.equal(sinCommit.silencios[0]?.huella, 'ab12cd34ef56');
+  assert.match(
+    errorDe(() => parsearCapaProyecto(SILENCIO.replace(/silenciar_1_commit.*\n/, ''), 'p.yml', baseConDos)),
+    /exige "silenciar_1_commit" .* o "silenciar_1_huella"/
+  );
+  // Un fichero-secreto (sin valor) no tiene huella: vale sin commit.
+  assert.equal(
+    parsearCapaProyecto(SILENCIO.replace(/silenciar_1_commit.*\n/, '').replace('stripe-live', 'fichero-secreto'), 'p.yml', baseConDos).silencios.length,
+    1
+  );
+  assert.match(errorDe(() => parsearCapaProyecto(SILENCIO + 'silenciar_1_huella: zz\n', 'p.yml', baseConDos)), /silenciar_1_huella/);
 });
 
 test('capa: un silencio sin motivo, sin quien, con fecha mala o con commit mal formado aborta', () => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy.test.ts
new file mode 100644
index 0000000..cd0c3be
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy.test.ts
@@ -0,0 +1,47 @@
+/**
+ * TASK-066 (MEN-6): el nucleo puro de doctor-deploy. `sanearPunto` es la red
+ * del invariante «ningun OK sin evidencia»: hoy ninguna sonda devuelve un OK
+ * vacio, asi que solo un test directo la mantiene viva.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { codigoSalida, resumir, sanearPunto, type ResultadoPunto } from '../../src/core/doctor-deploy.js';
+
+function punto(parcial: Partial<ResultadoPunto>): ResultadoPunto {
+  return {
+    id: 'p',
+    severidad: 'alta',
+    metodo: 'determinista',
+    arreglo: 'arreglalo',
+    descripcion: 'descripcion',
+    referencia: null,
+    desactivado: false,
+    estado: 'ok',
+    motivo: 'todo bien',
+    evidencias: [],
+    ...parcial,
+  };
+}
+
+test('sanearPunto: un OK sin evidencia se degrada a NO VERIFICADO y lo dice', () => {
+  const r = sanearPunto(punto({ estado: 'ok', evidencias: [] }));
+  assert.equal(r.estado, 'no-verificado');
+  assert.match(r.motivo, /no aporto evidencia/);
+  assert.match(r.motivo, /todo bien/);
+});
+
+test('sanearPunto: un OK con evidencia, y los demas estados, quedan como estan', () => {
+  const ok = punto({ estado: 'ok', evidencias: [{ descripcion: 'visto' }] });
+  assert.deepEqual(sanearPunto(ok), ok);
+  for (const estado of ['falla', 'no-verificado', 'no-aplica'] as const) {
+    const p = punto({ estado });
+    assert.deepEqual(sanearPunto(p), p);
+  }
+});
+
+test('codigoSalida: 1 solo con alguna FALLA; resumir cuenta cada estado', () => {
+  const ps = [punto({ estado: 'ok', evidencias: [{ descripcion: 'x' }] }), punto({ estado: 'no-verificado' }), punto({ estado: 'no-aplica' })];
+  assert.equal(codigoSalida(ps), 0);
+  assert.equal(codigoSalida([...ps, punto({ estado: 'falla' })]), 1);
+  assert.deepEqual(resumir([...ps, punto({ estado: 'falla' })]), { ok: 1, falla: 1, noVerificado: 1, noAplica: 1, total: 4 });
+});
````

## Excluido del diff (18 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 92422185bf17c7de4d5985648e803f3f44e34442..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/peticion-brainstorm-dominio-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/salida-brainstorm-dominio-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/brainstorm/salida-brainstorm-testing-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-066/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-066/revision/informe-revision-1.md                                                  |  104 ++
 tareas/03-en-revision/TASK-066/revision/peticion-revision-1.md                                                 | 4564 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-066/tarea.md                                                       |    9 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy.js                                |   27 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-catalogo.js                           |   21 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/secretos.js                                         |    7 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/deteccion-app.js                                      |    3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-deploy.js                                      |  193 +++-
 18 files changed, 4877 insertions(+), 51 deletions(-)
````
