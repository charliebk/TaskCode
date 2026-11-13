# Informe de revision — TASK-115 (ronda 2)

- Commit revisado: 3026b9aa6a4609a4400d350785f0cd977e7be37f
- Revisor: code-quality-reviewer (revisor independiente; verificacion acotada a las correcciones de la ronda 1)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/commands/finish-verificacion.ts:237 (condicion del lote con `o.permitirSelectiva === true`) | implementacion |
| MEN-1 | MENOR | corregido | src/core/transiciones.ts:anotarPendienteLote (usa `anotarLineaUnica`) | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts (pendienteDeLote: solo las lineas con la marca de taskctl) | implementacion |
| MEN-3 | MENOR | corregido | src/commands/verificar-lote.ts:109-129 (progreso y `TASKCTL_PROGRESO` en el comando de verificacion) | implementacion |
| MEN-4 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts (progreso.terminar sin cubrir un lanzamiento; nuevo) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRITICO ni IMPORTANTE abiertos. Las dos MENOR abiertas quedan documentadas; el coordinador decide si las corrige antes de integrar.

### IMP-1 — corregido

Dos tests nuevos cubren la exclusion: `finish (TASK-115, IMP-1): un hotfix va a la completa...` y `... un release va a la completa...`. El hotfix llega con `permitirSelectiva` en false (src/commands/finish.ts:565) y el release no recibe `ramaBase` (finish.ts:563), asi que la condicion del lote no se dispara en ninguno de los dos.

Mutante sobre `dist/src/commands/finish-verificacion.js:158` (quitar `o.permitirSelectiva === true &&`): muere. Resultado: `not ok 16 - ...un hotfix va a la completa aunque la principal declare el lote`, 17 pasan y 1 falla. El test del release no mata este mutante, y es correcto: el release ya queda fuera porque no tiene `ramaBase`.

Revisado tambien que la correccion no abre un camino nuevo: `permitirSelectiva` del release es true en finish.ts:565 (via selectiva), pero sin `ramaBase` la rama del lote no puede dispararse.

### MEN-1 — corregido

`anotarPendienteLote` usa ahora `anotarLineaUnica`, y el test `lote (TASK-115, MEN-1/MEN-2): un reintento no duplica la pendiente` lo comprueba. Mutante (volver a `anotarLineaEnSeccion` en `dist/src/core/transiciones.js:326`): muere en ese test (`not ok 18`).

### MEN-2 — abierto (corregido en lo principal, queda un caso)

La correccion arregla lo de la ronda 1: `pendienteDeLote` usa `rangoDeSeccion` (ignora bloques de codigo) y una nota a mano sin la marca ya no cambia el resultado. Pero ahora revisa **todas** las lineas `- ` de la seccion buscando la frase, no solo las que escribe taskctl, que era lo que pedia la ronda 1 («mirar solo las lineas con la marca de taskctl»). Eso abre dos casos, ambos reproducidos:

- Una tarea pendiente a la que alguien anade a mano la frase `lote en verde en` deja de ser pendiente: `pendienteDeLote` devuelve `false`. Es un falso negativo silencioso: `verificar-lote` no la recoge y la tarea se integra sin la completa.
- Una tarea ya verificada a la que alguien anade una nota con `pendiente de lote` vuelve a ser pendiente: devuelve `true`. Es un falso positivo; no pierde nada, pero obliga a otra corrida del lote.

Severidad MENOR porque hace falta que una persona escriba la frase exacta, pero el falso negativo no avisa. Arreglo sugerido: contar solo las lineas que empiezan por `- <instante>: ` seguido de la marca, con la misma forma que escribe `anotarLineaUnica`. Los tests actuales no cubren la frase en notas manuales: el test de la ronda solo prueba una nota sin la frase.

### MEN-3 — corregido

`verificar-lote` marca las fases con `progreso.fase` y `progreso.paso`, pasa `entornoConContador(...)` a `ejecutarVerificacion` y cierra con `progreso.terminar`. Comprobado en `dist/src/commands/verificar-lote.js`. El test `verificar-lote (TASK-115): una completa en develop...` comprueba que `leerProgreso` da `fase: 'finish'` y `resultado: 'ok'`, y pasa.

### MEN-4 — abierto (nuevo, lo introduce la correccion de MEN-3; no verificado en ejecucion)

`progreso.terminar` va justo despues de `ejecutarVerificacion`, sin `try/finally`. Los demas comandos (`approve`, `plan`, `review`, `start`, `finish`) usan `conProgreso`, que cierra la fase tambien cuando lanza. Si `ejecutarVerificacion` lanza despues de correr el comando (p. ej. el `git status fallo` de `src/fs/ejecucion-acotada.ts:214`), el progreso queda en el paso `verificacion lote` con el contador activo y sin terminar. Consecuencia: el x/N visible en la terminal queda colgado. No afecta al estado de la tarea ni a git.

No verificado: no conseguí forzar ese lanzamiento. Caso a ejecutar: hacer que `git status` falle justo despues de la verificacion y leer `leerProgreso(repo)`. Resultado esperado si el hallazgo es real: `terminado: false`. Arreglo sugerido: usar `conProgreso(progreso, () => ...)`.

## Verificacion hecha

- Clon limpio en `C:\Users\nullcad2025\AppData\Local\pruebas-claude\taskcode\task-115-r2` (ya borrado), rama `feature/task-115-p-7-verificacion-completa-por-lote-de-ci`, HEAD `a2a668f`. El unico cambio entre `3026b9a` y `a2a668f` es la carpeta `tareas/` de la peticion: el codigo revisado es `3026b9a`.
- `npm install` y `npm run build` sin errores.
- `node --test dist/test/commands/verificar-lote.test.js dist/test/commands/finish-verificacion.test.js`: 18 pasan, 0 fallan, sobre el commit revisado.
- Suite selectiva: no repetida. La peticion trae `node scripts/verificar-impacto.mjs` en verde (922 pasan, 0 fallan) para el mismo commit verificado, `3026b9a`.
- Mutantes sobre `dist/`, restaurando el original tras cada uno:
  - M1, quitar `o.permitirSelectiva === true &&` en `finish-verificacion.js:158`: muerto (1 falla, el test del hotfix).
  - M2, volver a `anotarLineaEnSeccion` en `anotarPendienteLote`: muerto (1 falla, `un reintento no duplica la pendiente`).
  - M3, `pendienteDeLote` ignora el «lote en verde» (`else if (false)`): muerto (2 fallan: `una completa en develop anota en verde...` y `un reintento no duplica...`).
- Casos buscados que la correccion podria abrir: el release y el hotfix con la condicion del lote (ver IMP-1); el reintento de `anotarPendienteLote` tras una pendiente ya existente (cubierto por el test de MEN-1). De esa busqueda salen MEN-2 y MEN-4.

## Reproduccion

- IMP-1: mutante M1 arriba, sobre el clon.
- MEN-1: mutante M2 arriba.
- MEN-2: `node --input-type=module` importando `dist/src/core/transiciones.js` con `anotarPendienteLote(\"## Objetivo\\nx\\n\", ...)`:
  - pendiente + nota manual `lote en verde en develop el lunes` → `pendienteDeLote` = `false` (falso negativo).
  - verde real + nota manual `revisar lo pendiente de lote antes del release` → `pendienteDeLote` = `true` (falso positivo).
  - pendiente base → `true`; verde real → `false` (correcto).
- MEN-3: lectura de `dist/src/commands/verificar-lote.js` y el test de progreso, que pasa.
- MEN-4: no reproducido (ver arriba). Sin ejecutar.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md` (lineas 196-215): reglas del veredicto.
- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts` (lineas 540-670): `ramaBase` y `permitirSelectiva` que recibe la puerta, para comprobar IMP-1.
- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts` (lineas 136-150 y 225-240): `porLoteEnBase` y la condicion del lote.
- `taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts` (lineas 200-230 y 455-480): `rangoDeSeccion` y `anotarLineaUnica`, para MEN-1 y MEN-2.
- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts`: `crearProgreso`, `conProgreso` y `entornoConContador`, para MEN-3 y MEN-4.
- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts` (lineas 205-216): origen del posible lanzamiento de MEN-4.
- Motivo de todas: comprobar los caminos que las correcciones tocan. No se leyo nada mas.
