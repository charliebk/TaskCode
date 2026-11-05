# Peticion de revision — TASK-075 (ronda 2)

- Tarea: TASK-075 — Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+
- Rama revisada: fix/task-075-contrapruebas-de-descubrimiento-rotas-po
- Rama base: develop
- Commit revisado (HEAD): 491f45031f08c3a06e25b7b13d8707bf6ff7f75a
- Fecha: 2026-11-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-075 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde b2f8dca9671670b3112e669cb053595e431b43fd (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | test/helpers/validador-claude.ts (corte por la primera aparicion de la frase) | informe-revision-1.md |

## Commits a revisar (git log b2f8dca9671670b3112e669cb053595e431b43fd..HEAD)

````
491f450 fix(TASK-075): correccion de la revision ronda 1 (MEN-1)
9e51fb5 chore(TASK-075): veredicto ronda 1 (cambios-solicitados)
69b67ba chore(TASK-075): coste revision +5235856 tokens (1 agente)
910b64a docs(TASK-075): informe de revision ronda 1
5ff14f1 chore(TASK-075): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff b2f8dca9671670b3112e669cb053595e431b43fd..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/validador-claude.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/validador-claude.ts
index bc0db9a..437b8b1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/validador-claude.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/validador-claude.ts
@@ -17,8 +17,12 @@ export interface ResultadoValidate {
 }
 
 const CRUZ = '✘';
-/** Primera linea del bloque del directorio de plugins (Claude Code 2.1.316+). */
-const MARCA_DIRECTORIO = 'Plugin directory checks';
+/**
+ * Primera linea del bloque del directorio de plugins (Claude Code 2.1.316+),
+ * anclada al principio de linea: la frase dentro de una ruta o de un mensaje
+ * no corta (MEN-1 de la revision de TASK-075).
+ */
+const MARCA_DIRECTORIO = /^Plugin directory checks for /m;
 const RESULTADO_OK = 'Validation passed';
 
 export function claudeDisponible(): boolean {
@@ -51,7 +55,7 @@ export function validacionLimpia(r: ResultadoValidate): { ok: boolean; motivo: s
   if (!ultima.includes(RESULTADO_OK)) {
     return { ok: false, motivo: `la ultima linea no dice "${RESULTADO_OK}": "${ultima}"` };
   }
-  const i = r.salida.indexOf(MARCA_DIRECTORIO);
+  const i = r.salida.search(MARCA_DIRECTORIO);
   const resultado = i === -1 ? r.salida : r.salida.slice(0, i);
   if (resultado.includes(CRUZ)) return { ok: false, motivo: 'hay errores antes de las comprobaciones del directorio' };
   return { ok: true, motivo: '' };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/validador-claude.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/validador-claude.test.ts
index 228f315..de9abfe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/validador-claude.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/validador-claude.test.ts
@@ -70,6 +70,15 @@ test('validador (TASK-075): exit 0 con una cruz ANTES del bloque del directorio
   assert.match(r.motivo, /antes de las comprobaciones del directorio/);
 });
 
+test('validador (MEN-1): la frase del bloque dentro de una ruta no corta: el error de despues cuenta', () => {
+  const salida =
+    'Validating agent: /x/Plugin directory checks/agents/a.md\n\n✘ Found 1 error:\n\n  ❯ frontmatter: roto\n\n' +
+    `${DIRECTORIO}\n✔ Validation passed\n`;
+  const r = validacionLimpia({ status: 0, salida });
+  assert.equal(r.ok, false, 'falso verde: el corte se hizo en la ruta');
+  assert.match(r.motivo, /antes de las comprobaciones del directorio/);
+});
+
 test('validador (TASK-075): «Validation passed with warnings» tambien cuenta como paso', () => {
   const salida = COPIA_INTACTA.replace('Validation passed', 'Validation passed with warnings');
   assert.equal(validacionLimpia({ status: 0, salida }).ok, true);
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff b2f8dca9671670b3112e669cb053595e431b43fd..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-075/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-075/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-075/revision/informe-revision-1.md                               |  54 +++++++++++++++
 tareas/03-en-revision/TASK-075/revision/peticion-revision-1.md                              | 358 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-075/tarea.md                                    |   6 +-
 5 files changed, 416 insertions(+), 2 deletions(-)
````
