# Plan — TASK-042: F4-T4 Complejidad por defecto por heuristica y un rol sin unificador

Un solo rol (arquitectura, `brainstorm/salida-brainstorm-arquitectura-1.md`).
Aplicando ya la decision C4 a mano: sin unificador, este plan lo redacta el
orquestador a partir de esa salida.

## Enfoque propuesto

1. **«No declarada» es `complejidad: null`** (patron de `asignado_a` y
   `regla_seleccion_skill`). `task.ts` usa `requireNullableEnum`, que acepta
   `null` y la clave ausente: los `tarea.md` existentes se leen sin migrar.
   `new` e `import` dejan de poner `media` por defecto: sin `--complejidad`,
   `null`. Se descarta `auto` (seria un nivel falso que cada `switch` tendria
   que excluir a mano sin ayuda del compilador).
2. **Heuristica** (`resolverNumeroAgentes`): con `null` decide solo la
   heuristica (con el tope por tipo de siempre); con valor declarado, el
   maximo de hoy, sin cambios. Con `null` no hay discrepancia que mostrar.
   Los consumidores del tipo (`plan-brainstorm.ts`, `cli.ts`,
   `state-machine.ts`) se ajustan: «no declarada: decide la heuristica».
3. **Con 1 rol no hay unificador.** `plan` escribe una unica
   `peticion-plan-<ronda>.md`: la pregunta del rol, lo que mira y lo que no,
   y la orden de escribir `plan-final.md` con las secciones de siempre. No se
   escribe `peticion-<rol>`, ni `salida-<rol>`, ni `peticion-unificador`. Esa
   peticion es tambien el testigo de ronda: `RONDA_UNIFICADOR_RE` admite
   `peticion-(unificador|plan)-N.md`, asi las carpetas antiguas siguen
   valiendo.
4. **Ronda 2 o siguientes con 1 rol**: se regenera `peticion-plan-<ronda>` con
   el bloque de re-planificacion (leer el plan vigente e incorporar el
   feedback). El rol es el autor del plan, asi que relanzarlo es la correccion
   incremental.
5. **0 roles y 2 o mas**: sin cambios.

## Lo que el rol no cubrio

- La skill `task-workflow` y los `agents/brainstorm-*.md` describen «roles y
  luego el unificador»: hay que decir que con 1 rol no lo hay. Ninguno puede
  mencionar TaskCode (hay tests que lo comprueban).
- El mensaje del CLI tras `plan` («lanza cada peticion y luego el
  unificador») cambia con 1 rol.

## Riesgos aceptados y que los contiene

- Los `tarea.md` existentes con `media` puesto por el default antiguo no se
  tocan: no se distingue de un `media` declarado. Las tareas nuevas ya nacen
  con `null`.
- Bajar de 2 roles (con salidas en disco) a 1: si en la ronda reutilizable
  hay 2 o mas salidas, se mantiene el unificador para no ignorarlas (regla
  del rol). Hay un test que lo cubre (l.1154).

## Plan de pruebas

- `task.test.ts`: `complejidad: null` y la clave ausente se leen.
- `new.test.ts` e `import.test.ts`: sin flag escriben `null`; con flag, el
  valor declarado.
- `heuristica.test.ts`: con `null` el numero de agentes es el de la
  heuristica, tambien cuando es menor que el antiguo `media`.
- `plan-brainstorm.test.ts`: con 1 rol se escribe exactamente
  `peticion-plan-1.md`, sin unificador ni salida; la ronda 2 escribe
  `peticion-plan-2.md` con el bloque de re-planificacion; una carpeta antigua
  con `peticion-unificador-N` sigue contando como ronda. Cada expectativa
  cambiada lleva su motivo en un comentario.
- Mutantes: volver a escribir el unificador con 1 rol; quitar `plan` del
  testigo; volver a poner `media` por defecto.

## Lo que necesita decision de una persona

Nada nuevo: la decision C4 ya esta aprobada.
