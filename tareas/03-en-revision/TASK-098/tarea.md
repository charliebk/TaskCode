---
id: TASK-098
titulo: "ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes"
tipo: feature
sprint: 0
etiquetas: [roadmap, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-098-roadmap-de-tareas-generado-por-taskctl-e
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 838143
tokens_implementacion: 10087887
tokens_revision: 4544665
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Que todo proyecto tenga tareas/ROADMAP.md al dia sin escribir un script: hitos (campo sprint), orden por dependencias (ninguna tarea antes que sus predecesoras; a igualdad, el hito anterior), complejidad, estado, tareas terminadas y un resumen de lo que esta en marcha y lo que esta listo para empezar, regenerado en el commit de cada transicion. Hoy solo lo tienen ToolsaWeb y OpenDockTrading, con su propio scripts/grafo-tareas.py. Regla numero uno (decision de Carlos): no puede entrar en conflicto con esos dos proyectos; taskctl solo escribe un ROADMAP que lleve su marca o que no exista. La migracion de esos proyectos se permite solo si no rompe nada ni pierde datos, va en tareas aparte en cada repo y la decide la persona.

## Criterios de aceptacion
- [x] Sin tareas/ROADMAP.md, cada transicion cuyo commit cae en la rama de integracion (new, plan, approve, finish tras el merge) lo crea o regenera con la marca de taskctl dentro de su mismo commit, y dos ramas de tarea en paralelo no generan conflicto de merge en el: hitos, orden por dependencias, complejidad, estado y resumen (test de integracion en un repo temporal)
- [x] Un tareas/ROADMAP.md sin la marca de taskctl, o declarado en rutas_sincronizacion, queda byte a byte igual tras cada transicion (test con copias de los ROADMAP reales de ToolsaWeb y OpenDockTrading)
- [x] La zona manual entre marcas se conserva al regenerar, y una dependencia circular se informa en el ROADMAP sin abortar la transicion (un test por caso)
- [x] taskctl roadmap --comparar genera en seco y lista, sin escribir nada, lo que difiere del ROADMAP actual (tareas, hitos, dependencias, estado, zona manual); es la comprobacion previa a migrar un proyecto (test)
- [x] skills/task-workflow, README y CHANGELOG explican el ROADMAP, la marca, la zona manual y como migrar un proyecto que ya tiene el suyo
- [x] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Resultado

**Implementado.** ROADMAP de tareas generado por taskctl en `tareas/ROADMAP.md`, el mismo formato para todos los proyectos (decision de Carlos: una sola fuente de verdad). Modulos nuevos: `core/roadmap.ts` (generador puro: hitos por `sprint`, orden topologico por dependencias, complejidad, estado, resumen «En marcha / Listas para empezar», dependencias circulares informadas sin abortar), `core/roadmap-comparar.ts` (comparacion estructural), `fs/roadmap.ts` (lectura de tareas y escritura con todas las guardas) y `commands/roadmap.ts` (`taskctl roadmap [--comparar | --escribir]`). `autoCommit` gana `roadmap: true`, que pasan new, plan, approve y finish; solo actua si el commit cae en `rama_base`, dentro del mismo commit.

**No pisa ROADMAP ajenos** (requisito numero uno de Carlos: ToolsaWeb y OpenDockTrading). Las transiciones no escriben si el fichero no lleva la marca exacta en la linea 3, si esta en `rutas_sincronizacion`, si tiene cambios sin commitear, si tiene historia en git pero no existe, o si en disco tiene otras mayusculas. Tests con copias reales de los dos ROADMAP. `--escribir` sustituye uno ajeno solo si `--comparar` sale limpio.

**Revision por pares.** Ronda 1 (completa): cambios solicitados con IMP-1 (`--comparar` salia limpio con texto propio fuera de la zona manual y `--escribir` lo borraba) y MEN-1 (titulo, complejidad y filas duplicadas sin comparar); ambos corregidos. Ronda 2 (verificacion de correcciones por protocolo de arranque): aprobada con correcciones; IMP-1 y MEN-1 verificados y un MEN-2 nuevo causado por la correccion (una fila propia dentro de la tabla de un hito se seguia eximiendo). Carlos decidio corregirlo antes de cerrar; como taskctl 0.13 no abre otra ronda sobre «aprobada con correcciones», un revisor independiente lo verifico como anexo (`revision/verificacion-men-2.md`): corregido, sin hallazgos nuevos. En las transiciones ninguna ronda encontro forma de sobrescribir un ROADMAP ajeno. Mutantes de las guardas (marca, cambios sin commitear, historia, sincronizacion) y de la comparacion, muertos.

**Tests que cambian de expectativa:** `auto-commit.test.ts` y `sincronizacion-ciclo.test.ts` (el commit de las transiciones en la rama base incluye ahora `tareas/ROADMAP.md`); en `roadmap-ajenos.test.ts` la asercion de «sin diferencias de zona manual» se cine a las lineas `- zona manual:`, porque el mensaje nuevo de texto perdido tambien contiene esas palabras. No se debilita ninguna asercion.

**Suite completa:** 2117 tests, 2113 en verde antes de la revision (solo los 3 rojos conocidos de Windows). Tras las correcciones de las rondas, suite rapida 699/699 y los 24 tests del ROADMAP en verde (protocolo de arranque: la completa, una vez antes de la revision).

**Limites aceptados:** «En marcha» suele salir vacio en develop, porque el ROADMAP solo se regenera en la rama de integracion; la prioridad por etiqueta `interfaz` de OpenDockTrading no se replica, asi que el orden de filas puede cambiar al migrar; un comentario HTML de una linea o una fila hecha solo de guiones fuera de la zona manual no cuentan como texto propio.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T15:13:28Z | plan | automatico | persona | 0.13.0 |
| 2026-11-10T15:21:53Z | approve | automatico | persona | 0.13.0 |
| 2026-11-10T17:43:32Z | start | automatico | persona | 0.13.0 |
| 2026-11-10T18:09:54Z | review | automatico | persona | 0.13.0 |
| 2026-11-10T18:29:52Z | review | automatico | persona | 0.13.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T15:22:05Z | diseno | agente:a542730c857c956b4,a68ce8c1c7c63bfa6,ae3b3243d20e87593 | 52 | 114893 | 699025 | 24173 | 42 | 838143 | - | - |
| 2026-11-10T18:09:54Z | implementacion | sesion:f5a75e93-b137-4945-9f2a-de03fa092974 | 52 | 89454 | 9989284 | 9097 | 4 | 10087887 | - | - |
| 2026-11-10T18:22:50Z | revision | agente:a482fd2c4ecfb1d53 | 54 | 145552 | 3155923 | 18367 | 4 | 3319896 | 1 | - |
| 2026-11-10T18:33:37Z | revision | agente:aabd64c300f920a37 | 12 | 97982 | 453405 | 5023 | 3 | 556422 | 2 | - |
| 2026-11-10T18:39:38Z | revision | agente:a20d64195a47c0e88 | 16 | 46698 | 618626 | 3007 | 0 | 668347 | - | - |

## Autorrevision

- code-quality-reviewer — 3da7011
- code-quality-reviewer — 63e925e
- code-quality-reviewer — 8e2a900
