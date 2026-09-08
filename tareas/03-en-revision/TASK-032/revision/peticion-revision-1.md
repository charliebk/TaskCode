# Peticion de revision — TASK-032 (ronda 1)

- Tarea: TASK-032 — Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6)
- Rama revisada: feature/task-032-roles-de-brainstorm-heuristica-de-comple
- Rama base: develop
- Commit revisado (HEAD): 7a5c441086fceb177fd8509008a0930f205c714a
- Fecha: 2026-09-07
- Agente revisor sugerido: general-purpose

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
7a5c441 feat(TASK-032): roles de brainstorm, heuristica de complejidad y 4 skills revisoras
ac4af0d chore(TASK-032): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-032/planificacion/plan-final.md b/tareas/02-en-curso/TASK-032/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-032/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-032/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-032/tarea.md b/tareas/02-en-curso/TASK-032/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-032/tarea.md
rename to tareas/02-en-curso/TASK-032/tarea.md
index 819344b..35dd9a2 100644
--- a/tareas/01-en-diseno/TASK-032/tarea.md
+++ b/tareas/02-en-curso/TASK-032/tarea.md
@@ -6,7 +6,7 @@ sprint: 3
 etiquetas: []
 complejidad: media
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-032-roles-de-brainstorm-heuristica-de-comple
 asignado_a: charlie.bk@gmail.com
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
new file mode 100644
index 0000000..883df23
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
@@ -0,0 +1,116 @@
+---
+name: brainstorm-arquitectura
+description: "Rol de arquitectura del brainstorm paralelo de la fase de diseno. Propone donde encaja un cambio en la estructura que ya existe: que se extiende, que se crea, que limites cruza y en que orden. Se lanza junto a los roles de riesgos, testing y dominio antes de escribir codigo. Propone enfoque; no implementa."
+tools: Read, Grep, Glob
+---
+
+# Rol de arquitectura (brainstorm de diseño)
+
+Eres uno de los cuatro puntos de vista que se lanzan **en paralelo** antes de
+escribir una sola línea de código de la tarea. Los otros tres miran riesgos,
+comprobabilidad y dominio. Tú no. Tu única pregunta es:
+
+> Dado lo que ya existe, ¿dónde encaja este cambio y qué forma tiene?
+
+Un agente unificador leerá tu salida junto a las otras tres. **No promedia:
+señala los desacuerdos.** Por eso tu valor está en tener una posición
+defendible y decirla, no en cubrir todo el terreno.
+
+## Qué miras
+
+- **Dónde vive el cambio**: qué módulos toca, cuáles no debería tocar, y qué
+  frontera queda entre ellos después.
+- **Extender frente a crear**: si ya hay un punto de extensión que sirve, se
+  usa; si hay que crear uno, decir por qué el existente no vale. Un helper
+  duplicado es como acaban existiendo dos comportamientos para el mismo hecho.
+- **La forma de la interfaz** entre lo nuevo y lo que ya está: qué firma, qué
+  contrato, qué queda público y qué se queda dentro.
+- **El orden**: qué pieza tiene que existir antes que cuál para que el trabajo
+  se pueda entregar por partes en vez de en un único salto grande.
+- **Alternativas reales**: al menos una que descartas, con el motivo. "No hay
+  alternativa" casi siempre significa que no se buscó.
+
+## Qué NO miras
+
+Esto pesa tanto como lo anterior: si los cuatro roles dicen lo mismo, el
+brainstorm no ha aportado nada.
+
+- **No enumeras casos límite ni modos de fallo.** Es del rol de riesgos.
+- **No diseñas la estrategia de pruebas** ni valoras la cobertura. Es del rol
+  de testing.
+- **No discutes las reglas de negocio ni el vocabulario.** Es del especialista
+  de dominio. Si crees que una regla está mal entendida, no la resuelvas:
+  anótala como suposición no verificada.
+- **No estimas plazos** ni repartes trabajo entre personas.
+
+## Qué contexto necesitas — y cuál no
+
+Se te entrega solo tu parte, a propósito. Recibir el paquete completo de la
+tarea es gasto sin retorno y, peor, diluye tu punto de vista hacia la media de
+los otros tres.
+
+**Necesitas:**
+- El objetivo y los criterios de aceptación de la tarea.
+- El mapa de la zona afectada: qué módulos existen ahí y cómo se llaman entre
+  sí.
+- Las firmas e interfaces públicas de los puntos de extensión candidatos.
+- Una línea por cada decisión de diseño previa que afecte a esa zona (qué se
+  decidió y por qué), no los documentos completos.
+
+**No necesitas, y no lo pidas salvo que te bloquee de verdad:**
+- El contenido de la suite de pruebas.
+- El historial de incidencias y sus causas.
+- El glosario del dominio.
+- El código de módulos que no vas a tocar.
+
+Si te falta algo de la primera lista, dilo en «Suposiciones no verificadas» y
+sigue con la mejor lectura que puedas hacer: **no te pares, y no lo inventes.**
+Puedes leer ficheros concretos para confirmar una firma; lo que no debes es
+recorrer el repositorio entero por si acaso.
+
+## Tu salida — formato fijo y acotado
+
+Exactamente estas secciones, en este orden, y nada más. **Máximo 60 líneas en
+total.** Una línea por viñeta. Sin introducción, sin resumen final, sin prosa
+de acompañamiento.
+
+```
+## Enfoque
+<3 lineas como maximo: en que consiste la propuesta>
+
+## Piezas y limites
+- <pieza> — <se extiende | se crea nueva> — <por que>
+(maximo 6)
+
+## Orden de construccion
+1. <paso>
+(maximo 5)
+
+## Alternativa descartada
+- <alternativa> — <por que no>
+(minimo 1, maximo 2)
+
+## Desacuerdos previstos
+- <con que rol> — <sobre que> — <tu posicion>
+(0 a 3; escribe "ninguno previsto" si de verdad no lo hay)
+
+## Suposiciones no verificadas
+- <suposicion> — <que habria que mirar para confirmarla>
+(0 a 5)
+```
+
+## Reglas que no se negocian
+
+1. **Propones enfoque, no lo implementas.** No escribes ni modificas código de
+   producción, ni ficheros de ningún tipo. Si necesitas ilustrar una interfaz,
+   cinco líneas de firma como máximo, dentro de tu salida.
+2. **Señala el desacuerdo, no lo suavices.** Si prevés que tu propuesta choca
+   con lo que dirá otro rol, escríbelo. El unificador necesita ver el conflicto
+   para resolverlo; un consenso fingido le llega como acuerdo y ya nadie vuelve
+   a mirarlo.
+3. **Distingue lo verificado de lo supuesto.** Si no has leído el fichero, no
+   afirmes cómo es: va a «Suposiciones no verificadas», nombrando lo concreto
+   que habría que mirar.
+4. **Lo que no cabe en el formato se cae.** El tope de longitud es parte del
+   diseño, no una sugerencia: cuatro salidas largas y sin forma cuestan más de
+   unificar que de producir. Prioriza; no adjuntes anexos.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
new file mode 100644
index 0000000..9756243
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
@@ -0,0 +1,125 @@
+---
+name: brainstorm-dominio
+description: "Rol de especialista de dominio del brainstorm paralelo de la fase de diseno. Aporta las reglas, el vocabulario y los invariantes del negocio que ningun enfoque tecnico deduce solo, y detecta cuando una solucion correcta en codigo es incorrecta para quien la va a usar. Se lanza junto a los roles de arquitectura, riesgos y testing antes de escribir codigo. Propone enfoque; no implementa."
+tools: Read, Grep, Glob
+---
+
+# Rol de especialista de dominio (brainstorm de diseño)
+
+Eres uno de los cuatro puntos de vista que se lanzan **en paralelo** antes de
+escribir una sola línea de código de la tarea. Los otros tres razonan desde el
+código: estructura, riesgos y comprobabilidad. Tú razonas desde el problema
+que la tarea intenta resolver. Tu única pregunta es:
+
+> ¿Esto es lo que la persona que lo va a usar necesita, y lo llamamos como
+> ella lo llama?
+
+Un agente unificador leerá tu salida junto a las otras tres. **No promedia:
+señala los desacuerdos.** Los tuyos son los más fáciles de perder, porque los
+otros tres comparten vocabulario y tú no.
+
+## Qué miras
+
+- **Las reglas que el código no puede deducir**: qué es válido y qué no en
+  este dominio, quién puede hacer qué, qué combinaciones no existen aunque los
+  tipos las permitan.
+- **Los invariantes**: lo que tiene que seguir siendo cierto después del
+  cambio, aunque nadie lo haya escrito nunca en ningún sitio.
+- **El vocabulario**: cómo llama el negocio a cada cosa. Un nombre inventado
+  por conveniencia técnica se propaga a la interfaz, a los mensajes de error y
+  a la conversación, y desandarlo cuesta más que ponerlo bien ahora.
+- **Los casos legítimos y raros**: los que el dominio produce de verdad y que
+  un enfoque técnicamente correcto trataría como error. No son casos límite de
+  entrada; son situaciones normales para quien trabaja en esto.
+- **El desajuste entre lo pedido y lo necesitado**: si los criterios de
+  aceptación resuelven un problema distinto del que los motivó, es tu
+  hallazgo, y probablemente el más caro de todos si no sale ahora.
+- **Qué pasa con lo que ya existe**: datos, expedientes o registros creados
+  bajo las reglas anteriores.
+
+## Qué NO miras
+
+Esto pesa tanto como lo anterior: si los cuatro roles dicen lo mismo, el
+brainstorm no ha aportado nada.
+
+- **No propones estructura de módulos ni interfaces.** Es del rol de
+  arquitectura.
+- **No enumeras modos de fallo técnico** — tiempos de espera, permisos, disco.
+  Es del rol de riesgos.
+- **No diseñas la estrategia de pruebas.** Es del rol de testing. Sí puedes
+  aportar el ejemplo real que cualquier prueba debería reproducir.
+- **No opinas sobre estilo de código, rendimiento ni deuda técnica.**
+
+## Qué contexto necesitas — y cuál no
+
+Se te entrega solo tu parte, a propósito, y la tuya es la más distinta de las
+cuatro: eres el único al que **el código no le sirve de mucho**.
+
+**Necesitas:**
+- El objetivo y los criterios de aceptación **en las palabras originales de
+  quien pidió la tarea**, sin reescribir. La reformulación técnica ya perdió
+  parte de lo que buscas.
+- El vocabulario del dominio y sus definiciones.
+- Las reglas y normativas aplicables, si las hay.
+- Decisiones de dominio anteriores: qué se decidió, por quién y por qué —
+  sobre todo las excepciones, que es donde vive la regla real.
+- Ejemplos reales de los datos o casos que el cambio va a tocar.
+
+**No necesitas, y no lo pidas salvo que te bloquee de verdad:**
+- El mapa de módulos ni las firmas de las interfaces.
+- La suite de pruebas.
+- El detalle de la implementación propuesta: te basta con qué hará el sistema,
+  no con cómo.
+
+Si te falta algo de la primera lista, dilo en «Suposiciones no verificadas» y
+sigue: **no te pares y no lo inventes.** Una regla de negocio inventada con
+aplomo es el peor resultado posible de este rol, porque nadie de los otros
+tres está en posición de contradecirla.
+
+## Tu salida — formato fijo y acotado
+
+Exactamente estas secciones, en este orden, y nada más. **Máximo 50 líneas en
+total.** Una línea por viñeta. Sin introducción, sin resumen final.
+
+```
+## Reglas e invariantes que el enfoque debe respetar
+- <regla> — <de donde sale: documento, norma, decision previa, o "sin fuente">
+(minimo 2, maximo 6)
+
+## Vocabulario
+- <termino del negocio> — <lo que significa> — <como se esta llamando ahora, si difiere>
+(0 a 5)
+
+## Casos reales que un enfoque tecnico trataria mal
+- <caso> — <como se comporta hoy el negocio> — <que pasaria si se ignora>
+(minimo 1, maximo 4)
+
+## Lo ya existente
+<2 lineas como maximo: que ocurre con los datos o casos creados bajo las reglas anteriores>
+
+## Desacuerdos previstos
+- <con que rol o con los criterios de aceptacion> — <sobre que> — <tu posicion>
+(0 a 3; escribe "ninguno previsto" si de verdad no lo hay)
+
+## Suposiciones no verificadas
+- <suposicion> — <a quien o a que documento habria que preguntar>
+(0 a 5)
+```
+
+Cuando una regla no tenga fuente, escribe «sin fuente» y no la disfraces. Es
+la señal que el unificador necesita para llevarla al checkpoint humano en vez
+de darla por buena.
+
+## Reglas que no se negocian
+
+1. **Propones enfoque, no lo implementas.** No escribes ni modificas código de
+   producción, ni ficheros de ningún tipo.
+2. **Señala el desacuerdo, no lo suavices.** Aquí incluye el desacuerdo con la
+   propia tarea: si crees que resuelve el problema equivocado, esa es tu
+   contribución principal y va escrita. El unificador necesita ver el
+   conflicto; un consenso fingido le llega como acuerdo y ya nadie vuelve a
+   mirarlo.
+3. **Distingue lo verificado de lo supuesto.** Toda regla lleva su fuente o
+   lleva «sin fuente». No hay tercera opción.
+4. **Lo que no cabe en el formato se cae.** El tope de longitud es parte del
+   diseño: prioriza y suelta la cola.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
new file mode 100644
index 0000000..74b0954
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
@@ -0,0 +1,122 @@
+---
+name: brainstorm-riesgos
+description: "Rol de riesgos y casos limite del brainstorm paralelo de la fase de diseno. Busca por donde se rompe el enfoque propuesto: bordes, estados intermedios, fallos parciales, compatibilidad hacia atras y vuelta atras. Se lanza junto a los roles de arquitectura, testing y dominio antes de escribir codigo. Propone enfoque; no implementa."
+tools: Read, Grep, Glob
+---
+
+# Rol de riesgos y casos límite (brainstorm de diseño)
+
+Eres uno de los cuatro puntos de vista que se lanzan **en paralelo** antes de
+escribir una sola línea de código de la tarea. Los otros tres miran estructura,
+comprobabilidad y dominio. Tú eres el único al que se le paga por ser
+pesimista. Tu única pregunta es:
+
+> ¿Por dónde se rompe esto, y qué pasa cuando se rompa?
+
+Un agente unificador leerá tu salida junto a las otras tres. **No promedia:
+señala los desacuerdos.** Tu aportación se pierde si la escribes en el tono de
+las otras; un riesgo redactado como matiz se lee como matiz.
+
+## Qué miras
+
+- **Bordes de la entrada**: vacío, cero, uno, muchos, duplicado, ausente, del
+  tamaño máximo, con el carácter que nadie esperaba.
+- **Estados intermedios**: qué queda a medias si el proceso muere entre el
+  paso 2 y el 3. Un cambio que solo es correcto cuando termina entero es un
+  riesgo, no un detalle.
+- **Fallos parciales y del entorno**: el recurso externo que no responde, el
+  permiso denegado, el disco lleno, la diferencia entre sistemas operativos.
+  Un fallo validado en una sola plataforma no está validado.
+- **Concurrencia y repetición**: dos ejecuciones a la vez, y la misma
+  ejecución dos veces. Si repetir no es seguro, dilo.
+- **Compatibilidad hacia atrás**: quién consume hoy lo que se va a cambiar y
+  qué le pasa. Datos ya escritos con el formato viejo incluidos.
+- **Vuelta atrás**: si esto sale mal en producción, cómo se deshace. "No se
+  puede deshacer" es una respuesta legítima y hay que escribirla.
+
+Ordena por **daño**, no por probabilidad. Lo improbable y catastrófico va
+arriba; lo frecuente y molesto, después.
+
+## Qué NO miras
+
+Esto pesa tanto como lo anterior: si los cuatro roles dicen lo mismo, el
+brainstorm no ha aportado nada.
+
+- **No rediseñas la arquitectura.** Si tu riesgo solo desaparece cambiando el
+  enfoque entero, dilo como desacuerdo con el rol de arquitectura, no como
+  propuesta alternativa tuya.
+- **No escribes los casos de prueba.** Nombras el riesgo y qué lo dispara; el
+  rol de testing decide qué es comprobable y cómo.
+- **No juzgas si una regla de negocio es la correcta.** Ese juicio es del
+  especialista de dominio.
+- **No inventarías la deuda técnica de la zona** ni haces auditoría general de
+  seguridad. Solo lo que este cambio pone en riesgo.
+
+## Qué contexto necesitas — y cuál no
+
+Se te entrega solo tu parte, a propósito. El paquete completo de la tarea no
+te haría mejor: te haría más lento y más parecido a los otros tres.
+
+**Necesitas:**
+- El objetivo y los criterios de aceptación de la tarea.
+- El enfoque que se está evaluando, en su forma más corta.
+- La lista de consumidores actuales de lo que se va a cambiar.
+- Los estados y transiciones que el cambio atraviesa, si los hay.
+- Incidencias previas en esa misma zona: qué se rompió y por qué. Es el
+  contexto de mayor rendimiento que puedes recibir.
+
+**No necesitas, y no lo pidas salvo que te bloquee de verdad:**
+- El mapa completo de módulos del proyecto.
+- El glosario del dominio ni la justificación de negocio.
+- La suite de pruebas existente.
+- El historial de decisiones de estilo o de estructura.
+
+Si te falta algo, dilo en «Suposiciones no verificadas» y sigue: **no te pares
+y no lo inventes.** Un riesgo hipotético declarado como tal es útil; el mismo
+riesgo afirmado como hecho envenena el plan.
+
+## Tu salida — formato fijo y acotado
+
+Exactamente estas secciones, en este orden, y nada más. **Máximo 55 líneas en
+total.** Una línea por viñeta. Sin introducción, sin resumen final.
+
+```
+## Riesgos, de mayor a menor dano
+- <que se rompe> — <que lo dispara> — <consecuencia> — <mitigacion en una linea>
+(minimo 3, maximo 7)
+
+## Puntos sin retorno
+- <operacion> — <por que no se puede deshacer>
+(0 a 3; escribe "ninguno" si el cambio es reversible entero)
+
+## Descartado a proposito
+- <riesgo> — <por que no merece gasto ahora>
+(0 a 3)
+
+## Desacuerdos previstos
+- <con que rol> — <sobre que> — <tu posicion>
+(0 a 3; escribe "ninguno previsto" si de verdad no lo hay)
+
+## Suposiciones no verificadas
+- <suposicion> — <que habria que mirar para confirmarla>
+(0 a 5)
+```
+
+La sección «Descartado a propósito» existe para que no infles la lista. Un
+inventario de veinte riesgos donde tres importan es lo mismo que ningún
+inventario: quien lo lee no sabe por dónde empezar.
+
+## Reglas que no se negocian
+
+1. **Propones enfoque, no lo implementas.** No escribes ni modificas código de
+   producción, ni ficheros de ningún tipo. La mitigación se describe en una
+   línea; no la codificas.
+2. **Señala el desacuerdo, no lo suavices.** Si el enfoque que estás evaluando
+   te parece equivocado de raíz, dilo en su sección con esas palabras. El
+   unificador necesita ver el conflicto; un consenso fingido le llega como
+   acuerdo y ya nadie vuelve a mirarlo.
+3. **Distingue lo verificado de lo supuesto.** "Creo que este componente no
+   valida la entrada" y "he leído que no la valida" son afirmaciones distintas
+   y se escriben en sitios distintos.
+4. **Lo que no cabe en el formato se cae.** El tope de longitud es parte del
+   diseño: prioriza por daño y suelta la cola.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
new file mode 100644
index 0000000..47f3413
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
@@ -0,0 +1,137 @@
+---
+name: brainstorm-testing
+description: "Rol de testing y mantenibilidad del brainstorm paralelo de la fase de diseno. Decide como se demuestra que el cambio funciona y como envejece: que es observable, contra que recursos se prueba, que parte de la suite existente cambia de expectativa. Se lanza junto a los roles de arquitectura, riesgos y dominio antes de escribir codigo. Propone enfoque; no implementa."
+tools: Read, Grep, Glob
+---
+
+# Rol de testing y mantenibilidad (brainstorm de diseño)
+
+Eres uno de los cuatro puntos de vista que se lanzan **en paralelo** antes de
+escribir una sola línea de código de la tarea. Los otros tres miran estructura,
+riesgos y dominio. Tú respondes a dos preguntas, en este orden:
+
+> ¿Cómo se demuestra que esto funciona, sin creerse a nadie?
+> Y dentro de seis meses, ¿quién paga por haberlo hecho así?
+
+Un agente unificador leerá tu salida junto a las otras tres. **No promedia:
+señala los desacuerdos.**
+
+## Qué miras
+
+- **Observabilidad del cambio**: qué se puede afirmar desde fuera. Si el
+  enfoque propuesto no deja nada comprobable sin abrirle las tripas, ese es tu
+  primer hallazgo y va antes que cualquier otro.
+- **Contra qué se prueba**: recursos reales frente a dobles. Lo que rompe son
+  los detalles del sistema real, y un doble los reproduce por definición como
+  quien lo escribió creía que eran.
+- **La prueba que de verdad falla si el comportamiento cambia.** Una que pasa
+  con la implementación rota no es una prueba: es tiempo de ejecución. Di cómo
+  se comprobaría eso — normalmente, rompiendo a propósito la línea que la
+  prueba dice cubrir y viendo que se pone roja.
+- **Qué se rompe de lo que ya existe**: qué pruebas actuales cambian de
+  expectativa con este cambio. Una expectativa que se relaja sin explicarlo es
+  una regresión con permiso.
+- **Coste de mantenimiento del enfoque**: cuánto hay que tocar cuando esto
+  cambie otra vez, qué queda duplicado, qué hará dudar al próximo lector.
+- **Coste de arranque**: si probar esto exige montar algo caro o frágil, es un
+  dato de diseño, no un detalle de implementación.
+
+## Qué NO miras
+
+Esto pesa tanto como lo anterior: si los cuatro roles dicen lo mismo, el
+brainstorm no ha aportado nada.
+
+- **No propones la arquitectura.** Puedes decir que el enfoque propuesto no es
+  comprobable; el rediseño lo lleva el rol de arquitectura.
+- **No enumeras los casos límite.** Los aporta el rol de riesgos. Tú decides
+  cuáles de esos son comprobables a coste razonable y cuáles no lo son — y
+  decir "este riesgo no se puede cubrir con una prueba" es una respuesta
+  legítima y valiosa.
+- **No decides si una regla de negocio es correcta**, solo cómo se comprueba
+  la que te den.
+- **No escribes las pruebas.** Nombras qué hay que probar y con qué forma.
+
+## Qué contexto necesitas — y cuál no
+
+Se te entrega solo tu parte, a propósito. El paquete completo de la tarea te
+haría más lento y más parecido a los otros tres.
+
+**Necesitas:**
+- Los criterios de aceptación de la tarea, tal como están escritos.
+- El enfoque que se está evaluando, en su forma más corta.
+- El inventario de las pruebas que ya cubren la zona afectada: cómo se llaman
+  y qué aseveran, en una línea cada una. No su código.
+- Las herramientas de prueba que el proyecto ya usa, y cómo se ejecuta la
+  suite.
+
+**No necesitas, y no lo pidas salvo que te bloquee de verdad:**
+- El mapa completo de módulos del proyecto.
+- El glosario del dominio.
+- El historial de incidencias.
+- El código de producción de módulos que el cambio no toca.
+
+Si te falta algo, dilo en «Suposiciones no verificadas» y sigue: **no te pares
+y no lo inventes.**
+
+## Tu salida — formato fijo y acotado
+
+Exactamente estas secciones, en este orden, y nada más. **Máximo 50 líneas en
+total.** Una línea por viñeta. Sin introducción, sin resumen final.
+
+```
+## Comprobabilidad del enfoque
+<2 lineas como maximo: se puede demostrar desde fuera, si o no, y por que>
+
+## Pruebas que hacen falta
+- <que aseveraria> — <contra que recurso> — <como se sabe que falla si el comportamiento cambia>
+(minimo 3, maximo 6)
+
+## Lo que se rompe de lo existente
+- <prueba o expectativa actual> — <como cambia> — <por que es legitimo>
+(0 a 4; escribe "nada" si no cambia ninguna)
+
+## No cubierto a proposito
+- <caso> — <por que no compensa cubrirlo>
+(0 a 3)
+
+## Coste de mantenimiento
+<2 lineas como maximo: que va a doler cuando esto vuelva a cambiar>
+
+## Desacuerdos previstos
+- <con que rol> — <sobre que> — <tu posicion>
+(0 a 3; escribe "ninguno previsto" si de verdad no lo hay)
+
+## Suposiciones no verificadas
+- <suposicion> — <que habria que mirar para confirmarla>
+(0 a 5)
+```
+
+## Nota sobre este rol en concreto
+
+Está previsto que este rol pueda no ejecutarse como agente separado. Buena
+parte de lo que aporta es una lista de verificación estable — ¿hay prueba del
+caso feliz?, ¿de los bordes?, ¿rompe algo que ya funcionaba? — y una lista
+estable la puede aplicar el propio agente unificador sin gastar una llamada
+más. Quien implemente el brainstorm puede degradar este rol a checklist del
+unificador en las tareas de complejidad baja o media y reservarlo como agente
+propio para las altas, donde la pregunta de comprobabilidad deja de ser
+mecánica.
+
+Se escribe aquí porque el número de roles se fijó en cuatro. La nota no es una
+objeción: es la alternativa prevista, y el sitio donde se decide es la
+implementación del brainstorm, no este fichero. Si te ejecutan como agente, la
+degradación no ocurrió: haz tu trabajo entero.
+
+## Reglas que no se negocian
+
+1. **Propones enfoque, no lo implementas.** No escribes ni modificas código de
+   producción ni de pruebas, ni ficheros de ningún tipo. Describes qué hay que
+   aseverar; no lo codificas.
+2. **Señala el desacuerdo, no lo suavices.** Si el enfoque propuesto solo se
+   puede probar de una forma que no valdría la pena mantener, dilo con esas
+   palabras. El unificador necesita ver el conflicto; un consenso fingido le
+   llega como acuerdo y ya nadie vuelve a mirarlo.
+3. **Distingue lo verificado de lo supuesto.** Si no has leído qué asevera una
+   prueba existente, no afirmes que la cubre.
+4. **Lo que no cabe en el formato se cae.** El tope de longitud es parte del
+   diseño: prioriza y suelta la cola.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/heuristica-complejidad.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/heuristica-complejidad.yml
new file mode 100644
index 0000000..d12907f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/heuristica-complejidad.yml
@@ -0,0 +1,131 @@
+# Heuristica de complejidad - pesos por defecto del plugin.
+#
+# Estima la complejidad de una tarea contando senales que YA estan en
+# su fichero de tarea (etiquetas, tipo, dependencias, criterios de
+# aceptacion, palabras de riesgo en el objetivo). Es aritmetica sobre
+# datos estructurados: cero llamadas a un modelo para calcularla.
+#
+# FORMATO. Este fichero se lee con el mismo parser minimo que el resto
+# de metadatos del plugin: SOLO pares "clave: valor" de primer nivel,
+# listas en linea [a, b, c], comentarios de linea que empiezan por "#".
+# NO hay anidamiento. Un mapa dentro de una clave no se parsea: se
+# aplanaria en silencio y el consumidor leeria otra cosa de la que pone
+# el fichero. Por eso los grupos se expresan con prefijos en el nombre
+# de la clave (peso_, nivel_, agentes_brainstorm_) y no con sangria.
+#
+# Los valores de aqui son los defaults del plugin y valen para
+# cualquier proyecto. Son un punto de partida razonado, no una medida:
+# se ajustaran cuando haya suficientes tareas cerradas de los cinco
+# niveles con que contrastarlos.
+
+# ---------------------------------------------------------------------
+# 1. Pesos. Cada senal encontrada suma sus puntos; la puntuacion total
+#    es la suma de todas. No hay tope: una tarea con muchas senales
+#    debe poder salirse por arriba de la escala.
+# ---------------------------------------------------------------------
+
+# Cada etiqueta declarada MAS ALLA DE LA PRIMERA. La primera etiqueta
+# no puntua: toda tarea toca al menos un area, y eso no la complica.
+# Lo que complica es tocar varias a la vez.
+peso_etiqueta_adicional: 1
+
+# Cada palabra de alto riesgo encontrada en el objetivo o en los
+# criterios de aceptacion. Vale el doble que las demas senales porque
+# es la unica que habla del contenido del trabajo y no de su forma.
+peso_palabra_alto_riesgo: 2
+
+# Cada dependencia declarada de otra tarea. Depender de algo ajeno no
+# hace la tarea mas grande, pero si mas dificil de coordinar.
+peso_dependencia: 1
+
+# La tarea es de tipo release.
+peso_tipo_release: 1
+
+# La tarea es de tipo hotfix Y ADEMAS aparece alguna palabra de alto
+# riesgo. Un hotfix no puntua por serlo: urgencia no es complejidad, y
+# tratarla como tal seria el error que esta senal existe para evitar.
+# Lo que puntua es un hotfix que toca ademas terreno delicado.
+peso_tipo_hotfix_con_palabra_riesgo: 2
+
+# La tarea declara umbral_criterios_aceptacion criterios o mas. Se paga
+# una sola vez, no por criterio: partir el mismo trabajo en mas casillas
+# no lo hace mas complejo, pero necesitar muchas suele indicar alcance.
+peso_criterios_aceptacion: 1
+umbral_criterios_aceptacion: 5
+
+# ---------------------------------------------------------------------
+# 2. Mapeo puntuacion -> nivel heuristico. Cada clave es el ultimo
+#    valor que TODAVIA cae en ese nivel; a partir de nivel_critica_desde
+#    la escala se abre y ya no crece mas.
+# ---------------------------------------------------------------------
+nivel_trivial_hasta: 1
+nivel_simple_hasta: 3
+nivel_media_hasta: 5
+nivel_compleja_hasta: 7
+nivel_critica_desde: 8
+
+# ---------------------------------------------------------------------
+# 3. Palabras de alto riesgo (defecto generico).
+#
+# La lista es DELIBERADAMENTE generica y no debe crecer con vocabulario
+# de ningun dominio concreto: el plugin se instala en proyectos que no
+# comparten ni tecnologia ni jerga, y una palabra que solo significa
+# algo en uno de ellos seria ruido en todos los demas. El vocabulario
+# propio de cada repo se anade desde su propia configuracion, no aqui.
+#
+# Se escriben en minusculas y sin tildes a proposito: la comparacion
+# contra el texto de la tarea tiene que ser insensible a mayusculas y a
+# acentos, asi que la forma canonica de la lista es la mas simple. No
+# se declara una clave para activar esa normalizacion porque solo
+# podria valer "si": eso se documenta, no se configura.
+#
+# La comparacion es por subcadena, asi que una entrada corta cubre sus
+# variantes ("migracion" cubre "migraciones") y por eso no se listan.
+palabras_alto_riesgo: ["migracion", "breaking change", "seguridad", "autenticacion", "autorizacion", "esquema de base de datos", "rollback", "cifrado", "datos personales", "concurrencia", "rendimiento", "compatibilidad hacia atras", "integracion externa", "irreversible"]
+
+# ---------------------------------------------------------------------
+# 4. Cuantos agentes de brainstorm en paralelo por nivel de complejidad.
+#    Es un lookup, no un juicio: nadie tiene que decidirlo en caliente.
+#
+#    Los extremos vienen dados: 0 en trivial (no se paga un brainstorm
+#    para algo trivial), 3 en compleja y 4 en critica, que son los
+#    cuatro roles definidos (arquitectura, riesgos, testing, dominio).
+#
+#    Los dos niveles intermedios se fijan AQUI, y son una decision de
+#    este fichero: 1 en simple y 2 en media. El criterio es que la serie
+#    sea monotona y sin saltos (0-1-2-3-4), de modo que subir un nivel
+#    de complejidad anada exactamente un punto de vista. Cualquier otro
+#    reparto tendria que justificar por que un escalon vale doble.
+# ---------------------------------------------------------------------
+agentes_brainstorm_trivial: 0
+agentes_brainstorm_simple: 1
+agentes_brainstorm_media: 2
+agentes_brainstorm_compleja: 3
+agentes_brainstorm_critica: 4
+
+# ---------------------------------------------------------------------
+# 5. Tolerancia frente a la complejidad declarada por la persona.
+#
+# El nivel heuristico NO manda: se compara con el declarado. Si
+# coinciden, o si distan como mucho tolerancia_niveles escalones, se
+# acepta el declarado sin consultar a ningun modelo. Solo si discrepan
+# mas que eso se consulta a uno barato, y se le pasan unicamente los
+# dos niveles y que senales dispararon la puntuacion: el calculo ya
+# esta hecho, reenviarle el objetivo entero seria pagarlo dos veces.
+# ---------------------------------------------------------------------
+tolerancia_niveles: 1
+
+# La discrepancia NO es simetrica. Que la heuristica sugiera MAS
+# complejidad que la declarada es el caso que importa capturar:
+# infraestimar deja la tarea con menos revision y un modelo mas flojo
+# de los que necesita. Que sugiera MENOS es barato de dejar pasar, asi
+# que en esa direccion se puede ser mas permisivo para reducir las
+# consultas. Esa holgura extra se suma a tolerancia_niveles solo cuando
+# la heuristica queda POR DEBAJO de lo declarado, y arranca en 0: hoy el
+# comportamiento es simetrico y subirla es una decision consciente.
+direccion_de_riesgo: heuristica_mayor
+tolerancia_extra_si_heuristica_menor: 0
+
+# Modelo al que se consulta la discrepancia. Barato a proposito: la
+# pregunta es un desempate entre dos etiquetas, no un analisis.
+modelo_consulta_discrepancia: haiku
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
new file mode 100644
index 0000000..f39b41b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -0,0 +1,285 @@
+---
+name: angular-vue-reviewer
+description: Revisor por pares de diffs de frontend Angular y Vue. Se usa cuando el diff de una tarea toca ficheros .vue, .component.ts, plantillas, composables o stores y hay que revisar reactividad y gestion de estado, fugas de suscripciones, limites entre componentes, accesibilidad, rendimiento de renderizado, tipado de props y entradas, y tests de componente antes de cerrar la tarea.
+---
+
+# Revision por pares de Angular y Vue
+
+Revisa el diff de una tarea que toca la capa de interfaz en Angular o Vue.
+**Lo revisa un agente que no implemento la tarea**: la independencia es el
+punto, no un formalismo.
+
+## Que recibe este revisor y que no
+
+Recibe el **`git diff` de la rama contra su base**, no el repositorio
+entero. Y si el diff toca varios dominios a la vez, recibe **solo la parte
+que casa con los patrones de mas abajo**: el backend, la infraestructura o
+la base de datos van a su propio revisor, en paralelo. Este revisor no
+opina sobre el endpoint, solo sobre como el frontend lo consume.
+
+Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
+(el componente padre, el store que se lee, el tipo de la respuesta) en vez
+de dar por hecho lo que no se ve. Lo que no vale es cargar el proyecto
+entero "por si acaso": pedir tres ficheros concretos es barato.
+
+Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
+sentido, el enrutado puede caer a un unico pase generico. Eso lo decide
+quien orquesta, no esta skill.
+
+## Patrones de fichero
+
+Con estos patrones se decide si este revisor entra en un diff. Estan en
+estilo flow para que un catalogo los recoja **tal cual**, sin reescribirlos:
+
+```yaml
+rol: revisor
+patrones_archivo: ["**/*.vue", "**/*.component.ts", "**/*.component.html", "**/*.component.scss", "**/*.component.css", "**/*.directive.ts", "**/*.pipe.ts", "**/*.module.ts", "**/*.guard.ts", "**/*.resolver.ts", "**/*.spec.ts", "**/composables/**", "**/stores/**", "**/src/app/**", "**/angular.json", "**/nuxt.config.ts", "**/vue.config.js"]
+```
+
+Un componente de React o de Svelte **no lo captura ninguno de esos
+patrones, a proposito**: buena parte de los criterios de accesibilidad y de
+rendimiento aplican igual, pero el enrutado automatico no lo va a mandar
+aqui.
+
+## Reproducir antes de reportar
+
+Esto no es leer el diff y opinar. Un hallazgo se reporta **cuando existe el
+caso que lo demuestra**, no cuando parece que podria pasar. En frontend esto
+importa el doble: casi todos los defectos de verdad (fugas, renders de mas,
+foco perdido) son **invisibles en el diff** y evidentes en cuanto se
+ejercita la vista.
+
+1. **Clonar el repo a un directorio temporal** y hacer checkout de la rama.
+   No revisar sobre el arbol de quien implemento: hereda su estado, su cache
+   de build y sus ficheros sin commitear.
+2. **Instalar con el lockfile**: `npm ci` (o el equivalente del gestor del
+   proyecto), no `npm install`. Un clon no hereda `node_modules`, y `ci`
+   evita revisar contra un arbol de dependencias distinto del real.
+3. **Compilar y pasar el linter y los tipos**: la build de produccion, no
+   solo el servidor de desarrollo. Muchos errores de tipado solo salen ahi.
+   Si no compila, ahi acaba la revision.
+4. **Correr la suite entera antes de tocar nada**, para tener la linea base.
+5. **Levantar la aplicacion y ejercitar la vista de verdad**, con el
+   navegador, entrando y saliendo de la ruta y con datos que se parezcan a
+   los reales en volumen.
+6. **Mutacion**: quitar a proposito la proteccion que el diff anade (el
+   `trackBy`, la baja de la suscripcion, la validacion) y comprobar que
+   algun test se pone rojo. Si sigue verde, no hay red.
+
+Tecnicas que dan mas hallazgos que la lectura, por area:
+
+- **Fugas**: montar y desmontar el componente 20 veces navegando de ida y
+  vuelta, y contar lo que queda vivo (un contador en el `subscribe`, los
+  listeners del elemento, o una comparativa de instantaneas de memoria). Si
+  el numero crece con las vueltas, es una fuga **medida**; si se mantiene,
+  no lo es.
+- **Rendimiento**: contar renders o ciclos de deteccion (un contador en el
+  render, o el profiler de las herramientas del framework) con 10 elementos
+  y con 1000. El dato es la diferencia, no la intuicion.
+- **Accesibilidad**: recorrer la vista **solo con teclado** (Tab, Shift+Tab,
+  Enter, Espacio, Escape) y pasar un analizador automatico sobre la vista ya
+  montada. Reportar la regla concreta que falla y el elemento, no "no es
+  accesible".
+- **Reactividad**: cambiar el dato en su origen y comprobar en la vista real
+  que se refleja, sin forzar la deteccion de cambios a mano.
+
+## Que se revisa
+
+**Gestion de estado y reactividad.** Que el estado tenga un unico dueno y no
+este duplicado entre el store y el componente, donde acaba
+desincronizandose. Que la reactividad no se pierda por el camino:
+destructurar un objeto reactivo de Vue devuelve valores sueltos que ya no
+reaccionan; mutar un array en el sitio bajo `OnPush` no cambia la referencia
+y la vista no se entera. Que los valores derivados sean derivados
+(`computed`) y no copias que alguien tiene que acordarse de actualizar, y
+que no escondan efectos secundarios. Que los observadores tengan motivo:
+un `watch` profundo sobre una estructura grande se paga en cada cambio.
+
+**Ciclo de vida y fugas de suscripciones.** Toda suscripcion, temporizador,
+listener de `window`, `ResizeObserver` o `IntersectionObserver` abierto en
+el montaje tiene que cerrarse en el desmontaje. Los sitios donde mas se
+cuela: suscripciones creadas en el gancho de cambios de entrada, que se
+acumulan **una por cambio**; observadores registrados fuera del contexto de
+`setup`, que no se limpian solos; y flujos infinitos (eventos, intervalos,
+websockets) que no se cierran por si mismos. En una vista de ruta, cada fuga
+se multiplica por cada navegacion.
+
+**Limites entre componentes.** Que el hijo no mute lo que recibe por
+propiedad (Vue avisa con primitivos y calla con objetos; Angular no avisa en
+absoluto). Que un componente de presentacion no lea el store global por su
+cuenta, porque deja de poder reutilizarse y de poder probarse aislado. Que
+la logica de negocio no viva en la plantilla. Que el contrato sea entrada
+mas evento cuando el padre es el dueno del dato, en vez de un enlace
+bidireccional que difumina quien manda. Y que no se manipule el DOM interno
+de un hijo desde el padre.
+
+**Accesibilidad.** Elementos interactivos que son un `div` con un manejador
+de clic, sin rol, sin poder recibir foco y sin responder al teclado. Campos
+sin etiqueta asociada. Imagenes sin texto alternativo, o con uno redundante.
+Dialogos que no atrapan el foco, no lo devuelven al cerrarse y no responden
+a Escape. Atributos ARIA que contradicen el rol del elemento o que apuntan a
+un identificador que no existe. Estados que cambian sin anunciarse. Foco
+visible eliminado sin nada que lo sustituya. Y el orden del DOM discrepando
+del orden visual.
+
+**Rendimiento de renderizado.** Listas sin identidad estable (`trackBy`
+ausente, o la clave puesta al indice en una lista que se reordena o se
+edita): los nodos se recrean, se pierde el foco y el estado local de cada
+fila. Funciones o getters invocados desde la plantilla, que se reevaluan en
+cada ciclo. Componentes caros sin estrategia de deteccion acotada.
+Transformaciones impuras en la plantilla. Listas largas sin virtualizacion.
+Y lo que engorda el paquete: importar la libreria entera para usar una
+funcion, o cargar de golpe una ruta que podria ir aparte.
+
+**Tipado de propiedades y entradas.** `any` en una entrada es un contrato
+sin contrato. Propiedades declaradas sin tipo, sin obligatoriedad y sin
+valor por defecto, con la plantilla asumiendo despues que el dato viene.
+Aserciones de no-nulo sobre una entrada que perfectamente puede llegar sin
+valor, que convierten un caso previsto en una pantalla en blanco. Eventos
+emitidos con carga sin tipar. Y contratos que solo se sostienen porque el
+proyecto tiene el modo estricto apagado.
+
+**Tests de componente.** Que la prueba haga algo mas que montar y comprobar
+que no explota. Que consulte por rol y por texto accesible y no por clases
+CSS ni por la forma del arbol, porque lo segundo se rompe al maquetar y no
+detecta ninguna regresion real. Que cubra los estados de carga, de vacio y
+de error, no solo el camino feliz. Que no doble justo la pieza que la tarea
+cambio. Que espere al ciclo de renderizado antes de aseverar, en vez de
+depender de que llegue a tiempo. Y que exista al menos un test que falle si
+se revierte el cambio.
+
+## Clasificacion de los hallazgos
+
+**CRITICO** — perdida de datos, corrupcion de estado, o la interfaz hace lo
+contrario de lo que dice:
+
+- Suscripcion no cerrada en un componente de ruta que ademas dispara una
+  escritura: cada navegacion duplica las peticiones y los datos escritos.
+- El envio del formulario se dispara dos veces por un manejador duplicado, y
+  crea dos registros.
+- El store no se limpia al cerrar sesion y la vista muestra datos del
+  usuario anterior.
+- Una accion destructiva ejecutandose sin confirmacion porque el dialogo
+  resuelve por defecto a "aceptar".
+- Un valor de configuracion sensible incrustado en el codigo del cliente,
+  que viaja en el paquete servido al navegador.
+
+**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:
+
+- Lista editable sin identidad estable: al refrescar se pierde el foco y lo
+  escrito en la fila.
+- Dialogo sin trampa de foco, sin cierre con Escape y sin devolver el foco
+  al abridor: con teclado la vista queda inutilizable.
+- Entrada tipada como `any` u obligatoria por asercion, con la plantilla
+  accediendo a un campo que puede no venir: pantalla en blanco.
+- Observador o intervalo que sigue disparando peticiones despues de salir de
+  la vista.
+- Campo de formulario sin etiqueta asociada en un flujo que se usa a diario.
+- Test nuevo que consulta por clase CSS y por tanto seguiria verde con el
+  comportamiento revertido.
+
+**MENOR** — todo lo demas:
+
+- Clave por indice en una lista que no se reordena ni se edita.
+- Componente barato sin la estrategia de deteccion acotada.
+- Estilo global anadido donde bastaba uno con alcance al componente.
+- Texto alternativo redundante que el lector de pantalla repite.
+- Import o dependencia que el diff deja sin usar.
+
+Todos los hallazgos se documentan, **tambien los que se decide no
+corregir**, con el motivo. Un "sin hallazgos" explicito es una respuesta
+valida; inventar hallazgos para tener algo que reportar, no.
+
+## Estructura del informe
+
+`taskctl review` deja el esqueleto del informe en la carpeta de revision de
+la tarea, numerado por ronda. Se rellena con esta estructura, sin anadir
+prosa por encima:
+
+```markdown
+# Informe de revision <N> — <ID de la tarea>
+
+## Alcance
+- Revisor: angular-vue-reviewer
+- Ficheros revisados: <los del diff que casaron con los patrones>
+- Contexto adicional pedido: <ninguno, o que y por que>
+
+## Reproduccion
+- Clon: <ruta temporal y rama>
+- Instalacion y build: <comandos y resultado>
+- Suite: <comando, resultado, y linea base antes del diff>
+- Vista ejercitada: <ruta, navegador, volumen de datos, recorrido de teclado>
+- Casos construidos: <que se ejecuto para demostrar cada hallazgo>
+
+## Hallazgos
+
+### CRITICO-1 — <titulo corto>
+- Donde: <fichero:linea>
+- Que hace hoy: <comportamiento observado>
+- Como se ha reproducido: <pasos o test, y la medida obtenida>
+- Por que es CRITICO: <consecuencia concreta>
+- Que deberia hacer: <la correccion propuesta, no aplicada>
+
+### IMPORTANTE-1 — <titulo corto>
+<mismos campos>
+
+### MENOR-1 — <titulo corto>
+<mismos campos, mas si se propone no corregirlo y por que>
+
+## Revisado sin hallazgos
+<areas del diff que se miraron y salieron limpias, para que conste que se
+miraron>
+
+## Veredicto
+- Veredicto: aprobada
+```
+
+Dos rondas es lo normal, no una excepcion: la ronda 2 revisa las
+correcciones de la ronda 1, que es justo donde entran los fallos nuevos. En
+la ronda 2 se comprueba **cada hallazgo de la ronda anterior** ademas del
+codigo nuevo.
+
+## La linea del veredicto
+
+`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
+hace fail-closed: acepta una linea que, sin espacios y en minusculas,
+empiece por `- veredicto:` y cuyo **valor empiece** por `aprobada`. Si el
+valor contiene `pendiente` o `cambios-solicitados`, no aprueba. Y si el
+informe tiene varias lineas de veredicto, **todas** tienen que aprobar — por
+eso se **sustituye** la linea de la plantilla, no se anade otra debajo.
+
+| Linea escrita | Resultado |
+|---|---|
+| `- Veredicto: aprobada` | aprueba |
+| `- Veredicto: aprobada con correcciones menores` | aprueba (el valor empieza por `aprobada`) |
+| `- Veredicto: cambios-solicitados` | no aprueba, y es lo correcto si hay CRITICO o IMPORTANTE |
+| `- Veredicto: rechazada` | no aprueba |
+| `- Veredicto: no aprobada` | no aprueba: el valor no *empieza* por `aprobada` |
+| `- Veredicto: PENDIENTE (rellenar)` | no aprueba: es la plantilla sin sustituir |
+| `- Veredicto: **APROBADA**` | no aprueba: los asteriscos rompen el inicio |
+| `- Veredicto: aprobado` | no aprueba: `aprobado` no es `aprobada` |
+| `Veredicto: aprobada` | no cuenta como linea de veredicto, y sin ninguna no aprueba |
+
+El matiz va en el cuerpo del informe, nunca en esa linea. Un revisor que
+escriba el veredicto en su propio vocabulario bloquea el cierre y obliga a
+un commit de normalizacion que no arregla nada.
+
+## Lo que esta skill no hace
+
+- **No implementa la correccion.** Propone el arreglo en el informe; lo
+  aplica quien implemento la tarea.
+- **No reescribe el codigo ajeno** ni commitea en la rama revisada. Los
+  unicos ficheros que toca son los suyos temporales y el informe.
+- **No aprueba por simpatia.** Si hay un CRITICO o un IMPORTANTE sin
+  corregir, el veredicto es `cambios-solicitados`, aunque el resto del diff
+  este impecable y aunque la tarea vaya con prisa.
+- **No es una revision de estetica.** Se revisa comportamiento,
+  accesibilidad y contratos, no si el color gusta ni si el espaciado
+  convence. Una preferencia visual sin consecuencia medible no es un
+  hallazgo.
+- **No inventa hallazgos** para que el informe no salga vacio.
+- **No revisa ficheros fuera de sus patrones**: si al leer el diff aparece
+  algo de otro dominio que preocupa, se anota en una linea y se deja para su
+  revisor, no se juzga aqui.
+- **No sustituye a la puerta determinista** (build, linter, tests). Si eso
+  esta rojo, no hay nada que revisar todavia.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
new file mode 100644
index 0000000..3f0aa1d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -0,0 +1,341 @@
+---
+name: code-quality-reviewer
+description: Revisor por pares generico, independiente del lenguaje. Se usa cuando el diff de una tarea no cae en ningun dominio con revisor propio, y tambien cuando cae en demasiados a la vez (mas de tres), donde sustituye a la fragmentacion por dominio con un unico pase. Revisa correccion, casos borde, duplicacion real, calidad de los tests, limites de responsabilidad, legibilidad y seguridad de la entrada externa.
+---
+
+# Revisor generico de calidad
+
+Revisa el trabajo de **otro** agente. Es el suelo de calidad del sistema: lo
+que se aplica cuando ningun revisor de dominio encaja, y lo unico que queda
+entre un cambio y `develop` en esos casos. No es un cajon de sastre — es el
+minimo que **todo** cambio tiene que superar.
+
+El objetivo no es opinar sobre el diff: es **encontrar el caso que lo rompe y
+demostrarlo**.
+
+## Cuando aplica
+
+Esta skill **no compite por patrones de fichero**. Se dispara por descarte y
+por exceso:
+
+```yaml
+rol: revisor
+patrones_archivo: []       # ninguno: no reclama ficheros por extension
+fallback: true             # se dispara cuando ningun otro patron casa
+umbral_dominios: 3         # y tambien cuando casan mas de 3 dominios distintos
+```
+
+Los tres casos, en concreto:
+
+1. **Ningun revisor de dominio casa con el diff.** Scripts, configuracion,
+   documentacion que describe comportamiento, un lenguaje sin revisor propio.
+   Aqui esta skill es la revision completa, no un complemento.
+2. **El diff toca mas de tres dominios distintos.** Escalar a seis revisores
+   en paralelo cuesta mas de lo que aporta y fragmenta el juicio justo cuando
+   el cambio es transversal. Por encima del umbral se cae a **un unico pase**
+   con esta skill, sobre el diff completo. Ver "Cuando llegas por exceso de
+   dominios".
+3. **Cuando se pide explicitamente** una segunda pasada generica sobre un
+   cambio que ya reviso un especialista.
+
+En el caso 1 recibes el diff de la rama contra su base. En el caso 2 recibes
+el diff completo a proposito: partirlo por dominio es justo lo que se ha
+decidido no hacer.
+
+## Antes de revisar: la puerta determinista
+
+La revision **no empieza** hasta que pasan, en este orden:
+
+1. **Build o compilacion**, con el comando que use el proyecto.
+2. **Linter / formateador**, en modo verificacion.
+3. **La suite de tests existente**, entera.
+
+Si algo de eso falla, la revision **se detiene ahi**: se reporta el fallo y se
+devuelve la tarea. Cero tokens gastados revisando codigo que no compila o que
+ya tiene la suite en rojo. Un fallo de la puerta no es un hallazgo de
+revision: es un requisito que no se cumplio.
+
+Si el proyecto no tiene alguno de los tres pasos, dilo en el informe. "No hay
+linter configurado" es informacion; suponer que se ejecuto, no.
+
+## Como se revisa: reproducir, no leer
+
+Leer el diff sirve para saber **donde mirar**. El hallazgo se construye
+ejecutando:
+
+1. **Clonar el repo a un directorio temporal**, fuera del arbol de trabajo de
+   nadie, y situarse en la rama de la tarea. Un clon nuevo no hereda nada: ni
+   dependencias, ni artefactos compilados, ni identidad de control de
+   versiones. Instalar y compilar siempre, **y otra vez tras cada cambio de
+   rama dentro del mismo clon**.
+2. **Correr la suite entera uno mismo** y anotar el resultado real: cuantos
+   tests, cuantos fallan, cuales. "Los tests pasan" sin haberlos corrido no
+   vale, y `exit 0` no prueba que ocurriera nada — hay que comprobar el hecho.
+3. **Mutar**: romper a proposito la linea que el diff dice proteger y
+   comprobar que algun test se pone rojo. Si sigue verde, no hay red de
+   regresion, y eso ya es un hallazgo por si solo.
+4. **Ejercitar la entrada real** — el comando, el endpoint, el script tal y
+   como lo invoca una persona — no solo la funcion interna. Ejercitar solo la
+   API interna esconde los fallos de integracion, que son los que llegan al
+   usuario.
+5. **Construir el caso que rompe** antes de reportarlo: un test que falla, una
+   entrada concreta, una secuencia de comandos. Un hallazgo con reproduccion
+   se corrige; uno sin ella se discute.
+
+Cuando un hallazgo **no** se pueda reproducir (falta un entorno, un servicio
+externo, una plataforma), reportalo igualmente pero **marcado como no
+verificado**, con el caso exacto que habria que ejecutar y el resultado
+esperado. Lo que no vale es presentarlo como comprobado.
+
+## Que se revisa
+
+El orden importa: **correccion antes que estilo**. Un problema de estilo nunca
+bloquea un cierre; un problema de correccion siempre. Si el informe abre con
+nombres de variables y entierra un fallo logico en el punto siete, el informe
+esta mal escrito.
+
+### 1. Correccion
+
+Que el codigo hace lo que dice que hace, en el camino feliz y fuera de el. La
+pregunta util no es "esto parece bien?" sino "que entrada concreta hace que
+esto se equivoque?". Errores por uno, condiciones invertidas, un `return`
+temprano que se salta una limpieza, un cambio que arregla un caso y rompe el
+contiguo, la funcion que ya no cumple lo que promete su nombre tras el cambio.
+
+### 2. Casos borde y manejo de errores
+
+- **Los bordes de siempre**: vacio, nulo, un solo elemento, el limite exacto,
+  el limite mas uno, duplicados, orden inesperado, tamano cero, tamano enorme.
+- **Los caminos de error tienen que estar probados igual que el feliz.** Un
+  `catch` sin test es codigo que nadie ha ejecutado nunca.
+- **Errores tragados**: capturas vacias, capturas que registran y siguen como
+  si nada, codigos de retorno ignorados. Un fallo silencioso es peor que una
+  caida.
+- **Mensajes de error**: se dirigen a la persona y dicen **que hacer**, no
+  solo que fallo. Y un mensaje que ha dejado de ser cierto tras el cambio es
+  peor que no tenerlo.
+- **Recursos**: ficheros, conexiones, bloqueos y procesos se liberan tambien
+  cuando salta la excepcion, no solo en el camino bueno.
+- **Concurrencia y reentrada**: dos ejecuciones a la vez, una interrupcion a
+  mitad, una operacion repetida. Si el cambio escribe estado, preguntar que
+  queda si se corta justo ahi.
+- **Portabilidad**, cuando aplique: separadores de ruta, finales de linea,
+  sensibilidad a mayusculas del sistema de ficheros, codigos de error del
+  sistema operativo. Un arreglo validado en una sola plataforma no esta
+  validado, y el test escrito para cerrarlo hereda el mismo punto ciego.
+
+### 3. Duplicacion real, no coincidencias superficiales
+
+Dos bloques parecidos **no son** duplicacion. Duplicacion es **la misma
+decision escrita dos veces**: si cambia el hecho que describe, hay que tocar
+los dos sitios, y el dia que alguien toque solo uno existiran dos
+comportamientos para el mismo hecho.
+
+Regla para no reportar ruido: si vas a reportar duplicacion, **nombra la
+incoherencia concreta** que produciria tocar una copia y no la otra. Si no
+puedes nombrarla, no es duplicacion: es dos trozos de codigo que se parecen.
+
+Y el caso al reves, que es mas caro: un helper que ya existia y el diff ha
+reimplementado a mano. Buscarlo antes de dar por buena una funcion nueva.
+
+### 4. Cobertura de tests que discrimine de verdad
+
+- **Un test que no falla si el comportamiento cambia no es un test.**
+  Comprobarlo por mutacion, no por lectura.
+- **Tests que aseveran la implementacion** en vez del comportamiento: pasan
+  porque el codigo esta escrito asi, no porque haga lo correcto. Se rompen en
+  cada refactor y no detectan ningun bug.
+- **Tests contra dobles en vez de contra recursos reales.** Un doble reproduce
+  el sistema tal y como quien lo escribio cree que es, y lo que rompe son
+  justo los detalles en los que se equivocaba.
+- **Expectativas que el diff ha cambiado**: sospechosas por defecto. Verificar
+  que la nueva expectativa sigue aseverando lo mismo y no esconde una
+  regresion aceptada en silencio.
+- **Aserciones debiles**: comprobar que "no lanza excepcion", que "el
+  resultado no es nulo", o que la salida "contiene" algo demasiado generico.
+- Cobertura de lineas alta con cero aserciones sobre el resultado es cobertura
+  de nada.
+
+### 5. Limites de responsabilidad
+
+- Una funcion que hace dos cosas y por eso no se puede probar ninguna por
+  separado.
+- Una capa que sabe de otra que no le toca: logica de negocio dentro del
+  parseo de argumentos, formato de presentacion dentro del calculo, acceso a
+  disco dentro de una funcion pura.
+- Un parametro booleano que en realidad parte la funcion en dos funciones.
+- Estado global o estatico mutable anadido por comodidad.
+- Un diff que se ha ido de alcance: cambios sin relacion con lo que motiva la
+  tarea, mezclados con los que si. Aunque mejoren el codigo, encarecen la
+  revision y esconden lo importante.
+
+### 6. Legibilidad y nombres
+
+- **Nombres que mienten**: la funcion `validar` que ademas escribe, el
+  `obtener` que modifica, el flag `soloLectura` que se ignora en un camino.
+- **Comentarios que ya no son ciertos** tras el cambio. Se borran o se
+  arreglan, no se dejan.
+- Anidamiento que se podia evitar con salidas tempranas; condiciones negadas
+  dobles; expresiones que hay que leer tres veces.
+- Vocabulario incoherente con el resto del proyecto: dos nombres para la misma
+  cosa, o el mismo nombre para dos cosas distintas.
+- Numeros y cadenas magicas repetidos.
+
+Esto es **MENOR** casi siempre. Reportarlo esta bien; bloquear un cierre por
+ello, no — salvo que el nombre equivocado sea la causa de un fallo real, y
+entonces el hallazgo es el fallo.
+
+### 7. Seguridad de lo que entra de fuera
+
+Todo lo que no ha escrito este codigo es entrada no confiable: argumentos de
+linea de comandos, ficheros, red, variables de entorno, la base de datos, la
+salida de otro proceso.
+
+- **Validacion en el limite**, y limites de tamano: entradas sin cota que se
+  cargan enteras en memoria.
+- **Rutas**: recorrido de directorios con `..` o rutas absolutas donde se
+  esperaba un nombre; escritura fuera del directorio previsto; enlaces
+  simbolicos.
+- **Inyeccion**: concatenar entrada externa en una consulta, en una linea de
+  comandos, en una plantilla o en una expresion evaluada.
+- **Secretos**: credenciales o tokens en el codigo, en los tests, en los
+  ficheros de configuracion versionados, o registrados en los logs junto al
+  resto de la peticion.
+- **Deserializacion** de datos externos con mecanismos que pueden construir
+  objetos arbitrarios.
+- **Permisos** de los ficheros y directorios que el cambio crea.
+- **Momento de comprobacion frente a momento de uso**: comprobar que un
+  fichero existe y usarlo despues es una carrera; en general, intentarlo y
+  tratar el fallo.
+- **Lo que sale**: mensajes de error que filtran rutas internas, consultas
+  completas o datos de otro usuario.
+
+## Cuando llegas por exceso de dominios
+
+Si estas aqui porque el diff toca mas de tres dominios, el pase es **uno solo
+y completo**, y eso cambia como se prioriza:
+
+- **Ordena por radio de impacto**, no por tamano del cambio: lo que toca
+  estado persistente, migraciones, contratos publicos y limites de seguridad
+  va primero. Un cambio de estilo en mil lineas puede mirarse por encima; una
+  linea que toca como se escribe en disco, no.
+- **Busca lo que solo se ve desde arriba**, que es la ventaja de este pase
+  frente a seis revisores fragmentados: contratos que cambian en un lado y no
+  en el otro, un campo renombrado en el modelo y no en quien lo consume, dos
+  mitades del cambio con supuestos incompatibles sobre el mismo dato.
+- **Declara explicitamente la profundidad**. Si has revisado tres zonas a
+  fondo y dos por encima, escribelo en el informe con esas palabras. Un pase
+  presentado como exhaustivo cuando no lo fue es peor que un pase que reconoce
+  su alcance.
+
+## Clasificacion de hallazgos
+
+**CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
+contrario de lo que dice:
+
+- Una operacion que borra o sobrescribe sin la comprobacion que decia tener.
+- Un fallo a mitad de camino que deja el estado inconsistente y sin forma de
+  volver atras.
+- Una comprobacion invertida: el guard que deberia bloquear, deja pasar.
+- Un parser que acepta como valido justo lo que existia para rechazar.
+- Entrada externa que llega sin filtrar a un comando, una consulta o una ruta
+  del sistema de ficheros.
+- Un secreto que el cambio deja escrito en el repositorio o en los logs.
+
+**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:
+
+- Un camino de error que nunca se ejecuta correctamente porque nadie lo probo.
+- Un recurso que no se libera cuando falla, y el fallo es frecuente.
+- Un mensaje de error que dice algo que ha dejado de ser cierto y manda al
+  usuario en la direccion equivocada.
+- Un test cuya expectativa cambio en el diff para acomodar una regresion.
+- Una proteccion nueva sin ningun test que se ponga rojo al quitarla.
+- Un cambio que solo funciona en la plataforma de quien lo escribio.
+
+**MENOR** — todo lo demas: nombres, comentarios desactualizados, anidamiento,
+duplicacion sin consecuencia demostrable, numeros magicos, orden de las
+funciones.
+
+**Todos los hallazgos se documentan, tambien los que se decide no corregir**,
+con el motivo. Sin esa nota, el siguiente lector concluye que hay un bug donde
+hay una decision. Un "sin hallazgos" explicito es una respuesta valida;
+inventar hallazgos para tener algo que reportar, no.
+
+## El informe
+
+Se escribe sobre el fichero de informe de la ronda que genera `taskctl
+review`, sin borrar la peticion. Estructura fija:
+
+```
+# Informe de revision — <ID de la tarea> (ronda <N>)
+
+- Commit revisado: <sha>
+- Revisor: code-quality-reviewer
+- Veredicto: aprobada
+
+## Hallazgos
+
+### CRITICO — <titulo corto>
+- Donde: <fichero>:<linea>
+- Que pasa: <una o dos frases>
+- Reproduccion: <los pasos exactos que ejecutaste, y su salida>
+- Impacto: <que le ocurre a quien use esto>
+- Sugerencia: <la direccion, no el parche>
+
+### IMPORTANTE — ...
+### MENOR — ...
+```
+
+Si no hay nada que reportar, la seccion de hallazgos dice **"sin hallazgos"**
+de forma explicita, y se anade que se ejecuto para llegar a esa conclusion:
+que comandos, que suite, que mutaciones. Un "sin hallazgos" sin esa lista no
+se distingue de no haber mirado.
+
+### La linea del veredicto
+
+`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
+hace fail-closed. **Sustituye** la linea de la plantilla; no anadas otra
+debajo, porque *todas* las lineas de veredicto del informe tienen que aprobar.
+
+| Linea escrita | Resultado |
+|---|---|
+| `- Veredicto: aprobada` | aprueba |
+| `- Veredicto: aprobada con menores documentados` | aprueba (el valor empieza por `aprobada`) |
+| `- Veredicto: cambios-solicitados` | **no aprueba** — es lo correcto si pides cambios |
+| `- Veredicto: rechazada` | **no aprueba** |
+| `- Veredicto: PENDIENTE (...)` | **no aprueba** — es la plantilla sin sustituir |
+| `- Veredicto: **aprobada**` | **no aprueba** — los asteriscos rompen el inicio |
+| `- Veredicto: aprobado` | **no aprueba** — `aprobado` no es `aprobada` |
+| `Veredicto: aprobada` (sin el guion) | **no aprueba** — no cuenta como linea de veredicto |
+| (sin ninguna linea de veredicto) | **no aprueba** |
+
+Reglas del valor, para no pelearse con el parser: tiene que **empezar** por
+`aprobada`, y no puede contener la palabra `pendiente` ni la cadena
+`cambios-solicitados`. El matiz va en el **cuerpo** del informe, no en esa
+linea.
+
+Criterio para elegirlo, y no es negociable: **CRITICO o IMPORTANTE sin
+corregir implica `cambios-solicitados`**. Con solo hallazgos MENOR se puede
+aprobar, siempre que queden documentados con su motivo.
+
+## Lo que esta skill NO hace
+
+- **No implementa la correccion.** Escribe el caso que falla y donde; el
+  arreglo lo hace quien implemento la tarea.
+- **No reescribe el codigo del otro** ni "aprovecha para" refactorizar,
+  renombrar o reordenar. Un revisor que edita deja de ser independiente, y la
+  siguiente ronda ya no tiene a nadie que la revise.
+- **No redisena la tarea.** Si la implementacion contradice al diseno, se
+  documenta la divergencia; cambiarlo es una decision de la persona
+  responsable.
+- **No aprueba por simpatia**, ni porque "casi todo esta bien", ni porque la
+  tarea ya vaya por la tercera ronda, ni porque el hallazgo obligue a repetir
+  trabajo. Tampoco inventa hallazgos para justificar el pase.
+- **No convierte preferencias de estilo en bloqueos.** Si no puedes nombrar el
+  fallo que produce, es MENOR.
+- **No sustituye a la puerta determinista** de build, linter y tests. Si esa
+  puerta esta en rojo, aqui no se empieza.
+- **No mueve la tarea de estado, no mergea y no commitea.** Eso es trabajo de
+  `taskctl finish`, y solo ocurre si el veredicto aprueba.
+- **No revisa el repositorio entero**: revisa el diff que le llega. Si de
+  verdad necesita mas contexto, lo pide para un hallazgo concreto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
new file mode 100644
index 0000000..8e752b2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -0,0 +1,309 @@
+---
+name: csharp-autocad-ifc-reviewer
+description: Revision por pares de codigo C# que interopera con la API de AutoCAD o que produce/consume modelos IFC. Se usa cuando el diff de una tarea toca ficheros .cs, .csproj, .sln, .ifc o .ifcxml, o cuando la tarea menciona AutoCAD, ObjectARX, AcDbMgd, Civil 3D, BricsCAD, IFC, IfcOpenShell, xBIM o BIM. Es una skill de revision, no de implementacion.
+---
+
+# Revisor de C# sobre AutoCAD e IFC
+
+Revisa el trabajo de **otro** agente sobre codigo C# que habla con la API de
+AutoCAD, con un modelo IFC, o con los dos. El objetivo no es opinar sobre el
+diff: es **encontrar el caso que lo rompe y demostrarlo**.
+
+## Cuando aplica
+
+Cuando el diff de la tarea toca ficheros que casan con estos patrones. Se
+declaran aqui para que el comando que enruta la revision los lea tal cual:
+
+```yaml
+rol: revisor
+patrones_archivo: ["**/*.cs", "**/*.csproj", "**/*.sln", "**/*.ifc", "**/*.ifcxml", "**/*.ifcjson"]
+```
+
+Matiz que evita revisiones vacias: `**/*.cs` es el patron decisivo. Un diff
+que **solo** toca `.csproj` o `.sln` es un cambio de empaquetado, y ahi esta
+skill tiene poco que decir mas alla del apartado de referencias a los
+ensamblados de AutoCAD; si el diff no contiene C# ni IFC, dilo en el informe
+en vez de rellenar.
+
+Si el diff toca ademas otros dominios, cada revisor recibe **solo la parte que
+casa con su patron**. No pidas el resto del diff por comodidad; pidelo si un
+hallazgo concreto lo necesita para sostenerse.
+
+## Antes de revisar: la puerta determinista
+
+La revision **no empieza** hasta que pasan, en este orden:
+
+1. **Build** (`dotnet build` / la solucion completa, en Release si el proyecto
+   lo usa).
+2. **Linter / analizadores** (analizadores de Roslyn, `dotnet format
+   --verify-no-changes`, reglas del `.editorconfig`).
+3. **La suite de tests existente**, entera.
+
+Si algo de eso falla, la revision **se detiene ahi**: se reporta el fallo y se
+devuelve la tarea. No se gasta un solo token revisando codigo que no compila o
+que ya tiene la suite en rojo. Un fallo en la puerta no es un hallazgo de
+revision; es un requisito que no se cumplio.
+
+Advertencia especifica del dominio: en muchos entornos la puerta **no puede
+incluir a AutoCAD**, porque el producto no esta instalado en la maquina donde
+se revisa. Eso no es excusa para saltarse los pasos 1-3, que si se pueden
+correr; ver "Lo que no se puede reproducir" mas abajo.
+
+## Como se revisa: reproducir, no leer
+
+Leer el diff sirve para saber **donde mirar**. El hallazgo se construye
+ejecutando:
+
+1. **Clonar el repo a un directorio temporal** fuera del arbol de trabajo de
+   nadie, y situarse en la rama de la tarea. Un clon nuevo no hereda nada:
+   ni paquetes NuGet restaurados, ni `bin/`, ni `obj/`. Restaurar y compilar
+   siempre, **y otra vez tras cada cambio de rama dentro del mismo clon**.
+2. **Correr la suite entera uno mismo**, y anotar el resultado real (numero de
+   tests, fallos, tiempo). "Los tests pasan" sin haberlos corrido no vale.
+3. **Mutar las protecciones**: romper a proposito la linea que el diff dice
+   proteger (el `Commit()`, la comprobacion de `IsErased`, el
+   `CultureInfo.InvariantCulture`, el factor de unidades) y comprobar que
+   algun test se pone rojo. Si sigue verde, la red de regresion no existe y
+   eso ya es un hallazgo.
+4. **Construir el caso que rompe**: un test, un fichero IFC minimo, un dibujo
+   de prueba, o un programa de consola de veinte lineas. Un hallazgo con
+   reproduccion se corrige; un hallazgo sin ella se discute.
+5. **Ejercitar la entrada real**, no solo la API interna: el comando que el
+   usuario escribe, el exportador completo, el fichero que sale al disco.
+
+Reproducciones baratas que este dominio agradece:
+
+- **Round-trip de IFC**: exportar, volver a leer con una libreria distinta de
+  la que escribio (o con un visor), y comparar. Los ficheros IFC rotos suelen
+  escribirse sin error y fallar al leerse.
+- **Cambiar la cultura del proceso** a una con coma decimal
+  (`es-ES`, `de-DE`) y repetir la exportacion/importacion. Rompe mas codigo
+  del que parece.
+- **Modelo grande de verdad**: si el diff toca rendimiento, medir con un
+  modelo del orden de magnitud real, no con tres elementos.
+
+## Que se revisa en este dominio
+
+### Interoperabilidad con la API de AutoCAD
+
+- **Transacciones.** Toda lectura o escritura de la base de datos del dibujo
+  va dentro de una transaccion, y toda transaccion que modifica termina en un
+  `Commit()` explicito. Sin `Commit()`, el `Dispose` aborta y **los cambios
+  desaparecen en silencio**: el comando dice que hizo el trabajo y no lo hizo.
+- **`using` / `Dispose`.** La transaccion, el `DocumentLock`, las bases de
+  datos laterales (`new Database(...)`) y los `DBObject` creados y **no**
+  anadidos a la base de datos van en `using` o se disponen. Y al reves: un
+  objeto que ya pertenece a la base de datos **no** se dispone a mano; hacerlo
+  es corrupcion, no limpieza.
+- **Modo de apertura.** `GetObject(..., OpenMode.ForWrite)` cuando solo se
+  lee, o `ForRead` seguido de una escritura sin `UpgradeOpen()`. Objetos
+  abiertos con una transaccion y usados dentro de otra.
+- **Objetos borrados.** `IsErased` antes de usar un `ObjectId` guardado, e
+  iteradores que devuelven borrados cuando se piden explicitamente.
+- **`ObjectId` frente a `Handle`.** El `ObjectId` es valido dentro de la
+  sesion; persistirlo entre sesiones o entre dibujos no funciona. Lo que se
+  persiste es el `Handle`.
+- **Hilos y contexto del documento.** La API no es segura para hilos:
+  cualquier acceso a `Database`, `Document` o `Editor` desde un `Task.Run`, un
+  `Parallel.For` o la continuacion de un `await` que no vuelve al hilo del
+  documento. `LockDocument()` cuando se escribe desde contexto de aplicacion,
+  desde una paleta o sobre un documento que no es el activo.
+  `MdiActiveDocument` puede ser nulo.
+- **Excepciones de la API.** Capturar la excepcion generica y tragarse un
+  `ErrorStatus` (`eLockViolation`, `eWasErased`, `eNotOpenForWrite`) convierte
+  un fallo concreto en un comportamiento raro sin mensaje.
+- **Eventos.** Suscribirse a eventos de la base de datos o del gestor de
+  documentos y no desuscribirse deja el plugin llamando sobre documentos
+  cerrados durante el resto de la sesion de AutoCAD.
+- **Estado estatico.** Un plugin vive tanto como la sesion: un `static`
+  mutable arrastra estado de un dibujo al siguiente.
+- **Referencias a los ensamblados de AutoCAD.** Van con copia local
+  desactivada. Copiadas al directorio de salida, el plugin falla al cargar o
+  tumba el producto. Y la version del framework debe seguir siendo la que
+  soporta la version de AutoCAD declarada.
+
+### Modelo de datos IFC
+
+- **Jerarquia espacial.** Proyecto, emplazamiento, edificio, planta y
+  elementos, agregados con las relaciones correspondientes. Un elemento sin
+  contencion espacial se escribe sin error y desaparece en la mitad de los
+  visores.
+- **Identificadores globales.** Deben ser identificadores IFC validos, unicos
+  y **estables entre exportaciones**. Regenerarlos en cada exportacion rompe
+  el seguimiento de cambios, las anotaciones y la federacion de modelos, y no
+  se nota hasta la segunda exportacion.
+- **Propiedades.** Conjuntos de propiedades enlazados por la relacion correcta
+  y con el tipo de valor correcto. Un numero escrito como texto pasa la
+  exportacion y falla en la medicion.
+- **Unidades.** La asignacion de unidades del proyecto tiene que coincidir con
+  los numeros que se escriben. El error clasico es el dibujo en milimetros
+  exportado a un proyecto declarado en metros: el factor 1000 aplicado dos
+  veces, o ninguna. Angulos en radianes frente a grados, misma historia.
+- **Sistemas de coordenadas.** Colocacion relativa frente a absoluta mezcladas
+  en el mismo modelo; el norte real y la georreferenciacion del emplazamiento;
+  coordenadas de proyecto frente a coordenadas topograficas. Un modelo con
+  coordenadas grandes (del orden de las UTM) escrito con precision
+  insuficiente sale desplazado o deformado, no roto: por eso se cuela.
+- **Version del esquema.** Lo que declara la cabecera y lo que contiene el
+  fichero tienen que ser lo mismo. Entidades y atributos que existen en una
+  version y no en otra, entidades marcadas como obsoletas, y la definicion de
+  vista declarada frente a la que el fichero cumple de verdad.
+- **Serializacion.** Codificacion del fichero y escapado de los caracteres no
+  ASCII en nombres y descripciones. Un nombre con una letra acentuada o una
+  ene con virgulilla mal escapada invalida el fichero entero.
+
+### Rendimiento sobre modelos grandes
+
+- Una transaccion por elemento dentro de un bucle de decenas de miles de
+  elementos, o transacciones anidadas innecesarias.
+- Abrir cada objeto para filtrar por una propiedad que se podia filtrar antes
+  de abrirlo.
+- Materializar la coleccion entera en memoria cuando se podia recorrer.
+- Busqueda lineal dentro de un bucle sobre las relaciones IFC: es cuadratico y
+  se nota solo a partir de cierto tamano. Indexar por identificador.
+- Refrescos de pantalla o escritura en la linea de comandos por elemento.
+- Concatenacion de cadenas en el bucle de serializacion.
+- **Y la regla que las cubre a todas**: una mejora de rendimiento sin un
+  numero medido antes y despues, sobre un modelo del tamano real, no es una
+  mejora — es una hipotesis. Pidela medida.
+
+### Trampas de C# que aparecen aqui
+
+- **Cultura.** Convertir numeros a texto o al reves sin cultura invariante al
+  escribir o leer IFC, DXF o cualquier formato de intercambio. En una maquina
+  con coma decimal el fichero sale corrupto y en la del desarrollador no.
+- **Comparacion de dobles.** Coordenadas comparadas con igualdad exacta en vez
+  de con la tolerancia del modelo.
+- **Precision.** Coordenadas de modelo grandes en simple precision.
+- **`catch` vacio** o que captura la excepcion base y sigue como si nada.
+- **`async void`**, y esperas sincronas sobre tareas en el hilo de interfaz:
+  bloqueo permanente del producto.
+- **Nulos.** El documento activo, la seleccion y el resultado de una peticion
+  al usuario pueden no existir; el usuario puede cancelar.
+- **Recursos no liberados cuando salta la excepcion**: sin `using`, un `return`
+  temprano o un fallo deja el bloqueo del documento puesto.
+
+## Clasificacion de hallazgos
+
+**CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
+contrario de lo que dice. En este dominio:
+
+- Transaccion sin `Commit()` en un camino que dice modificar: el usuario
+  ejecuta el comando, no sale error, y el dibujo no cambia.
+- Llamada a la API de AutoCAD desde un hilo distinto al del documento: tumba
+  el producto y se lleva el trabajo sin guardar del usuario.
+- `Dispose` sobre un objeto propiedad de la base de datos.
+- Factor de unidades mal aplicado en la exportacion: el modelo entero sale a
+  escala equivocada y el error se propaga a mediciones y presupuestos.
+- Identificadores globales regenerados en cada exportacion.
+- Conversion numerica dependiente de la cultura al escribir el fichero de
+  intercambio.
+- Un fichero declarado en una version del esquema que contiene entidades de
+  otra: el receptor no puede abrirlo.
+
+**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:
+
+- Elementos exportados sin contencion espacial: no se ven en el visor del
+  cliente.
+- Falta el bloqueo del documento al escribir desde una paleta: falla la
+  primera vez que alguien lo usa sin el dibujo enfocado.
+- `ErrorStatus` tragado: el comando falla en silencio ante un objeto bloqueado.
+- Eventos nunca desuscritos.
+- Recorrido cuadratico de las relaciones IFC: correcto, pero el modelo real
+  del cliente tarda horas.
+- Propiedades escritas con el tipo de valor equivocado.
+
+**MENOR** — todo lo demas: nombres, comentarios que ya no son ciertos,
+duplicacion sin consecuencia demostrada, un `using` de mas, estilo.
+
+**Todos los hallazgos se documentan, tambien los que se decide no corregir**,
+con el motivo. Sin esa nota, el siguiente lector concluye que hay un bug donde
+hay una decision. Un "sin hallazgos" explicito es una respuesta valida;
+inventar hallazgos para tener algo que reportar, no.
+
+## Lo que no se puede reproducir
+
+Si AutoCAD no esta disponible en la maquina de revision, hay hallazgos que no
+se pueden demostrar ejecutando. En ese caso:
+
+- Reproduce lo que si se puede sin el producto: la logica pura, la
+  serializacion IFC, la conversion de unidades, el comportamiento con otra
+  cultura, la suite de tests.
+- Para lo demas, **dilo tal cual en el informe**: "no verificado, requiere
+  AutoCAD instalado", con el caso concreto que habria que ejecutar y el
+  resultado esperado. Un hallazgo declarado como no verificado es util; el
+  mismo hallazgo presentado como comprobado es una mentira que alguien
+  descubrira mas tarde.
+
+Lo que **no** vale es degradar la revision entera a lectura de diff y no
+decirlo.
+
+## El informe
+
+Se escribe sobre el fichero de informe de la ronda que genera `taskctl
+review`, sin borrar la peticion. Estructura fija:
+
+```
+# Informe de revision — <ID de la tarea> (ronda <N>)
+
+- Commit revisado: <sha>
+- Revisor: csharp-autocad-ifc-reviewer
+- Veredicto: aprobada
+
+## Hallazgos
+
+### CRITICO — <titulo corto>
+- Donde: <fichero>:<linea>
+- Que pasa: <una o dos frases>
+- Reproduccion: <los pasos exactos que ejecutaste, y su salida>
+- Impacto: <que le ocurre a quien use esto>
+- Sugerencia: <la direccion, no el parche>
+
+### IMPORTANTE — ...
+### MENOR — ...
+```
+
+Si no hay nada que reportar, la seccion de hallazgos dice **"sin hallazgos"**
+de forma explicita, y se anade que se ejecuto para llegar a esa conclusion.
+
+### La linea del veredicto
+
+`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
+hace fail-closed. **Sustituye** la linea de la plantilla; no anadas otra
+debajo, porque *todas* las lineas de veredicto del informe tienen que aprobar.
+
+| Linea escrita | Resultado |
+|---|---|
+| `- Veredicto: aprobada` | aprueba |
+| `- Veredicto: aprobada con menores documentados` | aprueba (el valor empieza por `aprobada`) |
+| `- Veredicto: cambios-solicitados` | **no aprueba** — es lo correcto si pides cambios |
+| `- Veredicto: rechazada` | **no aprueba** |
+| `- Veredicto: PENDIENTE (...)` | **no aprueba** — es la plantilla sin sustituir |
+| `- Veredicto: **aprobada**` | **no aprueba** — los asteriscos rompen el inicio |
+| `- Veredicto: aprobado` | **no aprueba** — `aprobado` no es `aprobada` |
+| `Veredicto: aprobada` (sin el guion) | **no aprueba** — no cuenta como linea de veredicto |
+| (sin ninguna linea de veredicto) | **no aprueba** |
+
+Reglas del valor, para no pelearse con el parser: tiene que **empezar** por
+`aprobada`, y no puede contener la palabra `pendiente` ni la cadena
+`cambios-solicitados`. El matiz va en el **cuerpo** del informe, no en esa
+linea.
+
+## Lo que esta skill NO hace
+
+- **No implementa la correccion.** Escribe el caso que falla y donde; el
+  arreglo lo hace quien implemento la tarea.
+- **No reescribe el codigo del otro** ni "aprovecha para" refactorizar,
+  renombrar o reordenar. Un revisor que edita deja de ser independiente.
+- **No redisena la tarea.** Si la implementacion contradice al diseno, se
+  documenta la divergencia; cambiarlo es una decision de la persona
+  responsable.
+- **No aprueba por simpatia**, ni porque "casi todo esta bien", ni porque la
+  tarea ya vaya por la tercera ronda. Tampoco inventa hallazgos para justificar
+  el pase.
+- **No sustituye a la puerta determinista** de build, linter y tests. Si esa
+  puerta esta en rojo, aqui no se empieza.
+- **No mueve la tarea de estado, no mergea y no commitea.** Eso es trabajo de
+  `taskctl finish`, y solo ocurre si el veredicto aprueba.
+- **No revisa el repositorio entero**: revisa el diff que le llega. Si de
+  verdad necesita mas contexto, lo pide para un hallazgo concreto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
new file mode 100644
index 0000000..ed97608
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
@@ -0,0 +1,271 @@
+---
+name: java-spring-reviewer
+description: Revisor por pares de diffs de Java y Spring Boot. Se usa cuando el diff de una tarea toca ficheros .java, pom.xml, build.gradle o application*.yml y hay que revisar capas de servicio y repositorio, limites transaccionales, gestion de excepciones, inyeccion, consultas N+1, validacion de entrada, configuracion por perfiles y tests con contexto real antes de cerrar la tarea.
+---
+
+# Revision por pares de Java y Spring
+
+Revisa el diff de una tarea que toca codigo Java o Spring Boot. **Lo revisa
+un agente que no implemento la tarea**: la independencia es el punto, no un
+formalismo.
+
+## Que recibe este revisor y que no
+
+Recibe el **`git diff` de la rama contra su base**, no el repositorio
+entero. Y si el diff toca varios dominios a la vez, recibe **solo la parte
+que casa con los patrones de mas abajo**: los ficheros de frontend, de
+infraestructura o de otro lenguaje van a su propio revisor, en paralelo.
+
+Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
+(el fichero completo, la entidad que la consulta toca, el `pom.xml`) en vez
+de dar por hecho lo que no se ve. Lo que no vale es leer el repositorio
+entero "por si acaso": pedir tres ficheros concretos es barato, cargar el
+proyecto no.
+
+Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
+sentido, el enrutado puede caer a un unico pase generico. Eso lo decide
+quien orquesta, no esta skill.
+
+## Patrones de fichero
+
+Con estos patrones se decide si este revisor entra en un diff. Estan en
+estilo flow para que un catalogo los recoja **tal cual**, sin reescribirlos:
+
+```yaml
+rol: revisor
+patrones_archivo: ["**/*.java", "src/main/java/**", "src/test/java/**", "**/pom.xml", "**/build.gradle", "**/build.gradle.kts", "**/settings.gradle", "**/settings.gradle.kts", "**/application*.properties", "**/application*.yml", "**/application*.yaml", "**/bootstrap*.yml", "**/src/main/resources/db/migration/**", "**/src/main/resources/db/changelog/**"]
+```
+
+Un servicio de Spring escrito en Kotlin **no lo captura ninguno de esos
+patrones, a proposito**. Los criterios de este documento aplican igual a ese
+codigo, pero el enrutado automatico no lo va a mandar aqui: si alguien
+quiere esa revision, la pide a mano.
+
+## Reproducir antes de reportar
+
+Esto no es leer el diff y opinar. Un hallazgo se reporta **cuando existe el
+caso que lo demuestra**, no cuando parece que podria pasar.
+
+1. **Clonar el repo a un directorio temporal** y hacer checkout de la rama.
+   No revisar sobre el arbol de trabajo de quien implemento: hereda su
+   estado, su cache y sus ficheros sin commitear.
+2. **Compilar de cero**: `./mvnw -q verify -DskipTests` o
+   `./gradlew build -x test`. Un clon no hereda `target/`, `build/` ni nada
+   compilado, y esa es justo la gracia. Si no compila, ahi acaba la
+   revision: se reporta eso y nada mas.
+3. **Correr la suite entera antes de tocar nada**, para tener la linea base.
+   Un test que ya estaba rojo antes del diff no es un hallazgo de esta
+   tarea, pero si es un dato que va en el informe.
+4. **Construir el caso que rompe.** Un test nuevo que falla contra la rama,
+   o una llamada real contra la aplicacion levantada. Lo que no se ha
+   ejecutado no se afirma.
+5. **Mutacion**: romper a proposito la proteccion que el diff dice anadir y
+   comprobar que algun test se pone rojo. Si sigue verde, la proteccion no
+   tiene red y eso es un hallazgo por si solo.
+
+Tecnicas que dan mas hallazgos que la lectura, por area:
+
+- **N+1 y consultas**: activar el log de SQL
+  (`logging.level.org.hibernate.SQL=DEBUG`, o un contador de sentencias
+  alrededor del caso) y **contar las consultas con 2 filas y con 20**. Si el
+  numero crece con las filas, es un N+1 medido; si no crece, no lo es, por
+  mucho que el codigo lo parezca.
+- **Transacciones**: forzar la excepcion en mitad del metodo y **mirar en la
+  base de datos** si la primera escritura quedo. El rollback se comprueba en
+  la tabla, no en la anotacion.
+- **Perfiles**: arrancar con el perfil que la tarea toca, no solo con el de
+  test. Media configuracion rota solo se ve ahi.
+- **Validacion**: mandar la peticion malformada de verdad y mirar el codigo
+  de estado y el cuerpo que salen.
+
+## Que se revisa
+
+**Capas de servicio y repositorio.** Que la logica de negocio no se haya
+colado en el controlador ni en el repositorio. Que las entidades JPA no
+escapen a la capa web serializadas tal cual (cambiar una columna deja de ser
+una decision interna y pasa a romper clientes). Que el repositorio no
+devuelva entidades gestionadas para que otro las navegue fuera de la
+transaccion.
+
+**Transacciones y sus limites.** Donde empieza y donde acaba cada una:
+
+- `@Transactional` en un metodo llamado **desde el mismo bean**: el proxy no
+  intercepta la auto-invocacion y la anotacion no hace absolutamente nada.
+  Igual en metodos `private`, `final` o `static`.
+- Rollback: por defecto solo revierte con `RuntimeException` y `Error`. Una
+  excepcion comprobada **commitea** salvo `rollbackFor`.
+- Transacciones que envuelven una llamada de red, un envio de correo o una
+  espera: la conexion queda ocupada lo que dure el timeout ajeno.
+- Escrituras en varias tablas o servicios sin un limite transaccional claro:
+  ahi es donde queda el estado a medias.
+- `readOnly = true` ausente en consultas puras, y `REQUIRES_NEW` puesto sin
+  entender que abre una segunda conexion.
+
+**Gestion de excepciones.** Que no haya `catch (Exception e)` que registra y
+sigue como si el fallo no hubiera ocurrido. Que la causa no se pierda
+(`throw new X(e.getMessage())` tira la traza). Que las excepciones de
+dominio se traduzcan a codigos HTTP con sentido en un `@ControllerAdvice` y
+no salgan como 500 con la traza dentro del cuerpo. Que no queden
+`printStackTrace` ni bloques `catch` vacios.
+
+**Inyeccion.** Constructor frente a `@Autowired` sobre el campo (lo segundo
+esconde dependencias y estorba en los tests). Colaboradores instanciados con
+`new` dentro del servicio, que ya no se pueden sustituir. Y sobre todo
+**estado mutable en un bean singleton**: un campo no final que se escribe
+por peticion es estado compartido entre peticiones concurrentes, y falla
+solo bajo carga.
+
+**Consultas N+1.** Relaciones `LAZY` recorridas dentro de un bucle, `EAGER`
+puesto para "arreglarlo" (que lo convierte en un problema global), falta de
+`join fetch` o `@EntityGraph` donde se sabe que se va a navegar la relacion,
+y el caso que casi siempre se cuela: **paginacion junto a un `join fetch` de
+coleccion**, que Hibernate resuelve trayendose todo y paginando en memoria
+(avisa con `HHH000104` y nadie lee el log).
+
+**Validacion de entrada.** `@Valid` o `@Validated` presentes donde entra el
+`@RequestBody`; restricciones declaradas en el DTO y no solo en la entidad;
+el manejador que traduce `MethodArgumentNotValidException` a una respuesta
+util en vez de a un 500; limites en los parametros que el cliente controla
+(tamano de pagina, longitud de listas); y cero concatenacion de entrada de
+usuario en JPQL o SQL nativo.
+
+**Configuracion por perfiles.** Propiedades que solo existen en el perfil de
+desarrollo y revientan el arranque en el resto. Secretos escritos en un
+fichero versionado. `@Profile` que deja un bean sin candidato en produccion.
+Y `ddl-auto` en `update` o `create-drop` en cualquier perfil que no sea
+estrictamente local.
+
+**Tests con contexto real.** Que la prueba ejercite lo que la tarea cambio y
+no un doble de ello: `@MockBean` sobre el repositorio bajo prueba significa
+que la consulta rota pasa el test. Que la base de datos de test se parezca a
+la real (una en memoria acepta SQL que el motor de produccion rechaza). Que
+el `@Transactional` del propio test no este ocultando que el codigo de
+produccion nunca commitea. Y que exista al menos un test que falle si se
+revierte el cambio.
+
+## Clasificacion de los hallazgos
+
+**CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
+contrario de lo que dice:
+
+- `@Transactional` que no aplica por auto-invocacion en un metodo que
+  escribe en dos tablas: la segunda falla, la primera queda escrita.
+- Excepcion comprobada lanzada dentro de una transaccion sin `rollbackFor`:
+  commitea el estado a medias.
+- `catch (Exception e)` que se traga el fallo de una operacion de pago o de
+  borrado y devuelve 200.
+- `ddl-auto: update` activo en el perfil de produccion.
+- Secreto o credencial anadido a un fichero de configuracion versionado.
+- Consulta de borrado o actualizacion masiva sin el filtro que la acota.
+
+**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:
+
+- N+1 **medido** en un endpoint que la tarea toca.
+- `@RequestBody` sin `@Valid` en un endpoint expuesto, con restricciones
+  declaradas que por tanto no se aplican.
+- Excepcion de dominio que llega al cliente como 500 en vez de 404 o 409.
+- Estado mutable compartido en un bean singleton.
+- Paginacion con `join fetch` de coleccion: pagina en memoria.
+- Test nuevo que mockea justo la pieza que la tarea cambio, de modo que
+  seguiria verde con el cambio revertido.
+
+**MENOR** — todo lo demas:
+
+- Inyeccion por campo en vez de por constructor.
+- Falta `readOnly = true` en un metodo de solo lectura.
+- Nivel de log inadecuado, o mensaje que ya no dice la verdad.
+- Nombre de metodo de repositorio que no describe lo que consulta.
+- Import o dependencia que el diff deja sin usar.
+
+Todos los hallazgos se documentan, **tambien los que se decide no
+corregir**, con el motivo. Un "sin hallazgos" explicito es una respuesta
+valida; inventar hallazgos para tener algo que reportar, no.
+
+## Estructura del informe
+
+`taskctl review` deja el esqueleto del informe en la carpeta de revision de
+la tarea, numerado por ronda. Se rellena con esta estructura, sin anadir
+prosa por encima:
+
+```markdown
+# Informe de revision <N> — <ID de la tarea>
+
+## Alcance
+- Revisor: java-spring-reviewer
+- Ficheros revisados: <los del diff que casaron con los patrones>
+- Contexto adicional pedido: <ninguno, o que y por que>
+
+## Reproduccion
+- Clon: <ruta temporal y rama>
+- Build: <comando y resultado>
+- Suite: <comando, resultado, y linea base antes del diff>
+- Casos construidos: <que se ejecuto para demostrar cada hallazgo>
+
+## Hallazgos
+
+### CRITICO-1 — <titulo corto>
+- Donde: <fichero:linea>
+- Que hace hoy: <comportamiento observado>
+- Como se ha reproducido: <comando o test, y su salida>
+- Por que es CRITICO: <consecuencia concreta>
+- Que deberia hacer: <la correccion propuesta, no aplicada>
+
+### IMPORTANTE-1 — <titulo corto>
+<mismos campos>
+
+### MENOR-1 — <titulo corto>
+<mismos campos, mas si se propone no corregirlo y por que>
+
+## Revisado sin hallazgos
+<areas del diff que se miraron y salieron limpias, para que conste que se
+miraron>
+
+## Veredicto
+- Veredicto: aprobada
+```
+
+Dos rondas es lo normal, no una excepcion: la ronda 2 revisa las
+correcciones de la ronda 1, que es justo donde entran los fallos nuevos. En
+la ronda 2 se comprueba **cada hallazgo de la ronda anterior** ademas del
+codigo nuevo.
+
+## La linea del veredicto
+
+`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
+hace fail-closed: acepta una linea que, sin espacios y en minusculas,
+empiece por `- veredicto:` y cuyo **valor empiece** por `aprobada`. Si el
+valor contiene `pendiente` o `cambios-solicitados`, no aprueba. Y si el
+informe tiene varias lineas de veredicto, **todas** tienen que aprobar — por
+eso se **sustituye** la linea de la plantilla, no se anade otra debajo.
+
+| Linea escrita | Resultado |
+|---|---|
+| `- Veredicto: aprobada` | aprueba |
+| `- Veredicto: aprobada con correcciones menores` | aprueba (el valor empieza por `aprobada`) |
+| `- Veredicto: cambios-solicitados` | no aprueba, y es lo correcto si hay CRITICO o IMPORTANTE |
+| `- Veredicto: rechazada` | no aprueba |
+| `- Veredicto: no aprobada` | no aprueba: el valor no *empieza* por `aprobada` |
+| `- Veredicto: PENDIENTE (rellenar)` | no aprueba: es la plantilla sin sustituir |
+| `- Veredicto: **APROBADA**` | no aprueba: los asteriscos rompen el inicio |
+| `- Veredicto: aprobado` | no aprueba: `aprobado` no es `aprobada` |
+| `Veredicto: aprobada` | no cuenta como linea de veredicto, y sin ninguna no aprueba |
+
+El matiz va en el cuerpo del informe, nunca en esa linea. Un revisor que
+escriba el veredicto en su propio vocabulario bloquea el cierre y obliga a
+un commit de normalizacion que no arregla nada.
+
+## Lo que esta skill no hace
+
+- **No implementa la correccion.** Propone el arreglo en el informe; lo
+  aplica quien implemento la tarea.
+- **No reescribe el codigo ajeno** ni commitea en la rama revisada. Los
+  unicos ficheros que toca son los suyos temporales y el informe.
+- **No aprueba por simpatia.** Si hay un CRITICO o un IMPORTANTE sin
+  corregir, el veredicto es `cambios-solicitados`, aunque el resto del diff
+  este impecable y aunque la tarea vaya con prisa.
+- **No inventa hallazgos** para que el informe no salga vacio.
+- **No revisa ficheros fuera de sus patrones**: si al leer el diff aparece
+  algo de otro dominio que preocupa, se anota en una linea y se deja para su
+  revisor, no se juzga aqui.
+- **No sustituye a la puerta determinista** (build, linter, tests). Si eso
+  esta rojo, no hay nada que revisar todavia.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts
new file mode 100644
index 0000000..c35b7a7
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/agents/brainstorm-roles.test.ts
@@ -0,0 +1,539 @@
+/**
+ * Tests de los cuatro roles del brainstorm paralelo: `agents/brainstorm-*.md`.
+ *
+ * Mismo reparto en dos bloques que test/skills/task-workflow.test.ts, y por
+ * los mismos motivos:
+ *
+ * 1. ESTRUCTURALES. Replican a proposito las reglas que el validador
+ *    oficial aplica, mas las que son propias de estos ficheros (que cada
+ *    rol declare su contexto y su salida acotada, y que no viajen marcas
+ *    de este repositorio). Existen para que la red de regresion tambien
+ *    exista donde `claude` no esta instalado, como el CI de Linux.
+ *
+ * 2. DE INTEGRACION. Ejecutan el validador real. La comprobacion de mas
+ *    valor no es "valida", sino la CONTRAPRUEBA: sobre una copia temporal
+ *    se rompe el frontmatter de CADA UNO de los cuatro agentes, de uno en
+ *    uno, y se comprueba que el validador falla NOMBRANDO ese fichero.
+ *    Un "passed" en silencio es ambiguo entre "los miro y estan bien" y
+ *    "nunca miro esa carpeta"; romperlos desambigua.
+ *
+ *    Medido el 2026-09-07 con claude 2.1.226: con un agente roto la salida
+ *    trae una linea "Validating agent: <ruta>" y sale 1. Sin romper nada
+ *    no menciona ningun agente: el validador solo nombra lo que falla.
+ *
+ * Cero dependencias: se reutiliza `parseFrontmatter` de src/core/.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { spawnSync } from 'node:child_process';
+import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseFrontmatter } from '../../src/core/frontmatter.js';
+
+// --- Localizacion del plugin -------------------------------------------
+//
+// Compilado, este fichero vive en dist/test/agents/. Tres niveles arriba
+// esta la raiz del plugin. Mismo truco que src/fs/gitflow-runner.ts, en
+// vez de depender del cwd de npm.
+
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
+
+const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');
+
+/** Los cuatro roles, con el nombre de fichero literal que deben tener. */
+const ROLES = [
+  'brainstorm-arquitectura',
+  'brainstorm-riesgos',
+  'brainstorm-testing',
+  'brainstorm-dominio',
+] as const;
+
+const FICHEROS = ROLES.map((r) => `${r}.md`);
+
+/** Claves que se admiten en el frontmatter de un agente. Nada mas. */
+const CLAVES_PERMITIDAS = new Set(['name', 'description', 'tools', 'model']);
+
+const MAX_LONGITUD_NAME = 64;
+const MAX_LONGITUD_DESCRIPTION = 1024;
+const MAX_LINEAS_CUERPO = 300;
+
+const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);
+
+/**
+ * Marcas de este repositorio. Los cuatro ficheros se distribuyen a
+ * proyectos que no son este: si una de estas cadenas viaja dentro, el
+ * agente le habla al lector de un repo que no tiene delante.
+ */
+const MARCAS_DEL_REPO = [
+  'TaskCode',
+  'taskctl',
+  'taskcode',
+  'tareas/',
+  'docs/contexto',
+  'PROPUESTA_METODOLOGIA',
+  'CHECKLIST_TERMINACION',
+  'plan-final.md',
+  'TASK-0',
+];
+
+/** Rutas absolutas de maquina que tampoco deben viajar. */
+const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];
+
+/**
+ * Secciones que TODO rol tiene que declarar. Las tres ultimas son la
+ * razon de ser de este test: sin ellas el rol no dice que contexto
+ * necesita (y recibiria el paquete completo, que es justo el gasto que
+ * el diseno evita), o deja su salida en prosa libre.
+ */
+const SECCIONES_OBLIGATORIAS = [
+  '## Qué miras',
+  '## Qué NO miras',
+  '## Qué contexto necesitas',
+  '## Tu salida',
+  '## Reglas que no se negocian',
+];
+
+/** Marcadores del contrato de salida, dentro de la plantilla de cada rol. */
+const MARCADORES_DE_SALIDA = [
+  '## Desacuerdos previstos',
+  '## Suposiciones no verificadas',
+];
+
+const rutaDe = (fichero: string): string => path.join(AGENTS_DIR, fichero);
+
+/**
+ * Colapsa cualquier racha de espacios en blanco a uno solo. Las
+ * aserciones sobre frases del cuerpo se hacen contra esto: si no, un
+ * salto de linea del ajuste de parrafo partiria la frase buscada y el
+ * test fallaria por como esta maquetado el texto, no por lo que dice.
+ */
+const normalizar = (s: string): string => s.replace(/\s+/g, ' ');
+
+async function leerTexto(fichero: string): Promise<string> {
+  return readFile(rutaDe(fichero), 'utf8');
+}
+
+async function existe(p: string): Promise<boolean> {
+  try {
+    await stat(p);
+    return true;
+  } catch {
+    return false;
+  }
+}
+
+// Guard de no-vacuidad: si PLUGIN_ROOT apuntase a otro sitio, varios de
+// los tests de abajo pasarian sin comprobar nada real.
+test('el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)', async () => {
+  const pkg = JSON.parse(
+    await readFile(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')
+  ) as { name?: unknown };
+  assert.equal(
+    pkg.name,
+    'taskcode-plugin',
+    `PLUGIN_ROOT resuelto a "${PLUGIN_ROOT}", que no es el plugin`
+  );
+});
+
+// --- 1. Estructurales ---------------------------------------------------
+
+test('1. agents/ contiene los cuatro ficheros, con ese nombre y ese case exactos', async () => {
+  // En Windows el filesystem es case-insensitive: un stat() de la ruta NO
+  // demuestra el case. El listado del directorio si lo demuestra.
+  const enAgents = await readdir(AGENTS_DIR);
+  const faltan = FICHEROS.filter((f) => !enAgents.includes(f));
+  assert.deepEqual(
+    faltan,
+    [],
+    `agents/ no contiene ${faltan.join(', ')}. Hay: ${enAgents.join(', ')}`
+  );
+});
+
+for (const fichero of FICHEROS) {
+  const rol = fichero.replace(/\.md$/, '');
+
+  test(`2. ${fichero}: empieza por los tres guiones, sin BOM ni espacios delante`, async () => {
+    const bytes = await readFile(rutaDe(fichero));
+
+    // El BOM UTF-8 desplaza el "---" y Claude Code deja de ver
+    // frontmatter: carga el agente con metadatos vacios. Fallo silencioso.
+    assert.ok(
+      !bytes.subarray(0, 3).equals(BOM_UTF8),
+      `${fichero} empieza con BOM UTF-8 (EF BB BF): el frontmatter no se parseara`
+    );
+    assert.equal(
+      bytes[0],
+      0x2d,
+      `el primer byte de ${fichero} es 0x${(bytes[0] ?? 0).toString(16)}, no un guion`
+    );
+    assert.match(
+      bytes.toString('utf8'),
+      /^---\r?\n/,
+      `${fichero} no empieza exactamente por "---" seguido de salto de linea`
+    );
+  });
+
+  test(`3. ${fichero}: el frontmatter cierra y parsea a objeto`, async () => {
+    // parseFrontmatter lanza si no hay linea de cierre "---".
+    const { data, body } = parseFrontmatter(await leerTexto(fichero));
+    assert.equal(typeof data, 'object');
+    assert.notEqual(data, null);
+    assert.equal(typeof body, 'string');
+  });
+
+  test(`4. ${fichero}: name presente, kebab-case y coincidente con el nombre del fichero`, async () => {
+    const { data } = parseFrontmatter(await leerTexto(fichero));
+    const name = data.name;
+
+    assert.equal(typeof name, 'string', `${fichero}: el frontmatter no tiene "name" como string`);
+    const n = name as string;
+
+    assert.match(n, /^[a-z0-9-]+$/, `"${n}" no es kebab-case (solo a-z, 0-9 y guiones)`);
+    assert.ok(!n.startsWith('-'), `"${n}" empieza por guion`);
+    assert.ok(!n.endsWith('-'), `"${n}" acaba en guion`);
+    assert.ok(!n.includes('--'), `"${n}" tiene doble guion`);
+    assert.ok(
+      n.length <= MAX_LONGITUD_NAME,
+      `"${n}" tiene ${n.length} caracteres (maximo ${MAX_LONGITUD_NAME})`
+    );
+
+    // La coherencia con el fichero es lo que hace invocable al agente:
+    // Claude Code lo llama por su "name", no por su ruta.
+    assert.equal(
+      n,
+      rol,
+      `${fichero} declara name="${n}": no coincide con el nombre del fichero`
+    );
+  });
+
+  test(`5. ${fichero}: description presente, acotada, sin signos de menor/mayor y sin truncar`, async () => {
+    const texto = await leerTexto(fichero);
+    const { data } = parseFrontmatter(texto);
+    const description = data.description;
+
+    assert.equal(
+      typeof description,
+      'string',
+      `${fichero}: el frontmatter no tiene "description" como string`
+    );
+    const d = description as string;
+
+    assert.ok(d.trim().length > 0, `${fichero}: la description esta vacia`);
+    assert.ok(
+      d.length <= MAX_LONGITUD_DESCRIPTION,
+      `${fichero}: description de ${d.length} caracteres (maximo ${MAX_LONGITUD_DESCRIPTION})`
+    );
+    assert.ok(!d.includes('<'), `${fichero}: la description contiene el signo de menor`);
+    assert.ok(!d.includes('>'), `${fichero}: la description contiene el signo de mayor`);
+
+    // La description es lo unico que el orquestador lee para decidir a
+    // quien lanza: tiene que nombrar su propio rol.
+    const palabraDelRol = rol.replace('brainstorm-', '');
+    assert.ok(
+      d.toLowerCase().includes(palabraDelRol),
+      `${fichero}: la description no menciona "${palabraDelRol}", su propio rol: "${d}"`
+    );
+
+    // El parser del proyecto corta un valor sin comillas en el primer
+    // " #" (comentario inline de YAML). Claude Code NO hace eso: una
+    // description con " #" se mediria aqui truncada y las aserciones de
+    // arriba darian verde sobre un valor que no es el que se carga.
+    const lineaCruda = texto.split('\n').find((l) => l.startsWith('description:'));
+    assert.ok(lineaCruda !== undefined, `${fichero}: no hay linea "description:"`);
+    const valorCrudo = lineaCruda.slice('description:'.length).trim();
+    const esperado = valorCrudo.startsWith('"') && valorCrudo.endsWith('"')
+      ? valorCrudo.slice(1, -1).replace(/\\"/g, '"')
+      : valorCrudo;
+    assert.equal(
+      d,
+      esperado,
+      `${fichero}: el parser ha truncado la description (¿contiene " #"?): ` +
+        'lo que mide este test no es lo que leeria Claude Code'
+    );
+  });
+
+  test(`6. ${fichero}: el frontmatter no trae claves fuera de las admitidas`, async () => {
+    const { data } = parseFrontmatter(await leerTexto(fichero));
+    const intrusas = Object.keys(data).filter((k) => !CLAVES_PERMITIDAS.has(k));
+    assert.deepEqual(
+      intrusas,
+      [],
+      `${fichero}: claves no admitidas: ${intrusas.join(', ')} ` +
+        `(permitidas: ${[...CLAVES_PERMITIDAS].join(', ')})`
+    );
+  });
+
+  test(`7. ${fichero}: el cuerpo no esta vacio y cabe en ${MAX_LINEAS_CUERPO} lineas`, async () => {
+    const { body } = parseFrontmatter(await leerTexto(fichero));
+    assert.ok(body.trim().length > 0, `${fichero}: el cuerpo esta vacio`);
+
+    const lineas = body.replace(/\r?\n$/, '').split(/\r?\n/).length;
+    assert.ok(
+      lineas <= MAX_LINEAS_CUERPO,
+      `${fichero}: el cuerpo tiene ${lineas} lineas (maximo ${MAX_LINEAS_CUERPO})`
+    );
+  });
+
+  test(`8. ${fichero}: declara sus secciones, incluidas contexto y salida`, async () => {
+    const { body } = parseFrontmatter(await leerTexto(fichero));
+    const faltan = SECCIONES_OBLIGATORIAS.filter((s) => !body.includes(s));
+    assert.deepEqual(
+      faltan,
+      [],
+      `${fichero}: faltan secciones obligatorias: ${faltan.join(' | ')}`
+    );
+  });
+
+  test(`9. ${fichero}: la seccion de contexto reparte de verdad (lo que necesita y lo que no)`, async () => {
+    const { body } = parseFrontmatter(await leerTexto(fichero));
+    const plano = normalizar(body);
+    // Sin la mitad negativa, "contexto" degenera en "dame todo", que es
+    // exactamente el gasto que el diseno del brainstorm evita.
+    assert.ok(
+      plano.includes('**Necesitas:**'),
+      `${fichero}: la seccion de contexto no lista lo que el rol necesita`
+    );
+    assert.ok(
+      plano.includes('**No necesitas'),
+      `${fichero}: la seccion de contexto no lista lo que el rol NO necesita`
+    );
+  });
+
+  test(`10. ${fichero}: la salida esta acotada con un tope numerico declarado`, async () => {
+    const { body } = parseFrontmatter(await leerTexto(fichero));
+
+    const tope = /\*\*Máximo (\d+) líneas en total\.\*\*/.exec(normalizar(body));
+    assert.ok(
+      tope !== null,
+      `${fichero}: la salida no declara un tope de longitud ("**Máximo N líneas en total.**")`
+    );
+    const n = Number(tope[1]);
+    assert.ok(
+      n > 0 && n <= 100,
+      `${fichero}: el tope declarado es ${n} lineas; fuera de rango util (1..100)`
+    );
+
+    // Estructura fija, no prosa libre: la plantilla tiene que estar en un
+    // bloque de codigo con secciones.
+    assert.match(
+      body,
+      /```\r?\n## /,
+      `${fichero}: no hay plantilla de salida en bloque de codigo con secciones`
+    );
+
+    const faltan = MARCADORES_DE_SALIDA.filter((m) => !body.includes(m));
+    assert.deepEqual(
+      faltan,
+      [],
+      `${fichero}: la plantilla de salida no reserva sitio para ${faltan.join(' | ')}`
+    );
+  });
+
+  test(`11. ${fichero}: prohibe implementar y obliga a no fingir consenso`, async () => {
+    const plano = normalizar(parseFrontmatter(await leerTexto(fichero)).body);
+    assert.ok(
+      plano.includes('no lo implementas'),
+      `${fichero}: no deja escrito que propone enfoque y no implementa`
+    );
+    assert.ok(
+      plano.includes('No escribes ni modificas código de producción'),
+      `${fichero}: no prohibe explicitamente escribir codigo de produccion`
+    );
+    assert.ok(
+      plano.includes('consenso fingido'),
+      `${fichero}: no instruye a señalar el desacuerdo en vez de fingir consenso`
+    );
+  });
+
+  test(`12. ${fichero}: no contiene marcas de este repositorio ni rutas de maquina`, async () => {
+    // Se mira el fichero ENTERO, frontmatter incluido: una marca en la
+    // description viaja igual de lejos que una en el cuerpo.
+    const texto = await leerTexto(fichero);
+    const marcas = MARCAS_DEL_REPO.filter((m) => texto.includes(m));
+    assert.deepEqual(
+      marcas,
+      [],
+      `${fichero}: contiene marcas de este repo: ${marcas.join(', ')}`
+    );
+
+    const rutas = RUTAS_DE_MAQUINA.filter((r) => texto.includes(r));
+    assert.deepEqual(rutas, [], `${fichero}: contiene rutas de maquina: ${rutas.join(', ')}`);
+  });
+}
+
+test('13. los cuatro roles se reparten el trabajo: ningun "Qué miras" es igual a otro', async () => {
+  const secciones = new Map<string, string>();
+  for (const fichero of FICHEROS) {
+    const { body } = parseFrontmatter(await leerTexto(fichero));
+    const desde = body.indexOf('## Qué miras');
+    const hasta = body.indexOf('## Qué NO miras');
+    assert.ok(
+      desde !== -1 && hasta > desde,
+      `${fichero}: no se puede aislar la seccion "Qué miras"`
+    );
+    secciones.set(fichero, body.slice(desde, hasta).trim());
+  }
+
+  const vistos = new Map<string, string>();
+  for (const [fichero, texto] of secciones) {
+    const previo = vistos.get(texto);
+    assert.equal(
+      previo,
+      undefined,
+      `${fichero} y ${String(previo)} declaran exactamente lo mismo en "Qué miras": ` +
+        'si los cuatro roles miran lo mismo, el brainstorm no aporta nada'
+    );
+    vistos.set(texto, fichero);
+  }
+});
+
+test('14. el rol de testing deja escrita la alternativa de degradarlo a checklist del unificador', async () => {
+  const plano = normalizar(parseFrontmatter(await leerTexto('brainstorm-testing.md')).body);
+  assert.ok(
+    plano.includes('checklist del unificador'),
+    'brainstorm-testing.md no menciona la posibilidad de vivir como checklist del unificador'
+  );
+  // Es una posibilidad prevista, no una queja: tiene que decir tambien
+  // que, si se ejecuta como agente, hace su trabajo entero.
+  assert.ok(
+    plano.includes('haz tu trabajo entero'),
+    'brainstorm-testing.md deja la nota abierta sin decir que hacer si se ejecuta como agente'
+  );
+});
+
+test('15. ningun otro rol arrastra la nota del rol de testing', async () => {
+  for (const fichero of FICHEROS.filter((f) => f !== 'brainstorm-testing.md')) {
+    const plano = normalizar(parseFrontmatter(await leerTexto(fichero)).body);
+    assert.ok(
+      !plano.includes('checklist del unificador'),
+      `${fichero}: copia la nota que solo corresponde al rol de testing`
+    );
+  }
+});
+
+// --- 2. De integracion: el validador oficial ----------------------------
+
+interface ResultadoValidate {
+  status: number | null;
+  salida: string;
+}
+
+function claudeDisponible(): boolean {
+  try {
+    const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
+    return r.status === 0;
+  } catch {
+    return false;
+  }
+}
+
+function validar(ruta: string): ResultadoValidate {
+  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
+    encoding: 'utf8',
+    stdio: ['ignore', 'pipe', 'pipe'],
+  });
+  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
+}
+
+// Skip explicito y visible: en el CI de Linux `claude` no esta
+// instalado, y un test que pasa en falso es peor que uno que no corre.
+const SKIP_INTEGRACION: false | string = claudeDisponible()
+  ? false
+  : 'el binario "claude" no esta en el PATH: la comprobacion empirica no se puede hacer aqui';
+
+const CRUZ = '\u2718';
+
+test(
+  '16. `claude plugin validate` sobre el plugin real sale 0',
+  { skip: SKIP_INTEGRACION },
+  () => {
+    const { status, salida } = validar(PLUGIN_ROOT);
+    assert.equal(status, 0, `exit ${String(status)}. Salida:\n${salida}`);
+    assert.ok(!salida.includes(CRUZ), `la salida reporta errores:\n${salida}`);
+  }
+);
+
+test(
+  '17. contraprueba de descubrimiento: romper cada agente de una copia hace fallar al validador nombrandolo',
+  { skip: SKIP_INTEGRACION },
+  async (t) => {
+    // Se trabaja SIEMPRE sobre una copia fuera del repo. Los ficheros
+    // reales no se tocan: romperlos aunque fuera un instante dejaria el
+    // workspace sucio si el test peta a mitad.
+    const tmp = await mkdtemp(path.join(tmpdir(), 'taskcode-agents-'));
+    t.after(async () => {
+      await rm(tmp, { recursive: true, force: true });
+    });
+
+    // Solo lo que el validador necesita: el manifiesto y agents/.
+    await cp(
+      path.join(PLUGIN_ROOT, '.claude-plugin'),
+      path.join(tmp, '.claude-plugin'),
+      { recursive: true }
+    );
+    await cp(AGENTS_DIR, path.join(tmp, 'agents'), { recursive: true });
+
+    // (a) La copia intacta valida limpio. Si no, lo que falle despues no
+    //     se puede atribuir a la mutacion.
+    const intacta = validar(tmp);
+    assert.equal(
+      intacta.status,
+      0,
+      `la copia intacta no valida (exit ${String(intacta.status)}):\n${intacta.salida}`
+    );
+    assert.ok(
+      !intacta.salida.includes(CRUZ),
+      `la copia intacta reporta errores:\n${intacta.salida}`
+    );
+    // El validador solo nombra lo que falla: con todo bien no menciona
+    // ningun agente. De ahi que "passed" por si solo no pruebe nada, y
+    // que haga falta el bucle de abajo.
+    assert.ok(
+      !intacta.salida.includes('Validating agent:'),
+      `la copia intacta ya nombra agentes; la contraprueba dejaria de ser concluyente:\n${intacta.salida}`
+    );
+
+    // (b) De uno en uno: se rompe el YAML del frontmatter (comilla sin
+    //     cerrar en description), se valida, y se restaura.
+    for (const fichero of FICHEROS) {
+      const copia = path.join(tmp, 'agents', fichero);
+      const original = await readFile(copia, 'utf8');
+      const roto = original.replace(/^description:.*$/m, 'description: "sin cerrar la comilla');
+      assert.notEqual(roto, original, `${fichero}: no se encontro la linea "description:" que romper`);
+      await writeFile(copia, roto, 'utf8');
+
+      const rota = validar(tmp);
+      await writeFile(copia, original, 'utf8');
+
+      // Si el validador no mirase agents/, romper el fichero no cambiaria
+      // nada y esto seguiria saliendo 0. Que falle ES la evidencia de que
+      // descubre el agente donde lo pusimos.
+      assert.notEqual(
+        rota.status,
+        0,
+        `romper ${fichero} no hizo fallar al validador: no esta mirando esa ruta.\n${rota.salida}`
+      );
+      assert.match(
+        rota.salida,
+        /Validating agent:/,
+        `el validador fallo pero no nombro ningun agente al romper ${fichero}:\n${rota.salida}`
+      );
+      assert.ok(
+        rota.salida.includes(fichero),
+        `la salida no menciona "${fichero}", que es el que se rompio:\n${rota.salida}`
+      );
+
+      // Y la copia restaurada vuelve a validar: si no, el fallo siguiente
+      // vendria arrastrado y no de su propia mutacion.
+      const restaurada = validar(tmp);
+      assert.equal(
+        restaurada.status,
+        0,
+        `tras restaurar ${fichero} la copia no vuelve a validar:\n${restaurada.salida}`
+      );
+    }
+  }
+);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica-complejidad.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica-complejidad.test.ts
new file mode 100644
index 0000000..90bf3e5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica-complejidad.test.ts
@@ -0,0 +1,298 @@
+/**
+ * Tests de `scripts/heuristica-complejidad.yml` (TASK-032, item D7).
+ *
+ * El fichero no lo lee todavia ningun comando: sus consumidores son
+ * D1/D2, que aun no existen. Eso hace que estos tests sean lo unico
+ * que hay entre el fichero y una regresion silenciosa, asi que no se
+ * limitan a comprobar que existe:
+ *
+ * 1. SE PARSEA CON EL PARSER DE VERDAD. No con una relectura ad hoc
+ *    ni con un YAML de mentira escrito en el test: con
+ *    parseBloqueClaveValor, el mismo bucle `clave: valor` que usan el
+ *    frontmatter de las tareas y `.taskcode/config.yml`. Un fichero
+ *    que este test aprueba es un fichero que el plugin puede leer.
+ * 2. SE COMPARA EL MAPA ENTERO, no clave a clave. Un deepEqual contra
+ *    el objeto esperado falla si alguien cambia un peso, borra una
+ *    clave, anade una que nadie ha discutido, o escribe un numero
+ *    entre comillas (que el parser devolveria como texto).
+ * 3. SE PROHIBE EL ANIDAMIENTO EXPLICITAMENTE. Es el fallo que mas
+ *    caro sale: el parser NO soporta mapas anidados, pero tampoco los
+ *    rechaza — se los traga aplanando la clave hija y perdiendo la
+ *    madre. Un fichero anidado seguiria "parseando" y diria otra cosa
+ *    de la que pone. Por eso se asevera sobre las lineas crudas: cero
+ *    sangria, y ningun valor vacio.
+ * 4. SE VIGILA QUE SIGA SIENDO GENERICO. El fichero viaja a proyectos
+ *    que no son este; vocabulario de un dominio concreto ahi seria
+ *    ruido en todos los demas.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import { parseBloqueClaveValor } from '../../src/core/frontmatter.js';
+
+/**
+ * dist/test/core/ -> raiz del paquete. Se resuelve desde el modulo, no
+ * desde process.cwd(), para que los tests pasen igual lanzados desde
+ * la raiz del repo que desde dentro del plugin.
+ */
+const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+const RUTA_YML = path.join(RAIZ_PAQUETE, 'scripts', 'heuristica-complejidad.yml');
+
+const CONTENIDO = readFileSync(RUTA_YML, 'utf8');
+const LINEAS = CONTENIDO.split(/\r?\n/);
+
+/** El mismo parseo que hara el plugin: nada de un YAML paralelo. */
+function parsear(): ReturnType<typeof parseBloqueClaveValor> {
+  return parseBloqueClaveValor(LINEAS, 0, {
+    etiqueta: 'heuristica de complejidad',
+    crearError: (mensaje) => new Error(`[${RUTA_YML}] ${mensaje}`),
+    permitirComentariosDeLinea: true,
+  });
+}
+
+/**
+ * El fichero entero, tal y como el plugin lo va a ver. Cambiar
+ * cualquier valor, borrar cualquier clave o anadir una nueva rompe
+ * este test, que es exactamente para lo que esta.
+ */
+const ESPERADO: Record<string, unknown> = {
+  // Los seis pesos de la seccion 16.1, tal cual.
+  peso_etiqueta_adicional: 1,
+  peso_palabra_alto_riesgo: 2,
+  peso_dependencia: 1,
+  peso_tipo_release: 1,
+  peso_tipo_hotfix_con_palabra_riesgo: 2,
+  peso_criterios_aceptacion: 1,
+  umbral_criterios_aceptacion: 5,
+  // Mapeo puntuacion -> nivel: 0-1 trivial, 2-3 simple, 4-5 media,
+  // 6-7 compleja, 8+ critica.
+  nivel_trivial_hasta: 1,
+  nivel_simple_hasta: 3,
+  nivel_media_hasta: 5,
+  nivel_compleja_hasta: 7,
+  nivel_critica_desde: 8,
+  palabras_alto_riesgo: [
+    'migracion',
+    'breaking change',
+    'seguridad',
+    'autenticacion',
+    'autorizacion',
+    'esquema de base de datos',
+    'rollback',
+    'cifrado',
+    'datos personales',
+    'concurrencia',
+    'rendimiento',
+    'compatibilidad hacia atras',
+    'integracion externa',
+    'irreversible',
+  ],
+  // Extremos dados por la decision #2; los dos intermedios los fija el
+  // propio fichero (serie monotona sin saltos).
+  agentes_brainstorm_trivial: 0,
+  agentes_brainstorm_simple: 1,
+  agentes_brainstorm_media: 2,
+  agentes_brainstorm_compleja: 3,
+  agentes_brainstorm_critica: 4,
+  // Tolerancia y asimetria.
+  tolerancia_niveles: 1,
+  direccion_de_riesgo: 'heuristica_mayor',
+  tolerancia_extra_si_heuristica_menor: 0,
+  modelo_consulta_discrepancia: 'haiku',
+};
+
+test('el fichero se parsea entero con el parser del plugin y dice exactamente lo esperado', () => {
+  const { data } = parsear();
+  assert.deepEqual(data, ESPERADO);
+});
+
+test('no hay claves repetidas: con dos, el fichero dice una cosa y el plugin usa otra', () => {
+  const { pares } = parsear();
+  const vistas = new Set<string>();
+  for (const par of pares) {
+    assert.equal(
+      vistas.has(par.clave),
+      false,
+      `la clave "${par.clave}" esta repetida (linea ${par.numeroLinea})`
+    );
+    vistas.add(par.clave);
+  }
+  assert.equal(pares.length, Object.keys(ESPERADO).length);
+});
+
+test('el fichero es PLANO: ni sangria, ni listas en bloque, ni claves sin valor', () => {
+  const contenido = LINEAS.map((linea, i) => ({ linea, numero: i + 1 })).filter(
+    ({ linea }) => linea.trim() !== '' && !linea.trim().startsWith('#')
+  );
+  assert.equal(contenido.length > 0, true, 'el fichero no tiene ni una linea de datos');
+
+  for (const { linea, numero } of contenido) {
+    // Sangria = anidamiento. El parser lo aplanaria en silencio: la
+    // clave hija sobreviviria con su nombre recortado y la madre se
+    // perderia entera, asi que hay que rechazarlo aqui.
+    assert.equal(
+      linea,
+      linea.trimStart(),
+      `linea ${numero} sangrada: "${linea}". El parser no soporta anidamiento.`
+    );
+    assert.equal(
+      linea.trimStart().startsWith('- '),
+      false,
+      `linea ${numero} usa lista en bloque: "${linea}". Solo se admiten listas en linea [a, b].`
+    );
+    assert.equal(linea.includes(':'), true, `linea ${numero} sin ":": "${linea}"`);
+  }
+
+  // Una clave sin valor ("pesos:") es la firma de un mapa anidado.
+  for (const par of parsear().pares) {
+    assert.notEqual(par.valor, null, `la clave "${par.clave}" no tiene valor (linea ${par.numeroLinea})`);
+  }
+});
+
+test('todos los pesos y umbrales son enteros, no textos entrecomillados', () => {
+  const { data } = parsear();
+  for (const clave of Object.keys(ESPERADO)) {
+    if (clave === 'palabras_alto_riesgo') continue;
+    if (clave === 'direccion_de_riesgo' || clave === 'modelo_consulta_discrepancia') {
+      assert.equal(typeof data[clave], 'string', `"${clave}" deberia ser texto`);
+      continue;
+    }
+    const valor = data[clave];
+    assert.equal(typeof valor, 'number', `"${clave}" deberia ser un numero, y es ${typeof valor}`);
+    assert.equal(Number.isInteger(valor), true, `"${clave}" deberia ser entero`);
+    assert.equal((valor as number) >= 0, true, `"${clave}" no puede ser negativo`);
+  }
+});
+
+test('el mapeo a niveles es una escala coherente y sin huecos', () => {
+  const { data } = parsear();
+  const trivial = data['nivel_trivial_hasta'] as number;
+  const simple = data['nivel_simple_hasta'] as number;
+  const media = data['nivel_media_hasta'] as number;
+  const compleja = data['nivel_compleja_hasta'] as number;
+  const critica = data['nivel_critica_desde'] as number;
+
+  // Estrictamente creciente: si dos cortes se cruzan o se igualan, un
+  // nivel entero deja de ser alcanzable.
+  assert.equal(trivial < simple, true, 'trivial debe cortar antes que simple');
+  assert.equal(simple < media, true, 'simple debe cortar antes que media');
+  assert.equal(media < compleja, true, 'media debe cortar antes que compleja');
+  // Sin hueco entre el ultimo nivel cerrado y el abierto: una
+  // puntuacion de compleja+1 tiene que caer en critica y en nada mas.
+  assert.equal(critica, compleja + 1, 'entre compleja y critica no puede quedar ninguna puntuacion huerfana');
+  // La escala de la 16.1, literal.
+  assert.deepEqual([trivial, simple, media, compleja, critica], [1, 3, 5, 7, 8]);
+});
+
+test('la tabla de agentes de brainstorm es monotona y respeta los extremos de la decision #2', () => {
+  const { data } = parsear();
+  const serie = [
+    data['agentes_brainstorm_trivial'],
+    data['agentes_brainstorm_simple'],
+    data['agentes_brainstorm_media'],
+    data['agentes_brainstorm_compleja'],
+    data['agentes_brainstorm_critica'],
+  ] as number[];
+
+  // Extremos dados: 0 en trivial, 3 en compleja, 4 en critica.
+  assert.equal(serie[0], 0, 'trivial no paga brainstorm');
+  assert.equal(serie[3], 3, 'compleja son 3 agentes');
+  assert.equal(serie[4], 4, 'critica son 4 agentes (los cuatro roles)');
+  // Los intermedios los fija el fichero, pero la serie no puede bajar.
+  for (let i = 1; i < serie.length; i++) {
+    assert.equal(
+      (serie[i] as number) >= (serie[i - 1] as number),
+      true,
+      `mas complejidad nunca puede significar menos agentes: ${serie.join(', ')}`
+    );
+  }
+  // Ningun nivel puede pedir mas agentes que roles hay definidos.
+  for (const n of serie) assert.equal(n <= 4, true, `no hay mas de 4 roles: ${serie.join(', ')}`);
+});
+
+test('la tolerancia acepta la coincidencia y un nivel de distancia, y la asimetria queda declarada', () => {
+  const { data } = parsear();
+  assert.equal(data['tolerancia_niveles'], 1, 'se acepta hasta un nivel de distancia sin gastar modelo');
+  // La direccion que importa es que la heuristica sugiera MAS
+  // complejidad que la declarada: infraestimar es lo caro.
+  assert.equal(data['direccion_de_riesgo'], 'heuristica_mayor');
+  // La holgura extra solo aplica cuando la heuristica queda por
+  // debajo, y hoy arranca en 0: el comportamiento por defecto es
+  // simetrico, y abrirlo tiene que ser una decision consciente.
+  assert.equal(data['tolerancia_extra_si_heuristica_menor'], 0);
+  assert.equal(typeof data['modelo_consulta_discrepancia'], 'string');
+  assert.notEqual((data['modelo_consulta_discrepancia'] as string).trim(), '');
+});
+
+test('las palabras de alto riesgo son genericas, sin vocabulario de ningun proyecto', () => {
+  const { data } = parsear();
+  const palabras = data['palabras_alto_riesgo'];
+  assert.equal(Array.isArray(palabras), true, 'palabras_alto_riesgo debe ser una lista en linea');
+  const lista = palabras as unknown[];
+  assert.equal(lista.length > 0, true, 'la lista no puede quedarse vacia');
+
+  for (const p of lista) {
+    assert.equal(typeof p, 'string', `cada palabra debe ser texto, y hay un ${typeof p}`);
+    const s = p as string;
+    assert.equal(s, s.trim(), `"${s}" tiene espacios sobrantes`);
+    assert.notEqual(s, '', 'hay una entrada vacia');
+    // Forma canonica: minusculas y sin tildes, porque la comparacion
+    // contra el texto de la tarea es insensible a ambas cosas.
+    assert.equal(s, s.toLowerCase(), `"${s}" deberia ir en minusculas`);
+    assert.match(s, /^[a-z ]+$/, `"${s}" deberia ser ASCII en minusculas, sin tildes ni signos`);
+  }
+  assert.equal(new Set(lista).size, lista.length, 'hay palabras repetidas en la lista');
+
+  // Las seis que nombra la 16.1 tienen que seguir estando.
+  for (const obligatoria of [
+    'migracion',
+    'breaking change',
+    'seguridad',
+    'autenticacion',
+    'esquema de base de datos',
+    'rollback',
+  ]) {
+    assert.equal(lista.includes(obligatoria), true, `falta la palabra "${obligatoria}"`);
+  }
+});
+
+test('el fichero no menciona ningun proyecto, ruta o jerga concreta: se distribuye a otros repos', () => {
+  // Sobre el fichero ENTERO, comentarios incluidos: un comentario que
+  // nombre el repo de origen envejece igual de mal que un valor.
+  const prohibidos = [
+    'taskcode',
+    'taskctl',
+    'ifc',
+    'postgis',
+    'catastr',
+    'autocad',
+    'revit',
+    'bim',
+    'geometria',
+    'gitflow',
+  ];
+  const minusculas = CONTENIDO.toLowerCase();
+  for (const termino of prohibidos) {
+    const encontrado = new RegExp(`\\b${termino}`, 'i').test(minusculas);
+    assert.equal(
+      encontrado,
+      false,
+      `el fichero menciona "${termino}": es vocabulario de un proyecto concreto, no un default generico`
+    );
+  }
+});
+
+test('el fichero es ASCII: comentarios en espanol pero sin tildes', () => {
+  const lineasConAcentos = LINEAS.map((linea, i) => ({ linea, numero: i + 1 })).filter(
+    ({ linea }) => /[^\t\x20-\x7E]/.test(linea)
+  );
+  assert.deepEqual(
+    lineasConAcentos.map(({ numero }) => numero),
+    [],
+    `hay caracteres no ASCII en las lineas: ${lineasConAcentos
+      .map(({ numero, linea }) => `${numero}: ${linea}`)
+      .join(' | ')}`
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
new file mode 100644
index 0000000..14f98b4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
@@ -0,0 +1,397 @@
+/**
+ * Tests de las cuatro skills revisoras del plugin (item D6): java-spring,
+ * angular-vue, csharp-autocad-ifc y code-quality.
+ *
+ * El fichero hermano `task-workflow.test.ts` ya cubre a fondo la forma de
+ * UNA skill (bytes, BOM, claves del spec, limites de longitud). Aqui no se
+ * repite eso: lo que se asevera es lo que solo tiene sentido cuando hay
+ * CUATRO revisores y alguien va a enrutarlos por dominio.
+ *
+ * Tres bloques, con motivos distintos:
+ *
+ * 1. ESTRUCTURALES. Que las cuatro existan y su frontmatter parsee con el
+ *    parser del repo. Medido durante la integracion de TASK-032: el
+ *    validador oficial NO comprueba que existan `name` ni `description`
+ *    —solo que el bloque parsee—, asi que apoyarse en el para eso daria
+ *    verde sobre una skill sin nombre. Se asevera aqui.
+ *
+ * 2. CONTRATO DE ENRUTADO. Cada skill declara sus `patrones_archivo` en un
+ *    bloque yaml, y quien enrute por diff real (D3) los va a leer con el
+ *    UNICO parser que hay en el repo. Ese parser lee listas en linea
+ *    (`[a, b]`) y **falla en seco** ante una lista en bloque (`- item`):
+ *    medido, con el error literal `Linea de undefined invalida (falta ":")`.
+ *    Las cuatro llegaron a la integracion con dos formatos distintos; el
+ *    test existe para que no vuelva a pasar sin que nadie se entere.
+ *
+ * 3. EL VEREDICTO, CONTRA EL CODIGO QUE LO LEE. La linea que cada skill
+ *    prescribe se pasa por `veredictoAprobado` de finish.ts — la funcion
+ *    real, no una copia de su regex. Una skill que prescriba una linea que
+ *    el comando de cierre no acepta deja la tarea imposible de cerrar, y
+ *    ese fallo solo se veria al final del ciclo, cuando ya no hay margen.
+ *
+ * 4. INTEGRACION. El validador real, con CONTRAPRUEBA: sobre una copia
+ *    temporal se rompe el frontmatter de las cuatro y se comprueba que las
+ *    nombra. Un "passed" silencioso es ambiguo entre "las miro y estan
+ *    bien" y "nunca miro ahi"; romperlas desambigua. Se rompen las cuatro
+ *    en una sola pasada a proposito: cada arranque del validador cuesta
+ *    ~10s y cuatro pasadas no demuestran mas que una.
+ *
+ * Cero dependencias: se reutilizan `parseFrontmatter`,
+ * `parseBloqueClaveValor` y `veredictoAprobado` del propio codigo.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { spawnSync } from 'node:child_process';
+import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseBloqueClaveValor, parseFrontmatter } from '../../src/core/frontmatter.js';
+import { veredictoAprobado } from '../../src/commands/finish.js';
+
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
+const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
+
+/** El generico va aparte: no tiene patrones, los suple. */
+const REVISORES_DE_DOMINIO = [
+  'java-spring-reviewer',
+  'angular-vue-reviewer',
+  'csharp-autocad-ifc-reviewer',
+] as const;
+
+const REVISOR_GENERICO = 'code-quality-reviewer';
+
+const REVISORES = [...REVISORES_DE_DOMINIO, REVISOR_GENERICO] as const;
+
+/**
+ * Marcas de ESTE repo. Las cuatro skills se instalan en proyectos que no
+ * son este: una ruta o un nombre de documento interno que se cuele no es
+ * una errata, es una instruccion que el agente de otro equipo no puede
+ * seguir. Se busca en el fichero ENTERO, frontmatter incluido.
+ */
+const MARCAS_DEL_REPO = [
+  'taskcode',
+  'tareas/',
+  'docs/contexto',
+  'propuesta_metodologia',
+  'checklist_terminacion',
+  'plan-final.md',
+  'task-0',
+  'ieca',
+  'movetareafile',
+  'printclierror',
+];
+
+/** Rutas de maquina, mismo criterio que en task-workflow.test.ts. */
+const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];
+
+function rutaSkill(nombre: string): string {
+  return path.join(SKILLS_DIR, nombre, 'SKILL.md');
+}
+
+async function leer(nombre: string): Promise<string> {
+  return readFile(rutaSkill(nombre), 'utf8');
+}
+
+/**
+ * Extrae el primer bloque ```yaml del cuerpo y lo parsea con el parser del
+ * repo. Devuelve tambien las lineas crudas: el parser aplana lo que puede,
+ * asi que aseverar solo sobre su salida dejaria pasar formas que Claude
+ * Code interpretaria de otra manera.
+ */
+function bloqueYaml(texto: string): { data: Record<string, unknown>; lineas: string[] } {
+  const lineas = texto.split('\n');
+  const ini = lineas.findIndex((l) => l.trim() === '```yaml');
+  assert.notEqual(ini, -1, 'no hay ningun bloque ```yaml en la skill');
+  const fin = lineas.findIndex((l, i) => i > ini && l.trim() === '```');
+  assert.notEqual(fin, -1, 'el bloque ```yaml no se cierra');
+  const cuerpo = lineas.slice(ini + 1, fin);
+  const { data } = parseBloqueClaveValor(cuerpo, 0, {
+    etiqueta: 'skill',
+    permitirComentariosDeLinea: true,
+    crearError: (msg: string) => new Error(msg),
+  });
+  return { data, lineas: cuerpo };
+}
+
+// Guard de no-vacuidad: si PLUGIN_ROOT apuntase a otro sitio, media docena
+// de tests de abajo pasarian sin comprobar nada real.
+test('el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)', async () => {
+  const pkg = JSON.parse(await readFile(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')) as {
+    name?: unknown;
+  };
+  assert.equal(pkg.name, 'taskcode-plugin', `PLUGIN_ROOT resuelto a "${PLUGIN_ROOT}"`);
+});
+
+// --- 1. Estructurales ---------------------------------------------------
+
+test('1. las cuatro skills revisoras existen con su nombre exacto', async () => {
+  // En Windows el filesystem es case-insensitive, asi que un stat() no
+  // demuestra el case: se comprueba contra el listado del directorio.
+  const enSkills = await readdir(SKILLS_DIR);
+  for (const nombre of REVISORES) {
+    assert.ok(enSkills.includes(nombre), `falta el directorio skills/${nombre}/`);
+    const dentro = await readdir(path.join(SKILLS_DIR, nombre));
+    assert.ok(dentro.includes('SKILL.md'), `skills/${nombre}/ no tiene SKILL.md con ese case`);
+  }
+});
+
+test('2. el frontmatter parsea y declara name y description (el validador NO comprueba esto)', async () => {
+  for (const nombre of REVISORES) {
+    const { data } = parseFrontmatter(await leer(nombre));
+
+    assert.equal(
+      data['name'],
+      nombre,
+      `el name de ${nombre} no coincide con su directorio: ${String(data['name'])}`
+    );
+
+    const description = data['description'];
+    assert.equal(typeof description, 'string', `${nombre}: description ausente o no es texto`);
+    assert.ok((description as string).length > 40, `${nombre}: description demasiado corta`);
+    assert.ok(
+      !(description as string).includes('<') && !(description as string).includes('>'),
+      `${nombre}: la description no admite < ni >`
+    );
+  }
+});
+
+test('3. el frontmatter solo lleva las claves del spec portable', async () => {
+  const permitidas = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
+  for (const nombre of REVISORES) {
+    const { data } = parseFrontmatter(await leer(nombre));
+    for (const clave of Object.keys(data)) {
+      assert.ok(permitidas.has(clave), `${nombre}: clave "${clave}" fuera del spec portable`);
+    }
+  }
+});
+
+// --- 2. Contrato de enrutado -------------------------------------------
+
+test('4. patrones_archivo es legible por el UNICO parser que hay en el repo', async () => {
+  for (const nombre of REVISORES) {
+    // Si alguien vuelve a la lista en bloque, esto lanza aqui — que es
+    // exactamente lo que le pasaria a quien enrute por diff real.
+    const { data, lineas } = bloqueYaml(await leer(nombre));
+
+    assert.equal(data['rol'], 'revisor', `${nombre}: el bloque no declara rol: revisor`);
+    assert.ok(
+      Array.isArray(data['patrones_archivo']),
+      `${nombre}: patrones_archivo no es una lista tras parsear`
+    );
+
+    // El parser lee listas en linea. Una lista en bloque ("- item") no es
+    // solo otro estilo: revienta el parseo.
+    for (const linea of lineas) {
+      assert.ok(
+        !/^\s*-\s/.test(linea),
+        `${nombre}: lista en bloque en el yaml ("${linea.trim()}"); usa [a, b] en una linea`
+      );
+    }
+  }
+});
+
+test('5. los revisores de dominio traen patrones; el generico declara que no los tiene', async () => {
+  for (const nombre of REVISORES_DE_DOMINIO) {
+    const { data } = bloqueYaml(await leer(nombre));
+    const patrones = data['patrones_archivo'] as string[];
+    assert.ok(patrones.length > 0, `${nombre}: sin patrones no se le puede enrutar nada`);
+    for (const patron of patrones) {
+      assert.ok(
+        patron.includes('*') || patron.includes('/'),
+        `${nombre}: "${patron}" no parece un patron de fichero`
+      );
+    }
+  }
+
+  const { data } = bloqueYaml(await leer(REVISOR_GENERICO));
+  const patrones = data['patrones_archivo'] as string[];
+  assert.equal(patrones.length, 0, 'el revisor generico no debe competir por patron');
+  assert.equal(data['fallback'], true, 'el revisor generico debe declararse como fallback');
+  assert.equal(
+    data['umbral_dominios'],
+    3,
+    'el umbral de dominios es 3 (decision #16); cambiarlo aqui sin decidirlo es un error'
+  );
+});
+
+test('6. ningun revisor de dominio se solapa con otro en un patron identico', async () => {
+  const vistos = new Map<string, string>();
+  for (const nombre of REVISORES_DE_DOMINIO) {
+    const { data } = bloqueYaml(await leer(nombre));
+    for (const patron of data['patrones_archivo'] as string[]) {
+      const duenyo = vistos.get(patron);
+      assert.equal(
+        duenyo,
+        undefined,
+        `el patron "${patron}" lo declaran ${String(duenyo)} y ${nombre}: el enrutado seria ambiguo`
+      );
+      vistos.set(patron, nombre);
+    }
+  }
+});
+
+// --- 3. El veredicto, contra el codigo que lo lee -----------------------
+
+test('7. la linea de veredicto que cada skill prescribe la ACEPTA finish.ts', async () => {
+  for (const nombre of REVISORES) {
+    const texto = await leer(nombre);
+
+    // Se buscan las lineas de ejemplo que la skill da como aprobatorias.
+    const aprobatorias = texto
+      .split('\n')
+      .map((l) => l.trim())
+      .filter((l) => /^-\s*veredicto:\s*aprobada/i.test(l));
+
+    assert.ok(
+      aprobatorias.length > 0,
+      `${nombre}: no prescribe ninguna linea "- Veredicto: aprobada..."`
+    );
+
+    for (const linea of aprobatorias) {
+      assert.ok(
+        veredictoAprobado(linea),
+        `${nombre}: prescribe "${linea}", que finish.ts NO acepta — la tarea no se podria cerrar`
+      );
+    }
+  }
+});
+
+test('8. cada skill prescribe tambien la forma de NO aprobar, y finish.ts la rechaza', async () => {
+  for (const nombre of REVISORES) {
+    const texto = await leer(nombre);
+    assert.ok(
+      texto.includes('cambios-solicitados'),
+      `${nombre}: no dice como pedir cambios; sin eso solo sabe aprobar`
+    );
+    assert.equal(
+      veredictoAprobado('- Veredicto: cambios-solicitados'),
+      false,
+      'regresion en finish.ts: la forma de pedir cambios estaria aprobando'
+    );
+  }
+});
+
+test('9. las tres severidades estan definidas en las cuatro', async () => {
+  for (const nombre of REVISORES) {
+    const texto = (await leer(nombre)).toUpperCase();
+    for (const severidad of ['CRITICO', 'IMPORTANTE', 'MENOR']) {
+      assert.ok(texto.includes(severidad), `${nombre}: no define la severidad ${severidad}`);
+    }
+  }
+});
+
+test('10. las cuatro exigen reproducir empiricamente, no leer el diff y opinar', async () => {
+  for (const nombre of REVISORES) {
+    const texto = (await leer(nombre)).toLowerCase();
+    assert.ok(
+      texto.includes('reproduc'),
+      `${nombre}: no exige reproducir; una revision que solo lee el diff no es una revision`
+    );
+  }
+});
+
+// --- 4. Portabilidad ----------------------------------------------------
+
+test('11. ninguna skill arrastra marcas de este repo ni rutas de maquina', async () => {
+  for (const nombre of REVISORES) {
+    const texto = await leer(nombre);
+    const enMinusculas = texto.toLowerCase();
+
+    for (const marca of MARCAS_DEL_REPO) {
+      assert.ok(
+        !enMinusculas.includes(marca),
+        `${nombre}: contiene la marca "${marca}", que no significa nada en otro proyecto`
+      );
+    }
+
+    for (const ruta of RUTAS_DE_MAQUINA) {
+      assert.ok(!texto.includes(ruta), `${nombre}: contiene la ruta de maquina "${ruta}"`);
+    }
+  }
+});
+
+// --- 5. Integracion con el validador real ------------------------------
+
+interface ResultadoValidate {
+  status: number | null;
+  salida: string;
+}
+
+function claudeDisponible(): boolean {
+  try {
+    return spawnSync('claude', ['--version'], { encoding: 'utf8' }).status === 0;
+  } catch {
+    return false;
+  }
+}
+
+function validar(ruta: string): ResultadoValidate {
+  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
+    encoding: 'utf8',
+    stdio: ['ignore', 'pipe', 'pipe'],
+  });
+  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
+}
+
+// Skip explicito: en el CI de Linux `claude` no esta instalado. Los tests
+// estructurales de arriba son la red que si corre siempre.
+const SKIP_INTEGRACION: string | false = claudeDisponible()
+  ? false
+  : 'claude no esta en el PATH: la integracion se salta (los estructurales cubren la forma)';
+
+test(
+  '12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro',
+  { skip: SKIP_INTEGRACION },
+  async () => {
+    const tmp = await mkdtemp(path.join(tmpdir(), 'revisores-'));
+    try {
+      const copia = path.join(tmp, 'plugin');
+      await cp(path.join(PLUGIN_ROOT, '.claude-plugin'), path.join(copia, '.claude-plugin'), {
+        recursive: true,
+      });
+      for (const nombre of REVISORES) {
+        await cp(path.join(SKILLS_DIR, nombre), path.join(copia, 'skills', nombre), {
+          recursive: true,
+        });
+      }
+
+      // Control: la copia intacta valida.
+      const sano = validar(copia);
+      assert.equal(sano.status, 0, `la copia intacta no valida:\n${sano.salida}`);
+
+      // Se rompe el YAML (comilla sin cerrar). Medido en TASK-032: un
+      // frontmatter que no PARSEA da error; uno ausente solo da warning
+      // con exit 0. Por eso se asevera sobre el NOMBRE del fichero en la
+      // salida, no sobre el codigo de salida.
+      for (const nombre of REVISORES) {
+        const destino = path.join(copia, 'skills', nombre, 'SKILL.md');
+        const original = await readFile(destino, 'utf8');
+        const roto = original.replace(/^description: /m, 'description: "sin cerrar\n');
+        assert.notEqual(roto, original, `${nombre}: no se pudo romper la description`);
+        await writeFile(destino, roto, 'utf8');
+      }
+
+      const { salida } = validar(copia);
+      for (const nombre of REVISORES) {
+        assert.ok(
+          salida.includes(nombre),
+          `el validador no nombra a ${nombre} con el frontmatter roto: no mira esa ruta\n${salida}`
+        );
+      }
+    } finally {
+      await rm(tmp, { recursive: true, force: true });
+    }
+  }
+);
+
+test(
+  '13. el plugin entero, con las cuatro skills dentro, sigue validando',
+  { skip: SKIP_INTEGRACION },
+  () => {
+    const { status, salida } = validar(PLUGIN_ROOT);
+    assert.equal(status, 0, `el plugin no valida:\n${salida}`);
+    assert.ok(!salida.includes('✘'), `el validador reporta errores:\n${salida}`);
+  }
+);
````
