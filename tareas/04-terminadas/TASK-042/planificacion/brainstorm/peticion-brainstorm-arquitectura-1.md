# Peticion de brainstorm — TASK-042, rol arquitectura (ronda 1)

- Tarea: TASK-042 — F4-T4 Complejidad por defecto por heuristica y un rol sin unificador
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
Que una tarea `simple` lance un agente de brainstorm y no tres (auditoria del
2026-10-03, decision C4). Hoy `new` e `import` escriben `complejidad: media`
cuando no se declara, y ese valor por defecto domina el maximo con la
heuristica: casi todas las tareas lanzan 2 roles mas el unificador, aunque la
heuristica diga `simple`. Y con un solo rol, el unificador no consolida
nada: es un agente mas que relee lo que el rol ya escribio.

Decision C4 aprobada: la heuristica decide la complejidad cuando no se
declara; con 1 rol no hay unificador y el rol escribe `plan-final.md`.

Fuera de alcance: recalibrar la heuristica (TASK-052).
````

### Criterios de aceptacion

````
Sin `--complejidad` declarado, el numero de roles lo decide la heuristica
Con 1 rol, `plan` no escribe la peticion de unificador y el rol escribe `plan-final.md`
Tests de `plan-brainstorm` actualizados con la nueva expectativa y su motivo
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
