# Peticion de revision — TASK-109 (ronda 1)

- Tarea: TASK-109 — Verificacion proporcional B6: documentacion y limpieza del nivel 2
- Rama revisada: feature/task-109-verificacion-proporcional-b6-documentaci
- Rama base: develop
- Commit revisado (HEAD): 5d13a1b081e7f9c16fcd0ff66faa501b038cd1a8
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-109 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-109/tarea.md
- tareas/03-en-revision/TASK-109/planificacion/
- CHANGELOG.md
- docs/ROADMAP.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts

## Commits a revisar (git log develop..HEAD)

````
5d13a1b docs(TASK-109): autorrevision
adc87aa docs(TASK-109): SKILL.md vuelve a caber en 15 KB
49bb5cd docs(TASK-109): README, CHANGELOG y ROADMAP con el nivel 2
b91e15d docs(TASK-109): guia y skill explican el nivel 2, con su prueba de contrato
15857f6 feat(TASK-109): ejemplo propio por clave de patrones y doctor ante el nivel 2
ba391d1 chore(TASK-109): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index ad691bf..4f2760c 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -90,6 +90,32 @@ fichero como destino (solo cambia el destino una rama de `refs/heads/` o
 `refs/remotes/origin/`, un tag o un commit, que desacoplan HEAD; `HEAD` y `@`
 no lo cambian).
 
+Verificacion proporcional, nivel 2 (TASK-096, TASK-105 a TASK-109). El
+principio: el coste de verificar es proporcional al cambio. Clave nueva opcional
+`rutas_verificacion_parcial` (lista de rutas permitidas, patrones `git :(glob)`,
+leida de la config de la rama base): si todo el codigo que cambia la tarea cae
+en ellas, `finish` corre `comando_verificacion_selectiva` (con `RAMA_BASE` y
+`timeout_verificacion_selectiva`) en vez de la completa, lo dice y lo anota tras
+el verde en la seccion `## Verificacion parcial`; reutiliza un verde selectivo
+del mismo commit y la misma base. Un fichero fuera, un cambio de
+`.taskcode/config.yml`, un diff vacio, un release o un hotfix van a la completa;
+la puerta de cobertura no se evalua con la selectiva (se mide en la completa del
+release). Exige `comando_verificacion_selectiva` (la config aborta sin ella) y
+`rutas_documentacion` (sin ellas no tiene efecto; `taskctl doctor` lo avisa). El
+freno Stop, `review` y `finish` deciden igual sobre el mismo diff (TASK-107).
+
+Decision sobre TASK-091: por defecto la completa sigue siendo la puerta de
+integracion; declarar `rutas_verificacion_parcial` es la revision explicita de
+esa regla para el proyecto. Se retira, solo en ese caso, el texto de `finish`
+«aunque las rondas usaran la selectiva» y la frase de la guia «Antes de integrar
+se exige siempre la completa». El guardian de merges NO acepta la selectiva
+(decision de Carlos, TASK-108): con codigo exige siempre la completa, asi que un
+merge a mano tras un fallo de `finish` (un conflicto, por ejemplo) queda
+bloqueado; el remedio es resolver y relanzar `taskctl finish`, y el mensaje del
+guardian lo dice. Doctor: aviso nuevo y texto del `ok` con el nivel 2; el error
+de forma de cada clave de patrones trae su propio ejemplo (TASK-109). Sin la
+clave, todo como antes.
+
 ## 0.14.0 — 2026-11-10
 
 ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
diff --git a/docs/ROADMAP.md b/docs/ROADMAP.md
index 238733e..c943bc7 100644
--- a/docs/ROADMAP.md
+++ b/docs/ROADMAP.md
@@ -12,16 +12,16 @@
 
 | | Tareas |
 |---|---|
-| Terminadas | **99** (TASK-001 a TASK-080 salvo TASK-019, TASK-081 a TASK-092, TASK-095, TASK-097, TASK-098, TASK-100, TASK-101, TASK-102, TASK-103, TASK-104) |
+| Terminadas | **105** (TASK-001 a TASK-080 salvo TASK-019, TASK-081 a TASK-092, TASK-095 a TASK-098, TASK-100 a TASK-109) |
 | Descartadas | 3 (TASK-019, TASK-093, TASK-094) |
-| **Pendientes** | **2** (TASK-096; TASK-099 para la 0.15.0) |
+| **Pendientes** | **1** (TASK-099 para la 0.15.0) |
 | Versión publicada | **0.14.0** (2026-11-10) |
 
 ---
 
 ## Pendiente
 
-### Fase P — Agilidad sin perder calidad (4/5)
+### Fase P — Agilidad sin perder calidad (5/6)
 
 Sale de la auditoría de agilidad de la 0.8 a la 0.13 (`docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md`):
 las tareas de ToolsaWeb pasaron de 103 a 192 min de mediana de punta a punta y
@@ -30,8 +30,7 @@ las revisiones de 2,3 a 3,8 rondas. La 0.14.0 trae la revisión que converge
 
 | Orden | Tarea | Título | Complejidad | Prioridad | Depende de |
 |---|---|---|---|---|---|
-| 1 | TASK-096 | Verificación proporcional B: con código parcial se verifica solo lo afectado | alta | media | TASK-100 |
-| 2 | TASK-099 | Corrección de MENORES tras aprobar con correcciones sin abrir otra ronda completa | media | 0.15.0 | 10 tareas medidas con la 0.14.0 |
+| 1 | TASK-099 | Corrección de MENORES tras aprobar con correcciones sin abrir otra ronda completa | media | 0.15.0 | 10 tareas medidas con la 0.14.0 |
 
 TASK-099 sale de OpenDockTrading TASK-067, la primera tarea cerrada con la 0.14.0
 (15 min de punta a punta, rondas de 1,42 M, 0,74 M y 0,37 M tokens): la ronda 3 se
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index f67b439..a3cf73d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -762,7 +762,10 @@ algún error (los avisos no cuentan). Comprueba:
   (un valor inválido es error con su mensaje; una clave desconocida, aviso).
 - **Verificación selectiva** (`verificacion-selectiva`): con `comando_verificacion`
   y sin `comando_verificacion_selectiva`, `aviso` con el arreglo en la misma
-  línea; con las dos, `ok`. Sin completa no dice nada.
+  línea; con las dos, `ok` (con `rutas_verificacion_parcial`, dice que `finish`
+  puede integrar con la selectiva y un merge a mano no). Con
+  `rutas_verificacion_parcial` y sin `rutas_documentacion`, `aviso`: la clave no
+  tendría efecto. Sin completa no dice nada.
 - **Verificación**: si la config declara `comando_verificacion` (ver abajo), `ok`
   con el comando y su timeout. Sin él, depende de si el proyecto tiene tests en
   su raíz:
@@ -828,8 +831,9 @@ timeout_verificacion: 900          # opcional, en segundos (por defecto 600)
 
 Cuando la completa tarda mucho, el proyecto puede declarar además una
 verificación **selectiva**, que corre solo lo afectado por los cambios. La usan
-el freno de fin de turno y las rondas de `taskctl review`; la completa sigue
-siendo la puerta de `finish` y del guardián de merges.
+el freno de fin de turno y las rondas de `taskctl review`; por defecto la
+completa sigue siendo la puerta de `finish` y del guardián de merges (la
+excepción, más abajo: `rutas_verificacion_parcial`).
 
 ```yaml
 comando_verificacion: "npm test"                                    # la completa
@@ -853,8 +857,9 @@ timeout_verificacion_selectiva: 600                                 # opcional (
   petición lleva la sección «Verificación de esta ronda» (tipo, comando,
   resultado y final de la salida) y omite la de cobertura, porque el informe
   podría ser parcial.
-- **`taskctl finish`**: ejecuta la completa como siempre; en rojo, el mensaje
-  recuerda que se exige aunque las rondas usaran la selectiva.
+- **`taskctl finish`**: ejecuta la completa como siempre (salvo con
+  `rutas_verificacion_parcial`, abajo); en rojo, el mensaje recuerda que se
+  exige aunque las rondas usaran la selectiva.
 - **Sin la clave**, todo funciona como antes: el `Stop` corre la completa y
   `review` no verifica.
 - Cómo escribir el clasificador y qué cambios obligan a correr todo: guía
@@ -909,7 +914,39 @@ comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opciona
   cambiar lo que entra),
   en un release, ni si cambian los held-out (`tareas/.../aceptacion/`), y la
   calcula solo cuando ya iba a bloquear, con un presupuesto de 20 s.
-- El freno de fin de turno y `review` siguen corriendo la completa o la selectiva.
+
+#### Código parcial: `rutas_verificacion_parcial`
+
+El mismo principio un paso más allá: si todo el código que cambia la tarea cae
+en unas rutas acotadas, a `finish` le basta la verificación de lo afectado. Por
+defecto la completa es la puerta de integración; declarar esta clave es
+aceptar, para este proyecto, que en esas rutas baste la selectiva.
+
+```yaml
+comando_verificacion: "npm test"
+comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
+rutas_documentacion: [docs/**, README.md]
+rutas_verificacion_parcial: [src/web/**]          # lista de rutas permitidas
+```
+
+- Lista de rutas **permitidas**, leída de la config de la **rama base**: si todo
+  lo que la tarea cambia frente a la base, salvo la documentación, cae en ellas,
+  `finish` corre `comando_verificacion_selectiva` (con `RAMA_BASE` y
+  `timeout_verificacion_selectiva`) en vez de la completa. Un fichero fuera, un
+  cambio de `.taskcode/config.yml` o un diff vacío van a la completa.
+- Exige `comando_verificacion_selectiva` (la config aborta sin ella) y
+  `rutas_documentacion` (sin ellas no tiene efecto: `taskctl doctor` avisa).
+- `finish` dice que corrió la selectiva y por qué, y tras el verde lo anota en
+  `tarea.md` («Verificacion parcial») antes del merge. Reutiliza un verde de la
+  selectiva del mismo commit y la misma base si lo hay (fin de turno o `review`,
+  con el árbol limpio).
+- La puerta de cobertura no se evalúa (el informe sería parcial): se mide en la
+  completa del release. Release y hotfix van siempre a la completa.
+- El **guardián de merges sigue exigiendo la completa para el código**: un merge
+  a mano de una tarea con código queda bloqueado sin su verde, aunque a `finish`
+  le bastara la selectiva. Si `finish` falla a mitad (un conflicto), no repitas
+  el merge a mano: resuelve y vuelve a lanzar `taskctl finish`.
+- Sin la clave, todo funciona como antes.
 
 #### Freno de fin de turno (hook `Stop`)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index b73cfeb..780cddf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -186,10 +186,10 @@ que ha dejado de ser cierto es peor que no tenerlo.
 Claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`,
 `modo_flujo`, `excluir_de_revision`, `cierre_por_defecto`, las dos del remoto
 (`plataforma_remota`, `url_base_remoto`), las dos de verificacion
-(`comando_verificacion`, los tests que ejecutan los frenos, y
+(`comando_verificacion`, los tests de los frenos, y
 `timeout_verificacion`) y las tres de sincronizacion de ficheros derivados
 tras cada transicion. Sin fichero, todo por defecto; un valor invalido de una
-clave conocida aborta todos los comandos, y una clave desconocida avisa y se
+clave conocida aborta, y una clave desconocida avisa y se
 ignora. La sincronizacion y sus trampas, en [sincronizacion.md](sincronizacion.md).
 `tareas/ROADMAP.md` y su zona manual, en [roadmap.md](roadmap.md).
 
@@ -198,15 +198,15 @@ la rama actual, el hook `Stop` lo ejecuta al terminar cada turno y, si no sale
 en verde, devuelve el turno con un informe. Arregla la causa; no borres,
 saltes ni debilites tests para pasarlo. Si el rojo no es de tu cambio, dilo
 al terminar: el freno solo bloquea una vez por turno. Con
-`comando_verificacion_selectiva`, el `Stop` y `review` corren esa, por
-impacto: [verificacion-selectiva.md](verificacion-selectiva.md).
+`comando_verificacion_selectiva`, el `Stop` y `review` corren esa: [verificacion-selectiva.md](verificacion-selectiva.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
-`taskctl finish` (lanzado desde la rama de la tarea) ejecuta la verificacion
-antes de mergear y aborta si no sale en verde. Un `git merge` o un script de
-cierre hacia la rama de integracion o la principal queda bloqueado sin un
-verde del commit que entra: cierra siempre con `taskctl finish`. Saltarse la
-verificacion (`--sin-verificacion`) lo decide la persona, no tu.
+`taskctl finish` (desde la rama de la tarea) verifica antes de mergear y
+aborta en rojo. Un `git merge` o script de cierre hacia la rama de
+integracion o la principal sin verde del commit que entra queda bloqueado:
+cierra con `taskctl finish`; si falla, resuelve y relanzalo. Con
+`rutas_verificacion_parcial`, `finish` puede integrar con la selectiva;
+un merge a mano no. `--sin-verificacion` lo decide la persona, no tu.
 
 **Tests held-out (`aceptacion/`).** Son de la persona: si implementas, no los
 leas ni los edites. Detalle en [heldout.md](heldout.md).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 505f066..7bc3579 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -7,11 +7,13 @@ tarea no ha tocado esa parte. El proyecto puede declarar dos verificaciones:
 | Clave | Que corre | Quien la usa |
 |---|---|---|
 | `comando_verificacion` | **todo**, siempre | `finish` y el guardian de merges: la puerta de integracion |
-| `comando_verificacion_selectiva` | solo lo afectado por los cambios | el hook `Stop` (fin de turno) y `taskctl review` |
+| `comando_verificacion_selectiva` | solo lo afectado por los cambios | el hook `Stop` (fin de turno), `taskctl review` y, con `rutas_verificacion_parcial`, `finish` |
 
-La selectiva solo acelera las rondas. **Antes de integrar se exige siempre la
-completa** en verde sobre el commit que entra, aunque las rondas pasaran con la
-selectiva. Por eso la selectiva sin la completa es un error de configuracion.
+Por defecto la selectiva solo acelera las rondas: **antes de integrar se exige
+la completa** en verde sobre el commit que entra, aunque las rondas pasaran con
+la selectiva. La unica excepcion la declara el proyecto con
+`rutas_verificacion_parcial` (ver «Codigo parcial» al final). Por eso la
+selectiva sin la completa es un error de configuracion.
 
 ## Declarar las dos claves
 
@@ -86,9 +88,10 @@ El clasificador falla cerrado: ante la duda, corre todo. Como minimo:
   revision lleva una seccion con el tipo (selectiva o comprobacion de
   documentacion), el comando, el resultado y su salida. Sin la selectiva,
   `review` no verifica nada.
-- **`taskctl finish`**: corre la completa; en rojo no integra y dice como
-  correrla.
-- **`taskctl doctor`**: avisa si hay completa y falta la selectiva.
+- **`taskctl finish`**: corre la completa (o la selectiva, si se cumple
+  «Codigo parcial»); en rojo no integra y dice como correrla.
+- **`taskctl doctor`**: avisa si hay completa y falta la selectiva, y si
+  `rutas_verificacion_parcial` no puede tener efecto.
 
 ## Tareas de solo documentacion: `rutas_documentacion`
 
@@ -169,3 +172,48 @@ ejecutan, y romperlos rompe el comportamiento del agente:
 
 Declara carpetas concretas de documentacion para personas (`docs/**`,
 `README.md`, `CHANGELOG.md`).
+
+## Codigo parcial: `rutas_verificacion_parcial`
+
+El principio: **el coste de verificar es proporcional al cambio**. Una tarea de
+solo documentacion no corre tests; una que solo toca una parte acotada del
+codigo puede integrarse con la verificacion de lo afectado; todo lo demas,
+con la completa. Por defecto la completa es la puerta de integracion; declarar
+esta clave es aceptar, para este proyecto, que en esas rutas baste lo
+afectado.
+
+```yaml
+# .taskcode/config.yml
+comando_verificacion: "npm test"
+comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
+timeout_verificacion_selectiva: 600          # opcional; tambien vale para finish
+rutas_documentacion: [docs/**, README.md]
+rutas_verificacion_parcial: [src/web/**]     # lista de rutas permitidas
+```
+
+- **Lista de rutas permitidas, leida de la rama base**: si todo lo que la
+  tarea cambia frente a la base, salvo la documentacion, cae en esas rutas,
+  `finish` corre `comando_verificacion_selectiva` (con `RAMA_BASE` y
+  `timeout_verificacion_selectiva`) en vez de la completa. Un solo fichero
+  fuera, un cambio de `.taskcode/config.yml` o un diff vacio van a la
+  completa. La rama no puede ampliarse las rutas: se leen de la base.
+- **Exige** `comando_verificacion_selectiva` (la config aborta sin ella) y
+  `rutas_documentacion`: sin rutas de documentacion la decision no se calcula
+  y la clave no tiene efecto (`taskctl doctor` lo avisa).
+- `finish` dice en su salida que corrio la selectiva y por que, y tras el
+  verde lo anota en `tarea.md`, seccion `## Verificacion parcial`, antes del
+  merge. Si ya hay un verde de la selectiva para ese mismo commit y esa misma
+  base (del fin de turno o de `review`, con el arbol limpio), lo reutiliza.
+- **Cobertura omitida**: con la selectiva el informe seria parcial, asi que
+  la puerta de cobertura no se evalua; se mide en la completa del release.
+- **Release y hotfix van siempre a la completa**: el release lleva a la
+  principal todo lo acumulado y el hotfix integra en ella.
+- **El guardian de merges sigue exigiendo la completa para el codigo**: un
+  `git merge` a mano de una tarea con codigo queda bloqueado sin un verde de
+  la completa de ese commit, aunque a `finish` le bastara la selectiva. Por
+  eso, si `finish` falla a mitad (un conflicto, por ejemplo), no repitas el
+  merge a mano: resuelve el conflicto y vuelve a lanzar `taskctl finish`, que
+  verifica y mergea por su cuenta. Un merge a mano de solo documentacion se
+  rige por la seccion anterior.
+- El fin de turno y `review` deciden igual sobre el mismo diff: corren la
+  selectiva cuando la tarea toca codigo, este o no en las rutas parciales.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 44771ff..7499616 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -45,6 +45,7 @@ import {
 } from '../core/doctor.js';
 import { resolverConfigConAvisos, CONFIG_DEFAULTS, type TaskcodeConfig } from '../core/config.js';
 import { comandoPropuesto, type ComandoTests } from '../core/comando-tests.js';
+import { comandoParcial, documentacionDeclarada } from '../core/verificacion-proporcional.js';
 import { detectarComandosTests } from '../fs/deteccion-tests.js';
 import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
 import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
@@ -460,11 +461,31 @@ export function comprobarVerificacionSelectiva(cfg: TaskcodeConfig | null): Comp
       ),
     ];
   }
+  const selectiva =
+    `comando_verificacion_selectiva: "${una(cfg.comando_verificacion_selectiva)}" ` +
+    `(timeout ${cfg.timeout_verificacion_selectiva} s)`;
+  if (comandoParcial(cfg) === null) {
+    return [ok('verificacion-selectiva', `${selectiva}; la completa sigue siendo la puerta de finish`)];
+  }
+  // TASK-109: sin rutas de documentacion la decision proporcional no se calcula
+  // y el nivel 2 nunca se activa: la clave pareceria hacer algo sin hacerlo.
+  if (!documentacionDeclarada(cfg)) {
+    const arreglo =
+      'declara tambien rutas_documentacion en .taskcode/config.yml (p. ej. rutas_documentacion: [docs/**, README.md]) ' +
+      'o borra rutas_verificacion_parcial';
+    return [
+      aviso(
+        'verificacion-selectiva',
+        `${selectiva}; rutas_verificacion_parcial no tiene efecto sin rutas_documentacion: ${arreglo}`,
+        arreglo.charAt(0).toUpperCase() + arreglo.slice(1)
+      ),
+    ];
+  }
   return [
     ok(
       'verificacion-selectiva',
-      `comando_verificacion_selectiva: "${una(cfg.comando_verificacion_selectiva)}" ` +
-        `(timeout ${cfg.timeout_verificacion_selectiva} s); la completa sigue siendo la puerta de finish`
+      `${selectiva}; con rutas_verificacion_parcial, finish integra con ella si todo el codigo cae en esas ` +
+        'rutas; un merge a mano sigue exigiendo la completa'
     ),
   ];
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index fc267f2..4f26cea 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -26,7 +26,7 @@
  * | umbral_cobertura             | null (solo informa) | commands/finish-cobertura.ts (TASK-074) |
  * | rutas_documentacion          | [] (sin efecto)   | finish-verificacion.ts (TASK-100), hooks/guardia-merge.ts (TASK-101) |
  * | comando_verificacion_documentacion | null        | finish-verificacion.ts (TASK-100), guardia-merge.ts (TASK-101) |
- * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096) |
+ * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096); la decision la aplican fs/decision-documentacion.ts, finish-verificacion.ts, freno-stop.ts, review.ts y guardia-merge.ts (TASK-105..108); doctor.ts avisa (TASK-109) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
  * TASK-100: si todo lo que cambia la tarea frente a la base cae en esas rutas
@@ -871,19 +871,31 @@ function validarUmbralCobertura(donde: string, valor: unknown): number {
  * `** /*.lock`), que es lo que una persona espera y no lo que hace
  * `:(glob)` a secas, donde `*` no cruza carpetas.
  */
+type ClavePatrones = 'excluir_de_revision' | 'contexto_revision' | 'rutas_documentacion' | 'rutas_verificacion_parcial';
+
+/**
+ * TASK-109: el ejemplo del error de forma, uno por clave (antes las que no eran
+ * `rutas_documentacion` recibian el de `excluir_de_revision`, que habla de
+ * «excluir» y no cuadra con las demas). El tipo obliga a darlo al anadir una.
+ */
+const EJEMPLO_PATRONES: Readonly<Record<ClavePatrones, string>> = {
+  excluir_de_revision: '[**/dist/**, **/*.lock]. Para no excluir nada: excluir_de_revision: [].',
+  contexto_revision: '[docs/arquitectura.md, src/core/**]. Sin contexto extra: contexto_revision: [].',
+  rutas_documentacion: '[docs/**, README.md].',
+  rutas_verificacion_parcial: '[src/web/**]. Sin nivel 2: rutas_verificacion_parcial: [].',
+};
+
 function validarPatronesExclusion(
   donde: string,
   valor: unknown,
-  clave: 'excluir_de_revision' | 'contexto_revision' | 'rutas_documentacion' | 'rutas_verificacion_parcial' = 'excluir_de_revision',
+  clave: ClavePatrones = 'excluir_de_revision',
   anclar = true
 ): readonly string[] {
   if (!Array.isArray(valor)) {
     throw new ConfigError(
       `[ERROR] ${donde}: "${clave}" debe ser una lista entre corchetes, ` +
         `y es ${describirValor(valor)}.\n` +
-        (clave === 'rutas_documentacion'
-          ? `        Ejemplo: ${clave}: [docs/**, README.md].`
-          : `        Ejemplo: ${clave}: [**/dist/**, **/*.lock]. Para no excluir nada: ${clave}: [].`)
+        `        Ejemplo: ${clave}: ${EJEMPLO_PATRONES[clave]}`
     );
   }
   const patrones: string[] = [];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
index ebb91ec..a5a7cc8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
@@ -521,6 +521,26 @@ test('doctor (TASK-091): con las dos, ok; sin completa o con config invalida, na
   assert.deepEqual(comprobarVerificacionSelectiva(null), []);
 });
 
+const NIVEL2 = 'comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node sel.js"\nrutas_verificacion_parcial: [src/web/**]\n';
+
+test('doctor (TASK-109): con el nivel 2 activo, ok que dice que finish integra con la selectiva y el merge a mano no', () => {
+  const [c, ...resto] = comprobarVerificacionSelectiva(parsearConfig(`${NIVEL2}rutas_documentacion: [docs/**]\n`, RUTA));
+  assert.equal(resto.length, 0);
+  assert.equal(c?.nivel, 'ok');
+  assert.match(c?.mensaje ?? '', /comando_verificacion_selectiva: "node sel\.js" \(timeout 600 s\)/);
+  assert.match(c?.mensaje ?? '', /finish integra con ella si todo el codigo cae en esas rutas; un merge a mano sigue exigiendo la completa/);
+  assert.doesNotMatch(c?.mensaje ?? '', /la completa sigue siendo la puerta de finish/);
+});
+
+test('doctor (TASK-109): rutas_verificacion_parcial sin rutas_documentacion avisa en una linea con su arreglo', () => {
+  const [c, ...resto] = comprobarVerificacionSelectiva(parsearConfig(NIVEL2, RUTA));
+  assert.equal(resto.length, 0);
+  assert.equal(c?.nivel, 'aviso');
+  assert.match(c?.mensaje ?? '', /rutas_verificacion_parcial no tiene efecto sin rutas_documentacion: declara tambien rutas_documentacion/);
+  assert.doesNotMatch(c?.mensaje ?? '', /\n/);
+  assert.match(c?.arreglo ?? '', /^Declara tambien rutas_documentacion en \.taskcode\/config\.yml .* o borra rutas_verificacion_parcial$/);
+});
+
 // ---------------------------------------------------------------------
 // Guia de migracion (criterio 6): instalable, enlazada y sin marcas de este repo
 // ---------------------------------------------------------------------
@@ -540,10 +560,42 @@ test('guia (TASK-091): task-workflow enlaza verificacion-selectiva.md, que expli
     /corre todo/,
     /lockfiles/,
     /La completa no se convierte en el clasificador/,
-    /Antes de integrar se exige siempre la\s+completa/,
+    // TASK-109: antes «Antes de integrar se exige siempre la completa»; el nivel 2
+    // (TASK-096) abrio una excepcion que declara el proyecto, y la guia lo dice.
+    /antes de integrar se exige\s+la completa\*\*/,
+    /La unica excepcion la declara el proyecto con\s+`rutas_verificacion_parcial`/,
     /`taskctl doctor`/,
   ]) {
     assert.match(guia, marca);
   }
   assert.doesNotMatch(guia, /TaskCode/);
 });
+
+test('guia (TASK-109): la seccion «Codigo parcial» explica el principio y el contrato del nivel 2', () => {
+  const dir = path.join(import.meta.dirname, '..', '..', '..', 'skills', 'task-workflow');
+  const guia = readFileSync(path.join(dir, 'verificacion-selectiva.md'), 'utf8');
+  const inicio = guia.indexOf('## Codigo parcial: `rutas_verificacion_parcial`');
+  assert.ok(inicio >= 0, 'falta la seccion «Codigo parcial» en verificacion-selectiva.md');
+  const fin = guia.indexOf('\n## ', inicio + 1);
+  const seccion = guia.slice(inicio, fin < 0 ? undefined : fin);
+  for (const marca of [
+    /el coste de verificar es proporcional al cambio/,
+    /Por defecto la completa es la puerta de integracion/,
+    /rutas_verificacion_parcial: \[/,
+    /Lista de rutas permitidas, leida de la rama base/,
+    /comando_verificacion_selectiva/,
+    /timeout_verificacion_selectiva/,
+    /`rutas_documentacion`: sin rutas de documentacion la decision no se calcula/,
+    /`\.taskcode\/config\.yml`/,
+    /## Verificacion parcial/,
+    /Cobertura omitida/,
+    /Release y hotfix van siempre a la completa/,
+    /El guardian de merges sigue exigiendo la completa para el codigo/,
+    /no repitas el\s+merge a mano: resuelve el conflicto y vuelve a lanzar `taskctl finish`/,
+  ]) {
+    assert.match(seccion, marca);
+  }
+  assert.doesNotMatch(seccion, /TaskCode|TASK-\d/);
+  const skill = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
+  assert.match(skill, /`rutas_verificacion_parcial`, `finish` puede integrar con la selectiva;\s+un merge a mano no/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
index 73f06ea..1164f39 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
@@ -310,3 +310,25 @@ test('config (TASK-096): rutas_verificacion_parcial es conocida, va con la selec
     }
   );
 });
+
+test('config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo', () => {
+  const casos: Array<[string, RegExp]> = [
+    ['rutas_verificacion_parcial', /Ejemplo: rutas_verificacion_parcial: \[src\/web\/\*\*\]\. Sin nivel 2: rutas_verificacion_parcial: \[\]\./],
+    ['contexto_revision', /Ejemplo: contexto_revision: \[docs\/arquitectura\.md, src\/core\/\*\*\]\. Sin contexto extra: contexto_revision: \[\]\./],
+    ['rutas_documentacion', /Ejemplo: rutas_documentacion: \[docs\/\*\*, README\.md\]\./],
+    ['excluir_de_revision', /Ejemplo: excluir_de_revision: \[\*\*\/dist\/\*\*, \*\*\/\*\.lock\]\. Para no excluir nada: excluir_de_revision: \[\]\./],
+  ];
+  for (const [clave, ejemplo] of casos) {
+    const base = 'comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node s.js"\nrutas_documentacion: [docs/**]\n';
+    const texto = clave === 'rutas_documentacion' ? base.replace('rutas_documentacion: [docs/**]\n', '') : base;
+    assert.throws(
+      () => parsearConfig(`${texto}${clave}: src\n`, 'c.yml'),
+      (e: unknown) => {
+        assert.ok(e instanceof ConfigError, clave);
+        assert.match(e.message, ejemplo, clave);
+        if (clave !== 'excluir_de_revision') assert.doesNotMatch(e.message, /no excluir nada/, clave);
+        return true;
+      }
+    );
+  }
+});
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-109/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-109/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-109/tarea.md                                    |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                  | 19 +++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                      | 21 +++++++++++----------
 5 files changed, 34 insertions(+), 13 deletions(-)
````
