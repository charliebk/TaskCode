# Peticion de brainstorm — TASK-050, rol arquitectura (ronda 1)

- Tarea: TASK-050 — F6-T1 Suite rapida y repo plantilla en los tests
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-05
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
La suite completa tarda unos 11 minutos y no hay forma de iterar mas rapido
(auditoria B3, B4, B7). Se anade `npm run test:rapido` con los tests de core
y cli que no lanzan procesos, se crea un helper que monta el repo Git base
una vez por fichero y lo copia con `fs.cp` en vez de repetir los `git init`
y commits de cada test, y se mide cuanto cuesta la cobertura para decidir si
va en un `test:cov` aparte.
````

### Criterios de aceptacion

````
`npm run test:rapido` (core y cli, sin procesos) en menos de 1 min; `npm test` sigue siendo la suite completa
Helper que crea el repo base una vez por fichero y lo copia con `fs.cp`, adoptado en los 5 ficheros mas lentos
Medicion con y sin `--experimental-test-coverage` anotada; si compensa, `test:cov` aparte
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
