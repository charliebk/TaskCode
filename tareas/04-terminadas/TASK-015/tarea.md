---
id: TASK-015
titulo: "Límite de trabajo en curso por persona"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-015-limite-de-trabajo-en-curso-por-persona
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-009]
---
## Objetivo

Que una persona no pueda tener dos ramas de trabajo abiertas a la vez, para
que no acabe programando el código de una tarea dentro de la rama Git de
otra.

La decisión #13 (resuelta el 2026-09-05) fija el alcance, y no coincide con
ninguna de las dos opciones que planteaba la §8.2: **un único límite, y solo
sobre la ejecución**.

- En diseño **no hay tope**. `taskctl plan` no comprueba nada: se pueden
  tener varias tareas en `01-en-diseno/`.
- `taskctl start` aborta si la persona asignada ya tiene otra tarea en
  `02-en-curso/` **o** en `03-en-revision/`. El hueco no se libera al pasar a
  revisión: la rama sigue viva y sin mergear hasta `taskctl finish`, y es ahí
  donde se commitean las correcciones de los hallazgos.

Diverge de la §8.2, que describe dos límites independientes y uno de ellos
sobre el diseño. La metodología está congelada: se documenta la divergencia,
no se reescribe.

## Criterios de aceptacion
- [x] Comprueba el límite en el momento en que se fija `asignado_a`, con el alcance que decida el punto 13 de la sección 14 de la metodología (límite único o dos límites independientes).
- [x] El mensaje de error nombra explícitamente la tarea que está bloqueando, igual que el resto de errores de taskctl.
- [x] Depende de que `plan` y `start` acepten el flag `--asignado-a`, que hoy no existe.
- [x] Tests que cubren el límite alcanzado, el límite libre y la reasignación.

## Resultado

Cerrada el 2026-09-05. Gestionada de punta a punta con la propia
herramienta (plan con `--asignado-a`, approve, start, review, finish), y
estrenando el flag que acababa de añadir B6.

**Lo implementado.** Un único límite y solo sobre la ejecución, tal como
fijó la decisión #13: `taskctl plan` no comprueba nada y `taskctl start`
aborta si la persona asignada ya tiene otra tarea en `02-en-curso` o en
`03-en-revision`. Tres piezas: `core/wip.ts` (la regla y los mensajes,
puro), `listTareasEnEstados` en `fs/task-store.ts` (lectura acotada a las
carpetas que importan, deduplicada por ID) y la comprobación en
`commands/start.ts`, antes de tocar Git.

**Divergencia con la metodología, documentada en HALLAZGOS.md**: la §8.2
describe dos límites independientes y uno de ellos sobre el diseño. Es la
mayor divergencia que acumula el proyecto — un límite entero que no se
implementa — y por eso queda por escrito en vez de reescribir la
metodología, que está congelada.

**Revisión por pares** (agente independiente, clon propio, suite
reproducida, 16 casos de ataque y 8 mutaciones del código fuente):
APROBADO CON CORRECCIONES. 1 IMPORTANTE y 6 MENORES.

Corregidos (1 importante + 5 menores):

1. **IMPORTANTE** — el plan prometía documentar la divergencia con la §8.2
   en HALLAZGOS.md y el commit no lo hacía. Sin esa entrada, el siguiente
   lector concluye que hay un bug donde hay una decisión.
2. Un error de disco al escanear `tareas/` escapaba como `Error` crudo y
   el usuario lo veía como "taskctl no pudo arrancar", que es falso.
   Misma clase de bug ya corregida en TASK-010 y TASK-014.
3. El mensaje nombraba la carpeta que declaraba el frontmatter, no aquella
   en la que estaba la tarea: con las dos incoherentes, mandaba al usuario
   a `04-terminadas`, donde no hay nada. Se seleccionaba por carpeta y se
   describía por estado. Ahora `listTareasEnEstados` devuelve también la
   carpeta real (`TareaUbicada`).
4. El límite se burlaba con un `asignado_a` entrecomillado con espacios: el
   flag recorta, pero el frontmatter solo recorta lo no entrecomillado.
5. `asignado_a: ""` se trataba como una persona, así que dos tareas "sin
   asignar en vacío" se bloqueaban entre sí (y el mensaje salía sin
   nombre) mientras que dos con `null` no.
6. El mensaje proponía `taskctl finish`, que todavía falla si la tarea no
   ha pasado una revisión aprobada — justo el caso más doloroso.

Documentado sin corregir (1 menor):

7. **El límite es opt-in y la identidad es la cadena exacta.** Solo actúa
   sobre tareas con `asignado_a` no vacío, y `new`/`import` las crean con
   `null`: más de la mitad de las tareas de este repo caen hoy en el
   camino que no comprueba nada. Y `carlos` (esta tarea) y `charlie.bk`
   (TASK-004 a TASK-012) son la misma persona con dos grafías. No se
   corrige porque normalizar identidades exige decidir antes qué es una
   persona en este sistema: es material del item C4
   (`.taskcode/config.yml`), no de esta tarea.

**Tests**: 30 nuevos con la implementación y 8 más con las correcciones,
345 en total. Contra repos Git temporales reales. El revisor verificó por
mutación que los tests matan los cambios de comportamiento que dicen
cubrir. Smoke test de punta a punta sobre un clon limpio: bloquea con la
bloqueante en curso, bloquea con ella en revisión, y reasignar desbloquea.
