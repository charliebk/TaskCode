# Prompt: tarea de auditoría 4D inicial en un proyecto que usa el plugin

> Para pegar en una sesión de Claude Code abierta en la raíz de **cada
> proyecto** que use `taskcode-plugin`, con el plugin ya en la 0.17.0 o
> posterior (la que trae la Regla 4D). Crea la tarea; no la ejecuta.

---

Actualiza antes el plugin si hace falta (`/plugin marketplace update` y
reinstalar `taskcode-plugin`) y comprueba con `taskctl doctor` que la versión
es 0.17.0 o posterior. Si no lo es, para y dímelo.

Crea con `taskctl new`, en la rama base del proyecto, la tarea de
reconocimiento y auditoría 4D de todo el código existente. Es la primera
tarea que se hace con la Regla 4D: va antes que cualquier otra planificada.
La Regla 4D está definida en la skill `task-workflow`, en `revision.md`,
sección «Regla 4D». Léela antes de redactar la tarea.

Datos de la tarea:

- Título: `Auditoria 4D inicial: reconocimiento completo del codigo existente`
- Tipo: `feature`. Complejidad: `alta`.
- Objetivo: reconocer el proyecto entero y auditar todo el código ya
  escrito contra las cuatro reglas: sin **duplicación** (dos funciones o
  clases que hacen lo mismo con pequeñas diferencias, o un helper existente
  reimplementado), sin **desviación** (código que no responde a ningún
  objetivo del proyecto o que mezcla responsabilidades ajenas), sin
  **diluvio** (muchas líneas o clases donde bastan pocas) y sin **disfraz**
  (algo que aparenta resolver y no hace nada o no se comprueba: tests que no
  fallan si se rompe el comportamiento, stubs que devuelven éxito,
  comprobaciones que nunca se ejecutan). La auditoría solo lee y documenta.
  Las correcciones van en tareas de seguimiento: corregir aquí sería
  desviación.
- Criterios de aceptación (uno por `--criterio`):
  1. `docs/auditoria-4d.md` tiene un mapa del proyecto: módulos o áreas, su
     responsabilidad y su tamaño en líneas. Cada área figura como auditada,
     o como excluida con su motivo (código generado, vendorizado, etc.).
  2. Cada caso 4D está en una tabla con `ID | Área | D | fichero:línea |
     evidencia | severidad | confianza | seguimiento`. Duplicación y disfraz
     reales son IMPORTANTE como mínimo; desviación y diluvio, MENOR salvo que
     cambien comportamiento o escondan un fallo. Los dudosos se marcan con
     confianza media; no se omiten ni se inflan.
  3. Cada caso de confianza alta lo vuelve a comprobar en el código quien
     consolida, distinto del agente que lo encontró. Los casos de disfraz en
     tests se comprueban por mutación sobre una muestra de al menos 5 tests:
     romper el código y ver si el test se pone rojo. El resultado queda
     anotado.
  4. Cada caso tiene una tarea de seguimiento creada con `taskctl new`,
     agrupando por regla y área, nunca una tarea por caso suelto. El informe
     cierra con un resumen por área y una conclusión: qué D predomina y en
     qué zonas.

Indicaciones de método para el `plan-final.md`, cuando se planifique:

- Reparto: un agente de solo lectura por área, en paralelo, con el mismo
  formato de fila. El coordinador consolida y verifica.
- Si el plan estima más de una hora de punta a punta, la tarea se trocea
  por áreas con `taskctl trocear`. Cada trozo deja su parte de
  `docs/auditoria-4d.md` y sus tareas de seguimiento.
- Sin ruido: solo casos con evidencia reproducible. Una duplicación se
  reporta nombrando la incoherencia que produciría tocar una copia y no la
  otra.

Crea solo esta tarea. No la planifiques ni la empieces. Enséñame su
`tarea.md` y el ID que le ha tocado.
