# Informe de revision — TASK-057 (ronda 3)

- Commit revisado: 3f1f626be1f4440b9a46f060edd71edafb379078 (diff incremental desde db5a6b9)
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | corregido | skills/plan/SKILL.md + skills/approve/SKILL.md |
| MEN-5 | MENOR | corregido en parte (M10 aceptado con motivo) | test/skills/fases.test.ts |
| IMP-3 | IMPORTANTE | corregido | skills/plan/SKILL.md:47-55 (paso 4) |
| MEN-6 | MENOR | corregido (ventana residual, ver MEN-8) | skills/plan/SKILL.md:25-34 |
| MEN-7 | MENOR | corregido en parte (ver MEN-10) | test/skills/fases.test.ts |
| MEN-8 | MENOR | corregido | skills/plan/SKILL.md:27-30 |
| MEN-9 | MENOR | corregido | skills/plan/SKILL.md:44-55 |
| MEN-10 | MENOR | corregido | test/skills/fases.test.ts:201-206 |

### Puerta determinista y lo ejecutado

Clon temporal, `npm install && npm test` una vez: 1025 tests, 1022 verdes,
solo los 3 rojos conocidos de Windows; `dist` sincronizado. Siguiendo `plan`
y `approve` al pie de la letra con `node bin/taskctl`: con 1 rol, «no» →
re-planificacion con `peticion-plan-2.md` → corte con la marca pendiente →
reanudar sin abrir ronda → plan incorporado → segundo «no» → ronda 3;
Transiciones `plan, pausa, plan, pausa, plan`. Con 2 roles, el mismo ciclo
con `peticion-unificador-2/3.md` sobre las salidas de la ronda 1, y `approve`
final. Con 0 roles, ver MEN-9. IMP-3 cerrado.

Mutantes: mueren quitar el caso de un rol, quitar la marca pendiente, `pausa`
antes de commitear, quitar la marca incorporada y no cambiar el encabezado.
Sobreviven MC (con la marca pendiente se vuelve a ejecutar `taskctl plan`), ME
(un rol → «el unificador») y MH (sin seccion se re-planifica igualmente).

### MEN-8 — Ventana residual de MEN-6

El paso ejecuta `taskctl plan` (autocommit) y despues marca: un corte entre
los dos commits deja la seccion sin marca y reanudar abre otra ronda.
Reproducido (`peticion-plan-2` y `-3`, dos filas `plan`).

### MEN-9 — Con 0 roles, el paso 4 contradice la salida del CLI y el paso 3

`taskctl plan` dice «Sin brainstorm ... Redacta el plan» pero crea
`peticion-unificador-2.md`; el paso 4 decia que se lanza lo que nombro la
salida. Sin resultado incorrecto; ambiguedad.

### MEN-10 — Los mutantes centrales de MEN-6 e IMP-3 sobreviven

El test fijaba que existen las cadenas, no lo que se hace con ellas; el
Resultado de la tarea lo exageraba.

## Correcciones (orquestador)

- MEN-8: se marca `(pendientes, ronda K)` (K = mayor N + 1) y se commitea
  ANTES de `taskctl plan`; con la marca pendiente, si ya existe la peticion de
  la ronda K no se ejecuta `taskctl plan`, y si no existe se ejecuta una vez.
- MEN-9: el caso sin roles dice que se reescribe el plan a mano, como en el
  paso 3.
- MEN-10: aserciones de que la marca va antes de `taskctl plan`, de que con
  la marca pendiente no se ejecuta `taskctl plan`, y de que el caso de un rol
  no menciona el unificador. MC y ME mueren. El test normaliza CRLF (los .md
  salen en CRLF en un checkout de Windows): verificado con LF y con CRLF.
