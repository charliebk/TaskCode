# Peticion de brainstorm — TASK-023, rol riesgos (ronda 1)

- Tarea: TASK-023 — Métricas de coste en tokens por fase
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-09-16
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

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

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
