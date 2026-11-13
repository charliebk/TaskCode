# Peticion de revision — TASK-126 (ronda 3)

- Tarea: TASK-126 — Verificacion por tipo de rama: los tests pesados solo en la puerta de release
- Rama revisada: feature/task-126-verificacion-por-tipo-de-rama-los-tests
- Rama base: develop
- Commit revisado (HEAD): c4b7d8871d6e4cb6114e61a9cf8ea7ed911f04a3
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-126 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 78d61018752f8c76618ffcdc94add5734fb542b2 (el commit revisado en la ronda anterior)
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
informe de esta ronda (informe-revision-3.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-126/tarea.md
- tareas/03-en-revision/TASK-126/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 1 hallazgo(s) MENOR de la ronda 2 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts | informe-revision-2.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts | informe-revision-2.md |

## Commits a revisar (git log 78d61018752f8c76618ffcdc94add5734fb542b2..HEAD)

````
c4b7d88 fix(TASK-126): mensaje propio de los pesados en rojo en el camino idempotente (IMP-2 ronda 2)
b76e852 chore(TASK-126): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 78d61018752f8c76618ffcdc94add5734fb542b2..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 808dc27..a5f2fd4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -140,6 +140,11 @@ export interface PuertaPesadaOpts {
   timeoutMs?: number;
   env?: NodeJS.ProcessEnv;
   onAviso?: (aviso: string) => void;
+  /**
+   * IMP-2 (ronda 2 de TASK-126): el camino idempotente, con la rama ya
+   * integrada a mano en estas ramas. El rojo no puede decir «no se mergea».
+   */
+  yaIntegradaEn?: readonly string[];
 }
 
 /**
@@ -164,6 +169,17 @@ export function puertaPesada(o: PuertaPesadaOpts): boolean {
   const limpio = isWorkspaceClean(o.cwd);
   const huella = limpio ? huellaDelArbol(o.cwd, comando, timeoutS) : null;
   if (huella !== null) guardarMemo(o.cwd, huella, r, 'pesada');
+  if (r.estado !== 'verde' && o.yaIntegradaEn !== undefined && o.yaIntegradaEn.length > 0) {
+    const ramas = o.yaIntegradaEn.map((x) => `"${x}"`).join(' y ');
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la rama ya esta integrada en ${ramas} (merge hecho fuera de finish), pero los tests pesados ` +
+        '(comando_verificacion_pesada) no salen en verde sobre ese arbol: no se cierra la tarea, que no se ha movido ' +
+        'de carpeta. El merge ya esta hecho y no se deshace: se arregla hacia delante, en la rama de integracion.\n' +
+        `${formatearVerificacionRoja(r)}\n` +
+        `Corrige alli hasta que los pesados salgan en verde, commitea y relanza taskctl finish ${o.id}. Si la persona ` +
+        `decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`
+    );
+  }
   if (r.estado !== 'verde') {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: no se mergea con los tests pesados en rojo (comando_verificacion_pesada, que exigen las ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index bcfb3db..29d65f0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -685,6 +685,7 @@ async function runFinish(
         puertaPesada({
           id,
           tipo,
+          yaIntegradaEn: mainBranch !== null && tipo !== 'feature' && tipo !== 'fix' ? [mainBranch, ramaIntegracion] : [ramaIntegracion],
           cwd: deps.repoCwd,
           env: entornoConContador(process.env, progreso.contador()),
           ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 78d61018752f8c76618ffcdc94add5734fb542b2..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-126/revision/informe-revision-1.md                         |  65 ++++++++++++++++++++++++++++++++---
 tareas/03-en-revision/TASK-126/revision/informe-revision-2.md                         |  21 ++++++++++++
 tareas/03-en-revision/TASK-126/revision/peticion-revision-2.md                        | 197 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-126/tarea.md                                               |   1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js |   9 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js              |   1 +
 6 files changed, 289 insertions(+), 5 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 78d61018752f8c76618ffcdc94add5734fb542b2..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts | 24 +++++++++++++++++++++++-
 1 file changed, 23 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 218.1 s
- Commit verificado: c4b7d8871d6e4cb6114e61a9cf8ea7ed911f04a3
- Huella: a640d11526a21445dee2e6d15f74395e23a82848
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 150856 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6664ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.747ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9678ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (5.0685ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.9295ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6233ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.91ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.6271ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.8167ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3512ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.2999ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.503ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.4869ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.5747ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (35.6168ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.3321ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.9175ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.7597ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4017ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2059ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1745ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.204ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2314ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2068ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2004ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2203ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.2058ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1522ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1563ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1596ms)
✔ resolverAsignado: recorta los tres escalones (0.1785ms)
ℹ tests 960
ℹ suites 0
ℹ pass 960
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 204780.4191
[verificar-impacto] node --test termino con 0 en 204.9 s.
````
