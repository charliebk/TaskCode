# Peticion al unificador — TASK-064 (ronda 1)

- Tarea: TASK-064 — Metricas v2 (B): leer y mostrar la evolucion del flujo
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
  - dependencias: 1 dependencias (TASK-063) (+1)
  - criterios_aceptacion: 8 criterios (umbral: 5) (+1)

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
Segunda mitad de la particion de TASK-063 (decidida en su diseno, Carlos 2026-10-25). TASK-063 captura los datos nuevos (tabla ## Coste con desglose y lecturas, columna Origen en los hallazgos); esta tarea los lee junto con lo que ya existe (frontmatter, informes de revision, ## Transiciones) y los muestra en taskctl metricas, incluida una vista de evolucion por tramos, y deja una linea base medida sobre los tres proyectos que usan el plugin (ToolsaWeb, OpenGisViewer y TaskCode) para elegir las siguientes mejoras (tokens, tiempo, verificacion, memoria de contexto) por cifras. Decisiones ya tomadas: tramos ordenados por fecha de cierre; tokens nuevos = entrada + escritura de cache + salida, con la lectura de cache aparte.

Ampliada antes de disenarla (Carlos, 2026-10-25). Una medicion a mano sobre 189 tareas de los tres proyectos mostro que el resultado de la revision depende sobre todo del tamano de la tarea: con 0-4 criterios se aprueba a la primera el 52 %, con 7 o mas el 12 %; `simple` 72 %, `media` 18 %, `alta` 5 %; `fix` 72 %, `feature` 23 %. ToolsaWeb es la excepcion: sus tareas pequenas tambien rebotan (14 % a la primera), asi que alli pesa otra cosa (dominio o contexto). Por eso el desglose por grupos y la comparacion entre proyectos valen mas que la evolucion sola. Incluye ademas dos MENOR que TASK-063 dejo para esta tarea (MEN-1 y MEN-2 de su informe).
````

### Criterios de aceptacion

````
taskctl metricas muestra por tarea los tokens nuevos (entrada + escritura de cache + salida) y la lectura de cache por separado cuando hay tabla ## Coste, como sin desglose la diferencia entre tokens_<fase> y lo desglosado, y avisa de las filas repetidas (misma fase y misma fuente) en vez de esconderlas.
taskctl metricas lista las tareas terminadas a las que les falta coste en alguna fase (diseno, implementacion, revision).
taskctl metricas da por tarea las rondas, los hallazgos CRITICO, IMPORTANTE y MENOR de informe-revision-N.md e informe-revision-N-<revisor>.md con su reparto por origen (sin clasificar si no hay columna Origen), y la mediana de lecturas por fase de las tareas con tabla ## Coste.
taskctl metricas --evolucion [--tramo N] agrupa las tareas terminadas por fecha de cierre en tramos de N (20 por defecto) con mediana de minutos plan a finish, rondas medias, hallazgos IMPORTANTE por tarea, tokens de revision y KB de peticiones de revision.
taskctl metricas --grupos agrupa las tareas terminadas por tipo, por complejidad, por numero de criterios (0-4, 5-6, 7 o mas) y por KB de peticion de revision por ronda (terciles), con porcentaje aprobado en la primera ronda, rondas medias y hallazgos CRITICO+IMPORTANTE por tarea.
taskctl metricas --repo <ruta> (repetible; por defecto el repo actual) junta varios proyectos en solo lectura: cada fila y cada grupo dicen de que proyecto vienen, y --json (con --evolucion o --grupos) da una salida que pasa JSON.parse.
Tests contra repos Git temporales reales con tareas en formato antiguo y nuevo, incluido un test de una fila dentro de un bloque de codigo en una seccion ## Coste real que leerCostes no cuenta (MEN-1 de TASK-063); README y CHANGELOG documentan las metricas nuevas.
Linea base: la salida de taskctl metricas --evolucion --grupos con --repo sobre ToolsaWeb, OpenGisViewer y TaskCode queda copiada en el Resultado, y git status en cada uno de los tres sigue igual que antes de ejecutarlo.
````
