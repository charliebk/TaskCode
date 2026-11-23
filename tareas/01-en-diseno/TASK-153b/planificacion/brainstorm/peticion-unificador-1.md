# Peticion al unificador — TASK-153b (ronda 1)

- Tarea: TASK-153b — candidatos 4D en la peticion de revision (parte b de TASK-153)
- Tipo: feature · Complejidad declarada: alta
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
  - dependencias: 1 dependencias (TASK-153a) (+1)

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
Parte b del troceo de TASK-153 (Regla 4D en la creacion de codigo y tests), partes TASK-153a, TASK-153b, TASK-153c en la rama feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test.

El CLI genera desde el diff una seccion con los posibles duplicados y los tests a mutar.
````

### Criterios de aceptacion

````
La peticion de revision trae una seccion de candidatos 4D generada desde el diff: por cada funcion o constante nueva, las existentes con nombre igual o parecido en el repo, con test contra un repo temporal real
La misma seccion lista los tests nuevos cuyo nombre promete algo comprobable; con diff sin candidatos lo dice en una linea; las revisoras y revision.md piden mutar esos tests
````
