# Peticion de brainstorm — TASK-153, rol arquitectura (ronda 1)

- Tarea: TASK-153 — Regla 4D en la creacion de codigo y tests
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-22
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
Que la Regla 4D actue al crear el codigo y los tests, no solo al revisarlos, para que cada tarea hecha con el plugin deje menos hallazgos 4D (peticion de Carlos tras la auditoria de TASK-141). Hoy la regla vive sobre todo en la revision: los agentes de plan tienen prohibido pensar en pruebas (CONT-07), la linea 4D de la autorrevision se da por buena con cualquier texto (CONT-08) y nadie senala al revisor los posibles duplicados ni los tests que conviene mutar.
````

### Criterios de aceptacion

````
plan-final.md lleva una seccion de reutilizacion (Regla 4D) con los helpers, funciones y fixtures existentes que se usaran, buscados antes de disenar; la plantilla de plan, las peticiones de los agentes de plan y el unificador la piden, y approve avisa si falta o esta vacia
review avisa si la autorrevision no trae la linea 4D (helper buscado, criterios citados, tests mutados) del ultimo commit, y la skill start lista los patrones de disfraz en tests que encontro la auditoria (nombre que promete sin asercion, datos que no distinguen, rejects sin matcher, skip que esconde un fallo)
La peticion de revision trae una seccion de candidatos 4D generada por el CLI desde el diff: por cada funcion o constante nueva, las existentes con nombre parecido en el repo, y los tests nuevos cuyo nombre promete algo comprobable, para que el revisor los mute
taskctl metricas cuenta por tarea los hallazgos 4D de sus informes (por regla, desde la seccion Regla 4D) para ver si bajan con el tiempo
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
