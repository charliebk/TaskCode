---
id: TASK-025
titulo: "El limite de WIP mira las ramas de trabajo, no el arbol activo"
tipo: fix
sprint: 2
etiquetas: [cli, wip, git]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-025-el-limite-de-wip-mira-las-ramas-de-traba
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-06
actualizado: 2026-09-06
dependencias: []
---
## Objetivo

Que el límite de WIP de B7 **funcione**. Hoy no protege nada en el flujo
real, y lo hace en silencio.

`taskctl start` mueve la tarea a `02-en-curso` y ese movimiento se commitea
**en la rama de la tarea**. Pero `plan`, `new` e `import` devuelven el repo
a la rama base con `ensureBaseBranchReady`, y `create-<tipo>.sh` también
parte de ahí. En `develop` **ninguna tarea está nunca en `02-en-curso`**,
así que la comprobación no encuentra nada y deja abrir tantas ramas como
quieras.

El smoke test de B7 no lo detectó porque encadenaba dos `start` seguidos:
el único orden en el que el límite sí funciona.

La corrección: dejar de mirar solo el árbol de la rama activa y mirar
también **las ramas de trabajo locales sin mergear**, leyendo el `tarea.md`
de cada una en su propia rama con `git show`. Una rama de tarea viva y sin
mergear ES, literalmente, trabajo en curso.

## Criterios de aceptacion
- [x] `start` bloquea aunque la tarea que ocupa el hueco solo esté en curso en su propia rama, no en la rama activa. Reproducido con el flujo real (`plan` de por medio), no encadenando dos `start`.
- [x] Una rama ya mergeada en la rama base NO cuenta: su tarea está cerrada aunque la rama siga viva (política IECA: las ramas no se borran).
- [x] Una rama sin `tareas/` en su árbol, o con tareas de otra persona, no bloquea.
- [x] La tarea que se está arrancando nunca se bloquea a sí misma, ni siquiera al reintentar un `start` que dejó la rama creada.
- [x] El mensaje sigue nombrando la tarea que bloquea y dice en qué rama vive.
- [x] Un `tarea.md` ilegible dentro de una rama no tumba el comando entero de forma opaca.
- [x] Tests reales contra repos Git con varias ramas de verdad, incluida una mergeada y otra no.

## Resultado

Cerrada el 2026-09-06. El límite de WIP **funciona**: ahora pregunta si la
persona tiene alguna **rama de trabajo abierta**, en vez de mirar el árbol
de la rama activa, donde ninguna tarea está nunca en curso.

Tres piezas: `fs/wip-scan.ts` (nuevo), `localBranches` en `fs/git.ts`, y el
cambio de llamada en `start`. La regla y los mensajes no se tocaron: siguen
en `core/wip.ts`. Se conserva además la lectura del árbol activo, que cubre
una tarea en curso commiteada en la propia rama base.

**Verificado en el flujo real, no en el cómodo**: `new` → `plan` → `start`
de la primera → volver a `develop` → `start` de la segunda. En `develop` la
tarea figura en `01-en-diseno` y aun así el límite la detecta a través de su
rama. Esa es exactamente la prueba que le faltó a B7.

**El smoke test encontró un fallo antes que la revisión**: en un clon,
`main` solo existe como `origin/main` hasta que alguien le hace checkout, y
`merge-base --is-ancestor` reventaba tumbando el comando entero. Los repos
de los tests sí tenían las dos ramas, así que no lo veían.

**Revisión por pares: RECHAZADO** en la primera ronda, y con razón.

1. **CRÍTICO — el hotfix quedaba bloqueado por tareas ya cerradas.** Las
   referencias contra las que se decidía "mergeada" dependían del tipo: para
   un hotfix la base es `main` y la principal también, así que `develop`
   desaparecía del conjunto. Como entre release y release ninguna rama es
   antepasado de `main`, **todas** pasaban por abiertas. El revisor lo
   demostró en el repo real: **18 ramas** con base `main` frente a 1 con
   base `develop`, y reprodujo el efecto entero — `start` de un hotfix
   abortando, acusando a una tarea `terminada` de seguir abierta, y
   proponiendo un `taskctl finish` que responde "ya está terminada". Es la
   misma clase de error que esta tarea vino a arreglar: preguntar bien
   contra la referencia equivocada. Corregido: las referencias ya no
   dependen del tipo. Verificado en el repo real: 1 rama con las dos bases.
2. **IMPORTANTE** — el fail-closed pasó de cubrir el working tree a cubrir
   el historial de las 18 ramas locales. Un fichero corrupto en una rama
   ajena dejaba a todo el mundo sin poder arrancar nada, con un remedio
   inaplicable. Ahora los de otras ramas avisan; solo bloquean los de casa.
3. **IMPORTANTE** — `resolveMainBranch` metía ~2,3 s de red en cada `start`
   (medido), para un valor que se descartaba si `main` no era local, y
   contradiciendo la razón escrita para no mirar ramas remotas.
4. **MENOR ×4**, corregidos: una rama llamada `-x` tumbaba el comando
   (`--end-of-options`); el deduplicado hacía ganar la copia obsoleta del
   árbol sobre la fresca de la rama, y esa copia decide de quién es la
   tarea; el `catch` disfrazaba errores de Git de "arregla el frontmatter";
   y sin ninguna referencia local toda rama pasaba por abierta.

**Anotado sin corregir**: el coste crece con las ramas abiertas (2 ramas →
`start` en 1,6 s; 50 abiertas con tarea en curso → 8 s). La política de no
borrar ramas no lo empeora, porque las mergeadas se filtran antes de
leerlas.

**Tests**: 12 con la implementación y 8 más con las correcciones, 387 en
total. El test que reproduce el fallo original usa el flujo real y se
verificó por mutación que se pone rojo sin el arreglo; el revisor mató
además 5 de 5 mutaciones propias.
