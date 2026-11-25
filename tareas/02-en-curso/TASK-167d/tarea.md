---
id: TASK-167d
titulo: "tendencia de hallazgos 4D en las metricas (parte d de TASK-167)"
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
dependencias: [TASK-167c]
---
## Objetivo

Parte d del troceo de TASK-167 (Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)), partes TASK-167a, TASK-167b, TASK-167c, TASK-167d en la rama feature/task-167-regla-4d-preventiva-en-los-proyectos-que.

`taskctl metricas` lee los informes de auditoria (`docs/auditoria-4d-*.md`)
y muestra la serie por D entre auditorias, ademas de lo que ya da por tarea.

Troceo sin preguntar: autorizado por Carlos (2026-11-22 y 2026-11-25).

## Criterios de aceptacion
- [ ] taskctl metricas muestra la tendencia de hallazgos 4D por proyecto entre auditorias y por tarea
- [ ] Un test por pieza falla si deja de instalarse o de comprobar lo suyo

## Autorrevision

- code-quality-reviewer — b2e1490
- 4D — b2e1490: helper buscado (DES_4D y SEVERIDADES_4D de TASK-167c eran copia de DIMENSIONES_4D y SEVERIDADES_HALLAZGO de informe-revision.ts: borradas y reutilizadas; celdasDe de transiciones.ts exportada en vez de otro troceo de celdas; listarSiExiste de task-store.ts para la carpeta; helpers metricas-repos.ts para los repos), usos buscados (no habia lectura de docs/auditoria-4d-*.md en src/; la columna 4D por tarea de TASK-153c se mantiene), criterios citados, 3 tests nuevos (core, comando, frase de cifras contadas en la skill) con 5 mutaciones en rojo (Total sin comprobar, patron con -0/02, cambio, seccion, avisos)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T19:55:47Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T19:56:08Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T19:56:09Z | start | automatico | persona | 0.18.0 |
