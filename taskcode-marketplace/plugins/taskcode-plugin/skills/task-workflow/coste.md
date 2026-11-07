# Registrar el coste en tokens de cada fase

`taskctl` no llama a ningun modelo y no ve lo que gasta el agente que lo
orquesta: el coste lo registra quien lo ve, la sesion del agente, al terminar
cada fase en la que hubo agentes.

## Que cifra vale

**La cifra que Claude Code muestra al terminar un subagente NO es lo que ha
gastado**: es el tamano de su contexto final. Lo gastado es la suma del uso de
todas las llamadas que hizo, y esa suma la calcula `taskctl` leyendo la
transcripcion del subagente. Por eso no se apunta la cifra de la notificacion:
se apunta el **id del agente** (`agentId`, hexadecimal), que devuelve la
herramienta Agent al lanzarlo.

## Implementacion: se registra sola

Mientras la tarea esta en curso, un hook del plugin anota al terminar cada
turno (`Stop`) y cada subagente (`SubagentStop`) que transcripcion trabajo en
la rama de la tarea. Solo anota rutas, en un fichero bajo `.git/`
(`coste-pendiente.jsonl`): no lee nada pesado, no toca `tarea.md`, no ensucia
el arbol y nunca bloquea. Sin una tarea en curso en la rama actual sale sin
hacer nada.

`taskctl review` suma ese coste en su propio commit: `tokens_implementacion`
y una fila de `## Coste` por fuente (`sesion:<id>` para el hilo principal,
`agente:<id>` para cada subagente). Cuenta solo lo que paso con la tarea en
curso: las llamadas cuyo instante cae entre el `start` y el `review` de
`## Transiciones`, en la rama de la tarea y dentro del repo. El diseno, otras
tareas de la misma sesion y la revision no entran. Si `review` no pudo,
`taskctl finish` lo intenta otra vez; lo ya sumado no se suma dos veces.

Lo que ya estuviera anotado a mano para el mismo id se descuenta: de un agente
registrado en implementacion solo se suma lo que haya crecido (`dif:`), y uno
registrado en otra fase, o junto a otros agentes en una misma fila, no se
toca. Por eso **en implementacion no hace falta `registrar-coste`**. Queda como
respaldo: el fichero de `.git/` no viaja con el repo, asi que una tarea
trabajada desde otro clon, o una sesion sin el hook, se registra a mano como
antes. Cuando todo el ciclo cabe en un solo turno, `review` encuentra la sesion
que lo ejecuta por `CLAUDE_CODE_SESSION_ID` si Claude Code la define.

`COSTE_AUTOMATICO=0` en el entorno apaga el hook y el volcado.

## Como se registra a mano

Al terminar cada subagente de la fase (diseno = la ronda de roles y el
unificador; revision = revisores y segunda opinion; implementacion, solo como
respaldo del registro automatico), con su id:

```bash
taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision --agente <id>
taskctl registrar-coste TASK-NNN --fase revision --agente <id1> --agente <id2>   # varios, un solo registro
```

La parte del propio orquestador (lo que leiste, escribiste y razonaste fuera
de los subagentes) no tiene transcripcion que leer: si quieres registrarla,
estimala y dala aparte, en otra llamada (`--agente` y `--tokens` no se
combinan):

```bash
taskctl registrar-coste TASK-NNN --fase diseno --tokens N
```

Todo **suma** sobre lo que ya hubiera. `N` es un entero positivo (tokens
procesados: entrada, cache y salida, sin separadores); `0` se rechaza: si la
fase no tuvo agentes, no registres nada y queda «sin dato», que no es lo mismo
que cero.

Las transcripciones se buscan en `projects/*/*/subagents/agent-<id>.jsonl`
bajo el directorio de configuracion de Claude Code (`CLAUDE_CONFIG_DIR` si
esta definida, si no la carpeta `.claude` del usuario). Si el comando no encuentra el id, lo
encuentra en mas de una sesion o la transcripcion no tiene el formato esperado,
dice que hacer: la salida de emergencia es `--tokens N` con tu estimacion, y
dilo como estimacion en el `## Resultado`.

## Cuando

- **diseno**: al terminar la ronda de diseno, antes de `taskctl approve`.
- **implementacion**: lo suma `taskctl review` (ver arriba). A mano, solo si
  el registro automatico no pudo: al terminar de implementar, antes de pedir
  la revision.
- **revision**: cuando terminan los revisores de la ronda; si hay varias
  rondas, se va sumando. Funciona tambien con la tarea ya `terminada`.

Escribe y commitea solo el `tarea.md` de la tarea: con ese fichero a medias
en el arbol aborta, y desde la rama base aborta si la tarea vive en su rama
(dice a cual cambiar). Con una cadena abierta exige `--cadena <testigo>`.

Cada llamada deja ademas una fila en la tabla `## Coste` del cuerpo de
`tarea.md` (en el mismo commit que el total): con `--agente`, el desglose
sumado de sus agentes (entrada, escritura y lectura de cache, salida, y
cuantas lecturas de ficheros hicieron); con `--tokens N`, una fila `manual`
con solo el total. No la edites a mano: el total de la fase sigue siendo el
campo `tokens_<fase>`, y la tabla es su desglose.

En la fase **revision**, una llamada con varios `--agente` deja **una fila por
agente** (en un solo commit), no una fila sumada: cada fila lleva la `ronda` y
el `revisor` del agente, que se deducen de su transcripcion (el nombre
`peticion-revision-N[-skill].md` que lleva el prompt con el que lo lanzaste;
sin sufijo si la ronda no se fragmento). Lo que no se pueda deducir queda `-`,
«sin atribuir». Asi se ve cuantas lecturas hizo cada revisor en cada ronda.
Si una transcripcion no nombra su peticion, puedes declararlo con
`--ronda N [--revisor <skill>]`, solo con un unico `--agente`: el revisor tiene
que ser uno de los sufijos de los `peticion-revision-N-*.md` de la carpeta
`revision/` de la tarea (texto libre da error).

Un agente que se **reanuda** (el mismo id, otra vez con la herramienta Agent)
acumula en su transcripcion los dos trabajos. Por eso, si el `--agente` ya esta
anotado en `## Coste` de esa fase, `registrar-coste` suma solo lo que crecio la
transcripcion desde lo ya anotado para ese id, y la fila lo marca en su fuente
(`agente:dif:<id>`): registra cada tramo de trabajo al terminarlo, sin miedo a
contarlo doble. Si la transcripcion no ha crecido, aborta (no hay nada nuevo);
si el id esta anotado junto a otros en una misma fila, aborta y pide la cifra
con `--tokens N`. Una fila repetida de verdad (dos filas sin `dif:` del mismo
agente en una fase, de antes o editadas a mano) la avisa `taskctl metricas`
(igual que si lo desglosado supera a `tokens_<fase>`); si fue un error, corrige
el total y quita la fila sobrante.

`taskctl finish` avisa, sin bloquear, si falta el coste de diseno, de
implementacion (vacio o a 0) o de revision. `taskctl metricas --tokens` lo tabula por tarea, por sprint y por
complejidad; con `--escribir` regenera un bloque delimitado del fichero de
metricas del proyecto, sin tocar el resto.
