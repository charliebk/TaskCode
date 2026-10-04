# Informe de revision — TASK-056 (ronda 1)

- Commit revisado: 66d4565af7cc266443c014a347b1885b6d5f0eab
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-056 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/core/flujo.ts:104-106 |
| IMP-2 | IMPORTANTE | abierto | src/core/transiciones.ts:50-53 |
| IMP-3 | IMPORTANTE | abierto | src/commands/siguiente.ts:120-131 (test/commands/siguiente.test.ts) |
| MEN-1 | MENOR | abierto | src/core/transiciones.ts:53 (test/core/transiciones.test.ts) |
| MEN-2 | MENOR | abierto | src/commands/approve.ts:207-208 |
| MEN-3 | MENOR | abierto | src/core/transiciones.ts:146 / src/commands/plan.ts:1002 |
| MEN-4 | MENOR | abierto | src/core/transiciones.ts:132 / src/core/flujo.ts / src/commands/approve.ts:162-168 |
| MEN-5 | MENOR | abierto | src/commands/pausa.ts:55-78 |
| MEN-6 | MENOR | abierto | src/core/flujo.ts:109-113 |
| MEN-7 | MENOR | abierto | src/commands/siguiente.ts:103-106 |
| MEN-8 | MENOR | aceptado | start/review/finish/plan: `decidido_por` siempre `persona` |

Rutas relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

### Puerta determinista

Clon nuevo, `npm install && npm test` una vez: 1004 tests, 1001 verdes; los 3
rojos conocidos de Windows. `tsc` sin errores; `dist` commiteado en sincronia
con el fuente.

### IMP-1 — Con `revision_codex: true`, `siguiente` propone `codex-review` sin fin

`ContextoFlujo.codexAprobada` es un booleano: no distingue sin informe,
PENDIENTE y cambios-solicitados. `codex-review` escribe siempre
`informe-codex-N.md` en PENDIENTE y `taskctl veredicto --informe
informe-codex-1.md` lo rechaza, asi que tras cada ronda `siguiente` pide
otra. Reproducido con un `codex` falso en el PATH: `informe-codex-1..3.md` y
siempre `codex-review / continuar`. Con Codex en cambios-solicitados, igual.
Un flujo semiautomatico o automatico entraria en bucle (una llamada a Codex y
un commit por vuelta) sin llegar a `finish`.

### IMP-2 — Un `## Transiciones` dentro de un bloque de codigo del enunciado se toma como el registro

`rangoSeccion` usa la primera linea `## Transiciones` sin mirar los bloques
de codigo. Con la tabla de ejemplo en el Objetivo (previsible en C, D y E):
`plan` escribe su fila dentro del bloque y nunca crea la seccion real, y antes
de `plan` `siguiente` toma el modo de la fila del ejemplo (un proyecto en
manual daba `automatico / continuar`). Corrompe el enunciado.

### IMP-3 — Leer `revision/` desde la rama de la tarea no tiene red de regresion

El comportamiento es correcto (verificado desde develop con ronda
fragmentada pendiente, cambios y aprobada, y con Codex), pero sobreviven los
mutantes: informes primarios `[]`, ronda fragmentada solo con el primer
informe, informes de Codex `[]`. Ademas `ultimaRonda` reimplementa
`informesDeUltimaRonda`: si el criterio cambia en uno solo, develop y la rama
responderian distinto.

### MEN-1 — El fin de seccion de `rangoSeccion` no tiene test

El mutante «la seccion llega hasta el final» sobrevive: el Resultado del test
no tiene tabla.

### MEN-2 — `--decidido-por=valor` no tiene test

Mutante en esa rama sobrevive (por CLI funciona).

### MEN-3 — Re-planificar tras cambiar el config permite aprobar en automatico un plan redactado en otro modo

Plan en semiautomatico con plan-final redactado, config a automatico,
`taskctl plan` (re-planificar): el plan-final sigue redactado y `approve
--decidido-por automatico` pasa. Es lo escrito («la ultima fila plan
congela»), pero se firma el plan de la ronda anterior. Decision de la
persona.

### MEN-4 — Tarea antigua sin fila `plan`: `siguiente` y `approve` no estan de acuerdo

Config automatico, tarea sin registro: `siguiente` da `approve / continuar`
y `approve --decidido-por automatico` se rechaza; un agente acabaria
aprobando como `persona` sin persona.

### MEN-5 — `pausa` no pasa por la guarda de workspace

Con una edicion sin commitear en el propio `tarea.md`, el commit de la pausa
se la lleva.

### MEN-6 — Un veredicto `desconocido` se presenta como «falta el revisor»

### MEN-7 — Desde `main`, un hotfix ya cerrado aparece como «toca finish»

El commit de cierre de finish solo vive en la rama de integracion y la rama
del hotfix esta integrada en main: se lee la copia vieja de main.

### MEN-8 — `decidido_por` es siempre `persona` fuera de `approve` (aceptado)

### Comprobado y correcto

Los tres modos y cada estado por el CLI real, desde la rama y desde develop;
hotfix en automatico pregunta antes de finish y ningun comando lleva
`--push`; `siguiente` no escribe nada y sale 1 en los errores;
`--decidido-por` en todas sus formas; `pausa` en rama, desde develop y en
terminada; la fila en el mismo commit que cada transicion (incluido finish y
hotfix); el cuerpo intacto con Resultado detras, tabla editada a mano, filas
mal formadas, `###` dentro y CRLF; tarea antigua sin registro. Mutantes
muertos: sin `isAncestor`, `pausa` sin guarda, finish/review sin fila, plan
con modo fijo, `--decidido-por` separado, fila al re-aprobar, EOL fijo, fecha
sin validar, release sin preguntar, desconocido como cambios.
