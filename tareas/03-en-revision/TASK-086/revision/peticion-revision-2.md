# Peticion de revision — TASK-086 (ronda 2)

- Tarea: TASK-086 — Descontar las pausas de las duraciones de las metricas
- Rama revisada: feature/task-086-descontar-las-pausas-de-las-duraciones-d
- Rama base: develop
- Commit revisado (HEAD): 4c1e0e70e3ab325eb38a06a1342c1247942ba1e7
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-086 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 8c8b58550114c85d01a7b8b01ce3af269339bb58 (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | src/core/metricas.ts (marcasDe + intervalosDePausa) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | docs/METRICAS.md §14 (enPausa) | informe-revision-1.md |

## Commits a revisar (git log 8c8b58550114c85d01a7b8b01ce3af269339bb58..HEAD)

````
4c1e0e7 fix(TASK-086): desempate cronologico con origen git y enPausa 0 documentado (MEN-1, MEN-2)
ad2b97a chore(TASK-086): veredicto ronda 1 (cambios-solicitados)
d4bcab1 chore(TASK-086): coste revision +4297192 tokens (1 agente)
90b6190 docs(TASK-086): informe de revision ronda 1
d4db092 chore(TASK-086): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 8c8b58550114c85d01a7b8b01ce3af269339bb58..HEAD)

````diff
diff --git a/docs/METRICAS.md b/docs/METRICAS.md
index d4c3e14..eceb673 100644
--- a/docs/METRICAS.md
+++ b/docs/METRICAS.md
@@ -703,7 +703,9 @@ sola fila: es el «no» a pasar de fase, y no existe una transición de
 Lo descontado sale en `--json`, en la lista `pausas` (una entrada por tarea
 con alguna fila `pausa`: `proyecto`, `id`, `pausas` y `enPausa`). `enPausa` es
 `{ valor, precision }`
-en milisegundos, `valor: 0` si no hubo pausas cerradas y `null` si no se pudo
+en milisegundos; `valor: 0` si ninguna pausa cerrada cae dentro de lo medido (del
+primer `plan` a la última marca: una pausa en una tarea que aún no tiene
+`start` no tiene fase donde restarse) y `null` si no se pudo
 aplicar (sin marcas o con precisión de día). Una tarea sin pausas da
 exactamente la misma duración que antes de TASK-086.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 8636e9b..930460e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -191,8 +191,8 @@ export interface FilaMetricas {
   total: Duracion | null;
   /**
    * TASK-086: lo descontado por pausas entre el primer `plan` y el ultimo
-   * `finish` (o la ultima marca medida si no hay `finish`); `valor: 0` si no
-   * hubo pausas cerradas. null = no se aplico: sin marcas de segundo que
+   * `finish` (o la ultima marca medida si no hay `finish`); `valor: 0` si
+   * ninguna pausa cerrada cae dentro de lo medido. null = no se aplico: sin marcas de segundo que
    * medir (origen «—» o precision de dia). Nunca un 0 por ausencia.
    */
   enPausa: Duracion | null;
@@ -374,8 +374,13 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     marcas = marcasDe(registro);
   } else if (e.eventosGit.length > 0) {
     origen = 'git';
+    // TASK-086 (MEN-1): git log va de lo mas nuevo a lo mas viejo. Se invierte
+    // antes del sort estable para que dos commits del mismo segundo queden en
+    // orden cronologico (una pausa delante de la transicion que la cierra).
     marcas = marcasDe(
-      e.eventosGit.map((g) => ({ fase: g.fase, marca: { ms: g.ms, precision: 'segundo' as const } }))
+      [...e.eventosGit]
+        .reverse()
+        .map((g) => ({ fase: g.fase, marca: { ms: g.ms, precision: 'segundo' as const } }))
     );
   } else {
     origen = '—';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
index b0f012f..d858952 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
@@ -273,6 +273,25 @@ test('TASK-086: origen git, el commit "pausa registrada" se descuenta igual que
   assert.deepEqual(f.enPausa, { valor: 90 * MIN, precision: 'segundo' });
 });
 
+test('TASK-086 (MEN-1): origen git con pausa y transicion en el mismo segundo no descuenta de mas', () => {
+  const ev = (fase: EventoGit['fase'], iso: string): EventoGit => ({ id: 'TASK-007', fase, ms: Date.parse(iso) });
+  // En orden de git log: la pausa (anterior) va DETRAS del review del mismo segundo.
+  const f = calcularFila(
+    entrada({
+      eventosGit: [
+        ev('finish', '2026-10-05T15:00:00Z'),
+        ev('review', '2026-10-05T14:00:00Z'),
+        ev('pausa', '2026-10-05T14:00:00Z'),
+        ev('start', '2026-10-05T12:00:00Z'),
+        ev('plan', '2026-10-05T10:00:00Z'),
+      ],
+      ronda: 1,
+    })
+  );
+  assert.deepEqual(f.enPausa, { valor: 0, precision: 'segundo' });
+  assert.deepEqual(f.revision, { valor: 60 * MIN, precision: 'segundo' });
+});
+
 test('TASK-086: una pausa que cruza el limite de dos fases reparte el descuento', () => {
   const pausa = [{ desde: seg('2026-10-05T11:00:00Z'), hasta: seg('2026-10-05T13:00:00Z') }];
   assert.deepEqual(duracionSinPausas(seg('2026-10-05T10:00:00Z'), seg('2026-10-05T12:00:00Z'), pausa), { valor: 60 * MIN, precision: 'segundo' });
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 8c8b58550114c85d01a7b8b01ce3af269339bb58..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-086/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-086/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-086/revision/informe-revision-1.md                               |  48 +++++++++
 tareas/03-en-revision/TASK-086/revision/peticion-revision-1.md                              | 594 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-086/tarea.md                                    |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                      |   7 +-
 6 files changed, 652 insertions(+), 3 deletions(-)
````
