# Informe de revision — TASK-016 (ronda 4)

- Commit revisado: 5ef524a
- Revisor: un agente independiente, distinto de los cinco anteriores
- Veredicto: cambios-solicitados

Encargo: verificar los dos hallazgos de la ronda 3 y **buscar la cuarta puerta**,
porque el mismo CRITICO ya se habia arreglado tres veces.

Linea base: 746 tests, 743 pass, 3 fail (los tres conocidos de Windows).

## Lo que confirma

Los dos hallazgos de la ronda 3, reproducidos: cinco `plan` seguidos dan rondas
1-5, y bajar la complejidad a `trivial` ya no niega las salidas. Y las tres
mutaciones que aplico a las comprobaciones nuevas las mata la suite.

Su conclusion sobre eso ultimo es la que importa: *"el problema no es cobertura
floja de lo escrito: es que lo que falta no esta escrito"*.

## Tres CRITICOS mas, con una sola raiz

**Todos corregidos y verificados en clon real.**

**A — un testigo suelto de ronda ≥2 dejaba la tarea sin brainstorm.** El arreglo
de la ronda 3 comprobaba las peticiones de rol **solo en la ronda 1**, asi que
cualquier resto con numero ≥2 se daba por bueno sin mirar nada. Una tarea recien
creada con un `peticion-unificador-2.md` dentro pasaba a `en-diseno` con exit 0,
sin una sola peticion de rol, y cada `plan` posterior repetia el diagnostico. El
revisor añadio el camino realista: alguien que quiere relanzar el brainstorm y
borra a mano las peticiones y salidas — que es lo que la propia peticion del
unificador le sugiere hacer — cae justo aqui.

**B — subir el numero de roles dejaba la peticion del unificador rancia.** Y no
hace falta ni tocar el campo `complejidad`: basta **añadir un criterio de
aceptacion** en el bucle de "pide cambios" para que la heuristica suba sola. El
resultado era un conjunto de ficheros que se contradecian entre si: la peticion
de arquitectura diciendo *"eres el unico rol"*, la de riesgos diciendo
*"trabajan en paralelo contigo: arquitectura"*, y la del unificador prohibiendo
buscar desacuerdos entre dos salidas que si los tendrian. Es exactamente el
fallo que esta tarea existe para evitar — *"N roles produciendo uno con N
firmas"* — fabricado por el propio CLI.

**C — bajar el numero de roles sin llegar a cero seguia tirando salidas
reales.** El arreglo de la ronda 3 solo cerro el caso de cero roles; en la otra
rama la lista se seguia componiendo a partir de `roles`. Con 3 roles que habian
respondido y una bajada a 1, el unificador veia una salida y las otras dos
quedaban al lado, llenas, sin nombrar.

## La raiz, que es lo que hay que llevarse

El propio revisor la formulo mejor de lo que estaba en mi cabeza:

> *"El estado de `planificacion/brainstorm/` sigue modelado por dos escalares
> —`ronda` y `brainstormReutilizado`— derivados de un unico fichero, cuando lo
> que la logica necesita saber son tres cosas independientes."*

Las tres: **(a)** que ronda toca escribir, **(b)** si hay un brainstorm
reutilizable **para los roles de hoy**, y **(c)** que salidas hay que
consolidar. Cada arreglo anterior respondia bien a una y seguia deduciendo las
otras dos de ella.

Por eso esta ronda **no se parchea: se rehace el bloque entero**, con las tres
preguntas hechas por separado y todas contra el disco. En concreto:

- `brainstormReutilizado` deja de ser `ronda > 1` y pasa a ser el resultado de
  buscar la ronda mas alta que tenga la peticion de **cada uno de los roles de
  hoy**. Si el juego de roles cambio, no hay nada reutilizable y el brainstorm
  se relanza con el juego nuevo.
- La peticion del unificador **se regenera siempre**, en vez de tratarse como un
  reintento tolerante. Es un artefacto derivado: no lleva dentro trabajo de
  nadie, a diferencia de las salidas. Esa distincion — que fichero puede
  contener trabajo ajeno y cual no — es la que decide si tolerar o sobrescribir.
- Las salidas a consolidar se **listan del disco**, nunca se componen desde
  `roles`.

Las dos sugerencias del revisor son literalmente lo que se implemento.

## IMPORTANTE — el CLI ocultaba la peticion que acababa de escribir

En `brainstormNotice`, la rama de "0 roles" tenia precedencia sobre la de
re-planificacion. Al bajar la complejidad a `trivial` en una segunda vuelta, el
CLI decia *"Sin brainstorm, redacta el plan y aprueba"* mientras acababa de
escribir una peticion de unificador correcta que nombraba las salidas reales.
El arreglo de contenido de la ronda 3 quedaba anulado en la capa de
presentacion. **Corregido** invirtiendo el orden de las ramas.

## MENOR — `brainstorm/` ocupado por un fichero

Era el unico `mkdir` del comando sin envolver; el de `planificacion/` se
envolvio en TASK-027 tras un hallazgo identico. Salia como *"taskctl no pudo
arrancar"* (falso: arranco bien) y, peor, dejaba un `plan-final.md` huerfano sin
commitear que **ensuciaba el workspace y hacia abortar todos los `taskctl plan`
posteriores, de cualquier tarea**. **Corregido.**

## MENOR documentado y NO corregido

- Un testigo con otro *case* en un filesystem case-insensitive sigue siendo
  invisible al contador pero bloquea la escritura, asi que el CLI afirma haber
  escrito un fichero que no toco. Exige un renombrado manual. Corregirlo bien
  pide normalizar *case* en la comparacion, con sus propias trampas en los tres
  sistemas de ficheros donde corre el plugin.

## Lo que dejan cuatro rondas sobre el mismo CRITICO

Cuatro arreglos, y los cuatro primeros eran correctos **para el caso que tenian
delante**. Ninguno fue un descuido de escritura: los cuatro salieron del mismo
sitio, un **modelo mental incompleto del estado que puede tener una carpeta**.
Y ninguno se encontro leyendo el diff — los cuatro salieron de montar el estado
a mano y ejecutar el binario.

Lo que rompio la racha no fue un parche mejor, sino **dejar de parchear**:
enumerar que preguntas necesita responder la logica, comprobar que se estaban
respondiendo todas desde una sola variable, y separarlas.
