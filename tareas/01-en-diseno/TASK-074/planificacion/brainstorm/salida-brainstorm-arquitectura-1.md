# Brainstorm — TASK-074, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: `taskcode-plugin:brainstorm-arquitectura`

## Enfoque propuesto, con rutas y nombres concretos

- Dos piezas puras nuevas y un único cruce: `core/lcov.ts` parsea el informe y
  `core/cobertura-cambios.ts` lo cruza con las líneas añadidas. Lo consumen
  `review` (en la petición) y una puerta nueva de `finish`.
- Líneas cambiadas: `fs/git.ts` gana `lineasAnadidas(desde, hasta, excluir, cwd):
  Map<string, number[]>` con `git diff -U0 --no-color`, leyendo solo las
  cabeceras `@@ -a,b +c,d @@`. La exclusión usa el mismo pathspec
  `:(exclude,glob)` que `diffParaRevision` (fs/git.ts:303-335), extraído a un
  helper `pathspecSinExcluidos(excluir)` para no tener dos motores de patrones
  (lo pide el comentario de git.ts:296-301).
- `desde` es siempre `mergeBase('HEAD', base)` (git.ts:518), nunca el `desde` de
  la ronda incremental (review.ts:463-474): la cobertura se mide sobre toda la
  rama aunque el diff embebido sea el delta.
- `excluir` = `excluir_de_revision` + `EXCLUIR_HELDOUT`, la lista que ya arma
  review.ts:479, extraída a `patronesExcluidos(cwd)` (en `core/heldout.ts` o
  `config.ts`) para que review y finish no la recompongan cada uno.
- `core/lcov.ts`, sin I/O: `parsearLcov(texto, raiz): Map<rutaRepoPosix,
  Map<linea, hits>>`; solo `SF:`, `DA:` y `end_of_record` (ignora FN/BRDA).
  Parser a mano, cero dependencias.
- `core/cobertura-cambios.ts`, puro: `cruzarCobertura(anadidas, lcov) →
  { ficheros: {ruta, noCubiertas: rangos, instrumentables, cubiertas}[],
  sinDatos: string[], porcentaje }`. Una línea sin `DA` (comentario, blanco) no
  cuenta; un fichero ausente del lcov va a `sinDatos`, no a no cubiertas. Aquí
  también `seccionCobertura(resultado)` y `evaluarUmbral(resultado, umbral)`.
- `review.ts`: calcula el cruce UNA vez por ronda junto a `diffParaRevision` y lo
  pasa por `ExtrasPeticion.cobertura`; `peticionTemplate` lo pinta tras
  `seccionExcluidos`. En ronda fragmentada, cada grupo recibe en memoria el
  subconjunto de `escritura.ficheros`, sin más llamadas a Git.
- `finish`: `commands/finish-cobertura.ts` con `puertaCobertura(o)`, patrón de
  `finish-heldout.ts` (lanza `FinishCommandError`, no escribe). Dentro del cierre
  `puerta` de finish.ts:445-471, DESPUÉS de `puertaVerificacion` (que acaba de
  regenerar el lcov) y ANTES de `puertaHeldout` (`comando_heldout` podría
  reescribir el mismo lcov con otra suite).

Descartado:
- Ejecutar el comando dentro de review: lo prohíbe el criterio 2 y duplicaría
  `fs/verificacion.ts`.
- Parsear el diff unificado que review ya embebe: va filtrado por grupo, con
  contexto; `-U0` da las líneas directamente con un spawn más.
- Una clave `comando_cobertura` propia: un segundo comando de tests; el lcov lo
  genera `comando_verificacion`.

## Que se extiende y que se crea

- `core/lcov.ts` — nuevo, puro, probable con un lcov de ejemplo sin repo.
- `core/cobertura-cambios.ts` — nuevo; único sitio que decide «no cubierta».
- `fs/git.ts` — se extiende con `lineasAnadidas` y el helper de pathspec.
- `core/config.ts` — dos claves en `TaskcodeConfig`, `CONFIG_DEFAULTS` y
  `CLAVES_CONFIG`: `informe_cobertura: string|null` (ruta relativa validada
  como `motivoRutaInvalida`) y `umbral_cobertura: number|null` (0-100), con
  validación conjunta estilo `validarVerificacionCompleta`: el umbral exige
  informe y `comando_verificacion` (sin comando nadie regenera el lcov en finish).
- `commands/review.ts` — `ExtrasPeticion` y template; sin cambiar la firma de
  `runReviewCommand`.
- `commands/finish-cobertura.ts` — nuevo; finish.ts solo gana una llamada.

## Limites que cruza

- Esquema de `.taskcode/config.yml`: dos claves nuevas; un plugin anterior las
  ve como desconocidas, avisa e ignora (config.ts:423-426).
- Formato de la petición: sección nueva «## Cobertura de las líneas cambiadas»,
  sin tocar `- Commit revisado (HEAD):` (`commitRevisadoDe`) ni `RONDA_FILE_RE`.
- Contrato de `finish`: un aborto nuevo antes del primer efecto; mismo hueco que
  verificación y held-out (no en el segundo `--merge-request` ni en el camino
  idempotente).
- De qué config se lee el umbral: propone la de la BASE (`configDe(ramaBase)` de
  finish-heldout.ts:81, extraído a común), como MEN-2 de TASK-073: la rama no
  puede relajar su freno. Choca con `puertaVerificacion`, que usa
  `resolverConfig(cwd)` (la de la rama).
- Rendimiento: un `git diff -U0` y un `readFileSync` del lcov; crece con el lcov
  (todo el repo), no con el diff; se descarta lo que no esté en `anadidas`.
- Sin verificar: que `SF:` venga absoluta (c8/istanbul) o relativa; normalizar
  contra `raizDelRepo` con `/` y sin mayúsculas en Windows.
- Sin verificar (dominio): con `--sin-verificacion` el lcov no se regenera;
  lectura propuesta: saltar la puerta y anotarlo, como la verificación.

## La decision de diseño que mas te preocupa (UNA sola)

Qué lcov lee `review`. No ejecuta nada (criterio 2), así que lee lo que haya en
disco, sin garantía de que sea de HEAD; en `finish` es fresco por construcción
(va tras `puertaVerificacion`). Posición: review informa, finish frena. La
sección de review compara la fecha del lcov con la del commit HEAD y, si el lcov
es más antiguo, avisa de que no es fiable en vez de listar líneas. El umbral
SOLO actúa en finish. No reutilizar el memo de `fs/verificacion.ts` para atar
lcov y huella (acoplaría dos frenos). Un review «autoritativo» solo es honrado
ejecutando `comando_verificacion`, y eso contradice el criterio 2.
