# Peticion de revision — TASK-145a (ronda 2)

- Tarea: TASK-145a — puertas, git y textos de error (parte a de TASK-145)
- Rama revisada: fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
- Rama base: develop
- Commit revisado (HEAD): 59385a0ff51c8b798e4fb4cd7d81a27963d9cf77
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-145a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 4df4a98d2c7f0aba0de97109a02141d487caf113 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (3 hallazgo(s)))

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

- tareas/03-en-revision/TASK-145a/tarea.md
- tareas/03-en-revision/TASK-145a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 2 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts:254 | informe-revision-1.md |

## Commits a revisar (git log 4df4a98d2c7f0aba0de97109a02141d487caf113..HEAD)

````
59385a0 chore(TASK-145a): autorrevision ronda 2
f5d4dbc fix(TASK-145a): anotarSuite solo en la completa con test, concordancia y CIERRE_SIN_MERGE (IMP-1, MEN-1, MEN-2)
a287b58 chore(TASK-145a): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 4df4a98d2c7f0aba0de97109a02141d487caf113..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 9e2588d..7476689 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -65,7 +65,7 @@ import { contarTests, PUERTA_SUITE } from '../core/crecimiento-suite.js';
 import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 import { configDeRef } from '../fs/config-de-ref.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
-import { FinishCommandError } from './finish-opciones.js';
+import { CIERRE_SIN_MERGE, FinishCommandError } from './finish-opciones.js';
 import { sinPrefijoError } from '../core/utilidades-texto.js';
 
 export const FLAG_SIN_VERIFICACION = '--sin-verificacion';
@@ -182,7 +182,7 @@ export function puertaPesada(o: PuertaPesadaOpts): boolean {
         cerrarIgualmente(o.id)
     );
   }
-  if (!limpio) throw errorArbolSucio(o.id, 'los tests pesados', comando);
+  if (!limpio) throw errorArbolSucio(o.id, 'los tests pesados salieron en verde, pero han dejado', comando);
   o.onAviso?.(`${o.id}: tests pesados en verde (comando_verificacion_pesada, rama ${o.tipo}).`);
   return true;
 }
@@ -263,10 +263,10 @@ function cerrarIgualmente(id: string): string {
   return `Si la persona decide cerrar igualmente, taskctl finish ${id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`;
 }
 
-/** TASK-145a (CMD1-12): una verificacion en verde que deja el arbol sucio. */
-function errorArbolSucio(id: string, que: string, comando: string, cierre = 'No se ha mergeado nada.'): FinishCommandError {
+/** TASK-145a (CMD1-12): una verificacion en verde que deja el arbol sucio (`que`: sujeto y verbos, con su concordancia). */
+function errorArbolSucio(id: string, que: string, comando: string, cierre = CIERRE_SIN_MERGE): FinishCommandError {
   return new FinishCommandError(
-    `[ERROR] ${id}: ${que} salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
+    `[ERROR] ${id}: ${que} cambios en el arbol de trabajo ` +
       `("${comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita el ` +
       `workspace limpio: ignoralos en .gitignore, o descartalos, y reintenta. ${cierre}`
   );
@@ -394,7 +394,7 @@ export async function puertaVerificacion(
         cerrarIgualmente(o.id)
     );
   }
-  if (!limpio) throw errorArbolSucio(o.id, 'la verificacion', comando);
+  if (!limpio) throw errorArbolSucio(o.id, 'la verificacion salio en verde, pero ha dejado', comando);
   return { resultado: { tipo: 'verde', duracionMs: r.duracionMs, inicioMs }, tarea };
 }
 
@@ -420,12 +420,12 @@ async function puertaSoloDocumentacion(
     if (r.estado !== 'verde') {
       throw new FinishCommandError(
         `[ERROR] ${o.id}: la tarea solo cambia documentacion, pero su comprobacion ` +
-          `(comando_verificacion_documentacion) no sale en verde. No se ha mergeado nada.\n` +
+          `(comando_verificacion_documentacion) no sale en verde. ${CIERRE_SIN_MERGE}\n` +
           `${formatearVerificacionRoja(r)}\n` +
           `Arregla la documentacion, commitea y reintenta. ${cerrarIgualmente(o.id)}`
       );
     }
-    if (!limpio) throw errorArbolSucio(o.id, 'la comprobacion de documentacion', decision.comando);
+    if (!limpio) throw errorArbolSucio(o.id, 'la comprobacion de documentacion salio en verde, pero ha dejado', decision.comando);
   }
   o.onAviso?.(
     `${o.id}: ${decision.motivo}: no se ejecuta la verificacion completa ("${comando}"); ` +
@@ -532,7 +532,7 @@ async function puertaSelectiva(
         `los arreglos y reintenta. ${cerrarIgualmente(o.id)}`
     );
   }
-  if (!isWorkspaceClean(o.cwd)) throw errorArbolSucio(o.id, 'la verificacion selectiva', decision.comando);
+  if (!isWorkspaceClean(o.cwd)) throw errorArbolSucio(o.id, 'la verificacion selectiva salio en verde, pero ha dejado', decision.comando);
   const body = anotarVerificacionParcial(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
   const { commit, tarea } = await anotarYCommitear(o, body, 'cierre con verificacion parcial', 'anotar la verificacion');
   o.onAviso?.(
@@ -645,7 +645,7 @@ export function puertaReintento(o: PuertaReintentoOpts): ResultadoReintento {
     );
   }
   if (!isWorkspaceClean(o.cwd)) {
-    throw errorArbolSucio(o.id, 'la verificacion', peticion.comando, 'La tarea no se ha movido de carpeta.');
+    throw errorArbolSucio(o.id, 'la verificacion salio en verde, pero ha dejado', peticion.comando, 'La tarea no se ha movido de carpeta.');
   }
   return { tipo: 'verde', que: peticion.tipo, deMemo: v.deMemo };
 }
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 4df4a98d2c7f0aba0de97109a02141d487caf113..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-145a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-145a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-145a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-145a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-145a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-145a/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-145a/revision/informe-revision-1.md                                                  |  52 +++++
 tareas/03-en-revision/TASK-145a/revision/peticion-revision-1.md                                                 | 860 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-145a/tarea.md                                                       |  16 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                           |  20 +-
 10 files changed, 935 insertions(+), 13 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 4df4a98d2c7f0aba0de97109a02141d487caf113..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts | 2 ++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts  | 2 ++
 2 files changed, 4 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 261.7 s
- Commit verificado: 59385a0ff51c8b798e4fb4cd7d81a27963d9cf77
- Huella: fdb706a667bd9584ab9220d4829598b26b5e69bc
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 108034 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6655ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (3.2275ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0861ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.817ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (21.6631ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7273ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.8934ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6461ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.6734ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.7462ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8775ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4065ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4933ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3832ms)
✔ ramaActual: la rama; con HEAD desacoplado, null; durante un rebase, la que se rebasa; fuera de un repo, null (4120.7301ms)
✔ rutaGit: absoluta bajo el directorio de Git (aunque cwd sea un subdirectorio); fuera de un repo, null; gitOk (1467.5903ms)
✔ parsearEntradaHook: objeto tal cual; JSON roto, vacio, array o escalar, sin campos (2.2219ms)
✔ los hooks de coste y de merges no cargan el modulo del freno (ni directa ni indirectamente) (609.2604ms)
✔ sin copias: git sin lanzar en las puertas de finish y doctor, y la regex del prefijo de error (123.2258ms)
✔ freno (TASK-102): un turno de solo documentacion corre la comprobacion de documentacion y no la suite (7200.3215ms)
✔ freno (TASK-102): solo documentacion sin comando de documentacion no corre nada (3302.7526ms)
✔ freno (TASK-102): documentacion sin commitear todavia, sin commits en la rama, cuenta como solo documentacion (6548.7348ms)
✔ freno (TASK-102): un fichero de codigo modificado sin commitear aplica la verificacion de siempre (6626.6941ms)
✔ freno (TASK-102): un fichero de codigo preparado (git add) sin commitear aplica la verificacion de siempre (7711.8101ms)
✔ freno (TASK-102): un fichero de codigo sin seguimiento aplica la verificacion de siempre (5830.4368ms)
✔ freno (TASK-102): un commit de codigo en la rama aplica la verificacion de siempre (5812.2926ms)
✔ freno (TASK-102): con la selectiva declarada, solo documentacion se decide antes; con codigo, la selectiva (10023.1095ms)
✔ freno (TASK-102): sin rutas_documentacion se comporta como en la 0.14.0 y no lanza ningun git nuevo (6403.4837ms)
✔ freno (TASK-102): con el arbol sucio corre la comprobacion de documentacion pero no guarda su memo; limpio, si (14268.6148ms)
✔ freno (TASK-102): una config de la base invalida no bloquea: la verificacion de siempre con un aviso (9776.4512ms)
✔ freno (TASK-102, MEN-1/MEN-2): un hotfix no se exime por documentacion ni va a la red a por su base (9636.0193ms)
ℹ tests 805
ℹ suites 0
ℹ pass 805
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 242855.2984
[verificar-impacto] node --test termino con 0 en 243.0 s.
````
