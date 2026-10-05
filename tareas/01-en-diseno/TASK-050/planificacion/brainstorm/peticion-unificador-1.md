# Peticion al unificador — TASK-050 (ronda 1)

- Tarea: TASK-050 — F6-T1 Suite rapida y repo plantilla en los tests
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-05
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
La suite completa tarda unos 11 minutos y no hay forma de iterar mas rapido
(auditoria B3, B4, B7). Se anade `npm run test:rapido` con los tests de core
y cli que no lanzan procesos, se crea un helper que monta el repo Git base
una vez por fichero y lo copia con `fs.cp` en vez de repetir los `git init`
y commits de cada test, y se mide cuanto cuesta la cobertura para decidir si
va en un `test:cov` aparte.
````

### Criterios de aceptacion

````
`npm run test:rapido` (core y cli, sin procesos) en menos de 1 min; `npm test` sigue siendo la suite completa
Helper que crea el repo base una vez por fichero y lo copia con `fs.cp`, adoptado en los 5 ficheros mas lentos
Medicion con y sin `--experimental-test-coverage` anotada; si compensa, `test:cov` aparte
````
