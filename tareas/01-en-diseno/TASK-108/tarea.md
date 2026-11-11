---
id: TASK-108
titulo: "Verificacion proporcional B5: el guardian de merges ante el nivel 2"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-108-verificacion-proporcional-b5-el-guardian
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1428123
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-106]
---
## Objetivo

Quinta parte de TASK-096. Decision de Carlos (D1, 2026-11-11): el guardian de merges NO acepta el verde de la selectiva para codigo; con codigo exige la completa aunque finish haya integrado con la selectiva (lado seguro: los CRITICOS de TASK-101 salieron del punto debil de comandoSoloIntegra). Se fija con tests y se mejora el mensaje cuando un merge a mano queda bloqueado (por ejemplo, tras un conflicto en un finish de nivel 2, o porque develop avanzo y la huella ya no casa). Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [ ] Con rutas_verificacion_parcial declarada: el guardian deja pasar el merge de una tarea sin codigo con el verde de su verificacion de documentacion y bloquea el de una con codigo sin verde de la completa aunque exista el memo de la selectiva (un test por caso, repo temporal)
- [ ] El guardian decide con la config del destino, no con la del arbol (test)
- [ ] El mensaje de bloqueo de un merge con codigo dice que hace falta la completa y como obtenerla (test sobre el texto)
- [ ] Sin la clave nueva el guardian se comporta como en la 0.14.0 (test de regresion)
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T22:40:40Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T22:47:59Z | approve | automatico | automatico | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T22:47:35Z | diseno | agente:a2a5ecc0346d9324a,afe06a71b5b03a1eb,a83a07992ade4abcb | 70 | 157689 | 1239869 | 30495 | 47 | 1428123 | - | - |
