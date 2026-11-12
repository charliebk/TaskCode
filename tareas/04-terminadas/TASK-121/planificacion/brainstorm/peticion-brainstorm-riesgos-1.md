# Peticion de brainstorm — TASK-121, rol riesgos (ronda 1)

- Tarea: TASK-121 — Troceo de tareas de mas de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-12
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
Por que importa (Carlos, 2026-11-12): trocear ha dado problemas en otros proyectos y ha complicado el repo. Evidencia en los repos: en TaskCode, TASK-096 se partio en 10 tareas con rama, diseno, revision y cierre propios (TASK-100 a TASK-109; unas 25 h y unos 230 M tokens); en ToolsaWeb hay 83 tareas que citan una particion, con tandas de numeros dispersos como TASK-307 a TASK-320 aun planificadas; en OpenDockTrading, 16. El plan debe partir de esos casos reales (ramas, carpetas, ROADMAP e IDs que quedaron) y no solo del enunciado.

Hoy la regla de una hora para el flujo cuando el plan estima mas de 60 min, y trocear crea tareas nuevas con su propia rama, diseno y cierre. Decision de Carlos (2026-11-12): trocear es condicional y solo una persona puede aceptarlo; si lo acepta, las partes se numeran con el mismo numero seguido de letras (TASK-NNNa, TASK-NNNb...), se trabajan sin salir de la rama de la tarea, se crean primero en 00-planificadas y se actualiza el ROADMAP antes de empezar TASK-NNNa, que es la tarea iniciada como principal. Como y cuando se integra en develop (al cerrar cada parte o al cerrar la ultima) lo decide el plan con la persona. Urgente para la version 0.16.0: lo mas rapido posible; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Con un plan de mas de 60 min, taskctl siguiente devuelve accion preguntar con dos salidas, trocear o aprobar entera, y en ningun modo (tampoco automatico) se trocea sin la respuesta de una persona (test con repo temporal)
Si la persona acepta, la tarea pasa a TASK-NNNa y se crean TASK-NNNb, TASK-NNNc... en 00-planificadas con el objetivo y los criterios de cada parte del plan, y tareas/ROADMAP.md se regenera antes de empezar TASK-NNNa (test)
Las partes comparten la rama de la tarea: start de TASK-NNNa la abre y las partes siguientes trabajan en ella sin crear otra (test)
Los IDs con letra funcionan en todo el CLI (new, plan, approve, start, review, finish, siguiente, board, metricas, roadmap) y no chocan con la numeracion siguiente (test)
Si la persona rechaza el troceo, la tarea sigue entera con el motivo escrito en el plan, como hoy (test de regresion)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
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
