# Informe de revision — TASK-058 (ronda 2)

- Commit revisado: 604f2d1 (codigo en ea31c47; incremental desde e2f340f)
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/cli.ts, src/commands/cadena.ts |
| IMP-2 | IMPORTANTE | corregido | src/core/flujo.ts:accionPara |
| IMP-3 | IMPORTANTE | corregido | src/core/flujo.ts (faltaTrabajo), avance.md |
| IMP-4 | IMPORTANTE | corregido | skills/approve/SKILL.md |
| IMP-5 | IMPORTANTE | corregido (ver MEN-2 r2) | skills/task-workflow/avance.md |
| MEN-1 | MENOR | corregido | test/skills/fases.test.ts |
| MEN-2 | MENOR | corregido | src/commands/cadena.ts (TESTIGO_RE) |
| MEN-3 | MENOR | corregido (por lectura) | src/commands/cadena.ts:abrir |
| IMP-1 (r2) | IMPORTANTE | abierto | test/commands/cadena.test.ts, semiautomatico.test.ts, src/cli.ts:GUARDADOS_POR_CADENA |
| MEN-1 (r2) | MENOR | abierto | src/cli.ts:mainComando |
| MEN-2 (r2) | MENOR | abierto | skills/task-workflow/avance.md |
| MEN-3 (r2) | MENOR | abierto | skills/task-workflow/avance.md (tabla de modos), HELP de src/cli.ts |

### Puerta determinista y lo ejecutado

Clon temporal, `npm install && npm test` una vez: 1039 tests, 1036 verdes,
los 3 rojos conocidos de Windows. Reproduccion original de IMP-1 con el CLI:
con la cadena de A abierta, los 14 comandos guardados lanzados por B sin
testigo salen con rc=1, HEAD y rama intactos; `board`, `siguiente`,
`diagnose` y `cadena comprobar` siguen funcionando. Ciclo completo con
`--cadena` antes y despues del ID y con `--cadena=`. Bordes: testigo de cadena
cerrada, testigo viejo, sin valor, el ID tomado como testigo, vacio,
mayusculas, dos `--cadena`: todos rc=1 sin tocar nada. Wrappers reciben el
argv limpio. Worktree enlazado independiente. Automatico: approve, start y
finish preguntan; en curso y tras cambios, detener. Fuera de un repo: mismo
codigo de salida que antes (ver MEN-1 r2).

### IMP-1 (r2) — La guarda solo tiene red para «approve sin testigo»

Sobreviven: quitar del set cualquiera de los otros 13 comandos (`finish` y
`start` incluidos); aceptar cualquier testigo bien formado con la cadena
abierta (reabre IMP-1); aceptar el testigo de una cadena cerrada; quitar
`--cadena=valor`; no sacar `--cadena` del argv.

### MEN-1 (r2) — Fuera de un repo, la guarda adelanta un error interno

`pause` y `abort-merge` pasan a decir `git rev-parse --git-path
taskcode/cadena.lock fallo`. Mismo codigo de salida.

### MEN-2 (r2) — avance.md admite leer «primero cerrar» antes de `pausa`

En ese orden `pausa --cadena T` falla («ya no esta abierta») y el «no» no se
registra (reproducido).

### MEN-3 (r2) — Restos de documentacion

La tabla de modos dice que automatico encadena hasta `finish`; la ayuda y la
skill de flujo no mencionan `--cadena`; `board --escribir` no esta guardado
(impacto minimo).
