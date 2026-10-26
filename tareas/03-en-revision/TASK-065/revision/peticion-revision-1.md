# Peticion de revision — TASK-065 (ronda 1)

- Tarea: TASK-065 — Metricas v2 (C): evolucion, grupos y varios proyectos
- Rama revisada: feature/task-065-metricas-v2-c-evolucion-grupos-y-varios
- Rama base: develop
- Commit revisado (HEAD): 177260ab3ab1d87640c98654689a6f3dea1dd3ea
- Fecha: 2026-10-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-065 (criterios de aceptacion y plan)

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
177260a chore(TASK-065): coste implementacion +34183483 tokens (1 agente)
5e13f55 test(TASK-065): pause con una opcion repetida aborta como el resto
10388b2 feat(TASK-065): registrar-coste de un agente reanudado suma solo lo que crecio
8ec3e00 feat(TASK-065): metricas --json, lista sin coste acotada y documentacion
c99b4c1 feat(TASK-065): metricas --grupos por tipo, complejidad, criterios y KB
5868551 feat(TASK-065): metricas --evolucion [--tramo N] por tramos de cierre
be76873 feat(TASK-065): la fila de metricas lleva total y veredicto de la ronda 1
284ad3a feat(TASK-065): un flag repetido aborta en cualquier comando
52b1fc6 feat(TASK-065): --repo repetible en metricas con lector comun de flags
718fc82 chore(TASK-065): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index d8e3af6..04235b9 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,43 @@
 # Changelog
 
 ## Sin publicar
+
+Metricas v2, parte C (TASK-065): agregados de la fila de metricas para elegir
+mejoras por cifras, sobre uno o varios proyectos.
+
+- `taskctl metricas --repo <ruta>` (repetible; por defecto el repo actual)
+  junta varios repos con la clave (proyecto, id): un mismo TASK-NNN en dos
+  repos no mezcla datos, y avisos y listas los nombran `proyecto/TASK-NNN`. Las
+  rutas se validan antes de leer (inexistente, sin `tareas/`, sin valor, dos
+  carpetas con el mismo nombre abortan; la misma carpeta repetida se lee una
+  vez). Con un solo repo stdout no cambia. `--repo` con `--escribir` aborta.
+- `--evolucion [--tramo N]`: las terminadas por dia de cierre (desempate por
+  proyecto y numero de ID) en tramos de N (20 por defecto), con la mediana de
+  minutos de plan a finish, rondas medias, IMPORTANTE por tarea, tokens de
+  revision y KB de peticion de revision por ronda, cada cifra con su n. Dice
+  cuantas quedan fuera sin fecha de cierre.
+- `--grupos`: por tipo, complejidad, criterios (0-4, 5-6, 7+), terciles de KB
+  de peticion por ronda (con todos los proyectos juntos) y proyecto, con %
+  aprobado a la primera (una ronda, `aprobada` o `aprobada-con-correcciones`),
+  rondas medias y CRITICO+IMPORTANTE por tarea; las tareas sin revision o sin
+  tabla de hallazgos se cuentan aparte. Un grupo vacio sale con 0.
+- `--json`: un unico objeto `{proyectos, sinCoste, evolucion?, grupos?}`, tambien
+  sin tareas, sin NaN y con cada null junto a un n 0; solo se combina con
+  `--repo`, `--evolucion`, `--tramo` y `--grupos` (con otro flag aborta sin
+  leer ni escribir nada).
+- La lista de terminadas sin coste da el recuento por fase y las 10 primeras
+  («y N mas»; completa en `--json`) (MEN-4 de TASK-064). El README del plugin
+  documenta columnas, avisos y flags de `metricas`.
+- Un flag repetido que no admite repeticion aborta con error en cualquier
+  comando (antes se quedaba el ultimo valor); `--repo` y `--agente` usan el
+  mismo lector de flags repetibles.
+- `registrar-coste --agente <id>` con un id ya anotado en `## Coste` de esa
+  fase (un agente reanudado, cuya transcripcion acumula los dos trabajos)
+  registra solo la diferencia entre la transcripcion y lo ya anotado para ese
+  id, campo a campo, en una fila con fuente `agente:dif:<id>`; `metricas` no
+  la avisa como repetida. Sin crecimiento, o con el id anotado junto a otros en
+  una misma fila, aborta sin tocar nada. Ajusta la regla de MEN-2 de TASK-063.
+
 - TASK-064 (feature) — Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas (2026-10-25)
 
 Metricas v2, parte B (TASK-064): `taskctl metricas` lee lo que capturo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 0da4c56..e41b643 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -580,6 +580,77 @@ y `<!-- taskctl metricas --tokens: fin -->` (si no están, los añade al final;
 el resto del fichero, CRLF incluido, no cambia ni un byte) y no lo commitea,
 como `board --escribir`. No se combina con `--heuristica`.
 
+**Columnas de la tabla por tarea.** `id`, `complejidad`, `diseno`, `curso`,
+`revision` (duraciones), `rondas` (número de la última ronda con informe; «—»
+sin revisión), `crit`, `imp`, `men` (hallazgos CRÍTICO, IMPORTANTE y MENOR de
+todos los informes `informe-revision-N[-<revisor>].md`, cada uno **una vez por
+tarea** con clave revisor + ID), `hall_origen` (implementación/plan/
+especificación/sin clasificar, de la columna `Origen`), `cierre` (día del último
+`finish`) y `origen` (`registro`, `git` o «—»). Un informe sin tabla de hallazgos
+deja `crit`/`imp`/`men`/`hall_origen` en «—»: sin dato, no cero. Con `--tokens`,
+además `tok_diseno`, `tok_curso`, `tok_revision`, `tok_total` y el desglose de
+`## Coste`: `tok_nuevos` (entrada + escritura de caché + salida),
+`tok_cache_lect` (lectura de caché, aparte) y `tok_sin_desglose`
+(`tokens_<fase>` menos lo desglosado; un negativo no se recorta a 0 y la celda
+lleva `*`). Con varios `--repo`, la tabla abre con la columna `proyecto`.
+
+Bajo la tabla: cuántos informes no tienen tabla de hallazgos, la mediana de
+lecturas por fase y las **terminadas sin coste** en alguna fase, con el recuento
+por fase y las 10 primeras («y N más»; la lista completa sale en `--json`).
+
+**Avisos** (por stderr, con `[AVISO]`; ninguno cambia el código de salida ni
+impide `--escribir`, salvo un `tarea.md` inválido): `tarea.md` inválido (la
+tarea no aparece), `git log` que no se pudo consultar, `tokens_<fase>` vacío con
+filas en `## Coste`, desglose mayor que el total, un agente repetido en una
+fase de `## Coste` (salvo las filas de diferencia de un agente reanudado, ver
+`registrar-coste`), una severidad fuera de vocabulario (con la tarea y el
+fichero) e informes sin tabla de hallazgos. Con varios repos, cada tarea se
+nombra `proyecto/TASK-NNN`.
+
+**Varios proyectos: `--repo <ruta>`** (repetible; relativa al directorio actual;
+por defecto, el repo actual). Junta varios repos con la clave (proyecto, id): un
+mismo `TASK-NNN` en dos repos no mezcla datos. El proyecto es el nombre de la
+carpeta. Antes de leer nada aborta si una ruta no existe, no tiene `tareas/`,
+`--repo` va sin valor o dos carpetas distintas se llaman igual; la misma carpeta
+escrita dos veces (otra grafía, otras mayúsculas en Windows) se lee una vez, con
+aviso. Por stderr sale `Repos leidos: <proyecto> (N tareas, <ruta>); ...`. Con un
+solo repo, stdout es el de siempre. `--repo` con `--escribir` aborta sin tocar
+nada.
+
+**`--evolucion [--tramo N]`** sustituye la tabla por la evolución de las tareas
+terminadas: ordenadas por día de cierre (solo el día; desempate por proyecto y
+por número de ID, `TASK-99` antes que `TASK-100`) y en tramos de N (20 por
+defecto; `--tramo` exige un entero de 1 o más). Por tramo: tareas, días de
+cierre, mediana de minutos de plan a finish (de las que tienen hora en las dos
+marcas; las de solo día se cuentan en «solo dia»), rondas medias, hallazgos
+IMPORTANTE por tarea, tokens de revisión medios y KB medios de la petición de
+revisión por ronda. Cada cifra lleva su `n` (las tareas que tienen ese dato);
+«— (n=0)» es que ninguna lo tiene. Dice cuántas terminadas quedan fuera por no
+tener fecha de cierre (por proyecto con varios repos).
+
+**`--grupos`** sustituye la tabla por grupos de tareas terminadas: por tipo, por
+complejidad declarada, por número de criterios (0-4, 5-6, 7 o más), por KB de
+petición de revisión por ronda (terciles calculados con todos los proyectos
+juntos, cortados por valor; las tareas sin petición quedan fuera y se cuentan) y
+por proyecto. Por grupo: tareas, con revisión, % aprobado a la primera (una sola
+ronda con veredicto `aprobada` o `aprobada-con-correcciones`, sobre las que
+tienen revisión), rondas medias, CRÍTICO+IMPORTANTE por tarea (de las que tienen
+tabla de hallazgos) y, aparte, las tareas sin revisión y las revisadas sin tabla
+de hallazgos. Los grupos son fijos: uno sin tareas sale con 0 y «—».
+`--evolucion` y `--grupos` se combinan entre sí y con `--repo`, no con
+`--heuristica`, `--tokens` ni `--escribir`.
+
+**`--json`** escribe en stdout un único objeto JSON
+(`{proyectos: [{proyecto, ruta, tareas}], sinCoste: {terminadas, total, porFase,
+tareas}, evolucion?, grupos?}`), también sin tareas; los avisos y la lista de
+repos van por stderr. Cada `null` va junto a un `n: 0` en el mismo objeto; nunca
+`NaN`. Solo se combina con `--repo`, `--evolucion`, `--tramo` y `--grupos`: con
+cualquier otro flag aborta sin leer ni escribir nada.
+
+En cualquier comando de `taskctl`, un flag repetido que no admite repetición
+(todos salvo `--repo`, `--agente` y `--criterio`) aborta con error en vez de
+quedarse con el último valor.
+
 `taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision
 (--agente <id>... | --tokens N) [--push]` **suma** al coste de esa fase
 (`tokens_diseno`, `tokens_implementacion`, `tokens_revision` del `tarea.md`;
@@ -591,7 +662,12 @@ herramienta Agent) `taskctl` lee la transcripción del subagente en
 `<config>/projects/*/*/subagents/agent-<id>.jsonl` (`<config>` = `CLAUDE_CONFIG_DIR`
 o `~/.claude`) y suma, por `message.id` único (la última aparición), entrada +
 escritura y lectura de caché + salida de cada llamada. Varios `--agente` van en
-un solo registro y un solo commit. `--tokens N` da una cifra a mano (la parte del
+un solo registro y un solo commit. Un `--agente` ya anotado en `## Coste` de esa
+fase es un agente reanudado (su transcripción acumula los dos trabajos): se suma
+solo lo que creció su transcripción desde lo ya anotado para ese id, y la fila lo
+marca en su fuente (`agente:dif:<id>`), que `metricas` no avisa como repetida; si
+no ha crecido, o el id está anotado junto a otros en una misma fila, aborta.
+`--tokens N` da una cifra a mano (la parte del
 orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
 en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
 (`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
index aa1842f..d00a41e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
@@ -63,10 +63,17 @@ cuantas lecturas de ficheros hicieron); con `--tokens N`, una fila `manual`
 con solo el total. No la edites a mano: el total de la fase sigue siendo el
 campo `tokens_<fase>`, y la tabla es su desglose.
 
-El mismo `--agente` registrado dos veces en la misma fase suma dos veces y
-deja dos filas: no se deduplica. `taskctl metricas` lo avisa (y avisa tambien
-si lo desglosado supera a `tokens_<fase>`); si fue un error, corrige el total y
-quita la fila sobrante.
+Un agente que se **reanuda** (el mismo id, otra vez con la herramienta Agent)
+acumula en su transcripcion los dos trabajos. Por eso, si el `--agente` ya esta
+anotado en `## Coste` de esa fase, `registrar-coste` suma solo lo que crecio la
+transcripcion desde lo ya anotado para ese id, y la fila lo marca en su fuente
+(`agente:dif:<id>`): registra cada tramo de trabajo al terminarlo, sin miedo a
+contarlo doble. Si la transcripcion no ha crecido, aborta (no hay nada nuevo);
+si el id esta anotado junto a otros en una misma fila, aborta y pide la cifra
+con `--tokens N`. Una fila repetida de verdad (dos filas sin `dif:` del mismo
+agente en una fase, de antes o editadas a mano) la avisa `taskctl metricas`
+(igual que si lo desglosado supera a `tokens_<fase>`); si fue un error, corrige
+el total y quita la fila sobrante.
 
 `taskctl finish` avisa, sin bloquear, si falta el coste de diseno, de
 implementacion (vacio o a 0) o de revision. `taskctl metricas --tokens` lo tabula por tarea, por sprint y por
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 5842a9c..84864f0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -70,7 +70,8 @@ Uso:
                  [--sprint N] [--complejidad ...] [--modelo-sugerido ...] \\
                  [--agente-revisor ...]
   taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
-  taskctl metricas [--heuristica] [--tokens [--escribir]]
+  taskctl metricas [--heuristica] [--tokens [--escribir]] [--repo <ruta>]...
+  taskctl metricas [--evolucion [--tramo N]] [--grupos] [--json] [--repo <ruta>]...
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--decidido-por persona|automatico] [--push]
@@ -102,12 +103,17 @@ en las tareas terminadas. --tokens anade el coste en tokens por fase, el desglos
 de "## Coste" (tokens nuevos, lectura de cache y lo que queda sin desglose) y un
 resumen por sprint y por complejidad; con --escribir lo
 regenera en el bloque delimitado de docs/METRICAS.md (sin commitear). Sin
---escribir solo lee.
+--escribir solo lee. --repo <ruta> (repetible) junta varios proyectos; --evolucion
+[--tramo N] da las terminadas por tramos de cierre y --grupos las agrupa por tipo,
+complejidad, criterios, KB de peticion de revision y proyecto; --json da un unico
+objeto JSON (solo con --repo, --evolucion, --tramo y --grupos).
+Un flag repetido que no admite repeticion aborta en cualquier comando.
 registrar-coste SUMA al coste de una fase de la tarea (en cualquier estado) y lo commitea:
 --agente <id> lee lo gastado de la transcripcion de cada subagente (el id lo devuelve la
 herramienta Agent); --tokens N da una cifra a mano. Se excluyen, y 0 se rechaza. Cada
 llamada deja ademas una fila en la tabla "## Coste" de tarea.md: con --agente, el desglose
 (entrada, cache_escritura, cache_lectura, salida, lecturas); con --tokens, solo el total.
+Un --agente ya anotado en esa fase (agente reanudado) suma solo lo que crecio su transcripcion.
 finish cierra con merge normal (lo de siempre). --tag <nombre> pone un tag anotado (titulo de
 la tarea) sobre el commit de merge; solo se sube con --push. --merge-request sube la rama
 y abre un PR (github.com, gh) o un MR (host con "gitlab", glab) contra la rama base en lugar
@@ -366,9 +372,11 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
   }
 
   if (GUARDADOS_POR_CADENA.has(cmd)) {
-    const { testigo, resto } = extraerCadena(argv.slice(1));
+    let resto: string[];
     try {
-      await verificarCadena(process.cwd(), testigo);
+      const extraida = extraerCadena(argv.slice(1));
+      resto = extraida.resto;
+      await verificarCadena(process.cwd(), extraida.testigo);
     } catch (e) {
       if (e instanceof CadenaCommandError || e instanceof GitLaunchError || e instanceof GitCommandError) {
         printCliError(e);
@@ -492,10 +500,14 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     const tareasRoot = path.join(repoCwd, 'tareas');
     try {
       const result = await runMetricasCommand(tareasRoot, argv.slice(1), { repoCwd });
+      if (result.reposLeidos !== null) process.stderr.write(`${result.reposLeidos}
+`);
       for (const aviso of result.advertencias) {
         process.stderr.write(`[AVISO] ${aviso}\n`);
       }
-      if (result.output === '') {
+      if (result.json) {
+        process.stdout.write(`${result.output}\n`);
+      } else if (result.output === '') {
         process.stdout.write('No hay tareas que medir (o no hay ninguna tarea todavia).\n');
       } else {
         process.stdout.write(`${result.output}\n`);
@@ -781,6 +793,12 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         `Tarea ${r.id}: +${String(r.sumado)} tokens de ${r.fase}${r.agentes > 0 ? ` (${String(r.agentes)} subagente(s))` : ''}; total de la fase: ${String(r.total)} ` +
           `(${r.filePath}).\n`
       );
+      if (r.reanudados.length > 0) {
+        process.stdout.write(
+          `Ya anotado en ${r.fase}: ${r.reanudados.join(', ')}. Es un agente reanudado: se ha sumado solo lo ` +
+            'que crecio su transcripcion desde lo anotado (fila "agente:dif:<id>").\n'
+        );
+      }
       printAutoCommit(r.autoCommit);
       return 0;
     } catch (e) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index ec23aac..8dc9cd4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -48,6 +48,41 @@ export function parseArgs(argv: readonly string[]): ParsedArgs {
   return { positional, flags };
 }
 
+/**
+ * Lector comun de flags repetibles (TASK-065): saca de argv todos los
+ * `--flag valor` / `--flag=valor` de `flag` (con su prefijo, p. ej.
+ * `--repo`) y devuelve sus valores en orden y el resto de argv intacto. Va
+ * ANTES de `parseArgs`, que se quedaria solo con el ultimo valor. Un `--flag`
+ * sin valor (al final, seguido de otro flag o con `--flag=` vacio) lanza el
+ * error que da `sinValor`.
+ */
+export function extraerRepetible(
+  argv: readonly string[],
+  flag: string,
+  sinValor: () => Error
+): { valores: string[]; resto: string[] } {
+  const valores: string[] = [];
+  const resto: string[] = [];
+  const conIgual = `${flag}=`;
+  for (let i = 0; i < argv.length; i++) {
+    const arg = argv[i] as string;
+    let valor: string | undefined;
+    if (arg === flag) {
+      valor = argv[i + 1];
+      if (valor === undefined || valor.startsWith('--')) throw sinValor();
+      i++;
+    } else if (arg.startsWith(conIgual)) {
+      valor = arg.slice(conIgual.length);
+    } else {
+      resto.push(arg);
+      continue;
+    }
+    if (valor.trim() === '') throw sinValor();
+    valores.push(valor);
+  }
+  return { valores, resto };
+}
+
 /**
  * Aborta si argv trae un flag que el comando no conoce (TASK-047, auditoria
  * D4). Antes `--complejida trivial` se ignoraba en silencio y la tarea salia
@@ -59,9 +94,29 @@ export function parseArgs(argv: readonly string[]): ParsedArgs {
  * `--x` justo despues de un flag con valor tambien se comprueba — es lo que
  * `parseArgs` haria con el; para pasar un valor que empieza por `--` esta
  * `--flag=valor`. `validos` va con su prefijo (`--titulo`, `-p`).
+ *
+ * TASK-065: tambien aborta si un flag valido aparece dos veces y no esta en
+ * `FLAGS_REPETIBLES`.
+ */
+/**
+ * Flags que SI admiten repeticion (TASK-065): se leen con `extraerRepetible`
+ * (o con su propio lector, `--criterio` de `new`) y cada aparicion suma. Los
+ * demas, repetidos, abortan en `rechazarFlagsDesconocidos`: `parseArgs` se
+ * queda con el ultimo y pisaria el anterior sin decir nada.
  */
+export const FLAGS_REPETIBLES: readonly string[] = ['--agente', '--repo', '--criterio'];
+
 /** Flags booleanos del CLI: los comandos solo reconocen el token suelto. */
-const FLAGS_SIN_VALOR: readonly string[] = ['--push', '--json', '--forzar', '--escribir', '--heuristica', '--merge-request'];
+const FLAGS_SIN_VALOR: readonly string[] = [
+  '--push',
+  '--json',
+  '--forzar',
+  '--escribir',
+  '--heuristica',
+  '--merge-request',
+  '--evolucion',
+  '--grupos',
+];
 
 export function rechazarFlagsDesconocidos(
   argv: readonly string[],
@@ -69,6 +124,7 @@ export function rechazarFlagsDesconocidos(
   comando: string,
   fail: (mensaje: string) => Error
 ): void {
+  const vistos = new Set<string>();
   for (const arg of argv) {
     let flag: string;
     if (arg.startsWith('--')) {
@@ -80,6 +136,15 @@ export function rechazarFlagsDesconocidos(
       continue;
     }
     if (validos.includes(flag)) {
+      // TASK-065: un flag repetido que no admite repeticion aborta, en vez de
+      // quedarse con el ultimo valor sin avisar.
+      if (vistos.has(flag) && !FLAGS_REPETIBLES.includes(flag)) {
+        throw fail(
+          `[ERROR] taskctl ${comando}: "${flag}" esta repetido y no admite repeticion ` +
+            '(el ultimo valor pisaria al anterior). Pasalo una sola vez.'
+        );
+      }
+      vistos.add(flag);
       // MENOR-1 de la revision de TASK-047: `--push=1` o `--json=1` pasaban
       // la guarda y el comando, que mira el token suelto, los ignoraba.
       if (flag !== arg && FLAGS_SIN_VALOR.includes(flag)) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index e1486f6..6d9a407 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -239,6 +239,12 @@ export function extraerCadena(argv: readonly string[]): { testigo: string | unde
   let testigo: string | undefined;
   for (let i = 0; i < argv.length; i++) {
     const a = argv[i] as string;
+    // TASK-065: un --cadena repetido no se pisa en silencio.
+    if (testigo !== undefined && (a === '--cadena' || a.startsWith('--cadena='))) {
+      throw new CadenaCommandError(
+        '[ERROR] --cadena esta repetido y no admite repeticion: pasa el testigo una sola vez.'
+      );
+    }
     if (a === '--cadena') {
       testigo = argv[i + 1] ?? '';
       i++;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index 7ff635e..5697168 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -26,11 +26,16 @@
  * de vocabulario y los informes sin tabla salen como avisos; ninguno impide
  * `--escribir` (solo lo impide un tarea.md invalido, que dejaria el bloque
  * incompleto).
+ *
+ * TASK-065: `--repo <ruta>` (repetible) junta varios proyectos; cada fila
+ * lleva su proyecto y toda la lectura va con la clave (proyecto, id), asi que
+ * un mismo TASK-NNN en dos repos no mezcla datos. Sin `--repo` se lee el repo
+ * actual y la salida es la de siempre.
  */
 import path from 'node:path';
-import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
+import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
 import type { InformeLeido } from '../core/informe-revision.js';
-import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos, extraerRepetible } from '../cli/args.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError, TASK_COMPLEXITIES } from '../core/task.js';
 import { cargarHeuristica, nivelHeuristico, puntuarTarea } from '../core/heuristica.js';
@@ -40,10 +45,12 @@ import {
   COLUMNAS_METRICAS,
   COLUMNAS_TOKENS,
   COLUMNAS_DESGLOSE_TOKENS,
+  COLUMNA_PROYECTO,
   NOTA_DESGLOSE_TOKENS,
   avisosDeFila,
   avisoInformesSinTabla,
   claveTarea,
+  etiquetaTarea,
   notasFilaEnriquecida,
   BloqueTokensError,
   NOTA_TOKENS,
@@ -56,6 +63,8 @@ import {
   formatearTabla,
   parsearLogGit,
   resumirPorNivel,
+  resumenSinCoste,
+  type ResumenSinCoste,
   type EventoGit,
   type FilaMetricas,
 } from '../core/metricas.js';
@@ -67,10 +76,29 @@ import {
 } from '../fs/rondas.js';
 import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
 import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
+import { TRAMO_POR_DEFECTO, calcularEvolucion, formatearEvolucion, type Evolucion } from '../core/evolucion.js';
+import { calcularGrupos, formatearGrupos, type Grupos } from '../core/grupos-metricas.js';
 
 export class MetricasCommandError extends Error {}
 
-export const FLAGS_METRICAS: readonly string[] = ['--heuristica', '--tokens', '--escribir'];
+export const FLAGS_METRICAS: readonly string[] = [
+  '--heuristica',
+  '--tokens',
+  '--escribir',
+  '--repo',
+  '--evolucion',
+  '--tramo',
+  '--grupos',
+  '--json',
+];
+
+/**
+ * TASK-065: los unicos flags que se combinan con `--json`. Con cualquier otro
+ * (`--escribir`, `--tokens`, `--heuristica`) aborta antes de leer ni escribir
+ * nada: su salida es texto o un fichero, y mezclarla con el JSON romperia a
+ * quien lo lea.
+ */
+export const FLAGS_CON_JSON: readonly string[] = ['--repo', '--evolucion', '--tramo', '--grupos'];
 
 /** Ruta de docs/METRICAS.md dentro del repo del usuario. */
 export function metricasFilePath(repoCwd: string): string {
@@ -86,6 +114,33 @@ export interface MetricasCommandResult {
   metricasPath: string | null;
   /** Que paso con el bloque: 'sin-cambios' si regenerarlo no cambio ni un byte. */
   escritura: 'creado' | 'actualizado' | 'sin-cambios' | null;
+  /** TASK-065: true con `--json`: `output` es UN objeto JSON y va entero por stdout. */
+  json: boolean;
+  /**
+   * TASK-065: con `--repo`, una linea para stderr con los repos leidos y las
+   * tareas de cada uno (para ver que no se ha quedado ninguno fuera); null
+   * sin `--repo` (la salida de siempre).
+   */
+  reposLeidos: string | null;
+}
+
+/**
+ * TASK-065: la forma de `--json`. Contrato publico: cambiarla rompe a quien
+ * lo lea. Cada null va junto a un n 0 en el mismo objeto (ver `Cifra` y
+ * `GrupoMetricas`); nunca NaN.
+ */
+export interface SalidaJsonMetricas {
+  proyectos: { proyecto: string; ruta: string; tareas: number }[];
+  sinCoste: ResumenSinCoste;
+  evolucion?: Evolucion;
+  grupos?: Grupos;
+}
+
+/** Un repo que se mide: su nombre de proyecto, su raiz y su carpeta de tareas. */
+export interface RepoMetricas {
+  proyecto: string;
+  ruta: string;
+  tareasRoot: string;
 }
 
 /** MENOR-2 de la revision: hay tareas, pero ninguna entra en la muestra. */
@@ -94,7 +149,7 @@ export const MUESTRA_HEURISTICA_VACIA =
   'comparar la heuristica. Sin --heuristica salen todas las tareas.';
 
 export interface MetricasCommandDeps {
-  /** Raiz del repo donde se consulta git log. */
+  /** Raiz del repo donde se consulta git log (y contra la que se resuelve un --repo relativo). */
   repoCwd: string;
   /** Ruta del YML de la heuristica (tests); por defecto la del plugin. */
   rutaHeuristica?: string;
@@ -109,6 +164,32 @@ interface FlagsMetricas {
   heuristica: boolean;
   tokens: boolean;
   escribir: boolean;
+  /** Valores de `--repo` tal cual (vacio = el repo actual). */
+  repos: string[];
+  /** TASK-065: tamano de tramo de `--evolucion`; null sin `--evolucion`. */
+  evolucion: number | null;
+  /** TASK-065: `--grupos`. */
+  grupos: boolean;
+  /** TASK-065: `--json`. */
+  json: boolean;
+}
+
+/** `--tramo N`: entero >= 1 (por defecto 20); cualquier otra cosa aborta. */
+function leerTramo(raw: string | boolean | undefined, conEvolucion: boolean): number {
+  if (raw === undefined) return TRAMO_POR_DEFECTO;
+  if (!conEvolucion) {
+    throw new MetricasCommandError(
+      '[ERROR] --tramo solo se admite con --evolucion: es el numero de tareas de cada tramo ' +
+        '(taskctl metricas --evolucion --tramo 10).'
+    );
+  }
+  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1) {
+    throw new MetricasCommandError(
+      `[ERROR] --tramo ${typeof raw === 'string' ? `"${raw}" no es` : 'necesita'} un entero de 1 o mas: ` +
+        `las tareas de cada tramo (por defecto ${String(TRAMO_POR_DEFECTO)}). No se ha leido nada.`
+    );
+  }
+  return Number(raw);
 }
 
 function flagSuelto(flags: Record<string, string | boolean>, nombre: string): boolean {
@@ -123,18 +204,58 @@ function flagSuelto(flags: Record<string, string | boolean>, nombre: string): bo
 }
 
 function parseFlagsMetricas(argv: readonly string[]): FlagsMetricas {
-  const { flags, positional } = parseArgs(argv);
+  const { valores: repos, resto } = extraerRepetible(
+    argv,
+    '--repo',
+    () =>
+      new MetricasCommandError(
+        '[ERROR] --repo necesita la ruta de un repo con carpeta "tareas" (taskctl metricas --repo <ruta>); ' +
+          'repitelo para juntar varios proyectos.'
+      )
+  );
+  const { flags, positional } = parseArgs(resto);
   if (positional.length > 0) {
     throw new MetricasCommandError(
       `[ERROR] taskctl metricas no admite argumentos sueltos ("${positional.join(' ')}"). ` +
         'Saca la tabla de todas las tareas; para una sola, filtra la salida.'
     );
   }
+  const json = flagSuelto(flags, 'json');
+  if (json) {
+    const otros = Object.keys(flags)
+      .map((k) => `--${k}`)
+      .filter((k) => k !== '--json' && !FLAGS_CON_JSON.includes(k));
+    if (otros.length > 0) {
+      throw new MetricasCommandError(
+        `[ERROR] --json no se combina con ${otros.join(', ')}: solo con ${FLAGS_CON_JSON.join(', ')}. ` +
+          'Quita uno de los dos; no se ha leido ni escrito nada.'
+      );
+    }
+  }
   const f = {
     heuristica: flagSuelto(flags, 'heuristica'),
     tokens: flagSuelto(flags, 'tokens'),
     escribir: flagSuelto(flags, 'escribir'),
+    repos,
+    evolucion: null as number | null,
+    grupos: flagSuelto(flags, 'grupos'),
+    json,
   };
+  const conEvolucion = flagSuelto(flags, 'evolucion');
+  const tramo = leerTramo(flags['tramo'], conEvolucion);
+  if (conEvolucion) f.evolucion = tramo;
+  if (conEvolucion || f.grupos) {
+    // Los agregados sustituyen a la tabla por tarea: lo que anaden --heuristica
+    // y --tokens (columnas y resumenes de esa tabla) no saldria en ningun sitio.
+    const choca = (['heuristica', 'tokens', 'escribir'] as const).filter((k) => f[k]);
+    if (choca.length > 0) {
+      const agregado = conEvolucion ? '--evolucion' : '--grupos';
+      throw new MetricasCommandError(
+        `[ERROR] ${agregado} no se combina con ${choca.map((k) => `--${k}`).join(' ni ')}: saca agregados ` +
+          'en lugar de la tabla por tarea. Lanzalos por separado.'
+      );
+    }
+  }
   if (f.escribir && !f.tokens) {
     throw new MetricasCommandError(
       '[ERROR] --escribir solo se admite con --tokens: lo que regenera es el bloque de coste en ' +
@@ -151,6 +272,15 @@ function parseFlagsMetricas(argv: readonly string[]): FlagsMetricas {
         'Quita --heuristica, o quita --escribir para verlo por pantalla.'
     );
   }
+  // TASK-065: --escribir regenera docs/METRICAS.md del repo actual; con --repo
+  // no esta claro de cual, asi que no se escribe nada.
+  if (f.escribir && repos.length > 0) {
+    throw new MetricasCommandError(
+      '[ERROR] --repo no se combina con --escribir: el bloque de docs/METRICAS.md es del repo donde ' +
+        'ejecutas el comando. Quita --repo y ejecutalo desde ese repo, o quita --escribir para ' +
+        'verlo por pantalla. No se ha tocado nada.'
+    );
+  }
   return f;
 }
 
@@ -193,41 +323,100 @@ function eventosGit(repoCwd: string): EventoGit[] | null {
   }
 }
 
-export async function runMetricasCommand(
-  tareasRoot: string,
-  argv: readonly string[],
-  deps: MetricasCommandDeps
-): Promise<MetricasCommandResult> {
-  rechazarFlagsDesconocidos(argv, FLAGS_METRICAS, 'metricas', (m) => new MetricasCommandError(m));
-  const { heuristica: conHeuristica, tokens: conTokens, escribir } = parseFlagsMetricas(argv);
-  // Como board --escribir: sin tareas/ en este directorio no se crea un
-  // docs/METRICAS.md fantasma.
-  if (escribir) {
+/** Clave con la que se comparan dos rutas reales: en Windows, sin distinguir mayusculas. */
+function claveRuta(ruta: string): string {
+  return process.platform === 'win32' ? ruta.toLowerCase() : ruta;
+}
+
+/**
+ * Los repos de `--repo` (TASK-065), validados ANTES de leer nada: cada ruta
+ * (relativa a `base`) debe existir y tener carpeta `tareas`. Se normalizan con
+ * la ruta real, asi que la misma carpeta escrita dos veces (otra grafia, otras
+ * mayusculas en Windows, un enlace) se lee una vez y lo dice un aviso; dos
+ * carpetas distintas con el mismo nombre abortan, porque el proyecto se llama
+ * como su carpeta y sus tareas se confundirian.
+ */
+export async function resolverRepos(
+  valores: readonly string[],
+  base: string
+): Promise<{ repos: RepoMetricas[]; avisos: string[] }> {
+  const repos: RepoMetricas[] = [];
+  const avisos: string[] = [];
+  const porRuta = new Map<string, string>();
+  const porNombre = new Map<string, string>();
+  for (const valor of valores) {
+    const ruta = path.resolve(base, valor);
+    let real: string;
     try {
-      await stat(tareasRoot);
+      real = await realpath(ruta);
     } catch (e: unknown) {
-      if (!isEnoent(e)) throw e;
+      if (!isEnoent(e) && !isEnotdir(e)) throw e;
       throw new MetricasCommandError(
-        `[ERROR] No existe "${tareasRoot}", asi que esto no parece la raiz de un repo con tareas. ` +
-          'Ejecuta "taskctl metricas --tokens --escribir" desde la raiz del repo (donde esta la ' +
-          'carpeta "tareas"), no desde una subcarpeta.'
+        `[ERROR] --repo "${valor}": no existe ${ruta}. Revisa la ruta; no se ha leido nada.`
+      );
+    }
+    const tareasRoot = path.join(real, 'tareas');
+    let esCarpeta = false;
+    try {
+      esCarpeta = (await stat(tareasRoot)).isDirectory();
+    } catch (e: unknown) {
+      if (!isEnoent(e) && !isEnotdir(e)) throw e;
+    }
+    if (!esCarpeta) {
+      throw new MetricasCommandError(
+        `[ERROR] --repo "${valor}": ${real} no tiene carpeta "tareas", asi que no es la raiz de un repo ` +
+          'con tareas. Pasa la raiz del repo; no se ha leido nada.'
+      );
+    }
+    const previo = porRuta.get(claveRuta(real));
+    if (previo !== undefined) {
+      avisos.push(`--repo "${valor}" es la misma carpeta que --repo "${previo}" (${real}): se lee una sola vez.`);
+      continue;
+    }
+    const proyecto = path.basename(real);
+    const otro = porNombre.get(claveRuta(proyecto));
+    if (otro !== undefined) {
+      throw new MetricasCommandError(
+        `[ERROR] --repo: ${otro} y ${real} se llaman igual ("${proyecto}"), y el proyecto de cada tarea ` +
+          'es el nombre de su carpeta: sus tareas se confundirian. Mide uno de los dos, o renombra ' +
+          'o clona uno con otro nombre. No se ha leido nada.'
       );
     }
+    porRuta.set(claveRuta(real), valor);
+    porNombre.set(claveRuta(proyecto), real);
+    repos.push({ proyecto, ruta: real, tareasRoot });
   }
-  // La heuristica se carga ANTES de leer nada: un YML roto aborta sin
-  // haber sacado media tabla.
-  const h = conHeuristica ? cargarHeuristica(deps.rutaHeuristica) : null;
+  return { repos, avisos };
+}
 
-  const advertencias: string[] = [];
+type TareaLeida = NonNullable<Awaited<ReturnType<typeof readTareaFile>>>;
+
+export interface LecturaRepo {
+  /** Las tareas leidas, en el mismo orden que `filas` (--heuristica las puntua con su cuerpo). */
+  leidas: TareaLeida[];
+  filas: FilaMetricas[];
+  advertencias: string[];
   /** Solo los tarea.md invalidos: son lo unico que impide --escribir. */
+  invalidas: string[];
+}
+
+/**
+ * Lee UN repo (TASK-065): sus tareas, sus informes y peticiones de revision
+ * y, solo si alguna tarea no tiene registro de Transiciones, un `git log`.
+ * Cada fila lleva su proyecto, asi que juntar varios repos no cruza tareas
+ * con el mismo ID. `varios` solo cambia como se nombran las tareas en los
+ * avisos (`proyecto/ID`).
+ */
+export async function leerRepoMetricas(repo: RepoMetricas, varios: boolean): Promise<LecturaRepo> {
+  const advertencias: string[] = [];
   const invalidas: string[] = [];
-  const proyecto = path.basename(path.resolve(deps.repoCwd));
+  const { proyecto, tareasRoot } = repo;
   const ids = [...new Set(await listExistingTaskIds(tareasRoot))].sort(
     (a, b) => Number(a.slice(5)) - Number(b.slice(5))
   );
 
   const leidas: {
-    task: NonNullable<Awaited<ReturnType<typeof readTareaFile>>>;
+    task: TareaLeida;
     ronda: number;
     informes: InformeLeido[];
     peticiones: { ronda: number; bytes: number }[];
@@ -245,7 +434,9 @@ export async function runMetricasCommand(
       });
     } catch (e: unknown) {
       if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
-        const aviso = `${id} tiene un tarea.md invalido y no aparece en las metricas: ${e.message}`;
+        const aviso =
+          `${etiquetaTarea({ proyecto, id }, varios)} tiene un tarea.md invalido y no aparece en las ` +
+          `metricas: ${e.message}`;
         advertencias.push(aviso);
         invalidas.push(aviso);
         continue;
@@ -254,15 +445,18 @@ export async function runMetricasCommand(
     }
   }
 
-  // git solo si hace falta, y una sola vez.
+  // git solo si hace falta, y una sola vez por repo.
   const sinRegistro = leidas.some((l) => leerTransiciones(l.task.body).length === 0);
   let porId = new Map<string, EventoGit[]>();
   if (sinRegistro) {
-    const eventos = eventosGit(deps.repoCwd);
+    const eventos = eventosGit(repo.ruta);
     if (eventos === null) {
       advertencias.push(
-        'No se pudo consultar git log: las tareas sin registro de Transiciones salen con "—". ' +
-          'Ejecuta taskctl metricas desde la raiz del repo.'
+        varios
+          ? `${proyecto}: no se pudo consultar git log en ${repo.ruta}: sus tareas sin registro de ` +
+              'Transiciones salen con "—" (y sin fecha de cierre). Comprueba que es un repo git.'
+          : 'No se pudo consultar git log: las tareas sin registro de Transiciones salen con "—". ' +
+              'Ejecuta taskctl metricas desde la raiz del repo.'
       );
     } else {
       porId = new Map();
@@ -274,7 +468,7 @@ export async function runMetricasCommand(
     }
   }
 
-  let filas: FilaMetricas[] = leidas.map((l) =>
+  const filas: FilaMetricas[] = leidas.map((l) =>
     calcularFila({
       task: l.task.task,
       body: l.task.body,
@@ -286,15 +480,125 @@ export async function runMetricasCommand(
     })
   );
   // Los avisos de las filas, sobre TODAS las tareas (tambien con --heuristica).
-  for (const f of filas) advertencias.push(...avisosDeFila(f));
-  const sinTabla = avisoInformesSinTabla(filas);
+  for (const f of filas) advertencias.push(...avisosDeFila(f, varios));
+  return { leidas: leidas.map((l) => l.task), filas, advertencias, invalidas };
+}
+
+export async function runMetricasCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  deps: MetricasCommandDeps
+): Promise<MetricasCommandResult> {
+  rechazarFlagsDesconocidos(argv, FLAGS_METRICAS, 'metricas', (m) => new MetricasCommandError(m));
+  const {
+    heuristica: conHeuristica,
+    tokens: conTokens,
+    escribir,
+    repos: valoresRepo,
+    evolucion: tramoEvolucion,
+    grupos: conGrupos,
+    json,
+  } = parseFlagsMetricas(argv);
+  // Como board --escribir: sin tareas/ en este directorio no se crea un
+  // docs/METRICAS.md fantasma.
+  if (escribir) {
+    try {
+      await stat(tareasRoot);
+    } catch (e: unknown) {
+      if (!isEnoent(e)) throw e;
+      throw new MetricasCommandError(
+        `[ERROR] No existe "${tareasRoot}", asi que esto no parece la raiz de un repo con tareas. ` +
+          'Ejecuta "taskctl metricas --tokens --escribir" desde la raiz del repo (donde esta la ' +
+          'carpeta "tareas"), no desde una subcarpeta.'
+      );
+    }
+  }
+  // TASK-065: los --repo se validan antes de leer nada. Sin --repo, el repo
+  // actual tal cual (la salida de siempre).
+  const advertencias: string[] = [];
+  let repos: RepoMetricas[];
+  if (valoresRepo.length === 0) {
+    repos = [{ proyecto: path.basename(path.resolve(deps.repoCwd)), ruta: deps.repoCwd, tareasRoot }];
+  } else {
+    const r = await resolverRepos(valoresRepo, deps.repoCwd);
+    repos = r.repos;
+    advertencias.push(...r.avisos);
+  }
+  const varios = repos.length > 1;
+  // La heuristica se carga ANTES de leer nada: un YML roto aborta sin
+  // haber sacado media tabla.
+  const h = conHeuristica ? cargarHeuristica(deps.rutaHeuristica) : null;
+
+  /** Solo los tarea.md invalidos: son lo unico que impide --escribir. */
+  const invalidas: string[] = [];
+  let filas: FilaMetricas[] = [];
+  /** Tarea leida de cada fila, por clave (proyecto, id). */
+  const leidaPorClave = new Map<string, TareaLeida>();
+  const porRepo: string[] = [];
+  for (const repo of repos) {
+    const r = await leerRepoMetricas(repo, varios);
+    advertencias.push(...r.advertencias);
+    invalidas.push(...r.invalidas);
+    r.filas.forEach((f, i) => leidaPorClave.set(claveTarea(f.proyecto, f.id), r.leidas[i] as TareaLeida));
+    filas.push(...r.filas);
+    porRepo.push(`${repo.proyecto} (${String(r.filas.length)} tareas, ${repo.ruta})`);
+  }
+  const reposLeidos = valoresRepo.length === 0 ? null : `Repos leidos: ${porRepo.join('; ')}.`;
+  const sinTabla = avisoInformesSinTabla(filas, varios);
   if (sinTabla !== null) advertencias.push(sinTabla);
 
-  if (filas.length === 0) return { output: '', totalTareas: 0, advertencias, metricasPath: null, escritura: null };
+  const proyectos = repos.map((r) => r.proyecto);
+  // TASK-065: --json da UN objeto, tambien sin tareas: los repos leidos, las
+  // terminadas sin coste (la lista completa) y, si se piden, la evolucion y
+  // los grupos. Los avisos siguen por stderr.
+  if (json) {
+    const objeto: SalidaJsonMetricas = {
+      proyectos: repos.map((r) => ({
+        proyecto: r.proyecto,
+        ruta: r.ruta,
+        tareas: filas.filter((f) => f.proyecto === r.proyecto).length,
+      })),
+      sinCoste: resumenSinCoste(filas),
+      ...(tramoEvolucion === null ? {} : { evolucion: calcularEvolucion(filas, tramoEvolucion) }),
+      ...(conGrupos ? { grupos: calcularGrupos(filas, proyectos) } : {}),
+    };
+    return {
+      output: JSON.stringify(objeto),
+      totalTareas: filas.length,
+      advertencias,
+      metricasPath: null,
+      escritura: null,
+      reposLeidos,
+      json: true,
+    };
+  }
+
+  // TASK-065: los agregados sustituyen a la tabla por tarea, y salen tambien
+  // sin tareas (con sus ceros y sus n 0 a la vista).
+  if (tramoEvolucion !== null || conGrupos) {
+    const secciones: string[] = [];
+    if (tramoEvolucion !== null) secciones.push(formatearEvolucion(calcularEvolucion(filas, tramoEvolucion), varios));
+    if (conGrupos) secciones.push(formatearGrupos(calcularGrupos(filas, proyectos)));
+    return {
+      output: secciones.join('\n\n'),
+      totalTareas: filas.length,
+      advertencias,
+      metricasPath: null,
+      escritura: null,
+      reposLeidos,
+      json: false,
+    };
+  }
+
+  if (filas.length === 0) {
+    return { output: '', totalTareas: 0, advertencias, metricasPath: null, escritura: null, reposLeidos, json: false };
+  }
 
-  const columnas = conTokens
-    ? [...COLUMNAS_METRICAS, ...COLUMNAS_TOKENS, ...COLUMNAS_DESGLOSE_TOKENS]
-    : COLUMNAS_METRICAS;
+  const columnas = [
+    ...(varios ? [COLUMNA_PROYECTO] : []),
+    ...COLUMNAS_METRICAS,
+    ...(conTokens ? [...COLUMNAS_TOKENS, ...COLUMNAS_DESGLOSE_TOKENS] : []),
+  ];
   /** Los resumenes de tokens sobre las filas que salgan (con --heuristica, la muestra). */
   const seccionTokens = (f: readonly FilaMetricas[]): string[] => {
     if (!conTokens) return [];
@@ -351,7 +655,7 @@ export async function runMetricasCommand(
       output: [
         formatearTabla(filas, columnas),
         '',
-        ...notasFilaEnriquecida(filas),
+        ...notasFilaEnriquecida(filas, varios),
         '',
         ...seccionTokens(filas),
         NOTA_CALENDARIO,
@@ -360,17 +664,18 @@ export async function runMetricasCommand(
       advertencias,
       metricasPath,
       escritura,
+      reposLeidos,
+      json: false,
     };
   }
 
-  const cuerpoPorId = new Map(leidas.map((l) => [claveTarea(proyecto, l.task.task.id), l.task]));
   filas = filas.filter(enMuestraHeuristica).map((f) => {
-    const leida = cuerpoPorId.get(claveTarea(f.proyecto, f.id)) as NonNullable<Awaited<ReturnType<typeof readTareaFile>>>;
+    const leida = leidaPorClave.get(claveTarea(f.proyecto, f.id)) as TareaLeida;
     const { puntos } = puntuarTarea(leida.task, leida.body, h);
     return { ...f, heuristica: { puntos, nivel: nivelHeuristico(puntos, h) } };
   });
   if (filas.length === 0) {
-    return { output: MUESTRA_HEURISTICA_VACIA, totalTareas: 0, advertencias, metricasPath, escritura };
+    return { output: MUESTRA_HEURISTICA_VACIA, totalTareas: 0, advertencias, metricasPath, escritura, reposLeidos, json: false };
   }
   const coinciden = filas.filter((f) => f.heuristica?.nivel === f.complejidad).length;
   const salida = [
@@ -387,10 +692,10 @@ export async function runMetricasCommand(
       resumirPorNivel(filas, (f) => f.heuristica?.nivel ?? null, TASK_COMPLEXITIES)
     ),
     '',
-    ...notasFilaEnriquecida(filas),
+    ...notasFilaEnriquecida(filas, varios),
     '',
     ...seccionTokens(filas),
     NOTA_CALENDARIO,
   ].join('\n');
-  return { output: salida, totalTareas: filas.length, advertencias, metricasPath, escritura };
+  return { output: salida, totalTareas: filas.length, advertencias, metricasPath, escritura, reposLeidos, json: false };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index 1d0dc41..9b25c8a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -36,12 +36,20 @@
  *    `--tokens N`, una fila `manual` con solo el total.
  */
 import { writeFile } from 'node:fs/promises';
-import { rechazarFlagsDesconocidos, parseArgs } from '../cli/args.js';
+import { rechazarFlagsDesconocidos, parseArgs, extraerRepetible } from '../cli/args.js';
 import { readTareaFile } from '../fs/task-store.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
 import type { Task } from '../core/task.js';
 import { esAgentIdValido, sumarUsoTranscripcion } from '../core/coste-transcripcion.js';
-import { anadirCoste, FASES_COSTE, type FaseCoste, type FilaCoste } from '../core/coste-registro.js';
+import {
+  anadirCoste,
+  FASES_COSTE,
+  PREFIJO_DIFERENCIA,
+  idsDeFuente,
+  leerCostes,
+  type FaseCoste,
+  type FilaCoste,
+} from '../core/coste-registro.js';
 import { formatearInstante } from '../core/transiciones.js';
 import { buscarTranscripciones, directorioConfigClaude, leerTranscripcion } from '../fs/transcripciones.js';
 import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
@@ -83,6 +91,8 @@ export interface RegistrarCosteCommandResult {
   total: number;
   /** Cuantos subagentes se han leido de su transcripcion (0 con --tokens). */
   agentes: number;
+  /** TASK-065: agentes ya anotados en la fase: de ellos solo se sumo lo que crecio su transcripcion. */
+  reanudados: string[];
   /** TASK-063: la fila anadida a la tabla `## Coste`. */
   fila: FilaCoste;
   filePath: string;
@@ -93,28 +103,17 @@ const USO =
   'Uso: taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> ' +
   '(--agente <id> [--agente <id2>...] | --tokens N) [--push]';
 
-/** Saca todos los `--agente <id>` / `--agente=<id>` de argv. */
+/** Saca todos los `--agente <id>` / `--agente=<id>` de argv (lector comun de flags repetibles). */
 function extraerAgentes(argv: readonly string[]): { agentes: string[]; resto: string[] } {
-  const agentes: string[] = [];
-  const resto: string[] = [];
-  for (let i = 0; i < argv.length; i++) {
-    const arg = argv[i] as string;
-    if (arg === '--agente') {
-      const valor = argv[i + 1];
-      if (valor === undefined || valor.startsWith('--')) {
-        throw new RegistrarCosteCommandError(
-          `[ERROR] --agente necesita el id del subagente (el que devuelve la herramienta Agent). ${USO}`
-        );
-      }
-      agentes.push(valor);
-      i++;
-    } else if (arg.startsWith('--agente=')) {
-      agentes.push(arg.slice('--agente='.length));
-    } else {
-      resto.push(arg);
-    }
-  }
-  return { agentes, resto };
+  const { valores, resto } = extraerRepetible(
+    argv,
+    '--agente',
+    () =>
+      new RegistrarCosteCommandError(
+        `[ERROR] --agente necesita el id del subagente (el que devuelve la herramienta Agent). ${USO}`
+      )
+  );
+  return { agentes: valores, resto };
 }
 
 /** Devuelve la fase y, si se dio, los tokens (entero > 0), o lanza con lo que hay que hacer. */
@@ -173,8 +172,58 @@ interface CosteDeAgentes {
   lecturas: number;
 }
 
-/** Suma lo que gasto cada subagente segun su transcripcion; falla diciendo que hacer. */
-async function costeDeAgentes(agentes: readonly string[], configDir: string): Promise<CosteDeAgentes> {
+const CAMPOS_COSTE = ['tokens', 'entrada', 'cacheEscritura', 'cacheLectura', 'salida', 'lecturas'] as const;
+
+/**
+ * Lo ya anotado en `## Coste` de la fase para cada id de `agentes` que
+ * aparezca alli (TASK-065): la suma de sus filas, la original y las de
+ * diferencia de reanudaciones anteriores. Un id anotado junto a otros en una
+ * misma fila aborta: no se sabe cuanto de esa fila es suyo.
+ */
+function yaAnotado(
+  filas: readonly FilaCoste[],
+  fase: FaseCoste,
+  agentes: readonly string[],
+  id: string
+): Map<string, CosteDeAgentes> {
+  const anotado = new Map<string, CosteDeAgentes>();
+  for (const f of filas) {
+    if (f.fase !== fase) continue;
+    const ids = idsDeFuente(f.fuente);
+    for (const agente of agentes) {
+      if (!ids.some((x) => x.id === agente)) continue;
+      if (ids.length > 1 || f.entrada === null || f.cacheEscritura === null || f.cacheLectura === null || f.salida === null) {
+        throw new RegistrarCosteCommandError(
+          `[ERROR] ${id}: el subagente ${agente} ya esta anotado en "## Coste" de ${fase} en una fila ` +
+            `("${f.fuente}", ${f.fecha}) ${ids.length > 1 ? 'junto a otros agentes' : 'sin desglose'}, asi que no se ` +
+            'sabe cuanto de esa fila es suyo para registrar solo lo que ha crecido su transcripcion. ' +
+            'Registra la diferencia a mano con --tokens N. No se ha tocado nada.'
+        );
+      }
+      const previo = anotado.get(agente) ?? { tokens: 0, entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0, lecturas: 0 };
+      previo.tokens += f.total;
+      previo.entrada += f.entrada;
+      previo.cacheEscritura += f.cacheEscritura;
+      previo.cacheLectura += f.cacheLectura;
+      previo.salida += f.salida;
+      previo.lecturas += f.lecturas ?? 0;
+      anotado.set(agente, previo);
+    }
+  }
+  return anotado;
+}
+
+/**
+ * Suma lo que gasto cada subagente segun su transcripcion; falla diciendo que
+ * hacer. TASK-065: si un id ya esta anotado en la fase (`anotado`), su
+ * transcripcion es la acumulada de un agente reanudado y solo suma la
+ * DIFERENCIA con lo ya anotado, campo a campo.
+ */
+async function costeDeAgentes(
+  agentes: readonly string[],
+  configDir: string,
+  anotado: ReadonlyMap<string, CosteDeAgentes> = new Map()
+): Promise<CosteDeAgentes> {
   const unicos = [...new Set(agentes)];
   for (const id of unicos) {
     if (!esAgentIdValido(id)) {
@@ -210,12 +259,22 @@ async function costeDeAgentes(agentes: readonly string[], configDir: string): Pr
           'No se ha tocado nada.'
       );
     }
-    suma.tokens += uso.tokens;
-    suma.entrada += uso.entrada;
-    suma.cacheEscritura += uso.cacheEscritura;
-    suma.cacheLectura += uso.cacheLectura;
-    suma.salida += uso.salida;
-    suma.lecturas += uso.lecturas;
+    const previo = anotado.get(id);
+    if (previo !== undefined) {
+      const crecio = uso.tokens - previo.tokens;
+      const encoge = CAMPOS_COSTE.filter((k) => uso[k] < previo[k]);
+      if (crecio <= 0 || encoge.length > 0) {
+        throw new RegistrarCosteCommandError(
+          crecio === 0 && encoge.length === 0
+            ? `[ERROR] El subagente ${id} ya esta anotado en esta fase con ${String(previo.tokens)} tokens y su ` +
+                'transcripcion no ha crecido desde entonces: no hay nada nuevo que registrar. No se ha tocado nada.'
+            : `[ERROR] La transcripcion del subagente ${id} tiene menos (${encoge.join(', ') || 'tokens'}) que lo ya ` +
+                `anotado para el en esta fase (${String(previo.tokens)} tokens): no es la misma transcripcion o se ` +
+                'recorto. Revisa "## Coste" o registra la cifra a mano con --tokens N. No se ha tocado nada.'
+        );
+      }
+    }
+    for (const k of CAMPOS_COSTE) suma[k] += uso[k] - (previo?.[k] ?? 0);
   }
   if (suma.tokens === 0) {
     throw new RegistrarCosteCommandError(
@@ -274,8 +333,14 @@ export async function runRegistrarCosteCommand(
 
   const unicos = [...new Set(agentes)];
   const nAgentes = unicos.length;
+  // TASK-065: un agente ya anotado en esta fase es un agente reanudado: su
+  // transcripcion acumula lo ya registrado, asi que solo se suma lo que crecio.
+  const anotado = tokensManuales === null ? yaAnotado(leerCostes(body), fase, unicos, id) : new Map();
   const desglose =
-    tokensManuales === null ? await costeDeAgentes(unicos, deps.configDir ?? directorioConfigClaude()) : null;
+    tokensManuales === null
+      ? await costeDeAgentes(unicos, deps.configDir ?? directorioConfigClaude(), anotado)
+      : null;
+  const reanudados = unicos.filter((a) => anotado.has(a));
   const tokens = desglose?.tokens ?? (tokensManuales as number);
   const campo = CAMPO_COSTE_POR_FASE[fase];
   const total = (task[campo] ?? 0) + tokens;
@@ -290,7 +355,10 @@ export async function runRegistrarCosteCommand(
   const fila: FilaCoste = {
     fecha: deps.ahora ?? formatearInstante(new Date()),
     fase,
-    fuente: desglose === null ? 'manual' : `agente:${unicos.join(',')}`,
+    fuente:
+      desglose === null
+        ? 'manual'
+        : `agente:${unicos.map((a) => (anotado.has(a) ? `${PREFIJO_DIFERENCIA}${a}` : a)).join(',')}`,
     entrada: desglose?.entrada ?? null,
     cacheEscritura: desglose?.cacheEscritura ?? null,
     cacheLectura: desglose?.cacheLectura ?? null,
@@ -307,5 +375,5 @@ export async function runRegistrarCosteCommand(
     mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens${detalle}`),
     push,
   });
-  return { id, fase, sumado: tokens, total, agentes: nAgentes, fila, filePath, autoCommit: commit };
+  return { id, fase, sumado: tokens, total, agentes: nAgentes, reanudados, fila, filePath, autoCommit: commit };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts
index bad56c6..2a96076 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts
@@ -133,7 +133,14 @@ function parseWrapperArgs(
           `[ERROR] taskctl ${nombre} ${admite}, y recibio "${arg}".`
         );
       }
-      if (!opciones.includes(arg)) opciones.push(arg);
+      // TASK-065: como en el resto de comandos, una opcion repetida aborta.
+      if (opciones.includes(arg)) {
+        throw new WrapperCommandError(
+          `[ERROR] taskctl ${nombre}: "${arg}" esta repetido y no admite repeticion. ` +
+            'Pasalo una sola vez.'
+        );
+      }
+      opciones.push(arg);
       continue;
     }
     if (!spec.aceptaRama) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
index 549f1d2..0294102 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
@@ -194,14 +194,33 @@ function conDesglose(f: FilaCoste): boolean {
   return f.entrada !== null && f.cacheEscritura !== null && f.cacheLectura !== null && f.salida !== null;
 }
 
-/** Ids de una fuente `agente:a,b`; cualquier otra fuente cuenta entera. */
-function idsDeFuente(fuente: string): string[] {
-  if (!fuente.startsWith('agente:')) return [fuente];
+/**
+ * Prefijo de un id en `fuente` cuya fila es la DIFERENCIA de un agente
+ * reanudado (TASK-065): `agente:dif:<id>`. Su transcripcion acumula los dos
+ * trabajos, asi que `registrar-coste` solo suma lo que crecio desde lo ya
+ * anotado para ese id, y esa fila no es una repeticion.
+ */
+export const PREFIJO_DIFERENCIA = 'dif:';
+
+/** Un id de agente de una fuente, y si su fila es la diferencia de un reanudado. */
+export interface IdDeFuente {
+  id: string;
+  diferencia: boolean;
+}
+
+/** Ids de una fuente `agente:a,dif:b`; cualquier otra fuente cuenta entera. */
+export function idsDeFuente(fuente: string): IdDeFuente[] {
+  if (!fuente.startsWith('agente:')) return [{ id: fuente, diferencia: false }];
   return fuente
     .slice('agente:'.length)
     .split(',')
     .map((s) => s.trim())
-    .filter((s) => s !== '');
+    .filter((s) => s !== '')
+    .map((s) =>
+      s.startsWith(PREFIJO_DIFERENCIA)
+        ? { id: s.slice(PREFIJO_DIFERENCIA.length), diferencia: true }
+        : { id: s, diferencia: false }
+    );
 }
 
 /**
@@ -210,7 +229,9 @@ function idsDeFuente(fuente: string): string[] {
  * misma fase ya sumo dos veces a `tokens_<fase>`, asi que quitar una fila
  * aqui descuadraria el total; se devuelve en `repetidas` para avisar. Las
  * filas `manual` no cuentan como repetidas: dos cifras a mano son dos
- * aportaciones legitimas y no hay id con el que compararlas.
+ * aportaciones legitimas y no hay id con el que compararlas. Tampoco las
+ * filas de diferencia de un agente reanudado (`agente:dif:<id>`, TASK-065):
+ * suman solo lo que su transcripcion crecio, no lo repiten.
  */
 export function resumirCostes(
   filas: readonly FilaCoste[],
@@ -237,7 +258,8 @@ export function resumirCostes(
     const vistas = new Map<string, number>();
     for (const f of deFase) {
       if (f.fuente === 'manual') continue;
-      for (const id of new Set(idsDeFuente(f.fuente))) vistas.set(id, (vistas.get(id) ?? 0) + 1);
+      const nuevos = idsDeFuente(f.fuente).filter((x) => !x.diferencia).map((x) => x.id);
+      for (const id of new Set(nuevos)) vistas.set(id, (vistas.get(id) ?? 0) + 1);
     }
     for (const [fuente, n] of vistas) if (n > 1) repetidas.push({ fase, fuente, filas: n });
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
new file mode 100644
index 0000000..5d1e983
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
@@ -0,0 +1,188 @@
+/**
+ * Evolucion por tramos (TASK-065, `taskctl metricas --evolucion [--tramo N]`).
+ * Puro: recibe las filas de metricas (de uno o varios proyectos) y devuelve
+ * los tramos y su texto. La E/S vive en `commands/metricas.ts`.
+ *
+ * REGLAS (decididas por Carlos, 2026-10-25):
+ *  - Solo entran las tareas terminadas. Las que no tienen fecha de cierre
+ *    (sin `finish` en su registro ni en git) quedan fuera, y se dice cuantas
+ *    y de que proyecto.
+ *  - Orden por fecha de cierre comparando SOLO EL DIA (un cierre con hora y
+ *    otro de solo dia del mismo dia empatan), con desempate estable por
+ *    proyecto y por NUMERO de ID (TASK-99 antes que TASK-100).
+ *  - Tramos de N tareas consecutivas (20 por defecto); el ultimo puede ser
+ *    menor, y su `n` lo dice.
+ *
+ * CADA CIFRA LLEVA SU n: la media o la mediana es de las tareas del tramo que
+ * tienen ese dato, y `n` dice cuantas son. Un valor null va SIEMPRE con n 0
+ * (no hay ninguna tarea con el dato); nunca un 0 inventado ni un NaN.
+ *  - minutos plan->finish: mediana de las tareas con las dos marcas con hora
+ *    (precision de segundo). Las de solo dia no entran (restar dias daria
+ *    minutos con aspecto de precisos) y se cuentan aparte en `soloDia`.
+ *  - rondas: media de las tareas con revision (ultima ronda con informe).
+ *  - IMPORTANTE por tarea: media de las tareas con tabla de hallazgos en
+ *    todos sus informes (contados una vez por tarea, revisor + ID).
+ *  - tokens de revision: media de `tokens_revision` registrado.
+ *  - KB de peticion de revision: media, por tarea, de los KB de su peticion
+ *    en cada ronda (`kbPorTarea`), y media de eso en el tramo.
+ */
+import { media, mediana, tablaDeTexto, type FilaMetricas } from './metricas.js';
+
+export const TRAMO_POR_DEFECTO = 20;
+
+/** Una cifra agregada y de cuantas tareas sale; `valor` null solo con `n` 0. */
+export interface Cifra {
+  valor: number | null;
+  n: number;
+}
+
+export interface TramoEvolucion {
+  /** 1, 2, ... en orden de cierre. */
+  tramo: number;
+  n: number;
+  /** Dia de cierre de la primera y la ultima tarea del tramo. */
+  desde: string;
+  hasta: string;
+  /** Mediana de minutos de plan a finish, de las tareas con hora en las dos marcas. */
+  minutosPlanAFinish: Cifra & { soloDia: number };
+  rondas: Cifra;
+  importantesPorTarea: Cifra;
+  tokensRevision: Cifra;
+  kbPeticionPorRonda: Cifra;
+}
+
+export interface Evolucion {
+  tamanoTramo: number;
+  terminadas: number;
+  enTramos: number;
+  /** Terminadas sin fecha de cierre: fuera de los tramos, por proyecto. */
+  sinCierre: { total: number; porProyecto: Record<string, number> };
+  tramos: TramoEvolucion[];
+}
+
+/** Numero del ID (`TASK-0099` -> 99) para ordenar por numero y no por cadena. */
+export function numeroDeId(id: string): number {
+  const m = /(\d+)$/.exec(id);
+  return m === null ? Number.MAX_SAFE_INTEGER : Number(m[1]);
+}
+
+/** Comparador de cadenas determinista (sin locale). */
+function cmp(a: string, b: string): number {
+  return a < b ? -1 : a > b ? 1 : 0;
+}
+
+/** Orden de cierre: dia, proyecto y numero de ID (las filas sin cierre van al final). */
+export function ordenarPorCierre(filas: readonly FilaMetricas[]): FilaMetricas[] {
+  return [...filas].sort(
+    (a, b) =>
+      cmp(a.cierre ?? '￿', b.cierre ?? '￿') ||
+      cmp(a.proyecto, b.proyecto) ||
+      numeroDeId(a.id) - numeroDeId(b.id) ||
+      cmp(a.id, b.id)
+  );
+}
+
+/** KB medio por ronda de una tarea; null si no tiene ninguna peticion de revision. */
+export function kbPorTarea(f: FilaMetricas): number | null {
+  if (f.kbPeticionPorRonda.length === 0) return null;
+  return media(f.kbPeticionPorRonda.map((p) => p.kb), 1);
+}
+
+function cifra(valores: readonly number[], decimales = 2): Cifra {
+  return { valor: media(valores, decimales), n: valores.length };
+}
+
+function tramoDe(numero: number, filas: readonly FilaMetricas[]): TramoEvolucion {
+  const minutos = filas
+    .filter((f) => f.total !== null && f.total.precision === 'segundo')
+    .map((f) => (f.total as { valor: number }).valor / 60_000);
+  const m = mediana(minutos);
+  return {
+    tramo: numero,
+    n: filas.length,
+    desde: filas[0]?.cierre ?? '',
+    hasta: filas[filas.length - 1]?.cierre ?? '',
+    minutosPlanAFinish: {
+      valor: m === null ? null : Math.round(m * 10) / 10,
+      n: minutos.length,
+      soloDia: filas.filter((f) => f.total !== null && f.total.precision === 'dia').length,
+    },
+    rondas: cifra(filas.map((f) => f.rondas).filter((v): v is number => v !== null)),
+    importantesPorTarea: cifra(
+      filas.map((f) => f.hallazgos.porSeveridad?.IMPORTANTE).filter((v): v is number => v !== undefined)
+    ),
+    tokensRevision: cifra(
+      filas.map((f) => f.tokens.revision).filter((v): v is number => v !== null),
+      0
+    ),
+    kbPeticionPorRonda: cifra(filas.map(kbPorTarea).filter((v): v is number => v !== null), 1),
+  };
+}
+
+/** Tramos de `tamano` tareas terminadas con cierre. `tamano` entero >= 1 (lo valida quien llama). */
+export function calcularEvolucion(filas: readonly FilaMetricas[], tamano = TRAMO_POR_DEFECTO): Evolucion {
+  const terminadas = filas.filter((f) => f.estado === 'terminada');
+  const conCierre = ordenarPorCierre(terminadas.filter((f) => f.cierre !== null));
+  const porProyecto: Record<string, number> = {};
+  for (const f of terminadas) {
+    if (f.cierre === null) porProyecto[f.proyecto] = (porProyecto[f.proyecto] ?? 0) + 1;
+  }
+  const tramos: TramoEvolucion[] = [];
+  for (let i = 0; i < conCierre.length; i += tamano) {
+    tramos.push(tramoDe(tramos.length + 1, conCierre.slice(i, i + tamano)));
+  }
+  return {
+    tamanoTramo: tamano,
+    terminadas: terminadas.length,
+    enTramos: conCierre.length,
+    sinCierre: { total: terminadas.length - conCierre.length, porProyecto },
+    tramos,
+  };
+}
+
+/** `valor (n=N)`, o `— (n=0)`. */
+export function celdaCifra(c: Cifra, sufijo = ''): string {
+  return c.valor === null ? `— (n=0)` : `${String(c.valor)}${sufijo} (n=${String(c.n)})`;
+}
+
+export const NOTA_EVOLUCION =
+  'Tramos de tareas terminadas en orden de cierre (solo el dia; desempate por proyecto y numero de ' +
+  'ID). Cada cifra es de las tareas del tramo con ese dato, y n dice cuantas son: «— (n=0)» es que ' +
+  'ninguna lo tiene, no un cero. min plan->finish = mediana de minutos de las tareas con hora en las ' +
+  'dos marcas (las de solo dia van en «solo dia»); rondas = ultima ronda con informe; IMP/tarea = ' +
+  'hallazgos IMPORTANTE una vez por tarea (revisor + ID), de las tareas con tabla de hallazgos; ' +
+  'tok revision = media de tokens_revision registrado; KB/ronda = media por tarea de los KB de su ' +
+  'peticion de revision en cada ronda.';
+
+/** Texto de la evolucion: tabla de tramos y lo que quedo fuera. */
+export function formatearEvolucion(e: Evolucion, varios: boolean): string {
+  const fuera =
+    e.sinCierre.total === 0
+      ? 'ninguna'
+      : String(e.sinCierre.total) +
+        (varios
+          ? ` (${Object.entries(e.sinCierre.porProyecto)
+              .sort((a, b) => cmp(a[0], b[0]))
+              .map(([p, n]) => `${p} ${String(n)}`)
+              .join(', ')})`
+          : '');
+  const cabecera =
+    `Evolucion por tramos de ${String(e.tamanoTramo)}: ${String(e.terminadas)} tareas terminadas, ` +
+    `${String(e.enTramos)} en tramos; fuera por no tener fecha de cierre: ${fuera}.`;
+  if (e.tramos.length === 0) return [cabecera, '', NOTA_EVOLUCION].join('\n');
+  const tabla = tablaDeTexto(
+    ['tramo', 'tareas', 'cierres', 'min plan->finish', 'solo dia', 'rondas', 'IMP/tarea', 'tok revision', 'KB/ronda'],
+    e.tramos.map((t) => [
+      String(t.tramo),
+      String(t.n),
+      t.desde === t.hasta ? t.desde : `${t.desde} a ${t.hasta}`,
+      celdaCifra(t.minutosPlanAFinish),
+      String(t.minutosPlanAFinish.soloDia),
+      celdaCifra(t.rondas),
+      celdaCifra(t.importantesPorTarea),
+      celdaCifra(t.tokensRevision),
+      celdaCifra(t.kbPeticionPorRonda),
+    ])
+  );
+  return [cabecera, '', tabla, '', NOTA_EVOLUCION].join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/grupos-metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/grupos-metricas.ts
new file mode 100644
index 0000000..6baca34
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/grupos-metricas.ts
@@ -0,0 +1,202 @@
+/**
+ * Grupos de tareas terminadas (TASK-065, `taskctl metricas --grupos`). Puro:
+ * recibe las filas de metricas (de uno o varios proyectos) y devuelve los
+ * grupos y su texto. La E/S vive en `commands/metricas.ts`.
+ *
+ * Se agrupa por tipo, por complejidad declarada, por numero de criterios
+ * (0-4, 5-6, 7 o mas), por KB de peticion de revision por ronda (terciles) y
+ * por proyecto. Los grupos de cada dimension son FIJOS (todos los tipos,
+ * todas las complejidades, los tres tramos de criterios, los tres terciles,
+ * todos los proyectos leidos): un grupo sin tareas sale con n 0 y sus cifras
+ * null, en vez de desaparecer.
+ *
+ * REGLAS (decididas por Carlos, 2026-10-25):
+ *  - «Aprobada a la primera» = una sola ronda (`rondas === 1`) con veredicto
+ *    `aprobada` o `aprobada-con-correcciones`. El porcentaje es sobre las
+ *    tareas CON revision; las que no tienen se cuentan aparte
+ *    (`sinRevision`), no como no aprobadas.
+ *  - Hallazgos CRITICO+IMPORTANTE por tarea, contados una vez por tarea
+ *    (revisor + ID, `resumirHallazgos`), sobre las tareas con tabla de
+ *    hallazgos en todos sus informes; las revisadas sin tabla se cuentan
+ *    aparte (`sinTablaHallazgos`), no como cero.
+ *  - Terciles de KB con TODOS los proyectos juntos: los cortes salen de las
+ *    tareas terminadas con alguna peticion de revision (`kbPorTarea`); las
+ *    demas se cuentan aparte (`sinKb`), nunca como 0 KB. Corte por valor
+ *    (bajo <= c1 < medio <= c2 < alto), asi que dos tareas con el mismo KB
+ *    caen siempre en el mismo tercil (y los grupos pueden no ser iguales).
+ */
+import { TASK_COMPLEXITIES, TASK_TYPES } from './task.js';
+import { media, tablaDeTexto, type FilaMetricas } from './metricas.js';
+import { kbPorTarea } from './evolucion.js';
+
+export interface GrupoMetricas {
+  grupo: string;
+  /** Tareas terminadas del grupo. */
+  n: number;
+  /** Con al menos un informe de revision (las unicas de rondas y % a la primera). */
+  conRevision: number;
+  aprobadasPrimera: number;
+  /** Porcentaje (un decimal) sobre `conRevision`; null si es 0. */
+  pctAprobadaPrimera: number | null;
+  /** Rondas medias de las tareas con revision; null si no hay ninguna. */
+  rondasMedia: number | null;
+  /** Con tabla de hallazgos en todos sus informes (las unicas de critImpPorTarea). */
+  conHallazgos: number;
+  critImpPorTarea: number | null;
+  /** Terminadas sin ningun informe de revision. */
+  sinRevision: number;
+  /** Revisadas con algun informe sin tabla de hallazgos (sin dato, no cero). */
+  sinTablaHallazgos: number;
+}
+
+export interface Grupos {
+  terminadas: number;
+  sinRevision: number;
+  sinTablaHallazgos: number;
+  porTipo: GrupoMetricas[];
+  porComplejidad: GrupoMetricas[];
+  porCriterios: GrupoMetricas[];
+  porKb: {
+    /** c1 y c2 en KB; null si ninguna tarea terminada tiene peticion de revision. */
+    cortes: { c1: number; c2: number } | null;
+    /** Terminadas sin peticion de revision: fuera de los terciles. */
+    sinKb: number;
+    grupos: GrupoMetricas[];
+  };
+  porProyecto: GrupoMetricas[];
+}
+
+export const TRAMOS_CRITERIOS = ['0-4', '5-6', '7+'] as const;
+
+export function tramoCriterios(n: number): (typeof TRAMOS_CRITERIOS)[number] {
+  return n <= 4 ? '0-4' : n <= 6 ? '5-6' : '7+';
+}
+
+export function aprobadaALaPrimera(f: FilaMetricas): boolean {
+  return f.rondas === 1 && f.veredictoRonda1 === 'aprobada';
+}
+
+/** Resumen de un grupo; con `filas` vacio, n 0 y cifras null. */
+export function resumirGrupo(grupo: string, filas: readonly FilaMetricas[]): GrupoMetricas {
+  const revisadas = filas.filter((f) => f.rondas !== null);
+  const conTabla = revisadas.filter((f) => f.hallazgos.porSeveridad !== null);
+  const aprobadas = revisadas.filter(aprobadaALaPrimera).length;
+  return {
+    grupo,
+    n: filas.length,
+    conRevision: revisadas.length,
+    aprobadasPrimera: aprobadas,
+    pctAprobadaPrimera: revisadas.length === 0 ? null : Math.round((aprobadas / revisadas.length) * 1000) / 10,
+    rondasMedia: media(revisadas.map((f) => f.rondas as number)),
+    conHallazgos: conTabla.length,
+    critImpPorTarea: media(
+      conTabla.map((f) => {
+        const s = f.hallazgos.porSeveridad as { CRITICO: number; IMPORTANTE: number };
+        return s.CRITICO + s.IMPORTANTE;
+      })
+    ),
+    sinRevision: filas.length - revisadas.length,
+    sinTablaHallazgos: revisadas.length - conTabla.length,
+  };
+}
+
+function porClave(
+  filas: readonly FilaMetricas[],
+  claves: readonly string[],
+  claveDe: (f: FilaMetricas) => string
+): GrupoMetricas[] {
+  return claves.map((k) => resumirGrupo(k, filas.filter((f) => claveDe(f) === k)));
+}
+
+/** Valor en la posicion del cuantil q (0-1) de una lista ORDENADA no vacia. */
+function cuantil(ordenados: readonly number[], q: number): number {
+  return ordenados[Math.max(0, Math.ceil(ordenados.length * q) - 1)] as number;
+}
+
+/**
+ * Los grupos de las tareas TERMINADAS de `filas`. `proyectos` son los
+ * proyectos leidos (en su orden), tambien los que no tengan ninguna.
+ */
+export function calcularGrupos(filas: readonly FilaMetricas[], proyectos: readonly string[]): Grupos {
+  const t = filas.filter((f) => f.estado === 'terminada');
+  const kbs = t.map(kbPorTarea).filter((v): v is number => v !== null).sort((a, b) => a - b);
+  const cortes = kbs.length === 0 ? null : { c1: cuantil(kbs, 1 / 3), c2: cuantil(kbs, 2 / 3) };
+  const etiquetas = cortes === null
+    ? ['bajo', 'medio', 'alto']
+    : [
+        `bajo (<= ${String(cortes.c1)} KB)`,
+        `medio (${String(cortes.c1)}-${String(cortes.c2)} KB)`,
+        `alto (> ${String(cortes.c2)} KB)`,
+      ];
+  const tercil = (f: FilaMetricas): string => {
+    const kb = kbPorTarea(f);
+    if (kb === null || cortes === null) return '';
+    return (kb <= cortes.c1 ? etiquetas[0] : kb <= cortes.c2 ? etiquetas[1] : etiquetas[2]) as string;
+  };
+  const todas = resumirGrupo('', t);
+  return {
+    terminadas: t.length,
+    sinRevision: todas.sinRevision,
+    sinTablaHallazgos: todas.sinTablaHallazgos,
+    porTipo: porClave(t, TASK_TYPES, (f) => f.tipo),
+    porComplejidad: porClave(t, [...TASK_COMPLEXITIES, '—'], (f) => f.complejidad ?? '—'),
+    porCriterios: porClave(t, TRAMOS_CRITERIOS, (f) => tramoCriterios(f.criterios)),
+    porKb: { cortes, sinKb: t.length - kbs.length, grupos: porClave(t, etiquetas, tercil) },
+    porProyecto: porClave(t, proyectos, (f) => f.proyecto),
+  };
+}
+
+function celda(v: number | null, sufijo = ''): string {
+  return v === null ? '—' : `${String(v)}${sufijo}`;
+}
+
+function tablaGrupos(etiqueta: string, grupos: readonly GrupoMetricas[]): string {
+  return tablaDeTexto(
+    [etiqueta, 'tareas', 'con revision', 'a la primera', 'rondas medias', 'CRIT+IMP/tarea', 'sin revision', 'sin tabla'],
+    grupos.map((g) => [
+      g.grupo,
+      String(g.n),
+      String(g.conRevision),
+      g.pctAprobadaPrimera === null ? '—' : `${String(g.pctAprobadaPrimera)}% (${String(g.aprobadasPrimera)})`,
+      celda(g.rondasMedia),
+      g.critImpPorTarea === null ? '—' : `${String(g.critImpPorTarea)} (n=${String(g.conHallazgos)})`,
+      String(g.sinRevision),
+      String(g.sinTablaHallazgos),
+    ])
+  );
+}
+
+export const NOTA_GRUPOS =
+  'Solo tareas terminadas. «a la primera» = una sola ronda con veredicto aprobada o ' +
+  'aprobada-con-correcciones, en % de las tareas con revision (entre parentesis, cuantas); ' +
+  '«rondas medias», tambien de las tareas con revision. CRIT+IMP/tarea = hallazgos CRITICO e ' +
+  'IMPORTANTE una vez por tarea (revisor + ID), de las tareas con tabla de hallazgos (n). «sin ' +
+  'revision» (ningun informe) y «sin tabla» (algun informe sin tabla de hallazgos) se cuentan aparte, ' +
+  'no como cero. «—» = ninguna tarea del grupo tiene ese dato. Terciles de KB por ronda de la ' +
+  'peticion de revision con todos los proyectos juntos, cortados por valor (los iguales caen juntos).';
+
+/** Texto de los grupos: una tabla por dimension. */
+export function formatearGrupos(g: Grupos): string {
+  const kb = g.porKb;
+  return [
+    `Grupos de ${String(g.terminadas)} tareas terminadas (sin revision: ${String(g.sinRevision)}; ` +
+      `revisadas sin tabla de hallazgos: ${String(g.sinTablaHallazgos)}).`,
+    '',
+    'Por tipo:',
+    tablaGrupos('tipo', g.porTipo),
+    '',
+    'Por complejidad declarada:',
+    tablaGrupos('complejidad', g.porComplejidad),
+    '',
+    'Por numero de criterios:',
+    tablaGrupos('criterios', g.porCriterios),
+    '',
+    `Por KB de peticion de revision por ronda (terciles; sin peticion, fuera: ${String(kb.sinKb)}):`,
+    tablaGrupos('KB/ronda', kb.grupos),
+    '',
+    'Por proyecto:',
+    tablaGrupos('proyecto', g.porProyecto),
+    '',
+    NOTA_GRUPOS,
+  ].join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index a82b45b..4b57b4e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -49,7 +49,13 @@
 import { leerTransiciones, instanteDe, precisionDeFecha, type PrecisionFecha } from './transiciones.js';
 import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState, type TaskType } from './task.js';
 import { FASES_COSTE, leerCostes, resumirCostes, type FaseCoste, type ResumenCostes } from './coste-registro.js';
-import { resumirHallazgos, type InformeLeido, type ResumenHallazgos } from './informe-revision.js';
+import {
+  resumirHallazgos,
+  veredictoDeRonda,
+  type InformeLeido,
+  type ResumenHallazgos,
+  type VeredictoInforme,
+} from './informe-revision.js';
 import { extraerSecciones } from './tarea-body.js';
 
 export type OrigenMetricas = 'registro' | 'git' | '—';
@@ -103,6 +109,15 @@ export function claveTarea(proyecto: string, id: string): string {
   return `${proyecto}\u0000${id}`;
 }
 
+/**
+ * Como se nombra una tarea en avisos y listas (TASK-065): con un solo
+ * proyecto, su ID a secas (la salida de siempre); con varios, `proyecto/ID`,
+ * porque TASK-NNN se repite entre repos.
+ */
+export function etiquetaTarea(f: { proyecto: string; id: string }, varios: boolean): string {
+  return varios ? `${f.proyecto}/${f.id}` : f.id;
+}
+
 export interface FilaMetricas {
   /** Nombre del proyecto (la carpeta del repo); '' si quien llama no lo da. */
   proyecto: string;
@@ -129,6 +144,17 @@ export interface FilaMetricas {
   hallazgos: ResumenHallazgos;
   /** Una entrada por ronda con peticion; vacio = sin peticiones de revision (no medido). */
   kbPeticionPorRonda: PeticionRonda[];
+  /**
+   * TASK-065: del primer `plan` al ultimo `finish` (lo que suman diseno, curso
+   * y revision); null si falta una de las dos marcas.
+   */
+  total: Duracion | null;
+  /**
+   * TASK-065: veredicto de la ronda 1 (`veredictoDeRonda` de sus informes:
+   * `aprobada` cubre tambien `aprobada-con-correcciones`); null sin informes
+   * de la ronda 1. «Aprobada a la primera» = `rondas === 1` y esto `aprobada`.
+   */
+  veredictoRonda1: VeredictoInforme | null;
   /** Solo con `--heuristica`. */
   heuristica?: HeuristicaFila;
 }
@@ -273,9 +299,16 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     }),
     hallazgos: resumirHallazgos(e.informes ?? []),
     kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
+    total: duracionEntre(marcas.plan, marcas.finish),
+    veredictoRonda1: veredictoRonda1(e.informes ?? []),
   };
 }
 
+function veredictoRonda1(informes: readonly InformeLeido[]): VeredictoInforme | null {
+  const primera = informes.filter((i) => i.ronda === 1);
+  return primera.length === 0 ? null : veredictoDeRonda(primera.map((i) => i.texto));
+}
+
 /** `—` para lo que no hay; dias como `N d`; segundos como `1d 03h`, `2h 05m`, `7m`, `40s`. */
 export function formatearDuracion(d: Duracion | null): string {
   if (d === null) return '—';
@@ -326,6 +359,9 @@ export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
   { cabecera: 'origen', valor: (f) => f.origen },
 ];
 
+/** Primera columna con varios proyectos (`--repo` repetido): el ID solo no identifica la tarea. */
+export const COLUMNA_PROYECTO: ColumnaMetricas = { cabecera: 'proyecto', valor: (f) => f.proyecto };
+
 /** Las que anade `--heuristica`. */
 export const COLUMNAS_HEURISTICA: readonly ColumnaMetricas[] = [
   { cabecera: 'puntos', valor: (f) => (f.heuristica === undefined ? '—' : String(f.heuristica.puntos)) },
@@ -649,7 +685,8 @@ export const NOTA_DESGLOSE_TOKENS =
   'tokens_<fase> menos lo desglosado (filas "manual" o coste anterior a la tabla), sumado por ' +
   'fases. Un negativo en una fase es una incoherencia (el desglose supera al total): no se ' +
   'recorta a 0, sale con aviso y la celda lleva "*" aunque la suma sea positiva. Un agente ' +
-  'repetido en una fase suma tantas veces como filas tenga: se avisa, no se deduplica.';
+  'repetido en una fase suma tantas veces como filas tenga: se avisa, no se deduplica (salvo ' +
+  'las filas "agente:dif:<id>" de un agente reanudado, que solo suman lo que crecio).';
 
 export const NOTA_HALLAZGOS =
   'Hallazgos: cada uno cuenta una vez por tarea (revisor + ID) sumando todas las rondas, con la ' +
@@ -658,25 +695,26 @@ export const NOTA_HALLAZGOS =
   'tabla de hallazgos (no cuenta como cero).';
 
 /** Avisos de una fila: incoherencias del desglose y severidades fuera de vocabulario. */
-export function avisosDeFila(f: FilaMetricas): string[] {
+export function avisosDeFila(f: FilaMetricas, varios = false): string[] {
   const avisos: string[] = [];
+  const et = etiquetaTarea(f, varios);
   for (const fase of FASES_COSTE) {
     const r = f.coste.fases[fase];
     if (r.registrado === null && r.filas > 0) {
       avisos.push(
-        `${f.id}: tokens_${fase} esta vacio pero "## Coste" tiene ${String(r.filas)} fila(s) de ${fase}; ` +
+        `${et}: tokens_${fase} esta vacio pero "## Coste" tiene ${String(r.filas)} fila(s) de ${fase}; ` +
           'el total de la fase deberia ser la suma de su desglose. Revisa el frontmatter.'
       );
     } else if (r.sinDesglose !== null && r.sinDesglose < 0) {
       avisos.push(
-        `${f.id}: lo desglosado en "## Coste" para ${fase} (${String(r.desglosado)}) supera tokens_${fase} ` +
+        `${et}: lo desglosado en "## Coste" para ${fase} (${String(r.desglosado)}) supera tokens_${fase} ` +
           `(${String(r.registrado)}): diferencia ${String(r.sinDesglose)}. Revisa el frontmatter o las filas.`
       );
     }
   }
   for (const rep of f.coste.repetidas) {
     avisos.push(
-      `${f.id}: en "## Coste", ${rep.fuente} aparece en ${String(rep.filas)} filas de ${rep.fase}: ` +
+      `${et}: en "## Coste", ${rep.fuente} aparece en ${String(rep.filas)} filas de ${rep.fase}: ` +
         'su coste se suma otras tantas veces (no se deduplica). Si se registro dos veces por error, ' +
         `corrige tokens_${rep.fase} y quita la fila sobrante.`
     );
@@ -689,7 +727,7 @@ export function avisosDeFila(f: FilaMetricas): string[] {
   }
   for (const [fichero, lista] of porFichero) {
     avisos.push(
-      `${f.id} revision/${fichero}: severidad fuera de vocabulario (CRITICO, IMPORTANTE o MENOR) en ` +
+      `${et} revision/${fichero}: severidad fuera de vocabulario (CRITICO, IMPORTANTE o MENOR) en ` +
         `${lista.join(', ')}; no cuenta en crit/imp/men.`
     );
   }
@@ -697,21 +735,23 @@ export function avisosDeFila(f: FilaMetricas): string[] {
 }
 
 /** Un solo aviso con las tareas que tienen informes sin tabla de hallazgos; null si no hay. */
-export function avisoInformesSinTabla(filas: readonly FilaMetricas[]): string | null {
+export function avisoInformesSinTabla(filas: readonly FilaMetricas[], varios = false): string | null {
   const con = filas.filter((f) => f.hallazgos.informesSinTabla.length > 0);
   if (con.length === 0) return null;
   const n = con.reduce((a, f) => a + f.hallazgos.informesSinTabla.length, 0);
   return (
     `${String(n)} informe(s) de revision sin tabla de hallazgos en ${String(con.length)} tarea(s); sus ` +
-    `hallazgos salen como sin dato («—»), no como cero: ${con.map((f) => f.id).join(', ')}.`
+    `hallazgos salen como sin dato («—»), no como cero: ${con.map((f) => etiquetaTarea(f, varios)).join(', ')}.`
   );
 }
 
 /** Tareas terminadas sin coste (null o 0) en alguna fase, con esas fases. */
-export function tareasSinCoste(filas: readonly FilaMetricas[]): { id: string; fases: FaseCoste[] }[] {
+export function tareasSinCoste(
+  filas: readonly FilaMetricas[]
+): { proyecto: string; id: string; fases: FaseCoste[] }[] {
   return filas
     .filter((f) => f.estado === 'terminada')
-    .map((f) => ({ id: f.id, fases: FASES_COSTE.filter((k) => !f.coste.fases[k].registrado) }))
+    .map((f) => ({ proyecto: f.proyecto, id: f.id, fases: FASES_COSTE.filter((k) => !f.coste.fases[k].registrado) }))
     .filter((t) => t.fases.length > 0);
 }
 
@@ -723,6 +763,13 @@ export function mediana(valores: readonly number[]): number | null {
   return v.length % 2 === 1 ? (v[m] as number) : ((v[m - 1] as number) + (v[m] as number)) / 2;
 }
 
+/** Media redondeada a `decimales`; null si la lista esta vacia (nunca NaN). */
+export function media(valores: readonly number[], decimales = 2): number | null {
+  if (valores.length === 0) return null;
+  const f = 10 ** decimales;
+  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * f) / f;
+}
+
 /** Por fase, la mediana de lecturas de las tareas cuya tabla `## Coste` las mide, y cuantas son. */
 export function medianaLecturas(
   filas: readonly FilaMetricas[]
@@ -736,12 +783,10 @@ export function medianaLecturas(
 }
 
 /** Lineas de texto bajo la tabla: hallazgos sin dato, lecturas y terminadas sin coste. */
-export function notasFilaEnriquecida(filas: readonly FilaMetricas[]): string[] {
+export function notasFilaEnriquecida(filas: readonly FilaMetricas[], varios = false): string[] {
   const sinTabla = filas.filter((f) => f.hallazgos.informesSinTabla.length > 0);
   const nInformes = sinTabla.reduce((a, f) => a + f.hallazgos.informesSinTabla.length, 0);
   const lect = medianaLecturas(filas);
-  const sinCoste = tareasSinCoste(filas);
-  const terminadas = filas.filter((f) => f.estado === 'terminada').length;
   return [
     NOTA_HALLAZGOS +
       ` Informes sin tabla de hallazgos: ${String(nInformes)} (en ${String(sinTabla.length)} tareas).`,
@@ -750,10 +795,52 @@ export function notasFilaEnriquecida(filas: readonly FilaMetricas[]): string[] {
         ', '
       ) +
       '.',
-    sinCoste.length === 0
-      ? `Terminadas sin coste en alguna fase: 0 de ${String(terminadas)}.`
-      : `Terminadas sin coste en alguna fase: ${String(sinCoste.length)} de ${String(terminadas)}: ` +
-        sinCoste.map((t) => `${t.id} (${t.fases.join(', ')})`).join(', ') +
-        '.',
+    lineaSinCoste(resumenSinCoste(filas), varios),
   ];
 }
+
+// --- Terminadas sin coste, acotadas (MEN-4 de TASK-064, en TASK-065) ---------
+
+/** Cuantas tareas de la lista de terminadas sin coste salen por pantalla; el resto, en --json. */
+export const MAX_SIN_COSTE_EN_TEXTO = 10;
+
+export interface ResumenSinCoste {
+  terminadas: number;
+  /** Terminadas sin coste (null o 0) en alguna fase. */
+  total: number;
+  /** Cuantas de ellas no tienen cada fase. */
+  porFase: Record<FaseCoste, number>;
+  /** Todas, en el orden de la tabla. */
+  tareas: { proyecto: string; id: string; fases: FaseCoste[] }[];
+}
+
+export function resumenSinCoste(filas: readonly FilaMetricas[]): ResumenSinCoste {
+  const tareas = tareasSinCoste(filas);
+  const porFase = {} as Record<FaseCoste, number>;
+  for (const fase of FASES_COSTE) porFase[fase] = tareas.filter((t) => t.fases.includes(fase)).length;
+  return {
+    terminadas: filas.filter((f) => f.estado === 'terminada').length,
+    total: tareas.length,
+    porFase,
+    tareas,
+  };
+}
+
+/**
+ * La linea de texto: el recuento por fase y las 10 primeras, con «y N mas»
+ * (en un proyecto con 76 de 76 la lista entera tapaba la tabla). La lista
+ * completa sale en `--json`.
+ */
+export function lineaSinCoste(r: ResumenSinCoste, varios = false): string {
+  if (r.total === 0) return `Terminadas sin coste en alguna fase: 0 de ${String(r.terminadas)}.`;
+  const primeras = r.tareas
+    .slice(0, MAX_SIN_COSTE_EN_TEXTO)
+    .map((t) => `${etiquetaTarea(t, varios)} (${t.fases.join(', ')})`)
+    .join(', ');
+  const resto = r.total - Math.min(r.total, MAX_SIN_COSTE_EN_TEXTO);
+  return (
+    `Terminadas sin coste en alguna fase: ${String(r.total)} de ${String(r.terminadas)} ` +
+    `(${FASES_COSTE.map((k) => `${k} ${String(r.porFase[k])}`).join(', ')}): ${primeras}` +
+    (resto > 0 ? ` y ${String(resto)} mas (lista completa con --json).` : '.')
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts
index 4c534a8..e69b3d6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts
@@ -1,6 +1,6 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { parseArgs } from '../../src/cli/args.js';
+import { parseArgs, extraerRepetible } from '../../src/cli/args.js';
 
 test('parseArgs: separa posicionales de flags con valor', () => {
   const r = parseArgs(['new', '--titulo', 'Mi tarea', '--tipo', 'feature']);
@@ -36,3 +36,49 @@ test('parseArgs: --flag=valor con "=" dentro del valor solo separa en el primer
   const r = parseArgs(['--titulo=a=b=c']);
   assert.equal(r.flags['titulo'], 'a=b=c');
 });
+
+// TASK-065: lector comun de flags repetibles (--repo, --agente).
+test('extraerRepetible: saca todos los valores en orden, en las dos formas, y deja el resto intacto', () => {
+  const r = extraerRepetible(['--repo', 'a', '--tokens', '--repo=b', 'x', '--repo', '../c'], '--repo', () => new Error('sin valor'));
+  assert.deepEqual(r.valores, ['a', 'b', '../c']);
+  assert.deepEqual(r.resto, ['--tokens', 'x']);
+});
+
+test('extraerRepetible: no confunde un flag que empieza igual (--repositorio)', () => {
+  const r = extraerRepetible(['--repositorio', 'z'], '--repo', () => new Error('sin valor'));
+  assert.deepEqual(r.valores, []);
+  assert.deepEqual(r.resto, ['--repositorio', 'z']);
+});
+
+test('extraerRepetible: sin valor (al final, seguido de otro flag, vacio) lanza el error de quien llama', () => {
+  for (const argv of [['--repo'], ['--repo', '--tokens'], ['--repo='], ['--repo', '  ']]) {
+    assert.throws(() => extraerRepetible(argv, '--repo', () => new Error('falta la ruta')), /falta la ruta/, argv.join(' '));
+  }
+});
+
+// TASK-065: un flag repetido que no admite repeticion aborta en cualquier comando.
+import { rechazarFlagsDesconocidos, FLAGS_REPETIBLES } from '../../src/cli/args.js';
+
+test('rechazarFlagsDesconocidos: un flag repetido aborta (tambien mezclando --flag valor y --flag=valor)', () => {
+  const fallo = (m: string): Error => new Error(m);
+  for (const argv of [
+    ['--sprint', '1', '--sprint', '2'],
+    ['--sprint=1', '--sprint', '2'],
+    ['--escribir', '--escribir'],
+  ]) {
+    assert.throws(
+      () => rechazarFlagsDesconocidos(argv, ['--sprint', '--escribir'], 'board', fallo),
+      /taskctl board: "--(sprint|escribir)" esta repetido y no admite repeticion/,
+      argv.join(' ')
+    );
+  }
+});
+
+test('rechazarFlagsDesconocidos: los repetibles (--repo, --agente, --criterio) si se repiten', () => {
+  assert.deepEqual([...FLAGS_REPETIBLES].sort(), ['--agente', '--criterio', '--repo']);
+  for (const flag of FLAGS_REPETIBLES) {
+    assert.doesNotThrow(() =>
+      rechazarFlagsDesconocidos([flag, 'a', `${flag}=b`, flag, 'c'], [flag], 'x', (m) => new Error(m))
+    );
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/flags-repetidos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/flags-repetidos.test.ts
new file mode 100644
index 0000000..3988691
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/flags-repetidos.test.ts
@@ -0,0 +1,40 @@
+/**
+ * TASK-065: un flag repetido que no admite repeticion aborta con error en
+ * cualquier comando de taskctl, en vez de quedarse con el ultimo valor sin
+ * avisar; y no toca nada. Contra un repo Git temporal real.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readdir } from 'node:fs/promises';
+import path from 'node:path';
+import { ID, CONFIG_AUTO, git, cli, withRepo, nueva } from '../helpers/automatico-fixtures.js';
+
+test('flag repetido en new, board, metricas, registrar-coste, veredicto y un wrapper: aborta sin tocar nada', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    nueva(repoRoot, 'feature', 'Base');
+    const head = git(['rev-parse', 'HEAD'], repoRoot);
+    const casos: [string[], RegExp][] = [
+      [['new', '--titulo', 'Uno', '--titulo', 'Dos', '--tipo', 'fix'], /taskctl new: "--titulo" esta repetido/],
+      [['new', '--titulo', 'Uno', '--tipo', 'fix', '--objetivo', 'a', '--objetivo=b'], /"--objetivo" esta repetido/],
+      [['board', '--sprint', '1', '--sprint', '2'], /taskctl board: "--sprint" esta repetido/],
+      [['metricas', '--tokens', '--tokens'], /taskctl metricas: "--tokens" esta repetido/],
+      [['registrar-coste', ID, '--fase', 'diseno', '--fase', 'revision', '--tokens', '5'], /"--fase" esta repetido/],
+      [['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5', '--tokens=7'], /"--tokens" esta repetido/],
+      [['pause', '--push', '--push'], /taskctl pause: "--push" esta repetido/],
+      [['pausa', ID, '--cadena', 'a', '--cadena', 'b'], /--cadena esta repetido/],
+    ];
+    for (const [args, error] of casos) {
+      const r = cli(repoRoot, args);
+      assert.equal(r.status, 1, `${args.join(' ')}: ${r.stdout}${r.stderr}`);
+      assert.match(r.stderr, error, args.join(' '));
+      assert.doesNotMatch(r.stderr, /no pudo arrancar/);
+    }
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head, 'ningun commit');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'nada escrito');
+    assert.deepEqual(await readdir(path.join(tareasRoot, '00-planificadas')), [ID], 'new no creo ninguna tarea');
+
+    // Los repetibles siguen funcionando: --criterio suma.
+    const ok = cli(repoRoot, ['new', '--titulo', 'Tres', '--tipo', 'fix', '--criterio', 'a', '--criterio', 'b']);
+    assert.equal(ok.status, 0, ok.stderr);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
new file mode 100644
index 0000000..216e9f8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
@@ -0,0 +1,233 @@
+/**
+ * TASK-065: `taskctl metricas --evolucion [--tramo N]`, `--grupos` y `--json`
+ * por CLI, contra repos Git temporales reales (uno o varios con `--repo`).
+ * Solo lectura: ningun repo cambia.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { conRepos, escribirTareas, metricas, estado, type TareaFixture } from '../helpers/metricas-repos.js';
+
+/** Cinco tareas terminadas de alfa y dos de beta (una con el mismo ID), y una sin cierre. */
+const ALFA: TareaFixture[] = [
+  { id: 'TASK-099', finish: '2026-10-02T12:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [], bytesPeticion: 1024 }] },
+  { id: 'TASK-100', finish: '2026-10-02T09:00:00Z', rondas: [{ veredicto: 'cambios-solicitados', hallazgos: [{ id: 'IMP-1', sev: 'IMPORTANTE' }], bytesPeticion: 4096 }, { veredicto: 'aprobada', hallazgos: [{ id: 'IMP-1', sev: 'IMPORTANTE' }], bytesPeticion: 2048 }] },
+  { id: 'TASK-101', finish: '2026-10-01', rondas: [{ veredicto: 'aprobada-con-correcciones', hallazgos: [{ id: 'MEN-1', sev: 'MENOR' }] }] },
+  { id: 'TASK-102', finish: '2026-10-03T10:00:00Z' },
+  { id: 'TASK-103', finish: null, rondas: [{ veredicto: 'aprobada', hallazgos: null }] },
+];
+const BETA: TareaFixture[] = [
+  { id: 'TASK-099', tipo: 'fix', criterios: 8, finish: '2026-10-02T08:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'CRI-1', sev: 'CRITICO' }], bytesPeticion: 10240 }] },
+  { id: 'TASK-001', estado: 'en-curso' },
+];
+
+function filasTramo(salida: string): string[][] {
+  return salida
+    .split('\n')
+    .filter((l) => /^\| \d+ /.test(l))
+    .map((l) =>
+      l
+        .slice(1, -1)
+        .split('|')
+        .map((c) => c.trim())
+    );
+}
+
+test('--evolucion: tramos por dia de cierre (proyecto y numero de ID desempatan), las sin cierre fuera por proyecto', async () => {
+  await conRepos(async (crear, base) => {
+    const alfa = await crear('alfa');
+    const beta = await crear('beta');
+    await escribirTareas(alfa, ALFA);
+    await escribirTareas(beta, BETA);
+    const antes = [estado(alfa), estado(beta)];
+    const r = metricas(base, ['--evolucion', '--tramo', '2', '--repo', 'alfa', '--repo', 'beta']);
+    assert.equal(r.status, 0, r.stderr);
+    assert.match(r.stdout, /Evolucion por tramos de 2: 6 tareas terminadas, 5 en tramos; fuera por no tener fecha de cierre: 1 \(alfa 1\)\./);
+    // Orden: alfa/101 (dia 1), alfa/099, alfa/100, beta/099 (dia 2: proyecto y numero, no la hora), alfa/102.
+    const t = filasTramo(r.stdout);
+    assert.deepEqual(t.map((c) => [c[0], c[1], c[2]]), [
+      ['1', '2', '2026-10-01 a 2026-10-02'],
+      ['2', '2', '2026-10-02'],
+      ['3', '1', '2026-10-03'],
+    ]);
+    // Tramo 1 = alfa/101 (solo dia) + alfa/099: rondas 1 y 1; IMP 0 y 0.
+    assert.deepEqual([t[0]?.[4], t[0]?.[5], t[0]?.[6]], ['1', '1 (n=2)', '0 (n=2)']);
+    // Tramo 2 = alfa/100 (2 rondas, 1 IMP una vez) + beta/099 (1 ronda, 0 IMP; KB 10).
+    assert.deepEqual([t[1]?.[5], t[1]?.[6], t[1]?.[8]], ['1.5 (n=2)', '0.5 (n=2)', '6.5 (n=2)']);
+    // Tramo 3 = alfa/102: sin revision.
+    assert.deepEqual([t[2]?.[5], t[2]?.[6]], ['— (n=0)', '— (n=0)']);
+    assert.doesNotMatch(r.stdout, /NaN|undefined|null/);
+    assert.doesNotMatch(r.stdout, /\| TASK-/, 'sin la tabla por tarea');
+    assert.deepEqual([estado(alfa), estado(beta)], antes, 'solo lectura');
+  });
+});
+
+test('--tramo invalido (0, -1, 2.5, abc, sin valor, sin --evolucion) y --evolucion con --tokens/--heuristica abortan sin leer', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, ALFA);
+    const casos: [string[], RegExp][] = [
+      [['--evolucion', '--tramo', '0'], /--tramo "0" no es un entero de 1 o mas/],
+      [['--evolucion', '--tramo', '-1'], /--tramo "-1" no es un entero de 1 o mas/],
+      [['--evolucion', '--tramo', '2.5'], /--tramo "2.5" no es un entero de 1 o mas/],
+      [['--evolucion', '--tramo', 'abc'], /--tramo "abc" no es un entero de 1 o mas/],
+      [['--evolucion', '--tramo=-1'], /--tramo "-1" no es/],
+      [['--evolucion', '--tramo'], /--tramo necesita un entero de 1 o mas/],
+      [['--tramo', '5'], /--tramo solo se admite con --evolucion/],
+      [['--evolucion', '--tokens'], /--evolucion no se combina con --tokens/],
+      [['--evolucion', '--heuristica'], /--evolucion no se combina con --heuristica/],
+      [['--evolucion=1'], /"--evolucion" no lleva valor/],
+    ];
+    for (const [args, error] of casos) {
+      const r = metricas(alfa, args);
+      assert.equal(r.status, 1, args.join(' '));
+      assert.match(r.stderr, error, args.join(' '));
+      assert.equal(r.stdout, '', args.join(' '));
+    }
+  });
+});
+
+test('--evolucion sin tareas: sale la cabecera con ceros, sin tabla ni NaN', async () => {
+  await conRepos(async (crear) => {
+    const vacio = await crear('vacio');
+    const r = metricas(vacio, ['--evolucion']);
+    assert.equal(r.status, 0, r.stderr);
+    assert.match(r.stdout, /^Evolucion por tramos de 20: 0 tareas terminadas, 0 en tramos; fuera por no tener fecha de cierre: ninguna\./);
+    assert.doesNotMatch(r.stdout, /NaN|No hay tareas/);
+  });
+});
+
+/** Celdas de la fila de un grupo en la salida de --grupos. */
+function grupo(salida: string, nombre: string): string[] {
+  const l = salida.split('\n').find((x) => x.startsWith(`| ${nombre} `));
+  assert.ok(l, `sin grupo ${nombre}:\n${salida}`);
+  return l
+    .slice(1, -1)
+    .split('|')
+    .map((c) => c.trim());
+}
+
+test('--grupos con dos repos: tipo, complejidad, criterios, terciles de KB y proyecto, con los grupos vacios a la vista', async () => {
+  await conRepos(async (crear, base) => {
+    const alfa = await crear('alfa');
+    const beta = await crear('beta');
+    await escribirTareas(alfa, ALFA);
+    await escribirTareas(beta, BETA);
+    const r = metricas(base, ['--grupos', '--repo', 'alfa', '--repo', 'beta']);
+    assert.equal(r.status, 0, r.stderr);
+    const s = r.stdout;
+    // 6 terminadas: alfa 099 (1a), 100 (2 rondas, IMP-1 una vez), 101 (1a, con correcciones),
+    // 102 (sin revision), 103 (sin cierre, 1a, informe sin tabla); beta 099 (fix, 8 criterios, CRITICO).
+    assert.match(s, /Grupos de 6 tareas terminadas \(sin revision: 1; revisadas sin tabla de hallazgos: 1\)\./);
+    assert.deepEqual(grupo(s, 'feature').slice(1, 8), ['5', '4', '75% (3)', '1.25', '0.33 (n=3)', '1', '1']);
+    assert.deepEqual(grupo(s, 'fix').slice(1, 8), ['1', '1', '100% (1)', '1', '1 (n=1)', '0', '0']);
+    assert.deepEqual(grupo(s, 'hotfix').slice(1, 8), ['0', '0', '—', '—', '—', '0', '0'], 'grupo vacio');
+    assert.deepEqual(grupo(s, '7+').slice(1, 3), ['1', '1']);
+    assert.deepEqual(grupo(s, '0-4').slice(1, 3), ['5', '4']);
+    assert.deepEqual(grupo(s, 'alfa').slice(1, 3), ['5', '4']);
+    assert.deepEqual(grupo(s, 'beta').slice(1, 3), ['1', '1'], 'la en-curso de beta no cuenta');
+    // KB por tarea: alfa/099 1, alfa/100 3 (4 y 2), beta/099 10 -> una en cada tercil; 3 sin peticion.
+    assert.match(s, /terciles; sin peticion, fuera: 3\):/);
+    assert.equal(grupo(s, 'bajo (<= 1 KB)')[1], '1');
+    assert.equal(grupo(s, 'medio (1-3 KB)')[1], '1');
+    assert.equal(grupo(s, 'alto (> 3 KB)')[1], '1');
+    assert.doesNotMatch(s, /NaN|undefined|null/);
+  });
+});
+
+test('--json con --evolucion y --grupos: un unico objeto que pasa JSON.parse, sin texto en stdout; avisos por stderr', async () => {
+  await conRepos(async (crear, base) => {
+    const alfa = await crear('alfa');
+    const beta = await crear('beta');
+    await escribirTareas(alfa, ALFA);
+    await escribirTareas(beta, BETA);
+    const r = metricas(base, ['--json', '--evolucion', '--tramo', '2', '--grupos', '--repo', 'alfa', '--repo', 'beta']);
+    assert.equal(r.status, 0, r.stderr);
+    assert.equal(r.stdout.trim().split('\n').length, 1, 'una sola linea');
+    const o = JSON.parse(r.stdout) as Record<string, any>;
+    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'evolucion', 'grupos']);
+    assert.deepEqual(
+      o.proyectos.map((p: Record<string, unknown>) => [p.proyecto, p.tareas]),
+      [['alfa', 5], ['beta', 2]]
+    );
+    assert.deepEqual(o.evolucion.sinCierre, { total: 1, porProyecto: { alfa: 1 } });
+    assert.deepEqual(o.evolucion.tramos.map((t: { n: number }) => t.n), [2, 2, 1]);
+    assert.deepEqual(o.evolucion.tramos[2].rondas, { valor: null, n: 0 }, 'null solo junto a n 0');
+    const hotfix = o.grupos.porTipo.find((g: { grupo: string }) => g.grupo === 'hotfix');
+    assert.deepEqual([hotfix.n, hotfix.pctAprobadaPrimera, hotfix.critImpPorTarea], [0, null, null]);
+    assert.equal(o.sinCoste.total, 6);
+    assert.doesNotMatch(r.stdout, /NaN|Infinity/);
+    assert.match(r.stderr, /^Repos leidos: alfa/m);
+    assert.match(r.stderr, /\[AVISO\] 1 informe\(s\) de revision sin tabla/);
+  });
+});
+
+test('--json sin tareas y con grupos vacios: objeto valido, sin "No hay tareas" ni NaN', async () => {
+  await conRepos(async (crear) => {
+    const vacio = await crear('vacio');
+    for (const extra of [[], ['--evolucion'], ['--grupos'], ['--evolucion', '--grupos']]) {
+      const r = metricas(vacio, ['--json', ...extra]);
+      assert.equal(r.status, 0, r.stderr);
+      const o = JSON.parse(r.stdout) as Record<string, any>;
+      assert.deepEqual(
+        o.proyectos.map((p: Record<string, unknown>) => [p.proyecto, p.tareas]),
+        [['vacio', 0]]
+      );
+      assert.deepEqual(o.sinCoste, { terminadas: 0, total: 0, porFase: { diseno: 0, implementacion: 0, revision: 0 }, tareas: [] });
+      if (extra.includes('--evolucion')) assert.deepEqual(o.evolucion.tramos, []);
+      if (extra.includes('--grupos')) {
+        assert.equal(o.grupos.porKb.cortes, null);
+        assert.ok(o.grupos.porTipo.every((g: { n: number; rondasMedia: unknown }) => g.n === 0 && g.rondasMedia === null));
+      }
+      assert.doesNotMatch(r.stdout, /NaN|No hay tareas/);
+      assert.equal(r.stderr, '');
+    }
+  });
+});
+
+test('--json con un flag fuera de la lista (--escribir, --tokens, --heuristica) aborta sin escribir nada', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, ALFA);
+    const antes = estado(alfa);
+    for (const otro of [['--tokens', '--escribir'], ['--tokens'], ['--heuristica'], ['--escribir']]) {
+      const r = metricas(alfa, ['--json', ...otro]);
+      assert.equal(r.status, 1, otro.join(' '));
+      assert.match(r.stderr, /--json no se combina con .*: solo con --repo, --evolucion, --tramo, --grupos/);
+      assert.equal(r.stdout, '');
+      assert.equal(estado(alfa), antes, `${otro.join(' ')}: no se crea docs/METRICAS.md`);
+    }
+  });
+});
+
+test('terminadas sin coste: recuento por fase, las 10 primeras y «y N mas» por pantalla; completa en --json', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(
+      alfa,
+      Array.from({ length: 12 }, (_, i) => ({ id: `TASK-${String(i + 1).padStart(3, '0')}`, tokensRevision: i < 3 ? 50 : null }))
+    );
+    const r = metricas(alfa, []);
+    assert.equal(r.status, 0, r.stderr);
+    const linea = r.stdout.split('\n').find((l) => l.startsWith('Terminadas sin coste'));
+    assert.ok(linea, r.stdout);
+    assert.match(linea, /^Terminadas sin coste en alguna fase: 12 de 12 \(diseno 12, implementacion 12, revision 9\): TASK-001 \(diseno, implementacion\), /);
+    assert.match(linea, /TASK-010 \(diseno, implementacion, revision\) y 2 mas \(lista completa con --json\)\.$/);
+    assert.doesNotMatch(linea, /TASK-011/);
+    const o = JSON.parse(metricas(alfa, ['--json']).stdout) as { sinCoste: { tareas: { id: string }[] } };
+    assert.equal(o.sinCoste.tareas.length, 12);
+    assert.equal(o.sinCoste.tareas[11]?.id, 'TASK-012');
+  });
+});
+
+test('--evolucion --grupos juntos: las dos secciones, en ese orden', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, ALFA);
+    const r = metricas(alfa, ['--grupos', '--evolucion']);
+    assert.equal(r.status, 0, r.stderr);
+    const i = r.stdout.indexOf('Evolucion por tramos');
+    const j = r.stdout.indexOf('Grupos de 5 tareas terminadas');
+    assert.ok(i === 0 && j > i, r.stdout);
+    assert.match(metricas(alfa, ['--grupos', '--tokens']).stderr, /--grupos no se combina con --tokens/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-repo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-repo.test.ts
new file mode 100644
index 0000000..1b93b76
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-repo.test.ts
@@ -0,0 +1,144 @@
+/**
+ * TASK-065: `taskctl metricas --repo <ruta>` (repetible) contra repos Git
+ * temporales reales. Dos repos con el mismo TASK-NNN no mezclan datos; con
+ * un solo repo la salida por stdout es la de siempre; las rutas se validan
+ * antes de leer nada (inexistente, sin tareas/, sin valor, mismo nombre de
+ * carpeta) y la misma carpeta escrita dos veces se lee una vez; --repo con
+ * --escribir aborta sin tocar nada.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, realpath } from 'node:fs/promises';
+import path from 'node:path';
+import { conRepos, escribirTareas, metricas, estado } from '../helpers/metricas-repos.js';
+
+/** Filas de la tabla (sin cabecera ni separador), celda a celda. */
+function filas(salida: string): string[][] {
+  return salida
+    .split('\n')
+    .filter((l) => l.startsWith('| ') && !l.startsWith('| id ') && !l.startsWith('| proyecto '))
+    .map((l) =>
+      l
+        .slice(1, -1)
+        .split('|')
+        .map((c) => c.trim())
+    );
+}
+
+test('--repo repetido: dos repos con el mismo TASK-NNN salen por separado, con su proyecto, sin mezclar hallazgos', async () => {
+  await conRepos(async (crear, base) => {
+    const alfa = await crear('alfa');
+    const beta = await crear('beta');
+    await escribirTareas(alfa, [
+      { id: 'TASK-001', finish: '2026-10-02T10:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'IMP-1', sev: 'IMPORTANTE' }] }] },
+    ]);
+    await escribirTareas(beta, [
+      {
+        id: 'TASK-001',
+        finish: '2026-10-03T10:00:00Z',
+        rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'MEN-1', sev: 'MENOR' }, { id: 'MEN-2', sev: 'MENOR' }] }],
+      },
+      { id: 'TASK-002', rondas: [{ veredicto: 'aprobada', hallazgos: null }] },
+    ]);
+    const r = metricas(base, ['--repo', 'alfa', '--repo', beta]);
+    assert.equal(r.status, 0, r.stderr);
+    const cab = r.stdout.split('\n').find((l) => l.startsWith('| proyecto '));
+    assert.ok(cab, `con varios repos la tabla abre con la columna proyecto:\n${r.stdout}`);
+    const f = filas(r.stdout);
+    // proyecto, id, complejidad, diseno, curso, revision, rondas, crit, imp, men, ...
+    const alfa1 = f.find((c) => c[0] === 'alfa' && c[1] === 'TASK-001');
+    const beta1 = f.find((c) => c[0] === 'beta' && c[1] === 'TASK-001');
+    assert.ok(alfa1 && beta1, r.stdout);
+    assert.deepEqual(alfa1.slice(7, 10), ['0', '1', '0']);
+    assert.deepEqual(beta1.slice(7, 10), ['0', '0', '2']);
+    assert.equal(f.length, 3);
+    // Avisos y listas con proyecto/ID; la lista de repos leidos por stderr.
+    assert.match(r.stderr, /\[AVISO\] 1 informe\(s\) de revision sin tabla .*: beta\/TASK-002\./);
+    assert.match(r.stderr, /^Repos leidos: alfa \(1 tareas, .*\); beta \(2 tareas, .*\)\./m);
+    assert.doesNotMatch(r.stdout, /Repos leidos/);
+  });
+});
+
+test('un solo --repo: stdout identico byte a byte al de sin --repo, y la lista de repos va por stderr', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, [
+      { id: 'TASK-001', finish: '2026-10-02T10:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [] }] },
+      { id: 'TASK-002', rondas: [{ veredicto: 'aprobada', hallazgos: null }] },
+    ]);
+    for (const extra of [[], ['--tokens'], ['--heuristica']]) {
+      const sin = metricas(alfa, extra);
+      const con = metricas(alfa, [...extra, '--repo', '.']);
+      assert.equal(sin.status, 0, sin.stderr);
+      assert.equal(con.status, 0, con.stderr);
+      assert.equal(con.stdout, sin.stdout, `metricas ${extra.join(' ')}`);
+      assert.equal(con.stderr, `Repos leidos: alfa (2 tareas, ${await realpath(alfa)}).\n${sin.stderr}`);
+      assert.doesNotMatch(sin.stdout, /proyecto/);
+    }
+  });
+});
+
+test('la misma carpeta dos veces (otra grafia, y otras mayusculas en Windows) se lee una vez y lo avisa', async () => {
+  await conRepos(async (crear, base) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, [{ id: 'TASK-001' }]);
+    const variantes = [path.join(alfa, '..', 'alfa'), `${alfa}${path.sep}.`];
+    if (process.platform === 'win32') variantes.push(alfa.toUpperCase());
+    for (const otra of variantes) {
+      const r = metricas(base, ['--repo', alfa, '--repo', otra]);
+      assert.equal(r.status, 0, r.stderr);
+      assert.equal(filas(r.stdout).length, 1, `${otra}: la tarea sale una vez\n${r.stdout}`);
+      assert.match(r.stderr, /es la misma carpeta que --repo .*: se lee una sola vez/);
+      assert.doesNotMatch(r.stdout, /\| proyecto /, 'un solo proyecto: sin columna proyecto');
+    }
+  });
+});
+
+test('dos carpetas distintas con el mismo nombre abortan sin leer nada', async () => {
+  await conRepos(async (crear, base) => {
+    const uno = await crear('proy', 'uno');
+    const dos = await crear('proy', 'dos');
+    const r = metricas(base, ['--repo', uno, '--repo', dos]);
+    assert.equal(r.status, 1);
+    assert.match(r.stderr, /se llaman igual \("proy"\)/);
+    assert.equal(r.stdout, '');
+  });
+});
+
+test('--repo inexistente, sin tareas/ o sin valor aborta antes de leer', async () => {
+  await conRepos(async (crear, base) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, [{ id: 'TASK-001' }]);
+    await mkdir(path.join(base, 'vacio'));
+    const casos: [string[], RegExp][] = [
+      [['--repo', alfa, '--repo', path.join(base, 'no-existe')], /--repo ".*no-existe": no existe/],
+      [['--repo', alfa, '--repo', 'vacio'], /no tiene carpeta "tareas"/],
+      [['--repo', alfa, '--repo'], /--repo necesita la ruta/],
+      [['--repo', '--tokens'], /--repo necesita la ruta/],
+      [['--repo='], /--repo necesita la ruta/],
+    ];
+    for (const [args, error] of casos) {
+      const r = metricas(base, args);
+      assert.equal(r.status, 1, args.join(' '));
+      assert.match(r.stderr, error);
+      assert.equal(r.stdout, '', `${args.join(' ')}: nada por stdout`);
+    }
+  });
+});
+
+test('--repo con --escribir aborta y no toca ningun repo', async () => {
+  await conRepos(async (crear) => {
+    const alfa = await crear('alfa');
+    await escribirTareas(alfa, [{ id: 'TASK-001' }]);
+    const antes = estado(alfa);
+    for (const args of [
+      ['--tokens', '--escribir', '--repo', '.'],
+      ['--repo', '.', '--tokens', '--escribir'],
+    ]) {
+      const r = metricas(alfa, args);
+      assert.equal(r.status, 1);
+      assert.match(r.stderr, /--repo no se combina con --escribir/);
+      assert.equal(estado(alfa), antes);
+    }
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
index c95612d..fc77474 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
@@ -79,7 +79,7 @@ test('ciclo completo por CLI: cada transicion con instante y metricas lo mide de
     // El informe de prueba trae un MEN-1 sin celda de Origen.
     assert.deepEqual([crit, imp, men, hallOrigen], ['0', '0', '1', '0/0/0/1']);
     assert.match(r.stdout, /Informes sin tabla de hallazgos: 0 \(en 0 tareas\)/);
-    assert.match(r.stdout, /Terminadas sin coste en alguna fase: 1 de 1: TASK-001 \(diseno, implementacion, revision\)/);
+    assert.match(r.stdout, /Terminadas sin coste en alguna fase: 1 de 1 \(diseno 1, implementacion 1, revision 1\): TASK-001 \(diseno, implementacion, revision\)/);
     assert.equal(cierre, (filas[4] as { fecha: string }).fecha.slice(0, 10));
     assert.equal(origen, 'registro');
     assert.match(r.stdout, /Las pausas no se descuentan/);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
index 9a9b044..2e0e936 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
@@ -261,3 +261,71 @@ test('TASK-063: una tarea con tabla ## Coste sigue siendo valida para doctor, ig
     });
   });
 });
+
+test('TASK-065 --agente reanudado: con el id ya anotado en la fase registra solo lo que crecio la transcripcion, y metricas no lo avisa', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      // Primer trabajo del agente: m1 = 100 de entrada + 20 de salida.
+      await transcripcion(config, 'p', 's', A, [linea('m1', 100, 20)]);
+      assert.equal(coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]).status, 0);
+      assert.deepEqual(await valor(tareasRoot), [null, 120, null]);
+
+      // Se reanuda el MISMO agente: su transcripcion acumula m1 y el trabajo nuevo, m2 (200 + 30).
+      await transcripcion(config, 'p', 's', A, [linea('m1', 100, 20), linea('m2', 200, 30)]);
+      const r = coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]);
+      assert.equal(r.status, 0, r.stderr);
+      assert.match(r.stdout, /\+230 tokens de implementacion/);
+      assert.match(r.stdout, /Ya anotado en implementacion: a1b2c3d4e5f60718\. Es un agente reanudado/);
+      assert.deepEqual(await valor(tareasRoot), [null, 350, null], '120 + 230, no 120 + 350');
+      const filas = leerCostes((await cuerpo(tareasRoot)).body);
+      assert.deepEqual(
+        filas.map((f) => [f.fuente, f.entrada, f.salida, f.total]),
+        [
+          [`agente:${A}`, 100, 20, 120],
+          [`agente:dif:${A}`, 200, 30, 230],
+        ]
+      );
+
+      // Una tercera vez sin que crezca: nada que registrar, y no se toca nada.
+      const antes = head(repo);
+      const igual = coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]);
+      assert.equal(igual.status, 1);
+      assert.match(igual.stderr, /ya esta anotado en esta fase con 350 tokens y su transcripcion no ha crecido/);
+      assert.equal(head(repo), antes);
+
+      // Crece otra vez: la diferencia es contra todo lo anotado (la fila original y la de diferencia).
+      await transcripcion(config, 'p', 's', A, [linea('m1', 100, 20), linea('m2', 200, 30), linea('m3', 5, 5)]);
+      assert.equal(coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]).status, 0);
+      assert.deepEqual(await valor(tareasRoot), [null, 360, null]);
+
+      // En otra fase el mismo id no esta anotado: cuenta entero.
+      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--agente', A]).status, 0);
+      assert.deepEqual(await valor(tareasRoot), [null, 360, 360]);
+
+      // metricas: ni repetido ni descuadre (el desglose cuadra con tokens_implementacion).
+      const m = spawnSync(process.execPath, [TASKCTL, 'metricas', '--tokens'], { cwd: repo, encoding: 'utf8' });
+      assert.equal(m.status, 0, m.stderr);
+      assert.doesNotMatch(m.stderr, /aparece en \d+ filas/);
+      assert.doesNotMatch(m.stderr, /supera tokens_/);
+    });
+  });
+});
+
+test('TASK-065 --agente reanudado: un id anotado junto a otro en la misma fila aborta (no se sabe cuanto es suyo)', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      await transcripcion(config, 'p', 's', A, [linea('m1', 10, 10)]);
+      await transcripcion(config, 'p', 's', B, [linea('m1', 5, 5)]);
+      assert.equal(coste(repo, config, [ID, '--fase', 'diseno', '--agente', A, '--agente', B]).status, 0);
+      await transcripcion(config, 'p', 's', A, [linea('m1', 10, 10), linea('m2', 1, 1)]);
+      const antes = head(repo);
+      const r = coste(repo, config, [ID, '--fase', 'diseno', '--agente', A]);
+      assert.equal(r.status, 1);
+      assert.match(r.stderr, /ya esta anotado en "## Coste" de diseno en una fila .* junto a otros agentes.*--tokens N/s);
+      assert.equal(head(repo), antes);
+      assert.deepEqual(await valor(tareasRoot), [30, null, null]);
+    });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
index 0e24f10..5b3db2d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
@@ -173,9 +173,10 @@ test('pause solo admite --push y -p, y se los pasa al script', async () => {
     assert.ok(error instanceof WrapperCommandError);
     assert.match((error as Error).message, /solo admite --push y -p/);
 
-    // Las dos grafias validas llegan al script, tal cual y sin
-    // duplicar: se comprueba con un doble del script que escribe sus
-    // argumentos, no con el pause-work.sh real (que haria un push).
+    // Las dos grafias validas llegan al script, tal cual: se comprueba con
+    // un doble del script que escribe sus argumentos, no con el
+    // pause-work.sh real (que haria un push). TASK-065: repetida, como en
+    // el resto de comandos, aborta antes de llamar al script.
     const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
     try {
       await writeFile(
@@ -184,7 +185,10 @@ test('pause solo admite --push y -p, y se los pasa al script', async () => {
         'utf8'
       );
       for (const opcion of ['--push', '-p']) {
-        assert.equal(run('pause', [opcion, opcion], repoRoot, { scriptsDir }).code, 0);
+        const repetida = capturaError(() => run('pause', [opcion, opcion], repoRoot, { scriptsDir }));
+        assert.ok(repetida instanceof WrapperCommandError);
+        assert.match((repetida as Error).message, /esta repetido y no admite repeticion/);
+        assert.equal(run('pause', [opcion], repoRoot, { scriptsDir }).code, 0);
         const argsPath = path.join(repoRoot, 'args.txt');
         assert.equal(
           await readFile(argsPath, 'utf8'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts
index a33f8bc..d75bdf2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts
@@ -4,7 +4,15 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { anadirCoste, CABECERA_COSTE, leerCostes, SECCION_COSTE, type FilaCoste } from '../../src/core/coste-registro.js';
+import {
+  anadirCoste,
+  CABECERA_COSTE,
+  idsDeFuente,
+  leerCostes,
+  resumirCostes,
+  SECCION_COSTE,
+  type FilaCoste,
+} from '../../src/core/coste-registro.js';
 import { anadirTransicion, leerTransiciones } from '../../src/core/transiciones.js';
 
 const AGENTE: FilaCoste = {
@@ -110,3 +118,18 @@ test('filas editadas a mano con valores raros se ignoran; fecha de dia vale', ()
     '| 2026-10-25 | revision | manual | - | - | - | - | 7 |\n'; // columnas de menos
   assert.deepEqual(leerCostes(body), [{ ...MANUAL, fecha: '2026-10-25', fase: 'revision', total: 7 }]);
 });
+
+// TASK-065: la fila de diferencia de un agente reanudado no es una repeticion.
+test('idsDeFuente reconoce dif:<id>; resumirCostes no avisa de un agente con su fila de diferencia, si de uno registrado dos veces', () => {
+  assert.deepEqual(idsDeFuente('agente:a1,dif:b2'), [
+    { id: 'a1', diferencia: false },
+    { id: 'b2', diferencia: true },
+  ]);
+  assert.deepEqual(idsDeFuente('manual'), [{ id: 'manual', diferencia: false }]);
+  const reg = { diseno: 2 * AGENTE.total, implementacion: null, revision: null };
+  const conDif = resumirCostes([AGENTE, { ...AGENTE, fuente: 'agente:dif:a1b2c3d4e5f60718' }], reg);
+  assert.deepEqual(conDif.repetidas, []);
+  assert.equal(conDif.fases.diseno.sinDesglose, 0, 'la diferencia cuenta en el desglose');
+  const dosVeces = resumirCostes([AGENTE, AGENTE], reg);
+  assert.deepEqual(dosVeces.repetidas, [{ fase: 'diseno', fuente: 'a1b2c3d4e5f60718', filas: 2 }]);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts
new file mode 100644
index 0000000..045fe2a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts
@@ -0,0 +1,88 @@
+/**
+ * TASK-065: evolucion por tramos, en puro. Orden por dia de cierre con
+ * desempate por proyecto y numero de ID, tramos de N, cifras con su n (null
+ * solo con n 0) y las terminadas sin cierre contadas aparte por proyecto.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { calcularFila, type FilaMetricas } from '../../src/core/metricas.js';
+import { calcularEvolucion, formatearEvolucion, ordenarPorCierre, numeroDeId } from '../../src/core/evolucion.js';
+import { tarea } from '../helpers/tarea-ejemplo.js';
+
+function fila(o: Partial<FilaMetricas> & { id: string }): FilaMetricas {
+  const base = calcularFila({ task: tarea({ id: o.id }), body: '', ronda: 0, eventosGit: [] });
+  return { ...base, cierre: '2026-10-01', ...o };
+}
+
+test('orden de cierre: solo el dia, luego proyecto, luego NUMERO de ID (TASK-99 antes que TASK-100)', () => {
+  const filas = [
+    fila({ id: 'TASK-100', proyecto: 'a' }),
+    fila({ id: 'TASK-099', proyecto: 'a' }),
+    fila({ id: 'TASK-001', proyecto: 'b' }),
+    fila({ id: 'TASK-500', proyecto: 'a', cierre: '2026-09-30' }),
+  ];
+  assert.deepEqual(
+    ordenarPorCierre(filas).map((f) => `${f.proyecto}/${f.id}`),
+    ['a/TASK-500', 'a/TASK-099', 'a/TASK-100', 'b/TASK-001']
+  );
+  assert.equal(numeroDeId('TASK-0099'), 99);
+});
+
+test('tramos de N: el ultimo parcial dice su n; sin cierre fuera y contadas por proyecto; no terminadas no entran', () => {
+  const filas = [
+    ...Array.from({ length: 5 }, (_, i) => fila({ id: `TASK-00${String(i + 1)}`, proyecto: 'a', cierre: `2026-10-0${String(i + 1)}` })),
+    fila({ id: 'TASK-010', proyecto: 'a', cierre: null }),
+    fila({ id: 'TASK-011', proyecto: 'b', cierre: null }),
+    fila({ id: 'TASK-012', proyecto: 'b', cierre: null }),
+    fila({ id: 'TASK-013', proyecto: 'b', estado: 'en-curso', cierre: null }),
+  ];
+  const e = calcularEvolucion(filas, 2);
+  assert.equal(e.terminadas, 8);
+  assert.equal(e.enTramos, 5);
+  assert.deepEqual(e.sinCierre, { total: 3, porProyecto: { a: 1, b: 2 } });
+  assert.deepEqual(e.tramos.map((t) => t.n), [2, 2, 1]);
+  assert.deepEqual([e.tramos[2]?.desde, e.tramos[2]?.hasta], ['2026-10-05', '2026-10-05']);
+  const texto = formatearEvolucion(e, true);
+  assert.match(texto, /fuera por no tener fecha de cierre: 3 \(a 1, b 2\)\./);
+});
+
+test('cifras con su n: un tramo con tareas pero sin ningun total da mediana null con n 0, nunca NaN', () => {
+  const sinTotal = [fila({ id: 'TASK-001' }), fila({ id: 'TASK-002', total: { valor: 3, precision: 'dia' } })];
+  const t = calcularEvolucion(sinTotal, 20).tramos[0];
+  assert.ok(t);
+  assert.deepEqual(t.minutosPlanAFinish, { valor: null, n: 0, soloDia: 1 });
+  assert.deepEqual(t.rondas, { valor: null, n: 0 });
+  assert.deepEqual(t.importantesPorTarea, { valor: null, n: 0 });
+  assert.deepEqual(t.tokensRevision, { valor: null, n: 0 });
+  assert.deepEqual(t.kbPeticionPorRonda, { valor: null, n: 0 });
+  assert.doesNotMatch(JSON.stringify(t), /NaN/);
+  assert.match(formatearEvolucion(calcularEvolucion(sinTotal, 20), false), /\| — \(n=0\) /);
+});
+
+test('cifras: mediana de minutos con hora, rondas, IMPORTANTE por tarea, tokens y KB por ronda', () => {
+  const hall = (imp: number) => ({
+    informes: 1,
+    informesSinTabla: [],
+    porSeveridad: { CRITICO: 0, IMPORTANTE: imp, MENOR: 0, desconocida: 0 },
+    porOrigen: { implementacion: imp, plan: 0, especificacion: 0, 'sin clasificar': 0 },
+    severidadesDesconocidas: [],
+  });
+  const filas = [
+    fila({ id: 'TASK-001', total: { valor: 10 * 60_000, precision: 'segundo' }, rondas: 1, hallazgos: hall(0), tokens: { diseno: null, implementacion: null, revision: 100 }, kbPeticionPorRonda: [{ ronda: 1, kb: 10 }] }),
+    fila({ id: 'TASK-002', total: { valor: 30 * 60_000, precision: 'segundo' }, rondas: 3, hallazgos: hall(3), kbPeticionPorRonda: [{ ronda: 1, kb: 20 }, { ronda: 2, kb: 40 }] }),
+    fila({ id: 'TASK-003', total: { valor: 2, precision: 'dia' } }),
+  ];
+  const t = calcularEvolucion(filas).tramos[0];
+  assert.ok(t);
+  assert.deepEqual(t.minutosPlanAFinish, { valor: 20, n: 2, soloDia: 1 });
+  assert.deepEqual(t.rondas, { valor: 2, n: 2 });
+  assert.deepEqual(t.importantesPorTarea, { valor: 1.5, n: 2 });
+  assert.deepEqual(t.tokensRevision, { valor: 100, n: 1 });
+  assert.deepEqual(t.kbPeticionPorRonda, { valor: 20, n: 2 });
+});
+
+test('sin tareas: cero tramos, y el texto lo dice', () => {
+  const e = calcularEvolucion([], 20);
+  assert.deepEqual(e, { tamanoTramo: 20, terminadas: 0, enTramos: 0, sinCierre: { total: 0, porProyecto: {} }, tramos: [] });
+  assert.match(formatearEvolucion(e, false), /0 tareas terminadas, 0 en tramos; fuera por no tener fecha de cierre: ninguna\./);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/grupos-metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/grupos-metricas.test.ts
new file mode 100644
index 0000000..02bfacc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/grupos-metricas.test.ts
@@ -0,0 +1,123 @@
+/**
+ * TASK-065: grupos de tareas terminadas, en puro. Grupos fijos (un grupo
+ * vacio sale con n 0 y cifras null), «aprobada a la primera» sobre las
+ * revisadas, sin revision y sin tabla aparte, y terciles de KB por valor con
+ * todos los proyectos juntos.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { calcularFila, type FilaMetricas } from '../../src/core/metricas.js';
+import { calcularGrupos, formatearGrupos, tramoCriterios, aprobadaALaPrimera } from '../../src/core/grupos-metricas.js';
+import { tarea } from '../helpers/tarea-ejemplo.js';
+
+function fila(o: Partial<FilaMetricas> & { id: string }): FilaMetricas {
+  const base = calcularFila({ task: tarea({ id: o.id }), body: '', ronda: 0, eventosGit: [] });
+  return { ...base, proyecto: 'a', ...o };
+}
+
+const hall = (crit: number, imp: number) => ({
+  informes: 1,
+  informesSinTabla: [],
+  porSeveridad: { CRITICO: crit, IMPORTANTE: imp, MENOR: 5, desconocida: 0 },
+  porOrigen: { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': crit + imp + 5 },
+  severidadesDesconocidas: [],
+});
+const sinTabla = {
+  informes: 1,
+  informesSinTabla: ['informe-revision-1.md'],
+  porSeveridad: null,
+  porOrigen: null,
+  severidadesDesconocidas: [],
+};
+const kb = (...v: number[]) => v.map((x, i) => ({ ronda: i + 1, kb: x }));
+
+test('aprobada a la primera: una sola ronda y veredicto aprobada (incluye con correcciones); con cambios o dos rondas no', () => {
+  assert.equal(aprobadaALaPrimera(fila({ id: 'TASK-001', rondas: 1, veredictoRonda1: 'aprobada' })), true);
+  assert.equal(aprobadaALaPrimera(fila({ id: 'TASK-001', rondas: 1, veredictoRonda1: 'cambios-solicitados' })), false);
+  assert.equal(aprobadaALaPrimera(fila({ id: 'TASK-001', rondas: 2, veredictoRonda1: 'aprobada' })), false);
+  assert.deepEqual([0, 4, 5, 6, 7, 30].map(tramoCriterios), ['0-4', '0-4', '5-6', '5-6', '7+', '7+']);
+});
+
+test('grupos: fijos y vacios con n 0 y null; % sobre revisadas; sin revision y sin tabla aparte; no terminadas fuera', () => {
+  const filas = [
+    fila({ id: 'TASK-001', tipo: 'fix', criterios: 3, rondas: 1, veredictoRonda1: 'aprobada', hallazgos: hall(1, 1) }),
+    fila({ id: 'TASK-002', tipo: 'fix', criterios: 5, rondas: 2, veredictoRonda1: 'cambios-solicitados', hallazgos: hall(0, 2) }),
+    fila({ id: 'TASK-003', tipo: 'fix', criterios: 9, rondas: 1, veredictoRonda1: 'aprobada', hallazgos: sinTabla }),
+    fila({ id: 'TASK-004', tipo: 'fix', criterios: 9 }),
+    fila({ id: 'TASK-005', tipo: 'feature', estado: 'en-curso', rondas: 1, veredictoRonda1: 'aprobada' }),
+  ];
+  const g = calcularGrupos(filas, ['a', 'b']);
+  assert.equal(g.terminadas, 4);
+  assert.equal(g.sinRevision, 1);
+  assert.equal(g.sinTablaHallazgos, 1);
+  assert.deepEqual(
+    g.porTipo.find((x) => x.grupo === 'fix'),
+    {
+      grupo: 'fix',
+      n: 4,
+      conRevision: 3,
+      aprobadasPrimera: 2,
+      pctAprobadaPrimera: 66.7,
+      rondasMedia: 1.33,
+      conHallazgos: 2,
+      critImpPorTarea: 2,
+      sinRevision: 1,
+      sinTablaHallazgos: 1,
+    }
+  );
+  assert.deepEqual(
+    g.porTipo.find((x) => x.grupo === 'feature'),
+    {
+      grupo: 'feature',
+      n: 0,
+      conRevision: 0,
+      aprobadasPrimera: 0,
+      pctAprobadaPrimera: null,
+      rondasMedia: null,
+      conHallazgos: 0,
+      critImpPorTarea: null,
+      sinRevision: 0,
+      sinTablaHallazgos: 0,
+    }
+  );
+  assert.deepEqual(g.porTipo.map((x) => x.grupo), ['feature', 'fix', 'hotfix', 'release']);
+  assert.deepEqual(g.porComplejidad.map((x) => x.grupo), ['trivial', 'simple', 'media', 'alta', 'critica', '—']);
+  assert.deepEqual(g.porCriterios.map((x) => [x.grupo, x.n]), [['0-4', 1], ['5-6', 1], ['7+', 2]]);
+  assert.deepEqual(g.porProyecto.map((x) => [x.grupo, x.n]), [['a', 4], ['b', 0]], 'un proyecto sin tareas sale con n 0');
+  assert.doesNotMatch(JSON.stringify(g), /NaN/);
+  assert.match(formatearGrupos(g), /\| feature +\| 0 +\| 0 +\| — +\| — +\| — +\| 0 +\| 0 +\|/);
+});
+
+test('terciles de KB: cortes por valor con todos los proyectos juntos; iguales en el mismo tercil; sin peticion fuera', () => {
+  const filas = [
+    fila({ id: 'TASK-001', proyecto: 'a', kbPeticionPorRonda: kb(1) }),
+    fila({ id: 'TASK-002', proyecto: 'a', kbPeticionPorRonda: kb(2, 4) }), // media 3
+    fila({ id: 'TASK-003', proyecto: 'b', kbPeticionPorRonda: kb(3) }),
+    fila({ id: 'TASK-004', proyecto: 'b', kbPeticionPorRonda: kb(9) }),
+    fila({ id: 'TASK-005', proyecto: 'b', kbPeticionPorRonda: kb(20) }),
+    fila({ id: 'TASK-006', proyecto: 'b', kbPeticionPorRonda: kb(30) }),
+    fila({ id: 'TASK-007', proyecto: 'b' }),
+  ];
+  const g = calcularGrupos(filas, ['a', 'b']);
+  // Ordenados: 1, 3, 3, 9, 20, 30 -> c1 = posicion 2 (3), c2 = posicion 4 (9).
+  assert.deepEqual(g.porKb.cortes, { c1: 3, c2: 9 });
+  assert.equal(g.porKb.sinKb, 1);
+  assert.deepEqual(g.porKb.grupos.map((x) => [x.grupo, x.n]), [
+    ['bajo (<= 3 KB)', 3],
+    ['medio (3-9 KB)', 1],
+    ['alto (> 9 KB)', 2],
+  ]);
+});
+
+test('sin tareas: todos los grupos vacios, cortes null, y el texto sin NaN', () => {
+  const g = calcularGrupos([], []);
+  assert.equal(g.terminadas, 0);
+  assert.equal(g.porKb.cortes, null);
+  assert.deepEqual(g.porKb.grupos.map((x) => [x.grupo, x.n, x.pctAprobadaPrimera]), [
+    ['bajo', 0, null],
+    ['medio', 0, null],
+    ['alto', 0, null],
+  ]);
+  assert.deepEqual(g.porProyecto, []);
+  assert.doesNotMatch(formatearGrupos(g) + JSON.stringify(g), /NaN|undefined/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-agregados.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-agregados.test.ts
new file mode 100644
index 0000000..361e12d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-agregados.test.ts
@@ -0,0 +1,56 @@
+/**
+ * TASK-065: lo que los agregados necesitan de cada fila (duracion total de
+ * plan a finish y veredicto de la ronda 1), en puro.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { calcularFila, type EntradaMetricas } from '../../src/core/metricas.js';
+import { tarea } from '../helpers/tarea-ejemplo.js';
+
+function transiciones(...filas: [string, string][]): string {
+  return [
+    '## Transiciones',
+    '',
+    '| fecha | fase | modo | decidido_por |',
+    '|---|---|---|---|',
+    ...filas.map(([fecha, fase]) => `| ${fecha} | ${fase} | manual | persona |`),
+    '',
+  ].join('\n');
+}
+
+function entrada(o: Partial<EntradaMetricas> = {}): EntradaMetricas {
+  return { task: tarea(), body: '## Objetivo\n\nAlgo.\n', ronda: 0, eventosGit: [], ...o };
+}
+
+const informe = (ronda: number, veredicto: string, revisor = '') => ({
+  fichero: `informe-revision-${String(ronda)}${revisor === '' ? '' : `-${revisor}`}.md`,
+  ronda,
+  revisor,
+  texto: `# Informe\n\n- Veredicto: ${veredicto}\n`,
+});
+
+test('total: de plan a finish en ms con hora, en dias si alguna marca es de dia, null sin finish', () => {
+  const conHora = calcularFila(
+    entrada({ body: transiciones(['2026-10-01T10:00:00Z', 'plan'], ['2026-10-01T11:30:00Z', 'finish']) })
+  );
+  assert.deepEqual(conHora.total, { valor: 90 * 60_000, precision: 'segundo' });
+  const dia = calcularFila(entrada({ body: transiciones(['2026-10-01', 'plan'], ['2026-10-03T11:30:00Z', 'finish']) }));
+  assert.deepEqual(dia.total, { valor: 2, precision: 'dia' });
+  const sinFin = calcularFila(entrada({ body: transiciones(['2026-10-01T10:00:00Z', 'plan']) }));
+  assert.equal(sinFin.total, null);
+});
+
+test('veredictoRonda1: aprobada-con-correcciones cuenta como aprobada; un fragmento que pide cambios manda; null sin informes de la ronda 1', () => {
+  assert.equal(calcularFila(entrada({ informes: [informe(1, 'aprobada-con-correcciones')] })).veredictoRonda1, 'aprobada');
+  assert.equal(
+    calcularFila(entrada({ informes: [informe(1, 'aprobada', 'a'), informe(1, 'cambios-solicitados', 'b')] })).veredictoRonda1,
+    'cambios-solicitados'
+  );
+  // La ronda 2 no cambia el veredicto de la primera.
+  assert.equal(
+    calcularFila(entrada({ informes: [informe(1, 'cambios-solicitados'), informe(2, 'aprobada')] })).veredictoRonda1,
+    'cambios-solicitados'
+  );
+  assert.equal(calcularFila(entrada()).veredictoRonda1, null);
+  assert.equal(calcularFila(entrada({ informes: [informe(2, 'aprobada')] })).veredictoRonda1, null);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
index 0d6ab99..4d6ce18 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
@@ -336,12 +336,12 @@ test('notas: informes sin tabla, mediana de lecturas por fase y terminadas sin c
   assert.deepEqual(medianaLecturas(filas).revision, { mediana: null, n: 0 });
 
   // tokens_implementacion a 0 cuenta como falta (registrar-coste no deja registrar 0).
-  assert.deepEqual(tareasSinCoste(filas), [{ id: 'TASK-009', fases: ['implementacion', 'revision'] }]);
+  assert.deepEqual(tareasSinCoste(filas), [{ proyecto: '', id: 'TASK-009', fases: ['implementacion', 'revision'] }]);
 
   const notas = notasFilaEnriquecida(filas).join('\n');
   assert.match(notas, /Informes sin tabla de hallazgos: 1 \(en 1 tareas\)/);
   assert.match(notas, /diseno 5\.5 \(n=4\), implementacion — \(n=0\), revision — \(n=0\)/);
-  assert.match(notas, /Terminadas sin coste en alguna fase: 1 de 5: TASK-009 \(implementacion, revision\)\./);
+  assert.match(notas, /Terminadas sin coste en alguna fase: 1 de 5 \(diseno 0, implementacion 1, revision 1\): TASK-009 \(implementacion, revision\)\./);
   assert.match(avisoInformesSinTabla(filas) ?? '', /^1 informe\(s\) de revision sin tabla .* TASK-009\.$/);
   assert.equal(avisoInformesSinTabla([enCurso]), null);
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
new file mode 100644
index 0000000..048008f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
@@ -0,0 +1,159 @@
+/**
+ * TASK-065: repos Git temporales reales para las metricas agregadas
+ * (`--repo`, `--evolucion`, `--grupos`, `--json`). Las tareas se escriben
+ * con el serializador del propio plugin (`serializeTareaFile`) en la carpeta
+ * de su estado, con su tabla `## Transiciones`, sus criterios, sus informes
+ * y peticiones de revision, y se commitean: lo que `metricas` lee es un repo
+ * de verdad, no un doble.
+ */
+import assert from 'node:assert/strict';
+import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { STATE_FOLDER, type Task, type TaskComplexity, type TaskState, type TaskType } from '../../src/core/task.js';
+import { TASKCTL } from './automatico-fixtures.js';
+
+export interface RondaFixture {
+  /** Linea `- Veredicto:` del informe. */
+  veredicto: string;
+  /** Filas de hallazgos (ID y severidad); null = informe en prosa, sin tabla. */
+  hallazgos: { id: string; sev: string }[] | null;
+  /** Bytes de la peticion de revision de la ronda; sin el, no hay peticion. */
+  bytesPeticion?: number;
+}
+
+export interface TareaFixture {
+  id: string;
+  tipo?: TaskType;
+  complejidad?: TaskComplexity | null;
+  estado?: TaskState;
+  criterios?: number;
+  /** Instante (o dia) del `plan`; null = sin fila de plan. */
+  plan?: string | null;
+  /** Instante (o dia) del `finish`; null = sin cierre. */
+  finish?: string | null;
+  rondas?: RondaFixture[];
+  tokensRevision?: number | null;
+}
+
+function git(args: string[], cwd: string): string {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
+  return r.stdout;
+}
+
+function tarea(t: TareaFixture): Task {
+  return {
+    id: t.id,
+    titulo: `Tarea ${t.id}`,
+    tipo: t.tipo ?? 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: t.complejidad === undefined ? 'simple' : t.complejidad,
+    modelo_sugerido: 'sonnet',
+    estado: t.estado ?? 'terminada',
+    plan_aprobado: true,
+    rama: `feature/${t.id.toLowerCase()}`,
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: t.tokensRevision ?? null,
+    creado: '2026-10-01',
+    actualizado: '2026-10-01',
+    dependencias: [],
+  } as unknown as Task;
+}
+
+function cuerpo(t: TareaFixture): string {
+  const criterios = Array.from({ length: t.criterios ?? 2 }, (_, i) => `- [ ] Criterio ${String(i + 1)}`);
+  const filas: string[] = [];
+  const plan = t.plan === undefined ? '2026-10-01T10:00:00Z' : t.plan;
+  if (plan !== null) filas.push(`| ${plan} | plan | manual | persona |`);
+  const fin = t.finish === undefined ? null : t.finish;
+  if (fin !== null) filas.push(`| ${fin} | finish | manual | persona |`);
+  return [
+    '## Objetivo',
+    '',
+    'Medir.',
+    '',
+    '## Criterios de aceptacion',
+    ...criterios,
+    '',
+    '## Transiciones',
+    '',
+    '| fecha | fase | modo | decidido_por |',
+    '|---|---|---|---|',
+    ...filas,
+    '',
+  ].join('\n');
+}
+
+function informe(r: RondaFixture): string {
+  const tabla =
+    r.hallazgos === null
+      ? 'Sin tabla: todo en prosa.\n'
+      : '## Hallazgos\n\n| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n' +
+        r.hallazgos.map((h) => `| ${h.id} | ${h.sev} | corregido | a.ts |`).join('\n') +
+        '\n';
+  return `# Informe\n\n- Veredicto: ${r.veredicto}\n\n${tabla}`;
+}
+
+/** Escribe las tareas en `repo` (repo git ya creado) y lo commitea todo. */
+export async function escribirTareas(repo: string, tareas: readonly TareaFixture[]): Promise<void> {
+  for (const t of tareas) {
+    const dir = path.join(repo, 'tareas', STATE_FOLDER[t.estado ?? 'terminada'], t.id);
+    await mkdir(dir, { recursive: true });
+    await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(tarea(t), cuerpo(t)), 'utf8');
+    const rondas = t.rondas ?? [];
+    if (rondas.length > 0) await mkdir(path.join(dir, 'revision'), { recursive: true });
+    for (const [i, r] of rondas.entries()) {
+      const n = String(i + 1);
+      await writeFile(path.join(dir, 'revision', `informe-revision-${n}.md`), informe(r), 'utf8');
+      if (r.bytesPeticion !== undefined) {
+        await writeFile(path.join(dir, 'revision', `peticion-revision-${n}.md`), 'x'.repeat(r.bytesPeticion), 'utf8');
+      }
+    }
+  }
+  git(['add', '-A'], repo);
+  git(['commit', '-q', '--allow-empty', '-m', 'test: tareas'], repo);
+}
+
+/**
+ * Un directorio temporal en el que cada `crear(nombre, ruta?)` monta un repo
+ * git con `tareas/` en `<tmp>/<ruta>/<nombre>` (el nombre es el proyecto).
+ * Todo se borra al terminar.
+ */
+export async function conRepos(
+  fn: (crear: (nombre: string, sub?: string) => Promise<string>, base: string) => Promise<void>
+): Promise<void> {
+  const base = await mkdtemp(path.join(tmpdir(), 'taskctl-metricas-repos-'));
+  try {
+    await fn(async (nombre, sub = '') => {
+      const repo = path.join(base, sub, nombre);
+      await mkdir(path.join(repo, 'tareas'), { recursive: true });
+      git(['init', '-q', '-b', 'develop'], repo);
+      git(['config', 'user.email', 'test@example.com'], repo);
+      git(['config', 'user.name', 'Test'], repo);
+      git(['commit', '-q', '--allow-empty', '-m', 'inicial'], repo);
+      return repo;
+    }, base);
+  } finally {
+    await rm(base, { recursive: true, force: true });
+  }
+}
+
+export function metricas(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
+  const r = spawnSync(process.execPath, [TASKCTL, 'metricas', ...args], { cwd, encoding: 'utf8' });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+export function estado(repo: string): string {
+  return git(['status', '--porcelain', '--untracked-files=all'], repo);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/tarea-ejemplo.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/tarea-ejemplo.ts
new file mode 100644
index 0000000..3c9718d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/tarea-ejemplo.ts
@@ -0,0 +1,31 @@
+/** TASK-065: una tarea terminada valida para los tests puros de metricas. */
+import type { Task } from '../../src/core/task.js';
+
+export function tarea(o: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-007',
+    titulo: 'Medir',
+    tipo: 'fix',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'terminada',
+    plan_aprobado: true,
+    rama: 'fix/x',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
+    creado: '2026-10-01',
+    actualizado: '2026-10-05',
+    dependencias: [],
+    ...o,
+  } as Task;
+}
+
````

## Excluido del diff (17 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-065/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-065/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-065/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-065/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-065/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-065/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-065/tarea.md                                                       |   5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  28 ++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js                                            |  63 +++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                                     |   4 ++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   | 301 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js                            | 106 +++++++++++++++++++----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/wrappers.js                                   |   8 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-registro.js                                 |  25 +++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/evolucion.js                                      | 136 ++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/grupos-metricas.js                                | 145 ++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       |  87 +++++++++++++++++++-----
 17 files changed, 800 insertions(+), 108 deletions(-)
````
