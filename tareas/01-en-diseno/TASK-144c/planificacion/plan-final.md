# Plan — TASK-144c: patrones de ronda, plan que cuenta y doctor-deploy

Redactado por el coordinador (modo rapido; parte c del troceo de TASK-144).

## Enfoque propuesto

Duracion estimada: 50 min (review.ts, plan.ts, approve.ts, trocear.ts, doctor-deploy.ts; 3 criterios)

1. review.ts: `RONDA_FILE_RE` y el patron de `:1025` salen de fs/rondas.ts (CMD2-02).
2. plan.ts y approve.ts: `PETICION_ROL_RE` y los prefijos `salida-brainstorm-` salen de plan-brainstorm.ts (los nombres los genera `nombrePeticionRol`/`nombreSalidaRol`); un rol cuyo id no empiece por `brainstorm-` no rompe la numeracion (CMD2-09).
3. «Que plan cuenta»: una sola funcion en approve.ts (con la misma regla de ambiguedad) que usan planRedactado, duracionDelPlan, trocear y approve (CMD1-10).
4. doctor-deploy: el caso de --resultado dentro del repo se decide con el dato calculado, no buscando el texto del aviso (CMD1-11).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- Los patrones de fs/rondas.ts (PETICION_REVISION_RE, INFORME_REVISION_RE), nombrePeticionRol/nombreSalidaRol de core/plan-brainstorm.ts, resolverPlanFinal/assertPlanNoAmbiguo de approve.ts, y el calculo que doctor-deploy ya hace de la ruta.
- Nuevo: lo minimo para exponer esos patrones donde hoy se reescriben.

## Riesgos aceptados y que los contiene

- Con dos planes, planRedactado y duracionDelPlan pasaran a dar la respuesta de la regla de ambiguedad en vez de elegir el canonico en silencio: es justo lo que pide CMD1-10.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo): 1 por criterio. Rol con id sin prefijo brainstorm- numera bien; con dos planes siguiente y approve responden lo mismo; doctor-deploy sin depender del texto del aviso. Mutacion de cada uno.

## Lo que necesita decision de una persona

Nada abierto.
