# Peticion de revision — TASK-119 (ronda 3)

- Tarea: TASK-119 — P-11: menos commits de proceso por tarea
- Rama revisada: feature/task-119-p-11-menos-commits-de-proceso-por-tarea
- Rama base: develop
- Commit revisado (HEAD): 5ba60e04321327dbee97994b26b63669d2fbe29a
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-119 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 1e7d2246e42c81c21bc646c6731299278439ef24 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (6 hallazgo(s)))

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
informe de esta ronda (informe-revision-3.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-119/tarea.md
- tareas/03-en-revision/TASK-119/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 5 hallazgo(s) MENOR de la ronda 2 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | test/commands/pendientes-fase.test.ts | informe-revision-2.md |

## Commits a revisar (git log 1e7d2246e42c81c21bc646c6731299278439ef24..HEAD)

````
5ba60e0 fix(TASK-119): merge request sube lo pendiente; HEAD desacoplado; test de finish con merge fallido (IMP-1, MEN-3, MEN-5)
88f9965 chore(TASK-119): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 1e7d2246e42c81c21bc646c6731299278439ef24..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index ed047b7..4c0edc6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -88,7 +88,13 @@ import {
 } from '../fs/git-commit.js';
 import { conProgreso, crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
-import { apartarPendientes, hayCambiosFueraDeTarea, recuperarApartado, type Apartado } from '../fs/pendientes.js';
+import {
+  apartarPendientes,
+  hayCambiosFueraDeTarea,
+  hayPendientesDeTarea,
+  recuperarApartado,
+  type Apartado,
+} from '../fs/pendientes.js';
 import { extraerSinVerificacion, puertaReintento, puertaVerificacion, type ResultadoReintento } from './finish-verificacion.js';
 import { puertaHeldout } from './finish-heldout.js';
 import { puertaCobertura } from './finish-cobertura.js';
@@ -1017,6 +1023,21 @@ async function abrirMergeRequestYAnotar(o: AbrirMergeRequestOpts): Promise<Finis
   }
   if (o.nombreTag !== null) comprobarTagLibre(o.nombreTag, id, o.push, cwd, deps.onAviso);
 
+  // TASK-119 (MEN-3 de la revision): lo pendiente de la tarea (veredicto,
+  // informe, coste) tiene que viajar en la rama que se sube: quien revisa el
+  // merge request en la plataforma lo ve. Es el unico camino que lo commitea
+  // aparte, porque la anotacion del MR va despues de la subida.
+  if (hayPendientesDeTarea(cwd, o.tareasRoot, id)) {
+    const previo = autoCommit({
+      fase: 'finish',
+      cwd,
+      rutas: [path.dirname(initial.filePath)],
+      mensaje: mensajeChore(id, 'registros de la revision'),
+      push: false,
+    });
+    for (const a of previo.avisos) deps.onAviso?.(a);
+  }
+
   // Primer efecto: subir la rama.
   try {
     pushRama(task.rama, cwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
index d7ef61b..c4ac869 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
@@ -55,7 +55,10 @@ function refApartado(cwd: string, id: string): { ref: string; rama: string | nul
   for (const linea of lineas) {
     const [ref, asunto] = linea.split('\t');
     if (ref !== undefined && asunto !== undefined && asunto.endsWith(sufijo)) {
-      const rama = asunto.startsWith('On ') ? asunto.slice(3, asunto.length - sufijo.length) : null;
+      const enAsunto = asunto.startsWith('On ') ? asunto.slice(3, asunto.length - sufijo.length) : null;
+      // MEN-5 de la revision: con HEAD desacoplado git escribe "(no branch)";
+      // currentBranch da '' en ese caso.
+      const rama = enAsunto === '(no branch)' ? '' : enAsunto;
       return { ref, rama };
     }
   }
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 1e7d2246e42c81c21bc646c6731299278439ef24..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-119/revision/informe-revision-1.md            |  64 ++++++++++++++++++--
 tareas/03-en-revision/TASK-119/revision/informe-revision-2.md            |  21 +++++++
 tareas/03-en-revision/TASK-119/revision/peticion-revision-2.md           | 388 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-119/tarea.md                                  |   1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js |  17 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/pendientes.js   |   5 +-
 6 files changed, 489 insertions(+), 7 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 1e7d2246e42c81c21bc646c6731299278439ef24..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts | 22 +++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts      | 64 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 85 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 359.8 s
- Commit verificado: 5ba60e04321327dbee97994b26b63669d2fbe29a
- Huella: 9fc29cc724dddfb653d3021b555a493c8c262a6a
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 147469 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6306ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.9643ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1468ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.0606ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.2103ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6284ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (2.9834ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (5.6644ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.7838ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.4115ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3031ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.5927ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.2951ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.4546ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (32.4459ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.2768ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.9387ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.5397ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3651ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2105ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1944ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.1893ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2111ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2084ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2053ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2294ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1832ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2037ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1717ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1661ms)
✔ resolverAsignado: recorta los tres escalones (0.1732ms)
ℹ tests 921
ℹ suites 0
ℹ pass 920
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 342305.9899
[verificar-impacto] node --test termino con 0 en 342.5 s.
````
