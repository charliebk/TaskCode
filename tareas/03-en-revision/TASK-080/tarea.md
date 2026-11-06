---
id: TASK-080
titulo: "Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan"
tipo: feature
sprint: 0
etiquetas: [skills, revisores, brainstorm, accesibilidad, rendimiento]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-080-accesibilidad-en-angular-vue-reviewer-y
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: [angular-vue-reviewer]
regla_seleccion_skill: solape
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 3070861
tokens_implementacion: null
tokens_revision: 9942791
creado: 2026-11-06
actualizado: 2026-11-06
dependencias: []
---
## Objetivo

Tres refuerzos pedidos por la persona. Primero, la accesibilidad WCAG 2.2 dentro de angular-vue-reviewer y no como revisor aparte: un revisor propio sobre .vue solaparia patrones y clasificarPorDominio mandaria esos ficheros al generico. Segundo, criterios de arquitectura mas exigentes en el rol brainstorm-arquitectura de la fase plan. Tercero, un rol nuevo, brainstorm-rendimiento, para las tareas con WASM, Web Workers, 3D o carga pesada.

## Criterios de aceptacion
- [x] skills/angular-vue-reviewer/SKILL.md revisa contraste, orden y visibilidad del foco, trampas de teclado, etiquetas y aria en controles, nombre accesible de iconos y botones y dialogos modales, citando WCAG 2.2; test/skills/revisores.test.ts sigue en verde y sus patrones_archivo no cambian
- [x] agents/brainstorm-arquitectura.md incluye limites entre modulos, direccion de las dependencias, acoplamiento y coherencia con los ADR del proyecto, y test/agents/brainstorm-roles.test.ts lo comprueba
- [x] Existe agents/brainstorm-rendimiento.md con el mismo formato que los demas roles brainstorm-*: coste algoritmico, asignaciones en bucles calientes, copias JS-WASM, Web Workers, mallas y teselas grandes, y medir con datos reales antes de optimizar
- [x] taskctl plan lanza brainstorm-rendimiento cuando la tarea tiene etiquetas de rendimiento, wasm, workers o 3d, y no lo lanza sin ellas; lo cubren tests en test/commands/plan-brainstorm.test.ts
- [x] brainstorm-unificador integra la salida de rendimiento; README del plugin, documentacion de roles y CHANGELOG lo recogen, y catalogo-skills.yml queda con total_skills cuadrado si cambia
- [x] npm test en verde (salvo los tres rojos conocidos de Windows) en la rama de la tarea

## Resultado

Tres refuerzos, sin dependencias nuevas.

- **Rol condicional `brainstorm-rendimiento`** (`agents/brainstorm-rendimiento.md`, mismo formato que los
  demas roles: secciones, contexto, salida con tope de 50 lineas). En `src/core/roles-brainstorm.ts`:
  `ROLES_CONDICIONALES` (etiquetas `rendimiento`, `wasm`, `workers`, `3d`), `TODOS_LOS_ROLES`,
  `seleccionarRolesDeTarea(n, etiquetas)` y `condicionalesDescartados`. La escalera `ROLES_BRAINSTORM`
  y `seleccionarRoles(n)` no cambian.
- **Decisiones de la persona en la fase plan**: rendimiento solo se suma si la escalera ya lanza 2 o
  mas roles (con 0, con 1 o en hotfix no entra y `plan` lo avisa por stderr); etiquetas sin distinguir
  mayusculas ni espacios, coincidencia de etiqueta completa (`web-workers`, `wasmtime`, `performance` no
  disparan); `approve` y `taskctl siguiente` sacan los roles de las peticiones en disco.
- **El fallo que los tres roles del diseno dieron por mas grave**: `planEsPlantilla` solo comparaba con
  prefijos de la escalera, y la plantilla vacia de un plan con rendimiento se habria dado por redactada.
  Ahora compara con los prefijos, con los juegos que dan las etiquetas de hoy y con los juegos de
  **todas** las rondas en disco (el plan decia la ultima; todas es mas permisivo y mas seguro, lo
  respaldan los escenarios de la revision).
- `plan.ts` busca roles por nombre en `TODOS_LOS_ROLES` (scaffolds y titulos de las salidas a
  consolidar) y la linea de discrepancia nombra los condicionales que se suman.
- **`brainstorm-arquitectura`**: limites entre modulos, direccion de las dependencias, acoplamiento y
  coherencia con los ADR; el coste fino de ejecucion pasa al rol de rendimiento cuando se lanza.
  **`brainstorm-unificador`**: integra la salida de rendimiento y no la cuenta como salida que falto.
- **`angular-vue-reviewer`**: bloque "Accesibilidad (WCAG 2.2)" con criterio citado en cada punto
  (1.4.3, 1.4.11, 2.4.3, 2.4.7, 2.4.11, 2.1.1, 2.1.2, 1.3.1, 3.3.2, 4.1.2, 4.1.3, 1.1.1, 2.5.3, 2.5.8) y
  severidad escrita en la clasificacion (trampa de teclado o dialogo sin nombre ni foco, CRITICO;
  contraste no verificable desde el diff, MENOR pendiente). `patrones_archivo` sin cambios;
  `total_skills: 6` sin cambios (no hay skill nueva).
- Documentacion: README del plugin (roles del brainstorm), `task-workflow/SKILL.md` (condensado para
  seguir bajo 15 KB con CRLF), `docs/PROPUESTA_METODOLOGIA.md` y CHANGELOG bajo "Sin publicar".
- Tests: core (tests 11-14 del rol condicional), agentes (13c rendimiento, 13d arquitectura,
  condicionales fuera de `FICHEROS` para no romper 13b y 14b), revisores (14, WCAG anclado al bloque),
  doctor-deploy, y 14 de integracion en `plan-brainstorm.test.ts` con repos Git reales y el binario.
- Suite completa: 1895/1898 (los 3 rojos conocidos de Windows: symlink EPERM, chmod de directorio, CRLF).

Revision por pares, 2 rondas (code-quality-reviewer, sonnet), con mutantes en clon temporal:
- Ronda 1 (revisor: `aprobada-con-correcciones`; registrada `cambios-solicitados` por el IMPORTANTE en
  modo automatico): IMP-1 (el aviso por stderr no tenia test; mutante M9 sobrevivia), MEN-1 (la
  discrepancia contradecia el numero de roles), MEN-2 (en hotfix aconsejaba subir la complejidad),
  MEN-3 (severidad de accesibilidad sin escribir en la clasificacion), MEN-4 (candidatas por etiquetas
  sin test; M11 sobrevivia), MEN-5 ("uno de los cuatro puntos de vista"). Todos corregidos.
- Ronda 2 (`aprobada`): M9, M11 y los mutantes de MEN-1 y MEN-2 mueren. Aceptado sin corregir:
  **MEN-6**, restos cosmeticos de "los otros tres" y "los cuatro roles arrancan a la vez" en los
  agentes base; la peticion generada lista a los companeros reales y no cambia ningun comportamiento.
- No publicada: sale junto con TASK-076 y TASK-079 (merge local, sin push).

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-06T20:50:55Z | plan | automatico | persona |
| 2026-11-06T21:31:57Z | approve | automatico | persona |
| 2026-11-06T21:32:17Z | start | automatico | persona |
| 2026-11-06T22:05:59Z | review | automatico | persona |
| 2026-11-06T22:59:55Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-06T21:13:18Z | diseno | agente:ae91fdc05286e3c5d,a2d673ab9621e7d07,a6241d7727e43c650,ad36fb944f6fa6717 | 112 | 275361 | 2751344 | 44044 | 83 | 3070861 |
| 2026-11-06T22:38:43Z | revision | agente:a997ec01fea174e67 | 100 | 185300 | 7630902 | 29360 | 4 | 7845662 |
| 2026-11-06T23:15:53Z | revision | agente:a504d99e341f74e57 | 40 | 112236 | 1976671 | 8182 | 2 | 2097129 |
