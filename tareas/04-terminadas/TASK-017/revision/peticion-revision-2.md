# Peticion de revision — TASK-017 (ronda 2)

- Tarea: TASK-017 — Catalogo de skills determinista con seleccion en dos pasos
- Rama revisada: feature/task-017-catalogo-de-skills-determinista-con-sele
- Rama base: develop
- Commit revisado (HEAD): c284203dac697e2d7ec4d4c79e847b93e1a547c2
- Fecha: 2026-09-09
- Agente revisor sugerido: code-reviewer

## Nota sobre este fichero

Este fichero se genera ahora, a mano, para dejar en disco lo que
deberia haber quedado registrado antes: entre el cierre de la ronda 1
(commit `07dbf09`, informe en `informe-revision-1.md`) y este commit
hubo una segunda pasada de revision -- independiente, con un agente
distinto del que implemento -- que encontro los hallazgos que
`tarea.md` ya documenta (IMP-5, MEN-8, MEN-9, MEN-10, MEN-11) y que se
corrigieron en los commits de abajo. Esa pasada nunca escribio su
informe en `revision/informe-revision-2.md` como exige el flujo normal
de `taskctl review` -- el hallazgo se proceso y se corrigio, pero el
artefacto no se persistio. Esta ronda 2 formal se lanza ahora,
precisamente para no dejar esa afirmacion sin respaldo en disco:
reproduce TODO desde cero sobre el estado actual (que ya incluye esas
correcciones), sin dar por buena ninguna afirmacion de `tarea.md` ni de
los mensajes de commit.

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo (o
usa un worktree) a un directorio temporal, corre la suite tu mismo y
construye el caso que rompe el codigo antes de reportarlo. Clasifica
cada hallazgo como CRITICO (perdida de datos, corrupcion de estado, el
comando hace lo contrario de lo que dice), IMPORTANTE (comportamiento
incorrecto en un caso real, no de borde) o MENOR (todo lo demas). Un
"sin hallazgos" explicito tambien vale; inventar hallazgos, no. Vuelca
tu salida en el informe de esta ronda (informe-revision-2.md), sin
borrar la peticion.

Los cinco hallazgos de la pasada anterior que ya se aplicaron son:

- IMP-5: `comprobarSkillInstalado`/`interpretarResultadoPluginList`
  comparaban solo el marketplace, no el `id` completo -- corregido en
  `5e6a5ba`.
- MEN-11: el aviso de instalacion componia un comando `/plugin install`
  no ejecutable con el `id` de catalogo en vez del nombre real del
  plugin -- corregido junto con IMP-5 en `5e6a5ba`.
- MEN-8: se pidio un test de regresion para el orden
  `cargarCatalogoSkills()` antes de las escrituras del scaffold (el
  codigo ya era correcto desde la ronda 1) -- test anadido en
  `c284203`.
- MEN-10: una cifra incorrecta en `tarea.md` sobre el resultado de la
  suite tras la ronda 1 -- corregida solo en documentacion.
- MEN-9: aceptado sin corregir (ningun test distingue las dos
  redacciones del aviso segun `no-instalado` vs `no-verificable`);
  justificacion en `tarea.md`.

No des estos cinco por buenos solo porque esta peticion lo diga:
confirma tu mismo que el codigo actual hace lo que aqui se afirma, y
si algo no cuadra, dilo como hallazgo nuevo.

## Commits a revisar (git log 07dbf09..HEAD)

```
5923c9d fix(TASK-017): corrige hallazgos IMPORTANTE y 2 MENOR de la revision ronda 1
17b68da docs(TASK-017): marca criterios de aceptacion y documenta el Resultado
5e6a5ba fix(TASK-017): compara id completo de plugin, no solo el marketplace
c284203 test(TASK-017): fija MEN-8 como regresion, catalogo corrupto no deja workspace sucio
```

## Diff de codigo fuente y tests (git diff 07dbf09..HEAD -- src test scripts/catalogo-skills.yml)

```diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index bf986ee..1f9cd1f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -411,6 +411,20 @@ export async function runPlanCommand(
   const resolucion = resolverNumeroAgentes(task, body, heuristica);
   const roles = seleccionarRoles(resolucion.agentes);
 
+  // --- Seleccion determinista de skill (seccion 6.6/16.4.1, TASK-017) -
+  // Mismo criterio fail-closed que la heuristica de arriba, y por eso
+  // va aqui y no mas abajo (hallazgo IMPORTANTE de revision por pares,
+  // TASK-017): un catalogo mal formado tiene que abortar "plan" ANTES
+  // del mkdir/writeFile del scaffold, no despues -- si no, el aborto
+  // deja el workspace sucio (planificacion/ ya creada) y el guard de
+  // la seccion 8.3 bloquea el reintento con un mensaje que no explica
+  // la causa real. La diferencia con la heuristica es que aqui CERO
+  // candidatos tras cruzar etiquetas SI es un resultado valido
+  // (catalogo-skills.ts: el catalogo no es exhaustivo por diseno, a
+  // diferencia de la heuristica).
+  const catalogoSkills = cargarCatalogoSkills();
+  const seleccionSkill = seleccionarSkill(task, catalogoSkills);
+
   const secciones = extraerSecciones(body);
 
   // Puerta del objetivo vacio. "taskctl new" deja el Objetivo en blanco
@@ -529,22 +543,13 @@ export async function runPlanCommand(
     }
   }
 
-  // --- Seleccion determinista de skill (seccion 6.6/16.4.1, TASK-017) -
-  // Mismo criterio fail-closed que la heuristica de arriba: un catalogo
-  // mal formado aborta "plan" entero, nunca cae a "sin skill" en
-  // silencio. La diferencia es que aqui CERO candidatos tras cruzar
-  // etiquetas SI es un resultado valido (catalogo-skills.ts: el
-  // catalogo no es exhaustivo por diseno, a diferencia de la
-  // heuristica).
-  const catalogoSkills = cargarCatalogoSkills();
-  const seleccionSkill = seleccionarSkill(task, catalogoSkills);
-
   let skillsRecomendadosFinal: string[] = [];
   let reglaSeleccionSkillFinal: ReglaSeleccionSkill | null = null;
   let avisoSkillSinCandidato: string | null = null;
   let avisoSkillDesempatePendiente: string | null = null;
   let avisoSkillNoInstalada: string | null = null;
   let peticionDesempateSkillPath: string | null = null;
+  let hayDesempatePendiente = false;
 
   if (seleccionSkill.ganador !== null) {
     skillsRecomendadosFinal = [seleccionSkill.ganador.id];
@@ -580,26 +585,41 @@ export async function runPlanCommand(
       skillsRecomendadosFinal = [ganadorDesempate.id];
       reglaSeleccionSkillFinal = 'llm';
     } else {
-      avisoSkillDesempatePendiente =
-        `${seleccionSkill.candidatosEmpatados.length} skills empatan en solape y prioridad para ` +
-        `${task.id}: responde "${peticionDesempatePath}" en "${salidaDesempatePath}" y vuelve a ` +
-        'lanzar "taskctl plan" para dejarlo resuelto. Por ahora se deja sin "skills_recomendados".';
+      // El aviso final se construye mas abajo, sobre las rutas de
+      // DESTINO tras moveTareaFile: en la primera vuelta (la unica en
+      // la que se llega aqui con la tarea todavia en su carpeta de
+      // origen) planificacionDir ya no existira una vez movida la tarea.
+      hayDesempatePendiente = true;
     }
   }
 
   if (skillsRecomendadosFinal.length > 0) {
     const entradaGanadora = catalogoSkills.find((e) => e.id === skillsRecomendadosFinal[0])!;
     if (entradaGanadora.origen === 'externo') {
-      const estadoInstalacion = comprobarSkillInstalado(entradaGanadora.marketplace!);
+      // "skill_N_id" de una entrada externa es "plugin:skill" (seccion
+      // 6.6 del catalogo); el nombre del PLUGIN es el tramo antes de
+      // ":". Comparar solo el marketplace (hallazgo IMP-5, revision por
+      // pares ronda 2) reportaba 'instalado' un plugin inexistente si
+      // CUALQUIER OTRO plugin del mismo marketplace si lo estaba -- el
+      // id completo "plugin@marketplace" es la unica comprobacion que
+      // no esconde un candidato real que falta.
+      const nombrePlugin = entradaGanadora.id.split(':')[0]!;
+      const pluginId = `${nombrePlugin}@${entradaGanadora.marketplace}`;
+      const estadoInstalacion = comprobarSkillInstalado(pluginId);
       if (estadoInstalacion !== 'instalado') {
-        // Texto identico al de la seccion 6.6 (punto 4): nunca se
-        // instala nada automaticamente, solo se anota la orden a
-        // ejecutar a mano. 'no-verificable' avisa igual que
-        // 'no-instalado' -- el riesgo aceptado es peor si se calla.
+        // 'no-verificable' avisa igual que 'no-instalado' -- el riesgo
+        // aceptado es peor si se calla -- pero con una redaccion propia
+        // (hallazgo MENOR de revision por pares, TASK-017): decir "no
+        // esta instalado" cuando lo unico que sabemos es que no se pudo
+        // comprobar afirma algo que el subproceso no confirmo.
+        const diagnostico =
+          estadoInstalacion === 'no-verificable'
+            ? 'no se ha podido comprobar si esta instalado'
+            : 'no esta instalado';
         avisoSkillNoInstalada =
           `Esta tarea se beneficiaria del skill "${entradaGanadora.id}" (marketplace ` +
-          `"${entradaGanadora.marketplace}") -- no esta instalado. Instalalo con "/plugin install ` +
-          `${entradaGanadora.id}@${entradaGanadora.marketplace}" antes de arrancar, o continua sin el.`;
+          `"${entradaGanadora.marketplace}") -- ${diagnostico}. Instalalo con "/plugin install ` +
+          `${pluginId}" antes de arrancar, o continua sin el.`;
       }
     }
   }
@@ -901,6 +921,24 @@ export async function runPlanCommand(
     BRAINSTORM_DIRNAME
   );
 
+  // Mismo problema y misma solucion que brainstormDirFinal: las rutas
+  // del desempate de skill se escribieron contra la carpeta de origen,
+  // que el rename de arriba se acaba de llevar. Se recalculan aqui,
+  // contra la de destino, antes de construir el aviso o devolver la
+  // ruta de la peticion.
+  if (peticionDesempateSkillPath !== null) {
+    const planificacionDirFinal = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME);
+    const peticionDesempatePathFinal = path.join(planificacionDirFinal, PETICION_DESEMPATE_SKILL_FILENAME);
+    peticionDesempateSkillPath = peticionDesempatePathFinal;
+    if (hayDesempatePendiente) {
+      const salidaDesempatePathFinal = path.join(planificacionDirFinal, SALIDA_DESEMPATE_SKILL_FILENAME);
+      avisoSkillDesempatePendiente =
+        `${seleccionSkill.candidatosEmpatados.length} skills empatan en solape y prioridad para ` +
+        `${task.id}: responde "${peticionDesempatePathFinal}" en "${salidaDesempatePathFinal}" y vuelve a ` +
+        'lanzar "taskctl plan" para dejarlo resuelto. Por ahora se deja sin "skills_recomendados".';
+    }
+  }
+
   return {
     autoCommit: commitResult,
     id: task.id,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
index de1a73f..81f7b2b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
@@ -33,6 +33,8 @@ import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
 import type { ReglaSeleccionSkill, Task } from './task.js';
 
+const MAX_TOTAL_SKILLS = 1000;
+
 export class CatalogoSkillsError extends Error {
   constructor(message: string) {
     super(message);
@@ -149,6 +151,19 @@ export function parsearCatalogoSkills(contenido: string, ruta: string): Catalogo
     'total_skills',
     primerTotal.valor
   );
+  // Cota superior aparte del "no negativo" de arriba (hallazgo MENOR de
+  // revision por pares, TASK-017): construirClavesValidas() materializa
+  // un Set de totalSkills*8 claves, y sin tope un valor disparatado
+  // (p. ej. un cero de mas por error de tecleo) cuelga el comando varios
+  // segundos y revienta con un RangeError crudo que cli.ts no reconoce
+  // como error de catalogo. MAX_TOTAL_SKILLS es generoso a proposito:
+  // ningun catalogo real se acerca ni de lejos.
+  if (totalSkills > MAX_TOTAL_SKILLS) {
+    throw new CatalogoSkillsError(
+      `[ERROR] ${ruta}:${primerTotal.numeroLinea}: "total_skills" es ${totalSkills}, y el maximo ` +
+        `admitido es ${MAX_TOTAL_SKILLS}. Revisa que el numero no tenga cifras de mas.`
+    );
+  }
 
   const clavesValidas = construirClavesValidas(totalSkills);
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts
index 4741690..8af478e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts
@@ -70,16 +70,28 @@ export function salidaDesempateSkillTemplate(task: Task): string {
 
 /**
  * Ganador declarado en la salida ya escrita, o null si esta vacia o si
- * su primera linea no coincide EXACTAMENTE con el `id` de uno de los
- * candidatos vigentes (respuesta a medio escribir, catalogo editado
- * entre la peticion y la respuesta, etc.). Fail-closed: una salida que
- * no se puede interpretar sin ambiguedad no elige un candidato al azar.
+ * su primera linea de contenido no coincide EXACTAMENTE con el `id` de
+ * uno de los candidatos vigentes (respuesta a medio escribir, catalogo
+ * editado entre la peticion y la respuesta, etc.). Fail-closed: una
+ * salida que no se puede interpretar sin ambiguedad no elige un
+ * candidato al azar.
+ *
+ * Se saltan tanto las lineas en blanco como las que empiezan por "#":
+ * salidaDesempateSkillTemplate() genera un encabezado Markdown como
+ * primera linea, y responder debajo de el (dejandolo intacto, igual
+ * que se hace con los `salida-brainstorm-*.md`) es la forma obvia de
+ * completar el scaffold. Sin este salto, esa respuesta se descartaba
+ * en silencio porque la "primera linea no vacia" seguia siendo el
+ * encabezado (hallazgo IMPORTANTE de revision por pares, TASK-017).
  */
 export function leerGanadorDesempate(
   contenido: string,
   candidatos: readonly EntradaCatalogoSkill[]
 ): EntradaCatalogoSkill | null {
-  const primeraLinea = contenido.split(/\r?\n/).find((l) => l.trim() !== '')?.trim() ?? '';
-  if (primeraLinea === '') return null;
+  const primeraLinea = contenido
+    .split(/\r?\n/)
+    .map((l) => l.trim())
+    .find((l) => l !== '' && !l.startsWith('#'));
+  if (primeraLinea === undefined) return null;
   return candidatos.find((c) => c.id === primeraLinea) ?? null;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
index dd79ef7..37b4f88 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
@@ -20,11 +20,23 @@
  * instalar algo que ya esta) o esconder un candidato real que falta
  * ('instalado' erroneo por defecto).
  *
- * El formato exacto de "claude plugin list --json" quedo sin verificar
- * a mano en la seccion 6.6 de la metodologia ("a confirmar en Sprint
- * 0"): se asume un array de objetos con un campo `marketplace`, y
- * cualquier forma que no encaje con eso tambien cae en
- * 'no-verificable' en vez de asumirse como 'no-instalado'.
+ * Formato real de "claude plugin list --json" (verificado en revision
+ * por pares de TASK-017 contra el binario real): un array de objetos
+ * con `id` de la forma "plugin@marketplace" (entre otras claves como
+ * `version`, `scope`, `enabled`). No hay campo `marketplace` suelto.
+ * Un elemento del array que no sea un objeto con `id` de tipo string
+ * no es reconocible; si NINGUN elemento de un array no vacio es
+ * reconocible, el formato no encaja con lo esperado y el resultado
+ * colapsa a 'no-verificable' en vez de asumirse 'no-instalado'.
+ *
+ * IMPORTANTE (hallazgo IMP-5, revision por pares ronda 2): la
+ * comprobacion es por `id` COMPLETO ("plugin@marketplace"), nunca solo
+ * por el tramo del marketplace. Comparar solo el marketplace confunde
+ * "hay algun plugin instalado de este marketplace" con "esta instalado
+ * ESTE plugin", y reporta como 'instalado' un plugin que no existe si
+ * cualquier otro del mismo marketplace si esta instalado -- justo el
+ * "candidato real que falta" escondido que este modulo existe para
+ * evitar.
  */
 import { spawnSync } from 'node:child_process';
 
@@ -44,10 +56,13 @@ interface ResultadoPluginList {
  * inesperada, encontrado/no encontrado) con datos literales, sin lanzar
  * un subproceso real — mismo motivo por el que parsearCatalogoSkills
  * vive aparte de cargarCatalogoSkills en catalogo-skills.ts.
+ *
+ * `pluginId` es el identificador COMPLETO esperado, con la forma
+ * "plugin@marketplace" (ver hallazgo IMP-5 en el docblock del fichero).
  */
 export function interpretarResultadoPluginList(
   result: ResultadoPluginList,
-  marketplace: string
+  pluginId: string
 ): EstadoInstalacionSkill {
   if (result.error || result.status !== 0 || typeof result.stdout !== 'string') {
     return 'no-verificable';
@@ -62,17 +77,23 @@ export function interpretarResultadoPluginList(
   if (!Array.isArray(lista)) {
     return 'no-verificable';
   }
+  if (lista.length === 0) {
+    return 'no-instalado';
+  }
 
-  const instalado = lista.some(
-    (entrada) =>
-      typeof entrada === 'object' &&
-      entrada !== null &&
-      (entrada as { marketplace?: unknown }).marketplace === marketplace
+  const reconocibles = lista.filter(
+    (entrada): entrada is { id: string } =>
+      typeof entrada === 'object' && entrada !== null && typeof (entrada as { id?: unknown }).id === 'string'
   );
+  if (reconocibles.length === 0) {
+    return 'no-verificable';
+  }
+
+  const instalado = reconocibles.some((entrada) => entrada.id === pluginId);
   return instalado ? 'instalado' : 'no-instalado';
 }
 
-export function comprobarSkillInstalado(marketplace: string): EstadoInstalacionSkill {
+export function comprobarSkillInstalado(pluginId: string): EstadoInstalacionSkill {
   const result = spawnSync('claude', ['plugin', 'list', '--json'], {
     encoding: 'utf8',
     timeout: TIMEOUT_MS,
@@ -83,6 +104,6 @@ export function comprobarSkillInstalado(marketplace: string): EstadoInstalacionS
       status: result.status,
       stdout: typeof result.stdout === 'string' ? result.stdout : null,
     },
-    marketplace
+    pluginId
   );
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 2609b34..64ff625 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -24,6 +24,7 @@ import {
 } from '../../src/core/plan-desempate-skill.js';
 import { StateMachineError } from '../../src/core/state-machine.js';
 import { BaseBranchGuardError } from '../../src/fs/git.js';
+import { CatalogoSkillsError } from '../../src/core/catalogo-skills.js';
 import type { Task } from '../../src/core/task.js';
 
 const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
@@ -723,15 +724,18 @@ test('taskctl plan: un empate en solape y prioridad escribe la peticion de desem
     assert.match(result.avisoSkillDesempatePendiente!, /2 skills empatan/);
     assert.ok(result.peticionDesempateSkill !== null);
 
-    // result.peticionDesempateSkill se calcula sobre la carpeta de ORIGEN
-    // antes del rename, y no se reescribe tras el move -- esa ruta ya no
-    // existe en disco. moveTareaFile se lleva planificacion/ entera a la
-    // carpeta de DESTINO, que hay que reconstruir a partir de filePath.
+    // result.peticionDesempateSkill se recalcula sobre la carpeta de
+    // DESTINO tras moveTareaFile (hallazgo IMPORTANTE de revision por
+    // pares, TASK-017, IMP-2): antes apuntaba a la carpeta de origen,
+    // que el rename ya se habia llevado.
     const planificacionDestino = path.join(path.dirname(result.filePath), PLANIFICACION_DIRNAME);
-    const peticionContent = await readFile(
-      path.join(planificacionDestino, PETICION_DESEMPATE_SKILL_FILENAME),
-      'utf8'
+    assert.equal(
+      result.peticionDesempateSkill,
+      path.join(planificacionDestino, PETICION_DESEMPATE_SKILL_FILENAME)
     );
+    assert.match(result.avisoSkillDesempatePendiente!, new RegExp(planificacionDestino.replace(/\\/g, '\\\\')));
+
+    const peticionContent = await readFile(result.peticionDesempateSkill!, 'utf8');
     assert.match(peticionContent, /angular-vue-reviewer/);
     assert.match(peticionContent, /java-spring-reviewer/);
 
@@ -804,3 +808,48 @@ test('taskctl plan: un skill externo ganador que no esta instalado deja el aviso
     await rm(pluginRootTmp, { recursive: true, force: true });
   }
 });
+
+test('taskctl plan: MEN-8 (revision por pares ronda 2) -- un catalogo de skills mal formado aborta ANTES de crear planificacion/, deja el workspace limpio', async () => {
+  // cargarCatalogoSkills() se llama antes del mkdir/writeFile del
+  // scaffold a proposito (ver el comentario en plan.ts junto a la
+  // llamada): un catalogo corrupto tiene que abortar "plan" sin dejar
+  // planificacion/ a medio crear, porque el guard de la seccion 8.3
+  // bloquearia el reintento con un mensaje que no explica la causa
+  // real. Este test fija ese orden como regresion.
+  const pluginRootTmp = await mkdtemp(path.join(tmpdir(), 'taskctl-plan-plugin-root-'));
+  const previoPluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+  try {
+    const scriptsDir = path.join(pluginRootTmp, 'scripts');
+    await mkdir(scriptsDir, { recursive: true });
+    const heuristicaReal = await readFile(RUTA_HEURISTICA_REAL, 'utf8');
+    await writeFile(path.join(scriptsDir, 'heuristica-complejidad.yml'), heuristicaReal, 'utf8');
+    // Catalogo mal formado: le falta "total_skills". Cualquier fallo
+    // de parseo vale para este test -- lo que se fija es el orden,
+    // no la exhaustividad de la validacion (eso ya lo cubre
+    // catalogo-skills.test.ts).
+    await writeFile(path.join(scriptsDir, 'catalogo-skills.yml'), 'skill_1_id: x\n', 'utf8');
+    process.env['CLAUDE_PLUGIN_ROOT'] = pluginRootTmp;
+
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(tareasRoot, sampleTask({}), BODY_CON_OBJETIVO);
+      commitAll(repoRoot, 'tarea TASK-700 para el test de catalogo corrupto');
+
+      await assert.rejects(
+        () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot }),
+        CatalogoSkillsError
+      );
+
+      // La tarea NO se movio de 00-planificadas.
+      await assert.doesNotReject(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));
+      await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700')));
+      // Y planificacion/ no se llego a crear en ningun sitio.
+      await assert.rejects(
+        () => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700', PLANIFICACION_DIRNAME))
+      );
+    });
+  } finally {
+    if (previoPluginRoot === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
+    else process.env['CLAUDE_PLUGIN_ROOT'] = previoPluginRoot;
+    await rm(pluginRootTmp, { recursive: true, force: true });
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
index b983669..44113cd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
@@ -173,6 +173,13 @@ test('total_skills negativo aborta', () => {
   );
 });
 
+test('total_skills por encima del maximo admitido aborta con mensaje accionable, no un RangeError crudo', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('total_skills', '1001'), RUTA_YML),
+    errorCatalogo(/"total_skills" es 1001, y el maximo admitido es 1000.*cifras de mas/)
+  );
+});
+
 test('clave desconocida aborta y sugiere la clave real por distancia de edicion', () => {
   assert.throws(
     () => parsearCatalogoSkills(conLineaExtra('skill_1_orgen: taskcode-plugin'), RUTA_YML),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
index 5e2a10b..c9af049 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
@@ -155,3 +155,25 @@ test('leerGanadorDesempate devuelve null ante una coincidencia parcial (no es ig
 test('leerGanadorDesempate devuelve null si la lista de candidatos vigentes esta vacia', () => {
   assert.equal(leerGanadorDesempate('a\n', []), null);
 });
+
+test('leerGanadorDesempate salta el encabezado Markdown del scaffold y lee el id de la linea siguiente con contenido', () => {
+  const ganador = leerGanadorDesempate('# Salida del desempate de skill — TASK-042\n\nb\n', CANDIDATOS);
+  assert.equal(ganador?.id, 'b');
+});
+
+test('leerGanadorDesempate deja el scaffold intacto pero responde debajo, con texto adicional despues del id', () => {
+  const salida = salidaDesempateSkillTemplate(tarea({ id: 'TASK-042' })).replace(
+    '(pendiente de completar)',
+    'java-spring-reviewer\n\nPorque el nucleo es backend.'
+  );
+  const candidatos = [
+    ...CANDIDATOS,
+    entradaSkill({ id: 'java-spring-reviewer', prioridad: 10, rol: 'revisor', etiquetas: ['java'] }),
+  ];
+  const ganador = leerGanadorDesempate(salida, candidatos);
+  assert.equal(ganador?.id, 'java-spring-reviewer');
+});
+
+test('leerGanadorDesempate sigue devolviendo null si tras el encabezado solo hay mas encabezados', () => {
+  assert.equal(leerGanadorDesempate('# titulo\n## subtitulo\n', CANDIDATOS), null);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts
index a3555bd..04d666a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts
@@ -9,6 +9,17 @@
  * NUNCA a 'no-instalado' (que arriesgaria sugerir instalar algo que ya
  * esta) ni a 'instalado' (que esconderia un candidato real que falta).
  *
+ * El formato de las entradas (`id` de la forma "plugin@marketplace")
+ * es el verificado contra el binario real en la revision por pares de
+ * TASK-017, ronda 1 (hallazgo IMPORTANTE IMP-1): el formato asumido en
+ * la primera version -- un campo `marketplace` suelto -- no existe.
+ *
+ * La comparacion es por `pluginId` COMPLETO ("plugin@marketplace"), no
+ * solo por el tramo del marketplace (hallazgo IMPORTANTE IMP-5,
+ * revision por pares ronda 2): comparar solo el marketplace reportaba
+ * 'instalado' un plugin inexistente si cualquier OTRO plugin del mismo
+ * marketplace si estaba instalado.
+ *
  * `comprobarSkillInstalado` solo se prueba con un test de integracion
  * minimo: en esta maquina de test no sabemos si "claude" esta instalado
  * ni que devuelve, asi que lo unico que se puede afirmar sin suponer
@@ -24,11 +35,12 @@ import {
 } from '../../src/core/plugin-instalado.js';
 
 const MARKETPLACE = 'mi-marketplace';
+const PLUGIN_ID = `figma@${MARKETPLACE}`;
 
 test('binario ausente (result.error presente) es no-verificable', () => {
   const estado = interpretarResultadoPluginList(
     { error: new Error('spawnSync claude ENOENT'), status: null, stdout: null },
-    MARKETPLACE
+    PLUGIN_ID
   );
   assert.equal(estado, 'no-verificable');
 });
@@ -36,7 +48,7 @@ test('status distinto de 0 es no-verificable', () => {
 test('status distinto de 0 es no-verificable', () => {
   const estado = interpretarResultadoPluginList(
     { error: undefined, status: 1, stdout: '[]' },
-    MARKETPLACE
+    PLUGIN_ID
   );
   assert.equal(estado, 'no-verificable');
 });
@@ -44,7 +56,7 @@ test('status null (p. ej. timeout) es no-verificable', () => {
 test('status null (p. ej. timeout) es no-verificable', () => {
   const estado = interpretarResultadoPluginList(
     { error: undefined, status: null, stdout: '[]' },
-    MARKETPLACE
+    PLUGIN_ID
   );
   assert.equal(estado, 'no-verificable');
 });
@@ -52,7 +64,7 @@ test('stdout ausente (no es string) es no-verificable', () => {
 test('stdout ausente (no es string) es no-verificable', () => {
   const estado = interpretarResultadoPluginList(
     { error: undefined, status: 0, stdout: null },
-    MARKETPLACE
+    PLUGIN_ID
   );
   assert.equal(estado, 'no-verificable');
 });
@@ -60,7 +72,7 @@ test('stdout con JSON mal formado es no-verificable', () => {
 test('stdout con JSON mal formado es no-verificable', () => {
   const estado = interpretarResultadoPluginList(
     { error: undefined, status: 0, stdout: '{ esto no es json valido' },
-    MARKETPLACE
+    PLUGIN_ID
   );
   assert.equal(estado, 'no-verificable');
 });
@@ -68,7 +80,7 @@ test('stdout con una forma que no es un array es no-verificable', () => {
 test('stdout con una forma que no es un array es no-verificable', () => {
   const estado = interpretarResultadoPluginList(
     { error: undefined, status: 0, stdout: JSON.stringify({ plugins: [] }) },
-    MARKETPLACE
+    PLUGIN_ID
   );
   assert.equal(estado, 'no-verificable');
 });
@@ -76,45 +88,92 @@ test('stdout con una forma que no es un array es no-verificable', () => {
 test('array vacio es no-instalado', () => {
   const estado = interpretarResultadoPluginList(
     { error: undefined, status: 0, stdout: '[]' },
-    MARKETPLACE
+    PLUGIN_ID
   );
   assert.equal(estado, 'no-instalado');
 });
 
-test('array con entradas de otros marketplaces es no-instalado', () => {
+test('array no vacio donde NINGUN elemento tiene la forma esperada (objeto con "id" string) es no-verificable', () => {
+  for (const stdout of [
+    JSON.stringify([1, 2, 3]),
+    JSON.stringify(['texto-suelto']),
+    JSON.stringify([null, null]),
+    JSON.stringify([{ marketplace: MARKETPLACE }]),
+    JSON.stringify([[{ id: PLUGIN_ID }]]),
+  ]) {
+    const estado = interpretarResultadoPluginList({ error: undefined, status: 0, stdout }, PLUGIN_ID);
+    assert.equal(estado, 'no-verificable', `stdout=${stdout}`);
+  }
+});
+
+test('array con "id" que no coincide con el pluginId buscado es no-instalado', () => {
   const estado = interpretarResultadoPluginList(
-    { error: undefined, status: 0, stdout: JSON.stringify([{ marketplace: 'otro-marketplace' }]) },
-    MARKETPLACE
+    { error: undefined, status: 0, stdout: JSON.stringify([{ id: 'figma@otro-marketplace' }]) },
+    PLUGIN_ID
   );
   assert.equal(estado, 'no-instalado');
 });
 
-test('array con el marketplace buscado es instalado', () => {
+test('IMP-5: otro plugin del mismo marketplace instalado, pero no el buscado, es no-instalado', () => {
   const estado = interpretarResultadoPluginList(
-    { error: undefined, status: 0, stdout: JSON.stringify([{ marketplace: 'otro' }, { marketplace: MARKETPLACE }]) },
-    MARKETPLACE
+    {
+      error: undefined,
+      status: 0,
+      stdout: JSON.stringify([{ id: `otro-plugin@${MARKETPLACE}` }]),
+    },
+    PLUGIN_ID
+  );
+  assert.equal(estado, 'no-instalado');
+});
+
+test('array con "id" que coincide exactamente con el pluginId buscado es instalado', () => {
+  const estado = interpretarResultadoPluginList(
+    {
+      error: undefined,
+      status: 0,
+      stdout: JSON.stringify([{ id: `otro@${MARKETPLACE}` }, { id: PLUGIN_ID }]),
+    },
+    PLUGIN_ID
   );
   assert.equal(estado, 'instalado');
 });
 
-test('entradas del array con forma inesperada (no objeto) se ignoran sin lanzar, y no cuentan como instalado', () => {
+test('formato real de "claude plugin list --json" (id, version, scope, enabled, installPath) se interpreta bien', () => {
   const estado = interpretarResultadoPluginList(
-    { error: undefined, status: 0, stdout: JSON.stringify(['texto-suelto', null, 42]) },
-    MARKETPLACE
+    {
+      error: undefined,
+      status: 0,
+      stdout: JSON.stringify([
+        {
+          id: PLUGIN_ID,
+          version: '2.2.90',
+          scope: 'user',
+          enabled: true,
+          installPath: 'C:\\cache\\figma\\2.2.90',
+          installedAt: '2026-01-01T00:00:00.000Z',
+          lastUpdated: '2026-01-01T00:00:00.000Z',
+        },
+      ]),
+    },
+    PLUGIN_ID
   );
-  assert.equal(estado, 'no-instalado');
+  assert.equal(estado, 'instalado');
 });
 
-test('una entrada sin campo marketplace se ignora sin lanzar', () => {
+test('entradas sin "id" (o con "id" no string) se ignoran sin lanzar cuando OTRAS si son reconocibles', () => {
   const estado = interpretarResultadoPluginList(
-    { error: undefined, status: 0, stdout: JSON.stringify([{ nombre: 'algun-plugin' }]) },
-    MARKETPLACE
+    {
+      error: undefined,
+      status: 0,
+      stdout: JSON.stringify([{ nombre: 'algun-plugin' }, { id: 42 }, { id: PLUGIN_ID }]),
+    },
+    PLUGIN_ID
   );
-  assert.equal(estado, 'no-instalado');
+  assert.equal(estado, 'instalado');
 });
 
 test('comprobarSkillInstalado nunca lanza y siempre devuelve un estado valido', () => {
   const ESTADOS_VALIDOS: readonly EstadoInstalacionSkill[] = ['instalado', 'no-instalado', 'no-verificable'];
-  const estado = comprobarSkillInstalado('marketplace-inventado-para-el-test');
+  const estado = comprobarSkillInstalado('plugin-inventado@marketplace-inventado-para-el-test');
   assert.ok(ESTADOS_VALIDOS.includes(estado), `estado inesperado: ${String(estado)}`);
 });
```
