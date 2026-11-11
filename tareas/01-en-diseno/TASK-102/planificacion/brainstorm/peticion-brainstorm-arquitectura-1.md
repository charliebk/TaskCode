# Peticion de brainstorm — TASK-102, rol arquitectura (ronda 1)

- Tarea: TASK-102 — Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-11
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
Tercera parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). El freno Stop (cada fin de turno) y taskctl review usan la decision unica de TASK-100 sobre el mismo diff: si solo cambia documentacion no corren la suite de tests, solo la comprobacion de documentacion si se declara. Clasifican tambien el arbol de trabajo (lo no commiteado y lo no trackeado): un .ts sin commitear hace que el turno no sea de solo documentacion. Solo documentacion se decide antes que la verificacion selectiva de TASK-091 y de forma identica en Stop y review. Sin la clave, ni se calcula el diff (cero coste en cada turno). Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A3).
````

### Criterios de aceptacion

````
Un turno o una ronda de solo documentacion no corren la suite de tests; con comando de documentacion declarado, corre ese (test por cada uno, repo temporal)
Un fichero de codigo sin commitear o sin seguimiento hace que Stop y review apliquen la verificacion de siempre (test por cada uno)
Con comando_verificacion_selectiva tambien declarado, solo documentacion se decide antes y Stop y review dan la misma decision para el mismo diff (test)
Sin la configuracion nueva Stop y review se comportan exactamente como en la 0.14.0 y no lanzan ningun proceso git nuevo (test de regresion)
verificacion-selectiva.md, README y CHANGELOG explican el comportamiento de Stop y review
La suite completa pasa en verde (npm test) sin debilitar ningun test
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
