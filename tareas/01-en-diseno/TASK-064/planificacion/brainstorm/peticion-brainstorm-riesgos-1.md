# Peticion de brainstorm — TASK-064, rol riesgos (ronda 1)

- Tarea: TASK-064 — Metricas v2 (B): leer y mostrar la evolucion del flujo
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-25
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

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

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
