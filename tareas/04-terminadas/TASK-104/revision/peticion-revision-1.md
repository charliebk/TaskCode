# Peticion de revision — TASK-104 (ronda 1)

- Tarea: TASK-104 — Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion
- Rama revisada: feature/task-104-verificacion-proporcional-a3b-las-rondas
- Rama base: develop
- Commit revisado (HEAD): e6be4de6a86a0dc92912662e3f79fe4538705dbc
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-104 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-104/tarea.md
- tareas/03-en-revision/TASK-104/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts

## Commits a revisar (git log develop..HEAD)

````
e6be4de docs(TASK-104): constancia de autorrevision
2dfd39e test(TASK-104): la comprobacion de documentacion en rojo aborta la ronda
ab52569 docs(TASK-104): Stop y review en verificacion-selectiva.md, README y CHANGELOG
6c1f15b feat(TASK-104): review decide con peticionDeTrabajo; solo documentacion corre la comprobacion de docs
092e75b chore(TASK-104): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index af0901d..51993e9 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -48,6 +48,23 @@ siempre con un aviso. Un hotfix no se exime en el freno (resolver su base
 puede costar un `ls-remote` en cada turno). Sin `rutas_documentacion` en la
 config, el freno no lanza ni un proceso git mas que en la 0.14.0.
 
+Verificacion proporcional, parte A3b (TASK-104): `review` decide con la misma
+funcion que el freno Stop (`peticionDeTrabajo`), sobre base...HEAD y nunca
+sobre el delta de la ronda. Solo si el proyecto declara
+`comando_verificacion_selectiva`: una ronda de solo documentacion corre
+`comando_verificacion_documentacion` en lugar de la selectiva, o nada si no
+se declara. **Cambio de comportamiento para quien ya declaro
+`rutas_documentacion` y la selectiva**: sus rondas de solo documentacion dejan
+de correr la selectiva. Sin la selectiva `review` sigue sin correr nada,
+tampoco la de documentacion. La peticion de revision dice que se corrio (la
+comprobacion de documentacion, o ninguna) para que el revisor no lea ese
+verde como tests pasados, y no muestra la cobertura. Un fichero de codigo en
+base...HEAD aplica la selectiva tambien en una ronda incremental que solo
+corrige documentacion. Con el mismo arbol, `review` reutiliza el resultado del
+freno. Una config de la base invalida o un fallo al decidir no abortan: la
+selectiva con un aviso. Sin `rutas_documentacion`, `review` no lee la config
+de la base ni mira el arbol, como en la 0.14.0.
+
 ## 0.14.0 — 2026-11-10
 
 ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 4e3b6e7..57339e0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -890,6 +890,16 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   que se ejecuta. La guía `verificacion-selectiva.md` trae la lista.
 - Exige `comando_verificacion`; el comando de documentación exige las rutas.
   Sin `rutas_documentacion`, todo funciona como antes.
+- El **fin de turno** (`Stop`) y **`review`** aplican la misma decisión sobre
+  todo lo que cambia la tarea frente a la base (nunca sobre el último turno ni
+  el delta de la ronda). El fin de turno cuenta además lo no commiteado (un
+  `.ts` sin `git add` saca el turno de «solo documentación») y, en un turno de
+  solo documentación, corre la comprobación de documentación o nada. `review`
+  solo verifica si declaras `comando_verificacion_selectiva`: con ella, una
+  ronda de solo documentación corre la comprobación de documentación en su
+  lugar (o nada) y la petición lo dice; sin ella no corre nada, como antes.
+  **Cambio de comportamiento** si ya declarabas `rutas_documentacion`: esos
+  turnos y rondas dejan de correr la completa o la selectiva.
 - Lo aplican `finish` y el **guardián de merges**, con la misma decisión (la
   config de la rama destino): un merge a mano de una tarea de solo
   documentación pasa sin el verde de la completa, o con el verde de su
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 25e3155..505f066 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -77,12 +77,15 @@ El clasificador falla cerrado: ante la duda, corre todo. Como minimo:
 - **Fin de turno (`Stop`)**: con tarea en curso en la rama, corre la
   selectiva; en rojo devuelve el turno con su salida. Guarda el resultado
   aparte del de la completa: un verde de la selectiva nunca abre un merge.
+  Con `rutas_documentacion`, un turno de solo documentacion corre antes la
+  comprobacion de documentacion (o nada): ver la seccion siguiente.
 - **`taskctl review`**: corre la selectiva antes de escribir la ronda (en la
   primera ronda, despues de integrar la base en la rama; las rondas
   incrementales no la integran). En rojo aborta: no abre ronda y la tarea sigue
   en curso; el mensaje dice si la base quedo integrada. En verde, la peticion de
-  revision lleva una seccion con el tipo (selectiva), el comando, el
-  resultado y su salida.
+  revision lleva una seccion con el tipo (selectiva o comprobacion de
+  documentacion), el comando, el resultado y su salida. Sin la selectiva,
+  `review` no verifica nada.
 - **`taskctl finish`**: corre la completa; en rojo no integra y dice como
   correrla.
 - **`taskctl doctor`**: avisa si hay completa y falta la selectiva.
@@ -128,7 +131,31 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   del merge podrian cambiar lo que entra. Haz el commit en otro comando. Tampoco
   en un release, ni si cambian los tests held-out (`tareas/.../aceptacion/`),
   que alli cuentan como codigo.
-- El fin de turno y `review` siguen como antes (mas estrictos, nunca mas laxos).
+- **Fin de turno y `review`** usan la misma decision (una sola funcion),
+  sobre todo lo que cambia la tarea frente a la base, nunca sobre el ultimo
+  turno ni sobre lo que cambio desde la ronda anterior: una ronda 2 que solo
+  corrige documentacion sigue corriendo la selectiva si la tarea toco codigo.
+  - El fin de turno cuenta tambien lo no commiteado: un fichero de codigo
+    modificado, preparado o sin seguimiento saca el turno de «solo
+    documentacion». Sin selectiva corre la completa; en un turno de solo
+    documentacion, la comprobacion de documentacion, o nada si no se declara.
+    Con el arbol sucio no guarda el resultado de esa comprobacion.
+  - `review` solo verifica si el proyecto declara la selectiva. Con ella, una
+    ronda de solo documentacion corre la comprobacion de documentacion en su
+    lugar, o nada si no se declara, y la peticion lo dice (asi el revisor no
+    lee ese verde como tests pasados) y no muestra la cobertura. Sin la
+    selectiva no corre nada, tampoco la de documentacion: donde antes no se
+    corria nada, no aparece ninguna ejecucion.
+  - Con la selectiva declarada, los dos deciden igual para el mismo diff, y
+    `review` reutiliza el resultado del fin de turno si el arbol no cambio. Sin
+    ella difieren a proposito: el fin de turno corre algo y `review` nada.
+  - Un hotfix no se exime en ninguno de los dos (resolver su base puede ir a la
+    red). Una config de la base invalida no bloquea: la verificacion de
+    siempre con un aviso. Los held-out de `tareas/.../aceptacion/` cuentan como
+    documentacion, igual que en `finish`, que los corre con su propia puerta.
+  - **Cambio de comportamiento** si ya declarabas `rutas_documentacion`: los
+    turnos y rondas de solo documentacion dejan de correr la completa o la
+    selectiva.
 
 ### Que `.md` NO son documentacion
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 72b3325..fdd2fbb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -34,6 +34,7 @@ import { raizDelRepo, resolverConfig } from '../core/config.js';
 import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertura.js';
 import { formatearVerificacionRoja, seccionVerificacionRevision } from '../core/informe-verificacion.js';
 import { verificarConMemo, type VerificacionConMemo } from '../fs/verificacion.js';
+import { peticionDeTrabajo, type PlanVerificacion } from '../fs/decision-documentacion.js';
 import { registrarTransicion } from '../core/transiciones.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
@@ -67,6 +68,7 @@ import {
   diffParaRevision,
   diffRangeForPaths,
   hayMergesEntre,
+  baseDeTipoSinRed,
 } from '../fs/git.js';
 import {
   autoCommit,
@@ -761,7 +763,7 @@ export async function runReviewCommand(
   // en curso y sin ronda a medias (decision de Carlos). En la primera ronda el
   // update de Git-Flow ya integro la base (y ese merge queda hecho); en una
   // incremental la rama no se actualiza (TASK-040). Sin la clave, nada.
-  const selectiva = verificacionSelectivaDeRonda(id, configRama, baseBranch, incremental, deps);
+  const verificacion = verificacionDeRonda(id, configRama, baseBranch, tipo, incremental, deps, avisos);
   // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
   // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
   // nadie arreglo sigue ahi). Una vez por ronda y antes de escribir nada;
@@ -769,7 +771,7 @@ export async function runReviewCommand(
   // corrio la selectiva no se muestra: su informe puede ser parcial
   // (decision de Carlos; la completa la mide en el cierre).
   const datosCobertura =
-    configRama.informe_cobertura === null || selectiva !== null
+    configRama.informe_cobertura === null || verificacion !== null
       ? null
       : datosCoberturaRevision(
           raizDelRepo(deps.repoCwd),
@@ -932,15 +934,14 @@ export async function runReviewCommand(
                     plan.fragmentado ? (coberturaPorRevisor.get(escritura.revisor) ?? new Set<string>()) : undefined
                   ),
                 }),
-            ...(selectiva === null
+            ...(verificacion === null
               ? {}
               : {
-                  seccionVerificacion: seccionVerificacionRevision({
-                    resultado: selectiva.resultado,
-                    base: baseBranch,
-                    deMemo: selectiva.deMemo,
-                    conCobertura: configRama.informe_cobertura !== null,
-                  }),
+                  seccionVerificacion: seccionDeVerificacion(
+                    verificacion,
+                    baseBranch,
+                    configRama.informe_cobertura !== null
+                  ),
                 }),
           }
         )
@@ -1013,28 +1014,94 @@ export async function runReviewCommand(
   };
 }
 
+/** La seccion «Verificacion de esta ronda» de la peticion. */
+function seccionDeVerificacion(r: VerificacionRonda, base: string, conCobertura: boolean): string {
+  if (r.tipo === 'documentacion-sin-comando') {
+    return seccionVerificacionRevision({ tipo: r.tipo, motivo: r.motivo, conCobertura });
+  }
+  if (r.tipo === 'documentacion') {
+    return seccionVerificacionRevision({
+      tipo: 'documentacion',
+      resultado: r.v.resultado,
+      motivo: r.motivo,
+      deMemo: r.v.deMemo,
+      conCobertura,
+    });
+  }
+  return seccionVerificacionRevision({ tipo: 'selectiva', resultado: r.v.resultado, base, deMemo: r.v.deMemo, conCobertura });
+}
+
+/** Lo que verifico la ronda (para la seccion de la peticion y la cobertura). */
+type VerificacionRonda =
+  | { tipo: 'selectiva'; v: VerificacionConMemo }
+  | { tipo: 'documentacion'; v: VerificacionConMemo; motivo: string }
+  | { tipo: 'documentacion-sin-comando'; motivo: string };
+
 /**
- * TASK-091: la verificacion selectiva de la ronda, o null si el proyecto no
- * la declara. Reutiliza el resultado del hook Stop si la huella coincide.
- * Lanza ReviewCommandError (sin haber escrito nada) si no sale en verde o si
- * deja el arbol sucio: el autocommit de la ronda se llevaria esos ficheros o
- * el siguiente comando abortaria por workspace sucio.
+ * TASK-091: la verificacion de la ronda, o null si el proyecto no declara
+ * `comando_verificacion_selectiva` (entonces no se decide nada ni se lanza
+ * ningun git: como en la 0.14.0; y sin selectiva no corre nada aunque haya
+ * comando de documentacion, decision de Carlos en TASK-102).
+ *
+ * TASK-104: decide con `peticionDeTrabajo`, la misma funcion y la misma
+ * `baseFiable` que el freno Stop, sobre base...HEAD mas el arbol (nunca el
+ * delta de la ronda): con solo documentacion corre la comprobacion de
+ * documentacion de la base, o nada si no se declara. Un fallo de la decision
+ * no aborta: la selectiva, con un aviso.
+ *
+ * Reutiliza el resultado del hook Stop si la huella coincide. Lanza
+ * ReviewCommandError (sin haber escrito nada) si no sale en verde o si deja el
+ * arbol sucio: el autocommit de la ronda se llevaria esos ficheros o el
+ * siguiente comando abortaria por workspace sucio.
  */
-function verificacionSelectivaDeRonda(
+function verificacionDeRonda(
   id: string,
   config: ReturnType<typeof resolverConfig>,
   base: string,
+  tipoTarea: Task['tipo'],
   incremental: boolean,
-  deps: ReviewCommandDeps
-): VerificacionConMemo | null {
-  const comando = config.comando_verificacion_selectiva;
-  if (comando === null) return null;
+  deps: ReviewCommandDeps,
+  avisos: string[]
+): VerificacionRonda | null {
+  const selectiva = config.comando_verificacion_selectiva;
+  if (selectiva === null) return null;
   const raiz = raizDelRepo(deps.repoCwd);
+  let plan: PlanVerificacion;
+  try {
+    const decision = peticionDeTrabajo({
+      config,
+      raiz,
+      base: () => base,
+      baseFiable: baseDeTipoSinRed(tipoTarea),
+      sinSelectiva: 'nada',
+    });
+    plan = decision.plan;
+    avisos.push(...decision.avisos.map((a) => `${id}: ${a}`));
+  } catch (e: unknown) {
+    plan = { tipo: 'selectiva', comando: selectiva, timeoutS: config.timeout_verificacion_selectiva, base };
+    avisos.push(
+      `${id}: no se pudo decidir si la tarea solo cambia documentacion, asi que se corre la verificacion ` +
+        `selectiva. Detalle: ${e instanceof Error ? e.message : String(e)}`
+    );
+  }
+  if (plan.tipo === 'documentacion' && plan.comando === null) {
+    return { tipo: 'documentacion-sin-comando', motivo: plan.motivo };
+  }
+  // Con la selectiva declarada, `peticionDeTrabajo` nunca da 'completa' ni 'nada'.
+  if (plan.tipo !== 'selectiva' && plan.tipo !== 'documentacion') return null;
+  const comando = plan.comando as string;
+  const motivo = plan.tipo === 'documentacion' ? plan.motivo : null;
   const v = verificarConMemo(
     raiz,
-    { tipo: 'selectiva', comando, timeoutS: config.timeout_verificacion_selectiva, base },
+    motivo !== null
+      ? { tipo: 'documentacion', comando, timeoutS: plan.timeoutS }
+      : { tipo: 'selectiva', comando, timeoutS: plan.timeoutS, base },
     deps.env === undefined ? {} : { env: deps.env }
   );
+  const nombre =
+    motivo !== null
+      ? 'la comprobacion de documentacion (comando_verificacion_documentacion: solo cambia documentacion)'
+      : `la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE)`;
   // Lo que ya paso con la base antes de verificar: solo la primera ronda la integra.
   const estadoBase = incremental
     ? `en una ronda incremental la rama no se actualiza con "${base}"`
@@ -1042,22 +1109,25 @@ function verificacionSelectivaDeRonda(
       'siguiente review lo integra';
   if (v.resultado.estado !== 'verde') {
     throw new ReviewCommandError(
-      `[ERROR] ${id}: la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE) no esta en ` +
+      `[ERROR] ${id}: ${nombre} no esta en ` +
         'verde, asi que no se abre ronda de revision: la tarea sigue en curso y no se ha escrito peticion ni ' +
         `informe (${estadoBase}).\n` +
         `${formatearVerificacionRoja(v.resultado)}\n` +
         (v.deMemo
           ? 'Es el resultado guardado: el arbol no ha cambiado desde la ultima ejecucion. Cambia algo o ejecuta el comando a mano.\n'
           : '') +
-        `Para reproducirla: ejecuta "${comando}" con la variable de entorno RAMA_BASE=${base}.`
+        (motivo !== null
+          ? `Para reproducirla: ejecuta "${comando}".`
+          : `Para reproducirla: ejecuta "${comando}" con la variable de entorno RAMA_BASE=${base}.`)
     );
   }
   if (v.cambioElArbol) {
     throw new ReviewCommandError(
-      `[ERROR] ${id}: la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
+      `[ERROR] ${id}: ${motivo !== null ? 'la comprobacion de documentacion' : 'la verificacion selectiva'} salio en ` +
+        'verde, pero ha dejado cambios en el arbol de trabajo ' +
         `("${comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en .gitignore, ` +
         `o descartalos, y reintenta. No se ha abierto ronda (${estadoBase}).`
     );
   }
-  return v;
+  return motivo !== null ? { tipo: 'documentacion', v, motivo } : { tipo: 'selectiva', v };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
index fbcb321..c975ba3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
@@ -117,41 +117,78 @@ export function formatearVerificacionRoja(
   return lineas.join('\n');
 }
 
-export interface VerificacionDeRonda {
-  resultado: ResultadoVerificacion;
-  /** Rama base que recibio en RAMA_BASE. */
-  base: string;
-  /** true si es el resultado guardado de una ejecucion anterior con la misma huella. */
-  deMemo: boolean;
-  /** true si el proyecto declara un informe de cobertura (que esta ronda no muestra). */
-  conCobertura: boolean;
-}
+/**
+ * Lo que se corrio en la ronda. TASK-104: con solo documentacion en
+ * base...HEAD, la comprobacion de documentacion (o nada, si no se declaro)
+ * en lugar de la selectiva. La peticion lo dice para que el revisor no lea un
+ * verde de documentacion como si hubieran pasado los tests.
+ */
+export type VerificacionDeRonda =
+  | {
+      tipo: 'selectiva';
+      resultado: ResultadoVerificacion;
+      /** Rama base que recibio en RAMA_BASE. */
+      base: string;
+      /** true si es el resultado guardado de una ejecucion anterior con la misma huella. */
+      deMemo: boolean;
+      /** true si el proyecto declara un informe de cobertura (que esta ronda no muestra). */
+      conCobertura: boolean;
+    }
+  | {
+      tipo: 'documentacion';
+      resultado: ResultadoVerificacion;
+      /** Por que cuenta como solo documentacion (el motivo de la decision). */
+      motivo: string;
+      deMemo: boolean;
+      conCobertura: boolean;
+    }
+  | { tipo: 'documentacion-sin-comando'; motivo: string; conCobertura: boolean };
+
+const NO_SUSTITUYE = 'No sustituye a la completa: el cierre la exige sobre el commit que se integra.';
 
 /**
  * TASK-091: la seccion de la peticion de revision que dice que verificacion
- * se corrio en la ronda (hoy solo la selectiva: sin ella `review` no verifica),
- * con su resultado y su salida. Va al final, despues de la cabecera con el
- * commit revisado, y la salida en una valla que no colisiona con ella.
+ * se corrio en la ronda, con su resultado y su salida. Va al final, despues
+ * de la cabecera con el commit revisado, y la salida en una valla que no
+ * colisiona con ella. Sin `comando_verificacion_selectiva` review no verifica
+ * y no hay seccion.
  */
 export function seccionVerificacionRevision(v: VerificacionDeRonda): string {
+  const coberturaOculta =
+    '- Cobertura: no se muestra en esta ronda. ' +
+    (v.tipo === 'selectiva'
+      ? 'La selectiva solo corre parte de los tests y el informe puede ser parcial; la completa la mide en el cierre.'
+      : 'Solo cambia documentacion y no se ha corrido ningun test: el informe seria de otra ejecucion. ' +
+        'La completa la mide en el cierre.');
+  if (v.tipo === 'documentacion-sin-comando') {
+    const lineas = [
+      '## Verificacion de esta ronda',
+      '',
+      `- Tipo: ninguna: ${v.motivo} y el proyecto no declara comando_verificacion_documentacion, ` +
+        'asi que no se ha corrido ningun test ni ninguna comprobacion. ' +
+        NO_SUSTITUYE,
+    ];
+    if (v.conCobertura) lineas.push(coberturaOculta);
+    lineas.push('');
+    return `\n${lineas.join('\n')}`;
+  }
   const r = v.resultado;
   const { texto, recortada } = recortarCola(r.cola);
   const truncada = recortada || r.bytesTotales > Buffer.byteLength(r.cola, 'utf8');
   const lineas = [
     '## Verificacion de esta ronda',
     '',
-    `- Tipo: selectiva (por impacto respecto a \`${v.base}\`, que recibe en la variable RAMA_BASE). ` +
-      'No sustituye a la completa: el cierre la exige sobre el commit que se integra.',
+    v.tipo === 'selectiva'
+      ? `- Tipo: selectiva (por impacto respecto a \`${v.base}\`, que recibe en la variable RAMA_BASE). ` +
+        NO_SUSTITUYE
+      : `- Tipo: comprobacion de documentacion (comando_verificacion_documentacion): ${v.motivo}, ` +
+        'asi que no se ha corrido ningun test. ' +
+        NO_SUSTITUYE,
     `- Comando: \`${r.comando}\``,
     `- Resultado: ${describirResultado(r)}${v.deMemo ? ' (resultado guardado: el arbol no ha cambiado desde la ultima ejecucion)' : ''}`,
     `- Duracion: ${segundos(r.duracionMs)}`,
   ];
-  if (v.conCobertura) {
-    lineas.push(
-      '- Cobertura: no se muestra en esta ronda. La selectiva solo corre parte de los tests y el informe ' +
-        'puede ser parcial; la completa la mide en el cierre.'
-    );
-  }
+  if (v.conCobertura) lineas.push(coberturaOculta);
   lineas.push('');
   if (texto === '') {
     lineas.push('Salida: (vacia)', '');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts
new file mode 100644
index 0000000..6d2052d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts
@@ -0,0 +1,287 @@
+/**
+ * Verificacion proporcional en las rondas de review (TASK-104, A3b). Repos Git
+ * temporales de verdad y los scripts de Git-Flow tal cual. Los tres comandos
+ * (completa, selectiva y documentacion) son un script de node que vive FUERA
+ * del repo y cuenta sus ejecuciones.
+ *
+ * review decide con la misma funcion que el freno Stop (`peticionDeTrabajo`),
+ * sobre base...HEAD y nunca sobre el delta de la ronda, y solo si el proyecto
+ * declara `comando_verificacion_selectiva` (sin ella no corre nada, como en la
+ * 0.14.0: decision de Carlos).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { runVeredictoCommand } from '../../src/commands/veredicto.js';
+import { decidirStop } from '../../src/hooks/freno-stop.js';
+import {
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  setupTaskEnCursoSoloTarea,
+} from '../helpers/review-fixtures.js';
+
+type Comando = 'completa' | 'selectiva' | 'docs';
+
+const SCRIPT = `
+const fs = require('node:fs');
+const path = require('node:path');
+fs.appendFileSync(path.join(__dirname, 'cuenta-' + process.argv[2]), 'x');
+if (fs.existsSync(path.join(__dirname, 'falla-' + process.argv[2]))) { console.error(process.argv[2] + ': ERROR, enlace roto'); process.exit(3); }
+console.log(process.argv[2] + ': verde');
+`;
+
+interface Entorno {
+  repoRoot: string;
+  tareasRoot: string;
+  fuera: string;
+  cmd(c: Comando): string;
+  ejecuciones(c: Comando): number;
+}
+
+/**
+ * Repo con la config commiteada en develop y una tarea en curso en su rama, sin
+ * ningun cambio aun (solo su tarea.md, que siempre cuenta como documentacion).
+ */
+async function conTarea(config: (e: Omit<Entorno, 'repoRoot' | 'tareasRoot'>) => string, fn: (e: Entorno) => Promise<void>): Promise<void> {
+  const fuera = await mkdtemp(path.join(tmpdir(), 'review-docs-fuera-'));
+  await writeFile(path.join(fuera, 'verif.cjs'), SCRIPT, 'utf8');
+  const base = {
+    fuera,
+    cmd: (c: Comando) => `node ${path.join(fuera, 'verif.cjs').split(path.sep).join('/')} ${c}`,
+    ejecuciones: (c: Comando) => {
+      const f = path.join(fuera, `cuenta-${c}`);
+      return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
+    },
+  };
+  try {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config(base), 'utf8');
+      await mkdir(path.join(repoRoot, 'docs'), { recursive: true });
+      await writeFile(path.join(repoRoot, 'docs', 'guia.md'), 'guia\n', 'utf8');
+      commitAll(repoRoot, 'config y docs');
+      await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, sampleTask());
+      await fn({ ...base, repoRoot, tareasRoot });
+    });
+  } finally {
+    await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+/** Las tres claves, con `rutas_documentacion: [docs/**]`. */
+const tresClaves = (e: { cmd(c: Comando): string }, extra = ''): string =>
+  `comando_verificacion: "${e.cmd('completa')}"\n` +
+  `comando_verificacion_selectiva: "${e.cmd('selectiva')}"\n` +
+  `comando_verificacion_documentacion: "${e.cmd('docs')}"\n` +
+  'rutas_documentacion: [docs/**]\n' +
+  extra;
+
+async function cambiar(e: Entorno, rel: string, texto: string): Promise<void> {
+  await mkdir(path.dirname(path.join(e.repoRoot, rel)), { recursive: true });
+  await writeFile(path.join(e.repoRoot, rel), texto, 'utf8');
+  commitAll(e.repoRoot, `cambia ${rel}`);
+}
+
+const review = (e: Entorno) =>
+  runReviewCommand(e.tareasRoot, ['TASK-600'], '2026-11-11', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });
+
+const peticionDe = (r: Awaited<ReturnType<typeof review>>): string =>
+  readFileSync((r.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
+
+const stop = (e: Entorno) =>
+  decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: e.repoRoot }, { env: process.env });
+
+/** Cierra la ronda 1 con un IMPORTANTE para poder abrir la 2 (incremental). */
+async function cerrarRondaConCambios(e: Entorno, r1: Awaited<ReturnType<typeof review>>): Promise<void> {
+  await writeFile(
+    (r1.informes[0] as { informePath: string }).informePath,
+    '# Informe de revision — TASK-600 (ronda 1)\n\n- Commit revisado: x\n- Veredicto: PENDIENTE\n\n' +
+      '## Hallazgos\n\n| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n| IMP-1 | IMPORTANTE | corregido | docs/guia.md:1 |\n',
+    'utf8'
+  );
+  commitAll(e.repoRoot, 'informe ronda 1');
+  await runVeredictoCommand(e.tareasRoot, ['TASK-600', 'cambios-solicitados'], { repoCwd: e.repoRoot });
+}
+
+test('review (TASK-104): ronda de solo documentacion con selectiva y comando de documentacion corre el de documentacion, no la selectiva', async () => {
+  await conTarea(tresClaves, async (e) => {
+    await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+    const r = await review(e);
+    assert.equal(e.ejecuciones('docs'), 1);
+    assert.equal(e.ejecuciones('selectiva'), 0);
+    assert.equal(e.ejecuciones('completa'), 0);
+    const peticion = peticionDe(r);
+    assert.match(peticion, /## Verificacion de esta ronda/);
+    assert.match(peticion, /- Tipo: comprobacion de documentacion \(comando_verificacion_documentacion\): la tarea solo cambia documentacion/);
+    assert.match(peticion, /no se ha corrido ningun test/);
+    assert.match(peticion, /docs: verde/);
+    assert.doesNotMatch(peticion, /Tipo: selectiva/);
+    assert.equal(git(['status', '--porcelain'], e.repoRoot), '');
+  });
+});
+
+test('review (TASK-104): solo documentacion con selectiva y sin comando de documentacion no corre nada y la peticion lo dice', async () => {
+  await conTarea(
+    (b) =>
+      `comando_verificacion: "${b.cmd('completa')}"\ncomando_verificacion_selectiva: "${b.cmd('selectiva')}"\n` +
+      'rutas_documentacion: [docs/**]\n',
+    async (e) => {
+      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+      const r = await review(e);
+      assert.equal(e.ejecuciones('selectiva') + e.ejecuciones('completa') + e.ejecuciones('docs'), 0);
+      const peticion = peticionDe(r);
+      assert.match(peticion, /- Tipo: ninguna: la tarea solo cambia documentacion .* no declara comando_verificacion_documentacion/);
+      assert.match(peticion, /no se ha corrido ningun test ni ninguna comprobacion/);
+      assert.doesNotMatch(peticion, /- Comando:/);
+    }
+  );
+});
+
+test('review (TASK-104): solo documentacion SIN selectiva no corre nada aunque haya comando de documentacion (decision de Carlos)', async () => {
+  await conTarea(
+    (b) =>
+      `comando_verificacion: "${b.cmd('completa')}"\ncomando_verificacion_documentacion: "${b.cmd('docs')}"\n` +
+      'rutas_documentacion: [docs/**]\n',
+    async (e) => {
+      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+      const r = await review(e);
+      assert.equal(e.ejecuciones('selectiva') + e.ejecuciones('completa') + e.ejecuciones('docs'), 0);
+      assert.doesNotMatch(peticionDe(r), /Verificacion de esta ronda/);
+    }
+  );
+});
+
+test('review (TASK-104): codigo en base...HEAD aplica la selectiva, tambien en una ronda incremental cuyo delta solo toca documentacion', async () => {
+  await conTarea(tresClaves, async (e) => {
+    await cambiar(e, 'src/app.ts', 'export const a = 1;\n');
+    const r1 = await review(e);
+    assert.equal(e.ejecuciones('selectiva'), 1);
+    assert.equal(e.ejecuciones('docs'), 0);
+    assert.match(peticionDe(r1), /- Tipo: selectiva \(por impacto respecto a `develop`/);
+    await cerrarRondaConCambios(e, r1);
+    // La correccion solo toca documentacion: el delta de la ronda 2 es de docs,
+    // pero base...HEAD sigue llevando src/app.ts.
+    await cambiar(e, 'docs/guia.md', 'guia corregida\n');
+    const r2 = await review(e);
+    assert.equal(r2.ronda, 2);
+    assert.equal(r2.alcance, 'acotada', 'es la ronda incremental, con el delta de la correccion');
+    assert.equal(e.ejecuciones('docs'), 0, 'la de documentacion nunca corre con codigo en base...HEAD');
+    assert.equal(e.ejecuciones('selectiva'), 2);
+    assert.match(peticionDe(r2), /- Tipo: selectiva \(por impacto respecto a `develop`/);
+  });
+});
+
+test('Stop y review (TASK-104): la misma decision para el mismo diff, con la selectiva declarada', async () => {
+  // Solo documentacion: los dos eligen la comprobacion de documentacion.
+  await conTarea(tresClaves, async (e) => {
+    await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+    const d = await stop(e);
+    assert.equal(d.codigo, 0, d.stderr);
+    assert.equal(e.ejecuciones('docs'), 1);
+    assert.equal(e.ejecuciones('selectiva'), 0);
+    const r = await review(e);
+    assert.match(peticionDe(r), /- Tipo: comprobacion de documentacion/);
+    // Mismo arbol, misma huella: review reutiliza el resultado del Stop.
+    assert.match(peticionDe(r), /resultado guardado/);
+    assert.equal(e.ejecuciones('docs'), 1);
+    assert.equal(e.ejecuciones('selectiva'), 0);
+  });
+  // Con codigo: los dos eligen la selectiva.
+  await conTarea(tresClaves, async (e) => {
+    await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+    await cambiar(e, 'src/app.ts', 'export const a = 1;\n');
+    const d = await stop(e);
+    assert.equal(d.codigo, 0, d.stderr);
+    assert.equal(e.ejecuciones('selectiva'), 1);
+    const r = await review(e);
+    assert.match(peticionDe(r), /- Tipo: selectiva/);
+    assert.equal(e.ejecuciones('docs'), 0);
+  });
+});
+
+test('review (TASK-104): sin rutas_documentacion, como en la 0.14.0 — la selectiva y sin leer la config de la base', async () => {
+  await conTarea(
+    (b) => `comando_verificacion: "${b.cmd('completa')}"\ncomando_verificacion_selectiva: "${b.cmd('selectiva')}"\n`,
+    async (e) => {
+      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+      const traza = path.join(e.fuera, 'traza.json');
+      const antes = process.env['GIT_TRACE2_EVENT'];
+      process.env['GIT_TRACE2_EVENT'] = traza;
+      let r;
+      try {
+        r = await review(e);
+      } finally {
+        if (antes === undefined) delete process.env['GIT_TRACE2_EVENT'];
+        else process.env['GIT_TRACE2_EVENT'] = antes;
+      }
+      assert.equal(e.ejecuciones('selectiva'), 1);
+      assert.equal(e.ejecuciones('docs'), 0);
+      const peticion = peticionDe(r);
+      assert.match(peticion, /- Tipo: selectiva \(por impacto respecto a `develop`, que recibe en la variable RAMA_BASE\)\. No sustituye a la completa/);
+      const argvs = readFileSync(traza, 'utf8')
+        .split('\n')
+        .filter((l) => l.includes('"event":"start"'))
+        .map((l) => (JSON.parse(l) as { argv: string[] }).argv.slice(1).join(' '));
+      assert.ok(argvs.length > 0, 'la traza recoge los procesos git');
+      assert.ok(!argvs.some((a) => a.includes('show develop:.taskcode/config.yml')), 'no lee la config de la base');
+      assert.ok(!argvs.some((a) => a.includes('ls-files --others')), 'no mira el arbol de trabajo');
+    }
+  );
+});
+
+test('review (TASK-104): config de la base invalida — la selectiva, con un aviso, nunca aborta', async () => {
+  await conTarea(
+    (b) => tresClaves(b, 'timeout_verificacion: "mucho"\n'),
+    async (e) => {
+      // La rama corrige su config (la de la base sigue invalida) y toca solo docs.
+      await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), tresClaves(e), 'utf8');
+      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+      const r = await review(e);
+      assert.equal(e.ejecuciones('selectiva'), 1);
+      assert.equal(e.ejecuciones('docs'), 0);
+      assert.ok(
+        r.avisos.some((a) => /TASK-600: La configuracion de "develop" no es valida.*verificacion de siempre/.test(a)),
+        r.avisos.join('\n')
+      );
+    }
+  );
+});
+
+test('review (TASK-104): en una ronda de documentacion la cobertura se oculta y la peticion dice por que (decision de Carlos)', async () => {
+  await conTarea(
+    (b) => tresClaves(b, 'informe_cobertura: "coverage/lcov.info"\n'),
+    async (e) => {
+      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+      const peticion = peticionDe(await review(e));
+      assert.doesNotMatch(peticion, /## Cobertura/);
+      assert.match(peticion, /- Cobertura: no se muestra en esta ronda\. Solo cambia documentacion y no se ha corrido ningun test/);
+    }
+  );
+});
+
+test('review (TASK-104): la comprobacion de documentacion en rojo aborta sin ronda y dice que fue esa, sin RAMA_BASE', async () => {
+  await conTarea(tresClaves, async (e) => {
+    await writeFile(path.join(e.fuera, 'falla-docs'), '', 'utf8');
+    await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
+    await assert.rejects(
+      () => review(e),
+      (err: unknown) => {
+        assert.ok(err instanceof ReviewCommandError);
+        assert.match(err.message, /la comprobacion de documentacion \(comando_verificacion_documentacion: solo cambia documentacion\) no esta en verde/);
+        assert.match(err.message, /docs: ERROR, enlace roto/);
+        assert.doesNotMatch(err.message, /selectiva|RAMA_BASE/);
+        return true;
+      }
+    );
+    assert.equal(e.ejecuciones('selectiva'), 0);
+    assert.ok(!existsSync(path.join(e.tareasRoot, '03-en-revision', 'TASK-600')), 'la tarea sigue en curso');
+    assert.equal(git(['status', '--porcelain'], e.repoRoot), '');
+  });
+});
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-104/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-104/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-104/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-104/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-104/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-104/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-104/tarea.md                                                       |   7 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 101 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-verificacion.js                           |  40 +++++++++++++++++++++++++--------
 9 files changed, 115 insertions(+), 33 deletions(-)
````
