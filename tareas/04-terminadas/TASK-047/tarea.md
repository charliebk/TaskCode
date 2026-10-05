---
id: TASK-047
titulo: "F5-T3 Flags desconocidos y mensajes de review"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-047-f5-t3-flags-desconocidos-y-mensajes-de-r
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

Tres MENOR de la auditoria (D4, D6, D10) que confunden a quien usa el CLI.
Un flag mal escrito (`--complejida trivial`) se ignora en silencio y la tarea
sale con otra complejidad: debe abortar diciendo cuales son los flags validos
y cual se parece al escrito, como ya hace el parser de config. La salida de
`review` dice «lanza ese agente» nombrando una skill revisora: debe separar
el agente que se lanza (`agente_revisor`) de la skill que carga, y usar
`modelo_sugerido`, que hoy no lee nadie. Y `codex-review.ts` duplica helpers
de `finish.ts`: debe reutilizarlos.

## Criterios de aceptacion
- [x] Un flag desconocido aborta con la lista de flags validos y una sugerencia
- [x] La salida de `review` nombra agente y skill por separado y usa `modelo_sugerido`
- [x] `codex-review.ts` reutiliza los helpers de `finish.ts` en lugar de duplicarlos

## Resultado

**Implementado.**
- **Flags desconocidos** (D4): `rechazarFlagsDesconocidos` en `src/cli/args.ts`.
  Cada comando de `src/commands/` (new, import, board, start, plan, approve,
  review, finish, codex-review, veredicto, pausa, siguiente, cadena) declara su
  `FLAGS_<CMD>` y la llama como primera linea de su `runXCommand`, con su
  propia clase de error. Aborta antes de cualquier efecto con la lista de
  validos y el mas parecido (`--complejida` → `--complejidad`). La
  sugerencia es ahora una sola, `src/core/sugerencia.ts`, que sustituye las
  tres copias privadas de config, heuristica y catalogo.
- **Salida de review** (D6): la peticion dice `Agente a lanzar: <agente_revisor>
  (modelo sugerido: <modelo_sugerido>)` y `Skill revisora a cargar: <skill>`,
  y el CLI `Lanza el agente "X" (modelo Y) cargando la skill "Z"...`. El modelo
  del revisor es el de la tarea por la seccion 16.6 de la metodologia.
- **Helpers compartidos** (D10): `INFORME_CODEX_RE` y `ultimaRondaAprobada` en
  `src/fs/rondas.ts`; finish y codex-review usan la misma puerta.
  **Desviacion de la letra del criterio 3**, aprobada en el plan: el helper se
  saco a `fs/rondas.ts` en vez de exportarlo desde `finish.ts`, para que un
  comando no importe internos de otro. Una sola implementacion, que es el fin.

**Pruebas.** `test/cli/flags-desconocidos.test.ts` (21: unitarios y los 13
comandos contra repos temporales, sin commits ni ficheros tras abortar),
`test/fs/rondas-aprobada.test.ts` (5), y los asserts de review y main que
citaban el texto viejo. Suite completa: 1081 tests, solo los 3 rojos
conocidos de Windows.

**Revision ronda 1: aprobada** (0 criticos, 0 importantes, 2 menores; suite
en clon limpio con los mismos 3 rojos; mutaciones sobre la guarda de finish,
codex-review y la puerta de rondas ponen rojos sus tests). Por A3, sin ronda 2.
- MEN-1, corregido en el cierre: `--push=1` o `siguiente --json=1` pasaban la
  guarda y se ignoraban. Los flags booleanos (`--push`, `--json`, `--forzar`,
  `--escribir`) con `=valor` abortan ahora con «no lleva valor». Test.
- MEN-2, sin cambio: un `--` suelto se rechaza como flag desconocido. Ningun
  comando lo usa; es coherente con la guarda.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
| 2026-10-05 | review | manual | persona |
| 2026-10-05 | finish | manual | persona |
