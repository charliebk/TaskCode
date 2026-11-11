# Peticion al unificador — TASK-108 (ronda 1)

- Tarea: TASK-108 — Verificacion proporcional B5: el guardian de merges ante el nivel 2
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
  - dependencias: 1 dependencias (TASK-106) (+1)
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

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
Quinta parte de TASK-096. Decision de Carlos (D1, 2026-11-11): el guardian de merges NO acepta el verde de la selectiva para codigo; con codigo exige la completa aunque finish haya integrado con la selectiva (lado seguro: los CRITICOS de TASK-101 salieron del punto debil de comandoSoloIntegra). Se fija con tests y se mejora el mensaje cuando un merge a mano queda bloqueado (por ejemplo, tras un conflicto en un finish de nivel 2, o porque develop avanzo y la huella ya no casa). Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).
````

### Criterios de aceptacion

````
Con rutas_verificacion_parcial declarada: el guardian deja pasar el merge de una tarea sin codigo con el verde de su verificacion de documentacion y bloquea el de una con codigo sin verde de la completa aunque exista el memo de la selectiva (un test por caso, repo temporal)
El guardian decide con la config del destino, no con la del arbol (test)
El mensaje de bloqueo de un merge con codigo dice que hace falta la completa y como obtenerla (test sobre el texto)
Sin la clave nueva el guardian se comporta como en la 0.14.0 (test de regresion)
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
