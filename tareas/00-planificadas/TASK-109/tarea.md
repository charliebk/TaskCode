---
id: TASK-109
titulo: "Verificacion proporcional B6: documentacion y limpieza del nivel 2"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-109-verificacion-proporcional-b6-documentaci
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-107, TASK-108]
---
## Objetivo

Sexta y ultima parte de TASK-096; hasta cerrarla no se publica version. skills/task-workflow/verificacion-selectiva.md, README y CHANGELOG explican el principio de coste proporcional al cambio y como lo declara un proyecto (rutas_verificacion_parcial leida de la base, lista de permitidas, timeout de la selectiva, cobertura omitida, release y hotfix a la completa, el guardian sigue exigiendo la completa para codigo y por que un merge a mano tras un fallo queda bloqueado). La decision sobre TASK-091 queda escrita. Aviso de doctor si procede, el Ejemplo del error de forma de rutas_verificacion_parcial en validarPatronesExclusion (hoy sale el de excluir_de_revision; nota de la revision 2 de TASK-096), codigo sin uso borrado y motivo de cada test que cambio de expectativa en las partes B1..B5. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [ ] verificacion-selectiva.md, README y CHANGELOG explican el principio y la clave, sin marcas de este repo; la prueba de la guia asevera el contrato literal y se pone roja si se borra la seccion
- [ ] La decision sobre TASK-091 y lo que se retira quedan escritos; el codigo que quede sin uso se borra
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test
