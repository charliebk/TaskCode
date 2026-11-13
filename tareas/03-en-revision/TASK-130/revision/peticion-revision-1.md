# Peticion de revision — TASK-130 (ronda 1)

- Tarea: TASK-130 — Poda periodica de tests redundantes: fusionar o borrar sin perder cobertura
- Rama revisada: feature/task-130-poda-periodica-de-tests-redundantes-fusi
- Rama base: develop
- Commit revisado (HEAD): 24cb77c1e25871be2337d05dc6d3ff169a15e58b
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-130 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
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

- tareas/03-en-revision/TASK-130/tarea.md
- tareas/03-en-revision/TASK-130/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/poda-tests.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/asignado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/board.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/frontmatter.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/import-parser.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/poda-tests.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/task-id.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts

## Commits a revisar (git log develop..HEAD)

````
24cb77c feat(TASK-130): doctor propone la poda de tests, guia de poda y primera pasada sobre la suite de TaskCode
bdb7ed9 chore(TASK-130): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 58031d2..da0028e 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,7 @@
 # Changelog
 
 ## Sin publicar
+- Cambio de comportamiento (TASK-130): `doctor` propone abrir una tarea de poda de tests (`poda-tests`, con el comando `taskctl new` escrito) cuando la suite crece mas del umbral o tras `tareas_entre_podas` (30 por defecto) tareas terminadas desde la ultima poda; anexo `poda-tests.md` con el procedimiento. Primera pasada sobre la suite de TaskCode: tests redundantes fusionados sin bajar la cobertura.
 - TASK-129 (feature) — Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento (2026-11-13)
 - Cambio de comportamiento (TASK-129): la plantilla del plan y la skill plan piden por criterio cuantos tests nuevos (presupuesto de 1 a 3, con motivo si se pasa); la skill review trata un test duplicado como MENOR; anexo `tests-pesados.md` (como marcar pesados en Node, Rust, Java y .NET). La completa anota en el registro de puertas su numero de tests (linea `suite`); `metricas --por-version` muestra tests y duracion de la completa por version, y `doctor` avisa si crecieron mas de `umbral_crecimiento_suite` (20 % por defecto).
 - TASK-126 (feature) — Verificacion por tipo de rama: los tests pesados solo en la puerta de release (2026-11-13)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index a9c64aa..e656397 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -371,6 +371,12 @@ versión el mayor número de tests y la mediana de la duración de la completa,
 avisa (presupuesto de tests por criterio, marcar pesados): skill
 `task-workflow`, `tests-pesados.md`.
 
+`doctor` propone además abrir una tarea de poda de tests (`poda-tests`, con el
+`taskctl new` ya escrito y la etiqueta `poda`) cuando salta ese aviso o han
+pasado más de `tareas_entre_podas` (30 por defecto) tareas terminadas desde la
+última poda. El procedimiento (localizar, fusionar o borrar, y que la
+cobertura de líneas no baje), en `task-workflow/poda-tests.md`.
+
 #### Tests held-out (`aceptacion/`)
 
 Tests de aceptación que escribe la **persona** a partir de los criterios y que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/poda-tests.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/poda-tests.md
new file mode 100644
index 0000000..de7dad2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/poda-tests.md
@@ -0,0 +1,44 @@
+# Poda de tests redundantes
+
+Cada tarea y cada ronda anaden tests y ninguno se retira aunque otro posterior
+ya cubra lo mismo. `taskctl doctor` (`poda-tests`) propone abrir una tarea de
+poda, con el `taskctl new` ya escrito y la etiqueta `poda`, cuando salta el
+aviso de crecimiento de la suite o han pasado mas de `tareas_entre_podas` (30
+por defecto) tareas terminadas desde la ultima poda.
+
+## 1. Localizar candidatos
+
+- Cuenta los tests por fichero (`node --test` o la herramienta de perfil del
+  proyecto) y empieza por los ficheros con mas tests y los mas lentos.
+- Busca **variantes del mismo caso** en tests separados: el mismo nombre con
+  otro valor («una clave invalida aborta» con cinco valores), la misma funcion
+  con entradas distintas y la misma asercion.
+- Busca **setups repetidos**: varios tests que montan el mismo escenario caro
+  (un repo, un servidor, ficheros) y solo miran cosas distintas.
+- Busca **duplicados**: un test cuyas aserciones ya hace otro.
+
+## 2. Fusionar o borrar
+
+- **Fusionar** variantes en un test con una tabla de casos y un bucle; cada
+  asercion lleva un mensaje con el caso, para saber cual fallo. Un subtest por
+  caso no reduce nada: cuenta igual.
+- **Compartir el montaje**: los tests que montan el mismo escenario pasan a uno
+  que lo monta una vez y comprueba todo.
+- **Borrar** solo el test cuyas aserciones ya hace otro. En la duda, fusiona.
+- Nunca: quitar ni aflojar una asercion, cambiar el codigo de produccion, mezclar
+  la poda con cambios de comportamiento.
+
+## 3. La cobertura no baja
+
+Antes y despues de podar, la cobertura de lineas de los ficheros de test
+tocados (en Node, `node --test --experimental-test-coverage
+--test-reporter=lcov`; en otros lenguajes, su informe lcov o equivalente):
+por fichero fuente, el conjunto de lineas cubiertas despues tiene que incluir
+el de antes. Si una linea se pierde, se deshace la fusion que la quito. La
+cobertura total de la suite no puede bajar.
+
+## 4. Medir y anotar
+
+En el plan de la tarea de poda, antes y despues: numero de tests y duracion de
+la suite rapida y de la completa (con la herramienta de perfil, o el resumen
+del runner), y la comprobacion de cobertura.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
index 9246b67..41bd2b2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
@@ -40,4 +40,5 @@ asi no lo corre nadie, asi que no lo marques sin declarar la clave.
 duracion de la verificacion completa (del registro de puertas), y
 `taskctl doctor` avisa si cualquiera crecio mas de `umbral_crecimiento_suite`
 (20 % por defecto) desde la version anterior. Es la senal para podar tests
-redundantes o marcar pesados.
+redundantes o marcar pesados. Como podar sin perder cobertura:
+[poda-tests.md](poda-tests.md).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 9f02015..627d6c5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -46,6 +46,7 @@ import {
 } from '../core/doctor.js';
 import { avisoCrecimiento, suitePorVersion } from '../core/crecimiento-suite.js';
 import { versionDeCierre } from '../core/transiciones.js';
+import { parseTareaFile } from '../core/tarea-file.js';
 import { leerRegistroPuertas } from '../fs/registro-puertas.js';
 import { resolverConfigConAvisos, CONFIG_DEFAULTS, presupuestoFreno, type TaskcodeConfig } from '../core/config.js';
 import { comandoPropuesto, type ComandoTests } from '../core/comando-tests.js';
@@ -53,7 +54,6 @@ import { comandoParcial, documentacionDeclarada } from '../core/verificacion-pro
 import { detectarComandosTests } from '../fs/deteccion-tests.js';
 import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
 import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
-import { parseTareaFile } from '../core/tarea-file.js';
 import { diaLocal, evaluarDocumentoEstado, type TareaTerminadaFecha } from '../core/documento-estado.js';
 import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
 import { urlsDeOrigin } from '../fs/git.js';
@@ -612,6 +612,61 @@ export function comprobarCrecimientoSuite(cwd: string, tareasRoot: string, cfg:
   return [aviso('crecimiento-suite', motivo, arreglo)];
 }
 
+/** TASK-130: la etiqueta que marca una tarea de poda de tests. */
+export const ETIQUETA_PODA = 'poda';
+/** TASK-130: el comando con que doctor propone abrir la tarea de poda. */
+export const COMANDO_NUEVA_PODA =
+  'taskctl new --titulo "Poda de tests redundantes" --tipo feature --etiquetas poda,tests ' +
+  '--objetivo "Fusionar o borrar tests redundantes sin bajar la cobertura de las lineas que cubrian ' +
+  '(procedimiento: skill task-workflow, poda-tests.md)"';
+
+/**
+ * TASK-130: propone abrir una tarea de poda de tests cuando salta el aviso de
+ * crecimiento de la suite (TASK-129) o han pasado mas de `tareas_entre_podas`
+ * tareas terminadas desde la ultima poda (la terminada con la etiqueta `poda`
+ * de mayor numero; sin ninguna, se cuentan todas). Sin tareas terminadas, nada.
+ */
+export function comprobarPodaTests(
+  cwd: string,
+  tareasRoot: string,
+  cfg: TaskcodeConfig | null,
+  crecimiento: readonly Comprobacion[] = comprobarCrecimientoSuite(cwd, tareasRoot, cfg)
+): Comprobacion[] {
+  if (cfg === null) return [];
+  let ids: string[];
+  try {
+    ids = readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId);
+  } catch {
+    return [];
+  }
+  if (ids.length === 0) return [];
+  const numero = (id: string): number => Number(/^TASK-(\d+)/.exec(id)?.[1] ?? 0);
+  let ultimaPoda = -1;
+  for (const id of ids) {
+    try {
+      const t = parseTareaFile(readFileSync(path.join(tareasRoot, STATE_FOLDER.terminada, id, 'tarea.md'), 'utf8')).task;
+      if (t.etiquetas.includes(ETIQUETA_PODA)) ultimaPoda = Math.max(ultimaPoda, numero(id));
+    } catch {
+      // ilegible: de eso avisa `tareas`
+    }
+  }
+  const desde = ids.filter((id) => numero(id) > ultimaPoda).length;
+  const n = cfg.tareas_entre_podas;
+  const crece = crecimiento.some((c) => c.nivel === 'aviso');
+  const motivos: string[] = [];
+  if (crece) motivos.push('la suite crecio mas del umbral (ver crecimiento-suite)');
+  if (desde > n) {
+    motivos.push(
+      `${String(desde)} tareas terminadas ${ultimaPoda === -1 ? 'sin ninguna poda' : 'desde la ultima poda'} ` +
+        `(tareas_entre_podas: ${String(n)})`
+    );
+  }
+  if (motivos.length === 0) {
+    return [ok('poda-tests', `${String(desde)} de ${String(n)} tareas terminadas desde la ultima poda de tests`)];
+  }
+  return [aviso('poda-tests', `toca podar los tests redundantes: ${motivos.join('; ')}`, `Abre la tarea con: ${COMANDO_NUEVA_PODA}`)];
+}
+
 // ---------------------------------------------------------------------
 // Tareas
 // ---------------------------------------------------------------------
@@ -1007,7 +1062,9 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   );
   cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
   cs.push(...envolver('puertas-verificacion', () => comprobarPuertasVerificacion(cfg)));
-  cs.push(...envolver('crecimiento-suite', () => comprobarCrecimientoSuite(cwd, tareasRoot, cfg)));
+  const crecimientoSuite = envolver('crecimiento-suite', () => comprobarCrecimientoSuite(cwd, tareasRoot, cfg));
+  cs.push(...crecimientoSuite);
+  cs.push(...envolver('poda-tests', () => comprobarPodaTests(cwd, tareasRoot, cfg, crecimientoSuite)));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
   cs.push(...envolver('documento-estado', () => comprobarDocumentoEstado(cwd, cfg, repo, deps.ahora ?? new Date())));
   cs.push(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 880a5e8..4081c47 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -35,6 +35,7 @@
  * | comando_verificacion_pesada  | null (sin pesados) | finish-verificacion.ts, hooks/guardia-merge.ts, doctor.ts (TASK-126) |
  * | verificacion_pesada_en       | [release]         | finish-verificacion.ts, hooks/guardia-merge.ts (TASK-126) |
  * | umbral_crecimiento_suite     | 20 (%)            | commands/doctor.ts (TASK-129) |
+ * | tareas_entre_podas           | 30                | commands/doctor.ts (TASK-130) |
  * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096); la decision la aplican fs/decision-documentacion.ts, finish-verificacion.ts, freno-stop.ts, review.ts y guardia-merge.ts (TASK-105..108); doctor.ts avisa (TASK-109) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
@@ -300,6 +301,8 @@ export interface TaskcodeConfig {
   verificacion_pesada_en: readonly TipoRamaPesada[];
   /** TASK-129: % de crecimiento de la suite (tests o duracion de la completa) entre versiones que hace avisar a doctor. */
   umbral_crecimiento_suite: number;
+  /** TASK-130: tareas terminadas desde la ultima poda de tests a partir de las que doctor la propone. */
+  tareas_entre_podas: number;
 }
 
 /** TASK-126: los tipos de rama de Git-Flow que pueden exigir la verificacion pesada. */
@@ -376,6 +379,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   comando_verificacion_pesada: null,
   verificacion_pesada_en: Object.freeze(['release']) as readonly TipoRamaPesada[],
   umbral_crecimiento_suite: 20,
+  tareas_entre_podas: 30,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -411,6 +415,7 @@ export const CLAVES_CONFIG = [
   'comando_verificacion_pesada',
   'verificacion_pesada_en',
   'umbral_crecimiento_suite',
+  'tareas_entre_podas',
 ] as const;
 
 /**
@@ -731,6 +736,16 @@ export function parsearConfigConAvisos(
           'comando_verificacion_pesada: "cargo test -- --ignored"'
         );
         break;
+      case 'tareas_entre_podas':
+        if (typeof par.valor !== 'number' || !Number.isInteger(par.valor) || par.valor < 1) {
+          throw new ConfigError(
+            `[ERROR] ${donde}: "tareas_entre_podas" debe ser un numero entero mayor o igual que 1, y es ` +
+              `${describirValor(par.valor)}.\n        Por defecto es 30: tareas terminadas desde la ultima poda de ` +
+              'tests a partir de las que doctor propone otra.'
+          );
+        }
+        config.tareas_entre_podas = par.valor;
+        break;
       case 'umbral_crecimiento_suite':
         if (typeof par.valor !== 'number' || !Number.isInteger(par.valor) || par.valor < 1 || par.valor > 1000) {
           throw new ConfigError(
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-130/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-130/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-130/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-130/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-130/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-130/planificacion/plan-final.md                                    | 27 ++++++++++++++++++++++++++-
 tareas/{01-en-diseno => 02-en-curso}/TASK-130/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                     | 57 +++++++++++++++++++++++++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 11 +++++++++++
 9 files changed, 94 insertions(+), 4 deletions(-)
````

## Tests del diff (29 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(glob)**/test/**" ":(glob)**/tests/**" ":(glob)**/__tests__/**" ":(glob)**/*.test.*" ":(glob)**/*.spec.*" ":(exclude,glob)**/dist/**" ":(exclude,glob)**/*.lock" ":(exclude,glob)**/*-lock.json" ":(exclude,glob)**/*-lock.yaml" ":(exclude,glob)**/*-lock.yml" ":(exclude,glob)**/*-lock.toml" ":(exclude,glob)tareas/**" ":(exclude,glob)tareas/*/TASK-*/aceptacion/**"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts                            |   75 +++---
 taskcode-marketplace/plugins/taskcode-plugin/test/cli/asignado.test.ts                        |  166 +++++-------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/board.test.ts                      |  315 +++++++++--------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/cobertura-cambios.test.ts          |  345 ++++++++++++-------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts |  346 +++++++++++++------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts       |  485 ++++++++++++++++++-----------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts    |  571 +++++++++++++++++++++--------------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts              | 1360 +++++++++++++++++++++++++++++++++++++++++++++++++------------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts     |  301 +++++++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts                     | 1003 +++++++++++++++++++++++++++++++++++------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts                     |  316 +++++++++--------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts                   |  301 ++++++++--------------
 taskcode-marketplace/plugins/taskcode-plugin/test/core/frontmatter.test.ts                    |   90 +++----
 taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts                     | 1008 ++++++++++++++++++++++++++++++++++++++----------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/test/core/import-parser.test.ts                  |  191 +++++++-------
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts                  |  413 ++++++++++++++++--------------
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts                       |  815 ++++++++++++++++++++++++++++++----------------------------
 taskcode-marketplace/plugins/taskcode-plugin/test/core/poda-tests.test.ts                     |   78 ++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts                  |  134 ++++------
 taskcode-marketplace/plugins/taskcode-plugin/test/core/task-id.test.ts                        |   51 +---
 taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts                           |  128 +++-------
 taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts                   |  647 ++++++++++++++++++++++++----------------------
 taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts                            |  194 +++++++-------
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts                              |  135 +++++-----
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts                    |  157 ++++++------
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts         |  137 +++++-----
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts                 |  299 +++++++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts                  |  232 ++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts                      |    1 +
 29 files changed, 5005 insertions(+), 5289 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 203.3 s
- Commit verificado: 24cb77c1e25871be2337d05dc6d3ff169a15e58b
- Huella: a986d7b8898e1dd4d100b4ba4e17081179a854b5
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 92054 bytes en total):

````
✔ tieneAncla: codigo, rutas, flags, comandos, tests y numeros cuentan; IDs y secciones no (1.1233ms)
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.5523ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (1.502ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.4923ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (0.9435ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.8048ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (3.6168ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (4.4948ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (13.9893ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.3822ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.4844ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7472ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (2664.4067ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (3157.6659ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.0125ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2502ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8793ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.7099ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.3717ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.0375ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.7651ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6896ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.8559ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (4.5508ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (5.1366ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (42.7052ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (2.3837ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4686ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.556ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3843ms)
ℹ tests 747
ℹ suites 0
ℹ pass 747
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 177716.9374
[verificar-impacto] node --test termino con 0 en 178.6 s.
````
