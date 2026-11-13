# Plan — TASK-131: tres tests con expectativas anteriores a TASK-119

(Modo rapido: el plan lo redacta el coordinador sin lanzar el rol. Decision de
Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 25 min (de la rama abierta al cierre con merge; senales: 0 ficheros de codigo, 3 de tests, 4 criterios)

Diagnostico (reproducido en develop, 2026-11-13): no hay bug de produccion.
TASK-119 cambio a proposito tres reglas (plan de TASK-119, puntos 3, 5 y 6) y
no actualizo tres tests que las comprobaban con la regla vieja:

1. `test/commands/automatico-ciclo.test.ts` («finish solo sigue solo si lo
   aprobado es exactamente lo revisado»): esperaba `finish` en `preguntar` con
   una edicion del informe sin commitear. Desde TASK-119 `siguiente` ya no
   exige el informe commiteado (lo absorbe `finish`): la expectativa pasa a
   `continuar`, con el comentario del motivo. Se mantienen las demas
   aserciones del test (plantilla sin rellenar y informe sin revisor siguen
   preguntando).
2. `test/commands/automatico-guarda-finish.test.ts` (IMP-3): `veredicto` ya no
   commitea, asi que el `git checkout develop` del test aborta por el informe
   modificado. Se commitea el veredicto pendiente antes de cambiar de rama
   (lo que haria cualquiera que cambie de rama a mano); la guarda que prueba
   (codigo colado tras el veredicto, leido desde develop, pregunta) no cambia.
3. `test/skills/fases.test.ts` (automatico TASK-059): la skill `review` ya no
   dice «commitealo **solo...**» sino «dejalo sin commitear... Nunca lo mezcles
   en un commit con codigo». La asercion comprueba las dos frases nuevas.

## Lo que el rol no cubrio

No se lanzo el rol.

## Riesgos aceptados y que los contiene

- Cambiar una expectativa de `preguntar` a `continuar` puede parecer debilitar
  el test: es la regla decidida en TASK-119 (su punto 5) y la cubren los tests
  de `pendientes-fase.test.ts`; el resto de guardas del test se conserva.

## Plan de pruebas

- Los tres ficheros en verde; `npm run test:rapido`; `verificar-impacto`.

## Lo que necesita decision de una persona

Nada.
