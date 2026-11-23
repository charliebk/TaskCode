---
id: TASK-151b
titulo: "commands, hooks y cli (parte b de TASK-151)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-151-regla-4d-disfraz-en-tests
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-151a]
---
## Objetivo

Parte b del troceo de TASK-151 (Regla 4D: disfraz en tests), partes TASK-151a, TASK-151b en la rama fix/task-151-regla-4d-disfraz-en-tests.

doctor-deploy, review-incremental, salida-temprana, cli/estado, doctor-correcciones, approve, plan, start y guardia-documentacion fallan con su mutante (M6 a M10, TCMD-01 a TCMD-05, TRES-07).

## Criterios de aceptacion
- [ ] Las mutaciones M6, M7, M8, M9 y M10 ponen su test en rojo (doctor-deploy DIRS_EXCLUIDOS, review-incremental, salida-temprana, cli/estado); review-incremental corre en Linux; doctor-correcciones no convierte un timeout ausente en skip
- [ ] Los tests que prometen sin efectos secundarios o workspace limpio lo comprueban con git status, los que prometen error claro miran el mensaje, y guardia-documentacion comprueba cuenta-sel

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T23:49:31Z | plan | automatico | persona | 0.16.1 |
