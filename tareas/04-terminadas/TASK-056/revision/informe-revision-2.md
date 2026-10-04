# Informe de revision — TASK-056 (ronda 2)

- Commit revisado: 4cada029547c05cae4b2cf2c2d17eee2b21f5f5a
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/flujo.ts:131-160 |
| IMP-2 | IMPORTANTE | corregido (caso del informe 1); lo que queda, en IMP-4 | src/core/transiciones.ts:48-80 |
| IMP-3 | IMPORTANTE | corregido | src/commands/siguiente.ts:96-126, src/fs/rondas.ts:108 |
| MEN-1 | MENOR | corregido | test/core/transiciones.test.ts |
| MEN-2 | MENOR | corregido | test/commands/siguiente.test.ts |
| MEN-3 | MENOR | aceptado | src/core/transiciones.ts / src/commands/plan.ts |
| MEN-4 | MENOR | corregido | src/core/flujo.ts:109-119 |
| MEN-5 | MENOR | corregido | src/commands/pausa.ts:72-80 |
| MEN-6 | MENOR | corregido | src/core/flujo.ts:166-168 |
| MEN-7 | MENOR | aceptado | src/commands/siguiente.ts |
| MEN-8 | MENOR | aceptado | start/review/finish/plan |
| IMP-4 | IMPORTANTE | abierto | src/core/transiciones.ts:49-62 (`dentroDeBloque`) |
| MEN-9 | MENOR | abierto | test/core/transiciones.test.ts |
| MEN-10 | MENOR | abierto | src/core/flujo.ts:55-59, 63-66, 148-158 |

### Puerta determinista

Clon nuevo, `npm install && npm test` una vez: 1009 tests, 1005 verdes; los 3
rojos conocidos de Windows y uno de tiempos en `origin-deteccion.test.js`
(fuera del diff; solo, 5/5). `tsc` sin errores, `dist` sincronizado.

### Verificacion de la ronda 1

- IMP-1: con el CLI real, `revision_codex: true` y un `codex` falso: tras
  cada `codex-review` el flujo se para en una persona (`veredicto-codex /
  preguntar`); con cambios, `codex-review / preguntar`; aprobada, `finish`.
  Sin bucle. `siguiente` y `finish` usan el mismo criterio de Codex aprobado.
- IMP-2: corregido el caso de un unico bloque (tambien `~~~` dentro de
  ```` ``` ````); lo que queda, en IMP-4.
- IMP-3: `nombresDeUltimaRonda` es el unico criterio de ronda; los tres
  mutantes supervivientes mueren.
- MEN-4 y MEN-5 verificados por CLI (la guarda de `pausa` en los cuatro
  estados, con la carpeta sucia y limpia, y con suciedad fuera de ella).

Mutantes muertos: los tres de IMP-3, tres de IMP-1, dos de IMP-2, y uno por
MEN-1, MEN-2, MEN-4, MEN-5 y MEN-6.

### IMP-4 — `dentroDeBloque` no sigue las reglas de las vallas de CommonMark

Cualquier valla del mismo caracter cierra el bloque, aunque sea mas corta que
la de apertura. (1) Un ```` ````md ```` que contiene un ejemplo con ``` se
cierra en el interior: el `## Transiciones` del ejemplo queda fuera de bloque
y vuelve IMP-2 (con el proyecto en manual, `siguiente` da `automatico /
continuar` y `plan` escribe su fila dentro del enunciado). (2) Una valla sin
cerrar deja todo lo siguiente «en bloque», tambien la seccion real: ninguna
fila se lee, la tarea queda sin modo congelado y cada transicion crea otra
seccion (con el codigo de la ronda 1 este caso funcionaba: regresion de la
correccion). Un ``` sangrado 4 espacios tambien abria bloque.

### MEN-9 — Red de regresion incompleta en la correccion de IMP-2

Sobreviven: tomar el primer encabezado en vez del ultimo; no mirar
`enBloque[fin]` al buscar el fin de seccion; contar como tabla las lineas `|`
dentro de un bloque en `anadirTransicion` (la fila nueva se perderia); quitar
`~~~` como valla.

### MEN-10 — Textos que dejaron de ser ciertos con `veredicto-codex`

El docstring de `SiguientePaso.comando` (null tambien en `veredicto-codex`),
el de `accionPara` («codex-review sigue sola», ya no con cambios) y el motivo
de `veredicto-codex` con un veredicto de Codex desconocido.

### Comprobado y correcto

`siguiente` no escribe nada; el unico consumidor de `FaseSiguiente` (cli.ts)
trata bien `comando === null`; el cruce con la maquina de estados salta las
fases sin comando.
