---
id: TASK-144a
titulo: "cadena, Commit revisado y tarea en su rama (parte a de TASK-144)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-144 (Regla 4D: ciclo de vida, cadena y flags en commands), partes TASK-144a, TASK-144b, TASK-144c en la rama fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en.

GUARDADOS_POR_CADENA derivado y probado contra los comandos que escriben, una sola definicion de codigo cambiado tras el Commit revisado y del Commit revisado de la ultima ronda, y un solo helper de tarea en otra rama (CMD1-01, CMD2-01, CMD2-03, CMD2-04).

Objetivo de la tarea entera:

> Cerrar las decisiones del ciclo de vida y de los flags escritas en varios comandos con reglas distintas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-01, CMD1-09, CMD1-10, CMD1-11, CMD2-01 a CMD2-05, CMD2-09, CMD2-14 y FS-01).

## Criterios de aceptacion

- [ ] Un test recorre src/commands y falla si un comando con autoCommit o ensureBaseBranchReady no esta en GUARDADOS_POR_CADENA; trocear, verificar-menores, verificar-lote y doctor-deploy aceptan --cadena dentro de una cadena
- [ ] siguiente, verificar-menores, codigoSinVerificar y leerRondaPrevia usan una sola funcion para el Commit revisado de la ultima ronda y una sola para el codigo cambiado; un test con comando_sincronizacion que regenera un fichero fuera de tareas/ en el commit de review da fase finish sin pregunta en modo automatico
- [ ] pausa, registrar-coste y siguiente deciden con un mismo helper si la tarea vive en otra rama, con un solo texto de error

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T03:04:55Z | plan | automatico | persona | 0.16.1 |
