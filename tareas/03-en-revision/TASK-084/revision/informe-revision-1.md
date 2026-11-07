# Informe de revision — TASK-084 (ronda 1)

- Commit revisado: 37185ea499e4b841a74fc497ef22c1288148bd2c
- Revisor: general-purpose (sonnet) + code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-084 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | test/core/versiones-metricas.test.ts (compararVersiones, src/core/versiones-metricas.ts) | implementacion |
| MEN-2 | MENOR | abierto | test/core/transiciones.test.ts (ampliarCabecera, src/core/transiciones.ts) | implementacion |
| MEN-3 | MENOR | aceptado | src/core/transiciones.ts (ampliarCabecera, SEPARADOR_4_RE) | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

**Puerta determinista.** Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-084-r1`, rama de la tarea, `npm install` y `npm run build` limpios. `npm test` una sola vez: 1914 tests, 1911 pasan, 3 fallan. Los tres son los conocidos de Windows, sin regresiones:
- `approve: propaga cualquier error de stat que NO sea ENOENT` (symlink EPERM)
- `plan: propaga cualquier error de escritura que NO sea EEXIST` (chmod)
- `plan: la rama base real tiene la tarea en un estado distinto...` (CRLF)

No hay ningun cuarto rojo.

**Casos que intente romper (codigo compilado y CLI real)**
- Lectura de tablas de 4 y 5 columnas: las filas de 4 celdas se leen con `version: null` y siguen congelando el modo. Una celda con `ayer`, `v0.12.0` o vacia deja la fila sin version pero no la descarta. Una fila de 6 celdas se ignora, como antes.
- Reescritura de cabecera:
  - Solo cambian la cabecera y el separador. Las filas de datos quedan byte a byte iguales, tambien con texto libre y `## Resultado` detras.
  - CRLF se conserva sin mezclar LF.
  - Un texto con pipes antes de la tabla no se confunde con la cabecera.
  - Una tabla sin cabecera no se toca.
  - Una cabecera sin barras en los extremos no se reescribe.
  - Una cabecera ya de 5 no se vuelve a tocar.
  - Un bloque de codigo con una cabecera de 4 columnas despues de la tabla real no se toca.
- `versionDeCierre`: cuenta el ultimo `finish`. Si ese ultimo no lleva version, o la celda es invalida, devuelve `null` y no hereda la del anterior, como decidio el plan.
- Orden semver comprobado con 13 versiones mezcladas: `0.9.0 < 0.10.0 < 0.12.0-1 < -alpha < -alpha.1 < -alpha.beta < -dev < -dev.2 < -dev.10 < -rc.1 < 0.12.0 < 1.0.0-rc.1 < 1.0.0`. Correcto.
- CLI real sobre las 66 tareas terminadas del propio repo (todas de 4 columnas):
  - `metricas --por-version` las manda todas a «sin version» (66), con el grupo de versiones vacio. No deduce nada por fecha.
  - `--por-version --json` devuelve las claves `proyectos`, `sinCoste` y `porVersion`, sin NaN.
  - `--por-version` se combina bien con `--evolucion`, `--grupos` y `--repo`, tambien con `--json`.
  - Abortan con `rc=1` y mensaje claro: `--heuristica`, `--tokens`, `--escribir`, `--por-version` repetido, `--por-version=1` y `--tramo` sin `--evolucion`.
  - Sin `--por-version`, la salida `--json` no gana ninguna clave (lo fija un test; el diff de `commands/metricas.ts` es solo aditivo).
- `skills/`: el diff no anade ninguna mencion a TaskCode. Los tests de distribucion pasan.
- `VERSION_TASKCTL`, `package.json`, `plugin.json` y `marketplace.json` estan en 0.12.0, con test de alineacion nuevo.

**Mutantes** (tests de `transiciones`, `versiones-metricas`, `metricas-version`, `metricas` y `empaquetado/metadatos`):

| Mutante | Resultado |
|---|---|
| M1: quitar `ampliarCabecera` | detectado (2 rojos) |
| M2: leer solo filas de 5 celdas | detectado (8 rojos) |
| M3: usar el primer `finish` | detectado (3 rojos) |
| M5: invertir la pre-release | detectado (1 rojo) |
| M7: no validar la celda de version | detectado (7 rojos) |
| M4: comparacion de pre-release por longitud (`dev` frente a `dev.2`) a `0` | sobrevive |
| M9: no saltar los bloques de codigo al buscar la cabecera | sobrevive |
| M6: quitar el filtro `rondas === null` en la suma de hallazgos | sobrevive (equivalente: sin rondas tampoco hay tabla de hallazgos) |
| M8: quitar la guarda `enBloque[i+1]` | sobrevive (equivalente: una valla no puede ser un separador) |

**MEN-1.** El test de orden semver pasa `0.12.0-dev` antes de `0.12.0-dev.2` y `-dev.10`, que ya es su orden correcto. Un `Array.sort` estable lo deja igual aunque la comparacion de longitudes de pre-release valga siempre 0: el tramo `ia.length - ib.length` no tiene red de regresion (M4 sobrevive). Arreglo: meter esos tres en orden inverso en la entrada del test.

**MEN-2.** El test de «cabecera dentro de un bloque de codigo» pone el bloque despues de la tabla real. Con el bloque antes, la proteccion `enBloque[i]` de `ampliarCabecera` no esta cubierta (M9 sobrevive). El codigo actual si lo protege; falta el caso inverso en el test.

**MEN-3.** `SEPARADOR_4_RE` acepta separadores con alineacion (`|:--|:-:|--:|---|`) y los reescribe a `|---|---|---|---|---|`, perdiendo la alineacion. Inocuo (las columnas del registro son texto sin formato) y dentro de «cabecera y separador cambian». Se acepta; conviene dejarlo escrito en el comentario del contrato.

Sin hallazgos CRITICOS ni IMPORTANTES. Los tres puntos que el plan dejo abiertos estan cubiertos y probados: la cabecera solo se amplia una vez, las filas viejas no se tocan y el grupo «sin version» nunca se deduce por fecha.

**Limpieza.** Clon y artefactos temporales borrados.
