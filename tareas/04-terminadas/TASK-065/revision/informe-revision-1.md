# Informe de revision — TASK-065 (ronda 1)

- Commit revisado: 177260ab3ab1d87640c98654689a6f3dea1dd3ea
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet, independiente de la implementacion)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | aceptado | test/core/evolucion.test.ts:17-29 (y src/core/evolucion.ts, `ordenarPorCierre`) | implementacion |
| MEN-2 | MENOR | aceptado | src/commands/registrar-coste.ts (guard `encoge.length > 0` en `costeDeAgentes`) | implementacion |
| MEN-3 | MENOR | aceptado | src/commands/registrar-coste.ts (`yaAnotado`) y coste.md | especificacion |

Veredicto propuesto por el revisor: aprobada-con-correcciones. Ningun CRITICO ni IMPORTANTE; criterios 1 a 9 reproducidos empiricamente. En modo automatico el codigo mergeado tiene que ser el revisado: los tres MENOR (huecos de test y un limite documentado, sin fallo de comportamiento) se aceptan sin corregir y quedan en el Resultado.

## Reproduccion

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-065-r1` y repos temporales para el CLI; carpeta borrada, sin procesos en segundo plano, repo original sin tocar.

**Suite** (Git Bash, `npm test`): 1428 tests, 1423 pasan, 5 fallan: los 3 conocidos de Windows (symlink EPERM, chmod NTFS, CRLF) y los 2 de «contraprueba de descubrimiento». Ninguno atribuible a la tarea.

**CLI real (`bin/taskctl`):**
- `--repo`: dos repos distintos se juntan (avisos con `proyecto/TASK-NNN`, `Repos leidos:` por stderr); misma ruta repetida o con otra grafia (`../BETA`) se lee una vez con aviso; ruta inexistente, directorio sin `tareas/`, `--repo` sin valor, `--repo=` y dos carpetas con el mismo basename abortan (rc=1) antes de leer; `--repo ... --tokens --escribir` aborta sin tocar nada; repo con `tareas/` vacia da 0 tareas.
- `--json`: `JSON.parse` correcto tambien sin tareas y con repos reales; sin `NaN`; ningun `null` sin `n: 0`. Con `--tokens`, `--heuristica` o `--escribir` aborta sin leer ni escribir. `--json --tramo 3` aborta porque `--tramo` exige `--evolucion` (mensaje correcto, aunque `--tramo` esta en la lista de combinables).
- `--tramo` `0`, `abc`, `-1`, `1.5`, `1e2`, sin valor o sin `--evolucion`: abortan con mensaje accionable.
- `--evolucion`/`--grupos` con `--tokens` o `--heuristica`, o repetidos: abortan.
- Flag repetido en otros comandos (`board --sprint`, `doctor --json`, `new --titulo`, `finish --tag`, `registrar-coste --tokens`, `siguiente --json`, `veredicto --push`, `pause --push`): abortan. `diagnose`, `recover`, `resume` y `abort-merge` ya rechazaban opciones. `--agente` repetido sigue permitido.
- `registrar-coste` con agente reanudado (transcripciones sinteticas, `CLAUDE_CONFIG_DIR`): primer registro 2420; crecida +2820 (total 5240) con fuente `agente:dif:abc123`; otra +3220 (total 8460 = transcripcion acumulada); sin crecimiento aborta («nada nuevo»); si encoge aborta; `metricas --tokens` no avisa las filas `dif:`; una fila mixta `agente:def456,dif:abc123` bloquea reanudaciones posteriores de ambos (MEN-3).

**Solo lectura sobre ToolsaWeb, OpenGisViewer y TaskCode** (`metricas --evolucion --grupos --repo` x3, rc=0): 135, 140 y 65 tareas; 194 terminadas, 185 en tramos, 9 de TaskCode sin fecha de cierre; `--json` valido. `git status` de `tareas/`, `docs/` y `.taskcode/` y los ficheros modificados alli identicos antes y despues (md5). Los cambios previos en ToolsaWeb y OpenGisViewer son ajenos (otras sesiones).

**Mutantes:** 18 aplicados, 16 detectados (desempate por proyecto; solo-dia en el orden; terciles c1, c2, `<=` y `<`; deduplicacion de repos y colision de nombre; aborto de flag repetido y de `--cadena`; resta de lo anotado y `crecio <= 0`; criterio «a la primera»; tamano de tramo; `--json` con otros flags; `soloDia`; `--repo` con `--escribir`). Sobreviven el orden por numero de ID (MEN-1) y el guard `encoge.length > 0` (MEN-2).

## Detalle de los hallazgos

### MEN-1 — el test del orden por numero de ID no discrimina

Quitar `numeroDeId(a.id) - numeroDeId(b.id)` del comparador deja los 117 tests en verde: el test usa `TASK-099` y `TASK-100`, que por cadena ya ordenan bien. Solo importa en `TASK-999` frente a `TASK-1000`. Hoy no hay fallo, pero el titulo del test promete una proteccion que no existe. Sugerencia: anadir `TASK-999` frente a `TASK-1000` en el mismo dia y proyecto.

### MEN-2 — el aborto por campo que encoge no tiene test

Quitar `|| encoge.length > 0` deja todos los tests en verde. Protege una transcripcion con mas total pero menos `cacheLectura` que lo anotado (la fila `dif:` saldria con un campo negativo). El guard existe y funciona. Sugerencia: test con total que crece y un campo que baja.

### MEN-3 — una fila mixta (agente nuevo + reanudado) bloquea la reanudacion de ambos

`registrar-coste --agente def456 --agente abc123` con `abc123` ya anotado escribe `agente:def456,dif:abc123`; despues, reanudar cualquiera de los dos aborta con «junto a otros agentes ... Registra la diferencia a mano con --tokens N». Coincide con lo decidido en el plan y el mensaje dice que hacer: es un limite de la decision. Sugerencia: recomendar en README o coste.md registrar un agente por llamada.

## Desviaciones declaradas: juicio

Todas aceptables, documentadas en README y CHANGELOG y verificadas en el CLI y con mutantes: `--evolucion`/`--grupos` sustituyen la tabla y no se combinan con `--heuristica`/`--tokens`/`--escribir`; dimension extra «por proyecto» en `--grupos` (util, sale aunque un proyecto no tenga tareas); mediana de minutos solo con hora en las dos marcas (las de solo dia aparte, cada cifra con su `n`); terciles cortados por valor (documentado, con test de empates); flags repetibles `--repo`, `--agente`, `--criterio` y el resto aborta, incluido `--cadena`; agente reanudado con `agente:dif:<id>` que suma la diferencia campo a campo.
