---
id: TASK-052
titulo: "F6-T5 Telemetria de fases y heuristica recalibrada"
tipo: feature
sprint: 7
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-052-f6-t5-telemetria-de-fases-y-heuristica-r
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

Hoy saber cuanto tardo cada fase de una tarea exige reconstruirlo a mano
desde los mensajes de commit, y la heuristica de complejidad no ha acertado
nunca su senal de riesgo (auditoria B8, C5). Cada transicion escribira su
marca de tiempo en el frontmatter, `taskctl metricas` sacara la tabla de
fases por tarea, y la heuristica se recalibra con las tareas cerradas
usando las rondas de revision como coste real, quitando de la config las
claves que nada lee (`tolerancia_*`, `modelo_consulta_discrepancia`).

## Criterios de aceptacion
- [x] Cada transicion escribe su marca de tiempo en el frontmatter y `taskctl metricas` saca la tabla de fases por tarea
- [x] Heuristica recalibrada con las tareas cerradas usando las rondas como coste real; se quitan `tolerancia_*` y `modelo_consulta_discrepancia`

## Resultado

**Implementado** (por un agente implementador; revisado por otro).
- **Marca de tiempo**: la celda `fecha` de `## Transiciones` guarda el
  instante UTC (`2026-10-05T14:03:22Z`); `leerTransiciones` acepta tambien las
  filas viejas de solo dia (`precisionDeFecha`, `instanteDe`). `ahora()` en
  `cli.ts` llega a plan, approve, start, review, finish y pausa.
  **Divergencia con el criterio**, que dice «en el frontmatter»: la marca va
  en `tarea.md`, en la fila de su transicion, no en claves del frontmatter.
  Claves `ts_*` duplicarian la tabla (un segundo sitio para el mismo dato) y
  el parser no tiene listas: dos `review` se pisarian. Decidido en el plan.
- **Requisito de riesgos cumplido**: el modo congelado se sigue leyendo con
  filas con hora y con tablas mezcladas (tests, mutacion del regex viejo en
  rojo, y comprobado por CLI real en la revision).
- **`taskctl metricas [--heuristica]`** (solo lectura): diseno, curso,
  revision, rondas, cierre y origen por tarea (`registro`, `git` con un solo
  `git log`, o «—»); nunca NaN, negativos ni 0 por ausencia. Las pausas no se
  descuentan y la salida lo dice. Columnas en una lista, para que TASK-023
  anada las de tokens.
- **Heuristica**: fuera `tolerancia_niveles`,
  `tolerancia_extra_si_heuristica_menor` y `modelo_consulta_discrepancia`
  (codigo y YML en el mismo commit; 19 claves; el error pide reinstalar).
  Recalibrada con `metricas --heuristica` sobre las 43 tareas terminadas con
  informes: el unico corte que separa coste es 0 frente a 1 punto (0 puntos:
  n=16, 1,19 rondas; 1 punto: n=14, 2,29; 2 o mas: n=13, 1,92), asi que
  `nivel_trivial_hasta` pasa de 1 a 0 (coincidencias declarado/heuristico de
  5 a 9 de 43). Los pesos no se tocan: la muestra no los sostiene. El YML
  deja n, periodo, fuente, el comando y el confusor temporal (las 16 tareas
  de 0 puntos son todas recientes): conviene volver a medir.
- Tests que cambian de expectativa: los de las tres claves (revierte la
  decision de TASK-032 de validarlas aunque nadie las leyera) y el corte
  trivial a 0 (revierte la escala literal de §16.1 en su primer corte).
- `npm test` completo (revisor): 1124 tests, 3 rojos (los conocidos de
  Windows).

**Revision (ronda 1, `aprobada`).** Sin CRITICO ni IMPORTANTE.
- MENOR-1 (el ultimo `finish` sin test): **corregido**, test con dos pares
  review/finish (mutacion al primero → rojo).
- MENOR-2 (`--heuristica` sin muestra decia «No hay tareas que medir»):
  **corregido** con un mensaje propio de n=0 y su test por CLI.
- MENOR-3 (calibracion sin test de comportamiento): **corregido**, test de
  `plan` con una tarea trivial de 1 dependencia que lanza 1 rol (mutacion
  `nivel_trivial_hasta: 1` → rojo), y el confusor temporal anotado en el YML.
- MENOR-4 (README dice «desde la 0.5.0» con la version en 0.4.0, y falta el
  aviso de incompatibilidad): se corrige en la release 0.5.0, que sube la
  version y lleva el aviso en el CHANGELOG.
- MENOR-5 (`revision` acumula el hueco entre rondas): **aceptado**, medida de
  calendario y la salida lo dice.
- Tras las correcciones: `test:rapido` 377/377, `metricas` y heuristica
  17/17. Solo MENOR: sin ronda 2.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
| 2026-10-05 | review | manual | persona |
| 2026-10-05 | finish | manual | persona |
