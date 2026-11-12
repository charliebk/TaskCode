# Peticion al unificador — TASK-110 (ronda 1)

- Tarea: TASK-110 — Progreso visible sin tokens: estado de cada fase en el terminal
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-12
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - criterios_aceptacion: 8 criterios (umbral: 5) (+1)

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
Mientras taskctl y sus hooks trabajan (la verificacion de finish, unos 28 min en ToolsaWeb; el freno Stop; las rondas de revision; la suite de 25 min) la persona no ve en que paso van y pregunta al agente cada pocos minutos, lo que gasta tokens. taskctl escribe el estado de la tarea en curso (fase, paso, x/N, tiempo) y la persona lo ve sin pasar por el agente.
````

### Criterios de aceptacion

````
plan, approve, start, review, finish y el freno Stop escriben en .git/taskcode/progreso.json la tarea, la fase, el paso, x/N si lo hay y el instante de inicio, y lo marcan como terminado al acabar (un test con repo temporal por comando)
taskctl estado imprime TASK-NNN · <fase> · <paso> x/N · <mm> min leyendo solo ese fichero, sin lanzar git y en menos de 200 ms (test)
taskctl estado --seguir refresca cada segundo hasta que la fase termina (test con un fichero que cambia)
El comando de verificacion recibe TASKCTL_PROGRESO con la ruta de un fichero; si escribe x/N en el, taskctl estado lo muestra (test con un script que lo escribe)
taskctl doctor ofrece instalar una status line de Claude Code que muestra taskctl estado, y solo la instala con un flag explicito (test sobre un settings.json temporal)
npm test de TaskCode muestra [x/N] mientras corre, con un reporter sin dependencias y el total de la ejecucion anterior (test del reporter)
Sin tarea en curso, taskctl estado dice que no hay nada en marcha y sale con 0 (test)
La suite completa pasa (npm test) sin debilitar ningun test
````
