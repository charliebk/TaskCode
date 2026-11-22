---
id: TASK-154
titulo: "plan.test.ts en verde en Windows nativo"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-154-plan-test-ts-en-verde-en-windows-nativo
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 1536264
tokens_revision: 1281302
creado: 2026-11-22
actualizado: 2026-11-22
dependencias: []
---
## Objetivo

Los 2 tests de plan.test.ts que fallan siempre en Windows nativo (chmod sin efecto en NTFS y finales de linea CRLF) bloquean la verificacion selectiva de review y la completa de finish cada vez que una tarea toca plan.ts. Que pasen, o se omitan con motivo solo cuando de verdad no aplican, sin dejar de probar lo que prueban en Linux y en el CI.

## Criterios de aceptacion
- [ ] El test de error de escritura distinto de EEXIST se omite con motivo solo si chmod no impide escribir en ese sistema de ficheros, y sigue ejecutandose donde chmod funciona
- [ ] El test de la rama base real compara el plan sin depender de los finales de linea (CRLF de core.autocrlf)
- [ ] npm test en Windows nativo no tiene ningun rojo de plan.test.ts; CLAUDE.md deja de listar esos dos rojos como esperados

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-22T23:19:36Z | plan | automatico | persona | 0.16.1 |
| 2026-11-22T23:19:38Z | approve | automatico | persona | 0.16.1 |
| 2026-11-22T23:20:30Z | start | automatico | persona | 0.16.1 |
| 2026-11-22T23:22:29Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 2a8ab84: helper buscado (patron de skip con motivo de TASK-120 en approve.test.ts); criterios citados; 0 tests nuevos, mutacion de la normalizacion CRLF en rojo.
- code-quality-reviewer — 2a8ab84

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-22T23:22:29Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 6 | 3123 | 1529766 | 3369 | 0 | 1536264 | - | - |
| 2026-11-22T23:30:25Z | revision | agente:a8ce3cf373e0a055e | 24 | 114794 | 1160055 | 6429 | 3 | 1281302 | 1 | - |

## Verificacion ligera

- 2026-11-22T23:30:26Z: ronda 1; commit revisado e837ccec5ec2503b8eba5799b583deda4964296f; commit verificado 6d0430bea831344b78e3d77ee5d810c4e2b91763; ficheros: docs/contexto/ESTADO.md, docs/contexto/PROMPT_INICIAL.md; corregidos: MENOR-1; pendientes: ninguno
