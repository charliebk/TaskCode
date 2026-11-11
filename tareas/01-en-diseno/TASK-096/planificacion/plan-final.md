# Plan — TASK-096: Verificacion proporcional B: con codigo parcial se verifica solo lo afectado

(Lo consolida el agente unificador a partir de 3 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos, testing.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

Duracion estimada: 45 min (solo B1, lo que queda en esta tarea tras trocear: 2 ficheros de codigo, `core/config.ts` y `core/verificacion-proporcional.ts`, y sus tests en `test:rapido`; 1 capa; 5 criterios. Las demas partes son TASK-105 a TASK-109).

Estimacion de la tarea entera antes de trocear: 270 min (de la rama abierta al cierre con merge; señales: unos 7 ficheros de código —`core/config.ts`, `core/verificacion-proporcional.ts`, `fs/decision-documentacion.ts`, `fs/verificacion.ts`, `commands/finish-verificacion.ts`, `commands/finish-cobertura.ts`, `hooks/guardia-merge.ts`— más 3 o 4 ficheros de test nuevos con procesos; 4 capas: core, fs, commands, hooks, más docs; 7 criterios). Pasa de 60 min: la persona ya decidió trocear (partición abajo).

- Se crea una clave opt-in en `.taskcode/config.yml`, leída de la rama base, y un tercer resultado `selectiva` en `DecisionVerificacion`. El proyecto sigue decidiendo qué tests corren con su `comando_verificacion_selectiva` (arquitectura). No se crea ningún módulo nuevo (arquitectura).
- Se extienden `decidirVerificacionEntre` (un segundo pathspec, perezoso), `huellaDeCommit(…, contexto?)`, `puertaSoloDocumentacion` → `puertaProporcional` y la sección de `tarea.md` (arquitectura). `peticionDeTrabajo`, el freno Stop y `review` no se tocan (arquitectura).
- Orden: core → fs → finish → misma decisión en Stop/review → guardián → documentación. Coinciden la porción de arquitectura y el orden seguro de riesgos (finish antes que el guardián, para que el camino manual nunca sea más laxo que el oficial).
- Propuesta sobre TASK-091 (sale de arquitectura; el guardián, según el desacuerdo (a)): por defecto la completa sigue siendo obligatoria para integrar. Declarar la clave es la revisión explícita de TASK-091 para ese proyecto. Con ella, `finish` acepta el verde selectivo solo si todo el diff que no es documentación cae dentro de las rutas declaradas en la base, no es release, no es hotfix y no cambia `.taskcode/config.yml`. Se retira el texto «aunque las rondas usaran la selectiva» (`finish-verificacion.ts:175-180`) en el caso en que aplica la clave. Los tests TASK-091 de `verificacion-selectiva.test.ts:459/:478` NO cambian: pasan a ser la red del criterio 4 (testing).

Partición propuesta (cada hija se cierra sola con su suite en verde, que es el criterio 7; no se publica versión hasta cerrar la última: riesgos):
1. **096-1 Core: clave y decisión pura** (~45 min) — nombre y semántica de la clave, definitivos (riesgos); validación cruzada con `comando_verificacion_selectiva`; rama `selectiva` con los mismos «ante la duda» (diff nulo o vacío, cambio de config). Nada observable cambia. Cubre: base del 1 y el 4 (tests P1).
2. **096-2 Fs: decisión entre refs y huella** (~50 min, depende de 1) — segundo `rutasDeTarea` solo si la base declara la clave; `huellaDeCommit` con contexto; sin memo `selectiva` con el árbol sucio. Nada observable cambia. Cubre: 4 (las redes «como en la 0.14.0» siguen en verde).
3. **096-3 finish nivel 2** (~60 min, depende de 2) — `puertaProporcional`, salida que dice qué corrió y por qué, sección idempotente en `tarea.md` (riesgos), puerta de cobertura y timeout según las decisiones (d) y (e). Cubre: 1 y 4 (finish).
4. **096-4 Misma decisión en Stop, review y finish** (~30 min, depende de 3) — solo test tabular, sin código (arquitectura: TASK-102 ya lo cumple). Cubre: 2.
5. **096-5 Guardián** (~40 min, depende de 3) — según (a): tests P3 y un mensaje claro cuando la huella no casa porque develop avanzó (riesgos). Cubre: 3 y 4 (guardián).
6. **096-6 Documentación y limpieza** (~45 min, depende de 4 y 5) — `verificacion-selectiva.md` (tabla de la línea 7 y párrafo de la 12), README, CHANGELOG (avisar del bloqueo de los reintentos manuales: riesgos), aviso de `doctor`, borrar el código muerto, y el motivo de cada test que cambie de expectativa en Resultado. Cubre: 5 y 6.

## Desacuerdos entre roles, y como se resuelven

- (a) Criterios 1 y 3: ¿el guardián acepta el verde selectivo? — arquitectura: sí (`exencionDocumentacion` → `exencionProporcional`, que acepta el memo `selectiva`) / riesgos: «el guardián nunca relaja el código»; los CRI-1/CRI-2/NUE-1/NUE-2 de TASK-101 salieron del punto débil de `comandoSoloIntegra`, y la incoherencia queda del lado seguro / testing: no se pueden probar las dos cosas, hay que elegir. **Recomiendo riesgos.** Cumple al pie de la letra las dos pruebas que pide el criterio 3; arquitectura solo cumple la frase «la misma decisión que finish». Coste: un reintento a mano tras un fallo a mitad de merge queda bloqueado. Abierta: D1.
- (b) Frontera de confianza — arquitectura: lista de PERMITIDAS `rutas_verificacion_parcial` leída de la base (todo lo que queda fuera, incluido el clasificador, va a la completa) / riesgos: la base declara qué es «del clasificador» (lista de PROHIBIDAS) y, además, el comando declara con un contrato verificable qué corrió; si no lo declara, cuenta como completa no hecha. **Gana la lista de permitidas de arquitectura frente a la de prohibidas**: falla en cerrado ante una ruta nueva sin que el proyecto se acuerde. El contrato de «qué corrió» no lo propone arquitectura y nadie lo diseñó. Abierta: D2.
- (c) Clave nueva frente a reutilizar `comando_verificacion_selectiva` — **no hay desacuerdo**: arquitectura (clave opt-in), riesgos («reutilizarla rompe el criterio 4: ToolsaWeb ya la declara») y testing (mutación «activar con la mera presencia de la selectiva») piden clave nueva. Lo único abierto es la forma: arquitectura descarta el booleano sin rutas. D3.
- (d) Cobertura en el nivel 2 — solo la trae riesgos: sin lcov fresco, «Sin datos fiables no se cierra», y con un lcov parcial salen rojos falsos. Arquitectura y testing no la tocan. No es un desacuerdo, es un hueco de dos roles. D4.
- (e) Timeout cuando el comando decide correr todo — riesgos: el nivel 3 correría con `timeout_verificacion_selectiva` (600 s; la completa de ToolsaWeb tarda ~28 min). Con la lista de permitidas de arquitectura, lo transversal lo manda TaskCode a `comando_verificacion` con su propio timeout, así que el caso queda solo cuando el script corre todo por decisión propia dentro de las rutas permitidas. D5.
- Prueba P4 de testing («los tres corren el mismo comando», incluido lo transversal) / arquitectura (Stop y review son puertas de iteración, no corren la completa ante lo transversal) — **gana arquitectura**: el criterio 2 solo exige que Stop y review coincidan entre sí. P4 se reduce a eso, más finish = Stop/review en los casos de documentación y parcial.

## Riesgos aceptados y que los contiene

- Un comando que sale con 0 sin haber corrido nada pasa a abrir integraciones de código (riesgos, el que más le preocupa) — lo contiene: la completa en release (TASK-100) y anotar en `tarea.md` qué nivel corrió, para atribuir el fallo (riesgos); y D2 si se exige contrato.
- Lo integrado con solo el verde selectivo y publicado con push no tiene vuelta atrás (riesgos) — revert más completa; la detección llega tarde, en la siguiente tarea transversal.
- Declarar las rutas en dos sitios: la tabla del script y la clave (arquitectura) — lo contiene que la divergencia caiga del lado de la completa.
- Una versión publicada a mitad del troceo deja la documentación, Stop y review diciendo cosas distintas (riesgos) — no publicar hasta cerrar 096-6, y no documentar la clave hasta 096-6.
- Las variantes de `DecisionVerificacion` pasan a cuatro y cada `switch` puede olvidar una quinta (testing) — lo contiene solo la prueba tabular P4.

## Plan de pruebas

- P1: tabla de `decidirVerificacion` (documentación / parcial / config cambiada / diff nulo o vacío / sin clasificar) y validación cruzada de la clave, en `test:rapido`; mutación: comprobar «afectado» antes que `RUTA_CONFIG` (testing).
- P2 `finish-afectado.test.ts`: con diff parcial, afectado=1 y completa=0 (se asevera sobre los DOS contadores, nunca solo el mensaje); con diff transversal, lo contrario; con el afectado en rojo, develop no se mueve; el verde del afectado no escribe `freno-verificacion.json` (testing; el memo separado lo pide también riesgos).
- P3 guardián: sin código y con verde de documentación pasa; con código y sin la completa bloquea (código 2); y guardián y finish con la config del destino, no la del árbol (testing).
- P4: Stop y review, la misma decisión en documentación, parcial y transversal; finish coincide en documentación y parcial (testing, acotada por el desacuerdo P4).
- Regresión del criterio 4 con un proyecto que YA declara `comando_verificacion_selectiva` pero no la clave: finish corre la completa y el guardián bloquea como hoy (testing; con el `return null` temprano no se prueba nada).
- Rama que cambia a la vez código y su propio clasificador → completa (riesgos, modo 1); y la prueba de la guía asevera el contrato literal (testing).

## Lo que necesita decision de una persona

### Sin cubrir
- `tareas/**` y el commit de anotación previo al merge (riesgos, modo 6): toda tarea cambia su carpeta, y la anotación mueve la huella justo antes de integrar. Arquitectura propone esa misma anotación sin tratar el efecto. Se resuelve en 096-3 o va a D2.
- Hotfix: arquitectura supone que `ramaBase` es fiable; riesgos dice que ninguna tarea lo decidió. La propuesta lo deja en la completa; hay que confirmarlo.
- El criterio 4 dice «0.13», pero la referencia verificable es la 0.14.0 (testing). Que la persona confirme que vale la 0.14.0.

### Salidas que faltaron
- Ninguna: llegaron las tres. No se lanzó un rol de dominio (arquitectura cita un desacuerdo previsto con él). La heurística dio media y la tarea se declaró alta: se lanzaron 3 roles.

### Suposiciones no verificadas
- Que el Stop guarda el memo `selectiva` con la misma base que el guardián toma como destino (arquitectura) — comparar el `base` de `freno-stop.ts` con `guardia-merge.ts:205`.
- Que ToolsaWeb declara `umbral_cobertura` y que su selectivo trata `tareas/**` como documentación (riesgos) — mirar su `.taskcode/config.yml` y su script.
- Que la fórmula de la huella no cambia y no hace falta subir `VERSION_MEMO` (arquitectura) — revisarlo en 096-2.
- Que nada impide hoy publicar una versión a mitad del troceo (riesgos).

### Decisiones abiertas para la persona
- **D1 (criterios 1 y 3).** ¿El guardián acepta el verde selectivo para código? Recomiendo que no (riesgos) y reescribir el criterio 3: «con código, el guardián exige la completa aunque finish haya integrado con la selectiva». No lo decide este rol porque cambia un criterio de aceptación.
- **D2 (frontera de confianza).** ¿Basta la lista de permitidas leída de la base (arquitectura), o además se exige que el comando declare qué corrió (riesgos)? Recomiendo la lista de permitidas en esta tarea y aceptar el riesgo de «salir con 0 sin correr nada», contenido por la completa en release. Si se quiere el contrato, que sea una tarea hija propia: nadie lo ha diseñado y obliga a cambiar los scripts de los proyectos.
- **D3 (clave).** Recomiendo una clave nueva con lista de rutas (`rutas_verificacion_parcial`, arquitectura) en vez de reutilizar la selectiva o usar un booleano. Los tres roles lo apoyan; falta que la persona fije el nombre, que no se podrá cambiar después (riesgos).
- **D4 (cobertura).** Recomiendo que en el nivel 2 la puerta quede `omitida`, como en el nivel 1 (la vía que apunta riesgos), y que se mida en la completa de release. Alternativa: bloquear `finish` del nivel 2 cuando se declara `umbral_cobertura`. **D5 (timeout):** recomiendo mantener `timeout_verificacion_selectiva`, documentar que el script que decide correr todo debe ajustarlo, y que el nivel 3 lo lance TaskCode con `comando_verificacion`. Ninguna de las dos la fundamentó más de un rol.
- La aprobación de este plan entero, y de la partición, con `taskctl approve`. Hasta entonces no se implementa nada.

### Respuestas de la persona (2026-11-11)
- **D1:** el guardián NO acepta el verde selectivo para código; con código exige la completa aunque finish haya integrado con la selectiva. Se reescribe el criterio 3 en ese sentido.
- **D2:** basta la lista de rutas permitidas leída de la base (`rutas_verificacion_parcial`). Sin contrato de «qué corrió» en esta tarea; el riesgo lo contiene la completa del release.
- **D3:** nombre de la clave fijado: `rutas_verificacion_parcial` (definitivo desde 096-1).
- **D4:** en el nivel 2 la puerta de cobertura queda `omitida`, como en el nivel 1, y se mide en la completa del release.
- **D5:** lo afectado corre con `timeout_verificacion_selectiva`; el nivel 3 lo lanza TaskCode con `comando_verificacion` y su propio timeout.
- **Hotfix y release:** siempre a la completa.
- **Criterio 4:** la regresión se mide contra la 0.14.0 (no la 0.13).
- **Troceo:** sí, en las seis hijas propuestas; no se publica versión hasta cerrar la última.
