# Peticion de brainstorm — TASK-151, rol arquitectura (ronda 1)

- Tarea: TASK-151 — Regla 4D: disfraz en tests
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-23
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
Que los tests sospechosos de disfraz de la auditoria 4D completa (docs/auditoria-4d-completa.md, casos TCMD-01 a TCMD-05, TCORE-01 a TCORE-03, TCORE-08, TCORE-09, TRES-06 a TRES-09 y TRES-12) fallen cuando se rompe lo que dicen probar. Ocho se confirmaron por mutacion.
````

### Criterios de aceptacion

````
Cada mutacion de la seccion Mutacion de docs/auditoria-4d-completa.md que quedo en verde pone ahora su test en rojo (board-format, state-machine, task-store-wip, git cmdQuoteWindows, doctor-deploy DIRS_EXCLUIDOS, review-incremental, salida-temprana, cli/estado)
Los tests que prometen sin efectos secundarios o workspace limpio lo comprueban con git status; los que prometen error claro miran el mensaje
doctor-correcciones no convierte un timeout ausente en skip; review-incremental corre en Linux; ultimaRonda se prueba con 10 rondas o mas
plugin-instalado, guardia-documentacion y fases comprueban un resultado esperado (cuenta-sel, indexOf distinto de -1)
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
