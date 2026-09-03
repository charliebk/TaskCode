---
id: TASK-010
titulo: "taskctl plan: version minima, un solo agente redacta plan-final.md"
tipo: feature
sprint: 1
etiquetas: [cli, taskctl, diseno]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-010-taskctl-plan-version-minima-un-solo-agen
asignado_a: charlie.bk
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-002]
---
## Objetivo

Implementar `taskctl plan <TASK-ID>`: version MINIMA de la fase de
diseno (seccion 6 de la metodologia). La version completa (contexto
determinista desde `docs/INDEX.md`, gatekeeper barato con Haiku,
seleccion de skill 6.6, brainstorm multi-agente en paralelo por rol,
agente unificador) es Sprint 3 (TASK-016/017) — fuera de alcance aqui a
proposito, igual que TASK-009 dejo la precondicion completa de rama
base (8.3) para TASK-012.

Lo que SI hace esta version, con el mismo espiritu que ya establecio
`taskctl new` con el cuerpo de `tarea.md` (Objetivo/Criterios en blanco
para rellenar despues):

1. Validar la transicion con `assertTransitionAllowed('plan', ...)`
   (TASK-002): primera vez desde `planificada`, o re-planificacion desde
   `en-diseno` con `plan_aprobado: false`.
2. Mover la tarea a `01-en-diseno/` (reusa `moveTareaFile` de TASK-009 —
   sirve tal cual, sin necesidad de tocar Git; validacion extra de que
   esa funcion es reutilizable mas alla de su caso original).
3. Dejar un scaffold de `plan-final.md` listo para que un agente (o una
   persona, en uso interactivo real de Claude Code) lo redacte
   despues — el contenido real del plan NO lo genera el CLI (no hay
   orquestacion de agentes en este Node CLI todavia; eso llega con
   TASK-016). Si `plan-final.md` ya existe (caso de re-planificacion),
   se deja intacto, no se pisa.

`taskctl approve` (TASK-011) ya comprueba en TASK-002 que exista
`plan-final.md` (`ctx.planFinalExiste`) antes de dejar aprobar — este
comando es lo que lo deja listo para esa comprobacion.

## Criterios de aceptacion

- [ ] `taskctl plan TASK-NNN` mueve la tarea de `00-planificadas/` a
      `01-en-diseno/` y crea `plan-final.md` con un scaffold, cuando la
      tarea esta en `planificada`.
- [ ] Re-planificacion: si la tarea ya esta en `en-diseno` con
      `plan_aprobado: false`, vuelve a ejecutar sin fallar, NO pisa un
      `plan-final.md` ya existente, y sigue actualizando `actualizado`.
- [ ] Rechaza el comando (sin tocar nada) si la tarea no existe, si esta
      en un estado que no admite `plan` (p. ej. `en-curso`), o si ya
      tiene `plan_aprobado: true` — reusa `assertTransitionAllowed` de
      TASK-002, con test que confirma que no hay efectos secundarios.
- [ ] Revision por pares de un agente independiente sobre el diff
      completo, sin hallazgos criticos sin resolver.
