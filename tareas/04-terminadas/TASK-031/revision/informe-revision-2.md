# Informe de revision — TASK-031 (ronda 2)

- Tarea: TASK-031 — Distribucion del CLI: un clon debe traer un taskctl que arranque
- Rama revisada: fix/task-031-distribucion-del-cli-un-clon-debe-traer
- Commit revisado: 62d5e0f
- Fecha: 2026-09-07
- Modalidad: **un revisor independiente, en clon propio**. Es la correccion
  del metodo que dejo la ronda 1: alli los tres revisores compartieron working
  tree y uno midio el estado que otro estaba mutando.

- Veredicto: cambios solicitados

**Cero criticos. 2 importantes, 5 menores.** Los dos importantes **no son
defectos del trabajo original: son defectos de las correcciones de la ronda
1**. Es el mismo patron que ya registro C6 — el primer arreglo de un hallazgo
de revision tambien puede estar mal— y esta vez lo cazo tener una ronda mas.

De los cuatro escenarios del guard que la ronda 1 dio por verificados, **los
cuatro se comportan como se afirmaba**. Ninguna regresion: 537 tests, 534
verdes y los 3 rojos conocidos, con la causa a la vista en cada uno.

Todos los hallazgos, importantes y menores, **aplicados**.

---

## Importantes

### I-1 — El paso 2 del prerrequisito de la skill no funcionaba, y desembocaba en la conclusion que venia a borrar

La correccion de la ronda 1 sustituyo *"si no responde, el plugin no esta
activo"* por tres pasos. El segundo mandaba invocar
`node "$CLAUDE_PLUGIN_ROOT/bin/taskctl"`, y **`CLAUDE_PLUGIN_ROOT` no esta
exportada en el entorno del Bash tool** (si lo esta `CLAUDE_PLUGIN_DATA`, o
sea que no es un borrado general: simplemente no se exporta). Vacia, la ruta
colapsa a `/bin/taskctl`, Git Bash la resuelve a `C:\Program Files\Git\usr\bin`
y devuelve:

```
Error: Cannot find module 'C:\Program Files\Git\usr\bin\taskctl'
```

El agente lee "tampoco responde" y salta al paso 3: **el plugin no esta
activo**. Que es exactamente la conclusion falsa que I-6 de la ronda 1 venia a
eliminar, ahora con un paso mas de por medio. El plugin **si** esta activo,
verificado en `installed_plugins.json` y en `settings.json`.

Lo mas incomodo: **el propio repo ya sabia que esa variable no siempre esta**.
`src/fs/gitflow-runner.ts` la lee con fallback y lo comenta. La skill no tenia
ese fallback.

**Aplicado**: el paso 2 comprueba primero `echo "$CLAUDE_PLUGIN_ROOT"` y dice
explicitamente que, si sale vacia, no concluye nada sobre si el plugin esta
activo. El paso 3 solo es alcanzable si el 2 llego a ejecutarse con una ruta
de verdad.

### I-2 — El efecto local que hizo «importante» al fallo del guard no lo causaba el guard

La ronda 1 justifico la gravedad de su I-1 con el efecto local —workspace
sucio, `taskctl` bloqueado por su §8.3— y lo dio por **corregido** al arreglar
el guard. Son dos cosas distintas: **el guard es un step de CI y no toca la
maquina de nadie**. Quien deja el workspace sucio es el `*.ts text eol=lf` que
introduce esta misma tarea, y lo hace en cuanto alguien trae la rama a un
worktree preexistente, sin haber ejecutado el guard ni una vez:

```
$ git status --porcelain | head -3
 M .../src/cli.ts
 M .../src/cli/args.ts        (26 ficheros, sin haber compilado nada)
$ node bin/taskctl new --titulo "Prueba" --tipo feature
[ERROR] Hay cambios sin guardar en "fix/task-031-...". Guardalos o comitealos.
```

Y la afirmacion de que *"no se puede limpiar"*, que llego a `HALLAZGOS.md`, es
falsa. Hay salida, de un comando y sin commit:

```
$ git update-index --really-refresh ; git status --porcelain
 M .../src/core/task.ts          <- confirmado: NO lo arregla
$ git add --renormalize <fichero> ; git status --porcelain
(vacio)                          <- si lo arregla
```

**Aplicado**: nota de migracion en `CONVENCIONES.md` —que es donde la va a
leer quien traiga la rama—, corregida la entrada de `HALLAZGOS.md` para que
diga la salida y separe las dos causas, y rectificado el informe de la ronda 1
donde daba por corregido lo que no lo estaba.

---

## Menores

**Aplicados (5):**

1. **El quinto escenario del guard, que se le escapo a los cuatro revisores y
   al implementador.** `git add -A` **salta en silencio** lo que cualquier
   `.gitignore` excluya, y los patrones de directorio sin ancla (`tareas/`,
   `logs/`, `node_modules/`) casan a cualquier profundidad, **tambien dentro de
   `dist/src`**. En un proyecto que es un gestor de tareas, un `src/tareas/` no
   es rebuscado. El revisor lo llevo hasta el final: el `.js` no llega al
   commit, el guard dice "dist/src esta al dia", y el clon resultante muere con
   `Cannot find module ...dist\src\tareas\listado.js` — el defecto exacto de
   E6, reintroducido. Se queda en MENOR porque el test de AC1 si lo caza (el
   `--version` recorre el grafo entero de imports), pero el guard mentia.
   Arreglado con `git add -A -f` y verificado: ahora ROJO.
2. El snippet dejaba el indice tocado si alguien lo copiaba a su maquina.
   Ahora hace `git reset -q -- dist/src` y propaga el codigo por su cuenta.
   Verificado que el indice queda intacto en verde y en rojo.
3. **La justificacion de la asercion `Cannot find module` era falsa.** El
   informe de la ronda 1 decia que sin `bin/taskctl` la contraprueba pasaria,
   y no: ahi falla Node antes de entrar al `catch`, no imprime "no pudo
   arrancar", y lo cazaba ya la asercion anterior. Node escribe encima su
   propio `Cannot find module`, asi que la linea nueva no habria discriminado
   ese caso ni queriendo. La asercion sigue valiendo por el motivo correcto —un
   `cli.js` presente que muera por otra cosa— y el comentario esta reescrito.
4. `bin/* text eol=lf` era la unica de las tres reglas del `.gitattributes`
   sin test, siendo la de consecuencia menos sutil. Ya lo tiene.
5. El coste de los dos clones estaba planteado como un dilema falso. No es
   "compartir el export o pagar los cuatro segundos": `git archive HEAD | tar
   -x` da la misma semantica en **0,30 s frente a 1,80 s**, conservando el
   aislamiento y sin borrar un `.git` entero (que es lo que alimenta los
   `EBUSY ... rmdir` de Windows). No se implementa en esta tarea, pero queda
   anotado como mejora concreta en vez de como coste inevitable.

---

## Lo verificado que salio limpio

- **Los cuatro escenarios del guard**, reconstruidos por el revisor con el
  snippet literal del `ci.yml`, incluido el huerfano con dos commits reales:
  sano VERDE, modulo nuevo ROJO, huerfano ROJO, worktree en CRLF VERDE. Y el
  contraste con el guard viejo, que en el cuarto daba el falso positivo.
- **7 de 7 mutaciones** del fichero de tests siguen discriminando, incluidas
  dos que no se habian probado antes: `git add -f dist/test` y sacar
  `bin/taskctl` del indice.
- **El `.gitignore` de lista blanca es robusto**: probado con subdirectorio
  anidado nuevo dentro de `dist/src/`, y con lo que debe quedar fuera —
  `dist/tsconfig.tsbuildinfo`, que era el motivo del cambio, sale ignorado.
- **`bin/* text eol=lf` no rompe nada**: mismo blob y mismo modo `100755` que
  en `develop`, sin CR tras el shebang, y arranca.
- **`CLAUDE.md` dice 537 y la suite da 537.**
- **Las dos filas reformuladas de AC7** son ciertas y sus numeros exactos (34
  ficheros de `dist/test` en la cache, 0 versionados). El revisor propone
  ademas una evidencia mejor para el `npm ci` que la del `mtime`: el
  `node_modules` entero de la cache tiene mtime del instante del install
  mientras la copia preserva los del working tree.
- **Lo que el README deja sin confirmar sigue sin confirmar, y bien
  etiquetado**: el revisor lo midio y no refuta la hipotesis, porque la sesion
  arranco a las 13:51 y el plugin se instalo a las 14:38 — dentro de ella.
- **Los siete commits de la rama son ASCII puro**, sin una tilde.

## Anotado para el cierre

El revisor recuerda la §2 de `CONVENCIONES.md`: el `Resultado` de la tarea
tiene que recoger los hallazgos de **las dos rondas**, incluidos los que se
decida no corregir.
