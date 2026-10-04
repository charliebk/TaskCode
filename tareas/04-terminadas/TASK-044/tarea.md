---
id: TASK-044
titulo: "F4-T3 Particion propuesta de las tareas grandes"
tipo: feature
sprint: 5
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-044-f4-t3-particion-propuesta-de-las-tareas
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Que, cuando `plan` rechaza una tarea por demasiado grande, deje hecha la
particion en vez de solo decir «partela» (auditoria del 2026-10-03, C3).
TASK-043 ya bloquea por encima de 12 criterios; falta proponer como partirla.
Caso real: TASK-030 tenia 18 criterios en dos frentes independientes (config
y auto-commit), agrupados bajo lineas en negrita (`**C4 — ...**`,
`**C2 — ...**`) mas un grupo `**Transversal**`; costo varias rondas de
revision con peticiones de 110-160 KB. Los frentes se reconocen por los
grupos de criterios (subtitulos `###` o lineas solo en negrita), no por
interpretar el texto.

La propuesta es un fichero que `taskctl import` acepta, escrito fuera del
repo (dentro ensuciaria el workspace y el guard de import abortaria).

Fuera de alcance: partir automaticamente sin grupos (eso lo decide una
persona).

## Criterios de aceptacion
- [x] Con mas de 12 criterios o varios frentes en el Objetivo, `plan` aborta y lo explica (ajustado en el plan: los frentes se cuentan en los criterios y, con 12 o menos, avisan)
- [x] Escribe un fichero de `import` fuera del repo con una tarea por frente y lo nombra en el error
- [x] Test con una tarea de dos frentes (el caso de TASK-030)

## Resultado

Dos frentes en paralelo en la misma rama (agente para `import`, orquestador
para el resto), con las decisiones del orquestador del plan final.

- `extraerSecciones` devuelve `grupos`: abre grupo un `###` (salvo «Tras el
  cierre») o una linea sin sangrar que sea solo negrita; los criterios
  previos al primer grupo van en uno sin titulo. `criterios` no cambia.
- `src/core/particion-tarea.ts` (puro): una hija por frente, titulada
  `<ID> <grupo>`; los grupos «Transversal», «Comunes» o «General» y los
  sueltos se copian en cada hija; «Tras el cierre» se lista en el preambulo
  para reponerlo a mano; cada hija lleva Objetivo («Parte de TASK-NNN...» mas
  el Objetivo original). Avisa si alguna hija sigue pasando de 12.
- `src/fs/particion.ts`: `mkdtemp` en `os.tmpdir()`, `realpath` en los dos
  lados (nombres 8.3 de Windows), rechazo si cae dentro del repo, escritura a
  temporal + rename. Nunca lanza: si falla, el error del bloqueo lo dice sin
  nombrar un fichero inexistente.
- `plan`: con mas de 12 criterios anade al error la lista de hijas, el
  comando exacto (`taskctl import "<ruta>" --tipo <t> --sprint <n>`) y que la
  original hay que retirarla a mano. Sin frentes, explica como agrupar.
- `validarEnunciado`: 2 o mas frentes con 12 criterios o menos dan aviso.
- `import`: las lineas `> ...` bajo el `###` y antes del primer criterio son el
  Objetivo de la tarea (antes eran prosa suelta que invalidaba la entrada:
  ningun fichero valido cambia de significado).

Tests: `test/commands/particion.test.ts` (7, incluida la cadena entera
plan → import → plan de una hija contra un repo real con el caso de TASK-030:
18 criterios, 2 frentes, Transversal y Tras el cierre), mas 4 del parser y
2 de import. Suite: 974 tests, 971 en verde; los 3 rojos son los conocidos de
Windows. Mutantes (8, todos muertos): hijas sin Objetivo, Transversal como
frente, plan sin propuesta, sin grupos en negrita, sin comprobar el repo,
umbral del aviso de frentes, y dos del parser de import.

### Revision por pares (ronda 1)

Revisor independiente: **aprobada-con-correcciones** (0 CRITICO, 0
IMPORTANTE, 5 MENOR). Reprodujo la cadena con `bin/taskctl` sobre copias de
TASK-029, 030 y 032 en un repo con espacios en la ruta y `tmpdir` en nombre
8.3: las tres particiones tienen sentido (4, 2 y 3 hijas; la de TASK-030 es
la que se hizo a mano), `import` crea las 9 y el `plan` de una hija pasa. Sin
falsos positivos en las 54 tareas del repo; 50 000 ficheros aleatorios de
import dan lo mismo que antes en las entradas que ya eran validas.

- MEN-1 (no se corrige): la deduplicacion de titulos compara en minusculas,
  pero import compara el slug (sin tildes, 40 caracteres): dos frentes con un
  comienzo largo comun chocan. Recuperable: import lo avisa como omitida y
  basta renombrar en el fichero.
- MEN-2 (no se corrige): sin test para la numeracion de titulos repetidos, el
  aviso de hijas de mas de 12 y el `>` de lineas en blanco del Objetivo. El
  revisor comprobo a mano que el codigo hace lo correcto.
- MEN-3 (corregido, con test): `**Tras el cierre**` en negrita ya no es un
  frente; «Comunes a ambos» es transversal (cuenta la primera palabra); una
  linea con negrita mezclada (`**Nota** leer **antes**`) ya no abre grupo.
- MEN-4 (corregido): la skill documenta la particion propuesta y la sintaxis
  `> texto` del Objetivo en el fichero de import.
- MEN-5 (corregido): comentario de `tituloDeCabecera` en su sitio.

Desviacion del criterio 1 (frentes en los criterios; con 12 o menos avisan):
decision del orquestador documentada en el plan, pendiente de que una persona
la acepte.
