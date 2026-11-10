# Peticion de revision — TASK-095 (ronda 1)

- Tarea: TASK-095 — Revision que converge: desde la ronda 2 solo se verifican las correcciones
- Rama revisada: feature/task-095-revision-que-converge-desde-la-ronda-2-s
- Rama base: develop
- Commit revisado (HEAD): 296cff1cea3e39ae73515bb891cf4a8ebd8278a1
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-095 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
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

- tareas/03-en-revision/TASK-095/tarea.md
- tareas/03-en-revision/TASK-095/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts

## Commits a revisar (git log develop..HEAD)

````
296cff1 docs(TASK-095): autorrevision
e7d738e feat(TASK-095): la revision converge, desde la ronda 2 solo se verifican las correcciones
fa18c8e chore(TASK-095): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index e6c174d..939e6d1 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -6,6 +6,34 @@
 
 ## 0.14.0 — sin publicar
 
+Revision que converge (TASK-095). Corrige la regla de alcance de la 0.12
+(TASK-083), que exigia que la ronda anterior dejara solo MENORES: un CRITICO o
+IMPORTANTE en cualquier estado, tambien `corregido`, obligaba a una ronda
+completa desde la base, y como los revisores vuelven a listar lo ya
+corregido, cada ronda relanzaba una revision entera que encontraba otra tanda
+(medido en 147 tareas de dos proyectos: hasta 14 rondas en una tarea;
+`docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md`). Principio: el coste de
+revisar crece con la correccion, no con el proyecto. Desde la ronda 2 la ronda
+es una verificacion acotada aunque queden CRITICOS o IMPORTANTES: revisan los
+revisores con hallazgos pendientes (todo lo que no esta `aceptado`, tambien lo
+`corregido`), cada uno los suyos, y los de dominio cuyos ficheros toca la
+correccion, todos con el diff entero de la correccion; solo se abre un
+hallazgo nuevo si es CRITICO o lo introduce la correccion. Un merge de la base
+entre rondas ya no la hace completa: se nombra y su codigo va en el diff.
+Sigue siendo completa con `--completa` (ahora siempre desde la base), sin
+commit revisado fiable, o si un informe anterior no se puede leer. Entre
+rondas se corrige todo (el MENOR que no compense se acepta con motivo o pasa a
+otra tarea) y `review` avisa de lo que quede sin marcar. Tope: tras la ronda 3
+con cambios, `siguiente` pregunta en cualquier modo (antes manual y
+semiautomatico se detenian) y `review` no abre la ronda 4 sin el flag nuevo
+`--ronda-extra`, que solo se pasa si lo decide una persona. Se quita el aviso
+de `veredicto` con solo MENORES. No se retira ningun revisor.
+
+Cambios de comportamiento: una ronda acotada puede llevar varias peticiones
+con sufijo de revisor (antes una sola, del generico); la ronda siguiente lista
+tambien los hallazgos `corregido` para verificarlos; `siguiente --json` en el
+tope da `preguntar` y el comando lleva `--ronda-extra`.
+
 Sincronizacion de un fichero suelto en la raiz de `tareas/` (TASK-092).
 `rutas_sincronizacion` admite ahora un fichero directamente en `tareas/` (p. ej.
 `tareas/ROADMAP.md`), que se regenera en cada transicion dentro del mismo commit
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index e5b34cf..285aa7a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -67,22 +67,38 @@ En una ronda de verificación (la 2 o posterior), la petición añade la línea
 
 En cualquier otro caso, el revisor usa el modelo de la tarea.
 
-Además, la ronda de verificación puede ser **acotada**. La petición lo dice
-en la línea `- Alcance:`, con su motivo, y lo dice también la salida de
-`taskctl review`. Una ronda acotada tiene un solo revisor (el genérico), no
-se fragmenta por dominio y lleva instrucciones de verificación: comprobar
-cada hallazgo, ejecutar la suite y buscar el fallo que abre la corrección.
-Solo es acotada si se cumple todo esto:
-- la ronda anterior pidió cambios y en todos sus informes solo hay MENOR;
-- el diff sale del commit revisado en la ronda anterior;
-- el diff no trae merges;
-- el diff solo toca ficheros que nombra algún hallazgo en su columna
-  `Fichero`.
-
-Un CRÍTICO o IMPORTANTE en cualquier estado obliga a la ronda completa, y la
-ronda completa que sigue a una acotada revisa desde la rama base.
-`taskctl review TASK-NNN --completa` la fuerza. `taskctl veredicto` avisa,
-sin bloquear, si se piden cambios con una tabla que solo tiene MENORES.
+**La revisión converge.** El coste de revisar crece con el tamaño de la
+corrección, no con el del proyecto. Desde la ronda 2, la ronda es una
+verificación **acotada** (la línea `- Alcance:` de la petición y la salida
+de `taskctl review` lo dicen, con su motivo), también si la ronda anterior
+dejó CRÍTICOS o IMPORTANTES:
+- revisan los revisores que tienen hallazgos pendientes (todo lo que no está
+  `aceptado`; lo `corregido` también se verifica), cada uno los suyos, y los
+  de dominio cuyos ficheros toca la corrección; todos reciben el diff entero
+  de la corrección;
+- cada revisor comprueba sus hallazgos, ejecuta la suite y busca el fallo
+  que abre la corrección, y solo abre un hallazgo nuevo si es CRÍTICO o lo
+  introduce la propia corrección;
+- un merge de la base entre rondas no la cambia: se nombra en el motivo y lo
+  que entra con él va en el diff.
+
+Es completa solo con `taskctl review TASK-NNN --completa` (desde la rama
+base), sin commit revisado fiable, o si un informe de la ronda anterior no se
+puede leer (sin tabla, plantilla sin rellenar, severidad desconocida o
+cambios pedidos sin ningún hallazgo). Una completa que sigue a una acotada
+revisa desde la rama base.
+
+Entre una ronda y otra se corrige **todo** lo de la ronda: los CRÍTICO e
+IMPORTANTE siempre; el MENOR que no compense se marca `aceptado` con su
+motivo o pasa a una tarea nueva. `taskctl review` avisa si se abre una ronda
+con hallazgos de la anterior sin marcar. Tras la ronda 3 con cambios,
+`taskctl siguiente` pregunta en cualquier modo y `taskctl review` no abre la
+ronda 4 sin `--ronda-extra`, que se pasa solo cuando lo decide una persona.
+
+El motivo, medido: con la regla anterior (0.12), un IMPORTANTE en cualquier
+estado, también corregido, obligaba a una ronda completa; los revisores
+vuelven a listar los corregidos, así que cada ronda relanzaba una revisión
+entera que encontraba otra tanda (hasta 14 rondas en una tarea).
 
 ## Roles del brainstorm de diseño
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index da556e1..a7a620d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -76,13 +76,26 @@ punto, no un formalismo.
    Si la ronda esta fragmentada, uno por informe, con el nombre de fichero
    completo: `--informe informe-revision-N-<revisor>.md`. Con CRITICO o
    IMPORTANTE abiertos, `cambios-solicitados`: se corrigen, se commitea, y se
-   vuelve a esta skill (abre la ronda siguiente). En modo automatico, si
-   `siguiente` da `fase: review` con `accion: continuar` tras los cambios,
-   corrige tu los CRITICO e IMPORTANTE del informe (y los MENOR baratos),
-   commitea, deja la suite en verde y vuelve al paso 2. Desde la ronda 3,
-   `siguiente` pregunta: otra ronda la decide una persona, y un «si» quiere
-   decir corregir primero y despues abrir la ronda, nunca relanzarla sobre el
-   mismo codigo.
+   vuelve a esta skill (abre la ronda siguiente).
+   **Antes de abrir la ronda siguiente se corrige TODO lo de la ronda**, en
+   cualquier modo: los CRITICO e IMPORTANTE siempre; un MENOR que no compense
+   corregir se marca `aceptado` con su motivo en su informe o se pasa a una
+   tarea nueva. Nunca se deja nada para la ronda siguiente: corregir de uno en
+   uno es lo que convierte trece hallazgos en trece rondas. Lo corregido se
+   marca `corregido` en la columna Estado de su informe (commit aparte del
+   codigo). `taskctl review` avisa si queda alguno sin marcar. En modo
+   automatico, si `siguiente` da `fase: review` con `accion: continuar`, haz tu
+   todo eso, commitea, deja la suite en verde y vuelve al paso 2. Desde la
+   ronda 2 la ronda es una verificacion acotada: cada revisor comprueba sus
+   hallazgos pendientes y el diff de la correccion, y solo abre uno nuevo si
+   es CRITICO o lo introduce la correccion.
+   **Tope**: tras la ronda 3 con cambios, `siguiente` pregunta en cualquier
+   modo. Lo decide una persona: aceptar lo abierto (sus IDs y el motivo en el
+   `## Resultado`) y cerrar, pasarlo a una tarea nueva, o corregir y abrir
+   otra ronda con `taskctl review TASK-NNN --ronda-extra`. Pasa ese flag solo
+   cuando la persona lo diga: sin el, `review` no abre la ronda 4. Un «si»
+   quiere decir corregir primero y despues abrir la ronda, nunca relanzarla
+   sobre el mismo codigo.
    En automatico, `aprobada-con-correcciones` no se corrige despues: el codigo
    que se mergea tiene que ser el revisado (`finish` pregunta si cambia). Los
    MENOR que merezca la pena corregir se piden como `cambios-solicitados`; el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 26850c9..6f2c74b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -78,6 +78,13 @@ diciendo que toca hacer ese trabajo, commitearlo y despues
 `/taskcode-plugin:review TASK-NNN`. En `automatico` devuelve `continuar`: el
 trabajo lo hace la skill (`start` implementa, `review` corrige) y sigue.
 
+Excepcion: tras la ronda 3 con cambios (el tope de rondas), `siguiente`
+devuelve `preguntar` en **cualquier** modo, y su `motivo` nombra las salidas:
+aceptar lo abierto (IDs y motivo en el `## Resultado`) y cerrar, pasarlo a una
+tarea nueva, o corregir y abrir otra ronda con `taskctl review TASK-NNN
+--ronda-extra`. Ese flag solo se pasa si la persona dice que si; sin el,
+`review` no abre la ronda 4.
+
 En `automatico`, `siguiente` solo pregunta en sus guardas: aprobar una tarea
 sin modo congelado, cerrar hotfix o release, cerrar cuando lo que se
 mergearia no coincide con lo revisado (codigo posterior al `Commit revisado`
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index 907151c..d9888f5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -85,21 +85,35 @@ y comprueba **cada uno de esos hallazgos**: las correcciones son justo donde
 se cuelan los fallos nuevos. El revisor corre la suite completa una vez por
 ronda; los mutantes, con el fichero de test concreto.
 
-**Verificacion acotada.** Si la ronda anterior pidio cambios y en **todos**
-sus informes solo hay MENOR, `taskctl review` genera la ronda siguiente como
-verificacion acotada: un solo revisor (el generico), sin fragmentar por
-dominio, con la linea `- Alcance: verificacion acotada al diff de las
-correcciones` y sus propias instrucciones. Se verifica cada hallazgo, se
-ejecuta la suite y se busca el fallo que abre la correccion; no se vuelve a
-revisar la rama entera. Es **siempre completa** (`- Alcance: completa`, con
-su motivo) si: hay un CRITICO o IMPORTANTE en la ronda anterior **en
-cualquier estado**, tambien `corregido` o `aceptado`; algun informe no tiene
-tabla legible, sigue siendo la plantilla o trae una severidad fuera del
-vocabulario; no hay diff de correcciones (el commit anterior ya no existe);
-el delta trae un merge; o el delta toca un fichero que no nombraba ningun
-hallazgo (columna `Fichero`). Tras una acotada, una ronda completa revisa
-desde la rama base. `taskctl review TASK-NNN --completa` la fuerza de
-antemano.
+**Verificacion acotada: la revision converge.** El coste de revisar tiene que
+crecer con el tamano de la correccion, no con el del proyecto. Desde la ronda
+2, `taskctl review` genera la ronda como verificacion acotada, con la linea
+`- Alcance: verificacion acotada al diff de las correcciones`, tambien si la
+ronda anterior dejo CRITICOS o IMPORTANTES. Revisan los revisores que tienen
+hallazgos pendientes (todo lo que no esta `aceptado`, tambien lo `corregido`:
+la correccion es justo lo que se verifica), cada uno los suyos, y los de
+dominio cuyos ficheros toca la correccion; todos con el diff entero de la
+correccion. Se verifica cada hallazgo, se ejecuta la suite y se busca el
+fallo que abre la correccion, y solo se abre un hallazgo nuevo si es CRITICO
+o lo introduce la propia correccion; no se vuelve a revisar la rama entera.
+Un merge de la base entre rondas no la cambia: se nombra en el motivo y lo
+que entra va en el diff. Es **completa** (`- Alcance: completa`, con su
+motivo) solo si: se pide `taskctl review TASK-NNN --completa` (desde la rama
+base); algun informe no tiene tabla legible, sigue siendo la plantilla, trae
+una severidad fuera del vocabulario o pide cambios sin anotar ningun
+hallazgo; o no hay commit revisado fiable (el diff va desde la base). Tras
+una acotada, una ronda completa revisa desde la rama base.
+
+**Entre una ronda y otra se corrige todo**: los CRITICO e IMPORTANTE
+siempre; el MENOR que no compense se marca `aceptado` con su motivo o pasa a
+una tarea nueva. `taskctl review` avisa si se abre una ronda con hallazgos
+de la anterior sin marcar `corregido` ni `aceptado`.
+
+**Tope de rondas.** Tras la ronda 3 con cambios, `siguiente` pregunta en
+cualquier modo, y `taskctl review` no abre la ronda 4 sin `--ronda-extra`,
+que solo se pasa cuando lo decide una persona. Las salidas: aceptar lo
+abierto (IDs y motivo en el `## Resultado`) y cerrar, pasarlo a una tarea
+nueva, o corregir y abrir otra ronda.
 
 ## El informe
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 6068d7b..2f0c695 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -80,7 +80,7 @@ Uso:
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--decidido-por persona|automatico] [--push]
-  taskctl review TASK-NNN [--completa] [--push]
+  taskctl review TASK-NNN [--completa] [--ronda-extra] [--push]
   taskctl codex-review TASK-NNN [--push]
   taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
                     [--informe <nombre>] [--push]
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 615c617..72b3325 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -37,12 +37,19 @@ import { verificarConMemo, type VerificacionConMemo } from '../fs/verificacion.j
 import { registrarTransicion } from '../core/transiciones.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
-import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
+import {
+  INFORME_REVISION_RE,
+  PETICION_REVISION_RE,
+  informesDeUltimaRonda,
+  rondaYRevisorDeInforme,
+  siguienteRonda,
+} from '../fs/rondas.js';
+import { TOPE_RONDAS } from '../core/flujo.js';
 import {
   alcanceRondaSiguiente,
   commitRevisadoDe,
-  ficheroNombrado,
   hallazgosNoCerrados,
+  hallazgosPendientes,
   veredictoDeRonda,
   type AlcanceRonda,
   type VeredictoInforme,
@@ -76,8 +83,12 @@ import { modeloDeVerificacion } from '../core/modelo-revision.js';
 
 export class ReviewCommandError extends Error {}
 
-/** Flags de `taskctl review`: los de extraerPushFlag y `--completa` (TASK-083). */
-export const FLAGS_REVIEW: readonly string[] = ['--push', '-p', '--completa'];
+/**
+ * Flags de `taskctl review`: los de extraerPushFlag, `--completa` (TASK-083) y
+ * `--ronda-extra` (TASK-095: abrir una ronda pasado el tope, solo si lo decide
+ * una persona).
+ */
+export const FLAGS_REVIEW: readonly string[] = ['--push', '-p', '--completa', '--ronda-extra'];
 
 /** TASK-083: la cabecera que marca una peticion de verificacion acotada (la lee la ronda siguiente). */
 const ALCANCE_ACOTADA = 'verificacion acotada al diff de las correcciones';
@@ -164,10 +175,10 @@ export interface ReviewCommandResult {
    */
   modeloRonda?: string;
   /**
-   * TASK-083: `acotada` si esta ronda es una verificacion acotada al diff de
-   * las correcciones (un solo revisor, el generico, con instrucciones de
-   * verificacion); `completa` en cualquier otro caso. Va escrito, con su
-   * motivo, en la linea `- Alcance:` de la peticion.
+   * TASK-083/095: `acotada` si esta ronda es una verificacion acotada al diff
+   * de las correcciones (cada revisor con pendientes, mas los dominios que
+   * toca la correccion, con instrucciones de verificacion); `completa` en
+   * cualquier otro caso. Va escrito, con su motivo, en la linea `- Alcance:`.
    */
   alcance: 'completa' | 'acotada';
   motivoAlcance: string;
@@ -284,28 +295,40 @@ function instruccionesCompletas(nombreInforme: string): string {
 }
 
 /**
- * TASK-083: la ronda anterior solo dejo MENORES y el delta solo toca sus
- * ficheros. No basta con tachar la lista: la correccion de un MENOR puede meter
- * un IMPORTANTE nuevo (se vio en un proyecto real, y se encontro ejecutando),
- * asi que se siguen exigiendo los tests y la busqueda de fallos en el delta.
+ * TASK-095: frase que limita los hallazgos nuevos de una verificacion acotada.
+ * Exportada para que los tests comprueben su presencia sin copiar el texto.
+ */
+export const REGLA_HALLAZGOS_NUEVOS =
+  'Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion\n' +
+  '(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como\n' +
+  'nota al final del informe, no en la tabla: no abre otra ronda.';
+
+/**
+ * TASK-095: desde la ronda 2 la ronda verifica las correcciones, tambien si la
+ * anterior dejo CRITICOS o IMPORTANTES (antes, TASK-083, solo con MENORES). No
+ * basta con tachar la lista: la correccion puede abrir un fallo nuevo, asi que
+ * se siguen exigiendo los tests y la busqueda de fallos en el delta.
  */
 function instruccionesAcotadas(nombreInforme: string): string {
   return (
     '## Instrucciones para el agente revisor (verificacion acotada)\n\n' +
     'Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una\n' +
-    'revision completa y la ronda anterior solo dejo hallazgos MENORES: esta ronda\n' +
-    'verifica sus correcciones, no vuelve a revisar la rama entera. Haz esto, y\n' +
-    'nada mas:\n\n' +
-    '1. Comprueba, uno por uno, que cada hallazgo de la tabla de abajo queda resuelto\n' +
-    '   por el diff de esta ronda, o que se justifica por que no.\n' +
+    'revision completa: esta ronda verifica las correcciones de la ronda anterior,\n' +
+    'no vuelve a revisar la rama entera. Haz esto, y nada mas:\n\n' +
+    '1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo\n' +
+    '   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:\n' +
+    '   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el\n' +
+    '   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la\n' +
+    '   causa no esta en el diff.\n' +
     '2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit\n' +
     '   revisado y di el resultado: verificar sin ejecutar no vale.\n' +
     '3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo\n' +
-    '   donde se cuelan los IMPORTANTES nuevos. Si encuentras uno, construye el caso\n' +
-    '   que lo rompe antes de reportarlo.\n\n' +
-    `${CLASIFICACION} Un CRITICO o IMPORTANTE nuevo obliga a que la ronda\n` +
-    'siguiente sea completa (lo decide taskctl). Vuelca tu salida en el informe de\n' +
-    `esta ronda (${nombreInforme}), sin borrar la peticion.\n\n`
+    '   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que\n' +
+    '   lo rompe antes de reportarlo.\n\n' +
+    `${REGLA_HALLAZGOS_NUEVOS}\n\n` +
+    `${CLASIFICACION} En la tabla, cada hallazgo pendiente que ya este\n` +
+    'resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el\n' +
+    `informe de esta ronda (${nombreInforme}), sin borrar la peticion.\n\n`
   );
 }
 
@@ -354,8 +377,15 @@ interface RondaPrevia {
   veredicto: VeredictoInforme;
   /** Commit revisado en la ronda N, o null si ninguna peticion lo dice. */
   commit: string | null;
-  /** Seccion de la peticion con los hallazgos que siguen abiertos. */
+  /** Seccion de la peticion con todos los hallazgos pendientes (ronda completa). */
   seccion: string;
+  /**
+   * TASK-095: seccion por revisor ('' = el generico, sin sufijo) con SUS
+   * hallazgos pendientes, para la ronda acotada.
+   */
+  seccionesPorRevisor: Map<string, string>;
+  /** TASK-095: hallazgos de la ronda N que no estan `corregido` ni `aceptado`. */
+  sinMarcar: string[];
   /** TASK-081 y TASK-083: lo que los informes de la ronda N permiten para la N+1. */
   alcance: AlcanceRonda;
   /** TASK-083: la ronda N fue una verificacion acotada (su peticion lo dice). */
@@ -365,6 +395,27 @@ interface RondaPrevia {
 /** Vive en core/informe-revision.ts desde TASK-083; se reexporta para quien la importe de aqui. */
 export { modeloBaratoPermitido } from '../core/informe-revision.js';
 
+/** Tabla de pendientes de una ronda, con la nota de los informes ilegibles. */
+function seccionPendientes(ronda: number, filas: readonly string[], sinTabla: readonly string[]): string {
+  let seccion =
+    `## Hallazgos de la ronda ${String(ronda)} pendientes de verificar\n\n` +
+    'Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la\n' +
+    'correccion no abre otro fallo: es justo donde se cuelan.\n\n';
+  if (filas.length > 0) {
+    seccion += '| ID | Severidad | Estado | Fichero | Informe |\n|---|---|---|---|---|\n' + filas.join('\n') + '\n';
+  } else if (sinTabla.length === 0) {
+    seccion += `0 hallazgos pendientes en la tabla de la ronda ${String(ronda)}.\n`;
+  }
+  if (sinTabla.length > 0) {
+    // Una tabla ausente NO es "0 abiertos": los informes anteriores a la
+    // tabla, o escritos a mano, hay que leerlos enteros.
+    seccion +=
+      `\nTabla de hallazgos ausente o ilegible en: ${sinTabla.join(', ')}. ` +
+      'Lee esos informes enteros.\n';
+  }
+  return seccion + '\n';
+}
+
 async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
   const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
   const textos = await Promise.all(
@@ -379,39 +430,40 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
     commit ??= commitRevisadoDe(texto);
   }
 
+  // TASK-095: pendiente = todo lo que no esta `aceptado` (tambien lo
+  // `corregido`, que es justo lo que hay que verificar), agrupado por el
+  // revisor que lo encontro (el sufijo del informe; '' sin fragmentar).
   const filas: string[] = [];
   const sinTabla: string[] = [];
+  const sinMarcar: string[] = [];
+  const porRevisor = new Map<string, string[]>();
   for (const { nombre, texto } of textos) {
-    const lectura = hallazgosNoCerrados(texto);
+    const revisor = rondaYRevisorDeInforme(nombre)?.revisor ?? '';
+    const lectura = hallazgosPendientes(texto);
     if (!lectura.tabla) {
       sinTabla.push(nombre);
       continue;
     }
+    for (const h of hallazgosNoCerrados(texto).abiertos) sinMarcar.push(`${h.id} (${nombre})`);
+    const propias = porRevisor.get(revisor) ?? [];
     for (const h of lectura.abiertos) {
-      filas.push(`| ${h.id} | ${h.severidad} | ${h.estado} | ${h.fichero} | ${nombre} |`);
+      const fila = `| ${h.id} | ${h.severidad} | ${h.estado} | ${h.fichero} | ${nombre} |`;
+      filas.push(fila);
+      propias.push(fila);
     }
+    porRevisor.set(revisor, propias);
   }
-  let seccion =
-    `## Hallazgos de la ronda ${informes.ronda} que siguen abiertos\n\n` +
-    'Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la\n' +
-    'correccion no abre otro fallo: es justo donde se cuelan.\n\n';
-  if (filas.length > 0) {
-    seccion += '| ID | Severidad | Estado | Fichero | Informe |\n|---|---|---|---|---|\n' + filas.join('\n') + '\n';
-  } else if (sinTabla.length === 0) {
-    seccion += '0 hallazgos abiertos en la tabla de la ronda anterior.\n';
-  }
-  if (sinTabla.length > 0) {
-    // Una tabla ausente NO es "0 abiertos": los informes anteriores a la
-    // tabla, o escritos a mano, hay que leerlos enteros.
-    seccion +=
-      `\nTabla de hallazgos ausente o ilegible en: ${sinTabla.join(', ')}. ` +
-      'Lee esos informes enteros.\n';
+  const seccionesPorRevisor = new Map<string, string>();
+  for (const [revisor, propias] of porRevisor) {
+    if (propias.length > 0) seccionesPorRevisor.set(revisor, seccionPendientes(informes.ronda, propias, []));
   }
   return {
     ronda: informes.ronda,
     veredicto: veredictoDeRonda(textos.map((t) => t.texto)),
     commit,
-    seccion: seccion + '\n',
+    seccion: seccionPendientes(informes.ronda, filas, sinTabla),
+    seccionesPorRevisor,
+    sinMarcar,
     alcance: alcanceRondaSiguiente(textos.map((t) => t.texto)),
     fueAcotada,
   };
@@ -476,6 +528,40 @@ export function informeTemplate(task: Task, commitRevisado: string, ronda: numbe
   );
 }
 
+/**
+ * TASK-095: grupos de una verificacion acotada. Un grupo por revisor con
+ * hallazgos pendientes (el sufijo '' es el generico) y por cada dominio cuyos
+ * ficheros toca el delta; todos reciben el delta entero (no filtrado: la
+ * correccion de un hallazgo de dominio puede tocar un llamante de otro).
+ */
+function planDeVerificacion(
+  previa: RondaPrevia,
+  delta: readonly string[],
+  catalogo: ReturnType<typeof cargarCatalogoRevisores>,
+  generico: string
+): { fragmentado: boolean; grupos: { revisor: string; ficheros: readonly string[] }[] } {
+  const revisores: string[] = [];
+  const anadir = (r: string): void => {
+    if (!revisores.includes(r)) revisores.push(r);
+  };
+  for (const r of previa.seccionesPorRevisor.keys()) anadir(r === '' ? generico : r);
+  for (const g of clasificarPorDominio(delta, catalogo).grupos) {
+    if (g.revisor !== generico) anadir(g.revisor);
+  }
+  if (revisores.length === 0) anadir(generico);
+  return { fragmentado: false, grupos: revisores.map((revisor) => ({ revisor, ficheros: delta })) };
+}
+
+/** TASK-095: seccion de un revisor sin pendientes propios en la ronda acotada. */
+function seccionSinPendientes(ronda: number): string {
+  return (
+    `## Hallazgos de la ronda ${String(ronda)} pendientes de verificar\n\n` +
+    'No tienes hallazgos pendientes propios: recibes esta ronda porque la correccion\n' +
+    'toca ficheros de tu dominio. Revisa en el diff de esta ronda lo que la correccion\n' +
+    'cambia en tu terreno y si abre un fallo.\n\n'
+  );
+}
+
 /** isAncestor sin lanzar: un SHA que ya no existe (gc) no es antepasado. */
 function esAntepasado(sha: string, cwd: string): boolean {
   try {
@@ -495,7 +581,8 @@ export async function runReviewCommand(
   rechazarFlagsDesconocidos(argv, FLAGS_REVIEW, 'review', (m) => new ReviewCommandError(m));
   const { push, resto: sinPush } = extraerPushFlag(argv);
   const completaPedida = sinPush.includes('--completa');
-  const resto = sinPush.filter((a) => a !== '--completa');
+  const rondaExtra = sinPush.includes('--ronda-extra');
+  const resto = sinPush.filter((a) => a !== '--completa' && a !== '--ronda-extra');
   const id = resto[0];
   if (id === undefined || id.trim() === '') {
     throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
@@ -516,6 +603,18 @@ export async function runReviewCommand(
     ctx.veredictoRondaAnterior = previa.veredicto;
   }
   assertTransitionAllowed('review', initial ? initial.task : null, ctx);
+  // TASK-095: el tope de rondas lo aplica tambien review, no solo siguiente:
+  // llamar a review sin pasar por siguiente abria rondas sin limite (una tarea
+  // llego a 14). Pasado el tope, otra ronda solo con --ronda-extra, que la
+  // skill pasa unicamente cuando una persona lo decide. Antes de tocar nada.
+  if (previa !== null && previa.ronda >= TOPE_RONDAS && !rondaExtra) {
+    throw new ReviewCommandError(
+      `[ERROR] ${id}: la ronda ${String(previa.ronda)} ya es el tope de rondas (${String(TOPE_RONDAS)}). ` +
+        'Lo decide una persona: aceptar lo que queda abierto (sus IDs y el motivo en el Resultado) y ' +
+        'cerrar, pasarlo a una tarea nueva, o corregir y abrir otra ronda con ' +
+        `"taskctl review ${id} --ronda-extra".`
+    );
+  }
   const tipo = initial!.task.tipo;
   const rama = initial!.task.rama;
 
@@ -589,6 +688,19 @@ export async function runReviewCommand(
   // avisoAutorrevision es pura y nunca lanza.
   const sinAutorrevision = avisoAutorrevision(body, id);
   if (sinAutorrevision !== null) avisos.push(sinAutorrevision);
+  // TASK-095: entre ronda y ronda se corrige TODO lo de la ronda anterior; lo
+  // que no compense (un MENOR) se marca `aceptado` con su motivo o pasa a una
+  // tarea nueva. Dejarlo para la ronda siguiente es lo que alargaba el ciclo.
+  // Aviso, sin bloquear: la ronda la puede abrir igual.
+  if (previa !== null && previa.sinMarcar.length > 0) {
+    const lista = previa.sinMarcar.slice(0, 8).join(', ');
+    const resto = previa.sinMarcar.length > 8 ? ` (y ${String(previa.sinMarcar.length - 8)} mas)` : '';
+    avisos.push(
+      `${id}: la ronda ${String(previa.ronda)} tiene hallazgos sin marcar como corregido ni aceptado: ${lista}${resto}. ` +
+        'Corrigelos todos antes de abrir la ronda; el MENOR que no compense, marcalo aceptado con su ' +
+        'motivo en su informe o pasalo a una tarea nueva.'
+    );
+  }
   let desde = baseBranch;
   if (incremental && previa !== null) {
     const valido = previa.commit !== null && esAntepasado(previa.commit, deps.repoCwd);
@@ -608,27 +720,31 @@ export async function runReviewCommand(
   const excluir = excluirDeRevision(configRama.excluir_de_revision);
   let paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
 
-  // TASK-083: alcance de la ronda. Acotada solo si los informes de la ronda
-  // anterior lo permiten (alcanceRondaSiguiente, fail-closed) Y ademas: no se
-  // pidio --completa, hay diff de correcciones (no se cayo a la base), el delta
-  // no trae merges (codigo ajeno sin revisar) y solo toca ficheros que algun
-  // hallazgo nombraba (decision de la persona). Antes de escribir nada: es
-  // funcion pura de lo commiteado, y un reintento da el mismo alcance.
+  // TASK-095: alcance de la ronda. Desde la ronda 2 es una verificacion
+  // acotada, tambien con CRITICOS o IMPORTANTES en la anterior (antes, TASK-083,
+  // solo con MENORES: no se cumplia nunca). Completa solo si: se pide
+  // --completa (siempre desde la base), los informes no lo permiten (las guardas
+  // fail-closed de alcanceRondaSiguiente) o no hay commit revisado fiable (el
+  // diff ya va desde la base). Un merge entre rondas no la hace completa: se
+  // nombra (decision de la persona). Antes de escribir nada.
   let acotada = false;
   let motivoAlcance = 'primera ronda de revision';
   if (incremental && previa !== null) {
-    const fuera = paraRevision.incluidos.filter((f) => !ficheroNombrado(f, previa!.alcance.ficherosNombrados));
-    if (completaPedida) motivoAlcance = 'pedida con --completa';
-    else if (!previa.alcance.acotada) motivoAlcance = previa.alcance.motivo;
-    else if (desde === baseBranch) motivoAlcance = 'no hay diff de correcciones: el diff va desde la rama base';
-    else if (hayMergesEntre(desde, 'HEAD', deps.repoCwd)) motivoAlcance = `hay commits de merge entre ${desde} y HEAD`;
-    else if (fuera.length > 0) {
-      // Cinco bastan para el motivo: es una linea de cabecera, no la lista.
-      const resto = fuera.length > 5 ? ` (y ${fuera.length - 5} mas)` : '';
-      motivoAlcance = `el diff toca ficheros que ningun hallazgo nombraba: ${fuera.slice(0, 5).join(', ')}${resto}`;
-    } else {
+    if (completaPedida) {
+      motivoAlcance = 'pedida con --completa';
+      if (desde !== baseBranch) {
+        motivoAlcance += `; el diff va desde "${baseBranch}"`;
+        desde = baseBranch;
+        paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
+      }
+    } else if (!previa.alcance.acotada) motivoAlcance = previa.alcance.motivo;
+    else if (desde === baseBranch) motivoAlcance = 'no hay commit revisado fiable: el diff va desde la rama base';
+    else {
       acotada = true;
-      motivoAlcance = `${previa.alcance.motivo} y el diff solo toca sus ficheros`;
+      motivoAlcance = previa.alcance.motivo;
+      if (hayMergesEntre(desde, 'HEAD', deps.repoCwd)) {
+        motivoAlcance += `; hay commits de merge entre ${desde} y HEAD: lo que entra con ellos va en el diff y tambien se revisa`;
+      }
     }
     // Una ronda completa tras una acotada revisa desde la base: el delta de
     // la acotada nunca tuvo revision completa (punto 3 del plan de TASK-083).
@@ -674,11 +790,17 @@ export async function runReviewCommand(
   // (correccion del rol de arquitectura, TASK-034).
   const ficherosTocados = paraRevision.incluidos;
   const catalogoRevisores = cargarCatalogoRevisores();
-  // TASK-083: la verificacion acotada no se fragmenta: un solo revisor, el
-  // generico, con todo el delta y los nombres de siempre (sin sufijo).
+  // TASK-095: en la verificacion acotada revisa cada revisor que tiene algo
+  // pendiente (el de dominio verifica lo suyo, no el generico en su lugar) y
+  // cada dominio cuyo terreno toca la correccion; todos con el delta entero.
+  // Sin nadie, el generico. El coste crece con la correccion, no con el repo.
+  const generico = catalogoRevisores.generico.nombre;
   const plan = acotada
-    ? { fragmentado: false, grupos: [{ revisor: catalogoRevisores.generico.nombre, ficheros: ficherosTocados }] }
+    ? planDeVerificacion(previa!, ficherosTocados, catalogoRevisores, generico)
     : clasificarPorDominio(ficherosTocados, catalogoRevisores);
+  // Con sufijo si hay mas de un grupo o el unico no es el generico: las
+  // metricas sacan el revisor del nombre del informe.
+  const conSufijo = plan.fragmentado || plan.grupos.length > 1 || plan.grupos[0]?.revisor !== generico;
   // TASK-074 (MEN-4 de la revision): en una peticion fragmentada, la seccion
   // de cobertura de cada dominio lleva SUS ficheros cambiados desde la merge
   // base, no solo los del delta de la ronda: una linea sin cubrir de la ronda
@@ -727,7 +849,7 @@ export async function runReviewCommand(
       ? modeloDeVerificacion(updated.modelo_sugerido)
       : null;
   const escrituras = plan.grupos.map((grupo) => {
-    const sufijo = plan.fragmentado ? `-${grupo.revisor}` : '';
+    const sufijo = conSufijo ? `-${grupo.revisor}` : '';
     return {
       revisor: grupo.revisor,
       ficheros: grupo.ficheros,
@@ -793,7 +915,15 @@ export async function runReviewCommand(
             stat: paraRevision.stat,
             patrones: excluir,
             ...(incremental && desde !== baseBranch ? { desde } : {}),
-            ...(previa !== null ? { seccionPrevia: previa.seccion } : {}),
+            ...(previa !== null
+              ? {
+                  seccionPrevia: acotada
+                    ? (previa.seccionesPorRevisor.get(escritura.revisor === generico ? '' : escritura.revisor) ??
+                      previa.seccionesPorRevisor.get(escritura.revisor) ??
+                      seccionSinPendientes(previa.ronda))
+                    : previa.seccion,
+                }
+              : {}),
             ...(datosCobertura === null
               ? {}
               : {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index 31762a8..ce69332 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -32,7 +32,6 @@ import {
   type AutoCommitResult,
 } from '../fs/git-commit.js';
 import { REVISION_DIRNAME } from './review.js';
-import { soloMenores } from '../core/informe-revision.js';
 
 export class VeredictoCommandError extends Error {}
 
@@ -178,16 +177,10 @@ export async function runVeredictoCommand(
   }
   if (nuevo !== contenido) await writeFile(informePath, nuevo, 'utf8');
 
-  // TASK-083: aviso, sin bloquear ni cambiar el veredicto (el contrato de
-  // TASK-036 sigue igual): pedir cambios con solo MENORES abre otra ronda.
+  // TASK-095: el aviso de TASK-083 (pedir cambios con solo MENORES) se quito:
+  // desde la ronda 2 toda ronda es una verificacion acotada, asi que decia
+  // algo que ya no distingue nada. `avisos` se conserva en el resultado.
   const avisos: string[] = [];
-  if (valor === 'cambios-solicitados' && soloMenores(nuevo)) {
-    avisos.push(
-      `${task.id}: ${nombre} pide cambios y su tabla solo tiene MENORES. Una ronda sin CRITICO ni ` +
-        'IMPORTANTE puede cerrar con "aprobada-con-correcciones"; si se piden cambios, la ronda ' +
-        'siguiente podra ser una verificacion acotada al diff de las correcciones.'
-    );
-  }
 
   const commitResult = autoCommit({
     cwd: deps.repoCwd,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index a341a28..97447db 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -168,14 +168,21 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
       switch (ctx.veredicto) {
         case 'cambios-solicitados':
           if (ctx.rondaRevision >= TOPE_RONDAS) {
-            return paso(
-              'review',
-              false,
-              `la ronda ${String(ctx.rondaRevision)} tambien pidio cambios: tope de rondas alcanzado; corregir y abrir otra ronda lo decide una persona`,
-              `taskctl review ${task.id}`,
-              true,
-              true
-            );
+            // TASK-095: en el tope se pregunta en CUALQUIER modo, tambien en
+            // manual y semiautomatico (antes se detenia sin preguntar: IMP-3 de
+            // TASK-058, IMP-2 de TASK-059). Detenerse sin decir que decidir
+            // dejaba la salida en manos de quien relanzaba review, y asi una
+            // tarea llego a 14 rondas. La pregunta nombra las salidas.
+            return {
+              fase: 'review',
+              comando: `taskctl review ${task.id} --ronda-extra`,
+              accion: 'preguntar',
+              motivo:
+                `la ronda ${String(ctx.rondaRevision)} tambien pidio cambios: tope de rondas alcanzado. ` +
+                'Lo decide una persona: aceptar lo que queda abierto (con sus IDs y el motivo en el ' +
+                'Resultado) y cerrar, pasarlo a una tarea nueva, o corregir y abrir otra ronda con ' +
+                `"taskctl review ${task.id} --ronda-extra"`,
+            };
           }
           return paso(
             'review',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 74993be..0222e18 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -265,6 +265,19 @@ export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
   return { tabla, abiertos };
 }
 
+/**
+ * TASK-095: hallazgos que la ronda siguiente tiene que verificar. Todo lo que
+ * no esta `aceptado`, tambien lo `corregido`: una correccion es justo lo que
+ * hay que comprobar, la marque quien la marque.
+ */
+export function hallazgosPendientes(informe: string): LecturaHallazgos {
+  const { tabla, hallazgos } = leerHallazgos(informe);
+  const abiertos = hallazgos
+    .filter((h) => h.estado.toLowerCase() !== 'aceptado')
+    .map(({ id, severidad, estado, fichero }) => ({ id, severidad, estado, fichero }));
+  return { tabla, abiertos };
+}
+
 // --- Alcance de la ronda siguiente (TASK-081, TASK-083) ----------------------
 
 /** El informe sigue siendo la plantilla: sin filas reales y con la fila de ejemplo, o con el veredicto PENDIENTE. */
@@ -296,67 +309,37 @@ export function modeloBaratoPermitido(informes: readonly string[]): boolean {
 /** Lo que la ronda anterior permite para la siguiente, decidido solo con sus informes. */
 export interface AlcanceRonda {
   /**
-   * TASK-083: la ronda siguiente PUEDE ser una verificacion acotada al diff de
-   * las correcciones. Es condicion necesaria, no suficiente: `review` la
-   * convierte en completa si no hay diff de correcciones, si hay un merge en
-   * el delta o si el delta toca ficheros que ningun hallazgo nombraba.
+   * TASK-095: la ronda siguiente PUEDE ser una verificacion acotada al diff de
+   * las correcciones. Condicion necesaria, no suficiente: `review` la hace
+   * completa si se pide `--completa` o si no hay commit revisado fiable.
    */
   acotada: boolean;
   /** TASK-081: la ronda siguiente puede usar un modelo mas barato. */
   modeloBarato: boolean;
   /** Por que `acotada` es lo que es, para la linea `- Alcance:` de la peticion. */
   motivo: string;
-  /** Rutas de la columna `Fichero` de todos los hallazgos, sin `:linea`. */
-  ficherosNombrados: string[];
-}
-
-/**
- * Rutas de una celda `Fichero`: `src/a.ts:12`, `` `b.vue:191` ``,
- * `a.ts:1-3, b.ts:7` o `c.ts#L4`. Sin la linea, con `/` y sin `./` delante.
- */
-export function rutasDeCeldaFichero(celda: string): string[] {
-  return celda
-    .split(/[\s,;]+/)
-    .map((t) =>
-      t
-        .replace(/^[*_`(]+|[*_`)]+$/g, '')
-        .replace(/#L\d+(?:-L?\d+)?$/i, '')
-        .replace(/:\d+(?:[-–:]\d+)*$/, '')
-        .replace(/\\/g, '/')
-        .replace(/^\.\//, '')
-    )
-    .filter((t) => t !== '' && !SOLO_GUION_RE.test(t));
-}
-
-/**
- * true si `ruta` (relativa a la raiz del repo) es una de las nombradas: igual,
- * o la nombrada es su final (`Armazon.vue` nombra `src/ui/Armazon.vue`), o la
- * nombrada es un directorio que la contiene (`src/core/`).
- */
-export function ficheroNombrado(ruta: string, nombrados: readonly string[]): boolean {
-  const r = ruta.replace(/\\/g, '/');
-  return nombrados.some((n) => r === n || r.endsWith(`/${n}`) || (n.endsWith('/') && r.startsWith(n)));
 }
 
 /**
  * Alcance de la ronda N+1 a partir de los informes de la ronda N (todos sus
- * fragmentos a la vez: decidir por fragmento deja pasar un IMPORTANTE de otro
- * dominio). Fail-closed (TASK-083, decision de la persona): la ronda solo
- * puede ser acotada si la ronda N pidio cambios, todos sus informes tienen
- * tabla legible, ninguno es la plantilla, ninguna severidad cae fuera del
- * vocabulario, hay al menos un hallazgo y TODOS son MENOR. Un CRITICO o
- * IMPORTANTE en CUALQUIER estado (tambien `corregido` o `aceptado`) obliga a
- * la ronda completa: un IMPORTANTE marcado como corregido es justo la
- * correccion que mas falta hace verificar.
+ * fragmentos a la vez). TASK-095 corrige la regla de TASK-083, que exigia que
+ * TODOS los hallazgos fueran MENOR: los revisores vuelven a listar los
+ * IMPORTANTES ya corregidos, asi que la condicion no se cumplia nunca y cada
+ * ronda relanzaba una revision completa desde la base que encontraba otra
+ * tanda (medido en 147 tareas, docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md).
+ * Ahora la severidad no decide: la ronda siguiente verifica las correcciones
+ * con los revisores que tienen algo pendiente. Se conservan las guardas
+ * fail-closed (decision de la persona): sin informes, veredicto distinto de
+ * `cambios-solicitados`, tabla ilegible, plantilla sin rellenar, severidad
+ * fuera del vocabulario o ningun hallazgo anotado obligan a la completa.
  */
 export function alcanceRondaSiguiente(informes: readonly string[]): AlcanceRonda {
   const modeloBarato = modeloBaratoPermitido(informes);
-  const completa = (motivo: string): AlcanceRonda => ({ acotada: false, modeloBarato, motivo, ficherosNombrados: [] });
+  const completa = (motivo: string): AlcanceRonda => ({ acotada: false, modeloBarato, motivo });
   if (informes.length === 0) return completa('la ronda anterior no tiene informes');
   const veredicto = veredictoDeRonda(informes);
   if (veredicto !== 'cambios-solicitados') return completa(`el veredicto de la ronda anterior es "${veredicto}"`);
-  const nombrados = new Set<string>();
-  let menores = 0;
+  let total = 0;
   for (const texto of informes) {
     const lectura = leerHallazgos(texto);
     if (!lectura.tabla) return completa('un informe de la ronda anterior no tiene tabla de hallazgos legible');
@@ -365,29 +348,11 @@ export function alcanceRondaSiguiente(informes: readonly string[]): AlcanceRonda
       if (h.severidadReconocida === null) {
         return completa(`la severidad "${h.severidad}" de ${h.id} no es CRITICO, IMPORTANTE ni MENOR`);
       }
-      if (h.severidadReconocida !== 'MENOR') {
-        return completa(`la ronda anterior tiene un ${h.severidadReconocida} (${h.id}, ${h.estado || 'sin estado'})`);
-      }
-      menores++;
-      for (const r of rutasDeCeldaFichero(h.fichero)) nombrados.add(r);
+      total++;
     }
   }
-  if (menores === 0) return completa('la ronda anterior pidio cambios sin anotar ningun hallazgo');
-  return {
-    acotada: true,
-    modeloBarato,
-    motivo: `la ronda anterior solo dejo MENORES (${menores})`,
-    ficherosNombrados: [...nombrados],
-  };
-}
-
-/**
- * TASK-083: true si el informe tiene tabla, al menos un hallazgo, y todos son
- * MENOR. Es lo que `taskctl veredicto` avisa al registrar `cambios-solicitados`.
- */
-export function soloMenores(informe: string): boolean {
-  const lectura = leerHallazgos(informe);
-  return lectura.tabla && lectura.hallazgos.length > 0 && lectura.hallazgos.every((h) => h.severidadReconocida === 'MENOR');
+  if (total === 0) return completa('la ronda anterior pidio cambios sin anotar ningun hallazgo');
+  return { acotada: true, modeloBarato, motivo: `la ronda anterior pidio cambios (${total} hallazgo(s))` };
 }
 
 // --- Hallazgos de una tarea, para las metricas (TASK-064) --------------------
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
index fd018f5..40579b0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
@@ -1,23 +1,20 @@
 /**
- * TASK-083: alcance de la ronda N+1. Si la ronda anterior solo dejo MENORES
- * (en TODOS sus informes) y el delta solo toca los ficheros que nombraban, la
- * ronda siguiente es una verificacion acotada: un solo revisor (el generico),
- * sin fragmentar, con instrucciones de verificacion y la linea `- Alcance:`.
- * Cualquier CRITICO o IMPORTANTE, en cualquier estado, obliga a la completa.
+ * Alcance de la ronda N+1. TASK-083 la hacia acotada solo si la ronda anterior
+ * dejaba MENORES; TASK-095 corrige esa regla, que no se cumplia nunca (los
+ * revisores relistan los IMPORTANTES corregidos y cada ronda relanzaba una
+ * completa desde la base): desde la ronda 2 la ronda es una verificacion
+ * acotada, cada revisor verifica SUS pendientes y los dominios que toca la
+ * correccion tambien la ven. Completa solo con --completa, sin commit revisado
+ * fiable o cuando los informes no se pueden leer (fail-closed).
  * Repos Git temporales reales: review -> informes -> veredicto -> correccion -> review.
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { readFile, readdir, writeFile } from 'node:fs/promises';
 import path from 'node:path';
-import { runReviewCommand, type ReviewCommandResult } from '../../src/commands/review.js';
+import { REGLA_HALLAZGOS_NUEVOS, runReviewCommand, type ReviewCommandResult } from '../../src/commands/review.js';
 import { runVeredictoCommand } from '../../src/commands/veredicto.js';
-import {
-  alcanceRondaSiguiente,
-  ficheroNombrado,
-  rutasDeCeldaFichero,
-  soloMenores,
-} from '../../src/core/informe-revision.js';
+import { alcanceRondaSiguiente, hallazgosPendientes } from '../../src/core/informe-revision.js';
 import {
   SCRIPTS_DIR,
   sampleTask,
@@ -31,7 +28,8 @@ import {
 
 const JAVA = 'src/main/java/com/acme/UserService.java';
 const ANGULAR = 'src/app/user-profile/user-profile.component.ts';
-const OTRO = 'src/main/java/com/acme/Otro.java';
+// Sin dominio: lo revisa el generico.
+const SCRIPT = 'scripts/arranque.sh';
 const ID = 'TASK-983';
 
 function informe(filas: string[], veredicto = 'PENDIENTE'): string {
@@ -44,28 +42,29 @@ function informe(filas: string[], veredicto = 'PENDIENTE'): string {
   );
 }
 const MEN_JAVA = `| MEN-1 | MENOR | abierto | ${JAVA}:3 | implementacion |`;
-// El nombre corto tambien nombra la ruta completa (asi lo anotan los revisores).
 const MEN_ANGULAR = '| MEN-2 | MENOR | abierto | `user-profile.component.ts:5` | implementacion |';
+const MEN_SCRIPT = `| MEN-3 | MENOR | abierto | ${SCRIPT}:2 | implementacion |`;
 const IMP_ABIERTO = `| IMP-1 | IMPORTANTE | abierto | ${JAVA}:9 | implementacion |`;
 const IMP_CORREGIDO = `| IMP-1 | IMPORTANTE | corregido | ${JAVA}:9 | implementacion |`;
+const CRIT_ABIERTO = `| CRIT-1 | CRITICO | abierto | ${JAVA}:9 | implementacion |`;
 const CRIT_ACEPTADO = `| CRIT-1 | CRITICO | aceptado | ${JAVA}:9 | implementacion |`;
 
 interface Ronda {
   r: ReviewCommandResult;
-  peticiones: string[];
+  /** Peticiones de la ronda por nombre de fichero. */
+  peticiones: Map<string, string>;
 }
 
 interface Ctx {
   repoRoot: string;
   tareasRoot: string;
-  /** Escribe los informes de la ultima ronda, los commitea y registra `cambios-solicitados` en cada uno. */
-  pedirCambios(r: ReviewCommandResult, informes: string[]): Promise<string[][]>;
+  /** Escribe los informes de la ultima ronda (en el orden de r.informes), los commitea y pide cambios en cada uno. */
+  pedirCambios(r: ReviewCommandResult, informes: string[]): Promise<void>;
   /** Modifica `ficheros` y commitea (la correccion). */
   corregir(ficheros: string[]): Promise<void>;
   review(extra?: string[]): Promise<Ronda>;
 }
 
-/** Ronda 1 sobre `ficheros` y el contexto para seguir; `cuerpo` recibe la ronda 1. */
 async function conRonda1(ficheros: string[], cuerpo: (ctx: Ctx, r1: Ronda) => Promise<void>): Promise<void> {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     const task = sampleTask({ id: ID, rama: 'feature/task-983-alcance' });
@@ -84,16 +83,13 @@ async function conRonda1(ficheros: string[], cuerpo: (ctx: Ctx, r1: Ronda) => Pr
           await writeFile((r.informes[i] as { informePath: string }).informePath, informes[i] as string, 'utf8');
         }
         commitAll(repoRoot, `informes ronda ${r.ronda}`);
-        const avisos: string[][] = [];
         for (const g of r.informes) {
-          const v = await runVeredictoCommand(
+          await runVeredictoCommand(
             tareasRoot,
             [ID, 'cambios-solicitados', ...(r.informes.length > 1 ? ['--informe', path.basename(g.informePath)] : [])],
             { repoCwd: repoRoot }
           );
-          avisos.push(v.avisos);
         }
-        return avisos;
       },
       async corregir(fs) {
         n++;
@@ -101,10 +97,11 @@ async function conRonda1(ficheros: string[], cuerpo: (ctx: Ctx, r1: Ronda) => Pr
         commitAll(repoRoot, `correccion ${n}`);
       },
       async review(extra = []) {
-        const r = await runReviewCommand(tareasRoot, [ID, ...extra], '2026-11-07', deps);
+        const r = await runReviewCommand(tareasRoot, [ID, ...extra], '2026-11-10', deps);
         const dir = path.dirname((r.informes[0] as { peticionPath: string }).peticionPath);
         const nombres = (await readdir(dir)).filter((x) => x.startsWith(`peticion-revision-${r.ronda}`)).sort();
-        const peticiones = await Promise.all(nombres.map((x) => readFile(path.join(dir, x), 'utf8')));
+        const peticiones = new Map<string, string>();
+        for (const x of nombres) peticiones.set(x, await readFile(path.join(dir, x), 'utf8'));
         return { r, peticiones };
       },
     };
@@ -117,98 +114,82 @@ function lineaAlcance(peticion: string): string | undefined {
   return peticion.split('\n').find((l) => l.startsWith('- Alcance:'));
 }
 
+/** Acotada de verdad: campo, linea de cabecera, instrucciones y diff desde el commit revisado. */
+function esAcotada(ronda: Ronda, desde: string): void {
+  assert.equal(ronda.r.alcance, 'acotada');
+  assert.equal(ronda.r.desde, desde, 'el diff va desde el ultimo commit revisado, no desde la base');
+  for (const [nombre, p] of ronda.peticiones) {
+    assert.match(lineaAlcance(p) ?? '', /^- Alcance: verificacion acotada al diff de las correcciones \(motivo: /, nombre);
+    assert.ok(p.includes('## Instrucciones para el agente revisor (verificacion acotada)'), nombre);
+    assert.ok(p.includes(REGLA_HALLAZGOS_NUEVOS), `${nombre}: limita los hallazgos nuevos`);
+    assert.ok(p.includes(`## Commits a revisar (git log ${desde}..HEAD)`), nombre);
+  }
+}
+
 function esCompleta(ronda: Ronda, motivo: RegExp): void {
   assert.equal(ronda.r.alcance, 'completa');
   assert.match(ronda.r.motivoAlcance, motivo);
-  for (const p of ronda.peticiones) {
+  for (const p of ronda.peticiones.values()) {
     assert.match(lineaAlcance(p) ?? '', /^- Alcance: completa \(motivo: /);
     assert.ok(!p.includes('(verificacion acotada)'), 'sin instrucciones acotadas');
     assert.ok(p.includes('clona el repo a un\ndirectorio temporal'), 'instrucciones de la revision completa');
   }
 }
 
-test('alcance (TASK-083): ronda 1 fragmentada solo con MENORES y correccion en sus ficheros -> verificacion acotada', async () => {
-  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
-    assert.equal(r1.r.informes.length, 2, 'la ronda 1 se fragmenta por dominio');
-    assert.equal(r1.r.alcance, 'completa');
-    assert.match(lineaAlcance(r1.peticiones[0] as string) ?? '', /completa \(motivo: primera ronda de revision\)/);
-    const avisos = await ctx.pedirCambios(r1.r, [informe([MEN_JAVA]), informe([MEN_ANGULAR])]);
-    // El aviso de veredicto: pedir cambios con solo MENORES.
-    for (const a of avisos) assert.match(a.join('\n'), /solo tiene MENORES/);
-    await ctx.corregir([JAVA, ANGULAR]);
-    const r2 = await ctx.review();
-
-    assert.equal(r2.r.alcance, 'acotada');
-    assert.match(r2.r.motivoAlcance, /solo dejo MENORES \(2\) y el diff solo toca sus ficheros/);
-    // Un solo revisor, el generico, con el nombre de siempre (sin sufijo).
-    assert.equal(r2.r.informes.length, 1);
-    assert.equal(r2.r.informes[0]!.revisor, 'code-quality-reviewer');
-    assert.equal(path.basename(r2.r.informes[0]!.peticionPath), 'peticion-revision-2.md');
-    assert.deepEqual([...r2.r.informes[0]!.ficheros].sort(), [ANGULAR, JAVA].sort());
-    const p = r2.peticiones[0] as string;
-    assert.equal(
-      lineaAlcance(p),
-      '- Alcance: verificacion acotada al diff de las correcciones ' +
-        '(motivo: la ronda anterior solo dejo MENORES (2) y el diff solo toca sus ficheros)'
-    );
-    assert.ok(p.includes('## Instrucciones para el agente revisor (verificacion acotada)'));
-    // No es solo tachar la lista: tests y busqueda de fallos nuevos.
-    assert.ok(p.includes('Ejecuta la suite'));
-    assert.ok(p.includes('Busca en el diff de esta ronda el fallo que la correccion abre'));
-    assert.ok(p.includes('| MEN-1 | MENOR |') && p.includes('| MEN-2 | MENOR |'), 'lista los hallazgos a verificar');
-    assert.ok(p.includes(`- Revision incremental: solo los cambios desde ${r1.r.commitRevisado}`));
-    // El chore de commit no cambia: metricas lo sigue clasificando.
-    assert.match(git(['log', '-1', '--format=%s'], ctx.repoRoot), /peticion de revision ronda 2/);
-  });
-});
-
-test('alcance (TASK-083, criterio 3): un IMPORTANTE abierto, uno corregido o un CRITICO aceptado -> ronda completa', async () => {
-  for (const fila of [IMP_ABIERTO, IMP_CORREGIDO, CRIT_ACEPTADO]) {
+test('alcance (TASK-095): con un IMPORTANTE abierto, uno corregido, un CRITICO abierto o uno aceptado, la ronda 2 es acotada', async () => {
+  for (const fila of [IMP_ABIERTO, IMP_CORREGIDO, CRIT_ABIERTO, CRIT_ACEPTADO]) {
     await conRonda1([JAVA], async (ctx, r1) => {
-      const avisos = await ctx.pedirCambios(r1.r, [informe([MEN_JAVA, fila])]);
-      assert.deepEqual(avisos, [[]], 'sin aviso: no son solo MENORES');
+      await ctx.pedirCambios(r1.r, [informe([MEN_JAVA, fila])]);
       await ctx.corregir([JAVA]);
       const r2 = await ctx.review();
-      esCompleta(r2, /la ronda anterior tiene un (IMPORTANTE|CRITICO)/);
+      esAcotada(r2, r1.r.commitRevisado);
+      assert.match(r2.r.motivoAlcance, /la ronda anterior pidio cambios \(2 hallazgo\(s\)\)/);
+      const p = [...r2.peticiones.values()].join('\n');
+      assert.ok(p.includes('| MEN-1 | MENOR |'), 'lista el MENOR');
+      // Pendiente = todo lo que no esta aceptado: un corregido se verifica.
+      if (fila === CRIT_ACEPTADO) assert.ok(!p.includes('| CRIT-1 |'), 'lo aceptado no se vuelve a verificar');
+      else assert.ok(p.includes(fila.split('|')[1]!.trim()), `lista ${fila}`);
     });
   }
 });
 
-test('alcance (TASK-083): el IMPORTANTE esta en OTRO fragmento de la ronda 1 -> completa (se decide por ronda)', async () => {
-  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
-    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA]), informe([MEN_ANGULAR.replace('MENOR', 'IMPORTANTE')])]);
-    await ctx.corregir([JAVA]);
+test('alcance (TASK-095): cada revisor de dominio verifica SUS pendientes, no el generico en su lugar', async () => {
+  await conRonda1([JAVA, SCRIPT], async (ctx, r1) => {
+    const nombres1 = r1.r.informes.map((g) => g.revisor);
+    assert.deepEqual([...nombres1].sort(), ['code-quality-reviewer', 'java-spring-reviewer'].sort());
+    const porRevisor = r1.r.informes.map((g) => (g.revisor === 'java-spring-reviewer' ? informe([IMP_ABIERTO]) : informe([MEN_SCRIPT])));
+    await ctx.pedirCambios(r1.r, porRevisor);
+    await ctx.corregir([JAVA, SCRIPT]);
     const r2 = await ctx.review();
-    esCompleta(r2, /IMPORTANTE \(MEN-2/);
+    esAcotada(r2, r1.r.commitRevisado);
+    const java = r2.peticiones.get('peticion-revision-2-java-spring-reviewer.md');
+    const generico = r2.peticiones.get('peticion-revision-2-code-quality-reviewer.md');
+    assert.ok(java !== undefined, 'el revisor de dominio recibe su propia peticion');
+    assert.ok(generico !== undefined);
+    assert.ok(java.includes('| IMP-1 | IMPORTANTE |') && !java.includes('| MEN-3 |'), 'java ve solo lo suyo');
+    assert.ok(generico.includes('| MEN-3 | MENOR |') && !generico.includes('| IMP-1 |'), 'el generico no verifica lo de java');
+    // Cada uno recibe el delta entero de la correccion, no filtrado.
+    for (const p of [java, generico]) assert.ok(p.includes(JAVA) && p.includes(SCRIPT));
   });
 });
 
-test('alcance (TASK-083): --completa la fuerza aunque la regla permita la acotada', async () => {
-  await conRonda1([JAVA], async (ctx, r1) => {
-    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
-    await ctx.corregir([JAVA]);
-    esCompleta(await ctx.review(['--completa']), /pedida con --completa/);
-  });
-});
-
-test('alcance (TASK-083): el delta toca un fichero que ningun hallazgo nombraba -> completa', async () => {
-  await conRonda1([JAVA], async (ctx, r1) => {
-    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
-    await ctx.corregir([JAVA, OTRO]);
-    esCompleta(await ctx.review(), new RegExp(`ningun hallazgo nombraba: ${OTRO.replace(/\./g, '\\.')}$`));
-  });
-});
-
-test('alcance (TASK-083): con mas de cinco ficheros no nombrados, el motivo nombra cinco y cuenta el resto', async () => {
-  await conRonda1([JAVA], async (ctx, r1) => {
-    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
-    await ctx.corregir([JAVA, ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((x) => `extra/${x}.txt`)]);
+test('alcance (TASK-095): un dominio sin pendientes cuyo terreno toca la correccion tambien la revisa', async () => {
+  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
+    const porRevisor = r1.r.informes.map((g) =>
+      g.revisor === 'java-spring-reviewer' ? informe([MEN_JAVA]) : informe(['| (ninguno) | — | sin hallazgos | — | — |'])
+    );
+    await ctx.pedirCambios(r1.r, porRevisor);
+    await ctx.corregir([JAVA, ANGULAR]);
     const r2 = await ctx.review();
-    esCompleta(r2, /: extra\/a\.txt, extra\/b\.txt, extra\/c\.txt, extra\/d\.txt, extra\/e\.txt \(y 2 mas\)$/);
+    esAcotada(r2, r1.r.commitRevisado);
+    const angular = r2.peticiones.get('peticion-revision-2-angular-vue-reviewer.md');
+    assert.ok(angular !== undefined, 'la correccion toca su dominio');
+    assert.match(angular, /No tienes hallazgos pendientes propios/);
+    assert.equal(r2.peticiones.size, 2, 'java (pendientes) y angular (terreno tocado); el generico no hace falta');
   });
 });
 
-test('alcance (TASK-083): un merge de develop dentro del delta -> completa', async () => {
+test('alcance (TASK-095): un merge de develop entre rondas no la hace completa; se nombra y su codigo esta en el diff', async () => {
   await conRonda1([JAVA], async (ctx, r1) => {
     await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
     await ctx.corregir([JAVA]);
@@ -218,60 +199,79 @@ test('alcance (TASK-083): un merge de develop dentro del delta -> completa', asy
     commitAll(ctx.repoRoot, 'mas develop');
     git(['checkout', '-q', rama], ctx.repoRoot);
     git(['merge', '-q', '--no-ff', '--no-edit', 'develop'], ctx.repoRoot);
-    esCompleta(await ctx.review(), /hay commits de merge entre/);
+    const r2 = await ctx.review();
+    esAcotada(r2, r1.r.commitRevisado);
+    assert.match(r2.r.motivoAlcance, /hay commits de merge entre .* lo que entra con ellos va en el diff/);
+    for (const p of r2.peticiones.values()) assert.ok(p.includes('otro-cambio-develop.txt'), 'lo que entra con el merge se revisa');
   });
 });
 
-test('alcance (TASK-083): sin diff de correcciones (el commit de la ronda 1 ya no existe) -> completa', async () => {
+test('alcance (TASK-095): sin commit revisado fiable, completa y desde la base', async () => {
   await conRonda1([JAVA], async (ctx, r1) => {
     const peticion = (r1.r.informes[0] as { peticionPath: string }).peticionPath;
     const texto = await readFile(peticion, 'utf8');
     await writeFile(peticion, texto.replace(/^- Commit revisado \(HEAD\): \w+/m, '- Commit revisado (HEAD): deadbeefcafe'), 'utf8');
-    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.pedirCambios(r1.r, [informe([IMP_ABIERTO])]);
     await ctx.corregir([JAVA]);
     const r2 = await ctx.review();
-    esCompleta(r2, /no hay diff de correcciones/);
+    esCompleta(r2, /no hay commit revisado fiable/);
     assert.equal(r2.r.desde, r2.r.baseBranch);
   });
 });
 
-test('alcance (TASK-083): tras una acotada que encuentra un IMPORTANTE, la ronda 3 es completa y desde la base', async () => {
+test('alcance (TASK-095): --completa la fuerza, desde la base, aunque haya un IMPORTANTE abierto', async () => {
+  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
+    await ctx.pedirCambios(r1.r, r1.r.informes.map(() => informe([IMP_ABIERTO])));
+    await ctx.corregir([JAVA]);
+    const r2 = await ctx.review(['--completa']);
+    esCompleta(r2, /pedida con --completa/);
+    assert.equal(r2.r.desde, 'develop');
+  });
+});
+
+test('alcance (TASK-095): el caso real que no convergia (IMPORTANTE relistado como corregido) converge y el tope frena en review', async () => {
   await conRonda1([JAVA], async (ctx, r1) => {
-    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.pedirCambios(r1.r, [informe([`| IMP-46 | IMPORTANTE | abierto | ${JAVA}:4 | plan |`])]);
     await ctx.corregir([JAVA]);
     const r2 = await ctx.review();
-    assert.equal(r2.r.alcance, 'acotada');
-    await ctx.pedirCambios(r2.r, [informe([`| IMP-R2-1 | IMPORTANTE | abierto | ${JAVA}:4 | implementacion |`])]);
+    esAcotada(r2, r1.r.commitRevisado);
+    // El revisor de la ronda 2 relista el IMPORTANTE como corregido y deja un MENOR.
+    await ctx.pedirCambios(r2.r, [
+      informe([`| IMP-46 | IMPORTANTE | corregido | ${JAVA}:4 | plan |`, `| MEN-9 | MENOR | abierto | ${JAVA}:6 | plan |`]),
+    ]);
     await ctx.corregir([JAVA]);
     const r3 = await ctx.review();
-    esCompleta(r3, /IMPORTANTE \(IMP-R2-1.*la ronda 2 fue acotada, asi que el diff va desde "develop"/);
-    assert.equal(r3.r.desde, 'develop');
-    assert.ok((r3.peticiones[0] as string).includes('## Commits a revisar (git log develop..HEAD)'));
+    // Con la regla de TASK-083 esta ronda era completa desde la base
+    // ("tiene un IMPORTANTE (IMP-46, corregido)") y encontraba otra tanda.
+    esAcotada(r3, r2.r.commitRevisado);
+    await ctx.pedirCambios(r3.r, [informe([`| MEN-10 | MENOR | abierto | ${JAVA}:7 | plan |`])]);
+    await ctx.corregir([JAVA]);
+    await assert.rejects(ctx.review(), /tope de rondas \(3\).*--ronda-extra/s);
+    const r4 = await ctx.review(['--ronda-extra']);
+    esAcotada(r4, r3.r.commitRevisado);
+    assert.equal(r4.r.ronda, 4);
   });
 });
 
-test('alcance (TASK-083): tras una acotada con solo MENORES, la ronda 3 vuelve a ser acotada desde la ronda 2', async () => {
+test('alcance (TASK-095): abrir una ronda con hallazgos de la anterior sin marcar corregido ni aceptado avisa', async () => {
   await conRonda1([JAVA], async (ctx, r1) => {
-    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
+    await ctx.pedirCambios(r1.r, [informe([IMP_ABIERTO, `| MEN-1 | MENOR | aceptado | ${JAVA}:3 | plan |`])]);
     await ctx.corregir([JAVA]);
     const r2 = await ctx.review();
-    await ctx.pedirCambios(r2.r, [informe([`| MEN-R2-1 | MENOR | abierto | ${JAVA}:5 | implementacion |`])]);
-    await ctx.corregir([JAVA]);
-    const r3 = await ctx.review();
-    assert.equal(r3.r.alcance, 'acotada');
-    assert.equal(r3.r.desde, r2.r.commitRevisado);
+    const aviso = r2.r.avisos.join('\n');
+    assert.match(aviso, /sin marcar como corregido ni aceptado: IMP-1 \(informe-revision-1[^)]*\.md\)/);
+    assert.ok(!/MEN-1 \(/.test(aviso), 'lo aceptado no se avisa');
   });
 });
 
 // --- La regla pura ------------------------------------------------------------
 
-test('alcanceRondaSiguiente (TASK-083): fail-closed ante lo que no se puede leer', () => {
+test('alcanceRondaSiguiente (TASK-095): la severidad ya no decide; las guardas fail-closed se conservan', () => {
   const pedida = (filas: string[]): string => informe(filas, 'cambios-solicitados');
-  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA])]).acotada, true);
-  assert.deepEqual(alcanceRondaSiguiente([pedida([MEN_JAVA, MEN_ANGULAR])]).ficherosNombrados, [
-    JAVA,
-    'user-profile.component.ts',
-  ]);
+  for (const filas of [[MEN_JAVA], [MEN_JAVA, IMP_CORREGIDO], [IMP_ABIERTO], [CRIT_ABIERTO]]) {
+    assert.equal(alcanceRondaSiguiente([pedida(filas)]).acotada, true, filas.join(' '));
+  }
+  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA]), pedida([CRIT_ACEPTADO])]).acotada, true);
   const casos: Array<[string, string[], RegExp]> = [
     ['sin informes', [], /no tiene informes/],
     ['veredicto aprobada', [informe([MEN_JAVA], 'aprobada')], /veredicto .* "aprobada"/],
@@ -279,8 +279,6 @@ test('alcanceRondaSiguiente (TASK-083): fail-closed ante lo que no se puede leer
     ['sin tabla', ['# I\n\n- Veredicto: cambios-solicitados\n\n## Hallazgos\n\nMEN-1 en prosa.\n'], /tabla/],
     ['severidad desconocida', [pedida(['| X-1 | Alta | abierto | a.ts:1 | plan |'])], /"Alta"/],
     ['sin hallazgos', [pedida(['| (ninguno) | — | sin hallazgos | — | — |'])], /sin anotar ningun hallazgo/],
-    ['IMPORTANTE corregido', [pedida([MEN_JAVA, IMP_CORREGIDO])], /IMPORTANTE \(IMP-1, corregido\)/],
-    ['un fragmento con CRITICO', [pedida([MEN_JAVA]), pedida([CRIT_ACEPTADO])], /CRITICO/],
   ];
   for (const [nombre, informes, motivo] of casos) {
     const a = alcanceRondaSiguiente(informes);
@@ -292,20 +290,9 @@ test('alcanceRondaSiguiente (TASK-083): fail-closed ante lo que no se puede leer
   assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA, CRIT_ACEPTADO])]).modeloBarato, false);
 });
 
-test('rutasDeCeldaFichero y ficheroNombrado (TASK-083)', () => {
-  assert.deepEqual(rutasDeCeldaFichero('src/a.ts:12'), ['src/a.ts']);
-  assert.deepEqual(rutasDeCeldaFichero('`b.vue:191`, src\\c.ts:1-3; ./d.ts#L4'), ['b.vue', 'src/c.ts', 'd.ts']);
-  assert.deepEqual(rutasDeCeldaFichero('—'), []);
-  assert.deepEqual(rutasDeCeldaFichero(''), []);
-  assert.equal(ficheroNombrado('src/ui/Armazon.vue', ['Armazon.vue']), true);
-  assert.equal(ficheroNombrado('src/ui/OtroArmazon.vue', ['Armazon.vue']), false);
-  assert.equal(ficheroNombrado('src/core/x.ts', ['src/core/']), true);
-  assert.equal(ficheroNombrado('src/core/x.ts', []), false);
-});
-
-test('soloMenores (TASK-083): tabla con al menos un hallazgo y todos MENOR', () => {
-  assert.equal(soloMenores(informe([MEN_JAVA, MEN_ANGULAR])), true);
-  assert.equal(soloMenores(informe([MEN_JAVA, IMP_CORREGIDO])), false);
-  assert.equal(soloMenores(informe(['| (ninguno) | — | sin hallazgos | — | — |'])), false);
-  assert.equal(soloMenores('# I\n\n## Hallazgos\n\nprosa\n'), false);
+test('hallazgosPendientes (TASK-095): todo menos lo aceptado, tambien lo corregido', () => {
+  const l = hallazgosPendientes(informe([MEN_JAVA, IMP_CORREGIDO, CRIT_ACEPTADO, '| X-2 | MENOR |  | a.ts:1 | plan |']));
+  assert.equal(l.tabla, true);
+  assert.deepEqual(l.abiertos.map((h) => h.id), ['MEN-1', 'IMP-1', 'X-2']);
+  assert.equal(hallazgosPendientes('# I\n\n## Hallazgos\n\nprosa\n').tabla, false);
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
index 5b74671..a2425fb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
@@ -127,7 +127,10 @@ test('review incremental (TASK-040): ronda 1 -> cambios-solicitados -> correccio
     assert.doesNotMatch(peticion, /diff --git a\/src\/a\.ts/, 'lo ya revisado en la ronda 1 no entra');
     assert.doesNotMatch(peticion, /otra-tarea\.txt/, 'develop no se integra en la ronda 2');
     assert.match(peticion, /\| IMP-1 \| IMPORTANTE \| abierto \| src\/a\.ts:3 \| informe-revision-1\.md \|/);
-    assert.doesNotMatch(peticion, /\| MEN-1 \|/, 'un hallazgo corregido no se lista');
+    // TASK-095 (decision de la persona): un hallazgo corregido SI se lista,
+    // porque la ronda siguiente verifica justo las correcciones (antes,
+    // TASK-040, no se listaba).
+    assert.match(peticion, /\| MEN-1 \| MENOR \| corregido \|/, 'un hallazgo corregido se verifica');
     assert.equal(commitRevisadoDe(peticion), r2.commitRevisado);
     assert.ok(existsSync(path.join(revisionDir, 'informe-revision-2.md')));
     // Ni merge de develop ni nada pendiente en el arbol.
@@ -136,7 +139,7 @@ test('review incremental (TASK-040): ronda 1 -> cambios-solicitados -> correccio
   });
 });
 
-test('review incremental (TASK-040, MEN-2 de su revision): con la ronda anterior fragmentada lista los abiertos de TODOS sus informes', async () => {
+test('review incremental (TASK-040, MEN-2; TASK-095): con la ronda anterior fragmentada, cada revisor recibe los pendientes de SU informe', async () => {
   await withRonda1(INFORME_R1('cambios-solicitados'), async (repo, tareas, revisionDir) => {
     // Un segundo informe en la misma ronda (otro dominio), aprobado pero
     // con un MENOR abierto.
@@ -148,9 +151,14 @@ test('review incremental (TASK-040, MEN-2 de su revision): con la ronda anterior
     );
     commitAll(repo, 'docs: segundo informe de la ronda 1');
     await runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo));
-    const peticion = await readFile(path.join(revisionDir, 'peticion-revision-2.md'), 'utf8');
-    assert.match(peticion, /\| IMP-1 \|.*\| informe-revision-1\.md \|/);
-    assert.match(peticion, /\| MEN-9 \|.*\| informe-revision-1-java-spring-reviewer\.md \|/);
+    // TASK-095: la ronda 2 es acotada y cada revisor verifica lo suyo: ningun
+    // pendiente se pierde, y cada uno va a quien lo encontro.
+    const generico = await readFile(path.join(revisionDir, 'peticion-revision-2-code-quality-reviewer.md'), 'utf8');
+    const java = await readFile(path.join(revisionDir, 'peticion-revision-2-java-spring-reviewer.md'), 'utf8');
+    assert.match(generico, /\| IMP-1 \|.*\| informe-revision-1\.md \|/);
+    assert.doesNotMatch(generico, /\| MEN-9 \|/);
+    assert.match(java, /\| MEN-9 \|.*\| informe-revision-1-java-spring-reviewer\.md \|/);
+    assert.doesNotMatch(java, /\| IMP-1 \|/);
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index f01b1c6..86f0c94 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -90,7 +90,10 @@ const TABLA: Caso[] = [
   // TASK-059: guardas del automatico.
   { nombre: 'aprobada sin informe en commit propio', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'cambios en la ronda 2 (bajo el tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 2 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
-  { nombre: 'cambios en la ronda 3 (tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'preguntar'] },
+  // TASK-095: en el tope se pregunta en TODOS los modos (antes manual y semi
+  // se detenian sin decir que decidir: IMP-3 de TASK-058, IMP-2 de TASK-059),
+  // y el comando lleva --ronda-extra, que review exige pasado el tope.
+  { nombre: 'cambios en la ronda 3 (tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3 }, fase: 'review', comando: 'taskctl review TASK-100 --ronda-extra', acciones: ['preguntar', 'preguntar', 'preguntar'] },
   { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
 ];
 
@@ -137,7 +140,11 @@ test('siguienteFase: ninguna fase propuesta es una transicion ilegal para la maq
 test('siguienteFase: en manual nunca encadena nada, en ningun estado', () => {
   for (const caso of TABLA) {
     const r = siguienteFase(tarea(caso.task), { ...CTX, ...caso.ctx }, 'manual');
-    assert.equal(r.accion, 'detener', caso.nombre);
+    // TASK-095: el tope de rondas pregunta tambien en manual (nombra las
+    // salidas); preguntar no encadena. Todo lo demas se detiene.
+    const esperada = caso.nombre === 'cambios en la ronda 3 (tope)' ? 'preguntar' : 'detener';
+    assert.equal(r.accion, esperada, caso.nombre);
+    assert.notEqual(r.accion, 'continuar', caso.nombre);
   }
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
index a853b8d..5be2ebe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -257,7 +257,14 @@ test('automatico (TASK-059): approve sin preguntar, start implementa, review cor
   assert.match(start, /\*\*Modo automatico\*\*[\s\S]*implementa el plan[\s\S]*suite[\s\S]*en verde/);
   const review = lf(await readFile(path.join(SKILLS_DIR, 'review', 'SKILL.md'), 'utf8'));
   assert.match(review, /commitealo \*\*solo, en un commit que no toque nada mas\*\*/);
-  assert.match(review, /corrige tu los CRITICO e IMPORTANTE/);
+  // TASK-095: antes "corrige tu los CRITICO e IMPORTANTE (y los MENOR
+  // baratos)"; ahora se corrige TODO lo de la ronda, en cualquier modo, y el
+  // MENOR que no compense se acepta o pasa a otra tarea. En automatico lo
+  // hace la skill.
+  assert.match(review, /\*\*Antes de abrir la ronda siguiente se corrige TODO lo de la ronda\*\*/);
+  assert.match(review, /los CRITICO e IMPORTANTE siempre; un MENOR que no compense/);
+  assert.match(review, /En modo\s+automatico, si `siguiente` da `fase: review` con `accion: continuar`, haz tu\s+todo eso/);
+  assert.match(review, /taskctl review TASK-NNN --ronda-extra/);
   for (const fase of Object.keys(FASES)) {
     const texto = await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8');
     assert.ok(texto.includes('taskctl cadena comprobar <testigo>'), `${fase}: no comprueba la cadena recibida`);
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-095/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-095/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-095/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-095/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-095/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-095/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-095/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-095/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-095/tarea.md                                                       |   7 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 223 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++----------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js                                  |  11 ++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                          |  15 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                               |  83 ++++++++++---------------------
 14 files changed, 215 insertions(+), 126 deletions(-)
````
