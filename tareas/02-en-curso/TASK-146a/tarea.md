---
id: TASK-146a
titulo: "import, roadmap y verificar-lote (parte a de TASK-146)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-146-regla-4d-duplicacion-en-new-import-roadm
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
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

- [ ] import valida y compone la tarea con lo mismo que new (componerCuerpo, defaults, propuesta de complejidad), y el modelo por defecto esta en un solo sitio
- [ ] roadmap --comparar decide con prepararRoadmap, y verificar-lote usa headCommit y listTareasEnEstados sin dar un lote verde ante un fallo de git o de readdir

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T14:26:27Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T14:27:01Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T14:27:04Z | start | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 6e51ed4: parsearCamposDeTarea en new.ts (import ya importaba de new) en vez de un modulo nuevo; MODELO_POR_DEFECTO tambien para doctor-deploy; --comparar reutiliza prepararRoadmap con escribir:false en vez de duplicar sus reglas; verificar-lote reutiliza headCommit, listTareasEnEstados y compararIds; la propuesta de complejidad no se lleva a import porque depende de etiquetas e import no tiene (seria un disfraz: proponerComplejidad([]) siempre null); mutaciones en rojo: --comparar sin la decision y verificar-lote tragandose el error de lectura; el test de paridad new/import compara campos, defaults y mensajes de error
- code-quality-reviewer — 6e51ed4
