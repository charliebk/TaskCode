# Peticion al unificador — TASK-104 (ronda 1)

- Tarea: TASK-104 — Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion
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
  - dependencias: 1 dependencias (TASK-102) (+1)
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
Segunda mitad de TASK-102 (troceada por la regla de una hora, decision de Carlos 2026-11-11). taskctl review usa la misma decision comun que el freno Stop (peticionDeTrabajo de TASK-102) sobre base...HEAD, nunca sobre el diff de la ronda: si solo cambia documentacion no corre la verificacion selectiva; con comando_verificacion_selectiva y comando de documentacion declarados corre el de documentacion; sin selectiva no corre nada (decision de Carlos: no aparece una ejecucion donde la 0.14.0 no la tenia). La comprobacion se ejecuta antes de escribir la peticion, con el mismo patron que verificacionSelectivaDeRonda. Plan de partida: tareas/01-en-diseno/TASK-102/planificacion/plan-final.md (paso 5).
````

### Criterios de aceptacion

````
Una ronda de review de solo documentacion con comando_verificacion_selectiva y comando de documentacion declarados corre el de documentacion y no la selectiva; sin selectiva declarada no corre nada (test por cada uno, repo temporal)
Un fichero de codigo en base...HEAD hace que review aplique la verificacion de siempre, tambien en una ronda incremental cuyo delta solo toca documentacion (test)
Stop y review dan la misma decision para el mismo diff (test)
Sin la configuracion nueva review se comporta exactamente como en la 0.14.0 (test de regresion)
verificacion-selectiva.md, README y CHANGELOG explican el comportamiento de Stop y review, como cambio de comportamiento para quien ya declaro rutas_documentacion
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
