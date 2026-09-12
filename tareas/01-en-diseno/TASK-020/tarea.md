---
id: TASK-020
titulo: "Comando taskctl codex-review (segunda opinión independiente)"
tipo: feature
sprint: 3
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-020-comando-taskctl-codex-review-segunda-opi
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-12
dependencias: [TASK-013]
---
## Objetivo

`revision_codex: true` en `tarea.md` ya está soportado por la máquina de
estados (`src/core/state-machine.ts`, caso `'codex-review'`: exige estado
`en-revision`, `revision_codex: true` y revisión primaria ya aprobada) y por
`taskctl finish` (`INFORME_CODEX_RE`, `informesDeLaRonda` ya reutilizada
desde TASK-018: exige que el informe de Codex también apruebe si
`revision_codex` está activo). Lo que falta es el propio comando: `cli.ts`
no enruta ningún subcomando `codex-review`, y no existe ningún
`src/commands/codex-review.ts` que invoque el CLI de Codex y escriba
`informe-codex-N.md`.

El CLI de Codex (`codex-cli`, de OpenAI) SÍ está instalado en esta máquina
(`codex --version` → `codex-cli 0.144.1`) y trae un subcomando hecho
justo para esto: `codex review --base <rama> [--commit <sha>]
[--title <texto>] [prompt]`, no interactivo, que revisa el diff contra una
rama base y admite instrucciones propias. Un `codex` ausente del PATH debe
degradar con un aviso, sin romper el flujo (criterio de aceptación 3) —
`taskctl` ya tiene precedente de esto con los scripts de Git-Flow
(`detect_origin_available` en `git.ts`, o el propio patrón de "avisa y
continúa en local" cuando no hay `origin`).

## Criterios de aceptacion
- [ ] Solo se ejecuta si la revisión primaria ya está aprobada y la tarea tiene `revision_codex: true`.
- [ ] Envuelve el CLI de Codex y guarda su salida en la carpeta de la tarea, sin mezclarla con la de la revisión primaria.
- [ ] Si Codex no está instalado, avisa y degrada con elegancia en vez de romper el flujo.
- [ ] Tests que cubren la precondición de estado y la ausencia del CLI.
