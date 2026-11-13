# Peticion de revision — TASK-114 (ronda 1)

- Tarea: TASK-114 — P-6: hooks PreToolUse que salen pronto cuando no tienen nada que hacer
- Rama revisada: feature/task-114-p-6-hooks-pretooluse-que-salen-pronto-cu
- Rama base: develop
- Commit revisado (HEAD): 97e6e77579454c2352597d8a12327c4c669e8382
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-114 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-114/tarea.md
- tareas/03-en-revision/TASK-114/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts

## Commits a revisar (git log develop..HEAD)

````
97e6e77 feat(TASK-114): los hooks PreToolUse salen sin lanzar git cuando no aplican
83af8b2 chore(TASK-114): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
index b8de698..993b9df 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
@@ -1,5 +1,5 @@
 {
-  "description": "Frenos de verificacion. Stop: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). PreToolUse: un merge o un script de cierre hacia la rama de integracion o la principal se bloquea si no consta una verificacion en verde del commit que entra; y en la rama de una tarea, leer, buscar o editar la carpeta aceptacion/ de esa tarea (sus tests held-out) se bloquea, con herramientas de fichero o con un comando que la nombre. Coste: al terminar cada turno (Stop) o subagente (SubagentStop) con una tarea en curso en la rama, anota que transcripcion trabajo en ella para sumar su coste de implementacion al pasar la tarea a revision; nunca bloquea (COSTE_AUTOMATICO=0 lo apaga).",
+  "description": "Frenos de verificacion. Stop: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). PreToolUse: un merge o un script de cierre hacia la rama de integracion o la principal se bloquea si no consta una verificacion en verde del commit que entra; y en la rama de una tarea de un proyecto que declara comando_heldout, leer, buscar o editar la carpeta aceptacion/ de esa tarea (sus tests held-out) se bloquea, con herramientas de fichero o con un comando que la nombre. Coste: al terminar cada turno (Stop) o subagente (SubagentStop) con una tarea en curso en la rama, anota que transcripcion trabajo en ella para sumar su coste de implementacion al pasar la tarea a revision; nunca bloquea (COSTE_AUTOMATICO=0 lo apaga).",
   "hooks": {
     "Stop": [
       {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
index 1278397..be807e9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
@@ -42,7 +42,9 @@ Read, Edit, Write, MultiEdit, NotebookEdit, Grep y Glob sobre
 PowerShell cuyo texto nombra esa ruta (`cat`, `Get-Content`,
 `git show rama:ruta`). Normaliza mayusculas, barras invertidas, `..` y rutas
 relativas al cwd. En cualquier otra rama (la base, durante el diseno) no
-bloquea: la persona puede escribirlos con ayuda.
+bloquea: la persona puede escribirlos con ayuda. Solo actua si
+`.taskcode/config.yml` declara `comando_heldout`: sin la clave no hay held-out
+que proteger y el hook sale sin lanzar git.
 
 Es un freno contra despistes, no un cierre. **No ve**, y se acepta asi:
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
index 502b351..e3e7cba 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
@@ -26,6 +26,7 @@ import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { numerosHeldoutEnRuta, numerosHeldoutEnTexto, CARPETA_HELDOUT } from '../core/heldout.js';
 import { numeroDeRama } from '../core/task-id.js';
+import { CONFIG_DIR, CONFIG_FILE, parsearConfig, raizDelRepo } from '../core/config.js';
 import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';
 
 const SHELL = new Set(['Bash', 'PowerShell']);
@@ -70,11 +71,30 @@ export function ramaActual(cwd: string): string | null {
   return '';
 }
 
+/**
+ * TASK-114: false solo si la config del repo se lee y no declara
+ * `comando_heldout` (sin held-out, `finish` no los ejecuta y no hay nada que
+ * proteger). Sin procesos: la raiz sale de buscar `.git` hacia arriba. Una
+ * config que no se puede leer cuenta como que si los declara: un error no
+ * apaga el guardian.
+ */
+export function declaraHeldout(cwd: string): boolean {
+  try {
+    const ruta = path.join(raizDelRepo(cwd), CONFIG_DIR, CONFIG_FILE);
+    if (!existsSync(ruta)) return false;
+    return parsearConfig(readFileSync(ruta, 'utf8'), ruta).comando_heldout !== null;
+  } catch {
+    return true;
+  }
+}
+
 export function decidirHeldout(entrada: EntradaPreToolUse): DecisionPreToolUse {
   try {
     const nums = numerosEnEntrada(entrada);
     if (nums.length === 0) return PASAR;
     if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return PASAR;
+    // TASK-114: sin held-out declarado no hay nada que proteger; sale sin lanzar git.
+    if (!declaraHeldout(entrada.cwd)) return PASAR;
     const rama = ramaActual(entrada.cwd);
     if (rama === null || rama === '') return PASAR;
     const n = numeroDeRama(rama);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 18fdb38..5fcb69b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -58,9 +58,19 @@ export function comandoCandidato(entrada: EntradaPreToolUse): string | null {
   const cmd = (ti as { command?: unknown }).command;
   // TASK-123: tambien `commit`, que con un merge en curso lo cierra.
   if (typeof cmd !== 'string' || !/merge|commit/i.test(cmd)) return null;
+  // TASK-114: sin `git` ni un script de cierre, no integra nada (`grep merge x`,
+  // `npm run commit-lint`): sale sin lanzar git.
+  if (!INVOCA_GIT_O_CIERRE.test(cmd)) return null;
   return cmd;
 }
 
+/**
+ * TASK-114: la palabra `git` (tambien `git.exe`, `/usr/bin/git`) o el nombre de
+ * un script de cierre (`merge-<tipo>-to-<destino>.sh`, como en comando-merge.ts).
+ * El punto de entrada (pre-tool-merge.ts) aplica un prefiltro mas laxo.
+ */
+export const INVOCA_GIT_O_CIERRE = /\bgit\b|merge-[a-z]+-to-[a-z]+\.sh/i;
+
 function git(args: readonly string[], cwd: string): { ok: boolean; out: string } {
   const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
   return { ok: r.error === undefined && r.status === 0, out: (r.stdout ?? '').trim() };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
index 98da5ae..6098b44 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
@@ -1,7 +1,8 @@
 /**
  * Punto de entrada del hook `PreToolUse` de Bash/PowerShell (hooks/hooks.json).
  * Corre antes de CADA comando, asi que lo primero es barato: si el texto no
- * contiene `merge`, `commit` (TASK-123) ni `aceptacion`, sale 0 sin cargar nada mas. Si no, decide
+ * contiene `merge`, `commit` (TASK-123) ni `aceptacion`, o si nombra `merge`/`commit` sin `git` ni un
+ * script de cierre (TASK-114), sale 0 sin cargar nada mas. Si no, decide
  * cada guardian que aplique: el de merges (guardia-merge.ts) y el de held-out
  * (guardia-heldout.ts, TASK-078). El primero que bloquea gana: sale 2 con su
  * motivo en stderr. Nunca sale con 1, que Claude Code trata como error NO
@@ -16,6 +17,10 @@ try {
   texto = '';
 }
 
+// TASK-114: prefiltro sin cargar el guardian: `merge`/`commit` y ademas `git` o
+// un `.sh` (el guardian decide con la regla exacta, INVOCA_GIT_O_CIERRE).
+const puedeIntegrar = /merge|commit/i.test(texto) && /git|\.sh/i.test(texto);
+
 interface Decision {
   codigo: 0 | 2;
   stderr: string;
@@ -31,7 +36,7 @@ async function decidir(): Promise<Decision> {
       // deja pasar: decide el otro guardian
     }
   }
-  if (/merge|commit/i.test(texto)) {
+  if (puedeIntegrar) {
     try {
       const g = await import('./guardia-merge.js');
       return g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
@@ -42,7 +47,7 @@ async function decidir(): Promise<Decision> {
   return { codigo: 0, stderr: '' };
 }
 
-if (/merge|commit|aceptacion/i.test(texto)) {
+if (puedeIntegrar || /aceptacion/i.test(texto)) {
   decidir().then(
     (d) => {
       if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-114/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-114/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-114/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-heldout.js            | 22 ++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js              | 10 ++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/pre-tool-merge.js             | 10 +++++++---
 6 files changed, 41 insertions(+), 4 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-heldout.test.ts |  12 +++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts | 109 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 120 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 103.6 s

Final de la salida (truncada: 101684 bytes en total):

````
✔ comando-merge (MEN-1): el texto de bash -c, pwsh -Command y cmd /c se analiza igual (1.5171ms)
✔ comando-merge (MEN-4, TASK-077): las opciones de bash con valor antes de -c o del script no lo esconden (1.2811ms)
✔ comando-merge (MEN-2): git checkout <rama> <fichero> sin -- restaura ficheros, no cambia de rama (0.3721ms)
✔ comando-merge: lo que no es un merge nuevo no aparece (2.0295ms)
✔ guardia: bloquea un merge hacia develop o main sin verde del commit que entra (12300.8954ms)
✔ guardia: con un verde guardado del commit fuente deja pasar; con un rojo guardado bloquea y lo dice (6315.8514ms)
✔ guardia: el verde que deja una verificacion con el arbol limpio (huellaDelArbol) vale para el commit (3219.1367ms)
✔ guardia (criterio 3): no bloquea lecturas, merges hacia ramas de trabajo ni lo que no es un merge nuevo (2624.6482ms)
✔ guardia: deja pasar lo ya integrado (backmerge de recuperacion de un hotfix ya en main) (4833.4997ms)
✔ guardia: la rama de integracion sale de rama_base, no del literal develop (2946.6777ms)
✔ guardia: sin comando_verificacion, fuera de un repo o con entrada rara, deja pasar (1551.0323ms)
✔ guardia: una fuente que no resuelve a un commit hacia develop bloquea (no se puede comprobar) (1590.7844ms)
✔ guardia: el punto de entrada real decide por stdin (0 / 2) y nunca sale con 1 (2835.8132ms)
✔ guardia: hooks.json declara el PreToolUse sin filtro if, en forma exec, sin la sonda y sin nombrar el producto (1.3234ms)
✔ comando-merge (TASK-103, MEN-2): --abort/--quit/--continue/--skip como valor de -m no esconden el merge (0.7018ms)
✔ comando-merge (TASK-103): { ...; }, time y eval no esconden el merge (0.8665ms)
✔ comando-merge (TASK-103): git checkout <x> solo cambia el destino si x es rama (0.4112ms)
✔ guardia (TASK-103): con la config ilegible, un merge hacia develop, main o master bloquea y dice que arreglar (6415.6143ms)
✔ guardia (TASK-103): con la config ilegible, hacia otra rama deja pasar, como antes (4000.9769ms)
✔ guardia (TASK-103): sin fichero de config deja pasar, como antes (1171.4058ms)
✔ guardia (TASK-103): el hook real evalua los merges que antes no detectaba (23004.3656ms)
✔ guardia (TASK-103): el hook real con la config ilegible bloquea con su mensaje (1289.4929ms)
✔ hook: con la tarea en curso en la rama anota la sesion, y en SubagentStop tambien el subagente (2678.9219ms)
✔ hook: sin tarea en curso sale sin hacer nada y sin consultar la rama (ningun proceso) (2385.5435ms)
✔ hook: en otra rama, con COSTE_AUTOMATICO=0 o con una entrada rara, no anota nada (1705.065ms)
✔ hook: entradasDeHook valida ids y rutas antes de anotar (0.9169ms)
✔ hook: como proceso sale con 0, sin escribir nada, y anota en el libro (2469.9244ms)
✔ hook: hooks.json lo declara en Stop y SubagentStop, en forma exec, con timeout corto y sin nombrar el producto (5.6388ms)
✔ salida temprana (TASK-114, criterio 1): sin comando_heldout el guardian de held-out deja pasar en la rama de la tarea (3313.2741ms)
✔ salida temprana (TASK-114): con comando_heldout sigue bloqueando, y una config ilegible tambien protege (2813.4842ms)
✔ salida temprana (TASK-114, criterio 2): un comando sin git ni script de cierre no es candidato a merge (1849.7558ms)
ℹ tests 906
ℹ suites 0
ℹ pass 906
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 89921.2892
[verificar-impacto] node --test termino con 0 en 90.0 s.
````
