# Peticion de revision — TASK-053 (ronda 1)

- Tarea: TASK-053 — moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows
- Rama revisada: fix/task-053-movetareafile-reintenta-el-rename-ante-u
- Rama base: develop
- Commit revisado (HEAD): 78ff3a4164887fbaf74c78533fc25d04f2f0f43d
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-053 (criterios de aceptacion y plan)

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

## Commits a revisar (git log develop..HEAD)

````
78ff3a4 fix(TASK-053): moveTareaFile reintenta el rename ante EPERM o EBUSY transitorio
eb72759 chore(TASK-053): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
index 7c83ee6..fae38ba 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
@@ -192,6 +192,40 @@ export interface MoveTareaFileOptions {
    * pasa, en vez de "arreglarlo" en silencio.
    */
   tolerateMissingSource?: boolean;
+  /** Solo para tests (TASK-053): sustituye a `fs.rename`. */
+  renombrar?: (desde: string, hasta: string) => Promise<void>;
+  /** Solo para tests (TASK-053): esperas entre reintentos, en ms. */
+  esperasReintento?: readonly number[];
+}
+
+/** Esperas entre reintentos del rename: ~3 s en total. */
+const ESPERAS_RENAME_MS = [100, 200, 400, 800, 1600] as const;
+
+/**
+ * `rename` que reintenta ante EPERM o EBUSY (TASK-053). En Windows, un
+ * antivirus o el indexador pueden tener abierto un instante un fichero de
+ * la carpeta, y el rename falla aunque nada lo impida de verdad. Paso dos
+ * veces seguidas en `finish` (TASK-037 y TASK-040), con el merge ya hecho:
+ * la tarea quedaba a medias y habia que reintentar a mano. Cualquier otro
+ * error, o agotar los reintentos, se propaga igual que antes.
+ */
+async function renombrarConReintentos(
+  desde: string,
+  hasta: string,
+  renombrar: (a: string, b: string) => Promise<void>,
+  esperas: readonly number[]
+): Promise<void> {
+  for (let intento = 0; ; intento++) {
+    try {
+      await renombrar(desde, hasta);
+      return;
+    } catch (e: unknown) {
+      const code = (e as { code?: string }).code;
+      const transitorio = code === 'EPERM' || code === 'EBUSY';
+      if (!transitorio || intento >= esperas.length) throw e;
+      await new Promise((ok) => setTimeout(ok, esperas[intento]));
+    }
+  }
 }
 
 /**
@@ -231,7 +265,12 @@ export async function moveTareaFile(
     }
     await mkdir(path.dirname(newDir), { recursive: true });
     try {
-      await rename(oldDir, newDir);
+      await renombrarConReintentos(
+        oldDir,
+        newDir,
+        options.renombrar ?? rename,
+        options.esperasReintento ?? ESPERAS_RENAME_MS
+      );
     } catch (e: unknown) {
       if (!isEnoent(e) || !options.tolerateMissingSource) throw e;
       // La carpeta vieja no existe en el working tree actual y el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-reintento.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-reintento.test.ts
new file mode 100644
index 0000000..9b4f69e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-reintento.test.ts
@@ -0,0 +1,108 @@
+/**
+ * TASK-053: moveTareaFile reintenta el rename ante EPERM/EBUSY. El
+ * fallo transitorio se simula envolviendo el rename real; las carpetas
+ * se mueven de verdad en disco.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, rename } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { writeTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
+import type { Task } from '../../src/core/task.js';
+
+const TASK: Task = {
+  id: 'TASK-960',
+  titulo: 'Prueba de reintento',
+  tipo: 'feature',
+  sprint: 1,
+  etiquetas: [],
+  complejidad: 'simple',
+  modelo_sugerido: 'sonnet',
+  estado: 'en-revision',
+  plan_aprobado: true,
+  rama: 'feature/task-960-reintento',
+  asignado_a: null,
+  agente_revisor: 'general-purpose',
+  skills_recomendados: [],
+  regla_seleccion_skill: null,
+  ultimo_commit_revisado: null,
+  revision_codex: false,
+  creado: '2026-10-04',
+  actualizado: '2026-10-04',
+  dependencias: [],
+};
+
+function errorDe(code: string): NodeJS.ErrnoException {
+  const e = new Error(`${code}: simulado`) as NodeJS.ErrnoException;
+  e.code = code;
+  return e;
+}
+
+async function conTarea(fn: (tareas: string, origen: string) => Promise<void>): Promise<void> {
+  const tareas = await mkdtemp(path.join(tmpdir(), 'taskctl-reint-'));
+  try {
+    const origen = await writeTareaFile(tareas, TASK, '## Objetivo\nx\n');
+    await fn(tareas, origen);
+  } finally {
+    await rm(tareas, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+test('moveTareaFile (TASK-053): un EPERM que dura dos intentos no impide mover la tarea', async () => {
+  await conTarea(async (tareas, origen) => {
+    let fallos = 0;
+    const renombrar = async (a: string, b: string): Promise<void> => {
+      if (fallos < 2) {
+        fallos++;
+        throw errorDe('EPERM');
+      }
+      await rename(a, b);
+    };
+    const destino = await moveTareaFile(tareas, origen, { ...TASK, estado: 'terminada' }, 'x\n', {
+      renombrar,
+      esperasReintento: [1, 1, 1, 1, 1],
+    });
+    assert.equal(fallos, 2);
+    assert.ok(existsSync(destino));
+    assert.ok(!existsSync(path.dirname(origen)));
+  });
+});
+
+test('moveTareaFile (TASK-053): un EPERM que no cede se propaga tras los reintentos y la tarea sigue en su sitio', async () => {
+  await conTarea(async (tareas, origen) => {
+    let intentos = 0;
+    const renombrar = async (): Promise<void> => {
+      intentos++;
+      throw errorDe('EBUSY');
+    };
+    await assert.rejects(
+      moveTareaFile(tareas, origen, { ...TASK, estado: 'terminada' }, 'x\n', {
+        renombrar,
+        esperasReintento: [1, 1, 1],
+      }),
+      (e: unknown) => (e as NodeJS.ErrnoException).code === 'EBUSY'
+    );
+    assert.equal(intentos, 4, '1 intento + 3 reintentos');
+    assert.ok(existsSync(origen));
+  });
+});
+
+test('moveTareaFile (TASK-053): un error que no es transitorio no se reintenta', async () => {
+  await conTarea(async (tareas, origen) => {
+    let intentos = 0;
+    const renombrar = async (): Promise<void> => {
+      intentos++;
+      throw errorDe('ENOTDIR');
+    };
+    await assert.rejects(
+      moveTareaFile(tareas, origen, { ...TASK, estado: 'terminada' }, 'x\n', {
+        renombrar,
+        esperasReintento: [1, 1, 1],
+      }),
+      (e: unknown) => (e as NodeJS.ErrnoException).code === 'ENOTDIR'
+    );
+    assert.equal(intentos, 1);
+  });
+});
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-053/planificacion/brainstorm/peticion-unificador-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-053/planificacion/plan-final.md                       |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-053/tarea.md                                          | 21 +++++++++++++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/task-store.js                          | 27 ++++++++++++++++++++++++++-
 4 files changed, 43 insertions(+), 5 deletions(-)
````
