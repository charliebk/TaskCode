# Peticion al unificador — TASK-023 (ronda 1)

- Tarea: TASK-023 — Métricas de coste en tokens por fase
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-09-16
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-014) (+1)

Los dos niveles NO coinciden. Se lanzan 2 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

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
La sección 16 de `docs/PROPUESTA_METODOLOGIA.md` diseñó dónde el proceso
necesita un LLM y dónde no, pero se quedó en estimación: nunca se
contrastó con coste real medido. La decisión #15 de la sección 14 (`docs/
contexto/CHECKLIST_TERMINACION.md`) ya lo dejó dicho al aceptar los pesos
de la heurística de complejidad (§16.1) "tal cual, y se ajustan cuando
haya datos" — hoy no hay datos.

Restricción de partida, importante para el diseño: `taskctl` es un CLI
determinista que no llama a ningún LLM por sí mismo (sección 16, tabla) —
quien sí gasta tokens es el agente de Claude Code que orquesta `plan`,
`review`, etc., desde fuera del CLI. `taskctl` no tiene visibilidad directa
de ese consumo; cualquier medición depende de que se registre desde donde
sí se ve (la sesión del agente), no de instrumentar el propio binario.

Esta tarea busca cerrar ese hueco: dejar un mecanismo para registrar el
coste real en tokens de las fases que sí usan LLM (brainstorm, revisión
por pares, Codex) tarea a tarea, agregarlo por sprint en `docs/METRICAS.md`
contrastándolo contra lo estimado en la sección 16, y usar esos datos
reales para revisar si los pesos de `scripts/heuristica-complejidad.yml`
siguen siendo razonables o hace falta ajustarlos.
````

### Criterios de aceptacion

````
Cada tarea registra en su `tarea.md` el coste en tokens de sus fases de diseño, implementación y revisión.
`docs/METRICAS.md` agrega esos datos por sprint y los contrasta con las estimaciones de la sección 16.
Con esos datos reales se revisan los pesos de la heurística de complejidad, que es el punto 15 de la sección 14.
Tests del cálculo de agregados con datos de ejemplo.
````
