# Peticion de revision — TASK-086 (ronda 1)

- Tarea: TASK-086 — Descontar las pausas de las duraciones de las metricas
- Rama revisada: feature/task-086-descontar-las-pausas-de-las-duraciones-d
- Rama base: develop
- Commit revisado (HEAD): 8c8b58550114c85d01a7b8b01ce3af269339bb58
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-086 (criterios de aceptacion y plan)

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
8c8b585 test(TASK-086): la clave pausas en el contrato de metricas --json
6f7e39e feat(TASK-086): descontar las pausas de las duraciones de metricas
1e3f861 chore(TASK-086): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/METRICAS.md b/docs/METRICAS.md
index e826a93..d4c3e14 100644
--- a/docs/METRICAS.md
+++ b/docs/METRICAS.md
@@ -673,6 +673,44 @@ ronda siguiente.
   acotada tampoco lo hubiera encontrado. Mide lo que pasó con la revisión
   completa, no lo que pasará con la acotada.
 
+## 14. Duraciones de fase y pausas (TASK-086)
+
+`taskctl metricas` mide cada fase con las marcas de `## Transiciones` (o, sin
+ellas, con los commits automáticos `chore(TASK-NNN): ...`):
+
+| columna | desde | hasta |
+|---|---|---|
+| `diseno` | primer `plan` | primer `start` |
+| `curso` | primer `start` | primer `review` |
+| `revision` | primer `review` | último `finish` |
+| `total` (`--json`) | primer `plan` | último `finish` |
+
+Son duraciones de calendario **menos las pausas**. `taskctl pausa` deja una
+sola fila: es el «no» a pasar de fase, y no existe una transición de
+«reanudar». La hace la fila siguiente:
+
+- Cada racha de filas `pausa` seguidas es un intervalo que va de la primera
+  de la racha a la siguiente fila que no sea `pausa`.
+- Cada fase resta la parte del intervalo que cae dentro de sus límites;
+  `total` resta todo lo que cae entre el primer `plan` y el último `finish`,
+  así que sigue siendo la suma de las tres.
+- Una pausa sin fila detrás (tarea abierta, aún en pausa) no tiene cierre y
+  no descuenta nada hasta la siguiente transición.
+- Con precisión de día (filas antiguas, solo la fecha) no se descuenta: la
+  duración va en días enteros con medianoche implícita, y restarle horas le
+  daría una precisión que no tiene.
+
+Lo descontado sale en `--json`, en la lista `pausas` (una entrada por tarea
+con alguna fila `pausa`: `proyecto`, `id`, `pausas` y `enPausa`). `enPausa` es
+`{ valor, precision }`
+en milisegundos, `valor: 0` si no hubo pausas cerradas y `null` si no se pudo
+aplicar (sin marcas o con precisión de día). Una tarea sin pausas da
+exactamente la misma duración que antes de TASK-086.
+
+**Qué no dice.** La regla supone que entre la pausa y la transición
+siguiente no se trabaja. Si alguien rehace el plan después de decir «no» y
+antes de aprobarlo, ese trabajo también se descuenta.
+
 <!-- taskctl metricas --tokens: inicio -->
 ## Coste en tokens por tarea (generado)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 3a81b3d..aa4470b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -1147,7 +1147,12 @@ revisión, el día de cierre y el origen del dato: la tabla `## Transiciones`
 del `tarea.md` (cuya columna `fecha` lleva el instante UTC al segundo desde
 la 0.5.0; las filas antiguas, solo el día, dan la duración en días), o, si
 la tarea no la tiene, los commits automáticos `chore(TASK-NNN): ...` con un
-único `git log`; si tampoco, «—». Las pausas no se descuentan.
+único `git log`; si tampoco, «—». Las pausas se descuentan: cada `taskctl
+pausa` cuenta desde su fila hasta la siguiente transición que no sea otra
+pausa, y se resta de la fase (y del total) en la que cae. Una pausa sin
+transición detrás (tarea abierta) no descuenta, y con duraciones en días
+tampoco. Lo descontado sale, por tarea, en la lista `pausas` de `--json`
+(`enPausa`).
 `--heuristica` añade a las tareas terminadas con informes de revisión la
 puntuación y el nivel de la heurística de complejidad vigente, más un
 resumen de rondas medias por nivel declarado y heurístico: es la tabla con
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index ef599b3..c7e14da 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -63,7 +63,9 @@ import {
   notasFilaEnriquecida,
   formatearLecturasRevision,
   lecturasRevisionJson,
+  pausasJson,
   type LecturaRevisionJson,
+  type PausaJson,
   BloqueTokensError,
   NOTA_TOKENS,
   renderBloqueTokens,
@@ -148,6 +150,8 @@ export interface SalidaJsonMetricas {
   sinCoste: ResumenSinCoste;
   /** TASK-081: lecturas por (tarea, ronda, revisor), con sus CRITICO/IMPORTANTE; siempre presente. */
   lecturasRevision: LecturaRevisionJson[];
+  /** TASK-086: tareas con alguna pausa y lo descontado de sus duraciones; siempre presente. */
+  pausas: PausaJson[];
   evolucion?: Evolucion;
   grupos?: Grupos;
   /** TASK-084: con `--por-version`. */
@@ -175,8 +179,11 @@ export interface MetricasCommandDeps {
 
 const NOTA_CALENDARIO =
   'Duraciones de calendario: diseno = plan->start, curso = start->primer review, ' +
-  'revision = primer review->finish. Las pausas no se descuentan. Con origen "registro" ' +
-  'de filas antiguas (solo el dia) o mezcladas, la duracion va en dias ("N d").';
+  'revision = primer review->finish. Se descuentan las pausas: cada "taskctl pausa" ' +
+  'cuenta hasta la siguiente transicion que no sea pausa (una pausa sin transicion ' +
+  'detras no descuenta; lo descontado va en "pausas" con --json). Con origen "registro" ' +
+  'de filas antiguas (solo el dia) o mezcladas, la duracion va en dias ("N d") y no se ' +
+  'descuenta nada.';
 
 interface FlagsMetricas {
   heuristica: boolean;
@@ -582,6 +589,7 @@ export async function runMetricasCommand(
       })),
       sinCoste: resumenSinCoste(filas),
       lecturasRevision: lecturasRevisionJson(filas),
+      pausas: pausasJson(filas),
       ...(tramoEvolucion === null ? {} : { evolucion: calcularEvolucion(filas, tramoEvolucion) }),
       ...(conGrupos ? { grupos: calcularGrupos(filas, proyectos) } : {}),
       ...(conPorVersion ? { porVersion: calcularPorVersion(filas) } : {}),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 8f48590..8636e9b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -22,8 +22,15 @@
  *    ultimo: un plan repetido es parte del diseno, no lo reinicia.
  *  - curso: del primer `start` al primer `review`.
  *  - revision: del primer `review` al ultimo `finish`.
- * `pausa` no se descuenta: no existe una transicion de «reanudar», asi que
- * no hay con que cerrar el hueco. La salida lo dice.
+ * TASK-086: las PAUSAS SE DESCUENTAN de las tres y de `total`. No hay
+ * transicion de «reanudar»: la hace la fila siguiente. Cada racha de filas
+ * `pausa` seguidas es un intervalo que va de la primera de la racha a la
+ * siguiente fila que no sea `pausa` (`pausa` es el «no» a pasar de fase:
+ * hasta la siguiente transicion la tarea espera). Cada fase resta la parte
+ * del intervalo que cae dentro de sus limites. Una racha sin fila detras
+ * (tarea abierta) no tiene cierre y no descuenta. Con precision de dia no se
+ * descuenta nada: restar horas a dias enteros con medianoche implicita daria
+ * una precision que no hay. Lo descontado va en `enPausa`.
  *
  * Si alguna de las dos marcas es de dia, la duracion va en dias enteros: con
  * medianoche implicita, restar horas daria numeros que parecen precisos y
@@ -84,6 +91,12 @@ export interface EventoGit {
   ms: number;
 }
 
+/** TASK-086: un tramo de pausa, de la primera `pausa` de una racha a la fila siguiente. */
+export interface IntervaloPausa {
+  desde: Marca;
+  hasta: Marca;
+}
+
 export interface Duracion {
   /** Milisegundos (precision de segundo) o dias enteros (precision de dia). */
   valor: number;
@@ -173,9 +186,16 @@ export interface FilaMetricas {
   kbPeticionPorRonda: PeticionRonda[];
   /**
    * TASK-065: del primer `plan` al ultimo `finish` (lo que suman diseno, curso
-   * y revision); null si falta una de las dos marcas.
+   * y revision); null si falta una de las dos marcas. TASK-086: sin pausas.
    */
   total: Duracion | null;
+  /**
+   * TASK-086: lo descontado por pausas entre el primer `plan` y el ultimo
+   * `finish` (o la ultima marca medida si no hay `finish`); `valor: 0` si no
+   * hubo pausas cerradas. null = no se aplico: sin marcas de segundo que
+   * medir (origen «—» o precision de dia). Nunca un 0 por ausencia.
+   */
+  enPausa: Duracion | null;
   /**
    * TASK-065: veredicto de la ronda 1 (`veredictoDeRonda` de sus informes:
    * `aprobada` cubre tambien `aprobada-con-correcciones`); null sin informes
@@ -257,6 +277,23 @@ interface Marcas {
   review: Marca | null;
   finish: Marca | null;
   pausas: number;
+  /** TASK-086: un intervalo por racha de pausas cerrada por una fila posterior. */
+  intervalosPausa: IntervaloPausa[];
+}
+
+/** TASK-086: cada racha de `pausa` seguidas, de su primera fila a la siguiente que no lo sea. */
+function intervalosDePausa(orden: readonly { fase: FaseMedida; marca: Marca }[]): IntervaloPausa[] {
+  const intervalos: IntervaloPausa[] = [];
+  let abierta: Marca | null = null;
+  for (const e of orden) {
+    if (e.fase === 'pausa') {
+      abierta ??= e.marca;
+    } else if (abierta !== null) {
+      intervalos.push({ desde: abierta, hasta: e.marca });
+      abierta = null;
+    }
+  }
+  return intervalos;
 }
 
 function marcasDe(eventos: readonly { fase: FaseMedida; marca: Marca }[]): Marcas {
@@ -270,6 +307,7 @@ function marcasDe(eventos: readonly { fase: FaseMedida; marca: Marca }[]): Marca
     review: primera('review'),
     finish: finishes.length === 0 ? null : (finishes[finishes.length - 1] as { marca: Marca }).marca,
     pausas: orden.filter((e) => e.fase === 'pausa').length,
+    intervalosPausa: intervalosDePausa(orden),
   };
 }
 
@@ -285,6 +323,44 @@ export function duracionEntre(desde: Marca | null, hasta: Marca | null): Duracio
   return ms < 0 ? null : { valor: ms, precision: 'segundo' };
 }
 
+/**
+ * TASK-086: milisegundos de pausa dentro de [desde, hasta], o null si no se
+ * puede medir (falta una marca, es de dia o el fin es anterior). Un intervalo
+ * con alguna marca de dia no cuenta.
+ */
+export function pausaEntre(desde: Marca | null, hasta: Marca | null, pausas: readonly IntervaloPausa[]): number | null {
+  const base = duracionEntre(desde, hasta);
+  if (base === null || base.precision === 'dia' || desde === null || hasta === null) return null;
+  let ms = 0;
+  for (const p of pausas) {
+    if (p.desde.precision === 'dia' || p.hasta.precision === 'dia') continue;
+    const ini = Math.max(p.desde.ms, desde.ms);
+    const fin = Math.min(p.hasta.ms, hasta.ms);
+    if (fin > ini) ms += fin - ini;
+  }
+  return ms;
+}
+
+/**
+ * TASK-086: `duracionEntre` menos la pausa que cae dentro. Sin intervalos, o
+ * con precision de dia, devuelve exactamente lo mismo que `duracionEntre`.
+ */
+export function duracionSinPausas(
+  desde: Marca | null,
+  hasta: Marca | null,
+  pausas: readonly IntervaloPausa[]
+): Duracion | null {
+  const base = duracionEntre(desde, hasta);
+  const enPausa = pausaEntre(desde, hasta, pausas);
+  if (base === null || enPausa === null || enPausa === 0) return base;
+  return { valor: base.valor - enPausa, precision: base.precision };
+}
+
+/** Ultima marca medida de la tarea: `finish`, o si no `review`, `start` o `plan`. */
+function ultimaMarca(m: Marcas): Marca | null {
+  return m.finish ?? m.review ?? m.start ?? m.plan;
+}
+
 /** Una fila por tarea, sin la parte de heuristica. */
 export function calcularFila(e: EntradaMetricas): FilaMetricas {
   const registro = leerTransiciones(e.body).map((f) => ({
@@ -303,7 +379,7 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     );
   } else {
     origen = '—';
-    marcas = { plan: null, start: null, review: null, finish: null, pausas: 0 };
+    marcas = { plan: null, start: null, review: null, finish: null, pausas: 0, intervalosPausa: [] };
   }
   return {
     proyecto: e.proyecto ?? '',
@@ -318,9 +394,9 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     },
     estado: e.task.estado,
     complejidad: e.task.complejidad,
-    diseno: duracionEntre(marcas.plan, marcas.start),
-    curso: duracionEntre(marcas.start, marcas.review),
-    revision: duracionEntre(marcas.review, marcas.finish),
+    diseno: duracionSinPausas(marcas.plan, marcas.start, marcas.intervalosPausa),
+    curso: duracionSinPausas(marcas.start, marcas.review, marcas.intervalosPausa),
+    revision: duracionSinPausas(marcas.review, marcas.finish, marcas.intervalosPausa),
     rondas: e.ronda > 0 ? e.ronda : null,
     cierre: marcas.finish === null ? null : new Date(marcas.finish.ms).toISOString().slice(0, 10),
     pausas: marcas.pausas,
@@ -333,12 +409,18 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     hallazgos: resumirHallazgos(e.informes ?? []),
     lecturasRevision: lecturasRevisionDe(e.body, e.informes ?? []),
     kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
-    total: duracionEntre(marcas.plan, marcas.finish),
+    total: duracionSinPausas(marcas.plan, marcas.finish, marcas.intervalosPausa),
+    enPausa: enPausaDe(marcas),
     veredictoRonda1: veredictoRonda1(e.informes ?? []),
     versionCierre: versionDeCierre(e.body),
   };
 }
 
+function enPausaDe(m: Marcas): Duracion | null {
+  const ms = pausaEntre(m.plan, ultimaMarca(m), m.intervalosPausa);
+  return ms === null ? null : { valor: ms, precision: 'segundo' };
+}
+
 function lecturasRevisionDe(body: string, informes: readonly InformeLeido[]): LecturaRevisorFila[] {
   return lecturasDeRevision(leerCostes(body)).map((g) => {
     const deEse = g.ronda === null ? [] : informes.filter((i) => i.ronda === g.ronda && i.revisor === g.revisor);
@@ -938,3 +1020,19 @@ export interface LecturaRevisionJson extends LecturaRevisorFila {
 export function lecturasRevisionJson(filas: readonly FilaMetricas[]): LecturaRevisionJson[] {
   return filas.flatMap((f) => f.lecturasRevision.map((g) => ({ proyecto: f.proyecto, id: f.id, ...g })));
 }
+
+/** TASK-086: una entrada de `pausas` en `--json`, por tarea con alguna fila `pausa`. */
+export interface PausaJson {
+  proyecto: string;
+  id: string;
+  /** Filas `pausa` del registro (o commits `pausa registrada`). */
+  pausas: number;
+  /** Lo descontado (`FilaMetricas.enPausa`); null = no se pudo aplicar. */
+  enPausa: Duracion | null;
+}
+
+export function pausasJson(filas: readonly FilaMetricas[]): PausaJson[] {
+  return filas
+    .filter((f) => f.pausas > 0)
+    .map((f) => ({ proyecto: f.proyecto, id: f.id, pausas: f.pausas, enPausa: f.enPausa }));
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
index a5acd15..70e7051 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
@@ -144,7 +144,7 @@ test('--json con --evolucion y --grupos: un unico objeto que pasa JSON.parse, si
     assert.equal(r.status, 0, r.stderr);
     assert.equal(r.stdout.trim().split('\n').length, 1, 'una sola linea');
     const o = JSON.parse(r.stdout) as Record<string, any>;
-    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'lecturasRevision', 'evolucion', 'grupos']);
+    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'lecturasRevision', 'pausas', 'evolucion', 'grupos']);
     assert.deepEqual(
       o.proyectos.map((p: Record<string, unknown>) => [p.proyecto, p.tareas]),
       [['alfa', 5], ['beta', 2]]
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
index 91fb4d4..98f3d1d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
@@ -82,7 +82,7 @@ test('metricas --tokens: columnas por fase y total, la tarea sin datos en la tab
     assert.match(r.stdout, /\| 0 +\| 1\/2 +\| 1000 \(media 1000, 20\.0%\) +\| 3000 \(media 3000, 60\.0%\) +\| 1000 \(media 1000, 20\.0%\) +\| 5000 \(media 5000\) +\|/);
     assert.match(r.stdout, /Coste en tokens por complejidad declarada:\n\| complejidad +\| con dato\/total/);
     assert.match(r.stdout, /\| simple +\| 1\/2 /);
-    assert.match(r.stdout, /Las pausas no se descuentan/, 'sigue llevando la nota de calendario');
+    assert.match(r.stdout, /Se descuentan las pausas/, 'sigue llevando la nota de calendario');
     assert.doesNotMatch(r.stdout, /NaN|undefined/);
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'solo lectura');
     assert.equal(await stat(METRICAS_MD(repoRoot)).then(() => true, () => false), false);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts
index e92ad0a..b96258d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts
@@ -65,7 +65,7 @@ test('--por-version --json: clave porVersion con versiones y sinVersion; sin el
     assert.equal(r.status, 0, r.stderr);
     assert.equal(r.stdout.trim().split('\n').length, 1, 'una sola linea');
     const o = JSON.parse(r.stdout) as SalidaJsonMetricas;
-    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'lecturasRevision', 'porVersion']);
+    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'lecturasRevision', 'pausas', 'porVersion']);
     assert.ok(o.porVersion);
     assert.equal(o.porVersion.terminadas, 4);
     assert.deepEqual(o.porVersion.versiones.map((g) => [g.version, g.n]), [['0.9.0', 1], ['0.10.0', 2]]);
@@ -75,7 +75,7 @@ test('--por-version --json: clave porVersion con versiones y sinVersion; sin el
     assert.doesNotMatch(r.stdout, /NaN|Infinity/);
     // El contrato de siempre: sin --por-version no aparece la clave nueva.
     const sinFlag = JSON.parse(metricas(alfa, ['--json']).stdout) as Record<string, unknown>;
-    assert.deepEqual(Object.keys(sinFlag), ['proyectos', 'sinCoste', 'lecturasRevision']);
+    assert.deepEqual(Object.keys(sinFlag), ['proyectos', 'sinCoste', 'lecturasRevision', 'pausas']);
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
index 51b6e1e..5ebd56b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
@@ -87,7 +87,7 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     assert.match(r.stdout, /Terminadas sin coste en alguna fase: 1 de 1 \(diseno 1, implementacion 1, revision 1\): TASK-001 \(diseno, implementacion, revision\)/);
     assert.equal(cierre, (filas[4] as { fecha: string }).fecha.slice(0, 10));
     assert.equal(origen, 'registro');
-    assert.match(r.stdout, /Las pausas no se descuentan/);
+    assert.match(r.stdout, /Se descuentan las pausas/);
     assert.doesNotMatch(r.stdout, /NaN|undefined/);
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'metricas no escribe nada');
 
@@ -123,6 +123,31 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
   });
 });
 
+test('TASK-086: una pausa real por CLI se descuenta y sale en "pausas" de --json', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['pausa', ID]);
+    cliOk(repoRoot, ['review', ID]);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    cliOk(repoRoot, ['finish', ID]);
+
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.ok(t);
+    const filas = leerTransiciones(t.body);
+    assert.deepEqual(filas.map((f) => f.fase), ['plan', 'approve', 'start', 'pausa', 'review', 'finish']);
+    const ms = (fase: string): number => Date.parse((filas.find((f) => f.fase === fase) as { fecha: string }).fecha);
+
+    const o = JSON.parse(cliOk(repoRoot, ['metricas', '--json']).stdout) as SalidaJsonMetricas;
+    assert.equal(o.pausas.length, 1);
+    const p = o.pausas[0];
+    assert.equal(p?.id, ID);
+    assert.equal(p?.pausas, 1);
+    assert.deepEqual(p?.enPausa, { valor: ms('review') - ms('pausa'), precision: 'segundo' });
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'metricas no escribe nada');
+  });
+});
+
 test('metricas: un flag desconocido aborta sin sacar tabla, y --heuristica no lleva valor', async () => {
   await withRepo(CONFIG_AUTO, async (repoRoot) => {
     const r = cli(repoRoot, ['metricas', '--heuristic']);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
index 29afed4..b0f012f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
@@ -21,6 +21,8 @@ import {
   COLUMNAS_METRICAS,
   calcularFila,
   duracionEntre,
+  duracionSinPausas,
+  pausasJson,
   enMuestraHeuristica,
   formatearDuracion,
   formatearTabla,
@@ -153,7 +155,10 @@ test('dos pares review/finish: revision llega al ULTIMO finish y el cierre es el
   assert.equal(f.cierre, '2026-10-07');
 });
 
-test('pausa se cuenta pero no se descuenta: la duracion es de calendario', () => {
+const MIN = 60_000;
+const seg = (iso: string): { ms: number; precision: 'segundo' } => ({ ms: Date.parse(iso), precision: 'segundo' });
+
+test('TASK-086: la pausa dura hasta la siguiente transicion y se descuenta de su fase', () => {
   const f = calcularFila(
     entrada({
       body: cuerpoCon([
@@ -164,7 +169,115 @@ test('pausa se cuenta pero no se descuenta: la duracion es de calendario', () =>
     })
   );
   assert.equal(f.pausas, 1);
-  assert.equal(formatearDuracion(f.diseno), '8h 00m');
+  // De 10:05 a 18:00 la tarea espera: de las 8h de calendario quedan 5 min.
+  assert.deepEqual(f.diseno, { valor: 5 * MIN, precision: 'segundo' });
+  assert.equal(formatearDuracion(f.diseno), '5m');
+  assert.deepEqual(f.enPausa, { valor: (7 * 60 + 55) * MIN, precision: 'segundo' });
+});
+
+test('TASK-086: pausas en varias fases, rachas seguidas y total = suma de las tres', () => {
+  const f = calcularFila(
+    entrada({
+      body: cuerpoCon([
+        ['2026-10-05T10:00:00Z', 'plan'],
+        ['2026-10-05T11:00:00Z', 'pausa'], // racha de dos: cuenta desde la primera
+        ['2026-10-05T12:00:00Z', 'pausa'],
+        ['2026-10-05T13:00:00Z', 'approve'],
+        ['2026-10-05T13:30:00Z', 'start'],
+        ['2026-10-05T14:00:00Z', 'pausa'], // en curso, cerrada por review
+        ['2026-10-05T16:00:00Z', 'review'],
+        ['2026-10-05T16:20:00Z', 'pausa'], // en revision, cerrada por el segundo review
+        ['2026-10-05T17:20:00Z', 'review'],
+        ['2026-10-05T18:00:00Z', 'finish'],
+      ]),
+      ronda: 2,
+    })
+  );
+  assert.equal(f.pausas, 4);
+  assert.deepEqual(f.diseno, { valor: 90 * MIN, precision: 'segundo' }); // 3h30 - 2h
+  assert.deepEqual(f.curso, { valor: 30 * MIN, precision: 'segundo' }); // 2h30 - 2h
+  assert.deepEqual(f.revision, { valor: 60 * MIN, precision: 'segundo' }); // 2h - 1h
+  assert.deepEqual(f.enPausa, { valor: 5 * 60 * MIN, precision: 'segundo' });
+  assert.deepEqual(f.total, { valor: 180 * MIN, precision: 'segundo' }, 'total = suma de las tres');
+  assert.equal((f.total?.valor ?? 0) + (f.enPausa?.valor ?? 0), 8 * 60 * MIN, 'total + pausa = calendario');
+});
+
+test('TASK-086: una pausa sin transicion detras (tarea abierta) no descuenta', () => {
+  const f = calcularFila(
+    entrada({
+      task: tarea({ estado: 'en-curso' }),
+      body: cuerpoCon([
+        ['2026-10-05T10:00:00Z', 'plan'],
+        ['2026-10-05T11:00:00Z', 'start'],
+        ['2026-10-05T11:30:00Z', 'pausa'],
+      ]),
+    })
+  );
+  assert.equal(f.pausas, 1);
+  assert.deepEqual(f.diseno, { valor: 60 * MIN, precision: 'segundo' });
+  assert.equal(f.curso, null);
+  assert.deepEqual(f.enPausa, { valor: 0, precision: 'segundo' });
+});
+
+test('TASK-086: sin pausas las duraciones son las de calendario de siempre y enPausa vale 0', () => {
+  const f = calcularFila(entrada({ body: cuerpoCon(CICLO_CON_HORA), ronda: 1 }));
+  assert.equal(f.pausas, 0);
+  assert.deepEqual(f.diseno, duracionEntre(seg('2026-10-05T10:00:00Z'), seg('2026-10-05T10:45:00Z')));
+  assert.deepEqual(f.total, duracionEntre(seg('2026-10-05T10:00:00Z'), seg('2026-10-06T13:00:00Z')));
+  assert.deepEqual(f.enPausa, { valor: 0, precision: 'segundo' });
+  assert.deepEqual(pausasJson([f]), [], 'sin pausas no entra en la lista de --json');
+  const desde = { ms: 0, precision: 'segundo' as const };
+  const hasta = { ms: 90 * MIN, precision: 'segundo' as const };
+  assert.deepEqual(duracionSinPausas(desde, hasta, []), duracionEntre(desde, hasta));
+});
+
+test('TASK-086: con precision de dia no se descuenta nada y enPausa es null', () => {
+  const f = calcularFila(
+    entrada({
+      body: cuerpoCon([
+        ['2026-10-01', 'plan'],
+        ['2026-10-02', 'pausa'],
+        ['2026-10-04', 'start'],
+      ]),
+    })
+  );
+  assert.deepEqual(f.diseno, { valor: 3, precision: 'dia' });
+  assert.equal(f.enPausa, null);
+  // Fase de segundos con un intervalo de pausa de dia: tampoco se descuenta.
+  const pausaDia = { desde: { ms: Date.parse('2026-10-05T00:00:00Z'), precision: 'dia' as const }, hasta: seg('2026-10-05T12:00:00Z') };
+  assert.deepEqual(duracionSinPausas(seg('2026-10-05T10:00:00Z'), seg('2026-10-05T14:00:00Z'), [pausaDia]), {
+    valor: 4 * 60 * MIN,
+    precision: 'segundo',
+  });
+  assert.deepEqual(pausasJson([f]), [{ proyecto: '', id: 'TASK-007', pausas: 1, enPausa: null }]);
+});
+
+test('TASK-086: origen git, el commit "pausa registrada" se descuenta igual que la fila', () => {
+  const ev = (fase: EventoGit['fase'], iso: string): EventoGit => ({ id: 'TASK-007', fase, ms: Date.parse(iso) });
+  // git log va de lo mas nuevo a lo mas viejo.
+  const f = calcularFila(
+    entrada({
+      eventosGit: [
+        ev('finish', '2026-10-05T15:00:00Z'),
+        ev('review', '2026-10-05T14:00:00Z'),
+        ev('start', '2026-10-05T12:00:00Z'),
+        ev('pausa', '2026-10-05T10:30:00Z'),
+        ev('plan', '2026-10-05T10:00:00Z'),
+      ],
+      ronda: 1,
+    })
+  );
+  assert.equal(f.origen, 'git');
+  assert.deepEqual(f.diseno, { valor: 30 * MIN, precision: 'segundo' });
+  assert.deepEqual(f.curso, { valor: 2 * 60 * MIN, precision: 'segundo' });
+  assert.deepEqual(f.enPausa, { valor: 90 * MIN, precision: 'segundo' });
+});
+
+test('TASK-086: una pausa que cruza el limite de dos fases reparte el descuento', () => {
+  const pausa = [{ desde: seg('2026-10-05T11:00:00Z'), hasta: seg('2026-10-05T13:00:00Z') }];
+  assert.deepEqual(duracionSinPausas(seg('2026-10-05T10:00:00Z'), seg('2026-10-05T12:00:00Z'), pausa), { valor: 60 * MIN, precision: 'segundo' });
+  assert.deepEqual(duracionSinPausas(seg('2026-10-05T12:00:00Z'), seg('2026-10-05T14:00:00Z'), pausa), { valor: 60 * MIN, precision: 'segundo' });
+  assert.equal(duracionSinPausas(seg('2026-10-05T12:00:00Z'), seg('2026-10-05T11:00:00Z'), pausa), null, 'fin anterior: null, como duracionEntre');
 });
 
 test('sin finish ni review: las columnas que faltan salen "—", nunca 0 ni NaN', () => {
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-086/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-086/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-086/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                | 10 +++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                    | 82 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------
 5 files changed, 84 insertions(+), 11 deletions(-)
````
