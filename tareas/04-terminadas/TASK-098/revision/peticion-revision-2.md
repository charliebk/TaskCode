# Peticion de revision — TASK-098 (ronda 2)

- Tarea: TASK-098 — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes
- Rama revisada: feature/task-098-roadmap-de-tareas-generado-por-taskctl-e
- Rama base: develop
- Commit revisado (HEAD): 8ea9b9707226be642cce5c147fe7aa4f8ce48f7e
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-098 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde eb332ddb581190e3e4b8f0810c56a14de5d7c9a7 (el commit revisado en la ronda anterior)
- Alcance: completa (motivo: la ronda anterior tiene un IMPORTANTE (IMP-1, abierto))

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

- tareas/03-en-revision/TASK-098/tarea.md
- tareas/03-en-revision/TASK-098/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts (`extraerEstructura`), con efecto en src/fs/roadmap.ts y src/commands/roadmap.ts | informe-revision-1.md |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts (titulo y complejidad sin comparar; `tareas.set` pisa duplicados) | informe-revision-1.md |

## Commits a revisar (git log eb332ddb581190e3e4b8f0810c56a14de5d7c9a7..HEAD)

````
8ea9b97 docs(TASK-098): autorrevision ronda 2
63e925e fix(TASK-098): comparar detecta texto propio fuera de la zona manual, titulo, complejidad y duplicadas
ea0fc77 chore(TASK-098): coste revision +3319896 tokens (1 agente)
95d12b4 docs(TASK-098): informe de revision ronda 1
49c9ba9 chore(TASK-098): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff eb332ddb581190e3e4b8f0810c56a14de5d7c9a7..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index d2acd8e..d1fc9e5 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -25,8 +25,9 @@ manual:inicio ... -->` y `<!-- manual:fin -->`) se conserva byte a byte y sus
 un ciclo de dependencias sale en su propia seccion y como aviso, y una
 `tarea.md` ilegible deja el fichero como estaba; nada tumba una transicion.
 Comando nuevo `taskctl roadmap [--comparar | --escribir]`: sin flags lo
-muestra; `--comparar` lista sin escribir lo que difiere del actual (tareas,
-hitos, dependencias, estado, zona manual) y sale con 1 si hay diferencias, que
+muestra; `--comparar` lista sin escribir lo que difiere del actual (tareas
+con titulo, complejidad, dependencias y estado, hitos, filas duplicadas, zona
+manual y el texto propio fuera de ella que se perderia) y sale con 1 si hay diferencias, que
 es la comprobacion previa a migrar un proyecto con ROADMAP propio;
 `--escribir` lo regenera sin commitear y sobre uno ajeno solo si `--comparar`
 saldria limpio. Guia en la skill `task-workflow` (`roadmap.md`) y en el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index ea086a1..a529216 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -656,7 +656,8 @@ título y el orden de su tabla.
 
 **Comando.** `taskctl roadmap` muestra el que se generaría, sin escribir.
 `taskctl roadmap --comparar` lista, sin escribir nada, lo que difiere del
-actual (tareas, hitos, dependencias, estado y zona manual) y sale con 1 si hay
+actual (tareas con su título, complejidad, dependencias y estado, hitos, filas
+duplicadas, zona manual y el texto propio fuera de ella que se perdería) y sale con 1 si hay
 diferencias. `taskctl roadmap --escribir` lo regenera sin commitear, aunque no
 exista o tenga historia; sobre uno sin la marca, solo si `--comparar` saldría
 limpio.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md
index 4adaba3..15d3e1c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md
@@ -58,8 +58,10 @@ Mientras el ROADMAP propio no lleve la marca, taskctl lo deja en paz. Para
 pasarlo al de taskctl:
 
 1. `taskctl roadmap --comparar`: genera en seco y lista, sin escribir nada,
-   lo que difiere del actual (tareas, hitos, dependencias, estado y zona
-   manual). Sale con 1 si hay diferencias.
+   lo que difiere del actual (tareas con su titulo, complejidad,
+   dependencias y estado, hitos, filas duplicadas, zona manual y cualquier
+   texto propio fuera de la zona manual que se perderia). Sale con 1 si hay
+   diferencias.
 2. Corrige lo que salga: normalmente, mover a una zona manual los textos y
    los `### Hn — titulo` de los hitos, o arreglar dependencias y estados que
    el script propio calculaba distinto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
index 40835ba..b745383 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
@@ -10,13 +10,17 @@
  * El extractor es tolerante: lee las filas `| Paso | TASK-NNN | ... |`
  * bajo un `## Hn` fuera de la zona manual. Lo que parece una fila de
  * tarea y no casa con ese formato se declara "no comparable" en vez de
- * ignorarlo en silencio.
+ * ignorarlo en silencio. Cualquier otro texto del actual fuera de la zona
+ * manual que el generado no lleve se lista como "se perderia" (H1 de la
+ * revision: antes un parrafo o una seccion propia se borraba en silencio
+ * con `--escribir`).
  */
 import { extraerZonaManual, normalizarFinales } from './roadmap.js';
 
 export interface FilaRoadmap {
   hito: number;
   titulo: string;
+  complejidad: string;
   dependencias: string[];
   estado: string;
 }
@@ -28,8 +32,20 @@ export interface EstructuraRoadmap {
   zonaManual: string | null;
   /** Lineas que parecen filas de tarea pero no se han podido leer. */
   noComparables: string[];
+  /** Filas de una tarea que ya habia salido antes (solo cuenta la primera). */
+  duplicadas: string[];
+  /**
+   * Lineas no vacias fuera de la zona manual que no son estructura leida
+   * (filas de tarea, encabezados `## Hn`, cabecera y separador de sus
+   * tablas, comentarios HTML de una linea ni los resumenes que el generador
+   * recalcula). Si el generado no las lleva, migrar las pierde.
+   */
+  textoPropio: string[];
 }
 
+/** Lineas que el generador recalcula siempre: no son contenido propio. */
+const DERIVADA_RE = /^(?:\d+ de \d+ terminadas\.|- \*\*(?:En marcha|Listas para empezar):\*\* .*)$/;
+
 /** Separa las celdas de una fila de tabla Markdown respetando los `\|` escapados. */
 function celdas(linea: string): string[] {
   const cuerpo = linea.trim().replace(/^\|/, '').replace(/\|$/, '');
@@ -66,6 +82,8 @@ export function extraerEstructura(texto: string): EstructuraRoadmap {
   const tareas = new Map<string, FilaRoadmap>();
   const hitos = new Map<number, string>();
   const noComparables: string[] = [];
+  const duplicadas: string[] = [];
+  const textoPropio: string[] = [];
   let hito: number | null = null;
   for (const linea of fuera.split('\n')) {
     const h = /^## H(\d+)(?:\s+—\s+(.*))?\s*$/.exec(linea);
@@ -74,25 +92,38 @@ export function extraerEstructura(texto: string): EstructuraRoadmap {
       hitos.set(hito, (h[2] ?? '').trim());
       continue;
     }
+    const recortada = linea.trim();
     if (/^#{1,2} /.test(linea)) {
       hito = null;
+      textoPropio.push(recortada);
+      continue;
+    }
+    if (!recortada.startsWith('|') || !/TASK-\d+/.test(linea)) {
+      const cabeceraDeTabla = hito !== null && recortada.startsWith('|');
+      if (recortada !== '' && !cabeceraDeTabla && !/^<!--.*-->$/.test(recortada) && !DERIVADA_RE.test(recortada)) {
+        textoPropio.push(recortada);
+      }
       continue;
     }
-    if (!linea.trimStart().startsWith('|') || !/TASK-\d+/.test(linea)) continue;
     const cs = celdas(linea);
     const id = cs[1] ?? '';
     if (hito === null || cs.length !== 6 || !/^TASK-\d+$/.test(id)) {
       noComparables.push(linea);
       continue;
     }
+    if (tareas.has(id)) {
+      duplicadas.push(linea);
+      continue;
+    }
     tareas.set(id, {
       hito,
       titulo: cs[2] ?? '',
+      complejidad: cs[3] ?? '',
       dependencias: listaDeps(cs[4] ?? ''),
       estado: cs[5] ?? '',
     });
   }
-  return { tareas, hitos, zonaManual, noComparables };
+  return { tareas, hitos, zonaManual, noComparables, duplicadas, textoPropio };
 }
 
 function numero(id: string): number {
@@ -145,6 +176,10 @@ export function compararRoadmaps(actual: string, generado: string): string[] {
       continue;
     }
     if (fa.hito !== fg.hito) difs.push(`${id}: hito H${fa.hito} en el actual y H${fg.hito} en el generado.`);
+    if (fa.titulo !== fg.titulo) difs.push(`${id}: titulo "${fa.titulo}" en el actual y "${fg.titulo}" en el generado.`);
+    if (fa.complejidad !== fg.complejidad) {
+      difs.push(`${id}: complejidad "${fa.complejidad}" en el actual y "${fg.complejidad}" en el generado.`);
+    }
     if (!mismaLista(fa.dependencias, fg.dependencias)) {
       const fmt = (l: readonly string[]): string => (l.length === 0 ? '—' : l.join(', '));
       difs.push(
@@ -157,5 +192,10 @@ export function compararRoadmaps(actual: string, generado: string): string[] {
   }
 
   for (const l of a.noComparables) difs.push(`fila no comparable en el actual: ${l.trim()}`);
+  for (const l of a.duplicadas) difs.push(`fila duplicada en el actual (solo cuenta la primera): ${l.trim()}`);
+  const delGenerado = new Set(normalizarFinales(generado).split('\n').map((l) => l.trim()));
+  for (const l of a.textoPropio) {
+    if (!delGenerado.has(l)) difs.push(`texto fuera de la zona manual que se perderia: ${l}`);
+  }
   return difs;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
index 9548945..07e983d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
@@ -242,7 +242,10 @@ test('roadmap --comparar no escribe nada y lista lo que difiere de un ROADMAP aj
     assert.match(c.salida, /no lleva la marca de taskctl/);
     assert.match(c.salida, /TASK-009: estado "▶ en revisión" en el actual y "✅ terminada" en el generado\./);
     assert.match(c.salida, /TASK-001: solo en el actual \(H0\)\./);
-    assert.doesNotMatch(c.salida, /zona manual/);
+    // La zona manual de OpenDockTrading se conserva tal cual (ninguna
+    // diferencia "zona manual:"); su texto fuera de la zona si se lista.
+    assert.doesNotMatch(c.salida, /^\s*- zona manual:/m);
+    assert.match(c.salida, /texto fuera de la zona manual que se perderia: /);
     assert.ok(bytes(rutaRoadmap(repoRoot)).equals(original));
     assert.equal(porcelain(repoRoot), '');
     assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts
index 49e9315..b31ecc4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts
@@ -180,3 +180,34 @@ test('compararRoadmaps: lee los ROADMAP reales y declara no comparable lo que no
   const raro = `# R\n\n## H0 — x\n\n| 1 | TASK-001 | solo cuatro | celdas |\n`;
   assert.deepEqual(compararRoadmaps(raro, raro), ['fila no comparable en el actual: | 1 | TASK-001 | solo cuatro | celdas |']);
 });
+
+// H1 de la revision (ronda 1): texto propio fuera de la zona manual se perdia
+// con `--escribir` y `--comparar` salia limpio.
+test('compararRoadmaps: el texto propio fuera de la zona manual cuenta como diferencia', () => {
+  const g = generarRoadmap([t('TASK-001', { sprint: 1 })], MANUAL).texto;
+  const ajeno =
+    g.replace(MARCA_TASKCTL, '<!-- generado por mi script -->') +
+    '\nTEXTO PROPIO FUERA DE ZONA: contexto del negocio.\n\n## Notas de riesgos\n\nNO BORRAR: entregar H1 antes del 15.\n\n| Riesgo | Mitigacion |\n|---|---|\n| a | b |\n';
+  const difs = compararRoadmaps(ajeno, g);
+  for (const l of ['TEXTO PROPIO FUERA DE ZONA: contexto del negocio.', '## Notas de riesgos', 'NO BORRAR: entregar H1 antes del 15.', '| Riesgo | Mitigacion |', '| a | b |']) {
+    assert.ok(difs.includes(`texto fuera de la zona manual que se perderia: ${l}`), `${l}\n${difs.join('\n')}`);
+  }
+  // Solo cambia la marca (comentario de una linea): sigue limpio.
+  assert.deepEqual(compararRoadmaps(g.replace(MARCA_TASKCTL, '<!-- generado por mi script -->'), g), []);
+  // Los resumenes que el generador recalcula no cuentan como texto propio.
+  const otroResumen = g.replace('- **Listas para empezar:** TASK-001', '- **Listas para empezar:** ninguna');
+  assert.ok(!compararRoadmaps(otroResumen, g).some((d) => d.startsWith('texto fuera')), compararRoadmaps(otroResumen, g).join('\n'));
+});
+
+// MEN-1 de la revision (ronda 1).
+test('compararRoadmaps: compara titulo y complejidad y avisa de filas duplicadas', () => {
+  const g = generarRoadmap([t('TASK-001', { sprint: 1 })], MANUAL).texto;
+  const fila = g.split('\n').find((l) => l.includes('| TASK-001 |'))!;
+  const cs = fila.split('|');
+  const retocada = g.replace(fila, fila.replace(`|${cs[3]}|`, '| Otro titulo |').replace(`|${cs[4]}|`, '| compleja |'));
+  const difs = compararRoadmaps(retocada, g);
+  assert.ok(difs.some((d) => d.startsWith('TASK-001: titulo "Otro titulo"')), difs.join('\n'));
+  assert.ok(difs.some((d) => d.startsWith('TASK-001: complejidad "compleja"')), difs.join('\n'));
+  const duplicada = g.replace(fila, `${fila}\n${fila}`);
+  assert.ok(compararRoadmaps(duplicada, g).some((d) => d.startsWith('fila duplicada en el actual')));
+});
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff eb332ddb581190e3e4b8f0810c56a14de5d7c9a7..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-098/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-098/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-098/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-098/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-098/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-098/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-098/revision/informe-revision-1.md                                                  |   63 +++
 tareas/03-en-revision/TASK-098/revision/peticion-revision-1.md                                                 | 2436 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-098/tarea.md                                                       |   10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roadmap-comparar.js                                 |   37 +-
 10 files changed, 2540 insertions(+), 6 deletions(-)
````
