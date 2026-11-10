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

Que el coste de verificar una tarea crezca con lo que la tarea cambia, no con el tamano del proyecto. Hoy finish exige comando_verificacion completo en toda tarea: en ToolsaWeb son unos 28 min (18 de cargo test) aunque la tarea solo toque documentacion, y a medida que el proyecto crece ese coste solo sube. Medido el 2026-11-10: 5 de las 7 tareas de ToolsaWeb en 0.11 eran estudios sin codigo, y las 10 de OpenDockTrading son documentos con un script de comprobacion. El proyecto ya sabe clasificar su diff (la selectiva de ToolsaWeb lo hace); TaskCode no deberia duplicar ese conocimiento. La decision de diseno (que el comando del proyecto decida que correr a partir del diff frente a la base, o que TaskCode distinga las rutas sin codigo) se toma en el plan, revisando de forma explicita la decision de TASK-091 de exigir la completa antes de integrar. Esta tarea simplifica: no anade un tercer tipo de verificacion.

## Criterios de aceptacion
- [ ] En un repo temporal cuya tarea solo cambia ficheros .md, taskctl finish integra sin ejecutar la suite de tests del proyecto y su salida dice que verificacion corrio y por que; test de integracion
- [ ] En un repo temporal cuya tarea cambia un fichero de codigo, taskctl finish sigue ejecutando la verificacion completa antes de integrar (test de regresion)
- [ ] El guardian de merges aplica la misma decision que finish para el mismo diff: no bloquea el merge de una tarea sin codigo con verde de su verificacion y si bloquea el de una con codigo sin verde de la completa; un test por caso
- [ ] Un proyecto sin la configuracion nueva se comporta exactamente como en 0.13 (test de regresion de finish y del guardian)
- [ ] El plan deja escrita la decision sobre TASK-091 y lo que se retira; el codigo que quede sin uso se borra y los tests que cambian de expectativa llevan su motivo en Resultado
- [ ] skills/task-workflow (verificacion-selectiva.md), README y CHANGELOG explican el principio de coste proporcional al cambio y como lo declara un proyecto
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
