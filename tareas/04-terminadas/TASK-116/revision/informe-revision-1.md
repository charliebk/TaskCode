# Informe de revision — TASK-116 (ronda 1)

- Commit revisado: 3fc45efb13630b7cde6f6d50342d6b98b08ed58b
- Revisor: general-purpose con code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos. Ninguna de las cuatro comprobaciones (ejecucion real de doctor, mutantes, tests
afectados y `test:rapido`) produjo un fallo atribuible a la tarea.

Nota informativa, no hallazgo: la sobrecuenta cuando una clave existio y se quito ya esta declarada
como riesgo aceptado en el plan y en el comentario de `comprobarVerificacion`. El aviso no cambia el
codigo de salida, y el test con repo real lo confirma (`r.codigo === 0`).

## Evidencias

Modo rapido: una sola ronda, solo tests afectados; no se corrio la suite completa. Se trabajo en el
arbol del repo, sin clon. Repos de prueba en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-116-r1`,
ya borrada.

### Tests afectados
- `npm run build`: sin errores.
- `node --test dist/test/commands/doctor.test.js`: 67 pasan, 0 fallan.
- `--test-name-pattern TASK-116` sobre el mismo fichero: 6 pasan, 0 fallan (linea base de los mutantes).
- `npm run test:rapido`: 776 tests, 776 pasan, 0 fallan.

### Ejecucion real de doctor
Repo Git temporal con `package.json` con script `test`, sin `.taskcode/config.yml`, dos tareas en
`tareas/04-terminadas` y una carpeta `basura/`. `node bin/taskctl doctor` da:

`[AVISO] verificacion: sin comando_verificacion y el proyecto tiene tests (package.json con script "test"): los frenos de verificacion no actuan; 2 tareas terminadas se cerraron sin verificar`

con el arreglo `Declara en .taskcode/config.yml: comando_verificacion: "npm test"`. `basura/` no
cuenta (2, no 3). Los errores `rama-base` y `tarea:TASK-00N:ilegible` del resumen vienen del repo de
prueba sintetico, no de la tarea. En el repo real de TaskCode, `taskctl doctor` da `[ok] verificacion`
y `[ok] verificacion-selectiva` (criterio 1).

### Mutantes sobre `src/commands/doctor.ts`
Cada uno: `npm run build` y `--test-name-pattern TASK-116`; deshechos con `git checkout`.

| Mutante | Resultado |
|---|---|
| M1: quitar `.filter(isValidTaskId)` | Muere: 3 tests fallan |
| M2: singular con `terminadas === 2` en vez de `=== 1` | Muere: 1 test falla |
| M3: llamar a `contarTerminadas()` al inicio, fuera del camino del aviso | Muere: falla el test del doble que lanza |
| M4: `terminadas === 0` pasa a `=== 99` | Muere: 1 test falla |

### Estado final del arbol
Recompilado tras los mutantes; `git status --short` vacio en la raiz y en el plugin; sin commits
nuevos; `dist/src` sin cambios; carpeta temporal borrada.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts` (solo las ultimas lineas) y `bin/taskctl`, para invocar el CLI real.
- `taskcode-marketplace/plugins/taskcode-plugin/package.json`, solo la clave `bin`.
