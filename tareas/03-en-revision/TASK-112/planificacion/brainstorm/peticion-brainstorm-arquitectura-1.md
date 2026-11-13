# Peticion de brainstorm — TASK-112, rol arquitectura (ronda 1)

- Tarea: TASK-112 — P-4: el revisor reutiliza la verificacion de ronda y las rondas 2+ solo relanzan al revisor con pendientes
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
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
La ronda 2 cuesta el 94 % de la ronda 1 en ToolsaWeb: cada revisor clona, compila y corre la suite aunque taskctl review acabe de verificar el mismo commit, y en TASK-293 de ToolsaWeb cada ronda extra relanzo a los dos revisores aunque el hallazgo era de uno. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-4)
````

### Criterios de aceptacion

````
La peticion de revision trae el resultado de la verificacion de ronda (commit, huella, comando, estado) y la guia de revision dice que no se repite la suite si casa con el commit revisado (test sobre la peticion)
Desde la ronda 2, taskctl review solo genera peticion para los revisores con hallazgos no aceptados o cuyos ficheros toca la correccion (test con dos revisores en repo temporal)
Desde la ronda 2, la peticion de cada revisor lista solo sus hallazgos CRITICO e IMPORTANTE no resueltos de la ronda anterior junto al diff de la correccion, y la guia de revision pide comprobar esos y lo que toca la correccion, sin revisar de nuevo el resto ni los MENORES (test sobre la peticion)
Un revisor cuyos unicos pendientes son MENORES, y cuyos ficheros no toca la correccion, no se relanza en la ronda 2+ y consta asi en tarea.md (test con dos revisores en repo temporal)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
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
