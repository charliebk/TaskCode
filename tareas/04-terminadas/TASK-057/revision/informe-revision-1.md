# Informe de revision — TASK-057 (ronda 1)

- Commit revisado: 2d6af8dabef1677385dc571fe9535b6b0ca08a5d (y b1aaf4f, que admite CRLF en el test)
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | skills/plan/SKILL.md:16 (paso 2) |
| IMP-2 | IMPORTANTE | abierto | skills/review/SKILL.md:21,32 + skills/task-workflow/avance.md |
| MEN-1 | MENOR | abierto | skills/plan/SKILL.md:19-27 + skills/approve/SKILL.md:19-22 |
| MEN-2 | MENOR | abierto | skills/review/SKILL.md:26-31 |
| MEN-3 | MENOR | abierto | skills/review/SKILL.md:32 |
| MEN-4 | MENOR | abierto | skills/finish/SKILL.md:4 (allowed-tools) |
| MEN-5 | MENOR | abierto | test/skills/fases.test.ts:123-136 |

### Puerta determinista y lo ejecutado

Clon temporal, `npm install && npm test` una vez: 1024 tests, 1021 verdes,
los 3 rojos conocidos de Windows; los 6 de `fases.test.js` pasan; `dist`
sincronizado; `claude plugin validate` del plugin y del marketplace, pasan.
Ciclo completo con `node bin/taskctl` siguiendo las skills (new → plan → pausa
→ approve → start → review → veredicto → finish → terminada): funciona como
dicen. `pausa` deja su fila y su commit sin cambiar el estado. Ronda
fragmentada (.java, .vue, .cs → tres peticiones), ronda 2 con un solo
revisor, codex con stub. Flags citados, existentes. `sincronizacion.md`
identica a la seccion quitada; enlaces resuelven. b1aaf4f correcto (el
checkout de Windows deja los SKILL.md en CRLF).

### IMP-1 — `/taskcode-plugin:plan` para reanudar abre una re-planificacion falsa y pierde el brainstorm

El paso 2 ejecuta `taskctl plan` siempre. Con la tarea en diseno y el plan
sin redactar, `siguiente` da `fase: plan, comando: null` y `avance.md` manda a
`/taskcode-plugin:plan`, que vuelve a ejecutar `taskctl plan`: abre la ronda
2, que no relanza los roles y pide al unificador procesar salidas vacias con
un feedback que nadie dio; deja dos filas `plan` en el registro. Es el caso
normal de reanudar en otra sesion.

### IMP-2 — En `veredicto-codex`, la skill de review vuelve a lanzar Codex

El paso 2 manda `codex-review` y `veredicto-codex` al paso 5, que ejecuta
`taskctl codex-review` sin condicion: con un informe de Codex PENDIENTE,
pide otra ronda sobre el mismo codigo (reproducido con un stub: informes 1 y
2, los dos pendientes). Igual tras un `cambios-solicitados` de Codex, sin
corregir nada. Bucle y garantia de `flujo.ts` («lo decide una persona») rota.

### MEN-1 — La re-planificacion tras un «no» no esta guiada y el feedback no sobrevive a la sesion

La skill `plan` solo describe una primera ronda; el feedback que recoge
`approve` no se escribe en ningun fichero.

### MEN-2 — Volcar el informe puede borrar la linea `- Veredicto:`; `--informe` es ambiguo

Sin la linea, `taskctl veredicto` falla y `avance.md` prohibe editar a mano.
`--informe` exige el nombre de fichero completo.

### MEN-3 — Codex degradado no esta cubierto

Sin codex, `codex-review` avisa y sale 0 sin informe; `siguiente` sigue en
`codex-review` y la skill remite a si misma.

### MEN-4 — `finish` pide editar y commitear sin declararlo en `allowed-tools`

### MEN-5 — El test no detecta una fase asignada a la skill equivocada ni un `detener` que encadena

Sobreviven: fila `approve` → `finish` (M2), `detener` cambiado a «encadenar»
(M12), y «Si un taskctl falla, reintentar» (M10, texto libre).
