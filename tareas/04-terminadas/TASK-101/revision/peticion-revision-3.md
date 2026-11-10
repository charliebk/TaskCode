# Peticion de revision — TASK-101 (ronda 3)

- Tarea: TASK-101 — Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion
- Rama revisada: feature/task-101-verificacion-proporcional-a2-el-guardian
- Rama base: develop
- Commit revisado (HEAD): 614dc9de31eb715b7d8206c5029cee111b0ca88a
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-101 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 68d0b61a19a4bc6a3633ddf41a8b32efc0ac1184 (el commit revisado en la ronda anterior)
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
informe de esta ronda (informe-revision-3.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-101/tarea.md
- tareas/03-en-revision/TASK-101/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| CRI-1 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`comandoSoloIntegra`: exactamente una operacion) | informe-revision-2.md |
| CRI-2 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`CARACTERES_PELIGROSOS` y lista blanca minima) | informe-revision-2.md |
| NUE-1 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`segmentosSoloIntegran`, checkout/switch: `CREAN_RAMA` comparado con el token exacto) | informe-revision-2.md |
| NUE-2 | CRITICO | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts (`analizarComando` descarta un `git merge` con `--abort/--quit/--continue/--skip` en cualquier posicion y `comandoSoloIntegra` lo acepta como `merge`) | informe-revision-2.md |

## Commits a revisar (git log 68d0b61a19a4bc6a3633ddf41a8b32efc0ac1184..HEAD)

````
614dc9d docs(TASK-101): autorrevision ronda 3
729658b fix(TASK-101): checkout y switch con opciones cerradas, sin barras invertidas y un unico merge contado en el texto
a5f5d7f chore(TASK-101): coste revision +924823 tokens (1 agente)
77e34c2 docs(TASK-101): informe de revision ronda 2
519c21c chore(TASK-101): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 68d0b61a19a4bc6a3633ddf41a8b32efc0ac1184..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
index 08bc6fd..d06aabc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts
@@ -303,10 +303,20 @@ const CARACTERES_PELIGROSOS = /[<>`$]/;
 export function comandoSoloIntegra(texto: string): boolean {
   if (CARACTERES_PELIGROSOS.test(texto)) return false;
   if (analizarComando(texto).length !== 1) return false;
-  return segmentosSoloIntegran(texto);
+  const cuenta = { integraciones: 0 };
+  // NUE-2 de la revision: un `git merge -m --abort x` no cuenta en analizarComando
+  // pero si mergea; aqui se cuenta todo `git merge` y todo script de cierre.
+  return segmentosSoloIntegran(texto, cuenta) && cuenta.integraciones === 1;
 }
 
-function segmentosSoloIntegran(texto: string): boolean {
+/**
+ * Unicas opciones de checkout/switch admitidas (NUE-1 de la revision: `-fB`,
+ * `-Bdocs`, `--force-c` o `-\B` creaban o forzaban la rama sin coincidir con
+ * ninguna opcion prohibida). Lista cerrada, no lista de prohibidas.
+ */
+const CAMBIO_OPCIONES_ADMITIDAS = new Set(['-q', '--quiet', '--detach']);
+
+function segmentosSoloIntegran(texto: string, cuenta: { integraciones: number }): boolean {
   for (const bruto of segmentar(texto)) {
     const seg = sinPrefijos(bruto);
     if (seg.length === 0) continue;
@@ -314,6 +324,8 @@ function segmentosSoloIntegran(texto: string): boolean {
     if (seg.length !== bruto.length) return false;
     const prog = programa(seg[0] as string);
     if (SOLO_CARPETA.has(prog)) continue;
+    // Una barra invertida que quede tras el troceado la interpretaria el shell (`-\B` es `-B`).
+    if (seg.some((t) => t.includes('\\'))) return false;
     if (prog === 'git') {
       let i = 1;
       while (i < seg.length && (seg[i] as string).startsWith('-')) {
@@ -324,19 +336,31 @@ function segmentosSoloIntegran(texto: string): boolean {
       const sub = (seg[i] ?? '').toLowerCase();
       const args = seg.slice(i + 1);
       if (args.some((a) => a.startsWith('--output') || a === '-o' || a.startsWith('--exec'))) return false;
-      if (sub === 'merge' || GIT_SOLO_CONSULTA.has(sub)) continue;
-      if ((sub === 'checkout' || sub === 'switch') && !args.some((a) => CREAN_RAMA.has(a) || a === '-f' || a === '--force')) continue;
+      if (sub === 'merge') {
+        if (args.some((a) => MERGE_SIN_MERGE.has(a))) return false;
+        cuenta.integraciones++;
+        continue;
+      }
+      if (GIT_SOLO_CONSULTA.has(sub)) continue;
+      if (sub === 'checkout' || sub === 'switch') {
+        const opciones = args.slice(0, args.includes('--') ? args.indexOf('--') : args.length).filter((a) => a.startsWith('-'));
+        if (opciones.every((a) => CAMBIO_OPCIONES_ADMITIDAS.has(a))) continue;
+        return false;
+      }
       if (sub === 'branch' && args.every((a) => BRANCH_SOLO_LISTA.has(a))) continue;
       return false;
     }
     const interior = textoDeShell(prog, seg);
     if (interior !== null) {
-      if (!segmentosSoloIntegran(interior)) return false;
+      if (!segmentosSoloIntegran(interior, cuenta)) return false;
       continue;
     }
     const iScript = SHELLS.has(prog) ? opcionesDeShell(seg).fin : 0;
-    const nombre = (seg[iScript] ?? '').split(/[\/]/).pop() ?? '';
-    if (SCRIPT_CIERRE.test(nombre)) continue;
+    const nombre = (seg[iScript] ?? '').split(/[\\/]/).pop() ?? '';
+    if (SCRIPT_CIERRE.test(nombre)) {
+      cuenta.integraciones++;
+      continue;
+    }
     return false;
   }
   return true;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
index 4b3d08c..e59b212 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
@@ -207,6 +207,8 @@ test('comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consulta
     'git status && git log -1 && git branch --show-current && git merge x',
     'bash scripts/merge-feature-to-develop.sh feature/x',
     'bash -c "git checkout develop && git merge x"',
+    'git checkout -q develop && git switch --detach develop && git merge x',
+    'cd C:\repo && git merge x',
   ]) {
     assert.equal(comandoSoloIntegra(ok), true, ok);
   }
@@ -233,6 +235,20 @@ test('comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consulta
     'git log --output=.git/refs/heads/docs && git merge docs',
     'git -c alias.st=!sh status && git merge docs',
     'GIT_DIR=otro git merge docs',
+    // NUE-1 de la ronda 2: opciones de crear o forzar rama agrupadas, adjuntas o escapadas.
+    'git checkout -fB docs code && git checkout develop && git merge docs',
+    'git checkout -qB docs code && git checkout develop && git merge docs',
+    'git checkout -Bdocs code && git checkout develop && git merge docs',
+    'git checkout -\B docs code && git checkout develop && git merge docs',
+    'git switch -fC docs code && git switch develop && git merge docs',
+    'git switch -Cdocs code && git switch develop && git merge docs',
+    'git switch --force-c docs code && git switch develop && git merge docs',
+    'git switch -\C docs code && git switch develop && git merge docs',
+    'bash -lc "git checkout -\B docs code && git checkout develop && git merge docs"',
+    "sh -c 'git checkout -fB docs code && git checkout develop && git merge docs'",
+    // NUE-2: un merge disfrazado con una opcion de --abort/--quit no cuenta en analizarComando.
+    'git checkout docs && git merge -m --abort code && git checkout develop && git merge --no-ff docs',
+    'git merge -m --quit code; git merge docs',
   ]) {
     assert.equal(comandoSoloIntegra(no), false, no);
   }
@@ -250,6 +266,8 @@ test('guardian (TASK-101): CRI-1 y CRI-2 de la revision bloquean de punta a punt
       `git checkout ${task.rama} && git merge --no-edit codigo && git checkout develop && git merge --no-ff -m m ${task.rama}`,
       `git rev-parse codigo > .git/refs/heads/${task.rama} && git merge --no-ff ${task.rama}`,
       `echo "$(git branch -f ${task.rama} codigo)" && git merge --no-ff ${task.rama}`,
+      `git checkout -fB ${task.rama} codigo && git checkout develop && git merge ${task.rama}`,
+      `git checkout ${task.rama} && git merge -m --abort codigo && git checkout develop && git merge --no-ff ${task.rama}`,
     ]) {
       const d = guardian(e, cmd);
       assert.equal(d.codigo, 2, cmd);
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 68d0b61a19a4bc6a3633ddf41a8b32efc0ac1184..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-101/revision/informe-revision-2.md               |  62 ++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-101/revision/peticion-revision-2.md              | 285 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-101/tarea.md                                     |   5 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/comando-merge.js |  38 +++++++++++++---
 4 files changed, 382 insertions(+), 8 deletions(-)
````
