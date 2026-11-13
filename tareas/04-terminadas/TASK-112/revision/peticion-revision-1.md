# Peticion de revision — TASK-112 (ronda 1)

- Tarea: TASK-112 — P-4: el revisor reutiliza la verificacion de ronda y las rondas 2+ solo relanzan al revisor con pendientes
- Rama revisada: feature/task-112-p-4-el-revisor-reutiliza-la-verificacion
- Rama base: develop
- Commit revisado (HEAD): 96b3085e279665d8b519d63955b455d8d5f63bc8
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-112 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (TASK-112: salvo que esta
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

- tareas/03-en-revision/TASK-112/tarea.md
- tareas/03-en-revision/TASK-112/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts

## Commits a revisar (git log develop..HEAD)

````
96b3085 feat(TASK-112): verificacion de ronda reutilizable y rondas 2+ solo con CRITICO e IMPORTANTE
a7c60f2 chore(TASK-112): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
index bb6a719..95ecbba 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -78,7 +78,10 @@ ejecutando:
 2. **Correr la suite entera uno mismo** y anotar el resultado real: cuantos
    tests, cuantos fallan, cuales. "Los tests pasan" sin haberlos corrido no
    vale, y `exit 0` no prueba que ocurriera nada — hay que comprobar el hecho.
-   Una sola vez por ronda (ver revision.md).
+   Una sola vez por ronda (ver revision.md). Si la peticion ya trae la
+   verificacion de la ronda en verde con un `Commit verificado` igual al
+   `Commit revisado`, esa ejecucion cuenta: citala y no la repitas; corre solo
+   los tests de lo que revisas.
 3. **Mutar**: romper a proposito la linea que el diff dice proteger y
    comprobar que algun test se pone rojo. Si sigue verde, no hay red de
    regresion, y eso ya es un hallazgo por si solo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index a696c87..af94605 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -101,7 +101,9 @@ ejecutando:
    siempre, **y otra vez tras cada cambio de rama dentro del mismo clon**.
 2. **Correr la suite entera uno mismo**, y anotar el resultado real (numero de
    tests, fallos, tiempo). "Los tests pasan" sin haberlos corrido no vale.
-   Una sola vez por ronda (ver revision.md).
+   Una sola vez por ronda (ver revision.md). Si la peticion ya trae la
+   verificacion de la ronda en verde con un `Commit verificado` igual al
+   `Commit revisado`, esa ejecucion cuenta: citala y no la repitas.
 3. **Mutar las protecciones**: romper a proposito la linea que el diff dice
    proteger (el `Commit()`, la comprobacion de `IsErased`, el
    `CultureInfo.InvariantCulture`, el factor de unidades) y comprobar que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 9038fd2..71fddf9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -88,8 +88,11 @@ punto, no un formalismo.
    automatico, si `siguiente` da `fase: review` con `accion: continuar`, haz tu
    todo eso, commitea, deja la suite en verde y vuelve al paso 2. Desde la
    ronda 2 la ronda es una verificacion acotada: cada revisor comprueba sus
-   hallazgos pendientes y el diff de la correccion, y solo abre uno nuevo si
-   es CRITICO o lo introduce la correccion.
+   hallazgos CRITICO e IMPORTANTE pendientes y el diff de la correccion, y solo
+   abre uno nuevo si es CRITICO o lo introduce la correccion. Los MENORES no se
+   reverifican (los compruebas tu), y un revisor que solo tenia MENORES y cuyos
+   ficheros no toca la correccion no recibe peticion: `taskctl review` lo anota
+   en `## Revisores no relanzados` de `tarea.md`.
    **Tope**: tras la ronda 3 con cambios, `siguiente` pregunta en cualquier
    modo. Lo decide una persona: aceptar lo abierto (sus IDs y el motivo en el
    `## Resultado`) y cerrar, pasarlo a una tarea nueva, o corregir y abrir
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 7a21cbf..9545de5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -35,7 +35,7 @@ import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertur
 import { formatearVerificacionRoja, seccionVerificacionRevision } from '../core/informe-verificacion.js';
 import { verificarConMemo, type VerificacionConMemo } from '../fs/verificacion.js';
 import { peticionDeTrabajo, type PlanVerificacion } from '../fs/decision-documentacion.js';
-import { registrarTransicion } from '../core/transiciones.js';
+import { anotarLineaEnSeccion, registrarTransicion } from '../core/transiciones.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import {
@@ -51,6 +51,7 @@ import {
   commitRevisadoDe,
   hallazgosNoCerrados,
   hallazgosPendientes,
+  severidadDe,
   veredictoDeRonda,
   type AlcanceRonda,
   type VeredictoInforme,
@@ -300,7 +301,9 @@ function instruccionesCompletas(nombreInforme: string): string {
     '## Instrucciones para el agente revisor\n\n' +
     'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
     'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
-    'directorio temporal, corre la suite tu mismo y construye el caso que\n' +
+    'directorio temporal, corre la suite tu mismo (TASK-112: salvo que esta\n' +
+    'peticion ya traiga la verificacion de la ronda en verde para el commit revisado;\n' +
+    'entonces vale ese resultado) y construye el caso que\n' +
     `rompe el codigo antes de reportarlo. ${CLASIFICACION} Vuelca tu salida en el\n` +
     `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
     'peticion.\n\n'
@@ -327,14 +330,17 @@ function instruccionesAcotadas(nombreInforme: string): string {
     '## Instrucciones para el agente revisor (verificacion acotada)\n\n' +
     'Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una\n' +
     'revision completa: esta ronda verifica las correcciones de la ronda anterior,\n' +
-    'no vuelve a revisar la rama entera. Haz esto, y nada mas:\n\n' +
+    'no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (TASK-112:\n' +
+    'tu tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:\n\n' +
     '1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo\n' +
     '   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:\n' +
     '   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el\n' +
     '   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la\n' +
     '   causa no esta en el diff.\n' +
     '2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit\n' +
-    '   revisado y di el resultado: verificar sin ejecutar no vale.\n' +
+    '   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion\n' +
+    '   ya trae la verificacion de la ronda en verde para ese mismo commit, no la\n' +
+    '   repitas: cita ese resultado y corre solo los tests de lo que verificas.\n' +
     '3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo\n' +
     '   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que\n' +
     '   lo rompe antes de reportarlo.\n\n' +
@@ -401,6 +407,11 @@ interface RondaPrevia {
    * hallazgos pendientes, para la ronda acotada.
    */
   seccionesPorRevisor: Map<string, string>;
+  /**
+   * TASK-112: revisores ('' = el generico) cuyos unicos pendientes son MENORES:
+   * no estan en `seccionesPorRevisor` y solo vuelven si la correccion toca su dominio.
+   */
+  soloMenores: string[];
   /** TASK-095: hallazgos de la ronda N que no estan `corregido` ni `aceptado`. */
   sinMarcar: string[];
   /** TASK-081 y TASK-083: lo que los informes de la ronda N permiten para la N+1. */
@@ -413,11 +424,22 @@ interface RondaPrevia {
 export { modeloBaratoPermitido } from '../core/informe-revision.js';
 
 /** Tabla de pendientes de una ronda, con la nota de los informes ilegibles. */
-function seccionPendientes(ronda: number, filas: readonly string[], sinTabla: readonly string[]): string {
+function seccionPendientes(
+  ronda: number,
+  filas: readonly string[],
+  sinTabla: readonly string[],
+  menoresOmitidos = 0
+): string {
   let seccion =
     `## Hallazgos de la ronda ${String(ronda)} pendientes de verificar\n\n` +
     'Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la\n' +
     'correccion no abre otro fallo: es justo donde se cuelan.\n\n';
+  // TASK-112: en la ronda acotada solo van los CRITICOS e IMPORTANTES.
+  if (menoresOmitidos > 0) {
+    seccion +=
+      `Tus ${String(menoresOmitidos)} hallazgo(s) MENOR de la ronda ${String(ronda)} no estan en la tabla: ` +
+      'los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.\n\n';
+  }
   if (filas.length > 0) {
     seccion += '| ID | Severidad | Estado | Fichero | Informe |\n|---|---|---|---|---|\n' + filas.join('\n') + '\n';
   } else if (sinTabla.length === 0) {
@@ -454,6 +476,7 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
   const sinTabla: string[] = [];
   const sinMarcar: string[] = [];
   const porRevisor = new Map<string, string[]>();
+  const menoresPorRevisor = new Map<string, number>();
   for (const { nombre, texto } of textos) {
     const revisor = rondaYRevisorDeInforme(nombre)?.revisor ?? '';
     const lectura = hallazgosPendientes(texto);
@@ -466,13 +489,20 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
     for (const h of lectura.abiertos) {
       const fila = `| ${h.id} | ${h.severidad} | ${h.estado} | ${h.fichero} | ${nombre} |`;
       filas.push(fila);
-      propias.push(fila);
+      // TASK-112: la ronda acotada solo reverifica CRITICOS e IMPORTANTES (y
+      // lo que no tiene severidad reconocida, que no se descarta a ciegas);
+      // los MENORES los comprueba quien coordina.
+      if (severidadDe(h.severidad) === 'MENOR') menoresPorRevisor.set(revisor, (menoresPorRevisor.get(revisor) ?? 0) + 1);
+      else propias.push(fila);
     }
     porRevisor.set(revisor, propias);
   }
   const seccionesPorRevisor = new Map<string, string>();
+  const soloMenores: string[] = [];
   for (const [revisor, propias] of porRevisor) {
-    if (propias.length > 0) seccionesPorRevisor.set(revisor, seccionPendientes(informes.ronda, propias, []));
+    const menores = menoresPorRevisor.get(revisor) ?? 0;
+    if (propias.length > 0) seccionesPorRevisor.set(revisor, seccionPendientes(informes.ronda, propias, [], menores));
+    else if (menores > 0) soloMenores.push(revisor);
   }
   return {
     ronda: informes.ronda,
@@ -480,6 +510,7 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
     commit,
     seccion: seccionPendientes(informes.ronda, filas, sinTabla),
     seccionesPorRevisor,
+    soloMenores,
     sinMarcar,
     alcance: alcanceRondaSiguiente(textos.map((t) => t.texto)),
     fueAcotada,
@@ -597,13 +628,22 @@ function planDeVerificacion(
     if (!revisores.includes(r)) revisores.push(r);
   };
   for (const r of previa.seccionesPorRevisor.keys()) anadir(r === '' ? generico : r);
-  for (const g of clasificarPorDominio(delta, catalogo).grupos) {
-    if (g.revisor !== generico) anadir(g.revisor);
+  const tocados = new Set(clasificarPorDominio(delta, catalogo).grupos.map((g) => g.revisor));
+  for (const r of tocados) {
+    if (r !== generico) anadir(r);
+  }
+  // TASK-112: quien solo tenia MENORES vuelve si la correccion toca sus
+  // ficheros (tambien el generico: los suyos son los que no son de ningun dominio).
+  for (const r of previa.soloMenores.map((x) => (x === '' ? generico : x))) {
+    if (tocados.has(r)) anadir(r);
   }
   if (revisores.length === 0) anadir(generico);
   return { fragmentado: false, grupos: revisores.map((revisor) => ({ revisor, ficheros: delta })) };
 }
 
+/** TASK-112: seccion de tarea.md con los revisores que la ronda acotada no relanzo. */
+export const SECCION_NO_RELANZADOS = '## Revisores no relanzados';
+
 /** TASK-095: seccion de un revisor sin pendientes propios en la ronda acotada. */
 function seccionSinPendientes(ronda: number): string {
   return (
@@ -869,6 +909,13 @@ async function runReview(
   const plan = acotada
     ? planDeVerificacion(previa!, ficherosTocados, catalogoRevisores, generico)
     : clasificarPorDominio(ficherosTocados, catalogoRevisores);
+  // TASK-112: quien solo tenia MENORES pendientes y no ve tocado su dominio no
+  // vuelve en la ronda acotada; consta en tarea.md (mas abajo, con el commit).
+  const noRelanzados = acotada
+    ? previa!.soloMenores
+        .map((r) => (r === '' ? generico : r))
+        .filter((r) => !plan.grupos.some((g) => g.revisor === r))
+    : [];
   // Con sufijo si hay mas de un grupo o el unico no es el generico: las
   // metricas sacan el revisor del nombre del informe.
   const conSufijo = plan.fragmentado || plan.grupos.length > 1 || plan.grupos[0]?.revisor !== generico;
@@ -1056,7 +1103,15 @@ async function runReview(
   });
   avisos.push(...volcado.avisos);
   const conRegistro = registrarTransicion(volcado.body, 'review', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
-  const newFilePath = await moveTareaFile(tareasRoot, filePath, volcado.task, conRegistro);
+  let cuerpoFinal = conRegistro;
+  for (const r of noRelanzados) {
+    cuerpoFinal = anotarLineaEnSeccion(
+      cuerpoFinal,
+      SECCION_NO_RELANZADOS,
+      `- ronda ${String(ronda)}: ${r} - solo tenia hallazgos MENOR pendientes y la correccion no toca sus ficheros`
+    );
+  }
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, volcado.task, cuerpoFinal);
   const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
   const informes: RevisionGrupo[] = escrituras.map((escritura) => ({
     revisor: escritura.revisor,
@@ -1113,9 +1168,19 @@ function seccionDeVerificacion(r: VerificacionRonda, base: string, conCobertura:
       motivo: r.motivo,
       deMemo: r.v.deMemo,
       conCobertura,
+      commit: r.v.commit,
+      huella: r.v.huella,
     });
   }
-  return seccionVerificacionRevision({ tipo: 'selectiva', resultado: r.v.resultado, base, deMemo: r.v.deMemo, conCobertura });
+  return seccionVerificacionRevision({
+    tipo: 'selectiva',
+    resultado: r.v.resultado,
+    base,
+    deMemo: r.v.deMemo,
+    conCobertura,
+    commit: r.v.commit,
+    huella: r.v.huella,
+  });
 }
 
 /** Lo que verifico la ronda (para la seccion de la peticion y la cobertura). */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
index c975ba3..28f8589 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
@@ -133,6 +133,9 @@ export type VerificacionDeRonda =
       deMemo: boolean;
       /** true si el proyecto declara un informe de cobertura (que esta ronda no muestra). */
       conCobertura: boolean;
+      /** TASK-112: commit y huella de lo verificado, para que el revisor no repita la suite. */
+      commit?: string | null;
+      huella?: string | null;
     }
   | {
       tipo: 'documentacion';
@@ -141,9 +144,19 @@ export type VerificacionDeRonda =
       motivo: string;
       deMemo: boolean;
       conCobertura: boolean;
+      commit?: string | null;
+      huella?: string | null;
     }
   | { tipo: 'documentacion-sin-comando'; motivo: string; conCobertura: boolean };
 
+/**
+ * TASK-112: lo que se le dice al revisor cuando la ronda ya verifico en verde:
+ * no repetir la suite si el commit verificado es el revisado.
+ */
+export const NO_REPITAS =
+  '- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: ' +
+  'su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.';
+
 const NO_SUSTITUYE = 'No sustituye a la completa: el cierre la exige sobre el commit que se integra.';
 
 /**
@@ -188,6 +201,10 @@ export function seccionVerificacionRevision(v: VerificacionDeRonda): string {
     `- Resultado: ${describirResultado(r)}${v.deMemo ? ' (resultado guardado: el arbol no ha cambiado desde la ultima ejecucion)' : ''}`,
     `- Duracion: ${segundos(r.duracionMs)}`,
   ];
+  // TASK-112: con que commit y huella; si casa con el commit revisado, no se repite.
+  if (v.commit !== undefined && v.commit !== null) lineas.push(`- Commit verificado: ${v.commit}`);
+  if (v.huella !== undefined && v.huella !== null) lineas.push(`- Huella: ${v.huella}`);
+  if (v.commit !== undefined && v.commit !== null && r.estado === 'verde') lineas.push(NO_REPITAS);
   if (v.conCobertura) lineas.push(coberturaOculta);
   lineas.push('');
   if (texto === '') {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index a13868e..d7fd461 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -239,6 +239,10 @@ export interface VerificacionConMemo {
   deMemo: boolean;
   /** true si la propia verificacion cambio ficheros del arbol de trabajo. */
   cambioElArbol: boolean;
+  /** TASK-112: HEAD cuando se pidio (el commit que se verifico); null fuera de un repo. */
+  commit: string | null;
+  /** TASK-112: la huella con la que se busco y se guardo el resultado; null sin huella. */
+  huella: string | null;
 }
 
 /**
@@ -285,9 +289,10 @@ export function verificarConMemo(
   }
   const contexto = p.tipo === 'selectiva' ? contextoSelectiva(raiz, p.base as string) : undefined;
   const huella = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
+  const commit = git(['rev-parse', 'HEAD'], raiz)?.trim() || null;
   const guardado = huella === null ? null : leerMemo(raiz, huella, p.tipo);
   if (guardado !== null && (p.memoSoloVerde !== true || guardado.estado === 'verde')) {
-    return { resultado: guardado, deMemo: true, cambioElArbol: false };
+    return { resultado: guardado, deMemo: true, cambioElArbol: false, commit, huella };
   }
 
   const env =
@@ -300,5 +305,11 @@ export function verificarConMemo(
   });
   const despues = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
   if (despues !== null && (p.tipo === 'completa' || arbolLimpio(raiz))) guardarMemo(raiz, despues, resultado, p.tipo);
-  return { resultado, deMemo: false, cambioElArbol: huella !== null && despues !== null && huella !== despues };
+  return {
+    resultado,
+    deMemo: false,
+    cambioElArbol: huella !== null && despues !== null && huella !== despues,
+    commit,
+    huella,
+  };
 }
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-112/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-112/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-112/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-112/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-112/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-112/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-112/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 79 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-verificacion.js                           | 13 +++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     | 11 +++++++++--
 10 files changed, 90 insertions(+), 16 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts         | 30 +++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts     | 22 ++++++++++++----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts | 18 ++++++++++++++++++
 3 files changed, 57 insertions(+), 13 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 131.7 s
- Commit verificado: 96b3085e279665d8b519d63955b455d8d5f63bc8
- Huella: e12c4bb0eb3ae1b903f7691c98b9d5784a7e1588
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 142449 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6839ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6357ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0541ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (5.22ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (11.6609ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6844ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.4844ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (6.0618ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.6992ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.4882ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3313ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.499ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3335ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.455ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (41.3308ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.188ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.8923ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.5047ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3545ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2358ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.2409ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.289ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2595ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2234ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2138ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2224ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.16ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2334ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1771ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.2376ms)
✔ resolverAsignado: recorta los tres escalones (0.1783ms)
ℹ tests 878
ℹ suites 0
ℹ pass 878
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 121959.4994
[verificar-impacto] node --test termino con 0 en 122.1 s.
````
