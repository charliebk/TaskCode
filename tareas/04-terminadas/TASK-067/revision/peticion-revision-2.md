# Peticion de revision — TASK-067 (ronda 2)

- Tarea: TASK-067 — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release
- Rama revisada: feature/task-067-doctor-deploy-b-puntos-de-juicio-tareas
- Rama base: develop
- Commit revisado (HEAD): 2993eded3aca00fa549f079f733ca6d80ba4fec3
- Fecha: 2026-10-28
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-067 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 8291dcd415eac5a86d7159c78bb31c9a20f6198c (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | src/core/aviso-release.ts:84 | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/fs/evidencia-veredicto.ts:20-31 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/fs/informes-deploy.ts:~58, src/commands/doctor-deploy.ts:79 y :~345 | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/fs/sondas-deploy.ts (rama `sinVerificar`, antes de `if (sinMirar > 0)`) | informe-revision-1.md |

## Commits a revisar (git log 8291dcd415eac5a86d7159c78bb31c9a20f6198c..HEAD)

````
2993ede fix(TASK-067): ronda 2 - aviso de release ignora tareas/, evidencia rechaza enlaces y submodulos, carpeta de informes unica y recuento en NO VERIFICADO
28b99a0 chore(TASK-067): coste revision +11965309 tokens (1 agente)
65cb674 chore(TASK-067): veredicto ronda 1 (cambios-solicitados)
b5f3e01 docs(TASK-067): informe de revision ronda 1
761ca65 chore(TASK-067): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 8291dcd415eac5a86d7159c78bb31c9a20f6198c..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 88c2b53..39c1e31 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -30,7 +30,8 @@ Doctor-deploy B (TASK-067), segunda mitad de doctor-deploy.
   anterior crearia TASK-10000 tras un TASK-9999.
 - **`finish` de una release avisa, sin bloquear**, si no hay un informe de
   doctor-deploy al dia (el de la punta, o un ancestro con solo
-  `docs/doctor-deploy/` cambiado) o si tiene alguna FALLA de severidad critica.
+  `docs/doctor-deploy/` o `tareas/` cambiados) o si tiene alguna FALLA de
+  severidad critica.
 - **Cambio de comportamiento (MEN-12 de TASK-066)**: `gitignore-cubre-env` ya no
   se queda en las 10 primeras carpetas de proyecto. Revisa todas (tope de 200) o
   sale NO VERIFICADO diciendo cuantas faltan. Un monorepo con mas de 10
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index d4eccaf..69cbbc5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -692,9 +692,10 @@ actualizad el plugin a la vez.
 las sondas; solo lee `docs/doctor-deploy/*.json`), si:
 
 - no hay un informe que valga: el informe más reciente cuyo `commit` es la punta
-  que se cierra, o un **ancestro** con solo `docs/doctor-deploy/` cambiado entre
-  ambos (el informe se commitea después de generarse, así que su commit nunca es
-  la punta); o
+  que se cierra, o un **ancestro** con solo `docs/doctor-deploy/` o `tareas/`
+  cambiados entre ambos (el informe se commitea después de generarse, así que su
+  commit nunca es la punta, y la revisión, los veredictos y los costes commitean en
+  `tareas/` sin tocar el código); o
 - ese informe tiene alguna FALLA de un punto de severidad `critica`.
 
 Cualquier fallo al leer (un informe ilegible, Git que no responde) se convierte en
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
index c0a6481..9e4fc45 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
@@ -47,6 +47,7 @@ import {
   VeredictoFormatoError,
   type ResumenVeredictos,
 } from '../core/doctor-deploy-veredictos.js';
+import { CARPETA_INFORMES_REL } from '../core/aviso-release.js';
 import { ocultarSecretos } from '../core/secretos.js';
 import { ocultarCredenciales } from '../core/plataforma-remota.js';
 import { BaseBranchGuardError } from '../fs/git.js';
@@ -76,7 +77,7 @@ export const FLAGS_DOCTOR_DEPLOY: readonly string[] = ['--json', '--escribir', '
 const MAX_BYTES_RESULTADO = 1024 * 1024;
 
 /** Carpeta (relativa a la raiz del repo) donde `--escribir` deja el informe. */
-export const CARPETA_INFORMES = path.join('docs', 'doctor-deploy');
+export const CARPETA_INFORMES = path.join(...CARPETA_INFORMES_REL.split('/'));
 
 export interface DoctorDeployDeps {
   repoCwd: string;
@@ -390,7 +391,7 @@ function analizar(argv: readonly string[], deps: DoctorDeployDeps): Analisis {
 
   // Los informes de --escribir no cuentan como «sucio»: dejan el arbol sin trackear a proposito
   // y una segunda ejecucion se marcaria sucia solo por el informe anterior.
-  const estado = gitTexto(['status', '--porcelain', '--', '.', ':(exclude)docs/doctor-deploy'], raiz, { timeoutMs: 30_000 });
+  const estado = gitTexto(['status', '--porcelain', '--', '.', `:(exclude)${CARPETA_INFORMES_REL}`], raiz, { timeoutMs: 30_000 });
   const commitCrudo = gitTexto(['rev-parse', '--verify', '--quiet', 'HEAD'], raiz, { timeoutMs: 15_000 });
   const rama = gitTexto(['symbolic-ref', '--short', '-q', 'HEAD'], raiz, { timeoutMs: 15_000 });
   if (estado === null) avisos.push('no se pudo saber si el arbol esta limpio (git status fallo): se marca como sucio.');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/aviso-release.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/aviso-release.ts
index 9b979ae..aff93a8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/aviso-release.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/aviso-release.ts
@@ -8,8 +8,9 @@
  * Que informe vale: el criterio original pedia el del commit que se cierra,
  * pero el informe se commitea DESPUES de generarse, asi que su commit nunca es
  * la punta. Vale el informe cuyo commit es la punta, o un ancestro con solo
- * `docs/doctor-deploy/` cambiado entre ambos (decision de la persona). Si hay
- * varios validos, el mas reciente.
+ * `docs/doctor-deploy/` o `tareas/` cambiados entre ambos (decision de la persona;
+ * `tareas/` desde la ronda 2 de revision: review, veredictos y costes commitean ahi
+ * despues del informe sin tocar el codigo). Si hay varios validos, el mas reciente.
  *
  * Es un aviso, no un control de seguridad: un informe editado a mano lo
  * engana, y no se pretende evitarlo.
@@ -17,6 +18,14 @@
 /** Carpeta de los informes de `--escribir`, con `/` de Git. */
 export const CARPETA_INFORMES_REL = 'docs/doctor-deploy';
 
+/** Carpetas cuyos cambios no invalidan un informe: el propio informe y el registro de tareas. */
+export const CARPETAS_SIN_CODIGO: readonly string[] = [CARPETA_INFORMES_REL, 'tareas'];
+
+/** true si la ruta (con `/` de Git) esta dentro de una carpeta que no es codigo publicado. */
+export function esRutaSinCodigo(ruta: string): boolean {
+  return CARPETAS_SIN_CODIGO.some((c) => ruta.startsWith(`${c}/`));
+}
+
 export interface PuntoInformeLeido {
   id: string;
   estado: string;
@@ -81,13 +90,13 @@ export function avisosRelease(e: EntradaAvisoRelease): string[] {
       if (cambiadas === null) {
         validos.push({ informe, motivoDescartado: 'no se pudo comparar su commit con el que se cierra' });
       } else {
-        const codigo = cambiadas.filter((r) => !r.startsWith(`${CARPETA_INFORMES_REL}/`));
+        const codigo = cambiadas.filter((r) => !esRutaSinCodigo(r));
         validos.push(
           codigo.length === 0
             ? { informe, motivoDescartado: null }
             : {
                 informe,
-                motivoDescartado: `es del commit ${informe.commit.slice(0, 12)} y desde entonces ha cambiado ${cuantos(codigo.length, 'fichero', 'ficheros')} fuera de ${CARPETA_INFORMES_REL}/`,
+                motivoDescartado: `es del commit ${informe.commit.slice(0, 12)} y desde entonces ha cambiado ${cuantos(codigo.length, 'fichero', 'ficheros')} fuera de ${CARPETAS_SIN_CODIGO.map((c) => `${c}/`).join(' y ')}`,
               }
         );
       }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
index bd18371..838cd9f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/evidencia-veredicto.ts
@@ -24,6 +24,15 @@ export function comprobadorEnCommit(raiz: string, commit: string): ComprobadorEv
   return (fichero, linea) => {
     // Normalizada con `/`; `./a` y `a` son el mismo fichero. Los `..` ya los rechazo quien llama.
     const ruta = fichero.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '');
+    // El modo del arbol distingue un fichero normal de un enlace simbolico (120000) o un
+    // submodulo (160000): `cat-file blob` devuelve el texto del enlace como si fuera el fichero
+    // (MEN-2 de la ronda 1).
+    const entrada = gitCrudo(['ls-tree', '-z', commit, '--', ruta], raiz, { timeoutMs: 15_000 });
+    if (entrada.status === 0) {
+      const modo = entrada.stdout.toString('utf8').split(' ')[0] ?? '';
+      if (modo === '120000') return `${ruta} es un enlace simbolico en el commit analizado: cita el fichero al que apunta`;
+      if (modo === '160000') return `${ruta} es un submodulo en el commit analizado: no se puede citar una linea`;
+    }
     const r = gitCrudo(['cat-file', 'blob', `${commit}:${ruta}`], raiz, { timeoutMs: 15_000, maxBuffer: MAX_BYTES_FICHERO });
     if (r.error !== undefined) {
       return `no se pudo leer ${ruta} en el commit analizado (${r.error.message.split('\n')[0] ?? 'error'}): puede ser demasiado grande`;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/informes-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/informes-deploy.ts
index 12b5770..de652cc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/informes-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/informes-deploy.ts
@@ -5,7 +5,7 @@
  */
 import { readdirSync, readFileSync, statSync } from 'node:fs';
 import path from 'node:path';
-import { avisosRelease, type ConsultasGit, type InformeLeido, type PuntoInformeLeido } from '../core/aviso-release.js';
+import { avisosRelease, CARPETA_INFORMES_REL, type ConsultasGit, type InformeLeido, type PuntoInformeLeido } from '../core/aviso-release.js';
 import { diffNameOnly, headCommit, isAncestor } from './git.js';
 
 const MAX_BYTES_INFORME = 5 * 1024 * 1024;
@@ -48,7 +48,7 @@ export function interpretarInforme(archivo: string, texto: string): InformeLeido
 }
 
 export function leerInformesDeploy(raiz: string): InformesLeidos {
-  const dir = path.join(raiz, 'docs', 'doctor-deploy');
+  const dir = path.join(raiz, ...CARPETA_INFORMES_REL.split('/'));
   let nombres: string[];
   try {
     nombres = readdirSync(dir);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
index 915756e..7ae1376 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
@@ -414,7 +414,12 @@ export const sondaGitignoreEnv: Sonda = (ctx) => {
     };
   }
   const sinVerificar = rs.find((r) => r.estado !== 'ok');
-  if (sinVerificar !== undefined) return sinVerificar;
+  if (sinVerificar !== undefined) {
+    // MEN-4 de la ronda 1: el motivo dice tambien cuantas carpetas quedaron sin mirar.
+    return sinMirar > 0
+      ? { ...sinVerificar, motivo: `${sinVerificar.motivo}; ademas ${sinMirar} carpeta(s) de proyecto sin comprobar` }
+      : sinVerificar;
+  }
   if (sinMirar > 0) {
     return {
       estado: 'no-verificado',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-men.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-men.test.ts
index 78c32cc..f92330b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-men.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-men.test.ts
@@ -86,6 +86,26 @@ test('MEN-13 (N12): si git check-ignore no se puede ejecutar, el punto es NO VER
   const r = sondaGitignoreEnv(ctx);
   assert.equal(r.estado, 'no-verificado');
   assert.match(r.motivo, /no se pudo ejecutar git check-ignore/);
+  assert.doesNotMatch(r.motivo, /sin comprobar/);
+});
+
+test('ronda 2 (MEN-4): un NO VERIFICADO con carpetas por encima del tope dice tambien cuantas faltan', () => {
+  const ctx: ContextoDeploy = {
+    cwd: path.join(tmpdir(), 'taskctl-dd-no-existe-nunca'),
+    presentes: [],
+    versionados: [],
+    versionadosTodos: [],
+    paraEscanear: [],
+    hallazgosHistorial: [],
+    tipos: [{ id: 'node', nombre: 'Node', rutas: ['apps/a', 'apps/b', 'apps/c', 'apps/d', 'apps/e'] }],
+    silencios: [],
+    silenciosUsados: new Set<number>(),
+    opciones: { ...OPCIONES_SONDAS_POR_DEFECTO, pathHerramientas: '', maxCarpetasGitignore: 2 },
+  };
+  const r = sondaGitignoreEnv(ctx);
+  assert.equal(r.estado, 'no-verificado');
+  assert.match(r.motivo, /no se pudo ejecutar git check-ignore/);
+  assert.match(r.motivo, /ademas 3 carpeta\(s\) de proyecto sin comprobar/);
 });
 
 test('MEN-13 (N14): un `// require` en un comentario de go.mod no cuenta como dependencia (sin go.sum sigue OK)', async () => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts
index 300db34..f84f6de 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts
@@ -233,6 +233,23 @@ test('fichero no versionado (existe en disco pero no en el commit), carpeta o in
   });
 });
 
+test('ronda 2 (MEN-2): un enlace simbolico o un submodulo versionados no valen como evidencia', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    // Entradas de indice con modo de enlace (120000) y de submodulo (160000), sin crear nada en
+    // disco: asi funciona tambien en Windows sin permiso de symlinks. El blob del enlace es el de
+    // index.js, de modo que la linea 1 "existe": solo el modo puede rechazarlo.
+    const blob = git(['rev-parse', 'HEAD:index.js'], raiz);
+    git(['update-index', '--add', '--cacheinfo', `120000,${blob},enlace.js`], raiz);
+    git(['update-index', '--add', '--cacheinfo', `160000,${git(['rev-parse', 'HEAD'], raiz)},sub`], raiz);
+    git(['commit', '-q', '-m', 'enlace y submodulo'], raiz);
+    const head = git(['rev-parse', 'HEAD'], raiz);
+    assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { fichero: 'enlace.js' })] }), /enlace simbolico/);
+    assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { fichero: 'sub' })] }), /submodulo/);
+    // El fichero normal del mismo commit sigue valiendo.
+    assert.equal(punto(await conResultado(raiz, opciones, { veredictos: [veredicto(head)] }), PUNTO).estado, 'ok');
+  });
+});
+
 test('fichero binario versionado: rechazado', async () => {
   await conRepo({ ...NODE }, async (raiz, opciones) => {
     await writeFile(path.join(raiz, 'logo.bin'), Buffer.from([1, 2, 0, 3, 10, 4]));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-aviso-release.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-aviso-release.test.ts
index 2e5b8cc..46b4ec9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-aviso-release.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-aviso-release.test.ts
@@ -102,7 +102,19 @@ test('informe de un ancestro con codigo cambiado despues: avisa diciendo cuantos
     commitAll(repoRoot, 'feat: codigo nuevo');
     const avisos = await cerrar(repoRoot, tareasRoot);
     assert.equal(avisos.length, 1, avisos.join('\n'));
-    assert.match(avisos[0] as string, /el mas reciente \(2026-10-27\.json\) es del commit [0-9a-f]{12} y desde entonces ha cambiado 2 ficheros fuera de docs\/doctor-deploy\//);
+    assert.match(avisos[0] as string, /el mas reciente \(2026-10-27\.json\) es del commit [0-9a-f]{12} y desde entonces ha cambiado 2 ficheros fuera de docs\/doctor-deploy\/ y tareas\//);
+  });
+});
+
+test('ronda 2 (MEN-1): commits solo en tareas/ despues del informe (review, veredictos, costes) no avisan', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await prepararRelease(repoRoot, tareasRoot);
+    await generarInforme(repoRoot);
+    commitAll(repoRoot, 'docs: informe');
+    await mkdir(path.join(repoRoot, 'tareas', 'extra'), { recursive: true });
+    await writeFile(path.join(repoRoot, 'tareas', 'extra', 'x.md'), 'registro de la revision\n', 'utf8');
+    commitAll(repoRoot, 'chore(TASK-001): coste revision');
+    assert.deepEqual(await cerrar(repoRoot, tareasRoot), []);
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/aviso-release.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/aviso-release.test.ts
index 08786f4..d347931 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/aviso-release.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/aviso-release.test.ts
@@ -44,7 +44,13 @@ test('ancestro: solo docs/doctor-deploy/ cambiado vale; cualquier otra ruta, no;
   const base = { punta: B, informes: [informe({ commit: A })] };
   assert.deepEqual(avisosRelease(entrada({ ...base, git: git(true, ['docs/doctor-deploy/2026-10-27.md', 'docs/doctor-deploy/2026-10-27.json']) })), []);
   const mal = avisosRelease(entrada({ ...base, git: git(true, ['docs/doctor-deploy/x.md', 'src/a.ts']) }));
-  assert.match(mal[0] as string, /ha cambiado 1 fichero fuera de docs\/doctor-deploy\//);
+  assert.match(mal[0] as string, /ha cambiado 1 fichero fuera de docs\/doctor-deploy\/ y tareas\//);
+  // Ronda 2 (MEN-1): los commits de tareas/ (review, veredictos, costes) no invalidan el informe...
+  assert.deepEqual(avisosRelease(entrada({ ...base, git: git(true, ['tareas/03-en-revision/TASK-9/tarea.md', 'docs/doctor-deploy/x.json']) })), []);
+  // ...pero no cuentan como codigo solo ellos: con tareas/ y codigo, el codigo sigue avisando.
+  assert.match(avisosRelease(entrada({ ...base, git: git(true, ['tareas/x.md', 'src/a.ts', 'src/b.ts']) }))[0] as string, /ha cambiado 2 ficheros fuera/);
+  // Una carpeta de nombre parecido a tareas/ si es codigo.
+  assert.equal(avisosRelease(entrada({ ...base, git: git(true, ['tareas-viejas/x.md']) })).length, 1);
   // Una carpeta de nombre parecido no es la de los informes.
   assert.equal(avisosRelease(entrada({ ...base, git: git(true, ['docs/doctor-deploy-viejo/x.md']) })).length, 1);
   assert.match(avisosRelease(entrada({ ...base, git: git(true, null) }))[0] as string, /no se pudo comparar/);
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 8291dcd415eac5a86d7159c78bb31c9a20f6198c..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-067/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-067/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-067/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-067/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-067/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-067/planificacion/plan-final.md                                    |    4 +
 tareas/03-en-revision/TASK-067/revision/informe-revision-1.md                                                  |   95 ++
 tareas/03-en-revision/TASK-067/revision/peticion-revision-1.md                                                 | 3790 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-067/tarea.md                                                       |    6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy.js                                |    5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/aviso-release.js                                    |   15 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/evidencia-veredicto.js                                |   11 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/informes-deploy.js                                    |    4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-deploy.js                                      |    8 +-
 14 files changed, 3926 insertions(+), 12 deletions(-)
````
