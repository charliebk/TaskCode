---
id: TASK-150
titulo: "Regla 4D: skills y agentes con una sola fuente por regla"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-22
dependencias: []
---
## Objetivo

Que cada regla de las skills y agentes este escrita en un solo sitio y coincida con el codigo (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CONT-01 a CONT-18 y CORE2-03).

## Criterios de aceptacion
- [ ] sincronizacion.md, cierre.md, review y tests-pesados dicen lo mismo que el codigo y que revision.md (clave desconocida avisa, finish avisa de casillas, test duplicado sigue la Regla 4D); las revisoras no piden contexto explicitamente
- [ ] La plantilla del informe vive solo en informeTemplate y revision.md; las revisoras remiten a ella en vez de copiarla
- [ ] Los formatos de salida de los agentes brainstorm coinciden con roles-brainstorm.ts y las secciones del plan (Duracion estimada y presupuesto de tests incluidos) salen de una sola fuente que usan plan.ts, plan-brainstorm.ts y el unificador
- [ ] La linea 4D de Autorrevision la exige el aviso de review; los pasos copiados (cadena, coste, tope de rondas, MENORES) remiten a una sola guia; sin diluvio ni historial de versiones en las skills; la sonda de hooks inerte sale del plugin
