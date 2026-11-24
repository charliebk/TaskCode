# Plan — TASK-155: comprobarSkillInstalado verificable en Windows (claude.cmd)

(Modo rapido: plan redactado por quien coordina, sin brainstorm. Con un solo
rol no hay unificador ni desacuerdos que resolver; en su lugar, el plan senala
lo que no se cubre.)

## Enfoque propuesto

Duracion estimada: 30 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo, 1 de test, una capa)

`comprobarSkillInstalado` (`src/core/plugin-instalado.ts`) deja de lanzar
`spawnSync('claude', ...)` a ciegas y reutiliza lo que ya resuelve este mismo
problema para `doctor-deploy` en `src/fs/herramientas-deploy.ts`:

1. `localizarHerramienta('claude', pathDelProceso())` recorre el PATH con
   PATHEXT (via `candidatosEnPath`). Si no hay `claude`, `no-verificable` sin
   lanzar nada (igual que hoy, pero sin el subproceso).
2. `ejecutarHerramienta(ruta, ['plugin', 'list', '--json'], process.cwd(),
   pathDelProceso(), TIMEOUT_MS)` lanza la ruta encontrada; en Windows, si es
   un `.cmd`/`.bat`, pasa por el shell con la ruta entre comillas. Los
   argumentos son constantes sin caracteres especiales, asi que no hay
   inyeccion posible.
3. Su resultado se traduce a la forma que ya recibe
   `interpretarResultadoPluginList` (error de lanzamiento o timeout ->
   `error`; `status`; `stdout`), que no cambia.

`core` importando de `fs/` tiene precedente (`coste-transcripcion.ts`) y este
fichero ya es la excepcion declarada de E/S en core (TASK-148d).

## Lo que el rol no cubrio

- Un `claude` que sea un `.ps1` (PATHEXT no lo incluye por defecto): queda
  fuera; el instalador oficial deja `.cmd`/`.exe`.

## Riesgos aceptados y que los contiene

- Con shell, un `.cmd` que no arranca no da ENOENT sino status != 0: igual
  colapsa a `no-verificable`, que es el comportamiento seguro del modulo.
- `ejecutarHerramienta` anade `NO_COLOR` y variables de dotnet al entorno:
  inocuas para `claude plugin list --json`.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1 y 2: en `test/integracion/plugin-instalado.test.ts`, un doble de
  `claude` en un directorio temporal (en Windows `claude.cmd` con `@echo` del
  JSON; fuera, un script `sh` con permiso de ejecucion) puesto como unico PATH:
  un test con el id presente (`instalado`) y otro con un id distinto
  (`no-instalado`). Se comprueba a mano que contra el codigo anterior el de
  `instalado` da `no-verificable` en Windows (mutacion).
- El test existente de PATH vacio sigue cubriendo `no-verificable`.
- Criterio 3: `RAMA_BASE=develop node scripts/verificar-impacto.mjs`.

## Lo que necesita decision de una persona

Nada.
