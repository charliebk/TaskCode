# Informe de revision — TASK-058 (ronda 1)

- Commit revisado: e2f340f26b327f7f3c8abe92d996e5ad86ae042f
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-058 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | skills/task-workflow/avance.md:66-85, src/commands/cadena.ts |
| IMP-2 | IMPORTANTE | abierto | skills/task-workflow/avance.md:59, src/core/flujo.ts:93 |
| IMP-3 | IMPORTANTE | abierto | skills/task-workflow/avance.md:61-63, skills/review/SKILL.md |
| IMP-4 | IMPORTANTE | abierto | skills/approve/SKILL.md:21-33, skills/task-workflow/avance.md:53-59 |
| IMP-5 | IMPORTANTE | abierto | skills/task-workflow/avance.md:77-79 y :89, skills de fase |
| MEN-1 | MENOR | abierto | test/skills/fases.test.ts:234-252 |
| MEN-2 | MENOR | abierto | src/commands/cadena.ts:63-67 y 116-118 |
| MEN-3 | MENOR | abierto (no verificado) | src/commands/cadena.ts:110 |

### Puerta determinista y lo ejecutado

Clon temporal, `npm install && npm test` una vez: 1038 tests, 1034 verdes;
los 3 rojos conocidos de Windows y uno de carga en `origin-deteccion` (fuera
del diff). Los 12 tests nuevos y el de skills pasan. Seis mutantes de
`cadena.ts` (sin `wx`, comprobar cualquier testigo, cerrar ajeno, umbral de
horas, bloqueo en el arbol, `--forzar` que no borra): todos muertos. Siguiendo
`avance.md` y las skills a mano en semiautomatico y automatico: ciclo, no en
approve, corte de sesion, error a mitad de cadena, dos sesiones en el mismo
arbol, 10 `abrir` en paralelo (gana uno), 40 iteraciones de abrir/cerrar.

### IMP-1 — El bloqueo no impide que una segunda sesion haga checkout: solo lo consulta `cadena abrir`

Ningun comando de fase mira el bloqueo y una skill sin `--cadena` no lo
comprueba. Reproducido: con la cadena de TASK-001 abierta por A, B hace
`start TASK-002` (checkout a su rama) y A, con su cadena valida, hace
`approve TASK-001`, que cambia el arbol de B a develop. Ademas la cadena se
cierra tras `start` y el arbol queda sin bloqueo durante la implementacion.

### IMP-2 — En `automatico`, `continuar` ya encadena hasta `finish` sin las guardas de E

`flujo.ts` da `continuar` para todo en automatico: con la revision aprobada,
`{"fase":"finish","accion":"continuar"}` mergea sin persona, sin el informe en
commit propio, sin tope de rondas ni contencion del veredicto autoescrito.

### IMP-3 — Tras `cambios-solicitados`, la cadena relanza review sobre el mismo codigo

`siguiente` da `review/continuar`; la skill review solo exige arbol
commiteado y suite en verde (se cumplen sin correcciones) y `taskctl review`
acepta el delta vacio y abre la ronda 2. Bucle de rondas.

### IMP-4 — El «no» dentro de approve no cierra la cadena

Tras el no, `siguiente` sigue en approve: en semiautomatico vuelve a
preguntar; en automatico se re-invoca en bucle (y deja el bloqueo huerfano).

### IMP-5 — Un error a mitad de cadena deja el bloqueo huerfano

`avance.md` dice que se cierra «en un error», pero su regla general y las
skills paran sin cerrar. Reproducido con el limite WIP en `start`: la sesion
siguiente encuentra «otra cadena» de la misma tarea muerta. Acostumbra a usar
`--forzar`.

### MEN-1 — Los cierres de la cadena en avance.md no tienen red

Sobreviven: quitar el cierre del «no», el de detener, reducir las
condiciones de cierre, borrar el parrafo de `comprobar`.

### MEN-2 — Un testigo vacio pasa `comprobar` y `cerrar` contra un bloqueo corrupto

### MEN-3 — `otro as Bloqueo` puede ser null en una carrera abrir/cerrar (no verificado)
