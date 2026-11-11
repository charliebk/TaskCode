# Plan — TASK-105: Verificacion proporcional B2: decision entre refs y huella para el nivel 2

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

Duracion estimada: 65 min (55 de base + 10 por D-C, elegida; de la rama abierta al cierre con merge; senales: 4 ficheros de codigo previstos en src — decision-documentacion.ts, git.ts, verificacion.ts, guardia-merge.ts — mas 2-3 de test; 2 capas: fs y hooks; 4 criterios; +10 min si D-C toca finish-verificacion.ts, +15 si D-A elige la segunda ranura: con ambas pasa de 60, ver troceo en D-A)
- Orden (arquitectura): 1) `rutasFueraDe`/`rutasDelArbolFueraDe` extraidas de `rutasDeTarea`/`rutasDelArbol` en git.ts, sin cambiar sus firmas; 2) segunda pasada perezosa en `decidirVerificacionEntre` solo con `parcialDeclarada`, diff no nulo, sin `RUTA_CONFIG` y `fueraDeDocs` no vacio; `unir` y held-out cubren `fueraDeParcial`; campo aditivo `timeoutSelectivaS` de la base.
- 3) `huellaDeCommit(..., contexto?)` copia la linea 131 de `huellaDelArbol`; `contextoSelectiva` se exporta; `VERSION_MEMO` sigue en 1 (arquitectura y riesgos coinciden). 4) Condicion de guardado de `verificarConMemo:273` segun D-A. 5) Corte explicito de `selectiva` en `guardia-merge.ts:267` (ambos roles).
- Desviacion del enunciado, de arquitectura: el objetivo dice «un segundo rutasDeTarea»; arquitectura pide solo la lista excluida (`rutasFueraDe`) para no relanzar el `diff -- :(top)` de `todas`. Mismo motor de pathspec (TASK-100/102). El revisor debe saber que es intencionado.
- Comprobado por el unificador en el codigo: `decision-documentacion.ts:82` sale si no hay `rutas_documentacion`; `guardia-merge.ts:267` solo corta en `'completa'`; `huellaDeCommit` (verificacion.ts:144) no acepta contexto; `verificacion.ts:273` hoy guarda la selectiva con el arbol sucio.

## Desacuerdos entre roles, y como se resuelven

- Hueco del guardian — arquitectura: `d.tipo !== 'documentacion'` con detalle propio en B2 / riesgos: tratar `selectiva` como `completa` explicitamente en B2 — coinciden en cerrarlo ya (gana el corte en B2) — D1 hoy solo se sostiene porque busca en un tipo de memo que no corresponde (riesgos, modo 1). El texto del detalle queda atado a D-C.
- D-A memo selectiva con arbol sucio — arquitectura: ranura interna adicional para el Stop sucio, `leerMemo` busca en las dos / riesgos: conservar la regla del arbol limpio aunque se repita la selectiva en Stop — sin resolver: sube a decision humana.
- D-B salida temprana sin `rutas_documentacion` — arquitectura: relajarla a `!documentacionDeclarada && !parcialDeclarada` / riesgos: relajarla cambia lo observable para quien declare solo la clave parcial (pasa de null a aviso en finish y detalle en guardian) — sin resolver: sube a decision humana.
- D-C mensaje contradictorio con `selectiva` — arquitectura: no tocar finish-verificacion.ts (la linea 156 ya la trata como completa) / riesgos: el texto «se ejecuta la verificacion completa: basta la verificacion de lo afectado» se contradice; los llamantes convierten selectiva en completa con motivo neutro — sin resolver: sube a decision humana.

## Riesgos aceptados y que los contiene

- Escape de codigo sin clasificar si `fueraDeParcial` se arrastra con spread y deja fuera held-out o arbol — riesgos — recalcularlo siempre tras sumar arbol y held-out; arquitectura aplica `conArbol` y held-out al tercer campo; test por caso.
- Dos lecturas de Git sobre refs que se mueven entre el primer y el segundo diff — riesgos (arquitectura no lo trata) — resolver `base` y `hasta` a SHA una sola vez antes de ambos diffs.
- Segundo diff falla con el primero bien — riesgos — `fueraDeParcial: undefined` y completa (verificacion-proporcional.ts:145); nunca reutilizar `fueraDeDocs`.
- Presupuesto del guardian (`PRESUPUESTO_EXENCION_MS = 20_000`) con un proceso mas — riesgos — falla del lado seguro (bloquea); coste +1 git diff en finish/guardian, +2 por Stop con arbol (arquitectura).
- Huella con contexto que casa en el test y no en la realidad (`develop` frente a `origin/develop`, base que avanza, timeout de arbol frente a base) — riesgos — una sola `contextoSelectiva` exportada y `timeoutSelectivaS` de la base (arquitectura); falla cerrado, el aprovechamiento real queda para B3.

## Plan de pruebas

- Con la clave en la base: selectiva si todo lo no-doc cae en parcial; completa si algo queda fuera, si cambia `.taskcode/config.yml` o si el diff no se calcula — repo Git temporal, un test por caso — enunciado (criterio 1).
- Sin la clave: cero git de mas y la decision de la 0.14.0 — repo temporal contando procesos o con espia de `rutasFueraDe` — enunciado (criterio 2); riesgos pide ademas que un perfil tipo ToolsaWeb no cambie ni un proceso ni un mensaje.
- `huellaDeCommit` con contexto casa con la que guarda `verificarConMemo` selectiva para la misma base y timeout; sin contexto, la formula exacta de hoy — repo temporal — enunciado (criterio 3) y riesgos (compatibilidad de memos).
- Memo selectiva con arbol sucio segun lo que se decida en D-A; segundo diff fallido da completa; held-out en `tareas/**/aceptacion/` cuentan fuera de parcial — repo temporal — riesgos.
- Guardian con `selectiva` bloquea de forma explicita, no por tipo de memo, aunque `comando_verificacion_documentacion` sea igual a la selectiva — repo temporal — riesgos (modo 1) y arquitectura.
- `npm test` completa en verde (salvo los 3 rojos conocidos de Windows) sin debilitar tests — suite — enunciado (criterio 4).

## Sin cubrir

- Ningun rol dice como probar «sin git de mas» sin un doble (la suite prohibe mocks salvo el de gh/glab) — lo decide quien implemente; si no hay forma sin doble, va al Resultado.
- La discrepancia de complejidad (declarada media, heuristica simple) no la comenta ningun rol — el plan la deja anotada; con D-A en ranura doble se acerca mas a media.

## Salidas que faltaron

- ninguna

## Suposiciones no verificadas

- ToolsaWeb declara `comando_verificacion_selectiva` y no la clave parcial — riesgos — mirar su `.taskcode/config.yml`.
- Cuanto ejecuta hoy el Stop con el arbol sucio y cuanto costaria repetir la selectiva — arquitectura y riesgos — medir en ToolsaWeb (`freno-stop.ts:206-220`).
- Que el guardian y el Stop pasen la base con el mismo nombre — riesgos — revisar que pasa `destino` de `branch --show-current` frente a la base de la tarea.
- Que con arbol limpio y contexto ambas formulas den la misma huella sin subir `VERSION_MEMO` — arquitectura — lo fija el test del criterio 3.

## Lo que necesita decision de una persona

- D-A memo selectiva con arbol sucio — (1) regla del arbol limpio al pie del criterio 3 y aceptar que el Stop sucio repita la selectiva (hasta 600 s), con constancia en el Resultado (riesgos); (2) segunda ranura interna en `FICHEROS_MEMO` solo para el Stop sucio, `leerMemo` lee las dos (arquitectura). Recomendacion: (1), porque es lo que pide el criterio, evita que un Stop sucio pise el verde limpio y no anade un mecanismo caro de deshacer; medir antes de B3. Si se elige (2), trocear: B2a = criterios 1-2 + corte del guardian; B2b = huella, memo y ranura (criterio 3).
- D-B salida temprana — (1) mantener `!documentacionDeclarada` y exigir `rutas_documentacion` para llegar al nivel 2 en B2 (riesgos); (2) relajar a ninguna de las dos claves (arquitectura). Recomendacion: (1), porque el objetivo dice «nada observable cambia todavia»; relajarla en B3/B5, cuando la selectiva ya se vea. Los tests del criterio 1 declaran ambas claves.
- D-C mensaje con `selectiva` — (1) finish y guardian convierten selectiva en completa con motivo neutro hasta B3/B5 (riesgos); (2) no tocar finish y aceptar el texto contradictorio, con solo el detalle propio en el guardian (arquitectura). Recomendacion: (1), barata y es lo que hace cierto el «nada observable»; suma finish-verificacion.ts al recuento (+10 min).
- Aprobacion del plan entero con `taskctl approve`: este plan no autoriza implementar hasta que una persona lo apruebe.

### Decisiones de la persona (Carlos, 2026-11-11, fase de diseno)

- **D-A: opcion (1)**, regla del arbol limpio: el memo selectiva no se guarda con el arbol sucio. Se acepta que el Stop con el arbol sucio repita la selectiva, y se deja constancia en el Resultado. El coste se mide en ToolsaWeb antes de B3. No se trocea.
- **D-B: opcion (1)**, se mantiene la salida temprana `!documentacionDeclarada`. Relajarla queda para B3/B5.
- **D-C: opcion (1)**, finish y el guardian convierten selectiva en completa con un motivo neutro hasta B3/B5. finish-verificacion.ts entra en el recuento.
- Duracion resultante: unos 65 min (55 + 10 de D-C). Pasa ligeramente de 60. No se propone trocear: el unico corte natural (B2a/B2b) era para el caso de la segunda ranura, que se ha descartado. La persona decide en approve.
