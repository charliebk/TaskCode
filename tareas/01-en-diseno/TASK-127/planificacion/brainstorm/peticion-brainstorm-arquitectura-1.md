# Peticion de brainstorm — TASK-127, rol arquitectura (ronda 1)

- Tarea: TASK-127 — Tope de rondas de revision configurable, 2 por defecto, y decision de una persona al llegar
- Tipo: feature · Complejidad declarada: simple
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
Medido en ToolsaWeb (153 tareas terminadas, taskctl metricas, 2026-11-12): las rondas por tarea han pasado de 2,2 a 3,0 y TASK-280 y TASK-282 llegaron a 6; los hallazgos suman unos 1130 MENORES, unos 350 IMPORTANTES y 3 CRITICOS. El tope esta fijo en TOPE_RONDAS = 3 (src/core/flujo.ts) y --ronda-extra lo rebasa sin limite. Se busca un tope configurable, 2 por defecto, y que al llegar a el decida una persona: cerrar con lo que hay, autorizar una ronda mas o devolver la tarea a diseno. Complementa a TASK-099 (los MENORES no abren ronda) y a TASK-112 (rondas 2+ acotadas a los bloqueantes): va despues de TASK-112. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Una clave tope_rondas en .taskcode/config.yml (entero de 1 a 10, 2 por defecto) sustituye a la constante TOPE_RONDAS en review y en taskctl siguiente (test con repo temporal)
Al llegar al tope con hallazgos bloqueantes abiertos, taskctl siguiente devuelve accion preguntar con tres salidas (cerrar, una ronda mas, volver a diseno) en todos los modos, tambien automatico (test)
taskctl review --ronda-extra pasado el tope exige que conste la decision de la persona en tarea.md y cada ronda extra vuelve a preguntar (test)
Con tope_rondas: 3 el flujo se comporta como hoy (test de regresion)
Las skills review y task-workflow, el README y el CHANGELOG explican el tope y su valor por defecto
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
