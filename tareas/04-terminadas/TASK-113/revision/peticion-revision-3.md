# Peticion de revision — TASK-113 (ronda 3)

- Tarea: TASK-113 — P-5: peticion de revision mas ligera con los tests como --stat y ruta
- Rama revisada: feature/task-113-p-5-peticion-de-revision-mas-ligera-con
- Rama base: develop
- Commit revisado (HEAD): 442a553c10ff04531c25867b06416e381a2084e7
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-113 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 63f06cadd3a999416ee01f41fbbc5328ee0e1cfa (el commit revisado en la ronda anterior)
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
informe de esta ronda (informe-revision-3.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-113/tarea.md
- tareas/03-en-revision/TASK-113/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:659-675 (`statDeFicheros`, `LOTE_RUTAS_STAT`); src/commands/review.ts:494-508 (`seccionTests`, `MAX_RUTAS_ORDEN_TESTS`) | informe-revision-2.md |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:305-313 (`PATRONES_TEST`, comentario) | informe-revision-2.md |
| NUEVO-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts:83-94 (`fueraDeTareas`), con el patron `**/*-lock.*` de src/core/config.ts:278-279 | informe-revision-2.md |

## Commits a revisar (git log 63f06cadd3a999416ee01f41fbbc5328ee0e1cfa..HEAD)

````
442a553 fix(TASK-113): el patron de lockfiles por defecto ya no excluye codigo con -lock en el nombre (NUEVO-1)
aa35285 chore(TASK-113): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 63f06cadd3a999416ee01f41fbbc5328ee0e1cfa..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
index 219b1ad..718307f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
@@ -95,7 +95,7 @@ workspace, o actualizar el config).
 **Otra clave opcional, `excluir_de_revision`:** patrones (semantica de
 `git :(glob)`) cuyo diff no se embebe en la peticion de revision; aparecen en
 un `--stat` con la orden para pedirlos. Por defecto
-`[**/dist/**, **/*.lock, **/*-lock.*, tareas/**]`; definirla **sustituye** esa
+`[**/dist/**, **/*.lock, **/*-lock.json, **/*-lock.yaml, **/*-lock.yml, **/*-lock.toml, tareas/**]`; definirla **sustituye** esa
 lista (incluye `tareas/**` si la quieres mantener) y `[]` no excluye nada.
 
 **Compatibilidad con versiones anteriores del plugin:**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 779b7ac..7bfdb4b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -276,7 +276,12 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   excluir_de_revision: Object.freeze([
     '**/dist/**',
     '**/*.lock',
-    '**/*-lock.*',
+    // TASK-113 (IMPORTANTE de la ronda 2): no `**/*-lock.*`, que tambien casa
+    // con codigo real (`src/services/redis-lock.ts`) y lo sacaba de la revision.
+    '**/*-lock.json',
+    '**/*-lock.yaml',
+    '**/*-lock.yml',
+    '**/*-lock.toml',
     'tareas/**',
   ]) as readonly string[],
   contexto_revision: Object.freeze([]) as readonly string[],
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 63f06cadd3a999416ee01f41fbbc5328ee0e1cfa..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-113/revision/informe-revision-2.md        |  85 +++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-113/revision/peticion-revision-2.md       | 301 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-113/tarea.md                              |  21 +++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js |   7 ++-
 4 files changed, 413 insertions(+), 1 deletion(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 63f06cadd3a999416ee01f41fbbc5328ee0e1cfa..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts  | 10 +++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts | 15 +++++++++++++++
 2 files changed, 24 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 173.5 s

Final de la salida (truncada: 136136 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (1.0471ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7485ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1861ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (8.6066ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (17.4789ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (1.3406ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (7.2155ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (7.6028ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.7722ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3527ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3251ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.535ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3363ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.4746ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (37.8315ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.165ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (2.5343ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.5835ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3465ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2403ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1715ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2095ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2106ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2072ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2248ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2344ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1725ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2076ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.2013ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1954ms)
✔ resolverAsignado: recorta los tres escalones (0.2427ms)
ℹ tests 851
ℹ suites 0
ℹ pass 851
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 157434.7288
[verificar-impacto] node --test termino con 0 en 157.6 s.
````
