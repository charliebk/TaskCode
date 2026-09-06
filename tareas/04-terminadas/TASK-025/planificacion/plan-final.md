# Plan — TASK-025: el límite de WIP mira las ramas de trabajo

## Enfoque propuesto

### El error de fondo que hay que deshacer

B7 preguntó *"¿hay algún `tarea.md` en `02-en-curso` que sea de esta
persona?"* mirando el working tree. Esa pregunta es la correcta, pero el
sitio donde la hace es el equivocado: el estado de una tarea en curso vive
**en su rama**, no en la rama base desde la que se ejecuta `start`.

La pregunta buena es otra, y además es más directa: *"¿tiene esta persona
alguna **rama de trabajo abierta**?"*. Una rama de tarea que existe y no
está mergeada **es**, literalmente, trabajo en curso — que es justo lo que
la decisión #13 quiere limitar ("evitar que se programe código de una tarea
en la rama Git de otra"). Y a diferencia del working tree, las ramas se ven
desde cualquier sitio.

### Qué cuenta como rama de trabajo abierta

Una rama local que cumple las tres:

1. No es la rama base de la tarea que arranca, ni la principal.
2. **No está mergeada** ni en la rama base ni en la principal. Se comprueba
   con `merge-base --is-ancestor`, que ya existe como `isAncestor`.
3. Su árbol tiene algún `tarea.md` en `02-en-curso` o `03-en-revision`
   (los mismos `ESTADOS_QUE_OCUPAN_WIP` de B7, sin duplicar la regla).

El punto 2 importa mucho **en este repo en concreto**: la política IECA dice
que las ramas no se borran tras el merge, así que hay 18 vivas y casi todas
cerradas. Sin ese filtro, cualquiera bloquearía a todo el mundo para
siempre.

Se comprueba contra la base **y** la principal porque un `hotfix` mergeado a
`main` está cerrado aunque nunca llegue a `develop` si el backmerge falló:
bloquear por eso sería un falso positivo con una causa muy difícil de
adivinar desde el mensaje de error.

### Dónde vive cada cosa

1. **`fs/git.ts`**: `localBranches(cwd)`, que faltaba. El resto ya está:
   `isAncestor`, `lsTreeNames` y `showFileAtRef` los añadieron TASK-013 y
   TASK-014 para leer ficheros de otras refs, que es exactamente esto.
2. **`fs/wip-scan.ts`** (nuevo): el escaneo. Va en un módulo propio y no en
   `task-store.ts` porque cruza las dos capas — necesita Git y el parser de
   tareas —, y `task-store.ts` no ha importado nunca `git.ts`. Expone:
   - `ramasDeTrabajoAbiertas(repoCwd, base, principal)`
   - `escanearWip(...)`: une lo que ve el árbol activo (el
     `listTareasEnEstados` de B7, que se conserva) con lo que ven las
     ramas, deduplicando por ID.
3. **`commands/start.ts`**: cambia la llamada. La regla (`tareasQueBloquean`,
   los mensajes) no se toca: sigue en `core/wip.ts` y sigue siendo pura.

Se **conserva** la lectura del árbol activo además de la de las ramas. No es
redundante: cubre el caso de una tarea movida a `02-en-curso` y commiteada
en la rama base (que pasa con las tareas del propio bootstrapping), y
mantiene verdes los tests de B7 que ya cubren ese camino.

### El mensaje de error

Ya nombra la rama (`t.task.rama`, del frontmatter). Con este cambio esa rama
pasa a ser el dato **más** útil de los tres, porque es lo que la persona
tiene que ir a cerrar. No hace falta tocarlo.

### Tareas ilegibles dentro de una rama

Mismo criterio fail-closed que B7, pero acotado: si un `tarea.md` de una
rama abierta no se puede leer o parsear, se añade a `ilegibles` con el
formato `rama:ruta` para que el mensaje diga **dónde** mirar, y `start`
aborta. No se puede descartar que sea la que bloquea.

Lo que **no** se hace: abortar porque una rama entera sea ilegible por otro
motivo (una ref corrupta, un `ls-tree` que falla). Eso no es una tarea
dudosa, es un repo roto, y el error de Git ya se propaga con su mensaje.

## Alternativas consideradas

**Deducir la tarea del nombre de la rama** (`feature/task-020-...` a
`TASK-020`) en vez de leer su `tarea.md`. Más rápido y sin `git show`, pero
el nombre no dice **de quién** es la tarea, que es justo lo que hay que
saber. Y ataría el límite a una convención de nombres que hoy nadie valida.

**Mirar solo las ramas y quitar la lectura del árbol activo.** Sería más
simple, pero rompe el caso de una tarea en curso commiteada en la propia
rama base, y tiraría tests de B7 que cubren comportamiento legítimo.

**Consultar también las ramas remotas.** Detectaría el trabajo en curso de
otras personas, que es una limitación real y ya documentada. Se descarta
aquí: obliga a un `fetch` (red, lentitud y un fallo nuevo en un comando que
hoy funciona sin conexión) y convierte un límite personal en uno de equipo,
que nadie ha decidido. Queda anotado, no hecho.

**Guardar el estado del WIP en un fichero aparte**, fuera del control de
versiones. Resolvería el problema de raíz, pero introduce un estado que
puede desincronizarse del repo, y esa carpeta de configuración todavía no
existe: es el item C4, bloqueado por la decisión #9.

## Riesgos o preguntas abiertas

- **Coste en llamadas a Git.** Una por rama abierta para el `ls-tree`, más
  una por tarea encontrada para el `show`. En este repo hay 18 ramas y casi
  todas mergeadas, así que las candidatas reales son una o dos. Si algún día
  molesta, el filtro de mergeadas ya está y es el que hace el trabajo.
- **Solo ve ramas LOCALES.** Si otra persona tiene su tarea en curso y no
  has hecho `fetch`, no la ves. El límite sigue siendo, en la práctica,
  personal y por máquina. Es la misma limitación que ya tienen `board` y
  `finish`, y se documenta otra vez aquí porque ahora es la única que queda.
- **Una rama de trabajo sin commitear el movimiento de la tarea no se ve.**
  Si alguien hace `start` y no commitea, su rama no tiene la tarea en
  `02-en-curso` y no cuenta. Es el hueco que cerraría el auto-commit del
  paso 5 (item C2, decisión #14 abierta): otra evidencia a favor.
- **Este arreglo endurece de verdad el límite**, así que puede empezar a
  bloquear a quien hoy trabaja con varias ramas abiertas. Es lo pedido, pero
  conviene que la primera vez que ocurra el mensaje se entienda a la
  primera: por eso nombra la rama concreta que hay que cerrar.
