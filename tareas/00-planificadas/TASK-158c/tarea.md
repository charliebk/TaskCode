---
id: TASK-158c
titulo: "verificar-impacto no devuelve dist/src si HEAD cambio (parte c de TASK-158)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
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
dependencias: [TASK-158b]
---
## Objetivo

Parte c del troceo de TASK-158 (Regla 4D preventiva en todos los procesos que crean o actualizan codigo), partes TASK-158a, TASK-158b, TASK-158c en la rama feature/task-158-regla-4d-preventiva-en-todos-los-proceso.

Al tomar la copia se anota HEAD; al devolverla, si HEAD es otro, no se
devuelve la copia: dist/src se deja como lo dejo el checkout nuevo
(restaurado desde HEAD) y se avisa.

Troceo sin preguntar: Carlos autorizo el 2026-11-22 trocear las tareas de
mas de 1 h de las correcciones 4D sin consultarlo.

## Criterios de aceptacion
- [ ] verificar-impacto no devuelve la copia de dist/src si HEAD cambio durante la ejecucion (carrera del freno con update-fix vista en TASK-145b)
