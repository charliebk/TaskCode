# Plan — TASK-167c: auditoria 4D invocable

(Modo rapido: el plan lo redacta el coordinador, sin brainstorm. Decisiones de
Carlos del 2026-11-25 en el plan de TASK-167: la auditoria deja informe y, si
la persona lo pide, una tarea por ola con `taskctl new`; las metricas entre
auditorias son la parte d, que leera este informe.)

## Enfoque propuesto

Duracion estimada: 55 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo nuevo —`src/core/auditoria-4d.ts`, solo el formato—, 1 skill nueva instalable, 1 enlace en task-workflow, 2 criterios)

1. `src/core/auditoria-4d.ts`, puro y pequeno: el formato del informe como
   fuente unica — la ruta (`docs/auditoria-4d-<AAAA-MM-DD>.md`), las
   secciones (`## Resumen`, `## Hallazgos`, `## Plan por olas`), las cabeceras
   de sus tablas, las cuatro D y las severidades. La parte d le anadira el
   parser; la skill y su test se atan a estas constantes, no a una copia.
2. Skill instalable `skills/auditoria-4d/SKILL.md`
   (`/taskcode-plugin:auditoria-4d`): reparte el proyecto en zonas (por
   carpetas de codigo de `git ls-files`), lanza un agente de solo lectura por
   zona en paralelo con la Regla 4D (de `task-workflow/revision.md`) y los
   patrones de `task-workflow/duplicacion.md`, consolida (sin duplicados entre
   zonas, cada hallazgo con fichero:linea) en el informe con el formato fijo y
   un plan por olas (cada ola de menos de una hora, regla de
   `task-workflow/duracion.md`), y pregunta a la persona si crea una tarea por
   ola; si dice que si, una llamada `taskctl new` por ola con titulo,
   objetivo, criterios y la etiqueta `regla-4d`.
3. `task-workflow/SKILL.md`: una linea que la nombra (con el tope de tamano:
   se recorta texto para hacer sitio).

## Reutilizacion (Regla 4D)

- `task-workflow/revision.md` (Regla 4D) y `task-workflow/duplicacion.md` (patrones): la skill remite a ellos, no los copia.
- `task-workflow/duracion.md`: el tamano de cada ola.
- `taskctl new` y sus flags existentes (`--titulo`, `--tipo`, `--etiquetas`, `--objetivo`, `--criterio`): nada nuevo en el CLI.
- `doctor-deploy/SKILL.md`: el patron de skill que lanza agentes de solo lectura y crea tareas si se pide.
- Tests: la enumeracion de `skills/` de `test/skills/doctor-deploy.test.ts`, los topes de `test/skills/tamanos.test.ts` y las marcas del repo que no viajan.

## Riesgos aceptados y que los contiene

- Que la skill y la parte d diverjan en el formato — constantes en `core/auditoria-4d.ts` y un test que exige que la skill las contenga.
- Que la skill invente flags de `taskctl new` — el test compara los flags que cita con los que `new` acepta.
- Coste de la auditoria en proyectos grandes — zonas acotadas y agentes en paralelo; es invocable, no automatica.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio):

- Criterio 1: 1 test de la skill (frontmatter valido, nombra las cuatro D, las tres secciones con sus cabeceras exactas de `core/auditoria-4d.ts`, la ruta del informe y que los agentes son de solo lectura).
- Criterio 2: 1 test (la creacion de tareas por ola: `taskctl new` con solo flags que `new` acepta, `--etiquetas regla-4d`, y que pregunta antes). Mas la enumeracion de skills y el tope de tamano actualizados. Sin pesados.

## Lo que necesita decision de una persona

Resuelto (decisiones de Carlos del 2026-11-25).
