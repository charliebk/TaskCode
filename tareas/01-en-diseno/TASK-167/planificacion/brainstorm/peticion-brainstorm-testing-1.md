# Peticion de brainstorm — TASK-167, rol testing (ronda 1)

- Tarea: TASK-167 — Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-25
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Que los proyectos que instalan el plugin no cometan los fallos 4D que las auditorias encontraron en TaskCode: lo aprendido en las dos auditorias pasa a guia y a comprobaciones automaticas que el plugin instala y ejecuta al escribir codigo, no solo al revisarlo. Decision de Carlos (2026-11-25): va antes que las correcciones pendientes y se publica en la 0.19.0; TASK-150c (aparcada en diseno), 150d, 159..166, 152 y 140 pasan a la 0.20.0.
````

### Criterios de aceptacion

````
Hay una guia instalable de duplicacion de grano fino (helpers copiados, lectores de secciones repetidos, envoltorios de git o fs duplicados, catalogos escritos dos veces) sacada de las auditorias 4D, y start, review y las revisoras remiten a ella
Al escribir codigo, taskctl detecta en el diff funciones casi identicas a otras ya existentes del proyecto y lo avisa antes de pedir revision, no solo como candidato para el revisor
Hay una auditoria 4D invocable para el proyecto que produce hallazgos clasificados por D y un plan de correccion por olas
taskctl metricas muestra la tendencia de hallazgos 4D por proyecto entre auditorias y por tarea
Un test por pieza falla si deja de instalarse o de comprobar lo suyo
````

## Como entregas

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
