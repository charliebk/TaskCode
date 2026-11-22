---
id: TASK-148
titulo: "Regla 4D: catalogos, config y utilidades en core"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
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

Unificar los lectores de catalogos planos, la validacion de config y las utilidades repetidas de core (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CORE1-03 a CORE1-14, CORE2-08 a CORE2-10, CORE2-15 a CORE2-21).

## Criterios de aceptacion
- [ ] packageRoot y CLAUDE_PLUGIN_ROOT se resuelven en un solo modulo; catalogo-skills, heuristica y doctor-deploy-catalogo comparten el lector de bloques prefijo_N_campo y describirValor
- [ ] config usa masParecida para sugerir, un validador de entero en rango y otro de lista de enumerado; un test falla si CLAVES_CONFIG y el switch de claves no coinciden; SKILL_KEY_RE se deriva de los campos
- [ ] Rutas relativas, fechas, solape de etiquetas, ANSI, redaccion de credenciales, URL de origin, esObjeto y recortar tienen una sola implementacion cada uno
- [ ] Comentarios de config y dondeFalla ciertos; la E/S de plugin-instalado, heuristica y revisores se documenta o se mueve a fs; TRIVIAL_SIN_APROBACION se elimina o se justifica en una linea
