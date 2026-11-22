---
id: TASK-143
titulo: "Regla 4D: duplicacion en Git-Flow (bash y TS)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
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

Unificar la logica de Git-Flow copiada entre scripts y entre bash y TypeScript (auditoria 4D completa, docs/auditoria-4d-completa.md, casos SCR-02 a SCR-08, SCR-12, SCR-13 y SCR-15).

## Criterios de aceptacion
- [ ] update-feature/fix/release/hotfix y create-release/create-hotfix usan una funcion comun de _gitflow-common.sh, con el mismo fetch previo; merge-hotfix-to-main y merge-release-to-main comparten el cuerpo
- [ ] El backmerge a develop de los merge a main hace pull --ff-only antes de mergear, como invoke_merge_work_branch_to_develop, con test que lo distingue
- [ ] La lectura de argumentos y assert_valid_branch_name vienen de un helper comun en los 13 scripts; diagnose-repo usa detect_origin_available
- [ ] La deteccion de operacion en curso (abort-merge, diagnose-repo, git.ts) tiene test de paridad, y los ls-remote de git.ts llevan GIT_TERMINAL_PROMPT=0 y limite de tiempo; finish pasa --main al script
- [ ] perfil-tests.mjs reutiliza la compilacion protegida de verificar-impacto (copia de dist/src y cerrojo) o lo documenta
