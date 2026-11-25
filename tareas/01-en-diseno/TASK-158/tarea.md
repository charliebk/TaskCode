---
id: TASK-158
titulo: "Regla 4D preventiva en todos los procesos que crean o actualizan codigo"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-24
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Que la Regla 4D (sin duplicacion, desviacion, diluvio ni disfraz) se aplique al escribir codigo y no solo al auditarlo: cada camino del plugin que crea o modifica codigo (plan, implementacion tras start, correcciones de cada ronda, verificar-menores, hotfix y release, agentes del brainstorm, doctor-deploy y skills revisoras) la exige y la comprueba. Decision de Carlos: requisito para publicar la 0.19.0.

## Criterios de aceptacion
- [ ] Hay un inventario en la tarea de cada camino que crea o actualiza codigo, con que exige hoy de 4D y que le falta
- [ ] Cada camino del inventario exige 4D al escribir (instruccion en su skill o agente, y comprobacion de taskctl donde la haya), cerrando los huecos que TASK-153 no cubrio
- [ ] Las correcciones de una ronda de revision y los MENORES corregidos pasan por la misma exigencia 4D que la implementacion (autorrevision 4D por ronda y por correccion)
- [ ] Un test por camino falla si ese camino deja de exigir 4D
- [ ] verificar-impacto no devuelve la copia de dist/src si HEAD cambio durante la ejecucion (carrera del freno con update-fix vista en TASK-145b)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T02:09:52Z | plan | automatico | persona | 0.18.0 |
