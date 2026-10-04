# Peticion de brainstorm — TASK-041, rol arquitectura (ronda 1)

- Tarea: TASK-041 — F4-T1 taskctl new con objetivo y criterios
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
Que una tarea nazca con su objetivo y sus criterios, sin editar `tarea.md`
despues (auditoria del 2026-10-03, C1). Hoy `taskctl new` deja el Objetivo
vacio y un criterio `- [ ] ` vacio a proposito, y cada tarea de este backlog ha
necesitado un commit aparte solo para escribirlos. Con `--objetivo` y
`--criterio` (repetible), o con `--desde <fichero>` que ya tenga esas dos
secciones, la tarea queda definida en el mismo commit en que se crea.

Fuera de alcance: validar que los criterios sean verificables (TASK-043).
````

### Criterios de aceptacion

````
`taskctl new --objetivo "<texto>" --criterio "<texto>"` (repetible) escribe ambas secciones
`taskctl new --desde <fichero fuera del repo>` toma objetivo y criterios de un markdown
Sin esos flags el comportamiento es el de hoy
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
