# Informe de revision — TASK-148b (ronda 2)

- Commit revisado: a4fca666a847f21e9f1a598cda9a152160059e99
- Revisor: code-quality-reviewer (haiku, independiente)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/fs/evidencia-veredicto.ts (comprobadorEnCommit normaliza la ruta) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon con tsc limpio y dist igual al versionado; utilidades-comunes, config-validacion-comun, config-verificacion y review-exclusion 22/22; doctor-deploy-resultado 6/6; selectiva de la peticion 841/0.
- IMP-1: quitar la normalizacion de comprobadorEnCommit pone en rojo el test con `sub/../utf16.txt`. Sonda contra el commit real: `x/../f`, `./f` admitidos; `x/../../f` rechazado. Patrones: `a/../**` y `docs/../tareas/**` rechazados.
- Notas sin hallazgo (MENOR): `.` y `a/..` pasan motivoRutaInvalida y los rechaza despues comprobadorEnCommit como no versionados (ya pasaba antes); la evidencia se guarda tal cual la escribio el agente (`a/../b`); el nombre de un test de doctor-deploy-resultado dice «con ..» y prueba rutas que salen; el mensaje del patron dice «sale del repo con ".."» para `a/../**`, que no sale.

## Regla 4D

- Duplicacion: cumple
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: cumple

## Lecturas fuera del contexto permitido

- src/fs/evidencia-veredicto.ts, src/core/ruta-relativa.ts, test/commands/doctor-deploy-resultado.test.ts y grep de consumidores de `fichero`.
