---
id: TASK-006
titulo: "Empaquetado del plugin y validación de carga local"
tipo: feature
sprint: 0
etiquetas: [plugin, empaquetado]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-006-empaquetado-plugin
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

Verificar de punta a punta que el plugin se puede instalar en local con
`/plugin install <ruta-local>` en Claude Code y que `taskctl` queda en el
PATH del Bash tool. Documentar el procedimiento exacto en
`taskcode-marketplace/plugins/taskcode-plugin/README.md`.

## Criterios de aceptación

- [ ] Instalación local documentada y probada manualmente (evidencia en el
      README: comandos ejecutados y salida).
- [ ] `taskctl --help` accesible desde una sesión nueva de Claude Code tras
      la instalación, sin rutas absolutas hardcodeadas.
- [ ] Nota explícita de que el mecanismo determinista para comprobar
      instalación (sección 14 de la metodología) sigue sin confirmarse con
      documentación oficial — no bloquea esta tarea, se deja registrado.
