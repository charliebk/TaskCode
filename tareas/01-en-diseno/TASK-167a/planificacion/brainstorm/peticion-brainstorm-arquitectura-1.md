# Peticion de brainstorm — TASK-167, rol arquitectura (ronda 1)

- Tarea: TASK-167 — Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-25
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

Escribe en `salida-brainstorm-arquitectura-1.md`, con estas secciones y en este orden:

- Enfoque propuesto, con rutas y nombres concretos
- Que se extiende y que se crea
- Limites que cruza
- La decision de diseño que mas te preocupa (UNA sola)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **riesgos**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
