# Peticion de brainstorm — TASK-138, rol arquitectura (ronda 1)

- Tarea: TASK-138 — Regla 4D: duplicacion en metricas, suite y registro de puertas
- Tipo: fix · Complejidad declarada: media
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
Corregir las duplicaciones que encontro la auditoria 4D de TASK-137 (docs/auditoria-4d.md, casos A1-A6): un solo agregador de la suite por version, una sola mediana, una sola decision verde/rojo/omitido por puerta, sin regex ni constantes duplicadas o muertas.
````

### Criterios de aceptacion

````
metricas --por-version y el aviso de crecimiento de doctor usan el mismo agregador de suite por version; un test con una tarea que corre la completa dos veces da la misma cifra en las dos vistas
Una sola funcion mediana (versiones-metricas, crecimiento-suite, la exportada en metricas.ts y la de tramoDe en evolucion.ts la comparten; TASK-141, CORE2-11) y la regex de pytest se evalua una vez en contarTests
anotarFinish, el bloque de review, anotarSuite y verificar-lote (TASK-141) comparten la decision verde/rojo/omitido; PUERTAS_VERIFICACION se usa en metricas o se elimina con su test
Los textos de las salidas del tope de rondas (siguiente, salidasTopeRondas, error de review) salen de una sola fuente y doctor lee las terminadas una vez
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
