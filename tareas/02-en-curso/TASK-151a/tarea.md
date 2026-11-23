---
id: TASK-151a
titulo: "core, fs, skills e integracion (parte a de TASK-151)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-151-regla-4d-disfraz-en-tests
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
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-151 (Regla 4D: disfraz en tests), partes TASK-151a, TASK-151b en la rama fix/task-151-regla-4d-disfraz-en-tests.

board-format, state-machine, task-store-wip, git cmdQuoteWindows, rondas-aprobada, plugin-instalado y fases fallan con su mutante (M1, M2, M4, M5, TCORE-09, TRES-06, TRES-09).

Objetivo de la tarea entera:

> Que los tests sospechosos de disfraz de la auditoria 4D completa (docs/auditoria-4d-completa.md, casos TCMD-01 a TCMD-05, TCORE-01 a TCORE-03, TCORE-08, TCORE-09, TRES-06 a TRES-09 y TRES-12) fallen cuando se rompe lo que dicen probar. Ocho se confirmaron por mutacion.

## Criterios de aceptacion

- [ ] Las mutaciones M1, M2, M4 y M5 de docs/auditoria-4d-completa.md ponen su test en rojo (board-format, state-machine, task-store-wip, git cmdQuoteWindows) y ultimaRonda se prueba con 10 rondas o mas
- [ ] plugin-instalado y fases comprueban un resultado esperado (un estado concreto; indexOf distinto de -1)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T23:22:47Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T23:22:57Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T23:22:59Z | start | automatico | persona | 0.16.1 |
