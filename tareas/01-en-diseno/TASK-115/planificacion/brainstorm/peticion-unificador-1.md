# Peticion al unificador — TASK-115 (ronda 1)

- Tarea: TASK-115 — P-7: verificacion completa por lote de cierres en modo automatico
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-13
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
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)
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
En ToolsaWeb cada finish corre la verificacion completa (28 min de mediana) aunque se cierren varias tareas seguidas en automatico. Una completa por lote, con vuelta atras si sale en rojo, cuesta 28 min por lote en vez de por tarea. Relaja cada integracion en verde: la forma concreta la decide Carlos en el plan. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-7)
````

### Criterios de aceptacion

````
Con la clave verificacion_por_lote activada, finish de una tarea con codigo integra sin la completa y anota la verificacion como pendiente de lote (test en repo temporal)
Un comando de taskctl corre una completa sobre la rama de integracion y la anota en todas las tareas pendientes de ese lote (test)
Si la completa del lote sale en rojo, el comando dice que tareas entraron desde la ultima completa en verde (test)
Sin la clave, finish y el guardian de merges se comportan como hoy (test de regresion)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
