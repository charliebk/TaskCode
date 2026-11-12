---
id: TASK-109
titulo: "Verificacion proporcional B6: documentacion y limpieza del nivel 2"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-109-verificacion-proporcional-b6-documentaci
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2619616
tokens_implementacion: 17040744
tokens_revision: 22326212
creado: 2026-11-11
actualizado: 2026-11-12
dependencias: [TASK-107, TASK-108]
---
## Objetivo

Sexta y ultima parte de TASK-096; hasta cerrarla no se publica version. skills/task-workflow/verificacion-selectiva.md, README y CHANGELOG explican el principio de coste proporcional al cambio y como lo declara un proyecto (rutas_verificacion_parcial leida de la base, lista de permitidas, timeout de la selectiva, cobertura omitida, release y hotfix a la completa, el guardian sigue exigiendo la completa para codigo y por que un merge a mano tras un fallo queda bloqueado). La decision sobre TASK-091 queda escrita. Aviso de doctor si procede, el Ejemplo del error de forma de rutas_verificacion_parcial en validarPatronesExclusion (hoy sale el de excluir_de_revision; nota de la revision 2 de TASK-096), codigo sin uso borrado y motivo de cada test que cambio de expectativa en las partes B1..B5. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [x] verificacion-selectiva.md, README y CHANGELOG explican el principio y la clave, sin marcas de este repo; la prueba de la guia asevera el contrato literal y se pone roja si se borra la seccion
- [x] La decision sobre TASK-091 y lo que se retira quedan escritos; el codigo que quede sin uso se borra — inventariado: nada que borrar (ver Resultado)
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T01:00:33Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T01:07:27Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T01:07:29Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T08:38:03Z | review | automatico | persona | 0.14.0 |
| 2026-11-12T09:43:52Z | review | automatico | persona | 0.14.0 |
| 2026-11-12T09:51:53Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T01:07:18Z | diseno | agente:ab9dce27ad2cc99c6 | 66 | 112841 | 2487864 | 18845 | 49 | 2619616 | - | - |
| 2026-11-12T08:38:03Z | implementacion | sesion:b4e87bc9-9df0-4298-9beb-5107e454beff | 118 | 392329 | 15880033 | 34141 | 13 | 16306621 | - | - |
| 2026-11-12T08:38:03Z | implementacion | agente:a4ba4897b4f6e1923 | 16 | 105039 | 622112 | 6956 | 0 | 734123 | - | - |
| 2026-11-12T09:09:34Z | revision | agente:a0fc40ccd12fd6280 | 240 | 228563 | 20207547 | 53219 | 25 | 20489569 | 1 | - |
| 2026-11-12T09:51:39Z | revision | agente:a05ea5e796dd1bb8f | 34 | 119227 | 1699856 | 17526 | 3 | 1836643 | 2 | - |

## Autorrevision

- code-quality-reviewer — adc87aa
- code-quality-reviewer — 5ee2706

## Resultado

Implementado (rama feature/task-109-verificacion-proporcional-b6-documentaci), ultima parte de TASK-096:

- `src/core/config.ts`: el error de forma de cada clave de patrones trae su propio ejemplo (`EJEMPLO_PATRONES`, un `Record` por clave: el tipo obliga a darlo al anadir una). Antes `rutas_verificacion_parcial` y `contexto_revision` recibian el de `excluir_de_revision`. Tabla de cabecera actualizada.
- `src/commands/doctor.ts`: con el nivel 2 activo, el `ok` dice que `finish` integra con la selectiva si todo el codigo cae en esas rutas y que un merge a mano sigue exigiendo la completa; con `rutas_verificacion_parcial` sin `rutas_documentacion`, `aviso` en una linea con su arreglo (la clave no tendria efecto). D1 del plan resuelta asi (lo pedia el enunciado); la alternativa de que la config aborte queda anotada para revisarla con la persona.
- Documentacion: seccion nueva «Codigo parcial» en `skills/task-workflow/verificacion-selectiva.md` (principio de coste proporcional al cambio, lista de rutas permitidas leida de la base, exigencias, anotacion, reutilizacion del memo, cobertura, release y hotfix, guardian y remedio tras un conflicto) y reescritos los pasajes que decian que la completa es siempre la puerta; `SKILL.md` (sigue bajo 15 KB tambien con CRLF), README del plugin (subseccion nueva, doctor, finish), CHANGELOG raiz (parrafo del nivel 2) y `docs/ROADMAP.md`.
- `src/hooks/guardia-merge.ts`: el remedio del mensaje de bloqueo (TASK-108) se corrige con IMP-2 de la revision.
- Tests: config (ejemplo por clave), doctor (ok y aviso), guia (seccion extraida con sus marcas de contrato y sin marcas de este repo; comprobado que se pone roja si se borra la seccion), SKILL.md y el texto del guardian.

**Decision sobre TASK-091** (del plan de TASK-096, escrita en la guia y el CHANGELOG): por defecto la completa sigue siendo la puerta de integracion; declarar `rutas_verificacion_parcial` es la revision explicita de esa regla para el proyecto. Se retiran, solo en ese caso, el texto de `finish` «aunque las rondas usaran la selectiva» y la frase de la guia «Antes de integrar se exige siempre la completa». El guardian no acepta la selectiva (TASK-108).

**Codigo sin uso**: inventario de los exports anadidos o tocados desde el merge de TASK-096 (`git diff` de `src/` y consumidores en `src/`): `SECCION_VERIFICACION_PARCIAL`, `anotarCompletaTrasParcial`, `anotarVerificacionParcial`, `comandoParcial`, `contextoSelectiva`, `huellaDeCommit`, `parcialDeclarada`, `patronesParcial`, `resolverCommits`, `rutasDelArbolFueraDe`, `rutasFueraDe`: todos con consumidor de produccion (los dos de un solo fichero se usan dentro y se exportan para los tests). Nada que borrar. Las ramas `!docs` de `decidirVerificacion` (MEN-3) son defensa de la funcion pura y se quedan.

**Tests con expectativa cambiada en B1..B6** (comprobado con `git diff` de `test/` en cada merge): B1 (TASK-096), B2 (TASK-105), B4 (TASK-107) y B5 (TASK-108), ninguno; B3 (TASK-106), `finish-documentacion.test.ts` «con el nivel 2 finish sigue con la completa» pasa a esperar la selectiva, que es el cambio de esa parte; B6 (esta), la marca de la guia `/Antes de integrar se exige siempre la completa/` pasa a la frase nueva (completa por defecto y excepcion declarada), porque el contrato cambio.

**Suite**: 2223 tests, fallan solo los 3 conocidos de Windows. Una pasada se corto con la sesion (procesos que salian con 0xC0000142 al no poder arrancar) y otra marco el limite de 15 KB de SKILL.md con CRLF; ambas resueltas.

**Revision por pares**:
- Ronda 1 (sonnet, cambios-solicitados): IMP-1 (la guia prometia que la cobertura se mide en la completa del release; la puerta del release solo mide lo que anade la rama release), IMP-2 (el remedio «resuelve y relanza finish» no verifica si el conflicto se cierra en la rama de integracion: el reintento entra por el camino idempotente; tambien en el mensaje del guardian), MEN-1 (el hotfix de solo documentacion conserva su camino), MEN-2 (frases del README y del CHANGELOG), corregidos en 5ee2706; MEN-3 y MEN-4, aceptados.
- Ronda 2 (haiku, aprobada): los cuatro hallazgos corregidos verificados contra el codigo, 2 mutantes muertos, sin hallazgos nuevos.

**Pendiente fuera de esta tarea** (propuesto como tarea nueva): `finish`, en su camino idempotente, cierra sin ninguna verificacion si un conflicto se resolvio cerrando el merge en la rama de integracion; con o sin nivel 2. Y con el nivel 2 y `umbral_cobertura`, las lineas de una tarea integrada con la selectiva no se comparan con el umbral en ningun sitio.

## Duracion

- Estimada: 90 min
- Real (de la rama abierta al cierre con merge, sin pausas): 524 min
- Paso de la hora: 524 min reales frente a 90 estimados
