# Peticion de revision — TASK-114 (ronda 2)

- Tarea: TASK-114 — P-6: hooks PreToolUse que salen pronto cuando no tienen nada que hacer
- Rama revisada: feature/task-114-p-6-hooks-pretooluse-que-salen-pronto-cu
- Rama base: develop
- Commit revisado (HEAD): ab982f33c45691cd8e1f283cdbc449006b235630
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-114 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 97e6e77579454c2352597d8a12327c4c669e8382 (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-114/tarea.md
- tareas/03-en-revision/TASK-114/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/prefiltro.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts (prefiltro en src/hooks/pre-tool-merge.ts:22) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:73 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts:74-89 y skills/task-workflow/heldout.md:45-47 | informe-revision-1.md |

## Commits a revisar (git log 97e6e77579454c2352597d8a12327c4c669e8382..HEAD)

````
ab982f3 chore(TASK-114): veredicto ronda 1 (cambios-solicitados)
b447479 fix(TASK-114): prefiltro con test propio y riesgos documentados (MEN-1, MEN-2, MEN-3)
327e3a1 chore(TASK-114): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 97e6e77579454c2352597d8a12327c4c669e8382..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
index be807e9..8b25528 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/heldout.md
@@ -42,9 +42,11 @@ Read, Edit, Write, MultiEdit, NotebookEdit, Grep y Glob sobre
 PowerShell cuyo texto nombra esa ruta (`cat`, `Get-Content`,
 `git show rama:ruta`). Normaliza mayusculas, barras invertidas, `..` y rutas
 relativas al cwd. En cualquier otra rama (la base, durante el diseno) no
-bloquea: la persona puede escribirlos con ayuda. Solo actua si
-`.taskcode/config.yml` declara `comando_heldout`: sin la clave no hay held-out
-que proteger y el hook sale sin lanzar git.
+bloquea: la persona puede escribirlos con ayuda. Solo actua si el
+`.taskcode/config.yml` de la rama actual declara `comando_heldout`; sin la
+clave sale sin lanzar git. Ojo: `finish` lee esa clave de la rama base, asi que
+una rama abierta antes de declararla en la base no tiene el guardian activo
+(actualizala con la base para encenderlo).
 
 Es un freno contra despistes, no un cierre. **No ve**, y se acepta asi:
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
index e3e7cba..bb2e247 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-heldout.ts
@@ -72,11 +72,13 @@ export function ramaActual(cwd: string): string | null {
 }
 
 /**
- * TASK-114: false solo si la config del repo se lee y no declara
- * `comando_heldout` (sin held-out, `finish` no los ejecuta y no hay nada que
- * proteger). Sin procesos: la raiz sale de buscar `.git` hacia arriba. Una
- * config que no se puede leer cuenta como que si los declara: un error no
- * apaga el guardian.
+ * TASK-114: false solo si la config del arbol de trabajo se lee y no declara
+ * `comando_heldout`. Sin procesos: la raiz sale de buscar `.git` hacia
+ * arriba. Una config que no se puede leer cuenta como que si los declara: un
+ * error no apaga el guardian. Riesgo aceptado (MEN-3 de la revision): `finish`
+ * lee la clave de la config de la rama BASE; una rama abierta antes de que la
+ * base la declarara tiene el guardian apagado aunque `finish` exija sus
+ * held-out.
  */
 export function declaraHeldout(cwd: string): boolean {
   try {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 5fcb69b..9aaef5c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -68,6 +68,9 @@ export function comandoCandidato(entrada: EntradaPreToolUse): string | null {
  * TASK-114: la palabra `git` (tambien `git.exe`, `/usr/bin/git`) o el nombre de
  * un script de cierre (`merge-<tipo>-to-<destino>.sh`, como en comando-merge.ts).
  * El punto de entrada (pre-tool-merge.ts) aplica un prefiltro mas laxo.
+ * Se acepta (MEN-2 de la revision) que la ofuscacion con comillas partidas
+ * (`g''it merge x`) la esquive: el guardian es un freno contra despistes, y la
+ * puerta de `finish` sigue verificando.
  */
 export const INVOCA_GIT_O_CIERRE = /\bgit\b|merge-[a-z]+-to-[a-z]+\.sh/i;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
index 6098b44..297b9ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/pre-tool-merge.ts
@@ -9,6 +9,7 @@
  * bloqueante; el fallo de un guardian deja pasar y no impide decidir al otro.
  */
 import { readFileSync } from 'node:fs';
+import { nombraHeldout, puedeIntegrar } from './prefiltro.js';
 
 let texto = '';
 try {
@@ -17,9 +18,9 @@ try {
   texto = '';
 }
 
-// TASK-114: prefiltro sin cargar el guardian: `merge`/`commit` y ademas `git` o
-// un `.sh` (el guardian decide con la regla exacta, INVOCA_GIT_O_CIERRE).
-const puedeIntegrar = /merge|commit/i.test(texto) && /git|\.sh/i.test(texto);
+// TASK-114: prefiltros sin cargar ningun guardian (prefiltro.ts, sin dependencias).
+const integra = puedeIntegrar(texto);
+const heldout = nombraHeldout(texto);
 
 interface Decision {
   codigo: 0 | 2;
@@ -27,7 +28,7 @@ interface Decision {
 }
 
 async function decidir(): Promise<Decision> {
-  if (/aceptacion/i.test(texto)) {
+  if (heldout) {
     try {
       const [g, e] = await Promise.all([import('./guardia-heldout.js'), import('./entrada-pretooluse.js')]);
       const d = g.decidirHeldout(e.parsearEntradaPreToolUse(texto));
@@ -36,7 +37,7 @@ async function decidir(): Promise<Decision> {
       // deja pasar: decide el otro guardian
     }
   }
-  if (puedeIntegrar) {
+  if (integra) {
     try {
       const g = await import('./guardia-merge.js');
       return g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
@@ -47,7 +48,7 @@ async function decidir(): Promise<Decision> {
   return { codigo: 0, stderr: '' };
 }
 
-if (puedeIntegrar || /aceptacion/i.test(texto)) {
+if (integra || heldout) {
   decidir().then(
     (d) => {
       if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/prefiltro.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/prefiltro.ts
new file mode 100644
index 0000000..5d49c73
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/prefiltro.ts
@@ -0,0 +1,15 @@
+/**
+ * TASK-114: prefiltros de texto del hook `PreToolUse` de Bash/PowerShell, sin
+ * dependencias, para decidir sin cargar ningun guardian si hay algo que mirar.
+ * Son mas laxos que las reglas exactas de cada guardian, que deciden despues.
+ */
+
+/** El comando puede integrar: nombra `merge`/`commit` y ademas `git` o un `.sh` (MEN-1 de la revision). */
+export function puedeIntegrar(texto: string): boolean {
+  return /merge|commit/i.test(texto) && /git|\.sh/i.test(texto);
+}
+
+/** El comando puede nombrar una carpeta held-out. */
+export function nombraHeldout(texto: string): boolean {
+  return /aceptacion/i.test(texto);
+}
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 97e6e77579454c2352597d8a12327c4c669e8382..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/02-en-curso/TASK-114/tarea.md                                                        |  40 ---------------
 tareas/{02-en-curso => 03-en-revision}/TASK-114/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-114/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-114/revision/informe-revision-1.md                               |  49 ++++++++++++++++++
 tareas/03-en-revision/TASK-114/revision/peticion-revision-1.md                              | 275 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-114/tarea.md                                                     |  68 +++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-heldout.js              |  12 +++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                |   3 ++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/pre-tool-merge.js               |  13 ++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/prefiltro.js                    |  13 +++++
 10 files changed, 422 insertions(+), 51 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 97e6e77579454c2352597d8a12327c4c669e8382..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts | 12 ++++++++++++
 1 file changed, 12 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 179.5 s

Final de la salida (truncada: 101822 bytes en total):

````
✔ comando-merge (MEN-4, TASK-077): las opciones de bash con valor antes de -c o del script no lo esconden (1.2684ms)
✔ comando-merge (MEN-2): git checkout <rama> <fichero> sin -- restaura ficheros, no cambia de rama (0.3838ms)
✔ comando-merge: lo que no es un merge nuevo no aparece (0.7537ms)
✔ guardia: bloquea un merge hacia develop o main sin verde del commit que entra (19353.1181ms)
✔ guardia: con un verde guardado del commit fuente deja pasar; con un rojo guardado bloquea y lo dice (9241.5184ms)
✔ guardia: el verde que deja una verificacion con el arbol limpio (huellaDelArbol) vale para el commit (4836.2912ms)
✔ guardia (criterio 3): no bloquea lecturas, merges hacia ramas de trabajo ni lo que no es un merge nuevo (4048.7769ms)
✔ guardia: deja pasar lo ya integrado (backmerge de recuperacion de un hotfix ya en main) (7436.0006ms)
✔ guardia: la rama de integracion sale de rama_base, no del literal develop (5155.5314ms)
✔ guardia: sin comando_verificacion, fuera de un repo o con entrada rara, deja pasar (2691.9111ms)
✔ guardia: una fuente que no resuelve a un commit hacia develop bloquea (no se puede comprobar) (3159.3268ms)
✔ guardia: el punto de entrada real decide por stdin (0 / 2) y nunca sale con 1 (5891.8151ms)
✔ guardia: hooks.json declara el PreToolUse sin filtro if, en forma exec, sin la sonda y sin nombrar el producto (1.0744ms)
✔ comando-merge (TASK-103, MEN-2): --abort/--quit/--continue/--skip como valor de -m no esconden el merge (0.6236ms)
✔ comando-merge (TASK-103): { ...; }, time y eval no esconden el merge (0.7667ms)
✔ comando-merge (TASK-103): git checkout <x> solo cambia el destino si x es rama (0.3585ms)
✔ guardia (TASK-103): con la config ilegible, un merge hacia develop, main o master bloquea y dice que arreglar (9602.2811ms)
✔ guardia (TASK-103): con la config ilegible, hacia otra rama deja pasar, como antes (6515.6154ms)
✔ guardia (TASK-103): sin fichero de config deja pasar, como antes (2640.312ms)
✔ guardia (TASK-103): el hook real evalua los merges que antes no detectaba (41854.3905ms)
✔ guardia (TASK-103): el hook real con la config ilegible bloquea con su mensaje (2599.351ms)
✔ hook: con la tarea en curso en la rama anota la sesion, y en SubagentStop tambien el subagente (3635.5864ms)
✔ hook: sin tarea en curso sale sin hacer nada y sin consultar la rama (ningun proceso) (3611.4561ms)
✔ hook: en otra rama, con COSTE_AUTOMATICO=0 o con una entrada rara, no anota nada (2820.5702ms)
✔ hook: entradasDeHook valida ids y rutas antes de anotar (0.8691ms)
✔ hook: como proceso sale con 0, sin escribir nada, y anota en el libro (3791.1472ms)
✔ hook: hooks.json lo declara en Stop y SubagentStop, en forma exec, con timeout corto y sin nombrar el producto (1.5017ms)
✔ salida temprana (TASK-114, criterio 1): sin comando_heldout el guardian de held-out deja pasar en la rama de la tarea (4769.4385ms)
✔ salida temprana (TASK-114): con comando_heldout sigue bloqueando, y una config ilegible tambien protege (4283.7387ms)
✔ salida temprana (TASK-114, criterio 2): un comando sin git ni script de cierre no es candidato a merge (3286.8827ms)
✔ salida temprana (TASK-114, MEN-1): el prefiltro del punto de entrada no carga el guardian sin git ni script (0.9751ms)
ℹ tests 907
ℹ suites 0
ℹ pass 907
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 158224.771
[verificar-impacto] node --test termino con 0 en 158.4 s.
````
