---
id: TASK-023
titulo: "Métricas de coste en tokens por fase"
tipo: feature
sprint: 4
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-023-metricas-de-coste-en-tokens-por-fase
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 3445774
tokens_implementacion: 18803413
tokens_revision: 8699214
creado: 2026-09-05
actualizado: 2026-10-06
dependencias: [TASK-014]
---
## Objetivo

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

## Criterios de aceptacion
- [x] Cada tarea registra en su `tarea.md` el coste en tokens de sus fases de diseño, implementación y revisión.
- [x] `docs/METRICAS.md` agrega esos datos por sprint y los contrasta con las estimaciones de la sección 16.
- [x] Con esos datos reales se revisan los pesos de la heurística de complejidad, que es el punto 15 de la sección 14.
- [x] Tests del cálculo de agregados con datos de ejemplo.

## Resultado

Cerrada el 2026-10-06 en 2 rondas de revisión por pares.

**Divergencias aprobadas por Carlos al arrancar** (detalle al final de
`planificacion/plan-final.md`): no hay `board --tokens`; los tokens son
columnas de `taskctl metricas` (TASK-052 lo creó después de aprobarse el
plan). Y la fuente del dato no es «de memoria».

**Hallazgo durante la implementación que cambió el diseño.** La cifra que
Claude Code muestra al terminar un subagente es su **contexto final**, no su
coste: el agente implementador marcó 232 391 y su transcripción suma 12,7 M
de tokens procesados en 83 llamadas. Carlos decidió medir lo acumulado:
`registrar-coste --agente <id>` lee la transcripción del subagente
(`<CLAUDE_CONFIG_DIR o ~/.claude>/projects/*/*/subagents/agent-<id>.jsonl`) y
suma el `usage` de cada llamada, deduplicando por `message.id` (última
aparición). Si el formato cambia, aborta y queda `--tokens N` a mano.

**Lo entregado.**
- Campos `tokens_diseno`, `tokens_implementacion` y `tokens_revision`
  (nullable; ausente = null, así validan las tareas viejas, con un test que
  relee todas las de `04-terminadas/`).
- `taskctl registrar-coste TASK-NNN --fase F (--agente <id>... | --tokens N)`,
  que suma, vale en cualquier estado (también terminada) y commitea solo
  `tarea.md`.
- `taskctl metricas --tokens [--escribir]`: columnas por fase, resumen por
  sprint y por complejidad, y un bloque regenerable e idempotente en
  `docs/METRICAS.md` que conserva el resto del fichero byte a byte.
- Aviso no bloqueante en `finish` si falta el coste de diseño o revisión.
- La instrucción de registrar el coste en las skills de fase
  (`task-workflow/coste.md`).

**CA2 y CA3.** La sección 11 de `docs/METRICAS.md` (a mano) recupera el coste
real de los subagentes de 41 tareas pasadas desde las transcripciones, como
cota inferior. No se escribe en sus `tarea.md`. La revisión se lleva el
71-100 % del gasto, frente al 0-12 % del brainstorm, y las rondas son lo que
más pesa. **Los pesos de la heurística no se tocan**: el orden de sus niveles
es razonable y no hay muestra en media, alta y crítica.

**Coste de esta tarea** (registrado con el propio comando): diseño 3,4 M (3
subagentes, 2026-09-16), implementación 18,8 M (1 agente, dos pasadas) y
revisión 8,7 M (2 rondas). No incluye la parte del orquestador.

**Revisión por pares.**
- *Ronda 1* (cambios-solicitados), 1 IMPORTANTE y 4 MENOR, todos corregidos:
  - **IMP-1**: el aviso de `finish` proponía `--tokens N` con la cifra de
    la notificación. Ahora propone `--agente <id>`, fijado por un test
    comprobado por mutación.
  - **MEN-1**: comentario de `Task`.
  - **MEN-2**: paso 4 de la skill `review`.
  - **MEN-3**: alcance de la tabla histórica.
  - **MEN-4**: regla de atribución explícita, más la nota de que las filas
    anteriores a TASK-033 cambian según la regla (las conclusiones solo usan
    las de TASK-033 en adelante) y la lectura de las rondas.
- *Ronda 2* (aprobada): todo cerrado y verificado con el CLI real. **MEN-5**
  (comentario sin refluir) se corrigió después, sin ronda 3.
- Suite completa: 1176 tests, 1173 pasan y 3 fallan, que son los rojos
  conocidos de Windows.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-06T11:08:43Z | start | manual | persona |
| 2026-10-06T13:13:14Z | review | manual | persona |
| 2026-10-06T14:26:20Z | review | manual | persona |
