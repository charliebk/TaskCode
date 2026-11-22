---
id: TASK-154
titulo: "plan.test.ts en verde en Windows nativo"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-154-plan-test-ts-en-verde-en-windows-nativo
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
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
