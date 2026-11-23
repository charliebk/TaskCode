---
id: TASK-148d
titulo: "comentarios, diluvio y E/S en core (parte d de TASK-148)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 10801195
tokens_revision: 1575536
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-148c]
---
## Objetivo

Parte d del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

Comentarios ciertos, heuristica sin repeticion, TRIVIAL_SIN_APROBACION, formateadores de «—» y la E/S de core (CORE1-14, CORE2-18 a CORE2-21).

## Criterios de aceptacion
- [x] Comentarios de config y dondeFalla ciertos; la E/S de plugin-instalado, heuristica y revisores se documenta o se mueve a fs; TRIVIAL_SIN_APROBACION se elimina o se justifica en una linea

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T23:00:11Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T23:00:13Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T23:00:14Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T23:06:19Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T23:21:32Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 311df9b: buscados CLAVES_NUMERICAS, CLAVES_CONFIG y los formateadores de guion; nuevo celdaNumero (cuatro copias); se borra TRIVIAL_SIN_APROBACION (lista vacia, mecanismo que no hacia nada); 1 test nuevo; 1 mutacion en rojo; el resto lo fijan los tests de state-machine, approve, start, metricas y heuristica
- code-quality-reviewer — 311df9b

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T23:06:19Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 30 | 21493 | 10769519 | 10153 | 7 | 10801195 | - | - |
| 2026-11-23T23:17:59Z | revision | agente:ad7f919db32de78c0 | 30 | 116300 | 1451535 | 7671 | 0 | 1575536 | 1 | - |

## Verificacion ligera

- 2026-11-23T23:18:01Z: ronda 1; commit revisado 53cc8a657c1736d46447f1c3b8404e863a29de8e; commit verificado a8677a1e94b0ba6dc4b715dab2e1be8d4d664550; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts; corregidos: MEN-2, MEN-3; pendientes: ninguno

## Resultado

- Implementado: la cabecera de config ya no dice «TRES claves» (son las de CLAVES_CONFIG, atadas al switch por un test) y el doc de dondeFalla dice que el tope lo aplica componerTarea; TRIVIAL_SIN_APROBACION (lista vacia: un mecanismo que no hacia nada) desaparece y start exige la aprobacion siempre, con la razon en una linea; el tipo Heuristica sale de CLAVES_NUMERICAS y su cabecera pasa de 85 a 32 lineas (la historia vive en git y en las tareas); celdaNumero (metricas) sustituye cuatro formateadores de guion y siete guiones escritos a mano; heuristica, plugin-instalado y revisores documentan en su cabecera la E/S que hacen en core (se documenta en vez de mover, como permite el criterio).
- Revision: 1 ronda, aprobada con correcciones, solo MENORES: MEN-2 (guiones a mano) y MEN-3 (lineas en blanco dobles) corregidos en la verificacion ligera; MEN-1 aceptado (con dos claves de heuristica ausentes a la vez se nombra primero otra; con una sola, el mismo mensaje).
- No corregido: nada mas.

## Verificacion parcial

- 2026-11-23T23:18:17Z: todo el codigo que cambia la tarea (23 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 45 min
- Real (de la rama abierta al cierre con merge, sin pausas): 21 min
- Cierre (finish): 195 s, de 2026-11-23T23:18:17Z a 2026-11-23T23:21:32Z
