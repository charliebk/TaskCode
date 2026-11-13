---
id: TASK-113
titulo: "P-5: peticion de revision mas ligera con los tests como --stat y ruta"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-113-p-5-peticion-de-revision-mas-ligera-con
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 4539807
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

La peticion de la ronda 1 pesa 116 KB de mediana en ToolsaWeb (unos 30 K tokens por revisor antes de leer nada) porque embebe el diff entero de los tests. Que embeba el diff del codigo y liste los tests con --stat y su ruta. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-5)

## Criterios de aceptacion
- [x] La peticion embebe el diff del codigo de produccion y lista los ficheros de test con su --stat y su ruta, sin su diff (test en repo temporal)
- [x] Con un diff de tres ficheros de test grandes, la peticion pesa menos de la mitad que con la version anterior (test que compara tamanos)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

`diffParaRevision` separa los tests (globs `PATRONES_TEST`, calculados por Git) del
diff embebido; la peticion los lista en `## Tests del diff` con su `--stat=200` y la
orden para pedir su diff. La clasificacion por dominio no cambia (los tests siguen en
`incluidos`); en la peticion fragmentada cada dominio lista solo sus tests. La propia
peticion de esta tarea peso 14,9 KB.

Revision por pares, ronda 1 (general-purpose + code-quality-reviewer, sonnet):
aprobada-con-correcciones, sin CRITICOS ni IMPORTANTES.

- MEN-1 (MENOR, corregido): con miles de rutas de test largas `statDeFicheros` daba
  ENAMETOOLONG en Windows. Ahora va por lotes de `LOTE_RUTAS_STAT` (100) rutas, y con
  mas de `MAX_RUTAS_ORDEN_TESTS` (20) tests la orden impresa pide por los patrones de
  test (respetando `excluir_de_revision`). Dos tests nuevos; mutantes (sin lotes,
  umbral a 1000) cazados.
- MEN-2 (MENOR, corregido en el comentario): `PATRONES_TEST` y `esRutaDeTest`
  difieren en dos bordes (carpeta `x.test.y/`, `Test/` con `core.ignorecase`). Lo
  peor es embeber de mas o listar de menos; se documenta en el comentario y no se
  unifica.

Modo rapido (decision de Carlos, 2026-11-12): los MENORES se corrigen sin ronda 2;
el coordinador verifico los tests afectados (`review-tests-stat`, `review-exclusion`,
`review-dominios`) y los mutantes. Verificacion por impacto en verde (848 pass, 0 fail).
Incidencia: el freno Stop y `taskctl review` corrieron `verificar-impacto` a la vez,
se pisaron (`dist/src` borrado, rojo falso guardado en el memo) y hubo que restaurar
`dist/src` y borrar `.git/freno-verificacion-selectiva.json`.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T00:11:26Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T00:12:08Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T00:12:10Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T00:33:38Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T00:56:27Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T00:33:38Z | implementacion | sesion:1fb23e40-df0f-4598-9be1-751ce6506e3c | 64 | 34450 | 4488616 | 16677 | 5 | 4539807 | - | - |
