# Informe de revision — TASK-059 (ronda 1)

- Commit revisado: 79a21b581a7161670a310ff896b5e8676dddf74e
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| CRIT-1 | CRITICO | abierto | src/commands/siguiente.ts:69-87 (`informeEnCommitPropio`) |
| IMP-1 | IMPORTANTE | abierto | src/commands/siguiente.ts:69-87, src/core/flujo.ts:59-64, plan-final |
| IMP-2 | IMPORTANTE | abierto | src/core/flujo.ts:101-108 y 168-176; test/core/siguiente.test.ts |
| IMP-3 | IMPORTANTE | abierto | src/commands/siguiente.ts:150-155 y 176-179 (camino `enOtraRama`) |
| MEN-1 | MENOR | abierto | src/commands/siguiente.ts:73 (`:(exclude)tareas/`) |
| MEN-2 | MENOR | abierto | skills/review/SKILL.md paso 4 |
| MEN-3 | MENOR | abierto | skills/start/SKILL.md pasos 4-5 |

### Puerta determinista

Clon temporal, `npm install && npm test` una vez: 1053 tests, 1050 verdes,
los 3 rojos conocidos de Windows. `dist` sincronizado.

### CRIT-1 — El codigo commiteado despues del commit revisado se mergea solo en automatico

`informeEnCommitPropio` compara con el «ultimo commit de codigo», no con el
`Commit revisado` de la ronda, y solo mira el ultimo commit de cada informe.
(a) Codigo nuevo en commit propio entre `taskctl review` y el veredicto: el
informe queda posterior y la guarda pasa; `finish` mergea codigo que ningun
revisor vio (reproducido). (b) Informe commiteado junto a codigo y despues
`taskctl veredicto` (paso 4 de la skill), que deja un commit limpio: la guarda
pasa. En el flujo real la proteccion «mezclado con codigo» no salta nunca.

### IMP-1 — La plantilla sin rellenar mas `taskctl veredicto aprobada` cierra sola

Sin lanzar ningun revisor, `taskctl veredicto aprobada` → `finish continuar`
→ finish rc=0, con el informe en `Revisor: (rellenar...` y la fila de ejemplo.
El plan de referencia contenia el riesgo con «commit propio y registro de
quien lanza el revisor»; la segunda parte no se entrega ni se documenta.

### IMP-2 — El semiautomatico cambia en el tope, y un «si» relanza la revision sobre el mismo codigo

`exigePersona` se evalua antes que `faltaTrabajo`: semi pasa de `detener` a
`preguntar` en el tope (y la tabla lo asevera). Un «si» encadena review sin
corregir y `taskctl review` abre la ronda 4 sobre el mismo commit.

### IMP-3 — La guarda leida desde la rama de la tarea no tiene red

Mutante «guarda siempre verdadera leyendo desde la rama»: sobrevive en
`siguiente.test` y `automatico.test`. El comportamiento es correcto hoy.

### MEN-1 — El codigo bajo `tareas/` no cuenta como codigo
### MEN-2 — `aprobada-con-correcciones` en automatico no dice que hacer con los MENOR
### MEN-3 — El paso 4 de start condiciona sobre `siguiente` antes de ejecutarlo

### Comprobado y correcto

Merge de la base por `taskctl review` (no rompe ni abre la guarda); merge de
develop con codigo tras el informe (preguntar, lado seguro); lectura desde
develop; worktree enlazado; `core.autocrlf`; rondas fragmentadas con el tope;
manual sin cambios. Mutantes muertos: sin `git status`, sin ficheros tocados,
sin `isAncestor`, tope `>`, automatico como semi, trabajo pendiente detener.
