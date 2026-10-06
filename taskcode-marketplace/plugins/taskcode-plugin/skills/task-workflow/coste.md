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

## Como se registra

Al terminar cada subagente de la fase (diseno = la ronda de roles y el
unificador; implementacion = los agentes del curso de la tarea; revision =
revisores y segunda opinion), con su id:

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
- **implementacion**: al terminar de implementar, antes de pedir la revision.
- **revision**: cuando terminan los revisores de la ronda; si hay varias
  rondas, se va sumando. Funciona tambien con la tarea ya `terminada`.

Escribe y commitea solo el `tarea.md` de la tarea: con ese fichero a medias
en el arbol aborta, y desde la rama base aborta si la tarea vive en su rama
(dice a cual cambiar). Con una cadena abierta exige `--cadena <testigo>`.

`taskctl finish` avisa, sin bloquear, si falta el coste de diseno o de
revision. `taskctl metricas --tokens` lo tabula por tarea, por sprint y por
complejidad; con `--escribir` regenera un bloque delimitado del fichero de
metricas del proyecto, sin tocar el resto.
