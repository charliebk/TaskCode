# Peticion al unificador — TASK-143b (ronda 1)

- Tarea: TASK-143b — argumentos, diagnose y push-back (parte b de TASK-143)
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-24
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-143a) (+1)

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
Parte b del troceo de TASK-143 (Regla 4D: duplicacion en Git-Flow (bash y TS)), partes TASK-143a, TASK-143b, TASK-143c en la rama fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y.

parse_gitflow_args y normalize_branch_name en los 13 scripts, diagnose-repo con detect_origin_available y develop configurable, y push-back-to-remote sin referencias ocultas.
````

### Criterios de aceptacion

````
La lectura de argumentos y assert_valid_branch_name vienen de un helper comun en los 13 scripts; diagnose-repo usa detect_origin_available
push-back-to-remote ensena en la vista previa todo lo que sube y el nombre del backup sale de una sola variable
````
