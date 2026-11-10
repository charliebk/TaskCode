# Peticion de brainstorm — TASK-100, rol riesgos (ronda 1)

- Tarea: TASK-100 — Verificacion proporcional A: una tarea que solo cambia documentacion no corre la suite de tests
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-10
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
Primera parte de TASK-096 (decision de Carlos, 2026-11-10: trocearla y empezar por la de mas valor y menos riesgo). Hoy finish, el freno Stop, las rondas de revision y el guardian de merges pagan la verificacion completa aunque la tarea solo cambie documentacion (ToolsaWeb: unos 28 min por finish, tambien en tareas de solo .md; la mayoria de las tareas recientes de ToolsaWeb y OpenDockTrading son documentos o estudios). Un proyecto declara que rutas son documentacion; si el diff de la tarea frente a la base solo toca esas rutas, no se corre la suite de tests, solo la comprobacion de documentacion si el proyecto la declara, y la salida dice que verificacion corrio y por que. Fail-closed: un diff mixto, una ruta no clasificada o un error al calcular el diff van a la verificacion de siempre. Opt-in: sin la configuracion nueva todo se comporta exactamente como en la 0.14.0. No se retira ningun freno. La verificacion de solo lo afectado en codigo parcial queda para TASK-096.
````

### Criterios de aceptacion

````
Con la configuracion nueva, en un repo temporal cuya tarea solo cambia rutas de documentacion, taskctl finish integra sin ejecutar comando_verificacion y su salida dice que verificacion corrio y por que; si el proyecto declara una comprobacion de documentacion, se ejecuta y su fallo bloquea igual que hoy (test de integracion por caso)
Un diff mixto (documentacion y codigo), con una ruta no clasificada o sin poder calcular el diff ejecuta la verificacion de siempre (un test por caso)
El freno Stop y taskctl review aplican la misma decision al mismo diff: un turno o una ronda de solo documentacion no corren la suite de tests (test por cada uno)
El guardian de merges aplica la misma decision que finish: no bloquea el merge de una tarea de solo documentacion sin verde de la completa y si bloquea el de una con codigo (un test por caso)
Un proyecto sin la configuracion nueva se comporta exactamente como en la 0.14.0 (tests de regresion de finish, Stop, review y guardian)
skills/task-workflow (verificacion-selectiva.md), README y CHANGELOG explican el principio y como declara un proyecto sus rutas de documentacion
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
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
