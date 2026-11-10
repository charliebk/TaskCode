---
id: TASK-097
titulo: "Regla de una hora: plan estima la duracion de punta a punta y propone trocear"
tipo: feature
sprint: 0
etiquetas: [plan, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-097-regla-de-una-hora-plan-estima-la-duracio
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Ley de agilidad (decision de Carlos, 2026-11-10): una tarea prevista de mas de 1 hora de punta a punta (de la rama abierta al cierre con merge) se parte en varias. Medido en 147 tareas: el mejor predictor de la duracion son los ficheros de codigo (correlacion 0,40; capas 0,28; criterios 0,23); con 1-10 ficheros de codigo la mitad cierra en una hora, con 11 o mas solo el 16 %. Se estima al planificar, el plan lo deja escrito, la persona decide en approve y finish mide el tiempo real para calibrar. Partir por capas solo si cada parte se verifica sola; si no, una porcion vertical pequena.

## Criterios de aceptacion
- [ ] plan-final.md lleva la linea 'Duracion estimada: N min' con sus senales (ficheros de codigo previstos, capas, criterios); taskctl approve avisa si falta (test)
- [ ] Si la estimacion supera 60 min, taskctl siguiente en la fase approve devuelve preguntar en cualquier modo y su motivo propone trocear; con 60 o menos, nada cambia (test por cada caso)
- [ ] taskctl finish anota en tarea.md los minutos reales de punta a punta (de start a finish, sin pausas) junto a la estimacion, y taskctl metricas los muestra (test en un repo temporal)
- [ ] skills/plan y skills/task-workflow explican la regla, las senales y como trocear (porcion vertical frente a capas); README y CHANGELOG la anotan
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T15:13:25Z | plan | automatico | persona | 0.13.0 |
