---
id: TASK-156
titulo: "verificar-impacto elige los tests que leen los md de skills, agents y docs del plugin"
tipo: fix
sprint: 0
etiquetas: [verificacion, scripts]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-156-verificar-impacto-elige-los-tests-que-le
asignado_a: claude-156
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 3252550
tokens_revision: 3499310
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

scripts/verificar-impacto.mjs elegia los tests de un .md de skills/ solo por su nombre: los que leen la carpeta entera (test/skills/task-workflow.test.ts, que prohibe marcas del repo en todas las skills) quedaban fuera y en TASK-139b un rojo suyo paso la revision y solo lo vio la suite completa de finish. Un fichero cambiado bajo skills/, agents/ o docs/ del plugin debe elegir tambien los tests que leen esa carpeta.

## Criterios de aceptacion
- [x] Un .md cambiado bajo skills/ del plugin elige todos los tests de test/skills/ que leen la carpeta (comprobado con --listar en el repo real: task-workflow.test.ts entra)
- [x] Un fichero bajo agents/ elige los tests que leen agents/, y uno bajo docs/ del plugin los que leen PLUGIN_ROOT/docs, sin arrastrar los que usan docs en su repo temporal
- [x] test/scripts/verificar-impacto.test.ts tiene un test que cae en rojo si se vuelve a ignorar un .md de skill (mutacion comprobada)
- [x] La cabecera de scripts/verificar-impacto.mjs documenta la regla

## Resultado

- **Implementado** (`scripts/verificar-impacto.mjs`): `CARPETAS_LEIDAS` (`skills`, `agents` y `docs` del plugin, este ultimo solo con `PLUGIN_ROOT, 'docs'`, porque `'docs'` a secas sale en 50 tests que lo usan para sus repos temporales). Un fichero cambiado bajo ellas elige la union de los tests que nombran el fichero (como antes) y los que leen su carpeta. Con tope, `proximidad` pone a los lectores de carpeta detras de todos los que nombran el fichero, que conservan su orden de antes; entre los lectores, primero los de `test/<carpeta>/`. La cabecera del script lo documenta.
- **Evidencia**: en el repo real, con un `.md` de `skills/task-workflow/` cambiado y sin tope, la seleccion pasa de 3 tests a 29, con los 9 de `test/skills/` que leen la carpeta (`task-workflow.test.ts` incluido, criterio 1). El revisor comprobo `agents/` (7 tests) y `docs/problemas-conocidos.md` (3, sin los de repo temporal; criterio 2). El test nuevo de `test/scripts/verificar-impacto.test.ts` cae en rojo con 5 mutantes: lectores vaciados, `docs` sin `PLUGIN_ROOT`, sin la linea de proximidad, carpeta `agents` renombrada y lectores con prioridad 1 (criterio 3). Verificacion por impacto sin tope en verde: 720/720.
- **Revision**: 2 rondas. Ronda 1 (sonnet): IMP-1, con tope los lectores de carpeta desplazaban a los tests que leen justo el fichero (`skills/finish/SKILL.md` perdia `verificacion-pesada`, `finish-heldout`, `verificacion-selectiva` y `doctor-correcciones`); se corrigio en d8ef728. Ronda 2 (haiku, acotada): aprobada, IMP-1 verificado.
- **No corregido**: MEN-1 (aceptado). El patron de `skills`/`agents` tambien casa con rutas citadas en comentarios, y eso sobrecarga la seleccion; es el lado seguro, y afinarlo dejaria fuera a quien compone la ruta como `'..', 'skills'` o `raiz, 'skills'`.
- **Proceso**: `start` con `--asignado-a claude-156` (decision de la sesion coordinadora: `claude` tenia TASK-145a y la persona TASK-155). Un cherry-pick del WIP cayo por error en `develop` y se revirtio alli mismo (278d318 y 8951c99, con el mismo arbol que abe6e20; nada subido).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T09:56:01Z | plan | automatico | persona | 0.17.1 |
| 2026-11-24T09:56:49Z | approve | automatico | persona | 0.17.1 |
| 2026-11-24T10:02:30Z | start | automatico | persona | 0.17.1 |
| 2026-11-24T10:12:56Z | review | automatico | persona | 0.17.1 |
| 2026-11-24T10:38:52Z | review | automatico | persona | 0.17.1 |
| 2026-11-24T13:44:58Z | finish | automatico | persona | 0.17.1 |

## Autorrevision

- 4D — 1e158b1: helper buscado (MARCADORES, busqueda por nombre y proximidad de seleccionar), criterios citados, 1 test nuevo mutado (lectores vaciados: rojo).
- code-quality-reviewer — 1e158b1
- 4D — d8ef728: helper buscado (proximidad y directos existentes), criterio IMP-1 citado, 1 test ampliado mutado (lectores con prioridad 1: rojo).
- code-quality-reviewer — d8ef728

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T10:12:56Z | implementacion | sesion:ff11dcd3-ab45-414c-b4b8-f02f1c965949 | 34 | 15179 | 3232270 | 5067 | 4 | 3252550 | - | - |
| 2026-11-24T10:34:37Z | revision | agente:aabcb574a3f1c7091 | 46 | 96234 | 2672112 | 13850 | 5 | 2782242 | 1 | - |
| 2026-11-24T10:54:23Z | revision | agente:acc83724c090969ab | 14 | 70454 | 639279 | 7321 | 2 | 717068 | 2 | - |

## Duracion

- Estimada: 45 min
- Real (de la rama abierta al cierre con merge, sin pausas): 222 min
- Paso de la hora: 222 min reales frente a 45 estimados
- Cierre (finish): 2914 s, de 2026-11-24T12:56:24Z a 2026-11-24T13:44:58Z
