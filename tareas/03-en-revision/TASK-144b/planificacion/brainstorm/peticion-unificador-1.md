# Peticion al unificador — TASK-144b (ronda 1)

- Tarea: TASK-144b — flags con y sin valor (parte b de TASK-144)
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-23
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
  - dependencias: 1 dependencias (TASK-144a) (+1)

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
Parte b del troceo de TASK-144 (Regla 4D: ciclo de vida, cadena y flags en commands), partes TASK-144a, TASK-144b, TASK-144c en la rama fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en.

Todos los flags con valor se leen con el mismo lector y todos los booleanos estan en FLAGS_SIN_VALOR (CMD1-09, CMD2-05, CMD2-14, FS-01).
````

### Criterios de aceptacion

````
veredicto, verificar-menores, approve, cadena, finish-opciones, doctor-deploy y new leen sus flags con valor con un helper basado en extraerRepetible: --flag=valor y --flag valor dan lo mismo en todos, con test
Un test de paridad falla si un comando lee un booleano por token que no esta en FLAGS_SIN_VALOR; review --completa=1 aborta en vez de ignorarse
verificar-lote: sin «taskctl taskctl», admite -p y su autoCommit lleva fase
````
