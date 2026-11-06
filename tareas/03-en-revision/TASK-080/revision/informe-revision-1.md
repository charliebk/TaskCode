# Informe de revision — TASK-080 (ronda 1)

- Commit revisado: d49d92500e05ab07b896ac4b6e398cd7efb12839
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-080 aprobada | aprobada-con-correcciones | cambios-solicitados)

(El revisor propuso `aprobada-con-correcciones`; con un IMPORTANTE abierto y modo automatico, quien orquesta lo registra como `cambios-solicitados`: el codigo que se mergea tiene que ser el revisado.)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/cli.ts:591 (`printAvisos(..., ...result.avisosRoles)`) | implementacion |
| MEN-1 | MENOR | abierto | src/cli.ts:283-290 (`brainstormNotice`, aviso de discrepancia) | implementacion |
| MEN-2 | MENOR | abierto | src/commands/plan.ts:487-492 (texto del aviso `avisosRoles`) | implementacion |
| MEN-3 | MENOR | abierto | skills/angular-vue-reviewer/SKILL.md (Accesibilidad y Clasificacion) | implementacion |
| MEN-4 | MENOR | abierto | src/commands/approve.ts:287-289 (`planEsPlantilla`) | plan |
| MEN-5 | MENOR | abierto | agents/brainstorm-{arquitectura,riesgos,testing,dominio}.md | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-080-r1`, borrado al terminar; el repo original no se toco.

## Puerta determinista

- `npm install` y `npx tsc -p .` sin errores; el `dist/` versionado coincide con lo que compila `src/`.
- `npm test` (una ejecucion): 1895 tests, 1892 pasan, 3 fallan, 0 cancelados. Los tres rojos son los conocidos de Windows (symlink EPERM en approve, chmod de directorios en plan, CRLF en plan). Ningun cuarto rojo.

## IMP-1 — La salida por pantalla del aviso "rendimiento no entra" no tiene ningun test

La persona decidio que `taskctl plan` avise en su salida cuando la etiqueta pediria rendimiento y no entra. `plan.ts` lo devuelve en `avisosRoles` y los tests nuevos lo miran en el resultado de `runPlanCommand`, pero la unica linea que lo muestra (`printAvisos(..., ...result.avisosRoles)` en `cli.ts`) no la ejecuta ningun test. Mutante M9: quitar `, ...result.avisosRoles` de `src/cli.ts`, compilar y correr `dist/test/cli/*.test.js` y `dist/test/commands/plan.test.js`: solo los rojos de linea base; el mutante sobrevive. Arreglo propuesto: un test que lance `bin/taskctl plan` con `spawnSync` sobre una tarea `simple` + `wasm` y compruebe que stderr contiene `pediria el rol rendimiento`.

## MEN-1 — El aviso de discrepancia dice un numero de roles que no es el que se lanza

`brainstormNotice` usa `result.resolucion.agentes` (N de la escalera, sin condicionales). Con el CLI real, `simple` + `wasm` + palabras de riesgo:

```
Complejidad declarada "simple", heuristica "critica" (8 puntos): se lanzan 4 roles, el mayor de los dos.
Brainstorm ronda 1, 5 roles en paralelo.
```

Deberia usar `result.roles.length` o aclarar "4 de la escalera mas rendimiento".

## MEN-2 — El aviso aconseja "sube la complejidad" donde no sirve

`hotfix` + `critica` + `wasm` lanza solo arquitectura (`agentes_brainstorm_hotfix: 1`); el aviso termina con "Si hace falta, sube la complejidad.", que en un hotfix no cambia nada.

## MEN-3 — La severidad de accesibilidad fijada en el plan no quedo escrita en la skill

El plan dice que CRITICO queda para fallos verificables que dejan inoperable un control (trampa de teclado, dialogo sin nombre ni foco gestionado). La skill solo escribe lo negativo ("contraste no verificable, nunca CRITICO"); `## Clasificacion de los hallazgos` no cambio y una trampa de teclado (2.1.2) no aparece en ninguna clase.

## MEN-4 — Candidatas de `planEsPlantilla` por etiquetas redundantes con el disco

Mutante M11 (quitar `seleccionarRolesDeTarea(k, task.etiquetas)` de `planEsPlantilla`) no pone rojo ningun test: con la lectura del disco esas candidatas solo aportan si alguien borra `planificacion/brainstorm/`. Quitar o cubrir con un test que borre la carpeta antes de aprobar.

## MEN-5 — Los roles de la escalera siguen diciendo "uno de los cuatro puntos de vista"

Con rendimiento pueden lanzarse 5. `brainstorm-arquitectura.md` (lineas 9 y 60), `brainstorm-riesgos.md:9`, `brainstorm-dominio.md:9` y `:45` siguen diciendo "cuatro". Cosmetico: la peticion generada lista a los companeros reales.

## Lo que se probo y funciona

| Mutante | Resultado |
|---|---|
| M1 quitar `.toLowerCase()` | 3 rojos |
| M2 quitar `.trim()` | 1 rojo |
| M3 quitar el corte `MIN_ROLES_PARA_CONDICIONALES` | 2 rojos |
| M4 `>=` por `>` en `condicionalesDescartados` | 6 rojos |
| M5 `avisosRoles` siempre vacio | 1 rojo |
| M6 `plan.ts`: `TODOS_LOS_ROLES.filter` -> `ROLES_BRAINSTORM.filter` | 6 rojos |
| M7 `plan.ts`: `TODOS_LOS_ROLES.find` -> `ROLES_BRAINSTORM.find` | 5 rojos |
| M8 `plan.ts`: volver a `seleccionarRoles(resolucion.agentes)` | 6 rojos |
| M10 `planEsPlantilla` sin lectura del disco | 1 rojo |
| M9 quitar la salida del aviso en `cli.ts` | sobrevive (IMP-1) |
| M11 sin candidatas por etiquetas | sobrevive (MEN-4) |

Escenarios de borde con repo Git temporal real: etiqueta anadida entre rondas (ronda 2 relanza con 3 roles; approve rechaza la plantilla vacia); etiqueta quitada entre rondas (reutiliza la ronda 1 y el unificador sigue listando `salida-brainstorm-rendimiento-1.md — rol rendimiento`); plantilla vacia de `critica` + `3D` (`planEsPlantilla` true, false con una linea real); `taskctl siguiente` sobre plantilla vacia con `wasm` da `fase: plan, accion: detener`; `hotfix` no lanza rendimiento y avisa; grep de marcas del repo sobre los agentes nuevos o tocados, limpio; criterios WCAG 2.2 citados correctos y `patrones_archivo` sin cambios.

Diferencia menor con el plan, sin consecuencias: el plan decia que `approve` deduce los roles de la ultima ronda en disco; la implementacion junta los juegos de todas las rondas, mas permisiva y segura. Anotar en el Resultado.

## Resumen

Sin CRITICOS. Un IMPORTANTE (IMP-1) y cinco MENORES. La logica central esta bien cubierta por mutacion.
