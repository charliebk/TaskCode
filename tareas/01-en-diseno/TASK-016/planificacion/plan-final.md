# Plan — TASK-016: Brainstorm paralelo por roles con agente unificador

> Redactado por el agente unificador a partir de tres salidas de brainstorm
> lanzadas en paralelo (arquitectura, riesgos, testing). Nivel `alta` → 3
> agentes, según `agentes_brainstorm_alta` del YML de D7. El rol de dominio no
> se lanzó: el dominio de esta tarea es el propio TaskCode y lo aporta quien
> orquesta. **Los desacuerdos entre roles están señalados, no promediados.**

## Enfoque propuesto

`taskctl plan` deja de escribir un solo fichero y pasa a escribir el paquete
completo de la fase de diseño. El reparto no cambia, y es el que TASK-013 ya
estableció en `taskctl review`: **el CLI hace lo determinista y deja las
peticiones escritas; no invoca ningún modelo.** Quien orquesta las dispara.

Estructura resultante de la carpeta de tarea:

```
planificacion/
  brainstorm/
    peticion-<rol>-<ronda>.md     (N, contexto acotado a ese rol)
    salida-<rol>-<ronda>.md       (N, scaffold vacío, flag 'wx')
    peticion-unificador-<ronda>.md
  plan-final.md                   (scaffold, SIN CAMBIOS de ruta)
```

`brainstorm/` cuelga de `planificacion/`, no de la raíz de la carpeta: así
`moveTareaFile` se la lleva entera en el `rename`, y el `autoCommit` del paso 5
de la §8.3 ya la cubre con `path.dirname(newFilePath)` sin tocar su lista de
rutas. La numeración por ronda es la de `review` (`siguienteRonda`), que se
generaliza en vez de duplicarse.

### Piezas, en orden de construcción

Las tres primeras son puras y se prueban sin repo Git.

**1. `src/core/heuristica.ts` (nuevo).** Único lector de
`scripts/heuristica-complejidad.yml`, que hoy no consume nadie desde `src/`.
No parsea YAML: reutiliza `parseBloqueClaveValor` de `frontmatter.ts` con
`permitirComentariosDeLinea: true` (verificado: la opción existe, y el propio
YML avisa en su cabecera de que sin ella la lectura falla en su primera línea).

- `parsearHeuristica(contenido, ruta): Heuristica`
- `puntuarTarea(task, body): { puntos, senales }`
- `nivelHeuristico(puntos, h): TaskComplexity`
- `agentesBrainstorm(nivel, tipo, h): number` — el tope de `hotfix` es
  `Math.min(tabla[nivel], h.agentes_brainstorm_hotfix)`, **nunca** una
  sustitución: el YML es explícito en que un hotfix trivial se queda en 0 y no
  sube a 1.

Mismo contrato que `config.ts`: fallo cerrado, clave desconocida aborta, nada
de caída al default en silencio. **No se toca `config.ts`**: sus tres claves son
cerradas por la decisión #9, y meter aquí veinte más rompería ese contrato. Se
comparte el parser, no el fichero. La ruta del YML se resuelve como
`resolveGitflowScriptsDir` ya hace con los scripts (`CLAUDE_PLUGIN_ROOT` si está
definida, ruta relativa al módulo compilado si no).

**2. `src/core/roles-brainstorm.ts` (nuevo).** El YML fija *cuántos*, no
*cuáles* — lo dice él mismo, y deja la elección abierta a propósito. Aquí vive
el desempate determinista: una constante `ROLES_BRAINSTORM` en orden de
prioridad `[arquitectura, riesgos, testing, dominio]` (el orden en que los
enumera el criterio 1), y `seleccionarRoles(n)` devuelve los `n` primeros.

Los `id` son literalmente los `name:` del frontmatter de `agents/*.md`. Un test
lee los cuatro ficheros y compara con `deepEqual` en las dos direcciones: si
divergen, el CLI escribiría peticiones dirigidas a agentes que no existen; y si
alguien añade un quinto `brainstorm-*.md` sin ordenarlo, la suite da un rojo
accionable en vez de silencio.

**3. `src/core/plan-brainstorm.ts` (nuevo).** Plantillas puras, calcadas de
`peticionTemplate`/`informeTemplate` de `review.ts`: `peticionRolTemplate`,
`salidaRolTemplate`, `peticionUnificadorTemplate`.

`fenceFor` (hoy en `review.ts`, sin ningún consumidor fuera de él y **sin un
solo test propio** — comprobado) se mueve a `src/core/markdown.ts`, y `review.ts`
lo re-exporta para no acoplar dos comandos lateralmente.

**4. `src/commands/plan.ts` (extendido).** El diff se acota a un bloque
insertado entre el `mkdir(planificacionDir)` y el `moveTareaFile` que ya
existen — misma ventana y mismo motivo que en `review`: escribir antes de mover,
para que un fallo a mitad deje la tarea reintentable en vez de en un estado sin
salida. `PlanCommandResult` gana campos; no pierde ninguno.

## Desacuerdos entre roles, y cómo se resuelven

**D-1. Qué manda para el número de agentes: el nivel declarado o el heurístico.**
Arquitectura propone usar el **declarado** y limitarse a *anotar* la heurística
en la petición del unificador, dejando el juicio a un LLM más adelante. Riesgos
propone `max(tabla[declarado], tabla[heurístico])`, determinista y sin LLM.

*Resolución: gana Riesgos, con la aportación de Arquitectura encima.* El lookup
usa el **máximo de los dos**, topado después por `hotfix`; y la discrepancia,
cuando la hay, se **escribe** en la petición del unificador. Con el declarado a
secas la heurística sería decorativa y no la leería nunca nadie; con el máximo
se respeta la asimetría que el propio YML documenta — infraestimar es lo caro,
sobreestimar es barato. **Divergencia consciente con el YML, aprobada por
Carlos el 2026-09-08**: su sección 5 manda consultar a un modelo barato cuando
la distancia supera `tolerancia_niveles`, y el CLI no puede llamar a ninguno. Se
documenta en `HALLAZGOS.md`; no se reescribe el YML. `tolerancia_niveles` y
`modelo_consulta_discrepancia` quedan **sin consumidor** y así se dice en el
código, en vez de fingir que se aplican.

**D-2. Cómo se organiza la re-planificación.** Arquitectura propone una carpeta
plana `brainstorm/` y detectar por presencia de salidas. Riesgos propone
`ronda-N/` como carpeta.

*Resolución: ninguna de las dos — gana el precedente.* `review` ya resolvió este
problema exacto con sufijo de ronda en el nombre del fichero y carpeta plana, y
tiene `siguienteRonda` escrito y probado. Copiar su forma cuesta menos que
inventar una tercera y hace que las dos carpetas de artefactos de una tarea se
lean igual. En ronda ≥2 se escribe **solo** `peticion-unificador-<ronda>.md`,
como manda la §16.3: un bucle de "pide cambios" es una corrección incremental,
no un reinicio.

**D-3. Objetivo vacío.** Solo lo levanta Riesgos: `taskctl new` deja el
`## Objetivo` en blanco a propósito, y con el orquestador eso significa N
agentes recibiendo una petición sin sustancia, que devuelven N invenciones
distintas, consolidadas después en un `plan-final.md` con autoridad.
Arquitectura no lo menciona y pide diff mínimo.

*Resolución: se adopta, acotado.* `plan` aborta si el cuerpo bajo `## Objetivo`
está vacío **y solo cuando iba a escribir al menos una petición** (N ≥ 1). Con
N = 0 el comportamiento es idéntico al de hoy, así que el cambio de conducta
queda contenido en lo nuevo y ninguna tarea existente se rompe. No es
hipotético: es exactamente lo que pasó al planificar esta tarea (ver el último
apartado).

**D-4. Si "testing" debe ser un agente o una checklist.** Arquitectura señala
que la §16.4 punto 2 propone que ese rol viva como checklist del unificador, lo
que contradice al criterio 1 ("uno por rol", cuatro roles) y a
`agentes_brainstorm_critica: 4`.

*Resolución: cuatro agentes.* D7 ya redactó los cuatro `agents/` y hay tests que
los congelan. La §16.4 se queda como divergencia documentada, no como deuda:
cambiarlo ahora invalidaría trabajo cerrado y medido.

**D-5. El checkpoint humano choca con la máquina de estados.** Lo levanta solo
Arquitectura, y **está confirmado en el código**: `state-machine.ts:45` define
`TRIVIAL_SIN_APROBACION = ['trivial', 'simple']`, y la línea 157 exime a esas dos
complejidades de `plan_aprobado` antes de `start`. La decisión #1 se cerró como
"checkpoint humano **siempre** obligatorio", que es de donde el criterio 4 dice
explícitamente que debe salir.

*Resolución: elevada a Carlos y **cerrada por él el 2026-09-08**: se implementa
la decisión #1.* Ver "Checkpoint humano" más abajo.

## Riesgos aceptados y qué los contiene

- **Fallo parcial a mitad de la escritura.** Si el proceso muere entre la
  petición del rol 2 y la del 3, la tarea sigue en `00-planificadas`, porque se
  escribe antes de mover. La petición del **unificador se escribe la última**:
  su ausencia es el testigo barato de "brainstorm incompleto", sin inventar
  ningún fichero de estado ni ninguna clave de frontmatter.
- **`EEXIST` sobre cada fichero nuevo.** La lección de TASK-027 se aplica a
  *cada* escritura, no solo a `plan-final.md`: `wx` + re-`stat` con `isFile()`,
  absorbiendo `ENOTDIR` además de `ENOENT` (en POSIX, `stat` de un fichero bajo
  una ruta ocupada por otro fichero contesta `ENOTDIR`, no `ENOENT`). Un bucle
  que se trague `EEXIST` genéricamente reintroduce el callejón sin salida ya
  pagado: `plan` diciendo "todo bien" y `approve` diciendo "ejecuta plan
  primero".
- **Cero campos nuevos en el frontmatter.** Es lo que hace reversible esta
  tarea: si todo lo nuevo vive dentro de `planificacion/`, revertir el commit
  del CLI deja ficheros inertes que el CLI viejo ignora. En cuanto se añadiera
  un `ronda_brainstorm` o un `brainstorm_roles`, el `validateTask` anterior lo
  rechazaría o lo perdería al reescribir, y la vuelta atrás pasaría a ser
  destructiva.
- **Compatibilidad hacia atrás.** Ausencia de `brainstorm/` es tarea del CLI
  viejo, **no un error**: 15+ carpetas ya existentes no lo tienen. La migración
  del `plan-final.md` legado sigue yendo antes que cualquier escritura nueva,
  como hoy.
- **El riesgo que Riesgos marca como el peor, y comparto:** si el recorte de
  contexto por rol es pobre, cuatro roles no dan cuatro puntos de vista sino
  **uno con cuatro firmas**, y el unificador lee esa coincidencia como
  confirmación. El síntoma es invisible al revés: el plan sale más largo y más
  seguro de sí mismo. Por eso cada plantilla de rol lleva un recorte *distinto*,
  y la petición del unificador **obliga** a escribir en qué discrepan los roles.
  Si no discrepan en nada, eso es la alarma, no la nota de calidad.

## Plan de pruebas

El criterio 5 pide que el camino determinista se pruebe sin llamar a ningún
agente. Cada grupo va con **la mutación del código que lo pone rojo**; un test
del que no sepa decirla, no entra.

| Grupo | Qué prueba | Mutación que lo pone rojo |
|---|---|---|
| G1 | Lookup `(complejidad, tipo) → N` contra el YML **real**, no una copia | `Math.min` → sustitución (rompe `hotfix`+`trivial`); tocar `agentes_brainstorm_media` |
| G2 | Puntuación y nivel heurístico: cada peso por separado | quitar el "menos la primera" de las etiquetas; contar repeticiones de una misma palabra de riesgo |
| G3 | `max(declarado, heurístico)`, con el tope de hotfix aplicado **después** | invertir el orden tope/máximo; usar el declarado a secas |
| G4 | Selección de roles: estable, y `deepEqual` contra `readdir(agents/)` | reordenar la constante; renombrar `brainstorm-dominio.md` |
| G5 | Escritura sobre repo Git temporal real: `deepEqual` del listado ordenado del directorio, no `length >= N` | `<=` por `<`; escribir el unificador siempre |
| G6 | **Acotado de contexto**: la petición de *r* contiene un fragmento del cuerpo de `agents/<r>.md` y **no** el de *s*, para cada par | concatenar los cuatro cuerpos; borrar el recorte |
| G7 | Objetivo vacío con N≥1 aborta y **no mueve la tarea**; con N=0 no aborta | quitar la puerta; aplicarla también con N=0 |
| G8 | Ronda ≥2 escribe solo la petición del unificador | regenerar las peticiones de rol |
| G9 | Errores de config: falta la clave de un nivel, valor no entero, negativo | sustituir la validación por un `Number(x)` con default |
| G10 | El CLI no llama a ningún modelo | introducir un `spawnSync` |

**Aserciones trampa a evitar en esta tarea concreta** (la lección de TASK-032:
allí se colaron siete que no podían fallar):

- "La petición del rol menciona su rol" — lo pone la cabecera de la plantilla;
  borrar el cuerpo entero dejaría el test verde. **La aserción que muerde es la
  negativa**: que no contenga el fragmento de los otros tres.
- `length >= N` en vez de `deepEqual` del listado: un quinto fichero se cuela
  sin que nadie se entere.
- Reimplementar la tabla del YML dentro del test: probaría el test contra sí
  mismo. Los valores esperados se leen del fichero; lo que se asevera es la
  *relación* (monotonía, extremos, el MIN del hotfix).
- Aseverar sobre `result.rolesElegidos` sin mirar el disco: el valor puede ser
  correcto y los ficheros no haberse escrito.

**Tests existentes**: los 25 de `plan.test.ts` se conservan como red de
regresión — los de doble lectura, guard §8.3, `--asignado-a`, rutas ocupadas,
migración legada y fail-closed del doble `plan-final.md` **no se tocan**, y son
la única prueba de que la reescritura no rompió el ciclo de vida. Cambian de
expectativa los que aseveran el contenido de `planificacion/`. Y hay que cubrir
`planTemplate`, que hoy **no tiene ni una aserción de contenido** (verificado:
cero apariciones en `test/`) y cuyo texto actual —"TASK-016 añadirá brainstorm
en paralelo"— pasa a ser falso con esta tarea.

**Smoke test manual**: clon limpio, `npm install && npm run build`, y `taskctl
plan` sobre cuatro tareas reales del repo (una `trivial`, una `media`, una
`alta`, un `hotfix`). Verificar a ojo que la petición de riesgos no contiene la
sección de testing, que la del unificador nombra las peticiones que de verdad
hay en disco, que el auto-commit las registra todas, y que un segundo `plan` no
pisa nada.

## Checkpoint humano — decidido por Carlos el 2026-09-08

**El criterio 4 y el código se contradecían, y la contradicción era real.** La
decisión #1 quedó cerrada como "checkpoint humano siempre obligatorio", y el
criterio 4 dice que de ahí sale la obligatoriedad. Pero `state-machine.ts:45`
eximía a `trivial` y `simple` de tener `plan_aprobado` antes de `start`.

**Se implementa la decisión #1**: `TRIVIAL_SIN_APROBACION` pasa a estar vacío y
el checkpoint es obligatorio para las cinco complejidades. Es una línea de
lógica, pero **cambia el comportamiento de `start`** para `trivial`/`simple` y
toca tests existentes, así que entra en esta tarea con su propia cobertura:

- La constante se vacía, no se borra. Sigue siendo el punto único donde se
  declara qué complejidades se eximen, para que reabrir la decisión sea una
  línea y no una arqueología — mismo criterio que `CONFIG_DEFAULTS`.
- Los tests de `start.test.ts` que hoy certifican que una tarea `simple` arranca
  sin `plan_aprobado` **invierten su expectativa**: pasan a exigir que aborte.
  No se borran; un test borrado no deja rastro de la decisión que lo mató.
- Se añade el caso simétrico: `trivial` y `simple` **con** `plan_aprobado: true`
  siguen arrancando. Sin él, vaciar la constante y romper `start` entero darían
  el mismo verde.

Lo que sostiene la decisión, y conviene que no se pierda: la exención nunca se
ejerció. No existe ni una sola tarea `trivial` en el repo, y de las 4 `simple`
cerradas **una escondía un CRÍTICO** — el mismo dato con el que se descartó D4.
Abaratar el checkpoint donde nunca se usó no ahorra nada y sí deja pasar el peor
bug del proyecto.

## Dato medido durante esta propia planificación

Aplicando la heurística de D7 a **TASK-016**: 1 dependencia + 5 criterios de
aceptación = **2 puntos → `simple`**, frente al `alta` declarado. Dos niveles de
distancia, por encima de `tolerancia_niveles: 1`.

La causa no es que los pesos estén mal: es que el `## Objetivo` de la tarea
estaba **vacío**, así que no había texto donde encontrar palabras de riesgo — la
única señal del YML que habla del contenido del trabajo y no de su forma. Es el
primer dato real sobre la heurística desde que se escribió, y sostiene por sí
solo la puerta de D-3. Va a `HALLAZGOS.md` al cerrar la tarea.
