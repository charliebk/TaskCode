# Peticion de revision — TASK-108 (ronda 2)

- Tarea: TASK-108 — Verificacion proporcional B5: el guardian de merges ante el nivel 2
- Rama revisada: feature/task-108-verificacion-proporcional-b5-el-guardian
- Rama base: develop
- Commit revisado (HEAD): 7d76f6a3b79ccdcf781bca8e2553a7cc758a2c45
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-108 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde aeb40d9b77fd3075072e0ee7dabc83bd78eca304 (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-108/tarea.md
- tareas/03-en-revision/TASK-108/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido (5cd4dee) | taskcode-plugin/src/hooks/guardia-merge.ts:289-291 (rama `selectiva` de `exencionDocumentacion`) | informe-revision-1.md |
| MEN-2 | MENOR | corregido (5cd4dee) | taskcode-plugin/test/hooks/guardia-documentacion.test.ts (tests TASK-108) | informe-revision-1.md |

## Commits a revisar (git log aeb40d9b77fd3075072e0ee7dabc83bd78eca304..HEAD)

````
7d76f6a docs(TASK-108): autorrevision ronda 2
bc1c0f6 docs(TASK-108): MEN-1 y MEN-2 corregidos
5cd4dee fix(TASK-108): release y hotfix no reciben la linea de la selectiva (MEN-1, MEN-2)
aa95f36 chore(TASK-108): veredicto ronda 1 (cambios-solicitados)
1ec35ec chore(TASK-108): coste revision +4862899 tokens (1 agente)
107fbb9 docs(TASK-108): informe de revision ronda 1
663dab3 chore(TASK-108): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff aeb40d9b77fd3075072e0ee7dabc83bd78eca304..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 0a261d7..c937868 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -286,13 +286,18 @@ function exencionDocumentacion(
   // lee el memo `selectiva`. Su motivo propio («basta la verificacion de lo
   // afectado») contradiria el bloqueo, asi que se ensena uno neutro y una linea
   // que dice que hace falta y como integrar.
+  // MEN-1 de la revision de TASK-108: un release va antes que la selectiva, o
+  // recibiria una linea que habla de la tarea y de finish TASK-NNN.
+  if (integ.release && d.tipo !== 'completa') {
+    return { pasa: false, detalle: 'Un release lleva a la principal todo lo acumulado: siempre exige la verificacion completa.' };
+  }
   if (d.tipo === 'selectiva') {
-    return { pasa: false, detalle: `No es solo documentacion: la tarea cambia rutas que no son documentacion.\n${LINEA_SELECTIVA}` };
+    // Hacia la principal (un hotfix) finish tampoco acepta la selectiva: la
+    // linea mentiria, asi que queda solo el motivo neutro.
+    const neutro = 'No es solo documentacion: la tarea cambia rutas que no son documentacion.';
+    return { pasa: false, detalle: destino === ramaPrincipal(raiz) ? neutro : `${neutro}\n${LINEA_SELECTIVA}` };
   }
   if (d.tipo !== 'documentacion') return { pasa: false, detalle: `No es solo documentacion: ${d.motivo}.` };
-  if (integ.release) {
-    return { pasa: false, detalle: 'Un release lleva a la principal todo lo acumulado: siempre exige la verificacion completa.' };
-  }
   if (!contexto.soloIntegra) {
     return {
       pasa: false,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
index 29f8ba4..f0b1da0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -419,3 +419,24 @@ test('guardian (TASK-108): sin rutas_verificacion_parcial, con codigo, se compor
     assert.equal(guardian(e, mergeA(task.rama)).codigo, 0);
   });
 });
+
+test('guardian (TASK-108, MEN-1/MEN-2): con nivel 2, un release con codigo conserva su detalle y un hotfix no promete la selectiva', async () => {
+  await conEntorno(({ docs }) => PARCIAL(docs), async (e) => {
+    // Release con codigo hacia develop: su detalle propio, sin la linea de la tarea.
+    git(['checkout', '-q', '-b', 'release/1.0', 'develop'], e.repoRoot);
+    await enLaRama(e, 'src/ui/boton.ts', 'export const b = 1;\n');
+    const rel = guardian(e, mergeA('release/1.0'));
+    assert.equal(rel.codigo, 2);
+    assert.match(rel.stderr ?? '', /Un release lleva a la principal todo lo acumulado: siempre exige la verificacion completa\./);
+    assert.doesNotMatch(rel.stderr ?? '', LINEA_COMPLETA);
+    // Hotfix con codigo hacia la principal: finish tampoco acepta alli la selectiva.
+    git(['checkout', '-q', 'main'], e.repoRoot);
+    git(['merge', '-q', '--ff-only', 'develop'], e.repoRoot);
+    git(['checkout', '-q', '-b', 'hotfix/1.0.1', 'main'], e.repoRoot);
+    await enLaRama(e, 'src/ui/arreglo.ts', 'export const a = 1;\n');
+    const hot = guardian(e, 'git checkout main && git merge --no-ff hotfix/1.0.1');
+    assert.equal(hot.codigo, 2);
+    assert.match(hot.stderr ?? '', /No es solo documentacion: la tarea cambia rutas que no son documentacion\.\n/);
+    assert.doesNotMatch(hot.stderr ?? '', LINEA_COMPLETA);
+  });
+});
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff aeb40d9b77fd3075072e0ee7dabc83bd78eca304..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-108/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-108/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-108/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-108/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-108/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-108/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-108/revision/informe-revision-1.md                                                  |  61 +++++++++++++++++
 tareas/03-en-revision/TASK-108/revision/peticion-revision-1.md                                                 | 305 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-108/tarea.md                                                       |  10 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                   |  13 ++--
 10 files changed, 382 insertions(+), 7 deletions(-)
````
