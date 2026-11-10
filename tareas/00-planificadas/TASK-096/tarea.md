---
id: TASK-096
titulo: "Verificacion proporcional al cambio: una tarea sin codigo no corre la suite de tests"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-096-verificacion-proporcional-al-cambio-una
asignado_a: null
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

Objetivo principal: aumentar la agilidad sin perder calidad. Que el coste de verificar crezca con lo que la tarea cambia, no con el tamano del proyecto: los tests son necesarios, pero no en todos los momentos ni en todas las tareas. A medida que un proyecto crece, crecen sus tests, y hoy se pagan enteros aunque la tarea no los toque. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): finish exige la completa en toda tarea (en ToolsaWeb unos 28 min, 18 de cargo test, tambien en tareas de solo documentacion); el freno Stop verifica al final de cada turno; 5 de las 7 tareas de ToolsaWeb en 0.11 eran estudios sin codigo, y las 10 de OpenDockTrading son documentos con un script de comprobacion. Tres niveles segun el diff de la tarea frente a la base, en los tres momentos (fin de turno, ronda de revision y finish): (1) solo documentacion: no se corre la suite de tests, solo las comprobaciones de documentacion si el proyecto las tiene; (2) una parte del codigo: los tests de lo afectado; (3) codigo transversal o sin clasificar: la suite completa. Se conserva la garantia de la 0.8/0.9 de no integrar nada roto: lo que no se pueda clasificar con seguridad va a la completa. El proyecto ya sabe clasificar su diff (la selectiva de ToolsaWeb lo hace); TaskCode no deberia duplicar ese conocimiento. La forma concreta (que el comando del proyecto decida que correr a partir del diff, o que TaskCode distinga rutas) se decide en el plan, revisando de forma explicita la decision de TASK-091 de exigir la completa antes de integrar. No se retira ningun freno: se ajusta su coste.

## Criterios de aceptacion
- [ ] En un repo temporal cuya tarea solo cambia ficheros .md, taskctl finish integra sin ejecutar la suite de tests del proyecto y su salida dice que verificacion corrio y por que; test de integracion
- [ ] En un repo temporal cuya tarea cambia una parte del codigo que el proyecto clasifica, finish ejecuta solo la verificacion de lo afectado y lo dice en su salida; con codigo transversal o sin clasificar ejecuta la completa (un test por caso)
- [ ] El freno Stop y taskctl review aplican el mismo nivel al mismo diff: un turno o una ronda que solo tocan documentacion no corren la suite de tests (test por cada uno)
- [ ] El guardian de merges aplica la misma decision que finish para el mismo diff: no bloquea el merge de una tarea sin codigo con verde de su verificacion y si bloquea el de una con codigo sin verde de la completa; un test por caso
- [ ] Un proyecto sin la configuracion nueva se comporta exactamente como en 0.13 (test de regresion de finish y del guardian)
- [ ] El plan deja escrita la decision sobre TASK-091 y lo que se retira; el codigo que quede sin uso se borra y los tests que cambian de expectativa llevan su motivo en Resultado
- [ ] skills/task-workflow (verificacion-selectiva.md), README y CHANGELOG explican el principio de coste proporcional al cambio y como lo declara un proyecto
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
