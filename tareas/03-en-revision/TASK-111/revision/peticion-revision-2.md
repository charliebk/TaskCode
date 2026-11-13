# Peticion de revision — TASK-111 (ronda 2)

- Tarea: TASK-111 — P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo
- Rama revisada: feature/task-111-p-3-registrar-cada-ejecucion-del-freno-s
- Rama base: develop
- Commit revisado (HEAD): 0f490498db5d4b8ffb9754a0402fb10f11ab22cb
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-111 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde d2615c58a89baa43223bebdb47ae6bd93b53772d (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-111/tarea.md
- tareas/03-en-revision/TASK-111/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-registro.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 1 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts:282 | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts:504-511 | informe-revision-1.md |

## Commits a revisar (git log d2615c58a89baa43223bebdb47ae6bd93b53772d..HEAD)

````
0f49049 fix(TASK-111): rojo de memo como omitido y tests de cableado de metricas y del ultimo verde (IMP-1, IMP-2, MEN-1)
13c9d37 chore(TASK-111): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff d2615c58a89baa43223bebdb47ae6bd93b53772d..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
index c66fbeb..e93efe7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
@@ -55,7 +55,7 @@ declarada, no hay puerta y no hay línea.
 | Campo | Valor |
 |---|---|
 | `modo` | El tipo de verificación: `completa`, `selectiva` o `documentacion` |
-| `resultado` | `verde` (ejecutó y salió bien), `rojo` (cualquier otro desenlace: bloquea el turno), `omitido` (no ejecutó: la huella del árbol es la de su último verde, o el memo de la verificación ya la tenía en verde) o `excedido` (agotó su presupuesto de tiempo) |
+| `resultado` | `verde` (ejecutó y salió bien), `rojo` (ejecutó y no salió bien: bloquea el turno), `omitido` (no ejecutó: la huella del árbol es la de su último verde, o el memo de la verificación ya tenía su resultado; si ese resultado es rojo, el turno se sigue bloqueando) o `excedido` (agotó su presupuesto de tiempo) |
 | `duracion_s` | Tiempo de reloj de la verificación; `0.0` cuando se omite |
 
 El último verde del freno se guarda aparte, en
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
index c92c3a5..8df9604 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
@@ -78,7 +78,8 @@ export function tareaDeMensaje(mensaje: string): string | null {
  * TASK-111: la puerta del freno Stop. `modo` es el tipo de verificacion
  * (`completa`, `selectiva`, `documentacion`) y `resultado` uno de estos:
  * `verde` (ejecuto en verde), `rojo` (cualquier otro desenlace: bloquea),
- * `omitido` (no ejecuto: sin cambios desde el ultimo verde) y `excedido`
+ * `omitido` (no ejecuto: sin cambios desde el ultimo verde, o resultado del
+ * memo compartido, que si es rojo sigue bloqueando) y `excedido`
  * (agoto su presupuesto de tiempo; lo escribe el presupuesto del freno).
  */
 export const PUERTA_FRENO = 'freno';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index 5235640..f73250e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -280,7 +280,9 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       if (verificacion.huella !== null && !cambioElArbol) guardarUltimoVerde(raiz, peticion.tipo, verificacion.huella);
       return dejarParar;
     }
-    anotar('rojo', duracionS);
+    // IMP-1 (revision TASK-111): un rojo servido del memo compartido sigue
+    // bloqueando, pero no ha ejecutado nada: no cuenta como ejecucion.
+    anotar(deMemo ? 'omitido' : 'rojo', duracionS);
     if (plan.tipo === 'documentacion') {
       avisos.push(
         `Es la comprobacion de documentacion (comando_verificacion_documentacion): ${plan.motivo}. ` +
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff d2615c58a89baa43223bebdb47ae6bd93b53772d..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-111/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-111/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-111/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-111/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-111/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-111/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-111/revision/informe-revision-1.md                                                  |  21 ++++
 tareas/03-en-revision/TASK-111/revision/peticion-revision-1.md                                                 | 474 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-111/tarea.md                                                       |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/registro-puertas.js                                 |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                      |   4 +-
 11 files changed, 509 insertions(+), 4 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff d2615c58a89baa43223bebdb47ae6bd93b53772d..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-registro.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts | 44 +++++++++++++++++++++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-registro.test.ts          | 48 +++++++++++++++++++++++++++++++++++++++++++++++-
 2 files changed, 90 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 144.2 s
- Commit verificado: 0f490498db5d4b8ffb9754a0402fb10f11ab22cb
- Huella: 661ddc5f17f6f4d90f2903a7665e484be69eb79d
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 84652 bytes en total):

````
✔ freno (TASK-111, MEN-1): un verde que cambia el arbol no se guarda como ultimo verde (7220.6599ms)
✔ freno (TASK-102): un turno de solo documentacion corre la comprobacion de documentacion y no la suite (10562.8645ms)
✔ freno (TASK-102): solo documentacion sin comando de documentacion no corre nada (3557.6666ms)
✔ freno (TASK-102): documentacion sin commitear todavia, sin commits en la rama, cuenta como solo documentacion (5841.9096ms)
✔ freno (TASK-102): un fichero de codigo modificado sin commitear aplica la verificacion de siempre (8371.0869ms)
✔ freno (TASK-102): un fichero de codigo preparado (git add) sin commitear aplica la verificacion de siempre (7312.1141ms)
✔ freno (TASK-102): un fichero de codigo sin seguimiento aplica la verificacion de siempre (7943.2214ms)
✔ freno (TASK-102): un commit de codigo en la rama aplica la verificacion de siempre (6599.0608ms)
✔ freno (TASK-102): con la selectiva declarada, solo documentacion se decide antes; con codigo, la selectiva (10863.6608ms)
✔ freno (TASK-102): sin rutas_documentacion se comporta como en la 0.14.0 y no lanza ningun git nuevo (8890.4693ms)
✔ freno (TASK-102): con el arbol sucio corre la comprobacion de documentacion pero no guarda su memo; limpio, si (9474.4514ms)
✔ freno (TASK-102): una config de la base invalida no bloquea: la verificacion de siempre con un aviso (6634.0704ms)
✔ freno (TASK-102, MEN-1/MEN-2): un hotfix no se exime por documentacion ni va a la red a por su base (6066.2266ms)
✔ freno: verificacion en verde deja parar, en silencio (8382.0413ms)
✔ freno: verificacion en rojo bloquea con exit 2 y el comando, el codigo, la duracion y la cola (4904.8837ms)
✔ freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecuta el comando (5320.4332ms)
✔ freno: fuera de un proyecto con tareas (o sin cwd) sale 0 sin tocar nada (7.6041ms)
✔ freno: stop_hook_active e interruptor FRENO_VERIFICACION=0 dejan parar sin ejecutar (1507.4642ms)
✔ freno: respeta el timeout y corta el comando (bloquea, no deja pasar) (8000.493ms)
✔ freno: timeout_verificacion por encima del tope del hook se recorta y se avisa (4316.1279ms)
✔ freno: config invalida con tarea en curso bloquea con el error de la config (2364.2809ms)
✔ freno: memo por huella — mismo arbol no vuelve a ejecutar, un cambio si (17514.5798ms)
✔ freno: la cola va acotada, sin ANSI, sin credenciales y sin partir UTF-8 (4976.6817ms)
✔ freno: el punto de entrada real, por stdin, sale con 2 en rojo y 0 en verde (7873.49ms)
✔ freno: hooks.json declara el Stop en forma exec, con el tope que usa el codigo y sin nombrar el producto (2.2117ms)
✔ freno (IMP-2): el timeout efectivo nunca supera el tope del hook menos el margen (0.3375ms)
✔ freno (MEN-1): un corte con salida corta no se rotula como truncado (5823.4761ms)
✔ freno (MEN-2): una tarea en curso ilegible no frena, pero se avisa (1305.7923ms)
✔ freno (MEN-7): si la propia verificacion ensucia el arbol, el informe lo avisa (3177.6028ms)
✔ informe (MEN-7): recortarCola no parte caracteres multibyte en una linea larga (0.7489ms)
✔ informe (MEN-5): una muerte sin codigo no se describe como «codigo null» (0.2522ms)
ℹ tests 870
ℹ suites 0
ℹ pass 870
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 128966.2356
[verificar-impacto] node --test termino con 0 en 129.1 s.
````
