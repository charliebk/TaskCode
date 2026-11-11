# Peticion de revision — TASK-102 (ronda 2)

- Tarea: TASK-102 — Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion
- Rama revisada: feature/task-102-verificacion-proporcional-a3-el-freno-st
- Rama base: develop
- Commit revisado (HEAD): 9547bd0d833f67330dfee801e73b4beba90ade30
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-102 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde a0b251cc241a20ca32bd46fb87336e21f2e834e5 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (3 hallazgo(s)))

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

- tareas/03-en-revision/TASK-102/tarea.md
- tareas/03-en-revision/TASK-102/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts:185 (la base de `peticionDeTrabajo`) | informe-revision-1.md |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts (falta un caso) | informe-revision-1.md |

## Commits a revisar (git log a0b251cc241a20ca32bd46fb87336e21f2e834e5..HEAD)

````
9547bd0 chore(TASK-102): autorrevision ronda 2
cad7861 docs(TASK-102): estados de la ronda 1
1c52181 fix(TASK-102): MEN-1 y MEN-2 de la ronda 1
e2f496e chore(TASK-102): veredicto ronda 1 (cambios-solicitados)
d3795ed chore(TASK-102): coste revision +16955084 tokens (1 agente)
c5d346f docs(TASK-102): informe de revision ronda 1
705cdc7 chore(TASK-102): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff a0b251cc241a20ca32bd46fb87336e21f2e834e5..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 282ed58..639f5eb 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -43,8 +43,9 @@ Se decide antes que la selectiva y con una sola funcion (`peticionDeTrabajo`)
 que review usara en TASK-104. Con el arbol sucio la comprobacion de
 documentacion no guarda su memo, para no pisar el verde que `finish` deja
 para el commit. Una config de la base invalida no bloquea: la verificacion de
-siempre con un aviso. Sin `rutas_documentacion` en la config, el freno no
-lanza ni un proceso git mas que en la 0.14.0.
+siempre con un aviso. Un hotfix no se exime en el freno (resolver su base
+puede costar un `ls-remote` en cada turno). Sin `rutas_documentacion` en la
+config, el freno no lanza ni un proceso git mas que en la 0.14.0.
 
 ## 0.14.0 — 2026-11-10
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
index 45e4206..dc01e87 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
@@ -135,6 +135,9 @@ export function peticionDeTrabajo(e: EntradaTrabajo): { plan: PlanVerificacion;
   const base = (): string => (resuelta ??= e.base());
   if (documentacionDeclarada(config)) {
     if (e.baseFiable) {
+      // Sin `heldoutComoCodigo`, igual que finish (MEN-3 de la revision): los
+      // held-out de `tareas/**/aceptacion/` no los ejecuta la suite de Stop ni
+      // la de review, sino la puerta propia de finish antes de integrar.
       const r = decidirVerificacionEntre(base(), 'HEAD', e.raiz, { conArbol: true });
       if (r !== null && r.tipo === 'config-invalida') {
         avisos.push(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 7bede45..b0d8b18 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -698,6 +698,15 @@ const RAMA_BASE_ES_DEVELOP: Record<Task['tipo'], boolean> = {
   hotfix: false,
 };
 
+/**
+ * TASK-102: true si la base del tipo se resuelve sin red (la de integracion,
+ * leida de la config). La de un hotfix es la principal, y resolverla puede
+ * costar `ls-remote`: el freno Stop, que corre en cada turno, no lo paga.
+ */
+export function baseDeTipoSinRed(tipo: Task['tipo']): boolean {
+  return RAMA_BASE_ES_DEVELOP[tipo];
+}
+
 /**
  * Rama base esperada para un tipo de tarea (seccion 8.3): la rama base
  * configurada para feature/fix/release, resolveMainBranch() para
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index 6e5e6f2..c5214ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -31,8 +31,8 @@
  * nada. Se decide antes que la selectiva y con `peticionDeTrabajo`, la misma
  * eleccion que usa review. Las rutas y el comando salen de la config de la
  * BASE (como en finish y en el guardian); la del arbol solo abre la puerta, asi
- * que sin la clave no hay ni un git mas que en la 0.14.0. Tarea sin tipo: no se
- * exime nada.
+ * que sin la clave no hay ni un git mas que en la 0.14.0. Tarea sin tipo o
+ * hotfix (su base puede costar red): no se exime nada.
  *
  * Contrato con Claude Code (spike TASK-069 y documentacion oficial): exit 0
  * deja parar; exit 2 bloquea y el stderr le llega al agente; exit 1 NO
@@ -46,7 +46,7 @@ import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig
 import { formatearVerificacionRoja, type ResultadoVerificacion } from '../core/informe-verificacion.js';
 import type { Task } from '../core/task.js';
 import { peticionDeTrabajo } from '../fs/decision-documentacion.js';
-import { resolveBaseBranchForTipo } from '../fs/git.js';
+import { baseDeTipoSinRed, resolveBaseBranchForTipo } from '../fs/git.js';
 import { listTareasEnEstados } from '../fs/task-store.js';
 import { verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
 
@@ -183,7 +183,10 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       config: cfg,
       raiz,
       base: () => (tipoTarea === null ? cfg.rama_base : resolveBaseBranchForTipo(tipoTarea, raiz)),
-      baseFiable: tipoTarea !== null,
+      // Sin tipo, la base es un respaldo; en un hotfix, resolverla puede ir a
+      // la red (ls-remote) en cada turno (MEN-1 de la revision). En los dos
+      // casos no se exime nada por documentacion: la verificacion de siempre.
+      baseFiable: tipoTarea !== null && baseDeTipoSinRed(tipoTarea),
       sinSelectiva: 'completa',
     });
     const dejarParar: DecisionStop =
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts
index bfafef9..f74e433 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts
@@ -39,6 +39,8 @@ interface Repo {
 interface OpcionesRepo {
   /** Lineas extra de la config (base y rama, salvo que la rama la cambie). */
   config?: (fuera: string) => string;
+  /** Tipo de la tarea en curso (por defecto feature). */
+  tipo?: 'feature' | 'hotfix';
 }
 
 function cmd(fuera: string, c: Comando): string {
@@ -67,7 +69,7 @@ async function montar(o: OpcionesRepo = {}): Promise<Repo> {
     await mkdir(path.join(raiz, 'tareas', c), { recursive: true });
     await writeFile(path.join(raiz, 'tareas', c, '.gitkeep'), '', 'utf8');
   }
-  const t = sampleTask({ id: 'TASK-102', estado: 'en-curso', rama: RAMA });
+  const t = sampleTask({ id: 'TASK-102', estado: 'en-curso', rama: RAMA, tipo: o.tipo ?? 'feature' });
   await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-102'), { recursive: true });
   await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-102', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
   await mkdir(path.join(raiz, '.taskcode'));
@@ -284,3 +286,21 @@ test('freno (TASK-102): una config de la base invalida no bloquea: la verificaci
     assert.equal(r.ejecuciones('docs'), 0);
   });
 });
+
+test('freno (TASK-102, MEN-1/MEN-2): un hotfix no se exime por documentacion ni va a la red a por su base', async () => {
+  await conRepo(
+    async (r) => {
+      // Un origin inalcanzable: si el freno resolviera la base del hotfix, lanzaria ls-remote.
+      git(['remote', 'add', 'origin', 'https://127.0.0.1:9/x.git'], r.raiz);
+      await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
+      const argvs = await procesosGit(r, async () => {
+        const d = await decidir(r);
+        assert.equal(d.codigo, 0, d.stderr);
+      });
+      assert.equal(r.ejecuciones('completa'), 1);
+      assert.equal(r.ejecuciones('docs'), 0);
+      assert.deepEqual(argvs.filter((a) => a.includes('ls-remote')), []);
+    },
+    { tipo: 'hotfix' }
+  );
+});
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff a0b251cc241a20ca32bd46fb87336e21f2e834e5..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-102/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-102/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-102/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-102/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-102/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-102/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-102/revision/informe-revision-1.md                                                  |  99 ++++++++++++
 tareas/03-en-revision/TASK-102/revision/peticion-revision-1.md                                                 | 690 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-102/tarea.md                                                       |  10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/decision-documentacion.js                             |   3 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                                |   8 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                      |  11 +-
 12 files changed, 814 insertions(+), 7 deletions(-)
````
