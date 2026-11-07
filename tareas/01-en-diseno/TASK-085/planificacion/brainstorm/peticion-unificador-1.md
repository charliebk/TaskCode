# Peticion al unificador — TASK-085 (ronda 1)

- Tarea: TASK-085 — Coste de implementacion registrado automaticamente
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-07
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)

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
En ToolsaWeb falta el coste de implementacion en 97 de 119 tareas, asi que el coste total esta infravalorado. Registrarlo sin depender de que alguien ejecute registrar-coste.
````

### Criterios de aceptacion

````
Un hook registra los tokens de implementacion de la tarea en curso de la rama actual al terminar cada turno o subagente, sin duplicar lo ya registrado
Sin tarea en curso en la rama el hook sale sin hacer nada y sin lanzar procesos pesados
taskctl metricas deja de listar como sin coste de implementacion las tareas registradas asi; lo cubren tests con repos Git temporales
npm test en verde (salvo los tres rojos conocidos de Windows)
````
