# Peticion de brainstorm — TASK-081, rol riesgos (ronda 1)

- Tarea: TASK-081 — Revision mas barata: medir y acotar las lecturas de los revisores
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-07
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
Con la 0.8 los tokens de revision de una tarea media pasaron de 3.3 M a 6.8 M de mediana en ToolsaWeb mientras los KB por ronda de la peticion bajaban de 100 a 77: el exceso esta en lo que los revisores leen por su cuenta. Medir esas lecturas por revisor y ronda, acotarlas y usar un modelo mas barato en la ronda 2 cuando solo verifica correcciones.
````

### Criterios de aceptacion

````
taskctl metricas --tokens muestra por tarea las lecturas de cada revisor y ronda, sacadas de la transcripcion del subagente, y lo cubren tests con repos Git temporales
La peticion de revision declara una lista de ficheros de contexto permitidos y la skill revisora comun manda no leer fuera de ella salvo justificandolo en el informe
taskctl review en ronda 2 sugiere un modelo mas barato cuando la ronda 1 no dejo CRITICOS abiertos, y la sugerencia queda en la peticion
docs/METRICAS.md documenta las lecturas por revisor y el objetivo de volver a 3-4 M de tokens de revision en tareas medias
npm test en verde (salvo los tres rojos conocidos de Windows)
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
