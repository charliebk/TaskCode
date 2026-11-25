---
id: TASK-167b
titulo: "detector de duplicados por cuerpo en el diff (parte b de TASK-167)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 11365330
tokens_revision: 7321484
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

## Autorrevision

- code-quality-reviewer — c96edb5
- 4D — c96edb5: helper buscado (definicionesNuevas, definicionesDeGrep, definicionesEnRef, showFileAtRef, sinComentariosC y el repo de review-candidatos-4d reutilizados), usos buscados (no habia comparacion de cuerpos en src/ ni scripts/), criterios citados, 3 tests nuevos con 2 mutaciones en rojo
- 4D ronda 1 — 09ddcf3: usos buscados (showFileAtRef en review.ts sustituido por ficherosEnRef; loc de candidatos-4d y extension de cobertura-cambios reutilizados, sin copias; cat-file --batch ya existia solo en sondas-deploy, con otro formato de entrada por sha), 6 tests mutados en rojo (umbral 0.6 y 0.3, teja 1, corte sin llave, guarda de parentesis, salto de no-blob); sobre el diff real 0 pares y 2 s (antes 2 falsos positivos y unos 19 s)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T16:59:38Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T17:00:27Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T17:00:31Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T17:06:57Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T17:58:33Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T17:06:57Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 32 | 24262 | 11325179 | 15857 | 6 | 11365330 | - | - |
| 2026-11-25T17:58:19Z | revision | agente:a031f605875d95502 | 108 | 170678 | 7122415 | 28283 | 13 | 7321484 | 1 | - |
