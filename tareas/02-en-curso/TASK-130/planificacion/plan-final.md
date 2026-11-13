# Plan — TASK-130: Poda periodica de tests redundantes: fusionar o borrar sin perder cobertura

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 120 min (de la rama abierta al cierre con merge; senales: 2 ficheros de codigo, decenas de ficheros de tests, 1 anexo de skill, 4 criterios)

No se trocea: decision de Carlos del 2026-11-13 (y la primera pasada de poda
es una sola unidad: medir antes y despues sobre el mismo arbol).

1. **doctor propone la poda.** Clave `tareas_entre_podas` (entero, 30 por
   defecto). Comprobacion `poda-tests`: si salta el aviso de crecimiento de la
   suite (TASK-129) o hay mas de N tareas terminadas desde la ultima poda (la
   ultima tarea terminada con la etiqueta `poda`, por numero de ID; sin
   ninguna, todas), `aviso` con el `taskctl new` ya escrito (titulo, tipo
   `feature`, etiquetas `poda,tests`). Si no, `ok` con la cuenta.
2. **Procedimiento en la skill.** Anexo `task-workflow/poda-tests.md`
   (enlazado desde `tests-pesados.md`): localizar duplicados (mismo
   comportamiento probado dos veces, variantes de un mismo caso en tests
   separados, setups repetidos), que se fusiona (variantes en un test con tabla
   de casos y mensaje por caso) y que se borra (lo que otro test ya asevera),
   y la regla de cobertura: la cobertura de lineas de los ficheros de test
   tocados, antes y despues, con `--experimental-test-coverage` (la de
   TASK-074); el conjunto de lineas cubiertas no puede encogerse.
3. **Primera pasada en TaskCode.** Objetivo: -10 % de tests de primer nivel en
   la rapida (core + cli, 798 -> <= 718) y en la completa (2327 -> <= 2094).
   Por fusion de variantes del mismo comportamiento en un test con tabla de
   casos, sin quitar ninguna asercion; y borrado de duplicados exactos. En
   paralelo por grupos de ficheros (agentes sin git en el checkout, ficheros
   disjuntos), empezando por core/cli.
   - Antes y despues: `scripts/perfil-tests.mjs --filtro test/core,test/cli`
     (tests y duracion de la rapida) y la cuenta de tests de primer nivel de
     toda la completa; anotados en este plan (seccion «Medida»).
   - Cobertura: `node --test --experimental-test-coverage` sobre los ficheros
     de test tocados, antes y despues; las lineas cubiertas despues incluyen
     las de antes (si no, se deshace la fusion que la baja).
4. CHANGELOG y docs/configuracion.md (la clave).

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- Fusionar puede debilitar un test (perder una asercion o el aislamiento): la
  regla es no quitar ninguna asercion y cada caso lleva su mensaje; la
  revision lo comprueba con el diff y los mutantes.
- Un test fusionado que falla dice menos cual caso fallo: el mensaje por caso
  lo compensa.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):
- Criterio 1: 2 (doctor propone la poda por crecimiento y por N tareas, con el
  comando escrito; sin motivo, ok).
- Criterio 2: 1 (el anexo describe localizar, fusionar, borrar y la cobertura).
- Criterio 3: 0 nuevos (la medida va en el plan); la suite tocada sigue en verde.
- `verificar-impacto` y `test:rapido`.

## Lo que necesita decision de una persona

Nada.

## Medida

Medido el 2026-11-13 en Windows (node 22), mismo arbol salvo los tests.

| | Antes | Despues | Cambio |
|---|---|---|---|
| Rapida (core + cli), `perfil-tests.mjs --filtro test/core,test/cli` | 819 tests, 0,5 min | 624 tests, 0,7 min | -23,8 % de tests |
| Rapida, tests de primer nivel (`grep -c "^test("`) | 802 | 607 | -24,3 % |
| Completa, tests de primer nivel (`grep -c "^test("` en test/**) | 2331 | 1858 | -20,3 % |

- La duracion de la rapida es de medio minuto y su ruido (y el fichero de test
  nuevo de esta tarea) la mueve mas que la poda: el criterio se cumple por
  numero de tests. La completa no se ha cronometrado entera (32 min por pasada);
  su recuento de primer nivel es estatico.
- Cobertura: los 28 ficheros de test modificados, con
  `node --test --experimental-test-coverage --test-reporter=lcov`, en un
  worktree del arbol anterior con el mismo `src` y en el arbol nuevo: 21 276
  lineas de `src` cubiertas antes y 21 276 despues, ninguna perdida
  (comparacion por fichero fuente del conjunto de lineas con DA > 0). Una
  primera comparacion con el `src` de HEAD daba 188 «perdidas» falsas en
  `doctor.js` y `config.js`, los dos ficheros de `src` que cambia esta tarea
  (otra numeracion de lineas); por eso se repitio con el mismo `src`.
- Por grupos (fusiones de variantes del mismo comportamiento en un test con un
  bloque o una tabla por caso; ningun borrado; ninguna asercion quitada):
  heuristica -33; metricas, transiciones, state-machine, wip, task -118;
  asignado, import-parser, frontmatter, args -47; doctor y doctor-deploy -114;
  integracion/config, board, import, wrappers, cobertura-cambios -94;
  fs/git y hooks -82. Total -488.
