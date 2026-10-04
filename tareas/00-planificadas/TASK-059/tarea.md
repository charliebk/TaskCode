---
id: TASK-059
titulo: "Flujo E: modo automatico"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-059-flujo-e-modo-automatico
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Parte de TASK-055 (su plan-final es el diseno de referencia). Todas las preguntas se hacen en plan; despues approve, start, implementacion, review y finish se encadenan sin preguntar, salvo hotfix y release, que paran antes de finish (decision de Carlos, 2026-10-04).

## Criterios de aceptacion
- [ ] Con `modo_flujo: automatico`, tras cerrar plan ningun paso devuelve preguntar salvo los topes y hotfix/release antes de finish
- [ ] approve queda registrado como automatico en `## Transiciones` (deja sin efecto la decision #1 solo en este modo; divergencia documentada)
- [ ] review se lanza sola con la implementacion commiteada y la suite en verde; finish solo con el informe aprobado en un commit propio, posterior a la implementacion y que no toca codigo
- [ ] Tope de 3 rondas de revision: al llegar, se pregunta aunque el modo sea automatico
- [ ] Las guardas abortan tambien en automatico: limite WIP, rama base sucia, informe sin veredicto y `revision_codex: true` sin segunda opinion
- [ ] Test de punta a punta en repo temporal con fixtures en lugar de agentes: el ciclo termina en `04-terminadas` y hay un commit por transicion
- [ ] Smoke manual en Claude Code en un proyecto ajeno con evidencia en el Resultado
