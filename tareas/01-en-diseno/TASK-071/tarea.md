---
id: TASK-071
titulo: "Hook Stop: una tarea no se da por hecha con la verificacion en rojo"
tipo: feature
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-071-hook-stop-una-tarea-no-se-da-por-hecha-c
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1594186
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
| 2026-11-04T14:57:33Z | approve | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04T14:57:31Z | diseno | agente:a039c44f934621126,a784ea3c4238e61a2,a66d1c8e5dd8b5bcf,a1d7d4e757e52cfb9 | 64 | 270276 | 1282066 | 41780 | 41 | 1594186 |
