# Peticion de revision — TASK-060 (ronda 2)

- Tarea: TASK-060 — Opciones de cierre en finish: merge normal, merge request y tag
- Rama revisada: feature/task-060-opciones-de-cierre-en-finish-merge-norma
- Rama base: develop
- Commit revisado (HEAD): c9efcb30e3506a071c88e43200e9f0f213ca4bc8
- Fecha: 2026-10-06
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-060 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde cf84a14030c019e830aba6c77fd7f67cac749785 (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | src/commands/finish.ts:~traerIntegracionDeLaPlataforma | informe-revision-1.md |
| MEN-1 | MENOR | abierto | skills/task-workflow/avance.md:22-23 | informe-revision-1.md |
| MEN-2 | MENOR | abierto | scripts/gitflow/merge-hotfix-to-main.sh, merge-release-to-main.sh | informe-revision-1.md |
| MEN-3 | MENOR | aceptado (desvio) | src/commands/finish.ts (modoMergeRequest) | informe-revision-1.md |
| MEN-4 | MENOR | aceptado (desvio) | src/core/config.ts / skills/finish/SKILL.md | informe-revision-1.md |

## Commits a revisar (git log cf84a14030c019e830aba6c77fd7f67cac749785..HEAD)

````
c9efcb3 fix(TASK-060): correcciones de la revision ronda 1 (IMP-1, MEN-1, MEN-2)
3305fd1 chore(TASK-060): coste revision +11993521 tokens (1 agente)
7c8c646 chore(TASK-060): veredicto ronda 1 (cambios-solicitados)
7cb51f9 docs(TASK-060): informe de revision ronda 1
0bbb5f1 chore(TASK-060): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff cf84a14030c019e830aba6c77fd7f67cac749785..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
index 3e8c406..ba43376 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
@@ -1,13 +1,13 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""
+PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""; TAG_SEEN=false
 while [[ $# -gt 0 ]]; do
     case "$1" in
         --push|-p) PUSH=true ;;
         --main)    MAIN_BRANCH="$2";    shift ;;
         --develop) DEVELOP_BRANCH="$2"; shift ;;
-        --tag)     TAG_OVERRIDE="$2"; shift ;;
+        --tag)     TAG_SEEN=true; TAG_OVERRIDE="${2:-}"; shift ;;
         *)         [ -z "$NAME" ] && NAME="$1" ;;
     esac
     shift
@@ -23,6 +23,10 @@ initialize_gitflow_log "merge-hotfix -> main ($NAME)"
 # solo tag, el del merge a main). Se valida ANTES de tocar ninguna rama: un
 # nombre invalido, con "-" inicial (se leeria como opcion de git) o ya usado
 # abortaria despues del merge, con main ya movida.
+if [ "$TAG_SEEN" = true ] && [ -z "$TAG_OVERRIDE" ]; then
+    log_error "--tag necesita un nombre (--tag v1.2.0). No se ha tocado nada."
+    exit 1
+fi
 if [ -n "$TAG_OVERRIDE" ]; then
     if [[ "$TAG_OVERRIDE" == -* ]] || ! git check-ref-format "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
         log_error "El nombre de tag '$TAG_OVERRIDE' no es valido (git check-ref-format, y sin '-' inicial). No se ha tocado nada."
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
index 33cae66..72e6900 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
@@ -1,13 +1,13 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""
+PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""; TAG_SEEN=false
 while [[ $# -gt 0 ]]; do
     case "$1" in
         --push|-p) PUSH=true ;;
         --main)    MAIN_BRANCH="$2";    shift ;;
         --develop) DEVELOP_BRANCH="$2"; shift ;;
-        --tag)     TAG_OVERRIDE="$2"; shift ;;
+        --tag)     TAG_SEEN=true; TAG_OVERRIDE="${2:-}"; shift ;;
         *)         [ -z "$NAME" ] && NAME="$1" ;;
     esac
     shift
@@ -23,6 +23,10 @@ initialize_gitflow_log "merge-release -> main ($NAME)"
 # solo tag, el del merge a main). Se valida ANTES de tocar ninguna rama: un
 # nombre invalido, con "-" inicial (se leeria como opcion de git) o ya usado
 # abortaria despues del merge, con main ya movida.
+if [ "$TAG_SEEN" = true ] && [ -z "$TAG_OVERRIDE" ]; then
+    log_error "--tag necesita un nombre (--tag v1.2.0). No se ha tocado nada."
+    exit 1
+fi
 if [ -n "$TAG_OVERRIDE" ]; then
     if [[ "$TAG_OVERRIDE" == -* ]] || ! git check-ref-format "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
         log_error "El nombre de tag '$TAG_OVERRIDE' no es valido (git check-ref-format, y sin '-' inicial). No se ha tocado nada."
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 3dde8f5..93d5d54 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -23,7 +23,11 @@ cambia el modo de esa tarea.
 | `automatico` | Las preguntas se hacen en `plan`; el resto se encadena hasta `finish`, implementacion y correcciones incluidas |
 
 En cualquier modo, hotfix y release preguntan antes de `finish`, nunca se
-sube nada con `--push` sin que la persona lo pida, y cada transicion deja
+sube nada con `--push` sin que la persona lo pida (la unica excepcion es la
+rama de un merge request: `finish --merge-request` la sube siempre, porque sin
+ella no hay merge request; en `automatico` con `cierre_por_defecto:
+merge-request` eso ocurre sin preguntar, y el tag nunca se sube sin `--push`),
+y cada transicion deja
 una fila en la seccion `## Transiciones` de `tarea.md` (fecha, fase, modo y
 quien decidio) en el mismo commit que la transicion.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 15283c1..a45f313 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -72,6 +72,7 @@ import {
   fetchOrigin,
   resolverCommit,
   fastForwardDesde,
+  runGit,
   GitCommandError,
 } from '../fs/git.js';
 import {
@@ -455,6 +456,7 @@ export async function runFinishCommand(
     const integrado = (mrCtx as ContextoMergeRequest).estado as Extract<EstadoMergeRequest, { tipo: 'integrado' }>;
     commitParaTag = traerIntegracionDeLaPlataforma({
       id,
+      rama,
       integrado,
       ramaIntegracion,
       nombreTag,
@@ -840,6 +842,7 @@ async function abrirMergeRequestYAnotar(o: AbrirMergeRequestOpts): Promise<Finis
 
 interface TraerIntegracionOpts {
   id: string;
+  rama: string;
   integrado: Extract<EstadoMergeRequest, { tipo: 'integrado' }>;
   ramaIntegracion: string;
   nombreTag: string | null;
@@ -854,6 +857,47 @@ interface TraerIntegracionOpts {
  * van ANTES de cambiar de rama. Devuelve el commit que la plataforma da como
  * resultado del merge (el del tag), o null si no lo informa.
  */
+/**
+ * IMP-1 de la revision: con squash o rebase la ancestria no dice si la rama
+ * esta integrada (decision de Carlos), pero SI se sabe que punta integro la
+ * plataforma (`headCommit`) y que hay en origin y en local tras el fetch:
+ *
+ * - la rama de origin no puede haber avanzado despues de ese merge (se subieron
+ *   commits tras mergear: no estan integrados);
+ * - la rama local solo puede llevar, sobre lo integrado, el commit de
+ *   anotacion del propio primer finish: cualquier otro commit local es trabajo
+ *   que nunca llego al merge request.
+ * Sin `headCommit` (la plataforma no lo informa) la referencia es la rama de
+ * origin. Aborta sin tocar nada.
+ */
+function comprobarRamaIntegrada(o: TraerIntegracionOpts): void {
+  const { id, rama, integrado, cwd } = o;
+  const remota = resolverCommit(`refs/remotes/origin/${rama}`, cwd);
+  const head = integrado.headCommit;
+  const nada = 'No se ha tocado nada.';
+  if (head !== null && remota !== null && remota !== head) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: "origin/${rama}" avanzo DESPUES de que la plataforma mergeara el merge request ` +
+        `(integro ${head.slice(0, 10)}, la rama en origin esta en ${remota.slice(0, 10)}): esos commits no ` +
+        'estan integrados en la base. Abre otro merge request con ellos (taskctl finish --merge-request tras ' +
+        `borrar la seccion "## Merge request" de tarea.md) o descartalos. ${nada}`
+    );
+  }
+  const referencia = head !== null && resolverCommit(head, cwd) !== null ? head : remota;
+  if (referencia === null) return;
+  const sinIntegrar = runGit(['log', '--format=%s', '--end-of-options', `${referencia}..refs/heads/${rama}`], cwd)
+    .split('\n')
+    .filter((l) => l !== '' && l !== mensajeChore(id, 'merge request abierto'));
+  if (sinIntegrar.length > 0) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: "${rama}" tiene ${String(sinIntegrar.length)} commit(s) locales que no estaban en el merge ` +
+        `request cuando se mergeo (${sinIntegrar.slice(0, 3).map((s) => `«${s}»`).join(', ')}), asi que NO estan en ` +
+        `"${integrado.base}". Subelos (git push origin ${rama}) y que la plataforma los integre en otro merge ` +
+        `request (borra la seccion "## Merge request" de tarea.md para abrirlo), o descartalos. ${nada}`
+    );
+  }
+}
+
 function traerIntegracionDeLaPlataforma(o: TraerIntegracionOpts): string | null {
   const { id, integrado, ramaIntegracion, cwd } = o;
   if (integrado.base !== ramaIntegracion) {
@@ -876,6 +920,7 @@ function traerIntegracionDeLaPlataforma(o: TraerIntegracionOpts): string | null
       `[ERROR] ${id}: origin no tiene la rama "${ramaIntegracion}" tras el fetch. No se ha tocado nada.`
     );
   }
+  comprobarRamaIntegrada(o);
   const commit = integrado.commit;
   if (commit !== null) {
     if (resolverCommit(commit, cwd) === null || !isAncestor(commit, origenBase, cwd)) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
index 55d0564..3efd368 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
@@ -103,9 +103,10 @@ export type EstadoMergeRequest =
   /**
    * Mergeado, sea con merge, squash o rebase. `commit` es el que la
    * plataforma da como resultado (el de merge, o el squash); null si no lo
-   * informa (glab con fast-forward).
+   * informa (glab con fast-forward). `headCommit` es la punta de la rama que la
+   * plataforma integro (lo unico que discrimina con squash/rebase).
    */
-  | { tipo: 'integrado'; url: string; base: string; commit: string | null }
+  | { tipo: 'integrado'; url: string; base: string; commit: string | null; headCommit: string | null }
   | { tipo: 'cerrado'; url: string }
   /** No se pudo saber (red, error del CLI, salida que no se entiende). */
   | { tipo: 'desconocido'; motivo: string };
@@ -115,6 +116,7 @@ interface Candidato {
   url: string;
   base: string;
   commit: string | null;
+  head: string | null;
 }
 
 const SHA = /^[0-9a-f]{7,64}$/i;
@@ -138,11 +140,13 @@ function candidatosGithub(lista: readonly unknown[], rama: string): Candidato[]
     const merge = o['mergeCommit'];
     const oid =
       typeof merge === 'object' && merge !== null ? texto((merge as Record<string, unknown>)['oid']) : null;
-    if (estado === 'OPEN') salida.push({ estado: 'abierto', url, base, commit: null });
+    if (estado === 'OPEN') salida.push({ estado: 'abierto', url, base, commit: null, head: null });
     else if (estado === 'MERGED') {
       if (oid !== null && !SHA.test(oid)) return 'mergeCommit.oid no es un SHA';
-      salida.push({ estado: 'integrado', url, base, commit: oid });
-    } else if (estado === 'CLOSED') salida.push({ estado: 'cerrado', url, base, commit: null });
+      const head = texto(o['headRefOid']);
+      if (head !== null && !SHA.test(head)) return 'headRefOid no es un SHA';
+      salida.push({ estado: 'integrado', url, base, commit: oid, head });
+    } else if (estado === 'CLOSED') salida.push({ estado: 'cerrado', url, base, commit: null, head: null });
     else return `estado de PR desconocido (${String(estado)})`;
   }
   return salida;
@@ -158,12 +162,14 @@ function candidatosGitlab(lista: readonly unknown[], rama: string): Candidato[]
     const url = o['web_url'];
     const base = texto(o['target_branch']);
     if (!esUrlPublicable(url) || base === null) return 'una entrada del listado no trae web_url o target_branch';
-    if (estado === 'opened' || estado === 'locked') salida.push({ estado: 'abierto', url, base, commit: null });
+    if (estado === 'opened' || estado === 'locked') salida.push({ estado: 'abierto', url, base, commit: null, head: null });
     else if (estado === 'merged') {
       const oid = texto(o['merge_commit_sha']) ?? texto(o['squash_commit_sha']);
       if (oid !== null && !SHA.test(oid)) return 'merge_commit_sha no es un SHA';
-      salida.push({ estado: 'integrado', url, base, commit: oid });
-    } else if (estado === 'closed') salida.push({ estado: 'cerrado', url, base, commit: null });
+      const head = texto(o['sha']);
+      if (head !== null && !SHA.test(head)) return 'sha no es un SHA';
+      salida.push({ estado: 'integrado', url, base, commit: oid, head });
+    } else if (estado === 'closed') salida.push({ estado: 'cerrado', url, base, commit: null, head: null });
     else return `estado de MR desconocido (${String(estado)})`;
   }
   return salida;
@@ -193,7 +199,13 @@ export function interpretarListado(plataforma: Plataforma, stdout: string, rama:
   if (abierto !== undefined) return { tipo: 'abierto', url: abierto.url };
   const integrado = candidatos.find((c) => c.estado === 'integrado');
   if (integrado !== undefined) {
-    return { tipo: 'integrado', url: integrado.url, base: integrado.base, commit: integrado.commit };
+    return {
+      tipo: 'integrado',
+      url: integrado.url,
+      base: integrado.base,
+      commit: integrado.commit,
+      headCommit: integrado.head,
+    };
   }
   const cerrado = candidatos.find((c) => c.estado === 'cerrado');
   if (cerrado !== undefined) return { tipo: 'cerrado', url: cerrado.url };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
index 4e7fb1e..d7c78d1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
@@ -109,7 +109,7 @@ export function estadoMergeRequest(remoto: RemotoPlataforma, rama: string, cwd:
           `--head=${rama}`,
           '--state=all',
           '--limit=100',
-          '--json=number,state,url,baseRefName,headRefName,mergeCommit',
+          '--json=number,state,url,baseRefName,headRefName,headRefOid,mergeCommit',
         ]
       : ['mr', 'list', `--source-branch=${rama}`, '--all', '--per-page=100', '--output=json'];
   const r = lanzar(cli, args, cwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts
index 56061f8..8416c36 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts
@@ -8,7 +8,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { readFile } from 'node:fs/promises';
+import { readFile, writeFile } from 'node:fs/promises';
 import { existsSync } from 'node:fs';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
@@ -87,11 +87,13 @@ async function abrirMr(e: Escenario, extra: string[] = []): Promise<string> {
 
 /** La plataforma "mergea": el merge ocurre de verdad en el bare y el doble pasa a decir `integrado`. */
 async function mergearPr(e: Escenario, dbl: ControlDoble, url: string, modo: 'merge' | 'squash' | 'rebase', informar = true): Promise<string> {
+  // La punta que integra la plataforma es la que hay en el remoto al mergear.
+  const headSha = ramaEnBare(e.origin.bare, e.task.rama);
   const commit = await mergearEnPlataforma(e.origin.bare, e.task.rama, 'develop', modo);
   const estado = dbl.leer();
   dbl.escribir({
     ...estado,
-    prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit: informar ? commit : null }],
+    prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit: informar ? commit : null, headSha }],
   });
   return commit;
 }
@@ -601,3 +603,67 @@ test('main: sin el CLI de la plataforma sale con codigo 1 y el mensaje dice que
     assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
   });
 });
+
+// ---------------------------------------------------------------------------
+// IMP-1 de la revision: la rama no puede tener nada que la plataforma no integro
+// ---------------------------------------------------------------------------
+
+for (const modo of ['merge', 'squash'] as const) {
+  test(`segundo finish (${modo}) con un commit LOCAL sin subir al MR aborta sin tocar nada: la tarea no se da por integrada`, async () => {
+    await escenario(URL_GITHUB, async (e) => {
+      await conDoblePlataforma(SIN_PRS, async (dbl) => {
+        const url = await abrirMr(e);
+        // Trabajo posterior al PR, commiteado en la rama y NO subido.
+        await writeFile(path.join(e.repoRoot, 'extra.txt'), 'trabajo que no llego al MR\n', 'utf8');
+        commitAll(e.repoRoot, 'extra');
+        await mergearPr(e, dbl, url, modo);
+        const antes = huella(e);
+        await assert.rejects(
+          () => finish(e, [ID, '--merge-request']),
+          /tiene 1 commit\(s\) locales que no estaban en el merge request.*«extra».*NO estan en "develop"/s
+        );
+        assert.equal(huella(e), antes);
+        assert.equal(existsSync(path.join(e.tareasRoot, '04-terminadas', ID)), false);
+      });
+    });
+  });
+}
+
+test('segundo finish con commits SUBIDOS a la rama DESPUES de que la plataforma mergeara aborta sin tocar nada', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      await mergearPr(e, dbl, url, 'squash');
+      await writeFile(path.join(e.repoRoot, 'tarde.txt'), 'subido tras mergear\n', 'utf8');
+      commitAll(e.repoRoot, 'tarde');
+      git(['push', '-q', 'origin', e.task.rama], e.repoRoot);
+      const antes = huella(e);
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /avanzo DESPUES de que la plataforma mergeara/);
+      assert.equal(huella(e), antes);
+    });
+  });
+});
+
+test('segundo finish: la anotacion del propio primer finish (subida o no) NO cuenta como commit sin integrar', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e, ['--push']);
+      await mergearPr(e, dbl, url, 'squash');
+      const r = await finish(e, [ID, '--merge-request']);
+      assert.equal(r.cierre, 'terminada');
+    });
+  });
+});
+
+// Un PR CERRADO sin mergear nunca se lee como integrado, ni siquiera con un commit "de merge".
+test('un PR CERRADO que trae mergeCommit no se lee como integrado: aborta y no cierra', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      const commit = await mergearEnPlataforma(e.origin.bare, e.task.rama, 'develop', 'merge');
+      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'cerrado', url, base: 'develop', head: e.task.rama, commit }] });
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /esta CERRADO sin mergear/);
+      assert.equal(existsSync(path.join(e.tareasRoot, '04-terminadas', ID)), false);
+    });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts
index cb547df..3e9a1e1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts
@@ -61,8 +61,16 @@ test('interpretarListado (gh): abierto gana a mergeado y mergeado a cerrado; vac
     url: 'https://github.com/a/b/pull/1',
     base: 'develop',
     commit: sha,
+    headCommit: null,
   });
   assert.equal(interpretarListado('github', j([GH('CLOSED')]), 'feature/x').tipo, 'cerrado');
+  // Un PR CERRADO nunca es integrado, aunque el listado traiga un mergeCommit.
+  assert.equal(interpretarListado('github', j([GH('CLOSED', { mergeCommit: { oid: sha } })]), 'feature/x').tipo, 'cerrado');
+  assert.equal(interpretarListado('gitlab', JSON.stringify([GL('closed', { merge_commit_sha: sha })]), 'feature/x').tipo, 'cerrado');
+  // La punta integrada (headRefOid / sha) se lee, y un valor que no es SHA es desconocido.
+  assert.equal((interpretarListado('github', j([GH('MERGED', { headRefOid: sha })]), 'feature/x') as { headCommit: unknown }).headCommit, sha);
+  assert.equal(interpretarListado('github', j([GH('MERGED', { headRefOid: 'zz' })]), 'feature/x').tipo, 'desconocido');
+  assert.equal((interpretarListado('gitlab', JSON.stringify([GL('merged', { sha })]), 'feature/x') as { headCommit: unknown }).headCommit, sha);
   // Un PR de otra rama (la plataforma devolvio de mas) no cuenta.
   assert.deepEqual(interpretarListado('github', j([GH('OPEN', { headRefName: 'otra' })]), 'feature/x'), { tipo: 'ninguno' });
 });
@@ -76,6 +84,7 @@ test('interpretarListado (glab): opened/merged/closed, merge_commit_sha o squash
     url: 'https://gitlab.com/a/b/-/merge_requests/1',
     base: 'develop',
     commit: sha,
+    headCommit: null,
   });
   assert.equal((interpretarListado('gitlab', j([GL('merged')]), 'feature/x') as { commit: unknown }).commit, null);
   assert.equal(interpretarListado('gitlab', j([GL('closed')]), 'feature/x').tipo, 'cerrado');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/merge-to-main-tag.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/merge-to-main-tag.test.ts
index b38aaab..a86f161 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/merge-to-main-tag.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/merge-to-main-tag.test.ts
@@ -87,6 +87,18 @@ for (const { script, tipo, base } of CASOS) {
     });
   });
 
+  test(`${script} --tag SIN valor aborta con mensaje y sin tocar nada (no se ignora en silencio)`, async () => {
+    await conRamaDeTrabajo(tipo, base, async (repoRoot, rama) => {
+      const mainAntes = git(['rev-parse', 'main'], repoRoot).trim();
+      const { status, output } = runScript(script, ['950-con-tag', '--develop', 'develop', '--tag'], repoRoot);
+      assert.notEqual(status, 0, output);
+      assert.match(output, /--tag necesita un nombre/);
+      assert.equal(git(['tag', '-l'], repoRoot).trim(), '');
+      assert.equal(git(['rev-parse', 'main'], repoRoot).trim(), mainAntes);
+      assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
+    });
+  });
+
   test(`${script} sin --tag sigue poniendo el tag calculado (el flag es opcional)`, async () => {
     await conRamaDeTrabajo(tipo, base, async (repoRoot) => {
       const { status, output } = runScript(script, ['950-con-tag'], repoRoot);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
index a50520e..8ea21f5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
@@ -36,6 +36,8 @@ export interface PrDoble {
   head: string;
   /** Commit resultante del merge (merge, squash o rebase); null = la plataforma no lo informa. */
   commit?: string | null;
+  /** Punta de la rama que la plataforma integro (headRefOid / sha). */
+  headSha?: string | null;
 }
 
 export interface EstadoDoble {
@@ -87,10 +89,10 @@ const CODIGO_DOBLE = [
   '    const lista = st.prs.filter((p) => p.head === head).map((p, i) => {',
   "      if (cli === 'gh') {",
   "        const estado = { abierto: 'OPEN', integrado: 'MERGED', cerrado: 'CLOSED' }[p.estado];",
-  "        return { number: i + 1, state: estado, url: p.url, baseRefName: p.base, headRefName: p.head, mergeCommit: p.commit ? { oid: p.commit } : null };",
+  "        return { number: i + 1, state: estado, url: p.url, baseRefName: p.base, headRefName: p.head, headRefOid: p.headSha || null, mergeCommit: p.commit ? { oid: p.commit } : null };",
   '      }',
   "      const estado = { abierto: 'opened', integrado: 'merged', cerrado: 'closed' }[p.estado];",
-  "      return { iid: i + 1, state: estado, web_url: p.url, target_branch: p.base, source_branch: p.head, merge_commit_sha: p.commit || null, squash_commit_sha: null };",
+  "      return { iid: i + 1, state: estado, web_url: p.url, target_branch: p.base, source_branch: p.head, merge_commit_sha: p.commit || null, squash_commit_sha: null, sha: p.headSha || null };",
   '    });',
   '    salir(0, JSON.stringify(lista) + "\\n", "");',
   '  }',
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff cf84a14030c019e830aba6c77fd7f67cac749785..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-060/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-060/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-060/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-060/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-060/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-060/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-060/revision/informe-revision-1.md                                                  |   83 ++
 tareas/03-en-revision/TASK-060/revision/peticion-revision-1.md                                                 | 3738 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-060/tarea.md                                                       |    5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                       |   41 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plataforma-remota.js                                |   26 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/merge-request.js                                      |    2 +-
 12 files changed, 3884 insertions(+), 11 deletions(-)
````
