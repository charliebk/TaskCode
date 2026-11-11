# Plan — TASK-104: Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

Duracion estimada: 50 min (de la rama abierta al cierre con merge; senales: 2 ficheros de codigo (review.ts, informe-verificacion.ts), 1 capa, 6 criterios)

Se lanzaron 2 roles: la complejidad declarada era media y la heurística, simple; manda la mayor de las dos. No se crea ningún módulo nuevo (arquitectura). Pasos: 1) `VerificacionDeRonda` gana `tipo: 'selectiva' | 'documentacion'`, con el texto de 'selectiva' idéntico byte a byte; 2) `verificacionSelectivaDeRonda` pasa a llamarse `verificacionDeRonda`, que conserva la guarda temprana (sin selectiva → null, sin git nuevo), llama a `peticionDeTrabajo` sobre base...HEAD con el `baseFiable` de Stop y ejecuta con `verificarConMemo`; 3) los avisos y fallos de la decisión pasan a la salida de review; 4) verificacion-selectiva.md, README y CHANGELOG (arquitectura).

## Desacuerdos entre roles, y como se resuelven

- Guarda «sin selectiva no corre nada»: riesgos daba por hecho que arquitectura reutilizaba `peticionDeTrabajo` tal cual con `sinSelectiva:'nada'`, y eso violaría el criterio 4. Arquitectura propone en realidad mantener la guarda temprana y descarta expresamente confiar en `sinSelectiva`. En el fondo no discrepan: se mantiene la guarda, como piden los dos.
- La ronda de documentación sin comando (en la petición): arquitectura la deja en null, sin sección. Riesgos quiere que la petición diga «no corrió nada». Gana riesgos, pero solo en ese caso: es un comportamiento nuevo, así que no rompe la regresión, y evita que el revisor dé por buena una garantía que nadie comprobó. Cuando no hay selectiva declarada sigue siendo null, sin ninguna línea añadida (criterio 4, que también pide riesgos).
- Fallos de `configDeRef(base)` que no son `ConfigError`: arquitectura solo vuelca a la salida los avisos de «config de la base inválida». Riesgos pide que cualquier fallo de la decisión vuelva a la verificación de siempre, con un aviso. Gana riesgos: arquitectura no cubre ese caso, y si review aborta donde la 0.14.0 funcionaba, se viola el criterio 4.
- Cobertura cuando el plan es de documentación: arquitectura la oculta solo si el plan es `selectiva`, así que en una ronda de documentación reaparece. Riesgos avisa de que puede reaparecer la de un informe viejo y dice «hay que decidirlo». No lo decido yo: va a la decisión de una persona (abajo).

## Riesgos aceptados y que los contiene

- Que la petición diga «selectiva en verde» de algo que solo fue la comprobación de documentación (riesgos: «no aborta ni avisa»). Lo contienen el `tipo` en `seccionVerificacionRevision` y mensajes de rojo y de árbol sucio distintos para cada tipo (los dos roles).
- Un hotfix corre la selectiva en review porque `baseFiable` es false (arquitectura: coste aceptado para que Stop y review decidan lo mismo por construcción).
- Que el comando de documentación ensucie el árbol (un linter con --fix) y el siguiente comando aborte (riesgos). Lo contiene la misma guarda de árbol y de rojo para cualquier plan que ejecute algo.
- En la primera ronda, un rojo de documentación deja ya hecho el merge de la base (riesgos). Pasa igual que hoy con la selectiva, pero el mensaje de `estadoBase` tiene que valer para los dos tipos.
- El memo de documentación se comparte con Stop y su huella incluye el timeout (riesgos): se vuelve a ejecutar, que es un coste, no un falso verde.
- Cambio de comportamiento para quien ya declaró `rutas_documentacion` y selectiva sin comando de documentación: una ronda de solo documentación ya no corre nada (riesgos). Lo contiene el CHANGELOG (criterio 5).

## Plan de pruebas

- Ronda de solo documentación con selectiva y comando de documentación → corre el de documentación y no la selectiva. Sin selectiva → no corre nada. Repo temporal (criterio 1; arquitectura y riesgos).
- Código en base...HEAD con un delta incremental que solo toca documentación → verificación de siempre. Repo temporal (criterio 2; arquitectura).
- Stop y review dan la misma decisión para el mismo diff, también en una rama de hotfix, con selectiva declarada. Repo temporal (criterio 3; los dos roles).
- Sin la configuración nueva: ni un git más ni una línea más en la petición, y la cobertura como en la 0.14.0. Regresión en repo temporal (criterio 4; riesgos).
- Un fallo de `configDeRef` (ref inexistente) vuelve a la verificación de siempre, con un aviso visible en la salida de review (riesgos).
- La sección de la petición pone «documentación» o «no corrió nada», nunca «selectiva», cuando no corrió la selectiva (riesgos).

## Sin cubrir

- Criterio 6 (suite completa en verde): ningún rol lo trata. Se corre una sola vez antes de pedir la revisión.
- Criterio 3 sin selectiva declarada: Stop corre algo y review nada. Los dos roles lo restringen a «con selectiva»; el enunciado no hace esa salvedad. Va a la decisión humana.
- Held-out: no cuentan como código (MEN-3 de TASK-102). Solo riesgos pide nombrarlo en la documentación; arquitectura no lo menciona.

## Salidas que faltaron

ninguna

## Suposiciones no verificadas

- `tipo` nunca es null en review; el autocommit va después de l.764; `VerificacionDeRonda` solo se usa desde review (arquitectura). Mirar review.ts y buscar los usos.
- Review no recorta el timeout, y no está claro por dónde saca hoy sus avisos (arquitectura). Mirar la salida de `taskctl review`.
- `isWorkspaceClean` cuenta los ficheros no trackeados y `rutasDeTarea` excluye `tareas/` (riesgos). Leer fs/git.ts.

## Lo que necesita decision de una persona

- RESUELTA (Carlos): en una ronda de solo documentación sin `comando_verificacion_selectiva` no corre nada, aunque haya comando de documentación.
- RESUELTA (Carlos): el troceado ya está hecho; esta es A3b, la segunda mitad de TASK-102.
- NUEVA: la cobertura en una ronda de documentación. ¿Se muestra la del último informe (arquitectura) o se oculta para que no aparezca una vieja (la duda de riesgos)? Ningún rol aportó cómo de fresco es ese informe.
- NUEVA: ¿se acepta que el criterio 3 se pruebe solo con selectiva declarada? Sin ella, Stop y review deciden distinto por la decisión de Carlos, y el enunciado no lo dice.
- Aprobar el plan entero con `taskctl approve`: no se implementa nada antes.
