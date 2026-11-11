# Informe de revision — TASK-104 (ronda 1)

- Commit revisado: e6be4de6a86a0dc92912662e3f79fe4538705dbc
- Revisor: revisor independiente (agente general-purpose, skill code-quality-reviewer)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts (falta el test); src/commands/review.ts:~1060 (`baseFiable: baseDeTipoSinRed(tipoTarea)`) | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts (rama `catch` de `verificacionDeRonda`) / test/commands/review-documentacion.test.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

Entorno: clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-104-r1` (ya borrado), `npm install` + `npx tsc -p .` sin errores.

Resultados reales:
- `node --test dist/test/commands/review-documentacion.test.js dist/test/commands/verificacion-selectiva.test.js dist/test/hooks/freno-stop-documentacion.test.js`: 42 tests, 42 en verde, 0 fallos (corrido desde Git Bash).
- `npm run test:rapido`: 707 tests, 707 en verde.
- No corri la suite completa (ya corrida por el implementador: 2164 en verde, solo los 3 fallos conocidos de Windows).
- Nota de entorno, no es hallazgo: la primera vez corri los tests desde PowerShell y fallaron 17 porque `bash` resolvia al de WSL (`execvpe(/bin/bash) failed`). Con Git Bash en el PATH pasan todos.

Lectura del codigo contra los criterios de aceptacion:
- Criterios 1, 2, 3, 4 y 6: cumplidos y cubiertos por tests con repos temporales reales y un script de node que cuenta ejecuciones. La guarda temprana (sin selectiva devuelve null, sin ningun git nuevo) esta probada con `GIT_TRACE2_EVENT`. Sin `rutas_documentacion`, la peticion sale byte a byte como en la 0.14.0.
- Criterio 5: CHANGELOG, README y verificacion-selectiva.md explican Stop y review, la divergencia sin selectiva y el cambio de comportamiento para quien ya declaro `rutas_documentacion`.
- Review usa la misma `peticionDeTrabajo` y la misma `baseFiable` que Stop, sobre base...HEAD mas el arbol, nunca sobre el delta de la ronda. La ronda incremental con delta solo de documentacion y codigo en base...HEAD corre la selectiva (test 4).
- Los mensajes de rojo y de arbol sucio distinguen el tipo y el de documentacion no menciona `RAMA_BASE`.
- Los riesgos aceptados del plan (hotfix corre la selectiva, memo compartido con Stop) coinciden con lo implementado.

### MEN-1 — Falta el test de hotfix en review (mutante sobreviviente)
El plan de pruebas decia: «Stop y review dan la misma decision para el mismo diff, tambien en una rama de hotfix». El test 5 solo cubre feature; el hotfix solo esta probado en el lado de Stop.

Mutante: `baseFiable: baseDeTipoSinRed(tipoTarea)` -> `baseFiable: true` en `dist/src/commands/review.js`: `review-documentacion.test.js` 9 de 9 en verde. Sobrevive. Correccion sugerida: un test con una tarea `tipo: hotfix` y solo documentacion que compruebe que review corre la selectiva y que Stop elige lo mismo.

### MEN-2 — La rama `catch` de la decision no tiene test
`verificacionDeRonda` envuelve `peticionDeTrabajo` en un `try/catch` que cae a la selectiva con un aviso. El test 7 solo cubre `ConfigError`, que `peticionDeTrabajo` resuelve por dentro sin lanzar. Ninguna prueba llega al `catch`. Codigo defensivo correcto por lectura, sin evidencia empirica. Correccion sugerida: cubrirlo con un fallo real o documentar en el Resultado que se acepta sin test.

Mutante adicional que si se detecta: quitar el volcado de avisos de la decision hace fallar el test 7.

Mutante equivalente (no es hueco): `sinSelectiva: 'nada'` -> `'completa'` no cambia nada observable con la selectiva declarada.

No hay hallazgos CRITICOS ni IMPORTANTES.

## Lecturas fuera del contexto permitido

- `src/fs/decision-documentacion.ts`, `src/fs/verificacion.ts` y `src/fs/git.ts` (`baseDeTipoSinRed`, `rutasDelArbol`): dependencias directas de `review.ts`, para comprobar que comparte funcion y `baseFiable` con Stop y situar los mutantes.
- `tareas/01-en-diseno/TASK-102/planificacion/plan-final.md`: no existe en esa ruta; se uso el plan de TASK-104.

## Estado tras la ronda

- MEN-1: corregido. Test nuevo «Stop y review (TASK-104): en un hotfix de solo documentacion los dos corren la selectiva»; el mutante `baseFiable: true` ahora lo tumba.
- MEN-2: aceptado. `peticionDeTrabajo` no lanza por ningun camino alcanzable (la config de la base invalida la resuelve por dentro y `configDeRef` con una ref inexistente da la config por defecto): forzar el `catch` exigiria un doble, y la suite no usa mocks. Se deja como defensa en profundidad, documentada en el comentario de `verificacionDeRonda`.
