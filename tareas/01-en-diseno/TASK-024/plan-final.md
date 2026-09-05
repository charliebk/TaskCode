# Plan — TASK-024: asignado_a por defecto desde la identidad Git

## Enfoque propuesto

### La regla de precedencia

Un solo sitio decide quién queda asignado, y en este orden:

1. **`--asignado-a <persona>`**, si se pasó. Manda siempre: es la vía para
   asignar a otra persona y la salida que ofrece el error de WIP de B7.
2. **El `asignado_a` que ya tuviera la tarea**, si no está vacío. Ejecutar
   un comando sobre la tarea de otra persona **no se la queda**.
3. **`git config user.email`**, si está configurado. Es la novedad.
4. **`null`**, como hoy. Sin identidad configurada nada se rompe.

El punto 2 antes que el 3 es deliberado y es lo que evita el robo silencioso
de tareas: si Ana planificó TASK-030 y Carlos ejecuta `taskctl start
TASK-030` sin flag, la tarea sigue siendo de Ana — y el límite de WIP se
comprueba contra Ana, que es quien tiene la rama. Para quedársela, Carlos
tiene que decirlo con `--asignado-a`.

### Por qué esto importa mas allá de la comodidad

El límite de WIP de B7 (`start` aborta si la persona ya tiene otra rama
abierta) **solo actúa sobre tareas con `asignado_a` no vacío**. Como `new`
e `import` las crean con `null`, hoy más de la mitad de las tareas de este
repo caen en el camino que no comprueba nada: el límite es opt-in y protege
solo a quien se acuerda del flag. Con esto pasa a ser el comportamiento por
defecto, que es lo que la §8.2 da por supuesto.

### Dónde vive cada cosa

1. **`fs/git.ts`**: `gitUserEmail(cwd): string | null`. Lee
   `git config user.email`. Devuelve `null` si no está configurado, en vez
   de lanzar: "no hay identidad" es un estado legítimo, no un error. Es la
   única función de este módulo que **no** usa `runGit`, porque `runGit`
   convierte cualquier exit != 0 en excepción y `git config` sale con 1
   justamente cuando la clave no existe.
2. **`core/wip.ts`**: `resolverAsignado(flag, previo, identidad)`, la regla
   de precedencia, pura y testeable sin disco. Vive junto a
   `personaDeTarea`, que ya normaliza el mismo campo.
3. **`commands/plan.ts` y `commands/start.ts`**: sustituyen su
   `asignadoA !== undefined ? ... : task.asignado_a` por una llamada a
   `resolverAsignado`. En `start`, el valor resultante es el que ya
   alimenta la comprobación de WIP, así que no hay que tocar ese orden.

### Qué NO se toca

**`new` e `import` siguen creando con `null`.** Quien da de alta una tarea
no tiene por qué ser quien la vaya a hacer — `import` crea once de golpe —
y asignarlas ahí llenaría el tablero de tareas falsamente atribuidas. El
primer contacto real con la tarea es `plan`, y ahí es donde se asigna.

**No se normalizan mayúsculas ni dominios.** La identidad es la cadena que
devuelve Git, comparada exacta, igual que en B7.

### La migración de las 10 tareas existentes

Nueve tareas dicen `charlie.bk` (TASK-004 a TASK-012) y una dice `carlos`
(TASK-015). Las dos son la misma persona, y ninguna coincide con la
identidad elegida. Se migran las diez a `charlie.bk@gmail.com` en el mismo
commit que el cambio de comportamiento, porque dejarlas divergentes
mantendría vivo justo el problema que la tarea viene a cerrar.

TASK-015 está **terminada** y su `asignado_a` es un dato histórico, pero es
un dato histórico *equivocado*: `carlos` lo escribí a mano por no tener
todavía esta decisión. Se migra igual, y se regeneran `docs/BOARD.md`,
`docs/INDEX.md` y `CHANGELOG.md` si el cambio les afecta.

## Alternativas consideradas

**`user.name` en vez de `user.email`.** Era mi recomendación: el `user.name`
de este repo es literalmente `charlie.bk`, así que las nueve tareas
históricas no habrían necesitado migración. Carlos eligió `user.email`, que
es la identidad realmente única y sobrevive a un cambio de nombre para
mostrar. Se asume el coste de migrar diez ficheros.

**Leer la identidad una vez y cachearla.** Innecesario: son dos comandos
`git config` por ejecución de CLI, y cachear introduce un estado que habría
que invalidar.

**Que `--asignado-a` desaparezca y todo salga de Git.** Rompería la única
salida que ofrece el error de WIP ("reasigna con --asignado-a") y haría
imposible planificar trabajo para otra persona.

**Resolver la identidad en `cli.ts` y pasarla por `deps`.** Más limpio en
teoría, pero obliga a tocar la firma de dos comandos y sus dependencias en
todos los tests. `plan` y `start` ya reciben `repoCwd`, que es todo lo que
`gitUserEmail` necesita.

## Riesgos o preguntas abiertas

- **El límite de WIP se vuelve efectivo de golpe.** Es el objetivo, pero
  conviene decirlo: a partir de este cambio, un `taskctl start` que antes
  pasaba puede empezar a abortar, porque la persona ya tenía otra rama
  abierta y nadie lo estaba comprobando. No es una regresión; es la regla
  de B7 aplicándose por fin.
- **La columna `Asignado` de `taskctl board` se ensancha.** Un correo ocupa
  bastante más que `carlos`. Hay que comprobar que el listado sigue
  legible y que `docs/BOARD.md`, que es un fichero versionado, no queda
  ridículo. Si molesta, el arreglo es de presentación, no de datos.
- **Los tests que montan repos temporales configuran `user.email`** con
  `test@example.com` (hace falta para poder commitear). Eso significa que
  a partir de ahora **las tareas de esos tests se autoasignan**, y los que
  esperaban `asignado_a: null` van a fallar. Hay que revisarlos uno a uno
  y decidir en cada caso si el test debe adaptarse o si estaba capturando
  algo que ahora cambia de verdad. **Es el riesgo principal de esta
  tarea**: son muchos tests y es fácil "arreglarlos" en masa escondiendo
  una regresión real.
- **Dos personas con el mismo `user.email`** (una máquina compartida) se
  verían como la misma y se bloquearían entre sí. Es exactamente lo que
  pide la decisión, y el caso contrario (dos identidades para la misma
  persona) era el problema que veníamos a resolver.
- **Sin `user.email` configurado no hay aviso.** La tarea queda sin asignar
  en silencio, como hoy. Se podría avisar por stderr, pero sería ruido en
  cada comando para un caso que en la práctica no se da (Git no deja
  commitear sin identidad, así que cualquier repo con historia la tiene).
