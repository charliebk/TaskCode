# Plan — TASK-015: Límite de trabajo en curso por persona

## Enfoque propuesto

### Qué se limita, exactamente

La decisión #13 (resuelta el 2026-09-05) fija un **único límite, y solo
sobre la ejecución**:

- `taskctl plan` **no comprueba nada**. En diseño no hay tope.
- `taskctl start` aborta si la persona asignada ya tiene otra tarea en
  `02-en-curso` **o** en `03-en-revision`.

El criterio de aceptación dice "comprueba el límite en el momento en que
se fija `asignado_a`". Con este alcance, ese momento es **`start`**: es el
único comando que abre una rama, que es lo que de verdad se está
limitando. Que `plan` también fije `asignado_a` (desde B6) no lo convierte
en un punto de control, porque diseñar no consume el recurso escaso.

`03-en-revision` cuenta porque la rama sigue viva y sin mergear hasta
`taskctl finish`, y es ahí donde se commitean las correcciones de los
hallazgos. Liberar el hueco al pasar a revisión reintroduciría exactamente
el fallo que la tarea quiere evitar: dos ramas abiertas, y los commits de
corrección de la primera cayendo en la segunda.

### Dónde vive cada cosa

Se respeta la separación que ya tiene el proyecto: `src` sobre `core` es
puro y se prueba sin disco; la capa `fs` es la única que toca el
filesystem.

1. **`core/wip.ts`** (nuevo, puro). La regla y sus mensajes:
   - `ESTADOS_QUE_OCUPAN_WIP = [en-curso, en-revision]`, un único sitio
     donde está escrito qué ocupa el hueco.
   - `tareasQueBloquean(tareas, persona, idQueArranca)`: filtra por
     `asignado_a` y excluye la propia tarea que arranca.
   - `mensajeWipExcedido(...)` y `mensajeWipIndeterminado(...)`: construyen
     el texto. Separados de la comprobación para poder aseverar el mensaje
     sin montar un repo Git — el criterio 2 es sobre el mensaje, así que
     merece test propio.

2. **`fs/task-store.ts`**: `listTareasEnEstados(tareasRoot, estados)`, que
   escanea solo las carpetas pedidas, parsea cada `tarea.md` y devuelve
   `tareas` e `ilegibles`, deduplicado por ID.

3. **`commands/start.ts`**: la comprobación, situada **después** de validar
   la transición y el flag, y **antes** de tocar Git.

No se lanza un error nuevo: se reutiliza `StartCommandError`, que `cli.ts`
ya captura. Un `WipLimitError` propio obligaría a tocar el despacho de
errores del CLI sin ganar nada.

### Comparación de la persona

Exacta y sensible a mayúsculas, sobre el valor ya recortado que escribe
`parseAsignadoAFlag` (B6). No se normaliza a minúsculas: `asignado_a` es
texto libre, y no hay ningún sitio en el sistema que trate "Carlos" y
"carlos" como la misma persona. Inventar aquí una equivalencia que no
existe en `board` ni en ningún otro comando crearía una incoherencia nueva.

### Casos que la comprobación debe dejar pasar

- **`asignado_a` es `null`** (nadie asignado): no hay persona a quien
  aplicarle un límite, así que `start` sigue adelante. Es el
  comportamiento de todas las tareas anteriores a B6, que no habría que
  romper.
- **La propia tarea que arranca**: se excluye por ID. Hoy no puede estar
  en las carpetas 02 ni 03 (la máquina de estados exige `en-diseno`), pero
  depender de eso haría que el día que se relaje la máquina de estados
  esta comprobación empezara a bloquearse a sí misma.
- **Otra persona con tareas en curso**: no afecta.

### Tarea ilegible en 02 o 03: fail-closed acotado

Si un `tarea.md` de esas dos carpetas no se puede parsear, **no sabemos de
quién es**, y podría ser justo la que viola el límite. `start` aborta
nombrando el fichero que hay que arreglar.

El fail-closed se acota a esas dos carpetas a propósito: una tarea rota en
`00-planificadas` no puede ocupar un hueco de ejecución, así que no debe
poder bloquear a nadie. Es el mismo criterio que ya aplicó `approve` al
endurecer su parser (fail-closed donde la duda puede autorizar algo), pero
sin extenderlo a datos que no participan en la decisión.

## Alternativas consideradas

**Reutilizar el cargador de tareas de `board` en vez de una función
nueva.** `board` ya lee todas las tareas, con deduplicado y advertencias.
Extraerlo a una función compartida habría evitado dos lecturas parecidas,
pero obliga a refactorizar un comando que esta tarea no toca, y `board`
necesita cosas que `start` no (todas las carpetas, advertencias
acumuladas, orden estable porque acaba en un fichero versionado).
`listTareasEnEstados` es más pequeña que la parte de `board` que se habría
reutilizado.

**Comprobar también en `plan`.** Descartado por la decisión #13: en diseño
no hay tope.

**Un límite configurable (N tareas en vez de 1).** Es la tercera opción que
se le ofreció a Carlos y no la eligió. Además `.taskcode/config.yml` no
existe todavía (item C4, decisión #9 abierta): construir aquí el lector de
configuración adelantaría una decisión que no es de esta tarea. La
constante queda en un solo sitio, así que hacerla configurable el día que
exista C4 es un cambio local.

**Avisar en vez de abortar.** Contradice la §8.2, que describe un error que
bloquea, y no evitaría el problema: un aviso que no para nada deja las dos
ramas abiertas igual.

## Riesgos o preguntas abiertas

- **Divergencia con la §8.2, que está congelada.** La metodología describe
  dos límites independientes, uno de ellos sobre el diseño. Lo
  implementado es un único límite de ejecución. Se documenta en
  `HALLAZGOS.md`; no se reescribe la metodología.
- **La comprobación mira el checkout actual, no al equipo.** Si otra
  persona tiene una tarea en curso en su propia rama sin mergear, este
  `start` no la ve. Es inherente a que el estado viva en ficheros
  versionados, y es el mismo límite que ya tienen `board` y `finish`. No
  se intenta resolver aquí.
- **Interacción con el bug conocido de `start` y las ramas base sin
  `tareas`** (un hotfix que nace de `main`): la comprobación se hace antes
  del checkout, sobre lo que ve la rama actual, así que no la afecta el
  borrado del working tree que documenta `tolerateMissingSource`.
- **Puede dejar a alguien bloqueado si una revisión se alarga.** Es
  consecuencia buscada de la decisión #13, no un efecto secundario: la
  salida es `taskctl finish` o reasignar la tarea, y el mensaje de error
  lo dice.
