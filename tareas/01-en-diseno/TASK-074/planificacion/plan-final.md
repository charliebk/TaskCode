# Plan — TASK-074: Cobertura sobre las lineas cambiadas

(Lo consolida el agente unificador a partir de 3 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos, testing. Se lanzaron 3 porque la complejidad declarada (alta) no coincide con la heurística (simple, 1 punto) y se toma la mayor.
Los desacuerdos entre roles se senalan, no se promedian. Este plan no vale hasta que una persona lo apruebe con `taskctl approve`.)

## Enfoque propuesto

- (arquitectura) Se crean `core/lcov.ts` (parser puro: `SF`/`DA`/`end_of_record`) y `core/cobertura-cambios.ts` (`cruzarCobertura`, `seccionCobertura`, `evaluarUmbral`): único sitio que decide «no cubierta».
- (arquitectura) Se extiende `fs/git.ts` con `lineasAnadidas` (`git diff -U0`) desde `mergeBase('HEAD', base)` siempre, nunca el `desde` incremental, y helpers comunes `pathspecSinExcluidos` y `patronesExcluidos` (`excluir_de_revision` + held-out).
- (arquitectura) Orden: config (`informe_cobertura`, `umbral_cobertura`) → parser y cruce → `review` (sección tras `seccionExcluidos`, calculada una vez por ronda, antes del bucle de escritura según riesgos) → `commands/finish-cobertura.ts`, después de `puertaVerificacion` y antes de `puertaHeldout`.
- (arquitectura) Review informa, finish frena: el umbral solo actúa en `finish`.

## Desacuerdos entre roles, y como se resuelven

- Banderas del diff — arquitectura: `-U0 --no-color` / riesgos: además `--no-ext-diff -M --src-prefix/--dst-prefix` fijos, borrados y binarios sin líneas — gana riesgos — trae evidencia concreta (`diff.renames`, `noprefix`, `diff.external`, `.trim()` de git.ts:63) y lo de arquitectura es un subconjunto.
- Frescura del lcov en finish — arquitectura: «fresco por construcción» por ir tras `puertaVerificacion` / riesgos: solo vale un lcov con mtime posterior al arranque de `comando_verificacion` en esa invocación — gana riesgos en exigir la comprobación — «por construcción» supone que el comando escribe ese lcov, y nadie lo ha verificado; qué pasa si falla (error o aviso) queda a la persona (decisión 2).
- Base de las rutas `SF:` — arquitectura: normalizar contra `raizDelRepo` / riesgos: resolver contra un directorio base declarado, `realpath` (8.3 `NULLCA~1`) y sin mayúsculas en win32 — gana riesgos en `realpath` y case — da el contraejemplo de este repo (`npm test` corre en un subdirectorio); si el «directorio base» es una clave nueva de config no lo fija ningún rol y lo decide quien implemente con la persona.
- Lcov desfasado en review — arquitectura y riesgos: comparar mtime del lcov con la fecha del commit HEAD y degradar a aviso / testing: sin huella (mtime, sha) no se cubre de forma fiable — gana arquitectura/riesgos — review solo informa y no bloquea; la limitación de testing se acepta como riesgo, no se diseña huella.
- Qué mide el umbral — arquitectura: porcentaje 0-100 / testing: «por encima, código ≠ 0», lectura compatible con un número de líneas — no se resuelve: va a la decisión 3.

## Riesgos aceptados y que los contiene

- Falso verde cuando «no encuentro datos» se lee como «nada sin cubrir» — riesgos — `sinDatos` separado de no cubiertas (arquitectura) y regla de error de riesgos, pendiente de decisión 2.
- En review el lcov es viejo por construcción (el update que mergea la base va antes del diff, review.ts:411-416) — riesgos — aviso con fecha frente a HEAD; el umbral no actúa en review.
- Un valor inválido de la clave nueva aborta todos los comandos que llaman a `resolverConfig`, `board` incluido — riesgos — validación con mensaje claro; patrón de `finish-heldout.test.ts:123` (testing).
- Lcov truncado y `SF` duplicados — riesgos — rechazar el lcov truncado entero con aviso; agregar duplicados por máximo o suma.
- Un `coverage/` no ignorado bloquea review (workspace limpio) y finish («ha dejado cambios») — riesgos, verificado en el código — se documenta; no se relaja la guarda.
- Divergencia entre el rango de `review` y el de las líneas cambiadas — testing — helper de pathspec común (arquitectura) y test de coherencia (testing).

## Plan de pruebas

- Merge base, no punta: la base avanza tras crear la rama y no sale ninguna línea de `b.mjs` — repo Git temporal real — testing.
- `excluir_de_revision` respetado: `dist/x.js` no sale; con `[]` sí — repo temporal — testing.
- Línea exacta `a.mjs:n` con `DA:n,0` y ausencia de la vecina cubierta — lcov real de `node --test --experimental-test-coverage` generado por el fixture — testing.
- `review` no ejecuta el comando: el fichero testigo de `comando_verificacion` no existe — repo temporal — testing.
- Puerta de finish: código ≠ 0 y `develop` no avanza; la verificación reescribe el lcov y la puerta lee el nuevo; sin la clave, cierra como hoy — `finish-fixtures` — testing (el de reescritura lo pide testing contra arquitectura).
- Ronda incremental: una línea marcada en ronda 1 sigue en la 2 — repo temporal — riesgos.

## Sin cubrir

- «Freno 8 de brakes»: ningún rol dice dónde se registra o documenta el freno — lo fija quien implemente; va al `Resultado`.
- Si la sección de review aparece siempre o solo con la clave (testing lo plantea, nadie lo decide) — se resuelve con la decisión 2; si aparece siempre, revisar `review-exclusion.test.ts:132`.

## Salidas que faltaron

- ninguna: las tres llegaron rellenas.

## Suposiciones no verificadas

- Que el reporter lcov de Node 22 y c8 escriben `SF:` absoluto, con `\` en Windows y sin remapear — arquitectura, riesgos, testing — generar uno y mirarlo.
- Que `informe_cobertura` sea relativa a la raíz del repo — riesgos — decidirlo junto a la base de `SF:`.
- Que `leerRondaPrevia`/`seccionPrevia` no dependan del orden de secciones de la petición — riesgos — leer esas funciones.
- Que `comando_verificacion` regenere el lcov que la puerta lee — implícito en arquitectura — lo cubre el test de reescritura.

## Lo que necesita decision de una persona

Decidido por la persona el 2026-11-05:
- (a) **De la rama base**: `umbral_cobertura` e `informe_cobertura` se leen con `configDe(ramaBase)`
  (extraido de `finish-heldout.ts` a un modulo comun), como los held-out: la rama no puede rebajar
  su freno. El mensaje de aborto dice que cambiar o quitar el umbral es un commit en la base
  integrado en la rama.
- (b)+(c) **Sin datos fiables, error**: con umbral configurado, `finish` aborta sin mergear si
  ningun fichero cambiado casa con el lcov, si el lcov es anterior al arranque de la verificacion de
  ese mismo `finish`, o si esta truncado. Con `--sin-verificacion` no hay lcov fresco: la puerta se
  salta y queda anotado en la tarea, igual que la verificacion. En `review` siempre es aviso, nunca
  error.
- (d) **Porcentaje minimo cubierto**: `umbral_cobertura` de 0 a 100 = porcentaje de lineas cambiadas
  ejecutables (con `DA`) que tienen que estar cubiertas; el valor exacto pasa
  (`cubierto >= umbral`). Las lineas sin `DA` no cuentan; los ficheros sin `SF` van aparte como «sin
  instrumentar».
- (e) **Dogfooding fuera de alcance**: si el lcov solo cubre rutas excluidas, se avisa de mala
  configuracion. Hacerlo funcionar en este repo (source maps o cobertura sobre `src`) queda como
  seguimiento.
- Lo que nadie cubrio, decidido al anotar (no es de dominio): la seccion de cobertura de `review`
  solo aparece si el proyecto declara `informe_cobertura`; el freno se documenta en la skill de flujo
  (revision y cierre) y en el README del plugin.
- Aprobacion del plan entero con `taskctl approve`: pendiente.
