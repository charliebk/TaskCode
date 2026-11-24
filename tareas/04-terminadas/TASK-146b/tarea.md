---
id: TASK-146b
titulo: "registrar-coste, readdir, fecha y cabeceras (parte b de TASK-146)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-146-regla-4d-duplicacion-en-new-import-roadm
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 17475795
tokens_revision: 1849693
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: [TASK-146a]
---
## Objetivo

Parte b del troceo de TASK-146 (Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste), partes TASK-146a, TASK-146b en la rama fix/task-146-regla-4d-duplicacion-en-new-import-roadm.

registrar-coste suma con CAMPOS_COSTE, un helper de readdir tolerante y claveRuta en un sitio, diaLocal en doctor-deploy y creado con la regla de new, cabeceras fieles y la historia de runPlan fuera del codigo.

## Criterios de aceptacion
- [x] registrar-coste suma con CAMPOS_COSTE, los readdir tolerantes y claveRuta tienen un solo helper, y doctor-deploy usa diaLocal con la fecha de creado igual que new
- [x] Las cabeceras de registrar-coste, veredicto y review describen lo que hace el codigo, y runPlan deja la historia de las rondas en el CHANGELOG

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T15:32:33Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T15:32:59Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T15:33:01Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T15:53:07Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T16:18:10Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 679ff9f: costeCero y costeDeFila sobre CAMPOS_COSTE (sin campos a mano); listarSiExiste junto a isEnoent/isEnotdir en task-store; claveRuta de fs/cobertura reutilizada; diaUtc junto a diaLocal y usada tambien por today() de cli; en plan solo se quita la cronica de intentos, no las explicaciones de por que el codigo es asi; mutacion en rojo: creado con diaLocal
- code-quality-reviewer — 679ff9f

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T15:53:07Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 50 | 31481 | 17427880 | 16384 | 16 | 17475795 | - | - |
| 2026-11-24T16:13:19Z | revision | agente:a78cc77913fc7b9ca | 32 | 124957 | 1714437 | 10267 | 4 | 1849693 | 1 | - |

## Verificacion ligera

- 2026-11-24T16:13:34Z: ronda 1; commit revisado 42882e9cf3512cb5ab82cb32e1d616472609a02d; commit verificado 7b520d3633f1ed71da4ed3e9f423acf91fa3b122; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts, taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts, taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-tareas.test.ts; corregidos: MEN-1, MEN-2, MEN-3, MEN-4; pendientes: ninguno

## Resultado

- CMD2-12: registrar-coste pone a cero y suma con `costeCero` y `costeDeFila`, generados a partir de `CAMPOS_COSTE`. Un campo nuevo ya no queda sin poner ni da `NaN`.
- CMD2-13: `listarSiExiste`, en task-store, sustituye los tres readdir tolerantes de metricas, plan y registrar-coste. `claveRuta` queda solo en fs/cobertura.
- CMD1-08: `diaUtc`, en core/documento-estado, la usan `today()` de cli y el `creado` de doctor-deploy `--crear-tareas`, que antes iba en hora local. El informe de doctor-deploy se nombra con `diaLocal`. El test prueba dos instantes y discrimina en cualquier zona horaria salvo UTC.
- CMD2-15 y CMD2-16: las cabeceras de registrar-coste, veredicto y review describen ya TASK-119 (no commitean, salvo registrar-coste con la tarea terminada) y TASK-018/091. La crónica de intentos de runPlan sale del código y queda en git.
- Revisión, ronda 1: aprobada con correcciones; los cuatro MENORES están corregidos. El reordenado del import de doctor-deploy (parte de MEN-3) se deshizo porque cae fuera de los ficheros citados.

## Verificacion parcial

- 2026-11-24T16:13:49Z: todo el codigo que cambia la tarea (20 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 45 min
- Real (de la rama abierta al cierre con merge, sin pausas): 45 min
- Cierre (finish): 261 s, de 2026-11-24T16:13:49Z a 2026-11-24T16:18:10Z
