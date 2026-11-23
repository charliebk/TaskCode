# Peticion de revision — TASK-148b (ronda 1)

- Tarea: TASK-148b — validacion de config (parte b de TASK-148)
- Rama revisada: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
- Rama base: develop
- Commit revisado (HEAD): 45857fa794e615825c537cb5b081a46c65387be4
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-148b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-148b/tarea.md
- tareas/03-en-revision/TASK-148b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/ruta-relativa.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/config-validacion-comun.test.ts

## Commits a revisar (git log develop..HEAD)

````
45857fa chore(TASK-148b): autorrevision
d542a84 fix(TASK-148b): validacion de config con una regla por cosa
83027cb chore(TASK-148b): tarea en curso
b8c3abd merge(TASK-148b): develop en fix/task-148-regla-4d-catalogos-config-y-utilidades-e para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index f4f7254..d1f63aa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -128,7 +128,8 @@ import { existsSync, readFileSync, statSync } from 'node:fs';
 import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
 import { describirValor } from './campos-catalogo.js';
-import { distanciaEdicion, masParecida } from './sugerencia.js';
+import { problemaDeRutaRelativa } from './ruta-relativa.js';
+import { masParecida } from './sugerencia.js';
 import { normalizarBase, type Plataforma } from './plataforma-remota.js';
 import { STATE_FOLDER } from './task.js';
 
@@ -753,24 +754,25 @@ export function parsearConfigConAvisos(
         );
         break;
       case 'tareas_entre_podas':
-        if (typeof par.valor !== 'number' || !Number.isInteger(par.valor) || par.valor < 1) {
-          throw new ConfigError(
-            `[ERROR] ${donde}: "tareas_entre_podas" debe ser un numero entero mayor o igual que 1, y es ` +
-              `${describirValor(par.valor)}.\n        Por defecto es 30: tareas terminadas desde la ultima poda de ` +
-              'tests a partir de las que doctor propone otra.'
-          );
-        }
-        config.tareas_entre_podas = par.valor;
+        config.tareas_entre_podas = validarEnteroEnRango(
+          donde,
+          'tareas_entre_podas',
+          par.valor,
+          1,
+          null,
+          'Por defecto es 30: tareas terminadas desde la ultima poda de tests a partir de las que doctor propone otra.'
+        );
         break;
       case 'umbral_crecimiento_suite':
-        if (typeof par.valor !== 'number' || !Number.isInteger(par.valor) || par.valor < 1 || par.valor > 1000) {
-          throw new ConfigError(
-            `[ERROR] ${donde}: "umbral_crecimiento_suite" debe ser un porcentaje entero de 1 a 1000, y es ` +
-              `${describirValor(par.valor)}.\n        Por defecto es 20: doctor avisa si los tests o la duracion de ` +
-              'la verificacion completa crecen mas de ese porcentaje entre dos versiones.'
-          );
-        }
-        config.umbral_crecimiento_suite = par.valor;
+        config.umbral_crecimiento_suite = validarEnteroEnRango(
+          donde,
+          'umbral_crecimiento_suite',
+          par.valor,
+          1,
+          1000,
+          'Es un porcentaje. Por defecto es 20: doctor avisa si los tests o la duracion de la verificacion completa ' +
+            'crecen mas de ese porcentaje entre dos versiones.'
+        );
         break;
       case 'verificacion_pesada_en':
         config.verificacion_pesada_en = validarVerificacionPesadaEn(donde, par.valor);
@@ -841,10 +843,7 @@ function validarRemotoCompleto(dondeUrlBase: string, config: TaskcodeConfig): vo
 function validarPlataformaRemota(donde: string, valor: unknown): Plataforma {
   const plataforma = validarTextoNoVacio(donde, 'plataforma_remota', valor);
   if ((PLATAFORMAS_REMOTAS as readonly string[]).includes(plataforma)) return plataforma as Plataforma;
-  const parecido = PLATAFORMAS_REMOTAS.map((p) => ({ p, d: distanciaEdicion(plataforma.toLowerCase(), p) }))
-    .sort((a, b) => a.d - b.d)[0];
-  const sugerencia =
-    parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.p}"?` : '';
+  const sugerencia = sugerenciaDeValor(plataforma, PLATAFORMAS_REMOTAS);
   throw new ConfigError(
     `[ERROR] ${donde}: plataforma_remota "${plataforma}" no es valida.${sugerencia}\n` +
       `        Valores validos: ${PLATAFORMAS_REMOTAS.join(', ')} (sin la clave, se decide por el host de origin).`
@@ -1136,11 +1135,11 @@ function validarPatronesExclusion(
       );
     }
     const conBarras = elemento.trim().replace(/\\/g, '/');
-    const absoluto = conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras);
-    if (absoluto || conBarras.split('/').includes('..')) {
+    const problema = problemaDeRutaRelativa(conBarras);
+    if (problema === 'absoluta' || problema === 'sale') {
       throw new ConfigError(
         `[ERROR] ${donde}: el patron "${elemento.trim()}" de "${clave}" no vale: ` +
-          `${absoluto ? 'es absoluto' : 'sale del repo con ".."'}.\n` +
+          `${problema === 'absoluta' ? 'es absoluto' : 'sale del repo con ".."'}.\n` +
           '        Los patrones son relativos a la raiz del repo y siguen la semantica de ' +
           'git :(glob) (por ejemplo **/dist/**).'
       );
@@ -1220,18 +1219,13 @@ function validarVerificacionPesadaEn(donde: string, valor: unknown): readonly Ti
         '        Ejemplo: verificacion_pesada_en: [release, hotfix]. Sin la clave, solo release.'
     );
   }
-  const tipos: TipoRamaPesada[] = [];
-  for (const elemento of valor) {
-    const tipo = typeof elemento === 'string' ? elemento.trim() : '';
-    if (!(TIPOS_RAMA_PESADA as readonly string[]).includes(tipo)) {
-      throw new ConfigError(
-        `[ERROR] ${donde}: "verificacion_pesada_en" contiene "${String(elemento)}", que no es un tipo de rama ` +
-          `que pueda exigir los pesados. Validos: ${TIPOS_RAMA_PESADA.join(', ')} (feature y fix nunca los corren).`
-      );
-    }
-    if (!tipos.includes(tipo as TipoRamaPesada)) tipos.push(tipo as TipoRamaPesada);
-  }
-  return tipos;
+  return elementosDeEnumerado(
+    donde,
+    'verificacion_pesada_en',
+    valor,
+    TIPOS_RAMA_PESADA,
+    `que no es un tipo de rama que pueda exigir los pesados. Validos: ${TIPOS_RAMA_PESADA.join(', ')} (feature y fix nunca los corren).`
+  );
 }
 
 function validarFasesSincronizacion(donde: string, valor: unknown): readonly FaseSincronizacion[] {
@@ -1244,18 +1238,13 @@ function validarFasesSincronizacion(donde: string, valor: unknown): readonly Fas
         'corre en todas las fases.'
     );
   }
-  const fases: FaseSincronizacion[] = [];
-  for (const elemento of valor) {
-    const fase = typeof elemento === 'string' ? elemento.trim() : '';
-    if (!(FASES_SINCRONIZACION as readonly string[]).includes(fase)) {
-      throw new ConfigError(
-        `[ERROR] ${donde}: "fases_sincronizacion" contiene "${String(elemento)}", que no es una fase. ` +
-          `Validas: ${FASES_SINCRONIZACION.join(', ')}.`
-      );
-    }
-    if (!fases.includes(fase as FaseSincronizacion)) fases.push(fase as FaseSincronizacion);
-  }
-  return fases;
+  return elementosDeEnumerado(
+    donde,
+    'fases_sincronizacion',
+    valor,
+    FASES_SINCRONIZACION,
+    `que no es una fase. Validas: ${FASES_SINCRONIZACION.join(', ')}.`
+  );
 }
 
 function validarRutasSincronizacion(donde: string, valor: unknown): readonly string[] {
@@ -1311,11 +1300,14 @@ function motivoRutaInvalida(
   opciones: { ficheroEnRaizDeTareas?: boolean } = {}
 ): string | null {
   const conBarras = original.replace(/\\/g, '/');
-  if (conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras)) return 'es absoluta';
+  // TASK-148b (CORE1-10): la regla comun (core/ruta-relativa.ts); se protege la forma normalizada.
+  const problema = problemaDeRutaRelativa(conBarras);
+  if (problema === 'absoluta') return 'es absoluta';
+  if (problema === 'sale') return 'se sale del repo';
+  if (problema === 'control') return 'lleva caracteres de control';
   if (conBarras.endsWith('/')) return 'es una carpeta';
   const normalizada = path.posix.normalize(conBarras);
   if (normalizada === '.' || normalizada === '') return 'es la raiz del repo';
-  if (normalizada === '..' || normalizada.startsWith('../')) return 'se sale del repo';
   const segmentos = normalizada.split('/');
   const primera = segmentos[0] as string;
   const primeraMin = nombreComparable(primera);
@@ -1400,50 +1392,89 @@ function validarEnteroPositivo(
   clave: 'limite_wip' | 'timeout_sincronizacion' | 'timeout_verificacion' | 'timeout_verificacion_selectiva',
   valor: unknown
 ): number {
-  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
-    const consecuencia =
-      clave === 'limite_wip'
-        ? 'Un 0 o un negativo no significan "sin limite": impedirian arrancar cualquier tarea.'
-        : clave === 'timeout_sincronizacion'
-          ? 'Son segundos: un 0 o un negativo matarian el comando antes de empezar.'
-          : 'Son segundos: un 0 o un negativo cortarian la verificacion antes de empezar.';
+  const consecuencia =
+    clave === 'limite_wip'
+      ? 'Un 0 o un negativo no significan "sin limite": impedirian arrancar cualquier tarea.'
+      : clave === 'timeout_sincronizacion'
+        ? 'Son segundos: un 0 o un negativo matarian el comando antes de empezar.'
+        : 'Son segundos: un 0 o un negativo cortarian la verificacion antes de empezar.';
+  return validarEnteroEnRango(donde, clave, valor, 1, null, `Por defecto es ${CONFIG_DEFAULTS[clave]}. ${consecuencia}`);
+}
+
+/** TASK-148b (CORE1-06): la sugerencia ante una errata en un enumerado, con masParecida (la de las claves). */
+function sugerenciaDeValor(valor: string, validos: readonly string[]): string {
+  const s = masParecida(valor, validos);
+  return s === null ? '' : ` ¿Querias decir "${s}"?`;
+}
+
+/** TASK-148b (CORE1-07): entero de `min` a `max` (null: sin tope), o ConfigError con el porque en la segunda linea. */
+function validarEnteroEnRango(
+  donde: string,
+  clave: string,
+  valor: unknown,
+  min: number,
+  max: number | null,
+  porque: string
+): number {
+  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < min || (max !== null && valor > max)) {
+    const rango = max === null ? `mayor o igual que ${String(min)}` : `de ${String(min)} a ${String(max)}`;
     throw new ConfigError(
-      `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 1, ` +
-        `y es ${describirValor(valor)}.\n` +
-        `        Por defecto es ${CONFIG_DEFAULTS[clave]}. ${consecuencia}`
+      `[ERROR] ${donde}: "${clave}" debe ser un numero entero ${rango}, y es ${describirValor(valor)}.\n        ${porque}`
     );
   }
   return valor;
 }
 
+/**
+ * TASK-148b (CORE1-07): los elementos de una lista ya comprobada como no vacia,
+ * todos de `validos` (recortados); un repetido se queda una vez. `queNoEs`
+ * completa «contiene "x", ...».
+ */
+function elementosDeEnumerado<T extends string>(
+  donde: string,
+  clave: string,
+  valor: readonly unknown[],
+  validos: readonly T[],
+  queNoEs: string
+): readonly T[] {
+  const r: T[] = [];
+  for (const elemento of valor) {
+    const t = typeof elemento === 'string' ? elemento.trim() : '';
+    if (!(validos as readonly string[]).includes(t)) {
+      throw new ConfigError(`[ERROR] ${donde}: "${clave}" contiene "${String(elemento)}", ${queNoEs}`);
+    }
+    if (!r.includes(t as T)) r.push(t as T);
+  }
+  return r;
+}
+
 /** TASK-127: entero de 1 a 10. Mas de 10 rondas es no tener tope. */
 export const TOPE_RONDAS_MAXIMO = 10;
 
 function validarTopeRondas(donde: string, valor: unknown): number {
-  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1 || valor > TOPE_RONDAS_MAXIMO) {
-    throw new ConfigError(
-      `[ERROR] ${donde}: "tope_rondas" debe ser un numero entero de 1 a ${String(TOPE_RONDAS_MAXIMO)}, ` +
-        `y es ${describirValor(valor)}.
-` +
-        `        Por defecto es ${String(CONFIG_DEFAULTS.tope_rondas)}: las rondas de revision que se abren sin ` +
-        'preguntar; en la ultima, si pide cambios, decide una persona.'
-    );
-  }
-  return valor;
+  return validarEnteroEnRango(
+    donde,
+    'tope_rondas',
+    valor,
+    1,
+    TOPE_RONDAS_MAXIMO,
+    `Por defecto es ${String(CONFIG_DEFAULTS.tope_rondas)}: las rondas de revision que se abren sin preguntar; ` +
+      'en la ultima, si pide cambios, decide una persona.'
+  );
 }
 
 /** TASK-125: entero de 1 al `timeout` del hook Stop. */
 function validarPresupuestoFreno(donde: string, valor: unknown): number {
-  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1 || valor > TECHO_HOOK_STOP_S) {
-    throw new ConfigError(
-      `[ERROR] ${donde}: "presupuesto_freno_s" debe ser un numero entero de 1 a ${String(TECHO_HOOK_STOP_S)}, ` +
-        `y es ${describirValor(valor)}.\n` +
-        `        Son los segundos que puede tardar la verificacion del freno de fin de turno; no puede pasar del ` +
-        `timeout del hook Stop (${String(TECHO_HOOK_STOP_S)} s). Con comando_verificacion_freno y sin esta clave, ` +
-        `${String(PRESUPUESTO_FRENO_POR_DEFECTO_S)}.`
-    );
-  }
-  return valor;
+  return validarEnteroEnRango(
+    donde,
+    'presupuesto_freno_s',
+    valor,
+    1,
+    TECHO_HOOK_STOP_S,
+    'Son los segundos que puede tardar la verificacion del freno de fin de turno; no puede pasar del ' +
+      `timeout del hook Stop (${String(TECHO_HOOK_STOP_S)} s). Con comando_verificacion_freno y sin esta clave, ` +
+      `${String(PRESUPUESTO_FRENO_POR_DEFECTO_S)}.`
+  );
 }
 
 /**
@@ -1454,10 +1485,7 @@ function validarPresupuestoFreno(donde: string, valor: unknown): number {
 function validarModoFlujo(donde: string, valor: unknown): ModoFlujo {
   const modo = validarTextoNoVacio(donde, 'modo_flujo', valor);
   if ((MODOS_FLUJO as readonly string[]).includes(modo)) return modo as ModoFlujo;
-  const parecido = MODOS_FLUJO.map((m) => ({ m, d: distanciaEdicion(modo.toLowerCase(), m) }))
-    .sort((a, b) => a.d - b.d)[0];
-  const sugerencia =
-    parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.m}"?` : '';
+  const sugerencia = sugerenciaDeValor(modo, MODOS_FLUJO);
   throw new ConfigError(
     `[ERROR] ${donde}: modo_flujo "${modo}" no es valido.${sugerencia}\n` +
       `        Valores validos: ${MODOS_FLUJO.join(', ')} (sin la clave, manual).`
@@ -1473,10 +1501,7 @@ function validarModoFlujo(donde: string, valor: unknown): ModoFlujo {
 function validarCierrePorDefecto(donde: string, valor: unknown): CierrePorDefecto {
   const cierre = validarTextoNoVacio(donde, 'cierre_por_defecto', valor);
   if ((CIERRES_POR_DEFECTO as readonly string[]).includes(cierre)) return cierre as CierrePorDefecto;
-  const parecido = CIERRES_POR_DEFECTO.map((c) => ({ c, d: distanciaEdicion(cierre.toLowerCase(), c) }))
-    .sort((a, b) => a.d - b.d)[0];
-  const sugerencia =
-    parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.c}"?` : '';
+  const sugerencia = sugerenciaDeValor(cierre, CIERRES_POR_DEFECTO);
   throw new ConfigError(
     `[ERROR] ${donde}: cierre_por_defecto "${cierre}" no es valido.${sugerencia}
 ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts
index 2b58adf..8b6d225 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts
@@ -24,6 +24,7 @@
  */
 import { ocultarCredenciales } from './plataforma-remota.js';
 import { ocultarSecretos } from './secretos.js';
+import { problemaDeRutaRelativa } from './ruta-relativa.js';
 import type { Evidencia, ResultadoPunto } from './doctor-deploy.js';
 
 export class VeredictoFormatoError extends Error {
@@ -103,14 +104,15 @@ export function parsearResultado(texto: string): EntradaResultado {
  * rechazo. Relativa al repo, con `/` o `\`, sin `..`, sin unidad ni raiz, sin caracteres de control.
  */
 export function motivoRutaInvalida(ruta: string): string | null {
-  if (ruta.trim() === '') return 'el fichero esta vacio';
-  // eslint-disable-next-line no-control-regex
-  if (/[\u0000-\u001f\u007f]/.test(ruta)) return 'el fichero lleva caracteres de control';
-  if (ruta.startsWith('/') || ruta.startsWith('\\') || /^[A-Za-z]:/.test(ruta)) {
-    return 'el fichero es una ruta absoluta: debe ser relativa a la raiz del repositorio';
-  }
-  if (ruta.split(/[\\/]/).some((parte) => parte === '..')) return 'el fichero sale de la raiz del repositorio (".." no se admite)';
-  return null;
+  // TASK-148b (CORE1-10): la regla comun de core/ruta-relativa.ts, con el texto de las evidencias.
+  const MOTIVOS = {
+    vacia: 'el fichero esta vacio',
+    control: 'el fichero lleva caracteres de control',
+    absoluta: 'el fichero es una ruta absoluta: debe ser relativa a la raiz del repositorio',
+    sale: 'el fichero sale de la raiz del repositorio',
+  } as const;
+  const problema = problemaDeRutaRelativa(ruta);
+  return problema === null ? null : MOTIVOS[problema];
 }
 
 /** Comprueba fichero y linea contra el commit analizado: null si valen, o el motivo del rechazo. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/ruta-relativa.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/ruta-relativa.ts
new file mode 100644
index 0000000..f7f2119
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/ruta-relativa.ts
@@ -0,0 +1,31 @@
+/**
+ * TASK-148b (CORE1-10 de la auditoria 4D): la unica regla de «ruta relativa a
+ * la raiz del repo». Antes habia tres (config, sus patrones y los veredictos de
+ * doctor-deploy), dos con el mismo nombre y reglas distintas: `a/../b` pasaba en
+ * config (se normalizaba a `b`) y se rechazaba en los veredictos.
+ *
+ * Se queda la de config, la mas completa: la ruta se normaliza (separadores
+ * POSIX, `.` y `..` resueltos) y solo se rechaza si la forma normalizada sale
+ * del repo. Quien protege carpetas (config con `tareas/` y `.git/`) mira la
+ * forma normalizada, asi que `docs/../tareas/02-en-curso/x` no esquiva nada.
+ *
+ * Devuelve el problema, no el mensaje: cada llamador lo dice con su contexto.
+ */
+import path from 'node:path';
+
+export type ProblemaRuta = 'vacia' | 'control' | 'absoluta' | 'sale';
+
+/** La ruta con `/` y normalizada (`./a/../b` -> `b`). */
+export function normalizarRutaRelativa(ruta: string): string {
+  return path.posix.normalize(ruta.replace(/\\/g, '/'));
+}
+
+export function problemaDeRutaRelativa(ruta: string): ProblemaRuta | null {
+  if (ruta.trim() === '') return 'vacia';
+  // eslint-disable-next-line no-control-regex
+  if (/[\u0000-\u001f\u007f]/.test(ruta)) return 'control';
+  if (ruta.startsWith('/') || ruta.startsWith('\\') || /^[A-Za-z]:/.test(ruta)) return 'absoluta';
+  const normalizada = normalizarRutaRelativa(ruta);
+  if (normalizada === '..' || normalizada.startsWith('../')) return 'sale';
+  return null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
index 770222e..b55563a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
@@ -7,6 +7,7 @@
 import type { ComprobadorEvidencia } from '../core/doctor-deploy-veredictos.js';
 import { gitCrudo } from './git-crudo.js';
 import { decodificar } from './sondas-deploy.js';
+import { normalizarRutaRelativa } from '../core/ruta-relativa.js';
 
 const MAX_BYTES_FICHERO = 8 * 1024 * 1024;
 
@@ -24,7 +25,8 @@ export function contarLineas(texto: string): number {
 export function comprobadorEnCommit(raiz: string, commit: string): ComprobadorEvidencia {
   return (fichero, linea) => {
     // Normalizada con `/`; `./a` y `a` son el mismo fichero. Los `..` ya los rechazo quien llama.
-    const ruta = fichero.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '');
+    // TASK-148b (CORE1-10): la misma forma normalizada que valida motivoRutaInvalida (`./a/../b` es `b`).
+    const ruta = normalizarRutaRelativa(fichero);
     // El modo del arbol distingue un fichero normal de un enlace simbolico (120000) o un
     // submodulo (160000): `cat-file blob` devuelve el texto del enlace como si fuera el fichero
     // (MEN-2 de la ronda 1).
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-148b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148b/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148b/tarea.md                                                       |  10 +++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                          | 134 ++++++++++++++++++++++++++++++++++++----------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-veredictos.js                        |  21 +++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/ruta-relativa.js                                   |  31 +++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/evidencia-veredicto.js                               |   4 ++-
 13 files changed, 111 insertions(+), 89 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/config-validacion-comun.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/config-validacion-comun.test.ts | 53 +++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 53 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 220.6 s
- Commit verificado: 45857fa794e615825c537cb5b081a46c65387be4
- Huella: 691d54cd2ea9638a33101e45234a5ca7bcde5b4e
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 129378 bytes en total):

````
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.9103ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (15.3343ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (1.0729ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.9183ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.5242ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.9189ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.7577ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.146ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.7945ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5457ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4125ms)
✔ lockfiles: una lista; los que faltaban en la copia de secretos cuentan, requirements.txt no (2.2803ms)
✔ binarios: un UTF-16 con BOM (lleva NUL) es texto y se cuentan sus lineas; un binario de verdad no (1955.0206ms)
✔ PATH: en Windows, PATHEXT antes que el nombre pelado (npm.cmd, no el script sh); sin extension solo si se pide (30.1539ms)
✔ JSON con BOM, nombreBase y el texto de las carpetas excluidas (20.78ms)
✔ sin fichero de config: .taskcode ausente, vacio, config.yml vacio o solo comentarios -> defaults, sin quejarse (2565.7065ms)
✔ las tres claves puestas se leen las tres; rama_base cambia feature/fix/release pero NO hotfix (2135.1104ms)
✔ taskctl new: CAMBIA de verdad a la rama configurada y escribe el revisor del config en el tarea.md (3485.5721ms)
✔ agente_revisor_por_defecto: --agente-revisor sigue mandando sobre el config (2667.9061ms)
✔ agente_revisor_por_defecto: taskctl import usa el MISMO valor que new (la duplicacion desaparecio) (2712.6685ms)
✔ limite_wip: con limite 3 dos tareas abiertas ya no bloquean (con 1, si) y el mensaje dice el limite real (1.8308ms)
✔ invalido: limite_wip texto, 0, -1, decimal o booleano abortan (0 no significa "sin limite") (1.9711ms)
✔ invalido: rama_base vacia (en comillas o sin valor) y agente_revisor_por_defecto vacio abortan (1.3312ms)
✔ clave desconocida: avisa (no aborta), sugiere la parecida, enumera las validas y se ignora; las descartadas por la decision #9 tambien (10.7616ms)
✔ invalido: clave repetida, linea sin ":" y el mensaje nombra fichero y linea (1.6391ms)
✔ fallo cerrado real: con un config roto resolveBaseBranchForTipo NO cae a "develop" y taskctl new / import abortan sin crear la tarea (2492.0285ms)
✔ sintaxis: comentario inline se descarta, comillas y espacios de sobra se recortan, CRLF no rompe (0.6369ms)
✔ el parser compartido NO cambio el comportamiento del frontmatter (0.5879ms)
✔ ubicacion: se busca en la RAIZ del repo (tambien desde un subdirectorio) y un .taskcode que es un FICHERO aborta (1707.1008ms)
✔ ubicacion: la busqueda PARA en la raiz del repo (un config de mas arriba no manda) (276.2763ms)
✔ parsearConfig: modo_flujo acepta los tres valores, invalido aborta (lista los validos y sugiere el parecido) y repetido aborta (1.2087ms)
ℹ tests 841
ℹ suites 0
ℹ pass 841
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 207979.9588
[verificar-impacto] node --test termino con 0 en 208.1 s.
````
