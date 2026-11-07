# Peticion de brainstorm — TASK-085, rol riesgos (ronda 1)

- Tarea: TASK-085 — Coste de implementacion registrado automaticamente
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
En ToolsaWeb falta el coste de implementacion en 97 de 119 tareas, asi que el coste total esta infravalorado. Registrarlo sin depender de que alguien ejecute registrar-coste.
````

### Criterios de aceptacion

````
Un hook registra los tokens de implementacion de la tarea en curso de la rama actual al terminar cada turno o subagente, sin duplicar lo ya registrado
Sin tarea en curso en la rama el hook sale sin hacer nada y sin lanzar procesos pesados
taskctl metricas deja de listar como sin coste de implementacion las tareas registradas asi; lo cubren tests con repos Git temporales
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
