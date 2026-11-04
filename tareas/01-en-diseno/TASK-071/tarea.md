---
id: TASK-071
titulo: "Hook Stop: una tarea no se da por hecha con la verificacion en rojo"
tipo: feature
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-071-hook-stop-una-tarea-no-se-da-por-hecha-c
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-03
actualizado: 2026-11-04
dependencias: [TASK-069, TASK-070]
---
## Objetivo

Freno 12 de brakes: si hay una tarea en curso, el agente no puede terminar su turno mientras comando_verificacion falle.

## Criterios de aceptacion
- [ ] hooks/hooks.json del plugin declara un Stop hook en Node sin dependencias de runtime
- [ ] El hook solo actua si existe una tarea en 02-en-curso/ en la rama actual y comando_verificacion esta definido; en cualquier otro caso sale 0 sin coste
- [ ] Con la verificacion en rojo devuelve exit 2 y por stderr el comando, el codigo de salida, la duracion y la cola de la salida, acotada en tamano
- [ ] Respeta stop_hook_active para no entrar en bucle y respeta timeout_verificacion
- [ ] Tests contra un repo temporal real: verde deja parar, rojo bloquea, sin tarea no hace nada, timeout

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T14:36:31Z | plan | automatico | persona |
