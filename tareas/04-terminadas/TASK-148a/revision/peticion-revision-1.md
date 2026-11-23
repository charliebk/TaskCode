# Peticion de revision — TASK-148a (ronda 1)

- Tarea: TASK-148a — raiz del plugin y lector de catalogos (parte a de TASK-148)
- Rama revisada: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
- Rama base: develop
- Commit revisado (HEAD): 5359464e06f968c34409c240fc887a5743eb4a81
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-148a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-148a/tarea.md
- tareas/03-en-revision/TASK-148a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/campos-catalogo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/raiz-plugin.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/campos-catalogo.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-aplicaciones.test.ts

## Commits a revisar (git log develop..HEAD)

````
5359464 chore(TASK-148a): autorrevision
b42169a fix(TASK-148a): raiz del plugin en un modulo y un lector comun de catalogos
fd8b50a chore(TASK-148a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/campos-catalogo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/campos-catalogo.ts
new file mode 100644
index 0000000..06be894
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/campos-catalogo.ts
@@ -0,0 +1,130 @@
+/**
+ * TASK-148a (CORE1-04, CORE1-05 de la auditoria 4D): lo comun de los
+ * catalogos planos del plugin (skills, heuristica de complejidad y
+ * doctor-deploy): la clave de bloque `prefijo_N_campo`, como se nombra un
+ * valor rechazado y los validadores de campo. Antes cada catalogo tenia los
+ * suyos, con reglas distintas (la lista vacia se admitia en uno y se rechazaba
+ * en otro; los repetidos, igual pero al reves).
+ *
+ * Una regla para todos: una lista es de textos no vacios y sin repetidos (una
+ * entrada dos veces casaria dos veces); si puede estar vacia lo dice quien
+ * llama con `minimo`. Cada catalogo pone su clase de error (`crearError`) y,
+ * si hace falta, una explicacion propia de su dominio (`detalle`).
+ */
+
+export type CrearError = (mensaje: string) => Error;
+
+/** Una clave `prefijo_N_campo` partida; null si no tiene esa forma. */
+export interface ClaveDeBloque {
+  prefijo: string;
+  n: number;
+  campo: string;
+}
+
+const CLAVE_DE_BLOQUE_RE = /^([a-z]+)_(\d+)_([a-z_]+)$/;
+
+export function claveDeBloque(clave: string): ClaveDeBloque | null {
+  const m = CLAVE_DE_BLOQUE_RE.exec(clave);
+  return m === null ? null : { prefijo: m[1] as string, n: Number(m[2]), campo: m[3] as string };
+}
+
+/** Como se nombra un valor rechazado en un mensaje de error. */
+export function describirValor(valor: unknown): string {
+  if (valor === null) return 'un valor vacio';
+  if (Array.isArray(valor)) return `una lista (${JSON.stringify(valor)})`;
+  if (typeof valor === 'string') return `el texto "${valor}"`;
+  return `${String(valor)} (${typeof valor})`;
+}
+
+const conDetalle = (mensaje: string, detalle: string | undefined): string =>
+  detalle === undefined ? mensaje : `${mensaje}\n        ${detalle.split('\n').join('\n        ')}`;
+
+export function validarEnteroNoNegativo(
+  donde: string,
+  clave: string,
+  valor: unknown,
+  crearError: CrearError,
+  detalle?: string
+): number {
+  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
+    throw crearError(
+      conDetalle(
+        `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, y es ${describirValor(valor)}.\n` +
+          '        Escribe el numero sin comillas y sin decimales.',
+        detalle
+      )
+    );
+  }
+  return valor;
+}
+
+export function validarTextoNoVacio(donde: string, clave: string, valor: unknown, crearError: CrearError): string {
+  if (typeof valor !== 'string' || valor.trim() === '') {
+    throw crearError(`[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.`);
+  }
+  return valor.trim();
+}
+
+/** Uno de `permitidos` (se compara recortado). */
+export function validarEnum<T extends string>(
+  donde: string,
+  clave: string,
+  valor: unknown,
+  permitidos: readonly T[],
+  crearError: CrearError
+): T {
+  const t = typeof valor === 'string' ? valor.trim() : null;
+  if (t === null || !(permitidos as readonly string[]).includes(t)) {
+    throw crearError(
+      `[ERROR] ${donde}: "${clave}" tiene el valor ${describirValor(valor)}, pero debe ser uno de: ${permitidos.join(', ')}.`
+    );
+  }
+  return t as T;
+}
+
+export interface OpcionesLista {
+  /** Cuantas entradas como minimo (0: puede estar vacia). */
+  minimo?: number;
+  /** Por que no puede estar vacia, para el mensaje (cuando `minimo` > 0). */
+  porQueNoVacia?: string;
+  /** Explicacion del dominio que se anade al error de forma (no es una lista). */
+  detalle?: string;
+}
+
+/** Lista de textos no vacios ni repetidos, recortados. */
+export function validarListaDeTexto(
+  donde: string,
+  clave: string,
+  valor: unknown,
+  crearError: CrearError,
+  o: OpcionesLista = {}
+): string[] {
+  if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
+    throw crearError(
+      conDetalle(
+        `[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes (p. ej. [a, b]), y es ${describirValor(valor)}.`,
+        o.detalle
+      )
+    );
+  }
+  const entradas = (valor as string[]).map((x) => x.trim());
+  if (entradas.some((x) => x === '')) {
+    throw crearError(
+      `[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.
+` +
+        '        Quitala: no aporta nada y, comparada como subcadena, casaria con cualquier texto.'
+    );
+  }
+  const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
+  if (repetida !== undefined) {
+    throw crearError(
+      `[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.
+` +
+        '        Deja solo una: la lista se recorre entera, asi que una entrada dos veces contaria doble.'
+    );
+  }
+  if (entradas.length < (o.minimo ?? 0)) {
+    throw crearError(conDetalle(`[ERROR] ${donde}: "${clave}" no puede estar vacia.`, o.porQueNoVacia));
+  }
+  return entradas;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
index 59db6bd..58efa92 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
@@ -28,11 +28,19 @@
  * el universo de claves validas no es una lista fija.
  */
 import { readFileSync } from 'node:fs';
-import { fileURLToPath } from 'node:url';
-import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
 import { masParecida } from './sugerencia.js';
 import type { ReglaSeleccionSkill, Task } from './task.js';
+import { rutaEnPlugin } from './raiz-plugin.js';
+import {
+  claveDeBloque,
+  validarEnteroNoNegativo,
+  validarEnum,
+  validarListaDeTexto,
+  validarTextoNoVacio,
+  type ClaveDeBloque,
+  type CrearError,
+} from './campos-catalogo.js';
 
 const MAX_TOTAL_SKILLS = 1000;
 
@@ -79,26 +87,12 @@ type CampoSkillObligatorio = (typeof CAMPOS_SKILL_OBLIGATORIOS)[number];
 const CAMPOS_SKILL_TODOS = [...CAMPOS_SKILL_OBLIGATORIOS, 'marketplace'] as const;
 type CampoSkill = (typeof CAMPOS_SKILL_TODOS)[number];
 
-const SKILL_KEY_RE =
-  /^skill_(\d+)_(id|origen|marketplace|rol|prioridad|etiquetas|patrones_archivo|descripcion)$/;
+/** TASK-148a (CORE1-05): la clave `skill_N_campo` se lee con claveDeBloque y el campo se valida contra CAMPOS_SKILL_TODOS. */
+const errorSkills: CrearError = (m) => new CatalogoSkillsError(m);
 
-function packageRoot(): string {
-  // dist/src/core/catalogo-skills.js -> dist/src/core -> dist/src -> dist -> raiz
-  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
-  return path.join(moduleDir, '..', '..', '..');
-}
-
-/**
- * Ruta del YML. Mismo patron que resolverRutaHeuristica(): respeta
- * CLAUDE_PLUGIN_ROOT si esta definida; si no, calcula la ruta relativa
- * al propio modulo compilado.
- */
+/** Ruta dentro del plugin con rutaEnPlugin (core/raiz-plugin.ts: respeta CLAUDE_PLUGIN_ROOT). */
 export function resolverRutaCatalogoSkills(): string {
-  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
-  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
-    return path.join(pluginRoot, 'scripts', FICHERO_CATALOGO_SKILLS);
-  }
-  return path.join(packageRoot(), 'scripts', FICHERO_CATALOGO_SKILLS);
+  return rutaEnPlugin('scripts', FICHERO_CATALOGO_SKILLS);
 }
 
 /**
@@ -150,7 +144,8 @@ export function parsearCatalogoSkills(contenido: string, ruta: string): Catalogo
   const totalSkills = validarEnteroNoNegativo(
     `${ruta}:${primerTotal.numeroLinea}`,
     'total_skills',
-    primerTotal.valor
+    primerTotal.valor,
+    errorSkills
   );
   // Cota superior aparte del "no negativo" de arriba (hallazgo MENOR de
   // revision por pares, TASK-017): construirClavesValidas() materializa
@@ -185,11 +180,10 @@ export function parsearCatalogoSkills(contenido: string, ruta: string): Catalogo
 
     if (par.clave === 'total_skills') continue;
 
-    const m = SKILL_KEY_RE.exec(par.clave) as RegExpExecArray;
-    const n = Number(m[1]);
-    const campo = m[2] as CampoSkill;
+    // clavesValidas ya garantiza la forma `skill_N_<campo de CAMPOS_SKILL_TODOS>`.
+    const { n, campo } = claveDeBloque(par.clave) as ClaveDeBloque;
     const bloque = bloques.get(n) ?? {};
-    bloque[campo] = { valor: par.valor, numeroLinea: par.numeroLinea };
+    bloque[campo as CampoSkill] = { valor: par.valor, numeroLinea: par.numeroLinea };
     bloques.set(n, bloque);
   }
 
@@ -239,10 +233,10 @@ function construirEntrada(
   const prefijo = `skill_${n}_`;
 
   const cId = exigirCampo(bloque, 'id', n, ruta);
-  const id = validarTextoNoVacio(`${ruta}:${cId.numeroLinea}`, `${prefijo}id`, cId.valor);
+  const id = validarTextoNoVacio(`${ruta}:${cId.numeroLinea}`, `${prefijo}id`, cId.valor, errorSkills);
 
   const cOrigen = exigirCampo(bloque, 'origen', n, ruta);
-  const origen = validarEnum(`${ruta}:${cOrigen.numeroLinea}`, `${prefijo}origen`, cOrigen.valor, ORIGENES_SKILL);
+  const origen = validarEnum(`${ruta}:${cOrigen.numeroLinea}`, `${prefijo}origen`, cOrigen.valor, ORIGENES_SKILL, errorSkills);
 
   // IMP-9 (revision por pares ronda 3, TASK-017): "plugin:skill" es la
   // convencion normativa para un id externo (seccion 6.6 de
@@ -267,13 +261,14 @@ function construirEntrada(
   }
 
   const cRol = exigirCampo(bloque, 'rol', n, ruta);
-  const rol = validarEnum(`${ruta}:${cRol.numeroLinea}`, `${prefijo}rol`, cRol.valor, ROLES_SKILL);
+  const rol = validarEnum(`${ruta}:${cRol.numeroLinea}`, `${prefijo}rol`, cRol.valor, ROLES_SKILL, errorSkills);
 
   const cPrioridad = exigirCampo(bloque, 'prioridad', n, ruta);
   const prioridad = validarEnteroNoNegativo(
     `${ruta}:${cPrioridad.numeroLinea}`,
     `${prefijo}prioridad`,
-    cPrioridad.valor
+    cPrioridad.valor,
+    errorSkills
   );
 
   const cEtiquetas = exigirCampo(bloque, 'etiquetas', n, ruta);
@@ -281,7 +276,13 @@ function construirEntrada(
     `${ruta}:${cEtiquetas.numeroLinea}`,
     `${prefijo}etiquetas`,
     cEtiquetas.valor,
-    1
+    errorSkills,
+    {
+      minimo: 1,
+      porQueNoVacia:
+        'Una entrada de catalogo sin etiquetas nunca puede coincidir con ninguna\n' +
+        'tarea por solape: seria un candidato imposible. Anadele al menos una.',
+    }
   );
 
   const cPatrones = exigirCampo(bloque, 'patrones_archivo', n, ruta);
@@ -289,14 +290,15 @@ function construirEntrada(
     `${ruta}:${cPatrones.numeroLinea}`,
     `${prefijo}patrones_archivo`,
     cPatrones.valor,
-    0
+    errorSkills
   );
 
   const cDescripcion = exigirCampo(bloque, 'descripcion', n, ruta);
   const descripcion = validarTextoNoVacio(
     `${ruta}:${cDescripcion.numeroLinea}`,
     `${prefijo}descripcion`,
-    cDescripcion.valor
+    cDescripcion.valor,
+    errorSkills
   );
 
   const cMarketplace: CampoValor = bloque['marketplace'];
@@ -310,7 +312,7 @@ function construirEntrada(
           '        de la seccion 6.6).'
       );
     }
-    marketplace = validarTextoNoVacio(`${ruta}:${cMarketplace.numeroLinea}`, `${prefijo}marketplace`, cMarketplace.valor);
+    marketplace = validarTextoNoVacio(`${ruta}:${cMarketplace.numeroLinea}`, `${prefijo}marketplace`, cMarketplace.valor, errorSkills);
   } else {
     if (cMarketplace !== undefined) {
       throw new CatalogoSkillsError(
@@ -344,82 +346,6 @@ function validarIdsUnicos(catalogo: readonly EntradaCatalogoSkill[], ruta: strin
 
 // --- Validadores tipados (mismo criterio que heuristica.ts) -----------
 
-function validarEnteroNoNegativo(donde: string, clave: string, valor: unknown): number {
-  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
-    throw new CatalogoSkillsError(
-      `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, ` +
-        `y es ${describirValor(valor)}.\n` +
-        '        Escribe el numero sin comillas y sin decimales.'
-    );
-  }
-  return valor;
-}
-
-function validarTextoNoVacio(donde: string, clave: string, valor: unknown): string {
-  if (typeof valor !== 'string' || valor.trim() === '') {
-    throw new CatalogoSkillsError(
-      `[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.`
-    );
-  }
-  return valor.trim();
-}
-
-function validarEnum<T extends string>(
-  donde: string,
-  clave: string,
-  valor: unknown,
-  permitidos: readonly T[]
-): T {
-  if (typeof valor !== 'string' || !(permitidos as readonly string[]).includes(valor)) {
-    throw new CatalogoSkillsError(
-      `[ERROR] ${donde}: "${clave}" tiene el valor ${describirValor(valor)}, pero debe ser uno de: ` +
-        `${permitidos.join(', ')}.`
-    );
-  }
-  return valor as T;
-}
-
-/**
- * Lista de textos no vacios ni repetidos. `minimo` distingue
- * `etiquetas` (>=1: una entrada sin etiquetas nunca podria coincidir
- * con ninguna tarea por solape, seria un candidato imposible) de
- * `patrones_archivo` (>=0: vacia es el caso legitimo de un skill que no
- * se enruta por extension de fichero).
- */
-function validarListaDeTexto(donde: string, clave: string, valor: unknown, minimo: number): string[] {
-  if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
-    throw new CatalogoSkillsError(
-      `[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes ` +
-        `(p. ej. [a, b]), y es ${describirValor(valor)}.`
-    );
-  }
-  const entradas = (valor as string[]).map((x) => x.trim());
-  if (entradas.some((x) => x === '')) {
-    throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.`);
-  }
-  const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
-  if (repetida !== undefined) {
-    throw new CatalogoSkillsError(
-      `[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.`
-    );
-  }
-  if (entradas.length < minimo) {
-    throw new CatalogoSkillsError(
-      `[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
-        '        Una entrada de catalogo sin etiquetas nunca puede coincidir con ninguna\n' +
-        '        tarea por solape: seria un candidato imposible. Anadele al menos una.'
-    );
-  }
-  return entradas;
-}
-
-function describirValor(valor: unknown): string {
-  if (valor === null) return 'un valor vacio';
-  if (Array.isArray(valor)) return `una lista (${JSON.stringify(valor)})`;
-  if (typeof valor === 'string') return `el texto "${valor}"`;
-  return `${String(valor)} (${typeof valor})`;
-}
-
 function mensajeClaveAusente(ruta: string, clave: string): string {
   return (
     `[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
index 98dc0c4..3973b02 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
@@ -27,9 +27,17 @@
  */
 import { readFileSync } from 'node:fs';
 import path from 'node:path';
-import { fileURLToPath } from 'node:url';
 import { parseBloqueClaveValor, type ParClaveValor } from './frontmatter.js';
 import { PATRONES_REGLAS_SIN_HUELLA } from './doctor-deploy-reglas.js';
+import { rutaEnPlugin } from './raiz-plugin.js';
+import {
+  claveDeBloque,
+  validarEnteroNoNegativo,
+  validarEnum,
+  validarListaDeTexto,
+  validarTextoNoVacio,
+  type CrearError,
+} from './campos-catalogo.js';
 
 export class DoctorDeployCatalogoError extends Error {
   constructor(message: string) {
@@ -175,18 +183,9 @@ const CAMPOS_SILENCIAR = ['patron', 'fichero', 'commit', 'huella', 'motivo', 'qu
 type Valor = { valor: unknown; numeroLinea: number };
 type Bloque = Map<string, Valor>;
 
-function packageRoot(): string {
-  // dist/src/core/doctor-deploy-catalogo.js -> core -> src -> dist -> raiz del plugin
-  return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
-}
-
 /** Ruta del catalogo del plugin. Respeta CLAUDE_PLUGIN_ROOT, como las demas. */
 export function resolverRutaCatalogoDeploy(): string {
-  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
-  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
-    return path.join(pluginRoot, 'scripts', FICHERO_CATALOGO_DEPLOY);
-  }
-  return path.join(packageRoot(), 'scripts', FICHERO_CATALOGO_DEPLOY);
+  return rutaEnPlugin('scripts', FICHERO_CATALOGO_DEPLOY);
 }
 
 // ---------------------------------------------------------------------
@@ -229,13 +228,13 @@ function agrupar(
       extrasLeidos.set(par.clave, par);
       continue;
     }
-    const m = /^([a-z]+)_(\d+)_([a-z_]+)$/.exec(par.clave);
-    const fam = m === null ? undefined : familias.find((f) => f.prefijo === m[1]);
-    if (m === null || fam === undefined || !fam.campos.includes(m[3] as string)) {
+    const m = claveDeBloque(par.clave);
+    const fam = m === null ? undefined : familias.find((f) => f.prefijo === m.prefijo);
+    if (m === null || fam === undefined || !fam.campos.includes(m.campo)) {
       desconocidas.push(par);
       continue;
     }
-    const n = Number(m[2]);
+    const n = m.n;
     if (!Number.isSafeInteger(n) || n < 1 || n > MAX_ENTRADAS) {
       throw fallar(
         `[ERROR] ${donde}: "${par.clave}" tiene un numero fuera de rango (1 a ${MAX_ENTRADAS}). ` +
@@ -244,7 +243,7 @@ function agrupar(
     }
     const delFamilia = bloques.get(fam.prefijo) as Map<number, Bloque>;
     const bloque = delFamilia.get(n) ?? new Map<string, Valor>();
-    bloque.set(m[3] as string, { valor: par.valor, numeroLinea: par.numeroLinea });
+    bloque.set(m.campo, { valor: par.valor, numeroLinea: par.numeroLinea });
     delFamilia.set(n, bloque);
   }
   return { bloques, desconocidas, extras: extrasLeidos };
@@ -277,40 +276,24 @@ function exigir(bloque: Bloque, prefijo: string, n: number, campo: string, ruta:
   return v;
 }
 
-function texto(v: Valor, clave: string, ruta: string, fallar: (m: string) => Error): string {
-  if (typeof v.valor !== 'string' || v.valor.trim() === '') {
-    throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" debe ser un texto no vacio.`);
-  }
-  return v.valor.trim();
+// TASK-148a (CORE1-04): adaptadores de Valor a los validadores comunes de
+// campos-catalogo.ts; las reglas (lista sin vacios ni repetidos, enumerado
+// recortado, entero no negativo) son las mismas que en skills y heuristica.
+function texto(v: Valor, clave: string, ruta: string, fallar: CrearError): string {
+  return validarTextoNoVacio(`${ruta}:${v.numeroLinea}`, clave, v.valor, fallar);
 }
 
-function lista(v: Valor, clave: string, ruta: string, fallar: (m: string) => Error): string[] {
-  if (!Array.isArray(v.valor) || v.valor.length === 0 || v.valor.some((x) => typeof x !== 'string' || x.trim() === '')) {
-    throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" debe ser una lista no vacia de textos: [a, b].`);
-  }
-  return (v.valor as string[]).map((x) => x.trim());
+function lista(v: Valor, clave: string, ruta: string, fallar: CrearError): string[] {
+  return validarListaDeTexto(`${ruta}:${v.numeroLinea}`, clave, v.valor, fallar, { minimo: 1 });
 }
 
-function enumerado<T extends string>(
-  v: Valor,
-  clave: string,
-  validos: readonly T[],
-  ruta: string,
-  fallar: (m: string) => Error
-): T {
-  const t = typeof v.valor === 'string' ? v.valor.trim() : '';
-  if (!(validos as readonly string[]).includes(t)) {
-    throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" vale "${String(v.valor)}", pero debe ser uno de: ${validos.join(', ')}.`);
-  }
-  return t as T;
+function enumerado<T extends string>(v: Valor, clave: string, validos: readonly T[], ruta: string, fallar: CrearError): T {
+  return validarEnum(`${ruta}:${v.numeroLinea}`, clave, v.valor, validos, fallar);
 }
 
-function valorEntero(par: ParClaveValor | undefined, clave: string, ruta: string, fallar: (m: string) => Error): number {
+function valorEntero(par: ParClaveValor | undefined, clave: string, ruta: string, fallar: CrearError): number {
   if (par === undefined) throw fallar(`[ERROR] ${ruta}: falta la clave obligatoria "${clave}".`);
-  if (typeof par.valor !== 'number' || !Number.isInteger(par.valor) || par.valor < 0) {
-    throw fallar(`[ERROR] ${ruta}:${par.numeroLinea}: "${clave}" debe ser un entero no negativo.`);
-  }
-  return par.valor;
+  return validarEnteroNoNegativo(`${ruta}:${par.numeroLinea}`, clave, par.valor, fallar);
 }
 
 const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
index 8e20f36..4cf9876 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
@@ -84,12 +84,12 @@
  * ------------------------------------------------------------------
  */
 import { readFileSync } from 'node:fs';
-import { fileURLToPath } from 'node:url';
-import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
 import { masParecida } from './sugerencia.js';
 import { extraerSecciones, normalizarTexto } from './tarea-body.js';
 import type { Task, TaskComplexity, TaskType } from './task.js';
+import { rutaEnPlugin } from './raiz-plugin.js';
+import { validarEnteroNoNegativo, validarListaDeTexto, type CrearError } from './campos-catalogo.js';
 
 export class HeuristicaError extends Error {
   constructor(message: string) {
@@ -192,25 +192,11 @@ export const SENAL_RELEASE = 'tipo_release';
 export const SENAL_HOTFIX_RIESGO = 'tipo_hotfix_con_palabra_riesgo';
 export const SENAL_CRITERIOS = 'criterios_aceptacion';
 
-function packageRoot(): string {
-  // dist/src/core/heuristica.js -> dist/src/core -> dist/src -> dist -> raiz
-  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
-  return path.join(moduleDir, '..', '..', '..');
-}
+/** Ruta dentro del plugin con rutaEnPlugin (core/raiz-plugin.ts: respeta CLAUDE_PLUGIN_ROOT). */
+const errorHeuristica: CrearError = (m) => new HeuristicaError(m);
 
-/**
- * Ruta del YML. Mismo patron que resolveGitflowScriptsDir(): respeta
- * CLAUDE_PLUGIN_ROOT (convencion documentada para cuando Claude Code
- * lanza taskctl como comando de plugin) si esta definida; si no,
- * calcula la ruta relativa al propio modulo compilado, necesario para
- * el dogfooding directo, donde esa variable no esta puesta.
- */
 export function resolverRutaHeuristica(): string {
-  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
-  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
-    return path.join(pluginRoot, 'scripts', FICHERO_HEURISTICA);
-  }
-  return path.join(packageRoot(), 'scripts', FICHERO_HEURISTICA);
+  return rutaEnPlugin('scripts', FICHERO_HEURISTICA);
 }
 
 /**
@@ -275,9 +261,21 @@ export function parsearHeuristica(contenido: string, ruta: string): Heuristica {
     vistas.add(par.clave);
 
     if (par.clave === CLAVE_PALABRAS) {
-      palabras = validarListaDeTexto(donde, par.clave, par.valor);
+      // Una lista VACIA se acepta (minimo 0): un proyecto puede no querer vocabulario de riesgo.
+      palabras = validarListaDeTexto(donde, par.clave, par.valor, errorHeuristica, {
+        detalle: 'Sin corchetes se leeria como UNA sola entrada con todo el texto dentro.',
+      });
     } else {
-      numeros.set(par.clave, validarEnteroNoNegativo(donde, par.clave, par.valor));
+      numeros.set(
+        par.clave,
+        validarEnteroNoNegativo(
+          donde,
+          par.clave,
+          par.valor,
+          errorHeuristica,
+          'Un negativo restaria complejidad por tener una senal de mas, que es justo lo\ncontrario de lo que hace esta heuristica.'
+        )
+      );
     }
   }
 
@@ -370,76 +368,6 @@ function mensajeClaveDesconocida(donde: string, clave: string): string {
   return lineas.join('\n');
 }
 
-/**
- * Entero >= 0. El cero SI es legitimo aqui, a diferencia de
- * `limite_wip` en config.ts: `agentes_brainstorm_trivial: 0` es la
- * decision central del fichero (no se paga un brainstorm para algo
- * trivial). Lo que no puede ser es negativo: un peso negativo
- * restaria complejidad por tener una senal mas, que es lo contrario de
- * lo que el fichero dice hacer.
- */
-function validarEnteroNoNegativo(donde: string, clave: string, valor: unknown): number {
-  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
-    throw new HeuristicaError(
-      `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, ` +
-        `y es ${describirValor(valor)}.\n` +
-        '        Escribe el numero sin comillas y sin decimales. Un negativo restaria\n' +
-        '        complejidad por tener una senal de mas, que es justo lo contrario de lo\n' +
-        '        que hace esta heuristica.'
-    );
-  }
-  return valor;
-}
-
-/**
- * Lista de textos no vacios. Una lista VACIA se acepta: un proyecto
- * que edite su copia del fichero para no tener vocabulario de riesgo
- * esta tomando una decision legitima, y el resto de senales sigue
- * funcionando. Lo que no se acepta es que no sea una lista: escrito
- * sin corchetes, el parser devuelve un texto y la comparacion por
- * subcadena buscaria la frase entera como si fuera una sola entrada.
- */
-function validarListaDeTexto(donde: string, clave: string, valor: unknown): string[] {
-  if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
-    throw new HeuristicaError(
-      `[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes ` +
-        `(p. ej. ["migracion", "seguridad"]), y es ${describirValor(valor)}.\n` +
-        '        Sin corchetes se leeria como UNA sola entrada con todo el texto dentro.'
-    );
-  }
-  const entradas = (valor as string[]).map((x) => x.trim());
-  if (entradas.some((x) => x === '')) {
-    throw new HeuristicaError(
-      `[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.\n` +
-        '        Quitala: una entrada vacia casaria como subcadena con CUALQUIER tarea\n' +
-        '        y dispararia la senal siempre.'
-    );
-  }
-  // La regla "una vez por entrada DISTINTA" se cumple porque se
-  // recorre la lista, no el texto. Eso deja de ser cierto si la lista
-  // trae la misma entrada dos veces: casaria en las dos vueltas y la
-  // palabra puntuaria doble. Es exactamente el fallo silencioso que la
-  // regla existe para evitar, asi que se rechaza aqui en vez de
-  // deduplicar por detras (deduplicar callaria el error del fichero).
-  const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
-  if (repetida !== undefined) {
-    throw new HeuristicaError(
-      `[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.\n` +
-        '        Deja solo una: la lista se recorre entera, asi que una entrada dos\n' +
-        '        veces haria que esa palabra puntuara el doble que las demas.'
-    );
-  }
-  return entradas;
-}
-
-/** Como se nombra un valor rechazado en un mensaje de error. */
-function describirValor(valor: unknown): string {
-  if (valor === null) return 'un valor vacio';
-  if (Array.isArray(valor)) return `una lista (${JSON.stringify(valor)})`;
-  if (typeof valor === 'string') return `el texto "${valor}"`;
-  return `${String(valor)} (${typeof valor})`;
-}
-
 function mensajeClaveAusente(ruta: string, clave: string): string {
   return (
     `[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/raiz-plugin.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/raiz-plugin.ts
new file mode 100644
index 0000000..85b442f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/raiz-plugin.ts
@@ -0,0 +1,25 @@
+/**
+ * TASK-148a (CORE1-03, CORE2-08 de la auditoria 4D): la raiz del plugin, de
+ * la que cuelgan sus catalogos (`scripts/*.yml`), sus skills y los scripts de
+ * Git-Flow. Antes estaba copiada en cinco modulos: si cambiaba una copia, cada
+ * catalogo se cargaba desde una raiz distinta.
+ *
+ * Respeta `CLAUDE_PLUGIN_ROOT` (la convencion de Claude Code cuando lanza
+ * taskctl como comando del plugin) si esta definida y no vacia; si no, la
+ * calcula relativa a este modulo compilado, necesario para el dogfooding
+ * directo, donde la variable no esta puesta.
+ */
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+
+export function raizDelPlugin(): string {
+  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+  if (pluginRoot !== undefined && pluginRoot.trim() !== '') return pluginRoot;
+  // dist/src/core/raiz-plugin.js -> dist/src/core -> dist/src -> dist -> raiz del plugin
+  return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+}
+
+/** Una ruta dentro del plugin: `rutaEnPlugin('scripts', 'heuristica-complejidad.yml')`. */
+export function rutaEnPlugin(...partes: string[]): string {
+  return path.join(raizDelPlugin(), ...partes);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
index abbf839..aae3b1a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
@@ -28,9 +28,9 @@
  * entero, no degrada en silencio al generico.
  */
 import { readFileSync, readdirSync } from 'node:fs';
-import { fileURLToPath } from 'node:url';
 import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
+import { rutaEnPlugin } from './raiz-plugin.js';
 
 export class CatalogoRevisoresError extends Error {
   constructor(message: string) {
@@ -55,23 +55,9 @@ export interface CatalogoRevisores {
   generico: RevisorGenerico;
 }
 
-function packageRoot(): string {
-  // dist/src/core/revisores.js -> dist/src/core -> dist/src -> dist -> raiz
-  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
-  return path.join(moduleDir, '..', '..', '..');
-}
-
-/**
- * Ruta de `skills/`. Mismo patron que resolverRutaCatalogoSkills():
- * respeta CLAUDE_PLUGIN_ROOT si esta definida; si no, la calcula
- * relativa al propio modulo compilado.
- */
+/** Ruta dentro del plugin con rutaEnPlugin (core/raiz-plugin.ts: respeta CLAUDE_PLUGIN_ROOT). */
 export function resolverRutaSkills(): string {
-  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
-  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
-    return path.join(pluginRoot, 'skills');
-  }
-  return path.join(packageRoot(), 'skills');
+  return rutaEnPlugin('skills');
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
index 08177dd..9c21dbf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
@@ -26,30 +26,13 @@
  */
 import { spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from 'node:child_process';
 import { existsSync } from 'node:fs';
-import { fileURLToPath } from 'node:url';
 import path from 'node:path';
 import { entornoParaBash, resolverBash, type BashResuelto } from '../core/resolver-bash.js';
+import { rutaEnPlugin } from '../core/raiz-plugin.js';
 
-function packageRoot(): string {
-  // dist/src/fs/gitflow-runner.js -> dist/src/fs -> dist/src -> dist -> raiz del paquete
-  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
-  return path.join(moduleDir, '..', '..', '..');
-}
-
-/**
- * Resuelve el directorio de scripts/gitflow/. Respeta
- * CLAUDE_PLUGIN_ROOT (convencion documentada para cuando Claude Code
- * lanza taskctl como comando de plugin) si esta definida; si no,
- * calcula la ruta relativa al propio modulo compilado — necesario
- * para el dogfooding directo (taskctl invocado a mano, como en este
- * mismo repo) donde esa variable no esta puesta.
- */
+/** Ruta dentro del plugin con rutaEnPlugin (core/raiz-plugin.ts: respeta CLAUDE_PLUGIN_ROOT). */
 export function resolveGitflowScriptsDir(): string {
-  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
-  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
-    return path.join(pluginRoot, 'scripts', 'gitflow');
-  }
-  return path.join(packageRoot(), 'scripts', 'gitflow');
+  return rutaEnPlugin('scripts', 'gitflow');
 }
 
 export interface RunGitflowScriptOptions {
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-148a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148a/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148a/tarea.md                                                       |  10 ++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/campos-catalogo.js                                 |  72 +++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/catalogo-skills.js                                 | 108 ++++++++++++++++------------------------------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-catalogo.js                          |  47 ++++++++++++------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heuristica.js                                      |  93 ++++++++--------------------------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/raiz-plugin.js                                     |  24 +++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/revisores.js                                       |  19 +++------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/gitflow-runner.js                                    |  22 +++--------------
 16 files changed, 156 insertions(+), 239 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/campos-catalogo.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-aplicaciones.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/campos-catalogo.test.ts            | 48 ++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-aplicaciones.test.ts |  9 ++++++++-
 2 files changed, 56 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 149.4 s
- Commit verificado: 5359464e06f968c34409c240fc887a5743eb4a81
- Huella: f864a1fe2ce80ef153a4f147e30cc74cfd760d27
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 82027 bytes en total):

````
✔ cada revisora da un ejemplo por D en su seccion "## Que se revisa" y remite a revision.md (25.2111ms)
✔ start exige helper buscado, criterio citado y mutacion, anotados en la autorrevision (40.0008ms)
✔ TASK-153a: start y revision.md remiten a la guia de patrones de disfraz, que los define (122.0512ms)
✔ TASK-153b: revision.md pide comprobar los candidatos 4D de la peticion y mutar sus tests (14.3083ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (14.2427ms)
✔ 1. las cuatro skills revisoras existen con su nombre exacto (3.8861ms)
✔ 2. el frontmatter parsea y declara name y description (el validador NO comprueba esto) (9.7197ms)
✔ 3. el frontmatter solo lleva las claves del spec portable (10.9875ms)
✔ 4. patrones_archivo es legible por el UNICO parser que hay en el repo (9.0923ms)
✔ 5. los revisores de dominio traen patrones; el generico declara que no los tiene (6.3198ms)
✔ 6. ningun revisor de dominio se solapa con otro en un patron identico (7.5007ms)
✔ 6b. la tabla de enrutado no esta vacia ni cojea (guard de no-vacuidad) (9.0802ms)
✔ 6c. POSITIVA: cada ruta que tiene que casar llega al revisor que le toca (198.3453ms)
✔ 6d. NEGATIVA: ninguna ruta ajena llega a un revisor de dominio (183.2399ms)
✔ 7. la linea de veredicto que cada skill prescribe la ACEPTA finish.ts (12.2263ms)
✔ 8. cada skill prescribe tambien la forma de NO aprobar, y finish.ts la rechaza (12.6557ms)
✔ 9. las tres severidades estan DEFINIDAS (no solo mencionadas) en las cuatro (8.348ms)
✔ 9b. la definicion de severidad NO la satisface una mencion en prosa (0.6882ms)
✔ 10. las cuatro exigen reproducir en una SECCION con procedimiento, no de pasada (12.1433ms)
✔ 10 bis. la seccion de reproduccion NO la satisface la etiqueta del esqueleto (1.0975ms)
✔ 10b. el esqueleto derivado del CLI trae lo que este test da por supuesto (0.2407ms)
✔ 10c. las cuatro prescriben el esqueleto que taskctl review genera de verdad (10.4329ms)
✔ 10d. cada revisora enlaza la referencia comun, y la referencia existe (5.3893ms)
✔ 10e. lo comun a las revisoras y la tabla del veredicto viven solo en revision.md (64.0345ms)
✔ 10f. cada fila de la tabla del veredicto de revision.md dice lo que hace finish.ts (4.5909ms)
✔ 10g. la lectura de la tabla discrimina (contraprueba del 10f) (3.3042ms)
✔ 11. ninguna skill arrastra marcas de este repo ni rutas de maquina (11.4635ms)
✔ 11b. la marca generica de documento interno discrimina (contraprueba del menor 4) (0.445ms)
✔ 12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro (21373.7242ms)
✔ 13. el plugin entero, con las cuatro skills dentro, sigue validando (8366.9267ms)
✔ 14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2 (4.0618ms)
ℹ tests 812
ℹ suites 0
ℹ pass 811
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 136177.4188
[verificar-impacto] node --test termino con 0 en 136.3 s.
````
