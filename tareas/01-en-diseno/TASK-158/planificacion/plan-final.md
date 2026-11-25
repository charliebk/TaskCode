# Plan — TASK-158: Regla 4D preventiva en todos los procesos que crean o actualizan codigo

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador sin lanzar los tres roles ni el unificador. Las salidas de rol
quedan sin rellenar a proposito.)

## Enfoque propuesto

Duracion estimada: 150 min (de la rama abierta al cierre con merge; senales: 4 ficheros de codigo previstos —`core/autorrevision.ts`, `commands/review.ts`, `commands/verificar-menores.ts`, `scripts/verificar-impacto.mjs`—, unos 10 `.md` de skills y agentes, 3 capas —texto de skills/agentes, comandos de taskctl, script de la raiz—, 5 criterios)

La regla existe hoy en tres puntos (TASK-137 y TASK-153): `start` pide la
autorrevision 4D una vez por tarea, `approve` avisa si el plan no dice que
reutiliza, y las revisoras la comprueban. Faltan: los roles del brainstorm
(salvo el unificador), las correcciones de cada ronda, los MENORES tras
aprobar, y en todos los caminos la exigencia de Carlos de **buscar todos los
usos antes de dar una duplicacion por resuelta, no solo los citados**.

### Inventario de caminos que crean o actualizan codigo (criterio 1)

| Camino | Que exige hoy de 4D | Que le falta |
|---|---|---|
| `plan` (skill) + roles del brainstorm (arquitectura, riesgos, testing, dominio, rendimiento) | Solo arquitectura pide reutilizar el helper; el resto nada | Cada rol: apartado 4D de su punto de vista (dup., desv., diluvio, disfraz) y buscar todos los usos |
| Unificador | `## Reutilizacion (Regla 4D)` con lo buscado | Que lo buscado sea por todos los usos, no solo el primero |
| `taskctl plan` / `approve` | Plantilla con la seccion de reutilizacion; `approve` avisa si va vacia | Nada (ya cubierto por TASK-153) |
| `start` (implementacion; vale para feature, fix y hotfix, que pasan por start) | Autorrevision 4D: helper buscado, criterio citado, tests mutados; `review` avisa si falta la linea | «Buscar todos los usos» al reutilizar o eliminar una duplicacion |
| Correcciones de cada ronda (`review`, paso 4) | Nada: la autorrevision se pide una vez por tarea | Autorrevision 4D por ronda corregida (`- 4D ronda K — ...`) y aviso de `review` al abrir la ronda K+1 si falta |
| MENORES tras aprobar (`verificar-menores`) | Nada | Autorrevision 4D de las correcciones (`- 4D menores — ...`) y aviso de `verificar-menores` si falta |
| Hotfix y release (`finish`) | Hotfix pasa por start: hereda; release solo sube version y notas | Hotfix: nada mas. Release: nada (no escribe codigo); se deja escrito en el inventario |
| `doctor-deploy` y `revisor-seguridad-deploy` | No escriben codigo: crean tareas que pasan por plan y start | Nada; heredan. Se deja escrito |
| Skills revisoras (4 de dominio + generica) | Ejemplo por D y remision a revision.md | Al dar una duplicacion por resuelta, comprobar todos los usos (grep), no solo los citados: va en revision.md, que todas citan |
| `scripts/verificar-impacto.mjs` (freno, review, finish) | — | Carrera: devuelve la copia de dist/src aunque HEAD haya cambiado (criterio 5) |

## Reutilizacion (Regla 4D)

- `tieneLinea4D` / `avisoAutorrevision` — `src/core/autorrevision.ts` — se generalizan con la ronda (`- 4D ronda K`) y las de menores; nada nuevo en paralelo.
- `contenidoDeSeccion` — `src/core/transiciones.ts` — lectura de `## Autorrevision`.
- `seccion()` y `faltanD()` — `test/skills/regla-4d.test.ts` — los tests de texto de los nuevos caminos van en ese mismo fichero.
- `git()` y `conDistProtegido` — `scripts/verificar-impacto.mjs` — se anota HEAD al tomar la copia y se compara al devolverla.
- Nuevo: ninguna funcion paralela. Si hace falta un helper de «linea 4D con prefijo», se parametriza `tieneLinea4D`, no se copia.

## Troceo

### Parte a: los textos de cada camino exigen 4D y buscar todos los usos
revision.md (Regla 4D: todos los usos antes de dar una duplicacion por
resuelta; correcciones y MENORES pasan la misma autorrevision), start,
review (paso 4: autorrevision por ronda y antes de verificar-menores), los
cinco roles del brainstorm y el unificador, y el inventario en la tarea.
Duracion estimada: 55 min
- [ ] Hay un inventario en la tarea de cada camino que crea o actualiza codigo, con que exige hoy de 4D y que le falta
- [ ] La skill o el agente de cada camino del inventario exige 4D al escribir, incluido buscar todos los usos antes de dar una duplicacion por resuelta
- [ ] Un test por camino (skills y agentes) falla si ese camino deja de exigir 4D

### Parte b: taskctl comprueba la autorrevision 4D por ronda y en los MENORES
`review` avisa al abrir la ronda K+1 si `## Autorrevision` no trae
`- 4D ronda K — <commit>: ...`; `verificar-menores` avisa si no trae
`- 4D menores — <commit>: ...`. Avisos, no bloqueos (como el de TASK-153:
las tareas viejas no se atascan).
Duracion estimada: 55 min
- [ ] Las correcciones de una ronda de revision y los MENORES corregidos pasan por la misma exigencia 4D que la implementacion (autorrevision 4D por ronda y por correccion)
- [ ] Un test por comando (review en ronda 2, verificar-menores) falla si deja de avisar

### Parte c: verificar-impacto no devuelve dist/src si HEAD cambio
Al tomar la copia se anota HEAD; al devolverla, si HEAD es otro, no se
devuelve la copia: dist/src se deja como lo dejo el checkout nuevo
(restaurado desde HEAD) y se avisa.
Duracion estimada: 40 min
- [ ] verificar-impacto no devuelve la copia de dist/src si HEAD cambio durante la ejecucion (carrera del freno con update-fix vista en TASK-145b)

Troceo sin preguntar: Carlos autorizo el 2026-11-22 trocear las tareas de
mas de 1 h de las correcciones 4D sin consultarlo.

## Desacuerdos entre roles, y como se resuelven

Sin roles (modo rapido). Decision del coordinador: avisos y no bloqueos en
la parte b, por coherencia con TASK-153 y para no atascar tareas en curso.

## Riesgos aceptados y que los contiene

- Los avisos se ignoran — los contiene la revision independiente, que ya mira la Regla 4D en cada ronda.
- Tests de texto fragiles ante una redaccion distinta — se busca la frase clave minima («todos los usos», «Regla 4D»), no parrafos enteros.
- Los textos se instalan en otros proyectos — no pueden citar TaskCode ni sus rutas (lo vigila `skills/task-workflow.test`).
- Parte c: restaurar desde HEAD podria pisar un dist/src sin commitear de otro proceso — solo ocurre si HEAD cambio, caso en que la copia ya es de otra rama; se avisa con la ruta.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- a, criterio 1 (inventario): 0 tests; es texto de la tarea, lo comprueba el revisor.
- a, criterio 2 y 3: 3 tests en `test/skills/regla-4d.test.ts` (revision/start/review; los cinco roles; el unificador) — sin pesados.
- b: 2-3 tests (`core/autorrevision` con ronda y menores; `review` en ronda 2 contra repo temporal; `verificar-menores`) — sin pesados.
- c: 1-2 tests contra un repo temporal real que cambia de rama durante `conDistProtegido` — sin pesados.

## Lo que necesita decision de una persona

Nada abierto: troceo autorizado (2026-11-22) y modo rapido (2026-11-12).
