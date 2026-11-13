# Peticion de revision — TASK-116 (ronda 1)

- Tarea: TASK-116 — P-8: TaskCode declara su verificacion y doctor avisa cuando falta
- Rama revisada: feature/task-116-p-8-taskcode-declara-su-verificacion-y-d
- Rama base: develop
- Commit revisado (HEAD): 3fc45efb13630b7cde6f6d50342d6b98b08ed58b
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-116 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-116/tarea.md
- tareas/03-en-revision/TASK-116/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts

## Commits a revisar (git log develop..HEAD)

````
3fc45ef chore(TASK-116): autorrevision
3f93372 build(TASK-116): dist de doctor
1004bf6 feat(TASK-116): doctor cuenta las tareas terminadas sin verificar en el aviso de verificacion
137f3a5 chore(TASK-116): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index a693484..4af1084 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -438,20 +438,35 @@ function comprobarConfig(cwd: string): { cs: Comprobacion[]; cfg: TaskcodeConfig
  *
  * `detectar` solo se llama cuando falta la clave: la lectura de disco no se
  * paga en los proyectos ya configurados.
+ *
+ * TASK-116 (P-8): el aviso dice ademas cuantas tareas terminadas hay
+ * (`contarTerminadas`, que solo se llama en ese camino). Son todas las de
+ * `04-terminadas`: finish no deja rastro ni sin comando ni con la puerta en
+ * verde, asi que no se puede separar una verificada de otra que no; sin la
+ * clave hoy, ninguna paso por la puerta. Una clave que existio y se quito
+ * sobrecuenta, y se acepta: el aviso no cambia el codigo de salida.
  */
 export function comprobarVerificacion(
   cfg: TaskcodeConfig | null,
-  detectar: () => readonly ComandoTests[] = () => []
+  detectar: () => readonly ComandoTests[] = () => [],
+  contarTerminadas: () => number = () => 0
 ): Comprobacion {
   if (cfg === null) return omitida('verificacion', 'config invalida: no se sabe como se verifica el proyecto (ver config)');
   if (cfg.comando_verificacion === null) {
     const detectados = detectar();
     const propuesto = comandoPropuesto(detectados);
     if (propuesto !== null) {
+      const terminadas = contarTerminadas();
+      const cerradas =
+        terminadas === 0
+          ? ''
+          : terminadas === 1
+            ? '; 1 tarea terminada se cerro sin verificar'
+            : `; ${terminadas} tareas terminadas se cerraron sin verificar`;
       return aviso(
         'verificacion',
         `sin comando_verificacion y el proyecto tiene tests (${detectados.map((d) => d.motivo).join(', ')}): ` +
-          'los frenos de verificacion no actuan',
+          `los frenos de verificacion no actuan${cerradas}`,
         `Declara en .taskcode/config.yml: comando_verificacion: "${propuesto}"`
       );
     }
@@ -464,6 +479,19 @@ export function comprobarVerificacion(
   return ok('verificacion', `comando_verificacion: "${una(cfg.comando_verificacion)}" (timeout ${cfg.timeout_verificacion} s)`);
 }
 
+/**
+ * TASK-116: cuantas tareas hay en `tareas/04-terminadas` (con el criterio de
+ * ID de `comprobarTareas`). Una carpeta que falta o no se lee cuenta 0: de eso
+ * ya informan `tareas-carpetas` y `tareas`.
+ */
+export function contarTerminadas(tareasRoot: string): number {
+  try {
+    return readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId).length;
+  } catch {
+    return 0;
+  }
+}
+
 /**
  * TASK-091: la verificacion selectiva por impacto. Solo dice algo cuando hay
  * completa (sin ella la comprobacion `verificacion` ya cuenta lo que falta,
@@ -903,7 +931,13 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   cs.push(...envolver('workspace', () => comprobarWorkspace(cwd, repo, deps.timeoutGitMs ?? TIMEOUT_GIT_MS)));
 
   cs.push(...csConfig);
-  cs.push(...envolver('verificacion', () => comprobarVerificacion(cfg, () => detectarComandosTests(cwd))));
+  cs.push(...envolver('verificacion', () => comprobarVerificacion(
+        cfg,
+        () => detectarComandosTests(cwd),
+        () => contarTerminadas(tareasRoot)
+      )
+    )
+  );
   cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
   cs.push(...envolver('documento-estado', () => comprobarDocumentoEstado(cwd, cfg, repo, deps.ahora ?? new Date())));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
index dca03db..ad14e2a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
@@ -15,7 +15,14 @@ import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promise
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
-import { runDoctorCommand, envolver, DoctorCommandError } from '../../src/commands/doctor.js';
+import {
+  runDoctorCommand,
+  envolver,
+  DoctorCommandError,
+  comprobarVerificacion,
+  contarTerminadas,
+} from '../../src/commands/doctor.js';
+import { parsearConfig } from '../../src/core/config.js';
 import type { Comprobacion } from '../../src/core/doctor.js';
 import { serializeTareaFile } from '../../src/core/tarea-file.js';
 import { STATE_FOLDER, type Task } from '../../src/core/task.js';
@@ -389,6 +396,79 @@ for (const caso of CASOS_TASK_088) {
   });
 }
 
+/** TASK-116: `n` tareas en 04-terminadas, commiteadas con el resto (el workspace queda limpio). */
+async function terminadas(repoRoot: string, n: number): Promise<void> {
+  for (let i = 1; i <= n; i++) {
+    await tareaEn(repoRoot, STATE_FOLDER.terminada, `TASK-${String(i).padStart(3, '0')}`, 'terminada');
+  }
+}
+
+for (const caso of [
+  { n: 3, texto: '; 3 tareas terminadas se cerraron sin verificar' },
+  { n: 1, texto: '; 1 tarea terminada se cerro sin verificar' },
+]) {
+  test(`verificacion (TASK-116): sin comando_verificacion, con tests y ${caso.n} terminada(s), el aviso las cuenta`, async () => {
+    await conRepo(async (repoRoot) => {
+      await terminadas(repoRoot, caso.n);
+      // No son IDs de tarea: no cuentan.
+      await mkdir(path.join(repoRoot, 'tareas', STATE_FOLDER.terminada, 'notas'), { recursive: true });
+      await writeFile(path.join(repoRoot, 'tareas', STATE_FOLDER.terminada, 'notas', 'x.md'), 'x\n', 'utf8');
+      await ficheros(repoRoot, { 'package.json': PKG_CON_TEST });
+      const r = doctor(repoRoot);
+      const c = por(r.comprobaciones, 'verificacion');
+      assert.equal(c.nivel, 'aviso', niveles(r.comprobaciones));
+      assert.ok(c.mensaje.endsWith(`los frenos de verificacion no actuan${caso.texto}`), c.mensaje);
+      assert.equal(c.arreglo, 'Declara en .taskcode/config.yml: comando_verificacion: "npm test"');
+      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+    });
+  });
+}
+
+test('verificacion (TASK-116): sin terminadas el aviso no menciona tareas; con la clave, ok sin recuento', async () => {
+  await conRepo(async (repoRoot) => {
+    await ficheros(repoRoot, { 'package.json': PKG_CON_TEST });
+    const sin = por(doctor(repoRoot).comprobaciones, 'verificacion');
+    assert.equal(sin.nivel, 'aviso');
+    assert.ok(sin.mensaje.endsWith('los frenos de verificacion no actuan'), sin.mensaje);
+    await terminadas(repoRoot, 2);
+    await config(repoRoot, 'comando_verificacion: "npm test"\n');
+    commitAll(repoRoot, 'config y terminadas');
+    const con = por(doctor(repoRoot).comprobaciones, 'verificacion');
+    assert.equal(con.nivel, 'ok');
+    assert.equal(con.mensaje, 'comando_verificacion: "npm test" (timeout 600 s)');
+  });
+});
+
+test('verificacion (TASK-116): sin tests detectables sigue en omitida y no cuenta las terminadas', async () => {
+  await conRepo(async (repoRoot) => {
+    await terminadas(repoRoot, 2);
+    commitAll(repoRoot, 'terminadas');
+    const c = por(doctor(repoRoot).comprobaciones, 'verificacion');
+    assert.equal(c.nivel, 'omitida');
+    assert.doesNotMatch(c.mensaje, /terminada/);
+  });
+});
+
+test('verificacion (TASK-116): contarTerminadas solo se llama en el camino del aviso', () => {
+  const noLlamar = (): number => {
+    throw new Error('no deberia contar las terminadas');
+  };
+  const npm = [{ comando: 'npm test', motivo: 'package.json con script "test"' }] as const;
+  assert.equal(comprobarVerificacion(parsearConfig('comando_verificacion: "npm test"\n', 'c.yml'), () => npm, noLlamar).nivel, 'ok');
+  assert.equal(comprobarVerificacion(parsearConfig('', 'c.yml'), () => [], noLlamar).nivel, 'omitida');
+  assert.equal(comprobarVerificacion(null, () => npm, noLlamar).nivel, 'omitida');
+  assert.match(comprobarVerificacion(parsearConfig('', 'c.yml'), () => npm, () => 27).mensaje, /; 27 tareas terminadas se cerraron sin verificar$/);
+});
+
+test('verificacion (TASK-116): contarTerminadas da 0 si la carpeta falta', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-sin-terminadas-'));
+  try {
+    assert.equal(contarTerminadas(path.join(dir, 'tareas')), 0);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
+
 test('verificacion (TASK-088): manifiestos que no son tests, o en una subcarpeta, siguen en omitida', async () => {
   await conRepo(async (repoRoot) => {
     await ficheros(repoRoot, {
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-116/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-116/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-116/tarea.md                                    |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                  | 32 +++++++++++++++++++++++++++++---
 4 files changed, 35 insertions(+), 4 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 257.9 s

Final de la salida (truncada: 96107 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.9546ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (2.2296ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0519ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (5.9744ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (11.717ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6992ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.0408ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (28.8832ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (1.7469ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (2.6269ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.5008ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.6418ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3475ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (3.5344ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (38.1992ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.1234ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (1.6067ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.5645ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3189ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.3538ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.4787ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2246ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2185ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.1964ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.1893ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.5429ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1771ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2145ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1683ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1786ms)
✔ resolverAsignado: recorta los tres escalones (0.1697ms)
ℹ tests 928
ℹ suites 0
ℹ pass 928
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 229531.0714
[verificar-impacto] node --test termino con 0 en 229.7 s.
````
