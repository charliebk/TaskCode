---
id: TASK-146a
titulo: "import, roadmap y verificar-lote (parte a de TASK-146)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-146-regla-4d-duplicacion-en-new-import-roadm
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 21523947
tokens_revision: 5706765
creado: 2026-11-22
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-146 (Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste), partes TASK-146a, TASK-146b en la rama fix/task-146-regla-4d-duplicacion-en-new-import-roadm.

import compone como new con el modelo por defecto en un sitio; roadmap --comparar decide con prepararRoadmap; verificar-lote usa headCommit y listTareasEnEstados y no da un lote verde con un fallo.

Objetivo de la tarea entera:

> Quitar las reimplementaciones de helpers existentes en comandos sueltos (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD2-06, CMD2-07, CMD2-10 a CMD2-13, CMD2-15, CMD2-16 y CMD1-08).

## Criterios de aceptacion

- [x] import valida y compone la tarea con lo mismo que new (componerCuerpo, defaults, propuesta de complejidad), y el modelo por defecto esta en un solo sitio
- [x] roadmap --comparar decide con prepararRoadmap, y verificar-lote usa headCommit y listTareasEnEstados sin dar un lote verde ante un fallo de git o de readdir

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T14:26:27Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T14:27:01Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T14:27:04Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T14:48:24Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T15:09:03Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T15:32:23Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 6e51ed4: parsearCamposDeTarea en new.ts (import ya importaba de new) en vez de un modulo nuevo; MODELO_POR_DEFECTO tambien para doctor-deploy; --comparar reutiliza prepararRoadmap con escribir:false en vez de duplicar sus reglas; verificar-lote reutiliza headCommit, listTareasEnEstados y compararIds; la propuesta de complejidad no se lleva a import porque depende de etiquetas e import no tiene (seria un disfraz: proponerComplejidad([]) siempre null); mutaciones en rojo: --comparar sin la decision y verificar-lote tragandose el error de lectura; el test de paridad new/import compara campos, defaults y mensajes de error
- code-quality-reviewer — 6e51ed4
- 4D — de2a5bd: commitDeHead en deps (como timeoutMs, solo tests) para provocar el fallo de git; tests de ilegible, orden numerico y fallido de --comparar con mensaje propio; MEN-2 aceptado
- code-quality-reviewer — de2a5bd (ronda 2)

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T14:48:24Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 68 | 48235 | 21454125 | 21519 | 20 | 21523947 | - | - |
| 2026-11-24T15:08:57Z | revision | agente:a8a5850237b04d996 | 42 | 133912 | 2436799 | 11447 | 6 | 2582200 | 1 | - |
| 2026-11-24T15:29:54Z | revision | agente:a534d8a3e4d3f6d7b | 54 | 131937 | 2976100 | 16474 | 8 | 3124565 | 2 | - |

## Resultado

- CMD2-06: `parsearCamposDeTarea` y `MODELO_POR_DEFECTO` en new.ts, compartidos por new, import y doctor-deploy. import compone el cuerpo con `componerCuerpo`. Un test de paridad fija campos, valores por defecto y mensajes de error. La propuesta de complejidad no se lleva a import: depende de las etiquetas e import no tiene, así que `proponerComplejidad([])` siempre daría null. El revisor lo confirma.
- CMD2-07: `roadmap --comparar` decide con `prepararRoadmap(..., { escribir: false })`, que puede dar el estado nuevo `se-escribiria`. Un ROADMAP marcado con cambios sin commitear ya no sale como regenerable, y el caso `fallido` tiene su propio mensaje.
- CMD2-10 y CMD2-11: verificar-lote usa `headCommit`, `listTareasEnEstados` y `compararIds`. Un fallo de git, una carpeta ilegible o una tarea ilegible abortan, cada uno con su test.
- Revisión: la ronda 1 pidió cambios (IMP-1 e IMP-2: protecciones sin test). MEN-1 y MEN-3 se corrigieron. MEN-2, la doble lectura de cada tarea, se acepta porque evitarla obligaría a ampliar `listTareasEnEstados`, que comparten otros comandos. La ronda 2 aprueba.

## Verificacion parcial

- 2026-11-24T15:29:57Z: todo el codigo que cambia la tarea (15 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 55 min
- Real (de la rama abierta al cierre con merge, sin pausas): 65 min
- Paso de la hora: 65 min reales frente a 55 estimados
- Cierre (finish): 146 s, de 2026-11-24T15:29:57Z a 2026-11-24T15:32:23Z
