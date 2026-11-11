# Peticion de revision — TASK-096 (ronda 2)

- Tarea: TASK-096 — Verificacion proporcional B: con codigo parcial se verifica solo lo afectado
- Rama revisada: feature/task-096-verificacion-proporcional-al-cambio-una
- Rama base: develop
- Commit revisado (HEAD): 5a3838b8cf8577d766ab5054ef390c946d145fa8
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-096 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 51da391d65140d9c41401284fe8f43a5a9c1492b (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (3 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera. Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-096/tarea.md
- tareas/03-en-revision/TASK-096/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts:122-153 y test/core/verificacion-proporcional.test.ts:335-370 | informe-revision-1.md |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts:776-796 y test/core/verificacion-proporcional.test.ts:389-425 | informe-revision-1.md |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts:84-86 y test:372-387 | informe-revision-1.md |

## Commits a revisar (git log 51da391d65140d9c41401284fe8f43a5a9c1492b..HEAD)

````
5a3838b docs(TASK-096): autorrevision ronda 2
26a3ea7 docs(TASK-096): hallazgos de la revision 1 corregidos
07b8f62 fix(TASK-096): correcciones de la revision 1 (MEN-1 a MEN-3)
8a886fc chore(TASK-096): veredicto ronda 1 (cambios-solicitados)
40d0985 chore(TASK-096): coste revision +1961255 tokens (1 agente)
92a12e5 docs(TASK-096): informe de revision 1
a1322fa chore(TASK-096): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 51da391d65140d9c41401284fe8f43a5a9c1492b..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
index 4f5743b..005c18b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts
@@ -131,6 +131,11 @@ export function decidirVerificacion(
         `rutas_documentacion de "${base}")`,
     };
   }
+  // MEN-1 de la revision: sin rutas_documentacion, un diff que solo toca
+  // `tareas/**` no tiene codigo que acotar: la de siempre, como en la 0.14.0.
+  if (!docs && diff.fueraDeDocs.length === 0) {
+    return { tipo: 'completa', motivo: `"${base}" no declara rutas_documentacion` };
+  }
   if (selectiva === null) {
     return {
       tipo: 'completa',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
index fef6644..6eb0a59 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
@@ -186,6 +186,14 @@ test('decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en la
     'develop'
   );
   assert.equal(sinDocs.tipo, 'selectiva');
+  // MEN-1 de la revision: sin rutas_documentacion, un diff solo de tareas/** no es codigo parcial.
+  const soloTareas = decidirVerificacion(
+    { ...CFG_PARCIAL, rutas_documentacion: [] },
+    { todas: ['tareas/a.md'], fueraDeDocs: [], fueraDeParcial: [] },
+    'develop'
+  );
+  assert.equal(soloTareas.tipo, 'completa');
+  assert.match(soloTareas.motivo, /no declara rutas_documentacion/);
 
   const casos: Array<[string, Parameters<typeof decidirVerificacion>[1], RegExp]> = [
     ['fuera de las rutas parciales', { todas: ['src/web/b.ts', 'src/core/c.ts'], fueraDeDocs: ['src/web/b.ts', 'src/core/c.ts'], fueraDeParcial: ['src/core/c.ts'] }, /fuera de rutas_verificacion_parcial: src\/core\/c\.ts/],
@@ -216,6 +224,9 @@ test('decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision
   assert.match(decidirVerificacion({ ...CFG, rutas_documentacion: [] }, diff, 'develop').motivo, /no declara rutas_documentacion/);
   assert.equal(parcialDeclarada(CFG), false);
   assert.equal(parcialDeclarada(CFG_PARCIAL), true);
+  // MEN-3 de la revision: hacen falta las dos cosas, rutas y selectiva.
+  assert.equal(parcialDeclarada({ ...CFG_PARCIAL, comando_verificacion_selectiva: null }), false);
+  assert.equal(parcialDeclarada({ ...CFG_PARCIAL, rutas_verificacion_parcial: [] }), false);
   assert.deepEqual(patronesParcial(CFG_PARCIAL), ['docs/**', RUTA_TAREAS_SIEMPRE_DOCUMENTACION, 'src/web/**']);
 });
 
@@ -253,6 +264,26 @@ test('config (TASK-096): rutas_verificacion_parcial es conocida, va con la selec
         'comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node s.js"\nrutas_verificacion_parcial: [../fuera/**]\n',
         'c.yml'
       ),
-    /sale del repo/
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError);
+      assert.match(e.message, /sale del repo/);
+      // MEN-2 de la revision: el error nombra la clave nueva, no rutas_documentacion.
+      assert.match(e.message, /rutas_verificacion_parcial/);
+      assert.doesNotMatch(e.message, /rutas_documentacion/);
+      return true;
+    }
+  );
+  assert.throws(
+    () =>
+      parsearConfig(
+        'comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node s.js"\nrutas_verificacion_parcial: src\n',
+        'c.yml'
+      ),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError);
+      assert.match(e.message, /rutas_verificacion_parcial/);
+      assert.doesNotMatch(e.message, /rutas_documentacion/);
+      return true;
+    }
   );
 });
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 51da391d65140d9c41401284fe8f43a5a9c1492b..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-096/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-096/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-096/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-096/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-096/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-096/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-096/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-096/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-096/revision/informe-revision-1.md                                                  |  55 ++++++++++
 tareas/03-en-revision/TASK-096/revision/peticion-revision-1.md                                                 | 451 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-096/tarea.md                                                       |  10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/verificacion-proporcional.js                        |   5 +
 12 files changed, 518 insertions(+), 3 deletions(-)
````
