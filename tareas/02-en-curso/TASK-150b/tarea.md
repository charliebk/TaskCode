---
id: TASK-150b
titulo: "la plantilla del informe en un solo sitio (parte b de TASK-150)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-150a]
---
## Objetivo

Parte b del troceo de TASK-150 (Regla 4D: skills y agentes con una sola fuente por regla), partes TASK-150a, TASK-150b, TASK-150c, TASK-150d en la rama fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f.

CONT-05: las revisoras dejan de copiar la plantilla y remiten a revision.md,
que describe la de `informeTemplate`.

## Criterios de aceptacion
- [ ] La plantilla del informe vive solo en informeTemplate y revision.md; las revisoras remiten a ella en vez de copiarla
- [ ] Un test falla si una revisora vuelve a copiar la plantilla

## Autorrevision

- code-quality-reviewer — 97f9ff3
- 4D — 97f9ff3: helper buscado (ESQUELETO, TITULO_ANTES y CAMPOS_CABECERA de revisores.test.ts reutilizados), usos buscados (titulo, Commit revisado y Contexto adicional pedido en skills/, agents/ y docs/: solo las cinco revisoras; tests 7 y 10c exigian la copia), criterios citados, 2 tests reescritos y 1 asercion, 3 mutaciones en rojo

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T10:59:58Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T11:01:03Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T11:01:05Z | start | automatico | persona | 0.18.0 |
