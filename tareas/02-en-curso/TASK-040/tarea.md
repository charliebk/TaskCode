---
id: TASK-040
titulo: "F3-T1 taskctl review para la ronda 2 y siguientes"
tipo: feature
sprint: 4
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-040-f3-t1-taskctl-review-para-la-ronda-2-y-s
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

Que la ronda 2 y siguientes de una revision las genere `taskctl review` y no
un agente a mano (auditoria del 2026-10-03, A2 y D3). Hoy `review` solo existe
desde `en-curso`: con la tarea en `en-revision` los errores mandan a `start`,
que manda a `plan`, en circulo; y las peticiones de ronda N de TASK-017, 018,
020, 022, 033 y 038 se escribieron a mano. La ronda N+1 debe embeber solo el
diff desde el commit revisado en la ronda anterior (con las exclusiones de
`excluir_de_revision`) y listar los hallazgos no cerrados de la tabla del
informe anterior (`| ID | Severidad | Estado | Fichero |`, TASK-036).

Conflicto a resolver en el diseno: la §16.3 dice que `ultimo_commit_revisado`
se actualiza cuando una revision TERMINA aprobada, no al pedirla, y el
criterio 2 pide escribirlo en cada ronda. El commit revisado de cada ronda ya
consta en su informe (`- Commit revisado:`).

## Criterios de aceptacion
- [x] Transicion `en-revision -> en-revision` permitida solo si la ultima ronda dice `cambios-solicitados` (no `aprobada con correcciones`: ver Resultado)
- [x] La ronda N+1 embebe `<commit revisado en la ronda N>..HEAD` con las exclusiones de F1-T1 (sin escribir `ultimo_commit_revisado`: ver Resultado)
- [x] La peticion lista los hallazgos no cerrados de la tabla del informe anterior
- [x] Los mensajes de error dejan de mandar de `start` a `plan` en circulo
- [x] Test que encadena ronda 1, cambios y ronda 2 contra un repo real

## Resultado

**Implementado.** `taskctl review` sobre una tarea en `en-revision` genera la
ronda N+1 si la ronda N (todos sus informes, si estaba fragmentada) tiene
veredicto y alguno es `cambios-solicitados`:
- el diff va desde el commit revisado en la ronda N, leido de la linea
  `- Commit revisado (HEAD):` de su peticion (solo la escribe el CLI); si no
  consta o ya no es antepasado de HEAD (rebase, amend, gc), diff completo
  desde la base con un aviso en stderr y en el resultado;
- no ejecuta el update de Git-Flow (el merge de la base entraria en el delta
  como si fuera una correccion; la base la integra `finish`) y exige estar en
  la rama de la tarea;
- la peticion lista los hallazgos no cerrados de las tablas de todos los
  informes de la ronda N, con su informe de origen, y distingue «tabla ausente
  o ilegible» de «0 abiertos»;
- si una escritura de la ronda falla a mitad, se borran los ficheros de esa
  invocacion (sin esto la tarea quedaba sin salida).
Ronda aprobada → manda a `finish`; PENDIENTE o veredicto desconocido → manda a
`taskctl veredicto`; `start` sobre una tarea en revision → manda a `review`
(se acaba el circulo review → start → plan). Modulo puro nuevo
`core/informe-revision.ts` (`veredictoDe`, `veredictoDeRonda`,
`commitRevisadoDe`, `hallazgosNoCerrados`); `veredictoAprobado` se mueve ahi y
`finish.ts` lo reexporta. La skill lo documenta.

**Divergencias de los criterios, decididas por el orquestador** (plan, seccion
«Resuelto por el orquestador»):
- No se escribe `ultimo_commit_revisado`: la §16.3 lo reserva para cuando la
  revision termina aprobada, y el commit de cada ronda ya consta en su peticion.
- `aprobada con correcciones` no abre ronda N+1: por la politica A3, una ronda
  sin CRITICO ni IMPORTANTE cierra, y abrir otra bloquearia una tarea cerrable.

**Riesgo aceptado, para otra tarea:** con `revision_codex: true`, un informe de
Codex aprobado en una ronda anterior sigue valiendo en `finish` aunque haya una
ronda primaria posterior.

**Pruebas.** `test/commands/review-incremental.test.ts` (7): la cadena ronda 1
→ `cambios-solicitados` → correccion → ronda 2 (solo el delta, sin lo de
develop, con IMP-1 abierto y sin MEN-1 corregido, arbol limpio); ronda aprobada
(tambien «con correcciones») → `finish`; PENDIENTE y desconocido → `veredicto`;
commit reescrito → diff completo con aviso; `start` → `review`; fallo de
escritura (colision de mayusculas en NTFS) no deja la ronda a medias; parsers
con vocabulario historico, tabla ausente, fila de ejemplo y CRLF. 5 mutantes
(guarda que acepte aprobada, sin `isAncestor`, update en N+1, corregido como
abierto, sin limpieza): los 5 en rojo. Tests de `review`, `finish`, `start`,
`veredicto`, `codex-review`, maquina de estados y `main`: 142/142 sin tocar
expectativas.
