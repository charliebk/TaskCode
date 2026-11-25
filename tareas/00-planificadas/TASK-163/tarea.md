---
id: TASK-163
titulo: "Regla 4D (2a auditoria): Git-Flow residual y hotfix sin develop"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-163-regla-4d-2a-auditoria-git-flow-residual
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Corregir el hotfix que deja main mergeada sin develop y llevar las funciones comunes de TASK-143 a los scripts que se quedaron fuera (segunda auditoria 4D, docs/auditoria-4d-segunda.md).

## Criterios de aceptacion
- [ ] merge-hotfix-to-main y merge-release-to-main abortan antes de tocar main si develop no existe en local ni en origin, con test (SC-01)
- [ ] resume-work, recover-branch, create-develop, start-work, diagnose-repo, pause-work y switch-working-remote usan las funciones comunes de _gitflow-common.sh (SC-02, SC-04, SC-05, SC-10, SC-11)
- [ ] taskctl diagnose pasa --develop con la rama de integracion (SC-03)
- [ ] La cabecera de verificar-impacto coincide con la selectiva y perfil-tests comparte su build (SC-06, SC-13)
- [ ] Resto del informe resuelto: SC-09, SC-12 y SC-14 a SC-17
