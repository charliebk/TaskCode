# Peticion de brainstorm — TASK-037, rol arquitectura (ronda 1)

- Tarea: TASK-037 — F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos
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
Que el logging de los scripts de Git-Flow deje de lanzar procesos: hoy cada
linea abre un subshell `$(_do_log ...)` y un `date` (~0,15 s por linea medido
en Windows; `initialize_gitflow_log` y `log_summary` lanzan mas `date`). Es la
mayor parte de los 11 s que `update-feature.sh` se lleva dentro de `taskctl
review` (auditoria del 2026-10-03, B1), y lo paga cada `start`, `review`,
`finish`, `diagnose` y un tercio de la suite.

Con bash >= 4.2 la hora sale de `printf -v ... '%(...)T'`; con bash mas
antiguo (el `/bin/bash` 3.2 de macOS) se conserva `date` como caida. Fuera de
alcance: la deteccion de origin (TASK-038).
````

### Criterios de aceptacion

````
`_gitflow-common.sh` usa `printf -v` en lugar de `$(date)` y `$(_do_log)`
Tiempo de `update-feature.sh` en un repo temporal medido antes y despues y anotado en el Resultado
Salida y fichero de log identicos (salvo la hora) en un caso de prueba
Tests de `test/gitflow/` en verde
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
