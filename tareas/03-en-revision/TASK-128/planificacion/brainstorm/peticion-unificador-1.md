# Peticion al unificador — TASK-128 (ronda 1)

- Tarea: TASK-128 — Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (6 puntos): **alta**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - dependencias: 2 dependencias (TASK-111, TASK-125) (+2)
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
Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min, el freno Stop hasta 26 min por turno en tareas del nucleo y la revision ya es el 59-65 % del tiempo de cada tarea, pero metricas no ve cuanto se va en cada puerta: solo hay memos de la ultima ejecucion. TASK-111 registra el freno y TASK-120 la sincronizacion; falta registrar las verificaciones de review y de finish con el mismo formato, sumarlas por tarea y contar las rondas abiertas solo por MENORES (en los tres proyectos, 71 rondas asi con 2 CRITICO/IMPORTANTE nuevos y 70,2 M tokens, docs/auditoria/PASOS-PLUGIN-2026-11-12.md). Usa el registro de TASK-111: va despues de ella y de TASK-125 (presupuesto del freno). Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Cada verificacion de ronda de review y cada verificacion de finish (completa, selectiva, documentacion, pesada) anade una linea con puerta, tarea, instante, modo, duracion y resultado al mismo registro bajo .git/taskcode/ que el freno de TASK-111 (test con repo temporal)
taskctl metricas muestra por tarea, para cada puerta (freno, review, finish), el numero de ejecuciones y el tiempo total, y una fila de totales; sin registro muestra — (test)
taskctl metricas cuenta por tarea las rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE, leyendo los informes de revision que ya existen (test con informes de ejemplo)
Con tareas cerradas antes de este cambio, sin registro, metricas y metricas --por-version siguen dando la misma salida en las columnas que ya existian (test de regresion sobre un repo con datos de la 0.14)
README y CHANGELOG describen las columnas nuevas
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
