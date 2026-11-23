---
id: TASK-149c
titulo: "utilidades de fs (parte c de TASK-149)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 13699288
tokens_revision: 2352257
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-149b]
---
## Objetivo

Parte c del troceo de TASK-149 (Regla 4D: duplicacion en fs, hooks y cli), partes TASK-149a, TASK-149b, TASK-149c en la rama fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli.

Lockfiles, binarios, cola, PATH, JSON con BOM y nombreBase con una implementacion (FS-10 a FS-14, FS-16).

## Criterios de aceptacion
- [x] Lockfiles, deteccion de binarios, lectura de cola, busqueda en PATH, JSON con BOM y nombreBase tienen una sola implementacion; los mensajes de evidencia nombran DIRS_EXCLUIDOS

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T12:31:38Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T12:31:40Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T12:31:41Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T12:44:03Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T12:57:59Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 30bfd1d: buscadas las copias de lockfiles, binario, cola, PATH, BOM y nombreBase; de cada una se queda la mas completa; nuevos candidatosEnPath (la busqueda que devuelve todos, para la status line), textoDirsExcluidos, quitarBom, esArchivoDeBloqueo y el modulo leer-cola.ts (sin dependencias para la via rapida de estado); 1 fichero de test nuevo (4 tests) y la lista de la via rapida actualizada; 5 mutaciones en rojo
- code-quality-reviewer — 30bfd1d

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T12:44:03Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 58 | 36697 | 13639931 | 22602 | 14 | 13699288 | - | - |
| 2026-11-23T12:54:36Z | revision | agente:a70b7433d4c479453 | 44 | 128288 | 2213007 | 10918 | 1 | 2352257 | 1 | - |

## Verificacion ligera

- 2026-11-23T12:54:38Z: ronda 1; commit revisado 2b6f4ad98a6df0c24132a74ecd1ccee51dfc5cef; commit verificado 3e29e4948185626813fac1bc222c930e0edef8d5; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts, taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts; corregidos: MEN-1; pendientes: ninguno

## Resultado

- Implementado: una lista de lockfiles (`esArchivoDeBloqueo` sale de LOCKFILES; ahora tampoco se escanean bun.lock, bun.lockb, pdm.lock ni pylock.toml, y requirements.txt si se escanea); evidencia-veredicto detecta binarios con `decodificar` (un UTF-16 con BOM es texto); `leerCola` en fs/leer-cola.ts, sin dependencias, para progreso (via rapida de estado) y ejecucion-acotada; `candidatosEnPath` (PATHEXT en minusculas; sin extension en Windows solo si se pide) para localizarHerramienta y buscarTaskctl; `quitarBom` en json-claude para leerJson, deteccion-tests y status-line; `nombreBase` y `textoDirsExcluidos` en deteccion-app para los mensajes de las sondas. Test nuevo `test/fs/utilidades-comunes.test.ts` (4) y la lista de la via rapida de estado acepta fs/leer-cola.js.
- Revision: 1 ronda, aprobada. MEN-1 (buscarTaskctl tomaba el PATHEXT del proceso si su env no lo traia) corregido en la verificacion ligera con PATHEXT_POR_DEFECTO. MEN-2 aceptado: en Unix buscarTaskctl usa el criterio de localizarHerramienta (cualquier bit de ejecucion en vez de X_OK); unifica y el caso es muy raro.
- No corregido: nada mas.

## Verificacion parcial

- 2026-11-23T12:54:49Z: todo el codigo que cambia la tarea (24 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 60 min
- Real (de la rama abierta al cierre con merge, sin pausas): 26 min
- Cierre (finish): 190 s, de 2026-11-23T12:54:49Z a 2026-11-23T12:57:59Z
