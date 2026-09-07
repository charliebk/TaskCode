# Peticion de revision — TASK-028 (ronda 1)

- Tarea: TASK-028 — Primera skill del plugin: task-workflow/SKILL.md
- Rama revisada: feature/task-028-primera-skill-del-plugin-task-workflow-s
- Rama base: develop
- Commit revisado (HEAD): 13753970ee411fdd1f37ba3f67c97152bae76149
- Fecha: 2026-09-07
- Agente revisor sugerido: general-purpose

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
1375397 feat(TASK-028): primera skill del plugin (item C5)
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CLAUDE.md b/CLAUDE.md
index f6fb864..6f46acb 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -39,11 +39,13 @@ procesan).
 ```bash
 cd taskcode-marketplace/plugins/taskcode-plugin
 npm install
-npm test     # compila y corre 226 tests con cobertura
+npm test     # compila y corre 429 tests con cobertura
 ```
 
-El CLI: `taskctl new | import | board | plan | approve | start`.
-`review` y `finish` todavía no existen — son la Fase B.
+El CLI: `taskctl new | import | board | plan | approve | start | review |
+finish`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
+recover | abort-merge`. El ciclo de vida está completo: Fases A y B
+cerradas.
 
 ## Trampas que ya nos han mordido
 
@@ -55,5 +57,9 @@ El CLI: `taskctl new | import | board | plan | approve | start`.
   medio, por lo mismo.
 - El glob de `npm test` va entrecomillado a propósito: lo expande Node, no el
   shell. Sin comillas, la suite entera falla en `cmd.exe`.
+- En Windows nativo **fallan 3 tests y no son regresiones** (dos por el truco
+  del symlink, uno por finales de línea); en el CI de Linux pasan. Aquí «suite
+  en verde» significa que fallan solo esos tres: si aparece un cuarto, es
+  tuyo.
 
 El resto, en `docs/contexto/HALLAZGOS.md`.
diff --git a/tareas/01-en-diseno/TASK-028/planificacion/plan-final.md b/tareas/02-en-curso/TASK-028/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-028/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-028/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-028/tarea.md b/tareas/02-en-curso/TASK-028/tarea.md
similarity index 96%
rename from tareas/01-en-diseno/TASK-028/tarea.md
rename to tareas/02-en-curso/TASK-028/tarea.md
index 9772e59..16baeed 100644
--- a/tareas/01-en-diseno/TASK-028/tarea.md
+++ b/tareas/02-en-curso/TASK-028/tarea.md
@@ -6,7 +6,7 @@ sprint: 2
 etiquetas: []
 complejidad: simple
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-028-primera-skill-del-plugin-task-workflow-s
 asignado_a: charlie.bk@gmail.com
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
new file mode 100644
index 0000000..75737ee
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -0,0 +1,262 @@
+---
+name: task-workflow
+description: Metodologia de tareas por sprints con revision por pares y Git-Flow determinista. Se usa cuando el proyecto tiene una carpeta "tareas/" con subcarpetas 00-planificadas .. 04-terminadas, o cuando se pide "crear una tarea", "planificar una tarea", "aprobar un plan", "empezar una tarea", "revisar por pares", "cerrar una tarea", o se menciona taskctl, una tarea TASK-NNN, el tablero de tareas o el flujo de Git-Flow del proyecto.
+---
+
+# Flujo de trabajo de tareas (taskctl)
+
+Metodologia de trabajo por tareas: cada una vive en su carpeta, se mueve por
+estados con un CLI determinista, abre su propia rama de Git y **no se cierra
+sin que otro agente la haya revisado**.
+
+## Cuando aplica
+
+Cuando el repo tiene una carpeta `tareas/` con `00-planificadas/`,
+`01-en-diseno/`, `02-en-curso/`, `03-en-revision/` y `04-terminadas/`, y el
+comando `taskctl` esta disponible. Si no existe esa estructura, esta skill no
+aplica.
+
+Comprobar el estado real antes de nada: `taskctl board`.
+
+## El ciclo de vida
+
+Cada estado corresponde a una carpeta. El comando mueve la carpeta entera de
+la tarea, con sus subcarpetas.
+
+| Estado | Carpeta | Comando que lleva ahi |
+|---|---|---|
+| `planificada` | `00-planificadas/` | `new` / `import` |
+| `en-diseno` | `01-en-diseno/` | `plan` (y `approve`, que no mueve) |
+| `en-curso` | `02-en-curso/` | `start` |
+| `en-revision` | `03-en-revision/` | `review` |
+| `terminada` | `04-terminadas/` | `finish` |
+
+Precondiciones de cada transicion:
+
+- **`plan`** — desde `planificada`, o desde `en-diseno` con
+  `plan_aprobado: false` (re-planificacion). Deja un scaffold vacio en
+  `planificacion/plan-final.md`; **el contenido lo escribe el agente**, no el
+  CLI.
+- **`approve`** — desde `en-diseno`, y tiene que existir el `plan-final.md`.
+  Es el **checkpoint humano**: lo ejecuta la persona, no el agente.
+- **`start`** — desde `en-diseno` con `plan_aprobado: true`, salvo que la
+  complejidad sea `trivial` o `simple`. Crea la rama y aplica el limite de
+  trabajo en curso.
+- **`review`** — desde `en-curso`. Trae la rama base a la de trabajo y genera
+  `revision/peticion-revision-N.md` con el diff real, mas el scaffold del
+  informe. **No invoca a ningun agente**: lanzar al revisor es trabajo de
+  quien orquesta.
+- **`finish`** — desde `en-revision`, y solo si el ultimo informe de revision
+  aprueba (ver "La linea del veredicto"). Mergea, mueve la tarea y regenera
+  los artefactos del repo.
+
+La carpeta de cada tarea es `tarea.md` + `planificacion/` + `revision/`. Las
+dos subcarpetas se crean bajo demanda, cuando hay algo que escribir dentro.
+
+## Los comandos
+
+```
+taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release>
+            [--sprint N] [--etiquetas a,b,c]
+            [--complejidad trivial|simple|media|alta|critica]
+            [--modelo-sugerido X] [--agente-revisor Y]
+
+taskctl import <fichero.md> [--tipo ...] [--sprint N] [--complejidad ...]
+taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
+taskctl plan    TASK-NNN [--asignado-a <persona>]
+taskctl approve TASK-NNN
+taskctl start   TASK-NNN [--asignado-a <persona>]
+taskctl review  TASK-NNN
+taskctl finish  TASK-NNN
+
+taskctl diagnose | pause [--push] | resume [<rama>] | recover [<rama>] | abort-merge
+```
+
+Defaults: `--sprint 0`, `--complejidad media`, `--etiquetas` vacio. En
+`import`, `--tipo` es opcional (`feature`); en `new` es **obligatorio**.
+
+Detalles que muerden:
+
+- **En `approve`, `review` y `finish` el ID tiene que ser el primer
+  argumento.** Esos comandos leen el primer argumento tal cual, asi que
+  `taskctl approve --loquesea TASK-001` intentaria usar `--loquesea` como ID.
+- **Los flags desconocidos se ignoran en silencio** en el resto de comandos.
+  Un flag mal escrito no da error: simplemente no hace nada. Comprobar la
+  salida, no suponer.
+- `board` solo escribe `docs/BOARD.md` si se le pasa `--escribir`.
+- `asignado_a` se rellena solo con `git config user.email` si la tarea no
+  tenia a nadie. Ejecutar un comando sobre la tarea de otra persona **no** se
+  la queda.
+
+### Lo que NO existe
+
+No inventar estos comandos: **`codex-review`**, `status`, `list`, `show`,
+`reject`, `reopen`, `assign`, `delete`, `edit`, `init`, `commit`, `push`.
+
+`codex-review` merece un aviso aparte: aparece en la documentacion de la
+metodologia y `finish` sabe leer un `informe-codex-N.md`, pero **el comando no
+existe y ningun comando genera ese informe**. Poner `revision_codex: true` en
+una tarea la deja **imposible de cerrar**: `finish` exigira para siempre un
+informe que nadie escribe. Dejarlo en `false` salvo que se vaya a redactar a
+mano.
+
+## Reglas que no se negocian
+
+**1. Evidencia, no suposicion.** Si no lo has ejecutado, no lo afirmes: ni que
+los tests pasan, ni que el comando funciona, ni que el cambio no afecta a
+nada. Un `exit 0` tampoco prueba que algo ocurriera — hay que comprobar el
+hecho. Los scripts de Git-Flow pueden cancelarse y salir 0.
+
+**2. Revision por pares antes de cerrar, siempre, por un agente distinto.**
+Sin esto los fallos que se cuelan son los caros: perdida de datos silenciosa,
+un parser que aprobaba literalmente "no aprobada", un comando que bloqueaba
+todas las tareas del repo. Los tres son casos reales.
+
+**3. El orden de los comandos no es opcional.** Cada uno comprueba el estado
+del frontmatter contra la carpeta real y aborta si no cuadran. No mover
+carpetas ni editar `estado:` a mano para saltarse un paso: si el comando
+corta, falta algo de verdad.
+
+**4. Todos los hallazgos se documentan, tambien los que se decide no
+corregir.** CRITICO e IMPORTANTE se corrigen siempre. MENOR se corrige si sale
+barato; si no, se documenta con el motivo. Sin esa nota, el siguiente lector
+concluye que hay un bug donde hay una decision.
+
+**5. Un test que no falla si el comportamiento cambia no es un test.**
+Comprobarlo por mutacion: romper a proposito la linea que el test dice cubrir
+y verificar que se pone rojo. Si sigue verde, la red de regresion no existe.
+
+**6. Tests contra recursos reales, no mocks.** Repos Git temporales de verdad.
+Lo que rompe son los detalles del sistema real, y un mock los reproduce por
+definicion como tu crees que son.
+
+**7. Cuando la implementacion contradice al diseno, se documenta la
+divergencia; no se reescribe el diseno en silencio.** Cambiarlo es una
+decision de la persona responsable, explicita.
+
+**8. Diffs minimos y reutilizar lo que ya existe.** Acotados a lo que motiva
+la tarea. Antes de escribir un helper, buscar el que ya esta: duplicar la
+comprobacion es como acaban existiendo dos comportamientos para el mismo
+hecho.
+
+**9. Los mensajes de error se dirigen a la persona y dicen que hacer.** Un
+error que no propone el siguiente paso deja al lector adivinando. Y un mensaje
+que ha dejado de ser cierto es peor que no tenerlo.
+
+## La revision por pares
+
+**Quien.** Un agente que no implemento la tarea. La independencia es el punto,
+no un formalismo.
+
+**Como.** No es leer el diff y opinar. Es clonar el repo a un directorio
+temporal, compilar, correr la suite uno mismo, y **construir el caso que rompe
+el codigo antes de reportarlo**. Lo que mas hallazgos ha dado:
+
+- **Mutacion**: romper a proposito cada proteccion y ver si algun test se
+  entera. Asi se descubre que un flag defensivo se habia quedado sin cobertura.
+- **Ejercitar el CLI real**, no solo la API interna.
+- **Comprobar los tests que cambiaron de expectativa**: que sigan aseverando
+  lo mismo y no escondan una regresion.
+- **Reconstruir el build**: un clon no hereda binarios compilados, y cada rama
+  compila algo distinto.
+
+**Clasificacion.** CRITICO: perdida de datos, corrupcion de estado, o el
+comando hace lo contrario de lo que dice. IMPORTANTE: comportamiento
+incorrecto en un caso real, no de borde. MENOR: todo lo demas.
+
+Un "sin hallazgos" explicito es una respuesta valida. Inventar hallazgos para
+tener algo que reportar, no.
+
+**Rondas.** Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
+`revision/`. Dos rondas es normal, no una excepcion: la ronda 2 revisa las
+correcciones de la ronda 1, que es justo donde se cuelan los fallos nuevos.
+
+### La linea del veredicto
+
+`finish` decide si la tarea puede cerrarse leyendo el informe de mayor N, y lo
+hace **fail-closed** a proposito: una version anterior buscaba la palabra
+"aprobada" en cualquier parte y aprobaba literalmente "no aprobada".
+
+Escribir exactamente esto, sustituyendo la linea de la plantilla — **no anadir
+otra debajo**, porque *todas* las lineas de veredicto tienen que aprobar:
+
+```
+- Veredicto: aprobada
+```
+
+Lo que falla, y por que:
+
+| Linea | Resultado |
+|---|---|
+| `- Veredicto: aprobada` | pasa |
+| `- Veredicto: aprobada con correcciones` | pasa (empieza por `aprobada`) |
+| `- Veredicto: **APROBADO**` | falla: los asteriscos rompen el inicio |
+| `- Veredicto: APROBADO CON CAMBIOS` | falla: `aprobado` no es `aprobada` |
+| `- Veredicto: cambios-solicitados` | falla, y es lo correcto si pides cambios |
+| `- Veredicto: PENDIENTE (...)` | falla: la plantilla sin sustituir |
+| `Veredicto: aprobada` (sin el guion) | falla: no cuenta como linea de veredicto |
+
+El matiz del veredicto va en el **cuerpo** del informe, no en esa linea. Un
+revisor que escriba su veredicto en su propio vocabulario bloquea el cierre y
+obliga a un commit de normalizacion.
+
+## Trampas que cuestan tiempo
+
+**Los scripts de Git-Flow se invocan como `bash script.sh`, nunca por ruta
+directa.** El bit de ejecucion no viaja por Git en todas las configuraciones.
+En Windows hay una segunda capa: `bash` desde PowerShell puede resolver al de
+WSL y reventar; hace falta el `bash` de Git con su directorio de utilidades en
+el PATH, o se queda sin las herramientas que los scripts usan.
+
+**Los scripts escriben su registro dentro de tu repo.** Lo crean nada mas
+arrancar, antes de mirar si el workspace esta limpio: **se ensucian el
+workspace ellos mismos**. En un repo que no ignore esa ruta, el comando de
+guardar trabajo acaba preguntando por un directorio que acaba de crear el, y
+el de reanudar queda inservible. Anadir `logs/gitflow/` al `.gitignore` antes
+de nada.
+
+**La herramienta no commitea lo que genera.** Consecuencia directa: `import`
+no se puede ejecutar dos veces seguidas sin commitear en medio, porque lo que
+genero la primera vez deja el workspace sucio y el guard aborta la segunda. Y
+los ficheros que se le pasen a `import` tienen que vivir **fuera** del repo:
+dentro, ensucian el workspace y abortan el propio import.
+
+**Los comandos que escriben en `tareas/` exigen estar en la rama base.** Son
+`new`, `import`, `plan` y `approve`. Si el workspace esta limpio **cambian de
+rama solos y lo dicen despues**; si esta sucio, abortan. `start`, `review` y
+`finish` solo exigen workspace limpio. Los ficheros sin trackear cuentan como
+sucio.
+
+**Sin terminal, stdin se ignora.** Los comandos que envuelven scripts
+interactivos heredan stdin solo si hay TTY. Sin el, el script recibe EOF y
+toma su valor por defecto — que a veces es "no hacer nada" y salir 0. Heredar
+siempre no es la alternativa segura: una tuberia abierta que nadie cierra
+cuelga el comando **para siempre**, y eso lo produce cualquier arnes de agente
+y tambien el runner de tests.
+
+**Un clon nuevo no hereda nada.** Ni dependencias, ni binarios compilados, ni
+identidad de Git. Instalar y compilar siempre, **y otra vez tras cada cambio
+de rama dentro del mismo clon**. Sin `user.email` y `user.name` configurados,
+cualquier commit falla.
+
+**Un fix de errno validado en una sola plataforma no esta validado.** Codigos
+distintos describen el mismo hecho segun el sistema operativo. Lo caro no es
+el bug: es que el test escrito para cerrarlo hereda el mismo punto ciego, pasa
+en local y cae en el CI de la otra plataforma.
+
+## Al cerrar una tarea
+
+1. Suite en verde **antes** de commitear.
+2. Smoke test manual de punta a punta si la tarea toca el CLI o Git. Ha
+   encontrado fallos **antes** que la revision mas de una vez, porque ejercita
+   el flujo real en vez del orden mas comodo.
+3. Criterios de aceptacion marcados en `tarea.md`, y seccion `## Resultado`
+   con que se implemento, que encontro la revision, que se corrigio y que se
+   dejo sin corregir. Es el unico sitio donde queda la experiencia: el diff no
+   la cuenta.
+4. Actualizar el registro de progreso que use el proyecto.
+5. `taskctl finish`.
+
+Commits: mensajes en el idioma del proyecto, una rama por tarea, merge sin
+fast-forward. Si el repo tiene activada la politica de conservar ramas, no se
+borran tras el merge.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
new file mode 100644
index 0000000..00466f5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
@@ -0,0 +1,453 @@
+/**
+ * Tests de la primera skill del plugin: `skills/task-workflow/SKILL.md`.
+ *
+ * Dos bloques, con motivos distintos:
+ *
+ * 1. ESTRUCTURALES. Replican a proposito las reglas que el validador
+ *    oficial aplica, para que la red de regresion exista tambien donde
+ *    `claude` no esta instalado (el CI de Linux). Un test que solo se
+ *    salta no protege de nada.
+ *
+ * 2. DE INTEGRACION. Ejecutan el validador real. La comprobacion de mas
+ *    valor no es "valida", sino la CONTRAPRUEBA: sobre una copia
+ *    temporal del plugin se rompe el frontmatter del SKILL.md a
+ *    proposito y se comprueba que el validador **falla nombrando ese
+ *    fichero**. El silencio de un validador que pasa es ambiguo entre
+ *    "la encontro y esta bien" y "nunca la busco"; romperla desambigua.
+ *    Si no mirase esa ruta, romperla no cambiaria nada.
+ *
+ * Cero dependencias: se reutiliza `parseFrontmatter` de src/core/.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { spawnSync } from 'node:child_process';
+import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseFrontmatter } from '../../src/core/frontmatter.js';
+
+// --- Localizacion del plugin -------------------------------------------
+//
+// Compilado, este fichero vive en dist/test/skills/. Tres niveles
+// arriba esta la raiz del plugin. Se hace el mismo truco que
+// src/fs/gitflow-runner.ts, en vez de depender del cwd de npm.
+
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
+
+const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
+const SKILL_DIR_NAME = 'task-workflow';
+const SKILL_DIR = path.join(SKILLS_DIR, SKILL_DIR_NAME);
+const SKILL_FILE_NAME = 'SKILL.md';
+const SKILL_PATH = path.join(SKILL_DIR, SKILL_FILE_NAME);
+const PLUGIN_JSON = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');
+
+/** Claves que acepta el spec portable de Agent Skills. Nada mas. */
+const CLAVES_PERMITIDAS = new Set([
+  'name',
+  'description',
+  'license',
+  'allowed-tools',
+  'metadata',
+  'compatibility',
+]);
+
+const MAX_LINEAS_CUERPO = 500;
+const MAX_LONGITUD_NAME = 64;
+const MAX_LONGITUD_DESCRIPTION = 1024;
+
+const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);
+
+/** Nombres de directorio de componentes: van en la raiz, nunca dentro
+ *  de .claude-plugin/. */
+const DIRS_DE_COMPONENTES = ['skills', 'commands', 'agents', 'hooks'];
+
+/** Rutas absolutas de maquina que no deben viajar en una skill que se
+ *  distribuye a otros proyectos. */
+const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];
+
+async function leerSkillBytes(): Promise<Buffer> {
+  return readFile(SKILL_PATH);
+}
+
+async function leerSkillTexto(): Promise<string> {
+  return readFile(SKILL_PATH, 'utf8');
+}
+
+async function existe(p: string): Promise<boolean> {
+  try {
+    await stat(p);
+    return true;
+  } catch {
+    return false;
+  }
+}
+
+// Guard de no-vacuidad: si PLUGIN_ROOT apuntase a otro sitio, varios de
+// los tests de abajo pasarian sin comprobar nada real.
+test('el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)', async () => {
+  const pkg = JSON.parse(
+    await readFile(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')
+  ) as { name?: unknown };
+  assert.equal(
+    pkg.name,
+    'taskcode-plugin',
+    `PLUGIN_ROOT resuelto a "${PLUGIN_ROOT}", que no es el plugin`
+  );
+});
+
+// --- 1. Estructurales ---------------------------------------------------
+
+test('1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas', async () => {
+  // Ojo: en Windows el filesystem es case-insensitive, asi que un
+  // stat() de la ruta NO demuestra el case. Se comprueba el nombre
+  // literal en el listado del directorio, que si lo demuestra.
+  const enSkills = await readdir(SKILLS_DIR);
+  assert.ok(
+    enSkills.includes(SKILL_DIR_NAME),
+    `skills/ no contiene el directorio literal "${SKILL_DIR_NAME}": ${enSkills.join(', ')}`
+  );
+
+  const enSkill = await readdir(SKILL_DIR);
+  assert.ok(
+    enSkill.includes(SKILL_FILE_NAME),
+    `skills/${SKILL_DIR_NAME}/ no contiene "${SKILL_FILE_NAME}" con ese case exacto: ${enSkill.join(', ')}`
+  );
+});
+
+test('2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante', async () => {
+  const bytes = await leerSkillBytes();
+
+  // El BOM UTF-8 desplaza el "---" y Claude Code deja de ver
+  // frontmatter: trata el fichero entero como cuerpo. Fallo silencioso.
+  assert.ok(
+    !bytes.subarray(0, 3).equals(BOM_UTF8),
+    'SKILL.md empieza con BOM UTF-8 (EF BB BF): el frontmatter no se parseara'
+  );
+
+  assert.equal(
+    bytes[0],
+    0x2d,
+    `el primer byte de SKILL.md es 0x${(bytes[0] ?? 0).toString(16)}, no un guion`
+  );
+
+  const texto = bytes.toString('utf8');
+  assert.match(
+    texto,
+    /^---\r?\n/,
+    'SKILL.md no empieza exactamente por "---" seguido de salto de linea'
+  );
+});
+
+test('3. hay cierre de frontmatter y lo de dentro parsea a objeto', async () => {
+  const texto = await leerSkillTexto();
+  // parseFrontmatter lanza si no hay linea de cierre "---".
+  const { data, body } = parseFrontmatter(texto);
+  assert.equal(typeof data, 'object');
+  assert.notEqual(data, null);
+  assert.equal(typeof body, 'string');
+});
+
+test('4. name presente, string y en kebab-case valido', async () => {
+  const { data } = parseFrontmatter(await leerSkillTexto());
+  const name = data.name;
+
+  assert.equal(typeof name, 'string', 'el frontmatter no tiene "name" como string');
+  const n = name as string;
+
+  assert.match(n, /^[a-z0-9-]+$/, `"${n}" no es kebab-case (solo a-z, 0-9 y guiones)`);
+  assert.ok(!n.startsWith('-'), `"${n}" empieza por guion`);
+  assert.ok(!n.endsWith('-'), `"${n}" acaba en guion`);
+  assert.ok(!n.includes('--'), `"${n}" tiene doble guion`);
+  assert.ok(
+    n.length <= MAX_LONGITUD_NAME,
+    `"${n}" tiene ${n.length} caracteres (maximo ${MAX_LONGITUD_NAME})`
+  );
+});
+
+test('5. name coincide exactamente con el directorio que contiene el SKILL.md', async () => {
+  const { data } = parseFrontmatter(await leerSkillTexto());
+  // El nombre del directorio se toma del listado real, no de la
+  // constante, para que el test siga siendo cierto si el directorio
+  // cambia de nombre.
+  const enSkills = await readdir(SKILLS_DIR, { withFileTypes: true });
+  const dirsConSkill: string[] = [];
+  for (const e of enSkills) {
+    if (e.isDirectory() && (await existe(path.join(SKILLS_DIR, e.name, SKILL_FILE_NAME)))) {
+      dirsConSkill.push(e.name);
+    }
+  }
+  assert.ok(
+    dirsConSkill.includes(data.name as string),
+    `name="${String(data.name)}" no coincide con ningun directorio de skill: ${dirsConSkill.join(', ')}`
+  );
+  assert.equal(
+    path.basename(path.dirname(SKILL_PATH)),
+    data.name,
+    `el directorio es "${path.basename(path.dirname(SKILL_PATH))}" pero name es "${String(data.name)}"`
+  );
+});
+
+test('6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor', async () => {
+  const { data } = parseFrontmatter(await leerSkillTexto());
+  const description = data.description;
+
+  assert.equal(
+    typeof description,
+    'string',
+    'el frontmatter no tiene "description" como string'
+  );
+  const d = description as string;
+
+  assert.ok(d.trim().length > 0, 'la description esta vacia');
+  assert.ok(
+    d.length <= MAX_LONGITUD_DESCRIPTION,
+    `la description tiene ${d.length} caracteres (maximo ${MAX_LONGITUD_DESCRIPTION})`
+  );
+  // El spec portable de Agent Skills los prohibe.
+  assert.ok(!d.includes('<'), 'la description contiene el signo de menor');
+  assert.ok(!d.includes('>'), 'la description contiene el signo de mayor');
+
+  // El parser del proyecto corta un valor sin comillas en el primer " #"
+  // (comentario inline de YAML). Claude Code NO hace eso, asi que una
+  // description que contuviera " #" se mediria aqui truncada y las
+  // comprobaciones de arriba darian verde sobre un valor que no es el que
+  // Claude Code lee. Se compara con la linea cruda para que la divergencia
+  // no pueda pasar en silencio.
+  const lineaCruda = (await leerSkillTexto())
+    .split('\n')
+    .find((l) => l.startsWith('description:'));
+  assert.ok(lineaCruda !== undefined, 'no hay una linea "description:" en el frontmatter');
+  const valorCrudo = lineaCruda.slice('description:'.length).trim();
+  assert.equal(
+    d,
+    valorCrudo,
+    'el parser ha truncado la description (¿contiene " #", que YAML lee como comentario?): ' +
+      'lo que mide este test no es lo que leeria Claude Code'
+  );
+});
+
+test('7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida)', async () => {
+  const { data } = parseFrontmatter(await leerSkillTexto());
+  const claves = Object.keys(data);
+
+  const intrusas = claves.filter((k) => !CLAVES_PERMITIDAS.has(k));
+  assert.deepEqual(
+    intrusas,
+    [],
+    `claves fuera del spec portable: ${intrusas.join(', ')} (permitidas: ${[...CLAVES_PERMITIDAS].join(', ')})`
+  );
+
+  // Explicito, porque es la trampa concreta: Claude Code ignora
+  // "version" pero el empaquetado portable lo rechaza con error duro.
+  assert.ok(
+    !('version' in data),
+    'el frontmatter tiene "version": rompe el empaquetado portable (la version vive en plugin.json)'
+  );
+});
+
+test('8. el cuerpo no esta vacio y tiene 500 lineas o menos', async () => {
+  const { body } = parseFrontmatter(await leerSkillTexto());
+  assert.ok(body.trim().length > 0, 'el cuerpo del SKILL.md esta vacio');
+
+  const lineas = body.replace(/\r?\n$/, '').split(/\r?\n/).length;
+  assert.ok(
+    lineas <= MAX_LINEAS_CUERPO,
+    `el cuerpo tiene ${lineas} lineas (maximo ${MAX_LINEAS_CUERPO}): persiste en contexto toda la conversacion`
+  );
+});
+
+test('9. el cuerpo no contiene rutas absolutas de maquina', async () => {
+  const { body } = parseFrontmatter(await leerSkillTexto());
+  const encontradas = RUTAS_DE_MAQUINA.filter((r) => body.includes(r));
+  assert.deepEqual(
+    encontradas,
+    [],
+    `el cuerpo contiene rutas de maquina: ${encontradas.join(', ')}`
+  );
+});
+
+test('10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe', async () => {
+  const { body } = parseFrontmatter(await leerSkillTexto());
+
+  const destinos: string[] = [];
+  const re = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
+  let m: RegExpExecArray | null;
+  while ((m = re.exec(body)) !== null) {
+    const destino = m[1];
+    if (destino !== undefined) destinos.push(destino);
+  }
+
+  const relativos = destinos.filter(
+    (d) => !/^(?:https?:|mailto:|#)/i.test(d)
+  );
+
+  const rotos: string[] = [];
+  for (const rel of relativos) {
+    const sinAncla = rel.split('#')[0] ?? '';
+    if (sinAncla === '') continue; // enlace puramente a un ancla
+    const absoluta = path.resolve(SKILL_DIR, sinAncla);
+    if (!(await existe(absoluta))) rotos.push(`${rel} -> ${absoluta}`);
+  }
+
+  assert.deepEqual(rotos, [], `enlaces relativos rotos: ${rotos.join(' | ')}`);
+});
+
+test('11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto', async () => {
+  const raw = await readFile(PLUGIN_JSON, 'utf8');
+  const manifest = JSON.parse(raw) as Record<string, unknown>;
+
+  assert.equal(typeof manifest, 'object');
+  assert.notEqual(manifest, null);
+
+  assert.ok(
+    !('bin' in manifest),
+    'plugin.json tiene la clave "bin", que no pertenece al manifiesto del plugin'
+  );
+
+  // Regresion de TASK-006: declarar commands/skills como objeto impedia
+  // cargar el plugin entero.
+  for (const clave of ['commands', 'skills']) {
+    if (!(clave in manifest)) continue;
+    const valor = manifest[clave];
+    const esString = typeof valor === 'string';
+    const esArrayDeStrings =
+      Array.isArray(valor) && valor.every((x) => typeof x === 'string');
+    assert.ok(
+      esString || esArrayDeStrings,
+      `plugin.json: "${clave}" debe ser string o array de strings, no ${
+        Array.isArray(valor) ? 'array con elementos no-string' : typeof valor
+      }`
+    );
+  }
+});
+
+test('12. no hay directorios de componentes dentro de .claude-plugin/', async () => {
+  const dir = path.join(PLUGIN_ROOT, '.claude-plugin');
+  const entradas = await readdir(dir, { withFileTypes: true });
+  const intrusos = entradas
+    .filter((e) => e.isDirectory() && DIRS_DE_COMPONENTES.includes(e.name))
+    .map((e) => e.name);
+
+  assert.deepEqual(
+    intrusos,
+    [],
+    `.claude-plugin/ contiene directorios de componentes (${intrusos.join(', ')}): van en la raiz del plugin`
+  );
+});
+
+// --- 2. De integracion: el validador oficial ----------------------------
+
+interface ResultadoValidate {
+  status: number | null;
+  salida: string;
+}
+
+function claudeDisponible(): boolean {
+  try {
+    const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
+    return r.status === 0;
+  } catch {
+    return false;
+  }
+}
+
+function validar(ruta: string): ResultadoValidate {
+  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
+    encoding: 'utf8',
+    stdio: ['ignore', 'pipe', 'pipe'],
+  });
+  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
+}
+
+// Skip explicito y visible: en el CI de Linux `claude` no esta
+// instalado, y un test que pasa en falso es peor que uno que no corre.
+const SKIP_INTEGRACION: false | string = claudeDisponible()
+  ? false
+  : 'el binario "claude" no esta en el PATH: la comprobacion empirica no se puede hacer aqui';
+
+const CRUZ = '\u2718';
+
+test(
+  '13. `claude plugin validate` sobre el plugin real sale 0',
+  { skip: SKIP_INTEGRACION },
+  () => {
+    const { status, salida } = validar(PLUGIN_ROOT);
+    assert.equal(status, 0, `exit ${String(status)}. Salida:\n${salida}`);
+    assert.ok(!salida.includes(CRUZ), `la salida reporta errores:\n${salida}`);
+  }
+);
+
+test(
+  '14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo',
+  { skip: SKIP_INTEGRACION },
+  async (t) => {
+    // Se trabaja SIEMPRE sobre una copia fuera del repo. El fichero real
+    // no se toca: romperlo aunque fuera un instante dejaria el workspace
+    // sucio si el test peta a mitad.
+    const tmp = await mkdtemp(path.join(tmpdir(), 'taskcode-skill-'));
+    t.after(async () => {
+      await rm(tmp, { recursive: true, force: true });
+    });
+
+    // Solo lo que el validador necesita: el manifiesto y el arbol de
+    // skills. Nada de node_modules ni dist.
+    await cp(
+      path.join(PLUGIN_ROOT, '.claude-plugin'),
+      path.join(tmp, '.claude-plugin'),
+      { recursive: true }
+    );
+    await cp(SKILLS_DIR, path.join(tmp, 'skills'), { recursive: true });
+
+    const copiaSkill = path.join(tmp, 'skills', SKILL_DIR_NAME, SKILL_FILE_NAME);
+
+    // (a) La copia intacta valida limpio. Si no, lo que falle despues no
+    //     se puede atribuir a la mutacion.
+    const intacta = validar(tmp);
+    assert.equal(
+      intacta.status,
+      0,
+      `la copia intacta no valida (exit ${String(intacta.status)}):\n${intacta.salida}`
+    );
+    assert.ok(
+      !intacta.salida.includes(CRUZ),
+      `la copia intacta reporta errores:\n${intacta.salida}`
+    );
+
+    // (b) Se rompe el YAML del frontmatter de la COPIA: comillas sin
+    //     cerrar en la linea de description.
+    const original = await readFile(copiaSkill, 'utf8');
+    const roto = original.replace(
+      /^description:.*$/m,
+      'description: "sin cerrar la comilla'
+    );
+    assert.notEqual(roto, original, 'no se encontro la linea "description:" que romper');
+    await writeFile(copiaSkill, roto, 'utf8');
+
+    const rota = validar(tmp);
+
+    // Si el validador no mirase esta ruta, romper el fichero no
+    // cambiaria nada y esto seguiria saliendo 0. Que falle ES la
+    // evidencia de que Claude Code descubre la skill donde la pusimos.
+    assert.notEqual(
+      rota.status,
+      0,
+      `romper el frontmatter no hizo fallar al validador: no esta mirando esa ruta.\n${rota.salida}`
+    );
+    assert.match(
+      rota.salida,
+      /Validating skill:/,
+      `el validador fallo pero no nombro ninguna skill:\n${rota.salida}`
+    );
+    assert.match(
+      rota.salida,
+      /Validating skill:.*SKILL\.md/,
+      `la linea "Validating skill:" no apunta al SKILL.md:\n${rota.salida}`
+    );
+    assert.ok(
+      rota.salida.includes(SKILL_DIR_NAME),
+      `la salida no menciona el directorio "${SKILL_DIR_NAME}":\n${rota.salida}`
+    );
+  }
+);
````
