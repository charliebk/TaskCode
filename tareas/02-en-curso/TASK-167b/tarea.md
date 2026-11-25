---
id: TASK-167b
titulo: "detector de duplicados por cuerpo en el diff (parte b de TASK-167)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-167a]
---
## Objetivo

Parte b del troceo de TASK-167 (Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)), partes TASK-167a, TASK-167b, TASK-167c, TASK-167d en la rama feature/task-167-regla-4d-preventiva-en-los-proyectos-que.

Modulo puro que, para cada definicion nueva o cambiada del diff, compara su
cuerpo (tokens normalizados: sin comentarios, identificadores y literales
genericos) con las definiciones existentes del proyecto y da los pares por
encima de un umbral. `taskctl review` lo avisa antes de abrir la ronda y lo
anade a `## Candidatos 4D` de la peticion. Avisa, no bloquea.

## Criterios de aceptacion
- [ ] Al escribir codigo, taskctl detecta en el diff funciones casi identicas a otras ya existentes del proyecto y lo avisa antes de pedir revision, no solo como candidato para el revisor
- [ ] Un test falla si el detector deja de encontrar un duplicado real con otro nombre, o si da por duplicadas dos funciones distintas

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T16:59:38Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T17:00:27Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T17:00:31Z | start | automatico | persona | 0.18.0 |
