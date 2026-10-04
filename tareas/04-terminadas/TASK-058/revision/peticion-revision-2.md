# Peticion de revision — TASK-058 (ronda 2)

- Tarea: TASK-058 — Flujo D: modo semiautomatico
- Rama revisada: feature/task-058-flujo-d-modo-semiautomatico
- Rama base: develop
- Commit revisado (HEAD): ea31c4705a96fec9361cf734b710903663aa6662
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-058 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde e2f340f26b327f7f3c8abe92d996e5ad86ae042f (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la
peticion.

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | skills/task-workflow/avance.md:66-85, src/commands/cadena.ts | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | skills/task-workflow/avance.md:59, src/core/flujo.ts:93 | informe-revision-1.md |
| IMP-3 | IMPORTANTE | abierto | skills/task-workflow/avance.md:61-63, skills/review/SKILL.md | informe-revision-1.md |
| IMP-4 | IMPORTANTE | abierto | skills/approve/SKILL.md:21-33, skills/task-workflow/avance.md:53-59 | informe-revision-1.md |
| IMP-5 | IMPORTANTE | abierto | skills/task-workflow/avance.md:77-79 y :89, skills de fase | informe-revision-1.md |
| MEN-1 | MENOR | abierto | test/skills/fases.test.ts:234-252 | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/commands/cadena.ts:63-67 y 116-118 | informe-revision-1.md |
| MEN-3 | MENOR | abierto (no verificado) | src/commands/cadena.ts:110 | informe-revision-1.md |

## Commits a revisar (git log e2f340f26b327f7f3c8abe92d996e5ad86ae042f..HEAD)

````
ea31c47 fix(TASK-058): correcciones de la ronda 1 (IMP-1..5, MEN-1..3)
2022ec5 chore(TASK-058): veredicto ronda 1 (cambios-solicitados)
60734f1 docs(TASK-058): informe de revision ronda 1
0031909 chore(TASK-058): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff e2f340f26b327f7f3c8abe92d996e5ad86ae042f..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
index 94d4bcf..28ef024 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
@@ -12,7 +12,8 @@ Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
    `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
-   y para si falla (ver la cadena en `task-workflow/avance.md`).
+   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
+   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
 2. Lee `planificacion/plan-final.md` de la tarea (el ID viene en
    `$ARGUMENTS`) y presentalo resumido: enfoque, riesgos, plan de pruebas y
    lo que pida decision de una persona.
@@ -28,6 +29,9 @@ Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
      «no» en el registro de la tarea sin cambiar su estado. Si hay que rehacer
      el plan, lo reanuda `/taskcode-plugin:plan TASK-NNN`; si basta con
      retocarlo a mano, `/taskcode-plugin:approve TASK-NNN` otra vez.
+     Si habia una cadena abierta, cierrala (`taskctl cadena cerrar <testigo>`) y
+     **termina aqui**, sin pasar por la seccion de avance: el «no» detiene la
+     cadena.
 4. Si `taskctl approve` falla (por ejemplo, el plan es la plantilla sin
    rellenar), muestra el error tal cual.
 5. Sigue la seccion de avance (`task-workflow/avance.md`):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md
index 3e894d5..863f747 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md
@@ -12,7 +12,8 @@ Solo lee: no mueve ninguna tarea ni commitea nada.
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
    `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
-   y para si falla (ver la cadena en `task-workflow/avance.md`).
+   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
+   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
 2. Ejecuta `taskctl board` (acepta `--sprint N` y `--asignado-a <persona>`
    si vienen en `$ARGUMENTS`) y muestra su salida tal cual.
 3. Si `$ARGUMENTS` trae un ID `TASK-NNN`, ejecuta tambien
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index 561ad18..5e4e858 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -12,7 +12,8 @@ Mergea la rama de la tarea (sin borrarla) y la deja en `terminada`.
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
    `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
-   y para si falla (ver la cadena en `task-workflow/avance.md`).
+   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
+   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
 2. Comprueba que el `tarea.md` tiene los criterios de aceptacion marcados y
    una seccion `## Resultado` con lo implementado, lo que encontro la
    revision y lo que se decidio no corregir. Si falta, completalo y
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
index c24498d..755cfa6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
@@ -13,7 +13,8 @@ arrancar sin volver a preguntar.
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
    `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
-   y para si falla (ver la cadena en `task-workflow/avance.md`).
+   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
+   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
 2. Reune lo que falte de `$ARGUMENTS` preguntando a la persona (una sola
    pregunta con varias partes, mejor que cuatro seguidas):
    - **titulo** corto;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index c9eaff2..cd49dfa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -14,7 +14,8 @@ no deberian necesitar volver a preguntar.
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
    `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
-   y para si falla (ver la cadena en `task-workflow/avance.md`).
+   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
+   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
 2. Mira donde esta la tarea (el ID viene en `$ARGUMENTS`):
    `taskctl siguiente TASK-NNN --json`.
    - **`estado: planificada`**: ejecuta `taskctl plan TASK-NNN` y sigue en el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index ce4b2a3..a6e85fe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -13,7 +13,8 @@ punto, no un formalismo.
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
    `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
-   y para si falla (ver la cadena en `task-workflow/avance.md`).
+   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
+   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
 2. Con el ID de `$ARGUMENTS`, mira donde esta: `taskctl siguiente TASK-NNN --json`,
    y haz SOLO lo que corresponde a su `fase`:
    - `review`: la implementacion (o las correcciones de la ronda anterior)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index ab854cf..5c2749e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -12,7 +12,8 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
    `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
-   y para si falla (ver la cadena en `task-workflow/avance.md`).
+   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
+   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
 2. Ejecuta `taskctl start TASK-NNN` (el ID viene en `$ARGUMENTS`). Si aborta
    por el limite de trabajo en curso, muestra el error tal cual: dice que
    tarea hay que cerrar primero. No lo rodees.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 4451a20..19f62a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -46,7 +46,7 @@ commitearlo y dejar la suite en verde; despues, la revision.
 
 ## Que hacer segun `accion`
 
-- **`detener`** (modo `manual`): no encadenar nada. Terminar diciendo a la
+- **`detener`**: no encadenar nada. Terminar diciendo a la
   persona, en una linea, el `motivo` y la skill de la siguiente fase con su
   ID, por ejemplo `/taskcode-plugin:approve TASK-NNN`. Si la tarea esta
   terminada, decirlo y nada mas. Si habia una cadena abierta, cerrarla.
@@ -58,9 +58,13 @@ commitearlo y dejar la suite en verde; despues, la revision.
     skill que la reanuda.
 - **`continuar`**: encadenar la skill siguiente sin preguntar.
 
-No se encadena, aunque la accion lo diga, cuando la `fase` es `review` con la
-tarea `en-curso`: primero hay que implementar el plan. La skill termina como
-en `detener`, diciendo que toca implementar y despues revisar.
+`siguiente` devuelve `detener` en cualquier modo cuando lo que falta es
+trabajo y no una fase: `review` con la tarea `en-curso` (implementar el plan)
+o tras un `cambios-solicitados` (corregir). La skill termina diciendo que toca
+hacer ese trabajo, commitearlo y despues `/taskcode-plugin:review TASK-NNN`.
+
+En modo `automatico`, mientras sus guardas propias no esten disponibles,
+`siguiente` pregunta antes de cada fase nueva, igual que en `semiautomatico`.
 
 ## Encadenar la skill siguiente (la cadena)
 
@@ -80,13 +84,23 @@ se pisan las ramas). La cadena se identifica con un testigo:
 
 Una skill que recibe `--cadena <testigo>` empieza, despues de situarse en la
 raiz, con `taskctl cadena comprobar <testigo>`; si falla, para y muestra el
-error. En modo `manual` no hay cadena ni bloqueo.
+error. Y pasa `--cadena <testigo>` a cada `taskctl` que escriba o cambie de
+rama (`plan`, `approve`, `start`, `review`, `veredicto`, `codex-review`,
+`finish`, `pausa`...): **el CLI rechaza esos comandos mientras haya una cadena
+abierta sin su testigo**, asi que una segunda sesion no puede tocar el arbol
+aunque no pase por `cadena abrir`. En modo `manual` no hay cadena.
+
+**Un «no» o un error cierran la cadena.** Si una skill registra un «no»
+(`taskctl pausa`), o un `taskctl` falla con una cadena abierta, primero
+`taskctl cadena cerrar <testigo>`, despues muestra el «no» o el error, y
+termina sin volver a pasar por esta seccion.
 
 ## Reglas que no cambian con el modo
 
 - Antes de cualquier `taskctl`, situarse en la raiz del repo:
   `cd "$(git rev-parse --show-toplevel)"`.
-- Si un `taskctl` falla, parar y mostrar su error tal cual: dice que hacer.
-  No reintentar ni saltarse el paso editando ficheros a mano.
+- Si un `taskctl` falla, parar y mostrar su error tal cual (con una cadena
+  abierta, cerrandola antes): dice que hacer. No reintentar ni saltarse el
+  paso editando ficheros a mano.
 - Las guardas del CLI (limite de trabajo en curso, rama base limpia, revisor
   independiente, veredicto, segunda opinion) no se rodean en ningun modo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index e36df30..9d3d90e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -18,7 +18,12 @@ import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
 import { runPausaCommand, PausaCommandError } from './commands/pausa.js';
-import { runCadenaCommand, CadenaCommandError } from './commands/cadena.js';
+import {
+  runCadenaCommand,
+  CadenaCommandError,
+  verificarCadena,
+  extraerCadena,
+} from './commands/cadena.js';
 import {
   isWrapperCommand,
   runWrapperCommand,
@@ -299,7 +304,30 @@ export async function main(argv: readonly string[]): Promise<number> {
   return codigo === 0 && sincronizacionPendiente ? CODIGO_SINCRONIZACION_NO_APLICADA : codigo;
 }
 
-async function mainComando(argv: readonly string[]): Promise<number> {
+/**
+ * Comandos que escriben en el repo o cambian de rama: con una cadena de fases
+ * abierta en el arbol (TASK-058) solo se ejecutan con su testigo. Los de solo
+ * lectura (board, siguiente) y `cadena` quedan fuera.
+ */
+const GUARDADOS_POR_CADENA = new Set([
+  'new',
+  'import',
+  'plan',
+  'approve',
+  'start',
+  'review',
+  'codex-review',
+  'veredicto',
+  'finish',
+  'pausa',
+  'pause',
+  'resume',
+  'recover',
+  'abort-merge',
+]);
+
+async function mainComando(argvEntrada: readonly string[]): Promise<number> {
+  let argv = argvEntrada;
   const cmd = argv[0];
 
   if (cmd === undefined || cmd === '--help' || cmd === '-h') {
@@ -311,6 +339,20 @@ async function mainComando(argv: readonly string[]): Promise<number> {
     return 0;
   }
 
+  if (GUARDADOS_POR_CADENA.has(cmd)) {
+    const { testigo, resto } = extraerCadena(argv.slice(1));
+    try {
+      await verificarCadena(process.cwd(), testigo);
+    } catch (e) {
+      if (e instanceof CadenaCommandError || e instanceof GitLaunchError || e instanceof GitCommandError) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+    argv = [cmd, ...resto];
+  }
+
   if (cmd === 'new') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index cf7911d..292b305 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -48,6 +48,16 @@ export function rutaBloqueo(repoCwd: string): string {
   return path.resolve(repoCwd, runGit(['rev-parse', '--git-path', 'taskcode/cadena.lock'], repoCwd));
 }
 
+/** Forma de un testigo valido: el que genera `abrir` (MEN-2: un vacio no puede casar con nada). */
+const TESTIGO_RE = /^[0-9a-f]{16}$/;
+
+function exigirTestigo(arg: string | undefined, uso: string): string {
+  if (arg === undefined || !TESTIGO_RE.test(arg)) {
+    throw new CadenaCommandError(`[ERROR] Testigo de cadena ausente o mal formado. Uso: ${uso}.`);
+  }
+  return arg;
+}
+
 async function leerBloqueo(ruta: string): Promise<Bloqueo | null> {
   let texto: string;
   try {
@@ -108,14 +118,20 @@ export async function runCadenaCommand(
       } catch (e: unknown) {
         if (!isEexist(e)) throw e;
         const otro = await leerBloqueo(ruta);
-        throw new CadenaCommandError(mensajeOcupado(otro as Bloqueo, ruta, ahora));
+        // MEN-3: si se borro entre el EEXIST y la lectura, el arbol quedo libre
+        // en ese instante; no se reintenta (otra sesion puede estar abriendo).
+        if (otro === null) {
+          throw new CadenaCommandError(
+            '[ERROR] Otra sesion estaba abriendo o cerrando una cadena en este arbol justo ahora. ' +
+              'Reintenta en un momento.'
+          );
+        }
+        throw new CadenaCommandError(mensajeOcupado(otro, ruta, ahora));
       }
       return { accion: 'abrir', bloqueo, ruta };
     }
     case 'comprobar': {
-      if (arg === undefined || arg.startsWith('--')) {
-        throw new CadenaCommandError('[ERROR] Uso: taskctl cadena comprobar <testigo>.');
-      }
+      exigirTestigo(arg, 'taskctl cadena comprobar <testigo>');
       const b = await leerBloqueo(ruta);
       if (b === null) {
         throw new CadenaCommandError(
@@ -132,9 +148,7 @@ export async function runCadenaCommand(
         await rm(ruta, { force: true });
         return { accion: 'cerrar', ruta, existia: b !== null };
       }
-      if (arg === undefined) {
-        throw new CadenaCommandError('[ERROR] Uso: taskctl cadena cerrar <testigo> | cerrar --forzar.');
-      }
+      exigirTestigo(arg, 'taskctl cadena cerrar <testigo> | cerrar --forzar');
       if (b === null) return { accion: 'cerrar', ruta, existia: false };
       if (b.testigo !== arg) {
         throw new CadenaCommandError(
@@ -151,3 +165,51 @@ export async function runCadenaCommand(
       );
   }
 }
+
+/**
+ * IMP-1 de la revision: el bloqueo lo hace cumplir el CLI, no la buena
+ * voluntad de las skills. Todo comando que escribe en el repo o cambia de
+ * rama pasa por aqui antes de hacer nada:
+ * - sin cadena abierta: sigue, salvo que traiga un testigo (esa cadena ya se
+ *   cerro: seguir encadenando sobre ella seria trabajar sin bloqueo);
+ * - con una cadena abierta: sigue solo con su testigo (`--cadena <testigo>`).
+ * Asi una segunda sesion no puede hacer checkout ni commit mientras otra
+ * encadena fases, aunque no pase por `cadena abrir`.
+ */
+export async function verificarCadena(repoCwd: string, testigo: string | undefined, ahora = new Date()): Promise<void> {
+  if (testigo !== undefined) exigirTestigo(testigo, 'taskctl <comando> ... --cadena <testigo>');
+  const ruta = rutaBloqueo(repoCwd);
+  const b = await leerBloqueo(ruta);
+  if (b === null) {
+    if (testigo === undefined) return;
+    throw new CadenaCommandError(
+      '[ERROR] La cadena de ese testigo ya no esta abierta en este arbol. No se ha tocado nada. ' +
+        'Para seguir, lanza la fase sin --cadena.'
+    );
+  }
+  if (testigo === b.testigo) return;
+  throw new CadenaCommandError(
+    mensajeOcupado(b, ruta, ahora) +
+      (testigo === undefined
+        ? '\n        Si esa cadena es de esta misma sesion, pasa su testigo con --cadena <testigo>.'
+        : '')
+  );
+}
+
+/** Saca `--cadena <testigo>` (o `--cadena=<testigo>`) de argv. Sin valor, testigo vacio (y falla al validar). */
+export function extraerCadena(argv: readonly string[]): { testigo: string | undefined; resto: string[] } {
+  const resto: string[] = [];
+  let testigo: string | undefined;
+  for (let i = 0; i < argv.length; i++) {
+    const a = argv[i] as string;
+    if (a === '--cadena') {
+      testigo = argv[i + 1] ?? '';
+      i++;
+    } else if (a.startsWith('--cadena=')) {
+      testigo = a.slice('--cadena='.length);
+    } else {
+      resto.push(a);
+    }
+  }
+  return { testigo, resto };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 7033934..74a78bd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -82,15 +82,23 @@ function accionPara(
   modo: ModoFlujo,
   task: Task,
   abreFase: boolean,
-  exigePersona: boolean
+  exigePersona: boolean,
+  faltaTrabajo: boolean
 ): AccionFlujo {
   if (fase === 'terminada' || modo === 'manual') return 'detener';
+  // TASK-058 (IMP-3 de su revision): lo que falta no es una fase sino trabajo
+  // (implementar, o corregir tras cambios-solicitados). Encadenar la revision
+  // ahi la relanzaria sobre el mismo codigo. Se detiene en todos los modos.
+  if (faltaTrabajo) return 'detener';
   // Pasos que solo puede decidir una persona aunque el modo encadene.
   if (exigePersona) return 'preguntar';
   // Decision de Carlos (2026-10-04): hotfix y release mergean a main con
   // tag; en ningun modo se cierran sin preguntar.
   if (fase === 'finish' && (task.tipo === 'hotfix' || task.tipo === 'release')) return 'preguntar';
-  if (modo === 'automatico') return 'continuar';
+  // TASK-058 (IMP-2 de su revision): hasta que el modo automatico tenga sus
+  // guardas (aprobacion automatica registrada, informe en commit propio, tope
+  // de rondas: TASK-059), se comporta como el semiautomatico. Encadenar sin
+  // ellas mergearia sin persona.
   return abreFase ? 'preguntar' : 'continuar';
 }
 
@@ -100,11 +108,12 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
     abreFase: boolean,
     motivo: string,
     comando: string | null = `taskctl ${fase} ${task.id}`,
-    exigePersona = false
+    exigePersona = false,
+    faltaTrabajo = false
   ): SiguientePaso => ({
     fase,
     comando,
-    accion: accionPara(fase, modo, task, abreFase, exigePersona),
+    accion: accionPara(fase, modo, task, abreFase, exigePersona, faltaTrabajo),
     motivo,
   });
 
@@ -134,12 +143,22 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
       return paso(
         'review',
         true,
-        'cuando la implementacion este commiteada y la suite en verde, toca la revision'
+        'cuando la implementacion este commiteada y la suite en verde, toca la revision',
+        `taskctl review ${task.id}`,
+        false,
+        true
       );
     case 'en-revision':
       switch (ctx.veredicto) {
         case 'cambios-solicitados':
-          return paso('review', false, 'la ultima ronda pidio cambios: corregir y pedir otra ronda');
+          return paso(
+            'review',
+            false,
+            'la ultima ronda pidio cambios: corregir, commitear y pedir otra ronda',
+            `taskctl review ${task.id}`,
+            false,
+            true
+          );
         case 'aprobada':
           if (task.revision_codex) {
             switch (ctx.veredictoCodex) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
index 78bdacd..3c9fcc1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
@@ -154,6 +154,12 @@ test('un bloqueo con JSON roto se trata como ocupado y --forzar lo limpia', asyn
     assert.notEqual(r.status, 0);
     assert.ok(await existe(lock), 'no se pisa el bloqueo roto');
     assert.ok(r.stderr.includes('taskctl cadena cerrar --forzar'));
+    // MEN-2 de la revision: un testigo vacio no casa con el testigo vacio del bloqueo roto,
+    // ni en comprobar, ni en cerrar, ni como --cadena de un comando de fase.
+    assert.notEqual(cli(repoRoot, ['cadena', 'comprobar', '']).status, 0);
+    assert.notEqual(cli(repoRoot, ['cadena', 'cerrar', '']).status, 0);
+    assert.notEqual(cli(repoRoot, ['pausa', 'TASK-001', '--cadena', '']).status, 0);
+    assert.ok(await existe(lock), 'un testigo vacio no cierra el bloqueo roto');
     cliOk(repoRoot, ['cadena', 'cerrar', '--forzar']);
     assert.equal(await existe(lock), false);
     cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/semiautomatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/semiautomatico.test.ts
index efe6d26..19b4b11 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/semiautomatico.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/semiautomatico.test.ts
@@ -138,7 +138,8 @@ test('respuesta «si»: approve, start y review, cada paso guiado por siguiente'
     await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
     commitAll(repoRoot, `feat(${ID}): trabajo`);
     s = siguiente(repoRoot);
-    assert.deepEqual([s.estado, s.fase, s.accion], ['en-curso', 'review', 'preguntar']);
+    // En curso falta trabajo (implementar): se detiene en cualquier modo (IMP-3 de la revision).
+    assert.deepEqual([s.estado, s.fase, s.accion], ['en-curso', 'review', 'detener']);
   });
 });
 
@@ -155,12 +156,17 @@ test('cadena en el flujo: abrir antes de approve, comprobar antes de cada comand
     assert.ok(segundo.stderr.includes(ID));
 
     cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
-    cliOk(repoRoot, ['approve', ID]);
+    // IMP-1 de la revision: con la cadena abierta, un comando de fase sin su testigo aborta sin tocar nada.
+    const sinTestigo = cli(repoRoot, ['approve', ID]);
+    assert.notEqual(sinTestigo.status, 0);
+    assert.match(sinTestigo.stderr, /otra cadena de fases en marcha/);
+    assert.equal((await readTareaFile(tareasRoot, ID))?.task.plan_aprobado, false);
+    cliOk(repoRoot, ['approve', ID, '--cadena', testigo]);
 
     cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
     const s = siguiente(repoRoot);
     assert.equal(s.fase, 'start');
-    await runStartCommand(tareasRoot, [ID], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    cliOk(repoRoot, ['start', ID, '--cadena', testigo]);
 
     cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
     assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-curso');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
index ebe1666..f56a405 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
@@ -147,7 +147,7 @@ test('ciclo feature completo en semiautomatico: siguiente guia cada fase', async
     s = siguiente(repoRoot, id);
     assert.deepEqual(
       [s.estado, s.modo, s.fase, s.comando, s.accion, s.leidaDe],
-      ['en-curso', 'semiautomatico', 'review', `taskctl review ${id}`, 'preguntar', 'working-tree']
+      ['en-curso', 'semiautomatico', 'review', `taskctl review ${id}`, 'detener', 'working-tree']
     );
 
     await runReviewCommand(tareasRoot, [id], HOY, deps);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index f9c803e..d10c959 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -59,19 +59,19 @@ interface Caso {
 const VEREDICTO_PENDIENTE = 'taskctl veredicto TASK-100 <aprobada|aprobada-con-correcciones|cambios-solicitados>';
 
 const TABLA: Caso[] = [
-  { nombre: 'planificada', task: { estado: 'planificada' }, fase: 'plan', comando: 'taskctl plan TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'planificada', task: { estado: 'planificada' }, fase: 'plan', comando: 'taskctl plan TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'en diseno sin plan redactado', task: { estado: 'en-diseno' }, fase: 'plan', comando: null, acciones: ['detener', 'continuar', 'continuar'] },
-  { nombre: 'en diseno con plan redactado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en diseno con plan redactado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   // MEN-4: sin modo congelado (tarea anterior al registro) la aprobacion automatica esta vetada.
   { nombre: 'en diseno con plan, sin modo congelado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true, modoCongelado: false }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
-  { nombre: 'en diseno aprobada', task: { estado: 'en-diseno', plan_aprobado: true }, ctx: { planRedactado: true }, fase: 'start', comando: 'taskctl start TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
-  { nombre: 'en curso', task: { estado: 'en-curso', plan_aprobado: true }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en diseno aprobada', task: { estado: 'en-diseno', plan_aprobado: true }, ctx: { planRedactado: true }, fase: 'start', comando: 'taskctl start TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'en curso', task: { estado: 'en-curso', plan_aprobado: true }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'detener'] },
   { nombre: 'en revision sin informe', task: { estado: 'en-revision', plan_aprobado: true }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
   { nombre: 'en revision pendiente', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'pendiente' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
   { nombre: 'en revision veredicto desconocido', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'desconocido' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
-  { nombre: 'en revision cambios solicitados', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados' }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'continuar', 'continuar'] },
-  { nombre: 'en revision aprobada (feature)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
-  { nombre: 'en revision aprobada (fix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'fix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en revision cambios solicitados', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados' }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'detener'] },
+  { nombre: 'en revision aprobada (feature)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'en revision aprobada (fix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'fix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   // Decision de Carlos: hotfix y release preguntan antes de finish en cualquier modo que encadene.
   { nombre: 'en revision aprobada (hotfix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'hotfix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'en revision aprobada (release)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'release' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
@@ -80,8 +80,8 @@ const TABLA: Caso[] = [
   { nombre: 'aprobada con codex pendiente', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'veredicto-codex', comando: null, acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'aprobada con codex sin linea', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'sin-linea' }, fase: 'veredicto-codex', comando: null, acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'aprobada con codex cambios', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'cambios-solicitados' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
-  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
-  { nombre: 'codex aprobada sin revision_codex no cuenta', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'codex aprobada sin revision_codex no cuenta', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
 ];
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
index 007c4a7..8d4a895 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -248,9 +248,25 @@ test('semiautomatico (TASK-058): preguntar y continuar encadenan con la herramie
   for (const fase of Object.keys(FASES)) {
     const texto = await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8');
     assert.ok(texto.includes('taskctl cadena comprobar <testigo>'), `${fase}: no comprueba la cadena recibida`);
+    assert.ok(lf(texto).includes('anade `--cadena <testigo>` a cada `taskctl`'), `${fase}: no pasa el testigo a sus taskctl`);
   }
 });
 
+test('la cadena se cierra en cada camino de salida: detener, no, error (MEN-1 de la revision de TASK-058)', async () => {
+  const avance = lf(await readFile(AVANCE, 'utf8'));
+  const detener = /\*\*`detener`\*\*[\s\S]*?(?=\n- \*\*`preguntar`)/.exec(avance);
+  assert.ok(detener && /cadena abierta, cerrarla/.test(detener[0]), 'detener cierra la cadena');
+  const no = /\*\*No\*\*: ejecutar `taskctl pausa[\s\S]*?(?=\n- \*\*`continuar`)/.exec(avance);
+  assert.ok(no && /cerrar la cadena/.test(no[0]), 'el no de preguntar cierra la cadena');
+  assert.match(avance, /\*\*Un «no» o un error cierran la cadena\.\*\*/);
+  assert.match(avance, /primero\s+`taskctl cadena cerrar <testigo>`, despues muestra el «no» o el error/);
+  assert.match(avance, /el CLI rechaza esos comandos mientras haya una cadena\s+abierta sin su testigo/);
+  // El no de approve detiene la cadena sin volver a avance (IMP-4).
+  const approve = lf(await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8'));
+  assert.match(approve, /cierrala \(`taskctl cadena cerrar <testigo>`\)/);
+  assert.match(approve, /\*\*termina aqui\*\*, sin pasar por la seccion de avance/);
+});
+
 test('approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa', async () => {
   const texto = await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8');
   assert.match(texto, /Pregunta a la persona/);
````

## Excluido del diff (8 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff e2f340f26b327f7f3c8abe92d996e5ad86ae042f..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-058/planificacion/brainstorm/peticion-unificador-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-058/planificacion/plan-final.md                       |   0
 tareas/03-en-revision/TASK-058/revision/informe-revision-1.md                                     |  70 ++++++++
 tareas/03-en-revision/TASK-058/revision/peticion-revision-1.md                                    | 838 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-058/tarea.md                                          |  35 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                      |  40 ++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                          |  69 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                               |  21 ++-
 8 files changed, 1057 insertions(+), 16 deletions(-)
````
