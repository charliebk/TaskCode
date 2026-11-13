# Plan — TASK-117: P-9: new propone la complejidad a partir de tareas parecidas ya cerradas

(Modo rapido: tarea pequena, el plan lo redacta el coordinador sin lanzar el
rol de brainstorm ni unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 50 min (de la rama abierta al cierre con merge; senales: 3 ficheros de codigo, 2 de tests, 3 criterios)

1. `src/core/complejidad-similar.ts` (puro, sin disco): `proponerComplejidad(etiquetas, terminadas)`.
   De las terminadas con complejidad declarada, se quedan las que comparten MAS
   etiquetas con la nueva (el maximo, si es al menos 1); devuelve la mediana de
   sus complejidades en el orden `trivial < simple < media < alta < critica` y
   los IDs de los que sale. Con un numero par de parecidas, la mediana es la
   inferior de las dos centrales (la mas barata: la heuristica del plan puede
   subirla). Sin etiquetas, sin terminadas con complejidad o sin ninguna
   etiqueta en comun: null (como hoy).
2. `src/commands/new.ts`: si no se paso `--complejidad`, lee las terminadas
   (`listTareasEnEstados(['terminada'])`, despues del guard de rama, antes de
   escribir), y si hay propuesta la escribe en la tarea. El resultado lleva
   `complejidadPropuesta: { valor, desde: string[] } | null`.
3. `src/cli.ts`: lo dice al crear: `Complejidad propuesta: media (mediana de
   TASK-010, TASK-012 por etiquetas en comun). Cambiala en tarea.md si no encaja.`
4. Documentarlo en `skills/new/SKILL.md` (una linea).

## Lo que el rol no cubrio

No se lanzo rol. No se pondera por recencia ni por tokens reales (eso es P-9
completo con metricas): esta tarea solo usa etiquetas y la complejidad declarada.

## Riesgos aceptados y que los contiene

- Etiquetas genericas (`urgente`, `v0.16`) agrupan tareas de distinta talla: la
  propuesta se dice con sus fuentes y la persona la cambia en tarea.md; el plan
  puede subirla con la heuristica.
- Una terminada con frontmatter ilegible se ignora (no aborta `new`).

## Plan de pruebas

- Unitarias del core: maximo de etiquetas en comun, mediana impar y par, sin
  etiquetas, sin complejidad declarada, sin coincidencias.
- Repo temporal: `new` sin `--complejidad` escribe la propuesta y dice de que
  tareas sale; con `--complejidad` gana la declarada; sin parecidas queda null.
- `test:rapido` y `verificar-impacto`.

## Lo que necesita decision de una persona

Nada (la regla de la mediana par queda escrita arriba).
