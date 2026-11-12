# Peticion al unificador — TASK-122 (ronda 1)

- Tarea: TASK-122 — Coste por tarea independiente del tamano del proyecto
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-12
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - criterios_aceptacion: 6 criterios (umbral: 5) (+1)

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
Problema que plantea Carlos (2026-11-12): si cada tarea paga algo que crece con el tamano del proyecto, el coste de las tareas crece sin limite; con n tareas, la tarea n cuesta del orden de n y el proyecto del orden de n al cuadrado, hasta que una tarea pequena cuesta tanto como el proyecto. En TaskCode la suite paso de 893 a 2289 tests en cinco semanas (de ~11 a ~25 min) y una tarea de una linea paga los 25; en ToolsaWeb cada finish paga 28 min de verificacion completa. Regla buscada: cada paso de una tarea cuesta en proporcion a lo que cambia la tarea, nunca al tamano del proyecto; lo que dependa del tamano del proyecto se paga una vez por version. Hay que descubrir exactamente que pasos poner o quitar para que el crecimiento del proyecto no afecte a la agilidad, sin perder la calidad que dan los tests (los de repos reales cazaron los CRITICOS de TASK-100 a TASK-108). Primera de la cola urgente para la 0.16.0, antes de TASK-121; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Datos de partida: docs/auditoria/AUDITORIA-METODO-2026-11-12.md y PASOS-PLUGIN-2026-11-12.md.
````

### Criterios de aceptacion

````
Un informe en docs/auditoria mide cada paso de una tarea (diseno, implementacion, verificacion, cada ronda de revision, cierre y contexto que leen los agentes) frente al tamano del proyecto (tests, ficheros, tareas cerradas) con datos de TaskCode, ToolsaWeb y OpenDockTrading, y marca cuales crecen con el proyecto (tabla con la tendencia de cada paso)
Cada paso que crece con el proyecto queda con su arreglo decidido con Carlos en el plan: pasa a depender solo de lo que cambia la tarea, se mueve a una vez por version, o se justifica por escrito
La verificacion de una tarea corre solo los tests de lo que cambia y la suite completa se corre una vez por version antes de publicar: en TaskCode, una tarea que toca un solo modulo verifica en menos de 2 min con mas de 2000 tests en la suite (medido)
Un listado reproducible da por fichero de test su duracion y cuantos procesos git lanza, y los 10 mas lentos quedan clasificados en necesita Git real o se puede probar sin Git; la regla de la piramide (logica sin Git, Git real solo en la capa de integracion) queda en docs/contexto/CONVENCIONES.md
taskctl metricas muestra el coste fijo por tarea (verificacion, revision y cierre) frente al numero de tareas cerradas del proyecto, para ver si crece (test con repo temporal)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
