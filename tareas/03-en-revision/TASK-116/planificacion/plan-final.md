# Plan — TASK-116: P-8: TaskCode declara su verificacion y doctor avisa cuando falta

(Modo rapido: tarea pequena, el plan lo redacta el coordinador sin lanzar el
rol de brainstorm ni unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 30 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo, 1 de tests, 2 criterios de codigo)

Estado de partida, comprobado ejecutando `taskctl doctor` (build del repo) el
2026-11-12:

- **Criterio 1 ya se cumple.** Desde TASK-122, `.taskcode/config.yml` declara
  `comando_verificacion` (suite completa, para finish) y
  `comando_verificacion_selectiva` (`scripts/verificar-impacto.mjs`). Doctor
  da `[ok] verificacion` y `[ok] verificacion-selectiva`. No se toca la config.
- **Criterio 2, a medias.** TASK-088 ya da `aviso` (no `omitida`) cuando no hay
  clave y hay tests detectables en la raiz. Falta la segunda mitad de P-8:
  decir **cuantas tareas se han cerrado asi**.

Cambio, todo en `src/commands/doctor.ts`:

1. `comprobarVerificacion(cfg, detectar, contarTerminadas = () => 0)`: un
   tercer parametro inyectable que devuelve cuantas tareas hay en
   `tareas/04-terminadas`. Solo se llama en el camino del aviso (sin clave y
   con tests detectados): los proyectos configurados no pagan la lectura.
2. Si el numero es mayor que 0, el mensaje del aviso anade
   `; N tarea(s) terminada(s) se cerraron sin verificar` (singular/plural
   correctos). Con 0, el mensaje queda como hoy.
3. `contarTerminadas(tareasRoot)`: `readdirSync` de `04-terminadas`, filtrando
   con `isValidTaskId` (el mismo criterio que `comprobarTareas`). Si la
   carpeta no existe o no se lee, 0: la comprobacion `tareas` ya informa de
   eso y aqui no se duplica.

Por que «todas las terminadas» y no un recuento exacto: finish no deja rastro
cuando no hay comando (`ResultadoPuerta` `sin-comando` no anota nada), ni
tampoco cuando corre en verde, asi que no se puede distinguir una tarea
verificada de una que no. Sin la clave declarada hoy, la lectura honesta es
que ninguna de las terminadas paso por la puerta (es el «27 tareas cerradas
sin ningun freno» de la auditoria). El caso raro de una clave que existio y
se quito sobrecuenta; se acepta (ver riesgos).

El camino `omitida` (sin tests detectables) no cambia: un proyecto sin tests
no esta mal configurado y no se le anade ruido.

## Lo que el rol no cubrio

- La deteccion de los `comprobar-*.py` de OpenDockTrading como tests: fuera
  de alcance (los criterios piden el aviso y el recuento, no ampliar la
  deteccion de TASK-088). Si hace falta, tarea aparte.

## Riesgos aceptados y que los contiene

- Sobrecuenta si un proyecto quito la clave tras cerrar tareas con ella. Es
  un aviso informativo, no cambia el codigo de salida; el texto dice
  «se cerraron sin verificar», que es lo que vera la siguiente tarea.

## Plan de pruebas

En `test/commands/doctor.test.ts` (repos Git temporales reales, sin mocks):

- Sin clave, con `package.json` con script test y 3 tareas en
  `tareas/04-terminadas` (mas una entrada que no es ID valido, que no cuenta):
  `aviso` y el mensaje dice `3 tareas terminadas se cerraron sin verificar`.
- Con 1 terminada: singular (`1 tarea terminada se cerro sin verificar`).
- Con 0 terminadas: el mensaje no menciona tareas terminadas (no cambia).
- Con la clave declarada y terminadas: `ok`, sin recuento.
- Unitario de `comprobarVerificacion` con un `contarTerminadas` que lanza si
  se llama: no se llama con la clave declarada ni sin tests detectados.

Verificacion de la tarea: `RAMA_BASE=develop node scripts/verificar-impacto.mjs`
(tests afectados + `test:rapido`), sin debilitar ningun test existente.

## Lo que necesita decision de una persona

Nada.
