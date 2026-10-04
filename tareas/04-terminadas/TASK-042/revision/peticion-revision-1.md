# Peticion de revision — TASK-042 (ronda 1)

- Tarea: TASK-042 — F4-T4 Complejidad por defecto por heuristica y un rol sin unificador
- Rama revisada: feature/task-042-f4-t4-complejidad-por-defecto-por-heuris
- Rama base: develop
- Commit revisado (HEAD): 65c088b96046f16dcd7a85d6d425bf0e6d590dbc
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-042 (criterios de aceptacion y plan)

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
65c088b docs(TASK-042): resultado
b31e41b feat(TASK-042): complejidad no declarada decide la heuristica; con 1 rol no hay unificador
43b3a05 chore(TASK-042): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/contexto/HALLAZGOS.md b/docs/contexto/HALLAZGOS.md
index b5eb4f5..52ee9d1 100644
--- a/docs/contexto/HALLAZGOS.md
+++ b/docs/contexto/HALLAZGOS.md
@@ -867,3 +867,23 @@ suben (`--push` es explícito), o alguna otra interacción. Antes de asumir una
 causa, reproducirlo deliberadamente: lanzar un agente con `isolation:
 "worktree"` sobre una rama de tarea sin publicar y comprobar en qué commit
 aparece.
+
+**Actualizacion (2026-10-04, TASK-042):** el worktree volvio a aparecer en un
+commit anterior a la tarea, y ademas el sandbox le rechazo **todo** comando
+`git` (el hook `rtk` reescribe `git` a `rtk git` y el sandbox no puede probar
+que opera sobre el worktree). Un agente en worktree no puede ni hacer
+checkout ni commitear. Para trabajo de implementacion en paralelo: agente sin
+worktree, en el arbol compartido, con ficheros repartidos y sin `git`; el
+orquestador commitea.
+
+## `EPERM` en `start` con el shell dentro de la carpeta de la tarea (TASK-042)
+
+`taskctl start` fallo con `EPERM ... rename tareas/01-en-diseno/TASK-042`
+incluso con los reintentos de TASK-053. La causa: el directorio de trabajo del
+propio shell del orquestador estaba **dentro** de esa carpeta
+(`.../planificacion`, tras editar el plan), y Windows no deja renombrar un
+directorio que es el cwd de un proceso vivo. No es transitorio: los
+reintentos no lo arreglan. Salir de la carpeta y reintentar funciono; el
+fallo no dejo nada a medias (rama creada, arbol limpio, tarea sin mover).
+Regla: antes de un comando que mueve la tarea de estado, `cd` a la raiz del
+repo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
index 42752ce..4b2df9d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
@@ -16,6 +16,9 @@ Un agente unificador leerá tu salida junto a las otras tres. **No promedia:
 señala los desacuerdos.** Por eso tu valor está en tener una posición
 defendible y decirla, no en cubrir todo el terreno.
 
+Con un solo rol no hay unificador: si la petición dice que eres el único, tu salida
+es el plan final, y en él tienes que decir también lo que tu rol no cubre.
+
 ## Qué miras
 
 - **Dónde vive el cambio**: qué módulos toca, cuáles no debería tocar, y qué
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
index 6859951..24e6b65 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
@@ -18,6 +18,9 @@ Un agente unificador leerá tu salida junto a las otras tres. **No promedia:
 señala los desacuerdos.** Los tuyos son los más fáciles de perder, porque los
 otros tres comparten vocabulario y tú no.
 
+Con un solo rol no hay unificador: si la petición dice que eres el único, tu salida
+es el plan final, y en él tienes que decir también lo que tu rol no cubre.
+
 ## Qué miras
 
 - **Las reglas que el código no puede deducir**: qué es válido y qué no en
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
index 8b64269..c9bbdfb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
@@ -17,6 +17,9 @@ Un agente unificador leerá tu salida junto a las otras tres. **No promedia:
 señala los desacuerdos.** Tu aportación se pierde si la escribes en el tono de
 las otras; un riesgo redactado como matiz se lee como matiz.
 
+Con un solo rol no hay unificador: si la petición dice que eres el único, tu salida
+es el plan final, y en él tienes que decir también lo que tu rol no cubre.
+
 ## Qué miras
 
 - **Bordes de la entrada**: vacío, cero, uno, muchos, duplicado, ausente, del
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
index da4f82e..d014b25 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
@@ -16,6 +16,9 @@ riesgos y dominio. Tú respondes a dos preguntas, en este orden:
 Un agente unificador leerá tu salida junto a las otras tres. **No promedia:
 señala los desacuerdos.**
 
+Con un solo rol no hay unificador: si la petición dice que eres el único, tu salida
+es el plan final, y en él tienes que decir también lo que tu rol no cubre.
+
 ## Qué miras
 
 - **Observabilidad del cambio**: qué se puede afirmar desde fuera. Si el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 5907e78..ee8663a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -68,8 +68,8 @@ Precondiciones de cada transicion:
   `planificacion/plan-final.md` — **el contenido lo escribe un agente**, no el
   CLI — y, en `planificacion/brainstorm/`, una peticion por cada rol de
   brainstorm que resuelva la complejidad de la tarea, mas la del agente
-  unificador (ver "El brainstorm de la fase de diseno"). **No invoca a ningun
-  modelo**: lanzar a esos agentes es trabajo de quien orquesta. Aborta sin
+  unificador (con 1 solo rol no hay unificador: ver "El brainstorm de la fase
+  de diseno"). **No invoca a ningun modelo**: lanzar a esos agentes es trabajo de quien orquesta. Aborta sin
   mover la tarea si el enunciado no esta listo (ver mas abajo).
 - **`approve`** — desde `en-diseno`, y tiene que existir un `plan-final.md`
   redactado: la plantilla sin rellenar se rechaza.
@@ -112,7 +112,7 @@ taskctl finish  TASK-NNN
 taskctl diagnose | pause [--push] | resume [<rama>] | recover [<rama>] | abort-merge
 ```
 
-Defaults: `--sprint 0`, `--complejidad media`, `--etiquetas` vacio. En
+Defaults: `--sprint 0`, sin complejidad (`null`), `--etiquetas` vacio. En
 `import`, `--tipo` es opcional (`feature`); en `new` es **obligatorio**.
 
 Detalles que muerden:
@@ -338,15 +338,14 @@ escribe lo que alguien tiene que disparar despues.
 tabla por complejidad que trae el plugin, y cuales, por un orden de prioridad
 fijo: **arquitectura, riesgos, testing, dominio**. Con un solo rol entra
 arquitectura, que es el unico que propone una forma para el cambio; el primero
-que se cae es dominio. Pueden salir **cero roles**: entonces no hay brainstorm
-y el plan se redacta directamente a partir del enunciado.
+que se cae es dominio. Pueden salir **cero roles**: no hay brainstorm y el plan
+se redacta a partir del enunciado.
 
-El numero es el **mayor** entre lo que pide la complejidad declarada en
-`tarea.md` y lo que pide la que la tabla calcula leyendo la tarea. Cuando esos
-dos niveles difieren, el comando lo dice: no es un error, es la eleccion
-conservadora.
+Sin complejidad declarada (`null`) decide la tabla, que calcula leyendo la
+tarea; declarada, se toma el **mayor** de las dos. Si difieren, el comando lo
+dice: no es un error, es la eleccion conservadora.
 
-**Lo que deja escrito**, en `planificacion/brainstorm/`:
+**Lo que deja escrito**, en `planificacion/brainstorm/` (con 1 rol, solo `peticion-plan-<ronda>.md`):
 
 | Fichero | Que es |
 |---|---|
@@ -358,7 +357,9 @@ conservadora.
 paralelo; volcar cada respuesta en su `salida-...`; y solo entonces lanzar al
 unificador, que es quien escribe `plan-final.md`. Los desacuerdos entre roles
 se senalan en el plan, no se promedian: dos roles que dicen lo contrario son
-informacion, y la media la tira.
+informacion, y la media la tira. **Con 1 solo rol no hay unificador ni
+`salida-...`**: se lanza ese agente con `peticion-plan-<ronda>.md` y escribe el
+`plan-final.md`.
 
 **`plan` valida el enunciado antes de mover nada** (con o sin roles). Bloquea:
 `## Objetivo` vacio, ningun criterio, un criterio vacio, **mas de 12
@@ -370,10 +371,9 @@ los criterios sin marcar.
 
 **Una re-planificacion no relanza el brainstorm.** La segunda vuelta
 (`en-diseno` con `plan_aprobado: false`) escribe solo otra
-`peticion-unificador-<ronda>.md`, que reprocesa las salidas de la ronda
-anterior mas el feedback. El feedback sobre un plan es una correccion
-incremental; tratarlo como un reinicio vuelve a gastar todos los agentes, y no
-se nota porque cada vuelta parece barata.
+`peticion-unificador-<ronda>.md` (con 1 rol, `peticion-plan-<ronda>.md`), que
+reprocesa las salidas de la ronda anterior mas el feedback. Es una correccion
+incremental: tratarla como un reinicio gasta de nuevo todos los agentes.
 
 ## La revision por pares
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 1a11185..7456f2c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -209,7 +209,17 @@ function brainstormNotice(result: PlanCommandResult): string {
   // en una re-planificacion el CLI decia "sin brainstorm, redacta el
   // plan a mano" mientras acababa de escribir una peticion correcta que
   // nombraba las salidas reales. El artefacto bueno quedaba invisible.
-  if (result.brainstormReutilizado) {
+  if (result.modo === 'redaccion') {
+    // TASK-042 (decision C4): con 1 rol no hay unificador ni salida de
+    // rol. Una sola peticion, al propio rol, que escribe plan-final.md.
+    // Va antes que las demas ramas: con 1 rol ninguna otra aplica.
+    const rol = result.roles[0];
+    lineas.push(
+      `${result.ronda > 1 ? `Re-planificacion (ronda ${result.ronda}): ` : ''}1 rol, sin unificador. ` +
+        `Lanza el agente ${rol === undefined ? 'del rol' : `"${rol.id}"`} con ` +
+        `${result.peticionRedaccion}: el rol escribe plan-final.md directamente.`
+    );
+  } else if (result.brainstormReutilizado) {
     lineas.push(
       `Re-planificacion (ronda ${result.ronda}): NO se relanza el brainstorm, que es el de la ` +
         `ronda ${result.rondaRoles}. Lanza solo el unificador con ${result.peticionUnificador}, ` +
@@ -217,7 +227,7 @@ function brainstormNotice(result: PlanCommandResult): string {
     );
   } else if (result.roles.length === 0) {
     lineas.push(
-      `Sin brainstorm (complejidad "${result.resolucion.nivelDeclarado}" resuelve 0 roles). ` +
+      `Sin brainstorm (complejidad "${result.resolucion.nivelDeclarado ?? result.resolucion.nivelHeuristico}" resuelve 0 roles). ` +
         `Redacta el plan y aprueba con "taskctl approve ${result.id}".`
     );
   } else {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
index 3300d4d..19caa07 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
@@ -53,13 +53,17 @@ export interface ImportOptions {
   filePath: string;
   tipo: TaskType;
   sprint: number;
-  complejidad: TaskComplexity;
+  complejidad: TaskComplexity | null;
   modeloSugerido: string;
   agenteRevisor: string;
 }
 
 const DEFAULT_SPRINT = 0;
-const DEFAULT_COMPLEJIDAD: TaskComplexity = 'media';
+/**
+ * Sin --complejidad la tarea nace sin declararla (null): la decide la
+ * heuristica al planificar (TASK-042, decision C4). Antes era `media`.
+ */
+const DEFAULT_COMPLEJIDAD: TaskComplexity | null = null;
 const DEFAULT_MODELO = 'sonnet';
 
 /**
@@ -100,7 +104,7 @@ export function parseImportArgs(
     tipo = tipoRaw as TaskType;
   }
 
-  let complejidad: TaskComplexity = DEFAULT_COMPLEJIDAD;
+  let complejidad: TaskComplexity | null = DEFAULT_COMPLEJIDAD;
   const complejidadRaw = flags['complejidad'];
   if (complejidadRaw !== undefined) {
     if (
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index cafc669..ede194b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -39,13 +39,17 @@ export interface NewTaskOptions {
   tipo: TaskType;
   sprint: number;
   etiquetas: string[];
-  complejidad: TaskComplexity;
+  complejidad: TaskComplexity | null;
   modeloSugerido: string;
   agenteRevisor: string;
 }
 
 const DEFAULT_SPRINT = 0;
-const DEFAULT_COMPLEJIDAD: TaskComplexity = 'media';
+/**
+ * Sin --complejidad la tarea nace sin declararla (null): la decide la
+ * heuristica al planificar (TASK-042, decision C4). Antes era `media`.
+ */
+const DEFAULT_COMPLEJIDAD: TaskComplexity | null = null;
 const DEFAULT_MODELO = 'sonnet';
 export const DEFAULT_BODY = '## Objetivo\n\n\n## Criterios de aceptacion\n- [ ] \n';
 
@@ -178,7 +182,7 @@ export function parseNewTaskArgs(
     );
   }
 
-  let complejidad: TaskComplexity = DEFAULT_COMPLEJIDAD;
+  let complejidad: TaskComplexity | null = DEFAULT_COMPLEJIDAD;
   const complejidadRaw = flags['complejidad'];
   if (complejidadRaw !== undefined) {
     if (
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index fe57584..0fb8d42 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -57,6 +57,8 @@ import {
   nombrePeticionRol,
   nombreSalidaRol,
   nombrePeticionUnificador,
+  nombrePeticionRedaccion,
+  peticionRedaccionTemplate,
   peticionRolTemplate,
   salidaRolTemplate,
   peticionUnificadorTemplate,
@@ -103,7 +105,10 @@ export const BRAINSTORM_DIRNAME = 'brainstorm';
  * llamado `brainstorm-datos-externos`, y la numeracion se rompia en
  * silencio.
  */
-const RONDA_UNIFICADOR_RE = /^peticion-unificador-(\d+)\.md$/;
+// TASK-042 (decision C4): el testigo de ronda es la peticion del unificador
+// (2 o mas roles, o carpetas antiguas) o la de redaccion (1 rol, sin
+// unificador). Las dos se escriben las ultimas y cierran la ronda.
+const RONDA_UNIFICADOR_RE = /^peticion-(unificador|plan)-(\d+)\.md$/;
 const PETICION_ROL_RE = /^peticion-brainstorm-[a-z0-9-]+-(\d+)\.md$/;
 
 /**
@@ -225,9 +230,9 @@ export function planTemplate(task: Task, roles: readonly RolBrainstorm[]): strin
     seccionRoles = '';
   } else if (roles.length === 1) {
     origen =
-      `(Lo consolida el agente unificador a partir de un solo rol de brainstorm:\n` +
-      `${roles[0]!.titulo}. Con uno no hay desacuerdos que resolver, asi que lo que\n` +
-      'aporta el unificador es senalar lo que ese rol no cubrio.)\n';
+      `(Lo redacta directamente el agente del unico rol de brainstorm: ${roles[0]!.titulo}.\n` +
+      'Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,\n' +
+      'el plan senala lo que ese rol no cubrio.)\n';
     seccionRoles = '## Lo que el rol no cubrio\n\n\n';
   } else {
     origen =
@@ -282,8 +287,15 @@ export interface PlanCommandResult {
    * (CRITICO de la ronda 5).
    */
   peticionesRol: string[];
-  /** Ruta de la peticion del unificador de esta ronda. */
-  peticionUnificador: string;
+  /**
+   * TASK-042 (decision C4): 'redaccion' con exactamente 1 rol (sin
+   * unificador: el rol escribe plan-final.md); 'unificador' en el resto.
+   */
+  modo: 'unificador' | 'redaccion';
+  /** Ruta de la peticion del unificador de esta ronda; null en modo 'redaccion'. */
+  peticionUnificador: string | null;
+  /** Ruta de `peticion-plan-<ronda>.md`; null en modo 'unificador'. */
+  peticionRedaccion: string | null;
   /**
    * true si esta invocacion NO regenero las peticiones de rol porque
    * ya habia una ronda previa (16.3: un bucle de "pide cambios" es una
@@ -716,7 +728,7 @@ export async function runPlanCommand(
   const enBrainstorm = await listarDir(brainstormDir);
 
   const rondasConAlgo = (re: RegExp): number[] =>
-    [...new Set(enBrainstorm.map((f) => re.exec(f)).filter((m) => m !== null).map((m) => Number(m![1])))]
+    [...new Set(enBrainstorm.map((f) => re.exec(f)).filter((m) => m !== null).map((m) => Number(m![m!.length - 1])))]
       .sort((a, b) => b - a);
 
   // (a) Ronda a escribir. El testigo (la peticion del unificador) se
@@ -726,7 +738,8 @@ export async function runPlanCommand(
   const ultimoTestigo = rondasConAlgo(RONDA_UNIFICADOR_RE)[0] ?? 0;
   const testigoEntero =
     ultimoTestigo > 0 &&
-    (await ficheroConContenido(path.join(brainstormDir, nombrePeticionUnificador(ultimoTestigo))));
+    ((await ficheroConContenido(path.join(brainstormDir, nombrePeticionUnificador(ultimoTestigo)))) ||
+      (await ficheroConContenido(path.join(brainstormDir, nombrePeticionRedaccion(ultimoTestigo)))));
   const ronda = testigoEntero ? ultimoTestigo + 1 : Math.max(ultimoTestigo, 1);
 
   // (b) ¿Estan ya lanzados los roles DE HOY? Se busca la ronda mas alta
@@ -759,7 +772,21 @@ export async function runPlanCommand(
   } else {
     rondaRoles = rondasConAlgo(PETICION_ROL_RE)[0] ?? null;
   }
-  const relanzarRoles = rondaRoles === null && roles.length > 0;
+
+  // Modo de la ronda (TASK-042, decision C4). Con exactamente 1 rol no hay
+  // unificador: se escribe solo la peticion de redaccion, salvo que la
+  // ronda reutilizable ya tenga 2 o mas salidas en disco (se bajo de 2
+  // roles a 1): esas salidas son trabajo real y alguien las consolida.
+  const contarSalidasDe = (n: number): number =>
+    enBrainstorm.filter((f) => f.startsWith('salida-brainstorm-') && f.endsWith(`-${n}.md`)).length;
+  const modo: 'unificador' | 'redaccion' =
+    roles.length === 1 && (rondaRoles === null || contarSalidasDe(rondaRoles) < 2)
+      ? 'redaccion'
+      : 'unificador';
+  // En redaccion no se lanza ni se consolida ninguna ronda de rol: el
+  // unico rol recibe la peticion de redaccion y escribe el plan.
+  if (modo === 'redaccion') rondaRoles = null;
+  const relanzarRoles = modo === 'unificador' && rondaRoles === null && roles.length > 0;
   if (relanzarRoles) rondaRoles = ronda;
 
   /**
@@ -832,7 +859,9 @@ export async function runPlanCommand(
   // disco. No es lo mismo que `roles`: si hoy hay menos que entonces,
   // los de entonces siguen contando — su trabajo existe.
   const rolesDeLaRonda =
-    rondaRoles === null
+    modo === 'redaccion'
+      ? roles
+      : rondaRoles === null
       ? []
       : ROLES_BRAINSTORM.filter((r) =>
           [...enBrainstorm, ...(relanzarRoles ? roles.map((x) => nombrePeticionRol(x, ronda)) : [])]
@@ -894,21 +923,37 @@ export async function runPlanCommand(
   // motivos reales: es defensa en profundidad si alguna vez la ronda no
   // avanza, y es lo coherente con su naturaleza (derivada, sin trabajo
   // de nadie dentro).
-  await regenerar(
-    nombrePeticionUnificador(ronda),
-    peticionUnificadorTemplate(
-      updated,
-      secciones.objetivo,
-      secciones.criterios,
-      rolesDeLaRonda,
-      salidasAConsolidar,
-      ronda,
-      rondaRoles,
-      today,
-      resolucion,
-      path.posix.join('..', PLAN_FINAL_FILENAME)
-    )
-  );
+  if (modo === 'redaccion') {
+    await regenerar(
+      nombrePeticionRedaccion(ronda),
+      peticionRedaccionTemplate(
+        updated,
+        secciones.objetivo,
+        secciones.criterios,
+        roles[0]!,
+        ronda,
+        today,
+        resolucion,
+        path.posix.join('..', PLAN_FINAL_FILENAME)
+      )
+    );
+  } else {
+    await regenerar(
+      nombrePeticionUnificador(ronda),
+      peticionUnificadorTemplate(
+        updated,
+        secciones.objetivo,
+        secciones.criterios,
+        rolesDeLaRonda,
+        salidasAConsolidar,
+        ronda,
+        rondaRoles,
+        today,
+        resolucion,
+        path.posix.join('..', PLAN_FINAL_FILENAME)
+      )
+    );
+  }
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
   const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
 
@@ -971,7 +1016,11 @@ export async function runPlanCommand(
         : rolesDeLaRonda.map((rol) =>
             path.join(brainstormDirFinal, nombrePeticionRol(rol, rondaRoles))
           ),
-    peticionUnificador: path.join(brainstormDirFinal, nombrePeticionUnificador(ronda)),
+    modo,
+    peticionUnificador:
+      modo === 'unificador' ? path.join(brainstormDirFinal, nombrePeticionUnificador(ronda)) : null,
+    peticionRedaccion:
+      modo === 'redaccion' ? path.join(brainstormDirFinal, nombrePeticionRedaccion(ronda)) : null,
     brainstormReutilizado,
     asignadoA: asignadoFinal,
     asignadoCambiado,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
index ef066d8..7f21c97 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
@@ -138,7 +138,8 @@ export interface Senal {
 export interface ResolucionAgentes {
   /** El numero FINAL de roles a lanzar. */
   agentes: number;
-  nivelDeclarado: TaskComplexity;
+  /** null si la tarea no declara complejidad: entonces decide solo la heuristica. */
+  nivelDeclarado: TaskComplexity | null;
   nivelHeuristico: TaskComplexity;
   puntos: number;
   senales: Senal[];
@@ -707,11 +708,13 @@ export function resolverNumeroAgentes(task: Task, body: string, h: Heuristica):
   const nivelDeclarado = task.complejidad;
   const nivelH = nivelHeuristico(puntos, h);
 
-  const agentes = Math.max(
-    agentesBrainstorm(nivelDeclarado, task.tipo, h),
-    agentesBrainstorm(nivelH, task.tipo, h)
-  );
-  const sinTope = Math.max(agentesPorNivel(nivelDeclarado, h), agentesPorNivel(nivelH, h));
+  // TASK-042 (decision C4): sin complejidad declarada decide SOLO la
+  // heuristica. Antes `new` escribia `media` por defecto y ese valor
+  // ganaba el maximo casi siempre: 2 roles + unificador para tareas que la
+  // heuristica veia simples.
+  const niveles = nivelDeclarado === null ? [nivelH] : [nivelDeclarado, nivelH];
+  const agentes = Math.max(...niveles.map((n) => agentesBrainstorm(n, task.tipo, h)));
+  const sinTope = Math.max(...niveles.map((n) => agentesPorNivel(n, h)));
 
   return {
     agentes,
@@ -719,7 +722,7 @@ export function resolverNumeroAgentes(task: Task, body: string, h: Heuristica):
     nivelHeuristico: nivelH,
     puntos,
     senales,
-    hayDiscrepancia: nivelDeclarado !== nivelH,
+    hayDiscrepancia: nivelDeclarado !== null && nivelDeclarado !== nivelH,
     topeHotfixAplicado: agentes < sinTope,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
index 55ac4de..91dd712 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
@@ -50,11 +50,20 @@ export function nombrePeticionUnificador(ronda: number): string {
   return `peticion-unificador-${ronda}.md`;
 }
 
-/** Cabecera comun a las tres plantillas: quien es la tarea y en que ronda va. */
+/**
+ * `peticion-plan-<ronda>.md` — TASK-042 (decision C4). Con UN solo rol no
+ * hay unificador: esta peticion va al propio rol, que redacta
+ * `plan-final.md`. Hace tambien de testigo de ronda (ver plan.ts).
+ */
+export function nombrePeticionRedaccion(ronda: number): string {
+  return `peticion-plan-${ronda}.md`;
+}
+
+/** Cabecera comun a las plantillas: quien es la tarea y en que ronda va. */
 function cabecera(task: Task, ronda: number, fecha: string): string {
   return (
     `- Tarea: ${task.id} — ${task.titulo}\n` +
-    `- Tipo: ${task.tipo} · Complejidad declarada: ${task.complejidad}\n` +
+    `- Tipo: ${task.tipo} · Complejidad declarada: ${task.complejidad ?? 'no declarada (decide la heuristica)'}\n` +
     `- Ronda: ${ronda}\n` +
     `- Fecha: ${fecha}\n`
   );
@@ -98,7 +107,7 @@ function bloqueComplejidad(resolucion: ResolucionAgentes): string {
     : `Los dos niveles coinciden. Se lanzan ${plural(resolucion.agentes)}.`;
   return (
     '## Complejidad: declarada frente a heuristica\n\n' +
-    `- Declarada en la tarea: **${resolucion.nivelDeclarado}**\n` +
+    `- Declarada en la tarea: **${resolucion.nivelDeclarado ?? 'no declarada (decide la heuristica)'}**\n` +
     `- Heuristica (${resolucion.puntos} puntos): **${resolucion.nivelHeuristico}**\n` +
     '- Senales encontradas:\n' +
     senales +
@@ -155,6 +164,72 @@ export function peticionRolTemplate(
   );
 }
 
+/**
+ * La peticion de redaccion (TASK-042, decision C4): el modo de UN solo
+ * rol, sin unificador. Reutiliza las piezas de las otras plantillas
+ * (cabecera, bloque de complejidad, enunciado, "Que tiene que traer el
+ * plan final") y del rol toma su pregunta y sus limites. Quien la recibe
+ * es el autor del plan: no hay salida de rol intermedia ni nadie que
+ * consolide, asi que escribe el plan final directamente.
+ *
+ * En la ronda 2 o siguientes lleva el bloque de re-planificacion: relanzar
+ * al autor del plan ES la correccion incremental.
+ */
+export function peticionRedaccionTemplate(
+  task: Task,
+  objetivo: string,
+  criterios: readonly string[],
+  rol: RolBrainstorm,
+  ronda: number,
+  fecha: string,
+  resolucion: ResolucionAgentes,
+  planFinalRelativo: string
+): string {
+  const bloqueReplanificacion =
+    ronda === 1
+      ? ''
+      : '## Esto es una re-planificacion, no un primer pase\n\n' +
+        `Ya existe un plan redactado en \`${planFinalRelativo}\` y una persona ha pedido ` +
+        'cambios sobre el. **Leelo antes que nada.** Tu trabajo es incorporar el feedback de la ' +
+        'persona al plan que ya hay, no reescribirlo entero — y menos volver a redactar desde el ' +
+        'enunciado como si fuera la primera vez.\n\n' +
+        'Si el feedback dice que el enfoque entero esta mal, eso NO se arregla aqui: dilo en el ' +
+        'plan y que alguien decida si se replantea.\n\n';
+  return (
+    `# Peticion de redaccion del plan — ${task.id} (ronda ${ronda})\n\n` +
+    cabecera(task, ronda, fecha) +
+    `- Rol: \`${rol.id}\` — lanzalo con el agente de ese mismo nombre\n` +
+    `- Vuelca el plan en: \`${planFinalRelativo}\`\n\n` +
+    '**Esta tarea se planifica con un solo rol y no hay unificador**: tu escribes ' +
+    '`plan-final.md` directamente, sin salida intermedia que nadie vaya a consolidar.\n\n' +
+    bloqueReplanificacion +
+    '## Tu pregunta\n\n' +
+    `> ${rol.pregunta}\n\n` +
+    '## Que miras\n\n' +
+    rol.mira.map((m) => `- ${m}\n`).join('') +
+    '\n## Que NO miras\n\n' +
+    'Que lo mires solo tu no te autoriza a cubrirlo todo: lo que queda fuera de tu pregunta ' +
+    'no se mira, pero se DICE. Anota en el plan lo que no cubres, para que quien lo apruebe ' +
+    'sepa que ese lado no se ha revisado:\n\n' +
+    rol.noMira.map((m) => `- ${m}\n`).join('') +
+    '\n' +
+    bloqueComplejidad(resolucion) +
+    '\n## Que tiene que traer el plan final\n\n' +
+    '- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.\n' +
+    '- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.\n' +
+    '- Riesgos aceptados y que los contiene.\n' +
+    '- Plan de pruebas.\n' +
+    '- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es ' +
+    'obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.\n\n' +
+    '## Reglas\n\n' +
+    '- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ' +
+    'ficheros del repo: tu salida es el plan.\n' +
+    '- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo ' +
+    'has mirado. Di de donde lo sacas.\n\n' +
+    enunciado(objetivo, criterios)
+  );
+}
+
 export function salidaRolTemplate(task: Task, rol: RolBrainstorm, ronda: number): string {
   return (
     `# Brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
index a70d344..b3cba44 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
@@ -200,7 +200,8 @@ export function assertTransitionAllowed(
           `esta en estado "${task.estado}", no en "en-diseno". taskctl start requiere haber ejecutado taskctl plan primero.`
         );
       }
-      const exigeAprobacion = !TRIVIAL_SIN_APROBACION.includes(task.complejidad);
+      const exigeAprobacion =
+        task.complejidad === null || !TRIVIAL_SIN_APROBACION.includes(task.complejidad);
       if (exigeAprobacion && !task.plan_aprobado) {
         throw err(
           task.id,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
index 1148a1a..142c2e8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
@@ -58,7 +58,11 @@ export interface Task {
   tipo: TaskType;
   sprint: number;
   etiquetas: string[];
-  complejidad: TaskComplexity;
+  /**
+   * null = no declarada (TASK-042, decision C4): decide la heuristica.
+   * `new` e `import` la dejan asi cuando no se pasa --complejidad.
+   */
+  complejidad: TaskComplexity | null;
   modelo_sugerido: string;
   estado: TaskState;
   plan_aprobado: boolean;
@@ -239,7 +243,7 @@ export function validateTask(data: Record<string, unknown>): Task {
     tipo: requireEnum(data, 'tipo', TASK_TYPES),
     sprint: requireNumber(data, 'sprint'),
     etiquetas: requireStringArray(data, 'etiquetas'),
-    complejidad: requireEnum(data, 'complejidad', TASK_COMPLEXITIES),
+    complejidad: requireNullableEnum(data, 'complejidad', TASK_COMPLEXITIES),
     modelo_sugerido: requireString(data, 'modelo_sugerido'),
     estado: requireEnum(data, 'estado', TASK_STATES),
     plan_aprobado: requireBoolean(data, 'plan_aprobado'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index 1ac74b7..920159f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -359,3 +359,26 @@ test('main: "taskctl review" con un diff de 2 dominios imprime una linea de peti
     assert.equal(lineasLanza.length, 2, stdout);
   });
 });
+
+// TASK-042 (decision C4): con 1 rol el CLI no habla de unificador. Dice que
+// se lance ese agente con la peticion de redaccion y que el escribe el plan.
+// Mutacion que lo pone rojo: volver a anunciar "y luego el unificador" con 1 rol.
+test('main: taskctl plan con 1 rol anuncia la peticion de redaccion y que no hay unificador', async () => {
+  await withTempRepoCwd(async (repoRoot) => {
+    const creada = await captureOutput(() =>
+      main(['new', '--titulo', 'Un solo rol', '--tipo', 'feature', '--complejidad', 'simple'])
+    );
+    assert.equal(creada.code, 0);
+    await rellenarObjetivo(repoRoot, 'TASK-001');
+    commitAll(repoRoot, 'tarea nueva');
+
+    const { code, stdout } = await captureOutput(() => main(['plan', 'TASK-001']));
+
+    assert.equal(code, 0);
+    assert.ok(stdout.includes('1 rol, sin unificador'), stdout);
+    assert.ok(stdout.includes('peticion-plan-1.md'), stdout);
+    assert.ok(stdout.includes('escribe plan-final.md'), stdout);
+    assert.ok(!stdout.includes('luego el unificador'), stdout);
+    assert.ok(!stdout.includes('peticion-unificador'), stdout);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
index 38bf96d..b8f8aa2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
@@ -155,8 +155,10 @@ test('taskctl plan: commitea el movimiento a 01-en-diseno y el scaffold del plan
     // quedara fuera, la tarea viajaria de carpeta sin sus peticiones y
     // el arbol quedaria sucio (que es lo que comprueba la linea de
     // abajo, pero esta lo dice explicitamente).
-    assert.match(registrados, /peticion-brainstorm-arquitectura-1\.md/);
-    assert.match(registrados, /peticion-unificador-1\.md/);
+    // TASK-042 (decision C4): la tarea es `simple`, 1 rol, asi que la unica
+    // peticion es la de redaccion; ni peticion de rol ni unificador.
+    assert.match(registrados, /peticion-plan-1\.md/);
+    assert.doesNotMatch(registrados, /peticion-unificador-1\.md/);
     // Ni rastro de la carpeta vieja: el movimiento entro entero.
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
   });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
index b8ebfcc..be34371 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
@@ -15,7 +15,7 @@ test('parseImportArgs: ruta obligatoria, defaults razonables', () => {
   assert.equal(a.filePath, 'docs/sprint-1.md');
   assert.equal(a.tipo, 'feature');
   assert.equal(a.sprint, 0);
-  assert.equal(a.complejidad, 'media');
+  assert.equal(a.complejidad, null, 'TASK-042: sin --complejidad decide la heuristica');
 });
 
 test('parseImportArgs: falla sin ruta', () => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new.test.ts
index 3f9ed38..61e2646 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new.test.ts
@@ -18,7 +18,7 @@ test('parseNewTaskArgs: titulo por --titulo o posicional, defaults razonables',
   assert.equal(a.titulo, 'Mi tarea');
   assert.equal(a.tipo, 'feature');
   assert.equal(a.sprint, 0);
-  assert.equal(a.complejidad, 'media');
+  assert.equal(a.complejidad, null, 'TASK-042: sin --complejidad decide la heuristica');
   assert.deepEqual(a.etiquetas, []);
 
   const b = parseNewTaskArgs(['Otra tarea', '--tipo', 'fix']);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index 32fabd3..3dd2dd9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -148,7 +148,7 @@ const REPARTO: ReadonlyArray<{ complejidad: TaskComplexity; roles: number }> = [
 ];
 
 for (const { complejidad, roles } of REPARTO) {
-  test(`plan: complejidad "${complejidad}" escribe exactamente ${roles} peticion(es) de rol y una del unificador`, async () => {
+  test(`plan: complejidad "${complejidad}" escribe exactamente ${roles} peticion(es) de rol y una del unificador (con 1 rol, solo la de redaccion)`, async () => {
     await withTempRepo(async (repoRoot, tareasRoot) => {
       await writeTareaFile(tareasRoot, sampleTask({ complejidad }), BODY);
       commitAll(repoRoot, 'tarea TASK-800');
@@ -161,16 +161,120 @@ for (const { complejidad, roles } of REPARTO) {
       assert.equal(result.ronda, 1);
       assert.equal(result.brainstormReutilizado, false);
 
-      const esperados = ROLES_BRAINSTORM.slice(0, roles)
-        .flatMap((r) => [`peticion-${r.id}-1.md`, `salida-${r.id}-1.md`])
-        .concat(['peticion-unificador-1.md'])
-        .sort();
+      // TASK-042 (decision C4): con exactamente 1 rol no hay unificador ni
+      // peticion/salida de rol: se escribe solo `peticion-plan-1.md`, que
+      // el propio rol atiende escribiendo plan-final.md. Con 0 o con 2 o
+      // mas roles el reparto es el de siempre.
+      const esperados = (
+        roles === 1
+          ? ['peticion-plan-1.md']
+          : ROLES_BRAINSTORM.slice(0, roles)
+              .flatMap((r) => [`peticion-${r.id}-1.md`, `salida-${r.id}-1.md`])
+              .concat(['peticion-unificador-1.md'])
+      ).sort();
       const enDisco = (await readdir(brainstormDir(result.filePath))).sort();
       assert.deepEqual(enDisco, esperados);
     });
   });
 }
 
+// ─── TASK-042 (decision C4): un solo rol, sin unificador ───────────────
+
+/**
+ * Mutaciones que lo ponen rojo: volver a escribir `peticion-unificador`
+ * (o la peticion/salida del rol) con 1 rol; que la peticion de redaccion
+ * no se llame `peticion-plan-<ronda>.md`.
+ */
+test('plan (TASK-042): con 1 rol se escribe exactamente peticion-plan-1.md, sin unificador ni salida', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.modo, 'redaccion');
+    assert.equal(result.peticionUnificador, null);
+    assert.equal(path.basename(result.peticionRedaccion!), 'peticion-plan-1.md');
+    assert.deepEqual(await readdir(brainstormDir(result.filePath)), ['peticion-plan-1.md']);
+
+    const peticion = await readFile(result.peticionRedaccion!, 'utf8');
+    assert.match(peticion, /sin unificador|no hay unificador/);
+    assert.match(peticion, /\.\.\/plan-final\.md/);
+    assert.match(peticion, new RegExp(ROLES_BRAINSTORM[0]!.id));
+    assert.match(peticion, /Que NO miras/);
+    assert.doesNotMatch(peticion, /re-planificacion/);
+  });
+});
+
+/**
+ * Mutacion que lo pone rojo: que la ronda 2 con 1 rol vuelva a escribir
+ * el unificador, o que la peticion de redaccion ignore el bloque de
+ * re-planificacion.
+ */
+test('plan (TASK-042): la ronda 2 con 1 rol escribe peticion-plan-2.md con re-planificacion', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
+    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(segunda.ronda, 2);
+    assert.equal(segunda.modo, 'redaccion');
+    assert.equal(segunda.brainstormReutilizado, false);
+    assert.deepEqual((await readdir(brainstormDir(segunda.filePath))).sort(), [
+      'peticion-plan-1.md',
+      'peticion-plan-2.md',
+    ]);
+    const peticion = await readFile(segunda.peticionRedaccion!, 'utf8');
+    assert.match(peticion, /re-planificacion, no un primer pase/);
+    assert.match(peticion, /Ya existe un plan redactado/);
+  });
+});
+
+/**
+ * Una carpeta anterior a TASK-042 (con `peticion-unificador-N` como
+ * testigo y la peticion y salida del unico rol) sigue contando como
+ * ronda: la siguiente es la N+1 y NO se pisa nada de lo que hay.
+ *
+ * Mutacion que lo pone rojo: dejar `RONDA_UNIFICADOR_RE` sin la rama
+ * `unificador`, o sin la rama `plan`.
+ */
+test('plan (TASK-042): una carpeta antigua con peticion-unificador-N sigue contando como ronda', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
+    const dir = path.join(
+      tareasRoot,
+      '00-planificadas',
+      'TASK-800',
+      PLANIFICACION_DIRNAME,
+      BRAINSTORM_DIRNAME
+    );
+    await mkdir(dir, { recursive: true });
+    await writeFile(path.join(dir, 'peticion-unificador-1.md'), '# testigo antiguo\n', 'utf8');
+    await writeFile(path.join(dir, 'peticion-brainstorm-arquitectura-1.md'), '# rol\n', 'utf8');
+    await writeFile(path.join(dir, 'salida-brainstorm-arquitectura-1.md'), '# salida real\n', 'utf8');
+    commitAll(repoRoot, 'tarea TASK-800 con carpeta antigua');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.ronda, 2);
+    assert.equal(result.modo, 'redaccion');
+    assert.deepEqual((await readdir(brainstormDir(result.filePath))).sort(), [
+      'peticion-brainstorm-arquitectura-1.md',
+      'peticion-plan-2.md',
+      'peticion-unificador-1.md',
+      'salida-brainstorm-arquitectura-1.md',
+    ]);
+  });
+});
+
 /**
  * EL EFECTO REAL DEL `max`, medido en el smoke test y fijado aqui para
  * que no se olvide: una tarea declarada `trivial` NO se queda en 0
@@ -389,12 +493,17 @@ test('plan: con un solo rol el unificador NO recibe instrucciones sobre desacuer
     });
     assert.equal(result.roles.length, 1, 'precondicion: simple lanza un solo rol');
 
-    const peticion = await readFile(result.peticionUnificador, 'utf8');
+    // TASK-042 (decision C4): con 1 rol ya no hay peticion del unificador;
+    // la instruccion equivalente vive en la peticion de redaccion, que no
+    // pide desacuerdos ni trata la unanimidad como alarma.
+    assert.equal(result.peticionUnificador, null);
+    const peticion = await readFile(result.peticionRedaccion!, 'utf8');
     assert.match(peticion, /un solo rol/);
     assert.doesNotMatch(peticion, /Donde dos roles discrepen/);
     assert.doesNotMatch(peticion, /eso es la alarma/);
+    assert.doesNotMatch(peticion, /Desacuerdos entre roles/);
     // Lo que SI tiene que pedirle, que es lo unico util con un rol.
-    assert.match(peticion, /QUE QUEDO SIN CUBRIR/);
+    assert.match(peticion, /Lo que el rol no cubrio/);
 
     // Y el scaffold del plan no reserva sitio para desacuerdos.
     const plan = await readFile(result.planPath, 'utf8');
@@ -418,7 +527,7 @@ test('plan: el unificador tiene prohibido promediar y obligado a senalar desacue
       repoCwd: repoRoot,
     });
 
-    const peticion = await readFile(result.peticionUnificador, 'utf8');
+    const peticion = await readFile(result.peticionUnificador!, 'utf8');
     assert.match(peticion, /No promedies/);
     assert.match(peticion, /discrepen/);
     // Y el caso invertido, que es el que de verdad se olvida: la
@@ -449,7 +558,7 @@ test('plan: la peticion del unificador trae la complejidad declarada Y la heuris
     // El max manda: 3 roles por lo declarado, no 0-1 por la heuristica.
     assert.equal(result.roles.length, 3);
 
-    const peticion = await readFile(result.peticionUnificador, 'utf8');
+    const peticion = await readFile(result.peticionUnificador!, 'utf8');
     assert.match(peticion, /Declarada en la tarea: \*\*alta\*\*/);
     assert.match(peticion, new RegExp(`Heuristica \\(${result.resolucion.puntos} puntos\\)`));
     assert.match(peticion, /Los dos niveles NO coinciden/);
@@ -713,7 +822,11 @@ test('plan: la ronda sale del mayor numero presente, no de cuantos ficheros hay'
 
     assert.equal(result.ronda, 5);
     const enDisco = await readdir(brainstormDir(result.filePath));
-    assert.ok(enDisco.includes('peticion-unificador-5.md'));
+    // TASK-042 (decision C4): `simple` = 1 rol, asi que la ronda 5 se
+    // escribe como peticion de redaccion, no del unificador. El testigo
+    // antiguo (peticion-unificador-4) sigue contando como ronda.
+    assert.ok(enDisco.includes('peticion-plan-5.md'));
+    assert.ok(!enDisco.includes('peticion-unificador-5.md'));
     assert.ok(enDisco.includes('peticion-unificador-4.md'), 'se piso la ronda 4');
   });
 });
@@ -855,7 +968,7 @@ test('plan: si suben los roles, se relanza el brainstorm y el unificador no se q
     }
 
     // Y la peticion del unificador describe TRES roles, no uno.
-    const peticion = await readFile(segunda.peticionUnificador, 'utf8');
+    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
     assert.doesNotMatch(peticion, /se planifico con un solo rol/);
     assert.match(peticion, /No promedies/);
   });
@@ -903,7 +1016,7 @@ test('plan: bajar los roles sin llegar a cero no oculta las salidas que existen'
     // Pero los roles de la ronda reutilizada siguen siendo tres.
     assert.equal(segunda.roles.length, 3);
 
-    const peticion = await readFile(segunda.peticionUnificador, 'utf8');
+    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
     // Las TRES salidas reales se nombran, no solo la del rol que queda.
     for (const rol of ROLES_BRAINSTORM.slice(0, 3)) {
       assert.ok(
@@ -992,7 +1105,7 @@ test('plan: una salida huerfana de una ronda alta no secuestra la lista del unif
       repoCwd: repoRoot,
     });
 
-    const peticion = await readFile(segunda.peticionUnificador, 'utf8');
+    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
     const nombrados = [...peticion.matchAll(/`(salida-[a-z0-9-]+-\d+\.md)`/g)].map((m) => m[1]!);
     assert.equal(nombrados.length, 2);
     const enDisco = await readdir(dir);
@@ -1049,7 +1162,7 @@ test('plan: un scaffold de salida borrado se recrea aunque el brainstorm se reut
       '# respuesta real que no se puede pisar\n'
     );
     // El unificador nombra las dos, y sigue tratandolo como dos roles.
-    const peticion = await readFile(segunda.peticionUnificador, 'utf8');
+    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
     assert.ok(peticion.includes(nombreSalidaRolTest(rolA.id, 1)));
     assert.ok(peticion.includes(nombreSalidaRolTest(rolB.id, 1)));
     assert.doesNotMatch(
@@ -1186,7 +1299,7 @@ test('plan: bajar la complejidad no hace que el unificador ignore un brainstorm
       'precondicion: trivial sin senales resuelve 0 roles'
     );
 
-    const peticion = await readFile(segunda.peticionUnificador, 'utf8');
+    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
     // Las dos salidas reales se nombran, en vez de negarse.
     for (const rol of ROLES_BRAINSTORM.slice(0, 2)) {
       assert.ok(
@@ -1214,7 +1327,10 @@ test('plan: bajar la complejidad no hace que el unificador ignore un brainstorm
  */
 test('plan: con peticiones del mismo rol en dos rondas se reutiliza la mas alta', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
+    // TASK-042 (decision C4): la ronda 1 arranca en `media` (2 roles) y no
+    // en `simple`: con 1 rol ya no se escribe peticion de rol, solo la de
+    // redaccion, y no habria peticiones del mismo rol en dos rondas.
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
     commitAll(repoRoot, 'tarea TASK-800');
     const subirA = async (nivel: string, ruta: string): Promise<void> => {
       const c = await readFile(ruta, 'utf8');
@@ -1222,7 +1338,7 @@ test('plan: con peticiones del mismo rol en dos rondas se reutiliza la mas alta'
       commitAll(repoRoot, `complejidad ${nivel}`);
     };
 
-    // Ronda 1 con 1 rol.
+    // Ronda 1 con 2 roles.
     const r1 = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
     assert.equal(r1.rondaRoles, 1);
 
@@ -1239,7 +1355,7 @@ test('plan: con peticiones del mismo rol en dos rondas se reutiliza la mas alta'
 
     assert.equal(r3.rondaRoles, 2, 'se reutilizo un brainstorm viejo habiendo uno mas reciente');
     assert.equal(r3.roles.length, 3, 'la ronda 2 lanzo tres roles, no uno');
-    const peticion = await readFile(r3.peticionUnificador, 'utf8');
+    const peticion = await readFile(r3.peticionUnificador!, 'utf8');
     for (const rol of ROLES_BRAINSTORM.slice(0, 3)) {
       assert.ok(
         peticion.includes(nombreSalidaRolTest(rol.id, 2)),
@@ -1260,7 +1376,9 @@ test('plan: con peticiones del mismo rol en dos rondas se reutiliza la mas alta'
  */
 test('plan: una peticion de rol de cero bytes no cuenta como rol ya lanzado', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
+    // TASK-042 (decision C4): `media` y no `simple`: con 1 rol no hay
+    // peticion de rol que truncar.
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
     commitAll(repoRoot, 'tarea TASK-800');
 
     const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
index 02f7d6e..f4966c3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
@@ -766,3 +766,17 @@ test('cargarHeuristica con una ruta que no existe aborta diciendo que hacer', ()
     errorAccionable(/No se pudo leer la heuristica de complejidad/)
   );
 });
+
+// --------------------------------------------------------------------
+// TASK-042 (decision C4): sin complejidad declarada decide la heuristica
+// --------------------------------------------------------------------
+
+test('no declarada (null): el numero de agentes es el de la heuristica, aunque sea menor que el de "media"', () => {
+  const r = resolverNumeroAgentes(tarea({ complejidad: null }), CUERPO_NEUTRO, H);
+  assert.equal(r.nivelDeclarado, null);
+  assert.equal(r.nivelHeuristico, 'trivial');
+  assert.equal(r.hayDiscrepancia, false, 'sin declarar no hay con que discrepar');
+  assert.equal(r.agentes, H.agentes_brainstorm_trivial);
+  assert.ok(H.agentes_brainstorm_media > H.agentes_brainstorm_trivial, 'la prueba necesita que media pida mas');
+  assert.equal(resolverNumeroAgentes(tarea(), CUERPO_NEUTRO, H).agentes, H.agentes_brainstorm_media);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts
index 27e14fe..047de9e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts
@@ -108,3 +108,14 @@ test('validateTask: rechaza campo obligatorio ausente', () => {
     (e: unknown) => e instanceof TaskValidationError && e.field === 'rama'
   );
 });
+
+test('validateTask (TASK-042): complejidad null o ausente es "no declarada"; un valor invalido sigue fallando', () => {
+  assert.equal(validateTask(baseTaskData({ complejidad: null })).complejidad, null);
+  const sinClave = baseTaskData();
+  delete (sinClave as Record<string, unknown>)['complejidad'];
+  assert.equal(validateTask(sinClave).complejidad, null);
+  assert.throws(
+    () => validateTask(baseTaskData({ complejidad: 'enorme' })),
+    (e: unknown) => e instanceof TaskValidationError && e.field === 'complejidad'
+  );
+});
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-042/tarea.md                                                                        | 39 ---------------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-042/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-042/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-042/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-042/planificacion/plan-final.md                                    |  0
 tareas/02-en-curso/TASK-042/tarea.md                                                                         | 76 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 | 13 +++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js                                     |  6 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                                        |  6 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       | 53 +++++++++++++++++++++++++++++++++++++++--------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heuristica.js                                     | 11 ++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-brainstorm.js                                | 67 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js                                  |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js                                           |  2 +-
 14 files changed, 210 insertions(+), 65 deletions(-)
````
