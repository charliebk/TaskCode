---
id: TASK-133
titulo: "Rojos de la suite completa de la 0.16.0 y publicacion de la 0.16.1"
tipo: fix
sprint: 0
etiquetas: [tests, publicacion]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-133-rojos-de-la-suite-completa-de-la-0-16-0
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 1741461
tokens_revision: null
creado: 2026-11-13
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

La suite completa de la 0.16.0 dio dos rojos reales ademas de los dos conocidos de plan.test.ts en Windows: revision-lecturas.test seguia esperando el commit propio de registrar-coste que TASK-119 quito, y task-workflow/SKILL.md no enlazaba el anexo poda-tests.md de TASK-130 (en los proyectos con la 0.16.0 nadie lo lee). Los dos arreglos estan hechos y guardados en el stash 'arreglos-suite-0.16.0' (git stash list); tras start se recuperan con git stash pop. Falta integrarlos con el flujo y publicar la 0.16.1.

## Criterios de aceptacion
- [ ] revision-lecturas.test.ts pasa: registrar-coste con dos agentes no hace ningun commit
- [ ] task-workflow/SKILL.md enlaza poda-tests.md y sigue por debajo de 15 KB; los tests de skills pasan
- [ ] La suite completa solo falla en los dos tests conocidos de plan.test.ts
- [ ] Version 0.16.1 publicada: marketplace, plugin, package, version.ts, CHANGELOG, tag v0.16.1, push y release en GitHub

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T20:25:56Z | plan | automatico | persona | 0.16.0 |
| 2026-11-13T20:26:23Z | approve | automatico | persona | 0.16.0 |
| 2026-11-13T20:26:24Z | start | automatico | persona | 0.16.0 |
| 2026-11-13T20:37:29Z | review | automatico | persona | 0.16.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T20:37:29Z | implementacion | sesion:e9a360a9-58ca-45f8-961e-b01de725654a | 28 | 22592 | 1712402 | 6439 | 0 | 1741461 | - | - |
