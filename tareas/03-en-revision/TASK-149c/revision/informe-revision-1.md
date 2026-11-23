# Informe de revision — TASK-149c (ronda 1)

- Commit revisado: 2b6f4ad98a6df0c24132a74ecd1ccee51dfc5cef
- Revisor: code-quality-reviewer (sonnet, independiente)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/fs/herramientas-deploy.ts:50-57, src/fs/status-line.ts:120-123 | implementacion |
| MEN-2 | MENOR | aceptado | src/fs/herramientas-deploy.ts:28 (esEjecutable) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon con tsc limpio; utilidades-comunes, deteccion-tests, doctor-deploy*, doctor, doctor-status-line, estado*, progreso*, verificar-lote, freno-registro y freno-stop: 190 tests, 189 pasan, 1 omitido.
- Mutantes cazados por utilidades-comunes: ARCHIVOS_DE_BLOQUEO sin el filtro de requirements.txt, evidencia-veredicto sin decodificar, candidatosEnPath sin toLowerCase y con sinExtensionEnWindows invertido.
- Puntos vigilados: buscarTaskctl sin cambios reales salvo MEN-1 y MEN-2; nada compara extensiones en mayusculas (ejecutarHerramienta usa /i); el mensaje de leerObjeto solo colapsa espacios; los lockfiles nuevos sin escanear son coherentes con la sonda de lockfile y requirements.txt se sigue escaneando.
- MEN-1: buscarTaskctl con un env sin PATHEXT usa ahora el PATHEXT del proceso, no el fijo de antes.
- MEN-2: en Unix, buscarTaskctl pasa de X_OK a cualquier bit de ejecucion (el criterio de localizarHerramienta). Aceptado: unifica el criterio y el caso (bit de ejecucion solo de grupo u otros) es muy raro.

## Regla 4D

- Duplicacion: cumple
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: cumple

## Lecturas fuera del contexto permitido

- src/fs/herramientas-deploy.ts y src/fs/sondas-deploy.ts completos; grep en src y test de copias residuales y de PATHEXT.
