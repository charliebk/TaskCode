# Plan — TASK-150: skills y agentes con una sola fuente por regla

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador sin lanzar los tres roles ni el unificador.)

## Enfoque propuesto

Duracion estimada: 210 min (de la rama abierta al cierre con merge; senales: unos 25 ficheros `.md` de skills y agentes, 3 de codigo —`src/core/roles-brainstorm.ts`, `src/core/plan-brainstorm.ts`, `src/commands/plan.ts`—, la sonda de `hooks/`, 3 capas, 4 criterios y 18 casos de la auditoria)

Casos de `docs/auditoria-4d-completa.md` que siguen abiertos segun la
segunda auditoria: CONT-01 a CONT-18 salvo CONT-08 (cerrado por TASK-153 y
reforzado por TASK-158b) y CORE2-03. Comprobado hoy en el repo: CONT-01
(sincronizacion.md:36 dice que una clave mal escrita aborta), CONT-02
(cierre.md:62 «finish no lee las casillas»), CONT-03 (review:84 y
tests-pesados.md:11, test duplicado = MENOR), CONT-04 («pedirlo
explicitamente» en tres revisoras), CONT-09 (descripcion de la revisora de
C# con «o la tarea menciona»), CONT-16 («tres claves», «ocho comandos») y
CONT-18 (el mismo caso CRITICO e IMPORTANTE en angular-vue) siguen tal cual.

Regla de la tarea (la de TASK-158): para cada regla duplicada se buscan
todos los sitios que la repiten, no solo los citados por la auditoria, y se
deja una fuente con remisiones; un test por regla que falle si vuelve a
copiarse o a contradecir al codigo.

## Reutilizacion (Regla 4D)

- `test/skills/regla-4d.test.ts`, `test/skills/revisores.test.ts` (frases que solo pueden estar en revision.md, linea ~964), `test/skills/tamanos.test.ts` — los tests nuevos van ahi; los topes de tamano no se suben: quitar copias libera bytes.
- `informeTemplate` de `src/commands/review.ts` — fuente de la plantilla del informe (CONT-05); revision.md la describe y las revisoras remiten.
- `src/core/roles-brainstorm.ts` (secciones de salida de cada rol) — fuente del formato de los roles (CONT-06).
- `LINEA_PLANTILLA_DURACION`, `LINEA_PLANTILLA_PRESUPUESTO_TESTS`, `SECCION_REUTILIZACION` — fuentes de las secciones del plan (CORE2-03, CONT-07).
- Nuevo: ninguno previsto salvo, si hace falta, un modulo de secciones del plan que importen plan.ts y plan-brainstorm.ts.

## Troceo

### Parte a: textos que contradicen al codigo o a la Regla 4D
CONT-01, 02, 03, 04, 09, 16 y 18: sincronizacion.md, cierre.md, review y
tests-pesados, las revisoras que piden contexto y la descripcion de la de
C#, con cada sitio que repita esas frases.
Duracion estimada: 55 min
- [ ] sincronizacion.md, cierre.md, review y tests-pesados dicen lo mismo que el codigo y que revision.md (clave desconocida avisa, finish avisa de casillas, test duplicado sigue la Regla 4D); las revisoras no piden contexto explicitamente
- [ ] La descripcion de cada revisora coincide con el reparto real (solo patrones de fichero) y ningun caso sale con dos severidades
- [ ] Un test por regla falla si vuelve la frase contradictoria

### Parte b: la plantilla del informe en un solo sitio
CONT-05: las revisoras dejan de copiar la plantilla y remiten a revision.md,
que describe la de `informeTemplate`.
Duracion estimada: 45 min
- [ ] La plantilla del informe vive solo en informeTemplate y revision.md; las revisoras remiten a ella en vez de copiarla
- [ ] Un test falla si una revisora vuelve a copiar la plantilla

### Parte c: formatos del brainstorm y secciones del plan con una fuente
CONT-06, CONT-07 y CORE2-03.
Duracion estimada: 60 min
- [ ] Los formatos de salida de los agentes brainstorm coinciden con roles-brainstorm.ts y las secciones del plan (Duracion estimada y presupuesto de tests incluidos) salen de una sola fuente que usan plan.ts, plan-brainstorm.ts y el unificador
- [ ] Un test falla si un agente y roles-brainstorm.ts divergen

### Parte d: pasos copiados, diluvio e historial, y la sonda
CONT-10 a CONT-15 y CONT-17.
Duracion estimada: 55 min
- [ ] Los pasos copiados (cadena, coste, tope de rondas, MENORES, una suite por ronda) remiten a una sola guia; sin diluvio ni historial de versiones en las skills; la sonda de hooks inerte sale del plugin
- [ ] Un test por paso falla si vuelve a copiarse

Troceo sin preguntar: autorizado por Carlos (2026-11-22, y 2026-11-24 al
pedir seguir hasta la 0.19.0).

## Desacuerdos entre roles, y como se resuelven

Sin roles (modo rapido).

## Riesgos aceptados y que los contiene

- Quitar texto de una skill que un agente necesitaba — se remite siempre a una fuente que el agente ya lee; lo comprueba el revisor.
- Tests de texto fragiles — frases clave minimas.
- Los textos se instalan en otros proyectos — sin menciones a TaskCode ni rutas internas (`skills/task-workflow.test`).

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- a: 3 tests en `test/skills/` (sincronizacion/cierre contra el codigo; test duplicado y contexto en revisoras; descripciones y severidades unicas).
- b: 1-2 tests (ninguna revisora copia la plantilla; remiten a revision.md).
- c: 2 tests (agentes frente a roles-brainstorm.ts; secciones del plan de una fuente).
- d: 2-3 tests (pasos copiados una sola vez; sin historial de versiones; la sonda no se publica).

## Lo que necesita decision de una persona

Nada abierto.
