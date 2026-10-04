# Plan — TASK-041: taskctl new con objetivo y criterios

**Desviacion documentada:** sin brainstorm; el diseno esta en
`docs/auditoria/PLAN-SOLUCION-2026-10-03.md` (F4-T1).

## Enfoque propuesto

- `src/commands/new.ts`: `--objetivo "<texto>"` y `--criterio "<texto>"`
  (repetible). Como `parseArgs` se queda con el ultimo valor de un flag
  repetido, se extraen antes de parsear, igual que `extraerPushFlag`.
  Aceptan tambien la forma `--criterio=<texto>`.
- `--desde <fichero>`: lee el markdown y toma `## Objetivo` y `## Criterios de
  aceptacion` con `extraerSecciones` (el mismo parser que `plan`). Sin esas
  secciones, el fichero entero es el Objetivo. No se combina con `--objetivo`
  ni `--criterio` (ambiguo: error). El fichero se lee ANTES del guard de rama:
  si vive dentro del repo sin commitear, el guard de workspace sucio aborta
  como hoy; el mensaje de ayuda lo dice.
- El cuerpo se compone en un solo sitio: `## Objetivo` + texto y
  `## Criterios de aceptacion` + un `- [ ] ` por criterio. Sin ninguno de los
  flags, `DEFAULT_BODY` de siempre.
- Validacion: valores vacios en `--objetivo`/`--criterio` abortan.
- Ayuda de `taskctl` y skill actualizadas.

## Riesgos aceptados y que los contiene

- Saltos de linea en `--objetivo` desde la shell: se conservan tal cual.

## Plan de pruebas

- `new --objetivo X --criterio A --criterio B`: tarea con esas dos secciones y
  los dos criterios, en el mismo commit `chore(TASK-NNN): tarea creada`.
- `--desde` con un fichero con secciones y con uno sin ellas; `--desde` con
  `--criterio` aborta; fichero inexistente aborta sin escribir nada.
- Sin flags, cuerpo identico al de antes.

## Lo que necesita decision de una persona

Nada.
