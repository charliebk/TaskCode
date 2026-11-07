# Brainstorm — TASK-082, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: brainstorm-riesgos

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **Un revisor de dominio desaparece sin avisar**. El disparador es sacar las listas de comprobación de los `SKILL.md` de las revisoras y dejar un bloque ```yaml (de ejemplo o de la propia lista) delante del bloque de enrutado, o mover ese bloque a otro fichero. La consecuencia es que `taskctl review` deja de fragmentar ese dominio y lo manda al genérico, sin error. Verificado: `extraerBloqueYaml` solo lee el **primer** ```yaml (`src/core/revisores.ts:85-92`), y si ese bloque no trae `rol: revisor` la skill se salta con `continue` (`revisores.ts:158-166`). Aquí el diseño fail-closed no actúa. Mitigación: las listas no llevan bloques ```yaml, y una aserción comprueba que el catálogo cargado sigue teniendo 4 dominios + 1 genérico.
- **El revisor pierde la lista que hoy tiene en contexto**. El disparador es que la lista pase a un fichero compartido que el revisor tiene que abrir siguiendo un enlace. Hoy «Que se revisa» está dentro de cada `SKILL.md` (`code-quality-reviewer/SKILL.md:98-219`, `java-spring-reviewer/SKILL.md:88`). Un agente que no siga el enlace revisa con menos criterio que antes, y ningún test lo detecta. Mitigación: que la skill revisora mande leer la lista de forma explícita y obligatoria, igual que hoy hace con `revision.md`.
- **El fichero compartido choca con el «Contexto permitido» de TASK-081**. `contextoPermitido` solo lista `tarea.md`, `planificacion/`, los ficheros del grupo y `contexto_revision` (`src/core/contexto-revision.ts:84-95`). Las skills ya llegan al revisor fuera de esa lista, pero si la lista nueva se trata como un fichero que el revisor «lee», cada lectura acaba en `## Lecturas fuera del contexto permitido` y ensucia la métrica de TASK-081. Mitigación: decidir ya que la lista es parte de la skill y no del repo.
- **El implementador se autorrevisa con la lista equivocada**. La clasificación por dominio solo ocurre dentro de `taskctl review` (`review.ts:577-579`), y para entonces la autorrevisión debería estar hecha. Escenario: un diff que toca 4 dominios cae al genérico por umbral (`umbral_dominios: 3`), y el implementador pasa la lista de Java. Mitigación: el implementador necesita conocer el revisor asignado antes de autorrevisarse (cómo, lo decide arquitectura).
- **El aviso no avisa (falso negativo)**. Si la plantilla de `tarea.md` trae ya el encabezado vacío de la sección, o la detección busca solo el encabezado, toda tarea nueva pasa sin haberse autorrevisado. Mitigación: exigir contenido debajo del encabezado.
- **La constancia vieja tapa la ronda N+1**. En la ronda incremental (`review.ts:457`), la constancia de la ronda 1 sigue en `tarea.md` y en las rondas siguientes no se avisa. Mitigación: decidir si la constancia es por ronda (p. ej. ligada al commit) o única.
- **La independencia se contamina**. `tarea.md` está siempre en el contexto permitido del revisor: leerá «autorrevisado, sin hallazgos» y puede anclarse. Si el texto debe ser neutro, lo decide dominio.

## Estados intermedios y fallos parciales

- La constancia escrita y sin commitear: `review` aborta por workspace sucio (`review.ts:470-476`) y el aviso nuevo nunca se ve. La skill debe decir «commitea la constancia» antes de `taskctl review`.
- El aviso se calcula sobre la **lectura fresca** (`review.ts:524`, tras el update de Git-Flow), no sobre la preliminar.
- El aviso no puede lanzar excepciones: si fallara después de los `writeFile` con `wx` (`review.ts:649-718`) dejaría la ronda a medias (el callejón que cerró TASK-040). Cálculo antes de la primera escritura y total (nunca lanza).
- `review` no tiene `--json`; en modo automático el agente encadena con `siguiente --json`. Si el aviso solo sale por stderr, en automático es decorativo.

## Compatibilidad hacia atrás

- Tareas ya en `02-en-curso` avisarán en su próximo `review`: aceptable, pero el aviso tiene que decir qué hacer.
- Tareas en `03-en-revision`: decidir si la ronda N+1 avisa.
- Lectores actuales del cuerpo de `tarea.md` (`registrarTransicion`, métricas, `## Resultado` en finish): **no revisados**.
- Proyectos ajenos: el fichero compartido se distribuye por autodescubrimiento de `skills/`. Con su propio `SKILL.md` aparece como skill invocable; sin él, `claude plugin validate` no dice nada (HALLAZGOS.md:692-707).
- Ningún fichero nuevo bajo `skills/` puede mencionar TaskCode ni sus documentos.

## Vuelta atrás

- Reversible con un `git revert` del merge; no hay formato persistente nuevo que el CLI lea.
- Queda la sección de autorrevisión en los `tarea.md` de la vigencia: texto inerte.
- Lo caro de revertir es la extracción de las listas si alguien edita la lista compartida entre medias.

## El riesgo que más me preocupa (UNO solo)

Que mover las listas fuera de los `SKILL.md` deje un ```yaml delante del bloque de enrutado o se lleve ese bloque. `cargarCatalogoRevisores` se salta la skill en silencio (`revisores.ts:158-166`), y toda la revisión de ese dominio pasa al genérico sin un error ni un test rojo, salvo que se añada la aserción de que el catálogo sigue teniendo los 4 dominios.

### Suposiciones no verificadas

- Que ningún lector de `tarea.md` (métricas, finish, `registrarTransicion`) falle ante una sección nueva (`src/core/transiciones.ts`, `src/core/metricas.ts`).
- Que los tests de «no mencionar TaskCode» recorran todo `skills/`, incluido un fichero sin `SKILL.md`.
- Que la plantilla de `tarea.md` la genere `taskctl new` (`src/commands/new.ts`).
