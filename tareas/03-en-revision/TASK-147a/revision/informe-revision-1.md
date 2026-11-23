# Informe de revision — TASK-147a (ronda 1)

- Commit revisado: 13fa8459264cb6a006d7c74e8eef0ed040c01c08
- Revisor: code-quality-reviewer (sonnet, independiente)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/troceo.ts (rangoPorCabecera en lineasDeTroceo) | implementacion |
| MEN-1 | MENOR | corregido | test/core/secciones-comunes.test.ts | implementacion |
| MEN-2 | MENOR | corregido | src/core/duracion-estimada.ts, src/core/menores.ts, src/core/rondas-extra.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon en %LOCALAPPDATA%\pruebas-claude\taskcode\task-147a-r1, tsc limpio, 114 tests de los modulos tocados en verde. Mutantes cazados: separador de anadirSeccionAlFinal, estimadaAnotada sin seccion, troceo sin otraSeccion, menores, rondas-extra y plataforma-remota leyendo todo el cuerpo. Sobrevive: quitar `!enBloque[i]` de rangoPorCabecera (MEN-1).
- IMP-1: rangoPorCabecera tambien acota `## Troceo`, y su `otraSeccion` corta la seccion en un `### Criterios de aceptacion` u `### Objetivo` dentro de una parte. Con `## Troceo / ### Parte a / ... / ### Criterios de aceptacion / - [ ] a / ### Parte b ...`, leerPartes lanza «declara 1 parte(s)»; en develop devuelve las dos. La regla de otraSeccion es de tarea.md (CORE2-06), no del plan.
- MEN-1: ningun test con `## Objetivo` o `### Criterios` dentro de un bloque, ni de leerPartes con subcabeceras.
- MEN-2: cambios de semantica sin test: `- Estimada` dentro de un bloque de la seccion ahora cuenta; ultima seccion en vez de primera y cabecera con sangria deja de reconocerse; estimadaAnotada ya no busca fuera de la seccion.

## Regla 4D

- Duplicacion: cumple
- Desviacion: IMP-1
- Diluvio: cumple
- Disfraz: MEN-1

## Lecturas fuera del contexto permitido

- skills/task-workflow/duracion.md (plantilla de ## Troceo) y dist/src/core/troceo.js de develop, para comparar.
