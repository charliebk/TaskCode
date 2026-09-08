# Informe de revision — TASK-016 (ronda 2)

- Commit revisado: 1b3b20e
- Revisor: un agente independiente, distinto de los tres de la ronda 1
- Veredicto: cambios-solicitados

Encargo: verificar empiricamente que las correcciones de la ronda 1 son reales
y no abren agujeros nuevos. Lo hizo, y encontro que **el arreglo del primer
CRITICO estaba a medias**.

Linea base: 741 tests, 738 pass, 3 fail (los tres conocidos de Windows). Sin
cuarto rojo.

## Lo que confirmo

| Correccion de la ronda 1 | Estado |
|---|---|
| CRITICO 1 — ronda a medias | **PARCIALMENTE confirmada** (ver abajo) |
| CRITICO 2 — salidas inexistentes | **CONFIRMADA** en el camino normal; se reabria en dos bordes |
| Los tests nuevos muerden | **CONFIRMADA**, 4 de 5 mutaciones detectadas |
| Integracion aguas abajo | **CONFIRMADA** |

Sobre lo ultimo: monto un `new → plan → approve → start → review → finish`
completo con el brainstorm relleno de por medio. Todo verde, `brainstorm/`
viaja intacta por los cuatro estados y convive con `revision/` en
`04-terminadas/`, y `board` la lista bien en cada uno. La decision de colgar
`brainstorm/` de `planificacion/` — para que el `rename` y el auto-commit la
cubran sin casos especiales — queda verificada de punta a punta.

## CRITICO A — el mismo fallo, por la puerta de al lado

**Corregido y verificado.**

El arreglo de la ronda 1 eligio el fichero del unificador como testigo de
"ronda completa", pero **no protegio al testigo de ser el mismo el resto**. Si
lo que sobrevive a la interrupcion es justo ese fichero y no las peticiones de
rol, se reproducia el cuadro entero: primera planificacion sin una sola
peticion de rol, exit 0, el CLI diciendo "se lanzan 4 roles" y a renglon
seguido "NO se relanza el brainstorm", y sin salida por comandos.

El revisor lo reprodujo con el CLI sobre un repo Git nuevo, y añadio el
agravante: cada `plan` posterior sumaba otra peticion de unificador huerfana y
volvia a commitear.

## CRITICO B — el testigo se validaba por nombre, no por contenido

**Corregido y verificado.**

`flag: 'wx'` crea el fichero **antes** de volcar el contenido, asi que una
muerte en ese hueco deja un testigo de **cero bytes** — que es exactamente el
escenario que motivo todo esto. Preguntar solo si existe lo daba por bueno.

Los dos criticos tienen la misma raiz, y es la frase que queda escrita en el
codigo: **la existencia de un nombre de fichero no es evidencia de que algo se
completara.** El invariante "se escribe el ultimo" ordena las escrituras; no
dice nada de si la ultima llego a terminar. Confiar en el orden y no en el
resultado es lo que fallo dos veces seguidas.

Corregido: una ronda cuenta como completa solo si estan, **con contenido**, su
testigo y las peticiones de todos sus roles. Ambas mutaciones verificadas a
mano.

**Bug residual que destapo mi propio test al escribirlo**: `escribirSiNoEstaYa`
toleraba el fichero vacio y lo dejaba vacio, asi que un testigo truncado seguia
truncado ronda tras ronda. Ahora un fichero vacio se completa; uno con
contenido se respeta, porque puede llevar dentro el trabajo de un agente.

## IMPORTANTE C — una salida huerfana secuestraba al unificador

**Corregido y verificado.**

La ronda de las salidas se elegia con el **maximo** de los numeros presentes,
sin comprobar que ese maximo fuera un juego **completo**. Bastaba un fichero
rezagado — una salida de una ronda vieja que sobrevivio sola, o una copiada a
mano — para que el unificador recibiera la orden de consolidar esa ronda
huerfana, y **las salidas reales no se nombraran en ninguna parte**. No daba
error: redactaba el plan ignorando el brainstorm que si se hizo. En palabras
del revisor, *"falla en silencio y hacia arriba, que es la peor direccion"*.

Ahora se busca la ronda mas alta cuyo juego de salidas este completo.

## MENORES corregidos

- **Sin ningun juego de salidas, la peticion nombraba ficheros que el propio
  CLI sabe que no existen.** Ahora lo dice, que es lo que la plantilla ya sabia
  hacer para el caso de cero roles.
- **El fix del regex de la ronda 1 sobrevivia a su propia mutacion**: los
  cuatro ids actuales son letras puras, asi que `[a-z]+` los casaba igual y
  devolver el regex a la version vieja no ponia nada rojo. Un fix sin test es
  una regresion esperando. Cubierto.
- **Un test montaba el escenario del CRITICO A y lo daba por correcto**: el de
  "la ronda sale del mayor numero presente" sembraba solo el testigo y
  aseveraba `ronda === 5`, sin comprobar que se escribiera ninguna peticion de
  rol. Ahora siembra una ronda 4 **completa**. Es la leccion mas incomoda de
  esta ronda: **un test puede consagrar un bug igual de bien que documentarlo**,
  y este lo hizo — el agujero estaba cubierto por un test verde.

## Lo que el revisor midio y conviene guardar

- Las mutaciones que aplico a los tests de la ronda 1: **4 de 5 detectadas**.
  La unica que sobrevivio fue la del regex, y era un fix menor sin test.
- El end-to-end completo del ciclo de vida con brainstorm por medio no rompe
  nada aguas abajo: `finish` integro los commits y actualizo `CHANGELOG.md`,
  `docs/INDEX.md` y `docs/BOARD.md` sin tropezar con la carpeta nueva.
