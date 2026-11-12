# Peticion de revision — TASK-109 (ronda 2)

- Tarea: TASK-109 — Verificacion proporcional B6: documentacion y limpieza del nivel 2
- Rama revisada: feature/task-109-verificacion-proporcional-b6-documentaci
- Rama base: develop
- Commit revisado (HEAD): b11131115669ca04fc45757cb4f930a4f42ddb40
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-109 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 5d13a1b081e7f9c16fcd0ff66faa501b038cd1a8 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (6 hallazgo(s)))

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

- tareas/03-en-revision/TASK-109/tarea.md
- tareas/03-en-revision/TASK-109/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | verificacion-selectiva.md (§ «Cobertura omitida»), README.md (vineta de cobertura), CHANGELOG.md (parrafo del nivel 2) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | verificacion-selectiva.md y README.md (vineta del guardian), SKILL.md (linea equivalente); tambien `LINEA_SELECTIVA` de hooks/guardia-merge.ts | informe-revision-1.md |
| MEN-1 | MENOR | corregido | verificacion-selectiva.md (§ «Release y hotfix van siempre a la completa»), CHANGELOG.md, README.md | informe-revision-1.md |
| MEN-2 | MENOR | corregido | README.md (vineta de `taskctl finish`) y CHANGELOG.md («deciden igual») | informe-revision-1.md |

## Commits a revisar (git log 5d13a1b081e7f9c16fcd0ff66faa501b038cd1a8..HEAD)

````
b111311 docs(TASK-109): autorrevision ronda 2
b3bc4ce docs(TASK-109): estado de los hallazgos de la ronda 1
5ee2706 fix(TASK-109): cobertura, hotfix y remedio tras un conflicto dicen la verdad (IMP-1, IMP-2, MEN-1, MEN-2)
02024dc chore(TASK-109): veredicto ronda 1 (cambios-solicitados)
8c7a048 chore(TASK-109): coste revision +20489569 tokens (1 agente)
a49e081 docs(TASK-109): informe de revision ronda 1
b545ff2 chore(TASK-109): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 5d13a1b081e7f9c16fcd0ff66faa501b038cd1a8..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 4f2760c..c44e6a7 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -98,11 +98,16 @@ en ellas, `finish` corre `comando_verificacion_selectiva` (con `RAMA_BASE` y
 `timeout_verificacion_selectiva`) en vez de la completa, lo dice y lo anota tras
 el verde en la seccion `## Verificacion parcial`; reutiliza un verde selectivo
 del mismo commit y la misma base. Un fichero fuera, un cambio de
-`.taskcode/config.yml`, un diff vacio, un release o un hotfix van a la completa;
-la puerta de cobertura no se evalua con la selectiva (se mide en la completa del
-release). Exige `comando_verificacion_selectiva` (la config aborta sin ella) y
-`rutas_documentacion` (sin ellas no tiene efecto; `taskctl doctor` lo avisa). El
-freno Stop, `review` y `finish` deciden igual sobre el mismo diff (TASK-107).
+`.taskcode/config.yml`, un diff vacio o un release van a la completa; un hotfix
+nunca usa la selectiva (con codigo, la completa; de solo documentacion, su
+camino de documentacion). Con la selectiva, `finish` no evalua la puerta de
+cobertura y ninguna puerta posterior mide esas lineas (la del release solo mide
+lo que anade la rama release): con `umbral_cobertura`, esas tareas no se
+comparan con el. Exige `comando_verificacion_selectiva` (la config aborta sin
+ella) y `rutas_documentacion` (sin ellas no tiene efecto; `taskctl doctor` lo
+avisa). El freno Stop, `review` y `finish` clasifican igual el mismo diff
+(TASK-107): ante codigo, Stop y `review` corren la selectiva y `finish` la
+completa si algo queda fuera de las rutas parciales.
 
 Decision sobre TASK-091: por defecto la completa sigue siendo la puerta de
 integracion; declarar `rutas_verificacion_parcial` es la revision explicita de
@@ -111,8 +116,10 @@ esa regla para el proyecto. Se retira, solo en ese caso, el texto de `finish`
 se exige siempre la completa». El guardian de merges NO acepta la selectiva
 (decision de Carlos, TASK-108): con codigo exige siempre la completa, asi que un
 merge a mano tras un fallo de `finish` (un conflicto, por ejemplo) queda
-bloqueado; el remedio es resolver y relanzar `taskctl finish`, y el mensaje del
-guardian lo dice. Doctor: aviso nuevo y texto del `ok` con el nivel 2; el error
+bloqueado. El remedio, que dice el mensaje del guardian: abortar el merge
+(`taskctl abort-merge`), integrar la base en la rama de la tarea, resolver alli
+y relanzar `finish`; cerrar el conflicto en la rama de integracion dejaria un
+reintento de `finish` que ya no verifica. Doctor: aviso nuevo y texto del `ok` con el nivel 2; el error
 de forma de cada clave de patrones trae su propio ejemplo (TASK-109). Sin la
 clave, todo como antes.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index a3cf73d..4b84a5e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -859,7 +859,8 @@ timeout_verificacion_selectiva: 600                                 # opcional (
   podría ser parcial.
 - **`taskctl finish`**: ejecuta la completa como siempre (salvo con
   `rutas_verificacion_parcial`, abajo); en rojo, el mensaje recuerda que se
-  exige aunque las rondas usaran la selectiva.
+  exige aunque las rondas usaran la selectiva; con `rutas_verificacion_parcial`,
+  en su lugar dice por qué tocó la completa y no la selectiva.
 - **Sin la clave**, todo funciona como antes: el `Stop` corre la completa y
   `review` no verifica.
 - Cómo escribir el clasificador y qué cambios obligan a correr todo: guía
@@ -940,12 +941,19 @@ rutas_verificacion_parcial: [src/web/**]          # lista de rutas permitidas
   `tarea.md` («Verificacion parcial») antes del merge. Reutiliza un verde de la
   selectiva del mismo commit y la misma base si lo hay (fin de turno o `review`,
   con el árbol limpio).
-- La puerta de cobertura no se evalúa (el informe sería parcial): se mide en la
-  completa del release. Release y hotfix van siempre a la completa.
+- `finish` no evalúa la puerta de cobertura (el informe sería parcial), y
+  ninguna puerta posterior mide esas líneas: el release corre la completa, pero
+  su cobertura solo mide lo que añade la propia rama release. Con
+  `umbral_cobertura`, las tareas integradas con la selectiva no se comparan con él.
+- El release va siempre a la completa. Un hotfix nunca usa la selectiva (con
+  código, la completa; de solo documentación, su camino de documentación).
 - El **guardián de merges sigue exigiendo la completa para el código**: un merge
   a mano de una tarea con código queda bloqueado sin su verde, aunque a `finish`
-  le bastara la selectiva. Si `finish` falla a mitad (un conflicto), no repitas
-  el merge a mano: resuelve y vuelve a lanzar `taskctl finish`.
+  le bastara la selectiva. Si `finish` choca en un conflicto, no repitas el
+  merge a mano ni lo cierres en la rama de integración (un `finish` relanzado
+  sobre un merge ya cerrado no vuelve a verificar): abórtalo con
+  `taskctl abort-merge`, integra la base en la rama de la tarea, resuelve allí y
+  vuelve a lanzar `taskctl finish` desde ella.
 - Sin la clave, todo funciona como antes.
 
 #### Freno de fin de turno (hook `Stop`)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 780cddf..111dde6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -196,17 +196,17 @@ ignora. La sincronizacion y sus trampas, en [sincronizacion.md](sincronizacion.m
 **Freno de fin de turno.** Con `comando_verificacion` y una tarea en curso en
 la rama actual, el hook `Stop` lo ejecuta al terminar cada turno y, si no sale
 en verde, devuelve el turno con un informe. Arregla la causa; no borres,
-saltes ni debilites tests para pasarlo. Si el rojo no es de tu cambio, dilo
+saltes ni debilites tests para pasarlo. Si el rojo no es tuyo, dilo
 al terminar: el freno solo bloquea una vez por turno. Con
 `comando_verificacion_selectiva`, el `Stop` y `review` corren esa: [verificacion-selectiva.md](verificacion-selectiva.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
-`taskctl finish` (desde la rama de la tarea) verifica antes de mergear y
-aborta en rojo. Un `git merge` o script de cierre hacia la rama de
-integracion o la principal sin verde del commit que entra queda bloqueado:
-cierra con `taskctl finish`; si falla, resuelve y relanzalo. Con
-`rutas_verificacion_parcial`, `finish` puede integrar con la selectiva;
-un merge a mano no. `--sin-verificacion` lo decide la persona, no tu.
+`taskctl finish` verifica antes de mergear y aborta en rojo. Un `git merge` o
+script de cierre hacia la rama de integracion o la principal sin verde del
+commit que entra queda bloqueado: cierra con `taskctl finish` desde la rama de
+la tarea; si choca, abortalo y resuelve en ella. Con
+`rutas_verificacion_parcial`, `finish` puede integrar con la selectiva; un
+merge a mano no. `--sin-verificacion` lo decide la persona, no tu.
 
 **Tests held-out (`aceptacion/`).** Son de la persona: si implementas, no los
 leas ni los edites. Detalle en [heldout.md](heldout.md).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 7bc3579..2e655f6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -205,15 +205,22 @@ rutas_verificacion_parcial: [src/web/**]     # lista de rutas permitidas
   merge. Si ya hay un verde de la selectiva para ese mismo commit y esa misma
   base (del fin de turno o de `review`, con el arbol limpio), lo reutiliza.
 - **Cobertura omitida**: con la selectiva el informe seria parcial, asi que
-  la puerta de cobertura no se evalua; se mide en la completa del release.
-- **Release y hotfix van siempre a la completa**: el release lleva a la
-  principal todo lo acumulado y el hotfix integra en ella.
+  `finish` no evalua la puerta de cobertura. Ninguna puerta posterior mide esas
+  lineas: el release corre la completa, pero su puerta de cobertura solo mide
+  lo que anade la propia rama release. Si declaras `umbral_cobertura`, ten en
+  cuenta que las tareas integradas con la selectiva no se comparan con el.
+- **El release va siempre a la completa** (lleva a la principal todo lo
+  acumulado). **Un hotfix nunca usa la selectiva**: con codigo, la completa; si
+  solo cambia documentacion, conserva el camino de la seccion anterior.
 - **El guardian de merges sigue exigiendo la completa para el codigo**: un
   `git merge` a mano de una tarea con codigo queda bloqueado sin un verde de
   la completa de ese commit, aunque a `finish` le bastara la selectiva. Por
-  eso, si `finish` falla a mitad (un conflicto, por ejemplo), no repitas el
-  merge a mano: resuelve el conflicto y vuelve a lanzar `taskctl finish`, que
-  verifica y mergea por su cuenta. Un merge a mano de solo documentacion se
-  rige por la seccion anterior.
+  eso, si `finish` choca en un conflicto, no repitas el merge a mano ni lo
+  cierres en la rama de integracion: un `finish` relanzado sobre un merge ya
+  cerrado no vuelve a verificar. Abortalo (`taskctl abort-merge`), integra la
+  base en la rama de la tarea, resuelve alli el conflicto y vuelve a lanzar
+  `taskctl finish` desde la rama de la tarea, que verifica y mergea por su
+  cuenta. Un merge a mano de solo documentacion se rige por la seccion
+  anterior.
 - El fin de turno y `review` deciden igual sobre el mismo diff: corren la
   selectiva cuando la tarea toca codigo, este o no en las rutas parciales.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index c937868..588380a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -258,7 +258,9 @@ function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig, contexto: C
 const LINEA_SELECTIVA =
   'Con codigo, un merge a mano exige la verificacion completa en verde de ese commit aunque taskctl finish ' +
   'acepte la de lo afectado (rutas_verificacion_parcial), y un merge a mano no la obtiene. Integra con taskctl ' +
-  'finish TASK-NNN, que verifica y mergea por su cuenta; tras un conflicto, resuelvelo y vuelve a lanzar finish.';
+  'finish TASK-NNN desde la rama de la tarea, que verifica y mergea por su cuenta. Si finish choco en un conflicto, ' +
+  'no lo cierres en el destino (el reintento ya no verificaria): abortalo con taskctl abort-merge, integra la base ' +
+  'en la rama de la tarea, resuelvelo alli y vuelve a lanzar finish.';
 
 /**
  * TASK-101: si lo que entra es solo documentacion segun la config del destino.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
index a5a7cc8..57d6e16 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
@@ -589,13 +589,20 @@ test('guia (TASK-109): la seccion «Codigo parcial» explica el principio y el c
     /`\.taskcode\/config\.yml`/,
     /## Verificacion parcial/,
     /Cobertura omitida/,
-    /Release y hotfix van siempre a la completa/,
+    // IMP-1 de la revision: ninguna puerta posterior mide esas lineas.
+    /Ninguna puerta posterior mide esas\s+lineas/,
+    // MEN-1: el release siempre; el hotfix nunca usa la selectiva.
+    /El release va siempre a la completa/,
+    /Un hotfix nunca usa la selectiva/,
     /El guardian de merges sigue exigiendo la completa para el codigo/,
-    /no repitas el\s+merge a mano: resuelve el conflicto y vuelve a lanzar `taskctl finish`/,
+    // IMP-2: abortar e integrar la base en la rama de la tarea, no cerrar el merge en la de integracion.
+    /no repitas el merge a mano ni lo\s+cierres en la rama de integracion/,
+    /Abortalo \(`taskctl abort-merge`\), integra la\s+base en la rama de la tarea/,
   ]) {
     assert.match(seccion, marca);
   }
   assert.doesNotMatch(seccion, /TaskCode|TASK-\d/);
   const skill = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
-  assert.match(skill, /`rutas_verificacion_parcial`, `finish` puede integrar con la selectiva;\s+un merge a mano no/);
+  assert.match(skill, /`rutas_verificacion_parcial`, `finish` puede integrar con la selectiva;\s+un\s+merge\s+a\s+mano\s+no/);
+  assert.match(skill, /desde la rama de\s+la tarea; si choca, abortalo y resuelve en ella/);
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
index f0b1da0..2c0a70e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -364,7 +364,9 @@ test('guardian (TASK-108): el bloqueo con codigo dice que hace falta la completa
     assert.match(texto, /No es solo documentacion: la tarea cambia rutas que no son documentacion\.\n/);
     assert.match(texto, LINEA_COMPLETA);
     assert.match(texto, /aunque taskctl finish acepte la de lo afectado \(rutas_verificacion_parcial\)/);
-    assert.match(texto, /Integra con taskctl finish TASK-NNN, que verifica y mergea por su cuenta/);
+    assert.match(texto, /Integra con taskctl finish TASK-NNN desde la rama de la tarea, que verifica y mergea por su cuenta/);
+    // IMP-2 de la revision de TASK-109: cerrar el conflicto en el destino deja un reintento sin verificacion.
+    assert.match(texto, /no lo cierres en el destino .* abortalo con taskctl abort-merge, integra la base en la rama de la tarea, resuelvelo alli/);
     assert.match(texto, /taskctl finish TASK-NNN --sin-verificacion/);
     // Ni «corre la completa y repite» (bucle: nada la guarda) ni una causa que no se comprueba.
     assert.doesNotMatch(texto, /repite el merge|corre la (verificacion )?completa|develop avanzo|huella/i);
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 5d13a1b081e7f9c16fcd0ff66faa501b038cd1a8..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-109/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-109/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-109/revision/informe-revision-1.md                               |  77 ++++++++++++++
 tareas/03-en-revision/TASK-109/revision/peticion-revision-1.md                              | 554 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-109/tarea.md                                    |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                |   4 +-
 6 files changed, 642 insertions(+), 4 deletions(-)
````
