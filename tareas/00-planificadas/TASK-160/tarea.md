---
id: TASK-160
titulo: "Regla 4D (2a auditoria): duplicacion residual en core"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-160-regla-4d-2a-auditoria-duplicacion-residu
asignado_a: null
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
dependencias: []
---
## Objetivo

Corregir la duplicacion, los comentarios falsos y el diluvio que quedan en src/core tras TASK-147 y TASK-148 (segunda auditoria 4D, docs/auditoria-4d-segunda.md).

## Criterios de aceptacion
- [ ] Catalogos con un solo cargador y un esqueleto de agrupacion comun (C1-1, C1-2, CORE1-04)
- [ ] esObjeto, recortar, deteccion de EOL y las regex semver y del ID sin copias en linea (C1-3, C1-7, C2-9, C2-11, C2-13, C2-17)
- [ ] config sin validadores duplicados y con la politica de repetidos explicada, y comando-merge clasifica igual git merge -m --continue (C1-6, CORE1-07, CORE1-09)
- [ ] metricas, informe-revision e informe-verificacion sin calculos repetidos (C2-12, C2-18 a C2-22, CORE2-11, CORE2-20)
- [ ] Comentarios, reexportaciones y codigo redundante restantes resueltos (C1-8, C2-8, C2-15, C2-16, C2-23 a C2-27, C2-29)
