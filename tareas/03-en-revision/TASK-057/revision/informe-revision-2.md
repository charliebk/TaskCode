# Informe de revision — TASK-057 (ronda 2)

- Commit revisado: 5487a1b (diff incremental desde 2d6af8d)
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-057 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | skills/plan/SKILL.md:16 (paso 2) |
| IMP-2 | IMPORTANTE | corregido | skills/review/SKILL.md:21,32 + skills/task-workflow/avance.md |
| MEN-1 | MENOR | corregido (salvo el caso de 1 rol, ver IMP-3) | skills/plan/SKILL.md + skills/approve/SKILL.md |
| MEN-2 | MENOR | corregido | skills/review/SKILL.md |
| MEN-3 | MENOR | corregido | skills/review/SKILL.md |
| MEN-4 | MENOR | corregido | skills/finish/SKILL.md:4 |
| MEN-5 | MENOR | corregido en parte (M10 aceptado con motivo) | test/skills/fases.test.ts |
| IMP-3 | IMPORTANTE | abierto | skills/plan/SKILL.md:26-28 y 42-44 (pasos 2 y 4) |
| MEN-6 | MENOR | abierto | skills/plan/SKILL.md:25-29 (paso 2, re-planificar) |
| MEN-7 | MENOR | abierto | test/skills/fases.test.ts |

### Puerta determinista y lo ejecutado

Clon temporal, `npm install && npm test` una vez: 1025 tests, 1022 verdes,
los 3 rojos conocidos de Windows. `dist` sincronizado. Siguiendo las skills al
pie de la letra con `node bin/taskctl`: reanudar `plan` con la ronda abierta
(2, 1 y 0 roles) ya no abre otra ronda; el «no» en approve con 2 roles deja el
feedback escrito, commiteado y con su `pausa`, y la ronda 2 lo lee; `pausa`
con la carpeta sucia aborta (el orden commit → pausa es necesario); `review`
en cada fase con `revision_codex` y un stub de codex (ronda 1 cambios, ronda
2 aprobada, `veredicto-codex` sin relanzar, Codex con cambios → corregir →
ronda 2 de Codex, finish), y Codex degradado sin reintento. Textos de
`avance.md`, skills y `motivo` coherentes.

Mutantes con `fases.test.js`: mueren M1 (`plan` reabre al reanudar) y M5
(fila `veredicto-codex` → finish); sobreviven M2 (paso 6 de review relanza
Codex), M3 (`pausa` antes de commitear), M4 (`plan` ignora los cambios), M6,
M7, M8 y M9.

### IMP-3 — La re-planificacion de una tarea de 1 rol manda lanzar el unificador con una peticion que no existe

Con complejidad `simple`, `taskctl plan` en re-planificacion crea
`peticion-plan-2.md` y dice que se lance el agente del rol y se vuelque su
respuesta; la skill (pasos 2 y 4) dice que se lance el unificador con
`peticion-unificador-N.md`, que no existe. Reproducido. Regresion de la
correccion de MEN-1, sin test.

### MEN-6 — La re-planificacion se detecta por una condicion sin marcar; reanudarla a medias abre otra ronda

Si la sesion se corta tras `taskctl plan` y antes del unificador, la seccion
de cambios sigue ahi y reanudar vuelve a ejecutar `taskctl plan` (ronda 3,
otra fila `plan`). Un segundo «no» anade otra seccion con el mismo
encabezado. «Cuya salida siga vacia» choca con el scaffold de encabezados.

### MEN-7 — El test fija la linea de despacho, no el contenido de las correcciones

Sobreviven M2 y M3, que son contratos que hace cumplir el CLI.
