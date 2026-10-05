# Brainstorm — TASK-052, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

[supuesto] marca lo no verificado.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **Cambiar el formato de `fecha` en `## Transiciones` apaga en silencio el
  modo congelado.** `leerTransiciones` descarta toda fila cuya fecha no case
  con `^\d{4}-\d{2}-\d{2}$` (`src/core/transiciones.ts:165`). Con hora, cada
  fila nueva se ignora, `modoCongelado` devuelve null y `modoDeTarea` cae al
  modo del config: una tarea planificada en `manual` correria en `automatico`.
  Mitigacion: no tocar la columna `fecha`, o que el lector tolere el formato
  nuevo.
- **Una clave nueva del frontmatter se borra en el primer round-trip**:
  `validateTask` construye el `Task` campo a campo (`task.ts:240-264`) y
  `serializeFrontmatter` solo emite `TASK_FIELD_ORDER` (`frontmatter.ts:167`).
  Mitigacion: anadirla a las dos y a `validateTask` en el mismo commit.
- **Marcas obligatorias rompen todo el repo**: ~45 tareas terminadas dejarian
  de validar (`board`, `finish`, WIP). Mitigacion: anulables, ausencia = sin
  dato.
- **Desfase de versiones entre el YML de la heuristica y el codigo.** Las
  claves `tolerancia_*` y `modelo_consulta_discrepancia` no estan en
  `.taskcode/config.yml` sino en `scripts/heuristica-complejidad.yml`
  (`CLAVES_CONFIG` no las admite, `config.ts:139`): quitarlas no rompe ningun
  config de usuario. El fallo real: `parsearHeuristica` aborta con una clave
  desconocida (`heuristica.ts:271`) y con una que falte (`:318-324`); dist
  nuevo con YML viejo o al reves hace abortar `plan` (`CLAUDE_PLUGIN_ROOT` a
  otra instalacion, `:216`; copia editada a mano, YML l. 101-104).
  Mitigacion: codigo y YML en el mismo commit; el error dice que se reinstale.
- **Recalibrar cambia en caliente los roles de las tareas en vuelo**: las de
  `01-en-diseno` ya tienen sus peticiones. Los pesos nuevos rigen desde el
  siguiente `plan`; decirlo en el commit.
- **La muestra no mide lo que dice**: TASK-016 tiene 5 informes y 1 peticion,
  TASK-017 5 y 5, las anteriores a TASK-013 no tienen `revision/`. «Sin
  carpeta» = 0 rondas abarata las antiguas; las rondas incrementales (TASK-040)
  no pesan igual. ~40 tareas de un solo proyecto sobreajustan, y el YML se
  distribuye a proyectos ajenos. Mitigacion: regla escrita (cuenta de
  informes), excluir lo no medible, dejar n, periodo y fuente.
- **Tests de la heuristica reescritos para cuadrar**:
  `heuristica-complejidad.test.ts:168-170` y `:451-472`, `heuristica.test.ts:252`
  y `:677` (exige error si falta `modelo_consulta_discrepancia`), el reparto
  14/14/4 de `heuristica.ts:63-77`. Cada test que cambie dice en el commit que
  decision revierte. `scripts/catalogo-skills.yml:97` («22 claves
  obligatorias») tambien.

## Estados intermedios y fallos parciales

- La marca se escribe antes del `autoCommit` (`finish.ts:410→444`,
  `review.ts:584→600`, `start.ts:294→304`): si el commit falla, queda marca
  sin commit; al reintentar, segunda marca u hora sobrescrita.
- finish que muere entre `moveTareaFile` y el commit: marca sin commit de
  cierre; las metricas deben tolerarlo.
- review incremental (`review.ts:405`) registra transicion sin script: N
  rondas = N filas; un campo unico en frontmatter se quedaria con la ultima.
- plan dos veces: la tabla acumula; un campo unico se sobrescribe y la
  duracion de diseno sale corta.
- pausa: hay `pausa` pero no `reanudar` (`transiciones.ts:28`): no se descuenta
  el tiempo pausado; se mide calendario, no trabajo.
- `metricas` es de solo lectura: sin riesgo de concurrencia.

## Compatibilidad hacia atras

- Tareas antiguas sin marcas: `metricas` muestra «—», no 0 ni NaN. Restar
  `2026-10-04` (medianoche UTC implicita) y `2026-10-04T23:10+02:00` da
  negativos.
- Reloj: `today()` es fecha UTC (`cli.ts:105-106`); una marca en hora local
  con offset no cuadraria con la fecha de su fila entre las 22 y las 24 en
  Madrid. Misma fuente: UTC, `toISOString`.
- Un ISO con `:` se entrecomilla al serializar (`needsQuoting`,
  `frontmatter.ts:268`) y el round-trip lo conserva.
- Plugin viejo sobre un tarea.md nuevo: borra marcas del frontmatter en
  silencio; §7.3 pide una version por equipo, pero un rollback lo incumple.
- Merges: los commits de review van a la rama y el de finish a develop
  despues del merge (`finish.ts:400-411`): secuenciales [supuesto: salvo que
  pausa o veredicto commiteen en develop con la tarea en curso].

## Vuelta atras

- Volver a un plugin anterior no es inocuo: su primera transicion borra las
  marcas de esa tarea (solo quedan en el historial de Git).
- Los pesos se revierten con `git revert`; las tareas planificadas entre
  medias conservan sus brainstorms.
- Quitar claves del YML se revierte junto con el codigo; revertir solo uno
  deja `plan` abortando.
- Las marcas con hora de tareas cerradas antes del cambio no existen ni se
  pueden reconstruir.

## El riesgo que mas te preocupa (UNO solo)

Ampliar la columna `fecha` de `## Transiciones` con la hora: el regex de
`leerTransiciones` dejaria de ver cada fila nueva sin error, `modoCongelado`
volveria a null y la tarea podria encadenarse en `automatico` habiendose
planificado en `manual`, sin que ningun test de metricas lo detecte. Posicion:
no tocar la columna `fecha`, que tiene un consumidor que no es telemetria.
