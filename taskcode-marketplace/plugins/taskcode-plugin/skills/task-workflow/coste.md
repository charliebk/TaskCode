# Registrar el coste en tokens de cada fase

`taskctl` no llama a ningun modelo y no ve lo que gasta el agente que lo
orquesta: el coste lo registra quien lo ve, la sesion del agente, al terminar
cada fase en la que hubo agentes.

## Que se suma

Por cada fase con agentes (diseno = `plan` y la ronda de roles y unificador;
implementacion = el curso de la tarea; revision = revisores y segunda opinion):

1. Cada subagente que lanzaste devuelve, al terminar, el uso de la llamada
   (total de tokens). Apunta la cifra de cada uno.
2. Estima la parte tuya, la del orquestador, en esa fase (lo que leiste,
   escribiste y razonaste fuera de los subagentes). Es una estimacion y esta
   bien que lo sea: dilo como tal en el `## Resultado`.
3. Registra cada cifra con el comando. Suma sobre lo que ya hubiera, asi que
   puedes dar una llamada por subagente o una sola con el total:

```bash
taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision --tokens N
```

`N` es un entero positivo (tokens procesados: entrada, cache y salida, sin
separadores). `0` se rechaza: si la fase no tuvo agentes, no registres nada y
queda «sin dato», que no es lo mismo que cero.

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
