# Peticion de brainstorm — TASK-143b, rol arquitectura (ronda 1)

- Tarea: TASK-143b — argumentos, diagnose y push-back (parte b de TASK-143)
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-24
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
Parte b del troceo de TASK-143 (Regla 4D: duplicacion en Git-Flow (bash y TS)), partes TASK-143a, TASK-143b, TASK-143c en la rama fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y.

parse_gitflow_args y normalize_branch_name en los 13 scripts, diagnose-repo con detect_origin_available y develop configurable, y push-back-to-remote sin referencias ocultas.
````

### Criterios de aceptacion

````
La lectura de argumentos y assert_valid_branch_name vienen de un helper comun en los 13 scripts; diagnose-repo usa detect_origin_available
push-back-to-remote ensena en la vista previa todo lo que sube y el nombre del backup sale de una sola variable
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
