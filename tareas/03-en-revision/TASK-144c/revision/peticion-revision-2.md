# Peticion de revision — TASK-144c (ronda 2)

- Tarea: TASK-144c — patrones de ronda, plan que cuenta y doctor-deploy (parte c de TASK-144)
- Rama revisada: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
- Rama base: develop
- Commit revisado (HEAD): 6d55e198878293d4966c1ee592fecef369b3909e
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-144c (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde d86aba2de84cf8b2fe12701e91e52f3d68e437d0 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

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

- tareas/03-en-revision/TASK-144c/tarea.md
- tareas/03-en-revision/TASK-144c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/patrones-ronda-plan.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 2 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/plan-brainstorm.ts (PETICION_ROL_RE, SALIDA_ROL_RE), src/commands/plan.ts | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | test/commands/patrones-ronda-plan.test.ts, src/commands/approve.ts (planRedactado) | informe-revision-1.md |

## Commits a revisar (git log d86aba2de84cf8b2fe12701e91e52f3d68e437d0..HEAD)

````
6d55e19 docs(TASK-144c): autorrevision ronda 2
51e4155 fix(TASK-144c): IMP-1..2 y MENOR-1..2 de la revision
dfaf59d chore(TASK-144c): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff d86aba2de84cf8b2fe12701e91e52f3d68e437d0..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
index 1ece84c..b3a7157 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
@@ -77,13 +77,21 @@ export async function runTrocearCommand(
     );
   }
   const taskDir = path.dirname(filePath);
-  if (!(await planRedactado(task, taskDir))) {
+  // TASK-144c (CMD1-10): la misma regla que approve. Con dos planes se dice
+  // eso (MENOR-1 de su revision), no «no hay plan redactado».
+  const ruta = planQueCuenta(await resolverPlanFinal(taskDir));
+  if (ruta === 'ambiguo') {
+    throw new TrocearCommandError(
+      `[ERROR] ${id}: hay un plan-final.md en la raiz de la carpeta y otro en planificacion/: no se sabe cual ` +
+        'trocear. Deja solo el de planificacion/ y reintenta. No se ha tocado nada.'
+    );
+  }
+  if (ruta === null || !(await planRedactado(task, taskDir))) {
     throw new TrocearCommandError(
       `[ERROR] ${id}: no hay plan redactado. Las partes se declaran en su seccion "## Troceo".`
     );
   }
-  // TASK-144c (CMD1-10): planRedactado ya descarto null y 'ambiguo'.
-  const rutaPlan = planQueCuenta(await resolverPlanFinal(taskDir)) as string;
+  const rutaPlan = ruta;
   const plan = await readFile(rutaPlan, 'utf8');
 
   let troceo: ReturnType<typeof planificarTroceo>;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
index 44367c8..bbbbb12 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
@@ -22,7 +22,7 @@
  */
 import type { Task } from './task.js';
 import type { ResolucionAgentes } from './heuristica.js';
-import { TODOS_LOS_ROLES, UNIFICADOR_ID, type RolBrainstorm } from './roles-brainstorm.js';
+import { UNIFICADOR_ID, type RolBrainstorm } from './roles-brainstorm.js';
 import { fenceFor } from './markdown.js';
 import { VINETA_PETICION_REUTILIZACION } from './validacion-tarea.js';
 
@@ -49,14 +49,16 @@ export function nombreSalidaRol(rol: RolBrainstorm, ronda: number): string {
 
 /**
  * TASK-144c (CMD2-09 de la auditoria 4D): los patrones de los ficheros de rol
- * salen de los ids de los roles, el mismo dato con el que `nombrePeticionRol`
- * y `nombreSalidaRol` los generan. Antes plan y approve fijaban a mano el
- * prefijo `brainstorm-`: un rol con otro id dejaba de casar en silencio y se
- * rompia la numeracion de rondas.
+ * viven aqui, junto a `nombrePeticionRol` y `nombreSalidaRol`, que los
+ * generan. Antes plan y approve fijaban a mano el prefijo `brainstorm-`.
+ * Casan con CUALQUIER rol, tambien uno retirado o renombrado a mano (IMP-1 de
+ * su revision: su salida es trabajo real que el unificador tiene que ver);
+ * solo quedan fuera las peticiones del unificador y de redaccion, que no son
+ * de un rol. Grupo 1 = ronda.
  */
-const IDS_ROLES = TODOS_LOS_ROLES.map((r) => r.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
-export const PETICION_ROL_RE = new RegExp(`^peticion-(?:${IDS_ROLES})-(\\d+)\\.md$`);
-export const SALIDA_ROL_RE = new RegExp(`^salida-(?:${IDS_ROLES})-(\\d+)\\.md$`);
+const NO_ES_ROL = String.raw`(?!(?:unificador|plan)-\d+\.md$)`;
+export const PETICION_ROL_RE = new RegExp(String.raw`^peticion-${NO_ES_ROL}[a-z0-9-]+-(\d+)\.md$`);
+export const SALIDA_ROL_RE = /^salida-[a-z0-9-]+-(\d+)\.md$/;
 
 export function nombrePeticionUnificador(ronda: number): string {
   return `peticion-unificador-${ronda}.md`;
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff d86aba2de84cf8b2fe12701e91e52f3d68e437d0..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-144c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144c/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144c/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-144c/revision/informe-revision-1.md                                                  |  21 ++++
 tareas/03-en-revision/TASK-144c/revision/peticion-revision-1.md                                                 | 472 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-144c/tarea.md                                                       |  16 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/trocear.js                                       |  12 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-brainstorm.js                                   |  18 ++--
 13 files changed, 525 insertions(+), 14 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff d86aba2de84cf8b2fe12701e91e52f3d68e437d0..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/patrones-ronda-plan.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/patrones-ronda-plan.test.ts | 41 ++++++++++++++++++++++++++++++++++++-----
 1 file changed, 36 insertions(+), 5 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 151.7 s
- Commit verificado: 6d55e198878293d4966c1ee592fecef369b3909e
- Huella: 96902bcf0626faf540e1f646074e4b379bddb710
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 101341 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.419ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.7929ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.8275ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.1046ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.5115ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (3.298ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (3.5246ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.8137ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (6.4318ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (4.898ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.3476ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (1.2045ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (2004.7649ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1918.5925ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9776ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2342ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9057ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6588ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7229ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1554ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (6.009ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (11.1374ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7499ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.5112ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6815ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.1979ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (31.1295ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.3822ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.5602ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5223ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.444ms)
ℹ tests 845
ℹ suites 0
ℹ pass 843
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 139919.2347
[verificar-impacto] node --test termino con 0 en 140.0 s.
````
