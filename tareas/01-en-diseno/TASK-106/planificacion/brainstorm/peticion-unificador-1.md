# Peticion al unificador — TASK-106 (ronda 1)

- Tarea: TASK-106 — Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial
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
  - dependencias: 1 dependencias (TASK-105) (+1)
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
Tercera parte de TASK-096. Con la decision selectiva de TASK-105, puertaSoloDocumentacion pasa a puertaProporcional: si la decision es selectiva, finish corre comando_verificacion_selectiva (con RAMA_BASE y timeout_verificacion_selectiva, reutilizando el memo del Stop o de review si casa la huella) en vez de la completa, y lo dice en su salida con el motivo; lo anota en tarea.md en una seccion idempotente. Decisiones de Carlos: la puerta de cobertura queda omitida en el nivel 2 (se mide en la completa del release); release y hotfix siempre a la completa; el verde selectivo nunca escribe el memo de la completa. Se retira el texto aunque las rondas usaran la selectiva cuando aplica la clave. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).
````

### Criterios de aceptacion

````
En un repo temporal cuya tarea cambia codigo dentro de rutas_verificacion_parcial, finish ejecuta solo la selectiva (contadores: selectiva 1, completa 0), integra y lo dice en su salida; con codigo fuera de esas rutas ejecuta la completa (contadores al reves) y dice por que (un test por caso)
Con la selectiva en rojo no integra: develop no se mueve y la tarea sigue en revision (test)
El verde de la selectiva no escribe freno-verificacion.json; la puerta de cobertura queda omitida en el nivel 2; release y hotfix ejecutan la completa (un test por caso)
Una rama que cambia a la vez codigo y su propio clasificador (fuera de las rutas declaradas) va a la completa (test)
Un proyecto que ya declara comando_verificacion_selectiva pero no la clave nueva se comporta como en la 0.14.0: finish corre la completa (los tests TASK-091 siguen igual)
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
