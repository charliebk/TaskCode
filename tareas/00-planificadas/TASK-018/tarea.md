---
id: TASK-018
titulo: "Enrutado de revisor por diff real, fragmentado por dominio"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: planificada
plan_aprobado: false
rama: feature/task-018-enrutado-de-revisor-por-diff-real-fragme
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-013]
---
## Objetivo

Hoy `taskctl review` siempre invoca al mismo agente revisor declarado en
`tarea.md` (`agente_revisor`), sin mirar qué toca de verdad el diff de la
rama. TASK-032 (D6/D7) ya dejó redactadas cuatro skills revisoras por dominio
(java-spring, angular-vue, csharp-autocad-ifc, code-quality) con sus
`patrones_archivo` declarados y probados en las dos direcciones
(`path.matchesGlob`), y `code-quality-reviewer` ya se marca `fallback: true`
con el umbral de dominios fijado en 3 (decisión #16). Falta la pieza que los
conecta con el ciclo real: que `taskctl review` clasifique el diff real de la
rama por esos patrones, lance un revisor por cada dominio detectado hasta el
umbral, y caiga al revisor genérico por encima de él o cuando ningún patrón
case.

## Criterios de aceptacion
- [ ] Clasifica el diff real de la rama por dominio en vez de por el tipo declarado de la tarea.
- [ ] Fragmenta la revisión en un agente por dominio hasta el umbral que fije el punto 16 de la sección 14, y por encima de ese umbral cae a un único revisor genérico.
- [ ] Cada revisor recibe solo el subconjunto del diff de su dominio.
- [ ] Tests con diffs sintéticos que cubren un dominio, varios por debajo del umbral y varios por encima.
