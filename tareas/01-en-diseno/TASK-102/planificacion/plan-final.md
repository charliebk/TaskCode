# Plan — TASK-102: Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

Duracion estimada: 55 min (A3a, tras trocear por decision de Carlos; ver «Lo que necesita decision de una persona»). La tarea entera estimaba 85 min (de la rama abierta al cierre con merge; señales: 4 ficheros de código previstos —`fs/git.ts`, `fs/decision-documentacion.ts`, `hooks/freno-stop.ts`, `commands/review.ts`— y 3-4 de tests con repos temporales; 3 capas: fs, hooks y commands; 6 criterios; 3 documentos; suite completa ~10 min más una revisión por pares). Estimación del unificador, no de ningún rol. Pasa de 60, así que se propone trocear: **A3a** = pasos 1-4 (`rutasDelArbol`, `conArbol`, `peticionDeTrabajo` y Stop; criterios 1, 2 y 4 en Stop) y **A3b** = paso 5 y docs (review, el test de «misma decisión» del criterio 3 y el criterio 5).
- Una sola función decide «documentación → selectiva → la de siempre» para Stop y review: `peticionDeTrabajo(config, base, raiz, sinSelectiva)` en `fs/decision-documentacion.ts`. Stop la llama con `'completa'` y review con `'nada'` (arquitectura).
- `decidirVerificacionEntre` gana la opción `conArbol`. `fs/git.ts` gana `rutasDelArbol` (`git diff --name-only HEAD` y `ls-files --others --exclude-standard`, con el mismo pathspec y `-z` que `rutasDeTarea`). Commits y árbol se unen antes de llamar a `decidirVerificacion`. `core/` no se toca (arquitectura; la unión previa la pide riesgos).
- Orden: 1) `rutasDelArbol`; 2) `conArbol`; 3) `peticionDeTrabajo`; 4) Stop; 5) review (`verificacionSelectivaDeRonda` pasa a `verificacionDeRonda`); 6) docs y suite. Los pasos 1-3 no cambian ningún comportamiento (arquitectura).

## Desacuerdos entre roles, y como se resuelven

- Puerta de coste cero — arquitectura: sin la clave no hay git nuevo porque `decidirVerificacionEntre` sale antes de `rutasDeTarea`, y la config se lee de la base (`configDeRef`) / riesgos: `configDeRef` ya lanza un `git show` por turno, así que la puerta tiene que mirar la config del árbol (la que Stop ya lee en la línea 138) — **gana riesgos**: es la única de las dos que cumple el criterio 4 tal como está escrito («ningún proceso git nuevo»). Consecuencia que asume riesgos: una rama que añade la clave sin que la base la tenga acaba en la completa.
- Base de Stop cuando `tipo` es null — arquitectura: la base sale siempre de `resolveBaseBranchForTipo(tipo)`, con `config.rama_base` de respaldo (y la marca como suposición) / riesgos: con `tipo === null` se va a la completa, porque Stop y review usarían bases distintas — **gana riesgos**: falla cerrado y protege el criterio 3; la postura de arquitectura depende de una suposición que ella misma no verificó.
- Held-out (`aceptacion/`) — arquitectura: no pasar `heldoutComoCodigo` porque ni Stop ni review los ejecutan / riesgos: deja como no comprobado que la suite del Stop no los ejecute — **gana arquitectura, con condición**: se adopta su propuesta solo si se confirma la suposición de riesgos (ver Suposiciones). Si la suite los ejecuta, el desacuerdo vuelve a la persona.

## Riesgos aceptados y que los contiene

- Un `.ts` sin trackear o un motor de glob en JS hacen pasar código por «solo documentación» sin avisar (su riesgo mayor) — riesgos — lo no trackeado pasa por el mismo pathspec de Git y cualquier fallo de Git da `null`, que es la completa. Arquitectura también rechaza el matcher en JS.
- review clasifica la lista de revisión o el delta de la ronda, no `base...HEAD` — riesgos — se decide siempre con `decidirVerificacionEntre(baseBranch, 'HEAD')`, después del update de Git-Flow de la primera ronda.
- Una config de la base inválida provoca un exit 2 nuevo en Stop — riesgos (arquitectura coincide) — base inválida es la de siempre más un aviso, como en finish (`finish-verificacion.ts:93-98`).
- La comprobación de documentación ensucia el árbol o sale en rojo a mitad de ronda — riesgos — se ejecuta antes de escribir nada y lanza `ReviewCommandError` con un rojo o con `cambioElArbol`, el patrón de la selectiva.
- El memo `documentacion` compartido no casa si Stop usa el timeout recortado o el comando del árbol — riesgos — el comando y el timeout de la de documentación salen siempre de la base. Arquitectura no lo trató.
- Hasta 6 procesos git más por turno con la clave declarada — arquitectura — solo después de la guarda 6, y solo en la rama de una tarea en curso.

## Plan de pruebas

- Turno y ronda de solo documentación: sin suite; con comando de documentación declarado, corre ese (un test por cada uno, repo temporal) — criterio 1, riesgos y arquitectura.
- `.ts` sin commitear y `.ts` sin trackear hacen que Stop y review apliquen la de siempre (un test por cada uno) — criterio 2, riesgos.
- Con la selectiva declarada, documentación se decide antes, y Stop y review dan la misma decisión para el mismo diff, también en una ronda 2 incremental — criterio 3, riesgos.
- Sin la clave en el árbol, Stop no lanza ningún git más que en la 0.14.0, ni siquiera `git show` (se cuentan los procesos, repo temporal) — criterio 4, riesgos.
- Config de la base inválida: la de siempre más un aviso, nunca un exit 2 nuevo; `tipo` null va a la completa — riesgos.
- Docs sin commits y con el árbol sucio de solo docs no salen como diff «vacío» (completa) — riesgos.

## Sin cubrir

- Criterio 5 (docs): ningún rol dice qué contar en ellas. Riesgos solo pide que el CHANGELOG anuncie el cambio para quien ya declaró la clave en TASK-100 — se escribe al implementar y lo revisa el par.
- Criterio 6 (suite en verde sin debilitar tests): ningún rol lo trató; riesgos avisa de que hay tests que comparan los mensajes del Stop — si cambia el texto, se actualizan esos tests sin aflojar sus aserciones.

## Salidas que faltaron

- ninguna

## Suposiciones no verificadas

- Que `git diff HEAD` con pathspecs `:(exclude,glob)` cubre a la vez lo preparado y lo no preparado — arquitectura — comprobarlo en un repo temporal antes del paso 1.
- Que `config.rama_base` sea la base correcta en Stop sin selectiva — arquitectura — mirar `resolveBaseBranchForTipo`. Queda sin efecto si se adopta «`tipo` null → completa».
- Que la suite del Stop no ejecute los held-out de `tareas/**/aceptacion/` — riesgos; arquitectura lo da por hecho — mirar qué ejecuta `comando_verificacion` en Stop.
- Que el diferimiento de la puerta al árbol no deje un hueco cuando la base sí declara la clave y el árbol la quita — derivada de la postura de riesgos, que la presenta como vuelta atrás deseada — confirmarlo en el test de regresión.

## Lo que necesita decision de una persona

**Respuestas de Carlos (2026-11-11, en la fase de diseño):**

1. **Trocear: sí.** TASK-102 hace A3a (pasos 1-4: `rutasDelArbol`, `conArbol`, `peticionDeTrabajo` y el freno Stop). A3b (paso 5: review, el test de que Stop y review dan la misma decisión y la documentación) pasa a TASK-104, que depende de esta. Los criterios de `tarea.md` se han ajustado a A3a.
2. **Review de solo documentación sin `comando_verificacion_selectiva`: nada.** Respaldo `'nada'`, como propone arquitectura: donde la 0.14.0 no corría nada, no aparece ninguna ejecución. Se aplica en TASK-104, pero `peticionDeTrabajo` ya nace con el parámetro `sinSelectiva`.
3. **Memo con el árbol sucio: no se escribe.** Con el árbol de trabajo sucio, el Stop corre la comprobación de documentación pero no guarda su memo, así el memo compartido solo describe commits limpios, como en finish. Es criterio de aceptación de esta tarea.

Duración estimada de A3a, tras trocear: ~55 min (3 ficheros de código: `fs/git.ts`, `fs/decision-documentacion.ts`, `hooks/freno-stop.ts`; 2-3 de tests; 2 capas; 6 criterios).

Preguntas originales:

- review sin `comando_verificacion_selectiva` en una ronda de solo documentación: ¿corre la comprobación de documentación o nada? Arquitectura propone `'nada'` (no aparece una ejecución donde en la 0.14.0 no la había); el criterio 1 admite la otra lectura. Ningún rol puede zanjarlo: es interpretar el criterio.
- Si Stop debe escribir el memo `documentacion` con el árbol sucio: riesgos avisa de que machaca el verde que finish guardó para el commit (un solo fichero, gana el último en escribir); arquitectura no responde y ningún rol propone remedio.
- Trocear en A3a y A3b (85 min estimados, más de la hora) o hacerlo de una vez. Lo decide la persona por la regla de la hora.
- Aprobar el plan entero con `taskctl approve`. Hasta entonces no se implementa nada.
