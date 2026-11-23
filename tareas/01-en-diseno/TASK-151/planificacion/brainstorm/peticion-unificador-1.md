# Peticion al unificador — TASK-151 (ronda 1)

- Tarea: TASK-151 — Regla 4D: disfraz en tests
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-23
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

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
Que los tests sospechosos de disfraz de la auditoria 4D completa (docs/auditoria-4d-completa.md, casos TCMD-01 a TCMD-05, TCORE-01 a TCORE-03, TCORE-08, TCORE-09, TRES-06 a TRES-09 y TRES-12) fallen cuando se rompe lo que dicen probar. Ocho se confirmaron por mutacion.
````

### Criterios de aceptacion

````
Cada mutacion de la seccion Mutacion de docs/auditoria-4d-completa.md que quedo en verde pone ahora su test en rojo (board-format, state-machine, task-store-wip, git cmdQuoteWindows, doctor-deploy DIRS_EXCLUIDOS, review-incremental, salida-temprana, cli/estado)
Los tests que prometen sin efectos secundarios o workspace limpio lo comprueban con git status; los que prometen error claro miran el mensaje
doctor-correcciones no convierte un timeout ausente en skip; review-incremental corre en Linux; ultimaRonda se prueba con 10 rondas o mas
plugin-instalado, guardia-documentacion y fases comprueban un resultado esperado (cuenta-sel, indexOf distinto de -1)
````
