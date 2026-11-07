# Plan — TASK-090: El guardian de secretos tolera excepciones solo en su fichero historico

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.
Este plan nombra solo las constantes troceadas de `test/helpers/claves-falsas.ts`,
nunca sus valores: citarlos entero es justo el incidente que corrige.)

## Enfoque propuesto

Se toca un solo fichero:
`taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts`.
`claves-falsas.ts` ya exporta troceadas `STRIPE_TEST_EJEMPLO`, `SLACK` y `AWS_EJEMPLO`.

El mapa `PERMITIDOS: Map<valor, motivo>`, que vale para cualquier fichero, se parte en dos:

- `PERMITIDOS_EN_CUALQUIER_FICHERO: Map<valor, motivo>`: solo `AWS_EJEMPLO`.
- `EXCEPCIONES_HISTORICAS: ReadonlyArray<{ fichero, valor, motivo }>`: parejas exactas.
  `fichero` es la ruta POSIX relativa a la raiz, tal como la da `git ls-files`, comparada
  con `===` (sin globs ni prefijos). `valor` es siempre la constante importada.

Parejas que pide el arbol hoy (Grep sobre el valor completo):

- `STRIPE_TEST_EJEMPLO`: `tareas/04-terminadas/TASK-066/revision/peticion-revision-1.md`,
  `tareas/04-terminadas/TASK-089/planificacion/plan-final.md` y
  `tareas/04-terminadas/TASK-089/revision/peticion-revision-1.md`.
- `SLACK`: `tareas/04-terminadas/TASK-066/revision/peticion-revision-1.md` y
  `tareas/04-terminadas/TASK-089/revision/peticion-revision-1.md`.
- Ningun otro fichero versionado lleva esos dos valores enteros.

**`AWS_EJEMPLO` sigue por valor**: GitHub no lo marco en el push que si bloqueo el de Stripe,
es el ejemplo canonico de AWS, y esta en 9 ficheros, dos vivos (`src/core/secretos.ts:10`,
`README.md:1001` del plugin). Por pareja, la tabla dejaria de significar «historico y
congelado».

Pasos:

1. `escanear(fichero, texto)` llama a `permitido(fichero, valor)`: primero el mapa global,
   luego las parejas. Su firma no cambia.
2. Las dos tablas sustituyen al mapa, con un motivo por entrada («publicado en origin, no
   se reescribe historial»).
3. La contraprueba «lo permitido y lo que no es clave no se marca» deja de pasar
   `STRIPE_TEST_EJEMPLO` y `SLACK` con una ruta inventada (ahora serian rojo); conserva
   `AWS_EJEMPLO`.
4. Contraprueba nueva en el mismo fichero (misma `escanear`): `STRIPE_TEST_EJEMPLO` con la
   ruta de TASK-066 da `[]`, y el mismo texto con una ruta nueva da un hallazgo
   `stripe-test` con fichero y linea, sin el valor crudo. Igual para `SLACK`.
5. Excepciones muertas: el test principal cuenta el uso de cada pareja en el recorrido; una
   que no se usa falla con «excepcion muerta: quitala».

Coste: igual (un `git ls-files` y una lectura por fichero; la tabla solo se consulta cuando
ya hay coincidencia).

**Descartadas**: excepciones por directorio (taparian una tarea que se cierra citando la
clave, que es lo que paso con TASK-089); por fichero+linea (un reformateo las rompe, y el
criterio pide fichero+valor); reescribir el historial (lo descarto la persona).

## Lo que el rol no cubrio

- Criterio 2: la contraprueba esta disenada, pero sin rol de testing que la revise.
- Criterio 3: depende de que lo que casa el regex sea exactamente la constante en esos
  ficheros, incluida la clave pegada tras un `\n` en el diff de TASK-089. Sin ejecutar.
- Criterio 4: sin ejecutar.
- Riesgos sin rol propio: rutas en Windows (`git ls-files` da `/`), ficheros que se muevan.
- Dominio: que GitHub tolere de verdad el token corto de Slack y el de AWS en commits nuevos
  se sabe por un unico push.

## Riesgos aceptados y que los contiene

- **`AWS_EJEMPLO` tolerado en cualquier fichero.** Si GitHub cambiara de criterio, un push
  se bloquearia sin aviso de la suite. Lo contiene lo observado y el motivo escrito; pasarlo
  a parejas es anadir filas.
- **Parejas con rutas fijas.** Mover un fichero historico pone el test en rojo, y la
  comprobacion de excepciones muertas senala la entrada huerfana. Se quiere asi.
- **El plan o los informes de TASK-090 citando el valor.** Lo contiene el propio test (un
  fichero nuevo con el valor sale en rojo) y que este plan nombra solo constantes.

## Plan de pruebas

1. Test principal sobre el arbol real: verde con las parejas de TASK-066 y TASK-089.
2. Contraprueba nueva: el valor en su fichero historico da `[]`; con otra ruta, hallazgo con
   patron, fichero y linea y sin el valor crudo. Para Stripe y para Slack.
3. Contraprueba ajustada: `AWS_EJEMPLO` con cualquier ruta no se marca.
4. Excepcion muerta: una pareja con una ruta que no existe hace fallar el test (mutante del
   revisor).
5. Mutante del revisor en un clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-090-r1`:
   el valor armado ejecutando la constante, copiado en un fichero versionado nuevo → rojo
   con ruta y linea.
6. `npm test` completo: solo los 3 rojos conocidos de Windows.

## Lo que necesita decision de una persona

Propuesto por el rol y recomendado por quien orquesta; se somete a la aprobacion del plan:

1. `AWS_EJEMPLO` sigue permitido por valor (alternativa: parejas en 9 ficheros, dos vivos).
2. `SLACK` pasa a parejas aunque GitHub no lo bloqueo, por coherencia con la decision.
3. Se incluye la comprobacion de excepciones muertas.
4. Requisito externo, no de esta tarea: la persona permite en GitHub la clave de ejemplo de
   Stripe de los commits de TASK-089 para que el push de develop pase.
