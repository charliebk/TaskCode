---
id: TASK-042
titulo: "F4-T4 Complejidad por defecto por heuristica y un rol sin unificador"
tipo: feature
sprint: 5
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
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

### Revision por pares (ronda 1)

Revisor independiente: **cambios-solicitados** (1 IMPORTANTE, 3 MENOR).
Reprodujo E1-E9 con `bin/taskctl` en repos temporales; la persistencia de
`null`, el modo de 1 rol, las carpetas antiguas y los cambios de 2 a 1 y de 1
a 2 roles funcionan.

- IMP-1 (corregido): CLI, peticion de redaccion, scaffold del plan y skill
  decian que el rol escribe `plan-final.md`, pero los agentes de rol no tienen
  `Write`. Ahora dicen que su respuesta es el plan y que la vuelca quien
  orquesta. (El Resultado de arriba ya lo afirmaba; el texto no lo hacia.)
- MEN-1 (corregido): test en `cli/main` que comprueba que sin complejidad no
  aparece «null» ni en stdout ni en la peticion, y que la ronda 2 de 1 rol se
  anuncia como re-planificacion. Los 4 mutantes supervivientes (M2, M6, M7 y
  M8) mueren ahora.
- MEN-2 (no se corrige): la regla de «2 o mas salidas» cuenta scaffolds por
  nombre aunque esten vacios. Solo hace que se use el unificador de mas en un
  caso raro (ronda cortada de 2+ roles); no es regresion.
- MEN-3 (corregido): con `null`, el mensaje de 0 roles dice «complejidad no
  declarada; la heuristica da "trivial"» en vez de atribuirle el nivel a la
  tarea.
- Fuera de alcance, anotado para TASK-052: una tarea minima sin complejidad
  resuelve 0 roles porque la heuristica le da `trivial`.

### Revision por pares (ronda 2, incremental)

Revisor independiente: **aprobada-con-correcciones** (0 CRITICO, 0
IMPORTANTE). IMP-1, MEN-1 y MEN-3 verificados como corregidos; MEN-2 aceptado.
Tres MENOR nuevos, corregidos sin abrir otra ronda (politica A3):

- MEN-4: el texto nuevo de la peticion y del scaffold no tenia test. Ahora
  `cli/main` asevera el contenido de `peticion-plan-1.md`,
  `peticion-plan-2.md` y del scaffold.
- MEN-5: la cabecera de la peticion le ordenaba al agente «Vuelca el plan
  en»; ahora dice «Quien orquesta vuelca tu respuesta en». Comentarios
  internos alineados.
- MEN-6: en re-planificacion la peticion decia «no reescribirlo entero»,
  pero la respuesta se vuelca tal cual: se habria sobrescrito el plan con
  solo los cambios. Ahora pide **el plan COMPLETO** con el feedback.
