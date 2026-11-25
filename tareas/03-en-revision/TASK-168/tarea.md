---
id: TASK-168
titulo: "Agilidad: un cambio solo en md de skills o agentes se verifica con sus tests"
tipo: fix
sprint: 0
etiquetas: [agilidad]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-168-agilidad-un-cambio-solo-en-md-de-skills
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 7089321
tokens_revision: 8704556
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Que verificar-impacto, cuando cambian .md de skills o agentes del plugin, elija los tests que de verdad los leen (los de test/skills y test/agents y los que nombran esa skill concreta) y no todos los tests que mencionan cualquier SKILL.md: hoy cada parte que toca skills arrastra unos 1800 tests y 25-30 min. Decision de Carlos (2026-11-25): agilidad, la suite completa se corre una vez antes de publicar.

## Criterios de aceptacion
- [ ] Un cambio en skills/<x>/SKILL.md elige los tests de test/skills y test/agents que leen la carpeta, y fuera de ellos solo los que nombran esa skill (su carpeta y el fichero), no los que solo mencionan SKILL.md
- [ ] Un cambio en agents/<x>.md elige los tests que lo nombran y los de test/agents que leen la carpeta
- [ ] Un test contra un repo temporal falla si un cambio de skill vuelve a arrastrar tests de comandos que no la nombran, o si deja fuera uno que si la nombra

## Autorrevision

- code-quality-reviewer — 9ab29dd
- 4D — 9ab29dd: helper buscado (conRepo, cambiarYCommitear, listar y la plantilla de TASK-156 reutilizados), usos buscados (CARPETAS_LEIDAS y porNombre solo en el bucle de seleccion; grep de los 25 tests que casaban: 7 falsos positivos por comentario), criterios citados, 1 test nuevo y 2 expectativas de TASK-156 ajustadas, 3 mutaciones en rojo
- code-quality-reviewer — 811ca47
- 4D ronda 1 — 811ca47: usos buscados (loNombra solo en el bucle; sinComentarios nueva, no habia otra en scripts/), 2 fixtures y 3 aserciones nuevas, 2 mutaciones en rojo
- code-quality-reviewer — 178bda3
- 4D ronda 2 — 178bda3: usos buscados (sinComentariosC ya existia en doctor-deploy-reglas: reutilizado, quitada la copia), 1 fixture nuevo con 1 mutacion en rojo

## Rondas extra

- Ronda 3: Carlos, al llegar al tope (2026-11-25): IMP-2 de la ronda 2 ya corregido; una ronda acotada lo verifica.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T14:53:37Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T14:54:52Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T14:54:53Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T15:04:33Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T15:43:47Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T15:04:33Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 22 | 14026 | 7066614 | 8659 | 1 | 7089321 | - | - |
| 2026-11-25T15:43:35Z | revision | agente:a16583df1ee5a0328 | 90 | 164421 | 5927622 | 29728 | 7 | 6121861 | 1 | - |
| 2026-11-25T16:02:25Z | revision | agente:a96736764f2ca57c2 | 42 | 143395 | 2410737 | 28521 | 3 | 2582695 | 2 | - |
