---
id: TASK-077
titulo: "Guardian de merges: opciones con valor antes de -c y doc de bash -c"
tipo: fix
sprint: 0
etiquetas: [hooks]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-077-guardian-de-merges-opciones-con-valor-an
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-04
actualizado: 2026-11-04
dependencias: []
---
## Objetivo

Cerrar lo que quedo abierto de TASK-072: que bash -o pipefail -c y bash --rcfile f -c no esquiven el guardian de merges (MEN-4), y documentar que el guardian analiza el texto de bash -c, pwsh -Command y cmd /c.

## Criterios de aceptacion
- [ ] analizarComando('bash -o pipefail -c "git merge x"') y analizarComando('bash --rcfile f -c "git merge x"') devuelven el merge de x; tambien +o, --init-file y -O
- [ ] bash -x script.sh rama y bash script.sh rama siguen detectandose como script de cierre, con test en test/hooks/guardia-merge.test.ts
- [ ] README del plugin y CHANGELOG.md dicen que el guardian analiza el texto de bash -c, pwsh -Command y cmd /c
- [ ] npm test en verde salvo los 5 rojos conocidos de Windows
