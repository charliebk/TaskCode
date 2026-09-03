---
id: TASK-002
titulo: "Modelo de tarea, parser de tarea.md y máquina de estados"
tipo: feature
sprint: 0
etiquetas: [core, maquina-de-estados, parser]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-002-maquina-estados
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-001]
---
## Objetivo

Implementar en `src/core/`:
1. `task.ts` — tipo `Task` con todos los campos de la plantilla (sección 4
   de la metodología) y su validación.
2. `frontmatter.ts` — parser/writer YAML-frontmatter escrito a mano (sin
   `js-yaml`), suficiente para el subconjunto de YAML que usa `tarea.md`
   (escalares, listas simples `[a, b, c]`, `null`, booleanos, fechas).
3. `state-machine.ts` — tabla de transiciones legales de la sección 8.1 de
   la metodología (comando actual → estado requerido → estado resultante),
   con un error tipado y explícito cuando se viola el orden (p. ej.
   `taskctl plan` sobre una tarea que no está en `planificada`).

## Criterios de aceptación

- [ ] `parseTarea(contenido: string): Task` y `serializeTarea(t: Task): string`
      son inversos exactos en un roundtrip (parse→serialize→parse da el mismo
      objeto) para al menos 5 casos de prueba distintos.
- [ ] La máquina de estados rechaza explícitamente, con tests: `plan` antes
      de `import`/`new`, `start` antes de `plan`/`approve`, `approve` con
      `plan_aprobado` ya en `true`, y cualquier comando sobre una tarea en
      `04-terminadas`.
- [ ] Cobertura de `src/core/` ≥ 85% (medida con `node --test --experimental-test-coverage`).
- [ ] Todos los tests son deterministas (sin fechas/aleatoriedad sin fijar).
