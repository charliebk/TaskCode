# Informe de revision — TASK-016 (ronda 3)

- Commit revisado: 29451bf
- Revisor: un agente independiente, distinto de los cuatro anteriores
- Veredicto: cambios-solicitados

Encargo acotado: verificar las correcciones de la ronda 2 y **buscar la tercera
puerta**, porque el mismo CRITICO ya se habia intentado arreglar dos veces.

Linea base: 743 tests, 740 pass, 3 fail (los tres conocidos de Windows).

## Lo que confirma

Las **cinco** correcciones de la ronda 2, reproducidas una a una contra repo Git
real: testigo huerfano, testigo de cero bytes, peticion de rol de cero bytes,
salida huerfana que secuestraba la lista, y el caso "sin salidas previas". Todas
**CONFIRMADAS**. Y las **4 mutaciones** que aplico a las comprobaciones nuevas
las mata la suite, sin falsos verdes.

Casos extra que probo y estan bien: directorio en lugar de fichero (error
explicito y accionable, tarea sin mover) y testigo en solo lectura.

## CRITICO — la ronda se quedaba clavada en 2 para siempre

**Corregido y verificado.** Y es el hallazgo que mas me importa de las tres
rondas, porque **no hacia falta ningun estado degradado para llegar a el**:
bastaba el camino feliz, tres veces seguidas.

`rondaCompleta(n)` exigia el testigo **y las peticiones de todos los roles** de
la ronda `n`. Pero la escritura de peticiones de rol esta bajo
`if (!brainstormReutilizado)`, o sea que **una ronda de re-planificacion no las
escribe nunca, por diseño**. Consecuencia: ninguna ronda ≥2 podia estar completa
jamas, `ronda` devolvia 2 indefinidamente y `escribirSiNoEstaYa` encontraba el
testigo ya escrito y volvia sin hacer nada.

Reproducido con el binario real sobre un repo limpio: cinco `plan` seguidos dan
`ronda 1, 2, 2, 2, 2`, los tres ultimos con "Sin cambios que commitear" y exit 0.
Efectos: la peticion del unificador de la tercera vuelta en adelante es la de la
segunda, rancia y con su lista de salidas congelada; si ademas alguien sube la
complejidad, el CLI imprime "se lanzan 4 roles" y escribe cero; y se pierde el
rastro de auditoria, porque `peticion-unificador-3.md` no existe nunca.

**La raiz, y es la leccion que queda en el codigo**: aqui vivian fusionadas dos
preguntas distintas — *"¿que ronda toca escribir?"* y *"¿hay que relanzar los
roles?"* — y responderlas con una sola variable funcionaba exactamente hasta la
tercera vuelta. Ahora una ronda esta completa cuando produjo **lo que a ELLA le
tocaba**, que no es lo mismo para la ronda 1 que para las siguientes.

El revisor aporto ademas la prueba que aisla la causa: con `complejidad: trivial`
(0 roles) la ronda **si** avanzaba 1, 2, 3, 4. El fallo aparecia solo con
`roles.length > 0`, que es el 100% de las tareas reales.

Verificado tras el arreglo, en clon limpio: cinco pases dan rondas 1, 2, 3, 4, 5,
con sus cinco testigos en disco.

## IMPORTANTE — bajar la complejidad tiraba un brainstorm que existia

**Corregido y verificado.**

Si alguien baja `complejidad` entre dos vueltas, `roles` se queda vacio; y como
la lista de salidas se **componia a partir de `roles`**, salia vacia. La peticion
afirmaba entonces *"No hay salidas de brainstorm que consolidar: redacta el plan
directamente a partir del enunciado"* teniendo al lado, llenas, las salidas que
los agentes de la ronda anterior habian escrito. Y encima mentia sobre la causa
("el numero de roles sale del lookup, no de un descuido"): ahi si hubo
brainstorm, y se estaba tirando.

Es **el mismo sintoma corregido dos veces** — el unificador ignorando un
brainstorm real — entrando por una tercera puerta. La unica forma de cerrarla
del todo era dejar de deducir la lista de un parametro que puede haber cambiado
y **preguntarle al disco que hay**. Ahora las salidas se resuelven a nombres
reales de fichero, y el texto de la peticion se ramifica por las salidas
efectivas y no por la tabla de complejidad.

## MENOR documentado y NO corregido

- **Un testigo con otro *case* es invisible al contador pero bloquea la
  escritura.** En un filesystem case-insensitive, un `Peticion-Unificador-1.md`
  renombrado a mano no casa con el regex (que cuenta 0 rondas) pero si da EEXIST
  al escribir, asi que el CLI reporta haber escrito un fichero que en realidad
  no toco. Exige un renombrado manual y el impacto es que el comando afirma algo
  que no hizo; no se corrige porque hacerlo bien pide normalizar *case* en la
  comparacion, y eso tiene sus propias trampas en un plugin que corre en tres
  sistemas de ficheros distintos.

## Comentarios que ya no describian el codigo

Los dos que señalo — la doc de `rondaCompleta` (que prometia completar con los
roles nuevos al subir la complejidad, cosa que solo pasaba con `ultimaTestigo === 1`)
y la de `RONDA_UNIFICADOR_RE` (cierta en la letra, engañosa en el efecto) —
**corregidos**. Es un recordatorio util: los comentarios de este fichero
documentan hallazgos pagados, asi que uno desactualizado no es ruido, es una
afirmacion con autoridad que ya no se cumple.

## Lo que estas tres rondas dejan como leccion

El mismo CRITICO se arreglo **tres veces** antes de quedar cerrado, y las tres
veces el arreglo era correcto para el caso que tenia delante:

1. La ronda se deducia de tres tipos de fichero → se eligio un testigo.
2. El testigo se validaba por su nombre → se valido su contenido y sus
   acompañantes.
3. Se le exigia a toda ronda lo que solo la primera produce → se distinguio que
   le toca a cada una.

Ninguno de los tres era un descuido de escritura: los tres eran **un modelo
mental incompleto del estado que puede tener esa carpeta**. Por eso ninguna de
las tres correcciones se encontro leyendo el diff, y las tres salieron de
montar el estado a mano y ejecutar el binario.
