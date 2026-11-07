# Peticion al unificador — TASK-081 (ronda 1)

- Tarea: TASK-081 — Revision mas barata: medir y acotar las lecturas de los revisores
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-07
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (3 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 3 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

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
Con la 0.8 los tokens de revision de una tarea media pasaron de 3.3 M a 6.8 M de mediana en ToolsaWeb mientras los KB por ronda de la peticion bajaban de 100 a 77: el exceso esta en lo que los revisores leen por su cuenta. Medir esas lecturas por revisor y ronda, acotarlas y usar un modelo mas barato en la ronda 2 cuando solo verifica correcciones.
````

### Criterios de aceptacion

````
taskctl metricas --tokens muestra por tarea las lecturas de cada revisor y ronda, sacadas de la transcripcion del subagente, y lo cubren tests con repos Git temporales
La peticion de revision declara una lista de ficheros de contexto permitidos y la skill revisora comun manda no leer fuera de ella salvo justificandolo en el informe
taskctl review en ronda 2 sugiere un modelo mas barato cuando la ronda 1 no dejo CRITICOS abiertos, y la sugerencia queda en la peticion
docs/METRICAS.md documenta las lecturas por revisor y el objetivo de volver a 3-4 M de tokens de revision en tareas medias
npm test en verde (salvo los tres rojos conocidos de Windows)
````
