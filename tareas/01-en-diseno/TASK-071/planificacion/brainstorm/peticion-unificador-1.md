# Peticion al unificador — TASK-071 (ronda 1)

- Tarea: TASK-071 — Hook Stop: una tarea no se da por hecha con la verificacion en rojo
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (3 puntos): **simple**
- Senales encontradas:
  - dependencias: 2 dependencias (TASK-069, TASK-070) (+2)
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 2 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Freno 12 de brakes: si hay una tarea en curso, el agente no puede terminar su turno mientras comando_verificacion falle.
````

### Criterios de aceptacion

````
hooks/hooks.json del plugin declara un Stop hook en Node sin dependencias de runtime
El hook solo actua si existe una tarea en 02-en-curso/ en la rama actual y comando_verificacion esta definido; en cualquier otro caso sale 0 sin coste
Con la verificacion en rojo devuelve exit 2 y por stderr el comando, el codigo de salida, la duracion y la cola de la salida, acotada en tamano
Respeta stop_hook_active para no entrar en bucle y respeta timeout_verificacion
Tests contra un repo temporal real: verde deja parar, rojo bloquea, sin tarea no hace nada, timeout
````
