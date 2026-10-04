# Peticion al unificador — TASK-055 (ronda 1)

- Tarea: TASK-055 — Flujo guiado por fases con modos manual, semiautomatico y automatico
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-10-04
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
  - criterios_aceptacion: 12 criterios (umbral: 5) (+1)

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
Hoy el plugin solo trae el CLI, la skill y los agentes: no hay comandos de fase ni hooks, ninguna fase avanza sola ni pregunta, y fuera de Claude Code taskctl ni siquiera arranca en PowerShell. El objetivo es que el plugin conduzca el ciclo plan, approve, start, review y finish dentro de Claude Code, con un comando por fase para reanudar en cualquier sesion y un modo de flujo configurable: manual (la persona lanza cada comando), semiautomatico (al cerrar cada fase pregunta si seguir; un no deja la tarea en su estado) y automatico (todas las preguntas se hacen en plan y el resto corre sin preguntar hasta finish). En los tres modos se conservan las garantias: revision independiente, mejor skill, segunda opinion, ramas que no se pisan y un historico en Git de todo lo planificado y ejecutado.
````

### Criterios de aceptacion

````
taskctl arranca desde PowerShell y cmd en Windows (bin/taskctl.cmd) y el README explica como usarlo fuera de Claude Code
El plugin trae un comando por fase (/taskcode:plan, approve, start, review, finish, mas new y board) que ejecuta el taskctl de esa fase y el trabajo de agentes que le toca
Clave modo_flujo en .taskcode/config.yml con valores manual, semiautomatico y automatico; sin clave vale manual y un valor invalido aborta con la lista de validos
Comando determinista taskctl siguiente TASK-NNN que, segun estado y modo, devuelve la siguiente fase y si hay que preguntar, con tests por cada combinacion
En modo manual cada comando hace su fase y termina nombrando el comando de la siguiente, sin encadenar nada
En modo semiautomatico, al cerrar plan, approve, start y review se pregunta si seguir; un no deja la tarea en su estado y dice que comando la reanuda
En modo automatico, cerrado el plan con sus preguntas, approve, start, implementacion, review y finish se encadenan sin preguntar; la aprobacion queda registrada como automatica
review se lanza sola cuando la implementacion esta commiteada y la suite pasa, y finish se lanza sola cuando el informe aprueba; ambas se pueden forzar por comando
Ningun modo se salta las guardas: limite WIP, rama base limpia, revisor independiente, veredicto fail-closed y segunda opinion cuando revision_codex es true
Cada transicion, manual o automatica, deja un registro en tarea.md con fecha, fase, modo y quien decidio, commiteado en Git
La skill task-workflow describe los tres modos y los comandos de fase, sin mencionar rutas ni documentos internos de este repo
Test de punta a punta en repo temporal: un ciclo en modo automatico y otro en semiautomatico con un no en approve que deja la tarea en diseno
````
