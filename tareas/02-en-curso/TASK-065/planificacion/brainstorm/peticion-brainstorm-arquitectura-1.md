# Peticion de brainstorm — TASK-065, rol arquitectura (ronda 1)

- Tarea: TASK-065 — Metricas v2 (C): evolucion, grupos y varios proyectos
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-25
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-arquitectura-1.md`

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

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

## Como entregas

Escribe en `salida-brainstorm-arquitectura-1.md`, con estas secciones y en este orden:

- Enfoque propuesto, con rutas y nombres concretos
- Que se extiende y que se crea
- Limites que cruza
- La decision de diseño que mas te preocupa (UNA sola)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
