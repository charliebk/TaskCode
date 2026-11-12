# Peticion al unificador — TASK-121 (ronda 1)

- Tarea: TASK-121 — Troceo de tareas de mas de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-12
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - criterios_aceptacion: 6 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan 2 roles.

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
Por que importa (Carlos, 2026-11-12): trocear ha dado problemas en otros proyectos y ha complicado el repo. Evidencia en los repos: en TaskCode, TASK-096 se partio en 10 tareas con rama, diseno, revision y cierre propios (TASK-100 a TASK-109; unas 25 h y unos 230 M tokens); en ToolsaWeb hay 83 tareas que citan una particion, con tandas de numeros dispersos como TASK-307 a TASK-320 aun planificadas; en OpenDockTrading, 16. El plan debe partir de esos casos reales (ramas, carpetas, ROADMAP e IDs que quedaron) y no solo del enunciado.

Hoy la regla de una hora para el flujo cuando el plan estima mas de 60 min, y trocear crea tareas nuevas con su propia rama, diseno y cierre. Decision de Carlos (2026-11-12): trocear es condicional y solo una persona puede aceptarlo; si lo acepta, las partes se numeran con el mismo numero seguido de letras (TASK-NNNa, TASK-NNNb...), se trabajan sin salir de la rama de la tarea, se crean primero en 00-planificadas y se actualiza el ROADMAP antes de empezar TASK-NNNa, que es la tarea iniciada como principal. Como y cuando se integra en develop (al cerrar cada parte o al cerrar la ultima) lo decide el plan con la persona. Urgente para la version 0.16.0: lo mas rapido posible; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Con un plan de mas de 60 min, taskctl siguiente devuelve accion preguntar con dos salidas, trocear o aprobar entera, y en ningun modo (tampoco automatico) se trocea sin la respuesta de una persona (test con repo temporal)
Si la persona acepta, la tarea pasa a TASK-NNNa y se crean TASK-NNNb, TASK-NNNc... en 00-planificadas con el objetivo y los criterios de cada parte del plan, y tareas/ROADMAP.md se regenera antes de empezar TASK-NNNa (test)
Las partes comparten la rama de la tarea: start de TASK-NNNa la abre y las partes siguientes trabajan en ella sin crear otra (test)
Los IDs con letra funcionan en todo el CLI (new, plan, approve, start, review, finish, siguiente, board, metricas, roadmap) y no chocan con la numeracion siguiente (test)
Si la persona rechaza el troceo, la tarea sigue entera con el motivo escrito en el plan, como hoy (test de regresion)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
