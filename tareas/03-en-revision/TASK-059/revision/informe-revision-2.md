# Informe de revision — TASK-059 (ronda 2)

- Commit revisado: 08977c80ffc447842eb363168c0d7317a8a2aec7
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-059 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| CRIT-1 | CRITICO | corregido | src/commands/siguiente.ts:74-93 (`informeEnCommitPropio`) |
| IMP-1 | IMPORTANTE | corregido (riesgo residual documentado y aceptado) | src/commands/siguiente.ts:58, 192-194 |
| IMP-2 | IMPORTANTE | corregido | src/core/flujo.ts:101-110 |
| IMP-3 | IMPORTANTE | corregido | test/commands/automatico.test.ts |
| MEN-1 | MENOR | aceptado | src/commands/siguiente.ts (`:(exclude)tareas/`) |
| MEN-2 | MENOR | corregido | skills/review/SKILL.md paso 4 |
| MEN-3 | MENOR | corregido | skills/start/SKILL.md pasos 4-5 |
| MEN-4 | MENOR | corregido | src/commands/siguiente.ts:86-91 |
| MEN-5 | MENOR | corregido | src/core/flujo.ts:224, skills/task-workflow/avance.md:68-70 |
| MEN-6 | MENOR | corregido | src/commands/siguiente.ts:58 y 192-194 |
| MEN-7 | MENOR | corregido | src/commands/siguiente.ts:84 |

### Puerta determinista

Clon temporal, `npm install && npm test` una vez: 1055 tests, 1052 verdes,
los 3 rojos conocidos de Windows. `dist` sincronizado.

### Lo critico

Con el CLI real y el layout normal no hay ningun camino por el que el
automatico mergee codigo que el revisor no vio: ciclo normal (continuar);
ronda 2 incremental con el fix cubierto por su `Commit revisado`; fix
posterior al `review` de la ronda (preguntar); peticion sin `Commit revisado`
(preguntar); renombre de codigo hacia `tareas/` (preguntar); develop integrado
por `review` (el merge es el `Commit revisado`: continuar, correcto); develop
integrado despues de la revision (preguntar); lectura desde develop; codigo
sin commitear (finish aborta); CRLF. Semi y manual sin cambios (tope en semi =
detener). Mutantes muertos: sin comparar con lo revisado, sin plantilla, sin
`git status`, rama con revisado falso, semi preguntando en el tope.
Sobreviven: «el informe tiene algun commit desde lo revisado» (MEN-4) y la
ancestria del revisado (ya aceptado).

### MEN-4 — La condicion «cada informe se escribio despues» es siempre verdadera

El commit de la peticion crea el informe y es hijo del `Commit revisado`.
Proteccion real: el diff vacio y las marcas de plantilla.

### MEN-5 — El motivo y avance.md describen la guarda antigua

### MEN-6 — La plantilla se comprueba por marcas, no por contenido

(a) fila de ejemplo dejada con cero hallazgos → pregunta innecesaria; (b)
informe reescrito sin linea `Revisor:` → continuar.

### MEN-7 — El diff de la guarda solo mira el subarbol del cwd (latente)

Con el proyecto en un subdirectorio del repo, codigo fuera de el no aparece;
hoy no explotable porque `finish` falla en ese layout.

### Observacion

Desde develop `siguiente` da `finish` y `taskctl finish` aborta con un mensaje
equivoco porque lee la copia de develop: conviene que la skill lo diga.

## Correcciones (orquestador)

- MEN-4: comprobacion y comentario eliminados.
- MEN-5: motivo y avance.md describen la guarda real.
- MEN-6: se exige una linea `- Revisor:` rellenada y sin la fila de ejemplo;
  la skill review dice que la fila se borra aunque no haya hallazgos. Test
  (b) nuevo; su mutante muere.
- MEN-7: el diff usa `:(top)` y excluye `tareas/` desde la raiz.
- Observacion: la skill finish dice que se lance desde la rama de la tarea.
