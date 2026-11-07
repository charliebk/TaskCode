# Peticion de revision — TASK-090 (ronda 1)

- Tarea: TASK-090 — El guardian de secretos tolera excepciones solo en su fichero historico
- Rama revisada: fix/task-090-el-guardian-de-secretos-tolera-excepcion
- Rama base: develop
- Commit revisado (HEAD): ea19af99efc36bbd47e79c3245e94d7bd4d66a5e
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-090 (criterios de aceptacion y plan)

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
ea19af9 fix(TASK-090): excepciones del guardian de secretos por pareja fichero+valor y deteccion de excepciones muertas
4b7850a chore(TASK-090): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts
index df8e30f..4625350 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts
@@ -68,15 +68,50 @@ const PATRONES: ReadonlyArray<{ id: string; re: RegExp }> = [
 ];
 
 /**
- * Valores exactos que se toleran, cada uno con su motivo. Nunca rutas ni
- * prefijos: una entrada asi podria tapar una clave de verdad.
+ * Valores que se toleran en CUALQUIER fichero. Solo los que GitHub ignora de
+ * forma observada: un valor que bloquea no puede estar aqui, o el guardian lo
+ * dejaria pasar en un fichero nuevo (TASK-090: asi se colo la clave de ejemplo
+ * de Stripe en el plan de TASK-089 y GitHub rechazo el push).
  */
-const PERMITIDOS: ReadonlyMap<string, string> = new Map([
-  [AWS_EJEMPLO, 'ejemplo de la documentacion de AWS; GitHub no lo bloquea'],
-  [STRIPE_TEST_EJEMPLO, 'ejemplo publico de Stripe; esta en origin desde TASK-066 sin bloqueo (informes de revision historicos)'],
-  [SLACK, 'token corto inventado; esta en origin desde TASK-066 sin bloqueo (informe de revision historico)'],
+const PERMITIDOS_EN_CUALQUIER_FICHERO: ReadonlyMap<string, string> = new Map([
+  [AWS_EJEMPLO, 'ejemplo canonico de la documentacion de AWS; GitHub no lo marco en el push que si bloqueo el de Stripe'],
 ]);
 
+/**
+ * Parejas exactas fichero+valor: ficheros historicos YA publicados en origin
+ * que llevan el valor entero y no se editan (no se reescribe historial). La
+ * ruta es la de `git ls-files` y se compara con ===, sin globs ni prefijos. El
+ * mismo valor en cualquier otro fichero es rojo. Una pareja que deja de usarse
+ * tambien es rojo: hay que quitarla.
+ */
+const EXCEPCIONES_HISTORICAS: ReadonlyArray<{ fichero: string; valor: string; motivo: string }> = [
+  {
+    fichero: 'tareas/04-terminadas/TASK-066/revision/peticion-revision-1.md',
+    valor: STRIPE_TEST_EJEMPLO,
+    motivo: 'diff de TASK-066, en origin antes de que existiera el guardian',
+  },
+  {
+    fichero: 'tareas/04-terminadas/TASK-066/revision/peticion-revision-1.md',
+    valor: SLACK,
+    motivo: 'diff de TASK-066, en origin antes de que existiera el guardian',
+  },
+  {
+    fichero: 'tareas/04-terminadas/TASK-089/planificacion/plan-final.md',
+    valor: STRIPE_TEST_EJEMPLO,
+    motivo: 'plan de TASK-089; la persona lo permitio en GitHub en vez de reescribir historial',
+  },
+  {
+    fichero: 'tareas/04-terminadas/TASK-089/revision/peticion-revision-1.md',
+    valor: STRIPE_TEST_EJEMPLO,
+    motivo: 'diff de TASK-089; permitido en GitHub junto con su plan',
+  },
+  {
+    fichero: 'tareas/04-terminadas/TASK-089/revision/peticion-revision-1.md',
+    valor: SLACK,
+    motivo: 'diff de TASK-089 (las lineas quitadas de secretos.test.ts)',
+  },
+];
+
 interface Hallazgo {
   fichero: string;
   linea: number;
@@ -84,12 +119,21 @@ interface Hallazgo {
   muestra: string;
 }
 
-function escanear(fichero: string, texto: string): Hallazgo[] {
+/** true si `valor` se tolera en `fichero`; anota en `usadas` la pareja historica que lo permite. */
+function permitido(fichero: string, valor: string, usadas?: Set<number>): boolean {
+  if (PERMITIDOS_EN_CUALQUIER_FICHERO.has(valor)) return true;
+  const i = EXCEPCIONES_HISTORICAS.findIndex((e) => e.fichero === fichero && e.valor === valor);
+  if (i === -1) return false;
+  usadas?.add(i);
+  return true;
+}
+
+function escanear(fichero: string, texto: string, usadas?: Set<number>): Hallazgo[] {
   const hallazgos: Hallazgo[] = [];
   for (const { id, re } of PATRONES) {
     re.lastIndex = 0;
     for (const m of texto.matchAll(re)) {
-      if (PERMITIDOS.has(m[0])) continue;
+      if (permitido(fichero, m[0], usadas)) continue;
       const linea = texto.slice(0, m.index).split('\n').length;
       hallazgos.push({ fichero, linea, patron: id, muestra: enmascarar(m[0]) });
     }
@@ -113,6 +157,7 @@ test('ningun fichero versionado lleva un literal con forma de clave', (t) => {
   assert.ok(ficheros.length > 100, `git ls-files devolvio solo ${ficheros.length} ficheros: el test no esta mirando el repo`);
 
   const hallazgos: Hallazgo[] = [];
+  const usadas = new Set<number>();
   let leidos = 0;
   for (const rel of ficheros) {
     let buf: Buffer;
@@ -123,7 +168,7 @@ test('ningun fichero versionado lleva un literal con forma de clave', (t) => {
     }
     if (esBinario(buf)) continue;
     leidos++;
-    hallazgos.push(...escanear(rel, buf.toString('utf8')));
+    hallazgos.push(...escanear(rel, buf.toString('utf8'), usadas));
   }
   assert.ok(leidos > 100, `solo se leyeron ${leidos} ficheros de texto`);
   assert.deepEqual(
@@ -131,6 +176,29 @@ test('ningun fichero versionado lleva un literal con forma de clave', (t) => {
     [],
     'hay literales con forma de clave: trocealos (ver test/helpers/claves-falsas.ts)'
   );
+  const muertas = EXCEPCIONES_HISTORICAS.filter((_, i) => !usadas.has(i)).map(
+    (e) => `${e.fichero} ${enmascarar(e.valor)}`
+  );
+  assert.deepEqual(muertas, [], 'excepcion historica muerta (el fichero ya no lleva ese valor o se movio): quitala');
+});
+
+test('contraprueba: una excepcion historica solo vale en su fichero', () => {
+  const historico = 'tareas/04-terminadas/TASK-066/revision/peticion-revision-1.md';
+  const nuevo = 'tareas/04-terminadas/TASK-090/planificacion/plan-final.md';
+  for (const [valor, patron] of [
+    [STRIPE_TEST_EJEMPLO, 'stripe-test'],
+    [SLACK, 'slack-token'],
+  ] as const) {
+    const texto = `uno\n'a\\n${valor}'\n`;
+    assert.deepEqual(escanear(historico, texto), [], `${patron}: en su fichero historico se tolera`);
+    const h = escanear(nuevo, texto);
+    assert.deepEqual(
+      h.map((x) => [x.fichero, x.linea, x.patron]),
+      [[nuevo, 2, patron]],
+      `${patron}: en otro fichero es rojo con fichero y linea`
+    );
+    assert.ok(!JSON.stringify(h).includes(valor.slice(6)), 'el valor crudo no puede salir en el informe');
+  }
 });
 
 test('contraprueba: el escaneo detecta cada patron con fichero y linea, sin mostrar el valor', () => {
@@ -180,9 +248,9 @@ test('contraprueba: el escaneo detecta cada patron con fichero y linea, sin most
 
 test('contraprueba: lo permitido y lo que no es clave no se marca', () => {
   const texto = [
+    // El de AWS se tolera en cualquier fichero; los historicos de Stripe y
+    // Slack solo en el suyo (ver la contraprueba de excepciones historicas).
     AWS_EJEMPLO,
-    STRIPE_TEST_EJEMPLO,
-    SLACK,
     `${PEM_CABECERA}\nxx\n${PEM_PIE}`,
     '-----BEGIN PUBLIC KEY-----',
     'sk_live_corta',
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-090/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-090/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-090/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````
