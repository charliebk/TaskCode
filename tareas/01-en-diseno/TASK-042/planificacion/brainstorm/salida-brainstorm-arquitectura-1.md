# Salida — brainstorm-arquitectura (ronda 1)

## Enfoque
«No declarada» se guarda como `complejidad: null` (patron de
`regla_seleccion_skill` y `asignado_a`). Con null decide solo la heuristica;
con valor declarado se conserva el max aprobado. Con 1 rol, `plan` escribe una
unica «peticion de redaccion» para ese rol que apunta a `../plan-final.md`:
sustituye a la del unificador y hace de testigo de ronda. 0 roles y 2 o mas,
sin cambios.

## Piezas y limites
- (a) `src/core/task.ts`: `complejidad: TaskComplexity | null` con
  `requireNullableEnum` (acepta null y clave ausente; verificado). Todos los
  `tarea.md` actuales se leen sin migrar; `frontmatter.ts` ya escribe y lee
  `null`. Se descartan `auto` y omitir la clave.
- (a) `new.ts` e `import.ts`: fuera `DEFAULT_COMPLEJIDAD = 'media'`; sin flag,
  null. El validador de `--complejidad` no cambia.
- (b) `heuristica.ts` (`resolverNumeroAgentes`): si no se declara,
  `agentesBrainstorm(nivelH, tipo)`; si se declara, el max de hoy.
  `nivelDeclarado` pasa a `TaskComplexity | null`; con null no hay
  discrepancia.
- (b) Consumidores: `plan-brainstorm.ts` (cabecera, bloqueComplejidad: «no
  declarada: decide la heuristica»), `cli.ts:220` (nombrar el nivel que
  decidio), `state-machine.ts:203` (solo tipo).
- (c) `plan-brainstorm.ts`: `nombrePeticionRedaccion(ronda)` →
  `peticion-plan-<n>.md` y `peticionRedaccionTemplate(...)`, reutilizando
  cabecera, enunciado, bloqueComplejidad, bloque de re-planificacion y «Que
  tiene que traer el plan final»; del rol, su pregunta, que mira y que no, y
  «lanzalo con el agente `brainstorm-<rol>`». Sin scaffold `salida-*`.
- (c) `plan.ts`: testigo `RONDA_UNIFICADOR_RE` →
  `/^peticion-(unificador|plan)-(\d+)\.md$/`. Modo redaccion: 1 rol y en la
  ronda reutilizable no hay 2 o mas salidas en disco. Se regenera
  `peticion-plan-<ronda>.md` en cada ronda, lo ultimo que se escribe. Ronda
  2+: con bloque de re-planificacion. 0 roles: sin cambios.
  `PlanCommandResult.peticionUnificador` → `peticionRedaccion` (+ modo).
- Coste: sin E/S nueva. Con 1 rol, 1 fichero en vez de 3, 1 agente en vez de 2.

## Orden de construccion
1. task/new/import (null, sin default).
2. heuristica (rama null) y tipos en consumidores.
3. plan-brainstorm (nombre y plantilla, puras).
4. plan.ts (testigo y modo redaccion) y cli.ts.
5. Tests que cambian: plan-brainstorm (REPARTO simple l.151, l.190, l.240,
   l.382, l.696, l.825, l.1217, l.1263; siguen l.232 y l.1154), y defaults en
   new, import, heuristica y task.

## Alternativa descartada
- `complejidad: auto`: nivel falso que cada switch/includes excluiria a mano.
- Sin testigo nuevo: una ronda de 1 rol no se distingue en disco de una de
  2+ cortada tras la primera peticion.

## Desacuerdos previstos
- `tarea.md` existentes con `media` del default antiguo: no se tocan.
- Ronda 2 con 1 rol relanza al rol, no a un unificador.
- 0 roles conserva `peticion-unificador`: fuera de alcance.

## Suposiciones no verificadas
- `task.test.ts` no exige `complejidad` obligatoria.
- `board` no muestra `complejidad`.
- skills y agents no prometen «con 1 rol hay unificador».
- El test l.1154 sigue en verde con la regla «2 o mas salidas → unificador».
