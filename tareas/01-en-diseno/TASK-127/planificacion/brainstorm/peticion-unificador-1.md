# Peticion al unificador — TASK-127 (ronda 1)

- Tarea: TASK-127 — Tope de rondas de revision configurable, 2 por defecto, y decision de una persona al llegar
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (5 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - dependencias: 1 dependencias (TASK-112) (+1)
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
Medido en ToolsaWeb (153 tareas terminadas, taskctl metricas, 2026-11-12): las rondas por tarea han pasado de 2,2 a 3,0 y TASK-280 y TASK-282 llegaron a 6; los hallazgos suman unos 1130 MENORES, unos 350 IMPORTANTES y 3 CRITICOS. El tope esta fijo en TOPE_RONDAS = 3 (src/core/flujo.ts) y --ronda-extra lo rebasa sin limite. Se busca un tope configurable, 2 por defecto, y que al llegar a el decida una persona: cerrar con lo que hay, autorizar una ronda mas o devolver la tarea a diseno. Complementa a TASK-099 (los MENORES no abren ronda) y a TASK-112 (rondas 2+ acotadas a los bloqueantes): va despues de TASK-112. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Una clave tope_rondas en .taskcode/config.yml (entero de 1 a 10, 2 por defecto) sustituye a la constante TOPE_RONDAS en review y en taskctl siguiente (test con repo temporal)
Al llegar al tope con hallazgos bloqueantes abiertos, taskctl siguiente devuelve accion preguntar con tres salidas (cerrar, una ronda mas, volver a diseno) en todos los modos, tambien automatico (test)
taskctl review --ronda-extra pasado el tope exige que conste la decision de la persona en tarea.md y cada ronda extra vuelve a preguntar (test)
Con tope_rondas: 3 el flujo se comporta como hoy (test de regresion)
Las skills review y task-workflow, el README y el CHANGELOG explican el tope y su valor por defecto
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
