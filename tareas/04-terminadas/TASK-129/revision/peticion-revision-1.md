# Peticion de revision — TASK-129 (ronda 1)

- Tarea: TASK-129 — Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento
- Rama revisada: feature/task-129-freno-al-crecimiento-de-la-suite-presupu
- Rama base: develop
- Commit revisado (HEAD): 4b82c76b8db6f76a0499506279d6541650117a6e
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-129 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-129/tarea.md
- tareas/03-en-revision/TASK-129/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts

## Commits a revisar (git log develop..HEAD)

````
4b82c76 feat(TASK-129): presupuesto de tests por criterio, guia de pesados y aviso de crecimiento de la suite
03d213a chore(TASK-129): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 79e55bd..cac7d9d 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,7 @@
 # Changelog
 
 ## Sin publicar
+- Cambio de comportamiento (TASK-129): la plantilla del plan y la skill plan piden por criterio cuantos tests nuevos (presupuesto de 1 a 3, con motivo si se pasa); la skill review trata un test duplicado como MENOR; anexo `tests-pesados.md` (como marcar pesados en Node, Rust, Java y .NET). La completa anota en el registro de puertas su numero de tests (linea `suite`); `metricas --por-version` muestra tests y duracion de la completa por version, y `doctor` avisa si crecieron mas de `umbral_crecimiento_suite` (20 % por defecto).
 - TASK-126 (feature) — Verificacion por tipo de rama: los tests pesados solo en la puerta de release (2026-11-13)
 - Cambio de comportamiento (TASK-126): claves `comando_verificacion_pesada` y `verificacion_pesada_en` (`[release]` por defecto; admite `hotfix`). Los pesados se corren ademas de la completa solo en el finish de esos tipos de rama, y el guardian de merges exige su verde para integrar a mano una release; feature y fix no los corren. `taskctl doctor` dice que puerta corre los pesados. Sin las claves, todo como antes.
 - TASK-115 (feature) — P-7: verificacion completa por lote de cierres en modo automatico (2026-11-13)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 2303ec6..a6d86ca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -241,6 +241,7 @@ La referencia detallada vive en `docs/`, un fichero por tema:
     - [Puerta de verificación en `finish`](docs/configuracion.md#puerta-de-verificación-en-finish)
     - [Verificación completa por lote: `verificacion_por_lote`](docs/configuracion.md#verificación-completa-por-lote-verificacion_por_lote)
     - [Tests pesados solo en release: `comando_verificacion_pesada`](docs/configuracion.md#tests-pesados-solo-en-release-comando_verificacion_pesada)
+    - [Crecimiento de la suite: `umbral_crecimiento_suite`](docs/configuracion.md#crecimiento-de-la-suite-umbral_crecimiento_suite)
     - [Tests held-out (`aceptacion/`)](docs/configuracion.md#tests-held-out-aceptacion)
     - [Cobertura de las líneas cambiadas](docs/configuracion.md#cobertura-de-las-líneas-cambiadas)
     - [Guardián de merges (hook `PreToolUse`)](docs/configuracion.md#guardián-de-merges-hook-pretooluse)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index 26f1ba4..6182487 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -357,6 +357,19 @@ verificacion_pesada_en: [release, hotfix]               # opcional; por defecto
   categoría o tag de JUnit excluida por defecto; en .NET, un `Trait` que el
   filtro normal excluye.
 
+#### Crecimiento de la suite: `umbral_crecimiento_suite`
+
+Cada verificación completa (la de `finish` y la de `taskctl verificar-lote`)
+deja en el registro de puertas una línea `suite` con el número de tests que
+dice la salida (node --test, Jest, dotnet, Maven/Gradle, cargo, pytest; `-` si
+no se reconoce) y su duración. `taskctl metricas --por-version` muestra por
+versión el mayor número de tests y la mediana de la duración de la completa, y
+`taskctl doctor` avisa (`crecimiento-suite`) si cualquiera creció más de
+`umbral_crecimiento_suite` (porcentaje entero, 20 por defecto) entre las dos
+últimas versiones con dato. Sin datos, ni avisa ni falla. Qué hacer cuando
+avisa (presupuesto de tests por criterio, marcar pesados): skill
+`task-workflow`, `tests-pesados.md`.
+
 #### Tests held-out (`aceptacion/`)
 
 Tests de aceptación que escribe la **persona** a partir de los criterios y que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index 90b5f6a..9bf7144 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -72,6 +72,9 @@ no deberian necesitar volver a preguntar.
    ver `task-workflow/duracion.md`) y preguntaselo a la persona: decide ella.
    Si acepta, `taskctl trocear TASK-NNN`; si no, escribe en el plan el
    motivo para no trocear y sigue con approve. Nunca troceas sin su respuesta.
+   En `## Plan de pruebas`, por cada criterio, cuantos tests nuevos preve (de 1
+   a 3; si pasa, el motivo) y cuales seran pesados (rendimiento, escala), ver
+   `task-workflow/tests-pesados.md`.
    Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
    anota las respuestas en el propio plan. Si la salida de `taskctl plan`
    nombro `skills_recomendados`, dejalos anotados para la implementacion.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index e287b9f..1713230 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -69,8 +69,8 @@ punto, no un formalismo.
 4. Registra el coste de la revision (`task-workflow/coste.md`) con el id que
    devolvio la herramienta Agent de cada revisor:
    `taskctl registrar-coste TASK-NNN --fase revision --agente <id>
-   [--agente <id2>...]` (una vez por ronda; suma). La cifra que muestra Claude
-   Code al terminar un agente NO es su coste (es su contexto final). Tu parte,
+   [--agente <id2>...]` (una vez por ronda; suma; no es la cifra que Claude
+   Code muestra al terminar el agente). Tu parte,
    si quieres, estimada y aparte con `--tokens N`. No crea commit: queda
    pendiente con los informes.
    Escribe cada veredicto con el comando, no a mano:
@@ -79,6 +79,7 @@ punto, no un formalismo.
    completo: `--informe informe-revision-N-<revisor>.md`. Con CRITICO o
    IMPORTANTE abiertos, `cambios-solicitados`: se corrigen, se commitea, y se
    vuelve a esta skill (abre la ronda siguiente).
+   Un test que duplica a otro ya existente es MENOR.
    **Antes de abrir la ronda siguiente se corrige TODO lo de la ronda**, en
    cualquier modo: los CRITICO e IMPORTANTE siempre; un MENOR que no compense
    corregir se marca `aceptado` con su motivo en su informe o se pasa a una
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 32ec997..bafa661 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -186,9 +186,8 @@ que ha dejado de ser cierto es peor que no tenerlo.
 Claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`,
 `modo_flujo`, `excluir_de_revision`, `cierre_por_defecto`, las dos del remoto
 (`plataforma_remota`, `url_base_remoto`), las dos de verificacion
-(`comando_verificacion`, los tests de los frenos, y
-`timeout_verificacion`) y las tres de sincronizacion de ficheros derivados
-tras cada transicion. Sin fichero, todo por defecto; un valor invalido de una
+(`comando_verificacion` y `timeout_verificacion`) y las de sincronizacion
+de ficheros derivados. Sin fichero, todo por defecto; un valor invalido de una
 clave conocida aborta, y una clave desconocida avisa y se
 ignora. La sincronizacion y sus trampas, en [sincronizacion.md](sincronizacion.md).
 `tareas/ROADMAP.md` y su zona manual, en [roadmap.md](roadmap.md).
@@ -199,6 +198,7 @@ en verde, devuelve el turno con un informe. Arregla la causa; no borres,
 saltes ni debilites tests para pasarlo. Si el rojo no es tuyo, dilo
 al terminar: solo bloquea una vez por turno.
 `comando_verificacion_selectiva` y `comando_verificacion_freno`: [verificacion-selectiva.md](verificacion-selectiva.md).
+Tests por criterio y pesados: [tests-pesados.md](tests-pesados.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
 `taskctl finish` verifica antes de mergear y aborta en rojo. Un merge (o el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
new file mode 100644
index 0000000..9246b67
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
@@ -0,0 +1,43 @@
+# Tests pesados y presupuesto de tests
+
+La suite solo crece: cada criterio y cada ronda anaden tests, y los lentos
+corren con los demas en cada cierre. Dos frenos.
+
+## Presupuesto de tests por criterio
+
+En `## Plan de pruebas` del plan, por cada criterio, cuantos tests nuevos se
+preven: **de 1 a 3**. Si un criterio necesita mas, el plan dice por que. Antes
+de escribir un test, busca si ya hay uno que cubra lo mismo: ampliarlo es
+mejor que duplicarlo. En la revision, un test que duplica a otro ya existente
+es un hallazgo MENOR.
+
+## Marcar un test como pesado
+
+Un test de rendimiento, escala o carga (segundos o minutos, datos grandes) se
+marca como pesado para que quede **fuera** de `comando_verificacion` y corra
+solo con `comando_verificacion_pesada`, que `finish` exige en las ramas release
+(y hotfix si el proyecto lo declara en `verificacion_pesada_en`).
+
+| Lenguaje | Como marcarlo | Completa | Pesados |
+|---|---|---|---|
+| Node (`node --test`) | En un directorio aparte (`test/pesados/`) o con sufijo `.pesado.test.js` | `node --test "test/unit/**/*.test.js"` | `node --test "test/pesados/**/*.test.js"` |
+| Rust | `#[ignore]` en el test | `cargo test` | `cargo test -- --ignored` |
+| Java (JUnit 5) | `@Tag("pesado")` | `mvn test -DexcludedGroups=pesado` | `mvn test -Dgroups=pesado` |
+| .NET (xUnit) | `[Trait("Categoria", "Pesado")]` | `dotnet test --filter "Categoria!=Pesado"` | `dotnet test --filter "Categoria=Pesado"` |
+
+```yaml
+# .taskcode/config.yml
+comando_verificacion: "cargo test"
+comando_verificacion_pesada: "cargo test -- --ignored"
+```
+
+Sin `comando_verificacion_pesada` no hay puerta de pesados: un test marcado
+asi no lo corre nadie, asi que no lo marques sin declarar la clave.
+
+## El aviso de crecimiento
+
+`taskctl metricas --por-version` muestra por version el numero de tests y la
+duracion de la verificacion completa (del registro de puertas), y
+`taskctl doctor` avisa si cualquiera crecio mas de `umbral_crecimiento_suite`
+(20 % por defecto) desde la version anterior. Es la senal para podar tests
+redundantes o marcar pesados.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 50b8bc4..9f02015 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -44,6 +44,9 @@ import {
   omitida,
   type Comprobacion,
 } from '../core/doctor.js';
+import { avisoCrecimiento, suitePorVersion } from '../core/crecimiento-suite.js';
+import { versionDeCierre } from '../core/transiciones.js';
+import { leerRegistroPuertas } from '../fs/registro-puertas.js';
 import { resolverConfigConAvisos, CONFIG_DEFAULTS, presupuestoFreno, type TaskcodeConfig } from '../core/config.js';
 import { comandoPropuesto, type ComandoTests } from '../core/comando-tests.js';
 import { comandoParcial, documentacionDeclarada } from '../core/verificacion-proporcional.js';
@@ -574,6 +577,41 @@ export function comprobarPuertasVerificacion(cfg: TaskcodeConfig | null): Compro
   return [ok('puertas-verificacion', `${freno}; ${review}; ${finish}; ${pesados}`)];
 }
 
+/**
+ * TASK-129: aviso de crecimiento de la suite. Por version de cierre de las
+ * tareas terminadas, el numero de tests y la duracion de la completa (lineas
+ * `suite` del registro de puertas); avisa si, entre las dos ultimas versiones
+ * con dato, crecieron mas de `umbral_crecimiento_suite`. Sin datos, nada: ni
+ * avisa ni falla.
+ */
+export function comprobarCrecimientoSuite(cwd: string, tareasRoot: string, cfg: TaskcodeConfig | null): Comprobacion[] {
+  if (cfg === null || cfg.comando_verificacion === null) return [];
+  let ids: string[];
+  try {
+    ids = readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId);
+  } catch {
+    return [];
+  }
+  const tareas = ids.map((id) => {
+    try {
+      return { id, version: versionDeCierre(readFileSync(path.join(tareasRoot, STATE_FOLDER.terminada, id, 'tarea.md'), 'utf8')) };
+    } catch {
+      return { id, version: null };
+    }
+  });
+  const versiones = suitePorVersion(tareas, leerRegistroPuertas(cwd));
+  if (versiones.length === 0) return [];
+  const umbral = cfg.umbral_crecimiento_suite;
+  const motivo = avisoCrecimiento(versiones, umbral);
+  if (motivo === null) {
+    return [ok('crecimiento-suite', `la suite no crecio mas del ${String(umbral)} % entre las dos ultimas versiones con dato`)];
+  }
+  const arreglo =
+    'Poda los tests redundantes o marca como pesados los de rendimiento y escala (comando_verificacion_pesada); ' +
+    'guia: skill task-workflow, tests-pesados.md';
+  return [aviso('crecimiento-suite', motivo, arreglo)];
+}
+
 // ---------------------------------------------------------------------
 // Tareas
 // ---------------------------------------------------------------------
@@ -969,6 +1007,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   );
   cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
   cs.push(...envolver('puertas-verificacion', () => comprobarPuertasVerificacion(cfg)));
+  cs.push(...envolver('crecimiento-suite', () => comprobarCrecimientoSuite(cwd, tareasRoot, cfg)));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
   cs.push(...envolver('documento-estado', () => comprobarDocumentoEstado(cwd, cfg, repo, deps.ahora ?? new Date())));
   cs.push(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index a5f2fd4..a1f80b8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -61,6 +61,8 @@ import { autoCommit, mensajeChore } from '../fs/git-commit.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
 import { ejecutarVerificacion, guardarMemo, huellaDelArbol, verificarConMemo } from '../fs/verificacion.js';
 import { PUERTA_FINISH } from '../core/registro-puertas.js';
+import { contarTests, PUERTA_SUITE } from '../core/crecimiento-suite.js';
+import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 import { configDeRef } from '../fs/config-de-ref.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
 import { FinishCommandError } from './finish-opciones.js';
@@ -212,6 +214,22 @@ function porLoteEnBase(o: PuertaVerificacionOpts, ramaBase: string): boolean {
   }
 }
 
+/**
+ * TASK-129: el tamano de la completa en el registro de puertas (puerta
+ * `suite`, modo = numero de tests o `-`), para el aviso de crecimiento.
+ */
+export function anotarSuite(cwd: string, id: string, inicioMs: number, r: ResultadoVerificacion): void {
+  const n = contarTests(r.cola);
+  anotarPuerta(cwd, {
+    puerta: PUERTA_SUITE,
+    tarea: id,
+    instante: new Date().toISOString(),
+    modo: n === null ? '-' : String(n),
+    duracionS: (Date.now() - inicioMs) / 1000,
+    resultado: r.estado === 'verde' ? 'verde' : 'rojo',
+  });
+}
+
 function opcionesEjecucion(o: PuertaVerificacionOpts): { timeoutMs?: number; env?: NodeJS.ProcessEnv } {
   return {
     ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
@@ -332,6 +350,7 @@ export async function puertaVerificacion(
   const inicioMs = Date.now();
   const r = ejecutarVerificacion(o.cwd, comando, timeoutS, opcionesEjecucion(o));
   anotarFinish(o.cwd, o.id, 'completa', inicioMs, r.estado);
+  anotarSuite(o.cwd, o.id, inicioMs, r);
   // El memo solo con el arbol limpio: es la huella del commit que consulta el
   // guardian de merges; con el arbol sucio no la casaria nunca (MEN-3).
   const limpio = isWorkspaceClean(o.cwd);
@@ -622,6 +641,7 @@ export function puertaReintento(o: PuertaReintentoOpts): ResultadoReintento {
   const inicioReintento = Date.now();
   const v = verificarConMemo(o.cwd, { ...peticion, memoSoloVerde: true }, opciones);
   anotarFinish(o.cwd, o.id, peticion.tipo, inicioReintento, v.resultado.estado, v.deMemo);
+  if (peticion.tipo === 'completa' && !v.deMemo) anotarSuite(o.cwd, o.id, inicioReintento, v.resultado);
   if (v.resultado.estado !== 'verde') {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: la rama ya esta integrada en "${o.ramaIntegracion}", pero la verificacion de su arbol no sale ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index c367fa8..ce81428 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -42,6 +42,7 @@
  * No entra en `--escribir`, y todo sale del repo: nunca se lee `~/.claude`.
  */
 import { PUERTA_FINISH, PUERTA_REVIEW, resumirFreno, resumirPuerta, sumarPorTarea } from '../core/registro-puertas.js';
+import { PUERTA_SUITE } from '../core/crecimiento-suite.js';
 import { leerRegistroPuertas } from '../fs/registro-puertas.js';
 import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
@@ -509,12 +510,19 @@ export async function leerRepoMetricas(repo: RepoMetricas, varios: boolean): Pro
   // TASK-128: las verificaciones de review y de finish, de la misma lectura.
   const reviewPorTarea = resumirPuerta(registroPuertas, PUERTA_REVIEW);
   const finishPorTarea = resumirPuerta(registroPuertas, PUERTA_FINISH);
+  // TASK-129: la ultima completa en verde de cada tarea (numero de tests y duracion).
+  const suitePorTarea = new Map<string, { tests: number | null; completaS: number }>();
+  for (const l of registroPuertas) {
+    if (l.puerta !== PUERTA_SUITE || l.resultado !== 'verde') continue;
+    suitePorTarea.set(l.tarea, { tests: /^\d+$/.test(l.modo) ? Number(l.modo) : null, completaS: l.duracionS });
+  }
   const filas: FilaMetricas[] = leidas.map((l) =>
     calcularFila({
       sincronizacionS: sincPorTarea.get(l.task.task.id) ?? null,
       freno: frenoPorTarea.get(l.task.task.id) ?? null,
       review: reviewPorTarea.get(l.task.task.id) ?? null,
       finishVerificacion: finishPorTarea.get(l.task.task.id) ?? null,
+      suite: suitePorTarea.get(l.task.task.id) ?? null,
       task: l.task.task,
       body: l.task.body,
       ronda: l.ronda,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index dd03db2..d2f98b0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -264,11 +264,18 @@ export function planTemplate(task: Task, roles: readonly RolBrainstorm[]): strin
     `${LINEA_PLANTILLA_DURACION}\n\n\n` +
     seccionRoles +
     '## Riesgos aceptados y que los contiene\n\n\n' +
-    '## Plan de pruebas\n\n\n' +
+    // TASK-129: presupuesto de tests por criterio. Solo se ANADE una linea
+    // (el detector de esqueleto compara por lineas, como en TASK-097).
+    '## Plan de pruebas\n\n' +
+    `${LINEA_PLANTILLA_PRESUPUESTO_TESTS}\n\n\n` +
     '## Lo que necesita decision de una persona\n\n'
   );
 }
 
+/** TASK-129: la linea del presupuesto de tests por criterio en la plantilla del plan. */
+export const LINEA_PLANTILLA_PRESUPUESTO_TESTS =
+  'Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):';
+
 export interface PlanCommandResult {
   /** TASK-043: avisos de la validacion del enunciado (no bloquean). */
   avisosEnunciado: string[];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
index 16be700..388a11f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
@@ -28,6 +28,7 @@ import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso
 import { currentBranch, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
 import { autoCommit, type AutoCommitResult } from '../fs/git-commit.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
+import { anotarSuite } from './finish-verificacion.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
 import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
 import { spawnSync } from 'node:child_process';
@@ -142,6 +143,8 @@ export async function runVerificarLoteCommand(
     duracionS: (Date.now() - inicio) / 1000,
     resultado: r.estado === 'verde' ? 'verde' : 'rojo',
   });
+  // TASK-129: el tamano de la completa, anotado a la ultima tarea del lote.
+  anotarSuite(cwd, ids[ids.length - 1] as string, inicio, r);
   // Como finish: el memo de la completa solo con el arbol limpio (la huella del commit).
   const limpio = isWorkspaceClean(cwd);
   const huella = limpio ? huellaDelArbol(cwd, comando, timeoutS) : null;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index a59af4f..880a5e8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -34,6 +34,7 @@
  * | verificacion_por_lote        | false             | commands/finish-verificacion.ts (de la base), verificar-lote.ts (TASK-115) |
  * | comando_verificacion_pesada  | null (sin pesados) | finish-verificacion.ts, hooks/guardia-merge.ts, doctor.ts (TASK-126) |
  * | verificacion_pesada_en       | [release]         | finish-verificacion.ts, hooks/guardia-merge.ts (TASK-126) |
+ * | umbral_crecimiento_suite     | 20 (%)            | commands/doctor.ts (TASK-129) |
  * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096); la decision la aplican fs/decision-documentacion.ts, finish-verificacion.ts, freno-stop.ts, review.ts y guardia-merge.ts (TASK-105..108); doctor.ts avisa (TASK-109) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
@@ -297,6 +298,8 @@ export interface TaskcodeConfig {
   comando_verificacion_pesada: string | null;
   /** TASK-126: tipos de rama que exigen los pesados (`release`, `hotfix`); `[release]` por defecto. */
   verificacion_pesada_en: readonly TipoRamaPesada[];
+  /** TASK-129: % de crecimiento de la suite (tests o duracion de la completa) entre versiones que hace avisar a doctor. */
+  umbral_crecimiento_suite: number;
 }
 
 /** TASK-126: los tipos de rama de Git-Flow que pueden exigir la verificacion pesada. */
@@ -372,6 +375,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   verificacion_por_lote: false,
   comando_verificacion_pesada: null,
   verificacion_pesada_en: Object.freeze(['release']) as readonly TipoRamaPesada[],
+  umbral_crecimiento_suite: 20,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -406,6 +410,7 @@ export const CLAVES_CONFIG = [
   'verificacion_por_lote',
   'comando_verificacion_pesada',
   'verificacion_pesada_en',
+  'umbral_crecimiento_suite',
 ] as const;
 
 /**
@@ -726,6 +731,16 @@ export function parsearConfigConAvisos(
           'comando_verificacion_pesada: "cargo test -- --ignored"'
         );
         break;
+      case 'umbral_crecimiento_suite':
+        if (typeof par.valor !== 'number' || !Number.isInteger(par.valor) || par.valor < 1 || par.valor > 1000) {
+          throw new ConfigError(
+            `[ERROR] ${donde}: "umbral_crecimiento_suite" debe ser un porcentaje entero de 1 a 1000, y es ` +
+              `${describirValor(par.valor)}.\n        Por defecto es 20: doctor avisa si los tests o la duracion de ` +
+              'la verificacion completa crecen mas de ese porcentaje entre dos versiones.'
+          );
+        }
+        config.umbral_crecimiento_suite = par.valor;
+        break;
       case 'verificacion_pesada_en':
         config.verificacion_pesada_en = validarVerificacionPesadaEn(donde, par.valor);
         break;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
new file mode 100644
index 0000000..050b21b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
@@ -0,0 +1,114 @@
+/**
+ * TASK-129: freno al crecimiento de la suite. Puro, sin disco.
+ *
+ * - `contarTests`: el numero de tests que dice la salida de la verificacion
+ *   completa, para los runners comunes; null si no se reconoce (sin dato,
+ *   nunca un numero inventado).
+ * - `suitePorVersion`: por version de cierre, el mayor numero de tests visto y
+ *   la mediana de la duracion de la completa en verde, de las lineas `suite`
+ *   del registro de puertas.
+ * - `avisoCrecimiento`: entre las dos ultimas versiones con dato, si los tests
+ *   o la duracion crecieron mas que el umbral.
+ */
+import type { LineaPuerta } from './registro-puertas.js';
+import { compararVersiones } from './version.js';
+
+/** TASK-129: la puerta con el tamano de la completa: modo = numero de tests (o `-`). */
+export const PUERTA_SUITE = 'suite';
+
+function sumar(texto: string, re: RegExp): number | null {
+  let total: number | null = null;
+  for (const m of texto.matchAll(re)) total = (total ?? 0) + Number(m[1]) + (m[2] === undefined ? 0 : Number(m[2]));
+  return total;
+}
+
+function ultimo(texto: string, re: RegExp): number | null {
+  let n: number | null = null;
+  for (const m of texto.matchAll(re)) n = Number(m[1]);
+  return n;
+}
+
+/**
+ * Numero de tests de la salida de un runner. Reconoce, por este orden:
+ * node --test (`ℹ tests N` / `# tests N`), Jest/Vitest (`Tests: … N total`),
+ * dotnet (`Total tests: N`), Maven/Gradle (ultimo `Tests run: N`), cargo
+ * (suma de `test result: … N passed; M failed`) y pytest (`N passed, M failed`).
+ */
+export function contarTests(salida: string): number | null {
+  const t = salida.replace(/\x1b\[[0-9;]*m/g, '');
+  const node = ultimo(t, /^\s*(?:ℹ|#)\s+tests\s+(\d+)\s*$/gm);
+  if (node !== null) return node;
+  const jest = ultimo(t, /^\s*Tests:\s+.*?(\d+)\s+total\s*$/gm);
+  if (jest !== null) return jest;
+  const dotnet = ultimo(t, /Total tests:\s*(\d+)/g);
+  if (dotnet !== null) return dotnet;
+  const maven = ultimo(t, /Tests run:\s*(\d+)/g);
+  if (maven !== null) return maven;
+  const cargo = sumar(t, /test result: \w+\.\s+(\d+) passed;\s+(\d+) failed/g);
+  if (cargo !== null) return cargo;
+  const pytest = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
+  if (pytest !== null) return Number(pytest[2]) + (pytest[1] === undefined ? 0 : Number(pytest[1]));
+  return null;
+}
+
+export interface SuiteVersion {
+  version: string;
+  /** Mayor numero de tests visto en las tareas de esa version; null sin dato. */
+  tests: number | null;
+  /** Mediana de la duracion (s) de la completa en verde; null sin dato. */
+  completaS: number | null;
+}
+
+function mediana(xs: readonly number[]): number | null {
+  if (xs.length === 0) return null;
+  const o = [...xs].sort((a, b) => a - b);
+  const m = Math.floor(o.length / 2);
+  return o.length % 2 === 1 ? (o[m] as number) : ((o[m - 1] as number) + (o[m] as number)) / 2;
+}
+
+/** Por version (orden semver), de las lineas `suite` en verde de las tareas de cada version. */
+export function suitePorVersion(
+  tareas: readonly { id: string; version: string | null }[],
+  lineas: readonly LineaPuerta[]
+): SuiteVersion[] {
+  const versionDe = new Map(tareas.filter((t) => t.version !== null).map((t) => [t.id, t.version as string]));
+  const tests = new Map<string, number[]>();
+  const duraciones = new Map<string, number[]>();
+  for (const l of lineas) {
+    if (l.puerta !== PUERTA_SUITE || l.resultado !== 'verde') continue;
+    const v = versionDe.get(l.tarea);
+    if (v === undefined) continue;
+    duraciones.set(v, [...(duraciones.get(v) ?? []), l.duracionS]);
+    if (/^\d+$/.test(l.modo)) tests.set(v, [...(tests.get(v) ?? []), Number(l.modo)]);
+  }
+  return [...new Set([...tests.keys(), ...duraciones.keys()])].sort(compararVersiones).map((version) => ({
+    version,
+    tests: tests.has(version) ? Math.max(...(tests.get(version) as number[])) : null,
+    completaS: mediana(duraciones.get(version) ?? []),
+  }));
+}
+
+/**
+ * El aviso si, entre las dos ultimas versiones con dato de cada magnitud, los
+ * tests o la duracion de la completa crecieron mas de `umbralPct`. null sin
+ * datos suficientes o sin crecimiento: ni avisa ni falla.
+ */
+export function avisoCrecimiento(versiones: readonly SuiteVersion[], umbralPct: number): string | null {
+  const partes: string[] = [];
+  const comparar = (nombre: string, sel: (v: SuiteVersion) => number | null, fmt: (n: number) => string): void => {
+    const con = versiones.filter((v) => sel(v) !== null);
+    if (con.length < 2) return;
+    const a = con[con.length - 2] as SuiteVersion;
+    const b = con[con.length - 1] as SuiteVersion;
+    const va = sel(a) as number;
+    const vb = sel(b) as number;
+    if (va <= 0) return;
+    const pct = ((vb - va) / va) * 100;
+    if (pct > umbralPct) {
+      partes.push(`${nombre} ${fmt(va)} en ${a.version} -> ${fmt(vb)} en ${b.version} (+${String(Math.round(pct))} %)`);
+    }
+  };
+  comparar('tests', (v) => v.tests, (n) => String(n));
+  comparar('duracion de la completa', (v) => v.completaS, (n) => `${String(Math.round(n))} s`);
+  return partes.length === 0 ? null : `la suite crecio mas del ${String(umbralPct)} %: ${partes.join('; ')}`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index c110e3e..372da63 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -232,6 +232,8 @@ export interface FilaMetricas {
   finishVerificacion: { ejecuciones: number; duracion: Duracion } | null;
   /** TASK-128: rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE; null sin dato. */
   rondasSoloMenores: number | null;
+  /** TASK-129: la ultima completa en verde de la tarea (tests y segundos); null sin dato. */
+  suite: { tests: number | null; completaS: number } | null;
 }
 
 export interface EntradaMetricas {
@@ -255,6 +257,8 @@ export interface EntradaMetricas {
   review?: { ejecuciones: number; duracionS: number } | null;
   /** TASK-128: las verificaciones de finish de la tarea en el registro de puertas; sin dato, null. */
   finishVerificacion?: { ejecuciones: number; duracionS: number } | null;
+  /** TASK-129: la ultima linea `suite` en verde de la tarea; sin dato, null. */
+  suite?: { tests: number | null; completaS: number } | null;
 }
 
 /** TASK-111/128: el resumen de una puerta en la forma de la fila (duracion en ms). */
@@ -479,6 +483,7 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     review: puertaDeFila(e.review),
     finishVerificacion: puertaDeFila(e.finishVerificacion),
     rondasSoloMenores: rondasSoloMenores(e.informes ?? []),
+    suite: e.suite ?? null,
     puntaAPunta: duracionSinPausas(marcas.start, marcas.finish, marcas.intervalosPausa),
     estimadaMin: estimadaAnotada(e.body),
     enPausa: enPausaDe(marcas),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
index b2912a3..a4670f9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
@@ -53,6 +53,10 @@ export interface GrupoVersion {
   hallazgosPorSeveridad: ConteoSeveridad;
   hallazgosPorOrigen: ConteoOrigen;
   tokens: { diseno: CifraTokens; implementacion: CifraTokens; revision: CifraTokens };
+  /** TASK-129: el mayor numero de tests de la completa visto en el grupo; null sin dato. */
+  tests: number | null;
+  /** TASK-129: mediana de la duracion (s) de la completa en verde; null sin dato. */
+  completaS: number | null;
 }
 
 export interface PorVersion {
@@ -97,6 +101,16 @@ export function resumirVersion(version: string | null, filas: readonly FilaMetri
     sinTablaHallazgos: g.sinTablaHallazgos,
     hallazgosPorSeveridad: porSeveridad,
     hallazgosPorOrigen: porOrigen,
+    tests: (() => {
+      const xs = filas.map((f) => f.suite?.tests ?? null).filter((x): x is number => x !== null);
+      return xs.length === 0 ? null : Math.max(...xs);
+    })(),
+    completaS: (() => {
+      const xs = filas.map((f) => f.suite?.completaS ?? null).filter((x): x is number => x !== null).sort((a, b) => a - b);
+      if (xs.length === 0) return null;
+      const m = Math.floor(xs.length / 2);
+      return xs.length % 2 === 1 ? (xs[m] as number) : ((xs[m - 1] as number) + (xs[m] as number)) / 2;
+    })(),
     tokens: {
       diseno: cifraTokens(filas.map((f) => f.tokens.diseno)),
       implementacion: cifraTokens(filas.map((f) => f.tokens.implementacion)),
@@ -132,14 +146,27 @@ export const NOTA_POR_VERSION =
   'o editadas a mano): nunca se deducen por fecha. «a la primera» y «rondas medias», de las tareas con ' +
   'revision. Hallazgos: suma de las tareas con tabla de hallazgos (n), una vez por revisor + ID; ' +
   '«sin tabla» se cuenta aparte, no como cero. Tokens: media por tarea de las que tienen dato en esa ' +
-  'fase (n). «—» = ninguna tarea del grupo tiene ese dato.';
+  'fase (n). tests y completa: el mayor numero de tests y la mediana de la duracion de la verificacion ' +
+  'completa en verde del grupo, del registro de puertas (linea suite). «—» = ninguna tarea del grupo tiene ese dato.';
 
 /** Texto de `--por-version`: una tabla de rondas y tokens y otra de hallazgos. */
 export function formatearPorVersion(p: PorVersion): string {
   const grupos = [...p.versiones, ...(p.sinVersion.n > 0 ? [p.sinVersion] : [])];
   const nombre = (g: GrupoVersion): string => g.version ?? 'sin version';
   const general = tablaDeTexto(
-    ['version', 'tareas', 'con revision', 'a la primera', 'rondas medias', 'tokens diseno', 'tokens impl.', 'tokens revision'],
+    [
+      'version',
+      'tareas',
+      'con revision',
+      'a la primera',
+      'rondas medias',
+      'tokens diseno',
+      'tokens impl.',
+      'tokens revision',
+      // TASK-129: tamano de la suite (registro de puertas, linea `suite`).
+      'tests',
+      'completa',
+    ],
     grupos.map((g) => [
       nombre(g),
       String(g.n),
@@ -149,6 +176,8 @@ export function formatearPorVersion(p: PorVersion): string {
       celdaTokens(g.tokens.diseno),
       celdaTokens(g.tokens.implementacion),
       celdaTokens(g.tokens.revision),
+      celda(g.tests),
+      g.completaS === null ? '—' : `${String(Math.round(g.completaS))} s`,
     ])
   );
   const hallazgos = tablaDeTexto(
````

## Excluido del diff (20 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/peticion-brainstorm-dominio-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/salida-brainstorm-dominio-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-129/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                     | 41 ++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        | 19 +++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   |  9 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       |  7 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-lote.js                             |  3 +++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 11 ++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/crecimiento-suite.js                              | 97 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/versiones-metricas.js                             | 30 ++++++++++++++++++++++++--
 20 files changed, 217 insertions(+), 4 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts | 127 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts         |   1 +
 2 files changed, 128 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 199.1 s
- Commit verificado: 4b82c76b8db6f76a0499506279d6541650117a6e
- Huella: cc50ef0384d31ce6b31655595be150ac62b4d5aa
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 90617 bytes en total):

````
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (6.2039ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (21.1201ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.5253ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.383ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.6007ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.4411ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.5697ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (32.766ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.1668ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (1.0178ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.573ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3795ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.4828ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.2354ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2355ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2219ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2269ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.211ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2916ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.2078ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1985ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.165ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1699ms)
✔ resolverAsignado: recorta los tres escalones (0.182ms)
✔ topes: cada .md de skills/ y agents/ tiene tope en la tabla y cabe en el (132.3156ms)
✔ topes: el total de skills/ + agents/ cabe en su tope (85.6829ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (3.413ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (0.8938ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.349ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.4395ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.604ms)
ℹ tests 953
ℹ suites 0
ℹ pass 953
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 182402.3437
[verificar-impacto] node --test termino con 0 en 182.5 s.
````
