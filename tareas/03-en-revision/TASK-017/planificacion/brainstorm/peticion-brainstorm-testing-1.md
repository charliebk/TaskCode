# Peticion de brainstorm — TASK-017, rol testing (ronda 1)

- Tarea: TASK-017 — Catálogo de skills determinista con selección en dos pasos
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-09-09
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
Implementar la seleccion de skills descrita en la seccion 6.6 de
`docs/PROPUESTA_METODOLOGIA.md`: un catalogo propio y versionado en
`scripts/catalogo-skills.yml` que declare, por cada skill (propio del
plugin o externo de un marketplace), sus campos `id`, `origen`, `rol`
(revisor | ejecucion), `prioridad`, `etiquetas`, `patrones_archivo` y
`descripcion`.

La seleccion es de dos pasos y determinista primero: `taskctl plan`
cruza las `etiquetas` de la tarea contra el catalogo y calcula, sin
LLM, un top-N de candidatos por solape. El desempate entre candidatos
que empatan en solape usa primero la `prioridad` declarada en el
catalogo (seccion 16.4.1); solo si tambien empatan en prioridad se
recurre a un juicio barato con Haiku sobre ese top-N (2-3 candidatos,
nunca sobre el catalogo entero) para decidir cual encaja mejor con el
objetivo real de la tarea.

El resultado de la seleccion (que skill se eligio y por que regla —
solape, prioridad o desempate por LLM) queda registrado para poder
auditarlo despues. Si el candidato elegido es `origen: externo` y no
esta instalado, se anota como sugerencia de instalacion manual
(`/plugin install X@Y`); nunca se instala nada automaticamente.

Queda fuera de alcance a proposito el enrutado del agente revisor por
el diff real usando `patrones_archivo` (seccion 16.5) — eso es
TASK-018. Aqui el catalogo declara ese campo, pero todavia no lo
consume nadie; la seleccion de `agente_revisor` sigue basandose en
`etiquetas`.
````

### Criterios de aceptacion

````
Crea `scripts/catalogo-skills.yml` con los skills propios y externos que el equipo ya usa.
La selección es determinista primero (heurística por etiquetas, tipo y ficheros tocados) y solo recurre a un LLM para desempatar.
Registra en la tarea qué skills se seleccionaron y por qué regla, para poder auditarlo después.
Tests de la heurística con casos de empate y de no coincidencia.
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
