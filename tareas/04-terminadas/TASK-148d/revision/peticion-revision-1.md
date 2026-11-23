# Peticion de revision — TASK-148d (ronda 1)

- Tarea: TASK-148d — comentarios, diluvio y E/S en core (parte d de TASK-148)
- Rama revisada: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
- Rama base: develop
- Commit revisado (HEAD): 53cc8a657c1736d46447f1c3b8404e863a29de8e
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-148d (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-148d/tarea.md
- tareas/03-en-revision/TASK-148d/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/grupos-metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-registro.test.ts

## Commits a revisar (git log develop..HEAD)

````
53cc8a6 chore(TASK-148d): autorrevision
311df9b fix(TASK-148d): comentarios ciertos, heuristica sin repetir y un formateador de guion
0bf2818 chore(TASK-148d): tarea en curso
9d63ff7 merge(TASK-148d): develop en fix/task-148-regla-4d-catalogos-config-y-utilidades-e para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 2ac5f34..501f85a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -730,11 +730,6 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     try {
       const result = await runApproveCommand(tareasRoot, argv.slice(1), today(), { repoCwd, ahora: ahora() });
       printBaseBranchSwitchNotice(result.baseBranchGuard);
-      // Nota (hallazgo menor de revision por pares): para complejidad
-      // trivial/simple, "taskctl start" nunca exigio plan_aprobado
-      // (ver TRIVIAL_SIN_APROBACION en state-machine.ts) — el mensaje
-      // no sobrevende que approve fuera un requisito, solo confirma el
-      // resultado del propio comando.
       process.stdout.write(
         `Tarea ${result.id} aprobada (plan_aprobado: true): ${result.filePath}.\n`
       );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 3426c02..e8b5b82 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -1,7 +1,8 @@
 /**
  * `.taskcode/config.yml` — TASK-030, item C4 del checklist de
- * terminacion. Decision #9, resuelta el 2026-09-07: TRES claves, todas
- * opcionales, y ninguna mas.
+ * terminacion. Todas las claves son opcionales; las admitidas son las de
+ * CLAVES_CONFIG, y un test ata esa lista al switch de parsearConfigConAvisos
+ * (la decision #9, del 2026-09-07, empezo con tres).
  *
  * | clave                        | defecto           | quien la lee            |
  * |------------------------------|-------------------|-------------------------|
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts
index 36ffc7a..792074a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts
@@ -65,7 +65,7 @@ function plano(texto: string): string {
   return recortar(limpio, MAX_LARGO_TEXTO);
 }
 
-/** `fichero:linea` de las evidencias que lo traen, sin repetir y como mucho `MAX_DONDE`. */
+/** `fichero:linea` de las evidencias que lo traen, sin repetir. El tope `MAX_DONDE` lo aplica quien la usa (componerTarea). */
 function dondeFalla(p: ResultadoPunto): string[] {
   const vistos = new Set<string>();
   for (const e of p.evidencias) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/grupos-metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/grupos-metricas.ts
index 6baca34..bd77e20 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/grupos-metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/grupos-metricas.ts
@@ -26,7 +26,7 @@
  *    caen siempre en el mismo tercil (y los grupos pueden no ser iguales).
  */
 import { TASK_COMPLEXITIES, TASK_TYPES } from './task.js';
-import { media, tablaDeTexto, type FilaMetricas } from './metricas.js';
+import { celdaNumero, media, tablaDeTexto, type FilaMetricas } from './metricas.js';
 import { kbPorTarea } from './evolucion.js';
 
 export interface GrupoMetricas {
@@ -146,10 +146,6 @@ export function calcularGrupos(filas: readonly FilaMetricas[], proyectos: readon
   };
 }
 
-function celda(v: number | null, sufijo = ''): string {
-  return v === null ? '—' : `${String(v)}${sufijo}`;
-}
-
 function tablaGrupos(etiqueta: string, grupos: readonly GrupoMetricas[]): string {
   return tablaDeTexto(
     [etiqueta, 'tareas', 'con revision', 'a la primera', 'rondas medias', 'CRIT+IMP/tarea', 'sin revision', 'sin tabla'],
@@ -158,7 +154,7 @@ function tablaGrupos(etiqueta: string, grupos: readonly GrupoMetricas[]): string
       String(g.n),
       String(g.conRevision),
       g.pctAprobadaPrimera === null ? '—' : `${String(g.pctAprobadaPrimera)}% (${String(g.aprobadasPrimera)})`,
-      celda(g.rondasMedia),
+      celdaNumero(g.rondasMedia),
       g.critImpPorTarea === null ? '—' : `${String(g.critImpPorTarea)} (n=${String(g.conHallazgos)})`,
       String(g.sinRevision),
       String(g.sinTablaHallazgos),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
index 4cf9876..9d002b0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
@@ -5,83 +5,31 @@
  * de brainstorm pide ese nivel, y resolver el numero final para una
  * tarea concreta.
  *
- * Hasta hoy el YML no lo leia nadie desde `src/`: existia con sus
- * tests pero sin consumidor. Este modulo es ese consumidor.
+ * Doctrina (la misma que config.ts):
  *
- * MISMA DOCTRINA QUE src/core/config.ts, y por los mismos motivos:
+ * 1. FALLO CERRADO. Una clave desconocida, ausente, de tipo equivocado o un
+ *    numero negativo ABORTAN; no hay defaults en codigo. El fichero lo
+ *    distribuye el plugin: una clave que falta es un fichero roto o de otra
+ *    version, no «usa lo de siempre».
+ * 2. UN SOLO PARSER: parseBloqueClaveValor() de frontmatter.ts, con
+ *    comentarios de linea (el fichero empieza por uno).
+ * 3. UN SOLO PUNTO DE RESOLUCION: cargarHeuristica() devuelve la heuristica
+ *    ya validada; ningun comando lee el fichero por su cuenta.
  *
- * 1. FALLO CERRADO. Una clave desconocida, una clave obligatoria
- *    ausente, un valor del tipo equivocado o un numero negativo
- *    ABORTAN. Nunca hay caida al default en silencio. Aqui la regla
- *    aprieta MAS que en config.yml: alli las tres claves son
- *    opcionales porque un repo sin configuracion es normal; aqui NO
- *    hay defaults en codigo y las 19 claves son obligatorias, porque
- *    este fichero lo distribuye el propio plugin y una clave que falta
- *    no significa "usa lo de siempre", significa que el fichero esta
- *    roto o que alguien lo edito a medias.
- * 2. UN SOLO PARSER. El bucle `clave: valor` es el de frontmatter.ts,
- *    via parseBloqueClaveValor(). Aqui no hay ni una linea de parseo
- *    de YAML. Se le pasa `permitirComentariosDeLinea: true` porque el
- *    fichero empieza por un comentario: sin eso la lectura falla en su
- *    primera linea, y el propio YML lo avisa.
- * 3. UN SOLO PUNTO DE RESOLUCION. cargarHeuristica() devuelve la
- *    heuristica ya validada; ningun comando lee el fichero por su
- *    cuenta.
+ * La discrepancia entre el nivel heuristico y el declarado se resuelve sin
+ * consultar a nadie (aprobado por Carlos el 2026-09-08): resolverNumeroAgentes()
+ * se queda con el MAYOR de los dos numeros de agentes, la eleccion
+ * conservadora, y la discrepancia sale en `ResolucionAgentes.hayDiscrepancia`
+ * para quien orqueste. Consecuencia aceptada y fijada en un test: con
+ * `nivel_trivial_hasta: 0` basta una senal para salir de `trivial`, asi que el
+ * 0 roles de trivial es casi inalcanzable. La historia (las claves que quito
+ * TASK-052, las mediciones sobre las tareas del repo) esta en git y en las
+ * tareas, no aqui.
  *
- * ------------------------------------------------------------------
- * LA DISCREPANCIA SE RESUELVE SIN CONSULTAR A NADIE (aprobado por
- * Carlos, 2026-09-08).
- *
- * El YML llego a decir que, cuando el nivel heuristico y el declarado
- * por la persona distaran mas de una tolerancia, se consultara a un
- * modelo barato para desempatar. Este modulo nunca lo hizo, porque el
- * CLI no invoca modelos: `taskctl` hace lo determinista y deja escrito
- * lo que otro tiene que disparar (mismo reparto que `taskctl review`
- * establecio en TASK-013). Las tres claves de esa consulta
- * (`tolerancia_niveles`, `tolerancia_extra_si_heuristica_menor` y
- * `modelo_consulta_discrepancia`) se validaban sin que nada las leyera,
- * y TASK-052 las quito del fichero y de aqui.
- *
- * resolverNumeroAgentes() resuelve la discrepancia SIN
- * consultar a nadie: se queda con el MAYOR de los dos numeros de
- * agentes. Es la eleccion conservadora en la direccion que el propio
- * YML senala como la cara ("infraestimar deja la tarea con menos
- * revision de la que necesita"), y ademas nunca ignora lo que la
- * persona declaro: si declara mas de lo que la heuristica ve, manda lo
- * declarado. La discrepancia no se traga: sale en
- * `ResolucionAgentes.hayDiscrepancia` junto con los dos niveles y las
- * senales, para que quien orqueste pueda mostrarla o consultarla el.
- *
- * EFECTO MEDIDO DEL MAX, sobre las 32 tareas reales del repo el
- * 2026-09-08 (no es una estimacion: se ejecuto sobre ellas):
- *
- *   - Declarado y heuristico coinciden en 7 de 32.
- *   - CERO tareas disparan una sola palabra de alto riesgo. La senal
- *     mas cara del YML — la unica que mira el CONTENIDO del trabajo y
- *     no su forma — no se activa nunca, porque los objetivos estan
- *     escritos en vocabulario de metodologia y no de dominio tecnico.
- *     La puntuacion acaba gobernada por etiquetas, dependencias y
- *     numero de criterios, y por eso infraestima de forma sistematica.
- *   - NINGUNA tarea acaba con 0 roles. El reparto real es 14 tareas
- *     con 1 rol, 14 con 2 y 4 con 3.
- *
- * Ese ultimo punto merece leerse dos veces, porque es una consecuencia
- * que la decision no perseguia: el YML dice "0 en trivial (no se paga
- * un brainstorm para algo trivial)", y con el max ese 0 es
- * practicamente inalcanzable — basta que la tarea declare dos
- * dependencias, o cinco criterios de aceptacion, para que la
- * heuristica la suba a `simple` y el max le ponga un rol. La unica
- * tarea declarada `trivial` del repo (TASK-005) sale con 1.
- *
- * TASK-052 lo acentua a sabiendas: con `nivel_trivial_hasta: 0`
- * (calibrado con las rondas de revision de 43 tareas cerradas, ver el
- * YML) basta UNA senal para salir de `trivial`.
- *
- * No se corrige por cuenta propia porque el max lo aprobo Carlos con
- * el caso delante, y respetar el suelo del declarado seria reabrir esa
- * decision. Queda escrito aqui y fijado en un test para que sea una
- * eleccion consciente y no un descubrimiento dentro de seis meses.
- * ------------------------------------------------------------------
+ * E/S (TASK-148d, CORE2-21): core es puro salvo cargarHeuristica(), que lee el
+ * YML del plugin. Esta aqui porque es el unico punto de resolucion (regla 3) y
+ * todo lo demas del modulo (parsear, puntuar, resolver) es puro y se prueba sin
+ * disco con parsearHeuristica().
  */
 import { readFileSync } from 'node:fs';
 import { parseBloqueClaveValor } from './frontmatter.js';
@@ -98,27 +46,11 @@ export class HeuristicaError extends Error {
   }
 }
 
-export interface Heuristica {
-  peso_etiqueta_adicional: number;
-  peso_palabra_alto_riesgo: number;
-  peso_dependencia: number;
-  peso_tipo_release: number;
-  peso_tipo_hotfix_con_palabra_riesgo: number;
-  peso_criterios_aceptacion: number;
-  umbral_criterios_aceptacion: number;
-  nivel_trivial_hasta: number;
-  nivel_simple_hasta: number;
-  nivel_media_hasta: number;
-  nivel_alta_hasta: number;
-  nivel_critica_desde: number;
-  palabras_alto_riesgo: string[];
-  agentes_brainstorm_trivial: number;
-  agentes_brainstorm_simple: number;
-  agentes_brainstorm_media: number;
-  agentes_brainstorm_alta: number;
-  agentes_brainstorm_critica: number;
-  agentes_brainstorm_hotfix: number;
-}
+/**
+ * TASK-148d (CORE2-18): el tipo sale de CLAVES_NUMERICAS (antes cada clave se
+ * escribia tres veces: aqui, en la lista y al construir el objeto).
+ */
+export type Heuristica = Record<ClaveNumerica, number> & { palabras_alto_riesgo: string[] };
 
 /** Una senal encontrada al puntuar, para poder explicar el resultado. */
 export interface Senal {
@@ -166,6 +98,7 @@ const CLAVES_NUMERICAS = [
   'agentes_brainstorm_critica',
   'agentes_brainstorm_hotfix',
 ] as const;
+type ClaveNumerica = (typeof CLAVES_NUMERICAS)[number];
 
 const CLAVE_PALABRAS = 'palabras_alto_riesgo';
 
@@ -280,31 +213,11 @@ export function parsearHeuristica(contenido: string, ruta: string): Heuristica {
   }
 
   const h: Heuristica = {
-    peso_etiqueta_adicional: exigirNumero(numeros, 'peso_etiqueta_adicional', ruta),
-    peso_palabra_alto_riesgo: exigirNumero(numeros, 'peso_palabra_alto_riesgo', ruta),
-    peso_dependencia: exigirNumero(numeros, 'peso_dependencia', ruta),
-    peso_tipo_release: exigirNumero(numeros, 'peso_tipo_release', ruta),
-    peso_tipo_hotfix_con_palabra_riesgo: exigirNumero(
-      numeros,
-      'peso_tipo_hotfix_con_palabra_riesgo',
-      ruta
-    ),
-    peso_criterios_aceptacion: exigirNumero(numeros, 'peso_criterios_aceptacion', ruta),
-    umbral_criterios_aceptacion: exigirNumero(numeros, 'umbral_criterios_aceptacion', ruta),
-    nivel_trivial_hasta: exigirNumero(numeros, 'nivel_trivial_hasta', ruta),
-    nivel_simple_hasta: exigirNumero(numeros, 'nivel_simple_hasta', ruta),
-    nivel_media_hasta: exigirNumero(numeros, 'nivel_media_hasta', ruta),
-    nivel_alta_hasta: exigirNumero(numeros, 'nivel_alta_hasta', ruta),
-    nivel_critica_desde: exigirNumero(numeros, 'nivel_critica_desde', ruta),
+    ...(Object.fromEntries(CLAVES_NUMERICAS.map((c) => [c, exigirNumero(numeros, c, ruta)])) as Record<ClaveNumerica, number>),
     palabras_alto_riesgo: exigirLista(palabras, CLAVE_PALABRAS, ruta),
-    agentes_brainstorm_trivial: exigirNumero(numeros, 'agentes_brainstorm_trivial', ruta),
-    agentes_brainstorm_simple: exigirNumero(numeros, 'agentes_brainstorm_simple', ruta),
-    agentes_brainstorm_media: exigirNumero(numeros, 'agentes_brainstorm_media', ruta),
-    agentes_brainstorm_alta: exigirNumero(numeros, 'agentes_brainstorm_alta', ruta),
-    agentes_brainstorm_critica: exigirNumero(numeros, 'agentes_brainstorm_critica', ruta),
-    agentes_brainstorm_hotfix: exigirNumero(numeros, 'agentes_brainstorm_hotfix', ruta),
   };
 
+
   validarEscalaDeNiveles(h, ruta);
   return h;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index b9eba3b..0ad1423 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -728,16 +728,17 @@ export function totalTokens(t: TokensFila): number | null {
   return datos.length === 0 ? null : datos.reduce((a, b) => a + b, 0);
 }
 
-function celdaTokens(v: number | null): string {
-  return v === null ? '—' : String(v);
+/** TASK-148d (CORE2-20): una cifra de tabla, o «—» sin dato (nunca 0); con `sufijo` tras la cifra. */
+export function celdaNumero(v: number | null, sufijo = ''): string {
+  return v === null ? '—' : `${String(v)}${sufijo}`;
 }
 
 /** Las que anade `--tokens` a la tabla: «curso» es la implementacion, como en las duraciones. */
 export const COLUMNAS_TOKENS: readonly ColumnaMetricas[] = [
-  { cabecera: 'tok_diseno', valor: (f) => celdaTokens(f.tokens.diseno) },
-  { cabecera: 'tok_curso', valor: (f) => celdaTokens(f.tokens.implementacion) },
-  { cabecera: 'tok_revision', valor: (f) => celdaTokens(f.tokens.revision) },
-  { cabecera: 'tok_total', valor: (f) => celdaTokens(totalTokens(f.tokens)) },
+  { cabecera: 'tok_diseno', valor: (f) => celdaNumero(f.tokens.diseno) },
+  { cabecera: 'tok_curso', valor: (f) => celdaNumero(f.tokens.implementacion) },
+  { cabecera: 'tok_revision', valor: (f) => celdaNumero(f.tokens.revision) },
+  { cabecera: 'tok_total', valor: (f) => celdaNumero(totalTokens(f.tokens)) },
 ];
 
 /** Columnas del bloque de docs/METRICAS.md: solo lo que no depende de git log ni del reloj. */
@@ -958,8 +959,8 @@ function celdaSinDesglose(f: FilaMetricas): string {
 
 /** Las que anade `--tokens` a la tabla por pantalla (no al bloque de docs/METRICAS.md). */
 export const COLUMNAS_DESGLOSE_TOKENS: readonly ColumnaMetricas[] = [
-  { cabecera: 'tok_nuevos', valor: (f) => celdaTokens(sumaDesglose(f, 'nuevos')) },
-  { cabecera: 'tok_cache_lect', valor: (f) => celdaTokens(sumaDesglose(f, 'cacheLectura')) },
+  { cabecera: 'tok_nuevos', valor: (f) => celdaNumero(sumaDesglose(f, 'nuevos')) },
+  { cabecera: 'tok_cache_lect', valor: (f) => celdaNumero(sumaDesglose(f, 'cacheLectura')) },
   { cabecera: 'tok_sin_desglose', valor: celdaSinDesglose },
 ];
 
@@ -1132,10 +1133,6 @@ export function lineaSinCoste(r: ResumenSinCoste, varios = false): string {
 
 // --- Lecturas por revisor y ronda (TASK-081) ---------------------------------
 
-function celdaOAusente(n: number | null): string {
-  return n === null ? '—' : String(n);
-}
-
 export const NOTA_LECTURAS_REVISION =
   'Lecturas de revision por tarea, ronda y revisor (de "## Coste", fase revision, una fila por agente): ' +
   'lecturas = LLAMADAS de lectura del revisor, no bytes ni causa de los tokens (no ve "cd x && cat y"); ' +
@@ -1151,11 +1148,11 @@ export function formatearLecturasRevision(filas: readonly FilaMetricas[], varios
       etiquetaTarea(f, varios),
       g.ronda === null ? '—' : String(g.ronda),
       g.revisor === null ? '—' : g.revisor === '' ? '(sin fragmentar)' : g.revisor,
-      celdaOAusente(g.lecturas),
-      celdaOAusente(g.entrada),
-      celdaOAusente(g.cacheLectura),
-      celdaOAusente(g.critico),
-      celdaOAusente(g.importante),
+      celdaNumero(g.lecturas),
+      celdaNumero(g.entrada),
+      celdaNumero(g.cacheLectura),
+      celdaNumero(g.critico),
+      celdaNumero(g.importante),
     ])
   );
   if (celdas.length === 0) return [];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
index 30fc873..8bdd03d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
@@ -48,6 +48,10 @@
  * un cuarto estado para "instalado pero deshabilitado" exigiria ademas
  * un aviso distinto en plan.ts ("/plugin enable" en vez de
  * "/plugin install") que nadie ha pedido todavia.
+ *
+ * E/S en core (TASK-148d, CORE2-21): es la excepcion declarada a core puro; el
+ * subproceso esta aislado aqui para que el resto de la seleccion de skill siga
+ * siendo pura.
  */
 import { spawnSync } from 'node:child_process';
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
index aae3b1a..f0995b0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
@@ -26,6 +26,10 @@
  * Mismo criterio fail-closed que catalogo-skills.ts: un bloque yaml mal
  * formado en una skill que SI declara `rol: revisor` aborta taskctl
  * entero, no degrada en silencio al generico.
+ *
+ * E/S en core (TASK-148d, CORE2-21): cargarCatalogoRevisores es la excepcion
+ * declarada a core puro (lee skills/ sin cache, por el motivo de arriba);
+ * clasificarPorDominio sigue siendo pura.
  */
 import { readFileSync, readdirSync } from 'node:fs';
 import path from 'node:path';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
index 106d1b3..8dd2aaf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
@@ -7,7 +7,7 @@
  * que no vive en el frontmatter (p. ej. si ya existe un plan-final.md
  * o si la revision primaria esta aprobada).
  */
-import type { Task, TaskComplexity } from './task.js';
+import type { Task } from './task.js';
 
 export type TaskCommand =
   | 'import'
@@ -49,36 +49,6 @@ export class StateMachineError extends Error {
   }
 }
 
-/**
- * Complejidades EXIMIDAS del checkpoint humano antes de "start".
- *
- * Esta vacia desde TASK-016 (item D1), y esa es la decision, no un
- * descuido: el punto 1 de la seccion 14 se cerro como "checkpoint
- * humano SIEMPRE obligatorio", y hasta entonces el codigo eximia a
- * `trivial` y `simple` — o sea que la decision estaba tomada y no
- * aplicada. Confirmado con Carlos el 2026-09-08.
- *
- * Lo que sostiene la decision, con datos: de las 4 tareas `simple`
- * cerradas, UNA ESCONDIA UN CRITICO. Abaratar el checkpoint
- * precisamente en el nivel donde ya se coló el peor bug del proyecto
- * no ahorraba nada que compensara.
- *
- * Aviso sobre un dato que circula y es FALSO: no es cierto que "no
- * exista ninguna tarea trivial". Contadas una a una, hay 1 `trivial`,
- * 15 `simple`, 13 `media` y 3 `alta`. Lo cierto es que ninguna tarea
- * `trivial` se ha CERRADO todavia, que es otra cosa. La version
- * absoluta aparece en la documentacion de cierre del proyecto y se usó
- * como argumento; se corrige alli tambien. No cambia esta decision —
- * la sostiene el CRITICO de arriba, no el recuento — pero un argumento
- * falso no se hereda aunque lleve a la conclusion correcta.
- *
- * Se vacia en vez de borrarse a proposito: sigue siendo el punto unico
- * donde se declara quien se exime, asi que reabrir la decision cuesta
- * una linea en vez de una arqueologia. Mismo criterio que
- * CONFIG_DEFAULTS.
- */
-const TRIVIAL_SIN_APROBACION: readonly TaskComplexity[] = [];
-
 function err(
   taskId: string,
   command: TaskCommand,
@@ -201,9 +171,10 @@ export function assertTransitionAllowed(
           `esta en estado "${task.estado}", no en "en-diseno". taskctl start requiere haber ejecutado taskctl plan primero.`
         );
       }
-      const exigeAprobacion =
-        task.complejidad === null || !TRIVIAL_SIN_APROBACION.includes(task.complejidad);
-      if (exigeAprobacion && !task.plan_aprobado) {
+      // El checkpoint humano antes de start es siempre obligatorio, para toda
+      // complejidad (TASK-016, decision confirmada por Carlos el 2026-09-08: de
+      // las 4 tareas simple cerradas entonces, una escondia un CRITICO).
+      if (!task.plan_aprobado) {
         throw err(
           task.id,
           command,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
index a4670f9..c437dc5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
@@ -22,7 +22,7 @@
  *  - Tokens por fase: suma y media de las tareas con dato en esa fase
  *    (`conDato`); null = sin registrar, no cero.
  */
-import { media, tablaDeTexto, type FilaMetricas } from './metricas.js';
+import { celdaNumero, media, tablaDeTexto, type FilaMetricas } from './metricas.js';
 import { resumirGrupo } from './grupos-metricas.js';
 import type { ConteoOrigen, ConteoSeveridad } from './informe-revision.js';
 import { compararVersiones } from './version.js';
@@ -132,10 +132,6 @@ export function calcularPorVersion(filas: readonly FilaMetricas[]): PorVersion {
   };
 }
 
-function celda(v: number | null): string {
-  return v === null ? '—' : String(v);
-}
-
 function celdaTokens(c: CifraTokens): string {
   return c.media === null ? '—' : `${String(c.media)} (n=${String(c.conDato)})`;
 }
@@ -172,11 +168,11 @@ export function formatearPorVersion(p: PorVersion): string {
       String(g.n),
       String(g.conRevision),
       g.pctAprobadaPrimera === null ? '—' : `${String(g.pctAprobadaPrimera)}% (${String(g.aprobadasPrimera)})`,
-      celda(g.rondasMedia),
+      celdaNumero(g.rondasMedia),
       celdaTokens(g.tokens.diseno),
       celdaTokens(g.tokens.implementacion),
       celdaTokens(g.tokens.revision),
-      celda(g.tests),
+      celdaNumero(g.tests),
       g.completaS === null ? '—' : `${String(Math.round(g.completaS))} s`,
     ])
   );
````

## Excluido del diff (19 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-148d/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148d/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148d/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148d/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148d/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148d/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148d/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148d/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-148d/tarea.md                                                       |  10 ++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                  |   5 ----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                          |   5 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-tareas.js                            |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/grupos-metricas.js                                 |   7 ++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heuristica.js                                      | 115 +++++++++++++++++-----------------------------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                        |  30 ++++++++++------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plugin-instalado.js                                |   4 +++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/revisores.js                                       |   4 +++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js                                   |  35 +++----------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/versiones-metricas.js                              |   9 +++----
 19 files changed, 66 insertions(+), 160 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-registro.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-registro.test.ts | 8 +++++++-
 1 file changed, 7 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 129.6 s
- Commit verificado: 53cc8a657c1736d46447f1c3b8404e863a29de8e
- Huella: ae0e3edf3e57c7790712216dcd084a3af6abea28
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 87597 bytes en total):

````
✔ ubicacion: se busca en la RAIZ del repo (tambien desde un subdirectorio) y un .taskcode que es un FICHERO aborta (1910.2237ms)
✔ ubicacion: la busqueda PARA en la raiz del repo (un config de mas arriba no manda) (320.9242ms)
✔ parsearConfig: modo_flujo acepta los tres valores, invalido aborta (lista los validos y sugiere el parecido) y repetido aborta (1.406ms)
✔ comprobarSkillInstalado nunca lanza y siempre devuelve un estado valido (11661.3155ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (27.7458ms)
✔ 1. las cuatro skills revisoras existen con su nombre exacto (10.6231ms)
✔ 2. el frontmatter parsea y declara name y description (el validador NO comprueba esto) (79.5034ms)
✔ 3. el frontmatter solo lleva las claves del spec portable (26.139ms)
✔ 4. patrones_archivo es legible por el UNICO parser que hay en el repo (63.0194ms)
✔ 5. los revisores de dominio traen patrones; el generico declara que no los tiene (61.247ms)
✔ 6. ningun revisor de dominio se solapa con otro en un patron identico (52.293ms)
✔ 6b. la tabla de enrutado no esta vacia ni cojea (guard de no-vacuidad) (13.3288ms)
✔ 6c. POSITIVA: cada ruta que tiene que casar llega al revisor que le toca (297.2697ms)
✔ 6d. NEGATIVA: ninguna ruta ajena llega a un revisor de dominio (280.1482ms)
✔ 7. la linea de veredicto que cada skill prescribe la ACEPTA finish.ts (69.6619ms)
✔ 8. cada skill prescribe tambien la forma de NO aprobar, y finish.ts la rechaza (233.592ms)
✔ 9. las tres severidades estan DEFINIDAS (no solo mencionadas) en las cuatro (30.1517ms)
✔ 9b. la definicion de severidad NO la satisface una mencion en prosa (0.7393ms)
✔ 10. las cuatro exigen reproducir en una SECCION con procedimiento, no de pasada (95.64ms)
✔ 10 bis. la seccion de reproduccion NO la satisface la etiqueta del esqueleto (0.9166ms)
✔ 10b. el esqueleto derivado del CLI trae lo que este test da por supuesto (0.5743ms)
✔ 10c. las cuatro prescriben el esqueleto que taskctl review genera de verdad (42.0031ms)
✔ 10d. cada revisora enlaza la referencia comun, y la referencia existe (58.5108ms)
✔ 10e. lo comun a las revisoras y la tabla del veredicto viven solo en revision.md (370.904ms)
✔ 10f. cada fila de la tabla del veredicto de revision.md dice lo que hace finish.ts (35.584ms)
✔ 10g. la lectura de la tabla discrimina (contraprueba del 10f) (3.9512ms)
✔ 11. ninguna skill arrastra marcas de este repo ni rutas de maquina (111.4891ms)
✔ 11b. la marca generica de documento interno discrimina (contraprueba del menor 4) (0.4773ms)
✔ 12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro (27745.7687ms)
✔ 13. el plugin entero, con las cuatro skills dentro, sigue validando (11441.2566ms)
✔ 14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2 (3.0148ms)
ℹ tests 837
ℹ suites 0
ℹ pass 836
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 115280.1966
[verificar-impacto] node --test termino con 0 en 115.4 s.
````
