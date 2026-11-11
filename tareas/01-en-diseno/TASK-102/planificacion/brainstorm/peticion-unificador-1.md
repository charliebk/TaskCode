# Peticion al unificador — TASK-102 (ronda 1)

- Tarea: TASK-102 — Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-11
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (3 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - dependencias: 1 dependencias (TASK-100) (+1)
  - criterios_aceptacion: 6 criterios (umbral: 5) (+1)

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
Tercera parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). El freno Stop (cada fin de turno) y taskctl review usan la decision unica de TASK-100 sobre el mismo diff: si solo cambia documentacion no corren la suite de tests, solo la comprobacion de documentacion si se declara. Clasifican tambien el arbol de trabajo (lo no commiteado y lo no trackeado): un .ts sin commitear hace que el turno no sea de solo documentacion. Solo documentacion se decide antes que la verificacion selectiva de TASK-091 y de forma identica en Stop y review. Sin la clave, ni se calcula el diff (cero coste en cada turno). Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A3).
````

### Criterios de aceptacion

````
Un turno o una ronda de solo documentacion no corren la suite de tests; con comando de documentacion declarado, corre ese (test por cada uno, repo temporal)
Un fichero de codigo sin commitear o sin seguimiento hace que Stop y review apliquen la verificacion de siempre (test por cada uno)
Con comando_verificacion_selectiva tambien declarado, solo documentacion se decide antes y Stop y review dan la misma decision para el mismo diff (test)
Sin la configuracion nueva Stop y review se comportan exactamente como en la 0.14.0 y no lanzan ningun proceso git nuevo (test de regresion)
verificacion-selectiva.md, README y CHANGELOG explican el comportamiento de Stop y review
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
