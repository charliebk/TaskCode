# Plan — TASK-036: Veredicto con un comando e informe estructurado

(Un solo rol, arquitectura, por C4: sin unificador. Valido el diseno del
orquestador y anadio cinco correcciones, todas incorporadas.)

## Enfoque propuesto

- **Comando** `taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados> [--informe <nombre>] [--push]`
  (`src/commands/veredicto.ts`). Sustituye TODAS las lineas `- Veredicto:` del
  informe por una unica linea canonica, en la posicion de la primera; sin
  ninguna, error. Con varios informes en la ronda de mayor N (revision
  fragmentada) exige `--informe`. `autoCommit` con
  `chore(TASK-NNN): veredicto ronda N (<valor>)`.
- **Helper unico** (arquitectura a): `informesDeUltimaRonda(dir, re)` en
  `src/fs/rondas.ts`, devuelve `{ ronda, nombres }` y absorbe ENOENT y
  ENOTDIR como `ultimaRonda`. `finish` y `codex-review` lo usan y se borra la
  copia de `codex-review`.
- **Regex unica** (b): `INFORME_REVISION_RE` exportada desde `review.ts`;
  `finish`, `codex-review` y `veredicto` la importan.
- **Estado** (c): accion `veredicto` en `core/state-machine.ts`, permitida solo
  en `en-revision`, mismo patron que `codex-review` (no cambia el estado).
- **Parser** (e): `veredictoAprobado` recorta `*`, `_` y comillas invertidas
  del valor antes de `^aprobada\b`. Una sola implementacion: `codex-review` la
  hereda.
- **Scaffold** (d): `## Hallazgos` ya existe; se amplia con la tabla
  `| ID | Severidad | Estado | Fichero |` y una fila de ejemplo, y la linea
  PENDIENTE remite a `taskctl veredicto`. Igual en `codexInformeTemplate`.

## Riesgos aceptados y que los contiene

- El gate de `finish` con `revision/` que es un fichero pasa de lanzar a «no
  aprobada»: fail-closed, se acepta.
- Recortar el enfasis no afloja la regla: `^aprobada\b` sigue anclado; la tabla
  de casos del parser lo vigila.

## Plan de pruebas

- `rondas`: sin directorio, un informe, varios del mismo N con otros de N
  menor, ruta que es fichero.
- Parser: pasan `**aprobada**`, `_aprobada_`, `` `aprobada` ``,
  `**aprobada con correcciones**`; fallan `no aprobada`, `**no aprobada**`,
  `**APROBADO**`, `**cambios-solicitados**` y la linea PENDIENTE nueva.
- Repo real: el comando deja una linea canonica y su commit, y `finish` ya no
  bloquea por el veredicto; ronda fragmentada sin `--informe` aborta sin
  escribir y con `--informe` toca solo ese fichero; fuera de `en-revision` y
  sin linea de veredicto, error sin commit.
- Los tests existentes de `finish` y `codex-review` pasan sin cambios.

## Lo que necesita decision de una persona

Resuelto por el orquestador con la propuesta del rol: sin `--codex` en esta
tarea (el informe de Codex queda fuera de A5) y un informe por llamada en una
ronda fragmentada (cada revisor firma el suyo).
