# Informe de revision — TASK-155 (ronda 1)

- Commit revisado: 8817288513a00e69968b5158767466b4c1f8b31e
- Revisor: code-quality-reviewer (general-purpose, sonnet)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|

Sin hallazgos.

Reproduccion empirica en un clon de la rama en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-155-r1`, Windows nativo. El clon quedo en 7fc713d, que solo anade la peticion y `tarea.md` sobre 8817288; el codigo de `src` y `test` es el mismo. `npm install` y `npm run build` sin errores.

- `node --test dist/test/integracion/plugin-instalado.test.js`: 4 tests, 4 pasan.
- `npm run test:rapido`: 696 tests, 696 pasan.
- Mutante: `comprobarSkillInstalado` en `dist` sustituido por el `spawnSync('claude', ...)` original sin shell. Los tests 3 (instalado) y 4 (no-instalado) pasan a rojo; 1 y 2 siguen verdes. Los tests discriminan: contra el codigo anterior el doble `claude.cmd` daba `no-verificable`.
- Entradas probadas con un `claude.cmd` de prueba como unico PATH, sobre el codigo real:
  - Funcionamiento normal: `instalado`.
  - Directorio con espacios, `&` y parentesis (`dir con espacios & (x)`): `instalado`. La ruta citada funciona.
  - stdout que no es JSON (`hola`): `no-verificable`.
  - `.cmd` que imprime el JSON pero sale con status 1: `no-verificable`.
  - stdout vacio: `no-verificable`.
  - Sin `claude` en el PATH: `no-verificable` sin lanzar nada (test existente, verde).
  - Timeout: el doble de `.cmd` lento volvio en menos de 300 ms con `no-verificable`, sin confirmar que se alcance el timeout de 5 s. Camino no verificado por el revisor; lo gestiona `interpretarResultadoPluginList` (`error` o `status` distinto de 0 da `no-verificable`), que no cambio.
- Observaciones que no son hallazgos:
  - Con shell, un timeout mata `cmd.exe`, pero puede quedar huerfano el proceso `claude` que este lanzo. No probado; de borde, y el modulo ya degrada a `no-verificable`.
  - Un `claude` sin extension o `.ps1` queda fuera; el plan lo declara en "Lo que el rol no cubrio".
  - El `claude.exe` real tarda unos 18 s y supera `TIMEOUT_MS`: fuera del alcance, como pedia el encargo.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts` (`localizarHerramienta`, `ejecutarHerramienta`, `pathDelProceso`, `candidatosEnPath`): el cambio delega en ellas el lanzamiento y la citacion de la ruta, y habia que revisar su contrato.
- `dist/test/integracion/plugin-instalado.test.js` y `dist/src/core/plugin-instalado.js` del clon temporal, solo para ejecutar y mutar.
- La carpeta del clon temporal se borro al terminar; el worktree original no se modifico.
