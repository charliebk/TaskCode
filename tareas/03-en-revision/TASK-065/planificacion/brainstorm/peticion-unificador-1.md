# Peticion al unificador — TASK-065 (ronda 1)

- Tarea: TASK-065 — Metricas v2 (C): evolucion, grupos y varios proyectos
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-25
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-064) (+1)
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
Parte de agregados de la particion de TASK-064 (decidida en su diseno, Carlos 2026-10-25). TASK-064 enriquece la fila de metricas de cada tarea (coste desglosado, hallazgos por severidad y origen, lecturas); esta tarea agrega esas filas para elegir mejoras por cifras: evolucion por tramos, grupos por tipo, complejidad, criterios y tamano, y varios proyectos a la vez, con una linea base sobre ToolsaWeb, OpenGisViewer y TaskCode. Una medicion a mano sobre 189 tareas mostro que el tamano de la tarea es lo que mas pesa en el resultado de la revision (0-4 criterios: 52 % aprobadas a la primera; 7 o mas: 12 %) y que ToolsaWeb es la excepcion. Decisiones ya tomadas (Carlos, 2026-10-25): hallazgos contados una vez por tarea (revisor + ID); aprobada a la primera = una sola ronda con veredicto aprobada o aprobada-con-correcciones, y las tareas sin revision se cuentan aparte; terciles de KB calculados con todos los proyectos juntos; tramos ordenados por fecha de cierre con desempate estable por proyecto e ID. Plan de partida: tareas/.../TASK-064/planificacion/plan-final.md (pasos 3 a 5).
````

### Criterios de aceptacion

````
taskctl metricas --evolucion [--tramo N] agrupa las tareas terminadas por fecha de cierre (desempate por proyecto e ID) en tramos de N (20 por defecto) con mediana de minutos plan a finish, rondas medias, hallazgos IMPORTANTE por tarea, tokens de revision y KB de peticiones de revision, y dice cuantas tareas quedaron fuera por no tener fecha de cierre.
taskctl metricas --grupos agrupa las tareas terminadas por tipo, por complejidad, por numero de criterios (0-4, 5-6, 7 o mas) y por KB de peticion de revision por ronda (terciles con todos los proyectos juntos), con porcentaje aprobado a la primera, rondas medias y hallazgos CRITICO+IMPORTANTE por tarea, y cuenta aparte las tareas sin revision o sin tabla de hallazgos.
taskctl metricas --repo <ruta> (repetible; por defecto el repo actual) junta varios proyectos con la clave (proyecto, id) en toda la lectura, de modo que un mismo TASK-NNN en dos repos no mezcla datos; con un solo repo la salida es la de hoy, y --repo junto a --escribir aborta sin tocar nada.
Con --json y --evolucion o --grupos, la salida es un unico objeto que pasa JSON.parse tambien sin tareas y con grupos vacios (sin NaN ni null silenciosos); el texto humano y los avisos van por stderr.
Tests contra repos Git temporales reales (dos repos con el mismo TASK-NNN, grupo vacio, sin tareas, --repo con --escribir); README y CHANGELOG documentan las metricas nuevas.
Linea base: la salida de taskctl metricas --evolucion --grupos con --repo sobre ToolsaWeb, OpenGisViewer y TaskCode queda copiada en el Resultado, y git status en cada uno de los tres sigue igual que antes de ejecutarlo.
````
