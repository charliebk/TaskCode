---
id: TASK-090
titulo: "El guardian de secretos tolera excepciones solo en su fichero historico"
tipo: fix
sprint: 0
etiquetas: [seguridad, tests]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-090-el-guardian-de-secretos-tolera-excepcion
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 84782
tokens_implementacion: null
tokens_revision: 757497
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

El test sin-literales-secretos de TASK-089 tolera por valor la clave de ejemplo de Stripe en cualquier fichero, y GitHub la bloquea en commits nuevos: el plan de TASK-089 la cito entera y el push de develop fallo sin que la suite avisara. Las excepciones tienen que valer solo para los ficheros historicos ya publicados.

## Criterios de aceptacion
- [x] La lista de excepciones son parejas exactas fichero+valor; la clave de ejemplo de Stripe copiada en cualquier otro fichero versionado pone el test en rojo con ruta y linea
- [x] Una contraprueba del test demuestra que un valor permitido en un fichero historico sigue en rojo en otro fichero
- [x] El test pasa sobre el arbol actual, incluidos los ficheros de TASK-066 y TASK-089 ya publicados en origin
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

**Implementado.** El guardian de secretos ya no tolera un valor por si solo: la clave de ejemplo
de Stripe y el token corto de Slack solo valen en el fichero historico concreto donde ya estan
publicados; copiados en cualquier otro fichero versionado, el test da rojo con fichero y linea.

- `test/empaquetado/sin-literales-secretos.test.ts`: el mapa por valor se parte en
  `PERMITIDOS_EN_CUALQUIER_FICHERO` (solo `AWS_EJEMPLO`, que GitHub no marco) y
  `EXCEPCIONES_HISTORICAS`, cinco parejas exactas fichero+valor (las peticiones de revision de
  TASK-066 y TASK-089 y el plan de TASK-089), con la constante troceada como valor y comparacion `===`.
- Una pareja que deja de usarse en el recorrido es rojo («excepcion historica muerta: quitala»).
- Contraprueba nueva: el mismo texto da `[]` con la ruta historica y un hallazgo con fichero y
  linea con una ruta nueva, para Stripe y para Slack. La contraprueba negativa deja de pasar esos
  dos valores con una ruta inventada.

**Origen.** El push de develop tras TASK-089 lo bloqueo GitHub: el plan de TASK-089 citaba entera
la clave de ejemplo de Stripe y el guardian la toleraba por valor. Se permitio en GitHub (sin
reescribir historial) y el push paso; con este cambio, una copia nueva sale en rojo antes del push.

**Evidencia.** Mutantes a mano: la clave de ejemplo de Stripe (armada en ejecucion) en `LICENSE`
→ rojo con `LICENSE:23 stripe-test`; una pareja extra con ruta inexistente → rojo por excepcion
muerta. El guardian sigue en verde con la peticion de revision de esta tarea (que copia el diff).
Suite completa: 2059 tests, 2055 pasan, 3 fallan (los tres conocidos de Windows), 1 saltado.

**Revision por pares.** Ronda 1 (general-purpose / sonnet / code-quality-reviewer): aprobada, 8
mutantes, todos en rojo. Dos MENOR, aceptados sin corregir:
- MEN-1: una excepcion vale para cualquier numero de apariciones en su fichero. Se acepta: son
  ficheros cerrados en `04-terminadas` y la pareja no cubre otro fichero ni otro valor.
- MEN-2: `AWS_EJEMPLO` sigue tolerado en cualquier fichero. Se acepta (decision del plan): GitHub
  no lo marca y esta en dos ficheros vivos; si cambiara, se pasa a parejas anadiendo filas.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T21:10:36Z | plan | automatico | persona |
| 2026-11-07T21:34:23Z | approve | automatico | persona |
| 2026-11-07T21:34:24Z | start | automatico | persona |
| 2026-11-07T21:59:21Z | review | automatico | persona |
| 2026-11-07T22:04:51Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T21:12:41Z | diseno | agente:a269401a4a2993ca0 | 8 | 23575 | 55275 | 5924 | 6 | 84782 |
| 2026-11-07T22:04:10Z | revision | agente:a2042029b290b7741 | 16 | 101489 | 648966 | 7026 | 2 | 757497 |
