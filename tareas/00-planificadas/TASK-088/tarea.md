---
id: TASK-088
titulo: "taskctl doctor avisa si falta comando_verificacion con tests detectables"
tipo: feature
sprint: 0
etiquetas: [doctor, verificacion]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-088-taskctl-doctor-avisa-si-falta-comando-ve
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
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
