# Informe de revision — TASK-080 (ronda 2)

- Commit revisado: 848ea1b (revision incremental desde d49d92500e05ab07b896ac4b6e398cd7efb12839)
- Revisor: code-quality-reviewer (agente general-purpose independiente, modelo sonnet)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-080 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/cli.ts:599 (`printAvisos(..., ...result.avisosRoles)`) | implementacion |
| MEN-1 | MENOR | corregido | src/cli.ts:283-296 (`brainstormNotice`) | implementacion |
| MEN-2 | MENOR | corregido | src/commands/plan.ts (aviso `avisosRoles`) | implementacion |
| MEN-3 | MENOR | corregido | skills/angular-vue-reviewer/SKILL.md (Clasificacion) | implementacion |
| MEN-4 | MENOR | corregido | src/commands/approve.ts:288 (`planEsPlantilla`) | plan |
| MEN-5 | MENOR | corregido (restos en MEN-6) | agents/brainstorm-*.md | implementacion |
| MEN-6 | MENOR | aceptado | agents/brainstorm-{arquitectura,dominio,riesgos,testing}.md | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRITICOS ni IMPORTANTES nuevos. Ninguna correccion introduce un fallo nuevo.

## Puerta determinista

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-080-r2` y copia para mutantes, ambos borrados; repo original sin tocar.

- `npm install` y `npx tsc -p .` sin errores; `dist/` versionado coincide con lo compilado.
- `npm test` (una ejecucion): 1898 tests, 1895 pasan, 3 fallan (los conocidos de Windows: symlink EPERM, chmod de directorios, CRLF). Ningun cuarto rojo.

## Verificacion de cada hallazgo

| Hallazgo | Comprobacion | Resultado |
|---|---|---|
| IMP-1 | M9: quitar `, ...result.avisosRoles` de `src/cli.ts`, recompilar, correr el test del binario | Muere (en la ronda 1 sobrevivia) |
| MEN-4 | M11: solo `seleccionarRoles(k)` en `planEsPlantilla` | Muere (test "sin la carpeta del brainstorm") |
| MEN-1 | Volver a terminar el aviso en "el mayor de los dos." | Muere (test del binario) |
| MEN-2 | Quitar la condicion `task.tipo === 'hotfix'` | Muere |
| MEN-3 | Lectura del diff | CRITICO incluye trampa de teclado verificable (2.1.2) y dialogo sin nombre ni foco; MENOR, contraste no verificable. Sin marcas del repo |
| MEN-5 | grep en los cuatro agentes | Corregidas las lineas senaladas; quedan los restos de MEN-6 |

`result.roles.slice(result.resolucion.agentes)` supone que la escalera es prefijo de `result.roles`, y lo es (`seleccionarRolesDeTarea` devuelve `[...base, ...condicionales]`).

## MEN-6 (MENOR, nuevo, no bloquea)

Quedan frases que suponen cuatro roles en paralelo: "Los otros tres miran..." (arquitectura:11, dominio:11, riesgos:11, testing:11) y "los cuatro roles arrancan a la vez" (riesgos:77, testing:74). Cosmetico: la peticion generada lista a los companeros reales. La nota de testing:137-146 describe la escalera de base y es correcta.

## Resumen

Sin CRITICOS. IMP-1 y MEN-1..MEN-4 corregidos de verdad (mutantes M9, M11 y los de MEN-1 y MEN-2 mueren). MEN-6 cosmetico, se anota en el Resultado. Recomienda aprobar.
