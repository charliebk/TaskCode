# Peticion de revision — TASK-126 (ronda 2)

- Tarea: TASK-126 — Verificacion por tipo de rama: los tests pesados solo en la puerta de release
- Rama revisada: feature/task-126-verificacion-por-tipo-de-rama-los-tests
- Rama base: develop
- Commit revisado (HEAD): 78d61018752f8c76618ffcdc94add5734fb542b2
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-126 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 0ea8524e8db888305f7c6f443257a51b7f9bf0ac (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-126/tarea.md
- tareas/03-en-revision/TASK-126/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 1 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts | informe-revision-1.md |

## Commits a revisar (git log 0ea8524e8db888305f7c6f443257a51b7f9bf0ac..HEAD)

````
78d6101 fix(TASK-126): pesados tambien en el camino idempotente de finish y test del guardian con hotfix (IMP-1, MEN-1)
c435741 chore(TASK-126): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 0ea8524e8db888305f7c6f443257a51b7f9bf0ac..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index be16d15..bcfb3db 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -679,6 +679,18 @@ async function runFinish(
         ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
         entornoVerificacion: () => entornoConContador(process.env, progreso.contador()),
       });
+      // TASK-126 (IMP-1 de la revision): tambien en el camino idempotente, tras la
+      // completa en verde, los pesados de los tipos de verificacion_pesada_en.
+      if (reintento.tipo === 'verde' && reintento.que === 'completa') {
+        puertaPesada({
+          id,
+          tipo,
+          cwd: deps.repoCwd,
+          env: entornoConContador(process.env, progreso.contador()),
+          ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+          ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
+        });
+      }
     } catch (e: unknown) {
       if (origen !== '' && origen !== ramaIntegracion && isWorkspaceClean(deps.repoCwd)) {
         checkoutBranch(origen, deps.repoCwd);
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 0ea8524e8db888305f7c6f443257a51b7f9bf0ac..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-126/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-126/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-126/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-126/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-126/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-126/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-126/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-126/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-126/revision/informe-revision-1.md                                                  |  21 ++++
 tareas/03-en-revision/TASK-126/revision/peticion-revision-1.md                                                 | 546 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-126/tarea.md                                                       |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                       |  12 ++
 12 files changed, 588 insertions(+), 2 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 0ea8524e8db888305f7c6f443257a51b7f9bf0ac..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts | 37 +++++++++++++++++++++++++++++++++++++
 1 file changed, 37 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 296.4 s
- Commit verificado: 78d61018752f8c76618ffcdc94add5734fb542b2
- Huella: 734ac6fded0b24aad90d4af71d94097e490d010d
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 150742 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.804ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.8422ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0706ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (6.5649ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (19.3103ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (1.2176ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.4508ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.5541ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.7859ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.5642ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3797ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.5323ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3447ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.4815ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (32.3838ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.9146ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (2.2762ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.6571ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.383ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.1949ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1676ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.1973ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2065ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2069ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.1965ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2412ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1916ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2269ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1752ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.172ms)
✔ resolverAsignado: recorta los tres escalones (0.1751ms)
ℹ tests 959
ℹ suites 0
ℹ pass 959
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 277609.772
[verificar-impacto] node --test termino con 0 en 277.9 s.
````
