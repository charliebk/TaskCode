# Brainstorm — TASK-017, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: Claude (rol arquitectura, ronda 1)

## Enfoque propuesto, con rutas y nombres concretos

Nuevo catalogo `scripts/catalogo-skills.yml`, mismo patron que
`scripts/heuristica-complejidad.yml` (fichero YAML-a-mano distribuido
por el plugin, sin runtime de YAML). Nuevo modulo `core/catalogo-skills.ts`
con `cargarCatalogoSkills()` (fail-closed, reusa `parseBloqueClaveValor`
de `frontmatter.ts`, misma doctrina que `cargarHeuristica()` en
`core/heuristica.ts`: clave desconocida o ausente aborta, no hay
default silencioso) y una funcion pura `seleccionarSkill(task, catalogo)`
que hace el paso 1 de 6.6: solape de `etiquetas` y desempate por
`prioridad` (16.4.1), sin LLM. Se invoca desde `runPlanCommand` en
`commands/plan.ts` justo tras `seleccionarRoles(resolucion.agentes)` —
ahi mismo donde el comentario de cabecera del fichero dice hoy
"seleccion de skill (6.6, TASK-017): sin hacer".

## Que se extiende y que se crea

- Extiende: `commands/plan.ts` (un paso mas en `runPlanCommand`, mismo
  hueco que ya ocupan `cargarHeuristica`/`resolverNumeroAgentes`).
- Crea: `scripts/catalogo-skills.yml`, `core/catalogo-skills.ts`, y —
  solo cuando el paso 1 empata tambien en `prioridad` — un par
  peticion/salida de desempate (`peticion-desempate-skill-1.md` /
  `salida-desempate-skill-1.md`) en el mismo `planificacion/` de la
  tarea, siguiendo el patron ya establecido por `core/plan-brainstorm.ts`
  para peticiones de rol y de unificador.
- No toca: la seleccion de `agente_revisor` (sigue en `etiquetas`,
  seccion 9) ni ningun consumo de `patrones_archivo` — eso es TASK-018,
  el catalogo solo declara el campo.

## Limites que cruza

- Formato de fichero nuevo, pero no un parser nuevo: mismo
  `parseBloqueClaveValor` y misma doctrina fail-closed que
  `heuristica-complejidad.yml`, verificado leyendo `core/heuristica.ts`
  completo.
- El paso 2 (desempate por LLM) NO puede ser una llamada directa desde
  `plan.ts`: el propio fichero declara en su cabecera que el CLI nunca
  invoca un modelo, que quien orquesta la sesion dispara las peticiones
  y vuelca las respuestas en los scaffolds — mismo reparto que fijo
  TASK-013 para `taskctl review`. El desempate, cuando ocurre, es una
  peticion/salida mas, no una excepcion a esa regla.
- Nuevo artefacto de auditoria dentro de `planificacion/` de la tarea:
  extiende la convencion de TASK-027 (todo lo de brainstorm anidado
  bajo `planificacion/` para que `moveTareaFile` se lo lleve entero al
  cambiar de estado la tarea).

## La decision de diseño que mas te preocupa (UNA sola)

Donde vive el registro auditable de "que skill se eligio y por que
regla": ¿un campo/seccion mas dentro de `plan-final.md` (mas visible,
pero es prosa libre) o un fichero estructurado propio en
`planificacion/` (mas facil de que TASK-018 y una auditoria futura lo
lean sin parsear markdown)? Me inclino por el fichero dedicado, pero no
he leido `core/plan-brainstorm.ts` a fondo para confirmar si ya existe
ahi una convencion de "artefacto estructurado, no prosa" que deba
reusar en vez de inventar una tercera forma de registrar resultados.
