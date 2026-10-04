---
id: TASK-059
titulo: "Flujo E: modo automatico"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-059-flujo-e-modo-automatico
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

Parte de TASK-055 (su plan-final es el diseno de referencia). Todas las preguntas se hacen en plan; despues approve, start, implementacion, review y finish se encadenan sin preguntar, salvo hotfix y release, que paran antes de finish (decision de Carlos, 2026-10-04).

## Criterios de aceptacion
- [x] Con `modo_flujo: automatico`, tras cerrar plan ningun paso devuelve preguntar salvo los topes y hotfix/release antes de finish
- [x] approve queda registrado como automatico en `## Transiciones` (deja sin efecto la decision #1 solo en este modo; divergencia documentada)
- [x] review se lanza sola con la implementacion commiteada y la suite en verde; finish solo con el informe aprobado en un commit propio, posterior a la implementacion y que no toca codigo
- [x] Tope de 3 rondas de revision: al llegar, se pregunta aunque el modo sea automatico
- [x] Las guardas abortan tambien en automatico: limite WIP, rama base sucia, informe sin veredicto y `revision_codex: true` sin segunda opinion
- [x] Test de punta a punta en repo temporal con fixtures en lugar de agentes: el ciclo termina en `04-terminadas` y hay un commit por transicion

### Tras el cierre

- [ ] Smoke manual en Claude Code en un proyecto ajeno con evidencia en el Resultado (este entorno no autentica `claude -p`; lo hace Carlos o la release)

## Resultado

- `core/flujo.ts`: el automatico encadena (`continuar`) y solo pregunta en
  sus guardas: approve sin modo congelado, finish de hotfix/release, finish
  sin el informe en un commit propio, `cambios-solicitados` desde la ronda 3
  (`TOPE_RONDAS`) y el veredicto de la segunda opinion. El trabajo pendiente
  (implementar en curso, corregir tras cambios) da `continuar` en automatico
  (lo hace la skill) y `detener` en semiautomatico.
- `commands/siguiente.ts`: `rondaRevision` e `informeEnCommitPropio` (cada
  informe de la ultima ronda en un commit que solo toca su `revision/`,
  descendiente del ultimo commit que toca algo fuera de `tareas/`, y sin
  cambios sin commitear en esa carpeta), desde el working tree o desde la
  rama de la tarea.
- Skills: `approve` aprueba con `--decidido-por automatico` en una tarea
  planificada en automatico (el CLI lo rechaza si no); `start` implementa y
  no sigue sin la suite en verde; `review` corrige los CRITICO e IMPORTANTE y
  commitea cada informe solo; `avance.md` describe las guardas.

Divergencia con el criterio 1, documentada: ademas de los topes y de
hotfix/release, el automatico tambien pregunta en el veredicto de la segunda
opinion (decision de la revision de B: que lo escriba el mismo agente que
encadena es el veredicto autoescrito) y al aprobar una tarea sin modo
congelado (anterior al registro).

Tests: tabla de `siguienteFase` con la columna automatica definitiva y filas
nuevas (sin commit propio, rondas 2 y 3); `test/commands/automatico.test.ts`
(9, escritos por un agente en paralelo, sin bugs): ciclo entero sin
preguntar tras plan, approve `automatico | automatico` y un commit por
transicion; informe mezclado con codigo, con codigo posterior, sin
commitear (y editado tras un commit correcto); tope de rondas; hotfix; y las
guardas WIP, informe PENDIENTE, `revision_codex` sin segunda opinion y
aprobacion automatica de una tarea planificada en manual, que abortan
tambien en automatico. Test de skills ampliado. Mutantes (6: finish sin
mirar el commit propio, sin tope, informe mezclado, codigo posterior,
informe sin commitear, automatico como semi): todos muertos.
Suite: 1053 tests, 1050 en verde (los 3 rojos conocidos de Windows).

El smoke dentro de una sesion de Claude Code paso a «Tras el cierre».
