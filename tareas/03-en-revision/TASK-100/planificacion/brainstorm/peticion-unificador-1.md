# Peticion al unificador — TASK-100 (ronda 1)

- Tarea: TASK-100 — Verificacion proporcional A: una tarea que solo cambia documentacion no corre la suite de tests
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
  - criterios_aceptacion: 7 criterios (umbral: 5) (+1)

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
Primera parte de TASK-096 (decision de Carlos, 2026-11-10: trocearla y empezar por la de mas valor y menos riesgo). Hoy finish, el freno Stop, las rondas de revision y el guardian de merges pagan la verificacion completa aunque la tarea solo cambie documentacion (ToolsaWeb: unos 28 min por finish, tambien en tareas de solo .md; la mayoria de las tareas recientes de ToolsaWeb y OpenDockTrading son documentos o estudios). Un proyecto declara que rutas son documentacion; si el diff de la tarea frente a la base solo toca esas rutas, no se corre la suite de tests, solo la comprobacion de documentacion si el proyecto la declara, y la salida dice que verificacion corrio y por que. Fail-closed: un diff mixto, una ruta no clasificada o un error al calcular el diff van a la verificacion de siempre. Opt-in: sin la configuracion nueva todo se comporta exactamente como en la 0.14.0. No se retira ningun freno. La verificacion de solo lo afectado en codigo parcial queda para TASK-096.
````

### Criterios de aceptacion

````
Con la configuracion nueva, en un repo temporal cuya tarea solo cambia rutas de documentacion, taskctl finish integra sin ejecutar comando_verificacion y su salida dice que verificacion corrio y por que; si el proyecto declara una comprobacion de documentacion, se ejecuta y su fallo bloquea igual que hoy (test de integracion por caso)
Un diff mixto (documentacion y codigo), con una ruta no clasificada o sin poder calcular el diff ejecuta la verificacion de siempre (un test por caso)
El freno Stop y taskctl review aplican la misma decision al mismo diff: un turno o una ronda de solo documentacion no corren la suite de tests (test por cada uno)
El guardian de merges aplica la misma decision que finish: no bloquea el merge de una tarea de solo documentacion sin verde de la completa y si bloquea el de una con codigo (un test por caso)
Un proyecto sin la configuracion nueva se comporta exactamente como en la 0.14.0 (tests de regresion de finish, Stop, review y guardian)
skills/task-workflow (verificacion-selectiva.md), README y CHANGELOG explican el principio y como declara un proyecto sus rutas de documentacion
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
````
