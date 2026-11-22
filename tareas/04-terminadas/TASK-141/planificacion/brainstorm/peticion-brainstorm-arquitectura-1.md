# Peticion de brainstorm — TASK-141, rol arquitectura (ronda 1)

- Tarea: TASK-141 — Auditoria 4D inicial: reconocimiento completo del codigo existente
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-22
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
Reconocer el repo entero (plugin: src, scripts, skills, agents, hooks y test; scripts de la raiz) y auditar todo el codigo ya escrito contra la Regla 4D: sin duplicacion, sin desviacion, sin diluvio y sin disfraz (definicion en skills/task-workflow/revision.md, seccion Regla 4D). Solo lee y documenta: las correcciones van en tareas de seguimiento. La auditoria de TASK-137 (docs/auditoria-4d.md) solo cubrio los diffs de TASK-127..136; esta cubre todo el codigo y no repite sus casos A1..A13, los referencia.
````

### Criterios de aceptacion

````
docs/auditoria-4d-completa.md tiene un mapa del proyecto: areas (src/core, src/commands, src/fs, src/hooks, src/cli, scripts/gitflow, scripts de la raiz, skills, agents, hooks, test), su responsabilidad y su tamano en lineas; cada area figura como auditada o como excluida con su motivo (dist/ generado, node_modules, tareas/ historicas)
Cada caso 4D esta en una tabla ID | Area | D | fichero:linea | evidencia | severidad | confianza | seguimiento; duplicacion y disfraz reales son IMPORTANTE como minimo, desviacion y diluvio MENOR salvo que cambien comportamiento o escondan un fallo; los dudosos van con confianza media; los casos ya cubiertos por TASK-138..140 se referencian, no se duplican
Cada caso de confianza alta lo vuelve a comprobar en el codigo el coordinador, distinto del agente que lo encontro; los casos de disfraz en tests se comprueban por mutacion sobre una muestra de al menos 5 tests y el resultado queda anotado
Cada caso tiene tarea de seguimiento creada con taskctl new, agrupando por regla y area, nunca una por caso; el informe cierra con un resumen por area y una conclusion: que D predomina y en que zonas
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
