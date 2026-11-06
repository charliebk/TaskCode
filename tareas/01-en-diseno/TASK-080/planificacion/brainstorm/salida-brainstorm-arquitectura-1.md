# Brainstorm — TASK-080, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

Rutas relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

- **Accesibilidad**: solo texto. Subseccion "Accesibilidad (WCAG 2.2)" dentro de `## Que se revisa` de `skills/angular-vue-reviewer/SKILL.md` (contraste, orden y visibilidad del foco, trampas de teclado, etiquetas/aria, nombre accesible, dialogos modales), citando criterio de exito. `scripts/catalogo-skills.yml` no cambia: `skill_3_etiquetas` ya incluye `accesibilidad` (verificado), `patrones_archivo` intacto, `total_skills: 6` sigue cuadrando (los agentes no son skills del catalogo).
- **Arquitectura**: ampliar `## Qué miras` de `agents/brainstorm-arquitectura.md` con limites entre modulos, direccion de dependencias, acoplamiento y coherencia con los ADR (hoy no hay mencion a ADR, verificado con grep). Redaccion generica (el test 12 prohibe marcas del repo). Plantilla de salida sin cambios.
- **Rendimiento**: rol **condicional, fuera del presupuesto N** de la heuristica. En `src/core/roles-brainstorm.ts`:
  - `ROLES_BRAINSTORM` (4, por prioridad) intacto.
  - Nueva `ROLES_CONDICIONALES: readonly { rol: RolBrainstorm; etiquetas: readonly string[] }[]` con `brainstorm-rendimiento` -> `[rendimiento, wasm, workers, 3d]`.
  - Nueva `seleccionarRolesDeTarea(n, etiquetas)` = `seleccionarRoles(n)` + condicionales cuyas etiquetas casan.
  - Nueva `TODOS_LOS_ROLES` (union) para busquedas por nombre.
  - `RolBrainstormId` gana `'brainstorm-rendimiento'`.
- **Consumidores** a migrar (verificado):
  - `src/commands/plan.ts:477`: `seleccionarRoles(resolucion.agentes)` -> `seleccionarRolesDeTarea(resolucion.agentes, task.etiquetas)`.
  - `src/commands/plan.ts:917` y `:947`: buscan en `ROLES_BRAINSTORM`; deben buscar en `TODOS_LOS_ROLES` o una salida de rendimiento en disco aparece como "rol ya no declarado en el plugin".
  - `src/commands/approve.ts:235` (`planEsPlantilla`): ver decision que mas preocupa.
- **Agente nuevo** `agents/brainstorm-rendimiento.md` copiando estructura de los cuatro: secciones obligatorias, `tools: Read, Grep, Glob`, tope "Maximo N lineas en total", marcadores `Desacuerdos previstos` y `Suposiciones no verificadas`.
- **Unificador**: parrafo en `agents/brainstorm-unificador.md` sobre integrar la salida de rendimiento si existe. `peticionUnificadorTemplate` (`src/core/plan-brainstorm.ts:245`) ya recibe `roles` y la lista de salidas sale del disco; basta con pasarle la lista completa.

## Que se extiende y que se crea

- Extiende `skills/angular-vue-reviewer/SKILL.md` (no revisor aparte: lo dice el objetivo y `clasificarPorDominio` mandaria los `.vue` al generico).
- Extiende `agents/brainstorm-arquitectura.md` y `brainstorm-roles.test.ts` con aserciones sobre las cuatro ideas.
- Extiende `src/core/roles-brainstorm.ts` (lista + funcion + union). `seleccionarRoles(n)` se mantiene (lo usan `approve` y el test 14b).
- Crea `agents/brainstorm-rendimiento.md`.
- En `test/agents/brainstorm-roles.test.ts`, constante aparte `ROLES_CONDICIONALES` junto a `ROLES` (como `FICHERO_UNIFICADOR`): entra en `AGENTES` (tests 1-13) pero **no** en `FICHEROS`; si entrara, el 14b calcularia 5 roles cuando `critica=4`, y el 13b mediria cinco roles reclamando/cediendo.
- Extiende el registro de `test/core/roles-brainstorm.test.ts` (cuadre bidireccional nucleo <-> `agents/`; no leido, lo dice el comentario de `roles-brainstorm.ts:25-31`).
- Docs: README, CHANGELOG, texto de roles.
- **Precedente**: `seleccionarSkill(task, catalogo)` en `src/core/catalogo-skills.ts:486` cruza `task.etiquetas` con etiquetas por entrada; misma semantica (basta una coincidencia). La lista va en codigo, no YML, porque cada `id` esta acoplado por nombre a un fichero de `agents/`.

## Limites que cruza

- **Contrato del nucleo**: hoy "roles = prefijo de longitud N de una lista fija" (lo asumen `plan.ts`, `approve.ts` y el comentario de `roles-brainstorm.ts:14-23`). Deja de ser cierto; reescribir el comentario.
- **Formato en disco**: `peticion-brainstorm-rendimiento-<ronda>.md` / `salida-...` salen de `nombrePeticionRol` / `nombreSalidaRol`, sin esquema nuevo.
- **Heuristica**: `scripts/heuristica-complejidad.yml` intacto; rendimiento no consume ni desplaza presupuesto.
- **Reparto de temas** (test 13b): arquitectura sigue reclamando el rendimiento/escalabilidad que fija la forma; el rol nuevo se queda con el coste de ejecucion (bucles calientes, copias JS-WASM, medir antes de optimizar). `brainstorm-rendimiento.md` debe ceder en su "Que NO miras" la forma del cambio a arquitectura, nombrandola.
- **Contenido instalado en proyectos ajenos**: agente nuevo y texto de ADR entran en el test 12.

## La decision de diseño que mas te preocupa (UNA sola)

**Rendimiento como rol condicional en lista aparte, fuera de N, con `seleccionarRolesDeTarea(n, etiquetas)` como unica fuente de verdad de los roles de una tarea.**

Motivo: `planEsPlantilla` (`src/commands/approve.ts:235-240`) genera las plantillas candidatas con `seleccionarRoles(k)` para k=0..4, asumiendo prefijo. Si `plan` escribe un `plan-final.md` con rendimiento y `approve` no genera esa variante, la plantilla vacia no casa con ninguna y se considera **redactado** un plan sin rellenar: se podria aprobar. `taskctl siguiente` (TASK-056) tambien la usa. Debe generar `seleccionarRolesDeTarea(k, task.etiquetas)`. Riesgo derivado: si cambian las etiquetas entre `plan` y `approve`, la comparacion vuelve a fallar.

**Alternativa descartada**: quinto elemento en `ROLES_BRAINSTORM` filtrado por etiquetas. Rompe el tope `ROLES_BRAINSTORM.length` de `seleccionarRoles(n)`, los tramos del 14b y "critica = los cuatro roles", y deja que la prioridad decida si entra un rol que no deberia competir por sitio.

**Desacuerdos previstos**: con N=0 (trivial) y etiqueta `wasm`, ¿se lanza rendimiento? El criterio dice que si, pero rompe "con 0 roles todo funciona como antes de TASK-016" (`plan.ts:503-505`) y obliga a lanzar el unificador para un solo rol. Decision de persona.

**Suposiciones no verificadas**:
- No leido `test/core/roles-brainstorm.test.ts`.
- No revisado si otras partes de `plan.ts` (529-895) iteran roles.
- No comprobado si `doctor-deploy.test.ts` enumera agentes (sale en grep de `brainstorm-dominio`).
