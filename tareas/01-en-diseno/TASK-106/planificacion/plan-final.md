# Plan — TASK-106: Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

Duracion estimada: 70 min (de la rama abierta al cierre con merge; señales: 4 ficheros de código —`core/transiciones.ts`, `commands/finish-verificacion.ts`, `commands/finish-cobertura.ts`, `commands/finish.ts`— más tests nuevos con procesos sobre repos temporales; 2 capas, core y commands, con `fs/verificacion.ts` reutilizado sin cambios; 6 criterios con un test por caso; la suite completa, ~10 min). Pasa de 60 min: se propone trocear (D3). La partición de TASK-096 le daba ~60 min a esta parte antes de añadir el helper compartido y la extracción de `anotarYCommitear`.

- `puertaSoloDocumentacion` pasa a `puertaProporcional` y se ramifica por `decision.tipo`; el caso `selectiva` llama a `verificarConMemo` (`fs/verificacion.ts:273`) con `tipo:'selectiva'`, `timeoutSelectivaS` y `base: ramaBase`, que ya impone `RAMA_BASE` y escribe solo `freno-verificacion-selectiva.json` (arquitectura; riesgos pide eso mismo en sus modos 1 y 7).
- `ResultadoPuerta` gana `{tipo:'selectiva'; comando; motivo; deMemo}` y `puertaCobertura` lo trata como `omitida` (arquitectura; riesgos, modo 5; decisión D4 de Carlos).
- Orden (arquitectura): 1) `transiciones.ts`: `SECCION_VERIFICACION_PARCIAL` y `anotarVerificacionParcial`, con helper idempotente compartido (core, `test:rapido`); 2) `ResultadoPuerta` y cobertura; 3) `puertaProporcional` y el árbol limpio después, como en `:185-191`; 4) `finish.ts` pasa `permitirSelectiva` (falso en hotfix; el release no recibe `ramaBase`), el texto TASK-091 queda condicionado a `parcialDeclarada` y la salida dice el motivo y si vino del memo.
- Se anota en `tarea.md` después del verde y antes del merge, nunca antes de ejecutar (arquitectura y riesgos lo proponen por separado: si se commitea antes, cambia HEAD y el memo no casa nunca).

## Desacuerdos entre roles, y como se resuelven

- **Reutilizar en finish el memo del Stop o de review** — arquitectura: sí, porque lo pide el objetivo, y solo para la selectiva (la completa sigue sin memo) / riesgos: «invierte la decisión de TASK-072» (el memo no ve los ignorados: `dist/`, generados, `.env`); si se mantiene, solo con memo `verde`, árbol limpio y la misma base por nombre, y como decisión explícita de la persona. **No lo resuelve este plan:** el objetivo lo pide, pero las decisiones de Carlos del 2026-11-11 no derogan TASK-072. Sube entero a D1.
- **Reutilizar un memo `roja` o `cortada`** — riesgos (modo 4): `leerMemo` devuelve cualquier estado (`verificacion.ts:183-198`), así que un timeout del Stop deja finish bloqueado hasta el siguiente commit; pide reutilizar solo el verde / arquitectura no lo trata y declara que no se tocan el freno Stop ni review. Filtrarlo dentro de `verificarConMemo` cambiaría también el Stop y review. Va con D1.
- **Constancia del nivel que corrió en cada intento** — riesgos (modo 6): tras un rojo selectivo y un reintento con la completa, la línea «selectiva» se queda porque la idempotencia compara el texto (`transiciones.ts:378`) / arquitectura propone una sola línea con el parámetro `selectiva` sin tratar el reintento. **Gana riesgos:** arquitectura no se opone y, sin esa constancia, la anotación miente en la auditoría.
- Hotfix, RAMA_BASE, cobertura, texto TASK-091 y orden anotar-tras-verde: **los dos roles coinciden**. Puede ser porque los dos partían del plan de TASK-096 con las decisiones de Carlos ya tomadas (el mismo contexto), no necesariamente porque el diseño sea sólido. Ojo con el hotfix: los dos coinciden entre sí, pero no con la letra de Carlos (D2).

## Riesgos aceptados y que los contiene

- Integrar código con un verde que no ha probado nada si la selectiva sale con 0 sin `RAMA_BASE` (riesgos, el que más le preocupa) — lo contiene lanzarla solo por `verificarConMemo`, que pisa el `RAMA_BASE` heredado (`verificacion.ts:286-289`), y la completa del release.
- Merge con push en develop tras un verde solo selectivo: no tiene vuelta atrás (riesgos) — revert y completa; se detecta en el release (D2 de Carlos en TASK-096).
- `finish --merge-request` con selectiva: la plataforma mergea y el segundo `finish` no vuelve a verificar (riesgos) — lo mismo: la completa del release.
- Selectiva cortada a los 600 s cuando el script decide correrlo todo (riesgos) — falla en cerrado: no integra (D5 de Carlos).
- develop avanza entre el Stop y finish (arquitectura y riesgos) — el SHA de la base va en la huella (`verificacion.ts:246-248`); solo cuesta reejecutar.

## Plan de pruebas

- Código dentro de `rutas_verificacion_parcial`: selectiva 1 y completa 0, integra y lo dice; código fuera: al revés, y el motivo — repo temporal, contadores reales (criterio 1; arquitectura, riesgos).
- Selectiva en rojo: develop no se mueve y la tarea sigue en revisión — repo temporal (criterio 2).
- El verde selectivo no escribe `freno-verificacion.json` (riesgos, modo 7); cobertura `omitida` con `umbral_cobertura` declarado (riesgos, modo 5); release y hotfix corren la completa (riesgos, modo 2) — un test por caso (criterio 3).
- Código y su propio clasificador cambiados a la vez → completa; y la clave ausente con `comando_verificacion_selectiva` declarado → completa con el texto TASK-091 intacto (criterios 4 y 5; arquitectura).
- Si D1 mantiene la reutilización: un memo verde del Stop casa y no reejecuta; un memo `cortada` no bloquea; el reintento tras un rojo deja anotado el nivel real (riesgos, modos 4 y 6).
- `anotarVerificacionParcial` idempotente, en `test:rapido` (arquitectura). La suite completa, una vez, antes de la revisión (criterio 6).

## Lo que necesita decision de una persona

### Sin cubrir
- No se lanzó un rol de testing: el plan de pruebas sale de los criterios y de las mitigaciones de riesgos, y nadie diseñó mutaciones.
- La heurística dio simple y se declaró media; los 70 min estimados apuntan a que el enunciado tampoco refleja lo que cuesta.

### Salidas que faltaron
- Ninguna: llegaron las dos.

### Suposiciones no verificadas
- Que el memo del Stop/review casa con el de finish: ellos usan el comando y el timeout del árbol; finish, los de la base (arquitectura y riesgos) — leído, no ejecutado; mirar `decision-documentacion.ts:218` y `freno-stop.ts`.
- Que la base con la que el Stop guarda el memo tiene el mismo nombre que la `ramaIntegracion` de finish (riesgos) — `freno-stop.ts`.
- ~~Que el merge interno de finish no dispara `guardia-merge`~~ — **verificado al redactar el plan**: el guardián es un hook `PreToolUse` que analiza solo el texto del comando Bash/PowerShell del agente (`hooks/guardia-merge.ts:1-11`); `taskctl finish TASK-NNN` no contiene `merge` y el script de cierre lo lanza finish por spawn, que el hook no ve. Con `--merge-request` el texto contiene «merge», pero `analizarComando` no encuentra ni `git merge` ni script de cierre y deja pasar (guarda 2).
- Que sin `rutas_documentacion` no hay nivel 2 (`decidirVerificacionEntre:96`) y que `anotarLineaEnSeccion` sirve tal cual (arquitectura).
- Qué hace el script selectivo de ToolsaWeb sin `RAMA_BASE` (riesgos).

### Decisiones abiertas para la persona
- **D1. ¿finish reutiliza el memo selectivo del Stop/review?** Lo pide el objetivo (arquitectura); riesgos dice que invierte TASK-072. Si se reutiliza: ¿con las condiciones de riesgos (solo verde, árbol limpio, misma base) y aceptando tocar `verificarConMemo`, compartido con el Stop? Si no se reutiliza, el objetivo se reescribe. No lo decide este rol porque revierte una decisión registrada.
- **D2. ¿El hotfix pierde su camino de solo documentación?** Carlos: «hotfix siempre a la completa». Arquitectura (`permitirSelectiva` a falso) y riesgos («aplicarlo solo al nivel 2; nadie lo ha pedido») lo conservan. La letra de Carlos admite las dos lecturas y deshacerlo cambia la 0.14.0.
- **D3. Troceo (70 min > 60).** Propuesta, siguiendo el orden de arquitectura: 106a, pasos 1-2 (sección idempotente, `ResultadoPuerta` y cobertura; nada observable cambia), ~30 min; 106b, pasos 3-4 (puerta, finish, texto TASK-091 y tests con procesos), ~45 min. O bien se acepta como una sola tarea.
- La aprobación de este plan entero con `taskctl approve`. Hasta entonces no se implementa nada.

### Respuestas de Carlos (2026-11-11, al redactar el plan)
- **D1 → reutilizar con condiciones.** finish reutiliza el memo selectivo del Stop o de review solo si: es de la selectiva, su estado es `verde` y el arbol esta limpio (la huella ya incluye HEAD y el SHA de la base). Un memo `roja` o `cortada` se reejecuta. La completa sigue sin memo. Es una excepcion explicita y acotada a la decision de TASK-072: se anota asi en la cabecera de `finish-verificacion.ts` y en el `Resultado`. Para no cambiar el Stop ni review, el filtro «solo verde» se aplica desde finish (opcion de `verificarConMemo` con valor por defecto que conserva el comportamiento actual, o lectura previa del memo en finish); el test del Stop/review no cambia de expectativa.
- **D2 → solo el nivel 2.** El hotfix nunca usa la selectiva (`permitirSelectiva: false`), pero conserva su camino de solo documentacion de la 0.14.0. El release no recibe `ramaBase` y sigue a la completa.
- **D3 → una sola tarea.** Se acepta TASK-106 entera (~70 min), sin trocear; la excepcion a la regla de una hora queda anotada aqui.
