# Peticion de brainstorm — TASK-039, rol arquitectura (ronda 1)

- Tarea: TASK-039 — F2-T3 Menos llamadas git en los comandos
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-10-04
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
Quitar las llamadas `git` sobrantes de los comandos de `taskctl` sin cambiar su
comportamiento (auditoria del 2026-10-03, B6). Medido con `GIT_TRACE2_EVENT`
en un ciclo completo: `review` lanza 27 procesos `git` y `finish` 33. La mayor
parte de los que se repiten no estan duplicados dentro del CLI: los hace una
vez el comando y otra el script de Git-Flow, que es la fuente de verdad y no
se toca aqui. Lo que si sobra esta en `autoCommit`: un `git add` por ruta (5
en `finish`), `rev-parse --short` mas `show --name-only` para lo mismo, y el
`maintenance run --auto` que Git lanza tras cada commit automatico.
````

### Criterios de aceptacion

````
`finish` baja de 35 a 20 o menos procesos `git` y `review` de 26 a 15 o menos, medido con `GIT_TRACE2_EVENT`
Suite en verde sin tocar expectativas
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
- Eres el unico rol que se lanza en esta tarea.
