# Plan — TASK-091: Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar

(Lo consolida el agente unificador a partir de 2 roles de brainstorm lanzados en paralelo: arquitectura, riesgos.
Complejidad media, declarada y heuristica coinciden: por eso 2 roles. Los desacuerdos se senalan, no se promedian.)

## Enfoque propuesto
- (arquitectura) Ningun motor nuevo: la selectiva es otro comando por `ejecutarVerificacion`; Stop la corre si esta declarada (si no, la completa, como hoy); `review` solo si esta declarada; `finish` y guardian siguen con `comando_verificacion`.
- (arquitectura) Orden: 1) `config.ts`: `comando_verificacion_selectiva` (null) + `timeout_verificacion_selectiva`, abortando si hay selectiva sin completa (riesgos coincide, modo 2) o timeout sin su comando; 2) memo por tipo (`freno-verificacion-selectiva.json`) y SHA de la base en la huella selectiva.
- 3) Stop elige comando/timeout/memo; 4) `review` corre la selectiva antes del primer write (ambos roles) y anade `seccionVerificacion`; 5) `doctor` con comprobacion nueva `verificacion-selectiva`, texto de `finish`, docs.
- (ambos) La base va por variable de entorno neutra (`RAMA_BASE`, arquitectura), sacada de `resolveBaseBranchForTipo(tipo)`, nunca interpolada en el comando.

## Desacuerdos entre roles, y como se resuelven
- Colision de huella con comandos iguales — riesgos: meter el tipo en la huella o que `resolverConfig` rechace comandos iguales / arquitectura: memo separado por tipo; el guardian solo lee el de la completa — gana arquitectura — elimina la colision por construccion y comandos iguales que lean `RAMA_BASE` son un caso legitimo (el propio escenario de riesgos); un test lo demuestra.
- Subir `VERSION_MEMO` — riesgos: cambiar la formula obliga a subirlo e invalida los memos (el guardian bloquea merges manuales) / arquitectura: la formula de la completa no cambia, solo la selectiva gana `contexto` — gana arquitectura — sin cambio en la completa no hay que invalidar nada; si la implementacion toca la formula de la completa, rige la regla de riesgos.
- Alarma parcial: en el resto (variable de entorno, `doctor` separado, `finish` sin cambios, selectiva antes del primer write) coinciden porque leyeron las mismas lineas (`doctor.test.ts:320-327`, `finish-verificacion.ts`); es coherencia del codigo, no contraste independiente.

## Riesgos aceptados y que los contiene
- La completa reescrita como clasificador al migrar convierte `finish` en selectiva sin que se vea — riesgos (modo 3) — solo la guia lo contiene (completa sin argumentos corre todo); el plugin no puede detectarlo.
- Verde falso de la selectiva si ignora lo no commiteado o la base no existe en local — riesgos (modo 4) — la guia exige incluir el arbol de trabajo y correr todo si no puede clasificar; es responsabilidad del script.
- El guardian deja de aceptar el verde del Stop con arbol limpio (el Stop ya no escribe memo de completa) — riesgos — se documenta en el CHANGELOG; fallo cerrado, molesto pero no peligroso.
- Salida de la selectiva en la peticion commiteada: hasta 16 KB, rutas absolutas, un ``` rompe el bloque — riesgos — la seccion va despues de `Commit revisado` y con valla que no colisione.
- Selectiva que escribe ficheros ensucia el arbol antes del autocommit de `review` — riesgos — `review` replica el «verde pero dejo cambios» de `finish-verificacion.ts:128`.
- El aviso nuevo de `doctor` sale en todos los proyectos, este incluido — riesgos — arreglo copiable tal cual en la misma linea; no cambia el codigo de salida.

## Plan de pruebas
- Sin la clave: Stop, `review`, `finish`, `doctor` identicos y los tests existentes sin tocar — repos Git temporales — criterio 1, ambos roles.
- Con comandos iguales, un verde de la selectiva en el Stop no deja pasar un `git merge` manual en el guardian — repo temporal con hook real — riesgos (modo 1).
- `review` corre la selectiva con `RAMA_BASE` correcta (incluido tipo hotfix contra main) y la peticion dice «selectiva» con su salida; en rojo no deja ronda N+1 — repo temporal — arquitectura y riesgos.
- `finish` ejecuta la completa aunque exista un memo selectivo verde, y en rojo no integra y dice como correrla — repo temporal — riesgos (modo 5).
- `resolverConfig` aborta con selectiva sin completa y con timeout selectivo sin comando — config real en repo temporal — ambos roles.
- Guia: `skills/task-workflow/verificacion-selectiva.md` enlazada desde `SKILL.md`, con marcas (`comando_verificacion_selectiva`, `RAMA_BASE`, arbol de trabajo, «corre todo») y `doesNotMatch(/TaskCode/)` — fichero real — propuesta del unificador a peticion del orquestador, calcada del test de `heldout.md` (`finish-heldout.test.ts:247-256`), sin rol detras.

## Sin cubrir
- La adopcion en cada aplicacion («todas la adoptan y sustituyen su verificador», p. ej. ToolsaWeb) — fuera de este repo; tarea aparte por proyecto.
- Que dice la peticion de `review` sin la clave (hoy no corre nada) — criterio 2 solo habla «con la clave»: la peticion no cambia, para no tocar tests.
- Texto exacto del arreglo de `doctor` y filas de la tabla de claves, README, CHANGELOG y ROADMAP — ningun rol lo concreto; lo fija la implementacion y lo mira el revisor.

## Salidas que faltaron
- ninguna

## Suposiciones no verificadas
- `resolveBaseBranchForTipo` no hace llamadas de red — arquitectura — mirar `src/fs/git.ts` ~791.
- `doctor` no cambia su codigo de salida ni algun test cuenta los avisos totales — arquitectura — buscar en `test/commands/doctor*.test.ts`.
- El agente lanza `taskctl review` con Bash con tope de 2-10 min y una selectiva larga lo mata a mitad — riesgos — medirlo.
- En Windows un `verificar.bat` huerfano (hijo no desacoplado) ensucia el arbol si se mata `review` — riesgos — reproducirlo.
- El test generico de los `.md` de `task-workflow` ya prohibe nombrar TaskCode — unificador — mirar `test/skills/task-workflow.test.ts` (`mdsDeTaskWorkflow`).

## Lo que necesita decision de una persona
- Rojo de la selectiva en `review`: A) aborta, tarea en en-curso, sin ronda / B) escribe la peticion en rojo y pasa a en-revision — recomendado A (fallo cerrado; correrla antes del primer write lo deja limpio) — ningun rol lo decidio, es regla de negocio.
- Cobertura en la peticion cuando corrio la selectiva: A) se muestra con nota de posible informe parcial / B) se omite la seccion de cobertura en esas rondas — recomendado B (riesgos, modo 6: una seccion que miente es peor que ninguna) — arquitectura la dejo anotada, no tomada.
- Ubicacion de la guia de migracion: A) `skills/task-workflow/verificacion-selectiva.md`, instalable, sin nombrar TaskCode, con test propio / B) seccion del README del plugin — recomendado A (hay precedente, `heldout.md`, y llega a los proyectos; vigilar el tope de 15 KB de `SKILL.md`) — la propuesta es del unificador, no de un rol.
- Aprobacion del plan entero con `taskctl approve` — obligatoria: este plan no vale hasta que una persona lo apruebe.

## Decisiones de la persona (Carlos, 2026-11-09)
- Rojo de la selectiva en `review`: **A, aborta**. La tarea sigue en en-curso, no se escribe ninguna ronda, y el error dice que fallo y como reproducirlo.
- Cobertura cuando corrio la selectiva: **B, se omite** la seccion de cobertura en esa ronda (la peticion dice por que). La completa de `finish` la sigue midiendo.
- Guia de migracion: **A, `skills/task-workflow/verificacion-selectiva.md`**, enlazada desde `SKILL.md`, con test propio (marcas + `doesNotMatch(/TaskCode/)`).
- Plan aprobado para implementar.
