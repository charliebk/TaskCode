# Peticion de brainstorm — TASK-034, rol arquitectura (ronda 1)

- Tarea: TASK-034 — F1-T1 Excluir lo generado del diff de revision
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
Que la peticion de `taskctl review` deje de embeber lo que el revisor no
necesita leer: el JS compilado (`dist/`), los lockfiles y la propia carpeta
`tareas/`. Hoy son el 27 % de los bytes de todas las peticiones (auditoria
del 2026-10-03, A1) y el 78 % en el peor caso (TASK-031, 325 KB). Lo excluido
sigue visible como `git diff --stat`, con la orden exacta para pedir su diff,
y la peticion nombra la carpeta de la tarea para que los criterios y el plan
se lean del fichero en lugar del diff.

Fuera de alcance: la ronda 2 incremental (TASK-040) y el contenido de las
instrucciones al revisor (TASK-035).
````

### Criterios de aceptacion

````
Clave opcional `excluir_de_revision` en `.taskcode/config.yml`, por defecto `[**/dist/**, *.lock, *-lock.*, tareas/**]`
La peticion incluye `git diff --stat` de lo excluido y la orden para pedir su diff
Regenerar la peticion de TASK-031 sobre su rama baja de 325 KB a menos de 100 KB (medido)
Test contra un repo real: un cambio en `dist/` no aparece en el diff embebido y si en el `--stat`
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
