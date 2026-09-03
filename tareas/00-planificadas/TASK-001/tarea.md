---
id: TASK-001
titulo: "Scaffold del proyecto taskctl (plugin.json, bin/, tsconfig, test runner)"
tipo: feature
sprint: 0
etiquetas: [scaffold, infraestructura, taskctl]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-001-scaffold-taskctl
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: []
---
## Objetivo

Crear el esqueleto del plugin `taskctl` dentro de `taskcode-marketplace/plugins/taskcode-plugin/`:
`.claude-plugin/plugin.json`, `bin/taskctl` (entry point ejecutable), `package.json`
sin dependencias externas, `tsconfig.json` en modo estricto, y un runner de
tests basado en `node:test` (built-in de Node 18+, sin dependencia externa).

## Criterios de aceptación

- [ ] `.claude-plugin/plugin.json` válido con `name`, `description`, `version`.
- [ ] `bin/taskctl` ejecuta y muestra ayuda (`taskctl --help`) sin errores.
- [ ] `npm run build` compila TypeScript a `dist/` sin warnings.
- [ ] `npm test` corre (aunque sea 0 tests todavía) usando `node --test`.
- [ ] `npm run lint` (tsc --noEmit en modo estricto) pasa sin errores.
- [ ] Sin dependencias en `package.json` salvo `devDependencies` (typescript,
      @types/node).
