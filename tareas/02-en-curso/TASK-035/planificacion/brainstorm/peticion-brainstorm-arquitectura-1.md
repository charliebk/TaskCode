# Peticion de brainstorm — TASK-035, rol arquitectura (ronda 1)

- Tarea: TASK-035 — F1-T2 Politica de rondas y una sola suite por ronda en las skills
- Tipo: feature · Complejidad declarada: trivial
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
Llevar a las skills la politica de rondas A3 y la regla A4 de la auditoria
del 2026-10-03, aprobadas por Carlos: sin CRITICO ni IMPORTANTE abiertos una
ronda cierra la tarea, los MENOR corregidos no abren ronda 2, y el revisor
corre la suite completa una sola vez por ronda (los mutantes, con el fichero
de test concreto). Hoy la skill de flujo y dos revisoras dicen «dos rondas es
lo normal», y las revisoras piden la suite entera dos veces.

Solo documentacion: no toca `src/`. Complejidad `trivial` (no `simple`, como
se importo): el contenido ya esta decidido y no hay diseno que explorar.
````

### Criterios de aceptacion

````
`task-workflow/SKILL.md` recoge la politica A3: sin CRITICO ni IMPORTANTE abiertos una ronda cierra; si solo se corrigen MENOR no hay ronda 2; la ronda 2 solo revisa el delta
Las 4 skills revisoras piden la suite completa una vez por ronda y los mutantes con `node --test <fichero>`
Con varios revisores en paralelo, instruccion de concurrencia reducida
Tests de `test/skills/` en verde, incluido el de no mencionar el proyecto
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
