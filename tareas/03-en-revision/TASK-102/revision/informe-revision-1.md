# Informe de revision — TASK-102 (ronda 1)

- Commit revisado: a0b251cc241a20ca32bd46fb87336e21f2e834e5
- Revisor: code-quality-reviewer (agente revisor independiente, general-purpose, sonnet)
- Veredicto: aprobada-con-correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts:185 (la base de `peticionDeTrabajo`) | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts (falta un caso) | implementacion |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts:~79 y src/hooks/freno-stop.ts:~182 (`heldoutComoCodigo`) | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

No hay hallazgos CRITICOS ni IMPORTANTES. Los seis criterios de aceptacion se cumplen con evidencia (ver abajo).

### Puerta determinista

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-102-r1`, rama `feature/task-102-verificacion-proporcional-a3-el-freno-st`, que en el clon queda en el commit de peticion 705cdc7 sobre a0b251c. `npm install` (0 vulnerabilidades) y `npm run build` limpios.
- `npm test` una sola vez: **2159 tests, 2155 pasan, 3 fallan**. Los tres son los conocidos de Windows nativo: `taskctl approve ... error de stat que NO sea ENOENT` (symlink EPERM), `taskctl plan ... error de escritura que NO sea EEXIST` (chmod en directorios) y `taskctl plan ... la rama base real tiene la tarea en un estado distinto` (CRLF). No hay un cuarto rojo. Los 11 tests de `freno-stop-documentacion.test.ts` pasan.

### Reproduccion empirica (criterios de aceptacion)

Con `decidirStop` del `dist` compilado, sobre repos Git temporales reales (config con `rutas_documentacion: [docs/**]`, comando de documentacion y comando completo que cuentan sus ejecuciones desde fuera del repo):

| Escenario | Resultado observado |
|---|---|
| commit solo de `docs/` | docs=1, completa=0 (criterios 1 y 3) |
| `src/app.ts` borrado sin preparar | completa=1 |
| `git mv src/app.ts docs/app.md` preparado | completa=1 (cuenta las dos rutas del renombre, por `--no-renames`) |
| `src/docs/x.ts` modificado (se parece a `docs/**` pero no lo es) | completa=1 |
| `.taskcode/config.yml` modificado | completa=1 |
| nada cambia | completa=1 (vacio no es documentacion) |
| `code` ignorado por `.gitignore` + doc modificado | completa=1 (la rama no cambia de resultado por lo ignorado; el vacio de codigo no cuenta) |
| `.ts` bajo `tareas/` sin seguimiento | docs=1 (por diseno: `tareas/**` siempre es documentacion) |
| cwd = subcarpeta `docs/`, doc modificado | docs=1 |
| cwd = subcarpeta `docs/`, `src/n.ts` sin seguimiento | completa=1 (`:(top)` funciona) |
| fichero con espacios y tilde (`src/a ñ b.ts`) sin seguimiento | completa=1 |
| repo anidado sin seguimiento con `a.ts` dentro | completa=1 |

Todos aplican la verificacion de siempre o la de documentacion segun lo esperado; no encontre un caso en que codigo pase como «solo documentacion».

Mutantes sobre una copia (se compilo y se corrio `freno-stop-documentacion.test.js`; el resto de la suite no se repitio):

| Mutante | Resultado |
|---|---|
| M1: ignorar `conArbol` (no unir el arbol) | 5 tests rojos (se detecta) |
| M2: guardar el memo de documentacion aunque el arbol este sucio | 1 rojo (se detecta) |
| M4: `git diff` sin `HEAD` (pierde lo preparado) | 1 rojo (se detecta) |
| M9: sin los pathspecs de exclusion en `rutasDelArbol` | 2 rojos (se detecta) |
| M5: ignorar `baseFiable` (tarea sin tipo exime por documentacion) | **0 rojos: sobrevive** (ver MEN-2) |

No se aplico mutante a la puerta de cero git ni al aviso de config invalida: los dos tests correspondientes asertan directamente los subcomandos git y el mensaje (`/no es valida/`), y el test de «sin la clave» pasa con el set exacto `branch, rev-parse, status`.

### MEN-1 — Con la clave declarada, una tarea `hotfix` lanza `git ls-remote` en cada fin de turno

Origen: implementacion. `peticionDeTrabajo` llama a `base()` en cuanto `rutas_documentacion` esta declarada y la base es fiable. En Stop, `base` es `resolveBaseBranchForTipo(tipo, raiz)`, y para `hotfix` eso es `resolveMainBranch`, que hace `git ls-remote --heads origin` (red, sin timeout propio). En la 0.14.0 esa resolucion solo ocurria si estaba declarada la selectiva. El plan decia «hasta 6 procesos git mas por turno», pero no mencionaba un acceso a red.

Reproduccion: tarea `tipo: hotfix` en rama `feature/t`, rama principal `main`, remoto `origin` apuntando a `https://127.0.0.1:9/x.git` (inalcanzable), `rutas_documentacion` declarada, un commit solo de `docs/`. Con `GIT_TRACE2_EVENT` activo, `decidirStop` devolvio codigo 0 con la verificacion de documentacion ejecutada, tardo **11148 ms** y lanzo `ls-remote --heads origin`. Con el remoto accesible son hasta dos o tres `ls-remote` por turno. No bloquea ni da un resultado equivocado: es latencia por turno que antes no existia, solo para hotfix con la clave declarada.

Sugerencia: para `hotfix`, no resolver la base por red en el freno (usar la rama principal local si existe, o tratar `hotfix` como `baseFiable: false`) o documentarlo en el CHANGELOG.

### MEN-2 — Ningun test cubre «tarea sin tipo: no se exime nada»

Origen: implementacion. El plan de pruebas lo pedia («`tipo` null va a la completa») y el comentario de `freno-stop.ts` lo promete («Tarea sin tipo: no se exime nada»). El mutante M5 (`if (e.baseFiable)` → `if (true)`) deja los 11 tests en verde: la proteccion no tiene red de regresion. No encontre un caso real que lo rompa hoy; es una proteccion nueva sin test que se ponga rojo al quitarla. Lo dejo como MENOR porque `Task.tipo` es obligatorio en el frontmatter, asi que el camino `tipo === null` solo se da con una tarea en curso cuyo tipo no se pudo leer.

Reproduccion: en `/tmp` de la copia, aplicar `sed -i "s/if (e.baseFiable) {/if (true) {/" src/fs/decision-documentacion.ts`, compilar y correr `node --test dist/test/hooks/freno-stop-documentacion.test.js`: `# pass 11 # fail 0`.

### MEN-3 — Los held-out de `tareas/**/aceptacion/` cuentan como documentacion en Stop, y el guardian los cuenta como codigo

Origen: plan. El plan adoptaba «no pasar `heldoutComoCodigo`» **solo si** se confirmaba que la suite del Stop no ejecuta los held-out; esa suposicion quedo sin comprobar (no hay nota en el codigo, el CHANGELOG ni la tarea). Consecuencia verificada: un `.ts` sin seguimiento dentro de `tareas/.../aceptacion/` hace que el turno sea de «solo documentacion» (ver tabla: `.ts` bajo `tareas/` → docs=1), mientras que el guardian, con `heldoutComoCodigo: true`, lo clasifica como codigo. Es la misma entrada con dos decisiones distintas segun el comando. El efecto practico es pequeno: `finish` sigue ejecutando la puerta completa antes de integrar y el Stop solo se salta la suite de un turno, pero conviene dejar escrita la decision.

Reproduccion: el escenario `untracked in tareas/ (ts)` de la tabla de arriba. No se reproduce un dano; es una discrepancia entre dos decisiones que el propio plan queria que coincidieran.

Sugerencia: confirmar y anotar que el `comando_verificacion` del Stop no corre los held-out, o pasar `heldoutComoCodigo: true` en `conArbol` (coste: un test mas).

### Otras observaciones (no son hallazgos)

- Con el arbol sucio, la comprobacion de documentacion se vuelve a ejecutar en cada turno porque no se guarda el memo. Es la decision 3 de Carlos y el criterio 5; el test lo cubre.
- Con el timeout recortado por el tope del hook, la huella del memo de documentacion difiere de la de `finish`, y un Stop con el arbol limpio podria sobrescribir el memo compartido con otra huella. Solo se da si `timeout_verificacion` supera el tope del hook, y el efecto es un acierto de memo perdido (se vuelve a ejecutar), no un verde falso. No lo reporto como hallazgo.
- Sin `rutas_documentacion` en el arbol, el test mide con `GIT_TRACE2_EVENT` que no hay mas git que en la 0.14.0; la medicion es real y ha demostrado discriminar (M6 no se ejecuto, pero el test asevera el set exacto de subcomandos).

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts`: para entender la decision pura (`decidirVerificacion`, `RUTA_CONFIG`, `tareas/**`) que llama `decidirVerificacionEntre`.
- `taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts`/`src/fs/config-de-ref.ts` (solo la firma de `configDeRef`) y `src/fs/git.ts` (`resolveBaseBranchForTipo`, `resolveMainBranch`, `isRemoteAvailable`): para comprobar que la base de un hotfix hace `ls-remote` (MEN-1).
- `src/fs/verificacion.ts` completo (`huellaDelArbol`, `fotoDelArbol` via importacion, `leerMemo`, `guardarMemo`): para razonar sobre el memo y el arbol sucio (ya estaba en la lista; se leyo mas alla de lo cambiado).
- `skills/task-workflow/revision.md` de la skill instalada (no del repo): la plantilla de informe.
- `tareas/03-en-revision/TASK-102/revision/informe-revision-1.md`: la plantilla.
