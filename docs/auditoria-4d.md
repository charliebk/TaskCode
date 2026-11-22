# Auditoría 4D — las 10 últimas tareas terminadas (TASK-127 a TASK-136)

> TASK-137, 2026-11-22. Regla 4D: sin **duplicación**, **desviación**,
> **diluvio** ni **disfraz** (definición en
> `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md`).
> Solo lectura: la auditoría no corrige nada (hacerlo aquí sería desviación);
> cada caso tiene su tarea de seguimiento.

## Método

Tres agentes en paralelo, cada uno con un tramo (127–130, 131–133, 134–136),
leyeron el diff de cada tarea (merge a `develop` o, sin merge, de «tarea
creada» a «tarea terminada»), su `tarea.md` y el código actual. El
coordinador volvió a comprobar en el código cada caso de confianza alta
antes de listarlo (rutas y líneas de `develop` a 2026-11-22). Los casos de
disfraz salen de razonar la mutación sobre el test, no de ejecutar mutantes;
los de confianza media se marcan como tales.

Rutas relativas a `taskcode-marketplace/plugins/taskcode-plugin/` salvo las
que empiezan por `scripts/` o `tareas/` (raíz del repo).

## Casos

| ID | Tarea | D | Fichero:línea | Evidencia | Severidad | Confianza | Seguimiento |
|---|---|---|---|---|---|---|---|
| A1 | 129 | Duplicación | `src/commands/metricas.ts:513-518` y `src/core/crecimiento-suite.ts:78-98` | Dos agregadores de la suite por versión con reglas distintas: `metricas` guarda la última línea `suite` verde por tarea; `suitePorVersion` (doctor) usa todas. Con una tarea que corre la completa dos veces, `metricas --por-version` y el aviso de crecimiento dan cifras distintas para la misma versión. Comprobado. | IMPORTANTE | alta | TASK-138 |
| A2 | 129 | Duplicación | `src/core/versiones-metricas.ts:104-114` y `src/core/crecimiento-suite.ts:71-76` | La mediana y el máximo de tests escritos dos veces (cierre inline y `mediana()`). Comprobado. | MENOR | alta | TASK-138 |
| A3 | 129 | Duplicación | `src/core/crecimiento-suite.ts:52` y `:58` | La misma regex de pytest se declara y ejecuta dos veces (`pytestFinal` y `pytest`) sobre el mismo texto. Comprobado. | MENOR | alta | TASK-138 |
| A4 | 128 | Duplicación | `src/commands/finish-verificacion.ts:119` (`anotarFinish`), `src/commands/review.ts:1308-1316` y `anotarSuite` | La decisión `omitido`/`verde`/`rojo` con su duración e instante, escrita en tres sitios. | MENOR | alta | TASK-138 |
| A5 | 128 | Disfraz | `src/core/registro-puertas.ts:106` y `test/core/metricas-puertas.test.ts:42` | `PUERTAS_VERIFICACION` no se usa en `src/`; su único test comprueba que la constante vale lo que se le asignó. Aparenta un contrato que nadie consume. Comprobado. | MENOR | alta | TASK-138 |
| A6 | 127/129/130 | Duplicación | `src/core/flujo.ts:~284-305`, `salidasTopeRondas`, `src/commands/review.ts:~739-758`; `src/commands/doctor.ts:500`, `:599`, `:646` | El texto de las tres salidas del tope de rondas, en tres redacciones; y tres lecturas casi iguales de las terminadas en `doctor`. | MENOR | media | TASK-138 |
| B1 | 133 | Disfraz | `skills/task-workflow/SKILL.md:201` | El criterio 2 pedía enlazar `poda-tests.md` desde la skill; ningún test lo comprueba (`test/core/poda-tests.test.ts:83` mira el enlace desde `tests-pesados.md`). Quitarlo no pone rojo nada. Comprobado. | MENOR | alta | TASK-139 |
| B2 | 133 | Disfraz | `tareas/04-terminadas/TASK-133/tarea.md:30-33` | Tarea terminada con sus cuatro criterios sin marcar; el `Resultado` explica que 3 y 4 pasaron a TASK-134, pero 1 y 2 se cumplen y no constan. Comprobado. | MENOR | alta | TASK-139 |
| B3 | 136 | Disfraz | `scripts/verificar-impacto.mjs:508-516` | La rama del cerrojo ilegible (`pid === null`, espera y reintento) no tiene test: el de cerrojo muerto escribe JSON válido. | MENOR | media | TASK-139 |
| B4 | 134 | Disfraz | `test/commands/doctor.test.ts:771-790` | Las aserciones del mensaje «bash de Git» solo corren en Windows; en el CI de Linux no comprueban nada (la resolución sí está cubierta por los tests puros). | MENOR | alta | TASK-139 |
| B5 | 135 | Duplicación | `test/commands/review-tests-stat.test.ts:254` y `:274` | Dos tests cubren la misma regresión ENAMETOOLONG; el segundo monta un repo de 1100 ficheros. | MENOR | media | TASK-139 |
| C1 | 136 | Diluvio | `scripts/verificar-impacto.mjs:546-577` (`retirarCerrojoMuerto`, `.robo`) | Segundo cerrojo con caducidad de 10 s y un test de ~9 s para una carrera casi imposible; bastaba borrar el cerrojo muerto y reintentar el `wx` (~8 líneas frente a ~45). Comprobado que existe; la proporción es juicio. | MENOR | media | TASK-140 |
| C2 | 130 | Disfraz (dudoso) | merge `92e93c7`, 28 ficheros de `test/` | La poda cumple el «≥10 %» por número de tests (819→624 rápida) fusionando tests con varios `caso()`, sin quitar aserciones ni medir duración; un test fusionado oculta los casos siguientes al primer fallo. | IMPORTANTE | media | TASK-140 |

Observaciones que **no** son caso: la «segunda barrera» de
`scripts/verificar-impacto.mjs:591-600` la pide el criterio 3 de TASK-136;
`lotesDeRutas` (`src/fs/git.ts:701`) cuenta caracteres y no bytes, lo
correcto para el límite de Windows aunque el criterio dijera bytes; la
duplicación de la ruta a `git.exe` en los tests de TASK-134 es coherente hoy.

## Por tarea

| Tarea | Casos | Nota |
|---|---|---|
| TASK-127 | A6 | Código mínimo; solo textos repetidos. |
| TASK-128 | A4, A5 | Sin desviación. |
| TASK-129 | A1, A2, A3, A6 | El caso más claro de la auditoría (A1). |
| TASK-130 | A6, C2 | La poda reduce el contador más que la redundancia. |
| TASK-131 | — | Tres tests actualizados, fieles al objetivo. |
| TASK-132 | — | Elimina duplicación de verdad (`test/helpers/caso.ts`). |
| TASK-133 | B1, B2 | |
| TASK-134 | B4 | `lanzarBash` sigue siendo el único sitio que lanza bash. |
| TASK-135 | B5 | `lotesDeRutas` unifica dos copias: reduce duplicación. |
| TASK-136 | B3, C1 | Los tests de solape y pid muerto discriminan. |

## Conclusión

La sospecha se confirma a medias: hay 4D en la 0.16, pero poco y casi todo
MENOR. Lo que más se repite es la **duplicación de una decisión** al añadir
una métrica (A1–A4: cada tarea de métricas escribió su propio agregador) y el
**disfraz por falta de test** de lo que el criterio pedía (B1, B3, B4). Son
justo lo que la Regla 4D pone ahora delante del implementador (buscar el
helper, mutar cada test) y del revisor (sección `## Regla 4D` del informe).
