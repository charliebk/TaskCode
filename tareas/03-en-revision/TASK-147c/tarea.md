---
id: TASK-147c
titulo: "fases y Marca en metricas (parte c de TASK-147)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 2066402
tokens_revision: 1827618
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-147b]
---
## Objetivo

Parte c del troceo de TASK-147 (Regla 4D: lectores de secciones e IDs en core), partes TASK-147a, TASK-147b, TASK-147c en la rama fix/task-147-regla-4d-lectores-de-secciones-e-ids-en.

Un solo tipo de fase y una sola conversion de fila a Marca (CORE2-12, CORE2-13).

## Criterios de aceptacion
- [ ] FaseMedida y FaseRegistrada son un solo tipo y fila a Marca se convierte una vez en metricas

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T10:21:42Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T10:21:43Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T10:21:44Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T10:28:45Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 2976c51: buscados FaseRegistrada, FASES, leerTransiciones e instanteDe antes de escribir; nuevos registroDe y duracionDeSegundos (cada conversion estaba dos veces); 1 fichero de test nuevo (2 tests); 2 mutaciones en rojo (registroDe en metricas-registro, duracionDeSegundos en metricas-puertas)
- code-quality-reviewer — 2976c51

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T10:28:45Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 14 | 10392 | 2048900 | 7096 | 1 | 2066402 | - | - |
| 2026-11-23T10:34:57Z | revision | agente:abec839d3a11ad69b | 34 | 120915 | 1695896 | 10773 | 2 | 1827618 | 1 | - |

## Verificacion ligera

- 2026-11-23T10:34:58Z: ronda 1; commit revisado 81b43088d92a9a194f40bde124f7bae8fa565aee; commit verificado d4cae562a268750cc3b28e71b15782ef7214b68e; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-registro.test.ts; corregidos: MEN-1, MEN-2, MEN-3; pendientes: ninguno
