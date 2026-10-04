# Brainstorm — TASK-040, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`

## Enfoque
`review` gana un modo incremental en el mismo comando. Con la tarea en
`en-revision` y el ultimo veredicto pidiendo otra ronda, la base del diff pasa
a ser el commit revisado en la ronda N, leido de la linea `- Commit revisado
(HEAD):` de `peticion-revision-N*.md` (la escribe solo el CLI; el informe lo
edita el revisor). No se escribe `ultimo_commit_revisado` (§16.3; hoy es un
campo muerto: solo `new.ts` lo pone a null). Se reutilizan exclusiones,
clasificacion por dominio, `wx`, movimiento y autocommit.

## Piezas y limites
- `src/core/informe-revision.ts` (nuevo, puro): mueve `veredictoAprobado` (se
  reexporta desde finish.ts) y anade `veredictoDe`, `commitRevisadoDe`,
  `hallazgosNoCerrados`.
- `src/fs/rondas.ts`: `informesDeUltimaRonda` tambien con un regex de peticiones.
- `src/core/state-machine.ts`: `TransitionContext.veredictoRondaAnterior` lo
  calcula quien llama; textos de error corregidos (PENDIENTE manda a `taskctl
  veredicto`; `start` en `en-revision` manda a `review`).
- `src/commands/review.ts`: `resolverRango()` → `{ desde, incremental, abiertos }`;
  plantillas reciben `desde` en vez de `${baseBranch}..HEAD`; datos nuevos en
  `ExtrasPeticion`.
- Fragmentacion en N+1: `clasificarPorDominio` sobre los incluidos del delta.
- Hallazgos en N+1: todos los no cerrados de todos los informes de la ronda N,
  con su informe de origen, en cada peticion.

## Script de update en N+1: no se ejecuta
Si se ejecutara, el merge de develop entraria en el delta como si fuera
correccion. En modo incremental se omiten `runGitflowScript` e
`isAncestor(base, HEAD)`; se comprueba `isAncestor(desde, HEAD)`. La base la
integra `finish`. Los commits de peticion y veredicto caen en `tareas/`,
excluido.

## Parseo tolerante de la tabla
Cabecera por nombre de columna (ID, Estado, Fichero), primera tabla bajo
`## Hallazgos`; sin `\r`, sin fila separadora, celdas sin `*_`` ni tildes; se
descarta la fila de ejemplo `(ej.`; cerrado = Estado `corregido` o `aceptado`,
cualquier otro valor cuenta como no cerrado. Sin tabla: «tabla no encontrada,
ver <ruta>».

## Desacuerdos previstos
- Criterio 2: no se escribe `ultimo_commit_revisado`; se reformula como «la
  ronda N+1 embebe `<commit de la ronda N>..HEAD`».
- Fuente del commit: la peticion, no el informe.

## Suposiciones no verificadas
`tareas/**` en los excluidos por defecto; `finish` integra la base;
«aprobada con correcciones» aprueba en finish y a la vez permite otra ronda
(cuestion de dominio); con la ronda N fragmentada, N+1 solo si todos los
informes tienen veredicto final y alguno no es `aprobada` a secas.
