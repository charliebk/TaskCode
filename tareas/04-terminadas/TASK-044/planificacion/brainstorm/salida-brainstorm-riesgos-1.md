# Salida — brainstorm-riesgos (ronda 1)

[V] = verificado leyendo codigo o tareas; [S] = supuesto.

## Modos de fallo, de mayor a menor gravedad
- [V] **Las hijas nacen bloqueadas**: `import` escribe un Objetivo vacio
  (`src/commands/import.ts:275`) y `validarEnunciado` lo bloquea. «Lo acepta
  import» se cumple, pero la particion no sirve. Mitigacion: llevar el
  Objetivo en el formato de import, o avisarlo.
- [V] **«Transversal» / «Comunes» no son frentes**: TASK-029, 030 y 032 tienen
  un grupo asi (suite en verde, revision, checklist). Convertirlo en tarea da
  una hija imposible y las demas pierden esos criterios. Copiarlo en cada hija
  o que decida una persona; nunca tarea propia.
- [V] **Nombres de grupo genericos chocan**: `import` rechaza titulos cuyo
  normalizado ya existe (`import.ts:265-269`); anteponer el titulo del padre
  choca con `slugify` (corta a 40, `new.ts:246`). Anteponer solo el ID
  («TASK-030 C4 — ...»).
- [V] **«### Tras el cierre»**: si pasa como criterio normal, `finish` lo exige
  marcado y la hija no se puede cerrar; tampoco es un frente (TASK-033 lo
  usa). Tratarlo aparte y avisar de que import no tiene donde ponerlo.
- [S] **Reintentar `plan` pisa la particion editada**; con `wx`, EEXIST tapa el
  bloqueo real. Si existe igual, nada; si distinto, no tocarlo y nombrarlo.
- [V] **Bloquear por frentes con 12 o menos**: en `tareas/` no hay grupos en
  criterios fuera de 029/030/032 (las tres pasan de 12). «### Parser / ###
  CLI» es hipotetico; para quien lo escriba manana el bloqueo no tiene salida
  (partir sin grupos esta fuera de alcance). Con 12 o menos, avisar.
- [V] **El detector**: mirar el Objetivo da falsos positivos (TASK-033 tiene
  `### 1.`, `### 2.`, `### 3.` en el Objetivo; TASK-032 lista D7 y D6 en
  negrita en una linea). Volcar `- [x]` tal cual da «- [ ] [x] ...». Los
  criterios previos al primer grupo se perderian. Un grupo vacio deja un
  import a medias. TASK-032 tiene una linea en blanco entre la cabecera en
  negrita y su lista.

## Estados intermedios y fallos parciales
- [V] El aborto ocurre antes de escribir en el repo (`plan.ts:468-476` frente
  a `:511`); hay que mantenerlo. Si la escritura falla, `plan` aborta igual
  con el bloqueo original y no nombra un fichero que no existe.
- [S] Escritura no atomica: un truncado lo acepta import en parte. Temporal +
  rename.
- [S] Donde: junto al repo ensucia submodulos o worktrees. `os.tmpdir()` y
  comprobar que no cae dentro de `git rev-parse --show-toplevel`.
- [S] Colision entre proyectos con el mismo ID y entre dos `plan` a la vez.
  El titulo no vale para el nombre (`: ? * "` en Windows).
- [S] Windows: `tmpdir` en nombre 8.3 (`NULLCA~1`) engana a `path.relative`:
  `realpath` en los dos lados. Rutas con espacios: entrecomillar en el error.
  Storage Sense puede borrar la propuesta (tolerable: se regenera).

## Compatibilidad hacia atras
- [V] Ninguna tarea en 00/01 tiene grupos en los criterios: con el detector
  limitado a criterios y sin contar «Tras el cierre», nada cambia de conducta.
- [V] Si se amplia `import` para llevar el Objetivo, los ficheros ya escritos
  tienen que seguir valiendo.
- [S] Tests de TASK-043 que comparan literalmente el mensaje de bloqueo.

## Vuelta atras
- La propuesta vive fuera del repo; borrarla deshace todo.
- [V] Lo caro es el import (crea tareas y commitea; no hay comando para
  cancelar). El padre queda bloqueado y duplica criterios en el board: el
  error tiene que decir que hacer con el.

## El riesgo que mas me preocupa
Que la particion «funcione» y no sirva: import la acepta, pero cada hija nace
sin Objetivo y `plan` la rechaza; «Transversal» se vuelve una tarea
imposible. La prueba de verdad es la cadena entera: plan → import → plan de
una hija.
