---
id: TASK-149
titulo: "Regla 4D: duplicacion en fs, hooks y cli"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
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

Unificar los helpers de E/S, Git y CLI copiados en fs, hooks y cli (auditoria 4D completa, docs/auditoria-4d-completa.md, casos FS-02, FS-03 y FS-05 a FS-18).

## Criterios de aceptacion
- [ ] Un solo envoltorio de git sin lanzar (gitTexto), una sola rama actual, un solo --git-path y un solo parser de la entrada de los hooks; registro-coste y guardia-merge no cargan el modulo del freno
- [ ] doctor-deploy imprime con printAutoCommit y todos los comandos traducen GitCommandError igual, con test de un comando que antes caia en taskctl no pudo arrancar
- [ ] Lockfiles, deteccion de binarios, lectura de cola, busqueda en PATH, JSON con BOM y nombreBase tienen una sola implementacion; los mensajes de evidencia nombran DIRS_EXCLUIDOS
- [ ] extraerPushFlag vive en cli/args.ts y el texto aMano de sincronizacion existe una vez
