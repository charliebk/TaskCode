---
id: TASK-057
titulo: "Flujo C: fases como skills invocables en modo manual"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-057-flujo-c-fases-como-skills-invocables-en
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

Parte de TASK-055 (su plan-final es el diseno de referencia). Un comando por fase para reanudar cualquier tarea en cualquier sesion, implementado como skill invocable por la persona (la documentacion de Claude Code recomienda skills frente a commands/).

## Criterios de aceptacion
- [x] Existen las skills `new`, `board`, `plan`, `approve`, `start`, `review` y `finish`, invocables como `/taskcode-plugin:<fase>`, con frontmatter valido (`description`, `arguments`, `allowed-tools`)
- [x] Cada skill de fase ejecuta su subcomando de `taskctl` y el trabajo de agentes de su fase (roles y unificador en plan, revisor independiente en review, segunda opinion si `revision_codex` es true)
- [x] Cada skill de fase llama a `taskctl siguiente` al terminar y, en modo manual, termina nombrando la skill de la siguiente fase sin encadenar nada; un test ata cada skill al subcomando que nombra
- [x] La skill de plan conserva la seleccion del mejor skill (`skills_recomendados`) y la de review el enrutado de revisor por dominio
- [x] Las skills de fase hacen `cd` a la raiz del repo antes de llamar a `taskctl`
- [x] Test de marcas propio para las skills de fase: no mencionan rutas ni documentos internos de este repo, con una lista de marcas justificada que si permite nombrar `taskctl`
- [x] `task-workflow/SKILL.md` describe los tres modos y las skills de fase

## Resultado

- Siete skills en `skills/<fase>/SKILL.md` (`new`, `board`, `plan`,
  `approve`, `start`, `review`, `finish`), invocables como
  `/taskcode-plugin:<fase> TASK-NNN`. Guiones cortos (1-2 KB): situarse en la
  raiz, su `taskctl`, el trabajo de agentes de la fase y `taskctl siguiente`.
  `plan` lanza roles y unificador (o el rol unico, o redacta sin roles) y deja
  anotados los `skills_recomendados`; `review` lanza un revisor independiente
  por cada peticion de la ronda (el enrutado por dominio ya lo hace el CLI),
  escribe veredictos con `taskctl veredicto` y pide la segunda opinion si
  toca; `approve` es el checkpoint humano y registra el «no» con
  `taskctl pausa`.
- `skills/task-workflow/avance.md`: la seccion compartida. Modos, tabla fase
  → skill (`veredicto`, `codex-review` y `veredicto-codex` → `review`) y que
  hacer segun `accion`. En esta entrega solo `detener` tiene pasos propios;
  `preguntar` y `continuar` se tratan como `detener` (fallo seguro) hasta D y
  E.
- `task-workflow/SKILL.md`: seccion corta de fases y modos, y `siguiente`,
  `pausa` y `--decidido-por` en la lista de comandos. Para no pasar del limite
  de 500 lineas del cuerpo, la seccion de sincronizacion (~95 lineas) paso a
  `task-workflow/sincronizacion.md`, cargada bajo demanda (adelanta parte de
  F6-T3, TASK-048).
- `FASES_SIGUIENTE` exportado de `core/flujo.ts`: el test comprueba que cada
  fase que puede devolver `siguiente` tiene skill asignada.

Divergencias con los criterios, documentadas: el criterio 1 nombra
`arguments` en el frontmatter, pero el spec portable que exige la suite (y
que cumple la skill de flujo) no lo admite; el argumento llega en
`$ARGUMENTS` sin declararlo. Las descripciones nombran `taskctl` y su forma
de invocacion para que no se disparen con un «plan» suelto.

Tests: `test/skills/fases.test.ts` (6): existencia y frontmatter portable,
`name` = directorio, descripciones cortas y especificas, cada skill ata su
subcomando + `taskctl siguiente` + avance + raiz del repo, cada fase de
`FASES_SIGUIENTE` con fila y skill existente en avance.md, marcas propias (se
permiten `taskctl`, `tareas/`, `plan-final.md`, el prefijo `taskcode-plugin`
y `.taskcode/`, que son la interfaz del plugin), y approve con su pregunta y
`pausa`. Mutantes: una skill sin `taskctl siguiente` y avance sin la fila de
`veredicto-codex`, los dos rojos. `claude plugin validate`: pasa.
Suite: 1024 tests, 1021 en verde (los 3 rojos conocidos de Windows).

Pendiente: smoke dentro de una sesion de Claude Code. `claude -p
--plugin-dir` no pudo autenticarse en este entorno («OAuth session
expired»); queda para la release, con las skills cargadas desde el plugin
instalado.
