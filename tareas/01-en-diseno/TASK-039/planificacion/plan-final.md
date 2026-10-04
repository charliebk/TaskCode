# Plan — TASK-039: Menos llamadas git en los comandos

**Desviacion documentada:** sin brainstorm; el diseno sale de la medicion con
`GIT_TRACE2_EVENT` hecha al planificar (en el Objetivo).

## Enfoque propuesto

- `src/fs/git-commit.ts` (`autoCommit`):
  - un solo `git add -A -- <rutas...>` con todas las rutas presentes, en vez de
    uno por ruta. Sigue acotado por pathspec: la regla 1 (nunca un `add -A`
    global) no cambia;
  - el commit con `-c maintenance.auto=false`: el mantenimiento automatico lo
    hara la siguiente operacion de Git de la persona;
  - un solo `git show --name-only --format=%h HEAD` para el SHA corto y los
    ficheros, en vez de `rev-parse --short` + `show`.
- Divergencia del criterio 1, documentada: la meta de 15 / 20 procesos no se
  alcanza sin tocar los scripts de Git-Flow (fuente de verdad, regla de la
  §7.1); se mide y se anota lo conseguido.

## Riesgos aceptados y que los contiene

- Con varias rutas en un solo `add`, si una falla falla el `add` entero; hoy
  ya se aborta en la primera que falle, asi que no cambia el desenlace.
- La segunda barrera de la sincronizacion (TASK-033) prepara las rutas de
  sincronizacion por separado y antes: se mantiene asi.

## Plan de pruebas

- Recuento con `GIT_TRACE2_EVENT` de todo el ciclo antes y despues.
- Suite de `git-commit`, `auto-commit`, `sincronizacion` y comandos, sin tocar
  expectativas.

## Lo que necesita decision de una persona

Nada: la divergencia del objetivo numerico queda medida y anotada.
