# Peticion de revision — TASK-080 (ronda 1)

- Tarea: TASK-080 — Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan
- Rama revisada: feature/task-080-accesibilidad-en-angular-vue-reviewer-y
- Rama base: develop
- Commit revisado (HEAD): d49d92500e05ab07b896ac4b6e398cd7efb12839
- Fecha: 2026-11-06
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-080 (criterios de aceptacion y plan)

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

## Commits a revisar (git log develop..HEAD)

````
d49d925 feat(TASK-080): rol condicional de rendimiento, arquitectura mas exigente y WCAG 2.2 en angular-vue
ae269d5 chore(TASK-080): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 20257e9..b76bd66 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -2,6 +2,19 @@
 
 ## Sin publicar
 
+Accesibilidad y roles del brainstorm (TASK-080). `angular-vue-reviewer` revisa la
+accesibilidad por criterio de WCAG 2.2: contraste (un contraste que el diff no deja
+verificar nunca es CRITICO), orden, visibilidad y foco no oculto, trampas de
+teclado, etiquetas y ARIA, nombre accesible de iconos y botones, y dialogos
+modales; sus `patrones_archivo` no cambian. `brainstorm-arquitectura` mira
+ademas limites entre modulos, direccion de las dependencias, acoplamiento y
+coherencia con los ADR. Rol nuevo y condicional, `brainstorm-rendimiento`: lo
+suman las etiquetas `rendimiento`, `wasm`, `workers` o `3d` (sin distinguir
+mayusculas) cuando la tarea ya lanza 2 roles o mas, sin gastar presupuesto de la
+escalera; con 0 o 1, `plan` avisa de que no entra. `approve` y `taskctl
+siguiente` reconocen la plantilla vacia de un plan con rendimiento leyendo los
+roles de las peticiones en disco (antes la daban por redactada).
+
 ## 0.10.0 — 2026-11-06
 
 Revisor por pares de dominio para Rust y WebAssembly (TASK-079): la skill
diff --git a/docs/PROPUESTA_METODOLOGIA.md b/docs/PROPUESTA_METODOLOGIA.md
index c9575f3..976310b 100644
--- a/docs/PROPUESTA_METODOLOGIA.md
+++ b/docs/PROPUESTA_METODOLOGIA.md
@@ -33,7 +33,7 @@ EL PLUGIN (se instala una vez, se comparte con todo el equipo)         → distr
       angular-vue-reviewer/SKILL.md
       csharp-autocad-ifc-reviewer/SKILL.md
       code-quality-reviewer/SKILL.md
-    agents/                        ← definiciones de los roles de brainstorm (arquitectura, riesgos, testing, dominio)
+    agents/                        ← definiciones de los roles de brainstorm (arquitectura, riesgos, testing, dominio; rendimiento, condicional por etiquetas)
     commands/                      ← slash-commands de conveniencia (opcional, envuelven taskctl)
 
 CADA REPO DE PROYECTO (datos propios de ese proyecto, sí se versiona ahí)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 63fcb02..5274413 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -45,6 +45,22 @@ más de tres dominios, va entero al genérico):
 | `rust-wasm-reviewer` | Rust y WebAssembly | `.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/config.toml`, toolchain/rustfmt/clippy |
 | `code-quality-reviewer` | Genérico | Lo que no casa con ningún dominio, o más de tres dominios a la vez |
 
+## Roles del brainstorm de diseño
+
+`taskctl plan` lanza roles de `agents/` según la complejidad, por este orden de
+prioridad: `brainstorm-arquitectura`, `brainstorm-riesgos`,
+`brainstorm-testing` y `brainstorm-dominio`. Con dos o más, el
+`brainstorm-unificador` consolida sus salidas en el plan.
+
+`brainstorm-rendimiento` es un rol **condicional**: no ocupa sitio en esa
+escalera. Se suma cuando la tarea lleva una de las etiquetas `rendimiento`,
+`wasm`, `workers` o `3d` (sin distinguir mayúsculas) y la complejidad ya
+lanza dos roles o más. Mira el coste algorítmico con el volumen real, las
+asignaciones en bucles calientes, las copias entre JS y WASM, los Web Workers,
+las mallas y teselas grandes, y qué medir antes de optimizar. Con cero o un rol,
+`plan` avisa de que no entra y por qué: sin unificador, rendimiento quedaría
+como autor único de un plan cuya forma no le toca proponer.
+
 ## Instalación local (para desarrollo y pruebas)
 
 **Corrección respecto al texto original de TASK-006:** la tarea describía
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
index 4b2df9d..db41f6e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
@@ -28,6 +28,19 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
   duplicado es como acaban existiendo dos comportamientos para el mismo hecho.
 - **La forma de la interfaz** entre lo nuevo y lo que ya está: qué firma, qué
   contrato, qué queda público y qué se queda dentro.
+- **Límites entre módulos**: qué responsabilidad queda a cada lado de cada
+  frontera que el cambio toca, y si alguna se cruza por un atajo (importar
+  algo interno de otro módulo, compartir un estado que era privado).
+- **Dirección de las dependencias**: quién depende de quién después del
+  cambio. Las dependencias apuntan hacia lo estable y lo abstracto; una que
+  apunta al revés, o un ciclo nuevo entre módulos, se señala aunque compile.
+- **Acoplamiento**: cuánto tiene que saber cada pieza de las demás para
+  funcionar. Si cambiar un detalle de una obliga a tocar otras dos, dilo y
+  propone la costura que lo evita.
+- **Coherencia con los ADR del proyecto**: si el proyecto guarda decisiones
+  de arquitectura escritas (ADR o equivalente), la propuesta las respeta o
+  dice cuál contradice y por qué hay que revisarla. Contradecir una decisión
+  escrita sin nombrarla es reabrirla a escondidas.
 - **El orden**: qué pieza tiene que existir antes que cuál para que el trabajo
   se pueda entregar por partes en vez de en un único salto grande.
 - **Lo que la forma elegida cuesta ejecutar**: cuántas veces se recorre o se
@@ -35,7 +48,10 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
   de eso queda fijada por la estructura. Rendimiento y escalabilidad son tuyos
   y se deciden aquí, como parte del diseño: lo que la forma fija no se
   optimiza después sin rehacerla. No mides ni afinas nada; dices qué coste
-  trae de serie cada opción y por qué eso inclina la elección.
+  trae de serie cada opción y por qué eso inclina la elección. Si la tarea
+  lanza además un rol de rendimiento, el coste fino de ejecución (bucles
+  calientes, copias, medición) es suyo; la escalabilidad que fija la forma
+  sigue siendo tuya.
 - **Alternativas reales**: al menos una que descartas, con el motivo. "No hay
   alternativa" casi siempre significa que no se buscó.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-rendimiento.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-rendimiento.md
new file mode 100644
index 0000000..1985498
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-rendimiento.md
@@ -0,0 +1,126 @@
+---
+name: brainstorm-rendimiento
+description: "Rol de rendimiento del brainstorm paralelo de la fase de diseno. Solo se lanza en tareas etiquetadas con rendimiento, wasm, workers o 3d, sumado a los demas roles. Mira el coste de ejecucion con los datos reales: coste algoritmico, asignaciones en bucles calientes, copias entre JS y WASM, Web Workers, mallas y teselas grandes, y que medir antes de optimizar. Propone enfoque; no implementa."
+tools: Read, Grep, Glob
+---
+
+# Rol de rendimiento (brainstorm de diseño)
+
+Eres un punto de vista **condicional**: solo te lanzan cuando la tarea trae
+etiquetas de rendimiento, WASM, Web Workers o 3D, y siempre junto a otros roles
+que trabajan **en paralelo** antes de escribir una sola línea de código. Ellos
+miran la forma del cambio, por dónde se rompe, cómo se prueba y las reglas del
+negocio. Tú no. Tu única pregunta es:
+
+> ¿Cuánto cuesta esto en ejecución con los datos reales, y dónde se va ese coste?
+
+Un agente unificador leerá tu salida junto a las demás. **No promedia: señala
+los desacuerdos.** Tu valor está en poner números y volúmenes donde los demás
+ponen adjetivos.
+
+## Qué miras
+
+- **Coste algorítmico con el volumen real**: qué recorrido crece más que
+  lineal, con cuántos elementos trabaja de verdad la tarea (vértices,
+  teselas, filas, píxeles) y a partir de qué tamaño se nota.
+- **Asignaciones en bucles calientes**: lo que se crea en cada iteración, en
+  cada frame o en cada evento —arrays, objetos, cierres, cadenas— y presiona
+  al recolector de basura justo donde más duele.
+- **Copias entre JS y WASM**: cuántas veces cruza un buffer la frontera, si
+  se copia o se comparte la memoria lineal, y si hay vistas tipadas que se
+  recrean tras cada crecimiento de memoria.
+- **Web Workers y el hilo principal**: qué trabajo bloquea la interfaz, qué
+  se puede mover a un worker, y si los mensajes se clonan o se transfieren
+  (`Transferable`, `SharedArrayBuffer`).
+- **Mallas, teselas y cargas grandes**: memoria de las mallas 3D, de las
+  texturas y de las teselas en vuelo; qué se cachea, qué se libera y cuándo;
+  nivel de detalle y carga progresiva.
+- **Medir con datos reales antes de optimizar**: qué métrica, con qué datos
+  de producción o de tamaño de producción, y qué umbral decide si hace falta
+  optimizar. Sin medida no hay hallazgo, hay una corazonada.
+
+## Qué NO miras
+
+Esto pesa tanto como lo anterior: si repites lo que dicen los otros roles, el
+brainstorm no ha aportado nada.
+
+- **No propones la forma del cambio** ni decides qué escalabilidad fija la
+  estructura: la forma del diseño y su escalabilidad son del rol de
+  arquitectura. Tú dices cuánto cuesta ejecutar la forma que haya.
+- **No enumeras casos límite ni modos de fallo.** Es del rol de riesgos, salvo
+  que el fallo sea quedarse sin memoria o sin tiempo de frame.
+- **No diseñas las pruebas.** Es del rol de testing; tú puedes decir qué
+  medición hace falta, no cómo se automatiza.
+- **No discutes las reglas de negocio.** Son del rol de dominio.
+- **No micro-optimizas sin medida**: una optimización que no puedes ligar a un
+  volumen real o a una medición va a «Suposiciones no verificadas», no a tu
+  propuesta.
+
+## Qué contexto necesitas — y cuál no
+
+Se te entrega solo tu parte, a propósito. El paquete completo de la tarea
+diluye tu punto de vista hacia la media de los demás.
+
+**Necesitas:**
+- El objetivo y los criterios de aceptación de la tarea.
+- El tamaño real de los datos con los que trabaja: número de elementos,
+  tamaño de los ficheros, frecuencia de los eventos.
+- El código de los recorridos y fronteras que la tarea toca: el bucle, el
+  enlace con WASM, el punto donde se habla con el worker.
+- Las mediciones que ya existan (perfiles, tiempos, consumo de memoria), si
+  las hay.
+
+**No necesitas, y no lo pidas salvo que te bloquee de verdad:**
+- El contenido de la suite de pruebas.
+- El glosario del dominio.
+- El historial de incidencias.
+- El código de módulos que no participan en el camino caliente.
+
+Si te falta algo de la primera lista —sobre todo el volumen real de datos—,
+dilo en «Suposiciones no verificadas» y sigue con la mejor estimación que
+puedas justificar: **no te pares, y no lo inventes.**
+
+## Tu salida — formato fijo y acotado
+
+Exactamente estas secciones, en este orden, y nada más. **Máximo 50 líneas en
+total.** Una línea por viñeta. Sin introducción, sin resumen final.
+
+```
+## Donde se va el coste
+- <punto del camino caliente> — <volumen real> — <coste estimado y por que>
+(minimo 2, maximo 5)
+
+## Fronteras caras
+- <JS-WASM | worker | hilo principal | carga> — <que cruza y cuantas veces> — <propuesta>
+(0 a 4; escribe "ninguna" si la tarea no cruza ninguna)
+
+## Que medir antes de optimizar
+- <metrica> — <con que datos> — <umbral que decide>
+(minimo 1, maximo 3)
+
+## Optimizacion que no harias todavia
+- <optimizacion tentadora> — <por que esperar a medir>
+(minimo 1, maximo 1)
+
+## Desacuerdos previstos
+- <con que rol> — <sobre que> — <tu posicion>
+(0 a 3; escribe "ninguno previsto" si de verdad no lo hay)
+
+## Suposiciones no verificadas
+- <suposicion> — <que habria que medir o mirar para confirmarla>
+(0 a 5)
+```
+
+## Reglas que no se negocian
+
+1. **Propones enfoque, no lo implementas.** No escribes ni modificas código de
+   producción, ni ficheros de ningún tipo. Cinco líneas de ejemplo como
+   máximo, dentro de tu salida, si una firma o un patrón lo aclara.
+2. **Señala el desacuerdo, no lo suavices.** Si la forma que propone otro rol
+   cuesta demasiado con los datos reales, dilo con el número delante. Un
+   consenso fingido le llega al unificador como acuerdo y ya nadie vuelve a
+   mirarlo.
+3. **Distingue lo verificado de lo supuesto.** Un coste que no has medido ni
+   calculado sobre un volumen real va a «Suposiciones no verificadas».
+4. **Lo que no cabe en el formato se cae.** El tope de longitud es parte del
+   diseño: prioriza el coste más grande y suelta la cola.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
index f232545..748c510 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
@@ -37,6 +37,13 @@ conflicto reaparece cuando ya hay código escrito.
   por tus manos.
 - **Lo que necesita decidir una persona** antes de implementar: lo que quedó
   abierto, lo que ningún rol pudo fundamentar, y lo caro de deshacer.
+- **La salida de rendimiento, cuando existe**: es un rol condicional, que solo
+  se lanza si la tarea trae etiquetas de rendimiento, WASM, workers o 3D. Sus
+  costes y mediciones entran en el plan atribuidos a él; su choque con la forma
+  que propone el rol de arquitectura es un desacuerdo como cualquier otro, y
+  lo que pida medir antes de optimizar va al plan de pruebas o a la decisión
+  humana. Si la petición no lista una salida de rendimiento, no falta nada: no
+  la nombres en las salidas que faltaron.
 
 ## Qué NO miras
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index f9a64a1..33dbe80 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -211,14 +211,46 @@ mas evento cuando el padre es el dueno del dato, en vez de un enlace
 bidireccional que difumina quien manda. Y que no se manipule el DOM interno
 de un hijo desde el padre.
 
-**Accesibilidad.** Elementos interactivos que son un `div` con un manejador
-de clic, sin rol, sin poder recibir foco y sin responder al teclado. Campos
-sin etiqueta asociada. Imagenes sin texto alternativo, o con uno redundante.
-Dialogos que no atrapan el foco, no lo devuelven al cerrarse y no responden
-a Escape. Atributos ARIA que contradicen el rol del elemento o que apuntan a
-un identificador que no existe. Estados que cambian sin anunciarse. Foco
-visible eliminado sin nada que lo sustituya. Y el orden del DOM discrepando
-del orden visual.
+**Accesibilidad (WCAG 2.2).** Cada hallazgo cita el criterio de exito que
+incumple, con su numero, y el elemento concreto; "no es accesible" no es un
+hallazgo. Lo que se mira en el diff:
+
+- **Contraste** (1.4.3 texto, nivel AA; 1.4.11 contraste de componentes y
+  del indicador de foco). Texto normal por debajo de 4.5:1, texto grande o
+  bordes de controles por debajo de 3:1. Si los colores salen de variables
+  CSS o de un tema que el diff no muestra, el contraste no se puede verificar
+  desde aqui: se anota como comprobacion pendiente, nunca como CRITICO.
+- **Orden y visibilidad del foco** (2.4.3 orden del foco; 2.4.7 foco
+  visible; 2.4.11 foco no oculto, nuevo en 2.2). El orden de tabulacion
+  sigue al orden visual, sin `tabindex` positivos; `outline: none` sin un
+  sustituto visible; un control enfocado tapado por una cabecera fija, un
+  banner o un panel.
+- **Trampas de teclado** (2.1.1 teclado; 2.1.2 sin trampas de teclado).
+  Todo lo que se hace con el raton se hace con el teclado: un `div` con
+  manejador de clic sin rol, sin `tabindex="0"` y sin responder a Enter y
+  Espacio. Y del foco siempre se sale: un componente que lo retiene sin una
+  salida con Escape o Tab es una trampa.
+- **Etiquetas y ARIA en controles** (1.3.1 informacion y relaciones; 3.3.2
+  etiquetas o instrucciones; 4.1.2 nombre, rol y valor). Campos sin `label`
+  asociado o con un placeholder como unica etiqueta; atributos `aria-*` que
+  contradicen el rol nativo o apuntan a un `id` que no existe; estados
+  (`aria-expanded`, `aria-checked`, `aria-invalid`) que no cambian cuando
+  cambia el estado real; cambios de estado que no se anuncian (4.1.3
+  mensajes de estado).
+- **Nombre accesible de iconos y botones** (1.1.1 contenido no textual;
+  2.5.3 etiqueta en el nombre; 4.1.2). Boton que solo contiene un icono sin
+  `aria-label` ni texto oculto; icono decorativo sin `aria-hidden="true"`;
+  imagenes sin texto alternativo o con uno redundante; un nombre accesible
+  que no contiene el texto visible del boton.
+- **Dialogos modales** (2.1.2; 2.4.3; 4.1.2). El dialogo tiene
+  `role="dialog"` o el `<dialog>` nativo, `aria-modal` y un nombre
+  (`aria-labelledby`); al abrir mueve el foco dentro, lo mantiene dentro
+  mientras esta abierto, se cierra con Escape y al cerrar devuelve el foco
+  al elemento que lo abrio. El contenido de detras no es alcanzable con
+  Tab.
+
+Ademas: el orden del DOM no discrepa del orden visual, y los objetivos
+tactiles no bajan de 24 por 24 pixeles (2.5.8, nuevo en 2.2).
 
 **Rendimiento de renderizado.** Listas sin identidad estable (`trackBy`
 ausente, o la clave puesta al indice en una lista que se reordena o se
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 9b07d88..1812fcf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -226,10 +226,10 @@ escribe lo que alguien tiene que disparar despues.
 
 **Lo que resuelve el CLI, sin llamar a nadie.** Cuantos roles entran, por una
 tabla por complejidad que trae el plugin, y cuales, por un orden de prioridad
-fijo: **arquitectura, riesgos, testing, dominio**. Con un solo rol entra
-arquitectura, que es el unico que propone una forma para el cambio; el primero
-que se cae es dominio. Pueden salir **cero roles**: no hay brainstorm y el plan
-se redacta a partir del enunciado.
+fijo: **arquitectura, riesgos, testing, dominio** (con uno, arquitectura: la
+unica que propone una forma). Con **cero roles** el plan sale del enunciado.
+Las etiquetas `rendimiento`, `wasm`, `workers` o `3d` suman **rendimiento**
+si ya entran 2 roles o mas; si no, `plan` lo avisa.
 
 Sin complejidad declarada (`null`) decide la tabla, que calcula leyendo la
 tarea; declarada, se toma el **mayor** de las dos. Si difieren, el comando lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 9f8124f..05a28e3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -588,7 +588,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     try {
       const result = await runPlanCommand(tareasRoot, argv.slice(1), today(), { repoCwd, ahora: ahora() });
       printBaseBranchSwitchNotice(result.baseBranchGuard);
-      printAvisos(result.avisoIdentidad, ...result.avisosEnunciado);
+      printAvisos(result.avisoIdentidad, ...result.avisosEnunciado, ...result.avisosRoles);
       // Tres desenlaces posibles desde TASK-027 (item C3): scaffold
       // nuevo, plan que ya estaba en planificacion/, o plan legado
       // suelto en la raiz que esta invocacion acaba de mover ahi.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index f86e078..785d1d5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -29,9 +29,22 @@ import {
 } from '../core/transiciones.js';
 import { resolverConfig } from '../core/config.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
-import { planTemplate, resolverPlanFinal, type PlanFinalUbicacion } from './plan.js';
-import { readFile } from 'node:fs/promises';
-import { ROLES_BRAINSTORM, seleccionarRoles } from '../core/roles-brainstorm.js';
+import {
+  planTemplate,
+  resolverPlanFinal,
+  BRAINSTORM_DIRNAME,
+  PLANIFICACION_DIRNAME,
+  type PlanFinalUbicacion,
+} from './plan.js';
+import { readFile, readdir } from 'node:fs/promises';
+import {
+  ROLES_BRAINSTORM,
+  TODOS_LOS_ROLES,
+  seleccionarRoles,
+  seleccionarRolesDeTarea,
+  type RolBrainstorm,
+} from '../core/roles-brainstorm.js';
+import { nombrePeticionRol } from '../core/plan-brainstorm.js';
 import { planEsEsqueleto } from '../core/validacion-tarea.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
 import {
@@ -228,14 +241,54 @@ function extraerDecididoPor(argv: readonly string[]): { decididoPor: DecididoPor
 }
 
 /**
- * ¿El plan-final.md es la plantilla sin rellenar? Se compara con las
- * plantillas posibles (los roles se eligen en un orden fijo, asi que solo
- * hay 0..N prefijos). Lo comparten approve y `taskctl siguiente` (TASK-056).
+ * Los juegos de roles que de verdad se lanzaron, uno por ronda, leidos de
+ * las peticiones de `planificacion/brainstorm/` (TASK-080). Es lo que
+ * escribio `plan`, y no depende de las etiquetas de hoy: si cambiaron entre
+ * `plan` y `approve`, la plantilla vacia se sigue reconociendo.
+ */
+async function juegosDeRolesEnDisco(rutaPlan: string): Promise<RolBrainstorm[][]> {
+  const dir = path.dirname(rutaPlan);
+  // Canonica: planificacion/plan-final.md. Legada: plan-final.md suelto.
+  const candidatas = [
+    path.join(dir, BRAINSTORM_DIRNAME),
+    path.join(dir, PLANIFICACION_DIRNAME, BRAINSTORM_DIRNAME),
+  ];
+  const juegos: RolBrainstorm[][] = [];
+  for (const brainstormDir of candidatas) {
+    let ficheros: string[];
+    try {
+      ficheros = await readdir(brainstormDir);
+    } catch {
+      continue;
+    }
+    const rondas = new Set<number>();
+    for (const f of ficheros) {
+      const m = /^peticion-brainstorm-[a-z0-9-]+-(\d+)\.md$/.exec(f);
+      if (m !== null) rondas.add(Number(m[1]));
+    }
+    for (const n of rondas) {
+      juegos.push(TODOS_LOS_ROLES.filter((r) => ficheros.includes(nombrePeticionRol(r, n))));
+    }
+  }
+  return juegos;
+}
+
+/**
+ * ¿El plan-final.md es la plantilla sin rellenar? Se compara con todas las
+ * plantillas posibles: los prefijos de la escalera, los juegos que darian
+ * las etiquetas de hoy y, sobre todo, los juegos que se lanzaron de verdad
+ * segun el disco (TASK-080: con un rol condicional los roles ya no son
+ * siempre un prefijo, y una plantilla con "rendimiento" no casaba con
+ * ninguna y se daba por redactada). Lo comparten approve y
+ * `taskctl siguiente` (TASK-056).
  */
 export async function planEsPlantilla(task: Task, rutaPlan: string): Promise<boolean> {
-  const plantillas = Array.from({ length: ROLES_BRAINSTORM.length + 1 }, (_, k) =>
-    planTemplate(task, seleccionarRoles(k))
-  );
+  const juegos: (readonly RolBrainstorm[])[] = [];
+  for (let k = 0; k <= ROLES_BRAINSTORM.length; k++) {
+    juegos.push(seleccionarRoles(k), seleccionarRolesDeTarea(k, task.etiquetas));
+  }
+  juegos.push(...(await juegosDeRolesEnDisco(rutaPlan)));
+  const plantillas = juegos.map((roles) => planTemplate(task, roles));
   return planEsEsqueleto(await readFile(rutaPlan, 'utf8'), plantillas);
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 85a4cae..f328a1b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -53,8 +53,10 @@ import {
   type ResolucionAgentes,
 } from '../core/heuristica.js';
 import {
-  seleccionarRoles,
-  ROLES_BRAINSTORM,
+  seleccionarRolesDeTarea,
+  condicionalesDescartados,
+  TODOS_LOS_ROLES,
+  MIN_ROLES_PARA_CONDICIONALES,
   type RolBrainstorm,
 } from '../core/roles-brainstorm.js';
 import {
@@ -263,6 +265,11 @@ export function planTemplate(task: Task, roles: readonly RolBrainstorm[]): strin
 export interface PlanCommandResult {
   /** TASK-043: avisos de la validacion del enunciado (no bloquean). */
   avisosEnunciado: string[];
+  /**
+   * TASK-080: roles condicionales que las etiquetas dispararian y no entran
+   * porque la escalera lanza menos de MIN_ROLES_PARA_CONDICIONALES.
+   */
+  avisosRoles: string[];
   id: string;
   filePath: string;
   planPath: string;
@@ -474,7 +481,15 @@ export async function runPlanCommand(
   // se entere de que el brainstorm no se hizo.
   const heuristica = cargarHeuristica();
   const resolucion = resolverNumeroAgentes(task, body, heuristica);
-  const roles = seleccionarRoles(resolucion.agentes);
+  // TASK-080: los N de la escalera mas los condicionales que disparan las
+  // etiquetas (rendimiento). Ya no son siempre un prefijo de la escalera.
+  const roles = seleccionarRolesDeTarea(resolucion.agentes, task.etiquetas);
+  const avisosRoles = condicionalesDescartados(resolucion.agentes, task.etiquetas).map(
+    ({ rol, etiqueta }) =>
+      `La etiqueta "${etiqueta}" pediria el rol ${rol.titulo} (${rol.id}), pero no se lanza: ` +
+      `esta tarea resuelve menos de ${MIN_ROLES_PARA_CONDICIONALES} roles de brainstorm y sin ` +
+      'unificador ese rol quedaria como autor unico del plan. Si hace falta, sube la complejidad.'
+  );
 
   // --- Seleccion determinista de skill (seccion 6.6/16.4.1, TASK-017) -
   // Mismo criterio fail-closed que la heuristica de arriba, y por eso
@@ -914,7 +929,7 @@ export async function runPlanCommand(
       ? roles
       : rondaRoles === null
       ? []
-      : ROLES_BRAINSTORM.filter((r) =>
+      : TODOS_LOS_ROLES.filter((r) =>
           [...enBrainstorm, ...(relanzarRoles ? roles.map((x) => nombrePeticionRol(x, ronda)) : [])]
             .includes(nombrePeticionRol(r, rondaRoles as number))
         );
@@ -944,7 +959,7 @@ export async function runPlanCommand(
     const sufijo = `-${rondaRoles}.md`;
     for (const nombre of await listarDir(brainstormDir)) {
       if (!nombre.startsWith('salida-brainstorm-') || !nombre.endsWith(sufijo)) continue;
-      const rol = ROLES_BRAINSTORM.find((r) => nombre === nombreSalidaRol(r, rondaRoles as number));
+      const rol = TODOS_LOS_ROLES.find((r) => nombre === nombreSalidaRol(r, rondaRoles as number));
       salidasAConsolidar.push({
         nombre,
         // Sin el "rol" delante salia "— rol rol desconocido" para una
@@ -1053,6 +1068,7 @@ export async function runPlanCommand(
 
   return {
     avisosEnunciado,
+    avisosRoles,
     autoCommit: commitResult,
     id: task.id,
     filePath: newFilePath,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roles-brainstorm.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roles-brainstorm.ts
index e5e86d5..171d065 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roles-brainstorm.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roles-brainstorm.ts
@@ -29,14 +29,27 @@
  * caliente (leer cuatro ficheros en cada `plan` para verificar una
  * constante es gasto sin retorno): lo comprueba la suite, en las dos
  * direcciones, contra el contenido real de agents/.
+ *
+ * ROLES CONDICIONALES (TASK-080). Ademas de la escalera de prioridad hay
+ * roles que no compiten por el presupuesto N: entran por las ETIQUETAS
+ * de la tarea y se suman a los N de la escalera. El primero es
+ * rendimiento (wasm, workers, 3d, carga pesada). Con eso los roles de una
+ * tarea dejan de ser siempre un prefijo de ROLES_BRAINSTORM: quien
+ * necesite saber que roles lleva una tarea usa seleccionarRolesDeTarea,
+ * y quien busque un rol por nombre (salidas en disco) usa
+ * TODOS_LOS_ROLES. Un condicional solo se suma cuando la escalera ya
+ * lanza MIN_ROLES_PARA_CONDICIONALES o mas: con 0 o 1 rol no hay
+ * unificador, y el condicional quedaria como autor unico de un plan
+ * cuya forma no le toca proponer (decision de la persona en TASK-080).
  */
 
-/** Los cuatro roles, en orden de prioridad. Es tambien el tipo de `id`. */
+/** Los roles de la escalera, en orden de prioridad, y los condicionales. */
 export type RolBrainstormId =
   | 'brainstorm-arquitectura'
   | 'brainstorm-riesgos'
   | 'brainstorm-testing'
-  | 'brainstorm-dominio';
+  | 'brainstorm-dominio'
+  | 'brainstorm-rendimiento';
 
 export interface RolBrainstorm {
   /** Igual al `name:` del frontmatter de agents/<id>.md. */
@@ -157,6 +170,52 @@ export const ROLES_BRAINSTORM: readonly RolBrainstorm[] = Object.freeze([
   }),
 ]);
 
+/** Un rol que entra por las etiquetas de la tarea, fuera del presupuesto N. */
+export interface RolCondicional {
+  rol: RolBrainstorm;
+  /** Etiquetas que lo disparan, en minusculas. Basta con que la tarea lleve una. */
+  etiquetas: readonly string[];
+}
+
+export const ROLES_CONDICIONALES: readonly RolCondicional[] = Object.freeze([
+  Object.freeze({
+    rol: Object.freeze({
+      id: 'brainstorm-rendimiento',
+      titulo: 'rendimiento',
+      pregunta: '¿Cuanto cuesta esto en ejecucion con los datos reales, y donde se va ese coste?',
+      mira: Object.freeze([
+        'El coste algoritmico con el volumen real de datos: que crece mas que lineal y a partir de que tamaño se nota.',
+        'Las asignaciones y copias en los bucles calientes: lo que se crea en cada iteracion o en cada frame.',
+        'Las fronteras caras: copias entre JS y WASM, mensajes y transferibles hacia Web Workers, lo que bloquea el hilo principal.',
+        'Las cargas grandes: mallas 3D, teselas e imagenes pesadas, cuanta memoria ocupan y cuando se liberan.',
+        'Como se mide antes de optimizar: con que datos reales, que metrica y que umbral decide si hace falta.',
+      ]),
+      noMira: Object.freeze([
+        'La forma del cambio y la escalabilidad que fija el diseño (es del rol de arquitectura).',
+        'Por donde se rompe (es del rol de riesgos).',
+        'Que aserciones escribir (es del rol de testing).',
+        'Las reglas de negocio (son del rol de dominio).',
+      ]),
+      entregables: Object.freeze([
+        'Donde se va el coste, con el volumen de datos real de cada punto',
+        'Fronteras caras: JS-WASM, Web Workers e hilo principal',
+        'Que medir antes de optimizar, con que datos y que umbral',
+        'La optimizacion que NO harias todavia (UNA sola)',
+      ]),
+    }),
+    etiquetas: Object.freeze(['rendimiento', 'wasm', 'workers', '3d']),
+  }),
+]);
+
+/** Escalera + condicionales: para buscar un rol por nombre (salidas en disco). */
+export const TODOS_LOS_ROLES: readonly RolBrainstorm[] = Object.freeze([
+  ...ROLES_BRAINSTORM,
+  ...ROLES_CONDICIONALES.map((c) => c.rol),
+]);
+
+/** Por debajo de este numero de roles de la escalera no se suma ningun condicional. */
+export const MIN_ROLES_PARA_CONDICIONALES = 2;
+
 /** El id del agente unificador. No es un rol de brainstorm: consolida los que hay. */
 export const UNIFICADOR_ID = 'brainstorm-unificador';
 
@@ -180,3 +239,46 @@ export function seleccionarRoles(n: number): readonly RolBrainstorm[] {
   }
   return ROLES_BRAINSTORM.slice(0, n);
 }
+
+/** La etiqueta de la tarea que dispara el condicional, o null. Sin distinguir mayusculas. */
+function etiquetaQueDispara(c: RolCondicional, etiquetas: readonly string[]): string | null {
+  for (const e of etiquetas) {
+    if (c.etiquetas.includes(e.trim().toLowerCase())) return e;
+  }
+  return null;
+}
+
+/**
+ * Los roles que lanza una tarea: los `n` de la escalera y, si son al menos
+ * MIN_ROLES_PARA_CONDICIONALES, los condicionales que disparan sus
+ * etiquetas, al final y en el orden de ROLES_CONDICIONALES.
+ */
+export function seleccionarRolesDeTarea(
+  n: number,
+  etiquetas: readonly string[]
+): readonly RolBrainstorm[] {
+  const base = seleccionarRoles(n);
+  if (base.length < MIN_ROLES_PARA_CONDICIONALES) return base;
+  return [
+    ...base,
+    ...ROLES_CONDICIONALES.filter((c) => etiquetaQueDispara(c, etiquetas) !== null).map((c) => c.rol),
+  ];
+}
+
+/**
+ * Los condicionales que las etiquetas disparan pero que no entran porque la
+ * escalera lanza menos de MIN_ROLES_PARA_CONDICIONALES. `plan` lo avisa:
+ * quien puso la etiqueta tiene que saber por que el rol no se lanzo.
+ */
+export function condicionalesDescartados(
+  n: number,
+  etiquetas: readonly string[]
+): readonly { rol: RolBrainstorm; etiqueta: string }[] {
+  if (seleccionarRoles(n).length >= MIN_ROLES_PARA_CONDICIONALES) return [];
+  const fuera: { rol: RolBrainstorm; etiqueta: string }[] = [];
+  for (const c of ROLES_CONDICIONALES) {
+    const etiqueta = etiquetaQueDispara(c, etiquetas);
+    if (etiqueta !== null) fuera.push({ rol: c.rol, etiqueta });
+  }
+  return fuera;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts
index f1817c9..2323029 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts
@@ -77,8 +77,18 @@ const FICHEROS = ROLES.map((r) => `${r}.md`);
  */
 const FICHERO_UNIFICADOR = `${UNIFICADOR_ID}.md`;
 
-/** Todo lo que vive en agents/: los cuatro roles mas el unificador. */
-const AGENTES = [...FICHEROS, FICHERO_UNIFICADOR];
+/**
+ * Roles condicionales (TASK-080): entran por las etiquetas de la tarea y
+ * se suman a la escalera sin gastar presupuesto. Viven aparte de ROLES
+ * por lo mismo que el unificador: el test 14b deriva de `FICHEROS.length`
+ * cuantos caben en `critica`, y el 13b mide el reparto entre los roles
+ * de la escalera. Si entraran en FICHEROS, ninguno de los dos mediria lo
+ * que dice. Si pasan los tests 2 a 13 como cualquier agente.
+ */
+const FICHEROS_CONDICIONALES = ['brainstorm-rendimiento.md'];
+
+/** Todo lo que vive en agents/: la escalera, los condicionales y el unificador. */
+const AGENTES = [...FICHEROS, ...FICHEROS_CONDICIONALES, FICHERO_UNIFICADOR];
 
 /** Claves que se admiten en el frontmatter de un agente. Nada mas. */
 const CLAVES_PERMITIDAS = new Set(['name', 'description', 'tools', 'model']);
@@ -408,7 +418,7 @@ test('el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)', asy
 
 // --- 1. Estructurales ---------------------------------------------------
 
-test('1. agents/ contiene los cuatro roles y el unificador, esos y solo esos', async () => {
+test('1. agents/ contiene los roles de la escalera, los condicionales y el unificador, esos y solo esos', async () => {
   // En Windows el filesystem es case-insensitive: un stat() de la ruta NO
   // demuestra el case. El listado del directorio si lo demuestra.
   const enAgents = await readdir(AGENTS_DIR);
@@ -866,6 +876,53 @@ test('13b. rendimiento y escalabilidad los reclama un solo rol y los ceden los o
   );
 });
 
+// Mutacion: borrar de brainstorm-rendimiento.md la vineta de copias entre JS y WASM -> rojo.
+// Mutacion: quitar de su "Qué NO miras" la frase que cede la escalabilidad a arquitectura -> rojo.
+test('13c. el rol de rendimiento mira sus seis temas y cede la forma y la escalabilidad a arquitectura', async () => {
+  const { body } = parseFrontmatter(await leerTexto('brainstorm-rendimiento.md'));
+  const queMira = normalizar(entre(body, '## Qué miras', '## Qué NO miras'));
+  const queNoMira = normalizar(entre(body, '## Qué NO miras', '\n## '));
+  assert.ok(queMira !== '' && queNoMira !== '', 'no se aislan las dos secciones');
+  const temas: ReadonlyArray<readonly [string, RegExp]> = [
+    ['coste algoritmico', /coste algorítmico/i],
+    ['asignaciones en bucles calientes', /asignaciones en bucles calientes/i],
+    ['copias JS-WASM', /copias entre JS y WASM/i],
+    ['Web Workers', /Web Workers/],
+    ['mallas y teselas', /mallas.*teselas/i],
+    ['medir con datos reales antes de optimizar', /medir con datos reales antes de optimizar/i],
+  ];
+  const faltan = temas.filter(([, re]) => !re.test(queMira)).map(([t]) => t);
+  assert.deepEqual(faltan, [], `brainstorm-rendimiento.md no mira: ${faltan.join(', ')}`);
+  // Ceder es nombrar a quien, en la misma frase. Se mide con
+  // "escalabilidad" y no con "rendimiento": el rol se llama asi, y
+  // cualquier frase que lo nombre cumpliria una asercion sobre esa palabra.
+  assert.ok(
+    frasesDe(queNoMira).some((f) => /escalabilidad/i.test(f) && /\barquitectura\b/i.test(f)),
+    'brainstorm-rendimiento.md no cede la escalabilidad al rol de arquitectura en ninguna frase'
+  );
+  for (const otro of ['riesgos', 'testing', 'dominio']) {
+    assert.match(queNoMira, new RegExp(`\\b${otro}\\b`, 'i'), `no cede nada al rol de ${otro}`);
+  }
+});
+
+// Mutacion: borrar la vineta de la direccion de las dependencias de brainstorm-arquitectura.md -> rojo.
+// Mutacion: mover la vineta de los ADR a "Qué NO miras" -> rojo.
+test('13d. el rol de arquitectura mira limites, dependencias, acoplamiento y ADR, y no los cede', async () => {
+  const { body } = parseFrontmatter(await leerTexto('brainstorm-arquitectura.md'));
+  const queMira = normalizar(entre(body, '## Qué miras', '## Qué NO miras'));
+  const queNoMira = normalizar(entre(body, '## Qué NO miras', '\n## '));
+  const temas: ReadonlyArray<readonly [string, RegExp]> = [
+    ['limites entre modulos', /límites entre módulos/i],
+    ['direccion de las dependencias', /dirección de las dependencias/i],
+    ['acoplamiento', /acoplamiento/i],
+    ['ADR', /\bADR\b/],
+  ];
+  const faltan = temas.filter(([, re]) => !re.test(queMira)).map(([t]) => t);
+  assert.deepEqual(faltan, [], `brainstorm-arquitectura.md no mira: ${faltan.join(', ')}`);
+  const cedidos = temas.filter(([, re]) => re.test(queNoMira)).map(([t]) => t);
+  assert.deepEqual(cedidos, [], `brainstorm-arquitectura.md cede en "Qué NO miras": ${cedidos.join(', ')}`);
+});
+
 test('14. el rol de testing deja escrita la alternativa de degradarlo a checklist del unificador', async () => {
   const plano = normalizar(parseFrontmatter(await leerTexto('brainstorm-testing.md')).body);
   assert.ok(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index f0de50f..469a437 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -29,6 +29,7 @@ import {
   PLAN_FINAL_FILENAME as PLAN_FINAL_NOMBRE,
 } from '../../src/commands/plan.js';
 import { ROLES_BRAINSTORM } from '../../src/core/roles-brainstorm.js';
+import { runApproveCommand, ApproveCommandError } from '../../src/commands/approve.js';
 import {
   nombrePeticionRol,
   nombreSalidaRol,
@@ -1538,3 +1539,163 @@ test('src/ no contiene ninguna invocacion a un modelo ni ninguna llamada de red'
     }
   }
 });
+
+// ─── TASK-080: el rol condicional de rendimiento ───────────────────────
+
+/** Los ficheros de una ronda 1 de unificador con estos roles, escritos a mano. */
+function ficherosDeRonda(ids: readonly string[]): string[] {
+  return ids
+    .flatMap((id) => [`peticion-${id}-1.md`, `salida-${id}-1.md`])
+    .concat(['peticion-unificador-1.md'])
+    .sort();
+}
+
+/**
+ * Mutaciones que lo ponen rojo: quitar una etiqueta de rendimiento del
+ * nucleo (rojo ese caso); comparar sin pasar a minusculas (rojo 'WASM');
+ * volver a `seleccionarRoles(resolucion.agentes)` en plan (rojos todos);
+ * buscar las salidas solo en ROLES_BRAINSTORM (la peticion del unificador
+ * titula "rol ya no declarado en el plugin").
+ */
+for (const etiqueta of ['rendimiento', 'wasm', 'workers', '3d', 'WASM']) {
+  test(`plan (TASK-080): una tarea media con la etiqueta "${etiqueta}" lanza rendimiento ademas de sus 2 roles`, async () => {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media', etiquetas: [etiqueta] }), BODY);
+      commitAll(repoRoot, 'tarea TASK-800');
+
+      const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
+
+      assert.deepEqual(
+        result.roles.map((r) => r.id),
+        ['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-rendimiento']
+      );
+      assert.equal(result.modo, 'unificador');
+      assert.deepEqual(result.avisosRoles, []);
+      const dir = brainstormDir(result.filePath);
+      assert.deepEqual(
+        (await readdir(dir)).sort(),
+        ficherosDeRonda(['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-rendimiento'])
+      );
+
+      const unificador = await readFile(path.join(dir, 'peticion-unificador-1.md'), 'utf8');
+      assert.match(unificador, /`salida-brainstorm-rendimiento-1\.md` — rol rendimiento/);
+      assert.doesNotMatch(unificador, /ya no declarado/);
+
+      const peticion = await readFile(path.join(dir, 'peticion-brainstorm-rendimiento-1.md'), 'utf8');
+      assert.match(peticion, /lanzalo con el agente de ese mismo nombre/);
+      assert.match(peticion, /\*\*arquitectura\*\*, \*\*riesgos\*\*/);
+      const salida = await readFile(path.join(dir, 'salida-brainstorm-rendimiento-1.md'), 'utf8');
+      assert.match(salida, /## Que medir antes de optimizar, con que datos y que umbral/);
+
+      const plan = await readFile(result.planPath, 'utf8');
+      assert.match(plan, /3 roles de brainstorm/);
+      assert.match(plan, /arquitectura, riesgos, rendimiento/);
+    });
+  });
+}
+
+/**
+ * Mutacion que lo pone rojo: lanzar el rol siempre, o comparar con un
+ * `includes` sobre las etiquetas unidas en una cadena ('web-workers'
+ * contiene 'workers', 'wasmtime' contiene 'wasm').
+ */
+for (const etiquetas of [[], ['web-workers'], ['wasmtime'], ['performance']]) {
+  test(`plan (TASK-080): con etiquetas ${JSON.stringify(etiquetas)} no se lanza rendimiento`, async () => {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media', etiquetas }), BODY);
+      commitAll(repoRoot, 'tarea TASK-800');
+
+      const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
+
+      assert.deepEqual(result.roles.map((r) => r.id), ['brainstorm-arquitectura', 'brainstorm-riesgos']);
+      assert.deepEqual(result.avisosRoles, []);
+      assert.deepEqual(
+        (await readdir(brainstormDir(result.filePath))).sort(),
+        ficherosDeRonda(['brainstorm-arquitectura', 'brainstorm-riesgos'])
+      );
+    });
+  });
+}
+
+/**
+ * Decision de la persona en TASK-080: con 0 o 1 rol de la escalera
+ * rendimiento no entra, y plan lo avisa. Con 4 se suma: 5 peticiones.
+ * Mutacion: quitar el corte por MIN_ROLES_PARA_CONDICIONALES (simple pasa
+ * a modo unificador con 2 roles, trivial lanza un rol sin unificador);
+ * dejar `avisosRoles` vacio siempre (rojo el aviso).
+ */
+test('plan (TASK-080): simple y trivial con "wasm" no lanzan rendimiento y lo avisan; critica lo suma', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple', etiquetas: ['wasm'] }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+    const simple = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
+    assert.equal(simple.modo, 'redaccion');
+    assert.deepEqual(simple.roles.map((r) => r.id), ['brainstorm-arquitectura']);
+    assert.deepEqual(await readdir(brainstormDir(simple.filePath)), ['peticion-plan-1.md']);
+    assert.equal(simple.avisosRoles.length, 1);
+    assert.match(simple.avisosRoles[0]!, /"wasm".*rendimiento.*no se lanza/);
+    commitAll(repoRoot, 'plan TASK-800');
+
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-801', rama: 'feature/task-801-p', complejidad: 'trivial', etiquetas: ['3d'] }),
+      BODY
+    );
+    commitAll(repoRoot, 'tarea TASK-801');
+    const trivial = await runPlanCommand(tareasRoot, ['TASK-801'], '2026-09-08', { repoCwd: repoRoot });
+    assert.deepEqual(trivial.roles, []);
+    assert.equal(trivial.avisosRoles.length, 1);
+    assert.match(trivial.avisosRoles[0]!, /"3d"/);
+    commitAll(repoRoot, 'plan TASK-801');
+
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-802', rama: 'feature/task-802-p', complejidad: 'critica', etiquetas: ['wasm'] }),
+      BODY
+    );
+    commitAll(repoRoot, 'tarea TASK-802');
+    const critica = await runPlanCommand(tareasRoot, ['TASK-802'], '2026-09-08', { repoCwd: repoRoot });
+    assert.deepEqual(critica.roles.map((r) => r.id), [
+      'brainstorm-arquitectura',
+      'brainstorm-riesgos',
+      'brainstorm-testing',
+      'brainstorm-dominio',
+      'brainstorm-rendimiento',
+    ]);
+    assert.equal(
+      (await readdir(brainstormDir(critica.filePath))).filter((f) => f.startsWith('peticion-brainstorm-')).length,
+      5
+    );
+  });
+});
+
+/**
+ * El fallo que los tres roles del diseño de TASK-080 dieron por el mas
+ * grave: un plan-final.md sin tocar con rendimiento no casaba con ninguna
+ * plantilla de prefijo y approve lo daba por redactado. Y, por decision de
+ * la persona, los roles salen del disco: quitar la etiqueta entre plan y
+ * approve no cambia el resultado.
+ * Mutacion: volver a solo prefijos en planEsPlantilla -> approve aprueba
+ * (rojo). Quitar la lectura del disco y dejar solo seleccionarRolesDeTarea
+ * -> rojo tras quitar la etiqueta.
+ */
+test('approve (TASK-080): rechaza la plantilla sin rellenar de un plan con rendimiento, aunque cambien las etiquetas', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media', etiquetas: ['wasm'] }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+    await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
+    commitAll(repoRoot, 'plan TASK-800');
+
+    // Se quita la etiqueta: ahora la tarea resolveria 2 roles, sin rendimiento.
+    const leida = await readTareaFile(tareasRoot, 'TASK-800');
+    await writeTareaFile(tareasRoot, { ...leida!.task, etiquetas: [] }, leida!.body);
+    commitAll(repoRoot, 'sin etiqueta');
+
+    await assert.rejects(
+      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot }),
+      (e: unknown) => e instanceof ApproveCommandError && /plantilla sin rellenar/.test(e.message)
+    );
+    const tras = await readTareaFile(tareasRoot, 'TASK-800');
+    assert.equal(tras?.task.plan_aprobado, false);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/roles-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/roles-brainstorm.test.ts
index 127d3ed..d1c05d6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/roles-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/roles-brainstorm.test.ts
@@ -33,9 +33,14 @@ import { fileURLToPath } from 'node:url';
 import { parseFrontmatter } from '../../src/core/frontmatter.js';
 import {
   ROLES_BRAINSTORM,
+  ROLES_CONDICIONALES,
+  TODOS_LOS_ROLES,
+  MIN_ROLES_PARA_CONDICIONALES,
   RolesBrainstormError,
   UNIFICADOR_ID,
+  condicionalesDescartados,
   seleccionarRoles,
+  seleccionarRolesDeTarea,
 } from '../../src/core/roles-brainstorm.js';
 import type { RolBrainstorm, RolBrainstormId } from '../../src/core/roles-brainstorm.js';
 
@@ -63,6 +68,9 @@ const ids = (roles: readonly RolBrainstorm[]): RolBrainstormId[] =>
 /** Los ids como texto llano, para poder compararlos con `UNIFICADOR_ID`. */
 const idsComoTexto = (): string[] => ROLES_BRAINSTORM.map((r) => r.id);
 
+/** Escalera + condicionales (TASK-080): lo que tiene que haber en agents/. */
+const todosComoTexto = (): string[] => TODOS_LOS_ROLES.map((r) => r.id);
+
 /** Los nombres (sin `.md`) de los ficheros de rol que hay en `agents/`. */
 async function rolesEnDisco(): Promise<string[]> {
   const entradas = await readdir(AGENTS_DIR);
@@ -124,8 +132,8 @@ test('0. el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)',
 
 // Mutacion: borrar el rol 'brainstorm-dominio' de ROLES_BRAINSTORM (o crear
 // agents/brainstorm-seguridad.md sin tocar la constante) -> rojo.
-test('1. los ids de ROLES_BRAINSTORM y los ficheros de agents/ son el MISMO conjunto', async () => {
-  const esperados = [...idsComoTexto()].sort();
+test('1. los ids de TODOS_LOS_ROLES (escalera y condicionales) y los ficheros de agents/ son el MISMO conjunto', async () => {
+  const esperados = [...todosComoTexto()].sort();
   // Guard de no-vacuidad: con la constante vacia, la comparacion de
   // abajo seria [] contra [] y este test daria verde sin medir nada.
   assert.ok(
@@ -154,7 +162,7 @@ test('1. los ids de ROLES_BRAINSTORM y los ficheros de agents/ son el MISMO conj
   );
 });
 
-for (const rol of ROLES_BRAINSTORM) {
+for (const rol of TODOS_LOS_ROLES) {
   // Mutacion: cambiar el id 'brainstorm-riesgos' por 'brainstorm-riesgo' en el modulo -> rojo.
   test(`2. ${rol.id}: el id es literalmente el "name:" del frontmatter de agents/${rol.id}.md`, async () => {
     // El listado del directorio, y no un stat() de la ruta: en Windows
@@ -503,3 +511,96 @@ test('10. ningun campo de texto esta vacio y los titulos son todos distintos', (
     `hay titulos repetidos entre los roles: ${titulos.join(', ')}`
   );
 });
+
+// --- 6. Roles condicionales (TASK-080) ---------------------------------
+
+/**
+ * Las etiquetas que disparan rendimiento, escritas A MANO: si se derivan
+ * de la constante, quitar una etiqueta dejaria el test verde.
+ */
+const ETIQUETAS_RENDIMIENTO = ['rendimiento', 'wasm', 'workers', '3d'];
+
+// Mutacion: quitar 'workers' de las etiquetas de rendimiento en el modulo -> rojo.
+test('11. rendimiento es el unico condicional, fuera de la escalera, y lo disparan sus cuatro etiquetas', () => {
+  assert.deepEqual(
+    ROLES_CONDICIONALES.map((c) => c.rol.id),
+    ['brainstorm-rendimiento']
+  );
+  assert.deepEqual([...ROLES_CONDICIONALES[0]!.etiquetas], ETIQUETAS_RENDIMIENTO);
+  // Fuera de la escalera: no compite por el presupuesto N.
+  assert.ok(!idsComoTexto().includes('brainstorm-rendimiento'));
+  assert.deepEqual(
+    todosComoTexto(),
+    [...idsComoTexto(), 'brainstorm-rendimiento'],
+    'TODOS_LOS_ROLES tiene que ser la escalera seguida de los condicionales'
+  );
+  assert.equal(MIN_ROLES_PARA_CONDICIONALES, 2);
+});
+
+// Mutacion: quitar el `if (base.length < MIN_ROLES_PARA_CONDICIONALES) return base` -> rojo (n=0, n=1).
+// Mutacion: quitar el `.toLowerCase()` de la comparacion de etiquetas -> rojo ('WASM').
+test('12. seleccionarRolesDeTarea suma rendimiento solo con 2+ roles y con una etiqueta que lo dispara', () => {
+  const casos: ReadonlyArray<readonly [number, readonly string[], readonly string[]]> = [
+    [0, ['wasm'], []],
+    [1, ['3d'], ['brainstorm-arquitectura']],
+    [2, ['wasm'], ['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-rendimiento']],
+    [3, ['WASM'], ['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-testing', 'brainstorm-rendimiento']],
+    [3, [' Workers '], ['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-testing', 'brainstorm-rendimiento']],
+    [
+      4,
+      ['otra', 'rendimiento', '3d'],
+      [
+        'brainstorm-arquitectura',
+        'brainstorm-riesgos',
+        'brainstorm-testing',
+        'brainstorm-dominio',
+        'brainstorm-rendimiento',
+      ],
+    ],
+    [3, [], ['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-testing']],
+    [3, ['web-workers', 'wasmtime', 'performance'], ['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-testing']],
+  ];
+  for (const [n, etiquetas, esperado] of casos) {
+    assert.deepEqual(
+      ids(seleccionarRolesDeTarea(n, etiquetas)),
+      esperado,
+      `seleccionarRolesDeTarea(${n}, ${JSON.stringify(etiquetas)})`
+    );
+  }
+  // El rango lo sigue guardando seleccionarRoles.
+  assert.throws(() => seleccionarRolesDeTarea(ROLES_BRAINSTORM.length + 1, ['wasm']), RolesBrainstormError);
+});
+
+// Mutacion: devolver [] siempre en condicionalesDescartados -> rojo.
+test('13. condicionalesDescartados nombra el rol y la etiqueta que no entran por falta de roles', () => {
+  assert.deepEqual(
+    condicionalesDescartados(1, ['otra', 'WASM']).map((d) => [d.rol.id, d.etiqueta]),
+    [['brainstorm-rendimiento', 'WASM']]
+  );
+  assert.deepEqual(
+    condicionalesDescartados(0, ['3d']).map((d) => d.rol.id),
+    ['brainstorm-rendimiento']
+  );
+  assert.deepEqual(condicionalesDescartados(2, ['wasm']), [], 'con 2 roles entra: nada que avisar');
+  assert.deepEqual(condicionalesDescartados(1, ['web-workers']), [], 'sin etiqueta que dispare: nada que avisar');
+});
+
+// Mutacion: borrar del noMira de rendimiento la vineta que cede la forma a arquitectura -> rojo.
+test('14. cada condicional cede a los roles de la escalera, nunca a si mismo, y mira algo distinto', () => {
+  for (const { rol } of ROLES_CONDICIONALES) {
+    const texto = rol.noMira.join(' | ');
+    const nombra = (titulo: string): boolean => new RegExp(`\\b${titulo}\\b`, 'i').test(texto);
+    const sinCeder = ROLES_BRAINSTORM.filter((r) => !nombra(r.titulo)).map((r) => r.titulo);
+    assert.deepEqual(sinCeder, [], `"${rol.id}" no cede nada a ${sinCeder.join(', ')}`);
+    assert.equal(nombra(rol.titulo), false, `"${rol.id}" se nombra a si mismo en su noMira`);
+    for (const otro of ROLES_BRAINSTORM) {
+      assert.notEqual(rol.pregunta, otro.pregunta);
+      assert.deepEqual(rol.mira.filter((l) => otro.mira.includes(l)), []);
+    }
+    assert.ok(rol.entregables.length > 0 && rol.mira.length > 0);
+    assert.ok(Object.isFrozen(rol) && Object.isFrozen(rol.mira) && Object.isFrozen(rol.noMira));
+  }
+  assert.ok(Object.isFrozen(ROLES_CONDICIONALES) && Object.isFrozen(TODOS_LOS_ROLES));
+  const titulos = TODOS_LOS_ROLES.map((r) => r.titulo);
+  assert.equal(new Set(titulos).size, titulos.length, 'titulos repetidos entre escalera y condicionales');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts
index 2db5c29..d54a69a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts
@@ -101,10 +101,11 @@ test('skills/ contiene exactamente las skills esperadas, doctor-deploy entre ell
   assert.ok((await readdir(path.join(SKILLS_DIR, 'doctor-deploy'))).includes('SKILL.md'));
 });
 
-test('agents/ contiene los cinco del brainstorm y el revisor de seguridad de doctor-deploy, y nada mas', async () => {
+test('agents/ contiene los del brainstorm y el revisor de seguridad de doctor-deploy, y nada mas', async () => {
   const esperados = [
     'brainstorm-arquitectura.md',
     'brainstorm-dominio.md',
+    'brainstorm-rendimiento.md',
     'brainstorm-riesgos.md',
     'brainstorm-testing.md',
     'brainstorm-unificador.md',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
index bb32fab..11d5138 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
@@ -1216,3 +1216,34 @@ test(
     assert.ok(!salida.includes('✘'), `el validador reporta errores:\n${salida}`);
   }
 );
+
+// TASK-080. Se mira DENTRO del bloque de accesibilidad de "Que se revisa",
+// no en el fichero entero: "accesibilidad", "foco" o "aria" ya salian en
+// la description y en "Reproducir antes de reportar" antes del cambio.
+// Mutacion: cambiar "WCAG 2.2" por "WCAG 2.1" en la skill -> rojo.
+// Mutacion: borrar la vineta del foco no oculto (2.4.11) -> rojo.
+// Mutacion: borrar la vineta de los dialogos modales -> rojo.
+test('14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2', async () => {
+  const texto = await leer('angular-vue-reviewer');
+  const desde = texto.indexOf('**Accesibilidad (WCAG 2.2).**');
+  assert.ok(desde !== -1, 'angular-vue-reviewer no tiene el bloque "Accesibilidad (WCAG 2.2)"');
+  const hasta = texto.indexOf('**Rendimiento de renderizado.**', desde);
+  assert.ok(hasta > desde, 'no se aisla el bloque de accesibilidad');
+  const bloque = texto.slice(desde, hasta).replace(/\s+/g, ' ');
+  assert.ok(texto.indexOf('## Que se revisa') < desde, 'el bloque no esta dentro de "Que se revisa"');
+
+  const temas: ReadonlyArray<readonly [string, RegExp]> = [
+    ['contraste', /\*\*Contraste\*\* \(1\.4\.3/],
+    ['orden y visibilidad del foco', /\*\*Orden y visibilidad del foco\*\* \(2\.4\.3[^)]*2\.4\.7[^)]*2\.4\.11/],
+    ['trampas de teclado', /\*\*Trampas de teclado\*\* \([^)]*2\.1\.2/],
+    ['etiquetas y aria en controles', /\*\*Etiquetas y ARIA en controles\*\* \([^)]*4\.1\.2/],
+    ['nombre accesible de iconos y botones', /\*\*Nombre accesible de iconos y botones\*\* \(1\.1\.1/],
+    ['dialogos modales', /\*\*Dialogos modales\*\* \(2\.1\.2/],
+  ];
+  const faltan = temas.filter(([, re]) => !re.test(bloque)).map(([t]) => t);
+  assert.deepEqual(faltan, [], `el bloque de accesibilidad no cubre: ${faltan.join(', ')}`);
+  assert.match(bloque, /WCAG 2\.2/);
+  assert.doesNotMatch(bloque, /WCAG 2\.[01]\b/);
+  // Un contraste que el diff no deja verificar no puede bloquear el cierre.
+  assert.match(bloque, /nunca como CRITICO/);
+});
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-080/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-080/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-080/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-080/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-080/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-080/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-080/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-080/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-080/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                    | 58 +++++++++++++++++++++++++++++++++++++++++++++++++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       | 14 ++++++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roles-brainstorm.js                               | 86 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 13 files changed, 150 insertions(+), 13 deletions(-)
````
