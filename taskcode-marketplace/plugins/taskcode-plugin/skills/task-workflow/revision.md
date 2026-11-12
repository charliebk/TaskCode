# La revision por pares

Lo comun a toda revision por pares: lo lee quien orquesta antes de lanzar al
revisor, y cada skill revisora antes de empezar. Lo propio de cada dominio
(que ficheros le llegan, que se revisa, como se reproduce alli y ejemplos de
cada severidad) esta en la skill revisora; esto es lo que no cambia de una a
otra.

## Quien y como

**Quien.** Un agente que no implemento la tarea. La independencia es el punto,
no un formalismo.

**Como.** No es leer el diff y opinar. Es clonar el repo a un directorio
temporal, compilar, correr la suite uno mismo, y **construir el caso que rompe
el codigo antes de reportarlo**. Lo que mas hallazgos ha dado:

- **Mutacion**: romper a proposito cada proteccion y ver si algun test se
  entera. Asi se descubre que un flag defensivo se habia quedado sin cobertura.
- **Ejercitar el CLI real**, no solo la API interna.
- **Comprobar los tests que cambiaron de expectativa**: que sigan aseverando
  lo mismo y no escondan una regresion.
- **Reconstruir el build**: un clon no hereda binarios compilados, y cada rama
  compila algo distinto.

**Una sola ejecucion de la suite por ronda:** la puerta y la linea base son la
misma pasada de la suite completa; no se repite. Los mutantes se comprueban
con el fichero o la clase de test concretos que cubren la linea mutada, no con
la suite entera. Con varios revisores en paralelo en la misma maquina, la
suite se corre con concurrencia reducida o por turnos: si no, compiten por la
CPU y todas tardan mas.

## Antes de revisar: la puerta determinista

La revision **no empieza** hasta que pasan, en este orden:

1. **Build o compilacion**, con el comando que use el proyecto.
2. **Linter / formateador**, en modo verificacion.
3. **La suite de tests existente**, entera.

Si algo de eso falla, la revision **se detiene ahi**: se reporta el fallo y se
devuelve la tarea. Cero tokens gastados revisando codigo que no compila o que
ya tiene la suite en rojo. Un fallo de la puerta no es un hallazgo de
revision: es un requisito que no se cumplio.

Si el proyecto no tiene alguno de los tres pasos, dilo en el informe. "No hay
linter configurado" es informacion; suponer que se ejecuto, no.

## Lo que lees

La peticion de revision trae una seccion `## Contexto permitido`: el enunciado
y el plan de la tarea, y los ficheros de tu parte del diff. Lee **solo eso**
mas lo que el propio diff embebido te muestre. Recorrer el repo entero no es
revisar mejor: es gastar contexto en lo que nadie te pidio mirar.

La lista orienta, no prohibe. Si para reproducir o entender un hallazgo
necesitas leer algo que no esta en ella (otro modulo, un test vecino, una
configuracion), lo lees, y lo anotas con su motivo bajo `## Lecturas fuera del
contexto permitido` de tu informe: una linea por fichero. Si no leiste nada
fuera, esa seccion dice `ninguna`.

## Clasificacion

CRITICO: perdida de datos, corrupcion de estado, o el comando hace lo
contrario de lo que dice. IMPORTANTE: comportamiento incorrecto en un caso
real, no de borde. MENOR: todo lo demas. Cada skill revisora da ejemplos de
cada una en su dominio.

**Todos los hallazgos se documentan, tambien los que se decide no corregir**,
con el motivo. Sin esa nota, el siguiente lector concluye que hay un bug donde
hay una decision. Un "sin hallazgos" explicito es una respuesta valida;
inventar hallazgos para tener algo que reportar, no.

## Rondas

Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
`revision/`. **Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la
tarea.** Los MENOR que se corrijan no abren ronda 2: se corrigen los
baratos, se commitea y `taskctl verificar-menores TASK-NNN` comprueba que lo
cambiado desde el `Commit revisado` son solo los ficheros de esos MENORES (o
tests), lo registra en `tarea.md` y deja los no corregidos en
`revision/menores-pendientes.md` (backlog que no bloquea `finish`). Sin esa
verificacion, `finish` no integra codigo posterior al revisado salvo que una
persona pase `--aceptar-sin-revisar`. La ronda 2 solo se
pide si se corrigio algun CRITICO o IMPORTANTE (veredicto `cambios-solicitados`):
`taskctl review` sobre la tarea en revision la genera con solo el diff desde
la ronda anterior y los hallazgos aun abiertos de su tabla, sin integrar la
rama base (eso lo hace `finish`). Esa ronda revisa el delta de la correccion
y comprueba **cada uno de esos hallazgos**: las correcciones son justo donde
se cuelan los fallos nuevos. El revisor corre la suite completa una vez por
ronda; los mutantes, con el fichero de test concreto.

**Verificacion acotada: la revision converge.** El coste de revisar tiene que
crecer con el tamano de la correccion, no con el del proyecto. Desde la ronda
2, `taskctl review` genera la ronda como verificacion acotada, con la linea
`- Alcance: verificacion acotada al diff de las correcciones`, tambien si la
ronda anterior dejo CRITICOS o IMPORTANTES. Revisan los revisores que tienen
hallazgos pendientes (todo lo que no esta `aceptado`, tambien lo `corregido`:
la correccion es justo lo que se verifica), cada uno los suyos, y los de
dominio cuyos ficheros toca la correccion; todos con el diff entero de la
correccion. Se verifica cada hallazgo, se ejecuta la suite y se busca el
fallo que abre la correccion, y solo se abre un hallazgo nuevo si es CRITICO
o lo introduce la propia correccion; no se vuelve a revisar la rama entera.
Un merge de la base entre rondas no la cambia: se nombra en el motivo y lo
que entra va en el diff. Es **completa** (`- Alcance: completa`, con su
motivo) solo si: se pide `taskctl review TASK-NNN --completa` (desde la rama
base); algun informe no tiene tabla legible, sigue siendo la plantilla, trae
una severidad fuera del vocabulario o pide cambios sin anotar ningun
hallazgo; o no hay commit revisado fiable (el diff va desde la base). Tras
una acotada, una ronda completa revisa desde la rama base.

**Entre una ronda y otra se corrige todo**: los CRITICO e IMPORTANTE
siempre; el MENOR que no compense se marca `aceptado` con su motivo o pasa a
una tarea nueva. `taskctl review` avisa si se abre una ronda con hallazgos
de la anterior sin marcar `corregido` ni `aceptado`.

**Tope de rondas.** Tras la ronda 3 con cambios, `siguiente` pregunta en
cualquier modo, y `taskctl review` no abre la ronda 4 sin `--ronda-extra`,
que solo se pasa cuando lo decide una persona. Las salidas: aceptar lo
abierto (IDs y motivo en el `## Resultado`) y cerrar, pasarlo a una tarea
nueva, o corregir y abrir otra ronda.

## El informe

`taskctl review` deja el esqueleto del informe en la carpeta de revision de
la tarea, numerado por ronda. Se escribe sobre ese fichero, sin borrar la
peticion, y **respetando su cabecera**: el titulo tal cual, la linea
`- Commit revisado:` con el sha, la linea `- Revisor:` con el nombre de la
skill revisora, y la linea `- Veredicto:`, que se **sustituye** en su sitio —
nunca se borra de la cabecera ni se repite mas abajo. La cabecera de cada
revisor, con su nombre, esta en su skill.

Cada hallazgo, bajo `## Hallazgos`, con esta plantilla:

```markdown
### CRITICO-1 — <titulo corto>
- Donde: <fichero:linea>
- Que pasa: <comportamiento observado, en una o dos frases>
- Reproduccion: <los pasos exactos que se ejecutaron, y su salida>
- Impacto: <la consecuencia concreta para quien use esto>
- Sugerencia: <la direccion de la correccion, no el parche>

### IMPORTANTE-1 — <titulo corto>
<mismos campos>

### MENOR-1 — <titulo corto>
<mismos campos, mas si se propone no corregirlo y por que>
```

Si no hay nada que reportar, la seccion de hallazgos dice **"sin hallazgos"**
de forma explicita, y se anade que se ejecuto para llegar a esa conclusion:
que comandos, que suite, que mutaciones. Un "sin hallazgos" sin esa lista no
se distingue de no haber mirado.

El matiz va en el **cuerpo** del informe, con la tabla de hallazgos de la
plantilla (`ID | Severidad | Estado | Fichero | Origen`), no en la linea del
veredicto.

La columna `Origen` se rellena **en cada hallazgo**, con una de tres
palabras, para poder medir de donde vienen los fallos:

- `implementacion`: el codigo no hace lo que el plan pedia.
- `plan`: el plan era ambiguo o equivocado, y el codigo lo siguio.
- `especificacion`: el fallo esta en el enunciado de la tarea o en sus
  criterios de aceptacion.

Si dudas entre dos, la que habria evitado el fallo antes. Una celda vacia o
con otra palabra cuenta como sin clasificar.

## La linea del veredicto

`finish` decide si la tarea puede cerrarse leyendo el informe de mayor N, y lo
hace **fail-closed** a proposito: una version anterior buscaba la palabra
"aprobada" en cualquier parte y aprobaba literalmente "no aprobada".

**Escribirla con el comando, no a mano:**
`taskctl veredicto TASK-NNN aprobada | aprobada-con-correcciones | cambios-solicitados`
deja una unica linea canonica en lugar de todas las que hubiera (porque *todas*
tienen que aprobar) y la commitea. En una ronda fragmentada por dominio, cada
revisor firma la suya con `--informe <nombre>`.

Las reglas, si se escribe a mano: cuenta la linea que, sin espacios delante y
en minusculas, empieza por `- veredicto:`. Su valor, sin el enfasis de
markdown (asteriscos, guiones bajos, comillas invertidas) y en minusculas,
tiene que **empezar** por la palabra `aprobada`, y no puede contener la
palabra `pendiente` ni la cadena `cambios-solicitados`. Si el informe tiene
varias lineas de veredicto, **todas** tienen que aprobar — por eso se
**sustituye** la linea de la plantilla, no se anade otra debajo.

Criterio para elegirlo, y no es negociable: **CRITICO o IMPORTANTE sin
corregir implica `cambios-solicitados`**. Con solo hallazgos MENOR se puede
aprobar, siempre que queden documentados con su motivo.

Lo que acepta el gate, y por que:

| Linea escrita | Resultado |
|---|---|
| `- Veredicto: aprobada` | aprueba |
| `- Veredicto: aprobada-con-correcciones` | aprueba: es la que escribe `taskctl veredicto` |
| `- Veredicto: aprobada con correcciones menores` | aprueba: el valor empieza por `aprobada` |
| `- Veredicto: **aprobada**` | aprueba: el enfasis de markdown se ignora |
| `- Veredicto: **APROBADA**` | aprueba: el enfasis y las mayusculas se ignoran |
| `- Veredicto: aprobado` | no aprueba: `aprobado` no es `aprobada` |
| `- Veredicto: **APROBADO**` | no aprueba: `aprobado` no es `aprobada` |
| `- Veredicto: APROBADO CON CAMBIOS` | no aprueba: `aprobado` no es `aprobada` |
| `- Veredicto: cambios-solicitados` | no aprueba, y es lo correcto si hay CRITICO o IMPORTANTE |
| `- Veredicto: rechazada` | no aprueba |
| `- Veredicto: no aprobada` | no aprueba: el valor no *empieza* por `aprobada` |
| `- Veredicto: PENDIENTE (rellenar)` | no aprueba: es la plantilla sin sustituir |
| `Veredicto: aprobada` (sin el guion) | no aprueba: no cuenta como linea de veredicto |
| (sin ninguna linea de veredicto) | no aprueba |

Un revisor que escriba el veredicto en su propio vocabulario bloquea el cierre
y obliga a un commit de normalizacion que no arregla nada.

## Lo que un revisor no hace

- **No implementa la correccion.** Escribe el caso que falla y donde, y
  propone el arreglo en el informe; lo aplica quien implemento la tarea.
- **No reescribe el codigo ajeno** ni "aprovecha para" refactorizar,
  renombrar o reordenar, ni commitea codigo en la rama revisada. Los unicos
  ficheros que toca son los suyos temporales y el informe; el unico commit que
  le corresponde es el de su veredicto, que hace `taskctl veredicto`. Un
  revisor que edita deja de ser independiente, y la siguiente ronda ya no tiene a nadie que la revise.
- **No redisena la tarea.** Si la implementacion contradice al diseno, se
  documenta la divergencia; cambiarlo es una decision de la persona
  responsable.
- **No aprueba por simpatia.** Si hay un CRITICO o un IMPORTANTE sin
  corregir, el veredicto es `cambios-solicitados`, aunque el resto del diff
  este impecable, aunque "casi todo este bien", aunque la tarea vaya con prisa
  o por la tercera ronda, y aunque el hallazgo obligue a repetir trabajo.
- **No inventa hallazgos** para que el informe no salga vacio ni para
  justificar el pase.
- **No convierte preferencias de estilo en bloqueos.** Si no puedes nombrar el
  fallo que produce, es MENOR.
- **No sustituye a la puerta determinista** (build, linter, tests). Si esa
  puerta esta en rojo, no hay nada que revisar todavia.
- **No mueve la tarea de estado ni mergea.** Eso es trabajo de
  `taskctl finish`, y solo ocurre si el veredicto aprueba.
- **No revisa el repositorio entero**: revisa el diff que le llega. Si de
  verdad necesita mas contexto, lo pide para un hallazgo concreto.
- **Un revisor de dominio no revisa ficheros fuera de sus patrones**: si al
  leer el diff aparece algo de otro dominio que preocupa, se anota en una
  linea y se deja para su revisor, no se juzga alli.
