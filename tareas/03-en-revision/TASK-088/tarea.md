---
id: TASK-088
titulo: "taskctl doctor avisa si falta comando_verificacion con tests detectables"
tipo: feature
sprint: 0
etiquetas: [doctor, verificacion]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-088-taskctl-doctor-avisa-si-falta-comando-ve
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 380039
tokens_implementacion: null
tokens_revision: 4089249
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Sin comando_verificacion no funcionan los frenos de la 0.11 (hook Stop, puerta de finish, guardian de merges), y ToolsaWeb no lo tenia. doctor detecta los tests del proyecto y propone el comando.

## Criterios de aceptacion
- [ ] taskctl doctor da AVISO si falta comando_verificacion y detecta tests (package.json con test, Cargo.toml, pom.xml, .csproj...), y propone el comando detectado
- [ ] Si el proyecto no tiene tests detectables sigue saliendo omitida como hoy
- [ ] Lo cubren tests con proyectos temporales de cada tipo
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T17:56:07Z | plan | automatico | persona |
| 2026-11-07T18:02:53Z | approve | automatico | persona |
| 2026-11-07T18:03:06Z | start | automatico | persona |
| 2026-11-07T18:28:14Z | review | automatico | persona |
| 2026-11-07T19:24:42Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T18:01:59Z | diseno | agente:a8affc352f2ef1cc3 | 18 | 56486 | 314760 | 8775 | 16 | 380039 |
| 2026-11-07T19:03:47Z | revision | agente:a460db242356fd7d1 | 52 | 118392 | 2712468 | 13091 | 4 | 2844003 |
| 2026-11-07T19:34:13Z | revision | agente:a94a8607b57b52ce7 | 26 | 102283 | 1136544 | 6393 | 2 | 1245246 |
