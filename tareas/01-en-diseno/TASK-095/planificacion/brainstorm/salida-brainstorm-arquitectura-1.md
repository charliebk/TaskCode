# Brainstorm — TASK-095, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

Referencias relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Enfoque propuesto, con rutas y nombres concretos

- Se cambia la regla, no se añade otro mecanismo. Desde la ronda 2, `review` siempre genera una ronda acotada, salvo con `--completa`. La función que decidía «completa o acotada» (`src/core/informe-revision.ts:352-382`, `alcanceRondaSiguiente`) se sustituye por una función pura que solo agrupa lo que hay que verificar por revisor: `pendientesPorRevisor(informes: {revisor,texto}[]): Map<revisor, Abierto[] | 'ilegible'>`.
- El revisor de cada informe ya se sabe por el sufijo del nombre (`rondaYRevisorDeInforme`, `src/fs/rondas.ts:116`; `''` es el genérico). Lo resuelve `review.ts` y se lo pasa a core (core no importa de fs).
- La cascada `review.ts:617-640` queda así:
  - con `--completa`: `desde = baseBranch` siempre (hoy solo se vuelve a la base si `previa.fueAcotada`, `:635`);
  - en cualquier otra ronda ≥2: acotada, con `desde = previa.commit`.
  - Desaparecen las ramas «no MENOR», «hay merges» (`:624`) y «ficheros no nombrados» (`:620,:625-628`). El caso «el commit ya no es antepasado» (`:594-602`) sigue con su aviso.
- Plan de la acotada: `planDeVerificacion(pendientes, delta, catalogo): PlanDeRevision` en `src/core/revisores.ts`, junto a `clasificarPorDominio` (`:266`); sustituye el atajo de `review.ts:679-681`.
  - Un grupo por cada revisor con algo pendiente, de dominio o genérico; cada grupo recibe el delta entero de la corrección.
  - Si la ronda pidió cambios y no queda nada pendiente, va solo el genérico.
- La sección de abiertos pasa a ser una por revisor. Hoy `leerRondaPrevia` (`review.ts:384-399`) arma una sola sección con todos los abiertos y `:796` la pasa igual a todas las peticiones. Un informe ilegible conserva el «léelo entero» (`:403-408`).
- `instruccionesAcotadas` (`review.ts:292-310`) se reescribe: fuera «solo dejó MENORES» y «un CRITICO o IMPORTANTE nuevo obliga a completa»; dentro: verificar cada hallazgo abierto y el diff de la corrección, y abrir uno nuevo solo si es CRITICO o lo introduce la propia corrección. La línea `- Alcance: verificacion acotada ...` (`:83`, `:248`) conserva el literal.
- Tope: el caso de `src/core/flujo.ts:170-178` devuelve `preguntar` en cualquier modo, sin pasar por `accionPara` (hoy manual da `detener` en `:100` y semiautomático también, por `faltaTrabajo`, en `:105`). El motivo nombra las dos salidas: aceptar lo abierto documentado en Resultado, o abrir una tarea nueva (`skills/task-workflow/avance.md:66-72`, `skills/review/SKILL.md:82-84`).
- `veredicto.ts:184-189`: el aviso se queda (`soloMenores` sigue en uso); solo se reescribe su cola («podrá ser una verificación acotada»).

## Que se extiende y que se crea

- `informe-revision.ts`: `AlcanceRonda` (`:297-311`) se reduce a `modeloBarato` (en `review.ts:726`, `previa.modeloBarato`); `modeloBaratoPermitido` (`:283`, TASK-081) no se toca.
- Se crea `planDeVerificacion` en `revisores.ts`, reutilizando `PlanDeRevision`/`GrupoDeRevision` (`:215-230`).
- El bucle de escrituras de `review.ts:729-770` separa dos decisiones que hoy cuelgan de `plan.fragmentado`:
  - sufijo `-<revisor>`: si hay más de un grupo o el único no es el genérico (las métricas sacan el revisor del sufijo, `InformeLeido`, `informe-revision.ts:396-402`);
  - diff filtrado por pathspec (`:762`): solo en la ronda completa fragmentada.
  - `coberturaPorRevisor` (`:690`) usa el flag de sufijo.
- Se borra por quedarse sin uso: `alcanceRondaSiguiente`; `rutasDeCeldaFichero` (`:317`) y `ficheroNombrado` (`:336`), que solo usan `review.ts:620` y `test/commands/review-alcance.test.ts:295-303`; `RondaPrevia.fueAcotada` y `ALCANCE_ACOTADA_RE` (`review.ts:84`, `:362`, `:375-378`); el bloque de vuelta a la base (`:633-639`), que pasa a cubrir `--completa`; el import de `hayMergesEntre` (`review.ts:62`), y la función de `src/fs/git.ts:276` si nadie más la usa.

## Limites que cruza

- Formato en disco: una ronda acotada podrá llevar sufijo de revisor. Todos los lectores aceptan el sufijo opcional (`INFORME_REVISION_RE`, `rondas.ts:81`): `siguiente.ts:186,199`, `veredicto.ts:143`, `finish.ts:128`, `metricas.ts:338,460`.
- Contrato de `ReviewCommandResult.alcance` y su documentación (`review.ts:167-171`), y texto del CLI (`cli.ts:713-715`).
- `siguiente --json`: en el tope, la `accion` de manual y semiautomático pasa de `detener` a `preguntar` (contrato que leen las skills).
- API exportada: desaparecen `alcanceRondaSiguiente`, `rutasDeCeldaFichero` y `ficheroNombrado`; sus tests cambian de expectativa con el motivo en Resultado.
- No cambian: `clasificarPorDominio`, el catálogo, la ronda 1, `--completa` ni las secciones de cobertura y verificación selectiva.
- Coste: las peticiones de una ronda acotada crecen con los revisores que tienen algo pendiente, no con los dominios que toca el diff.

## La decision de diseño que mas te preocupa (UNA sola)

Qué diff recibe cada revisor de dominio en la ronda acotada. Propuesta: el delta entero de la corrección, sin filtrar por dominio (una corrección de un IMPORTANTE de `rust-wasm-reviewer` puede tocar un llamante TS). Descartadas: fragmentar el delta con `clasificarPorDominio` (vuelve a escalar con el diff) y un solo genérico que verifica todo (incumple el criterio del dominio; 63/88).

Desacuerdos previstos:
- Con riesgos, sobre merges entre rondas: el criterio fija el diff desde el último commit revisado; una ronda incremental no actualiza la rama (TASK-040), así que un merge ahí es manual. Se acepta y se nombra en el motivo; no se vuelve a la completa.
- Sobre qué cuenta como «abierto»: `hallazgosNoCerrados` (`informe-revision.ts:257-266`) excluye `corregido`; si el implementador marca `corregido`, nadie lo verificaría. Propuesta: pendiente es todo estado distinto de `aceptado`, en una sola función. Sin verificar quién edita la columna Estado según `skills/review`.
- Sin verificar: por qué TASK-008 de OpenDockTrading llegó a 14 rondas pese a `TOPE_RONDAS = 3` (`flujo.ts:70`): en automático el tope devuelve `preguntar` (`:108`), pero solo lo aplica `siguiente`; `review` no lo consulta y cada «sí» abre otra ronda.
