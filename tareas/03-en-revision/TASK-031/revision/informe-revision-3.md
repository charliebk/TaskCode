# Informe de revision — TASK-031 (ronda 3, cierre)

- Tarea: TASK-031 — Distribucion del CLI: un clon debe traer un taskctl que arranque
- Rama revisada: fix/task-031-distribucion-del-cli-un-clon-debe-traer
- Commit de correcciones verificado: 35400b7 (HEAD de la rama: e60ec5c)
- Fecha: 2026-09-07
- Modalidad: un revisor independiente, **en clones propios**. Alcance acotado a
  los 7 hallazgos de la ronda 2 mas la suite; no se reaudito la tarea entera.

- Veredicto: aprobada

**Cero criticos. Cero importantes. 5 menores**, todos residuos acotados o
precisiones de redaccion. Los 7 cambios de la ronda 2 estan aplicados y **los 7
hacen lo que dicen**, comprobado ejecutandolos uno a uno. Suite en la linea
base exacta: **537 tests, 534 verdes** y los 3 rojos conocidos, con la causa a
la vista en cada uno. Ningun cuarto rojo, ningun `EBUSY`.

Los 5 menores se han **corregido tambien**, aunque el veredicto no lo exigia.

---

## Lo verificado

| Hallazgo de la ronda 2 | Comprobacion | Resultado |
|---|---|---|
| Paso 2 de la skill | recorrer las instrucciones con la variable vacia y con ella puesta | **No hay camino a la conclusion falsa.** El paso 3 es inalcanzable con la variable vacia |
| Nota de migracion | construir el caso y ejecutar el comando | El diagnostico de la no-rematerializacion es correcto (59 ficheros `w/crlf` con `attr/text eol=lf`) |
| Separacion de causas en HALLAZGOS | contrastar guard vs `.gitattributes` | Exacto: el guard es un step de CI y no toca maquinas |
| `git add -A -f` (quinto escenario) | reconstruirlo entero, con y sin `-f` | **Sin `-f`: verde con el clon roto. Con `-f`: rojo.** Las dos mitades confirmadas |
| `git reset -q` + `exit $rc` | indice y codigo de salida en verde y en rojo | Indice vacio y codigo correcto en los dos caminos |
| Comentario + assert de `bin/*` | mutar el `.gitattributes` | El test se pone rojo: `error: 'y el lanzador, por el shebang'` |
| Honestidad de los informes | leer las rectificaciones | Dicen sin rodeos que la ronda 1 se equivoco |

El comentario reescrito de la asercion `Cannot find module` se verifico en sus
tres afirmaciones contra Node 22.23.2: sin `bin/taskctl` falla Node antes del
`catch`, no aparece "no pudo arrancar", y la linea nueva no habria discriminado
ese caso. Los dos bloques de guard (Linux y Windows) son ahora identicos linea
a linea ignorando comentarios.

---

## Menores, todos corregidos

### M-1 — El sexto escenario: el `-f` detecta, pero el remedio que imprime el guard no se podia seguir

El `-f` arregla la ceguera, no la causa. Los patrones sin ancla seguian ahi, asi
que el fichero que el guard senalaba **no se podia commitear con lo que el
propio mensaje de error prescribe**: `git add dist/src/tareas/listado.js` moria
con *"The following paths are ignored by one of your .gitignore files"*. CI en
rojo permanente y un callejon sin salida. Y la misma raiz mordia antes en el
lado de las fuentes: `git add -A` se saltaba en silencio el propio `.ts`.

**Corregido anclando los patrones**: `/tareas/` en el `.gitignore` del plugin y
`/logs/` en el de la raiz. Verificado en los dos sentidos — `dist/src/tareas/` y
`dist/src/logs/` ahora son visibles, mientras `tareas/`, `dist/test/`,
`dist/tsconfig.tsbuildinfo` y el `logs/` de la raiz siguen ignorados.

**Residuo aceptado**: `node_modules/` se deja sin anclar, asi que un
`dist/src/node_modules/` seguiria invisible. Anclarlo dejaria de ignorar los
`node_modules` anidados de dependencias, y un directorio *fuente* llamado
`node_modules` seria patologico. `src/tareas/` no lo es en un gestor de tareas;
`src/node_modules/` si.

### M-2 — El comentario del `git reset` prometia mas de lo que el snippet cumple

Decia *"el indice se deja como estaba"*, y lo que hace es ponerlo **a HEAD**.
Con trabajo preparado en `dist/src`, el snippet lo destruye — y el `rm -rf` de
la primera linea se lleva ademas la modificacion del working tree. En CI es
irrelevante, que es donde vive el fichero. **Corregido el comentario**, que
ahora dice lo que hace y advierte de que no es para copiar tal cual.

### M-3 — El efecto local documentado no reproduce en dos reconstrucciones fieles

La nota de migracion afirmaba que traer la rama a un worktree preexistente deja
el workspace sucio y bloquea `taskctl`. El revisor lo construyo por dos caminos
—clon de `develop` con `autocrlf=true` y luego checkout, y worktree con
`merge`— y en los dos `git status` salio **limpio** y `taskctl` funciono, pese a
que los 59 ficheros estaban efectivamente en `w/crlf`. El diagnostico de por
que se quedan en CRLF es correcto y esta verificado; **el salto de ahi al
workspace sucio necesita una precondicion que ninguna de las tres rondas supo
enunciar**.

**Corregido**: la nota sale de `## Smoke test manual` —seccion cuyo snippet
empieza clonando de cero, que es justo el caso donde no aplica— y pasa a la
seccion de Git, redactada como sintoma reconocible ("si te pasa, esto es") en
vez de como consecuencia inevitable. Se anade ademas lo que callaba: que
`git add --renormalize .` **prepara todo lo tracked**. Y `HALLAZGOS.md` deja
escrito que la precondicion no esta cerrada, en vez de una certeza que no lo es.

### M-4 — El informe de la ronda 1 seguia dando por corregido lo que la ronda 2 tumbo

La ronda 2 rectifico tres puntos del informe 1, pero no el de su propio
hallazgo I-1: la seccion I-6 seguia diciendo **Corregido** sobre los tres pasos
que la ronda 2 habia demostrado rotos. El documento repetia el vicio que la
ronda 2 criticaba a su lado. **Corregido**: la rectificacion esta ahora en I-6.

### M-5 — El porton del paso 3 filtraba por "ruta de verdad", no por "ruta de este plugin"

Si `CLAUDE_PLUGIN_ROOT` llegara con el valor de otro plugin, la invocacion
fallaria, la condicion "con una ruta de verdad" se cumpliria y el agente
volveria a la conclusion falsa. No es teorico del todo: en el entorno medido,
`CLAUDE_PLUGIN_DATA` apunta a un plugin ajeno. **Corregido**: el paso 3 exige
que la ruta contuviera `bin/taskctl`, y si no, devuelve al paso 1.

---

## Cierre

Con los cinco menores aplicados, la tarea queda sin hallazgos abiertos salvo el
residuo de `node_modules/` de M-1, aceptado con su motivo, y lo que ya estaba
anotado como no corregido en las rondas anteriores (el coste de los dos clones,
con su alternativa medida). Todo ello queda en el `Resultado` de la tarea, como
pide la §2 de `CONVENCIONES.md`.
