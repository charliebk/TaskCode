# Informe de revision — TASK-130 (ronda 1)

- Commit revisado: 24cb77c1e25871be2337d05dc6d3ff169a15e58b
- Revisor: revisor independiente (agente general-purpose, skill code-quality-reviewer)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/core/poda-tests.test.ts | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### MEN-1 — el limite exacto de `tareas_entre_podas` no se prueba

`comprobarPodaTests` avisa con `desde > n` («mas de N tareas», como dicen la guia,
el CHANGELOG y la clave). Los tests solo usan 4 > 3 (aviso) y 2 de 3 (ok); nunca
`desde == n`. Mutante reproducido en el clon: en `dist/src/commands/doctor.js`,
`if (desde > n)` cambiado a `if (desde >= n)`; `node --test dist/test/core/poda-tests.test.js`
sigue en 3/3 pass, el mutante sobrevive. Arreglo: un caso con exactamente N tareas
terminadas sin poda que espere `ok` («3 de 3 ...»).

### MEN-2 — el ayudante `caso()` esta copiado en diez ficheros de test

La fusion envuelve cada caso en `await caso(nombre, fn)` para rotular el error, y la misma
funcion esta definida en `test/commands/doctor-deploy-aplicaciones.test.ts`,
`doctor-deploy-config.test.ts`, `doctor-deploy-resultado.test.ts`, `doctor-deploy.test.ts`,
`doctor-hooks-subagente.test.ts`, `doctor.test.ts`, `test/fs/git.test.ts`,
`test/hooks/freno-stop.test.ts`, `guardia-documentacion.test.ts` y `guardia-merge.test.ts`
(`grep -rln "function caso(" test` da diez). Es duplicacion real de un ayudante de 8
lineas; iria en `test/helpers/`. Ademas el cuerpo de cada `caso` queda con la indentacion
original dentro del `test(...)` (las llamadas `await caso(` a columna 0), lo que lee mal.
No afecta a la deteccion ni a la cobertura.

## Verificacion hecha

- Verificacion de la ronda (la de la peticion): `node scripts/verificar-impacto.mjs`,
  747/747 en verde sobre 24cb77c; no repetida.
- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-130-r1`, `npm install`, `npm run build`
  sin errores. `node --test dist/test/core/poda-tests.test.js dist/test/skills/tamanos.test.js`:
  10/10 pass. Ademas `import`, `wrappers`, `guardia-merge`, `heuristica`, `asignado`: 30/30; y
  `task-id`, `task`, `transiciones`, `wip`, `state-machine`: 27/27. Nada de suite completa.
- Aserciones antes y despues, por fichero (`develop` frente a HEAD), contando `assert*(`:
  iguales en 26 de los 28 ficheros tocados, y tambien iguales por tipo
  (equal/deepEqual/match/ok/throws/rejects...) en guardia-merge, transiciones, heuristica,
  asignado y doctor. Las dos excepciones:
  - `test/core/task.test.ts` 25 -> 16: el diff muestra que son los 9 `assert.throws` de
    `validateTask` pasados a una tabla `casos` con un solo `assert.throws` en bucle (mismos
    valores: id, tipo, complejidad, estado, titulo, sprint 1.5 y -1, plan_aprobado, etiquetas,
    mas los tokens `12k`, 1.5, -3 por campo), con el campo comprobado en cada vuelta. Ninguna
    comprobacion perdida.
  - `test/commands/wrappers.test.ts` 65 -> 63: los dos que faltan son `code == 0` y
    `avisos == []` de «pause sin terminal y con el workspace limpio», que el mismo test fusionado
    ya hace (con el repo de `withTempRepo`, identico al del test «sin .gitignore»: sin
    `.gitignore`, commit inicial) y ademas con `status` limpio antes y despues y el registro
    en `.git`. Es un duplicado exacto, no una perdida. El plan decia «ningun borrado»: aqui hay
    uno, justificado, y no esta anotado en la seccion «Medida».
- `import.test.ts`: el cambio de `ids.length === 1` a `idsAntes + 1` sigue probando lo mismo.
  El `idsAntes` se lee justo antes del primer import del caso idempotente y la comprobacion
  se hace tras el reimport: si el reimport duplicara, seria `idsAntes + 2` y fallaria. La
  version absoluta valia por tener un repo vacio; en el repo compartido la relativa es la
  equivalente. Los `listExistingTaskIds == []` de los casos de fallo se conservaron, y el de
  workspace sucio se movio al principio, con el repo aun sin tareas.
- Los casos de `guardia-merge.test.ts` conservan cada asercion; el ayudante `caso` solo
  antepone `[nombre]` al mensaje. Un caso fallido corta el resto de su test agrupado (menos
  aislamiento): riesgo ya aceptado en el plan.
- Mutantes en el clon (restaurados despues):
  - `comprobarPodaTests` ignora la etiqueta `poda` (`includes(ETIQUETA_PODA)` -> `false`):
    detectado (poda-tests 2 pass, 1 fail).
  - `desde > n` -> `desde >= n`: NO detectado (MEN-1).
  - `task-id.js`, `n >= ID_RESERVADO_MIN` -> `>`: detectado (1 fail); `n > max` -> `n >= max + 5`:
    detectado; `padStart(3` -> `padStart(2`: detectado. Tambien se quito `[a-z]?` del
    patron de ID y sobrevivio, pero tampoco lo cubria el `task-id.test.ts` de `develop`: no es
    regresion de la poda.
  - `comando-merge.js`, `'nohup'` -> `'nohupx'` (caso cubierto por un test fusionado de
    guardia-merge): detectado, y el mensaje dice el caso:
    «[comando-merge (TASK-103): { ...; }, time y eval no esconden el merge] nohup git merge x».
- Resto de la tarea: la clave `tareas_entre_podas` se valida (entero >= 1, defecto 30) y se
  documenta en `config.ts`, `docs/configuracion.md` y el CHANGELOG; `poda-tests.md` existe, esta
  enlazado desde `tests-pesados.md` y `tamanos.test.ts` pasa. Sin hallazgos en doctor.ts mas
  alla de MEN-1.

## Reproduccion

- MEN-1: en el clon, `taskcode-marketplace/plugins/taskcode-plugin`, tras `npm run build`:
  `sed -i 's/if (desde > n)/if (desde >= n)/' dist/src/commands/doctor.js` y
  `node --test dist/test/core/poda-tests.test.js` -> `# pass 3 # fail 0`.
- MEN-2: `grep -rln "function caso(" test` en el mismo directorio -> los diez ficheros citados.

## Lecturas fuera del contexto permitido

- `test/commands/wrappers.test.ts` (version de `develop` y HEAD) y su ayudante `withTempRepo`,
  para comprobar que el repo del test fusionado es identico al del test del que venia.
- `src/core/task-id.ts` (compilado en `dist/`) y `src/core/comando-merge.ts` (compilado),
  solo para elegir y aplicar mutantes sobre funciones cubiertas por tests fusionados.
- `test/core/task-id.test.ts` de `develop`, para saber si el sufijo de letra estaba cubierto antes.
