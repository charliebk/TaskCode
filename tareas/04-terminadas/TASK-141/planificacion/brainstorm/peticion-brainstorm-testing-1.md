# Peticion de brainstorm — TASK-141, rol testing (ronda 1)

- Tarea: TASK-141 — Auditoria 4D inicial: reconocimiento completo del codigo existente
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-22
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
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

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
