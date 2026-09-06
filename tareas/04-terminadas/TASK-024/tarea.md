---
id: TASK-024
titulo: "asignado_a por defecto desde la identidad Git"
tipo: feature
sprint: 2
etiquetas: [cli, identidad]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-024-asignado-a-por-defecto-desde-la-identida
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-06
dependencias: []
---
## Objetivo

Que `asignado_a` salga de la identidad Git de quien ejecuta el comando, en
vez de quedarse en `null` salvo que alguien se acuerde de pasar
`--asignado-a`.

El motivo es concreto: **el límite de WIP de B7 es hoy opt-in**. Solo actúa
sobre tareas con `asignado_a` no vacío, y `new` e `import` las crean con
`null`, así que más de la mitad de las tareas de este repo caen en el
camino que no comprueba nada. Y la identidad es la cadena exacta: hoy
conviven `charlie.bk` y `carlos` para la misma persona.

Decisión de Carlos (2026-09-05): la identidad es **`git config user.email`**.

## Criterios de aceptacion
- [x] Sin `--asignado-a` y sin `asignado_a` previo, `plan` y `start` asignan la tarea a `git config user.email`.
- [x] Sin `--asignado-a` pero con `asignado_a` ya puesto, se **conserva**: ejecutar un comando sobre la tarea de otra persona no se la queda.
- [x] `--asignado-a` sigue mandando sobre la identidad Git: es la vía para asignar a otra persona y la salida que ofrece el error de WIP.
- [x] Sin identidad Git configurada, el comportamiento es el de hoy (`null`), sin romper nada.
- [x] Las 10 tareas existentes con `charlie.bk` o `carlos` migradas a `charlie.bk@gmail.com`.
- [x] `taskctl board` sigue legible con la columna `Asignado` llena de correos.
- [x] Tests reales: identidad presente, ausente, flag que gana, y asignado previo que se respeta.

## Resultado

Cerrada el 2026-09-05. `asignado_a` sale ahora de `git config user.email`
cuando no hay nada mejor, con esta precedencia (`resolverAsignado`):

    --asignado-a  >  asignado_a previo  >  git config user.email  >  null

Que el previo gane a la identidad es lo que evita el robo silencioso de
tareas ajenas. Migradas 12 tareas (las 9 de `charlie.bk`, la de `carlos` y
las dos terminadas que seguían sin asignar) a `charlie.bk@gmail.com`.

**Lo que esta tarea NO consigue, pese a lo que decía su plan.** Se
justificó como "el límite de WIP deja de ser opt-in". Es falso, y el smoke
test lo destapó antes de la revisión: rellenar `asignado_a` es condición
**necesaria pero no suficiente**. El límite sigue sin dispararse en el
flujo real porque mira el árbol de la rama activa, y `plan`/`new` devuelven
el repo a `develop`, donde ninguna tarea está nunca en `02-en-curso`. Eso
es un fallo de B7 y se corrige en una tarea aparte, ya decidida.

**Revisión por pares** (agente independiente, 3 clones, ataques E2E con dos
identidades, auditoría de los 24 `asignado_a` del árbol y 5 mutaciones):
APROBADO CON CORRECCIONES. 1 CRÍTICO, 4 IMPORTANTES y 3 MENORES, **todos
corregidos**.

1. **CRÍTICO — la identidad Git no pasaba por ninguna validación.** El flag
   rechaza saltos de línea desde B6, con el comentario explícito de que
   romperían el frontmatter; la identidad entraba por otra puerta. Un
   `user.email` con un salto de línea **inyectaba una clave que pisaba
   `estado`**: la tarea quedaba físicamente en `01-en-diseno` pero
   declarándose terminada, salía bajo "Terminadas" en el board, y quedaba
   ladrillada — ningún comando aceptaba ya ese estado. Exit 0, sin aviso.
   La regla se extrajo a `motivoValorInvalido` y la identidad pasa ahora
   por `identidadUsable`, que aplica las mismas comprobaciones; una
   identidad inválida no aborta (quien ejecuta no ha pedido nada raro): se
   ignora y se avisa.
2. **IMPORTANTE** — el tope de 64 caracteres también se saltaba por ahí.
3. **IMPORTANTE** — `docs/BOARD.md` se quedó con las filas viejas pese a
   que el plan se comprometía a regenerarlo: reabría la divergencia que
   cerró B5.
4. **IMPORTANTE** — `plan` marca al planificador y `start` no avisaba: si
   Carlos planifica y Ana ejecuta, el trabajo queda a nombre de Carlos y el
   límite se comprueba contra él. La regla se conserva (quedarse una tarea
   ajena debe ser explícito), pero ahora `start` lo dice en voz alta.
5. **IMPORTANTE** — el mensaje que explicaba cómo desasignar había dejado
   de ser cierto: editar `asignado_a: null` a mano ya no basta, porque el
   siguiente comando lo vuelve a rellenar.
6. **MENOR** ×2 — dos comentarios que afirmaban cosas falsas tras el
   cambio, y **MENOR** — la migración dejaba TASK-013 y TASK-014 sin
   asignar mientras migraba TASK-015, del mismo autor y carpeta.

El revisor también verificó lo que más importaba comprobar: que los dos
tests que cambiaron de expectativa se adaptaron **con honestidad** —
conservan íntegras sus aserciones y solo añaden el vaciado de `user.email`
para seguir cubriendo el camino sin identidad— y no escondiendo una
regresión. Y que el test llamado "el límite de WIP ya NO es opt-in"
aseveraba una protección inexistente en producción: renombrado y
documentado, para que no sirva de coartada al arreglo pendiente.

**Tests**: 14 con la implementación y 10 más con las correcciones, 369 en
total. Smoke test con dos identidades distintas sobre clones limpios.
