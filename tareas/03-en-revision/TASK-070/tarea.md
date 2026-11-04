---
id: TASK-070
titulo: "Clave comando_verificacion en .taskcode/config.yml"
tipo: feature
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-070-clave-comando-verificacion-en-taskcode-c
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 725035
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-03
actualizado: 2026-11-04
dependencias: []
---
## Objetivo

Declarar como se verifica un proyecto, para que los frenos ejecuten el comando del repo y nunca uno inventado.

## Criterios de aceptacion
- [ ] Nuevas claves opcionales comando_verificacion y timeout_verificacion en resolverConfig, con fallo cerrado ante valor invalido y defecto null (sin freno)
- [ ] Sin la clave, el comportamiento de todos los comandos es identico al actual; los tests existentes pasan sin tocarlos
- [ ] taskctl doctor informa si falta comando_verificacion, con el arreglo en la misma linea
- [ ] Tabla de claves de config.ts, README y CHANGELOG al dia

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T13:52:07Z | plan | automatico | persona |
| 2026-11-04T13:56:20Z | approve | automatico | persona |
| 2026-11-04T13:56:21Z | start | automatico | persona |
| 2026-11-04T14:14:48Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04T13:56:11Z | diseno | agente:a6ba99584f516f5e1 | 36 | 53945 | 660351 | 10703 | 29 | 725035 |
