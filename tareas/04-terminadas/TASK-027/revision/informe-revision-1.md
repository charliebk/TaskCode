# Informe de revision — TASK-027 (ronda 1)

- Commit revisado: e987b25d6b21c2b57f22e7e5cd6fc704d1cef932
- Revisor: agente independiente (no implemento TASK-027)
- Veredicto: cambios-solicitados (APROBADO CON CAMBIOS)

## Como se ha revisado

Reproduccion empirica sobre un **clon** del repo fuera del arbol de trabajo
(`scratchpad/rev027`), con `npm install && npm run build` propios, mas un
segundo clon de `develop` (`scratchpad/base`) para comparar. Todo lo que se
afirma aqui se ha ejecutado.

1. **Linea base reproducida**: en la rama `feature/task-027-...`,
   `node --test "dist/test/**/*.test.js"` da **422 tests, 419 pasan, 3 fallan**.
   Los 3 rojos son exactamente los conocidos de este entorno y por el motivo
   conocido (verificado en el TAP): `approve ... error de stat que NO sea
   ENOENT` (EPERM al crear el symlink en Windows), `plan ... error de escritura
   que NO sea EEXIST` (chmod no bloquea en Windows) y `plan: la rama base real
   tiene la tarea en un estado distinto...` (CRLF: `'# Plan real en
   develop\r\n' !== '...\n'`). **Ningun fallo nuevo.**
2. **Smoke test manual de punta a punta** con `bin/taskctl` real sobre un repo
   Git nuevo con una tarea legada: `plan` migra, `approve` aprueba, el
   contenido del plan se conserva byte a byte.
3. **Mutacion deliberada del codigo** (7 mutantes) para comprobar que los tests
   nuevos se enteran de verdad.
4. Escenarios adversarios construidos a mano: `planificacion` como fichero,
   `plan-final.md` como directorio, hotfix con rama base `main`,
   re-planificacion repetida, y merges que producen los dos ficheros a la vez.

## Lo que se ha verificado y esta bien

- **Los 5 tests nuevos son tests de verdad.** Mutacion → fallo, en los cuatro
  comportamientos centrales:

  | Mutante | Test que se entera |
  |---|---|
  | Quitar el fail-closed (`if (dos ficheros)` → `if (false)`) | `plan: con plan-final.md en la raiz Y en planificacion/ aborta sin tocar nada` |
  | No migrar el legado | `plan: migra a planificacion/ ... con su contenido intacto` |
  | Migrar **copiando** en vez de con `rename` (deja dos copias) | idem |
  | `approve` mira solo la ubicacion canonica | `approve: acepta el plan-final.md legado suelto en la raiz` |
  | Escribir el scaffold en la raiz en vez de en `planificacion/` | `plan: primera vez ... crea el scaffold en planificacion/` y `plan: planificacion/ viaja con la tarea` |

- **El orden de operaciones se respeta y esta cubierto.** Mutante que mueve el
  bloque de escritura/migracion a **despues** de `moveTareaFile`: lo caza el
  test del fail-closed (la tarea ya se habia movido). Verificado tambien a mano
  que, si `moveTareaFile` falla tras el `rename`, reintentar `plan` es
  idempotente (segunda pasada: `planMigrado=false`, `planCreated=false`, el
  contenido intacto).
- **Sin perdida de contenido en la migracion** en ninguno de los caminos
  probados. El `rename` mueve, no copia: no quedan dos copias divergentes.
- **Hotfix (rama base `main`) correcto**: con `tipo: hotfix` y plan legado,
  `plan` cambia a `main` (`switched=true`, `baseBranch=main`) y migra **ahi**,
  no en la rama de partida.
- **Sin fuga entre la lectura preliminar y la fresca.** `taskDir` sale de
  `path.dirname(filePath)` de la lectura **fresca** (post cambio de rama), y
  `resolverPlanFinal` se llama despues; en `approve`, la decision de escritura
  usa `planFinalExiste` de la lectura fresca. No he conseguido que `plan` migre
  o escriba en la carpeta de la rama equivocada, ni que `approve` decida con
  una rama y escriba con otra.
- **`approve` no se ha vuelto mas permisivo de la cuenta en lo esencial**: usa
  el mismo `stat` que antes (`existeFichero`), solo que sobre dos rutas.
  Sigue rechazando sin plan y sigue rechazando estados que no son `en-diseno`
  aunque exista un `plan-final.md`. (Matiz en el hallazgo #2.)
- **Migracion del repo real completa**: `find tareas -name plan-final.md` no
  deja ningun fichero suelto; las 7 carpetas (TASK-013/014/015/024/025/026 y
  TASK-027) estan en `planificacion/`, movidas con `git mv` (el `--stat` del
  commit lo muestra como rename puro, 0 lineas cambiadas).
- La ubicacion canonica concuerda con la seccion 2 de
  `docs/PROPUESTA_METODOLOGIA.md` (`tarea.md` + `planificacion/` + `revision/`)
  y con el criterio de `revision/` en `review.ts` (creacion bajo demanda).

## Hallazgos

### 1. IMPORTANTE — la proteccion `flag: 'wx'` se ha quedado **sin un solo test** que la cubra

El comentario del codigo dedica cinco lineas a justificar `flag: 'wx'` ("aqui
perder contenido es el peor resultado posible") y a decir que la comprobacion
previa "no lo hace redundante". Pero con la reestructuracion, la unica rama que
llega al `writeFile` es `else if (!ubicacion.canonicaExiste)`, asi que el
fichero nunca existe cuando se escribe: el `'wx'` y el `catch { if (!isEexist)
throw }` han pasado a ser inalcanzables en toda la suite.

**Reproduccion (dos clones, mismo mutante):**

```bash
export PATH="/c/Program Files/Git/usr/bin:$PATH"
# --- rama TASK-027 ---
cd <clon>/taskcode-marketplace/plugins/taskcode-plugin   # rama feature/task-027-...
perl -0pi -e "s/flag: 'wx'/flag: 'w'/" src/commands/plan.ts
npm run build && node --test "dist/test/**/*.test.js" | grep -c '^not ok'
# --- develop, mismo mutante ---
cd <clon-develop>/taskcode-marketplace/plugins/taskcode-plugin
perl -0pi -e "s/flag: 'wx'/flag: 'w'/" src/commands/plan.ts
npm run build && node --test "dist/test/commands/plan.test.js" | grep '^not ok'
```

**Se esperaba:** que quitar una proteccion contra perdida de datos rompiera
algun test. `docs/contexto/CONVENCIONES.md`: *"Un test que no falla si el
comportamiento cambia no es un test."*

**Que pasa:**

- En la **rama TASK-027**: `'wx'` → `'w'` produce **3 fallos, los 3 conocidos
  del entorno. Cero fallos nuevos.**
- En **develop**: el mismo mutante produce **2 fallos adicionales**:
  `plan: re-planificacion (en-diseno, plan_aprobado false) no pisa un
  plan-final.md existente` (verde antes del mutante), y cambia el motivo de
  fallo del test de TASK-012 de CRLF a `true !== false` (o sea, `planCreated`).

Es decir: **develop cazaba el mutante y la rama nueva no.** Lo mismo con
`if (!isEexist(e)) throw e` → `void e`: cero fallos nuevos en la rama.

La causa es que el test de re-planificacion ahora coloca el plan existente en
la ruta **canonica**, con lo que `!ubicacion.canonicaExiste` corta antes y el
`writeFile` no llega a ejecutarse nunca con el fichero presente.

El comportamiento observable de hoy es correcto — la pre-comprobacion hace el
trabajo. Lo que se ha perdido es la **red de seguridad de regresion** sobre un
camino de perdida de datos: si manana alguien simplifica la pre-comprobacion,
ningun test se entera.

**Recomendacion (barata y ademas simplifica):** eliminar la condicion redundante
`else if (!ubicacion.canonicaExiste)` y dejar solo `else { try { writeFile(...,
'wx') } catch { if (!isEexist(e)) throw e } }`. El comportamiento es identico
(EEXIST ⇒ `planCreated=false`), hay una rama menos, el `'wx'` vuelve a ser el
guardian real y el test de re-planificacion vuelve a cubrirlo — verificable
repitiendo el mutante de arriba. Alternativa si se prefiere no tocar la logica:
un test explicito que documente que el `'wx'` es defensa contra la ventana
TOCTOU y no contra la re-planificacion.

### 2. MENOR — `approve` bendice el mismo estado ambiguo que `plan` considera demasiado peligroso para tocarlo

`plan` falla cerrado con los dos `plan-final.md` a la vez ("No se puede saber
cual es el plan bueno"). `approve`, que es **el checkpoint humano**, evalua
`canonicaExiste || legadaExiste`, acepta, y marca `plan_aprobado: true` sin
mencionar siquiera que hay dos planes divergentes. Certifica "el plan esta
aprobado" sin decir cual.

**Reproduccion del estado (merge normal, sin conflicto):**

```bash
export PATH="/c/Program Files/Git/usr/bin:$PATH"
mkdir -p /tmp/mc/tareas/01-en-diseno/TASK-911 && cd /tmp/mc && git init -q -b develop .
# tarea.md minima en tareas/01-en-diseno/TASK-911/, commit
git checkout -q -b A   # crea planificacion/plan-final.md  -> commit
git checkout -q develop && git checkout -q -b B
                       # crea plan-final.md en la raiz, otro texto -> commit
git checkout -q develop && git merge --no-ff A -m mA && git merge --no-ff B -m mB
find tareas -type f
```

**Que pasa:** los dos merges pasan **sin conflicto** y quedan los dos ficheros.
A partir de ahi, con la tarea en `en-diseno`: `plan` aborta con
`PlanCommandError` (correcto) y `approve` devuelve `plan_aprobado = true`
(verificado ejecutando ambos comandos sobre ese estado). La ambiguedad se cuela
hacia `start`/`review`/`finish` y ya nada la vuelve a mirar, porque `plan` no
se ejecuta mas en el ciclo.

**Se esperaba:** coherencia. O el estado es ambiguo y `approve` al menos avisa,
o no lo es y `plan` no deberia abortar.

**Recomendacion:** `planFinalFileExists` ya tiene el `PlanFinalUbicacion`
completo; devolverlo en vez de un booleano y, cuando `canonicaExiste &&
legadaExiste`, o rechazar con el mismo mensaje que `plan`, o como minimo
imprimir un aviso por `stderr` antes de aprobar. No cuesta logica nueva. (Si se
decide no corregirlo, documentarlo en el `Resultado` con el motivo, segun §8 de
CONVENCIONES.)

### 3. MENOR — con `planificacion` existiendo como **fichero**, el error que ve la persona es crudo y no dice que hacer

**Reproduccion:**

```bash
export PATH="/c/Program Files/Git/usr/bin:$PATH"
# repo con tareas/01-en-diseno/TASK-901/tarea.md (estado en-diseno) commiteado
printf 'soy un fichero\n' > tareas/01-en-diseno/TASK-901/planificacion
git add -A && git commit -q -m 901
node <plugin>/bin/taskctl plan TASK-901; echo "exit=$?"
```

**Que pasa:**

```
[ERROR] taskctl no pudo arrancar: EEXIST: file already exists, mkdir 'C:\...\TASK-901\planificacion'
exit=1
```

**Se esperaba:** un `PlanCommandError` con el estilo del resto
(`docs/contexto/CONVENCIONES.md`: *"Los mensajes de error se dirigen a la
persona y dicen que hacer, no solo que fallo"*), como el que si tiene el caso
fail-closed. Ademas "no pudo arrancar" es enganoso: arranco, valido la
transicion, comprobo la rama base y fallo a mitad.

Lo bueno: **el estado no se corrompe** — verificado que la tarea sigue en su
carpeta y con su `estado` original, porque el `mkdir` va antes de
`moveTareaFile`. Es solo diagnostico.

Nota cross-plataforma: en Windows `stat('.../planificacion/plan-final.md')`
devuelve ENOENT y por eso el fallo cae en el `mkdir`; en Linux devolveria
ENOTDIR y reventaria antes, dentro de `existeFichero`, que solo absorbe ENOENT
— y entonces tambien **`approve`** (no solo `plan`) moriria con un error crudo
sobre esa tarea. Merece la pena que `existeFichero` trate ENOTDIR como "no
existe", o que `plan` valide que `planificacion` es un directorio y lo diga.

**Recomendacion:** envolver el `mkdir` (y el `stat` de `existeFichero`) para
emitir un `PlanCommandError` del tipo *"`<ruta>` existe pero no es un
directorio: `planificacion/` tiene que ser una carpeta. Renombralo o borralo y
reintenta. La tarea no se ha movido."*

### 4. MENOR — el camino del `rename` no tiene el equivalente del `'wx'`, y `existeFichero` acepta directorios como plan

Dos caras del mismo descuido, ambas en el camino de migracion:

**(a) El `rename` pisa el destino en silencio.** El codigo argumenta
explicitamente que entre el `stat` y el `writeFile` "puede aparecer el fichero"
y por eso usa `'wx'`; el `rename`, donde perder contenido es exactamente igual
de grave, no tiene ninguna proteccion equivalente: `fs.rename` sobreescribe el
destino tanto en POSIX como en Windows. Es una ventana estrecha (hace falta que
`planificacion/plan-final.md` aparezca entre el `resolverPlanFinal` y el
`rename`), pero la asimetria con el argumento que el propio comentario defiende
es real. Se ve el efecto quitando el fail-closed (mutante #1 de la tabla): el
`rename` se traga el plan canonico sin decir nada.

**(b) Un `plan-final.md` que es un DIRECTORIO se "migra" y luego se aprueba.**
`existeFichero` usa `stat` y no distingue fichero de directorio.
Reproducido:

```
B: NO fallo. planMigrado= true planCreated= false
B: planPath es dir? true
B: contenido: planificacion/plan-final.md/dentro.txt
```

y el CLI imprime *"El plan estaba suelto en la raiz de la carpeta (formato
anterior) y **se ha movido intacto** a ..."*. Con el directorio en la ruta
canonica (caso C), `plan` reporta *"ya existia (re-planificacion) — se dejo
intacto"* y `approve` marca `plan_aprobado: true` sobre un directorio vacio.

Lo de (b) **no es una regresion**: el `approve` anterior tambien usaba `stat`,
asi que ya aceptaba un directorio. Lo nuevo es que ahora ademas se anuncia como
migracion de un plan.

**Recomendacion:** `existeFichero` → comprobar `(await stat(p)).isFile()` (y
tratar `ENOTDIR` como ausencia, ver #3). Con eso se arregla (b) y de paso el
caso legado-directorio deja de entrar en el `rename`. Para (a), si no se quiere
complicar, al menos quitar del comentario del `'wx'` la implicacion de que el
camino de escritura es el unico donde se puede perder contenido.

### 5. MENOR — comentario obsoleto: el test de regresion de TASK-012 ya no ejercita lo que dice ejercitar

En `test/commands/plan.test.ts`, el test *"la rama base real tiene la tarea en
un estado distinto al de la lectura preliminar (hallazgo CRITICO ... TASK-012)"*
escribe el plan en `01-en-diseno/TASK-700/plan-final.md`, o sea en la ubicacion
**legada**. Su comentario dice: *"...y sin pisar el plan-final.md real que ya
existe ahi (**writeFile con 'wx'**)"*. Con TASK-027 ese test ya no pasa por el
`writeFile`: entra por la rama del `rename` (`planMigrado=true`, verificado). El
test sigue siendo valido como regresion de TASK-012 (comprueba que se decide con
el contenido de la rama base), pero por otro mecanismo, y el comentario miente.

**Recomendacion:** actualizar el comentario y, ya que el test cambio de camino,
anadir `assert.equal(result.planMigrado, true)` para dejar constancia de por
donde va ahora. Es la contrapartida documental del hallazgo #1.

## Observaciones (no son hallazgos)

- `docs/contexto/ESTADO.md` (linea ~166), `docs/contexto/INVENTARIO_PENDIENTE.md`
  (~119) y `docs/contexto/CHECKLIST_TERMINACION.md` (~174, *"Hoy `plan-final.md`
  queda suelto en la raiz de la carpeta"*) siguen describiendo el estado
  anterior. Es lo esperado a mitad de ciclo — el paso 10 de CONVENCIONES los
  pone al dia al cerrar — pero conviene no olvidarlos, y el checklist ademas
  necesita casilla + contadores.
- El `README.md` del plugin no documenta la estructura de la carpeta de tarea,
  asi que no ha quedado desfasado. `finish.ts` solo usa `REVISION_DIRNAME`; no
  hay ningun otro punto del codigo que resuelva la ruta del plan por su cuenta.
- El mensaje del fail-closed aconseja *"deja solo el de `planificacion/`"*, que
  no siempre es el bueno; lo salva que antes dice *"Compara X con Y"*. Aceptable
  tal cual.

## Veredicto

**APROBADO CON CAMBIOS.**

El cambio hace lo que dice: la ubicacion canonica es la correcta segun la
seccion 2 de la metodologia, la compatibilidad hacia atras esta bien resuelta,
la migracion no pierde contenido en ninguno de los escenarios probados
(incluido hotfix contra `main` y re-planificacion repetida), el orden
escribir-antes-de-mover se respeta, y los tests nuevos son tests de verdad: los
cuatro comportamientos centrales caen bajo mutacion.

Lo que pide cambios es el hallazgo **#1**: la reestructuracion ha dejado sin
cobertura una proteccion contra perdida de datos que develop si cubria,
demostrado ejecutando el mismo mutante en las dos ramas. Por §8 de CONVENCIONES
(IMPORTANTE siempre se aplica) hay que corregirlo antes de cerrar; la
recomendacion propuesta ademas quita una rama del codigo.

Los hallazgos **#2** a **#5** son MENOR: aplicarlos si salen baratos —#2 y #5
lo son claramente— y si no, documentarlos sin corregir en el `Resultado` de la
tarea, con el motivo.
