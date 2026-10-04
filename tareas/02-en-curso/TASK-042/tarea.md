---
id: TASK-042
titulo: "F4-T4 Complejidad por defecto por heuristica y un rol sin unificador"
tipo: feature
sprint: 5
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-042-f4-t4-complejidad-por-defecto-por-heuris
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Que una tarea `simple` lance un agente de brainstorm y no tres (auditoria del
2026-10-03, decision C4). Hoy `new` e `import` escriben `complejidad: media`
cuando no se declara, y ese valor por defecto domina el maximo con la
heuristica: casi todas las tareas lanzan 2 roles mas el unificador, aunque la
heuristica diga `simple`. Y con un solo rol, el unificador no consolida
nada: es un agente mas que relee lo que el rol ya escribio.

Decision C4 aprobada: la heuristica decide la complejidad cuando no se
declara; con 1 rol no hay unificador y el rol escribe `plan-final.md`.

Fuera de alcance: recalibrar la heuristica (TASK-052).

## Criterios de aceptacion
- [x] Sin `--complejidad` declarado, el numero de roles lo decide la heuristica
- [x] Con 1 rol, `plan` no escribe la peticion de unificador y el rol escribe `plan-final.md`
- [x] Tests de `plan-brainstorm` actualizados con la nueva expectativa y su motivo

## Resultado

Dos frentes en paralelo en la misma rama (el agente en worktree no pudo usar
git, ver HALLAZGOS; se relanzo en el arbol compartido con ficheros repartidos).

**Complejidad no declarada** (`task.ts`, `new.ts`, `import.ts`,
`heuristica.ts`, `state-machine.ts`): `complejidad: TaskComplexity | null`
con `requireNullableEnum`, asi los `tarea.md` existentes se leen igual y la
clave ausente vale `null`. `new` e `import` ya no ponen `media`. Con `null`,
`resolverNumeroAgentes` usa solo el nivel heuristico (con el tope de hotfix)
y `hayDiscrepancia` es `false`. Las peticiones dicen «no declarada (decide la
heuristica)». Las tareas existentes con `media` del default antiguo no se
tocan (no se distingue de un `media` declarado).

**1 rol sin unificador** (`plan.ts`, `plan-brainstorm.ts`, `cli.ts`, skill y
`agents/brainstorm-*.md`): con exactamente 1 rol, y si la ronda reutilizable
no tiene 2 o mas salidas en disco, `plan` escribe solo
`peticion-plan-<ronda>.md`, que hace de testigo de ronda (el testigo acepta
`peticion-(unificador|plan)-N`, asi las carpetas antiguas siguen valiendo). En
ronda 2 o siguientes, la misma peticion con el bloque de re-planificacion. 0
roles y 2 o mas, sin cambios. Matiz: los agentes de rol solo tienen `Read,
Grep, Glob` (un test lo impone), asi que «el rol escribe `plan-final.md`»
significa que el orquestador vuelca la respuesta del rol en el fichero, como
ya hacia con las `salida-*`; la peticion y el CLI lo dicen asi.

Tests: `task.test` (null y clave ausente), `heuristica.test` (null usa la
heuristica aunque `media` pidiera mas), defaults de `new` e `import`, y en
`plan-brainstorm.test` las expectativas cambiadas con su motivo y 3 tests
nuevos (1 rol escribe exactamente `peticion-plan-1.md`; la ronda 2 escribe
`peticion-plan-2.md` con re-planificacion; una carpeta antigua con
`peticion-unificador-1` cuenta como ronda). Test nuevo en `cli/main`
(`new --complejidad simple` + `plan` anuncia «1 rol, sin unificador»).
Suite: 960 tests, 957 en verde; los 3 rojos son los conocidos de Windows.
Mutantes (8, todos muertos): null usa `media`, default `media` en `new` y en
`import`, discrepancia con null, `roles.length === 1` desactivado, quitar
`plan` o `unificador` del testigo, regla de 2 o mas salidas desactivada.
