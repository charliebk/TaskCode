# Salida de brainstorm — TASK-104, rol arquitectura (ronda 1)

## Enfoque propuesto, con rutas y nombres concretos

`verificacionSelectivaDeRonda` (src/commands/review.ts:1023) pasa a `verificacionDeRonda`: llama a `peticionDeTrabajo` (src/fs/decision-documentacion.ts:131) con `sinSelectiva: 'nada'` y ejecuta el plan con `verificarConMemo`, como el freno Stop (freno-stop.ts:182-212). Ningun modulo nuevo: la decision vive en fs/, review solo ejecuta. `decidirVerificacionEntre` mira siempre base...HEAD mas el arbol, nunca `desde`.

Guarda temprana intacta: si `configRama.comando_verificacion_selectiva === null`, null sin llamar a `peticionDeTrabajo` (cero git nuevo, igual que la 0.14.0, y «sin selectiva no corre nada» aunque haya comando de documentacion).

## Que se extiende y que se crea

- `verificacionDeRonda` (review.ts) — se extiende; mismo sitio (l.764) y patron: antes de escribir, `ReviewCommandError` en rojo o con `cambioElArbol`. Devuelve `{ plan, v } | null`; null o documentacion sin comando = nada.
- `peticionDeTrabajo` — se reutiliza tal cual: `config: configRama`, `raiz: raizDelRepo(repoCwd)`, `base: () => baseBranch` (resuelta en l.665).
- `baseFiable` — el predicado de Stop, `baseDeTipoSinRed(tipo)` (fs/git.ts:706), para decidir igual que Stop tambien en un hotfix.
- `seccionVerificacionRevision` (core/informe-verificacion.ts:136) — se extiende: `VerificacionDeRonda` gana `tipo: 'selectiva' | 'documentacion'` (documentacion con motivo, sin RAMA_BASE). Nada de segunda funcion que copie el formato.
- Mensajes de rojo y arbol sucio — cambian segun el tipo (hoy dicen «selectiva ... RAMA_BASE»).
- Memo `documentacion` con arbol sucio — no se toca: lo hereda de `verificarConMemo` (verificacion.ts:273).

Orden: 1) `tipo` en `VerificacionDeRonda` (con 'selectiva', texto identico byte a byte); 2) `verificacionDeRonda` y usos de l.772 (cobertura) y 935 (seccion); 3) avisos de `peticionDeTrabajo` (config de la base invalida) a la salida de review; 4) docs.

## Limites que cruza

- Formato de la peticion de revision (seccion «Verificacion de esta ronda»): nuevo tipo «documentacion».
- Salida de review: avisos nuevos (Stop los saca por stderr; review no tiene ese canal).
- Alternativas descartadas: decidir con el diff de la ronda (lo prohibe el objetivo); quitar la guarda y confiar en `sinSelectiva: 'nada'` (correria la de documentacion sin selectiva, prohibido por Carlos, y lanzaria `git show`). Tampoco un tercer modo en `peticionDeTrabajo`.

## La decision de diseño que mas te preocupa (UNA sola)

`baseFiable` en review: el mismo predicado que Stop y no `true`, aunque review ya tenga la base resuelta. El criterio 3 pide la misma decision por construccion; que un hotfix en review corra la selectiva es coste aceptado.

Otros puntos: cobertura oculta solo cuando el plan es `selectiva`; el test del criterio 3 compara con la selectiva declarada (sin ella Stop corre algo y review nada). Suposiciones no verificadas: `tipo` nunca null en review; el autocommit de la ronda va despues de l.764; `VerificacionDeRonda` solo se usa desde review; review no recorta el timeout; donde saca review sus avisos.
