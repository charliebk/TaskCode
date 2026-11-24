# Informe de revision — TASK-151b (ronda 1)

- Commit revisado: e6a09c1411fe4da225c614227893187ec3bb2ef4
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

No hay CRITICOS ni IMPORTANTES, solo MENORES. El clon quedo en 485955b, el commit de la peticion de revision: solo anade la peticion sobre e6a09c1 y el codigo es el mismo.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | test/commands/review-incremental.test.ts (assert `!nombres.includes('informe-revision-2.md')`) | implementacion |
| MEN-2 | MENOR | aceptado | src/commands/{finish,review,veredicto,codex-review,verificar-menores}.ts (idPedido) | implementacion |
| MEN-3 | MENOR | aceptado | test/hooks/salida-temprana.test.ts (NODE_DEBUG=esm) | plan |
| MEN-4 | MENOR | aceptado | test/cli/estado.test.ts (mock de process.stderr.write) | implementacion |
| MEN-5 | MENOR | aceptado | test/commands/doctor-correcciones.test.ts (limite 12 s) | implementacion |

Motivos de lo aceptado:
- **MEN-2:** los cinco comandos pasan por la misma rama de `assertTransitionAllowed`, que ya esta cubierta por los tests de approve, plan y start. Un test por comando seria duplicacion.
- **MEN-3:** el control positivo hace que el test falle en rojo, y no pase vacio, si cambia la traza de Node.
- **MEN-4:** el mock solo dura el `await mainEstado(...)` y se restaura en un `finally`.
- **MEN-5:** el revisor no ha podido reproducir un falso rojo. Si aparece, se sube el limite a 20 s, que sigue por debajo de los 30 s del sleep.

### Reproduccion

**Verificacion de la ronda.** La peticion ya trae la verificacion selectiva en verde (831 tests, 0 fallos, 2 omitidos), asi que no se repite la suite. En el clon se compilo y se corrio por separado cada fichero tocado: estado 8/8, approve 18 y 1 omitido (el symlink), doctor-correcciones sin omitidos, salida-temprana 4/4, y los casos tocados de review-incremental y doctor-deploy.

**Mutacion sobre `dist/src`.** Con cada mutante el test cae en rojo, y vuelve a verde al restaurarlo:

| Mutante | Test que cae en rojo |
|---|---|
| M6 | doctor-deploy, «deteccion de tipos» |
| M7 | review-incremental, «si una escritura de la ronda falla» |
| M8 | review-incremental, «si una escritura de la ronda falla» |
| M9 | salida-temprana, criterio 2 |
| M10 | estado, «flag desconocido» |
| TCMD-01 (sin timeout) | doctor-correcciones, «git status que no responde» (sin omitirse) |
| `'(desconocida)'` en lugar del ID | start-basico, «error claro si el ID no existe» |

**Mock de `writeFile`.** La restauracion es correcta: va en el `finally`, con un segundo `syncBuiltinESMExports`. node:test ejecuta en serie los tests de un fichero.

**Limite de 12 s.** Es razonable frente a los 1,5 s pedidos y los 30 s del sleep. Quien decide el skip es la sonda aparte.

**NODE_DEBUG=esm.** No es estable entre versiones de Node, pero falla de forma segura gracias al control positivo.

**idPedido.** Se pasa en los doce puntos de llamada, menos en `finish.ts:396`, donde la tarea nunca es null.

**MEN-1.** El assert sobre el informe es trivial: el mock lanza antes de escribirlo. Lo que protege el rollback es comprobar que no queda la peticion.

## Regla 4D

- **Duplicacion:** cumple. Se reutilizan `porcelain` y `git`, e `idPedido` va en el `TransitionContext` existente.
- **Desviacion:** cumple. El cambio en `src` esta justificado por el endurecimiento de TCMD-03.
- **Diluvio:** cumple.
- **Disfraz:** cumple. Los mutantes caen en rojo. Queda MEN-1, ya corregido.

## Lecturas fuera del contexto permitido

- Fragmentos de pre-tool-merge, guardia-merge, estado, deteccion-app y doctor, para aplicar los mutantes.
- `grep` de `assertTransitionAllowed(`.

## Entorno

El clon esta borrado y el repo original no se toco. El revisor escribio por error en `/tmp/x` y lo borro despues.
