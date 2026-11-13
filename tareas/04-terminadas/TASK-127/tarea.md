---
id: TASK-127
titulo: "Tope de rondas de revision configurable, 2 por defecto, y decision de una persona al llegar"
tipo: feature
sprint: 0
etiquetas: [agilidad, revision, verificacion, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-127-tope-de-rondas-de-revision-configurable
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 8900780
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: [TASK-112]
---
## Objetivo

Medido en ToolsaWeb (153 tareas terminadas, taskctl metricas, 2026-11-12): las rondas por tarea han pasado de 2,2 a 3,0 y TASK-280 y TASK-282 llegaron a 6; los hallazgos suman unos 1130 MENORES, unos 350 IMPORTANTES y 3 CRITICOS. El tope esta fijo en TOPE_RONDAS = 3 (src/core/flujo.ts) y --ronda-extra lo rebasa sin limite. Se busca un tope configurable, 2 por defecto, y que al llegar a el decida una persona: cerrar con lo que hay, autorizar una ronda mas o devolver la tarea a diseno. Complementa a TASK-099 (los MENORES no abren ronda) y a TASK-112 (rondas 2+ acotadas a los bloqueantes): va despues de TASK-112. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [x] Una clave tope_rondas en .taskcode/config.yml (entero de 1 a 10, 2 por defecto) sustituye a la constante TOPE_RONDAS en review y en taskctl siguiente (test con repo temporal)
- [x] Al llegar al tope con hallazgos bloqueantes abiertos, taskctl siguiente devuelve accion preguntar con tres salidas (cerrar, una ronda mas, volver a diseno) en todos los modos, tambien automatico (test)
- [x] taskctl review --ronda-extra pasado el tope exige que conste la decision de la persona en tarea.md y cada ronda extra vuelve a preguntar (test)
- [x] Con tope_rondas: 3 el flujo se comporta como hoy (test de regresion)
- [x] Las skills review y task-workflow, el README y el CHANGELOG explican el tope y su valor por defecto
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Implementado.** La clave `tope_rondas` (entero de 1 a 10, 2 por defecto; `src/core/config.ts`)
sustituye a `TOPE_RONDAS = 3`. `siguiente` y `review` la leen de la config de la rama base
(`configDeRef`), asi que la rama de la tarea no puede subirse el tope. En el tope con
`cambios-solicitados`, `siguiente` devuelve `preguntar` en los tres modos con tres `salidas`
(`cerrar`, `ronda-extra`, `volver-a-diseno`; `src/core/flujo.ts`). Pasado el tope,
`review --ronda-extra` exige en `tarea.md` la linea `- Ronda N: <quien y por que>` bajo
`## Rondas extra` para la ronda que se abre (`src/core/rondas-extra.ts`); cada ronda extra pide la
suya y vuelve a preguntar. Skills `review` y `task-workflow`, README, `docs/configuracion.md` y
CHANGELOG actualizados.

**Decisiones de Carlos (2026-11-13).** La salida «volver a diseno» es redisenar lo abierto en una
tarea nueva (`taskctl new`), sin transicion en-revision -> en-diseno. La tarea no se trocea
aunque el plan estimaba 70 min: aprobada entera como decision de persona.

**Evidencia.** `test/core/config-tope-rondas.test.ts`, `test/core/rondas-extra.test.ts`, tabla de
`test/core/siguiente.test.ts` (tope por defecto, tope 1 y regresion con tope 3),
`test/commands/automatico-rondas.test.ts` (CLI real en repo temporal: ronda 2 pregunta con tres
salidas, review sin flag y sin linea rechaza, con linea abre, la ronda 4 exige la suya, la rama no
puede subirse el tope; regresion con `tope_rondas: 3`) y `test/commands/review-alcance.test.ts`
(tope 3 fijado en develop; la ronda 4 exige la linea). `verificar-impacto`: 867/867.

**Revision por pares (ronda 1, code-quality-reviewer, aprobada-con-correcciones).**
- IMP-1 (IMPORTANTE, corregido): ningun test comprobaba que el tope se lee de la rama base. Test
  nuevo en `automatico-rondas` (la rama sube `tope_rondas: 5`, develop sigue en 2); el coordinador
  verifico que mata el mutante que lee la config del arbol de trabajo en review y siguiente.
  Corregido sin ronda 2 (modo rapido: un IMPORTANTE que es solo un test que falta).
- MEN-1 (MENOR, corregido): entrada en CHANGELOG del cambio de defecto de 3 a 2.
- MEN-2 (MENOR, aceptado): si la rama base no existe, `configDeRef` da el defecto 2 sin avisar.
  Motivo: falla del lado seguro (se pregunta antes, nunca despues), y sin rama base `review` ya
  falla antes por el update de Git-Flow; una config invalida en la base si aborta.

**Hallazgo lateral (no de esta tarea).** Fallan ya en develop: `automatico-ciclo` «finish solo
sigue solo si lo aprobado es exactamente lo revisado», `automatico-guarda-finish` «IMP-3: la guarda
leida desde develop...» y, en skills, «automatico (TASK-059)... commitea el informe solo» (la skill
`review` ya no dice «commitealo **solo**»). Vienen de TASK-119; hay que arreglarlos antes de la
suite completa de la 0.16.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T10:11:30Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T10:13:01Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T10:13:04Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T10:39:38Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T10:59:23Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T10:39:38Z | implementacion | sesion:11e712bd-419c-4b82-81c1-1dc7aa472f20 | 92 | 67793 | 8796694 | 36201 | 23 | 8900780 | - | - |

## Verificacion ligera

- 2026-11-13T10:58:33Z: ronda 1; commit revisado d99b84f0efa1ee186da680590acdda0dfb162f99; commit verificado b4e7ea732d9b605113071a4fb4d05a6a70249a28; ficheros: CHANGELOG.md, taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-rondas.test.ts; corregidos: MEN-1; pendientes: ninguno

## Verificacion omitida

- 2026-11-13T10:58:55Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 70 min
- Real (de la rama abierta al cierre con merge, sin pausas): 46 min
- Cierre (finish): 28 s, de 2026-11-13T10:58:55Z a 2026-11-13T10:59:23Z
