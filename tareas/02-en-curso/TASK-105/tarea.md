---
id: TASK-105
titulo: "Verificacion proporcional B2: decision entre refs y huella para el nivel 2"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-105-verificacion-proporcional-b2-decision-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 697110
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-096]
---
## Objetivo

Segunda parte de TASK-096 (troceada por la regla de una hora, decision de Carlos 2026-11-11). Sobre la decision pura de TASK-096 (clave rutas_verificacion_parcial y resultado selectiva), decidirVerificacionEntre hace un segundo rutasDeTarea con los patrones documentacion + parcial solo si la base declara la clave y el diff no es solo documentacion; huellaDeCommit acepta un contexto opcional como huellaDelArbol; verificarConMemo no guarda el memo selectiva con el arbol sucio. Nada observable cambia todavia: finish y el guardian siguen tratando selectiva como completa. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [ ] Con la clave declarada en la base, decidirVerificacionEntre devuelve selectiva si todo lo que no es documentacion cae en rutas_verificacion_parcial y completa si algo queda fuera, cambia .taskcode/config.yml o el diff no se puede calcular (un test por caso, repo temporal)
- [ ] Sin la clave no se lanza ningun git de mas y la decision es la de la 0.14.0 (test)
- [ ] huellaDeCommit con contexto casa con la huella que guarda la selectiva para la misma base; el memo selectiva no se guarda con el arbol sucio (test por caso)
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T16:31:34Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T16:53:15Z | approve | automatico | persona | 0.14.0 |
| 2026-11-11T16:53:25Z | start | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T16:50:15Z | diseno | agente:a25a8c72b6ced7c56,a089636ad00421193,a603edf36e62845a4 | 42 | 135991 | 532020 | 29057 | 35 | 697110 | - | - |
