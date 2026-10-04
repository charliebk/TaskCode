# Peticion de revision — TASK-056 (ronda 3)

- Tarea: TASK-056 — Flujo B: nucleo determinista del siguiente paso y registro de transiciones
- Rama revisada: feature/task-056-flujo-b-nucleo-determinista-del-siguient
- Rama base: develop
- Commit revisado (HEAD): f90787145d1da92726899578afd5b36b672312ad
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-056 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 4cada029547c05cae4b2cf2c2d17eee2b21f5f5a (el commit revisado en la ronda anterior)

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
| IMP-2 | IMPORTANTE | corregido (caso del informe 1); lo que queda, en IMP-4 | src/core/transiciones.ts:48-80 | informe-revision-2.md |
| IMP-4 | IMPORTANTE | abierto | src/core/transiciones.ts:49-62 (`dentroDeBloque`) | informe-revision-2.md |
| MEN-9 | MENOR | abierto | test/core/transiciones.test.ts | informe-revision-2.md |
| MEN-10 | MENOR | abierto | src/core/flujo.ts:55-59, 63-66, 148-158 | informe-revision-2.md |

## Commits a revisar (git log 4cada029547c05cae4b2cf2c2d17eee2b21f5f5a..HEAD)

````
f907871 fix(TASK-056): vallas de bloque segun CommonMark (IMP-4, MEN-9, MEN-10)
4010322 chore(TASK-056): veredicto ronda 2 (cambios-solicitados)
9223fa4 docs(TASK-056): informe de revision ronda 2
1a26461 chore(TASK-056): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 4cada029547c05cae4b2cf2c2d17eee2b21f5f5a..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 3a97b78..523154f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -52,8 +52,10 @@ export interface ContextoFlujo {
 export interface SiguientePaso {
   fase: FaseSiguiente;
   /**
-   * Comando de taskctl de esa fase, o null si lo que toca es trabajo de un
-   * agente sin comando propio (redactar el plan) o la tarea esta terminada.
+   * Comando de taskctl de esa fase, o null si no hay comando que la haga:
+   * redactar el plan (trabajo de agente), escribir el veredicto de la segunda
+   * opinion (`veredicto-codex`, lo escribe una persona a mano) o la tarea
+   * terminada.
    */
   comando: string | null;
   accion: AccionFlujo;
@@ -62,8 +64,10 @@ export interface SiguientePaso {
 
 /**
  * Fases que abren una fase NUEVA del ciclo: en semiautomatico se pregunta
- * antes de entrar. Las demas (veredicto, codex-review, otra ronda de
- * review) son pasos internos de la revision y siguen solas.
+ * antes de entrar. Las demas (veredicto, la primera codex-review, otra ronda
+ * de review) son pasos internos de la revision y siguen solas, salvo las que
+ * marcan `exigePersona`: el veredicto de la segunda opinion y otra
+ * codex-review tras pedir cambios preguntan en cualquier modo que encadene.
  */
 function accionPara(
   fase: FaseSiguiente,
@@ -152,7 +156,9 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
                 return paso(
                   'veredicto-codex',
                   false,
-                  'el informe de la segunda opinion no tiene veredicto: una persona lo lee y escribe su linea "- Veredicto:"',
+                  ctx.veredictoCodex === 'desconocido'
+                    ? 'el veredicto de la segunda opinion no se reconoce: una persona lo lee y reescribe su linea "- Veredicto:"'
+                    : 'el informe de la segunda opinion no tiene veredicto: una persona lo lee y escribe su linea "- Veredicto:"',
                   null,
                   true
                 );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 7f982e0..4d0c0f9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -45,20 +45,44 @@ function filaATexto(f: FilaTransicion): string {
   return `| ${f.fecha} | ${f.fase} | ${f.modo} | ${f.decidido_por} |`;
 }
 
-/** Para cada linea, si esta dentro de un bloque de codigo (``` o ~~~). */
+/** Valla de apertura de CommonMark: 0-3 espacios, 3+ ` o ~ (con ` el texto de info no lleva `). */
+const VALLA_APERTURA = /^ {0,3}(`{3,}(?=[^`]*$)|~{3,})/;
+
+/**
+ * Para cada linea, si esta dentro de un bloque de codigo cercado (incluidas
+ * sus vallas). Sigue las reglas de CommonMark (IMP-4 de la revision): cierra
+ * una valla del MISMO caracter, de longitud IGUAL O MAYOR, sin texto detras
+ * y con 0-3 espacios de sangria — asi un ```` que envuelve un ejemplo con
+ * ``` no se cierra en el interior.
+ *
+ * Una valla que no se cierra NO abre bloque. CommonMark la extenderia hasta
+ * el final del documento, pero aqui eso se tragaria la seccion real, que el
+ * CLI anade al final: un ``` olvidado en el enunciado dejaria la tarea sin
+ * registro ni modo congelado y duplicaria la seccion en cada transicion.
+ */
 function dentroDeBloque(lineas: readonly string[]): boolean[] {
-  let abierto: string | null = null;
-  return lineas.map((l) => {
-    const valla = /^\s*(`{3,}|~{3,})/.exec(l);
-    if (valla === null) return abierto !== null;
-    const marca = (valla[1] as string)[0] as string;
-    if (abierto === null) {
-      abierto = marca;
-      return true;
+  const enBloque = lineas.map(() => false);
+  let i = 0;
+  while (i < lineas.length) {
+    const apertura = VALLA_APERTURA.exec(lineas[i] as string);
+    if (apertura === null) {
+      i++;
+      continue;
     }
-    if (marca === abierto) abierto = null;
-    return true;
-  });
+    const valla = apertura[1] as string;
+    const caracter = valla[0] === '`' ? '`' : '~';
+    const cierre = new RegExp(`^ {0,3}\\${caracter}{${String(valla.length)},}\\s*$`);
+    let j = i + 1;
+    while (j < lineas.length && !cierre.test(lineas[j] as string)) j++;
+    if (j === lineas.length) {
+      // Sin cerrar: no es bloque (ver arriba). Se sigue por la linea siguiente.
+      i++;
+      continue;
+    }
+    for (let k = i; k <= j; k++) enBloque[k] = true;
+    i = j + 1;
+  }
+  return enBloque;
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index f4ae808..f9c803e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -136,4 +136,15 @@ test('siguienteFase: un veredicto que no se reconoce no se presenta como "falta
   const t = tarea({ estado: 'en-revision', plan_aprobado: true });
   assert.match(siguienteFase(t, { ...CTX, veredicto: 'desconocido' }, 'manual').motivo, /no se reconoce/);
   assert.match(siguienteFase(t, { ...CTX, veredicto: 'pendiente' }, 'manual').motivo, /falta el revisor/);
+  // Lo mismo en la segunda opinion (MEN-10).
+  const conCodex = tarea({ estado: 'en-revision', plan_aprobado: true, revision_codex: true });
+  const ctxCodex = { ...CTX, veredicto: 'aprobada' as const };
+  assert.match(
+    siguienteFase(conCodex, { ...ctxCodex, veredictoCodex: 'desconocido' }, 'manual').motivo,
+    /no se reconoce/
+  );
+  assert.match(
+    siguienteFase(conCodex, { ...ctxCodex, veredictoCodex: 'pendiente' }, 'manual').motivo,
+    /no tiene veredicto/
+  );
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
index c2eca99..589c76f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
@@ -107,6 +107,81 @@ test('filas de tabla dentro de un bloque de codigo en la propia seccion se ignor
   assert.deepEqual(leerTransiciones(cuerpo), [fila()]);
 });
 
+const EJEMPLO_TABLA =
+  '## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
+  '| 2026-01-01 | plan | automatico | persona |\n';
+
+test('IMP-4: un bloque de cuatro tildes que envuelve un ejemplo con tres no se cierra en el interior', () => {
+  const enunciado =
+    '## Objetivo\n\nAsi se documenta:\n\n````md\nAsi queda:\n```\n' +
+    EJEMPLO_TABLA +
+    '```\n````\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
+  assert.deepEqual(leerTransiciones(enunciado), []);
+  assert.equal(modoCongelado(enunciado), null);
+  const r = anadirTransicion(enunciado, fila());
+  assert.ok(r.startsWith(enunciado.trimEnd()), 'el ejemplo no cambia');
+  assert.deepEqual(leerTransiciones(r), [fila()]);
+});
+
+test('IMP-4: una valla sin cerrar en el enunciado no se traga la seccion real (no se duplica)', () => {
+  const enunciado = '## Objetivo\n\nEjecutar:\n\n```bash\nnpm test\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
+  let r = anadirTransicion(enunciado, fila({ modo: 'automatico' }));
+  r = anadirTransicion(r, fila({ fase: 'approve', modo: 'automatico', decidido_por: 'automatico' }));
+  assert.equal(r.split('\n').filter((l) => l === '## Transiciones').length, 1, 'una sola seccion');
+  assert.deepEqual(
+    leerTransiciones(r).map((f) => f.fase),
+    ['plan', 'approve']
+  );
+  assert.equal(modoCongelado(r), 'automatico');
+});
+
+test('IMP-4: una valla de cierre mas corta, con texto detras o de otro caracter no cierra', () => {
+  // Si cualquiera de esas lineas cerrase, el encabezado de ejemplo quedaria fuera de bloque.
+  for (const falsoCierre of ['```', '```` texto', '~~~~']) {
+    const cuerpo = `## Objetivo\n\n\`\`\`\`\n${falsoCierre}\n${EJEMPLO_TABLA}\`\`\`\`\n`;
+    assert.deepEqual(leerTransiciones(cuerpo), [], `falso cierre: ${falsoCierre}`);
+  }
+  // Una valla sangrada 4 espacios es codigo sangrado, no valla: no abre bloque,
+  // y el ``` de despues (sin pareja) tampoco. La tabla queda fuera de bloque.
+  const sangrada = '## Objetivo\n\n    ```\n\n' + EJEMPLO_TABLA + '```\n';
+  assert.equal(leerTransiciones(sangrada).length, 1);
+});
+
+test('MEN-9: tambien ~~~ es valla', () => {
+  const cuerpo = '## Objetivo\n\n~~~md\n' + EJEMPLO_TABLA + '~~~\n';
+  assert.deepEqual(leerTransiciones(cuerpo), []);
+});
+
+test('MEN-9: con dos encabezados reales, el registro es el ULTIMO', () => {
+  // Un "## Transiciones" suelto en el enunciado (sin bloque) no es el registro: el CLI escribe al final.
+  const cuerpo = '## Objetivo\n\n' + EJEMPLO_TABLA + '\n## Criterios de aceptacion\n- [ ] x\n';
+  const r = anadirTransicion(anadirTransicion(cuerpo, fila()), fila({ fase: 'start' }));
+  // anadirTransicion escribio en el que ya existia (el unico) la primera vez; desde ahi, el ultimo.
+  const conOtro = r + '\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n| 2026-10-05 | review | manual | persona |\n';
+  assert.deepEqual(
+    leerTransiciones(conOtro).map((f) => f.fase),
+    ['review']
+  );
+});
+
+test('MEN-9: un "## X" dentro de un bloque de la propia seccion no la corta, y la fila nueva no cae dentro del bloque', () => {
+  const base = anadirTransicion(CUERPO, fila());
+  const conBloque = base + '\n```md\n## Nota\n| 2026-01-01 | review | manual | persona |\n```\n';
+  const r = anadirTransicion(conBloque, fila({ fase: 'approve' }));
+  // La fila nueva va tras la ultima fila REAL de la tabla, antes del bloque, y se lee.
+  assert.deepEqual(
+    leerTransiciones(r).map((f) => f.fase),
+    ['plan', 'approve']
+  );
+  assert.ok(r.indexOf('| approve |') < r.indexOf('```md'), 'la fila no puede quedar dentro ni detras del bloque');
+  // Y una fila escrita a mano DESPUES del bloque sigue en la seccion: el "## Nota" del bloque no la corta.
+  const conFilaDetras = conBloque + '| 2026-10-06 | start | manual | persona |\n';
+  assert.deepEqual(
+    leerTransiciones(conFilaDetras).map((f) => f.fase),
+    ['plan', 'start']
+  );
+});
+
 test('registrarTransicion: plan toma el modo del config; el resto, el congelado aunque el config cambie', () => {
   const tras = registrarTransicion(CUERPO, 'plan', '2026-10-04', 'automatico');
   const aprobada = registrarTransicion(tras, 'approve', '2026-10-05', 'manual', 'automatico');
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 4cada029547c05cae4b2cf2c2d17eee2b21f5f5a..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/03-en-revision/TASK-056/revision/informe-revision-2.md              |  77 ++++++++++++++
 tareas/03-en-revision/TASK-056/revision/peticion-revision-2.md             | 686 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-056/tarea.md                                    |  26 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js        |  10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js |  51 ++++++---
 5 files changed, 833 insertions(+), 17 deletions(-)
````
