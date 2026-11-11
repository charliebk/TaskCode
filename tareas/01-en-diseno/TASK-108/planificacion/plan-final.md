# Plan — TASK-108: Verificacion proporcional B5: el guardian de merges ante el nivel 2

(Lo consolida el agente unificador a partir de 2 roles de brainstorm lanzados en paralelo: arquitectura, riesgos.
Se lanzaron 2 porque la complejidad declarada, media, gana a la heurística, simple: se toma el mayor de los dos números.
Los desacuerdos entre roles se señalan, no se promedian. Este plan no vale hasta que una persona lo apruebe con `taskctl approve`.)

## Enfoque propuesto

- No cambia la lógica de decisión. Arquitectura sostiene que D1 ya está cableado desde TASK-105: `exencionDocumentacion` bloquea con `selectiva` y el guardián nunca lee el memo `selectiva`.
- Orden (arquitectura): 1) tests de los criterios 1, 2 y 4 contra el código actual; si alguno sale rojo, se para; 2) el texto de `motivoDeLaCompleta` pasa de `fs` a `guardia-merge.ts`; 3) una línea propia para el caso `selectiva` y su test (criterio 3); 4) comentarios.
- Los comentarios que dicen «hasta que el guardián la acepte (B5)» se reescriben con D1 («nunca»): `decision-documentacion.ts:148-155`, `finish-verificacion.ts:280-281` y la cabecera del guardián (arquitectura y riesgos, modo 4).
- Remedio del mensaje: solo `taskctl finish TASK-NNN` (y, si hay conflicto, resolver en la rama y repetir) o `--sin-verificacion` como decisión de la persona. Nunca «corre la completa y repite el merge» (riesgos, modo 1; arquitectura coincide).

Duracion estimada: 55 min (de la rama abierta al cierre con merge; señales: 3 ficheros de código, `guardia-merge.ts`, `decision-documentacion.ts` y `finish-verificacion.ts`, este último solo comentarios; 1 de tests; 2 capas, `fs` y `hooks`; 5 criterios; una suite completa de unos 10 min más la revisión). La estimación es del unificador, no de los roles. Si entra el corte por tiempo del modo 2 de riesgos, sube a unos 80 min y se trocea: ese corte va a una tarea aparte, con su medición en ToolsaWeb, y esta se queda con tests, mensaje y comentarios.

## Desacuerdos entre roles, y como se resuelven

- Alcance del criterio 2 — arquitectura: el criterio se refiere a la decisión 6b, que ya usa `configDeRef(destino)`; llevar los pasos 3 y 6 al destino rompe el emparejamiento de la huella con `finish` (`finish-verificacion.ts:135`) / riesgos (modo 3): el paso 3 lee la config del árbol y un `comando_verificacion` borrado en la feature deja pasar el merge; o se prueba ese camino o se acota por escrito — gana arquitectura: no se tocan los pasos 3 y 6 — riesgos acepta el acotado como mitigación y arquitectura da una razón concreta para no tocar el código. El acotado del criterio lo confirma una persona (ver abajo).
- Corte por tiempo en el guardián — riesgos (modo 2): con código, cortar antes del diff de nivel 2, porque la respuesta no depende de él y el hook podría morir a los 30 s y dejar pasar el merge / arquitectura: B5 no toca la lógica de decisión — sin decidir — depende de una medición que nadie ha hecho y cambia la lógica que arquitectura deja intacta. Sube a decisión humana.
- Convergencia sin discrepancia: que el guardián lea el memo `selectiva` — arquitectura lo descarta y riesgos lo veta. No hay desacuerdo.
- Convergencia sin discrepancia: «develop avanzó» no invalida la huella de la completa. Según los dos roles, la huella es `sha+comando+timeout`, sin la base.

## Riesgos aceptados y que los contiene

- Con nivel 2 ningún camino escribe el memo de la completa que busca el guardián; un texto mal escrito encierra al agente en un bucle que acaba en `--sin-verificacion` — riesgos (modo 1), también arquitectura — lo contiene el test del criterio 3: el texto nombra `taskctl finish` y no manda a repetir el merge.
- El guardián puede abrirse por tiempo en repos grandes: el presupuesto de 20 s solo se mira al entrar en la exención (`guardia-merge.ts:257`) — riesgos (modo 2) — si no se acota en esta tarea, no lo contiene nada; ver la decisión 1.
- El paso 3 sigue leyendo la config del árbol — riesgos (modo 3), arquitectura (es anterior a esta tarea) — lo contiene acotar por escrito el criterio 2.
- El mensaje puede afirmar una causa que no comprueba («develop avanzó», «la huella ya no casa») — riesgos (modo 5) — el texto no nombra causas ni depende de que exista el memo selectivo.
- Textos citados fuera del código: 4 aserciones en `guardia-documentacion.test.ts`, 1 en `guardia-merge.test.ts`, y citas en `skills/task-workflow/SKILL.md` y `verificacion-selectiva.md` — riesgos — el cambio solo añade texto (arquitectura) y esas citas se revisan con grep.

## Plan de pruebas

- Criterio 1, dos casos: una tarea sin código pasa con el verde de documentación; una con código se bloquea aunque exista el memo `selectiva` — repo temporal, `conEntorno`/`RUTAS` de `guardia-documentacion.test.ts` — arquitectura.
- Criterio 2: la rama introduce `rutas_verificacion_parcial` y el destino no la tiene, así que sale el comportamiento y el texto viejos — repo temporal — arquitectura y riesgos (compatibilidad).
- Criterio 3: el texto dice que hace falta la completa, nombra `taskctl finish TASK-NNN` y no contiene «repite el merge» — aserción sobre el texto — riesgos (modo 1) y arquitectura.
- Criterio 4: sin la clave, el texto sale byte a byte como en la 0.14.0 — repo temporal — riesgos.
- En hotfix y release, el mensaje nuevo no se mezcla con el detalle de `integ.release` — repo temporal — riesgos.
- `npm run test:rapido` mientras se itera; `npm test` una sola vez antes de la revisión, sin debilitar tests (criterio 5) — arquitectura.

## Sin cubrir

- Criterio 3, «cómo obtenerla»: los dos roles dicen que en nivel 2 no existe un camino real para obtener la completa, así que el criterio no se puede cumplir al pie de la letra sin mentir — va a decisión humana.
- Objetivo, «develop avanzó y la huella ya no casa»: los dos roles dicen que esa premisa no se da con la huella de la completa — el mensaje no la nombra (riesgos, modo 5).

## Salidas que faltaron

- Ninguna: llegaron arquitectura y riesgos, las dos completas.

## Suposiciones no verificadas

- El merge del script de Git-Flow que lanza `taskctl finish` no pasa por el hook `PreToolUse`, salvo con `--merge-request` — arquitectura — confirmar en `comandoCandidato`.
- `analizarComando` no clasifica `taskctl finish ... --merge-request` como merge — riesgos — confirmar en `analizarComando`.
- Sin `rutas_verificacion_parcial`, nunca sale `selectiva` en 6b — arquitectura — confirmar en `decidirVerificacion`.
- Ningún otro consumidor cita el texto exacto «la tarea cambia rutas que no son documentación» — arquitectura; riesgos afirma que dos skills citan el texto de `mensaje()` — confirmar con grep cuál de las dos cosas es cierta.
- Claude Code deja pasar el comando cuando el hook `PreToolUse` vence por tiempo — riesgos — sale de un comentario (`guardia-merge.ts:93-95`), no de una prueba.
- El diff de nivel 2 tarda lo bastante en un repo real como para comerse los 20 s — riesgos — medir con ToolsaWeb.

## Lo que necesita decision de una persona

- 1) ¿Entra en esta tarea el corte por tiempo del modo 2 de riesgos? — arquitectura lo deja fuera, riesgos lo pide, y nadie ha medido el coste; si entra, la tarea pasa de 60 min y hay que trocearla.
- 2) ¿Se acepta acotar el criterio 2 a la decisión 6b y dejar los pasos 3 y 6 con la config del árbol? — es reescribir un criterio de aceptación, y eso no lo decide este rol.
- 3) Criterio 3: ¿se acepta que «cómo obtenerla» sea `taskctl finish TASK-NNN` o `--sin-verificacion`, o se abre una tarea `finish --completa`, que cambia el contrato del CLI (arquitectura)? — el enunciado pide algo que, según los dos roles, hoy no existe.
- 4) Aprobar el plan entero con `taskctl approve` — es obligatorio; sin esa aprobación no se implementa.

## Decisiones de la persona (2026-11-11)

- 1) Corte por tiempo del modo 2: **tarea aparte**, con medición previa en ToolsaWeb. TASK-108 se queda en 55 min (tests, mensaje y comentarios).
- 2) Criterio 2: **se acota a la decisión 6b** (la exención decide con `configDeRef(destino)`). Los pasos 3 y 6 siguen con la config del árbol, emparejados con `finish`; moverlos sería otra tarea que mueva guardián y `finish` a la vez.
- 3) Criterio 3: el remedio del mensaje es **`taskctl finish TASK-NNN`** (si hay conflicto, resolver en la rama de la tarea y repetir) **o `--sin-verificacion`** como decisión de la persona. No se abre `finish --completa`.
