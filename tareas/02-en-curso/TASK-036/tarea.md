---
id: TASK-036
titulo: "F1-T3 Veredicto con un comando e informe estructurado"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-036-f1-t3-veredicto-con-un-comando-e-informe
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Quitar la friccion del veredicto y dejar el informe de revision legible por
una maquina (auditoria del 2026-10-03, A5 y A6). Hoy el revisor escribe la
linea `- Veredicto:` a mano, en su propio vocabulario (`**APROBADO CON
CAMBIOS**`, `**cambios-solicitados**`), y eso obliga a commits de
normalizacion; TASK-017 llego a cerrarse con un veredicto que el propio gate
rechaza. El comando `taskctl veredicto` escribe la linea canonica y la
commitea; el parser de `finish` tolera el enfasis de markdown sin aflojar la
regla («no aprobada» sigue fallando); y el scaffold del informe trae la tabla
de hallazgos que usara la ronda incremental (TASK-040).

Fuera de alcance: leer la tabla para generar la ronda 2 (TASK-040).

## Criterios de aceptacion
- [ ] `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados` sustituye la linea del informe de mayor N
- [ ] El scaffold de `informe-revision-N.md` trae la tabla `| ID | Severidad | Estado | Fichero |`
- [ ] El parser de `finish` acepta `**aprobada**`; `no aprobada` sigue fallando, con test
- [ ] Test del comando contra un repo real
