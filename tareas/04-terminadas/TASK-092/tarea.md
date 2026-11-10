---
id: TASK-092
titulo: "Sincronización de ficheros sueltos de la raíz de tareas/"
tipo: feature
sprint: 0
etiquetas: [config, sincronizacion]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-092-sincronizacion-de-ficheros-sueltos-de-la
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2076577
tokens_implementacion: 9098827
tokens_revision: 1158595
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Que un proyecto pueda regenerar en cada transición un fichero derivado que vive en la raíz de tareas/ (p. ej. tareas/ROADMAP.md de ToolsaWeb). Hoy rutas_sincronizacion rechaza todo lo que cuelga de tareas/, así que el ROADMAP se queda atrasado tras plan/start/review/finish y la verificación del proyecto sale en rojo (medido en ToolsaWeb TASK-295 el 2026-11-10: una completa de 20 min repetida por dos líneas). taskctl solo escribe dentro de las carpetas de estado (tareas/0N-*/), así que un fichero suelto en la raíz de tareas/ no choca con lo que escribe el CLI.

## Criterios de aceptacion
- [x] rutas_sincronizacion admite un fichero directamente en la raíz de tareas/ (tareas/ROADMAP.md) y sigue rechazando tareas/<carpeta de estado>/..., tareas/ como carpeta, .taskcode/ y .git/, con tests de config para cada caso
- [x] En un repo temporal con comando_sincronizacion que reescribe tareas/ROADMAP.md, cada uno de new, plan, approve, start, review y finish deja ROADMAP.md regenerado dentro del mismo commit de la transición (test de integración)
- [x] Las tres salvaguardas de sincronizacion.md (ruta con cambios previos, comando que falla, fichero no declarado) funcionan igual con una ruta de la raíz de tareas/, con un test por caso
- [x] skills/task-workflow/sincronizacion.md y el README describen la nueva regla y su motivo, y CHANGELOG.md la anota en la versión siguiente
- [x] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ni borrar ningún test

## Resultado

**Implementado.** Un único cambio de código, en `motivoRutaInvalida` (`src/core/config.ts`), con una opción `ficheroEnRaizDeTareas` que solo pasa `rutas_sincronizacion`: se acepta una ruta de exactamente dos segmentos cuyo primero es `tareas` y cuyo segundo no es una carpeta de estado (la lista sale de `STATE_FOLDER`). La sincronización, `autoCommit` y las salvaguardas no cambian. Las raíces prohibidas y los nombres de estado se comparan sin distinguir mayúsculas y sin puntos ni espacios finales (Windows los ignora). `informe_cobertura` sigue rechazando todo lo que cuelga de `tareas/`. Tests: casos de config (aceptación normalizada, rechazos de cada carpeta de estado, subcarpetas, `tareas`, `tareas/`, mayúsculas, puntos/espacios finales, no regresión de `informe_cobertura`), un `resolverConfig` en disco, el integral new → plan → approve → start → review → finish con `tareas/ROADMAP.md` y uno por salvaguarda en `test/commands/sincronizacion-raiz-tareas.test.ts`. Documentación en `sincronizacion.md` (que además ya no omite `.git/`), una sección nueva del README del plugin y la entrada 0.14.0 del CHANGELOG.

**Decisiones de la persona (plan).** Se cambió la expectativa del antiguo caso `'[tareas/x.md]'` de `config-sincronizacion.test.ts`: el criterio 1 obliga a aceptar esa forma, así que pasó al test de aceptación y se sustituyó por rechazos más estrictos dentro de `tareas/`; no es un test debilitado (el revisor lo confirmó). Se cerró en esta tarea el hueco de mayúsculas, se aceptan los ficheros ocultos (`tareas/.x`) y `informe_cobertura` no se abre.

**Autorrevisión.** Encontró que `tareas/01-en-diseno./x.md` o `.git./HEAD` pasaban la validación; corregido con `nombreComparable` y tests antes de pedir la revisión.

**Revisión por pares (ronda 1, code-quality-reviewer): aprobada, sin hallazgos.** Reprodujo en clon temporal: 46/46 en los tests afectados, `test:rapido` 682/682 y 7 mutantes de `motivoRutaInvalida`, todos detectados. Observación sin severidad, no corregida a propósito: los alias de ruta de Windows (nombres cortos 8.3, flujos `::$DATA`) no se contemplan; es endurecimiento fuera del alcance.

**Suite completa.** 2087 tests, 2079 en verde. Rojos: los 3 conocidos de Windows (symlink `EPERM`, `chmod` en NTFS, CRLF) y 4 que dependen de tiempos y expiraron bajo carga de la máquina (3 de sincronización con el timeout de 60/20 s del script y `origin-deteccion`); repetidos solos pasan (15/15 y 3 de 3), y `origin-deteccion` pasa con y sin el cambio.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T12:44:55Z | plan | automatico | persona | 0.13.0 |
| 2026-11-10T12:53:31Z | approve | automatico | persona | 0.13.0 |
| 2026-11-10T12:53:38Z | start | automatico | persona | 0.13.0 |
| 2026-11-10T13:42:48Z | review | automatico | persona | 0.13.0 |
| 2026-11-10T13:50:05Z | finish | automatico | persona | 0.13.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T12:51:59Z | diseno | agente:a28a3c67e7f8c02fa | 68 | 90497 | 1968455 | 17557 | 42 | 2076577 | - | - |
| 2026-11-10T13:42:48Z | implementacion | sesion:f5a75e93-b137-4945-9f2a-de03fa092974 | 114 | 82685 | 8982672 | 33356 | 14 | 9098827 | - | - |
| 2026-11-10T13:49:24Z | revision | agente:ab70277f2a9217521 | 22 | 111887 | 1039767 | 6919 | 2 | 1158595 | 1 | - |

## Autorrevision

- code-quality-reviewer — 4b8aec1
