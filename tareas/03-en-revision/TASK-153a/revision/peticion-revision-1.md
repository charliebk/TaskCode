# Peticion de revision — TASK-153a (ronda 1)

- Tarea: TASK-153a — plan con reutilizacion y autorrevision 4D exigida (parte a de TASK-153)
- Rama revisada: feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
- Rama base: develop
- Commit revisado (HEAD): 4e6ff7fb803c1140a5dbd26eda008730c4c63bdb
- Fecha: 2026-11-22
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-153a (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
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

- tareas/03-en-revision/TASK-153a/tarea.md
- tareas/03-en-revision/TASK-153a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
- taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/disfraz-tests.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/reutilizacion-plan.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts

## Commits a revisar (git log develop..HEAD)

````
4e6ff7f update(feature): develop -> feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
9b1961c docs(TASK-153a): autorrevision
7b1114d feat(TASK-153a): Regla 4D al planificar y en la autorrevision
20e41cb chore(TASK-153a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
index 719610a..4aca585 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
@@ -105,7 +105,7 @@ de acompañamiento.
 <3 lineas como maximo: en que consiste la propuesta>
 
 ## Piezas y limites
-- <pieza> — <se extiende | se crea nueva> — <por que>
+- <pieza> — <se extiende | se crea nueva: que parecido ya existe y por que no vale> — <por que>
 (maximo 6)
 
 ## Orden de construccion
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
index 748c510..53a0a75 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
@@ -124,6 +124,11 @@ total.** Una línea por viñeta. Sin introducción, sin resumen final.
 ## Enfoque
 <4 lineas como maximo: que se crea, que se extiende, en que orden>
 
+## Reutilizacion (Regla 4D)
+- <helper, funcion, fixture o test que ya existe> — <donde> — <para que se usa>
+- Nuevo: <pieza> — <por que no vale nada de lo que ya hay>
+(1 a 4; buscado en el repo antes de proponer nada nuevo)
+
 ## Desacuerdos resueltos
 - <tema> — <rol A: su posicion> / <rol B: su posicion> — <cual gana> — <por que>
 (0 a 6; si ningun rol discrepo de otro, escribe "ninguno, y es una alarma: <por que>")
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index bc2195c..4db6993 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -29,7 +29,8 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
    Antes de pedir revision, la Regla 4D (`task-workflow/revision.md`):
    busca el helper existente antes de crear uno, cita el criterio que motiva
    cada cambio y comprueba por mutacion cada test nuevo (rompe el codigo, ve
-   el rojo). Anotalo en `## Autorrevision` de `tarea.md`:
+   el rojo; patrones tipicos en `task-workflow/disfraz-tests.md`). Anotalo en
+   `## Autorrevision` de `tarea.md`:
    `- 4D — <commit>: helper buscado, criterios citados, N tests mutados`.
 5. El coste de la implementacion se registra solo (`task-workflow/coste.md`):
    un hook anota que sesion y que subagentes trabajan con la tarea en curso, y
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 8a5ab64..6af3e63 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -47,8 +47,7 @@ Precondiciones de cada transicion:
   `planificacion/plan-final.md` — **el contenido lo escribe un agente**, no el
   CLI — y, en `planificacion/brainstorm/`, una peticion por cada rol de
   brainstorm que resuelva la complejidad de la tarea, mas la del agente
-  unificador (con 1 solo rol no hay unificador: ver "El brainstorm de la fase
-  de diseno"). **No invoca a ningun modelo**: lanzar a esos agentes es trabajo de quien orquesta. Aborta sin
+  unificador (con 1 solo rol no hay unificador). **No invoca a ningun modelo**: lanzar a esos agentes es trabajo de quien orquesta. Aborta sin
   mover la tarea si el enunciado no esta listo (ver mas abajo).
 - **`approve`** — desde `en-diseno`, y tiene que existir un `plan-final.md`
   redactado: la plantilla sin rellenar se rechaza.
@@ -198,7 +197,7 @@ en verde, devuelve el turno con un informe. Arregla la causa; no borres,
 saltes ni debilites tests para pasarlo. Si el rojo no es tuyo, dilo:
 solo bloquea una vez por turno.
 `comando_verificacion_selectiva` y `comando_verificacion_freno`: [verificacion-selectiva.md](verificacion-selectiva.md).
-Tests por criterio y pesados: [tests-pesados.md](tests-pesados.md); poda: [poda-tests.md](poda-tests.md).
+Tests por criterio y pesados: [tests-pesados.md](tests-pesados.md); poda: [poda-tests.md](poda-tests.md); disfraz: [disfraz-tests.md](disfraz-tests.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
 `taskctl finish` verifica antes de mergear y aborta en rojo. Un merge (o el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/disfraz-tests.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/disfraz-tests.md
new file mode 100644
index 0000000..fa3ae8b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/disfraz-tests.md
@@ -0,0 +1,31 @@
+# Disfraz en tests: los patrones tipicos
+
+Un test disfrazado sigue en verde con el codigo roto: aparenta proteger algo
+y no lo protege. Es la D de disfraz de la Regla 4D (`revision.md`) y cuenta
+como IMPORTANTE. Repasa cada test nuevo con esta lista antes de pedir
+revision, y el revisor con ella al mutar.
+
+- **El nombre promete y nada lo comprueba.** «Sin efectos secundarios»,
+  «deja el workspace limpio», «antes de tocar el disco», «error claro»: si
+  el cuerpo solo mira la clase del error, falta la asercion sobre el estado
+  (`git status`, el fichero que no debe existir, el texto del mensaje).
+- **Datos que no distinguen el comportamiento.** Ordenar por numero con
+  `001, 002, 010` (sale igual en orden alfabetico), un solo elemento donde
+  importa cual se elige, nombres que no comparten prefijo, rondas por debajo
+  de 10, un fichero que ya esta ignorado. Elige datos con los que la
+  implementacion equivocada daria otro resultado.
+- **`rejects`/`throws` sin matcher.** Cualquier error lo pone en verde,
+  tambien uno que no es el que se probaba. Exige la clase Y el mensaje.
+- **Un `skip` que esconde el fallo.** Saltar cuando tarda demasiado o en un
+  sistema concreto convierte el fallo en un aviso: si el CI corre en ese
+  sistema, el test no lo protege nunca. Separa «no aplica» de «fallo».
+- **La asercion mira lo que se escribe, no lo que se lee.** Comprobar que el
+  programa imprime algo no prueba que use el valor; un `echo` de los
+  argumentos une los que llegaban separados.
+- **Bucles que no cubren el caso nuevo.** «Cualquier comando» que recorre
+  una lista escrita a mano se queda corto cuando se anade uno: deriva la
+  lista de la fuente (o compara las dos).
+
+La prueba es la mutacion: rompe a proposito la linea que el test dice
+proteger, ejecuta solo ese test y mira que se pone rojo. Anota en
+`## Autorrevision` cuantos tests mutaste.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index ddc5ae0..cc8bb90 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -89,6 +89,7 @@ cada uno en su dominio):
 - **Disfraz**: algo que aparenta resolver y no hace nada o no se comprueba.
   Ej.: un test que sigue en verde con la funcion rota (compruebalo por
   mutacion), un stub que devuelve exito, un criterio marcado sin evidencia.
+  Los patrones tipicos en tests: [disfraz-tests.md](disfraz-tests.md).
 
 Duplicacion y disfraz reales son **IMPORTANTE** como minimo; desviacion y
 diluvio, MENOR salvo que cambien comportamiento o escondan un fallo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 8a7ac9a..35f48b8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -46,7 +46,7 @@ import {
   type RolBrainstorm,
 } from '../core/roles-brainstorm.js';
 import { nombrePeticionRol } from '../core/plan-brainstorm.js';
-import { planEsEsqueleto } from '../core/validacion-tarea.js';
+import { faltaReutilizacion, planEsEsqueleto, SECCION_REUTILIZACION } from '../core/validacion-tarea.js';
 import { conProgreso, crearProgreso, type Progreso } from '../fs/progreso.js';
 import { hayCambiosFueraDeTarea } from '../fs/pendientes.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
@@ -229,6 +229,15 @@ async function runApprove(
         `La regla de una hora pide trocear las tareas de mas de ${String(UMBRAL_MINUTOS)} min de punta a punta.`
     );
   }
+  // TASK-153 (Regla 4D al crear): sin la seccion de reutilizacion, o con solo
+  // la linea de la plantilla, aviso (no bloquea: los planes viejos no se atascan).
+  if (faltaReutilizacion(await readFile(rutaPlan, 'utf8'))) {
+    avisos.push(
+      `${task.id}: el plan no dice que reutiliza (seccion "${SECCION_REUTILIZACION}" vacia o ausente). ` +
+        'La Regla 4D pide buscar en el repo los helpers, funciones y fixtures que ya existen antes de ' +
+        'crear nada nuevo, y anotarlos ahi; duplicar uno que ya existe es un hallazgo IMPORTANTE.'
+    );
+  }
   if (decididoPor === 'automatico' && superaUmbral(duracion)) {
     throw new ApproveCommandError(
       `[ERROR] ${task.id}: no se aprueba como automatico: ${describirExceso(duracion)}: ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index d2f98b0..fc586ed 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -46,7 +46,7 @@ import {
 } from '../fs/git-commit.js';
 import { resolverAsignado } from '../core/wip.js';
 import { extraerSecciones } from '../core/tarea-body.js';
-import { validarEnunciado } from '../core/validacion-tarea.js';
+import { LINEA_PLANTILLA_REUTILIZACION, SECCION_REUTILIZACION, validarEnunciado } from '../core/validacion-tarea.js';
 import { proponerParticion } from '../core/particion-tarea.js';
 import { escribirPropuestaParticion } from '../fs/particion.js';
 import {
@@ -262,6 +262,9 @@ export function planTemplate(task: Task, roles: readonly RolBrainstorm[]): strin
     // esqueleto viejo sigue contando como esqueleto.
     '\n## Enfoque propuesto\n\n' +
     `${LINEA_PLANTILLA_DURACION}\n\n\n` +
+    // TASK-153: lo que se reutiliza, buscado antes de disenar (Regla 4D). La
+    // cabecera no cuenta y la linea es de plantilla: el esqueleto sigue siendolo.
+    `${SECCION_REUTILIZACION}\n\n${LINEA_PLANTILLA_REUTILIZACION}\n\n\n` +
     seccionRoles +
     '## Riesgos aceptados y que los contiene\n\n\n' +
     // TASK-129: presupuesto de tests por criterio. Solo se ANADE una linea
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
index 2044333..399a5ad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
@@ -32,9 +32,35 @@ export function tieneAutorrevision(body: string): boolean {
   return contenido.trim() !== '';
 }
 
-/** El aviso de `review` si falta la constancia; null si esta. */
+/** Contenido de la seccion de autorrevision (sin la cabecera); null si no esta. */
+function contenidoAutorrevision(body: string): string[] | null {
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_AUTORREVISION);
+  return rango === null ? null : lineas.slice(rango[0] + 1, rango[1]);
+}
+
+/**
+ * TASK-153 (Regla 4D al crear): la linea `- 4D — <commit>: ...` de la
+ * autorrevision. Antes cualquier linea daba la constancia por buena (CONT-08
+ * de la auditoria de TASK-141), asi que la autorrevision 4D podia no hacerse
+ * sin que nada avisara. Vale con guion largo, corto o dos puntos tras «4D».
+ */
+export function tieneLinea4D(body: string): boolean {
+  const contenido = contenidoAutorrevision(body);
+  return contenido !== null && contenido.some((l) => /^\s*[-*]\s*4D\s*(?:—|–|-|:)\s*\S/.test(l));
+}
+
+/** El aviso de `review` si falta la constancia o su linea 4D; null si esta todo. */
 export function avisoAutorrevision(body: string, id: string): string | null {
-  if (tieneAutorrevision(body)) return null;
+  if (tieneAutorrevision(body)) {
+    if (tieneLinea4D(body)) return null;
+    return (
+      `${id}: la autorrevision de tarea.md no trae la linea de la Regla 4D. La revision sigue, pero antes ` +
+      'de pedirla conviene hacer la autorrevision 4D (buscar el helper que ya existe antes de crear uno, ' +
+      'citar el criterio que motiva cada cambio, mutar cada test nuevo y verlo en rojo) y anotarla en ' +
+      `"${SECCION_AUTORREVISION}": "- 4D — <commit>: helper buscado, criterios citados, N tests mutados".`
+    );
+  }
   return (
     `${id}: tarea.md no tiene la constancia de la autorrevision (seccion "${SECCION_AUTORREVISION}" con contenido). ` +
     'La revision sigue, pero antes de pedirla conviene pasar la seccion "## Que se revisa" de cada revisora ' +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
index 634ca75..19766b5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
@@ -24,6 +24,7 @@ import type { Task } from './task.js';
 import type { ResolucionAgentes } from './heuristica.js';
 import { UNIFICADOR_ID, type RolBrainstorm } from './roles-brainstorm.js';
 import { fenceFor } from './markdown.js';
+import { VINETA_PETICION_REUTILIZACION } from './validacion-tarea.js';
 
 /**
  * "1 rol" / "2 roles" / "ningun rol". Es texto que acaba en un fichero
@@ -220,6 +221,7 @@ export function peticionRedaccionTemplate(
     '\n## Que tiene que traer el plan final\n\n' +
     '- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.\n' +
     '- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.\n' +
+    VINETA_PETICION_REUTILIZACION +
     '- Riesgos aceptados y que los contiene.\n' +
     '- Plan de pruebas.\n' +
     '- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es ' +
@@ -380,6 +382,7 @@ export function peticionUnificadorTemplate(
     '\n## Que tiene que traer el plan final\n\n' +
     '- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.\n' +
     desacuerdosEnPlanFinal +
+    VINETA_PETICION_REUTILIZACION +
     '- Riesgos aceptados y que los contiene.\n' +
     '- Plan de pruebas.\n' +
     '- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es ' +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
index e1490d9..be0c74a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
@@ -15,6 +15,37 @@
  * - AVISA de lo que conviene mirar: 9 a 12 criterios y criterios sin ancla.
  */
 import type { GrupoCriterios, SeccionesTarea } from './tarea-body.js';
+import { rangoDeSeccion } from './transiciones.js';
+
+/**
+ * TASK-153 (Regla 4D al crear): el plan dice que reutiliza antes de disenar
+ * nada nuevo. La auditoria de TASK-141 encontro 102 duplicaciones: cada tarea
+ * escribia su propio lector en vez de buscar el que ya habia.
+ */
+export const SECCION_REUTILIZACION = '## Reutilizacion (Regla 4D)';
+
+/** La linea de la plantilla del plan bajo `SECCION_REUTILIZACION` (no cuenta como contenido). */
+export const LINEA_PLANTILLA_REUTILIZACION =
+  'Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; ' +
+  'y lo que se crea nuevo, con el motivo de no reutilizar:';
+
+/** Lo que piden las peticiones de redaccion y del unificador para esa seccion. */
+export const VINETA_PETICION_REUTILIZACION =
+  `- ${SECCION_REUTILIZACION.slice(3)}: lo que ya existe en el repo y se va a usar (helpers, ` +
+  'funciones, fixtures, tests), buscado ANTES de proponer nada nuevo; y lo que se crea nuevo, con el ' +
+  'motivo de no reutilizar lo que hay. Duplicar un helper que ya existe es un hallazgo IMPORTANTE.\n';
+
+/** ¿Le falta al plan la seccion de reutilizacion, o la trae sin mas que la linea de la plantilla? */
+export function faltaReutilizacion(plan: string): boolean {
+  const lineas = plan.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_REUTILIZACION);
+  if (rango === null) return true;
+  const contenido = lineas
+    .slice(rango[0] + 1, rango[1])
+    .map((l) => l.trim())
+    .filter((l) => l !== '' && l !== LINEA_PLANTILLA_REUTILIZACION && !/^<!--.*-->$/.test(l));
+  return contenido.length === 0;
+}
 
 export const MAX_CRITERIOS = 12;
 export const AVISO_CRITERIOS = 8;
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-153a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153a/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153a/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153a/tarea.md                                                       |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                     |  9 ++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                        |  5 ++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/autorrevision.js                                   | 28 +++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-brainstorm.js                                 |  3 +++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/validacion-tarea.js                                | 26 ++++++++++++++++++++++++++
 14 files changed, 73 insertions(+), 6 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/reutilizacion-plan.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/reutilizacion-plan.test.ts | 65 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts          | 26 +++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts              |  1 +
 3 files changed, 89 insertions(+), 3 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 148.3 s
- Commit verificado: 4e6ff7fb803c1140a5dbd26eda008730c4c63bdb
- Huella: 3a47b32bd329d5bd05ef171180e717c4d04f6827
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 102541 bytes en total):

````
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1683.4143ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1784.1217ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.932ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2434ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8886ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6301ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6762ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0978ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (5.8817ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.2123ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.5937ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.8737ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6884ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.1983ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (63.0353ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.7082ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4634ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4707ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.388ms)
✔ el catalogo sigue teniendo 4 revisoras de dominio y la generica (ninguna se cae al tocar sus SKILL.md) (42.2805ms)
✔ cada revisora tiene exactamente una seccion "## Que se revisa", con contenido (98.9684ms)
✔ la skill review manda la autorrevision: remite a "## Que se revisa", al campo revisores y a la constancia (24.1793ms)
✔ la ruta relativa que da la skill review llega a la SKILL.md de cada revisora (27.2107ms)
✔ la skill review no copia ninguna linea de las listas: viven solo en cada revisora (80.5883ms)
✔ topes: cada .md de skills/ y agents/ tiene tope en la tabla y cabe en el (64.5156ms)
✔ topes: el total de skills/ + agents/ cabe en su tope (39.4372ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (5.4279ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (1.0992ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.4015ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.3615ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (2.1412ms)
ℹ tests 868
ℹ suites 0
ℹ pass 866
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 137386.0407
[verificar-impacto] node --test termino con 0 en 137.5 s.
````
