# Peticion de brainstorm — TASK-082, rol arquitectura (ronda 1)

- Tarea: TASK-082 — Autorrevision del implementador antes de pedir revision
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-07
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
