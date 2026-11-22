---
id: TASK-137
titulo: "Regla 4D: sin duplicacion, desviacion, diluvio ni disfraz de codigo"
tipo: feature
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-137-regla-4d-sin-duplicacion-desviacion-dilu
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

El plugin asegura que implementadores y revisores no producen codigo 4D (pedido de Carlos, 2026-11-22): 1) Duplicacion: dos funciones o clases que hacen lo mismo con pequenas diferencias; se reutiliza y generaliza (POO, herencia o composicion como eje). 2) Desviacion: se sale del objetivo de la tarea; si hay que cambiar la expectativa se bifurca una tarea nueva o se propone el cambio sin salir del objetivo. 3) Diluvio: avalanchas de lineas y clases donde bastan pocas lineas eficientes. 4) Disfraz: premisas de caso resuelto que no hacen nada o no se comprueban (tests que no prueban, stubs que aparentan). Se sospecha que ya ocurre en TaskCode 0.16.

## Criterios de aceptacion
- [ ] skills/task-workflow/revision.md y las skills revisoras (code-quality-reviewer y las de dominio) describen las 4D con un ejemplo de cada una y clasifican como IMPORTANTE la duplicacion y el disfraz reales
- [ ] La plantilla del informe de revision lleva una seccion '## Regla 4D' con una linea por D (cumple o ID del hallazgo) y taskctl finish avisa si falta o esta vacia, con un test que lo comprueba
- [ ] La skill de implementacion (start) exige antes de pedir revision: buscar el helper existente antes de crear uno, citar el criterio que motiva cada cambio y comprobar por mutacion cada test nuevo; queda anotado en '## Autorrevision'
- [ ] Auditoria de las 10 ultimas tareas terminadas de este repo: docs/auditoria-4d.md lista cada caso 4D encontrado con fichero:linea y la tarea de seguimiento que lo corrige
