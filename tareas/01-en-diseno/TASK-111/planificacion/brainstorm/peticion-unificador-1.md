# Peticion al unificador — TASK-111 (ronda 1)

- Tarea: TASK-111 — P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)
  - dependencias: 1 dependencias (TASK-120) (+1)
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan 2 roles.

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
El freno Stop corre la verificacion al final de cada turno con tarea en curso (selectiva de 4,2 min en ToolsaWeb) y no queda registro de cuantas veces corre ni de su coste. Que cada ejecucion quede registrada, que metricas la sume y que no corra si el arbol no cambio desde el ultimo verde. Toca freno-stop.ts como TASK-110: va despues de ella. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-3)
````

### Criterios de aceptacion

````
Cada ejecucion del freno Stop anade una linea con instante, modo, duracion y resultado a un registro bajo .git/taskcode/ (test con repo temporal)
taskctl metricas muestra por tarea cuantas veces corrio el freno y su tiempo total, con — sin dato (test)
Si la huella del arbol no cambio desde el ultimo verde, el freno no ejecuta la verificacion y no anade salida (test)
La linea del freno usa el formato comun de registro de TASK-120 con puerta freno, y el resultado distingue verde, rojo, omitido (sin cambios desde el ultimo verde) y excedido, este ultimo reservado para el presupuesto de TASK-125 (test)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
