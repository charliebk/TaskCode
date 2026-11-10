## Enfoque

Un unico punto de decision puro, `decidirVerificacion(config, ambito, diff)` en
`src/core/verificacion-proporcional.ts` (nuevo), al que llaman los cuatro consumidores que hoy deciden
cada uno por su cuenta (`commands/finish-verificacion.ts:74`, `hooks/freno-stop.ts:169-188`,
`commands/review.ts:1030`, `hooks/guardia-merge.ts:94/140`). Las rutas cambiadas las calcula Git con su
propio motor de pathspec (como ya hizo TASK-074 con `pathspecSinExcluidos`); el nucleo solo decide
completa / selectiva / documentacion / ninguna y el motivo. Sin `rutas_documentacion` devuelve
exactamente lo de la 0.14.0.

Estimacion de punta a punta: 150-180 min (8 ficheros de codigo, 5 capas core/fs/commands/hooks/docs,
7 criterios con tests de integracion en cuatro consumidores). Pasa de 60 min: se parte en tres (ver
«Orden de construccion»).

## Piezas y limites

- `core/config.ts` — se extiende: dos claves nuevas, `rutas_documentacion` (lista, semantica
  `git :(glob)` como `excluir_de_revision`) y `comando_verificacion_documentacion`. Regla de validacion
  cruzada como la de la linea 684 (rutas sin `comando_verificacion` = sin efecto).
- `core/verificacion-proporcional.ts` — se crea, puro:
  `decidirVerificacion(config, ambito: 'puerta'|'ronda', diff: {todas, fueraDeDocs} | null): {tipo, comando|null, motivo}`.
  `diff === null` → la decision de siempre (fail-closed en un solo sitio, no en cuatro).
- `fs/git.ts` — se extiende: `rutasDeTarea(raiz, base, hasta: 'HEAD'|'arbol'|sha) → {todas, fueraDeDocs} | null`
  contra el merge-base (`base...hasta`), no el `desde..hasta` de `diffNameOnly`; con 'arbol' suma lo no
  commiteado y los no trackeados (lo que necesita Stop). `fueraDeDocs` reutiliza `pathspecSinExcluidos`.
- `fs/verificacion.ts` — se extiende: `TipoVerificacion` gana `'documentacion'` con su propio fichero
  de memo, el mismo patron de dos tipos y dos memos de TASK-091 (un verde de documentacion nunca abre la
  puerta de la completa).
- Los cuatro consumidores — se extienden sin logica de decision propia; cada uno mantiene su politica
  (finish aborta, Stop bloquea el turno, review no abre la ronda, el guardian bloquea el merge). finish,
  con documentacion, ejecuta y guarda el memo `'documentacion'` y dice que corrio y por que. El guardian
  recalcula el diff con `rutasDeTarea(raiz, destino, sha)`: si es solo documentacion exige el verde del
  memo de documentacion (si hay comando) o deja pasar (si no lo hay); sigue sin ejecutar nada (timeout 30 s).
- Coste: Stop corre en cada turno; se anaden 2-3 procesos git solo tras la guarda 6 (tarea en curso en la
  rama) y solo si la clave esta declarada: sin opt-in, coste cero. El guardian, lo mismo una vez por merge
  protegido. Un release hacia main trae un diff grande, pero `--name-only` escala bien y saldra mixto
  (camino de siempre).

## Orden de construccion

1. A1 (~60 min): config + `core/verificacion-proporcional.ts` + `rutasDeTarea` + memo `'documentacion'` +
   su uso en `finish-verificacion.ts`. Criterios 1, 2 y regresion de finish (5). Entregable sola: sin el
   resto, el guardian sigue bloqueando un merge manual como hoy (no es regresion).
2. A2 (~40 min): `guardia-merge.ts` lee el memo de documentacion que ya escribe A1. Criterio 4 y su regresion.
3. A3 (~50 min): `freno-stop.ts` (diff con 'arbol' antes de elegir memo) y `review.ts`. Criterio 3 y su regresion.
4. Cierre de A3: `verificacion-selectiva.md`, README y CHANGELOG (criterio 6); suite completa una sola vez (7).

## Alternativa descartada

- Que finish escriba un «verde» en el memo de la completa cuando la tarea es solo documentacion, para no
  tocar el guardian: rompe la separacion de memos de TASK-091 y deja un verde de completa que no corrio.
- Clasificar en JS con `globARegExp`/`casaConAlguno` de `core/contexto-revision.ts`: dos motores de patrones
  para la misma semantica `:(glob)`; TASK-074 ya eligio Git como motor unico.

## Desacuerdos previstos

- riesgos — el guardian recalcula el diff en vez de fiarse solo del memo: recalcular es lo unico que
  garantiza la misma decision que finish sobre el mismo commit, y cuesta un `git diff --name-only`.
- riesgos — si un diff vacio, borrados o renombres cuentan como «solo documentacion»: lo decide una rama
  de `decidirVerificacion`, en un solo sitio; la regla concreta no es de este rol.
- riesgos — entregar A1 antes que el guardian: se puede, porque sin A2 el guardian se comporta como en la
  0.14.0, que es mas estricto, no mas laxo.

## Suposiciones no verificadas

- Que `review` sin `comando_verificacion_selectiva` no corre ninguna verificacion (comentarios de
  `review.ts:759` y `:1031`; leer el bloque entero).
- Que `resolveBaseBranchForTipo(tipo, raiz)` vale para finish igual que para Stop (hotfix y release).
- Que el parser de config admite claves de lista nuevas sin codigo extra (precedente `rutas_sincronizacion`).
- Que el diff de review tras el update (base ya mergeada) da con `base...HEAD` lo mismo que ve finish.
- Si la comprobacion de documentacion necesita timeout propio o reutiliza `timeout_verificacion`
  (propuesta: reutilizarlo).

Ficheros revisados (bajo `taskcode-marketplace/plugins/taskcode-plugin/src/`): `commands/finish-verificacion.ts`,
`hooks/freno-stop.ts`, `hooks/guardia-merge.ts`, `commands/review.ts`, `fs/verificacion.ts`, `fs/git.ts`,
`core/config.ts`, `core/contexto-revision.ts`.
