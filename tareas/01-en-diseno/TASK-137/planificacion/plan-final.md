# Plan — TASK-137: Regla 4D: sin duplicacion, desviacion, diluvio ni disfraz de codigo

Redactado por el coordinador (modo rapido, sin brainstorm: el cambio es de
texto de skills mas un aviso no bloqueante, con un patron ya existente —
`avisoAutorrevision`, `casillasSinMarcar`— que se copia en forma).

## Enfoque propuesto

Duracion estimada: 60 min (de la rama abierta al cierre con merge; senales:
2 ficheros de codigo, 7 skills, 1 informe de auditoria, 4 criterios)

La regla se aplica a si misma: una sola definicion de las 4D y referencias a
ella, el codigo nuevo reutiliza el parser de secciones que ya hay, y los
tests nuevos se comprueban por mutacion.

1. **Definicion unica** en `skills/task-workflow/revision.md`, seccion nueva
   `## Regla 4D`: las cuatro D con su definicion, un ejemplo de cada una y la
   regla de severidad (duplicacion y disfraz reales = IMPORTANTE como minimo;
   desviacion y diluvio = MENOR salvo que cambien comportamiento o escondan
   un bug). Todas las revisoras ya mandan leer revision.md antes de empezar.
2. **Cada revisora** (`code-quality-reviewer` y las cuatro de dominio) gana
   un apartado corto `### Regla 4D en <dominio>` con un ejemplo por D propio
   de su ecosistema y la remision a revision.md. No se copia la definicion:
   copiarla cinco veces seria justo la D1 que la tarea prohibe. En
   `code-quality-reviewer` se anaden la duplicacion y el disfraz reales a la
   lista de IMPORTANTE (hoy la duplicacion sin consecuencia es MENOR y se
   mantiene asi: la regla no cambia, se precisa).
3. **Plantilla del informe** (`informeTemplate` en `src/commands/review.ts`):
   seccion `## Regla 4D` tras la tabla de hallazgos, con cuatro lineas
   `- Duplicacion: (cumple / ID del hallazgo)`, y las de desviacion, diluvio
   y disfraz. revision.md la describe en `## El informe`.
4. **Aviso en `finish`**: funcion pura `avisoRegla4D(informes, id)` en
   `src/core/informe-revision.ts` (junto a los demas lectores del informe,
   reutilizando `rangoDeSeccion`). Da aviso si algun informe de la ultima
   ronda no tiene la seccion, le falta alguna de las cuatro lineas, o alguna
   sigue con el texto de la plantilla o vacia. `finish` la llama en el paso
   `puertas`, con los informes de `informesDeUltimaRonda`, y emite por
   `onAviso` sin bloquear (misma doctrina que criterios sin marcar y coste).
   Los informes viejos sin la seccion solo afectan a tareas sin cerrar: aviso
   no bloqueante, aceptable.
5. **Skill `start`**: paso nuevo antes de pedir revision — buscar el helper
   existente antes de crear uno, citar en cada commit/cambio el criterio que
   lo motiva, y comprobar por mutacion cada test nuevo (romper el codigo y ver
   el test en rojo). Se anota en `## Autorrevision` de `tarea.md` con una
   linea `- 4D — <commit>: helper buscado, criterios citados, N tests mutados`.
   El texto de `avisoAutorrevision` lo menciona.
6. **Auditoria** de las 10 ultimas tareas terminadas (TASK-127..136) en
   `docs/auditoria-4d.md`: un caso por fila con fichero:linea, la D, la
   evidencia y la tarea de seguimiento. Tres agentes en paralelo (lectura) y
   consolidacion del coordinador, que comprueba cada caso antes de listarlo.
   Los casos se agrupan en tareas de seguimiento (`taskctl new`) por D o por
   modulo; la auditoria no corrige nada (eso seria D2).

## Desacuerdos entre roles, y como se resuelven

No hubo roles. Decision del coordinador: ejemplos por dominio en cada skill
en vez de la definicion entera repetida (motivo en el punto 2).

## Riesgos aceptados y que los contiene

- Topes de bytes de las skills (`test/skills/tamanos.test.ts`): cada apartado
  por dominio cabe en ~700 B; si alguna revisora pasa su tope se compacta su
  texto, no se sube el tope.
- El aviso no bloquea: un revisor puede dejar la seccion mal y la tarea
  cierra igual. Es la doctrina del resto de avisos de finish; el veredicto
  sigue siendo la puerta.
- La auditoria es juicio: cada caso se lista con evidencia reproducible
  (fichero:linea y por que), y los dudosos se marcan como tales.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio):

- C1 (skills): un test en `test/skills/` que exige `## Regla 4D` en
  revision.md con las cuatro D y, en cada revisora, el apartado con las
  cuatro D.
- C2 (plantilla + finish): unit de `avisoRegla4D` (sin seccion, linea de
  plantilla, completa) en `test/core/`; asercion de la plantilla en el test
  existente de `informeTemplate`; un test de `finish` contra repo real que
  ve el aviso con un informe aprobado sin la seccion.
- C3 (start): asercion en el test de skills sobre los tres requisitos.
- C4: la auditoria se comprueba en la revision (fichero:linea existen).

Mutacion: quitar la llamada en finish y la comprobacion de cada linea debe
poner rojo su test.

## Lo que necesita decision de una persona

Nada bloqueante. Tras cerrar, publicar la nueva version (pedido de Carlos,
2026-11-22).
