# Peticion al unificador — TASK-072 (ronda 1)

- Tarea: TASK-072 — Puerta de verificacion en finish y merge guard
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
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-071) (+1)

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
Defensa en dos capas: finish no mergea con la verificacion en rojo, y un hook impide al agente saltarse finish con un git merge directo.
````

### Criterios de aceptacion

````
taskctl finish ejecuta comando_verificacion antes del merge y aborta con la salida si falla; flag explicito para saltarlo que queda registrado en la tarea
Hook PreToolUse sobre Bash que bloquea git merge y los scripts de cierre de Git-Flow hacia develop o main cuando la verificacion esta en rojo
El hook no bloquea comandos de solo lectura ni merges hacia ramas de trabajo
Tests de ambas capas contra repos temporales reales
````
