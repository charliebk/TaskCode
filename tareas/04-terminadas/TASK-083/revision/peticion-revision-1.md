# Peticion de revision — TASK-083 (ronda 1)

- Tarea: TASK-083 — Cierre sin ronda 2 completa cuando solo quedan MENORES
- Rama revisada: feature/task-083-cierre-sin-ronda-2-completa-cuando-solo
- Rama base: develop
- Commit revisado (HEAD): c3d2852c1bf0f5f9b3efbad2064dcb5ff6e757ec
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-083 (criterios de aceptacion y plan)

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
c3d2852 docs(TASK-083): constancia de autorrevision
5097269 fix(TASK-083): autorrevision, motivo de alcance acotado a cinco ficheros
41b292a feat(TASK-083): verificacion acotada de la ronda siguiente cuando la anterior solo dejo MENORES
9397adc docs(TASK-083): medida de rondas 2 con solo MENORES en METRICAS.md
3b8e15d chore(TASK-083): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/METRICAS.md b/docs/METRICAS.md
index 9c30664..e826a93 100644
--- a/docs/METRICAS.md
+++ b/docs/METRICAS.md
@@ -606,6 +606,73 @@ aunque Claude Code purgue las transcripciones).
 - Un agente lanzado sin la ruta de su petición en el prompt sale «sin
   atribuir», y sus lecturas no se reparten entre revisores.
 
+## 13. Rondas 2 que solo verificaban MENORES (TASK-083)
+
+**Pregunta.** ¿Cuántas segundas rondas de revisión partían de una ronda 1 que
+no dejó ningún CRÍTICO ni IMPORTANTE? Y la contrapartida: de esas, ¿cuántas
+encontraron en la ronda 2 un CRÍTICO o IMPORTANTE nuevo? Si la primera cifra es
+alta y la segunda baja, una revisión completa en la ronda 2 es gasto.
+
+**Método.** Script de un solo uso (fuera del repo) sobre el parser de la tabla
+de hallazgos, `leerHallazgos`, y `veredictoDeRonda` del propio CLI, contra
+`tareas/04-terminadas/*/revision/informe-revision-<N>[-<skill>].md` de los dos
+repos, a 2026-11-07. La ronda 1 se juzga **entera** (todos sus fragmentos de
+dominio a la vez) y con la regla estricta del plan: un CRÍTICO o IMPORTANTE
+**en cualquier estado** (abierto, corregido, aceptado...) la descalifica, y
+una ronda 1 sin tabla o con una severidad fuera del vocabulario cuenta como
+«sin dato», nunca como «solo MENORES». Como la ronda 1 elegible no tiene
+ningún CRÍTICO ni IMPORTANTE, todo CRÍTICO o IMPORTANTE de su ronda 2 es nuevo.
+
+| | ToolsaWeb | TaskCode | Total |
+|---|---|---|---|
+| Tareas terminadas con revisión | 122 | 69 | 191 |
+| Cerradas en la ronda 1 | 11 | 30 | 41 |
+| Con ronda 2 | 111 | 39 | 150 |
+| Ronda 1 sin dato (sin tabla: anteriores a TASK-036) | 0 | 12 | 12 |
+| Con ronda 2 y ronda 1 legible | 111 | 27 | 138 |
+| **Ronda 1 sin CRÍTICO ni IMPORTANTE** | **25 (22,5 %)** | **8 (29,6 %)** | **33 (23,9 %)** |
+| **De esas, ronda 2 con un CRÍTICO o IMPORTANTE nuevo** | **0** | **0** | **0 (0 %)** |
+
+- ToolsaWeb: TASK-003, 008, 014, 017, 019, 070, 071, 076, 083, 085, 086, 094,
+  096, 098, 102, 124, 136, 147, 155, 173, 177, 179, 180, 181 y 187.
+- TaskCode: TASK-067, 072, 075, 076, 077, 078, 079 y 081.
+
+**La misma cuenta por fragmento de dominio** (solo ToolsaWeb fragmenta: 58
+pares de informes `-<skill>` con ronda 1 y ronda 2 del mismo revisor). En 19
+la ronda 1 de ese revisor solo tenía MENORES, y en 2 su ronda 2 trae un
+IMPORTANTE:
+
+- **TASK-013 / code-quality-reviewer, IMP-R2-1**: nuevo de verdad. Lo metió
+  la corrección de un MENOR y se encontró reproduciendo y mutando. Pero el
+  otro fragmento de esa ronda 1 (angular-vue) tenía IMP-1, así que **la ronda
+  entera no era elegible**.
+- **TASK-146 / code-quality-reviewer, «IMP-1 (r1, Vue)»**: no es nuevo. Es el
+  IMPORTANTE del fragmento de Vue de la ronda 1, arrastrado. Esa ronda tampoco
+  era elegible.
+
+Es decir: decidir **por ronda entera** deja fuera los dos casos, y decidir por
+fragmento habría dejado pasar TASK-013. Por eso la regla de TASK-083 mira
+todos los informes de la ronda a la vez.
+
+**Decisión.** El umbral que fijó la persona en el plan (al menos un 20 % de
+rondas 2 elegibles y como mucho un 10 % de ellas con un CRÍTICO o IMPORTANTE
+nuevo) se cumple: 23,9 % y 0 %. Se implementa la verificación acotada de la
+ronda siguiente.
+
+**Qué no dice.**
+
+- No mide los tokens que se ahorran: el coste registrado es por fase, no por
+  ronda, y la mayoría de esas tareas son anteriores al registro por ronda de
+  TASK-081. El efecto se verá con `taskctl metricas --tokens` en las tareas que
+  se cierren con la 0.12.
+- 0 de 33 no prueba que el riesgo sea cero: con esa muestra, el intervalo de
+  confianza del 95 % llega hasta el 10 % aproximadamente. Por eso la ronda
+  acotada sigue ejecutando los tests y buscando fallos nuevos en el delta, y
+  pasa a completa si el delta toca ficheros que ningún hallazgo nombraba.
+- Que una ronda 2 completa no encontrase nada nuevo no garantiza que una
+  acotada tampoco lo hubiera encontrado. Mide lo que pasó con la revisión
+  completa, no lo que pasará con la acotada.
+
 <!-- taskctl metricas --tokens: inicio -->
 ## Coste en tokens por tarea (generado)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index cb55ef0..f1ba2f2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -67,6 +67,23 @@ En una ronda de verificación (la 2 o posterior), la petición añade la línea
 
 En cualquier otro caso, el revisor usa el modelo de la tarea.
 
+Además, la ronda de verificación puede ser **acotada**. La petición lo dice
+en la línea `- Alcance:`, con su motivo, y lo dice también la salida de
+`taskctl review`. Una ronda acotada tiene un solo revisor (el genérico), no
+se fragmenta por dominio y lleva instrucciones de verificación: comprobar
+cada hallazgo, ejecutar la suite y buscar el fallo que abre la corrección.
+Solo es acotada si se cumple todo esto:
+- la ronda anterior pidió cambios y en todos sus informes solo hay MENOR;
+- el diff sale del commit revisado en la ronda anterior;
+- el diff no trae merges;
+- el diff solo toca ficheros que nombra algún hallazgo en su columna
+  `Fichero`.
+
+Un CRÍTICO o IMPORTANTE en cualquier estado obliga a la ronda completa, y la
+ronda completa que sigue a una acotada revisa desde la rama base.
+`taskctl review TASK-NNN --completa` la fuerza. `taskctl veredicto` avisa,
+sin bloquear, si se piden cambios con una tabla que solo tiene MENORES.
+
 ## Roles del brainstorm de diseño
 
 `taskctl plan` lanza roles de `agents/` según la complejidad, por este orden de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 9762fa1..da556e1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -49,6 +49,9 @@ punto, no un formalismo.
    su `## Contexto permitido`. Si la peticion trae la linea
    `- Modelo sugerido para esta ronda: <modelo> (...)`, lanza el revisor con
    ESE modelo; si no, con el `modelo sugerido` de la linea `Agente a lanzar`.
+   Si la peticion dice `- Alcance: verificacion acotada ...`, el revisor
+   sigue SUS instrucciones (verificar cada hallazgo, ejecutar la suite y
+   buscar el fallo que abre la correccion), no las de una revision completa.
    Que reproduzca empiricamente (clon
    temporal, suite una vez, mutantes) y devuelva su informe con la tabla de
    hallazgos, con la columna `Origen` rellena en cada fila
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index 502cfcb..907151c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -85,6 +85,22 @@ y comprueba **cada uno de esos hallazgos**: las correcciones son justo donde
 se cuelan los fallos nuevos. El revisor corre la suite completa una vez por
 ronda; los mutantes, con el fichero de test concreto.
 
+**Verificacion acotada.** Si la ronda anterior pidio cambios y en **todos**
+sus informes solo hay MENOR, `taskctl review` genera la ronda siguiente como
+verificacion acotada: un solo revisor (el generico), sin fragmentar por
+dominio, con la linea `- Alcance: verificacion acotada al diff de las
+correcciones` y sus propias instrucciones. Se verifica cada hallazgo, se
+ejecuta la suite y se busca el fallo que abre la correccion; no se vuelve a
+revisar la rama entera. Es **siempre completa** (`- Alcance: completa`, con
+su motivo) si: hay un CRITICO o IMPORTANTE en la ronda anterior **en
+cualquier estado**, tambien `corregido` o `aceptado`; algun informe no tiene
+tabla legible, sigue siendo la plantilla o trae una severidad fuera del
+vocabulario; no hay diff de correcciones (el commit anterior ya no existe);
+el delta trae un merge; o el delta toca un fichero que no nombraba ningun
+hallazgo (columna `Fichero`). Tras una acotada, una ronda completa revisa
+desde la rama base. `taskctl review TASK-NNN --completa` la fuerza de
+antemano.
+
 ## El informe
 
 `taskctl review` deja el esqueleto del informe en la carpeta de revision de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index d0353b9..91a6089 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -80,7 +80,7 @@ Uso:
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--decidido-por persona|automatico] [--push]
-  taskctl review TASK-NNN [--push]
+  taskctl review TASK-NNN [--completa] [--push]
   taskctl codex-review TASK-NNN [--push]
   taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
                     [--informe <nombre>] [--push]
@@ -705,6 +705,13 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
             `${result.desde} (sin update de "${result.baseBranch}": lo integra finish).\n`
           : `Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
             `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n`) +
+          // TASK-083: el alcance solo se dice en las rondas N+1, donde puede variar.
+          (result.incremental
+            ? result.alcance === 'acotada'
+              ? `Alcance: verificacion acotada al diff de las correcciones (${result.motivoAlcance}). ` +
+                `Una revision completa se pide de antemano con: taskctl review ${result.id} --completa.\n`
+              : `Alcance: revision completa (${result.motivoAlcance}).\n`
+            : '') +
           lineasInformes
       );
       printAutoCommit(result.autoCommit);
@@ -895,6 +902,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     const tareasRoot = path.join(repoCwd, 'tareas');
     try {
       const result = await runVeredictoCommand(tareasRoot, argv.slice(1), { repoCwd });
+      printAvisos(...result.avisos);
       process.stdout.write(
         `Tarea ${result.id}: "${result.linea}" escrito en ${result.informePath} (ronda ${result.ronda}).
 `
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 9db49f0..9ea55b6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -36,11 +36,12 @@ import { registrarTransicion } from '../core/transiciones.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
 import {
+  alcanceRondaSiguiente,
   commitRevisadoDe,
+  ficheroNombrado,
   hallazgosNoCerrados,
-  leerHallazgos,
-  veredictoDe,
   veredictoDeRonda,
+  type AlcanceRonda,
   type VeredictoInforme,
 } from '../core/informe-revision.js';
 import { fenceFor } from '../core/markdown.js';
@@ -55,6 +56,7 @@ import {
   logOneline,
   diffParaRevision,
   diffRangeForPaths,
+  hayMergesEntre,
 } from '../fs/git.js';
 import {
   autoCommit,
@@ -71,8 +73,12 @@ import { modeloDeVerificacion } from '../core/modelo-revision.js';
 
 export class ReviewCommandError extends Error {}
 
-/** Flags de `taskctl review`: solo extraerPushFlag. */
-export const FLAGS_REVIEW: readonly string[] = ['--push', '-p'];
+/** Flags de `taskctl review`: los de extraerPushFlag y `--completa` (TASK-083). */
+export const FLAGS_REVIEW: readonly string[] = ['--push', '-p', '--completa'];
+
+/** TASK-083: la cabecera que marca una peticion de verificacion acotada (la lee la ronda siguiente). */
+const ALCANCE_ACOTADA = 'verificacion acotada al diff de las correcciones';
+const ALCANCE_ACOTADA_RE = /^- Alcance: verificacion acotada\b/im;
 
 const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
   feature: 'update-feature.sh',
@@ -148,6 +154,14 @@ export interface ReviewCommandResult {
    * (ver `modeloBaratoPermitido`). Ausente: se mantiene `modelo`.
    */
   modeloRonda?: string;
+  /**
+   * TASK-083: `acotada` si esta ronda es una verificacion acotada al diff de
+   * las correcciones (un solo revisor, el generico, con instrucciones de
+   * verificacion); `completa` en cualquier otro caso. Va escrito, con su
+   * motivo, en la linea `- Alcance:` de la peticion.
+   */
+  alcance: 'completa' | 'acotada';
+  motivoAlcance: string;
   /**
    * Un elemento por revisor que interviene en esta ronda (TASK-018): uno
    * solo, con el generico, si el diff no se fragmento por dominio; uno
@@ -220,18 +234,11 @@ export function peticionTemplate(
     (extras.desde === undefined
       ? ''
       : `- Revision incremental: solo los cambios desde ${extras.desde} (el commit revisado en la ronda anterior)\n`) +
+    (extras.alcance === undefined
+      ? ''
+      : `- Alcance: ${extras.alcance.acotada ? ALCANCE_ACOTADA : 'completa'} (motivo: ${extras.alcance.motivo})\n`) +
     '\n' +
-    '## Instrucciones para el agente revisor\n\n' +
-    'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
-    'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
-    'directorio temporal, corre la suite tu mismo y construye el caso que\n' +
-    'rompe el codigo antes de reportarlo. Clasifica cada hallazgo como\n' +
-    'CRITICO (perdida de datos, corrupcion de estado, el comando hace lo\n' +
-    'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
-    'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
-    'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
-    `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
-    'peticion.\n\n' +
+    (extras.alcance?.acotada === true ? instruccionesAcotadas(nombreInforme) : instruccionesCompletas(nombreInforme)) +
     seccionContextoPermitido(extras.contextoPermitido) +
     (extras.seccionPrevia ?? '') +
     `## Commits a revisar (git log ${desde}..HEAD)\n\n` +
@@ -247,6 +254,51 @@ export function peticionTemplate(
   );
 }
 
+const CLASIFICACION =
+  'Clasifica cada hallazgo como\n' +
+  'CRITICO (perdida de datos, corrupcion de estado, el comando hace lo\n' +
+  'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
+  'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
+  'explicito tambien vale; inventar hallazgos, no.';
+
+function instruccionesCompletas(nombreInforme: string): string {
+  return (
+    '## Instrucciones para el agente revisor\n\n' +
+    'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
+    'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
+    'directorio temporal, corre la suite tu mismo y construye el caso que\n' +
+    `rompe el codigo antes de reportarlo. ${CLASIFICACION} Vuelca tu salida en el\n` +
+    `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
+    'peticion.\n\n'
+  );
+}
+
+/**
+ * TASK-083: la ronda anterior solo dejo MENORES y el delta solo toca sus
+ * ficheros. No basta con tachar la lista: la correccion de un MENOR puede meter
+ * un IMPORTANTE nuevo (se vio en un proyecto real, y se encontro ejecutando),
+ * asi que se siguen exigiendo los tests y la busqueda de fallos en el delta.
+ */
+function instruccionesAcotadas(nombreInforme: string): string {
+  return (
+    '## Instrucciones para el agente revisor (verificacion acotada)\n\n' +
+    'Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una\n' +
+    'revision completa y la ronda anterior solo dejo hallazgos MENORES: esta ronda\n' +
+    'verifica sus correcciones, no vuelve a revisar la rama entera. Haz esto, y\n' +
+    'nada mas:\n\n' +
+    '1. Comprueba, uno por uno, que cada hallazgo de la tabla de abajo queda resuelto\n' +
+    '   por el diff de esta ronda, o que se justifica por que no.\n' +
+    '2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit\n' +
+    '   revisado y di el resultado: verificar sin ejecutar no vale.\n' +
+    '3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo\n' +
+    '   donde se cuelan los IMPORTANTES nuevos. Si encuentras uno, construye el caso\n' +
+    '   que lo rompe antes de reportarlo.\n\n' +
+    `${CLASIFICACION} Un CRITICO o IMPORTANTE nuevo obliga a que la ronda\n` +
+    'siguiente sea completa (lo decide taskctl). Vuelca tu salida en el informe de\n' +
+    `esta ronda (${nombreInforme}), sin borrar la peticion.\n\n`
+  );
+}
+
 /** Datos de la peticion que anadio TASK-034; opcionales para no romper la firma. */
 export interface ExtrasPeticion {
   /** Carpeta de la tarea YA en su estado destino, relativa a la raiz del repo. */
@@ -267,6 +319,8 @@ export interface ExtrasPeticion {
   contextoPermitido?: readonly string[];
   /** TASK-081: modelo mas barato sugerido para esta ronda de verificacion. */
   modeloRonda?: string;
+  /** TASK-083: alcance de la ronda y su motivo; sin el, ni linea `- Alcance:` ni instrucciones acotadas. */
+  alcance?: { acotada: boolean; motivo: string };
 }
 
 /** TASK-081: la lista orienta, no prohibe; lo de fuera se justifica en el informe. */
@@ -290,32 +344,14 @@ interface RondaPrevia {
   commit: string | null;
   /** Seccion de la peticion con los hallazgos que siguen abiertos. */
   seccion: string;
-  /** TASK-081: la ronda cumple la regla estricta para verificar con un modelo mas barato. */
-  modeloBaratoPermitido: boolean;
+  /** TASK-081 y TASK-083: lo que los informes de la ronda N permiten para la N+1. */
+  alcance: AlcanceRonda;
+  /** TASK-083: la ronda N fue una verificacion acotada (su peticion lo dice). */
+  fueAcotada: boolean;
 }
 
-/**
- * Regla ESTRICTA (decision de la persona, TASK-081) para que la ronda de
- * verificacion use un modelo mas barato. Se cumple solo si, en TODOS los
- * informes de la ronda anterior: la tabla de hallazgos se lee, no hay ningun
- * CRITICO en ningun estado (tampoco uno `corregido`), no hay severidades
- * fuera del vocabulario, y el informe no sigue siendo la plantilla (sin filas
- * reales de hallazgo y con la fila de ejemplo, o con el veredicto PENDIENTE).
- */
-export function modeloBaratoPermitido(informes: readonly string[]): boolean {
-  if (informes.length === 0) return false;
-  for (const texto of informes) {
-    const lectura = leerHallazgos(texto);
-    if (!lectura.tabla) return false;
-    if (lectura.hallazgos.some((h) => h.severidadReconocida === null || h.severidadReconocida === 'CRITICO')) {
-      return false;
-    }
-    const plantilla =
-      lectura.hallazgos.length === 0 && (/^\|\s*\(ej\./im.test(texto) || veredictoDe(texto) === 'pendiente');
-    if (plantilla) return false;
-  }
-  return true;
-}
+/** Vive en core/informe-revision.ts desde TASK-083; se reexporta para quien la importe de aqui. */
+export { modeloBaratoPermitido } from '../core/informe-revision.js';
 
 async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
   const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
@@ -324,9 +360,11 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
   );
   const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
   let commit: string | null = null;
+  let fueAcotada = false;
   for (const n of peticiones.nombres) {
-    commit = commitRevisadoDe(await readFile(path.join(revisionDir, n), 'utf8'));
-    if (commit !== null) break;
+    const texto = await readFile(path.join(revisionDir, n), 'utf8');
+    if (ALCANCE_ACOTADA_RE.test(texto)) fueAcotada = true;
+    commit ??= commitRevisadoDe(texto);
   }
 
   const filas: string[] = [];
@@ -362,7 +400,8 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
     veredicto: veredictoDeRonda(textos.map((t) => t.texto)),
     commit,
     seccion: seccion + '\n',
-    modeloBaratoPermitido: modeloBaratoPermitido(textos.map((t) => t.texto)),
+    alcance: alcanceRondaSiguiente(textos.map((t) => t.texto)),
+    fueAcotada,
   };
 }
 
@@ -442,7 +481,9 @@ export async function runReviewCommand(
 ): Promise<ReviewCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_REVIEW, 'review', (m) => new ReviewCommandError(m));
-  const { push, resto } = extraerPushFlag(argv);
+  const { push, resto: sinPush } = extraerPushFlag(argv);
+  const completaPedida = sinPush.includes('--completa');
+  const resto = sinPush.filter((a) => a !== '--completa');
   const id = resto[0];
   if (id === undefined || id.trim() === '') {
     throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
@@ -548,13 +589,44 @@ export async function runReviewCommand(
       );
     }
   }
-  const commits = logOneline(desde, 'HEAD', deps.repoCwd);
   // TASK-034: lo generado (dist/, lockfiles) y la propia carpeta de
   // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
   // TASK-073: los tests held-out nunca se embeben, se configure lo que se configure.
   const configRama = resolverConfig(deps.repoCwd);
   const excluir = excluirDeRevision(configRama.excluir_de_revision);
-  const paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
+  let paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
+
+  // TASK-083: alcance de la ronda. Acotada solo si los informes de la ronda
+  // anterior lo permiten (alcanceRondaSiguiente, fail-closed) Y ademas: no se
+  // pidio --completa, hay diff de correcciones (no se cayo a la base), el delta
+  // no trae merges (codigo ajeno sin revisar) y solo toca ficheros que algun
+  // hallazgo nombraba (decision de la persona). Antes de escribir nada: es
+  // funcion pura de lo commiteado, y un reintento da el mismo alcance.
+  let acotada = false;
+  let motivoAlcance = 'primera ronda de revision';
+  if (incremental && previa !== null) {
+    const fuera = paraRevision.incluidos.filter((f) => !ficheroNombrado(f, previa!.alcance.ficherosNombrados));
+    if (completaPedida) motivoAlcance = 'pedida con --completa';
+    else if (!previa.alcance.acotada) motivoAlcance = previa.alcance.motivo;
+    else if (desde === baseBranch) motivoAlcance = 'no hay diff de correcciones: el diff va desde la rama base';
+    else if (hayMergesEntre(desde, 'HEAD', deps.repoCwd)) motivoAlcance = `hay commits de merge entre ${desde} y HEAD`;
+    else if (fuera.length > 0) {
+      // Cinco bastan para el motivo: es una linea de cabecera, no la lista.
+      const resto = fuera.length > 5 ? ` (y ${fuera.length - 5} mas)` : '';
+      motivoAlcance = `el diff toca ficheros que ningun hallazgo nombraba: ${fuera.slice(0, 5).join(', ')}${resto}`;
+    } else {
+      acotada = true;
+      motivoAlcance = `${previa.alcance.motivo} y el diff solo toca sus ficheros`;
+    }
+    // Una ronda completa tras una acotada revisa desde la base: el delta de
+    // la acotada nunca tuvo revision completa (punto 3 del plan de TASK-083).
+    if (!acotada && previa.fueAcotada && desde !== baseBranch) {
+      motivoAlcance += `; la ronda ${previa.ronda} fue acotada, asi que el diff va desde "${baseBranch}"`;
+      desde = baseBranch;
+      paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
+    }
+  }
+  const commits = logOneline(desde, 'HEAD', deps.repoCwd);
   const diff = paraRevision.diff;
   // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
   // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
@@ -582,7 +654,11 @@ export async function runReviewCommand(
   // (correccion del rol de arquitectura, TASK-034).
   const ficherosTocados = paraRevision.incluidos;
   const catalogoRevisores = cargarCatalogoRevisores();
-  const plan = clasificarPorDominio(ficherosTocados, catalogoRevisores);
+  // TASK-083: la verificacion acotada no se fragmenta: un solo revisor, el
+  // generico, con todo el delta y los nombres de siempre (sin sufijo).
+  const plan = acotada
+    ? { fragmentado: false, grupos: [{ revisor: catalogoRevisores.generico.nombre, ficheros: ficherosTocados }] }
+    : clasificarPorDominio(ficherosTocados, catalogoRevisores);
   // TASK-074 (MEN-4 de la revision): en una peticion fragmentada, la seccion
   // de cobertura de cada dominio lleva SUS ficheros cambiados desde la merge
   // base, no solo los del delta de la ronda: una linea sin cubrir de la ronda
@@ -627,7 +703,7 @@ export async function runReviewCommand(
   // writeFile: si algo falla aqui no queda nada a medias en revision/.
   const carpetaTarea = `tareas/${STATE_FOLDER[updated.estado]}/${updated.id}`;
   const modeloRonda =
-    incremental && previa !== null && previa.modeloBaratoPermitido
+    incremental && previa !== null && previa.alcance.modeloBarato
       ? modeloDeVerificacion(updated.modelo_sugerido)
       : null;
   const escrituras = plan.grupos.map((grupo) => {
@@ -691,6 +767,7 @@ export async function runReviewCommand(
             // sale del estado destino, no de filePath.
             carpetaTarea,
             contextoPermitido: escritura.contexto,
+            alcance: { acotada, motivo: motivoAlcance },
             ...(modeloRonda === null ? {} : { modeloRonda }),
             excluidos: paraRevision.excluidos,
             stat: paraRevision.stat,
@@ -760,6 +837,8 @@ export async function runReviewCommand(
     agente: updated.agente_revisor,
     modelo: updated.modelo_sugerido,
     ...(modeloRonda === null ? {} : { modeloRonda }),
+    alcance: acotada ? 'acotada' : 'completa',
+    motivoAlcance,
     informes,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index 97d27c8..31762a8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -32,6 +32,7 @@ import {
   type AutoCommitResult,
 } from '../fs/git-commit.js';
 import { REVISION_DIRNAME } from './review.js';
+import { soloMenores } from '../core/informe-revision.js';
 
 export class VeredictoCommandError extends Error {}
 
@@ -57,6 +58,8 @@ export interface VeredictoCommandResult {
   ronda: number;
   informePath: string;
   linea: string;
+  /** TASK-083: avisos no fatales (p. ej. `cambios-solicitados` con solo MENORES). */
+  avisos: string[];
   autoCommit: AutoCommitResult;
 }
 
@@ -175,11 +178,22 @@ export async function runVeredictoCommand(
   }
   if (nuevo !== contenido) await writeFile(informePath, nuevo, 'utf8');
 
+  // TASK-083: aviso, sin bloquear ni cambiar el veredicto (el contrato de
+  // TASK-036 sigue igual): pedir cambios con solo MENORES abre otra ronda.
+  const avisos: string[] = [];
+  if (valor === 'cambios-solicitados' && soloMenores(nuevo)) {
+    avisos.push(
+      `${task.id}: ${nombre} pide cambios y su tabla solo tiene MENORES. Una ronda sin CRITICO ni ` +
+        'IMPORTANTE puede cerrar con "aprobada-con-correcciones"; si se piden cambios, la ronda ' +
+        'siguiente podra ser una verificacion acotada al diff de las correcciones.'
+    );
+  }
+
   const commitResult = autoCommit({
     cwd: deps.repoCwd,
     rutas: [informePath],
     mensaje: mensajeChore(task.id, `veredicto ronda ${ronda} (${valor})`),
     push,
   });
-  return { id: task.id, ronda, informePath, linea, autoCommit: commitResult };
+  return { id: task.id, ronda, informePath, linea, avisos, autoCommit: commitResult };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 9feafd5..74993be 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -265,6 +265,131 @@ export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
   return { tabla, abiertos };
 }
 
+// --- Alcance de la ronda siguiente (TASK-081, TASK-083) ----------------------
+
+/** El informe sigue siendo la plantilla: sin filas reales y con la fila de ejemplo, o con el veredicto PENDIENTE. */
+function esPlantilla(texto: string, lectura: LecturaTodosHallazgos): boolean {
+  return lectura.hallazgos.length === 0 && (/^\|\s*\(ej\./im.test(texto) || veredictoDe(texto) === 'pendiente');
+}
+
+/**
+ * Regla ESTRICTA (decision de la persona, TASK-081) para que la ronda de
+ * verificacion use un modelo mas barato. Se cumple solo si, en TODOS los
+ * informes de la ronda anterior: la tabla de hallazgos se lee, no hay ningun
+ * CRITICO en ningun estado (tampoco uno `corregido`), no hay severidades
+ * fuera del vocabulario, y el informe no sigue siendo la plantilla.
+ * Vive aqui desde TASK-083, junto a la regla del alcance; review.ts la reexporta.
+ */
+export function modeloBaratoPermitido(informes: readonly string[]): boolean {
+  if (informes.length === 0) return false;
+  for (const texto of informes) {
+    const lectura = leerHallazgos(texto);
+    if (!lectura.tabla) return false;
+    if (lectura.hallazgos.some((h) => h.severidadReconocida === null || h.severidadReconocida === 'CRITICO')) {
+      return false;
+    }
+    if (esPlantilla(texto, lectura)) return false;
+  }
+  return true;
+}
+
+/** Lo que la ronda anterior permite para la siguiente, decidido solo con sus informes. */
+export interface AlcanceRonda {
+  /**
+   * TASK-083: la ronda siguiente PUEDE ser una verificacion acotada al diff de
+   * las correcciones. Es condicion necesaria, no suficiente: `review` la
+   * convierte en completa si no hay diff de correcciones, si hay un merge en
+   * el delta o si el delta toca ficheros que ningun hallazgo nombraba.
+   */
+  acotada: boolean;
+  /** TASK-081: la ronda siguiente puede usar un modelo mas barato. */
+  modeloBarato: boolean;
+  /** Por que `acotada` es lo que es, para la linea `- Alcance:` de la peticion. */
+  motivo: string;
+  /** Rutas de la columna `Fichero` de todos los hallazgos, sin `:linea`. */
+  ficherosNombrados: string[];
+}
+
+/**
+ * Rutas de una celda `Fichero`: `src/a.ts:12`, `` `b.vue:191` ``,
+ * `a.ts:1-3, b.ts:7` o `c.ts#L4`. Sin la linea, con `/` y sin `./` delante.
+ */
+export function rutasDeCeldaFichero(celda: string): string[] {
+  return celda
+    .split(/[\s,;]+/)
+    .map((t) =>
+      t
+        .replace(/^[*_`(]+|[*_`)]+$/g, '')
+        .replace(/#L\d+(?:-L?\d+)?$/i, '')
+        .replace(/:\d+(?:[-–:]\d+)*$/, '')
+        .replace(/\\/g, '/')
+        .replace(/^\.\//, '')
+    )
+    .filter((t) => t !== '' && !SOLO_GUION_RE.test(t));
+}
+
+/**
+ * true si `ruta` (relativa a la raiz del repo) es una de las nombradas: igual,
+ * o la nombrada es su final (`Armazon.vue` nombra `src/ui/Armazon.vue`), o la
+ * nombrada es un directorio que la contiene (`src/core/`).
+ */
+export function ficheroNombrado(ruta: string, nombrados: readonly string[]): boolean {
+  const r = ruta.replace(/\\/g, '/');
+  return nombrados.some((n) => r === n || r.endsWith(`/${n}`) || (n.endsWith('/') && r.startsWith(n)));
+}
+
+/**
+ * Alcance de la ronda N+1 a partir de los informes de la ronda N (todos sus
+ * fragmentos a la vez: decidir por fragmento deja pasar un IMPORTANTE de otro
+ * dominio). Fail-closed (TASK-083, decision de la persona): la ronda solo
+ * puede ser acotada si la ronda N pidio cambios, todos sus informes tienen
+ * tabla legible, ninguno es la plantilla, ninguna severidad cae fuera del
+ * vocabulario, hay al menos un hallazgo y TODOS son MENOR. Un CRITICO o
+ * IMPORTANTE en CUALQUIER estado (tambien `corregido` o `aceptado`) obliga a
+ * la ronda completa: un IMPORTANTE marcado como corregido es justo la
+ * correccion que mas falta hace verificar.
+ */
+export function alcanceRondaSiguiente(informes: readonly string[]): AlcanceRonda {
+  const modeloBarato = modeloBaratoPermitido(informes);
+  const completa = (motivo: string): AlcanceRonda => ({ acotada: false, modeloBarato, motivo, ficherosNombrados: [] });
+  if (informes.length === 0) return completa('la ronda anterior no tiene informes');
+  const veredicto = veredictoDeRonda(informes);
+  if (veredicto !== 'cambios-solicitados') return completa(`el veredicto de la ronda anterior es "${veredicto}"`);
+  const nombrados = new Set<string>();
+  let menores = 0;
+  for (const texto of informes) {
+    const lectura = leerHallazgos(texto);
+    if (!lectura.tabla) return completa('un informe de la ronda anterior no tiene tabla de hallazgos legible');
+    if (esPlantilla(texto, lectura)) return completa('un informe de la ronda anterior sigue siendo la plantilla');
+    for (const h of lectura.hallazgos) {
+      if (h.severidadReconocida === null) {
+        return completa(`la severidad "${h.severidad}" de ${h.id} no es CRITICO, IMPORTANTE ni MENOR`);
+      }
+      if (h.severidadReconocida !== 'MENOR') {
+        return completa(`la ronda anterior tiene un ${h.severidadReconocida} (${h.id}, ${h.estado || 'sin estado'})`);
+      }
+      menores++;
+      for (const r of rutasDeCeldaFichero(h.fichero)) nombrados.add(r);
+    }
+  }
+  if (menores === 0) return completa('la ronda anterior pidio cambios sin anotar ningun hallazgo');
+  return {
+    acotada: true,
+    modeloBarato,
+    motivo: `la ronda anterior solo dejo MENORES (${menores})`,
+    ficherosNombrados: [...nombrados],
+  };
+}
+
+/**
+ * TASK-083: true si el informe tiene tabla, al menos un hallazgo, y todos son
+ * MENOR. Es lo que `taskctl veredicto` avisa al registrar `cambios-solicitados`.
+ */
+export function soloMenores(informe: string): boolean {
+  const lectura = leerHallazgos(informe);
+  return lectura.tabla && lectura.hallazgos.length > 0 && lectura.hallazgos.every((h) => h.severidadReconocida === 'MENOR');
+}
+
 // --- Hallazgos de una tarea, para las metricas (TASK-064) --------------------
 
 /** Un informe de revision ya leido, con la ronda y el revisor que da su nombre. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 81830f2..46c16a8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -272,6 +272,11 @@ export function logOneline(desde: string, hasta: string, cwd: string): string {
   return runGit(['log', '--oneline', `${desde}..${hasta}`], cwd);
 }
 
+/** TASK-083: true si entre `desde` (excluido) y `hasta` hay algun commit de merge. */
+export function hayMergesEntre(desde: string, hasta: string, cwd: string): boolean {
+  return runGit(['rev-list', '--merges', '--count', `${desde}..${hasta}`], cwd).trim() !== '0';
+}
+
 /** `git diff <desde>..<hasta>` (vacio si no hay diferencias). */
 export function diffRange(desde: string, hasta: string, cwd: string): string {
   return runGit(['diff', `${desde}..${hasta}`], cwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
new file mode 100644
index 0000000..fd018f5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
@@ -0,0 +1,311 @@
+/**
+ * TASK-083: alcance de la ronda N+1. Si la ronda anterior solo dejo MENORES
+ * (en TODOS sus informes) y el delta solo toca los ficheros que nombraban, la
+ * ronda siguiente es una verificacion acotada: un solo revisor (el generico),
+ * sin fragmentar, con instrucciones de verificacion y la linea `- Alcance:`.
+ * Cualquier CRITICO o IMPORTANTE, en cualquier estado, obliga a la completa.
+ * Repos Git temporales reales: review -> informes -> veredicto -> correccion -> review.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, readdir, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { runReviewCommand, type ReviewCommandResult } from '../../src/commands/review.js';
+import { runVeredictoCommand } from '../../src/commands/veredicto.js';
+import {
+  alcanceRondaSiguiente,
+  ficheroNombrado,
+  rutasDeCeldaFichero,
+  soloMenores,
+} from '../../src/core/informe-revision.js';
+import {
+  SCRIPTS_DIR,
+  sampleTask,
+  commitAll,
+  git,
+  withTempRepo,
+  setupTaskEnCursoSoloTarea,
+  advanceDevelop,
+  escribirFichero,
+} from '../helpers/review-fixtures.js';
+
+const JAVA = 'src/main/java/com/acme/UserService.java';
+const ANGULAR = 'src/app/user-profile/user-profile.component.ts';
+const OTRO = 'src/main/java/com/acme/Otro.java';
+const ID = 'TASK-983';
+
+function informe(filas: string[], veredicto = 'PENDIENTE'): string {
+  return (
+    `# Informe de revision — ${ID}\n\n- Commit revisado: x\n- Revisor: r\n` +
+    `- Veredicto: ${veredicto}\n\n## Hallazgos\n\n` +
+    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
+    filas.join('\n') +
+    '\n\nReproduccion...\n'
+  );
+}
+const MEN_JAVA = `| MEN-1 | MENOR | abierto | ${JAVA}:3 | implementacion |`;
+// El nombre corto tambien nombra la ruta completa (asi lo anotan los revisores).
+const MEN_ANGULAR = '| MEN-2 | MENOR | abierto | `user-profile.component.ts:5` | implementacion |';
+const IMP_ABIERTO = `| IMP-1 | IMPORTANTE | abierto | ${JAVA}:9 | implementacion |`;
+const IMP_CORREGIDO = `| IMP-1 | IMPORTANTE | corregido | ${JAVA}:9 | implementacion |`;
+const CRIT_ACEPTADO = `| CRIT-1 | CRITICO | aceptado | ${JAVA}:9 | implementacion |`;
+
+interface Ronda {
+  r: ReviewCommandResult;
+  peticiones: string[];
+}
+
+interface Ctx {
+  repoRoot: string;
+  tareasRoot: string;
+  /** Escribe los informes de la ultima ronda, los commitea y registra `cambios-solicitados` en cada uno. */
+  pedirCambios(r: ReviewCommandResult, informes: string[]): Promise<string[][]>;
+  /** Modifica `ficheros` y commitea (la correccion). */
+  corregir(ficheros: string[]): Promise<void>;
+  review(extra?: string[]): Promise<Ronda>;
+}
+
+/** Ronda 1 sobre `ficheros` y el contexto para seguir; `cuerpo` recibe la ronda 1. */
+async function conRonda1(ficheros: string[], cuerpo: (ctx: Ctx, r1: Ronda) => Promise<void>): Promise<void> {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: ID, rama: 'feature/task-983-alcance' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    for (const f of ficheros) await escribirFichero(repoRoot, f, `// ${f}\n`);
+    commitAll(repoRoot, 'trabajo r1');
+    await advanceDevelop(repoRoot, task.rama);
+    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
+    let n = 0;
+    const ctx: Ctx = {
+      repoRoot,
+      tareasRoot,
+      async pedirCambios(r, informes) {
+        assert.equal(r.informes.length, informes.length, 'un informe por revisor de la ronda');
+        for (let i = 0; i < informes.length; i++) {
+          await writeFile((r.informes[i] as { informePath: string }).informePath, informes[i] as string, 'utf8');
+        }
+        commitAll(repoRoot, `informes ronda ${r.ronda}`);
+        const avisos: string[][] = [];
+        for (const g of r.informes) {
+          const v = await runVeredictoCommand(
+            tareasRoot,
+            [ID, 'cambios-solicitados', ...(r.informes.length > 1 ? ['--informe', path.basename(g.informePath)] : [])],
+            { repoCwd: repoRoot }
+          );
+          avisos.push(v.avisos);
+        }
+        return avisos;
+      },
+      async corregir(fs) {
+        n++;
+        for (const f of fs) await escribirFichero(repoRoot, f, `// ${f}\n// correccion ${n}\n`);
+        commitAll(repoRoot, `correccion ${n}`);
+      },
+      async review(extra = []) {
+        const r = await runReviewCommand(tareasRoot, [ID, ...extra], '2026-11-07', deps);
+        const dir = path.dirname((r.informes[0] as { peticionPath: string }).peticionPath);
+        const nombres = (await readdir(dir)).filter((x) => x.startsWith(`peticion-revision-${r.ronda}`)).sort();
+        const peticiones = await Promise.all(nombres.map((x) => readFile(path.join(dir, x), 'utf8')));
+        return { r, peticiones };
+      },
+    };
+    const r1 = await ctx.review();
+    await cuerpo(ctx, r1);
+  });
+}
+
+function lineaAlcance(peticion: string): string | undefined {
+  return peticion.split('\n').find((l) => l.startsWith('- Alcance:'));
+}
+
+function esCompleta(ronda: Ronda, motivo: RegExp): void {
+  assert.equal(ronda.r.alcance, 'completa');
+  assert.match(ronda.r.motivoAlcance, motivo);
+  for (const p of ronda.peticiones) {
+    assert.match(lineaAlcance(p) ?? '', /^- Alcance: completa \(motivo: /);
+    assert.ok(!p.includes('(verificacion acotada)'), 'sin instrucciones acotadas');
+    assert.ok(p.includes('clona el repo a un\ndirectorio temporal'), 'instrucciones de la revision completa');
+  }
+}
+
+test('alcance (TASK-083): ronda 1 fragmentada solo con MENORES y correccion en sus ficheros -> verificacion acotada', async () => {
+  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
+    assert.equal(r1.r.informes.length, 2, 'la ronda 1 se fragmenta por dominio');
+    assert.equal(r1.r.alcance, 'completa');
+    assert.match(lineaAlcance(r1.peticiones[0] as string) ?? '', /completa \(motivo: primera ronda de revision\)/);
+    const avisos = await ctx.pedirCambios(r1.r, [informe([MEN_JAVA]), informe([MEN_ANGULAR])]);
+    // El aviso de veredicto: pedir cambios con solo MENORES.
+    for (const a of avisos) assert.match(a.join('\n'), /solo tiene MENORES/);
+    await ctx.corregir([JAVA, ANGULAR]);
+    const r2 = await ctx.review();
+
+    assert.equal(r2.r.alcance, 'acotada');
+    assert.match(r2.r.motivoAlcance, /solo dejo MENORES \(2\) y el diff solo toca sus ficheros/);
+    // Un solo revisor, el generico, con el nombre de siempre (sin sufijo).
+    assert.equal(r2.r.informes.length, 1);
+    assert.equal(r2.r.informes[0]!.revisor, 'code-quality-reviewer');
+    assert.equal(path.basename(r2.r.informes[0]!.peticionPath), 'peticion-revision-2.md');
+    assert.deepEqual([...r2.r.informes[0]!.ficheros].sort(), [ANGULAR, JAVA].sort());
+    const p = r2.peticiones[0] as string;
+    assert.equal(
+      lineaAlcance(p),
+      '- Alcance: verificacion acotada al diff de las correcciones ' +
+        '(motivo: la ronda anterior solo dejo MENORES (2) y el diff solo toca sus ficheros)'
+    );
+    assert.ok(p.includes('## Instrucciones para el agente revisor (verificacion acotada)'));
+    // No es solo tachar la lista: tests y busqueda de fallos nuevos.
+    assert.ok(p.includes('Ejecuta la suite'));
+    assert.ok(p.includes('Busca en el diff de esta ronda el fallo que la correccion abre'));
+    assert.ok(p.includes('| MEN-1 | MENOR |') && p.includes('| MEN-2 | MENOR |'), 'lista los hallazgos a verificar');
+    assert.ok(p.includes(`- Revision incremental: solo los cambios desde ${r1.r.commitRevisado}`));
+    // El chore de commit no cambia: metricas lo sigue clasificando.
+    assert.match(git(['log', '-1', '--format=%s'], ctx.repoRoot), /peticion de revision ronda 2/);
+  });
+});
+
+test('alcance (TASK-083, criterio 3): un IMPORTANTE abierto, uno corregido o un CRITICO aceptado -> ronda completa', async () => {
+  for (const fila of [IMP_ABIERTO, IMP_CORREGIDO, CRIT_ACEPTADO]) {
+    await conRonda1([JAVA], async (ctx, r1) => {
+      const avisos = await ctx.pedirCambios(r1.r, [informe([MEN_JAVA, fila])]);
+      assert.deepEqual(avisos, [[]], 'sin aviso: no son solo MENORES');
+      await ctx.corregir([JAVA]);
+      const r2 = await ctx.review();
+      esCompleta(r2, /la ronda anterior tiene un (IMPORTANTE|CRITICO)/);
+    });
+  }
+});
+
+test('alcance (TASK-083): el IMPORTANTE esta en OTRO fragmento de la ronda 1 -> completa (se decide por ronda)', async () => {
+  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA]), informe([MEN_ANGULAR.replace('MENOR', 'IMPORTANTE')])]);
+    await ctx.corregir([JAVA]);
+    const r2 = await ctx.review();
+    esCompleta(r2, /IMPORTANTE \(MEN-2/);
+  });
+});
+
+test('alcance (TASK-083): --completa la fuerza aunque la regla permita la acotada', async () => {
+  await conRonda1([JAVA], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.corregir([JAVA]);
+    esCompleta(await ctx.review(['--completa']), /pedida con --completa/);
+  });
+});
+
+test('alcance (TASK-083): el delta toca un fichero que ningun hallazgo nombraba -> completa', async () => {
+  await conRonda1([JAVA], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.corregir([JAVA, OTRO]);
+    esCompleta(await ctx.review(), new RegExp(`ningun hallazgo nombraba: ${OTRO.replace(/\./g, '\\.')}$`));
+  });
+});
+
+test('alcance (TASK-083): con mas de cinco ficheros no nombrados, el motivo nombra cinco y cuenta el resto', async () => {
+  await conRonda1([JAVA], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.corregir([JAVA, ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((x) => `extra/${x}.txt`)]);
+    const r2 = await ctx.review();
+    esCompleta(r2, /: extra\/a\.txt, extra\/b\.txt, extra\/c\.txt, extra\/d\.txt, extra\/e\.txt \(y 2 mas\)$/);
+  });
+});
+
+test('alcance (TASK-083): un merge de develop dentro del delta -> completa', async () => {
+  await conRonda1([JAVA], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.corregir([JAVA]);
+    const rama = git(['rev-parse', '--abbrev-ref', 'HEAD'], ctx.repoRoot).trim();
+    git(['checkout', '-q', 'develop'], ctx.repoRoot);
+    await escribirFichero(ctx.repoRoot, 'otro-cambio-develop.txt', 'x\n');
+    commitAll(ctx.repoRoot, 'mas develop');
+    git(['checkout', '-q', rama], ctx.repoRoot);
+    git(['merge', '-q', '--no-ff', '--no-edit', 'develop'], ctx.repoRoot);
+    esCompleta(await ctx.review(), /hay commits de merge entre/);
+  });
+});
+
+test('alcance (TASK-083): sin diff de correcciones (el commit de la ronda 1 ya no existe) -> completa', async () => {
+  await conRonda1([JAVA], async (ctx, r1) => {
+    const peticion = (r1.r.informes[0] as { peticionPath: string }).peticionPath;
+    const texto = await readFile(peticion, 'utf8');
+    await writeFile(peticion, texto.replace(/^- Commit revisado \(HEAD\): \w+/m, '- Commit revisado (HEAD): deadbeefcafe'), 'utf8');
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.corregir([JAVA]);
+    const r2 = await ctx.review();
+    esCompleta(r2, /no hay diff de correcciones/);
+    assert.equal(r2.r.desde, r2.r.baseBranch);
+  });
+});
+
+test('alcance (TASK-083): tras una acotada que encuentra un IMPORTANTE, la ronda 3 es completa y desde la base', async () => {
+  await conRonda1([JAVA], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.corregir([JAVA]);
+    const r2 = await ctx.review();
+    assert.equal(r2.r.alcance, 'acotada');
+    await ctx.pedirCambios(r2.r, [informe([`| IMP-R2-1 | IMPORTANTE | abierto | ${JAVA}:4 | implementacion |`])]);
+    await ctx.corregir([JAVA]);
+    const r3 = await ctx.review();
+    esCompleta(r3, /IMPORTANTE \(IMP-R2-1.*la ronda 2 fue acotada, asi que el diff va desde "develop"/);
+    assert.equal(r3.r.desde, 'develop');
+    assert.ok((r3.peticiones[0] as string).includes('## Commits a revisar (git log develop..HEAD)'));
+  });
+});
+
+test('alcance (TASK-083): tras una acotada con solo MENORES, la ronda 3 vuelve a ser acotada desde la ronda 2', async () => {
+  await conRonda1([JAVA], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.corregir([JAVA]);
+    const r2 = await ctx.review();
+    await ctx.pedirCambios(r2.r, [informe([`| MEN-R2-1 | MENOR | abierto | ${JAVA}:5 | implementacion |`])]);
+    await ctx.corregir([JAVA]);
+    const r3 = await ctx.review();
+    assert.equal(r3.r.alcance, 'acotada');
+    assert.equal(r3.r.desde, r2.r.commitRevisado);
+  });
+});
+
+// --- La regla pura ------------------------------------------------------------
+
+test('alcanceRondaSiguiente (TASK-083): fail-closed ante lo que no se puede leer', () => {
+  const pedida = (filas: string[]): string => informe(filas, 'cambios-solicitados');
+  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA])]).acotada, true);
+  assert.deepEqual(alcanceRondaSiguiente([pedida([MEN_JAVA, MEN_ANGULAR])]).ficherosNombrados, [
+    JAVA,
+    'user-profile.component.ts',
+  ]);
+  const casos: Array<[string, string[], RegExp]> = [
+    ['sin informes', [], /no tiene informes/],
+    ['veredicto aprobada', [informe([MEN_JAVA], 'aprobada')], /veredicto .* "aprobada"/],
+    ['veredicto pendiente', [informe([MEN_JAVA])], /veredicto .* "pendiente"/],
+    ['sin tabla', ['# I\n\n- Veredicto: cambios-solicitados\n\n## Hallazgos\n\nMEN-1 en prosa.\n'], /tabla/],
+    ['severidad desconocida', [pedida(['| X-1 | Alta | abierto | a.ts:1 | plan |'])], /"Alta"/],
+    ['sin hallazgos', [pedida(['| (ninguno) | — | sin hallazgos | — | — |'])], /sin anotar ningun hallazgo/],
+    ['IMPORTANTE corregido', [pedida([MEN_JAVA, IMP_CORREGIDO])], /IMPORTANTE \(IMP-1, corregido\)/],
+    ['un fragmento con CRITICO', [pedida([MEN_JAVA]), pedida([CRIT_ACEPTADO])], /CRITICO/],
+  ];
+  for (const [nombre, informes, motivo] of casos) {
+    const a = alcanceRondaSiguiente(informes);
+    assert.equal(a.acotada, false, nombre);
+    assert.match(a.motivo, motivo, nombre);
+  }
+  // modeloBarato sigue la regla de TASK-081, independiente del alcance.
+  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA, IMP_CORREGIDO])]).modeloBarato, true);
+  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA, CRIT_ACEPTADO])]).modeloBarato, false);
+});
+
+test('rutasDeCeldaFichero y ficheroNombrado (TASK-083)', () => {
+  assert.deepEqual(rutasDeCeldaFichero('src/a.ts:12'), ['src/a.ts']);
+  assert.deepEqual(rutasDeCeldaFichero('`b.vue:191`, src\\c.ts:1-3; ./d.ts#L4'), ['b.vue', 'src/c.ts', 'd.ts']);
+  assert.deepEqual(rutasDeCeldaFichero('—'), []);
+  assert.deepEqual(rutasDeCeldaFichero(''), []);
+  assert.equal(ficheroNombrado('src/ui/Armazon.vue', ['Armazon.vue']), true);
+  assert.equal(ficheroNombrado('src/ui/OtroArmazon.vue', ['Armazon.vue']), false);
+  assert.equal(ficheroNombrado('src/core/x.ts', ['src/core/']), true);
+  assert.equal(ficheroNombrado('src/core/x.ts', []), false);
+});
+
+test('soloMenores (TASK-083): tabla con al menos un hallazgo y todos MENOR', () => {
+  assert.equal(soloMenores(informe([MEN_JAVA, MEN_ANGULAR])), true);
+  assert.equal(soloMenores(informe([MEN_JAVA, IMP_CORREGIDO])), false);
+  assert.equal(soloMenores(informe(['| (ninguno) | — | sin hallazgos | — | — |'])), false);
+  assert.equal(soloMenores('# I\n\n## Hallazgos\n\nprosa\n'), false);
+});
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-083/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-083/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-083/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-083/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-083/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-083/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-083/tarea.md                                                       |   7 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  10 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 154 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++--------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js                                  |  11 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                               | 108 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                              |   4 +++
 12 files changed, 243 insertions(+), 51 deletions(-)
````
