---
id: TASK-038
titulo: "F2-T2 Una sola deteccion de origin por invocacion, con timeout"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-038-f2-t2-una-sola-deteccion-de-origin-por-i
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

Que cada invocacion de un script de Git-Flow pregunte a `origin` una sola vez
y nunca espere mas de unos segundos (auditoria del 2026-10-03, B2 y D9). Hoy
`detect_origin_available` esta reimplementada en linea en 7 scripts, cada
`git ls-remote` espera lo que tarde la red (con la VPN caida, del orden de
30 s) y puede quedarse esperando credenciales, y `resolve_main_branch` hace
dos consultas mas. Ademas, `merge-feature-to-develop.sh` no distingue «origin
configurado pero caido» de «sin origin».

## Criterios de aceptacion
- [ ] `detect_origin_available` cachea su resultado por invocacion; `update-feature.sh` deja de reimplementarla
- [ ] `git ls-remote` con limite de 5 s, portatil en Git Bash y Linux
- [ ] `merge-feature-to-develop.sh` aplica la guarda de origin configurado pero caido
- [ ] Test con un origin inalcanzable: el comando responde en menos de 10 s
