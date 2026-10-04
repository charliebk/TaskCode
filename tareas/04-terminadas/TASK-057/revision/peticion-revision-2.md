# Peticion de revision — TASK-057 (ronda 2)

- Tarea: TASK-057 — Flujo C: fases como skills invocables en modo manual
- Rama revisada: feature/task-057-flujo-c-fases-como-skills-invocables-en
- Rama base: develop
- Commit revisado (HEAD): db5a6b9758b3c2a7187f2918d3dd8ed9d7ece9b4
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-057 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 2d6af8dabef1677385dc571fe9535b6b0ca08a5d (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | skills/plan/SKILL.md:16 (paso 2) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | skills/review/SKILL.md:21,32 + skills/task-workflow/avance.md | informe-revision-1.md |
| MEN-1 | MENOR | abierto | skills/plan/SKILL.md:19-27 + skills/approve/SKILL.md:19-22 | informe-revision-1.md |
| MEN-2 | MENOR | abierto | skills/review/SKILL.md:26-31 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | skills/review/SKILL.md:32 | informe-revision-1.md |
| MEN-4 | MENOR | abierto | skills/finish/SKILL.md:4 (allowed-tools) | informe-revision-1.md |
| MEN-5 | MENOR | abierto | test/skills/fases.test.ts:123-136 | informe-revision-1.md |

## Commits a revisar (git log 2d6af8dabef1677385dc571fe9535b6b0ca08a5d..HEAD)

````
db5a6b9 fix(TASK-057): correcciones de la ronda 1 (IMP-1, IMP-2, MEN-1..5)
7cbcf68 chore(TASK-057): veredicto ronda 1 (cambios-solicitados)
7d32496 docs(TASK-057): informe de revision ronda 1
b1aaf4f test(TASK-057): el frontmatter admite CRLF (checkout de Windows)
8855cc9 chore(TASK-057): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 2d6af8dabef1677385dc571fe9535b6b0ca08a5d..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
index cb9c4a1..b758bb9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
@@ -1,7 +1,7 @@
 ---
 name: approve
 description: Fase de aprobacion del flujo de tareas con taskctl. Muestra el plan-final de una tarea TASK-NNN y la marca como aprobada solo si la persona lo aprueba. Se invoca como /taskcode-plugin:approve TASK-NNN.
-allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Read AskUserQuestion Skill
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Edit AskUserQuestion Skill
 ---
 
 # Fase: aprobar el plan
@@ -16,10 +16,13 @@ Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
    lo que pida decision de una persona.
 3. Pregunta a la persona si lo aprueba.
    - **Si**: ejecuta `taskctl approve TASK-NNN`.
-   - **No**: ejecuta `taskctl pausa TASK-NNN`, que deja constancia del «no»
-     en el registro de la tarea sin cambiar su estado. Recoge que habria que
-     cambiar y dile que lo reanuda `/taskcode-plugin:plan TASK-NNN` (si hay
-     que rehacer el plan) o `/taskcode-plugin:approve TASK-NNN`.
+   - **No**: pregunta que habria que cambiar y escribelo, con sus palabras, al
+     final de `plan-final.md` en una seccion `## Cambios pedidos por la
+     persona` (asi sobrevive a la sesion y la re-planificacion lo lee).
+     Commitealo y ejecuta `taskctl pausa TASK-NNN`, que deja constancia del
+     «no» en el registro de la tarea sin cambiar su estado. Si hay que rehacer
+     el plan, lo reanuda `/taskcode-plugin:plan TASK-NNN`; si basta con
+     retocarlo a mano, `/taskcode-plugin:approve TASK-NNN` otra vez.
 4. Si `taskctl approve` falla (por ejemplo, el plan es la plantilla sin
    rellenar), muestra el error tal cual.
 5. Sigue la seccion de avance (`task-workflow/avance.md`):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index 4790724..57b13ad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -1,7 +1,7 @@
 ---
 name: finish
 description: Fase de cierre del flujo de tareas con taskctl. Integra la rama de una tarea TASK-NNN con la revision aprobada, la mueve a terminadas y actualiza los artefactos de cierre. Se invoca como /taskcode-plugin:finish TASK-NNN.
-allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Read Skill
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Edit Skill
 ---
 
 # Fase: cerrar la tarea
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index f40f9fc..6d59785 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -13,25 +13,38 @@ no deberian necesitar volver a preguntar.
 ## Pasos
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
-2. Ejecuta `taskctl plan TASK-NNN` (el ID viene en `$ARGUMENTS`). Si aborta
-   porque el enunciado no esta listo (Objetivo vacio, criterios vagos, mas de
-   12), muestra el error: dice que corregir y, si propone una particion,
-   donde esta.
-3. Lee la salida: dice cuantos roles entran y que ficheros dejo en
-   `planificacion/brainstorm/`.
-   - **Varios roles**: lanza, en paralelo y en un solo mensaje, un agente por
-     cada `peticion-brainstorm-<rol>-N.md`, con el agente que nombra la
-     propia peticion. Vuelca cada respuesta en su `salida-brainstorm-<rol>-N.md`.
-     Despues lanza el unificador con `peticion-unificador-N.md`: el escribe
-     `plan-final.md`.
+2. Mira donde esta la tarea (el ID viene en `$ARGUMENTS`):
+   `taskctl siguiente TASK-NNN --json`.
+   - **`estado: planificada`**: ejecuta `taskctl plan TASK-NNN` y sigue en el
+     paso 3. Si aborta porque el enunciado no esta listo (Objetivo vacio,
+     criterios vagos, mas de 12), muestra el error: dice que corregir y, si
+     propone una particion, donde esta.
+   - **`estado: en-diseno` con `fase: plan`**: la ronda de diseno ya esta
+     abierta y falta el plan. **No ejecutes `taskctl plan`**: abriria otra
+     ronda que no relanza los roles. Retoma la ronda abierta (paso 3).
+   - **Re-planificar** (el plan ya estaba redactado y la persona pidio
+     cambiarlo, normalmente tras un «no» en approve): solo entonces ejecuta
+     `taskctl plan TASK-NNN` con la tarea en diseno; abre la ronda N+1 y dice
+     que se lanza solo el unificador. Ve al paso 4.
+   - Cualquier otra fase: no es trabajo de esta skill; sigue el paso 7.
+3. **Ronda de diseno** (la de mayor N en `planificacion/brainstorm/`):
+   - **Varios roles**: por cada `peticion-brainstorm-<rol>-N.md` cuya
+     `salida-brainstorm-<rol>-N.md` siga vacia, lanza un agente con el que
+     nombra la propia peticion, en paralelo y en un solo mensaje. Vuelca cada
+     respuesta en su salida. Despues lanza el unificador con
+     `peticion-unificador-N.md`: el escribe `plan-final.md`.
    - **Un rol**: lanza ese agente con `peticion-plan-N.md`; su respuesta es el
      plan: vuelcala en `planificacion/plan-final.md`.
    - **Cero roles**: redacta tu el plan a partir del enunciado, sobre la
      plantilla de `plan-final.md`.
-4. Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
-   anota las respuestas en el propio plan.
-5. Si la salida de `taskctl plan` nombra `skills_recomendados`, dejalos
-   anotados en el plan para la implementacion.
+   Sigue en el paso 5.
+4. **Re-planificacion**: lee la seccion `## Cambios pedidos por la persona`
+   de `plan-final.md` (la deja approve al decir que no). Lanza solo el
+   unificador con `peticion-unificador-N.md` (la ronda nueva) y esos cambios;
+   el reescribe `plan-final.md` sobre las salidas de la ronda anterior.
+5. Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
+   anota las respuestas en el propio plan. Si la salida de `taskctl plan`
+   nombro `skills_recomendados`, dejalos anotados para la implementacion.
 6. Commitea lo escrito en la carpeta de la tarea
    (`git add <carpeta de la tarea> && git commit -m "docs(TASK-NNN): plan final"`).
    Los comandos siguientes exigen el workspace limpio.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index dfd9332..cfd7657 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -12,26 +12,39 @@ punto, no un formalismo.
 ## Pasos
 
 1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
-2. Con el ID de `$ARGUMENTS`, mira donde esta: `taskctl siguiente TASK-NNN --json`.
-   - `fase: review`: la implementacion tiene que estar commiteada y la suite
-     en verde. Si no lo esta, para y dilo. Si lo esta, ejecuta
-     `taskctl review TASK-NNN` (tambien abre la ronda 2 y siguientes tras un
-     `cambios-solicitados`).
-   - `fase: veredicto`: ya hay peticion de revision; sigue en el paso 3.
-   - `fase: codex-review` o `veredicto-codex`: salta al paso 5.
-3. Por cada `revision/peticion-revision-N*.md` de la ronda (una por dominio si
-   esta fragmentada), lanza un agente revisor independiente, en paralelo y en
-   un solo mensaje, con la skill revisora que nombra la peticion. Que
-   reproduzca empiricamente (clon temporal, suite una vez, mutantes) y
-   devuelva el informe con su tabla de hallazgos. Vuelca cada respuesta en su
-   `informe-revision-N*.md` y commitealo.
+2. Con el ID de `$ARGUMENTS`, mira donde esta: `taskctl siguiente TASK-NNN --json`,
+   y haz SOLO lo que corresponde a su `fase`:
+   - `review`: la implementacion (o las correcciones de la ronda anterior)
+     tiene que estar commiteada y la suite en verde. Si no lo esta, para y
+     dilo. Si lo esta, ejecuta `taskctl review TASK-NNN` y sigue en el paso 3.
+   - `veredicto`: ya hay peticion de revision; sigue en el paso 3.
+   - `codex-review`: paso 5.
+   - `veredicto-codex`: paso 6. **No ejecutes `codex-review`**.
+3. Por cada `revision/peticion-revision-N*.md` de la ronda que no tenga ya su
+   informe con veredicto (una por dominio si esta fragmentada), lanza un
+   agente revisor independiente, en paralelo y en un solo mensaje, con la
+   skill revisora que nombra la peticion. Que reproduzca empiricamente (clon
+   temporal, suite una vez, mutantes) y devuelva su informe con la tabla de
+   hallazgos. Vuelca cada respuesta en su `informe-revision-N*.md`
+   **conservando la cabecera de la plantilla**, con su linea `- Veredicto:`,
+   y commitealo.
 4. Escribe cada veredicto con el comando, no a mano:
-   `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`
-   (con `--informe <nombre>` si la ronda esta fragmentada). Con CRITICO o
-   IMPORTANTE abiertos, `cambios-solicitados`: se corrigen y se vuelve a esta
-   skill.
-5. Si la tarea tiene `revision_codex: true` y la primaria esta aprobada,
-   `taskctl codex-review TASK-NNN`. Su informe lo lee una persona y escribe su
-   linea `- Veredicto:`; no la escribas tu.
-6. Sigue la seccion de avance (`task-workflow/avance.md`):
+   `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`.
+   Si la ronda esta fragmentada, uno por informe, con el nombre de fichero
+   completo: `--informe informe-revision-N-<revisor>.md`. Con CRITICO o
+   IMPORTANTE abiertos, `cambios-solicitados`: se corrigen, se commitea, y se
+   vuelve a esta skill (abre la ronda siguiente).
+5. **Segunda opinion** (`revision_codex: true` y primaria aprobada):
+   ejecuta `taskctl codex-review TASK-NNN` una vez.
+   - Si avisa de que Codex no respondio y no escribio informe, muestra el
+     aviso y no reintentes: arreglar Codex o quitar `revision_codex` lo
+     decide la persona.
+   - Si el ultimo informe de Codex pidio cambios, primero se corrigen y se
+     commitean; solo despues se vuelve a lanzar.
+6. **Veredicto de la segunda opinion** (`veredicto-codex`): lo decide una
+   persona. Muestra el `motivo` y la ruta del ultimo `informe-codex-N.md`, y
+   pide a la persona que lo lea y diga su veredicto. Escribe su linea
+   `- Veredicto:` en ese informe solo con lo que ella diga, y commitealo.
+   Nunca lo decidas tu ni lances otra ronda de Codex para salir de aqui.
+7. Sigue la seccion de avance (`task-workflow/avance.md`):
    `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 72b6190..c874c11 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -37,7 +37,7 @@ quien decidio) en el mismo commit que la transicion.
 | `review` | `/taskcode-plugin:review` |
 | `veredicto` | `/taskcode-plugin:review` |
 | `codex-review` | `/taskcode-plugin:review` |
-| `veredicto-codex` | `/taskcode-plugin:review` |
+| `veredicto-codex` | `/taskcode-plugin:review` (no lanza nada: el veredicto de la segunda opinion lo decide una persona) |
 | `finish` | `/taskcode-plugin:finish` |
 | `terminada` | ninguna: la tarea esta cerrada |
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
index d90850a..cd456dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -90,7 +90,8 @@ test('las siete skills de fase existen, con frontmatter portable y name igual al
     const ruta = path.join(SKILLS_DIR, fase, 'SKILL.md');
     assert.ok(await existe(ruta), `falta ${ruta}`);
     const texto = await readFile(ruta, 'utf8');
-    assert.ok(texto.startsWith('---\n'), `${fase}: el frontmatter tiene que abrir en la primera linea`);
+    // \r?\n: los .md no tienen eol fijado y un checkout de Windows los deja en CRLF.
+    assert.match(texto, /^---\r?\n/, `${fase}: el frontmatter tiene que abrir en la primera linea`);
     const { data, body } = parseFrontmatter(texto);
     assert.equal(data.name, fase, `${fase}: name tiene que ser el nombre del directorio`);
     const intrusas = Object.keys(data).filter((k) => !CLAVES_PERMITIDAS.has(k));
@@ -124,16 +125,43 @@ test('cada skill de fase nombra su subcomando de taskctl, taskctl siguiente y la
   }
 });
 
-test('la seccion de avance asigna una skill existente a CADA fase que puede devolver siguiente', async () => {
+/**
+ * Que skill atiende cada fase de `siguiente` (MEN-5 de la revision: sin el
+ * mapa fijo, asignar una fase a la skill equivocada no ponia nada rojo).
+ * Tiene que cubrir FASES_SIGUIENTE entera.
+ */
+const SKILL_DE_FASE: Record<string, string | null> = {
+  plan: 'plan',
+  approve: 'approve',
+  start: 'start',
+  review: 'review',
+  veredicto: 'review',
+  'codex-review': 'review',
+  'veredicto-codex': 'review',
+  finish: 'finish',
+  terminada: null,
+};
+
+test('la seccion de avance asigna a CADA fase que puede devolver siguiente la skill que le toca', async () => {
   const avance = await readFile(AVANCE, 'utf8');
   for (const fase of FASES_SIGUIENTE) {
-    const fila = avance.split('\n').find((l) => l.startsWith(`| \`${fase}\` |`));
+    assert.ok(fase in SKILL_DE_FASE, `la fase "${fase}" no esta en el mapa esperado del test`);
+    const fila = avance.split(/\r?\n/).find((l) => l.startsWith(`| \`${fase}\` |`));
     assert.ok(fila, `la fase "${fase}" no tiene fila en avance.md`);
-    if (fase === 'terminada') continue;
+    const esperada = SKILL_DE_FASE[fase] as string | null;
     const skill = /\/taskcode-plugin:([a-z-]+)/.exec(fila);
+    if (esperada === null) {
+      assert.equal(skill, null, `la fase "${fase}" no deberia remitir a ninguna skill`);
+      continue;
+    }
     assert.ok(skill, `la fase "${fase}" no nombra ninguna skill`);
-    assert.ok(skill[1] !== undefined && skill[1] in FASES, `la fase "${fase}" apunta a una skill que no existe: ${skill[1]}`);
+    assert.equal(skill[1], esperada, `la fase "${fase}" remite a /taskcode-plugin:${skill[1]}`);
+    assert.ok(esperada in FASES, `la skill "${esperada}" no existe`);
   }
+  // En manual (detener) no se encadena nada: es el contrato del criterio 3.
+  const detener = /\*\*`detener`\*\*[^\n]*(\n {2}[^\n]*)*/.exec(avance);
+  assert.ok(detener, 'avance.md no tiene el bloque de detener');
+  assert.match(detener[0], /no encadenar nada/, 'detener tiene que decir que no se encadena nada');
   // Las tres acciones de siguiente tienen sus pasos.
   for (const accion of ['detener', 'preguntar', 'continuar']) {
     assert.ok(avance.includes(`**\`${accion}\`**`), `avance.md no dice que hacer con "${accion}"`);
@@ -153,6 +181,19 @@ test('las skills de fase y la seccion de avance no mencionan rutas ni documentos
   }
 });
 
+test('plan no reabre una ronda al reanudar (IMP-1) y review no relanza Codex en veredicto-codex (IMP-2)', async () => {
+  const plan = await readFile(path.join(SKILLS_DIR, 'plan', 'SKILL.md'), 'utf8');
+  // Mira siguiente ANTES de ejecutar taskctl plan, y con la ronda abierta no lo ejecuta.
+  assert.ok(plan.indexOf('taskctl siguiente') < plan.indexOf('taskctl plan TASK-NNN'), 'plan consulta siguiente primero');
+  assert.match(plan, /\*\*No ejecutes `taskctl plan`\*\*/);
+  assert.match(plan, /## Cambios pedidos por la persona/, 'la re-planificacion lee el feedback escrito');
+  const review = await readFile(path.join(SKILLS_DIR, 'review', 'SKILL.md'), 'utf8');
+  assert.match(review, /`veredicto-codex`: paso 6\. \*\*No ejecutes `codex-review`\*\*/);
+  assert.match(review, /lo decide una\s+persona/);
+  const approve = await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8');
+  assert.match(approve, /## Cambios pedidos por la\s+persona/, 'approve deja escrito el feedback del no');
+});
+
 test('approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa', async () => {
   const texto = await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8');
   assert.match(texto, /Pregunta a la persona/);
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 2d6af8dabef1677385dc571fe9535b6b0ca08a5d..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-057/planificacion/brainstorm/peticion-unificador-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-057/planificacion/plan-final.md                       |   0
 tareas/03-en-revision/TASK-057/revision/informe-revision-1.md                                     |  69 ++++++++
 tareas/03-en-revision/TASK-057/revision/peticion-revision-1.md                                    | 827 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-057/tarea.md                                          |  34 +++-
 5 files changed, 929 insertions(+), 1 deletion(-)
````
