# Informe de revision — TASK-027 (ronda 2)

- Commit revisado: 6feb4498588ea66cef378bb07790e4575b11da0f
- Revisor: agente independiente (no implemento TASK-027)
- Veredicto: cambios-solicitados

## Cómo se ha revisado

Reproducción empírica sobre un **clon** del repo fuera del árbol de trabajo
(`C:\Users\nullcad2025\AppData\Local\Temp\rev027r2\clon`), con `npm install &&
npm run build` propios. Todo lo que se afirma aquí se ha ejecutado; los
comandos y su salida están pegados en cada punto.

1. **Línea base reproducida** en la rama `feature/task-027-...`:
   `node --test "dist/test/**/*.test.js"` da **425 tests, 422 pasan, 3 fallan**,
   y los 3 rojos son exactamente los conocidos de este entorno, por el motivo
   conocido (verificado leyendo el TAP, no el nombre del test):

   | # | Test | Motivo en el TAP |
   |---|---|---|
   | 44 | `approve: propaga cualquier error de stat que NO sea ENOENT` | `EPERM: operation not permitted, symlink 'plan-final.md'` |
   | 146 | `plan: propaga cualquier error de escritura que NO sea EEXIST` | `Missing expected rejection` (el `chmod` no bloquea en Windows) |
   | 152 | `plan: la rama base real tiene la tarea en un estado distinto…` | `'# Plan real en develop\r\n' !== '…\n'` (CRLF) |

   **Ningún fallo nuevo.** Son 3 tests más que en la ronda 1 (422 → 425), que
   coinciden con los 3 que declara el mensaje del commit.
2. **Mutación dirigida** a los cinco hallazgos de la ronda 1, más **7 mutantes
   propios** sobre el código nuevo de `approve.ts` y `plan.ts`.
3. **Escenarios adversarios propios** con `bin/taskctl` real sobre repos Git
   temporales: estado ambiguo producido por dos merges `--no-ff` de verdad,
   ambigüedad solo en la rama base, ambigüedad solo en la rama de feature,
   `planificacion` ocupado por un fichero, `plan-final.md` como directorio en
   las dos ubicaciones, y estado no aprobable con dos planes.
4. **Semántica POSIX comprobada de verdad**, no supuesta: el matiz ENOTDIR que
   señalaba la ronda 1 se ha verificado en un Linux real (WSL) y su efecto
   sobre el código se ha reproducido inyectándolo en el `dist` compilado.
5. **Smoke test manual de punta a punta**: tarea legada → `plan` (migra) →
   re-`plan` (idempotente) → `approve`, con `md5sum` antes y después.

El clon se dejó restaurado (`git status --porcelain` vacío) tras cada mutante,
y el repo de trabajo no se ha tocado salvo para escribir este informe.

## Lo que se ha verificado y está bien

### Hallazgo #1 (IMPORTANTE de la ronda 1) — corregido de verdad

El mutante que la ronda 1 usó como prueba **ahora rompe un test que antes no
rompía**:

```bash
perl -0pi -e "s/flag: 'wx'/flag: 'w'/" src/commands/plan.ts && npm run build
node --test dist/test/commands/plan.test.js
```

| | Base | Mutante `wx` → `w` |
|---|---|---|
| plan.test.js | 24 tests, 2 fallos (los conocidos) | 24 tests, **3 fallos** |

El fallo nuevo es `plan: re-planificacion (en-diseno, plan_aprobado false) no
pisa el plan-final.md existente`. El `'wx'` vuelve a ser el guardián real.

Además comprobé que la simplificación es **semánticamente neutra** y no una
corrección de comportamiento disfrazada: reintroduciendo la condición que se
quitó (`} else {` → `} else if (!ubicacion.canonicaExiste) {`) la suite queda
otra vez en 24/2 — misma línea base, ningún test se entera. Es decir, lo único
que cambió es la cobertura, que es exactamente lo que pedía el hallazgo.

Sobre el segundo mutante pedido (`if (!isEexist(e)) throw e` → `void e`): en
este entorno **no rompe nada observable**, pero no es una laguna de la rama.
Su test guardián es precisamente el nº 146 (`plan: propaga cualquier error de
escritura que NO sea EEXIST`), que en Windows ya está rojo porque el `chmod`
no bloquea. En Linux ese test pasa y es el que cubre esa línea. No es
comparable con el caso del `'wx'`, donde el test guardián estaba verde y aun
así no se enteraba.

### Hallazgo #2 (MENOR) — corregido, y sin volverse más restrictivo

Estado ambiguo construido con **dos merges `--no-ff` reales, sin conflicto**
(rama A crea `planificacion/plan-final.md`, rama B crea el legado en la raíz):

```
$ find tareas -type f
tareas/01-en-diseno/TASK-901/plan-final.md
tareas/01-en-diseno/TASK-901/planificacion/plan-final.md
tareas/01-en-diseno/TASK-901/tarea.md

$ node <plugin>/bin/taskctl approve TASK-901
[ERROR] TASK-901: hay un plan-final.md en la raiz de la carpeta y otro en
planificacion/. No se puede aprobar sin saber cual es el plan bueno. Compara
"…\TASK-901\plan-final.md" con "…\TASK-901\planificacion\plan-final.md", deja
solo el de planificacion/ y reintenta. No se ha tocado nada.
exit=1
$ grep plan_aprobado …/tarea.md   →  plan_aprobado: false
$ grep actualizado  …/tarea.md    →  actualizado: 2026-09-03   (sin tocar)
$ git status --porcelain          →  (vacío)
```

El mensaje dice qué comparar, qué dejar y qué reintentar: cumple el criterio de
CONVENCIONES sobre errores accionables. Y `plan` sobre el mismo estado sigue
abortando con su mensaje equivalente.

**No se ha vuelto más restrictivo de la cuenta**: una tarea con **solo** el
legado en la raíz sigue aprobándose (`approve TASK-902` → exit 0,
`plan_aprobado: true`), que era el caso que justificaba toda la compatibilidad
hacia atrás.

**La doble lectura sigue bien puesta.** Con la ambigüedad **solo en la rama
base** (`develop`) y una rama de feature limpia, `approve` cambia de rama, la
detecta en la lectura fresca y rechaza (termina en `develop`, `plan_aprobado:
false`). El caso inverso —ambigüedad solo en la rama de feature, `develop`
perfectamente aprobable— sí produce un rechazo por la lectura preliminar sin
llegar a cambiar de rama, pero **eso es el patrón preexistente de `approve`**,
no algo que introduzca este commit: lo verifiqué con el rechazo que ya existía
antes (rama sin plan, `develop` con plan → `[ERROR] TASK-912 todavia no tiene
un plan-final.md que aprobar`, sin cambiar de rama). Ver la observación al
final.

### Hallazgo #4 (MENOR) — la parte (b) corregida; la (a), bien argumentada

- **(b)**: un directorio llamado `plan-final.md` ya no cuenta como plan.
  Verificado con el CLI real: con el directorio en la raíz, `plan` **no** anuncia
  migración, crea el scaffold en la ubicación canónica y deja el directorio
  donde estaba. Y con mutación: revertir `existeFichero` al `stat` pelado
  (`await stat(p); return true;`) rompe el test nuevo `plan: un DIRECTORIO
  llamado plan-final.md no cuenta como plan`.
- **(a)**: la decisión de no corregir el `rename` está bien argumentada.
  Comprobé las dos premisas: `fs.rename` **sí** sobrescribe el destino en
  silencio en este entorno (`destino tras rename: ORIGEN`), y Node no expone
  ningún equivalente portable del `O_EXCL` para `rename` (`renameat2` con
  `RENAME_NOREPLACE` es específico de Linux y no está en la API de
  `node:fs`). La ventana exige que alguien cree el destino entre el
  `resolverPlanFinal` y el `rename`, y el fail-closed cubre el caso no
  concurrente. Además, el comentario del `'wx'` ya no afirma que ese sea el
  único camino donde se puede perder contenido, que era la otra mitad de la
  recomendación.

### Hallazgo #5 (MENOR) — el comentario ya no miente y el test sigue siendo válido

El comentario dice ahora, correctamente, que desde TASK-027 ese caso entra por
la rama de **migración** (`rename`) y no por el `writeFile` con `'wx'`. El test
**sigue siendo una regresión válida de TASK-012**: asevera `planCreated ===
false` y que el contenido leído es el de `develop` (`'# Plan real en
develop\n'`), o sea que la decisión se toma con el contenido de la rama base y
no con el de la rama vieja. Es sensible por construcción — con la migración
mutada a copia, el test cae (comprobado más abajo). No se añadió el
`assert.equal(result.planMigrado, true)` que sugería la ronda 1; es documental
y el test no pierde poder de detección sin él.

### Mutación propia sobre el código nuevo: los tests se enteran

7 mutantes, todos con `npm run build` y ejecución del fichero de tests
correspondiente. Línea base: `plan.test.js` 24/2, `approve.test.js` 16/1.

| Mutante | Resultado | Test que se entera |
|---|---|---|
| `approve`: `if (canonicaExiste && legadaExiste)` → `if (false)` | 16/**2** | `approve: con plan-final.md en la raiz Y en planificacion/ rechaza en vez de aprobar a ciegas` |
| `approve`: `&&` → `\|\|` (rechaza con cualquier plan) | 16/**10** | 9 tests adicionales, incluidos los dos de TASK-012 |
| `plan`: `existeFichero` sin `isFile()` | 24/**3** | `plan: un DIRECTORIO llamado plan-final.md no cuenta como plan` |
| `plan`: `mkdir` sin el `try/catch` que produce el `PlanCommandError` | 24/**3** | `plan: si "planificacion" existe como FICHERO, el error dice que hacer` |
| `plan`: la migración copia en vez de mover | 24/**3** | `plan: migra a planificacion/ el plan-final.md legado …, con su contenido intacto` |
| `plan`: fail-closed → `if (false)` | 24/**3** | `plan: con plan-final.md en la raiz Y en planificacion/ aborta sin tocar nada` |
| `plan`: reintroducir `else if (!canonicaExiste)` | 24/2 | ninguno — **esperado**: confirma que el fix de #1 no cambió comportamiento |

### Smoke test manual de punta a punta

Repo Git nuevo, tarea legada con un plan "redactado a mano" (con tabulador y
sin salto final, para que cualquier reescritura se note):

```
md5 antes:                       6c288ec3b1cc8990609e019607516ffc
$ taskctl plan TASK-900
  … El plan estaba suelto en la raiz de la carpeta (formato anterior) y se ha
  movido intacto a …\01-en-diseno\TASK-900\planificacion\plan-final.md.
md5 tras migrar:                 6c288ec3b1cc8990609e019607516ffc
$ taskctl plan TASK-900          (re-planificación)
  … ya existia (re-planificacion) — se dejo intacto.
md5:                             6c288ec3b1cc8990609e019607516ffc
$ taskctl approve TASK-900       → exit 0, plan_aprobado: true
md5 final:                       6c288ec3b1cc8990609e019607516ffc
```

**Contenido conservado byte a byte** en los tres pasos.

### Criterios de aceptación

- `plan` crea `planificacion/` y escribe ahí el scaffold: sí (verificado con el
  CLI real y con test).
- `approve` acepta las dos ubicaciones: sí (E3 arriba).
- Re-planificación sobre un legado lo **migra** conservando contenido y lo dice
  en la salida: sí (smoke test).
- Los dos a la vez ⇒ `plan` aborta sin tocar nada: sí, y ahora `approve`
  también.
- **"Las dos subcarpetas viajan con la carpeta de la tarea en cada cambio de
  estado, verificado con un test"**: cumplido, y en el sitio correcto —
  `test/fs/task-store.test.ts`, `moveTareaFile: se lleva planificacion/ y
  revision/ enteras al cambiar de carpeta (item C3)`, que cubre la primitiva que
  usan **todos** los comandos que cambian de estado, con aserción sobre el
  contenido de un fichero dentro de cada subcarpeta. Hay además el test
  end-to-end de `plan` (`planificacion/ viaja con la tarea…`).
- Decisión sobre las 6 tareas de `04-terminadas/`: explícita y argumentada en
  `planificacion/plan-final.md` (se migran con `git mv`; se comprueba que ningún
  documento generado las referencia por la ruta vieja). Verificado en el árbol:
  `find tareas -name plan-final.md` devuelve **7 rutas, todas bajo
  `planificacion/`**, ninguna suelta.

## Hallazgos

### 1. IMPORTANTE — el hallazgo #3 solo está corregido en Windows: en Linux el error sigue siendo crudo y el test nuevo es **rojo**

La ronda 1 lo avisó textualmente: *"en Linux devolvería ENOTDIR y reventaría
antes, dentro de `existeFichero`, que solo absorbe ENOENT — y entonces también
**`approve`** (no solo `plan`) moriría con un error crudo […] Merece la pena
que `existeFichero` trate ENOTDIR como 'no existe'"*. El fix envolvió el
`mkdir`, que es el punto donde falla **en Windows**, pero `existeFichero` sigue
igual (`if (isEnoent(e)) return false; throw e;`) y `resolverPlanFinal` se
ejecuta **antes** que el `mkdir` (plan.ts:231 vs. plan.ts:256).

**Premisa verificada en un Linux real**, no supuesta:

```bash
$ wsl -d docker-desktop -e sh -c 'mkdir -p /tmp/t1 && printf hola > /tmp/t1/planificacion && stat /tmp/t1/planificacion/plan-final.md'
stat: can't stat '/tmp/t1/planificacion/plan-final.md': Not a directory   # ENOTDIR
```

**Efecto reproducido** inyectando esa semántica POSIX en el `dist` compilado
(`existeFichero` lanza ENOTDIR cuando el padre de la ruta no es un directorio,
que es literalmente lo que hace el kernel de Linux):

```
$ node --test dist/test/commands/plan.test.js
not ok 5 - taskctl plan: si "planificacion" existe como FICHERO, el error dice
           que hacer y no mueve la tarea
  error: |-
    The expression evaluated to a falsy value:
      assert.ok(err instanceof PlanCommandError)
```

Y con el CLI real, sobre los mismos repos del escenario E4:

```
$ taskctl plan TASK-903
[ERROR] taskctl no pudo arrancar: ENOTDIR: not a directory, stat …\TASK-903\planificacion\plan-final.md
$ taskctl approve TASK-904
[ERROR] taskctl no pudo arrancar: ENOTDIR: not a directory, stat …\TASK-904\planificacion\plan-final.md
```

O sea, en Linux: (a) `plan` sigue dando el mismo error crudo presentado como
*"taskctl no pudo arrancar"* que el hallazgo #3 venía a eliminar, (b) `approve`
—que ni siquiera tiene el `try/catch` porque no hace `mkdir`— muere igual, y
(c) **el test nuevo que se escribió para certificar el fix falla**.

Lo (c) es lo que sube esto de MENOR a IMPORTANTE: `.github/workflows/ci.yml`
tiene un job `test-linux` en `ubuntu-latest` que corre `npm test`, así que el
merge a `develop` dejaría el CI en rojo, y "suite verde" es criterio de
aceptación de la tarea. En Windows el test pasa por casualidad: aquí
`stat('<fichero>/x')` devuelve **ENOENT** (comprobado), `existeFichero` lo
absorbe, y el fallo se pospone hasta el `mkdir`, que sí está envuelto.

**Recomendación** (una línea, y cierra los tres efectos a la vez): que
`existeFichero` trate ENOTDIR como ausencia, igual que ENOENT —
`if (isEnoent(e) || (e as {code?:string}).code === 'ENOTDIR') return false;`, o
un `isEnotdir` hermano de `isEnoent` en `task-store.ts` para no duplicar la
comprobación de código de error. Con eso, en Linux el flujo llega al `mkdir` y
sale el `PlanCommandError` que ya existe, `approve` deja de morir crudo, y el
test nuevo pasa en las dos plataformas. Conviene además un test que asevere
esa absorción sin depender del errno de la plataforma (llamando a
`resolverPlanFinal` sobre una carpeta con `planificacion` como fichero y
comprobando que no lanza).

### 2. MENOR — con la tarea en un estado no aprobable, el nuevo rechazo tapa el motivo real y manda a una acción que no desbloquea

El `throw` nuevo está **antes** de `assertTransitionAllowed`, así que gana la
precedencia. Reproducción (tarea en `02-en-curso`, con los dos planes):

```
$ taskctl approve TASK-913
[ERROR] TASK-913: hay un plan-final.md en la raiz de la carpeta y otro en
planificacion/. … deja solo el de planificacion/ y reintenta. No se ha tocado nada.
exit=1
```

El bloqueo real es que la tarea no está en `en-diseno`: quien siga la
instrucción, borre un fichero y reintente, se encontrará con otro error
distinto. Antes de este commit, el mensaje que salía era el del estado, que sí
era accionable.

Nada se corrompe (exit 1, nada tocado) y el caso requiere las dos anomalías a
la vez, por eso es MENOR.

**Recomendación**: mover la comprobación de ambigüedad a después de
`assertTransitionAllowed` (es decir, calcular `planFinalFileExists` sin lanzar,
y lanzar el error de ambigüedad solo si la transición es por lo demás válida),
o simplemente documentarlo. Si se mueve, revisar que el test nuevo de `approve`
sigue cazando el mutante `if (false)` — con la tarea en `en-diseno` sí lo hace.

### 3. MENOR — un DIRECTORIO en la ubicación **canónica** deja a la persona en un bucle: `plan` dice que todo está bien y `approve` le manda a `plan`

Es el reverso del caso que sí se corrigió (directorio en la raíz). Con
`planificacion/plan-final.md` siendo un directorio:

```
$ taskctl plan TASK-906
Tarea TASK-906 en diseno: movida a …\01-en-diseno\TASK-906\tarea.md.
…\planificacion\plan-final.md ya existia (re-planificacion) — se dejo intacto.
exit=0

$ taskctl approve TASK-906
[ERROR] TASK-906 todavia no tiene un plan-final.md que aprobar. Ejecuta taskctl plan primero.
        Ejecuta: taskctl plan TASK-906
exit=1
```

La causa es que `writeFile` con `'wx'` sobre una ruta ocupada por un directorio
devuelve **EEXIST** (comprobado en este entorno; es lo que manda POSIX para
`O_CREAT|O_EXCL`), y el `catch` lo interpreta como re-planificación normal
aunque `canonicaExiste` fuera `false`. `plan` sale 0 diciendo que el plan
"ya existía" sin que exista ninguno, y `approve` remite a un `plan` que vuelve
a decir que todo está bien.

Es el mismo tipo de incoherencia que motivó el hallazgo #4 de la ronda 1, pero
en la otra ubicación, y es **nuevo de este commit**: antes de introducir el
`isFile()`, `approve` aprobaba (mal, pero sin bucle).

**Nota de estado**: el árbol de trabajo del repo contiene, **sin commitear**,
un cambio en `plan.ts` y un test nuevo (`plan: un DIRECTORIO en la ubicacion
canonica falla diciendo que hacer, no finge una re-planificacion`) que atacan
exactamente este caso, atribuido en su comentario al smoke test manual. No
forma parte del commit `6feb449` y por tanto **no está revisado en este
informe**; lo dejo anotado para que no se contabilice dos veces y para que ese
cambio pase por revisión antes de cerrarse.

## Observaciones (no son hallazgos)

- **El rechazo por la lectura preliminar de `approve` puede ser un falso
  negativo, pero es preexistente.** Con la ambigüedad solo en la rama de
  feature y `develop` limpio, `approve` aborta sin llegar a cambiar de rama,
  mientras que `plan` en el mismo escenario cambia a `develop` y funciona
  (verificado: `Workspace limpio -> cambiado automaticamente de
  "feature/sucia" a "develop"` … exit 0). No lo introduce este commit: el
  rechazo preliminar por "no hay plan" ya se comportaba igual antes
  (reproducido). La asimetría `plan`/`approve` en dónde se sitúan las
  comprobaciones es anterior a TASK-027 y merecería una decisión propia, no
  un parche aquí.
- **El `try/catch` del `mkdir` captura cualquier error, no solo el de "ruta
  ocupada"**: un `EACCES` o un `EPERM` saldrían con el texto "Si ahí hay un
  fichero llamado `planificacion`…", que no sería la causa. Lo salva que el
  mensaje incluye el `code` real entre paréntesis (`(EEXIST)` en la
  reproducción), así que el diagnóstico no se pierde. Aceptable tal cual.
- **La protección de `approve` contra el `plan-final.md` que es un directorio
  no tiene test propio**: el mutante que revierte `existeFichero` al `stat`
  pelado rompe `plan.test.js` pero deja `approve.test.js` en su línea base
  (16/1). La cobertura existe (la función es compartida y un test la vigila),
  pero el comportamiento concreto que menciona el mensaje del commit
  (*"y approve lo daba por bueno"*) no está aseverado en `approve.test.ts`.
- La decisión de **no corregir la parte (a) del hallazgo #4** está en el
  mensaje del commit, pero todavía no en el `## Resultado` de `tarea.md` que
  exige el paso 8 de CONVENCIONES. Es lo esperado a mitad de ciclo (el paso 9
  es posterior), pero conviene que no se quede solo en el commit.
- `docs/contexto/ESTADO.md`, `INVENTARIO_PENDIENTE.md`, `CHECKLIST_TERMINACION.md`
  y `PLAN_SPRINTS.md` aparecen **modificados sin commitear** en el árbol de
  trabajo: el paso 10 está en marcha. No entran en este commit ni en esta
  revisión.

## Veredicto

**CAMBIOS SOLICITADOS.**

Los cinco hallazgos de la ronda 1 se han atendido, y los cuatro que se dieron
por corregidos lo están de verdad, comprobado con mutación y no leyendo el
diff: el `'wx'` vuelve a tener un test que se entera cuando desaparece, y la
simplificación que lo consiguió es demostrablemente neutra en comportamiento;
`approve` ya no bendice el estado ambiguo, sin haberse vuelto más restrictivo
con el legado; el directorio disfrazado de plan ya no se "migra"; y el
comentario del test de TASK-012 dice ahora lo que el test hace. El smoke test
de punta a punta conserva el contenido byte a byte, y los criterios de
aceptación —incluido el de las dos subcarpetas viajando, que está cubierto en
la primitiva `moveTareaFile` y no solo en `plan`— se cumplen.

Lo que impide aprobar es el hallazgo **#1**: el arreglo del EEXIST crudo se
puso en el `mkdir`, que es donde falla en Windows, pero en Linux el error
ocurre antes, en `existeFichero`, que sigue absorbiendo solo ENOENT. La
consecuencia no es teórica: `approve` muere con un error crudo en POSIX, y **el
propio test escrito para certificar el fix falla en el job `test-linux` del
CI**, contra el criterio "suite verde". La corrección es de una línea y está
descrita en el hallazgo. Por §8 de CONVENCIONES un IMPORTANTE se aplica
siempre.

Los hallazgos **#2** y **#3** son MENOR: aplicarlos si salen baratos —el #3 ya
tiene un fix redactado sin commitear, que deberá revisarse— y si no,
documentarlos sin corregir en el `Resultado` de la tarea, con el motivo.
