# Peticion al unificador — TASK-017 (ronda 1)

- Tarea: TASK-017 — Catálogo de skills determinista con selección en dos pasos
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-09-09
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-010) (+1)

Los dos niveles NO coinciden. Se lanzan 3 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

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
