# Peticion al unificador — TASK-073 (ronda 1)

- Tarea: TASK-073 — Tests held-out por tarea
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-04
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
  - dependencias: 2 dependencias (TASK-070, TASK-072) (+2)
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
Freno 7 de brakes: tests de aceptacion que la persona escribe a partir de los criterios y que el agente implementador no puede leer ni editar.
````

### Criterios de aceptacion

````
Carpeta aceptacion/ dentro de la carpeta de la tarea, y clave comando_heldout opcional en config.yml
El plugin declara reglas deny de Read y Edit sobre las carpetas aceptacion/ para el agente implementador
taskctl finish ejecuta los held-out de la tarea y aborta si fallan
La skill de flujo explica cuando escribirlos y el agente revisor si puede leerlos
Tests: deny efectivo, finish rojo y verde
````
