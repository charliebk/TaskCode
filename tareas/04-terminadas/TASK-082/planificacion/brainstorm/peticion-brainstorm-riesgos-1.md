# Peticion de brainstorm — TASK-082, rol riesgos (ronda 1)

- Tarea: TASK-082 — Autorrevision del implementador antes de pedir revision
- Tipo: feature · Complejidad declarada: media
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
Con la 0.8 ninguna tarea de ToolsaWeb salio en una sola ronda y el 86% de los hallazgos son de implementacion (8 MENORES por tarea media). Antes de taskctl review, el implementador pasa la lista de comprobacion de la skill revisora que toca y corrige lo evidente, sin lanzar un agente nuevo.
````

### Criterios de aceptacion

````
La skill de la fase review manda pasar la lista de comprobacion de la skill revisora del dominio antes de taskctl review y dejar constancia en tarea.md
taskctl review avisa, sin bloquear, si tarea.md no tiene la constancia de la autorrevision, y lo cubren tests con repos Git temporales
Las listas de comprobacion de las revisoras viven en un solo sitio que leen tanto la autorrevision como el revisor, sin duplicarlas
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
