# Informe de revisión — TASK-027 (ronda 2)

- Commit revisado: 038bef67b1d6134845993a259a1105b810a126de
- Revisor: agente independiente (no implementó TASK-027)
- Veredicto: aprobada

Este informe cubre las dos pasadas de la ronda 2: la primera sobre `6feb449`
(que produjo tres hallazgos) y la definitiva sobre `038bef6`, que los corrige.
El registro de la primera pasada se conserva íntegro en la sección "Hallazgos
de la primera pasada", con el estado de cada uno tras la corrección.

## Cómo se ha revisado

Reproducción empírica sobre un **clon** del repo fuera del árbol de trabajo
(`C:\Users\nullcad2025\AppData\Local\Temp\rev027r2\clon`), con `dist/` borrado y
`npm run build` propio tras el cambio de commit. Todo lo que se afirma aquí se
ha ejecutado.

La novedad metodológica de esta pasada es que **se ha conseguido correr el
código en Linux de verdad**, que era la incógnita que dejó abierta la primera:

- Node 22 (build musl) descargado y ejecutado dentro de la distro WSL
  `docker-desktop` (Alpine 3.23, kernel Linux, x86_64), con `libstdc++`/`libgcc`
  de Alpine añadidos para satisfacer el enlazado.
- `git` 2.52 instalado con `apk --root` en un rootfs aparte, para que los tests
  que montan repos Git temporales pudieran ejecutarse.
- `TMPDIR` apuntando al disco de Windows porque el `/` de esa distro está al
  100%.

Con eso, `plan.test.js` + `approve.test.js` se han ejecutado **en Linux real**,
no simulados, tanto con el fix como con el fix revertido. Esa es la evidencia
que cierra el hallazgo IMPORTANTE.

## Línea base

**Windows** (suite completa, `node --test "dist/test/**/*.test.js"`):

```
# tests 428
# pass 425
# fail 3
not ok  44 - approve: propaga cualquier error de stat que NO sea ENOENT   (EPERM del symlink)
not ok 149 - plan: propaga cualquier error de escritura que NO sea EEXIST (chmod no bloquea)
not ok 155 - plan: la rama base real tiene la tarea en un estado distinto… (CRLF)
```

428 tests (3 más que en `6feb449`, que coinciden con los 3 declarados),
**425 verdes y los 3 rojos conocidos del entorno**. Ningún fallo nuevo.

**Linux real**, los dos ficheros que toca la tarea:

```
# tests 43
# pass 42
# fail 1
not ok 30 - plan: propaga cualquier error de escritura que NO sea EEXIST
```

Los dos rojos que en Windows son de entorno (EPERM del symlink y CRLF)
**pasan en Linux**, como estaba previsto. El único rojo restante es el mismo
test del `chmod`, y aquí falla por mi entorno de verificación, no por el
código: la distro corre como `root` y el árbol está sobre un montaje 9p, así
que quitar el permiso de escritura no impide escribir (`Missing expected
rejection`). En un runner de GitHub Actions (usuario sin privilegios, ext4) ese
test pasa.

Corrí también la suite **completa** en ese Linux improvisado (371/428) y
caractericé los 56 fallos extra antes de darlos por buenos: son todos de
`start`, `pause`, `resume`, `diagnose` y los `merge-*-to-main.sh`, y la causa
es que los `.sh` del checkout de Windows llevan CRLF
(`merge-hotfix-to-main.sh: line 6: syntax error near unexpected token $'in\r'`).
Nada que ver con TASK-027, y no ocurre en un checkout nativo de Linux.

## Los tres hallazgos, uno a uno

### #1 IMPORTANTE (ENOTDIR) — **resuelto**, y verificado en Linux real

El fix es `existeFichero` absorbiendo ENOTDIR además de ENOENT, con un
`isEnotdir` nuevo en `task-store.ts` junto a `isEnoent`/`isEexist` — que es la
reutilización que pide CONVENCIONES en vez de duplicar la comprobación de
código de error.

**Mutación en Linux real** (`isEnoent(e) || isEnotdir(e)` → `isEnoent(e)`,
recompilando y ejecutando el mismo binario Node sobre el mismo árbol):

| | `plan.test.js` + `approve.test.js` en Linux |
|---|---|
| **Con el fix (038bef6)** | 43 tests, 42 pasan, 1 falla (el del `chmod`, artefacto de mi entorno) |
| **Sin el fix** | 43 tests, 40 pasan, **3 fallan** |

Los dos fallos que aparecen al revertir son exactamente:

```
not ok 17 - approve: "planificacion" ocupado por un FICHERO no revienta con un error crudo
not ok 23 - plan: si "planificacion" existe como FICHERO, el error dice que hacer y no mueve la tarea
```

Es decir: **la simulación que hizo el implementador era fiel**, y queda
confirmado con ejecución real que el job `ubuntu-latest` estaba roto en
`6feb449` — caía el propio test que la ronda 1 escribió para certificar su fix.

**Smoke manual del CLI en Linux real**, sobre un repo Git creado allí con una
tarea cuyo `planificacion` es un fichero:

```
$ node bin/taskctl approve TASK-930
[ERROR] TASK-930 todavia no tiene un plan-final.md que aprobar. Ejecuta taskctl plan primero.
        Ejecuta: taskctl plan TASK-930
exit=1
$ node bin/taskctl plan TASK-930
[ERROR] TASK-930: no se pudo crear ".../planificacion" (EEXIST). Si ahi hay un fichero
llamado "planificacion", renombralo o borralo: esa ruta tiene que ser la carpeta de
artefactos de diseno de la tarea. La tarea no se ha movido.
exit=1
estado tras el intento: en-diseno
```

Ni un solo error crudo, y la cadena es coherente: `approve` dice que no hay
plan y remite a `plan`, y `plan` explica exactamente qué ruta estorba y qué
hacer. Los mismos dos comandos dan el mismo comportamiento en Windows
(verificado por separado).

**El test conocido "propaga cualquier error de stat que NO sea ENOENT" sigue
teniendo sentido**, que era la duda razonable al ampliar el `catch`. Ese test
usa un symlink autorreferencial (ELOOP), imposible de crear en Windows sin
privilegio — pero **en Linux se ejecuta de verdad y pasa**. Y con el mutante
que hace el `catch` totalmente permisivo (`void e; return false;`) **cae**:

```
=== MUTANTE (absorbe cualquier errno) en LINUX REAL ===
not ok 10 - approve: propaga cualquier error de stat que NO sea ENOENT
# tests 43 / pass 41 / fail 2
```

O sea: ENOTDIR se absorbe, ELOOP se sigue propagando, y hay un test que lo
vigila. La ampliación es estrictamente la mínima necesaria.

### #2 MENOR (orden en approve) — **resuelto**, y de paso elimina un fallo latente

`planFinalFileExists` (que lanzaba desde dentro) desaparece; ahora se resuelve
la ubicación sin lanzar, manda `assertTransitionAllowed`, y `assertPlanNoAmbiguo`
va después, en los dos puntos de la doble lectura.

Comportamiento con el CLI real, tarea en `en-curso` con los dos `plan-final.md`:

```
$ taskctl approve TASK-922
[ERROR] TASK-922 esta en estado "en-curso", no en "en-diseno". taskctl approve
requiere haber ejecutado taskctl plan primero.
        Ejecuta: taskctl plan TASK-922
```

El error habla del bloqueo real y la instrucción sí lleva a algún sitio.

**Mutante: devolver el orden anterior** (`assertPlanNoAmbiguo` antes de
`assertTransitionAllowed`, en las dos lecturas) → `approve.test.js` pasa de
18/1 a **18/4**. Y los tres fallos son informativos:

```
not ok  7 - approve: rechaza si el ID no existe, sin efectos secundarios
not ok 15 - approve: la tarea existe en la rama vieja pero NO en la rama base real…
not ok 18 - approve: con la tarea en un estado no aprobable Y dos plan-final.md,
            el error habla del ESTADO, no de la ambiguedad
```

El 18 es el test nuevo del fix. Los 7 y 15 destapan algo que no estaba en mi
hallazgo: con el orden invertido, el `ubicacionInicial!` se desreferencia sobre
`null` y sale un `TypeError: Cannot read properties of null (reading
'canonicaExiste')` donde debía salir un `StateMachineError`. Es decir, **el
orden nuevo no es solo cosmético: es lo que hace legítimo el `!`**, y hay dos
tests preexistentes que lo sostienen.

**Mutante: quitar `assertPlanNoAmbiguo` por completo** → cae
`approve: con plan-final.md en la raiz Y en planificacion/ rechaza en vez de
aprobar a ciegas`. La protección sigue teniendo guardián.

### #3 MENOR (directorio en la ubicación canónica) — **resuelto**

El `catch` del EEXIST re-statea y distingue los dos casos que `open(O_CREAT|
O_EXCL)` mete en el mismo errno. Con el CLI real:

```
$ taskctl plan TASK-924        # planificacion/plan-final.md es un DIRECTORIO
[ERROR] TASK-924: ".../planificacion/plan-final.md" existe pero no es un fichero
(¿una carpeta con ese nombre?), asi que ahi no hay ningun plan que redactar ni que
aprobar. Renombra o borra esa ruta y reintenta. La tarea no se ha movido.
exit=1
estado: planificada        # la tarea NO se ha movido
git status --porcelain →   # (vacío)
```

Se acabó el bucle: ya no hay un `plan` que sale 0 diciendo "ya existía" y un
`approve` que remite a ese mismo `plan`.

**El `'wx'` no ha perdido cobertura con el añadido**, que era el riesgo obvio
al tocar ese `catch`. Mutante `flag: 'wx'` → `'w'`: `plan.test.js` pasa de 25/3
a **25/4**, y el fallo nuevo sigue siendo
`plan: re-planificacion (en-diseno, plan_aprobado false) no pisa el plan-final.md
existente`. Mutante que **quita el re-stat**: cae el test nuevo. Mutante que
**invierte la condición** del re-stat: caen dos (el nuevo y el de
re-planificación). La rama está cubierta en las dos direcciones.

## Regresiones: comprobado que no las hay

Todo con `bin/taskctl` real sobre repos Git temporales:

| Escenario | Esperado | Resultado |
|---|---|---|
| Tarea aprobable **con los dos** `plan-final.md` | sigue rechazando | `[ERROR] … hay un plan-final.md en la raiz … y otro en planificacion/`, `exit=1`, `plan_aprobado: false`, `git status` vacío |
| Tarea con **solo el legado** en la raíz | sigue aprobándose | `exit=0`, `plan_aprobado: true` |
| Ambigüedad **solo en la rama base**, `approve` desde una rama de feature | la lectura fresca la detecta | rechaza tras cambiar a `develop`; termina en `develop` con `plan_aprobado: false` |
| `planificacion` fichero **+ plan legado** presente | aprueba (hay plan; la ruta ocupada no es asunto de `approve`) | `exit=0` — coherente con el comentario del código |
| Legado → `plan` (migra) → re-`plan` → `approve` | contenido intacto | `md5` idéntico en los cuatro puntos (`a225bc26…`) |

El smoke de punta a punta conserva el plan **byte a byte**, incluido un
tabulador y la ausencia de salto de línea final, que es lo que delataría
cualquier reescritura.

## Hallazgos de la primera pasada (sobre 6feb449) y cómo quedaron

| # | Severidad | Hallazgo | Estado en `038bef6` |
|---|---|---|---|
| 1 | IMPORTANTE | El fix del `mkdir` era un fix solo de Windows: en POSIX el fallo ocurre antes, en `existeFichero`, que solo absorbía ENOENT. `approve` moría con error crudo y **el test nuevo de `plan` era rojo en el job `ubuntu-latest`**. | **Corregido y verificado en Linux real.** `isEnotdir` en `task-store.ts`; con el fix la suite pasa allí, sin el fix caen los dos tests. |
| 2 | MENOR | Con la tarea en un estado no aprobable, el nuevo rechazo por ambigüedad tapaba el motivo real y mandaba a una acción que no desbloquea. | **Corregido.** El estado manda; test nuevo; y el orden elimina además un `null` dereference latente. |
| 3 | MENOR | Un DIRECTORIO en la ubicación canónica dejaba a la persona en un bucle: `plan` decía "ya existía" con exit 0 y `approve` remitía a `plan`. | **Corregido.** Re-stat en el `catch` del EEXIST, `PlanCommandError` accionable, tarea sin mover; test nuevo. |

## Hallazgos de esta pasada

### 1. MENOR — la comprobación de ambigüedad en la lectura FRESCA no tiene ningún test que la cubra

`assertPlanNoAmbiguo` se llama en los dos puntos de la doble lectura. Quitarla
**solo de la lectura fresca** no rompe nada:

```bash
# línea 119 de src/commands/approve.ts:  assertPlanNoAmbiguo(id, ubicacion!);  ->  void ubicacion;
npm run build && node --test dist/test/commands/approve.test.js
# 18 tests, 17 pass, 1 fail  ← exactamente la línea base
```

Los dos tests de ambigüedad montan el estado y ejecutan `approve` estando ya en
`develop`, así que la lectura preliminar corta antes y la fresca nunca decide
nada. Es la misma forma del hallazgo #1 de la ronda 1 — una protección cuyo
guardián no existe — con la diferencia de que aquí el comportamiento **sí es
correcto hoy**: lo verifiqué a mano con el CLI (fila 3 de la tabla de
regresiones, la ambigüedad solo en `develop` se detecta y se rechaza). Lo que
falta es la red de regresión, y precisamente sobre el caso realista: la
ambigüedad se produce por dos merges en `develop`, no en la rama desde la que
uno invoca `approve`.

No es una regresión de este commit —la estructura anterior tenía el mismo punto
ciego— y por eso es MENOR y no bloquea.

**Recomendación (barata)**: un test hermano del de ambigüedad que cree el
segundo `plan-final.md` **en la rama base**, invoque `approve` desde una rama de
feature limpia y espere `ApproveCommandError`. El repo temporal y los helpers
ya existen; es el mismo patrón que los dos tests de TASK-012 que ya viven en
`approve.test.ts`.

## Observaciones (no son hallazgos)

- **El re-stat del `catch` abre una ventana propia, inofensiva**: si entre el
  `writeFile` que devuelve EEXIST y el re-stat alguien borra la ruta, el
  mensaje dirá "existe pero no es un fichero" sobre algo que ya no existe. Es
  una carrera aún más estrecha que la que el `'wx'` protege, el desenlace es un
  error y no una pérdida de contenido, y la tarea no se ha movido. No merece
  código extra.
- El `catch` del `mkdir` sigue capturando cualquier error, no solo el de ruta
  ocupada (ya anotado en la pasada anterior). Se salva porque el mensaje
  incluye el `code` real — se ve en la salida del smoke de Linux: `(EEXIST)`.
- `assertPlanNoAmbiguo` recibe el `id` tal cual lo escribió la persona en la
  línea de comandos, no `task.id`. Solo afecta al texto del mensaje.
- Se mantiene lo verificado en la pasada anterior y no vuelvo a repetirlo aquí:
  el criterio de "las dos subcarpetas viajan con la carpeta de la tarea"
  cubierto en `moveTareaFile: se lleva planificacion/ y revision/ enteras`
  (`test/fs/task-store.test.ts`), la decisión documentada sobre las 6 tareas de
  `04-terminadas/`, la migración del repo real sin ningún `plan-final.md`
  suelto, y la argumentación de por qué no se corrige que el `rename` pise el
  destino (Node no expone un `rename` exclusivo portable; comprobado que
  `fs.rename` sobrescribe).
- Quedan pendientes los pasos 9 y 10 de CONVENCIONES (sección `## Resultado` en
  `tarea.md` con todos los hallazgos —incluidos los que se decidió no
  corregir— y el checklist con casilla y contadores). En el árbol de trabajo ya
  hay cambios sin commitear en `ESTADO.md`, `INVENTARIO_PENDIENTE.md`,
  `CHECKLIST_TERMINACION.md` y `PLAN_SPRINTS.md`: el paso 10 está en marcha y
  queda fuera de esta revisión.

## Veredicto

**APROBADA.**

Los tres hallazgos de la primera pasada están corregidos, y el IMPORTANTE lo
está con la evidencia que faltaba: **ejecutando el código en Linux de verdad**,
no simulándolo. Con el fix, `plan.test.js` y `approve.test.js` pasan allí; sin
él caen exactamente los dos tests que debían caer, incluido el que la ronda 1
había escrito para certificar su propio fix. La simulación que hizo el
implementador era fiel, y su conclusión —que el job `ubuntu-latest` estaba
roto— queda confirmada.

Las tres correcciones son mínimas y están cubiertas: seis mutantes sobre el
código nuevo (`isEnotdir`, el `catch` permisivo, el orden de
`assertPlanNoAmbiguo`, su eliminación, el re-stat y su condición invertida) los
caza un test cada uno, y el `'wx'` sigue rompiendo bajo mutación pese a haberse
tocado su `catch`. `approve` no se ha vuelto ni más permisivo —sigue rechazando
el estado ambiguo cuando la tarea es aprobable— ni más restrictivo —el legado
suelto se sigue aprobando—, y el plan se conserva byte a byte de punta a punta.
Como efecto colateral, el reordenamiento elimina un `null` dereference latente
que el orden anterior escondía.

Queda un hallazgo **MENOR** nuevo: la comprobación de ambigüedad en la lectura
fresca no tiene test, aunque su comportamiento es correcto y está verificado a
mano. Por §8 de CONVENCIONES, aplicarlo si sale barato —lo es— y si no,
documentarlo en el `Resultado` con el motivo. No bloquea el cierre.
