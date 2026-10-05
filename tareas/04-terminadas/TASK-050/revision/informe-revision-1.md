# Informe de revision — TASK-050 (ronda 1)

- Commit revisado: 87f27c6e1cd03ea0baa001e237558432a6f84bf5
- Revisor: code-quality-reviewer (agente general-purpose independiente, modelo sonnet; clon propio, ya borrado)
- Veredicto: cambios-solicitados

## Resumen

Implementacion correcta; los seis puntos pedidos se reproducen. Sin CRITICOS.
El veredicto se debe a que el criterio 3 (medicion de cobertura anotada) y
los tiempos del plan de pruebas no constan en ningun fichero.

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | tareas/.../TASK-050/tarea.md (criterio 3, plan de pruebas) |
| MENOR-1 | MENOR | abierto (documentar) | test/commands/{start,automatico}.test.ts, plan-final.md |
| MENOR-2 | MENOR | abierto | test/commands/plan-brainstorm.test.ts:18-19, test/commands/automatico.test.ts:9-10 |
| MENOR-3 | MENOR | abierto (aceptable) | test/helpers/repo-plantilla.ts, test/helpers/repo-plantilla.test.ts |

### IMPORTANTE-1 — Criterio 3 sin cumplir: no hay medicion de cobertura ni decision sobre `test:cov`

`grep -rn "test:cov"` solo encuentra el texto de los criterios. `npm test`
conserva `--experimental-test-coverage` sin que conste por que, y tampoco
estan anotados los tiempos antes/despues de los 5 ficheros. Sugerencia:
anotar las cifras con y sin cobertura y la decision (umbral del 10 %) en el
`Resultado`, mas los tiempos de los 5 ficheros.

### MENOR-1 — La ganancia real de la plantilla es pequena y no se documenta

Cada fichero solo, develop contra rama, misma maquina, en serie, 0 fallos:

| fichero | develop | rama |
|---|---|---|
| start | 126 s | 128 s |
| finish | 71 s | 64 s |
| review | 83 s | 69 s |
| plan-brainstorm | 79 s | 60 s |
| automatico | 136 s | 135 s |
| **total** | **495 s** | **456 s** (~8 %) |

`npm test` completo: 513 s, igual que la partida. El tiempo lo dominan los
procesos `taskctl`/`git` de cada test, no el montaje del repo base. No
incumple ningun criterio; la ganancia util es `test:rapido`. Anotarlo.

### MENOR-2 — Imports que ya no se usan tras la migracion

`plan-brainstorm.test.ts:18-19` (`mkdtemp`, `tmpdir`, `rm`) y
`automatico.test.ts:9-10` (`mkdtemp`, `rm`, `tmpdir`) solo aparecen en el
import. `tsc` no se queja (sin `noUnusedLocals`). Quitarlos.

### MENOR-3 — Dos ramas del helper sin test que se ponga rojo

La limpieza de la plantilla en `process.once('exit')` y el `rm` del
directorio cuando falla `preparar` no los detecta ningun test (deducido: nada
inspecciona esos directorios). Tras la suite no quedaba ningun `taskctl-*` en
`%TEMP%`. Aceptable tal cual.

## Lo que se ejecuto (sin hallazgos)

1. `test:rapido`: 357/357 en 12,9 s (con `tsc`). Hook `--require` que registra
   `spawn/spawnSync/exec*/fork` (validado con un `spawnSync git` previo): 0
   llamadas en core+cli.
2. `npm test` completo: 1088 tests, 1085 verdes, 3 rojos (los 3 conocidos de
   Windows: approve stat no ENOENT; plan escritura no EEXIST; plan rama base
   con estado distinto), 8 min 33 s, 0 EBUSY, 0 temporales huerfanos.
3. Equivalencia de los 5 ficheros: recetas literalmente iguales a las
   anteriores. Mutaciones en `dist/src`: automatico 1/11 rojo, start 14/44,
   review 5/19, finish 9/20, plan-brainstorm 1/37.
4. Helper: mutaciones M1 (sin copiar), M2 (sin borrar la copia), M3 (volver al
   `after()`), M4 (sin reintento), M5 (tragar el error): todas en rojo.
5. `limpiar:test` en Git Bash, PowerShell y `cmd`: borra `dist/test`, conserva
   `dist/src`; funciona sin `dist/test` previo.
6. Movidos a `test/integracion/`: 9→9, 12→12, 38→38, plugin-instalado
   14→13+1. Renombrados con similitud 100 %.
