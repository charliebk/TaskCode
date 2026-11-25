---
id: TASK-161
titulo: "Regla 4D (2a auditoria): duplicacion residual en commands"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-161-regla-4d-2a-auditoria-duplicacion-residu
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

Corregir la duplicacion y los comentarios falsos que quedan en src/commands tras TASK-144, 145 y 146 (segunda auditoria 4D, docs/auditoria-4d-segunda.md).

## Criterios de aceptacion
- [ ] veredicto usa el prefijo y el criterio de core/informe-revision (K2-01)
- [ ] Una sola regla para dos planes, otra rama, arbol sucio tras el verde y la lectura de peticiones de la ultima ronda (K1-1, K1-5, K1-6, K2-02, K2-10)
- [ ] commands usan los helpers de fs/git en vez de sus copias (K1-2, K1-3, K1-4, K1-7, K1-12, K1-13, K2-14)
- [ ] Los comentarios de cadena y board dicen la verdad (K1-10, K1-11)
- [ ] Resto del informe resuelto: K1-9, K1-14 a K1-17, K2-04 a K2-09, K2-12, K2-13 y CMD2-16
