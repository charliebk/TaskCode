# Brainstorm — TASK-097, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

Referencias relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Enfoque propuesto, con rutas y nombres concretos

Un módulo puro nuevo, `core/duracion-estimada.ts`, lee la línea `Duracion estimada: N min` y define el umbral de 60. Lo usan tres sitios que ya existen: approve (aviso), siguiente/flujo (pregunta) y finish (anotación). Los minutos reales salen de `duracionSinPausas` (TASK-086), no de un cálculo nuevo. Nada aborta por la estimación.

## Que se extiende y que se crea

- `src/core/duracion-estimada.ts` (nuevo): `leerDuracionEstimada(texto): number | null` (regex de línea `^Duracion estimada:\s*(\d+)\s*min`) y `UMBRAL_MINUTOS = 60`.
- `src/commands/plan.ts:254-262` (`planTemplate`): añade `Duracion estimada:  min` con sus señales (ficheros de código, capas, criterios) bajo «Enfoque propuesto». `planEsPlantilla` (`approve.ts:285-293`) compara contra `planTemplate`, así que la plantilla vacía sigue contando como esqueleto.
- `src/commands/approve.ts:169-175`: tras la guarda TASK-043 (ya tiene `rutaPlan`), si `leerDuracionEstimada` da null, aviso en el resultado sin abortar (approve no tiene `onAviso`).
- `src/core/flujo.ts:40-57 y 157`: `ContextoFlujo` gana `duracionEstimada: number | null`; si pasa de 60, `paso('approve', true, motivo con trocear, cmd, exigePersona=true)`, el mismo mecanismo de las líneas 149-155.
- `src/commands/siguiente.ts:211-218`: ya resuelve el plan para `planRedactado`; ahí rellena `duracionEstimada`.
- `src/core/metricas.ts:348` + `src/commands/finish.ts:655`: nueva `minutosPuntaAPunta(body)` en metricas.ts (`leerTransiciones` → `marcasDe` → `duracionSinPausas(start, finish, pausas)`, en minutos). Finish la llama tras `registrarTransicion` y escribe en tarea.md `## Duracion` (estimada N, real M), con el precedente de `anotarVerificacionOmitida` (`transiciones.ts:348`). Metricas lee esa estimación del body.

Orden: 1) módulo y línea de la plantilla; 2) aviso en approve; 3) contexto y rama `> 60`; 4) `minutosPuntaAPunta`, anotación en finish y columna en metricas; 5) skills, README y CHANGELOG.

## Limites que cruza

- Formato de `plan-final.md` (línea nueva) y de `tarea.md` (sección `## Duracion`); contrato de `siguiente --json` en approve.
- `marcasDe` no se exporta (`metricas.ts:299`): se envuelve en `minutosPuntaAPunta` sin exponerla.

## La decision de diseño que mas te preocupa (UNA sola)

«Preguntar en cualquier modo»: `accionPara` devuelve `detener` en manual antes de mirar `exigePersona` (`flujo.ts:100`). Posición: «cualquier modo» = cualquier modo que encadena; manual sigue en `detener` porque ya para siempre.

## Alternativas descartadas y suposiciones

- Que finish calcule su propio start→finish: dos cálculos del mismo hecho; el de metricas ya trata pausas y precisión de día (`metricas.ts:285-357`).
- Que metricas lea `plan-final.md`: dependencia nueva con planificación.
- Sin precisión de segundo, `duracionSinPausas` da días: finish anota `real: —`.
- Sin verificar: metricas cuenta hoy de plan a finish (`total`, `metricas.ts:417`); la columna nueva va aparte. Cómo pinta el CLI un aviso de approve. Tests que comparen `planTemplate` literalmente.
