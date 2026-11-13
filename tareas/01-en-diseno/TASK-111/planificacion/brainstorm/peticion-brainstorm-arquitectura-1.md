# Peticion de brainstorm — TASK-111, rol arquitectura (ronda 1)

- Tarea: TASK-111 — P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
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
El freno Stop corre la verificacion al final de cada turno con tarea en curso (selectiva de 4,2 min en ToolsaWeb) y no queda registro de cuantas veces corre ni de su coste. Que cada ejecucion quede registrada, que metricas la sume y que no corra si el arbol no cambio desde el ultimo verde. Toca freno-stop.ts como TASK-110: va despues de ella. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-3)
````

### Criterios de aceptacion

````
Cada ejecucion del freno Stop anade una linea con instante, modo, duracion y resultado a un registro bajo .git/taskcode/ (test con repo temporal)
taskctl metricas muestra por tarea cuantas veces corrio el freno y su tiempo total, con — sin dato (test)
Si la huella del arbol no cambio desde el ultimo verde, el freno no ejecuta la verificacion y no anade salida (test)
La linea del freno usa el formato comun de registro de TASK-120 con puerta freno, y el resultado distingue verde, rojo, omitido (sin cambios desde el ultimo verde) y excedido, este ultimo reservado para el presupuesto de TASK-125 (test)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
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
