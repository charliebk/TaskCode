# Plan — TASK-095: Revision que converge: desde la ronda 2 solo se verifican las correcciones

(Lo consolida el agente unificador a partir de 3 roles de brainstorm lanzados en paralelo: arquitectura, riesgos, testing. Son 3 porque la complejidad declarada es alta y la heurística da simple (2 puntos); se toma la mayor. Los desacuerdos se señalan, no se promedian.)

## Enfoque propuesto
- Reglas de la persona, no negociables: objetivo principal aumentar la agilidad sin perder calidad; la 0.8 se conserva y no se retira ningún revisor ni garantía; se corrige la regla de alcance de TASK-083, no se añade otro mecanismo encima.
- (arquitectura) Desde la ronda 2, `review` genera siempre acotada con `desde = previa.commit`, salvo `--completa` (que va siempre desde la base). `alcanceRondaSiguiente` deja paso a `pendientesPorRevisor` (core, puro) y `planDeVerificacion` en `revisores.ts`: un grupo por revisor con algo pendiente, cada uno con el delta entero de la corrección y su propia sección de abiertos.
- (arquitectura) Se reescribe `instruccionesAcotadas` (verificar cada abierto y el diff; nuevo solo si CRÍTICO o lo introduce la corrección); `flujo.ts` devuelve `preguntar` en el tope en cualquier modo; se borra el código muerto (`ficheroNombrado`, `rutasDeCeldaFichero`, `fueAcotada`, rama de merges). Alcance exacto del borrado: depende del desacuerdo 2.
- Orden (unificador, a partir de testing): primero los tests que cambian de expectativa con su sustituto, luego core y `review.ts`, luego `flujo.ts`, al final skills, README y CHANGELOG.

## Desacuerdos entre roles, y como se resuelven
Las seis resoluciones son recomendación del unificador; **cada una la decide la persona**.
- 1. Merges de la base entre rondas — arquitectura: acotada, diff desde el commit revisado, el merge se nombra en el motivo / riesgos: separar en la petición el diff de la resolución (`--remerge-diff`, git 2.36+, que el propio rol llama no portable) — recomiendo arquitectura — el criterio 1 pide literalmente acotada «con merges entre rondas», y la alternativa de riesgos no es portable; testing exige además que el fichero del merge esté en el diff.
- 2. Sin base fiable (sin `Commit revisado`, rebase/amend, informe plantilla o ilegible, veredicto previo distinto de `cambios-solicitados`) — riesgos: completa con motivo, borrando solo la rama `!== 'MENOR'` y la de `fuera` / arquitectura: acotada con aviso, borrando `alcanceRondaSiguiente` entera — recomiendo riesgos — el criterio pide «diff desde el último commit revisado», que en esos casos no existe; etiquetar como acotada (solo CRÍTICOS nuevos) código nunca revisado completo rebaja el listón y contradice «sin perder calidad»; testing deja esos fail-closed como abiertos.
- 3. Qué cuenta como pendiente — arquitectura: todo estado salvo `aceptado`, en una función / riesgos: unión por revisor+ID de todas las rondas, cerrada solo por un revisor de una ronda posterior — recomiendo arquitectura — cubre el `corregido` falso (se vuelve a verificar) sin añadir un rastreo entre rondas, que se acerca a «otro mecanismo»; queda sin cubrir el relistado olvidado que preocupa a riesgos. Choque añadido: testing cuenta `review-incremental.test.ts:130` («un corregido no se lista») como red que sigue, y la propuesta de arquitectura lo invierte.
- 4. Dominio sin hallazgos cuyo terreno toca la corrección — riesgos: también recibe petición / arquitectura: no; solo revisores con pendientes, fragmentar «vuelve a escalar con el diff» — recomiendo riesgos — el delta es la corrección, así que el coste crece con la corrección (el principio del criterio 8), y el inventario da 63/88 hallazgos propios de dominio; la restricción de solo-CRÍTICO-o-introducido sigue aplicando.
- 5. Tope en manual/semi: de `detener` a `preguntar` — arquitectura y riesgos lo asumen / testing avisa que revierte IMP-3 de TASK-058 e IMP-2 de TASK-059 («fuera del automático se detiene SIEMPRE») — recomiendo cumplir el criterio 4.º literal y justificar la reversión en Resultado — lo pide el enunciado; riesgos añade que en automático aceptar lo abierto exija a una persona, con los IDs en Resultado.
- 6. Aviso de `veredicto.ts:184-189` con solo MENORES — arquitectura: se queda, se reescribe su cola / testing: su contenido («podrá ser acotada») se vuelve falso — recomiendo testing (borrarlo) — toda ronda 2+ es acotada, y el criterio 7 manda borrar el código de la regla antigua que deja de usarse; el aviso nuevo del criterio de «corregir todos» va en `review`, no aquí.

## Riesgos aceptados y que los contiene
- Un merge manual mete código ajeno en el delta como si fuera «corrección» — riesgos — motivo explícito en la petición (desacuerdo 1).
- Un CRÍTICO mal corregido fuera del delta pasa sin ver — riesgos — la petición permite leer el repo y obliga a reproducir el fallo.
- La salida del tope se vuelve la puerta habitual para cerrar con IMPORTANTES abiertos — riesgos — aceptación por una persona e IDs en Resultado.
- `review` muere a mitad de escribir peticiones y la ronda queda incompleta — riesgos — confirmar que un reintento las reescribe todas.
- Vuelta atrás por marketplace: proyectos con reglas mezcladas dentro de una tarea — riesgos — la versión vieja ante una petición acotada revisa desde la base (dirección segura).
- Las peticiones de la acotada crecen con los revisores con pendientes; que el revisor obedezca no es observable en tests — arquitectura / testing — se mide de nuevo tras la tarea (inventario) y se dice en Resultado.

## Plan de pruebas
- R2 acotada con IMPORTANTE abierto, corregido y CRÍTICO, aseverando la línea `- Alcance:` que empieza por `verificacion acotada` y `desde === r1.commitRevisado` — repo Git temporal (`conRonda1`) — testing.
- Merge de develop entre rondas: sigue acotada y el fichero del merge está en el diff, con contraprueba — repo temporal — testing.
- Texto de la petición de R2 desde una constante exportada más una aserción literal — repo temporal — testing.
- Dominio: `peticion-revision-2-rust-wasm-reviewer.md` con `IMP-1` y la del genérico sin `IMP-1`, parametrizado por catálogo — repo temporal — testing.
- Convergencia tipo TASK-008 hasta R3 (`desde === r2.commitRevisado`) y tope `preguntar` por spawn en los tres modos — repo temporal y `taskctl siguiente` — testing.
- `--completa` con IMPORTANTE abierto: completa, desde develop, fragmentada — repo temporal — testing.

## Sin cubrir
- Criterio «corregir TODOS los hallazgos entre rondas» (MENOR que no compense: aceptado con motivo o tarea nueva; `skills/review` lo manda en todos los modos; `review` avisa si se abre la ronda con abiertos de la anterior; test) — ningún rol lo trató; hay que añadirlo al enfoque y a las pruebas antes de aprobar, y condiciona los desacuerdos 3 y 6.
- Criterio de documentación (skills/review, task-workflow, README, CHANGELOG y el principio de coste proporcional) — solo arquitectura cita rutas de skills; sin plan de texto ni prueba (testing solo pide correr `dist/test/skills`).
- Que `review` no consulta `TOPE_RONDAS` (arquitectura y riesgos lo señalan) — ningún rol propone qué hacer; va a la decisión humana.

## Salidas que faltaron
- ninguna

## Suposiciones no verificadas
- Quién escribe `corregido` en la columna Estado de los informes reales — arquitectura y riesgos — leer `skills/review` e informes de ToolsaWeb/OpenDockTrading.
- Por qué TASK-008 de OpenDockTrading llegó a 14 rondas pese al tope (versión del plugin; `review` llamado sin `siguiente`) — arquitectura y riesgos — `tarea.md` y transiciones de esa tarea.
- Que `hayMergesEntre` no tenga más usuarios y se pueda borrar — arquitectura — grep en `src/`.
- Que `review-modelo.test.ts:122-147` y `review-incremental.test.ts:139-153` cambien de expectativa — testing — correrlos tras el cambio.
- El patrón que activa `rust-wasm-reviewer` en el catálogo y el fixture de TASK-008 sacado del inventario — testing — catálogo e informes reales.
- Que la suite completa tarde ~25 min (CLAUDE.md dice ~10) — testing — medir.

## Lo que necesita decision de una persona
- Aprobar o cambiar las seis recomendaciones de los desacuerdos 1–6 — son contrarias entre roles y el 5 revierte decisiones de TASK-058/059; no las decide el unificador.
- Cómo se cubre el criterio de «corregir todos los hallazgos» que ningún rol trató — no hay propuesta de rol entre la que elegir.
- Si `review` debe respetar el tope por sí mismo o basta con `siguiente` — señalado por dos roles sin propuesta, y cerca de «añadir otro mecanismo».
- Aprobar el plan entero con `taskctl approve`: hasta entonces no se implementa nada.

## Decisiones de la persona (2026-11-10)

1. Merge de la base entre rondas: la ronda sigue acotada y el merge se nombra en el motivo y en la petición (postura de arquitectura).
2. Sin referencia fiable (sin commit revisado o no antepasado, informe plantilla o ilegible, veredicto previo distinto de `cambios-solicitados`): ronda completa, con el motivo escrito. No se borra `alcanceRondaSiguiente` entera, solo sus ramas «no MENOR», «hay merges» y «ficheros no nombrados» (postura de riesgos).
3. Pendiente de verificar = todo hallazgo de la ronda anterior que no esté `aceptado`, también los `corregido` (postura de arquitectura). `review-incremental.test.ts:130` cambia de expectativa con ese motivo en Resultado.
4. Un revisor de dominio recibe petición en la ronda acotada si tiene hallazgos pendientes **o** si el delta de la corrección toca sus ficheros; cada uno recibe el delta entero (postura de riesgos).
5. El tope de 3 rondas devuelve `preguntar` en todos los modos; el Resultado justifica que revierte IMP-3 de TASK-058 e IMP-2 de TASK-059.
6. Se borra el aviso de `veredicto` con solo MENORES y `soloMenores` (postura de testing).
7. Corregir todo entre rondas: `skills/review` manda en todos los modos corregir todos los hallazgos de la ronda (CRÍTICO e IMPORTANTE siempre; un MENOR que no compense se marca `aceptado` con motivo o pasa a tarea nueva) y `taskctl review` avisa, sin bloquear, si abre una ronda con hallazgos de la anterior que no estén `corregido` ni `aceptado`.
8. El tope lo aplica también `taskctl review`: desde la ronda 4 no abre ronda salvo que la persona lo pida con un flag explícito, que la skill solo pasa cuando la persona dice que sí.
