---
id: TASK-139
titulo: "Regla 4D: tests que no protegen lo que dicen"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di
asignado_a: null
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

Cerrar los disfraces que encontro la auditoria 4D de TASK-137 (docs/auditoria-4d.md, casos B1-B5): enlaces y ramas sin test, aserciones que solo corren en Windows y tests duplicados.

## Criterios de aceptacion
- [ ] Un test falla si task-workflow/SKILL.md deja de enlazar poda-tests.md
- [ ] La rama de cerrojo ilegible de scripts/verificar-impacto.mjs tiene un test que falla al romperla
- [ ] Las aserciones del mensaje bash de Git de doctor tienen equivalente que corre en Linux, o se documenta por que no
- [ ] El test de 1100 ficheros de review-tests-stat se elimina o se justifica frente al de 1300 rutas, y los criterios de TASK-133 quedan marcados segun su Resultado
- [ ] La verificacion selectiva no deja tests afectados sin correr en silencio: hoy recorta a 10 de N («Seleccion recortada») y finish se conforma con ella cuando la tarea solo toca src/test; en TASK-153c eso dejo en develop dos rojos de test/commands/metricas.test.ts que nadie ejecuto hasta TASK-144b. O finish corre todos los afectados, o el recorte obliga a la completa, con test
