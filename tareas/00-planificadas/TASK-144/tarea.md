---
id: TASK-144
titulo: "Regla 4D: ciclo de vida, cadena y flags en commands"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
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

Cerrar las decisiones del ciclo de vida y de los flags escritas en varios comandos con reglas distintas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-01, CMD1-09, CMD1-10, CMD1-11, CMD2-01 a CMD2-05, CMD2-09, CMD2-14 y FS-01).

## Criterios de aceptacion
- [ ] GUARDADOS_POR_CADENA se deriva de los comandos que escriben o cambian de rama (trocear, verificar-menores, verificar-lote y doctor-deploy incluidos) y un test falla si un comando con autoCommit queda fuera
- [ ] siguiente, verificar-menores y finish comparten una sola definicion de codigo cambiado tras el Commit revisado y del Commit revisado de la ultima ronda; un test con comando_sincronizacion da finish sin pregunta en modo automatico
- [ ] Los flags con valor se leen con extraerRepetible (veredicto, verificar-menores, approve, cadena, finish, doctor-deploy, new) y los booleanos estan todos en FLAGS_SIN_VALOR: --flag=valor se comporta igual en todos los comandos
- [ ] El patron de ficheros de ronda y el de peticiones de rol vienen de rondas.ts y plan-brainstorm.ts; la regla de la tarea vive en su rama y la de que plan cuenta estan en un solo sitio
