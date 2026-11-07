---
id: TASK-087
titulo: "taskctl doctor avisa si el plugin instalado esta desactualizado"
tipo: feature
sprint: 0
etiquetas: [doctor, distribucion]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-087-taskctl-doctor-avisa-si-el-plugin-instal
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Un equipo estuvo en 0.8.0 mientras el repo iba por 0.10.0 sin saberlo. doctor compara la version instalada con la del marketplace local y avisa.

## Criterios de aceptacion
- [ ] taskctl doctor da un AVISO con la version instalada, la disponible y los comandos de actualizacion cuando la del marketplace es mayor
- [ ] Sin marketplace local o sin red no falla: informa de que no pudo comprobarlo
- [ ] No cambia el codigo de salida de doctor; lo cubren tests con ficheros de plugins temporales
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)
