# Peticion de revision — TASK-137 (ronda 1)

- Tarea: TASK-137 — Regla 4D: sin duplicacion, desviacion, diluvio ni disfraz de codigo
- Rama revisada: feature/task-137-regla-4d-sin-duplicacion-desviacion-dilu
- Rama base: develop
- Commit revisado (HEAD): a6b1aafb788eabf63bd9bde05c040039710210cd
- Fecha: 2026-11-22
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-137 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-137/tarea.md
- tareas/03-en-revision/TASK-137/planificacion/
- docs/auditoria-4d.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-regla-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts

## Commits a revisar (git log develop..HEAD)

````
a6b1aaf update(feature): develop -> feature/task-137-regla-4d-sin-duplicacion-desviacion-dilu
731a30f docs(TASK-137): autorrevision y criterios marcados
a2c490d feat(TASK-137): regla 4D en revision, informe, finish y start, mas auditoria
f9487df chore(TASK-137): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/auditoria-4d.md b/docs/auditoria-4d.md
new file mode 100644
index 0000000..277f8be
--- /dev/null
+++ b/docs/auditoria-4d.md
@@ -0,0 +1,68 @@
+# Auditoría 4D — las 10 últimas tareas terminadas (TASK-127 a TASK-136)
+
+> TASK-137, 2026-11-22. Regla 4D: sin **duplicación**, **desviación**,
+> **diluvio** ni **disfraz** (definición en
+> `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md`).
+> Solo lectura: la auditoría no corrige nada (hacerlo aquí sería desviación);
+> cada caso tiene su tarea de seguimiento.
+
+## Método
+
+Tres agentes en paralelo, cada uno con un tramo (127–130, 131–133, 134–136),
+leyeron el diff de cada tarea (merge a `develop` o, sin merge, de «tarea
+creada» a «tarea terminada»), su `tarea.md` y el código actual. El
+coordinador volvió a comprobar en el código cada caso de confianza alta
+antes de listarlo (rutas y líneas de `develop` a 2026-11-22). Los casos de
+disfraz salen de razonar la mutación sobre el test, no de ejecutar mutantes;
+los de confianza media se marcan como tales.
+
+Rutas relativas a `taskcode-marketplace/plugins/taskcode-plugin/` salvo las
+que empiezan por `scripts/` o `tareas/` (raíz del repo).
+
+## Casos
+
+| ID | Tarea | D | Fichero:línea | Evidencia | Severidad | Confianza | Seguimiento |
+|---|---|---|---|---|---|---|---|
+| A1 | 129 | Duplicación | `src/commands/metricas.ts:513-518` y `src/core/crecimiento-suite.ts:78-98` | Dos agregadores de la suite por versión con reglas distintas: `metricas` guarda la última línea `suite` verde por tarea; `suitePorVersion` (doctor) usa todas. Con una tarea que corre la completa dos veces, `metricas --por-version` y el aviso de crecimiento dan cifras distintas para la misma versión. Comprobado. | IMPORTANTE | alta | TASK-138 |
+| A2 | 129 | Duplicación | `src/core/versiones-metricas.ts:104-114` y `src/core/crecimiento-suite.ts:71-76` | La mediana y el máximo de tests escritos dos veces (cierre inline y `mediana()`). Comprobado. | MENOR | alta | TASK-138 |
+| A3 | 129 | Duplicación | `src/core/crecimiento-suite.ts:52` y `:58` | La misma regex de pytest se declara y ejecuta dos veces (`pytestFinal` y `pytest`) sobre el mismo texto. Comprobado. | MENOR | alta | TASK-138 |
+| A4 | 128 | Duplicación | `src/commands/finish-verificacion.ts:119` (`anotarFinish`), `src/commands/review.ts:1308-1316` y `anotarSuite` | La decisión `omitido`/`verde`/`rojo` con su duración e instante, escrita en tres sitios. | MENOR | alta | TASK-138 |
+| A5 | 128 | Disfraz | `src/core/registro-puertas.ts:106` y `test/core/metricas-puertas.test.ts:42` | `PUERTAS_VERIFICACION` no se usa en `src/`; su único test comprueba que la constante vale lo que se le asignó. Aparenta un contrato que nadie consume. Comprobado. | MENOR | alta | TASK-138 |
+| A6 | 127/129/130 | Duplicación | `src/core/flujo.ts:~284-305`, `salidasTopeRondas`, `src/commands/review.ts:~739-758`; `src/commands/doctor.ts:500`, `:599`, `:646` | El texto de las tres salidas del tope de rondas, en tres redacciones; y tres lecturas casi iguales de las terminadas en `doctor`. | MENOR | media | TASK-138 |
+| B1 | 133 | Disfraz | `skills/task-workflow/SKILL.md:201` | El criterio 2 pedía enlazar `poda-tests.md` desde la skill; ningún test lo comprueba (`test/core/poda-tests.test.ts:83` mira el enlace desde `tests-pesados.md`). Quitarlo no pone rojo nada. Comprobado. | MENOR | alta | TASK-139 |
+| B2 | 133 | Disfraz | `tareas/04-terminadas/TASK-133/tarea.md:30-33` | Tarea terminada con sus cuatro criterios sin marcar; el `Resultado` explica que 3 y 4 pasaron a TASK-134, pero 1 y 2 se cumplen y no constan. Comprobado. | MENOR | alta | TASK-139 |
+| B3 | 136 | Disfraz | `scripts/verificar-impacto.mjs:508-516` | La rama del cerrojo ilegible (`pid === null`, espera y reintento) no tiene test: el de cerrojo muerto escribe JSON válido. | MENOR | media | TASK-139 |
+| B4 | 134 | Disfraz | `test/commands/doctor.test.ts:771-790` | Las aserciones del mensaje «bash de Git» solo corren en Windows; en el CI de Linux no comprueban nada (la resolución sí está cubierta por los tests puros). | MENOR | alta | TASK-139 |
+| B5 | 135 | Duplicación | `test/commands/review-tests-stat.test.ts:254` y `:274` | Dos tests cubren la misma regresión ENAMETOOLONG; el segundo monta un repo de 1100 ficheros. | MENOR | media | TASK-139 |
+| C1 | 136 | Diluvio | `scripts/verificar-impacto.mjs:546-577` (`retirarCerrojoMuerto`, `.robo`) | Segundo cerrojo con caducidad de 10 s y un test de ~9 s para una carrera casi imposible; bastaba borrar el cerrojo muerto y reintentar el `wx` (~8 líneas frente a ~45). Comprobado que existe; la proporción es juicio. | MENOR | media | TASK-140 |
+| C2 | 130 | Disfraz (dudoso) | merge `92e93c7`, 28 ficheros de `test/` | La poda cumple el «≥10 %» por número de tests (819→624 rápida) fusionando tests con varios `caso()`, sin quitar aserciones ni medir duración; un test fusionado oculta los casos siguientes al primer fallo. | IMPORTANTE | media | TASK-140 |
+
+Observaciones que **no** son caso: la «segunda barrera» de
+`scripts/verificar-impacto.mjs:591-600` la pide el criterio 3 de TASK-136;
+`lotesDeRutas` (`src/fs/git.ts:701`) cuenta caracteres y no bytes, lo
+correcto para el límite de Windows aunque el criterio dijera bytes; la
+duplicación de la ruta a `git.exe` en los tests de TASK-134 es coherente hoy.
+
+## Por tarea
+
+| Tarea | Casos | Nota |
+|---|---|---|
+| TASK-127 | A6 | Código mínimo; solo textos repetidos. |
+| TASK-128 | A4, A5 | Sin desviación. |
+| TASK-129 | A1, A2, A3, A6 | El caso más claro de la auditoría (A1). |
+| TASK-130 | A6, C2 | La poda reduce el contador más que la redundancia. |
+| TASK-131 | — | Tres tests actualizados, fieles al objetivo. |
+| TASK-132 | — | Elimina duplicación de verdad (`test/helpers/caso.ts`). |
+| TASK-133 | B1, B2 | |
+| TASK-134 | B4 | `lanzarBash` sigue siendo el único sitio que lanza bash. |
+| TASK-135 | B5 | `lotesDeRutas` unifica dos copias: reduce duplicación. |
+| TASK-136 | B3, C1 | Los tests de solape y pid muerto discriminan. |
+
+## Conclusión
+
+La sospecha se confirma a medias: hay 4D en la 0.16, pero poco y casi todo
+MENOR. Lo que más se repite es la **duplicación de una decisión** al añadir
+una métrica (A1–A4: cada tarea de métricas escribió su propio agregador) y el
+**disfraz por falta de test** de lo que el criterio pedía (B1, B3, B4). Son
+justo lo que la Regla 4D pone ahora delante del implementador (buscar el
+helper, mutar cada test) y del revisor (sección `## Regla 4D` del informe).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index e7f6f76..436ba42 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -280,6 +280,17 @@ cambio. Que espere al ciclo de renderizado antes de aseverar, en vez de
 depender de que llegue a tiempo. Y que exista al menos un test que falle si
 se revierte el cambio.
 
+### Regla 4D en Angular y Vue
+
+La definicion y la severidad, en "Regla 4D" de revision.md. Aqui:
+
+- Duplicacion: un composable `useFetchUsuarios` copiado de `useFetchPedidos`
+  cambiando la URL, en vez de un `useFetch(url)`.
+- Desviacion: migrar el componente a `signals` en una tarea de estilos.
+- Diluvio: servicio, store e interfaz para un estado que vive en un `ref`.
+- Disfraz: un test que monta el componente con `shallowMount` y solo
+  comprueba que existe; sigue en verde con la plantilla vacia.
+
 ## Clasificacion de los hallazgos
 
 **CRITICO** — perdida de datos, corrupcion de estado, o la interfaz hace lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
index 95ecbba..958689b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -221,6 +221,18 @@ salida de otro proceso.
 - **Lo que sale**: mensajes de error que filtran rutas internas, consultas
   completas o datos de otro usuario.
 
+### 8. Regla 4D
+
+La definicion y la severidad, en "Regla 4D" de revision.md. En un pase
+generico:
+
+- Duplicacion: una funcion de parseo de argumentos nueva junto a la que ya
+  usa el resto del CLI.
+- Desviacion: renombrar modulos ajenos en una tarea de un mensaje de error.
+- Diluvio: una clase con estrategia y registro para dos casos de un `switch`.
+- Disfraz: un test cuya asercion es `assert.ok(resultado)`, que pasa igual
+  con la funcion rota.
+
 ## Cuando llegas por exceso de dominios
 
 Si estas aqui porque el diff toca mas de tres dominios, el pase es **uno solo
@@ -262,6 +274,7 @@ contrario de lo que dice:
 - Un test cuya expectativa cambio en el diff para acomodar una regresion.
 - Una proteccion nueva sin ningun test que se ponga rojo al quitarla.
 - Un cambio que solo funciona en la plataforma de quien lo escribio.
+- Duplicacion o disfraz reales de la Regla 4D.
 
 **MENOR** — todo lo demas: nombres, comentarios desactualizados, anidamiento,
 duplicacion sin consecuencia demostrable, numeros magicos, orden de las
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index af94605..2986f6b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -227,6 +227,17 @@ Reproducciones baratas que este dominio agradece:
 - **Recursos no liberados cuando salta la excepcion**: sin `using`, un `return`
   temprano o un fallo deja el bloqueo del documento puesto.
 
+### Regla 4D en C#, AutoCAD e IFC
+
+La definicion y la severidad, en "Regla 4D" de revision.md. Aqui:
+
+- Duplicacion: dos metodos que abren la `Transaction` y recorren el
+  `BlockTableRecord` igual, cambiando solo el filtro de entidad.
+- Desviacion: tocar el exportador IFC en una tarea del comando de dibujo.
+- Diluvio: una jerarquia de clases por tipo IFC donde basta un diccionario.
+- Disfraz: un test que solo comprueba que el IFC generado "no es nulo", o un
+  `catch` vacio que hace pasar la importacion fallida por buena.
+
 ## Clasificacion de hallazgos
 
 **CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
index d347090..f702af2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
@@ -152,6 +152,18 @@ el `@Transactional` del propio test no este ocultando que el codigo de
 produccion nunca commitea. Y que exista al menos un test que falle si se
 revierte el cambio.
 
+### Regla 4D en Java y Spring
+
+La definicion y la severidad, en "Regla 4D" de revision.md. Aqui:
+
+- Duplicacion: dos `@Service` con el mismo mapeo DTO a entidad escrito a
+  mano, en vez de un mapper comun.
+- Desviacion: cambiar el esquema JPA en una tarea de validacion.
+- Diluvio: interfaz `XService`, `XServiceImpl` y fabrica para un unico
+  metodo sin segunda implementacion.
+- Disfraz: un test con `@MockBean` del repositorio que verifica que se llamo
+  a `save` y no que se guardo lo correcto.
+
 ## Clasificacion de los hallazgos
 
 **CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
index 585e082..198651f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
@@ -306,6 +306,17 @@ corran de verdad en el objetivo `wasm32` y no solo en nativo. Y que exista al
 menos un test que falle si se revierte el cambio: es lo que mide el paso de
 mutacion.
 
+### Regla 4D en Rust y WebAssembly
+
+La definicion y la severidad, en "Regla 4D" de revision.md. Aqui:
+
+- Duplicacion: `area_f32` y `area_f64` copiadas, en vez de una generica sobre
+  un trait numerico.
+- Desviacion: cambiar la firma `#[wasm_bindgen]` publica en una tarea interna.
+- Diluvio: un trait y tres structs para un calculo que es una funcion.
+- Disfraz: un `#[test]` que llama a la funcion y descarta el resultado, o un
+  `Ok(())` provisional que nunca hace el trabajo.
+
 ## Clasificacion de los hallazgos
 
 **CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index 0aa6879..bc2195c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -26,6 +26,11 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
    este en verde. Despues encadena `/taskcode-plugin:review` (seccion de
    avance). Si no consigues dejar la suite en verde, para y dilo: no se revisa
    codigo roto.
+   Antes de pedir revision, la Regla 4D (`task-workflow/revision.md`):
+   busca el helper existente antes de crear uno, cita el criterio que motiva
+   cada cambio y comprueba por mutacion cada test nuevo (rompe el codigo, ve
+   el rojo). Anotalo en `## Autorrevision` de `tarea.md`:
+   `- 4D — <commit>: helper buscado, criterios citados, N tests mutados`.
 5. El coste de la implementacion se registra solo (`task-workflow/coste.md`):
    un hook anota que sesion y que subagentes trabajan con la tarea en curso, y
    `taskctl review` suma su uso a `tokens_implementacion` en su commit. **No
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index dcd3162..ddc5ae0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -74,6 +74,25 @@ con el motivo. Sin esa nota, el siguiente lector concluye que hay un bug donde
 hay una decision. Un "sin hallazgos" explicito es una respuesta valida;
 inventar hallazgos para tener algo que reportar, no.
 
+## Regla 4D
+
+Cuatro defectos que se buscan en todo diff (cada revisora da un ejemplo de
+cada uno en su dominio):
+
+- **Duplicacion**: dos funciones o clases que hacen lo mismo con pequenas
+  diferencias. Ej.: `formatearFecha` nueva junto a la `fechaCorta` que ya
+  habia. Se reutiliza y se generaliza (parametro, composicion, herencia).
+- **Desviacion**: el diff se sale del objetivo de la tarea. Ej.: un
+  refactor del parser en una tarea de mensajes. Lo ajeno va a otra tarea.
+- **Diluvio**: muchas lineas o clases donde bastan pocas. Ej.: interfaz,
+  fabrica y tres clases para un `if`.
+- **Disfraz**: algo que aparenta resolver y no hace nada o no se comprueba.
+  Ej.: un test que sigue en verde con la funcion rota (compruebalo por
+  mutacion), un stub que devuelve exito, un criterio marcado sin evidencia.
+
+Duplicacion y disfraz reales son **IMPORTANTE** como minimo; desviacion y
+diluvio, MENOR salvo que cambien comportamiento o escondan un fallo.
+
 ## Rondas
 
 Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
@@ -177,6 +196,9 @@ palabras, para poder medir de donde vienen los fallos:
 Si dudas entre dos, la que habria evitado el fallo antes. Una celda vacia o
 con otra palabra cuenta como sin clasificar.
 
+Bajo `## Regla 4D` del esqueleto, una linea por D con `cumple` o el ID de su
+hallazgo (`- Disfraz: IMP-2`). `taskctl finish` avisa si falta o sigue vacia.
+
 ## La linea del veredicto
 
 `finish` decide si la tarea puede cerrarse leyendo el informe de mayor N, y lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 29d65f0..d79cc80 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -56,7 +56,8 @@ import { codigoSinVerificar } from './verificar-menores.js';
 import { SECCION_CODIGO_SIN_REVISAR } from '../core/menores.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { resolverConfig } from '../core/config.js';
-import { INFORME_CODEX_RE, INFORME_REVISION_RE, ultimaRondaAprobada } from '../fs/rondas.js';
+import { INFORME_CODEX_RE, INFORME_REVISION_RE, informesDeUltimaRonda, ultimaRondaAprobada } from '../fs/rondas.js';
+import { avisoRegla4D } from '../core/informe-revision.js';
 import { casillasSinMarcar } from '../core/validacion-tarea.js';
 import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
@@ -407,6 +408,14 @@ async function runFinish(
         'la tarea se cierra igualmente (el veredicto del revisor es la puerta).'
     );
   }
+  // TASK-137: avisar, sin bloquear, si el informe de la ultima ronda no tiene la Regla 4D completa.
+  const revisionDir = path.join(path.dirname(initial.filePath), REVISION_DIRNAME);
+  const { nombres } = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
+  const informes4D = await Promise.all(
+    nombres.map(async (fichero) => ({ fichero, texto: await readFile(path.join(revisionDir, fichero), 'utf8') }))
+  );
+  const aviso4D = avisoRegla4D(informes4D, id);
+  if (aviso4D !== null) deps.onAviso?.(aviso4D);
   // TASK-023: avisar, sin bloquear (misma doctrina que el aviso de arriba),
   // de las fases con LLM sin coste registrado. TASK-063: tambien
   // implementacion, vacia o a 0 (sin ella no se puede comparar el coste
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 88b81cb..d07dac5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -55,6 +55,7 @@ import {
   commitRevisadoDe,
   hallazgosNoCerrados,
   hallazgosPendientes,
+  plantillaRegla4D,
   severidadDe,
   veredictoDeRonda,
   type AlcanceRonda,
@@ -612,6 +613,8 @@ export function informeTemplate(task: Task, commitRevisado: string, ronda: numbe
     'plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el\n' +
     'enunciado o en los criterios de aceptacion de la tarea.\n\n' +
     'Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.\n\n' +
+    // TASK-137: una linea por D, con "cumple" o el ID del hallazgo; finish avisa si falta.
+    `${plantillaRegla4D()}\n` +
     // TASK-081: lo leido fuera de la lista de la peticion, con su motivo.
     '## Lecturas fuera del contexto permitido\n\n' +
     'ninguna\n'
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
index 127e5a1..2044333 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
@@ -39,6 +39,7 @@ export function avisoAutorrevision(body: string, id: string): string | null {
     `${id}: tarea.md no tiene la constancia de la autorrevision (seccion "${SECCION_AUTORREVISION}" con contenido). ` +
     'La revision sigue, pero antes de pedirla conviene pasar la seccion "## Que se revisa" de cada revisora ' +
     'que da "taskctl siguiente --json" (campo "revisores"), corregir lo evidente y anotar en tarea.md ' +
-    `"${SECCION_AUTORREVISION}" con una linea "- <revisora> — <commit>" por revisora, commiteada.`
+    `"${SECCION_AUTORREVISION}" con una linea "- <revisora> — <commit>" por revisora, commiteada, ` +
+    'y la de la Regla 4D: "- 4D — <commit>: helper buscado, criterios citados, N tests mutados".'
   );
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 4db2edf..180370d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -7,6 +7,7 @@
  * la ronda incremental de `taskctl review`: que dijo la ronda anterior,
  * desde que commit se reviso y que hallazgos siguen abiertos.
  */
+import { rangoDeSeccion } from './transiciones.js';
 
 const PREFIJO_VEREDICTO = '- veredicto:';
 
@@ -485,3 +486,58 @@ export function resumirHallazgos(informes: readonly InformeLeido[]): ResumenHall
   }
   return { informes: informes.length, informesSinTabla, porSeveridad, porOrigen, severidadesDesconocidas };
 }
+
+// --- Regla 4D (TASK-137) -----------------------------------------------------
+
+/** Titulo de la seccion del informe, sin tilde, como `## Hallazgos`. */
+export const SECCION_REGLA_4D = '## Regla 4D';
+
+/** Las cuatro D, en el orden de la plantilla; la etiqueta de cada linea `- <D>:`. */
+export const DIMENSIONES_4D = ['Duplicacion', 'Desviacion', 'Diluvio', 'Disfraz'] as const;
+
+/** Valor de la plantilla: una linea que lo conserva no se ha rellenado. */
+export const VALOR_PLANTILLA_4D = '(cumple / ID del hallazgo)';
+
+/** Las cuatro lineas de la seccion, tal como las deja la plantilla del informe. */
+export function plantillaRegla4D(): string {
+  return `${SECCION_REGLA_4D}\n\n${DIMENSIONES_4D.map((d) => `- ${d}: ${VALOR_PLANTILLA_4D}`).join('\n')}\n`;
+}
+
+/**
+ * Que le falta a la seccion `## Regla 4D` de un informe: `['seccion']` si no
+ * esta, o las D cuya linea falta, esta vacia o conserva el valor de la
+ * plantilla. Vacio = completa. La etiqueta se reconoce sin mayusculas, tildes
+ * ni enfasis (`- **Duplicación**: cumple`).
+ */
+export function faltasRegla4D(informe: string): string[] {
+  const lineas = informe.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_REGLA_4D);
+  if (rango === null) return ['seccion'];
+  const valores = new Map<string, string>();
+  for (const l of lineas.slice(rango[0] + 1, rango[1])) {
+    const m = /^\s*-\s*([^:]+):(.*)$/.exec(l);
+    if (m !== null) valores.set(normalizarCelda(m[1] as string).toLowerCase(), normalizarCelda(m[2] as string));
+  }
+  return DIMENSIONES_4D.filter((d) => {
+    const v = valores.get(d.toLowerCase());
+    return v === undefined || v === '' || v === VALOR_PLANTILLA_4D;
+  });
+}
+
+/**
+ * El aviso de `finish` si algun informe de la ultima ronda no tiene la
+ * seccion `## Regla 4D` completa; null si todos la tienen. No bloquea: el
+ * veredicto sigue siendo la puerta.
+ */
+export function avisoRegla4D(informes: readonly { fichero: string; texto: string }[], id: string): string | null {
+  const problemas = informes.flatMap(({ fichero, texto }) => {
+    const faltas = faltasRegla4D(texto);
+    if (faltas.length === 0) return [];
+    return [faltas[0] === 'seccion' ? `${fichero} no la tiene` : `${fichero} sin rellenar: ${faltas.join(', ')}`];
+  });
+  if (problemas.length === 0) return null;
+  return (
+    `${id}: la seccion "${SECCION_REGLA_4D}" del informe de revision falta o esta incompleta (${problemas.join('; ')}). ` +
+    'Cada D lleva "cumple" o el ID de su hallazgo. La tarea se cierra igualmente (el veredicto es la puerta).'
+  );
+}
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-137/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-137/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-137/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-137/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-137/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-137/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-137/tarea.md                                                       | 16 +++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     | 10 +++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |  4 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/autorrevision.js                                  |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                               | 51 +++++++++++++++++++++++++++++++++++++++++++++++++++
 11 files changed, 76 insertions(+), 8 deletions(-)
````

## Tests del diff (4 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-regla-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-regla-4d.test.ts | 32 ++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts            | 45 +++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts          | 54 ++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts         |  5 ++++-
 4 files changed, 135 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 124.7 s
- Commit verificado: a6b1aafb788eabf63bd9bde05c040039710210cd
- Huella: 661072de9b49bc24de7be4ed3fffebae123d4418
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 144359 bytes en total):

````
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3641ms)
✔ revision.md define las 4D con ejemplo y hace IMPORTANTE la duplicacion y el disfraz reales (33.1867ms)
✔ cada revisora da un ejemplo por D en su seccion "## Que se revisa" y remite a revision.md (25.0922ms)
✔ start exige helper buscado, criterio citado y mutacion, anotados en la autorrevision (32.9792ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (24.934ms)
✔ 1. las cuatro skills revisoras existen con su nombre exacto (4.1032ms)
✔ 2. el frontmatter parsea y declara name y description (el validador NO comprueba esto) (11.3125ms)
✔ 3. el frontmatter solo lleva las claves del spec portable (13.8382ms)
✔ 4. patrones_archivo es legible por el UNICO parser que hay en el repo (15.5205ms)
✔ 5. los revisores de dominio traen patrones; el generico declara que no los tiene (10.6357ms)
✔ 6. ningun revisor de dominio se solapa con otro en un patron identico (35.3426ms)
✔ 6b. la tabla de enrutado no esta vacia ni cojea (guard de no-vacuidad) (6.5826ms)
✔ 6c. POSITIVA: cada ruta que tiene que casar llega al revisor que le toca (192.9582ms)
✔ 6d. NEGATIVA: ninguna ruta ajena llega a un revisor de dominio (196.6104ms)
✔ 7. la linea de veredicto que cada skill prescribe la ACEPTA finish.ts (10.2456ms)
✔ 8. cada skill prescribe tambien la forma de NO aprobar, y finish.ts la rechaza (16.2212ms)
✔ 9. las tres severidades estan DEFINIDAS (no solo mencionadas) en las cuatro (35.7772ms)
✔ 9b. la definicion de severidad NO la satisface una mencion en prosa (0.7133ms)
✔ 10. las cuatro exigen reproducir en una SECCION con procedimiento, no de pasada (23.8056ms)
✔ 10 bis. la seccion de reproduccion NO la satisface la etiqueta del esqueleto (0.6262ms)
✔ 10b. el esqueleto derivado del CLI trae lo que este test da por supuesto (0.2473ms)
✔ 10c. las cuatro prescriben el esqueleto que taskctl review genera de verdad (10.5902ms)
✔ 10d. cada revisora enlaza la referencia comun, y la referencia existe (11.4761ms)
✔ 10e. lo comun a las revisoras y la tabla del veredicto viven solo en revision.md (267.8984ms)
✔ 10f. cada fila de la tabla del veredicto de revision.md dice lo que hace finish.ts (14.4517ms)
✔ 10g. la lectura de la tabla discrimina (contraprueba del 10f) (4.4781ms)
✔ 11. ninguna skill arrastra marcas de este repo ni rutas de maquina (11.8031ms)
✔ 11b. la marca generica de documento interno discrimina (contraprueba del menor 4) (0.5168ms)
✔ 12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro (22444.5775ms)
✔ 13. el plugin entero, con las cuatro skills dentro, sigue validando (9060.7311ms)
✔ 14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2 (4.4713ms)
ℹ tests 729
ℹ suites 0
ℹ pass 729
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 109795.1018
[verificar-impacto] node --test termino con 0 en 109.9 s.
````
