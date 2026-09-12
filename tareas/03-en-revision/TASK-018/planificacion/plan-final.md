## Enfoque

Se crea un loader de `patrones_archivo`/`fallback`/`umbral_dominios` en `src/core/` (arquitectura; hoy solo vive como helper de `revisores.test.ts`, sin lector de produccion) y una funcion pura ficheros→dominios que aplica el umbral (arquitectura). Se extiende `src/fs/git.ts` con `diffNameOnly` + diff acotado por pathspec (arquitectura), y se extiende `src/commands/review.ts` para generar N pares peticion/informe, uno por dominio, con nombre propio por revisor siguiendo el precedente `informe-codex-N.md` (arquitectura). Esto obliga ademas a extender `src/commands/finish.ts` (exigir que TODOS los informes de dominio de la ronda aprueben) y `src/fs/rondas.ts` (reconocer los nombres nuevos) — arquitectura lo incluye en su orden de construccion, pero ver "Decision humana pendiente": el texto literal de los criterios de aceptacion de TASK-018 no menciona ninguno de esos dos ficheros.

## Desacuerdos resueltos

- Un informe compartido entre dominios por ronda, o uno por dominio — riesgos: exige uno por dominio, porque paralelizar agentes (practica ya adoptada, MEMORY.md) sobre un fichero compartido corrompe el veredicto de escritura concurrente / testing: duda si arquitectura propondra ficheros separados o N secciones en un mismo fichero, y sostiene que ficheros separados es mas barato de probar por aislamiento — gana: ficheros separados, uno por dominio. Arquitectura ya lo fija en su plan (nombre propio por revisor, precedente `informe-codex-N.md`), lo que satisface tanto la exigencia de riesgos como la preferencia de testing; no hay conflicto real una vez comparados los tres textos.
- Donde viven los tests de la clasificacion — arquitectura: pide un fichero de test propio para la funcion pura ficheros→dominios, aislado de I/O de Git y separado de los tests end-to-end de `review.ts` / testing: propone 6 pruebas de integracion contra un repo Git temporal real, al estilo de `review.test.ts`, sin proponer ninguna prueba unitaria aislada de la funcion pura — gana: ambos, son complementarios. La salida de testing no contradice el pedido de arquitectura, simplemente no lo cubre; el plan de pruebas final incluye las dos capas.

## Riesgos aceptados

- La tarea deja de poder cerrarse nunca si el enrutado nombra los informes distinto de `informe-revision-N.md` y nadie extiende `INFORME_REVISION_RE`/`ultimoInforme` en `finish.ts` — riesgos — se contiene extendiendo `finish.ts` en esta misma tarea (paso 5 del orden de arquitectura), probado, no delegado a otra tarea.
- Escritura en paralelo de N agentes de dominio corrompe un informe compartido — riesgos — se contiene con un informe por dominio y por ronda, nunca compartido (desacuerdo resuelto arriba).
- Renombrar/mover un fichero entre ecosistemas (`git mv Foo.java Foo.cs`) rompe la clasificacion por ruta, sin logica de rename hoy (`path.matchesGlob` puro, leido en `revisores.test.ts` 6c/6d) — riesgos — se contiene clasificando por ambas rutas del `--name-status` y mandando al generico si discrepan.
- Un crash a mitad del bucle que escribe N pares deja la ronda a medio formar, con reintento chocando en EEXIST — riesgos — se contiene nombrando los ficheros por dominio de forma predecible para que el reintento salte los ya escritos.
- El router diverge en silencio si no relee `patrones_archivo` de `skills/*/SKILL.md` en cada ejecucion y en su lugar cachea/copia — testing — ya paso dos veces con angular-vue (`HALLAZGOS.md`); se contiene releyendo en cada ejecucion, sin cache.
- `siguienteRonda`/`RONDA_FILE_RE` no reconocen nombres con sufijo/prefijo de dominio, con riesgo de mezclar esquema viejo y nuevo entre rondas de una misma tarea — riesgos y testing coinciden — se contiene reusando el patron ya resuelto en TASK-016 (`peticion-brainstorm-<rol>-<ronda>.md`), señalado por testing como precedente directo.

## Plan de pruebas

- Diff que toca 1 dominio genera 1 peticion con el agente de dominio detectado, no `task.agente_revisor` del frontmatter — repo Git temporal real — testing.
- Diff que toca 2 dominios bajo el umbral genera 2 peticiones y cada una trae solo los hunks de su propio fichero, no el diff integro — repo Git temporal real — testing.
- Diff que toca EXACTAMENTE 3 dominios sigue fragmentando en 3 (fija si el corte es `>` o `>=` contra `umbral_dominios`) — repo Git temporal real — testing.
- Diff que toca 4 dominios (sobre el umbral) genera 1 sola peticion generica con el diff completo sin fragmentar — repo Git temporal real — testing.
- Diff sin match de dominio (solo `.md`) y una ruta ya congelada en `RUTAS_AJENAS` de `revisores.test.ts` siguen cayendo al generico, igual que hoy — repo Git temporal real — testing.
- Funcion pura ficheros→dominios probada sin I/O de Git, en fichero propio separado de los tests end-to-end de `review.ts` — arquitectura, complementaria a las anteriores (ver desacuerdo resuelto).

## Sin cubrir

- Ningun rol leyo el documento fuente citado en el enunciado (`docs/PROPUESTA_METODOLOGIA.md`, seccion 14, punto 16) para confirmar el valor y la semantica exacta del umbral; los tres asumen `umbral_dominios: 3` via `code-quality-reviewer/SKILL.md` sin verificar la decision original — queda como suposicion (ver seccion siguiente).

## Salidas que faltaron

- ninguna

## Suposiciones no verificadas

- `siguienteRonda` puede seguir devolviendo un unico numero compartido entre los ficheros de todos los dominios de una ronda sin romper otros consumidores — arquitectura — habria que leer `src/fs/rondas.ts` a fondo para confirmarlo.
- `state-machine.ts` combina `revisionPrimariaAprobada && revisionCodexAprobada` de forma que admita plegar N aprobaciones de dominio — arquitectura — habria que confirmarlo antes de tocarlo.
- `umbral_dominios: 3` de `code-quality-reviewer/SKILL.md` coincide con la decision #16 de la seccion 14 citada en el enunciado — arquitectura — nadie ha leido el documento fuente.
- `taskctl review` lanzara los N agentes de dominio en paralelo de verdad y no en secuencia — riesgos — hoy `review.ts` solo genera ficheros, sin orquestacion de agentes.
- "Cada revisor recibe solo el subconjunto del diff de su dominio" implica un `git diff` filtrado por pathspec, no el diff completo con instruccion de ignorar lo ajeno — riesgos — hoy `diffRange` embebe el diff entero sin filtrar.
- "Hasta el umbral" corta en "mas de 3 dominios" (3 fragmenta, 4 cae a generico) — testing — es la unica lectura escrita en disco, pero nadie la ha confirmado contra el criterio de aceptacion ni contra el documento fuente.

## Decisiones tomadas por Carlos (2026-09-12, via remote control)

- **Alcance de `finish.ts`/`rondas.ts`**: **dentro de TASK-018.** Los criterios de aceptacion de `tarea.md` se actualizaron para exigir explicitamente extender `INFORME_REVISION_RE`/`ultimoInforme` (`finish.ts`) y `RONDA_FILE_RE`/`siguienteRonda` (`rondas.ts`), con `finish` exigiendo que todos los informes de dominio de la ronda aprueben.
- **Ficheros sin dominio con 1-3 dominios ya detectados**: el revisor generico **tambien** los cubre, ademas de los revisores de dominio — no quedan sin revisar. Anadido como criterio de aceptacion propio.
- **Semantica del umbral**: **inclusive**. Con exactamente 3 dominios (`umbral_dominios: 3`) fragmenta en 3 revisores; con 4 o mas cae al generico. Confirma la lectura literal de "hasta el umbral ... por encima de ese umbral" del enunciado original; nadie leyo el documento fuente (`docs/PROPUESTA_METODOLOGIA.md` seccion 14) para contrastarla, pero la decision de Carlos zanja la ambiguedad sin necesidad de esa lectura.
- **Contrato de `ReviewCommandResult`**: se acepta la ruptura. Pasa a exponer una lista de pares peticion/informe (uno por dominio) en vez de un unico par singular, y `review.test.ts` se actualiza a la forma nueva en la misma tarea.
