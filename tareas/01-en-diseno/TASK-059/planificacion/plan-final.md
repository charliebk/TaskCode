# Plan — TASK-059: Flujo E, modo automatico

(Sin brainstorm propio: la heuristica dio "trivial"; el diseno es el del plan
de referencia de TASK-055 y sus contenciones de riesgos, mas lo aprendido en
las revisiones de B, C y D. Lo redacta quien orquesta.)

## Enfoque propuesto

1. **`siguienteFase` en automatico** (`core/flujo.ts`; hoy se comporta como
   el semiautomatico hasta tener estas guardas):
   - Fases nuevas → `continuar`, con estas excepciones que devuelven
     `preguntar`:
     - `approve` sin modo congelado (ya existe);
     - `finish` de hotfix/release (ya existe);
     - `finish` sin el informe aprobado en un **commit propio**: cada informe
       de la ultima ronda tiene que estar en un commit que solo toque la
       carpeta `revision/` de la tarea y que sea posterior al ultimo commit
       que toca codigo (fuera de `tareas/`). Contiene el riesgo del veredicto
       autoescrito por el mismo agente que implementa;
     - **tope de rondas**: con `cambios-solicitados` en la ronda 3 o
       siguientes;
     - `veredicto-codex`, que es siempre de una persona (decision de la
       ronda 1 de B; divergencia con el criterio 1, documentada).
   - Trabajo pendiente (implementar en curso; corregir tras
     `cambios-solicitados`): en automatico → `continuar` (lo hace la skill);
     en semiautomatico sigue siendo `detener`.
   Contexto nuevo: `rondaRevision` e `informeEnCommitPropio`, que calcula
   `taskctl siguiente` con git (del working tree o de la rama de la tarea).
2. **Skills en automatico** (`avance.md` y las de fase):
   - `approve`: con modo congelado automatico, `taskctl approve TASK-NNN
     --decidido-por automatico` sin preguntar; queda registrado como
     automatico (deja sin efecto la decision #1 solo en este modo; ya
     documentado en el plan de referencia).
   - `start`: tras abrir la rama, implementar el plan (skills recomendados),
     con tests, commitear, suite en verde, y encadenar review.
   - `review`: con `cambios-solicitados`, corregir los CRITICO e IMPORTANTE
     del informe, commitear, suite en verde y `taskctl review` (ronda
     siguiente). Cada informe se commitea solo (requisito de finish).
3. **Las guardas no cambian**: limite WIP, base sucia, informe sin veredicto
   y `revision_codex` sin segunda opinion siguen abortando en el CLI.

## Riesgos aceptados y que los contiene

- «La suite pasa» es palabra del agente (riesgo aceptado en el plan de
  referencia); lo contienen el revisor independiente y el informe en commit
  propio.
- Encadenar la implementacion y las correcciones gasta agentes: el tope de
  rondas lo limita.

## Plan de pruebas

- `test/core/siguiente.test.ts`: la columna automatico de la tabla vuelve a
  `continuar` con las excepciones; filas nuevas para finish sin commit propio,
  tope de rondas y trabajo pendiente en automatico frente a semiautomatico.
- `test/commands/automatico.test.ts` (repo temporal, CLI real, fixtures en
  lugar de agentes): ciclo entero con `siguiente` en cada paso sin
  `preguntar` tras plan, approve `automatico | automatico`, un commit por
  transicion y la tarea en `04-terminadas`; informe commiteado junto a codigo
  → `finish` pregunta; ronda 3 con cambios → pregunta; guardas en automatico
  (WIP, base sucia, informe sin veredicto, segunda opinion) abortan.
- `test/skills/fases.test.ts`: approve con `--decidido-por automatico`, start
  implementa, review corrige y commitea el informe solo.
- Smoke en Claude Code: este entorno no autentica `claude -p`; pasa a «Tras
  el cierre», como en D.

## Lo que necesita decision de una persona

Nada nuevo: decisiones de Carlos del plan de referencia. Aprobado por el
orquestador bajo su autorizacion de encadenar las entregas A→E.
