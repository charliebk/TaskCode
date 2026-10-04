# Brainstorm — TASK-043, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`

## Enfoque
Modulo puro nuevo `src/core/validacion-tarea.ts`, sin E/S y que nunca lanza:
devuelve motivos. `plan` los convierte en error, `approve` en error y `finish`
en aviso. Todo recuento de criterios sale de `extraerSecciones`.

## Piezas y limites
- `validarEnunciado(s: SeccionesTarea): MotivoRechazo[]` — limites 1..8,
  criterio vacio, lint de verificabilidad; recibe las secciones ya extraidas.
- `planEsEsqueleto(contenido, scaffold)` — compara cada seccion `##`
  normalizada con la de `planTemplate(task, roles)`; sin textos fijos copiados.
- `casillasPendientes(body)` — barrido propio que se salta `### Tras el cierre`.
- `plan.ts`: sustituye la puerta actual (lineas 445-452, `roles.length > 0 &&
  objetivo === ''`) por `validarEnunciado` en el mismo sitio, tras la lectura
  fresca y antes de cualquier escritura o movimiento; sin condicion (tambien
  con 0 roles).
- `approve.ts`: tras `assertPlanNoAmbiguo` y antes de mover, compara el plan
  con `planTemplate` (roles recalculados como en `plan`).
- `finish.ts`: `avisoCasillas` en el resultado, calculado sobre la lectura
  fresca; solo aviso; lo imprime `cli.ts`.

## Orden de construccion
1. Modulo + script de calibracion sobre las 17 cerradas. 2. plan. 3. approve.
4. finish + cli.

## Alternativa descartada
Validar en `new`/`import` o en la maquina de estados (rompe su contrato de solo
metadatos); detectar el esqueleto por bytes (cambia con el numero de roles).

## Desacuerdos previstos
- Validar tras la lectura fresca, no la preliminar (la preliminar puede ser de
  una rama vieja: CRITICO de TASK-012).
- Los criterios bajo `### Tras el cierre` no cuentan, como regla explicita.

## Suposiciones no verificadas
- **D2**: `extraerSecciones` corta en cualquier `###`; hoy `### Tras el cierre`
  queda fuera por accidente y cualquier otro `###` en Criterios da recuentos
  falsos. **Conviene que TASK-046 vaya antes**, o la calibracion se mide con el
  parser roto.
- Recalcular roles en `approve` puede dar otro scaffold si cambio la tarea:
  comparar contra los de 0, 1 y N roles.
