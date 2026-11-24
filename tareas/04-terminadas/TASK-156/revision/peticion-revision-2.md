# Peticion de revision — TASK-156 (ronda 2)

- Tarea: TASK-156 — verificar-impacto elige los tests que leen los md de skills, agents y docs del plugin
- Rama revisada: fix/task-156-verificar-impacto-elige-los-tests-que-le
- Rama base: develop
- Commit revisado (HEAD): f2cc1aa109e6f813637617fa47253df5a79ffee6
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-156 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde d4c51c4b7491e10b6e5691157b5647270a6cb391 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (2 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu
tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion
   ya trae la verificacion de la ronda en verde para ese mismo commit, no la
   repitas: cita ese resultado y corre solo los tests de lo que verificas.
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

- tareas/03-en-revision/TASK-156/tarea.md
- tareas/03-en-revision/TASK-156/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:375 (`proximidad`) y :309-311 (`lectores`) | informe-revision-1.md |

## Commits a revisar (git log d4c51c4b7491e10b6e5691157b5647270a6cb391..HEAD)

````
f2cc1aa chore(TASK-156): autorrevision ronda 2
d8ef728 fix(TASK-156): con tope, los que nombran el fichero van antes que los lectores de carpeta (IMP-1)
bdbbcb1 chore(TASK-156): autorrevision 4D
6f0e0a2 chore(TASK-156): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff d4c51c4b7491e10b6e5691157b5647270a6cb391..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index 090c036..75cadd2 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -45,8 +45,9 @@
  * minimo 1) directos mas proximos: primero los tests cambiados, luego los que
  * se llaman como el modulo cambiado (`finish*` para `src/commands/finish.ts`),
  * luego los de una carpeta con el nombre de la suya (`test/gitflow/` para
- * `scripts/gitflow/*`, `test/skills/` para `skills/<x>/*`) y despues el resto
- * por orden alfabetico. La salida dice
+ * `scripts/gitflow/*`), despues el resto por orden alfabetico y, al final, los
+ * que solo leen la carpeta del fichero (primero los de `test/skills/` para
+ * `skills/<x>/*`). La salida dice
  * cuantos se dejan fuera. Nunca queda en cero lo que cambia si tiene tests.
  * Con TIPO_VERIFICACION=selectiva (rondas de review y finish, TASK-139b) no
  * hay tope: todos los afectados, y la suite entera si no se sabe que afecta. El
@@ -267,16 +268,21 @@ export const TOPE_POR_DEFECTO = 10;
  */
 export function seleccionar(cambiadas, nodos, tope = TOPE_POR_DEFECTO) {
   const elegidos = new Map();
-  /** Directos: fichero -> { motivo, origenes } (rutas cambiadas de las que viene). */
+  /**
+   * Directos: fichero -> { motivo, origenes, soloCarpeta }: las rutas cambiadas
+   * de las que viene y, de ellas, por las que solo entro por leer su carpeta
+   * (TASK-156; ver `proximidad`).
+   */
   const directos = new Map();
   const anotar = (mapa, fichero, motivo) => {
     if (!mapa.has(fichero)) mapa.set(fichero, motivo);
   };
-  const anotarDirecto = (fichero, motivo, origen) => {
-    if (!directos.has(fichero)) directos.set(fichero, { motivo, origenes: new Set() });
+  const anotarDirecto = (fichero, motivo, origen, soloCarpeta = false) => {
+    if (!directos.has(fichero)) directos.set(fichero, { motivo, origenes: new Set(), soloCarpeta: new Set() });
     const d = directos.get(fichero);
     if (motivo === 'test cambiado') d.motivo = motivo;
     d.origenes.add(origen);
+    if (soloCarpeta) d.soloCarpeta.add(origen);
   };
   let todo = null;
   const cortes = [];
@@ -314,7 +320,8 @@ export function seleccionar(cambiadas, nodos, tope = TOPE_POR_DEFECTO) {
       continue;
     }
     for (const t of testsQueDependenDe(nodos, mencionan.map(([f]) => f), cortes)) anotar(elegidos, t, `usa ${ruta}`);
-    for (const [f] of mencionan) if (esTest(f)) anotarDirecto(f, `usa ${ruta}`, ruta);
+    const nombran = new Set(porNombre.map(([f]) => f));
+    for (const [f] of mencionan) if (esTest(f)) anotarDirecto(f, `usa ${ruta}`, ruta, !nombran.has(f));
   }
   const lista = (mapa) =>
     [...mapa].map(([fichero, m]) => ({ fichero, motivo: typeof m === 'string' ? m : m.motivo })).sort((a, b) => a.fichero.localeCompare(b.fichero));
@@ -359,20 +366,28 @@ export function seleccionar(cambiadas, nodos, tope = TOPE_POR_DEFECTO) {
  * 0 si es un test cambiado; 1 si se llama como el modulo cambiado
  * (`finish.ts` -> `finish*.test.ts`); 2 si vive en una carpeta con el nombre
  * de la del modulo (`scripts/gitflow/x.sh` -> `test/gitflow/`); 3 el resto.
+ * TASK-156: quien solo entro por leer la carpeta del fichero (skills/,
+ * agents/, docs/) va detras de todos los que lo nombran, que es lo que se
+ * elegia antes: 3.5 si vive en `test/<esa carpeta>/` (`test/skills/` para
+ * `skills/plan/SKILL.md`) y 4 si no. Asi el tope nunca deja fuera, por un
+ * lector de carpeta, a un test que lee justo el fichero cambiado.
  */
 function proximidad(fichero, directo) {
   if (directo.motivo === 'test cambiado') return 0;
   const base = path.posix.basename(fichero).replace(/\.test\.ts$/, '');
   const carpetas = path.posix.dirname(fichero).split('/');
-  let p = 3;
+  let p = 4;
   for (const origen of directo.origenes) {
+    if (directo.soloCarpeta.has(origen)) {
+      const leida = carpetaLeida(origen.slice(PLUGIN.length + 1))?.carpeta;
+      p = Math.min(p, leida !== undefined && carpetas.includes(leida) ? 3.5 : 4);
+      continue;
+    }
+    p = Math.min(p, 3);
     const modulo = path.posix.basename(origen).replace(/\.[^.]+$/, '').replace(/^_+/, '');
     const carpeta = path.posix.basename(path.posix.dirname(origen));
-    // TASK-156: `skills/plan/SKILL.md` tambien esta cerca de `test/skills/`.
-    const leida = origen.startsWith(`${PLUGIN}/`) ? carpetaLeida(origen.slice(PLUGIN.length + 1))?.carpeta : undefined;
     if (modulo !== '' && base.startsWith(modulo)) p = Math.min(p, 1);
     else if (!['src', 'test', 'helpers', '.', ''].includes(carpeta) && carpetas.includes(carpeta)) p = Math.min(p, 2);
-    else if (leida !== undefined && carpetas.includes(leida)) p = Math.min(p, 2);
   }
   return p;
 }
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff d4c51c4b7491e10b6e5691157b5647270a6cb391..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-156/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-156/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-156/revision/informe-revision-1.md                               |  28 +++++++++++++
 tareas/03-en-revision/TASK-156/revision/peticion-revision-1.md                              | 218 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-156/tarea.md                                    |  17 ++++++--
 5 files changed, 260 insertions(+), 3 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff d4c51c4b7491e10b6e5691157b5647270a6cb391..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 13 +++++++++----
 1 file changed, 9 insertions(+), 4 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 613.7 s
- Commit verificado: f2cc1aa109e6f813637617fa47253df5a79ffee6
- Huella: 4b98ea349af7316987e8ca6135f90a58bfb60977
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 71033 bytes en total):

````
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (7.2081ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.9643ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4756ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.6286ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4139ms)
✔ un test cambiado se corre solo el (4657.9559ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (2421.2508ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (9597.0215ms)
✔ un cambio sin commitear tambien cuenta (6527.5003ms)
✔ un helper de test elige los tests que lo importan (4929.1608ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (67574.4468ms)
✔ TASK-156: un .md de skills/, agents/ o docs/ del plugin elige los tests que leen su carpeta, ademas de los que lo nombran (111808.2876ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (9197.5126ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (2984.0792ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (6774.8393ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (45570.1457ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) ni TIPO_VERIFICACION (56572.8386ms)
✔ TASK-139b: con selectiva y un cambio sin test que lo nombre, corre la suite entera (43679.1188ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (36996.1825ms)
✔ TASK-139b: con TIPO_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (34116.1072ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (85506.4657ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (6669.9143ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (4651.196ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (11707.0081ms)
[ERROR] verificar-impacto: otra verificacion (pid 4736) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-DT3TkE\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-DT3TkE\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (5507.0501ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (19.6934ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (4581.1655ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (4607.5087ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (14160.1845ms)
ℹ tests 720
ℹ suites 0
ℹ pass 720
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 587841.14
[verificar-impacto] node --test termino con 0 en 588.1 s.
````
