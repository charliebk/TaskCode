---
id: TASK-057
titulo: "Flujo C: fases como skills invocables en modo manual"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: en-revision
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

### Revision por pares (ronda 1)

Revisor independiente: **cambios-solicitados** (2 IMPORTANTE, 5 MENOR). Hizo
el ciclo entero con `node bin/taskctl` siguiendo las skills, la ronda
fragmentada, la ronda 2 y Codex con un stub.

- IMP-1 (corregido): `plan` ejecutaba siempre `taskctl plan`; al reanudar con
  la ronda abierta, abria una re-planificacion falsa sin roles. Ahora consulta
  `siguiente` primero: `planificada` → `taskctl plan`; en diseno con la ronda
  abierta → no ejecuta `taskctl plan` y retoma los roles con salida vacia y el
  unificador; re-planificar solo cuando la persona lo pidio.
- IMP-2 (corregido): en `veredicto-codex`, `review` relanzaba Codex. Ahora
  cada fase hace solo lo suyo: `veredicto-codex` no lanza nada y la persona
  dicta el veredicto (la skill solo lo escribe tal cual); tras cambios de
  Codex, se corrige antes de relanzarlo. La fila de `avance.md` lo dice.
- MEN-1 (corregido): el «no» de `approve` se escribe en `plan-final.md`
  (`## Cambios pedidos por la persona`), se commitea y se registra con
  `pausa`; `plan` tiene un paso de re-planificacion que lo lee.
- MEN-2 (corregido): volcar el informe conservando la cabecera y su linea
  `- Veredicto:`; `--informe` con el nombre de fichero completo.
- MEN-3 (corregido): si `codex-review` degrada, se muestra el aviso y no se
  reintenta; decide la persona.
- MEN-4 (corregido): `allowed-tools` de `finish` (y de `approve`, que ahora
  tambien escribe y commitea) cubre editar y commitear.
- MEN-5 (corregido en parte): mapa fase → skill fijo en el test y el bloque
  de `detener` debe decir «no encadenar nada»; M2 y M12 mueren. Test nuevo
  que fija las correcciones de IMP-1 e IMP-2 en el texto. Sin corregir M10
  («si falla, reintentar»): es texto libre, y fijar cada frase en un test
  convierte la skill en un documento congelado.

Suite: 1025 tests, 1022 en verde (los 3 rojos conocidos de Windows).

### Revision por pares (ronda 2)

Revisor independiente: **cambios-solicitados**. Confirmo cerradas IMP-1,
IMP-2 y MEN-2..5 siguiendo las skills con el CLI real (reanudar con 2, 1 y 0
roles; «no» y re-planificacion con 2 roles; `review` en cada fase con Codex,
incluido degradado). Hallazgos nuevos:

- IMP-3 (corregido): al re-planificar una tarea de un rol, la skill mandaba
  lanzar el unificador con `peticion-unificador-N.md`, que no existe (el CLI
  crea `peticion-plan-N.md`). Regresion de la correccion de MEN-1. Ahora el
  paso de re-planificacion lanza lo que haya para la ronda: unificador o el
  agente del rol unico, volcando su respuesta.
- MEN-6 (corregido): la seccion de cambios lleva estado. Sin marca → se
  re-planifica y se marca `(pendientes, ronda N+1)` con su commit; con esa
  marca → se retoma la ronda sin volver a ejecutar `taskctl plan`; el plan
  nuevo la deja como `(incorporados en la ronda K)`. Un segundo «no» anade
  otra seccion sin marca. «Sin rellenar» en lugar de «vacia».
- MEN-7 (corregido en parte): asercion de que el paso del veredicto de Codex
  no lanza `codex-review` (M2) y de que approve commitea antes de `pausa`
  (M3); los dos mutantes mueren, igual que los de IMP-3 y MEN-6. Sin
  corregir M4, M6, M7, M8 y M9: texto libre, mismo motivo que M10.

Suite: 1025 tests, 1022 en verde (los 3 rojos conocidos de Windows).

### Revision por pares (ronda 3)

Revisor independiente: **aprobada-con-correcciones**. IMP-3 cerrado siguiendo
`plan` y `approve` con 0, 1 y 2 roles (cortes de sesion, segundo «no»,
`approve` final). Tres MENOR, corregidos sin abrir ronda 4:

- MEN-8: la marca `(pendientes, ronda K)` se commitea antes de `taskctl
  plan`; un corte en medio ya no abre dos rondas.
- MEN-9: el caso sin roles de la re-planificacion se reescribe a mano, como
  en el paso 3.
- MEN-10: aserciones sobre lo que se hace con cada marca (no solo que exista
  la cadena); los mutantes MC y ME mueren. Corrige tambien la frase de la
  ronda 2 que decia que morian «los de IMP-3 y MEN-6»: entonces solo morian
  las variantes que borraban la cadena. MH (sin seccion se re-planifica) y
  los M4-M10 de texto libre quedan sin red, por el motivo ya documentado.

El test normaliza CRLF: verificado con las skills en LF y en CRLF.
Suite final: 1025 tests, 1022 en verde (los 3 rojos conocidos de Windows).
