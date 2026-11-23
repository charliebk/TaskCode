---
id: TASK-149b
titulo: "errores y flags del CLI (parte b de TASK-149)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-149a]
---
## Objetivo

Parte b del troceo de TASK-149 (Regla 4D: duplicacion en fs, hooks y cli), partes TASK-149a, TASK-149b, TASK-149c en la rama fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli.

printAutoCommit en doctor-deploy, GitCommandError igual en todos los comandos, extraerPushFlag en cli/args.ts y aMano una vez (FS-02, FS-03, FS-15, FS-18).

## Criterios de aceptacion
- [ ] doctor-deploy imprime con printAutoCommit y todos los comandos traducen GitCommandError igual, con test de un comando que antes caia en taskctl no pudo arrancar
- [ ] extraerPushFlag vive en cli/args.ts y el texto aMano de sincronizacion existe una vez

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T11:25:54Z | plan | automatico | persona | 0.16.1 |
