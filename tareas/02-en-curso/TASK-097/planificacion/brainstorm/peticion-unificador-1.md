# Peticion al unificador — TASK-097 (ronda 1)

- Tarea: TASK-097 — Regla de una hora: plan estima la duracion de punta a punta y propone trocear
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-10
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
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
Ley de agilidad (decision de Carlos, 2026-11-10): una tarea prevista de mas de 1 hora de punta a punta (de la rama abierta al cierre con merge) se parte en varias. Medido en 147 tareas: el mejor predictor de la duracion son los ficheros de codigo (correlacion 0,40; capas 0,28; criterios 0,23); con 1-10 ficheros de codigo la mitad cierra en una hora, con 11 o mas solo el 16 %. Se estima al planificar, el plan lo deja escrito, la persona decide en approve y finish mide el tiempo real para calibrar. Partir por capas solo si cada parte se verifica sola; si no, una porcion vertical pequena.
````

### Criterios de aceptacion

````
plan-final.md lleva la linea 'Duracion estimada: N min' con sus senales (ficheros de codigo previstos, capas, criterios); taskctl approve avisa si falta (test)
Si la estimacion supera 60 min, taskctl siguiente en la fase approve devuelve preguntar en cualquier modo y su motivo propone trocear; con 60 o menos, nada cambia (test por cada caso)
taskctl finish anota en tarea.md los minutos reales de punta a punta (de start a finish, sin pausas) junto a la estimacion, y taskctl metricas los muestra (test en un repo temporal)
skills/plan y skills/task-workflow explican la regla, las senales y como trocear (porcion vertical frente a capas); README y CHANGELOG la anotan
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
````
