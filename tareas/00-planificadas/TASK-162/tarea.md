---
id: TASK-162
titulo: "Regla 4D (2a auditoria): envoltorios de git y helpers en fs, hooks y cli"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-162-regla-4d-2a-auditoria-envoltorios-de-git
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

Terminar la unificacion de los envoltorios de git y de los helpers de fs, hooks y cli que dejaron a medias TASK-145 y TASK-149 (segunda auditoria 4D, docs/auditoria-4d-segunda.md).

## Criterios de aceptacion
- [ ] git.ts lanza git por un envoltorio con GIT_TERMINAL_PROMPT=0, GIT_OPTIONAL_LOCKS=0 y limite de tiempo, con una sola resolucion a commit (FS-1, FS-2, FS-3, HK-8)
- [ ] Un helper para ETIMEDOUT, ruta dentro de la raiz, cambios en rutas, listado de tareas y readdir que tolera la ausencia (FS-4 a FS-7, FS-9)
- [ ] Los hooks comparten lectura de stdin, decision, preambulo y comprobacion de cwd, con un solo bloque de ya integrado (HK-1, HK-3, HK-4, HK-6, HK-7, HK-12, HK-13)
- [ ] cli usa printAvisos, printCliError y el aviso de cambio de rama comunes (HK-9, HK-10, HK-11, HK-15)
- [ ] Resto del informe resuelto: FS-8, FS-10 a FS-16, FS-18 y HK-14
