---
id: TASK-084
titulo: "Version del plugin en cada tarea y metricas por version"
tipo: feature
sprint: 0
etiquetas: [metricas, transiciones]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-084-version-del-plugin-en-cada-tarea-y-metri
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 709642
tokens_implementacion: null
tokens_revision: 3822549
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Para comparar versiones del plugin hubo que deducir la version por la fecha de cierre, y casi lleva a error. Anotar la version del plugin en cada transicion y agregar las metricas por version.

## Criterios de aceptacion
- [x] Cada linea nueva de ## Transiciones lleva la version de taskctl que la escribio; las lineas antiguas sin version se siguen leyendo
- [x] taskctl metricas --por-version agrupa las tareas terminadas por la version de su cierre con rondas, aprobadas a la primera, hallazgos por severidad y origen y tokens por fase, y acepta --json
- [x] Tests con repos Git temporales cubren tareas con y sin version anotada
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

Version del plugin en cada transicion y metricas por version, sin dependencias nuevas.

- **`src/core/version.ts`** (`VERSION_TASKCTL`): la constante sale de `cli.ts` al nucleo, porque
  `core/transiciones.ts` la anota y el nucleo no debe depender del punto de entrada. Test nuevo en
  `test/empaquetado/metadatos.test.ts` que exige que coincida con `package.json` y `plugin.json`.
- **Quinta columna `version` en `## Transiciones`** (`core/transiciones.ts`): `registrarTransicion`
  la anota por defecto (ningun comando cambia su llamada). `leerTransiciones` acepta filas de 4 celdas
  (version `null`) y de 5; una celda que no es version deja la fila sin version pero no la descarta,
  para no apagar el modo congelado. `versionDeCierre`: la del ULTIMO `finish`, `null` si no la lleva
  (nunca hereda la de un `finish` anterior ni se deduce por fecha).
- **Cabecera**: la primera fila con version bajo una cabecera de 4 columnas exacta cambia solo la
  cabecera y su separador a 5; las filas de datos no se tocan y se conserva CRLF. Documentado como la
  unica excepcion al contrato del modulo.
- **`taskctl metricas --por-version [--json]`** (`core/versiones-metricas.ts`, puro): por version de
  cierre, en orden semver (0.9 < 0.10; pre-release antes de su release), tareas, con revision, % a la
  primera y rondas medias (reutiliza `resumirGrupo`), tokens por fase (suma, `conDato`, media) y otra
  tabla de hallazgos por severidad y origen. Las sin version, en `sinVersion`, aparte. Se combina con
  `--evolucion`, `--grupos`, `--repo` y `--json`; choca con `--heuristica`, `--tokens` y `--escribir`.
  El `--json` sin el flag no cambia (lo fija un test). `FilaMetricas` gana `versionCierre`.
- **Version subida a 0.12.0** al abrir el ciclo (`version.ts`, `package.json`, `package-lock.json`,
  `plugin.json`, `marketplace.json`), segun la regla decidida.
- Documentacion: README del plugin (`--por-version`, la columna `version`, una version por repo y la
  regla de subir la version al abrir el ciclo, forma de `porVersion` en el JSON), ayuda de `cli.ts`,
  `skills/task-workflow/avance.md` y CHANGELOG (0.12.0, sin publicar).
- Tests: `test/core/transiciones.test.ts` (7 nuevos: tabla vieja, ampliacion de cabecera con y sin CRLF,
  cabecera editada o en bloque de codigo, celda invalida, ultimo `finish`, version por defecto),
  `test/core/versiones-metricas.test.ts` (4, puros), `test/commands/metricas-version.test.ts` (4, CLI
  contra repos Git temporales con tablas de 4 y 5 columnas y dos `finish` de versiones distintas), y el
  ciclo real de `test/commands/metricas.test.ts` comprueba que cada fila lleva la version y que, con
  origen git, la tarea cae en «sin version». Helper `metricas-repos.ts` ampliado.
- Suite completa: 1914 tests, 1911 en verde; los 3 rojos son los conocidos de Windows (symlink EPERM,
  chmod en NTFS, CRLF). Smoke con el CLI compilado sobre las 66 terminadas de este repo: todas en
  «sin version», como corresponde.

### Decisiones de la persona (en el plan)

Version al abrir el ciclo; la del ultimo `finish`; reescribir la cabecera de 4 columnas; test de
alineacion en vez de leer `package.json` en runtime.

### Revision por pares (ronda 1, aprobada)

Revisor independiente general-purpose (sonnet) + `code-quality-reviewer`: clon temporal, suite completa
(solo los 3 rojos de Windows), 9 mutantes (5 detectados, 2 equivalentes). Sin CRITICOS ni IMPORTANTES.

- **MEN-1** (no se corrige): el test de orden semver da `0.12.0-dev`, `-dev.2`, `-dev.10` ya ordenados,
  asi que el tramo que compara la longitud de la pre-release no tiene red (el mutante sobrevive). El
  codigo es correcto (el revisor lo comprobo con 13 versiones). Se acepta para no cerrar con codigo
  distinto del revisado en modo automatico; arreglo trivial (invertir la entrada) para la siguiente
  tarea que toque ese fichero.
- **MEN-2** (no se corrige): falta el caso de una cabecera de 4 columnas dentro de un bloque de codigo
  ANTES de la tabla real; la guarda `enBloque[i]` de `ampliarCabecera` existe y funciona, pero sin
  test. Mismo motivo y mismo destino que MEN-1.
- **MEN-3** (aceptado): un separador con alineacion (`|:--|:-:|...`) se reescribe sin ella. Inocuo: las
  columnas del registro son texto plano.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T00:17:31Z | plan | automatico | persona |
| 2026-11-07T00:23:27Z | approve | automatico | persona |
| 2026-11-07T00:23:35Z | start | automatico | persona |
| 2026-11-07T00:45:10Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T00:22:37Z | diseno | agente:a66679d6288860bb7,a891ec8ffae0220da,acb47bbb54691a1c7 | 44 | 135632 | 552551 | 21415 | 31 | 709642 |
| 2026-11-07T01:06:09Z | revision | agente:a5fbce3adfd46a18a | 54 | 156190 | 3651174 | 15131 | 5 | 3822549 |
