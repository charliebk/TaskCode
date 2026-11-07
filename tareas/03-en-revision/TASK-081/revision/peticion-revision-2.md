# Peticion de revision — TASK-081 (ronda 2)

- Tarea: TASK-081 — Revision mas barata: medir y acotar las lecturas de los revisores
- Rama revisada: feature/task-081-revision-mas-barata-medir-y-acotar-las-l
- Rama base: develop
- Commit revisado (HEAD): fa3c0b12425a259071458182807be6772b50c17d
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-081 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 4f0243f23d350f54c72370f93f4d1d3ae5bcc3bc (el commit revisado en la ronda anterior)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-081/tarea.md
- tareas/03-en-revision/TASK-081/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/contexto-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-contexto.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/commands/registrar-coste.ts:358 | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/core/contexto-revision.ts:72 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/core/coste-transcripcion.ts (rondaYRevisorDeTranscripcion) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | test/ (sin cobertura de M8) | informe-revision-1.md |
| MEN-5 | MENOR | abierto | skills/*-reviewer/SKILL.md | informe-revision-1.md |

## Commits a revisar (git log 4f0243f23d350f54c72370f93f4d1d3ae5bcc3bc..HEAD)

````
fa3c0b1 chore(TASK-081): coste revision +421902 tokens (1 agente)
a398877 fix(TASK-081): correcciones de la revision ronda 1 (MEN-1, MEN-2, MEN-4)
8fd6de9 chore(TASK-081): veredicto ronda 1 (cambios-solicitados)
4161384 chore(TASK-081): coste revision +12542435 tokens (1 agente)
b3386cc docs(TASK-081): informe de revision ronda 1
a0e23a1 chore(TASK-081): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 4f0243f23d350f54c72370f93f4d1d3ae5bcc3bc..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index 2702b7d..28cd1a3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -355,7 +355,7 @@ function leerAtribucionManual(
         `la suya. ${USO}`
     );
   }
-  if (typeof ronda !== 'string' || !/^[1-9]d*$/.test(ronda) || !Number.isSafeInteger(Number(ronda))) {
+  if (typeof ronda !== 'string' || !/^[1-9]\d*$/.test(ronda) || !Number.isSafeInteger(Number(ronda))) {
     throw new RegistrarCosteCommandError(
       `[ERROR] --ronda ${typeof ronda === 'string' ? `"${ronda}" no es` : 'necesita'} un entero de 1 o mas ` +
         `(el N de peticion-revision-N.md). ${USO}`
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/contexto-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/contexto-revision.ts
index bfd7979..c6de146 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/contexto-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/contexto-revision.ts
@@ -55,6 +55,19 @@ export function casaConAlguno(ruta: string, patrones: readonly string[]): boolea
   return patrones.some((p) => globARegExp(p).test(ruta));
 }
 
+/**
+ * Una carpeta que contiene (o es) la de tests reservados de alguna tarea:
+ * `.`, `tareas`, `tareas/<estado>`, `tareas/<estado>/TASK-NNN` o su
+ * `aceptacion`. `EXCLUIR_HELDOUT` solo casa con lo que ya esta DENTRO de
+ * `aceptacion/`, asi que listar una carpeta padre los colaria (MEN-2, r1).
+ */
+function contieneHeldout(ruta: string): boolean {
+  const segmentos = ruta.replace(/\/+$/, '').split('/').filter((s) => s !== '' && s !== '.');
+  const molde = EXCLUIR_HELDOUT.split('/').slice(0, -1); // sin el `**` final
+  if (segmentos.length > molde.length) return false;
+  return segmentos.every((s, i) => globARegExp(molde[i] as string).test(s));
+}
+
 function normalizar(ruta: string): string {
   return ruta.trim().replace(/\\/g, '/').replace(/^\.\//, '');
 }
@@ -76,6 +89,7 @@ export function contextoPermitido(entrada: EntradaContexto): string[] {
   const resto = [...entrada.ficherosDelGrupo, ...entrada.extra]
     .map(normalizar)
     .filter((r) => r !== '')
-    .filter((r) => !casaConAlguno(r, [...entrada.excluir, EXCLUIR_HELDOUT]));
+    .filter((r) => !casaConAlguno(r, [...entrada.excluir, EXCLUIR_HELDOUT]))
+    .filter((r) => !contieneHeldout(r));
   return [...new Set([...deLaTarea, ...resto])];
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-contexto.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-contexto.test.ts
index 0ea10eb..d9a12a3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-contexto.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-contexto.test.ts
@@ -136,6 +136,32 @@ test('contexto permitido (TASK-081): la funcion pura filtra grupo y extra con ex
   ]);
 });
 
+test('contexto permitido (TASK-081, MEN-2 r1): ni los tests reservados ni una carpeta que los contenga entran, aunque excluir no cubra tareas/**', () => {
+  const lista = contextoPermitido({
+    carpetaTarea: 'tareas/03-en-revision/TASK-1',
+    ficherosDelGrupo: ['src/a.ts'],
+    extra: [
+      '.',
+      'tareas',
+      'tareas/03-en-revision/',
+      'tareas/03-en-revision/TASK-1',
+      'tareas/03-en-revision/TASK-1/aceptacion',
+      'tareas/03-en-revision/TASK-1/aceptacion/caso.test.ts',
+      'tareas/03-en-revision/TASK-1/notas.md',
+      'docs',
+    ],
+    // Sin EXCLUIR_HELDOUT ni tareas/**: el filtro de reservados es de la propia funcion.
+    excluir: [],
+  });
+  assert.deepEqual(lista, [
+    'tareas/03-en-revision/TASK-1/tarea.md',
+    'tareas/03-en-revision/TASK-1/planificacion/',
+    'src/a.ts',
+    'tareas/03-en-revision/TASK-1/notas.md',
+    'docs',
+  ]);
+});
+
 test('contexto permitido (TASK-081): contexto_revision en config.yml es una lista y no ancla los patrones', () => {
   const RUTA = '/repo/.taskcode/config.yml';
   assert.deepEqual(parsearConfig('limite_wip: 1\n', RUTA).contexto_revision, []);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts
index d2ad411..c5c4130 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts
@@ -249,6 +249,8 @@ test('--ronda/--revisor: solo con un unico --agente, validados contra las petici
         [['--agente', Z, '--revisor', 'x-reviewer'], /--ronda necesita un entero/],
         [['--agente', Z, '--ronda', 'abc'], /--ronda "abc" no es un entero/],
         [['--agente', Z, '--ronda', '0'], /--ronda "0" no es un entero/],
+        // MEN-1 (r1): una ronda de dos cifras es un entero valido; aqui solo falla porque no existe.
+        [['--agente', Z, '--ronda', '10', '--revisor', 'x-reviewer'], /--ronda 10 no existe/],
         [['--agente', Z, '--agente', X, '--ronda', '1', '--revisor', 'x-reviewer'], /UN unico --agente/],
         [['--tokens', '10', '--ronda', '1'], /UN unico --agente/],
         [['--agente', W, '--ronda', '1', '--revisor', 'y-reviewer'], /nombra la ronda 1 y el revisor x-reviewer, y --ronda\/--revisor dicen otra cosa/],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts
index 0271b48..e185d79 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts
@@ -60,6 +60,16 @@ test('rondaYRevisorDeTranscripcion: solo mira el PRIMER mensaje de usuario', ()
   assert.deepEqual(rondaYRevisorDeTranscripcion(primero), { ronda: 1, revisor: 'x' });
 });
 
+test('rondaYRevisorDeTranscripcion (MEN-4 r1): salta las lineas que no son de usuario antes del primer mensaje user', () => {
+  const otras = [
+    JSON.stringify({ type: 'summary', summary: 'resumen previo' }),
+    JSON.stringify({ type: 'system', content: 'arranque' }),
+    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: 'mira peticion-revision-7-z.md' } }),
+  ];
+  const texto = unir([...otras, usuarioTexto(promptDeRevision('peticion-revision-2-y.md'))]);
+  assert.deepEqual(rondaYRevisorDeTranscripcion(texto), { ronda: 2, revisor: 'y' });
+});
+
 test('la regex de rondas es una sola: rondaYRevisorDePeticion da la misma clave que los informes', () => {
   assert.deepEqual(rondaYRevisorDePeticion('peticion-revision-2-x.md'), { ronda: 2, revisor: 'x' });
   assert.deepEqual(rondaYRevisorDePeticion('peticion-revision-2.md'), { ronda: 2, revisor: '' });
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 4f0243f23d350f54c72370f93f4d1d3ae5bcc3bc..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-081/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-081/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-081/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-081/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-081/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-081/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-081/planificacion/brainstorm/salida-brainstorm-testing-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-081/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-081/revision/informe-revision-1.md                                                  |  115 ++++
 tareas/03-en-revision/TASK-081/revision/peticion-revision-1.md                                                 | 2641 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-081/tarea.md                                                       |    7 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js                              |    2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/contexto-revision.js                                |   16 +-
 13 files changed, 2777 insertions(+), 4 deletions(-)
````
