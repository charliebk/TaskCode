# Peticion de revision — TASK-096 (ronda 1)

- Tarea: TASK-096 — Verificacion proporcional B: con codigo parcial se verifica solo lo afectado
- Rama revisada: feature/task-096-verificacion-proporcional-al-cambio-una
- Rama base: develop
- Commit revisado (HEAD): 51da391d65140d9c41401284fe8f43a5a9c1492b
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-096 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-096/tarea.md
- tareas/03-en-revision/TASK-096/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts

## Commits a revisar (git log develop..HEAD)

````
51da391 docs(TASK-096): autorrevision ronda 1
2bda5ea refactor(TASK-096): una sola condicion de nivel 2 activo
6559e7f docs(TASK-096): precisa el criterio de release y hotfix
ed893e4 feat(TASK-096): clave rutas_verificacion_parcial y decision selectiva en core
df9ba5b chore(TASK-096): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index c3cb058..fc267f2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -26,6 +26,7 @@
  * | umbral_cobertura             | null (solo informa) | commands/finish-cobertura.ts (TASK-074) |
  * | rutas_documentacion          | [] (sin efecto)   | finish-verificacion.ts (TASK-100), hooks/guardia-merge.ts (TASK-101) |
  * | comando_verificacion_documentacion | null        | finish-verificacion.ts (TASK-100), guardia-merge.ts (TASK-101) |
+ * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
  * TASK-100: si todo lo que cambia la tarea frente a la base cae en esas rutas
@@ -35,6 +36,14 @@
  * ampliarlas para eximirse). Exigen `comando_verificacion`: sin el no hay nada
  * que ahorrar.
  *
+ * `rutas_verificacion_parcial` la anadio TASK-096 (nivel 2 de la
+ * verificacion proporcional): si todo el codigo que cambia la tarea cae en
+ * esas rutas (leidas de la RAMA BASE, como las de documentacion), basta la
+ * selectiva. Es una lista de rutas permitidas: lo que queda fuera va a la
+ * completa. Exige `comando_verificacion_selectiva` (que a su vez exige la
+ * completa). Mismos patrones y mismo rechazo de los que casan con todo que
+ * `rutas_documentacion`.
+ *
  * `comando_verificacion` y `timeout_verificacion` las anadio TASK-070: declaran
  * como se verifica el proyecto (el comando de tests del repo) para que los
  * frenos de verificacion ejecuten ESE comando y nunca uno inventado. Mismo
@@ -227,6 +236,12 @@ export interface TaskcodeConfig {
    * tarea solo la cambia. null = no se ejecuta nada. Usa timeout_verificacion.
    */
   comando_verificacion_documentacion: string | null;
+  /**
+   * TASK-096: patrones (`git :(glob)`, sin anclar) de las rutas de codigo donde
+   * basta la verificacion selectiva. `[]` = sin nivel 2 (lo de la 0.14.0).
+   * Exige comando_verificacion_selectiva.
+   */
+  rutas_verificacion_parcial: readonly string[];
 }
 
 export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
@@ -270,6 +285,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   umbral_cobertura: null,
   rutas_documentacion: Object.freeze([]) as readonly string[],
   comando_verificacion_documentacion: null,
+  rutas_verificacion_parcial: Object.freeze([]) as readonly string[],
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -295,6 +311,7 @@ export const CLAVES_CONFIG = [
   'umbral_cobertura',
   'rutas_documentacion',
   'comando_verificacion_documentacion',
+  'rutas_verificacion_parcial',
 ] as const;
 
 /**
@@ -593,6 +610,9 @@ export function parsearConfigConAvisos(
       case 'rutas_documentacion':
         config.rutas_documentacion = validarRutasDocumentacion(donde, par.valor);
         break;
+      case 'rutas_verificacion_parcial':
+        config.rutas_verificacion_parcial = validarRutasDocumentacion(donde, par.valor, 'rutas_verificacion_parcial');
+        break;
       case 'comando_verificacion_documentacion':
         config.comando_verificacion_documentacion = validarComando(
           donde,
@@ -608,6 +628,7 @@ export function parsearConfigConAvisos(
   validarVerificacionCompleta(ruta, vistas);
   validarCoberturaCompleta(ruta, vistas);
   validarDocumentacionCompleta(ruta, vistas);
+  validarParcialCompleta(ruta, vistas);
   validarRemotoCompleto(dondeUrlBase, config);
   return { config, avisos };
 }
@@ -756,17 +777,23 @@ function validarCoberturaCompleta(ruta: string, vistas: ReadonlySet<string>): vo
  * (`*`, `**`, `**\/*`) convertiria cualquier cambio en «solo documentacion»:
  * se rechaza (MEN-4 de la revision).
  */
-function validarRutasDocumentacion(donde: string, valor: unknown): readonly string[] {
-  const patrones = validarPatronesExclusion(donde, valor, 'rutas_documentacion', false);
+function validarRutasDocumentacion(
+  donde: string,
+  valor: unknown,
+  clave: 'rutas_documentacion' | 'rutas_verificacion_parcial' = 'rutas_documentacion'
+): readonly string[] {
+  const patrones = validarPatronesExclusion(donde, valor, clave, false);
   const total = patrones.find((p) => /^(\*\*?\/)*\*\*?$/.test(p.replace(/\/+$/, '')));
   if (total !== undefined) {
     throw new ConfigError(
       // MEN-6 de la revision de TASK-100: `*` y `*/**` no casan con todo, pero
       // si con todos los ficheros de la raiz o de cualquier carpeta: demasiado.
-      `[ERROR] ${donde}: el patron "${total}" de "rutas_documentacion" es demasiado amplio: casa con ` +
+      `[ERROR] ${donde}: el patron "${total}" de "${clave}" es demasiado amplio: casa con ` +
         'ficheros de cualquier tipo (todos los de la raiz, de cualquier carpeta o del repo entero), y una tarea ' +
         'con codigo podria cerrarse sin la verificacion completa.\n' +
-        '        Declara carpetas o ficheros concretos de documentacion (p. ej. [docs/**, README.md]).'
+        (clave === 'rutas_documentacion'
+          ? '        Declara carpetas o ficheros concretos de documentacion (p. ej. [docs/**, README.md]).'
+          : '        Declara carpetas concretas de codigo cuyo efecto acota tu selectiva (p. ej. [src/web/**]).')
     );
   }
   return patrones;
@@ -793,6 +820,21 @@ function validarDocumentacionCompleta(ruta: string, vistas: ReadonlySet<string>)
   }
 }
 
+/**
+ * TASK-096: las rutas parciales dicen donde basta la selectiva; sin ella no hay
+ * nada que correr en su lugar (fallo cerrado, como la selectiva sin la completa).
+ */
+function validarParcialCompleta(ruta: string, vistas: ReadonlySet<string>): void {
+  if (vistas.has('rutas_verificacion_parcial') && !vistas.has('comando_verificacion_selectiva')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "rutas_verificacion_parcial" necesita tambien "comando_verificacion_selectiva".
+` +
+        '        En esas rutas basta la verificacion de lo afectado, que la corre la selectiva. Declarala ' +
+        '(p. ej. comando_verificacion_selectiva: "node scripts/verificar-selectiva.js") o borra las rutas.'
+    );
+  }
+}
+
 /** Ruta relativa a la raiz del repo, como las de sincronizacion (no absoluta, no carpeta, no fuera del repo). */
 function validarInformeCobertura(donde: string, valor: unknown): string {
   const texto = validarTextoNoVacio(donde, 'informe_cobertura', valor);
@@ -832,7 +874,7 @@ function validarUmbralCobertura(donde: string, valor: unknown): number {
 function validarPatronesExclusion(
   donde: string,
   valor: unknown,
-  clave: 'excluir_de_revision' | 'contexto_revision' | 'rutas_documentacion' = 'excluir_de_revision',
+  clave: 'excluir_de_revision' | 'contexto_revision' | 'rutas_documentacion' | 'rutas_verificacion_parcial' = 'excluir_de_revision',
   anclar = true
 ): readonly string[] {
   if (!Array.isArray(valor)) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
index 7491349..4f5743b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
@@ -16,6 +16,14 @@
  *   amplia sus rutas de documentacion no puede eximirse en el mismo diff;
  * - si alguna ruta cae fuera de las de documentacion.
  *
+ * TASK-096 (nivel 2, opt-in): si la base declara `rutas_verificacion_parcial`
+ * y todo lo que no es documentacion cae dentro de esas rutas, basta la
+ * verificacion selectiva (`comando_verificacion_selectiva`). Es una lista de
+ * rutas PERMITIDAS: cualquier ruta fuera (sin clasificar, transversal, el
+ * propio clasificador) va a la de siempre sin que el proyecto se acuerde. Los
+ * mismos «ante la duda» de arriba valen tambien aqui. Release y hotfix los
+ * excluye quien llama (finish no pasa base en un release).
+ *
  * La carpeta `tareas/` cuenta siempre como documentacion: es el estado de las
  * tareas que escribe taskctl y la cambia toda tarea. Sus tests held-out
  * (`aceptacion/`) los sigue ejecutando su propia puerta.
@@ -33,16 +41,26 @@ export interface DiffTarea {
   todas: readonly string[];
   /** Las que no casan con ninguna ruta de documentacion. */
   fueraDeDocs: readonly string[];
+  /**
+   * TASK-096: las que no casan ni con documentacion ni con
+   * `rutas_verificacion_parcial`. Sin calcular (undefined) = la de siempre.
+   */
+  fueraDeParcial?: readonly string[];
 }
 
 export interface ConfigDocumentacion {
   rutas_documentacion: readonly string[];
   comando_verificacion_documentacion: string | null;
+  /** TASK-096: rutas donde basta la selectiva. Ausente o `[]` = sin nivel 2 (lo de la 0.14.0). */
+  rutas_verificacion_parcial?: readonly string[];
+  /** TASK-096: la selectiva que corre el nivel 2 (la config exige que exista si hay rutas parciales). */
+  comando_verificacion_selectiva?: string | null;
 }
 
 export type DecisionVerificacion =
   | { tipo: 'completa'; motivo: string }
-  | { tipo: 'documentacion'; comando: string | null; motivo: string };
+  | { tipo: 'documentacion'; comando: string | null; motivo: string }
+  | { tipo: 'selectiva'; comando: string; motivo: string };
 
 const MAX_RUTAS_EN_MOTIVO = 3;
 
@@ -57,6 +75,25 @@ export function documentacionDeclarada(config: ConfigDocumentacion): boolean {
   return config.rutas_documentacion.length > 0;
 }
 
+/**
+ * TASK-096: la selectiva del nivel 2 si el proyecto lo activo (rutas parciales
+ * y su comando); null si no. Unico sitio que decide si el nivel 2 esta activo.
+ */
+export function comandoParcial(config: ConfigDocumentacion): string | null {
+  if ((config.rutas_verificacion_parcial ?? []).length === 0) return null;
+  return config.comando_verificacion_selectiva ?? null;
+}
+
+/** TASK-096: true si el proyecto activo el nivel 2. */
+export function parcialDeclarada(config: ConfigDocumentacion): boolean {
+  return comandoParcial(config) !== null;
+}
+
+/** TASK-096: patrones con los que Git separa lo que queda fuera de documentacion y de las rutas parciales. */
+export function patronesParcial(config: ConfigDocumentacion): string[] {
+  return [...new Set([...patronesDocumentacion(config), ...(config.rutas_verificacion_parcial ?? [])])];
+}
+
 /** Patrones con los que Git separa lo que no es documentacion (incluye siempre `tareas/**`). */
 export function patronesDocumentacion(config: ConfigDocumentacion): string[] {
   return [...new Set([...config.rutas_documentacion, RUTA_TAREAS_SIEMPRE_DOCUMENTACION])];
@@ -71,7 +108,9 @@ export function decidirVerificacion(
   diff: DiffTarea | null,
   base: string
 ): DecisionVerificacion {
-  if (!documentacionDeclarada(config)) {
+  const docs = documentacionDeclarada(config);
+  const selectiva = comandoParcial(config);
+  if (!docs && selectiva === null) {
     return { tipo: 'completa', motivo: `"${base}" no declara rutas_documentacion` };
   }
   if (diff === null) {
@@ -83,17 +122,35 @@ export function decidirVerificacion(
   if (diff.todas.includes(RUTA_CONFIG)) {
     return { tipo: 'completa', motivo: `la tarea cambia ${RUTA_CONFIG}` };
   }
-  if (diff.fueraDeDocs.length > 0) {
+  if (docs && diff.fueraDeDocs.length === 0) {
+    return {
+      tipo: 'documentacion',
+      comando: config.comando_verificacion_documentacion,
+      motivo:
+        `la tarea solo cambia documentacion (${String(diff.todas.length)} fichero(s) dentro de ` +
+        `rutas_documentacion de "${base}")`,
+    };
+  }
+  if (selectiva === null) {
     return {
       tipo: 'completa',
       motivo: `la tarea cambia rutas que no son documentacion: ${listar(diff.fueraDeDocs)}`,
     };
   }
+  if (diff.fueraDeParcial === undefined) {
+    return { tipo: 'completa', motivo: `no se calculo que cambia la tarea fuera de rutas_verificacion_parcial de "${base}"` };
+  }
+  if (diff.fueraDeParcial.length > 0) {
+    return {
+      tipo: 'completa',
+      motivo: `la tarea cambia rutas fuera de rutas_verificacion_parcial: ${listar(diff.fueraDeParcial)}`,
+    };
+  }
   return {
-    tipo: 'documentacion',
-    comando: config.comando_verificacion_documentacion,
+    tipo: 'selectiva',
+    comando: selectiva,
     motivo:
-      `la tarea solo cambia documentacion (${String(diff.todas.length)} fichero(s) dentro de ` +
-      `rutas_documentacion de "${base}")`,
+      `todo el codigo que cambia la tarea (${String(diff.fueraDeDocs.length)} fichero(s)) cae en ` +
+      `rutas_verificacion_parcial de "${base}": basta la verificacion de lo afectado`,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
index c258cb2..fef6644 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
@@ -8,7 +8,9 @@ import { spawnSync } from 'node:child_process';
 import {
   decidirVerificacion,
   documentacionDeclarada,
+  parcialDeclarada,
   patronesDocumentacion,
+  patronesParcial,
   RUTA_TAREAS_SIEMPRE_DOCUMENTACION,
 } from '../../src/core/verificacion-proporcional.js';
 import { ConfigError, parsearConfig } from '../../src/core/config.js';
@@ -155,3 +157,102 @@ test('anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la l
   assert.equal(anotarVerificacionDocumentacion(una, '2026-11-10T10:05:00Z', 'npm test', 'solo docs', 'node d.js'), una);
   assert.notEqual(anotarVerificacionDocumentacion(una, '2026-11-11', 'npm test', 'otro motivo', 'node d.js'), una);
 });
+
+// TASK-096 (nivel 2): con rutas_verificacion_parcial, el codigo que cae dentro basta con la selectiva.
+const CFG_PARCIAL = {
+  ...CFG,
+  rutas_verificacion_parcial: ['src/web/**'],
+  comando_verificacion_selectiva: 'node sel.js',
+};
+
+test('decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales', () => {
+  const sel = decidirVerificacion(
+    CFG_PARCIAL,
+    { todas: ['docs/a.md', 'src/web/b.ts'], fueraDeDocs: ['src/web/b.ts'], fueraDeParcial: [] },
+    'develop'
+  );
+  assert.equal(sel.tipo, 'selectiva');
+  assert.equal(sel.tipo === 'selectiva' ? sel.comando : null, 'node sel.js');
+  assert.match(sel.motivo, /1 fichero\(s\)\) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado/);
+
+  // Solo documentacion sigue siendo documentacion aunque haya rutas parciales.
+  const docs = decidirVerificacion(CFG_PARCIAL, { todas: ['docs/a.md'], fueraDeDocs: [], fueraDeParcial: [] }, 'develop');
+  assert.equal(docs.tipo, 'documentacion');
+
+  // Nivel 2 sin rutas de documentacion: tambien vale.
+  const sinDocs = decidirVerificacion(
+    { ...CFG_PARCIAL, rutas_documentacion: [] },
+    { todas: ['src/web/b.ts'], fueraDeDocs: ['src/web/b.ts'], fueraDeParcial: [] },
+    'develop'
+  );
+  assert.equal(sinDocs.tipo, 'selectiva');
+
+  const casos: Array<[string, Parameters<typeof decidirVerificacion>[1], RegExp]> = [
+    ['fuera de las rutas parciales', { todas: ['src/web/b.ts', 'src/core/c.ts'], fueraDeDocs: ['src/web/b.ts', 'src/core/c.ts'], fueraDeParcial: ['src/core/c.ts'] }, /fuera de rutas_verificacion_parcial: src\/core\/c\.ts/],
+    ['sin calcular lo de fuera de las parciales', { todas: ['src/web/b.ts'], fueraDeDocs: ['src/web/b.ts'] }, /no se calculo .* fuera de rutas_verificacion_parcial/],
+    // Mutacion: comprobar «selectiva» antes que el cambio de config pone esto en rojo.
+    ['config cambiada con codigo parcial', { todas: ['src/web/b.ts', '.taskcode/config.yml'], fueraDeDocs: ['src/web/b.ts', '.taskcode/config.yml'], fueraDeParcial: [] }, /cambia \.taskcode\/config\.yml/],
+    ['diff no calculable', null, /no se pudo calcular/],
+    ['diff vacio', { todas: [], fueraDeDocs: [], fueraDeParcial: [] }, /no cambia nada/],
+  ];
+  for (const [nombre, diff, motivo] of casos) {
+    const d = decidirVerificacion(CFG_PARCIAL, diff, 'develop');
+    assert.equal(d.tipo, 'completa', nombre);
+    assert.match(d.motivo, motivo, nombre);
+  }
+});
+
+test('decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0', () => {
+  const diff = { todas: ['src/web/b.ts'], fueraDeDocs: ['src/web/b.ts'], fueraDeParcial: [] };
+  for (const cfg of [
+    CFG,
+    { ...CFG, rutas_verificacion_parcial: [], comando_verificacion_selectiva: 'node sel.js' },
+    { ...CFG, rutas_verificacion_parcial: ['src/web/**'], comando_verificacion_selectiva: null },
+  ]) {
+    const d = decidirVerificacion(cfg, diff, 'develop');
+    assert.equal(d.tipo, 'completa');
+    assert.match(d.motivo, /no son documentacion: src\/web\/b\.ts/);
+  }
+  assert.match(decidirVerificacion({ ...CFG, rutas_documentacion: [] }, diff, 'develop').motivo, /no declara rutas_documentacion/);
+  assert.equal(parcialDeclarada(CFG), false);
+  assert.equal(parcialDeclarada(CFG_PARCIAL), true);
+  assert.deepEqual(patronesParcial(CFG_PARCIAL), ['docs/**', RUTA_TAREAS_SIEMPRE_DOCUMENTACION, 'src/web/**']);
+});
+
+test('config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo', () => {
+  const ok = parsearConfig(
+    'comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node s.js"\nrutas_verificacion_parcial: [src/web/**, "tools/*.ts"]\n',
+    'c.yml'
+  );
+  assert.deepEqual(ok.rutas_verificacion_parcial, ['src/web/**', 'tools/*.ts']);
+  assert.deepEqual(parsearConfig('', 'c.yml').rutas_verificacion_parcial, []);
+
+  // Fallo cerrado: sin la selectiva no hay nada que correr en su lugar.
+  assert.throws(
+    () => parsearConfig('comando_verificacion: "npm test"\nrutas_verificacion_parcial: [src/web/**]\n', 'c.yml'),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError);
+      assert.match(e.message, /"rutas_verificacion_parcial" necesita tambien "comando_verificacion_selectiva"/);
+      return true;
+    }
+  );
+  for (const p of ['"*"', '"**"', '"**/*"']) {
+    assert.throws(
+      () =>
+        parsearConfig(
+          `comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node s.js"\nrutas_verificacion_parcial: [${p}]\n`,
+          'c.yml'
+        ),
+      /de "rutas_verificacion_parcial" es demasiado amplio[\s\S]*carpetas concretas de codigo/,
+      p
+    );
+  }
+  assert.throws(
+    () =>
+      parsearConfig(
+        'comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node s.js"\nrutas_verificacion_parcial: [../fuera/**]\n',
+        'c.yml'
+      ),
+    /sale del repo/
+  );
+});
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-096/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-096/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-096/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-096/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-096/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-096/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-096/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-096/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-096/tarea.md                                                       |  9 +++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 37 +++++++++++++++++++++++++++++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/verificacion-proporcional.js                      | 56 ++++++++++++++++++++++++++++++++++++++++++++++++++------
 11 files changed, 90 insertions(+), 12 deletions(-)
````
