# Peticion de revision — TASK-057 (ronda 3)

- Tarea: TASK-057 — Flujo C: fases como skills invocables en modo manual
- Rama revisada: feature/task-057-flujo-c-fases-como-skills-invocables-en
- Rama base: develop
- Commit revisado (HEAD): 3f1f626be1f4440b9a46f060edd71edafb379078
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-057 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde db5a6b9758b3c2a7187f2918d3dd8ed9d7ece9b4 (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-3.md), sin borrar la
peticion.

## Hallazgos de la ronda 2 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido (salvo el caso de 1 rol, ver IMP-3) | skills/plan/SKILL.md + skills/approve/SKILL.md | informe-revision-2.md |
| MEN-5 | MENOR | corregido en parte (M10 aceptado con motivo) | test/skills/fases.test.ts | informe-revision-2.md |
| IMP-3 | IMPORTANTE | abierto | skills/plan/SKILL.md:26-28 y 42-44 (pasos 2 y 4) | informe-revision-2.md |
| MEN-6 | MENOR | abierto | skills/plan/SKILL.md:25-29 (paso 2, re-planificar) | informe-revision-2.md |
| MEN-7 | MENOR | abierto | test/skills/fases.test.ts | informe-revision-2.md |

## Commits a revisar (git log db5a6b9758b3c2a7187f2918d3dd8ed9d7ece9b4..HEAD)

````
3f1f626 fix(TASK-057): correcciones de la ronda 2 (IMP-3, MEN-6, MEN-7)
bfa9c33 chore(TASK-057): veredicto ronda 2 (cambios-solicitados)
75ab242 docs(TASK-057): informe de revision ronda 2
5487a1b chore(TASK-057): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff db5a6b9758b3c2a7187f2918d3dd8ed9d7ece9b4..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
index b758bb9..55adba4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
@@ -17,9 +17,12 @@ Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
 3. Pregunta a la persona si lo aprueba.
    - **Si**: ejecuta `taskctl approve TASK-NNN`.
    - **No**: pregunta que habria que cambiar y escribelo, con sus palabras, al
-     final de `plan-final.md` en una seccion `## Cambios pedidos por la
-     persona` (asi sobrevive a la sesion y la re-planificacion lo lee).
-     Commitealo y ejecuta `taskctl pausa TASK-NNN`, que deja constancia del
+     final de `plan-final.md` en una seccion con este encabezado exacto (asi
+     sobrevive a la sesion y la re-planificacion lo lee):
+
+     `## Cambios pedidos por la persona`
+
+     Commitealo y despues ejecuta `taskctl pausa TASK-NNN`, que deja constancia del
      «no» en el registro de la tarea sin cambiar su estado. Si hay que rehacer
      el plan, lo reanuda `/taskcode-plugin:plan TASK-NNN`; si basta con
      retocarlo a mano, `/taskcode-plugin:approve TASK-NNN` otra vez.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index 6d59785..4a6bb0a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -22,14 +22,20 @@ no deberian necesitar volver a preguntar.
    - **`estado: en-diseno` con `fase: plan`**: la ronda de diseno ya esta
      abierta y falta el plan. **No ejecutes `taskctl plan`**: abriria otra
      ronda que no relanza los roles. Retoma la ronda abierta (paso 3).
-   - **Re-planificar** (el plan ya estaba redactado y la persona pidio
-     cambiarlo, normalmente tras un «no» en approve): solo entonces ejecuta
-     `taskctl plan TASK-NNN` con la tarea en diseno; abre la ronda N+1 y dice
-     que se lanza solo el unificador. Ve al paso 4.
+   - **`fase: approve`** (plan redactado): mira en `plan-final.md` la seccion
+     de cambios que deja approve al decir que no.
+     - `## Cambios pedidos por la persona`, sin marca: hay que re-planificar.
+       Ejecuta `taskctl plan TASK-NNN` (abre la ronda N+1), cambia el
+       encabezado a `## Cambios pedidos por la persona (pendientes, ronda N+1)`
+       y commitea. Ve al paso 4.
+     - `(pendientes, ronda K)`: la re-planificacion se corto a medias. **No
+       ejecutes `taskctl plan`**: retoma la ronda K en el paso 4.
+     - Sin seccion, o solo `(incorporados ...)`: no hay nada que re-planificar;
+       el plan espera su aprobacion (paso 7).
    - Cualquier otra fase: no es trabajo de esta skill; sigue el paso 7.
 3. **Ronda de diseno** (la de mayor N en `planificacion/brainstorm/`):
    - **Varios roles**: por cada `peticion-brainstorm-<rol>-N.md` cuya
-     `salida-brainstorm-<rol>-N.md` siga vacia, lanza un agente con el que
+     `salida-brainstorm-<rol>-N.md` siga sin rellenar, lanza un agente con el que
      nombra la propia peticion, en paralelo y en un solo mensaje. Vuelca cada
      respuesta en su salida. Despues lanza el unificador con
      `peticion-unificador-N.md`: el escribe `plan-final.md`.
@@ -38,10 +44,15 @@ no deberian necesitar volver a preguntar.
    - **Cero roles**: redacta tu el plan a partir del enunciado, sobre la
      plantilla de `plan-final.md`.
    Sigue en el paso 5.
-4. **Re-planificacion**: lee la seccion `## Cambios pedidos por la persona`
-   de `plan-final.md` (la deja approve al decir que no). Lanza solo el
-   unificador con `peticion-unificador-N.md` (la ronda nueva) y esos cambios;
-   el reescribe `plan-final.md` sobre las salidas de la ronda anterior.
+4. **Re-planificacion** (ronda K, la pendiente): no se relanza el brainstorm.
+   Lanza lo que haya para esa ronda en `planificacion/brainstorm/` (es lo que
+   nombro la salida de `taskctl plan`):
+   - `peticion-unificador-K.md`: el unificador, que reescribe `plan-final.md`
+     sobre las salidas de la ronda anterior y los cambios pedidos.
+   - `peticion-plan-K.md` (tarea de un rol): el agente de ese rol; su
+     respuesta es el plan nuevo: vuelcala en `plan-final.md`.
+   El plan nuevo conserva los cambios pedidos con el encabezado
+   `## Cambios pedidos por la persona (incorporados en la ronda K)`.
 5. Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
    anota las respuestas en el propio plan. Si la salida de `taskctl plan`
    nombro `skills_recomendados`, dejalos anotados para la implementacion.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
index cd456dc..680edad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -191,7 +191,24 @@ test('plan no reabre una ronda al reanudar (IMP-1) y review no relanza Codex en
   assert.match(review, /`veredicto-codex`: paso 6\. \*\*No ejecutes `codex-review`\*\*/);
   assert.match(review, /lo decide una\s+persona/);
   const approve = await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8');
-  assert.match(approve, /## Cambios pedidos por la\s+persona/, 'approve deja escrito el feedback del no');
+  assert.match(approve, /`## Cambios pedidos por la persona`/, 'approve deja escrito el feedback del no');
+  // pausa aborta con la carpeta sucia: primero se commitea el feedback (MEN-7, M3).
+  assert.ok(
+    approve.indexOf('Commitealo') !== -1 && approve.indexOf('Commitealo') < approve.indexOf('taskctl pausa'),
+    'approve commitea el feedback antes de taskctl pausa'
+  );
+
+  // Re-planificacion (IMP-3, MEN-6): lanza lo que exista para la ronda (unificador o el rol unico),
+  // y la seccion de cambios lleva su estado para que reanudar a medias no abra otra ronda.
+  assert.match(plan, /`peticion-unificador-K\.md`/);
+  assert.match(plan, /`peticion-plan-K\.md`/);
+  assert.match(plan, /\(pendientes, ronda N\+1\)/);
+  assert.match(plan, /\(incorporados en la ronda K\)/);
+
+  // El paso del veredicto de Codex no lanza otra ronda de Codex (MEN-7, M2).
+  const paso6 = /6\. \*\*Veredicto de la segunda opinion\*\*[\s\S]*?(?=\n7\. )/.exec(review);
+  assert.ok(paso6, 'review tiene el paso del veredicto de la segunda opinion');
+  assert.doesNotMatch(paso6[0], /taskctl codex-review/, 'el paso 6 no puede lanzar codex-review');
 });
 
 test('approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa', async () => {
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff db5a6b9758b3c2a7187f2918d3dd8ed9d7ece9b4..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/03-en-revision/TASK-057/revision/informe-revision-2.md  |  57 ++++++++++++++++++++++
 tareas/03-en-revision/TASK-057/revision/peticion-revision-2.md | 334 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-057/tarea.md                        |  24 ++++++++++
 3 files changed, 415 insertions(+)
````
