---
id: TASK-147a
titulo: "secciones con un solo lector y un solo «crear al final» (parte a de TASK-147)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 21581176
tokens_revision: 6249036
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-147 (Regla 4D: lectores de secciones e IDs en core), partes TASK-147a, TASK-147b, TASK-147c en la rama fix/task-147-regla-4d-lectores-de-secciones-e-ids-en.

Duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen con rangoDeSeccion y crean la seccion con un helper comun (CORE1-01, CORE1-02, CORE2-02, CORE2-06).

Objetivo de la tarea entera:

> Que cada seccion de tarea.md y cada ID se lean con un solo lector (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CORE1-01, CORE1-02, CORE2-01, CORE2-02, CORE2-04 a CORE2-07, CORE2-12 a CORE2-14, FS-04 y CMD2-08).

## Criterios de aceptacion

- [x] duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen y escriben secciones con rangoDeSeccion y un helper comun para crear la seccion al final; un test con el encabezado dentro de un bloque de codigo lo distingue

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T06:28:28Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T06:28:53Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T06:28:54Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T06:53:34Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T07:09:18Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T08:58:34Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T09:11:39Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T09:23:07Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 3aeb6c2: buscados anadirSeccionAlFinal, contenidoDeSeccion, rangoDeSeccion y dentroDeBloque antes de escribir; un helper nuevo (anadirSeccionAlFinal) que sustituye cinco copias; 1 fichero de test nuevo (5 tests); 4 mutaciones en rojo (menores, troceo, duracion, rondas-extra)
- code-quality-reviewer — 3aeb6c2
- 4D — 85c111f: correccion de la ronda 1 sin helper nuevo (parametro en rangoPorCabecera); 3 tests nuevos en secciones-comunes; 3 mutaciones en rojo
- code-quality-reviewer — 85c111f
- 4D — 0504c15: correccion de IMP-2 sin helper nuevo (reutiliza dentroDeBloque y CABECERA_PARTE_RE); 1 test nuevo; 2 mutaciones en rojo
- code-quality-reviewer — 0504c15
- 4D — fefaede: correccion de IMP-3 e IMP-4; abreSeccionDeTarea une la regla repetida en rangoPorCabecera y lineasDeTroceo; 1 test nuevo con tres planes; 3 mutaciones en rojo
- code-quality-reviewer — fefaede

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T06:53:34Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 54 | 119932 | 21436173 | 25017 | 6 | 21581176 | - | - |
| 2026-11-23T07:02:14Z | revision | agente:a759d6c42cb6051a9 | 20 | 116738 | 967049 | 7990 | 1 | 1091797 | 1 | - |
| 2026-11-23T07:18:49Z | revision | agente:a01782db0e0f198b3 | 36 | 117512 | 1801182 | 17391 | 1 | 1936121 | 2 | - |
| 2026-11-23T09:04:49Z | revision | agente:a534c3bc319352d3b | 30 | 125440 | 1513307 | 21162 | 1 | 1659939 | 3 | - |
| 2026-11-23T09:20:55Z | revision | agente:a72d8256528efa9e9 | 28 | 128945 | 1406331 | 25875 | 1 | 1561179 | 4 | - |

## Rondas extra

- Ronda 3: Carlos, verificar la correccion de IMP-2 (criterios tras la ultima parte del troceo)
- Ronda 4: Carlos, verificar la correccion de IMP-3 e IMP-4 (cabecera propia de la ultima parte del troceo)

## Resultado

- Implementado: `anadirSeccionAlFinal` (core/transiciones.ts) sustituye las copias de «crear la seccion al final» en cierre, coste-registro, duracion-estimada, transiciones, plataforma-remota y troceo. Duracion, verificacion ligera, rondas extra y URL de merge request leen con `contenidoDeSeccion` (ultima seccion fuera de bloques de codigo, la misma regla con la que se escriben). Troceo acota objetivo y criterios con `rangoPorCabecera` (acepta `### Criterios de aceptacion`) y `abreSeccionDeTarea` une la regla de cabeceras. Test nuevo `test/core/secciones-comunes.test.ts` (9 tests).
- Revision: 4 rondas (3 y 4 extra, decididas por Carlos). Ronda 1: IMP-1 (`## Troceo` se cortaba en un `### Criterios` dentro de una parte), MEN-1 y MEN-2 (tests de bloques de codigo y bordes de duracion), corregidos. Ronda 2: IMP-2 (un `### Criterios` tras la ultima parte se colaba en ella; ya pasaba en develop), corregido. Ronda 3: IMP-3 (la cabecera propia de la ultima parte cerraba la seccion) e IMP-4 (sin test del corte por Objetivo), corregidos. Ronda 4: aprobada.
- No corregido (nota de la ronda 4, sin hallazgo): con un `### Objetivo` despues de los criterios de la ultima parte, fuera de la plantilla de duracion.md y ambiguo por naturaleza, un criterio posterior se descarta o la parte da «no tiene objetivo». Se acepta: la plantilla no usa subcabeceras dentro de las partes y el caso falla de forma visible o queda fuera del troceo.
- Proceso: tres rondas sobre la misma regla de `## Troceo` porque cada correccion cubria un caso y abria el contiguo; la leccion es probar a la vez todas las posiciones de una cabecera (parte intermedia, propia de la ultima, tras la ultima) antes de corregir.

## Verificacion parcial

- 2026-11-23T09:21:03Z: todo el codigo que cambia la tarea (17 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 60 min
- Real (de la rama abierta al cierre con merge, sin pausas): 174 min
- Paso de la hora: 174 min reales frente a 60 estimados
- Cierre (finish): 124 s, de 2026-11-23T09:21:03Z a 2026-11-23T09:23:07Z
